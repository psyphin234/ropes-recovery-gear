/*
 * diagrams.js: the page's pictures, built from calc.js results.
 *   scene       side view of the snatch: the stuck vehicle, the strap with a safety lanyard at each end, the
 *               recovery vehicle. Built once, updated in place (the strap stretches, snaps).
 *   gauge       dial of the force in the strap, with marks for what it must stay under
 *   lineChart   a chart with a playhead and tooltip (force over time, peak force by speed)
 *   shackleView a bow shackle with the pull swinging off in-line
 *   standOff    top view, to scale: the two vehicles, the strap, and where to stand
 *   vee         top view of two legs sharing a pull: a tree protector or a bridle
 * Text stays in text colours; series colours only mark identity (--series-* in style.css).
 * Ground and strap colours in the scene are illustration, not data.
 */
(function (root) {
  "use strict";

  const U = root.ROPES_UI;
  const { el } = U;
  const NS = "http://www.w3.org/2000/svg";

  function svg(tag, attrs, ...children) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
    });
    children.flat(Infinity).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  // One tooltip element shared by every chart on the page.
  let tip = null;
  function showTip(lines, clientX, clientY) {
    if (!tip) {
      tip = el("div", { class: "viz-tip", role: "presentation", hidden: true });
      document.body.appendChild(tip);
    }
    tip.replaceChildren(...lines.map((l, i) => el(i === 0 ? "strong" : "span", null, l)));
    tip.hidden = false;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const x = Math.min(window.innerWidth - w - 8, Math.max(8, clientX + 14));
    const y = clientY - h - 12 < 8 ? clientY + 16 : clientY - h - 12;
    tip.style.left = x + window.scrollX + "px";
    tip.style.top = y + window.scrollY + "px";
  }
  function hideTip() {
    if (tip) tip.hidden = true;
  }

  // A 4x4 seen from the side, facing right (the winching page's drawing).
  // Body from x 186 to 458, wheels at 250 and 396 (r 32), standing on y 290.
  function vehicle(cls) {
    const wheel = (cx) => svg("g", { class: "sc-wheel" },
      svg("circle", { cx, cy: 258, r: 32, class: "sc-tyre" }),
      svg("circle", { cx, cy: 258, r: 18, class: "sc-rim" }),
      [0, 72, 144, 216, 288].map((a) => svg("line", { x1: cx, y1: 258, x2: cx + 15 * Math.cos((a * Math.PI) / 180), y2: 258 + 15 * Math.sin((a * Math.PI) / 180), class: "sc-spoke" })),
      svg("circle", { cx, cy: 258, r: 4, class: "sc-hub" }));
    return svg("g", { class: cls },
      svg("path", { class: "sc-body", d: "M186 252 L186 206 Q186 196 196 195 L292 192 L320 151 Q325 145 333 145 L400 145 Q408 145 412 151 L434 190 L450 194 Q458 196 458 206 L458 252 Q458 256 454 256 L186 256 Z" }),
      svg("path", { class: "sc-glass", d: "M302 190 L326 156 Q329 152 335 152 L362 152 L362 190 Z" }),
      svg("path", { class: "sc-glass", d: "M370 152 L398 152 Q404 152 407 157 L428 190 L370 190 Z" }),
      svg("rect", { x: 334, y: 138, width: 66, height: 5, rx: 2, class: "sc-rack" }),
      svg("rect", { x: 456, y: 230, width: 14, height: 22, rx: 3, class: "sc-bar" }),
      svg("rect", { x: 174, y: 230, width: 14, height: 22, rx: 3, class: "sc-bar" }),
      wheel(250),
      wheel(396));
  }

  // ------------------------------------------------------------ the scene (side view)
  /*
   * viewBox 800 x 380, ground at y 290. Both vehicles are the drawing above at
   * 0.75 scale. The stuck one sits on the left, sunk into the sand; the recovery
   * vehicle is on the right and moves (dx, in SVG units) as the snatch plays.
   * The strap is drawn to scale along its own length: its stretch shows true.
   */
  function scene() {
    const VW = 800;
    const VH = 380;
    const GY = 290;
    const K = 0.75;
    const SINK = 26;
    const stuckTx = 40 - 186 * K;
    const stuckTy = GY - GY * K + SINK;
    const recTx = 540 - 186 * K;
    const recTy = GY - GY * K;
    // strap ends: the stuck vehicle's front recovery point, the recovery vehicle's rear one
    const A = { x: 470 * K + stuckTx + 2, y: 242 * K + stuckTy };
    const B0 = { x: 174 * K + recTx, y: 242 * K + recTy };
    const STRAP_PX = B0.x - A.x;

    const defs = svg("defs", null,
      svg("linearGradient", { id: "sc-sky", x1: 0, y1: 0, x2: 0, y2: 1 },
        svg("stop", { offset: "0", "stop-color": "#060c22" }),
        svg("stop", { offset: "1", "stop-color": "#101d42" })),
      svg("pattern", { id: "sc-sand", width: 48, height: 48, patternUnits: "userSpaceOnUse" },
        svg("rect", { width: 48, height: 48, fill: "#b48a52" }),
        [10, 26, 42].map((y) => svg("path", { d: `M0 ${y} q12 -5 24 0 t24 0`, fill: "none", stroke: "#9c7442", "stroke-width": 1.6 }))));

    const backdrop = svg("g", null,
      svg("rect", { width: VW, height: VH, fill: "url(#sc-sky)" }),
      svg("path", { d: "M0 250 Q120 200 230 232 T470 214 T800 226 L800 380 L0 380 Z", class: "sc-hill" }),
      svg("path", { d: "M0 300 Q160 262 330 286 T800 276 L800 380 L0 380 Z", class: "sc-hill sc-hill--near" }));

    const stuck = vehicle("sc-stuck");
    stuck.setAttribute("transform", `translate(${stuckTx} ${stuckTy}) scale(${K})`);
    const ground = svg("g", null,
      svg("rect", { x: 0, y: GY, width: VW, height: VH - GY, fill: "url(#sc-sand)" }),
      svg("ellipse", { cx: 250 * K + stuckTx - 22, cy: GY, rx: 24, ry: 8, fill: "url(#sc-sand)" }),
      svg("ellipse", { cx: 396 * K + stuckTx + 22, cy: GY, rx: 24, ry: 8, fill: "url(#sc-sand)" }),
      svg("line", { x1: 0, y1: GY, x2: VW, y2: GY, class: "sc-edge" }));
    const recInner = vehicle("sc-rec");
    recInner.setAttribute("transform", `translate(${recTx} ${recTy}) scale(${K})`);
    const rec = svg("g", { class: "sc-recg" }, recInner);

    const strap = svg("path", { class: "sc-strap", d: "" });
    const strapB = svg("path", { class: "sc-strap", d: "" });
    // safety lanyards: from each vehicle's bar to the strap a little way out from the shackle
    const lanA = svg("path", { class: "sc-lanyard", d: "" });
    const lanB = svg("path", { class: "sc-lanyard", d: "" });
    const qpt = (p0, c, p1, t) => ({ x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y });
    const lanyard = (anchor, on) => `M ${anchor.x} ${anchor.y} Q ${(anchor.x + on.x) / 2} ${Math.max(anchor.y, on.y) + 12} ${on.x} ${on.y}`;
    const shA = svg("circle", { class: "sc-shackle", cx: A.x, cy: A.y, r: 5 });
    const shB = svg("circle", { class: "sc-shackle", r: 5 });
    const speedTag = svg("text", { class: "sc-tag", x: 0, y: 0, "text-anchor": "middle" }, "");
    const gearTag = svg("text", { class: "sc-gear", x: (A.x + B0.x) / 2, y: GY + 34, "text-anchor": "middle" }, "");
    const snap = svg("text", { class: "sc-snap", x: (A.x + B0.x) / 2, y: A.y - 34, "text-anchor": "middle" }, "");

    const node = svg("svg", { class: "scene-svg", viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Side view of the snatch: the stuck vehicle, the strap with a safety lanyard at each end, and the recovery vehicle" },
      defs, backdrop, stuck, ground, rec, strap, strapB, lanA, lanB, shA, shB, speedTag, gearTag, snap);

    const pct = (x, y) => ({ left: (x / VW) * 100, top: (y / VH) * 100 });

    /*
     * s: { gear, dx (px the recovery vehicle has moved past "just tight";
     *      negative = slack), broken (0..1 progress of the recoil, or null),
     *      speedText, gearText, status }
     */
    function update(s) {
      node.setAttribute("class", "scene-svg sc--" + (s.gear || "strap") + (s.status ? " sc--" + s.status : ""));
      const dx = s.dx || 0;
      rec.setAttribute("transform", `translate(${dx} 0)`);
      const B = { x: B0.x + dx, y: B0.y };
      shB.setAttribute("cx", B.x);
      shB.setAttribute("cy", B.y);
      speedTag.setAttribute("x", 322 * K + recTx + dx);
      speedTag.setAttribute("y", GY + 34);
      speedTag.textContent = s.speedText || "";
      gearTag.textContent = s.gearText || "";
      // where each lanyard holds the strap: a set distance out from each end
      const f0 = Math.min(0.3, 30 / STRAP_PX);
      let onA;
      let onB;
      if (s.broken !== null && s.broken !== undefined) {
        // snapped in the middle: each half flies back toward its own vehicle, held by its lanyard
        const f = Math.min(1, s.broken);
        const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        const reach = 1 - 0.85 * f;
        const lift = Math.sin(f * Math.PI) * 34;
        const endA = { x: A.x + (m.x - A.x) * reach, y: A.y - lift };
        const endB = { x: B.x - (B.x - m.x) * reach, y: B.y - lift };
        const cA = { x: (A.x + endA.x) / 2, y: A.y - lift * 1.4 };
        const cB = { x: (B.x + endB.x) / 2, y: B.y - lift * 1.4 };
        strap.setAttribute("d", `M ${A.x} ${A.y} Q ${cA.x} ${cA.y} ${endA.x} ${endA.y}`);
        strapB.setAttribute("d", `M ${B.x} ${B.y} Q ${cB.x} ${cB.y} ${endB.x} ${endB.y}`);
        onA = qpt(A, cA, endA, Math.min(0.9, f0 * 2));
        onB = qpt(B, cB, endB, Math.min(0.9, f0 * 2));
        snap.textContent = "SNAP";
      } else {
        strapB.setAttribute("d", "");
        snap.textContent = "";
        if (dx < 0) {
          // slack: the strap sags between the two ends
          const sag = Math.min(46, Math.sqrt(-dx * STRAP_PX) * 0.9);
          const c = { x: (A.x + B.x) / 2, y: Math.min(GY - 4, (A.y + B.y) / 2 + sag * 2) };
          strap.setAttribute("d", `M ${A.x} ${A.y} Q ${c.x} ${c.y} ${B.x} ${B.y}`);
          onA = qpt(A, c, B, f0);
          onB = qpt(A, c, B, 1 - f0);
        } else {
          strap.setAttribute("d", `M ${A.x} ${A.y} L ${B.x} ${B.y}`);
          onA = { x: A.x + (B.x - A.x) * f0, y: A.y + (B.y - A.y) * f0 };
          onB = { x: B.x - (B.x - A.x) * f0, y: B.y - (B.y - A.y) * f0 };
        }
      }
      lanA.setAttribute("d", lanyard({ x: A.x - 10, y: A.y - 12 }, onA));
      lanB.setAttribute("d", lanyard({ x: B.x + 10, y: B.y - 12 }, onB));
      return {
        stuckField: pct(300 * K + stuckTx + 28, 96),
        recField: pct(310 * K + recTx + 30, 96),
        strapField: pct((A.x + B0.x) / 2, 176),
      };
    }

    return { el: node, update, strapPx: STRAP_PX };
  }

  // ------------------------------------------------------------ force dial
  function gauge() {
    const cx = 110;
    const cy = 112;
    const R = 92;
    const arcPath = (f) => {
      const a = Math.PI - f * Math.PI;
      return `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(a)} ${cy - R * Math.sin(a)}`;
    };
    const track = svg("path", { d: arcPath(1), class: "ga-track" });
    const fill = svg("path", { d: arcPath(0.001), class: "ga-fill" });
    const ticks = svg("g", { class: "ga-ticks" });
    const marks = svg("g", { class: "ga-marks" });
    const peak = svg("line", { class: "ga-peak", x1: cx, y1: cy - R - 9, x2: cx, y2: cy - R + 9 });
    const needle = svg("g", { class: "ga-needle" }, svg("path", { d: `M ${cx - 4} ${cy} L ${cx} ${cy - R + 16} L ${cx + 4} ${cy} Z` }), svg("circle", { cx, cy, r: 7 }));
    const node = svg("svg", { class: "gauge-svg", viewBox: "0 0 220 122", role: "img", "aria-label": "Dial of the force in the strap" }, track, fill, ticks, marks, peak, needle);
    let max = 10000;
    const at = (kg) => Math.max(0, Math.min(1, kg / max));
    return {
      el: node,
      // limits: [{ kg, cls }] marks on the rim; peakKg: the peak mark
      setScale(topKg, limits, peakKg) {
        const stepT = topKg > 16000 ? 4 : topKg > 8000 ? 2 : 1;
        max = Math.max(stepT * 1000 * 3, Math.ceil((topKg * 1.08) / (stepT * 1000)) * stepT * 1000);
        const kids = [];
        for (let v = 0; v <= max + 1; v += stepT * 1000) {
          const a = Math.PI - (v / max) * Math.PI;
          kids.push(svg("line", { x1: cx + (R - 7) * Math.cos(a), y1: cy - (R - 7) * Math.sin(a), x2: cx + (R + 5) * Math.cos(a), y2: cy - (R + 5) * Math.sin(a) }));
          kids.push(svg("text", { x: cx + (R - 22) * Math.cos(a), y: cy - (R - 22) * Math.sin(a) + 4, "text-anchor": "middle" }, String(v / 1000)));
        }
        kids.push(svg("text", { x: cx, y: cy - 30, "text-anchor": "middle", class: "ga-unit" }, "tonnes"));
        ticks.replaceChildren(...kids);
        marks.replaceChildren(...limits.filter((l) => l.kg > 0).map((l) => {
          const a = Math.PI - at(l.kg) * Math.PI;
          return svg("line", { class: "ga-mark " + l.cls, x1: cx + (R - 10) * Math.cos(a), y1: cy - (R - 10) * Math.sin(a), x2: cx + (R + 11) * Math.cos(a), y2: cy - (R + 11) * Math.sin(a) });
        }));
        peak.style.transform = `rotate(${at(peakKg) * 180 - 90}deg)`;
      },
      set(kg) {
        const f = at(kg);
        needle.style.transform = `rotate(${f * 180 - 90}deg)`;
        fill.setAttribute("d", arcPath(Math.max(f, 0.001)));
      },
    };
  }

  // ------------------------------------------------------------ line chart with a playhead
  /*
   * o: { width, height, points: [{ x, ...keys }], series: [{ key, cls, label, short }],
   *      yUnit, yFormat(v), xLabel, xFormat(v), labelEnds, tip(p) -> [lines], aria }
   */
  function lineChart(o) {
    const W = Math.max(280, Math.min(760, Math.round(o.width || 600)));
    const narrow = W < 460;
    const H = o.height || 210;
    const pad = { l: 46, r: o.labelEnds ? (narrow ? 74 : 112) : 14, t: 20, b: o.xLabel ? 38 : 22 };
    const pts = o.points;
    const xMin = pts[0].x;
    const xMax = pts[pts.length - 1].x || 1;
    const yMaxRaw = Math.max(...pts.map((p) => Math.max(...o.series.map((s) => p[s.key] || 0))), 1);
    const step = niceStep(yMaxRaw / 3);
    const yMax = Math.ceil((yMaxRaw * 1.08) / step) * step;
    const X = (x) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r);
    const Y = (y) => H - pad.b - (Math.min(y, yMax) / yMax) * (H - pad.t - pad.b);
    const yFmt = o.yFormat || ((v) => U.n(v, 1));
    const xFmt = o.xFormat || ((v, st) => U.n(v, st < 1 ? (st < 0.1 ? 0.01 : 0.1) : 1));

    const g = svg("g", null);
    for (let v = 0; v <= yMax + 1e-9; v += step) {
      g.appendChild(svg("line", { class: "ch-grid", x1: pad.l, x2: W - pad.r, y1: Y(v), y2: Y(v) }));
      g.appendChild(svg("text", { class: "ch-tick", x: pad.l - 8, y: Y(v) + 4, "text-anchor": "end" }, yFmt(v)));
    }
    g.appendChild(svg("text", { class: "ch-unit", x: 4, y: 11, "text-anchor": "start" }, o.yUnit));
    const xStep = niceStep((xMax - xMin) / (narrow ? 3 : 5));
    for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax + 1e-9; v += xStep) g.appendChild(svg("text", { class: "ch-tick", x: X(v), y: H - pad.b + 16, "text-anchor": "middle" }, xFmt(v, xStep)));
    if (o.xLabel) g.appendChild(svg("text", { class: "ch-axis", x: (pad.l + W - pad.r) / 2, y: H - 4, "text-anchor": "middle" }, o.xLabel));

    o.series.forEach((s) => {
      const d = pts.map((p, i) => `${i ? "L" : "M"} ${X(p.x).toFixed(1)} ${Y(p[s.key]).toFixed(1)}`).join(" ");
      g.appendChild(svg("path", { class: "ch-line " + s.cls, d }));
    });
    if (o.labelEnds) {
      // end labels, pushed apart so they never overlap
      const last = pts[pts.length - 1];
      const items = o.series.map((s) => ({ s, y: Y(last[s.key]) + 4 })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < items.length; i++) items[i].y = Math.max(items[i].y, items[i - 1].y + 14);
      const over = items.length ? items[items.length - 1].y - (H - pad.b + 4) : 0;
      if (over > 0) items.forEach((it) => { it.y -= over; });
      items.forEach((it) => g.appendChild(svg("text", { class: "ch-label", x: W - pad.r + 8, y: it.y }, narrow ? it.s.short : it.s.label)));
    }

    const head = svg("line", { class: "ch-playhead", x1: X(xMin), x2: X(xMin), y1: pad.t, y2: H - pad.b });
    const dots = o.series.filter((s) => !s.flat).map((s) => ({ s, c: svg("circle", { class: "ch-dot " + s.cls, r: 4.5, cx: X(xMin), cy: Y(pts[0][s.key]) }) }));
    g.append(head, ...dots.map((d) => d.c));
    const hit = svg("rect", { x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b, fill: "transparent" });
    g.appendChild(hit);
    const node = svg("svg", { class: "chart-svg", viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": o.aria }, g);
    hit.addEventListener("pointermove", (e) => {
      const box = node.getBoundingClientRect();
      const sx = ((e.clientX - box.left) / box.width) * W;
      const x = xMin + Math.max(0, Math.min(1, (sx - pad.l) / (W - pad.l - pad.r))) * (xMax - xMin);
      const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
      showTip(o.tip(p), e.clientX, e.clientY);
    });
    hit.addEventListener("pointerleave", hideTip);

    function valueAt(key, x) {
      let i = 0;
      while (i < pts.length - 1 && pts[i + 1].x <= x) i++;
      const a = pts[i];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
      return a[key] + t * (b[key] - a[key]);
    }
    return {
      el: node,
      setPlayhead(x) {
        const xx = Math.max(xMin, Math.min(xMax, x));
        const px = X(xx);
        head.setAttribute("x1", px);
        head.setAttribute("x2", px);
        dots.forEach((d) => {
          d.c.setAttribute("cx", px);
          d.c.setAttribute("cy", Y(valueAt(d.s.key, xx)));
        });
      },
    };
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  // ------------------------------------------------------------ a bow shackle, pulled off in-line
  function shackleView() {
    const pull = svg("g", { class: "sv-pull" },
      svg("line", { x1: 50, y1: 46, x2: 50, y2: 92, class: "sv-line" }),
      svg("path", { d: "M 44 84 L 50 96 L 56 84 Z", class: "sv-head" }));
    const node = svg("svg", { class: "shackle-svg", viewBox: "0 0 100 100", "aria-hidden": "true" },
      svg("line", { x1: 50, y1: 50, x2: 50, y2: 96, class: "sv-inline" }),
      svg("path", { d: "M 30 16 L 30 30 Q 30 62 50 62 Q 70 62 70 30 L 70 16", class: "sv-bow" }),
      svg("rect", { x: 22, y: 10, width: 56, height: 9, rx: 4, class: "sv-pin" }),
      svg("circle", { cx: 82, cy: 14.5, r: 5, class: "sv-pin" }),
      svg("path", { class: "sv-arc", d: "" }),
      pull);
    const arc = node.querySelector(".sv-arc");
    return {
      el: node,
      set(deg) {
        pull.style.transform = `rotate(${deg}deg)`;
        const a = (deg * Math.PI) / 180;
        const r = 30;
        arc.setAttribute("d", deg > 0.5 ? `M 50 ${50 + r} A ${r} ${r} 0 0 0 ${50 - r * Math.sin(a)} ${50 + r * Math.cos(a)}` : "");
      },
    };
  }

  // ------------------------------------------------------------ where to stand, top view to scale
  /*
   * o: { width, lengthM (the strap, stretched), keepM (stand-off distance) }
   * Vehicles drawn 5 m x 1.9 m (illustration); strap and stand-off to scale.
   */
  function standOff(o) {
    const VL = 5;
    const VWm = 1.9;
    const runM = VL * 2 + o.lengthM;
    const totalM = runM + 2 * o.keepM;
    const W = Math.max(280, Math.min(420, Math.round(o.width || 360)));
    const sc = (W - 16) / totalM;
    const H = Math.round((VWm + 2 * o.keepM) * sc + 16);
    const x0 = 8 + o.keepM * sc;
    const yMid = H / 2;
    const vh = VWm * sc;
    const veh = (x) => svg("rect", { x, y: yMid - vh / 2, width: VL * sc, height: vh, rx: Math.min(4, vh / 3), class: "so-veh" });
    const sx = x0 + VL * sc;
    const ex = sx + o.lengthM * sc;
    const r = o.keepM * sc;
    const zone = svg("rect", { x: 8, y: yMid - vh / 2 - r, width: runM * sc + 2 * r, height: vh + 2 * r, rx: r, class: "so-zone" });
    const dimY = yMid - vh / 2 - r;
    return svg("svg", { class: "so-svg", viewBox: `0 0 ${W} ${H + 18}`, width: W, height: H + 18, role: "img", "aria-label": `Top view to scale: stand at least ${U.n(o.keepM, 0.1)} metres from the vehicles and the strap` },
      zone,
      veh(x0), veh(ex),
      svg("line", { x1: sx, y1: yMid, x2: ex, y2: yMid, class: "so-strap" }),
      svg("path", { d: `M ${sx} ${yMid - 3} q ${Math.max(6, 1.2 * sc)} -9 ${Math.max(10, 2 * sc)} -3`, class: "so-lanyard" }),
      svg("path", { d: `M ${ex} ${yMid - 3} q ${-Math.max(6, 1.2 * sc)} -9 ${-Math.max(10, 2 * sc)} -3`, class: "so-lanyard" }),
      svg("line", { x1: x0, y1: dimY, x2: x0, y2: yMid - vh / 2, class: "so-dim" }),
      svg("text", { x: x0 + 6, y: (dimY + yMid - vh / 2) / 2 + 4, class: "so-text" }, `${U.n(o.keepM, 0.1)} m`),
      svg("text", { x: W / 2, y: H + 12, "text-anchor": "middle", class: "so-text so-text--muted" }, "Everyone outside the dashed line"));
  }

  // ------------------------------------------------------------ two legs sharing a pull, top view
  /*
   * o: { kind: "tree" | "bridle", deg (angle between the legs), over (past 120°) }
   * The legs meet at a shackle on the right; the pull goes off to the right.
   */
  function vee(o) {
    const W = 300;
    const H = 170;
    const J = { x: 196, y: 85 };
    const half = ((Math.max(0, Math.min(o.deg, 170)) / 2) * Math.PI) / 180;
    const kids = [];
    let pA;
    let pB;
    if (o.kind === "tree") {
      // the legs leave the trunk on tangents that meet at the shackle; the
      // protector wraps round the back of the trunk between them
      const d0 = 150;
      const tr = Math.max(8, Math.min(50, d0 * Math.sin(half)));
      const d = Math.min(d0, tr / Math.max(Math.sin(half), 1e-6));
      const T = { x: J.x - d, y: J.y };
      const phi = Math.acos(Math.min(1, tr / d));
      pA = { x: T.x + tr * Math.cos(phi), y: T.y - tr * Math.sin(phi) };
      pB = { x: T.x + tr * Math.cos(phi), y: T.y + tr * Math.sin(phi) };
      kids.push(svg("circle", { cx: T.x, cy: T.y, r: tr, class: "vv-tree" }));
      kids.push(svg("path", { d: `M ${pA.x} ${pA.y} A ${tr} ${tr} 0 1 0 ${pB.x} ${pB.y}`, class: "vv-strap vv-strap--wrap" }));
    } else {
      const leg = Math.min(128, 66 / Math.max(Math.sin(half), 1e-6));
      pA = { x: J.x - leg * Math.cos(half), y: J.y - leg * Math.sin(half) };
      pB = { x: J.x - leg * Math.cos(half), y: J.y + leg * Math.sin(half) };
      const top = Math.min(pA.y, J.y - 30) - 14;
      kids.push(svg("rect", { x: pA.x - 46, y: top, width: 40, height: Math.max(pB.y, J.y + 30) + 14 - top, rx: 8, class: "vv-veh" }));
      kids.push(svg("rect", { x: pA.x - 8, y: pA.y - 6, width: 10, height: 12, rx: 2, class: "vv-point" }));
      kids.push(svg("rect", { x: pB.x - 8, y: pB.y - 6, width: 10, height: 12, rx: 2, class: "vv-point" }));
    }
    const legCls = "vv-strap" + (o.over ? " is-over" : "");
    kids.push(svg("line", { x1: pA.x, y1: pA.y, x2: J.x, y2: J.y, class: legCls }));
    kids.push(svg("line", { x1: pB.x, y1: pB.y, x2: J.x, y2: J.y, class: legCls }));
    kids.push(svg("line", { x1: J.x, y1: J.y, x2: W - 6, y2: J.y, class: "vv-pull" }));
    kids.push(svg("path", { d: `M ${W - 14} ${J.y - 6} L ${W - 4} ${J.y} L ${W - 14} ${J.y + 6} Z`, class: "vv-head" }));
    // the angle between the legs
    const r = Math.min(34, Math.hypot(J.x - pA.x, J.y - pA.y) * 0.55);
    if (o.deg > 1) kids.push(svg("path", { d: `M ${J.x - r * Math.cos(half)} ${J.y - r * Math.sin(half)} A ${r} ${r} 0 0 0 ${J.x - r * Math.cos(half)} ${J.y + r * Math.sin(half)}`, class: "vv-arc" + (o.over ? " is-over" : "") }));
    kids.push(svg("circle", { cx: J.x, cy: J.y, r: 6, class: "vv-shackle" }));
    kids.push(svg("text", { x: J.x + 12, y: J.y + 26, "text-anchor": "start", class: "vv-angle" + (o.over ? " is-over" : "") }, `${Math.round(o.deg)}°`));
    kids.push(svg("text", { x: W - 6, y: J.y - 10, "text-anchor": "end", class: "vv-text" }, o.kind === "tree" ? "to the winch" : "to the strap"));
    return svg("svg", { class: "vv-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${o.kind === "tree" ? "Tree protector" : "Bridle"} seen from above, its two legs ${Math.round(o.deg)}° apart` }, kids);
  }

  root.ROPES_DIAGRAMS = { scene, gauge, lineChart, shackleView, standOff, vee };
})(window);
