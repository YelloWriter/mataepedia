import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chatRooms = sqliteTable("chat_rooms", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  creatorName: text("creator_name").notNull(),
  creatorKeyHash: text("creator_key_hash").notNull(),
  storyYear: integer("story_year").notNull(),
  storyDate: text("story_date"),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastMessageAt: text("last_message_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("chat_rooms_status_activity_idx").on(table.status, table.lastMessageAt)]);

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => chatRooms.id),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("chat_messages_room_created_idx").on(table.roomId, table.createdAt)]);

export const roomPresence = sqliteTable("room_presence", {
  sessionId: text("session_id").primaryKey(),
  roomId: text("room_id").notNull().references(() => chatRooms.id),
  displayName: text("display_name").notNull(),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("room_presence_room_seen_idx").on(table.roomId, table.lastSeenAt)]);

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["diary", "memo", "guestbook", "rumor"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  storyDate: text("story_date").notNull(),
  category: text("category").notNull().default(""),
  imageDataUrl: text("image_data_url"),
  ownerKeyHash: text("owner_key_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("records_story_date_idx").on(table.storyDate, table.createdAt)]);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull(),
  parentId: text("parent_id"),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  storyYear: integer("story_year").notNull().default(2011),
  ownerKeyHash: text("owner_key_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("comments_section_created_idx").on(table.sectionId, table.createdAt)]);

export const timelineEvents = sqliteTable("timeline_events", {
  id: text("id").primaryKey(),
  storyYear: integer("story_year").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  ownerKeyHash: text("owner_key_hash").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("timeline_events_year_created_idx").on(table.storyYear, table.createdAt)]);

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  storyYear: integer("story_year").notNull().default(2011),
  imageDataUrl: text("image_data_url"),
  changedSince2011: text("changed_since_2011").notNull().default(""),
  keepsake2011: text("keepsake_2011").notNull().default(""),
  traumaImpact: text("trauma_impact").notNull().default(""),
  appearanceChange: text("appearance_change").notNull().default(""),
  grades: text("grades").notNull().default(""),
  memorableEvent: text("memorable_event").notNull().default(""),
  fearOrHabit: text("fear_or_habit").notNull().default(""),
  ownerKeyHash: text("owner_key_hash").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("characters_sort_order_idx").on(table.sortOrder, table.name)]);
