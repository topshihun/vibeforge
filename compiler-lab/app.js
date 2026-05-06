// ============================================================
// 编译器实验室 — 使用 Compiler Explorer (godbolt.org) API
// ============================================================

const API_BASE = 'https://godbolt.org/api';

// ===== 硬编码编译器列表（作为 API 获取失败的备用） =====
// 从 https://godbolt.org/api/compilers 查询最新 ID
const FALLBACK_COMPILERS = [
  { id: 'g142',        name: 'x86-64 GCC 14.2',           arch: 'x86-64',   icon: '💻' },
  { id: 'clang1910',   name: 'x86-64 Clang 19.1.0',       arch: 'x86-64',   icon: '💻' },
  { id: 'carmg1430',   name: 'ARM GCC 14.3 (ARMv7)',       arch: 'ARM',      icon: '📱' },
  { id: 'carm64g1430', name: 'AArch64 GCC 14.3 (ARMv8)',   arch: 'AArch64',  icon: '📱' },
  { id: 'rv64-cgcc1430',name: 'RISC-V 64 GCC 14.3',        arch: 'RISC-V',   icon: '🔷' },
  { id: 'cmips64g1430',name: 'MIPS64 GCC 14.3',            arch: 'MIPS',     icon: '🔶' },
  { id: 'cppc64g1430', name: 'PowerPC 64 GCC 14.3',        arch: 'PowerPC',  icon: '⚡' },
];

const ARCH_INFO = {
  'x86-64':  'Intel/AMD 桌面和服务器的 64 位架构，使用复杂指令集计算（CISC）',
  'ARM':     '32 位 ARM 架构，广泛用于移动设备和嵌入式系统，采用精简指令集（RISC）',
  'AArch64': '64 位 ARM 架构（ARMv8+），现代手机、平板和服务器的主流选择',
  'RISC-V':  '开源的精简指令集架构（RISC），第五代，从设计上支持模块化扩展',
  'MIPS':    '经典的精简指令集架构，曾广泛用于嵌入式、路由器和游戏主机',
  'PowerPC': '由 IBM/Apple/Motorola 开发的 RISC 架构，用于游戏主机和高端嵌入式',
  'unknown': '无法自动识别的架构',
};

const EXAMPLES = {
  '斐波那契数列（递归）': `int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    return fib(10);
}`,
  '循环与求和': `int sum(int n) {
    int s = 0;
    for (int i = 1; i <= n; i++)
        s += i;
    return s;
}

int main() {
    return sum(100);
}`,
  '结构体与指针': `typedef struct {
    int x;
    int y;
} Point;

int cross(Point *a, Point *b) {
    return a->x * b->y - a->y * b->x;
}

int main() {
    Point p1 = {3, 4};
    Point p2 = {5, 6};
    return cross(&p1, &p2);
}`,
  '数组操作': `int find_max(int *arr, int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++)
        if (arr[i] > max) max = arr[i];
    return max;
}

int main() {
    int data[] = {3, 7, 1, 9, 4, 6, 8, 2, 5};
    return find_max(data, 9);
}`,
  '字符串长度': `int strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return p - s;
}

int main() {
    char *msg = "Hello, Compiler!";
    return strlen(msg);
}`,
};

// ===== DOM 引用 =====
const compilerSelect = document.getElementById('compilerSelect');
const flagsInput     = document.getElementById('flagsInput');
const compileBtn     = document.getElementById('compileBtn');
const codeInput      = document.getElementById('codeInput');
const lineNumbers    = document.getElementById('lineNumbers');
const asmOutput      = document.getElementById('asmOutput');
const asmLineNumbers = document.getElementById('asmLineNumbers');
const statusBadge    = document.getElementById('statusBadge');
const copyBtn        = document.getElementById('copyBtn');
const downloadBtn    = document.getElementById('downloadBtn');
const loadExampleBtn = document.getElementById('loadExampleBtn');
const clearBtn       = document.getElementById('clearBtn');
const archBadges     = document.getElementById('archBadges');

// ===== 状态 =====
let isCompiling = false;
let currentAsm  = '';
let highlightEnabled = false;  // 默认纯文本汇编
let selectedArch = 'x86-64';  // 当前选中的架构
let compilers;                // 当前加载的编译器列表

// ===== 初始化 =====
async function init() {
  await loadCompilers();
  setupEditorSync();
  setupEventListeners();
  syncLineNumbers();
  setStatus('就绪', '');
}

