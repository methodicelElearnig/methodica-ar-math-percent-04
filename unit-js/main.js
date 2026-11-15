"use strict";

/* =====================================================================
   unit-js/main.js — methodica-ar-math-percent-04, shared by all 7 components
   The approved engine (lineage: percent-02 part-01 → ratio-01-01) plus this
   unit's entire screen logic (screens 0-64, global numbering). Each
   component's script.js holds config only (PART_CONFIG + xAPI seams).

   Loads AFTER ../unit-js/10-identity, 20-xapi, 40-resume, 50-loader and
   script.js, BEFORE 90-boot.js — see the platform layer's contract in
   Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §3.
   ⚠️ No top-level name may be declared both here and in a numbered file
   (a var/function collision is a SILENT last-wins overwrite — this file
   loads last and would win). _test/ asserts it.
   ===================================================================== */

/* ─── Constants ─────────────────────────────────────────── */
const TOTAL_SCREENS = 65; // the whole deck, slides 3-90: hook, acquisition x2,
// guided flow, practice sets A/B, class task, advanced
// set and both peak questions
// (pptx slide 7, the character choice, is hidden in the deck)

/* Set a nav-style button's label through the .nav-label wrapper (see
   style.css "Nav-button width consistency") instead of raw textContent —
   a plain textContent assignment would destroy the wrapper structure
   the hover width-reservation mechanism depends on. */
function setNavLabel(btn, label) {
  btn.innerHTML = "";
  const wrap = document.createElement("span");
  wrap.className = "nav-label";
  wrap.dataset.label = label;
  const inner = document.createElement("span");
  inner.textContent = label;
  wrap.appendChild(inner);
  btn.appendChild(wrap);
}

/* Videos play once (no loop). Freeze on the clean opening frame instead
   of dropping into the player's black "ended" state. */
function freezeVideoOnEnd(vid) {
  if (!vid || vid._freezeWired) return;
  vid._freezeWired = true;
  function showRestFrame() {
    try {
      vid.currentTime = 0;
    } catch (e) {}
    vid.pause();
  }
  vid.addEventListener("timeupdate", function () {
    if (vid.duration && vid.currentTime >= vid.duration - 0.3) showRestFrame();
  });
  vid.addEventListener("ended", showRestFrame);
}

/* ─── Companion character persistence ───────────────────────
   Namespaced storage key (per-lomda). Write-only from part 01: the
   choice is saved so later parts can resolve their own character
   assets, but Screen 01's initial state always shows no selection,
   even on reload (approved percent-02 producer instruction). */
const CHARACTER_STORAGE_KEY = "methodica_ar_math_percent_04_selectedCharacter";

/* ─── Companion character asset map ─────────────────────────
   Logical IDs only — never hardcode a character file on a screen.
   character-1 = gray elderly monster with glasses (right card);
   character-2 = purple monster (left card).
   All current files are PPTX-extracted PLACEHOLDERS (marked in the
   name) — production assets replace them 1:1 as they arrive. */
/* 'workout' gray art not yet supplied by the producer — falls back to the
   selection pose until it arrives (see CHARACTER_ASSETS access below). */
const CHARACTER_ASSETS = {
  /* slide 7 — "איך תרצו ללמוד?": the option the learner picks decides which
     monster follows them (production note: "הדמות שנבחרה במסך הזה תופיע
     בכל מקומות הדמות לאורך כל הרכיבים ביחידה"). */
  "character-1": { selection: "../unit-assets/img/character-1-selection.png" },
  "character-2": { selection: "../unit-assets/img/character-2-selection.png" },
};

function characterAsset(pose) {
  const id = CHARACTER_ASSETS[window.lomdaState.selectedCharacter]
    ? window.lomdaState.selectedCharacter
    : "character-1";
  return CHARACTER_ASSETS[id][pose];
}

/* ─── Global lomda state ─────────────────────────────────────
   Single source of truth that persists across every screen for the
   whole session. Always starts unselected (see note above). */
window.lomdaState = window.lomdaState || {
  /* pptx slide 7 (the TwoOptionSelection) is marked hidden — "שקף מוסתר, לא
     מופיע במצגת" — so there is no choice screen and the companion is fixed. */
  selectedCharacter: "character-1",
};

/* ─── State ─────────────────────────────────────────────── */
let currentScreen = 0;

/* ─── Scale App — 1280×710 design grid, scale-to-fit + extend the
   canvas to fill the viewport (no letterboxing) so chrome anchored to
   canvas edges (flag button, bottom bar) reaches the actual screen
   edges on any aspect ratio. ─── */
function scaleApp() {
  const app = document.getElementById("app");
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 710);
  const canvasW = window.innerWidth / scale;
  const canvasH = window.innerHeight / scale;
  app.style.width = canvasW + "px";
  app.style.height = canvasH + "px";
  app.style.transform = `scale(${scale})`;
  app.style.left = "0px";
  app.style.top = "0px";
}
/* The resize listener and the first scaleApp() call live in ../unit-js/90-boot.js:
   scaleApp() has to run after initResumeResetHatch() (which rewrites the URL)
   and before anything measures #app. */

/* ─── Navigation ────────────────────────────────────────── */
/* 16.09.26 — the unit ships as SEVEN components (the deck names them on its own
   separator slides 2/41/51/62/65/76/84). Screens keep one global numbering
   0-64 across all of them; `window.PART_CONFIG = { start, end, next }` in each
   component's script.js is what bounds navigation, and walking off the end
   hands over to the next component's folder. */
/* A component renders ONLY its own screens. Every part ships the same builders
   and the same configs, so without this filter each one would also emit the
   other six components' markup — and pull their images and videos with it. */
function inThisPart(n) {
  const cfg = window.PART_CONFIG;
  return !cfg || (n >= cfg.start && n <= cfg.end);
}

function goTo(n) {
  /* The two edges of this component (08.10.26 — the platform owns routing, guide §8.12):
     walking past `end` ENDS the component (report + disable, no navigation — the hop to the
     next component survives only under DEV_NAV, see leaveToPart); walking before `start` is a
     no-op in production (goBackToPreviousPart returns unless DEV_NAV, and hideCrossPartBack
     hides the first screen's "חזרה"). Both edges derive from PART_CONFIG, no screen number here. */
  if (window.PART_CONFIG) {
    if (n > window.PART_CONFIG.end) {
      if (window.PART_CONFIG.next) leaveToPart(window.PART_CONFIG.next, window.PART_CONFIG.end + 1);
      else finishUnit();
      return;
    }
    if (n < window.PART_CONFIG.start) {
      if (window.PART_CONFIG.prev) {
        try { goBackToPreviousPart(window.PART_CONFIG.prev, "#screen=" + (window.PART_CONFIG.start - 1)); }
        catch (e) { console.error("[nav] back to previous part", e); }
      }
      return;
    }
  }
  if (n < 0 || n >= TOTAL_SCREENS) return;
  /* a removed screen is never a destination — jumping to one (dev bar, a hard
     link) continues in the direction of travel (producer 14.09.26) */
  while (typeof REMOVED_SCREENS !== "undefined" && REMOVED_SCREENS.includes(n)) {
    n += n >= currentScreen ? 1 : -1;
    if (n < 0 || n >= TOTAL_SCREENS) return;
  }
  /* Resolve the target BEFORE mutating anything: a screen this component's markup does
     not have (a resume payload naming another part's screen) must leave the current one
     active, not leave NO screen active with currentScreen desynced (ratio-02 lesson). */
  const next = document.getElementById("s" + n);
  if (!next) return;
  // Feedback popups / hint overlays live outside .screen divs — close them
  // all on every navigation so none carries over to the next screen.
  document.querySelectorAll('[id$="-popup"], [id$="-hint-overlay"]').forEach((el) => el.classList.add("hidden"));
  const prev = document.querySelector(".screen.active");
  if (prev) prev.classList.remove("active");
  currentScreen = n;
  next.classList.add("active");
  /* A hidden clip carries data-src instead of src, so the page does not download it at load
     (BOOT-AND-RESUME-HARDENING §2.3 C4, 13.11.26: part 01's s9 / s21 clips). Moved to src on the
     first entry, before resetScreenState (an enter hook may call load()); its autoplay starts it.
     <video> only. */
  next.querySelectorAll("video[data-src]").forEach((v) => { v.setAttribute("src", v.getAttribute("data-src")); v.removeAttribute("data-src"); });
  /* xAPI item scope — after the screen is active and currentScreen is set, before anything
     can navigate away. Swallowed on purpose: reporting must never stop a learner. */
  try { xapiOnScreen(n); } catch (e) {}
  /* resetScreenState is NOT a pure initialiser here: restoreFeedback() re-opens an answered
     question's verdict, so in-part navigation needs no capture/re-apply/repaint sandwich. The
     painters are needed only after a page LOAD — applyExecutionState() drives them there. */
  resetScreenState(n);
  /* Resume painters — after the entry resets, unconditional (guide §8.4a). Idempotent: in live
     play they re-apply what is on screen; after a load they rebuild it. Then a gate that
     already fired keeps its button dead (§8.8 rule 12). */
  repaintScreen(n);
  try { restoreEndedButton(n); } catch (e) {}
  // Keep the dev harness in sync when navigation happens INSIDE the lomda
  // (buttons/keyboard), not only via the DEV bar.
  if (window.parent !== window) {
    window.parent.postMessage({ type: "DEV_SCREEN", screen: n }, "*");
  }
  /* Resume: the screen change is the choke point that bounds what a learner can lose.
     Debounced, and self-suppressing while restoring or before the document was read. */
  try { scheduleResumeSave(); } catch (e) {}
}

/* Feedback PERSISTS (producer 24.08): goTo() closes every popup so none leaks
   onto the next screen, so coming back to an answered question re-opens the
   verdict it ended on — green or red, popup or inline. Only the final verdict
   is restored; a mid-attempt "try again" is not a state worth keeping. */
function restoreFeedback(n) {
  const mine = (sid) => sid === "s" + n || sid.startsWith("s" + n + "q");
  const engines = [
    [typeof SCQ !== "undefined" && SCQ, scqShowPopup2],
    [typeof DQ !== "undefined" && DQ, dqShowPopup],
    [typeof VIQ !== "undefined" && VIQ, viqShowPopup],
    [typeof MCQ !== "undefined" && MCQ, scqShowPopup2Generic],
    [typeof gState !== "undefined" && gState, gShowPopup],
  ];
  engines.forEach(([map, show]) => {
    if (!map) return;
    Object.keys(map).forEach((sid) => {
      const q = map[sid];
      if (mine(sid) && q && (q.done || q.answered) && q.result) show(sid, q.result);
    });
  });
}

function resetScreenState(n) {
  restoreFeedback(n);
  if (n === 0) s0Enter();
  if (n === 1) s1Enter();
  if (n === 5) s5Enter();
  if (typeof prScrollEnter === "function") prScrollEnter(n);
  if (typeof scrollSetEnter === "function") scrollSetEnter(n);
  // question screens: hint button hides once resolved
  const HINT_DONE = {
    s2: () => DQ.s2.done,
    s3: () => SCQ.s3.done,
    s4: () => SCQ.s4.done,
    s6: () => DQ.s6.done,
    s7: () => SCQ.s7.done,
    s8: () => SCQ.s8.done,
  };
  if (HINT_DONE["s" + n]) {
    const hb = document.getElementById("s" + n + "-hint");
    if (hb) hb.style.visibility = HINT_DONE["s" + n]() ? "hidden" : "visible";
  }
  /* Hint gate: these screens offer the hint only AFTER a first attempt
     (producer 14.09.26). `visibility`, not `display`, so the bottom bar keeps
     its layout and nothing jumps when the button appears. */
  if (hintGated("s" + n)) {
    /* a scrollset screen gates each of its inline questions (s59q1, s59q2…) */
    const sids = ["s" + n].concat((typeof scrollSets !== "undefined" && scrollSets[n] && scrollSets[n].qids) || []);
    sids.forEach((sid) => {
      const hb = document.getElementById(sid + "-hint");
      const st = (typeof SCQ !== "undefined" && SCQ[sid]) || (typeof DQ !== "undefined" && DQ[sid])
        || (typeof MCQ !== "undefined" && MCQ[sid]) || (typeof VIQ !== "undefined" && VIQ[sid]);
      if (hb && st) hb.style.visibility = (st.attempts > 0 && !st.done) ? "visible" : "hidden";
    });
  }
}

/* screens whose hint unlocks on the first wrong answer.
   QA 05.10.26 added dev 48, the peak-question scrollset (dev 59, every inline
   question in it) and all of component 07 (dev 62-64). */
const HINT_AFTER_FIRST_TRY = ["s3", "s4", "s6", "s7", "s28", "s29", "s30", "s31", "s32", "s33", "s34", "s43", "s44", "s48", "s49", "s50", "s51", "s52", "s53", "s54", "s55", "s57", "s59", "s62", "s63", "s64"];
/* an inline question id (s59q2) is gated by its screen (s59) */
function hintGated(sid) {
  return HINT_AFTER_FIRST_TRY.includes(sid) || HINT_AFTER_FIRST_TRY.includes(sid.replace(/q\d+$/, ""));
}
function revealHintButton(sid) {
  if (!hintGated(sid)) return;
  const hb = document.getElementById(sid + "-hint");
  if (hb) hb.style.visibility = "visible";
}

/* screens the producer removed outright — navigation hops over them in both
   directions, and the numbering of everything else is untouched. */
const REMOVED_SCREENS = []; // 65 was the last screen; TOTAL_SCREENS simply shrank
function nextLiveScreen(from, step) {
  let n = from + step;
  while (REMOVED_SCREENS.includes(n)) n += step;
  return n;
}

function advanceScreen() {
  // Per-screen gates hold for keyboard navigation too (percent-02
  // convention — the ArrowLeft path must not skip an unfinished screen).
  if (currentScreen === 0 && !s0State.answered) return;
  if (currentScreen === 1 && !s1AllOpened()) return;
  if (currentScreen === 2 && !DQ.s2.done) return;
  if (currentScreen === 3 && !SCQ.s3.done) return;
  if (currentScreen === 4 && !SCQ.s4.done) return;
  if (currentScreen === 5 && !s5AllOpened()) return;
  if (currentScreen === 6 && !DQ.s6.done) return;
  if (currentScreen === 7 && !SCQ.s7.done) return;
  if (currentScreen === 8 && !SCQ.s8.done) return;
  if (currentScreen >= 10 && currentScreen <= 20 && !gAnswered(currentScreen)) return;
  /* practice sets: each question screen gates on its own engine */
  if (typeof SCQ !== "undefined" && SCQ["s" + currentScreen] && !SCQ["s" + currentScreen].done) return;
  if (typeof VIQ !== "undefined" && VIQ["s" + currentScreen] && !VIQ["s" + currentScreen].done) return;
  if (typeof DQ !== "undefined" && DQ["s" + currentScreen] && !DQ["s" + currentScreen].done) return;
  if (typeof MCQ !== "undefined" && MCQ["s" + currentScreen] && !MCQ["s" + currentScreen].done) return;
  if (typeof TASKS !== "undefined" && TASKS["s" + currentScreen] && !TASKS["s" + currentScreen].done) return;
  if (typeof prScrollGate === "function" && !prScrollGate(currentScreen)) return;
  if (typeof scrollSetGate === "function" && !scrollSetGate(currentScreen)) return;
  /* A pass threshold promised on screen (SET_GATES): checked LAST, after every "answered"
     guard above, in the one function every forward path goes through — the button and the
     keyboard alike. Below it the component ENDS here and navigates nowhere (guide §6.4). */
  if (gateBlocks(currentScreen)) {
    endComponentHere(SET_GATES[currentScreen].btn);
    return;
  }
  goTo(nextLiveScreen(currentScreen, 1));
}

function goBack() {
  goTo(nextLiveScreen(currentScreen, -1));
}

/* ─── Keyboard navigation ───────────────────────────────── */
document.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
  if (e.target && e.target.tagName === "INPUT") return;
  // No screen navigation while the report modal (or its confirm) is open
  if (
    document.getElementById("report-modal")?.hasAttribute("hidden") === false ||
    document.getElementById("report-confirm-modal")?.hasAttribute("hidden") === false
  )
    return;
  if (e.key === "ArrowLeft") advanceScreen();
  if (e.key === "ArrowRight") goBack();
});

/* ═══════════════════════════════════════════════════════════
   Click-gesture hints (Figma Desktop Click Hint / Cursor Drag) —
   S1: one over the first flip card (dismissed on first flip), one
   beside the scrollbar (dismissed on first scroll).
   ═══════════════════════════════════════════════════════════ */
const SPARK_DIRS = [
  [0, -80],
  [56.57, -56.57],
  [80, 0],
  [56.57, 56.57],
  [0, 80],
  [-56.57, 56.57],
  [-80, 0],
  [-56.57, -56.57],
];
function makeClickHint(id) {
  const el = document.createElement("div");
  el.className = "click-hint";
  el.id = id;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    '<div class="click-hint__ripple1"><img src="../unit-assets/img/hint/ripple-ring-1.svg" alt=""></div>' +
    '<div class="click-hint__ripple2"><img src="../unit-assets/img/hint/ripple-ring-2.svg" alt=""></div>' +
    SPARK_DIRS.map(
      ([dx, dy], i) =>
        `<div class="click-hint__spark" style="--dx:${dx}px; --dy:${dy}px; --d:${i * 3}ms"><img src="../unit-assets/img/hint/spark.svg" alt=""></div>`,
    ).join("") +
    '<div class="click-hint__cursor"><img src="../unit-assets/img/hint/cursor.svg" alt=""></div>';
  return el;
}

/* hint placement for this unit lives with its screen code below */

/* ═══════════════════════════════════════════════════════════


/* ═══════════════════════════════════════════════════════════
   Generic hint overlay controls (percent-02 scq-hint behavior)
   ═══════════════════════════════════════════════════════════ */
function openHint(sid) {
  const ov = document.getElementById(sid + "-hint-overlay");
  if (!ov) return;
  /* xAPI requested.1 — after the guard, immediately before the hint is really revealed.
     This function only OPENS (closeHint is separate), and the ledger dedupes repeats. */
  xapiHint(sid);
  ov.classList.remove("hidden");
}
function closeHint(sid) {
  document.getElementById(sid + "-hint-overlay")?.classList.add("hidden");
}
function closeHintOnBackdrop(e, sid) {
  if (e.target && e.target.id === sid + "-hint-overlay") closeHint(sid);
}
function hideHintButton(sid) {
  const hb = document.getElementById(sid + "-hint");
  if (hb) hb.style.visibility = "hidden";
  document.getElementById(sid + "-hint-box")?.classList.add("hidden");
}

/* Inline hint — for a question that lives INSIDE a scroll.
   A scrollset holds several questions on one screen, so a hint cannot sit in
   the bottom bar (it would be ambiguous) and must not open a modal (it would
   cover the scroll and lose the reader's place). It opens in place, in the
   block of the question it belongs to. */
function toggleInlineHint(qid) {
  const box = document.getElementById(qid + "-hint-box");
  const btn = document.getElementById(qid + "-hint");
  if (!box) return;
  const open = box.classList.toggle("hidden") === false;
  /* a TOGGLE — report only on the opening branch, never on the close */
  if (open) xapiHint(qid);
  if (btn) setNavLabel(btn, open ? "إغلاق التلميح" : "أريد تلميحًا");
}

/* ═══════════════════════════════════════════════════════════
   Guided Instruction steps — one-tap reveal (percent-02 s19Select):
   correct turns green, a wrong pick turns red, continue unlocks.
   Keys come from the script's V badges.
   ═══════════════════════════════════════════════════════════ */
const GSTEPS = {}; // one-tap reveal steps land here as they are built

function gstepSelect(sid, id) {
  const st = GSTEPS[sid];
  if (!st || st.answered) return;
  document.querySelectorAll("#" + sid + " .s19-opt").forEach((o) => {
    if (o.dataset.id === st.correctId) o.classList.add("correct");
    else if (o.dataset.id === id) o.classList.add("incorrect");
    o.setAttribute("aria-checked", o.dataset.id === id ? "true" : "false");
    o.disabled = true;
  });
  st.answered = true;
  const cont = document.getElementById(sid + "-continue");
  if (cont) cont.disabled = false;
}

/* ═══════════════════════════════════════════════════════════
   Generic single-choice engine (percent-02 policy) for the part-02+
   SCQ screens: S23 socks, S27 pancakes, S35 triangle.
   ═══════════════════════════════════════════════════════════ */
const SCQ = {
  /* keys from each slide's feedback text (the deck has no V badges here —
     the feedback states the verdict and the arithmetic) */
  s3: {
    correctId: "a",
    selected: null,
    attempts: 0,
    done: false,
    lastWrong: null,
    correctTitle: "كلّ الاحترام!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: ["عندما تزيد كمية بنسبة <span dir='ltr'>20%</span>، حجمها بالنسبة المئوية هو:", '<span dir="ltr">100% + 20% = 120%</span>'],
    hint: "ابدأوا من <span dir='ltr'>100%</span> (الكمية الأصلية)، وأضيفوا زيادة الـ <span dir='ltr'>20%</span>. ما هي النسبة المئوية التي تحصلون عليها؟",
  },
  s4: {
    correctId: "b",
    selected: null,
    attempts: 0,
    done: false,
    lastWrong: null,
    correctTitle: "كلّ الاحترام!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "النسب المئوية تُحسب دائماً من الكمية الأصلية.",
      "لذلك، حتى لو كانت نسبة الزيادة متطابقة، عندما تكون الكمية الأولية أكبر، فإن الإضافة ستكون أكبر أيضاً.",
    ],
    hint: "احسبوا كم تمثل <span dir='ltr'>10%</span> من كل كمية. نسبة الزيادة متساوية (<span dir='ltr'>10%</span>)، لكن هل كمية الزيادة متساوية أيضاً؟",
  },
  s8: {
    correctId: "a",
    selected: null,
    attempts: 0,
    done: false,
    lastWrong: null,
    correctTitle: "كلّ الاحترام!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "النسبة المئوية تُحسب دائماً من السعر الأصلي.",
      "لذلك، حتى لو كانت نسبة الخصم متساوية، عندما يكون السعر الأصلي أعلى، فإن الخصم بالشواقل سيكون أكبر أيضاً.",
      "في المتجر أ ستكون الخصم ⁦₪20⁩ (<span dir='ltr'>10%</span> من 200) وبالتالي، ستبلغ تكلفة الحقيبة ⁦₪180⁩.",
      "في المتجر ب، الخصم سيكون ⁦₪15⁩ (<span dir='ltr'>10%</span> من 150) وبالتالي، ستكون تكلفة الحقيبة ⁦₪135⁩.",
      "الخلاصة: سعر الحقيبة في المتجر ب أقل.",
    ],
    hint: "احسبوا كم يساوي <span dir='ltr'>10%</span> من كل واحدة من الكميات. نسبة الخصم واحدة (<span dir='ltr'>10%</span>)، لكن هل مبلغ الخصم (بالشواقل) واحد أيضًا؟",
  },
  s7: {
    correctId: "a",
    selected: null,
    attempts: 0,
    done: false,
    lastWrong: null,
    correctTitle: "كلّ الاحترام!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: ["عندما تنخفض كمية بنسبة <span dir='ltr'>20%</span>، حجمها بالنسبة المئوية هو:", '<span dir="ltr">100% - 20% = 80%</span>'],
    hint: "ابدأوا من <span dir='ltr'>100%</span> (الكمية الأصلية)، وطرحوا انخفاض نسبته <span dir='ltr'>20%</span>. أي نسبة مئوية تحصلون عليها؟",
  },
};
function s3Select(id) {
  scqSelect("s3", id);
}
function s3Check() {
  scqCheck("s3");
}
function s4Select(id) {
  scqSelect("s4", id);
}
function s4Check() {
  scqCheck("s4");
}
function s8Select(id) {
  scqSelect("s8", id);
}
function s8Check() {
  scqCheck("s8");
}
function s7Select(id) {
  scqSelect("s7", id);
}
function s7Check() {
  scqCheck("s7");
}
function scqSelect(sid, id) {
  const q = SCQ[sid];
  if (!q || q.done) return;
  q.selected = id;
  if (q.attempts > 0) {
    document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => o.classList.remove("wrong", "correct"));
    document.getElementById(sid + "-popup")?.classList.add("hidden");
  }
  document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => {
    const sel = o.dataset.id === id;
    o.classList.toggle("selected", sel);
    o.setAttribute("aria-checked", sel ? "true" : "false");
  });
  const chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = q.selected === q.lastWrong;
}
function scqShowPopup2(sid, type) {
  const q = SCQ[sid];
  if (type !== "retry") q.result = type; // remembered so the verdict survives navigation
  const cfg = {
    retry: { bg: "#ffdbdc", title: "الإجابة غير دقيقة، هل نحاول مرة أخرى؟", body: [] },
    correct: { bg: "#edf8ed", title: q.correctTitle, body: q.body },
    wrong2: { bg: "#ffdbdc", title: q.wrongTitle, body: q.bodyWrong || q.body },
  }[type];
  const popup = document.getElementById(sid + "-popup");
  if (!popup) return;
  popup.style.background = cfg.bg;
  /* state marker so CSS can treat the red panel differently from the green one
     (producer 14.09.26: the red title reads right, the green stays centred) */
  popup.dataset.state = type;
  resetPopupPosition(popup);
  /* innerHTML, not textContent: the standard red title carries a <br>
     (producer 14.09.26). These titles are ours, never learner input. */
  document.getElementById(sid + "-popup-title").innerHTML = cfg.title;
  renderPopupBody(sid, cfg.body, type === 'retry' ? null : q.pages);
  popup.classList.remove("hidden");
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}
function scqCheck(sid) {
  const q = SCQ[sid];
  if (q.done) {
    advanceScreen();
    return;
  }
  if (!q.selected) return;
  q.attempts++;
  const isCorrect = q.selected === q.correctId;
  /* xAPI: after the guards, verdict final. isLast = correct || attempts exhausted (guide idiom). */
  xapiReport(sid, isCorrect, isCorrect || q.attempts >= 2,
    xapiAnswerText(document.querySelector("#" + sid + ' .scq-opt[data-id="' + q.selected + '"]')));
  const mark = (id, cls) => {
    const o = document.querySelector("#" + sid + ' .scq-opt[data-id="' + id + '"]');
    if (o) {
      o.classList.remove("selected");
      o.classList.add(cls);
    }
  };
  const finish = (ok) => {
    q.done = true;
    document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => {
      o.disabled = true;
    });
    const chk = document.getElementById(sid + "-check");
    if (chk) {
      /* inline (scrollset) buttons just grey out — the screen's own Continue
         does the advancing (producer 30.08) */
      if (chk.classList.contains("btn-inline-check")) chk.disabled = true;
      else { setNavLabel(chk, "متابعة"); chk.disabled = popupGatePending(sid); }
    }
    hideHintButton(sid);
    if (q.practice) setPracticeResult2(sid, ok);
  };
  if (isCorrect) {
    mark(q.correctId, "correct");
    scqShowPopup2(sid, "correct");
    finish(true);
  } else if (q.attempts >= 2) {
    mark(q.correctId, "correct");
    mark(q.selected, "wrong");
    scqShowPopup2(sid, "wrong2");
    finish(false);
  } else {
    mark(q.selected, "wrong");
    q.lastWrong = q.selected;
    revealHintButton(sid);
    scqShowPopup2(sid, "retry");
    const chk = document.getElementById(sid + "-check");
    if (chk) chk.disabled = true;
  }
  /* resume: synchronous, after the LAST commitment of every branch (guide §8.3, D-13) */
  try { flushResumeSave(); } catch (e) {}
}
function s23Select(id) {
  scqSelect("s23", id);
}
function s23Check() {
  scqCheck("s23");
}
function s27Select(id) {
  scqSelect("s27", id);
}
function s27Check() {
  scqCheck("s27");
}
function s35Select(id) {
  scqSelect("s35", id);
}
function s35Check() {
  scqCheck("s35");
}

/* ═══════════════════════════════════════════════════════════
   REPORT MODAL — "מצאתם בעיה?" (template-library/ReportModal —
   approved 09.08; same behavior in all 720 projects). Sends to the ONE
   shared 720 Google Form (content owner's decision 13.08.26 — do not create
   a per-unit form, do not rename a field key). Unit and component slugs come
   from window.METADATA, which ../unit-js/50-loader.js fills from
   XAPI_METADATA_FILE; the item from this component's SCREEN_TO_SUBCONTENT.

   ⚠️ shortId() is ../unit-js/10-identity.js's (trims the trailing slash).
   This file used to declare its own copy without the trim; loading last, it
   silently won and returned '' for every canonical id.
   ⚠️ SCREEN_TO_SUBCONTENT is declared per component in script.js and covers
   that component's screens only. A copy here would load afterwards and
   overwrite it — never declare one in this file.
   ═══════════════════════════════════════════════════════════ */
var REPORT_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSfFq5XFtH1pPpLgV5RWT4m3NanYPW5GKremqTvkp6zKjEGqcw/formResponse";

function openReportModal() {
  document.getElementById("report-modal").removeAttribute("hidden");
  setTimeout(function () {
    var el = document.getElementById("report-type");
    if (el) el.focus();
  }, 40);
}
function tryCloseReportModal() {
  var typeVal = document.getElementById("report-type").value;
  var textVal = document.getElementById("report-text").value.trim();
  if (typeVal || textVal) {
    document.getElementById("report-modal").setAttribute("hidden", "");
    document.getElementById("report-confirm-modal").removeAttribute("hidden");
  } else {
    forceCloseReportModal();
  }
}
function forceCloseReportModal() {
  document.getElementById("report-modal").setAttribute("hidden", "");
  document.getElementById("report-confirm-modal").setAttribute("hidden", "");
  resetReportForm();
}
function backToReportForm() {
  document.getElementById("report-confirm-modal").setAttribute("hidden", "");
  document.getElementById("report-modal").removeAttribute("hidden");
  setTimeout(function () {
    var el = document.getElementById("report-type");
    if (el) el.focus();
  }, 40);
}

