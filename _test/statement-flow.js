#!/usr/bin/env node
/* ═══════════════════ behavioural oracle — NOT DEPLOYED ═══════════════════
   Which statements leave the lomda when a learner does something, in what order, with what
   result — and which do NOT leave when the same screen is reached again by a reload or Back.
   Every expected sequence below is the design in docs-and-tools/XAPI-MAP.md.

   Run (jsdom outside OneDrive — see README.md):
     set NODE_PATH=%TEMP%\lomda-test\node_modules
     node _test/statement-flow.js */
'use strict';
const { COMPONENTS, reporter, boot, label, ACT, SIG } = require('./harness');
const R = reporter();

/* a scripted walk; returns the labels it produced */
function walk(c, steps, opts) {
  const b = boot(c, opts);
  b.finishBoot();
  steps.forEach(s => b.exec(s));
  return b;
}
const go = n => 'goTo(' + n + ');';
const adv = 'advanceScreen();';
const tail = b => b.stmts().map(label);

/* ── 1. fresh load: component, then the landing item (none on a transition) ── */
COMPONENTS.forEach(c => {
  const b = boot(c); b.finishBoot();
  const s = b.stmts();
  R.ok('fresh', c + ': first statement is the component initialized', s[0] && s[0].verb === 'initialized' && s[0].objectType === 'onlinelesson', JSON.stringify(s[0]));
  const landingMapped = b.json('SCREEN_TO_SUBCONTENT[PART_CONFIG.start]');
  R.eq('fresh', c + ': landing item initialized only if the first screen maps to one', s.length, landingMapped ? 2 : 1);
  R.eq('fresh', c + ': no console.error on boot', b.errors, []);
  b.close();
});

/* ── 1b. B-2 (monday 13454123722, 13.11.26): Back never closes an item ──
   03 s36 (item 001): one wrong attempt, Back to s35 → no completed for 001; return, right, forward
   → exactly one, success:true. The old xapiOnScreen closed 001 on the Back with the failed result. */
{
  const b = walk('03', [adv, ACT.scq('s36', false)]);
  const n0 = b.stmts().length;
  b.exec('goBack();');
  const back = b.stmts().slice(n0);
  R.eq('back', '03 B-2: wrong at s36, Back → nothing but the earlier item re-opened', back.filter(s => s.verb === 'completed').map(label), []);
  b.exec(go(36) + ACT.scq('s36', true) + adv);
  const done = b.stmts().filter(s => s.verb === 'completed' && label(s) === 'completed 03-001');
  R.eq('back', '03 B-2: return, right, forward → exactly one completed 03-001', done.length, 1);
  R.ok('back', '03 B-2: that completed is success:true', done[0] && done[0].result && done[0].result.success === true, JSON.stringify(done[0] && done[0].result));
  R.eq('back', '03 B-2: on s37 after the forward move', b.val('currentScreen'), 37);
  R.eq('back', '03 B-2: no console.error', b.errors, []);
  b.close();
}

