/**
 * PDF 扫描模拟器 — 完整实现
 *
 * 功能：
 *  - 导入 PDF，逐页渲染
 *  - 水印（文字内容、大小、颜色、透明度、旋转）
 *  - 倾斜（基础角度 + 每页随机偏移）
 *  - 图像调整（亮度、对比度、高斯模糊、噪点、发黄老化）
 *  - 分辨率/DPI 设置
 *  - 签名和印章图片叠加
 *  - PDF 元数据编辑（标题、作者、主题、关键词）
 *  - 导出为扫描件风格的 PDF
 */

// ===== PDF.js 初始化 =====
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ===== DOM 引用 =====
const $ = id => document.getElementById(id);

const fileInput = $('fileInput');
const importBtn = $('importBtn');
const exportBtn = $('exportBtn');
const fileInfo = $('fileInfo');
const pageNav = $('pageNav');
const prevPage = $('prevPage');
const nextPage = $('nextPage');
const pageInfo = $('pageInfo');
const canvas = $('previewCanvas');
const ctx = canvas.getContext('2d');
const placeholder = $('placeholder');
const previewWrap = $('previewWrap');
const previewHint = $('previewHint');
const statusMsg = $('statusMsg');
const renderTime = $('renderTime');

// 水印
const wmText = $('wmText');
const wmSize = $('wmSize');
const wmSizeVal = $('wmSizeVal');
const wmColor = $('wmColor');
const wmOpacity = $('wmOpacity');
const wmOpacityVal = $('wmOpacityVal');
const wmAngle = $('wmAngle');
const wmAngleVal = $('wmAngleVal');

// 倾斜
const skewAngle = $('skewAngle');
const skewAngleVal = $('skewAngleVal');
const skewRandom = $('skewRandom');
const skewRandomVal = $('skewRandomVal');

// 图像
const brightness = $('brightness');
const brightnessVal = $('brightnessVal');
const contrast = $('contrast');
const contrastVal = $('contrastVal');
const blur = $('blur');
const blurVal = $('blurVal');
const noise = $('noise');
const noiseVal = $('noiseVal');
const yellowing = $('yellowing');
const yellowingVal = $('yellowingVal');

// 分辨率
const dpiSelect = $('dpiSelect');

// 签名/印章
const signatureInput = $('signatureInput');
const stampInput = $('stampInput');
const addSignatureBtn = $('addSignatureBtn');
const addStampBtn = $('addStampBtn');
const overlayList = $('overlayList');

// 元数据
const metaTitle = $('metaTitle');
const metaAuthor = $('metaAuthor');
const metaSubject = $('metaSubject');
const metaKeywords = $('metaKeywords');

// ===== 状态 =====
const state = {
  pdfDoc: null,       // PDFDocumentProxy
  isDemo: true,       // 是否展示示例页面
  currentPage: 1,
  totalPages: 0,
  fileName: '',
  fileSize: 0,
  renderScale: 1.5,   // 屏幕渲染倍率
  overlays: [],        // { id, type, name, img, x, y, width, height }
  _overlayIdCounter: 0,
  _renderId: 0,
  // 示例页面占位尺寸（A4 比例）
  demoWidth: 595,
  demoHeight: 842,
};

// ===== 工具函数 =====

/** 格式化文件大小 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** 裁剪字符串 */
function truncate(str, n = 30) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/** 限制数值范围 */
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

/** 给当前渲染打标记，用于取消过期渲染 */
function nextRenderId() {
  state._renderId++;
  return state._renderId;
}

// ===== 滑块值显示 =====

function bindRange(el, displayEl, suffix = '') {
  const update = () => { displayEl.textContent = el.value + suffix; };
  el.addEventListener('input', update);
  update();
}

