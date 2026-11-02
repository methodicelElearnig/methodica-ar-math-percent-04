#!/usr/bin/env node
/* ═══════════════════ structural verifier — NOT DEPLOYED ═══════════════════
   STRUCTURE: the wiring is present and every contract holds. Behaviour (which statements
   leave, in what order) is _test/statement-flow.js.

   Run (jsdom outside OneDrive — see README.md):
     set NODE_PATH=%TEMP%\lomda-test\node_modules
     node _test/verify-report.js */
'use strict';
const fs = require('fs'), path = require('path');
const { BASE, UNIT, COMPONENTS, PART_DIR, readJSON, metadata, reporter, boot } = require('./harness');
const R = reporter();
const read = rel => fs.readFileSync(path.join(BASE, rel), 'utf8');
const main = read('unit-js/main.js');

/* Declared catalogue questions the UI deliberately never reports — decision 08.10.26
   (docs-and-tools/XAPI-MAP.md). Anything else silent is a failure. */
const WAIVED = { '01': ['004/q3', '004/q6', '004/q8'] };

/* ── 1. ids against metadata/ ── */
const unitMeta = readJSON(path.join(BASE, 'metadata', UNIT + '_unit.json'));
const identity = read('unit-js/10-identity.js');
const prefix = (identity.match(/var XAPI_ID_PREFIX = '([^']+)'/) || [])[1];
const unitId = (identity.match(/window\.XAPI_UNIT_ID = '([^']+)'/) || [])[1];
R.eq('ids', 'XAPI_UNIT_ID = unit metadata id', unitId, unitMeta.id);

COMPONENTS.forEach(c => {
  const md = metadata(c);
  const b = boot(c, { noLibrary: true, search: '' });
  const cfg = b.json('{slug: XAPI_COMP_SLUG, id: XAPI_COMP_ID, file: XAPI_METADATA_FILE, map: SCREEN_TO_SUBCONTENT, evalItems: XAPI_EVAL_ITEMS, part: PART_CONFIG, qmap: XAPI_QMAP}');
  R.eq('ids', c + ': XAPI_COMP_ID = metadata id (byte for byte)', cfg.id, md.id);
  R.ok('ids', c + ': XAPI_COMP_ID = prefix + slug + "/"', cfg.id === prefix + PART_DIR(c) + '/');
  R.eq('ids', c + ': learningUnitId = unit id', md.learningUnitId, unitMeta.id);
  R.eq('ids', c + ': XAPI_METADATA_FILE names its own file', cfg.file, '../metadata/' + PART_DIR(c) + '.json');
  R.ok('ids', c + ': slug is lowercase', cfg.slug === cfg.slug.toLowerCase());

  /* ── 2. the map, both directions ── */
  const keys = Object.keys(cfg.map).map(Number).sort((a, x) => a - x);
  const range = []; for (let n = cfg.part.start; n <= cfg.part.end; n++) range.push(n);
  R.eq('map', c + ': SCREEN_TO_SUBCONTENT has exactly the component\'s screens', keys, range);
  const items = md.subContent.map(s => s.id.replace(/\/+$/, '').slice(-3));
  const mapped = [...new Set(Object.values(cfg.map).filter(Boolean).map(v => v[0]))].sort();
  R.eq('map', c + ': every catalogue item has a screen, and no screen names a missing item', mapped, items.slice().sort());
  md.subContent.forEach(s => R.ok('map', c + ': item id shape ' + s.id, s.id === md.id + PART_DIR(c) + '-' + s.id.replace(/\/+$/, '').slice(-3) + '/'));
  const evalExpected = md.subContent.filter(s => (s.questions || []).length).map(s => s.id.replace(/\/+$/, '').slice(-3)).sort();
  R.eq('map', c + ': XAPI_EVAL_ITEMS = the items that carry questions', Object.keys(cfg.evalItems).sort(), evalExpected);

  /* ── 3. every declared question is reported (or explicitly waived), and every reported one is declared ── */
  const reported = Object.entries(cfg.qmap)
    .filter(([, v]) => cfg.map[v[0]])
    .map(([, v]) => cfg.map[v[0]][0] + '/' + v[1]);
  const declared = [];
  md.subContent.forEach(s => (s.questions || []).forEach(q => {
    const item = s.id.replace(/\/+$/, '').slice(-3), key = item + '/' + q.questionId.split('/').pop();
    declared.push(key);
    R.ok('questions', c + ': questionId starts with its item id — ' + key, q.questionId.indexOf(s.id) === 0);
  }));
  const waived = WAIVED[c] || [];
  declared.forEach(k => R.ok('questions', c + ': declared ' + k + ' is reported or waived', reported.includes(k) || waived.includes(k)));
  reported.forEach(k => R.ok('questions', c + ': reported ' + k + ' exists in metadata', declared.includes(k)));
  waived.forEach(k => R.ok('questions', c + ': waived ' + k + ' is NOT reported', !reported.includes(k)));
  R.eq('questions', c + ': no question reported twice', reported.length, new Set(reported).size);

  /* ── 4. routing edges are slugs of real folders ── */
  ['next', 'prev'].forEach(k => {
    const v = cfg.part[k];
    if (v) R.ok('routing', c + ': PART_CONFIG.' + k + ' is a sibling component slug', fs.existsSync(path.join(BASE, v)) && /^methodica-math-percent-04-0\d$/.test(v), v);
  });
  b.close();
});

