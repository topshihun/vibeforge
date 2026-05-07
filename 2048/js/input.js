/* ===== JS — 输入控制 ===== */

document.addEventListener('keydown', (e) => {
  if (!gameRunning || gameOver) return;

  const keyMap = {
    'ArrowLeft':  'left',
    'ArrowRight': 'right',
    'ArrowUp':    'up',
    'ArrowDown':  'down',
  };

  const dir = keyMap[e.key];
  if (dir) {
    e.preventDefault();
    handleMove(dir);
  }
});

// 窗口调整
window.addEventListener('resize', () => {
  if (gameRunning) resizeCanvas();
});

// 触摸滑动
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning || gameOver) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (!gameRunning || gameOver) return;
  if (touchStartX === 0 && touchStartY === 0) return;

  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < 30) return; // 阈值

  if (absDx > absDy) {
    handleMove(dx > 0 ? 'right' : 'left');
  } else {
    handleMove(dy > 0 ? 'down' : 'up');
  }

  touchStartX = 0;
  touchStartY = 0;
  e.preventDefault();
}, { passive: false });