bindRange(wmSize, wmSizeVal, 'px');
bindRange(wmOpacity, wmOpacityVal, '%');
bindRange(wmAngle, wmAngleVal, '°');
bindRange(skewAngle, skewAngleVal, '°');
bindRange(skewRandom, skewRandomVal, '°');
bindRange(brightness, brightnessVal, '%');
bindRange(contrast, contrastVal, '%');
bindRange(blur, blurVal);
bindRange(noise, noiseVal);
bindRange(yellowing, yellowingVal, '%');

// ===== PDF 加载 =====

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await loadPDFFile(file);
});

// 拖拽支持
previewWrap.addEventListener('dragover', (e) => {
  e.preventDefault();
  previewWrap.classList.add('drag-over');
});
previewWrap.addEventListener('dragleave', () => {
  previewWrap.classList.remove('drag-over');
});
previewWrap.addEventListener('drop', async (e) => {
  e.preventDefault();
  previewWrap.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    await loadPDFFile(file);
  } else {
    showStatus('⚠️ 仅支持 PDF 文件');
  }
});

async function loadPDFFile(file) {
  showStatus(`📖 加载中: ${truncate(file.name)}`);
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    state.pdfDoc = pdfDoc;
    state.isDemo = false;
    state.currentPage = 1;
    state.totalPages = pdfDoc.numPages;
    state.fileName = file.name;
    state.fileSize = file.size;

    fileInfo.textContent = `${truncate(file.name)} (${formatSize(file.size)}, ${pdfDoc.numPages} 页)`;
    fileInfo.style.display = 'block';
    pageNav.style.display = 'flex';
    exportBtn.disabled = false;
    placeholder.style.display = 'none';
    previewHint.textContent = `${file.name} — ${pdfDoc.numPages} 页`;

    updatePageInfo();
    await renderCurrentPage();
    showStatus(`✅ 已加载: ${file.name}`);
  } catch (err) {
    console.error('PDF 加载失败:', err);
    showStatus(`❌ 加载失败: ${err.message}`);
    resetState();
  }
}

function resetState() {
  state.pdfDoc = null;
  state.isDemo = true;
  state.currentPage = 1;
  state.totalPages = 0;
  state.fileName = '';
  fileInfo.style.display = 'none';
  pageNav.style.display = 'none';
  exportBtn.disabled = false;
  placeholder.style.display = 'block';
  previewHint.textContent = '请导入 PDF 文件开始编辑';
  canvas.width = 0;
  canvas.height = 0;
  updatePageInfo();
  renderDemoPage();
}

// ===== 页面导航 =====

function updatePageInfo() {
  if (state.isDemo) {
    pageInfo.textContent = '1 / 1';
  } else if (state.totalPages > 0) {
    pageInfo.textContent = `${state.currentPage} / ${state.totalPages}`;
  } else {
    pageInfo.textContent = '0 / 0';
  }
}

prevPage.addEventListener('click', async () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    updatePageInfo();
    await renderCurrentPage();
  }
});

nextPage.addEventListener('click', async () => {
  if (state.currentPage < state.totalPages) {
    state.currentPage++;
    updatePageInfo();
    await renderCurrentPage();
  }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  const hasContent = state.pdfDoc || state.isDemo;
  if (!hasContent) return;
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    if (state.currentPage > 1) {
      state.currentPage--;
      updatePageInfo();
      renderCurrentPage();
    }
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    if (state.currentPage < state.totalPages) {
      state.currentPage++;
      updatePageInfo();
      renderCurrentPage();
    }
  }
});

// ===== 核心渲染 =====

/** 获取当前页的实际倾斜角度（基础角度 + 随机偏移） */
function getEffectiveSkew(pageIndex) {
  const base = parseFloat(skewAngle.value) || 0;
  const range = parseFloat(skewRandom.value) || 0;
  if (range === 0) return base;
  // 基于 pageIndex 的确定性随机，保证相同设置下每页一致
  const seed = (pageIndex * 7.389 + 3.14159);
  const r = (Math.sin(seed) * 0.5 + 0.5) * 2 - 1; // [-1, 1]
  return base + r * range;
}

