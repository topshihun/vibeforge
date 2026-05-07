/* ===== JS — 2048 核心逻辑 ===== */

function initBoard() {
  board = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
  score = 0;
  gameOver = false;
  won = false;
  keepPlaying = false;
  addRandomTile();
  addRandomTile();
  updateScore();
  resizeCanvas();
}

function resizeCanvas() {
  const maxWidth = Math.min(window.innerWidth - 40, 500);
  const tileSize = Math.floor((maxWidth - GAP * (SIZE + 1)) / SIZE);
  // 更新全局 TILE_SIZE
  window.TILE_SIZE = tileSize;
  canvas.width = SIZE * tileSize + (SIZE + 1) * GAP;
  canvas.height = canvas.width;
  if (gameRunning) draw();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slideRow(row) {
  // 将一行向左滑动，返回 { row, score, moved }
  let arr = row.filter(v => v !== 0);
  let sc = 0;
  let merged = [];
  for (let i = 0; i < arr.length; i++) {
    if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      sc += arr[i];
      arr.splice(i + 1, 1);
      merged.push(true);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  const moved = row.some((v, i) => v !== arr[i]);
  return { row: arr, score: sc, moved };
}

function moveLeft() {
  let totalScore = 0;
  let moved = false;
  for (let r = 0; r < SIZE; r++) {
    const result = slideRow(board[r]);
    board[r] = result.row;
    totalScore += result.score;
    if (result.moved) moved = true;
  }
  score += totalScore;
  return moved;
}

function moveRight() {
  let totalScore = 0;
  let moved = false;
  for (let r = 0; r < SIZE; r++) {
    board[r].reverse();
    const result = slideRow(board[r]);
    board[r] = result.row;
    board[r].reverse();
    totalScore += result.score;
    if (result.moved) moved = true;
  }
  score += totalScore;
  return moved;
}

function moveUp() {
  let totalScore = 0;
  let moved = false;
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = 0; r < SIZE; r++) col.push(board[r][c]);
    const result = slideRow(col);
    for (let r = 0; r < SIZE; r++) board[r][c] = result.row[r];
    totalScore += result.score;
    if (result.moved) moved = true;
  }
  score += totalScore;
  return moved;
}

function moveDown() {
  let totalScore = 0;
  let moved = false;
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = SIZE - 1; r >= 0; r--) col.push(board[r][c]);
    const result = slideRow(col);
    for (let r = SIZE - 1; r >= 0; r--) board[r][c] = result.row[SIZE - 1 - r];
    totalScore += result.score;
    if (result.moved) moved = true;
  }
  score += totalScore;
  return moved;
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 2048) return true;
    }
  }
  return false;
}

function handleMove(direction) {
  if (!gameRunning || gameOver || animating) return;

  let moved = false;
  switch (direction) {
    case 'left':  moved = moveLeft();  break;
    case 'right': moved = moveRight(); break;
    case 'up':    moved = moveUp();    break;
    case 'down':  moved = moveDown();  break;
  }

  if (!moved) return;

  addRandomTile();
  updateScore();
  draw();

  if (!keepPlaying && hasWon()) {
    won = true;
    showWinOverlay();
    return;
  }

  if (!canMove()) {
    gameOver = true;
    showGameOver();
  }
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('g2048Best', String(bestScore));
  }
  bestScoreEl.textContent = bestScore;
}

function showWinOverlay() {
  const overlay = document.getElementById('winOverlay');
  overlay.style.display = 'flex';
}

function showGameOver() {
  const overlay = document.getElementById('gameOverOverlay');
  overlay.style.display = 'flex';
  finalScoreEl.textContent = score;
  finalBestEl.textContent = bestScore;
}

function continueGame() {
  document.getElementById('winOverlay').style.display = 'none';
  keepPlaying = true;
}

function restartGame() {
  document.getElementById('winOverlay').style.display = 'none';
  gameOverOverlay.style.display = 'none';
  initBoard();
  draw();
}

function backToMenu() {
  gameOverOverlay.style.display = 'none';
  document.getElementById('winOverlay').style.display = 'none';
  gameContainer.style.display = 'none';
  mainMenu.style.display = 'flex';
  gameRunning = false;
}
