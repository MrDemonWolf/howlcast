-- Phase 6 own-analytics: viewer + chat tracking via GetStream webhooks.
-- Adds chat_message_count to stream_sessions, plus two new tables that
-- power the per-session detail page (line chart + per-minute bars).

ALTER TABLE `stream_sessions` ADD `chat_message_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE `stream_viewer_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sampled_at` integer NOT NULL,
	`viewer_count` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `svs_session_idx` ON `stream_viewer_snapshots` (`session_id`,`sampled_at`);
--> statement-breakpoint
CREATE TABLE `stream_chat_minutes` (
	`session_id` text NOT NULL,
	`minute_bucket_ms` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY (`session_id`, `minute_bucket_ms`),
	FOREIGN KEY (`session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
