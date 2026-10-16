// WALL-E F1 - Interfaz, canvas, controles y estado local
const STORAGE_KEY = "walle-f1-state-v1";

const state = {
  track: null,
  team: null,
  seed: "",
  strategy: { compounds: ["medium", "hard"], pitLaps: [12, 12] },
  preview: null,
  result: null,
  stats: { races: 0, wins: 0, podiums: 0, lastTrack: null, lastTeam: null, bestByTrack: {} }
};

const el = (id) => document.getElementById(id);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.stats = { ...state.stats, ...JSON.parse(raw) };
  } catch (e) { /* ignorar */ }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); } catch (e) { /* ignorar */ }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + id));
  window.scrollTo(0, 0);
}

function newSeed() {
  return String(Math.floor(Math.random() * 1e9));
}

// ---------- Pantalla: circuito ----------
function renderTracks() {
  const list = el("trackList");
  list.innerHTML = "";
  for (const track of TRACKS) {
    const best = state.stats.bestByTrack[track.id];
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.innerHTML =
      `<span class="tile-flag">${track.flag} · 24 VUELTAS</span>` +
      `<span class="tile-name">${track.name}</span>` +
      `<span class="tile-meta">${track.country} · desgaste ${Math.round(track.wear * 100)}%` +
      (best ? ` · mejor P${best}` : "") + `</span>`;
    btn.addEventListener("click", () => selectTrack(track));
    list.appendChild(btn);
  }
  renderStatsLine();
}

function renderStatsLine() {
  const s = state.stats;
  el("statsLine").textContent = s.races
    ? `Carreras: ${s.races} · Victorias: ${s.wins} · Podios: ${s.podiums}`
    : "Sin carreras todavia. Elige un circuito para empezar.";
}

function selectTrack(track) {
  state.track = track;
  el("teamTrackName").textContent = `Elige equipo · ${track.name}`;
  renderTeams();
  showScreen("team");
}

// ---------- Pantalla: equipo ----------
function renderTeams() {
  const list = el("teamList");
  list.innerHTML = "";
  for (const team of TEAMS) {
    const names = team.drivers.map((d) => d.name).join("  ·  ");
    const btn = document.createElement("button");
    btn.className = "tile tile-team";
    btn.innerHTML =
      `<span class="bar" style="background:${team.color}"></span>` +
      `<span><span class="team-name">${team.name}</span><span class="drivers-line">${names}</span></span>` +
      `<span class="team-short">${team.short}</span>`;
    btn.addEventListener("click", () => selectTeam(team));
    list.appendChild(btn);
  }
}

function selectTeam(team) {
  state.team = team;
  state.seed = urlSeed() || newSeed();
  state.strategy = { compounds: ["medium", "hard"], pitLaps: [12, 12] };
  state.preview = WalleSim.preview(state.seed, state.track, team.id);
  renderQualy();
  showScreen("qualy");
}

// ---------- Pantalla: clasificacion y clima ----------
function renderQualy() {
  const { weather, cars } = state.preview;
  const grid = cars.slice().sort((a, b) => a.gridPos - b.gridPos);

  el("weatherCard").innerHTML = weatherText(weather, state.track);

  const list = el("qualyList");
  list.innerHTML = "";
  grid.forEach((car) => {
    const row = document.createElement("div");
    row.className = "qualy-row" + (car.isPlayer ? " you" : "");
    row.innerHTML =
      `<span class="pos">${car.gridPos}</span>` +
      `<span class="short" style="color:${car.color}">${car.short}</span>` +
      `<span>${car.name}</span>` +
      `<span class="time">${fmtTime(car.qualiTime)}</span>`;
    list.appendChild(row);
  });
  el("toStrategy").textContent = `Definir estrategia · ${state.team.short}`;
}