/** 渲染当前页（含所有效果） */
async function renderCurrentPage() {
  if (!state.pdfDoc) {
    if (state.isDemo) {
      renderDemoPage();
    }
    return;
  }

  const renderId = nextRenderId();
  const pageIndex = state.currentPage;
  const page = await state.pdfDoc.getPage(pageIndex);

  // 计算渲染尺寸
  const viewport = page.getViewport({ scale: state.renderScale });
  const dpi = parseInt(dpiSelect.value) || 150;
  const dpiScale = dpi / 72; // PDF 默认 72 DPI
  const exportW = Math.round(viewport.width * dpiScale / state.renderScale);
  const exportH = Math.round(viewport.height * dpiScale / state.renderScale);

  // 屏幕预览尺寸（保持比例但限制最大宽度）
  const maxPreviewW = previewWrap.clientWidth - 40;
  const previewScale = Math.min(1, maxPreviewW / exportW);
  const previewW = Math.round(exportW * previewScale);
  const previewH = Math.round(exportH * previewScale);

  canvas.width = exportW;
  canvas.height = exportH;
  canvas.style.width = previewW + 'px';
  canvas.style.height = previewH + 'px';

  const t0 = performance.now();

  // 1. 渲染原始 PDF 页面到离屏 canvas
  const offscreen = new OffscreenCanvas(exportW, exportH);
  const offCtx = offscreen.getContext('2d');

  // 先渲染 PDF 页面（低分辨率临时 canvas，然后缩放）
  const pdfViewport = page.getViewport({ scale: 1 });
  const pdfCanvas = document.createElement('canvas');
  pdfCanvas.width = pdfViewport.width;
  pdfCanvas.height = pdfViewport.height;
  const pdfCtx = pdfCanvas.getContext('2d');
  await page.render({ canvasContext: pdfCtx, viewport: pdfViewport }).promise;

  // 缩放到目标 DPI
  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';
  offCtx.drawImage(pdfCanvas, 0, 0, exportW, exportH);

  // 2. 应用图像效果
  applyImageEffects(offCtx, exportW, exportH);

  // 3. 应用倾斜变换
  const effectiveAngle = getEffectiveSkew(pageIndex);
  // 不需要画到主 canvas 再做变换，直接在最后绘制时变换

  // 4. 应用水印
  applyWatermark(offCtx, exportW, exportH);

  // 5. 应用签名/印章
  applyOverlays(offCtx, exportW, exportH);

  // 6. 绘制到主 canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0);

  // 如果当前页有倾斜，应用 CSS transform 来预览
  if (Math.abs(effectiveAngle) > 0.01) {
    const rad = effectiveAngle * Math.PI / 180;
    canvas.style.transform = `rotate(${effectiveAngle}deg)`;
    canvas.style.transformOrigin = 'center center';
  } else {
    canvas.style.transform = '';
  }

  const t1 = performance.now();
  renderTime.textContent = `渲染: ${(t1 - t0).toFixed(0)}ms | ${exportW}×${exportH}`;
}

// ===== 示例页面渲染 =====

