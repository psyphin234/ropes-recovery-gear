# Ropes & Recovery Gear

Static page for 4x4 **kinetic recovery gear**, part of the PsyPhin site: what a snatch puts through a snatch strap or kinetic rope and its shackles, which strap or rope suits the two vehicles, and what the three "safety straps" are each for (safety lanyard, tree protector, bridle). Started 2026-10-12, in the same design as the winching page (`../Winch_Calc`, https://winching.psyphin.co.za/), reusing the strap and kinetic material that page dropped (its commit 8565449 and before).

Repo `psyphin234/ropes-recovery-gear` (public), GitHub Pages from `main` / root, since 2026-10-12. Push to `main` to deploy (ask the owner first); check with `gh api repos/psyphin234/ropes-recovery-gear/pages/builds/latest`.

**Address: https://ropes.psyphin.co.za/** (the `CNAME` file here, plus the Afrihost CNAME `ropes.psyphin.co.za` → `psyphin234.github.io`, which was already in place). Both pages carry `<link rel="canonical">` and Open Graph tags for it; no share image yet.

**No card on psyphin.co.za yet** (owner's call, 2026-10-12, repeated the same day). Don't add one until asked.

**Danger warnings (owner's requirement, 2026-10-12):** the site must say plainly that recovery is dangerous, that it's for information only, and that judgement on the scene overrides it. That's the red `.danger` box under the intro on both pages, the line under every verdict, the disclaimer (no liability) and the footer. Keep them.

Plain HTML/CSS/vanilla JS, classic scripts (no modules, no build step), so `index.html` opens straight from disk. Inputs are only kept in the visitor's own `localStorage` (key `ropes-recovery-v1`).

**Status: UNDER CONSTRUCTION.** Both pages carry the amber `.construction` banner and `<meta name="robots" content="noindex">`. Keep both until the owner says otherwise.

## Source policy (owner's rule, non-negotiable)

- **Standards, manufacturers' published data and instructions, and physics only. No broscience:** no forum, club, retailer-blog or "everyone says" figures.
- Every number lives in `js/data.js` as a rule's `params`, next to its sources, the exact words quoted from the source (`quote`) and a `checked` date. Don't hard-code 2–3×, 20%, 1.5× etc. elsewhere.
- Where nothing citable exists, add a `gaps` entry and say "no published figure" on the page. Current gaps: speed, how much weaker a wet strap is, how to fit a safety lanyard, each strap's stretch curve, your recovery points' rating, a WLL for tree protectors, soft shackle side loading.
- Rule `category`: standard | maker | calculation. **calculation** = this site's own physics; it must cite `physics` and say so where shown.

## Source order: South Africa first (owner, 2026-10-12)

South African sources take preference, SECURETECH above all. Australian sources (the strap standard, Bushranger) only where no South African source publishes anything; other makers fill gaps the same way. Every source in data.js has a `country`; sources.html lists Manufacturers before Standards and puts ZA-led rules and sources first.

## SECURETECH is the lead source; metric only (owner's calls, 2026-10-12)

The owner has been to SECURETECH's warehouse (South Africa), seen its manufacturing and testing, dealt with the manager, and uses mostly SECURETECH gear: reference SECURETECH first for data and facts. Read from securetech.co.za on 2026-10-12: the Safety & Downloads guidelines page (`stGuide`) and product pages (kinetic strap 20–30%, kinetic rope 30–40% / 35–40%, rated alloy bow shackles 2–8.5 t WLL to Fed Spec RR-C-271b, bridles 10.5 t / 16 t for vehicles to 2 625 / 4 000 kg, tree protector 100 mm × 2–4 m, lanyard tied with two ring hitch knots, stand-off 2 × the length, rest 8 h per 10% of stretch). The shop API (`/wp-json/wc/store/v1/products`) returns the product texts. SECURETECH publishes no strength online for its tree protector, soft shackle or lanyard: WARN's Epic and Factor 55's figures fill those, labelled. The stretch figures are taken at the low end of SECURETECH's ranges (the higher force). The guidelines also recommend recovery blankets: left out (see No dampers).

**No Australian training advice** (owner, 2026-10-12: South Africa has no 4x4 training authority). The `training` rule cites SECURETECH's handbook page ("attend a professional 4×4 recovery course"), not the Australian standard.

**Metric only on the page:** sizes in mm and m, strengths in kg and t. Makers' lb/inch figures stay only inside quotes; data keeps them as published (`breakLb`) and converts.

## Sources used (all in data.js, read 2026-10-12)

- **Australian standard**, Consumer Goods (Motor Vehicle Recovery Straps) Safety Standard 2017 (F2017L01560), read from the legislation's Word file: strap MBS 2–3 × GVM, lighter of the two vehicles; strength and stretch drop when soaked; the tow-ball warning. It never mentions ropes; nothing says it excludes them (the winching page's old "excludes rope, wire, chain" claim was not found in the text, so it isn't used).
- **Bushranger** strap sheet (via Snowys; the PDF has no text layer for the cover, the text was pulled from its streams): 9 m nylon, "Stretch Factor: 20%"; stand at least 1.5 × the length of the "upstretched" strap (their spelling; the page uses the stretched length, the longer reading); never exceed the strap's MBS, the recovery point or the shackles' WLL; never join straps with a D or bow shackle; equaliser straps spread the load; strap life 10 recoveries.
- **Factor 55** literature on WARN's site: kinetic rope stretches up to 30%; rope MBS 4:1–6:1 to GVWR (2:1–4:1 for heavy vehicles), lighter vehicle, too large won't stretch; Extreme Duty soft shackles and kinetic rope bridles ("Maximum breaking strength", WLL = ÷ 5).
- **Samson** AmSteel-Blue: elastic elongation 0.96% at 30% of break (the page's winch-rope stiffness, carried on in a straight line to ~3.2% at break); warning statement: shock loading voids working loads, never stand in line with a rope under tension.
- **Crosby**: G-209 WLL table (6:1); 2022 catalogue p. 362 (centre the load in the bow, one leg on the pin, don't pinch synthetic slings) and p. 364 (side loading chart 100/85/75/70/60/55/50%; never exceed 120° included angle).
- **WARN**: Basic Guide to Winch Rigging (hook up low on the anchor; never wrap the rope back onto itself); Epic tree trunk protectors 7 200 / 14 400 / 30 000 lb breaking strength, no WLL.

## No dampers (owner's call, 2026-10-12)

The owner doesn't use recovery dampers or blankets: no references to them on this page or the winching page. The recoil job is covered by **safety lanyards used correctly** (rule `safety-lanyard`, SECURETECH: tied to the strap, one at each end, so failed parts are held). No maker found publishes how to fit one (where to tie it, slack, rating): that's the `lanyard` gap; if the owner supplies a maker's sheet or their method with a source, add it there. Note the Australian strap standard itself requires strap instructions to mention a damper/bag/blanket (s 9(2)(e)); that requirement is deliberately not shown.

## The model (rule `kinetic-model`, physics)

The strap is a straight-line spring that reaches its MBS at its rated stretch: k = MBS × g ÷ (length × stretch). The stuck vehicle is held still (the hardest case); the recovery vehicle's energy all goes into the strap. Peak force = v × √(m k), so it rises in step with speed. If the peak reaches the MBS, it breaks at its rated stretch and lets go of ½ × MBS × stretch. `speedFor(F)` gives the speed at which the peak reaches F ("keep under"). The verdict checks the peak against the strap's MBS, the chosen shackle's WLL (after side loading) and the recovery points' rating if typed (Bushranger's "never exceed" rule), then the MBS against the standard's / Factor 55's range for the lighter vehicle.

## The page (one stage card)

1. **Try:** example chips (`scenarios`, made-up figures).
2. **Scene** (`V.scene()`): side view, stuck vehicle sunk in sand on the left, recovery vehicle on the right, strap between with a safety lanyard at each end. Stuck mass, recovery mass, strap MBS and length are HTML overlays on the picture; under 860 px `placeFields()` moves them below it. The strap is drawn to scale along its length, so its stretch shows true. Playback: slack phase (illustration) then the spring; if it breaks, the halves fly back, held by the lanyards.
3. **Controls:** what's on the vehicles (snatch strap / kinetic rope / winch rope (static)), speed slider 1–30 km/h.
4. **Verdict** with balance bars: peak force against each limit, with the peak marked on each; fix button "Keep under N km/h" or "Use a kinetic rope".
5. **The snatch, moment by moment:** force dial (marks for each limit), force-over-time chart, Play (5 s, slowed down), live readouts.
6. **Strap or rope for these two vehicles:** range bars (standard 2–3×, Factor 55 4–6× with the 2–4× heavy band hatched) with the user's MBS; peak force by speed for the three kinds at the same MBS and length; table with "keep under".
7. **Shackles:** side-load slider with a shackle picture, recovery point rating field, Crosby G-209 and Factor 55 soft shackle cards (click to choose; green if WLL > peak).
8. **Safety straps: three different jobs** (owner asked to keep these distinct, 2026-10-12): safety lanyard (stand-off top view to scale, energy), tree protector (pull on the anchor, WARN Epic size, angle between the ends; leg load), bridle (Factor 55 bridle, angle between legs; each point's load from the snatch peak). Over 120° shows Crosby's limit.
Then disclaimer and explainers (speed, MBS vs WLL, gaps).

## Structure

```
index.html        The page (one stage) + explainers
sources.html      Every rule with category, summary, quote, sources, checked date; gaps; source list
js/data.js        THE data file: sources, rules, gear types, shackles, side-load chart, tree protectors, bridles, gaps, scenarios, defaults
js/calc.js        Pure calculations (no DOM): sizeRange, kinetic, standOff, sideLoadKeep, shackles, legLoad
js/ui.js          DOM + formatting helpers (copied from the winching page)
js/diagrams.js    scene, gauge, lineChart (playhead, tooltip, end labels kept apart), shackleView, standOff, vee
js/app.js         State, building the controls once, update(), playback
js/sources.js     Builds sources.html from data.js
css/style.css     The SA Towing Check base + the winching page's shared stage parts + this page's section at the end
tests/            index.html + calc.test.js; run.ps1 runs them in headless Edge
```

## Preview and test

- Open `index.html` from disk, or `python -m http.server`.
- Tests: `powershell -ExecutionPolicy Bypass -File tests\run.ps1`.
- Check 390 px (iframe it: headless Edge won't go narrower than ~490 px), ~700 px and desktop; no horizontal page scroll.
- `*.tmp.html` is gitignored: copies of index.html that preset localStorage are handy for screenshotting states. File pages share one localStorage in Edge, so reset it afterwards.

## Conventions

- Header: the same `.brand-bar` as the other tools; favicons and `logo.jpg` are copies from the winching page.
- GoatCounter tag on both pages with the host-prefix snippet, as on the other tools.
- Brand is written **PsyPhin**. Commit identity: `74655215+psyphin234@users.noreply.github.com`. Ask before pushing anything live.
