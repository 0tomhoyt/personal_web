/* Easter eggs, in order of subtlety:
   1. a scalar FP64 GEMM bench behind the "run a kernel" footer link
   2. an SVE FMLA animation on the hero mark (hover / click)
   3. a read-only terminal (~ or the >_ footer link)
   Depends on i18n.js exposing window.siteI18n and firing "site-lang". */
(function () {
  "use strict";

  var REDUCED = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function lang() {
    return window.siteI18n && window.siteI18n.lang ? window.siteI18n.lang() : "en";
  }

  function t(key, fallback) {
    var v = window.siteI18n && window.siteI18n.t ? window.siteI18n.t(key) : null;
    return v != null ? v : fallback != null ? fallback : key;
  }

  /* ---------- GEMM bench ---------- */

  var M4_PCORE_FP64 = 35; // GFLOPS: 4 SIMD pipes x 2 FP64 lanes x ~4.4 GHz
  var BENCH_N = 384;

  function fillRandom(a) {
    for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }

  function gemm(n, A, B, C) {
    // 4x4 register blocking, i-k-j: four B values feed sixteen FMAs, the C
    // tile stays hot, and the sixteen chains keep the pipes busy in a JIT.
    for (var i = 0; i < n - 3; i += 4) {
      var c0 = i * n, c1 = c0 + n, c2 = c1 + n, c3 = c2 + n;
      for (var k = 0; k < n; k++) {
        var a0 = A[c0 + k], a1 = A[c1 + k], a2 = A[c2 + k], a3 = A[c3 + k];
        var bo = k * n;
        var j = 0;
        for (; j + 3 < n; j += 4) {
          var b0 = B[bo + j], b1 = B[bo + j + 1], b2 = B[bo + j + 2], b3 = B[bo + j + 3];
          C[c0 + j] += a0 * b0; C[c0 + j + 1] += a0 * b1; C[c0 + j + 2] += a0 * b2; C[c0 + j + 3] += a0 * b3;
          C[c1 + j] += a1 * b0; C[c1 + j + 1] += a1 * b1; C[c1 + j + 2] += a1 * b2; C[c1 + j + 3] += a1 * b3;
          C[c2 + j] += a2 * b0; C[c2 + j + 1] += a2 * b1; C[c2 + j + 2] += a2 * b2; C[c2 + j + 3] += a2 * b3;
          C[c3 + j] += a3 * b0; C[c3 + j + 1] += a3 * b1; C[c3 + j + 2] += a3 * b2; C[c3 + j + 3] += a3 * b3;
        }
        for (; j < n; j++) {
          var b = B[bo + j];
          C[c0 + j] += a0 * b; C[c1 + j] += a1 * b; C[c2 + j] += a2 * b; C[c3 + j] += a3 * b;
        }
      }
    }
  }

  function timedRun(n, A, B, C) {
    C.fill(0);
    var start = performance.now();
    gemm(n, A, B, C);
    var ms = performance.now() - start;
    return (2 * n * n * n) / (ms / 1000) / 1e9;
  }

  function checkDot(n, A, B, C) {
    var ref = 0;
    for (var k = 0; k < n; k++) ref += A[k] * B[17 + k * n];
    return Math.abs(C[17] - ref) <= 1e-8 * (1 + Math.abs(ref));
  }

  function runBench() {
    var w = 96;
    var A = new Float64Array(w * w);
    var B = new Float64Array(w * w);
    var C = new Float64Array(w * w);
    fillRandom(A);
    fillRandom(B);
    timedRun(w, A, B, C); /* JIT warmup, untimed */

    var n = BENCH_N;
    var A2 = new Float64Array(n * n);
    var B2 = new Float64Array(n * n);
    var C2 = new Float64Array(n * n);
    fillRandom(A2);
    fillRandom(B2);

    var best = 0;
    var chain = Promise.resolve();
    for (var i = 0; i < 3; i++) {
      chain = chain
        .then(function () {
          return new Promise(function (resolve) { setTimeout(resolve, 30); });
        })
        .then(function () {
          var g = timedRun(n, A2, B2, C2);
          if (g > best) best = g;
        });
    }
    return chain.then(function () {
      var res = { gflops: best, ok: checkDot(n, A2, B2, C2) };
      benchLast = res;
      document.dispatchEvent(new CustomEvent("site-bench", { detail: res }));
      return res;
    });
  }

  function benchNumbers(res) {
    return {
      g: res.gflops >= 10 ? res.gflops.toFixed(0) : res.gflops.toFixed(1),
      p: String(Math.max(1, Math.round((res.gflops / M4_PCORE_FP64) * 100)))
    };
  }

  function benchResultLine(res) {
    var v = benchNumbers(res);
    return t("footer.benchFmt", "{g} GFLOPS").replace("{g}", v.g).replace("{p}", v.p);
  }

  var benchBtns = Array.prototype.slice.call(document.querySelectorAll("[data-bench-label]"));
  var benchBusy = false;
  var benchLast = null;

  /* the kernel zoo (zoo.js) reads the last bench result for its captions */
  window.siteBench = {
    run: runBench,
    last: function () { return benchLast; }
  };

  function refreshBenchUi() {
    benchBtns.forEach(function (btn) {
      btn.title = t("footer.benchTip", "");
      if (!benchBusy) {
        btn.textContent = benchLast ? benchResultLine(benchLast) : t(btn.getAttribute("data-bench-label"));
      }
    });
  }

  function bindBench() {
    if (!benchBtns.length) return;
    benchBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (benchBusy) return;
        benchBusy = true;
        benchBtns.forEach(function (b) {
          b.classList.add("busy");
          b.textContent = t("footer.benchRun", "computing…");
        });
        runBench().then(function (res) {
          benchLast = res;
          benchBusy = false;
          benchBtns.forEach(function (b) { b.classList.remove("busy"); });
          refreshBenchUi();
        });
      });
    });
    document.addEventListener("site-lang", refreshBenchUi);
    refreshBenchUi();
  }

  /* ---------- hero mark: SME animation trigger ----------
     The mark stays "open" (ZA tile filled, seal away) for as long as the
     pointer rests on it; leaving resets to the seal. A click replays. On
     touch devices there is no pointer to move away, so it auto-resets. */

  function bindMark() {
    var mark = document.querySelector(".hero-mark");
    if (!mark) return;
    var canHover = window.matchMedia ? window.matchMedia("(hover: hover)").matches : false;
    var holdTimer = null;

    function stop() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      mark.classList.remove("playing");
    }

    function play() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      mark.classList.remove("playing");
      void mark.offsetWidth; /* restart the CSS animation */
      mark.classList.add("playing");
    }

    mark.addEventListener("click", function () {
      if (REDUCED) return;
      play();
      if (!canHover) holdTimer = setTimeout(stop, 3600);
    });

    if (canHover) {
      mark.addEventListener("mouseenter", function () {
        if (!REDUCED) play();
      });
      mark.addEventListener("mouseleave", stop);
    }
  }

  /* ---------- mini terminal ---------- */

  var TERMINAL_STRINGS = {
    en: {
      welcome: "guest@hoyuteng — a read-only shell. type 'help' to look around.",
      help:
        "help              this list\n" +
        "whoami            who is asking\n" +
        "ls [projects]     look around\n" +
        "cat <file>        education.md · paper.md · contact.txt\n" +
        "neofetch          the machine introduces itself\n" +
        "gemm              run a small FP64 GEMM benchmark\n" +
        "zoo               how one GEMM gets eaten three ways\n" +
        "sudo <cmd>        try your luck\n" +
        "clear · exit      housekeeping",
      whoami: "guest (read-only access; curiosity assumed)",
      lsRoot: "education.md   paper.md   contact.txt   projects/",
      lsProjects:
        "cannbot-gateway-proxy   cpu_model_deploy   agent_remote\n" +
        "gemmtest   LLM_papers   agent_knowledge",
      lsMissing: "ls: {arg}: no such file or directory",
      catUsage: "cat: usage: cat <education.md | paper.md | contact.txt>",
      catMissing: "cat: no such file: {file}",
      catDir: "cat: projects/: is a directory",
      catResume: "cat: resume: the resume stays private. public facts live in education.md and paper.md",
      catEducation:
        "2019–2024  Harbin Institute of Technology (Shenzhen) · B.Eng. Electronics and Information Engineering\n" +
        "2021–2023  KU Leuven · B.Sc. Engineering Technology, joint program\n" +
        "2023–2024  KU Leuven · M.Sc. Engineering Technology, Software Systems · Cum Laude",
      catPaper:
        "Data Augmentation Using Language Models for Event-Driven Stock\n" +
        "Prediction Sentiment Analysis\n" +
        "AEMR 2023 · DOI 10.56028/aemr.8.1.298.2023\n" +
        "https://doi.org/10.56028/aemr.8.1.298.2023",
      catContact: "email   tomhoyt88@gmail.com\ngithub  https://github.com/0tomhoyt",
      sudo: "Permission denied: this operation requires an SSH key.",
      notFound: "zsh: command not found: {cmd} (try 'help')",
      uname: "{platform} (allegedly)",
      gemmIntro: "running FP64 GEMM · N=384 · best of 3 …",
      gemmCheck: "numerics: C[0,17] matches its dot-product reference",
      gemmCheckBad: "numerics: C[0,17] disagrees with its reference — JIT gremlins",
      gemmResult: "{g} GFLOPS ≈ {p}% of an M4 P-core (FP64 peak ≈ 35)",
      zooLine: "opening the kernel zoo …",
      shellLine: "sh, emulated in good faith",
      memoryGuess: "{g} GB (browser's guess)",
      memoryQuiet: "not telling",
      threads: "{n} threads (reported)",
      thisTab: "{t} (this tab)",
      langLine: "{site} · {browser}"
    },
    zh: {
      welcome: "guest@hoyuteng —— 一个只读 shell。输入 'help' 到处看看。",
      help:
        "help              本列表\n" +
        "whoami            你是谁\n" +
        "ls [projects]     到处看看\n" +
        "cat <文件>        education.md · paper.md · contact.txt\n" +
        "neofetch          让这台机器自我介绍\n" +
        "gemm              跑一个小的 FP64 GEMM 基准测试\n" +
        "zoo               同一个 GEMM 的三种吃法\n" +
        "sudo <命令>       碰碰运气\n" +
        "clear · exit      收尾",
      whoami: "guest（只读权限；默认你有点好奇）",
      lsRoot: "education.md   paper.md   contact.txt   projects/",
      lsProjects:
        "cannbot-gateway-proxy   cpu_model_deploy   agent_remote\n" +
        "gemmtest   LLM_papers   agent_knowledge",
      lsMissing: "ls: {arg}: 没有那个文件或目录",
      catUsage: "cat：用法：cat <education.md | paper.md | contact.txt>",
      catMissing: "cat：没有这个文件：{file}",
      catDir: "cat：projects/ 是一个目录",
      catResume: "cat：resume：简历不公开。公开的事实都在 education.md 和 paper.md 里",
      catEducation:
        "2019–2024  哈尔滨工业大学（深圳） · 电子与信息工程学士\n" +
        "2021–2023  KU Leuven · 工程科技学士（联合培养）\n" +
        "2023–2024  KU Leuven · 工程科技硕士 · 软件系统 · Cum Laude",
      catPaper:
        "Data Augmentation Using Language Models for Event-Driven Stock\n" +
        "Prediction Sentiment Analysis\n" +
        "AEMR 2023 · DOI 10.56028/aemr.8.1.298.2023\n" +
        "https://doi.org/10.56028/aemr.8.1.298.2023",
      catContact: "email   tomhoyt88@gmail.com\ngithub  https://github.com/0tomhoyt",
      sudo: "Permission denied: 此操作需要 SSH 密钥。",
      notFound: "zsh: command not found: {cmd}（试试 'help'）",
      uname: "{platform}（据它自己说）",
      gemmIntro: "正在跑 FP64 GEMM · N=384 · 3 次取最优 …",
      gemmCheck: "数值：C[0,17] 与点积参考值一致",
      gemmCheckBad: "数值：C[0,17] 与参考值不一致 —— JIT 的小妖精",
      gemmResult: "{g} GFLOPS ≈ M4 单核 P-core 的 {p}%（FP64 峰值 ≈ 35）",
      zooLine: "正在打开算子动物园 …",
      shellLine: "sh，尽力模拟中",
      memoryGuess: "{g} GB（浏览器猜的）",
      memoryQuiet: "它不肯说",
      threads: "{n} 个线程（它自己报的）",
      thisTab: "{t}（这个标签页）",
      langLine: "{site} · {browser}"
    }
  };

  function tt(key) {
    var pack = TERMINAL_STRINGS[lang()] || TERMINAL_STRINGS.en;
    return pack[key] != null ? pack[key] : TERMINAL_STRINGS.en[key];
  }

  var NEOFETCH_ART = [
    "  ┌────────────────┐  ",
    "  │                │  ",
    "  │       侯       │  ",
    "  │                │  ",
    "  └────────────────┘  ",
    "                      ",
    "  Y U T E N G  H O U  ",
    "                      "
  ];

  function browserName() {
    var ua = navigator.userAgent;
    var m;
    if ((m = ua.match(/Edg\/([\d.]+)/))) return "Edge " + m[1];
    if ((m = ua.match(/OPR\/([\d.]+)/))) return "Opera " + m[1];
    if ((m = ua.match(/Firefox\/([\d.]+)/))) return "Firefox " + m[1];
    if ((m = ua.match(/Chrome\/([\d.]+)/))) return "Chrome " + m[1];
    if ((m = ua.match(/Version\/([\d.]+).*Safari/))) return "Safari " + m[1];
    return "a browser";
  }

  function osName() {
    var ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return "iOS";
    if (/iPad/.test(ua)) return "iPadOS";
    if (/Android/.test(ua)) return "Android";
    if (/CrOS/.test(ua)) return "ChromeOS";
    if (/Windows/.test(ua)) return "Windows" + (/ARM/.test(ua) ? " (ARM64)" : "");
    if (/Mac/.test(ua)) return "macOS";
    if (/Linux/.test(ua)) return "Linux" + (/arm|aarch/i.test(ua + " " + navigator.platform) ? " (ARM)" : "");
    return "somewhere";
  }

  function uptimeText() {
    var s = Math.max(0, Math.floor((Date.now() - performance.timeOrigin) / 1000));
    return Math.floor(s / 60) + "m " + (s % 60) + "s";
  }

  function neofetchLines() {
    var mem = navigator.deviceMemory
      ? tt("memoryGuess").replace("{g}", String(navigator.deviceMemory))
      : tt("memoryQuiet");
    var info = [
      ["", "guest@hoyuteng"],
      ["", "──────────────"],
      ["OS", osName()],
      ["Host", browserName()],
      ["Uptime", tt("thisTab").replace("{t}", uptimeText())],
      ["Shell", tt("shellLine")],
      ["CPU", tt("threads").replace("{n}", String(navigator.hardwareConcurrency || "?"))],
      ["Memory", mem],
      ["Display", screen.width + "×" + screen.height + " @" + (window.devicePixelRatio || 1) + "x"],
      ["Lang", tt("langLine").replace("{site}", lang()).replace("{browser}", navigator.language || "?")]
    ];
    var rows = Math.max(NEOFETCH_ART.length, info.length);
    var lines = [];
    for (var i = 0; i < rows; i++) {
      var art = NEOFETCH_ART[i] || "                      ";
      var pair = info[i];
      var right = pair ? (pair[0] ? pair[0].padEnd(9) + pair[1] : pair[1]) : "";
      lines.push({ text: art + "  " + right, cls: i === 0 ? "t-acc" : i === 1 ? "t-dim" : "" });
    }
    return lines;
  }

  var term = document.getElementById("terminal");
  var termBody = document.getElementById("terminal-body");
  var termInput = document.getElementById("terminal-input");
  var termOpenBtn = document.getElementById("term-btn");
  var termCloseBtn = document.getElementById("terminal-close");
  var termOpenState = false;
  var termBooted = false;
  var termHistory = [];
  var histIdx = 0;
  var lastFocus = null;

  function scrollTerm() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  function print(text, cls) {
    var div = document.createElement("div");
    div.className = "t-line" + (cls ? " " + cls : "");
    div.textContent = text;
    termBody.appendChild(div);
    scrollTerm();
  }

  function printSwatches() {
    var colors = ["#f2efe8", "#e7e1d4", "#cdc6b8", "#5c5952", "#1a1916", "#b23e24", "#cf4d2f"];
    var div = document.createElement("div");
    div.className = "t-line";
    colors.forEach(function (c) {
      var sw = document.createElement("span");
      sw.className = "t-sw";
      sw.style.background = c;
      div.appendChild(sw);
    });
    termBody.appendChild(div);
    scrollTerm();
  }

  function echo(cmdText) {
    var div = document.createElement("div");
    div.className = "t-line";
    var user = document.createElement("span");
    user.className = "t-user";
    user.textContent = "guest@hoyuteng";
    var path = document.createElement("span");
    path.className = "t-path";
    path.textContent = ":~$ ";
    var cmd = document.createElement("span");
    cmd.className = "t-cmd";
    cmd.textContent = cmdText;
    div.appendChild(user);
    div.appendChild(path);
    div.appendChild(cmd);
    termBody.appendChild(div);
    scrollTerm();
  }

  function catFile(name) {
    var n = name.replace(/^\.?\//, "");
    if (n === "projects" || n === "projects/") return { text: tt("catDir"), cls: "t-dim" };
    if (n === "resume" || n === "resume.md" || n === "resume.pdf" || n === "cv" || n === "cv.md") {
      return { text: tt("catResume") };
    }
    var map = {
      "education": "catEducation",
      "education.md": "catEducation",
      "paper": "catPaper",
      "paper.md": "catPaper",
      "contact": "catContact",
      "contact.txt": "catContact"
    };
    var key = map[n];
    return key ? { text: tt(key) } : null;
  }

  function runCommand(raw) {
    echo(raw);
    var line = raw.trim();
    if (!line) return;
    termHistory.push(line);
    histIdx = termHistory.length;
    var parts = line.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts[1];

    if (cmd === "help") {
      print(tt("help"));
    } else if (cmd === "whoami") {
      print(tt("whoami"));
    } else if (cmd === "ls") {
      if (!arg) print(tt("lsRoot"));
      else if (arg === "projects" || arg === "projects/") print(tt("lsProjects"));
      else print(tt("lsMissing").replace("{arg}", arg), "t-dim");
    } else if (cmd === "cat") {
      if (!arg) print(tt("catUsage"), "t-dim");
      else {
        var f = catFile(arg);
        if (f) print(f.text, f.cls);
        else print(tt("catMissing").replace("{file}", arg), "t-dim");
      }
    } else if (cmd === "neofetch") {
      neofetchLines().forEach(function (l) { print(l.text, l.cls); });
      printSwatches();
    } else if (cmd === "sudo") {
      print(tt("sudo"), "t-err");
    } else if (cmd === "gemm") {
      print(tt("gemmIntro"), "t-dim");
      runBench().then(function (res) {
        print(res.ok ? tt("gemmCheck") : tt("gemmCheckBad"), res.ok ? "t-dim" : "t-err");
        var v = benchNumbers(res);
        print(tt("gemmResult").replace("{g}", v.g).replace("{p}", v.p), "t-acc");
      });
    } else if (cmd === "zoo") {
      print(tt("zooLine"), "t-dim");
      if (window.siteZoo && window.siteZoo.open) window.siteZoo.open();
    } else if (cmd === "clear") {
      termBody.innerHTML = "";
    } else if (cmd === "exit" || cmd === "quit" || cmd === "close" || cmd === ":q") {
      closeTerm();
    } else if (cmd === "uname") {
      print(tt("uname").replace("{platform}", navigator.platform || osName()));
    } else {
      print(tt("notFound").replace("{cmd}", cmd), "t-dim");
    }
  }

  function openTerm() {
    if (!term || !termInput) return;
    if (!termOpenState) {
      termOpenState = true;
      lastFocus = document.activeElement;
      term.classList.add("open");
    }
    if (!termBooted) {
      termBooted = true;
      print(tt("welcome"), "t-dim");
    }
    /* focus() is a no-op while the panel is still visibility:hidden in its
       opening transition, so let the style recalc land first */
    setTimeout(function () {
      if (termOpenState) termInput.focus({ preventScroll: true });
    }, 40);
  }

  function closeTerm() {
    if (!term || !termOpenState) return;
    termOpenState = false;
    term.classList.remove("open");
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (error) {}
    }
  }

  function bindTerminal() {
    if (!term || !termBody || !termInput) return;
    if (termOpenBtn) termOpenBtn.addEventListener("click", openTerm);
    if (termCloseBtn) termCloseBtn.addEventListener("click", closeTerm);

    term.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      if (String(window.getSelection()) !== "") return;
      termInput.focus({ preventScroll: true });
    });

    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var value = termInput.value;
        termInput.value = "";
        runCommand(value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histIdx > 0) {
          histIdx--;
          termInput.value = termHistory[histIdx] || "";
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < termHistory.length) {
          histIdx++;
          termInput.value = termHistory[histIdx] || "";
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (termOpenState) {
          e.preventDefault();
          closeTerm();
        }
        return;
      }
      if ((e.key === "`" || e.key === "~") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var el = e.target;
        var typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
        if (typing) return; /* let ` be typed inside the shell itself */
        e.preventDefault();
        if (termOpenState) closeTerm();
        else openTerm();
      }
    });
  }

  bindBench();
  bindMark();
  bindTerminal();
})();
