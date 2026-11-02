# xAPI map — methodica-math-percent-04

Screen → catalogue item → catalogue question, for all seven components, derived 08.10.26 from
`metadata/*.json` (team update of 30.09) against the built screens. This is the design record behind
each component's `SCREEN_TO_SUBCONTENT` / `XAPI_EVAL_ITEMS` / `PART_SCORING` (`script.js`) and the
unit-wide `XAPI_QMAP` / `SET_GATES` (`unit-js/main.js`). If the metadata is re-extracted, re-derive
this table first — item numbers move (guide §4.6).

Ids: component `…/math/percent/04/<comp>/`, item `<comp id><comp>-NNN/`, question `<item id>qN`.
Screens are **global** (0–64); each component's map covers its own `[start..end]` only.

Legend: **T** transition / narrative screen → `null` (no item). *eng* = the engine key that reports.

## 01 — בואו נלמד משהו חדש (instruction) · screens 0–25

| screens | item | questions → screen (*eng*) |
|---|---|---|
| 0 | 001 הטעות של סיוון (motivational) | q1 choice → s0 (`s0Check`, one attempt) |
| 1–4 | 002 הגדלה באחוזים | q1 matching → s2 (*DQ*) · q2 → s3 (*SCQ*) · q3 → s4 (*SCQ*) |
| 5–8 | 003 הקטנה באחוזים | q1 matching → s6 (*DQ*) · q2 → s7 · q3 → s8 (*SCQ*) |
| 9 | T | — |
| 10–20 | 004 נפתור יחד (solved-exercise) | q1 → s10 · q2 → s11 · q4 → s15 · q5 → s16 · q7 → s18 (*GUIDED*, one tap) |
| 21 | T | — |
| 22–23 | 005 מקרר | q1 → s22 (*SCQ*) · q2 → s23 (*VIQ*) |
| 24–25 | 006 חממה | q1 → s24 · q2 → s25 (*VIQ*) |

⚠️ **004 q3 / q6 / q8 are not reported — decision 08.10.26.** They are `numeric` in the catalogue
(answers 3, 17, 170), but the UI only *shows* them as worked solutions (s12, s14/s17, s19/s20) —
the learner never types a value. Reporting them would invent data (guide D-9). A note to the
metadata team asks to drop them from item 004 (see the bottom of this file).

Screen 13 is a transition *inside* item 004's flow, so it maps to 004 (a `null` there would close
and reopen the item mid-exercise).

## 02 — זמן תרגול (practice, set A) · screens 26–34

| screens | item | questions |
|---|---|---|
| 26 | T — "צריך לענות נכון על 4 שאלות לפחות" | — |
| 27–28 | 001 כוכבי לכת | q1 → s28 (*SCQ*) |
| 29–31 | 002 שמן זית | q1 → s29 (*VIQ*) · q2 → s30 · q3 → s31 (*SCQ*) |
| 32 | 003 מסכות | q1 → s32 (*VIQ*) |
| 33 | 004 דיסקורד | q1 → s33 field 1 · q2 → s33 field 2 (*VIQ*, per-field verdict) |
| 34 | 005 עוגה | q1 matching → s34 (*DQ*) |

## 03 — זמן תרגול 2 (practice, sets B + F) · screens 35–44

| screens | item | questions |
|---|---|---|
| 35 | T — "4 שאלות … ענו נכון על 3 שאלות ומעלה כדי להתקדם" | — |
| 36 | 001 פלייליסט | q1 → s36 (*SCQ*) |
| 37 | 002 בגדים | q1 fill-in → s37 (*VIQ*, 3 labels = ONE question, all-or-nothing) |
| 38–39 | 003 נעליים | q1 → s38 · q2 → s39 (*SCQ*) |
| 40–41 | 004 כדורסל | q1 → s40 (*SCQ*) · q2 → s41 field 1 · q3 → s41 field 2 (*VIQ*) |
| 42 | T — "יופי של עבודה! הנה עוד 2 תרגילים" | — |
| 43 | 005 מגרש | q1 → s43 (*SCQ*) |
| 44 | 006 אמירה | q1 → s44 (*MCQ*) |

## 04 — משימה בחצר · screens 45–46

| screens | item | questions |
|---|---|---|
| 45 | T | — |
| 46 | 001 ספסלים (project-or-inquiry-task) | none — `questions: []`; item open/close only |

