"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type PageKey = "home" | "timeline" | "records" | "people" | "island" | "rumors" | "chat" | "changes";
type Room = {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  storyYear: number;
  status: "active" | "closed";
  createdAt: string;
  lastMessageAt: string;
  onlineCount: number;
};
type ChatMessage = { id: string; roomId: string; authorName: string; body: string; createdAt: string };
type RecordItem = {
  id: string;
  kind: "diary" | "memo" | "guestbook" | "rumor";
  title: string;
  body: string;
  authorName: string;
  storyDate: string;
  createdAt: string;
  updatedAt: string;
};
type TimelineEvent = { id: string; storyYear: number; title: string; body: string; authorName: string; createdAt: string };
type Character = { id: string; name: string; summary: string; description: string; imageDataUrl?: string | null };
type Change = { type: string; id: string; label: string; actor: string; changedAt: string };
type Comment = { id: string; sectionId: string; parentId: string | null; authorName: string; body: string; createdAt: string };

const pages: { key: PageKey; label: string; code: string }[] = [
  { key: "home", label: "대문", code: "00" },
  { key: "timeline", label: "연표", code: "01" },
  { key: "records", label: "우리 기록", code: "02" },
  { key: "people", label: "인물", code: "03" },
  { key: "island", label: "마태도", code: "04" },
  { key: "rumors", label: "소문", code: "05" },
  { key: "chat", label: "채팅", code: "06" },
  { key: "changes", label: "최근 변경", code: "07" },
];

const baseTimeline: TimelineEvent[] = [
  {
    id: "canon-2011",
    storyYear: 2011,
    title: "비 오는 밤 이후",
    body: "마태피아가 기록을 시작하게 된 해. 자세한 사건 기록은 기존 자료 이관 후 이 문서에 그대로 연결된다.",
    authorName: "MATAEPEDIA",
    createdAt: "2011-01-01 00:00:00",
  },
];

const baseCharacters: Character[] = [
  { id: "legacy-inhyeong", name: "구인형", summary: "인물 문서", description: "기존 인물 기록과 댓글을 같은 문서 식별자로 이관할 예정." },
  { id: "legacy-junseok", name: "서준석", summary: "인물 문서", description: "기존 인물 기록과 댓글을 같은 문서 식별자로 이관할 예정." },
  { id: "legacy-haeju", name: "박해주", summary: "인물 문서", description: "기존 인물 기록과 댓글을 같은 문서 식별자로 이관할 예정." },
  { id: "legacy-beomcheol", name: "한범철", summary: "인물 문서", description: "기존 인물 기록과 댓글을 같은 문서 식별자로 이관할 예정." },
];

const kindLabels = { diary: "일기", memo: "메모", guestbook: "방명록", rumor: "소문" } as const;

function localOwnerKey() {
  const storageKey = "mataepedia-owner-key";
  const previous = window.localStorage.getItem(storageKey);
  if (previous) return previous;
  const next = crypto.randomUUID();
  window.localStorage.setItem(storageKey, next);
  return next;
}

function shortDate(value: string) {
  if (!value) return "----.--.--";
  return value.replace("T", " ").slice(0, 16);
}

async function apiPost(payload: Record<string, unknown>) {
  const response = await fetch("/api/community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { error?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(data.error || "저장하지 못했습니다.");
  return data;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="document-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="document-description">{description}</p>}
      <div className="rule" aria-hidden="true" />
    </header>
  );
}

