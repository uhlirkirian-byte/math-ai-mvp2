const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

const form = $("#solveForm");
const problemInput = $("#problem");
const levelInput = $("#level");
const modeInput = $("#mode");
const answerEl = $("#answer");
const topicEl = $("#topic");
const stepsEl = $("#steps");
const checksEl = $("#checks");
const sourceTag = $("#sourceTag");
const statusPill = $("#statusPill");
const historyList = $("#historyList");
const clearButton = $("#clearButton");
const clearHistory = $("#clearHistory");
const assessmentScreen = $("#assessmentScreen");
const appShell = $("#appShell");
const assessmentForm = $("#assessmentForm");
const finishAssessment = $("#finishAssessment");
const skipAssessment = $("#skipAssessment");
const retakeAssessment = $("#retakeAssessment");
const profilePanel = $("#profilePanel");
const profileStrip = $("#profileStrip");
const paperInput = $("#paperInput");
const paperInputMain = $("#paperInputMain");
const paperPreview = $("#paperPreview");
const paperPreviewMain = $("#paperPreviewMain");
const paperUploadHint = $("#paperUploadHint");
const paperUploadHintMain = $("#paperUploadHintMain");
const analyzePaper = $("#analyzePaper");
const paperAnalysisResult = $("#paperAnalysisResult");
const teacherProfileForm = $("#teacherProfileForm");
const teacherAssessmentForm = $("#teacherAssessmentForm");
const teacherNameInput = $("#teacherName");
const teacherProfilePanel = $("#teacherProfilePanel");
const moduleForm = $("#moduleForm");
const moduleList = $("#moduleList");
const recommendModules = $("#recommendModules");

const historyKey = "math-ai-mvp-history";
const profileKey = "math-ai-mvp-profile";
const teacherProfilesKey = "math-ai-teacher-profiles";
const teacherModulesKey = "math-ai-teacher-modules";

let history = JSON.parse(localStorage.getItem(historyKey) || "[]");
let learnerProfile = JSON.parse(localStorage.getItem(profileKey) || "null");
let teacherProfiles = JSON.parse(localStorage.getItem(teacherProfilesKey) || "[]");
let teacherModules = JSON.parse(localStorage.getItem(teacherModulesKey) || "[]");
let currentTeacherProfile = teacherProfiles[0] || null;
let paperImages = [];
let activeAssessmentQuestions = [];
let recommendationMode = false;

const thinkingTypeMap = {
  数感: "规律发现型",
  代数: "逻辑推导型",
  读题: "步骤拆解型",
  策略: "提问引导型",
  检查: "易错纠正型",
  分数: "步骤拆解型",
  几何: "空间图像型",
  函数: "规律发现型",
  建模: "类比理解型",
  错因意识: "易错纠正型"
};

const teachingStyleLabels = {
  visualScore: "图像化理解",
  patternScore: "规律发现",
  analogyScore: "类比解释",
  logicScore: "逻辑推导",
  stepScore: "步骤拆解",
  errorCorrectionScore: "易错纠正",
  inquiryScore: "提问引导",
  emotionalSupportScore: "情绪支持"
};

const teacherDimensions = Object.keys(teachingStyleLabels);
const teachingStyleOptions = Object.values(teachingStyleLabels);
const thinkingTypeOptions = ["空间图像型", "规律发现型", "类比理解型", "逻辑推导型", "步骤拆解型", "易错纠正型", "提问引导型", "容易受挫型"];