## 05 — בואו נאתגר את עצמנו (practice, set C) · screens 47–57

| screens | item | questions |
|---|---|---|
| 47 | T | — |
| 48–50 | 001 גינה | q1 → s48 · q2 → s49 (*VIQ*) · q3 → s50 (*SCQ*) |
| 51 | 002 שטיח | q1 → s51 (*VIQ*) |
| 52–53 | 003 מחשבון ויומן | q1 → s52 (*MCQ*) · q2 fill-in → s53 (*VIQ*, 2 fields = ONE question) |
| 54–55 | 004 מאדים | q1 → s54 (*SCQ*) · q2 → s55 (*VIQ*) |
| 56–57 | 005 גבינה | q1 → s57 (*SCQ*); s56 is its reading screen |

## 06 — שאלת שיא (assessment) · screens 58–59

| screens | item | questions |
|---|---|---|
| 58 | T — "יש בה 4 סעיפים. עליכם להצליח ב - 3 לפחות" | — |
| 59 | 001 קפיטריה | q1 → s59q1 · q2 → s59q2 (*VIQ*) · q3 → s59q3 · q4 → s59q4 (*SCQ*, inline in the scrollset) |

## 07 — שאלת שיא (assessment, set E) · screens 60–64

| screens | item | questions |
|---|---|---|
| 60 | T — "יש בה 3 סעיפים. עליכם להצליח ב-2 לפחות" | — |
| 61–64 | 001 עדכון גרסה | q1 → s62 · q2 → s63 · q3 → s64 (*SCQ*); s61 is its reading screen |

## Reporting rules (all components)

- **`answered` vs `answered.last`** — the guide's idiom: `isLast = correct || attempts >= 2`
  (every engine allows two attempts; GUIDED and s0 allow one, so they are always `.last`).
  Honest only with the Retry gate (§8.8 rule 9), which SCQ/VIQ/MCQ already had and DQ gets now.
- **Hints** — `requested.1` once per question (ledger in the state document). A screen-level hint
  on a two-question screen (s33, s41) belongs to its first question.
- **No unit-level statement**; the component `completed` goes out on the component's last click.

## Component result (`completed`) — decisions 08.10.26

A **station** (one numbered question on the strip = one catalogue item) is correct only if **all**
its catalogue questions are correct.

| comp | result | why |
|---|---|---|
| 01 | per-question: correct / reported, success ≥ 60 % | instruction; no promise on screen |
| 02 | stations 001–005, **success = 4 of 5** | screen 26 promises it; the component ends there anyway |
| 03 | stations 001–004, **success = 3 of 4**; 005/006 reported, outside the denominator | screen 35 promises "3 of 4"; 42–44 are the "2 harder" extras |
| 04 | `{success: true}`, no score | open task, no key — a score would be invented |
| 05 | stations 001–005, success ≥ 60 % (3 of 5) | no number promised on screen |
| 06 | per declared question, n = 4 (unanswered = wrong), **success = 3 of 4** | screen 58 promises "עליכם להצליח ב - 3 לפחות"; ends there anyway |
| 07 | per declared question, n = 3, **success = 2 of 3** | screen 60 promises "עליכם להצליח ב-2 לפחות"; ends there anyway |

### The component 03 gate (enforced — decision 08.10.26, guide §6.4)

Leaving s41 forward with **fewer than 3 of stations 001–004 correct ends component 03 there**:
`completed` with `success:false`, the score recorded, a flush, and **no navigation** — the platform
routes on `recommendedAfterFail`. Checked last in `advanceScreen()`, the one function every forward
path goes through (button and keyboard). Fails open while any of s36–s41 is unanswered. After a
reload the button is re-disabled only when the gate blocks **and** the ledger holds `done`.

## Note for the metadata team (not sent — for the unit owner to forward)

> **methodica-math-percent-04-01, item 004 (נפתור יחד: הנחה על בקבוק מיץ).** Questions q3, q6 and
> q8 (`numeric`, answers 3 / 17 / 170) are worked steps the lomda *displays*; the learner never
> enters a value. The lomda therefore never reports them, and they stay "not answered" in every
> attempt. Please remove them from the item (or reclassify the item's questions to the five the
> learner actually answers: q1, q2, q4, q5, q7).
>
> **methodica-math-percent-04-07.json** has `"order": 6`, the same as component 06. Probably 7.
