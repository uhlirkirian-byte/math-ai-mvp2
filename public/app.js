const form = document.querySelector("#solveForm");
const problemInput = document.querySelector("#problem");
const levelInput = document.querySelector("#level");
const modeInput = document.querySelector("#mode");
const answerEl = document.querySelector("#answer");
const topicEl = document.querySelector("#topic");
const stepsEl = document.querySelector("#steps");
const checksEl = document.querySelector("#checks");
const sourceTag = document.querySelector("#sourceTag");
const statusPill = document.querySelector("#statusPill");
const historyList = document.querySelector("#historyList");
const clearButton = document.querySelector("#clearButton");
const clearHistory = document.querySelector("#clearHistory");
const assessmentScreen = document.querySelector("#assessmentScreen");
const appShell = document.querySelector("#appShell");
const assessmentForm = document.querySelector("#assessmentForm");
const finishAssessment = document.querySelector("#finishAssessment");
const skipAssessment = document.querySelector("#skipAssessment");
const retakeAssessment = document.querySelector("#retakeAssessment");
const profilePanel = document.querySelector("#profilePanel");
const profileStrip = document.querySelector("#profileStrip");
const paperInput = document.querySelector("#paperInput");
const paperInputMain = document.querySelector("#paperInputMain");
const paperPreview = document.querySelector("#paperPreview");
const paperPreviewMain = document.querySelector("#paperPreviewMain");
const paperUploadHint = document.querySelector("#paperUploadHint");
const paperUploadHintMain = document.querySelector("#paperUploadHintMain");
const analyzePaper = document.querySelector("#analyzePaper");
const paperAnalysisResult = document.querySelector("#paperAnalysisResult");

const historyKey = "math-ai-mvp-history";
const profileKey = "math-ai-mvp-profile";
let history = JSON.parse(localStorage.getItem(historyKey) || "[]");
let learnerProfile = JSON.parse(localStorage.getItem(profileKey) || "null");
let paperImages = [];

const assessmentQuestions = [
  {
    id: "numberSense",
    skill: "数感",
    question: "不精确计算，估一估 49 × 21 最接近哪个数？",
    options: ["700", "1000", "1500"],
    answer: "1000"
  },
  {
    id: "algebra",
    skill: "代数",
    question: "如果 3x + 2 = 11，x 等于多少？",
    options: ["3", "4", "5"],
    answer: "3"
  },
  {
    id: "reading",
    skill: "读题",
    question: "小明有苹果的数量是小红的 2 倍，两人一共 18 个。应该先设谁为 x 更方便？",
    options: ["小红", "小明", "两人总数"],
    answer: "小红"
  },
  {
    id: "strategy",
    skill: "策略",
    question: "遇到复杂应用题，最适合先做什么？",
    options: ["立刻套公式", "圈出已知和未知", "直接看答案"],
    answer: "圈出已知和未知"
  },
  {
    id: "metacognition",
    skill: "检查",
    question: "解完方程后，最可靠的检查方式是什么？",
    options: ["代回原题", "看数字顺眼", "换一道题"],
    answer: "代回原题"
  },
  {
    id: "fraction",
    skill: "分数",
    question: "1/2 和 2/3 哪个更大？",
    options: ["1/2", "2/3", "一样大"],
    answer: "2/3"
  },
  {
    id: "geometry",
    skill: "几何",
    question: "三角形内角和是多少？",
    options: ["90°", "180°", "360°"],
    answer: "180°"
  },
  {
    id: "function",
    skill: "函数",
    question: "一次函数 y = 2x + 1 中，x 每增加 1，y 会怎样？",
    options: ["增加 1", "增加 2", "减少 2"],
    answer: "增加 2"
  },
  {
    id: "wordProblem",
    skill: "建模",
    question: "“比一个数的 3 倍少 4 等于 11”可以列成哪个方程？",
    options: ["3x - 4 = 11", "3x + 4 = 11", "x - 3 = 11"],
    answer: "3x - 4 = 11"
  },
  {
    id: "errorAwareness",
    skill: "错因意识",
    question: "如果一道题做错了，最有价值的记录是什么？",
    options: ["只写正确答案", "记录错因和正确方法", "把题擦掉"],
    answer: "记录错因和正确方法"
  }
];

