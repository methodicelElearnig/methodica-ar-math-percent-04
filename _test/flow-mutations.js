#!/usr/bin/env node
/* Negative tests for _test/statement-flow.js (guide §10.4): each mutation re-introduces one
   real defect into a throwaway copy of the unit; the suite must FAIL on every one, and every
   mutation must actually land (its anchor is asserted before running). NOT DEPLOYED.
   Run:  set NODE_PATH=%TEMP%\lomda-test\node_modules  &&  node _test/flow-mutations.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..');
const TMP = path.join(os.tmpdir(), 'p04-flow-mut');

function fresh() {
  fs.rmSync(TMP, { recursive: true, force: true });
  /* the whole tree (videos included): verify-report runs the asset contract, and a partial copy
     would fail it on EVERY run and make each mutation look caught */
  fs.cpSync(REPO, TMP, { recursive: true, filter: s => !/[\\/]\.git([\\/]|$)/.test(s) });
}
function edit(rel, from, to) {
  const f = path.join(TMP, rel), s = fs.readFileSync(f, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error('mutation anchor x' + n + ': ' + rel + ' :: ' + from);
  fs.writeFileSync(f, s.replace(from, to));
}
const M = 'unit-js/main.js';
/* both suites: a mutation counts as caught when EITHER exits non-zero */
const run = () => {
  const a = spawnSync(process.execPath, [path.join(TMP, '_test', 'verify-report.js')], { encoding: 'utf8', env: process.env });
  const b = spawnSync(process.execPath, [path.join(TMP, '_test', 'statement-flow.js')], { encoding: 'utf8', env: process.env });
  return { status: (a.status || b.status) ? 1 : 0, stdout: a.stdout + b.stdout, stderr: a.stderr + b.stderr };
};

const MUTATIONS = {
  'no synchronous flush after a VIQ answer (D-13)': () =>
    edit(M, '    viqShowPopup(sid, "retry");\n    const chk = document.getElementById(sid + "-check");\n    if (chk) chk.disabled = true;\n    revealHintButton(sid);\n  }\n  try { flushResumeSave(); } catch (e) {}\n}',
            '    viqShowPopup(sid, "retry");\n    const chk = document.getElementById(sid + "-check");\n    if (chk) chk.disabled = true;\n    revealHintButton(sid);\n  }\n}'),
  'the 03 gate promises 3 but enforces 2': () =>
    edit(M, 'items: ["001", "002", "003", "004"], need: 3,', 'items: ["001", "002", "003", "004"], need: 2,'),
  'DQ retry gate removed (D-14)': () =>
    edit(M, '  if (sel.value === q.lastWrong) return;\n', ''),
  'SCQ painter forgets the correct mark': () =>
    edit(M, 'var c = _optEl(sid, q.correctId); if (c) c.classList.add("correct");', ''),
  'engine configuration leaks into the document': () =>
    edit(M, 'scq: ["selected", "attempts", "done", "lastWrong", "result"],', 'scq: ["selected", "attempts", "done", "lastWrong", "result", "correctId"],'),
  /* since 2026-11-14 the whole guided walk-through (01-004) reports nothing: the mutation puts one of
     its pick steps back into the map, which the [guided] check must catch */
  'a guided step reported as a question (01-004 q1)': () =>
    edit(M, 's6: [6, "q1"], s7: [7, "q2"], s8: [8, "q3"],', 's6: [6, "q1"], s7: [7, "q2"], s8: [8, "q3"], s10: [10, "q1"],'),
  'answered.last on every attempt (isLast idiom broken)': () =>
    edit(M, 'xapiReport(sid, isCorrect, isCorrect || q.attempts >= 2,', 'xapiReport(sid, isCorrect, true,'),
  'repaint missing from goTo': () =>
    edit(M, '  repaintScreen(n);\n  try { restoreEndedButton(n); } catch (e) {}', '  try { restoreEndedButton(n); } catch (e) {}'),
  'a screen missing from a component map (silently never reports)': () =>
    edit('methodica-math-percent-04-05/script.js', "  56: ['005', 1],\n", ''),
  'component id without its trailing slash': () =>
    edit('methodica-math-percent-04-02/script.js', "var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';", 'var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG;'),
  'script.js after main.js': () => {
    const f = 'methodica-math-percent-04-06/index.html', s = fs.readFileSync(path.join(TMP, f), 'utf8');
    const tagS = (s.match(/<script src="script\.js\?v=\d+"><\/script>/) || [])[0];
    const tagM = (s.match(/<script src="\.\.\/unit-js\/main\.js\?v=\d+"><\/script>/) || [])[0];
    edit(f, tagS, '');
    edit(f, tagM, tagM + tagS);
  },
  'peak 06 promises 3 of 4 but scores 2 of 4 a pass': () =>
    edit('methodica-math-percent-04-06/script.js', "n: 4, need: 3 }", "n: 4, need: 2 }"),
  'flush placed before the commitment (D-13)': () => {
    edit(M, '  /* one tap, one attempt — always the final answer */\n  xapiReport(sid, idx === cfg.correct, true, cfg.opts[idx]);',
            '  try { flushResumeSave(); } catch (e) {}\n  /* one tap, one attempt — always the final answer */\n  xapiReport(sid, idx === cfg.correct, true, cfg.opts[idx]);');
    edit(M, '  gprogRefresh();\n  try { flushResumeSave(); } catch (e) {}\n}', '  gprogRefresh();\n}');
  },
  'D-8: ended last button re-enabled after reload': () =>
    edit(M, '  else if (window.PART_CONFIG && n === window.PART_CONFIG.end) btn = lastScreenButton();\n', ''),
  'D-8 overreach: last button disabled by position, ledger ignored': () =>
    edit(M, '  if (!sent) return;                 /* fails OPEN', '  if (!sent && !(window.PART_CONFIG && n === window.PART_CONFIG.end)) return;  /* fails OPEN'),
  'station = last part instead of all parts': () =>
    edit(M, 'return n > 0 && keys.length === n && keys.every(', 'return n > 0 && keys.length === n && keys.slice(-1).every('),
};

fresh();
const base = run();
console.log('unmutated copy: exit ' + base.status + ' — ' + base.stdout.trim().split('\n')[0]);
let bad = base.status !== 0;
for (const [name, apply] of Object.entries(MUTATIONS)) {
  fresh(); apply(); const r = run();
  const caught = r.status === 1;
  if (!caught) bad = true;
  console.log((caught ? 'CAUGHT ' : 'MISSED ') + name + '  → ' + ((r.stdout.split('\n').find(l => l.includes('FAIL')) || r.stdout.trim() || r.stderr.trim()).trim()).slice(0, 160));
}
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
