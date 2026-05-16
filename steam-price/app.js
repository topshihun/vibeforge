/**
 * Steam 价格查询工具 — 视图独立架构
 * 每个视图（热门游戏/打折游戏/搜索标签）拥有独立的状态：
 * items, rendered, scrollTop, loading, error, query
 *
 * API 参考：
 * - 搜索: https://store.steampowered.com/api/storesearch?term=...&cc=us&l=en
 * - 详情: https://store.steampowered.com/api/appdetails?appids=...&cc=...
 * - 史低: https://www.cheapshark.com/api/1.0/games?steamAppID=...
 * - 汇率: https://open.er-api.com/v6/latest/USD
 */

// ===== 常量 =====
const CC_CURRENCIES = [
  { cc: 'cn', flag: '🇨🇳', code: 'CNY', name: '人民币' },
  { cc: 'us', flag: '🇺🇸', code: 'USD', name: '美元' },
  { cc: 'de', flag: '🇪🇺', code: 'EUR', name: '欧元' },
  { cc: 'jp', flag: '🇯🇵', code: 'JPY', name: '日元' },
  { cc: 'gb', flag: '🇬🇧', code: 'GBP', name: '英镑' },
  { cc: 'kr', flag: '🇰🇷', code: 'KRW', name: '韩元' },
  { cc: 'ru', flag: '🇷🇺', code: 'RUB', name: '卢布' },
  { cc: 'br', flag: '🇧🇷', code: 'BRL', name: '雷亚尔' },
];

/** Steam 搜索语言代码 — 全部 33 种支持的语言 */
const LANGUAGES = [
  { code: 'en',     flag: '🇺🇸', label: 'English',               native: 'English' },
  { code: 'zh_CN',  flag: '🇨🇳', label: '简体中文 (中国)',      native: '简体中文' },
  { code: 'zh_TW',  flag: '🇹🇼', label: '繁體中文 (台灣)',      native: '繁體中文' },
  { code: 'ja',     flag: '🇯🇵', label: '日本語',                native: '日本語' },
  { code: 'ko',     flag: '🇰🇷', label: '한국어',                native: '한국어' },
  { code: 'ru',     flag: '🇷🇺', label: 'Русский',               native: 'Русский' },
  { code: 'de',     flag: '🇩🇪', label: 'Deutsch',               native: 'Deutsch' },
  { code: 'fr',     flag: '🇫🇷', label: 'Français',              native: 'Français' },
  { code: 'es',     flag: '🇪🇸', label: 'Español',               native: 'Español' },
  { code: 'es-419', flag: '🌎', label: 'Español (LATAM)',        native: 'Español (LATAM)' },
  { code: 'it',     flag: '🇮🇹', label: 'Italiano',              native: 'Italiano' },
  { code: 'nl',     flag: '🇳🇱', label: 'Nederlands',            native: 'Nederlands' },
  { code: 'pt',     flag: '🇵🇹', label: 'Português',             native: 'Português' },
  { code: 'pt_BR',  flag: '🇧🇷', label: 'Português (Brasil)',    native: 'Português (Brasil)' },
  { code: 'pl',     flag: '🇵🇱', label: 'Polski',                native: 'Polski' },
  { code: 'tr',     flag: '🇹🇷', label: 'Türkçe',                native: 'Türkçe' },
  { code: 'th',     flag: '🇹🇭', label: 'ไทย',                   native: 'ไทย' },
  { code: 'vi',     flag: '🇻🇳', label: 'Tiếng Việt',            native: 'Tiếng Việt' },
  { code: 'cs',     flag: '🇨🇿', label: 'Čeština',               native: 'Čeština' },
  { code: 'hu',     flag: '🇭🇺', label: 'Magyar',                native: 'Magyar' },
  { code: 'ro',     flag: '🇷🇴', label: 'Română',                native: 'Română' },
  { code: 'bg',     flag: '🇧🇬', label: 'Български',             native: 'Български' },
  { code: 'uk',     flag: '🇺🇦', label: 'Українська',            native: 'Українська' },
  { code: 'el',     flag: '🇬🇷', label: 'Ελληνικά',              native: 'Ελληνικά' },
  { code: 'no',     flag: '🇳🇴', label: 'Norsk',                 native: 'Norsk' },
  { code: 'sv',     flag: '🇸🇪', label: 'Svenska',               native: 'Svenska' },
  { code: 'da',     flag: '🇩🇰', label: 'Dansk',                 native: 'Dansk' },
  { code: 'fi',     flag: '🇫🇮', label: 'Suomi',                 native: 'Suomi' },
  { code: 'ar',     flag: '🇸🇦', label: 'العربية',               native: 'العربية' },
  { code: 'he',     flag: '🇮🇱', label: 'עברית',                 native: 'עברית' },
  { code: 'id',     flag: '🇮🇩', label: 'Bahasa Indonesia',       native: 'Bahasa Indonesia' },
  { code: 'ms',     flag: '🇲🇾', label: 'Bahasa Melayu',         native: 'Bahasa Melayu' },
  { code: 'hi',     flag: '🇮🇳', label: 'हिन्दी',                native: 'हिन्दी' },
];

const VIEW_FEATURED_TOP = 'featured:top_sellers';
const VIEW_FEATURED_SPECIALS = 'featured:specials';

// ===== 状态管理 =====

/**
 * 全局状态对象。
 *
 * 视图定义：每个视图（featured / tab:N）在 state.views 中有自己的键值对，
 * 存储 items、rendered（已渲染条数）、scrollTop、loading、error、query。
 *
 * views 的结构：
 *   'featured:top_sellers': { items, rendered, scrollTop, loading, error, rawData, searchExtra }
 *   'featured:specials':    { items, rendered, scrollTop, loading, error, rawData, searchExtra }
 *   'tab:1':               { items, rendered, scrollTop, loading, error, query }
 *   'tab:2':               ...
 */
