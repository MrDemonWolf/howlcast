-- Drop unused user_bans table. Broadcaster moderates via GetStream tools;
-- no router writes or reads the row. Will reintroduce post-launch if/when
-- DB-backed re-ban-on-reconnect lands.
DROP TABLE IF EXISTS `user_bans`;
--> statement-breakpoint
-- Indexes for invites listing + future expiration sweeps.
CREATE INDEX `invites_created_at_idx` ON `invites` (`created_at`);
--> statement-breakpoint
CREATE INDEX `invites_expires_at_idx` ON `invites` (`expires_at`);
