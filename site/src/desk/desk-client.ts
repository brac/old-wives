// Client for the review desk page. Talks only to the local API at /_desk/api.
// Dictation: hold or tap the talk button. It uses the Web Speech API when the browser has
// it, otherwise (or with the Whisper toggle on, or after speech fails) the recorded audio
// is posted to the local API, which sends it to fal and returns text. talk-path.ts picks.

import { chooseTalkPath, switchesToWhisper } from "./talk-path.ts";

const API = "/_desk/api";
const app = document.getElementById("app")!;
const titleEl = document.getElementById("title")!;
const whisperBox = document.getElementById("whisper") as HTMLInputElement;
const full = document.getElementById("full") as HTMLDivElement;

type Op = { op: "same" | "del" | "add"; text: string };
type Cand = { source: string; image: string };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const img = (p: string) => `${API}/file?p=${encodeURIComponent(p)}`;

function store(key: string, value?: string): string | null {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
whisperBox.checked = store("desk.whisper") === "on";
whisperBox.onchange = () => store("desk.whisper", whisperBox.checked ? "on" : "off");

async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(API + path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? r.statusText);
  return data;
}

full.onclick = () => (full.style.display = "none");
function showFull(src: string) {
  (full.querySelector("img") as HTMLImageElement).src = src;
  full.style.display = "block";
}

let lastBatch = "1";

function cardBody(r: any): string {
  if (r.thumb) return `<img loading="lazy" src="${img(r.thumb)}" alt="">`;
  return `<div class="muted noimg">${r.has_text ? "no image yet: queue a redraw" : "needs your visual text"}</div>`;
}

async function batchView(key: string) {
  lastBatch = key;
  titleEl.textContent = key === "pilot" ? "pilot" : `batch ${key}`;
  const [summary, rows] = await Promise.all([api<any[]>("/batches"), api<any[]>(`/batch?batch=${encodeURIComponent(key)}`)]);
  const tabs = summary
    .map(
      (b) => `<a class="tab${b.batch === key ? " on" : ""}" href="#/b/${esc(b.batch)}">${esc(b.label)} <small>${b.count} · ${b.approved} approved</small></a>`,
    )
    .join("");
  app.innerHTML = `<nav class="tabs">${tabs}</nav><div class="sheet">${rows
    .map(
      (r) => `<a class="card" href="#/c/${esc(r.id)}">${cardBody(r)}
      <div>${esc(r.name)}</div><div class="state ${r.state.split(" ")[0]}">${esc(r.state)} · $${r.spend_usd.toFixed(2)}</div></a>`,
    )
    .join("") || "<p class='muted'>no creatures in this batch</p>"}</div>`;
}

function renderDiff(ops: Op[]): string {
  return ops.map((o) => (o.op === "same" ? esc(o.text) : o.op === "add" ? `<ins>${esc(o.text)}</ins>` : `<del>${esc(o.text)}</del>`)).join(" ");
}