function submitReport() {
  var typeSel = document.getElementById("report-type");
  var textVal = document.getElementById("report-text").value.trim();
  var errEl = document.getElementById("report-error");
  if (!typeSel.value || !textVal) {
    if (errEl) errEl.removeAttribute("hidden");
    (typeSel.value ? document.getElementById("report-text") : typeSel).focus();
    return;
  }
  if (errEl) errEl.setAttribute("hidden", "");
  var now = new Date();
  /* window.METADATA when the loader has read the component's metadata file;
     otherwise this unit's OWN static identity (10-identity.js + script.js),
     never another unit's — this used to fall back to ratio-01's ids, so every
     report from this unit was filed under the wrong unit. */
  var meta = window.METADATA || {
    learningUnitId: window.XAPI_UNIT_ID,
    id: typeof XAPI_COMP_ID !== "undefined" ? XAPI_COMP_ID : "",
  };
  var body = new URLSearchParams();
  body.append("entry.301404029_year", now.getFullYear());
  body.append("entry.301404029_month", now.getMonth() + 1);
  body.append("entry.301404029_day", now.getDate());
  body.append("entry.2066097581_hour", now.getHours());
  body.append("entry.2066097581_minute", now.getMinutes());
  body.append("entry.1933069481", shortId(meta.learningUnitId));
  body.append("entry.2070680092", shortId(meta.id));
  var mapEntry = typeof SCREEN_TO_SUBCONTENT !== "undefined" ? SCREEN_TO_SUBCONTENT[currentScreen] : null;
  var itemId = mapEntry ? shortId(meta.id) + "-" + mapEntry[0] : "";
  var itemPage = mapEntry ? String(mapEntry[1]) : String(currentScreen);
  body.append("entry.1555704258", itemId);
  body.append("entry.1671046914", itemPage);
  body.append("entry.1179822443", typeSel.options[typeSel.selectedIndex].text);
  body.append("entry.806447525", textVal);
  fetch(REPORT_FORM_ACTION, { method: "POST", mode: "no-cors", body: body }).catch(function (e) {
    console.error("[Report] send failed", e);
  });
  console.log("[Report Issue] sent");
  showReportThanks();
}
function showReportThanks() {
  document
    .querySelectorAll("#report-modal .report-field, #report-modal .report-actions, #report-modal .report-modal-body")
    .forEach(function (el) {
      el.setAttribute("hidden", "");
    });
  var t = document.getElementById("report-thanks");
  if (t) t.removeAttribute("hidden");
}
function resetReportForm() {
  document.getElementById("report-type").value = "";
  document.getElementById("report-text").value = "";
  document.getElementById("report-char-count").textContent = "0 / 250";
  var errEl = document.getElementById("report-error");
  if (errEl) errEl.setAttribute("hidden", "");
  var t = document.getElementById("report-thanks");
  if (t) t.setAttribute("hidden", "");
  document
    .querySelectorAll("#report-modal .report-field, #report-modal .report-actions, #report-modal .report-modal-body")
    .forEach(function (el) {
      el.removeAttribute("hidden");
    });
}
/* Wire the flag button + char counter + Esc-to-close.
   A declaration, not an IIFE: ../unit-js/90-boot.js calls it exactly once, in
   its fixed boot order (guide §7.3). */
function initReportModal() {
  /* delegated: there is a flag button per screen, and generated screens add
     theirs after this runs. querySelector wired exactly one of them. */
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".flag-btn")) openReportModal();
  });
  var reportTextarea = document.getElementById("report-text");
  var reportCounter = document.getElementById("report-char-count");
  if (reportTextarea && reportCounter) {
    reportTextarea.addEventListener("input", function () {
      reportCounter.textContent = reportTextarea.value.length + " / 250";
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var confirmModal = document.getElementById("report-confirm-modal");
    var reportModal = document.getElementById("report-modal");
    if (confirmModal && !confirmModal.hasAttribute("hidden")) {
      forceCloseReportModal();
      return;
    }
    if (reportModal && !reportModal.hasAttribute("hidden")) {
      tryCloseReportModal();
      return;
    }
  });
}

/* ─── Standard shared image-zoom modal (percent-02 pattern): any
   [data-zoom-src] opens with a clone of its sibling wrapper; any
   [data-zoom-close] closes. ─── */
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-zoom-src]");
  if (opener) {
    const modal = document.getElementById("img-zoom-modal");
    const stage = document.getElementById("img-zoom-stage");
    const wrapper = opener.parentElement?.querySelector(".scq-img-inner, .zoom-img-inner");
    if (modal && stage && wrapper) {
      stage.innerHTML = "";
      const clone = wrapper.cloneNode(true);
      clone.querySelectorAll(".img-zoom-btn").forEach((b) => b.remove());
      stage.appendChild(clone);
      modal.classList.remove("hidden");
    }
    return;
  }
  if (e.target.closest("[data-zoom-close]")) {
    document.getElementById("img-zoom-modal")?.classList.add("hidden");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.getElementById("img-zoom-modal")?.classList.add("hidden");
});

/* ─── Dev mode: postMessage bridge ─────────────────────── */
window.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "DEV_GOTO") return;
  const n = parseInt(e.data.screen, 10);
  if (!isNaN(n)) goTo(n);
});

/* ═══════════════════════════════════════════════════════════
   S0 — HookOpenQuestion (slides 3-4). Scroll to the end, then one
   single attempt on "האם ريما צודקת?". The production note is
   explicit: "שאלה ללא משוב" — the pick locks and Continue unlocks,
   nothing is marked right or wrong.
   ═══════════════════════════════════════════════════════════ */
/* Approved scroll-screen policy (ratio-01-01 S1/S4): the question has its
   OWN "צדקתי?" button and inline feedback, and Continue unlocks only once
   BOTH the question is answered and the learner reached the bottom. */
const S0Q_CORRECT = "b"; // "לא" — production note, slide 4
const s0State = { scrolledEnd: false, answered: false, picked: null };

function s0Pick(id) {
  if (s0State.answered) return;
  s0State.picked = id;
  document.querySelectorAll("#s0 .scq-opt").forEach((o) => {
    const sel = o.dataset.id === id;
    o.classList.toggle("selected", sel);
    o.setAttribute("aria-checked", sel ? "true" : "false");
  });
  const check = document.getElementById("s0q-check");
  if (check) check.disabled = false;
}

function s0Check() {
  if (s0State.answered || !s0State.picked) return;
  s0State.answered = true;
  const wasCorrect = s0State.picked === S0Q_CORRECT;
  /* one attempt — always the final answer */
  xapiReport("s0", wasCorrect, true,
    xapiAnswerText(document.querySelector('#s0 .scq-opt[data-id="' + s0State.picked + '"]')));
  document.querySelectorAll("#s0 .scq-opt").forEach((o) => {
    o.disabled = true;
    if (o.dataset.id === S0Q_CORRECT) o.classList.add("correct");
    else if (o.dataset.id === s0State.picked) o.classList.add("wrong");
  });
  const fb = document.getElementById("s0q-feedback");
  if (fb) {
    fb.innerHTML = "<strong>" + (wasCorrect ? "كلّ الاحترام!" : "هذا غير دقيق") + "</strong><br>دعونا نفهم معًا لماذا";
    fb.classList.add(wasCorrect ? "is-correct" : "is-wrong");
  }
  const check = document.getElementById("s0q-check");
  if (check) check.disabled = true;
  // §3 (מה מקור הבלבול) appears together with the verdict (producer 31.08)
  document.getElementById("s0-sec3")?.classList.remove("hidden");
  s0UpdateGate();
  try { flushResumeSave(); } catch (e) {}
}

function s0AtBottom(el) {
  return el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
}

function s0UpdateGate() {
  // latch here too, not only from the scroll event: a programmatic jump (or a
  // browser that coalesces the event) must still open the gate
  if (!s0State.scrolledEnd && s0AtBottom(document.getElementById("s0-scroll"))) {
    s0State.scrolledEnd = true;
    try { scheduleResumeSave(); } catch (e) {} /* a latched gate is state */
  }
  const btn = document.getElementById("s0-continue");
  if (btn) btn.disabled = !(s0State.scrolledEnd && s0State.answered);
}

function s0Enter() {
  if (s0State.answered) document.getElementById("s0-sec3")?.classList.remove("hidden");
  const scroller = document.getElementById("s0-scroll");
  if (!scroller) return;
  s0UpdateGate();
  if (scroller.dataset.wired) return;
  scroller.dataset.wired = "1";

  // scroll-end latch — Continue also waits for the learner to reach the end
  ["scroll", "scrollend", "wheel", "touchmove", "keyup"].forEach((ev) =>
    scroller.addEventListener(
      ev,
      () => {
        if (!s0State.scrolledEnd) s0UpdateGate();
      },
      { passive: true },
    ),
  );

  // scrollbar click-hint, placed on entry (measuring while display:none
  // yields zeros) and dismissed on the first real scroll
  if (scroller.scrollHeight <= scroller.clientHeight + 8) return;
  const hint = makeClickHint("s0-hint-scroll");
  document.getElementById("s0").appendChild(hint);
  scroller.addEventListener("scroll", () => hint.classList.add("hidden"), { once: true });
}

/* ═══════════════════════════════════════════════════════════
   S2 — acquisition (slides 8-12). Four numbered steps; each opens a
   PopupPage with its image + text. A visited step greys out and
   Continue unlocks once all four have been opened.
   ═══════════════════════════════════════════════════════════ */
const ACQ_STEPS = {
  1: {
    img: "../unit-assets/img/acq-step-1.jpg",
    alt: "سامر ودنة يبنيان نموذج ليجو لمدينة المستقبل",
    body: `في أسبوع العلوم والهندسة، بنى سامر ولينا نموذجًا عملاقًا لـ "مدينة المستقبل".<br>احتوت مجموعة اللِيغو الخاصة بهما على 10,000 قطعة.`,
  },
  2: {
    img: "../unit-assets/img/acq-step-2.jpg",
    alt: "منظم الحدث يضيف <span dir='ltr'>10%</span> من المكعبات إلى المجموعة",
    /* producer 14.09.26: the manager's line re-worded, and the parenthetical
       never splits across lines — .nb keeps "(100% + 10%)," whole. */
    body: `بعد عدة ساعات فاجأهم مدير الفعالية: "قررت أن أضيف إلى مجموعتكم <span dir="ltr">10%</span> من كمية المكعبات الموجودة".<br><br>يقول سامر:<br>يا! عندما نزيد كمية بـ <span dir="ltr">10%</span>، الكمية الجديدة هي <span dir="ltr">110%</span> من الكمية الأصلية <span class="nb">(<span dir="ltr">100% + 10%</span>),</span><br>لكن كيف نحسب كم مكعب لدينا الآن؟`,
  },
  3: {
    img: "../unit-assets/img/acq-step-3.png",
    alt: "شريط النسب المئوية: <span dir='ltr'>100%</span> وإضافة <span dir='ltr'>10%</span>",
    body: `شرحت لينا:<br>
              لإيجاد العدد الجديد من المكعبات، يمكن حساب <span dir="ltr">110%</span> مباشرةً من الكمية الأصلية:<br>
              <span dir="ltr">110% × 10,000 = 11,000</span> مكعب.`,
  },
  4: {
    img: "../unit-assets/img/acq-step-4.jpg",
    alt: "النموذج المكبّر مع 11,000 مكعب",
    body: `على الرغم من أن <span dir="ltr">10%</span> يبدو قليلاً، إلا أنه يُحسب من 10,000 مكعب.<br>لذلك تمّ إضافة 1,000 مكعب، وهي إضافة كبيرة تجلبنا إلى 11,000 مكعب.`,
  },
};
const s1Opened = new Set();

/* Steps open IN ORDER (producer 24.08): only the next step is live; the
   opened ones grey out (deck note, slide 8), the next one is highlighted
   and tagged, the rest are locked until their turn. */
function acqRefresh(sid, opened, total) {
  const next = [...Array(total)].map((_, i) => i + 1).find((n) => !opened.has(n)) || null;
  document.querySelectorAll("#" + sid + " .acq-step").forEach((b) => {
    const n = +b.dataset.step;
    const visited = opened.has(n),
      isNext = n === next;
    b.classList.toggle("is-visited", visited);
    b.classList.toggle("is-next", isNext);
    b.classList.toggle("is-locked", !visited && !isNext);
    b.disabled = !visited && !isNext;
    b.setAttribute("aria-current", isNext ? "step" : "false");
  });
}
function acqNext(opened, total) {
  for (let n = 1; n <= total; n++) if (!opened.has(n)) return n;
  return null;
}

function s1Open(n) {
  const cfg = ACQ_STEPS[n];
  if (!cfg) return;
  if (!s1Opened.has(n) && n !== acqNext(s1Opened, 4)) return; // out of order — locked
  const img = document.getElementById("acq-popup-img");
  img.src = cfg.img;
  img.alt = cfg.alt;
  document.getElementById("acq-popup-body").innerHTML = cfg.body;
  document.getElementById("acq-popup").classList.remove("hidden");
  s1Opened.add(n);
  try { scheduleResumeSave(); } catch (e) {} /* the step gate is state (guide §8.8 rule 11) */
  acqRefresh("s1", s1Opened, 4);
  const btn = document.getElementById("s1-continue");
  if (btn) btn.disabled = !s1AllOpened();
}

function s1Close() {
  document.getElementById("acq-popup").classList.add("hidden");
}

function s1AllOpened() {
  return [1, 2, 3, 4].every((n) => s1Opened.has(n));
}

function s1Enter() {
  document.getElementById("acq-popup")?.classList.add("hidden");
  acqRefresh("s1", s1Opened, 4);
  const btn = document.getElementById("s1-continue");
  if (btn) btn.disabled = !s1AllOpened();
}

/* ─── Boot ───────────────────────────────────────────────────
   The first screen carries .active in the static HTML, so goTo() never runs
   for it — run its enter hook explicitly or its wiring never happens. */

/* ═══════════════════════════════════════════════════════════
   DropdownQuestion (slides 13/21) — one sentence, one select.
   Same policy as SCQ: 2 attempts, retry popup on the first wrong,
   final wrong reveals the correct value in the select.
   ═══════════════════════════════════════════════════════════ */
const DQ = {
  s2: {
    correctId: "c",
    attempts: 0,
    done: false,
    correctTitle: "أحسنت!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: ["عندما تزداد كمية بنسبة <span dir='ltr'>15%</span>، حجمها بالنسبة المئوية هو:", '<span dir="ltr">100% + 15% = 115%</span>'],
    hint: "ابدأوا من <span dir='ltr'>100%</span> (الكمية الأصلية)، وأضيفوا <span dir='ltr'>15%</span> من الزيادة. كم نسبة مئوية تحصلون عليها؟",
  },
  s6: {
    correctId: "b",
    attempts: 0,
    done: false,
    correctTitle: "أحسنت!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: ["عندما تنخفض كمية بنسبة <span dir='ltr'>35%</span>، حجمها بالنسبة المئوية هو:", '<span dir="ltr">100% - 35% = 65%</span>'],
    hint: "ابدأوا من <span dir='ltr'>100%</span> (الكمية الأصلية)، واطرحوا <span dir='ltr'>35%</span> من التناقص. أي نسبة مئوية تحصلون عليها؟",
  },
};

function dqOnChange(sid) {
  const q = DQ[sid];
  if (q.done) return;
  const chk = document.getElementById(sid + "-check");
  const v = document.getElementById(sid + "-sel").value;
  /* disabled while the pick is empty OR still the one already marked wrong (retry gate) */
  if (chk) chk.disabled = !v || v === q.lastWrong;
}

function dqShowPopup(sid, type) {
  const q = DQ[sid];
  if (type !== "retry") q.result = type; // remembered so the verdict survives navigation
  const cfg = {
    retry: { bg: "#ffdbdc", title: "الإجابة غير دقيقة، هل نحاول مرة أخرى؟", body: [] },
    correct: { bg: "#edf8ed", title: q.correctTitle, body: q.body },
    wrong2: { bg: "#ffdbdc", title: q.wrongTitle, body: q.body },
  }[type];
  const popup = document.getElementById(sid + "-popup");
  if (!popup) return;
  popup.style.background = cfg.bg;
  /* state marker so CSS can treat the red panel differently from the green one
     (producer 14.09.26: the red title reads right, the green stays centred) */
  popup.dataset.state = type;
  resetPopupPosition(popup);
  /* innerHTML, not textContent: the standard red title carries a <br>
     (producer 14.09.26). These titles are ours, never learner input. */
  document.getElementById(sid + "-popup-title").innerHTML = cfg.title;
  renderPopupBody(sid, cfg.body, type === 'retry' ? null : q.pages);
  popup.classList.remove("hidden");
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}

function dqCheck(sid) {
  const q = DQ[sid];
  if (q.done) {
    advanceScreen();
    return;
  }
  const sel = document.getElementById(sid + "-sel");
  if (!sel.value) return;
  /* Retry gate (guide §8.8 rule 9, D-14): the same wrong pick cannot spend attempt 2. The
     native change event alone did not stop it — away and back re-enabled the button. */
  if (sel.value === q.lastWrong) return;
  q.attempts++;
  const ok = sel.value === q.correctId;
  xapiReport(sid, ok, ok || q.attempts >= 2, sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : sel.value);
  const finish = () => {
    q.done = true;
    sel.disabled = true;
    hideHintButton(sid);
    const chk = document.getElementById(sid + "-check");
    if (chk) {
      setNavLabel(chk, "متابعة");
      chk.disabled = false;
    }
  };
  if (ok) {
    sel.classList.add("dq-correct");
    dqShowPopup(sid, "correct");
    finish();
  } else if (q.attempts >= 2) {
    /* The reveal used to overwrite the learner's choice with no way back
       (producer 14.09.26: "תשובה נכונה דורסת תשובת תלמיד/ה"). Keep both and
       let a toggle in the feedback swap between them. */
    q.userPick = sel.value;
    sel.value = q.correctId;
    sel.classList.add("dq-correct");
    dqShowPopup(sid, "wrong2");
    dqAddAnswerToggle(sid);
    finish();
  } else {
    q.lastWrong = sel.value;
    sel.classList.add("dq-wrong");
    revealHintButton(sid);
    dqShowPopup(sid, "retry");
    const chk = document.getElementById(sid + "-check");
    if (chk) chk.disabled = true;
    sel.addEventListener("change", () => sel.classList.remove("dq-wrong"), { once: true });
  }
  try { flushResumeSave(); } catch (e) {}
}
/* התשובה שלי / התשובה הנכונה — swaps the revealed answer back to what the
   learner actually chose, and back again. Lives at the foot of the feedback
   popup so it is where the learner is already looking. */
