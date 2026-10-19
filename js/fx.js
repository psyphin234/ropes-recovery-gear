/* Visual effects, decoration only (nothing here touches the calculations):
   - the snatch hologram in the header (canvas.hero-fx): a 4x4 bogged in sand
     on the left, a bakkie on the right taking up a kinetic rope. The bakkie
     pulls away, the slack rope lifts off the sand and stretches (glowing
     brighter and its weave drawing out), then the stuck vehicle pops out and
     the rope eases back; safety lanyards at both ends. Then it holds, dims and
     starts again. It shows no figures, so it can't be mistaken for a result;
   - the explainers fading in as they scroll into view.
   Under prefers-reduced-motion the hologram is drawn once, at the peak of the
   stretch, and the fade-ins are skipped. The circuit board behind the page is
   js/circuit.js. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- fade-ins
  function setUpReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("fx-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    document.querySelectorAll(".explainer").forEach(function (el) { io.observe(el); });
    // Fail-safe: nothing stays invisible if the observer misses it.
    setTimeout(function () {
      document.querySelectorAll(".explainer").forEach(function (el) { el.classList.add("is-visible"); });
    }, 4000);
  }

  // ------------------------------------------------------------ the hologram
  // World units: the sand is y = 0 and up is negative. Both vehicles face right
  // and are drawn at VS of their own size. The stuck vehicle's rear is at x = S,
  // the bakkie's rear (its tow hitch) at x = R. ROPE is the rope's length at rest.
  var VS = 0.72, ROPE = 150;
  var CYCLE = 7.6, HOLD = 6.6, PEAK = 2.7;
  var BOX = { l: -40, t: -226, r: 676, b: 62 };
  var W_STUCK = [62, 238], W_BAKKIE = [70, 240];
  var STUCK_POINT = [314, -36], HITCH = [-18, -34];

  function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  // Where the two vehicles are at time t (seconds into the cycle).
  function positions(t) {
    var R, S;
    if (t < 1.6) R = 344 + 45 * (t / 1.6) * (t / 1.6);                     // pulls away, speeding up
    else if (t < 2.86) R = 389 + 45 * Math.sin(((t - 1.6) / 1.26) * Math.PI / 2); // the rope stretches 30% and slows it
    else R = 434 + 9 * ease((t - 2.86) / 1.4);
    S = 54 * ease((t - 2.5) / 1.5);                                           // the stuck vehicle pops out
    return { R: R, S: S };
  }

  function wagon(ctx) {
    ctx.moveTo(6, -30);
    ctx.lineTo(2, -72);
    ctx.lineTo(8, -126);
    ctx.quadraticCurveTo(10, -134, 22, -134);
    ctx.lineTo(184, -134);
    ctx.lineTo(220, -92);
    ctx.lineTo(286, -86);
    ctx.quadraticCurveTo(298, -84, 298, -70);
    ctx.lineTo(298, -32);
    ctx.lineTo(278, -32);
    ctx.arc(238, -32, 40, 0, Math.PI, true);
    ctx.lineTo(102, -32);
    ctx.arc(62, -32, 40, 0, Math.PI, true);
    ctx.closePath();
  }

  function wagonDetails(ctx) {
    ctx.moveTo(28, -124); ctx.lineTo(178, -124); ctx.lineTo(208, -94); ctx.lineTo(28, -94); ctx.closePath();
    ctx.moveTo(112, -124); ctx.lineTo(112, -94);
    ctx.moveTo(112, -94); ctx.lineTo(112, -40);
    ctx.moveTo(206, -92); ctx.lineTo(206, -40);
    ctx.moveTo(22, -146); ctx.lineTo(182, -146);
    [36, 100, 164].forEach(function (x) { ctx.moveTo(x, -146); ctx.lineTo(x, -134); });
    ctx.moveTo(226, -90); ctx.lineTo(220, -150); ctx.lineTo(232, -154);
    ctx.moveTo(294, -74); ctx.arc(290, -74, 4, 0, Math.PI * 2);
    ctx.moveTo(10, -80); ctx.arc(-12, -80, 22, 0, Math.PI * 2);
    ctx.moveTo(-3, -80); ctx.arc(-12, -80, 9, 0, Math.PI * 2);
    ctx.moveTo(298, -84); ctx.lineTo(314, -80); ctx.lineTo(318, -32); ctx.lineTo(298, -28);
  }

  // The towing checker's bakkie, turned to face right: rear (tailgate) at x = 0.
  function bakkie(ctx) {
    ctx.moveTo(302, -26);
    ctx.lineTo(300, -58);
    ctx.lineTo(288, -70);
    ctx.lineTo(204, -78);
    ctx.lineTo(168, -124);
    ctx.lineTo(100, -126);
    ctx.lineTo(94, -80);
    ctx.lineTo(2, -80);
    ctx.lineTo(0, -30);
    ctx.lineTo(32, -30);
    ctx.arc(70, -30, 38, Math.PI, 0, false);
    ctx.lineTo(202, -30);
    ctx.arc(240, -30, 38, Math.PI, 0, false);
    ctx.closePath();
  }

  function bakkieDetails(ctx) {
    ctx.moveTo(198, -82); ctx.lineTo(166, -118); ctx.lineTo(104, -120); ctx.lineTo(101, -82); ctx.closePath();
    ctx.moveTo(142, -82); ctx.lineTo(140, -119);
    ctx.moveTo(202, -76); ctx.lineTo(202, -40);
    ctx.moveTo(94, -80); ctx.lineTo(94, -36);
    ctx.moveTo(298, -55); ctx.lineTo(286, -57);
    // load bed rail and the tow hitch
    ctx.moveTo(6, -88); ctx.lineTo(92, -88);
    ctx.moveTo(0, -34); ctx.lineTo(HITCH[0] + 4, HITCH[1]);
  }

  function wheel(ctx, x, r, spin) {
    var y = -r;
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x + r * 0.58, y); ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
    for (var k = 0; k < 6; k++) {
      var a = spin + k * Math.PI / 3;
      ctx.moveTo(x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18);
      ctx.lineTo(x + Math.cos(a) * r * 0.56, y + Math.sin(a) * r * 0.56);
    }
    for (var t = 0; t < 14; t++) {
      var b = spin + t * Math.PI / 7;
      ctx.moveTo(x + Math.cos(b) * r * 0.84, y + Math.sin(b) * r * 0.84);
      ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r);
    }
  }

  function ring(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }

  function setUpHologram() {
    var canvas = document.querySelector(".hero-fx");
    if (!canvas || !canvas.getContext) return;
    var header = canvas.parentElement;
    var text = header.querySelector(".brand-text");
    var ctx = canvas.getContext("2d");

    var w = 0, h = 0, s = 1, ox = 0, oy = 0, fade = 1, labels = true;
    var mx = 0, my = 0, tx = 0, ty = 0;
    var bw = BOX.r - BOX.l, bh = BOX.b - BOX.t;
    var grains = [];
    for (var i = 0; i < 24; i++) grains.push({ p: Math.random(), v: 0.9 + Math.random() * 0.9, k: 0.6 + Math.random() * 0.8, wheel: i % 3 });
    var RIPPLES = [];
    for (var m = 0; m < 30; m++) RIPPLES.push({ x: -40 + m * 27 + (m * 37 % 13), depth: 8 + (m * 53 % 40) });

    function resize() {
      var rect = header.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var textRight = text ? text.getBoundingClientRect().right - rect.left : w * 0.6;
      var contentRight = (w + Math.min(w, 1120)) / 2;
      var room = Math.min(w - 24, contentRight + 200) - textRight - 30;
      if (room > 300) {
        s = Math.min(room / bw, (h - 30) / bh);
        ox = textRight + 30 + (room - bw * s) / 2 - BOX.l * s;
        oy = h - 14 - BOX.b * s - Math.max(0, (h - 30 - bh * s) / 2);
        fade = 1; labels = true;
      } else {
        // Narrow screens: a faint scene behind the text, along the bottom.
        s = Math.min((w * 0.95) / bw, (h * 0.5) / bh);
        ox = w - BOX.r * s - 8;
        oy = h - BOX.b * s - 6;
        fade = 0.2; labels = false;
      }
    }

    function stroke(colour, width, blur) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width / s;
      ctx.shadowColor = "rgba(76, 201, 255, 0.9)";
      ctx.shadowBlur = blur;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // a point in a vehicle's frame, in the world
    function at(x0, sink, p) { return [x0 + p[0] * VS, (p[1] + sink) * VS]; }

    function vehicle(x0, sink, body, details, wheels, r, spin, time) {
      ctx.save();
      ctx.translate(x0, 0);
      ctx.scale(VS, VS);
      ctx.translate(0, sink);
      ctx.save();
      ctx.beginPath(); body(ctx);
      var fill = ctx.createLinearGradient(0, -150, 0, 0);
      fill.addColorStop(0, "rgba(76, 201, 255, 0.11)");
      fill.addColorStop(1, "rgba(76, 201, 255, 0.02)");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = "rgba(160, 225, 255, 0.07)";
      var shift = reduceMotion ? 0 : (time * 12) % 4;
      for (var ly = -150 + shift; ly < 0; ly += 4) ctx.fillRect(-20, ly, 340, 1 / (s * VS));
      ctx.restore();
      var sv = s; s = s * VS;              // line widths in screen pixels inside the scaled frame
      ctx.beginPath(); body(ctx); stroke("rgba(76, 201, 255, 0.8)", 1.4, 6);
      ctx.beginPath(); details(ctx); stroke("rgba(76, 201, 255, 0.6)", 1.05, 3);
      ctx.beginPath(); wheels.forEach(function (x) { wheel(ctx, x, r, spin); }); stroke("rgba(76, 201, 255, 0.8)", 1.2, 5);
      s = sv;
      ctx.restore();
    }

    function frame(t) {
      var time = t / 1000;
      var phase = reduceMotion ? PEAK : time % CYCLE;
      var alpha = 1;
      if (phase > HOLD) {
        var q = (phase - HOLD) / (CYCLE - HOLD);
        alpha = 1 - 0.85 * Math.sin(q * Math.PI);
        if (q >= 0.5) phase = 0;
      }
      var pos = positions(phase);
      var sink = 18 - 13 * (pos.S / 54);
      var A = at(pos.S, sink, STUCK_POINT);        // the rope's ends
      var B = at(pos.R, 0, HITCH);
      var dist = B[0] - A[0];
      var stretch = Math.max(0, dist / ROPE - 1);
      var tension = Math.min(1, stretch / 0.28);

      ctx.clearRect(0, 0, w, h);
      tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
      ctx.save();
      ctx.translate(ox + tx * 10, oy + ty * 6);
      ctx.scale(s, s);
      ctx.globalAlpha = fade * alpha;

      var pool = ctx.createRadialGradient(350, -80, 10, 350, -80, 440);
      pool.addColorStop(0, "rgba(47, 107, 255, 0.2)");
      pool.addColorStop(1, "rgba(47, 107, 255, 0)");
      ctx.fillStyle = pool;
      ctx.fillRect(-120, -560, 980, 900);

      // dunes far behind
      ctx.beginPath();
      ctx.moveTo(-40, -40); ctx.bezierCurveTo(60, -96, 170, -100, 260, -58);
      ctx.bezierCurveTo(330, -26, 400, -92, 500, -104); ctx.bezierCurveTo(580, -112, 640, -74, 676, -58);
      stroke("rgba(76, 201, 255, 0.22)", 1, 0);

      // ---- vehicles (the sand is drawn over the stuck one's wheels afterwards)
      var stuckSpin = pos.S / (32 * VS) + (phase > 2.2 && phase < 4 ? (phase - 2.2) * 6 : 0);
      vehicle(pos.S, sink, wagon, wagonDetails, W_STUCK, 32, stuckSpin, time);
      vehicle(pos.R, 0, bakkie, bakkieDetails, W_BAKKIE, 30, (pos.R - 344) / (30 * VS), time);

      // sand thrown off the wheels while they drive
      var bSpeed = phase < 2.86 ? 1 : 0, sSpeed = phase > 2.4 && phase < 4 ? 1 : 0;
      ctx.fillStyle = "rgb(150, 210, 255)";
      grains.forEach(function (g) {
        var on = g.wheel === 0 ? sSpeed : bSpeed;
        if (!on || reduceMotion) return;
        var p = (g.p + time * g.v) % 1;
        var wx = g.wheel === 0 ? pos.S + W_STUCK[0] * VS : pos.R + W_BAKKIE[g.wheel - 1] * VS;
        ctx.globalAlpha = fade * alpha * (1 - p) * 0.8;
        ctx.fillRect(wx - 14 - p * 56 * g.k, -4 - p * 34 * g.k + p * p * 38, 2.2 / s, 2.2 / s);
      });
      ctx.globalAlpha = fade * alpha;

      // ---- sand
      ctx.beginPath();
      ctx.moveTo(BOX.l, 0); ctx.lineTo(BOX.r, 0); ctx.lineTo(BOX.r, BOX.b); ctx.lineTo(BOX.l, BOX.b); ctx.closePath();
      var slab = ctx.createLinearGradient(0, 0, 0, BOX.b);
      slab.addColorStop(0, "rgba(5, 10, 30, 0.95)");
      slab.addColorStop(1, "rgba(4, 8, 24, 0.7)");
      ctx.fillStyle = slab;
      ctx.fill();
      ctx.strokeStyle = "rgba(76, 201, 255, 0.2)";
      ctx.lineWidth = 0.9 / s;
      RIPPLES.forEach(function (rp) {
        ctx.beginPath(); ctx.moveTo(rp.x, rp.depth); ctx.quadraticCurveTo(rp.x + 9, rp.depth - 4, rp.x + 18, rp.depth); ctx.stroke();
      });
      var edge = ctx.createLinearGradient(-90, 0, 800, 0);  // the lit surface runs a little past the frame, fading out
      edge.addColorStop(0, "rgba(76, 201, 255, 0)");
      edge.addColorStop(0.12, "rgba(76, 201, 255, 0.75)");
      edge.addColorStop(0.9, "rgba(76, 201, 255, 0.75)");
      edge.addColorStop(1, "rgba(76, 201, 255, 0)");
      ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(800, 0);
      ctx.strokeStyle = edge; ctx.lineWidth = 1.3 / s;
      ctx.shadowColor = "rgba(76, 201, 255, 0.9)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
      // sand heaped round the stuck vehicle's wheels
      ctx.beginPath();
      W_STUCK.forEach(function (x) {
        var cx = pos.S + x * VS;
        ctx.moveTo(cx - 30, 0); ctx.quadraticCurveTo(cx + 4, -10 * (sink / 18), cx + 30, 0);
      });
      stroke("rgba(120, 200, 255, 0.6)", 1.1, 4);

      // ---- the rope: lying in the sand while slack, lifting off as it
      // straightens, then stretching: brighter, thicker, its weave drawn out
      var slack = Math.max(0, ROPE - dist);
      var midX = (A[0] + B[0]) / 2;
      var sag = Math.min(Math.sqrt(Math.max(0, ROPE * ROPE - dist * dist)) * 0.55, -A[1] + 2);
      var C = [midX, (A[1] + B[1]) / 2 + sag * 2];   // quadratic control point: the rope's low point is about sag below
      function rope() { ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]); }
      var glow = 0.6 + 0.4 * tension;
      ctx.beginPath(); rope();
      ctx.strokeStyle = "rgba(" + Math.round(120 + 115 * tension) + ", " + Math.round(215 + 35 * tension) + ", 255, " + glow + ")";
      ctx.lineWidth = (2.2 + 1.6 * tension) / s;
      ctx.shadowColor = "rgba(76, 201, 255, 1)"; ctx.shadowBlur = 6 + 14 * tension;
      ctx.stroke(); ctx.shadowBlur = 0;
      var k = Math.max(1, dist / ROPE);
      ctx.setLineDash([6 * k, 6 * k]);
      ctx.lineDashOffset = 0;
      ctx.beginPath(); rope(); stroke("rgba(235, 250, 255, " + (0.5 + 0.5 * tension) + ")", 1.1, 4);
      ctx.setLineDash([]);
      // stretch flash at the peak
      if (tension > 0.85 && !reduceMotion) {
        ctx.fillStyle = "rgba(220, 245, 255, " + (tension - 0.85) * 4 + ")";
        ctx.beginPath(); ctx.arc(midX, (A[1] + B[1]) / 2, 5 / s, 0, Math.PI * 2); ctx.fill();
      }
      // safety lanyards: a slack loop from each recovery point to the rope near it
      function lanyard(P, dir) {
        var u = 0.16, q0 = [P[0] + (C[0] - P[0]) * 2 * u, P[1] + (C[1] - P[1]) * 2 * u];   // a point along the rope
        ctx.moveTo(P[0], P[1] + 3);
        ctx.quadraticCurveTo((P[0] + q0[0]) / 2 + dir * 4, Math.max(P[1], q0[1]) + 14, q0[0], q0[1] + 1);
        return q0;
      }
      ctx.beginPath();
      var L1 = lanyard(A, 1), L2 = lanyard(B, -1);
      stroke("rgba(150, 225, 255, 0.85)", 1.2, 5);
      // bow shackles at both ends
      [A, B].forEach(function (P, n) {
        ctx.beginPath();
        var d = n ? -1 : 1;
        ctx.moveTo(P[0], P[1] - 5); ctx.arc(P[0] + d * 2, P[1], 5, -Math.PI / 2, Math.PI / 2, d < 0);
        ctx.moveTo(P[0], P[1] - 5); ctx.lineTo(P[0], P[1] + 5);
        stroke("rgba(200, 240, 255, 0.95)", 1.4, 6);
      });

      // ---- labels
      if (labels) {
        ctx.font = "600 " + (10.5 / s) + "px Inter, system-ui, sans-serif";
        if ("letterSpacing" in ctx) ctx.letterSpacing = (1.6 / s) + "px";
        ctx.textBaseline = "middle";
        var ropeMid = [midX, (A[1] + 2 * C[1] + B[1]) / 4];
        var lan = [(A[0] + L1[0]) / 2 + 2, Math.max(A[1], L1[1]) + 9];
        var tags = [
          { label: "SAFETY LANYARD", at: lan, lx: lan[0] + 14, ly: -152, align: "right" },
          { label: "BOW SHACKLE", at: B, lx: B[0] - 4, ly: -152, align: "left" },
          { label: "KINETIC ROPE", at: ropeMid, lx: ropeMid[0], ly: 40, align: "center" },
        ];
        tags.forEach(function (tag, n) {
          var tw = ctx.measureText(tag.label).width;
          var down = tag.ly < tag.at[1];
          ctx.strokeStyle = "rgba(76, 201, 255, 0.75)";
          ctx.lineWidth = 1 / s;
          ctx.setLineDash([3 / s, 3 / s]);
          ctx.beginPath();
          ctx.moveTo(tag.lx, tag.ly + (down ? 11 : -11) / s);
          ctx.lineTo(tag.at[0], tag.at[1]);
          ctx.stroke();
          ctx.setLineDash([]);
          var rr = reduceMotion ? 0.3 : (time * 1.2 + n * 0.33) % 1;
          ctx.strokeStyle = "rgba(160, 230, 255, " + (1 - rr) * 0.85 + ")";
          ctx.beginPath(); ctx.arc(tag.at[0], tag.at[1], 3 + rr * 9, 0, Math.PI * 2); ctx.stroke();
          ctx.textAlign = tag.align;
          ctx.fillStyle = "rgba(225, 242, 255, 0.95)";
          ctx.shadowColor = "rgba(76, 201, 255, 0.9)"; ctx.shadowBlur = 8;
          var tx0 = tag.align === "center" ? tag.lx : tag.align === "right" ? tag.lx + 6 / s : tag.lx - 6 / s;
          ctx.fillText(tag.label, tx0, tag.ly);
          ctx.shadowBlur = 0;
          var ux0 = tag.align === "center" ? tag.lx - tw / 2 : tag.align === "right" ? tx0 - tw : tx0;
          ctx.fillStyle = "rgba(76, 201, 255, 0.6)";
          ctx.fillRect(ux0, tag.ly + 9 / s, tw, 1 / s);
        });

        // HUD frame, its name, a blinking light and the rope's stretch (no figures)
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "rgba(76, 201, 255, 0.55)";
        ctx.lineWidth = 1 / s;
        var L = BOX.l, T = BOX.t, R = BOX.r, Bm = BOX.b, cc = 16;
        ctx.beginPath();
        ctx.moveTo(L, T + cc); ctx.lineTo(L, T); ctx.lineTo(L + cc, T);
        ctx.moveTo(R - cc, T); ctx.lineTo(R, T); ctx.lineTo(R, T + cc);
        ctx.moveTo(L, Bm - cc); ctx.lineTo(L, Bm); ctx.lineTo(L + cc, Bm);
        ctx.moveTo(R - cc, Bm); ctx.lineTo(R, Bm); ctx.lineTo(R, Bm - cc);
        ctx.stroke();
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(150, 190, 235, 0.8)";
        ctx.fillText("SNATCH RECOVERY", L + 30, T + 14);
        ctx.fillStyle = "rgba(46, 230, 166, " + (0.4 + 0.6 * (Math.sin(time * 4) > 0 ? 1 : 0.2)) + ")";
        ctx.beginPath(); ctx.arc(L + 18, T + 14, 3.2, 0, Math.PI * 2); ctx.fill();
        var pw = 120, px = L + 30, py = T + 34;
        ctx.font = "600 " + (9 / s) + "px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(150, 190, 235, 0.8)";
        ctx.fillText("ROPE STRETCH", px + pw + 12, py + 2);
        ctx.fillStyle = "rgba(76, 201, 255, 0.18)";
        ctx.fillRect(px, py, pw, 4);
        ctx.fillStyle = "rgba(76, 201, 255, 0.95)";
        ctx.shadowColor = "rgba(76, 201, 255, 1)"; ctx.shadowBlur = 8;
        ctx.fillRect(px, py, pw * tension, 4);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    var running = false, visible = true, raf = 0;
    function loop(t) { frame(t); raf = requestAnimationFrame(loop); }
    function update() {
      var should = !reduceMotion && visible && !document.hidden;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }
    function still() { if (!running) frame(PEAK * 1000); }

    resize();
    still();
    if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); still(); }).observe(header);
    else window.addEventListener("resize", function () { resize(); still(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { resize(); still(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }).observe(header);
    }
    document.addEventListener("visibilitychange", update);
    header.addEventListener("pointermove", function (e) {
      var rect = header.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width - 0.5;
      my = (e.clientY - rect.top) / rect.height - 0.5;
    });
    update();
  }

  function start() { setUpReveal(); setUpHologram(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
