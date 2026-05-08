// White-label / branding tRPC router. Read paths are public so anonymous
// channel viewers see the customized logo + platform name. Write paths
// are broadcaster-only.
//
// Logo upload is handled by a multipart route on apps/server (not tRPC) so
// we can stream the bytes straight into R2 without buffering the whole file.

import { createDb } from "@howlcast/db";
import { legalDocs, whiteLabel } from "@howlcast/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { assertBroadcaster } from "../lib/broadcaster-guard";
import { sanitizeLegalHtml } from "../lib/sanitize-html";

const SITE_ID = "site";

async function loadWhiteLabel() {
	const db = createDb();
	const row = await db.select().from(whiteLabel).where(eq(whiteLabel.id, SITE_ID)).get();
	return row ?? null;
}

export const brandingRouter = router({
	// Public — read site-wide branding. Anonymous viewers, login page, OG
	// images all hit this. Defaults baked in here so the UI never sees null.
	get: publicProcedure.query(async () => {
		const row = await loadWhiteLabel();
		return {
			customLogoKey: row?.customLogoKey ?? null,
			platformName: row?.customPlatformName ?? "HowlCast",
			footerAttribution: row?.footerAttribution ?? "default",
			customFooterText: row?.customFooterText ?? null,
			updatedAt: row?.updatedAt?.getTime() ?? null,
		};
	}),

	update: protectedProcedure
		.input(
			z.object({
				customPlatformName: z.string().max(24).nullable().optional(),
				footerAttribution: z.enum(["default", "custom", "off"]).optional(),
				customFooterText: z.string().max(80).nullable().optional(),
				// Logo keys are minted server-side by /api/upload/logo. Pin the
				// shape so a broadcaster can't point this at arbitrary R2 keys.
				customLogoKey: z
					.string()
					.regex(/^branding\/logo-[a-f0-9]{16}\.(svg|png|jpg)$/)
					.nullable()
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const db = ctx.db;
			const patch: Record<string, unknown> = {};
			if (input.customPlatformName !== undefined) {
				patch.customPlatformName = input.customPlatformName?.trim() || null;
			}
			if (input.footerAttribution !== undefined) {
				patch.footerAttribution = input.footerAttribution;
			}
			if (input.customFooterText !== undefined) {
				patch.customFooterText = input.customFooterText?.trim() || null;
			}
			if (input.customLogoKey !== undefined) {
				patch.customLogoKey = input.customLogoKey;
			}
			// upsert — first run might not have the row yet (defensive; migration
			// seeds one but a wiped dev DB might miss it).
			const existing = await db
				.select({ id: whiteLabel.id })
				.from(whiteLabel)
				.where(eq(whiteLabel.id, SITE_ID))
				.get();
			if (existing) {
				await db.update(whiteLabel).set(patch).where(eq(whiteLabel.id, SITE_ID));
			} else {
				await db.insert(whiteLabel).values({ id: SITE_ID, ...patch });
			}
			return { ok: true };
		}),

	// Public — read sanitized legal HTML. Server components on /privacy and
	// /terms call this directly. We never re-sanitize on read; sanitization
	// is locked in at write time.
	getLegal: publicProcedure
		.input(z.object({ id: z.enum(["privacy", "terms"]) }))
		.query(async ({ ctx, input }) => {
			const row = await ctx.db.select().from(legalDocs).where(eq(legalDocs.id, input.id)).get();
			if (!row) {
				throw new TRPCError({ code: "NOT_FOUND", message: `Legal doc '${input.id}' missing.` });
			}
			return {
				id: row.id,
				bodyHtml: row.bodyHtml,
				updatedAt: row.updatedAt.getTime(),
			};
		}),

	updateLegal: protectedProcedure
		.input(
			z.object({
				id: z.enum(["privacy", "terms"]),
				bodyHtml: z.string().max(50_000),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertBroadcaster(ctx.session.user.id);
			const clean = await sanitizeLegalHtml(input.bodyHtml);
			const db = ctx.db;
			const existing = await db
				.select({ id: legalDocs.id })
				.from(legalDocs)
				.where(eq(legalDocs.id, input.id))
				.get();
			if (existing) {
				await db.update(legalDocs).set({ bodyHtml: clean }).where(eq(legalDocs.id, input.id));
			} else {
				await db.insert(legalDocs).values({ id: input.id, bodyHtml: clean });
			}
			return { ok: true };
		}),
});