function dqAddAnswerToggle(sid) {
  const q = DQ[sid];
  const body = document.getElementById(sid + "-popup-body");
  if (!q || !body || q.userPick == null || body.querySelector(".fb-answer-toggle")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fb-answer-toggle";
  btn.dataset.mode = "correct";          // the select currently shows the key
  btn.textContent = "الانتقال إلى إجابتي";
  btn.onclick = () => {
    const sel = document.getElementById(sid + "-sel");
    const showMine = btn.dataset.mode === "correct";
    sel.value = showMine ? q.userPick : q.correctId;
    sel.classList.toggle("dq-correct", !showMine);
    sel.classList.toggle("dq-wrong", showMine);
    btn.dataset.mode = showMine ? "mine" : "correct";
    btn.textContent = showMine ? "الانتقال إلى الإجابة الصحيحة" : "الانتقال إلى إجابتي";
  };
  body.appendChild(btn);
}

function s2OnChange() {
  dqOnChange("s2");
}
function s2Check() {
  dqCheck("s2");
}
function s6OnChange() {
  dqOnChange("s6");
}
function s6Check() {
  dqCheck("s6");
}

/* ═══════════════════════════════════════════════════════════
   S6 — acquisition, הקטנה (slides 17-20). Three steps → PopupPage.
   Same engine pattern as S2.
   ═══════════════════════════════════════════════════════════ */
const ACQ2_STEPS = {
  1: {
    img: "../unit-assets/img/acq-step-2.jpg",
    alt: "منظم الحدث يحدّث سامر ولينا",
    body: `بعد أن أخبر المنظم لينا وسامر بأن <span dir="ltr">20%</span> من 11,000 مكعب مكسورة،<br> بمساعدة جدول النسبة، قاما بالحساب والعثور على:<br> <strong><span dir="ltr">20%</span> من 11,000 يساوي 2,200 مكعب.</strong>`,
  },
  2: {
    img: "../unit-assets/img/acq-step-1.jpg",
    alt: "لينا تنظر إلى صندوق قطع اللیغو",
    body: `لينا طرحت من 11,000 مكعب الـ 2,200 مكعب المكسورة،<br>
              فتبقّى لديهما <strong>8,800</strong> <strong>مكعبًا سليمًا</strong> لمتابعة بناء النموذج:<br>
              <span dir="ltr">11,000 - 2,200 = <strong>8,800</strong></span>`,
  },
  3: {
    img: "",
    alt: "",
    body: `توجد <strong>طريقة إضافية</strong> لحساب الكمية بعد انخفاض النسبة المئوية!<br>إذا كانت <span dir="ltr">20%</span> من المكعبات مكسورة، فقد بقي للينا وسامر <span dir="ltr">80%</span> من المكعبات السليمة.<br>باستخدام جدول التناسب، سنحسب كم تساوي <span dir="ltr">80%</span> من 11,000:<br><table class="acq-table"><thead><tr><th>النسبة المئوية</th><th>الكمية</th></tr></thead><tbody><tr><td><span dir="ltr">80%</span></td><td>X</td></tr><tr><td><span dir="ltr">100%</span></td><td>11,000</td></tr></tbody></table>المعادلة هي: <span class="acq-eq" dir="ltr"><span class="frac"><span class="frac-num">80%</span><span class="frac-den">100%</span></span> = <span class="frac"><span class="frac-num">x</span><span class="frac-den">11,000</span></span></span><br>النتيجة هي: <span dir="ltr">x = 8,800</span><br>أي أنه بقي للينا وسامر 8,800 مكعب سليم.`,
  },
};
const s5Opened = new Set();

function s5Open(n) {
  const cfg = ACQ2_STEPS[n];
  if (!cfg) return;
  if (!s5Opened.has(n) && n !== acqNext(s5Opened, 3)) return;
  const img = document.getElementById("acq-popup-img");
  if (cfg.img) {
    img.src = cfg.img;
    img.alt = cfg.alt;
    img.style.display = "";
  } else img.style.display = "none";
  document.getElementById("acq-popup-body").innerHTML = cfg.body;
  document.getElementById("acq-popup").classList.remove("hidden");
  s5Opened.add(n);
  try { scheduleResumeSave(); } catch (e) {}
  acqRefresh("s5", s5Opened, 3);
  const btn = document.getElementById("s5-continue");
  if (btn) btn.disabled = !s5AllOpened();
}

function s5AllOpened() {
  return [1, 2, 3].every((n) => s5Opened.has(n));
}

function s5Enter() {
  document.getElementById("acq-popup")?.classList.add("hidden");
  acqRefresh("s5", s5Opened, 3);
  const btn = document.getElementById("s5-continue");
  if (btn) btn.disabled = !s5AllOpened();
}

/* hint overlays: fill each screen's hint body from its config */
Object.entries({ ...SCQ, ...DQ }).forEach(([sid, q]) => {
  const el = document.getElementById(sid + "-hint-body");
  if (el && q.hint) el.textContent = q.hint;
});

/* ─── Shared draggable feedback popups (vendored from ratio-01-01) ─── */
const CANVAS_W = 1280,
  CANVAS_H = 710,
  BOTTOM_BAR_H = 74;
function getAppScale() {
  const app = document.getElementById("app");
  const m = app.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function clampPopupPosition(x, y, popupEl) {
  const w = popupEl.offsetWidth,
    h = popupEl.offsetHeight;
  return {
    x: Math.min(Math.max(x, 0), CANVAS_W - w),
    y: Math.min(Math.max(y, 0), CANVAS_H - BOTTOM_BAR_H - h),
  };
}
function resetPopupPosition(popup) {
  // floats above the bottom-bar buttons, beside the answers (producer 12.08)
  popup.style.left = "24px";
  popup.style.top = "auto";
  popup.style.bottom = "130px";
  popup.style.maxHeight = "";   // clear any clamp from a previous, taller panel
}

/* shared popup drag (one pointermove/up pair for all draggable popups) */
let mcqDragPopup = null,
  mcqDragOffX = 0,
  mcqDragOffY = 0;
function mcqPopupPointerDown(e, popupId) {
  const popup = document.getElementById(popupId);
  const app = document.getElementById("app");
  if (!popup || !app) return;
  mcqDragPopup = popup;
  const scale = getAppScale();
  const canvasX = (e.clientX - (parseFloat(app.style.left) || 0)) / scale;
  const canvasY = (e.clientY - (parseFloat(app.style.top) || 0)) / scale;
  const topPx = parseFloat(popup.style.top);
  const popupTop = isNaN(topPx) ? popup.offsetTop : topPx;
  popup.style.top = popupTop + "px";
  popup.style.bottom = "auto";
  mcqDragOffX = canvasX - (parseFloat(popup.style.left) || 2);
  mcqDragOffY = canvasY - popupTop;
  e.preventDefault();
}
window.addEventListener("pointermove", (e) => {
  if (!mcqDragPopup) return;
  const app = document.getElementById("app");
  if (!app) return;
  const scale = getAppScale();
  const rawX = (e.clientX - (parseFloat(app.style.left) || 0)) / scale - mcqDragOffX;
  const rawY = (e.clientY - (parseFloat(app.style.top) || 0)) / scale - mcqDragOffY;
  const c = clampPopupPosition(rawX, rawY, mcqDragPopup);
  mcqDragPopup.style.left = c.x + "px";
  mcqDragPopup.style.top = c.y + "px";
});
window.addEventListener("pointerup", () => {
  mcqDragPopup = null;
});
window.addEventListener("pointercancel", () => {
  mcqDragPopup = null;
});

/* ═══════════════════════════════════════════════════════════
   S11-S21 — guided practice (slides 25-35). One screen per pptx
   slide, all built from this config into a shared shell:
   left = purple step card (question / one-tap reveal + counter),
   right = the exercise text that stays on screen across the flow.
   Keys come from the slides' V badges where present.
   ═══════════════════════════════════════════════════════════ */
const GC_BULB = `<svg class="gc-bulb" viewBox="0 0 20.997 27.9988" fill="none" aria-hidden="true"><path d="M17.4818 2.65764C15.2512 0.668476 12.2563 -0.275357 9.25683 0.0699765C4.59833 0.60431 0.748334 4.35748 0.103168 8.99148C-0.387999 12.5078 0.894168 16.0031 3.532 18.34C4.99267 19.6338 5.83033 21.5191 5.83033 23.5095V23.9155C5.83033 26.1671 7.662 27.9988 9.91367 27.9988H11.0803C13.332 27.9988 15.1637 26.1671 15.1637 23.9155V23.5036C15.1637 21.5366 16.041 19.6431 17.6347 18.1708C19.7708 16.1945 20.997 13.398 20.997 10.4988C20.997 7.50864 19.716 4.65031 17.4818 2.65764ZM13.997 23.9143C13.997 25.522 12.6892 26.831 11.0803 26.831H9.91367C8.30483 26.831 6.997 25.522 6.997 23.9143V23.5083C6.997 23.0545 6.9585 22.6041 6.88617 22.1643H14.1137C14.0367 22.6041 13.997 23.051 13.997 23.5025V23.9143ZM16.8425 17.3133C15.691 18.3773 14.865 19.6385 14.4077 20.9976H11.0792V12.1986C12.7323 11.9198 13.9958 10.479 13.9958 8.74764C13.9958 8.42564 13.7345 8.16431 13.4125 8.16431C13.0905 8.16431 12.8292 8.42564 12.8292 8.74764C12.8292 10.0345 11.7827 11.081 10.4958 11.081C9.209 11.081 8.1625 10.0345 8.1625 8.74764C8.1625 8.42564 7.90117 8.16431 7.57917 8.16431C7.25717 8.16431 6.99583 8.42564 6.99583 8.74764C6.99583 10.479 8.25933 11.9198 9.9125 12.1986V20.9976H6.60267C6.16633 19.6431 5.38 18.4193 4.3055 17.4661C1.9605 15.3895 0.821834 12.2815 1.25817 9.15248C1.831 5.03648 5.2505 1.70448 9.38867 1.22848C9.7655 1.18531 10.14 1.16431 10.511 1.16431C12.807 1.16431 14.9735 1.98448 16.7072 3.52914C18.6917 5.30014 19.8315 7.83998 19.8315 10.4976C19.8315 13.111 18.771 15.5318 16.8437 17.3133H16.8425Z" fill="currentColor"/></svg>`;

const G_EXERCISE_AB = `في السوبرماركت، تُباع زجاجة عصير ب⁦₪20⁩.<br>في إطار عرض نهاية الأسبوع يُمنح خصم بنسبة <span dir="ltr">15%</span> على جميع الزجاجات.`;

const PROP_TABLE = `<table class="acq-table"><thead><tr><th>نسبة مئوية</th><th>السعر</th></tr></thead> <tbody><tr><td><span dir="ltr">100%</span></td><td>⁦₪20⁩</td></tr><tr><td><span dir="ltr">15%</span></td><td>X</td></tr></tbody></table>`;

const TEN_TABLE = `<table class="acq-table"><thead><tr><th>النسبة المئوية المراد دفعها</th><th>السعر لـ 10 زجاجات</th><th>السعر للزجاجة</th></tr></thead> <tbody><tr><td><span dir="ltr">100%</span></td><td>⁦₪200⁩</td><td>⁦₪20⁩</td></tr><tr><td><span dir="ltr">85%</span></td><td>⁦₪170⁩</td><td>⁦₪17⁩</td></tr></tbody></table>`;

/* strip icons — declared before GUIDED because buildGuidedScreens() runs at
   parse time (TDZ: a const below it is not yet initialised) */
const QP_TICK =
  '<svg class="qp-tick" viewBox="0 0 12 12" fill="none"><path d="M1.5 6.2l3 3 6-6.4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const QP_X =
  '<svg class="qp-x" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';

const GUIDED = [
  {
    screen: 10,
    title: "دعونا نحل التمرين الأول معاً",
    lead: "<strong>تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>أ. بكم شاقلاً ستقلل الخصم من سعر الزجاجة؟</strong>",
    bubble: "سنشرح الحل فورًا،<br>خطوة بخطوة",
    callout: "أولاً، دعونا نفهم:<br>هل نتحدث عن زيادة أم انخفاض في النسب المئوية؟",
    opts: ["زيادة", "انخفاض"],
    correct: 1,
  },

  {
    screen: 11,
    title: "دعونا نحل التمرين الأول معاً",
    lead: "<strong>تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>أ. بكم شاقل ستخفض الخصم من سعر الزجاجة؟</strong>",
    callout:
      "بالفعل، هذا تمرين على انخفاض النسبة المئوية.<br>دعنا نضع البيانات في جدول النسبة لحساب كم تساوي خصومات <span dir='ltr'>15%</span>:" +
      PROP_TABLE +
      "انظروا جيدًا إلى الجدول - هل الجدول صحيح؟",
    opts: ["لا", "نعم"],
    correct: 1,
  },

  {
    screen: 12,
    title: "دعونا نحل التمرين الأول معاً",
    lead: "<strong>تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>أ. بكم شاقل ستقلل الخصم من سعر الزجاجة؟</strong>",
    callout: `الآن سنكوّن معادلة التناسب ونحسب منها قيمة x:
      <span class="g-eq" dir="ltr"><span class="frac"><span class="frac-num">15</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">x</span><span class="frac-den">20</span></span></span>
      بعد الضرب في المقام المشترك والاختصار نحصل على:
      <span class="g-eq" dir="ltr">5x = 15</span>
      وبعد القسمة على 5 نحصل على:
      <span class="g-eq" dir="ltr">x = 3</span>
      الخلاصة: قيمة الخصم هي 3 ش.ج.`,
  },

  {
    screen: 13,
    kind: "transition",
    video: "character-waving.mp4",
    title: "دعونا نحل التمرين الأول معاً",
    bubble: "آه، رائع!<br>الآن، سنستخدم مبلغ الخصم الذي حسبناه لإيجاد الإجابة!",
  },

  {
    screen: 14,
    title: "دعونا نحل التمرين الأول معاً",
    lead: "<strong>تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>ب. ما سيكون السعر الجديد لزجاجة العصير بعد الخصم؟</strong>",
    callout: `وجدنا أن الخصم بنسبة <span dir="ltr">15%</span> يساوي ⁦₪3⁩.<br>الآن سنحسب السعر الجديد للزجاجة بطرح مبلغ الخصم من السعر الكامل:
      <span class="g-eq" dir="ltr">20 - 3 = 17</span>
      السعر بعد الخصم هو <strong>⁦₪17⁩.</strong>`,
  },

  {
    screen: 15,
    kind: "transition",
    title: "دعونا نحل التمرين الأول معاً",
    bubble: "ما رأيكم - هل يمكن حل التمرين بطريقة أخرى؟",
    opts: ["نعم", "لا"],
    correct: 0,
    afterCorrect: "<strong>صحيح!</strong><br>هيا بنا نتعلم ما هي",
    afterWrong: "<strong>في الواقع، توجد طريقة أخرى</strong><br>هيا بنا نتعلم ما هي",
  },

  {
    screen: 16,
    title: "هيا نحل بطريقة إضافية",
    lead: "<strong>هذه المرة ايضاً، تأملوا في التمرين. لا تحلوه، فقط انظروا إلى البيانات وتفكروا إن كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>ب. ما سيكون السعر الجديد لزجاجة العصير بعد الخصم؟</strong>",
    callout: "لأن الخصم بنسبة <span dir='ltr'>15%</span>، فإن السعر بعد الخصم هو <span dir='ltr'>75%</span> من سعر المنتج.",
    opts: ["صحيح", "غير صحيح"],
    correct: 1,
  },

  {
    screen: 17,
    title: "هيّا لنحل بطريقة إضافية",
    lead: "<strong>غم الحفظ، تأملوا في التمرين. لا تحلوه، فقط انظروا إلى البيانات وتفكروا إن كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>ب. ما سيكون السعر الجديد لزجاجة العصير بعد الخصم؟</strong>",
    callout: `قيمة الخصم <span dir="ltr">15%</span>، لذلك فإن السعر بعد الخصم هو:
      <span class="g-eq" dir="ltr">100% - 15% = 85%</span>
      نحسب كم تساوي <span dir="ltr">85%</span> من 20 ش.ج:
      <span class="g-eq" dir="ltr">20 × 0.85 = 17</span>
      سعر زجاجة العصير بعد الخصم هو 17 ش.ج.`,
  },

  {
    screen: 18,
    title: "وإذا اشترينا 10 زجاجات؟",
    lead: "<strong>غم الحفظ، تأملوا في التمرين. لا تحلوه، فقط انظروا إلى البيانات وتفكروا إن كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>اشترى عميل 10 زجاجات.<br>كم دفع مقابلها بعد الخصم؟</strong>",
    callout: "هل سيكون مجموع الخصم الكلي على 10 زجاجات أكبر من مجموع الخصم على زجاجة واحدة؟",
    opts: ["نعم", "لا"],
    correct: 0,
  },

  {
    screen: 19,
    title: "وإذا اشترينا 10 زجاجات؟",
    lead: "<strong>غم الحفظ، تأملوا في التمرين. لا تحلوه، فقط انظروا إلى البيانات وتفكروا إن كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>اشترى عميل 10 زجاجات.<br>كم دفع مقابلها بعد الخصم؟</strong>" + TEN_TABLE,
    callout: `دعونا نوضّح:<br>
      إذا اشترى الزبون 10 زجاجات<br>
      فإنه <strong>بعد</strong> الخصم سيدفع:
      <span class="g-eq" dir="ltr">10 · 17 = <strong><span dir="rtl">⁦₪170⁩</span></strong></span>
      بدلًا من أن يدفع <strong>قبل</strong> الخصم:
      <span class="g-eq" dir="ltr">10 · 20 = <strong><span dir="rtl">⁦₪200⁩</span></strong></span>
      <br>أي أن مجموع الخصم هو ⁦₪30⁩.`,
  },

  {
    screen: 20,
    title: "وإذا اشترينا 10 زجاجات؟",
    lead: "<strong>غم الحفظ، تأملوا في التمرين. لا تحلوه، فقط انظروا إلى البيانات وتفكروا إن كان لديكم اتجاه للحل.</strong>",
    body: G_EXERCISE_AB + "<br><strong>اشترى العميل 10 زجاجات.<br>كم دفع عليها بعد الخصم؟</strong>",
    callout: "كلما زدنا <strong>عدد الزجاجات التي عليها خصم،</strong><br>سيزداد مبلغ الخصم.",
  },
];

const gState = {};

/* Guided flow progress (producer 27.08): the approved station strip, one
   station per interactive question (א..ה), shown on EVERY guided screen so the
   learner always knows which question the explanation belongs to. */
const G_LETTERS = ["أ", "ب", "ت", "ث", "جـ", "و", "ز", "ح"];
function gQuestionIndexFor(cfg) {
  /* stations are the exercise's sub-questions א/ב/ג (producer 31.08):
     screens 10-14 = א, 15-17 = ב, 18-20 = ג */
  if (cfg.screen <= 14) return 0;
  if (cfg.screen <= 17) return 1;
  return 2;
}
const G_GROUPS = [
  { label: 'أ', screens: [10, 11] },
  { label: 'ب', screens: [15, 16] },
  { label: 'ت', screens: [18] },
];
function gprogHTML(curIdx) {
  const steps = G_GROUPS,
    parts = [];
  steps.forEach((grp, i) => {
    /* a station is done when all its interactive steps are answered;
       correct only if all of them were */
    const sts = grp.screens.map((n) => gState["s" + n]).filter(Boolean);
    const done = sts.length && sts.every((st) => st.answered);
    const ok = done && grp.screens.every((n) => {
      const cfg = GUIDED.find((c) => c.screen === n);
      return gState["s" + n].picked === cfg.correct;
    });
    const cls = (done ? (ok ? "is-correct" : "is-wrong") : "") + (i === curIdx ? " is-current" : "");
    parts.push(
      '<div class="qprog-station ' +
        cls +
        '"><span class="qprog-dot">' +
        QP_TICK +
        QP_X +
        '<span class="qprog-label">سؤال ' +
        G_LETTERS[i] +
        "</span></div>",
    );
    if (i < steps.length - 1) parts.push('<span class="qprog-line' + (done ? " is-done" : "") + '"></span>');
  });
  return '<div class="qprog" aria-hidden="true">' + parts.join("") + "</div>";
}
function gprogRefresh() {
  GUIDED.forEach((c) => {
    const el = document.querySelector("#s" + c.screen + " .qprog");
    if (el) el.outerHTML = gprogHTML(gQuestionIndexFor(c));
  });
}

function buildGuidedScreens() {
  const app = document.getElementById("app");
  const anchor = document.getElementById("s21");
  const steps = GUIDED.filter((c) => c.opts);
  GUIDED.forEach((cfg) => {
    const sid = "s" + cfg.screen;
    gState[sid] = { answered: !cfg.opts, picked: null };   // state stays global
    if (!inThisPart(cfg.screen)) return;
    const sec = document.createElement("section");
    sec.className = "screen";
    sec.dataset.screen = cfg.screen;
    sec.id = sid;

    const stepIdx = steps.indexOf(cfg);
    const counter = cfg.opts ? "" : ""; /* producer 24.08: no "N מתוך M" counter in the callout */
    const opts = cfg.opts
      ? `<div class="gc-opts" role="radiogroup" aria-label="اختاروا الإجابة">
        ${cfg.opts.map((o, i) => `<button class="gc-opt" type="button" role="radio" aria-checked="false" data-idx="${i}" onclick="gPick('${sid}', ${i})"><span class="gc-badge gc-badge-correct" aria-hidden="true"><svg viewBox="0 0 10.4133 7.51728" fill="none"><path d="M3.36229 7.51715C3.06671 7.51727 2.78322 7.39978 2.57439 7.1906L0.192279 4.80937C-0.0640367 4.55298 -0.0640367 4.13736 0.192279 3.88096C0.448678 3.62464 0.864299 3.62464 1.1207 3.88096L3.36229 6.12255L9.29261 0.192237C9.54901 -0.064079 9.96463 -0.064079 10.221 0.192237C10.4773 0.448635 10.4773 0.864256 10.221 1.12065L4.1502 7.1906C3.94136 7.39978 3.65788 7.51727 3.36229 7.51715Z" fill="white"/></svg></span><span class="gc-badge gc-badge-incorrect" aria-hidden="true"><svg viewBox="0 0 10 10" fill="none"><path d="M9.76736 0.232637C9.61836 0.0836796 9.4163 0 9.20561 0C8.99492 0 8.79286 0.0836796 8.64386 0.232637L5 3.87649L1.35615 0.232637C1.20714 0.0836796 1.00508 0 0.794391 0C0.583702 0 0.381639 0.0836796 0.232637 0.232637C0.0836796 0.381639 0 0.583702 0 0.794391C0 1.00508 0.0836796 1.20714 0.232637 1.35615L3.87649 5L0.232637 8.64386C0.0836796 8.79286 0 8.99492 0 9.20561C0 9.4163 0.0836796 9.61836 0.232637 9.76736C0.381639 9.91632 0.583702 10 0.794391 10C1.00508 10 1.20714 9.91632 1.35615 9.76736L5 6.12351L8.64386 9.76736C8.79286 9.91632 8.99492 10 9.20561 10C9.4163 10 9.61836 9.91632 9.76736 9.76736C9.91632 9.61836 10 9.4163 10 9.20561C10 8.99492 9.91632 8.79286 9.76736 8.64386L6.12351 5L9.76736 1.35615C9.91632 1.20714 10 1.00508 10 0.794391C10 0.583702 9.91632 0.381639 9.76736 0.232637Z" fill="white"/></svg></span><span class="gc-opt-text">${o}</span></button>`).join("")}
      </div>`
      : "";

    /* No stepper on the guided flow (producer 14.09.26). `gprogHTML` and
       `gprogRefresh` stay — the markup is simply not emitted — so restoring it
       is a one-line change. The `g-has-prog` class is what reserves the
       headroom, so it goes too. */
    const prog = "";
    if (cfg.kind === "transition") {
      sec.innerHTML = `
        ${prog}
        <h1 class="g-title">${cfg.title}</h1>
        <div class="g-transition">
          <div class="rs-bubble rs-bubble--beside g-bubble">
            <svg class="rs-bubble-shape" viewBox="0 0 241 137" preserveAspectRatio="none" aria-hidden="true"><use href="#bubble-tail-down"/></svg>
            <span class="rs-bubble-text" id="${sid}-bubble">${cfg.bubble}</span>
          </div>
          ${
            cfg.video
              ? `<video class="g-char g-char--video" src="../unit-assets/video/${cfg.video}" autoplay loop muted playsinline preload="auto" aria-label="الشخصية المرافقة"></video>`
              : `<img loading="lazy" class="g-char" src="../unit-assets/img/character-happy.png" alt="الشخصية المرافقة">`
          }
          ${opts}
        </div>
        <button class="btn-continue" id="${sid}-continue" ${cfg.opts ? "disabled" : ""} onclick="advanceScreen()"><span class="nav-label" data-label="متابعة"><span>متابعة</span></span></button>
        <button class="scq-back" type="button" onclick="goBack()"><span class="nav-label" data-label="رجوع"><span>رجوع</span></span></button>
        ${cfg.opts ? prPopupBlock(sid) : ""}`;
    } else {
      sec.innerHTML = `
        ${prog}
        <h1 class="g-title">${cfg.title}</h1>
        <p class="g-lead">${cfg.lead}</p>
        <div class="g-layout">
          <div class="g-right">
            <div class="g-body">${cfg.body}</div>
          </div>
          <aside class="g-callout">
            <div class="gc-text">${cfg.callout}</div>
            ${opts}
            ${counter}
          </aside>
        </div>
        ${
          cfg.bubble
            ? `<div class="g-widget">
            <div class="rs-bubble rs-bubble--beside g-widget-bubble">
              <svg class="rs-bubble-shape" viewBox="0 0 241 137" preserveAspectRatio="none" aria-hidden="true"><use href="#bubble-tail-right"/></svg>
              <span class="rs-bubble-text">${cfg.bubble}</span>
            </div>
            <img loading="lazy" src="../unit-assets/img/character-thinking.png" alt="الشخصية المرافقة">
          </div>`
            : ""
        }
        <button class="btn-continue" id="${sid}-continue" ${cfg.opts ? "disabled" : ""} onclick="advanceScreen()"><span class="nav-label" data-label="متابعة"><span>متابعة</span></span></button>
        <button class="scq-back" type="button" onclick="goBack()"><span class="nav-label" data-label="رجوع"><span>رجوع</span></span></button>`;
    }
    app.insertBefore(sec, anchor);
  });
}

/* one-tap reveal: correct turns green, a wrong pick turns red, continue opens */
function gPick(sid, idx) {
  const st = gState[sid];
  if (!st || st.answered) return;
  const cfg = GUIDED.find((c) => "s" + c.screen === sid);
  st.answered = true;
  st.picked = idx;
  /* one tap, one attempt — always the final answer */
  xapiReport(sid, idx === cfg.correct, true, cfg.opts[idx]);
  document.querySelectorAll("#" + sid + " .gc-opt").forEach((o) => {
    const i = Number(o.dataset.idx);
    if (i === cfg.correct) o.classList.add("correct");
    else if (i === idx) o.classList.add("wrong");
    o.setAttribute("aria-checked", i === idx ? "true" : "false");
    o.disabled = true;
  });
  // producer 27.08: a NORMAL feedback popup (green/red, draggable) — the
  // speech bubble itself stays as written
  if (cfg.afterCorrect || cfg.afterWrong) {
    st.result = idx === cfg.correct ? "correct" : "wrong2";
    gShowPopup(sid, st.result);
  }
  const cont = document.getElementById(sid + "-continue");
  if (cont) cont.disabled = false;
  gprogRefresh();
  try { flushResumeSave(); } catch (e) {}
}

function gShowPopup(sid, type) {
  const cfg = GUIDED.find((c) => "s" + c.screen === sid);
  const popup = document.getElementById(sid + "-popup");
  if (!cfg || !popup) return;
  const raw = type === "correct" ? cfg.afterCorrect : cfg.afterWrong;
  const [first, ...rest] = raw.split("<br>");
  popup.style.background = type === "correct" ? "#edf8ed" : "#ffdbdc";
  resetPopupPosition(popup);
  document.getElementById(sid + "-popup-title").innerHTML = first.replace(/<\/?strong>/g, "");
  document.getElementById(sid + "-popup-body").innerHTML = rest.map((x) => "<p>" + x + "</p>").join("");
  popup.classList.remove("hidden");
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}

function gAnswered(n) {
  const st = gState["s" + n];
  return !st || st.answered;
}

buildGuidedScreens();

/* Tell the DEV harness how many screens there are — after every builder has
   run, otherwise only the static sections are counted. */
if (window.parent !== window) {
  /* deferred: the remaining builders (practice sets, scrollsets) run after this
     point in the file, so counting the DOM here would see only the early
     screens (producer 14.09.26 — the bar read S 0 / 21). */
  setTimeout(() =>
  window.parent.postMessage(
    {
      type: "DEV_READY",
      /* the HIGHEST screen that actually exists, +1 — not TOTAL_SCREENS.
         Removed screens leave gaps, and counting them made the dev bar claim
         screens that are not there (producer 14.09.26: "how is there still 64
         slides?" — the bar read S 0 / 65 for a unit whose last screen is 64). */
      total:
        Math.max(
          ...[...document.querySelectorAll(".screen[data-screen]")].map((el) => +el.dataset.screen),
        ) + 1,
    },
    "*",
  ), 0);
}

/* hint icons, lifted from the static screens so generated screens carry the
   identical SVGs (maven-skills §8i — vendor the shared blocks verbatim) */
const HINT_ICON = `<svg class="scq-hint-icon" viewBox="0 0 25.9999 22.2883" fill="none" aria-hidden="true"><path d="M17.7925 2.76345C16.3676 1.37911 14.5057 0.68776 12.5488 0.815545C9.07995 1.04163 6.27286 3.9168 6.01796 7.50134C5.85646 9.77363 6.7035 11.9443 8.34374 13.4548C9.23036 14.2723 9.74016 15.465 9.74016 16.7265H11.2284H14.7733H16.2615C16.2615 15.4847 16.7919 14.2707 17.7181 13.3959C19.17 12.0263 20.0012 10.0751 20.0012 8.04361C20.0012 6.01215 19.1953 4.12486 17.7909 2.76018L17.7925 2.76345ZM13.0001 5.54524C11.6701 5.54524 10.5856 6.66582 10.5856 8.04525C10.5856 8.46956 10.2515 8.81524 9.84149 8.81524C9.43143 8.81524 9.09736 8.46956 9.09736 8.04525C9.09736 5.8172 10.8484 4.00527 13.0001 4.00527C13.4133 4.00527 13.7473 4.35094 13.7473 4.77525C13.7473 5.19957 13.4133 5.54524 13.0001 5.54524Z" fill="currentColor"/><path d="M9.73858 19.6245C9.73858 20.3289 9.99823 20.9908 10.478 21.4904L10.4938 21.5068C10.9783 22.0098 11.6242 22.2883 12.3114 22.2883H13.6888C14.3775 22.2883 15.025 22.0114 15.5111 21.5052C15.9956 21.0039 16.2631 20.3355 16.2631 19.6277V17.9895H9.73858V19.6245ZM11.2268 19.5294H14.7717V19.6277C14.7717 19.9243 14.6609 20.2077 14.4566 20.419C14.254 20.6254 13.9753 20.7483 13.6888 20.7483H12.3114C12.028 20.7483 11.7588 20.6336 11.5561 20.4305L11.5451 20.4174C11.3424 20.211 11.2268 19.9226 11.2268 19.6261V19.5311V19.5294Z" fill="currentColor"/><path d="M25.2558 7.27531H22.607C22.1954 7.27531 21.8629 7.62099 21.8629 8.0453C21.8629 8.46961 22.197 8.81529 22.607 8.81529H25.2558C25.6674 8.81529 25.9999 8.46961 25.9999 8.0453C25.9999 7.62099 25.6658 7.27531 25.2558 7.27531Z" fill="currentColor"/><path d="M4.1386 8.0453C4.1386 7.61935 3.80453 7.27531 3.39447 7.27531H0.744124C0.332481 7.27531 0 7.62099 0 8.0453C0 8.46961 0.334064 8.81529 0.744124 8.81529H3.39289C3.80453 8.81529 4.13701 8.46961 4.13701 8.0453H4.1386Z" fill="currentColor"/><path d="M20.8702 3.11398C21.0175 3.11398 21.1663 3.06811 21.2961 2.97472L23.4667 1.40198C23.804 1.15788 23.8847 0.677863 23.6488 0.328911C23.4129 -0.0200418 22.949 -0.105232 22.6118 0.140509L20.4412 1.71325C20.1039 1.95736 20.0232 2.43737 20.2591 2.78632C20.4032 3.00094 20.6343 3.11562 20.8702 3.11562V3.11398Z" fill="currentColor"/><path d="M4.70372 13.1172L2.53309 14.69C2.19586 14.9341 2.11512 15.4141 2.35102 15.763C2.49509 15.9777 2.72625 16.0923 2.96215 16.0923C3.10939 16.0923 3.25822 16.0465 3.38804 15.9531L5.55867 14.3803C5.8959 14.1362 5.97665 13.6562 5.74074 13.3073C5.50484 12.9583 5.04095 12.8731 4.70372 13.1189V13.1172Z" fill="currentColor"/><path d="M23.4668 14.6884L21.2961 13.1157C20.9589 12.8716 20.495 12.9567 20.2591 13.3041C20.0232 13.653 20.1055 14.133 20.4412 14.3771L22.6118 15.9499C22.7416 16.0449 22.8904 16.0891 23.0377 16.0891C23.272 16.0891 23.5032 15.9744 23.6488 15.7598C23.8847 15.4109 23.8024 14.9309 23.4668 14.6868V14.6884Z" fill="currentColor"/><path d="M5.55869 1.71322L3.38806 0.140478C3.05083 -0.103625 2.58694 -0.0184349 2.35104 0.328879C2.11513 0.677832 2.19746 1.15785 2.53311 1.40195L4.70374 2.97469C4.83356 3.06971 4.98239 3.11395 5.12963 3.11395C5.36395 3.11395 5.5951 2.99927 5.74076 2.78465C5.97666 2.4357 5.89434 1.95569 5.55869 1.71158V1.71322Z" fill="currentColor"/></svg>`;
const HINT_TITLE_ICON = `<svg class="scq-hint-title-icon" viewBox="0 0 25.9999 22.2883" fill="none" aria-hidden="true"><path d="M17.7925 2.76345C16.3676 1.37911 14.5057 0.68776 12.5488 0.815545C9.07995 1.04163 6.27286 3.9168 6.01796 7.50134C5.85646 9.77363 6.7035 11.9443 8.34374 13.4548C9.23036 14.2723 9.74016 15.465 9.74016 16.7265H11.2284H14.7733H16.2615C16.2615 15.4847 16.7919 14.2707 17.7181 13.3959C19.17 12.0263 20.0012 10.0751 20.0012 8.04361C20.0012 6.01215 19.1953 4.12486 17.7909 2.76018L17.7925 2.76345ZM13.0001 5.54524C11.6701 5.54524 10.5856 6.66582 10.5856 8.04525C10.5856 8.46956 10.2515 8.81524 9.84149 8.81524C9.43143 8.81524 9.09736 8.46956 9.09736 8.04525C9.09736 5.8172 10.8484 4.00527 13.0001 4.00527C13.4133 4.00527 13.7473 4.35094 13.7473 4.77525C13.7473 5.19957 13.4133 5.54524 13.0001 5.54524Z" fill="currentColor"/><path d="M9.73858 19.6245C9.73858 20.3289 9.99823 20.9908 10.478 21.4904L10.4938 21.5068C10.9783 22.0098 11.6242 22.2883 12.3114 22.2883H13.6888C14.3775 22.2883 15.025 22.0114 15.5111 21.5052C15.9956 21.0039 16.2631 20.3355 16.2631 19.6277V17.9895H9.73858V19.6245ZM11.2268 19.5294H14.7717V19.6277C14.7717 19.9243 14.6609 20.2077 14.4566 20.419C14.254 20.6254 13.9753 20.7483 13.6888 20.7483H12.3114C12.028 20.7483 11.7588 20.6336 11.5561 20.4305L11.5451 20.4174C11.3424 20.211 11.2268 19.9226 11.2268 19.6261V19.5311V19.5294Z" fill="currentColor"/><path d="M25.2558 7.27531H22.607C22.1954 7.27531 21.8629 7.62099 21.8629 8.0453C21.8629 8.46961 22.197 8.81529 22.607 8.81529H25.2558C25.6674 8.81529 25.9999 8.46961 25.9999 8.0453C25.9999 7.62099 25.6658 7.27531 25.2558 7.27531Z" fill="currentColor"/><path d="M4.1386 8.0453C4.1386 7.61935 3.80453 7.27531 3.39447 7.27531H0.744124C0.332481 7.27531 0 7.62099 0 8.0453C0 8.46961 0.334064 8.81529 0.744124 8.81529H3.39289C3.80453 8.81529 4.13701 8.46961 4.13701 8.0453H4.1386Z" fill="currentColor"/><path d="M20.8702 3.11398C21.0175 3.11398 21.1663 3.06811 21.2961 2.97472L23.4667 1.40198C23.804 1.15788 23.8847 0.677863 23.6488 0.328911C23.4129 -0.0200418 22.949 -0.105232 22.6118 0.140509L20.4412 1.71325C20.1039 1.95736 20.0232 2.43737 20.2591 2.78632C20.4032 3.00094 20.6343 3.11562 20.8702 3.11562V3.11398Z" fill="currentColor"/><path d="M4.70372 13.1172L2.53309 14.69C2.19586 14.9341 2.11512 15.4141 2.35102 15.763C2.49509 15.9777 2.72625 16.0923 2.96215 16.0923C3.10939 16.0923 3.25822 16.0465 3.38804 15.9531L5.55867 14.3803C5.8959 14.1362 5.97665 13.6562 5.74074 13.3073C5.50484 12.9583 5.04095 12.8731 4.70372 13.1189V13.1172Z" fill="currentColor"/><path d="M23.4668 14.6884L21.2961 13.1157C20.9589 12.8716 20.495 12.9567 20.2591 13.3041C20.0232 13.653 20.1055 14.133 20.4412 14.3771L22.6118 15.9499C22.7416 16.0449 22.8904 16.0891 23.0377 16.0891C23.272 16.0891 23.5032 15.9744 23.6488 15.7598C23.8847 15.4109 23.8024 14.9309 23.4668 14.6868V14.6884Z" fill="currentColor"/><path d="M5.55869 1.71322L3.38806 0.140478C3.05083 -0.103625 2.58694 -0.0184349 2.35104 0.328879C2.11513 0.677832 2.19746 1.15785 2.53311 1.40195L4.70374 2.97469C4.83356 3.06971 4.98239 3.11395 5.12963 3.11395C5.36395 3.11395 5.5951 2.99927 5.74076 2.78465C5.97666 2.4357 5.89434 1.95569 5.55869 1.71158V1.71322Z" fill="currentColor"/></svg>`;

/* ═══════════════════════════════════════════════════════════
   PRACTICE SETS (slides 37-52) — screens 22-35.
   Question types reuse this unit's SCQ/DQ engines; the value-input
   question and the question-progress strip are vendored from the
   client-approved ratio-01-01 (.viq-input-box / .qprog).
   Copy is taken run-for-run from the scanner dump; line breaks and
   partial bolds follow the rendered deck page (maven-skills §1/§1b).
   ═══════════════════════════════════════════════════════════ */

/* Proportion table for the feedback popups. The deck's gridCol order is
   left→right and the אחוז column is the LEFT one; .acq-table is direction:rtl
   so the FIRST <th> lands rightmost — hence (left, right) is emitted reversed. */
function propTable(leftHead, rightHead, rows) {
  return (
    `<table class="acq-table"><thead><tr><th>${rightHead}</th><th>${leftHead}</th></tr></thead><tbody>` +
    rows.map((r) => `<tr><td>${r[1]}</td><td>${r[0]}</td></tr>`).join("") +
    `</tbody></table>`
  );
}
const EQ = (t) => `<span class="g-eq" dir="ltr">${t}</span>`;

/* set → number of stations; screen → which station it belongs to */
const PR_SETS = { W: 2, A: 5, B: 4, C: 5, D: 4, E: 3, F: 2 };
/* sets that keep their `set`/`q` (results, xAPI) but draw NO stepper strip —
   QA 05.10.26: the peak questions (components 06/07) run without one */
const PR_NO_STEPPER = ["E"];
/* how a question index maps to a stepper STATION. Set W's four screens are two
   questions of two parts each (fridge א/ב, greenhouse א/ב), so the strip reads
   שאלה 1 / שאלה 2 (producer 14.09.26). */
const PR_STATION = { W: (q) => Math.ceil(q / 2) };
function prStation(set, q) {
  const f = PR_STATION[set];
  return f ? f(q) : q;
}
/* sets whose stations are lettered like the guided flow (producer 27.08) */
const PR_SET_LETTERS = {};
const prResults = {}; // 'A:2' -> true/false

function prSetKey(set, idx) {
  return set + ":" + idx;
}

function qprogHTML(set, curIdx) {
  const total = PR_SETS[set],
    parts = [];
  /* .qprog is direction:rtl, so DOM order runs right-to-left: the first child
     is the RIGHTMOST station. Station 1 therefore comes first. */
  for (let i = 1; i <= total; i++) {
    const r = prResults[prSetKey(set, i)];
    const cls = r === true ? "is-correct" : r === false ? "is-wrong" : i === curIdx ? "is-current" : "";
    parts.push(
      '<div class="qprog-station ' +
        cls +
        '"><span class="qprog-dot">' +
        QP_TICK +
        QP_X +
        '</span><span class="qprog-label">السؤال ' +
        (PR_SET_LETTERS[set] ? G_LETTERS[i - 1] : i) +
        "</span></div>",
    );
    if (i < total) parts.push('<span class="qprog-line' + (r !== undefined ? " is-done" : "") + '"></span>');
  }
  return '<div class="qprog" aria-hidden="true">' + parts.join("") + "</div>";
}

/* called by the SCQ/DQ/VIQ engines when a practice question resolves */
function setPracticeResult2(sid, ok) {
  const cfg = PR.find((c) => "s" + c.screen === sid);
  if (!cfg || !cfg.set || !cfg.q) return;
  const key = prSetKey(cfg.set, prStation(cfg.set, cfg.q));
  /* The station shows the result of the part just answered. It used to LATCH
     a wrong part (`=== false ? false : ok`), so a learner who missed part א
     and then got part ב right still saw a red station — producer 14.09.26,
     "even after answering correctly the stepper counts a mistake". */
  prResults[key] = ok;
  prRefreshStrips();
}
/* Redraw every strip from prResults — DOM only, so the resume painters call it too
   (a restored prResults never passes through setPracticeResult2). */
function prRefreshStrips() {
  PR.forEach((c) => {
    if (!c.set) return;
    const el = document.querySelector("#s" + c.screen + " .qprog");
    if (el) el.outerHTML = qprogHTML(c.set, prStation(c.set, c.q));
  });
}

/* ─── ValueInputQuestion engine (ratio-01-01 pattern, config-driven) ─── */
const VIQ = {};
const scrollSets = {}; /* screen -> { qids, scrolledEnd } */
function viqInputs(sid) {
  return [...document.querySelectorAll("#" + sid + " .viq-input-box")];
}
function viqOnInput(sid) {
  const q = VIQ[sid];
  if (!q || q.done) return;
  const vals = viqInputs(sid).map((el) => el.value.trim());
  const filled = vals.every((v) => v !== "");
  const chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = !filled || JSON.stringify(vals) === JSON.stringify(q.lastWrong || []);
  if (q.attempts > 0) {
    viqInputs(sid).forEach((el) => el.classList.remove("error", "correct"));
    document.getElementById(sid + "-popup")?.classList.add("hidden");
  }
}
function viqShowPopup(sid, type) {
  const q = VIQ[sid];
  if (type !== "retry") q.result = type; // remembered so the verdict survives navigation
  const cfg = {
    retry: { bg: "#ffdbdc", title: "الإجابة غير دقيقة، هل نحاول مرة أخرى؟", body: [] },
    correct: { bg: "#edf8ed", title: q.correctTitle, body: q.body },
    wrong2: { bg: "#ffdbdc", title: q.wrongTitle, body: q.bodyWrong || q.body },
  }[type];
  const popup = document.getElementById(sid + "-popup");
  if (!popup) return;
  popup.style.background = cfg.bg;
  /* state marker so CSS can treat the red panel differently from the green one
     (producer 14.09.26: the red title reads right, the green stays centred) */
  popup.dataset.state = type;
  resetPopupPosition(popup);
  /* innerHTML, not textContent: the standard red title carries a <br>
     (producer 14.09.26). These titles are ours, never learner input. */
  document.getElementById(sid + "-popup-title").innerHTML = cfg.title;
  renderPopupBody(sid, cfg.body, type === 'retry' ? null : q.pages);
  popup.classList.remove("hidden");
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}
/* התשובה שלי / התשובה הנכונה for a value-input question — the same control the
   dropdown questions use, so a revealed answer never hides what the learner
   actually wrote. */
function viqAddAnswerToggle(sid) {
  const q = VIQ[sid];
  const body = document.getElementById(sid + "-popup-body");
  if (!q || !body || !q.userInputs || body.querySelector(".fb-answer-toggle")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fb-answer-toggle";
  btn.dataset.mode = "correct";
  btn.textContent = "الانتقال إلى إجابتي";
  btn.onclick = () => {
    const els = viqInputs(sid);
    const showMine = btn.dataset.mode === "correct";
    els.forEach((el, i) => {
      const right = Number(q.userInputs[i]) === q.answers[i];
      el.value = showMine ? q.userInputs[i] : q.answers[i];
      el.classList.toggle("error", showMine && !right);
      el.classList.toggle("revealed", !showMine && !right);
      el.classList.toggle("correct", right || !showMine);
    });
    btn.dataset.mode = showMine ? "mine" : "correct";
    btn.textContent = showMine ? "الانتقال إلى الإجابة الصحيحة" : "الانتقال إلى إجابتي";
  };
  body.appendChild(btn);
}

function viqCheck(sid) {
  const q = VIQ[sid];
  if (q.done) {
    advanceScreen();
    return;
  }
  const els = viqInputs(sid);
  const vals = els.map((el) => el.value.trim());
  if (vals.some((v) => v === "")) return;
  q.attempts++;
  const ok = vals.every((v, i) => Number(v) === q.answers[i]);
  xapiReportFields(sid, vals, vals.map((v, i) => Number(v) === q.answers[i]), ok || q.attempts >= 2);
  const finish = (good) => {
    q.done = true;
    els.forEach((el, i) => {
      el.disabled = true;
      /* the learner's value stays as typed (producer 31.08); each box is
         marked by its OWN verdict — green outline right, red outline wrong */
      const okHere = Number(el.value) === q.answers[i];
      el.classList.toggle("correct", okHere);
      el.classList.toggle("error", !okHere);
    });
    const chk = document.getElementById(sid + "-check");
    if (chk) {
      if (chk.classList.contains("btn-inline-check")) chk.disabled = true;
      else { setNavLabel(chk, "متابعة"); chk.disabled = popupGatePending(sid); }
    }
    hideHintButton(sid);
    setPracticeResult2(sid, good);
  };
  if (ok) {
    els.forEach((el) => el.classList.add("correct"));
    viqShowPopup(sid, "correct");
    finish(true);
  } else if (q.attempts >= 2) {
    /* The final reveal SHOWS the right answer in the box (producer 14.09.26,
       dev 54 — it used to leave the learner's own value there with only a red
       outline, so the answer never appeared). The typed value is kept and a
       toggle in the feedback swaps between the two. */
    q.userInputs = vals.slice();
    els.forEach((el, i) => {
      if (Number(vals[i]) !== q.answers[i]) {
        el.value = q.answers[i];
        el.classList.add("revealed");
      }
    });
    viqShowPopup(sid, "wrong2");
    viqAddAnswerToggle(sid);
    finish(false);
  } else {
    q.lastWrong = vals;
    els.forEach((el, i) => {
      if (Number(vals[i]) !== q.answers[i]) el.classList.add("error");
    });
    viqShowPopup(sid, "retry");
    const chk = document.getElementById(sid + "-check");
    if (chk) chk.disabled = true;
    revealHintButton(sid);
  }
  try { flushResumeSave(); } catch (e) {}
}
/* open task: no key, just "everything filled" */
const TASKS = {};
function taskOnInput(sid) {
  const st = TASKS[sid];
  if (!st || st.done) return;
  const filled = [...document.querySelectorAll("#" + sid + " .task-input")].every((el) => el.value.trim() !== "");
  const btn = document.getElementById(sid + "-check");
  if (btn) btn.disabled = !filled;
}
function taskCheck(sid) {
  const st = TASKS[sid];
  if (!st) return;
  st.done = true;
  try { flushResumeSave(); } catch (e) {}
  advanceScreen();
}
function taskAnswered(n) {
  const st = TASKS["s" + n];
  return !st || st.done;
}

function viqAnswered(n) {
  const q = VIQ["s" + n];
  return !q || q.done;
}

/* ─── MultipleChoiceQuestion (slides 61, 70) — pick every correct statement.
       Same 2-attempt policy as SCQ; checkbox pills use the unit's .is-multi
       variant. Keys come from each slide's feedback ("התשובות הנכונות הן ב, ד"). ─── */
const MCQ = {};
function mcqToggle2(sid, id) {
  const q = MCQ[sid];
  if (!q || q.done) return;
  if (q.selected.has(id)) q.selected.delete(id);
  else q.selected.add(id);
  if (q.attempts > 0) {
    document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => o.classList.remove("wrong", "correct"));
    document.getElementById(sid + "-popup")?.classList.add("hidden");
  }
  document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => {
    const on = q.selected.has(o.dataset.id);
    o.classList.toggle("selected", on);
    o.setAttribute("aria-checked", on ? "true" : "false");
  });
  const chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = q.selected.size === 0 || mcqSnap(q.selected) === q.lastWrong;
}
function mcqSnap(set) {
  return JSON.stringify([...set].sort());
}
function mcqCheck2(sid) {
  const q = MCQ[sid];
  if (q.done) {
    advanceScreen();
    return;
  }
  if (!q.selected.size) return;
  q.attempts++;
  const ok = mcqSnap(q.selected) === mcqSnap(q.correctIds);
  xapiReport(sid, ok, ok || q.attempts >= 2,
    xapiMultiAnswer([...q.selected].sort(), (id) => document.querySelector("#" + sid + ' .scq-opt[data-id="' + id + '"]')));
  const reveal = () => {
    document.querySelectorAll("#" + sid + " .scq-opt").forEach((o) => {
      o.classList.remove("selected");
      if (q.correctIds.has(o.dataset.id)) o.classList.add("correct");
      else if (q.selected.has(o.dataset.id)) o.classList.add("wrong");
      o.disabled = true;
    });
  };
  const finish = (good) => {
    q.done = true;
    const chk = document.getElementById(sid + "-check");
    if (chk) {
      setNavLabel(chk, "متابعة");
      chk.disabled = popupGatePending(sid);
    }
    hideHintButton(sid);
    setPracticeResult2(sid, good);
  };
  if (ok) {
    reveal();
    scqShowPopup2Generic(sid, "correct");
    finish(true);
  } else if (q.attempts >= 2) {
    reveal();
    scqShowPopup2Generic(sid, "wrong2");
    finish(false);
  } else {
    q.lastWrong = mcqSnap(q.selected);
    scqShowPopup2Generic(sid, "retry");
    const chk = document.getElementById(sid + "-check");
    if (chk) chk.disabled = true;
    revealHintButton(sid);
  }
  try { flushResumeSave(); } catch (e) {}
}
/* one popup renderer for MCQ (SCQ's reads from the SCQ map) */
function scqShowPopup2Generic(sid, type) {
  const q = MCQ[sid];
  if (type !== "retry") q.result = type; // remembered so the verdict survives navigation
  const cfg = {
    retry: { bg: "#ffdbdc", title: "الإجابة غير دقيقة، هل نحاول مرة أخرى؟", body: [] },
    correct: { bg: "#edf8ed", title: q.correctTitle, body: q.body },
    wrong2: { bg: "#ffdbdc", title: q.wrongTitle, body: q.body },
  }[type];
  const popup = document.getElementById(sid + "-popup");
  if (!popup) return;
  popup.style.background = cfg.bg;
  /* state marker so CSS can treat the red panel differently from the green one
     (producer 14.09.26: the red title reads right, the green stays centred) */
  popup.dataset.state = type;
  resetPopupPosition(popup);
  /* innerHTML, not textContent: the standard red title carries a <br>
     (producer 14.09.26). These titles are ours, never learner input. */
  document.getElementById(sid + "-popup-title").innerHTML = cfg.title;
  renderPopupBody(sid, cfg.body, type === 'retry' ? null : q.pages);
  popup.classList.remove("hidden");
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}
/* Feedback that continues: the deck often puts a second (and third) page of
   reasoning behind a "המשך" — דרך ב / דרך ג / סעיף ב. Producer 21.08: this is
   the standard now, so every engine reads `pages` and renders the button. */
function popupCfgFor(sid) {
  return (
    (typeof MCQ !== "undefined" && MCQ[sid]) ||
    (typeof VIQ !== "undefined" && VIQ[sid]) ||
    (typeof SCQ !== "undefined" && SCQ[sid]) ||
    (typeof DQ !== "undefined" && DQ[sid]) ||
    null
  );
}
/* The client asked for the scroll-hint animation on a feedback panel that
   overflows, same component and same drift as the scroll SCREENS use
   (producer 14.09.26). Measured after the panel is visible — a display:none
   element measures zero (maven-skills §8) — and it disappears on first scroll. */
/* A panel is anchored bottom:130px, so a tall one grows UPWARD and its head
   runs off the top of the stage (producer 14.09.26, screens 50 and 52). Once
   the content is in, clamp it into the canvas and let it scroll instead. */
function popupClampTop(popup) {
  const app = document.getElementById("app");
  if (!popup || !app) return;
  const TOP = 12, scale = typeof getAppScale === "function" ? getAppScale() : 1;
  const pr = popup.getBoundingClientRect(), ar = app.getBoundingClientRect();
  const top = (pr.top - ar.top) / scale;
  if (top >= TOP) return;
  const bottom = (ar.bottom - pr.bottom) / scale;
  popup.style.top = TOP + "px";
  popup.style.bottom = "auto";
  popup.style.maxHeight = Math.round(ar.height / scale - TOP - Math.max(bottom, 12)) + "px";
}

function popupScrollHint(sid) {
  const popup = document.getElementById(sid + "-popup");
  if (!popup) return;
  popupClampTop(popup);
  const old = popup.querySelector(".click-hint");
  if (old) old.remove();
  /* setTimeout, not requestAnimationFrame: rAF is throttled in some contexts
     (headless capture, a backgrounded tab) and the hint would never appear. */
  setTimeout(() => {
    if (popup.scrollHeight <= popup.clientHeight + 8) return;
    const hint = makeClickHint(sid + "-popup-hint-scroll");
    hint.classList.add("click-hint--in-popup");
    /* The hint hangs to the LEFT of the panel, over its scrollbar. It must NOT
       live inside the panel: the panel scrolls, so a child at a negative left
       gave it a horizontal scrollbar (producer 14.09.26). It is positioned
       against the screen instead, from the panel's own offsets. The frame is
       300px wide with the cursor 148px in (measured). */
    const host = popup.parentElement || popup;
    const pr = popup.getBoundingClientRect(), hr = host.getBoundingClientRect();
    hint.style.left = Math.round(pr.left - hr.left + 10 - 148) + "px";
    hint.style.top = Math.round(pr.top - hr.top + 40) + "px";
    host.appendChild(hint);
    popup.addEventListener("scroll", () => hint.remove(), { once: true });
  });
}

function renderPopupBody(sid, body, pages) {
  const el = document.getElementById(sid + "-popup-body");
  const more =
    pages && pages.length
      ? `<button class="popup-more" type="button" onclick="popupNextPage('${sid}')">المتابعة</button>`
      : "";
  el.innerHTML = body.map((x) => "<p>" + x + "</p>").join("") + more;
  el.dataset.page = "0";
}
/* A question whose feedback runs over several pages keeps its bar button
   locked until the learner has reached the LAST page (producer 14.09.26:
   "make sure the user has seen all the feedback screens before given the
   option to continue"). */
function popupPagesPending(sid) {
  const q = popupCfgFor(sid);
  if (!q || !q.pages || !q.pages.length) return false;
  const el = document.getElementById(sid + "-popup-body");
  return Number((el && el.dataset.page) || 0) < q.pages.length;
}
/* Screens whose feedback must be READ TO THE END before the learner may
   continue (producer 04.10, screen 50). This replaces what `pages` used to do
   for them: the "המשך" gate guaranteed the learner saw every page, and a
   plain scrolling panel does not. The gate satisfies ONCE — scrolling back up
   afterwards never re-locks the button. */
const SCROLL_GATED = ["s50"];
const SCROLL_GATE_DONE = {};

function popupScrollPending(sid) {
  if (!SCROLL_GATED.includes(sid) || SCROLL_GATE_DONE[sid]) return false;
  const popup = document.getElementById(sid + "-popup");
  if (!popup || popup.classList.contains("hidden")) return false;
  /* nothing to scroll = nothing to gate */
  if (popup.scrollHeight <= popup.clientHeight + 8) { SCROLL_GATE_DONE[sid] = true; return false; }
  return true;
}

function popupScrollGateWire(sid) {
  if (!SCROLL_GATED.includes(sid)) return;
  const popup = document.getElementById(sid + "-popup");
  if (!popup || popup.dataset.scrollGate) return;
  popup.dataset.scrollGate = "1";
  popup.addEventListener("scroll", () => {
    if (popup.scrollTop + popup.clientHeight >= popup.scrollHeight - 8) {
      SCROLL_GATE_DONE[sid] = true;
      try { scheduleResumeSave(); } catch (e) {}
      popupReleaseCheck(sid);
    }
  });
}

function popupGatePending(sid) {
  return popupPagesPending(sid) || popupScrollPending(sid);
}

function popupReleaseCheck(sid) {
  const chk = document.getElementById(sid + "-check");
  if (chk && !chk.classList.contains("btn-inline-check")) chk.disabled = popupGatePending(sid);
}

function popupNextPage(sid) {
  const q = popupCfgFor(sid);
  const el = document.getElementById(sid + "-popup-body");
  if (!q || !q.pages || !q.pages.length) return;
  const i = Number(el.dataset.page || 0); // 0 = the main body
  const page = q.pages[i];
  if (!page) return;
  const more = q.pages[i + 1]
    ? `<button class="popup-more" type="button" onclick="popupNextPage('${sid}')">المتابعة</button>`
    : "";
  el.innerHTML = page.map((x) => "<p>" + x + "</p>").join("") + more;
  el.dataset.page = String(i + 1);
  el.parentElement.scrollTop = 0;
  popupReleaseCheck(sid);
  /* the new page can be taller than the one it replaced — re-clamp and re-test
     the scroll hint now that the content has changed */
  const popup = document.getElementById(sid + "-popup");
  if (popup) {
    popup.style.top = "auto";
    popup.style.bottom = "130px";
    popup.style.maxHeight = "";
    popupClampTop(popup);
  }
  popupScrollHint(sid);
  popupScrollGateWire(sid);
  popupReleaseCheck(sid);
}
function mcqAnswered(n) {
  const q = MCQ["s" + n];
  return !q || q.done;
}

/* ─── screen configs, slides 37-52 ─── */
const EX_FRIDGE =
  'سعر الثلاجة هو ⁦₪4,900⁩.<br>يقول البائع:<br>"من المفيد أن تشتري اليوم لأن هناك تخفيضاً بنسبة <span dir="ltr">10%</span>، لذا ستوفّر حوالي ⁦₪1,000⁩".';
const EX_GREENHOUSE =
  "2. في دروس العلوم في مرحلة الإعدادية، توجد دفيئة تكنولوجية ذكية لزراعة الهيدروبونكس (زراعة النباتات على وسط مائي).<br><br>" +
  "نظام الري الآلي في الدفيئة استهلك في بداية التجربة كمية من المياه تبلغ 2,300 لتر في الأسبوع.<br><br>" +
  "لكي يحسّنوا معدّل نمو الخضروات، قررت الطلاب تغيير إعدادات الحاسوب وزيادة كمية المياه الأسبوعية بنسبة <span dir='ltr'>14%</span>.";
const EX_OIL =
  '2. في السوبرماركت يوجد عرض على زيت الزيتون من إنتاج جليلي:<br>"خصم <span dir="ltr">50%</span> على المنتج الثاني!"<br>سعر كل زجاجة زيت زيتون هو ⁦₪54⁩.';
/* VERBATIM from the deck (slide 37, methodica-math-percent-04-new.pptx).
   Client copy — numbers unseparated (4900 / 1000) exactly as written, the
   first line is "בהנחה של 10%", and the 10/100 step stays in the equation. */
const FRIDGE_BODY = [
  'ادعاء البائع غير صحيح - لا يتعلق الأمر بخصم بنسبة <span dir="ltr">10%</span>.<br>سعر الثلاجة هو ⁦₪4900⁩.',
  "<span dir='ltr'>10%</span> من 4900 هي:",
  EQ('<span dir="ltr">10%</span> · 4900 = <span class="frac"><span class="frac-num">10</span><span class="frac-den">100</span></span> · 4900 = <span class="eq-unit" dir="rtl">490 ش.ج</span>'),
  "لذلك، يتعلق الأمر بخصم قدره ⁦₪490⁩ وليس ⁦₪1000⁩.",
];
/* VERBATIM, deck slide 39: 14%∙2,300 = 14/100∙2,300 = لترات 322.
   The built line had collapsed to "2,300 · 14% = 322" — fraction step gone,
   terms reordered, unit dropped. */
const GH_A_BODY = [
  "كمية المياه الأسبوعية التي تستهلكها نظام الري هي 2,300 ليتر.",
  "لحساب الزيادة في كمية المياه، علينا حساب كم تمثل <span dir='ltr'>14%</span> من الكمية الأسبوعية:",
  EQ('<span dir="ltr">14%</span> · 2,300 = <span class="frac"><span class="frac-num">14</span><span class="frac-den">100</span></span> · 2,300 = <span class="eq-unit" dir="rtl">322 لتراً</span>'),
  "الخلاصة: كمية الري الأسبوعية زادت بمقدار 322 لتر.",
];
const GH_B_BODY = [
  "<strong>دعنا نرى طريقتين للحساب:</strong>",
  "<strong>الطريقة أ:</strong>",
  "بعد زيادة الكمية الأسبوعية من المياه بنسبة <span dir='ltr'>14%</span> وهي 322 لتر، فإن الكمية الأسبوعية من المياه هي:",
  '<span dir="ltr">2,300 + 322 = <span class="eq-unit" dir="rtl">2,622 لترات</span></span>',
  "<strong>الطريقة ب:</strong>",
  "نحسب كم يساوي <span dir='ltr'>114%</span> من 2,300:",
  '<span dir="ltr">2,300 · 114% = 2,622</span>',
  "الخلاصة: كمية المياه الأسبوعية بعد الزيادة بنسبة <span dir='ltr'>14%</span> هي 2,622 لتر.",
];
const PLANETS_TABLE = `<table class="acq-table planets-table"> <thead><tr><th>عدد الكواكب</th><th>النسبة المئوية</th></tr></thead> <tbody><tr><td>1250</td><td><span dir="ltr">125%</span></td></tr><tr><td>x</td><td><span dir="ltr">100%</span></td></tr></tbody></table>`;
const PLANETS_BODY = [
  "سنحل باستخدام جدول النسبة:",
  "نحن نعلم أنه بعد الترقية، زاد عدد الكواكب بنسبة <span dir='ltr'>25%</span>، لذلك فهو الآن <span dir='ltr'>125%</span>.",
  "من الناحية الكمية، عدد الكواكب بعد الزيادة هو 1,250.",
  "لذلك <span dir='ltr'>125%</span> يتوافق في الجدول مع 1,250 ونريد إيجاد الكمية الأصلية (قبل الزيادة)، أي: ال- <span dir='ltr'>100%</span>.",
  PLANETS_TABLE,
  "سنبني معادلة التناسب:",
  '<span class="g-eq" dir="ltr"><span class="frac"><span class="frac-num">125</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">1250</span><span class="frac-den">x</span></span></span>',
  "سنضرب في المقام المشترك 100x ونحصل على:",
  '<span class="g-eq" dir="ltr">125x = 125000</span>',
  'نقسم على 125 ونحصل على: <span dir="ltr">x = 1,000</span>',
  "<strong>الخلاصة:</strong> في السنة السابقة للتحديث التكنولوجي، كان هناك 1,000 كوكب.",
];
const OIL_A_BODY = [
  "سعر زجاجة زيت الزيتون هو ⁦₪54⁩.",
  "إذا اشترى المشتري زجاجة إضافية، فسيدفع عليها <span dir='ltr'>50%</span> من السعر، أي: نصف السعر وهو 27 ريال شاقل.",
  "لذلك، على زجاجتي زيت زيتون من إنتاج جليلي سيدفع المشتري:",
  EQ('54 + 27 = <span class="eq-unit" dir="rtl">81 ش.ج</span>'),
];
const OIL_B_BODY = [
  "بدلاً من الدفع مقابل 2 زجاجة:",
  EQ('54 + 54 = <span class="eq-unit" dir="rtl">108 ش.ج</span>'),
  "المشتري سيدفع:",
  EQ('54 + 27 = <span class="eq-unit" dir="rtl">81 ش.ج</span>'),
  "لذا سيحصل على خصم بقيمة:",
  EQ('108 - 81 = <span class="eq-unit" dir="rtl">27 ش.ج</span>'),
];
const OIL_C_BODY = [
  "علينا حساب نسبة الخصم على كل عملية شراء.",
  "نستخدم جدول التناسب:",
  "السعر الكامل لـ 2 من الزجاجات (قبل الخصم)<br>هو ⁦₪108⁩.",
  "نريد حساب نسبة الخصم التي تتطابق مع السعر<br>الخصم الذي يبلغ ⁦₪27⁩:",
  propTable("النسبة المئوية", "السعر", [["x", "27"], ["100%", "108"]]),
  "لنبنِ معادلة النسبة:",
  EQ('<span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">27</span><span class="frac-den">108</span></span>'),
  "سنضرب في المقام المشترك 10800 ونحصل على:",
  EQ("108x = 2700"),
  "نقسم على 108 ونحصل على:",
  EQ("x = 25"),
  "الخلاصة: نسبة الخصم على إجمالي المشتريات هي <span dir='ltr'>25%</span>.",
];
const MASKS_BODY = [
  "إذا كانت كمية الأقنعة 70 وتم زيادتها بنسبة <span dir='ltr'>20%</span> فهذا يعني أن الكمية الآن هي <span dir='ltr'>120%</span>.",
  "نضع في جدول النسبة الثلاثية ونكتشف كمية الأقنعة بعد الزيادة:",
  propTable("النسبة المئوية", "أقنعة", [["120%", "?"], ["100%", "70"]]),
  /* the deck's fraction reads 120%·70 over 108 — a slip (108 belongs to the oil
     question); the triangle divides by 100 and 84 is only reached that way */
  EQ('<span class="frac"><span class="frac-num"><span dir="ltr">120%</span> · 70</span><span class="frac-den">100</span></span> = <span class="eq-unit" dir="rtl">84 قناع</span>'),
  "النتيجة - عدد أقنعة المسرح الجديدة التي يجب على الطلاب تحضيرها للعرض الثاني هو 84.",
];
const TAMAR_BODY = [
  'أ. الصورة التي التقطتها هديل تم تصغيرها بنسبة <span dir="ltr">15%</span>، لذلك حجمها بالنسبة المئوية الآن هو <span dir="ltr">85%</span> <span dir="ltr">(100% - 15% = 85%)</span>.',
  "ب. لحساب حجم الصورة بعد التصغير:",
  propTable("النسبة المئوية", "الحجم (بكسل)", [["85%", "?"], ["100%", "200"]]),
  EQ('<span class="frac"><span class="frac-num"><span dir="ltr">85%</span> · 200</span><span class="frac-den"><span dir="ltr">100%</span></span></span> = <span class="eq-unit" dir="rtl">170 بكسل</span>'),
];
const CAKE_BODY = [
  "في الوصفة الأصلية، تم طلب 200 غرام من الشوكولاتة الداكنة.",
  "كريم زادَ كمية الشوكولاتة بنسبة <span dir='ltr'>60%</span> لذلك الآن يوجد في الكعكة <span dir='ltr'>160%</span> من كمية الشوكولاتة الأصلية وهي:",
  EQ('<span dir="ltr">160%</span> · 200 = 1.6 · 200 = <span class="eq-unit" dir="rtl">320 غرام</span>'),
  "الخلاصة: كمية الشوكولاتة الداكنة في الكعكة المُكبّرة هي 320 غرام.",
];

/* the three price tags with their answers filled — used inside the feedback
   panel on deck slide 54, mirroring the question's own layout. */
const TAG_ANSWERS = (rows) =>
  `<span class="tag-row tag-row--fb">${rows
    .map(
      (r) =>
        `<span class="tag-cell"><img loading="lazy" class="tag-art" src="../unit-assets/img/${r.img}" alt="تصنيف ${r.was} ش.ج">` +
        `<span class="tag-answer tag-answer--done">${r.answer} ش.ج</span></span>`,
    )
    .join("")}</span>`;

const PR = [
  {
    screen: 22,
    set: "W",
    q: 1,
    kind: "scq",
    media: "fridge-sale.svg",
    mediaAlt: "ثلاجة عليها لافتة خصم <span dir='ltr'>10%</span>",
    intro: EX_FRIDGE,
    ask: "<strong>أ.</strong> هل الخصم فعلاً بقيمة ⁦₪1,000⁩؟",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["نعم", "لا", "لا يمكن معرفة ذلك"],
    correctId: "b",
    correctTitle: "إجابتك صحيحة!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: FRIDGE_BODY,
    hint: "للتحقق من ادعاء البائع، احسبوا كم تساوي <span dir='ltr'>10%</span> من ⁦₪4,900⁩.<br>هل النتيجة قريبة من ⁦₪1,000⁩؟",
  },

  {
    screen: 23,
    set: "W",
    q: 2,
    kind: "viq",
    media: "fridge-sale.svg",
    mediaAlt: "ثلاجة عليها لافتة خصم <span dir='ltr'>10%</span>",
    intro: EX_FRIDGE,
    ask: "<strong>ب.</strong> ما هو السعر بعد الخصم؟",
    callToAction: "اكتبوا الإجابة الصحيحة:",
    rows: [{ label: "", answer: 4410, unit: "₪" }],
    correctTitle: "الإجابة صحيحة. أحسنتم.",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    /* VERBATIM, deck slide 38. Both equations had been rewritten: the first
       lost its ش.ج, the second dropped the 90/100 step entirely. Same shape as
       the approved slide-55/56 chain (88% · 500 = 88/100 · 500 = … ش.ج 440). */
    body: [
      "كما ذكرنا، <span dir='ltr'>10%</span> من 4,900 هي 490.",
      "لذلك، سعر الثلاجة بعد الخصم هو:",
      EQ('4900 – 490 = <span class="eq-unit" dir="rtl">4,410 ش.ج</span>'),
      "يمكن أيضاً حساب المبلغ المدفوع بعد الخصم بعملية واحدة:",
      "إذا كان الخصم <span dir='ltr'>10%</span>، فإننا ندفع <span dir='ltr'>90%</span> فقط من السعر، أي:",
      EQ('4,900 · <span dir="ltr">90%</span> = 4,900 · <span class="frac"><span class="frac-num">90</span><span class="frac-den">100</span></span> = <span class="eq-unit" dir="rtl">4,410 ش.ج</span>'),
    ],
    hint: "ما النسبة المئوية من السعر التي تبقى بعد خصم <strong><span dir='ltr'>10%</span>؟</strong>",
  },

  {
    screen: 24,
    set: "W",
    q: 3,
    kind: "viq",
    media: "greenhouse.jpg",
    mediaAlt: "دفيئة تكنولوجية ذكية للزراعة المائية",
    intro: EX_GREENHOUSE,
    callToAction: "اكتبوا الإجابة الصحيحة:",
    rows: [{ label: "أ. بكم لترًا من الماء زاد الطلاب كمية الري الأسبوعية؟", answer: 322, unit: "لترات" }],
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    /* the second method used to sit behind a "המשך" button in the
       popup; it is part of the body now (producer 14.09.26). */
    body: GH_A_BODY.concat([
        "<strong>الطريقة ب:</strong>",
        "إذا حسبنا الزيادة في كمية المياه بمساعدة التحويل من نسبة مئوية إلى كسر نحصل على:",
        EQ('<span dir="ltr">14%</span> · 2300 = <span class="frac"><span class="frac-num">14</span><span class="frac-den">100</span></span> · 2300 = <span class="eq-unit" dir="rtl">322 لترات</span>'),
        "لذلك، زادت كمية المياه بمقدار 322 لترًا.",
    ]),
    hint: "انتبهوا! عليكم أن تحسبوا فقط مقدار الزيادة في كمية المياه الأسبوعية (باللترات).",
  },

  {
    screen: 25,
    set: "W",
    q: 4,
    kind: "viq",
    media: "greenhouse.jpg",
    mediaAlt: "دفيئة تكنولوجية ذكية للزراعة المائية",
    intro: EX_GREENHOUSE,
    callToAction: "اكتبوا الإجابة الصحيحة:",
    rows: [{ label: "ب. احسبوا إجمالي كمية المياه الأسبوعية بعد الزيادة:", answer: 2622, unit: "لترات" }],
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    /* the second method used to sit behind a "המשך" button in the
       popup; it is part of the body now (producer 14.09.26). */
    body: GH_B_BODY.concat([
        "<strong>الطريقة ج:</strong>",
        "نحسب كم تساوي <span dir='ltr'>114%</span> من 2,300 بمساعدة التحويل إلى كسر عشري:",
        EQ("1.14 · 2,300 = 2,622"),
        "الخلاصة: كمية المياه الأسبوعية بعد الزيادة هي 2,622 لترًا.",
    ]),
    hint: "لقد حسبتم الزيادة بالفعل. فكّروا: أي عملية يجب إجراؤها لحساب كمية المياه الجديدة؟",
  },

  {
    screen: 26,
    kind: "transition",
    video: "character-reading.mp4",
    pre: "أنهينا مرحلة التعلّم، وننتقل إلى التدريب الأول وسنجيب عن",
    big: "5 أسئلة",
    mid: "يجب الإجابة بشكل صحيح عن 4 أسئلة على الأقل.",
    cta: "يمكن البدء!",
  },

  {
    screen: 27,
    kind: "story",
    set: "A",
    q: 1,
    media: "telescope.jpg",
    mediaAlt: "تلسكوب فضائي في سماء الليل",
    intro:
      "في إطار مشروع في علم الفلك، تابع طلاب وطالبات مسار العلوم اكتشافات كواكب جديدة.<br>" +
      "في أحد التحديثات على موقع وكالة الفضاء قرؤوا أنه تمت ترقية عدسة تلسكوب الفضاء المركزي،<br>" +
      "وأن الترقية زادت بنسبة <span dir='ltr'>25%</span> عدد الكواكب الجديدة التي يستطيع التلسكوب رصدها.<br>" +
      "بعد الترقية، وصل عدد الكواكب التي اكتُشفت هذا العام إلى 1,250 كوكبًا جديدًا.",
  },

  {
    screen: 28,
    kind: "scq",
    set: "A",
    q: 1,
    /* QA 28.09.26: the two key facts repeat above the question */
    intro:
      "الترقية زادت عدد الكواكب الجديدة بنسبة <span dir='ltr'>25%</span>.<br>" +
      "بعد الترقية، وصل عدد الكواكب الجديدة التي اكتُشفت إلى 1,250.",
    ask: "<strong>1. ما هو عدد الكواكب التي اكتُشفت في السنة التي سبقت الترقية التكنولوجية؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    /* option order is the DECK's, read off the rendered page: 500, 750,
       1,000 (the key), then "לא ניתן לדעת" — producer 14.09.26. */
    opts: ["500 كوكب", "750 كوكب", "1,000 كوكب", "لا يمكن معرفة العدد الأصلي بدون معطيات إضافية"],
    correctId: "c",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: PLANETS_BODY,
    hint: "قيمة <strong><span dir='ltr'>125%</span></strong> معروفة لنا.<br>علينا أن نجد قيمة <strong><span dir='ltr'>100%</span></strong>.",
  },

  {
    screen: 29,
    kind: "viq",
    set: "A",
    q: 2,
    media: "olive-oil-deal.jpg",
    mediaAlt: "عرض خصم <span dir='ltr'>50%</span> على زيت الزيتون",
    intro: EX_OIL,
    callToAction: "اكتبوا الإجابة الصحيحة",
    rows: [
      { label: "<strong>أ. كم سيدفع المشتري مقابل زجاجتي زيت زيتون من إنتاج الجليل؟</strong>", answer: 81, unit: 'ش.ج' },
    ],
    correctTitle: "هذا صحيح!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: OIL_A_BODY,
    hint: "على المنتج <strong>الأول</strong> سيدفع السعر <strong>الكامل</strong>، وعلى المنتج الثاني سيدفع <strong>نصف</strong> السعر الكامل.",
  },

  {
    screen: 30,
    kind: "scq",
    set: "A",
    q: 2,
    intro: EX_OIL,
    media: "olive-oil-deal.jpg",
    mediaAlt: "عرض خصم <span dir='ltr'>50%</span> على زيت الزيتون",
    ask: "<strong>ب. كم ستكون قيمة الخصم (بالشواقل) التي سيحصل عليها المشتري عند شراء زجاجتين من زيت الزيتون من إنتاج الجليل؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ['20 ش.ج', '25 ش.ج', '27 ش.ج', '30 ش.ج'],
    correctId: "c",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: OIL_B_BODY,
    hint: '<strong>انتبهوا – </strong>الحديث عن حساب الخصم بالشاقل (حساب كمّي).',
  },

  {
    screen: 31,
    kind: "scq",
    set: "A",
    q: 2,
    intro: EX_OIL,
    media: "olive-oil-deal.jpg",
    mediaAlt: "عرض خصم <span dir='ltr'>50%</span> على زيت الزيتون",
    ask: "<strong>ج. ما هي نسبة الخصم على الشراء كله؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["20%", "25%", "27%", "30%"],
    correctId: "b",
    correctTitle: "ممتاز جداً!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: OIL_C_BODY,
    hint: "<strong>انتبهوا – </strong>الحديث عن حساب نسبة الخصم – استعينوا بجدول <strong>التناسب.</strong>",
  },

  {
    screen: 32,
    kind: "viq",
    set: "A",
    q: 3,
    bubble: "قبل فترة قصيرة كنت في المسرح وشاهدت مسرحية الأسد الملك!",
    intro:
      "3. في إطار نادي المسرح، يقدّم الطلاب والطالبات مسرحية احتفالية في نهاية العام.<br>" +
      "كجزء من الإكسسوارات، أعدّ الطلاب والطالبات 70 قناعًا مسرحيًا مصمّمًا.<br><br>" +
      "راجع المخرج النص المحدَّث وأعلن أن الحبكة ستتطلب <span dir='ltr'>20%</span> أقنعة أكثر مما أعدّوا.",
    ask: "<strong>ما هو العدد الجديد من الأقنعة المسرحية الذي يجب إعداده؟</strong>",
    callToAction: "اكتبوا الإجابة الصحيحة",
    rows: [{ label: "", answer: 84, unit: "أقنعة" }],
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: MASKS_BODY,
    hint: "<strong>تذكروا</strong> – الزيادة بنسبة <strong><span dir='ltr'>20%</span></strong> تعني <strong><span dir='ltr'>120%</span></strong> من الكمية الأصلية.",
  },

  {
    screen: 33,
    /* producer 04.10: no "המשך" in this feedback — דרך ב and דרך ג are part of
       one body. `.scq-popup` already caps at 520px and scrolls, so a body this
       long scrolls instead of paging. */
    kind: "viq",
    set: "A",
    q: 4,
    bubble: "يا ترى أي صورة<br>خلفية وضعت هديل...",
    intro:
      "4. أرادت هديل رفع صورة خلفية لخادم الديسكورد الخاص بها.<br>" +
      "كان الحجم الأصلي للصورة التي التقطتها هديل 200 بكسل.<br>" +
      "أخبرها التطبيق أن الصورة كبيرة جدًا، وأنه عليها تصغيرها بنسبة <span dir='ltr'>15%</span> لتناسب الشاشة.",
    callToAction: "اكتبوا الإجابات الصحيحة",
    rows: [
      { label: "أ. ما النسبة المئوية من الحجم الأصلي التي بقيت للصورة بعد التصغير بنسبة <span dir='ltr'>15%</span>؟", answer: 85, unit: "%" },
      { label: "ب. ما هو حجم الصورة بعد التصغير؟", answer: 170, unit: "بكسل" },
    ],
    correctTitle: "صحيح!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: TAMAR_BODY.concat([
      "<strong>الطريقة ب:</strong>",
      "نحسب كم تساوي <span dir='ltr'>85%</span> من 200 بكسل (الكمية الكاملة) بمساعدة التحويل إلى كسر عشري:",
      EQ('<span dir="ltr">85%</span> · 200 = <span class="frac"><span class="frac-num">85</span><span class="frac-den">100</span></span> · 200 = 0.85 · 200 = <span class="eq-unit" dir="rtl">170 بكسل</span>'),
      "<strong>الطريقة ج:</strong>",
      "طريقة المثلث:",
      EQ('<span class="frac"><span class="frac-num"><span dir="ltr">85%</span> · 200</span><span class="frac-den"><span dir="ltr">100%</span></span></span> = <span class="eq-unit" dir="rtl">170 بكسل</span>'),
      "الخلاصة: حجم صورة الخلفية بعد التصغير هو 170 بكسل.",
    ]),
    hint: "أ. تذكروا – الكل بالنسبة المئوية هو <span dir='ltr'>100%</span>.<br>ب. احسبوا الكمية المناسبة للنسبة التي حسبتموها في البند أ.",
  },

  {
    screen: 34,
    kind: "dq",
    set: "A",
    q: 5,
    media: "chocolate-cake.jpg",
    mediaAlt: "كعكة شوكولاتة",
    char: "character-looking.png",
    bubble: "الشوكولاتة تُحسّن الكعكة دائمًا!",
    intro:
      "5. يريد كريم أن يخبز كعكة الشوكولاتة الشهيرة الخاصة به لحفلة نهاية العام.<br>" +
      "الوصفة الأصلية مخصصة لقالب صغير وتتطلب 200 غرام شوكولاتة داكنة.<br><br>" +
      "لكي تكفي الكعكة الجميع، يستخدم كريم قالبًا أكبر،<br>" +
      "وعليه أن يزيد كمية الشوكولاتة الداكنة بنسبة <span dir='ltr'>60%</span>.",
    callToAction: "اختاروا الإجابة الصحيحة من القائمة",
    ask: "كم غرامًا من الشوكولاتة الداكنة في الكعكة الأكبر؟",
    opts: ["260", "300", "320"],
    correctId: "320",
    unit: "غرام",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: CAKE_BODY,
    hint: "ما نسبة الشوكولاتة في الكعكة الأكبر؟",
  },

  {
    screen: 35,
    kind: "transition",
    video: "character-boxing.mp4",
    pre: "لا شيء مثل التدريب لتعزيز التعلّم",
    /* producer 04.10: set B really has 4 stations (PR_SETS.B), so the
       transition announces 4 and the pass mark is 3. The deck slide 52 says
       5 / 4 — overridden, same as Set A's 6-vs-5 strip. */
    big: "4 أسئلة",
    mid: "ومنذ البداية يوجد تلميح! أجيبوا بشكل صحيح عن 3 أسئلة أو أكثر لكي تتقدموا.",
    cta: "يمكن البدء!",
  },

  /* ══ practice set B — slides 53-61 ══ */
  {
    screen: 36,
    pages: [
      [
        "<strong>الطريقة ب:</strong>",
        "نحسب كم تساوي <span dir='ltr'>130%</span> من 60 دقيقة (الكمية الكاملة) بمساعدة التحويل إلى كسر عشري:",
        EQ('<span dir="ltr">130%</span> · 60 = <span class="frac"><span class="frac-num">130</span><span class="frac-den">100</span></span> · 60 = 1.3 · 60 = <span class="eq-unit" dir="rtl">78 دقائق</span>'),
      ],
      [
        "<strong>الطريقة ج:</strong>",
        "طريقة المثلث:",
        EQ('<span class="frac"><span class="frac-num">60 · 130</span><span class="frac-den">100</span></span> = 78'),
        "الخلاصة: مدة قائمة التشغيل الجديدة لدى سلمى هي 78 دقيقة.",
      ],
    ],
    kind: "scq",
    set: "B",
    q: 1,
    media: "playlist-phone.jpg",
    mediaAlt: "قائمة تشغيل على الهاتف",
    intro:
      "1. أعدّت سلمى قائمة تشغيل للاستماع خلال الاستراحات في المدرسة.<br>" +
      "في النسخة الأولى كانت قائمة التشغيل تضم أغاني بمدة إجمالية 60 دقيقة (الكل). قبل حفلة نهاية العام، قررت أن تزيد مدة قائمة التشغيل بنسبة <span dir='ltr'>30%</span>.",
    ask: "<strong>كم دقيقة تستمر قائمة التشغيل الجديدة لدى سلمى؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["18 دقيقة", "72 دقيقة", "78 دقيقة", "90 دقيقة"],
    correctId: "c",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "قائمة التشغيل الجديدة لدى سلمى زادت بنسبة <span dir='ltr'>30%</span>،",
      "لذلك أصبح طولها الآن <span dir='ltr'>130%</span> من 60 دقيقة، أي:",
      propTable("النسبة المئوية", "دقائق", [
        ["130%", "?"],
        ["100%", "60"],
      ]),
      EQ('<span dir="ltr">130%</span> · 60 = <span class="frac"><span class="frac-num">130</span><span class="frac-den">100</span></span> · 60 = 1.3 · 60 = <span class="eq-unit" dir="rtl">78 دقائق</span>'),
    ],
    hint: 'زدنا الكل (<span dir="ltr">100%</span>) بنسبة <span dir="ltr">30%</span>، لذلك أصبح حجمه الآن "بلغة النسب المئوية" <span dir="ltr">130%</span>.',
  },

  {
    screen: 37,
    kind: "tags",
    set: "B",
    q: 2,
    intro: '2. يقيم متجر الملابس «ستايل» عرضًا احتفاليًا بمناسبة موسم الانتقال.<br>جميع المنتجات في المتجر تُباع بخصم <span dir="ltr">25%</span>.',
    callToAction: "أكملوا على البطاقات السعر الجديد بعد الخصم",
    rows: [
      { img: "tag-300.png", was: 300, answer: 225 },
      { img: "tag-120.png", was: 120, answer: 90 },
      { img: "tag-60.png", was: 60, answer: 45 },
    ],
    correctTitle: "صحيح جدًا‎!",
    /* the tags question is answered in three fields, so a partly-right answer
       is not simply "wrong" (producer 14.09.26) */
    wrongTitle: "الإجابة ليست صحيحة بالكامل.<br>تظهر الإجابة الكاملة.",
    /* the feedback repeats the three tags with their answers filled in, as the
       deck's own panel does */
    body: [
      "السعر بعد الخصم:",
      TAG_ANSWERS([
        { img: "tag-300.png", was: 300, answer: 225 },
        { img: "tag-120.png", was: 120, answer: 90 },
        { img: "tag-60.png", was: 60, answer: 45 },
      ]),
      '<span class="g-eq" dir="ltr">300 · 75% = 225</span>',
      '<span class="g-eq" dir="ltr">120 · 75% = 90</span>',
      '<span class="g-eq" dir="ltr">60 · 75% = 45</span>',
    ],
    hint: "إذا كان السعر الأصلي <strong><span dir='ltr'>100%</span></strong>، فما النسبة المئوية التي تبقى للدفع بعد خصم <strong><span dir='ltr'>25%</span>؟</strong>",
  },

  {
    screen: 38,
    pages: [
      [
        "<strong>الطريقة ب:</strong>",
        'نحسب كم تساوي <span dir="ltr">88%</span> من 500 ش.ج (الكمية الكاملة) بمساعدة التحويل إلى كسر عشري:',
        EQ('<span dir="ltr">88%</span> · 500 = <span class="frac"><span class="frac-num">88</span><span class="frac-den">100</span></span> · 500 = 0.88 · 500 = <span class="eq-unit" dir="rtl">440 ش.ج</span>'),
      ],
      [
        "<strong>الطريقة ج:</strong>",
        "طريقة المثلث:",
        propTable("النسبة المئوية", "السعر", [
          ["88%", "?"],
          ["100%", "500"],
        ]),
        EQ('<span class="frac"><span class="frac-num">500 · <span dir="ltr">88%</span></span><span class="frac-den"><span dir="ltr">100%</span></span></span> = <span class="eq-unit" dir="rtl">440 ش.ج</span>'),
        'الخلاصة: دفع يوسف 440 ش.ج ثمن الحذاء بعد الخصم.',
      ],
    ],
    kind: "scq",
    set: "B",
    q: 3,
    media: "sport-shoes.jpg",
    mediaAlt: "حذاء رياضي",
    intro:
      '3. أراد يوسف أن يشتري حذاءً رياضيًا شهيرًا كان سعره 500 ش.ج.<br>' +
      "هو يعلم أنه بفضل التسجيل في نادي الأعضاء الرقمي الخاص بالمتجر،<br>يحق له خصم <span dir='ltr'>12%</span> على الحذاء.",
    ask: "أ. <strong>ما النسبة المئوية من السعر الأصلي للحذاء التي يجب على يوسف دفعها عند الصندوق؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["12%", "50%", "88%"],
    correctId: "c",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "حصل يوسف على خصم <span dir='ltr'>12%</span> على سعر الحذاء",
      "لذلك دفع فقط <span dir='ltr'>88%</span> من سعر الحذاء",
      EQ("(100% - 12% = 88%)"),
    ],
    hint: "ما النسبة التي تبقى للدفع عندما نطرح <strong><span dir='ltr'>12%</span></strong> من <strong><span dir='ltr'>100%</span>؟</strong>",
  },

  {
    screen: 39,
    kind: "scq",
    set: "B",
    q: 3,
    media: "sport-shoes.jpg",
    mediaAlt: "حذاء رياضي",
    intro:
      '3. أراد يوسف أن يشتري حذاءً رياضيًا شهيرًا كان سعره 500 ش.ج.<br>' +
      "هو يعلم أنه بفضل التسجيل في نادي الأعضاء الرقمي الخاص بالمتجر،<br>يحق له خصم <span dir='ltr'>12%</span> على الحذاء.",
    ask: "<strong>ب. ادّعى يوسف أنه بعد الخصم سيدفع ثمن الحذاء أقل من ⁦₪400⁩.<br>هل يوسف محق؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["نعم", "لا", "لا يمكن التحديد"],
    correctId: "b",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "خصم <span dir='ltr'>12%</span> يعني دفع <span dir='ltr'>88%</span>.",
      "<span dir='ltr'>88%</span> من 500 هي:",
      EQ('<span dir="ltr">88%</span> · 500 = <span class="frac"><span class="frac-num">88</span><span class="frac-den">100</span></span> · 500 = 0.88 · 500 = <span class="eq-unit" dir="rtl">440 ش.ج</span>'),
      "الخلاصة: يوسف مخطئ، سيدفع ثمن الحذاء أكثر من ⁦₪400⁩.",
    ],
    hint: 'خصم <span dir="ltr">12%</span> يعني دفع <span dir="ltr">___ %</span>.',
  },

  {
    screen: 40,
    kind: "scq",
    set: "B",
    q: 4,
    media: "basketball-team.jpg",
    mediaAlt: "منتخب كرة السلة المدرسي",
    intro:
      "4. أراد طلاب كثيرون الانضمام إلى منتخب كرة السلة في المدرسة.<br>" +
      "قرر المدرب منح فرصة لمزيد من اللاعبين.<br>" +
      "وزاد عدد اللاعبين في المنتخب بنسبة <span dir='ltr'>40%</span>.<br>في الفريق الأصلي كان هناك 15 لاعبًا.",
    ask: "<strong>أ. ما النسبة المئوية التي تمثل حجم المنتخب الجديد؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["100%", "140%", "40%", "60%"],
    correctId: "b",
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: ["المنتخب الجديد زاد بنسبة <span dir='ltr'>40%</span>", "لذلك حجمه بالنسبة المئوية الآن هو <span dir='ltr'>140%</span>", EQ("(100% + 40% = 140%)")],
    hint: 'الحديث عن <strong>زيادة</strong> بنسبة <span dir="ltr">40%</span> – كم نسبة أُضيفت «بلغة النسب المئوية»؟',
  },

  {
    screen: 41,
    kind: "viq",
    set: "B",
    q: 4,
    media: "basketball-team.jpg",
    mediaAlt: "منتخب كرة السلة المدرسي",
    intro:
      "4. أراد طلاب كثيرون الانضمام إلى منتخب كرة السلة في المدرسة.<br>" +
      "قرر المدرب منح فرصة لمزيد من اللاعبين.<br>" +
      "وزاد عدد اللاعبين في المنتخب بنسبة <span dir='ltr'>40%</span>.<br>في الفريق الأصلي كان هناك 15 لاعبًا.",
    callToAction: "اكتبوا الإجابات الصحيحة",
    rows: [
      { label: "<strong>ب. </strong>كم طالبًا يلعبون في منتخب كرة السلة الموسَّع؟", answer: 21, unit: "" },
      { label: "<strong>ج. </strong>بكم لاعبًا زاد الفريق؟", answer: 6, unit: "" },
    ],
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "ب. لحساب عدد اللاعبين في المنتخب الموسَّع نحسب كم تساوي <span dir='ltr'>140%</span> من 15 (الكمية الكاملة):",
      EQ('<span dir="ltr">140%</span> · 15 = <span class="frac"><span class="frac-num">140</span><span class="frac-den">100</span></span> · 15 = <span class="eq-unit" dir="rtl">21 لاعبين</span>'),
      "ج. في الفريق الأصلي كان هناك 15 لاعبًا. وجدنا أن في الفريق الموسَّع 21 لاعبًا.",
      "الخلاصة: زاد الفريق بمقدار 6 لاعبين.",
    ],
    hint: "الزيادة بنسبة <span dir='ltr'>40%</span> تعني أن الكمية الجديدة هي <span dir='ltr'>140%</span> من الكمية الأصلية.",
  },

  {
    screen: 42,
    kind: "transition",
    video: "character-climbing.mp4",
    pre: "عمل رائع!",
    big: "إليكم تمرينين آخرين بمستوى صعوبة أعلى",
    mid: "",
    cta: "متابعة",
    bubbleLine: "أنا متأكد أنكم ستنجحون!",
  },

  {
    screen: 43,
    kind: "scq",
    set: "F",
    q: 1,
    zoom: true,
    media: "football-pitch.jpg",
    mediaAlt: "ملعب كرة قدم مصغّرة في الحي",
    intro:
      "1. قررت البلدية تجديد ملعب كرة القدم المصغّرة في الحي.<br>" +
      "الملعب الحالي على شكل مستطيل طوله 50 مترًا وعرضه 20 مترًا.<br>" +
      "في إطار التجديد، تقرر زيادة طول الملعب بنسبة <span dir='ltr'>20%</span> وعدم تغيير<br>عرض الملعب.",
    ask: "<strong>بكم بالمئة زادت مساحة الملعب بعد التغيير؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["زادت بنسبة <span dir='ltr'>20%</span>", "انخفضت بنسبة <span dir='ltr'>20%</span>", "زادت بنسبة <span dir='ltr'>50%</span>", "انخفضت بنسبة <span dir='ltr'>50%</span>"],
    correctId: "a",
    correctTitle: "إجابتكم صحيحة وهذا رائع، فهذا سؤال مركّب",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      'طول الملعب المستطيل 50 م وعرضه 20 م، لذلك مساحة الملعب هي: <span dir="ltr">50 · 20 = <span class="eq-unit" dir="rtl">1000 م²</span></span>.',
      "زيادة الطول بنسبة 20٪ لذلك الآن الطول بالنسبة المئوية هو 120٪ من الطول السابق.",
      'لنحسب كم يساوي <span dir="ltr">120%</span> من 50: <span dir="ltr">120% · 50 = 1.2 · 50 = <span class="eq-unit" dir="rtl">60 متر</span></span>',
      'لذلك مساحة الملعب بعد زيادة الطول هي: <span dir="ltr">60 · 20 = <span class="eq-unit" dir="rtl">1200 م²</span></span>',
      'الخلاصة: مساحة الملعب <strong>زادت بمقدار 200 م²</strong> <span class="eq-keep">= 1000 م² – 1200 م².</span>',
      "نحسب <strong>بكم نسبة مئوية</strong> زاد مساحة الملعب:",
      "لهذا نستخدم جدول النسبة:",
      propTable("النسبة المئوية", 'مساحة الملعب (م²)', [
        ["x", "200"],
        ["100%", "1000"],
      ]),
      'سنبني معادلة النسبة: <span dir="ltr"><span class="frac"><span class="frac-num">200</span><span class="frac-den">1000</span></span> = <span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span></span>',
      'سنضرب في المقام المشترك ونحصل على: <span dir="ltr">10x = 200</span>',
      'نقسم على 10 ونحصل على: <span dir="ltr">x = 20</span>',
      "الخلاصة: زاد مساحة الملعب بنسبة <span dir='ltr'>20%</span> (الإجابة أ صحيحة).",
    ],
    hint: 'احسبوا أولًا بكم م² زادت مساحة الملعب، ثم استعينوا بجدول التناسب لإيجاد نسبة الزيادة.',
  },

  {
    screen: 44,
    kind: "mcq",
    set: "F",
    q: 2,
    intro: '2. أميرة تؤكد:<br>"إذا زدت عدداً بنسبة <span dir="ltr">50%</span>، فأنا ببساطة أضيف إليه 50".',
    ask: "<strong>هل أميرة محقة؟</strong>",
    callToAction: "ضعوا علامة على <strong>جميع</strong> الجمل الصحيحة",
    opts: [
      "العبارة خاطئة لأنه إذا كان الرقم مثلاً 80 فإن <span dir='ltr'>50%</span> منه يساوي 40 وبالتالي يجب أن نضيف 40 وليس 50.",
      "أمير خاطئة، النسبة المئوية والكمية هما قيمتان مختلفتان.",
      "تصريح خاطئ، إذا زدنا عددًا بنسبة <span dir='ltr'>50%</span> فهذا يعني إضافة 50 للعدد.",
      "تصريح خاطئ، إضافة <span dir='ltr'>50%</span> إلى رقم هي إضافة نصفه وهذه الإضافة ليست دائماً 50.",
    ],
    correctIds: ["a", "b", "d"],
    correctTitle: "أنتم محقون!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "<strong>الادعاء أ </strong>يعرض مثالاً حيث الرقم هو 80 وليس 100، لذلك فإن <span dir='ltr'>50%</span> منه هو 40 وليس 50.",
      "<strong>خلاصة:</strong> الادعاء أ يشرح بشكل جيد جداً لماذا القول غير صحيح، وبالتالي فهذا ادعاء صحيح.",
      "<strong>ادعاء ب</strong> يقول بطريقة عامة أن النسبة المئوية والكمية هما قيمتان مختلفتان.",
      "<strong>الخلاصة: </strong>هذا ادعاء صحيح لأنّ النسبة المئوية تُحسب دائماً كجزء من كمية.",
      /* was a second popup page behind a "המשך" button — merged into the
         body so the panel has no continue of its own (producer 14.09.26) */
        "<strong>الادعاء ج </strong>هو ادعاء خاطئ لأن قيمة <span dir='ltr'>50%</span> ليست دائمًا 50. على سبيل المثال، <span dir='ltr'>50%</span> من 200 هي 100.",
        "<strong>الادعاء د</strong> تقول إن إضافة <span dir='ltr'>50%</span> هي إضافة نصف العدد. هذه الإضافة ليست دائماً 50، كما شرحنا في الأقسام السابقة.",
        "<strong>نتيجة:</strong> الادعاءات أ، ب، د هي ادعاءات صحيحة.",
    ],
    hint: "حاولوا اتباع طريقة أميرة عندما يكون الرقم 60 مثلاً.<br>هل أميرة على حق؟",
  },

  /* ══ class task + advanced practice — slides 63-77 ══ */
  {
    screen: 45,
    kind: "transition",
    video: "character-rubik.mp4",
    pre: "لقد أكملت التمرين بنجاح - ممتاز!",
    big: "وقت رائع للتعلم بطريقة مختلفة أيضاً",
    mid: "لأن التعلّم يحدث في أشكال مختلفة.",
    cta: "متابعة",
  },

  {
    screen: 46,
    kind: "task",
    char: "character-looking.png",
    bubble: "واو عندكم الكثير من<br>المقاعد في المدرسة!",
    intro:
      "في ساحة المدرسة الإعدادية موزعة مقاعد جلوس.<br>" +
      "مدير المدرسة راضٍ عن استخدام المقاعد ويخطط لزيادة عددها بنسبة <span dir='ltr'>25%</span>.<br>" +
      "(إذا لم يكن عدد المقاعد قابلاً للقسمة على 4، فقرّبوا لأعلى إلى مقعد كامل).",
    rows: [
      { label: "أ. توجهوا إلى الفناء وعدّوا عدد مقاعد الجلوس" },
      { label: "ب. احسبوا كم مقعدًا يجب على المدير أن يضيف ليزداد عدد المقاعد بنسبة <span dir='ltr'>25%</span>" },
      { label: "ج. كم عدد مقاعد الجلوس التي ستكون في الفناء بعد زيادة الكمية؟" },
    ],
  },

  {
    screen: 47,
    kind: "transition",
    video: "character-cube.mp4",
    pre: "",
    big: "وقت ل - 5 أسئلة متقدمة",
    mid: "وهناك المزيد من المفاجآت الممتعة...",
    noteAfter: "(هذا يعني أننا تقدّمنا في المستوى 🙂)",
    cta: "يمكن البدء!",
  },

  {
    screen: 48,
    kind: "viq",
    set: "C",
    q: 1,
    zoom: true,
    media: "garden-plan.png",
    mediaAlt: "رسم حديقة المدينة العامة",
    intro:
      "في البلدية، تم الاقرار بتوسيع حديقة عامة مستطيلة الشكل.<br>" +
      "كان طول الحديقة 40 م وعرضها 20 م.<br>" +
      "في إطار الإصلاح، زادوا الطول بنسبة <span dir='ltr'>25%</span> وقللوا العرض بنسبة <span dir='ltr'>25%</span>.<br>" +
      'أعلنت البلدية على موقعها الرسمي: "لم تتغير مساحة الحديقة".',
    callToAction: "<strong>لنتحقق من ادعاء البلدية:</strong>",
    rows: [{ label: "أ. احسبوا مساحة الحديقة قبل الإصلاح:", answer: 800, unit: 'م²' }],
    correctTitle: "أحسنت!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    bodyWrong: [
      "طول الحديقة كان 40 م وعرضها 20 م، لذلك مساحة الحديقة هي:",
      EQ('40 · 20 = <span class="eq-unit" dir="rtl">800 م²</span>'),
    ],
    body: [
      "طول الحديقة كان 40 م وعرضها 20 م، لذلك مساحة الحديقة هي:",
      EQ('40 · 20 = <span class="eq-unit" dir="rtl">800 م²</span>'),
    ],
    hint: "مساحة حديقة مستطيلة تُحسب بالصيغة: الطول × العرض.",
  },

  {
    /* deck slide 66 — part ב on its own screen (new pptx, 14.09.26) */
screen: 49,
    kind: "viq",
    set: "C",
    q: 1,
    zoom: true,
    media: "garden-plan.png",
    mediaAlt: "مخطط الحديقة العامة",
    intro:
      "في البلدية، تم الاتفاق على توسيع حديقة عامة مستطيلة الشكل.<br>" +
      "طول الحديقة كان 40 م وعرضها 20 م.<br>" +
      "في إطار عملية الترميم، زادوا الطول بنسبة <span dir='ltr'>25%</span> وقللوا العرض بنسبة <span dir='ltr'>25%</span>.<br>" +
      'أعلنت البلدية على موقعها الإلكتروني: "لم تتغيّر مساحة الحديقة".',
    callToAction: "<strong>دعونا نتحقق من ادعاء البلدية:</strong>",
    rows: [{ label: "ب. احسبوا مساحة الحديقة بعد الترميم:", answer: 750, unit: 'م²' }],
    correctTitle: "أحسنت!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    bodyWrong: [
      "زادوا طول الحديقة بـ <span dir='ltr'>25%</span> لذلك الآن طولها هو <span dir='ltr'>125%</span> من 40 م وهي:",
      EQ('<span dir="ltr">125%</span> · 40 = <span class="frac"><span class="frac-num">125</span><span class="frac-den">100</span></span> · 40 = 1.25 · 40 = <span class="eq-unit" dir="rtl">50 متراً</span>'),
      "قللوا عرض الحديقة بنسبة <span dir='ltr'>25%</span> لذلك الآن عرضها هو <span dir='ltr'>75%</span> من 20 م وهو:",
      EQ('<span dir="ltr">75%</span> · 20 = <span class="frac"><span class="frac-num">75</span><span class="frac-den">100</span></span> · 20 = 0.75 · 20 = <span class="eq-unit" dir="rtl">15 متراً</span>'),
      "بعد التغيير، مساحة الحديقة هي:",
      EQ('50 · 15 = <span class="eq-unit" dir="rtl">750 م²</span>'),
    ],
    body: [
      "زادوا طول الحديقة بنسبة <span dir='ltr'>25%</span> لذلك الآن طولها هو <span dir='ltr'>125%</span> من 40 متر وهو:",
      EQ('<span dir="ltr">125%</span> · 40 = <span class="frac"><span class="frac-num">125</span><span class="frac-den">100</span></span> · 40 = 1.25 · 40 = <span class="eq-unit" dir="rtl">50 متراً</span>'),
      "قللوا عرض الحديقة بنسبة <span dir='ltr'>25%</span> لذلك الآن عرضها هو <span dir='ltr'>75%</span> من 20 م' وهي:",
      EQ('<span dir="ltr">75%</span> · 20 = <span class="frac"><span class="frac-num">75</span><span class="frac-den">100</span></span> · 20 = 0.75 · 20 = <span class="eq-unit" dir="rtl">15 متراً</span>'),
      "بعد التغيير، مساحة الحديقة هي:",
      EQ('50 · 15 = <span class="eq-unit" dir="rtl">750 م²</span>'),
    ],
    hint: "يجب زيادة الطول بنسبة <span dir='ltr'>25%</span> وتقليل العرض بنسبة <span dir='ltr'>25%</span> ثم فقط حساب المساحة.",
  },

  {
    screen: 50,
    /* producer 04.10: no "המשך" here — the second page is part of one body, the
       panel scrolls, and `SCROLL_GATED` holds שנמשיך? until it is read to the end. */
    kind: "scq",
    set: "C",
    q: 1,
    zoom: true,
    media: "garden-plan.png",
    mediaAlt: "رسم الحديقة العامّة",
    intro:
      "في البلدية، تقرر توسيع حديقة عامة مستطيلة الشكل.<br>" +
      "كان طول الحديقة 40 م وعرضها 20 م.<br>" +
      "في إطار التجديد، زادوا الطول بنسبة <span dir='ltr'>25%</span> وقللوا العرض بنسبة <span dir='ltr'>25%</span>.",
    ask: '<strong>ج. وجدنا أن مساحة الحديقة انخفضت (من 800 م² إلى 750 م²)، لذلك كان إعلان البلدية مضللًا.<br>بكم بالمئة انخفضت المساحة؟</strong>',
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["12%", "15%", "6.25%"],
    correctId: "c",
    correctTitle: "ممتاز جداً!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      'مساحة الحديقة انخفضت بمقدار 50 م².',
      'نحسب كم بالمئة تساوي 50 م² من 800 م².',
      "استخدمنا جدول النسبة:",
      propTable("النسبة المئوية", 'مساحة الحديقة (م²)', [
        ["x", "50"],
        ["100%", "800"],
      ]),
      "سنبني معادلة التناسب:",
      EQ('<span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">50</span><span class="frac-den">800</span></span>'),
      "سنضرب بالمقام المشترك 800 ونحصل على:",
      EQ("8x = 50"),
      "نقسم على 8 فنحصل على:",
      EQ("x = 6.25"),
      "الخلاصة: مساحة الحديقة صغرت بنسبة <span dir='ltr'>6.25%</span>.",
      "<strong>البند ب:</strong>",
      "عرض الحديقة كان 20 م وتم تقليله بنسبة <span dir='ltr'>25%</span> وبالتالي العرض الجديد بالنسبة المئوية هو <span dir='ltr'>75%</span>. سنحسب العرض الجديد بالأمتار باستخدام جدول النسبة:",
      propTable("النسبة المئوية", "الطول (م')", [["75%", "?"], ["100%", "20 م"]]),
      EQ('<span class="frac"><span class="frac-num"><span dir="ltr">75%</span> · 20</span><span class="frac-den"><span dir="ltr">100%</span></span></span> = <span class="eq-unit" dir="rtl">15 متر</span>'),
      "تلقينا أن عرض الملعب بعد الانخفاض هو 15 م.",
      "لذلك، مساحة الحديقة بعد التجديد هي:",
      /* deck writes 50·17 here — a slip, the width just computed is 15 */
      EQ('50 · 15 = <span class="eq-unit" dir="rtl">750 م²</span>'),
      "<strong>البند ج:</strong>",
      'صحيح، مساحة الحديقة انخفضت من 800 م² إلى 750 م²، لذلك إعلان البلدية غير دقيق.',
    ],
    hint: "استعينوا بجدول التناسب.",
  },

  {
    screen: 51,
    kind: "viq",
    set: "C",
    q: 2,
    media: "carpet.jpg",
    mediaAlt: "سجادة مستطيلة",
    intro:
      'شركة "سجادة السحر" أطلقت حملة مبيعات جديدة وأعلنت:<br>' +
      '«زدنا طول السجادة بنسبة <span dir="ltr">10%</span> وعرضها بنسبة <span dir="ltr">10%</span>!»<br>' +
      "الشركة تصنع سجادة مستطيلة طولها 2 متر وعرضها 1.5 متر.<br>" +
      "بأي نسبة مئوية زادت مساحة السجادة بعد زيادة طولها وعرضها؟",
    callToAction: "اكتبوا الإجابة الصحيحة",
    rows: [{ label: "", answer: 21, unit: "%" }],
    correctTitle: "صحيح جدًا‎!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "أولاً يجب أن نحسب مساحة السجادة قبل التغييرات:",
      "مساحة السجادة المستطيلة تُحسب بـ <strong>الطول × العرض</strong> لذلك، مساحة السجادة قبل التغييرات هي:",
      EQ('2 · 1.5 = <span class="eq-unit" dir="rtl">3 م²</span>'),
      "زادوا طول السّجادة بنسبة <span dir='ltr'>10%</span> لذلك الآن طولها هو <span dir='ltr'>110%</span> من 2 م وهي:",
      EQ('<strong><span dir="ltr">110%</span> · 2 = 1.1 · 2 = <span class="eq-unit" dir="rtl">2.2 متر</span></strong>'),
      "كما زادوا عرض السجادة بنسبة <span dir='ltr'>10%</span> لذلك الآن عرض السجادة هو <span dir='ltr'>110%</span> من 1.5 م وهو:",
      EQ('<span dir="ltr">110%</span> · 1.5 = 1.1 · 1.5 = <span class="eq-unit" dir="rtl">1.65 متر</span>'),
      "<strong>مساحة السجادة بعد التغييرات هي:</strong>",
      EQ('2.2 · 1.65 = <span class="eq-unit" dir="rtl">3.63 م²</span>'),
      '<strong>مساحة السجادة زادت بمقدار 0.63 م²</strong> <span dir="ltr">(3.63 - 3 = 0.63)</span>.',
      "استخدم جدول التناسب لحساب النسبة المئوية التي زاد بها المساح:",
      propTable("النسبة المئوية", 'المساحة (م²)', [
        ["x", "0.63"],
        ["100%", "3"],
      ]),
      "سنبني معادلة النسبة:",
      EQ('<span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">0.63</span><span class="frac-den">3</span></span>'),
      "سنضرب في المقام المشترك 300 فنحصل على:",
      EQ("3x = 63"),
      "نقسم على 3 ونحصل على:",
      EQ("x = 21"),
      "<strong>الخلاصة: زادت مساحة السجادة بنسبة <span dir='ltr'>21%</span>.</strong>",
    ],
    hint: "احسبوا المساحة قبل التغيير وبعد التغيير واستعينوا بجدول التناسب لاكتشاف نسبة التغيير.",
  },

  {
    screen: 52,
    kind: "mcq",
    set: "C",
    q: 3,
    media: "calculator-diary.jpg",
    mediaAlt: "حاسبة علمية ودفتر سنوي",
    intro:
      "3. اشترى طارق من متجر أدوات كتابة آلة حاسبة علمية ودفتر سنوي.<br>" +
      "الآلة الحاسبة العلمية تُباع بخصم <span dir='ltr'>66%</span> واليوميات تُباع بخصم <span dir='ltr'>15%</span>.<br>" +
      "في الصندوق، اكتشف أنه على كل منتج من المنتجات حصل على خصم بنفس المبلغ (بالشواقل).",
    ask: "<strong>أ. هل هذا ممكن؟</strong>",
    callToAction: "علّموا <strong>جميع</strong> الجمل الصحيحة",
    /* order + key from the RENDERED deck page (slide 70's green marks):
       correct = "יכולים לתת זהים" and "כנראה אם מחיר המחשבון גבוה…".
       QA 28.09.26: the deck's first option ("חייבים לתת סכומי הנחה שונים")
       was dropped, so the key letters shifted to א, ג. */
    opts: [
      "من الممكن أن تعطي نسب خصم مختلفة على أسعار مختلفة نفس مبالغ الخصم بالشاقل.",
      "قد يكون صحيحاً أنه إذا كان السعر الأصلي للمنتجين متساوياً، فإن مجموع الخصم سيكون متساوياً.",
      "قد يكون هذا صحيحًا، فإذا كان السعر الأصلي للآلة الحاسبة أعلى من سعر اليوميّة وكانت هناك خصومات أعلى عليها، فإن مبلغ الخصم قد يكون متساويًا فيهما.",
    ],
    correctIds: ["a", "c"],
    correctTitle: "أنتم محقون!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "الإجابات الصحيحة هي أ، ج.",
      "السعر بعد تطبيق نسبة خصم عالية على سعر مرتفع يمكن أن يكون مساويًا للسعر بعد تطبيق نسبة خصم منخفضة على سعر منخفض.",
    ],
    hint: "تذكروا، يتم حساب نسب الخصم من سعر المنتج.",
  },

  {
    screen: 53,
    kind: "viq",
    set: "C",
    q: 3,
    media: "calculator-diary-2.jpg",
    mediaAlt: "آلة حاسبة علمية ودفتر يوميات سنوي",
    intro:
      "3. اشترى طارق من متجر الأدوات المكتبية آلة حاسبة علمية ودفتر سنوي.<br>" +
      "الآلة الحاسبة العلمية تُباع بخصم <span dir='ltr'>66%</span> واليوميات تُباع بخصم <span dir='ltr'>15%</span>.",
    ask: "<strong>ب. إذا كان السعر الذي دفعه طارق على كل منتج هو ⁦₪170⁩.<br>كم كان سعر كل منتج قبل الخصم؟</strong>",
    callToAction: "اكتبوا الإجابات الصحيحة",
    rows: [
      { label: "سعر الآلة الحاسبة الأصلي:", answer: 500, unit: 'ش.ج' },
      { label: "اليوميات ارتفعت:", answer: 200, unit: 'ش.ج' },
    ],
    correctTitle: "أبطال!!!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "طارق دفع فقط ⁦₪170⁩ مقابل الحاسبة بعد خصم بنسبة <span dir='ltr'>66%</span> من سعر الحاسبة، لذلك: <span dir='ltr'>34%</span> من سعر الحاسبة هي ⁦₪170⁩ ويمكننا الحساب باستخدام جدول التناسب:",
      propTable("النسبة المئوية", "السعر", [
        ["34%", "170"],
        ["100%", "x"],
      ]),
      "سنبني معادلة التناسب:",
      EQ('<span class="frac"><span class="frac-num">170</span><span class="frac-den">x</span></span> = <span class="frac"><span class="frac-num">34</span><span class="frac-den">100</span></span>'),
      "سنضرب بالمقام المشترك 100x فنحصل على:",
      EQ("34x = 17000"),
      "نقسم على 34 ونحصل على:",
      EQ("x = 500"),
      "<strong>النتيجة: سعر الآلة الحاسبة العلمية هو ⁦₪500⁩.</strong>",
      "بطريقة مشابهة، دفع طارق ⁦₪170⁩ مقابل اليوميات بعد تطبيق خصم بنسبة <span dir='ltr'>15%</span> من سعر اليوميات، لذلك: <span dir='ltr'>85%</span> من سعر اليوميات هي ⁦₪170⁩ ويمكننا الحساب بمساعدة جدول النسبة:",
      propTable("النسبة المئوية", "السعر", [
        ["85%", "170"],
        ["100%", "x"],
      ]),
      EQ('<span class="frac"><span class="frac-num">170</span><span class="frac-den">x</span></span> = <span class="frac"><span class="frac-num">85</span><span class="frac-den">100</span></span>'),
      EQ("85x = 17000"),
      EQ("x = 200"),
      "<strong>النتيجة: سعر اليوميّة هو ⁦₪200⁩.</strong>",
    ],
    hint: "لاحظوا - المبلغ ⁦₪170⁩ هو بعد الخصم.",
  },

  {
    screen: 54,
    kind: "scq",
    set: "C",
    q: 4,
    media: "mars-probe.jpg",
    mediaAlt: "مسبار بحث على سطح المريخ",
    intro: "4. قوة الجاذبية على سطح كوكب المريخ أضعف بنسبة <span dir='ltr'>62%</span> مقارنة بالأرض.",
    ask: '<strong>أ. مسبار بحثي تابع لناسا يزن 450 كيلوغرامًا على الأرض،<br>ما وزنه على سطح المريخ؟</strong>',
    callToAction: "اكتبوا الإجابة الصحيحة",
    opts: ['171 كغ', '243 كغ', '279 كغ', '388 كغ'],
    correctId: "a",
    correctTitle: "إجابة صحيحة!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "قوة الجاذبية على المريخ أضعف بنسبة <span dir='ltr'>62%</span> مقارنة بالأرض.",
      "لذلك سيكون وزن جسم الروبوت على المريخ <span dir='ltr'>38%</span> من وزنه على الأرض.",
      EQ("(100% - 62% = 38%)"),
      'الخلاصة: إذا كان المسبار يزن 450 كغ على الأرض، فسيزن:',
      EQ('<span dir="ltr">38%</span> · 450 = <span class="frac"><span class="frac-num">38</span><span class="frac-den">100</span></span> · 450 = <span class="eq-unit" dir="rtl">171 كغ</span>'),
      "على المريخ.",
    ],
    hint: "إذا انخفض وزن جسم بنسبة <span dir='ltr'>62%</span>، فما النسبة المئوية من الوزن الأصلي التي تبقى؟",
  },

  {
    screen: 55,
    kind: "viq",
    set: "C",
    q: 4,
    media: "mars-probe.jpg",
    mediaAlt: "مسبار أبحاث على سطح المريخ",
    intro:
      "4. رائد فضاء يرتدي بدلة فضاء ثقيلة يزن <strong>على سطح المريخ</strong>،<br>" +
      "وأظهرت ميزان الوزن 76 كيلوغرام.<br>" +
      "(تذكّروا: قوة الجاذبية على سطح كوكب المريخ أضعف بنسبة <span dir='ltr'>62%</span> مقارنة بالأرض).",
    callToAction: "<strong>أكملوا البيانات الناقصة:</strong>",
    rows: [
      {
        label: "<strong>ب. الوزن الإجمالي للرائد الفضائي (مع البدلة) على سطح الأرض هو:</strong>",
        answer: 200,
        unit: 'كغ',
      },
    ],
    correctTitle: "إجابة صحيحة، برافو عليك!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      'وزن رائد الفضاء الذي يرتدي بدلة فضاء ثقيلة على المريخ هو 76 كغ. هذا الوزن هو <span dir="ltr">38%</span> من وزنه على الأرض.',
      "استخدم جدول النسبة لإيجاد وزنه على الأرض:",
      propTable("النسبة المئوية", 'الوزن (كغ)', [
        ["38%", "76"],
        ["100%", "x"],
      ]),
      "لنبني معادلة النسبة:",
      EQ('<span class="frac"><span class="frac-num">76</span><span class="frac-den">x</span></span> = <span class="frac"><span class="frac-num">38</span><span class="frac-den">100</span></span>'),
      "سنضرب في المقام المشترك (100x) ونحصل على:",
      EQ("38x = 7600"),
      "نقسم على 38 ونحصل على:",
      EQ("x = 200"),
      'الخلاصة: الوزن الكلي لرائد الفضاء (مع البدلة) على الأرض هو 200 كغ.',
    ],
    hint: 'انتبهوا إلى أن الوزن المعطى لكم (76 كغ) هو الوزن على المريخ، أي: بعد الانخفاض.',
  },

  {
    screen: 56,
    kind: "story",
    set: "C",
    q: 5,
    media: "cheese.jpg",
    mediaAlt: "قطعة جبنة مالحة",
    intro:
      "5. يُنتج مصنع ألبان أنواعًا مختلفة من الأجبان، ويحرص على وضع بيانات غذائية دقيقة من أجل المستهلكين.<br><br>" +
      "ينتج المصنع قطعة <strong>جبنة مالحة كلاسيكية</strong> وزنها 250 غرامًا، وتحتوي على <strong><span dir='ltr'>12%</span> دهون</strong>.<br><br>" +
      "قبيل عيد الأسابيع (شفوعوت) طوّر المصنع <strong>نسخة خاصة</strong> من الجبنة، وهي أيضًا في قطعة وزنها 250 غرامًا، " +
      "وتزيد فيها كمية الدهون <strong>بمقدار 14 غرامًا</strong> عمّا في الجبنة الكلاسيكية.",
  },

  {
    screen: 57,
    kind: "scq",
    set: "C",
    q: 5,
    media: "cheese.jpg",
    mediaAlt: "كتلة جبن مملحة",
    ask: "<strong>ما نسبة الدهون في الجبن الخاص؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["17.6%", "20%", "20.6%", "30%"],
    correctId: "a",
    correctTitle: "أحسنت!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "في الكتلة الكلاسيكية من الجبن يوجد 250 غرام تحتوي على <span dir='ltr'>12%</span> دهون.",
      "دعونا نحسب كمية الدهون في الجبنة الكلاسيكية:",
      EQ('<span dir="ltr">12%</span> · 250 = <span class="frac"><span class="frac-num">12</span><span class="frac-den">100</span></span> · 250 = <span class="eq-unit" dir="rtl">30 غرام</span>'),
      "كمية الدهون في قطعة الجبن الخاصة أكبر بـ 14 غرام من كمية الدهون في الجبن الأصلية، لذلك كمية الدهون في الجبن الخاصة هي:",
      EQ('<span class="eq-unit" dir="rtl">30 غرام</span> + <span class="eq-unit" dir="rtl">14 غرام</span> = <span class="eq-unit" dir="rtl">44 غرام</span>'),
      "نحسب النسبة المئوية التي تمثلها 44 غرام من أصل 250 غرام باستخدام جدول التناسب:",
      propTable("النسبة المئوية", "الوزن (غرام)", [
        ["x", "44"],
        ["100%", "250"],
      ]),
      "سنبني معادلة التناسب:",
      EQ('<span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">44</span><span class="frac-den">250</span></span>'),
      "سنضرب في المقام المشترك:",
      EQ("250x = 4400"),
      "ونحصل على:",
      EQ("x = 17.6"),
      "لذلك، نسبة الدهون في الجبن الخاص هي <span dir='ltr'>17.6%</span>.",
    ],
    hint: "احسبوا أولاً <strong>كمية الدهون</strong> في الجبن الكلاسيكي.",
  },

  {
    screen: 58,
    kind: "transition",
    video: "character-challenge.mp4",
    pre: "كلّ الاحترام!",
    big: "الآن يأتي السؤال الأهم",
    mid: "فيها 4 بنود. يجب أن تنجحوا في 3 على الأقل.",
    cta: "متابعة",
    note: "إذا لم تنجحوا في الإجابة عن بعض الأسئلة،<br>فمن المهم أن تفهموا ما الذي لا يزال غير واضح، وأن تتوجهوا إلى الدردشة أو إلى المعلّم للحصول على شرح إضافي.",
  },

  /* ══ peak question (slides 78-82) — ONE scroll screen: each pptx slide is a
     full-height section, each question carries its own צדקתי? and inline
     feedback, and Continue opens only when all four are answered AND the
     learner reached the end (approved scroll policy) ══ */
  {
    screen: 59,
    kind: "scrollset",
    title: "سؤال تحد",
    sections: [
      {
        kind: "story",
        char: "character-looking.png",
        bubble: "أي عرض رائع!",
        intro:
          "مع اقتراب نهاية العام الدراسي، أعلن مجلس الطلاب في المدرسة عن عرض ترويجي في الكافتيريا:<br>" +
          '🌟 "خصم ضخم بنسبة <span dir="ltr">25%</span> على جميع المنتجات الغذائية والمشروبات في الكشك!" 🌟<br><br>' +
          'من المعروف أن سعر الساندويتش في الكافتيريا بعد تطبيق خصم العرض كان بالضبط 15 ش.ج.',
      },

      {
        kind: "scq",
        optHtml: true,
        ask: "<strong>أ. أي من جداول النسبة التالية تمثل الطريقة الصحيحة للعثور على السعر الأصلي (بالشواقل) للساندويتش قبل الخصم؟</strong>",
        callToAction: "اختاروا الإجابة الصحيحة",
        opts: [
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["125%", "x"],
            ["100%", "15"],
          ]),
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["75%", "x"],
            ["100%", "15"],
          ]),
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["75%", "15"],
            ["100%", "x"],
          ]),
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["25%", "15"],
            ["100%", "x"],
          ]),
        ],
        correctId: "c",
        correctTitle: "إجابة صحيحة!",
        wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
        body: [
          "السعر بعد الخصم (⁦₪15⁩) يمثل <span dir='ltr'>75%</span> من السعر الأصلي، لذلك يجب إيجاد قيمة <span dir='ltr'>100%</span>.",
          "النتيجة: الجدول ج صحيح.",
        ],
        bodyWrong: [
          "انتبهوا - السعر بعد الخصم (⁦₪15⁩) يمثل <span dir='ltr'>75%</span> من السعر الأصلي، وبالتالي يجب أن تجدوا قيمة <span dir='ltr'>100%</span>.",
          "النتيجة: الجدول ج صحيح.",
        ],
        hint: "أي نسبة مئوية من السعر الأصلي تدفعون بعد خصم بنسبة <span dir='ltr'>25%</span>؟",
      },

      {
        kind: "viq",
        ask: "<strong>ب. ما السعر الأصلي للساندويتش (بالشواقل) قبل الخصم؟</strong>",
        callToAction: "<strong>أكملوا البيانات الناقصة:</strong>",
        rows: [{ label: "", answer: 20, unit: 'ش.ج' }],
        correctTitle: "إجابة صحيحة!",
        wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
        body: [
          "جدول النسبة الصحيح من البند أ سيساعدنا في إيجاد السعر الأصلي (<span dir='ltr'>100%</span>) للساندويتش:",
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["75%", "15"],
            ["100%", "x"],
          ]),
          "سننشئ معادلة النسبة:",
          EQ('<span class="frac"><span class="frac-num">15</span><span class="frac-den">x</span></span> = <span class="frac"><span class="frac-num">75</span><span class="frac-den">100</span></span>'),
          "نضرب في المقام المشترك:",
          EQ("75x = 1500"),
          "وبعد القسمة على 75 سنحصل على:",
          EQ("x = 20"),
          "لذلك، السعر الأصلي للساندويتش (قبل الخصم) كان ⁦₪20⁩.",
        ],
        hint: "استعينوا بالإجابة الصحيحة للبند أ.",
      },

      {
        kind: "scq",
        ask:
          '<strong>ج. ياسمين، طالبة في الصف الثامن، ادّعت: «إذا حسبنا <span dir="ltr">25%</span> من السعر بعد الخصم (15 شاقلًا) ' +
          'وأضفنا هذا المبلغ إلى 15 شاقلًا، فسنحصل بالضبط على السعر الأصلي للساندويتش».<br>هل ادّعاء ياسمين صحيح؟</strong>',
        callToAction: "اختاروا الإجابة الصحيحة",
        opts: ["نعم", "لا", "لا يمكن التحديد"],
        correctId: "b",
        correctTitle: "صحيح جدًا‎!",
        wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
        body: [
          "وفقًا لطريقة ياسمين، يجب أن نحسب السعر الأصلي للساندويتش من خلال الخطوات التالية:",
          "المرحلة أ – حساب <span dir='ltr'>25%</span> من ⁦₪15⁩:",
          EQ('<span dir="ltr">25%</span> · 15 = <span class="frac"><span class="frac-num">25</span><span class="frac-den">100</span></span> · 15 = <span class="eq-unit" dir="rtl">3.75 ش.ج</span>'),
          "المرحلة ب – إضافة المبلغ المستلم (⁦₪3.75⁩) إلى ⁦₪15⁩:",
          EQ('15 + 3.75 = <span class="eq-unit" dir="rtl">18.75 ش.ج</span>'),
          "نعلم من البند ب أن السعر الأصلي (قبل الخصم) هو ⁦₪20⁩ وبالتالي <strong>ياسمين مخطئة.</strong>",
        ],
        bodyWrong: [
          "وفقًا لطريقة ياسمين، علينا حساب السعر الأصلي للساندويتش من خلال الخطوات التالية:",
          "المرحلة أ - حساب <span dir='ltr'>25%</span> من ⁦₪15⁩:",
          EQ('<span dir="ltr">25%</span> · 15 = <span class="frac"><span class="frac-num">25</span><span class="frac-den">100</span></span> · 15 = <span class="eq-unit" dir="rtl">3.75 ش.ج</span>'),
          "المرحلة ب – إضافة المبلغ الذي تم الحصول عليه (⁦₪3.75⁩) إلى ⁦₪15⁩:",
          EQ('15 + 3.75 = <span class="eq-unit" dir="rtl">18.75 ش.ج</span>'),
          "نحن نعرف من البند ب أن السعر الأصلي (قبل الخصم) هو ⁦₪20⁩ وبالتالي <strong>ياسمين مخطئة.</strong>",
        ],
        hint: "احسبوا السعر الأصلي (قبل الخصم) بطريقة ياسمين.",
      },

      {
        kind: "scq",
        ask:
          "<strong>د. في اليوم الأخير من العرض، تقرّر إلغاء الخصم بنسبة <span dir='ltr'>25%</span> وإرجاع الساندويتش إلى سعره الأصلي (قبل العرض).<br>" +
          "بأي نسبة مئوية يجب زيادة السعر بعد الخصم (15 شاقلًا) حتى يعود الساندويتش إلى سعره الأصلي بالضبط؟</strong>",
        callToAction: "اختاروا الإجابة الصحيحة",
        opts: ['بنسبة <span dir="ltr">25%</span>', 'بنسبة <span dir="ltr">50%</span>', 'بنسبة <span dir="ltr">20.5%</span>', 'بنسبة <span dir="ltr">33⅓%</span>'],
        correctId: "d",
        correctTitle: "إجابة رائعة!",
        wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
        body: [
          "نعلم من البند ب أن سعر الساندويتش قبل الخصم كان ⁦₪20⁩.",
          "الآن السعر هو ⁦₪15⁩ وهو <span dir='ltr'>100%</span> لدينا.",
          "لنحسب النسبة المئوية التي تناسب ⁦₪20⁩ ونرى بكم نسبة مئوية يجب أن نزيد السعر مرة أخرى:",
          propTable("النسبة المئوية", 'السعر (بـ ش.ج)', [
            ["x", "20"],
            ["100%", "15"],
          ]),
          "سعر الساندويتش قبل الخصم هو:",
          EQ('100% · <span class="frac"><span class="frac-num">20</span><span class="frac-den">15</span></span> = 133⅓%'),
          "<strong>أي:</strong> يجب رفع السعر بـ " + EQ("133⅓% - 100% = 33⅓%"),
          "<strong>شاهدوا جيداً أن هذا بوضوح ليس نفس النسبة المئوية كما في الخصم!</strong>",
        ],
        hint: "استعينوا بجدول النسبة.",
      },
    ],
  },

  

  /* ══ peak question, second sitting (slides 85-90) ══ */
  {
    screen: 60,
    kind: "transition",
    video: "character-challenge.mp4",
    /* copy replaced verbatim by the producer, 14.09.26 */
    pre: "كل الاحترام لك!<br>إذا لم تتمكن من الإجابة بشكل صحيح على بعض الأسئلة،<br>من المهم أن تفهم ما الذي لا يزال غير واضح وأن تتواصل مع الدردشة أو المعلم لشرح إضافي.",
    big: "الآن يأتي السؤال الأهم",
    mid: "تحتوي على 3 بنود. يجب أن تنجحوا في 2 على الأقل.",
    cta: "متابعة",
    bubbleLine: "أنا متأكد أنكم ستنجحون!",
  },

  {
    screen: 61,
    kind: "story",
    media: "phone-battery.jpg",
    mediaAlt: "بطارية الهاتف المحمول",
    intro:
      "قام عمر بتحديث إصدار على هاتفه المحمول وانخفضت مدة عمل البطارية بنسبة <span dir='ltr'>20%</span> " +
      "(البطارية تفرغ بسرعة أكبر).<br><br>" +
      "في أعقاب شكواه، أعلنت الشركة أنها ستصدر تحديثاً إضافياً سيعيد وقت البطارية بالضبط إلى المستوى الذي كان عليه قبل التحديث.",
  },

  {
    screen: 62,
    kind: "scq",
    set: "E",
    q: 1,
    media: "phone-battery.jpg",
    mediaAlt: "بطارية الهاتف الجوال",
    ask:
      "<strong>أ. لنفترض أنه في النسخة الأولية، كانت بطارية الهاتف تكفي لمدة 10 ساعات من الاستخدام المتواصل على الجهاز.<br>" +
      "لكم ساعة استخدام ستكفي البطارية بعد تحديث الإصدار؟</strong>",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["12 ساعة", "ساعتان", "8 ساعات", "9.8 ساعات"],
    correctId: "c",
    correctTitle: "إجابة صحيحة!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "<strong>الطريقة أ -</strong>",
      "تقدير: <span dir='ltr'>20%</span> من 10 هو ساعتان، لذلك <span dir='ltr'>80%</span> من 10 هي 8 ساعات.",
      "<strong>الطريقة ب -</strong>",
      "حساب باستخدام كسر بسيط:",
      EQ('<span dir="ltr">80%</span> · 10 = <span class="frac"><span class="frac-num">80</span><span class="frac-den">100</span></span> · 10 = <span class="eq-unit" dir="rtl">8 ساعات</span>'),
      /* deck ends "לכן תשובה ב' נכונה" — our options carry no letters (and 8
         שעות is the third pill), so the clause is dropped rather than confuse */
      "<strong>الخلاصة: </strong>بعد تحديث الإصدار الذي قلّل الوقت بنسبة <span dir='ltr'>20%</span> استمرت البطارية لمدة 8 ساعات من الاستخدام (بدلاً من 10).",
    ],
    hint: 'نظراً لأننا نتعامل مع رقم "مريح" (10 ساعات)، يمكننا استخدام حساب بالتقدير التقريبي.',
  },

  {
    screen: 63,
    kind: "scq",
    set: "E",
    q: 2,
    ask:
      "<strong>ب. بأي نسبة يجب إطالة (زيادة) وقت البطارية في النسخة الحالية (الأقصر)، " +
      "لإعادة وقت الاستخدام بدقة إلى الحالة التي كانت عليها قبل التحديث؟",
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["بنسبة <span dir='ltr'>15%</span>", "ب-<span dir='ltr'>20%</span>", "ب-<span dir='ltr'>25%</span>", "ب-<span dir='ltr'>30%</span>"],
    correctId: "c",
    correctTitle: "إجابة صحيحة!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "سنستخدم جدول النسبة لحساب كم نسبة مئوية تمثل 10 ساعات من أصل 8 ساعات:",
      propTable("النسبة المئوية", "الوقت (بالساعات)", [
        ["x", "10"],
        ["100%", "8"],
      ]),
      "لننشئ معادلة الفرضية:",
      EQ('<span class="frac"><span class="frac-num">x</span><span class="frac-den">100</span></span> = <span class="frac"><span class="frac-num">10</span><span class="frac-den">8</span></span>'),
      "نضرب في المقام المشترك (800) فنحصل على:",
      EQ("8x = 1000"),
      "وبعد القسمة على 8 نحصل على:",
      EQ("x = 125"),
      "الخلاصة: لقد توصلنا إلى أنه إذا كانت 8 ساعات بطارية تساوي <span dir='ltr'>100%</span> فإن 10 ساعات بطارية تساوي <span dir='ltr'>125%</span>، لذلك للعودة إلى وقت بطارية قدره 10 ساعات يجب زيادة وقت البطارية بـ",
      EQ("125% - 100% = 25%"),
    ],
    hint: "استخدموا جدول التناسب وتذكروا أن نسبتكم <span dir='ltr'>100%</span> هي 8 ساعات.",
  },

  {
    screen: 64,
    kind: "scq",
    set: "E",
    q: 3,
    ask:
      "<strong>ج. تحقق عمر من الهاتف بعد أن أعادت شركة التكنولوجيا الحالة إلى وضعها السابق " +
      "واكتشف أن وقت بطاريته أصبح الآن 10 ساعات مرة أخرى.<br>" +
      'ادّعى عمر: </strong>«بما أن الوقت زاد من 8 ساعات عائدًا إلى 10 ساعات، فإن <strong>التغيّر في الوقت (في مجموع الساعات) </strong>' +
      'يساوي بالضبط التغيّر الذي حدث عندما قصر الوقت».<br><strong>هل ادّعاء عمر بخصوص التغيّر في عدد الساعات صحيح؟</strong>',
    callToAction: "اختاروا الإجابة الصحيحة",
    opts: ["صحيحة", "غير صحيحة", "لا يمكن تحديده"],
    correctId: "a",
    correctTitle: "إجابة صحيحة!",
    wrongTitle: "هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب",
    body: [
      "عمر محق لأن الانخفاض من 10 ساعات إلى 8 ساعات هو انخفاض بـ 2 ساعة والارتفاع من 8 ساعات إلى 10 ساعات هو ارتفاع بـ 2 ساعة.",
      "يتعلق الأمر بكميات مطلقة ولذلك فهو صحيح. في النسب المئوية، الأمر ليس صحيحاً لأن الكل يتغير وسنوسع شرح ذلك لاحقاً.",
    ],
    hint: "لاحظوا أن عمر يتعامل مع الكميات (الساعات) وليس مع النسب المئوية.",
  },

  
];

