// ===== 坦克大战 · 游戏核心逻辑 =====

// ---- 游戏状态 ----
let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let walls = [];
let items = [];       // 场景道具
let sparkles = [];
let floatingTexts = [];

let score = 0;
let bestScore = 0;
let hp = PLAYER_START_HP;
let gameRunning = false;
let gamePaused = false;
let currentLevel = 1;          // 当前关卡 (1~MAX_LEVEL)
let enemiesSpawned = 0;        // 已生成敌人数
let enemiesDefeated = 0;       // 已消灭敌人数
let gameTime = 0;
let lastBulletTime = 0;
let lastEnemySpawn = 0;
let frameId = null;
let levelCleared = false;      // 防止多次触发过关

// ---- 趣味系统 ----
let shakeIntensity = 0;         // 屏幕震动强度（像素）
let combo = 0;                  // 连杀计数
let lastKillTime = 0;           // 上次击杀时间
const COMBO_TIMEOUT = 2000;     // 连杀超时（ms）

// ---- 玩家创建 ----
function createPlayer() {
  return {
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - 80,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    invincibleUntil: 0,
    dir: 0, // 0=上,1=右,2=下,3=左
    blink: 0,
    speedBoostUntil: 0,   // 加速结束时间
    bulletBoostUntil: 0,  // 强力弹（子弹速度加倍）结束时间
  };
}

// ---- 墙壁初始化（从关卡配置转换到像素坐标） ----
function initWalls() {
  walls = [];
  const cfg = LEVELS[currentLevel - 1];
  for (const w of cfg.walls) {
    const [gx, gy, gw, gh, type] = w;
    // 将每个矩形拆分成 1x1 的独立格子供逐个摧毁
    for (let row = 0; row < gh; row++) {
      for (let col = 0; col < gw; col++) {
        walls.push({
          x: (gx + col) * GRID_CELL,
          y: (gy + row) * GRID_CELL,
          w: GRID_CELL,
          h: GRID_CELL,
          type: type,
          hp: type === WALL_BRICK ? 2 : Infinity,
        });
      }
    }
  }
}

// ---- 道具初始化（从关卡配置转换到像素坐标） ----
function initItems() {
  items = [];
  const cfg = LEVELS[currentLevel - 1];
  const now = performance.now();
  for (const it of cfg.items) {
    const [gx, gy, type] = it;
    items.push({
      x: gx * GRID_CELL + 4, y: gy * GRID_CELL + 4,
      w: GRID_CELL - 8, h: GRID_CELL - 8,
      type: type,
      spawnTime: now,
    });
  }
}

// ---- 敌人创建 ----
function createEnemy(x, y, type) {
  const cfg = LEVELS[currentLevel - 1];
  const isElite = type === ENEMY_BOSS || type === ENEMY_HEAVY;
  const size = type === ENEMY_BOSS ? 48 : (type === ENEMY_FAST ? 22 : ENEMY_SIZE);
  const hp = type === ENEMY_BOSS ? 5 : (type === ENEMY_HEAVY ? 3 : 1);
  const speed = type === ENEMY_FAST ? cfg.speedMult * 2.2
               : type === ENEMY_HEAVY ? cfg.speedMult * 0.6
               : (1 + Math.random() * 0.5) * cfg.speedMult;
  return {
    x, y,
    w: size, h: size,
    speed: speed,
    dir: 2,
    hp: hp,
    type: type || 'normal',
    thinkTimer: 0,
    thinkInterval: isElite ? (600 + Math.random() * 400) : (800 + Math.random() * 500),
    shootTimer: 0,
    fireInterval: cfg.enemyFireRate + Math.random() * 500,
    moveDir: 0,
  };
}

// ---- 重置游戏 ----
function resetGame(level) {
  currentLevel = level || 1;
  player = createPlayer();
  bullets = [];
  enemyBullets = [];
  enemies = [];
  walls = [];
  items = [];
  sparkles = [];
  floatingTexts = [];
  score = 0;
  hp = PLAYER_START_HP;
  enemiesSpawned = 0;
  enemiesDefeated = 0;
  gameTime = 0;
  lastBulletTime = 0;
  lastEnemySpawn = 0;
  levelCleared = false;
  initWalls();
  initItems();
  gameRunning = true;
  gamePaused = false;
  updateUI();
  document.getElementById('levelOverlay').style.display = 'none';
  showLevelTitle();
}

