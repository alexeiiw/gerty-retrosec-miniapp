// WALL-E F1 - Motor de simulacion
// Deterministico por semilla: misma semilla = misma carrera. Sin backend.

const WalleSim = (() => {
  function hashSeed(str) {
    let h = 2166136261;
    for (const ch of String(str)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function compoundById(id) {
    return COMPOUNDS.find((c) => c.id === id) || COMPOUNDS[1];
  }

  function buildWeather(track, rng) {
    const laps = track.laps;
    const arr = Array.from({ length: laps }, () => ({ wetness: 0, code: 0 }));
    if (rng() < track.rainChance) {
      const start = 3 + Math.floor(rng() * (laps - 12));
      const dur = 5 + Math.floor(rng() * (laps - start - 3));
      const peak = 0.45 + rng() * 0.55;
      for (let i = 0; i < laps; i++) {
        const d = i - start;
        let w = 0;
        if (d >= 0 && d < dur) w = peak * Math.sin(Math.PI * (d / dur));
        w = Math.max(0, Math.min(1, w));
        arr[i] = { wetness: w, code: w < 0.15 ? 0 : w < 0.55 ? 1 : 2 };
      }
    }
    return arr;
  }

  function weatherLabel(code) {
    if (code === 0) return "Seco";
    if (code === 1) return "Lluvia ligera";
    return "Lluvia fuerte";
  }

  function tireWear(compound, lapsOn, track, wetness) {
    const life = compound.cliff / track.wear;
    let w = compound.deg * lapsOn * track.wear * (1 + wetness * 0.5);
    if (lapsOn > life) w += (lapsOn - life) * 2.2 * track.wear;
    return w;
  }

  function weatherPenalty(compound, wetness) {
    return Math.abs(wetness - compound.idealWet) * 7;
  }

  function buildCars(selectedTeamId, rng) {
    const cars = [];
    for (const team of TEAMS) {
      team.drivers.forEach((driver, idx) => {
        cars.push({
          teamId: team.id,
          teamName: team.name,
          teamShort: team.short,
          color: team.color,
          driverIdx: idx,
          name: driver.name,
          short: driver.short,
          isPlayer: team.id === selectedTeamId,
          form: (rng() - 0.5) * 0.30,
          risk: 0.85 + rng() * 0.3,
          cum: [0],
          lapTimes: [],
          seg: [],
          events: [],
          dnf: false,
          dnfLap: null
        });
      });
    }
    return cars;
  }

  function qualify(cars, track, rng) {
    const order = cars
      .map((c, i) => ({ id: i, time: track.baseLap + c.form + rng() * 0.55 }))
      .sort((a, b) => a.time - b.time);
    order.forEach((entry, pos) => {
      cars[entry.id].gridPos = pos + 1;
      cars[entry.id].qualiTime = entry.time;
    });
    return cars.slice().sort((a, b) => a.gridPos - b.gridPos);
  }

  function pickAiStrategy(weather) {
    const rainy = weather.some((w) => w.wetness > 0.25);
    if (rainy) {
      const rainStart = weather.findIndex((w) => w.wetness > 0.3);
      return { compounds: ["medium", "inter"], pitLap: Math.max(2, rainStart - 1) };
    }
    return { compounds: ["medium", "hard"], pitLap: 12 };
  }

  // Igual que el arranque de runSimulation: misma semilla => mismo clima y misma clasificacion.
  function preview(seed, track, teamId) {
    const rng = mulberry32(hashSeed(seed + "|" + track.id));
    const weather = buildWeather(track, rng);
    const cars = buildCars(teamId, rng);
    qualify(cars, track, rng);
    return { weather, cars };
  }

  function runSimulation(cfg) {
    const { track, teamId, strategy, seed } = cfg;
    const rng = mulberry32(hashSeed(seed + "|" + track.id));
    const weather = buildWeather(track, rng);
    const cars = buildCars(teamId, rng);
    qualify(cars, track, rng);

    const ai = pickAiStrategy(weather);
    for (const car of cars) {
      if (car.isPlayer) {
        const s = strategy[car.driverIdx] || strategy[0];
        car.compounds = [s.compounds[0], s.compounds[1]];
        car.pitLap = Math.max(1, Math.min(track.laps, s.pitLap || 12));
      } else {
        car.compounds = ai.compounds.slice();
        car.pitLap = ai.pitLap;
      }
      car.compound = compoundById(car.compounds[0]);
      car.pitDone = false;
      car.lapsOn = 0;
    }

    const laps = track.laps;
    let scNext = false;

    for (let l = 0; l < laps; l++) {
      const w = weather[l];
      const scActive = scNext;
      scNext = false;
      const alive = cars.filter((c) => !c.dnf);

      for (const car of alive) {
        const compound = car.compound;
        let time =
          track.baseLap +
          compound.pace +
          weatherPenalty(compound, w.wetness) +
          tireWear(compound, car.lapsOn, track, w.wetness) +
          0.55 * (1 - l / laps) +
          car.form +
          (rng() - 0.5) * 0.35;

        if (l === 0) time += car.gridPos * 0.12;

        const pitting = !car.pitDone && car.pitLap === l + 1 && l < laps - 1;
        if (pitting) time += scActive ? 8 : 19;

        if (scActive) time += 22;

        car.seg.push(compound.id);
        car.lastRaw = time;
        car.pittingNow = pitting;
        car.lapsOn++;
      }

      const ordered = cars.filter((c) => !c.dnf).sort((a, b) => {
        return a.cum[a.cum.length - 1] + a.lastRaw - (b.cum[b.cum.length - 1] + b.lastRaw);
      });
      for (let i = 1; i < ordered.length; i++) {
        const a = ordered[i - 1];
        const b = ordered[i];
        const gap = (b.cum[b.cum.length - 1] + b.lastRaw) - (a.cum[a.cum.length - 1] + a.lastRaw);
        if (gap < 1.2) {
          const stuck = (1 - track.overtaking) * (1.2 - gap) * 0.9;
          if (stuck > 0) b.lastRaw += stuck;
        }
      }

      let accident = false;
      for (const car of cars.filter((c) => !c.dnf)) {
        const p = 0.0035 * (1 + w.wetness * 1.6) * (car.risk || 1);
        if (rng() < p) {
          car.lastRaw += 18 + rng() * 22;
          accident = true;
          if (rng() < 0.22) {
            car.dnf = true;
            car.dnfLap = l + 1;
            car.events.push(`V${l + 1} abandono`);
          } else {
            car.events.push(`V${l + 1} incidente`);
          }
        }
      }

      for (const car of cars) {
        if (car.dnf && car.dnfLap !== l + 1) continue;
        if (car.dnf && car.lapTimes.length > l) continue;
        if (car.dnf) { car.cum.push(car.cum[car.cum.length - 1] + car.lastRaw); continue; }
        car.cum.push(car.cum[car.cum.length - 1] + car.lastRaw);
        car.lapTimes.push(car.lastRaw);
        if (car.pittingNow) {
          car.compound = compoundById(car.compounds[1]);
          car.lapsOn = 0;
          car.pitDone = true;
        }
      }

      if (accident) {
        const finishers = cars.filter((c) => !c.dnf).sort((a, b) => a.cum[a.cum.length - 1] - b.cum[b.cum.length - 1]);
        const base = finishers.length ? finishers[0].cum[finishers[0].cum.length - 1] : 0;
        finishers.forEach((c, i) => {
          const packed = base + i * 0.9;
          if (c.cum[c.cum.length - 1] > packed) c.cum[c.cum.length - 1] = packed;
        });
        scNext = true;
      }
    }

    const finishers = cars.filter((c) => !c.dnf).sort((a, b) => a.cum[a.cum.length - 1] - b.cum[b.cum.length - 1]);
    const dnfs = cars.filter((c) => c.dnf).sort((a, b) => (a.dnfLap || 99) - (b.dnfLap || 99));
    const finalOrder = finishers.concat(dnfs);
    finalOrder.forEach((c, i) => { c.finishPos = i + 1; });

    const playerCars = cars.filter((c) => c.isPlayer);
    const bestPos = Math.min(...playerCars.map((c) => c.finishPos));
    const winner = finalOrder[0];

    const summary = buildSummary(track, weather, playerCars, bestPos);

    return {
      seed,
      track,
      weather,
      cars,
      finalOrder,
      playerCars,
      bestPos,
      won: bestPos === 1,
      podium: bestPos <= 3,
      winner,
      raceTime: winner.cum[winner.cum.length - 1],
      summary
    };
  }

  function buildSummary(track, weather, playerCars, bestPos) {
    const bullets = [];
    const wetLaps = weather.filter((w) => w.wetness > 0.3).length;
    const usedWetTire = playerCars.some((c) => c.compounds.some((id) => id === "inter" || id === "wet"));
    const usedDry = playerCars.some((c) => c.compounds.some((id) => id === "soft" || id === "medium" || id === "hard"));

    if (wetLaps > 4 && !usedWetTire) bullets.push(`Hubo ${wetLaps} vueltas de lluvia y no pusiste neumatico de mojado: perdiste mucho tiempo en ese tramo.`);
    if (wetLaps < 3 && usedWetTire) bullets.push("Casi no llovio y montaste neumatico de mojado: fuiste lento en seco.");
    if (usedDry && usedWetTire) bullets.push("Buena lectura: combinaste seco y mojado segun el clima.");

    const avgPit = Math.round(playerCars.reduce((s, c) => s + c.pitLap, 0) / playerCars.length);
    if (wetLaps > 4 && avgPit > weather.findIndex((w) => w.wetness > 0.3)) bullets.push("La lluvia llego antes de tu parada: entraste a boxes tarde.");
    if (!bullets.length) bullets.push("Estrategia solida: la simulacion decide por tiempos, no por suerte.");

    return {
      wetLaps,
      result: bestPos === 1 ? "GANASTE" : bestPos <= 3 ? "PODIO" : "Sin podio",
      bullets
    };
  }

  // Posicion en pista (vueltas completadas, float) para un auto en el tiempo T de carrera.
  function carProgressAt(car, T, totalLaps) {
    const cum = car.cum;
    let last = cum.length - 1;
    if (T >= cum[last]) return last;
    let l = 0;
    while (l < last && cum[l + 1] < T) l++;
    const segTime = cum[l + 1] - cum[l] || 1;
    return l + (T - cum[l]) / segTime;
  }

  return { hashSeed, mulberry32, buildWeather, weatherLabel, qualify, preview, runSimulation, carProgressAt, compoundById };
})();

if (typeof window !== "undefined") window.WalleSim = WalleSim;
