/**
 * Steam 价格查询工具
 * 使用 Steam Store API + CheapShark API + ExchangeRate API
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

/** 从浏览器语言推断 Steam 语言代码 */
function detectDefaultLang() {
  const raw = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  const map = {
    'zh': 'zh_CN', 'zh-cn': 'zh_CN', 'zh-hans': 'zh_CN', 'zh-sg': 'zh_CN',
    'zh-tw': 'zh_TW', 'zh-hk': 'zh_TW', 'zh-mo': 'zh_TW', 'zh-hant': 'zh_TW',
    'ja': 'ja', 'ja-jp': 'ja',
    'ko': 'ko', 'ko-kr': 'ko',
    'ru': 'ru', 'ru-ru': 'ru',
    'de': 'de', 'de-de': 'de',
    'fr': 'fr', 'fr-fr': 'fr',
    'es': 'es', 'es-es': 'es',
    'es-419': 'es-419', 'es-mx': 'es-419', 'es-ar': 'es-419',
    'it': 'it', 'it-it': 'it',
    'nl': 'nl', 'nl-nl': 'nl',
    'pt': 'pt', 'pt-pt': 'pt',
    'pt-br': 'pt_BR',
    'pl': 'pl', 'pl-pl': 'pl',
    'tr': 'tr', 'tr-tr': 'tr',
    'th': 'th', 'th-th': 'th',
    'vi': 'vi', 'vi-vn': 'vi',
    'cs': 'cs', 'cs-cz': 'cs',
    'hu': 'hu', 'hu-hu': 'hu',
    'ro': 'ro', 'ro-ro': 'ro',
    'bg': 'bg', 'bg-bg': 'bg',
    'uk': 'uk', 'uk-ua': 'uk',
    'el': 'el', 'el-gr': 'el',
    'nb': 'no', 'nb-no': 'no', 'nn': 'no', 'nn-no': 'no', 'no': 'no', 'nb-no': 'no',
    'sv': 'sv', 'sv-se': 'sv',
    'da': 'da', 'da-dk': 'da',
    'fi': 'fi', 'fi-fi': 'fi',
    'ar': 'ar', 'ar-sa': 'ar',
    'he': 'he', 'he-il': 'he',
    'id': 'id', 'id-id': 'id',
    'ms': 'ms', 'ms-my': 'ms',
    'hi': 'hi', 'hi-in': 'hi',
  };
  return map[raw] || map[raw.split('-')[0]] || 'en';
}

/** 获取 Steam 语言代码对应的原生名称（用于显示） */
function getLangNative(code) {
  const found = LANGUAGES.find(l => l.code === code);
  return found ? found.native : code;
}

// ===== 状态管理 =====
const state = {
  view: 'featured',       // 'featured' | 'search_tab'
  activeTabId: null,       // 当前激活的搜索标签 id（仅 view=search_tab 时有效）
  cc: 'cn',
  lang: detectDefaultLang(),
  tabIdCounter: 1,         // 自增 id，用于搜索标签唯一标识
  searchTabs: [],          // [{ id, query, results, loading, error }]
  featured: {
    data: null,           // 原始 API 数据
    searchExtra: null,    // 从搜索页额外获取的游戏列表 { topsellers: [], specials: [] }
    tab: 'top_sellers',   // 'top_sellers' | 'specials'
    loading: false,
    error: null,
  },
  /** 下滑分页状态 */
  page: {
    items: [],      // 当前视图的所有数据
    rendered: 0,    // 已渲染到 DOM 的数量
    active: false,  // 分页是否生效
    batch: 10,      // 每批追加条目数
    observer: null, // IntersectionObserver 实例
    sentinel: null, // 底部哨兵元素
  },
  exchangeRates: null,    // USD → * 汇率缓存
};

// ===== 史低缓存 =====
/** 内存缓存：getHistoricalLow 结果，1 小时后过期 */
const priceLowCache = new Map();
const CACHE_TTL = 3600_000; // 1 小时
const PRICE_HISTORY_KEY = 'steam_price_snapshots'; // localStorage key

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
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
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

