/*
 * app.js: one page, one state. The inputs live on the pictures (each vehicle's
 * mass on it, the strap's strength and length on the strap); the pictures are
 * built once and updated in place so changes animate.
 * State is kept in this browser's localStorage only.
 */
(function () {
  "use strict";

  const D = window.ROPES_DATA;
  const C = window.ROPES_CALC;
  const U = window.ROPES_UI;
  const V = window.ROPES_DIAGRAMS;
  const { el } = U;
  const $ = (id) => document.getElementById(id);
  const STORE = "ropes-recovery-v1";
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const saved = load();
  let S = Object.assign({}, D.defaults, saved);
  if (!C.gear(S.gear)) S.gear = D.defaults.gear;
  // before 2026-10-12 one shackle served both ends
  if (saved.shackle && !saved.shackleStuck) {
    S.shackleStuck = saved.shackle;
    S.shackleRec = saved.shackle;
  }
  delete S.shackle;
  // the two ends of the recovery: each has its own shackle, and a bridle or not
  const ENDS = {
    stuck: { shackle: "shackleStuck", bridle: "bridleStuck", name: "Stuck end", of: "the stuck end's", vehicle: "stuck vehicle" },
    rec: { shackle: "shackleRec", bridle: "bridleRec", name: "Recovery end", of: "the recovery end's", vehicle: "recovery vehicle" },
  };
  let R = null; // latest results
  let sceneView = null;
  let gaugeView = null;
  let shackleView = null;
  let snatchChart = null;
  let speedChart = null;
  let live = {};
  const play = { raf: 0, t: null };
  const LEAD = 0.25; // share of the playback spent driving the slack out (illustration)
  const DUR = 5000; // ms for one playback

  // ------------------------------------------------------------ state
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(S));
    } catch (e) { /* storage blocked: the page still works, it just won't remember */ }
  }
  function set(patch) {
    Object.assign(S, patch);
    save();
    update();
  }
  const numOr = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);

  // ------------------------------------------------------------ results
  function compute() {
    const stuck = numOr(S.stuckKg, 0);
    const recv = numOr(S.recKg, 0);
    const mbs = numOr(S.mbsKg, 0);
    const len = numOr(S.lengthM, 0);
    const missing = !(stuck > 0) ? "stuck" : !(recv > 0) ? "rec" : !(mbs > 0) ? "mbs" : !(len > 0) ? "length" : null;
    if (missing) return { missing };
    const gear = C.gear(S.gear);
    const stretch = C.stretchOf(S.gear);
    const speed = Math.max(1, numOr(S.speedKmh, 10));
    const kin = C.kinetic({ massKg: recv, mbsKg: mbs, lengthM: len, stretch, speedKmh: speed });
    const range = C.sizeRange(S.gear, stuck);
    const fit = C.rangeVerdict(mbs, range);
    const all = C.shackles(numOr(S.sideDeg, 0));
    const findShackle = (id) => all.find((s) => s.id === id) || all.find((s) => s.id === D.defaults.shackleStuck);
    const pointKg = numOr(S.pointKg, 0) > 0 ? S.pointKg : null;
    const demand = kin.peakIfUnbrokenKg;
    const bridle = D.bridles.find((x) => x.id === S.bridle) || D.bridles[0];
    const bridleDeg = numOr(S.bridleDeg, 60);
    const maxDeg = D.rule("shackle-included-angle").params.maxDeg;
    // each end: its shackle, and on a bridle each shackle and point takes one leg's share (rule leg-load)
    const ends = Object.keys(ENDS).map((side) => {
      const E = ENDS[side];
      const bridled = !!S[E.bridle];
      return Object.assign({}, E, { side, bridled, share: C.endShare(bridled, bridleDeg), shackle: findShackle(S[E.shackle]), vehicleKg: side === "stuck" ? stuck : recv });
    });
    /*
     * What the peak must stay under (SECURETECH: allow for the full load; Bushranger:
     * never exceed the strap's MBS, the recovery points or the shackles' WLL).
     * kg is the part's rating; share is how much of the strap's force it takes.
     */
    const limits = [{ id: "mbs", type: "mbs", label: `${gear.short} breaks at`, what: `the ${gear.short.toLowerCase()}'s breaking strength`, kg: mbs, share: 1 }];
    ends.forEach((e) => {
      const sh = `${e.shackle.size} ${e.shackle.kind === "soft" ? "soft shackle" : "shackle"}`;
      limits.push({ id: "shackle-" + e.side, type: "shackle", side: e.side, label: e.bridled ? `${e.name}, bridle: each ${sh}'s WLL` : `${e.name}: ${sh} WLL`, what: `${e.of} ${e.shackle.kind === "soft" ? "soft shackle" : "shackle"} WLL`, kg: e.shackle.wllKg, share: e.share });
      if (pointKg) limits.push({ id: "point-" + e.side, type: "point", side: e.side, label: e.bridled ? `${e.name}, bridle: each recovery point` : `${e.name}: recovery point`, what: `${e.of} recovery point rating`, kg: pointKg, share: e.share });
      // SECURETECH gives one breaking strength for the bridle: checked against the whole pull
      if (e.bridled) limits.push({ id: "bridle-" + e.side, type: "bridle", side: e.side, label: `${e.name}: bridle breaks at`, what: `${e.of} bridle's breaking strength`, kg: bridle.breakKg, share: 1 });
    });
    // the same part at both ends shows once
    const merged = [];
    limits.forEach((l) => {
      const twin = l.side === "rec" && merged.find((m) => m.side === "stuck" && m.type === l.type && m.kg === l.kg && Math.abs(m.share - l.share) < 1e-9 && m.label.replace("Stuck end", "") === l.label.replace("Recovery end", ""));
      if (!twin) return merged.push(l);
      twin.side = "both";
      twin.id = twin.type + "-both";
      twin.label = twin.label.replace("Stuck end", "Both ends");
      twin.what = twin.what.replace("the stuck end's", "both ends'");
    });
    const SHORT = { mbs: "Breaks", shackle: "Shackle WLL", point: "Point", bridle: "Bridle" };
    const TINY = { mbs: "Breaks", shackle: "WLL", point: "Point", bridle: "Bridle" };
    merged.forEach((l) => {
      const tag = l.side === "stuck" ? " (stuck)" : l.side === "rec" ? " (rec.)" : "";
      l.short = SHORT[l.type] + tag;
      l.tiny = TINY[l.type] + tag;
      l.cls = "lim-" + l.type;
      l.loadKg = demand * l.share; // what the part carries at the peak
      l.atKg = l.kg / l.share; // the strap force at which the part reaches its rating
      l.speed = kin.speedFor(l.atKg);
      l.ok = l.loadKg < l.kg;
    });
    const weakest = merged.reduce((a, b) => (b.atKg < a.atKg ? b : a));
    const keepUnder = Math.floor(weakest.speed);
    // bridle checks that aren't forces
    const issues = [];
    ends.filter((e) => e.bridled).forEach((e) => {
      if (e.vehicleKg > bridle.maxVehicleKg) {
        const bigger = D.bridles.find((b) => b.maxVehicleKg >= e.vehicleKg);
        issues.push({ tone: "fail", head: `The bridle is too light for the ${e.vehicle}`, detail: `SECURETECH rates its ${bridle.label} bridle for vehicles up to ${U.kg(bridle.maxVehicleKg)}; the ${e.vehicle} is ${U.kg(e.vehicleKg)}.`, fix: bigger ? { text: `Use SECURETECH's ${bigger.label} bridle`, patch: { bridle: bigger.id } } : { text: "SECURETECH lists no bridle for a vehicle this heavy", patch: null } });
      }
      if (e.shackle.kind === "soft") issues.push({ tone: "warn", head: `Soft shackles on the ${e.side === "stuck" ? "stuck" : "recovery"} end's bridle`, detail: "SECURETECH fits its bridles to the vehicle with rated bow shackles." });
    });
    if (ends.some((e) => e.bridled) && bridleDeg > maxDeg) issues.push({ tone: "fail", head: `Bridle legs more than ${maxDeg}° apart`, detail: `Crosby: never put two legs more than ${maxDeg}° apart in one shackle's bow. At ${bridleDeg}° each leg takes ${Math.round(C.endShare(true, bridleDeg) * 100)}% of the pull. Use a longer bridle.`, fix: { text: `Bring the legs to ${maxDeg}°`, patch: { bridleDeg: maxDeg } } });
    return { stuck, recv, mbs, len, gear, stretch, speed, kin, range, fit, all, ends, bridle, bridleDeg, pointKg, demand, limits: merged, weakest, keepUnder, issues };
  }

  // ------------------------------------------------------------ build once
  function build() {
    D.scenarios.forEach((sc) => {
      const b = el("button", { type: "button", class: "try-chip" }, sc.label);
      b.addEventListener("click", () => {
        stopPlay();
        const v = Object.assign({}, sc.values);
        const sh = v.shackle;
        delete v.shackle;
        set(Object.assign({ sideDeg: 0, pointKg: null, bridleStuck: false, bridleRec: false }, v, sh ? { shackleStuck: sh, shackleRec: sh } : {}));
        syncInputs();
        play.t = 0;
        if (!reduceMotion) startPlay();
      });
      $("try").appendChild(b);
    });

    sceneView = V.scene();
    $("scene-pic").prepend(sceneView.el);
    placeFields();

    D.gearTypes.forEach((g) => {
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-gear": g.id, "aria-checked": "false" },
        el("span", { class: "chip-line chip-line--" + g.id, "aria-hidden": "true" }), g.label);
      b.addEventListener("click", () => set({ gear: g.id }));
      $("gear-chips").appendChild(b);
    });

    $("speedKmh").max = D.speedMaxKmh;
    $("speedKmh").addEventListener("input", (e) => set({ speedKmh: +e.target.value }));

    const bindNum = (id, key, allowEmpty) => $(id).addEventListener("input", (e) => {
      const v = parseFloat(e.target.value);
      if (isFinite(v) && v > 0) set({ [key]: v });
      else if (allowEmpty && e.target.value === "") set({ [key]: null });
    });
    bindNum("stuckKg", "stuckKg");
    bindNum("recKg", "recKg");
    bindNum("mbsKg", "mbsKg");
    bindNum("lengthM", "lengthM");
    bindNum("pointKg", "pointKg", true);
    bindNum("treePullKg", "treePullKg");

    gaugeView = V.gauge();
    $("gauge").appendChild(gaugeView.el);
    $("play").addEventListener("click", () => {
      if (play.raf) return stopPlay();
      if (play.t === null || play.t >= 1 - 1e-6) play.t = 0;
      startPlay();
    });

    Object.keys(ENDS).forEach((side) => {
      const b = el("button", { type: "button", role: "radio", class: "end-tab", "data-end": side, "aria-checked": "false" },
        el("span", { class: "end-tab-name" }, ENDS[side].name), el("small", { class: "end-tab-sub" }));
      b.addEventListener("click", () => set({ endTab: side }));
      $("end-tabs").appendChild(b);
    });
    [{ id: "point", label: "One recovery point", bridled: false }, { id: "bridle", label: "Bridle across two points", bridled: true }].forEach((o) => {
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-hook": o.id, "aria-checked": "false" }, o.label);
      b.addEventListener("click", () => set({ [ENDS[endTab()].bridle]: o.bridled }));
      $("hook-chips").appendChild(b);
    });
    D.bridles.forEach((p) => {
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-bridle": p.id, "aria-checked": "false" }, `SECURETECH ${p.label}`);
      b.addEventListener("click", () => set({ bridle: p.id }));
      $("hook-bridle-chips").appendChild(b);
    });
    $("hookBridleDeg").addEventListener("input", (e) => set({ bridleDeg: +e.target.value }));

    shackleView = V.shackleView();
    $("side-view").appendChild(shackleView.el);
    $("sideDeg").addEventListener("input", (e) => set({ sideDeg: +e.target.value }));

    D.treeProtectors.forEach((p) => {
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-protector": p.id, "aria-checked": "false" }, `WARN Epic ${p.label}`);
      b.addEventListener("click", () => set({ protector: p.id }));
      $("protector-chips").appendChild(b);
    });
    $("treeDeg").addEventListener("input", (e) => set({ treeDeg: +e.target.value }));
    D.bridles.forEach((p) => {
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-bridle": p.id, "aria-checked": "false" }, `SECURETECH ${p.label}`);
      b.addEventListener("click", () => set({ bridle: p.id }));
      $("bridle-chips").appendChild(b);
    });
    $("bridleDeg").addEventListener("input", (e) => set({ bridleDeg: +e.target.value }));

    renderExplainers();
    syncInputs();

    let lastW = 0;
    let timer = null;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if ($("stage").clientWidth !== lastW) {
          lastW = $("stage").clientWidth;
          placeFields();
          update();
        }
      }, 150);
    });
    $("year").textContent = new Date().getFullYear();
  }

  // Wide screens: the typed fields sit on the picture. Phones: under it.
  function placeFields() {
    const fields = document.querySelector(".scene-fields");
    const narrow = window.matchMedia("(max-width: 860px)").matches;
    const home = narrow ? $("scene") : $("scene-pic");
    if (fields.parentNode !== home) home.appendChild(fields);
  }

  const endTab = () => (ENDS[S.endTab] ? S.endTab : "stuck");

  function syncInputs() {
    $("stuckKg").value = S.stuckKg || "";
    $("recKg").value = S.recKg || "";
    $("mbsKg").value = S.mbsKg || "";
    $("lengthM").value = S.lengthM || "";
    $("speedKmh").value = S.speedKmh || 10;
    $("sideDeg").value = S.sideDeg || 0;
    $("pointKg").value = S.pointKg || "";
    $("treePullKg").value = S.treePullKg || "";
    $("treeDeg").value = numOr(S.treeDeg, 30);
    $("bridleDeg").value = numOr(S.bridleDeg, 60);
    $("hookBridleDeg").value = numOr(S.bridleDeg, 60);
  }

  // ------------------------------------------------------------ update
  function update() {
    R = compute();
    document.querySelectorAll("#gear-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.gear === S.gear)));
    document.querySelectorAll("#protector-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.protector === S.protector)));
    document.querySelectorAll("#bridle-chips .chip, #hook-bridle-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.bridle === S.bridle)));
    const tab = endTab();
    const tabBridled = !!S[ENDS[tab].bridle];
    document.querySelectorAll("#hook-chips .chip").forEach((b) => b.setAttribute("aria-checked", String((b.dataset.hook === "bridle") === tabBridled)));
    $("hook-bridle").hidden = !tabBridled;
    const bDeg = numOr(S.bridleDeg, 60);
    // the bridle angle has two sliders (here and under Bridle): keep them together
    $("bridleDeg").value = bDeg;
    $("hookBridleDeg").value = bDeg;
    $("hook-bridle-out").textContent = `${bDeg}° between the legs`;
    document.querySelectorAll("#end-tabs .end-tab").forEach((b) => {
      const E = ENDS[b.dataset.end];
      b.setAttribute("aria-checked", String(b.dataset.end === tab));
      const soft = D.softShackles.find((x) => x.id === S[E.shackle]);
      const steel = D.steelShackles.find((x) => x.id === S[E.shackle]);
      const size = (soft || steel || D.steelShackles.find((x) => x.id === D.defaults.shackleStuck)).size;
      b.querySelector(".end-tab-sub").textContent = S[E.bridle] ? `Bridle, 2 × ${size}${soft ? " soft" : ""} shackles` : `${size} ${soft ? "soft shackle" : "shackle"}`;
    });
    const sp = Math.max(1, numOr(S.speedKmh, 10));
    $("speed-out").textContent = `${sp} km/h`;
    const gear = C.gear(S.gear);
    $("strap-label").textContent = gear.label;
    const sd = numOr(S.sideDeg, 0);
    shackleView.set(sd);
    $("side-out").textContent = sd ? `${sd}°` : "In-line";

    if (R.missing) {
      stopPlay();
      const pos = sceneView.update({ gear: S.gear, dx: -24, broken: null, speedText: "", gearText: gear.label });
      placeOverlays(pos);
      const v = $("verdict");
      v.className = "verdict verdict--info";
      v.replaceChildren(el("div", { class: "verdict-top" }, U.statusIcon("incomplete"), el("p", { class: "verdict-head" },
        { stuck: "Type the stuck vehicle's mass on it.", rec: "Type the recovery vehicle's mass on it.", mbs: `Type the ${gear.short.toLowerCase()}'s breaking strength (MBS) on it.`, length: `Type the ${gear.short.toLowerCase()}'s length.` }[R.missing])));
      ["readouts", "sizes", "shackles", "shackle-hint", "shackle-notes", "stage-sources", "chart-snatch", "gauge-legend", "lanyard-body", "tree-body", "bridle-body", "lanyard-pic"].forEach((id) => $(id).replaceChildren());
      renderTree();
      return;
    }
    renderVerdict();
    renderPlay();
    renderSizes();
    renderShackles();
    renderLanyard();
    renderTree();
    renderBridle();
    $("stage-sources").replaceChildren(U.sourcesLine(["securetech-basics", "training", "securetech-sizing", "snatch-speed", "strap-stretch", "kinetic-stretch", "static-stretch", "kinetic-model", "never-exceed", "recovery-point", "shackle-ratings", "shackle-side-load", "soft-shackles", "no-shackle-join", "safety-lanyard", "stand-clear", "strap-wet", "strap-life", "tree-protector", "bridle", "leg-load", "shackle-included-angle", "wll-mbs"]));
  }

  function placeOverlays(pos) {
    place($("f-stuck"), pos.stuckField);
    place($("f-rec"), pos.recField);
    place($("f-strap"), pos.strapField);
  }
  function place(node, p) {
    node.style.left = p.left + "%";
    node.style.top = p.top + "%";
  }

  const t1 = (kg) => U.tonnes(Math.round(kg / 10) / 100);

  // ------------------------------------------------------------ verdict and balance
  function renderVerdict() {
    const { gear, kin, fit, range, limits, weakest, keepUnder, demand, speed } = R;
    let tone;
    let head;
    let detail;
    let fix = null;
    const over = limits.filter((l) => !l.ok);
    const failIssue = R.issues.find((i) => i.tone === "fail");
    const warnIssues = R.issues.filter((i) => i.tone === "warn");
    const partName = { shackle: "shackle", point: "recovery point", bridle: "bridle" };
    if (S.gear === "static") {
      tone = "fail";
      head = "A static pull strap isn't for snatching";
      detail = `It hardly stretches, so the same snatch hits ${Math.round((demand / C.kinetic({ massKg: R.recv, mbsKg: R.mbs, lengthM: R.len, stretch: C.stretchOf("kinetic"), speedKmh: speed }).peakIfUnbrokenKg) * 100 - 100)}% harder than with a kinetic rope of the same strength: ${t1(demand)} at ${speed} km/h. SECURETECH: a pull strap is for a steady pull on a lightly stuck vehicle, the first option; kinetic straps and ropes are the last.`;
      fix = { text: "Use a kinetic rope instead", patch: { gear: "kinetic" } };
    } else if (over.length) {
      tone = "fail";
      const names = over.map((l) => `${l.what} of ${t1(l.kg)}${l.share !== 1 ? ` (each takes ${t1(l.loadKg)})` : ""}`);
      const parts = [...new Set(over.filter((l) => l.type !== "mbs").map((l) => partName[l.type]))];
      head = over.some((l) => l.type === "mbs") ? `It could break at ${speed} km/h` : `Too much for the ${parts.join(" and ")} at ${speed} km/h`;
      detail = `The snatch would reach ${t1(demand)} in the ${gear.short.toLowerCase()} if nothing gave: over ${names.join(" and ")}.`;
      if (keepUnder >= 1) fix = { text: `Keep under ${keepUnder} km/h`, patch: { speedKmh: keepUnder } };
      else fix = { text: "Even 1 km/h is too much with this gear: use a stronger strap, shackle, bridle or recovery point", patch: null };
    } else if (failIssue) {
      tone = "fail";
      head = failIssue.head;
      detail = failIssue.detail;
      fix = failIssue.fix || null;
    } else if (fit === "under") {
      tone = "fail";
      head = `Too light for the ${t1(R.stuck)} stuck vehicle`;
      detail = `SECURETECH rates straps and ropes by the stuck vehicle's mass. Its lowest noted factor of safety, 2:1, needs ${t1(range.minKg)}; it recommends 4:1, ${t1(range.recKg)}.`;
      fix = { text: `Use a ${t1(Math.ceil(range.recKg / 1000) * 1000)} ${gear.short.toLowerCase()}`, patch: { mbsKg: Math.ceil(range.recKg / 1000) * 1000 } };
    } else {
      tone = fit === "low" ? "warn" : "pass";
      head = fit === "low" ? `Holds at ${speed} km/h, but under SECURETECH's recommended 4:1` : `Holds at ${speed} km/h`;
      detail = `The snatch can reach ${t1(demand)}${weakest.share !== 1 ? `, ${t1(weakest.loadKg)} on each of the bridle's legs` : ""}: ${Math.round((weakest.loadKg / weakest.kg) * 100)}% of ${weakest.what}, the weakest part. Above ${keepUnder} km/h it wouldn't.`;
      if (fit === "low") {
        detail += ` SECURETECH recommends 4 × the stuck vehicle's ${t1(R.stuck)}: ${t1(range.recKg)}.`;
        fix = { text: `Use a ${t1(Math.ceil(range.recKg / 1000) * 1000)} ${gear.short.toLowerCase()}`, patch: { mbsKg: Math.ceil(range.recKg / 1000) * 1000 } };
      }
      if (warnIssues.length) {
        tone = "warn";
        detail += " " + warnIssues.map((i) => `${i.head}: ${i.detail}`).join(" ");
      }
    }

    // each part's own load against its own rating; on a bridle a leg's shackle and point take less than the peak
    const max = Math.max(demand, ...limits.map((l) => Math.max(l.kg, l.loadKg))) * 1.04;
    const pc = (kg) => (Math.min(kg, max) / max) * 100;
    const rows = [
      el("div", { class: "bal-row" }, el("span", { class: "bal-name" }, `Peak force at ${speed} km/h`),
        el("div", { class: "bal-bar" }, el("span", { class: "bal-seg seg-2", style: `width:${pc(demand)}%` })),
        el("strong", { class: "bal-val" }, t1(demand))),
    ].concat(limits.map((l) => el("div", { class: "bal-row" }, el("span", { class: "bal-name" }, l.label, l.share !== 1 ? el("small", null, ` takes ${t1(l.loadKg)}, ${Math.round(l.share * 100)}% of the peak`) : null),
      el("div", { class: "bal-bar" }, el("span", { class: "bal-seg bal-limit " + l.cls + (l.ok ? "" : " is-over"), style: `width:${pc(l.kg)}%` }),
        el("span", { class: "bal-tick", style: `left:${pc(l.loadKg)}%`, title: `Load on it ${t1(l.loadKg)}` })),
      el("strong", { class: "bal-val" }, el("span", { class: "bal-ok tone-" + (l.ok ? "pass" : "fail") }, U.statusIcon(l.ok ? "pass" : "fail")), t1(l.kg)))));

    const sub = el("p", { class: "verdict-sub" },
      `The ${t1(R.recv)} recovery vehicle at ${speed} km/h carries ${U.n(kin.energyJ / 1000, 0.1)} kJ; the ${gear.short.toLowerCase()} (${U.n(R.len, 0.1)} m, ${Math.round(R.stretch * 1000) / 10}% stretch at break) soaks it up as stretch and gives it back as pull. Worked out with the stuck vehicle held still, the hardest case: a calculation, not a measurement, so a real snatch peaks lower. SECURETECH suggests 18 km/h for two vehicles of similar mass. The line on each bar is the load on that part at the peak.`,
      el("strong", { class: "verdict-warn" }, " For information only: whatever this says, judge the recovery on the scene."));

    let fixEl = null;
    if (fix && fix.patch) {
      fixEl = el("button", { type: "button", class: "fix" }, fix.text, " →");
      fixEl.addEventListener("click", () => {
        set(fix.patch);
        syncInputs();
      });
    } else if (fix) fixEl = el("p", { class: "fix-note" }, fix.text);
    const v = $("verdict");
    v.className = "verdict verdict--" + tone;
    v.replaceChildren(
      el("div", { class: "verdict-top" }, U.statusIcon(tone), el("div", null, el("p", { class: "verdict-head" }, head), el("p", { class: "verdict-detail" }, detail), fixEl)),
      el("div", { class: "balance" }, rows),
      sub);
  }

  // ------------------------------------------------------------ the snatch, moment by moment
  function renderPlay() {
    const { kin, limits, demand } = R;
    // marks in strap force: where each part reaches its rating (on a bridle, more than its own rating)
    gaugeView.setScale(Math.max(demand, ...limits.map((l) => l.atKg)), limits.map((l) => ({ kg: l.atKg, cls: l.cls })), kin.peakKg);
    $("gauge-legend").replaceChildren(...limits.map((l) => el("li", null, el("span", { class: "gl-key " + l.cls, "aria-hidden": "true" }), `${l.label} ${t1(l.kg)}${l.share !== 1 ? `: reached at ${t1(l.atKg)} in the ${R.gear.short.toLowerCase()}` : ""}`)));
    const pts = kin.points.map((p) => {
      const q = { x: p.t, forceKg: p.forceKg };
      limits.forEach((l) => { q[l.id] = l.atKg; });
      return Object.assign(q, { stretchM: p.stretchM, speedKmh: p.speedKmh, energyJ: p.energyJ });
    });
    const w = $("chart-snatch").clientWidth || 600;
    snatchChart = V.lineChart({
      width: w, height: 210, points: pts, yUnit: "t", yFormat: (v) => U.n(v / 1000, v % 1000 ? 0.1 : 1), xLabel: "Seconds after it goes tight", labelEnds: true,
      series: [{ key: "forceKg", cls: "ch-line--force", label: "Force in strap", short: "Force" }].concat(limits.map((l) => ({ key: l.id, cls: "ch-line--" + l.type, label: l.short, short: l.tiny, flat: true }))),
      tip: (p) => [`${U.n(p.x, 0.01)} s after it goes tight`, `Force ${t1(p.forceKg)}`, `Stretched ${U.n(p.stretchM, 0.01)} m`, `Recovery vehicle ${U.n(Math.max(p.speedKmh, 0), 0.1)} km/h${p.speedKmh < -0.05 ? " backwards" : ""}`],
      aria: "Force in the strap over time, from the moment it goes tight, against the force at which the strap, each end's shackles and any bridle or recovery points reach their ratings",
    });
    $("chart-snatch").replaceChildren(
      el("p", { class: "chart-title" }, el("span", { class: "key key--force" }), "Force in the strap", ...limits.map((l) => [el("span", { class: "key key--" + l.type }), l.short])),
      snatchChart.el);
    $("play-slow").textContent = `The real snatch takes ${U.n(kin.tEnd, 0.01)} s; played ${Math.round((DUR * (1 - LEAD)) / 1000 / kin.tEnd)}× slower.`;

    live = {};
    const tile = (key, label) => {
      live[key] = { value: el("strong", { class: "readout-value" }), sub: el("span", { class: "readout-sub" }) };
      return el("div", { class: "readout readout--live" }, el("span", { class: "readout-label" }, label), live[key].value, live[key].sub);
    };
    $("readouts").replaceChildren(
      tile("force", "Force now"),
      tile("stretch", "Stretch now"),
      tile("speed", "Recovery vehicle"),
      tile("energy", "Energy in the strap"),
      el("p", { class: "readout-note" }, kin.breaks
        ? `The ${R.gear.short.toLowerCase()} reaches its breaking strength ${U.n(kin.tPeak, 0.01)} s after it goes tight, with the recovery vehicle still moving: it would snap and let go of ${U.n(kin.breakEnergyJ / 1000, 0.1)} kJ at once. That's what the safety lanyards at both ends are for.`
        : `If the stuck vehicle doesn't budge, the stretch peaks ${U.n(kin.tPeak, 0.01)} s after it goes tight, with the recovery vehicle stopped, then pulls it back. In a real snatch the stuck vehicle starts to move and the peak is lower.`));
    if (!play.raf) frame(play.t === null ? peakPhase() : play.t);
  }

  // playback phase (0..1) at the peak: the default still picture
  function peakPhase() {
    const k = R.kin;
    return LEAD + (1 - LEAD) * (k.tPeak / k.tEnd);
  }

  // show the snatch at playback phase f (0..1): slack first, then the stretch
  function frame(f) {
    if (!R || R.missing) return;
    const { kin, gear } = R;
    const pxPerM = sceneView.strapPx / R.len;
    let p;
    let dx;
    let broken = null;
    if (f < LEAD) {
      // driving the slack out: illustration only, the force is zero
      const g = f / LEAD;
      dx = -26 * (1 - g);
      p = { t: 0, forceKg: 0, stretchM: 0, speedKmh: R.speed, energyJ: 0 };
    } else {
      const t = ((f - LEAD) / (1 - LEAD)) * kin.tEnd;
      p = kin.at(Math.min(t, kin.tEnd));
      dx = p.stretchM * pxPerM;
      if (kin.breaks && f >= 1 - 1e-6) broken = 1;
    }
    if (kin.breaks && play.snapF !== undefined && play.snapF !== null) broken = play.snapF;
    const pos = sceneView.update({
      gear: S.gear,
      dx: broken !== null ? kin.peakStretchM * pxPerM : dx,
      broken,
      speedText: f < LEAD ? `${R.speed} km/h →` : `${U.n(Math.max(p.speedKmh, 0), 1)} km/h`,
      gearText: `${gear.label} · ${Math.round(R.stretch * 1000) / 10}% stretch at break`,
      status: broken !== null ? "broken" : null,
    });
    placeOverlays(pos);
    gaugeView.set(p.forceKg);
    $("force-now").textContent = t1(p.forceKg);
    $("force-sub").textContent = `peak ${t1(kin.peakKg)}${kin.breaks ? ": it breaks" : ""}`;
    const setLive = (k, v, sub) => {
      if (!live[k]) return;
      live[k].value.textContent = v;
      live[k].sub.textContent = sub;
    };
    const maxStretch = R.len * R.stretch;
    setLive("force", t1(p.forceKg), `peak ${t1(kin.peakKg)} · ${U.n(C.kgToKn(p.forceKg), 1)} kN`);
    setLive("stretch", `${U.n(p.stretchM, 0.01)} m`, `of ${U.n(maxStretch, 0.01)} m it can stretch before breaking`);
    setLive("speed", `${U.n(Math.max(p.speedKmh, 0), 0.1)} km/h`, p.speedKmh < -0.05 ? "being pulled back" : f < LEAD ? "taking up the slack" : "slowing as it stretches");
    setLive("energy", `${U.n(p.energyJ / 1000, 0.1)} kJ`, `of the ${U.n(kin.energyJ / 1000, 0.1)} kJ it was moving with`);
    if (snatchChart) snatchChart.setPlayhead(p.t);
  }

  function startPlay() {
    if (!R || R.missing) return;
    if (play.raf) cancelAnimationFrame(play.raf);
    play.snapF = null;
    const from = play.t === null || play.t >= 1 - 1e-6 ? 0 : play.t;
    const t0 = performance.now() - from * DUR;
    $("play").textContent = "❚❚ Pause";
    $("play-part").classList.add("is-playing");
    const step = (now) => {
      const f = Math.min(1, (now - t0) / DUR);
      play.t = f;
      frame(f);
      if (f < 1) play.raf = requestAnimationFrame(step);
      else if (R.kin.breaks) snapAnim(now);
      else stopPlay();
    };
    play.raf = requestAnimationFrame(step);
  }
  // the strap lets go: both halves fly back, held by the safety lanyards
  function snapAnim(start) {
    const step = (now) => {
      play.snapF = Math.min(1, (now - start) / 700);
      frame(1);
      if (play.snapF < 1) play.raf = requestAnimationFrame(step);
      else stopPlay();
    };
    play.raf = requestAnimationFrame(step);
  }
  function stopPlay() {
    if (play.raf) cancelAnimationFrame(play.raf);
    play.raf = 0;
    $("play").textContent = play.t !== null && play.t < 1 - 1e-6 ? "▶ Carry on" : "▶ Play the snatch";
    $("play-part").classList.remove("is-playing");
  }

  // ------------------------------------------------------------ strap or rope for these vehicles
  function renderSizes() {
    const { stuck, mbs, recv, len, speed, limits } = R;
    const r = C.sizeRange("strap", stuck);
    const max = Math.max(r.recKg * 1.3, mbs * 1.08);
    const pc = (kg) => (Math.min(kg, max) / max) * 100;
    // one bar: under 2:1, 2:1 to the recommended 4:1, 4:1 and up; the white line is yours
    const sizeBar = el("div", { class: "rg-row" },
      el("span", { class: "rg-name" }, "Strap or kinetic rope", el("small", null, `SECURETECH, by the stuck vehicle's ${t1(stuck)}`)),
      el("div", { class: "rg-track" },
        el("span", { class: "rg-band rg-band--under", style: `left:0;width:${pc(r.minKg)}%`, title: `Under 2:1: under ${t1(r.minKg)}` }),
        el("span", { class: "rg-band rg-band--low", style: `left:${pc(r.minKg)}%;width:${pc(r.recKg) - pc(r.minKg)}%`, title: `2:1 to 4:1: ${t1(r.minKg)} to ${t1(r.recKg)}` }),
        el("span", { class: "rg-band rg-band--rec", style: `left:${pc(r.recKg)}%;width:${100 - pc(r.recKg)}%`, title: `4:1 and up: ${t1(r.recKg)} or more` }),
        el("span", { class: "rg-you", style: `left:${pc(mbs)}%`, title: `Yours: ${t1(mbs)}` })),
      el("strong", { class: "rg-val" }, `${t1(r.recKg)} recommended`));
    const sizeKey = el("ul", { class: "bal-legend rg-legend" },
      el("li", null, el("span", { class: "swatch rg-sw--under", "aria-hidden": "true" }), `under 2:1 (${t1(r.minKg)})`),
      el("li", null, el("span", { class: "swatch rg-sw--low", "aria-hidden": "true" }), `2:1 to 4:1`),
      el("li", null, el("span", { class: "swatch rg-sw--rec", "aria-hidden": "true" }), `4:1 and up, SECURETECH's recommendation (${t1(r.recKg)})`),
      el("li", null, el("span", { class: "rg-key-you", "aria-hidden": "true" }), `yours, ${t1(mbs)}`));

    // peak force by speed, the same strength and length, three kinds
    const kinds = D.gearTypes.map((g) => ({ g, k: C.kinetic({ massKg: recv, mbsKg: mbs, lengthM: len, stretch: C.stretchOf(g.id), speedKmh: 1 }) }));
    const pts = [];
    for (let v = 0; v <= D.speedMaxKmh; v += 0.5) {
      const p = { x: v, mbs };
      kinds.forEach((x) => { p[x.g.id] = (x.k.peakIfUnbrokenKg) * v; });
      pts.push(p);
    }
    const w = $("sizes").clientWidth || 600;
    speedChart = V.lineChart({
      width: w, height: 230, points: pts, yUnit: "t", yFormat: (v) => U.n(v / 1000, v % 1000 ? 0.1 : 1), xLabel: "Speed when it goes tight (km/h)", labelEnds: true,
      series: kinds.map((x) => ({ key: x.g.id, cls: "ch-line--" + x.g.id, label: x.g.short, short: x.g.short.replace("Kinetic rope", "Kinetic") })).concat([{ key: "mbs", cls: "ch-line--mbs", label: `Breaks (${t1(mbs)})`, short: "Breaks", flat: true }]),
      tip: (p) => [`${U.n(p.x, 0.5)} km/h`].concat(kinds.map((x) => `${x.g.short}: ${t1(p[x.g.id])}${p[x.g.id] >= mbs ? " (breaks)" : ""}`)),
      aria: "Peak force against speed for a snatch strap, a kinetic rope and a static pull strap of the same strength and length",
    });
    speedChart.setPlayhead(speed);
    const rows = kinds.map((x) => el("tr", { class: x.g.id === S.gear ? "is-mine" : null },
      el("th", { scope: "row" }, el("span", { class: "key key--" + x.g.id }), x.g.short),
      el("td", { class: "num" }, `${Math.round(x.k ? C.stretchOf(x.g.id) * 1000 : 0) / 10}%`),
      el("td", { class: "num" }, t1(x.k.peakIfUnbrokenKg * speed)),
      el("td", { class: "num" }, `${Math.floor(x.k.speedFor(Math.min(...limits.map((l) => l.atKg))))} km/h`)));

    $("sizes").replaceChildren(
      el("p", { class: "hint part-intro" }, "SECURETECH: buy straps and ropes relative to the vehicle's weight, rated by the mass of the stuck vehicle. Its noted factors of safety are 2:1, 3:1 and 4:1, and it recommends 4:1."),
      el("div", { class: "ranges" }, sizeBar, sizeKey),
      el("p", { class: "layers-title" }, `Same ${t1(mbs)} strength and ${U.n(len, 0.1)} m length: the peak force by speed`),
      el("p", { class: "chart-title" }, ...kinds.map((x) => [el("span", { class: "key key--" + x.g.id }), x.g.short]), el("span", { class: "key key--mbs" }), "Breaks"),
      speedChart.el,
      el("div", { class: "table-wrap" }, el("table", { class: "limit-table speed-table" },
        el("thead", null, el("tr", null, el("th", { scope: "col" }, "Kind"), el("th", { scope: "col", class: "num" }, "Stretch"), el("th", { scope: "col", class: "num" }, `Peak, ${speed} km/h`), el("th", { scope: "col", class: "num" }, "Keep under"))),
        el("tbody", null, rows))),
      el("p", { class: "hint" }, `Stretch is what makes a kinetic recovery gentle: the more a strap or rope stretches, the longer it takes to stop the recovery vehicle, and the lower the peak. A static pull strap (low-elongation polyester, about 5%) peaks ${U.n(Math.sqrt(C.stretchOf("strap") / C.stretchOf("static")), 0.1)} times as hard as a snatch strap of the same strength. "Keep under" is the speed at which the peak reaches the weakest part: ${["the strap", "either end's shackles"].concat(R.ends.some((e) => e.bridled) ? ["the bridle"] : [], R.pointKg ? ["the recovery points"] : []).join(", ").replace(/, ([^,]*)$/, " or $1")}. Stretch figures: SECURETECH's 20–25% for straps and 30–40% for ropes, taken at the low end (the higher force), and the 5% SECURETECH gives for its low-elongation polyester webbing for the pull strap (it publishes no pull strap figure); yours may differ. SECURETECH: kinetic straps and ropes must never anchor a winch or extend a winch cable.`),
      U.sourcesLine(["securetech-sizing", "strap-stretch", "kinetic-stretch", "snatch-speed", "static-stretch", "kinetic-model"]));
  }

  // ------------------------------------------------------------ shackles
  function renderShackles() {
    const { all, demand, ends } = R;
    const sd = numOr(S.sideDeg, 0);
    const keep = C.sideLoadKeep(sd);
    const end = ends.find((e) => e.side === endTab());
    const load = demand * end.share; // on each shackle at this end
    $("shackles").replaceChildren(...all.map((s) => {
      const ok = s.wllKg > load;
      const usedAt = ends.filter((e) => e.shackle.id === s.id).map((e) => (e.side === "stuck" ? "Stuck end" : "Recovery end"));
      if (usedAt.length === 2) usedAt.splice(0, 2, "Both ends");
      const b = el("button", { type: "button", role: "radio", class: "sk" + (ok ? " sk--pass" : " sk--fail"), "aria-checked": String(s.id === end.shackle.id) },
        usedAt.length ? el("span", { class: "sk-used" }, usedAt.join(" · ")) : null,
        el("span", { class: "sk-kind" }, s.kind === "soft" ? "Soft · Factor 55" : "SECURETECH bow"),
        el("strong", { class: "sk-name" }, s.size),
        el("span", { class: "sk-wll" }, U.statusIcon(ok ? "pass" : "fail"), `WLL ${t1(s.wllKg)}`),
        el("small", { class: "sk-sub" }, s.kind === "steel"
          ? (keep < 1 ? `${Math.round(keep * 100)}% of ${t1(s.ratedWllKg)} at ${sd}°` : `breaks at ${t1(s.breakKg)} or more (6:1)`)
          : (s.sideUnknown ? "no side-load figure" : `breaks at ${t1(s.breakKg)}`)));
      b.addEventListener("click", () => set({ [ENDS[end.side].shackle]: s.id }));
      return el("li", null, b);
    }));
    const loadText = end.bridled
      ? `the ${t1(load)} each takes at ${R.speed} km/h: on the bridle, legs ${R.bridleDeg}° apart, each leg's shackle takes ${Math.round(end.share * 100)}% of the ${t1(demand)} peak (the wider the legs, the more each takes)`
      : `the ${t1(demand)} peak force at ${R.speed} km/h`;
    $("shackle-hint").textContent = `Pick an end, then its shackle. Green: the WLL is above ${loadText}. That allows for the full load (SECURETECH; Bushranger: never exceed the shackles' WLL). Both ends go into the check below.${sd > 10 ? ` Pulled ${sd}° off in-line (this applies to every shackle), Crosby's chart leaves a screw pin shackle ${Math.round(keep * 100)}% of its WLL; we found no such figure for soft shackles.` : ""}`;
    $("shackle-notes").replaceChildren(
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Rated bow shackles only: "), "SECURETECH: never commercial or D shackles (a commercial one has a pin as thin as its body and no markings); at least 2 t WLL, and 2 to 6.5 t covers most recoveries. Tighten the pin, then back it off half a turn."),
        el("li", null, el("strong", null, "Side pulls: "), "a rated bow shackle can take one, but at 90° its rating halves (SECURETECH). Several eyes go on the bow, not the pin; shackle to shackle is bow to bow or bow to pin, never pin to pin."),
        el("li", null, el("strong", null, "Two legs in one bow, at most 120° apart "), "(Crosby): a bridle or a tree protector's two ends. More on that below."),
        el("li", null, el("strong", null, "Never join two straps with a shackle. "), "SECURETECH: use a recovery link between the eyes, and only join straps of the same rating and function. If one breaks, a shackle becomes a missile."),
        el("li", null, el("strong", null, "Big enough: "), "SECURETECH says the shackle must not pinch a lanyard or bridle, and its pin must fit through your recovery points.")),
      U.sourcesLine(["never-exceed", "shackle-ratings", "shackle-side-load", "soft-shackles", "shackle-included-angle", "no-shackle-join", "wll-mbs"]));
  }

  // ------------------------------------------------------------ the three safety straps
  function renderLanyard() {
    const { kin, len } = R;
    const stretched = kin.peakStretchM;
    const keepM = C.standOff(len, stretched);
    $("lanyard-pic").replaceChildren(V.standOff({ width: Math.min(420, $("lanyard-pic").clientWidth || 360), lengthM: len + stretched, keepM }));
    $("lanyard-body").replaceChildren(
      el("div", { class: "job-figs" },
        U.figure("Stand at least", `${U.n(keepM, 0.1)} m away`, `2 × the ${U.n(len + stretched, 0.1)} m stretched ${R.gear.short.toLowerCase()} (SECURETECH)`),
        U.figure(kin.breaks ? "Let go if it snaps" : "Stored at the peak", `${U.n((kin.breaks ? kin.breakEnergyJ : kin.energyJ) / 1000, 0.1)} kJ`, kin.breaks ? "all at once, at the breaking strength" : `the recovery vehicle's energy at ${R.speed} km/h`)),
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Its job: "), "to tie the strap or rope back to the vehicle, so a broken shackle, recovery point or strap is held instead of thrown (SECURETECH)."),
        el("li", null, el("strong", null, "Both ends: "), "one at each end of the recovery, so neither half can fly back."),
        el("li", null, el("strong", null, "Fitted correctly: "), "SECURETECH ties its lanyard (low-stretch polyester webbing, 1.4 or 1.8 m long) to the vehicle and over the strap, rope or cable with two loose ring hitch knots, never on the same point as the strap or bridle."),
        el("li", null, el("strong", null, "With a bridle: "), "SECURETECH says to use two lanyards as well."),
        el("li", null, el("strong", null, "Everyone out: "), "get out of both vehicles and stand well away, never in line with the strap or in the recovery vehicle's path.")),
      el("p", { class: "hint" }, "A lanyard holds the parts; it doesn't make standing close safe. SECURETECH publishes no breaking strength for its lanyard online, and nobody we found publishes how far a broken strap or shackle flies."),
      U.sourcesLine(["safety-lanyard", "stand-clear"]));
  }

  function renderTree() {
    const deg = numOr(S.treeDeg, 30);
    const maxDeg = D.rule("shackle-included-angle").params.maxDeg;
    const over = deg > maxDeg;
    $("tree-pic").replaceChildren(V.vee({ kind: "tree", deg, over }));
    $("tree-out").textContent = `${deg}° between the ends`;
    const pull = numOr(S.treePullKg, 0);
    const p = D.treeProtectors.find((x) => x.id === S.protector) || D.treeProtectors[D.treeProtectors.length - 1];
    if (!(pull > 0)) {
      $("tree-body").replaceChildren(el("p", { class: "muted" }, "Type the pull on the anchor: your winch's rated pull is the most it can put there on a single line."));
      return;
    }
    const legKg = C.legLoad(pull, deg);
    const breakKg = C.lbToKg(p.breakLb);
    const times = breakKg / legKg;
    $("tree-body").replaceChildren(...[
      el("div", { class: "job-figs" },
        U.figure("Each end carries", t1(legKg), `${Math.round((legKg / pull) * 100)}% of the ${t1(pull)} pull`),
        U.figure(`Epic ${p.label} breaks at`, t1(breakKg), `${U.n(times, 0.1)} × the load on each end`)),
      over ? el("p", { class: "warn-line tone-fail" }, U.statusIcon("fail"), `Over ${maxDeg}°: Crosby says never. Use a longer protector, or wrap it so the ends meet at a narrower angle.`) : null,
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Its job: "), "to protect the bark and give the winch a secure anchor, so the rope never wraps the trunk. Never loop the winch rope back onto itself (SECURETECH, WARN)."),
        el("li", null, el("strong", null, "Size: "), "SECURETECH's handbook says more than 75 mm wide and 2 to 5 m long."),
        el("li", null, el("strong", null, "Low on the trunk: "), "as low down on the base of the tree as possible, and no jerks: they damage the bark (SECURETECH)."),
        el("li", null, el("strong", null, "Strength: "), "SECURETECH's isn't published online, so the figures above are WARN's Epic protectors (breaking strength only, no WLL). With a double or triple line the anchor takes more than the winch's rating: see the ", U.externalLink("https://winching.psyphin.co.za/", "winching page"), ".")),
      U.sourcesLine(["tree-protector", "leg-load", "shackle-included-angle"])].filter(Boolean));
  }

  function renderBridle() {
    const deg = numOr(S.bridleDeg, 60);
    const maxDeg = D.rule("shackle-included-angle").params.maxDeg;
    const over = deg > maxDeg;
    $("bridle-pic").replaceChildren(V.vee({ kind: "bridle", deg, over }));
    $("bridle-out").textContent = `${deg}° between the legs`;
    const b = D.bridles.find((x) => x.id === S.bridle) || D.bridles[0];
    const pull = R.demand;
    const legKg = C.legLoad(pull, deg);
    const heavier = Math.max(R.stuck, R.recv);
    const massOk = heavier <= b.maxVehicleKg;
    const times = b.breakKg / legKg;
    $("bridle-body").replaceChildren(...[
      el("div", { class: "job-figs" },
        U.figure("Each point takes", t1(legKg), `${Math.round((legKg / pull) * 100)}% of the ${t1(pull)} snatch above${R.pointKg ? `; points rated ${t1(R.pointKg)}` : ""}`),
        U.figure(`SECURETECH ${b.label}`, `breaks at ${t1(b.breakKg)}`, `${U.n(times, 0.1)} × each leg's load · for vehicles up to ${U.n(b.maxVehicleKg, 1)} kg`, massOk ? "figure--pass" : "figure--fail")),
      massOk ? null : el("p", { class: "warn-line tone-fail" }, U.statusIcon("fail"), `SECURETECH rates this bridle for vehicles up to ${U.n(b.maxVehicleKg, 1)} kg; the heavier vehicle here is ${U.kg(heavier)}.`),
      over ? el("p", { class: "warn-line tone-fail" }, U.statusIcon("fail"), `Over ${maxDeg}°: Crosby says never put two legs that far apart in one shackle. Use a longer bridle.`) : null,
      el("p", { class: "hint" }, R.ends.some((e) => e.bridled)
        ? `In the check above at the ${R.ends.filter((e) => e.bridled).map((e) => e.name.toLowerCase()).join(" and the ")}: the same bridle and angle.`
        : "Not in the check above: choose \"Bridle across two points\" for either end under Each end: shackles and bridles."),
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Its job: "), "to balance the pull across two recovery points and ease the stress on each (SECURETECH)."),
        el("li", null, el("strong", null, "Fitted right: "), "at least 3.5 m long, on rated bow shackles, with two lanyards as well (SECURETECH)."),
        el("li", null, el("strong", null, "Straighten the pull: "), "SECURETECH: recover in as straight a line as possible, use a bridle to straighten the pull, and never pull more than 60° off the vehicle's centre line."),
        el("li", null, el("strong", null, "Keep it narrow: "), "side by side, each point takes half. The wider the legs, the more each one takes: at 120° each takes the whole pull.")),
      U.sourcesLine(["bridle", "safety-lanyard", "leg-load", "shackle-included-angle"])].filter(Boolean));
  }

  // ------------------------------------------------------------ explainers
  function renderExplainers() {
    const fill = (id, ...children) => document.querySelector(`#${id} .explainer-body`).replaceChildren(...children);
    fill("explain-model",
      el("p", null, D.rule("kinetic-model").summary),
      el("p", null, "So speed is the one thing you control that changes the force most: the force goes up as fast as the speed does, and the energy goes up with the speed squared. A longer strap or one that stretches more spreads the stop over more distance and lowers the peak."),
      U.sourcesLine(["kinetic-model", "strap-stretch", "kinetic-stretch"]));
    fill("explain-mbs",
      el("p", null, D.rule("wll-mbs").summary),
      el("p", null, "A strap is picked by vehicle mass (its MBS against the GVM); a shackle by its WLL against the force it will see. A 4.75 t bow shackle's WLL next to a 12 t strap's MBS makes the shackle look like the weak link, but SECURETECH's rated bow shackles have a 6:1 factor of safety: a 4.75 t one breaks at 28.5 t or more."),
      U.sourcesLine(["wll-mbs", "shackle-ratings", "securetech-sizing"]));
    fill("explain-gaps",
      el("p", null, "Where no standard or maker publishes a figure, this page says so rather than filling the gap with a rule of thumb."),
      el("ul", null, D.gaps.map((x) => el("li", null, el("strong", null, x.title + ": "), x.text))));

    // Common questions: the questions are in index.html; every figure here comes from data.js.
    const size = D.rule("securetech-sizing").params;
    const exGvm = 2900;
    fill("faq-size",
      el("p", null, `Rate it by the stuck vehicle's mass (its GVM, on the licence disc). SECURETECH recommends a breaking strength of at least ${size.recommended} times that mass (${size.recommended}:1); the lowest factor it notes is ${size.min}:1. For a ${U.kg(exGvm)} double cab, that's ${U.tonnes(exGvm * size.recommended / 1000)} recommended.`),
      el("p", null, "Read the stitched-in label: a good strap or rope gives its maker, specification and strength. The calculator above checks your strap against both vehicles and the snatch."),
      U.sourcesLine(["securetech-sizing"]));
    const pct = (id) => U.n(D.rule(id).params.stretch * 100) + "%";
    fill("faq-types",
      el("p", null, `How far they stretch. At the low end of SECURETECH's figures, a snatch strap (polyamide webbing) stretches about ${pct("strap-stretch")} of its length and a kinetic rope (plaited polyamide) about ${pct("kinetic-stretch")}. More stretch spreads the stop over a longer distance, so a kinetic rope is gentler on both vehicles and their recovery points.`),
      el("p", null, `A pull strap stretches only about ${pct("static-stretch")}: it's for a steady pull on a lightly stuck vehicle, not for snatching.`),
      U.sourcesLine(["strap-stretch", "kinetic-stretch", "static-stretch"]));
    fill("faq-speed",
      el("p", null, `SECURETECH suggests about ${U.n(D.rule("snatch-speed").params.suggestedKmh)} km/h for two vehicles of similar mass. Lay the strap out in an S with a little slack, move off in first gear low range, straight away from the stuck vehicle, and try to stop before the strap stops you. If it's still stuck, winch it.`),
      el("p", null, "Speed is what you control that changes the force most: at twice the speed, the peak force is twice as high."),
      U.sourcesLine(["snatch-speed", "kinetic-model"]));
    fill("faq-towball",
      el("p", null, "No. SECURETECH: a tow bar or tow ball is unsuitable as a recovery point, because tow balls are designed to break under extreme loads, and a broken one becomes a missile. Every vehicle in a recovery needs professionally fitted, rated recovery points front and rear, ideally two at each end so a bridle can be used."),
      U.sourcesLine(["recovery-point"]));
    const side90 = D.sideLoad[D.sideLoad.length - 1];
    fill("faq-shackles",
      el("p", null, `Rated alloy bow shackles with a WLL of at least ${U.kg(D.rule("shackle-ratings").params.minWllKg)}, never commercial or D shackles. A rated shackle is marked with its WLL and has a thicker pin than its body.`),
      el("p", null, `Pulled from the side at ${side90.toDeg}°, a shackle keeps only ${U.n(side90.keep * 100)}% of its rating. And never join two straps with a shackle: if something fails it becomes a missile. Use a recovery link instead.`),
      U.sourcesLine(["shackle-ratings", "shackle-side-load", "no-shackle-join"]));
  }

  // ------------------------------------------------------------ go
  build();
  update();
  // play the snatch once when it first comes into view
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        play.t = 0;
        startPlay();
      }
    }, { threshold: 0.35 });
    io.observe($("play-part"));
  }
})();
