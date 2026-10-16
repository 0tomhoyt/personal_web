/* Kernel Zoo — an animated look at how different hardware eats the same
   C = A·B. Chapter 1 ships three scenes:
     1. the race — one 24×24 C matrix filled by scalar, SIMD and GPU
        cursors, cell / VL-strip / 6×6-tile at a time. Speeds are schematic
        ratios; the scalar lane is annotated with the visitor's measured
        GFLOPS when a bench run exists.
     2. inside the scalar machine — naive dot products vs 4×4 register
        blocking, counted in loads and FMAs.
     3. an SVE vector — one fmla lighting VL lanes at once, with p0
        masking the tail, and a scalar ghost for contrast.
   Depends on i18n.js (window.siteI18n) and, when present, extras.js
   (window.siteBench). Strings live here so i18n.js stays untouched. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function lang() {
    return window.siteI18n && window.siteI18n.lang ? window.siteI18n.lang() : "en";
  }

  function fmt(s, map) {
    return String(s).replace(/\{(\w+)\}/g, function (_, k) {
      return map[k] != null ? map[k] : "{" + k + "}";
    });
  }

  var STRINGS = {
    en: {
      "title": "Kernel Zoo",
      "chapter": "Chapter 1 · GEMM",
      "close": "Close the kernel zoo",
      "tag": "Same C = A·B, three machines, very different appetites.",
      "tab.race": "the race",
      "tab.scalar": "scalar CPU",
      "tab.sve": "an SVE vector",
      "prev": "← prev",
      "next": "next →",
      "play": "play",
      "pause": "pause",
      "step": "step",
      "replay": "replay",
      "hint.reduced": "autoplay is off (reduced motion) — step through instead.",
      "race.note": "Fill speeds are schematic ratios; only the order in which cells appear is honest. SIMD and GPU get their measured kernels in a later chapter.",
      "race.noteMeasured": "Fill speeds are schematic ratios; the scalar lane stands on your measured {g} GFLOPS (FP64, N=384). SIMD and GPU get their measured kernels in a later chapter.",
      "race.lane.scalar": "scalar JS",
      "race.lane.simd": "SVE-style SIMD",
      "race.lane.gpu": "GPU wavefront",
      "race.sub.scalar": "one dot product at a time — 1 cell / beat",
      "race.sub.simd": "one fmla per beat — {n} cells / beat",
      "race.sub.gpu": "a wavefront lands a 6×6 tile / beat",
      "race.badge.measured": "measured",
      "race.badge.schematic": "schematic",
      "race.badge.slowed": "slowed ×{f}",
      "race.status": "filling…",
      "race.done": "finished in {s}s · ×{r} vs scalar",
      "race.pct": "{p}% of C",
      "race.said": "Two orders of magnitude, one matrix.",
      "sc.heading": "One ALU, two kernels",
      "sc.mode.naive": "naive",
      "sc.mode.blocked": "4×4 blocking",
      "sc.loads": "loads",
      "sc.fmas": "FMAs",
      "sc.k": "k step",
      "sc.note.naive": "Every multiply-add re-reads its C cell from memory: 16 FMAs cost 32 loads.",
      "sc.note.blocked": "Sixteen accumulators live in registers; each k streams 4 + 4 values and fires all 16 FMAs.",
      "sc.said": "Same 16 FMAs per k: {a} loads naive, {b} with 4×4 blocking.",
      "sc.reglabel": "16 accumulators, in registers",
      "sc.memlabel": "C lives in memory",
      "sc.footnote": "Real caches soften naive's bill; register blocking is still step zero.",
      "foot": "C = A·B · N = 384 in the bench · 24 in the pictures",
      "ve.heading": "One instruction, VL lanes",
      "ve.vl": "vector length",
      "ve.vl.opt": "{b}-bit · {n} lanes",
      "ve.strip": "one row of the problem · N = 22",
      "ve.ghost": "scalar, for contrast: 1 lane / beat",
      "ve.vs": "after {n} fmla: vector {a} cells · scalar {b} cells",
      "ve.disasm": "fmla z0.s, p0/m, z1.s, z2.s",
      "ve.disasm.note": " // one instruction · {n} FMAs",
      "ve.tail.full": "full vector — {n}/{n} lanes active",
      "ve.tail.tail": "tail vector — {a}/{n} lanes active, p0 masks the rest",
      "ve.said": "Same binary, wider z registers, more FMAs per beat: that is VL-agnostic code.",
      "why": "see why →"
    },
    zh: {
      "title": "算子动物园",
      "chapter": "第一章 · GEMM",
      "close": "关闭算子动物园",
      "tag": "同一个 C = A·B，三台机器，胃口大不相同。",
      "tab.race": "赛跑",
      "tab.scalar": "标量 CPU",
      "tab.sve": "SVE 向量",
      "prev": "← 上一幕",
      "next": "下一幕 →",
      "play": "播放",
      "pause": "暂停",
      "step": "步进",
      "replay": "重放",
      "hint.reduced": "已按「减少动态」停用自动播放——用步进逐帧看。",
      "race.note": "填充速度是示意比例；诚实的只有出格子的顺序。SIMD 和 GPU 的实测内核在后面的章节。",
      "race.noteMeasured": "填充速度是示意比例；标量这条以你设备的实测 {g} GFLOPS（FP64，N=384）为基准。SIMD 和 GPU 的实测内核在后面的章节。",
      "race.lane.scalar": "标量 JS",
      "race.lane.simd": "SVE 式 SIMD",
      "race.lane.gpu": "GPU 波前",
      "race.sub.scalar": "一次一个点积——每拍 1 格",
      "race.sub.simd": "一拍一条 fmla——每拍 {n} 格",
      "race.sub.gpu": "一个波前落一块 6×6 tile",
      "race.badge.measured": "实测",
      "race.badge.schematic": "示意",
      "race.badge.slowed": "放慢 ×{f}",
      "race.status": "填充中…",
      "race.done": "{s}s 完成 · 相对标量 ×{r}",
      "race.pct": "C 的 {p}%",
      "race.said": "两个数量级，一个矩阵。",
      "sc.heading": "一条 ALU，两种内核",
      "sc.mode.naive": "朴素",
      "sc.mode.blocked": "4×4 分块",
      "sc.loads": "访存次数",
      "sc.fmas": "FMA 数",
      "sc.k": "k 步",
      "sc.note.naive": "每次乘加都要从内存重读 C 的那一格：16 次 FMA 要付 32 次访存。",
      "sc.note.blocked": "16 个累加器常驻寄存器；每个 k 只流入 4 + 4 个数，打出全部 16 次 FMA。",
      "sc.said": "同样每 k 16 次 FMA：朴素要 {a} 次访存，4×4 分块只要 {b} 次。",
      "sc.reglabel": "16 个累加器，常驻寄存器",
      "sc.memlabel": "C 住在内存里",
      "sc.footnote": "现实里缓存会替朴素版分担一些，但寄存器分块仍然是第 0 步。",
      "foot": "C = A·B · 基准里 N = 384 · 图里 24",
      "ve.heading": "一条指令，VL 个 lane",
      "ve.vl": "向量长度",
      "ve.vl.opt": "{b} bit · {n} lane",
      "ve.strip": "问题的一行 · N = 22",
      "ve.ghost": "对照组标量：每拍 1 格",
      "ve.vs": "{n} 拍 fmla 之后：向量 {a} 格 · 标量 {b} 格",
      "ve.disasm": "fmla z0.s, p0/m, z1.s, z2.s",
      "ve.disasm.note": " // 一条指令 · {n} 次 FMA",
      "ve.tail.full": "满向量——{n}/{n} 个 lane 活跃",
      "ve.tail.tail": "尾巴向量——{a}/{n} 个 lane 活跃，其余被 p0 遮住",
      "ve.said": "同一份二进制，z 寄存器更宽，每拍 FMA 更多：这就是 VL-agnostic 代码。",
      "why": "看为什么 →"
    }
  };

  function t(key) {
    var pack = STRINGS[lang()] || STRINGS.en;
    return pack[key] != null ? pack[key] : STRINGS.en[key];
  }

  var TABS = ["race", "scalar", "sve"];

  /* ---------- shell ---------- */

  var root = null;
  var openState = false;
  var lastFocus = null;
  var built = false;
  var active = "race";
  var scenes = {};

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildShell() {
    root = el("div", "zoo");
    root.id = "zoo-root";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Kernel Zoo");

    var bar = el("div", "zoo-bar");
    bar.appendChild(el("span", "zoo-title", ""));
    bar.appendChild(el("span", "zoo-chapter", ""));
    var close = el("button", "zoo-close", "✕");
    close.type = "button";
    close.addEventListener("click", closeZoo);
    bar.appendChild(close);
    root.appendChild(bar);

    var tabs = el("div", "zoo-tabs");
    tabs.setAttribute("role", "tablist");
    TABS.forEach(function (id, i) {
      var tab = el("button", "zoo-tab");
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.dataset.zooTab = id;
      var num = el("em", null, "0" + (i + 1));
      var label = el("span", null, "");
      label.dataset.zooKey = "tab." + id;
      tab.appendChild(num);
      tab.appendChild(label);
      tab.addEventListener("click", function () {
        showTab(id);
      });
      tabs.appendChild(tab);
    });
    root.appendChild(tabs);

    var tag = el("p", "zoo-tag", "");
    tag.dataset.zooKey = "tag";
    root.appendChild(tag);

    var body = el("div", "zoo-body");
    TABS.forEach(function (id) {
      var scene = el("section", "zoo-scene");
      scene.dataset.zooScene = id;
      scene.setAttribute("role", "tabpanel");
      body.appendChild(scene);
      scenes[id].build(scene);
    });
    root.appendChild(body);

    var foot = el("div", "zoo-foot");
    var prev = el("button", "zoo-btn");
    prev.type = "button";
    prev.dataset.zooKey = "prev";
    prev.addEventListener("click", function () {
      stepTab(-1);
    });
    var note = el("p", "zoo-foot-note", "");
    note.dataset.zooKey = "foot";
    var next = el("button", "zoo-btn");
    next.type = "button";
    next.dataset.zooKey = "next";
    next.addEventListener("click", function () {
      stepTab(1);
    });
    foot.appendChild(prev);
    foot.appendChild(note);
    foot.appendChild(next);
    root.appendChild(foot);

    document.body.appendChild(root);

    /* zoo owns the Esc / ` keys while it is open: a capture-phase swallow
       keeps the terminal in extras.js from opening on top of the overlay */
    document.addEventListener(
      "keydown",
      function (e) {
        if (!openState) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeZoo();
        } else if (e.key === "`" || e.key === "~") {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true
    );
  }

  function openZoo() {
    if (!built) {
      buildShell();
      built = true;
      applyLang();
    }
    if (!openState) {
      openState = true;
      lastFocus = document.activeElement;
      root.classList.add("open");
      applyLang(); /* re-render: the bench may have run since the last open */
      showTab(active);
    }
  }

  function closeZoo() {
    if (!openState) return;
    openState = false;
    root.classList.remove("open");
    TABS.forEach(function (id) {
      scenes[id].hide();
    });
    if (lastFocus && lastFocus.focus) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (error) {}
    }
  }

  function isOpen() {
    return openState;
  }

  function stepTab(delta) {
    var i = TABS.indexOf(active);
    showTab(TABS[(i + delta + TABS.length) % TABS.length]);
  }

  function showTab(id) {
    active = id;
    TABS.forEach(function (tab) {
      var on = tab === id;
      var scene = root.querySelector('[data-zoo-scene="' + tab + '"]');
      scene.classList.toggle("on", on);
      var btn = root.querySelector('[data-zoo-tab="' + tab + '"]');
      btn.setAttribute("aria-selected", on ? "true" : "false");
      if (on) scenes[tab].show();
      else scenes[tab].hide();
    });
  }

  function applyLang() {
    if (!built) return;
    root.querySelector(".zoo-title").textContent = t("title");
    root.querySelector(".zoo-chapter").textContent = t("chapter");
    root.querySelector(".zoo-close").setAttribute("aria-label", t("close"));
    root.querySelectorAll("[data-zoo-key]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-zoo-key"));
    });
    TABS.forEach(function (id) {
      scenes[id].applyLang();
    });
  }

  /* shared controls row: play/pause, step, replay */
  function controlsRow(onPlay, onStep, onReplay) {
    var row = el("div", "zoo-scene-controls");
    var play = el("button", "zoo-btn");
    play.type = "button";
    play.dataset.zooKey = "play";
    var step = el("button", "zoo-btn");
    step.type = "button";
    step.dataset.zooKey = "step";
    step.addEventListener("click", onStep);
    var replay = el("button", "zoo-btn");
    replay.type = "button";
    replay.dataset.zooKey = "replay";
    replay.addEventListener("click", onReplay);
    play.addEventListener("click", function () {
      onPlay(function (playing) {
        play.textContent = playing ? t("pause") : t("play");
      });
    });
    row.appendChild(play);
    row.appendChild(step);
    row.appendChild(replay);
    return { row: row, play: play, refresh: function (playing) {
      play.textContent = playing ? t("pause") : t("play");
    } };
  }

  /* ---------- ticker for the two beat-driven scenes ---------- */

  function Ticker(step) {
    var timer = null;
    var running = false;
    function loop() {
      if (!running) return;
      var wait = step();
      timer = setTimeout(loop, wait || 420);
    }
    this.start = function () {
      if (running) return;
      running = true;
      loop();
    };
    this.stop = function () {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
    };
    this.isRunning = function () {
      return running;
    };
  }

  /* ---------- scene 1: the race ---------- */

  var RACE_N = 24;
  var RACE_CELLS = RACE_N * RACE_N;
  var RACE_SECONDS = 8; /* the scalar lane takes this long to fill C */
  var RACE_VL = 8; /* schematic SIMD width: 256-bit .s */
  var RACE_BLOCK = 6; /* schematic GPU: 6×6 tiles, 16 of them */
  var GPU_RATIO = 1000; /* any discrete GPU vs scalar JS, schematic */
  var GPU_MIN_SECONDS = 1.4; /* clamp so the wavefront is visible at all */

  var race = (function () {
    var host = null;
    var lanes = null;
    var ctrls = null;
    var hint = null;
    var said = null;
    var tSim = 0;
    var lastTs = 0;
    var timer = null;
    var playing = false;
    var doneShown = false;

    function blockOrder() {
      /* diagonal sweep, like a wavefront claiming tiles */
      var order = [];
      for (var d = 0; d <= 6; d++) {
        for (var bx = 0; bx < 4; bx++) {
          var by = d - bx;
          if (by >= 0 && by < 4) order.push({ x: bx, y: by });
        }
      }
      return order;
    }

    function makeLanes() {
      return [
        {
          id: "scalar",
          color: "#1a1916",
          quant: 1,
          seconds: RACE_SECONDS
        },
        {
          id: "simd",
          color: "#6b5d3f",
          quant: RACE_VL,
          seconds: RACE_SECONDS / RACE_VL
        },
        {
          id: "gpu",
          color: "#cf4d2f",
          quant: RACE_BLOCK * RACE_BLOCK,
          seconds: Math.max(RACE_SECONDS / GPU_RATIO, GPU_MIN_SECONDS),
          blocks: blockOrder()
        }
      ];
    }

    function revealedCount(lane) {
      var base = RACE_CELLS / lane.seconds;
      var count = Math.min(RACE_CELLS, Math.floor(base * tSim));
      return Math.floor(count / lane.quant) * lane.quant;
    }

    function eachRevealed(lane, count, fn) {
      if (lane.id === "gpu") {
        var blocks = Math.floor(count / lane.quant);
        for (var b = 0; b < blocks && b < lane.blocks.length; b++) {
          var blk = lane.blocks[b];
          for (var y = 0; y < RACE_BLOCK; y++) {
            for (var x = 0; x < RACE_BLOCK; x++) {
              fn((blk.y * RACE_BLOCK + y) * RACE_N + blk.x * RACE_BLOCK + x, b === blocks - 1);
            }
          }
        }
      } else {
        for (var i = 0; i < count; i++) {
          fn(i, i >= count - lane.quant);
        }
      }
    }

    function drawLane(lane) {
      var ctx = lane.ctx;
      var cs = 7;
      ctx.clearRect(0, 0, 168, 168);
      ctx.fillStyle = "rgba(205, 198, 184, 0.4)";
      for (var g = 0; g < RACE_CELLS; g++) {
        ctx.fillRect((g % RACE_N) * cs + 0.5, Math.floor(g / RACE_N) * cs + 0.5, cs - 1, cs - 1);
      }
      var count = revealedCount(lane);
      if (!count) return;
      ctx.fillStyle = lane.color;
      eachRevealed(lane, count, function (idx, fresh) {
        ctx.globalAlpha = fresh ? 1 : 0.78;
        ctx.fillRect((idx % RACE_N) * cs + 0.5, Math.floor(idx / RACE_N) * cs + 0.5, cs - 1, cs - 1);
      });
      ctx.globalAlpha = 1;
    }

    function drawAll() {
      lanes.forEach(drawLane);
    }

    function updateStats() {
      lanes.forEach(function (lane) {
        var count = revealedCount(lane);
        var pct = Math.floor((count / RACE_CELLS) * 100);
        lane.pct.textContent = fmt(t("race.pct"), { p: pct });
        if (count >= RACE_CELLS) {
          lane.node.classList.add("zo-done");
          var ratio = lane.id === "scalar" ? 1 : lane.id === "simd" ? RACE_VL : GPU_RATIO;
          lane.status.textContent = fmt(t("race.done"), {
            s: lane.seconds < 0.1 ? "<0.1" : lane.seconds.toFixed(1).replace(/\.0$/, ""),
            r: ratio
          });
        } else {
          lane.status.textContent = t("race.status");
        }
      });
    }

    function finishCheck() {
      var all = lanes.every(function (lane) {
        return revealedCount(lane) >= RACE_CELLS;
      });
      if (all && !doneShown) {
        doneShown = true;
        pause();
        if (said) said.hidden = false;
      }
      return all;
    }

    function frame() {
      if (!playing) return;
      var now = performance.now();
      var dt = (now - lastTs) / 1000;
      lastTs = now;
      if (dt > 0.25) dt = 0.25;
      if (dt < 0) dt = 0;
      tSim += dt;
      drawAll();
      updateStats();
      if (finishCheck()) return;
      timer = setTimeout(frame, 33);
    }

    function play() {
      if (playing) return;
      if (finishCheck()) replay();
      playing = true;
      ctrls.refresh(true);
      lastTs = performance.now();
      timer = setTimeout(frame, 33);
    }

    function pause() {
      playing = false;
      ctrls.refresh(false);
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function step() {
      pause();
      tSim += 0.4;
      drawAll();
      updateStats();
      finishCheck();
    }

    function replay() {
      tSim = 0;
      doneShown = false;
      if (said) said.hidden = true;
      lanes.forEach(function (lane) {
        lane.node.classList.remove("zo-done");
      });
      drawAll();
      updateStats();
    }

    function build(parent) {
      host = parent;
      var note = el("p", "zoo-note", "");
      note.dataset.zooKey = "race.note";
      note.dataset.zooNote = "1";
      parent.appendChild(note);
      hint = el("p", "zoo-note");
      hint.textContent = t("hint.reduced");
      hint.hidden = !REDUCED;
      parent.appendChild(hint);

      var grid = el("div", "zoo-race");
      lanes = makeLanes().map(function (def) {
        var node = el("div", "zoo-lane");
        var head = el("div", "zoo-lane-head");
        var name = el("strong", null, "");
        name.dataset.zooKey = "race.lane." + def.id;
        var sub = el("span", "zoo-lane-sub", "");
        var badge = el("span", "zoo-badge", "");
        head.appendChild(name);
        head.appendChild(sub);
        head.appendChild(badge);
        head.appendChild(el("span", "zoo-badge zo-bad-extra", ""));

        var cv = document.createElement("canvas");
        var dpr = window.devicePixelRatio || 1;
        cv.width = 168 * dpr;
        cv.height = 168 * dpr;
        var ctx = cv.getContext("2d");
        ctx.scale(dpr, dpr);

        var stats = el("div", "zoo-lane-stats");
        var pct = el("span", "zo-pct", "");
        var status = el("span", "zo-status", "");
        var speed = el("span", "zo-speed", "");
        stats.appendChild(pct);
        stats.appendChild(status);
        stats.appendChild(speed);

        node.appendChild(head);
        node.appendChild(cv);
        node.appendChild(stats);
        grid.appendChild(node);
        return {
          id: def.id,
          color: def.color,
          quant: def.quant,
          seconds: def.seconds,
          blocks: def.blocks,
          node: node,
          ctx: ctx,
          sub: sub,
          pct: pct,
          status: status,
          speed: speed,
          badge: badge,
          extra: head.children[3]
        };
      });
      parent.appendChild(grid);

      ctrls = controlsRow(
        function (refresh) {
          if (playing) pause();
          else play();
          refresh(playing);
        },
        step,
        function () {
          replay();
        }
      );
      parent.appendChild(ctrls.row);
      said = el("p", "zoo-said", "");
      said.dataset.zooKey = "race.said";
      said.hidden = true;
      parent.appendChild(said);

      applyLang();
      replay();
    }

    function applyLang() {
      if (!host) return;
      var measured = window.siteBench && window.siteBench.last ? window.siteBench.last() : null;
      var note = host.querySelector("[data-zoo-note]");
      if (note) {
        if (measured) {
          note.textContent = fmt(t("race.noteMeasured"), {
            g: measured.gflops >= 10 ? measured.gflops.toFixed(0) : measured.gflops.toFixed(1)
          });
        } else {
          note.textContent = t("race.note");
        }
      }
      hint.textContent = t("hint.reduced");
      lanes.forEach(function (lane) {
        lane.sub.textContent = fmt(t("race.sub." + lane.id), { n: RACE_VL });
        var schematic = lane.id !== "scalar" || !measured;
        lane.badge.textContent = schematic ? t("race.badge.schematic") : t("race.badge.measured");
        lane.badge.className = "zoo-badge " + (schematic ? "zo-bad-schematic" : "zo-bad-measured");
        var ratio = lane.id === "scalar" ? 1 : lane.id === "simd" ? RACE_VL : GPU_RATIO;
        lane.speed.textContent = "×" + ratio;
        if (lane.id === "gpu") {
          var slowed = Math.round(GPU_MIN_SECONDS / (RACE_SECONDS / GPU_RATIO));
          lane.extra.textContent = fmt(t("race.badge.slowed"), { f: slowed });
          lane.extra.hidden = false;
        } else {
          lane.extra.hidden = true;
        }
      });
      ctrls.refresh(playing);
      if (said) said.textContent = t("race.said");
      updateStats();
    }

    return {
      build: build,
      applyLang: applyLang,
      show: function () {
        if (REDUCED) {
          pause();
        } else {
          play();
        }
      },
      hide: pause,
      play: play
    };
  })();

  /* ---------- scene 2: inside the scalar machine ---------- */

  var scalarScene = (function () {
    var host = null;
    var ctrls = null;
    var mode = "naive";
    var ticker = null;
    var k = 0;
    var phase = 0;
    var loads = 0;
    var fmas = 0;
    var counters = null;
    var note = null;
    var said = null;
    var K_MAX = 4;

    function seeded(i) {
      var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    }
    function aVal(i, kk) {
      return (seeded(i * 7 + kk * 3) * 1.8 - 0.9).toFixed(1);
    }
    function bVal(kk, j) {
      return (seeded(kk * 11 + j * 5) * 1.8 - 0.9).toFixed(1);
    }

    function svg() {
      var s = '<svg class="zsc-svg" viewBox="0 0 660 384" focusable="false" aria-hidden="true">';
      var j;
      var i;
      for (j = 0; j < 4; j++) {
        var bx = 170 + j * 56;
        s +=
          '<g class="z-chip" id="zsc-b' + j + '"><rect x="' + bx + '" y="24" width="48" height="30" rx="4"/>' +
          '<text x="' + (bx + 24) + '" y="43">b' + j + "</text></g>";
      }
      for (i = 0; i < 4; i++) {
        var ay = 108 + i * 46;
        s +=
          '<g class="z-chip" id="zsc-a' + i + '"><rect x="38" y="' + ay + '" width="48" height="30" rx="4"/>' +
          '<text x="62" y="' + (ay + 19) + '">a' + i + "</text></g>";
        s += '<path class="z-wire" id="zsc-wa' + i + '" d="M86 ' + (ay + 15) + " L280 " + (140 + i * 12) + '"/>';
      }
      for (j = 0; j < 4; j++) {
        s +=
          '<path class="z-wire" id="zsc-wb' + j + '" d="M' +
          (194 + j * 56) + " 54 L" + (316 + j * 12) + ' 122"/>';
      }
      s += '<g class="z-pipe" id="zsc-pipe"><rect x="280" y="122" width="130" height="72" rx="8"/>';
      s += '<text x="345" y="154">FMA</text>';
      s += '<text class="z-pipe-sub" x="345" y="176" id="zsc-pipesub"></text></g>';
      s += '<path class="z-wire" d="M410 158 L494 158"/>';
      s += '<polygon points="494,153 504,158 494,163" fill="#b7af9f"/>';
      s += '<text class="z-lab" x="498" y="86" id="zsc-clab"></text>';
      for (i = 0; i < 4; i++) {
        for (j = 0; j < 4; j++) {
          s +=
            '<g class="z-cell" id="zsc-c' + i + "" + j + '"><rect x="' +
            (498 + j * 38) + '" y="' + (96 + i * 38) + '" width="34" height="34" rx="3"/></g>';
        }
      }
      s += '<text class="z-lab" x="280" y="232" id="zsc-rlab"></text>';
      for (i = 0; i < 4; i++) {
        for (j = 0; j < 4; j++) {
          s +=
            '<g class="z-reg" id="zsc-r' + i + "" + j + '"><rect x="' +
            (280 + j * 26) + '" y="' + (242 + i * 26) + '" width="22" height="22" rx="3"/></g>';
        }
      }
      s += '<g class="z-mem" id="zsc-mem"><rect x="280" y="248" width="104" height="38" rx="4"/>';
      s += '<text x="332" y="271">C[i][j] +=</text></g>';
      s += '<path class="z-mem wire" d="M345 248 L345 194" id="zsc-wmem"/>';
      s += '<text class="z-lab" x="36" y="96">A</text>';
      s += '<text class="z-lab" x="170" y="16">B · k</text>';
      s += "</svg>";
      return s;
    }

    function chipVals() {
      for (var i = 0; i < 4; i++) {
        host.querySelector("#zsc-a" + i + " text").textContent = "a" + i + " " + aVal(i, k);
      }
      for (var j = 0; j < 4; j++) {
        host.querySelector("#zsc-b" + j + " text").textContent = "b" + j + " " + bVal(k, j);
      }
    }

    function clearHot() {
      host.querySelectorAll(".z-chip.on").forEach(function (n) {
        n.classList.remove("on");
      });
      host.querySelectorAll(".z-wire.hot").forEach(function (n) {
        n.classList.remove("hot");
      });
      var pipe = host.querySelector("#zsc-pipe");
      if (pipe) pipe.classList.remove("hot");
      host.querySelectorAll(".z-reg.hot").forEach(function (n) {
        n.classList.remove("hot");
      });
    }

    function flashPipe() {
      var pipe = host.querySelector("#zsc-pipe");
      pipe.classList.add("hot");
      setTimeout(function () {
        pipe.classList.remove("hot");
      }, 110);
    }

    function pulseCell(i, j) {
      var cell = host.querySelector("#zsc-c" + i + j);
      cell.classList.add("lit", "hot");
      setTimeout(function () {
        cell.classList.remove("hot");
      }, 130);
    }

    function tick() {
      if (mode === "naive") {
        if (phase >= 16) {
          phase = 0;
          k++;
          if (k >= K_MAX) return endRun();
          chipVals();
        }
        var i = phase >> 2;
        var j = phase & 3;
        clearHot();
        host.querySelector("#zsc-a" + i).classList.add("on");
        host.querySelector("#zsc-b" + j).classList.add("on");
        host.querySelector("#zsc-wa" + i).classList.add("hot");
        host.querySelector("#zsc-wb" + j).classList.add("hot");
        host.querySelector("#zsc-wmem").classList.add("hot");
        flashPipe();
        pulseCell(i, j);
        loads += 2;
        fmas += 1;
        phase++;
        renderCounters();
        return 190;
      }
      /* blocked */
      if (phase === 0) {
        clearHot();
        for (var i2 = 0; i2 < 4; i2++) {
          host.querySelector("#zsc-a" + i2).classList.add("on");
          host.querySelector("#zsc-b" + i2).classList.add("on");
          host.querySelector("#zsc-wa" + i2).classList.add("hot");
          host.querySelector("#zsc-wb" + i2).classList.add("hot");
        }
        loads += 8;
        phase = 1;
        renderCounters();
        return 460;
      }
      clearHot();
      flashPipe();
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          host.querySelector("#zsc-r" + r + c).classList.add("hot");
          pulseCell(r, c);
        }
      }
      fmas += 16;
      phase = 0;
      k++;
      if (k >= K_MAX) {
        renderCounters();
        return endRun();
      }
      chipVals();
      renderCounters();
      return 640;
    }

    function endRun() {
      ticker.stop();
      ctrls.refresh(false);
      said.hidden = false;
      return 0;
    }

    function renderCounters() {
      counters.loads.querySelector("strong").textContent = String(loads);
      counters.fmas.querySelector("strong").textContent = String(fmas);
      counters.k.querySelector("strong").textContent = Math.min(k + 1, K_MAX) + "/" + K_MAX;
    }

    function reset() {
      ticker.stop();
      k = 0;
      phase = 0;
      loads = 0;
      fmas = 0;
      said.hidden = true;
      clearHot();
      host.querySelectorAll(".z-cell").forEach(function (n) {
        n.classList.remove("lit", "hot");
      });
      chipVals();
      renderCounters();
      ctrls.refresh(false);
      var isNaive = mode === "naive";
      host.querySelector("#zsc-mem").style.display = isNaive ? "" : "none";
      host.querySelector("#zsc-wmem").style.display = isNaive ? "" : "none";
      host.querySelectorAll('[id^="zsc-r"]').forEach(function (n) {
        n.style.display = isNaive ? "none" : "";
      });
      host.querySelector("#zsc-rlab").textContent = t(isNaive ? "sc.memlabel" : "sc.reglabel");
      host.querySelector("#zsc-pipesub").textContent = isNaive ? "1 / beat" : "16 / burst";
      note.textContent = t(isNaive ? "sc.note.naive" : "sc.note.blocked");
    }

    function setMode(next) {
      mode = next;
      host.querySelector('[data-zsc-mode="naive"]').classList.toggle("on", mode === "naive");
      host.querySelector('[data-zsc-mode="blocked"]').classList.toggle("on", mode === "blocked");
      reset();
      if (!REDUCED) {
        ticker.start();
        ctrls.refresh(true);
      }
    }

    function build(parent) {
      host = parent;
      note = el("p", "zoo-note", "");
      parent.appendChild(note);

      var wrap = el("div");
      wrap.innerHTML = svg();
      parent.appendChild(wrap);

      ctrls = controlsRow(
        function (refresh) {
          if (ticker.isRunning()) {
            ticker.stop();
            refresh(false);
          } else {
            if (k >= K_MAX) reset();
            ticker.start();
            refresh(true);
          }
        },
        function () {
          ticker.stop();
          ctrls.refresh(false);
          tick();
        },
        reset
      );
      var group = el("span", "zoo-btn-group");
      ["naive", "blocked"].forEach(function (m) {
        var b = el("button", "zoo-btn");
        b.type = "button";
        b.dataset.zscMode = m;
        b.dataset.zooKey = "sc.mode." + m;
        b.addEventListener("click", function () {
          setMode(m);
        });
        group.appendChild(b);
      });
      ctrls.row.insertBefore(group, ctrls.row.firstChild);
      parent.appendChild(ctrls.row);

      counters = { loads: null, fmas: null, k: null };
      var row = el("div", "zoo-counters");
      ["loads", "fmas", "k"].forEach(function (key) {
        var span = el("span");
        var strong = el("strong", null, "0");
        var label = el("span", null, "");
        label.dataset.zooKey = "sc." + key;
        span.appendChild(strong);
        span.appendChild(document.createTextNode(" "));
        span.appendChild(label);
        row.appendChild(span);
        counters[key] = span;
      });
      parent.appendChild(row);

      said = el("p", "zoo-said", "");
      parent.appendChild(said);
      var foot = el("p", "zoo-note", "");
      foot.dataset.zooKey = "sc.footnote";
      parent.appendChild(foot);

      ticker = new Ticker(tick);
      applyLang();
      setMode("naive");
      ticker.stop();
      ctrls.refresh(false);
    }

    function applyLang() {
      if (!host) return;
      note.textContent = t(mode === "naive" ? "sc.note.naive" : "sc.note.blocked");
      host.querySelector("#zsc-clab").textContent = "C tile · 4×4";
      host.querySelector("#zsc-rlab").textContent = t(mode === "naive" ? "sc.memlabel" : "sc.reglabel");
      host.querySelector("#zsc-pipesub").textContent = mode === "naive" ? "1 / beat" : "16 / burst";
      said.textContent = fmt(t("sc.said"), { a: 32, b: 8 });
      renderCounters();
      ctrls.refresh(ticker && ticker.isRunning());
    }

    return {
      build: build,
      applyLang: applyLang,
      show: function () {
        if (REDUCED || ticker.isRunning()) return;
        if (k >= K_MAX) reset();
        ticker.start();
        ctrls.refresh(true);
      },
      hide: function () {
        if (ticker) ticker.stop();
        if (ctrls) ctrls.refresh(false);
      }
    };
  })();

  /* ---------- scene 3: an SVE vector ---------- */

  var sveScene = (function () {
    var host = null;
    var ctrls = null;
    var note = null;
    var said = null;
    var vl = 8; /* lanes */
    var STRIP_N = 22;
    var v = 0;
    var beats = 0;
    var ghostIdx = -1;
    var ticker = null;
    var tailLine = null;
    var vsLine = null;

    function vectors() {
      return Math.ceil(STRIP_N / vl);
    }

    function tick() {
      var active = Math.max(0, Math.min(vl, STRIP_N - v * vl));
      var start = v * vl;

      var cells = host.querySelectorAll(".zve-strip .zo-cell");
      cells.forEach(function (cell, idx) {
        cell.classList.toggle("on", idx >= start && idx < start + active);
        cell.classList.toggle("cur", idx === start + active - 1);
      });

      host.querySelectorAll(".zve-p0 .zo-lane").forEach(function (lane, i) {
        lane.classList.toggle("on", i < active);
        lane.classList.toggle("off", i >= active);
      });
      ["1", "2", "0"].forEach(function (reg) {
        host.querySelectorAll('.zve-reg[data-reg="z' + reg + '"] .zo-lane').forEach(function (lane, i) {
          lane.classList.toggle("on", i < active);
          lane.classList.toggle("off", i >= active);
          if (reg === "0" && i < active) {
            lane.classList.add("pulse");
            setTimeout(function () {
              lane.classList.remove("pulse");
            }, 160);
          }
        });
      });

      ghostIdx = (ghostIdx + 1) % STRIP_N;
      host.querySelectorAll(".zve-ghost-strip .zo-cell").forEach(function (cell, idx) {
        cell.classList.toggle("cur", idx === ghostIdx);
        cell.classList.toggle("done", idx < ghostIdx);
      });

      tailLine.textContent = fmt(
        t(active === vl ? "ve.tail.full" : "ve.tail.tail"),
        active === vl ? { n: vl } : { a: active, n: vl }
      );
      beats++;
      vsLine.innerHTML = "";
      vsLine.appendChild(document.createTextNode(fmt(t("ve.vs"), { n: beats, a: beats * vl, b: beats }) + " "));

      v = (v + 1) % vectors();
      return 560;
    }

    function buildRegs() {
      var p0 = host.querySelector(".zve-p0");
      p0.innerHTML = "";
      for (var i = 0; i < vl; i++) {
        p0.appendChild(el("span", "zo-lane"));
      }
      ["z1", "z2", "z0"].forEach(function (reg) {
        var bar = host.querySelector('.zve-reg[data-reg="' + reg + '"] .zve-lanes');
        bar.innerHTML = "";
        for (var j = 0; j < vl; j++) {
          bar.appendChild(el("span", "zo-lane"));
        }
      });
    }

    function setVl(next) {
      vl = next;
      v = 0;
      beats = 0;
      ghostIdx = -1;
      buildRegs();
      host.querySelectorAll('[data-zve-vl]').forEach(function (b) {
        b.classList.toggle("on", Number(b.getAttribute("data-zve-vl")) === vl);
      });
      host.querySelector(".zve-disasm").innerHTML =
        t("ve.disasm") + '<i>' + fmt(t("ve.disasm.note"), { n: vl }) + "</i>";
      tick();
    }

    function build(parent) {
      host = parent;
      note = el("p", "zoo-note", "");
      parent.appendChild(note);

      ctrls = controlsRow(
        function (refresh) {
          if (ticker.isRunning()) {
            ticker.stop();
            refresh(false);
          } else {
            ticker.start();
            refresh(true);
          }
        },
        function () {
          ticker.stop();
          ctrls.refresh(false);
          tick();
        },
        function () {
          v = 0;
          beats = 0;
          ghostIdx = -1;
          tick();
        }
      );

      var group = el("span", "zoo-btn-group");
      [
        [128, 4],
        [256, 8],
        [512, 16]
      ].forEach(function (opt) {
        var b = el("button", "zoo-btn");
        b.type = "button";
        b.setAttribute("data-zve-vl", String(opt[1]));
        b.textContent = fmt(t("ve.vl.opt"), { b: opt[0], n: opt[1] });
        b.addEventListener("click", function () {
          ticker.stop();
          ctrls.refresh(false);
          setVl(opt[1]);
        });
        group.appendChild(b);
      });
      ctrls.row.insertBefore(group, ctrls.row.firstChild);
      parent.appendChild(ctrls.row);

      var wrap = el("div", "zve-wrap");
      var left = el("div");
      var leftLab = el("p", "zve-col-label", "");
      leftLab.dataset.zooKey = "ve.strip";
      var strip = el("div", "zve-strip");
      for (var i = 0; i < STRIP_N; i++) {
        strip.appendChild(el("span", "zo-cell", String(i)));
      }
      var ghost = el("div", "zve-ghost");
      var ghostLab = el("p", "zve-col-label", "");
      ghostLab.dataset.zooKey = "ve.ghost";
      var ghostStrip = el("div", "zve-ghost-strip");
      for (var g = 0; g < STRIP_N; g++) {
        ghostStrip.appendChild(el("span", "zo-cell", String(g)));
      }
      ghost.appendChild(ghostLab);
      ghost.appendChild(ghostStrip);
      vsLine = el("p", "zve-vs", "");
      ghost.appendChild(vsLine);
      left.appendChild(leftLab);
      left.appendChild(strip);
      left.appendChild(ghost);

      var right = el("div", "zve-regs");
      var regsLab = el("p", "zve-col-label", "");
      regsLab.dataset.zooKey = "ve.vl";
      right.appendChild(regsLab);
      var p0row = el("div", "zve-reg");
      p0row.dataset.reg = "p0";
      p0row.appendChild(el("span", null, "p0"));
      var p0lanes = el("div", "zve-lanes zve-p0");
      p0row.appendChild(p0lanes);
      right.appendChild(p0row);
      ["z1", "z2", "z0"].forEach(function (reg) {
        var row = el("div", "zve-reg");
        row.dataset.reg = reg;
        row.appendChild(el("span", null, reg));
        row.appendChild(el("div", "zve-lanes"));
        right.appendChild(row);
      });
      var disasm = el("p", "zve-disasm");
      right.appendChild(disasm);
      tailLine = el("p", "zve-tail", "");
      right.appendChild(tailLine);

      wrap.appendChild(left);
      wrap.appendChild(right);
      parent.appendChild(wrap);

      said = el("p", "zoo-said", "");
      said.dataset.zooKey = "ve.said";
      parent.appendChild(said);

      ticker = new Ticker(tick);
      applyLang();
      setVl(8);
      ticker.stop();
      ctrls.refresh(false);
    }

    function applyLang() {
      if (!host) return;
      note.textContent = t("ve.heading");
      vsLine.textContent = fmt(t("ve.vs"), { n: beats, a: beats * vl, b: beats });
      said.textContent = t("ve.said");
      host.querySelectorAll("[data-zve-vl]").forEach(function (b) {
        var n = Number(b.getAttribute("data-zve-vl"));
        b.textContent = fmt(t("ve.vl.opt"), { b: n * 32, n: n });
      });
      host.querySelector(".zve-disasm").innerHTML =
        t("ve.disasm") + '<i>' + fmt(t("ve.disasm.note"), { n: vl }) + "</i>";
      ctrls.refresh(ticker && ticker.isRunning());
    }

    return {
      build: build,
      applyLang: applyLang,
      show: function () {
        if (REDUCED || ticker.isRunning()) return;
        ticker.start();
        ctrls.refresh(true);
      },
      hide: function () {
        if (ticker) ticker.stop();
        if (ctrls) ctrls.refresh(false);
      }
    };
  })();

  scenes.race = race;
  scenes.scalar = scalarScene;
  scenes.sve = sveScene;

  /* ---------- "see why →" links after a bench result ---------- */

  function syncWhyLinks(detail) {
    var hasResult = detail || (window.siteBench && window.siteBench.last ? window.siteBench.last() : null);
    document.querySelectorAll("[data-bench-label]").forEach(function (btn) {
      var existing = btn.parentElement.querySelector(".zoo-why");
      if (hasResult && !existing) {
        var why = el("button", "zoo-why", t("why"));
        why.type = "button";
        why.addEventListener("click", openZoo);
        btn.insertAdjacentElement("afterend", why);
      } else if (hasResult && existing) {
        existing.textContent = t("why");
      } else if (!hasResult && existing) {
        existing.remove();
      }
    });
  }

  document.addEventListener("site-lang", function () {
    applyLang();
    syncWhyLinks(null);
  });
  document.addEventListener("site-bench", function (e) {
    syncWhyLinks(e.detail || null);
  });
  syncWhyLinks(null);

  window.siteZoo = { open: openZoo, isOpen: isOpen };
})();
