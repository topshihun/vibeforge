/* ===== JS — 核心游戏逻辑 ===== */

// ---- 生成食物（单人） ----
function spawnFood() {
  do {
    foods[0] = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
  } while (isOccupied(foods[0]));
}

// ---- 生成食物（双人） ----
function spawnFoodDual(playerIdx) {
  const idx = playerIdx === 0 ? 0 : 1;
  do {
    foods[idx] = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
  } while (isOccupied(foods[idx], playerIdx));
}

// ---- 位置是否被占用 ----
function isOccupied(pos, excludePlayer = -1) {
  if (gameMode === 'dual') {
    for (let i = 0; i < snakes.length; i++) {
      if (i === excludePlayer) continue;
      if (snakes[i].some(seg => seg.x === pos.x && seg.y === pos.y)) return true;
    }
    return false;
  }
  return snakes[0].some(seg => seg.x === pos.x && seg.y === pos.y);
}

// ---- 自身碰撞 ----
function checkSelfCollision(head, snakeIdx) {
  return snakes[snakeIdx].some(seg => seg.x === head.x && seg.y === head.y);
}

// ---- 初始化 ----
function init() {
  resizeCanvas();   // 适配屏幕大小
  scores = [0, 0];
  speeds = [120, 120];
  paused = false;

  if (gameMode === 'dual') {
    snakes = [
      [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }],
      [{ x: 14, y: 10 }, { x: 15, y: 10 }, { x: 16, y: 10 }]
    ];
    directions       = [{ x: 1, y: 0 }, { x: -1, y: 0 }];
    nextDirections   = [{ x: 1, y: 0 }, { x: -1, y: 0 }];
    foods = [
      { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 3) },
      { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT * 2 / 3) }
    ];
    scoreP1El.textContent = 'P1 得分: 0';
    scoreP2El.textContent = 'P2 得分: 0';
    scoreP2El.style.display = 'inline';
    infoBar.classList.add('p2');
    controlsHint.innerHTML = '<span style="color:#00ccff">P1: WASD</span> | <span style="color:#ff6bff">P2: 方向键</span> | 空格暂停';
  } else {
    snakes = [[{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]];
    directions[0]     = { x: 1, y: 0 };
    nextDirections[0] = { x: 1, y: 0 };
    foods = [];
    scores[0] = 0; scores[1] = 0;
    scoreP1El.textContent = '得分: 0';
    scoreP2El.style.display = 'none';
    infoBar.classList.remove('p2');
    controlsHint.textContent = '方向键 / WASD 控制方向 | 空格键 暂停';
    spawnFood();
  }

  scoreP1El.classList.remove('p1-color', 'p2-color');
  pauseOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'none';
  gameRunning = true;
  draw();
  gameLoop = setInterval(update, speeds[0]);
}

// ---- 更新分数 ----
function updateScores() {
  if (gameMode === 'dual') {
    scoreP1El.textContent = `P1 得分: ${scores[0]}`;
    scoreP2El.textContent = `P2 得分: ${scores[1]}`;
  } else {
    scoreP1El.textContent = `得分: ${scores[0]}`;
  }
}

// ---- 游戏结束 ----
function handleGameOver(loserIdx, reason) {
  gameRunning = false;
  clearInterval(gameLoop);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  if (totalScore > bestScore) {
    bestScore = totalScore;
    localStorage.setItem('snakeBest', bestScore);
    bestEl.textContent = bestScore;
  }

  const info = document.getElementById('gameOverInfo');

  if (gameMode === 'dual') {
    document.getElementById('gameOverTitle').textContent = '游戏结束';
    info.innerHTML =
      `<p>🟦 P1 得分: <b>${scores[0]}</b></p>
       <p>🟪 P2 得分: <b>${scores[1]}</b></p>
       <p style="margin-top:10px; color:#ff6b6b; font-size:1.3em">`;

    if (loserIdx === -1) {
      // 互撞 — 按分数判
      info.innerHTML +=
        scores[0] > scores[1] ? '🟦 P1 获胜！' :
        scores[1] > scores[0] ? '🟪 P2 获胜！' : '🤝 平局！';
    } else if (loserIdx === 0) {
      info.innerHTML += reason === 'self' ? '💥 P1 撞到自己！🟪 P2 获胜！' : '💥 P1 撞到对方！🟪 P2 获胜！';
    } else {
      info.innerHTML += reason === 'self' ? '💥 P2 撞到自己！🟦 P1 获胜！' : '💥 P2 撞到对方！🟦 P1 获胜！';
    }

    info.innerHTML += '</p>';
  } else {
    document.getElementById('gameOverTitle').textContent = '游戏结束';
    info.innerHTML =
      `<p class="mode-tag">${MODE_NAMES[gameMode]}</p>
       <p>得分: <b style="color:#ffd700; font-size:1.4em">${scores[0]}</b></p>`;
  }

  gameOverOverlay.style.display = 'block';
}