/** 绘制示例 PDF 页面内容（展示各种效果） */
function renderDemoPage() {
  const w = state.demoWidth;
  const h = state.demoHeight;
  const dpi = parseInt(dpiSelect.value) || 150;
  const dpiScale = dpi / 72;

  // 按 DPI 缩放
  const exportW = Math.round(w * dpiScale);
  const exportH = Math.round(h * dpiScale);

  const maxPreviewW = previewWrap.clientWidth - 40;
  const previewScale = Math.min(1, maxPreviewW / exportW);
  const previewW = Math.round(exportW * previewScale);
  const previewH = Math.round(exportH * previewScale);

  canvas.width = exportW;
  canvas.height = exportH;
  canvas.style.width = previewW + 'px';
  canvas.style.height = previewH + 'px';

  const offscreen = new OffscreenCanvas(exportW, exportH);
  const offCtx = offscreen.getContext('2d');
  const t0 = performance.now();

  // 绘制示例内容
  drawDemoContent(offCtx, exportW, exportH, dpiScale, 1);

  // 应用图像效果
  applyImageEffects(offCtx, exportW, exportH);

  // 应用水印
  applyWatermark(offCtx, exportW, exportH);

  // 应用覆盖层
  applyOverlays(offCtx, exportW, exportH);

  // 倾斜变换
  const effectiveAngle = getEffectiveSkew(1);
  if (Math.abs(effectiveAngle) > 0.01) {
    canvas.style.transform = `rotate(${effectiveAngle}deg)`;
    canvas.style.transformOrigin = 'center center';
  } else {
    canvas.style.transform = '';
  }

  // 绘制到主 canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0);

  const t1 = performance.now();
  renderTime.textContent = `渲染: ${(t1 - t0).toFixed(0)}ms | ${exportW}×${exportH} (示例)`;
}

/** 在指定上下文中绘制示例文档内容（供预览和导出复用） */
function drawDemoContent(offCtx, w, h, s, pageIndex) {
  // ----- 白底背景 -----
  offCtx.fillStyle = '#ffffff';
  offCtx.fillRect(0, 0, w, h);

  // ----- 标题 -----
  offCtx.fillStyle = '#1a1a2e';
  offCtx.font = `bold ${Math.round(28 * s)}px "Microsoft YaHei", serif`;
  offCtx.textAlign = 'center';
  offCtx.fillText('PDF 扫描模拟器 — 示例文档', w / 2, Math.round(70 * s));

  // ----- 装饰线 -----
  offCtx.strokeStyle = '#8257e5';
  offCtx.lineWidth = Math.round(3 * s);
  offCtx.beginPath();
  offCtx.moveTo(Math.round(60 * s), Math.round(90 * s));
  offCtx.lineTo(w - Math.round(60 * s), Math.round(90 * s));
  offCtx.stroke();

  // ----- 段落文本 -----
  const marginLeft = Math.round(60 * s);
  const marginRight = Math.round(60 * s);
  let y = Math.round(130 * s);

  offCtx.fillStyle = '#333333';
  offCtx.textAlign = 'left';

  const paragraphs = [
    '这是一份示例文档，用于展示 PDF 扫描模拟器的各项功能。您可以实时调整左侧面板中的参数，预览水印、倾斜、图像调整等效果。',
    '',
    '📄 功能列表：',
    '  · 导入自定义 PDF：点击"导入 PDF"或拖拽文件到预览区',
    '  · 水印设置：自定义文字、大小、颜色、透明度、旋转角度',
    '  · 倾斜模拟：设置基础倾斜角度和每页随机偏移范围',
    '  · 图像调整：亮度、对比度、模糊、噪点、发黄老化效果',
    '  · 分辨率选择：从 72 DPI 到 600 DPI，满足不同需求',
    '  · 签名与印章：上传图片叠加到页面上',
    '  · 元数据编辑：设置 PDF 标题、作者、主题、关键词',
    '  · 导出扫描件：一键导出为扫描风格的 PDF 文件',
    '',
    '💡 操作提示：',
    '  · 使用 ← → 或 PageUp / PageDown 键翻页',
    '  · 所有参数调整都会实时预览',
    '  · 导出时请耐心等待，高 DPI 需要更多处理时间',
    '',
    '🔧 默认参数已设置好水印文字为"扫描件"，',
    '   您可以在左侧面板中随意调整。',
  ];

  for (const line of paragraphs) {
    if (line === '') {
      y += Math.round(12 * s);
      continue;
    }
    const isBold = line.startsWith('  ·') || line.startsWith('💡') || line.startsWith('📄') || line.startsWith('🔧');
    offCtx.font = `${isBold ? 'bold ' : ''}${Math.round(isBold ? 15 : 14) * s}px "Microsoft YaHei", serif`;
    offCtx.fillText(line, marginLeft, y);
    y += Math.round(26 * s);
  }

  // ----- 页码 -----
  offCtx.fillStyle = '#aaaaaa';
  offCtx.font = `${Math.round(11 * s)}px Arial, sans-serif`;
  offCtx.textAlign = 'right';
  offCtx.fillText(`— 示例第 ${pageIndex} 页 —`, w - Math.round(60 * s), h - Math.round(40 * s));
}