const assessmentBank = [
  { dimension: "numberSense", skill: "数感", variants: [
    { question: "不精确计算，估一估 49 × 21 最接近哪个数？", options: ["700", "1000", "1500"], answer: "1000" },
    { question: "198 + 305 大约是多少？", options: ["400", "500", "700"], answer: "500" },
    { question: "3.9 × 5.1 最接近哪个数？", options: ["10", "20", "40"], answer: "20" }
  ] },
  { dimension: "algebra", skill: "代数", variants: [
    { question: "如果 3x + 2 = 11，x 等于多少？", options: ["3", "4", "5"], answer: "3" },
    { question: "如果 2a - 6 = 10，a 等于多少？", options: ["2", "8", "16"], answer: "8" },
    { question: "把 x + x + x 简化后是？", options: ["x3", "3x", "x + 3"], answer: "3x" }
  ] },
  { dimension: "reading", skill: "读题", variants: [
    { question: "小明有苹果的数量是小红的 2 倍，两人一共 18 个。应该先设谁为 x 更方便？", options: ["小红", "小明", "两人总数"], answer: "小红" },
    { question: "题目说“甲比乙多 5”，如果设乙为 x，甲应该表示为？", options: ["x - 5", "x + 5", "5x"], answer: "x + 5" },
    { question: "看到“共”“一共”“合计”这类词，通常表示什么关系？", options: ["相加关系", "相除关系", "平方关系"], answer: "相加关系" }
  ] },
  { dimension: "strategy", skill: "策略", variants: [
    { question: "遇到复杂应用题，最适合先做什么？", options: ["立刻套公式", "圈出已知和未知", "直接看答案"], answer: "圈出已知和未知" },
    { question: "一道题有多个条件时，比较稳妥的做法是？", options: ["逐条翻译条件", "只看最后一句", "先猜答案"], answer: "逐条翻译条件" },
    { question: "如果一题不会做，第一步更适合？", options: ["换题不管", "找相似例题或画图", "直接背答案"], answer: "找相似例题或画图" }
  ] },
  { dimension: "metacognition", skill: "检查", variants: [
    { question: "解完方程后，最可靠的检查方式是什么？", options: ["代回原题", "看数字顺眼", "换一道题"], answer: "代回原题" },
    { question: "计算应用题答案后，最好再检查什么？", options: ["单位和实际意义", "字写得大不大", "题目长不长"], answer: "单位和实际意义" },
    { question: "如果答案是人数 2.5 人，说明最可能有什么问题？", options: ["答案不符合实际", "一定正确", "题目太简单"], answer: "答案不符合实际" }
  ] },
  { dimension: "fraction", skill: "分数", variants: [
    { question: "1/2 和 2/3 哪个更大？", options: ["1/2", "2/3", "一样大"], answer: "2/3" },
    { question: "1/4 + 1/4 等于多少？", options: ["1/8", "1/2", "2/8"], answer: "1/2" },
    { question: "比较 3/5 和 4/5，哪个更大？", options: ["3/5", "4/5", "一样大"], answer: "4/5" }
  ] },
  { dimension: "geometry", skill: "几何", variants: [
    { question: "三角形内角和是多少？", options: ["90°", "180°", "360°"], answer: "180°" },
    { question: "长方形面积公式是？", options: ["长 + 宽", "长 × 宽", "2 × (长 + 宽)"], answer: "长 × 宽" },
    { question: "两个相似三角形，对应角通常有什么关系？", options: ["相等", "互补", "无关系"], answer: "相等" }
  ] },
  { dimension: "function", skill: "函数", variants: [
    { question: "一次函数 y = 2x + 1 中，x 每增加 1，y 会怎样？", options: ["增加 1", "增加 2", "减少 2"], answer: "增加 2" },
    { question: "函数图像上一个点 (2, 5) 表示什么？", options: ["x=2 时 y=5", "x=5 时 y=2", "x+y=2"], answer: "x=2 时 y=5" },
    { question: "y = -3x + 4 的斜率是？", options: ["-3", "3", "4"], answer: "-3" }
  ] },
  { dimension: "wordProblem", skill: "建模", variants: [
    { question: "“比一个数的 3 倍少 4 等于 11”可以列成哪个方程？", options: ["3x - 4 = 11", "3x + 4 = 11", "x - 3 = 11"], answer: "3x - 4 = 11" },
    { question: "每支笔 4 元，买 x 支共 28 元，可以列成？", options: ["4x = 28", "x + 4 = 28", "28x = 4"], answer: "4x = 28" },
    { question: "一辆车每小时行 60 千米，t 小时行驶的路程是？", options: ["60 + t", "60t", "t / 60"], answer: "60t" }
  ] },
  { dimension: "errorAwareness", skill: "错因意识", variants: [
    { question: "如果一道题做错了，最有价值的记录是什么？", options: ["只写正确答案", "记录错因和正确方法", "把题擦掉"], answer: "记录错因和正确方法" },
    { question: "订正错题时，最应该补充哪一项？", options: ["错在哪里", "题号颜色", "答案页码"], answer: "错在哪里" },
    { question: "同类题连续错，优先说明什么？", options: ["存在稳定短板", "只是运气不好", "不用处理"], answer: "存在稳定短板" }
  ] }
];

