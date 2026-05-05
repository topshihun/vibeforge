// ===== 飞机大战 · 应用入口 =====

let selectedMode = 'normal';

function selectMode(mode) {
  selectedMode = mode;
  // 更新选中状态
  document.querySelectorAll('.briefing-mode').forEach(el => {
    el.classList.toggle('selected', el.dataset.mode === mode);
  });
  // 更新菜单情报
  const saved = localStorage.getItem('planeWarBest');
  const bestScore = parseInt(saved, 10) || 0;
  document.getElementById('briefHighScore').textContent = bestScore || '—';
  document.getElementById('briefMode').textContent = DIFFICULTY[mode].label;
  document.getElementById('briefStatus').textContent = '就绪';
}

function menuStartGame() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('gameArea').style.display = 'flex';
  resetGame(selectedMode);
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  if (frameId) cancelAnimationFrame(frameId);
  frameId = null;
  gameLoop();
}

function backToMenu() {
  gameRunning = false;
  gamePaused = false;
  if (frameId) cancelAnimationFrame(frameId);
  frameId = null;
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
}

// ---- 游戏循环 ----
function gameLoop() {
  if (!gameRunning) return;
  if (gamePaused) return; // 暂停时不再继续

  handleInput();
  update();
  draw();

  frameId = requestAnimationFrame(gameLoop);
}

// ---- 初始化 ----
document.addEventListener('DOMContentLoaded', () => {
  const hint = document.getElementById('controlsHint');
  hint.textContent = '方向键/WASD 移动 · 空格射击 · ESC 暂停';
  
  // 初始化菜单情报
  const saved = localStorage.getItem('planeWarBest');
  if (saved) document.getElementById('briefHighScore').textContent = parseInt(saved, 10) || '—';
  selectMode('easy'); // 默认选中简单
});
