// ===== 飞机大战 · 渲染器 =====

function draw() {
  const ctx = document.getElementById('gameCanvas').getContext('2d');
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 背景星空（动态）
  drawStars(ctx);

  // 玩家
  if (player) {
    drawPlayer(ctx);
  }

  // 子弹
  for (const b of bullets) {
    drawBullet(ctx, b);
  }

  // 敌人
  for (const e of enemies) {
    drawEnemy(ctx, e);
  }

  // 粒子
  for (const p of particles) {
    drawParticle(ctx, p);
  }
}

// 星空背景
let starField = null;
function initStars() {
  starField = [];
  for (let i = 0; i < 80; i++) {
    starField.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      r: 0.5 + Math.random() * 1.5,
      speed: 0.3 + Math.random() * 0.8,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
}
initStars();

function drawStars(ctx) {
  for (const s of starField) {
    s.y += s.speed;
    if (s.y > CANVAS_HEIGHT) {
      s.y = -2;
      s.x = Math.random() * CANVAS_WIDTH;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${s.brightness * 0.6})`;
    ctx.fill();
  }
}

function drawPlayer(ctx) {
  const p = player;
  const now = performance.now();

  // 无敌闪烁
  if (now < p.invincibleUntil) {
    if (Math.floor(now / 100) % 2 === 0) return; // 闪烁
  }

  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2, size = 16;

  // 引擎火焰
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + size);
  ctx.lineTo(cx, cy + size + 6 + Math.random() * 4);
  ctx.lineTo(cx + 6, cy + size);
  ctx.fill();

  // 机身
  ctx.fillStyle = '#4488ff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);           // 机头
  ctx.lineTo(cx - size * 0.7, cy + size * 0.6); // 左翼
  ctx.lineTo(cx - size * 0.3, cy + size * 0.2);
  ctx.lineTo(cx - size * 0.3, cy + size);
  ctx.lineTo(cx - size * 0.1, cy + size);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.3);
  ctx.lineTo(cx + size * 0.1, cy + size * 0.3);
  ctx.lineTo(cx + size * 0.1, cy + size);
  ctx.lineTo(cx + size * 0.3, cy + size);
  ctx.lineTo(cx + size * 0.3, cy + size * 0.2);
  ctx.lineTo(cx + size * 0.7, cy + size * 0.6);
  ctx.closePath();
  ctx.fill();

  // 座舱
  ctx.fillStyle = '#aaddff';
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.3, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBullet(ctx, b) {
  const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#44ddff');
  grad.addColorStop(1, '#0066ff');
  ctx.fillStyle = grad;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  // 光晕
  ctx.shadowColor = '#44ddff';
  ctx.shadowBlur = 8;
  ctx.fillRect(b.x - 1, b.y - 2, b.w + 2, b.h + 4);
  ctx.shadowBlur = 0;
}

function drawEnemy(ctx, e) {
  const isElite = e.hp > 1;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  const size = e.w / 2;

  if (isElite) {
    // 精英敌机 - 红色，更大
    ctx.fillStyle = '#cc2244';
    ctx.beginPath();
    ctx.moveTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.8, cy - size * 0.4);
    ctx.lineTo(cx - size * 0.3, cy - size * 0.2);
    ctx.lineTo(cx - size * 0.3, cy - size);
    ctx.lineTo(cx + size * 0.3, cy - size);
    ctx.lineTo(cx + size * 0.3, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.8, cy - size * 0.4);
    ctx.closePath();
    ctx.fill();
    // 引擎火光
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + size);
    ctx.lineTo(cx, cy + size + 4);
    ctx.lineTo(cx + 4, cy + size);
    ctx.fill();
  } else {
    // 普通敌机 - 橙色
    ctx.fillStyle = '#ff6622';
    ctx.beginPath();
    ctx.moveTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.7, cy);
    ctx.lineTo(cx - size * 0.3, cy - size * 0.6);
    ctx.lineTo(cx + size * 0.3, cy - size * 0.6);
    ctx.lineTo(cx + size * 0.7, cy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawParticle(ctx, p) {
  const alpha = Math.max(0, p.life / 500);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}