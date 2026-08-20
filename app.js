(function () {
  "use strict";

  var done = {};
  var selectedLeft = null;
  var selectedRight = null;
  var matched = {};

  function byId(id) { return document.getElementById(id); }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function storageGet(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) {}
  }

  function toast(msg) {
    var t = byId("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function updateProgress() {
    var n = 0;
    for (var k in done) { if (done.hasOwnProperty(k)) n++; }
    var fill = byId("progressFill");
    var label = byId("progressLabel");
    if (fill) fill.style.width = (n / 5) * 100 + "%";
    if (label) label.textContent = n + " / 5 sections";
  }

  function markDone(id) {
    done[id] = true;
    var arr = [];
    for (var k in done) { if (done.hasOwnProperty(k)) arr.push(k); }
    storageSet("u10b_done", JSON.stringify(arr));
    qsa("#mainNav button").forEach(function (b) {
      var p = b.getAttribute("data-panel");
      if (p && done[p]) b.classList.add("done");
    });
    updateProgress();
  }

  function goTo(id) {
    var panel = byId(id);
    if (!panel) return;
    qsa("section.panel").forEach(function (p) { p.classList.remove("active"); });
    panel.classList.add("active");
    qsa("#mainNav button").forEach(function (b) {
      if (b.getAttribute("data-panel") === id) b.classList.add("active");
      else b.classList.remove("active");
    });
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function bindWordCards() {
    qsa(".word-card").forEach(function (card) {
      card.onclick = function () { card.classList.toggle("flipped"); };
    });
  }

  function selectMatch(el) {
    if (el.classList.contains("correct")) return;
    var side = el.getAttribute("data-side");
    var id = parseInt(el.getAttribute("data-id"), 10);
    if (side === "left") {
      qsa('[data-side="left"]').forEach(function (e) { e.classList.remove("selected"); });
      el.classList.add("selected");
      selectedLeft = id;
    } else {
      qsa('[data-side="right"]').forEach(function (e) { e.classList.remove("selected"); });
      el.classList.add("selected");
      selectedRight = id;
    }
    if (selectedLeft && selectedRight) checkPair();
  }

  function checkPair() {
    var fb = byId("matchFeedback");
    var leftEl = document.querySelector('[data-side="left"][data-id="' + selectedLeft + '"]');
    var rightEl = document.querySelector('[data-side="right"][data-id="' + selectedRight + '"]');
    if (!leftEl || !rightEl) return;
    if (selectedLeft === selectedRight) {
      leftEl.classList.remove("selected");
      rightEl.classList.remove("selected");
      leftEl.classList.add("correct");
      rightEl.classList.add("correct");
      matched[selectedLeft] = true;
      if (fb) { fb.textContent = "Correct!"; fb.className = "match-feedback ok"; }
      var count = 0;
      for (var k in matched) { if (matched.hasOwnProperty(k)) count++; }
      if (count === 6) {
        if (fb) fb.textContent = "All matched! Great work.";
        markDone("match");
      }
    } else {
      leftEl.classList.add("wrong");
      rightEl.classList.add("wrong");
      if (fb) { fb.textContent = "Not a match - try again."; fb.className = "match-feedback err"; }
      setTimeout(function () {
        leftEl.classList.remove("wrong", "selected");
        rightEl.classList.remove("wrong", "selected");
      }, 500);
    }
    selectedLeft = null;
    selectedRight = null;
  }

  function resetMatch() {
    matched = {};
    selectedLeft = null;
    selectedRight = null;
    var fb = byId("matchFeedback");
    if (fb) { fb.textContent = ""; fb.className = "match-feedback"; }
    var ak = byId("answerKey");
    if (ak) ak.classList.remove("show");
    qsa(".match-item").forEach(function (el) {
      el.classList.remove("selected", "correct", "wrong");
    });
  }

  function toggleAnswerKey() {
    var ak = byId("answerKey");
    if (ak) ak.classList.toggle("show");
  }

  function bindMatch() {
    qsa(".match-item").forEach(function (el) {
      el.onclick = function () { selectMatch(el); };
    });
  }

  function updateWordCount() {
    var essay = byId("essay");
    if (!essay) return;
    var text = essay.value.replace(/^\s+|\s+$/g, "");
    var n = text ? text.split(/\s+/).length : 0;
    var wc = byId("wordCount");
    if (wc) wc.textContent = String(n);
    storageSet("u10b_essay", essay.value);
  }

  function saveWriting() {
    var essay = byId("essay");
    if (essay) storageSet("u10b_essay", essay.value);
    storageSet("u10b_pre", JSON.stringify({
      recall: (byId("preRecall") && byId("preRecall").value) || "",
      connect: (byId("preConnect") && byId("preConnect").value) || "",
      support: (byId("preSupport") && byId("preSupport").value) || "",
      push: (byId("prePush") && byId("prePush").value) || ""
    }));
    toast("Writing saved on this device");
  }

  function restoreWriting() {
    var essayVal = storageGet("u10b_essay", "");
    var essay = byId("essay");
    if (essay && essayVal) {
      essay.value = essayVal;
      updateWordCount();
    }
    try {
      var pre = JSON.parse(storageGet("u10b_pre", "{}")) || {};
      if (pre.recall && byId("preRecall")) byId("preRecall").value = pre.recall;
      if (pre.connect && byId("preConnect")) byId("preConnect").value = pre.connect;
      if (pre.support && byId("preSupport")) byId("preSupport").value = pre.support;
      if (pre.push && byId("prePush")) byId("prePush").value = pre.push;
    } catch (e) {}
    var prompt = storageGet("u10b_prompt", "");
    if (prompt) {
      var el = document.querySelector('.prompt-opt[data-prompt="' + prompt + '"]');
      if (el) el.classList.add("selected");
    }
  }

  function selectPrompt(el) {
    qsa(".prompt-opt").forEach(function (e) { e.classList.remove("selected"); });
    el.classList.add("selected");
    storageSet("u10b_prompt", el.getAttribute("data-prompt"));
  }

  function finishAll() {
    markDone("write");
    toast("Worksheet complete - great work exploring longevity!");
  }

  function bindNav() {
    qsa("#mainNav button").forEach(function (btn) {
      btn.onclick = function () {
        var panel = btn.getAttribute("data-panel");
        if (panel) goTo(panel);
      };
      var p = btn.getAttribute("data-panel");
      if (p && done[p]) btn.classList.add("done");
    });
  }

  function bindButtons() {
    var map = [
      ["btnToMatch", function () { markDone("words"); goTo("match"); }],
      ["btnResetMatch", resetMatch],
      ["btnToggleAK", toggleAnswerKey],
      ["btnToFrames", function () { markDone("match"); goTo("frames"); }],
      ["btnSaveFrames", function () { toast("Sentence frames noted"); }],
      ["btnToExplore", function () { markDone("frames"); goTo("explore"); }],
      ["btnSaveExplore", function () { toast("Exploration notes noted"); }],
      ["btnToWrite", function () { markDone("explore"); goTo("write"); }],
      ["btnSaveWriting", saveWriting],
      ["btnFinish", finishAll],
      ["btnBackMatch", function () { goTo("match"); }],
      ["btnGoWrite", function () { goTo("write"); }],
      ["promptA", function () { selectPrompt(byId("promptA")); }],
      ["promptB", function () { selectPrompt(byId("promptB")); }]
    ];
    for (var i = 0; i < map.length; i++) {
      var el = byId(map[i][0]);
      if (el) el.onclick = map[i][1];
    }
    var essay = byId("essay");
    if (essay) essay.oninput = updateWordCount;
  }

  function loadDone() {
    try {
      var arr = JSON.parse(storageGet("u10b_done", "[]")) || [];
      for (var i = 0; i < arr.length; i++) done[arr[i]] = true;
    } catch (e) { done = {}; }
  }

  function init() {
    try {
      loadDone();
      bindWordCards();
      bindMatch();
      updateProgress();
      restoreWriting();
      bindNav();
      bindButtons();
    } catch (err) {
      if (window.console && console.error) console.error("Init error:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