const state = {
  cc: 'cn',
  lang: detectDefaultLang(),
  tabIdCounter: 1,
  activeView: null,  // 'featured:top_sellers' | 'featured:specials' | 'tab:1' | 'tab:2' ...

  /** 所有视图，键为 'featured:top_sellers' / 'featured:specials' / 'tab:1' / 'tab:2' ... */
  views: {},

  exchangeRates: null,
};

/** 创建或获取一个视图状态对象 */
function ensureView(key) {
  if (!state.views[key]) {
    state.views[key] = { items: [], rendered: 0, scrollTop: 0, loading: false, error: null };
    if (key.startsWith('tab:')) state.views[key].query = '';
  }
  return state.views[key];
}

/** 获取当前激活的视图状态 */
function currentView() {
  return state.activeView ? state.views[state.activeView] : null;
}

// ===== 视图切换 =====

/**
 * 切换到指定视图。
 * - 保存当前视图的 scrollTop
 * - 销毁当前分页
 * - 清空 resultsEl
 * - 激活目标视图
 * - 根据目标视图状态渲染（loading / error / empty / items）
 */
function switchToView(key) {
  const prev = currentView();
  if (prev) prev.scrollTop = resultsEl.scrollTop;

  destroyPagination();
  resultsEl.innerHTML = '';
  hideError();
  state.activeView = key;

  const view = state.views[key];
  if (!view) {
    resultsEl.innerHTML = `<div class="no-results"><div class="icon">📭</div><div class="text">视图不存在</div></div>`;
    return;
  }

  if (view.loading) {
    renderInlineLoading(resultsEl);
  } else if (view.error) {
    renderInlineError(resultsEl, view.error);
  } else if (view.items.length === 0) {
    const isSearch = key.startsWith('tab:');
    const q = view.query || '';
    resultsEl.innerHTML = isSearch
      ? `<div class="no-results"><div class="icon">🔍</div><div class="text">没有找到 "${escapeHtml(q)}" 相关游戏</div></div>`
      : `<div class="no-results"><div class="icon">📭</div><div class="text">该分类暂无游戏</div></div>`;
  } else {
    renderCurrentView();
  }
}

/** 渲染当前激活视图的内容（用视图状态的 items + rendered） */
function renderCurrentView() {
  const view = currentView();
  if (!view || view.items.length === 0) return;
  initPagination(view.items, view.rendered);
  resultsEl.scrollTop = view.scrollTop;
}

// ===== 滚动位置实时保存 =====

resultsEl.addEventListener('scroll', () => {
  const view = currentView();
  if (view) view.scrollTop = resultsEl.scrollTop;
});

// ===== 史低缓存 =====
/** 内存缓存：getHistoricalLow 结果，1 小时后过期 */
const priceLowCache = new Map();
const CACHE_TTL = 3600_000; // 1 小时

/** 多语言游戏名字缓存：Map<appId, Map<lang, name>> */
const nameCache = new Map();

/** 内存缓存：getSteamPrice 结果（按 appId_cc 缓存），1 小时后过期 */
const priceCache = new Map();

/** 内存缓存：多币种详情 HTML 结果，1 小时后过期 */
const detailCache = new Map();

// ===== DOM 引用 =====
const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const currencySelect = $('currencySelect');
const langSelect = $('langSelect');
const resultsEl = $('results');
const loadingEl = $('loading');
const errorCard = $('errorCard');
const errorMsg = $('errorMsg');
const featuredTabsEl = $('featuredTabs');
const searchTabsEl = $('searchTabs');

// ===== 工具函数 =====

/** CORS 代理列表（Steam/CheapShark API 不支持浏览器跨域请求） */
const CORS_PROXIES = [
  url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://corsproxy.budd.ink/?${encodeURIComponent(url)}`,
];

// ===== 网络请求工具 =====

/** 带超时的 fetch（默认 10s 超时，不发送 Referer 避免代理拦截） */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      referrerPolicy: 'no-referrer',
      headers: { 'Accept': 'application/json', ...options.headers },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** 并发尝试所有 CORS 代理，返回第一个成功的响应（最快 ~4s，最慢 ~5s） */
async function proxyFetch(url, options = {}) {
  const proxiedUrls = CORS_PROXIES.map(fn => fn(url));
  const promises = proxiedUrls.map(proxiedUrl =>
    fetchWithTimeout(proxiedUrl, options, 5000).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    })
  );
  const results = await Promise.allSettled(promises);
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value;
  }
  // 全部失败，抛最后一条错误
  throw results[results.length - 1].reason;
}

async function proxyFetchWithRetry(url, options = {}, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await proxyFetch(url, options);
    } catch (err) {
      if (i === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/** 重试加载图片（网络不稳定时自动重试） */
async function retryLoadImage(img, src, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
      return;
    } catch {
      if (i === maxRetries) {
        // 全部失败，保留占位图
      } else {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      }
    }
  }
}

/** 从浏览器语言推断 Steam 语言代码 */
function detectDefaultLang() {
  let raw = navigator.language || navigator.userLanguage || 'en';
  // 去掉区域后缀：'zh-CN' → 'zh_CN'（保留大写后缀，匹配 Steam 格式）
  const parts = raw.replace(/-/g, '_').split('_');
  if (parts.length >= 2 && parts[0] === 'zh') {
    const region = parts[1]?.toUpperCase();
    if (region === 'CN' || region === 'TW' || region === 'HK' || region === 'SG') {
      return `zh_${region}`;
    }
    return 'zh_CN'; // 默认为简体中文
  }
  // 检查 LANGUAGES 是否有完整匹配，否则只取语言前缀
  const full = LANGUAGES.find(l => l.code === raw);
  if (full) return full.code;
  const langOnly = raw.split(/[_-]/)[0];
  const match = LANGUAGES.find(l => l.code === langOnly);
  return match ? match.code : 'en';
}

/** 获取语言的原生名称 */
function getLangNative(code) {
  const l = LANGUAGES.find(l => l.code === code);
  return l ? l.native : code;
}

// ===== 格式化工具 =====

