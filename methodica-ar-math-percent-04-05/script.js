'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-04-05 — component 05 of 07 · deck slides 66-75
   תרגול מתקדם

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 47, end: 57,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-ar-math-percent-04-06',
  prev: 'methodica-ar-math-percent-04-04'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-ar-math-percent-04-05.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-ar-math-percent-04-05';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-percent-04-05.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [47..57] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   47 T · 48-50 001 · 51 002 · 52-53 003 (53 = one fill-in over 2 fields) · 54-55 004 · 56-57 005. */
var SCREEN_TO_SUBCONTENT = {
  47: null,
  48: ['001', 1],
  49: ['001', 2],
  50: ['001', 3],
  51: ['002', 1],
  52: ['003', 1],
  53: ['003', 2],
  54: ['004', 1],
  55: ['004', 2],
  56: ['005', 1],
  57: ['005', 2]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1, '005': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* Five stations, no number promised on screen → success at the 60 % default (3 of 5). */
var PART_SCORING = { mode: 'stations', items: ['001', '002', '003', '004', '005'] };
