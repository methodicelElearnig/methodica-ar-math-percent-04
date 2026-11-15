'use strict';
/* ═══════════════════ xAPI (720) — item scope + question ids ═══════════════════
   Shared by all five components. Definition-only; 90-boot.js drives startup via bootXAPI().
   See REPORT-XAPI.md for what each statement means and RESUME.md §8a for the 'completed' ledger.

   Per-part seams read at CALL time (each component's own script.js declares them):
     SCREEN_TO_SUBCONTENT   screen -> [item suffix, page-in-item]; null = no catalog item
     XAPI_COMP_SLUG         e.g. 'methodica-math-ratio-02-02'
     XAPI_COMP_ID           XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/'
     XAPI_EVAL_ITEMS        items that carry a graded question IN CODE
     XAPI_ITEM_RESULT       optional; item suffix -> function returning an explicit result
   Every read is guarded with typeof, so a component that omits an optional one degrades to the
   neutral value instead of throwing inside a statement path — where the surrounding try/catch
   would swallow it and the statement would vanish silently. */

function xapiItemId(suffix){ return XAPI_COMP_ID + XAPI_COMP_SLUG + '-' + suffix + '/'; }
function _xapiTrim(u){ return String(u == null ? '' : u).replace(/\/+$/, ''); }

/* Visible answer text for result.response. Clones first so the live DOM is untouched, and drops
   the ⓘ tooltip nodes that textContent would otherwise splice into the middle of a label. */
function xapiAnswerText(el){
  if (!el) return '';
  var c = el.cloneNode(true);
  var drop = c.querySelectorAll('.scq-info, .scq-tooltip, .s5-opt-info, .opt-tooltip');
  for (var i = 0; i < drop.length; i++) { drop[i].remove(); }
  /* QA 2026-10-02 F-2: a stacked fraction (.frac > .frac-num + .frac-den) draws its bar as a CSS
     border, so textContent read 2/3 as "23". Write it back as num/den. */
  var fr = c.querySelectorAll('.frac');
  for (var j = 0; j < fr.length; j++) {
    var num = fr[j].querySelector('.frac-num'), den = fr[j].querySelector('.frac-den');
    if (num && den) fr[j].textContent = ' ' + num.textContent.trim() + '/' + den.textContent.trim() + ' ';
  }
  /* A <br> is a line break on screen, a space in the text (it glued two words otherwise). */
  var br = c.querySelectorAll('br');
  for (var k = 0; k < br.length; k++) { br[k].replaceWith(' '); }
  return c.textContent.replace(/\s+/g, ' ').trim();
}

/* Question context. metadata/<component>.json is the single source of truth for question ids:
   look up subContent[<suffix>].questions[<qKey>] and return that questionId as-is when it is
   already absolute. Item matching is by '-NNN' suffix with trailing slashes normalised away, so
   re-syncing metadata from Kata can change the URL prefix without touching code. */
