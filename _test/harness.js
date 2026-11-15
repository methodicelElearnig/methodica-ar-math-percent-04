/* ═══════════════════ shared jsdom harness — NOT DEPLOYED ═══════════════════
   Boots one component the way the browser does with ?xapiLib=../_test/xapi-720-k.js:
   the page's own inline scripts run, every <script src> is executed IN TAG ORDER from
   disk (jsdom fetches nothing), then the local library stub, then the component metadata.
   bootXAPI()'s CDN loads are inert here, so a scenario finishes the boot explicitly with
   finishBoot() — the loader's post-metadata sequence (guide §8.5 phase B).

   jsdom has no layout: every scrollHeight is 0, so every scroll-to-end latch reads as
   reached. Assertions about scroll gates belong in a real browser (see README.md).

   Pattern: methodica-math-ratio-02/_test/statement-flow.js. */
'use strict';
const fs = require('fs');
const path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('jsdom not found. Install it OUTSIDE OneDrive and point NODE_PATH at it:\n' +
    '  mkdir %TEMP%\\lomda-test && cd %TEMP%\\lomda-test && npm install jsdom\n' +
    '  set NODE_PATH=%TEMP%\\lomda-test\\node_modules');
  process.exit(2);
}

const BASE = path.join(__dirname, '..');
const UNIT = 'methodica-ar-math-percent-04';
const COMPONENTS = ['01', '02', '03', '04', '05', '06', '07'];
const PART_DIR = c => UNIT + '-' + c;
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const metadata = c => readJSON(path.join(BASE, 'metadata', PART_DIR(c) + '.json'));

/* ok/eq collectors — one per test file */
function reporter() {
  const failures = []; let passes = 0;
  return {
    ok(tag, what, cond, detail) { if (cond) passes++; else failures.push('[' + tag + '] ' + what + (detail ? '  —  ' + detail : '')); },
    eq(tag, what, actual, expected) {
      const a = JSON.stringify(actual), e = JSON.stringify(expected);
      this.ok(tag, what, a === e, 'got ' + a + ', expected ' + e);
    },
    get passes() { return passes; },
    failures,
    done(name) {
      console.log(name + ': ' + passes + ' passed, ' + failures.length + ' failed');
      failures.forEach(f => console.log('  FAIL ' + f));
      process.exitCode = failures.length ? 1 : 0;
    },
  };
}

/* opts.search    URL query (default: a platform-like launch ?slxapi&registration)
   opts.noLibrary  off-platform: no stub, no METADATA — the regression gate
   opts.store      {session, local} to carry the stub's state across a "reload"
   opts.hash       e.g. '#screen=40' */
