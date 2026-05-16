/**
 * Steam 价格查询工具 — 视图独立架构 v2
 * 每个视图（热门游戏/打折游戏/搜索标签）拥有独立状态：
 *   items, rendered, scrollTop, status ('idle'|'loading'|'loaded'|'error'|'empty'), error, query
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
  { code: 'it',     flag: '🇮🇹', label: 'Italiano',               native: 'Italiano' },
  { code: 'nl',     flag: '🇳🇱', label: 'Nederlands',             native: 'Nederlands' },
  { code: 'pt',     flag: '🇵🇹', label: 'Português',              native: 'Português' },
  { code: 'pt_BR',  flag: '🇧🇷', label: 'Português (Brasil)',    native: 'Português (Brasil)' },
  { code: 'pl',     flag: '🇵🇱', label: 'Polski',                 native: 'Polski' },
  { code: 'tr',     flag: '🇹🇷', label: 'Türkçe',                 native: 'Türkçe' },
  { code: 'th',     flag: '🇹🇭', label: 'ไทย',                    native: 'ไทย' },
  { code: 'vi',     flag: '🇻🇳', label: 'Tiếng Việt',             native: 'Tiếng Việt' },
  { code: 'cs',     flag: '🇨🇿', label: 'Čeština',                native: 'Čeština' },
  { code: 'hu',     flag: '🇭🇺', label: 'Magyar',                 native: 'Magyar' },
  { code: 'ro',     flag: '🇷🇴', label: 'Română',                 native: 'Română' },
  { code: 'bg',     flag: '🇧🇬', label: 'Български',              native: 'Български' },
  { code: 'uk',     flag: '🇺🇦', label: 'Українська',             native: 'Українська' },
  { code: 'el',     flag: '🇬🇷', label: 'Ελληνικά',               native: 'Ελληνικά' },
  { code: 'no',     flag: '🇳🇴', label: 'Norsk',                  native: 'Norsk' },
  { code: 'sv',     flag: '🇸🇪', label: 'Svenska',                native: 'Svenska' },
  { code: 'da',     flag: '🇩🇰', label: 'Dansk',                  native: 'Dansk' },
  { code: 'fi',     flag: '🇫🇮', label: 'Suomi',                  native: 'Suomi' },
  { code: 'ar',     flag: '🇸🇦', label: 'العربية',                native: 'العربية' },
  { code: 'he',     flag: '🇮🇱', label: 'עברית',                  native: 'עברית' },
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
 * 每个视图在 state.views 中有自己的键值对，存储独立的状态：
 *   items        — 游戏条目数组
 *   rendered     — 已渲染到 DOM 的条数
 *   scrollTop    — 保存的滚动位置
 *   status       — 'idle' | 'loading' | 'loaded' | 'error' | 'empty'
 *   error        — 错误消息（status 为 'error' 时）
 *   query        — 搜索查询（仅 tab 视图）
 *
 * 视图键：
 *   'featured:top_sellers'
 *   'featured:specials'
 *   'tab:1', 'tab:2', ...
 */
const state = {
  cc: 'cn',
  lang: detectDefaultLang(),
  tabIdCounter: 1,
  activeView: null,  // 'featured:top_sellers' | 'featured:specials' | 'tab:1' | 'tab:2' ...

  /** 所有视图，键为上述值 */
  views: {},

  exchangeRates: null,
};

