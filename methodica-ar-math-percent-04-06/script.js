'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-04-06 — component 06 of 07 · deck slides 77-83
   שאלת שיא

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 58, end: 59,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-ar-math-percent-04-07',
  prev: 'methodica-ar-math-percent-04-05'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-ar-math-percent-04-06.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-ar-math-percent-04-06';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-percent-04-06.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [58..59] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   58 T · 59 001 — the peak scrollset: s59q1..q4 are the item's q1..q4. */
var SCREEN_TO_SUBCONTENT = {
  58: null,
  59: ['001', 1]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* Assessment: scored over the 4 DECLARED questions, an unanswered one counts as wrong.
   Screen 58 promises "יש בה 4 סעיפים. עליכם להצליח ב - 3 לפחות" → success = 3 of 4. The component
   ends on this screen anyway, so the number sets success; it gates nothing. */
var PART_SCORING = { mode: 'questions', n: 4, need: 3 };