function boot(c, opts) {
  opts = opts || {};
  const dir = path.join(BASE, PART_DIR(c));
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'http://localhost:8779/' + PART_DIR(c) + '/index.html' +
      (opts.search === undefined ? '?slxapi=1&registration=r1' : opts.search) + (opts.hash || ''),
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  const errors = [];
  if (opts.store) {
    Object.entries(opts.store.session || {}).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
    Object.entries(opts.store.local || {}).forEach(([k, v]) => w.localStorage.setItem(k, v));
  }
  const exec = (code) => {
    const s = w.document.createElement('script');
    s.textContent = code;
    w.document.head.appendChild(s);
    s.remove();
  };
  const val = (expr) => {
    exec('window.__v = (function(){ try { return (' + expr + '); } catch (e) { return "__throw:" + e.message; } })();');
    return w.__v;
  };
  const json = (expr) => { const v = val('JSON.stringify(' + expr + ')'); return v === undefined ? undefined : JSON.parse(v); };

  w.console.log = w.console.warn = () => {};
  w.console.error = (...a) => errors.push(a.map(x => (x && x.message) || String(x)).join(' '));
  w.addEventListener('error', e => errors.push('uncaught: ' + e.message));
  w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  w.HTMLMediaElement.prototype.load = function () {};
  w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  w.HTMLMediaElement.prototype.pause = function () {};
  w.scrollTo = () => {};

  /* the page's scripts, in tag order, from disk */
  for (const src of [...w.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'))) {
    if (/^[a-z]+:\/\//i.test(src) || src.startsWith('//')) continue;
    const p = path.resolve(dir, src.split('?')[0]);
    if (fs.existsSync(p)) exec(fs.readFileSync(p, 'utf8'));
  }

  if (!opts.noLibrary) {
    exec(fs.readFileSync(path.join(BASE, '_test', 'xapi-720-k.js'), 'utf8'));
    exec('window.XAPI_USING_G = true;');
    exec('window.METADATA = ' + JSON.stringify(metadata(c)) + ';');
  }

  const stmts = () => json('window.__stmts ? window.__stmts() : []') || [];
  const clear = () => exec('sessionStorage.removeItem("__test_statements");');
  const store = () => ({
    session: Object.fromEntries(Object.keys(w.sessionStorage).map(k => [k, w.sessionStorage.getItem(k)])),
    local: Object.fromEntries(Object.keys(w.localStorage).map(k => [k, w.localStorage.getItem(k)])),
  });

  /* The loader's post-metadata sequence (50-loader.js phase B): ready → drain → restore the
     saved payload if there is one → component 'initialized' → landing item if not resumed. */
  const finishBoot = () => {
    exec('_resumeReady = true; if (!_unitState) _unitState = readUnitState(); drainPendingUnitState();');
    const payload = json('_unitState && _unitState.payload');
    const resumed = !!payload;
    if (resumed) {
      const hm = /#screen=(\d+)/.exec(opts.hash || '');
      exec('applyExecutionState(_unitState.payload, ' + (hm ? +hm[1] : 'undefined') + ');');
    }
    exec("try { sendStatement720('initialized', 'onlinelesson'); } catch (e) {}");
    if (!resumed) exec('xapiOnScreen(currentScreen);');
    return resumed;
  };

  return { dom, w, exec, val, json, stmts, clear, store, finishBoot, errors, close: () => w.close() };
}

/* "verb tail" of a statement, e.g. "answered.last 003/q2", "completed 03-004", "completed onlinelesson" */
function label(s) {
  const id = (s.opts && (s.opts.questionId || s.opts.objectId)) || '';
  if (!id) return s.verb + ' ' + s.objectType;
  const segs = String(id).replace(/\/+$/, '').split('/');
  const last = segs.pop();
  return s.verb + ' ' + (/^q\d+$/.test(last) ? segs.pop().slice(-3) + '/' + last : last.slice(-6));
}

/* Answer helpers — call the real engine functions, never set state by hand. */
const ACT = {
  scq: (sid, right) => `(function(){var q=SCQ['${sid}'];var ids=[].map.call(document.querySelectorAll('#${sid} .scq-opt'),function(o){return o.dataset.id});
    scqSelect('${sid}', ${right} ? q.correctId : ids.filter(function(i){return i!==q.correctId && i!==q.lastWrong})[0]); scqCheck('${sid}');})();`,
  viq: (sid, rights) => `(function(){var q=VIQ['${sid}'];var r=${JSON.stringify(rights)};viqInputs('${sid}').forEach(function(el,i){
    var ok=Array.isArray(r)?r[i]:r; el.value=String(ok?q.answers[i]:q.answers[i]+(q.attempts?2:1));}); viqOnInput('${sid}'); viqCheck('${sid}');})();`,
  dq: (sid, right) => `(function(){var q=DQ['${sid}'];var sel=document.getElementById('${sid}-sel');
    var bad=[].map.call(sel.options,function(o){return o.value}).filter(function(v){return v && v!==q.correctId && v!==q.lastWrong});
    sel.value=${right} ? q.correctId : bad[0]; dqOnChange('${sid}'); dqCheck('${sid}');})();`,
  mcq: (sid, right) => `(function(){var q=MCQ['${sid}'];
    if (${right}) Array.from(q.correctIds).forEach(function(id){mcqToggle2('${sid}',id)});
    else mcqToggle2('${sid}', [].map.call(document.querySelectorAll('#${sid} .scq-opt'),function(o){return o.dataset.id}).filter(function(i){return !q.correctIds.has(i)})[0]);
    mcqCheck2('${sid}');})();`,
};

/* What a learner can see or use on the ACTIVE screen — the repaint-parity signature. */
const SIG = `(function(){
  var s=document.querySelector('.screen.active'); if(!s) return 'none';
  function cls(e){return [].filter.call(e.classList,function(c){return /correct|wrong|error|selected|revealed|is-visited|is-next|is-locked|dq-/.test(c)}).sort().join('.')}
  var p=[];
  s.querySelectorAll('.scq-opt,.gc-opt,.acq-step').forEach(function(o){p.push('o:'+cls(o)+(o.disabled?'!':''))});
  s.querySelectorAll('input,select,textarea').forEach(function(i){p.push('i:'+i.value+':'+cls(i)+(i.disabled?'!':''))});
  s.querySelectorAll('button[id$="-check"],button[id$="-continue"]').forEach(function(b){p.push('b:'+b.id+':'+b.textContent.trim()+(b.disabled?'!':''))});
  s.querySelectorAll('.qprog-station').forEach(function(q){p.push('p:'+q.className.replace('qprog-station','').trim())});
  document.querySelectorAll('[id$="-popup"]').forEach(function(x){ if(!x.classList.contains('hidden') && x.id.indexOf(s.id)===0) p.push('pop:'+x.id+':'+(x.dataset.state||'')); });
  var fb=s.querySelector('[id$="-feedback"]'); if(fb) p.push('fb:'+fb.className);
  return p.join(' | ');
})()`;

module.exports = { BASE, UNIT, COMPONENTS, PART_DIR, readJSON, metadata, reporter, boot, label, ACT, SIG };