const teacherQuestions = [
  { question: "学生听不懂一道题时，你第一反应通常是？", multi: false, options: [
    ["A", "重新画图", ["visualScore"]],
    ["B", "举一个生活例子", ["analogyScore"]],
    ["C", "从公式重新推导", ["logicScore"]],
    ["D", "拆成更小步骤", ["stepScore"]],
    ["E", "反问学生哪里没懂", ["inquiryScore"]]
  ] },
  { question: "你最常用的开场方式是？", multi: false, options: [
    ["A", "先看图", ["visualScore"]],
    ["B", "先看题目条件", ["stepScore"]],
    ["C", "先找规律", ["patternScore"]],
    ["D", "先回忆公式", ["logicScore"]],
    ["E", "先问学生自己的想法", ["inquiryScore"]]
  ] },
  { question: "学生算错时，你通常先判断？", multi: true, options: [
    ["A", "图像关系没看懂", ["visualScore"]],
    ["B", "概念没理解", ["logicScore"]],
    ["C", "步骤跳太快", ["stepScore"]],
    ["D", "公式用错", ["errorCorrectionScore"]],
    ["E", "心态急了", ["emotionalSupportScore"]]
  ] },
  { question: "你认为学生真正学会一道题，最重要的是？", multi: true, options: [
    ["A", "能看出结构", ["visualScore", "patternScore"]],
    ["B", "能找到规律", ["patternScore"]],
    ["C", "能独立推导", ["logicScore"]],
    ["D", "能举一反三", ["analogyScore"]],
    ["E", "能说出错在哪里", ["errorCorrectionScore"]]
  ] },
  { question: "如果只用一分钟讲一个知识点，你会优先？", multi: false, options: [
    ["A", "画一个图", ["visualScore"]],
    ["B", "举一个比喻", ["analogyScore"]],
    ["C", "讲核心公式", ["logicScore"]],
    ["D", "做一步示范", ["stepScore"]],
    ["E", "问一个关键问题", ["inquiryScore"]]
  ] },
  { question: "你最擅长帮助哪类学生？", multi: true, options: [
    ["A", "看不懂图的学生", ["visualScore"]],
    ["B", "不会找规律的学生", ["patternScore"]],
    ["C", "公式记不住的学生", ["analogyScore", "logicScore"]],
    ["D", "步骤容易乱的学生", ["stepScore"]],
    ["E", "一错就烦躁的学生", ["emotionalSupportScore"]]
  ] },
  { question: "你讲题时最常出现的是？", multi: true, options: [
    ["A", "图形变化", ["visualScore"]],
    ["B", "数值变化", ["patternScore"]],
    ["C", "生活类比", ["analogyScore"]],
    ["D", "公式推导", ["logicScore"]],
    ["E", "错因提醒", ["errorCorrectionScore"]]
  ] },
  { question: "学生卡住时，你更常说？", multi: true, options: [
    ["A", "先别算，先看图。", ["visualScore"]],
    ["B", "你把它想成……", ["analogyScore"]],
    ["C", "我们换个角度。", ["patternScore"]],
    ["D", "这一步为什么成立？", ["logicScore", "inquiryScore"]],
    ["E", "慢慢来，先做第一步。", ["stepScore", "emotionalSupportScore"]]
  ] },
  { question: "你觉得一道好讲解，应该先让学生获得？", multi: false, options: [
    ["A", "画面感", ["visualScore"]],
    ["B", "方向感", ["patternScore"]],
    ["C", "公式感", ["logicScore"]],
    ["D", "步骤感", ["stepScore"]],
    ["E", "信心", ["emotionalSupportScore"]]
  ] },
  { question: "遇到抽象知识点时，你通常？", multi: true, options: [
    ["A", "转成图形", ["visualScore"]],
    ["B", "转成生活例子", ["analogyScore"]],
    ["C", "转成一组数据变化", ["patternScore"]],
    ["D", "转成公式逻辑", ["logicScore"]],
    ["E", "转成几个小问题", ["stepScore", "inquiryScore"]]
  ] },
  { question: "你最不喜欢哪种讲法？", multi: true, reverse: true, options: [
    ["A", "只给答案", ["stepScore", "inquiryScore"]],
    ["B", "只堆公式", ["visualScore", "analogyScore"]],
    ["C", "不讲为什么", ["logicScore"]],
    ["D", "步骤太跳", ["stepScore"]],
    ["E", "不管学生情绪", ["emotionalSupportScore"]]
  ] },
  { question: "学生反复做错同类题，你会？", multi: true, options: [
    ["A", "找共同结构", ["patternScore"]],
    ["B", "找共同错因", ["errorCorrectionScore"]],
    ["C", "重建概念", ["logicScore"]],
    ["D", "换一种讲法", ["analogyScore", "visualScore"]],
    ["E", "让他复述思路", ["inquiryScore"]]
  ] },
  { question: "你讲题时是否经常设计“顿悟点”？", multi: true, options: [
    ["A", "经常用图形顿悟", ["visualScore"]],
    ["B", "经常用比喻顿悟", ["analogyScore"]],
    ["C", "经常用反问顿悟", ["inquiryScore"]],
    ["D", "经常用推导顿悟", ["logicScore"]],
    ["E", "很少刻意设计", ["stepScore"]]
  ] },
  { question: "你希望系统如何推荐你的讲解？", multi: true, options: [
    ["A", "推荐给空间图像型学生", ["visualScore"]],
    ["B", "推荐给规律发现型学生", ["patternScore"]],
    ["C", "推荐给逻辑推导型学生", ["logicScore"]],
    ["D", "推荐给需要步骤拆解的学生", ["stepScore"]],
    ["E", "推荐给容易受挫的学生", ["emotionalSupportScore"]]
  ] },
  { question: "你认为你最有价值的教学能力是？", multi: true, options: [
    ["A", "把抽象问题讲具体", ["visualScore", "analogyScore"]],
    ["B", "把复杂问题讲简单", ["stepScore"]],
    ["C", "把公式背后的逻辑讲清楚", ["logicScore"]],
    ["D", "快速发现学生卡点", ["errorCorrectionScore", "inquiryScore"]],
    ["E", "让学生重新有信心", ["emotionalSupportScore"]]
  ] }
];

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function setStatus(text, busy = false) {
  statusPill.innerHTML = `<span class="dot"></span><span>${text}</span>`;
  statusPill.querySelector(".dot").style.background = busy ? "var(--gold)" : "var(--green)";
}