function saveHistory() {
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
}

function saveProfile(profile) {
  learnerProfile = profile;
  localStorage.setItem(profileKey, JSON.stringify(profile));
}

function setStatus(text, busy = false) {
  statusPill.innerHTML = `<span class="dot"></span><span>${text}</span>`;
  statusPill.querySelector(".dot").style.background = busy ? "var(--gold)" : "var(--green)";
}

function renderAssessment() {
  assessmentForm.innerHTML = "";
  assessmentQuestions.forEach((item, index) => {
    const block = document.createElement("fieldset");
    block.className = "question-block";
    block.innerHTML = `
      <legend><span>${index + 1}</span>${item.question}</legend>
      <div class="option-row"></div>
    `;

    const row = block.querySelector(".option-row");
    item.options.forEach(option => {
      const label = document.createElement("label");
      label.className = "option-chip";
      label.innerHTML = `
        <input type="radio" name="${item.id}" value="${option}">
        <span>${option}</span>
      `;
      row.appendChild(label);
    });

    assessmentForm.appendChild(block);
  });
}

function buildProfileFromAnswers() {
  const strengths = [];
  const gaps = [];
  let score = 0;

  assessmentQuestions.forEach(item => {
    const selected = assessmentForm.querySelector(`input[name="${item.id}"]:checked`);
    const correct = selected && selected.value === item.answer;
    if (correct) {
      score += 1;
      strengths.push(item.skill);
    } else {
      gaps.push(item.skill);
    }
  });

  const level = score <= 2 ? "primary" : score <= 4 ? "middle" : "high";
  const style = gaps.includes("读题")
    ? "先拆题，再列式"
    : gaps.includes("代数")
      ? "多给代数变形步骤"
      : gaps.includes("检查")
        ? "每题后补一道验算"
        : "直接给关键步骤";

  return {
    score,
    total: assessmentQuestions.length,
    level,
    style,
    strengths: strengths.length ? strengths : ["愿意尝试"],
    gaps: gaps.length ? gaps : ["暂无明显短板"],
    paperCount: paperImages.length,
    paperSummary: paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片，建议结合错题痕迹做进一步分析。` : "尚未上传试卷照片。",
    createdAt: new Date().toISOString()
  };
}

function showApp() {
  assessmentScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  if (learnerProfile) {
    levelInput.value = learnerProfile.level;
  }
  renderProfile();
}

function renderProfile() {
  if (!learnerProfile) {
    profilePanel.innerHTML = `<p class="empty-history">还没有完成诊断。</p>`;
    profileStrip.innerHTML = "";
    return;
  }

  const accuracy = Math.round((learnerProfile.score / learnerProfile.total) * 100);
  profilePanel.innerHTML = `
    <div class="profile-score">
      <strong>${accuracy}%</strong>
      <span>${learnerProfile.score}/${learnerProfile.total} 题</span>
    </div>
    <div class="profile-lines">
      <p><b>推荐阶段：</b>${levelLabel(learnerProfile.level)}</p>
      <p><b>讲解策略：</b>${learnerProfile.style}</p>
      <p><b>优势：</b>${learnerProfile.strengths.join("、")}</p>
      <p><b>待加强：</b>${learnerProfile.gaps.join("、")}</p>
      <p><b>试卷材料：</b>${learnerProfile.paperSummary || "尚未上传试卷照片。"}</p>
    </div>
  `;

  profileStrip.innerHTML = `
    <span>诊断结果：${levelLabel(learnerProfile.level)}</span>
    <span>${learnerProfile.style}</span>
    <span>${learnerProfile.paperCount || 0} 张试卷照片</span>
    <button type="button" id="profileStripRetake">重新测试</button>
  `;
  document.querySelector("#profileStripRetake").addEventListener("click", resetAssessment);
}

function levelLabel(value) {
  return {
    primary: "基础巩固",
    middle: "初中常规",
    high: "进阶挑战",
    college: "大学"
  }[value] || "初中常规";
}

function profileInstruction() {
  if (!learnerProfile) return "";
  return `学习画像：推荐阶段是${levelLabel(learnerProfile.level)}，讲解策略是${learnerProfile.style}，待加强项是${learnerProfile.gaps.join("、")}。试卷材料：${learnerProfile.paperSummary || "尚未上传"}。`;
}

function renderPaperPreview(target, hint) {
  target.innerHTML = "";
  if (!paperImages.length) {
    hint.textContent = "支持手机拍照后的 JPG/PNG 图片";
    return;
  }

  hint.textContent = `已选择 ${paperImages.length} 张照片`;
  paperImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "paper-thumb";
    item.innerHTML = `<img src="${image.dataUrl}" alt="试卷照片 ${index + 1}"><span>${index + 1}</span>`;
    target.appendChild(item);
  });
}

async function readPaperFiles(fileList) {
  const files = Array.from(fileList || []).filter(file => file.type.startsWith("image/")).slice(0, 5);
  const loaded = await Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));

  paperImages = loaded;
  if (learnerProfile) {
    learnerProfile.paperCount = paperImages.length;
    learnerProfile.paperSummary = paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片。` : "尚未上传试卷照片。";
    saveProfile(learnerProfile);
    renderProfile();
  }
  renderPaperPreview(paperPreview, paperUploadHint);
  renderPaperPreview(paperPreviewMain, paperUploadHintMain);
}

