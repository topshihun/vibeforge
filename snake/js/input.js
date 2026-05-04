/* ===== JS — 输入控制 ===== */

// ---- 设置方向 (移动按钮 / 触摸单体) ----
function setDirection(dx, dy) {
  const playerIdx = 0;
  const dir = { x: dx, y: dy };
  if (!(dir.x === -directions[playerIdx].x && dir.y === -directions[playerIdx].y)) {
    nextDirections[playerIdx] = dir;
  }
}

// ---- 键盘 ----
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  const p1 = () => { /* 通过下方 switch 直接赋值 */ };
  switch (e.key) {
    // P1: WASD
    case 'w': case 'W': e.preventDefault();
      if (!(directions[0].y === 1)) nextDirections[0] = { x: 0, y: -1 }; break;
    case 's': case 'S': e.preventDefault();
      if (!(directions[0].y === -1)) nextDirections[0] = { x: 0, y: 1 }; break;
    case 'a': case 'A': e.preventDefault();
      if (!(directions[0].x === 1)) nextDirections[0] = { x: -1, y: 0 }; break;
    case 'd': case 'D': e.preventDefault();
      if (!(directions[0].x === -1)) nextDirections[0] = { x: 1, y: 0 }; break;
    // P2: 方向键
    case 'ArrowUp':
      e.preventDefault();
      if (gameMode === 'dual' && directions[1].y !== 1) nextDirections[1] = { x: 0, y: -1 };
      else if (gameMode !== 'dual' && directions[0].y !== 1) nextDirections[0] = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (gameMode === 'dual' && directions[1].y !== -1) nextDirections[1] = { x: 0, y: 1 };
      else if (gameMode !== 'dual' && directions[0].y !== -1) nextDirections[0] = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (gameMode === 'dual' && directions[1].x !== 1) nextDirections[1] = { x: -1, y: 0 };
      else if (gameMode !== 'dual' && directions[0].x !== 1) nextDirections[0] = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (gameMode === 'dual' && directions[1].x !== -1) nextDirections[1] = { x: 1, y: 0 };
      else if (gameMode !== 'dual' && directions[0].x !== -1) nextDirections[0] = { x: 1, y: 0 };
      break;
    // 空格暂停
    case ' ':
      e.preventDefault();
      togglePause();
      break;
  }
});

// ---- 触摸 / 滑动 ----
let touchStartX, touchStartY;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', (e) => {
  if (touchStartX == null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

  if (gameMode === 'dual') {
    const rect = canvas.getBoundingClientRect();
    const p = touchStartX < rect.left + rect.width / 2 ? 0 : 1;
    const d = directions[p];
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && d.x !== -1) nextDirections[p] = { x: 1, y: 0 };
      else if (dx < 0 && d.x !== 1) nextDirections[p] = { x: -1, y: 0 };
    } else {
      if (dy > 0 && d.y !== -1) nextDirections[p] = { x: 0, y: 1 };
      else if (dy < 0 && d.y !== 1) nextDirections[p] = { x: 0, y: -1 };
    }
  } else {
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 1 : -1, 0);
    else setDirection(0, dy > 0 ? 1 : -1);
  }
});