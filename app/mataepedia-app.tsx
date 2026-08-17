"use client";

import { createContext, FormEvent, PointerEvent as ReactPointerEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type PageKey = "home" | "timeline" | "records" | "people" | "island" | "rumors" | "chat";
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
type Character = {
  id: string;
  name: string;
  summary: string;
  description: string;
  storyYear: number;
  imageDataUrl?: string | null;
  sortOrder?: number;
};
type Comment = {
  id: string;
  sectionId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
type SiteNotice = { body: string; updatedAt: string };

const pages: { key: PageKey; label: string; code: string }[] = [
  { key: "home", label: "대문", code: "00" },
  { key: "timeline", label: "연표", code: "01" },
  { key: "records", label: "우리 기록", code: "02" },
  { key: "people", label: "인물", code: "03" },
  { key: "island", label: "마태도", code: "04" },
  { key: "rumors", label: "소문", code: "05" },
  { key: "chat", label: "채팅", code: "06" },
];

const kindLabels = { diary: "일기", memo: "메모", guestbook: "방명록", rumor: "소문" } as const;
const storyYears = [2011, 2012, 2013, 2014, 2015] as const;
const characterYears = [2011, 2015] as const;
const schoolYears: Record<number, string> = {
  2011: "초등학교 3학년",
  2012: "초등학교 4학년",
  2013: "초등학교 5학년",
  2014: "초등학교 6학년",
  2015: "중학교 1학년",
};

type ConfirmRequest = { message: string; resolve: (confirmed: boolean) => void };
const ConfirmContext = createContext<((message: string) => Promise<boolean>) | null>(null);

function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback((message: string) => new Promise<boolean>((resolve) => setRequest({ message, resolve })), []);

  const finish = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, request]);

  return <ConfirmContext.Provider value={confirm}>
    {children}
    {request && <div className="modal-backdrop confirm-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) finish(false); }}>
      <section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-label="확인">
        <p className="eyebrow">MATAEPEDIA / CONFIRM</p>
        <h2>확인</h2>
        <p>{request.message}</p>
        <div className="form-actions"><button type="button" onClick={() => finish(false)}>취소</button><button type="button" onClick={() => finish(true)}>확인</button></div>
      </section>
    </div>}
  </ConfirmContext.Provider>;
}

function useSiteConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("ConfirmProvider가 필요합니다.");
  return confirm;
}

function RetroSoundControls() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.28);
  const audioContext = useRef<AudioContext | null>(null);
  const preferencesLoaded = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedEnabled = window.localStorage.getItem("mataepedia-sfx-enabled");
      const savedVolume = Number(window.localStorage.getItem("mataepedia-sfx-volume"));
      preferencesLoaded.current = true;
      if (savedEnabled !== null) setEnabled(savedEnabled === "true");
      if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) setVolume(savedVolume);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded.current) return;
    window.localStorage.setItem("mataepedia-sfx-enabled", String(enabled));
    window.localStorage.setItem("mataepedia-sfx-volume", String(volume));
  }, [enabled, volume]);

  const playClick = useCallback(() => {
    if (!enabled || volume <= 0) return;
    const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = audioContext.current ?? new Context();
    audioContext.current = context;
    if (context.state === "suspended") void context.resume();
    const duration = 0.026;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      const decay = 1 - index / samples.length;
      samples[index] = (Math.random() * 2 - 1) * decay;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1350;
    filter.Q.value = 0.7;
    gain.gain.value = Math.max(0.002, volume * 0.085);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }, [enabled, volume]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest("button, a, select, input[type='range'], input[type='file'], .upload-photo, .image-drop-field") : null;
      if (target) playClick();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [playClick]);

  return <div className="sound-controls" aria-label="효과음 설정">
    <button type="button" aria-pressed={enabled} onClick={() => setEnabled((current) => !current)}>SFX {enabled ? "ON" : "OFF"}</button>
    <label><span>VOL {Math.round(volume * 100).toString().padStart(2, "0")}</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="효과음 볼륨" disabled={!enabled} /></label>
  </div>;
}

function ImageUploadField({ imageDataUrl, name, index, onFile, busy = false, mode = "card" }: { imageDataUrl?: string | null; name: string; index: number; onFile: (file: File) => void; busy?: boolean; mode?: "card" | "form" }) {
  const [dragging, setDragging] = useState(false);
  const className = mode === "card" ? `character-photo upload-photo ${busy ? "busy" : ""} ${dragging ? "dragging" : ""}` : `image-drop-field ${dragging ? "dragging" : ""}`;

  function pick(file?: File) {
    if (file) onFile(file);
    setDragging(false);
  }

  return <label className={className} title="클릭하거나 이미지를 끌어다 놓기" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); pick(event.dataTransfer.files?.[0]); }}>
    {imageDataUrl ? <img src={imageDataUrl} alt={`${name || "새 인물"} 인물 이미지`} loading="lazy" decoding="async" /> : <span>{mode === "card" ? <>CLICK OR DROP TO UPLOAD<br />{String(index + 1).padStart(3, "0")}</> : <>이미지를 클릭하거나<br />여기에 끌어다 놓기</>}</span>}
    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { pick(event.target.files?.[0]); event.currentTarget.value = ""; }} disabled={busy} />
  </label>;
}

