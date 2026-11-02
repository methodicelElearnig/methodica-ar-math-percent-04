'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-04-01 — component 01 of 07 · deck slides 3-40
   הוק והקנייה

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 0, end: 25,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-math-percent-04-02',
  prev: null
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-math-percent-04-01.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-math-percent-04-01';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-04-01.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [0..25] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   0 001 · 1-4 002 · 5-8 003 · 9 T · 10-20 004 (guided; 13 is a transition INSIDE it) · 21 T ·
   22-23 005 · 24-25 006.  004's q3/q6/q8 are never reported (decision 08.10 — XAPI-MAP.md). */
var SCREEN_TO_SUBCONTENT = {
  0: ['001', 1],
  1: ['002', 1],
  2: ['002', 2],
  3: ['002', 3],
  4: ['002', 4],
  5: ['003', 1],
  6: ['003', 2],
  7: ['003', 3],
  8: ['003', 4],
  9: null,
  10: ['004', 1],
  11: ['004', 2],
  12: ['004', 3],
  13: ['004', 4],
  14: ['004', 5],
  15: ['004', 6],
  16: ['004', 7],
  17: ['004', 8],
  18: ['004', 9],
  19: ['004', 10],
  20: ['004', 11],
  21: null,
  22: ['005', 1],
  23: ['005', 2],
  24: ['006', 1],
  25: ['006', 2]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1, '005': 1, '006': 1 };

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* no PART_SCORING: per-question score, success >= 60 % (instruction; nothing promised on screen) */
