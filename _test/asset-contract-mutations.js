#!/usr/bin/env node
// Run: node _test/asset-contract-mutations.js   (exit 0 = every mutation caught)
// Mutation tests for _test/asset-contract.js (§10.4): each mutation must make it FAIL,
// and must actually have landed (asserted before running). Runs on a throwaway copy.
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..');
const TMP = path.join(os.tmpdir(), 'p04-mut');

function fresh() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.cpSync(REPO, TMP, { recursive: true, filter: s => !s.includes(path.sep + '.git') });
}
function edit(rel, from, to) {
  const f = path.join(TMP, rel), s = fs.readFileSync(f, 'utf8');
  if (!s.includes(from)) throw new Error('mutation anchor missing: ' + rel + ' :: ' + from);
  fs.writeFileSync(f, s.replace(from, to));
}
const run = () => spawnSync(process.execPath, [path.join(TMP, '_test', 'asset-contract.js')], { encoding: 'utf8' });

const MUTATIONS = {
  'wrong-case file name (CDN 404, Windows 200)': () =>
    fs.renameSync(path.join(TMP, 'unit-assets/img/greenhouse.jpg'), path.join(TMP, 'unit-assets/img/Greenhouse.jpg')),
  'bare assets/img literal back in main.js': () =>
    edit('unit-js/main.js', '"../unit-assets/img/character-happy.png"', '"assets/img/character-happy.png"'),
  'font url() resolved from the document, not the stylesheet': () =>
    edit('unit-css/styles.css', "url('../unit-assets/fonts/Assistant-Bold.ttf')", "url('unit-assets/fonts/Assistant-Bold.ttf')"),
  'dead weight re-declared': () =>
    edit('unit-css/styles.css', 'font-weight: 800;', 'font-weight: 300;'),
  '?v= drift in one component': () =>
    edit('methodica-math-percent-04-04/index.html', 'main.js?v=2', 'main.js?v=3'),
  'unversioned script.js': () =>
    edit('methodica-math-percent-04-06/index.html', 'src="script.js?v=1"', 'src="script.js"'),
  'runtime-built clip missing': () =>
    fs.rmSync(path.join(TMP, 'unit-assets/video/character-cube.mp4')),
  'per-component copy grows back': () =>
    fs.writeFileSync(path.join(TMP, 'methodica-math-percent-04-03/styles.css'), '/* stale */'),
  'markup names a missing image': () =>
    edit('methodica-math-percent-04-01/index.html', '../unit-assets/img/hook-sivan.jpg', '../unit-assets/img/hook-sivan.png'),
};

fresh();
const base = run();
console.log('unmutated copy: exit ' + base.status + ' — ' + base.stdout.trim().split('\n')[0]);
let bad = base.status !== 0;
for (const [name, apply] of Object.entries(MUTATIONS)) {
  fresh(); apply(); const r = run();
  const caught = r.status === 1;
  if (!caught) bad = true;
  console.log((caught ? 'CAUGHT ' : 'MISSED ') + name + '  → ' + (r.stdout.split('\n').find(l => l.includes('FAIL')) || r.stdout.trim()).trim());
}
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
