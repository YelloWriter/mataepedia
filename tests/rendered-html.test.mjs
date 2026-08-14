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
  const [page, app, api, css, hosting, packageJson, legacyMigration, cleanupMigration, characterYearMigration, aftermathMigration, islandYearsMigration, migrationJournal] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mataepedia-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_legacy_netlify_data.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_remove_test_timeline_event.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_chubby_raider.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_quovadis_aftermath.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0006_island_years.sql", import.meta.url), "utf8"),
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
  assert.match(app, /기록 수정/);
  assert.match(app, /\+ 소문 남기기/);
  assert.match(app, /record-card-grid/);
  assert.match(app, /year=\{2011\}/);
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
  assert.match(app, /navigator\.sendBeacon/);
  assert.match(app, /storyDateLabel/);
  assert.match(app, /날짜 불명/);
  assert.match(app, /isOfficialEntry/);
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
  assert.match(api, /messages:\s*20_000/);
  assert.match(api, /messagesPerRoom:\s*5_000/);
  assert.match(api, /WITH RECURSIVE descendants/);
  assert.match(api, /story_year AS storyYear/);
  assert.match(api, /님이 입장하셨습니다\./);
  assert.match(api, /님이 퇴장하셨습니다\./);
  assert.match(api, /author_name, body\) VALUES \(\?1, \?2, 'SYSTEM', \?3\)/);
  assert.match(api, /action === "update-record"/);
  assert.match(api, /id\.startsWith\("official-record-"\)/);
  assert.match(api, /id\.startsWith\("official-event-"\)/);
  assert.match(css, /Pretendard Variable/);
  assert.match(css, /\.character-photo img[^}]*filter: none/);
  assert.match(css, /\.character-photo img[^}]*object-fit: contain/);
  assert.match(css, /\.character-photo img[^}]*width: auto[^}]*height: calc\(var\(--character-photo-height\) - 2px\)/);
  assert.match(css, /\.character-photo \{[^}]*--character-photo-height: clamp\(/);
  assert.match(css, /\.chat-year-groups/);
  assert.match(css, /\.comment-form[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.character-year-tabs/);
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
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": null/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
