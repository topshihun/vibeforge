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

// ===== 状态管理 =====
const state = {
  view: 'featured',       // 'featured' | 'search'
  cc: 'cn',
  featured: {
    data: null,           // 原始 API 数据
    tab: 'top_sellers',   // 'top_sellers' | 'specials'
    loading: false,
    error: null,
  },
  search: {
    results: [],
    query: '',
    loading: false,
    error: null,
  },
  exchangeRates: null,    // USD → * 汇率缓存
};

// ===== DOM 引用 =====
const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const currencyTags = $('currencyTags');
const resultsEl = $('results');
const loadingEl = $('loading');
const errorCard = $('errorCard');
const errorMsg = $('errorMsg');
const featuredTabsEl = $('featuredTabs');

// ===== 工具函数 =====

/** CORS 代理包装（Steam/CheapShark API 不支持浏览器跨域请求） */
const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => url, // 最后的兜底：直接请求
];
let proxyIndex = 0;

async function proxyFetch(url, options = {}) {
  const proxiedUrl = CORS_PROXIES[proxyIndex](url);
  try {
    const res = await fetch(proxiedUrl, {
      ...options,
      headers: { 'Accept': 'application/json', ...options.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (proxyIndex < CORS_PROXIES.length - 1) {
      proxyIndex++;
      return proxyFetch(url, options);
    }
    throw err;
  }
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

/** Steam Store 搜索 */
async function searchSteamGames(query) {
  const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&cc=us&l=en`;
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`Steam 搜索失败 (${res.status})`);
  const data = await res.json();
  return data.items || [];
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

/** CheapShark — 获取史低价格（返回 USD） */
async function getCheapestPrice(steamAppId) {
  const url = `https://www.cheapshark.com/api/1.0/games?steamAppID=${steamAppId}`;
  const res = await proxyFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const cheapest = parseFloat(data[0].cheapest);
  return isNaN(cheapest) ? null : cheapest;
}

/** 获取 USD 对其他货币的汇率 */
async function fetchExchangeRates() {
  if (state.exchangeRates) return state.exchangeRates; // 缓存
  try {
    const url = 'https://open.er-api.com/v6/latest/USD';
    const res = await proxyFetch(url);
    if (!res.ok) throw new Error(`汇率接口失败 (${res.status})`);
    const data = await res.json();
    state.exchangeRates = data.rates || {};
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
async function fetchFeatured(cc) {
  const url = `https://store.steampowered.com/api/featuredcategories?cc=${cc}&l=en`;
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

/** 加载推荐游戏（异步，独立状态管理） */
async function loadFeatured(cc) {
  cc = cc || state.cc;
  state.view = 'featured';
  featuredTabsEl.style.display = 'flex';
  hideError();

  // 设置独立 loading 状态
  state.featured.loading = true;
  state.featured.error = null;
  renderInlineLoading(resultsEl);

  try {
    // 并行获取：推荐数据 + 汇率
    const [featuredData] = await Promise.all([
      fetchFeatured(cc),
      fetchExchangeRates(),
    ]);

    // 视图守卫：如果用户中途切换到了搜索，放弃渲染
    if (state.view !== 'featured') return;

    state.featured.data = featuredData;
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
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">📭</div>
        <div class="text">暂无数据</div>
      </div>`;
    return;
  }

  const rawItems = data[category].items || [];
  if (rawItems.length === 0) {
    resultsEl.innerHTML = `
      <div class="no-results">
        <div class="icon">📭</div>
        <div class="text">该分类暂无游戏</div>
      </div>`;
    return;
  }

  const items = rawItems.slice(0, 20);
  const normalized = items.map(normalizeFeaturedItem);
  state.search.results = normalized; // 共享给搜索缓存（用于货币切换）
  renderResults(normalized);
}

/** 设置推荐游戏标签页切换（纯本地渲染，无网络请求） */
function setupFeaturedTabs() {
  featuredTabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.featured-tab');
    if (!tab) return;

    const category = tab.dataset.category;
    if (category === state.featured.tab) return;

    featuredTabsEl.querySelectorAll('.featured-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.featured.tab = category;
    state.view = 'featured';

    // 从缓存渲染，不请求网络
    renderFeatured(category);
  });
}

// ===== 搜索逻辑（异步，独立状态管理） =====

/** 搜索并展示结果 */
async function doSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showError('请输入游戏名称');
    return;
  }

  hideError();
  featuredTabsEl.style.display = 'none';
  state.view = 'search';

  // 设置独立 loading 状态
  state.search.loading = true;
  state.search.error = null;
  state.search.query = query;
  renderInlineLoading(resultsEl);

  try {
    const [items] = await Promise.all([
      searchSteamGames(query),
      fetchExchangeRates(),
    ]);

    if (items.length === 0) {
      state.search.loading = false;
      state.search.results = [];
        resultsEl.innerHTML = `
          <div class="no-results">
            <div class="icon">🔍</div>
            <div class="text">没有找到 "${escapeHtml(query)}" 相关游戏<br><span style="color:#444;font-size:0.85em;">请尝试使用英文名称搜索</span></div>
          </div>`;
        return;
      }

      // 视图守卫：如果用户中途切换到了推荐，放弃渲染
      if (state.view !== 'search') return;

      state.search.results = items;
    state.search.loading = false;
    renderResults(items);
  } catch (err) {
    state.search.loading = false;
    state.search.error = err.message;
    renderInlineError(resultsEl, `搜索失败：${escapeHtml(err.message)}`);
  }
}

/** 渲染搜索结果列表（通用，featured 和 search 共用） */
function renderResults(items) {
  resultsEl.innerHTML = '';
  const displayItems = items.slice(0, 20);

  for (const item of displayItems) {
    const card = createGameCard(item);
    resultsEl.appendChild(card);
  }

  if (items.length > 20) {
    const more = document.createElement('div');
    more.className = 'no-results';
    more.style.padding = '16px';
    more.innerHTML = `<div class="text" style="color:#666;">...还有 ${items.length - 20} 个结果未显示</div>`;
    resultsEl.appendChild(more);
  }
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

  card.innerHTML = `
    <div class="game-card-header">
      <img class="game-thumb" src="${thumbSrc}" alt="${escapeHtml(name)}" loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 231 87%22><rect fill=%22%231a1a2e%22 width=%22231%22 height=%2287%22/><text x=%22115%22 y=%2248%22 text-anchor=%22middle%22 fill=%22%23444%22 font-size=%2220%22>🎮</text></svg>'">
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
    if (e.target.closest('.expand-btn') || e.target.closest('.currency-tag')) return;
    card.classList.toggle('expanded');
    if (card.classList.contains('expanded') && !card.dataset.detailLoaded) {
      loadDetailPrices(id, card);
    }
  });

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

/** 史低价格查询（使用对应货币显示） */
async function loadHistoryLow(appId, card) {
  const historyEl = card.querySelector(`#history-${appId}`);
  if (!historyEl) return;

  try {
    const cheapestUsd = await getCheapestPrice(appId);
    if (cheapestUsd === null) {
      historyEl.innerHTML = ``;
      return;
    }

    const ccInfo = CC_CURRENCIES.find(c => c.cc === state.cc);
    const currencyCode = ccInfo?.code || 'USD';
    const symbol = getCurrencySymbol(currencyCode);

    // 如果汇率已加载，显示本地货币史低
    const localPrice = formatUsdToLocal(cheapestUsd, currencyCode);
    if (localPrice !== null) {
      historyEl.innerHTML = `
        <span class="historical-low">
          <span class="label">📉 史低:</span>
          <span class="lowest-ever">${symbol}${localPrice}</span>
        </span>`;
    } else {
      // 降级为 USD
      historyEl.innerHTML = `
        <span class="historical-low">
          <span class="label">📉 史低 (USD):</span>
          <span class="lowest-ever">$${cheapestUsd.toFixed(2)}</span>
        </span>`;
    }
  } catch {
    historyEl.innerHTML = ``;
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
    const cheapestUsd = await getCheapestPrice(appId);
    if (cheapestUsd === null) {
      CC_CURRENCIES.forEach(ccInfo => {
        const cell = detailEl.querySelector(`#detail-low-${appId}-${ccInfo.cc}`);
        if (cell) cell.textContent = 'N/A';
      });
      return;
    }

    // 为每个币种显示换算后的史低
    CC_CURRENCIES.forEach(ccInfo => {
      const cell = detailEl.querySelector(`#detail-low-${appId}-${ccInfo.cc}`);
      if (!cell) return;

      const localPrice = formatUsdToLocal(cheapestUsd, ccInfo.code);
      if (localPrice !== null) {
        const symbol = getCurrencySymbol(ccInfo.code);
        cell.innerHTML = `<span style="color:#fbbf24;font-weight:600;">${symbol}${localPrice}</span>`;
        cell.className = 'curr-low';
      } else {
        cell.innerHTML = `<span style="color:#fbbf24;font-weight:600;">$${cheapestUsd.toFixed(2)}</span>`;
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

// ===== 事件绑定 =====

/** 切换货币标签 */
function setupCurrencyTags() {
  currencyTags.addEventListener('click', (e) => {
    const tag = e.target.closest('.currency-tag');
    if (!tag) return;

    const cc = tag.dataset.cc;
    if (cc === state.cc) return;

    // 更新激活状态
    currencyTags.querySelectorAll('.currency-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    state.cc = cc;

    if (state.view === 'featured') {
      // 重新拉取推荐数据（含新币种价格）
      loadFeatured(cc);
    } else {
      // 搜索模式：重新加载所有卡片的价格
      const cards = resultsEl.querySelectorAll('.game-card');
      for (const card of cards) {
        const appId = card.dataset.appid;
        loadPriceForCard(appId, card, cc);
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
  setupCurrencyTags();
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
