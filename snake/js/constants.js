/* ===== JS — 常量 & DOM 引用 ===== */

const TILE_COUNT = 20;
let GRID_SIZE = 20;

// DOM 元素
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');
const infoBar     = document.getElementById('infoBar');
const scoreP1El   = document.getElementById('scoreP1');
const scoreP2El   = document.getElementById('scoreP2');
const bestEl      = document.getElementById('best');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const pauseOverlay    = document.getElementById('pauseOverlay');
const controlsHint    = document.getElementById('controlsHint');

// ---- 画布尺寸自适应 ----
function resizeCanvas() {
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.75;
  const size = Math.min(maxW, maxH);
  const aligned = Math.floor(size / TILE_COUNT) * TILE_COUNT;
  const pxSize = Math.max(200, Math.min(aligned, 1000));
  const dpr = window.devicePixelRatio || 1;
  const logicalSize = Math.floor(pxSize / TILE_COUNT) * TILE_COUNT;
  canvas.style.width = logicalSize + 'px';
  canvas.style.height = logicalSize + 'px';
  GRID_SIZE = Math.floor(logicalSize / TILE_COUNT);
  canvas.width = TILE_COUNT * GRID_SIZE * dpr;
  canvas.height = TILE_COUNT * GRID_SIZE * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

// 游戏状态
let gameMode     = 'classic';   // classic | wrap | dual
let snakes       = [];          // [{x,y}[]]
let foods        = [];          // [{x,y}]
let directions   = [{}, {}];
let nextDirections = [{}, {}];
let scores       = [0, 0];
let bestScore    = parseInt(localStorage.getItem('snakeBest') || '0');
let gameLoop     = null;
let speeds       = [120, 120];
let paused       = false;
let gameRunning  = false;

const MODE_NAMES = { classic: '经典模式', wrap: '穿墙模式', dual: '双人模式' };