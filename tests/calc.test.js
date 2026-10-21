/*
 * Tests for data.js and calc.js. Runs in the browser via tests/index.html
 * (open it, or run tests/run.ps1 for a headless run).
 */
(function () {
  "use strict";

  const D = window.ROPES_DATA;
  const C = window.ROPES_CALC;
  const G = D.units.g;
  const results = [];
  window.addEventListener("error", (e) => {
    document.getElementById("summary").textContent = "FAILED: script error: " + e.message;
  });

  function test(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, error: e.message });
    }
  }

  function eq(actual, expected, what) {
    if (actual !== expected) throw new Error(`${what || "value"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }

  function near(actual, expected, tol, what) {
    const rel = Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-9);
    if (!(rel <= tol)) throw new Error(`${what || "value"}: expected ${expected} within ${tol * 100}%, got ${actual}`);
  }

  // ------------------------------------------------------------ data integrity
  test("every rule has its fields and known sources", () => {
    const cats = ["standard", "maker", "calculation"];
    D.rules.forEach((r) => {
      ["id", "category", "title", "summary", "checked"].forEach((f) => {
        if (!r[f]) throw new Error(r.id + " missing " + f);
      });
      if (cats.indexOf(r.category) === -1) throw new Error(r.id + " has unknown category");
      if (!r.sources.length) throw new Error(r.id + " has no source");
      r.sources.forEach((s) => {
        if (!D.sources[s]) throw new Error(r.id + " cites unknown source " + s);
      });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.checked)) throw new Error(r.id + ".checked must be YYYY-MM-DD");
      if (r.category !== "calculation" && !r.quote) throw new Error(r.id + " quotes nothing from its source");
    });
  });

  test("rule ids are unique", () => {
    const ids = D.rules.map((r) => r.id);
    eq(new Set(ids).size, ids.length, "unique ids");
  });

  test("calculation rules cite the site's own physics", () => {
    D.rules.filter((r) => r.category === "calculation").forEach((r) => {
      if (r.sources.indexOf("physics") === -1) throw new Error(r.id + " is a calculation but doesn't cite physics");
    });
  });

  test("every gear type's stretch and size rules exist", () => {
    D.gearTypes.forEach((g) => {
      D.rule(g.stretchRule);
      if (g.sizeRule) D.rule(g.sizeRule);
    });
  });

  test("Factor 55's soft shackle WLLs are their breaking strengths ÷ 5", () => {
    D.softShackles.forEach((s) => eq(s.breakLb / 5, s.wllLb, s.id));
  });

  test("SECURETECH bridles: breaking strength is 4 × the vehicle mass they're rated for", () => {
    D.bridles.forEach((b) => eq(b.breakKg, 4 * b.maxVehicleKg, b.id));
  });

  test("SECURETECH rated bow shackles: 2 to 8.5 t, none under the 2 000 kg minimum", () => {
    const min = D.rule("shackle-ratings").params.minWllKg;
    eq(D.steelShackles.map((s) => s.wllT).join(","), "2,3.25,4.75,6.5,8.5", "sizes");
    D.steelShackles.forEach((s) => { if (s.wllT * 1000 < min) throw new Error(s.id); });
  });

  test("scenarios use known gear and shackles", () => {
    const ids = C.shackles(0).map((s) => s.id);
    D.scenarios.forEach((sc) => {
      if (!C.gear(sc.values.gear)) throw new Error(sc.id + " gear");
      if (ids.indexOf(sc.values.shackle) === -1) throw new Error(sc.id + " shackle");
    });
  });

  // ------------------------------------------------------------ sizing
  test("SECURETECH sizing: 2:1 lowest noted, 4:1 recommended, on the stuck vehicle; none for a static pull strap", () => {
    const r = C.sizeRange("strap", 2900);
    eq(r.minKg, 5800, "2:1");
    eq(r.recKg, 11600, "4:1");
    eq(C.rangeVerdict(12000, r), "ok", "12 t");
    eq(C.rangeVerdict(8000, r), "low", "8 t");
    eq(C.rangeVerdict(5000, r), "under", "5 t");
    eq(C.sizeRange("kinetic", 2000).recKg, 8000, "kinetic rope too");
    eq(C.sizeRange("static", 2000), null, "static pull strap");
  });

  test("SECURETECH's suggested speed is in data", () => {
    eq(D.rule("snatch-speed").params.suggestedKmh, 18, "18 km/h");
  });

  // ------------------------------------------------------------ the kinetic model
  test("kinetic: worked example (3 100 kg at 10 km/h on an 8 t, 9 m strap, 20%)", () => {
    const k = C.kinetic({ massKg: 3100, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: 10 });
    const stiff = (8000 * G) / (9 * 0.2);
    near(k.stiffNPerM, stiff, 1e-9, "stiffness");
    near(k.peakKg, ((10 / 3.6) * Math.sqrt(3100 * stiff)) / G, 1e-9, "peak");
    near(k.peakKg, 3292, 0.002, "about 3.29 t");
    eq(k.breaks, false, "doesn't break");
  });

  test("kinetic: all the energy is in the strap at the peak", () => {
    const k = C.kinetic({ massKg: 2500, mbsKg: 9000, lengthM: 9, stretch: 0.3, speedKmh: 12 });
    const peak = k.at(k.tPeak);
    near(peak.energyJ, k.energyJ, 1e-6, "½kx² = ½mv²");
    near(peak.forceKg, k.peakKg, 1e-6, "force at tPeak");
    if (Math.abs(peak.speedKmh) > 1e-6) throw new Error("the recovery vehicle has stopped at the peak");
  });

  test("kinetic: twice the speed, twice the force", () => {
    const a = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: 5 });
    const b = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: 10 });
    near(b.peakKg, 2 * a.peakKg, 1e-9, "linear in speed");
  });

  test("kinetic: speedFor(MBS) is where it breaks", () => {
    const a = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: 10 });
    const v = a.speedFor(8000);
    const at = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: v * 1.01 });
    eq(at.breaks, true, "just over breaks");
    near(at.peakKg, 8000, 1e-9, "peak capped at MBS when it breaks");
    near(at.peakStretchM, 9 * 0.2, 1e-9, "breaks at its rated stretch");
    near(at.breakEnergyJ, 0.5 * 8000 * G * 1.8, 1e-9, "energy let go");
    eq(C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: v * 0.99 }).breaks, false, "just under holds");
  });

  test("static pull strap peaks √(20% ÷ 5%) = 2 × a snatch strap", () => {
    near(C.stretchOf("static"), 0.05, 1e-9, "SECURETECH's 5% low-elongation webbing");
    const s = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: C.stretchOf("strap"), speedKmh: 8 });
    const w = C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 9, stretch: C.stretchOf("static"), speedKmh: 8 });
    near(w.peakIfUnbrokenKg / s.peakIfUnbrokenKg, 2, 1e-9, "ratio");
  });

  test("kinetic: missing inputs give null", () => {
    eq(C.kinetic({ massKg: 0, mbsKg: 8000, lengthM: 9, stretch: 0.2, speedKmh: 10 }), null, "no mass");
    eq(C.kinetic({ massKg: 3000, mbsKg: 8000, lengthM: 0, stretch: 0.2, speedKmh: 10 }), null, "no length");
  });

  // ------------------------------------------------------------ shackles and legs
  test("Crosby side loading chart", () => {
    eq(C.sideLoadKeep(0), 1, "in-line");
    eq(C.sideLoadKeep(10), 1, "10°");
    eq(C.sideLoadKeep(11), 0.85, "11°");
    eq(C.sideLoadKeep(45), 0.7, "45°");
    eq(C.sideLoadKeep(90), 0.5, "90°");
    eq(C.sideLoadKeep(95), null, "past the chart");
  });

  test("shackles: steel WLL drops with side load; soft unchanged", () => {
    const s = C.shackles(45);
    const g = s.find((x) => x.id === "bow-4.75");
    near(g.wllKg, 4750 * 0.7, 1e-9, "4.75 t at 45°");
    near(g.breakKg, 4750 * 6, 1e-9, "6:1 factor of safety");
    const f = s.find((x) => x.id === "f55-3/8");
    near(f.wllKg, C.lbToKg(8700), 1e-9, "soft WLL");
    eq(f.sideUnknown, true, "flagged: no side-load figure");
  });

  test("each end's share: all of it on one point, each leg's share on a bridle", () => {
    eq(C.endShare(false, 60), 1, "one point");
    near(C.endShare(true, 0), 0.5, 1e-9, "bridle, legs side by side");
    near(C.endShare(true, 60), 1 / (2 * Math.cos(Math.PI / 6)), 1e-9, "bridle, 60°");
    near(C.endShare(true, 120), 1, 1e-9, "bridle, 120°");
  });

  test("leg load: half side by side, 71% at 90°, all of it at 120°", () => {
    near(C.legLoad(1000, 0), 500, 1e-9, "0°");
    near(C.legLoad(1000, 90), 707.1, 1e-4, "90°");
    near(C.legLoad(1000, 120), 1000, 1e-9, "120°");
  });

  test("stand-off: SECURETECH's 2 × the (stretched) length", () => {
    near(C.standOff(9, 0.6), 19.2, 1e-9, "9 m strap stretched 0.6 m");
  });

  // ------------------------------------------------------------ typed numbers
  test("parseNumber reads a decimal comma or point, and thousands", () => {
    const cases = [
      ["2.4", 2.4], ["2,4", 2.4], ["2,", 2], ["2.", 2], [",5", 0.5], ["  7,25 ", 7.25],
      ["2 500", 2500], ["2" + String.fromCharCode(160) + "500", 2500], ["2,500", 2500], ["1,250,000", 1250000],
      ["1 234,56", 1234.56], ["1.234,56", 1234.56], ["1,234.56", 1234.56],
      ["-3", -3], [String.fromCharCode(8722) + "3", -3], ["0,125", 0.125], ["12,3456", 12.3456]
    ];
    cases.forEach(([text, want]) => eq(C.parseNumber(text), want, JSON.stringify(text)));
    ["", "-", "abc", "6.2.x", "1,2,3x"].forEach((text) => eq(isNaN(C.parseNumber(text)), true, JSON.stringify(text) + " is not a number"));
  });

  // ------------------------------------------------------------ report
  const failed = results.filter((r) => !r.ok);
  const list = document.getElementById("results");
  results.forEach((r) => {
    const li = document.createElement("li");
    li.className = r.ok ? "ok" : "bad";
    li.textContent = (r.ok ? "PASS  " : "FAIL  ") + r.name + (r.ok ? "" : "  -> " + r.error);
    list.appendChild(li);
  });
  document.getElementById("summary").textContent = failed.length
    ? `FAILED: ${failed.length} of ${results.length} tests`
    : `ALL PASSED: ${results.length} tests`;
})();
