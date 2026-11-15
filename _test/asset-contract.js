#!/usr/bin/env node
/* ══════════════ The asset contract — methodica-ar-math-percent-04 ══════════════
   Run:  node _test/asset-contract.js          (no dependencies)
   Exit: 0 = all pass, 1 = any failure.

   Every failure this guards is SILENT in a browser: a missing font renders in a
   plausible fallback face, a missing <img> renders as nothing, a 404 nobody watches.
   jsdom never fetches CSS or media either, so nothing else in _test/ can see it.

   The layout (hoisted 08.10.26, guide §15):
     unit-assets/{fonts,img,video}/   ONE copy of every asset, for all 7 components
     unit-css/styles.css              ONE stylesheet
     <component>/                     index.html + script.js only — no assets/, no styles.css

   The invariant:
     * shared code (unit-js/*.js, unit-css/styles.css) and every component's markup
       reference assets ONLY as ../unit-assets/… ;
     * a CSS url() resolves against the STYLESHEET's directory, an HTML/JS literal
       against the DOCUMENT's (= the component folder) — both land on ../unit-assets/;
     * names the engine builds at runtime (PR config `media:` / `video:` / `char:` /
       `img:` keys, ACQ_STEPS, tag rows) must each exist in unit-assets/.

   Paths are resolved CASE-EXACTLY (readdirSync, not existsSync): Windows is case-
   insensitive, the CDN is not, and existsSync would pass a wrong-case name here and
   404 it in production (§15 gotcha). */
'use strict';
const fs = require('fs'), path = require('path');

const BASE = path.resolve(__dirname, '..');
const UNIT = 'methodica-ar-math-percent-04';
const COMPONENTS = ['01', '02', '03', '04', '05', '06', '07'];
const PART_DIR = c => UNIT + '-' + c;

let pass = 0; const fails = [];
function ok(group, name, cond, detail) {
  if (cond) pass++; else fails.push('[' + group + '] ' + name + (detail ? '  — ' + detail : ''));
}

/* Case-exact resolution: walk the path segment by segment against readdirSync. */
function resolveExact(absPath) {
  const rel = path.relative(BASE, absPath);
  if (rel.startsWith('..')) return null;                 // never escape the repo
  let cur = BASE;
  for (const seg of rel.split(path.sep).filter(Boolean)) {
    let names; try { names = fs.readdirSync(cur); } catch (e) { return null; }
    if (!names.includes(seg)) return null;
    cur = path.join(cur, seg);
  }
  return cur;
}
const isFile = p => { const r = resolveExact(p); return !!r && fs.statSync(r).isFile(); };
const isDir  = p => { const r = resolveExact(p); return !!r && fs.statSync(r).isDirectory(); };

const stripBlockComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = p => fs.readFileSync(path.join(BASE, p), 'utf8');

/* Exported so verify-report.js can call it. Mutation tests run a COPY of the repo
   (the file resolves BASE from its own location). */