/** 创建或获取一个视图状态对象 */
function ensureView(key) {
  if (!state.views[key]) {
    state.views[key] = {
      items: [],
      rendered: 0,
      scrollTop: 0,
      status: 'idle',
      error: null,
    };
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
 * - 保存当前视图的 scrollTop（由 scroll 事件实时追踪，这里不再额外保存）
 * - 销毁当前分页
 * - 清空 resultsEl
 * - 激活目标视图
 * - 根据目标视图 status 渲染对应 UI（loading / error / empty / idle / loaded）
 */
function switchToView(key) {
  // scrollTop 已由 scroll 事件监听器实时保存，无需手动保存
  destroyPagination();
  resultsEl.innerHTML = '';
  hideError();
  state.activeView = key;

  const view = state.views[key];
  if (!view) {
    resultsEl.innerHTML = `<div class="no-results"><div class="icon">📭</div><div class="text">视图不存在</div></div>`;
    return;
  }

  renderViewStatus(view, key);
}

/** 根据视图状态渲染对应 UI */
function renderViewStatus(view, key) {
  switch (view.status) {
    case 'loading':
      renderInlineLoading(resultsEl);
      break;
    case 'error':
      renderInlineError(resultsEl, view.error || '未知错误');
      break;
    case 'empty':
      renderEmptyView(key, view);
      break;
    case 'idle':
    case 'loaded':
      if (view.items.length === 0) {
        renderEmptyView(key, view);
      } else {
        renderCurrentView();
      }
      break;
    default:
      renderEmptyView(key, view);
  }
}

/** 渲染空视图提示 */
function renderEmptyView(key, view) {
  const isSearch = key.startsWith('tab:');
  const q = view.query || '';
  resultsEl.innerHTML = isSearch
    ? `<div class="no-results"><div class="icon">🔍</div><div class="text">没有找到 "${escapeHtml(q)}" 相关游戏</div></div>`
    : `<div class="no-results"><div class="icon">📭</div><div class="text">该分类暂无游戏</div></div>`;
}

/** 渲染当前激活视图的内容（用视图状态的 items + rendered） */
function renderCurrentView() {
  const view = currentView();
  if (!view || view.items.length === 0) return;
  initPagination(view.items, view.rendered);
  resultsEl.scrollTop = view.scrollTop;
}

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

// ===== 滚动懒加载（scroll 实时保存 + 接近底部检测） =====
resultsEl.addEventListener('scroll', () => {
  const view = currentView();
  if (!view) return;
  view.scrollTop = resultsEl.scrollTop;

  // 懒加载检测：接近底部 400px 时加载下一批
  if (view._sentinel && view.rendered < view.items.length) {
    const threshold = 400;
    const distToBottom = resultsEl.scrollHeight - resultsEl.scrollTop - resultsEl.clientHeight;
    if (distToBottom < threshold) {
      renderNextBatch();
    }
  }
});

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

/** 使用 CORS 代理获取 URL（自动按序重试代理） */
async function proxyFetch(url, options = {}) {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](url);
      const res = await fetchWithTimeout(proxyUrl, options);
      if (res.ok) return res;
    } catch (e) {
      console.warn(`代理 ${i} 失败:`, e.message);
    }
  }
  throw new Error('所有 CORS 代理均失败');
}

/** 代理 fetch + 自动重试（最多 maxRetries 次） */
async function proxyFetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await proxyFetch(url, options);
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** 异步重试加载图片（网络不稳定时自动重试，失败则保留占位图） */
async function retryLoadImage(img, src, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      img.src = url;
      return;
    } catch (e) {
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * (attempt + 2)));
    }
  }
  // 所有重试失败，保留占位 SVG
}

// ===== 语言检测 =====

/** 根据浏览器语言检测默认 Steam 搜索语言 */
function detectDefaultLang() {
  try {
    const navLang = navigator.language || navigator.userLanguage || '';
    const lang = navLang.toLowerCase();
    if (lang.startsWith('zh')) return 'zh_CN';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('pt')) return 'pt_BR';
    if (lang.startsWith('it')) return 'it';
    if (lang.startsWith('nl')) return 'nl';
    if (lang.startsWith('pl')) return 'pl';
    if (lang.startsWith('tr')) return 'tr';
    if (lang.startsWith('th')) return 'th';
    if (lang.startsWith('vi')) return 'vi';
    if (lang.startsWith('cs')) return 'cs';
    if (lang.startsWith('hu')) return 'hu';
    if (lang.startsWith('ro')) return 'ro';
    if (lang.startsWith('sv')) return 'sv';
    if (lang.startsWith('ar')) return 'ar';
    if (lang.startsWith('he')) return 'he';
    if (lang.startsWith('id')) return 'id';
    return 'en';
  } catch (_) {
    return 'en';
  }
}

/** 获取语言的本地名称 */
function getLangNative(code) {
  const l = LANGUAGES.find(x => x.code === code);
  return l ? l.native : code;
}

// ===== 格式化工具 =====

