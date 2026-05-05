// ===== 飞机大战 · 游戏核心逻辑 =====

// ---- 玩家 ----
let player = null
let bullets = [];
let enemies = [];
let explosions = [];
let particles = [];

let score = 0;
let bestScore = 0;
let hp = PLAYER_START_HP;
let gameRunning = false;
let gamePaused = false;
let currentDifficulty = 'normal';

let lastBulletTime = 0;
let lastEnemySpawn = 0;
let frameId = null;

function createPlayer() {
  return {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - 70,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    invincibleUntil: 0,
  };
}

function resetGame(difficulty) {
  currentDifficulty = difficulty || currentDifficulty;
  player = createPlayer();
  bullets = [];
  enemies = [];
  explosions = [];
  particles = [];
  score = 0;
  hp = PLAYER_START_HP;
  gameRunning = true;
  gamePaused = false;
  lastBulletTime = 0;
  lastEnemySpawn = 0;
  updateUI();
}

function startGame() {
  resetGame(currentDifficulty);
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  if (frameId) cancelAnimationFrame(frameId);
  gameLoop();
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  document.getElementById('pauseOverlay').style.display = gamePaused ? 'block' : 'none';
  // 恢复时重新启动循环（暂停时loop已退出）
  if (!gamePaused) {
    gameLoop();
  }
}

function gameOver() {
  gameRunning = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('planeWarBest', bestScore);
  }
  updateUI();
  document.getElementById('gameOverTitle').textContent = '💥 游戏结束';
  document.getElementById('gameOverInfo').innerHTML = `
    <p>得分: <strong style="color:#ffd700">${score}</strong></p>
    <p>最高: <strong style="color:#ff6b6b">${bestScore}</strong></p>
    <p class="mode-tag">${DIFFICULTY[currentDifficulty].label}</p>
  `;
  document.getElementById('gameOverOverlay').style.display = 'block';
}

function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('bestScore').textContent = bestScore;
  document.getElementById('hp').textContent = hp;
}

function getDifficulty() {
  return DIFFICULTY[currentDifficulty];
}

// ---- 玩家射击 ----
function playerFire() {
  if (!gameRunning || gamePaused) return;
  const now = performance.now();
  if (now - lastBulletTime < BULLET_COOLDOWN) return;
  lastBulletTime = now;
  bullets.push({
    x: player.x + player.w / 2 - BULLET_WIDTH / 2,
    y: player.y - BULLET_HEIGHT,
    w: BULLET_WIDTH,
    h: BULLET_HEIGHT,
    vy: BULLET_SPEED,
  });
}

// ---- 生成敌人 ----
function spawnEnemy() {
  const diff = getDifficulty();
  if (enemies.length >= diff.maxEnemies) return;
  const size = ENEMY_WIDTH + (Math.random() - 0.5) * 10;
  enemies.push({
    x: Math.random() * (CANVAS_WIDTH - size),
    y: -size,
    w: size,
    h: size,
    vy: ENEMY_BASE_SPEED + Math.random() * diff.speedMult,
    hp: Math.random() < 0.2 ? 2 : 1, // 20% 精英敌机
    type: Math.random() < 0.2 ? 'elite' : 'normal',
  });
}

// ---- 更新逻辑 ----
function update() {
  if (!gameRunning || gamePaused) return;

  const now = performance.now();

  // 生成敌人
  const diff = getDifficulty();
  if (now - lastEnemySpawn > diff.spawnInterval) {
    lastEnemySpawn = now;
    spawnEnemy();
  }

  // 更新子弹
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.vy;
    if (b.y + b.h < 0 || b.y > CANVAS_HEIGHT) {
      bullets.splice(i, 1);
      continue;
    }
  }

  // 更新敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.vy;
    if (e.y > CANVAS_HEIGHT) {
      enemies.splice(i, 1);
      continue;
    }
  }

  // 碰撞检测：子弹 vs 敌人
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let bulletUsed = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (rectCollide(b, e)) {
        e.hp--;
        if (e.hp <= 0) {
          addExplosion(e.x + e.w / 2, e.y + e.h / 2, e.type);
          score += e.type === 'elite' ? 30 : 10;
          enemies.splice(j, 1);
        }
        bulletUsed = true;
        break;
      }
    }
    if (bulletUsed) {
      bullets.splice(i, 1);
    }
  }

  // 碰撞检测：玩家 vs 敌人
  if (player && now > player.invincibleUntil) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (rectCollide(player, e)) {
        addExplosion(e.x + e.w / 2, e.y + e.h / 2, 'small');
        enemies.splice(i, 1);
        hp--;
        player.invincibleUntil = now + INVINCIBLE_MS;
        if (hp <= 0) {
          gameOver();
        }
        updateUI();
        break;
      }
    }
  }

  // 更新爆炸特效
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].life -= 16;
    if (explosions[i].life <= 0) {
      explosions.splice(i, 1);
    }
  }

  // 更新粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 16;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  updateUI();
}

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function addExplosion(cx, cy, type) {
  const count = type === 'elite' ? 20 : 10;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const colors = type === 'elite'
      ? ['#ff4444', '#ff8800', '#ffcc00']
      : ['#ff6644', '#ffaa00', '#ffdd44'];
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 300 + Math.random() * 200,
    });
  }
}

// ---- 移动玩家 ----
function movePlayer(dx, dy) {
  if (!gameRunning || gamePaused || !player) return;
  player.x += dx * player.speed;
  player.y += dy * player.speed;
  // 边界限制
  player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.w, player.x));
  player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.h, player.y));
}