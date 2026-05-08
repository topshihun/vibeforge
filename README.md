<div align="center">
  <h1>⚡ VibeForge</h1>
  <p><em>创意工坊 — 纯前端小项目合集</em></p>
</div>

---

## 📦 项目介绍

VibeForge 是一个**前端小项目合集**，包含游戏和实用工具。使用 [Bun](https://bun.sh) 作为本地开发服务器，项目采用纯 HTML/CSS/JS 构建，无需前端框架。

### 🎮 项目列表

| 项目 | 图标 | 说明 |
|------|------|------|
| 🐍 贪吃蛇 | `snake/` | 经典贪吃蛇，支持双人对战、穿墙模式 |
| 🧱 俄罗斯方块 | `tetris/` | 经典俄罗斯方块，幽灵预览、等级加速 |
| 🎯 坦克大战 | `tank-war/` | 经典坦克大战，多种墙体、敌方 AI、逐块摧毁 |
| ✈️ 飞机大战 | `plane-war/` | 雷霆出击，制霸长空，多种难度挑战 |
| 📄 简历制作 | `open-resume/` | 在线简历编辑与导出工具 |
| 🔐 编码与解码器 | `encode-decode/` | MD5、Base64、URL、SHA 等常用编解码工具 |
| 🧠 编译器实验室 | `compiler-lab/` | 编写 C 代码，编译为多架构汇编代码 |

## 🚀 快速开始

```bash
# 安装 Bun（如未安装）
# curl -fsSL https://bun.sh/install | bash

# 安装依赖
bun install

# 启动开发服务器（端口 8080）
bun run dev
```

访问 `http://localhost:8080` 即可浏览所有项目。

## 🏗️ 构建部署

```bash
# 构建静态文件到 dist/ 目录
bun run build
```

构建产物可直接部署到任何静态托管平台（推荐 Cloudflare Pages）。

## 📄 许可证

MIT