function renderAssessment() {
  activeAssessmentQuestions = assessmentBank.map(group => {
    const variant = shuffle(group.variants)[0];
    return { id: group.dimension, skill: group.skill, question: variant.question, options: shuffle(variant.options), answer: variant.answer };
  });

  assessmentForm.innerHTML = "";
  activeAssessmentQuestions.forEach((item, index) => {
    const block = document.createElement("fieldset");
    block.className = "question-block";
    block.innerHTML = `<legend><span>${index + 1}</span>${item.question}</legend><div class="option-row"></div>`;
    const row = block.querySelector(".option-row");
    item.options.forEach(option => {
      const label = document.createElement("label");
      label.className = "option-chip";
      label.innerHTML = `<input type="radio" name="${item.id}" value="${option}"><span>${option}</span>`;
      row.appendChild(label);
    });
    assessmentForm.appendChild(block);
  });
}

function buildProfileFromAnswers() {
  const strengths = [];
  const gaps = [];
  const dimensionScores = {};
  let score = 0;

  activeAssessmentQuestions.forEach(item => {
    const selected = assessmentForm.querySelector(`input[name="${item.id}"]:checked`);
    const correct = selected && selected.value === item.answer;
    dimensionScores[item.skill] = correct ? 1 : 0;
    if (correct) {
      score += 1;
      strengths.push(item.skill);
    } else {
      gaps.push(item.skill);
    }
  });

  const level = score <= 2 ? "primary" : score <= 5 ? "middle" : "high";
  const style = gaps.includes("读题")
    ? "先拆题，再列式"
    : gaps.includes("代数")
      ? "多给代数变形步骤"
      : gaps.includes("检查")
        ? "每题后补一道验算"
        : "直接给关键步骤";

  return {
    score,
    total: activeAssessmentQuestions.length,
    level,
    style,
    strengths: strengths.length ? strengths : ["愿意尝试"],
    gaps: gaps.length ? gaps : ["暂无明显短板"],
    dimensionScores,
    thinkingTypes: deriveThinkingTypes(gaps),
    paperCount: paperImages.length,
    paperSummary: paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片，建议结合错题痕迹做进一步分析。` : "尚未上传试卷照片。",
    createdAt: new Date().toISOString()
  };
}

function deriveThinkingTypes(gaps) {
  const types = gaps.map(gap => thinkingTypeMap[gap]).filter(Boolean);
  return [...new Set(types.length ? types : ["步骤拆解型"])];
}

function showApp() {
  assessmentScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  if (learnerProfile) levelInput.value = learnerProfile.level;
  renderProfile();
  renderTeacherProfile();
  renderModules();
}

function renderProfile() {
  if (!learnerProfile) {
    profilePanel.innerHTML = `<p class="empty-history">还没有完成诊断。</p>`;
    profileStrip.innerHTML = "";
    return;
  }
  const accuracy = Math.round((learnerProfile.score / learnerProfile.total) * 100);
  profilePanel.innerHTML = `
    <div class="profile-score"><strong>${accuracy}%</strong><span>${learnerProfile.score}/${learnerProfile.total} 题</span></div>
    <div class="profile-lines">
      <p><b>推荐阶段：</b>${levelLabel(learnerProfile.level)}</p>
      <p><b>讲解策略：</b>${learnerProfile.style}</p>
      <p><b>优势：</b>${learnerProfile.strengths.join("、")}</p>
      <p><b>待加强：</b>${learnerProfile.gaps.join("、")}</p>
      <p><b>思维类型：</b>${(learnerProfile.thinkingTypes || []).join("、")}</p>
      <p><b>试卷材料：</b>${learnerProfile.paperSummary || "尚未上传试卷照片。"}</p>
    </div>`;
  profileStrip.innerHTML = `
    <span>诊断结果：${levelLabel(learnerProfile.level)}</span>
    <span>${learnerProfile.style}</span>
    <span>${learnerProfile.paperCount || 0} 张试卷照片</span>
    <button type="button" id="profileStripRetake">重新测试</button>`;
  $("#profileStripRetake").addEventListener("click", resetAssessment);
}

function levelLabel(value) {
  return { primary: "基础巩固", middle: "初中常规", high: "进阶挑战", college: "大学" }[value] || "初中常规";
}

function profileInstruction() {
  if (!learnerProfile) return "";
  return `学习画像：推荐阶段是${levelLabel(learnerProfile.level)}，讲解策略是${learnerProfile.style}，待加强项是${learnerProfile.gaps.join("、")}。`;
}

function renderTeacherAssessment() {
  teacherAssessmentForm.innerHTML = "";
  teacherQuestions.forEach((item, index) => {
    const block = document.createElement("fieldset");
    block.className = "question-block teacher-question";
    block.innerHTML = `<legend><span>${index + 1}</span>${item.question}${item.multi ? "（可多选）" : ""}</legend><div class="option-row teacher-options"></div>`;
    const row = block.querySelector(".option-row");
    item.options.forEach(([code, label]) => {
      const option = document.createElement("label");
      option.className = "option-chip";
      option.innerHTML = `<input type="${item.multi ? "checkbox" : "radio"}" name="teacher-q-${index}" value="${code}"><span>${code} ${label}</span>`;
      row.appendChild(option);
    });
    teacherAssessmentForm.appendChild(block);
  });
}

function buildTeacherProfile() {
  const scores = Object.fromEntries(teacherDimensions.map(key => [key, 0]));
  teacherQuestions.forEach((question, index) => {
    $$(`[name="teacher-q-${index}"]:checked`).forEach(input => {
      const selected = question.options.find(option => option[0] === input.value);
      if (!selected) return;
      selected[2].forEach(scoreKey => {
        scores[scoreKey] += question.reverse ? 0.8 : 1;
      });
    });
  });

  const ranked = teacherDimensions
    .map(key => ({ key, label: teachingStyleLabels[key], score: scores[key] }))
    .sort((a, b) => b.score - a.score);

  const teacherName = teacherNameInput.value.trim() || "未命名老师";
  return {
    teacherId: currentTeacherProfile?.teacherId || `teacher-${Date.now().toString(36)}`,
    teacherName,
    ...scores,
    primaryTeachingStyle: ranked[0]?.label || "步骤拆解",
    secondaryTeachingStyle: ranked[1]?.label || "提问引导",
    createdAt: new Date().toISOString()
  };
}

function saveTeacherProfile(profile) {
  currentTeacherProfile = profile;
  const withoutCurrent = teacherProfiles.filter(item => item.teacherId !== profile.teacherId);
  teacherProfiles = [profile, ...withoutCurrent].slice(0, 20);
  save(teacherProfilesKey, teacherProfiles);
}

function renderTeacherProfile() {
  if (!currentTeacherProfile) {
    teacherProfilePanel.innerHTML = `<p class="empty-history">还没有老师画像。请先完成 15 题教学行为评测。</p>`;
    return;
  }
  const rows = teacherDimensions.map(key => `
    <p><b>${teachingStyleLabels[key]}：</b>${currentTeacherProfile[key].toFixed(1)}</p>
  `).join("");
  teacherProfilePanel.innerHTML = `
    <div class="profile-score"><strong>${currentTeacherProfile.primaryTeachingStyle}</strong><span>${currentTeacherProfile.teacherName}</span></div>
    <div class="profile-lines">
      <p><b>teacherId：</b>${currentTeacherProfile.teacherId}</p>
      <p><b>主教学风格：</b>${currentTeacherProfile.primaryTeachingStyle}</p>
      <p><b>辅教学风格：</b>${currentTeacherProfile.secondaryTeachingStyle}</p>
      ${rows}
    </div>`;
}

function populateMultiSelects() {
  const styleSelect = $("#moduleStyleTags");
  const thinkingSelect = $("#moduleThinkingTypes");
  styleSelect.innerHTML = teachingStyleOptions.map(value => `<option value="${value}">${value}</option>`).join("");
  thinkingSelect.innerHTML = thinkingTypeOptions.map(value => `<option value="${value}">${value}</option>`).join("");
}

function selectedValues(select) {
  return Array.from(select.selectedOptions).map(option => option.value);
}

function saveModuleFromForm() {
  const teacher = currentTeacherProfile || {
    teacherId: `teacher-${Date.now().toString(36)}`,
    teacherName: teacherNameInput.value.trim() || "未命名老师",
    primaryTeachingStyle: "步骤拆解",
    secondaryTeachingStyle: "提问引导"
  };
  if (!currentTeacherProfile) saveTeacherProfile({ ...teacher, ...Object.fromEntries(teacherDimensions.map(key => [key, 0])), createdAt: new Date().toISOString() });

  const transcriptText = $("#moduleTranscript").value.trim();
  const module = {
    id: `module-${Date.now().toString(36)}`,
    teacherId: teacher.teacherId,
    teacherName: teacher.teacherName,
    title: $("#moduleTitle").value.trim() || "未命名讲稿",
    subject: $("#moduleSubject").value.trim() || "数学",
    gradeLevel: $("#moduleGrade").value,
    knowledgePoint: $("#moduleKnowledge").value.trim(),
    questionType: $("#moduleQuestionType").value.trim(),
    difficulty: $("#moduleDifficulty").value,
    commonBlockage: $("#moduleBlockage").value.trim(),
    transcriptText,
    firstExplanation: $("#moduleFirst").value.trim(),
    keyAnalogy: $("#moduleAnalogy").value.trim(),
    teachingStyleTags: selectedValues($("#moduleStyleTags")),
    suitableThinkingTypes: selectedValues($("#moduleThinkingTypes")),
    animationHint: $("#moduleAnimation").value.trim(),
    createdAt: new Date().toISOString(),
    usageCount: 0,
    helpfulCount: 0
  };

  teacherModules = [module, ...teacherModules];
  save(teacherModulesKey, teacherModules);
  moduleForm.reset();
  populateMultiSelects();
  renderModules();
}

function moduleMatchesFilters(module) {
  const filters = [
    ["filterTeacher", module.teacherName],
    ["filterSubject", module.subject],
    ["filterGrade", module.gradeLevel],
    ["filterKnowledge", module.knowledgePoint],
    ["filterQuestionType", module.questionType],
    ["filterBlockage", module.commonBlockage],
    ["filterStyle", module.teachingStyleTags.join("、")],
    ["filterThinking", module.suitableThinkingTypes.join("、")]
  ];
  return filters.every(([id, value]) => {
    const query = $(`#${id}`).value.trim();
    return !query || String(value || "").includes(query);
  });
}

