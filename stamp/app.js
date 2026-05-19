/* === 印章生成器 — 核心逻辑 === */

(function () {
  'use strict';

  // ===== DOM 引用 =====
  const $ = id => document.getElementById(id);
  const canvas  = $('stampCanvas');
  const ctx     = canvas.getContext('2d');

  const shapeTabs   = document.querySelectorAll('.shape-tab');
  const sizeSlider  = $('sizeSlider');
  const sizeValue   = $('sizeValue');
  const borderW     = $('borderWidth');
  const borderWVal  = $('borderWidthValue');
  const primaryClr  = $('primaryColor');
  const secondaryClr= $('secondaryColor');
  const topText     = $('topText');
  const mainText    = $('mainText');
  const bottomText  = $('bottomText');
  const fontSize    = $('fontSize');
  const fontSizeVal = $('fontSizeValue');

  // 第二行文字
  const secondLine   = $('secondLine');
  // 文字排版
  const starSize     = $('starSize');
  const starSizeVal  = $('starSizeValue');
  const charSpacing  = $('charSpacing');
  const charSpacingVal = $('charSpacingValue');
  // 旋转
  const rotation     = $('rotation');
  const rotationVal  = $('rotationValue');

  // 布局微调
  const starOffset   = $('starOffset');
  const starOffVal   = $('starOffsetValue');
  const mainYOffset  = $('mainYOffset');
  const mainYOffVal  = $('mainYOffsetValue');

  // 防伪
  const notchCount   = $('notchCount');
  const notchCountVal= $('notchCountValue');
  const notchAnglesContainer = $('notchAnglesContainer');
  const downloadBtn = $('downloadBtn');

  // 自定义下拉
  const borderStyleTrigger  = $('borderStyleTrigger');
  const borderStyleDropdown  = $('borderStyleDropdown');
  const borderStyleText     = $('borderStyleText');
  const borderStyleOptions  = document.querySelectorAll('.select-option');

  // ===== 状态 =====
  let currentShape = 'circle';
  let notchAngles = []; // 每个缺口的角度（度）

  // ===== 获取配置 =====
  function getConfig() {
    const size = parseInt(sizeSlider.value);
    const nc = parseInt(notchCount.value);
    console.log('[getConfig] notchCount=', nc, 'notchAngles=', JSON.stringify(notchAngles), 'notchAnglesLen=', notchAngles.length);
    return {
      shape:        currentShape,
      size,
      borderWidth:  parseFloat(borderW.value),
      primary:      primaryClr.value,
      secondary:    secondaryClr.value,
      top:          topText.value.trim(),
      main:         mainText.value.trim() || '印章',
      bottom:       bottomText.value.trim(),
      fontSize:     parseInt(fontSize.value),
      starOffset:   parseInt(starOffset.value),
      mainYOffset:  parseInt(mainYOffset.value),
      notchCount:   nc,
      notchAngles:  notchAngles, // 每个缺口的独立角度
      secondLine:   secondLine.value.trim(),
      starSize:     parseFloat(starSize.value),
      charSpacing:  parseFloat(charSpacing.value),
      borderStyle:  borderStyleTrigger.dataset.value || 'thick-thin',
      rotation:     parseInt(rotation.value),
    };
  }

  // ===== 绘制弧形文字（支持圆形和椭圆路径） =====
  // radiusX 水平半径, radiusY 垂直半径（圆则两者相等）
  function drawArcText(text, cx, cy, radiusX, radiusY, fontSize, color, align = 'center', inward = false, letterSpacing = 0) {
    if (!text) return;
    const chars = [...text];

    ctx.save();
    ctx.font = `bold ${fontSize}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const charWidths = chars.map(c => ctx.measureText(c).width);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, chars.length - 1) || 1;

    // 动态弧长跨度：总文字宽度 / 半径，加 15% 余量
    // 短文字 → 窄弧集中在顶部，长文字 → 宽弧自然向下延伸
    let totalAngle = totalWidth * 1.15 / radiusY;
    totalAngle = Math.max(Math.PI / 4, Math.min(7 * Math.PI / 6, totalAngle)); // 45°~210°

    // 居中对称：顶部弧以 0 (正上方) 为中心，底部（inward）以 π 为中心
    const midAngle = inward ? Math.PI : 0;
    const startAngle = midAngle - totalAngle / 2;

    let curAngle;
    if (align === 'center') {
      // 从中间向两边分布
      const halfTotal = totalWidth / 2;
      let offset = 0;
      for (let i = 0; i < chars.length; i++) {
        const charOffset = offset + charWidths[i] / 2;
        const frac = (charOffset - halfTotal) / totalWidth;
        curAngle = startAngle + totalAngle / 2 + frac * totalAngle;
        if (curAngle < 0) curAngle += 2 * Math.PI;
        if (curAngle >= 2 * Math.PI) curAngle -= 2 * Math.PI;

        const x = cx + radiusX * Math.sin(curAngle);
        const y = cy - radiusY * Math.cos(curAngle);
        const tangentAngle = Math.atan2(radiusY * Math.sin(curAngle), radiusX * Math.cos(curAngle));
        const rotateAngle = inward ? tangentAngle + Math.PI : tangentAngle;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotateAngle);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        offset += charWidths[i] + letterSpacing;
      }
    } else {
      // 从左到右
      let offset = 0;
      for (let i = 0; i < chars.length; i++) {
        const charOffset = offset + charWidths[i] / 2;
        const frac = charOffset / totalWidth;
        curAngle = startAngle + frac * totalAngle;
        if (curAngle >= 2 * Math.PI) curAngle -= 2 * Math.PI;

        const x = cx + radiusX * Math.sin(curAngle);
        const y = cy - radiusY * Math.cos(curAngle);
        const tangentAngle = Math.atan2(radiusY * Math.sin(curAngle), radiusX * Math.cos(curAngle));
        const rotateAngle = inward ? tangentAngle + Math.PI : tangentAngle;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotateAngle);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        offset += charWidths[i] + letterSpacing;
      }
    }
    ctx.restore();
  }

  // ===== 绘制圆形印章 =====
  function drawCircleStamp(cfg) {
    const { size, borderWidth, primary, secondary, top, main, bottom, fontSize: fs, starOffset, mainYOffset, notchCount, notchAngles, secondLine, starSize: starSz, charSpacing: cs, borderStyle: bs, rotation: rot } = cfg;
    const cx = size / 2, cy = size / 2;
    const R = size / 2 - borderWidth;

    ctx.clearRect(0, 0, size, size);

    // 外圈（带防伪缺口，支持多种边框样式）
    drawCircleOuter(cx, cy, R, borderWidth, primary, notchCount, notchAngles, bs);

    // 五角星（使用可调大小 starSz）
    if (main && main.length <= 4) {
      const starY = cy - fs * 0.9 + starOffset;
      drawStar(cx, starY, starSz, primary);
    } else if (main) {
      const mainFs = Math.min(fs, R * 0.35);
      const textTop = cy + 4 - mainFs / 2;
      const starY = textTop - 6 - 4 + starOffset;
      drawStar(cx, starY, starSz, primary);
    } else {
      drawStar(cx, cy - fs * 0.8 + starOffset, starSz, primary);
    }

    // 上方弧形文字
    if (top) {
      const arcFontSize = Math.min(fs * 0.55, R * 0.15);
      const arcR = R - borderWidth * 2 - arcFontSize * 0.6;
      drawArcText(top, cx, cy, arcR, arcR, arcFontSize, primary, 'center', false, cs);
    }

    // 中间主文字
    if (main) {
      const mainFs = Math.min(fs, R * 0.35);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${mainFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(main, cx, cy + 4 + mainYOffset);
      ctx.restore();
    }

    // 第二行文字
    if (secondLine) {
      const slFs = Math.min(fs * 0.6, R * 0.2);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${slFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(secondLine, cx, cy + 4 + mainYOffset + (main ? fs * 0.45 : 0));
      ctx.restore();
    }

    // 底部编号
    if (bottom) {
      const bottomFs = Math.min(fs * 0.5, R * 0.13);
      const bR = R - borderWidth * 2 - bottomFs * 0.6;
      drawArcText(bottom, cx, cy, bR, bR, bottomFs, primary, 'center', true, cs);
    }
  }

  // ===== 绘制椭圆印章 =====
  function drawEllipseStamp(cfg) {
    const { size, borderWidth, primary, secondary, top, main, bottom, fontSize: fs, starOffset, mainYOffset, notchCount, notchAngles, secondLine, starSize: starSz, charSpacing: cs, borderStyle: bs, rotation: rot } = cfg;
    const cx = size / 2, cy = size / 2;
    const rx = size / 2 - borderWidth;
    const ry = rx * 0.65;
    const innerRx = rx - borderWidth * 2;
    const innerRy = ry - borderWidth * 2;

    ctx.clearRect(0, 0, size, size);

    // 外椭圆（带防伪缺口，支持多种边框样式）
    drawEllipseOuter(cx, cy, rx, ry, borderWidth, primary, notchCount, notchAngles, bs);

    // 五角星（可调大小）
    const starY = cy - fs * 0.6 + starOffset;
    drawStar(cx, starY, starSz, primary);

    // 上方弧形文字
    if (top) {
      const arcFontSize = Math.min(fs * 0.5, ry * 0.18, rx * 0.1);
      const arcRx = innerRx - arcFontSize * 0.6;
      const arcRy = innerRy - arcFontSize * 0.6;
      drawArcText(top, cx, cy, arcRx, arcRy, arcFontSize, primary, 'center', false, cs);
    }

    // 中间主文字
    if (main) {
      const mainFs = Math.min(fs, ry * 0.4);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${mainFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(main, cx, cy + 4 + mainYOffset);
      ctx.restore();
    }

    // 第二行文字
    if (secondLine) {
      const slFs = Math.min(fs * 0.55, ry * 0.22);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${slFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(secondLine, cx, cy + 4 + mainYOffset + (main ? fs * 0.42 : 0));
      ctx.restore();
    }

    // 底部编号
    if (bottom) {
      const bottomFs = Math.min(fs * 0.5, ry * 0.14);
      const bRx = innerRx - bottomFs * 0.6;
      const bRy = innerRy - bottomFs * 0.6;
      drawArcText(bottom, cx, cy, bRx, bRy, bottomFs, primary, 'center', true, cs);
    }
  }

  // ===== 绘制矩形印章 =====
  function drawRectStamp(cfg) {
    const { size, borderWidth, primary, secondary, top, main, bottom, fontSize: fs, mainYOffset, secondLine, charSpacing: cs, borderStyle: bs } = cfg;
    const pad = borderWidth;
    const w = size - pad * 2;
    const h = w * 0.6;
    const ox = (size - w) / 2;
    const oy = (size - h) / 2;

    ctx.clearRect(0, 0, size, size);

    // 外框（支持边框样式）
    if (bs === 'single') {
      ctx.strokeStyle = primary;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(ox, oy, w, h);
    } else if (bs === 'double') {
      const gap = borderWidth * 0.6;
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = primary;
      ctx.strokeRect(ox, oy, w, h);
      ctx.strokeRect(ox + gap, oy + gap, w - gap * 2, h - gap * 2);
    } else { // thick-thin
      ctx.strokeStyle = primary;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(ox, oy, w, h);
      const innerPad = borderWidth * 2;
      ctx.strokeStyle = primary;
      ctx.lineWidth = Math.max(1, borderWidth * 0.4);
      ctx.strokeRect(ox + innerPad, oy + innerPad, w - innerPad * 2, h - innerPad * 2);
    }

    // 上方文字（水平居中）
    if (top) {
      const topFs = Math.min(fs * 0.45, h * 0.14);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${topFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(top, size / 2, oy + h * 0.38);
      ctx.restore();
    }

    // 中间主文字
    if (main) {
      const mainFs = Math.min(fs, h * 0.35, w * 0.18);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${mainFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(main, size / 2, oy + h * 0.6 + mainYOffset);
      ctx.restore();
    }

    // 第二行文字
    if (secondLine) {
      const slFs = Math.min(fs * 0.55, h * 0.18);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${slFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(secondLine, size / 2, oy + h * 0.6 + mainYOffset + (main ? fs * 0.42 : 0));
      ctx.restore();
    }

    // 底部编号
    if (bottom) {
      const bottomFs = Math.min(fs * 0.4, h * 0.12);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `${bottomFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bottom, size / 2, oy + h * 0.82);
      ctx.restore();
    }
  }

  // ===== 绘制圆角矩形印章 =====
  function drawRoundRectStamp(cfg) {
    const { size, borderWidth, primary, secondary, top, main, bottom, fontSize: fs, mainYOffset, secondLine, charSpacing: cs, borderStyle: bs } = cfg;
    const pad = borderWidth;
    const w = size - pad * 2;
    const h = w * 0.6;
    const ox = (size - w) / 2;
    const oy = (size - h) / 2;
    const r = Math.min(w, h) * 0.12;

    ctx.clearRect(0, 0, size, size);

    // 外框（支持边框样式）
    if (bs === 'single') {
      roundRect(ctx, ox, oy, w, h, r, primary, borderWidth);
    } else if (bs === 'double') {
      const gap = borderWidth * 0.6;
      roundRect(ctx, ox, oy, w, h, r, primary, borderWidth);
      roundRect(ctx, ox + gap, oy + gap, w - gap * 2, h - gap * 2, Math.max(2, r - gap), primary, borderWidth);
    } else { // thick-thin
      roundRect(ctx, ox, oy, w, h, r, primary, borderWidth);
      const i = borderWidth * 2;
      roundRect(ctx, ox + i, oy + i, w - i * 2, h - i * 2, Math.max(2, r - i), primary, Math.max(1, borderWidth * 0.4));
    }

    // 上方文字
    if (top) {
      const topFs = Math.min(fs * 0.45, h * 0.14);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${topFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(top, size / 2, oy + h * 0.38);
      ctx.restore();
    }

    // 中间主文字
    if (main) {
      const mainFs = Math.min(fs, h * 0.35, w * 0.18);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${mainFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(main, size / 2, oy + h * 0.6 + mainYOffset);
      ctx.restore();
    }

    // 第二行文字
    if (secondLine) {
      const slFs = Math.min(fs * 0.55, h * 0.18);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `bold ${slFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(secondLine, size / 2, oy + h * 0.6 + mainYOffset + (main ? fs * 0.42 : 0));
      ctx.restore();
    }

    // 底部编号
    if (bottom) {
      const bottomFs = Math.min(fs * 0.4, h * 0.12);
      ctx.save();
      ctx.fillStyle = primary;
      ctx.font = `${bottomFs}px "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bottom, size / 2, oy + h * 0.82);
      ctx.restore();
    }
  }

  // ===== 绘制五角星 =====
  function drawStar(cx, cy, r, color) {
    const spikes = 5;
    const outerR = r;
    const innerR = r * 0.4;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // ===== 绘制带缺口的圆形边框 =====
  function drawCircleWithNotches(cx, cy, R, lineWidth, color, count, angles) {
    const gap = 6 * Math.PI / 180; // 6° 缺口宽度
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    console.log('drawCircleWithNotches: count=', count, 'angles=', JSON.stringify(angles));

    if (count <= 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    const sorted = angles.slice(0, count).sort((a, b) => a - b);
    const rads = sorted.map(a => a * Math.PI / 180);
    // 每个弧段独立 beginPath/stroke，避免路径连接填平缺口
    for (let i = 0; i < count; i++) {
      const a0 = rads[i] + gap / 2;
      const a1 = i < count - 1 ? rads[i + 1] - gap / 2 : rads[0] + Math.PI * 2 - gap / 2;
      console.log(`  arc ${i}: a0=${(a0*180/Math.PI).toFixed(1)}° a1=${(a1*180/Math.PI).toFixed(1)}° a1>a0=${a1 > a0}`);
      if (a1 > a0) {
        ctx.beginPath();
        ctx.arc(cx, cy, R, a0, a1);
        ctx.stroke();
      }
    }
  }

  // ===== 绘制圆形边框（单线/双线/粗外细内） =====
  function drawCircleOuter(cx, cy, R, lineWidth, color, count, angles, style) {
    if (style === 'single') {
      drawCircleWithNotches(cx, cy, R, lineWidth, color, count, angles);
    } else if (style === 'double') {
      const innerR = R - lineWidth * 1.2;
      drawCircleWithNotches(cx, cy, R, lineWidth, color, count, angles);
      drawCircleWithNotches(cx, cy, innerR, lineWidth, color, count, angles);
    } else { // thick-thin
      drawCircleWithNotches(cx, cy, R, lineWidth, color, count, angles);
      const innerR = R - lineWidth * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, lineWidth * 0.4);
      ctx.stroke();
    }
  }

  // ===== 绘制带缺口的椭圆边框 =====
  function drawEllipseWithNotches(cx, cy, rx, ry, lineWidth, color, count, angles) {
    const gap = 6 * Math.PI / 180;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (count <= 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    const sorted = angles.slice(0, count).sort((a, b) => a - b);
    const rads = sorted.map(a => a * Math.PI / 180);
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a0 = rads[i] + gap / 2;
      const a1 = i < count - 1 ? rads[i + 1] - gap / 2 : rads[0] + Math.PI * 2 - gap / 2;
      if (a1 > a0) {
        ctx.ellipse(cx, cy, rx, ry, 0, a0, a1);
      }
    }
    ctx.stroke();
  }

  // ===== 绘制椭圆边框（单线/双线/粗外细内） =====
  function drawEllipseOuter(cx, cy, rx, ry, lineWidth, color, count, angles, style) {
    if (style === 'single') {
      drawEllipseWithNotches(cx, cy, rx, ry, lineWidth, color, count, angles);
    } else if (style === 'double') {
      const innerRx = rx - lineWidth * 1.2;
      const innerRy = ry - lineWidth * 1.2;
      drawEllipseWithNotches(cx, cy, rx, ry, lineWidth, color, count, angles);
      drawEllipseWithNotches(cx, cy, innerRx, innerRy, lineWidth, color, count, angles);
    } else { // thick-thin
      drawEllipseWithNotches(cx, cy, rx, ry, lineWidth, color, count, angles);
      const innerRx = rx - lineWidth * 2;
      const innerRy = ry - lineWidth * 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, lineWidth * 0.4);
      ctx.stroke();
    }
  }

  // ===== 绘制圆角矩形辅助 =====
  function roundRect(ctx, x, y, w, h, r, color, lineWidth) {
    r = Math.min(r, w / 2, h / 2);
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
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  // ===== 渲染主函数 =====
  function render() {
    const cfg = getConfig();
    // 使用 devicePixelRatio 确保清晰输出
    const dpr = window.devicePixelRatio || 1;
    const displaySize = cfg.size;
    canvas.width  = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width  = displaySize + 'px';
    canvas.style.height = displaySize + 'px';
    ctx.scale(dpr, dpr);
    // 整体旋转
    const rot = cfg.rotation;
    if (rot !== 0) {
      ctx.translate(cfg.size / 2, cfg.size / 2);
      ctx.rotate(rot * Math.PI / 180);
      ctx.translate(-cfg.size / 2, -cfg.size / 2);
    }

    switch (cfg.shape) {
      case 'circle':    drawCircleStamp(cfg);    break;
      case 'ellipse':   drawEllipseStamp(cfg);   break;
      case 'rect':      drawRectStamp(cfg);      break;
      case 'roundrect': drawRoundRectStamp(cfg);  break;
    }
  }

  // ===== 下载 PNG（高清透明背景） =====
  function downloadPNG() {
    const cfg = getConfig();
    const dpr = 2;
    const outSize = cfg.size * dpr;
    const shapes = { circle: drawCircleStamp, ellipse: drawEllipseStamp, rect: drawRectStamp, roundrect: drawRoundRectStamp };
    const drawFn = shapes[cfg.shape];
    if (!drawFn) return;

    // 保存当前状态
    const origWidth  = canvas.width;
    const origHeight = canvas.height;
    const origStyleW = canvas.style.width;
    const origStyleH = canvas.style.height;

    // 重置 canvas 为目标高清尺寸
    canvas.width  = outSize;
    canvas.height = outSize;
    canvas.style.width  = cfg.size + 'px';
    canvas.style.height = cfg.size + 'px';
    ctx.scale(dpr, dpr);

    // 绘制印章
    drawFn(cfg);

    // 导出透明 PNG
    const link = document.createElement('a');
    link.download = `印章_${cfg.main || 'untitled'}.png`;
    link.href = canvas.toDataURL('image/png');

    // 恢复原始尺寸
    canvas.width  = origWidth;
    canvas.height = origHeight;
    canvas.style.width  = origStyleW;
    canvas.style.height = origStyleH;
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // 重绘预览
    render();

    link.click();
  }

  // ===== 动态生成缺口角度滑块 =====
  function syncNotchAngles() {
    const count = parseInt(notchCount.value);

    // 始终重新均匀分布缺口角度，避免 'input' 事件中间态污染
    notchAngles = [];
    for (let i = 0; i < count; i++) {
      notchAngles.push(Math.round((360 / count) * i));
    }

    // 渲染 UI
    notchAnglesContainer.innerHTML = '';
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'notch-angle-item';

      const label = document.createElement('span');
      label.className = 'ctrl-label';
      label.textContent = `缺口${i + 1}`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 360;
      slider.value = notchAngles[i];
      slider.step = 5;

      const val = document.createElement('span');
      val.className = 'size-value';
      val.textContent = notchAngles[i] + '°';

      // 闭包捕获 index
      const idx = i;
      slider.addEventListener('input', () => {
        console.log(`[Slider ${idx}] value=${slider.value}, before=`, JSON.stringify(notchAngles));
        notchAngles[idx] = parseFloat(slider.value);
        console.log(`[Slider ${idx}] after=`, JSON.stringify(notchAngles));
        val.textContent = slider.value + '°';
        render();
      });

      item.appendChild(label);
      item.appendChild(slider);
      item.appendChild(val);
      notchAnglesContainer.appendChild(item);
    }
  }

  // ===== 事件绑定 =====
  // 形状切换
  shapeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shapeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentShape = tab.dataset.shape;
      render();
    });
  });

  // 滑块实时更新
  sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value + 'px';
    render();
  });
  borderW.addEventListener('input', () => {
    borderWVal.textContent = borderW.value + 'px';
    render();
  });
  fontSize.addEventListener('input', () => {
    fontSizeVal.textContent = fontSize.value + 'px';
    render();
  });

  // 布局微调
  starOffset.addEventListener('input', () => {
    starOffVal.textContent = starOffset.value;
    render();
  });
  mainYOffset.addEventListener('input', () => {
    mainYOffVal.textContent = mainYOffset.value;
    render();
  });

  // 防伪 — 缺口数变化时重建角度滑块
  notchCount.addEventListener('input', () => {
    notchCountVal.textContent = notchCount.value;
    syncNotchAngles();
    render();
  });

  // 颜色
  primaryClr.addEventListener('input', render);
  secondaryClr.addEventListener('input', render);

  // 文字
  topText.addEventListener('input', render);
  mainText.addEventListener('input', render);
  bottomText.addEventListener('input', render);

  // 下载
  downloadBtn.addEventListener('click', downloadPNG);

  // 第二行文字
  secondLine.addEventListener('input', render);
  // 字间距
  charSpacing.addEventListener('input', () => {
    charSpacingVal.textContent = charSpacing.value;
    render();
  });
  // 星大小
  starSize.addEventListener('input', () => {
    starSizeVal.textContent = starSize.value;
    render();
  });
  // 旋转
  rotation.addEventListener('input', () => {
    rotationVal.textContent = rotation.value + '°';
    render();
  });

  // ===== 自定义下拉：边框样式 =====
  const borderStyleSelect = document.getElementById('borderStyleSelect');
  borderStyleTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    borderStyleSelect.classList.toggle('open');
  });

  borderStyleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      borderStyleOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      borderStyleTrigger.dataset.value = opt.dataset.value;
      borderStyleText.textContent = opt.textContent;
      borderStyleSelect.classList.remove('open');
      render();
    });
  });

  // 点击外部关闭下拉
  document.addEventListener('click', (e) => {
    if (!borderStyleSelect.contains(e.target)) {
      borderStyleSelect.classList.remove('open');
    }
  });

  // ===== 窗口 resize =====
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 100);
  });

  // ===== 初始化 =====
  notchAngles = [];
  syncNotchAngles();
  render();

})();
