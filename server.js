const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, "public");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
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

function toJsExpression(expression, xValue = 0) {
  const normalized = normalizeMath(expression)
    .replace(/\^/g, "**")
    .replace(/X/g, "x")
    .replace(/(\d|\))\s*x/g, "$1*x")
    .replace(/x\s*(\()/g, "x*$1")
    .replace(/\bx\b/g, `(${xValue})`);

  if (!/^[0-9+\-*/().\s=*]+$/.test(normalized)) {
    throw new Error("Unsupported symbols.");
  }

  return normalized;
}

function evaluateExpression(expression, xValue = 0) {
  const jsExpression = toJsExpression(expression, xValue);
  // The expression is restricted to numeric math characters before evaluation.
  const value = Function(`"use strict"; return (${jsExpression});`)();
  if (!Number.isFinite(value)) throw new Error("Expression did not produce a finite number.");
  return value;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function solveArithmetic(problem) {
  const expression = normalizeMath(problem);
  if (expression.includes("=") || /[a-wyzA-WYZ]/.test(expression) || !expression) return null;

  const answer = evaluateExpression(expression);
  return {
    answer: formatNumber(answer),
    confidence: "high",
    source: "local",
    topic: "数值计算",
    steps: [
      `把题目整理为算式：${expression}`,
      "按括号、乘除、加减的顺序计算。",
      `得到结果：${formatNumber(answer)}`
    ]
  };
}

function solvePolynomialEquation(problem) {
  const expression = normalizeMath(problem).replace(/X/g, "x");
  if (!expression.includes("=") || !expression.includes("x")) return null;

  const [left, right] = expression.split("=");
  if (!left || !right) return null;

  const f = x => evaluateExpression(left, x) - evaluateExpression(right, x);
  const y0 = f(0);
  const y1 = f(1);
  const y2 = f(2);
  const a = (y2 - 2 * y1 + y0) / 2;
  const b = y1 - y0 - a;
  const c = y0;

  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) < 1e-9) {
      return {
        answer: Math.abs(c) < 1e-9 ? "任意实数" : "无解",
        confidence: "medium",
        source: "local",
        topic: "一元一次方程",
        steps: [
          `将方程移项为 f(x)=0：(${left}) - (${right}) = 0`,
          `化简后常数项为 ${formatNumber(c)}，x 系数为 ${formatNumber(b)}。`,
          Math.abs(c) < 1e-9 ? "恒等式成立，所以 x 可以是任意实数。" : "等式无法成立，所以无解。"
        ]
      };
    }

    const x = -c / b;
    return {
      answer: `x = ${formatNumber(x)}`,
      confidence: "high",
      source: "local",
      topic: "一元一次方程",
      steps: [
        `将方程移项为 f(x)=0：(${left}) - (${right}) = 0`,
        `识别出线性形式：${formatNumber(b)}x + ${formatNumber(c)} = 0`,
        `两边移项并相除：x = -${formatNumber(c)} / ${formatNumber(b)}`,
        `得到 x = ${formatNumber(x)}`
      ]
    };
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < -1e-9) {
    return {
      answer: "无实数解",
      confidence: "medium",
      source: "local",
      topic: "一元二次方程",
      steps: [
        `将方程整理为 ${formatNumber(a)}x^2 + ${formatNumber(b)}x + ${formatNumber(c)} = 0`,
        `判别式 Δ = b^2 - 4ac = ${formatNumber(discriminant)}`,
        "Δ < 0，所以没有实数解。"
      ]
    };
  }

  const sqrtD = Math.sqrt(Math.max(discriminant, 0));
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  const answer = Math.abs(x1 - x2) < 1e-9
    ? `x = ${formatNumber(x1)}`
    : `x1 = ${formatNumber(x1)}, x2 = ${formatNumber(x2)}`;

  return {
    answer,
    confidence: "high",
    source: "local",
    topic: "一元二次方程",
    steps: [
      `将方程整理为 ${formatNumber(a)}x^2 + ${formatNumber(b)}x + ${formatNumber(c)} = 0`,
      `计算判别式 Δ = ${formatNumber(discriminant)}`,
      "代入求根公式 x = (-b ± √Δ) / 2a。",
      `得到 ${answer}`
    ]
  };
}

function solveLocally(problem) {
  try {
    return solveArithmetic(problem) || solvePolynomialEquation(problem);
  } catch {
    return null;
  }

  return null;
}

function fallbackTutoring(problem, level) {
  const local = solveLocally(problem);
  if (local) return local;

  return {
    answer: "需要进一步识别题型",
    confidence: "low",
    source: "local",
    topic: "通用数学题",
    steps: [
      "先圈出已知量、未知量和要求的目标。",
      "把文字条件改写成算式或方程。",
      level === "primary" ? "用画图、列表或逆推检查关系。" : "选择对应方法：代数化简、函数分析、几何定理或概率模型。",
      "当前本地演示器能稳定处理四则运算、一元一次方程和部分一元二次方程；配置 API key 后可覆盖更多题型。"
    ]
  };
}