function recommendationScore(module) {
  if (!learnerProfile) return module.helpfulCount || 0;
  let score = 0;
  const gaps = learnerProfile.gaps || [];
  const thinkingTypes = learnerProfile.thinkingTypes || [];
  if (gaps.some(gap => module.knowledgePoint.includes(gap))) score += 60;
  if (gaps.some(gap => module.commonBlockage.includes(gap))) score += 50;
  if (module.questionType && gaps.some(gap => module.questionType.includes(gap))) score += 35;
  if (module.suitableThinkingTypes.some(type => thinkingTypes.includes(type))) score += 25;
  if (module.teachingStyleTags.includes(styleToTeachingTag(learnerProfile.style))) score += 15;
  score += module.helpfulCount || 0;
  return score;
}

function styleToTeachingTag(style) {
  if (style.includes("拆题") || style.includes("步骤")) return "步骤拆解";
  if (style.includes("代数") || style.includes("公式")) return "逻辑推导";
  if (style.includes("验算")) return "易错纠正";
  return "提问引导";
}

function renderModules() {
  let modules = teacherModules.filter(moduleMatchesFilters);
  if (recommendationMode) modules = modules.sort((a, b) => recommendationScore(b) - recommendationScore(a));
  moduleList.innerHTML = "";
  if (!modules.length) {
    moduleList.innerHTML = `<div class="empty-history">还没有符合条件的 TeacherModule。先完成老师评测并上传一份讲稿。</div>`;
    return;
  }

  modules.forEach(module => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-card-head">
        <strong>${module.teacherName}</strong>
        <span>${module.gradeLevel} · ${module.difficulty}</span>
      </div>
      <h3>${module.knowledgePoint || module.title}</h3>
      <p><b>卡点：</b>${module.commonBlockage || "未填写"}</p>
      <p><b>教学方式：</b>${module.teachingStyleTags.join("、") || "未选择"}</p>
      <p><b>第一句话：</b>${module.firstExplanation || "未填写"}</p>
      <p><b>核心比喻：</b>${module.keyAnalogy || "未填写"}</p>
      <p class="module-summary">${summarize(module.transcriptText)}</p>
      <div class="module-actions">
        <button type="button" data-action="view" data-id="${module.id}">查看完整讲稿</button>
        <button type="button" data-action="recommend" data-id="${module.id}">推荐给学生</button>
        <button type="button" data-action="helpful" data-id="${module.id}">换一种讲法</button>
      </div>`;
    moduleList.appendChild(card);
  });
}

function summarize(text) {
  if (!text) return "暂无讲稿摘要。";
  return text.length > 88 ? `${text.slice(0, 88)}...` : text;
}

function updateModule(id, updater) {
  teacherModules = teacherModules.map(module => module.id === id ? updater(module) : module);
  save(teacherModulesKey, teacherModules);
  renderModules();
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
  } catch {
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
  if (!/^[0-9+\-*/().\s=*]+$/.test(normalized)) throw new Error("Unsupported expression");
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
  let solution = null;
  try {
    if (!expression.includes("=") && !expression.includes("x")) {
      const answer = evaluate(expression);
      solution = {
        answer: formatNumber(answer),
        confidence: "high",
        source: "browser",
        topic: "数值计算",
        steps: [`整理算式：${expression}`, learnerProfile ? `按照诊断结果，本题采用“${learnerProfile.style}”。` : "按括号、乘除、加减顺序计算。", `得到结果：${formatNumber(answer)}`]
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
          steps: [`移项为：(${left}) - (${right}) = 0`, `化简成 ${formatNumber(b)}x + ${formatNumber(c)} = 0`, `得到 x = ${formatNumber(x)}`],
          checks: ["把 x 代回原方程检查左右两边是否相等。"]
        };
      } else {
        const d = b * b - 4 * a * c;
        const root = Math.sqrt(Math.max(d, 0));
        const x1 = (-b + root) / (2 * a);
        const x2 = (-b - root) / (2 * a);
        const answer = d < 0 ? "无实数解" : Math.abs(x1 - x2) < 1e-9 ? `x = ${formatNumber(x1)}` : `x1 = ${formatNumber(x1)}, x2 = ${formatNumber(x2)}`;
        solution = {
          answer,
          confidence: d < 0 ? "medium" : "high",
          source: "browser",
          topic: "一元二次方程",
          steps: [`整理为 ${formatNumber(a)}x^2 + ${formatNumber(b)}x + ${formatNumber(c)} = 0`, `判别式 Δ = ${formatNumber(d)}`, d < 0 ? "Δ < 0，所以没有实数解。" : `代入求根公式，得到 ${answer}`]
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
  return { id: Date.now().toString(36), problem, level, mode, solution };
}

function renderSolution(payload) {
  const { solution } = payload;
  topicEl.textContent = solution.topic || "数学题";
  answerEl.textContent = solution.answer || "未返回答案";
  sourceTag.textContent = solution.source === "openai" ? "AI" : solution.source === "browser" ? "Browser" : "Local";
  stepsEl.innerHTML = "";
  (solution.steps && solution.steps.length ? solution.steps : ["暂无步骤。"]).forEach(step => {
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
    historyList.innerHTML = `<div class="empty-history">还没有记录。</div>`;
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

function renderPaperPreview(target, hint) {
  target.innerHTML = "";
  hint.textContent = paperImages.length ? `已选择 ${paperImages.length} 张照片` : "支持手机拍照后的 JPG/PNG 图片";
  paperImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "paper-thumb";
    item.innerHTML = `<img src="${image.dataUrl}" alt="试卷照片 ${index + 1}"><span>${index + 1}</span>`;
    target.appendChild(item);
  });
}

async function readPaperFiles(fileList) {
  const files = Array.from(fileList || []).filter(file => file.type.startsWith("image/")).slice(0, 5);
  paperImages = await Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
  if (learnerProfile) {
    learnerProfile.paperCount = paperImages.length;
    learnerProfile.paperSummary = paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片。` : "尚未上传试卷照片。";
    save(profileKey, learnerProfile);
    renderProfile();
  }
  renderPaperPreview(paperPreview, paperUploadHint);
  renderPaperPreview(paperPreviewMain, paperUploadHintMain);
}