// ---- 显示关卡标题 ----
function showLevelTitle() {
  const cfg = LEVELS[currentLevel - 1];
  const el = document.getElementById('levelTitle');
  el.textContent = cfg.label;
  el.style.display = 'block';
  el.style.opacity = '1';
  setTimeout(() => {
    el.style.transition = 'opacity 0.8s ease';
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.display = 'none';
      el.style.transition = '';
    }, 800);
  }, 1500);
}

// ---- 开始游戏 ----
function startGame() {
  resetGame(currentLevel);
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('levelOverlay').style.display = 'none';
  if (frameId) cancelAnimationFrame(frameId);
  gameLoop();
}

// ---- 暂停 ----
function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  document.getElementById('pauseOverlay').style.display = gamePaused ? 'flex' : 'none';
  if (!gamePaused) gameLoop();
}

// ---- 游戏结束 ----
function gameOver() {
  gameRunning = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('tankWarBest', bestScore);
  }
  updateUI();
  document.getElementById('gameOverIcon').textContent = '💔';
  document.getElementById('gameOverTitle').textContent = '💔 游戏结束';
  document.getElementById('gameOverInfo').innerHTML = `
    <p>到达关卡: <strong style="color:#C3AED6">${LEVELS[currentLevel - 1].label}</strong></p>
    <p>得分: <strong style="color:#FF69B4">${score}</strong></p>
    <p>最高: <strong style="color:#FFD700">${bestScore}</strong></p>
  `;
  document.getElementById('gameOverOverlay').style.display = 'flex';
}

// ---- 过关 ----
function advanceLevel() {
  levelCleared = true;
  // 暂停帧循环，清除画面
  gameRunning = false;

  // 显示过关提示
  document.getElementById('levelOverlayIcon').textContent = '🎉';
  document.getElementById('levelOverlayTitle').textContent = `🎀 第${currentLevel}关通过！`;
  document.getElementById('levelOverlayInfo').innerHTML = `
    <p>得分: <strong style="color:#FF69B4">${score}</strong></p>
    <p>准备进入 <strong style="color:#C3AED6">${currentLevel + 1 > MAX_LEVEL ? '未知领域' : LEVELS[currentLevel].label}</strong></p>
  `;
  document.getElementById('levelOverlay').style.display = 'flex';
}

