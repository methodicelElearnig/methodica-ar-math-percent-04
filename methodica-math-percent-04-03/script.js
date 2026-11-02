'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-04-03 — component 03 of 07 · deck slides 52-61
   תרגול בסיסי וסטנדרטי ב

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 35, end: 44,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-math-percent-04-04',
  prev: 'methodica-math-percent-04-02'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-math-percent-04-03.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-math-percent-04-03';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-04-03.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [35..44] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   35 T ("ענו נכון על 3 שאלות ומעלה כדי להתקדם") · 36 001 · 37 002 · 38-39 003 · 40-41 004
   (41 = q2+q3, one per field) · 42 T · 43 005 · 44 006. */
var SCREEN_TO_SUBCONTENT = {
  35: null,
  36: ['001', 1],
  37: ['002', 1],
  38: ['003', 1],
  39: ['003', 2],
  40: ['004', 1],
  41: ['004', 2],
  42: null,
  43: ['005', 1],
  44: ['006', 1]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1, '005': 1, '006': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* Screen 35 promises "3 of 4" over set B (items 001-004). It is ENFORCED (SET_GATES in main.js,
   decision 08.10): below it the component ends at s41. 005/006 (the two harder extras after s42)
   are reported but sit outside the promised denominator. */
var PART_SCORING = { mode: 'stations', items: ['001', '002', '003', '004'], need: 3 };
