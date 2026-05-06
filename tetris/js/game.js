/* ===== JS — 俄罗斯方块核心逻辑 ===== */

// ---- 初始化棋盘 ----
function initBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push(new Array(COLS).fill(null));
  }
}

// ---- 随机生成方块 ----
function randomPiece() {
  const idx = Math.floor(Math.random() * TETROMINOES.length);
  return idx;
}

// ---- 生成新方块 ----
function spawnPiece() {
  if (!nextPiece) {
    nextPiece = { type: randomPiece(), rotation: 0 };
  }
  currentPiece = {
    type: nextPiece.type,
    rotation: nextPiece.rotation,
    x: Math.floor((COLS - getShape(nextPiece.type, nextPiece.rotation)[0].length) / 2),
    y: 0
  };
  nextPiece = { type: randomPiece(), rotation: 0 };

  lockTimer = null;
  lockMoves = 0;
  justLanded = false;

  // 检查是否立即碰撞 → 游戏结束
  if (collides(currentPiece.x, currentPiece.y, getCurrentShape())) {
    handleGameOver();
    return false;
  }
  return true;
}

// ---- 获取形状 ----
function getShape(type, rotation) {
  return TETROMINOES[type].shapes[rotation % TETROMINOES[type].shapes.length];
}
function getCurrentShape() {
  return getShape(currentPiece.type, currentPiece.rotation);
}

// ---- 碰撞检测 ----
function collides(x, y, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = x + c;
        const boardY = y + r;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
        if (boardY >= 0 && board[boardY][boardX] !== null) return true;
      }
    }
  }
  return false;
}

// ---- 固定方块到棋盘 ----
function lockPiece() {
  if (!currentPiece) return;
  const shape = getCurrentShape();
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = currentPiece.x + c;
        const boardY = currentPiece.y + r;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = currentPiece.type;
        }
      }
    }
  }

  // 消除满行
  clearLines();

  // 生成下一个
  const success = spawnPiece();
  if (success) {
    lockTimer = null;
    lockMoves = 0;
    justLanded = false;
  }
}

// ---- 消除满行 ----
function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; ) {
    let full = true;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === null) { full = false; break; }
    }
    if (full) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(null));
      cleared++;
      // 不移 r，继续检查同一行
    } else {
      r--;
    }
  }

  if (cleared > 0) {
    // 计分
    const addScore = (SCORE_TABLE[cleared] || 0) * level;
    score += addScore;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    if (level > LEVEL_SPEEDS.length) level = LEVEL_SPEEDS.length;
    updateUI();
    adjustSpeed();
  }
}

// ---- 移动 ----
function moveLeft() {
  if (!currentPiece || paused || !gameRunning) return;
  if (!collides(currentPiece.x - 1, currentPiece.y, getCurrentShape())) {
    currentPiece.x--;
    onMove();
  }
}
function moveRight() {
  if (!currentPiece || paused || !gameRunning) return;
  if (!collides(currentPiece.x + 1, currentPiece.y, getCurrentShape())) {
    currentPiece.x++;
    onMove();
  }
}

// ---- 旋转 ----
function rotatePiece() {
  if (!currentPiece || paused || !gameRunning) return;
  const shape = TETROMINOES[currentPiece.type].shapes;
  const newRot = (currentPiece.rotation + 1) % shape.length;
  const newShape = shape[newRot];

  // 尝试基本旋转
  if (!collides(currentPiece.x, currentPiece.y, newShape)) {
    currentPiece.rotation = newRot;
    onMove();
    return;
  }

  // 墙踢 (wall kick) — 左右偏移尝试
  const kicks = [-1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collides(currentPiece.x + kick, currentPiece.y, newShape)) {
      currentPiece.x += kick;
      currentPiece.rotation = newRot;
      onMove();
      return;
    }
  }
}

// ---- 下落 ----
function moveDown() {
  if (!currentPiece || paused || !gameRunning) return false;
  if (!collides(currentPiece.x, currentPiece.y + 1, getCurrentShape())) {
    currentPiece.y++;
    if (justLanded) {
      justLanded = false;
      lockTimer = null;
    }
    return true;
  } else {
    // 触底
    if (!justLanded) {
      justLanded = true;
      lockTimer = setTimeout(() => {
        if (justLanded && currentPiece) {
          lockPiece();
        }
      }, LOCK_DELAY);
    }
    return false;
  }
}

// ---- 硬降 ----
function hardDrop() {
  if (!currentPiece || paused || !gameRunning) return;
  let dropDist = 0;
  while (!collides(currentPiece.x, currentPiece.y + 1, getCurrentShape())) {
    currentPiece.y++;
    dropDist++;
  }
  score += dropDist * 2;
  updateUI();
  lockPiece();
}

// ---- 移动后重置锁 ----
function onMove() {
  if (justLanded) {
    lockMoves++;
    if (lockMoves <= MAX_LOCK_MOVES) {
      justLanded = false;
      if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
    }
  }
}

// ---- 获取幽灵方块 Y ----
function getGhostY() {
  if (!currentPiece) return 0;
  let gy = currentPiece.y;
  while (!collides(currentPiece.x, gy + 1, getCurrentShape())) {
    gy++;
  }
  return gy;
}

// ---- 更新 UI ----
function updateUI() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('tetrisBest', String(bestScore));
  }
  bestScoreEl.textContent = bestScore;
}

// ---- 调整速度 ----
function adjustSpeed() {
  if (!gameRunning) return;
  const idx = Math.min(level - 1, LEVEL_SPEEDS.length - 1);
  const speed = LEVEL_SPEEDS[idx];
  clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, speed);
}

// ---- 游戏 tick ----
function gameTick() {
  if (paused || !gameRunning || !currentPiece) return;
  moveDown();
  draw();
  drawNext();
}

// ---- 初始化游戏 ----
function initGame() {
  initBoard();
  score = 0;
  level = 1;
  lines = 0;
  paused = false;
  justLanded = false;
  if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
  nextPiece = { type: randomPiece(), rotation: 0 };
  spawnPiece();
  updateUI();
  pauseOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'none';
  gameRunning = true;
  resizeCanvas();
  const idx = Math.min(level - 1, LEVEL_SPEEDS.length - 1);
  gameLoop = setInterval(gameTick, LEVEL_SPEEDS[idx]);
  draw();
  drawNext();
}

// ---- 暂停切换 ----
function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pauseOverlay.style.display = paused ? 'flex' : 'none';
  if (!paused) { draw(); drawNext(); }
}

// ---- 游戏结束 ----
function handleGameOver() {
  gameRunning = false;
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
  if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
  finalScoreEl.textContent = score;
  finalLevelEl.textContent = level;
  gameOverOverlay.style.display = 'flex';
  draw();
}

// ---- 重新开始 ----
function restartGame() {
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
  initGame();
}

// ---- 返回菜单 ----
function backToMenu() {
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
  paused = false;
  gameRunning = false;
  pauseOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'none';
  gameContainer.style.display = 'none';
  mainMenu.style.display = 'flex';
}

// ---- 调整 Canvas 大小 ----
function resizeCanvas() {
  const maxBoardHeight = window.innerHeight * 0.75;
  const maxBoardWidth  = window.innerWidth * 0.45;
  const cellFromHeight = Math.floor(maxBoardHeight / ROWS);
  const cellFromWidth  = Math.floor(maxBoardWidth / COLS);
  BLOCK_SIZE = Math.max(16, Math.min(cellFromHeight, cellFromWidth, 36));
  canvas.width  = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  if (gameRunning) draw();
}