// ---- 开始下一关 ----
function nextLevel() {
  if (currentLevel >= MAX_LEVEL) {
    // 通关！
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('tankWarBest', bestScore);
    }
    document.getElementById('gameOverIcon').textContent = '🎉';
    document.getElementById('gameOverTitle').textContent = '🎀 恭喜通关！';
    document.getElementById('gameOverInfo').innerHTML = `
      <p>全部 <strong>${MAX_LEVEL}</strong> 关已完成！</p>
      <p>最终得分: <strong style="color:#FFD700">${score}</strong></p>
    `;
    document.getElementById('levelOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'flex';
    return;
  }
  currentLevel++;
  resetGame(currentLevel);
  document.getElementById('levelOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  if (frameId) cancelAnimationFrame(frameId);
  gameLoop();
}

// ---- 更新 UI ----
function updateUI() {
  const cfg = LEVELS[currentLevel - 1];
  document.getElementById('hpDisplay').textContent = '♥'.repeat(Math.max(0, hp));
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('bestDisplay').textContent = bestScore;
  document.getElementById('levelDisplay').textContent = `第${currentLevel}关`;
  const remaining = cfg.totalEnemies - enemiesDefeated;
  document.getElementById('enemyCountDisplay').textContent = Math.max(0, remaining);
}

// ---- 游戏循环 ----
function gameLoop() {
  if (!gameRunning || gamePaused) return;
  update();
  draw();
  frameId = requestAnimationFrame(gameLoop);
}

// ---- 更新逻辑 ----
function update() {
  if (!gameRunning || gamePaused || !player) return;

  // 处理输入（移动）
  handleInput();

  // 生成敌人
  const cfg = LEVELS[currentLevel - 1];
  if (enemiesSpawned < cfg.totalEnemies &&
      gameTime - lastEnemySpawn > cfg.spawnInterval &&
      enemies.length < cfg.maxEnemies) {
    spawnEnemy();
    lastEnemySpawn = gameTime;
  }

  // 更新玩家子弹
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.y + b.h < 0 || b.y > CANVAS_HEIGHT || b.x + b.w < 0 || b.x > CANVAS_WIDTH) { bullets.splice(i, 1); continue; }

    // 碰撞检测：子弹 vs 墙壁
    let wallHit = false;
    for (const w of walls) {
      if (w.type !== WALL_WATER && rectCollide(b, w)) {
        w.hp--;
        addSparkle(b.x, b.y, 4, w.type === WALL_STEEL ? ['#CFD8DC'] : ['#D4956A']);
        if (w.hp <= 0) {
          // 砖墙被摧毁
          walls.splice(walls.indexOf(w), 1);
          addSparkle(w.x + w.w/2, w.y + w.h/2, 8, ['#D4956A', '#E8B88A']);
        }
        wallHit = true;
        break;
      }
    }
    if (wallHit) { bullets.splice(i, 1); continue; }

    // 碰撞检测：子弹 vs 敌人
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (rectCollide(b, e)) {
        e.hp--;
        if (e.hp <= 0) {
          // 连杀系统 + 屏幕震动
          const now = performance.now();
          if (now - lastKillTime < COMBO_TIMEOUT) {
            combo++;
          } else {
            combo = 0;
          }
          lastKillTime = now;
          const comboBonus = combo > 0 ? combo * 5 : 0;
          shakeIntensity = e.type === ENEMY_BOSS ? 15 : (e.type === ENEMY_HEAVY ? 10 : 5);

          // 计算分数
          const basePts = e.type === ENEMY_BOSS ? 100 : (e.type === ENEMY_FAST ? 5 : (e.type === ENEMY_HEAVY ? 30 : 10));
          const pts = basePts + comboBonus;
          score += pts;
          enemiesDefeated++;
          addSparkle(e.x + e.w/2, e.y + e.h/2, (e.type === ENEMY_BOSS || e.type === ENEMY_HEAVY) ? 15 : 8, COLORS.sparkle);
          addFloatingText(e.x, e.y, `+${pts}`, '#FFD700');
          enemies.splice(j, 1);
          updateUI();

          // 检查是否过关
          if (enemiesDefeated >= cfg.totalEnemies && !levelCleared) {
            advanceLevel();
          }
        } else {
          addSparkle(b.x, b.y, 3, ['#FFD700']);
        }
        hit = true;
        break;
      }
    }
    if (hit) { bullets.splice(i, 1); }
  }

  // 更新敌人（智能AI）
  for (const e of enemies) {
    // AI 决策周期
    e.thinkTimer += 16;
    if (e.thinkTimer > e.thinkInterval) {
      e.thinkTimer = 0;
      const trackChance = (e.type === ENEMY_BOSS || e.type === ENEMY_HEAVY) ? 0.55 : 0.35;
      const r = Math.random();
      if (r < trackChance && player) {
        // 追踪玩家 - 选择距离更大的轴向
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          e.moveDir = dx > 0 ? 1 : 3; // 右 or 左
        } else {
          e.moveDir = dy > 0 ? 2 : 0; // 下 or 上
        }
      } else if (r < trackChance + 0.20) {
        // 随机换向
        e.moveDir = Math.floor(Math.random() * 4);
      } else if (player) {
        // 停止移动，转向玩家
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        e.moveDir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 1 : 3)
          : (dy > 0 ? 2 : 0);
      }
    }
    // 移动
    const dx = [0, 1, 0, -1][e.moveDir];
    const dy = [-1, 0, 1, 0][e.moveDir];
    e.x += dx * e.speed;
    e.y += dy * e.speed;
    e.x = Math.max(0, Math.min(CANVAS_WIDTH - e.w, e.x));
    e.y = Math.max(0, Math.min(CANVAS_HEIGHT - e.h - 80, e.y));
    // 墙壁碰撞（回退）
    if (wallCollides(e) && (dx !== 0 || dy !== 0)) {
      e.x -= dx * e.speed;
      e.y -= dy * e.speed;
      e.moveDir = Math.floor(Math.random() * 4);
    }
    e.dir = e.moveDir;

    // 敌人射击（有概率瞄准玩家）
    e.shootTimer += 16;
    if (e.shootTimer > e.fireInterval) {
      e.shootTimer = 0;
      // 计算射击方向
      let shootDir = e.dir;
      if (player && Math.random() < ((e.type === ENEMY_BOSS || e.type === ENEMY_HEAVY) ? 0.7 : 0.4)) {
        const pdx = player.x + player.w/2 - (e.x + e.w/2);
        const pdy = player.y + player.h/2 - (e.y + e.h/2);
        shootDir = Math.abs(pdx) > Math.abs(pdy)
          ? (pdx > 0 ? 1 : 3)
          : (pdy > 0 ? 2 : 0);
      }
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      let bx, by, bvx, bvy;
      switch (shootDir) {
        case 0: // 上
          bx = cx - 3; by = e.y - 6;
          bvx = 0; bvy = -ENEMY_BULLET_SPEED;
          break;
        case 1: // 右
          bx = e.x + e.w + 2; by = cy - 3;
          bvx = ENEMY_BULLET_SPEED; bvy = 0;
          break;
        case 2: // 下
          bx = cx - 3; by = e.y + e.h + 2;
          bvx = 0; bvy = ENEMY_BULLET_SPEED;
          break;
        case 3: // 左
          bx = e.x - 8; by = cy - 3;
          bvx = -ENEMY_BULLET_SPEED; bvy = 0;
          break;
      }
      enemyBullets.push({
        x: bx, y: by,
        w: 6, h: 6,
        vx: bvx, vy: bvy,
      });

      // Boss 散射：额外发射两枚斜向子弹
      if (e.type === ENEMY_BOSS && e.hp > 1) {
        const spreadAngle = 0.3; // ~17度
        const spreadDirs = [
          [bvx * Math.cos(spreadAngle) - bvy * Math.sin(spreadAngle),
           bvx * Math.sin(spreadAngle) + bvy * Math.cos(spreadAngle)],
          [bvx * Math.cos(-spreadAngle) - bvy * Math.sin(-spreadAngle),
           bvx * Math.sin(-spreadAngle) + bvy * Math.cos(-spreadAngle)],
        ];
        for (const [svx, svy] of spreadDirs) {
          enemyBullets.push({
            x: bx, y: by,
            w: 6, h: 6,
            vx: svx * 0.8, vy: svy * 0.8,
          });
        }
      }
    }
  }

  // 更新敌人子弹
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.y > CANVAS_HEIGHT + 20 || b.y < -20 || b.x < -20 || b.x > CANVAS_WIDTH + 20) {
      enemyBullets.splice(i, 1);
      continue;
    }
    // 碰撞检测：敌人子弹 vs 墙壁
    let eWallHit = false;
    for (const w of walls) {
      if (w.type !== WALL_WATER && rectCollide(b, w)) {
        addSparkle(b.x, b.y, 3, ['#CFD8DC']);
        eWallHit = true;
        break;
      }
    }
    if (eWallHit) { enemyBullets.splice(i, 1); continue; }
    // 碰撞检测：敌人子弹 vs 玩家
    if (player && rectCollide(b, player)) {
      const now = performance.now();
      if (now > player.invincibleUntil) {
        hp--;
        player.invincibleUntil = now + INVINCIBLE_MS;
        addSparkle(player.x + player.w/2, player.y + player.h/2, 10, ['#FF69B4', '#FFD700']);
        updateUI();
        if (hp <= 0) { gameOver(); return; }
      }
      enemyBullets.splice(i, 1);
    }
  }

  // 更新粒子
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.05;
    s.life -= 16;
    s.size *= 0.97;
    if (s.life <= 0 || s.size < 0.5) { sparkles.splice(i, 1); }
  }

  // 更新浮动文字
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 1;
    ft.life -= 16;
    if (ft.life <= 0) { floatingTexts.splice(i, 1); }
  }

  // 玩家闪烁 + 道具拾取 + 速度增益 + 子弹速度增益
  if (player) {
    const now = performance.now();
    player.blink = now < player.invincibleUntil ? Math.floor(now / 80) % 2 : 0;

    // 速度增益
    player.speed = now < player.speedBoostUntil ? PLAYER_SPEED * 2 : PLAYER_SPEED;

    // 子弹速度增益
    player.bulletSpeedMult = now < player.bulletBoostUntil ? 2 : 1;

    // 道具拾取
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (now - item.spawnTime > ITEM_LIFETIME) {
        items.splice(i, 1);
        continue;
      }
      if (rectCollide(player, item)) {
        const type = ITEM_TYPES[item.type];
        if (item.type === 'heal') {
          hp = Math.min(hp + 1, PLAYER_START_HP + 1);
          addFloatingText(item.x, item.y, '+♥', '#FF6B9D');
        } else if (item.type === 'shield') {
          player.invincibleUntil = now + type.duration;
          addFloatingText(item.x, item.y, '🛡️', '#87CEEB');
        } else if (item.type === 'speed') {
          player.speedBoostUntil = now + type.duration;
          player.speed = PLAYER_SPEED * 2;
          addFloatingText(item.x, item.y, '⚡', '#FFD700');
        } else if (item.type === 'rapid') {
          player.bulletBoostUntil = now + type.duration;
          addFloatingText(item.x, item.y, '💥 强力弹', '#FF69B4');
        }
        addSparkle(item.x + item.w/2, item.y + item.h/2, 6, ['#FFD700', '#FF69B4', '#87CEEB']);
        items.splice(i, 1);
        updateUI();
      }
    }
  }

  // 屏幕震动衰减
  if (shakeIntensity > 0) {
    shakeIntensity *= 0.85;
    if (shakeIntensity < 0.5) shakeIntensity = 0;
  }

  gameTime += 16;
  updateUI();
}

