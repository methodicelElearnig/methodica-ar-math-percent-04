# Unit: methodica-ar-math-percent-04 (Arabic twin)

**Before any change, read `../../KNOWN-ISSUES.md` (the unit folder, outside git) and remind Vadim of it.**

The Arabic twin of `methodica-math-percent-04` (Hebrew repo `methodicelElearnig/methodica-math-percent-04`).
Same engine, same screens (global 0–64), same flow, gates, hints, scoring, reporting and resume:
**functionality is the Hebrew unit's; only learner-visible text is Arabic.** Comments and docs stay
Hebrew/English and are not translated.

## Twin status
- Level with Hebrew `b503e1e` (14.11.26): B-2 Back (`96d7c0d`), 03.11 resume hardening + leave save
  on `xapi-720-l.js` (`bd65765`), guided 01-004 reports nothing (`f33bd26`) — ported 15.11.26 with
  `git apply -C1`; hunks broken by translated text were applied by hand (commit bodies say which).
- **Porting a Hebrew change:** `git -C <he> format-patch -1 <sha> --stdout -- . ':!metadata'` →
  rename `methodica-math-percent-04` → `methodica-ar-math-percent-04` in the patch paths →
  `git apply -C1 --reject`; redo rejected hunks by hand keeping the Arabic text; port the matching
  `_test` change; bump `?v=` in all seven parts; commit as "… - port of methodica-math-percent-04 <sha>".
- Known gap inherited from Hebrew, deliberately mirrored (decision 15.11.26): no metadata-driven
  `result.response` (guide §6.3c). Fix Hebrew first, then port. See KNOWN-ISSUES.md.

## Identity (differs from Hebrew on purpose)
| | Hebrew | Arabic (this repo) |
|---|---|---|
| component folders / slugs | `methodica-math-percent-04-0N` | `methodica-ar-math-percent-04-0N` |
| `XAPI_ID_PREFIX` | `…/metodica/720active/math/percent/04/` | `…/metodica/720/ar/math/percent/04/` |
| `XAPI_UNIT_ID` | `methodica-math-percent-04` | `methodica-ar-math-percent-04` |
| storage keys | `methodica_math_percent_04_selectedCharacter`, `lomda_nav_edges::methodica-math-percent-04` | `methodica_ar_…`, `…::methodica-ar-math-percent-04` |
| content served from | `…/720/math/percent/04/` | `…/720/ar/math/percent/04/` |
| Kata | its own unit | **no unit of its own**: 7 components inside the Hebrew unit, `send-metadata.ps1` parent-unit mode; read through the Hebrew key (`methodica-ar-…` is a 404) |

- **Arabic components stay `draft`** until MOE approves the Arabic version in writing
  (KATA-API.md "Arabic components in a Hebrew unit"). `send-metadata.ps1 -Publish` throws here.
- Metadata comes from Vadim (Arabic), Kata is the source of truth; ids/slugs must match the table above.

## Arabic text conventions in this unit
- `%` and numbers in an RTL run: `<span dir="ltr">10%</span>`; the shekel as an isolate `⁦₪20⁩`
  (LRI…PDI). Unit words follow THE UNIT LAW below exactly as in Hebrew.
- Font: `Calibri, 'Assistant', sans-serif` on every rule + a global `html, body, button, input,
  select, textarea, option` rule at the end of `unit-css/styles.css` (Assistant stays as fallback).
- `letterize` matches Hebrew AND Arabic letters, written as escapes `[\u05D0-\u05EA\u0621-\u064A]`
  (`main.js`) so the shipped code holds no Hebrew character at all and `scan-hebrew-in-arabic.py`
  reports 0 (15.11.26). Keep any Hebrew range in shipped code as `\u` escapes.
- The checked-answer label is `متابعة` (Hebrew `שנמשיך?`); `_test/statement-flow.js` expects it.
- Arabic-only layout: the bottom-bar hint pill is placed 16px after the primary pill by a small
  observer at the end of `main.js` (Arabic labels are longer); `.scq-popup-title` is right-aligned.