function fallbackPaperAnalysis(profile, images) {
  const gaps = profile && Array.isArray(profile.gaps) ? profile.gaps : ["待识别"];
  return {
    summary: `已收到 ${images.length} 张试卷照片。当前处于本地演示模式，可先结合认知测试给出基础学习画像。`,
    gaps,
    errorPatterns: ["计算准确性", "审题完整性", "步骤表达"],
    recommendations: [
      "把错题按知识点和错因分类",
      "优先训练认知测试中的薄弱维度",
      "每次订正后做一次代入或单位检查"
    ],
    source: "local"
  };
}

function extractJson(text) {
  const cleaned = String(text || "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response did not include JSON.");
    return JSON.parse(match[0]);
  }
}

async function solveWithOpenAI({ problem, level, mode }) {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = [
    "你是一个严谨、鼓励式的中文数学助教。",
    "请解答学生的数学题，给出清晰但不过度冗长的步骤。",
    "只返回 JSON，不要 Markdown。",
    "JSON 结构：{\"answer\":\"...\",\"topic\":\"...\",\"confidence\":\"high|medium|low\",\"steps\":[\"...\"],\"checks\":[\"...\"]}",
    `学生阶段：${level}`,
    `模式：${mode}`,
    `题目：${problem}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const text = data.output_text ||
    (data.output || [])
      .flatMap(item => item.content || [])
      .map(content => content.text || "")
      .join("\n");

  const parsed = extractJson(text);
  return {
    answer: String(parsed.answer || "未返回答案"),
    confidence: parsed.confidence || "medium",
    source: "openai",
    topic: parsed.topic || "数学题",
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    checks: Array.isArray(parsed.checks) ? parsed.checks : []
  };
}

async function analyzePaperWithOpenAI({ profile, images }) {
  if (!process.env.OPENAI_API_KEY) return null;

  const content = [
    {
      type: "input_text",
      text: [
        "你是一个中文数学学习诊断专家。",
        "请根据学生的认知测试画像和近期试卷照片，分析能力短板、错因类型和后续训练建议。",
        "只返回 JSON，不要 Markdown。",
        "JSON 结构：{\"summary\":\"...\",\"gaps\":[\"...\"],\"errorPatterns\":[\"...\"],\"recommendations\":[\"...\"],\"source\":\"openai\"}",
        `认知测试画像：${JSON.stringify(profile || {})}`
      ].join("\n")
    },
    ...images.slice(0, 5).map(image => ({
      type: "input_image",
      image_url: image.dataUrl
    }))
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const text = data.output_text ||
    (data.output || [])
      .flatMap(item => item.content || [])
      .map(contentItem => contentItem.text || "")
      .join("\n");

  const parsed = extractJson(text);
  return {
    summary: String(parsed.summary || "已完成试卷分析。"),
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    errorPatterns: Array.isArray(parsed.errorPatterns) ? parsed.errorPatterns : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    source: "openai"
  };
}

async function handleSolve(req, res) {
  try {
    const body = JSON.parse(await readBody(req) || "{}");
    const problem = String(body.problem || "").trim();
    const level = String(body.level || "middle");
    const mode = String(body.mode || "steps");

    if (!problem) {
      sendJson(res, 400, { error: "请输入数学题。" });
      return;
    }

    let solution = null;
    let apiError = null;

    try {
      solution = await solveWithOpenAI({ problem, level, mode });
    } catch (error) {
      apiError = error.message;
    }

    if (!solution) solution = fallbackTutoring(problem, level);

    sendJson(res, 200, {
      id: Date.now().toString(36),
      problem,
      level,
      mode,
      solution,
      apiError
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "服务端错误。" });
  }
}

async function handleAnalyzePaper(req, res) {
  try {
    const body = JSON.parse(await readBody(req) || "{}");
    const images = Array.isArray(body.images) ? body.images : [];
    const profile = body.profile || null;

    if (!images.length) {
      sendJson(res, 400, { error: "请先上传试卷照片。" });
      return;
    }

    const validImages = images
      .filter(image => typeof image.dataUrl === "string" && image.dataUrl.startsWith("data:image/"))
      .slice(0, 5);

    if (!validImages.length) {
      sendJson(res, 400, { error: "没有可识别的图片。" });
      return;
    }

    let analysis = null;
    let apiError = null;

    try {
      analysis = await analyzePaperWithOpenAI({ profile, images: validImages });
    } catch (error) {
      apiError = error.message;
    }

    if (!analysis) analysis = fallbackPaperAnalysis(profile, validImages);

    sendJson(res, 200, {
      id: Date.now().toString(36),
      analysis,
      apiError
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "服务端错误。" });
  }
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const filePath = requestPath === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, requestPath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(resolved)] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/solve") {
    await handleSolve(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze-paper") {
    await handleAnalyzePaper(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Math AI MVP running at http://localhost:${PORT}`);
  console.log(process.env.OPENAI_API_KEY ? `OpenAI mode enabled with ${OPENAI_MODEL}` : "OpenAI key not found; local fallback mode enabled.");
});