/* ── 2. component 03: the promised gate (decision 08.10) ── */
{
  const fail = walk('03', [adv, ACT.scq('s36', false), ACT.scq('s36', false), adv,
    ACT.viq('s37', false), ACT.viq('s37', false), adv, ACT.scq('s38', true), adv, ACT.scq('s39', true), adv,
    ACT.scq('s40', true), adv, "openHint('s41'); openHint('s41');", ACT.viq('s41', true), adv]);
  R.eq('gate', '03 below 3/4: exact statement flow', tail(fail), [
    'initialized onlinelesson',
    'initialized 03-001', 'answered 001/q1', 'answered.last 001/q1', 'completed 03-001',
    'initialized 03-002', 'answered 002/q1', 'answered.last 002/q1', 'completed 03-002',
    'initialized 03-003', 'answered.last 003/q1', 'answered.last 003/q2', 'completed 03-003',
    'initialized 03-004', 'answered.last 004/q1', 'requested.1 004/q2', 'answered.last 004/q2', 'answered.last 004/q3', 'completed 03-004',
    'completed onlinelesson']);
  const last = fail.stmts().pop();
  R.eq('gate', '03 below 3/4: component result is success:false, 2/4', last.result, { success: false, score: { scaled: 0.5 } });
  R.eq('gate', '03 below 3/4: the learner stays on s41', fail.val('currentScreen'), 41);
  R.ok('gate', '03 below 3/4: s41 button disabled', fail.val("document.getElementById('s41-check').disabled") === true);
  const n = fail.stmts().length;
  fail.exec(adv + " viqCheck('s41'); document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}));");
  R.eq('gate', '03 gate is idempotent: re-click / ArrowLeft send nothing', fail.stmts().length, n);

  /* rule 12 — reload after the gate fired: button stays dead, nothing re-sent */
  const again = boot('03', { store: fail.store() }); again.finishBoot();
  R.ok('gate', 'after reload the gated button stays disabled', again.val("document.getElementById('s41-check').disabled") === true);
  R.eq('gate', 'after reload only the two load-time initialized go out', again.stmts().slice(n).map(s => s.verb), ['initialized', 'initialized']);
  again.close(); fail.close();

  const pass = walk('03', [adv, ACT.scq('s36', false), ACT.scq('s36', true), adv,
    ACT.viq('s37', false), ACT.viq('s37', false), adv, ACT.scq('s38', true), adv, ACT.scq('s39', true), adv,
    ACT.scq('s40', true), adv, ACT.viq('s41', true), adv]);
  R.eq('gate', '03 at 3/4 the learner continues to s42', pass.val('currentScreen'), 42);
  pass.exec(adv + ACT.scq('s43', true) + adv + ACT.mcq('s44', true) + adv);
  const end = pass.stmts().pop();
  R.eq('gate', '03 pass: 005/006 reported but outside the denominator — 3/4', end.result, { success: true, score: { scaled: 0.75 } });
  R.eq('gate', '03 pass: one component completed, no duplicates', pass.val('JSON.stringify(__dupes())'), '[]');
  R.ok('gate', '03 pass: no navigation off the component', pass.w.location.pathname.indexOf('-03/') > 0);
  pass.close();
}

