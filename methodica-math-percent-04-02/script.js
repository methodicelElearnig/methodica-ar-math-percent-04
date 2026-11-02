'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-04-02 — component 02 of 07 · deck slides 42-50
   תרגול סטנדרטי א

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 26, end: 34,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-math-percent-04-03',
  prev: 'methodica-math-percent-04-01'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-math-percent-04-02.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-math-percent-04-02';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-04-02.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [26..34] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   26 T ("צריך לענות נכון על 4 שאלות לפחות") · 27-28 001 · 29-31 002 · 32 003 · 33 004 (2 q,
   one per field) · 34 005. */
var SCREEN_TO_SUBCONTENT = {
  26: null,
  27: ['001', 1],
  28: ['001', 2],
  29: ['002', 1],
  30: ['002', 2],
  31: ['002', 3],
  32: ['003', 1],
  33: ['004', 1],
  34: ['005', 1]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1, '005': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* Screen 26 promises "4 of 5": a station (= item) counts only if ALL its questions are correct
   (decision 08.10). The component ends here anyway, so this sets success, it gates nothing. */
var PART_SCORING = { mode: 'stations', items: ['001', '002', '003', '004', '005'], need: 4 };