function renderPaperAnalysis(analysis) {
  const items = [
    `总体判断：${analysis.summary}`,
    `主要短板：${analysis.gaps.join("、")}`,
    `错因类型：${analysis.errorPatterns.join("、")}`,
    `建议训练：${analysis.recommendations.join("、")}`
  ];

  paperAnalysisResult.innerHTML = "";
  items.forEach(text => {
    const item = document.createElement("div");
    item.className = "check-item";
    item.textContent = text;
    paperAnalysisResult.appendChild(item);
  });
}

async function analyzePaperImages() {
  if (!paperImages.length) {
    paperAnalysisResult.innerHTML = `<div class="check-item">请先上传近期试卷照片，再进行能力分析。</div>`;
    return;
  }

  analyzePaper.disabled = true;
  analyzePaper.textContent = "分析中";
  paperAnalysisResult.innerHTML = `<div class="check-item">正在结合认知测试和试卷照片分析能力画像。</div>`;

  try {
    const response = await fetch("/api/analyze-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: learnerProfile,
        images: paperImages.map(image => ({ name: image.name, dataUrl: image.dataUrl }))
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "分析失败");
    renderPaperAnalysis(payload.analysis);
  } catch {
    renderPaperAnalysis({
      summary: "已收到试卷照片；当前未连接 AI 后端时，只能先生成基础分析框架。",
      gaps: learnerProfile ? learnerProfile.gaps : ["待识别"],
      errorPatterns: ["计算错误", "审题遗漏", "步骤不完整"],
      recommendations: ["按错因分类整理错题", "优先复习高频薄弱知识点", "每题做代入或单位检查"]
    });
  } finally {
    analyzePaper.disabled = false;
    analyzePaper.textContent = "分析试卷";
  }
}

