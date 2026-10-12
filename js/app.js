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

  let S = Object.assign({}, D.defaults, load());
  if (!C.gear(S.gear)) S.gear = D.defaults.gear;
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
    const lighter = Math.min(stuck, recv);
    const kin = C.kinetic({ massKg: recv, mbsKg: mbs, lengthM: len, stretch, speedKmh: speed });
    const range = C.sizeRange(S.gear, lighter);
    const fit = C.rangeVerdict(mbs, range);
    const all = C.shackles(numOr(S.sideDeg, 0));
    const shackle = all.find((s) => s.id === S.shackle) || all.find((s) => s.id === D.defaults.shackle);
    const pointKg = numOr(S.pointKg, 0) > 0 ? S.pointKg : null;
    const demand = kin.peakIfUnbrokenKg;
    // what the peak must stay under (Bushranger: strap MBS, recovery point, shackle WLL)
    const limits = [
      { id: "mbs", label: `${gear.short} breaks at`, short: "Breaks", tiny: "Breaks", kg: mbs, cls: "lim-mbs" },
      { id: "shackle", label: `${shackle.size} ${shackle.kind === "soft" ? "soft shackle" : "shackle"} WLL`, short: "Shackle WLL", tiny: "WLL", kg: shackle.wllKg, cls: "lim-shackle" },
    ];
    if (pointKg) limits.push({ id: "point", label: "Recovery points", short: "Points", tiny: "Points", kg: pointKg, cls: "lim-point" });
    limits.forEach((l) => { l.speed = kin.speedFor(l.kg); l.ok = demand < l.kg; });
    const weakest = limits.reduce((a, b) => (b.kg < a.kg ? b : a));
    const keepUnder = Math.floor(weakest.speed);
    return { stuck, recv, mbs, len, gear, stretch, speed, lighter, kin, range, fit, all, shackle, pointKg, demand, limits, weakest, keepUnder };
  }

  // ------------------------------------------------------------ build once
  function build() {
    D.scenarios.forEach((sc) => {
      const b = el("button", { type: "button", class: "try-chip" }, sc.label);
      b.addEventListener("click", () => {
        stopPlay();
        set(Object.assign({ sideDeg: 0, pointKg: null }, sc.values));
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
      const b = el("button", { type: "button", role: "radio", class: "chip", "data-bridle": p.id, "aria-checked": "false" }, `Factor 55 ${p.label}`);
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
  }

  // ------------------------------------------------------------ update
  function update() {
    R = compute();
    document.querySelectorAll("#gear-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.gear === S.gear)));
    document.querySelectorAll("#protector-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.protector === S.protector)));
    document.querySelectorAll("#bridle-chips .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.bridle === S.bridle)));
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
      ["readouts", "sizes", "shackles", "shackle-notes", "stage-sources", "chart-snatch", "gauge-legend", "damper-body", "tree-body", "bridle-body", "damper-pic"].forEach((id) => $(id).replaceChildren());
      renderTree();
      return;
    }
    renderVerdict();
    renderPlay();
    renderSizes();
    renderShackles();
    renderDamper();
    renderTree();
    renderBridle();
    $("stage-sources").replaceChildren(U.sourcesLine(["training", "strap-mbs", "kinetic-size", "strap-stretch", "kinetic-stretch", "static-stretch", "kinetic-model", "never-exceed", "recovery-point", "shackle-ratings", "shackle-side-load", "soft-shackles", "no-shackle-join", "damper", "stand-clear", "strap-wet", "strap-life", "tree-protector", "bridle", "leg-load", "shackle-included-angle", "wll-mbs"]));
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
    const { gear, kin, fit, range, limits, weakest, keepUnder, demand, speed, lighter } = R;
    let tone;
    let head;
    let detail;
    let fix = null;
    const over = limits.filter((l) => !l.ok);
    if (S.gear === "static") {
      tone = "fail";
      head = "A winch rope isn't for snatching";
      detail = `It hardly stretches, so the same snatch hits ${Math.round((demand / C.kinetic({ massKg: R.recv, mbsKg: R.mbs, lengthM: R.len, stretch: C.stretchOf("kinetic"), speedKmh: speed }).peakIfUnbrokenKg) * 100 - 100)}% harder than with a kinetic rope of the same strength: ${t1(demand)} at ${speed} km/h. Samson: working loads don't apply once a rope has been shock loaded.`;
      fix = { text: "Use a kinetic rope instead", patch: { gear: "kinetic" } };
    } else if (over.length) {
      tone = "fail";
      const names = over.map((l) => (l.id === "mbs" ? `the ${gear.short.toLowerCase()}'s ${t1(l.kg)} breaking strength` : l.id === "shackle" ? `the shackle's ${t1(l.kg)} WLL` : `the recovery points' ${t1(l.kg)}`));
      head = over.some((l) => l.id === "mbs") ? `It could break at ${speed} km/h` : `Too much for the ${over[0].id === "shackle" ? "shackle" : "recovery points"} at ${speed} km/h`;
      detail = `The snatch would reach ${t1(demand)} if nothing gave: over ${names.join(" and ")}.`;
      if (keepUnder >= 1) fix = { text: `Keep under ${keepUnder} km/h`, patch: { speedKmh: keepUnder } };
      else fix = { text: "Even 1 km/h is too much with this gear: use a stronger strap, shackle or recovery point", patch: null };
    } else if (fit === "under") {
      tone = "fail";
      head = `Too light for a ${t1(lighter)} vehicle`;
      detail = `${S.gear === "strap" ? "The strap standard" : "Factor 55"} asks for ${range.min} to ${range.max} × the lighter vehicle: ${t1(range.minKg)} to ${t1(range.maxKg)} breaking strength.${range.heavy && R.mbs >= range.heavy.minKg ? ` Factor 55 says ${range.heavy.min} to ${range.heavy.max} × may be acceptable for heavy vehicles (Unimog, EarthRoamer).` : ""}`;
    } else {
      tone = fit === "over" ? "warn" : "pass";
      head = fit === "over" ? `Holds at ${speed} km/h, but it's a heavy ${gear.short.toLowerCase()} for these vehicles` : `Holds at ${speed} km/h`;
      detail = `The snatch can reach ${t1(demand)}: ${Math.round((demand / weakest.kg) * 100)}% of the ${weakest.id === "mbs" ? `${gear.short.toLowerCase()}'s breaking strength` : weakest.id === "shackle" ? "shackle's WLL" : "recovery points' rating"}, the weakest part. Above ${keepUnder} km/h it wouldn't.`;
      if (fit === "over") detail += ` Over ${range.max} × the lighter vehicle: ${S.gear === "kinetic" ? "Factor 55 says a rope that's too big won't stretch enough." : "the strap standard says 2 to 3 ×."}`;
    }

    const max = Math.max(demand, ...limits.map((l) => l.kg)) * 1.04;
    const pc = (kg) => (Math.min(kg, max) / max) * 100;
    const rows = [
      el("div", { class: "bal-row" }, el("span", { class: "bal-name" }, `Peak force at ${speed} km/h`),
        el("div", { class: "bal-bar" }, el("span", { class: "bal-seg seg-2", style: `width:${pc(demand)}%` })),
        el("strong", { class: "bal-val" }, t1(demand))),
    ].concat(limits.map((l) => el("div", { class: "bal-row" }, el("span", { class: "bal-name" }, l.label),
      el("div", { class: "bal-bar" }, el("span", { class: "bal-seg bal-limit " + l.cls + (l.ok ? "" : " is-over"), style: `width:${pc(l.kg)}%` }),
        el("span", { class: "bal-tick", style: `left:${pc(demand)}%`, title: `Peak force ${t1(demand)}` })),
      el("strong", { class: "bal-val" }, el("span", { class: "bal-ok tone-" + (l.ok ? "pass" : "fail") }, U.statusIcon(l.ok ? "pass" : "fail")), t1(l.kg)))));

    const sub = el("p", { class: "verdict-sub" },
      `The ${t1(R.recv)} recovery vehicle at ${speed} km/h carries ${U.n(kin.energyJ / 1000, 0.1)} kJ; the ${gear.short.toLowerCase()} (${U.n(R.len, 0.1)} m, ${Math.round(R.stretch * 1000) / 10}% stretch at break) soaks it up as stretch and gives it back as pull. Worked out with the stuck vehicle held still, the hardest case: a calculation, not a measurement. The line on each bar is the peak force.`,
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
    gaugeView.setScale(Math.max(demand, ...limits.map((l) => l.kg)), limits, kin.peakKg);
    $("gauge-legend").replaceChildren(...limits.map((l) => el("li", null, el("span", { class: "gl-key " + l.cls, "aria-hidden": "true" }), `${l.label} ${t1(l.kg)}`)));
    const pts = kin.points.map((p) => {
      const q = { x: p.t, forceKg: p.forceKg };
      limits.forEach((l) => { q[l.id] = l.kg; });
      return Object.assign(q, { stretchM: p.stretchM, speedKmh: p.speedKmh, energyJ: p.energyJ });
    });
    const w = $("chart-snatch").clientWidth || 600;
    snatchChart = V.lineChart({
      width: w, height: 210, points: pts, yUnit: "t", yFormat: (v) => U.n(v / 1000, v % 1000 ? 0.1 : 1), xLabel: "Seconds after it goes tight", labelEnds: true,
      series: [{ key: "forceKg", cls: "ch-line--force", label: "Force in strap", short: "Force" }].concat(limits.map((l) => ({ key: l.id, cls: "ch-line--" + l.id, label: l.short, short: l.tiny, flat: true }))),
      tip: (p) => [`${U.n(p.x, 0.01)} s after it goes tight`, `Force ${t1(p.forceKg)}`, `Stretched ${U.n(p.stretchM, 0.01)} m`, `Recovery vehicle ${U.n(Math.max(p.speedKmh, 0), 0.1)} km/h${p.speedKmh < -0.05 ? " backwards" : ""}`],
      aria: "Force in the strap over time, from the moment it goes tight, against the strap's breaking strength and the shackle's WLL",
    });
    $("chart-snatch").replaceChildren(
      el("p", { class: "chart-title" }, el("span", { class: "key key--force" }), "Force in the strap", ...limits.map((l) => [el("span", { class: "key key--" + l.id }), l.short])),
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
        ? `The ${R.gear.short.toLowerCase()} reaches its breaking strength ${U.n(kin.tPeak, 0.01)} s after it goes tight, with the recovery vehicle still moving: it would snap and let go of ${U.n(kin.breakEnergyJ / 1000, 0.1)} kJ at once. That's what the damper is for.`
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
  // the strap lets go: both halves fly back, the damper drops
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
    const { lighter, mbs, recv, len, speed, limits } = R;
    const strapR = C.sizeRange("strap", lighter);
    const ropeR = C.sizeRange("kinetic", lighter);
    const max = Math.max(ropeR.maxKg, mbs) * 1.06;
    const pc = (kg) => (kg / max) * 100;
    const bar = (label, r, cls, sub, heavy) => el("div", { class: "rg-row" },
      el("span", { class: "rg-name" }, label, el("small", null, sub)),
      el("div", { class: "rg-track" },
        heavy ? el("span", { class: "rg-band rg-band--heavy", style: `left:${pc(heavy.minKg)}%;width:${pc(heavy.maxKg - heavy.minKg)}%`, title: `Heavy vehicles: ${t1(heavy.minKg)} to ${t1(heavy.maxKg)}` }) : null,
        el("span", { class: "rg-band " + cls, style: `left:${pc(r.minKg)}%;width:${pc(r.maxKg - r.minKg)}%` }),
        el("span", { class: "rg-you", style: `left:${pc(mbs)}%`, title: `Yours: ${t1(mbs)}` })),
      el("strong", { class: "rg-val" }, `${t1(r.minKg)} to ${t1(r.maxKg)}`));

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
      aria: "Peak force against speed for a snatch strap, a kinetic rope and a winch rope of the same strength and length",
    });
    speedChart.setPlayhead(speed);
    const rows = kinds.map((x) => el("tr", { class: x.g.id === S.gear ? "is-mine" : null },
      el("th", { scope: "row" }, el("span", { class: "key key--" + x.g.id }), x.g.short),
      el("td", { class: "num" }, `${Math.round(x.k ? C.stretchOf(x.g.id) * 1000 : 0) / 10}%`),
      el("td", { class: "num" }, t1(x.k.peakIfUnbrokenKg * speed)),
      el("td", { class: "num" }, `${Math.floor(x.k.speedFor(Math.min(...limits.map((l) => l.kg))))} km/h`)));

    $("sizes").replaceChildren(
      el("p", { class: "hint part-intro" }, `Both go by the lighter of the two vehicles: here ${t1(lighter)}. The white line is yours, ${t1(mbs)}.`),
      el("div", { class: "ranges" },
        bar("Snatch strap", strapR, "rg-band--strap", "Australian standard: 2–3 × GVM"),
        bar("Kinetic rope", ropeR, "rg-band--kinetic", `Factor 55: 4–6 × (2–4 × for heavy vehicles, lighter band)`, ropeR.heavy)),
      el("p", { class: "layers-title" }, `Same ${t1(mbs)} strength and ${U.n(len, 0.1)} m length: the peak force by speed`),
      el("p", { class: "chart-title" }, ...kinds.map((x) => [el("span", { class: "key key--" + x.g.id }), x.g.short]), el("span", { class: "key key--mbs" }), "Breaks"),
      speedChart.el,
      el("div", { class: "table-wrap" }, el("table", { class: "limit-table speed-table" },
        el("thead", null, el("tr", null, el("th", { scope: "col" }, "Kind"), el("th", { scope: "col", class: "num" }, "Stretch"), el("th", { scope: "col", class: "num" }, `Peak, ${speed} km/h`), el("th", { scope: "col", class: "num" }, "Keep under"))),
        el("tbody", null, rows))),
      el("p", { class: "hint" }, `Stretch is what makes a kinetic recovery gentle: the more a strap or rope stretches, the longer it takes to stop the recovery vehicle, and the lower the peak. A winch rope (Dyneema, about 3% stretch at break) peaks ${U.n(Math.sqrt(C.stretchOf("strap") / C.stretchOf("static")), 0.1)} times as hard as a snatch strap of the same strength. "Keep under" is the speed at which the peak reaches the weakest of the strap, the shackle${R.pointKg ? " and the recovery points" : ""}. Stretch figures: Bushranger's 20% for its strap, Factor 55's 30% for its rope, Samson's AmSteel-Blue for the winch rope; yours may differ.`),
      U.sourcesLine(["strap-mbs", "kinetic-size", "strap-stretch", "kinetic-stretch", "static-stretch", "kinetic-model"]));
  }

  // ------------------------------------------------------------ shackles
  function renderShackles() {
    const { all, demand, shackle } = R;
    const sd = numOr(S.sideDeg, 0);
    const keep = C.sideLoadKeep(sd);
    $("shackles").replaceChildren(...all.map((s) => {
      const ok = s.wllKg > demand;
      const b = el("button", { type: "button", role: "radio", class: "sk" + (ok ? " sk--pass" : " sk--fail"), "aria-checked": String(s.id === shackle.id) },
        el("span", { class: "sk-kind" }, s.kind === "soft" ? "Soft · Factor 55" : "Steel · Crosby"),
        el("strong", { class: "sk-name" }, s.size),
        el("span", { class: "sk-wll" }, U.statusIcon(ok ? "pass" : "fail"), `WLL ${t1(s.wllKg)}`),
        el("small", { class: "sk-sub" }, s.kind === "steel"
          ? (keep < 1 ? `${Math.round(keep * 100)}% of ${t1(s.ratedWllKg)} at ${sd}°` : `breaks at ${t1(s.breakKg)} or more`)
          : (s.sideUnknown ? "no side-load figure" : `breaks at ${t1(s.breakKg)}`)));
      b.addEventListener("click", () => set({ shackle: s.id }));
      return el("li", null, b);
    }));
    $("shackle-notes").replaceChildren(
      el("p", { class: "hint" }, `Green: the WLL is above the ${t1(demand)} peak force at ${R.speed} km/h, so it passes Bushranger's rule (never exceed the shackles' WLL). The one you pick goes into the check above.${sd > 10 ? ` Pulled ${sd}° off in-line, Crosby's chart leaves a screw pin shackle ${Math.round(keep * 100)}% of its WLL; we found no such figure for soft shackles.` : ""}`),
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Centre the load in the bow. "), "Crosby: one leg on the pin, never more; never side load a round pin shackle."),
        el("li", null, el("strong", null, "Two legs in one bow, at most 120° apart "), "(Crosby): a bridle or a tree protector's two ends. More on that below."),
        el("li", null, el("strong", null, "Never join two straps with a shackle "), "(Bushranger). If one breaks, the shackle flies."),
        el("li", null, el("strong", null, "Big enough for the strap: "), "Crosby says a shackle must not pinch a synthetic sling.")),
      U.sourcesLine(["never-exceed", "shackle-ratings", "shackle-side-load", "soft-shackles", "shackle-included-angle", "no-shackle-join", "wll-mbs"]));
  }

  // ------------------------------------------------------------ the three safety straps
  function renderDamper() {
    const { kin, len } = R;
    const stretched = kin.peakStretchM;
    const keepM = C.standOff(len, stretched);
    $("damper-pic").replaceChildren(V.standOff({ width: Math.min(420, $("damper-pic").clientWidth || 360), lengthM: len + stretched, keepM }));
    $("damper-body").replaceChildren(
      el("div", { class: "job-figs" },
        U.figure("Stand at least", `${U.n(keepM, 0.1)} m away`, `1.5 × the ${U.n(len + stretched, 0.1)} m stretched ${R.gear.short.toLowerCase()} (Bushranger)`),
        U.figure(kin.breaks ? "Let go if it snaps" : "Stored at the peak", `${U.n((kin.breaks ? kin.breakEnergyJ : kin.energyJ) / 1000, 0.1)} kJ`, kin.breaks ? "all at once, at the breaking strength" : `the recovery vehicle's energy at ${R.speed} km/h`)),
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Always: "), "the strap standard requires a damper, heavy bag or blanket draped over the strap while it's used, to cut down its rebound."),
        el("li", null, el("strong", null, "In the middle: "), "WARN puts it midway along the rope, before it takes the load."),
        el("li", null, el("strong", null, "Everyone out: "), "get out of both vehicles and stand well away, never in line with the strap or in the recovery vehicle's path.")),
      el("p", { class: "hint" }, "No one we found publishes how much energy a damper soaks up, or how far a broken strap flies. A damper slows the strap down; it doesn't make standing close safe."),
      U.sourcesLine(["damper", "stand-clear"]));
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
        el("li", null, el("strong", null, "Its job: "), "to tie the winch rope to the tree, so the rope never wraps the trunk. WARN: never wrap the winch rope back onto itself."),
        el("li", null, el("strong", null, "Low on the trunk: "), "WARN says to hook up as low as possible, on an anchor that will hold, with a strap that won't slip."),
        el("li", null, el("strong", null, "Rated by breaking strength only: "), "WARN lists no WLL for it. With a double or triple line the anchor takes more than the winch's rating: see the ", U.externalLink("https://winching.psyphin.co.za/", "winching page"), ".")),
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
    const wllKg = C.lbToKg(b.wllLb);
    const ok = legKg < wllKg;
    $("bridle-body").replaceChildren(...[
      el("div", { class: "job-figs" },
        U.figure("Each point takes", t1(legKg), `${Math.round((legKg / pull) * 100)}% of the ${t1(pull)} snatch above${R.pointKg ? `; points rated ${t1(R.pointKg)}` : ""}`),
        U.figure(`Factor 55 ${b.label}`, `WLL ${t1(wllKg)}`, `${ok ? "above" : "below"} each leg's load · breaks at ${t1(C.lbToKg(b.breakLb))}`, ok ? "figure--pass" : "figure--fail")),
      over ? el("p", { class: "warn-line tone-fail" }, U.statusIcon("fail"), `Over ${maxDeg}°: Crosby says never put two legs that far apart in one shackle. Use a longer bridle.`) : null,
      el("ul", { class: "rules-list" },
        el("li", null, el("strong", null, "Its job: "), "to share the pull between both front recovery points. Bushranger: an equaliser spreads the load and cuts the risk of damage."),
        el("li", null, el("strong", null, "Keep it narrow: "), "side by side, each point takes half. The wider the legs, the more each one takes: at 120° each takes the whole pull.")),
      U.sourcesLine(["bridle", "leg-load", "shackle-included-angle"])].filter(Boolean));
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
      el("p", null, "A strap is picked by vehicle mass (its MBS against the GVM); a shackle by its WLL against the force it will see. A 3/4\" Crosby shackle's 4.75 t WLL next to an 8 t strap's MBS makes the shackle look like the weak link; it breaks at 28.5 t or more."),
      U.sourcesLine(["wll-mbs", "shackle-ratings", "strap-mbs"]));
    fill("explain-gaps",
      el("p", null, "Where no standard or maker publishes a figure, this page says so rather than filling the gap with a rule of thumb."),
      el("ul", null, D.gaps.map((x) => el("li", null, el("strong", null, x.title + ": "), x.text))));
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
