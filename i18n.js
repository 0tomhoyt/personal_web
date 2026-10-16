(function () {
  var STORAGE_KEY = "site-lang";

  var STRINGS = {
    en: {
      "meta.title": "Hou Yuteng · ARM kernels and AI systems that run",
      "meta.description":
        "Hou Yuteng (侯宇腾), Harbin Institute of Technology, Shenzhen, and KU Leuven (Cum Laude). GEMM and attention on ARM SME/SVE, plus HPC, AI agents, and model deployment.",
      "meta.ogTitle": "Hou Yuteng",
      "meta.ogDescription":
        "Harbin Institute of Technology, Shenzhen, and KU Leuven (Cum Laude). GEMM and attention on ARM SME/SVE, plus HPC, AI agents, and model deployment.",
      "meta.ogAlt": "Hou Yuteng — ARM, HPC, and AI systems that run",
      "meta.ogLocale": "en_US",
      "meta.ogLocaleAlt": "zh_CN",
      "meta.twitterDescription":
        "GEMM and attention on ARM SME/SVE, plus HPC, AI agents, and model deployment.",
      "meta.siteName": "Hou Yuteng",
      "skip": "Skip to main content",
      "nav.top": "Back to top",
      "nav.label": "Primary",
      "nav.about": "About",
      "nav.projects": "Projects",
      "nav.contact": "Contact",
      "lang.label": "Language",
      "hero.eyebrow": "Personal site",
      "hero.name": "Hou Yuteng",
      "hero.sub": "侯宇腾",
      "hero.intro":
        "High-performance kernels on ARM SME/SVE, and AI systems that actually run. Graduated from Harbin Institute of Technology, Shenzhen, and KU Leuven (Cum Laude).",
      "hero.projects": "View projects",
      "hero.email": "Email me",
      "hero.bench": "bench this device",
      "about.title": "About",
      "about.lead":
        "GEMM and attention on ARM SME/SVE, and HPC, AI agents, and model deployment brought together into systems that run.",
      "focus.label": "Focus areas",
      "focus.1.title": "ARM / HPC",
      "focus.1.body": "UniGEMM, GEMM, and attention on SME/SVE",
      "focus.2.title": "AI agents",
      "focus.2.body": "Tool use, remote execution, and agent workflows",
      "focus.3.title": "Model deployment",
      "focus.3.body": "Local inference, ARM platforms, and performance checks",
      "facts.education": "Education",
      "facts.experience": "Experience",
      "facts.paper": "Paper",
      "edu.1": "Harbin Institute of Technology, Shenzhen · B.Eng. in Electronics and Information Engineering",
      "edu.2": "KU Leuven · B.Sc. in Engineering Technology, joint program",
      "edu.3": "KU Leuven · M.Sc. in Engineering Technology, Software Systems · Cum Laude",
      "exp.now": "2025–present",
      "exp.same": "Same period",
      "exp.1":
        "UniGEMM, GEMM, and attention on ARM SME/SVE: multi-precision assembly generation, core GEMM kernels above 95% of theoretical peak, and memory-access and compute optimizations across several attention variants.",
      "exp.2": "MPI and UCX performance work in HPC settings, and maintenance of KBLAS and Eigen.",
      "exp.3":
        "Stability after model deployment: monitoring input distributions and output anomalies to reduce concept drift.",
      "projects.title": "Projects",
      "projects.lead": "A few public projects",
      "projects.all": "View all repositories",
      "project.1":
        "A local API in front of the CANNBot gateway. OpenAI requests pass through unchanged; Anthropic Messages are translated in both directions. Credentials are injected at call time, so a local agent does not keep secrets in its config. An admin console shows usage and latency such as TTFT and TPOT.",
      "project.2":
        "Offline deployment of Qwen3.6-35B-A3B on the Kunpeng 920 (ARM CPU). Built and run with llama.cpp, with no Python runtime.",
      "project.3":
        "A remote-execution framework for AI-assisted development. The build machine submits tasks and artifacts; a worker on the execution machine pulls them, runs them, and returns logs. When the two sides cannot reach each other, a relay queue carries the handoff.",
      "project.4":
        "Numerical checks for GEMM on ARM. One codebase covers macOS development machines and ARM64 servers, with a compile-time switch for HBM and comparisons across FP32, FP16, and BF16.",
      "project.5":
        "Chinese reading notes on large-model papers, arranged by topic — from surveys through architecture and training — with explanations of the harder ideas.",
      "project.6":
        "A library of Chinese technical notes. Each topic is layered as a design note, an outline, and a finished draft. The current subject is low-level CPU software in the agent era, with figures cited to their sources.",
      "contact.title": "Contact",
      "contact.eyebrow": "Say hello",
      "contact.lead": "Have an idea, or want to talk?<br>Send a note.",
      "footer.name": "Hou Yuteng / 侯宇腾",
      "footer.bench": "run a kernel",
      "footer.benchRun": "computing…",
      "footer.benchFmt": "{g} GFLOPS ≈ {p}% of an M4 P-core",
      "footer.benchTip": "FP64 GEMM, N=384, best of 3, single thread, scalar JavaScript — no SIMD, so a few percent of the hardware peak is normal. Reference: M4 P-core FP64 peak ≈ 35 GFLOPS.",
      "footer.term": "Open terminal (or press ~)",
      "term.label": "Terminal",
      "term.close": "Close terminal"
    },
    zh: {
      "meta.title": "侯宇腾 / Hou Yuteng · ARM 与可运行的 AI 系统",
      "meta.description":
        "侯宇腾（Hou Yuteng），哈尔滨工业大学（深圳）与 KU Leuven（Cum Laude）。方向是 ARM SME/SVE 上的 GEMM 与 Attention，以及 HPC、AI agent 和模型部署。",
      "meta.ogTitle": "侯宇腾 / Hou Yuteng",
      "meta.ogDescription":
        "哈尔滨工业大学（深圳）与 KU Leuven（Cum Laude）。ARM SME/SVE 上的 GEMM 与 Attention，以及 HPC、AI agent 和模型部署。",
      "meta.ogAlt": "侯宇腾 / Hou Yuteng，ARM、HPC 与可运行的 AI 系统",
      "meta.ogLocale": "zh_CN",
      "meta.ogLocaleAlt": "en_US",
      "meta.twitterDescription": "ARM SME/SVE 上的 GEMM 与 Attention，以及 HPC、AI agent 和模型部署。",
      "meta.siteName": "侯宇腾 / Hou Yuteng",
      "skip": "跳到主要内容",
      "nav.top": "返回页面顶部",
      "nav.label": "主导航",
      "nav.about": "关于",
      "nav.projects": "项目",
      "nav.contact": "联系",
      "lang.label": "语言",
      "hero.eyebrow": "个人网站",
      "hero.name": "侯宇腾",
      "hero.sub": "Hou Yuteng",
      "hero.intro":
        "做 ARM SME/SVE 上的高性能算子，也做能跑起来的 AI 系统。毕业于哈尔滨工业大学（深圳）与 KU Leuven（Cum Laude）。",
      "hero.projects": "查看项目",
      "hero.email": "给我邮件",
      "hero.bench": "跑个基准",
      "about.title": "关于",
      "about.lead":
        "在 ARM SME/SVE 上做 GEMM 与 Attention，也把 HPC、AI agent 和模型部署收成可以运行的系统。",
      "focus.label": "关注方向",
      "focus.1.title": "ARM / HPC",
      "focus.1.body": "SME/SVE 上的 UniGEMM、GEMM 与 Attention",
      "focus.2.title": "AI Agent",
      "focus.2.body": "工具调用、远端执行与智能体工作流",
      "focus.3.title": "模型部署",
      "focus.3.body": "本地推理、ARM 平台与性能验证",
      "facts.education": "教育",
      "facts.experience": "经历",
      "facts.paper": "论文",
      "edu.1": "哈尔滨工业大学（深圳） · 电子与信息工程学士",
      "edu.2": "KU Leuven · 工程科技学士，联合培养",
      "edu.3": "KU Leuven · 工程科技硕士，软件系统 · Cum Laude",
      "exp.now": "2025–今",
      "exp.same": "同期",
      "exp.1":
        "ARM SME/SVE 上的 UniGEMM / GEMM 与 Attention：多精度汇编生成，核心 GEMM 内核到理论峰值的 95% 以上，并优化多种 Attention 的访存与计算。",
      "exp.2": "HPC 场景里的 MPI / UCX 性能工作，以及 KBLAS、Eigen 的维护。",
      "exp.3": "模型部署之后的稳定性：监控输入分布和输出异常，减少 concept drift。",
      "projects.title": "项目",
      "projects.lead": "一些公开项目",
      "projects.all": "查看全部仓库",
      "project.1":
        "把 CANNBot 网关收成本地 API。OpenAI 请求原样透传，Anthropic Messages 做双向翻译，调用时再注入凭证，本机 agent 不必把密钥写进配置。自带管理台，可看用量和 TTFT、TPOT 等延迟。",
      "project.2": "Qwen3.6-35B-A3B 在鲲鹏 920（ARM CPU）上的离线部署。基于 llama.cpp 编译运行，不依赖 Python。",
      "project.3":
        "给 AI 辅助开发用的远端执行框架。编译机提交任务和产物，执行机上的 worker 拉取运行并回传日志；两边网络不通时，用中转队列接力。",
      "project.4":
        "核对 ARM 上 GEMM 的数值是否正确。同一套代码覆盖 macOS 开发机和 ARM64 服务器，可用编译开关切到 HBM，对照 FP32、FP16 和 BF16。",
      "project.5": "按主题整理的大模型论文中文阅读笔记，从综述写到架构与训练，并解释难懂的概念。",
      "project.6":
        "中文技术笔记库。同一主题按设计说明、大纲和成稿分层；目前写的是 Agent 时代的 CPU 底层软件，数字带出处。",
      "contact.title": "联系",
      "contact.eyebrow": "保持联系",
      "contact.lead": "有想法或想聊聊？<br>欢迎发来邮件。",
      "footer.name": "侯宇腾 / Hou Yuteng",
      "footer.bench": "跑一个内核",
      "footer.benchRun": "计算中…",
      "footer.benchFmt": "{g} GFLOPS ≈ M4 单核 P-core 的 {p}%",
      "footer.benchTip": "FP64 GEMM，N=384，3 次取最优，单线程标量 JavaScript——没有 SIMD，只有硬件峰值的几个百分点属正常。参照：M4 P-core FP64 峰值 ≈ 35 GFLOPS。",
      "footer.term": "打开终端（或按 ~）",
      "term.label": "终端",
      "term.close": "关闭终端"
    }
  };

  function readLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (error) {
      return "en";
    }
    return "en";
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      /* Private mode and blocked storage still switch for this view. */
    }
  }

  var current = "en";

  function apply(lang) {
    current = lang === "zh" ? "zh" : "en";
    var pack = STRINGS[current] || STRINGS.en;
    document.documentElement.lang = current === "zh" ? "zh-Hans" : "en";

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (pack[key] != null) node.textContent = pack[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-html");
      if (pack[key] != null) node.innerHTML = pack[key];
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-aria");
      if (pack[key] != null) node.setAttribute("aria-label", pack[key]);
    });

    document.querySelectorAll("[data-i18n-content]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-content");
      if (pack[key] != null) node.setAttribute("content", pack[key]);
    });

    if (pack["meta.title"]) document.title = pack["meta.title"];

    document.querySelectorAll(".lang-switch button").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-lang") === current ? "true" : "false");
    });

    document.dispatchEvent(new CustomEvent("site-lang", { detail: { lang: current } }));
  }

  window.siteI18n = {
    lang: function () {
      return current;
    },
    t: function (key) {
      return (STRINGS[current] || STRINGS.en)[key];
    }
  };

  var initial = readLang();
  try {
    apply(initial);
  } finally {
    document.documentElement.classList.remove("i18n-wait");
  }

  document.querySelectorAll(".lang-switch button").forEach(function (button) {
    button.addEventListener("click", function () {
      var lang = button.getAttribute("data-lang");
      if (lang !== "en" && lang !== "zh") return;
      apply(lang);
      storeLang(lang);
    });
  });
})();
