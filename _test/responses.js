#!/usr/bin/env node
/* ═══════════════════ result.response = Kata's pattern (guide §6.3c, §10.2) ═══════════════════
   Run: node _test/responses.js        (NODE_PATH → jsdom, see README.md; exit 0 = all pass)

   MOE's runbook (§3, 08.11.26) compares every 'answered' result.response with the question's
   correctXapiResponsesPattern, character by character. metadata/ equals Kata (synced 15.11.26),
   so for every question this unit reports:
     - a CORRECT round through the real engine (scqCheck / s0Check / dqCheck / mcqCheck2 /
       viqCheck — never a hand-built statement) sends response === correctXapiResponsesPattern[0];
       multi-select is clicked in REVERSE answers order, and must still come out in answers order;
     - every option on a choice / dropdown screen resolves to a metadata answer (no "not in
       metadata" fallback), so a WRONG pick is sent as Kata's string too;
     - no response carries " | ", "=", ", "-joined picks or an element id; typed numbers with
       spaces go out bare;
     - the retired builders (xapiZoneAnswer / xapiFieldsAnswer / xapiMultiAnswer) are gone and
       nothing in main.js calls xapiAnswered directly.
   Negative test: _test/responses-mutations.js runs this file on the 93c9780 layer — it must fail. */
'use strict';
const fs = require('fs');
const path = require('path');
const { BASE, COMPONENTS, reporter, boot, metadata } = require('./harness');
const R = reporter();

const qOf = (meta, item, qKey) => {
  const it = meta.subContent.find(s => s.id.replace(/\/+$/, '').endsWith('-' + item));
  return it && (it.questions || []).find(q => q.questionId.replace(/\/+$/, '').endsWith('/' + qKey));
};
const answered = b => b.stmts().filter(s => /^answered/.test(s.verb));
const qTail = s => String(s.opts.questionId).replace(/\/+$/, '').split('/').slice(-2).join('/').slice(-6);

/* Drive one engine screen with the correct answer. Returns false when the screen has no engine. */
function driveCorrect(b, sid) {
  const has = o => b.val(`typeof ${o} !== 'undefined' && !!${o}['${sid}']`);
  if (sid === 's0') { b.exec('s0Pick(S0Q_CORRECT); s0Check();'); return true; }
  if (has('MCQ')) {                    /* reverse of the on-screen order */
    b.exec(`(function(){var q=MCQ['${sid}'];var ids=[].map.call(document.querySelectorAll('#${sid} .scq-opt'),function(o){return o.dataset.id})
      .filter(function(i){return q.correctIds.has(i)}).reverse(); ids.forEach(function(id){mcqToggle2('${sid}',id)}); mcqCheck2('${sid}');})();`);
    return true;
  }
  if (has('SCQ')) { b.exec(`scqSelect('${sid}', SCQ['${sid}'].correctId); scqCheck('${sid}');`); return true; }
  if (has('DQ')) {
    b.exec(`(function(){var sel=document.getElementById('${sid}-sel'); sel.value=DQ['${sid}'].correctId; dqOnChange('${sid}'); dqCheck('${sid}');})();`);
    return true;
  }
  if (has('VIQ')) {
    b.exec(`(function(){var q=VIQ['${sid}']; viqInputs('${sid}').forEach(function(el,i){el.value=String(q.answers[i]);}); viqOnInput('${sid}'); viqCheck('${sid}');})();`);
    return true;
  }
  return false;
}