function weatherText(weather, track) {
  const wet = weather.map((w, i) => (w.wetness > 0.3 ? i : -1)).filter((i) => i >= 0);
  let forecast;
  if (!wet.length) forecast = "Sin lluvia prevista: carrera seca.";
  else forecast = `Lluvia probable entre las vueltas <b>${wet[0] + 1}</b> y <b>${wet[wet.length - 1] + 1}</b>.`;
  return `<b>${track.name}</b> · ${track.country} · ${track.temp}&deg;C<br>` +
    `Pronostico: ${forecast}<br>` +
    `Adelantar aqui: ${track.overtaking >= 1.1 ? "facil" : track.overtaking <= 0.6 ? "dificil" : "normal"}.`;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return `${m}:${s.padStart(6, "0")}`;
}

// ---------- Pantalla: estrategia ----------
function renderStrategy() {
  const startBox = el("compoundStart");
  const endBox = el("compoundEnd");
  startBox.innerHTML = "";
  endBox.innerHTML = "";

  for (const c of COMPOUNDS) {
    startBox.appendChild(chip(c, "start"));
    endBox.appendChild(chip(c, "end"));
  }

  const pitBox = el("pitLaps");
  pitBox.innerHTML = "";
  state.team.drivers.forEach((driver, idx) => {
    const row = document.createElement("div");
    row.className = "pit-row";
    row.innerHTML =
      `<span><span class="pit-name">${driver.name}</span><span class="pit-sub">Entra a boxes en la vuelta</span></span>` +
      `<span class="stepper"><button data-dir="-1" data-idx="${idx}">−</button>` +
      `<span class="val" id="pitVal${idx}">${state.strategy.pitLaps[idx]}</span>` +
      `<button data-dir="1" data-idx="${idx}">+</button></span>`;
    pitBox.appendChild(row);
  });

  pitBox.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.dataset.idx);
      const dir = Number(b.dataset.dir);
      state.strategy.pitLaps[idx] = Math.max(1, Math.min(RACE_LAPS, state.strategy.pitLaps[idx] + dir));
      el("pitVal" + idx).textContent = state.strategy.pitLaps[idx];
    });
  });
}

function chip(compound, kind) {
  const btn = document.createElement("button");
  btn.className = "chip";
  btn.dataset.id = compound.id;
  btn.innerHTML = `<span class="dot" style="background:${compound.color}"></span>${compound.abbr}<small>${compound.name}</small>`;
  btn.addEventListener("click", () => {
    const current = kind === "start" ? state.strategy.compounds[0] : state.strategy.compounds[1];
    if (current === compound.id) return;
    if (kind === "start") state.strategy.compounds[0] = compound.id;
    else state.strategy.compounds[1] = compound.id;
    markChips();
  });
  return btn;
}

