# Tank War 🎮

基于 Canvas 的经典坦克大战游戏，纯 JavaScript 实现。

## 项目结构

```
tank-war/
├── index.html       # 入口页面
├── style.css        # 样式
├── js/
│   ├── app.js       # 应用入口
│   ├── constants.js # 常量定义
│   ├── game.js      # 游戏主逻辑
│   ├── input.js     # 输入处理
│   ├── renderer.js  # 渲染引擎
│   └── game_full.txt # 参考实现
├── validate.js      # 验证脚本
└── check_braces.ps1 # 括号检查脚本
```

## 功能特性

- 玩家控制坦克移动与射击
- 多种墙体类型（砖墙、钢墙、水域）
- 墙体拆分为独立单元格，被击中只摧毁单块
- 敌方坦克 AI 自动移动与射击

## 操作

| 按键 | 功能 |
|------|------|
| WASD | 移动 |
| 空格 | 射击 |

## 开发

```bash
# 语法检查
node validate.js
```
