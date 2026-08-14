import { getD1 } from "../../../db";

export const dynamic = "force-dynamic";

const LIMITS = {
  rooms: 100,
  messages: 20_000,
  messagesPerRoom: 5_000,
  records: 2_000,
  commentsPerSection: 500,
  events: 1_000,
};

type Payload = Record<string, unknown>;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function ownerHash(ownerKey: string) {
  const encoded = new TextEncoder().encode(ownerKey);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

function fail(message: string, status = 400) {
  return response({ error: message }, status);
}

async function hasMessageCapacity(db: ReturnType<typeof getD1>, roomId: string) {
  const [total, roomTotal] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM chat_messages").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM chat_messages WHERE room_id = ?1").bind(roomId).first<{ count: number }>(),
  ]);
  return (total?.count ?? 0) < LIMITS.messages && (roomTotal?.count ?? 0) < LIMITS.messagesPerRoom;
}

export async function GET(request: Request) {
  const db = getD1();
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "bootstrap";

  try {
    if (resource === "messages") {
      const roomId = text(url.searchParams.get("roomId"), 80);
      const recentOnly = url.searchParams.get("recent") === "1";
      if (!roomId) return fail("방 정보가 없습니다.");

      const [messages, presence] = await db.batch([
        db
          .prepare(
            recentOnly
              ? `SELECT id, room_id AS roomId, author_name AS authorName, body,
                        created_at AS createdAt
                 FROM chat_messages
                 WHERE room_id = ?1
                 ORDER BY created_at DESC, rowid DESC
                 LIMIT 100`
              : `SELECT id, room_id AS roomId, author_name AS authorName, body,
                        created_at AS createdAt
                 FROM chat_messages
                 WHERE room_id = ?1
                 ORDER BY created_at ASC, rowid ASC
                 LIMIT 5000`,
          )
          .bind(roomId),
        db
          .prepare(
            `SELECT display_name AS displayName
             FROM room_presence
             WHERE room_id = ?1 AND last_seen_at >= datetime('now', '-70 seconds')
             ORDER BY joined_at ASC`,
          )
          .bind(roomId),
      ]);

      return response({
        messages: recentOnly ? [...messages.results].reverse() : messages.results,
        online: presence.results,
      });
    }

    if (resource === "comments") {
      const sectionId = text(url.searchParams.get("sectionId"), 120);
      if (!sectionId) return fail("댓글 영역 정보가 없습니다.");
      const rows = await db
        .prepare(
          `SELECT id, section_id AS sectionId, parent_id AS parentId,
                  author_name AS authorName, body, created_at AS createdAt,
                  updated_at AS updatedAt
           FROM comments
           WHERE section_id = ?1
           ORDER BY created_at ASC, rowid ASC
           LIMIT 500`,
        )
        .bind(sectionId)
        .all();
      return response({ comments: rows.results });
    }

    const [rooms, records, events, characters, siteNotice] = await db.batch([
      db.prepare(
        `SELECT r.id, r.title, r.description, r.creator_name AS creatorName,
                r.story_year AS storyYear, r.status, r.created_at AS createdAt,
                r.last_message_at AS lastMessageAt,
                (SELECT COUNT(*) FROM room_presence p
                 WHERE p.room_id = r.id
                   AND p.last_seen_at >= datetime('now', '-70 seconds')) AS onlineCount
         FROM chat_rooms r
         ORDER BY r.status ASC, r.last_message_at DESC
         LIMIT 100`,
      ),
      db.prepare(
        `SELECT id, kind, title, body, author_name AS authorName,
                story_date AS storyDate, created_at AS createdAt,
                updated_at AS updatedAt
         FROM records
         ORDER BY story_date DESC, created_at DESC
         LIMIT 2000`,
      ),
      db.prepare(
        `SELECT id, story_year AS storyYear, title, body,
                author_name AS authorName, created_at AS createdAt
         FROM timeline_events
         ORDER BY story_year ASC, created_at ASC
         LIMIT 1000`,
      ),
      db.prepare(
        `SELECT id, name, summary, description, story_year AS storyYear, image_data_url AS imageDataUrl,
                sort_order AS sortOrder, updated_at AS updatedAt
         FROM characters
         ORDER BY sort_order ASC, name ASC
         LIMIT 100`,
      ),
      db
        .prepare(
          `SELECT value AS body, updated_at AS updatedAt
           FROM site_settings
           WHERE key = ?1
           LIMIT 1`,
        )
        .bind("home_notice"),
    ]);

    return response({
      rooms: rooms.results,
      records: records.results,
      timelineEvents: events.results,
      characters: characters.results,
      siteNotice: siteNotice.results[0] ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "자료를 읽지 못했습니다.";
    return fail(message, 500);
  }
}

export async function POST(request: Request) {
  const db = getD1();
  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return fail("요청 형식이 올바르지 않습니다.");
  }

  const action = text(payload.action, 40);

  try {
    if (action === "create-room") {
      const title = text(payload.title, 60);
      const description = text(payload.description, 240);
      const creatorName = text(payload.creatorName, 24);
      const storyYear = number(payload.storyYear);
      const ownerKey = text(payload.ownerKey, 200);
      if (!title || !creatorName || !ownerKey || storyYear < 2011 || storyYear > 2015) {
        return fail("방 이름, 만든 사람, 극중 연도를 확인해 주세요.");
      }
      const count = await db.prepare("SELECT COUNT(*) AS count FROM chat_rooms").first<{ count: number }>();
      if ((count?.count ?? 0) >= LIMITS.rooms) return fail("채팅방 보관 한도에 도달했습니다.", 409);
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO chat_rooms
           (id, title, description, creator_name, creator_key_hash, story_year)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(id, title, description, creatorName, await ownerHash(ownerKey), storyYear)
        .run();
      return response({ id }, 201);
    }

    if (action === "delete-room") {
      const id = text(payload.id, 80);
      const ownerKey = text(payload.ownerKey, 200);
      if (!id || !ownerKey) return fail("삭제할 방 정보가 없습니다.");
      const room = await db
        .prepare("SELECT creator_key_hash AS ownerKeyHash FROM chat_rooms WHERE id = ?1")
        .bind(id)
        .first<{ ownerKeyHash: string }>();
      if (!room) return fail("존재하지 않는 방입니다.", 404);
      if (room.ownerKeyHash !== await ownerHash(ownerKey)) return fail("이 브라우저에서 만든 방만 삭제할 수 있어.", 403);
      await db.batch([
        db.prepare("DELETE FROM room_presence WHERE room_id = ?1").bind(id),
        db.prepare("DELETE FROM chat_messages WHERE room_id = ?1").bind(id),
        db.prepare("DELETE FROM chat_rooms WHERE id = ?1").bind(id),
      ]);
      return response({ ok: true });
    }

    if (action === "join-room" || action === "heartbeat") {
      const sessionId = text(payload.sessionId, 120);
      const roomId = text(payload.roomId, 80);
      const displayName = text(payload.displayName, 24);
      if (!sessionId || !roomId || !displayName) return fail("입장 정보가 올바르지 않습니다.");
      const room = await db.prepare("SELECT status FROM chat_rooms WHERE id = ?1").bind(roomId).first<{ status: string }>();
      if (!room) return fail("존재하지 않는 방입니다.", 404);
      if (room.status !== "active") return fail("닫힌 방에는 입장할 수 없습니다.", 409);

      const presenceStatement = db
        .prepare(
          `INSERT INTO room_presence (session_id, room_id, display_name)
           VALUES (?1, ?2, ?3)
           ON CONFLICT(session_id) DO UPDATE SET
             room_id = excluded.room_id,
             display_name = excluded.display_name,
             last_seen_at = CURRENT_TIMESTAMP`,
        )
        .bind(sessionId, roomId, displayName);

      if (action === "heartbeat") {
        await presenceStatement.run();
        return response({ ok: true });
      }

      if (!(await hasMessageCapacity(db, roomId))) return fail("채팅 기록 보관 한도에 도달했습니다.", 409);
      const messageId = crypto.randomUUID();
      await db.batch([
        presenceStatement,
        db.prepare("INSERT INTO chat_messages (id, room_id, author_name, body) VALUES (?1, ?2, 'SYSTEM', ?3)")
          .bind(messageId, roomId, `${displayName}님이 입장하셨습니다.`),
        db.prepare("UPDATE chat_rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(roomId),
      ]);
      return response({ ok: true });
    }

    if (action === "leave-room") {
      const sessionId = text(payload.sessionId, 120);
      const announce = payload.announce === true;
      if (sessionId) {
        const presence = await db
          .prepare("SELECT room_id AS roomId, display_name AS displayName FROM room_presence WHERE session_id = ?1")
          .bind(sessionId)
          .first<{ roomId: string; displayName: string }>();
        if (presence) {
          const statements = [db.prepare("DELETE FROM room_presence WHERE session_id = ?1").bind(sessionId)];
          if (announce && await hasMessageCapacity(db, presence.roomId)) {
            statements.push(
              db.prepare("INSERT INTO chat_messages (id, room_id, author_name, body) VALUES (?1, ?2, 'SYSTEM', ?3)")
                .bind(crypto.randomUUID(), presence.roomId, `${presence.displayName}님이 퇴장하셨습니다.`),
              db.prepare("UPDATE chat_rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(presence.roomId),
            );
          }
          await db.batch(statements);
        }
      }
      return response({ ok: true });
    }

    if (action === "send-message") {
      const roomId = text(payload.roomId, 80);
      const sessionId = text(payload.sessionId, 120);
      const displayName = text(payload.displayName, 24);
      const body = text(payload.body, 1_000);
      if (!roomId || !sessionId || !displayName || !body) return fail("메시지 정보를 확인해 주세요.");

      const room = await db
        .prepare("SELECT status FROM chat_rooms WHERE id = ?1")
        .bind(roomId)
        .first<{ status: string }>();
      if (!room) return fail("존재하지 않는 방입니다.", 404);
      if (room.status !== "active") return fail("닫힌 방에는 메시지를 남길 수 없습니다.", 409);

      const member = await db
        .prepare(
          `SELECT session_id FROM room_presence
           WHERE session_id = ?1 AND room_id = ?2
             AND display_name = ?3
             AND last_seen_at >= datetime('now', '-70 seconds')`,
        )
        .bind(sessionId, roomId, displayName)
        .first();
      if (!member) return fail("먼저 채팅방에 입장해 주세요.", 403);

      if (!(await hasMessageCapacity(db, roomId))) {
        return fail("채팅 기록 보관 한도에 도달했습니다.", 409);
      }

      const id = crypto.randomUUID();
      await db.batch([
        db
          .prepare(
            `INSERT INTO chat_messages (id, room_id, author_name, body)
             VALUES (?1, ?2, ?3, ?4)`,
          )
          .bind(id, roomId, displayName, body),
        db
          .prepare("UPDATE chat_rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?1")
          .bind(roomId),
        db
          .prepare("UPDATE room_presence SET last_seen_at = CURRENT_TIMESTAMP WHERE session_id = ?1")
          .bind(sessionId),
      ]);
      return response({ id }, 201);
    }

    if (action === "update-notice") {
      const body = text(payload.body, 500);
      if (!body) return fail("공지 내용을 입력해 주세요.");
      await db
        .prepare(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES (?1, ?2, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind("home_notice", body)
        .run();
      return response({ ok: true });
    }

    if (action === "create-record") {
      const kind = text(payload.kind, 20);
      const title = text(payload.title, 100);
      const body = text(payload.body, 10_000);
      const authorName = text(payload.authorName, 24);
      const storyDate = text(payload.storyDate, 10);
      const ownerKey = text(payload.ownerKey, 200);
      if (!["diary", "memo", "guestbook", "rumor"].includes(kind) || !title || !body || !authorName || !storyDate || !ownerKey) {
        return fail("기록의 필수 내용을 모두 입력해 주세요.");
      }
      const count = await db.prepare("SELECT COUNT(*) AS count FROM records").first<{ count: number }>();
      if ((count?.count ?? 0) >= LIMITS.records) return fail("기록 보관 한도에 도달했습니다.", 409);
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO records
           (id, kind, title, body, author_name, story_date, owner_key_hash)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(id, kind, title, body, authorName, storyDate, await ownerHash(ownerKey))
        .run();
      return response({ id }, 201);
    }

    if (action === "update-record") {
      const id = text(payload.id, 80);
      const kind = text(payload.kind, 20);
      const title = text(payload.title, 100);
      const body = text(payload.body, 10_000);
      const authorName = text(payload.authorName, 24);
      const storyDate = text(payload.storyDate, 10);
      if (!id || !["diary", "memo", "guestbook", "rumor"].includes(kind) || !title || !body || !authorName || !storyDate) {
        return fail("수정할 기록의 내용을 모두 입력해 주세요.");
      }
      const record = await db
        .prepare("SELECT id FROM records WHERE id = ?1")
        .bind(id)
        .first<{ id: string }>();
      if (!record) return fail("존재하지 않는 기록입니다.", 404);
      await db
        .prepare(
          `UPDATE records
           SET kind = ?2, title = ?3, body = ?4, author_name = ?5,
               story_date = ?6, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?1`,
        )
        .bind(id, kind, title, body, authorName, storyDate)
        .run();
      return response({ ok: true });
    }

    if (action === "delete-record") {
      const id = text(payload.id, 80);
      if (!id) return fail("삭제할 기록 정보가 없습니다.");
      const record = await db
        .prepare("SELECT id FROM records WHERE id = ?1")
        .bind(id)
        .first<{ id: string }>();
      if (!record) return fail("존재하지 않는 기록입니다.", 404);
      await db.batch([
        db.prepare("DELETE FROM comments WHERE section_id = ?1 OR section_id = ?2").bind(`record:${id}`, id),
        db.prepare("DELETE FROM records WHERE id = ?1").bind(id),
      ]);
      return response({ ok: true });
    }

    if (action === "add-comment") {
      const sectionId = text(payload.sectionId, 120);
      const parentId = text(payload.parentId, 80) || null;
      const authorName = text(payload.authorName, 24);
      const body = text(payload.body, 2_000);
      const ownerKey = text(payload.ownerKey, 200);
      if (!sectionId || !authorName || !body || !ownerKey) return fail("댓글 내용을 확인해 주세요.");
      const count = await db
        .prepare("SELECT COUNT(*) AS count FROM comments WHERE section_id = ?1")
        .bind(sectionId)
        .first<{ count: number }>();
      if ((count?.count ?? 0) >= LIMITS.commentsPerSection) return fail("이 문서의 댓글 보관 한도에 도달했습니다.", 409);
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO comments
           (id, section_id, parent_id, author_name, body, owner_key_hash)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(id, sectionId, parentId, authorName, body, await ownerHash(ownerKey))
        .run();
      return response({ id }, 201);
    }

    if (action === "update-comment") {
      const id = text(payload.id, 80);
      const authorName = text(payload.authorName, 24);
      const body = text(payload.body, 2_000);
      const ownerKey = text(payload.ownerKey, 200);
      if (!id || !authorName || !body || !ownerKey) return fail("수정할 댓글 내용을 확인해 주세요.");
      const comment = await db
        .prepare("SELECT owner_key_hash AS ownerKeyHash FROM comments WHERE id = ?1")
        .bind(id)
        .first<{ ownerKeyHash: string }>();
      if (!comment) return fail("존재하지 않는 댓글입니다.", 404);
      if (comment.ownerKeyHash !== await ownerHash(ownerKey)) return fail("이 브라우저에서 쓴 댓글만 수정할 수 있어.", 403);
      await db
        .prepare(
          `UPDATE comments
           SET author_name = ?2, body = ?3, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?1`,
        )
        .bind(id, authorName, body)
        .run();
      return response({ ok: true });
    }

    if (action === "delete-comment") {
      const id = text(payload.id, 80);
      const ownerKey = text(payload.ownerKey, 200);
      if (!id || !ownerKey) return fail("삭제할 댓글 정보가 없습니다.");
      const comment = await db
        .prepare("SELECT owner_key_hash AS ownerKeyHash FROM comments WHERE id = ?1")
        .bind(id)
        .first<{ ownerKeyHash: string }>();
      if (!comment) return fail("존재하지 않는 댓글입니다.", 404);
      if (comment.ownerKeyHash !== await ownerHash(ownerKey)) return fail("이 브라우저에서 쓴 댓글만 삭제할 수 있어.", 403);
      await db
        .prepare(
          `WITH RECURSIVE descendants(id) AS (
             SELECT id FROM comments WHERE id = ?1
             UNION ALL
             SELECT child.id FROM comments child
             JOIN descendants parent ON child.parent_id = parent.id
           )
           DELETE FROM comments WHERE id IN (SELECT id FROM descendants)`,
        )
        .bind(id)
        .run();
      return response({ ok: true });
    }

    if (action === "create-event") {
      const storyYear = number(payload.storyYear);
      const title = text(payload.title, 100);
      const body = text(payload.body, 5_000);
      const authorName = text(payload.authorName, 24);
      const ownerKey = text(payload.ownerKey, 200);
      if (storyYear < 2011 || storyYear > 2015 || !title || !body || !authorName || !ownerKey) {
        return fail("사건의 필수 내용을 확인해 주세요.");
      }
      const count = await db.prepare("SELECT COUNT(*) AS count FROM timeline_events").first<{ count: number }>();
      if ((count?.count ?? 0) >= LIMITS.events) return fail("연표 보관 한도에 도달했습니다.", 409);
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO timeline_events
           (id, story_year, title, body, author_name, owner_key_hash)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(id, storyYear, title, body, authorName, await ownerHash(ownerKey))
        .run();
      return response({ id }, 201);
    }

    if (action === "update-event") {
      const id = text(payload.id, 80);
      const storyYear = number(payload.storyYear);
      const title = text(payload.title, 100);
      const body = text(payload.body, 5_000);
      const authorName = text(payload.authorName, 24);
      if (!id || storyYear < 2011 || storyYear > 2015 || !title || !body || !authorName) {
        return fail("사건의 필수 내용을 확인해 주세요.");
      }
      const event = await db
        .prepare("SELECT id FROM timeline_events WHERE id = ?1")
        .bind(id)
        .first<{ id: string }>();
      if (!event) return fail("존재하지 않는 사건입니다.", 404);
      await db
        .prepare(
          `UPDATE timeline_events
           SET story_year = ?2, title = ?3, body = ?4, author_name = ?5
           WHERE id = ?1`,
        )
        .bind(id, storyYear, title, body, authorName)
        .run();
      return response({ ok: true });
    }

    if (action === "delete-event") {
      const id = text(payload.id, 80);
      if (!id) return fail("삭제할 사건 정보가 없습니다.");
      const event = await db
        .prepare("SELECT id FROM timeline_events WHERE id = ?1")
        .bind(id)
        .first<{ id: string }>();
      if (!event) return fail("존재하지 않는 사건입니다.", 404);
      await db.batch([
        db.prepare("DELETE FROM comments WHERE section_id = ?1").bind(`timeline:${id}`),
        db.prepare("DELETE FROM timeline_events WHERE id = ?1").bind(id),
      ]);
      return response({ ok: true });
    }

    if (action === "save-character") {
      const id = text(payload.id, 80);
      const name = text(payload.name, 40);
      const summary = text(payload.summary, 120);
      const description = text(payload.description, 6_000);
      const storyYear = number(payload.storyYear) || 2011;
      const imageDataUrl = text(payload.imageDataUrl, 250_000) || null;
      const sortOrder = Math.max(0, Math.min(999, number(payload.sortOrder) || 0));
      const ownerKey = text(payload.ownerKey, 200);
      if (!id || !name || !ownerKey) return fail("인물 문서 정보를 확인해 주세요.");
      if (![2011, 2015].includes(storyYear)) return fail("인물 연도는 2011년이나 2015년으로 골라 주세요.");
      if (imageDataUrl && !/^data:image\/(?:webp|jpeg|png);base64,/i.test(imageDataUrl)) {
        return fail("지원하지 않는 이미지 형식입니다.");
      }

      const existing = await db.prepare("SELECT id FROM characters WHERE id = ?1").bind(id).first();
      if (!existing) {
        const count = await db.prepare("SELECT COUNT(*) AS count FROM characters").first<{ count: number }>();
        if ((count?.count ?? 0) >= 100) return fail("인물 문서 보관 한도에 도달했습니다.", 409);
      }

      await db
        .prepare(
          `INSERT INTO characters
           (id, name, summary, description, story_year, image_data_url, owner_key_hash, sort_order)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             summary = excluded.summary,
             description = excluded.description,
             story_year = excluded.story_year,
             image_data_url = COALESCE(excluded.image_data_url, characters.image_data_url),
             owner_key_hash = excluded.owner_key_hash,
             sort_order = excluded.sort_order,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(id, name, summary, description, storyYear, imageDataUrl, await ownerHash(ownerKey), sortOrder)
        .run();
      return response({ id });
    }

    if (action === "delete-character") {
      const id = text(payload.id, 80);
      if (!id) return fail("삭제할 인물 정보가 없습니다.");
      const character = await db.prepare("SELECT id FROM characters WHERE id = ?1").bind(id).first();
      if (!character) return fail("존재하지 않는 인물입니다.", 404);
      await db.batch([
        db.prepare("DELETE FROM comments WHERE section_id = ?1").bind(`character-${id}`),
        db.prepare("DELETE FROM characters WHERE id = ?1").bind(id),
      ]);
      return response({ ok: true });
    }

    return fail("지원하지 않는 요청입니다.", 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장하지 못했습니다.";
    return fail(message, 500);
  }
}
