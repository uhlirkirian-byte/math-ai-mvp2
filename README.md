# Math AI MVP

一个轻量级数学 AI 助教 MVP。它提供题目输入、步骤化解答、答案展示、历史记录和示例题；没有 API key 时会使用本地规则引擎演示，有 `OPENAI_API_KEY` 时会调用 OpenAI Responses API。

## 启动

```powershell
.\start.ps1
```

或者直接使用 Codex 自带 Node 运行时：

```powershell
& "C:\Users\Lucy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

如果你的系统已经安装了 Node.js 和 npm，也可以运行：

```powershell
npm start
```

打开：

```text
http://localhost:4173
```

## 配置 AI

```powershell
$env:OPENAI_API_KEY="你的 API key"
$env:OPENAI_MODEL="gpt-4.1-mini"
& "C:\Users\Lucy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

## MVP 范围

- 本地稳定支持：四则运算、一元一次方程、部分一元二次方程。
- API 模式支持：文字题、几何、概率、函数、证明思路、试卷照片分析等更广题型。
- 前端包含：按 10 个认知维度抽题的数学认知诊断、近期试卷照片上传、能力画像、阶段选择、解题模式、答案步骤、检查点和本地历史记录。
- 老师端包含：15 题老师教学行为评测、TeacherProfile、老师讲稿上传、TeacherModule 保存、理解模块库筛选，以及基于学生画像的简单推荐规则。

## 老师教学方式数据库 V1.0

核心对象是 `TeacherModule`，不是传统课程 `Course`。

已实现：

- 老师教学行为评测：图像化理解、规律发现、类比解释、逻辑推导、步骤拆解、易错纠正、提问引导、情绪支持。
- `TeacherProfile` 字段：`teacherId`、`teacherName`、8 个教学维度分数、主教学风格、辅教学风格、创建时间。
- 讲稿模块字段：老师、标题、学科、年级、知识点、题型、难度、常见卡点、讲稿、第一句话、核心比喻、教学方式标签、适合学生类型、动画提示、使用数、有帮助数。
- 前台“理解模块库”：支持按老师、学科、年级、知识点、题型、卡点、教学方式标签、适合思维类型筛选。
- 学生端推荐规则：知识点、卡点、题型、学生思维类型、教学方式和 `helpfulCount` 排序。

## 给用户测试的正式链接

`file:///.../public/index.html` 只能在本机打开。要发给外部用户，需要部署到公网平台。

推荐 MVP 部署路线：

1. 把整个 `ai-mvp` 项目上传到 GitHub。
2. 在 Render、Railway、Fly.io、腾讯云或阿里云创建 Node Web Service。
3. 启动命令使用 `node server.js`。
4. 在后端平台配置环境变量 `OPENAI_API_KEY` 和可选的 `OPENAI_MODEL`。
5. 部署成功后，平台会给你一个 `https://...` 公网链接，发给用户即可。

项目里已经包含 `render.yaml`，如果使用 Render，可以直接从 GitHub 导入并配置 `OPENAI_API_KEY`。

注意：不要把 `OPENAI_API_KEY` 写进前端代码或发给用户。试卷照片属于隐私数据，真实测试前建议在页面增加用户同意提示、数据保存周期说明和删除机制。

## 下一步

- 增加拍照识题和 OCR。
- 增加学生错因诊断。
- 增加教师端题库和班级练习数据。
- 增加付费试用、账号体系和用量统计。