/** 图片加载重试（指数退避，网络不稳定时自动重试最多 maxRetries 次） */
async function retryLoadImage(img, src, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
        // 浏览器缓存命中时可能不触发事件
        if (img.complete && img.naturalWidth > 0) resolve();
      });
      img.onerror = null; // 清除处理器
      return; // 加载成功
    } catch {
      if (attempt >= maxRetries) break;
      // 指数退避 + 随机抖动
      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // 全部重试失败 → 降级为占位图
  img.onerror = null;
  img.src = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 231 87%22><rect fill=%22%231a1a2e%22 width=%22231%22 height=%2287%22/><text x=%22115%22 y=%2248%22 text-anchor=%22middle%22 fill=%22%23444%22 font-size=%2220%22>🎮</text></svg>`;
  img.alt = '加载失败';
}

/** 格式化价格（分 → 元，处理 Steam API 返回的整数分） */
function formatPrice(cents, currencyCode) {
  if (cents === undefined || cents === null) return null;
  const noDecimal = ['JPY', 'KRW'];
  if (noDecimal.includes(currencyCode)) {
    return cents.toLocaleString('en-US');
  }
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 格式化美元金额为当前货币（使用汇率换算） */
function formatUsdToLocal(usdAmount, currencyCode) {
  if (usdAmount === null || usdAmount === undefined) return null;
  const rates = state.exchangeRates;
  if (!rates || !rates[currencyCode]) return null;
  const converted = usdAmount * rates[currencyCode];
  const noDecimal = ['JPY', 'KRW'];
  if (noDecimal.includes(currencyCode)) {
    return converted.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 获取货币符号 */
function getCurrencySymbol(code) {
  const symbols = {
    'CNY': '¥', 'USD': '$', 'EUR': '€', 'JPY': '¥',
    'GBP': '£', 'KRW': '₩', 'RUB': '₽', 'BRL': 'R$',
  };
  return symbols[code] || code;
}

/** 获取 Steam 评分等级 */
function getRatingClass(percent) {
  if (percent >= 80) return 'positive';
  if (percent >= 60) return 'mixed';
  return 'negative';
}

/** 显示错误（全局） */
function showError(msg) {
  errorCard.style.display = 'flex';
  errorMsg.textContent = msg;
}

/** 隐藏错误（全局） */
function hideError() {
  errorCard.style.display = 'none';
}

// ===== 内联加载/错误渲染（在 results 区域内） =====

function renderInlineLoading(container) {
  container.innerHTML = `
    <div class="loading" style="display:flex;position:static;background:transparent;">
      <div class="spinner"></div>
      <span>正在查询中，请稍候...</span>
    </div>`;
}

function renderInlineError(container, message) {
  container.innerHTML = `
    <div class="no-results">
      <div class="icon">⚠️</div>
      <div class="text" style="color:#f87171;">${escapeHtml(message)}</div>
    </div>`;
}

// ===== API 调用 =====

/** Steam Store 搜索（快速匹配，按游戏标题检索） */
async function searchSteamGames(query, lang = 'en') {
  const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&cc=us&l=${lang}`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`Steam 搜索失败 (${res.status})`);
  const data = await res.json();
  return data.items || [];
}

/** Steam Store 完整搜索（降级使用，支持标签/描述匹配）
 *  当 storesearch 返回 0 结果时调用此函数，
 *  使用 store.steampowered.com/search 的 JSON 端点获取更多结果 */
async function searchSteamStoreFull(query, lang = 'en') {
  const url = `https://store.steampowered.com/search/results/?term=${encodeURIComponent(query)}&cc=us&l=${lang}&category1=998&json=1&count=50`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`Steam 完整搜索失败 (${res.status})`);
  const data = await res.json();
  if (!data || !Array.isArray(data.items)) return [];
  return data.items.map(item => {
    // 从 logo URL 中提取 app ID: .../apps/123456/capsule_sm_120.jpg
    const appIdMatch = item.logo?.match(/\/apps\/(\d+)\//);
    const id = appIdMatch ? parseInt(appIdMatch[1], 10) : null;
    if (!id) return null;
    return {
      id,
      name: item.name || `App ${id}`,
      tiny_image: null,
      header_image: '',
      metacritic_score: null,
      steam_rating_percent: null,
      release_date: null,
      price: null,
      _fromFullSearch: true, // 标记来源，用于后续可能的补充
    };
  }).filter(Boolean);
}

