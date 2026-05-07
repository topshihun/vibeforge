/* ===== JS — 绘图 ===== */

function getTileSize() {
  return window.TILE_SIZE || TILE_SIZE;
}

function draw() {
  const ts = getTileSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 棋盘背景
  const boardSize = SIZE * ts + (SIZE + 1) * GAP;
  ctx.fillStyle = '#bbada0';
  roundRect(ctx, 0, 0, boardSize, boardSize, 6);
  ctx.fill();

  // 绘制每个格子
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      const x = GAP + c * (ts + GAP);
      const y = GAP + r * (ts + GAP);
      drawTile(x, y, value, ts);
    }
  }
}

function drawTile(x, y, value, ts) {
  const colors = TILE_COLORS[value] || TILE_COLORS[8192];
  const fontSize = Math.max(20, Math.floor(ts * (value >= 1000 ? 0.32 : value >= 100 ? 0.4 : 0.48)));

  // 方块背景
  ctx.fillStyle = colors.bg;
  roundRect(ctx, x, y, ts, ts, 4);
  ctx.fill();

  // 数字
  if (value !== 0) {
    ctx.fillStyle = colors.fg;
    ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x + ts / 2, y + ts / 2);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
