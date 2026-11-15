#!/usr/bin/env node
// Run: node _test/responses-mutations.js   (NODE_PATH → jsdom; exit 0 = every mutation caught)
// Negative test for _test/responses.js (guide §10.2 "the mutation check", §10.4): the same
// assertions on the response layer as it stood before the §6.3c port must FAIL. Each mutation
// puts back files from git (93c9780 = main before this change) on a throwaway copy, with the
// current metadata/ and tests, and runs responses.js there.
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync, execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '..');
const TMP = path.join(os.tmpdir(), 'ar-p04-resp-mut');
const OLD = '93c9780';

function fresh() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.cpSync(REPO, TMP, { recursive: true, filter: s => !s.includes(path.sep + '.git') && !s.includes(path.sep + 'unit-assets') });
}
function fromGit(rel) {
  fs.writeFileSync(path.join(TMP, rel), execFileSync('git', ['-C', REPO, 'show', OLD + ':' + rel]));
}
const run = () => spawnSync(process.execPath, [path.join(TMP, '_test', 'responses.js')], { encoding: 'utf8', env: process.env });

const MUTATIONS = {
  /* the old 20-xapi.js alone: no xapiResponse, no result.response at all */
  'old 20-xapi.js': () => fromGit('unit-js/20-xapi.js'),
  /* the old main.js alone: screen text, ", "-joined picks, " | "-joined fields, xapiMultiAnswer */
  'old main.js': () => fromGit('unit-js/main.js'),
  /* both: the layer exactly as 93c9780 shipped it */
  'old 20-xapi.js + main.js': () => { fromGit('unit-js/20-xapi.js'); fromGit('unit-js/main.js'); },
};

fresh();
const base = run();
console.log('unmutated copy: exit ' + base.status + ' — ' + (base.stdout.trim().split('\n')[0] || base.stderr.trim()));
let bad = base.status !== 0;
for (const [name, apply] of Object.entries(MUTATIONS)) {
  fresh(); apply(); const r = run();
  const caught = r.status === 1;
  if (!caught) bad = true;
  const resp = r.stdout.split('\n').filter(l => l.includes('FAIL [resp]')).length;
  console.log((caught ? 'CAUGHT ' : 'MISSED ') + name + '  → ' + (r.stdout.trim().split('\n')[0] || r.stderr.trim().split('\n').pop()) + ' (' + resp + ' [resp])');
}
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