/** Steam AppDetails — 获取指定货币的价格 */
async function getSteamPrice(appId, cc) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${cc}&filters=price_overview`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`获取价格失败 (${res.status})`);
  const data = await res.json();
  const app = data[String(appId)];
  if (!app || !app.success) return null;
  return app.data?.price_overview || null;
}

/** CheapShark — 获取史低价格（返回 USD + 史低日期 + 原始价格）
 *  先查 games 端点拿 cheapestDealID，再查 deals 端点拿真正的 cheapestPrice（历史最低价）
 *  如果 deals 端点的 cheapestPrice 无 price 字段，降级使用 games 端点的 cheapest（当前最低）
 *
 *  注意：cheapestDealID 已含 URL 编码字符（如 %2F），直接拼接即可，不可再次 encodeURIComponent！
 *  返回格式：{ lowestUsd, lowestDate, retailUsd, currentUsd } */
async function getHistoricalLow(steamAppId) {
  // 缓存命中
  if (priceLowCache.has(steamAppId)) {
    const cached = priceLowCache.get(steamAppId);
    if (Date.now() - cached.ts < CACHE_TTL) return cached.data;
    priceLowCache.delete(steamAppId);
  }

  // 第一步：查 game 信息获取 cheapestDealID
  const gameUrl = `https://www.cheapshark.com/api/1.0/games?steamAppID=${steamAppId}`;
  const gameRes = await proxyFetch(gameUrl);
  if (!gameRes.ok) return null;
  const gameData = await gameRes.json();
  if (!Array.isArray(gameData) || gameData.length === 0) return null;
  const entry = gameData[0];
  const dealId = entry.cheapestDealID;
  const retailUsd = parseFloat(entry.retailPrice) || null;
  const currentUsd = parseFloat(entry.cheapest);
  if (!dealId) {
    const result = currentUsd ? { lowestUsd: currentUsd, lowestDate: null, retailUsd, currentUsd } : null;
    if (result) { priceLowCache.set(steamAppId, { ts: Date.now(), data: result }); }
    return result;
  }

  // 第二步：查 deal 详情获取历史最低价
  const dealUrl = `https://www.cheapshark.com/api/1.0/deals?id=${dealId}`;
  const dealRes = await proxyFetch(dealUrl);
  if (dealRes.ok) {
    const dealData = await dealRes.json();
    const historicPrice = parseFloat(dealData?.cheapestPrice?.price);
    const lowestDate = dealData?.cheapestPrice?.date || null;
    if (!isNaN(historicPrice)) {
      const result = { lowestUsd: historicPrice, lowestDate, retailUsd, currentUsd };
      priceLowCache.set(steamAppId, { ts: Date.now(), data: result });
      return result;
    }
  }

  // 降级：只用 games 端点数据
  if (!isNaN(currentUsd)) {
    const result = { lowestUsd: currentUsd, lowestDate: null, retailUsd, currentUsd };
    priceLowCache.set(steamAppId, { ts: Date.now(), data: result });
    return result;
  }
  return null;
}

/** 获取 USD 对其他货币的汇率（localStorage 缓存 1 小时） */
async function fetchExchangeRates() {
  if (state.exchangeRates) return state.exchangeRates; // 内存缓存

  // localStorage 缓存检查
  const CACHE_KEY = 'steam_exchange_rates';
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.time && Date.now() - parsed.time < 3600000) {
        state.exchangeRates = parsed.rates || {};
        return state.exchangeRates;
      }
    } catch { /* 失效则重新获取 */ }
  }

  try {
    const url = 'https://open.er-api.com/v6/latest/USD';
    const res = await proxyFetch(url);
    if (!res.ok) throw new Error(`汇率接口失败 (${res.status})`);
    const data = await res.json();
    state.exchangeRates = data.rates || {};
    // 写入 localStorage 缓存
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), rates: state.exchangeRates }));
    return state.exchangeRates;
  } catch {
    state.exchangeRates = {};
    return state.exchangeRates;
  }
}

// ===== 推荐游戏（热门/打折） =====

/**
 * 从 Steam Featured Categories API 获取热门/打折游戏
 * API 会根据 cc 参数返回对应币种的价格
 */
async function fetchFeatured(cc, lang = 'en') {
  const url = `https://store.steampowered.com/api/featuredcategories?cc=${cc}&l=${lang}`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`Steam 推荐接口失败 (${res.status})`);
  const data = await res.json();
  return data;
}

/** 将 featured API 返回的条目标准化为通用格式 */
function normalizeFeaturedItem(item) {
  return {
    id: item.id,
    name: item.name,
    tiny_image: null,
    header_image: item.header_image || '',
    metacritic_score: null,
    steam_rating_percent: null,
    release_date: null,
    price: {
      final: item.final_price,
      initial: item.original_price,
      discount_percent: item.discount_percent || 0,
    },
    _hasPrice: true,
  };
}

/** 从 Steam 搜索页获取指定类别的游戏列表（JSON API，最多 count 条） */
async function fetchSearchCategory(category, cc, lang, count = 50) {
  const filterParam = category === 'specials' ? 'specials=1' : `filter=${category}`;
  const url = `https://store.steampowered.com/search/results/?json=1&${filterParam}&cc=${cc}&l=${lang}&start=0&count=${count}`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`Steam 搜索接口失败 (${res.status})`);
  const data = await res.json();
  return data.items || [];
}

