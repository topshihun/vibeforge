(function () {
  'use strict';

  // ===== DOM 引用 =====
  const $ = id => document.getElementById(id);
  const tabs = document.querySelectorAll('.tab');
  const inputText = $('inputText');
  const outputText = $('outputText');
  const inputLabel = $('inputLabel');
  const outputLabel = $('outputLabel');
  const actionRow = $('actionRow');
  const encodeBtn = $('encodeBtn');
  const decodeBtn = $('decodeBtn');
  const copyBtn = $('copyBtn');

  let currentMode = 'md5';

  // ===== 哈希函数 =====

  /** MD5 实现 (兼容性，无需 Web Crypto) */
  function md5(str) {
    function md5cycle(x, k) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210378);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]); x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { return add32(add32(a, q), add32(x, t)) << s | add32(add32(a, q), add32(x, t)) >>> (32 - s); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function md51(s) {
      let n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) { md5cycle(state, tail); tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function md5blk(s) {
      let i, blk = [];
      for (i = 0; i < 64; i += 4) blk[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      return blk;
    }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    function hex(r) {
      let hex_chr = '0123456789abcdef', str = '';
      for (let i = 0; i < r.length; i++) {
        str += hex_chr.charAt((r[i] >> 4) & 0x0F) + hex_chr.charAt(r[i] & 0x0F);
      }
      return str;
    }
    let raw = md51(str);
    return hex([raw[0] & 0xFF, (raw[0] >> 8) & 0xFF, (raw[0] >> 16) & 0xFF, (raw[0] >> 24) & 0xFF,
      raw[1] & 0xFF, (raw[1] >> 8) & 0xFF, (raw[1] >> 16) & 0xFF, (raw[1] >> 24) & 0xFF,
      raw[2] & 0xFF, (raw[2] >> 8) & 0xFF, (raw[2] >> 16) & 0xFF, (raw[2] >> 24) & 0xFF,
      raw[3] & 0xFF, (raw[3] >> 8) & 0xFF, (raw[3] >> 16) & 0xFF, (raw[3] >> 24) & 0xFF]);
  }

  // ===== SHA1 / SHA256 使用 SubtleCrypto (异步) =====

  async function sha1(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return hexFromBuf(hash);
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return hexFromBuf(hash);
  }

  function hexFromBuf(buf) {
    const bytes = new Uint8Array(buf);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ===== Base64 =====

  function base64Encode(str) {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch (e) { return btoa(str); }
  }

  function base64Decode(str) {
    try { return decodeURIComponent(escape(atob(str))); }
    catch (e) { return atob(str); }
  }

  // ===== URL =====

  function urlEncode(str) { return encodeURIComponent(str); }
  function urlDecode(str) { return decodeURIComponent(str); }

  // ===== 十六进制 =====

  function hexEncode(str) {
    return Array.from(new TextEncoder().encode(str))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexDecode(str) {
    const clean = str.replace(/\s/g, '');
    if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
      throw new Error('无效的十六进制字符串');
    }
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  }

  // ===== 派发 =====

  async function encode(input) {
    switch (currentMode) {
      case 'md5': return md5(input);
      case 'sha1': return await sha1(input);
      case 'sha256': return await sha256(input);
      case 'base64': return base64Encode(input);
      case 'url': return urlEncode(input);
      case 'hex': return hexEncode(input);
      default: return '';
    }
  }

  async function decode(input) {
    switch (currentMode) {
      case 'md5':
      case 'sha1':
      case 'sha256':
        throw new Error('哈希不可逆，无法解码');
      case 'base64': return base64Decode(input);
      case 'url': return urlDecode(input);
      case 'hex': return hexDecode(input);
      default: return '';
    }
  }

  // ===== 界面逻辑 =====

  function updateUI() {
    const isHash = ['md5', 'sha1', 'sha256'].includes(currentMode);
    const isHex = currentMode === 'hex';

    // 哈希模式：只显示编码按钮（生成哈希）
    if (isHash) {
      actionRow.style.display = 'flex';
      encodeBtn.textContent = '生成哈希';
      decodeBtn.style.display = 'none';
      inputLabel.textContent = '输入文本';
      outputLabel.textContent = '哈希值';
    } else {
      actionRow.style.display = 'flex';
      encodeBtn.textContent = isHex ? '编码 →' : '编码 →';
      decodeBtn.style.display = 'inline-block';
      inputLabel.textContent = '输入文本';
      outputLabel.textContent = '输出结果';
    }

    inputText.placeholder = currentMode === 'hex'
      ? '请输入文本（编码）或十六进制字符串（解码）...'
      : currentMode === 'base64'
        ? '请输入文本（编码）或 Base64 字符串（解码）...'
        : '请输入要处理的文本...';
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      updateUI();
      outputText.value = '';
    });
  });

  async function handleEncode() {
    const input = inputText.value.trim();
    if (!input) { outputText.value = '⚠️ 请输入内容'; return; }
    try {
      outputText.value = await encode(input);
    } catch (e) {
      outputText.value = '❌ ' + e.message;
    }
  }

  async function handleDecode() {
    const input = inputText.value.trim();
    if (!input) { outputText.value = '⚠️ 请输入内容'; return; }
    try {
      outputText.value = await decode(input);
    } catch (e) {
      outputText.value = '❌ ' + e.message;
    }
  }

  encodeBtn.addEventListener('click', handleEncode);
  decodeBtn.addEventListener('click', handleDecode);

  // Ctrl+Enter 快捷键
  inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      const isHash = ['md5', 'sha1', 'sha256'].includes(currentMode);
      if (isHash) handleEncode();
      else handleEncode(); // 默认编码
    }
  });

  // 复制
  copyBtn.addEventListener('click', () => {
    const val = outputText.value;
    if (!val || val.startsWith('⚠️') || val.startsWith('❌')) return;
    navigator.clipboard.writeText(val).then(() => {
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制结果'; }, 1500);
    }).catch(() => {
      // fallback
      outputText.select();
      document.execCommand('copy');
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制结果'; }, 1500);
    });
  });

  // ===== 初始化 =====
  updateUI();

})();