const seen = {};
COMPONENTS.forEach(c => {
  const meta = metadata(c);
  const b = boot(c); b.finishBoot();
  /* the keys this component reports: XAPI_QMAP rows whose screen is in its SCREEN_TO_SUBCONTENT */
  const rows = b.json(`Object.keys(XAPI_QMAP).map(function(k){var e=XAPI_QMAP[k],m=SCREEN_TO_SUBCONTENT[e[0]];
    return m ? {key:k, screen:e[0], item:m[0], qKey:e[1]} : null}).filter(Boolean)`);
  const bySid = {};
  rows.forEach(r => { const sid = r.key.replace(/r\d+$/, ''); (bySid[sid] = bySid[sid] || []).push(r); });

  Object.entries(bySid).forEach(([sid, rs]) => {
    b.exec(`goTo(${rs[0].screen});`);
    const n0 = answered(b).length;
    R.ok('drive', c + ' ' + sid + ': an engine answers it', driveCorrect(b, sid));
    const sent = answered(b).slice(n0);
    rs.forEach(r => {
      const q = qOf(meta, r.item, r.qKey), tag = c + '-' + r.item + '/' + r.qKey + ' (' + r.key + ')';
      seen[tag] = true;
      R.ok('meta', tag + ': metadata has correctXapiResponsesPattern', q && Array.isArray(q.correctXapiResponsesPattern) && q.correctXapiResponsesPattern.length === 1);
      if (!q || !q.correctXapiResponsesPattern) return;
      const st = sent.filter(s => qTail(s) === r.item + '/' + r.qKey);
      R.eq('count', tag + ': one answered for a correct round', st.length, 1);
      if (!st[0]) return;
      R.ok('success', tag + ': success:true', st[0].result && st[0].result.success === true);
      R.eq('resp', tag + ' [' + q.questionType + ']: response = Kata pattern', st[0].result && st[0].result.response, q.correctXapiResponsesPattern[0]);
    });
  });

  /* every option on a choice / dropdown screen maps to a metadata answer — wrong picks included */
  Object.entries(bySid).forEach(([sid, rs]) => {
    if (rs.length !== 1) return;
    const r = rs[0], q = qOf(meta, r.item, r.qKey);
    if (!q) return;
    const kind = b.val(`typeof MCQ!=='undefined'&&MCQ['${sid}']?'mcq':typeof SCQ!=='undefined'&&SCQ['${sid}']||'${sid}'==='s0'?'scq':typeof DQ!=='undefined'&&DQ['${sid}']?'dq':''`);
    if (!kind) return;
    if (b.val('typeof scqSpec + typeof dqSpec + typeof xapiResponse') !== 'functionfunctionfunction') {
      R.ok('opts', c + ' ' + sid + ': main.js scqSpec / dqSpec and 20-xapi.js xapiResponse exist', false);
      return;
    }
    const pool = q.questionType === 'matching' ? q.answers.target : q.answers;
    const resps = b.json(kind === 'dq'
      ? `[].filter.call(document.getElementById('${sid}-sel').options,function(o){return o.value}).map(function(o){
           var sel={options:[o],selectedIndex:0,value:o.value}; return xapiResponse('${r.item}','${r.qKey}',dqSpec(sel)).response})`
      : `[].map.call(document.querySelectorAll('#${sid} .scq-opt'),function(o){return xapiResponse('${r.item}','${r.qKey}',scqSpec('${sid}',[o.dataset.id])).response})`);
    R.eq('opts', c + ' ' + sid + ': one option per metadata answer', (resps || []).length, (pool || []).length);
    (resps || []).forEach((x, i) => {
      const want = q.questionType === 'matching' ? q.answers.source.map(s => s + '[.]').find(p => x.startsWith(p)) && x.split('[.]')[1] : x;
      R.ok('opts', c + ' ' + sid + ' option ' + (i + 1) + ': sent as a metadata answer — ' + x, pool.includes(want));
    });
  });

  /* no screen string, separator or id in any response of this walk */
  answered(b).forEach(s => {
    const x = String(s.result && s.result.response);
    R.ok('shape', c + ' ' + qTail(s) + ': no " | ", "=" or element id — ' + x, !/ \| |=|\bs\d+(-|r\d)/.test(x));
  });
  R.eq('errors', c + ': no console.error', b.errors, []);
  b.close();
});