/** 将 Steam 分（cents）转为带货币的显示字符串 */
function formatPrice(cents, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode);
  if (currencyCode === 'JPY' || currencyCode === 'KRW') {
    return `${symbol}${Math.round(cents).toLocaleString()}`;
  }
  return `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** USD 金额（浮点）→ 本地货币换算 */
function formatUsdToLocal(usdAmount, currencyCode) {
  if (!state.exchangeRates || !state.exchangeRates[currencyCode]) return null;
  const rate = state.exchangeRates[currencyCode];
  const local = usdAmount * rate;
  const symbol = getCurrencySymbol(currencyCode);
  if (currencyCode === 'JPY' || currencyCode === 'KRW') {
    return `${symbol}${Math.round(local).toLocaleString()}`;
  }
  return `${symbol}${local.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCurrencySymbol(code) {
  const symbols = {
    'CNY': '¥', 'USD': '$', 'EUR': '€', 'GBP': '£',
    'JPY': '¥', 'KRW': '₩', 'RUB': '₽', 'BRL': 'R$',
  };
  return symbols[code] || code;
}

function getRatingClass(percent) {
  if (percent >= 80) return 'positive';
  if (percent >= 60) return 'mixed';
  return 'negative';
}

// ===== UI 工具 =====

function showError(msg) {
  errorMsg.textContent = msg;
  errorCard.style.display = 'flex';
}

function hideError() {
  errorCard.style.display = 'none';
  errorMsg.textContent = '';
}

function renderInlineLoading(container) {
  container.innerHTML = `<div class="loading" style="display:flex;"><div class="spinner"></div><span>正在查询中，请稍候...</span></div>`;
}

function renderInlineError(container, message) {
  container.innerHTML = `<div class="error-card" style="display:flex;"><div class="error-icon">⚠️</div><div class="error-msg">${escapeHtml(message)}</div></div>`;
}

// ===== Steam API 接口 =====

/**
 * 搜索游戏（轻量搜索 API，快速返回候选列表）
 * GET https://store.steampowered.com/api/storesearch?term=<query>&cc=us&l=<lang>
 */
async function searchSteamGames(query, lang = 'en') {
  const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&cc=us&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  return (data.items || []).filter(item => item.type === 'app' || item.type === 'game');
}

/**
 * 完整搜索（带标签/描述匹配，降级使用）
 * GET https://store.steampowered.com/api/storesearch?term=<query>&cc=us&l=<lang>
 * 实际 storesearch 返回的参数中包含更多元数据
 */
async function searchSteamStoreFull(query, lang = 'en') {
  const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&cc=us&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  return (data.items || []).filter(item => item.type === 'app' || item.type === 'game');
}

/**
 * 获取游戏名称（多语言）
 * GET https://store.steampowered.com/api/appdetails?appids=<id>&cc=us&l=<lang>
 */
async function fetchGameName(appId, lang) {
  const cached = nameCache.get(appId);
  if (cached && cached.has(lang)) return cached.get(lang);

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  const appData = data[String(appId)];
  if (appData && appData.success && appData.data && appData.data.name) {
    if (!nameCache.has(appId)) nameCache.set(appId, new Map());
    nameCache.get(appId).set(lang, appData.data.name);
    return appData.data.name;
  }
  return null;
}

/**
 * 更新所有游戏卡片的语言（同时尝试异步获取翻译名称，失败保留原名）
 */
async function updateCardLanguage(lang) {
  const cards = resultsEl.querySelectorAll('.game-card');
  const promises = [];
  for (const card of cards) {
    const appId = card.dataset.appid;
    const nameEl = card.querySelector('.game-name');
    if (!appId || !nameEl) continue;
    const p = fetchGameName(appId, lang).then(name => {
      if (name) nameEl.textContent = name;
    }).catch(() => {});
    promises.push(p);
  }
  await Promise.allSettled(promises);
}

/**
 * 获取 Steam 价格（对应指定 Steam 商店国家 cc）
 * GET https://store.steampowered.com/api/appdetails?appids=<id>&cc=<cc>&l=en
 */
async function getSteamPrice(appId, cc) {
  const cacheKey = `${appId}_${cc}`;
  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) return cached.data;

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${cc}&l=en`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  const appData = data[String(appId)];
  if (appData && appData.success && appData.data) {
    const priceData = appData.data.price_overview || null;
    priceCache.set(cacheKey, { data: priceData, ts: Date.now() });
    return priceData;
  }
  return null;
}

/**
 * 获取史低价
 * GET https://www.cheapshark.com/api/1.0/games?steamAppID=<id>
 *
 * 返回 { lowest: number (cents?), date: number (unix sec), price: number (cents?) } | null
 * cheapshark 返回的价格是美元美分（cents 整数），如果没数据返回 null
 */
async function getHistoricalLow(steamAppId) {
  const cached = priceLowCache.get(steamAppId);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) return cached.data;

  const url = `https://www.cheapshark.com/api/1.0/games?steamAppID=${steamAppId}`;
  try {
    const res = await proxyFetchWithRetry(url);
    const json = await res.json();
    if (!json || json.length === 0) {
      priceLowCache.set(steamAppId, { data: null, ts: Date.now() });
      return null;
    }
    const game = json[0];
    const cheapest = game.cheapest || null;
    const cheapestEver = game.cheapestEver || null;
    let result = null;
    if (cheapestEver) {
      // cheapestEver.price 是字符串表示的美元金额（如 "1.99"）
      const lowPriceCents = Math.round(parseFloat(cheapestEver.price) * 100);
      result = {
        lowest: lowPriceCents,
        date: cheapestEver.date ? parseInt(cheapestEver.date) : null, // unix seconds
        price: cheapest ? Math.round(parseFloat(cheapest) * 100) : lowPriceCents,
      };
    } else if (cheapest) {
      result = {
        lowest: Math.round(parseFloat(cheapest) * 100),
        date: null,
        price: Math.round(parseFloat(cheapest) * 100),
      };
    }
    priceLowCache.set(steamAppId, { data: result, ts: Date.now() });
    return result;
  } catch (e) {
    console.warn(`getHistoricalLow(${steamAppId}) 失败:`, e.message);
    return null;
  }
}