/* ─── screen builder ─── */
function prHintBlock(sid, hint) {
  if (!hint) return "";
  return `
     <button class="scq-hint" id="${sid}-hint" type="button" onclick="openHint('${sid}')"><span class="nav-label" data-label="أريد تلميحًا"><span>أريد تلميحًا</span></span>${HINT_ICON}</button> <div class="scq-hint-overlay hidden" id="${sid}-hint-overlay" onclick="closeHintOnBackdrop(event, '${sid}')"> <div class="scq-hint-popup" role="dialog" aria-modal="true" aria-labelledby="${sid}-hint-title"> <div class="scq-hint-text"><h2 class="scq-hint-title" id="${sid}-hint-title">${HINT_TITLE_ICON} تلميح</h2> <div class="scq-hint-body"><p>${hint}</p></div></div> <button class="scq-hint-close" type="button" onclick="closeHint('${sid}')"><span class="nav-label" data-label="العودة إلى السؤال"><span>العودة إلى السؤال</span></span></button> </div> </div>`;
}
/* sub-question letters (א. / ב. / ג.) render in Subject purple (producer 27.08) */
function letterize(html) {
  if (!html) return html;
  /* <strong>ب. whole phrase bold</strong> — keep the phrase bold, only the
     letter changes color (eating the opening tag unbolded s39's question) */
  const m = html.match(/^<strong>([\u05D0-\u05EA\u0621-\u064A])\.\s*(?!<\/strong>)/);
  if (m) return '<strong class="q-letter">' + m[1] + '.</strong> <strong>' + html.slice(m[0].length);
  return html.replace(/^(?:<strong>)?([\u05D0-\u05EA\u0621-\u064A])\.(?:<\/strong>)?\s*/, '<strong class="q-letter">$1.</strong> ');
}
function prPopupBlock(sid) {
  /* the onpointerdown hook is what makes it draggable — CSS cursor alone is a lie
     (producer 20.08: feedback like this is ALWAYS draggable) */
  return `<div class="scq-popup hidden" id="${sid}-popup" role="status" onpointerdown="mcqPopupPointerDown(event, '${sid}-popup')">
      <h3 class="scq-popup-title" id="${sid}-popup-title"></h3>
      <div class="scq-popup-body" id="${sid}-popup-body"></div>
    </div>`;
}
function prBody(cfg, sid) {
  if (cfg.kind === "scq") {
    return `<div class="scq-answers" role="radiogroup" aria-label="اختاروا الإجابة الصحيحة">
      ${cfg.opts
        .map((o, i) => {
          const id = String.fromCharCode(97 + i);
          return `<button class="scq-opt${cfg.optHtml ? " scq-opt--rich" : ""}" type="button" role="radio" aria-checked="false" data-id="${id}" onclick="scqSelect('${sid}','${id}')"><span class="scq-radio" aria-hidden="true"></span><span class="scq-opt-text">${o}</span></button>`;
        })
        .join("")}
    </div>`;
  }
  if (cfg.kind === "mcq") {
    return `<div class="scq-answers" role="group" aria-label="حدّدوا جميع الجمل الصحيحة">
      ${cfg.opts
        .map((o, i) => {
          const id = String.fromCharCode(97 + i);
          return `<button class="scq-opt is-multi" type="button" role="checkbox" aria-checked="false" data-id="${id}" onclick="mcqToggle2('${sid}','${id}')"><span class="scq-radio is-box" aria-hidden="true"></span><span class="scq-opt-text">${o}</span></button>`;
        })
        .join("")}
    </div>`;
  }
  if (cfg.kind === "task") {
    /* a real-world task — the learner counts actual benches, so there is no key.
       The action opens once every box has something in it. */
    return `<div class="viq-rows task-rows">
      ${cfg.rows
        .map(
          (r, i) => `<div class="viq-row task-row">
        <span class="viq-row-label">${letterize(r.label)}</span>
        <input id="${sid}-in-${i}" class="viq-input-box task-input" type="text"
               aria-label="${r.label.replace(/<[^>]*>/g, "")}" oninput="taskOnInput('${sid}')">
      </div>`,
        )
        .join("")}
    </div>`;
  }
  if (cfg.kind === "tags") {
    /* Rebuilt 14.09.26 to match deck slide 54: the TAG is the client's own
       artwork (cut from the FTP `תגי מחיר` sheet, its text burned in), and the
       answer box sits BELOW each tag with ش.ج to its left — not inside the tag,
       which is how the earlier CSS-drawn version had it. */
    return `<div class="tag-row">
      ${cfg.rows
        .map(
          (r, i) => `<div class="tag-cell">
        <img loading="lazy" class="tag-art" src="../unit-assets/img/${r.img}" alt="تسمية السعر: ${r.was} شاقل قبل الخصم، حقل السعر الجديد">
        <span class="tag-answer"><input id="${sid}-in-${i}" class="viq-input-box" type="number" inputmode="numeric" aria-label="السعر الجديد لـ ${r.was} شاقل" oninput="viqOnInput('${sid}')"><span class="viq-unit">ش.ج</span></span>
      </div>`,
        )
        .join("")}
    </div>`;
  }
  if (cfg.kind === "viq") {
    return `<div class="viq-rows" role="group" aria-label="${cfg.callToAction || ""}">
      ${cfg.rows
        .map(
          (r, i) => `<div class="viq-row">
        ${r.label ? `<span class="viq-row-label">${letterize(r.label)}</span>` : ""}
        <span class="viq-row-input${(r.unit || "").trim() === "%" ? " unit-right" : ""}"><input id="${sid}-in-${i}" class="viq-input-box" type="number" inputmode="numeric" aria-label="${(r.label || cfg.ask || "").replace(/<[^>]*>/g, "")}" oninput="viqOnInput('${sid}')"><span class="viq-unit">${r.unit || ""}</span></span>
      </div>`,
        )
        .join("")}
    </div>`;
  }
  if (cfg.kind === "dq") {
    return `<div class="viq-row">
      ${cfg.ask ? `<span class="viq-row-label">${letterize(cfg.ask)}</span>` : ""}
      <span class="viq-row-input">
        <select class="dq-select" id="${sid}-sel" onchange="dqOnChange('${sid}')" aria-label="${(cfg.ask || "").replace(/<[^>]*>/g, "")}">
          <option value="">اختاروا</option>${cfg.opts.map((o) => `<option value="${o}">${o}</option>`).join("")}
        </select><span class="viq-unit">${cfg.unit || ""}</span>
      </span>
    </div>`;
  }
  return "";
}
function buildPracticeScreens() {
  const app = document.getElementById("app");
  PR.forEach((cfg) => {
    if (!inThisPart(cfg.screen)) return;
    const sid = "s" + cfg.screen;
    const sec = document.createElement("section");
    sec.className = "screen";
    sec.dataset.screen = cfg.screen;
    sec.id = sid;
    const back = `<button class="scq-back" type="button" onclick="goBack()"><span class="nav-label" data-label="رجوع"><span>رجوع</span></span></button>`;

    if (cfg.kind === "scrollset") {
      /* one screen, one section per pptx slide, each question self-contained */
      const qids = [];
      /* hint overlays are collected here and appended OUTSIDE .rs-scroll —
         inside it they are positioned against scrolled content and never
         appear over the screen (producer 14.09.26, dev 58). */
      const hintOverlays = [];
      const secs = cfg.sections
        .map((sec2, i) => {
          if (sec2.kind === "story") {
            return `<div class="rs-block scrollset-block">
            <p class="pr-intro">${sec2.intro}</p>
            ${
              sec2.bubble
                ? `<div class="scrollset-widget">
                <img loading="lazy" src="../unit-assets/img/${sec2.char || "character-thinking.png"}" alt="الشخصية المرافقة">
                <div class="rs-bubble rs-bubble--beside g-widget-bubble">
                  <svg class="rs-bubble-shape" viewBox="0 0 241 137" preserveAspectRatio="none" aria-hidden="true"><use href="#bubble-tail-right"/></svg>
                  <span class="rs-bubble-text">${sec2.bubble}</span>
                </div></div>`
                : ""
            }
          </div>`;
          }
          const qid = sid + "q" + i;
          qids.push({ qid, cfg: sec2 });
          return `<div class="rs-block scrollset-block" id="${qid}">
          ${sec2.ask ? `<p class="pr-subq">${letterize(sec2.ask)}</p>` : ""}
          ${sec2.callToAction ? `<p class="pr-ask">${sec2.callToAction}</p>` : ""}
          ${prBody(sec2, qid)}
          <div class="rs-actions">
            <button class="btn-inline-check" id="${qid}-check" disabled onclick="${sec2.kind === "viq" ? `viqCheck('${qid}')` : `scqCheck('${qid}')`}">هل إجابتي صحيحة؟</button>
            ${sec2.hint ? `<button class="scq-hint scrollset-hint-btn" id="${qid}-hint" type="button"${hintGated(qid) ? ' style="visibility:hidden"' : ""} onclick="openHint('${qid}')"><span class="nav-label" data-label="أريد تلميحًا"><span>أريد تلميحًا</span></span>${HINT_ICON}</button>` : ""}
          </div>
          ${
            sec2.hint
              ? (hintOverlays.push(
                  `<div class="scq-hint-overlay hidden" id="${qid}-hint-overlay" onclick="closeHintOnBackdrop(event, '${qid}')">
            <div class="scq-hint-popup" role="dialog" aria-modal="true" aria-labelledby="${qid}-hint-title">
              <div class="scq-hint-text">
                <h3 class="scq-hint-title" id="${qid}-hint-title">${HINT_TITLE_ICON} تلميح</h3>
                <div class="scq-hint-body"><p>${sec2.hint}</p></div>
              </div>
              <button class="scq-hint-close" type="button" onclick="closeHint('${qid}')">العودة إلى السؤال</button>
            </div>
          </div>`,
                ),
                "")
              : ""
          }
          <div class="scq-popup scrollset-feedback hidden" id="${qid}-popup" role="status">
            <h3 class="scq-popup-title" id="${qid}-popup-title"></h3>
            <div class="scq-popup-body" id="${qid}-popup-body"></div>
          </div>
        </div>`;
        })
        .join("");
      sec.innerHTML = `
        <div class="rs-scroll" id="${sid}-scroll"><div class="rs-inner">
          ${cfg.title ? `<h1 class="g-title scrollset-title">${cfg.title}</h1>` : ""}
          ${secs}
        </div></div>
        ${hintOverlays.join("")}
        <button class="btn-continue" id="${sid}-continue" disabled onclick="advanceScreen()"><span class="nav-label" data-label="متابعة"><span>متابعة</span></span></button>
        ${back}`;
      app.appendChild(sec);
      scrollSets[cfg.screen] = { qids: qids.map((q) => q.qid), scrolledEnd: false };
      qids.forEach(({ qid, cfg: c }) => {
        if (c.kind === "viq") {
          VIQ[qid] = {
            answers: c.rows.map((r) => r.answer),
            attempts: 0,
            done: false,
            lastWrong: null,
            correctTitle: c.correctTitle,
            wrongTitle: c.wrongTitle,
            body: c.body,
            pages: c.pages,
          };
        } else {
          SCQ[qid] = {
            bodyWrong: c.bodyWrong,
            correctId: c.correctId,
            selected: null,
            attempts: 0,
            done: false,
            lastWrong: null,
            correctTitle: c.correctTitle,
            wrongTitle: c.wrongTitle,
            body: c.body,
            pages: c.pages,
          };
        }
      });
      return;
    }
    if (cfg.kind === "transition") {
      sec.innerHTML = `
        <div class="transition-content">
          ${cfg.pre ? `<p class="s1-subtitle s1-subtitle--regular">${cfg.pre}</p>` : ""}
          ${cfg.note ? `<p class="transition-note">${cfg.note}</p>` : ""}
          <h1 class="s1-title">${cfg.big}</h1>
          ${cfg.mid ? `<p class="s1-subtitle">${cfg.mid}</p>` : ""}
          ${cfg.noteAfter ? `<p class="transition-note">${cfg.noteAfter}</p>` : ""}
          <div class="transition-char transition-char--video">${
            cfg.video
              ? `<video src="../unit-assets/video/${cfg.video}" autoplay loop muted playsinline preload="auto" aria-label="الشخصية المرافقة"></video>`
              : `<img loading="lazy" src="../unit-assets/img/character-happy.png" alt="الشخصية المرافقة">`
          }</div>
        </div>
        <button class="btn-continue" id="${sid}-continue" onclick="advanceScreen()"><span class="nav-label" data-label="${cfg.cta}"><span>${cfg.cta}</span></span></button>
        ${back}`;
    } else {
      const strip = cfg.set && !PR_NO_STEPPER.includes(cfg.set) ? qprogHTML(cfg.set, prStation(cfg.set, cfg.q)) : "";
      const media = cfg.media
        ? `<div class="pr-media${cfg.zoom ? " scq-img" : ""}">
             <div class="${cfg.zoom ? "zoom-img-inner" : ""}"><img src="../unit-assets/img/${cfg.media}" alt="${cfg.mediaAlt || ""}" loading="lazy" decoding="async"></div>
             ${cfg.zoom ? `<button class="img-zoom-btn" type="button" aria-label="تكبير الصورة" data-zoom-src="true"><svg class="img-zoom-btn__icon" viewBox="0 0 21 21" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" stroke-width="2"/><line x1="13.5" y1="13.5" x2="19" y2="19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>` : ""}
           </div>`
        : "";
      const widget = cfg.bubble
        ? `<div class="g-widget"><div class="rs-bubble rs-bubble--beside g-widget-bubble">
             <svg class="rs-bubble-shape" viewBox="0 0 241 137" preserveAspectRatio="none" aria-hidden="true"><use href="#bubble-tail-right"/></svg>
             <span class="rs-bubble-text">${cfg.bubble}</span></div>
             <img loading="lazy" src="../unit-assets/img/${cfg.char || "character-thinking.png"}" alt="الشخصية المرافقة"></div>`
        : "";
      const isStory = cfg.kind === "story";
      if (isStory) sec.classList.add("pr-story");
      if (cfg.scroll) sec.classList.add("pr-has-scroll");
      if (cfg.bubble) sec.classList.add("pr-widget");
      sec.innerHTML = `
        ${strip}
        <div class="pr-question${cfg.scroll ? " pr-scroll" : ""}">
          ${media}
          <div class="pr-col">
            ${cfg.intro ? `<p class="pr-intro">${cfg.intro}</p>` : ""}
            ${cfg.ask && cfg.kind !== "dq" ? `<p class="pr-subq">${letterize(cfg.ask)}</p>` : ""}
            ${cfg.callToAction ? `<p class="pr-ask">${cfg.callToAction}</p>` : ""}
            ${prBody(cfg, sid)}
          </div>
        </div>
        ${widget}
        ${
          isStory
            ? `<button class="btn-continue" id="${sid}-continue" ${cfg.scroll ? "disabled" : ""} onclick="advanceScreen()"><span class="nav-label" data-label="متابعة"><span>متابعة</span></span></button>`
            : `<button class="btn-continue" id="${sid}-check" disabled onclick="${cfg.kind === "task" ? `taskCheck('${sid}')` : cfg.kind === "viq" || cfg.kind === "tags" ? `viqCheck('${sid}')` : cfg.kind === "dq" ? `dqCheck('${sid}')` : cfg.kind === "mcq" ? `mcqCheck2('${sid}')` : `scqCheck('${sid}')`}"><span class="nav-label" data-label="${cfg.kind === "task" ? "متابعة" : "هل إجابتي صحيحة؟"}"><span>${cfg.kind === "task" ? "متابعة" : "هل إجابتي صحيحة؟"}</span></span></button>`
        }
        ${prHintBlock(sid, cfg.hint)}
        ${prPopupBlock(sid)}
        ${back}`;
    }
    app.appendChild(sec);

    /* register with the matching engine */
    if (cfg.kind === "scq") {
      SCQ[sid] = {
        correctId: cfg.correctId,
        selected: null,
        attempts: 0,
        done: false,
        lastWrong: null,
        correctTitle: cfg.correctTitle,
        wrongTitle: cfg.wrongTitle,
        body: cfg.body,
        pages: cfg.pages,
        practice: !!cfg.set,
      };
    } else if (cfg.kind === "viq" || cfg.kind === "tags") {
      VIQ[sid] = {
        answers: cfg.rows.map((r) => r.answer),
        attempts: 0,
        done: false,
        lastWrong: null,
        correctTitle: cfg.correctTitle,
        wrongTitle: cfg.wrongTitle,
        body: cfg.body,
        bodyWrong: cfg.bodyWrong,
        pages: cfg.pages,
      };
    } else if (cfg.kind === "task") {
      TASKS[sid] = { done: false };
    } else if (cfg.kind === "mcq") {
      MCQ[sid] = {
        correctIds: new Set(cfg.correctIds),
        selected: new Set(),
        attempts: 0,
        done: false,
        lastWrong: null,
        correctTitle: cfg.correctTitle,
        wrongTitle: cfg.wrongTitle,
        body: cfg.body,
        pages: cfg.pages,
      };
    } else if (cfg.kind === "dq") {
      DQ[sid] = {
        correctId: cfg.correctId,
        attempts: 0,
        done: false,
        lastWrong: null,
        correctTitle: cfg.correctTitle,
        wrongTitle: cfg.wrongTitle,
        body: cfg.body,
        pages: cfg.pages,
        practice: !!cfg.set,
      };
    }
  });
}
buildPracticeScreens();

