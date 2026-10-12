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
      kind: "standard",
    },
    bushranger: {
      label: "Bushranger 4x4 Gear, snatch strap instructions (the maker's sheet, with the wording the Australian standard requires), via Snowys",
      url: "https://snowys.com.au/Product/ProductAttachments/cbc1afcc-ed75-446f-87dd-04bcba61608e",
      kind: "maker",
    },
    f55: {
      label: "Factor 55, kinetic recovery ropes, bridles and Extreme Duty soft shackles (\"F55 Industrial Kinetic Rope\"), on WARN's literature site",
      url: "https://literature.warn.com/view/108208635/",
      kind: "maker",
    },
    samsonAmsteel: {
      label: "Samson Rope, AmSteel-Blue (12-strand Dyneema SK78) specifications",
      url: "https://www.samsonrope.com/amsteel--blue",
      kind: "maker",
    },
    samsonWarning: {
      label: "Samson Rope, Warning statement (working loads, shock loading, recoil)",
      url: "https://www.samsonrope.com/warning-statement",
      kind: "maker",
    },
    crosby: {
      label: "Crosby (Kito Crosby), G-209 / S-209 Screw Pin Anchor Shackles",
      url: "https://kitocrosby.com/product/crosby-g-209-s-209-screw-pin-anchor-shackles/",
      kind: "maker",
    },
    crosbyRigging: {
      label: "Crosby 2022 catalogue, Applications & Warnings: Shackles, p. 362 (rigging practice)",
      url: "https://www.thecrosbygroup.com/wp-content/uploads/catalog/2022/en-US/362.pdf",
      kind: "maker",
    },
    crosbySideLoad: {
      label: "Crosby 2022 catalogue, Applications & Warnings: Shackles, p. 364 (side loading, included angle)",
      url: "https://www.thecrosbygroup.com/wp-content/uploads/catalog/2022/en-US/364.pdf",
      kind: "maker",
    },
    securetech: {
      label: "SECURETECH (South Africa), Recovery Safety Lanyard",
      url: "https://securetech.co.za/safety/recovery-safety-lanyard",
      kind: "maker",
    },
    warnRigging: {
      label: "WARN Industries, Basic Guide to Winch Rigging",
      url: "https://www.warn.com/basic-guide-to-winch-rigging",
      kind: "maker",
    },
    warnEpic: {
      label: "WARN Industries, Epic Tree Trunk Protector listings (1 in, 2 in and 4 in × 8 ft)",
      url: "https://www.warn.com/products/epic-tree-trunk-protector-1-x-8-92094",
      moreUrls: ["https://www.warn.com/products/epic-rigging-strap-2-x-8-92095", "https://www.warn.com/products/epic-rigging-strap-4-x-8-92096"],
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
   *   strap:   Bushranger's "Stretch Factor: 20%" (the sheet doesn't say at what load)
   *   kinetic: Factor 55's "can stretch up to 30 percent"
   *   static:  Samson AmSteel-Blue, 0.96% at 30% of break, carried on in a straight line
   */
  const gearTypes = [
    { id: "strap", label: "Snatch strap", short: "Strap", stretchRule: "strap-stretch", sizeRule: "strap-mbs", series: "s1" },
    { id: "kinetic", label: "Kinetic rope", short: "Kinetic rope", stretchRule: "kinetic-stretch", sizeRule: "kinetic-size", series: "s3" },
    { id: "static", label: "Winch rope (static)", short: "Winch rope", stretchRule: "static-stretch", sizeRule: null, series: "s4" },
  ];

  // Crosby G-209 screw pin anchor shackles: nominal size, pin, WLL (t).
  // Minimum ultimate strength is 6 x WLL (Crosby's 6:1 design factor).
  const steelShackles = [
    { id: "g209-1/2", size: '1/2"', pinMm: 13, wllT: 2 },
    { id: "g209-5/8", size: '5/8"', pinMm: 16, wllT: 3.25 },
    { id: "g209-3/4", size: '3/4"', pinMm: 19, wllT: 4.75 },
    { id: "g209-7/8", size: '7/8"', pinMm: 22, wllT: 6.5 },
    { id: "g209-1", size: '1"', pinMm: 25, wllT: 8.5 },
  ];

  // Factor 55 Extreme Duty soft shackles, as listed (lb). Factor 55 calls the
  // strength "Maximum breaking strength"; its WLL is that ÷ 5 for every item.
  const softShackles = [
    { id: "f55-3/8", size: '3/8" × 10"', breakLb: 43500, wllLb: 8700 },
    { id: "f55-5/8", size: '5/8" × 18"', breakLb: 102500, wllLb: 20500 },
    { id: "f55-7/8", size: '7/8" × 24"', breakLb: 185000, wllLb: 37000 },
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
  const treeProtectors = [
    { id: "epic-1", label: '1" × 8 ft', breakLb: 7200 },
    { id: "epic-2", label: '2" × 8 ft', breakLb: 14400 },
    { id: "epic-4", label: '4" × 8 ft', breakLb: 30000 },
  ];

  // Factor 55 kinetic rope bridles (lb).
  const bridles = [
    { id: "f55-b-7/8", label: '7/8" × 10 ft', breakLb: 28300, wllLb: 5660 },
    { id: "f55-b-1", label: '1" × 10 ft', breakLb: 33500, wllLb: 6700 },
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
      summary: "Bushranger lists a 20% stretch factor for its 9 m nylon snatch strap. The sheet doesn't say at what load; this page takes it as the stretch at the strap's breaking strength. Your strap's label or sheet beats this figure.",
      quote: "Material: Nylon Webbing · Length: 9 meters (unstretched) · Stretch Factor: 20%",
      sources: ["bushranger"],
      params: { stretch: 0.2 },
      checked: "2026-10-12",
    },
    {
      id: "strap-life",
      category: "maker",
      title: "A snatch strap wears out",
      summary: "Bushranger: inspect the strap before every snatch (frayed material, loose stitching, cuts, abrasions) and discard it if any show; keep count of recoveries, and replace it after 10. Repeated snatches in a short time build up heat and can make it fail. Don't drive over it, keep it off sharp and hot surfaces and away from petroleum products, acids and alkalis.",
      quote: "Check the strap usage chart for number of recoveries the strap has carried out. … Snatch strap life = 10 recoveries",
      sources: ["bushranger"],
      params: { recoveries: 10 },
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
      summary: "Factor 55's double-braided nylon kinetic ropes stretch up to 30% of their length. The page takes 30% as the stretch at the rope's breaking strength. Other makers' ropes differ: read your rope's label.",
      quote: "Factor 55 double braided nylon recovery rope can stretch up to 30 percent of its total length.",
      sources: ["f55"],
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
      category: "standard",
      title: "Get trained",
      summary: "The standard requires every strap's instructions to tell users to consider a nationally recognised four-wheel drive training course, or to contact a four-wheel drive club, for advice on choosing and using the strap. This page is no substitute for that.",
      quote: "state that persons intending to use the strap should consider completing a nationally recognised fourwheel drive training course, or contact a fourwheel drive club for comprehensive advice on the proper selection and use of the strap",
      sources: ["strapStandard", "bushranger"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "recovery-point",
      category: "standard",
      title: "Only rated recovery points",
      summary: "The warning the standard requires on every strap: people have been killed by tow balls and other fittings flying off when straps were attached to them. Attach only to an approved, rated recovery point, and everyone gets out and stands well away.",
      quote: "NEVER attach recovery straps to vehicle fittings such as tow balls, tow bars, tiedown points or tow hooks. ONLY attach recovery straps to an APPROVED recovery point/device that is suitably rated for use with the strap.",
      sources: ["strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- recoil: lanyards and standing clear
    {
      id: "safety-lanyard",
      category: "maker",
      title: "Safety lanyards at both ends",
      summary: "A safety lanyard ties the strap or kinetic rope back to the vehicle, so that if something fails (a shackle, a recovery point, the strap itself) the parts are held instead of flying. SECURETECH, which makes one in South Africa, says to fit one at each end of the recovery. Its page gives no fitting instructions or rating, and we found no other maker that publishes them: fit yours as its own instructions say.",
      quote: "The recovery safety lanyard is attached to the kinetic energy recovery rope or snatch strap, to prevent any parts (e.g. shackle, recovery point, snatch rope or strap) from flying off in the event of a failure during recovery. … Using a Recovery Safety Lanyard (on both ends of the recovery) will prevent the snatch strap or rope from flying back.",
      sources: ["securetech"],
      params: { ends: 2 },
      checked: "2026-10-12",
    },
    {
      id: "stand-clear",
      category: "maker",
      title: "How far to stand away",
      summary: "The standard: everyone gets out of the vehicles and stands as far away as possible, never in the path of the recovering vehicle. Bushranger's sheet puts a minimum on it: at least 1.5 times the strap's length. Its wording is \"upstretched\"; the page uses the stretched length, the longer of the two readings. Samson: never stand in line with a rope under tension.",
      quote: "Stand as far away from the vehicles as possible, (at least 1.5 times the length of the upstretched strap)",
      sources: ["bushranger", "strapStandard", "samsonWarning"],
      params: { factor: 1.5 },
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- shackles
    {
      id: "shackle-ratings",
      category: "maker",
      title: "Steel shackle ratings",
      summary: "Crosby G-209 screw pin anchor (bow) shackles: 1/2\" 2 t, 5/8\" 3.25 t, 3/4\" 4.75 t, 7/8\" 6.5 t, 1\" 8.5 t WLL. Minimum ultimate strength is 6 times the WLL; proof load is 2 times. Other brands differ: read the WLL marked on your shackle.",
      quote: "Minimum Ultimate Strength is 6 times the Working Load Limit.",
      sources: ["crosby"],
      params: { shackles: steelShackles, designFactor: 6, proofFactor: 2 },
      checked: "2026-10-11",
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
      summary: "Bushranger: never use a D or bow shackle to join two or more snatch straps. If a strap breaks, the shackle between them becomes the projectile.",
      quote: "NEVER use a 'D' or Bow shackle to connect two or more snatch straps.",
      sources: ["bushranger"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "soft-shackles",
      category: "maker",
      title: "Soft shackle ratings",
      summary: "Factor 55's Extreme Duty soft shackles: 3/8\" × 10\" 43 500 lb maximum breaking strength (8 700 lb WLL), 5/8\" × 18\" 102 500 lb (20 500 lb), 7/8\" × 24\" 185 000 lb (37 000 lb). Each WLL is the breaking strength ÷ 5. Crosby's side loading chart is for steel shackles; we found no published side loading figure for soft shackles.",
      quote: "3/8\" Extreme Duty Soft Shackle Size: 3/8\" diameter x 10\" length Maximum breaking strength 43,500 lbs. Working load limit 8,700 lbs.",
      sources: ["f55"],
      params: { shackles: softShackles },
      checked: "2026-10-12",
    },
    {
      id: "wll-mbs",
      category: "maker",
      title: "Breaking strength versus WLL",
      summary: "Breaking strength (MBS) is where a new item breaks. WLL (working load limit) is the most the maker rates it for in use: the breaking strength divided by a design factor. Crosby's steel shackles use 6; Factor 55 lists its ropes, bridles and soft shackles at 5; Samson recommends at least 5 for rope. Straps carry only their MBS (the standard asks for no more). Never compare one item's MBS with another's WLL.",
      quote: "Minimum Ultimate Strength is 6 times the Working Load Limit.",
      sources: ["crosby", "f55", "samsonWarning", "strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- tree protectors and bridles
    {
      id: "tree-protector",
      category: "maker",
      title: "Tree trunk protectors",
      summary: "A tree trunk protector is a rigging strap that ties the winch rope to a tree (or another anchor) so the rope never wraps around the trunk. WARN: secure it around the anchor, hook up as low as possible, never wrap the winch rope back onto itself, and make sure the anchor will take the load and the strap won't slip. WARN's Epic protectors list a breaking strength only: 1\" × 8 ft 7 200 lb, 2\" × 8 ft 14 400 lb, 4\" × 8 ft 30 000 lb.",
      quote: "Rigging strap is designed to secure a winch rope to a tree or other suitable anchor point. … Natural anchors include trees, stumps, and rocks — hook the cable as low as possible.",
      sources: ["warnEpic", "warnRigging"],
      params: { protectors: treeProtectors },
      checked: "2026-10-12",
    },
    {
      id: "bridle",
      category: "maker",
      title: "Bridles (equaliser straps)",
      summary: "A bridle joins two recovery points so they share the pull. Bushranger: equaliser straps on the front recovery points spread the load and cut the risk of damage. Factor 55's kinetic rope bridles: 7/8\" × 10 ft 28 300 lb maximum breaking strength (5 660 lb WLL), 1\" × 10 ft 33 500 lb (6 700 lb WLL).",
      quote: "Equaliser strap(s) connected to the vehicle(s) front recovery points will distribute the load, reducing the risk of damage to the vehicle(s).",
      sources: ["bushranger", "f55"],
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
    { id: "speed", title: "How fast to go", text: "No standard or maker found gives a speed for a kinetic recovery. Bushranger says a steady speed in the lowest effective gear. The page shows how the force grows with speed instead." },
    { id: "wet", title: "How much weaker a wet strap is", text: "The standard says a soaked strap is weaker and stretches less, but nobody publishes how much." },
    { id: "lanyard", title: "How to fit a safety lanyard", text: "No maker we found publishes where to tie a safety lanyard to the vehicle, how much slack to leave, or what it should be rated for, and nobody publishes how far a broken strap or flying shackle travels. Fit yours as its own instructions say. The page shows the energy in the strap and the stand-off distance Bushranger gives." },
    { id: "curve", title: "Each strap's stretch curve", text: "Makers give one stretch figure, not how stretch grows with load. The page assumes a straight line from no load to break." },
    { id: "recovery-points", title: "Your recovery points", text: "Recovery point ratings differ by vehicle and maker, and some are labelled with a WLL, some with a breaking strength. Type yours in if you know it; the page can't look it up." },
    { id: "tree-wll", title: "A working load for tree protectors", text: "WARN lists a breaking strength for its tree trunk protectors, not a WLL or design factor. The page shows how many times stronger than the load the strap is, and leaves the judgement to you." },
    { id: "soft-side", title: "Soft shackles loaded from the side", text: "No published side loading figures for soft shackles." },
  ];

  // Ready-made examples. Made-up figures that show how the inputs combine;
  // masses are typical loaded 4x4s, not from a source.
  const scenarios = [
    { id: "sand", label: "Two bakkies in sand", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 10, shackle: "g209-3/4" } },
    { id: "light", label: "Light SUV, heavy rescuer", values: { stuckKg: 1900, recKg: 3500, gear: "kinetic", mbsKg: Math.round(28300 * LB), lengthM: 9.1, speedKmh: 8, shackle: "f55-3/8" } },
    { id: "fast", label: "Too fast: 25 km/h", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 25, shackle: "g209-3/4" } },
    { id: "static", label: "Winch rope used to snatch", values: { stuckKg: 2900, recKg: 3100, gear: "static", mbsKg: 8000, lengthM: 9, speedKmh: 8, shackle: "g209-3/4" } },
    { id: "overland", label: "Heavy overlander", values: { stuckKg: 4400, recKg: 3300, gear: "kinetic", mbsKg: Math.round(33500 * LB), lengthM: 9.1, speedKmh: 6, shackle: "f55-5/8" } },
  ];

  // The defaults the page opens with (also an example, labelled as such).
  const defaults = {
    stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 8000, lengthM: 9, speedKmh: 10,
    shackle: "g209-3/4", sideDeg: 0, pointKg: null,
    bridleDeg: 60, bridle: "f55-b-7/8",
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