- **No Hebrew on an Arabic page** (guide §10.2): no Hebrew in markup, attributes, hidden feedback,
  reported strings or metadata learner fields (`informationToBot` may stay Hebrew). Check with
  `Tools/kata-rounds/scan-hebrew-in-arabic.py` on a package in `../deployments/<date>/`.
- Translation sources: `translations/` (XLF exports and sweep reports). Never shipped.

---

## Inherited from the Hebrew twin (build recipe, producer decisions, reporting, assets)

Everything below is the Hebrew unit's CLAUDE.md as of the fork. It applies unchanged to behaviour;
quoted Hebrew screen text is the source the Arabic was translated from. Slugs read as the Arabic
ones above. `spec/`, `media/`, `index_dev.html` and the `units/` single-folder build exist only on
the Hebrew side.
---

## Build recipe for this unit (registered 20.08.26 from the producer round)

Screens 0-65 = pptx slides 3-90 — **the whole deck is built.** This file is
the reference for fix rounds and for the next unit that reuses this engine.

### Order of work for a new range
1. `pptx_callouts.py <pptx> <from> <to> --text` — read the FULL dump, never piped
   through `head`. Bold markers are copied verbatim; an important-*looking* line
   with no `b="1"` stays regular.
2. Render the deck pages: **PDF page = slide number − 2**
   (`~/Downloads/לחשב אחוז שינויים באחוזים_יעד 4.4_120826_מוכן להפקה.pdf`).
   **Text source of truth since 30.08:**
   `720/pptx/methodica-math-percent-04-new.pptx` (client re-typed the
   equations as plain text; wording unchanged — verified by full-deck diff).
   Layout, line breaks and partial bold come from the rendered page, never from
   the spec's line order.
3. Tables live in `<p:graphicFrame>/<a:tbl>` and equations in `<m:oMath>` — both
   invisible to the text scanner. Read them from the slide XML or the feedback
   ships half-empty (S28 did).
4. Build, then run **all three**:
   `verify_build.py` (content) · `check_structure.py` (structure) · the screen
   sweep. Zero issues before showing the producer.

### Screen types and where they come from
| type | engine | built by |
|---|---|---|
| SingleChoiceQuestionImage | `SCQ[sid]` + `scqSelect/scqCheck` | `PR` config |
| ValueInputQuestion | `VIQ[sid]` + `viqOnInput/viqCheck` | `PR` config |
| DropdownQuestion | `DQ[sid]` (key is **`correctId`**) | `PR` config |
| guided step | `GUIDED` config | `buildGuidedScreens()` |
| transition | `PR` config, `kind:'transition'` | `buildPracticeScreens()` |
| class task (open, no key) | `TASKS[sid]` + `taskOnInput/taskCheck` | `PR` config, `kind:'task'` |

New screens go in the `PR` array — markup is generated, so never hand-write a
screen unless it is genuinely one-off.

### Producer decisions already made — apply without asking
- **A class task has no answer key.** Slide 64 sends the learner out to count
  real benches, so `kind:'task'` renders one wide open box per sub-question and
  צדקתי? opens as soon as every box has something in it — it never marks
  right/wrong. Its rows drop the 560px `.viq-rows` cap so a long label and its
  box stay on one line, as the deck sets them.
- **Hidden slides are not screens.** A slide marked `שקף מוסתר (hidden)` in the
  spec is not built (slide 7's character choice was removed; the companion is
  fixed to `character-1`).
- **Transitions play a character clip**, not a still: `media/character-*.mp4`,
  1280×720 on white, `autoplay loop muted playsinline`.
- **Guided screens:** exercise text RIGHT in a bordered box, purple callout
  LEFT, title centred, lead full-width centred (Figma 3582:26366). Callout icon
  is the plain outline lamp; the rays-bulb belongs to the hint button/modal.