function renderPaperAnalysis(analysis) {
  const items = [`总体判断：${analysis.summary}`, `主要短板：${analysis.gaps.join("、")}`, `错因类型：${analysis.errorPatterns.join("、")}`, `建议训练：${analysis.recommendations.join("、")}`];
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
  try {
    const response = await fetch("/api/analyze-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: learnerProfile, images: paperImages.map(image => ({ name: image.name, dataUrl: image.dataUrl })) })
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

function resetAssessment() {
  localStorage.removeItem(profileKey);
  learnerProfile = null;
  appShell.classList.add("is-hidden");
  assessmentScreen.classList.remove("is-hidden");
  renderAssessment();
}

finishAssessment.addEventListener("click", () => {
  learnerProfile = buildProfileFromAnswers();
  save(profileKey, learnerProfile);
  showApp();
});

skipAssessment.addEventListener("click", () => {
  learnerProfile = {
    score: 0,
    total: assessmentBank.length,
    level: "middle",
    style: "先给提示，再给完整步骤",
    strengths: ["待观察"],
    gaps: ["待诊断"],
    thinkingTypes: ["步骤拆解型"],
    paperCount: paperImages.length,
    paperSummary: paperImages.length ? `已上传 ${paperImages.length} 张近期试卷照片。` : "尚未上传试卷照片。",
    createdAt: new Date().toISOString()
  };
  save(profileKey, learnerProfile);
  showApp();
});

teacherProfileForm.addEventListener("submit", event => {
  event.preventDefault();
  const profile = buildTeacherProfile();
  saveTeacherProfile(profile);
  renderTeacherProfile();
  populateMultiSelects();
});

moduleForm.addEventListener("submit", event => {
  event.preventDefault();
  saveModuleFromForm();
});

moduleList.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const module = teacherModules.find(item => item.id === button.dataset.id);
  if (!module) return;
  if (button.dataset.action === "view") {
    answerEl.textContent = module.title;
    topicEl.textContent = "完整讲稿";
    sourceTag.textContent = "Module";
    stepsEl.innerHTML = "";
    [module.firstExplanation, module.keyAnalogy, module.transcriptText, module.animationHint ? `动画提示：${module.animationHint}` : ""].filter(Boolean).forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      stepsEl.appendChild(li);
    });
  }
  if (button.dataset.action === "recommend") {
    updateModule(module.id, item => ({ ...item, usageCount: item.usageCount + 1 }));
  }
  if (button.dataset.action === "helpful") {
    updateModule(module.id, item => ({ ...item, helpfulCount: item.helpfulCount + 1 }));
  }
});

