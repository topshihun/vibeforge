/* ===== JS — 输入控制 ===== */

// ---- 键盘 ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    if (gameRunning) togglePause();
    return;
  }
  if (!gameRunning || paused) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      moveLeft();
      draw();
      drawNext();
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveRight();
      draw();
      drawNext();
      break;
    case 'ArrowUp':
      e.preventDefault();
      rotatePiece();
      draw();
      drawNext();
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveDown();
      draw();
      drawNext();
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      draw();
      drawNext();
      break;
  }
});

// ---- 窗口调整 ----
window.addEventListener('resize', resizeCanvas);