/**
 * 获取汇率（USD → 所有支持货币）
 * GET https://open.er-api.com/v6/latest/USD
 */
async function fetchExchangeRates() {
  const url = 'https://open.er-api.com/v6/latest/USD';
  const res = await fetchWithTimeout(url, {}, 8000);
  const data = await res.json();
  if (data.result !== 'success') throw new Error('汇率接口返回异常');
  return data.rates;
}

// ===== Featured（推荐游戏）API =====

/**
 * 获取 Steam 推荐列表（featuredcategories）
 * GET https://store.steampowered.com/api/featuredcategories?cc=<cc>&l=<lang>
 */
async function fetchFeatured(cc, lang = 'en') {
  const url = `https://store.steampowered.com/api/featuredcategories?cc=${cc}&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  return await res.json();
}

function normalizeFeaturedItem(item) {
  if (!item || !item.id) return null;
  return {
    id: item.id,
    name: item.name || '未知游戏',
    tiny_image: item.tiny_image || '',
    header_image: item.header_image || '',
    metacritic_score: item.metacritic_score || 0,
    steam_rating_percent: item.steam_rating_percent || 0,
    release_date: item.release_date || '',
    price: item.price || { final: 0, initial: 0, discount_percent: 0 },
    _hasPrice: true,
  };
}

/**
 * 获取 Steam 分类搜索（topsellers / specials 等）
 * GET https://store.steampowered.com/api/search/category?category=<category>&cc=<cc>&l=<lang>&count=<count>
 */
async function fetchSearchCategory(category, cc, lang, count = 50) {
  const url = `https://store.steampowered.com/api/search/category?category=${category}&cc=${cc}&l=${lang}&count=${count}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  return data.items || [];
}

function normalizeSearchItem(item) {
  if (!item || !item.id) return null;
  return {
    id: item.id,
    name: item.name || '未知游戏',
    tiny_image: item.tiny_image || '',
    header_image: item.header_image || '',
    metacritic_score: item.metacritic_score || 0,
    steam_rating_percent: item.steam_rating_percent || 0,
    release_date: item.release_date || '',
    price: null,
    _hasPrice: false,
  };
}

// ===== 加载推荐游戏（热门游戏 + 打折游戏） =====

/** 初始化两个 featured 视图：获取数据，填入各自的 items，然后切换到当前 tab */
async function loadFeatured(cc) {
  cc = cc || state.cc;
  hideError();

  // 创建两个视图并标记 loading
  const topView = ensureView(VIEW_FEATURED_TOP);
  const specialsView = ensureView(VIEW_FEATURED_SPECIALS);
  topView.loading = true;
  specialsView.loading = true;

  // 如果当前是 featured 视图，显示 loading
  const isFeaturedActive = state.activeView && state.activeView.startsWith('featured:');
  if (isFeaturedActive) {
    renderInlineLoading(resultsEl);
  }

  try {
    let featuredData, topsellersExtra, specialsExtra;

    try {
      featuredData = await fetchFeatured(cc, state.lang);
    } catch (e) {
      console.warn('fetchFeatured 失败:', e.message);
    }

    try {
      topsellersExtra = await fetchSearchCategory('topsellers', cc, state.lang);
    } catch (e) {
      console.warn('fetchSearchCategory(topsellers) 失败:', e.message);
    }

    try {
      specialsExtra = await fetchSearchCategory('specials', cc, state.lang);
    } catch (e) {
      console.warn('fetchSearchCategory(specials) 失败:', e.message);
    }

    if (!featuredData) {
      throw new Error('热门游戏接口全部失败');
    }

    // 填充 top_sellers 视图
    fillFeaturedView(VIEW_FEATURED_TOP, featuredData, topsellersExtra, 'top_sellers');
    // 填充 specials 视图
    fillFeaturedView(VIEW_FEATURED_SPECIALS, featuredData, specialsExtra, 'specials');

    // 如果当前是 featured，重新渲染当前视图
    if (state.activeView && state.activeView.startsWith('featured:')) {
      renderCurrentView();
      // 更新名称
      updateCardLanguage(state.lang).catch(() => {});
    }
  } catch (err) {
    topView.loading = false;
    specialsView.loading = false;
    topView.error = err.message;
    specialsView.error = err.message;
    if (isFeaturedActive) {
      renderInlineError(resultsEl, `无法加载推荐游戏：${escapeHtml(err.message)}`);
    }
  }
}

/** 填充一个 featured 视图的数据 */
function fillFeaturedView(viewKey, featuredData, extraItems, category) {
  const view = state.views[viewKey];
  view.loading = false;
  view.error = null;

  const rawItems = (featuredData[category] && featuredData[category].items) || [];
  const extra = (extraItems || []).map(normalizeSearchItem).filter(Boolean);

  // 合并：先取 featuredcategories 的有价格条目，再追加无价格的搜索条目（去重）
  const normalized = rawItems.map(normalizeFeaturedItem).filter(Boolean);
  const seen = new Set(normalized.map(i => i.id));
  for (const item of extra) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      normalized.push(item);
    }
  }

  view.items = normalized;
  view.rendered = 0;
  view.rawData = featuredData;
  view.searchExtra = extraItems;
}

// ===== 推荐游戏标签切换 =====

function setupFeaturedTabs() {
  featuredTabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.featured-tab');
    if (!tab) return;

    const category = tab.dataset.category;
    const viewKey = `featured:${category}`;
    if (state.activeView === viewKey) return;

    // 切换推荐标签 UI
    searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    switchToView(viewKey);

    // 当前视图如果没数据但 data 存在（刚切换，还没请求完毕），尝试渲染
    const view = state.views[viewKey];
    if (!view || (view.items.length === 0 && !view.loading && !view.error)) {
      // 可能还没有加载，等 loadFeatured 完成
    }
  });

  // 搜索结果标签点击/关闭
  searchTabsEl.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.close-tab');
    if (closeBtn) {
      closeSearchTab(parseInt(closeBtn.dataset.tabId));
      return;
    }

    const tab = e.target.closest('.search-tab');
    if (!tab) return;

    const tabId = parseInt(tab.dataset.tabId);
    const viewKey = `tab:${tabId}`;
    if (state.activeView === viewKey) return;
    activateSearchTab(tabId);
  });
}