// ===== 加载编译器列表 =====
async function loadCompilers() {
  compilerSelect.innerHTML = '<option value="">⏳ 加载编译器列表...</option>';
  compilerSelect.disabled = true;

  try {
    const resp = await fetch(`${API_BASE}/compilers`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    compilers = data
      .filter(c => c.lang && c.lang.includes('c') && /gcc|clang/i.test(c.name))
      .map(c => ({
        id:   c.id,
        name: c.name,
        arch: guessArch(c.name),
        icon: guessIcon(guessArch(c.name)),
      }));

    if (compilers.length === 0) throw new Error('no compilers found');
  } catch (err) {
    console.warn('获取编译器列表失败，使用备用列表:', err.message);
    compilers = FALLBACK_COMPILERS;
  }

  // 按架构分组排序
  const archOrder = ['x86-64', 'ARM', 'AArch64', 'RISC-V', 'MIPS', 'PowerPC'];
  compilers.sort((a, b) => {
    const ia = archOrder.indexOf(a.arch);
    const ib = archOrder.indexOf(b.arch);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
  });

  renderCompilerOptions(compilers, selectedArch);
  renderArchBadges(compilers);
  compilerSelect.disabled = false;
}

function guessArch(name) {
  const n = name.toLowerCase();
  if (/x86[- ]?64|amd64|i[0-9]86/.test(n)) return 'x86-64';
  if (/\barm64\b|aarch64/.test(n)) return 'AArch64';
  if (/\barm\b|armv7|thumb/.test(n)) return 'ARM';
  if (/riscv|rv64/.test(n)) return 'RISC-V';
  if (/mips|mips64/.test(n)) return 'MIPS';
  if (/powerpc|ppc|power64/.test(n)) return 'PowerPC';
  return 'unknown';
}

function guessIcon(arch) {
  return { 'x86-64':'💻','ARM':'📱','AArch64':'📱','RISC-V':'🔷','MIPS':'🔶','PowerPC':'⚡','unknown':'🔧' }[arch] || '🔧';
}

function renderCompilerOptions(compilers, filterArch) {
  const filtered = filterArch ? compilers.filter(c => c.arch === filterArch) : compilers;

  let html = '';
  if (filtered.length === 0) {
    compilerSelect.innerHTML = '<option value="">暂无此架构的编译器</option>';
    compilerSelect.disabled = true;
    return;
  }
  compilerSelect.disabled = false;

  for (const c of filtered) {
    html += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
  }
  compilerSelect.innerHTML = `<option value="">选择编译器...</option>` + html;
  // 尝试保持之前选中的值
  if (!compilerSelect.value || !filtered.some(c => c.id === compilerSelect.value)) {
    compilerSelect.value = filtered[0].id;
  }
}

// ===== 架构徽章（可点击筛选） =====
function renderArchBadges(compilers) {
  let html = '';
  for (const [arch, desc] of Object.entries(ARCH_INFO)) {
    const active = arch === getSelectedArch();
    html += `<div class="arch-badge${active ? ' active' : ''}" data-arch="${arch}" title="${desc}">
      <span class="arch-icon">${guessIcon(arch)}</span>
      <span>${arch}</span>
    </div>`;
  }
  archBadges.innerHTML = html;

  document.querySelectorAll('.arch-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      selectedArch = badge.dataset.arch === getSelectedArch() ? '' : badge.dataset.arch;
      renderCompilerOptions(compilers, selectedArch);
      renderArchBadges(compilers);
    });
  });
}

function getSelectedArch() {
  return selectedArch;
}

// ===== 编辑器行号同步 =====
function setupEditorSync() {
  codeInput.addEventListener('input', syncLineNumbers);
  codeInput.addEventListener('scroll', syncScroll);
  codeInput.addEventListener('keydown', handleTabKey);
}

function syncLineNumbers() {
  const lines = codeInput.value.split('\n');
  const count = lines.length;
  lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join('\n');
}

function syncScroll() {
  lineNumbers.scrollTop = codeInput.scrollTop;
}

function handleTabKey(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end   = codeInput.selectionEnd;
    codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
    codeInput.selectionStart = codeInput.selectionEnd = start + 4;
    syncLineNumbers();
  }
}