/** 将 Steam 分（cents）转为带货币的显示字符串 */
function formatPrice(cents, currencyCode) {
  if (cents == null || cents === 0) return null;
  const symbol = getCurrencySymbol(currencyCode);
  if (currencyCode === 'JPY' || currencyCode === 'KRW') {
    return `${symbol}${Math.round(cents).toLocaleString()}`;
  }
  return `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** USD 金额（浮点）→ 本地货币换算 */
function formatUsdToLocal(usdAmount, currencyCode) {
  if (usdAmount == null || usdAmount === 0) return null;
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

/** 搜索 Steam 商店 */
async function searchSteamGames(query, lang = 'en') {
  const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&cc=us&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  return (data.items || []).map(item => ({
    id: item.id,
    name: item.name || '未知游戏',
    tiny_image: item.tiny_image || '',
    header_image: item.header_image || '',
    metacritic_score: item.metacritic_score || 0,
    steam_rating_percent: item.steam_rating_percent || 0,
    release_date: item.release_date || '',
    price: null,
    _hasPrice: false,
  }));
}

/** 使用完整搜索接口（支持按标签/描述匹配，降级用） */
async function searchSteamStoreFull(query, lang = 'en') {
  const url = `https://store.steampowered.com/api/search/suggest?term=${encodeURIComponent(query)}&f=games&cc=us&l=${lang}`;
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  const items = data.suggestions || [];
  return items.map(item => ({
    id: parseInt(item.id),
    name: item.name || '未知游戏',
    tiny_image: item.tiny_image || '',
    header_image: item.header_image || '',
    metacritic_score: 0,
    steam_rating_percent: 0,
    release_date: item.release_date || '',
    price: null,
    _hasPrice: false,
  }));
}

/** 获取游戏名称（多语言） */
async function fetchGameName(appId, lang) {
  const cacheKey = `${appId}_${lang}`;
  const cached = nameCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts < CACHE_TTL)) return cached.data;

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=${lang}`;
  try {
    const res = await proxyFetchWithRetry(url);
    const data = await res.json();
    const appData = data[String(appId)];
    let name = null;
    if (appData && appData.success && appData.data) {
      name = appData.data.name;
    }
    nameCache.set(cacheKey, { data: name, ts: Date.now() });
    return name;
  } catch (e) {
    return null;
  }
}

/** 更新当前视图中所有卡片的游戏名称为指定语言 */
async function updateCardLanguage(lang) {
  const view = currentView();
  if (!view) return;
  const cards = resultsEl.querySelectorAll('.game-card');
  for (const card of cards) {
    const appId = card.dataset.appid;
    if (!appId) continue;
    const name = await fetchGameName(appId, lang);
    if (name) {
      const nameEl = card.querySelector('.game-name');
      if (nameEl) nameEl.textContent = name;
    }
  }
}

/** 获取 Steam 价格（按国家代码） */
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
 * 返回 { lowest: number (cents), date: number (unix sec), price: number (cents) } | null
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
      const lowPriceCents = Math.round(parseFloat(cheapestEver.price) * 100);
      result = {
        lowest: lowPriceCents,
        date: cheapestEver.date ? parseInt(cheapestEver.date) : null,
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

/** 获取汇率（USD → 各货币） */
async function fetchExchangeRates() {
  const url = 'https://open.er-api.com/v6/latest/USD';
  const res = await proxyFetchWithRetry(url);
  const data = await res.json();
  if (data.result !== 'success') throw new Error('汇率接口返回失败');
  return data.rates;
}

// ===== 推荐游戏 API =====

/** 获取 Steam 推荐游戏分类数据 */
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
    price: item.price || null,
    _hasPrice: !!item.price,
  };
}

/** 获取 Steam 分类搜索（支持分页，自动累积获取更多条目） */
async function fetchSearchCategory(category, cc, lang, maxItems = 200) {
  const pageSize = 50;
  let allItems = [];
  let start = 0;
  let totalCount = Infinity;

  while (start < totalCount && allItems.length < maxItems) {
    const url = `https://store.steampowered.com/api/search/category?category=${category}&cc=${cc}&l=${lang}&count=${pageSize}&start=${start}`;
    try {
      const res = await proxyFetchWithRetry(url);
      const data = await res.json();
      const items = data.items || [];
      totalCount = data.total_count || items.length;
      allItems = allItems.concat(items);
      if (items.length < pageSize) break; // 最后一页
      start += pageSize;
    } catch (e) {
      console.warn(`fetchSearchCategory(${category}) 第 ${start} 页失败:`, e.message);
      break;
    }
  }

  return allItems;
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
  topView.status = 'loading';
  specialsView.status = 'loading';

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

    // 填充 top_sellers 视图（合并 new_releases + coming_soon 补充更多条目）
    fillFeaturedView(VIEW_FEATURED_TOP, featuredData, topsellersExtra, 'top_sellers', ['new_releases', 'coming_soon']);
    // 填充 specials 视图
    fillFeaturedView(VIEW_FEATURED_SPECIALS, featuredData, specialsExtra, 'specials');

    // 如果当前是 featured，重新渲染当前视图
    if (state.activeView && state.activeView.startsWith('featured:')) {
      renderCurrentView();
      // 更新名称
      updateCardLanguage(state.lang).catch(() => {});
    }
  } catch (err) {
    topView.status = 'error';
    specialsView.status = 'error';
    topView.error = err.message;
    specialsView.error = err.message;
    if (isFeaturedActive) {
      renderInlineError(resultsEl, `无法加载推荐游戏：${escapeHtml(err.message)}`);
    }
  }
}