// ===== 搜索标签管理 =====

/** 激活指定的搜索标签（tabId 为数字 id，不含 'tab:' 前缀） */
function activateSearchTab(tabId) {
  const viewKey = `tab:${tabId}`;
  const view = state.views[viewKey];
  if (!view) return;

  // 切换 UI
  featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
  searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
  const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.classList.add('active');

  switchToView(viewKey);

  // 如果有已加载的结果但不是空，更新名称
  if (view.items.length > 0) {
    updateCardLanguage(state.lang).catch(() => {});
  }
}

/** 关闭搜索标签 */
function closeSearchTab(tabId) {
  const viewKey = `tab:${tabId}`;
  if (!state.views[viewKey]) return;

  // 保存当前滚动
  if (state.activeView === viewKey) {
    const view = state.views[viewKey];
    if (view) view.scrollTop = resultsEl.scrollTop;
  }

  // 删除视图
  delete state.views[viewKey];

  // 删除标签 UI
  const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.remove();

  if (state.activeView === viewKey) {
    // 切换到最近的历史搜索标签，否则回推荐
    const remaining = searchTabsEl.querySelectorAll('.search-tab');
    if (remaining.length > 0) {
      const lastTab = remaining[remaining.length - 1];
      activateSearchTab(parseInt(lastTab.dataset.tabId));
    } else {
      // 回到当前活跃的 featured tab
      const activeFeatured = featuredTabsEl.querySelector('.featured-tab.active');
      const category = activeFeatured ? activeFeatured.dataset.category : 'top_sellers';
      const featuredKey = `featured:${category}`;
      featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
      if (activeFeatured) activeFeatured.classList.add('active');
      switchToView(featuredKey);
    }
  }
}

// ===== 搜索逻辑 =====

/** 搜索并展示结果。可选参数：query（搜索词，默认取输入框）、force（强制重新搜索当前标签） */
async function doSearch(query, force) {
  if (!query) {
    query = searchInput.value.trim();
    if (!query) {
      showError('请输入游戏名称');
      return;
    }
  }

  hideError();

  // 如果已有同查询标签且非强制刷新，直接切过去
  if (!force) {
    for (const [key, view] of Object.entries(state.views)) {
      if (key.startsWith('tab:') && view.query === query) {
        const tabId = parseInt(key.slice(4));
        activateSearchTab(tabId);
        return;
      }
    }
  }

  // force 刷新：重用已有标签（同查询），否则创建新标签
  let tabId, viewKey, view;

  // 查找现有同查询标签
  let existingKey = null;
  for (const [key, v] of Object.entries(state.views)) {
    if (key.startsWith('tab:') && v.query === query) {
      existingKey = key;
      break;
    }
  }

  if (existingKey && force) {
    // 复用已有标签并重新搜索
    tabId = parseInt(existingKey.slice(4));
    viewKey = existingKey;
    view = state.views[viewKey];
    view.items = [];
    view.rendered = 0;
    view.loading = true;
    view.error = null;
    view.query = query;

    // 激活标签 UI
    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabEl) tabEl.classList.add('active');

    switchToView(viewKey);
    renderInlineLoading(resultsEl);
  } else {
    // 创建新标签
    tabId = state.tabIdCounter++;
    viewKey = `tab:${tabId}`;
    view = { items: [], rendered: 0, scrollTop: 0, loading: true, error: null, query };
    state.views[viewKey] = view;

    // 创建标签 UI
    const tabEl = document.createElement('button');
    tabEl.className = 'search-tab active';
    tabEl.dataset.tabId = tabId;
    tabEl.innerHTML = `<span class="search-tab-label">🔍 ${escapeHtml(query)}</span><span class="close-tab" data-tab-id="${tabId}">✕</span>`;
    searchTabsEl.appendChild(tabEl);

    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    switchToView(viewKey);
    renderInlineLoading(resultsEl);
  }

  try {
    const items = await searchSteamGames(query, state.lang);

    if (items.length === 0) {
      // 降级：使用完整搜索接口（支持标签/描述匹配，搜中文关键词更准确）
      const fullItems = await searchSteamStoreFull(query, state.lang);
      if (fullItems.length > 0) {
        items.push(...fullItems);
      }
    }

    // 仍然没结果时，尝试用中文搜索（方便中文名搜索）
    if (items.length === 0 && state.lang !== 'schinese') {
      const chineseItems = await searchSteamStoreFull(query, 'schinese');
      if (chineseItems.length > 0) {
        items.push(...chineseItems);
      }
    }

    // 检查视图是否还存在
    const currentViewState = state.views[viewKey];
    if (!currentViewState) return; // 标签已被关闭

    currentViewState.loading = false;
    currentViewState.items = items;
    currentViewState.rendered = 0;

    // 仅当此标签仍是激活态时才渲染
    if (state.activeView !== viewKey) return;

    if (items.length === 0) {
      resultsEl.innerHTML = `
        <div class="no-results">
          <div class="icon">🔍</div>
          <div class="text">没有找到 "${escapeHtml(query)}" 相关游戏<br><span style="color:#444;font-size:0.85em;">当前搜索语言：${getLangNative(state.lang)}，可尝试切换语言重新搜索</span></div>
        </div>`;
    } else {
      renderCurrentView();
      // 渲染后立即更新所有卡片名称为当前语言
      updateCardLanguage(state.lang).catch(() => {});
    }
  } catch (err) {
    const currentViewState = state.views[viewKey];
    if (currentViewState) {
      currentViewState.loading = false;
      currentViewState.error = err.message;
    }
    if (state.activeView === viewKey) {
      renderInlineError(resultsEl, `搜索失败：${escapeHtml(err.message)}`);
    }
  }
}