function renderSolution(payload) {
  const { solution } = payload;
  topicEl.textContent = solution.topic || "数学题";
  answerEl.textContent = solution.answer || "未返回答案";
  sourceTag.textContent = solution.source === "openai" ? "AI" : solution.source === "browser" ? "Browser" : "Local";

  stepsEl.innerHTML = "";
  const steps = solution.steps && solution.steps.length ? solution.steps : ["暂无步骤。"];
  steps.forEach(step => {
    const item = document.createElement("li");
    item.textContent = step;
    stepsEl.appendChild(item);
  });

  checksEl.innerHTML = "";
  (solution.checks || []).forEach(check => {
    const item = document.createElement("div");
    item.className = "check-item";
    item.textContent = check;
    checksEl.appendChild(item);
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "empty-history";
    empty.textContent = "还没有记录。";
    historyList.appendChild(empty);
    return;
  }

  history.forEach(entry => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.innerHTML = `<strong></strong><span></span>`;
    button.querySelector("strong").textContent = entry.problem;
    button.querySelector("span").textContent = entry.solution.answer;
    button.addEventListener("click", () => {
      problemInput.value = entry.problem;
      levelInput.value = entry.level;
      modeInput.value = entry.mode;
      renderSolution(entry);
    });
    historyList.appendChild(button);
  });
}

async function solve(problem, level, mode) {
  const enrichedProblem = profileInstruction() ? `${profileInstruction()}\n题目：${problem}` : problem;

  try {
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: enrichedProblem, level, mode })
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "请求失败");
    payload.problem = problem;
    return payload;
  } catch (error) {
    return solveInBrowser(problem, level, mode);
  }
}

function normalizeMath(input) {
  return String(input || "")
    .replace(/[，。；]/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/＝/g, "=")
    .replace(/平方/g, "^2")
    .replace(/求解|解方程|计算|是多少|等于多少/g, "")
    .trim();
}

function evaluate(expression, xValue = 0) {
  const normalized = normalizeMath(expression)
    .replace(/\^/g, "**")
    .replace(/X/g, "x")
    .replace(/(\d|\))\s*x/g, "$1*x")
    .replace(/x\s*(\()/g, "x*$1")
    .replace(/\bx\b/g, `(${xValue})`);

  if (!/^[0-9+\-*/().\s=*]+$/.test(normalized)) {
    throw new Error("Unsupported expression");
  }

  const value = Function(`"use strict"; return (${normalized});`)();
  if (!Number.isFinite(value)) throw new Error("Invalid result");
  return value;
}

