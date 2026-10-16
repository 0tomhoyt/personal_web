# personal_web

侯宇腾 / Hou Yuteng 的个人网站。静态页面：`index.html`、`styles.css`、`i18n.js`、`extras.js`，以及「算子动物园」`zoo.js` / `zoo.css`。

默认语言是英文。页眉的 EN / 中文 切换整页文案，不刷新页面，选择记在 `localStorage`（`site-lang`）。中文沿用原先的公开简介。

## 彩蛋

- 访客设备「跑分」：hero 的「bench this device / 跑个基准」按钮（footer 的「run a kernel / 跑一个内核」是同一入口）在访客浏览器里现场跑一个 N=384 的单线程标量 FP64 GEMM（4×4 寄存器分块），给出 GFLOPS，并换算成 M4 单核 P-core（FP64 峰值 ≈ 35 GFLOPS）的百分比，附数值自检。
- 首页「侯」字圆盘：hover 或点击播放一段 SME 风格动画——z0.s（行）与 z1.s（列）两个操作数向量做外积，按对角线波前累加进 4×4 的 ZA tile，配文 `fmopa za.s[w11, 0], p0/m, p1/m, z0.s, z1.s`。指针停在圆盘上时保持展开，移开才回到印章；触屏点击播放后自动复位。
- 按 `~` 或点 footer 的 `>_` 唤出拟终端：`help` / `whoami` / `ls` / `cat` / `neofetch` / `gemm` / `zoo` / `sudo`。只读，`sudo` 需要 SSH 密钥。
- 算子动物园（`zoo.js`）：终端输 `zoo`，或跑分结束后点结果旁的「看为什么 →」打开。第一章是 GEMM 三幕：①赛跑——同一个 24×24 的 C 矩阵，标量逐格、SVE 式 SIMD 整排、SME 外积整块 8×8 ZA tile 地填，速度为示意比例（按每拍 FMA 数：1 / 8 / 64），标量一侧标注访客的实测 GFLOPS，SME 一侧为可见性放慢并注明；②机内·标量——朴素点积 vs 4×4 寄存器分块，用访存次数/FMA 数现场计数（每 k 步 32 次访存 vs 8 次）；③机内·SVE——一条 `fmla z0.s, p0/m, z1.s, z2.s` 点亮 VL 个 lane，128/256/512-bit 切换看 VL-agnostic，尾巴向量由 p0 遮罩，附每拍 1 格的标量对照。支持播放/暂停/步进；`prefers-reduced-motion` 下默认步进。

## 内容来源

页面只写可以公开的事实，不放完整简历，也不托管简历文件。

- 教育、经历与论文：公开简历里可对外的条目（哈尔滨工业大学（深圳）、KU Leuven 与 Cum Laude、ARM SME/SVE、UniGEMM / GEMM / Attention、HPC、AEMR 论文 DOI）。不写雇主或公司名称。
- 项目简介：对应 GitHub 公开仓库的 README（`cannbot-gateway-proxy`、`cpu_model_deploy`、`agent_remote`、`gemmtest`、`LLM_papers`、`agent_knowledge`）。
- 联系方式：仅 tomhoyt88@gmail.com 与 GitHub [@0tomhoyt](https://github.com/0tomhoyt)。