// ===== 图像效果处理 =====

function applyImageEffects(offscreenCtx, w, h) {
  const b = parseInt(brightness.value) / 100;
  const c = parseInt(contrast.value) / 100;
  const n = parseInt(noise.value);
  const y = parseInt(yellowing.value) / 100;
  const bl = parseFloat(blur.value);

  // 如果所有效果都是默认值，跳过像素操作
  if (b === 1 && c === 1 && n === 0 && y === 0 && bl === 0) return;

  const imageData = offscreenCtx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const len = data.length;

  // 先应用模糊（如果有）
  if (bl > 0) {
    // 使用简单的盒状模糊近似高斯模糊
    const radius = Math.max(1, Math.round(bl));
    boxBlur(imageData, w, h, radius);
  }

  // 逐像素处理
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b2 = data[i + 2];
    let a = data[i + 3];

    // 亮度
    if (b !== 1) {
      r *= b;
      g *= b;
      b2 *= b;
    }

    // 对比度
    if (c !== 1) {
      r = ((r / 255 - 0.5) * c + 0.5) * 255;
      g = ((g / 255 - 0.5) * c + 0.5) * 255;
      b2 = ((b2 / 255 - 0.5) * c + 0.5) * 255;
    }

    // 发黄/老化（增加红/黄通道，减少蓝通道）
    if (y > 0) {
      const yellowR = 20 * y;
      const yellowG = 15 * y;
      const yellowB = 40 * y;
      r += yellowR;
      g += yellowG;
      b2 -= yellowB;
    }

    // 噪点
    if (n > 0) {
      const noiseVal = (Math.random() * 2 - 1) * n;
      r += noiseVal;
      g += noiseVal;
      b2 += noiseVal;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b2, 0, 255);
    // a 保持不变
  }

  offscreenCtx.putImageData(imageData, 0, 0);
}

/** 盒状模糊（快速近似高斯模糊） */
function boxBlur(imageData, w, h, radius) {
  const data = imageData.data;
  const temp = new Uint8ClampedArray(data);
  const r = Math.min(radius, Math.max(w, h) / 4);

  // 水平方向模糊
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      for (let kx = x0; kx <= x1; kx++) {
        const idx = (y * w + kx) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
      const idx = (y * w + x) * 4;
      temp[idx] = sumR / count;
      temp[idx + 1] = sumG / count;
      temp[idx + 2] = sumB / count;
    }
  }

  // 垂直方向模糊
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(h - 1, y + r);
      for (let ky = y0; ky <= y1; ky++) {
        const idx = (ky * w + x) * 4;
        sumR += temp[idx];
        sumG += temp[idx + 1];
        sumB += temp[idx + 2];
        count++;
      }
      const idx = (y * w + x) * 4;
      data[idx] = sumR / count;
      data[idx + 1] = sumG / count;
      data[idx + 2] = sumB / count;
    }
  }
}

// ===== 水印 =====

