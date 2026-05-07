CREATE TABLE `stream_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`peak_viewers` integer DEFAULT 0 NOT NULL,
	`total_minutes` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stream_sessions_started_idx` ON `stream_sessions` (`started_at`);--> statement-breakpoint
ALTER TABLE `channel_config` ADD `rtmps_url` text;