/** 填充一个 featured 视图的数据 */
function fillFeaturedView(viewKey, featuredData, extraItems, category, extraCategories) {
  const view = state.views[viewKey];

  // 从主分类收集
  const rawItems = (featuredData[category] && featuredData[category].items) || [];

  // 从额外分类收集（如 new_releases、coming_soon）
  if (extraCategories && extraCategories.length) {
    for (const extraCat of extraCategories) {
      const extraCatItems = (featuredData[extraCat] && featuredData[extraCat].items) || [];
      for (const item of extraCatItems) {
        rawItems.push(item);
      }
    }
  }

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

  // 设置状态
  if (normalized.length === 0) {
    view.status = 'empty';
  } else {
    view.status = 'loaded';
  }
  view.error = null;
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
  });

  // 搜索结果标签点击/关闭
  searchTabsEl.addEventListener('click', (e) => {
    // 点击关闭按钮
    const closeBtn = e.target.closest('.close-tab');
    if (closeBtn) {
      const tabId = parseInt(closeBtn.dataset.tabId);
      closeSearchTab(tabId);
      return;
    }

    // 点击标签本身
    const tabEl = e.target.closest('.search-tab');
    if (!tabEl) return;

    const tabId = parseInt(tabEl.dataset.tabId);
    if (isNaN(tabId)) return;

    const viewKey = `tab:${tabId}`;
    if (state.activeView === viewKey) return;

    activateSearchTab(tabId);
  });
}

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

function closeSearchTab(tabId) {
  const viewKey = `tab:${tabId}`;
  if (!state.views[viewKey]) return;

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

// ===== 搜索 =====

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
    for (const [key, v] of Object.entries(state.views)) {
      if (key.startsWith('tab:') && v.query === query) {
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
    view.status = 'loading';
    view.error = null;
    view.query = query;

    // 激活标签 UI
    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabEl) tabEl.classList.add('active');

    switchToView(viewKey);
    // switchToView 会根据 status='loading' 渲染 loading
  } else {
    // 创建新标签
    tabId = state.tabIdCounter++;
    viewKey = `tab:${tabId}`;
    view = { items: [], rendered: 0, scrollTop: 0, status: 'loading', error: null, query };
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
    // switchToView 会根据 status='loading' 渲染 loading
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

    currentViewState.items = items;
    currentViewState.rendered = 0;

    if (items.length === 0) {
      currentViewState.status = 'empty';
    } else {
      currentViewState.status = 'loaded';
    }

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
      currentViewState.status = 'error';
      currentViewState.error = err.message;
    }
    if (state.activeView === viewKey) {
      renderInlineError(resultsEl, `搜索失败：${escapeHtml(err.message)}`);
    }
  }
}

// ===== 渲染（通用，所有视图共用） =====