/* A scrollset screen opens Continue only when every question inside it is
   answered AND the learner has reached the end (approved scroll policy). */
function scrollSetGate(n) {
  const st = scrollSets[n];
  if (!st) return true;
  const box = document.getElementById("s" + n + "-scroll");
  if (box && !st.scrolledEnd && box.scrollTop + box.clientHeight >= box.scrollHeight - 24) {
    st.scrolledEnd = true;
    try { scheduleResumeSave(); } catch (e) {} /* a latched gate is state */
  }
  const allDone = st.qids.every((q) => {
    const cfg = (VIQ && VIQ[q]) || (SCQ && SCQ[q]);
    return !cfg || cfg.done;
  });
  const btn = document.getElementById("s" + n + "-continue");
  if (btn) btn.disabled = !(st.scrolledEnd && allDone);
  return st.scrolledEnd && allDone;
}
function scrollSetEnter(n) {
  const box = document.getElementById("s" + n + "-scroll");
  if (!box) return;
  scrollSetGate(n);
  if (box.dataset.wired) return;
  box.dataset.wired = "1";
  ["scroll", "scrollend", "wheel", "touchmove", "keyup"].forEach((ev) =>
    box.addEventListener(ev, () => scrollSetGate(n), { passive: true }),
  );
  if (box.scrollHeight <= box.clientHeight + 8) return;
  const hint = makeClickHint("s" + n + "-hint-scroll");
  document.getElementById("s" + n).appendChild(hint);
  box.addEventListener("scroll", () => hint.classList.add("hidden"), { once: true });
}