// ===== 编译 =====
async function compile() {
  const compilerId = compilerSelect.value;
  const source     = codeInput.value.trim();
  const flags      = flagsInput.value.trim() || '-O2';

  if (!compilerId) {
    setStatus('请选择编译器', 'error');
    return;
  }
  if (!source) {
    setStatus('请编写 C 代码', 'error');
    return;
  }
  if (isCompiling) return;

  isCompiling = true;
  compileBtn.disabled = true;
  setStatus('编译中...', 'busy');
  asmOutput.innerHTML = '<code>⏳ 正在编译并获取汇编输出...</code>';
  asmLineNumbers.textContent = '';

  try {
    const resp = await fetch(`${API_BASE}/compiler/${compilerId}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        source: source,
        options: {
          userArguments: flags,
          filters: {
            binary: false,
            commentOnly: true,
            directives: true,
            labels: true,
            intel: true,
            demangle: true,
          },
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`服务器响应 ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();

    if (data.asm && data.asm.length > 0) {
      // 汇编输出
      const asmText = data.asm.map(a => a.text).join('\n');
      displayAsm(asmText);
      setStatus('编译成功', '');
    } else if (data.code === 0 && data.stdout && data.stdout.length > 0) {
      // 有标准输出（无汇编时回退）
      const outText = data.stdout.map(o => o.text).join('');
      if (outText.trim()) {
        asmOutput.innerHTML = `<code>${escHtml(outText)}</code>`;
        setStatus('无汇编输出', 'warning');
      } else {
        asmOutput.innerHTML = '<code>（编译器未产生汇编输出）</code>';
        setStatus('无输出', 'error');
      }
    } else if (data.stderr && data.stderr.length > 0) {
      // 编译错误
      const errText = data.stderr.map(e => e.text).join('');
      displayError(errText);
      setStatus('编译错误', 'error');
    } else if (data.code !== 0) {
      // 未知错误
      const detail = data.stderr ? data.stderr.map(e => e.text).join('') : JSON.stringify(data).slice(0, 500);
      displayError(detail || '编译失败');
      setStatus('编译错误', 'error');
    } else {
      asmOutput.innerHTML = '<code>（编译器未产生输出）</code>';
      setStatus('无输出', 'warning');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      displayError('请求超时。请检查网络连接后重试。');
      setStatus('超时', 'error');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      displayError(
        '无法连接到编译服务。\n' +
        '可能的原因：\n' +
        '  1. 网络连接异常\n' +
        '  2. 浏览器 CORS 限制（可尝试使用 Firefox）\n' +
        '  3. Godbolt 服务暂不可用\n\n' +
        '请稍后重试，或直接访问 https://godbolt.org/ 使用在线编译器。'
      );
      setStatus('连接失败', 'error');
    } else {
      displayError(`编译请求失败：${err.message}`);
      setStatus('错误', 'error');
    }
  } finally {
    isCompiling = false;
    compileBtn.disabled = false;
  }
}

// ===== 显示汇编 =====
function displayAsm(asmText) {
  currentAsm = asmText;
  renderAsm();
}

function renderAsm() {
  if (!currentAsm) return;
  const lines = currentAsm.split('\n');
  const count = lines.length;

  // 更新行号
  asmLineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');

  // 根据开关决定是否高亮
  const rendered = highlightEnabled
    ? lines.map(line => highlightAsmLine(line)).join('\n')
    : escapeHtml(currentAsm);
  asmOutput.innerHTML = `<code>${rendered}</code>`;
}

function highlightAsmLine(line) {
  let h = escapeHtml(line);

  // 注释
  h = h.replace(/(#.*$|@.*$|;\s*.*$)/g, '<span class="comment">$1</span>');

  // 标签 (行首的标识符加冒号)
  h = h.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_.]*:)/gm, '$1<span class="label">$2</span>');

  // 伪指令 (.xxx)
  h = h.replace(/(\.\w+)/g, '<span class="directive">$1</span>');

  // 寄存器
  h = h.replace(/\b([re]?[a-df-il-p][xhl]|[re]?[sb]p|[re]?[sd]i|[re]?[a-df-il-p]{1,2}\d{0,2}|xmm\d+|ymm\d+|zmm\d+|v\d+|[xyz]\d+|w\d+|s\d+|d\d+|q\d+|r\d{1,2}(?:[wbwdq]|_\w+)?|f[pr]\d+|cpsr|spsr|pc|lr|sp|fp|ip|zero|ra|gp|tp|t[0-6]|s[0-9]|a[0-7])\b/gi, '<span class="register">$1</span>');

  // 数字 (十六进制和十进制)
  h = h.replace(/\b(0x[0-9a-fA-F]+)\b/g, '<span class="number">$1</span>');
  h = h.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

  // 字符串
  h = h.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="string">"$1"</span>');

  return h;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== 显示错误 =====
function displayError(errText) {
  currentAsm = '';
  asmOutput.innerHTML = `<code style="color:#f87171;">${escapeHtml(errText)}</code>`;
  asmLineNumbers.textContent = '';
}

// ===== 设置状态 =====
function setStatus(text, type) {
  statusBadge.textContent = text;
  statusBadge.className = 'status-badge';
  if (type) statusBadge.classList.add(type);
}

// ===== 复制与下载 =====
function copyAsm() {
  if (!currentAsm) {
    setStatus('没有可复制的内容', 'error');
    return;
  }
  navigator.clipboard.writeText(currentAsm).then(
    () => setStatus('已复制到剪贴板', ''),
    () => setStatus('复制失败', 'error')
  );
}

function downloadAsm() {
  if (!currentAsm) {
    setStatus('没有可下载的内容', 'error');
    return;
  }
  const compilerName = compilerSelect.selectedOptions[0]?.textContent?.trim() || 'unknown';
  const blob = new Blob([currentAsm], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `output_${compilerName.replace(/\s+/g, '_')}.s`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus('已下载', '');
}

// ===== 加载示例 =====
function showExamplePicker() {
  const names = Object.keys(EXAMPLES);
  const picker = document.createElement('div');
  picker.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); display: flex;
    align-items: center; justify-content: center; z-index: 999;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: #1a1a2e; border: 1px solid rgba(130,87,229,0.3);
    border-radius: 16px; padding: 24px; max-width: 400px; width: 90%;
    box-shadow: 0 0 60px rgba(130,87,229,0.2);
  `;
  card.innerHTML = `<h3 style="margin:0 0 16px;color:#c4b5fd;">📂 选择示例代码</h3>`;

  for (const name of names) {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.style.cssText = `
      display: block; width: 100%; padding: 10px 14px; margin-bottom: 8px;
      background: rgba(130,87,229,0.1); color: #e0e0e0;
      border: 1px solid rgba(130,87,229,0.2); border-radius: 8px;
      cursor: pointer; font-size: 0.9em; text-align: left;
      transition: background 0.2s; font-family: inherit;
    `;
    btn.onmouseenter = () => { btn.style.background = 'rgba(130,87,229,0.2)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(130,87,229,0.1)'; };
    btn.onclick = () => {
      codeInput.value = EXAMPLES[name];
      syncLineNumbers();
      codeInput.dispatchEvent(new Event('input'));
      document.body.removeChild(picker);
      setStatus(`已加载：${name}`, '');
    };
    card.appendChild(btn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ 关闭';
  closeBtn.style.cssText = `
    display: block; width: 100%; padding: 10px; margin-top: 8px;
    background: transparent; color: #888; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; cursor: pointer; font-family: inherit;
  `;
  closeBtn.onclick = () => document.body.removeChild(picker);
  card.appendChild(closeBtn);

  picker.appendChild(card);
  document.body.appendChild(picker);
}

// ===== 事件绑定 =====
function setupEventListeners() {
  compileBtn.addEventListener('click', compile);

  // Ctrl+Enter 编译
  codeInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      compile();
    }
  });

  // 汇编高亮切换
  const highlightToggle = document.getElementById('highlightToggle');
  if (highlightToggle) {
    highlightToggle.checked = highlightEnabled;
    highlightToggle.addEventListener('change', () => {
      highlightEnabled = highlightToggle.checked;
      renderAsm();
    });
  }

  copyBtn.addEventListener('click', copyAsm);
  downloadBtn.addEventListener('click', downloadAsm);
  loadExampleBtn.addEventListener('click', showExamplePicker);
  clearBtn.addEventListener('click', () => {
    if (codeInput.value && !confirm('确定要清空代码吗？')) return;
    codeInput.value = '';
    syncLineNumbers();
    setStatus('已清空', '');
  });

  // 编译器切换时更新架构徽章高亮（仅同步，不改变选中的架构）
  compilerSelect.addEventListener('change', () => {
    renderArchBadges(compilers);
  });
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