/** 转义 HTML 特殊字符 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return '';
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
  if (item._hasPrice && price && price.final != null && price.final > 0) {
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
  const finalPrice = formatPrice(price.final, currencyCode);
  const initialPrice = formatPrice(price.initial, currencyCode);
  const discount = price.discount_percent || 0;

  // formatPrice 已经包含货币符号，直接使用
  let html = '';
  if (discount > 0) {
    html = `
      <span class="price-current">${finalPrice}</span>
      <span class="price-original">${initialPrice}</span>
      <span class="discount-badge">-${discount}%</span>`;
  } else {
    html = `<span class="price-current">${finalPrice || '💰 免费'}</span>`;
  }

  priceRow.innerHTML = html;
  loadHistoryLow(appId, card);
}

// ===== 下滑分页（无限滚动） =====

/** 初始化分页并渲染第一批。如果 startFrom > 0，则直接渲染到 startFrom 的位置 */
function initPagination(items, startFrom = 0) {
  destroyPagination();
  resultsEl.innerHTML = '';

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
  // 使用 resultsEl 作为 root，因为 .results 是实际滚动容器 (overflow-y: auto)
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      renderNextBatch();
    }
  }, { root: resultsEl, rootMargin: '300px' });
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

  // 同步填满视口：第一批（或恢复后）若未填满，持续追加直到哨兵低于 rootMargin
  if (view && view._sentinel && view.rendered < items.length) {
    for (let safety = 0; safety < 50; safety++) {
      const sRect = view._sentinel.getBoundingClientRect();
      const cRect = resultsEl.getBoundingClientRect();
      if (sRect.top - cRect.top >= cRect.height + 300) break;
      renderNextBatch();
      if (view.rendered >= items.length || !view._sentinel) break;
    }
  }
}

/** 销毁分页状态（从当前 view 断开 observer 并移除哨兵） */
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
    return;
  }

  // 填满视口：哨兵仍在 rootMargin 范围内时继续加载下一批
  // IntersectionObserver 只在交叉状态变化时触发，哨兵持续可见不会再次回调
  if (view._sentinel) {
    requestAnimationFrame(() => {
      // 视图可能已切换，检查哨兵是否仍属于当前 view
      const v = currentView();
      if (!v || v !== view) return;
      if (!view._sentinel || !view._sentinel.parentNode) return;

      const sRect = view._sentinel.getBoundingClientRect();
      const cRect = resultsEl.getBoundingClientRect();
      const margin = 300; // 与 observer rootMargin 一致

      // 如果哨兵距容器顶部的距离 < 容器可视高度 + rootMargin，说明仍在可见范围内
      if (sRect.top - cRect.top < cRect.height + margin) {
        renderNextBatch();
      }
    });
  }
}

// ===== 价格加载 =====