/* ── 5. the layer contract ── */
COMPONENTS.forEach(c => {
  const html = read(PART_DIR(c) + '/index.html');
  const srcs = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
  R.eq('layer', c + ': script tags in the load-bearing order', srcs,
    ['../unit-js/10-identity.js', '../unit-js/20-xapi.js', '../unit-js/40-resume.js', '../unit-js/50-loader.js', 'script.js', '../unit-js/main.js', '../unit-js/90-boot.js']);
  R.ok('layer', c + ': boot cover is a sibling immediately before #app', /id="boot-cover"[\s\S]*?<\/script>\s*<div id="app"/.test(html));
});
const loader = read('unit-js/50-loader.js');
const lib = (loader.match(/RESUME_ENABLED \? '(xapi-720-[a-z])\.js'/) || [])[1];
R.eq('layer', 'the loader names xapi-720-k with resume on', lib, 'xapi-720-k');
R.ok('layer', 'the library letter is inside the XAPI_USING_G regex', new RegExp((loader.match(/XAPI_USING_G = \/(.+?)\/\.test/) || [])[1] || 'x^').test(lib + '.js'));
R.ok('layer', 'main.js declares no SCREEN_TO_SUBCONTENT (it would overwrite script.js\'s)', !/^\s*(var|let|const)\s+SCREEN_TO_SUBCONTENT\b/m.test(main));
R.ok('layer', 'main.js declares no shortId (10-identity.js owns it)', !/^function shortId\b/m.test(main));

/* no top-level name in both a numbered file and main.js / a script.js (silent last-wins) */
const decl = s => [...s.matchAll(/^(?:function|var|let|const)\s+([A-Za-z0-9_$]+)/gm)].map(m => m[1]);
const shared = new Map();
fs.readdirSync(path.join(BASE, 'unit-js')).filter(f => /^\d.*\.js$/.test(f)).forEach(f => decl(read('unit-js/' + f)).forEach(n => shared.set(n, f)));
decl(main).forEach(n => R.ok('layer', 'main.js does not redeclare ' + n + ' (' + shared.get(n) + ')', !shared.has(n)));
COMPONENTS.forEach(c => decl(read(PART_DIR(c) + '/script.js')).forEach(n => R.ok('layer', c + '/script.js does not redeclare ' + n, !shared.has(n))));

