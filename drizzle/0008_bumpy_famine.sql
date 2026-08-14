CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);--> statement-breakpoint
INSERT INTO `site_settings` (`key`, `value`) VALUES (
	'home_notice',
	'선생님들이랑 마을 사람들에게는 들키지 말자, 우리.'
);--> statement-breakpoint
PRAGMA optimize;
