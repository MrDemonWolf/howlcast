// Account — any signed-in user editing their OWN profile + sessions.
// Distinct from admin.updateProfile which is broadcaster-only and edits
// the public-facing broadcaster profile (same row, different surface area).
//
// Single-tenant note: profiles is keyed by user.id, so "edit my profile"
// always means "edit my own row" regardless of role.

import { profiles, session, user } from "@howlcast/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const accountRouter = router({
	// Returns the signed-in user's profile + base account fields.
	me: protectedProcedure.query(async ({ ctx }) => {
		const db = ctx.db;
		const u = await db
			.select({
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			})
			.from(user)
			.where(eq(user.id, ctx.session.user.id))
			.get();
		const p = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, ctx.session.user.id))
			.get();
		if (!u) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Account missing." });
		}
		return {
			id: u.id,
			email: u.email,
			createdAt: u.createdAt?.getTime() ?? null,
			profile: p
				? {
						displayName: p.displayName,
						bio: p.bio,
						pronouns: p.pronouns,
						role: p.role,
						isInvited: p.isInvited,
					}
				: null,
		};
	}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				displayName: z.string().min(1).max(40).optional(),
				bio: z.string().max(500).nullable().optional(),
				pronouns: z.string().max(40).nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const patch: Partial<typeof profiles.$inferInsert> = {};
			if (input.displayName !== undefined) patch.displayName = input.displayName.trim();
			if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;
			if (input.pronouns !== undefined) patch.pronouns = input.pronouns?.trim() || null;
			await db.update(profiles).set(patch).where(eq(profiles.userId, ctx.session.user.id));
			return { ok: true };
		}),

	listSessions: protectedProcedure.query(async ({ ctx }) => {
		const db = ctx.db;
		const rows = await db
			.select({
				id: session.id,
				createdAt: session.createdAt,
				expiresAt: session.expiresAt,
				ipAddress: session.ipAddress,
				userAgent: session.userAgent,
			})
			.from(session)
			.where(eq(session.userId, ctx.session.user.id))
			.orderBy(desc(session.createdAt))
			.all();
		const currentSessionId = ctx.session.session.id;
		return rows.map((r) => ({
			id: r.id,
			createdAt: r.createdAt?.getTime() ?? null,
			expiresAt: r.expiresAt?.getTime() ?? null,
			ipAddress: r.ipAddress ?? null,
			userAgent: r.userAgent ?? null,
			isCurrent: r.id === currentSessionId,
		}));
	}),

	revokeSession: protectedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			// Scope to the calling user's sessions only — never revoke someone
			// else's row even if a sessionId leaks.
			await db
				.delete(session)
				.where(and(eq(session.id, input.sessionId), eq(session.userId, ctx.session.user.id)));
			return { ok: true };
		}),

	deleteMe: protectedProcedure.mutation(async ({ ctx }) => {
		const db = ctx.db;
		// profiles + sessions cascade via FK onDelete in the schema.
		// Broadcasters cannot delete their account this way — they must transfer
		// channelConfig.ownerId first or the channel gets stranded.
		const me = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.userId, ctx.session.user.id))
			.get();
		if (me?.role === "broadcaster") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Broadcaster account cannot self-delete. Contact support.",
			});
		}
		await db.delete(user).where(eq(user.id, ctx.session.user.id));
		return { ok: true };
	}),
});