// ===== 渲染（通用，所有视图共用） =====

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return '';
  // ts 是 unix 秒
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 创建单个游戏卡片 */
function createGameCard(item) {
  const { id, name, tiny_image, metacritic_score, steam_rating_percent, release_date, price } = item;
  const card = document.createElement('div');
  card.className = 'game-card';
  card.dataset.appid = id;

  // 评分
  const ratingText = steam_rating_percent ? `${steam_rating_percent}%` : '';
  const ratingClass = steam_rating_percent ? getRatingClass(steam_rating_percent) : '';

  // 日期
  const year = release_date ? release_date.substring(0, 4) : '';

  // 缩略图
  const thumbSrc = item.header_image
    ? item.header_image
    : (tiny_image
      ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/${tiny_image}`
      : `https://steamcdn-a.akamaihd.net/steam/apps/${id}/capsule_231x87.jpg`);

  // 先用占位图初始化，随后异步重试加载真实图片
  const placeholder = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 231 87%22><rect fill=%22%231a1a2e%22 width=%22231%22 height=%2287%22/><text x=%22115%22 y=%2248%22 text-anchor=%22middle%22 fill=%22%23333%22 font-size=%2220%22>🎮</text></svg>`;

  card.innerHTML = `
    <div class="game-card-header">
      <img class="game-thumb" src="${placeholder}" alt="${escapeHtml(name)}" loading="lazy">
      <div class="game-info">
        <div class="game-name">${escapeHtml(name)}</div>
        <div class="game-meta">
          ${year ? `<span class="released">📅 ${escapeHtml(year)}</span>` : ''}
          ${ratingText ? `<span class="rating ${ratingClass}">⭐ ${ratingText}</span>` : ''}
          ${metacritic_score ? `<span>🏆 ${metacritic_score}</span>` : ''}
        </div>
      </div>
      <div class="game-card-aside" id="aside-${id}">
        <span class="price-na">⏳ 史低查询中...</span>
      </div>
    </div>
    <div class="game-price-row" id="price-row-${id}">
      <span class="price-na">⏳ 正在查询价格...</span>
    </div>
    <div class="game-detail" id="detail-${id}"></div>
  `;

  // 点击展开/收起多币种详情
  card.addEventListener('click', (e) => {
    if (e.target.closest('.expand-btn')) return;
    card.classList.toggle('expanded');
    if (card.classList.contains('expanded') && !card.dataset.detailLoaded) {
      loadDetailPrices(id, card);
    }
  });

  // 异步重试加载真实图片（网络不稳定时自动重试，失败则保留占位图）
  const img = card.querySelector('.game-thumb');
  if (img) retryLoadImage(img, thumbSrc);

  // 如果已含价格数据（featured），直接渲染主货币价格
  if (item._hasPrice && price && price.final !== undefined) {
    renderCardPriceInline(card, id, price, state.cc);
  } else {
    loadPriceForCard(id, card, state.cc);
  }

  return card;
}

/** 为已有价格数据的卡片直接渲染价格行（用于 featured 推荐） */
function renderCardPriceInline(card, appId, price, cc) {
  const priceRow = card.querySelector(`#price-row-${appId}`);
  if (!priceRow) return;

  const ccInfo = CC_CURRENCIES.find(c => c.cc === cc);
  const currencyCode = ccInfo?.code || 'USD';
  const symbol = getCurrencySymbol(currencyCode);
  const finalPrice = formatPrice(price.final, currencyCode);
  const initialPrice = formatPrice(price.initial, currencyCode);
  const discount = price.discount_percent || 0;

  let html = '';
  if (discount > 0) {
    html = `
      <span class="price-current">${symbol}${finalPrice}</span>
      <span class="price-original">${symbol}${initialPrice}</span>
      <span class="discount-badge">-${discount}%</span>`;
  } else {
    html = `<span class="price-current">${symbol}${finalPrice}</span>`;
  }

  priceRow.innerHTML = html;
  loadHistoryLow(appId, card);
}

// ===== 下滑分页（无限滚动） =====

/** 初始化分页并渲染第一批。如果 startFrom > 0，则直接渲染到 startFrom 的位置 */
function initPagination(items, startFrom = 0) {
  destroyPagination();

  // 创建底部哨兵
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';

  // 存储在 view 上，方便切换时销毁/恢复
  const view = currentView();
  if (view) {
    view._observer = null;
    view._sentinel = sentinel;
  }

  resultsEl.appendChild(sentinel);

  // IntersectionObserver：哨兵进入视口 → 追加一批
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      renderNextBatch();
    }
  }, { rootMargin: '300px' });
  observer.observe(sentinel);

  if (view) view._observer = observer;

  // 如果 startFrom > 0，直接渲染到该位置
  if (startFrom > 0) {
    const fragment = document.createDocumentFragment();
    const end = Math.min(startFrom, items.length);
    for (let i = 0; i < end; i++) {
      fragment.appendChild(createGameCard(items[i]));
    }
    resultsEl.insertBefore(fragment, sentinel);
    if (view) view.rendered = end;
  } else {
    // 渲染第一批
    renderNextBatch();
  }
}

/** 销毁分页状态 */
function destroyPagination() {
  const view = currentView();
  if (view) {
    if (view._observer) {
      view._observer.disconnect();
      view._observer = null;
    }
    if (view._sentinel && view._sentinel.parentNode) {
      view._sentinel.parentNode.removeChild(view._sentinel);
    }
    view._sentinel = null;
  }
}