/* Scroll screens (slides 74/75): the action stays locked until the learner has
   scrolled to the end. Wired on screen ENTRY — measuring a display:none
   element returns zeros (maven-skills §8). */
const prScrolled = {};
function prScrollEnter(n) {
  const sec = document.querySelector('.screen[data-screen="' + n + '"]');
  const box = sec && sec.querySelector(".pr-scroll");
  const btn = sec && sec.querySelector(".btn-continue");
  if (!box || !btn) return;
  const atEnd = () => box.scrollTop + box.clientHeight >= box.scrollHeight - 4;
  const gate = () => {
    if (atEnd() && !prScrolled[n]) { prScrolled[n] = true; try { scheduleResumeSave(); } catch (e) {} }
    /* a question screen also needs its answer; a story screen only the scroll */
    const q = popupCfgFor("s" + n);
    const answered = !q || q.done;
    btn.disabled = !(prScrolled[n] && answered);
  };
  if (!box.dataset.wired) {
    box.addEventListener("scroll", gate);
    box.dataset.wired = "1";
  }
  if (box.scrollHeight <= box.clientHeight + 4) prScrolled[n] = true; // nothing to scroll
  gate();
}
function prScrollGate(n) {
  return !document.querySelector('.screen[data-screen="' + n + '"] .pr-scroll') || prScrolled[n];
}

