# Ropes and Shackles

Static page for 4x4 **kinetic recovery gear**, part of the PsyPhin site: what a snatch puts through a snatch strap or kinetic rope and its shackles, which strap or rope suits the two vehicles, and what the three "safety straps" are each for (safety lanyard, tree protector, bridle). Started 2026-10-12, in the same design as the winching page (`../Winch_Calc`, https://winching.psyphin.co.za/), reusing the strap and kinetic material that page dropped (its commit 8565449 and before).

Repo `psyphin234/ropes-recovery-gear` (public), GitHub Pages from `main` / root, since 2026-10-12. Push to `main` to deploy (ask the owner first); check with `gh api repos/psyphin234/ropes-recovery-gear/pages/builds/latest`.

**Address: https://ropes.psyphin.co.za/** (the `CNAME` file here, plus the Afrihost CNAME `ropes.psyphin.co.za` → `psyphin234.github.io`, which was already in place). Both pages carry `<link rel="canonical">` and Open Graph tags for it; no share image yet.

**Card on psyphin.co.za** (Tools section) since 2026-10-12, at the owner's request: titled **Ropes and Shackles** (the page's own name too, since 2026-10-12; it was "Ropes & Recovery Gear"; the repo and the `ropes-recovery-v1` key keep the old name), amber "Under construction" tag, image `assets/img/projects/ropes-recovery-gear.jpg` there (this page's scene rendered at 800x450, kinetic rope tight, extra sky for 16:9). Edit it in that repo's `projects.js`.

**Look** ("deep space", since 2026-10-19, owner's request: the same as psyphin.co.za, the fuel site, the towing checker, the EV page and the winching page): navy `--bg`, Sora for headings, cyan accent, the circuit board from `js/circuit.js` (identical on every PsyPhin site; copy changes across). Like the towing checker, **nothing moves behind the text**: `<html data-circuit="still">` (both pages) draws the board once, dimmed, and the blue/violet light doesn't drift. The header (`brand-bar--hero`) has `js/fx.js`'s **snatch hologram** on `canvas.hero-fx`: a 4x4 bogged in sand and a bakkie joined by a kinetic rope with a bow shackle and a safety lanyard at each end; the bakkie pulls away, the slack rope lifts off the sand and stretches 30% (brighter, thicker, its weave drawn out, a flash at the peak), the stuck vehicle pops out and the rope eases back, then a hold and a restart every 7.6 s. Tagged SAFETY LANYARD, BOW SHACKLE and KINETIC ROPE inside a "SNATCH RECOVERY" HUD frame with a rope-stretch bar. It deliberately shows **no figures**; faint and unlabelled behind the text on narrow screens; drawn once, at the peak, under prefers-reduced-motion; paused offscreen. The scene, diagrams and charts keep their own drawing (only their greys were moved to navy; the sand and strap colours are unchanged). Everything else is in the **"deep space finish" block at the end of style.css, inside `@media screen`** (the same block as the winching page's; print is unchanged). The tag `before-redesign` marks the state before. The psyphin.co.za card image was recaptured in the navy look the same day (headless Chrome, 800 px window at 2x, reduced motion, kinetic rope, the scene's viewBox widened to 0 -70 800 450 with the sky stretched, the typed fields and the scene's text hidden).

**Danger warnings (owner's requirement, 2026-10-12):** the site must say plainly that recovery is dangerous, that it's for information only, and that judgement on the scene overrides it. That's the red `.danger` box under the intro on both pages (kept compact at the owner's request, 2026-10-12: those three points stay visible, the detail and SECURETECH's advice fold into "Why, and what to do"), the line under every verdict, the disclaimer (no liability) and the footer. Keep them.

**Inputs vs worked-out figures (owner, 2026-10-13, as on the winching page):** everything the visitor can change is blue: typed fields have a blue box, blue value and a pencil (`--input-bg`, `--input-border`, `--pencil`), selected chips and cards are blue, slider values are blue. Worked-out figures stay plain: the readouts under the snatch and the safety-strap figures (`.figure`) have no box, and the shackle cards' "used at" tag is grey. A one-line key under "Try:" (`.try-hint`) says so. Keep blue boxes for inputs only.

**Number boxes are `type="text"` with `inputmode`**, not `type="number"` (since 2026-10-21: on the EV page a tester's iPhone turned "6,2" into 62, because Safari's number boxes mangle a decimal comma, and South African keypads show a comma). `C.parseNumber()` in calc.js reads what was typed (comma or point decimal, spaces or commas for thousands; tested), and app.js steps the value on the up and down arrows using the `step`/`min`/`max` attributes. The CSS finds them as `input[inputmode]`. Keep new number boxes the same way.

Plain HTML/CSS/vanilla JS, classic scripts (no modules, no build step), so `index.html` opens straight from disk. Inputs are only kept in the visitor's own `localStorage` (key `ropes-recovery-v1`).

**Status: finished** (owner, 2026-10-14). `noindex` removed from both pages 2026-10-14, so Google may list them. The amber `.construction` banner was removed the same day (its CSS is kept); the psyphin.co.za card is green "Actively maintained".

## Source policy (owner's rule, non-negotiable)

- **Standards, manufacturers' published data and instructions, and physics only. No broscience:** no forum, club, retailer-blog or "everyone says" figures.
- Every number lives in `js/data.js` as a rule's `params`, next to its sources, the exact words quoted from the source (`quote`) and a `checked` date. Don't hard-code 2–3×, 20%, 1.5× etc. elsewhere.
- Where nothing citable exists, add a `gaps` entry and say "no published figure" on the page. Current gaps: speed, a pull strap's stretch, how much weaker a wet strap is, how to fit a safety lanyard, each strap's stretch curve, your recovery points' rating, a WLL for tree protectors, soft shackle side loading.
- Rule `category`: standard | maker | calculation. **calculation** = this site's own physics; it must cite `physics` and say so where shown.

## Source order: South Africa first (owner, 2026-10-12)

South African sources take preference, SECURETECH above all. Australian sources (the strap standard, Bushranger) only where no South African source publishes anything; other makers fill gaps the same way. The page and README descriptions don't call any source Australian (owner, 2026-10-12): the Australian sources stay, named without the country. Every source in data.js has a `country`; sources.html lists Manufacturers before Standards and puts ZA-led rules and sources first.

## SECURETECH is the lead source; metric only (owner's calls, 2026-10-12)

The owner has been to SECURETECH's warehouse (South Africa), seen its manufacturing and testing, dealt with the manager, and uses mostly SECURETECH gear: reference SECURETECH first for data and facts. Read from securetech.co.za on 2026-10-12: the Safety & Downloads guidelines page (`stGuide`) and product pages (kinetic strap 20–30%, kinetic rope 30–40% / 35–40%, rated alloy bow shackles 2–8.5 t WLL to Fed Spec RR-C-271b, bridles 10.5 t / 16 t for vehicles to 2 625 / 4 000 kg, tree protector 100 mm × 2–4 m, lanyard tied with two ring hitch knots, stand-off 2 × the length, rest 8 h per 10% of stretch). The shop API (`/wp-json/wc/store/v1/products`) returns the product texts. SECURETECH publishes no strength online for its tree protector, soft shackle or lanyard: WARN's Epic and Factor 55's figures fill those, labelled. The stretch figures are taken at the low end of SECURETECH's ranges (the higher force). The guidelines also recommend recovery blankets: left out (see No dampers).

**No Australian training advice** (owner, 2026-10-12: South Africa has no 4x4 training authority). The `training` rule cites SECURETECH's handbook page ("attend a professional 4×4 recovery course"), not the Australian standard.

**SECURETECH documents (supplied by the owner, 2026-10-12, not online):** Recovery Handbook (© 2016, 18 pp; request page linked), Recovery Kit Buyers Guide v2, User Instructions: Shackles, Soft Shackle Users Guide, and the Special Industrial Supplies company profile. Kept out of the repo (not ours to republish); cited as `stHandbook`, `stBuyers`, `stShackleGuide`, `stSoftGuide`. From them: strap/rope strength by SECURETECH's factors of safety on the **stuck vehicle's** mass (2:1, 3:1, 4:1 noted, 4:1 recommended; replaces the Australian 2–3× and Factor 55's 4–6×), 18 km/h suggested for vehicles of similar mass (`snatch-speed`; the page's model holds the stuck vehicle still, so at 18 km/h it can show more force than a real snatch), shackle factor of safety 6:1 and 50% at a 90° side pull, lanyards on two loose ring hitches, not on the strap's own point, 1.4 or 1.8 m, bridles ≥ 3.5 m and never pull more than 60° off the centre line, tree protector > 75 mm wide and 2–5 m, strap care (10% damage = 50% capacity lost; rest 8 h per 10% stretch).

**Metric only on the page:** sizes in mm and m, strengths in kg and t. Makers' lb/inch figures stay only inside quotes; data keeps them as published (`breakLb`) and converts.

## Sources used (all in data.js, read 2026-10-12)

- **Australian standard**, Consumer Goods (Motor Vehicle Recovery Straps) Safety Standard 2017 (F2017L01560), read from the legislation's Word file: strap MBS 2–3 × GVM, lighter of the two vehicles; strength and stretch drop when soaked; the tow-ball warning. It never mentions ropes; nothing says it excludes them (the winching page's old "excludes rope, wire, chain" claim was not found in the text, so it isn't used).
- **Bushranger** strap sheet (via Snowys; the PDF has no text layer for the cover, the text was pulled from its streams): 9 m nylon, "Stretch Factor: 20%"; stand at least 1.5 × the length of the "upstretched" strap (their spelling; the page uses the stretched length, the longer reading); never exceed the strap's MBS, the recovery point or the shackles' WLL; never join straps with a D or bow shackle; equaliser straps spread the load; strap life 10 recoveries.
- **Factor 55** literature on WARN's site: kinetic rope stretches up to 30%; rope MBS 4:1–6:1 to GVWR (2:1–4:1 for heavy vehicles), lighter vehicle, too large won't stretch; Extreme Duty soft shackles and kinetic rope bridles ("Maximum breaking strength", WLL = ÷ 5).
- **Static pull strap** (owner, 2026-10-12: renamed from "winch rope (static)"; the Samson AmSteel-Blue figures and sources went with it): SECURETECH's pull strap page (`stPull`) says only "low elongation polyester webbing", so the page uses the 5% SECURETECH gives for its lanyard, bridle and tree protector webbing (gap `pull-stretch`). Gear id stays `static`.
- **Crosby**: G-209 WLL table (6:1); 2022 catalogue p. 362 (centre the load in the bow, one leg on the pin, don't pinch synthetic slings) and p. 364 (side loading chart 100/85/75/70/60/55/50%; never exceed 120° included angle).
- **WARN**: Basic Guide to Winch Rigging (hook up low on the anchor; never wrap the rope back onto itself); Epic tree trunk protectors 7 200 / 14 400 / 30 000 lb breaking strength, no WLL.

## No dampers (owner's call, 2026-10-12)

The owner doesn't use recovery dampers or blankets: no references to them on this page or the winching page. The recoil job is covered by **safety lanyards used correctly** (rule `safety-lanyard`, SECURETECH: tied to the strap, one at each end, so failed parts are held). No maker found publishes how to fit one (where to tie it, slack, rating): that's the `lanyard` gap; if the owner supplies a maker's sheet or their method with a source, add it there. Note the Australian strap standard itself requires strap instructions to mention a damper/bag/blanket (s 9(2)(e)); that requirement is deliberately not shown.

## The model (rule `kinetic-model`, physics)

The strap is a straight-line spring that reaches its MBS at its rated stretch: k = MBS × g ÷ (length × stretch). The stuck vehicle is held still (the hardest case); the recovery vehicle's energy all goes into the strap. Peak force = v × √(m k), so it rises in step with speed. If the peak reaches the MBS, it breaks at its rated stretch and lets go of ½ × MBS × stretch. `speedFor(F)` gives the speed at which the peak reaches F ("keep under"). The verdict checks each part's load at the peak against its own rating: the strap's MBS, each end's shackle WLL (after side loading), each end's bridle (SECURETECH's one breaking strength, against the whole pull) and the recovery points' rating if typed (SECURETECH: allow for the full load; Bushranger: never exceed). On a bridle each leg's shackle and point take `endShare` = leg-load share of the peak; the dial, chart and "keep under" use `atKg` = rating ÷ share, the strap force at which that part reaches its rating. Identical parts at both ends show as one "Both ends" row. Bridle checks that aren't forces (SECURETECH's vehicle-mass rating, bow shackles not soft ones, Crosby's 120°) come next, then the MBS against SECURETECH's 2:1 / 4:1 on the stuck vehicle.

## The page (one stage card)

1. **Try:** example chips (`scenarios`, made-up figures).
2. **Scene** (`V.scene()`): side view, stuck vehicle sunk in sand on the left, recovery vehicle on the right, strap between with a safety lanyard at each end. Stuck mass, recovery mass, strap MBS and length are HTML overlays on the picture; under 860 px `placeFields()` moves them below it. The strap is drawn to scale along its length, so its stretch shows true. Playback: slack phase (illustration) then the spring; if it breaks, the halves fly back, held by the lanyards.
3. **Controls:** what's on the vehicles (snatch strap / kinetic rope / static pull strap), speed slider 1–30 km/h. Then **Each end: shackles and bridles** (`.ends`, moved up here at the owner's request, 2026-10-13: all inputs sit together above the verdict, so a shackle pick shows its effect straight below): tabs for the stuck end and the recovery end; per end "One recovery point" or "Bridle across two points" (state `bridleStuck` / `bridleRec`; the bridle model and leg angle are shared with the Bridle section's controls, `bridle` / `bridleDeg`) and its own shackle (`shackleStuck` / `shackleRec`; an old saved `shackle` fills both). Side-load slider (applies to every shackle), recovery point rating field (applies to every point), SECURETECH bow and Factor 55 soft shackle cards for the chosen end, tagged with the end(s) using them (green if WLL > that end's load per shackle). Example chips set one shackle on both ends and no bridles; the 'used at' tag says "Both ends" when both use it.
4. **Verdict** with balance bars: each part's rating, with its own load at the peak marked on it; fix button "Keep under N km/h", "Use a kinetic rope" or a bigger bridle.
5. **The snatch, moment by moment:** force dial (marks for each limit), force-over-time chart, Play (5 s, slowed down), live readouts.
6. **Strap or rope for these two vehicles:** range bars (standard 2–3×, Factor 55 4–6× with the 2–4× heavy band hatched) with the user's MBS; peak force by speed for the three kinds at the same MBS and length; table with "keep under".
7. **Shackles: what to know:** the shackle rules (rated bow shackles only, side pulls, two legs in one bow, never join straps with a shackle, big enough) and their sources; the pickers are under 3.
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
js/circuit.js     The circuit board behind the page (identical on every PsyPhin site)
js/fx.js          The header's snatch hologram and the explainers' fade-ins (index.html only)
css/style.css     The SA Towing Check base + the winching page's shared stage parts + this page's section at the end, then the deep space finish
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

## Search (SEO)

Set up 2026-10-13, following the [Runbook: SEO for Small Sites & Tools](https://claude.ai/code/artifact/0e4d5503-7f20-4cb5-a25b-840f4caa3545). The `<title>` leads with the tool's name and adds the words people search for; the meta description is at most 155 characters (Google cuts the rest). `index.html` has a `WebApplication` JSON-LD block (keep its description the same as the meta description), an Open Graph image (the psyphin.co.za card image), and the footer's "More 4x4 tools" line links the winch, tyres and towing tools, which link back. `robots.txt` and `sitemap.xml` are at the site root: **update the sitemap's `lastmod` when a page's content changes.** Indexable since 2026-10-14 (the `noindex` meta tags were removed). **Common questions** (since 2026-10-14): five `<details class="explainer">` below the explainers, for the words people search; the questions are static in index.html, the answers are built in `renderExplainers()` from data.js figures, each with a sources line. To remove them, revert that commit (`git revert`; the tag `before-faq` marks the state before).
