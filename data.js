// WALL-E F1 - Datos estaticos (temporada 2026)
// Todo es deterministico: nada de backend, todo vive en el navegador.

const APP_VERSION = "1.0.0";
const SEASON = 2026;

const TEAMS = [
  {
    id: "mclaren", name: "McLaren", short: "MCL",
    color: "#ff8000", color2: "#1a1a1a",
    drivers: [
      { name: "Lando Norris", short: "NOR" },
      { name: "Oscar Piastri", short: "PIA" }
    ]
  },
  {
    id: "ferrari", name: "Ferrari", short: "FER",
    color: "#e8002d", color2: "#fff200",
    drivers: [
      { name: "Charles Leclerc", short: "LEC" },
      { name: "Lewis Hamilton", short: "HAM" }
    ]
  },
  {
    id: "redbull", name: "Red Bull", short: "RBR",
    color: "#1e3fa0", color2: "#e10600",
    drivers: [
      { name: "Max Verstappen", short: "VER" },
      { name: "Isack Hadjar", short: "HAD" }
    ]
  },
  {
    id: "mercedes", name: "Mercedes", short: "MER",
    color: "#00d2be", color2: "#c8c8c8",
    drivers: [
      { name: "George Russell", short: "RUS" },
      { name: "Kimi Antonelli", short: "ANT" }
    ]
  }
];

// Compuestos: pace = segundos vs base (negativo = mas rapido), deg = desgaste lineal por vuelta,
// cliff = vuelta donde la goma cae de golpe, idealWet = humedad ideal (0 seco .. 1 mojado).
const COMPOUNDS = [
  { id: "soft",   name: "Blanda",     abbr: "B", color: "#ff2d2d", pace: -0.60, deg: 0.10, cliff: 7,  idealWet: 0.00 },
  { id: "medium", name: "Media",      abbr: "M", color: "#ffd200", pace: -0.20, deg: 0.08, cliff: 10, idealWet: 0.00 },
  { id: "hard",   name: "Dura",       abbr: "D", color: "#e6e6e6", pace: 0.10,  deg: 0.06, cliff: 13, idealWet: 0.05 },
  { id: "inter",  name: "Intermedia", abbr: "I", color: "#2ecc40", pace: 1.20,  deg: 0.18, cliff: 12, idealWet: 0.55 },
  { id: "wet",    name: "Lluvia",     abbr: "L", color: "#2b6cff", pace: 2.00,  deg: 0.12, cliff: 18, idealWet: 0.90 }
];

// Pistas: 6 circuitos, carreras de 24 vueltas.
// wear = multiplicador de desgaste, overtaking = facilidad de adelantar,
// rainChance = probabilidad de que aparezca lluvia, scChance = chance base de Safety Car.
// path = circuito estilizado en coordenadas 0..1 para dibujar en canvas.
const TRACKS = [
  {
    id: "monza", name: "Monza", country: "Italia", flag: "IT",
    baseLap: 83.5, wear: 0.92, overtaking: 1.30, rainChance: 0.18, scChance: 0.16, temp: 27,
    path: [[0.10,0.68],[0.10,0.26],[0.30,0.20],[0.55,0.26],[0.80,0.20],[0.92,0.32],[0.90,0.55],[0.70,0.60],[0.86,0.80],[0.60,0.88],[0.34,0.80],[0.18,0.86]]
  },
  {
    id: "monaco", name: "Monaco", country: "Monaco", flag: "MC",
    baseLap: 73.5, wear: 0.82, overtaking: 0.35, rainChance: 0.22, scChance: 0.34, temp: 24,
    path: [[0.16,0.56],[0.26,0.30],[0.46,0.22],[0.60,0.31],[0.62,0.48],[0.80,0.45],[0.88,0.61],[0.80,0.79],[0.55,0.83],[0.45,0.70],[0.28,0.81],[0.12,0.72]]
  },
  {
    id: "silverstone", name: "Silverstone", country: "Reino Unido", flag: "GB",
    baseLap: 88.2, wear: 1.15, overtaking: 1.00, rainChance: 0.42, scChance: 0.18, temp: 19,
    path: [[0.10,0.50],[0.20,0.25],[0.42,0.18],[0.62,0.28],[0.78,0.18],[0.92,0.36],[0.85,0.56],[0.65,0.61],[0.80,0.79],[0.55,0.89],[0.30,0.83],[0.15,0.71]]
  },
  {
    id: "spa", name: "Spa", country: "Belgica", flag: "BE",
    baseLap: 105.4, wear: 0.98, overtaking: 1.05, rainChance: 0.55, scChance: 0.20, temp: 17,
    path: [[0.10,0.35],[0.35,0.20],[0.60,0.30],[0.80,0.20],[0.92,0.41],[0.80,0.66],[0.55,0.58],[0.62,0.83],[0.38,0.89],[0.20,0.70],[0.28,0.50]]
  },
  {
    id: "singapore", name: "Singapur", country: "Singapur", flag: "SG",
    baseLap: 95.1, wear: 1.05, overtaking: 0.55, rainChance: 0.30, scChance: 0.40, temp: 30,
    path: [[0.12,0.68],[0.12,0.36],[0.30,0.22],[0.50,0.28],[0.55,0.48],[0.72,0.40],[0.88,0.52],[0.82,0.72],[0.58,0.80],[0.40,0.72],[0.45,0.55],[0.28,0.60]]
  },
  {
    id: "interlagos", name: "Interlagos", country: "Brasil", flag: "BR",
    baseLap: 71.0, wear: 1.02, overtaking: 1.12, rainChance: 0.38, scChance: 0.24, temp: 26,
    path: [[0.15,0.60],[0.22,0.30],[0.45,0.20],[0.68,0.30],[0.80,0.50],[0.62,0.58],[0.72,0.78],[0.48,0.82],[0.30,0.72],[0.18,0.78]]
  }
];

const RACE_LAPS = 24;
TRACKS.forEach((t) => { t.laps = RACE_LAPS; });