// ---- 生成敌人 ----
function spawnEnemy() {
  enemiesSpawned++;
  const cfg = LEVELS[currentLevel - 1];
  const x = 20 + Math.random() * (CANVAS_WIDTH - ENEMY_SIZE - 40);
  const y = -ENEMY_SIZE;

  // Boss：第5关和第10关的最后一只敌人
  const isBossLevel = currentLevel === 5 || currentLevel === 10;
  const isLastEnemy = enemiesSpawned >= cfg.totalEnemies;
  let type = 'normal';
  if (isBossLevel && isLastEnemy) {
    type = ENEMY_BOSS;
  } else {
    const r = Math.random();
    if (r < 0.15) type = ENEMY_FAST;
    else if (r < 0.35) type = ENEMY_HEAVY;
  }
  const e = createEnemy(x, y, type);
  enemies.push(e);

  // Boss 刷出特效
  if (type === ENEMY_BOSS) {
    addFloatingText(CANVAS_WIDTH/2, 80, '👑 BOSS 出现！', '#FFD700');
    addSparkle(CANVAS_WIDTH/2, 40, 20, ['#FFD700', '#FF69B4', '#FF0000']);
    shakeIntensity = 12;
  } else {
    addSparkle(x + e.w/2, 10, 5, ['#FFD700', '#FF69B4']);
  }
}

