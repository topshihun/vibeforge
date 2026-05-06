/* ===== JS — 应用入口 ===== */

bestScoreEl.textContent = bestScore;

// ---- 菜单开始游戏 ----
function menuStartGame() {
  mainMenu.style.display = 'none';
  gameContainer.style.display = 'flex';
  initGame();
}

// 暴露移动端控制
window.moveLeft     = moveLeft;
window.moveRight    = moveRight;
window.rotatePiece  = rotatePiece;
window.hardDrop     = hardDrop;
window.restartGame  = restartGame;
window.backToMenu   = backToMenu;
