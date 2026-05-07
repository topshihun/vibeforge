/* ===== JS — 应用入口 ===== */

bestScoreEl.textContent = bestScore;

function menuStartGame() {
  mainMenu.style.display = 'none';
  gameContainer.style.display = 'flex';
  gameRunning = true;
  initBoard();
  draw();
}

// 暴露给 HTML onclick
window.menuStartGame = menuStartGame;
window.restartGame   = restartGame;
window.backToMenu    = backToMenu;
window.continueGame  = continueGame;
window.resizeCanvas  = resizeCanvas;
