-- Drop the legacy `visibility` column from channel_config. HowlCast is
-- invite-only by design — every den is private, `profiles.is_invited` is
-- the per-user permission flag. Public-mode code paths removed across
-- the API, setup wizard, and dashboard.
ALTER TABLE `channel_config` DROP COLUMN `visibility`;