/* storage keys agree */
const resume = read('unit-js/40-resume.js');
R.eq('keys', 'UI_CHARACTER_KEY = main.js CHARACTER_STORAGE_KEY',
  (resume.match(/var UI_CHARACTER_KEY = '([^']+)'/) || [])[1], (main.match(/CHARACTER_STORAGE_KEY = "([^"]+)"/) || [])[1]);
const resultKeys = JSON.parse(((resume.match(/var RESULT_KEYS\s*=\s*(\[[\s\S]*?\]);/) || [])[1] || '[]').replace(/'/g, '"'));
const scoreKeys = [...main.matchAll(/"methodica-math-percent-04-0\d": "(percent04_c0\d_scaled)"/g)].map(m => m[1]);
R.eq('keys', 'RESULT_KEYS = UNIT_SCORE_KEYS values', resultKeys, scoreKeys);
R.ok('keys', 'NAV_EDGE_KEY carries the unit slug', resume.includes("var NAV_EDGE_KEY = 'lomda_nav_edges::" + UNIT + "'"));
const stub = read('_test/xapi-720-k.js');
R.ok('keys', 'the stub names no other unit', !/ratio|mass-measure|scale-01/.test(stub.replace(/\/\*[\s\S]*?\*\//g, '')));

/* ── 6. flush order (D-13): in every check function the synchronous flush comes AFTER the
        last commitment — tested by position inside the brace-matched body ── */
function body(name) {
  const i = main.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let d = 0, j = main.indexOf('{', i);
  for (let k = j; k < main.length; k++) { if (main[k] === '{') d++; else if (main[k] === '}' && --d === 0) return main.slice(j, k + 1); }
  return null;
}
const COMMIT = /\.done = true|\.answered = true|lastWrong = |setPracticeResult2\(|xapiReport(?:Fields)?\(/g;
['s0Check', 'scqCheck', 'dqCheck', 'viqCheck', 'mcqCheck2', 'gPick', 'taskCheck'].forEach(fn => {
  const src = body(fn);
  R.ok('flush', fn + ' exists', !!src);
  if (!src) return;
  const flush = src.lastIndexOf('flushResumeSave()');
  let last = -1, m; COMMIT.lastIndex = 0; while ((m = COMMIT.exec(src))) last = m.index;
  R.ok('flush', fn + ': flushResumeSave comes after the last commitment', flush > last && last > -1, 'flush@' + flush + ' commit@' + last);
});

/* ── 7. the regression gate: off-platform the lomda behaves as before and sends nothing ── */
COMPONENTS.forEach(c => {
  const b = boot(c, { noLibrary: true, search: '' });
  R.eq('offline', c + ': sendStatement720 is undefined off-platform', b.val('typeof sendStatement720'), 'undefined');
  R.eq('offline', c + ': lands on its own first screen', b.val('currentScreen'), b.val('PART_CONFIG.start'));
  b.exec('for (var n = PART_CONFIG.start; n <= PART_CONFIG.end; n++) goTo(n); goTo(PART_CONFIG.end + 1);');
  R.eq('offline', c + ': a goTo sweep and the end edge raise nothing', b.errors, []);
  R.ok('offline', c + ': the end edge does not navigate', b.w.location.pathname.indexOf(PART_DIR(c)) > 0);
  R.eq('offline', c + ': first-screen back hidden only where there is a previous part',
    b.val("(function(){var x=document.querySelector('#s'+PART_CONFIG.start+' .scq-back'); return !!x && x.hidden;})()"), c !== '01' && b.val("!!document.querySelector('#s'+PART_CONFIG.start+' .scq-back')"));
  R.eq('offline', c + ': the report flag is on every screen',
    b.val("[].every.call(document.querySelectorAll('.screen'), function(s){ return !!s.querySelector('.flag-btn'); })"), true);
  b.close();
});

/* ── 8. the asset contract (its own runner; folded in here so one command checks all) ── */
const ac = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'asset-contract.js')], { encoding: 'utf8' });
R.ok('assets', 'asset-contract.js passes — ' + ac.stdout.trim().split('\n')[0], ac.status === 0, ac.stdout.split('\n').filter(l => l.includes('FAIL')).slice(0, 3).join(' / '));

R.done('verify-report');