function checkAssetContract() {
  const J = (...p) => path.join(BASE, ...p);
  const R = p => fs.readFileSync(J(p), 'utf8');

  /* ── 1. the shared roots exist, nothing re-grows a per-component copy ── */
  ok('layout', 'unit-css/styles.css exists', isFile(J('unit-css', 'styles.css')));
  for (const d of ['fonts', 'img', 'video'])
    ok('layout', 'unit-assets/' + d + '/ exists', isDir(J('unit-assets', d)));
  for (const c of COMPONENTS) {
    const dir = J(PART_DIR(c));
    ok('layout', c + ': has index.html and script.js',
      isFile(path.join(dir, 'index.html')) && isFile(path.join(dir, 'script.js')));
    ok('layout', c + ': keeps no styles.css of its own', !fs.existsSync(path.join(dir, 'styles.css')));
    ok('layout', c + ': keeps no assets/ of its own', !fs.existsSync(path.join(dir, 'assets')));
  }

  /* ── 2. fonts: exactly the four rendered weights, each @font-face resolving ── */
  const cssPath = J('unit-css', 'styles.css');
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]);
  const weights = faces.map(f => (f.match(/font-weight:\s*(\d+)/) || [])[1]).sort().join(',');
  ok('fonts', '@font-face weights are 400,600,700,800', weights === '400,600,700,800', weights);

  /* ── 3. every url() in the stylesheet resolves from the STYLESHEET's directory ── */
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
    .map(m => m[1].trim()).filter(u => !/^(?:data:|https?:|\/\/|#)/.test(u));
  ok('css', 'styles.css names local assets', urls.length > 0, String(urls.length));
  for (const u of [...new Set(urls)]) {
    ok('css', 'url(' + u + ') points into ../unit-assets/', u.startsWith('../unit-assets/'), u);
    ok('css', 'url(' + u + ') resolves case-exact',
      isFile(path.resolve(path.dirname(cssPath), u.split(/[?#]/)[0])));
  }

  /* ── 4. shared JS: no bare assets/ literal; every ../unit-assets/ literal resolves
        from EVERY component (main.js is one file executed from seven folders) ── */
  const jsFiles = fs.readdirSync(J('unit-js')).filter(f => f.endsWith('.js')).sort();
  for (const f of jsFiles) {
    const src = stripBlockComments(R('unit-js/' + f));
    const bare = [...src.matchAll(/(?:['"`]|src=")assets\//g)].length;
    ok('js', 'unit-js/' + f + ' names no component-local assets/ path', bare === 0, bare + ' bare');
    const lits = [...src.matchAll(/['"`](\.\.\/unit-assets\/[^'"`$]*)/g)].map(m => m[1]);
    for (const u of [...new Set(lits)]) {
      const prefix = u.endsWith('/');                    // concatenation prefix → a directory
      for (const c of COMPONENTS) {
        const abs = path.resolve(J(PART_DIR(c)), u);
        ok('js', 'unit-js/' + f + ': ' + u + ' resolves from ' + c, prefix ? isDir(abs) : isFile(abs));
      }
    }
  }

  /* ── 5. runtime-built names: the config keys the engine splices into
        ../unit-assets/img/${…} and ../unit-assets/video/${…} ── */
  const main = stripBlockComments(R('unit-js/main.js'));
  const built = { img: new Set(), video: new Set() };
  for (const m of main.matchAll(/\b(media|char|img):\s*["']([^"'/]+\.(?:png|jpe?g|svg|gif|webp))["']/g))
    built.img.add(m[2]);
  for (const m of main.matchAll(/\bvideo:\s*["']([^"'/]+\.mp4)["']/g)) built.video.add(m[1]);
  ok('built', 'found runtime-built image names', built.img.size > 10, String(built.img.size));
  /* 7 clips are named by video: keys; the other 2 are static <video> tags in 01's markup. */
  ok('built', 'found runtime-built video names', built.video.size >= 7, String(built.video.size));
  for (const n of built.img)   ok('built', 'img ' + n + ' exists case-exact',   isFile(J('unit-assets', 'img', n)));
  for (const n of built.video) ok('built', 'video ' + n + ' exists case-exact', isFile(J('unit-assets', 'video', n)));

  /* ── 6. component markup: every src/href to an asset is ../unit-assets/ and resolves ── */
  for (const c of COMPONENTS) {
    const html = R(PART_DIR(c) + '/index.html');
    const refs = [...html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)].map(m => m[1])
      .filter(u => /\.(png|jpe?g|svg|gif|webp|mp4|ttf|woff2?)(\?|$)/i.test(u));
    for (const u of refs) {
      ok('html', c + ': ' + u + ' is ../unit-assets/', u.startsWith('../unit-assets/'), u);
      ok('html', c + ': ' + u + ' resolves case-exact',
        isFile(path.resolve(J(PART_DIR(c)), u.split('?')[0])));
    }
  }

  /* ── 7. ?v= on every code reference, identical across components (§3.4, §11.4) ── */
  const seen = {};
  for (const c of COMPONENTS) {
    const html = R(PART_DIR(c) + '/index.html');
    const code = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)].map(m => m[1]);
    ok('version', c + ': links ../unit-css/styles.css', code.some(u => u.split('?')[0] === '../unit-css/styles.css'));
    for (const u of code) {
      /* the CDN library preloads (13.11.26, BOOT-AND-RESUME-HARDENING §2.3 C2) must equal the loader's
         URL byte for byte — no ?v= — or the browser fetches the library twice */
      if (/^https:\/\//.test(u)) { ok('version', c + ': ' + u + ' (CDN preload) carries no ?v=', !/\?/.test(u), u); continue; }
      const [file, q] = u.split('?');
      ok('version', c + ': ' + file + ' carries ?v=', /^v=\d+$/.test(q || ''), u);
      if (file === 'script.js') continue;                // per-part file: own version line
      if (seen[file] && seen[file].v !== q)
        ok('version', file + ' ?v= identical in ' + seen[file].c + ' and ' + c, false, seen[file].v + ' vs ' + q);
      else seen[file] = seen[file] || { v: q, c };
    }
  }
  const vs = COMPONENTS.map(c => (R(PART_DIR(c) + '/index.html').match(/src="script\.js\?(v=\d+)"/) || [])[1]);
  ok('version', 'script.js ?v= identical in all components', new Set(vs).size === 1, vs.join(','));
}

module.exports = { checkAssetContract, resolveExact };

if (require.main === module) {
  checkAssetContract();
  console.log('asset contract: ' + pass + ' passed, ' + fails.length + ' failed');
  fails.forEach(f => console.log('  FAIL ' + f));
  process.exit(fails.length ? 1 : 0);
}
