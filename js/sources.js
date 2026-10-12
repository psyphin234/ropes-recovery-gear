/*
 * sources.js: builds sources.html from data.js: every rule with its category,
 * summary, the exact words quoted from the source, and the sources; then the
 * gaps (what nobody publishes) and the full source list. Each rule has an
 * anchor (#rule-id) that the calculator's "Sources:" links point to.
 */
(function () {
  "use strict";

  const D = window.ROPES_DATA;
  const U = window.ROPES_UI;
  const { el, externalLink } = U;

  const GROUPS = [
    { category: "standard", title: "Standards", intro: "Australia's mandatory standard for recovery straps: what every strap and its instructions must say. We found no South African equivalent." },
    { category: "maker", title: "Manufacturers", intro: "Figures and instructions published by strap, rope, shackle and winch makers. SECURETECH (South Africa) is the main source; other makers fill in what it doesn't publish online. Your own gear's label or manual beats these." },
    { category: "calculation", title: "This site's calculations", intro: "Plain physics (statics and energy) applied by this site. Not from a source as such, so they're listed separately and labelled where they're used." },
  ];

  function sourceItem(id) {
    const s = D.sources[id];
    const links = [s.url].concat(s.moreUrls || []).filter(Boolean);
    return el("li", null, links.length ? [externalLink(links[0], s.label), links.slice(1).map((u, i) => [" · ", externalLink(u, "listing " + (i + 2))])] : s.label);
  }

  function renderRule(r) {
    return el(
      "li",
      { class: "source-item", id: r.id, tabindex: "-1" },
      el("h3", null, r.title, U.categoryTag(r.category)),
      el("p", null, r.summary),
      r.quote ? el("blockquote", { class: "source-quote" }, "“" + r.quote + "”") : null,
      el("ul", { class: "source-meta" }, r.sources.map(sourceItem)),
      el("p", { class: "source-meta" }, el("strong", null, "Last checked: "), new Date(r.checked + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }))
    );
  }

  const root = document.getElementById("source-groups");
  GROUPS.forEach((g) => {
    const rules = D.rules.filter((r) => r.category === g.category);
    if (!rules.length) return;
    root.appendChild(
      el("section", { class: "source-group", id: "group-" + g.category },
        el("h2", null, g.title),
        el("p", { class: "muted" }, g.intro),
        el("ul", { class: "source-list" }, rules.map(renderRule)))
    );
  });

  root.appendChild(
    el("section", { class: "source-group", id: "gaps" },
      el("h2", null, "No published figure"),
      el("p", { class: "muted" }, "What the calculator doesn't put a number on, because no engineering source, standard or maker found publishes one."),
      el("ul", { class: "source-list" }, D.gaps.map((g) => el("li", { class: "source-item", id: "gap-" + g.id }, el("h3", null, g.title), el("p", null, g.text)))))
  );

  root.appendChild(
    el("section", { class: "source-group", id: "all-sources" },
      el("h2", null, "Every source"),
      el("ul", { class: "source-list" }, Object.keys(D.sources).map((id) => el("li", { class: "source-item" }, el("ul", { class: "source-meta plain-list" }, sourceItem(id)), U.categoryTag(D.sources[id].kind)))))
  );

  // Arriving from a "Sources:" link: show the rule.
  if (location.hash) {
    const t = document.getElementById(location.hash.slice(1));
    if (t) t.focus();
  }
  document.getElementById("year").textContent = new Date().getFullYear();
})();
