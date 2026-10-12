/*
 * calc.js: pure calculations, no DOM. Every sourced number is read from
 * data.js (a rule's params); this file only holds the maths.
 * Masses and forces are in kg (kilogram-force, as straps and shackles are
 * labelled); convert with kgToLb() / kgToKn() for display.
 */
(function (root) {
  "use strict";

  const D = root.ROPES_DATA;
  const LB = D.units.lbToKg;
  const G = D.units.g;
  const DEG = Math.PI / 180;

  const kgToLb = (kg) => kg / LB;
  const lbToKg = (lb) => lb * LB;
  const kgToKn = (kg) => (kg * G) / 1000;
  const num = (x, fallback) => (typeof x === "number" && isFinite(x) ? x : fallback);

  function gear(id) {
    return D.gearTypes.find((g) => g.id === id) || null;
  }

  // Stretch at breaking strength for a gear type (fraction of its length).
  function stretchOf(id) {
    const g = gear(id);
    return g ? D.rule(g.stretchRule).params.stretch : null;
  }

  /*
   * The breaking strength SECURETECH asks for, from the stuck vehicle's mass:
   * its lowest noted factor of safety (2:1) and the one it recommends (4:1).
   * Static pull strap: none. Returns { ruleId, min, rec, minKg, recKg } or null.
   */
  function sizeRange(id, stuckKg) {
    const g = gear(id);
    if (!g || !g.sizeRule || !(stuckKg > 0)) return null;
    const p = D.rule(g.sizeRule).params;
    return { ruleId: g.sizeRule, min: p.min, rec: p.recommended, minKg: stuckKg * p.min, recKg: stuckKg * p.recommended };
  }

  // Where a breaking strength sits: "under" the lowest noted factor, "low" (under the recommended one) or "ok".
  function rangeVerdict(mbsKg, range) {
    if (!range) return null;
    if (mbsKg < range.minKg - 0.5) return "under";
    if (mbsKg < range.recKg - 0.5) return "low";
    return "ok";
  }

  /*
   * Kinetic recovery as a spring (rule kinetic-model). The strap reaches its
   * breaking strength at its rated stretch; the stuck vehicle is held still,
   * so all of the moving vehicle's energy goes into the strap (the highest force).
   * k: { massKg (the moving vehicle), mbsKg, lengthM, stretch (fraction), speedKmh }
   */
  function kinetic(k) {
    const m = num(k.massKg, 0);
    const L = num(k.lengthM, 0);
    const s = num(k.stretch, 0);
    const mbsN = num(k.mbsKg, 0) * G;
    if (!(m > 0 && L > 0 && s > 0 && mbsN > 0)) return null;
    const stiff = mbsN / (L * s); // N per metre of stretch
    const omega = Math.sqrt(stiff / m); // rad/s
    const v = Math.max(0, num(k.speedKmh, 0)) / 3.6;
    const peakN = v * Math.sqrt(m * stiff);
    const breaks = peakN >= mbsN - 1e-9 && v > 0;
    const tPeak = Math.PI / (2 * omega);
    const tBreak = breaks ? Math.asin(Math.min(1, mbsN / peakN)) / omega : null;
    const tEnd = breaks ? tBreak : Math.PI / omega;
    const at = (t) => {
      const x = (v / omega) * Math.sin(omega * t);
      return { t, stretchM: x, forceKg: (stiff * x) / G, speedKmh: v * Math.cos(omega * t) * 3.6, energyJ: 0.5 * stiff * x * x };
    };
    // speed (km/h) at which the peak force reaches a given force
    const speedFor = (forceKg) => ((forceKg * G) / Math.sqrt(m * stiff)) * 3.6;
    const points = [];
    const n = 120;
    for (let i = 0; i <= n; i++) points.push(at((tEnd * i) / n));
    return {
      stiffNPerM: stiff,
      omega,
      speedMs: v,
      energyJ: 0.5 * m * v * v,
      peakKg: breaks ? mbsN / G : peakN / G,
      peakIfUnbrokenKg: peakN / G,
      peakStretchM: breaks ? L * s : peakN / stiff,
      tPeak: breaks ? tBreak : tPeak,
      tEnd,
      breaks,
      // energy in the strap when it is at its breaking strength: all of it is let go at once
      breakEnergyJ: 0.5 * mbsN * L * s,
      speedFor,
      at,
      points,
    };
  }

  // Bushranger's stand-off: 1.5 x the strap's length, taken at its stretched length.
  function standOff(lengthM, stretchM) {
    return D.rule("stand-clear").params.factor * (num(lengthM, 0) + Math.max(0, num(stretchM, 0)));
  }

  // Fraction of a steel shackle's WLL left when it's pulled `deg` off in-line (Crosby's chart).
  function sideLoadKeep(deg) {
    const d = Math.abs(num(deg, 0));
    const band = D.rule("shackle-side-load").params.bands.find((b) => d <= b.toDeg + 1e-9);
    return band ? band.keep : null; // past 90°: not in the chart
  }

  /*
   * Every shackle on the page with its working figures at a side-load angle.
   * Steel: SECURETECH rated bow shackle WLL × Crosby's side-load factor.
   * Soft: Factor 55's WLL and breaking strength; no side-load figure (a gap).
   */
  function shackles(sideDeg) {
    const keep = sideLoadKeep(sideDeg);
    const steel = D.steelShackles.map((s) => ({
      id: s.id,
      kind: "steel",
      name: `${s.size} rated bow shackle`,
      size: s.size,
      ratedWllKg: s.wllT * 1000,
      wllKg: keep === null ? 0 : s.wllT * 1000 * keep,
      breakKg: s.wllT * 1000 * D.rule("shackle-ratings").params.designFactor, // SECURETECH: 6:1
      keep,
    }));
    const soft = D.softShackles.map((s) => ({
      id: s.id,
      kind: "soft",
      name: `${s.size} soft shackle`,
      size: s.size,
      ratedWllKg: lbToKg(s.wllLb),
      wllKg: lbToKg(s.wllLb),
      breakKg: lbToKg(s.breakLb),
      keep: 1,
      sideUnknown: Math.abs(num(sideDeg, 0)) > 10,
    }));
    return steel.concat(soft);
  }

  // Each of two legs sharing a pull at an included angle (rule leg-load).
  function legLoad(totalKg, includedDeg) {
    const half = (Math.max(0, num(includedDeg, 0)) / 2) * DEG;
    const c = Math.cos(half);
    return c > 1e-6 ? num(totalKg, 0) / (2 * c) : Infinity;
  }

  /*
   * The share of the strap's force on each shackle and recovery point at one
   * end: all of it on a single point, each leg's share (rule leg-load) on a bridle.
   */
  function endShare(bridled, bridleDeg) {
    return bridled ? legLoad(1, bridleDeg) : 1;
  }

  root.ROPES_CALC = {
    kgToLb,
    lbToKg,
    kgToKn,
    gear,
    stretchOf,
    sizeRange,
    rangeVerdict,
    kinetic,
    standOff,
    sideLoadKeep,
    shackles,
    legLoad,
    endShare,
  };
})(window);