/** 标准化搜索结果（无价格信息，通过 loadPriceForCard 异步查询） */
function normalizeSearchItem(item) {
  const match = item.logo?.match(/\/apps\/(\d+)\//);
  const id = match ? parseInt(match[1], 10) : 0;
  if (!id) return null;
  return {
    id,
    name: item.name || '',
    tiny_image: null,
    header_image: item.logo?.replace(/capsule_sm_120\.(jpg|png)/, 'capsule_231x87.$1') || '',
    metacritic_score: null,
    steam_rating_percent: null,
    release_date: null,
    price: null,
    _hasPrice: false,
  };
}

/** 加载推荐游戏（异步，独立状态管理） */
async function loadFeatured(cc) {
  cc = cc || state.cc;
  state.view = 'featured';
  featuredTabsEl.style.display = 'flex';
  hideError();

  // 设置独立 loading 状态
  state.featured.loading = true;
  state.featured.error = null;
  destroyPagination();
  renderInlineLoading(resultsEl);

  try {
    // 串行获取（避免同时并发导致代理限流），各自独立 catch
    let featuredData, topsellersExtra, specialsExtra;

    try {
      featuredData = await fetchFeatured(cc, state.lang);
    } catch (e) {
      console.warn('fetchFeatured 失败:', e.message);
    }

    // 视图守卫
    if (state.view !== 'featured') return;

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

    state.featured.data = featuredData;
    state.featured.searchExtra = {
      topsellers: (topsellersExtra || []).map(normalizeSearchItem).filter(Boolean),
      specials: (specialsExtra || []).map(normalizeSearchItem).filter(Boolean),
    };
    state.featured.loading = false;
    renderFeatured(state.featured.tab);
  } catch (err) {
    state.featured.loading = false;
    state.featured.error = err.message;
    renderInlineError(resultsEl, `无法加载推荐游戏：${escapeHtml(err.message)}`);
  }
}

/** 渲染指定类别的推荐游戏（从缓存渲染，不触发网络请求） */
function renderFeatured(category) {
  if (state.featured.loading) return; // 正在加载中，不打断

  const data = state.featured.data;
  if (!data || !data[category]) {
    destroyPagination();
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">📭</div>
        <div class="text">暂无数据</div>
      </div>`;
    return;
  }

  const rawItems = data[category].items || [];
  const extraItems = state.featured.searchExtra?.[category] || [];

  if (rawItems.length === 0 && extraItems.length === 0) {
    destroyPagination();
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">📭</div>
        <div class="text">该分类暂无游戏</div>
      </div>`;
    return;
  }

  // 合并：先取 featuredcategories 的有价格条目，再追加无价格的搜索条目（去重）
  const normalized = rawItems.map(normalizeFeaturedItem);
  const seen = new Set(normalized.map(i => i.id));
  for (const extra of extraItems) {
    if (!seen.has(extra.id)) {
      seen.add(extra.id);
      normalized.push(extra);
    }
  }

  renderResults(normalized);
}

/** 设置推荐游戏标签页切换（纯本地渲染，无网络请求） */
function setupFeaturedTabs() {
  featuredTabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.featured-tab');
    if (!tab) return;

    const category = tab.dataset.category;
    if (state.view === 'featured' && category === state.featured.tab) return;

    // 切换到推荐标签
    searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.featured.tab = category;
    state.view = 'featured';
    state.activeTabId = null;

    // 从缓存渲染，不请求网络
    renderFeatured(category);
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
    if (state.view === 'search_tab' && state.activeTabId === tabId) return;
    activateSearchTab(tabId);
  });
}

// ===== 搜索标签管理 + 搜索逻辑 =====

