// ===== 坦克大战 · 输入处理 =====

const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.key === ' ' || e.key === 'Space' || e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
    e.preventDefault();
    playerFire();
  }
  if (e.key === 'Escape') {
    togglePause();
  }
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// 游戏循环中处理键盘输入（每帧调用）
function handleInput() {
  if (!gameRunning || gamePaused || !player) return;

  let dx = 0, dy = 0;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;

  if (dx !== 0 || dy !== 0) {
    movePlayer(dx, dy);
  }
}

// ---- 移动端触摸/鼠标控制 ----
let moveInterval = null;

function movePlayerDir(dx, dy) {
  if (!gameRunning || gamePaused) return;
  movePlayer(dx, dy);
  if (moveInterval) clearInterval(moveInterval);
  moveInterval = setInterval(() => {
    movePlayer(dx, dy);
  }, 50);
}

function stopPlayerMove() {
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

// 页面加载完成后，阻止按钮长按菜单
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => e.preventDefault());
  });
  // 停止触摸移动
  document.querySelectorAll('.dpad-btn.up, .dpad-btn.down, .dpad-btn.left, .dpad-btn.right').forEach(btn => {
    btn.addEventListener('touchend', stopPlayerMove);
    btn.addEventListener('mouseup', stopPlayerMove);
    btn.addEventListener('mouseleave', stopPlayerMove);
    btn.addEventListener('touchcancel', stopPlayerMove);
  });
});
