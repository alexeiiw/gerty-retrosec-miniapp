const RETRO_KEY = "gerty-retrosec-miniapp-state-v1";
const CRIPTO_KEY = "gerty-cripto-miniapp-state-v1";

const missions = [
  { id: 1, name: "Cartucho Game Boy", target: "TETRIS", brief: "Dump ficticio de cartucho con texto oculto.", files: { "readme.txt": "Cartucho recuperado. Usa strings cartridge.gb y grep KEY.", "cartridge.gb": "...BLOCKS...KEY=TETRIS...SCORE..." }, commands: ["ls", "cat", "strings", "grep", "submit"] },
  { id: 2, name: "Memory Card PS2", target: "MEMCARD", brief: "Save de PS2 con pista en notas del jugador.", files: { "readme.txt": "Hay un hash ficticio y una nota vieja.", "notes.txt": "El password era algo obvio: MEMCARD", "hash.txt": "fake-md5:MEMCARD" }, commands: ["ls", "cat", "john", "submit"] },
  { id: 3, name: "ROM N64", target: "RUMBLE", brief: "ROM ficticia con patron de accesorio escondido.", files: { "readme.txt": "Analiza rom.n64 con binwalk y strings.", "rom.n64": "N64DATA::RUMBLE::PAK" }, commands: ["ls", "binwalk", "strings", "grep", "submit"] },
  { id: 4, name: "Save PSP", target: "SHIELD", brief: "Save portatil con clave codificada en texto.", files: { "readme.txt": "Busca en save.dat. El aparato favorito deja huella.", "save.dat": "profile=device;portable=SHIELD;status=locked" }, commands: ["ls", "cat", "grep", "submit"] },
  { id: 5, name: "Servidor Arcade", target: "ARCADE", brief: "Laboratorio final: servicio arcade local ficticio.", files: { "readme.txt": "Enumera arcade.local, revisa banner y envia la clave.", "banner.txt": "Welcome operator. final key: ARCADE" }, commands: ["ls", "nmap", "cat", "grep", "hydra", "submit"] }
];

const wordBanks = {
  gerty: ["gerty", "codigo", "logica", "clave", "orbita", "vector", "cifrado", "enigma"],
  geek: ["matrix", "kernel", "pixel", "daemon", "binary", "server", "lambda", "python"],
  cine: ["nolan", "matrix", "akira", "batman", "alien", "blade", "dune", "cinema"],
  umg: ["campus", "tareas", "portal", "clase", "agenda", "rubrica", "examen"],
  autos: ["honda", "motor", "aceite", "llanta", "freno", "sensor", "bateria"],
  finanzas: ["saldo", "cuenta", "tarjeta", "ahorro", "interes", "credito", "debito"]
};

const output = document.querySelector("#output");
const form = document.querySelector("#commandForm");
const input = document.querySelector("#commandInput");
const missionLabel = document.querySelector("#missionLabel");
const solvedLabel = document.querySelector("#solvedLabel");
const modeLabel = document.querySelector("#modeLabel");
const userBadge = document.querySelector("#userBadge");
const resetProgress = document.querySelector("#resetProgress");
const terminalTitle = document.querySelector("#terminalTitle");
const primaryLabel = document.querySelector("#primaryLabel");
const secondaryLabel = document.querySelector("#secondaryLabel");

let activeGame = "retrosec";
let retroState = loadJson(RETRO_KEY, normalizeRetroState({ mission: 1, solved: [], history: [] }), normalizeRetroState);
let criptoState = loadJson(CRIPTO_KEY, normalizeCriptoState({ level: 1, theme: "gerty", puzzle: null, stats: defaultCriptoStats(), history: [] }), normalizeCriptoState);

function loadJson(key, fallback, normalizer) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return normalizer(JSON.parse(raw));
  } catch (error) {
    console.warn("State reset", error);
  }
  return fallback;
}