/** 激活指定的搜索结果标签并渲染其内容 */
function activateSearchTab(tabId) {
  featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
  searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));

  const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.classList.add('active');

  state.view = 'search_tab';
  state.activeTabId = tabId;

  const tabState = state.searchTabs.find(t => t.id === tabId);
  if (!tabState) return;

  destroyPagination();

  if (tabState.loading) {
    renderInlineLoading(resultsEl);
  } else if (tabState.error) {
    renderInlineError(resultsEl, `搜索失败：${escapeHtml(tabState.error)}`);
  } else if (tabState.results.length === 0) {
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <div class="text">没有找到 "${escapeHtml(tabState.query)}" 相关游戏</div>
      </div>`;
  } else {
    renderResults(tabState.results);
  }
}

/** 关闭指定搜索结果标签，自动切换到下一个可用视图 */
function closeSearchTab(tabId) {
  const idx = state.searchTabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  state.searchTabs.splice(idx, 1);

  const tabEl = searchTabsEl.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.remove();

  if (state.activeTabId === tabId) {
    // 切到最近的历史选项卡，否则回到推荐
    const remaining = searchTabsEl.querySelectorAll('.search-tab');
    if (remaining.length > 0) {
      const lastTab = remaining[remaining.length - 1];
      activateSearchTab(parseInt(lastTab.dataset.tabId));
    } else {
      state.view = 'featured';
      state.activeTabId = null;
      featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
      const defaultTab = featuredTabsEl.querySelector('[data-category="top_sellers"]');
      if (defaultTab) {
        defaultTab.classList.add('active');
        state.featured.tab = 'top_sellers';
        renderFeatured('top_sellers');
      }
    }
  }
}

/** 搜索并展示结果（启动时即刻创建标签、进入 loading） */
async function doSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showError('请输入游戏名称');
    return;
  }

  hideError();

  // 如果已有同查询标签，直接切过去
  const existing = state.searchTabs.find(t => t.query === query);
  if (existing) {
    activateSearchTab(existing.id);
    return;
  }

  // 创建新标签状态
  const id = state.tabIdCounter++;
  const tabState = { id, query, results: [], loading: true, error: null };
  state.searchTabs.push(tabState);

  // 创建标签 DOM
  const tabEl = document.createElement('button');
  tabEl.className = 'search-tab active';
  tabEl.dataset.tabId = id;
  tabEl.innerHTML = `<span class="search-tab-label">🔍 ${escapeHtml(query)}</span><span class="close-tab" data-tab-id="${id}">✕</span>`;
  searchTabsEl.appendChild(tabEl);

  // 去激活其他所有标签
  featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
  searchTabsEl.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  state.view = 'search_tab';
  state.activeTabId = id;

  destroyPagination();
  renderInlineLoading(resultsEl);

  try {
    const items = await searchSteamGames(query, state.lang);

    if (items.length === 0) {
      // 降级：使用完整搜索接口（支持标签/描述匹配，搜中文关键词更准确）
      const fullItems = await searchSteamStoreFull(query, state.lang);
      if (fullItems.length > 0) {
        items.push(...fullItems);
      }
    }

    // 更新标签状态
    const tabStateRef = state.searchTabs.find(t => t.id === id);
    if (!tabStateRef) return; // 标签已被关闭

    tabStateRef.loading = false;
    tabStateRef.results = items;

    // 仅当此标签仍是激活态时才渲染
    if (state.activeTabId !== id) return;

    if (items.length === 0) {
      resultsEl.innerHTML = `
        <div class="no-results">
          <div class="icon">🔍</div>
          <div class="text">没有找到 "${escapeHtml(query)}" 相关游戏<br><span style="color:#444;font-size:0.85em;">当前搜索语言：${getLangNative(state.lang)}，可尝试切换语言重新搜索</span></div>
        </div>`;
    } else {
      renderResults(items);
    }
  } catch (err) {
    const tabStateRef = state.searchTabs.find(t => t.id === id);
    if (tabStateRef) {
      tabStateRef.loading = false;
      tabStateRef.error = err.message;
    }
    if (state.activeTabId === id) {
      renderInlineError(resultsEl, `搜索失败：${escapeHtml(err.message)}`);
    }
  }
}

/** 渲染搜索结果列表（通用，featured 和 search 共用） */
function renderResults(items) {
  destroyPagination();
  resultsEl.innerHTML = '';

  if (items.length === 0) {
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <div class="text">没有找到相关游戏</div>
      </div>`;
    return;
  }

  // 启动下滑分页，每批 10 个，不写死总数
  initPagination(items);
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

  // 史低行
  html += `<span class="price-history-row" id="history-${appId}"><span class="price-na">⏳ 史低查询中...</span></span>`;
  priceRow.innerHTML = html;
  loadHistoryLow(appId, card);
}

// ===== 下滑分页（无限滚动） =====

/** 初始化分页并渲染第一批 */
function initPagination(items) {
  destroyPagination();
  if (items.length === 0) return;

  state.page.active = true;
  state.page.items = items;
  state.page.rendered = 0;

  // 创建底部哨兵
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  state.page.sentinel = sentinel;
  resultsEl.appendChild(sentinel);

  // IntersectionObserver：哨兵进入视口 → 追加一批
  state.page.observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && state.page.active) {
      renderNextBatch();
    }
  }, { rootMargin: '300px' });
  state.page.observer.observe(sentinel);

  // 渲染第一批
  renderNextBatch();
}

/** 销毁分页状态 */
function destroyPagination() {
  state.page.active = false;
  if (state.page.observer) {
    state.page.observer.disconnect();
    state.page.observer = null;
  }
  if (state.page.sentinel && state.page.sentinel.parentNode) {
    state.page.sentinel.parentNode.removeChild(state.page.sentinel);
  }
  state.page.sentinel = null;
  state.page.items = [];
  state.page.rendered = 0;
}

/** 追加下一批卡片到 DOM */
function renderNextBatch() {
  const { items, rendered, batch } = state.page;
  if (!state.page.active || rendered >= items.length) return;

  const end = Math.min(rendered + batch, items.length);
  const fragment = document.createDocumentFragment();
  for (let i = rendered; i < end; i++) {
    fragment.appendChild(createGameCard(items[i]));
  }
  // 插入到哨兵之前
  if (state.page.sentinel && state.page.sentinel.parentNode) {
    resultsEl.insertBefore(fragment, state.page.sentinel);
  }
  state.page.rendered = end;

  // 全部加载完毕 → 移除哨兵和 observer
  if (end >= items.length) {
    if (state.page.observer) state.page.observer.disconnect();
    if (state.page.sentinel && state.page.sentinel.parentNode) {
      state.page.sentinel.parentNode.removeChild(state.page.sentinel);
    }
    state.page.sentinel = null;
    state.page.observer = null;
  }
}

