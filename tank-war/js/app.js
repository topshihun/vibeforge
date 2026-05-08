// ===== 坦克大战 · 应用入口 =====

let selectedLevel = 1;

function selectLevel(level) {
  selectedLevel = level;
  document.querySelectorAll('.home-level').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.level, 10) === level);
  });
  currentLevel = level;
  const saved = localStorage.getItem('tankWarBest');
  const bestScoreVal = parseInt(saved, 10) || 0;
  document.getElementById('homeHighScore').textContent = bestScoreVal || '—';
  document.getElementById('homeStatus').textContent = LEVELS[level - 1].label.replace(/^[^\s]+\s*/, '');
}

function menuStartGame() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('gameWrapper').style.display = 'flex';
  startGame();
}

function menuRestart() {
  document.getElementById('gameOverOverlay').style.display = 'none';
  startGame();
}

function backToMenu() {
  if (frameId) cancelAnimationFrame(frameId);
  gameRunning = false;
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('gameWrapper').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  const saved = localStorage.getItem('tankWarBest');
  if (saved) document.getElementById('homeHighScore').textContent = parseInt(saved, 10) || '—';
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const hint = document.getElementById('controlsHint');
  hint.textContent = '方向键/WASD 移动 · 空格/J 发射 · ESC 暂停';

  // 生成关卡按钮
  const list = document.getElementById('levelList');
  LEVELS.forEach(lv => {
    const btn = document.createElement('button');
    btn.className = 'home-level' + (lv.level === 1 ? ' selected' : '');
    btn.dataset.level = lv.level;
    btn.onclick = () => selectLevel(lv.level);
    btn.innerHTML = `<span class="level-num">${lv.level}</span><span class="level-name">${lv.label}</span>`;
    list.appendChild(btn);
  });

  const saved = localStorage.getItem('tankWarBest');
  if (saved) document.getElementById('homeHighScore').textContent = parseInt(saved, 10) || '—';
  selectLevel(1);
});
