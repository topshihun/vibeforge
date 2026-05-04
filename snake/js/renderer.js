/* ===== JS — 绘图 ===== */

function draw() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格
  ctx.strokeStyle = '#1a2744';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < TILE_COUNT; i++) {
    ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
  }

  // 穿墙模式无额外边界提示

  // 双人模式无额外分隔线

  const isDual = gameMode === 'dual';
  const count  = isDual ? 2 : 1;

  // 画蛇
  for (let i = 0; i < count; i++) {
    const snake     = snakes[i];
    const headColor = i === 0 ? '#00ccff' : '#ff6bff';
    const bodyColor = i === 0 ? '#0099cc'  : '#cc33cc';

    snake.forEach((seg, j) => {
      const g = ctx.createRadialGradient(
        seg.x * GRID_SIZE + GRID_SIZE / 2, seg.y * GRID_SIZE + GRID_SIZE / 2, 2,
        seg.x * GRID_SIZE + GRID_SIZE / 2, seg.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2
      );
      if (j === 0) {
        g.addColorStop(0, headColor);
        g.addColorStop(1, bodyColor);
      } else {
        const a = 1 - (j / snake.length) * 0.4;
        g.addColorStop(0, headColor + Math.round(a * 255).toString(16).padStart(2, '0'));
        g.addColorStop(1, bodyColor + Math.round(a * 255).toString(16).padStart(2, '0'));
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
      ctx.fill();
    });
  }

  // 画食物
  const foodCount = isDual ? 2 : 1;
  for (let i = 0; i < foodCount; i++) {
    const f     = foods[i];
    const color = i === 0 ? '#ff6b6b' : '#ffaa33';
    const g = ctx.createRadialGradient(
      f.x * GRID_SIZE + GRID_SIZE / 2, f.y * GRID_SIZE + GRID_SIZE / 2, 2,
      f.x * GRID_SIZE + GRID_SIZE / 2, f.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2
    );
    g.addColorStop(0, color);
    g.addColorStop(1, color + 'cc');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x * GRID_SIZE + GRID_SIZE / 2, f.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 暂停（覆盖层由 HTML 控制，这里只加半透明遮罩）
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}