function ImageCropEditor({ file, onCancel, onApply }: { file: File; onCancel: () => void; onApply: (imageDataUrl: string) => void | Promise<void> }) {
  const size = 360;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clampOffset = useCallback((next: { x: number; y: number }, nextZoom = zoom) => {
    const image = imageRef.current;
    if (!image) return next;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * baseScale * nextZoom;
    const height = image.naturalHeight * baseScale * nextZoom;
    return {
      x: Math.max(-(width - size) / 2, Math.min((width - size) / 2, next.x)),
      y: Math.max(-(height - size) / 2, Math.min((height - size) / 2, next.y)),
    };
  }, [zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * baseScale * zoom;
    const height = image.naturalHeight * baseScale * zoom;
    context.clearRect(0, 0, size, size);
    context.drawImage(image, (size - width) / 2 + offset.x, (size - height) / 2 + offset.y, width, height);
  }, [offset, zoom]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setReady(true);
    };
    image.onerror = () => setError("이미지를 읽지 못했습니다.");
    image.src = url;
    return () => {
      imageRef.current = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => { if (ready) draw(); }, [draw, ready]);

  function pointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function pointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = size / bounds.width;
    setOffset(clampOffset({ x: drag.offsetX + (event.clientX - drag.x) * ratio, y: drag.offsetY + (event.clientY - drag.y) * ratio }));
  }

  async function apply() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setError("");
    try {
      let imageDataUrl = canvas.toDataURL("image/webp", 0.78);
      if (imageDataUrl.length > 240_000) imageDataUrl = canvas.toDataURL("image/webp", 0.62);
      if (imageDataUrl.length > 240_000) imageDataUrl = canvas.toDataURL("image/webp", 0.48);
      if (imageDataUrl.length > 240_000) throw new Error("이미지 용량이 너무 커. 크롭 범위를 바꿔 다시 시도해 줘.");
      await onApply(imageDataUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 처리하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop crop-backdrop" role="presentation">
    <section className="modal crop-modal" role="dialog" aria-modal="true" aria-label="인물 이미지 편집">
      <p className="eyebrow">IMAGE EDITOR / CROP</p>
      <h2>이미지 위치와 크기 맞추기</h2>
      <div className="crop-stage"><canvas ref={canvasRef} width={size} height={size} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} aria-label="드래그해서 이미지 위치 이동" /></div>
      <label className="zoom-control"><span>축소</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => { const nextZoom = Number(event.target.value); setZoom(nextZoom); setOffset((current) => clampOffset(current, nextZoom)); }} aria-label="이미지 확대 축소" /><span>확대</span></label>
      <p className="crop-help">이미지를 드래그해 위치를 옮기고, 막대로 크기를 조절해.</p>
      {error && <p className="form-error standalone">{error}</p>}
      <div className="form-actions"><button type="button" onClick={onCancel} disabled={saving}>취소</button><button type="button" onClick={apply} disabled={!ready || saving}>{saving ? "저장 중" : "이대로 사용"}</button></div>
    </section>
  </div>;
}

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

function storyDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (year && (month === "00" || day === "00")) return `${year} / 날짜 불명`;
  return value;
}

function recordCommentSectionId(id: string) {
  return id === "rumor-1" || id === "rumor-2" ? id : `record:${id}`;
}

function withoutDuplicateJoinMessages(messages: ChatMessage[]) {
  const enteredNames = new Set<string>();
  const joinSuffix = "님이 입장하셨습니다.";
  const leaveSuffix = "님이 퇴장하셨습니다.";

  return messages.filter((message) => {
    if (message.authorName !== "SYSTEM") return true;
    if (message.body.endsWith(joinSuffix)) {
      const name = message.body.slice(0, -joinSuffix.length);
      if (enteredNames.has(name)) return false;
      enteredNames.add(name);
    } else if (message.body.endsWith(leaveSuffix)) {
      enteredNames.delete(message.body.slice(0, -leaveSuffix.length));
    }
    return true;
  });
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
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [siteNotice, setSiteNotice] = useState<SiteNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/community", { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      const data = await response.json();
      setRooms(data.rooms ?? []);
      setRecords(data.records ?? []);
      setEvents(data.timelineEvents ?? []);
      setCharacters(data.characters ?? []);
      setSiteNotice(data.siteNotice ?? null);
      setNotice("");
    } catch {
      setNotice("자료를 불러오지 못했어. 잠시 뒤 다시 확인해 줘.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const go = (next: PageKey) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ConfirmProvider><div className="site-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => go("home")} aria-label="마태피아 대문으로">
          <span>MATAEPEDIA</span>
          <small>마태피아 // MATAEDO PRIVATE ARCHIVE</small>
        </button>
        <div className="topbar-tools">
          <RetroSoundControls />
          <div className="system-note">
            <span className="status-dot" /> SYSTEM ONLINE <span className="terminal-cursor" aria-hidden="true">█</span>
            <br />EST. 2011 / TEACHERS KEEP OUT
          </div>
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
        </aside>

        <main className="content" id="main-content" key={page}>
          {notice && <div className="notice-line">{notice}</div>}
          {loading ? <div className="terminal-loading">자료 불러오는 중<span>_</span></div> : null}
          {!loading && page === "home" && <HomePage go={go} rooms={rooms} records={records} siteNotice={siteNotice} onSaved={refresh} />}
          {!loading && page === "timeline" && <TimelinePage events={events} onSaved={refresh} />}
          {!loading && page === "records" && <RecordsPage records={records} onSaved={refresh} />}
          {!loading && page === "people" && <PeoplePage characters={characters} onSaved={refresh} />}
          {!loading && page === "island" && <IslandPage />}
          {!loading && page === "rumors" && <RumorsPage records={records.filter((item) => item.kind === "rumor")} onSaved={refresh} />}
          {!loading && page === "chat" && <ChatPage rooms={rooms} onSaved={refresh} />}
        </main>
      </div>

      <footer>
        <span>MATAEPEDIA BUILD 0.2</span>
        <span>TEXT FIRST / LOW BANDWIDTH MODE</span>
      </footer>
    </div></ConfirmProvider>
  );
}

