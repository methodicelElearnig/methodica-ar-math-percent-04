# `_test/` — methodica-ar-math-percent-04

**Never deployed.** `docs-and-tools/package-allowlist.ps1` excludes this folder, including the
library stub. The stub shares its basename with the real CDN library on purpose.

## One-time setup

jsdom has to live **outside OneDrive**. A sync client inside `node_modules` corrupts installs.

```bat
mkdir %TEMP%\lomda-test && cd /d %TEMP%\lomda-test && npm install jsdom
```

## Run (from the repo root)

```bat
set NODE_PATH=%TEMP%\lomda-test\node_modules
node _test\verify-report.js          &rem structure  — ~600 assertions, includes the asset contract
node _test\statement-flow.js         &rem behaviour  — ~110 assertions
node _test\flow-mutations.js         &rem 13 planted defects, every one must be CAUGHT
node _test\asset-contract.js         &rem assets only, no jsdom needed
node _test\asset-contract-mutations.js
node _test\write-guard.js
node _test\responses.js              &rem result.response = Kata's pattern, every reported question
node _test\responses-mutations.js    &rem the 93c9780 response layer must FAIL responses.js
```

All of them exit 0 on success.

## What each file guards

| File | Guards |
|---|---|
| `verify-report.js` | Ids are byte-equal to `metadata/`. Each `SCREEN_TO_SUBCONTENT` covers exactly its component's screens. Every catalogue item has a screen, and every declared question is reported or **waived** (01-004 q3/q6/q8, decision 08.10). No question is reported twice. Script-tag order is correct, the library letter is inside the gate regex, and no identifier is declared in two layers. Storage keys agree (`UI_CHARACTER_KEY` = `CHARACTER_STORAGE_KEY`, `RESULT_KEYS` = `UNIT_SCORE_KEYS`). The flush follows the last commitment in every check function (D-13). The off-platform regression gate holds. Flags appear on every screen. The asset contract passes. |
| `statement-flow.js` | Fresh load. The component-03 gate: fail flow, exact sequence, result, stays put, idempotent, dead button after reload (rule 12); pass flow, with 005/006 outside the denominator. Stations need all parts correct. s33/s41 report per field. The DQ retry gate (D-14). Guided steps report exactly q1/q2/q4/q5/q7. The task sends success with no score. Assessments use the declared denominator. Hints are sent once. Resume: no configuration in the document, the pending attempt is restored, no re-report, no duplicate `completed`. Repaint parity, live vs reloaded, screen by screen. Painters never throw (3 states × 7 components × every screen). |
| `responses.js` | `result.response` (guide §6.3c, MOE runbook §3, 15.11.26). Every reported question answered correctly through its real engine sends exactly its `correctXapiResponsesPattern` from `metadata/` (which equals Kata): choice, multi-select clicked in reverse (`[,]`, answers order), the three one-source matching dropdowns (`source[.]target`), numeric, and the two multi-field fill-ins as Kata's `label: value, …` sentence. Every option of a choice/dropdown screen resolves to a metadata answer (s59q1's tables by position). Typed variants, no ` \| `/`=`/ids, the retired `xapiZoneAnswer`/`xapiFieldsAnswer`/`xapiMultiAnswer` absent. |
| `responses-mutations.js` | Runs `responses.js` on a copy with `93c9780`'s `20-xapi.js`, `main.js`, or both: each must fail (44 `[resp]` failures with the old `20-xapi.js`). |
| `asset-contract.js` | Unit-level asset layout. Paths are case-exact; Windows hides wrong case, the CDN does not. `?v=` is on every code reference and identical across components. |
| `write-guard.js` | No write before the restore + the leave save (BOOT-AND-RESUME-HARDENING-2026-11-03.md §2.6, §2.10; 13.11.26, ported from proportion-01 on `jsdom-harness.js`, its jsdom boot retargeted): drain as read, `markSent` in memory before stage B, a failed read closes every write; the source shape of `40-resume.js` / `50-loader.js` (landing = `PART_CONFIG.start`); every part's inline `__resumeInFlight` (11000 ceiling), preloads equal to the loader's URL, preconnect, lazy images off the landing screen, no hidden autoplay clip with an inline `src`; the leave save on `-l` and `-k`. 49 of its 90 checks fail on the 2026-10-08b package. |
| `xapi-720-l.js` | The `-k` stub plus `saveState720OnLeave` (`__leaveWrites()`). The other suites still load `xapi-720-k.js`. |
| `xapi-720-k.js` | Local stand-in for the CDN library, loaded only with `?xapiLib=../_test/xapi-720-k.js` on localhost. It mirrors the real library's drop gate and its fire-time serialisation. Console helpers: `__stmts() __state() __dupes() __reset() __failWrites(status) __setState(doc)`. |
| `harness.js` | Shared jsdom boot. The page's scripts run in tag order from disk, then the stub, then the loader's phase B, replayed by `finishBoot()`. |

## What jsdom cannot see — check in a real browser

jsdom does no layout, so every scroll-to-end latch reads as reached. It also never fetches CSS
or media. For those, serve the **parent** folder so the unit loads from a subpath. Then walk:

```
http://localhost:<port>/methodica-ar-math-percent-04/methodica-ar-math-percent-04-0N/index.html?xapiLib=../_test/xapi-720-k.js
```

Check with `__stmts()`, `__state()` and `__dupes()` in the console. Reload mid-question; it must
come back on the same screen with the same marks. Use `__reset()` between runs.

## Live Kata run

Only with the unit owner's go-ahead and a test learner's launch link. Follow guide §12. Never
print the launch URL or the token.
