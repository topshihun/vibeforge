/* ===== JS — 常量 & DOM 引用 ===== */

// 游戏板尺寸
const COLS = 10;
const ROWS = 20;
const PREVIEW_SIZE = 4;   // 预览区域格子数
let BLOCK_SIZE = 30;      // 实际由 resizeCanvas 计算

// 七种方块定义 (四方向旋转)
// 每个方块: [形状名, 颜色, 4个旋转状态]
const TETROMINOES = [
  {
    name: 'I',
    color: '#00f0f0',
    shapes: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    ]
  },
  {
    name: 'O',
    color: '#f0f000',
    shapes: [
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]]
    ]
  },
  {
    name: 'T',
    color: '#a000f0',
    shapes: [
      [[0,1,0],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,1],[0,1,0]],
      [[0,1,0],[1,1,0],[0,1,0]]
    ]
  },
  {
    name: 'S',
    color: '#00f000',
    shapes: [
      [[0,1,1],[1,1,0],[0,0,0]],
      [[0,1,0],[0,1,1],[0,0,1]],
      [[0,0,0],[0,1,1],[1,1,0]],
      [[1,0,0],[1,1,0],[0,1,0]]
    ]
  },
  {
    name: 'Z',
    color: '#f00000',
    shapes: [
      [[1,1,0],[0,1,1],[0,0,0]],
      [[0,0,1],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,0],[0,1,1]],
      [[0,1,0],[1,1,0],[1,0,0]]
    ]
  },
  {
    name: 'J',
    color: '#0000f0',
    shapes: [
      [[1,0,0],[1,1,1],[0,0,0]],
      [[0,1,1],[0,1,0],[0,1,0]],
      [[0,0,0],[1,1,1],[0,0,1]],
      [[0,1,0],[0,1,0],[1,1,0]]
    ]
  },
  {
    name: 'L',
    color: '#f0a000',
    shapes: [
      [[0,0,1],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,0],[0,1,1]],
      [[0,0,0],[1,1,1],[1,0,0]],
      [[1,1,0],[0,1,0],[0,1,0]]
    ]
  }
];

// 分数表 (消行数 → 分数)
const SCORE_TABLE = [0, 100, 300, 500, 800];

// 等级速度 (ms)
const LEVEL_SPEEDS = [
  800, 720, 630, 550, 470, 380, 300, 220, 140, 100,
  80, 70, 60, 50, 40, 30, 20, 15, 12, 10
];

// DOM 元素
const canvas        = document.getElementById('gameCanvas');
const ctx           = canvas.getContext('2d');
const nextCanvas    = document.getElementById('nextCanvas');
const nextCtx       = nextCanvas.getContext('2d');
const scoreEl       = document.getElementById('score');
const levelEl       = document.getElementById('level');
const linesEl       = document.getElementById('lines');
const bestScoreEl   = document.getElementById('bestScore');
const finalScoreEl  = document.getElementById('finalScore');
const finalLevelEl  = document.getElementById('finalLevel');
const pauseOverlay  = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const mainMenu      = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');

// 游戏状态
let board     = [];   // ROWS × COLS
let score     = 0;
let level     = 1;
let lines     = 0;
let bestScore = parseInt(localStorage.getItem('tetrisBest') || '0');
let gameLoop  = null;
let paused    = false;
let gameRunning = false;

// 当前方块
let currentPiece = null;   // { type, rotation, x, y }
let nextPiece    = null;

// 锁延迟 (ms) — 防止瞬间硬降
const LOCK_DELAY = 500;
let lockTimer    = null;
let lockMoves    = 0;
const MAX_LOCK_MOVES = 15;

// 是否刚锁 (用于延迟检查)
let justLanded = false;
