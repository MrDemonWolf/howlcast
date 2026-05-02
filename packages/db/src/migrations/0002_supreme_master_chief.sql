CREATE TABLE `channel_config` (
	`id` text PRIMARY KEY DEFAULT 'site' NOT NULL,
	`owner_id` text NOT NULL,
	`title` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`mature` integer DEFAULT false NOT NULL,
	`live_started_at` integer,
	`live_ended_at` integer,
	`stream_call_id` text,
	`chat_channel_cid` text,
	`broadcaster_twitch_id` text,
	`setup_completed_at` integer,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`code` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`used_by` text,
	`used_at` integer,
	`expires_at` integer,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`used_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `panels` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`title` text,
	`body` text,
	`image_key` text,
	`link_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `panels_position_idx` ON `panels` (`position`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`bio` text,
	`pronouns` text,
	`avatar_key` text,
	`banner_key` text,
	`verified` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`is_invited` integer DEFAULT false NOT NULL,
	`invited_at` integer,
	`invited_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profiles_role_idx` ON `profiles` (`role`);--> statement-breakpoint
CREATE INDEX `profiles_invited_idx` ON `profiles` (`is_invited`);--> statement-breakpoint
CREATE TABLE `user_bans` (
	`user_id` text PRIMARY KEY NOT NULL,
	`reason` text,
	`banned_by` text NOT NULL,
	`banned_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`banned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text,
	`notify_on_live` integer DEFAULT true NOT NULL,
	`notify_on_end` integer DEFAULT true NOT NULL,
	`last_fired_at` integer,
	`last_error` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
