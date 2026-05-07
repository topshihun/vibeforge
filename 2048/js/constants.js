/* ===== JS — 常量 & DOM 引用 ===== */

const SIZE = 4;          // 4×4 棋盘
const TILE_SIZE = 100;   // 格子 px
const GAP = 12;          // 格子间距 px
const ANIM_DURATION = 100; // 动画 ms

// 2048 方块颜色映射
const TILE_COLORS = {
  0:     { bg: '#cdc1b4', fg: '#776e65' },
  2:     { bg: '#eee4da', fg: '#776e65' },
  4:     { bg: '#ede0c8', fg: '#776e65' },
  8:     { bg: '#f2b179', fg: '#f9f6f2' },
  16:    { bg: '#f59563', fg: '#f9f6f2' },
  32:    { bg: '#f67c5f', fg: '#f9f6f2' },
  64:    { bg: '#f65e3b', fg: '#f9f6f2' },
  128:   { bg: '#edcf72', fg: '#f9f6f2' },
  256:   { bg: '#edcc61', fg: '#f9f6f2' },
  512:   { bg: '#edc850', fg: '#f9f6f2' },
  1024:  { bg: '#edc53f', fg: '#f9f6f2' },
  2048:  { bg: '#edc22e', fg: '#f9f6f2' },
  4096:  { bg: '#3c3a32', fg: '#f9f6f2' },
  8192:  { bg: '#3c3a32', fg: '#f9f6f2' },
};

// DOM 引用
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');

// 游戏状态
let board = [];           // SIZE × SIZE
let score = 0;
let bestScore = parseInt(localStorage.getItem('g2048Best') || '0');
let gameRunning = false;
let gameOver = false;
let won = false;
let keepPlaying = false;  // 达到2048后继续玩

// 动画
let animating = false;
