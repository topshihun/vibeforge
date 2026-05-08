// ===== 坦克大战 · 渲染引擎 =====

function drawWalls(ctx) {
  for (const w of walls) {
    if (w.type === WALL_BRICK) {
      // 砖墙 — 画格子纹理
      ctx.fillStyle = COLORS.wallBrick;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = COLORS.wallBrickHi;
      ctx.fillRect(w.x, w.y, w.w, 4);
      // 水平缝线
      ctx.strokeStyle = COLORS.wallBrickLo;
      ctx.lineWidth = 1;
      for (let row = 0; row < Math.floor(w.h / 8); row++) {
        const ry = w.y + row * 8;
        ctx.beginPath();
        ctx.moveTo(w.x, ry + 3);
        ctx.lineTo(w.x + w.w, ry + 3);
        ctx.stroke();
        // 错缝
        for (let col = 0; col < Math.floor(w.w / 16); col++) {
          const rx = w.x + col * 16 + (row % 2 === 0 ? 0 : 8);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, ry + 8);
          ctx.stroke();
        }
      }
    } else if (w.type === WALL_STEEL) {
      // 钢墙 — 银色光泽
      ctx.fillStyle = COLORS.wallSteel;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = COLORS.wallSteelHi;
      ctx.fillRect(w.x, w.y, w.w, 3);
      ctx.fillRect(w.x, w.y, 3, w.h);
      ctx.fillStyle = COLORS.wallSteelLo;
      ctx.fillRect(w.x + w.w - 2, w.y, 2, w.h);
      ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2);
      // 螺钉装饰
      ctx.fillStyle = '#90A4AE';
      const screwPositions = [
        [w.x + 4, w.y + 4],
        [w.x + w.w - 4, w.y + 4],
        [w.x + 4, w.y + w.h - 4],
        [w.x + w.w - 4, w.y + w.h - 4],
      ];
      for (const [sx, sy] of screwPositions) {
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (w.type === WALL_WATER) {
      // 水域 — 半透明蓝色波纹
      ctx.fillStyle = COLORS.wallWater;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.globalAlpha = 1;
      // 波纹
      ctx.strokeStyle = COLORS.wallWaterHi;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      const t = performance.now() / 800;
      for (let row = 0; row < Math.floor(w.h / 12); row++) {
        ctx.beginPath();
        const ry = w.y + row * 12 + 6;
        for (let col = 0; col < Math.floor(w.w / 8); col++) {
          const rx = w.x + col * 8;
          const yy = ry + Math.sin((rx + t * 20) / 20) * 3;
          col === 0 ? ctx.moveTo(rx, yy) : ctx.lineTo(rx, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}

function drawItems(ctx) {
  const now = performance.now();
  for (const item of items) {
    const age = now - item.spawnTime;
    // 呼吸发光效果
    const pulse = 0.7 + Math.sin(now / 200 + item.x) * 0.3;
    const glow = Math.sin(now / 300 + item.y) * 0.3 + 0.7;

    // 发光光晕
    ctx.save();
    ctx.shadowColor = COLORS.itemGlow;
    ctx.shadowBlur = 12 * pulse;
    ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3})`;
    ctx.fillRect(item.x - 4, item.y - 4, item.w + 8, item.h + 8);
    ctx.restore();

    // 道具背景
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + pulse * 0.3})`;
    ctx.roundRect ? ctx.roundRect(item.x, item.y, item.w, item.h, 6) : ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fill();

    // 道具图标
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = ITEM_TYPES[item.type]?.emoji || '🎁';
    ctx.fillText(icon, item.x + item.w / 2, item.y + item.h / 2 + 1);

    // 过期警告 — 闪烁
    if (age > ITEM_LIFETIME - 3000) {
      if (Math.floor(now / 200) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(item.x, item.y, item.w, item.h);
      }
    }
  }
}

// ---- 主渲染函数 ----
function draw() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // 清空画布
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 屏幕震动
  ctx.save();
  if (shakeIntensity > 0.5) {
    const sx = (Math.random() - 0.5) * shakeIntensity * 2;
    const sy = (Math.random() - 0.5) * shakeIntensity * 2;
    ctx.translate(sx, sy);
  }

  // 背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // 网格
  ctx.strokeStyle = '#252540';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= CANVAS_WIDTH; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // 墙壁
  drawWalls(ctx);

  // 道具
  drawItems(ctx);

  // 绘制道具（玩家下方）
  // (已在 drawItems 中完成)

  // 玩家
  if (player && !player.blink) drawTank(ctx, player, true);

  // 敌人
  for (const e of enemies) drawTank(ctx, e, false);

  // 子弹
  for (const b of bullets) {
    ctx.fillStyle = COLORS.bulletPlayer;
    ctx.shadowColor = COLORS.bulletPlayer;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const b of enemyBullets) {
    ctx.fillStyle = COLORS.bullet;
    ctx.shadowColor = COLORS.bullet;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 粒子
  for (const s of sparkles) {
    ctx.globalAlpha = s.life / 600;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
  }
  ctx.globalAlpha = 1;

  // 浮动文字
  for (const ft of floatingTexts) {
    ctx.globalAlpha = ft.life / 800;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;

  // 恢复画布（取消震动偏移）
  ctx.restore();

  // 连杀计数显示（不跟随震动）
  ctx.save();
  if (combo > 0) {
    const now = performance.now();
    const elapsed = now - lastKillTime;
    if (elapsed < COMBO_TIMEOUT) {
      ctx.globalAlpha = 1 - elapsed / COMBO_TIMEOUT;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`🔥 x${combo} 连杀!`, CANVAS_WIDTH / 2, 80);
    }
  }
  ctx.restore();
}

// ---- 坦克绘制 ----
function drawTank(ctx, tank, isPlayer) {
  const { x, y, w, h, dir } = tank;
  const bodyColor = isPlayer ? COLORS.player : (tank.type && tank.type !== 'normal' ? COLORS.enemyElite : COLORS.enemy);
  const darkColor = isPlayer ? COLORS.playerDark : (tank.type && tank.type !== 'normal' ? COLORS.enemyEliteDark : COLORS.enemyDark);
  const trackColor = isPlayer ? COLORS.playerTrack : COLORS.enemyTrack;

  // 履带
  ctx.fillStyle = trackColor;
  if (dir === 0 || dir === 2) {
    ctx.fillRect(x, y, 6, h);
    ctx.fillRect(x + w - 6, y, 6, h);
  } else {
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y + h - 6, w, 6);
  }

  // 车体
  ctx.fillStyle = bodyColor;
  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 6;
  const pad = dir === 0 || dir === 2 ? 6 : 6;
  ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2);
  ctx.shadowBlur = 0;

  // 炮塔
  ctx.fillStyle = darkColor;
  const cx = x + w / 2, cy = y + h / 2;
  const tw = 12, th = 12;
  ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);

  // 炮管
  ctx.fillStyle = darkColor;
  const barrelLen = 10;
  switch (dir) {
    case 0: ctx.fillRect(cx - 2, cy - th / 2 - barrelLen, 4, barrelLen + th / 2); break;
    case 1: ctx.fillRect(cx + th / 2, cy - 2, barrelLen + th / 2, 4); break;
    case 2: ctx.fillRect(cx - 2, cy + th / 2, 4, barrelLen + th / 2); break;
    case 3: ctx.fillRect(cx - th / 2 - barrelLen, cy - 2, barrelLen + th / 2, 4); break;
  }

  // 特殊敌人标记
  if (tank.type === ENEMY_BOSS) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', cx, cy - h / 2 - 10);
  } else if (tank.type === ENEMY_HEAVY) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy - h / 2 - 6);
  } else if (tank.type === ENEMY_FAST) {
    ctx.fillStyle = '#87CEEB';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', cx, cy - h / 2 - 6);
  }
}
