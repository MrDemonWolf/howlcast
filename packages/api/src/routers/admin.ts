// Admin/dashboard-only mutations: webhooks, invites, profile edits.
// Kept separate from the public channel router to avoid bloating it
// and to make the broadcaster surface area easy to scan.

import { sendMail } from "@howlcast/mail";
import { createDb } from "@howlcast/db";
import { channelConfig, invites, profiles, webhooks } from "@howlcast/db/schema";
import { env } from "@howlcast/env/server";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const SITE_ID = "site";

async function assertBroadcaster(userId: string) {
	const db = createDb();
	const cfg = await db.select().from(channelConfig).where(eq(channelConfig.id, SITE_ID)).get();
	if (!cfg || cfg.ownerId !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Broadcaster only." });
	}
	return cfg;
}

export const adminRouter = router({
	// ─── Discord webhooks ──────────────────────────────────────────────

	listWebhooks: protectedProcedure.query(async ({ ctx }) => {
		await assertBroadcaster(ctx.session.user.id);
		const db = createDb();
		const rows = await db.select().from(webhooks).all();
		const byId = new Map(rows.map((r) => [r.id, r]));
		// Always return both rows (public + private) — UI renders empty
		// fields for the absent ones so the broadcaster can fill them in.
		return ["public", "private"].map((id) => {
			const r = byId.get(id);
			return {
				id,
				url: r?.url ?? null,
				notifyOnLive: r?.notifyOnLive ?? true,
				notifyOnEnd: r?.notifyOnEnd ?? true,
				lastFiredAt: r?.lastFiredAt ? r.lastFiredAt.getTime() : null,
				lastError: r?.lastError ?? null,
			};
		});
	}),

	upsertWebhook: protectedProcedure
		.input(
			z.object({
				id: z.enum(["public", "private"]),
				url: z.string().url().nullable(),
				notifyOnLive: z.boolean(),
				notifyOnEnd: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			const existing = await db.select().from(webhooks).where(eq(webhooks.id, input.id)).get();
			if (existing) {
				await db
					.update(webhooks)
					.set({
						url: input.url,
						notifyOnLive: input.notifyOnLive,
						notifyOnEnd: input.notifyOnEnd,
						lastError: null,
					})
					.where(eq(webhooks.id, input.id));
			} else {
				await db.insert(webhooks).values({
					id: input.id,
					url: input.url,
					notifyOnLive: input.notifyOnLive,
					notifyOnEnd: input.notifyOnEnd,
				});
			}
			return { ok: true };
		}),

	// ─── Invites ────────────────────────────────────────────────────────

	createInvite: protectedProcedure
		.input(z.object({ email: z.string().email() }))
		.mutation(async ({ ctx, input }) => {
			const cfg = await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			const code = crypto.randomUUID();
			const now = new Date();
			const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			await db.insert(invites).values({
				code,
				createdBy: ctx.session.user.id,
				maxUses: 1,
				useCount: 0,
				expiresAt: expires,
				createdAt: now,
			});
			const url = `${env.BETTER_AUTH_URL.replace(/^https?:\/\/api\./, "https://").replace(/\/$/, "")}/invite/${code}`;
			await sendMail(
				{
					RESEND_API_KEY: env.RESEND_API_KEY,
					SMTP_URL: env.SMTP_URL,
					MAIL_FROM: env.MAIL_FROM,
				},
				{
					to: input.email,
					subject: `You're invited to ${cfg.title ?? "the den"}`,
					html: `<p>You've been invited to join an invite-only HowlCast den.</p><p><a href="${url}">Accept your invite</a></p><p>This link expires in 30 days.</p>`,
					text: `You've been invited to join an invite-only HowlCast den. Accept here: ${url}\n\nThis link expires in 30 days.`,
				},
			);
			return { ok: true, code };
		}),

	listInvites: protectedProcedure.query(async ({ ctx }) => {
		await assertBroadcaster(ctx.session.user.id);
		const db = createDb();
		const rows = await db.select().from(invites).orderBy(desc(invites.createdAt)).all();
		return rows.map((r) => ({
			code: r.code,
			usedBy: r.usedBy,
			usedAt: r.usedAt ? r.usedAt.getTime() : null,
			expiresAt: r.expiresAt ? r.expiresAt.getTime() : null,
			useCount: r.useCount,
			createdAt: r.createdAt ? r.createdAt.getTime() : 0,
		}));
	}),

	// Public — called from /invite/[code]. If the visitor is signed in,
	// flips their isInvited flag and marks the invite used. If not, returns
	// the invite metadata so the page can show a magic-link sign-in form.
	acceptInvite: protectedProcedure
		.input(z.object({ code: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const db = createDb();
			const inv = await db.select().from(invites).where(eq(invites.code, input.code)).get();
			if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
			if (inv.usedAt) throw new TRPCError({ code: "CONFLICT", message: "Already accepted." });
			if (inv.expiresAt && inv.expiresAt < new Date()) {
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Invite has expired." });
			}
			const now = new Date();
			await db
				.update(profiles)
				.set({ isInvited: true, invitedAt: now, invitedBy: inv.createdBy })
				.where(eq(profiles.userId, ctx.session.user.id));
			await db
				.update(invites)
				.set({ usedBy: ctx.session.user.id, usedAt: now, useCount: inv.useCount + 1 })
				.where(eq(invites.code, input.code));
			return { ok: true };
		}),

	revokeInvite: protectedProcedure
		.input(z.object({ code: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			await db.delete(invites).where(eq(invites.code, input.code));
			return { ok: true };
		}),

	// ─── Broadcaster profile ───────────────────────────────────────────

	updateProfile: protectedProcedure
		.input(
			z.object({
				displayName: z.string().min(1).max(40).optional(),
				bio: z.string().max(500).nullable().optional(),
				pronouns: z.string().max(40).nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = createDb();
			await db
				.update(profiles)
				.set({
					...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
					...(input.bio !== undefined ? { bio: input.bio } : {}),
					...(input.pronouns !== undefined ? { pronouns: input.pronouns } : {}),
				})
				.where(eq(profiles.userId, ctx.session.user.id));
			return { ok: true };
		}),
});