/** 为主货币加载价格 */
async function loadPriceForCard(appId, card, cc) {
  const priceRow = card.querySelector(`#price-row-${appId}`);
  if (!priceRow) return;

  try {
    const price = await getSteamPrice(appId, cc);
    const ccInfo = CC_CURRENCIES.find(c => c.cc === cc);

    if (!price || !price.final) {
      priceRow.innerHTML = `<span class="price-na">暂无价格信息</span>`;
      return;
    }

    const currencyCode = price.currency || ccInfo?.code || 'USD';
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

    html += `<span class="price-history-row" id="history-${appId}"><span class="price-na">⏳ 史低查询中...</span></span>`;
    priceRow.innerHTML = html;

    loadHistoryLow(appId, card);
  } catch (err) {
    priceRow.innerHTML = `<span class="price-na">价格获取失败</span>`;
  }
}

/** 史低价格查询 + 走势图 */
async function loadHistoryLow(appId, card) {
  const historyEl = card.querySelector(`#history-${appId}`);
  if (!historyEl) return;

  try {
    const data = await getHistoricalLow(appId);
    if (data === null) {
      historyEl.innerHTML = `<span class="price-na">无史低</span>`;
      return;
    }

    const ccInfo = CC_CURRENCIES.find(c => c.cc === state.cc);
    const currencyCode = ccInfo?.code || 'USD';
    const symbol = getCurrencySymbol(currencyCode);

    const localPrice = formatUsdToLocal(data.lowestUsd, currencyCode);
    const isCurrentLow = data.currentUsd !== null && data.lowestUsd >= data.currentUsd - 0.01;

    let html = '';
    if (localPrice !== null) {
      html = `
        <span class="historical-low">
          <span class="label">📉 史低:</span>
          <span class="lowest-ever">${symbol}${localPrice}</span>
          ${data.lowestDate ? `<span class="price-na" style="font-size:0.8em;">(${formatDate(data.lowestDate)})</span>` : ''}
          ${isCurrentLow ? `<span class="match-current">🔥 当前史低</span>` : ''}
        </span>`;
    } else {
      html = `
        <span class="historical-low">
          <span class="label">📉 史低 (USD):</span>
          <span class="lowest-ever">$${data.lowestUsd.toFixed(2)}</span>
          ${data.lowestDate ? `<span class="price-na" style="font-size:0.8em;">(${formatDate(data.lowestDate)})</span>` : ''}
          ${isCurrentLow ? `<span class="match-current">🔥 当前史低</span>` : ''}
        </span>`;
    }
    historyEl.innerHTML = html;

    // 追加走势图
    const priceRow = card.querySelector(`#price-row-${appId}`);
    if (priceRow) {
      const existingChart = priceRow.querySelector('.price-chart-row');
      if (existingChart) existingChart.remove();

      const chartRow = document.createElement('div');
      chartRow.className = 'price-chart-row';
      chartRow.id = `chart-${appId}`;
      priceRow.after(chartRow);

      renderPriceChart(appId, chartRow, data, currencyCode, symbol);
    }
  } catch {
    const el = card.querySelector(`#history-${appId}`);
    if (el) el.innerHTML = `<span class="price-na">史低查询失败</span>`;
  }
}

/** 加载多币种详情 */
async function loadDetailPrices(appId, card) {
  if (card.dataset.detailLoaded) return;
  card.dataset.detailLoaded = '1';

  const detailEl = card.querySelector(`#detail-${appId}`);
  if (!detailEl) return;

  // 平行加载：先获取汇率（如果尚未缓存），再获取所有币种价格
  await fetchExchangeRates();

  detailEl.innerHTML = `<div class="loading" style="padding:16px;"><div class="spinner"></div><span>加载多币种价格...</span></div>`;

  try {
    const promises = CC_CURRENCIES.map(async (ccInfo) => {
      try {
        const price = await getSteamPrice(appId, ccInfo.cc);
        return { ccInfo, price };
      } catch {
        return { ccInfo, price: null };
      }
    });

    const results = await Promise.all(promises);

    let tableHtml = `<table class="currency-table">
      <thead><tr>
        <th>货币</th>
        <th>当前价格</th>
        <th>原价</th>
        <th>折扣</th>
        <th>历史史低</th>
      </tr></thead><tbody>`;

    for (const { ccInfo, price } of results) {
      const symbol = getCurrencySymbol(ccInfo.code);
      const finalPrice = price ? formatPrice(price.final, ccInfo.code) : null;
      const initialPrice = price ? formatPrice(price.initial, ccInfo.code) : null;
      const discount = price?.discount_percent || 0;

      tableHtml += `<tr>
        <td><span class="curr-code">${ccInfo.flag} ${ccInfo.code}</span></td>
        <td class="curr-price">${finalPrice ? symbol + finalPrice : '<span class="curr-na">N/A</span>'}</td>
        <td>${initialPrice && discount > 0 ? '<span style="color:#666;text-decoration:line-through;">' + symbol + initialPrice + '</span>' : '-'}</td>
        <td>${discount > 0 ? `<span class="curr-sale">-${discount}%</span>` : '-'}</td>
        <td id="detail-low-${appId}-${ccInfo.cc}" class="curr-na">⏳</td>
      </tr>`;
    }

    tableHtml += `</tbody></table>`;
    detailEl.innerHTML = tableHtml;

    // 加载史低数据（各币种）
    loadDetailHistoryLows(appId, detailEl);
  } catch {
    detailEl.innerHTML = `<span class="price-na">多币种价格加载失败</span>`;
  }
}

