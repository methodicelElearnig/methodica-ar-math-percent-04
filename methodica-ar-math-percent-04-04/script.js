'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-04-04 — component 04 of 07 · deck slides 63-64
   משימת כיתה

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/main.js —
   screens keep the unit's global numbering (0-64) across all seven
   components, and this part's range is what bounds navigation.
   Boundaries come from the deck's own separator slides (2/41/51/62/65/76/84),
   which name each component.
   ═══════════════════════════════════════════════════════════════════ */
window.PART_CONFIG = {
  start: 45, end: 46,
  /* slugs, not URLs — main.js builds '../<slug>/index.html' (a FILE: the MOE CDN serves a folder URL
     as 200 with 0 bytes). Used only under DEV_NAV: the platform owns routing (guide §8.12). */
  next: 'methodica-ar-math-percent-04-05',
  prev: 'methodica-ar-math-percent-04-03'
};

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; ../unit-js/ reads it at CALL time. Design record: docs-and-tools/XAPI-MAP.md.
   XAPI_COMP_ID must equal metadata/methodica-ar-math-percent-04-04.json "id" byte-for-byte, trailing slash included. */
var XAPI_COMP_SLUG     = 'methodica-ar-math-percent-04-04';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-percent-04-04.json';

/* screen -> [item suffix, page-within-item]; null = no catalogue item (transition / narrative).
   ⚠️ GLOBAL screen numbers, THIS component's [45..46] only — exactly one key per screen; a
   missing key is silently a screen that never reports. _test/ asserts both directions against
   metadata/.
   45 T · 46 001 — the open task: no answer key and no catalogue question (questions: []). */
var SCREEN_TO_SUBCONTENT = {
  45: null,
  46: ['001', 1]
};

/* Items that carry a code-graded question (expectsAnswer on their 'completed'). */
var XAPI_EVAL_ITEMS = {};

/* Each graded item's 'completed' carries an explicit result (per-question ratio, main.js
   itemResultFor) — the library's own aggregate is an all-correct AND. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
  XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
});

/* An open task: {success: true} and NO score — a score would be a number nobody measured. */
var PART_SCORING = { mode: 'task' };
