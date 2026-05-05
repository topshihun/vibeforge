// ===== 飞机大战 · 输入处理 =====

const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    // 由 game loop 处理射击（持续按住）
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

  if (keys[' '] || keys['Space']) {
    playerFire();
  }
}

// 移动端触摸/鼠标控制
let mobileMoveInterval = null;
let mobileDirX = 0, mobileDirY = 0;

function movePlayerDir(dirX, dirY) {
  mobileDirX = dirX;
  mobileDirY = dirY;
  if (!mobileMoveInterval) {
    mobileMoveInterval = setInterval(() => {
      if (mobileDirX !== 0 || mobileDirY !== 0) {
        movePlayer(mobileDirX, mobileDirY);
      }
    }, 30);
  }
}

function stopPlayerMove() {
  mobileDirX = 0;
  mobileDirY = 0;
  if (mobileMoveInterval) {
    clearInterval(mobileMoveInterval);
    mobileMoveInterval = null;
  }
}

// 移动端按钮事件绑定
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-up, .btn-down, .btn-left, .btn-right').forEach(btn => {
    btn.addEventListener('touchend', stopPlayerMove);
    btn.addEventListener('mouseup', stopPlayerMove);
    btn.addEventListener('mouseleave', stopPlayerMove);
    btn.addEventListener('touchcancel', stopPlayerMove);
  });
});