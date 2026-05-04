/* ===== JS — 应用入口 ===== */

bestEl.textContent = bestScore;

// ---- 模式选择 ----
function selectMode(mode) {
  gameMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('selected');
}