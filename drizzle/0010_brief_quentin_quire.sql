ALTER TABLE `comments` ADD `story_year` integer DEFAULT 2011 NOT NULL;--> statement-breakpoint
UPDATE `comments` SET `story_year` = 2011;--> statement-breakpoint
PRAGMA optimize;
