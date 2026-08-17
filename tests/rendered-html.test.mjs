import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://mataepedia.example/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Mataepedia shell and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /MATAEPEDIA/);
  assert.match(html, /마태피아/);
  assert.match(html, /MATAEDO PRIVATE ARCHIVE/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("keeps the public data features, editing controls, and free-tier guardrails in source", async () => {
  const [page, app, api, css, schema, wrangler, packageJson, legacyMigration, cleanupMigration, characterYearMigration, aftermathMigration, islandYearsMigration, editableRumorsMigration, noticeMigration, build03Migration, commentYearMigration, characterImagesMigration, migrationJournal] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mataepedia-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_legacy_netlify_data.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_remove_test_timeline_event.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_chubby_raider.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_quovadis_aftermath.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0006_island_years.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0007_editable_rumors.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0008_bumpy_famine.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0009_polite_omega_sentinel.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0010_brief_quentin_quire.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0011_2015_character_images.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /MataepediaApp/);
  assert.match(app, /대화기록 보기/);
  assert.match(app, /입장하기/);
  assert.match(app, /퇴장하기/);
  assert.match(app, /우리 기록/);
  assert.match(app, /방명록 \/ GUESTBOOK/);
  assert.match(app, /delete-event/);
  assert.match(app, /delete-comment/);
  assert.match(app, /delete-character/);
  assert.match(app, /delete-room/);
  assert.match(app, /delete-record/);
  assert.match(app, /update-record/);
  assert.match(app, /update-notice/);
  assert.match(app, /notice-edit-form/);
  assert.match(app, /수정 저장/);
  assert.match(app, /기록 수정/);
  assert.match(app, /guestbook-actions/);
  assert.match(app, /소문 목록/);
  assert.match(app, /recordCommentSectionId/);
  assert.match(app, /\+ 소문 남기기/);
  assert.match(app, /record-card-grid/);
  assert.match(app, /초등학교 3학년/);
  assert.match(app, /중학교 1학년/);
  assert.match(app, /ImageCropEditor/);
  assert.match(app, /SFX \{enabled \? "ON" : "OFF"\}/);
  assert.match(app, /한 마디/);
  assert.match(app, /aria-label="인물 연도"/);
  assert.match(app, /aria-selected=\{activeYear === 2011\}/);
  assert.match(app, /visibleYears = tab === "active" \? \[2015\] : \[2011, 2012, 2013, 2014\]/);
  assert.match(app, /defaultValue="2015"/);
  assert.match(app, /system-message/);
  assert.doesNotMatch(app, /shortDate\(message\.createdAt\)/);
  assert.match(app, /navigator\.sendBeacon/);
  assert.match(app, /announce: false/);
  assert.match(app, /leave\(false, false\)/);
  assert.match(app, /storyDateLabel/);
  assert.match(app, /날짜 불명/);
  assert.match(app, /MATAEPEDIA BUILD 0\.3/);
  assert.match(app, /우리만 아는 메타정보!/);
  assert.match(app, /<strong>\{metaLead\}<\/strong>/);
  assert.match(app, /right\.storyDate\.localeCompare\(left\.storyDate\)/);
  assert.match(app, /기록 이미지 준비 중/);
  assert.match(app, /IMAGE PENDING \/<br \/>2015년 인물 이미지 준비 중/);
  assert.match(app, /2011년과 비교해 가장 달라진 점/);
  assert.match(app, /2011년에 얻은 물건이 있다면, 그 물건은 어떻게 했나요\?/);
  assert.match(app, /광기와 공포증, 상처는 어떤 영향을 미쳤나요\?/);
  assert.match(app, /대학을 가려면 성적관리가 중요합니다\. 잘 하고 있나요\?/);
  assert.match(app, /마태 식물원/);
  assert.match(app, /ARCHIVED \/ 2011년 기록 \/ 현재 철거됨/);
  assert.match(app, /아직 기록 없음/);
  assert.match(app, /comment\.storyYear \|\| 2011/);
  assert.doesNotMatch(app, /기록한 사람/);
  assert.doesNotMatch(app, /shortDate\(/);
  assert.match(app, /마태도 일람/);
  assert.match(app, /사목리와 사목항/);
  assert.match(app, /마태 초중고등학교/);
  assert.match(app, /마태면사무소/);
  assert.match(app, /관광안내소/);
  assert.match(app, /괴불림/);
  assert.match(app, /마태오 순교성지/);
  assert.match(app, /오방십자가/);
  assert.match(app, /집집마다 있는 뒤주/);
  assert.match(app, /다섯 가지 전통 오방색/);
  assert.match(app, /약 1천 가구/);
  assert.match(app, /마튜 샤르보노/);
  assert.match(app, /말 목장/);
  assert.doesNotMatch(app, /window\.(?:confirm|alert)/);
  assert.doesNotMatch(app, /ENTRIES/);
  assert.doesNotMatch(app, /최근 변경/);
  assert.doesNotMatch(app, /생각해서 남기는 글/);
  assert.doesNotMatch(app, /사건 댓글/);
  assert.doesNotMatch(app, /\$\{person\.name\} 댓글/);
  assert.doesNotMatch(app, /\[\?\]/);
  assert.doesNotMatch(app, /LegacyDocument sectionId="rumor-[12]"/);
  assert.doesNotMatch(app, /지금은 대화기록 보기 상태야\. ONLINE에는 표시되지 않아\./);
  assert.doesNotMatch(app, /이곳은 마태도 아이들이 만든 비공식 기록 보관소입니다\./);
  assert.match(app, /disabled=\{joining\}/);
  assert.match(app, /withoutDuplicateJoinMessages/);
  assert.match(app, /enteredNames\.has\(name\)/);
  assert.match(api, /messages:\s*20_000/);
  assert.match(api, /messagesPerRoom:\s*5_000/);
  assert.match(api, /WITH RECURSIVE descendants/);
  assert.match(api, /story_year AS storyYear/);
  assert.match(api, /님이 입장하셨습니다\./);
  assert.match(api, /님이 퇴장하셨습니다\./);
  assert.match(api, /latestPresenceMessage/);
  assert.match(api, /AND \(body = \?2 OR body = \?3\)/);
  assert.match(api, /announced: false/);
  assert.match(api, /const announce = payload\.announce === true/);
  assert.match(api, /announce && await hasMessageCapacity/);
  assert.match(api, /author_name, body\) VALUES \(\?1, \?2, 'SYSTEM', \?3\)/);
  assert.match(api, /action === "update-record"/);
  assert.match(api, /action === "update-notice"/);
  assert.match(api, /INSERT INTO site_settings/);
  assert.match(api, /ON CONFLICT\(key\) DO UPDATE/);
  assert.match(api, /\["diary", "memo", "guestbook", "rumor"\]/);
  assert.match(api, /DELETE FROM comments WHERE section_id = \?1 OR section_id = \?2/);
  assert.doesNotMatch(api, /id\.startsWith\("official-record-"\)/);
  assert.doesNotMatch(api, /id\.startsWith\("official-event-"\)/);
  assert.doesNotMatch(api, /이 브라우저에서 쓴 기록만/);
  assert.doesNotMatch(api, /이 브라우저에서 만든 사건만/);
  assert.match(api, /story_date AS storyDate/);
  assert.match(api, /messageCount/);
  assert.match(api, /image_data_url AS imageDataUrl/);
  assert.match(api, /story_year AS storyYear/);
  assert.match(api, /sort_order AS sortOrder/);
  assert.match(api, /site_meta_notice/);
  assert.match(api, /validImageValue/);
  assert.match(api, /legacy\\\/characters/);
  assert.doesNotMatch(api, /r\.last_message_at AS lastMessageAt/);
  assert.match(css, /Pretendard Variable/);
  assert.match(css, /body, body \* \{[^}]*font-family:[^}]*!important/);
  assert.match(css, /body \.wordmark span \{[^}]*font-family: "Courier New", monospace !important/);
  assert.match(css, /\.character-photo img[^}]*filter: none/);
  assert.match(css, /\.character-photo img[^}]*object-fit: contain/);
  assert.match(css, /\.character-photo img[^}]*width: auto[^}]*height: calc\(var\(--character-photo-height\) - 2px\)/);
  assert.match(css, /\.character-photo \{[^}]*--character-photo-height: clamp\(/);
  assert.match(css, /\.chat-year-groups/);
  assert.match(css, /\.comment-form[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.character-year-tabs/);
  assert.match(css, /\.guestbook-actions/);
  assert.match(css, /\.meta-information/);
  assert.match(css, /\.record-image-placeholder/);
  assert.match(css, /\.character-detail-list/);
  assert.match(css, /\.legacy-document-status/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(schema, /storyDate: text\("story_date"\)/);
  assert.match(schema, /storyYear: integer\("story_year"\)\.notNull\(\)\.default\(2011\)/);
  assert.match(schema, /changedSince2011: text\("changed_since_2011"\)/);
  assert.equal((legacyMigration.match(/INSERT OR IGNORE INTO comments/g) ?? []).length, 64);
  assert.equal((legacyMigration.match(/INSERT OR IGNORE INTO characters/g) ?? []).length, 11);
  assert.match(cleanupMigration, /title = '테스트할게\.'/);
  assert.match(cleanupMigration, /DELETE FROM timeline_events/);
  assert.match(characterYearMigration, /ALTER TABLE `characters` ADD `story_year`/);
  assert.equal((aftermathMigration.match(/INSERT OR IGNORE INTO timeline_events/g) ?? []).length, 1);
  assert.equal((aftermathMigration.match(/INSERT OR IGNORE INTO records/g) ?? []).length, 12);
  assert.match(aftermathMigration, /비 오는 밤, 준석이를 찾으러 간 일/);
  assert.match(aftermathMigration, /준석이가 돌아온 다음 날/);
  assert.match(aftermathMigration, /붉어진 냇물/);
  assert.match(aftermathMigration, /돌아온 아이/);
  assert.match(aftermathMigration, /육지의 학교로 전학 갔다/);
  assert.match(migrationJournal, /0005_quovadis_aftermath/);
  assert.equal((islandYearsMigration.match(/INSERT OR IGNORE INTO records/g) ?? []).length, 3);
  assert.equal((islandYearsMigration.match(/INSERT OR IGNORE INTO timeline_events/g) ?? []).length, 4);
  assert.match(islandYearsMigration, /등대지기 아저씨의 실종/);
  assert.match(islandYearsMigration, /경찰들의 침묵/);
  assert.match(islandYearsMigration, /그 이후의 평범한 날들/);
  assert.match(islandYearsMigration, /사목항에 돌고래가 들어온 날/);
  assert.match(islandYearsMigration, /마태피아를 다시 연 날/);
  assert.match(migrationJournal, /0006_island_years/);
  assert.equal((editableRumorsMigration.match(/INSERT OR IGNORE INTO records/g) ?? []).length, 2);
  assert.match(editableRumorsMigration, /'rumor-1'/);
  assert.match(editableRumorsMigration, /학교 괴담/);
  assert.match(noticeMigration, /CREATE TABLE `site_settings`/);
  assert.match(noticeMigration, /'home_notice'/);
  assert.match(noticeMigration, /선생님들이랑 마을 사람들에게는 들키지 말자, 우리\./);
  assert.match(migrationJournal, /0008_bumpy_famine/);
  assert.match(editableRumorsMigration, /마을 외곽의 이상한 소문/);
  assert.match(migrationJournal, /0007_editable_rumors/);
  assert.match(build03Migration, /마태오 순교성지 잠정 폐쇄/);
  assert.match(build03Migration, /성지로 가는 길이 완전히 막힘/);
  assert.match(build03Migration, /순교성지 철거와 마태 식물원 공사/);
  assert.match(build03Migration, /마태 식물원 개장/);
  assert.match(build03Migration, /윤향자 선생님의 휴직/);
  assert.match(build03Migration, /장학관 방문 때문에 대청소/);
  assert.match(build03Migration, /육지에서 온 사진/);
  assert.match(build03Migration, /돌고래가 돌아간 길/);
  assert.match(build03Migration, /태풍날의 임시 공연/);
  assert.match(build03Migration, /같은 장소, 다른 그림/);
  assert.match(build03Migration, /따로 보관하기 시작한 기록/);
  assert.match(build03Migration, /밤의 피리 소리/);
  assert.match(build03Migration, /열리지 않는 옥상문/);
  assert.match(build03Migration, /자꾸 사라지는 화분/);
  assert.match(build03Migration, /윤향자 선생님 휴직/);
  assert.match(build03Migration, /official-character-2015-han-yeoul/);
  assert.match(build03Migration, /official-character-2015-caretaker/);
  assert.match(build03Migration, /official-room-2015-cleaning/);
  assert.match(build03Migration, /official-guestbook-2015-junseok/);
  assert.match(build03Migration, /site_meta_notice/);
  assert.doesNotMatch(build03Migration, /site_meta_notice_(?:title|body)/);
  assert.match(build03Migration, /898b68ce-fba7-4a77-875e-e6e954dfe10f/);
  assert.match(commentYearMigration, /ALTER TABLE `comments` ADD `story_year`/);
  assert.match(commentYearMigration, /UPDATE `comments` SET `story_year` = 2011/);
  assert.match(migrationJournal, /0009_polite_omega_sentinel/);
  assert.match(migrationJournal, /0010_brief_quentin_quire/);
  assert.match(characterImagesMigration, /official-character-2015-seon-yuna/);
  assert.match(characterImagesMigration, /legacy\/characters\/2015\/park-gyuntae\.png/);
  assert.match(characterImagesMigration, /legacy\/characters\/2015\/yeon-daeheum\.png/);
  assert.match(characterImagesMigration, /legacy\/characters\/2015\/lee-hyeonji\.png/);
  assert.match(characterImagesMigration, /legacy\/characters\/2015\/caretaker\.png/);
  assert.match(characterImagesMigration, /legacy\/characters\/2015\/seon-yuna\.png/);
  assert.match(migrationJournal, /0011_2015_character_images/);
  assert.match(wrangler, /"binding": "DB"/);
  assert.match(wrangler, /"database_name": "mataepedia-db"/);
  assert.match(wrangler, /"compatibility_date": "2026-05-15"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
