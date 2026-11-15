'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-04-07 — component 07 of 07 · deck slides 85-90
   שאלת שיא מועד ב

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 60, end: 64,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: null,
  prev: 'methodica-ar-math-percent-04-06'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-ar-math-percent-04-07.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-ar-math-percent-04-07';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-percent-04-07.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [60..64] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   60 T · 61-64 001 (61 is its reading screen; q1..q3 on 62..64). */
var SCREEN_TO_SUBCONTENT = {
  60: null,
  61: ['001', 1],
  62: ['001', 2],
  63: ['001', 3],
  64: ['001', 4]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* Assessment: scored over the 3 DECLARED questions, an unanswered one counts as wrong.
   Screen 60 promises "יש בה 3 סעיפים. עליכם להצליח ב-2 לפחות" → success = 2 of 3. The component
   ends on its last screen anyway, so the number sets success; it gates nothing. */
var PART_SCORING = { mode: 'questions', n: 3, need: 2 };