function HomePage({ go, rooms, records, siteNotice, onSaved }: { go: (page: PageKey) => void; rooms: Room[]; records: RecordItem[]; siteNotice: SiteNotice | null; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeError, setNoticeError] = useState("");
  const guestbook = records.filter((item) => item.kind === "guestbook");
  const noticeBody = siteNotice?.body ?? "선생님들이랑 마을 사람들에게는 들키지 말자, 우리.";

  async function submitNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNoticeError("");
    try {
      await apiPost({ action: "update-notice", body: form.get("body") });
      setEditingNotice(false);
      await onSaved();
    } catch (caught) {
      setNoticeError(caught instanceof Error ? caught.message : "공지를 수정하지 못했습니다.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const author = String(form.get("author") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    setError("");
    try {
      await apiPost({
        action: editing ? "update-record" : "create-record",
        id: editing?.id,
        kind: "guestbook",
        title: `방명록 — ${author}`,
        body,
        authorName: author,
        storyDate: form.get("date"),
        ownerKey: localOwnerKey(),
      });
      formElement.reset();
      setEditing(null);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "방명록을 남기지 못했습니다.");
    }
  }

  async function remove(item: RecordItem) {
    if (!(await confirmDelete(`‘${item.authorName}’ 방명록을 삭제할까?`))) return;
    setError("");
    try {
      await apiPost({ action: "delete-record", id: item.id });
      if (editing?.id === item.id) setEditing(null);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "방명록을 삭제하지 못했습니다."); }
  }

  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / MAIN" title="마태피아에 온 걸 환영해." description="마태도에 관한 것이라면 뭐든 적어 두는 곳." />
      <section className="intro-grid">
        <div className="ascii-panel" aria-label="마태피아 문자 그림">
          <pre>{`┌──────────────────┐\n│  M A T A E D O   │\n│                  │\n│    ●       ●     │\n│        2011      │\n└──────────────────┘`}</pre>
        </div>
        <div className="welcome-copy">
          <div className="notice-heading"><h2>공지 / NOTICE</h2><button className="text-button" type="button" onClick={() => { setEditingNotice((value) => !value); setNoticeError(""); }}>[ {editingNotice ? "닫기" : "수정"} ]</button></div>
          {editingNotice ? <form className="notice-edit-form" onSubmit={submitNotice}>
            <label>공지 내용<textarea name="body" defaultValue={noticeBody} maxLength={500} required /></label>
            {noticeError && <p className="form-error">{noticeError}</p>}
            <div className="form-actions"><button type="button" onClick={() => { setEditingNotice(false); setNoticeError(""); }}>취소</button><button type="submit">수정 저장</button></div>
          </form> : <p>{noticeBody}</p>}
        </div>
      </section>
      <section className="quick-grid">
        <button onClick={() => go("timeline")}><small>01 / HISTORY</small><strong>2011년 이후 연표 보기</strong><span>사건 기록 {"->"}</span></button>
        <button onClick={() => go("records")}><small>02 / RECORDS</small><strong>새 기록 남기기</strong><span>일기·메모 {"->"}</span></button>
        <button onClick={() => go("chat")}><small>06 / CHAT</small><strong>채팅방 들어가기</strong><span>{rooms.length}개 방 / 기록 공개 {"->"}</span></button>
      </section>
      <section className="guestbook-section">
        <div className="guestbook-title"><h2>방명록 / GUESTBOOK</h2><span>한 줄만 남길 것</span></div>
        <form key={editing?.id ?? "new-guestbook"} className="guestbook-form" onSubmit={submit}>
          <label>날짜<input name="date" inputMode="numeric" placeholder="2012/03/14" pattern="20(11|12|13|14|15)/(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])" defaultValue={editing?.storyDate ?? ""} maxLength={10} required /></label>
          <label>이름<input name="author" defaultValue={editing?.authorName ?? ""} maxLength={24} placeholder="닉네임" required /></label>
          <label className="guestbook-line">한 줄<input name="body" defaultValue={editing?.body ?? ""} maxLength={160} placeholder="왔다 간 흔적" required /></label>
          <div className="guestbook-form-actions">{editing && <button type="button" onClick={() => setEditing(null)}>취소</button>}<button type="submit">{editing ? "수정 저장" : "남기기"}</button></div>
          {error && <p className="form-error">{error}</p>}
        </form>
        <div className="guestbook-list">
          {guestbook.length ? guestbook.slice(0, 30).map((item) => <article key={item.id}><time>{item.storyDate}</time><p>{item.body}</p><strong>{item.authorName}</strong><div className="guestbook-actions"><button onClick={() => setEditing(item)}>수정</button><button onClick={() => remove(item)}>삭제</button></div></article>) : <p className="empty">아직 방명록이 비어 있어.</p>}
        </div>
      </section>
    </>
  );
}

function TimelinePage({ events, onSaved }: { events: TimelineEvent[]; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState("");
  const grouped = useMemo(() => [2011, 2012, 2013, 2014, 2015].map((year) => ({ year, events: events.filter((item) => item.storyYear === year) })), [events]);

  function openEditor(item?: TimelineEvent) {
    setEditing(item ?? null);
    setShowForm(true);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiPost({
        action: editing ? "update-event" : "create-event",
        id: editing?.id,
        storyYear: Number(form.get("year")),
        title: form.get("title"),
        body: form.get("body"),
        authorName: form.get("author"),
        ownerKey: localOwnerKey(),
      });
      formElement.reset();
      setShowForm(false);
      setEditing(null);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장하지 못했습니다.");
    }
  }

  async function remove(item: TimelineEvent) {
    if (!(await confirmDelete(`‘${item.title}’ 사건과 댓글을 삭제할까?`))) return;
    try {
      await apiPost({ action: "delete-event", id: item.id, ownerKey: localOwnerKey() });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / TIMELINE" title="연표" description="2011년의 사건부터 2015년까지. 기억나는 일이 있으면 날짜가 정확하지 않아도 남겨 둘 것." />
      <div className="toolbar"><button className="text-button" onClick={() => { if (showForm) { setShowForm(false); setEditing(null); } else { openEditor(); } }}>[ {showForm ? "닫기" : "+ 사건 추가"} ]</button></div>
      {showForm && <form key={editing?.id ?? "new-event"} className="editor-box" onSubmit={submit}>
        <label>극중 연도<select name="year" defaultValue={editing?.storyYear ?? 2012}>{storyYears.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label>사건 제목<input name="title" defaultValue={editing?.title ?? ""} maxLength={100} required /></label>
        <label>기록한 사람<input name="author" defaultValue={editing?.authorName ?? ""} maxLength={24} required /></label>
        <label className="wide">사건 내용<textarea name="body" defaultValue={editing?.body ?? ""} maxLength={5000} required /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><button type="button" onClick={() => { setShowForm(false); setEditing(null); }}>취소</button><button type="submit">{editing ? "수정 저장" : "저장"}</button></div>
      </form>}
      {!showForm && error && <p className="form-error standalone">{error}</p>}
      <div className="timeline">
        {grouped.map((group) => <section key={group.year} className="year-block">
          <div className="year-marker"><strong>{group.year}</strong><span>{schoolYears[group.year]}</span></div>
          <div className="year-events">{group.events.length ? group.events.map((item) => <article key={item.id} className="timeline-entry">
            <h2>{item.title}</h2><p>{item.body}</p><small>기록: {item.authorName}</small>
            <div className="entry-actions"><button onClick={() => openEditor(item)}>수정</button><button onClick={() => remove(item)}>삭제</button></div>
            <CommentsSection sectionId={`timeline:${item.id}`} />
          </article>) : <p className="empty-year">— 아직 기록 없음 —</p>}</div>
        </section>)}
      </div>
    </>
  );
}

function RecordsPage({ records, onSaved }: { records: RecordItem[]; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [filter, setFilter] = useState<"diary" | "memo">("diary");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [error, setError] = useState("");
  const visible = records.filter((item) => item.kind === filter);

  function openEditor(item?: RecordItem) {
    setEditing(item ?? null);
    setSelected(null);
    setShowForm(true);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiPost({ action: editing ? "update-record" : "create-record", id: editing?.id, kind: form.get("kind"), title: form.get("title"), body: form.get("body"), authorName: form.get("author"), storyDate: form.get("date"), ownerKey: localOwnerKey() });
      formElement.reset();
      setShowForm(false);
      setEditing(null);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "저장하지 못했습니다."); }
  }

  async function remove(item: RecordItem) {
    if (!(await confirmDelete(`‘${item.title}’ 기록과 댓글을 삭제할까?`))) return;
    setError("");
    try {
      await apiPost({ action: "delete-record", id: item.id, ownerKey: localOwnerKey() });
      setSelected(null);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "기록을 삭제하지 못했습니다."); }
  }

  if (selected) return <RecordDocument record={selected} onBack={() => setSelected(null)} onEdit={() => openEditor(selected)} onDelete={() => remove(selected)} error={error} />;

  return (
    <>
      <SectionTitle eyebrow="MATAEPEDIA / RECORDS" title="우리 기록" />
      <div className="record-controls">
        <div className="filter-tabs">{(["diary", "memo"] as const).map((key) => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{kindLabels[key]}</button>)}</div>
        <button className="text-button" onClick={() => { if (showForm) { setShowForm(false); setEditing(null); } else { openEditor(); } }}>[ {showForm ? "닫기" : "+ 새 기록"} ]</button>
      </div>
      {showForm && <form key={editing?.id ?? "new-record"} className="editor-box" onSubmit={submit}>
        <label>분류<select name="kind" defaultValue={editing?.kind ?? filter}><option value="diary">일기</option><option value="memo">메모</option></select></label>
        <label>극중 날짜<input name="date" inputMode="numeric" placeholder="2011-00-00" pattern="20(11|12|13|14|15)-(0[0-9]|1[0-2])-(0[0-9]|[12][0-9]|3[01])" defaultValue={editing?.storyDate ?? "2012-01-01"} maxLength={10} required /></label>
        <label>작성자<input name="author" defaultValue={editing?.authorName ?? ""} maxLength={24} required /></label>
        <label className="wide">제목<input name="title" defaultValue={editing?.title ?? ""} maxLength={100} required /></label>
        <label className="wide">내용<textarea name="body" defaultValue={editing?.body ?? ""} maxLength={10000} required /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><button type="button" onClick={() => { setShowForm(false); setEditing(null); }}>취소</button><button type="submit">{editing ? "수정 저장" : "기록 남기기"}</button></div>
      </form>}
      {!showForm && error && <p className="form-error standalone">{error}</p>}
      <div className={`record-card-grid ${filter === "memo" ? "memo-grid" : "diary-grid"}`} aria-label="우리 기록 목록">
        {visible.length ? visible.map((item) => <article className={`record-card ${item.kind}`} key={item.id}>
          <button className="record-card-open" onClick={() => setSelected(item)}>
            <span>{storyDateLabel(item.storyDate)}</span><strong>{item.title}</strong><p>{item.body.slice(0, 150)}{item.body.length > 150 ? "…" : ""}</p><small>{item.authorName}</small>
          </button>
          <div className="record-card-actions"><button onClick={() => openEditor(item)}>[ 수정 ]</button><button onClick={() => remove(item)}>[ 삭제 ]</button></div>
        </article>) : <p className="empty table-empty">이 분류에는 아직 기록이 없어.</p>}
      </div>
    </>
  );
}