- **Answer marking** = ratio-01-01 S9: pill fills Subject/300, label to 600, and
  an 18px filled circle badge with a white ✓ (#609e12) / ✕ (#b20010).
- **Where a hint goes follows the question, not the screen.** The bottom-bar
  `אפשר רמז?` + modal is for a screen that holds ONE question. Inside a scroll
  (`kind: 'scrollset'`) each section carries its own `hint`, so the button sits
  in that question's block beside its צדקתי? and the hint opens IN PLACE
  (`toggleInlineHint`, `.scrollset-hint`) — a bar button would be ambiguous
  about which question it serves, and a modal would cover the scroll and lose
  the reader's place. Same rule as the feedback: inline question, inline
  chrome. Resolving the question closes and hides its hint, exactly as
  `hideHintButton` does on a normal screen.
- **Scroll-screen chrome is styled by suffix, never by screen id.** The
  scrollbar click-hint rule is `.click-hint[id$="-hint-scroll"]` — it was
  `#s0-hint-scroll` and the generated scrollset's hint rendered unpositioned
  (24.08). The companion+bubble pair in a scroll section is centered,
  character LEFT of its bubble in an LTR row so the tail points at it.
- **A run of slides that scrolls is ONE screen.** pptx 78-82 is a single
  `kind: 'scrollset'` — one `.rs-block` section per slide, each question with
  its own צדקתי? and INLINE feedback, and Continue opening only when every
  question is answered AND the learner reached the end. Inline feedback is not
  draggable (only floating popups are).
- **No other screen scrolls.** Producer 21.08: never allow scroll on a normal slide —
  cap the art (`.pr-media img { max-height: 430px }`) so the content fits the
  stage. `check_structure.py` fails the build if anything lands off-stage.
- **Feedback continues behind a "המשך"** whenever the deck puts more reasoning
  off-canvas (דרך ב / דרך ג / סעיף ב). Pass `pages: [[...], [...]]` on the
  screen config — every engine renders the button and walks the pages.
- **Feedback tables render on white** (`.scq-popup .acq-table td`), never on
  the popup's green/red ground.
- **THE UNIT LAW (producer 31.08, definitive):** `%` sits to the RIGHT of the
  input/number; **word units (ש"ח, מ"ר, מ', מטרים, ק"ג, גרם, שחקנים…) and the
  ₪ symbol sit to the LEFT** — everywhere: input rows AND feedback equations.
  Inputs: the render adds `.unit-right` only when the row's unit is `%`.
  Equations: inside the LTR `g-eq` run the unit word moves BEFORE the number
  (`= מ"ר 750`), which is exactly how the deck's own math reads.
- **NEVER change a word on your own (producer 31.08).** The deck's unit words
  are copied verbatim — מ' stays מ', מטרים stays מטרים, even when a synonym or
  a "correction" seems right (slide 49's feedback says סמ"ר although the
  question says פיקסלים — built as written and flagged, not fixed). And the
  law cuts BOTH ways: what's already on a screen doesn't get "aligned" to the
  deck either without the producer asking — s48's מ"ר stays מ"ר (31.08).
- **Scrollset inline צדקתי? never becomes שנמשיך?** — once answered it just
  disables; only the screen's own Continue advances (producer 30.08).
- **Feedback persists across navigation (producer 24.08).** An answered
  question re-opens the verdict it ended on — green or red, floating popup or
  inline — when the learner comes back to it. Every show function records
  `q.result` (never the mid-attempt "try again"), `goTo()` still closes all
  popups so nothing leaks, and `restoreFeedback(n)` re-shows the remembered
  verdict for every engine key belonging to screen n (`sN` and `sNq*`).
- **An equation never breaks mid-expression (producer 31.08).** If the line is
  full the WHOLE equation moves down. The rule now covers every feedback body
  (`.scq-popup-body`, `.acq-popup-body`, `.rs-feedback`) at any depth, plus
  `.g-eq` blocks; an equation written in the RTL run (unit words on both sides
  of the operator, e.g. `= 1000 מ"ר – 1200 מ"ר`) gets `class="eq-keep"`, since
  a `dir="ltr"` wrapper would flip it.
- **`.eq-unit` is global, not `.g-eq`-only.** The unit word binds to ITS number
  only when the isolate is inside the LTR run — `50 · 20 =
  <span class="eq-unit" dir="rtl">1000 מ"ר</span>`. Leaving the unit outside
  the LTR span parks it at the far LEFT of the whole equation, several tokens
  away from the number it belongs to (s43 shipped that way until 31.08).
- **Feedback popups are ALWAYS draggable** — the `onpointerdown` hook, not just
  `cursor: move`. Long ones cap at 520px and scroll.
- **Practice screens:** photo on the LEFT of the text; a photo repeats on every
  sub-question slide whose rels contain it (check the rels, not just the first
  slide). Progress strip: station 1 is the RIGHTMOST, station count = the real
  number of numbered questions.
- **Speech bubbles 20px** with padding; body text goes to 24px on screens with
  a lot of empty room.
- **18px floor everywhere**, including hover labels and text inside children.
- The report flag is on every screen and must OPEN (assert a real box, not the
  `hidden` attribute).

- **Hint gating (QA 05.10.26):** the hint on all of component 02 (dev 28-34), all of component 05 (dev 48-57), on every inline question of
  the peak-question scrollset (dev 59) and on all of component 07 (dev 62-64)
  appears only after the first wrong attempt. One list drives it —
  `HINT_AFTER_FIRST_TRY` in `unit-js/main.js`; `hintGated()` maps an inline id
  (`s59q2`) to its screen (`s59`), and the VIQ / MCQ retry branches call
  `revealHintButton` like SCQ/DQ already did. Adding a screen = adding its id.
- **No stepper on the peak questions (QA 05.10.26):** `PR_NO_STEPPER = ["E"]`
  keeps `set`/`q` (results, xAPI) but emits no strip on component 07. The
  scrollset (component 06) never drew one.

### Deck discrepancies flagged, built as noted
- Set A's strip art shows 6 stations, the transition says 5 — built 5 (the real
  count of numbered questions). Set B's shows 5 and is built as 5, with q5
  covering slides 60-61 (the deck omits the strip on those two pages).
- Slide 71's second conclusion reads "מחיר המחשבון המדעי הוא 200 ₪" where the
  arithmetic and the sentence before it mean **היומן**. Built as היומן.

- Slide 70 (multi-select): the feedback line "התשובות הנכונות הן ב, ד" refers to
  the RENDERED page's option order — the green marks are on "יכולים לתת סכומי
  הנחה זהים" and "כנראה אם מחיר המחשבון היה גבוה…". Built in the rendered order
  with that key (30.08). Reading the key from the feedback letters alone,
  against a differently-ordered opts array, shipped a wrong key.
- Slide 73's feedback says "משקל החליפה על כדור הארץ" where the question asks
  the astronaut+suit total — built as משקלו הכולל של האסטרונאוט (יחד עם החליפה).

### Still open
- Slide 11 image and the 18/19 popup art are still placeholders.

---

## Folder structure (migrated 16.09.26)

This unit now ships in the **client's component structure**. The split is the
deck's own — slides 2/41/51/62/65/76/84 are separator slides that name each
component, so the boundaries are read, not chosen:

| component | name | screens | deck slides |
|---|---|---|---|
| `…-01` | הוק והקנייה | 0–25 | 3–40 |
| `…-02` | תרגול סטנדרטי א | 26–34 | 42–50 |
| `…-03` | תרגול בסיסי וסטנדרטי ב | 35–44 | 52–61 |
| `…-04` | משימת כיתה | 45–46 | 63–64 |
| `…-05` | תרגול מתקדם | 47–57 | 66–75 |
| `…-06` | שאלת שיא | 58–59 | 77–83 |
| `…-07` | שאלת שיא מועד ב | 60–64 | 85–90 |

- **Screen numbers stay global (0–64) across all seven components.** A component
  is bounded by `window.PART_CONFIG = { start, end, next, prev }` in its `script.js`,
  nothing else. Never renumber a screen to make it local.
- **All behaviour lives in `unit-js/main.js`**, shared by every component. A
  component folder holds only `index.html` and `script.js` (config only) —
  styling is `unit-css/styles.css`, assets are `unit-assets/` (08.10.26, below).
- `inThisPart(n)` gates both screen builders, so a component emits only its own
  markup — otherwise every part would also render the other six and pull their
  media.
- **The platform owns routing (since 08.10.26 here; guide §8.12).** Walking past
  `end` ENDS the component — `leaveToPart()` / `finishUnit()` send the component
  `completed` and disable the button; nothing navigates. The hop to `next`
  survives only under `?dev=1` without `?registration` (`DEV_NAV`), and the first
  screen's cross-part "חזרה" is hidden in production. `next`/`prev` are slugs.
- The old single-folder build is still at `units/methodica-math-percent-04/`.

## Reporting, issue reporting, resume (added 08.10.26)

The 720 platform layer is vendored from `methodica-math-ratio-02` (same engine
lineage). Spec: `2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`.

- **Load order** in every component (load-bearing): `10-identity → 20-xapi →
  40-resume → 50-loader → script.js → main.js → 90-boot`. `90-boot.js` is the only
  file with top-level side effects. No name may be declared both in a numbered file
  and in `main.js` / a `script.js`.
- **The map is the design record:** `docs-and-tools/XAPI-MAP.md`. Each `script.js`
  holds `SCREEN_TO_SUBCONTENT` (global screens, exactly its own range),
  `XAPI_EVAL_ITEMS`, `PART_SCORING`; `main.js` holds `XAPI_QMAP` (which catalogue
  question each answer is) and `SET_GATES`. **Re-extracted metadata = re-derive the
  map first** — item numbers move.
- **A new question / screen** = its `script.js` map entry + an `XAPI_QMAP` row + one
  `xapiReport(...)` line after the check's guards + `flushResumeSave()` after its
  last commitment + a painter case if it is a new engine. Then run `_test/`.
- **Decisions (08.10.26, unit owner):** 01-004 q3/q6/q8 are never reported (worked
  steps, no learner input — a note to the metadata team is in XAPI-MAP.md); the
  component 03 "3 of 4" (screen 35) is ENFORCED — below it the component ends at s41;
  a station counts only if all its parts are correct.
- **Resume** = one state document per component (v6). Capture takes learner state
  only — never engine configuration (`correctId`, `answers`, `body`…), or a content
  fix would never reach a returning learner. Painters run on every `goTo` and after
  a load; they are DOM-only and idempotent.
- **Issue report** ("מצאתם בעיה?") stays in `main.js` (native-select dialog, as in
  ratio-02). One shared 720 Google Form — never change `REPORT_FORM_ACTION` or a
  field key.
- **`?v=`** on every code reference, identical in all 7 `index.html`, bumped in the
  same commit as the file. **Tests:** `_test/README.md`. **Packaging:**
  `pwsh -File docs-and-tools/build-package.ps1 -DryRun` (no root file ships).

### Assets — ONE copy for the whole unit (hoisted 08.10.26)
```
unit-assets/fonts/   Assistant 400/600/700/800 (.ttf)
unit-assets/img/     the full image tree (incl. hint/ sprites)
unit-assets/video/   every character clip, each stored once
unit-css/styles.css  the one stylesheet
```
Components hold **no** `assets/` and no `styles.css`. Before this, all seven
carried byte-identical copies (≈52 MB of duplicates in 73 MB).

- **Never range-split assets** (the 17.09 lesson still stands): the engine builds
  names at runtime — `ACQ_STEPS` popup art, click-hint sprites, `character-*`
  poses, PR `media:`/`video:`/`char:`/`img:` keys, `tag-*.png` rows. That is why
  the whole tree is hoisted, not a per-range scan of it.
- **Every reference is `../unit-assets/…`** — from `main.js` and markup (resolved
  against the component's document) and from `unit-css/styles.css` (a CSS `url()`
  resolves against the stylesheet; it lands on the same folder).
- **Fonts:** only the rendered weights ship. 800 is not named by any rule — it is
  the UA's `b, strong { font-weight: bolder }` inside 600 text — keep it.
- **New asset = one file in `unit-assets/`**, lowercase directories, then
  `node _test/asset-contract.js` (case-exact; Windows hides wrong-case names the
  CDN 404s). A code change to `main.js` / `styles.css` = bump its `?v=` in all
  seven `index.html` in the same commit. Media never takes `?v=` — rename instead.
- Never named anywhere (kept, flagged 08.10): `benches.png`,
  `btn-flag-default.png`, `btn-flag-hover.png`, `warmup-hero.png`,
  `well-done-hero.jpg` (~75 KB).