/** 为单个卡片加载主货币价格并渲染 */
async function loadPriceForCard(appId, card, cc) {
  try {
    const price = await getSteamPrice(appId, cc);
    const priceRow = card.querySelector(`#price-row-${appId}`);
    if (!priceRow) return;

    if (!price || price.final == null || price.final === 0) {
      priceRow.innerHTML = `<span class="price-na">💰 价格未知</span>`;
      return;
    }

    const ccInfo = CC_CURRENCIES.find(c => c.cc === cc);
    const currencyCode = ccInfo?.code || 'USD';
    const finalPrice = formatPrice(price.final, currencyCode);
    const initialPrice = formatPrice(price.initial, currencyCode);
    const discount = price.discount_percent || 0;

    // formatPrice 已经包含货币符号，直接使用
    let html = '';
    if (discount > 0) {
      html = `
        <span class="price-current">${finalPrice}</span>
        <span class="price-original">${initialPrice}</span>
        <span class="discount-badge">-${discount}%</span>`;
    } else {
      html = `<span class="price-current">${finalPrice}</span>`;
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

    aside.innerHTML = `
      <div class="historical-low">
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
      <thead><tr><th>货币</th><th>价格</th><th>名称</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  detailEl.innerHTML = html;
  card.dataset.detailLoaded = 'true';
  detailCache.set(cacheKey, { html, ts: Date.now() });

  // 异步查询每个货币的史低
  loadDetailHistoryLows(appId, detailEl);
}

/** 在已展开的详情表中追加史低列 */
async function loadDetailHistoryLows(appId, detailEl) {
  const rows = detailEl?.querySelectorAll('tbody tr');
  if (!rows || rows.length === 0) return;

  // 每行追加史低价格
  const low = await getHistoricalLow(appId);
  const usdLow = low && low.lowest ? formatPrice(low.lowest, 'USD') : null;

  rows.forEach((row, idx) => {
    const cc = CC_CURRENCIES[idx];
    if (!cc) return;
    let lowHtml = '—';
    if (cc.code === 'USD' && usdLow) {
      lowHtml = usdLow;
    } else if (cc.code !== 'USD' && low && low.lowest) {
      const usdCents = low.lowest;
      const usdAmount = usdCents / 100;
      if (state.exchangeRates && state.exchangeRates[cc.code]) {
        const rate = state.exchangeRates[cc.code];
        const local = formatUsdToLocal(usdAmount, cc.code);
        if (local) lowHtml = local;
      }
    }
    const lowCell = document.createElement('td');
    lowCell.className = 'curr-low';
    lowCell.textContent = lowHtml;
    row.appendChild(lowCell);
  });
}

// ===== 货币/语言选择 =====

function setupCurrencySelect() {
  const trigger = $('currencySelectTrigger');
  const menu = $('currencySelectMenu');

  renderOptions(menu, CC_CURRENCIES, (item) => ({
    label: `${item.flag} ${item.name} (${item.code})`,
    selected: item.cc === state.cc,
  }));

  // 设置默认选中项
  const defaultOpt = menu.querySelector(`[data-value="${state.cc}"]`);
  if (defaultOpt) {
    trigger.textContent = defaultOpt.textContent;
    trigger.dataset.value = state.cc;
  }

  // 选择事件
  menu.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (!option) return;
    const cc = option.dataset.value;
    if (cc === state.cc) return;

    state.cc = cc;
    currencySelect.classList.remove('open');
    trigger.textContent = option.textContent;
    trigger.dataset.value = cc;

    // 重新加载推荐游戏
    loadFeatured(cc).catch(console.warn);
  });
}

function setupLangSelect() {
  const trigger = $('langSelectTrigger');
  const menu = $('langSelectMenu');

  renderOptions(menu, LANGUAGES, (item) => ({
    label: `${item.flag} ${item.native} (${item.label})`,
    selected: item.code === state.lang,
  }));

  // 设置默认选中项
  const defaultOpt = menu.querySelector(`[data-value="${state.lang}"]`);
  if (defaultOpt) {
    trigger.textContent = `${defaultOpt.textContent} 搜索`;
    trigger.dataset.value = state.lang;
  }

  menu.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (!option) return;
    const code = option.dataset.value;
    if (code === state.lang) return;

    state.lang = code;
    langSelect.classList.remove('open');
    trigger.textContent = `${option.textContent} 搜索`;

    // 更新搜索框提示
    const cur = LANGUAGES.find(l => l.code === code);
    searchInput.placeholder = `🔍 ${cur ? cur.native + ' · ' : ''}搜游戏名称...`;
    searchInput.lang = code.replace('_', '-');

    // 更新当前视图卡片名称
    updateCardLanguage(code).catch(() => {});
  });
}

/** 渲染自定义下拉框选项 */
function renderOptions(menu, items, mapper) {
  menu.innerHTML = items.map(item => {
    const { label, selected } = mapper(item);
    const value = ('cc' in item) ? item.cc : item.code;
    return `<div class="custom-select-option${selected ? ' selected' : ''}" data-value="${value}">${label}</div>`;
  }).join('');
}

// 下拉框展开/收起
document.addEventListener('click', (e) => {
  document.querySelectorAll('.custom-select').forEach(el => {
    if (!el.contains(e.target)) {
      el.classList.remove('open');
    }
  });
  const select = e.target.closest('.custom-select');
  if (select) {
    select.classList.toggle('open');
  }
});

// ===== 搜索事件绑定 =====

function setupSearch() {
  const triggerSearch = () => doSearch();
  searchBtn.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });
}

// ===== 初始化 =====

function initActiveFeaturedTab() {
  // 设置初始推荐标签高亮
  const firstTab = featuredTabsEl.querySelector('.featured-tab');
  if (firstTab) firstTab.classList.add('active');
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
