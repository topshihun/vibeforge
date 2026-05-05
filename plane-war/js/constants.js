// ===== 飞机大战 · 常量与配置 =====

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 36;
const PLAYER_SPEED = 3;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = -5;
const BULLET_COOLDOWN = 200; // ms

const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 30;
const ENEMY_BASE_SPEED = 1.5;

// 难度配置
const DIFFICULTY = {
  easy:   { spawnInterval: 1500, speedMult: 0.5, maxEnemies: 4, label: '🌱 简单' },
  normal: { spawnInterval: 1200, speedMult: 0.8, maxEnemies: 8, label: '⚡ 普通' },
  hard:   { spawnInterval: 800,  speedMult: 1.2, maxEnemies: 12, label: '🔥 困难' },
};

const PLAYER_START_HP = 3;
const INVINCIBLE_MS = 2500; // 受伤后无敌时间