function xapiQ(suffix, qKey){
  var itemId = xapiItemId(suffix);
  var qid = null;
  try {
    var sc = (window.METADATA && window.METADATA.subContent) || [];
    for (var i = 0; i < sc.length; i++) {
      if (_xapiTrim(sc[i].id).slice(-(suffix.length + 1)) !== '-' + suffix) continue;
      var qs = sc[i].questions || [];
      for (var j = 0; j < qs.length; j++) {            // match the key, bare or in URL form
        var v = _xapiTrim(qs[j].questionId);
        if (v === qKey || v.slice(-(qKey.length + 1)) === '/' + qKey) { qid = qs[j].questionId; break; }
      }
      if (qid == null) {                               // fallback: positional, 'q3' -> index 2
        var n = parseInt(String(qKey).replace(/\D/g, ''), 10);
        if (n >= 1 && n <= qs.length) qid = qs[n - 1].questionId;
      }
      break;
    }
  } catch (e) {}
  if (qid == null) { console.warn('[xAPI] no metadata question', suffix, qKey); qid = qKey; }
  return { questionId: /^https?:\/\//.test(qid) ? qid : itemId + qid, parentId: itemId };
}

/* Per-question outcome, keyed '<item>/<q>'. Written by every answered site (outside its
   try/catch, so a reporting failure cannot corrupt the score) and read when the component
   'completed' is assembled. The library's own aggregate is an all-correct AND, which would
   report success:false for any partial pass, so a component that needs a partial score supplies
   its result explicitly (main.js: partResult / itemResultFor). Keys are '<item suffix>/<qKey>',
   which is what lets itemResultFor() find an item's questions by prefix without a question map. */
var XAPI_Q_RESULTS = {};
function xapiCorrectCount(){ return Object.keys(XAPI_Q_RESULTS).filter(function(k){ return XAPI_Q_RESULTS[k]; }).length; }

var xapiCurrentItem = null;

/* An explicit result for an item's 'completed', when the library's all-correct AND is wrong for
   it. Every component here builds XAPI_ITEM_RESULT from its own XAPI_EVAL_ITEMS, so every graded
   item supplies one, and this returns null for an item that is not graded — in this unit that is
   methodica-math-ratio-02-01-003, the guided worked example (see unit-js/README.md). */
function xapiItemResult(item){
  var map = (typeof XAPI_ITEM_RESULT !== 'undefined') ? XAPI_ITEM_RESULT : null;
  var f = map && map[item];
  return f ? f() : null;
}

function _xapiIsEval(item){
  return (typeof XAPI_EVAL_ITEMS !== 'undefined') && !!XAPI_EVAL_ITEMS[item];
}

/* ── Re-arm the library's per-page-load 'answered' memory after a restore ──────────────
   xapi-720-k.js gates an item's 'completed' on xapiItemAnswered[itemId], a map it fills ONLY
   from an 'answered' passing through in the SAME page load:

       if (sttmContext?.expectsAnswer && !xapiItemAnswered[_cid]) {
           console.log("[XAPI] item left unanswered — deferring 'completed': " + _cid);
           return;          // "deferring" is a DROP — there is no queue, flush or retry

   That guard is right within a session: it stops a learner who leaves a question backwards
   through goBack() from emitting a resultless 'completed' that would then block the real,
   scored one. But a resume deliberately does NOT re-send the answers it restores, so without
   the seeding below the library treats every previously answered item as unanswered and drops
   its 'completed' — while sendStatementOnce, having called the sender, marks the ledger sent.
   The lomda then never asks again, the library never retries, and the statement is lost for
   good. Verified live against Kata on 07.09.26: the ledger said sent while the library's own
   xapiCompletedObjects was still empty.

   Seeding puts the library back where it would have been had the learner never left. It emits
   nothing itself — it only unblocks the guard, and the 'completed' that follows carries the
   explicit result xapiItemResult() supplies, so nothing rides on the library's own scoring.

   Only items with a RECORDED ANSWER are seeded, so an item the learner never answered is still
   deferred and the goBack protection above is preserved.

   ⚠️ Must run after applyResumeVars (which repopulates XAPI_Q_RESULTS) and before any item
   boundary can be crossed. applyExecutionState calls it as its last act. */
function xapiSeedAnsweredFromResume(){
  if (!window.XAPI_USING_G) return;
  /* A silent no-op here would reintroduce the bug invisibly, so say so: the map is a plain
     global today, and would stop being reachable if the library moved it to const/let. */
  if (!window.xapiItemAnswered) {
    console.warn('[xAPI] xapiItemAnswered unreachable — item "completed" will be dropped after a resume');
    return;
  }
  Object.keys(XAPI_Q_RESULTS).forEach(function(k){
    var item = k.split('/')[0];
    if (item) window.xapiItemAnswered[xapiItemId(item)] = true;
  });
}

/* ── B-1 (QA 2026-10-02; port of methodica-science-mass-weight-01 5ad764d) ──
   The library DROPS an evaluated item's 'completed' when that item has no 'answered' in this page
   load (its "deferring" return: no queue, no retry). sendCompletedOnce cannot see that: it marks the
   ledger anyway, and the real, scored 'completed' after the learner comes back and answers is then
   suppressed forever. Live 2026-10-02: Back through an unanswered item (ar-mass-measure-02 01
   S6 -> S5, item 004; ar-mass-measure-03 01 S10 -> S9, item 007; ar-math-ratio-02 01 S3 -> S2,
   item 002) and Kata never received that item's 'completed'.
   So the close asks the library's own question first and, when the library would drop the
   statement, sends nothing and leaves the ledger untouched. Fallback when the map is unreachable:
   an answer recorded in XAPI_Q_RESULTS (restored by resume, the same predicate as the seed). */
function _xapiLibWouldDrop(item) {
  if (!_xapiIsEval(item)) return false;
  var m = window.xapiItemAnswered;
  if (m) return !m[xapiItemId(item)];
  return !Object.keys(XAPI_Q_RESULTS).some(function (k) { return k.split('/')[0] === item; });
}
function _xapiCloseItem(item) {
  if (_xapiLibWouldDrop(item)) return;
  try { sendCompletedOnce('doneItems', itemLedgerKey(item), 'question', xapiItemResult(item), { objectId: xapiItemId(item), expectsAnswer: _xapiIsEval(item) }); } catch (e) {}
}

/* ── B-2 (monday 13454123722, 2026-11-13): Back never closes an item ──
   The item closes only on a FORWARD move. A move is backward when the target screen ranks lower than the
   screen being left. A Back from a half-answered item used to send its 'completed' with the failed result
   at that moment, and the doneItems ledger then swallowed the real one after the learner came back and
   answered. The forward button is blocked until a question is finished, so the first forward close carries
   the final result. Rank: a numeric id is its number; a string id is its index in SCREEN_ORDER when the unit
   has one, else in SCREEN_TO_SUBCONTENT's key order. Screens in a part's XAPI_HUB_SCREENS (a lower screen a
   FORWARD route reaches) are never backward. This unit routes linearly (nextLiveScreen ±1): every lower move is a Back, so it lists no hub. The item comparison is the fallback for the first call.
   xapiFinishItems is unchanged: the end of a component always closes the open item. */
var _xapiLastScreen = null;
function _xapiScreenRank(s) {
  if (s == null) return null;
  if (typeof s === 'number' || /^\d+$/.test(String(s))) return Number(s);
  var order = (typeof SCREEN_ORDER !== 'undefined' && Array.isArray(SCREEN_ORDER)) ? SCREEN_ORDER
    : (typeof SCREEN_TO_SUBCONTENT !== 'undefined' && SCREEN_TO_SUBCONTENT) ? Object.keys(SCREEN_TO_SUBCONTENT) : [];
  var i = order.indexOf(s);
  return i < 0 ? null : i;
}
function _xapiIsBackward(fromItem, toItem, toScreen, fromScreen) {
  if (typeof XAPI_HUB_SCREENS !== 'undefined' && XAPI_HUB_SCREENS && XAPI_HUB_SCREENS[toScreen]) return false;
  var a = _xapiScreenRank(fromScreen), b = _xapiScreenRank(toScreen);
  if (a != null && b != null) return b < a;
  return !!(fromItem && toItem && Number(toItem) < Number(fromItem));
}

/* Item-level initialized/completed pairs, driven from goTo(). Paging inside one item emits
   nothing; the item closes when the learner enters a screen belonging to a different item. */
function xapiOnScreen(screen){
  /* Tracked before every early return, so the direction is right even across silenced calls (B-2). */
  var fromScreen = _xapiLastScreen;
  _xapiLastScreen = screen;
  if (!window.XAPI_USING_G || typeof sendStatement720 !== 'function') return;
  var map = (typeof SCREEN_TO_SUBCONTENT !== 'undefined') ? SCREEN_TO_SUBCONTENT[screen] : null;
  var item = map ? map[0] : null;
  if (item === xapiCurrentItem) return;
  if (xapiCurrentItem && !_xapiIsBackward(xapiCurrentItem, item, screen, fromScreen)) _xapiCloseItem(xapiCurrentItem);
  xapiCurrentItem = item;
  if (item) {
    try { sendStatement720('initialized', 'question', null, { objectId: xapiItemId(item), isEvaluationItem: _xapiIsEval(item) }); } catch (e) {}
  }
}

/* Close the last open item — called immediately before every component 'completed'. */
function xapiFinishItems(){
  if (!window.XAPI_USING_G || typeof sendStatement720 !== 'function') return;
  if (xapiCurrentItem) {
    _xapiCloseItem(xapiCurrentItem);
    /* Cleared whether or not the statement was suppressed: a latch left set would make the next
       xapiOnScreen try to close the same item all over again. */
    xapiCurrentItem = null;
  }
}

/* ═══════════════════ The call-site helpers ═══════════════════
   Every `answered` site used to be a 6–8 line block, duplicated 25 times across five files, and
   every hint site a 1-line raw send duplicated 23 times. These helpers turn each into one call.
   Less duplication means fewer places to get it wrong — and that is exactly the class of mistake
   the swallowing try/catch around each site was hiding.

   ⚠️ The write to XAPI_Q_RESULTS happens BEFORE the try/catch and outside it, not inside. That is
   an invariant from Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §2: a reporting failure must not be able to
   corrupt the score. It is now enforced in one place rather than relied on at 25 call sites. */

/* ═══════════════════ result.response — built from the metadata (guide §6.3c) ═══════════════════
   MOE's runbook (§3, 08.11.26) compares every 'answered' result.response with the question's
   correctXapiResponsesPattern in Kata, character by character. The call site therefore passes a
   SPEC, never a finished string — {choices}, {pairs}, {steps}/{values}, {value}, {text} — and the
   metadata's questionType decides how it is written. The strings emitted are the METADATA's, so a
   screen that words an option differently (a glued tooltip, a <br>, dash spacing) cannot leak.
   Ported 15.11.26 from methodica-math-percent-08 (3175b5b, itself percent-05's layer). Own
   additions: _xapiLoose (rule 1's dash/period tolerance, lookup only) and the fill-in sentence
   (Kata writes this unit's two multi-field fill-ins as "label: value, label: value"). It replaces
   xapiZoneAnswer / xapiFieldsAnswer / xapiMultiAnswer, which joined with ", " / " | " and sent
   element ids (runbook classes B, C, D). */

/* The metadata question object for (item suffix, qKey) — or null. Same matching as xapiQ. */
function _xapiFindQuestion(suffix, qKey) {
  try {
    var sc = (window.METADATA && window.METADATA.subContent) || [];
    for (var i = 0; i < sc.length; i++) {
      if (_xapiTrim(sc[i].id).slice(-(suffix.length + 1)) !== '-' + suffix) continue;
      var qs = sc[i].questions || [];
      for (var j = 0; j < qs.length; j++) {
        var v = _xapiTrim(qs[j].questionId);
        if (v === qKey || v.slice(-(qKey.length + 1)) === '/' + qKey) return qs[j];
      }
      var n = parseInt(String(qKey).replace(/\D/g, ''), 10);
      return (n >= 1 && n <= qs.length) ? qs[n - 1] : null;
    }
  } catch (e) {}
  return null;
}

/* performance steps as [{name, correctAnswer}]. Two metadata shapes: an explicit steps[], or the
   Kata shape (answers null, correctAnswers [{stepId, response}]). No performance question in this
   unit today; kept so the layer stays the family's copy. */
function _xapiSteps(q) {
  if (q.steps) return q.steps;
  var ca = q.correctAnswers || [];
  if (!ca.length || !ca.every(function (c) { return c && c.stepId != null; })) return null;
  return ca.map(function (c) { return { name: c.stepId, correctAnswer: c.response }; });
}

/* {questionId, parentId, questionType, answers, correctAnswers, steps, pattern} — one lookup. */
function xapiQMeta(suffix, qKey) {
  var ids = xapiQ(suffix, qKey), q = _xapiFindQuestion(suffix, qKey) || {};
  return { questionId: ids.questionId, parentId: ids.parentId,
           questionType: q.questionType || null,
           answers: q.answers == null ? null : q.answers,
           correctAnswers: q.correctAnswers || null,
           steps: _xapiSteps(q),
           pattern: Array.isArray(q.correctXapiResponsesPattern) ? q.correctXapiResponsesPattern : null };
}

var XAPI_SEP_LIST = '[,]', XAPI_SEP_PAIR = '[.]';
var _XAPI_DELIMS = /\[,\]|\[\.\]|\[:\]/g;

/* Bidi marks (LRM / RLM / ALM / embeddings / isolates) and ZWSP are invisible layout hints; the
   metadata never carries them. Escaped, so the source holds no invisible character. The Arabic
   twin needs this; the Hebrew screens carry none, and stripping them is harmless here. */
var _XAPI_BIDI = /[\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\u061C]/g;
function _xapiNorm(s) {
  s = String(s == null ? '' : s);
  if (s.normalize) s = s.normalize('NFC');
  return s.replace(_XAPI_BIDI, '').replace(/[\u05F3\u2019\u02BC]/g, "'").replace(/[\u05F4\u201C\u201D]/g, '"')
          .replace(/\s+/g, ' ').trim();
}
/* Lookup only (guide §6.3c rule 1): dash spacing and dash kind, and a closing full stop, do not
   decide which option was picked. The emitted string is still the metadata's. */
function _xapiLoose(s) {
  return _xapiNorm(s).replace(/\s*[-\u2010-\u2015\u2212]\s*/g, '-').replace(/\s*\.$/, '');
}
/* learner-typed text: the delimiters cannot be escaped in xAPI, so they are blanked */
function _xapiFree(s) { return _xapiNorm(s).replace(_XAPI_DELIMS, ' ').replace(/\s+/g, ' ').trim(); }
/* a typed number: spaces and thousands commas out */
function _xapiNumText(s) { return _xapiNorm(s).replace(/[\s,\u00A0]/g, ''); }

/* Resolve one UI value to the metadata entry it names. pool = array of metadata strings.
   value: a string (matched by _xapiNorm, then _xapiLoose) or a number (index into the pool).
   Returns {text, idx} — text is the METADATA string, byte for byte, when found. */
function _xapiPick(value, pool, item, qKey, where) {
  pool = pool || [];
  if (typeof value === 'number') {
    if (pool[value] != null) return { text: String(pool[value]), idx: value };
    console.warn('[xAPI] response: index ' + value + ' outside metadata ' + where, item, qKey);
    return { text: '', idx: 1e9 };
  }
  var n = _xapiNorm(value), i;
  for (i = 0; i < pool.length; i++) if (_xapiNorm(pool[i]) === n) return { text: String(pool[i]), idx: i };
  var l = _xapiLoose(value), hit = -1;
  for (i = 0; i < pool.length; i++) if (_xapiLoose(pool[i]) === l) { if (hit >= 0) { hit = -2; break; } hit = i; }
  if (hit >= 0) return { text: String(pool[hit]), idx: hit };
  if (n !== '') console.warn('[xAPI] response: "' + n + '" not in metadata ' + where, item, qKey);
  return { text: _xapiFree(n), idx: 1e9 };
}

/* choice: selected → [text | index]; emitted in answers order, whatever the click order */
function xapiChoiceResponse(item, qKey, selected) {
  var m = xapiQMeta(item, qKey), pool = Array.isArray(m.answers) ? m.answers : [];
  var picks = (selected || []).map(function (v) { return _xapiPick(v, pool, item, qKey, 'answers'); });
  picks.sort(function (a, b) { return a.idx - b.idx; });
  var texts = picks.map(function (p) { return p.text; }).filter(function (t) { return t !== ''; });
  return { response: texts.join(XAPI_SEP_LIST), readable: texts.join(', ') };
}

/* matching: pairs → [{source, target}] or [[source, target]] (strings or indexes). Only the pairs
   the learner PLACED are emitted: the pairs that are in correctAnswers first, in correctAnswers
   order (the order Kata builds correctXapiResponsesPattern in), then the wrong pairs in
   answers.source, answers.target order. This unit's three matching questions (01-002 q1,
   01-003 q1, 02-005 q1) are dropdowns with ONE source: main.js dqSpec passes
   { source: 0, target: <the picked option> }. */
function xapiMatchingResponse(item, qKey, pairs) {
  var m = xapiQMeta(item, qKey);
  var src = (m.answers && m.answers.source) || [], tgt = (m.answers && m.answers.target) || [];
  var placed = [];
  (pairs || []).forEach(function (p) {
    if (Array.isArray(p)) p = { source: p[0], target: p[1] };
    var s = _xapiPick(p.source, src, item, qKey, 'answers.source');
    var t = _xapiPick(p.target, tgt, item, qKey, 'answers.target');
    if (s.idx === 1e9 && t.idx === 1e9) {
      var s2 = _xapiPick(p.target, src, item, qKey, 'answers.source'), t2 = _xapiPick(p.source, tgt, item, qKey, 'answers.target');
      if (s2.idx !== 1e9 && t2.idx !== 1e9) { console.warn('[xAPI] matching pair reversed — swapped', item, qKey); s = s2; t = t2; }
    }
    if (s.text !== '') placed.push({ s: s, t: t });
  });
  var ca = Array.isArray(m.correctAnswers) ? m.correctAnswers : [], claimed = {};
  placed.forEach(function (p) {
    p.rank = 1e9;
    for (var j = 0; j < ca.length; j++) {
      if (claimed[j] || !ca[j] || String(ca[j].source) !== p.s.text || String(ca[j].target) !== p.t.text) continue;
      claimed[j] = true; p.rank = j; break;
    }
  });
  placed.sort(function (a, b) { return (a.rank - b.rank) || (a.s.idx - b.s.idx) || (a.t.idx - b.t.idx); });
  var out = [], readable = [];
  placed.forEach(function (p) { out.push(p.s.text + XAPI_SEP_PAIR + p.t.text); readable.push((p.s.text || '—') + ' → ' + (p.t.text || '—')); });
  return { response: out.join(XAPI_SEP_LIST), readable: readable.join(' | ') };
}

/* One step's value: the metadata's correct answer when the learner's value equals it (normalised
   text, or the same number), else the learner's own text. */
function _xapiStepValue(v, correct) {
  var fv = _xapiFree(v);
  if (correct == null) return fv;
  var c = String(correct);
  if (_xapiNorm(c) === fv) return c;
  var a = _xapiNumText(fv);
  if (a !== '' && !isNaN(Number(a)) && Number(a) === Number(_xapiNumText(c))) return c;
  return fv;
}

/* performance: values → { <step name>: text } or [text, …] in steps order */
function xapiPerformanceResponse(item, qKey, values) {
  var m = xapiQMeta(item, qKey), steps = m.steps || [];
  if (!steps.length) console.warn('[xAPI] performance: no steps[] / correctAnswers[].stepId in metadata', item, qKey);
  var out = [], readable = [];
  steps.forEach(function (st, i) {
    var name = String(st.name == null ? i + 1 : st.name);
    var v = values == null ? '' : (Array.isArray(values) ? values[i] : (values[name] != null ? values[name] : values[i]));
    var sv = _xapiStepValue(v, st.correctAnswer);
    out.push(name + XAPI_SEP_PAIR + sv); readable.push(name + ': ' + (sv || '—'));
  });
  return { response: out.join(XAPI_SEP_LIST), readable: readable.join(' | ') };
}

/* Kata's sentence form of a multi-field fill-in — "label: value<sep>label: value" — split into
   {sep, fields: [{label, value}]}, or null when the pattern is not that shape for `count` fields.
   <sep> is ", " in Hebrew Kata and the Arabic comma U+060C + space in Arabic Kata (the twin's
   03-002 q1 / 05-003 q2). A label holds no separator; a value holds none either (Kata writes
   1,000 without a space). Written as a char code so the source holds no Arabic character. */
var _XAPI_SENTENCE_SEPS = [', ', String.fromCharCode(0x060C) + ' '];
function _xapiFillInSentence(pattern, count) {
  if (pattern == null || count < 2) return null;
  for (var s = 0; s < _XAPI_SENTENCE_SEPS.length; s++) {
    var sep = _XAPI_SENTENCE_SEPS[s], parts = String(pattern).split(sep), out = [];
    if (parts.length !== count) continue;
    for (var i = 0; i < parts.length; i++) {
      var k = parts[i].lastIndexOf(': ');
      if (k <= 0) { out = null; break; }
      out.push({ label: parts[i].slice(0, k), value: parts[i].slice(k + 2) });
    }
    if (out) return { sep: sep, fields: out };
  }
  return null;
}

/* fill-in: one value → the value; several → Kata's own sentence when its pattern is one (the
   labels and the separator are the pattern's, each value the learner's, written as Kata writes
   it when equal), else the values joined with [,]. 03-002 q1 (s37, the three tags) and 05-003 q2
   (s53) are such sentences in Kata, e.g. "<label 1>: 500, <label 2>: 200" (guide §6.3c: where
   Kata's sentence can be sent exactly, send it). */
function xapiFillInResponse(item, qKey, values) {
  var vs = Array.isArray(values) ? values : [values];
  var m = xapiQMeta(item, qKey), sent = _xapiFillInSentence(m.pattern && m.pattern[0], vs.length);
  if (sent) {
    var parts = sent.fields.map(function (f, i) { return f.label + ': ' + _xapiStepValue(vs[i], f.value); });
    return { response: parts.join(sent.sep), readable: parts.join(sent.sep) };
  }
  var fv = vs.map(_xapiFree);
  return { response: fv.join(XAPI_SEP_LIST), readable: fv.join(' | ') };
}
/* numeric: '1,584' → '1584', ' 81 ' → '81'; anything that is not a number goes as typed */
function xapiNumericResponse(item, qKey, value) {
  var t = _xapiNumText(value), n = Number(t);
  var s = (t === '' || isNaN(n)) ? _xapiFree(value) : String(n);
  return { response: s, readable: s };
}
function xapiTrueFalseResponse(item, qKey, value) {
  var s = (value === true || value === 'true') ? 'true' : 'false';
  return { response: s, readable: s };
}
function xapiSequencingResponse(item, qKey, ordered) {
  var m = xapiQMeta(item, qKey), pool = Array.isArray(m.answers) ? m.answers : [];
  var texts = (ordered || []).map(function (v) { return _xapiPick(v, pool, item, qKey, 'answers').text; });
  return { response: texts.join(XAPI_SEP_LIST), readable: texts.join(' > ') };
}
function xapiOtherResponse(item, qKey, text) {
  var s = _xapiFree(text);
  return { response: s, readable: s };
}
function _xapiNoShape(item, qKey, want) {
  console.warn('[xAPI] response: metadata type needs "' + want + '" but the call site passed none', item, qKey);
  return [];
}

/* Dispatcher. spec = string | { type?, choices | pairs | steps | values | value | order | text }.
   The METADATA type governs (Kata reads the metadata); spec.type is only a cross-check. A call
   site may hand over several shapes at once (main.js dqSpec passes choices AND pairs) — the type
   in Kata picks the one that is used. */
function xapiResponse(item, qKey, spec) {
  var m = xapiQMeta(item, qKey), type = m.questionType;
  if (typeof spec === 'string' || typeof spec === 'number' || spec == null) spec = { text: spec == null ? '' : String(spec) };
  if (spec.type && type && spec.type !== type)
    console.warn('[xAPI] response: call site says "' + spec.type + '", metadata says "' + type + '"', item, qKey);
  if (!type) { type = spec.type || 'other'; console.warn('[xAPI] response: no questionType in metadata, using "' + type + '"', item, qKey); }
  var one = spec.value != null ? spec.value : (spec.values && spec.values.length === 1 ? spec.values[0] : spec.text);
  try {
    switch (type) {
      case 'choice':      return xapiChoiceResponse(item, qKey, spec.choices != null ? spec.choices : [spec.text]);
      case 'matching':    return xapiMatchingResponse(item, qKey, spec.pairs || _xapiNoShape(item, qKey, 'pairs'));
      case 'performance': return xapiPerformanceResponse(item, qKey, spec.steps != null ? spec.steps : spec.values);
      case 'fill-in':     return xapiFillInResponse(item, qKey, spec.values != null ? spec.values : one);
      case 'numeric':     return xapiNumericResponse(item, qKey, one);
      case 'true-false':  return xapiTrueFalseResponse(item, qKey, one);
      case 'sequencing':  return xapiSequencingResponse(item, qKey, spec.order || spec.choices);
      default:            return xapiOtherResponse(item, qKey, spec.text != null ? spec.text : JSON.stringify(spec));
    }
  } catch (e) {
    console.error('[xAPI] response formatting failed', item, qKey, e);
    return { response: _xapiFree(spec.text), readable: _xapiFree(spec.text) };
  }
}

/* Report one graded answer.
     item      the item suffix, e.g. '005'
     qKey      the question key, e.g. 'q1'
     correct   whether the answer is correct
     isLast    whether this is the final answer to the question (correct, or attempts exhausted).
               Only 'answered.last' enters the component score denominator.
     answer    a spec for xapiResponse ({choices} | {pairs} | {values} | {value} …), or a plain
               string for a single-value type. main.js builds it (scqSpec / dqSpec / mcqSpec …). */
function xapiAnswered(item, qKey, correct, isLast, answer){
  XAPI_Q_RESULTS[item + '/' + qKey] = !!correct;
  if (!window.XAPI_USING_G || typeof sendStatement720 !== 'function') return;
  try {
    var r = xapiResponse(item, qKey, answer);
    sendStatement720(isLast ? 'answered.last' : 'answered', 'question',
      { success: !!correct,
        score: { scaled: correct ? 1 : 0 },
        response: r.response,
        extensions: { student_answer: [r.readable] } },   /* fallback for library letters < k */
      xapiQ(item, qKey));
  } catch (e) { console.error('[xAPI] answered ' + item + '/' + qKey, e); }
}

/* The (item/qKey) pairs already reported with 'requested.1' during THIS page load. Same key
   xapiAnswered uses for XAPI_Q_RESULTS. */
var XAPI_HINTS_SENT = {};

/* A hint request. ⚠️ Place only in the branch where the hint is actually being OPENED. Hints here
   are overlays whose `hidden` is toggled, and calling this on the toggle would report a second
   request on every close.

   ── Dedupe: once per question ──
   Opening alone is not enough. Each overlay closes three ways (its close button, a click on the
   backdrop, and Escape) and all three leave the hint button live, so a learner who opened a hint
   twice reported 'requested.1' twice. The check lives here rather than at the call sites because
   there are 27 of them across four components (part 01 has none) and every one goes through
   this function.

   ── Scope: the whole unit attempt ──
   XAPI_HINTS_SENT alone is cleared on reload, which used to mean a learner who refreshed and
   reopened the same hint reported 'requested.1' a second time. Every cross-part 'חזרה' is also a
   fresh page load, so this happened in normal use and not only on a manual refresh. The keys now
   live in the state document too, under `hints`, through the same sendStatementOnce the
   'completed' ledger uses — so they survive a reload, a cross-part hop and a tab close.
   XAPI_HINTS_SENT stays in front of it as the in-memory fast path, so a repeat click costs no
   document read.

   Two orderings matter:
   - The memory latch is set only when sendStatementOnce reports the key SETTLED. While a restore
     is in flight it returns false and sends nothing, so latching there would swallow the
     learner's first real hint of the session.
   - Both latches sit after the XAPI_USING_G guard, so neither records a statement that never
     left. */
function xapiRequestedHint(item, qKey){
  var _k = item + '/' + qKey;
  if (XAPI_HINTS_SENT[_k]) return;
  if (!window.XAPI_USING_G || typeof sendStatement720 !== 'function') return;
  try {
    if (typeof sendStatementOnce === 'function') {
      /* Fails OPEN: with no document alreadySent() is false, so the hint is still reported. */
      if (sendStatementOnce('hints', _k, 'requested.1', 'question', null, xapiQ(item, qKey))) {
        XAPI_HINTS_SENT[_k] = true;
      }
      return;
    }
    sendStatement720('requested.1', 'question', null, xapiQ(item, qKey));
    XAPI_HINTS_SENT[_k] = true;
  } catch (e) { console.error('[xAPI] requested ' + _k, e); }
}

/* The component 'completed'. Closes the open item first, then reports through the ledger.
   ⚠️ Must be called on failure paths too. A component the learner did not pass still has to be
   reported, otherwise their whole attempt goes unrecorded — routing a failing learner is the
   platform's job, via the component's recommendedAfterFail. See REPORT-XAPI.md §5. */
function xapiCompleteComponent(result){
  try { xapiFinishItems(); } catch (e) {}
  try {
    sendCompletedOnce('done', currentPartSlug(), 'onlinelesson', result || null);
  } catch (e) { console.error('[xAPI] completed component', e); }
}

/* The last screen's button: report the component, then stop. Kata removes the component on
   'completed' (v2.7 p.23) and routes on it; outside Kata the disabled button is the only sign the
   click landed. leaveToPart and finishUnit in main.js end here — the hop that used to follow lives
   on only under DEV_NAV (10-identity.js). There is no unit-level statement any more (the
   xapiCompleteUnit that stood here until 2026-09-16): v2.5/v2.7 define object as item or
   component only, and the platform derives unit state itself. */
function xapiEndComponent(result, btn){
  xapiCompleteComponent(result);
  if (btn) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
}

/* played/paused for HTML5 <video> — CONTENT VIDEO ONLY, by explicit opt-in.
   ── Why an allowlist rather than every <video> ──
   The previous version selected querySelectorAll('video') with no filter, and in the reference
   unit that caught a decorative autoplay/loop/muted clip of the companion character — not
   content — which was wired and reporting.

   ⚠️ This stopped being hypothetical here on 03.09.26: component 01's screen 0 now carries TWO
   such clips, the character-selection cards (`assets/video/character-*-selection.mp4`,
   autoplay/loop/muted/playsinline). Neither carries data-xapi-report, so the allowlist keeps
   them silent — which is the whole point of it. An unfiltered querySelectorAll('video') would
   now be actively reporting decoration.
   It was not quiet reporting either: an element that is playing emits a pause event followed by a
   play whenever .load() or a src swap happens, i.e. a fabricated paused/played pair on every
   entry to the screen, including on back-navigation and on resume.
   Only elements carrying data-xapi-report are wired now, its value being the item suffix (e.g.
   data-xapi-report="003"). No element in this unit carries it, so video
   reporting is off in practice — the mechanism stays ready for real content video.
   ── objectId: the ITEM, not the question (15.09.26) ──
   Reported by the test team: these statements went out against the PART. Carrying xapiQ() was
   never enough. The library builds object.id from sttmContext.objectId, else from a questionId
   but ONLY for answered/selected/requested, else from window.METADATA.id. played/paused are in
   neither allowlist, so the questionId and parentId were discarded and the component id was sent
   (xapi-720-k.js, the object block). They now pass objectId: xapiItemId(item) — the same helper
   that anchors item initialized/completed.
   xapiQ() and data-xapi-q are gone from this path: the object is the ITEM, and a video item need
   not carry a question at all (mass-measure-01's item 006 has none).
   ⚠️ MOE's own "דוגמאות XAPI" §6/§7 show a COMPONENT id in object for Played/Paused. We follow
   the test team, because a component-level video event cannot say which video. Written
   confirmation from MOE is still open — ask it together with the same question for 'requested'. */
function xapiWireVideos(){
  if (!window.XAPI_USING_G || typeof sendStatement720 !== 'function') return;
  document.querySelectorAll('video[data-xapi-report]').forEach(function(v){
    if (v.__xapiWired) return; v.__xapiWired = true;
    var item = v.getAttribute('data-xapi-report');
    var ctx  = { objectId: xapiItemId(item) };   // the ITEM this video belongs to
    var pausedOnce = false;
    v.addEventListener('pause', function(){ if (v.ended || v.currentTime === 0) return; pausedOnce = true; try { sendStatement720('paused', 'question', null, Object.assign({ time: v.currentTime }, ctx)); } catch (e) {} });
    v.addEventListener('play',  function(){ if (!pausedOnce) return; try { sendStatement720('played', 'question', null, Object.assign({ time: v.currentTime }, ctx)); } catch (e) {} });
  });
}