function RecordDocument({ record, onBack, onEdit, onDelete, error }: { record: RecordItem; onBack: () => void; onEdit: () => void; onDelete: () => void; error: string }) {
  return <>
    <div className="document-actions"><button className="back-link" onClick={onBack}>{"<-"} 기록 목록</button><div><button className="text-button" onClick={onEdit}>[ 기록 수정 ]</button><button className="text-button" onClick={onDelete}>[ 기록 삭제 ]</button></div></div>
    <SectionTitle eyebrow={`RECORD / ${kindLabels[record.kind]}`} title={record.title} description={`${storyDateLabel(record.storyDate)} / ${record.authorName}`} />
    <article className="document-body">{record.body.split("\n").map((line, index) => <p key={index}>{line || <>&nbsp;</>}</p>)}</article>
    {error && <p className="form-error standalone">{error}</p>}
    <CommentsSection sectionId={`record:${record.id}`} initiallyOpen />
  </>;
}

function CommentsSection({ sectionId, initiallyOpen = false }: { sectionId: string; initiallyOpen?: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [open, setOpen] = useState(initiallyOpen);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/community?resource=comments&sectionId=${encodeURIComponent(sectionId)}`, { cache: "no-store" });
    if (!response.ok) return;
    setComments((await response.json()).comments ?? []);
  }, [sectionId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");
    try {
      await apiPost({ action: "add-comment", sectionId, parentId: replyTo, authorName: form.get("author"), body: form.get("body"), ownerKey: localOwnerKey() });
      formElement.reset();
      setReplyTo(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "댓글을 저장하지 못했습니다."); }
  }

  const knownIds = new Set(comments.map((item) => item.id));
  const roots = comments.filter((item) => !item.parentId || !knownIds.has(item.parentId));

  return <section className={`comments-section ${open ? "open" : "collapsed"}`}>
    <div className="comments-heading titleless"><button className="text-button" onClick={() => setOpen((value) => !value)}>[ {open ? `댓글 닫기 · ${comments.length}` : "댓글 보기"} ]</button></div>
    {open && <>
      {roots.length ? roots.map((comment) => <CommentBranch key={comment.id} comment={comment} comments={comments} depth={0} onReply={setReplyTo} onChanged={load} onError={setError} />) : <p className="empty">아직 댓글이 없어.</p>}
      <form className="comment-form" onSubmit={submit}>
        {replyTo && <p className="replying">답글 쓰는 중 <button type="button" onClick={() => setReplyTo(null)}>취소</button></p>}
        <input name="author" aria-label="댓글 닉네임" placeholder="닉네임" maxLength={24} required />
        <textarea name="body" aria-label="댓글 내용" placeholder="할 말" maxLength={2000} required />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">남기기</button>
      </form>
    </>}
  </section>;
}

function CommentBranch({ comment, comments, depth, onReply, onChanged, onError }: { comment: Comment; comments: Comment[]; depth: number; onReply: (id: string) => void; onChanged: () => Promise<void>; onError: (message: string) => void }) {
  const children = comments.filter((item) => item.parentId === comment.id);
  return <div className={depth ? "reply" : "comment-thread"}>
    <CommentItem comment={comment} onReply={() => onReply(comment.id)} onChanged={onChanged} onError={onError} />
    {depth < 5 && children.map((child) => <CommentBranch key={child.id} comment={child} comments={comments} depth={depth + 1} onReply={onReply} onChanged={onChanged} onError={onError} />)}
  </div>;
}

function CommentItem({ comment, onReply, onChanged, onError }: { comment: Comment; onReply: () => void; onChanged: () => Promise<void>; onError: (message: string) => void }) {
  const confirmDelete = useSiteConfirm();
  const [editing, setEditing] = useState(false);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await apiPost({ action: "update-comment", id: comment.id, authorName: form.get("author"), body: form.get("body"), ownerKey: localOwnerKey() });
      setEditing(false);
      await onChanged();
    } catch (caught) { onError(caught instanceof Error ? caught.message : "댓글을 수정하지 못했습니다."); }
  }

  async function remove() {
    if (!(await confirmDelete("이 댓글과 아래 답글을 삭제할까?"))) return;
    try {
      await apiPost({ action: "delete-comment", id: comment.id, ownerKey: localOwnerKey() });
      await onChanged();
    } catch (caught) { onError(caught instanceof Error ? caught.message : "댓글을 삭제하지 못했습니다."); }
  }

  if (editing) return <form className="comment-edit-form" onSubmit={update}>
    <input name="author" aria-label="수정할 댓글 닉네임" defaultValue={comment.authorName} maxLength={24} required />
    <textarea name="body" aria-label="수정할 댓글 내용" defaultValue={comment.body} maxLength={2000} required />
    <div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="submit">수정 저장</button></div>
  </form>;

  return <article className="comment"><header><strong>{comment.authorName}</strong><time>{shortDate(comment.createdAt)}{comment.updatedAt !== comment.createdAt ? " · 수정됨" : ""}</time></header><p>{comment.body}</p><div className="comment-actions"><button onClick={onReply}>답글</button><button onClick={() => setEditing(true)}>수정</button><button onClick={remove}>삭제</button></div></article>;
}

function PeoplePage({ characters, onSaved }: { characters: Character[]; onSaved: () => Promise<void> }) {
  const [activeYear, setActiveYear] = useState<(typeof characterYears)[number]>(2011);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  function chooseImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 올릴 수 있어."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("원본 이미지가 너무 커. 20MB보다 작은 파일을 골라 줘."); return; }
    setError("");
    setCropFile(file);
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const storyYear = Number(form.get("year")) as (typeof characterYears)[number];
    try {
      await apiPost({ action: "save-character", id: `person-${crypto.randomUUID()}`, name: form.get("name"), summary: form.get("summary"), description: form.get("description"), storyYear, imageDataUrl: draftImage, sortOrder: characters.length, ownerKey: localOwnerKey() });
      formElement.reset();
      setDraftImage(null);
      setShowAdd(false);
      setActiveYear(storyYear);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "인물을 추가하지 못했습니다."); }
  }

  const activeCharacters = characters.filter((person) => (person.storyYear || 2011) === activeYear);

  return <>
    <SectionTitle eyebrow="MATAEPEDIA / PEOPLE" title="인물" description="마태도와 우리 주변 사람들. 누구나 인물을 추가하고, 사진과 설명을 고칠 수 있어." />
    <div className="toolbar"><button className="text-button" onClick={() => setShowAdd((value) => !value)}>[ {showAdd ? "닫기" : "+ 인물 추가"} ]</button></div>
    <div className="filter-tabs character-year-tabs" role="tablist" aria-label="인물 연도"><button className={activeYear === 2011 ? "active" : ""} role="tab" aria-selected={activeYear === 2011} onClick={() => setActiveYear(2011)}>2011년</button><button className={activeYear === 2015 ? "active" : ""} role="tab" aria-selected={activeYear === 2015} onClick={() => setActiveYear(2015)}>2015년</button></div>
    {showAdd && <form key={`add-${activeYear}`} className="editor-box character-add-form" onSubmit={add}>
      <label>이름<input name="name" maxLength={40} required /></label>
      <label>한 마디<input name="summary" maxLength={120} /></label>
      <label>극중 연도<select name="year" defaultValue={activeYear}>{characterYears.map((year) => <option key={year}>{year}</option>)}</select></label>
      <div className="character-image-field wide"><span>인물 이미지</span><ImageUploadField imageDataUrl={draftImage} name="새 인물" index={characters.length} onFile={chooseImage} mode="form" /><small>클릭하거나 드래그앤드롭한 뒤 확대·축소하고 크롭할 수 있어.</small></div>
      <label className="wide">인물 설명<textarea name="description" maxLength={6000} required /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions"><button type="button" onClick={() => setShowAdd(false)}>취소</button><button type="submit">인물 추가</button></div>
    </form>}
    <div className="character-years"><section className="character-year-section">
      <header className="character-year-heading"><p className="eyebrow">PERSON ARCHIVE / {activeYear}</p><h2>{activeYear}년</h2></header>
      <div className="character-grid">{activeCharacters.length ? activeCharacters.map((person) => <CharacterCard key={person.id} person={person} index={characters.findIndex((item) => item.id === person.id)} onSaved={onSaved} />) : <div className="empty-box">{activeYear}년에 등록된 인물이 없어.</div>}</div>
    </section></div>
    {cropFile && <ImageCropEditor file={cropFile} onCancel={() => setCropFile(null)} onApply={(imageDataUrl) => { setDraftImage(imageDataUrl); setCropFile(null); }} />}
  </>;
}

function CharacterCard({ person, index, onSaved }: { person: Character; index: number; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);

  async function save(values: Partial<Character>) {
    setBusy(true); setError("");
    try {
      await apiPost({
        action: "save-character",
        id: person.id,
        name: values.name ?? person.name,
        summary: values.summary ?? person.summary,
        description: values.description ?? person.description,
        storyYear: values.storyYear ?? person.storyYear ?? 2011,
        imageDataUrl: values.imageDataUrl ?? null,
        sortOrder: person.sortOrder ?? index,
        ownerKey: localOwnerKey(),
      });
      await onSaved();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "인물 문서를 저장하지 못했습니다.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function chooseImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 올릴 수 있어."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("원본 이미지가 너무 커. 20MB보다 작은 파일을 골라 줘."); return; }
    setError("");
    setCropFile(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await save({ name: String(form.get("name") ?? ""), summary: String(form.get("summary") ?? ""), description: String(form.get("description") ?? ""), storyYear: Number(form.get("year")) });
    if (saved) setEditing(false);
  }

  async function remove() {
    if (!(await confirmDelete(`‘${person.name}’ 인물 문서와 댓글을 삭제할까?`))) return;
    try {
      await apiPost({ action: "delete-character", id: person.id });
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "인물을 삭제하지 못했습니다."); }
  }

  return <article className="character-card">
    <ImageUploadField imageDataUrl={person.imageDataUrl} name={person.name} index={index} onFile={chooseImage} busy={busy} />
    <div className="character-content"><p className="eyebrow">PERSON FILE / {String(index + 1).padStart(3, "0")}</p>
      {editing ? <form className="character-editor" onSubmit={submit}><label>이름<input name="name" defaultValue={person.name} maxLength={40} required /></label><label>한 마디<input name="summary" defaultValue={person.summary} maxLength={120} /></label><label>극중 연도<select name="year" defaultValue={person.storyYear ?? 2011}>{characterYears.map((year) => <option key={year}>{year}</option>)}</select></label><label>인물 설명<textarea name="description" defaultValue={person.description} maxLength={6000} /></label><div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="submit" disabled={busy}>저장</button></div></form> : <><h2>{person.name}</h2><strong>{person.summary}</strong><p className="character-description">{person.description}</p><div className="entry-actions"><button onClick={() => setEditing(true)}>수정</button><button onClick={remove}>삭제</button></div></>}
      {error && <p className="form-error standalone">{error}</p>}
    </div>
    <CommentsSection sectionId={`character-${person.id}`} />
    {cropFile && <ImageCropEditor file={cropFile} onCancel={() => setCropFile(null)} onApply={async (imageDataUrl) => { const saved = await save({ imageDataUrl }); if (saved) setCropFile(null); }} />}
  </article>;
}

function LegacyDocument({ sectionId, title, year, children }: { sectionId: string; title: string; year?: number; children: ReactNode }) {
  return <article className="legacy-document"><div className="legacy-document-heading"><h2>{title}</h2>{year && <time>{year}</time>}</div><div className="legacy-document-body">{children}</div><CommentsSection sectionId={sectionId} /></article>;
}

function IslandPage() {
  return <>
    <SectionTitle eyebrow="MATAEPEDIA / MATAEDO" title="마태도" description="우리가 사는 섬. 지도에 없는 길이나 어른들이 모르는 장소도 기록한다." />
    <LegacyDocument sectionId="world-map" title="마태도 지도"><img className="legacy-map" src="/legacy/mataedo_map.jpg" alt="마태도 지도" loading="lazy" decoding="async" /><p>사목리와 사목항, 학교, 공소, 괴불림과 마두산까지 표시해 둔 지도야.</p></LegacyDocument>
    <LegacyDocument sectionId="world-1" title="마태도 기본 정보"><p>마태도는 전라남도 완도군 보길도에서 남서쪽으로 약 20km 떨어진 섬이야. 행정구역상으로는 마태면 전체를 차지하고 있어.</p><p>면적은 약 38.47㎢, 인구는 약 4천여 명 정도야. 도서관, 체육관, 초중고 교육기관도 있고 말, 콩, 보리, 김, 해조류가 특산물이야.</p></LegacyDocument>
    <LegacyDocument sectionId="world-2" title="교통 정보"><p>해남에서는 바로 들어오는 배편이 없고, 완도선착장에서 사흘에 한 번 뜨는 배를 타야 해. 사목항까지 약 1시간 30분 걸려.</p><p>섬 안에는 택시나 렌트가 없고 한 시간에 한 번 정도 다니는 마을버스뿐이야.</p></LegacyDocument>
    <section className="wiki-section"><h2>마태도 일람</h2></section>
    <LegacyDocument sectionId="world-samokri" title="사목리와 사목항"><p>사목리는 섬 북동쪽의 중심 마을이야. 약 1천 가구가 있고 섬 인구의 절반 이상이 살아. 토박이들은 이곳을 그냥 ‘읍내’라고 부르기도 해.</p><p>사목항은 마태도의 유일한 선착장이자 관광객이 들어오는 관문이야. 배가 매일 다니지 않아서 섬 밖에 나갈 일이 있으면 날짜부터 맞춰야 해.</p></LegacyDocument>
    <LegacyDocument sectionId="world-samok-facilities" title="사목리 생활시설"><p>면사무소, 경찰서, 도서관, 체육관, 피시방과 작은 가게들이 사목리 생활권에 모여 있어.</p><p>필요한 것은 웬만큼 구할 수 있지만 육지에서 보던 유명 체인점은 거의 없어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-school" title="마태 초중고등학교"><p>마태도에 하나뿐인 학교야. 초등학교, 중학교, 고등학교가 한 건물에 함께 있고 학생 수가 적어서 서로 얼굴을 거의 다 알아.</p><p>쓰지 않는 교실도 여럿 있어. 밤에는 들어가지 말라는 말이 많지만, 낮에는 운동장과 빈 교실이 아이들 놀이터가 되기도 해.</p></LegacyDocument>
    <LegacyDocument sectionId="world-office" title="마태면사무소"><p>섬의 행정과 안내 방송을 맡는 곳이야. 도봉남 면장이 일하고 있어.</p><p>해가 진 뒤 비가 올 것 같으면 여기서 귀가하라는 방송이 나와. 이상하게도 실제 비가 내리기 약 5분 전에 들릴 때가 많아.</p></LegacyDocument>
    <LegacyDocument sectionId="world-gongso" title="완도성당 마태 공소"><p>사목리 동쪽에 있는 큰 공소야. 신부님이 늘 머무는 곳은 아니고, 미사뿐 아니라 마을 행사와 회의, 교리 공부에도 쓰여.</p><p>관리실과 상주 관리인이 있고, 섬 안쪽의 마태오 순교성지와 이어지는 이야기가 많아.</p></LegacyDocument>
    <LegacyDocument sectionId="world-tourism" title="마태면 관광안내소"><p>사목항에서 내리면 바로 보이는 작은 1층 안내소야. 사목리 약도와 공소, 말총곶, 괴불림, 말 목장, 순교성지의 관광 자료를 구할 수 있어.</p><p>아르바이트생 현우성은 섬길과 관광지에 관해서는 잘 알려 주는 편이야. 마태도의 이상한 소문까지 전부 아는 사람은 아니야.</p></LegacyDocument>
    <LegacyDocument sectionId="world-creek" title="학교 아래 냇가"><p>학교에서 마을로 내려가는 길 옆에 있는 얕은 냇가야. 평소에는 아이들이 들여다보거나 건너 다니는 평범한 곳이야.</p><p>2011년 어느 날 물이 피처럼 붉게 변한 적이 있어. 왜 그랬는지는 누구도 제대로 설명하지 않았어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-gwebullim" title="괴불림"><p>마을 바깥에서 마태오 순교성지 쪽으로 이어지는 숲이야. 길이 복잡하고 비가 오면 방향을 잃기 쉬워.</p><p>학교와 면사무소에서는 해가 진 뒤 들어가지 말라고 해. 특히 비 오는 밤에는 가까이 가지 않는 게 마태도의 오래된 규칙이야.</p></LegacyDocument>
    <LegacyDocument sectionId="world-shrine" title="마태오 순교성지"><p>사목리에서 걸어서 약 20분, 괴불림 안쪽 언덕 너머에 있는 오래된 순교성지야. 한옥 여러 채로 이루어진 관광지지만 사목리에서 바로 이어지는 찻길은 없어.</p><p>마태도의 천주교 역사와 순교자들을 기리는 곳으로 알려져 있어. 낮에도 일부 구역은 들어가지 못하게 막는 때가 있어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-martyr-story" title="마태도에서 전하는 순교 이야기"><p>관광자료에는 마튜 샤르보노 신부가 1832년 마태도에 정착해 천주교를 전했고, 1842년에 열세 명과 함께 순교했다고 적혀 있어.</p><p>이건 섬과 순교성지가 공식적으로 소개하는 이야기야. 오래된 기록이 전부 남아 있는지는 확인하지 못했어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-obang-cross" title="오방십자가"><p>보통 십자가보다 조금 크고, 다섯 가지 전통 오방색으로 칠한 십자가야. 마태도 신자들 중에는 이 십자가를 지니고 다니는 사람이 많아.</p><p>천주교 신앙과 섬의 오래된 민간신앙이 섞여 만들어진 마태도만의 물건이라고 알려져 있어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-duiju" title="집집마다 있는 뒤주"><p>직사각형 나무 상자처럼 생긴 오래된 가구야. 마태도에서는 아직도 거의 모든 집에서 하나씩 볼 수 있어.</p><p>관광자료에는 1842년의 열세 순교자를 기리는 전통이라고 적혀 있어. 사람 한 명이 웅크리고 들어갈 만큼 큰 것도 있고, 낯선 표시가 새겨진 것도 있어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-horse-ranch" title="말 목장"><p>관광안내도에도 표시되는 지역 명소이자 마태도 특산업의 중심이야. 섬에서는 말을 기르고 파는 일이 오래전부터 이어졌어.</p><p>박해주 부녀회장이 목장주로 알려져 있어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-lighthouse" title="말총곶과 등대"><p>말총곶은 섬 남쪽으로 말꼬리처럼 길게 뻗은 곶이야. 끝에는 낡은 2층 등대가 있어.</p><p>밤이면 물귀신 노랫소리가 들린다는 괴담이 있지만 직접 확인했다는 사람은 드물어.</p></LegacyDocument>
    <LegacyDocument sectionId="world-madusan" title="마두산"><p>사목리 남쪽에 있는 큰 산이야. 등산할 수 있지만 특별한 관광 시설은 없어.</p><p>산의 정기를 받으면 시험을 잘 본다는 말이 아이들 사이에서 돌아.</p></LegacyDocument>
    <LegacyDocument sectionId="world-5" title="마태도의 금기"><p className="document-alert">해가 진 뒤 비가 내리는 밤에는 함부로 밖에 나가지 않는 것.</p><p>섬 곳곳에는 “落日沈現律 落水昇藏律”이라는 문구가 적혀 있어. 해가 지면 인간 세상의 율법이 약해지고, 비가 오면 숨겨진 율법이 드러난다는 뜻이라고 해.</p><p>면사무소에서는 밤에 비가 오기 약 5분 전에 경고방송을 해.</p></LegacyDocument>
  </>;
}

function RumorsPage({ records, onSaved }: { records: RecordItem[]; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [error, setError] = useState("");

  function openEditor(item?: RecordItem) {
    setEditing(item ?? null);
    setShowForm(true);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const year = String(form.get("year") ?? "2011");
    const storyDate = editing ? `${year}${editing.storyDate.slice(4)}` : `${year}-01-01`;
    setError("");
    try {
      await apiPost({ action: editing ? "update-record" : "create-record", id: editing?.id, kind: "rumor", title: form.get("title"), body: form.get("body"), authorName: form.get("author"), storyDate, ownerKey: localOwnerKey() });
      formElement.reset();
      setShowForm(false);
      setEditing(null);
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "소문을 남기지 못했습니다."); }
  }

  async function remove(item: RecordItem) {
    if (!(await confirmDelete(`‘${item.title}’ 소문과 댓글을 삭제할까?`))) return;
    setError("");
    try {
      await apiPost({ action: "delete-record", id: item.id });
      if (editing?.id === item.id) { setEditing(null); setShowForm(false); }
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "소문을 삭제하지 못했습니다."); }
  }

  return <>
    <SectionTitle eyebrow="MATAEPEDIA / RUMORS" title="소문" description="사실인지 아닌지 모르는 이야기. 들은 대로 적되 사실이라고 단정하지 말 것." />
    <div className="toolbar"><button className="text-button" onClick={() => { if (showForm) { setShowForm(false); setEditing(null); } else { openEditor(); } }}>[ {showForm ? "닫기" : "+ 소문 남기기"} ]</button></div>
    {showForm && <form key={editing?.id ?? "new-rumor"} className="editor-box" onSubmit={submit}>
      <label>극중 연도<select name="year" defaultValue={editing?.storyDate.slice(0, 4) ?? "2011"}>{storyYears.map((year) => <option key={year}>{year}</option>)}</select></label>
      <label>작성자<input name="author" defaultValue={editing?.authorName ?? ""} maxLength={24} required /></label>
      <label className="wide">소문 제목<input name="title" defaultValue={editing?.title ?? ""} maxLength={100} required /></label>
      <label className="wide">소문 내용<textarea name="body" defaultValue={editing?.body ?? ""} maxLength={10000} required /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions"><button type="button" onClick={() => { setShowForm(false); setEditing(null); }}>취소</button><button type="submit">{editing ? "수정 저장" : "소문 남기기"}</button></div>
    </form>}
    {!showForm && error && <p className="form-error standalone">{error}</p>}
    <section className="wiki-section"><h2>소문 목록</h2><div className="rumor-list">{records.length ? records.map((item) => <article key={item.id}><div><div className="rumor-heading"><h2>{item.title}</h2><time>{item.storyDate.slice(0, 4)}</time></div><p>{item.body}</p><small>{item.authorName}</small><div className="entry-actions"><button onClick={() => openEditor(item)}>수정</button><button onClick={() => remove(item)}>삭제</button></div><CommentsSection sectionId={recordCommentSectionId(item.id)} /></div></article>) : <div className="empty-box"><strong>등록된 소문 없음</strong><p>위의 ‘소문 남기기’에서 연도를 골라 적어 줘.</p></div>}</div></section>
  </>;
}

function ChatPage({ rooms, onSaved }: { rooms: Room[]; onSaved: () => Promise<void> }) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  if (selectedRoom) return <ChatRoom room={selectedRoom} onBack={() => { setSelectedRoomId(null); onSaved(); }} />;
  return <ChatLobby rooms={rooms} onSelect={setSelectedRoomId} onSaved={onSaved} />;
}

function ChatLobby({ rooms, onSelect, onSaved }: { rooms: Room[]; onSelect: (id: string) => void; onSaved: () => Promise<void> }) {
  const confirmDelete = useSiteConfirm();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [error, setError] = useState("");
  const visibleYears = tab === "active" ? [2015] : [2011, 2012, 2013, 2014];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await apiPost({ action: "create-room", title: form.get("title"), description: form.get("description"), creatorName: form.get("creator"), storyYear: Number(form.get("year")), ownerKey: localOwnerKey() });
      formElement.reset();
      setShowCreate(false);
      await onSaved();
      if (typeof result.id === "string") onSelect(result.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "방을 만들지 못했습니다."); }
  }

  async function remove(room: Room) {
    if (!(await confirmDelete(`‘${room.title}’ 방과 모든 대화 기록을 삭제할까?`))) return;
    try {
      await apiPost({ action: "delete-room", id: room.id, ownerKey: localOwnerKey() });
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "방을 삭제하지 못했습니다."); }
  }

  return <>
    <SectionTitle eyebrow="MATAEPEDIA / CHAT" title="채팅" description="대화 기록은 누구나 읽을 수 있어. 말을 하려면 방에 입장해야 해." />
    <div className="chat-summary"><span>ROOMS {rooms.length.toString().padStart(2, "0")}</span><span>ONLINE {rooms.reduce((sum, room) => sum + Number(room.onlineCount || 0), 0).toString().padStart(2, "0")}</span><button className="text-button" onClick={() => setShowCreate((value) => !value)}>[ + 방 만들기 ]</button></div>
    {showCreate && <form className="editor-box" onSubmit={submit}>
      <label>만든 사람<input name="creator" maxLength={24} required /></label><label>극중 연도<select name="year" defaultValue="2015">{storyYears.map((year) => <option key={year}>{year}</option>)}</select></label>
      <label className="wide">방 이름<input name="title" maxLength={60} required /></label><label className="wide">방 설명<input name="description" maxLength={240} /></label>
      {error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" onClick={() => setShowCreate(false)}>취소</button><button type="submit">만들기</button></div>
    </form>}
    {!showCreate && error && <p className="form-error standalone">{error}</p>}
    <div className="chat-tabs"><button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>활성 방</button><button className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>지난 방</button></div>
    <div className="chat-year-groups">{visibleYears.map((year) => {
      const yearRooms = rooms.filter((room) => room.storyYear === year);
      return <section className="chat-year-section" key={year}>
        <header className="chat-year-heading"><strong>{year}년</strong><span>{schoolYears[year]}</span></header>
        <div className="room-list">{yearRooms.length ? yearRooms.map((room, index) => <article key={room.id} className="room-row"><span className="room-number">ROOM {String(index + 1).padStart(2, "0")}</span><div><p className="room-year">[{room.storyYear}]</p><h2>{room.title}</h2><p>{room.description || "설명 없음"}</p><small>만든 사람: {room.creatorName} / 마지막 기록: {shortDate(room.lastMessageAt)}</small></div><div className="room-status"><strong>{room.onlineCount || 0}</strong><span>ONLINE</span><div><button onClick={() => onSelect(room.id)}>대화기록 보기</button><button onClick={() => remove(room)}>방 삭제</button></div></div></article>) : <div className="empty-box compact"><strong>— {year}년 방 없음 —</strong></div>}</div>
      </section>;
    })}</div>
  </>;
}

function ChatRoom({ room, onBack }: { room: Room; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<{ displayName: string }[]>([]);
  const [joined, setJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const sessionId = useRef<string>("");
  const logEnd = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);
  const visibleMessages = useMemo(() => withoutDuplicateJoinMessages(messages), [messages]);

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
  useEffect(() => {
    if (!joined) return;
    return () => {
      if (!sessionId.current) return;
      const data = new Blob([JSON.stringify({ action: "leave-room", sessionId: sessionId.current, announce: false })], { type: "application/json" });
      navigator.sendBeacon("/api/community", data);
    };
  }, [joined]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (joining) return;
    const form = new FormData(event.currentTarget); const name = String(form.get("name") ?? "").trim();
    sessionId.current = crypto.randomUUID();
    setJoining(true);
    try { await apiPost({ action: "join-room", roomId: room.id, sessionId: sessionId.current, displayName: name }); setDisplayName(name); setJoined(true); setShowJoin(false); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "입장하지 못했습니다."); }
    finally { setJoining(false); }
  }

  async function leave(refresh = true, announce = true) {
    await apiPost({ action: "leave-room", sessionId: sessionId.current, announce }).catch(() => undefined); setJoined(false); setDisplayName(""); if (refresh) await load();
  }

  async function backToList() {
    if (joined) await leave(false, false);
    onBack();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement); const body = String(form.get("message") ?? "").trim(); if (!body) return;
    try { await apiPost({ action: "send-message", roomId: room.id, sessionId: sessionId.current, displayName, body }); formElement.reset(); await load(); window.setTimeout(() => logEnd.current?.scrollIntoView({ behavior: "smooth" }), 20); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "메시지를 보내지 못했습니다."); }
  }

  return <>
    <button className="back-link" onClick={backToList}>{"<-"} 채팅방 목록</button>
    <SectionTitle eyebrow={`CHAT LOG / ${room.storyYear}`} title={room.title} description={room.description || "이 방에는 설명이 없어."} />
    <div className="online-strip"><span>ONLINE {online.length.toString().padStart(2, "0")}</span><p>{online.length ? online.map((person) => person.displayName).join(" / ") : "현재 입장한 사람 없음"}</p></div>
    <div className="chat-log" aria-live="polite">{visibleMessages.length ? visibleMessages.map((message) => <article key={message.id} className={message.authorName === "SYSTEM" ? "system-message" : ""}><header><strong>{message.authorName === "SYSTEM" ? "SYSTEM" : message.authorName}</strong></header><p>{message.body}</p></article>) : <p className="empty-log">— 아직 남은 대화가 없어 —</p>}<div ref={logEnd} /></div>
    {room.status === "closed" ? <div className="closed-room">이 방은 닫혔어. 기록만 볼 수 있어.</div> : joined ? <form className="message-form" onSubmit={send}><span>{displayName} &gt;</span><input name="message" aria-label="채팅 메시지" maxLength={1000} autoComplete="off" required /><button type="submit">전송</button><button type="button" onClick={() => leave()}>퇴장하기</button></form> : <div className="join-panel"><button className="primary-retro" onClick={() => setShowJoin(true)}>입장하기</button></div>}
    {showJoin && <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={join}><p className="eyebrow">ENTER CHATROOM</p><h2>채팅방에 들어갈 이름</h2><input name="name" maxLength={24} required />{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" onClick={() => setShowJoin(false)}>취소</button><button type="submit" disabled={joining}>{joining ? "입장 중" : "입장"}</button></div></form></div>}
    {error && !showJoin && <p className="form-error standalone">{error}</p>}
  </>;
}
