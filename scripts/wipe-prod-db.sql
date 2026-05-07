-- Full prod D1 wipe + re-seed. Idempotent. Self-applies migration 0006
-- (white_label + legal_docs) up-front so this also works if wrangler's
-- migration tracker barfs.
--
-- Run via:
--   cd apps/web && bunx wrangler d1 execute howlcast-db --remote --file=../../scripts/wipe-prod-db.sql
--
-- After this runs, /setup will be unlocked and ready to create a fresh
-- broadcaster account.

-- Migration 0006 (idempotent — safe to run even if already applied).
CREATE TABLE IF NOT EXISTS `white_label` (
  `id` text PRIMARY KEY DEFAULT 'site' NOT NULL,
  `custom_logo_key` text,
  `custom_platform_name` text,
  `footer_attribution` text DEFAULT 'default' NOT NULL,
  `custom_footer_text` text,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS `legal_docs` (
  `id` text PRIMARY KEY NOT NULL,
  `body_html` text NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

-- Wipe. Tables that don't FK off user go first. Then DELETE FROM "user"
-- cascades to: profiles, session, account, passkey, twoFactor (whichever
-- of those exist — better-auth creates these lazily).
DELETE FROM stream_sessions;
DELETE FROM panels;
DELETE FROM invites;
DELETE FROM webhooks;
DELETE FROM user_bans;
DELETE FROM legal_docs;
DELETE FROM white_label;
DELETE FROM channel_config;
DELETE FROM verification;
DELETE FROM "user";

-- Re-seed white_label + legal_docs (matches migration 0006 INSERTs).
INSERT INTO white_label (id, footer_attribution) VALUES ('site', 'default');

INSERT INTO legal_docs (id, body_html) VALUES (
  'privacy',
  '<div class="howlcast-legal-banner"><strong>⚠ Placeholder text.</strong> This was auto-generated. Review and customize before going live with real users.</div><h2>Operator</h2><p>HowlCast is operated by <strong>MrDemonWolf, Inc.</strong> Contact: legal@mrdemonwolf.com.</p><h2>What we collect</h2><ul><li>Account: email, display name, username, hashed password.</li><li>Auth: passkeys (public keys only), 2FA secrets, session cookies.</li><li>Chat: messages you send via the embedded chat (stored by GetStream).</li><li>Stream metadata: when streams started/ended, total minutes (no recordings).</li><li>Operational logs: IP, user agent, request paths — kept ≤ 30 days.</li></ul><h2>What we don''t collect</h2><ul><li>No video recordings. HowlCast is live-only, no VODs.</li><li>No third-party trackers, ad networks, or behavioural analytics.</li><li>No payment data — HowlCast is invite-only and free to viewers.</li></ul><h2>Sub-processors</h2><ul><li><strong>Cloudflare</strong> — hosting, DNS, edge compute, D1 database.</li><li><strong>GetStream</strong> — live video transport, chat messaging, moderation tools.</li><li><strong>Resend</strong> — magic-link and invite email delivery.</li><li><strong>Twitch Helix</strong> — read-only emote and channel lookup at setup time.</li></ul><h2>Your rights</h2><p>You can request a copy of your data, correct it, or have it deleted by emailing legal@mrdemonwolf.com.</p>'
);

INSERT INTO legal_docs (id, body_html) VALUES (
  'terms',
  '<div class="howlcast-legal-banner"><strong>⚠ Placeholder text.</strong> This was auto-generated. Review and customize before going live with real users.</div><h2>Acceptance</h2><p>By using HowlCast you agree to these terms. If you don''t agree, don''t use the service.</p><h2>Account and access</h2><p>HowlCast is invite-only. The broadcaster controls who receives invites; viewers without an invite can watch but not post.</p><h2>Acceptable use</h2><ul><li>No harassment, hate speech, or threats.</li><li>No illegal content.</li><li>No spam, scams, scraping, or automated abuse.</li><li>No attempt to disrupt the service.</li></ul><h2>Content ownership</h2><p>You keep the rights to anything you post. By posting in chat you grant HowlCast a non-exclusive license to display your messages within the channel for as long as the channel exists.</p><h2>Service availability</h2><p>HowlCast is provided "as is" with no uptime guarantee.</p><h2>Termination</h2><p>You can delete your account anytime by emailing legal@mrdemonwolf.com.</p>'
);