/** 追加下一批卡片到 DOM（从 state.views.activeView 读取分页数据） */
function renderNextBatch() {
  const view = currentView();
  if (!view) return;
  const { items, rendered } = view;
  const batch = 10;

  if (rendered >= items.length) return;

  const end = Math.min(rendered + batch, items.length);
  const fragment = document.createDocumentFragment();
  for (let i = rendered; i < end; i++) {
    fragment.appendChild(createGameCard(items[i]));
  }

  // 插入到哨兵之前
  if (view._sentinel && view._sentinel.parentNode) {
    resultsEl.insertBefore(fragment, view._sentinel);
  }
  view.rendered = end;

  // 全部加载完毕 → 移除哨兵和 observer
  if (end >= items.length) {
    if (view._observer) view._observer.disconnect();
    if (view._sentinel && view._sentinel.parentNode) {
      view._sentinel.parentNode.removeChild(view._sentinel);
    }
    view._sentinel = null;
    view._observer = null;
  }
}

// ===== 价格加载 =====

/** 为单个卡片加载主货币价格并渲染 */
async function loadPriceForCard(appId, card, cc) {
  try {
    const price = await getSteamPrice(appId, cc);
    const priceRow = card.querySelector(`#price-row-${appId}`);
    if (!priceRow) return;

    if (!price) {
      priceRow.innerHTML = `<span class="price-na">💰 价格未知</span>`;
      return;
    }

    const ccInfo = CC_CURRENCIES.find(c => c.cc === cc);
    const currencyCode = ccInfo?.code || 'USD';
    const symbol = getCurrencySymbol(currencyCode);
    const finalPrice = formatPrice(price.final, currencyCode);
    const initialPrice = formatPrice(price.initial, currencyCode);
    const discount = price.discount_percent || 0;

    let html = '';
    if (discount > 0) {
      html = `
        <span class="price-current">${symbol}${finalPrice}</span>
        <span class="price-original">${symbol}${initialPrice}</span>
        <span class="discount-badge">-${discount}%</span>`;
    } else {
      html = `<span class="price-current">${symbol}${finalPrice}</span>`;
    }
    priceRow.innerHTML = html;
    loadHistoryLow(appId, card);
  } catch (e) {
    console.warn(`loadPriceForCard(${appId}) 失败:`, e.message);
    const priceRow = card.querySelector(`#price-row-${appId}`);
    if (priceRow) {
      priceRow.innerHTML = `<span class="price-na">💰 价格获取失败</span>`;
    }
  }
}

/** 为单个卡片加载史低价格并渲染到侧栏 */
async function loadHistoryLow(appId, card) {
  const aside = card.querySelector(`#aside-${appId}`);
  if (!aside) return;

  try {
    const low = await getHistoricalLow(appId);
    if (!low || !low.lowest) {
      aside.innerHTML = `<span class="price-na">📉 无史低数据</span>`;
      return;
    }

    const lowFormatted = formatPrice(low.lowest, 'USD');
    const dateStr = low.date ? formatDate(low.date) : '';
    const dateHtml = dateStr ? `<span class="low-date">📅 ${dateStr}</span>` : '';

    // 检查当前价格是否等于史低
    const priceRow = card.querySelector(`#price-row-${appId}`);
    const isMatch = priceRow && priceRow.textContent.includes('$' + (low.price / 100).toFixed(2));

    aside.innerHTML = `
      <div class="historical-low${isMatch ? ' match-current' : ''}">
        <div class="label">📉 史低</div>
        <div class="lowest-ever">${lowFormatted}</div>
        ${dateHtml}
      </div>`;
  } catch (e) {
    console.warn(`loadHistoryLow(${appId}) 失败:`, e.message);
    aside.innerHTML = `<span class="price-na">📉 史低获取失败</span>`;
  }
}

// ===== 多币种详情 =====

/** 加载并渲染多币种价格详情（展开卡片的展开内容） */
async function loadDetailPrices(appId, card) {
  const detailEl = card.querySelector(`#detail-${appId}`);
  if (!detailEl) return;

  const cacheKey = appId;
  const cached = detailCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
    detailEl.innerHTML = cached.html;
    card.dataset.detailLoaded = 'true';
    loadDetailHistoryLows(appId, detailEl);
    return;
  }

  // 异步获取汇率（首次调用）
  if (!state.exchangeRates) {
    try {
      state.exchangeRates = await fetchExchangeRates();
    } catch (e) {
      detailEl.innerHTML = `<div style="color:#f87171;padding:12px;">⚠️ 汇率获取失败，无法显示多币种价格</div>`;
      return;
    }
  }

  // 并发获取所有货币的价格
  const pricePromises = CC_CURRENCIES.map(async (c) => {
    let price;
    if (c.cc === state.cc) {
      // 当前货币：从卡片 DOM 中读取
      const priceRow = card.querySelector(`#price-row-${appId}`);
      const el = priceRow?.querySelector('.price-current');
      price = el ? el.textContent : '—';
    } else {
      // 其他货币：先获取 USD 价格，再换算
      const usdPrice = await getSteamPrice(appId, 'us');
      if (usdPrice && usdPrice.final !== undefined) {
        const rate = state.exchangeRates[c.code];
        if (rate) {
          const usdCents = usdPrice.final;
          const usdAmount = usdCents / 100;
          const local = formatUsdToLocal(usdAmount, c.code);
          price = local || '—';
        } else {
          price = '—';
        }
      } else {
        price = '—';
      }
    }
    return { cc: c.cc, flag: c.flag, code: c.code, price, name: c.name };
  });

  const results = await Promise.allSettled(pricePromises);
  const rows = results.map(r => {
    const p = r.status === 'fulfilled' ? r.value : { cc: '?', flag: '', code: '?', price: '—', name: '?' };
    return `<tr><td class="curr-code">${p.flag} ${p.code}</td><td class="curr-price">${p.price}</td><td class="curr-sale">${p.name}</td></tr>`;
  }).join('');

  const html = `
    <table class="currency-table">
      <thead><tr><th>货币</th><th>当前价格</th><th>地区</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div id="detail-lows-${appId}">
      <div style="color:#888;font-size:0.8em;padding:8px 0;">📉 正在查询各货币史低...</div>
    </div>`;

  detailEl.innerHTML = html;
  detailCache.set(cacheKey, { html, ts: Date.now() });
  card.dataset.detailLoaded = 'true';

  // 异步查询各货币史低
  loadDetailHistoryLows(appId, detailEl);
}