/* Every screen carries the report flag. Generated screens get a CLONE of the
   static one — never a re-typed copy (maven-skills §8i). */
(function ensureFlagOnEveryScreen() {
  const src = document.querySelector(".flag-btn");
  if (!src) return;
  document.querySelectorAll(".screen").forEach((scr) => {
    if (!scr.querySelector(".flag-btn")) scr.insertBefore(src.cloneNode(true), scr.firstChild);
  });
})();

/* ═══════════════════════════════════════════════════════════════════
   RESUME — the hooks ../unit-js/40-resume.js and ../unit-js/50-loader.js call
   Design: Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §8;
   shape ported from methodica-math-ratio-02 (same engine lineage).

   What is captured: this component's OWN screens only, and only LEARNER STATE.
   The engine maps (SCQ/DQ/VIQ/MCQ) mix this release's configuration (correctId,
   answers, body, pages…) with the learner's state; carrying config into the
   document would pin a returning learner to the answer key live when they
   started — a content fix would never reach them. So every engine is captured
   through an explicit key list. Sets become arrays (JSON cannot carry a Set).

   Where painting happens: repaintScreen(n) in every goTo (after the entry
   resets), and applyExecutionState() after a page load. While the page lives,
   the DOM already carries the marks and the painters re-apply them idempotently;
   after a LOAD the DOM is pristine and they rebuild the answered look.
   No eval here: every piece of learner state lives in a const object, so the
   ratio-02 eval(k + ' = st.vars[k]') path has nothing to assign.
   ═══════════════════════════════════════════════════════════════════ */
var RESUME_KEYS = {
  scq: ["selected", "attempts", "done", "lastWrong", "result"],
  dq: ["attempts", "done", "lastWrong", "result", "userPick"],
  viq: ["attempts", "done", "lastWrong", "result", "userInputs"],
  mcq: ["attempts", "done", "lastWrong", "result"],
};
function _ownSid(sid) {
  var m = /^s(\d+)/.exec(sid);
  return !!m && inThisPart(+m[1]);
}
function _pickKeys(o, keys) {
  var r = {};
  keys.forEach(function (k) { if (o[k] !== undefined) r[k] = o[k]; });
  return r;
}
function _taskInputs(sid) {
  return [].slice.call(document.querySelectorAll("#" + sid + " .task-input"));
}

/* ── capture ───────────────────────────────────────────────────────── */
function capturePartPayload() {
  var st = {
    currentScreen: currentScreen,
    /* scoring first: without it a resumed learner scores 0 from that point on,
       the progress strips come back blank and the component 03 gate cannot see */
    xapiQ: typeof XAPI_Q_RESULTS !== "undefined" ? Object.assign({}, XAPI_Q_RESULTS) : {},
    pr: Object.assign({}, prResults),
    s0: Object.assign({}, s0State),
    s1: Array.from(s1Opened),
    s5: Array.from(s5Opened),
    g: {}, scq: {}, dq: {}, viq: {}, mcq: {}, task: {},
    scroll: {}, prScrolled: Object.assign({}, prScrolled), scrollGate: Object.assign({}, SCROLL_GATE_DONE),
  };
  Object.keys(gState).forEach(function (k) {
    if (_ownSid(k) && gState[k].picked !== null) st.g[k] = { answered: !!gState[k].answered, picked: gState[k].picked, result: gState[k].result || null };
  });
  [["scq", SCQ], ["dq", DQ], ["viq", VIQ], ["mcq", MCQ]].forEach(function (pair) {
    var name = pair[0], map = pair[1];
    Object.keys(map).forEach(function (sid) {
      if (!_ownSid(sid)) return;
      var q = map[sid], rec = _pickKeys(q, RESUME_KEYS[name]);
      if (name === "mcq") rec.selected = Array.from(q.selected || []);
      if (name === "dq") { var sel = document.getElementById(sid + "-sel"); if (sel) rec.value = sel.value; }
      if (name === "viq") rec.vals = viqInputs(sid).map(function (el) { return el.value; });
      st[name][sid] = rec;
    });
  });
  Object.keys(TASKS).forEach(function (sid) {
    if (_ownSid(sid)) st.task[sid] = { done: !!TASKS[sid].done, vals: _taskInputs(sid).map(function (el) { return el.value; }) };
  });
  Object.keys(scrollSets).forEach(function (n) {
    if (inThisPart(+n)) st.scroll[n] = !!scrollSets[n].scrolledEnd;
  });
  return st;
}