export function MataepediaApp() {
  const [page, setPage] = useState<PageKey>("home");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>(baseTimeline);
  const [characters, setCharacters] = useState<Character[]>(baseCharacters);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/community", { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      const data = await response.json();
      setRooms(data.rooms ?? []);
      setRecords(data.records ?? []);
      setEvents([...(data.timelineEvents?.length ? [] : baseTimeline), ...(data.timelineEvents ?? [])]);
      const storedCharacters = (data.characters ?? []) as Character[];
      const storedById = new Map(storedCharacters.map((person) => [person.id, person]));
      const mergedCharacters = baseCharacters.map((person) => storedById.get(person.id) ?? person);
      const baseIds = new Set(baseCharacters.map((person) => person.id));
      setCharacters([...mergedCharacters, ...storedCharacters.filter((person) => !baseIds.has(person.id))]);
      setChanges(data.recentChanges ?? []);
    } catch {
      setNotice("미리보기 모드 — 배포 후 저장소가 연결됩니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const go = (next: PageKey) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => go("home")} aria-label="마태피아 대문으로">
          <span>MATAEPEDIA</span>
          <small>마태피아 // MATAEDO PRIVATE ARCHIVE</small>
        </button>
        <div className="system-note">
          <span className="status-dot" /> SYSTEM ONLINE
          <br />EST. 2011 / TEACHERS KEEP OUT
        </div>
      </header>

      <div className="layout-grid">
        <aside className="sidebar">
          <nav aria-label="주 메뉴">
            <p className="nav-label">INDEX / 문서 목록</p>
            {pages.map((item) => (
              <button key={item.key} className={page === item.key ? "active" : ""} onClick={() => go(item.key)}>
                <span>[{item.code}]</span> {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-block">
            <p>ARCHIVE RANGE</p>
            <strong>2011—2015</strong>
          </div>
          <div className="sidebar-warning">※ 이곳은 마태도 아이들이 만든 비공식 기록 보관소입니다.</div>
        </aside>

        <main className="content" id="main-content">
          {notice && <div className="notice-line">{notice}</div>}
          {loading ? <div className="terminal-loading">자료 불러오는 중<span>_</span></div> : null}
          {!loading && page === "home" && <HomePage go={go} rooms={rooms} records={records} changes={changes} />}
          {!loading && page === "timeline" && <TimelinePage events={events} onSaved={refresh} />}
          {!loading && page === "records" && <RecordsPage records={records} onSaved={refresh} />}
          {!loading && page === "people" && <PeoplePage characters={characters} onSaved={refresh} />}
          {!loading && page === "island" && <IslandPage />}
          {!loading && page === "rumors" && <RumorsPage records={records.filter((item) => item.kind === "rumor")} go={go} />}
          {!loading && page === "chat" && <ChatPage rooms={rooms} onSaved={refresh} />}
          {!loading && page === "changes" && <ChangesPage changes={changes} />}
        </main>
      </div>

      <footer>
        <span>MATAEPEDIA BUILD 0.1</span>
        <span>TEXT FIRST / LOW BANDWIDTH MODE</span>
      </footer>
    </div>
  );
}

function HomePage({ go, rooms, records, changes }: { go: (page: PageKey) => void; rooms: Room[]; records: RecordItem[]; changes: Change[] }) {
  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / MAIN" title="마태피아에 온 걸 환영해." description="마태도에 관한 것이라면 뭐든 적어 두는 곳. 확실하지 않은 것도 지우지 말고 표시만 해 둘 것." />
      <section className="intro-grid">
        <div className="ascii-panel" aria-label="마태피아 문자 그림">
          <pre>{`┌──────────────────┐\n│  M A T A E D O   │\n│                  │\n│    ●       ●     │\n│        2011      │\n└──────────────────┘`}</pre>
        </div>
        <div className="welcome-copy">
          <h2>공지 / NOTICE</h2>
          <p>여긴 선생님들 보여 주려고 만든 데가 아님.</p>
          <p>틀린 내용은 댓글로 말하고, 누가 쓴 기록을 멋대로 지우지 마.</p>
          <p className="signature">— 처음 만든 사람들</p>
        </div>
      </section>
      <section className="quick-grid">
        <button onClick={() => go("timeline")}><small>01 / HISTORY</small><strong>2011년 이후 연표 보기</strong><span>사건 기록 {"->"}</span></button>
        <button onClick={() => go("records")}><small>02 / RECORDS</small><strong>새 기록 남기기</strong><span>일기·메모·방명록 {"->"}</span></button>
        <button onClick={() => go("chat")}><small>06 / CHAT</small><strong>채팅방 들어가기</strong><span>{rooms.length}개 방 / 기록 공개 {"->"}</span></button>
      </section>
      <div className="two-column">
        <section className="wiki-section">
          <h2>최근 기록</h2>
          {records.length ? records.slice(0, 5).map((item) => <p className="list-row" key={item.id}><span>{item.storyDate}</span><button onClick={() => go("records")}>{item.title}</button><small>{item.authorName}</small></p>) : <p className="empty">아직 새 기록이 없어. 첫 기록을 남겨 줘.</p>}
        </section>
        <section className="wiki-section">
          <h2>최근 변경</h2>
          {changes.length ? changes.slice(0, 5).map((item) => <p className="list-row" key={`${item.type}-${item.id}`}><span>{shortDate(item.changedAt).slice(5)}</span><button onClick={() => go("changes")}>{item.label}</button><small>{item.actor}</small></p>) : <p className="empty">변경 내역이 아직 없어.</p>}
        </section>
      </div>
    </>
  );
}

function TimelinePage({ events, onSaved }: { events: TimelineEvent[]; onSaved: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const grouped = useMemo(() => [2011, 2012, 2013, 2014, 2015].map((year) => ({ year, events: events.filter((item) => item.storyYear === year) })), [events]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiPost({
        action: "create-event",
        storyYear: Number(form.get("year")),
        title: form.get("title"),
        body: form.get("body"),
        authorName: form.get("author"),
        ownerKey: localOwnerKey(),
      });
      event.currentTarget.reset();
      setShowForm(false);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장하지 못했습니다.");
    }
  }

  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / TIMELINE" title="연표" description="2011년의 사건부터 2015년까지. 기억나는 일이 있으면 날짜가 정확하지 않아도 남겨 둘 것." />
      <div className="toolbar"><button className="text-button" onClick={() => setShowForm((value) => !value)}>[ + 사건 추가 ]</button></div>
      {showForm && <form className="editor-box" onSubmit={submit}>
        <label>극중 연도<select name="year" defaultValue="2012">{[2011, 2012, 2013, 2014, 2015].map((year) => <option key={year}>{year}</option>)}</select></label>
        <label>사건 제목<input name="title" maxLength={100} required /></label>
        <label>기록한 사람<input name="author" maxLength={24} required /></label>
        <label className="wide">사건 내용<textarea name="body" maxLength={5000} required /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><button type="button" onClick={() => setShowForm(false)}>취소</button><button type="submit">저장</button></div>
      </form>}
      <div className="timeline">
        {grouped.map((group) => <section key={group.year} className="year-block">
          <div className="year-marker"><strong>{group.year}</strong><span>{group.events.length.toString().padStart(2, "0")} ENTRIES</span></div>
          <div className="year-events">{group.events.length ? group.events.map((item) => <article key={item.id}>
            <h2>{item.title}</h2><p>{item.body}</p><small>기록: {item.authorName}</small>
          </article>) : <p className="empty-year">— 아직 기록 없음 —</p>}</div>
        </section>)}
      </div>
    </>
  );
}

function RecordsPage({ records, onSaved }: { records: RecordItem[]; onSaved: () => Promise<void> }) {
  const [filter, setFilter] = useState<"all" | RecordItem["kind"]>("all");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const visible = filter === "all" ? records : records.filter((item) => item.kind === filter);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiPost({ action: "create-record", kind: form.get("kind"), title: form.get("title"), body: form.get("body"), authorName: form.get("author"), storyDate: form.get("date"), ownerKey: localOwnerKey() });
      event.currentTarget.reset();
      setShowForm(false);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "저장하지 못했습니다."); }
  }

  if (selected) return <RecordDocument record={selected} onBack={() => setSelected(null)} />;

  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / RECORDS" title="우리 기록" description="생각해서 남기는 글. 일기, 메모, 방명록, 소문은 여기에서 분류한다." />
      <div className="record-controls">
        <div className="filter-tabs">{(["all", "diary", "memo", "guestbook", "rumor"] as const).map((key) => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{key === "all" ? "전체" : kindLabels[key]}</button>)}</div>
        <button className="text-button" onClick={() => setShowForm((value) => !value)}>[ + 새 기록 ]</button>
      </div>
      {showForm && <form className="editor-box" onSubmit={submit}>
        <label>분류<select name="kind" defaultValue="diary"><option value="diary">일기</option><option value="memo">메모</option><option value="guestbook">방명록</option><option value="rumor">소문</option></select></label>
        <label>극중 날짜<input name="date" type="date" min="2011-01-01" max="2015-12-31" defaultValue="2012-01-01" required /></label>
        <label>작성자<input name="author" maxLength={24} required /></label>
        <label className="wide">제목<input name="title" maxLength={100} required /></label>
        <label className="wide">내용<textarea name="body" maxLength={10000} required /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><button type="button" onClick={() => setShowForm(false)}>취소</button><button type="submit">기록 남기기</button></div>
      </form>}
      <div className="records-table" role="table" aria-label="우리 기록 목록">
        <div className="records-head" role="row"><span>날짜</span><span>분류</span><span>제목</span><span>작성자</span></div>
        {visible.length ? visible.map((item) => <button className="records-row" role="row" key={item.id} onClick={() => setSelected(item)}><span>{item.storyDate}</span><span>[{kindLabels[item.kind]}]</span><strong>{item.title}</strong><span>{item.authorName}</span></button>) : <p className="empty table-empty">이 분류에는 아직 기록이 없어.</p>}
      </div>
    </>
  );
}