/** 加载多币种史低并更新已展开的 detail 区域 */
async function loadDetailHistoryLows(appId, detailEl) {
  const lowContainer = detailEl.querySelector(`#detail-lows-${appId}`);
  if (!lowContainer) return;

  const low = await getHistoricalLow(appId);
  if (!low || !low.lowest) {
    lowContainer.innerHTML = `<div style="color:#444;font-size:0.8em;padding:8px 0;">📉 无史低数据</div>`;
    return;
  }

  const usdLowCents = low.lowest;
  const usdLowAmount = usdLowCents / 100;

  let rows = '';
  for (const c of CC_CURRENCIES) {
    let lowPrice;
    if (c.cc === 'us') {
      lowPrice = formatPrice(usdLowCents, 'USD');
    } else {
      const rate = state.exchangeRates?.[c.code];
      if (rate) {
        const local = usdLowAmount * rate;
        const symbol = getCurrencySymbol(c.code);
        if (c.code === 'JPY' || c.code === 'KRW') {
          lowPrice = `${symbol}${Math.round(local).toLocaleString()}`;
        } else {
          lowPrice = `${symbol}${local.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      } else {
        lowPrice = '—';
      }
    }
    rows += `<tr><td class="curr-code">${c.flag} ${c.code}</td><td class="curr-low">${lowPrice}</td></tr>`;
  }

  lowContainer.innerHTML = `
    <table class="currency-table">
      <thead><tr><th>货币</th><th>史低价格</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="color:#444;font-size:0.75em;padding:4px 0;">史低日期: ${low.date ? formatDate(low.date) : '未知'}</div>`;
}

// ===== 货币选择 =====

/** 设置货币下拉选择框（自定义） */
function setupCurrencySelect() {
  const trigger = document.getElementById('currencySelectTrigger');
  const menu = document.getElementById('currencySelectMenu');
  if (!trigger || !menu) return;

  const container = trigger.closest('.custom-select');

  function renderOptions() {
    menu.innerHTML = CC_CURRENCIES.map(c =>
      `<button class="custom-select-option ${c.cc === state.cc ? 'selected' : ''}" data-value="${c.cc}">${c.flag} ${c.code} · ${c.name}</button>`
    ).join('');
    trigger.textContent = `${CC_CURRENCIES.find(c => c.cc === state.cc).flag} ${state.cc.toUpperCase()}`;
  }

  renderOptions();

  // 点击触发按钮切换下拉
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  // 点击选项
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('.custom-select-option');
    if (!btn) return;
    const cc = btn.dataset.value;
    if (cc === state.cc) {
      container.classList.remove('open');
      return;
    }
    state.cc = cc;
    renderOptions();
    container.classList.remove('open');

    // 重新加载当前视图的价格
    const view = currentView();
    if (view && view.items.length > 0) {
      if (state.activeView && state.activeView.startsWith('featured:')) {
        loadFeatured(cc);
      } else {
        const cards = resultsEl.querySelectorAll('.game-card');
        for (const card of cards) {
          const appId = card.dataset.appid;
          loadPriceForCard(appId, card, cc);
        }
      }
    }
  });
}

// ===== 语言选择 =====

/** 设置语言下拉选择框（自定义） */
function setupLangSelect() {
  const trigger = document.getElementById('langSelectTrigger');
  const menu = document.getElementById('langSelectMenu');
  if (!trigger || !menu) return;

  const container = trigger.closest('.custom-select');

  function renderOptions() {
    menu.innerHTML = LANGUAGES.map(l =>
      `<button class="custom-select-option ${l.code === state.lang ? 'selected' : ''}" data-value="${l.code}">${l.flag} ${l.native} (${l.label})</button>`
    ).join('');
    const cur = LANGUAGES.find(l => l.code === state.lang);
    trigger.textContent = cur ? `${cur.flag} ${cur.native}` : state.lang;
  }

  renderOptions();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('.custom-select-option');
    if (!btn) return;
    const lang = btn.dataset.value;
    if (lang === state.lang) {
      container.classList.remove('open');
      return;
    }
    state.lang = lang;
    renderOptions();
    container.classList.remove('open');
    // 更新搜索框提示
    const cur = LANGUAGES.find(l => l.code === lang);
    searchInput.placeholder = `🔍 ${cur ? cur.native + ' · ' : ''}搜游戏名称...`;
    searchInput.lang = lang.replace('_', '-');

    // 根据当前视图重新获取数据
    if (state.activeView && state.activeView.startsWith('featured:')) {
      loadFeatured(state.cc);
    } else if (state.activeView && state.activeView.startsWith('tab:')) {
      const view = currentView();
      if (view && view.query) {
        doSearch(view.query, true);
      }
    }

    // 更新所有可见卡片的名称
    updateCardLanguage(lang).catch(() => {});
  });
}

// ===== 搜索事件 =====

function setupSearch() {
  const triggerSearch = () => doSearch();
  searchBtn.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });
}

// ===== 初始化 =====

function initActiveFeaturedTab() {
  // 默认激活 top_sellers
  const defaultTab = featuredTabsEl.querySelector('[data-category="top_sellers"]');
  if (defaultTab) defaultTab.classList.add('active');
}

async function init() {
  setupCurrencySelect();
  setupLangSelect();
  setupSearch();
  setupFeaturedTabs();
  initActiveFeaturedTab();

  // 设置初始搜索框提示
  const cur = LANGUAGES.find(l => l.code === state.lang);
  searchInput.placeholder = `🔍 ${cur ? cur.native + ' · ' : ''}搜游戏名称...`;
  searchInput.lang = state.lang.replace('_', '-');

  // 初始视图设为 featured:top_sellers 并加载数据
  state.activeView = VIEW_FEATURED_TOP;
  ensureView(VIEW_FEATURED_TOP);
  ensureView(VIEW_FEATURED_SPECIALS);
  renderInlineLoading(resultsEl);
  await loadFeatured();
  searchInput.focus();
}

// 页面加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