function saveStates() {
  localStorage.setItem(RETRO_KEY, JSON.stringify(retroState));
  localStorage.setItem(CRIPTO_KEY, JSON.stringify(criptoState));
}

function normalizeText(value) {
  return (value || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function normalizeRetroState(value) {
  const mission = Math.min(Math.max(parseInt(value?.mission || 1, 10), 1), missions.length);
  const solved = Array.isArray(value?.solved) ? value.solved.filter(Boolean) : [];
  const history = Array.isArray(value?.history) ? value.history.slice(-40) : [];
  return { mission, solved, history };
}

function defaultCriptoStats() {
  return { points: 0, played: 0, wins: 0, losses: 0, streak: 0, bestStreak: 0, bestLevel: 0 };
}

function normalizeCriptoState(value) {
  return {
    level: Math.min(Math.max(parseInt(value?.level || 1, 10), 1), 5),
    theme: value?.theme || "gerty",
    puzzle: value?.puzzle || null,
    stats: { ...defaultCriptoStats(), ...(value?.stats || {}) },
    history: Array.isArray(value?.history) ? value.history.slice(-40) : []
  };
}

function write(text) {
  output.textContent += text + "\n";
  output.scrollTop = output.scrollHeight;
}

function currentMission() {
  return missions[retroState.mission - 1] || missions[0];
}

function retroStatusText() {
  const mission = currentMission();
  return [
    "[RETROSEC LAB]",
    `MISION : ${mission.id}/${missions.length} - ${mission.name}`,
    `BRIEF  : ${mission.brief}`,
    `TOOLS  : ${mission.commands.join(", ")}`,
    "NEXT   : ls | cat readme.txt | submit [clave]"
  ].join("\n");
}

function criptoStatusText() {
  if (!criptoState.puzzle) criptoState.puzzle = createCriptoPuzzle(criptoState.level, criptoState.theme);
  const p = criptoState.puzzle;
  return [
    "[CRIPTO CLASICO]",
    `NIVEL  : ${p.level}/5`,
    `TEMA   : ${p.theme}`,
    `TIPO   : ${p.type}`,
    `PTS    : ${criptoState.stats.points} | RACHA: ${criptoState.stats.streak}`,
    "",
    p.question,
    "NEXT   : respuesta [texto] | pista | nuevo [nivel] [tema]"
  ].join("\n");
}

function refreshStatus() {
  if (activeGame === "retrosec") {
    primaryLabel.textContent = "Mision";
    secondaryLabel.textContent = "Completadas";
    missionLabel.textContent = `${retroState.mission}/${missions.length}`;
    solvedLabel.textContent = `${retroState.solved.length}`;
    terminalTitle.textContent = "retrosec@gerty:~";
    input.placeholder = "Escribe: ls, cat readme.txt, submit CLAVE";
  } else {
    primaryLabel.textContent = "Nivel";
    secondaryLabel.textContent = "Puntos";
    missionLabel.textContent = `${criptoState.level}/5`;
    solvedLabel.textContent = `${criptoState.stats.points}`;
    terminalTitle.textContent = "cripto@gerty:~";
    input.placeholder = "Escribe: respuesta texto, pista, nuevo 3 geek";
  }
}

function switchGame(game) {
  activeGame = game;
  document.querySelectorAll("[data-game]").forEach((button) => button.classList.toggle("active", button.dataset.game === game));
  output.textContent = "";
  refreshStatus();
  write(game === "retrosec" ? "[BOOT RETROSEC]" : "[BOOT CRIPTO]");
  write(game === "retrosec" ? retroStatusText() : criptoStatusText());
  saveStates();
}

function runCommand(rawCommand) {
  const raw = (rawCommand || "").trim();
  if (!raw) return;
  write(`$ ${raw}`);
  if (activeGame === "retrosec") runRetroCommand(raw);
  else runCriptoCommand(raw);
  saveStates();
  refreshStatus();
}

function runRetroCommand(raw) {
  const [cmdPart, ...rest] = raw.split(/\s+/);
  const cmd = normalizeText(cmdPart);
  const arg = rest.join(" ").trim();
  const mission = currentMission();
  retroState.history.push(raw);
  retroState.history = retroState.history.slice(-40);

  if (cmd === "help" || cmd === "ayuda") write("Comandos: status, ls, cat [archivo], strings [archivo], grep [texto] [archivo], nmap, binwalk, john, hydra, submit [clave], reset");
  else if (cmd === "status" || cmd === "estado") write(retroStatusText());
  else if (cmd === "ls") write(Object.keys(mission.files).join("\n"));
  else if (cmd === "cat") write(mission.files[arg] || `cat: archivo no encontrado: ${arg}`);
  else if (cmd === "strings") write((mission.files[arg] || "").replace(/[^A-Za-z0-9_=:. -]+/g, " ").trim() || "strings: sin texto legible");
  else if (cmd === "grep") write(runGrep(arg, mission));
  else if (cmd === "nmap") write("Starting Nmap retro scan...\narcade.local open 22/ssh 8080/arcade-banner\nPista: cat banner.txt");
  else if (cmd === "binwalk") write("DECIMAL HEX DESCRIPTION\n128 0x80 Retro asset block\n256 0x100 Text segment: prueba strings");
  else if (cmd === "john") write(`john: hash ficticio resuelto -> ${mission.target}`);
  else if (cmd === "hydra") write(`hydra: login ficticio probado. Banner sugiere clave ${mission.target}.`);
  else if (cmd === "submit" || cmd === "respuesta" || cmd === "guess") write(submitRetroAnswer(arg, mission));
  else if (cmd === "reset" || cmd === "reiniciar") resetActiveGame();
  else write(`Comando no disponible en esta mision: ${cmdPart}\nTools: ${mission.commands.join(", ")}`);
}

function runGrep(arg, mission) {
  const parts = arg.split(/\s+/).filter(Boolean);
  const needle = (parts[0] || "").toLowerCase();
  const file = parts[1] || Object.keys(mission.files)[0];
  if (!needle) return "grep: falta patron";
  return (mission.files[file] || "").split("\n").filter((line) => line.toLowerCase().includes(needle)).join("\n") || "grep: sin coincidencias";
}

function submitRetroAnswer(arg, mission) {
  if (!arg.trim()) return "Uso: submit [clave]";
  if (normalizeText(arg) !== normalizeText(mission.target)) return "[ACCESS DENIED]\nClave incorrecta. Revisa archivos y pistas con comandos Linux.";
  if (!retroState.solved.includes(mission.id)) retroState.solved.push(mission.id);
  if (mission.id < missions.length) {
    retroState.mission = mission.id + 1;
    return `[ACCESS GRANTED]\nMision completada: ${mission.name}\nNEXT:\n${retroStatusText()}`;
  }
  return "[ACCESS GRANTED]\nRetroSec completo.";
}

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getWordBank(theme) {
  const key = normalizeText(theme || "gerty");
  if (wordBanks[key]) return wordBanks[key];
  if (key.includes("cine")) return wordBanks.cine;
  if (key.includes("auto")) return wordBanks.autos;
  if (key.includes("fin")) return wordBanks.finanzas;
  return wordBanks.gerty;
}

function rot(text, shift) {
  return text.replace(/[a-z]/gi, (char) => {
    const base = char >= "a" && char <= "z" ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function atbash(text) {
  return text.replace(/[a-z]/gi, (char) => {
    const lower = char.toLowerCase();
    const out = String.fromCharCode(122 - (lower.charCodeAt(0) - 97));
    return char === lower ? out : out.toUpperCase();
  });
}

function toHex(text) {
  return text.split("").map((char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
}

function toBase64(text) {
  return btoa(text);
}

function reverse(text) {
  return text.split("").reverse().join("");
}

function vigenere(text, key) {
  let out = "";
  let j = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      const k = key.charCodeAt(j % key.length) - 97;
      out += String.fromCharCode(((code - 97 + k) % 26) + 97);
      j++;
    } else out += char;
  }
  return out;
}

function createCriptoPuzzle(level, theme) {
  const safeLevel = Math.min(Math.max(parseInt(level || 1, 10), 1), 5);
  const safeTheme = normalizeText(theme || "gerty") || "gerty";
  const answer = choose(getWordBank(safeTheme));
  let type = "Cesar";
  let question = "";
  let hints = [];

  if (safeLevel === 1) {
    const shift = 1 + Math.floor(Math.random() * 5);
    type = "Cesar";
    question = `Descifra Cesar +${shift}: ${rot(answer, shift)}`;
    hints = [`Mueve cada letra ${shift} posicion(es) hacia atras.`, `La respuesta empieza con ${answer[0]}.`];
  } else if (safeLevel === 2) {
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) { type = "Hex"; question = `Convierte hexadecimal ASCII: ${toHex(answer)}`; }
    else if (mode === 1) { type = "Base64"; question = `Decodifica Base64: ${toBase64(answer)}`; }
    else { type = "Atbash"; question = `Rompe Atbash: ${atbash(answer)}`; }
    hints = [`Pertenece al tema ${safeTheme}.`, `Tiene ${answer.length} caracteres.`];
  } else if (safeLevel === 3) {
    const shift = 2 + Math.floor(Math.random() * 7);
    type = "Reversa + Cesar";
    question = `Deshaz Cesar -${shift} y luego lee al reves: ${rot(reverse(answer), shift)}`;
    hints = ["Hay dos capas.", `La respuesta tiene ${answer.length} letras.`];
  } else if (safeLevel === 4) {
    const key = choose(["gerty", "clave", "nexo", "luna", "byte"]);
    type = "Vigenere";
    question = `Vigenere con clave ${key}: ${vigenere(answer, key)}`;
    hints = ["Resta la clave repetida letra por letra.", `La respuesta pertenece a ${safeTheme}.`];
  } else {
    const shift = 3 + Math.floor(Math.random() * 10);
    type = "Multicapa";
    question = `Orden inverso: hex -> Cesar -${shift} -> reversa. Texto: ${toHex(rot(reverse(answer), shift))}`;
    hints = ["Primero convierte hex a texto.", `Luego aplica Cesar -${shift} y reversa.`];
  }

  return { level: safeLevel, theme: safeTheme, type, question, answer, hints, hintIndex: 0, attempts: 3, started: Date.now() };
}

function runCriptoCommand(raw) {
  const [cmdPart, ...rest] = raw.split(/\s+/);
  const cmd = normalizeText(cmdPart);
  const arg = rest.join(" ").trim();
  criptoState.history.push(raw);
  criptoState.history = criptoState.history.slice(-40);
  if (!criptoState.puzzle) criptoState.puzzle = createCriptoPuzzle(criptoState.level, criptoState.theme);

  if (cmd === "help" || cmd === "ayuda") write("Comandos: status, nuevo [nivel] [tema], respuesta [texto], pista, stats, reset");
  else if (cmd === "status" || cmd === "estado") write(criptoStatusText());
  else if (cmd === "nuevo" || cmd === "start" || cmd === "iniciar") write(newCriptoPuzzle(arg));
  else if (cmd === "pista" || cmd === "hint") write(criptoHint());
  else if (cmd === "stats" || cmd === "puntos") write(criptoStatsText());
  else if (cmd === "respuesta" || cmd === "resolver" || cmd === "submit") write(submitCriptoAnswer(arg));
  else if (cmd === "reset" || cmd === "reiniciar") resetActiveGame();
  else write(submitCriptoAnswer(raw));
}

function newCriptoPuzzle(arg) {
  const parts = arg.split(/\s+/).filter(Boolean);
  const level = /^[1-5]$/.test(parts[0] || "") ? parseInt(parts.shift(), 10) : criptoState.level;
  const theme = parts.join(" ") || criptoState.theme;
  criptoState.level = level;
  criptoState.theme = normalizeText(theme) || "gerty";
  criptoState.puzzle = createCriptoPuzzle(criptoState.level, criptoState.theme);
  return criptoStatusText();
}

function criptoHint() {
  const p = criptoState.puzzle;
  if (p.hintIndex >= p.hints.length) return `Sin mas pistas. Intentos: ${p.attempts}`;
  const hint = p.hints[p.hintIndex];
  p.hintIndex++;
  return `[PISTA ${p.hintIndex}]\n${hint}`;
}

function submitCriptoAnswer(arg) {
  const p = criptoState.puzzle;
  if (!arg.trim()) return "Uso: respuesta [texto]";
  criptoState.stats.played++;
  if (normalizeText(arg) === normalizeText(p.answer)) {
    const points = Math.max(p.level * 10, 80 + p.level * 40 - p.hintIndex * 20 - (3 - p.attempts) * 15);
    criptoState.stats.points += points;
    criptoState.stats.wins++;
    criptoState.stats.streak++;
    criptoState.stats.bestStreak = Math.max(criptoState.stats.bestStreak, criptoState.stats.streak);
    criptoState.stats.bestLevel = Math.max(criptoState.stats.bestLevel, p.level);
    criptoState.puzzle = createCriptoPuzzle(p.level, p.theme);
    return `[CORRECTO]\nRespuesta: ${p.answer}\n+${points} puntos\n\nNuevo reto:\n${criptoStatusText()}`;
  }
  p.attempts--;
  if (p.attempts <= 0) {
    criptoState.stats.losses++;
    criptoState.stats.streak = 0;
    const answer = p.answer;
    criptoState.puzzle = createCriptoPuzzle(p.level, p.theme);
    return `[SIN INTENTOS]\nLa respuesta era: ${answer}\n\nNuevo reto:\n${criptoStatusText()}`;
  }
  return `[INCORRECTO]\nIntentos restantes: ${p.attempts}\nPuedes pedir pista o responder otra vez.`;
}

function criptoStatsText() {
  const s = criptoState.stats;
  return `[CRIPTO STATS]\nPuntos: ${s.points}\nGanados: ${s.wins}/${s.played}\nFallidos: ${s.losses}\nRacha: ${s.streak}\nMejor racha: ${s.bestStreak}\nMejor nivel: ${s.bestLevel}/5`;
}

function resetActiveGame() {
  if (activeGame === "retrosec") {
    retroState = normalizeRetroState({ mission: 1, solved: [], history: [] });
    output.textContent = "";
    write("[RESET]\nRetroSec vuelve a la mision 1.");
    write(retroStatusText());
  } else {
    criptoState = normalizeCriptoState({ level: 1, theme: "gerty", puzzle: null, stats: defaultCriptoStats(), history: [] });
    output.textContent = "";
    write("[RESET]\nCripto Clasico vuelve a nivel 1.");
    write(criptoStatusText());
  }
  saveStates();
  refreshStatus();
}

function setupTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  modeLabel.textContent = "Telegram";
  const user = tg.initDataUnsafe?.user;
  if (user?.username) userBadge.textContent = `@${user.username}`;
  else if (user?.first_name) userBadge.textContent = user.first_name;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand(input.value);
  input.value = "";
  input.focus();
});

document.querySelectorAll("[data-cmd]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.cmd === "submit CLAVE") {
      input.value = activeGame === "retrosec" ? "submit " : "respuesta ";
      input.focus();
      return;
    }
    runCommand(button.dataset.cmd);
  });
});

document.querySelectorAll("[data-game]").forEach((button) => {
  button.addEventListener("click", () => switchGame(button.dataset.game));
});

resetProgress.addEventListener("click", resetActiveGame);

setupTelegram();
switchGame("retrosec");
