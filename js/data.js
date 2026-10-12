/*
 * data.js: THE data file. Every number the page uses lives here, next to the
 * source it comes from and the words quoted from it. calc.js, app.js and the
 * HTML read these values; they must not hard-code them.
 *
 * Rule categories (drive the tag shown on the sources page):
 *   standard    - a standard or mandatory product-safety rule
 *   maker       - a strap, rope, shackle or winch maker's published figure or instruction
 *   calculation - this site's own physics; says so wherever it is shown
 *
 * Source order (owner's call, 2026-10-12): South African sources first, and
 * SECURETECH above all (the owner has seen its manufacturing and testing and
 * uses its gear). Australian sources only where no South African one publishes
 * anything; other makers likewise fill gaps. Each source carries its `country`.
 *
 * Source policy: engineering, standards, manufacturers' data and published
 * methods only. No forum, club or "everyone says" figures. Where nothing
 * citable exists, add an entry to `gaps` and say so on the page.
 *
 * Masses and forces are in kg (kilogram-force), as straps and shackles are labelled.
 */
(function (root) {
  "use strict";

  const LB = 0.45359237; // kg per lb (exact)

  const sources = {
    strapStandard: {
      label: "Australia: Consumer Goods (Motor Vehicle Recovery Straps) Safety Standard 2017 (F2017L01560), Federal Register of Legislation",
      url: "https://www.legislation.gov.au/F2017L01560/asmade/text",
      country: "AU",
      kind: "standard",
    },
    bushranger: {
      label: "Bushranger 4x4 Gear, snatch strap instructions (the maker's sheet, with the wording the Australian standard requires), via Snowys",
      url: "https://snowys.com.au/Product/ProductAttachments/cbc1afcc-ed75-446f-87dd-04bcba61608e",
      country: "AU",
      kind: "maker",
    },
    f55: {
      label: "Factor 55, kinetic recovery ropes, bridles and Extreme Duty soft shackles (\"F55 Industrial Kinetic Rope\"), on WARN's literature site",
      url: "https://literature.warn.com/view/108208635/",
      country: "US",
      kind: "maker",
    },
    samsonAmsteel: {
      label: "Samson Rope, AmSteel-Blue (12-strand Dyneema SK78) specifications",
      url: "https://www.samsonrope.com/amsteel--blue",
      country: "US",
      kind: "maker",
    },
    samsonWarning: {
      label: "Samson Rope, Warning statement (working loads, shock loading, recoil)",
      url: "https://www.samsonrope.com/warning-statement",
      country: "US",
      kind: "maker",
    },
    crosby: {
      label: "Crosby (Kito Crosby), G-209 / S-209 Screw Pin Anchor Shackles",
      url: "https://kitocrosby.com/product/crosby-g-209-s-209-screw-pin-anchor-shackles/",
      country: "US",
      kind: "maker",
    },
    crosbyRigging: {
      label: "Crosby 2022 catalogue, Applications & Warnings: Shackles, p. 362 (rigging practice)",
      url: "https://www.thecrosbygroup.com/wp-content/uploads/catalog/2022/en-US/362.pdf",
      country: "US",
      kind: "maker",
    },
    crosbySideLoad: {
      label: "Crosby 2022 catalogue, Applications & Warnings: Shackles, p. 364 (side loading, included angle)",
      url: "https://www.thecrosbygroup.com/wp-content/uploads/catalog/2022/en-US/364.pdf",
      country: "US",
      kind: "maker",
    },
    stGuide: {
      label: "SECURETECH (South Africa), Safety & Downloads: recovery and safety guidelines",
      url: "https://securetech.co.za/safety-downloads/",
      country: "ZA",
      kind: "maker",
    },
    stHandbook: {
      label: "SECURETECH, Recovery Handbook (request page)",
      url: "https://securetech.co.za/blog/2017/february/16/securetech-recovery-handbook",
      country: "ZA",
      kind: "maker",
    },
    stKineticStrap: {
      label: "SECURETECH, Kinetic Strap",
      url: "https://securetech.co.za/product/kinetic-strap/",
      country: "ZA",
      kind: "maker",
    },
    stKineticRope: {
      label: "SECURETECH, Kinetic rope",
      url: "https://securetech.co.za/product/kinetic-rope/",
      country: "ZA",
      kind: "maker",
    },
    stShackle: {
      label: "SECURETECH, Rated Alloy Recovery Bow Shackle",
      url: "https://securetech.co.za/product/rated-alloy-recovery-bow-shackle-copy/",
      country: "ZA",
      kind: "maker",
    },
    stLanyard: {
      label: "SECURETECH, Recovery Safety Lanyard",
      url: "https://securetech.co.za/product/recovery-safety-lanyard/",
      country: "ZA",
      kind: "maker",
    },
    stBridle: {
      label: "SECURETECH, Recovery Bridle",
      url: "https://securetech.co.za/product/recovery-bridle/",
      country: "ZA",
      kind: "maker",
    },
    stTree: {
      label: "SECURETECH, Tree Trunk Protector",
      url: "https://securetech.co.za/product/tree-trunk-protector/",
      country: "ZA",
      kind: "maker",
    },
    warnRigging: {
      label: "WARN Industries, Basic Guide to Winch Rigging",
      url: "https://www.warn.com/basic-guide-to-winch-rigging",
      country: "US",
      kind: "maker",
    },
    warnEpic: {
      label: "WARN Industries, Epic Tree Trunk Protector listings (25, 51 and 102 mm wide, 2.4 m long)",
      url: "https://www.warn.com/products/epic-tree-trunk-protector-1-x-8-92094",
      moreUrls: ["https://www.warn.com/products/epic-rigging-strap-2-x-8-92095", "https://www.warn.com/products/epic-rigging-strap-4-x-8-92096"],
      country: "US",
      kind: "maker",
    },
    physics: {
      label: "Physics (statics and energy): this site's own calculation",
      url: null,
      kind: "calculation",
    },
  };

  /*
   * The three things that can be on the end of the vehicles. `stretch` is the
   * stretch at the strap's breaking strength used by the spring model.
   *   strap:   SECURETECH 20-30%, taken at 20% (the low end gives the higher force)
   *   kinetic: SECURETECH 30-40%, taken at 30% (likewise)
   *   static:  Samson AmSteel-Blue, 0.96% at 30% of break, carried on in a straight line
   */
  const gearTypes = [
    { id: "strap", label: "Snatch strap", short: "Strap", stretchRule: "strap-stretch", sizeRule: "strap-mbs", series: "s1" },
    { id: "kinetic", label: "Kinetic rope", short: "Kinetic rope", stretchRule: "kinetic-stretch", sizeRule: "kinetic-size", series: "s3" },
    { id: "static", label: "Winch rope (static)", short: "Winch rope", stretchRule: "static-stretch", sizeRule: null, series: "s4" },
  ];

  // SECURETECH rated alloy recovery bow shackles (US Fed Spec RR-C-271b): the
  // WLLs it lists (t). Crosby's G-209 bow shackles come in the same WLLs.
  const steelShackles = [
    { id: "bow-2", size: "2 t", wllT: 2 },
    { id: "bow-3.25", size: "3.25 t", wllT: 3.25 },
    { id: "bow-4.75", size: "4.75 t", wllT: 4.75 },
    { id: "bow-6.5", size: "6.5 t", wllT: 6.5 },
    { id: "bow-8.5", size: "8.5 t", wllT: 8.5 },
  ];

  // Factor 55 Extreme Duty soft shackles, as listed in lb (shown in kg). Factor 55
  // calls the strength "Maximum breaking strength"; its WLL is that ÷ 5 for every item.
  // SECURETECH's own soft shackle page lists no strength of its own.
  const softShackles = [
    { id: "f55-3/8", size: "9.5 × 254 mm", breakLb: 43500, wllLb: 8700 },
    { id: "f55-5/8", size: "16 × 457 mm", breakLb: 102500, wllLb: 20500 },
    { id: "f55-7/8", size: "22 × 610 mm", breakLb: 185000, wllLb: 37000 },
  ];

  // Crosby's side loading reduction chart (screw pin and bolt type shackles only):
  // up to `toDeg` from in-line, the shackle keeps `keep` of its rated WLL.
  const sideLoad = [
    { toDeg: 10, keep: 1 },
    { toDeg: 20, keep: 0.85 },
    { toDeg: 30, keep: 0.75 },
    { toDeg: 45, keep: 0.7 },
    { toDeg: 55, keep: 0.6 },
    { toDeg: 70, keep: 0.55 },
    { toDeg: 90, keep: 0.5 },
  ];

  // WARN Epic tree trunk protectors: breaking strength as listed (lb). No WLL listed.
  // (SECURETECH publishes its protector's size and make-up online, not its strength.)
  const treeProtectors = [
    { id: "epic-1", label: "25 mm × 2.4 m", breakLb: 7200 },
    { id: "epic-2", label: "51 mm × 2.4 m", breakLb: 14400 },
    { id: "epic-4", label: "102 mm × 2.4 m", breakLb: 30000 },
  ];

  // SECURETECH recovery bridles, from its table: maximum vehicle mass, minimum
  // breaking strength (kg), overall length (m).
  const bridles = [
    { id: "st-b-10.5", label: "10.5 t × 3.5 m", breakKg: 10500, maxVehicleKg: 2625, lengthM: 3.5 },
    { id: "st-b-16", label: "16 t × 5 m", breakKg: 16000, maxVehicleKg: 4000, lengthM: 5 },
  ];

  const rules = [
    // ---------------------------------------------------------------- straps
    {
      id: "strap-mbs",
      category: "standard",
      title: "Snatch strap strength for the vehicles",
      summary: "Australia's mandatory standard for recovery straps (\"commonly called a snatch strap\") requires every strap to carry its minimum breaking strength (MBS) and the advice that the MBS should be 2 to 3 times the GVM of any vehicle it is used with, suited to the lighter of the two vehicles. GVM is the maximum loaded mass from the compliance plate, registration papers or handbook. We found no South African equivalent.",
      quote: "a recommendation that the minimum breaking strength of the strap should be between 2 and 3 times the gross vehicle mass (GVM) of any vehicle it is used with; advice that the strap must be suited to the gross vehicle mass (GVM) of the lighter of the 2 vehicles used in the recovery process.",
      sources: ["strapStandard", "bushranger"],
      params: { min: 2, max: 3 },
      checked: "2026-10-12",
    },
    {
      id: "strap-stretch",
      category: "maker",
      title: "How far a snatch strap stretches",
      summary: "SECURETECH's kinetic straps (polyamide webbing, made and tested to EN 1492-2 and SANS 94-2) stretch 20–30%, depending on several factors, and SECURETECH warns that the top of the quoted stretch is also where the strap can fail. The page takes 20%, the low end: a strap that stretches less stops the recovery vehicle harder, so this gives the higher force. Bushranger lists 20% for its strap too. Your strap's label beats this figure.",
      quote: "Elongation is between 20-30% (multiple factors influence this) … It is important that you should understand that the maximum percentage of stretch quoted i.e. 30% is also the point at which a failure could occur!",
      sources: ["stKineticStrap", "stGuide", "bushranger"],
      params: { stretch: 0.2 },
      checked: "2026-10-12",
    },
    {
      id: "strap-life",
      category: "maker",
      title: "Rest a strap between snatches",
      summary: "SECURETECH: after one hard snatch a strap has used its kinetic capability, and needs about eight hours for every 10% of stretch to creep back: 24 hours to recover from 30%. A strap that no longer returns to its labelled length has lost its kinetic capability and can only be used as a pull strap. Inspect gear after use, don't knot straps or ropes, keep them off hot exhausts, and send damaged gear back for inspection. Bushranger also says to count recoveries and replace its strap after 10.",
      quote: "after one rigorous snatch, the kinetic capability has been utilised and the strap requires eight hours for every 10% of stretch to 'creep back' or be restored to its original length and kinetic capability, thus, to get back to 30% (full) extension requires 24 hours of rest.",
      sources: ["stGuide", "bushranger"],
      params: { hoursPer10Pct: 8, recoveries: 10 },
      checked: "2026-10-12",
    },
    {
      id: "strap-wet",
      category: "standard",
      title: "A wet strap is weaker and stretches less",
      summary: "The standard requires every strap's instructions to say that its strength and stretch drop when it is soaked. Neither the standard nor the makers here say by how much, so the page can't put a number on it.",
      quote: "state that the strap's strength and stretch are reduced when the strap is saturated with water",
      sources: ["strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- kinetic ropes
    {
      id: "kinetic-stretch",
      category: "maker",
      title: "How far a kinetic rope stretches",
      summary: "SECURETECH's kinetic ropes are loosely plaited, high-elongation polyamide, from 8 to 16 t commercially; its guidelines give 30–40% stretch (its product page says 35–40%). The page takes 30%, the low end, for the higher force. Factor 55 lists up to 30% for its ropes. Read your rope's label.",
      quote: "the rope is an ultrahigh elongation, high tenacity, plaited polyamide rope and can elongate 30-40%.",
      sources: ["stGuide", "stKineticRope", "f55"],
      params: { stretch: 0.3 },
      checked: "2026-10-12",
    },
    {
      id: "kinetic-size",
      category: "maker",
      title: "Kinetic rope strength for the vehicles",
      summary: "Factor 55: a kinetic rope's breaking strength should be 4 to 6 times the GVM (GVWR) of typical SUVs and trucks; for heavy vehicles (Unimogs, EarthRoamers, heavier military trucks) 2 to 4 times may be acceptable. Like a strap, it goes by the lighter of the two vehicles. Too small and it may break; too large and it won't stretch enough. Note this is a different ratio from the strap standard's 2 to 3 times: follow the label on what you own.",
      quote: "A properly sized rope for typical SUVs and trucks is one that has a 4:1 to 6:1 minimum breaking strength to GVWR ratio. … The KERR must be suited to the GVWR of the lighter of the two vehicles used in the recovery process. … If too large and heavy, the rope won't stretch enough, reducing the maximum kinetic energy assist.",
      sources: ["f55"],
      params: { min: 4, max: 6, heavyMin: 2, heavyMax: 4 },
      checked: "2026-10-12",
    },
    {
      id: "static-stretch",
      category: "maker",
      title: "How little a winch rope stretches",
      summary: "Samson lists AmSteel-Blue (a 12-strand Dyneema winch rope) stretching 0.46% at 10% of its breaking strength, 0.70% at 20% and 0.96% at 30%. Carried on in a straight line from the 30% figure, that's about 3.2% at break: a tenth of a kinetic rope's stretch. Samson gives no figure past 30%. This page uses it to show why a winch rope isn't for snatching; Samson also warns that working loads don't apply once a rope has been shock loaded.",
      quote: "Elastic Elongation: 10% 0.46% · 20% 0.70% · 30% 0.96% … Working loads, as described herein, are not applicable when rope has been subjected to shock loading.",
      sources: ["samsonAmsteel", "samsonWarning"],
      params: { atFraction: 0.3, elongation: 0.0096, stretch: 0.0096 / 0.3 },
      checked: "2026-10-12",
    },
    {
      id: "kinetic-model",
      category: "calculation",
      title: "Kinetic recovery: the peak force",
      summary: "A snatch strap or kinetic rope stores the moving vehicle's energy (½ × mass × speed²) as stretch, then gives it back as pull. Treating it as a spring that reaches its breaking strength at its rated stretch (stiffness = breaking strength ÷ (length × stretch)), the peak force is speed × √(mass × stiffness). It rises in step with the speed: twice the speed, twice the force. The page holds the stuck vehicle still, which gives the highest force; once it moves, the force is lower. Real straps aren't straight-line springs, so treat this as a physics estimate, not a measurement.",
      quote: "",
      sources: ["physics"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "never-exceed",
      category: "maker",
      title: "The weakest part sets the limit",
      summary: "Bushranger's instructions: never go over the strap's MBS, the recovery point's rating, or the WLL of the shackles. The page compares the peak force with all three. Attach only to a rated recovery point (the standard's warning); never to a tow ball, tow bar, tie-down point or tow hook.",
      quote: "Never exceed the minimum breaking strength (MBS) of the strap, the vehicle recovery point or the working load limit (WLL) of the shackles.",
      sources: ["bushranger", "strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "training",
      category: "maker",
      title: "Get trained",
      summary: "SECURETECH: besides reading its Recovery Handbook, attend a professional 4x4 recovery course; SECURETECH runs courses itself. This page is no substitute for that.",
      quote: "In addition to reading the SECURETECH Recovery Handbook you should attend a professional 4×4 recovery course (contact us for details on our next course.)",
      sources: ["stHandbook"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "recovery-point",
      category: "maker",
      title: "Only rated recovery points",
      summary: "SECURETECH: a standard tow bar or tow ball is unsuitable for recovery; every vehicle in a recovery needs suitable recovery points front and rear, drawing off the chassis. The warning the Australian standard puts on every strap: people have been killed by tow balls and other fittings flying off when straps were attached to them.",
      quote: "A standard tow bar or tow ball is unsuitable as an attachment point for recovery. Ensure that you have suitable recovery points to the front and rear of all vehicles involved in a recovery.",
      sources: ["stGuide", "strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "securetech-basics",
      category: "maker",
      title: "How SECURETECH says to do it",
      summary: "SECURETECH's guidelines for every recovery: always recover in a straight line; don't use damaged straps or ropes, and don't knot them; never step over a tensioned cable, rope or strap; dig out or pack the ruts first where you can. For a snatch: lay the strap back over itself in an S (about half its length), take off in first gear low range in a straight line, and stop before the strap stops you. Kinetic straps and ropes are the last line of defence, and must never anchor a winch or extend a winch cable. SECURETECH adds that these are guidelines only: with so many variables it can't guarantee the outcome.",
      quote: "The recovery vehicle takes off normally in 1st gear, low range in a straight line away from the stuck vehicle and stretches the strap to its fullest. Practice will allow a good driver to stop before the strap stops him … Kinetic straps and ropes should never be used to anchor a winching operation or extend a winch cable.",
      sources: ["stGuide"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- recoil: lanyards and standing clear
    {
      id: "safety-lanyard",
      category: "maker",
      title: "Safety lanyards at both ends",
      summary: "A safety lanyard ties the strap or kinetic rope back to the vehicle, so that if something fails (a shackle, a recovery point, the strap itself) the parts are held instead of flying. SECURETECH's lanyard is low-stretch (5%) high-tenacity polyester webbing, tied to the vehicle and over the strap, rope or cable with two ring hitch knots, one at each end of the recovery. SECURETECH shows one fused to a shackle by the force of a failed recovery: it stopped the shackle whipping back.",
      quote: "it is made of low elongation (5%) high tenacity polyester webbing and is attached to the vehicle and over the strap, rope or cable by two ring hitch knots … Using a Recovery Safety Lanyard (on both ends of the recovery) will prevent the snatch strap or rope from flying back.",
      sources: ["stGuide", "stLanyard"],
      params: { ends: 2, stretch: 0.05 },
      checked: "2026-10-12",
    },
    {
      id: "stand-clear",
      category: "maker",
      title: "How far to stand away",
      summary: "SECURETECH: keep everyone well clear of ropes, straps and cables in case they recoil when something fails, as a rule about twice the length of the strap, rope or cable in use. The page takes twice the stretched length, the longer reading. (Bushranger's sheet says at least 1.5 times.) Everyone gets out of the vehicles first, and nobody stands in line with the strap or in the recovery vehicle's path.",
      quote: "Keep participants and observers well clear of ropes, straps or cables in case of recoil due to a failure (as a rule generally twice the length of the cable, strap or rope utilised).",
      sources: ["stGuide", "bushranger", "samsonWarning"],
      params: { factor: 2 },
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- shackles
    {
      id: "shackle-ratings",
      category: "maker",
      title: "Rated bow shackles",
      summary: "SECURETECH: use only rated alloy recovery bow shackles (US Fed Spec RR-C-271b), never commercial (unrated) D shackles, with a WLL of at least 2 000 kg; a range from 2 to 6.5 t covers most recoveries. Sizes listed: 2, 3.25, 4.75, 6.5 and 8.5 t WLL. A rated shackle has a thicker pin than its body, and the WLL and batch number are embossed on it. Hand-tighten the pin, then back it off a little so it opens after the pull. Crosby's G-209 bow shackles come in the same WLLs and break at no less than 6 times the WLL.",
      quote: "Use rated alloy recovery bow shackles with a WORK LOAD LIMIT of not less than 2000kg to attach the strap, cable or rope used. ( Fed Spec RR-C-271b) On a rated shackle the pin and body will be of a different diameter (pin is generally thicker). The body will be embossed with the Work Load Limit (WLL) and batch no.",
      sources: ["stGuide", "stShackle", "crosby"],
      params: { shackles: steelShackles, minWllKg: 2000, crosbyDesignFactor: 6 },
      checked: "2026-10-12",
    },
    {
      id: "shackle-side-load",
      category: "maker",
      title: "Shackles loaded from the side",
      summary: "Crosby's chart for screw pin and bolt type shackles: pulled 0–10° off in-line a shackle keeps 100% of its WLL; 11–20° 85%; 21–30° 75%; 31–45° 70%; 46–55° 60%; 56–70° 55%; 71–90° 50%. Round pin shackles must not be side loaded at all. Centre the load in the bow, and don't put more than one sling leg on the pin.",
      quote: "Applied load should be centered in the bow to prevent side loading. Multiple sling legs should not be applied to the pin. If side loaded, the rated load shall be reduced according to Table 1",
      sources: ["crosbySideLoad", "crosbyRigging"],
      params: { bands: sideLoad },
      checked: "2026-10-12",
    },
    {
      id: "shackle-included-angle",
      category: "maker",
      title: "Two legs in one shackle",
      summary: "Crosby: two legs in a screw pin or bolt type shackle's bow, symmetrically loaded, can take the full WLL up to a 120° angle between them. Never go wider. Crosby also says to make the shackle big enough not to pinch a synthetic sling.",
      quote: "Never exceed 120° included angle. … Shackles symmetrically loaded with two leg slings having a maximum included angle of 120° can be utilized to full Working Load Limit.",
      sources: ["crosbySideLoad", "crosbyRigging"],
      params: { maxDeg: 120 },
      checked: "2026-10-12",
    },
    {
      id: "no-shackle-join",
      category: "maker",
      title: "Never join straps with a shackle",
      summary: "SECURETECH: join only straps and ropes of the same rating and function, with a recovery link between the two eyes so they can't melt onto each other; never with a shackle, which becomes a potentially deadly missile if something fails. Bushranger says the same.",
      quote: "it is not safe practice to join straps or ropes with a shackle as should a failure occur the shackle will become a potentially deadly missile!",
      sources: ["stGuide", "bushranger"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "soft-shackles",
      category: "maker",
      title: "Soft shackle ratings",
      summary: "SECURETECH doesn't list a strength for its soft shackle online, so the page uses Factor 55's Extreme Duty soft shackles: 9.5 mm × 254 mm, 19.7 t maximum breaking strength (3.95 t WLL); 16 mm × 457 mm, 46.5 t (9.3 t); 22 mm × 610 mm, 83.9 t (16.8 t). Each WLL is the breaking strength ÷ 5. SECURETECH: no bow or D shackles in a soft-shackle set-up, and watch for sharp edges on recovery eyes. Crosby's side loading chart is for steel shackles; we found no published side loading figure for soft shackles.",
      quote: "3/8\" Extreme Duty Soft Shackle Size: 3/8\" diameter x 10\" length Maximum breaking strength 43,500 lbs. Working load limit 8,700 lbs. (Factor 55, in its own units)",
      sources: ["f55", "stGuide"],
      params: { shackles: softShackles },
      checked: "2026-10-12",
    },
    {
      id: "wll-mbs",
      category: "maker",
      title: "Breaking strength versus WLL",
      summary: "Breaking strength (MBS) is where a new item breaks. WLL (working load limit) is the most the maker rates it for in use: the breaking strength divided by a design factor. SECURETECH embosses the WLL on its rated bow shackles and rates its straps and bridles by minimum breaking strength. Crosby's steel shackles use a factor of 6; Factor 55 lists its soft shackles at 5; Samson recommends at least 5 for rope. Never compare one item's MBS with another's WLL.",
      quote: "The body will be embossed with the Work Load Limit (WLL) and batch no.",
      sources: ["stGuide", "crosby", "f55", "samsonWarning"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- tree protectors and bridles
    {
      id: "tree-protector",
      category: "maker",
      title: "Tree trunk protectors",
      summary: "A tree trunk protector protects the bark and gives the winch a secure anchor. SECURETECH: it should be 100 mm wide and 2–4 m long, close to the base of the tree, and you winch in a straight line so it doesn't chafe and ring-bark the tree. SECURETECH's is low-stretch (5%) polyester webbing, made and tested to EN 1492-1 and SANS 94-1; its strength isn't published online. For strengths, the page uses WARN's Epic protectors (breaking strength only): 25 mm × 2.4 m 3.27 t, 51 mm × 2.4 m 6.53 t, 102 mm × 2.4 m 13.6 t. Never wrap the winch rope back onto itself (WARN and SECURETECH).",
      quote: "Your tree trunk protector should be 100 mm wide, and 2—4 metres long. Winch in a straight line so as not to chafe and ring bark trees. … The tree protector should be positioned close to the base of the tree.",
      sources: ["stGuide", "stTree", "warnEpic", "warnRigging"],
      params: { protectors: treeProtectors, widthMm: 100, minLengthM: 2, maxLengthM: 4 },
      checked: "2026-10-12",
    },
    {
      id: "bridle",
      category: "maker",
      title: "Bridles",
      summary: "A bridle balances the pull across two recovery points and eases the stress on each. SECURETECH's are low-stretch (5%) polyester webbing, made and tested to EN 1492-2 and SANS 94-2: 10 500 kg minimum breaking strength and 3.5 m long for vehicles up to 2 625 kg, 16 000 kg and 5 m for vehicles up to 4 000 kg (4 times the vehicle mass in both). SECURETECH says the safe way is to use a bridle with two lanyards as well.",
      quote: "The bridle is used to balance or spread the load across two anchor points when recovering a stuck vehicle … The safe option is to use the bridle in conjunction with two lanyards as well.",
      sources: ["stGuide", "stBridle"],
      params: { bridles: bridles },
      checked: "2026-10-12",
    },
    {
      id: "leg-load",
      category: "calculation",
      title: "Load in each leg",
      summary: "When two legs share a pull (a bridle across two recovery points, or a tree protector's two ends in one shackle), each leg carries the pull ÷ (2 × cos(half the angle between them)). Side by side, half each; at 90°, 71% each; at 120°, the full pull in each leg, which is where Crosby stops.",
      quote: "",
      sources: ["physics"],
      params: {},
      checked: "2026-10-12",
    },
  ];

  // Things nobody citable publishes: shown as "no published figure", never guessed.
  const gaps = [
    { id: "speed", title: "How fast to go", text: "No standard or maker found gives a speed for a kinetic recovery. SECURETECH says first gear, low range, in a straight line, stopping before the strap stops you; Bushranger says a steady speed in the lowest effective gear. The page shows how the force grows with speed instead." },
    { id: "wet", title: "How much weaker a wet strap is", text: "The standard says a soaked strap is weaker and stretches less, but nobody publishes how much." },
    { id: "lanyard", title: "A rating for safety lanyards", text: "SECURETECH publishes how to tie its lanyard (two ring hitch knots, to the vehicle and over the strap) but not its breaking strength or how much slack to leave, and nobody publishes how far a broken strap or flying shackle travels. The page shows the energy in the strap and SECURETECH's stand-off distance." },
    { id: "curve", title: "Each strap's stretch curve", text: "Makers give one stretch figure, not how stretch grows with load. The page assumes a straight line from no load to break." },
    { id: "recovery-points", title: "Your recovery points", text: "Recovery point ratings differ by vehicle and maker, and some are labelled with a WLL, some with a breaking strength. Type yours in if you know it; the page can't look it up." },
    { id: "tree-wll", title: "A working load for tree protectors", text: "SECURETECH doesn't publish its protector's strength online, and WARN lists a breaking strength, not a WLL or design factor. The page shows how many times stronger than the load the strap is, and leaves the judgement to you." },
    { id: "soft-side", title: "Soft shackles loaded from the side", text: "No published side loading figures for soft shackles." },
  ];

  // Ready-made examples. Made-up figures that show how the inputs combine;
  // masses are typical loaded 4x4s, not from a source.
  const scenarios = [
    { id: "sand", label: "Two bakkies in sand", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 10, shackle: "bow-4.75" } },
    { id: "light", label: "Light SUV, heavy rescuer", values: { stuckKg: 1900, recKg: 3500, gear: "kinetic", mbsKg: Math.round(28300 * LB), lengthM: 9.1, speedKmh: 8, shackle: "f55-3/8" } },
    { id: "fast", label: "Too fast: 25 km/h", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 25, shackle: "bow-4.75" } },
    { id: "static", label: "Winch rope used to snatch", values: { stuckKg: 2900, recKg: 3100, gear: "static", mbsKg: 8000, lengthM: 9, speedKmh: 8, shackle: "bow-4.75" } },
    { id: "overland", label: "Heavy overlander", values: { stuckKg: 4400, recKg: 3300, gear: "kinetic", mbsKg: Math.round(33500 * LB), lengthM: 9.1, speedKmh: 6, shackle: "f55-5/8" } },
  ];

  // The defaults the page opens with (also an example, labelled as such).
  const defaults = {
    stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 10,
    shackle: "bow-4.75", sideDeg: 0, pointKg: null,
    bridleDeg: 60, bridle: "st-b-16",
    treePullKg: 4310, treeDeg: 30, protector: "epic-4",
  };

  root.ROPES_DATA = {
    sources,
    gearTypes,
    steelShackles,
    softShackles,
    sideLoad,
    treeProtectors,
    bridles,
    rules,
    gaps,
    scenarios,
    defaults,
    units: { lbToKg: LB, g: 9.80665 },
    speedMaxKmh: 30,
    rule(id) {
      const r = rules.find((x) => x.id === id);
      if (!r) throw new Error("Unknown rule " + id);
      return r;
    },
  };
})(window);