function RecordDocument({ record, onBack }: { record: RecordItem; onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/community?resource=comments&sectionId=${encodeURIComponent(`record:${record.id}`)}`, { cache: "no-store" });
    if (response.ok) setComments((await response.json()).comments ?? []);
  }, [record.id]);

  useEffect(() => { load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await apiPost({ action: "add-comment", sectionId: `record:${record.id}`, parentId: replyTo, authorName: form.get("author"), body: form.get("body"), ownerKey: localOwnerKey() });
      event.currentTarget.reset(); setReplyTo(null); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "댓글을 저장하지 못했습니다."); }
  }

  const roots = comments.filter((item) => !item.parentId);
  return <>
    <button className="back-link" onClick={onBack}>{"<-"} 기록 목록</button>
    <SectionTitle eyebrow={`RECORD / ${kindLabels[record.kind]}`} title={record.title} description={`${record.storyDate} / ${record.authorName}`} />
    <article className="document-body">{record.body.split("\n").map((line, index) => <p key={index}>{line || <>&nbsp;</>}</p>)}</article>
    <section className="comments-section">
      <h2>우리끼리 이야기 <small>{comments.length}</small></h2>
      {roots.length ? roots.map((comment) => <div className="comment-thread" key={comment.id}>
        <CommentItem comment={comment} onReply={() => setReplyTo(comment.id)} />
        {comments.filter((item) => item.parentId === comment.id).map((reply) => <div className="reply" key={reply.id}><CommentItem comment={reply} onReply={() => setReplyTo(comment.id)} /></div>)}
      </div>) : <p className="empty">아직 댓글이 없어.</p>}
      <form className="comment-form" onSubmit={submit}>
        {replyTo && <p className="replying">답글 쓰는 중 <button type="button" onClick={() => setReplyTo(null)}>취소</button></p>}
        <input name="author" aria-label="댓글 작성자" placeholder="이름" maxLength={24} required />
        <textarea name="body" aria-label="댓글 내용" placeholder="할 말" maxLength={2000} required />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">남기기</button>
      </form>
    </section>
  </>;
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  return <article className="comment"><header><strong>{comment.authorName}</strong><time>{shortDate(comment.createdAt)}</time></header><p>{comment.body}</p><button onClick={onReply}>답글</button></article>;
}

function PeoplePage({ characters, onSaved }: { characters: Character[]; onSaved: () => Promise<void> }) {
  return <><SectionTitle eyebrow="MATAEPEDIA / PEOPLE" title="인물" description="마태도와 우리 주변 사람들. 사진은 칸을 눌러 바꾸고, 설명은 각 문서에서 바로 고칠 수 있어." />
    <div className="character-grid">{characters.map((person, index) => <CharacterCard key={person.id} person={person} index={index} onSaved={onSaved} />)}</div>
  </>;
}

function CharacterCard({ person, index, onSaved }: { person: Character; index: number; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(values: Partial<Character>) {
    setBusy(true); setError("");
    try {
      await apiPost({
        action: "save-character",
        id: person.id,
        name: values.name ?? person.name,
        summary: values.summary ?? person.summary,
        description: values.description ?? person.description,
        imageDataUrl: values.imageDataUrl ?? null,
        sortOrder: index,
        ownerKey: localOwnerKey(),
      });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "인물 문서를 저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 올릴 수 있어."); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = 300; canvas.height = 300;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("이미지를 처리하지 못했습니다.");
      const scale = Math.min(300 / bitmap.width, 300 / bitmap.height);
      const width = Math.round(bitmap.width * scale); const height = Math.round(bitmap.height * scale);
      context.clearRect(0, 0, 300, 300);
      context.drawImage(bitmap, Math.round((300 - width) / 2), Math.round((300 - height) / 2), width, height);
      bitmap.close();
      const imageDataUrl = canvas.toDataURL("image/webp", 0.78);
      if (imageDataUrl.length > 240_000) throw new Error("이미지 용량이 너무 커. 더 작은 파일을 골라 줘.");
      await save({ imageDataUrl });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 처리하지 못했습니다.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save({ name: String(form.get("name") ?? ""), summary: String(form.get("summary") ?? ""), description: String(form.get("description") ?? "") });
    setEditing(false);
  }

  return <article className="character-card">
    <label className={`character-photo upload-photo ${busy ? "busy" : ""}`} title="클릭해서 이미지 올리기">
      {person.imageDataUrl ? <img src={person.imageDataUrl} alt={`${person.name} 인물 이미지`} /> : <span>CLICK TO UPLOAD<br />{String(index + 1).padStart(3, "0")}</span>}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} disabled={busy} />
    </label>
    <div><p className="eyebrow">PERSON FILE / {String(index + 1).padStart(3, "0")}</p>
      {editing ? <form className="character-editor" onSubmit={submit}><input name="name" defaultValue={person.name} maxLength={40} required /><input name="summary" defaultValue={person.summary} maxLength={120} /><textarea name="description" defaultValue={person.description} maxLength={6000} /><div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="submit" disabled={busy}>저장</button></div></form> : <><h2>{person.name}</h2><strong>{person.summary}</strong><p className="character-description">{person.description}</p><button className="text-link" onClick={() => setEditing(true)}>설명 수정 {"->"}</button></>}
      {error && <p className="form-error standalone">{error}</p>}
    </div>
  </article>;
}

function IslandPage() {
  return <><SectionTitle eyebrow="MATAEPEDIA / MATAEDO" title="마태도" description="우리가 사는 섬. 지도에 없는 길이나 어른들이 모르는 장소도 기록한다." />
    <div className="map-ascii"><pre>{`                 북쪽\n                  ↑\n          ~ ~ ~ ~ ~ ~ ~\n       ~      [괴불림]     ~\n     ~          │           ~\n    ~   [마을]──┼──[학교]    ~\n    ~      │    │            ~\n     ~   [공소] └──[부두]   ~\n       ~                 ~\n          ~ ~ ~ ~ ~ ~\n                  ↓\n                 남쪽`}</pre></div>
    <section className="wiki-section"><h2>장소 목록</h2><dl className="definition-list"><div><dt>마을</dt><dd>아이들이 가장 자주 오가는 곳.</dd></div><div><dt>괴불림</dt><dd>확인되지 않은 길과 이야기가 많은 곳.</dd></div><div><dt>공소</dt><dd>마을의 오래된 약속과 소문이 모이는 장소.</dd></div><div><dt>부두</dt><dd>섬 밖으로 나가는 배가 드나드는 곳.</dd></div></dl></section>
  </>;
}

function RumorsPage({ records, go }: { records: RecordItem[]; go: (page: PageKey) => void }) {
  return <><SectionTitle eyebrow="MATAEPEDIA / RUMORS" title="소문" description="사실인지 아닌지 모르는 이야기. 확인 전에는 문서 앞에 [?]를 붙인다." />
    <div className="rumor-list">{records.length ? records.map((item) => <article key={item.id}><span>[?]</span><div><h2>{item.title}</h2><p>{item.body.slice(0, 180)}{item.body.length > 180 ? "…" : ""}</p><small>{item.storyDate} / {item.authorName}</small></div></article>) : <div className="empty-box"><strong>등록된 소문 없음</strong><p>우리 기록에서 분류를 ‘소문’으로 선택하면 여기에 나타나.</p><button className="text-button" onClick={() => go("records")}>[ 소문 남기기 ]</button></div>}</div>
  </>;
}

function ChatPage({ rooms, onSaved }: { rooms: Room[]; onSaved: () => Promise<void> }) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  if (selectedRoom) return <ChatRoom room={selectedRoom} onBack={() => { setSelectedRoomId(null); onSaved(); }} />;
  return <ChatLobby rooms={rooms} onSelect={setSelectedRoomId} onSaved={onSaved} />;
}

function ChatLobby({ rooms, onSelect, onSaved }: { rooms: Room[]; onSelect: (id: string) => void; onSaved: () => Promise<void> }) {
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [error, setError] = useState("");
  const visible = rooms.filter((room) => tab === "active" ? room.status === "active" : room.status === "closed");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiPost({ action: "create-room", title: form.get("title"), description: form.get("description"), creatorName: form.get("creator"), storyYear: Number(form.get("year")), ownerKey: localOwnerKey() });
      event.currentTarget.reset(); setShowCreate(false); await onSaved(); if (typeof result.id === "string") onSelect(result.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "방을 만들지 못했습니다."); }
  }

  return <><SectionTitle eyebrow="MATAEPEDIA / CHAT" title="채팅" description="대화 기록은 누구나 읽을 수 있어. 말을 하려면 방에 입장해야 해." />
    <div className="chat-summary"><span>ROOMS {rooms.length.toString().padStart(2, "0")}</span><span>ONLINE {rooms.reduce((sum, room) => sum + Number(room.onlineCount || 0), 0).toString().padStart(2, "0")}</span><button className="text-button" onClick={() => setShowCreate((value) => !value)}>[ + 방 만들기 ]</button></div>
    {showCreate && <form className="editor-box" onSubmit={submit}>
      <label>만든 사람<input name="creator" maxLength={24} required /></label><label>극중 연도<select name="year" defaultValue="2012">{[2011, 2012, 2013, 2014, 2015].map((year) => <option key={year}>{year}</option>)}</select></label>
      <label className="wide">방 이름<input name="title" maxLength={60} required /></label><label className="wide">방 설명<input name="description" maxLength={240} /></label>
      {error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" onClick={() => setShowCreate(false)}>취소</button><button type="submit">만들기</button></div>
    </form>}
    <div className="chat-tabs"><button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>활성 방</button><button className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>지난 방</button></div>
    <div className="room-list">{visible.length ? visible.map((room, index) => <article key={room.id} className="room-row"><span className="room-number">ROOM {String(index + 1).padStart(2, "0")}</span><div><p className="room-year">[{room.storyYear}]</p><h2>{room.title}</h2><p>{room.description || "설명 없음"}</p><small>만든 사람: {room.creatorName} / 마지막 기록: {shortDate(room.lastMessageAt)}</small></div><div className="room-status"><strong>{room.onlineCount || 0}</strong><span>ONLINE</span><button onClick={() => onSelect(room.id)}>대화기록 보기</button></div></article>) : <div className="empty-box"><strong>{tab === "active" ? "활성 채팅방이 없어." : "닫힌 채팅방이 없어."}</strong><p>누구나 방을 만들 수 있고, 모든 대화는 텍스트 기록으로 남아.</p></div>}</div>
  </>;
}

function ChatRoom({ room, onBack }: { room: Room; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<{ displayName: string }[]>([]);
  const [joined, setJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState("");
  const sessionId = useRef<string>("");
  const logEnd = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const recent = loadedOnce.current ? "&recent=1" : "";
    const response = await fetch(`/api/community?resource=messages&roomId=${encodeURIComponent(room.id)}${recent}`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      const incoming = (data.messages ?? []) as ChatMessage[];
      if (loadedOnce.current) {
        setMessages((current) => {
          const known = new Set(current.map((message) => message.id));
          return [...current, ...incoming.filter((message) => !known.has(message.id))].slice(-5000);
        });
      } else {
        setMessages(incoming);
        loadedOnce.current = true;
      }
      setOnline(data.online ?? []);
    }
  }, [room.id]);

  useEffect(() => { load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { if (!joined) return; const timer = window.setInterval(() => apiPost({ action: "heartbeat", roomId: room.id, sessionId: sessionId.current, displayName }).catch(() => setJoined(false)), 30000); return () => window.clearInterval(timer); }, [joined, displayName, room.id]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget); const name = String(form.get("name") ?? "").trim();
    sessionId.current = crypto.randomUUID();
    try { await apiPost({ action: "join-room", roomId: room.id, sessionId: sessionId.current, displayName: name }); setDisplayName(name); setJoined(true); setShowJoin(false); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "입장하지 못했습니다."); }
  }

  async function leave() {
    await apiPost({ action: "leave-room", sessionId: sessionId.current }).catch(() => undefined); setJoined(false); setDisplayName(""); await load();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const body = String(form.get("message") ?? "").trim(); if (!body) return;
    try { await apiPost({ action: "send-message", roomId: room.id, sessionId: sessionId.current, displayName, body }); event.currentTarget.reset(); await load(); window.setTimeout(() => logEnd.current?.scrollIntoView({ behavior: "smooth" }), 20); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "메시지를 보내지 못했습니다."); }
  }

  return <><button className="back-link" onClick={onBack}>{"<-"} 채팅방 목록</button>
    <SectionTitle eyebrow={`CHAT LOG / ${room.storyYear}`} title={room.title} description={room.description || "이 방에는 설명이 없어."} />
    <div className="online-strip"><span>ONLINE {online.length.toString().padStart(2, "0")}</span><p>{online.length ? online.map((person) => person.displayName).join(" / ") : "현재 입장한 사람 없음"}</p></div>
    <div className="chat-log" aria-live="polite">{messages.length ? messages.map((message) => <article key={message.id}><header><strong>{message.authorName}</strong><time>{shortDate(message.createdAt)}</time></header><p>{message.body}</p></article>) : <p className="empty-log">— 아직 남은 대화가 없어 —</p>}<div ref={logEnd} /></div>
    {room.status === "closed" ? <div className="closed-room">이 방은 닫혔어. 기록만 볼 수 있어.</div> : joined ? <form className="message-form" onSubmit={send}><span>{displayName} &gt;</span><input name="message" aria-label="채팅 메시지" maxLength={1000} autoComplete="off" required /><button type="submit">전송</button><button type="button" onClick={leave}>퇴장하기</button></form> : <div className="join-panel"><p>지금은 대화기록 보기 상태야. ONLINE에는 표시되지 않아.</p><button className="primary-retro" onClick={() => setShowJoin(true)}>입장하기</button></div>}
    {showJoin && <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={join}><p className="eyebrow">ENTER CHATROOM</p><h2>채팅방에 들어갈 이름</h2><input name="name" maxLength={24} autoFocus required />{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" onClick={() => setShowJoin(false)}>취소</button><button type="submit">입장</button></div></form></div>}
    {error && !showJoin && <p className="form-error standalone">{error}</p>}
  </>;
}

function ChangesPage({ changes }: { changes: Change[] }) {
  return <><SectionTitle eyebrow="MATAEPEDIA / CHANGES" title="최근 변경" description="새로 생긴 기록과 채팅방을 시간순으로 확인한다." />
    <div className="change-log">{changes.length ? changes.map((item) => <article key={`${item.type}-${item.id}`}><time>{shortDate(item.changedAt)}</time><span>{item.type.toUpperCase()}</span><strong>{item.label}</strong><small>{item.actor}</small></article>) : <p className="empty-box">아직 변경 내역이 없어.</p>}</div>
  </>;
}
