<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:0e0c28,100:2d1b69&text=VibeForge&fontSize=60&fontAlignY=35&desc=创意工坊%20·%20小项目合集&descSize=16&descAlignY=55" width="100%">

<p>
  <img src="https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff&style=flat-square">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff&style=flat-square">
  <img src="https://img.shields.io/badge/Vanilla-js-F7DF1E?logo=javascript&logoColor=000&style=flat-square">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=flat-square">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
</p>

**VibeForge** 是一个轻量级前端小项目合集，使用 [Bun](https://bun.sh/) 统一构建，支持 Cloudflare Pages 部署。

</div>

---

## 项目一览

| # | 项目 | 目录 | 描述 | 标签 |
|---|------|------|------|------|
| 1 | 🐍 贪吃蛇 | `snake/` | 经典贪吃蛇，支持双人对战、穿墙模式 | 游戏·双人 |
| 2 | ✈️ 飞机大战 | `plane-war/` | 雷霆出击，制霸长空，多种难度挑战 | 游戏 |
| 3 | 🧱 俄罗斯方块 | `tetris/` | 经典俄罗斯方块，幽灵预览、等级加速 | 游戏 |
| 4 | 🎮 2048 | `2048/` | 合并数字方块，挑战 2048 高分 | 游戏 |
| 5 | 🎀 坦克大战 | `tank-war/` | 卡哇伊坦克大作战，甜心风格射击游戏 | 游戏 |
| 6 | 📄 简历制作 | `open-resume/` | 在线简历编辑与导出工具 | 工具 |
| 7 | 🔐 编解码器 | `encode-decode/` | MD5、Base64、URL、SHA 等常用编解码工具 | 工具 |
| 8 | 💰 Steam 比价 | `steam-price/` | 搜索 Steam 游戏，多币种价格与史低 | 工具 |
| 9 | 🧠 编译器实验室 | `compiler-lab/` | 编写 C 代码，编译为多架构汇编 | 工具·教学 |
| 10 | 📠 PDF 扫描模拟 | `pdf-scan/` | 导入 PDF，添加水印/倾斜/噪点/发黄，导出扫描件风格 PDF | 工具·PDF |

---

## 构建流程

```
.
├── build.mjs              # 统一构建脚本
├── components/
│   └── projects.json      # 项目清单（自动发现）
├── dist/                  # 构建产物 (gitignored)
└── <project>/
    ├── index.html         # 入口页面
    ├── app.js             # 源码（vanilla JS）或 package.json（built 项目）
    └── style.css          # 样式
```

构建脚本自动扫描 `projects.json` 中所有子项目：

- **简单项目**（无 `package.json` 构建脚本）— 提取 `<script src>` 中的本地 JS 合并为 `js/app.js`，CDN/外部脚本保留在 HTML 中原位加载
- **内置构建项目**（有 `package.json` + `build` 脚本）— 执行 `bun install && bun run build`，复制产物

```bash
bun run build   # → dist/ 目录
```

| 输出 | 说明 |
|------|------|
| `dist/<project>/index.html` | 处理后的入口页面（本地 JS 合为单个 bundle） |
| `dist/<project>/js/app.js` | 合并后的 JS bundle |
| `dist/<project>/style.css` | 源样式（原样拷贝） |
| `dist/_redirects` | Cloudflare Pages 重定向规则 |

### 本地开发

```bash
bun run dev     # 启动静态服务器 → http://localhost:8080
```

支持任意静态文件服务器（Live Server、Python http.server 等）。

---

## 部署

一键部署到 Cloudflare Pages：

1. 连接 GitHub 仓库
2. 构建命令：`bun run build`
3. 输出目录：`dist`
4. `_redirects` 已内置，无需额外配置

---

## 技术栈

| 工具 | 用途 |
|------|------|
| [Bun](https://bun.sh/) | JavaScript 运行时 + 构建脚本运行器 |
| Vanilla JS | 大部分项目的 UI 逻辑 |
| React + TypeScript | 部分复杂项目（简历、编译器） |
| pdf.js / pdf-lib | PDF 扫描模拟器的渲染与生成 |

---

<div align="center">

[MIT](./LICENSE) · VibeForge · ❤️

</div>