/* ── 3. component 02: stations (all parts correct), per-field s33, DQ retry gate ── */
{
  const b = walk('02', [adv, adv, ACT.scq('s28', true), adv, ACT.viq('s29', true), adv, ACT.scq('s30', true), adv,
    ACT.scq('s31', false), ACT.scq('s31', true), adv, ACT.viq('s32', true), adv,
    ACT.viq('s33', [true, false]), ACT.viq('s33', [true, true]), adv]);
  R.eq('fields', 's33 reports q1 and q2 separately, per field, with a shared isLast', tail(b).filter(l => /004\//.test(l)),
    ['answered 004/q1', 'answered 004/q2', 'answered.last 004/q1', 'answered.last 004/q2']);
  /* the DQ retry gate */
  b.exec(ACT.dq('s34', false));
  const lw = b.val('DQ.s34.lastWrong');
  b.exec(`var sel=document.getElementById('s34-sel'); sel.value=DQ.s34.correctId; dqOnChange('s34');`);
  R.ok('retry', 'DQ: a different pick re-enables check', b.val("document.getElementById('s34-check').disabled") === false);
  b.exec(`sel.value=${JSON.stringify(lw)}; dqOnChange('s34');`);
  R.ok('retry', 'DQ: the pick already marked wrong keeps check disabled', b.val("document.getElementById('s34-check').disabled") === true);
  b.exec("dqCheck('s34');");
  R.eq('retry', 'DQ: the same wrong pick cannot spend attempt 2', b.val('DQ.s34.attempts'), 1);
  b.exec(ACT.dq('s34', true) + adv);
  /* 002's q3 was wrong first, right second → station correct; all 5 stations → 5/5 */
  R.eq('stations', '02: 5 of 5 stations, success', b.stmts().pop().result, { success: true, score: { scaled: 1 } });
  b.close();

  /* station 002 has an EARLIER part wrong (s30) and its last part right (s31): under the
     all-parts rule it is still wrong — the case that tells "all parts" from "last part" */
  const b2 = walk('02', [adv, adv, ACT.scq('s28', true), adv, ACT.viq('s29', true), adv,
    ACT.scq('s30', false), ACT.scq('s30', false), adv, ACT.scq('s31', true), adv, ACT.viq('s32', true), adv,
    ACT.viq('s33', [true, false]), ACT.viq('s33', [true, false]), adv, ACT.dq('s34', true), adv]);
  R.eq('stations', '02: a station counts only if ALL its parts are correct — 3 of 5 fails 4/5',
    b2.stmts().pop().result, { success: false, score: { scaled: 0.6 } });
  b2.close();
}

/* ── 4. component 01: s0, guided (q3/q6/q8 never reported), per-question score ── */
{
  const steps = ["s0Pick('a'); s0Check();", go(1), go(2), ACT.dq('s2', false), ACT.dq('s2', true), go(3), ACT.scq('s3', true),
    go(4), ACT.scq('s4', true), go(5), go(6), ACT.dq('s6', true), go(7), ACT.scq('s7', true), go(8), ACT.scq('s8', false), ACT.scq('s8', false), go(9)];
  for (let n = 10; n <= 20; n++) steps.push(go(n) + `(function(){var c=GUIDED.filter(function(x){return x.screen===${n}})[0]; if(c.opts) gPick('s${n}', ${n === 16} ? 1 - c.correct : c.correct);})();`);
  steps.push(go(21), go(22), ACT.scq('s22', true), go(23), ACT.viq('s23', true), go(24), ACT.viq('s24', true), go(25), ACT.viq('s25', true), go(26));
  const b = walk('01', steps);
  /* 2026-11-14: 01-004 is a guided walk-through — it reports nothing and enters no score (unit owner's
     rule of 10.11, GUIDED-ITEMS-REPORT.md group A). Before: q1, q2, q4, q5, q7 were reported and the
     score was 13 of 16; the s16 wrong pick no longer counts. */
  R.eq('guided', '01-004 (guided) reports no answered at all',
    tail(b).filter(l => /^answered.* 004\//.test(l)).length, 0);
  R.ok('guided', 'the guided picks are still kept (gState)', b.val("gState.s10 && gState.s10.answered === true && gState.s16 && gState.s16.answered === true") === true);
  R.eq('score', '01: 9 of 11 reported questions (the guided steps are out)', b.stmts().pop().result, { success: true, score: { scaled: 9 / 11 } });
  R.ok('nav', '01 ends without navigating', b.w.location.pathname.indexOf('-01/') > 0 && b.val("document.getElementById('s25-check').disabled") === true);
  b.close();
}

/* ── 5. 04 task, 06/07 assessments, 05 stations ── */
{
  const t = walk('04', [adv, "document.querySelectorAll('#s46 .task-input').forEach(function(el){el.value='12'}); taskOnInput('s46'); taskCheck('s46');"]);
  R.eq('task', '04: item pair with no answered, then success:true with NO score', tail(t), ['initialized onlinelesson', 'initialized 04-001', 'completed 04-001', 'completed onlinelesson']);
  R.eq('task', '04: result', t.stmts().pop().result, { success: true });
  t.close();
  const p6 = walk('06', [adv, ACT.scq('s59q1', true), ACT.viq('s59q2', false), ACT.viq('s59q2', false), ACT.scq('s59q3', true), "openHint('s59q4');", ACT.scq('s59q4', true), adv]);
  R.ok('peak', '06: inline hint reported against its own question', tail(p6).indexOf('requested.1 001/q4') > -1);
  R.eq('peak', '06: 3 of 4 declared → 0.75, meets the promised 3', p6.stmts().pop().result, { success: true, score: { scaled: 0.75 } });
  p6.close();
  const p6b = walk('06', [adv, ACT.scq('s59q1', true), ACT.viq('s59q2', false), ACT.viq('s59q2', false),
    ACT.scq('s59q3', false), ACT.scq('s59q3', false), ACT.scq('s59q4', true), adv]);
  R.eq('peak', '06: 2 of 4 is below the promised "3 לפחות" (screen 58)', p6b.stmts().pop().result, { success: false, score: { scaled: 0.5 } });
  p6b.close();
  /* the engine never lets a learner past an unanswered question, so "1 of 3" is reached by
     answering q2 and q3 wrong twice */
  const p7 = walk('07', [adv, adv, ACT.scq('s62', true), adv, ACT.scq('s63', false), ACT.scq('s63', false), adv,
    ACT.scq('s64', false), ACT.scq('s64', false), adv]);
  R.eq('peak', '07: 1 of 3 declared → below 60%', p7.stmts().pop().result, { success: false, score: { scaled: 1 / 3 } });
  p7.close();
  /* the denominator is the DECLARED count: a component ended with a question never answered
     (only reachable programmatically) still divides by 3 */
  const p7b = walk('07', [adv, adv, ACT.scq('s62', true), 'finishUnit();']);
  R.eq('peak', '07: an unanswered declared question counts as wrong', p7b.stmts().pop().result, { success: false, score: { scaled: 1 / 3 } });
  p7b.close();
  const c5 = walk('05', [adv, ACT.viq('s48', true), adv, ACT.viq('s49', true), adv, ACT.scq('s50', true), adv,
    ACT.viq('s51', false), ACT.viq('s51', false), adv, ACT.mcq('s52', true), adv, ACT.viq('s53', true), adv,
    ACT.scq('s54', true), adv, ACT.viq('s55', true), adv, adv, ACT.scq('s57', true), adv]);
  R.eq('stations', '05: 4 of 5 stations at the 60% default', c5.stmts().pop().result, { success: true, score: { scaled: 0.8 } });
  c5.close();
}

/* ── 5b. D-8 (found in the live run 08.10.26): a finished component's last button stays dead
        after a reload; an answered-but-not-ended one comes back LIVE so its click still reports ── */
{
  const steps = [adv, adv, ACT.scq('s62', true), adv, ACT.scq('s63', true), adv, ACT.scq('s64', true)];
  const open = walk('07', steps.concat(['flushResumeSave();']));
  const r1 = boot('07', { store: open.store() }); r1.finishBoot();
  R.eq('ended', '07 answered, NOT ended: after reload the last button is live', r1.val("document.getElementById('s64-check').disabled"), false);
  const n = r1.stmts().length;
  r1.exec(adv);
  R.eq('ended', '07 answered, NOT ended: its click still reports the component', r1.stmts().slice(n).map(s => s.verb + ' ' + s.objectType).pop(), 'completed onlinelesson');
  const r2 = boot('07', { store: r1.store() }); r2.finishBoot();
  R.eq('ended', '07 ended: after reload the last button stays disabled (D-8)', r2.val("document.getElementById('s64-check').disabled"), true);
  const m = r2.stmts().length;
  r2.exec(adv + " document.getElementById('s64-check').click();");
  R.eq('ended', '07 ended: nothing more is sent', r2.stmts().length, m);
  open.close(); r1.close(); r2.close();

  /* the scrollset component ends on its continue button, not a check button */
  const p6 = walk('06', [adv, ACT.scq('s59q1', true), ACT.viq('s59q2', true), ACT.scq('s59q3', true), ACT.scq('s59q4', true), adv]);
  const p6r = boot('06', { store: p6.store() }); p6r.finishBoot();
  R.eq('ended', '06 ended: after reload s59-continue stays disabled', p6r.val("document.getElementById('s59-continue').disabled"), true);
  p6.close(); p6r.close();
}

/* ── 6. hints: once per question, toggle reports only when opening ── */
{
  const b = walk('03', [adv, "openHint('s36'); closeHint('s36'); openHint('s36');"]);
  R.eq('hint', 'a hint opened twice reports once', tail(b).filter(l => l.startsWith('requested')), ['requested.1 001/q1']);
  b.close();
}

/* ── 7. resume: mid-question reload, repaint, no re-report, ledger ── */
{
  const a = walk('03', [adv, ACT.scq('s36', true), adv,
    "viqInputs('s37').forEach(function(el,i){el.value=String(VIQ.s37.answers[i]+5)}); viqOnInput('s37'); viqCheck('s37');"]);
  const n = a.stmts().length;
  const doc = a.json('__state()');
  R.ok('resume', 'the document is v6, this component\'s, with a payload', doc && doc.v === 6 && doc.component === 'methodica-ar-math-percent-04-03' && !!doc.payload, JSON.stringify(doc && { v: doc.v, c: doc.component }));
  R.ok('resume', 'the payload carries no engine configuration (no correctId / answers / body)',
    !/correctId|"answers"|"body"/.test(JSON.stringify(doc.payload)));
  const b = boot('03', { store: a.store() });
  R.ok('resume', 'a returning learner is resumed', b.finishBoot());
  R.eq('resume', 'lands on the saved screen', b.val('currentScreen'), 37);
  R.eq('resume', 'the pending attempt is back: values', b.json("viqInputs('s37').map(function(e){return e.value})"), doc.payload.viq.s37.vals);
  R.ok('resume', 'the pending attempt is back: wrong marks + check retry-gated',
    b.val("viqInputs('s37').every(function(e){return e.classList.contains('error')}) && document.getElementById('s37-check').disabled"));
  R.eq('resume', 'the reload re-sends no answer — only initialized', b.stmts().slice(n).map(s => s.verb).sort(), ['initialized', 'initialized']);
  b.exec(go(36));
  R.ok('resume', 'an answered screen repaints: correct mark, locked, verdict, متابعة (Hebrew: שנמשיך?)',
    b.val(`(function(){var o=document.querySelector('#s36 .scq-opt[data-id="'+SCQ.s36.correctId+'"]');
      return o.classList.contains('correct') && o.disabled && !document.getElementById('s36-popup').classList.contains('hidden')
        && document.getElementById('s36-check').textContent.trim()==='متابعة';})()`));
  R.ok('resume', 'XAPI_Q_RESULTS restored (score survives the reload)', b.val("XAPI_Q_RESULTS['001/q1'] === true"));
  b.exec(go(37));
  b.exec("viqInputs('s37').forEach(function(el,i){el.value=String(VIQ.s37.answers[i])}); viqOnInput('s37'); viqCheck('s37');" + adv);
  R.eq('resume', 'no duplicate completed across the reload', b.val('JSON.stringify(__dupes())'), '[]');
  R.eq('resume', 'item 001 completed exactly once in the whole log', b.stmts().filter(s => s.verb === 'completed' && /-001\/?$/.test(s.opts.objectId)).length, 1);
  b.close(); a.close();
}

/* ── 8. repaint parity: live revisit vs reloaded revisit, screen by screen ── */
const PARITY = {
  '01': { steps: ["s0Pick('a'); s0Check(); s0State.scrolledEnd = true;", go(1), 's1Open(1); s1Close(); s1Open(2); s1Close();', go(2), ACT.dq('s2', false), ACT.dq('s2', false),
            go(3), "scqSelect('s3', SCQ.s3.correctId);", go(10), "gPick('s10', 0);", go(15), "gPick('s15', 1);", go(23)], screens: [0, 1, 2, 3, 10, 15, 23] },
  '03': { steps: [adv, ACT.scq('s36', false), adv, ACT.viq('s37', false), ACT.viq('s37', false), adv, ACT.scq('s38', true), adv], screens: [36, 37, 38] },
  '05': { steps: [adv, ACT.viq('s48', true), go(50), ACT.scq('s50', true), go(52), ACT.mcq('s52', false), go(53), ACT.viq('s53', false), ACT.viq('s53', false), go(55)], screens: [48, 50, 52, 53, 55] },
  '06': { steps: [adv, ACT.scq('s59q1', true), "viqInputs('s59q2').forEach(function(el,i){el.value=String(VIQ.s59q2.answers[i]+3)}); viqOnInput('s59q2'); viqCheck('s59q2');"], screens: [59] },
  '04': { steps: [adv, "document.querySelectorAll('#s46 .task-input').forEach(function(el,i){ if(i<2) el.value='7'; }); taskOnInput('s46');"], screens: [46] },
};
Object.entries(PARITY).forEach(([c, p]) => {
  const a = walk(c, p.steps);
  const landing = a.val('currentScreen');
  a.exec('flushResumeSave();');
  const live = {};
  p.screens.forEach(n => { a.exec(go(n)); live[n] = a.val(SIG); });
  a.exec(go(landing) + 'flushResumeSave();');
  const b = boot(c, { store: a.store() }); b.finishBoot();
  R.eq('parity', c + ': resumes on the screen it left', b.val('currentScreen'), landing);
  p.screens.forEach(n => { b.exec(go(n)); R.eq('parity', c + ' s' + n + ': reloaded screen = live screen', b.val(SIG), live[n]); });
  R.eq('parity', c + ': no console.error through the reload', b.errors, []);
  a.close(); b.close();
});

/* ── 9. painters never throw — every engine forced into each state, every screen ── */
['correct', 'wrong2', 'pending'].forEach(variant => COMPONENTS.forEach(c => {
  const b = boot(c); b.finishBoot();
  const done = variant !== 'pending';
  b.exec(`['SCQ','DQ','VIQ','MCQ'].forEach(function(k){ var m=eval(k); Object.keys(m).forEach(function(sid){ var q=m[sid];
      q.attempts=${done ? 2 : 1}; q.done=${done}; q.result=${done ? JSON.stringify(variant) : 'undefined'};
      if(k==='SCQ'){q.selected='zz';q.lastWrong='zz';} if(k==='MCQ'){q.selected=new Set(['zz']);q.lastWrong='["zz"]';}
      if(k==='VIQ'){q.lastWrong=['1'];q.userInputs=['1'];} if(k==='DQ'){q.lastWrong='zz';q.userPick='zz';} }); });
    Object.keys(gState).forEach(function(k){ gState[k].answered=true; gState[k].picked=0; });
    Object.keys(TASKS).forEach(function(k){ TASKS[k].done=${done}; });
    for (var n=PART_CONFIG.start; n<=PART_CONFIG.end; n++) { goTo(n); restoreScreenUI(n); }`);
  R.eq('painters', c + ' ' + variant + ': no painter throws on any screen', b.errors, []);
  b.close();
}));

R.done('statement-flow');