/** 详情中的史低价格（各币种独立换算） */
async function loadDetailHistoryLows(appId, detailEl) {
  try {
    const data = await getHistoricalLow(appId);
    if (data === null) {
      CC_CURRENCIES.forEach(ccInfo => {
        const cell = detailEl.querySelector(`#detail-low-${appId}-${ccInfo.cc}`);
        if (cell) cell.textContent = 'N/A';
      });
      return;
    }
    const lowestUsd = data.lowestUsd;

    // 为每个币种显示换算后的史低
    CC_CURRENCIES.forEach(ccInfo => {
      const cell = detailEl.querySelector(`#detail-low-${appId}-${ccInfo.cc}`);
      if (!cell) return;

      const localPrice = formatUsdToLocal(lowestUsd, ccInfo.code);
      if (localPrice !== null) {
        const symbol = getCurrencySymbol(ccInfo.code);
        cell.innerHTML = `<span style="color:#fbbf24;font-weight:600;">${symbol}${localPrice}</span>`;
        cell.className = 'curr-low';
      } else {
        cell.innerHTML = `<span style="color:#fbbf24;font-weight:600;">$${lowestUsd.toFixed(2)}</span>`;
        cell.className = 'curr-low';
      }
    });
  } catch {
    CC_CURRENCIES.forEach(ccInfo => {
      const cell = detailEl.querySelector(`#detail-low-${appId}-${ccInfo.cc}`);
      if (cell) cell.textContent = 'N/A';
    });
  }
}

/** HTML 转义 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== 价格走势图 =====

/** 格式化 Unix 时间戳 → YYYY-MM-DD */
function formatDate(ts) {
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 保存价格快照到 localStorage */
function savePriceSnapshot(appId, currentPrice, retailPrice) {
  if (!currentPrice) return;
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    const all = raw ? JSON.parse(raw) : [];
    all.push({
      appId: String(appId),
      ts: Date.now(),
      price: currentPrice,
      retail: retailPrice || null,
    });
    // 只保留每条最近的 30 条
    const filtered = [];
    const map = {};
    for (let i = all.length - 1; i >= 0; i--) {
      const key = all[i].appId;
      if (!map[key]) { map[key] = 0; }
      if (map[key] < 30) {
        filtered.unshift(all[i]);
        map[key]++;
      }
    }
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(filtered));
  } catch { /* localStorage 满或不可用，静默失败 */ }
}

/** 获取某游戏的价格历史（从 localStorage） */
function getPriceHistory(appId) {
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return all
      .filter(p => String(p.appId) === String(appId))
      .sort((a, b) => a.ts - b.ts);
  } catch { return []; }
}

/** 渲染价格对比条 + SVG 走势图 */
function renderPriceChart(appId, container, chartData, currencyCode, symbol) {
  const { retailUsd, currentUsd, lowestUsd, lowestDate } = chartData;
  const maxPrice = Math.max(retailUsd || currentUsd, currentUsd, lowestUsd);

  // 本地累积的历史数据
  const snapshots = getPriceHistory(appId);

  // 如果有当前价，保存快照
  if (currentUsd != null) {
    savePriceSnapshot(appId, currentUsd, retailUsd);
  }

  // — 价格对比条 —
  const bars = [
    { label: '原价', value: retailUsd, cls: 'original' },
    { label: '当前', value: currentUsd, cls: 'current' },
    { label: '史低', value: lowestUsd, cls: 'low' },
  ].filter(b => b.value != null && b.value > 0);

  let barsHtml = '<div class="price-bars">';
  for (const b of bars) {
    const pct = maxPrice > 0 ? (b.value / maxPrice * 100) : 0;
    const barValue = formatUsdToLocal(b.value, currencyCode);
    const display = barValue !== null ? `${symbol}${barValue}` : `$${b.value.toFixed(2)}`;
    const saved = b.label === '当前' && retailUsd ? ` <span class="saved">-${Math.round((1 - b.value / retailUsd) * 100)}%</span>` : '';
    barsHtml += `
      <div class="price-bar-item">
        <span class="price-bar-label">${b.label}</span>
        <span class="price-bar-track"><span class="price-bar-fill ${b.cls}" style="width:${Math.max(pct, 3)}%"></span></span>
        <span class="price-bar-value">${display}${saved}</span>
      </div>`;
  }
  barsHtml += '</div>';

  // — SVG 走势图（有累积数据且 >= 2 点） —
  let sparkHtml = '';
  if (snapshots.length >= 2) {
    sparkHtml = renderSvgSparkline(appId, snapshots, maxPrice);
  } else if (snapshots.length === 1 && lowestDate) {
    // 只有 1 个快照 + 史低日期 → 显示简化版：两个点
    const fakePoints = [
      { ts: lowestDate * 1000, price: lowestUsd },
      { ts: snapshots[0].ts, price: snapshots[0].price },
    ];
    sparkHtml = renderSvgSparkline(appId, fakePoints, maxPrice, true);
  }
  // 如果 snapshots.length === 0: 不显示走势图，只显示对比条

  // — 折叠开关（有走势图时） —
  let toggleHtml = '';
  if (sparkHtml) {
    toggleHtml = '<div class="price-chart-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\';this.textContent=this.nextElementSibling.style.display===\'none\'?\'📊 显示走势图\':\'📊 隐藏走势图\'">📊 显示走势图</div>';
  }

  container.innerHTML = barsHtml + toggleHtml + (sparkHtml ? `<div class="price-sparkline" style="display:none">${sparkHtml}</div>` : '');
}