// ---- 玩家射击 ----
function playerFire() {
  if (!gameRunning || !player) return;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  let bx, by, bvx, bvy;
  switch (player.dir) {
    case 0: // 上
      bx = cx - BULLET_SIZE / 2; by = player.y - 6;
      bvx = 0; bvy = -BULLET_SPEED;
      break;
    case 1: // 右
      bx = player.x + player.w + 2; by = cy - BULLET_SIZE / 2;
      bvx = BULLET_SPEED; bvy = 0;
      break;
    case 2: // 下
      bx = cx - BULLET_SIZE / 2; by = player.y + player.h + 2;
      bvx = 0; bvy = BULLET_SPEED;
      break;
    case 3: // 左
      bx = player.x - BULLET_SIZE - 2; by = cy - BULLET_SIZE / 2;
      bvx = -BULLET_SPEED; bvy = 0;
      break;
  }
  const bMult = player.bulletSpeedMult || 1;
  bullets.push({
    x: bx, y: by,
    w: BULLET_SIZE, h: BULLET_SIZE,
    vx: bvx * bMult, vy: bvy * bMult,
  });
}

// ---- 玩家移动（外部调用） ----
function movePlayer(dx, dy) {
  if (!gameRunning || gamePaused || !player) return;
  const origX = player.x, origY = player.y;
  player.x += dx * player.speed;
  player.y += dy * player.speed;
  player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.w, player.x));
  player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.h, player.y));
  // 墙壁碰撞（阻止玩家穿墙）
  if (wallCollides(player)) {
    player.x = origX;
    player.y = origY;
  }

  // 更新朝向
  if (dx > 0) player.dir = 1;
  else if (dx < 0) player.dir = 3;
  else if (dy < 0) player.dir = 0;
  else if (dy > 0) player.dir = 2;
}

// ---- 矩形碰撞检测 ----
function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---- 墙壁碰撞检测（坦克/敌人 vs 墙壁） ----
function wallCollides(obj) {
  for (const w of walls) {
    if (w.type !== WALL_WATER && rectCollide(obj, w)) return true;
  }
  return false;
}

// ---- 退出游戏 ----
function quitGame() {
  gameRunning = false;
  gamePaused = false;
  if (frameId) cancelAnimationFrame(frameId);
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('levelOverlay').style.display = 'none';
  document.getElementById('levelTitle').style.display = 'none';
  document.getElementById('gameWrapper').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  const saved = localStorage.getItem('tankWarBest');
  if (saved) document.getElementById('homeHighScore').textContent = parseInt(saved, 10) || '—';
}

// ---- 添加粒子特效 ----
function addSparkle(cx, cy, count, colors) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    sparkles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 300 + Math.random() * 300,
    });
  }
}

// ---- 浮动加分文字 ----
function addFloatingText(x, y, text, color) {
  floatingTexts.push({
    x, y, text, color,
    life: 800,
  });
}
