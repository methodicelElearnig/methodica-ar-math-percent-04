# Translation Export Report — methodica-math-percent-04, Target 04

**Module root:** `units/methodica-math-percent-04`  
**Module name:** `methodica-math-percent-04`  
**Target:** `04`  
**Parts covered:** `(single-folder unit — no multi-part structure; see §1)`  
**Export type:** First export (no prior XLIFF for this target; §7 refresh workflow does not apply)  
**Files:** `methodica-math-percent-04_target-04_he.xlf`, `translation-screen-manifest.csv`, `sweep1-results.csv`, `sweep2-uncovered.csv`, `stats.json`, this report

---

## 1. Discrepancy check against the part list

**Structural discrepancy — reported, not worked around.** This unit has no multi-component (`-main`) structure: it is a single folder with `index.html` + `js/`. There is therefore no module-root redirect page and no shared `unit-js/`, so pseudo-part `00` does not apply. Everything is exported as part `01`. If this unit is later converted to the multi-component structure, the part segment of every id will change.

## 2. Totals

| Metric | Count |
|---|---|
| Total screens (incl. pseudo-screen `-99` chrome) | **67** |
| Total translation units | **909** |
| Manual-review-flagged units | **0** |
| Excluded strings (logged, §5) | **0** |

### Units per part

| Part | Units |
|---|---|
| `04-01` | 909 |

### Units per source file

| File | Units |
|---|---|
| `index.html` | 133 |
| `js/main.js` | 757 |
| `js/quiz-engine.js` | 19 |

### Units per screen

| Screen | Units |
|---|---|
| `04-01-00` | 16 |
| `04-01-01` | 5 |
| `04-01-02` | 16 |
| `04-01-03` | 15 |
| `04-01-04` | 16 |
| `04-01-05` | 5 |
| `04-01-06` | 14 |
| `04-01-07` | 15 |
| `04-01-08` | 19 |
| `04-01-09` | 5 |
| `04-01-10` | 7 |
| `04-01-11` | 7 |
| `04-01-12` | 4 |
| `04-01-13` | 2 |
| `04-01-14` | 4 |
| `04-01-15` | 6 |
| `04-01-16` | 6 |
| `04-01-17` | 4 |
| `04-01-18` | 6 |
| `04-01-19` | 4 |
| `04-01-20` | 4 |
| `04-01-21` | 5 |
| `04-01-22` | 9 |
| `04-01-23` | 10 |
| `04-01-24` | 10 |
| `04-01-25` | 10 |
| `04-01-26` | 4 |
| `04-01-27` | 5 |
| `04-01-28` | 9 |
| `04-01-29` | 7 |
| `04-01-30` | 10 |
| `04-01-31` | 6 |
| `04-01-32` | 10 |
| `04-01-33` | 18 |
| `04-01-34` | 12 |
| `04-01-35` | 4 |
| `04-01-36` | 22 |
| `04-01-37` | 6 |
| `04-01-38` | 18 |
| `04-01-39` | 15 |
| `04-01-40` | 11 |
| `04-01-41` | 14 |
| `04-01-42` | 4 |
| `04-01-43` | 26 |
| `04-01-44` | 17 |
| `04-01-45` | 4 |
| `04-01-46` | 7 |
| `04-01-47` | 4 |
| `04-01-48` | 25 |
| `04-01-49` | 28 |
| `04-01-50` | 26 |
| `04-01-51` | 15 |
| `04-01-52` | 20 |
| `04-01-53` | 16 |
| `04-01-54` | 18 |
| `04-01-55` | 5 |
| `04-01-56` | 18 |
| `04-01-57` | 5 |
| `04-01-58` | 53 |
| `04-01-59` | 3 |
| `04-01-60` | 5 |
| `04-01-61` | 4 |
| `04-01-62` | 17 |
| `04-01-63` | 17 |
| `04-01-64` | 13 |
| `04-01-65` | 3 |
| `04-01-99` | 161 |

## 3. Excluded strings, with reasons

No strings were excluded by the console/diagnostic rule in this module.


Also excluded per template v2 §5, and confirmed by sweep 2 rather than assumed: source comments (including Hebrew ones quoting producer PPT notes), regex character classes over the Hebrew alphabet, decorative `aria-hidden` subtrees and `<svg>` icon markup, CSS/DOM identifiers and asset paths, and bare numerics.

## 4. Out of scope (still needs translating by someone)

- YouTube caption tracks for any embedded video live in YouTube, not in these files.
- `metadata/*.json` carries Hebrew but is authoring/reporting data consumed by KATA, not rendered by the lomda. If it needs localising that is a separate pass.

## 5. Placeholders and inline markup

- Inline markup (`<strong>`, `<br>`, `<span dir="ltr">`) is stored as escaped literal text in `<source>` and round-trips. `<span dir="ltr">` around arithmetic is load-bearing in an RTL page and must never be dropped or repositioned.

- Runtime-concatenated values use the single form **`{value}`** throughout (template v2 §5). No angle-bracket placeholder form appears anywhere in this export.

- Multi-line elements are joined onto one line, preserving `<br>`; the stored source therefore does not byte-match the file. Every such unit is enumerated in `sweep1-results.csv` as `normalised`.

## 6. Correctness logic

720 templates key correctness off `data-id` / element ids, not displayed text, so answer options can be translated freely. Reviewed for exceptions in this module; any string that is DOM-mirrored from a JS constant is flagged `manual-review` in the manifest.

## 7. Verification (§10)

### Sweep 1 — every unit still matches its source

- **855 / 909 (94.1%) match literally.**
- **47 normalised** — multi-line joins, preserved inline markup, and `{value}` placeholder substitution. Each is listed individually in `sweep1-results.csv`.
- **7 enumerated exceptions**, each carrying its reason in the CSV:
  - `04-01-99-132` (js/main.js) — multi-line join / inline markup
  - `04-01-99-133` (js/main.js) — placeholder substitution ({value})
  - `04-01-99-137` (js/main.js) — multi-line join / inline markup
  - `04-01-99-138` (js/main.js) — placeholder substitution ({value})
  - `04-01-99-139` (js/main.js) — multi-line join / inline markup
  - `04-01-99-145` (js/quiz-engine.js) — placeholder substitution ({value})
  - `04-01-99-152` (js/quiz-engine.js) — multi-line join / inline markup

### Sweep 2 — no Hebrew in the source is uncovered

- Every Hebrew-bearing fragment in every scanned file was independently extracted and checked against the XLIFF. **28 fragments were not covered, and all 28 are classified:**
  - 26 — source comment (excluded by template v2 §5)
  - 2 — regex character class in code — not content (§5 exclusion)
- **Genuine misses: 0.** Nothing in the source is uncovered.

### Structural checks

- XML well-formed: verified by parsing the written file.
- Unit ids unique: 909 distinct of 909.
- Every unit carries a `screen-id` note; every screen id used by a unit exists in the manifest, and every manifest row is referenced.
- Every `<target>` is empty. Source language `he`. UTF-8, no BOM.
- Id shape `{target}-{part}-{screen}-{string}`, three digits per segment: verified for all units.

## 8. Manual review

No content defects were surfaced by extraction in this module. Screens built at runtime from a JS config have no derivable human title and are marked in the manifest's `manual_review` column so a reviewer can name them.


## 9. Production files

**No production file was read-modified.** This export only creates files under `translations/`. That folder is untracked unless committed — everything in it, including a translator's returned work, can be lost without trace. **Recommend committing it.**