recommendModules.addEventListener("click", () => {
  recommendationMode = !recommendationMode;
  recommendModules.textContent = recommendationMode ? "查看全部模块" : "推荐给当前学生";
  renderModules();
});

["filterTeacher", "filterSubject", "filterGrade", "filterKnowledge", "filterQuestionType", "filterBlockage", "filterStyle", "filterThinking"].forEach(id => {
  $(`#${id}`).addEventListener("input", renderModules);
});

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
    save(historyKey, history);
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

retakeAssessment.addEventListener("click", resetAssessment);
paperInput.addEventListener("change", event => readPaperFiles(event.target.files));
paperInputMain.addEventListener("change", event => readPaperFiles(event.target.files));
analyzePaper.addEventListener("click", analyzePaperImages);
clearButton.addEventListener("click", () => {
  problemInput.value = "";
  problemInput.focus();
});
clearHistory.addEventListener("click", () => {
  history = [];
  save(historyKey, history);
  renderHistory();
});
$$("[data-example]").forEach(button => {
  button.addEventListener("click", () => {
    problemInput.value = button.dataset.example;
    problemInput.focus();
  });
});

renderAssessment();
renderTeacherAssessment();
populateMultiSelects();
renderHistory();
renderTeacherProfile();
renderModules();
if (learnerProfile) {
  showApp();
} else {
  assessmentScreen.classList.remove("is-hidden");
}