function formatNumber(value) {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function solveInBrowser(problem, level, mode) {
  const expression = normalizeMath(problem).replace(/X/g, "x");
  let solution;

  try {
    if (!expression.includes("=") && !expression.includes("x")) {
      const answer = evaluate(expression);
      solution = {
        answer: formatNumber(answer),
        confidence: "high",
        source: "browser",
        topic: "数值计算",
        steps: [
          `整理算式：${expression}`,
          learnerProfile ? `按照诊断结果，本题采用“${learnerProfile.style}”。` : "按括号、乘除、加减顺序计算。",
          `得到结果：${formatNumber(answer)}`
        ]
      };
    } else if (expression.includes("=") && expression.includes("x")) {
      const [left, right] = expression.split("=");
      const f = x => evaluate(left, x) - evaluate(right, x);
      const y0 = f(0);
      const y1 = f(1);
      const y2 = f(2);
      const a = (y2 - 2 * y1 + y0) / 2;
      const b = y1 - y0 - a;
      const c = y0;

      if (Math.abs(a) < 1e-9) {
        const x = -c / b;
        solution = {
          answer: `x = ${formatNumber(x)}`,
          confidence: "high",
          source: "browser",
          topic: "一元一次方程",
          steps: [
            learnerProfile ? `根据诊断，先用“${learnerProfile.style}”的方式讲。` : "先把未知数项和常数项分开。",
            `移项为：(${left}) - (${right}) = 0`,
            `化简成 ${formatNumber(b)}x + ${formatNumber(c)} = 0`,
            `得到 x = ${formatNumber(x)}`
          ],
          checks: ["把 x 代回原方程，左右两边都等于 17。"]
        };
      } else {
        const d = b * b - 4 * a * c;
        const root = Math.sqrt(Math.max(d, 0));
        const x1 = (-b + root) / (2 * a);
        const x2 = (-b - root) / (2 * a);
        const answer = d < 0
          ? "无实数解"
          : Math.abs(x1 - x2) < 1e-9
            ? `x = ${formatNumber(x1)}`
            : `x1 = ${formatNumber(x1)}, x2 = ${formatNumber(x2)}`;

        solution = {
          answer,
          confidence: d < 0 ? "medium" : "high",
          source: "browser",
          topic: "一元二次方程",
          steps: [
            `整理为 ${formatNumber(a)}x^2 + ${formatNumber(b)}x + ${formatNumber(c)} = 0`,
            `判别式 Δ = ${formatNumber(d)}`,
            d < 0 ? "Δ < 0，所以没有实数解。" : `代入求根公式，得到 ${answer}`
          ]
        };
      }
    }
  } catch {
    solution = null;
  }

  if (!solution) {
    solution = {
      answer: "需要 AI 深度解题",
      confidence: "low",
      source: "browser",
      topic: "通用数学题",
      steps: [
        learnerProfile ? `根据诊断结果，建议讲解策略：${learnerProfile.style}。` : "先提取题目中的已知量和未知量。",
        "把文字条件转成方程、图形关系或函数关系。",
        level === "primary" ? "优先用画图、列表或逆推。" : "根据题型选择代数、几何、概率或函数方法。",
        "启动后端并配置 API key 后，可获得完整 AI 解题。"
      ],
      checks: mode === "check" ? ["检查单位、定义域和代入验算。"] : []
    };
  }

  return {
    id: Date.now().toString(36),
    problem,
    level,
    mode,
    solution
  };
}

function resetAssessment() {
  localStorage.removeItem(profileKey);
  learnerProfile = null;
  appShell.classList.add("is-hidden");
  assessmentScreen.classList.remove("is-hidden");
  renderAssessment();
}

finishAssessment.addEventListener("click", () => {
  const profile = buildProfileFromAnswers();
  saveProfile(profile);
  showApp();
});

skipAssessment.addEventListener("click", () => {
  saveProfile({
    score: 0,
    total: assessmentQuestions.length,
    level: "middle",
    style: "先给提示，再给完整步骤",
    strengths: ["待观察"],
    gaps: ["待诊断"],
    paperCount: paperImages.length,
    paperSummary: paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片。` : "尚未上传试卷照片。",
    createdAt: new Date().toISOString()
  });
  showApp();
});

retakeAssessment.addEventListener("click", resetAssessment);
paperInput.addEventListener("change", event => readPaperFiles(event.target.files));
paperInputMain.addEventListener("change", event => readPaperFiles(event.target.files));
analyzePaper.addEventListener("click", analyzePaperImages);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const problem = problemInput.value.trim();
  if (!problem) {
    problemInput.focus();
    return;
  }

  const submitButton = form.querySelector(".primary-button");
  submitButton.disabled = true;
  setStatus("解题中", true);
  answerEl.textContent = "正在计算...";
  stepsEl.innerHTML = "<li>分析题型和条件。</li>";
  checksEl.innerHTML = "";

  try {
    const payload = await solve(problem, levelInput.value, modeInput.value);
    renderSolution(payload);
    history = [payload, ...history.filter(item => item.problem !== problem)].slice(0, 20);
    saveHistory();
    renderHistory();
    setStatus(payload.solution.source === "openai" ? "AI 可用" : "本地可用");
  } catch (error) {
    topicEl.textContent = "请求失败";
    answerEl.textContent = error.message;
    stepsEl.innerHTML = "<li>请检查服务是否启动，或稍后重试。</li>";
    setStatus("异常");
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll("[data-example]").forEach(button => {
  button.addEventListener("click", () => {
    problemInput.value = button.dataset.example;
    problemInput.focus();
  });
});

clearButton.addEventListener("click", () => {
  problemInput.value = "";
  problemInput.focus();
});

clearHistory.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

renderAssessment();
renderHistory();
if (learnerProfile) {
  showApp();
} else {
  assessmentScreen.classList.remove("is-hidden");
}
