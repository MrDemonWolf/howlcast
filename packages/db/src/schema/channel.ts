import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

// HowlCast is single-tenant. There are exactly two roles: broadcaster + viewer.
// `is_invited` is the single permission flag — replaces all tier/sub logic.
// Invited viewers can: post in chat (always), watch private streams.
export const profiles = sqliteTable(
	"profiles",
	{
		userId: text("user_id")
			.primaryKey()
			.references(() => user.id, { onDelete: "cascade" }),
		displayName: text("display_name").notNull(),
		bio: text("bio"),
		pronouns: text("pronouns"),
		// R2 keys (bucket: howlcast-public)
		avatarKey: text("avatar_key"),
		bannerKey: text("banner_key"),
		verified: integer("verified", { mode: "boolean" }).default(false).notNull(),
		role: text("role", { enum: ["broadcaster", "viewer"] })
			.notNull()
			.default("viewer"),
		isInvited: integer("is_invited", { mode: "boolean" }).default(false).notNull(),
		invitedAt: integer("invited_at", { mode: "timestamp_ms" }),
		invitedBy: text("invited_by"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(t) => [index("profiles_role_idx").on(t.role), index("profiles_invited_idx").on(t.isInvited)],
);

// Channel config — single row, id = "site". Single-tenant install.
// `setupCompletedAt` flips when the first-run wizard finishes (Phase 6).
// Phase 3 only touches: ownerId, title, visibility, liveStartedAt/EndedAt,
// streamCallId, chatChannelCid, broadcasterTwitchId.
export const channelConfig = sqliteTable("channel_config", {
	id: text("id").primaryKey().default("site"),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id),
	title: text("title"),
	visibility: text("visibility", { enum: ["public", "invite_only"] })
		.notNull()
		.default("public"),
	matureContent: integer("mature", { mode: "boolean" }).default(false).notNull(),
	liveStartedAt: integer("live_started_at", { mode: "timestamp_ms" }),
	liveEndedAt: integer("live_ended_at", { mode: "timestamp_ms" }),
	// GetStream identifiers — set when the stream is created
	streamCallId: text("stream_call_id"),
	chatChannelCid: text("chat_channel_cid"),
	// RTMPS ingress URL — captured from createCall response (ingress.rtmp.address)
	// so OBS gets the canonical server URL the API actually expects, not a guess.
	rtmpsUrl: text("rtmps_url"),
	// Twitch identity — seed for emote pipeline + profile defaults (Phase 6 wizard)
	broadcasterTwitchId: text("broadcaster_twitch_id"),
	setupCompletedAt: integer("setup_completed_at", { mode: "timestamp_ms" }),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

// Channel panels — drag/edit/add/delete in dashboard. Markdown body.
export const panels = sqliteTable(
	"panels",
	{
		id: text("id").primaryKey(),
		position: integer("position").notNull(),
		title: text("title"),
		body: text("body"),
		imageKey: text("image_key"),
		linkUrl: text("link_url"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(t) => [index("panels_position_idx").on(t.position)],
);

// Invite codes. Accepting one always sets `profiles.isInvited = true`.
// No tier preassignment — single permission flag.
export const invites = sqliteTable("invites", {
	code: text("code").primaryKey(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	usedBy: text("used_by").references(() => user.id),
	usedAt: integer("used_at", { mode: "timestamp_ms" }),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
	maxUses: integer("max_uses").notNull().default(1),
	useCount: integer("use_count").notNull().default(0),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
});

// Discord webhooks — two rows, ids = 'public' | 'private'. Configured from
// Dashboard → Channel → Notifications. Fired on stream.online / stream.offline.
export const webhooks = sqliteTable("webhooks", {
	id: text("id").primaryKey(),
	url: text("url"),
	notifyOnLive: integer("notify_on_live", { mode: "boolean" }).default(true).notNull(),
	notifyOnEnd: integer("notify_on_end", { mode: "boolean" }).default(true).notNull(),
	lastFiredAt: integer("last_fired_at", { mode: "timestamp_ms" }),
	lastError: text("last_error"),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

// Stream sessions — one row per live session, written by the GetStream
// webhook handler on call.live_started (insert) + call.session_ended /
// call.ended (update endedAt + totalMinutes). Powers Phase 6 stats.
export const streamSessions = sqliteTable(
	"stream_sessions",
	{
		id: text("id").primaryKey(),
		callId: text("call_id"),
		startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
		endedAt: integer("ended_at", { mode: "timestamp_ms" }),
		peakViewers: integer("peak_viewers").default(0).notNull(),
		totalMinutes: integer("total_minutes").default(0).notNull(),
	},
	(t) => [index("stream_sessions_started_idx").on(t.startedAt)],
);

// White-label settings — single row, id='site'. Lets the broadcaster (or
// anyone forking this) override the platform branding without touching code.
// Logos live in R2 at `branding/logo-{hash}.{ext}` keyed by `customLogoKey`.
export const whiteLabel = sqliteTable("white_label", {
	id: text("id").primaryKey().default("site"),
	customLogoKey: text("custom_logo_key"),
	customPlatformName: text("custom_platform_name"),
	footerAttribution: text("footer_attribution", {
		enum: ["default", "custom", "off"],
	})
		.notNull()
		.default("default"),
	customFooterText: text("custom_footer_text"),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

// Legal docs — two rows, ids = 'privacy' | 'terms'. Sanitized HTML written
// from the Tiptap editor in /dashboard/branding. Public reads at /privacy
// and /terms render this directly via dangerouslySetInnerHTML (sanitization
// happens at write time, never at read).
export const legalDocs = sqliteTable("legal_docs", {
	id: text("id").primaryKey(),
	bodyHtml: text("body_html").notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

// Per-user bans — broadcaster handles all moderation directly via GetStream's
// built-in tools, but a row here is the source of truth for re-banning if a
// chat session resets.
export const userBans = sqliteTable("user_bans", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	reason: text("reason"),
	bannedBy: text("banned_by")
		.notNull()
		.references(() => user.id),
	bannedAt: integer("banned_at", { mode: "timestamp_ms" }).notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
});