/* ── apply ─────────────────────────────────────────────────────────── */
/* State only — no DOM, no reporting. Runs twice in applyExecutionState (before and after the
   goTo whose entry resets could clear something). Assigns only into maps this component built. */
function applyResumeVars(st) {
  if (!st) return;
  if (st.xapiQ && typeof XAPI_Q_RESULTS !== "undefined") Object.keys(st.xapiQ).forEach(function (k) { XAPI_Q_RESULTS[k] = st.xapiQ[k]; });
  if (st.pr) Object.keys(st.pr).forEach(function (k) { prResults[k] = st.pr[k]; });
  if (st.s0) Object.keys(s0State).forEach(function (k) { if (k in st.s0) s0State[k] = st.s0[k]; });
  if (st.s1) st.s1.forEach(function (n) { s1Opened.add(n); });
  if (st.s5) st.s5.forEach(function (n) { s5Opened.add(n); });
  if (st.g) Object.keys(st.g).forEach(function (k) {
    if (!gState[k]) return;
    gState[k].answered = !!st.g[k].answered;
    gState[k].picked = st.g[k].picked;
    if (st.g[k].result) gState[k].result = st.g[k].result;
  });
  [["scq", SCQ], ["dq", DQ], ["viq", VIQ], ["mcq", MCQ]].forEach(function (pair) {
    var name = pair[0], map = pair[1], saved = st[name];
    if (!saved) return;
    Object.keys(saved).forEach(function (sid) {
      var q = map[sid], s = saved[sid];
      if (!q) return; /* a screen this component does not own */
      RESUME_KEYS[name].forEach(function (k) { if (k in s) q[k] = s[k]; });
      if (name === "mcq") q.selected = new Set(s.selected || []);
    });
  });
  if (st.task) Object.keys(st.task).forEach(function (sid) { if (TASKS[sid]) TASKS[sid].done = !!st.task[sid].done; });
  if (st.scroll) Object.keys(st.scroll).forEach(function (n) { if (scrollSets[n] && st.scroll[n]) scrollSets[n].scrolledEnd = true; });
  if (st.prScrolled) Object.keys(st.prScrolled).forEach(function (n) { if (st.prScrolled[n]) prScrolled[n] = true; });
  if (st.scrollGate) Object.keys(st.scrollGate).forEach(function (k) { if (st.scrollGate[k]) SCROLL_GATE_DONE[k] = true; });
}

/* Values that live only in the DOM. Runs BEFORE the painters, which disable the inputs.
   On a final wrong attempt a VIQ/DQ box holds the REVEALED answer (what was on screen when
   the learner left); their own answer is in userInputs/userPick and in the reported statement. */
function applyResumeDom(st) {
  if (!st) return;
  if (st.dq) Object.keys(st.dq).forEach(function (sid) {
    var sel = document.getElementById(sid + "-sel");
    if (sel && typeof st.dq[sid].value === "string") sel.value = st.dq[sid].value;
  });
  if (st.viq) Object.keys(st.viq).forEach(function (sid) {
    var vals = st.viq[sid].vals || [];
    viqInputs(sid).forEach(function (el, i) { if (typeof vals[i] === "string") el.value = vals[i]; });
  });
  if (st.task) Object.keys(st.task).forEach(function (sid) {
    var vals = st.task[sid].vals || [];
    _taskInputs(sid).forEach(function (el, i) { if (typeof vals[i] === "string") el.value = vals[i]; });
  });
}

/* ── the painters ──────────────────────────────────────────────────────
   Rules every painter obeys (guide §8.8):
     1. Correctness from the recorded verdict (q.result / XAPI_Q_RESULTS), never the attempt count.
     2. DOM writes only — no state change, no reporting call, no setPracticeResult2.
     3. Idempotent, and a no-op on a screen nothing has touched ("clean" = nothing picked or
        typed, NOT attempts === 0: a pending pick is painted).
     4. Never reset — resetScreenState(n) owns that and has already run.
     5. Early-return on a missing host node: every component loads this same file.
     6. Wrong marks only while the answer on screen is still the submitted one (D-15), and the
        check button stays disabled on the answer already marked wrong (retry gate, D-14).
   ─────────────────────────────────────────────────────────────────────── */
function _doneCheck(sid) {
  var chk = document.getElementById(sid + "-check");
  if (chk) {
    if (chk.classList.contains("btn-inline-check")) chk.disabled = true;
    else { setNavLabel(chk, "متابعة"); chk.disabled = popupGatePending(sid); }
  }
  hideHintButton(sid);
}
function _optEl(sid, id) {
  return document.querySelector("#" + sid + ' .scq-opt[data-id="' + id + '"]');
}

function paintSCQ(sid) {
  var q = SCQ[sid];
  if (!q || !document.getElementById(sid)) return;
  var opts = document.querySelectorAll("#" + sid + " .scq-opt");
  if (q.done) {
    opts.forEach(function (o) { o.classList.remove("selected"); o.disabled = true; });
    var c = _optEl(sid, q.correctId); if (c) c.classList.add("correct");
    if (q.selected && q.selected !== q.correctId) { var w = _optEl(sid, q.selected); if (w) w.classList.add("wrong"); }
    _doneCheck(sid);
    return;
  }
  if (!q.selected) return;                       /* clean screen */
  var marked = q.attempts > 0 && q.selected === q.lastWrong;
  opts.forEach(function (o) {
    var on = o.dataset.id === q.selected;
    o.classList.toggle("selected", on && !marked);
    o.classList.toggle("wrong", on && marked);
    o.setAttribute("aria-checked", on ? "true" : "false");
  });
  var chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = q.selected === q.lastWrong;
}

function paintDQ(sid) {
  var q = DQ[sid], sel = document.getElementById(sid + "-sel");
  if (!q || !sel) return;
  var chk = document.getElementById(sid + "-check");
  if (q.done) {
    sel.classList.remove("dq-wrong");
    sel.classList.add("dq-correct");             /* live: correct, or the revealed key */
    sel.disabled = true;
    hideHintButton(sid);
    if (chk) { setNavLabel(chk, "متابعة"); chk.disabled = false; }
    return;
  }
  if (!sel.value) return;
  sel.classList.toggle("dq-wrong", q.attempts > 0 && sel.value === q.lastWrong);
  if (chk) chk.disabled = sel.value === q.lastWrong;
}

function paintVIQ(sid) {
  var q = VIQ[sid], els = viqInputs(sid);
  if (!q || !els.length) return;
  if (q.done) {
    els.forEach(function (el, i) {
      var revealed = q.result === "wrong2" && q.userInputs && Number(q.userInputs[i]) !== q.answers[i];
      var okHere = Number(el.value) === q.answers[i];
      el.disabled = true;
      el.classList.toggle("revealed", !!revealed);
      el.classList.toggle("correct", okHere);
      el.classList.toggle("error", !okHere);
    });
    _doneCheck(sid);
    return;
  }
  var vals = els.map(function (el) { return el.value.trim(); });
  if (vals.every(function (v) { return v === ""; })) return;   /* clean screen */
  var submitted = q.attempts > 0 && JSON.stringify(vals) === JSON.stringify(q.lastWrong || []);
  els.forEach(function (el, i) { el.classList.toggle("error", submitted && Number(vals[i]) !== q.answers[i]); });
  var chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = vals.some(function (v) { return v === ""; }) || submitted;
}

function paintMCQ(sid) {
  var q = MCQ[sid];
  if (!q || !document.getElementById(sid)) return;
  var opts = document.querySelectorAll("#" + sid + " .scq-opt");
  if (q.done) {
    opts.forEach(function (o) {
      o.classList.remove("selected");
      o.classList.toggle("correct", q.correctIds.has(o.dataset.id));
      o.classList.toggle("wrong", !q.correctIds.has(o.dataset.id) && q.selected.has(o.dataset.id));
      o.disabled = true;
    });
    _doneCheck(sid);
    return;
  }
  if (!q.selected.size) return;
  opts.forEach(function (o) {
    var on = q.selected.has(o.dataset.id);
    o.classList.toggle("selected", on);
    o.setAttribute("aria-checked", on ? "true" : "false");
  });
  var chk = document.getElementById(sid + "-check");
  if (chk) chk.disabled = mcqSnap(q.selected) === q.lastWrong;
}

function paintGuided(sid) {
  var st = gState[sid], cfg = GUIDED.find(function (c) { return "s" + c.screen === sid; });
  if (!st || !cfg || !cfg.opts || !st.answered || st.picked === null || !document.getElementById(sid)) return;
  document.querySelectorAll("#" + sid + " .gc-opt").forEach(function (o) {
    var i = Number(o.dataset.idx);
    o.classList.toggle("correct", i === cfg.correct);
    o.classList.toggle("wrong", i !== cfg.correct && i === st.picked);
    o.setAttribute("aria-checked", i === st.picked ? "true" : "false");
    o.disabled = true;
  });
  var cont = document.getElementById(sid + "-continue");
  if (cont) cont.disabled = false;
}

function paintS0() {
  if (!document.getElementById("s0")) return;
  var opts = document.querySelectorAll("#s0 .scq-opt");
  var check = document.getElementById("s0q-check");
  if (s0State.answered) {
    var ok = s0State.picked === S0Q_CORRECT;
    opts.forEach(function (o) {
      o.disabled = true;
      o.classList.remove("selected");
      o.classList.toggle("correct", o.dataset.id === S0Q_CORRECT);
      o.classList.toggle("wrong", o.dataset.id !== S0Q_CORRECT && o.dataset.id === s0State.picked);
    });
    var fb = document.getElementById("s0q-feedback");
    if (fb) {
      fb.innerHTML = "<strong>" + (ok ? "كلّ الاحترام!" : "هذا غير دقيق") + "</strong><br>دعونا نفهم معًا لماذا";
      fb.classList.toggle("is-correct", ok);
      fb.classList.toggle("is-wrong", !ok);
    }
    if (check) check.disabled = true;
    document.getElementById("s0-sec3")?.classList.remove("hidden");
  } else if (s0State.picked) {
    opts.forEach(function (o) {
      var sel = o.dataset.id === s0State.picked;
      o.classList.toggle("selected", sel);
      o.setAttribute("aria-checked", sel ? "true" : "false");
    });
    if (check) check.disabled = false;
  }
  s0UpdateGate();
}

function paintTask(sid) {
  var els = _taskInputs(sid), btn = document.getElementById(sid + "-check");
  if (!TASKS[sid] || !els.length || !btn) return;
  btn.disabled = !els.every(function (el) { return el.value.trim() !== ""; });
}

/* The dispatcher — exception-safe per guide §8.7. A screen absent from here keeps no answer
   state of its own (transitions, narrative screens). The strips are refreshed every time: they
   read prResults, which a resume restored without passing through setPracticeResult2. */
function restoreScreenUI(n) {
  var sid = "s" + n;
  try {
    if (n === 0) paintS0();
    if (gState[sid]) paintGuided(sid);
    if (TASKS[sid]) paintTask(sid);
    var sids = [sid].concat((scrollSets[n] && scrollSets[n].qids) || []);
    sids.forEach(function (k) {
      if (SCQ[k]) paintSCQ(k);
      if (DQ[k]) paintDQ(k);
      if (VIQ[k]) paintVIQ(k);
      if (MCQ[k]) paintMCQ(k);
    });
    prRefreshStrips();
  } catch (e) {
    console.error("[resume] restoreScreenUI " + n, e);
  }
}

/* Called from goTo on EVERY navigation, after the entry resets (guide §8.4a). The painters
   are idempotent, so in live play this re-applies what is already there; after a load it
   rebuilds it. beginRepaint/endRepaint mark the window (40-resume.js resumeIsPainting). */
function repaintScreen(n) {
  try { beginRepaint(); } catch (e) {}
  try { restoreScreenUI(n); }
  catch (e) { console.error("[resume] repaint " + n, e); }
  finally { try { endRepaint(); } catch (e) {} }
}

/* ── the replay ────────────────────────────────────────────────────────
   Called by ../unit-js/50-loader.js on launch. Two passes of applyResumeVars around goTo():
   goTo() runs resetScreenState(n), whose entry hooks may touch state — so the variables are
   assigned again afterwards and only then painted.
   screenOverride ('#screen=N') wins over the document in choosing the SCREEN, never in
   restoring the STATE — skipping the restore would lose XAPI_Q_RESULTS, from which the
   strips, the scores and the component 03 gate are derived. */
function applyExecutionState(st, screenOverride) {
  if (!st) return;
  _restoring = true;
  /* Replaying answers must not re-report them; held across goTo() too, so a resumed item or
     component boundary emits nothing during the replay. */
  var _origSend = window.sendStatement720;
  window.sendStatement720 = function () {};
  try {
    applyResumeVars(st);
    var _n = (typeof screenOverride === "number" && inThisPart(screenOverride))
      ? screenOverride
      : (typeof st.currentScreen === "number" && inThisPart(st.currentScreen))
        ? st.currentScreen
        : (window.PART_CONFIG ? window.PART_CONFIG.start : 0);
    goTo(_n);
    applyResumeVars(st);     /* undo anything the entry reset just cleared */
    applyResumeDom(st);      /* before the painter, which disables the inputs */
    restoreScreenUI(currentScreen);
  } catch (e) {
    console.error("[resume] apply", e);
  } finally {
    window.sendStatement720 = _origSend;
    _restoring = false;
  }
  /* Tell the library about the answers restored but deliberately not re-sent, or it drops
     their item 'completed' (20-xapi.js xapiSeedAnsweredFromResume). Then clear the item latch
     the stubbed goTo set, so the resumed screen reports its item 'initialized' exactly once. */
  try { xapiSeedAnsweredFromResume(); } catch (e) {}
  xapiCurrentItem = null;
  try { xapiOnScreen(currentScreen); } catch (e) {}
  /* LAST: the repaint re-enabled this screen's button; a gate that already fired outlives it. */
  try { restoreEndedButton(currentScreen); } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════════
   xAPI (720) — how a call site names the catalogue question it reports
   Design record: docs-and-tools/XAPI-MAP.md (decisions of 08.10.26).

   The ITEM is not in this map: it comes from this component's SCREEN_TO_SUBCONTENT, so an
   xAPI statement and a learner's problem report can never disagree about where the learner
   stood. This map only says which catalogue QUESTION an answer belongs to. One map serves all
   seven components: xapiKeyFor() returns null when SCREEN_TO_SUBCONTENT has no entry for the
   screen, so the other components' rows are inert rather than wrong.

   Keys are logical answers: the engine sid (s3, s59q2) or, where one screen carries one
   catalogue question PER FIELD, '<sid>r<field index>' (s33, s41).
   ⚠️ 01-004, the guided walk-through "נפתור יחד" (s10-s20), reports nothing since 2026-11-14:
   unit owner's rule of 10.11 (QA/2026-11-10-guided-items/GUIDED-ITEMS-REPORT.md, group A; as
   ratio-05 a572ab3 and ratio-04 f46ec27). Kata declares no question on it, so s10, s11, s15, s16
   and s18 (were q1, q2, q4, q5, q7) are out of this map: gPick keeps and saves the pick
   (flushResumeSave), xapiReport finds no key and sends nothing, and the pick enters no score.
   ═══════════════════════════════════════════════════════════════════ */
var XAPI_QMAP = {
  /* 01 */
  s0: [0, "q1"],
  s2: [2, "q1"], s3: [3, "q2"], s4: [4, "q3"],
  s6: [6, "q1"], s7: [7, "q2"], s8: [8, "q3"],
  s22: [22, "q1"], s23: [23, "q2"],
  s24: [24, "q1"], s25: [25, "q2"],
  /* 02 */
  s28: [28, "q1"],
  s29: [29, "q1"], s30: [30, "q2"], s31: [31, "q3"],
  s32: [32, "q1"],
  s33r0: [33, "q1"], s33r1: [33, "q2"],
  s34: [34, "q1"],
  /* 03 */
  s36: [36, "q1"],
  s37: [37, "q1"],
  s38: [38, "q1"], s39: [39, "q2"],
  s40: [40, "q1"], s41r0: [41, "q2"], s41r1: [41, "q3"],
  s43: [43, "q1"],
  s44: [44, "q1"],
  /* 05 */
  s48: [48, "q1"], s49: [49, "q2"], s50: [50, "q3"],
  s51: [51, "q1"],
  s52: [52, "q1"], s53: [53, "q2"],
  s54: [54, "q1"], s55: [55, "q2"],
  s57: [57, "q1"],
  /* 06 */
  s59q1: [59, "q1"], s59q2: [59, "q2"], s59q3: [59, "q3"], s59q4: [59, "q4"],
  /* 07 */
  s62: [62, "q1"], s63: [63, "q2"], s64: [64, "q3"],
};

function xapiKeyFor(key) {
  var e = XAPI_QMAP[key];
  if (!e) return null;
  var m = typeof SCREEN_TO_SUBCONTENT !== "undefined" ? SCREEN_TO_SUBCONTENT[e[0]] : null;
  if (!m) return null; /* another component's screen */
  return { item: m[0], qKey: e[1] };
}

/* Every answered site in this file goes through here, as ONE line after its guards.
   ⚠️ Swallowing on purpose: a reporting failure must never stop the learner. xapiAnswered
   writes XAPI_Q_RESULTS on its first line, outside its own gate and try, so the score (and
   the component 03 gate) survives even with reporting off. */
function xapiReport(key, correct, isLast, answer) {
  var k = xapiKeyFor(key);
  if (!k) return;
  try { xapiAnswered(k.item, k.qKey, correct, isLast, answer); } catch (e) {}
}

/* A value-input screen. Per field when the screen carries one catalogue question per field
   (XAPI_QMAP has '<sid>r0'): per-row correctness, a SHARED isLast — the engine's attempts are
   per screen. Otherwise one question, all-or-nothing, as the screen grades it. */
function xapiReportFields(sid, vals, oks, isLast) {
  if (XAPI_QMAP[sid + "r0"]) {
    vals.forEach(function (v, i) { xapiReport(sid + "r" + i, oks[i], isLast, v); });
  } else {
    xapiReport(sid, oks.every(Boolean), isLast, vals.join(" | "));
  }
}

/* A hint belongs to a screen (bar button) or to one inline question (s59qN). On a screen that
   carries a question per field, it belongs to the first. */
function xapiHint(sid) {
  var k = xapiKeyFor(sid) || xapiKeyFor(sid + "r0");
  if (!k) return;
  try { xapiRequestedHint(k.item, k.qKey); } catch (e) {}
}

/* ── scoring ───────────────────────────────────────────────────────────
   All derived from XAPI_Q_RESULTS ('<item>/<qKey>' -> bool, written by xapiAnswered).
   Why explicit results at all: the 720 library's own aggregate is an all-correct AND, which
   reports success:false for any partial pass. 0.6 is the threshold MOE's own example uses. */
var XAPI_PASS = 0.6;

function itemQuestionKeys(item) {
  return Object.keys(XAPI_Q_RESULTS).filter(function (k) { return k.indexOf(item + "/") === 0; });
}

/* An item's own 'completed' result — read through each script.js's XAPI_ITEM_RESULT.
   null for an item with no graded answer, which is the neutral value. */
function itemResultFor(item) {
  var keys = itemQuestionKeys(item);
  if (!keys.length) return null;
  var ok = keys.filter(function (k) { return XAPI_Q_RESULTS[k] === true; }).length;
  var scaled = ok / keys.length;
  return { success: scaled >= XAPI_PASS, score: { scaled: scaled } };
}

/* How many questions of an item the UI reports — the XAPI_QMAP rows whose screen maps to it. */
function itemReportedQuestionCount(item) {
  if (typeof SCREEN_TO_SUBCONTENT === "undefined") return 0;
  return Object.keys(XAPI_QMAP).filter(function (k) {
    var m = SCREEN_TO_SUBCONTENT[XAPI_QMAP[k][0]];
    return m && m[0] === item;
  }).length;
}

/* A STATION (one numbered question on the strip = one catalogue item) is correct only if ALL
   its questions are answered and correct (decision 08.10.26). */
function stationCorrect(item) {
  var n = itemReportedQuestionCount(item);
  var keys = itemQuestionKeys(item);
  return n > 0 && keys.length === n && keys.every(function (k) { return XAPI_Q_RESULTS[k] === true; });
}

/* This component's result, per its script.js PART_SCORING (docs-and-tools/XAPI-MAP.md):
     stations   items[] — scaled = correct stations / items.length; success = >= need (or 60 %)
     questions  n       — scaled = correct / n declared questions (an unanswered one is wrong)
     task               — {success: true}, no score: nothing was measured
     (none)             — scaled = correct / reported questions, success >= 60 % */
function partResult() {
  var s = typeof PART_SCORING !== "undefined" ? PART_SCORING : null;
  if (s && s.mode === "task") return { success: true };
  if (s && s.mode === "stations") {
    var good = s.items.filter(stationCorrect).length;
    var need = typeof s.need === "number" ? s.need : Math.ceil(XAPI_PASS * s.items.length);
    return { success: good >= need, score: { scaled: good / s.items.length } };
  }
  var keys = Object.keys(XAPI_Q_RESULTS);
  var n = s && s.mode === "questions" ? s.n : keys.length;
  if (!n) return null;
  var ok = keys.filter(function (k) { return XAPI_Q_RESULTS[k] === true; }).length;
  var scaled = ok / n;
  /* a number promised on screen (06: "3 לפחות", 07: "2 לפחות") is the success rule itself,
     written beside the denominator (guide §6.4) — never left to agree with 60 % by chance */
  var success = s && typeof s.need === "number" ? ok >= s.need : scaled >= XAPI_PASS;
  return { success: success, score: { scaled: scaled } };
}

/* Where each component parks its score in the state document — a durable per-component record.
   ⚠️ Exactly RESULT_KEYS in ../unit-js/40-resume.js (listed there so ?resetState clears their
   localStorage mirrors too). If they drift, a reset document sits beside a stale cache. */
var UNIT_SCORE_KEYS = {
  "methodica-ar-math-percent-04-01": "percent04_c01_scaled",
  "methodica-ar-math-percent-04-02": "percent04_c02_scaled",
  "methodica-ar-math-percent-04-03": "percent04_c03_scaled",
  "methodica-ar-math-percent-04-04": "percent04_c04_scaled",
  "methodica-ar-math-percent-04-05": "percent04_c05_scaled",
  "methodica-ar-math-percent-04-06": "percent04_c06_scaled",
  "methodica-ar-math-percent-04-07": "percent04_c07_scaled",
};

function recordPartResult(res) {
  if (!res || typeof XAPI_COMP_SLUG === "undefined") return;
  var key = UNIT_SCORE_KEYS[XAPI_COMP_SLUG];
  /* a task has no score: record its success instead, so the record is never blank */
  if (key) setUnitResult(key, res.score ? String(res.score.scaled) : String(!!res.success));
}

/* ── the promised pass threshold (component 03, screen 35) ─────────────
   "ענו נכון על 3 שאלות ומעלה כדי להתקדם" over set B — items 001-004 on screens 36-41. ENFORCED
   (decision 08.10.26, guide §6.4): leaving s41 forward below it ends the component there.
   Keyed by the GLOBAL screen the learner leaves; inert in every other component, whose
   SCREEN_TO_SUBCONTENT does not carry these screens. */
var SET_GATES = {
  41: { screens: [36, 37, 38, 39, 40, 41], items: ["001", "002", "003", "004"], need: 3, btn: "s41-check" },
};

/* Is every gated screen answered? (engine done flags — the same ones advanceScreen trusts) */
function screenAnswered(n) {
  var sid = "s" + n;
  var engines = [SCQ, VIQ, DQ, MCQ];
  for (var i = 0; i < engines.length; i++) if (engines[i][sid]) return !!engines[i][sid].done;
  return true;
}

/* true = the learner is below the promised threshold and must stop here.
   FAILS OPEN while any gated screen is unanswered or the screen is not this component's
   (a cleared document must not strand a learner; guide §6.4). */
function gateBlocks(n) {
  var g = SET_GATES[n];
  if (!g) return false;
  if (typeof SCREEN_TO_SUBCONTENT === "undefined" || !SCREEN_TO_SUBCONTENT[n]) return false;
  if (!g.screens.every(screenAnswered)) return false;
  return g.items.filter(stationCorrect).length < g.need;
}

/* End the component HERE, mid-range, instead of at its forward edge (the gate's ending).
   Same order as leaveToPart: the 'completed' goes out BEFORE anything can branch or fail, then
   the durable score, then a flush so a reload lands back on this screen.
   IDEMPOTENT: sendCompletedOnce is ledger-guarded, so a re-click or an ArrowLeft reports nothing
   more. ⚠️ It navigates NOWHERE — the platform moves the learner (recommendedAfterFail). */
function endComponentHere(btnId) {
  var res = partResult();
  try { xapiEndComponent(res, document.getElementById(btnId)); } catch (e) {}
  try { recordPartResult(res); } catch (e) {}
  try { flushResumeSave(); } catch (e) {}
}

/* Putting a fired gate back after a reload (guide §8.8 rule 12, D-8). The repaint re-enables an
   answered screen's "שנמשיך?"; a gated learner must not get it back. Re-disabled only when the
   gate blocks AND the ledger holds this component's 'completed' — an answered learner who
   reloaded WITHOUT clicking must get a live button, so their click still reports them.
   Fails OPEN on a missing document (alreadySent is false). Never re-fires, never reports. */
function restoreEndedButton(n) {
  var sent = false;
  try { sent = alreadySent("done", currentPartSlug()); } catch (e) {}
  if (!sent) return;                 /* fails OPEN: no document, nothing reported → stays live */
  var btn = null;
  if (gateBlocks(n)) btn = document.getElementById(SET_GATES[n].btn);
  /* D-8 (live run 08.10.26): the component's NORMAL last button too. After a reload the
     repaint relabels it "שנמשיך?" and re-enables it; a click then sent nothing (the ledger
     stops it) but the button looked live. Keyed on the ledger, never on screen position
     alone — before the component's 'completed' left, this button must stay clickable. */
  else if (window.PART_CONFIG && n === window.PART_CONFIG.end) btn = lastScreenButton();
  if (!btn) return;
  btn.disabled = true;
  btn.setAttribute("aria-disabled", "true");
}

/* ── part boundaries ─────────────────────────────────────────────────── */

/* The button that fired this component's last click: the last screen's check button
   (relabelled "שנמשיך?" once answered) or, where the last screen has no own check (the
   scrollset s59), its continue button. xapiEndComponent disables it after the report. */
function lastScreenButton() {
  var end = window.PART_CONFIG ? window.PART_CONFIG.end : currentScreen;
  return document.getElementById("s" + end + "-check") || document.getElementById("s" + end + "-continue");
}

/* The learner left the component's last screen forward. The PLATFORM decides what comes next
   (guide §8.12): the component reports and STOPS, the button disables itself. The hop to the
   next component lives on only for a local walkthrough (DEV_NAV, ../unit-js/10-identity.js).
   The 'completed' goes out BEFORE anything can branch or fail. */
function leaveToPart(destSlug, destFirstScreen) {
  var res = partResult();
  try { xapiEndComponent(res, lastScreenButton()); } catch (e) {}
  try { recordPartResult(res); } catch (e) {}
  try { flushResumeSave(); } catch (e) {}
  if (DEV_NAV) {
    try { writeForwardState(destSlug, "#screen=" + currentScreen, destFirstScreen); } catch (e) {}
    /* explicit index.html — a folder URL is a 0-byte page on the MOE CDN */
    window.location.replace("../" + destSlug + "/index.html" + window.location.search);
  }
}

/* The unit's last component (07) ends the same way, with nowhere to hop to. */
function finishUnit() {
  var res = partResult();
  try { xapiEndComponent(res, lastScreenButton()); } catch (e) {}
  try { recordPartResult(res); } catch (e) {}
  try { flushResumeSave(); } catch (e) {}
}

/* Puts a first-time learner on this component's own first screen. Called by
   ../unit-js/90-boot.js — AFTER every builder and engine map above exists (an
   enter hook run earlier hits a const in its temporal dead zone) and BEFORE
   bootXAPI(), whose resume read may then navigate again to the saved screen
   (applyExecutionState). index.html ships s0 marked .active for the old
   single-folder build, so every .active is cleared first: goTo() clears only one. */
function partBoot() {
  document.querySelectorAll(".screen.active").forEach((el) => el.classList.remove("active"));
  currentScreen = window.PART_CONFIG ? window.PART_CONFIG.start : 0;
  goTo(currentScreen);
}

/* Bottom bar: the hint pill sits 16px after the primary pill instead of at a fixed 180px.
   A label longer than the Hebrew one (Arabic "هل إجابتي صحيحة؟") otherwise runs under the
   hint. Runs on every DOM/class/text change (synchronous, style writes are not observed) and on resize, so label
   swaps (setNavLabel), screen changes and late font loads all re-fit. */
(function () {
  var HINT_GAP = 16, EDGE = 24, FALLBACK_LEFT = 180, queued = false;
  function fit() {
    queued = false;
    if (typeof document === "undefined" || !document || !document.querySelectorAll) return; /* page torn down */
    document.querySelectorAll(".scq-hint").forEach(function (hint) {
      var primary = hint.parentElement && hint.parentElement.querySelector(".btn-continue");
      var w = primary ? primary.offsetWidth : 0;
      hint.style.left = (w > 0 ? EDGE + w + HINT_GAP : FALLBACK_LEFT) + "px";
    });
  }
  function queue() { fit(); }
  window.addEventListener("resize", queue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  new MutationObserver(queue).observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "disabled"],
  });
  queue();
})();