/* typed variants: the value goes out as Kata writes it, the learner's own text otherwise */
{
  const b = boot('05'); b.finishBoot();
  const r = (item, q, spec) => b.val(`xapiResponse('${item}','${q}',${JSON.stringify(spec)}).response`);
  if (b.val('typeof xapiResponse') === 'function') {
    R.eq('typed', '05-001/q1 numeric " 800 " → 800', r('001', 'q1', { value: ' 800 ' }), '800');
    R.eq('typed', '05-001/q1 numeric "1,800" → 1800 (no thousands comma)', r('001', 'q1', { value: '1,800' }), '1800');
    /* expected strings come from Kata's own sentence, so the same checks hold in either language */
    const pat = qOf(metadata('05'), '003', 'q2').correctXapiResponsesPattern[0];
    R.eq('typed', '05-003/q2 fill-in, right values typed loosely → Kata sentence', r('003', 'q2', { values: [' 500', '200.0'] }), pat);
    R.eq('typed', '05-003/q2 fill-in, a wrong value stays the learner\'s', r('003', 'q2', { values: ['510', '200'] }), pat.replace(': 500', ': 510'));
    R.eq('typed', '05-003/q2 fill-in, a delimiter typed by the learner is blanked', r('003', 'q2', { values: ['5[,]0', '200'] }), pat.replace(': 500', ': 5 0'));
    R.eq('typed', '05-003/q1 multi-select by index, reverse order → answers order',
      r('003', 'q1', { choices: [2, 0] }), b.json(`(function(){var a=xapiQMeta('003','q1').answers;return a[0]+'[,]'+a[2]})()`));
  } else R.ok('typed', 'xapiResponse exists', false);
  b.close();
}

/* every reportable Kata question was driven */
const total = COMPONENTS.reduce((n, c) => n + metadata(c).subContent.reduce((m, s) =>
  m + (s.questions || []).filter(q => q.correctXapiResponsesPattern && q.correctXapiResponsesPattern.length).length, 0), 0);
R.eq('cover', 'questions driven = metadata questions with a pattern', Object.keys(seen).length, total);

/* the retired builders stay retired (§10.2) */
const x20 = fs.readFileSync(path.join(BASE, 'unit-js', '20-xapi.js'), 'utf8');
const main = fs.readFileSync(path.join(BASE, 'unit-js', 'main.js'), 'utf8');
['xapiZoneAnswer', 'xapiFieldsAnswer', 'xapiMultiAnswer'].forEach(fn => {
  R.ok('retired', fn + ' is not defined in 20-xapi.js', !new RegExp('function\\s+' + fn + '\\b').test(x20));
  R.ok('retired', fn + ' is not called anywhere', !new RegExp('\\b' + fn + '\\s*\\(').test(x20 + main));
});
/* guide §6.3c rule 5: the bidi class is written with escapes — no raw invisible character in the
   source (checked by char code, so this file holds none either) */
const invisible = [...x20].filter(ch => { const k = ch.charCodeAt(0);
  return (k >= 0x200B && k <= 0x200F) || (k >= 0x202A && k <= 0x202E) || (k >= 0x2066 && k <= 0x2069) || k === 0x061C; });
R.eq('layer', '20-xapi.js holds no raw invisible character', invisible.length, 0);
R.ok('layer', '_XAPI_BIDI is written with escapes', /_XAPI_BIDI = \/\[(\\u[0-9A-Fa-f]{4}(-\\u[0-9A-Fa-f]{4})?)+\]\/g;/.test(x20));
R.ok('retired', 'main.js joins no answer with " | "', !/join\(\s*["'] \| ["']\s*\)/.test(main));
R.ok('layer', '20-xapi.js sends result.response through xapiResponse', /response:\s*r\.response/.test(x20) && /function xapiResponse\b/.test(x20));
R.ok('layer', 'no direct xapiAnswered call in main.js (all go through xapiReport)', (main.match(/\bxapiAnswered\s*\(/g) || []).length === 1);

R.done('responses');