function markChips() {
  document.querySelectorAll("#compoundStart .chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.id === state.strategy.compounds[0]));
  document.querySelectorAll("#compoundEnd .chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.id === state.strategy.compounds[1]));
}

// ---------- Pantalla: carrera ----------
const canvas = el("trackCanvas");
const ctx = canvas.getContext("2d");
let viewSize = 640;
let anim = { running: false, playing: false, speed: 1, progress: 0, last: 0, rafId: 0 };
const BASE_DISPLAY_SECONDS = 24; // 1x: ~24s para las 24 vueltas

function startRace() {
  state.result = WalleSim.runSimulation({
    track: state.track,
    teamId: state.team.id,
    strategy: state.strategy,
    seed: state.seed
  });
  anim = { running: true, playing: true, speed: 1, progress: 0, last: 0, rafId: 0 };
  setPlayIcon();
  document.querySelectorAll(".ctrl.speed").forEach((b) => b.classList.toggle("active", b.dataset.speed === "1"));
  showScreen("race");
  requestAnimationFrame(() => {
    setupCanvas();
    anim.last = performance.now();
    anim.rafId = requestAnimationFrame(loop);
  });
}

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewSize = Math.max(240, Math.floor(rect.width));
  canvas.width = Math.floor(viewSize * dpr);
  canvas.height = Math.floor(viewSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loop(now) {
  const dt = Math.min(0.05, (now - anim.last) / 1000);
  anim.last = now;
  if (anim.playing) {
    anim.progress += (dt * anim.speed) / BASE_DISPLAY_SECONDS;
    if (anim.progress >= 1) { anim.progress = 1; finishRace(); return; }
  }
  drawRace();
  updateHud();
  if (anim.running) anim.rafId = requestAnimationFrame(loop);
}

function currentRaceTime() {
  return anim.progress * state.result.raceTime;
}

function lapProgress() {
  const T = currentRaceTime();
  const laps = state.track.laps;
  let leader = 0;
  for (const car of state.result.cars) {
    leader = Math.max(leader, WalleSim.carProgressAt(car, T, laps));
  }
  return Math.min(leader, laps);
}

function drawRace() {
  const size = viewSize;
  ctx.clearRect(0, 0, size, size);
  const track = state.track;
  const pad = size * 0.14;
  const pts = track.path.map(([x, y]) => [pad + x * (size - pad * 2), pad + y * (size - pad * 2)]);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = size * 0.075;
  strokePath(pts);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  strokePath(pts);

  const start = pts[0];
  ctx.fillStyle = "#eaf1ff";
  ctx.beginPath();
  ctx.arc(start[0], start[1], 4, 0, Math.PI * 2);
  ctx.fill();

  const T = currentRaceTime();
  const laps = state.track.laps;
  const pathData = measurePath(pts);

  const ordered = state.result.cars.slice().sort(
    (a, b) => WalleSim.carProgressAt(a, T, laps) - WalleSim.carProgressAt(b, T, laps));

  for (const car of ordered) {
    const lapsDone = WalleSim.carProgressAt(car, T, laps);
    const frac = lapsDone - Math.floor(lapsDone);
    const p = pointAt(pathData, frac);
    const r = car.isPlayer ? size * 0.028 : size * 0.020;
    if (car.isPlayer) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = car.dnf ? "rgba(120,120,120,0.6)" : car.color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function strokePath(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.stroke();
}

function measurePath(pts) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push({ a, b, len, start: total });
    total += len;
  }
  return { seg, total };
}

function pointAt(pathData, t) {
  let d = Math.max(0, Math.min(1, t)) * pathData.total;
  for (const s of pathData.seg) {
    if (d <= s.start + s.len) {
      const f = (d - s.start) / (s.len || 1);
      return [s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f];
    }
  }
  const last = pathData.seg[pathData.seg.length - 1];
  return last.b;
}

function updateHud() {
  const laps = state.track.laps;
  const lapProg = lapProgress();
  const lapNow = Math.min(laps, Math.floor(lapProg) + 1);
  el("hudLap").textContent = `${lapNow}/${laps}`;
  const wIndex = Math.min(laps - 1, Math.floor(lapProg));
  const w = state.result.weather[wIndex];
  el("hudWeather").textContent = WalleSim.weatherLabel(w.code);

  const T = currentRaceTime();
  const ranked = state.result.cars.slice().sort(
    (a, b) => WalleSim.carProgressAt(b, T, laps) - WalleSim.carProgressAt(a, T, laps));

  const box = el("hudDrivers");
  box.innerHTML = "";
  for (const car of state.result.playerCars) {
    const pos = car.dnf ? "DNF" : ranked.indexOf(car) + 1;
    const compound = car.seg[wIndex] ? WalleSim.compoundById(car.seg[wIndex]) : null;
    const div = document.createElement("div");
    div.className = "hud-tile";
    div.innerHTML =
      `<div class="hud-driver"><span class="dot" style="background:${car.color}"></span>` +
      `<span class="nm">${car.short}</span><span class="pos">${pos}</span></div>` +
      `<span class="tire">${compound ? compound.name : "-"}</span>`;
    box.appendChild(div);
  }
}

function setPlayIcon() {
  el("playBtn").textContent = anim.playing ? "❚❚" : "▶";
}

function finishRace() {
  anim.running = false;
  anim.playing = false;
  cancelAnimationFrame(anim.rafId);
  drawRace();
  recordResult();
  renderResult();
  showScreen("result");
}

// ---------- Pantalla: resultado ----------
function recordResult() {
  const r = state.result;
  const s = state.stats;
  s.races++;
  if (r.won) s.wins++;
  if (r.podium) s.podiums++;
  s.lastTrack = r.track.id;
  s.lastTeam = state.team.id;
  const prev = s.bestByTrack[r.track.id];
  if (prev === undefined || r.bestPos < prev) s.bestByTrack[r.track.id] = r.bestPos;
  saveState();
}

function renderResult() {
  const r = state.result;
  el("resultBanner").textContent = `${r.summary.result} · P${r.bestPos}`;
  el("resultBanner").classList.toggle("win", r.won);

  const leader = r.raceTime;
  const list = el("finalList");
  list.innerHTML = "";
  r.finalOrder.forEach((car) => {
    const row = document.createElement("div");
    row.className = "final-row" + (car.isPlayer ? " you" : "") + (car.dnf ? " dnf" : "");
    const gap = car.dnf ? `abandono V${car.dnfLap}` : `+${(((car.cum[car.cum.length - 1] - leader))).toFixed(1)}s`;
    row.innerHTML =
      `<span class="pos">${car.finishPos}</span>` +
      `<span class="short" style="color:${car.color}">${car.short}</span>` +
      `<span>${car.name}</span>` +
      `<span class="gap">${gap}</span>`;
    list.appendChild(row);
  });

  const box = el("summaryBox");
  box.innerHTML = r.summary.bullets.map((b) => `<p>${b}</p>`).join("") +
    `<p>Clima: ${r.summary.wetLaps} vueltas con lluvia.</p>`;
}

// ---------- Telegram ----------
function urlSeed() {
  const params = new URLSearchParams(location.search);
  return params.get("seed") || params.get("startapp") || null;
}

function setupTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) { try { tg.setHeaderColor("#07090d"); } catch (e) { /* noop */ } }
  el("modeBadge").textContent = "TELEGRAM";
  const user = tg.initDataUnsafe?.user;
  if (user?.username) el("modeBadge").textContent = `@${user.username}`;
  else if (user?.first_name) el("modeBadge").textContent = user.first_name;
}

// ---------- Eventos ----------
function bindEvents() {
  document.querySelectorAll("[data-back]").forEach((b) => {
    b.addEventListener("click", () => {
      const target = b.dataset.back;
      if (target === "track") showScreen("track");
      else if (target === "team") showScreen("team");
      else if (target === "qualy") showScreen("qualy");
    });
  });

  el("toStrategy").addEventListener("click", () => {
    renderStrategy();
    markChips();
    showScreen("strategy");
  });

  el("startRace").addEventListener("click", startRace);

  el("playBtn").addEventListener("click", () => {
    anim.playing = !anim.playing;
    anim.last = performance.now();
    setPlayIcon();
  });

  document.querySelectorAll(".ctrl.speed").forEach((b) => {
    b.addEventListener("click", () => {
      anim.speed = Number(b.dataset.speed);
      document.querySelectorAll(".ctrl.speed").forEach((x) => x.classList.toggle("active", x === b));
    });
  });

  el("skipBtn").addEventListener("click", () => {
    anim.progress = 1;
    finishRace();
  });

  el("againBtn").addEventListener("click", () => {
    state.seed = newSeed();
    state.preview = WalleSim.preview(state.seed, state.track, state.team.id);
    renderQualy();
    showScreen("qualy");
  });

  el("changeTrackBtn").addEventListener("click", () => {
    renderTracks();
    showScreen("track");
  });

  window.addEventListener("resize", () => {
    if (anim.running || document.getElementById("screen-race").classList.contains("active")) {
      setupCanvas();
      drawRace();
    }
  });
}

// ---------- Arranque ----------
loadState();
setupTelegram();
bindEvents();
renderTracks();
showScreen("track");