function applyWatermark(offscreenCtx, w, h) {
  const text = wmText.value.trim();
  if (!text) return;

  const fontSize = parseInt(wmSize.value) || 48;
  const color = wmColor.value || '#aaaaaa';
  const opacity = (parseInt(wmOpacity.value) || 30) / 100;
  const angle = parseFloat(wmAngle.value) || -30;

  offscreenCtx.save();
  offscreenCtx.translate(w / 2, h / 2);
  offscreenCtx.rotate(angle * Math.PI / 180);

  offscreenCtx.font = `bold ${fontSize}px "Microsoft YaHei", Arial, sans-serif`;
  offscreenCtx.textAlign = 'center';
  offscreenCtx.textBaseline = 'middle';

  // 绘制多行水印（平铺）
  const stepX = fontSize * 6;
  const stepY = fontSize * 3;
  const cols = Math.ceil(w / stepX) + 2;
  const rows = Math.ceil(h / stepY) + 2;

  offscreenCtx.fillStyle = color;
  offscreenCtx.globalAlpha = opacity;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const ox = (c - cols / 2) * stepX;
      const oy = (r - rows / 2) * stepY;
      offscreenCtx.fillText(text, ox, oy);
    }
  }

  offscreenCtx.restore();
}

// ===== 签名与印章 =====

addSignatureBtn.addEventListener('click', () => signatureInput.click());
addStampBtn.addEventListener('click', () => stampInput.click());

signatureInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) addOverlay(file, '签名');
  e.target.value = '';
});

stampInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) addOverlay(file, '印章');
  e.target.value = '';
});

function addOverlay(file, type) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const id = ++state._overlayIdCounter;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // 默认大小：宽200px，按比例缩放
      const displayW = 200;
      const displayH = (h / w) * displayW;

      state.overlays.push({
        id,
        type,
        name: file.name,
        img,
        x: 100,  // 初始位置在页面左上角偏移
        y: 100,
        width: displayW,
        height: displayH,
        naturalW: w,
        naturalH: h,
      });

      renderOverlayList();
      renderCurrentPage();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeOverlay(id) {
  state.overlays = state.overlays.filter(o => o.id !== id);
  renderOverlayList();
  renderCurrentPage();
}

function renderOverlayList() {
  if (state.overlays.length === 0) {
    overlayList.innerHTML = '<div style="font-size:0.72em;color:#555;padding:4px 0;">暂无叠加元素</div>';
    return;
  }
  overlayList.innerHTML = state.overlays.map(o => `
    <div class="overlay-item">
      <span>${o.type === '签名' ? '🖊' : '🔴'}</span>
      <span class="overlay-name">${truncate(o.name, 16)}</span>
      <span style="font-size:0.7em;color:#666;">(${o.width}×${o.height})</span>
      <span class="overlay-del" data-id="${o.id}">✕</span>
    </div>
  `).join('');

  overlayList.querySelectorAll('.overlay-del').forEach(el => {
    el.addEventListener('click', () => removeOverlay(parseInt(el.dataset.id)));
  });
}

function applyOverlays(offscreenCtx, w, h) {
  if (state.overlays.length === 0) return;

  for (const o of state.overlays) {
    offscreenCtx.drawImage(o.img, o.x, o.y, o.width, o.height);
  }
}

// ===== 控制事件 =====

// 所有滑块和输入变化都触发重新渲染
const renderTriggers = [
  wmText, wmSize, wmColor, wmOpacity, wmAngle,
  skewAngle, skewRandom,
  brightness, contrast, blur, noise, yellowing,
  dpiSelect,
];

for (const el of renderTriggers) {
  const eventType = el.type === 'range' || el.type === 'select-one' ? 'input' : 'input';
  el.addEventListener(eventType, () => {
    renderCurrentPage();
  });
  // text input 用 change 事件
  if (el.type === 'text' || el.type === 'color') {
    el.addEventListener('change', () => {
      renderCurrentPage();
    });
  }
}

// 元数据不需要触发渲染

// ===== 导出 PDF =====

exportBtn.addEventListener('click', async () => {
  await exportScannedPDF();
});