/** 渲染 SVG 走势图 */
function renderSvgSparkline(appId, points, maxPrice, isSimple) {
  if (points.length < 2) return '';

  const minP = Math.min(...points.map(p => p.price)) * 0.95;
  const maxP = Math.max(maxPrice || Math.max(...points.map(p => p.price)) * 1.05, minP + 0.01);
  const range = maxP - minP;

  const W = 280, H = 45;
  const padL = 0, padR = 0, padT = 2, padB = 2;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const mapX = (i, n) => padL + (i / (n - 1)) * iw;
  const mapY = (v) => padT + ih - ((v - minP) / range) * ih;

  const n = points.length;
  const pts = points.map((p, i) => `${mapX(i, n).toFixed(1)},${mapY(p.price).toFixed(1)}`);
  const polyline = pts.join(' ');
  const area = `0,${H} ${pts.join(' ')} ${mapX(n - 1, n).toFixed(1)},${H}`;

  // 价格标签：第一个和最后一个
  const firstLabel = `$${points[0].price.toFixed(2)}`;
  const lastLabel = `$${points[points.length - 1].price.toFixed(2)}`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${appId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(130,87,229,0.3)"/>
        <stop offset="100%" stop-color="rgba(130,87,229,0.02)"/>
      </linearGradient>
    </defs>
    <polygon points="${area}" fill="url(#grad-${appId})"/>
    <polyline points="${polyline}" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- 起点 -->
    <circle cx="${mapX(0, n).toFixed(1)}" cy="${mapY(points[0].price).toFixed(1)}" r="2" fill="#a78bfa"/>
    <!-- 终点 -->
    <circle cx="${mapX(n - 1, n).toFixed(1)}" cy="${mapY(points[points.length - 1].price).toFixed(1)}" r="2.5" fill="#fbbf24"/>
    <!-- 史低点（如果存在且有史低日期） -->
    ${!isSimple ? `<circle cx="${mapX(n - 1, n).toFixed(1)}" cy="${mapY(Math.min(...points.map(p => p.price))).toFixed(1)}" r="2" fill="#fbbf24" opacity="0.7"/>` : ''}
  </svg>`;
}

// ===== 事件绑定 =====

/** 通用自定义下拉框：点击外部关闭 */
document.addEventListener('click', (e) => {
  const openSelect = document.querySelector('.custom-select.open');
  if (!openSelect) return;
  if (!openSelect.contains(e.target)) {
    openSelect.classList.remove('open');
  }
});

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
    if (state.view === 'featured') {
      loadFeatured(cc);
    } else {
      const cards = resultsEl.querySelectorAll('.game-card');
      for (const card of cards) {
        const appId = card.dataset.appid;
        loadPriceForCard(appId, card, cc);
      }
    }
  });
}

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
    if (state.view === 'featured') {
      loadFeatured(state.cc);
    } else if (state.view === 'search_tab' && state.activeTabId) {
      const activeTab = state.searchTabs.find(t => t.id === state.activeTabId);
      if (activeTab && activeTab.results) {
        // 重新搜索当前激活标签
        doSearch(activeTab.query, true);
      }
    }
  });
}

/** 搜索事件 */
function setupSearch() {
  const triggerSearch = () => doSearch();
  searchBtn.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });
}

// ===== 初始化 =====
async function init() {
  setupCurrencySelect();
  setupLangSelect();
  setupSearch();
  setupFeaturedTabs();
  await loadFeatured();
  searchInput.focus();
}

// 页面加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
