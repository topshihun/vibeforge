/* ===== JS — 绘图 ===== */

// ---- 主画板 ----
function draw() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
  }

  // 已固定的方块
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null) {
        drawBlock(ctx, c, r, TETROMINOES[board[r][c]].color);
      }
    }
  }

  if (currentPiece && gameRunning) {
    const shape = getCurrentShape();
    const color = TETROMINOES[currentPiece.type].color;

    // 幽灵方块
    const ghostY = getGhostY();
    if (ghostY !== currentPiece.y) {
      ctx.globalAlpha = 0.15;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const x = (currentPiece.x + c) * BLOCK_SIZE;
            const y = (ghostY + r) * BLOCK_SIZE;
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 当前方块
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawBlock(ctx, currentPiece.x + c, currentPiece.y + r, color);
        }
      }
    }
  }

  // 暂停遮罩
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ---- 绘制单个方块 ----
function drawBlock(context, bx, by, color) {
  const x = bx * BLOCK_SIZE;
  const y = by * BLOCK_SIZE;
  const s = BLOCK_SIZE;
  const inset = 1;

  // 主体
  context.fillStyle = color;
  context.fillRect(x + inset, y + inset, s - inset * 2, s - inset * 2);

  // 高光
  context.fillStyle = 'rgba(255,255,255,0.2)';
  context.fillRect(x + inset, y + inset, s - inset * 2, 3);
  context.fillRect(x + inset, y + inset, 3, s - inset * 2);

  // 阴影
  context.fillStyle = 'rgba(0,0,0,0.2)';
  context.fillRect(x + s - inset - 3, y + inset, 3, s - inset * 2);
  context.fillRect(x + inset, y + s - inset - 3, s - inset * 2, 3);
}

// ---- 绘制下一个方块预览 ----
function drawNext() {
  const ctx2 = nextCtx;
  const size = 24;
  const offsetX = (120 - PREVIEW_SIZE * size) / 2;
  const offsetY = (120 - PREVIEW_SIZE * size) / 2;

  ctx2.fillStyle = '#0d0d1a';
  ctx2.fillRect(0, 0, 120, 120);

  if (!nextPiece) return;
  const shape = getShape(nextPiece.type, 0);
  const color = TETROMINOES[nextPiece.type].color;

  const rows = shape.length;
  const cols = shape[0].length;
  const px = offsetX + ((PREVIEW_SIZE - cols) * size) / 2;
  const py = offsetY + ((PREVIEW_SIZE - rows) * size) / 2;

  const origBlockSize = BLOCK_SIZE;
  BLOCK_SIZE = size;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) {
        const bx = (px + c * size) / size;
        const by = (py + r * size) / size;
        drawBlock(ctx2, bx, by, color);
      }
    }
  }

  BLOCK_SIZE = origBlockSize;
}
