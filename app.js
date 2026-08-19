const STORAGE_KEY = "gerty-retrosec-miniapp-state-v1";

const missions = [
  {
    id: 1,
    name: "Cartucho Game Boy",
    target: "TETRIS",
    brief: "Dump ficticio de cartucho con texto oculto.",
    files: {
      "readme.txt": "Cartucho recuperado. Usa strings cartridge.gb y grep KEY.",
      "cartridge.gb": "...BLOCKS...KEY=TETRIS...SCORE..."
    },
    commands: ["ls", "cat", "strings", "grep", "submit"]
  },
  {
    id: 2,
    name: "Memory Card PS2",
    target: "MEMCARD",
    brief: "Save de PS2 con pista en notas del jugador.",
    files: {
      "readme.txt": "Hay un hash ficticio y una nota vieja.",
      "notes.txt": "El password era algo obvio: MEMCARD",
      "hash.txt": "fake-md5:MEMCARD"
    },
    commands: ["ls", "cat", "john", "submit"]
  },
  {
    id: 3,
    name: "ROM N64",
    target: "RUMBLE",
    brief: "ROM ficticia con patron de accesorio escondido.",
    files: {
      "readme.txt": "Analiza rom.n64 con binwalk y strings.",
      "rom.n64": "N64DATA::RUMBLE::PAK"
    },
    commands: ["ls", "binwalk", "strings", "grep", "submit"]
  },
  {
    id: 4,
    name: "Save PSP",
    target: "SHIELD",
    brief: "Save portatil con clave codificada en texto.",
    files: {
      "readme.txt": "Busca en save.dat. El aparato favorito deja huella.",
      "save.dat": "profile=device;portable=SHIELD;status=locked"
    },
    commands: ["ls", "cat", "grep", "submit"]
  },
  {
    id: 5,
    name: "Servidor Arcade",
    target: "ARCADE",
    brief: "Laboratorio final: servicio arcade local ficticio.",
    files: {
      "readme.txt": "Enumera arcade.local, revisa banner y envia la clave.",
      "banner.txt": "Welcome operator. final key: ARCADE"
    },
    commands: ["ls", "nmap", "cat", "grep", "hydra", "submit"]
  }
];

const output = document.querySelector("#output");
const form = document.querySelector("#commandForm");
const input = document.querySelector("#commandInput");
const missionLabel = document.querySelector("#missionLabel");
const solvedLabel = document.querySelector("#solvedLabel");
const modeLabel = document.querySelector("#modeLabel");
const userBadge = document.querySelector("#userBadge");
const resetProgress = document.querySelector("#resetProgress");

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn("State reset", error);
  }
  return normalizeState({ mission: 1, solved: [], history: [] });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState(value) {
  const mission = Math.min(Math.max(parseInt(value?.mission || 1, 10), 1), missions.length);
  const solved = Array.isArray(value?.solved) ? value.solved.filter(Boolean) : [];
  const history = Array.isArray(value?.history) ? value.history.slice(-40) : [];
  return { mission, solved, history };
}

function currentMission() {
  return missions[state.mission - 1] || missions[0];
}

function normalizeText(value) {
  return (value || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function write(text) {
  output.textContent += text + "\n";
  output.scrollTop = output.scrollHeight;
}

function refreshStatus() {
  missionLabel.textContent = `${state.mission}/${missions.length}`;
  solvedLabel.textContent = `${state.solved.length}`;
}

function statusText() {
  const mission = currentMission();
  return [
    "[RETROSEC LAB]",
    `MISION : ${mission.id}/${missions.length} - ${mission.name}`,
    `BRIEF  : ${mission.brief}`,
    `TOOLS  : ${mission.commands.join(", ")}`,
    "NEXT   : ls | cat readme.txt | submit [clave]"
  ].join("\n");
}

function runCommand(rawCommand) {
  const raw = (rawCommand || "").trim();
  if (!raw) return;

  const [cmdPart, ...rest] = raw.split(/\s+/);
  const cmd = normalizeText(cmdPart);
  const arg = rest.join(" ").trim();
  const mission = currentMission();

  state.history.push(raw);
  state.history = state.history.slice(-40);
  write(`$ ${raw}`);

  if (cmd === "help" || cmd === "ayuda") {
    write("Comandos: status, ls, cat [archivo], strings [archivo], grep [texto] [archivo], nmap, binwalk, john, hydra, submit [clave], reset");
  } else if (cmd === "status" || cmd === "estado") {
    write(statusText());
  } else if (cmd === "ls") {
    write(Object.keys(mission.files).join("\n"));
  } else if (cmd === "cat") {
    write(mission.files[arg] || `cat: archivo no encontrado: ${arg}`);
  } else if (cmd === "strings") {
    write((mission.files[arg] || "").replace(/[^A-Za-z0-9_=:. -]+/g, " ").trim() || "strings: sin texto legible");
  } else if (cmd === "grep") {
    write(runGrep(arg, mission));
  } else if (cmd === "nmap") {
    write("Starting Nmap retro scan...\narcade.local open 22/ssh 8080/arcade-banner\nPista: cat banner.txt");
  } else if (cmd === "binwalk") {
    write("DECIMAL HEX DESCRIPTION\n128 0x80 Retro asset block\n256 0x100 Text segment: prueba strings");
  } else if (cmd === "john") {
    write(`john: hash ficticio resuelto -> ${mission.target}`);
  } else if (cmd === "hydra") {
    write(`hydra: login ficticio probado. Banner sugiere clave ${mission.target}.`);
  } else if (cmd === "submit" || cmd === "respuesta" || cmd === "guess") {
    write(submitAnswer(arg, mission));
  } else if (cmd === "reset" || cmd === "reiniciar") {
    state = normalizeState({ mission: 1, solved: [], history: [] });
    write("[RESET]\nRetroSec vuelve a la mision 1.");
    write(statusText());
  } else {
    write(`Comando no disponible en esta mision: ${cmdPart}\nTools: ${mission.commands.join(", ")}`);
  }

  saveState();
  refreshStatus();
}

function runGrep(arg, mission) {
  const parts = arg.split(/\s+/).filter(Boolean);
  const needle = (parts[0] || "").toLowerCase();
  const file = parts[1] || Object.keys(mission.files)[0];
  if (!needle) return "grep: falta patron";
  const lines = (mission.files[file] || "").split("\n");
  return lines.filter((line) => line.toLowerCase().includes(needle)).join("\n") || "grep: sin coincidencias";
}

function submitAnswer(arg, mission) {
  if (!arg.trim()) return "Uso: submit [clave]";
  if (normalizeText(arg) !== normalizeText(mission.target)) {
    return "[ACCESS DENIED]\nClave incorrecta. Revisa archivos y pistas con comandos Linux.";
  }

  if (!state.solved.includes(mission.id)) state.solved.push(mission.id);
  if (mission.id < missions.length) {
    state.mission = mission.id + 1;
    return `[ACCESS GRANTED]\nMision completada: ${mission.name}\nNEXT:\n${statusText()}`;
  }

  return "[ACCESS GRANTED]\nRetroSec completo. Resultado listo para enviar a Telegram.";
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

function resetGame() {
  state = normalizeState({ mission: 1, solved: [], history: [] });
  saveState();
  output.textContent = "";
  refreshStatus();
  write("[RESET]");
  write("RetroSec vuelve a la mision 1.");
  write(statusText());
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand(input.value);
  input.value = "";
  input.focus();
});

document.querySelectorAll("[data-cmd]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.cmd));
});

resetProgress.addEventListener("click", resetGame);

setupTelegram();
refreshStatus();
write("[BOOT RETROSEC]");
write(statusText());