async function creatureView(id: string) {
  const c = await api<any>(`/creature?id=${encodeURIComponent(id)}`);
  const cfg = await api<any>("/config");
  titleEl.textContent = `${c.name} · ${c.state}`;
  const current: string = c.visual?.text ?? c.draft?.text ?? "";
  const cands: Cand[] = c.candidates.items;
  app.innerHTML = `
  <section><h2>Candidates <small>${esc(c.candidates.iteration ?? "none")}</small></h2>
    <div class="cands">${cands
      .map(
        (k) => `<figure><img loading="lazy" class="${c.pick?.source === k.source ? "picked" : ""}" src="${img(k.image)}" data-full="${img(k.image)}" alt="">
        <figcaption><small>${esc(k.source.split("/").pop())}</small> <button data-approve="${esc(k.source)}">Approve</button></figcaption></figure>`,
      )
      .join("")}</div></section>
  <section><h2>Visual text</h2>
    ${c.visual ? `<p>${esc(c.visual.text)}</p><p class="muted">negative_extra: ${esc(c.visual.negative_extra ?? "none")} · ${esc(c.visual.by)} ${esc(c.visual.date)}</p>` : `<div class="draft"><b>${esc(c.draft.label)}</b><p>${esc(c.draft.text)}</p></div>`}
  </section>
  <section><h2>Note</h2>
    <button class="talk" id="talk">Hold or tap to talk</button> <small id="talkstate"></small>
    <textarea id="note" placeholder="Say or type what to change"></textarea>
    <button class="primary" id="apply">Apply note</button>
    <small>${esc(cfg.note_model)} via ${esc(cfg.note_endpoint)} · spent $${cfg.llm_spend_usd.toFixed(4)} of $${cfg.llm_cap_usd}</small>
    <div id="result"></div>
  </section>
  <section><h2>Edit directly</h2>
    <textarea id="direct">${esc(current)}</textarea>
    <button id="acceptDirect">Accept as my text</button>
  </section>
  <section><h2>Actions</h2>
    <button id="redraw" ${c.can_generate ? "" : "disabled title='edit the agent draft first'"}>Queue redraw</button>
    <button id="run">Run queue</button><button id="skip">Skip</button><button id="flag">Flag…</button>
    <span class="muted">spend for this creature: $${c.spend_usd.toFixed(3)} · headroom $${c.plate_headroom_usd.toFixed(3)} of the $${c.plate_cap_usd.toFixed(2)} plate cap (queued redraws count; one redraw est. $${c.redraw_estimate_usd.toFixed(2)})${cfg.dry_run ? " · redraws are dry runs" : ""}</span>
    <div id="jobs">${jobsHtml(c.history.jobs)}</div>
  </section>
  <section><h2>Sourced appearance</h2><ul>${c.appearance.map((a: any) => `<li>${esc(a.text)} <small>${esc(a.cites.join(", "))}</small></li>`).join("")}</ul></section>
  <section><h2>References <small>local only</small></h2><div class="refs">${c.refs.map((r: string) => `<img loading="lazy" src="${img(r)}" data-full="${img(r)}" alt="">`).join("") || "<span class='muted'>none</span>"}</div></section>
  <section><h2>History</h2><ul>
    ${c.history.human_edits.map((e: any) => `<li>${esc(e.date)} edit: “${esc(e.note)}”</li>`).join("")}
    ${c.history.drop.map((e: any) => `<li>${esc(e.date)} dropped: ${esc(e.text)} (${esc(e.reason)})</li>`).join("")}
    ${c.history.llm_calls.map((e: any) => `<li>${esc(e.date.slice(0, 16))} note → ${esc(e.model)} $${Number(e.cost_usd).toFixed(5)}: “${esc(e.note)}”</li>`).join("")}
    ${c.history.flags.map((e: any) => `<li>${esc(e.date)} flag: ${esc(e.text)}</li>`).join("")}
  </ul></section>`;

  app.querySelectorAll<HTMLImageElement>("img[data-full]").forEach((el) => (el.onclick = () => showFull(el.dataset.full!)));
  app.querySelectorAll<HTMLButtonElement>("button[data-approve]").forEach(
    (b) => (b.onclick = () => act(() => api("/approve", { id, source: b.dataset.approve }), id)),
  );
  const note = app.querySelector<HTMLTextAreaElement>("#note")!;
  setupTalk(app.querySelector<HTMLButtonElement>("#talk")!, note, app.querySelector("#talkstate")!);

  app.querySelector<HTMLButtonElement>("#apply")!.onclick = async () => {
    const out = app.querySelector("#result")!;
    out.innerHTML = "<p class='muted'>asking the model…</p>";
    try {
      const r = await api<any>("/note", { id, note: note.value, text: current });
      out.innerHTML = `<div class="diff">${renderDiff(r.diff)}</div><small>${esc(r.model)} · $${r.cost_usd.toFixed(5)}</small>
        <textarea id="revised">${esc(r.revised)}</textarea>
        <button class="primary" id="accept">Accept</button><button id="reject">Reject</button>`;
      out.querySelector<HTMLButtonElement>("#accept")!.onclick = () =>
        act(() => api("/accept", { id, text: out.querySelector<HTMLTextAreaElement>("#revised")!.value, note: note.value }), id);
      out.querySelector<HTMLButtonElement>("#reject")!.onclick = () => (out.innerHTML = "<p class='muted'>rejected; nothing written</p>");
    } catch (e) {
      out.innerHTML = `<p>${esc((e as Error).message)}</p>`;
    }
  };
  app.querySelector<HTMLButtonElement>("#acceptDirect")!.onclick = () =>
    act(() => api("/accept", { id, text: app.querySelector<HTMLTextAreaElement>("#direct")!.value, note: note.value || "(typed directly)" }), id);
  app.querySelector<HTMLButtonElement>("#redraw")!.onclick = () => act(() => api("/redraw", { id }), id);
  app.querySelector<HTMLButtonElement>("#run")!.onclick = () => act(() => api("/run", {}), id).then(() => poll(id));
  app.querySelector<HTMLButtonElement>("#skip")!.onclick = () => act(() => api("/skip", { id }), id);
  app.querySelector<HTMLButtonElement>("#flag")!.onclick = () => {
    const text = prompt("Flag for the report");
    if (text) act(() => api("/flag", { id, text }), id);
  };
}

