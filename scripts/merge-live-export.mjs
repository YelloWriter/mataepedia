import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/merge-live-export.mjs <export.json> <output.sql>");
}

const ZERO_OWNER_HASH = "0".repeat(64);
const exported = JSON.parse(await readFile(inputPath, "utf8"));
const bootstrap = exported.bootstrap ?? {};

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function values(items) {
  return `(${items.map(sql).join(", ")})`;
}

const statements = [
  "PRAGMA defer_foreign_keys = ON;",
  "DELETE FROM room_presence;",
  "DELETE FROM timeline_events WHERE id = 'official-event-2015-mataepedia-reopened';",
];

for (const room of bootstrap.rooms ?? []) {
  const storyDate = room.storyDate || `${room.storyYear}-00-00`;
  statements.push(`INSERT INTO chat_rooms
    (id, title, description, creator_name, creator_key_hash, story_year, story_date, status, created_at, last_message_at)
    VALUES ${values([
      room.id,
      room.title,
      room.description ?? "",
      room.creatorName,
      ZERO_OWNER_HASH,
      room.storyYear,
      storyDate,
      room.status ?? "active",
      room.createdAt ?? "2011-12-31T23:59:00.000Z",
      room.lastMessageAt ?? room.createdAt ?? "2011-12-31T23:59:00.000Z",
    ])}
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      creator_name = excluded.creator_name,
      story_year = excluded.story_year,
      story_date = excluded.story_date,
      status = excluded.status,
      created_at = excluded.created_at,
      last_message_at = excluded.last_message_at;`);
}

const removedDefaultGuestbookId = "898b68ce-fba7-4a77-875e-e6e954dfe10f";
for (const record of bootstrap.records ?? []) {
  if (record.id === removedDefaultGuestbookId) continue;
  statements.push(`INSERT INTO records
    (id, kind, title, body, author_name, story_date, category, image_data_url,
     owner_key_hash, created_at, updated_at)
    VALUES ${values([
      record.id,
      record.kind,
      record.title,
      record.body,
      record.authorName,
      record.storyDate,
      record.category ?? "",
      record.imageDataUrl ?? null,
      ZERO_OWNER_HASH,
      record.createdAt ?? "2011-12-31T23:59:00.000Z",
      record.updatedAt ?? record.createdAt ?? "2011-12-31T23:59:00.000Z",
    ])}
    ON CONFLICT(id) DO UPDATE SET
      kind = excluded.kind,
      title = excluded.title,
      body = excluded.body,
      author_name = excluded.author_name,
      story_date = excluded.story_date,
      category = CASE WHEN excluded.category = '' THEN records.category ELSE excluded.category END,
      image_data_url = COALESCE(excluded.image_data_url, records.image_data_url),
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;`);
}

for (const event of bootstrap.timelineEvents ?? []) {
  statements.push(`INSERT INTO timeline_events
    (id, story_year, title, body, author_name, owner_key_hash, sort_order, created_at)
    VALUES ${values([
      event.id,
      event.storyYear,
      event.title,
      event.body,
      event.authorName || "마태피아 기록반",
      ZERO_OWNER_HASH,
      event.sortOrder ?? 10,
      event.createdAt ?? `${event.storyYear}-12-31T23:59:00.000Z`,
    ])}
    ON CONFLICT(id) DO UPDATE SET
      story_year = excluded.story_year,
      title = excluded.title,
      body = excluded.body,
      author_name = excluded.author_name,
      sort_order = excluded.sort_order,
      created_at = excluded.created_at;`);
}

for (const character of bootstrap.characters ?? []) {
  statements.push(`INSERT INTO characters
    (id, name, summary, description, story_year, image_data_url,
     changed_since_2011, keepsake_2011, trauma_impact, appearance_change,
     grades, memorable_event, fear_or_habit, owner_key_hash, sort_order, updated_at)
    VALUES ${values([
      character.id,
      character.name,
      character.summary ?? "",
      character.description ?? "",
      character.storyYear ?? 2011,
      character.imageDataUrl ?? null,
      character.changedSince2011 ?? "",
      character.keepsake2011 ?? "",
      character.traumaImpact ?? "",
      character.appearanceChange ?? "",
      character.grades ?? "",
      character.memorableEvent ?? "",
      character.fearOrHabit ?? "",
      ZERO_OWNER_HASH,
      character.sortOrder ?? 0,
      character.updatedAt ?? "2011-12-31T23:59:00.000Z",
    ])}
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      summary = excluded.summary,
      description = excluded.description,
      story_year = excluded.story_year,
      image_data_url = COALESCE(excluded.image_data_url, characters.image_data_url),
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at;`);
}

if (bootstrap.siteNotice?.body) {
  statements.push(`INSERT INTO site_settings (key, value, updated_at)
    VALUES ${values(["home_notice", bootstrap.siteNotice.body, bootstrap.siteNotice.updatedAt ?? "2011-12-31T23:59:00.000Z"])}
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`);
}

const commentSections = Object.entries(exported.commentsBySection ?? {});
if (commentSections.length) {
  statements.push(`DELETE FROM comments WHERE section_id IN (${commentSections.map(([sectionId]) => sql(sectionId)).join(", ")});`);
}

for (const [, section] of commentSections) {
  for (const comment of section.comments ?? []) {
    statements.push(`INSERT INTO comments
      (id, section_id, parent_id, author_name, body, story_year, owner_key_hash, created_at, updated_at)
      VALUES ${values([
        comment.id,
        comment.sectionId,
        comment.parentId ?? null,
        comment.authorName,
        comment.body,
        comment.storyYear ?? 2011,
        ZERO_OWNER_HASH,
        comment.createdAt ?? "2011-12-31T23:59:00.000Z",
        comment.updatedAt ?? comment.createdAt ?? "2011-12-31T23:59:00.000Z",
      ])};`);
  }
}

for (const [roomId, roomExport] of Object.entries(exported.messagesByRoom ?? {})) {
  statements.push(`DELETE FROM chat_messages WHERE room_id = ${sql(roomId)};`);
  for (const message of roomExport.messages ?? []) {
    statements.push(`INSERT INTO chat_messages
      (id, room_id, author_name, body, created_at)
      VALUES ${values([
        message.id,
        message.roomId,
        message.authorName,
        message.body,
        message.createdAt ?? "2011-12-31T23:59:00.000Z",
      ])};`);
  }
}

statements.push("PRAGMA optimize;");
await writeFile(outputPath, `${statements.join("\n\n")}\n`);
