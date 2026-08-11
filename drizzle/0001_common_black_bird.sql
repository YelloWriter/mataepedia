CREATE INDEX `characters_sort_order_idx` ON `characters` (`sort_order`,`name`);--> statement-breakpoint
CREATE INDEX `chat_messages_room_created_idx` ON `chat_messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `chat_rooms_status_activity_idx` ON `chat_rooms` (`status`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `comments_section_created_idx` ON `comments` (`section_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `records_story_date_idx` ON `records` (`story_date`,`created_at`);--> statement-breakpoint
CREATE INDEX `room_presence_room_seen_idx` ON `room_presence` (`room_id`,`last_seen_at`);--> statement-breakpoint
CREATE INDEX `timeline_events_year_created_idx` ON `timeline_events` (`story_year`,`created_at`);