function jobsHtml(jobs: any[]): string {
  return jobs
    .slice(-3)
    .map((j) => `<div><small>${esc(j.id)} seed ${j.seed}${j.dry_run ? " (dry run)" : ""}: <b>${esc(j.status)}</b></small><pre>${esc(j.log.slice(-6).join("\n"))}</pre></div>`)
    .join("");
}

async function poll(id: string) {
  for (let i = 0; i < 600; i++) {
    const q = await api<any>("/queue");
    const mine = q.jobs.filter((j: any) => j.creature === id);
    const el = document.getElementById("jobs");
    if (!el) return;
    el.innerHTML = jobsHtml(mine);
    if (!q.jobs.some((j: any) => j.status === "queued" || j.status === "running")) return route();
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function act(fn: () => Promise<unknown>, id: string) {
  try {
    await fn();
    await creatureView(id);
  } catch (e) {
    alert((e as Error).message);
  }
}

/** A Web Speech error that ruled speech out for the rest of this page session. */
let speechError: string | null = null;

function talkEnv() {
  const w = window as any;
  return {
    hasSpeech: Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition),
    hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia === "function" && typeof w.MediaRecorder === "function",
    secure: window.isSecureContext,
    whisperOverride: whisperBox.checked,
    speechError,
    host: location.host,
  };
}

const IDLE_LABEL = "Hold or tap to talk";
/** A press shorter than this is a tap: recording keeps going until the next tap. */
const TAP_MS = 350;

function setupTalk(btn: HTMLButtonElement, field: HTMLTextAreaElement, state: Element) {
  btn.textContent = IDLE_LABEL;
  const append = (text: string) => (field.value = (field.value + " " + text).trim());
  const say = (text: string) => (state.textContent = text);
  /** Non-null while a recording session is live; calling it ends the session. */
  let stop: (() => void) | null = null;
  let active = false;
  let holding = false;
  let toggled = false;
  let downAt = 0;
  let session = 0;

  const listening = () => {
    btn.classList.add("on");
    btn.textContent = toggled ? "listening… tap to stop" : "listening… release to stop";
  };
  const idle = () => {
    active = false;
    toggled = false;
    btn.classList.remove("on");
    btn.textContent = IDLE_LABEL;
  };

  async function startWhisper(id: number, note?: string) {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const err = e as DOMException;
      idle();
      say(
        err?.name === "NotAllowedError" || err?.name === "SecurityError"
          ? "mic permission denied; allow the mic for this site in the browser settings, or type instead"
          : `mic: ${err?.message || err?.name || String(e)}`,
      );
      return;
    }
    // Released before the mic opened: drop the stream, record nothing.
    if (id !== session || !active) return stream.getTracks().forEach((t) => t.stop());
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      idle();
      return say(`recorder: ${(e as Error).message}`);
    }
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
      if (!blob.size) return say("nothing recorded");
      say("transcribing…");
      try {
        const r = await fetch(`${API}/transcribe`, { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
        const raw = await r.text();
        let d: any = {};
        try {
          d = JSON.parse(raw);
        } catch {
          d = { error: raw.slice(0, 200) || r.statusText };
        }
        if (r.ok && typeof d.text === "string") {
          append(d.text);
          say(note ?? "");
        } else say(`transcription failed: ${d.error ?? r.statusText}`);
      } catch (e) {
        say(`transcription failed: ${(e as Error).message}`);
      }
    };
    rec.start();
    stop = () => rec.state !== "inactive" && rec.stop();
    say(note ? `${note} · listening…` : "listening…");
  }

  function startSpeech(note?: string) {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) append(e.results[i][0].transcript);
    };
    rec.onerror = (e: any) => {
      const code = String(e.error);
      if (!switchesToWhisper(code)) return say(`speech: ${code}`);
      speechError = code;
      const next = chooseTalkPath(talkEnv());
      say(next.path === "whisper" ? `speech: ${code}; switched to server transcription for the next press` : `speech: ${code}; ${next.path === "none" ? next.message : "type instead"}`);
    };
    // Recognition can end by itself (silence, errors); reflect that in the button.
    rec.onend = () => {
      if (stop === stopThis) {
        stop = null;
        idle();
        if (state.textContent?.endsWith("listening…")) say("");
      }
    };
    const stopThis = () => rec.stop();
    try {
      rec.start();
    } catch (e) {
      idle();
      return say(`speech: ${(e as Error).message}`);
    }
    stop = stopThis;
    say(note ? `${note} · listening…` : "listening…");
  }

  function start() {
    const choice = chooseTalkPath(talkEnv());
    if (choice.path === "none") return say(choice.message);
    active = true;
    const id = ++session;
    listening();
    if (choice.path === "whisper") void startWhisper(id, choice.note);
    else startSpeech(choice.note);
  }

  function end() {
    const s = stop;
    stop = null;
    idle();
    session++;
    // Clear the "listening…" line, but keep an error that arrived while recording.
    if (state.textContent?.endsWith("listening…")) say("");
    s?.();
  }

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (active) {
      // Second tap of a tap-to-toggle session, or a press while still recording.
      holding = false;
      return end();
    }
    holding = true;
    downAt = performance.now();
    start();
  });
  btn.addEventListener("pointerup", () => {
    if (!holding) return;
    holding = false;
    if (!active) return;
    if (performance.now() - downAt < TAP_MS) {
      toggled = true;
      listening();
    } else end();
  });
  btn.addEventListener("pointerleave", () => {
    if (holding && active && !toggled) {
      holding = false;
      end();
    }
  });
  btn.addEventListener("pointercancel", () => {
    if (holding && active && !toggled) end();
    holding = false;
  });
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
}

function route() {
  const m = location.hash.match(/^#\/c\/([a-z0-9-]+)/);
  if (m) return void creatureView(m[1]).catch((e) => (app.innerHTML = `<p>${esc(e.message)}</p>`));
  const b = location.hash.match(/^#\/b\/(pilot|[123])$/);
  if (!b) {
    // Opens on batch 1, or the last batch viewed; the choice lives in the URL hash.
    history.replaceState(null, "", `#/b/${lastBatch}`);
    return route();
  }
  batchView(b[1]).catch((e) => (app.innerHTML = `<p>${esc(e.message)}</p>`));
}
window.addEventListener("hashchange", route);
route();
