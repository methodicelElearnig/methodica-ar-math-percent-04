'use strict';
/* ═══════════════════ xAPI (720) — identity ═══════════════════
   Shared by all seven components of methodica-math-percent-04. Loaded first.
   Vendored from methodica-math-ratio-02 (same engine lineage); per-unit values only.

   Canonical id prefix for this unit. Every COMPONENT / ITEM / QUESTION id the lomda reports is
   built from it and must match metadata/*.json byte-for-byte, INCLUDING the trailing slashes
   (components and items end in '/', questions do not — checked against metadata 30.09.26). */
var XAPI_ID_PREFIX = 'https://lomdot.education.gov.il/metodica/720active/math/percent/04/';

/* The unit id is the BARE SLUG, exactly as metadata/methodica-math-percent-04_unit.json `id`
   and every component's `learningUnitId` carry it (MOE v2.5 §2.7 dropped the IRI requirement for
   the content unit only — guide §4.2; mass-measure-03 and percent-02 do the same).
   ⚠️ Must equal the unit metadata `id` whatever shape that is. It is not sent as any statement's
   object (there is no unit-level statement since 2026-09-16); the library keys its localStorage
   fallback on it. */
window.XAPI_UNIT_ID = 'methodica-math-percent-04';

/* Last path segment of a canonical id — the short slug the bug-report form records. */
function shortId(u){ return String(u || '').replace(/\/+$/, '').split('/').pop(); }

/* Resume (KATA State API) — ACTIVE.
   True also switches the loader to xapi-720-l.js (13.11.26; -k before — -l is -k plus the leave save,
   saveState720OnLeave, and every part's <head> preloads that exact URL), which carries the State transport that -i lacks
   plus diagnostics on the state layer (stateLastResult720). So this flag changes reporting too,
   not only restore — see 50-loader.js. Design: Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md.

   What is implemented (40-resume.js): one state document PER COMPONENT (v6 — Kata mints one
   ?registration per {learner, component}), a screen pointer within the component, the part's own
   answers/verdicts, the unit character, and the 'completed' ledger — which lives in the document
   and therefore survives tab closure. */
var RESUME_ENABLED = true;

/* ── The platform owns routing (2026-09-16; guide §8.12) ──
   Kata launches each component on its own URL with its own ?registration, and routes on our
   'completed' statements. The unit therefore no longer moves between components by itself: the
   last-screen buttons report and stop, the first-screen "חזרה" is hidden, and the loader's resume
   hop is gone. The navigation code is kept for local walkthroughs behind this flag — and ONLY when
   the page was not launched by the platform: every Kata launch URL carries ?registration, and a hop
   in a real session would report the next component under this component's registration. So the
   flag is refused outright whenever ?registration is present, whatever else the URL says. */
var DEV_NAV = false;
try {
  var _devQ = new URLSearchParams(location.search);
  DEV_NAV = _devQ.get('dev') === '1' && !_devQ.has('registration');
} catch (e) {}