// ---- 返回主菜单 ----
function backToMenu() {
  if (gameLoop) clearInterval(gameLoop);
  gameRunning = false;
  paused = false;
  gameOverOverlay.style.display = 'none';
  pauseOverlay.style.display = 'none';
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  gameMode = 'classic';
  controlsHint.textContent = '';
  scoreP2El.style.display = 'none';
  infoBar.classList.remove('p2');
  // 重置模式选择高亮
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.querySelector('.mode-card[data-mode="classic"]').classList.add('selected');
}

// ---- 暂停切换 ----
function togglePause() {
  paused = !paused;
  if (paused) {
    pauseOverlay.style.display = 'block';
    draw();
  } else {
    pauseOverlay.style.display = 'none';
  }
}

// ---- 启动新游戏 ----
function menuStartGame() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('gameArea').style.display = 'flex';
  startGame();
}

function startGame() {
  if (gameLoop) clearInterval(gameLoop);
  init();
}

// ---- 主循环 ----
function update() {
  if (paused) return;

  const isDual = gameMode === 'dual';
  const count = isDual ? 2 : 1;

  // 双人模式：先计算出所有蛇的新头部，再统一检测碰撞
  let heads = [];
  for (let i = 0; i < count; i++) {
    directions[i] = { ...nextDirections[i] };
    const dir = directions[i];
    let head = {
      x: snakes[i][0].x + dir.x,
      y: snakes[i][0].y + dir.y
    };

    // 穿墙（单人 wrap 或双人模式均生效）
    if (gameMode === 'wrap' || gameMode === 'dual') {
      if (head.x < 0) head.x = TILE_COUNT - 1;
      if (head.x >= TILE_COUNT) head.x = 0;
      if (head.y < 0) head.y = TILE_COUNT - 1;
      if (head.y >= TILE_COUNT) head.y = 0;
    }

    // 经典 — 撞墙
    if (gameMode === 'classic') {
      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleGameOver(i); return;
      }
    }

    heads[i] = head;
  }

  // 双人模式碰撞检测
  if (isDual) {
    let dead = [false, false];
    let reasons = ['', ''];

    for (let i = 0; i < 2; i++) {
      // 撞自己
      if (checkSelfCollision(heads[i], i)) {
        dead[i] = true;
        reasons[i] = 'self';
      }
      // 撞对方身体（不含头）
      if (snakes[1 - i].some((seg, idx) => idx > 0 && seg.x === heads[i].x && seg.y === heads[i].y)) {
        dead[i] = true;
        if (!reasons[i]) reasons[i] = 'other';
      }
    }

    // 两头互撞
    if (heads[0].x === heads[1].x && heads[0].y === heads[1].y) {
      dead[0] = true;
      dead[1] = true;
    }

    if (dead[0] && dead[1]) {
      handleGameOver(-1);  // 互撞 — 按分数判
      return;
    }
    if (dead[0]) {
      handleGameOver(0, reasons[0] || 'other');
      return;
    }
    if (dead[1]) {
      handleGameOver(1, reasons[1] || 'other');
      return;
    }
  } else {
    // 单人 — 自身碰撞
    if (checkSelfCollision(heads[0], 0)) {
      handleGameOver(0);
      return;
    }
  }

  for (let i = 0; i < count; i++) {
    snakes[i].unshift(heads[i]);

    const foodIdx = i === 0 ? 0 : 1;
    if (heads[i].x === foods[foodIdx].x && heads[i].y === foods[foodIdx].y) {
      scores[i] += 10;
      updateScores();
      spawnFoodDual(i);
      if (speeds[i] > 60) {
        speeds[i] -= 2;
        clearInterval(gameLoop);
        gameLoop = setInterval(update, isDual ? Math.min(speeds[0], speeds[1]) : speeds[0]);
      }
    } else {
      snakes[i].pop();
    }
  }

  draw();
}

// ---- roundRect polyfill ----
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}