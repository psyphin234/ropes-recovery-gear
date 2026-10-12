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
      label: "SECURETECH Recovery Handbook (© 2016, 18-page PDF; SECURETECH sends it on request)",
      url: "https://securetech.co.za/blog/2017/february/16/securetech-recovery-handbook",
      country: "ZA",
      kind: "maker",
    },
    stBuyers: {
      label: "SECURETECH Recovery Kit Buyers Guide, v2 (PDF from SECURETECH)",
      url: null,
      country: "ZA",
      kind: "maker",
    },
    stShackleGuide: {
      label: "SECURETECH / Special Industrial Supplies, User Instructions: Shackles (PDF from SECURETECH)",
      url: null,
      country: "ZA",
      kind: "maker",
    },
    stSoftGuide: {
      label: "SECURETECH Soft Shackle Users Guide (PDF from SECURETECH)",
      url: null,
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
   *   strap:   SECURETECH 20-25% (handbook) / 20-30% (website), taken at 20% (the low end gives the higher force)
   *   kinetic: SECURETECH 30-40%, taken at 30% (likewise)
   *   static:  Samson AmSteel-Blue, 0.96% at 30% of break, carried on in a straight line
   */
  const gearTypes = [
    { id: "strap", label: "Snatch strap", short: "Strap", stretchRule: "strap-stretch", sizeRule: "securetech-sizing", series: "s1" },
    { id: "kinetic", label: "Kinetic rope", short: "Kinetic rope", stretchRule: "kinetic-stretch", sizeRule: "securetech-sizing", series: "s3" },
    { id: "static", label: "Winch rope (static)", short: "Winch rope", stretchRule: "static-stretch", sizeRule: null, series: "s4" },
  ];

  // SECURETECH rated alloy recovery bow shackles (US Fed Spec RR-C-271b, factor
  // of safety 6:1): the WLLs it lists (t).
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
      id: "securetech-sizing",
      category: "maker",
      title: "Strap or rope strength for the vehicle",
      summary: "SECURETECH: buy all recovery equipment relative to the vehicle's weight (its GVM: a small 4x4 about 1 500 kg, a double cab about 2 900 kg, a large station wagon about 3 350 kg, trailers not included). The noted factors of safety are 2:1, 3:1 and 4:1, and SECURETECH recommends 4:1. Its handbook says the strap or rope should be rated according to the mass of the stuck vehicle. A good strap carries a stitched-in label with its maker, specification, material, strength, length, its work load limit (the laden vehicle mass) and its factor of safety or minimum breaking strength; don't use an unlabelled strap.",
      quote: "All equipment should be purchased relative to the weight of your vehicle. … The noted factors of safety are 2:1, 3:1 and 4:1. We recommend a factor of safety of 4:1. … The rope or strap utilised should be rated according to the mass of the stuck vehicle.",
      sources: ["stBuyers", "stHandbook"],
      params: { min: 2, recommended: 4, noted: [2, 3, 4] },
      checked: "2026-10-12",
    },
    {
      id: "strap-stretch",
      category: "maker",
      title: "How far a snatch strap stretches",
      summary: "SECURETECH's handbook: most kinetic straps (high-elongation polyamide) stretch 20–25% of their length; its website says 20–30%. It warns that maximum elongation is also the point where a strap can fail. The page takes 20%, the low end: a strap that stretches less stops the recovery vehicle harder, so this gives the higher force. Your strap's label beats this figure.",
      quote: "most kinetic straps elongate between 20 – 25% of their original length … It is important that you should understand that maximum elongation is also the point where a failure could occur!",
      sources: ["stHandbook", "stKineticStrap"],
      params: { stretch: 0.2 },
      checked: "2026-10-12",
    },
    {
      id: "strap-life",
      category: "maker",
      title: "Look after the strap, and rest it",
      summary: "SECURETECH: after one snatch a strap has used its kinetic capability and needs about eight hours for every 10% of stretch to creep back, 24 hours for 25%; a kinetic rope should be piled loosely, not packed away, to recover. A strap that no longer returns to its original length has lost its kinetic capability (use it only as a pull strap in an emergency). 10% damage to a strap costs about half its rated capacity; never use a damaged, knotted or unlabelled strap. Wash out sand and mud, dry it in a cool place out of the sun, keep it off hot exhausts, and inspect it after every use.",
      quote: "As a rule, after one snatch, the kinetic capability has been used up and the strap requires eight hours for every 10% of stretch to creep back or be restored to its original capability, 25% requires 24 hours rest. … It is important to note that 10% of damage to a strap equates to a 50% loss of its rated capacity.",
      sources: ["stHandbook", "stGuide"],
      params: { hoursPer10Pct: 8, damageFraction: 0.1, capacityLost: 0.5 },
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
      summary: "SECURETECH: its kinetic ropes are ultra-high-elongation, plaited polyamide and stretch 30–40% of their length (its product page says 35–40%). The page takes 30%, the low end, for the higher force. Read your rope's label.",
      quote: "The rope is an ultra-high elongation, high tenacity, plaited polyamide rope and can elongate 30 – 40% of its length.",
      sources: ["stHandbook", "stKineticRope"],
      params: { stretch: 0.3 },
      checked: "2026-10-12",
    },
    {
      id: "snatch-speed",
      category: "maker",
      title: "How fast, and how to drive it",
      summary: "SECURETECH's handbook suggests 18 km/h for two vehicles of similar mass. Lay the strap out in an S (about 2 m of slack), move off in first gear, low range, straight away from the stuck vehicle, and try to stop before the strap stops you: that uses the stretch without shock loading the strap or the recovery points. If the vehicle is still stuck, winch it. The page's peak force holds the stuck vehicle still, the hardest case, so at SECURETECH's speed it can show more force than a real snatch would.",
      quote: "A speed of 18Kph is suggested in the case of two vehicles of similar mass. … Try to stop your vehicle before the strap stops you, this allows maximum utilisation of the kinetic energy without shock loading the strap or rope and overloading the vehicle recovery points.",
      sources: ["stHandbook"],
      params: { suggestedKmh: 18 },
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
      summary: "SECURETECH: select the correct WLL and allow for the full load that may be imposed. The page compares the peak force with the strap's breaking strength, the shackle's WLL and the recovery points' rating if you type it. (Bushranger, an Australian maker, says the same in so many words: never exceed any of the three.)",
      quote: "Select the correct WLL (Work Load Limit) … Allow for the full load that may be imposed",
      sources: ["stShackleGuide", "bushranger"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "training",
      category: "maker",
      title: "Get trained",
      summary: "SECURETECH: attend a professional recovery course and always follow the maker's instructions for your equipment and vehicle; SECURETECH runs 4x4 recovery courses itself. This page is no substitute for that.",
      quote: "You should attend a professional recovery course and always follow the manufacturer's instructions with regards to your equipment and vehicle.",
      sources: ["stHandbook", "stBuyers"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "recovery-point",
      category: "maker",
      title: "Only rated recovery points",
      summary: "SECURETECH: a tow bar or tow ball is unsuitable as a recovery point (tow balls are designed to break under extreme loads); every vehicle in a recovery needs professionally fitted recovery points front and rear, ideally two each so a bridle can be used, held on with the right high-tensile bolts. Where there's no recovery point, SECURETECH's emergency recovery point (a soft shackle) is for emergencies only. The Australian strap standard's warning backs this: people have been killed by tow balls flying off.",
      quote: "A standard tow bar or tow ball is unsuitable as a recovery point. You should have suitable, professionally fitted recovery points to the front and rear of all vehicles involved in a recovery.",
      sources: ["stHandbook", "stBuyers", "strapStandard"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "securetech-basics",
      category: "maker",
      title: "How SECURETECH says to do it",
      summary: "SECURETECH's general rules for every recovery: assess it first and make the stuck vehicle easier to get out (dig, pack the ruts); recover in as straight a line as possible; never use damaged or knotted straps or ropes; keep them off hot exhausts and sharp edges; never step over a tensioned cable, rope or strap. A pull strap (low-stretch polyester) is the first line of defence; kinetic straps and ropes are the last, and must never anchor a winch or extend a winch cable. SECURETECH adds that with so many variables nobody can guarantee a recovery's success or the safety of the people and property around it.",
      quote: "Due to the number of variables involved, it is not possible to guarantee the success of a recovery, the safety of bystanders, participants or property. … Kinetic straps and ropes should never be used to anchor a winching operation or extend a winch cable.",
      sources: ["stHandbook", "stGuide"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- recoil: lanyards and standing clear
    {
      id: "safety-lanyard",
      category: "maker",
      title: "Safety lanyards, fitted correctly",
      summary: "A safety lanyard ties the strap, rope or cable back to the vehicle, so that if something fails the parts are held instead of flying. SECURETECH's is low-stretch (5%) polyester webbing, 1.4 or 1.8 m long, tied to the vehicle and over the strap, rope or cable with two loose ring hitch knots, and not on the same point as the strap or bridle. Fit one at each end of the recovery; with a bridle, two. SECURETECH shows one fused to a shackle by the force of a failed recovery: it stopped the shackle whipping back.",
      quote: "It is made of low elongation (5%) high tenacity polyester webbing and is attached to the vehicle and over the strap, rope or cable by two loose ring hitch knots, it is not attached to the same point as the bridle or strap/rope/cable used. The suggested length is 1,4 or 1,8 metres.",
      sources: ["stHandbook", "stGuide", "stLanyard"],
      params: { ends: 2, stretch: 0.05, lengthsM: [1.4, 1.8] },
      checked: "2026-10-12",
    },
    {
      id: "stand-clear",
      category: "maker",
      title: "How far to stand away",
      summary: "SECURETECH: keep everyone well clear of ropes, straps and cables in case they recoil when something fails, as a rule twice the length of the strap, rope or cable used, and never step over one under tension. The page takes twice the stretched length, the longer reading. Everyone gets out of the vehicles first, and nobody stands in line with the strap or in the recovery vehicle's path.",
      quote: "Keep participants and observers well clear of ropes, straps or cables in case of recoil due to a failure (as a rule generally twice the length of the cable, strap or rope used).",
      sources: ["stHandbook", "stGuide"],
      params: { factor: 2 },
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- shackles
    {
      id: "shackle-ratings",
      category: "maker",
      title: "Rated bow shackles",
      summary: "SECURETECH: use only rated alloy recovery bow shackles (US Fed Spec RR-C-271b, factor of safety 6:1), never commercial or D shackles, with a WLL of at least 2 000 kg; carry a range from 2 to 6.5 t. Sizes listed: 2, 3.25, 4.75, 6.5 and 8.5 t WLL, so a 4.75 t shackle breaks at 28.5 t or more. A rated shackle has a thicker pin than its body and is marked with its WLL, batch number, maker's logo and size; a commercial one has a pin the same thickness as its body and usually no markings. Inspect before and after use; never use a bent, nicked or cracked one, never hammer it into place, never swap the pin for a bolt. Tighten the pin fully, then back it off half a turn so it opens afterwards, and make sure it fits your recovery points.",
      quote: "Use rated alloy recovery bow shackles with a Work Load Limit (WLL) of not less than 2 000kg to attach the strap, cable or rope used. (Fed Spec RR-C-271b/Factor of safety of 6:1). Pack a variety of bow shackles to cater to all vehicle weights, a good range will be from 2 Tons to 6,5 Tons to cover all situations.",
      sources: ["stHandbook", "stShackleGuide", "stShackle"],
      params: { shackles: steelShackles, minWllKg: 2000, designFactor: 6 },
      checked: "2026-10-12",
    },
    {
      id: "shackle-side-load",
      category: "maker",
      title: "Shackles loaded from the side",
      summary: "SECURETECH: rated bow shackles can be side loaded, but pulled at 90° (a side pull) the rating drops by half; never side load D, chain or long-reach shackles. Put several eyes on the bow, not the pin; join shackle to shackle bow to bow or bow to pin, never pin to pin. SECURETECH gives only the 90° figure, so for the angles in between the page uses Crosby's chart for screw pin shackles: 0–10° off in-line 100%, 11–20° 85%, 21–30° 75%, 31–45° 70%, 46–55° 60%, 56–70° 55%, 71–90° 50%.",
      quote: "Alloy rated bow shackles can be side loaded. Do not side load \"D\" shackles, chain shackles or long reach shackles. … It is important to note that when a bow shackle is used at 90 degrees (side pull) the rating is reduced by 50%.",
      sources: ["stShackleGuide", "crosbySideLoad", "crosbyRigging"],
      params: { bands: sideLoad },
      checked: "2026-10-12",
    },
    {
      id: "shackle-included-angle",
      category: "maker",
      title: "Two legs in one shackle",
      summary: "SECURETECH: put several eyes on the bow, not the pin, and use a shackle big enough not to pinch a lanyard or bridle. SECURETECH gives no angle limit for two legs in one bow; Crosby does: two legs in a screw pin shackle's bow can take the full WLL up to 120° between them, and never wider.",
      quote: "Attach multiple sling eyes to the bow, not the pin. … If using a shackle with synthetic slings such as a lanyard or bridle, ensure the shackle is big enough to avoid pinching or damaging the sling material.",
      sources: ["stShackleGuide", "crosbySideLoad"],
      params: { maxDeg: 120 },
      checked: "2026-10-12",
    },
    {
      id: "no-shackle-join",
      category: "maker",
      title: "Never join straps with a shackle",
      summary: "SECURETECH: join only straps and ropes of the same rating and type, with a recovery link (layers of webbing stitched together) between the two eyes so they can't bind onto each other; never with a shackle, which becomes a deadly missile if something fails.",
      quote: "It is not safe to join straps or ropes with a shackle. Should a failure occur the shackle will become a deadly missile!",
      sources: ["stHandbook", "stGuide"],
      params: {},
      checked: "2026-10-12",
    },
    {
      id: "soft-shackles",
      category: "maker",
      title: "Soft shackles",
      summary: "SECURETECH: a soft shackle is an alternative where a metal shackle can't be used; it works best on smooth, round surfaces and must not go around sharp objects. Open it only with no tension on it. SECURETECH's emergency recovery point (a soft shackle) is for emergencies only, where no professionally fitted recovery point exists. SECURETECH doesn't publish a strength for its soft shackle, so the page uses Factor 55's Extreme Duty soft shackles: 9.5 mm × 254 mm, 19.7 t maximum breaking strength (3.95 t WLL); 16 mm × 457 mm, 46.5 t (9.3 t); 22 mm × 610 mm, 83.9 t (16.8 t). We found no published side loading figure for soft shackles.",
      quote: "Soft shackles are an option to use during recoveries when a traditional metal shackle cannot be used to attach to a vehicle … Works best on smooth round surfaces. Do not place around sharp objects.",
      sources: ["stSoftGuide", "f55"],
      params: { shackles: softShackles },
      checked: "2026-10-12",
    },
    {
      id: "wll-mbs",
      category: "maker",
      title: "Breaking strength versus WLL",
      summary: "Breaking strength (MBS) is where a new item breaks. WLL (work load limit) is the most it's rated for in use: the breaking strength divided by a factor of safety. SECURETECH's rated bow shackles use 6:1, and it recommends 4:1 for straps and ropes against the vehicle's mass; a SECURETECH strap's label gives its WLL (the laden vehicle mass) and its factor of safety or breaking strength. Factor 55 lists its soft shackles at 5:1. Never compare one item's MBS with another's WLL.",
      quote: "Work Load Limit (laden vehicle mass) • Factor of safety and/or the minimum breaking strength.",
      sources: ["stHandbook", "stBuyers", "f55"],
      params: {},
      checked: "2026-10-12",
    },
    // ---------------------------------------------------------------- tree protectors and bridles
    {
      id: "tree-protector",
      category: "maker",
      title: "Tree trunk protectors",
      summary: "SECURETECH's handbook: the tree trunk protector protects the bark when winching or re-routing a cable through a snatch block from a tree, and gives a safe, secure anchor. It should be more than 75 mm wide and 2–5 m long (SECURETECH's website says 100 mm and 2–4 m), as low down on the tree as possible; avoid jerks that damage the bark, and never hook the cable back onto itself. SECURETECH's is low-stretch (5%) polyester webbing made and tested to EN 1492-1 and SANS 94-1; its strength isn't published. For strengths the page uses WARN's Epic protectors (breaking strength only): 25 mm × 2.4 m 3.27 t, 51 mm × 2.4 m 6.53 t, 102 mm × 2.4 m 13.6 t.",
      quote: "The tree trunk protector should be more than 75mm wide, and 2 – 5metres long. It should be placed as low down as possible on the base of the tree. Avoid jerks and movement which will damage the tree's bark.",
      sources: ["stHandbook", "stGuide", "stTree", "warnEpic"],
      params: { protectors: treeProtectors, minWidthMm: 75, minLengthM: 2, maxLengthM: 5 },
      checked: "2026-10-12",
    },
    {
      id: "bridle",
      category: "maker",
      title: "Bridles",
      summary: "SECURETECH: a bridle spreads the pull across two recovery points; being low-stretch (5%) polyester webbing it is softer on the vehicles if anything rebounds. It should be at least 3.5 m long, with reinforced eyes in movable sleeves, fitted to the vehicle with rated bow shackles, and used with two lanyards as well. SECURETECH's bridles (made and tested to EN 1492-2 and SANS 94-2): 10 500 kg minimum breaking strength, 3.5 m, for vehicles up to 2 625 kg; 16 000 kg, 5 m, for vehicles up to 4 000 kg (4 times the vehicle mass). Recover in as straight a line as possible: use a bridle to straighten the pull, and never pull more than 60° off the vehicle's centre line.",
      quote: "The safe option is to use the bridle in conjunction with two lanyards. The suggested length is not less than 3,5 metres … The bridle is attached to the vehicle with rated bow shackles. … Use a bridle if necessary to straighten out the pull and never pull at an angle greater than 60° from the centre line of the vehicle.",
      sources: ["stHandbook", "stBridle"],
      params: { bridles: bridles, minLengthM: 3.5, maxPullAngleDeg: 60 },
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
    { id: "speed", title: "Speed for vehicles of different mass", text: "SECURETECH suggests 18 km/h for two vehicles of similar mass; we found no figure for vehicles of different mass. The page shows how the force grows with speed." },
    { id: "wet", title: "How much weaker a wet strap is", text: "The standard says a soaked strap is weaker and stretches less, but nobody publishes how much." },
    { id: "lanyard", title: "A rating for safety lanyards", text: "SECURETECH publishes how to fit its lanyard (two loose ring hitch knots, 1.4 or 1.8 m long) but not its breaking strength, and nobody publishes how far a broken strap or flying shackle travels. The page shows the energy in the strap and SECURETECH's stand-off distance." },
    { id: "curve", title: "Each strap's stretch curve", text: "Makers give one stretch figure, not how stretch grows with load. The page assumes a straight line from no load to break." },
    { id: "recovery-points", title: "Your recovery points", text: "Recovery point ratings differ by vehicle and maker, and some are labelled with a WLL, some with a breaking strength. Type yours in if you know it; the page can't look it up." },
    { id: "tree-wll", title: "A working load for tree protectors", text: "SECURETECH doesn't publish its protector's strength online, and WARN lists a breaking strength, not a WLL or design factor. The page shows how many times stronger than the load the strap is, and leaves the judgement to you." },
    { id: "soft-side", title: "Soft shackles loaded from the side", text: "No published side loading figures for soft shackles." },
  ];

  // Ready-made examples. Made-up figures that show how the inputs combine;
  // masses are typical loaded 4x4s, not from a source.
  const scenarios = [
    { id: "sand", label: "Two bakkies in sand", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 12000, lengthM: 9, speedKmh: 10, shackle: "bow-4.75" } },
    { id: "st18", label: "SECURETECH's 18 km/h", values: { stuckKg: 2900, recKg: 2900, gear: "strap", mbsKg: 12000, lengthM: 9, speedKmh: 18, shackle: "bow-6.5" } },
    { id: "light", label: "Light SUV, heavy rescuer", values: { stuckKg: 1500, recKg: 3350, gear: "kinetic", mbsKg: 8000, lengthM: 9, speedKmh: 8, shackle: "f55-3/8" } },
    { id: "fast", label: "Too fast: 25 km/h", values: { stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 12000, lengthM: 9, speedKmh: 25, shackle: "bow-4.75" } },
    { id: "static", label: "Winch rope used to snatch", values: { stuckKg: 2900, recKg: 3100, gear: "static", mbsKg: 8000, lengthM: 9, speedKmh: 8, shackle: "bow-4.75" } },
    { id: "overland", label: "Heavy overlander", values: { stuckKg: 4400, recKg: 3350, gear: "kinetic", mbsKg: 16000, lengthM: 9, speedKmh: 6, shackle: "f55-5/8" } },
  ];

  // The defaults the page opens with (also an example, labelled as such).
  const defaults = {
    stuckKg: 2900, recKg: 3100, gear: "strap", mbsKg: 12000, lengthM: 9, speedKmh: 10,
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