async function exportScannedPDF() {
  const isDemo = state.isDemo;
  const total = isDemo ? 1 : state.totalPages;
  const dpi = parseInt(dpiSelect.value) || 150;
  const dpiScale = dpi / 72;

  if (total === 0 && !isDemo) {
    showProgress('❌ 没有可导出的 PDF');
    setTimeout(() => hideProgress(), 2000);
    return;
  }

  showProgress(`导出中: 0 / ${total}`);

  try {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    for (let i = 1; i <= total; i++) {
      showProgress(`导出中: ${i} / ${total}（渲染第 ${i} 页）`);

      const offscreen = new OffscreenCanvas(1, 1);
      let exportW, exportH;

      if (isDemo) {
        // 示例模式：渲染示例内容
        exportW = Math.round(state.demoWidth * dpiScale);
        exportH = Math.round(state.demoHeight * dpiScale);
        offscreen.width = exportW;
        offscreen.height = exportH;
        const offCtx = offscreen.getContext('2d');
        drawDemoContent(offCtx, exportW, exportH, dpiScale, i);
      } else {
        const page = await state.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        exportW = Math.round(viewport.width * dpiScale);
        exportH = Math.round(viewport.height * dpiScale);
        offscreen.width = exportW;
        offscreen.height = exportH;
        const offCtx = offscreen.getContext('2d');

        // 渲染 PDF 原始内容
        const pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        const pdfCtx = pdfCanvas.getContext('2d');
        await page.render({ canvasContext: pdfCtx, viewport }).promise;

        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';
        offCtx.drawImage(pdfCanvas, 0, 0, exportW, exportH);
      }

      // 应用效果
      const offCtx = offscreen.getContext('2d');
      applyImageEffects(offCtx, exportW, exportH);
      applyWatermark(offCtx, exportW, exportH);
      applyOverlays(offCtx, exportW, exportH);

      // 转换 canvas 为 JPEG
      const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
      const arrayBuffer = await blob.arrayBuffer();
      const image = await pdfDoc.embedJpg(arrayBuffer);

      const pdfPage = pdfDoc.addPage([exportW, exportH]);
      pdfPage.drawImage(image, { x: 0, y: 0, width: exportW, height: exportH });
    }

    // 设置元数据
    const title = metaTitle.value.trim() || (isDemo ? '示例文档' : state.fileName.replace(/\.pdf$/i, '')) || '扫描件';
    const author = metaAuthor.value.trim() || 'PDF 扫描模拟器';
    const subject = metaSubject.value.trim() || '';
    const keywords = metaKeywords.value.trim() || '';

    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(author);
    if (subject) pdfDoc.setSubject(subject);
    if (keywords) pdfDoc.setKeywords(keywords.split(/[,，\s]+/).filter(Boolean).join(','));
    pdfDoc.setCreationDate(new Date());

    const pdfBytes = await pdfDoc.save();

    // 下载
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/[<>:"/\\|?*]/g, '_') + '_扫描件.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showProgress(`✅ 导出完成！共 ${total} 页，${dpi} DPI`);
    setTimeout(() => hideProgress(), 2000);
  } catch (err) {
    console.error('导出失败:', err);
    showProgress(`❌ 导出失败: ${err.message}`);
    setTimeout(() => hideProgress(), 3000);
  }
}

// ===== 进度提示 =====

let progressEl = null;

function showProgress(msg) {
  if (!progressEl) {
    progressEl = document.createElement('div');
    progressEl.className = 'export-progress';
    progressEl.innerHTML = `
      <div class="export-progress-box">
        <div class="progress-spinner"></div>
        <div class="progress-text" id="progressText">${msg}</div>
      </div>
    `;
    document.body.appendChild(progressEl);
  } else {
    const textEl = progressEl.querySelector('.progress-text');
    if (textEl) textEl.textContent = msg;
  }
}

function hideProgress() {
  if (progressEl) {
    progressEl.remove();
    progressEl = null;
  }
}

// ===== 状态显示 =====

function showStatus(msg) {
  statusMsg.textContent = msg;
}

// ===== 初始化 =====
// 页面加载后立即渲染示例页面
renderDemoPage();
showStatus('💡 示例页面 — 导入 PDF 开始编辑');
