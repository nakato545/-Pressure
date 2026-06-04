// ── セキュリティ: 位置情報API を完全無効化 ──
try {
  Object.defineProperty(navigator, 'geolocation', { get: () => undefined, configurable: false });
} catch (_) {}

// ── 定数 ──
const GEMINI_API_KEY = 'ここにキーを貼る'; // https://aistudio.google.com/apikey で取得

const LOCATIONS = {
  kagurazaka: { lat: 35.7021, lon: 139.7404, name: '神楽坂' },
  chiba:       { lat: 35.6074, lon: 140.1065, name: '千葉市' },
};

const EMOJI_MAP = { safe: '😊', warn: '😐', alert: '😟', danger: '😵' };

// ── 危険度判定 ──
function getLevel(hpa, diff3h) {
  if (hpa < 998 || diff3h < -6) return 'danger';
  if (hpa < 1002 || diff3h < -4) return 'alert';
  if (hpa < 1008 || diff3h < -2) return 'warn';
  return 'safe';
}

function getLevelLabel(level) {
  return { safe: '低', warn: '注意', alert: '警戒', danger: '危険' }[level];
}

function getEmoji(hpa, prev) {
  const diff = prev !== undefined ? hpa - prev : 0;
  return EMOJI_MAP[getLevel(hpa, diff * 3)];
}

function getColor(emoji) {
  return { '😊': '#3dd68c', '😐': '#f5c542', '😟': '#ff8c42', '😵': '#ff4d6d' }[emoji] || '#7b6cff';
}

// ── 天気コード→絵文字 ──
function weatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫';
  if (code <= 59) return '🌦';
  if (code <= 69) return '🌧';
  if (code <= 79) return '🌨';
  if (code <= 84) return '🌦';
  if (code <= 94) return '⛈';
  return '🌩';
}

// ── 挨拶 ──
function updateGreeting() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const birthday = '07-03';

  const pad = n => String(n).padStart(2, '0');
  const today = `${pad(m)}-${pad(d)}`;

  const SPECIAL_DAYS = {
    '01-01': 'あけましておめでとう',
    '02-03': '鬼は外！',
    '07-07': '願いが叶うといいね',
    '08-13': 'お盆！',
    '08-14': 'お盆！！',
    '08-15': 'お盆！！！',
    '10-31': 'ハッピーハロウィン！',
    '12-24': 'メリークリスマスイブ',
    '12-25': 'メリークリスマス！',
    '12-31': '良いお年を',
  };

  let greet;
  if (birthday === today) {
    greet = 'お誕生日おめでとう';
  } else if (SPECIAL_DAYS[today]) {
    greet = SPECIAL_DAYS[today];
  } else {
    greet = h < 5 || h >= 21 ? 'おやすみ' : h < 11 ? 'おはよう' : h < 17 ? 'こんにちは' : 'こんばんは';
  }

  document.getElementById('greeting').textContent = greet;
}

// ── 応援アニメーション ──
const CHEER_PATTERNS = {
  morning: [
    { icon: '🌸', emojis: ['🌸','🌸','☀️','🌸','🌸','✨','🌸','🌸'], msg: '今日もいい日になりますように！' },
    { icon: '☀️', emojis: ['☀️','✨','🌟','☀️','✨','🌟','☀️','✨'], msg: '一日頑張ろう！' },
    { icon: '🐦', emojis: ['🐦','🐦','🌿','🐦','💙','🐦','🌿','🐦'], msg: 'おはようさん！' },
  ],
  afternoon: [
    { icon: '🌈', emojis: ['⭐','🌈','⭐','🌈','⭐','🌈','⭐','🌈'], msg: 'お昼だよ！' },
    { icon: '⚡', emojis: ['⚡','🔥','⚡','💪','⚡','🔥','⚡','💪'], msg: 'ひといき！' },
    { icon: '🍀', emojis: ['🍀','🍀','💚','🍀','🍀','💚','🍀','🍀'], msg: 'がんばれー！' },
  ],
  evening: [
    { icon: '🌙', emojis: ['⭐','🌙','✨','⭐','🌙','✨','⭐','🌙'], msg: 'おつかれさま！' },
    { icon: '🌟', emojis: ['🌟','💫','🌟','⭐','🌟','💫','🌟','⭐'], msg: 'よるだよ！' },
    { icon: '🎵', emojis: ['🎵','🎶','🎵','🎶','🎵','🎶','🎵','🎶'], msg: 'やすもう！' },
  ],
  night: [
    { icon: '💤', emojis: ['💤','🌙','💤','⭐','💤','🌙','💤','⭐'], msg: 'おやすみなさい…' },
    { icon: '🌙', emojis: ['🌙','✨','🌙','⭐','🌙','✨','🌙','⭐'], msg: '睡眠だいじ…' },
    { icon: '✨', emojis: ['✨','💫','✨','⭐','✨','💫','✨','💫'], msg: 'Zzz...' },
  ],
};

let cheerActive = false;

function playCheer() {
  if (cheerActive) return;
  cheerActive = true;

  const h = new Date().getHours();
  const period = h >= 5 && h < 11 ? 'morning'
               : h >= 11 && h < 17 ? 'afternoon'
               : h >= 17 && h < 21 ? 'evening' : 'night';
  const pool = CHEER_PATTERNS[period];
  const pat = pool[Math.floor(Math.random() * pool.length)];

  // オーバーレイ
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;pointer-events:none;display:flex;align-items:center;justify-content:center;';

  // センターカード
  const card = document.createElement('div');
  card.style.cssText = 'background:var(--surface);border:0.5px solid var(--border2);border-radius:22px;padding:32px 40px;text-align:center;opacity:0;transform:scale(0.78) translateY(16px);transition:opacity 0.32s ease,transform 0.32s ease;box-shadow:0 8px 40px rgba(0,0,0,0.5);';

  const iconEl = document.createElement('div');
  iconEl.textContent = pat.icon;
  iconEl.style.cssText = 'font-size:60px;line-height:1;margin-bottom:14px;animation:cheerBounce 0.6s ease 0.1s both;';

  const msgEl = document.createElement('div');
  msgEl.textContent = pat.msg;
  msgEl.style.cssText = 'font-size:17px;font-weight:600;color:var(--text);line-height:1.6;white-space:nowrap;';

  card.appendChild(iconEl);
  card.appendChild(msgEl);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // bounceキーフレームを一度だけ注入
  if (!document.getElementById('cheer-style')) {
    const s = document.createElement('style');
    s.id = 'cheer-style';
    s.textContent = '@keyframes cheerBounce{0%{transform:scale(0)}50%{transform:scale(1.25)}75%{transform:scale(0.9)}100%{transform:scale(1)}}';
    document.head.appendChild(s);
  }

  // カードイン
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'scale(1) translateY(0)';
  }));

  // パーティクル（画面中央から放射）
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  pat.emojis.forEach((em, i) => {
    const p = document.createElement('div');
    p.textContent = em;
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-size:24px;pointer-events:none;z-index:501;opacity:0;will-change:transform,opacity;`;
    document.body.appendChild(p);

    const angle = (i / pat.emojis.length) * Math.PI * 2 - Math.PI / 2;
    const r = 100 + Math.random() * 60;
    const tx = Math.cos(angle) * r;
    const ty = Math.sin(angle) * r;
    const DUR = 2300;
    let t0 = null;
    const delay = i * 55;

    (function tick(ts) {
      if (!t0) t0 = ts + delay;
      const el = ts - t0;
      if (el < 0) { requestAnimationFrame(tick); return; }
      const t = Math.min(el / DUR, 1);
      const arc = Math.sin(t * Math.PI);
      const sc = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) * 0.35;
      const op = t < 0.1 ? t / 0.1 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
      p.style.opacity = Math.max(0, op);
      p.style.transform = `translate(calc(-50% + ${tx * arc}px), calc(-50% + ${ty * arc}px)) scale(${Math.max(0, sc)})`;
      if (t < 1) requestAnimationFrame(tick); else p.remove();
    })(performance.now());
  });

  // 3秒後フェードアウト
  setTimeout(() => {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.92) translateY(-10px)';
    setTimeout(() => { overlay.remove(); cheerActive = false; }, 350);
  }, 2700);
}

// ── Open-Meteo API 取得 ──
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=surface_pressure,temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,precipitation,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

// ── 状態 ──
let chart = null;
let hourlyPressure = [];
let hourlyEmojis = [];
let cachedData = {};
let currentLoc = 'k';
let currentView = 'default';
let graphStartHour = 0;
let locDropdownOpen = false;
let registeredCity = (() => { try { return JSON.parse(localStorage.getItem('registeredCity') || 'null'); } catch { return null; } })();
let registeredData = null;
let previewCity = null;
let previewData = null;
let previewChart = null;
let leafletMap = null;
let mapMarker = null;

// ── 場所ドロップダウン ──
function openLocDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('loc-dropdown');
  const header = document.querySelector('.header');
  dropdown.style.top = (header.getBoundingClientRect().bottom + 4) + 'px';
  const regOpt = document.getElementById('loc-opt-reg');
  regOpt.textContent = registeredCity ? registeredCity.name : '登録地なし';
  regOpt.disabled = !registeredCity;
  document.getElementById('loc-opt-default').classList.toggle('active', currentView === 'default');
  regOpt.classList.toggle('active', currentView === 'reg');
  dropdown.classList.add('open');
  locDropdownOpen = true;
}

function closeLocDropdown() {
  document.getElementById('loc-dropdown').classList.remove('open');
  locDropdownOpen = false;
}

// ── ビュー切り替え（デフォルト ↔ 登録地点） ──
function switchView(v) {
  if (v === 'reg' && !registeredCity) return;
  currentView = v;

  const defaultOnly = document.querySelectorAll('[data-default-only]');
  const h = new Date().getHours();

  if (v === 'default') {
    document.getElementById('header-loc').textContent = '神楽坂 ⚡ 千葉市';
    defaultOnly.forEach(el => el.style.display = '');
    document.getElementById('wloc-k-name').textContent = '神楽坂';
    document.getElementById('hourly-label-k').textContent = '神楽坂　時間別';
    document.getElementById('wloc-k').onclick = () => openWeekly('神楽坂');
    const src = cachedData[currentLoc] || cachedData['k'];
    if (src) { applyPressureData(src, h); applyWeatherData(src, 'k', h); }
    if (cachedData['c']) applyWeatherData(cachedData['c'], 'c', h);
  } else {
    document.getElementById('header-loc').textContent = registeredCity.name;
    defaultOnly.forEach(el => el.style.display = 'none');
    document.getElementById('wloc-k-name').textContent = registeredCity.name;
    document.getElementById('hourly-label-k').textContent = `${registeredCity.name}　時間別`;
    document.getElementById('wloc-k').onclick = () => openWeekly(registeredCity.name);
    if (registeredData) {
      applyPressureData(registeredData, h);
      applyWeatherData(registeredData, 'k', h, registeredCity.name);
    }
  }
}

// ── 地点登録 ──
function registerCity(city, data) {
  registeredCity = city;
  registeredData = data;
  localStorage.setItem('registeredCity', JSON.stringify(city));
  const nameEl = document.getElementById('notif-loc-reg-name');
  if (nameEl) nameEl.textContent = city.name;
  const regCheck = document.getElementById('notif-loc-reg');
  if (regCheck) { regCheck.disabled = false; document.getElementById('notif-loc-reg-label').classList.remove('disabled'); }
}

async function loadRegisteredCity() {
  if (!registeredCity) return;
  try {
    registeredData = await fetchWeather(registeredCity.lat, registeredCity.lon);
  } catch (e) { console.error(e); }
}

// ── 地図 ──
function initMap() {
  if (leafletMap) return;
  leafletMap = L.map('search-map', { zoomControl: true, attributionControl: false })
    .setView([35.68, 139.76], 10);
  L.tileLayer('https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(leafletMap);
  leafletMap.on('click', onMapClick);
}

async function onMapClick(e) {
  const { lat, lng } = e.latlng;
  const hint = document.querySelector('.map-hint');
  if (!hint || hint.textContent === '取得中...') return;

  if (mapMarker) {
    mapMarker.setLatLng([lat, lng]);
  } else {
    mapMarker = L.circleMarker([lat, lng], {
      radius: 8, fillColor: '#a89dff', color: '#fff',
      weight: 2, opacity: 1, fillOpacity: 0.9,
    }).addTo(leafletMap);
  }

  hint.textContent = '取得中...';
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'ja' } }
    );
    const place = await res.json();
    const addr = place.address || {};
    const name = addr.city || addr.town || addr.village || addr.suburb
               || addr.county || addr.state
               || place.display_name.split(',')[0].trim();
    const country = addr.country || '';
    const admin1 = addr.state || addr.county || '';
    hint.textContent = 'タップで場所を選択';
    showPreview({ id: `map-${lat.toFixed(4)}-${lng.toFixed(4)}`, name, country, admin1, latitude: lat, longitude: lng });
  } catch (_) {
    hint.textContent = 'タップで場所を選択';
  }
}

function switchSearchTab(tab) {
  document.getElementById('stab-text').classList.toggle('active', tab === 'text');
  document.getElementById('stab-map').classList.toggle('active', tab === 'map');
  document.getElementById('pane-text').classList.toggle('active', tab === 'text');
  document.getElementById('pane-map').classList.toggle('active', tab === 'map');
  if (tab === 'map') {
    setTimeout(() => {
      initMap();
      if (leafletMap) leafletMap.invalidateSize();
    }, 100);
  }
}

// ── プレビュー ──
async function showPreview(city) {
  previewCity = { id: city.id, name: city.name, country: city.country || '', lat: city.latitude, lon: city.longitude };
  document.getElementById('preview-city-name').textContent = city.name;
  document.getElementById('preview-city-sub').textContent = [city.admin1, city.country].filter(Boolean).join('・');
  document.getElementById('preview-hpa').textContent = '--';
  document.getElementById('preview-badge').textContent = '';
  document.getElementById('preview-weather-row').style.visibility = 'hidden';
  document.getElementById('preview-loading').style.display = 'block';
  document.getElementById('preview-hourly-section').style.display = 'none';
  document.getElementById('hourly-preview').innerHTML = '';
  document.getElementById('preview-graph-emoji-row').innerHTML = '';
  document.getElementById('preview-graph-times').innerHTML = '';
  document.getElementById('preview-danger-hours').textContent = '';
  document.getElementById('preview-graph-time-bar').style.background = '';
  if (previewChart) { previewChart.destroy(); previewChart = null; }
  document.getElementById('city-preview').classList.add('open');

  try {
    previewData = await fetchWeather(city.latitude, city.longitude);
    const h = new Date().getHours();
    const hourly = previewData.hourly;
    const pressures = hourly.surface_pressure;
    const cur = pressures[h];
    const prev3 = pressures[Math.max(0, h - 3)];
    const level = getLevel(cur, Math.round((cur - prev3) * 10) / 10);

    document.getElementById('preview-hpa').textContent = Math.round(cur);
    const badge = document.getElementById('preview-badge');
    badge.textContent = `${EMOJI_MAP[level]} ${getLevelLabel(level)}`;
    badge.className = `badge badge-${level}`;

    const temp = Math.round(hourly.temperature_2m[h]);
    const precipProb = Math.round(hourly.precipitation_probability?.[h] ?? 0);
    document.getElementById('preview-weather-emoji').textContent = weatherEmoji(hourly.weathercode[h]);
    document.getElementById('preview-temp').textContent = `${temp}°`;
    document.getElementById('preview-precip').textContent = `☂ ${precipProb}%`;
    document.getElementById('preview-loading').style.display = 'none';
    document.getElementById('preview-weather-row').style.visibility = '';

    buildPreviewGraph(pressures, h);

    const hourlyArr = Array.from({ length: 24 }, (_, i) => ({
      emoji: weatherEmoji(hourly.weathercode[h + i]),
      temp: hourly.temperature_2m[h + i],
      precipProb: Math.round(hourly.precipitation_probability?.[h + i] ?? 0),
      hour: (h + i) % 24,
    }));
    buildHourly(hourlyArr, 'hourly-preview');
    const pBar = document.getElementById('hourly-time-bar-preview');
    if (pBar) {
      const stops = Array.from({ length: 25 }, (_, i) =>
        `${hourToTimeColor(h + i)} ${(i / 24 * 100).toFixed(1)}%`
      );
      pBar.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
    }
    document.getElementById('preview-hourly-section').style.display = 'block';
  } catch (e) {
    document.getElementById('preview-loading').style.display = 'none';
    document.getElementById('preview-hpa').textContent = '取得失敗';
    document.getElementById('preview-weather-row').style.visibility = '';
  }
}

function closePreview() {
  document.getElementById('city-preview').classList.remove('open');
  if (previewChart) { previewChart.destroy(); previewChart = null; }
  previewCity = null;
  previewData = null;
}

function registerCurrentCity() {
  if (!previewCity || !previewData) return;
  registerCity(previewCity, previewData);
  closePreview();
  clearSearch();
  navHome();
  switchView('reg');
}

// ── 危険時間帯ラベル ──
function updateDangerHoursLabel(startHour) {
  const el = document.getElementById('danger-hours');
  const periods = [];
  let start = -1;
  for (let i = 0; i <= hourlyEmojis.length; i++) {
    const bad = i < hourlyEmojis.length && (hourlyEmojis[i] === '😟' || hourlyEmojis[i] === '😵');
    if (bad && start < 0) { start = i; }
    else if (!bad && start >= 0) { periods.push([start, i - 1]); start = -1; }
  }
  if (periods.length === 0) { el.textContent = ''; return; }
  const labels = periods.map(([s, e]) => {
    const sh = (startHour + s) % 24;
    const eh = (startHour + e + 1) % 24;
    return `${sh}〜${eh}時`;
  });
  el.innerHTML = `<div class="danger-hours-text">⚠ 気圧注意 ${labels.join('　')}</div>`;
}

// ── 時刻→グラデーション色 ──
function hourToTimeColor(h) {
  const hr = ((h % 24) + 24) % 24;
  if (hr >= 22 || hr < 4)  return 'rgba(8,8,24,0.95)';
  if (hr < 6)              return 'rgba(30,45,110,0.80)';
  if (hr < 8)              return 'rgba(60,110,190,0.65)';
  if (hr < 11)             return 'rgba(90,170,230,0.50)';
  if (hr < 15)             return 'rgba(130,200,255,0.38)';
  if (hr < 17)             return 'rgba(230,160,60,0.48)';
  if (hr < 19)             return 'rgba(210,70,30,0.55)';
  if (hr < 21)             return 'rgba(90,20,70,0.70)';
  return 'rgba(20,10,40,0.85)';
}

// ── グラフ描画 ──
function buildGraph(pressures, startHour) {
  graphStartHour = startHour;
  hourlyPressure = pressures.slice(startHour, startHour + 25);
  hourlyEmojis = hourlyPressure.map((v, i) => getEmoji(v, i > 0 ? hourlyPressure[i - 1] : undefined));

  const canvas = document.getElementById('pressure-chart');

  const emojiRow = document.getElementById('graph-emoji-row');
  emojiRow.innerHTML = '';
  [0, 3, 6, 9, 12, 15, 18, 21].forEach(i => {
    const slot = document.createElement('span');
    slot.className = 'emoji-slot';
    slot.textContent = hourlyEmojis[i];
    slot.style.left = `${(i + 0.5) / 24 * 100}%`;
    emojiRow.appendChild(slot);
  });

  const pointColors = hourlyPressure.map((v, i) => getColor(hourlyEmojis[i]));

  document.getElementById('graph-times').innerHTML = [0, 6, 12, 18, 24].map(offset =>
    `<span class="graph-time-label">${(startHour + offset) % 24}時</span>`
  ).join('');

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array.from({ length: 25 }, (_, i) => `${(startHour + i) % 24}時`),
      datasets: [{
        data: hourlyPressure,
        borderColor: '#7b6cff',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        tension: 0.4,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false, min: Math.min(...hourlyPressure) - 2, max: Math.max(...hourlyPressure) + 2 },
      },
      onClick: (e, elements) => {
        const pts = chart.getElementsAtEventForMode(e, 'nearest', { axis: 'x', intersect: false }, true);
        if (pts.length) openDetail(pts[0].index);
      },
    },
    plugins: [
      {
        id: 'dangerBg',
        beforeDraw(ch) {
          const { ctx, chartArea: { top, bottom }, scales: { x } } = ch;
          hourlyEmojis.forEach((emoji, i) => {
            const color = emoji === '😵' ? 'rgba(255,77,109,0.20)' :
                          emoji === '😟' ? 'rgba(255,77,109,0.10)' : null;
            if (!color) return;
            const x1 = x.getPixelForValue(i);
            const x2 = x.getPixelForValue(i + 1);
            ctx.save();
            ctx.fillStyle = color;
            ctx.fillRect(x1, top, x2 - x1, bottom - top);
            ctx.restore();
          });
        }
      },
      {
        id: 'nowLine',
        afterDraw(ch) {
          const meta = ch.getDatasetMeta(0);
          if (!meta.data.length) return;
          const { ctx, chartArea: { top, bottom } } = ch;
          const xPos = meta.data[0].x;
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = '#a89dff';
          ctx.lineWidth = 2;
          ctx.moveTo(xPos, top);
          ctx.lineTo(xPos, bottom);
          ctx.stroke();
          ctx.restore();
        }
      }
    ],
  });

  updateDangerHoursLabel(startHour);

  const stops = Array.from({ length: 25 }, (_, i) =>
    `${hourToTimeColor(startHour + i)} ${(i / 24 * 100).toFixed(1)}%`
  );
  document.getElementById('graph-time-bar').style.background =
    `linear-gradient(to right, ${stops.join(', ')})`;
}

// ── AIアドバイス（Gemini・1日1回） ──
async function getDailyAdvice(level, cur, diff3, weatherCode, temp) {
  const todayStr = new Date().toISOString().slice(0, 10);

  if (localStorage.getItem('aiAdviceDate') === todayStr) {
    document.getElementById('ai-text').textContent =
      localStorage.getItem('aiAdviceText') || '';
    return;
  }

  document.getElementById('ai-text').textContent = '生成中...';

  const riskLabel = { safe: '低い', warn: 'やや高め', alert: '高め', danger: '非常に高い' }[level];
  const diffStr = diff3 > 0 ? `+${diff3}hPa上昇` : diff3 < -3 ? `${diff3}hPa急落` : `${diff3}hPa低下`;
  const weatherDesc = weatherCode <= 1 ? '晴れ' : weatherCode <= 3 ? '曇り' : weatherCode <= 67 ? '雨' : '荒天';
  const special = getTodaySpecial();

  const prompt = `以下の情報をもとに、5行のメッセージを日本語で生成してください。

【気象情報】
・天気: ${weatherDesc}、気温 ${Math.round(temp)}°C
・気圧: ${Math.round(cur)} hPa（3時間で${diffStr}）
・頭痛リスク: ${riskLabel}

【今日は何の日】
・${special || 'とくになし'}

【出力ルール】
・1行目: 天気と気温のひとこと
・2行目: 気圧と頭痛リスク
・3〜4行目: 今日は何の日に関連したほっこりコメント、ない日はほっこりネタ
・5行目: やさしい締めのひとこと
・全体で5行、押しつけがましくない口調`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'アドバイスを取得できませんでした。';
    localStorage.setItem('aiAdviceDate', todayStr);
    localStorage.setItem('aiAdviceText', text);
    document.getElementById('ai-text').textContent = text;
  } catch (_) {
    document.getElementById('ai-text').textContent = 'アドバイスの取得に失敗しました。';
  }
}

// ── プレビュー用グラフ描画 ──
function buildPreviewGraph(pressures, startHour) {
  const sliced = pressures.slice(startHour, startHour + 25);
  const emojis = sliced.map((v, i) => getEmoji(v, i > 0 ? sliced[i - 1] : undefined));
  const pointColors = sliced.map((v, i) => getColor(emojis[i]));

  const canvas = document.getElementById('preview-pressure-chart');

  const emojiRow = document.getElementById('preview-graph-emoji-row');
  emojiRow.innerHTML = '';
  [0, 3, 6, 9, 12, 15, 18, 21].forEach(i => {
    const slot = document.createElement('span');
    slot.className = 'emoji-slot';
    slot.textContent = emojis[i];
    slot.style.left = `${(i + 0.5) / 24 * 100}%`;
    emojiRow.appendChild(slot);
  });

  document.getElementById('preview-graph-times').innerHTML = [0, 6, 12, 18, 24].map(offset =>
    `<span class="graph-time-label">${(startHour + offset) % 24}時</span>`
  ).join('');

  if (previewChart) previewChart.destroy();
  previewChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array.from({ length: 25 }, (_, i) => `${(startHour + i) % 24}時`),
      datasets: [{
        data: sliced,
        borderColor: '#7b6cff',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        tension: 0.4,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false, min: Math.min(...sliced) - 2, max: Math.max(...sliced) + 2 },
      },
    },
    plugins: [
      {
        id: 'dangerBg',
        beforeDraw(ch) {
          const { ctx, chartArea: { top, bottom }, scales: { x } } = ch;
          emojis.forEach((emoji, i) => {
            const color = emoji === '😵' ? 'rgba(255,77,109,0.20)' :
                          emoji === '😟' ? 'rgba(255,77,109,0.10)' : null;
            if (!color) return;
            const x1 = x.getPixelForValue(i);
            const x2 = x.getPixelForValue(i + 1);
            ctx.save(); ctx.fillStyle = color;
            ctx.fillRect(x1, top, x2 - x1, bottom - top);
            ctx.restore();
          });
        }
      },
      {
        id: 'nowLine',
        afterDraw(ch) {
          const meta = ch.getDatasetMeta(0);
          if (!meta.data.length) return;
          const { ctx, chartArea: { top, bottom } } = ch;
          ctx.save(); ctx.beginPath();
          ctx.strokeStyle = '#a89dff'; ctx.lineWidth = 2;
          ctx.moveTo(meta.data[0].x, top);
          ctx.lineTo(meta.data[0].x, bottom);
          ctx.stroke(); ctx.restore();
        }
      }
    ],
  });

  const dangerEl = document.getElementById('preview-danger-hours');
  const periods = [];
  let ds = -1;
  for (let i = 0; i <= emojis.length; i++) {
    const bad = i < emojis.length && (emojis[i] === '😟' || emojis[i] === '😵');
    if (bad && ds < 0) { ds = i; }
    else if (!bad && ds >= 0) { periods.push([ds, i - 1]); ds = -1; }
  }
  dangerEl.innerHTML = periods.length === 0 ? '' :
    `<div class="danger-hours-text">⚠ 気圧注意 ${periods.map(([s, e]) =>
      `${(startHour + s) % 24}〜${(startHour + e + 1) % 24}時`).join('　')}</div>`;

  const stops = Array.from({ length: 25 }, (_, i) =>
    `${hourToTimeColor(startHour + i)} ${(i / 24 * 100).toFixed(1)}%`
  );
  document.getElementById('preview-graph-time-bar').style.background =
    `linear-gradient(to right, ${stops.join(', ')})`;
}

// ── 時間別天気スライド（現在時刻起点） ──
function buildHourly(data, elId) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  data.forEach((d, i) => {
    const col = document.createElement('div');
    col.className = 'h-col' + (i === 0 ? ' now' : '');
    col.innerHTML = `<span class="h-time">${d.hour}時</span><span class="h-emoji">${d.emoji}</span><span class="h-temp">${Math.round(d.temp)}°</span><span class="h-rain">${d.precipProb ?? 0}%</span>`;
    el.appendChild(col);
  });
}

// ── データ反映 ──
function applyPressureData(data, currentHour) {
  const pressures = data.hourly.surface_pressure;
  buildGraph(pressures, currentHour);

  const cur = pressures[currentHour];
  const prev3 = pressures[Math.max(0, currentHour - 3)];
  const diff3 = Math.round((cur - prev3) * 10) / 10;
  const level = getLevel(cur, diff3);
  const emoji = EMOJI_MAP[level];

  document.getElementById('pressure-val').textContent = Math.round(cur);
  document.getElementById('pressure-diff').textContent =
    diff3 > 0 ? `▲ +${diff3} hPa（3時間前比）` : `▼ ${diff3} hPa（3時間前比）`;
  document.getElementById('pressure-diff').style.color =
    diff3 > 0 ? 'var(--up, #60a5fa)' : 'var(--danger)';
  document.getElementById('pressure-emoji').textContent = emoji;

  const levelEl = document.getElementById('pressure-level');
  levelEl.textContent = getLevelLabel(level);
  levelEl.style.color = { safe: 'var(--safe)', warn: 'var(--warn)', alert: 'var(--alert)', danger: 'var(--danger)' }[level];

  const trend = (pressures[Math.min(currentHour + 3, pressures.length - 1)] ?? cur) - cur;
  document.getElementById('pressure-trend').textContent =
    trend < -2 ? 'このまま下がり続ける予測です' :
    trend > 2  ? '気圧は回復傾向にあります' :
    'しばらく同じ水準で推移する見込みです';

  getDailyAdvice(level, cur, diff3, data.hourly.weathercode[currentHour], data.hourly.temperature_2m[currentHour]);
}

function applyWeatherData(data, locKey, currentHour, nameOverride) {
  const h = data.hourly;
  const d = data.daily;

  const emoji = weatherEmoji(h.weathercode[currentHour]);
  const temp = Math.round(h.temperature_2m[currentHour]);
  const hum = Math.round(h.relativehumidity_2m[currentHour]);
  const wind = Math.round(h.windspeed_10m[currentHour] * 10) / 10;
  const precipProb = Math.round(h.precipitation_probability?.[currentHour] ?? 0);
  const precip = Math.round(h.precipitation[currentHour] * 10) / 10;

  document.getElementById(`w-${locKey}-emoji`).textContent = emoji;
  document.getElementById(`w-${locKey}-temp`).textContent = `${temp}°`;
  document.getElementById(`w-${locKey}-detail`).innerHTML =
    `降水確率 ${precipProb}%　${precip}mm<br>湿度 ${hum}%　風 ${wind}m/s`;

  const hourlyArr = Array.from({ length: 24 }, (_, i) => ({
    emoji: weatherEmoji(h.weathercode[currentHour + i]),
    temp: h.temperature_2m[currentHour + i],
    precipProb: Math.round(h.precipitation_probability?.[currentHour + i] ?? 0),
    hour: (currentHour + i) % 24,
  }));
  buildHourly(hourlyArr, `hourly-${locKey}`);

  const barEl = document.getElementById(`hourly-time-bar-${locKey}`);
  if (barEl) {
    const stops = Array.from({ length: 25 }, (_, i) =>
      `${hourToTimeColor(currentHour + i)} ${(i / 24 * 100).toFixed(1)}%`
    );
    barEl.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
  }

  window._weeklyData = window._weeklyData || {};
  const locName = nameOverride || (locKey === 'k' ? '神楽坂' : '千葉市');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  window._weeklyData[locName] = d.time.map((t, i) => {
    const date = new Date(t);
    return {
      day: dayNames[date.getDay()],
      icon: weatherEmoji(d.weathercode[i]),
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
    };
  });
}

// ── 週間天気レイヤー ──
function openWeekly(loc) {
  document.getElementById('weekly-title').textContent = `${loc}　週間天気`;
  const data = window._weeklyData?.[loc] || [];
  document.getElementById('weekly-content').innerHTML = data.map(d =>
    `<div class="weekly-row">
      <span class="wd-day">${d.day}</span>
      <span class="wd-icon">${d.icon}</span>
      <span class="wd-temp">${d.hi}° / <span class="wd-low">${d.lo}°</span></span>
    </div>`
  ).join('') || '<p style="color:var(--text3);font-size:13px;">データ取得中...</p>';
  openLayer('weekly-layer');
}

// ── グラフ詳細 ──
function openDetail(idx) {
  const h2 = Math.min(Math.max(idx, 0), 23);
  const hpa = Math.round(hourlyPressure[h2] * 10) / 10;
  const prev = h2 > 0 ? hourlyPressure[h2 - 1] : hpa;
  const diff = Math.round((hpa - prev) * 10) / 10;
  const emoji = hourlyEmojis[h2];
  const actualHour = (graphStartHour + h2) % 24;

  document.getElementById('d-emoji').textContent = emoji;
  document.getElementById('d-time-label').textContent = `${actualHour}時のデータ`;
  document.getElementById('d-hpa').textContent = `${hpa} hPa`;
  const diffEl = document.getElementById('d-diff');
  if (diff > 0.1) { diffEl.textContent = `▲ +${diff} hPa（前1時間比）`; diffEl.className = 'detail-diff up'; }
  else if (diff < -0.1) { diffEl.textContent = `▼ ${diff} hPa（前1時間比）`; diffEl.className = 'detail-diff down'; }
  else { diffEl.textContent = '変化なし'; diffEl.className = 'detail-diff flat'; }

  const rows = document.getElementById('detail-rows');
  rows.innerHTML = '';
  const start = Math.max(0, h2 - 2);
  const end = Math.min(hourlyPressure.length - 1, h2 + 5);
  for (let i = start; i <= end; i++) {
    const dv = i > 0 ? Math.round((hourlyPressure[i] - hourlyPressure[i - 1]) * 10) / 10 : 0;
    const cls = dv > 0.1 ? 'up' : dv < -0.1 ? 'down' : 'flat';
    const arrow = dv > 0.1 ? '▲ +' : dv < -0.1 ? '▼ ' : '→ ';
    const row = document.createElement('div');
    row.className = 'detail-row' + (i === h2 ? ' current' : '');
    row.innerHTML = `<span class="dr-time">${(graphStartHour + i) % 24}時</span><span class="dr-hpa">${Math.round(hourlyPressure[i] * 10) / 10} hPa</span><span class="dr-diff ${cls}">${arrow}${Math.abs(dv)} hPa</span><span class="dr-emoji">${hourlyEmojis[i]}</span>`;
    rows.appendChild(row);
  }
  openLayer('detail-layer');
}

// ── レイヤー開閉 ──
function openLayer(id) { document.getElementById(id).classList.add('open'); }
function closeLayer(id) { document.getElementById(id).classList.remove('open'); }

// ── 検索履歴（localStorage） ──
function getHistory() {
  try { return JSON.parse(localStorage.getItem('searchHistory') || '[]'); } catch { return []; }
}
function saveHistory(city) {
  const list = getHistory().filter(c => c.id !== city.id);
  list.unshift(city);
  localStorage.setItem('searchHistory', JSON.stringify(list.slice(0, 10)));
}
function deleteHistory(id) {
  const list = getHistory().filter(c => c.id !== id);
  localStorage.setItem('searchHistory', JSON.stringify(list));
  renderHistory();
}

function renderHistory() {
  const list = getHistory();
  const label = document.getElementById('history-label');
  const container = document.getElementById('search-history-list');
  container.innerHTML = '';
  if (list.length === 0) { label.style.display = 'none'; return; }
  label.style.display = 'block';
  list.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.idx = i;
    const icon = document.createElement('i');
    icon.className = 'ti ti-clock';
    const info = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.textContent = c.name;
    const subEl = document.createElement('div');
    subEl.className = 'search-result-sub';
    subEl.textContent = c.country;
    info.appendChild(nameEl);
    info.appendChild(subEl);
    const del = document.createElement('span');
    del.className = 'del-btn';
    del.textContent = '✕';
    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(del);
    item.addEventListener('click', () => selectCity(list[i]));
    del.addEventListener('click', e => { e.stopPropagation(); deleteHistory(list[i].id); });
    container.appendChild(item);
  });
}

// ── ジオコーディング検索 ──
let searchTimer = null;

async function searchCities(query) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=ja&format=json`
  );
  const data = await res.json();
  return data.results || [];
}

function renderResults(cities) {
  const el = document.getElementById('search-results');
  el.innerHTML = '';
  if (cities.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = '候補が見つかりませんでした';
    el.appendChild(empty);
    return;
  }
  cities.forEach((c, i) => {
    const sub = [c.admin1, c.country].filter(Boolean).join('・');
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.dataset.idx = i;
    const icon = document.createElement('i');
    icon.className = 'ti ti-map-pin';
    const info = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.textContent = c.name;
    const subEl = document.createElement('div');
    subEl.className = 'search-result-sub';
    subEl.textContent = sub;
    info.appendChild(nameEl);
    info.appendChild(subEl);
    item.appendChild(icon);
    item.appendChild(info);
    item.addEventListener('click', () => selectCity(cities[i]));
    el.appendChild(item);
  });
}

async function selectCity(city) {
  const lat = city.latitude != null ? city.latitude : city.lat;
  const lon = city.longitude != null ? city.longitude : city.lon;
  saveHistory({ id: city.id, name: city.name, country: city.country || '', lat, lon });
  showPreview({ ...city, latitude: lat, longitude: lon });
}

function clearSearch() {
  const input = document.getElementById('search-input');
  input.value = '';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-clear').style.display = 'none';
  renderHistory();
}

document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.trim();
  document.getElementById('search-clear').style.display = q ? 'block' : 'none';
  document.getElementById('search-history-section').style.display = q ? 'none' : 'block';
  clearTimeout(searchTimer);
  if (!q) { document.getElementById('search-results').innerHTML = ''; return; }
  document.getElementById('search-results').innerHTML = '<div class="search-loading">検索中...</div>';
  searchTimer = setTimeout(async () => {
    const cities = await searchCities(q);
    renderResults(cities);
  }, 350);
});

// ── ナビゲーション ──
const NAV_LAYERS = ['weekly-layer', 'search-layer', 'settings-layer', 'detail-layer'];

function navHome() {
  NAV_LAYERS.forEach(id => closeLayer(id));
}

function navSearch() {
  NAV_LAYERS.forEach(id => closeLayer(id));
  openLayer('search-layer');
  switchSearchTab('text');
  renderHistory();
}

function navSettings() {
  NAV_LAYERS.forEach(id => closeLayer(id));
  openLayer('settings-layer');
}

document.getElementById('greeting').addEventListener('click', playCheer);
document.getElementById('settings-btn').addEventListener('click', navSettings);
document.getElementById('search-btn').addEventListener('click', navSearch);
document.getElementById('stab-text').addEventListener('click', () => switchSearchTab('text'));
document.getElementById('stab-map').addEventListener('click', () => switchSearchTab('map'));

// ── 場所ドロップダウン イベント ──
document.getElementById('header-loc').addEventListener('click', openLocDropdown);
document.getElementById('loc-opt-default').addEventListener('click', e => {
  e.stopPropagation();
  switchView('default');
  closeLocDropdown();
});
document.getElementById('loc-opt-reg').addEventListener('click', e => {
  e.stopPropagation();
  if (!registeredCity) return;
  switchView('reg');
  closeLocDropdown();
});
document.addEventListener('click', () => { if (locDropdownOpen) closeLocDropdown(); });

// ── CSP対応: HTML onclick 属性の代替 ──
document.querySelectorAll('.layer > .layer-header > .close-btn').forEach(btn => {
  btn.addEventListener('click', () => closeLayer(btn.closest('.layer').id));
});
document.getElementById('preview-close-btn').addEventListener('click', closePreview);
document.getElementById('search-clear').addEventListener('click', clearSearch);
document.getElementById('register-btn').addEventListener('click', registerCurrentCity);
document.querySelectorAll('.toggle').forEach(t => {
  t.addEventListener('click', () => t.classList.toggle('on'));
});
document.getElementById('toggle-morning').addEventListener('click', async () => {
  const toggle = document.getElementById('toggle-morning');
  const isOn = toggle.classList.contains('on');
  if (isOn && 'Notification' in window && Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      toggle.classList.remove('on');
      document.getElementById('notif-loc-options').classList.remove('open');
      return;
    }
  }
  document.getElementById('notif-loc-options').classList.toggle('open', isOn);
});
document.getElementById('notif-loc-default').addEventListener('change', e => {
  localStorage.setItem('notifLocDefault', e.target.checked ? '1' : '0');
});
document.getElementById('notif-loc-reg').addEventListener('change', e => {
  localStorage.setItem('notifLocReg', e.target.checked ? '1' : '0');
});
document.getElementById('wloc-k').onclick = () => openWeekly('神楽坂');
document.getElementById('wloc-c').onclick = () => openWeekly('千葉市');
document.getElementById('notif-time').addEventListener('change', e => {
  localStorage.setItem('notifTime', e.target.value);
});

// ── ドラッグ並び替え ──
let dragSrc = null;

function syncContentOrder() {
  const main = document.querySelector('.main');
  [...document.querySelectorAll('.drag-item')].forEach(dragItem => {
    const card = main.querySelector(`[data-key="${dragItem.dataset.key}"]`);
    if (card) main.appendChild(card);
  });
}

document.querySelectorAll('.drag-item').forEach(item => {
  item.addEventListener('dragstart', () => { dragSrc = item; item.style.opacity = '0.4'; });
  item.addEventListener('dragend', () => { item.style.opacity = '1'; });
  item.addEventListener('dragover', e => e.preventDefault());
  item.addEventListener('drop', e => {
    e.preventDefault();
    if (dragSrc !== item) {
      const list = item.parentNode;
      const items = [...list.children];
      const si = items.indexOf(dragSrc), ti = items.indexOf(item);
      if (si < ti) list.insertBefore(dragSrc, item.nextSibling);
      else list.insertBefore(dragSrc, item);
      syncContentOrder();
    }
  });
});

document.querySelectorAll('.drag-eye').forEach(eye => {
  eye.addEventListener('click', () => {
    eye.classList.toggle('off');
    const key = eye.closest('[data-key]').dataset.key;
    const card = document.querySelector(`.main [data-key="${key}"]`);
    if (card) card.style.display = eye.classList.contains('off') ? 'none' : '';
  });
});

// ── 背景テーマ（時間帯） ──
function updateDayTheme() {
  const h = new Date().getHours();
  let color;
  if (h >= 5  && h < 7)  color = 'rgba(25,55,130,0.13)';
  else if (h >= 7  && h < 11) color = 'rgba(20,80,180,0.09)';
  else if (h >= 11 && h < 16) color = 'rgba(15,65,160,0.07)';
  else if (h >= 16 && h < 18) color = 'rgba(170,70,15,0.11)';
  else if (h >= 18 && h < 21) color = 'rgba(110,15,55,0.13)';
  else color = null;

  document.body.style.background = color
    ? `radial-gradient(ellipse 120% 35% at 50% 0%, ${color} 0%, transparent 100%), #0d0d1a`
    : '#0d0d1a';
}

// ── 初期化 ──
async function init() {
  updateGreeting();
  updateDayTheme();

  document.getElementById('notif-time').value = localStorage.getItem('notifTime') || '08:00';

  const morningOn = document.getElementById('toggle-morning').classList.contains('on');
  if (morningOn) document.getElementById('notif-loc-options').classList.add('open');
  const notifLocDefaultSaved = localStorage.getItem('notifLocDefault');
  if (notifLocDefaultSaved !== null) document.getElementById('notif-loc-default').checked = notifLocDefaultSaved === '1';
  const notifLocRegSaved = localStorage.getItem('notifLocReg');
  if (notifLocRegSaved !== null) document.getElementById('notif-loc-reg').checked = notifLocRegSaved === '1';
  if (registeredCity) {
    document.getElementById('notif-loc-reg-name').textContent = registeredCity.name;
    document.getElementById('notif-loc-reg').disabled = false;
    document.getElementById('notif-loc-reg-label').classList.remove('disabled');
  }

  const now = new Date();
  const currentHour = now.getHours();

  try {
    const [kData, cData] = await Promise.all([
      fetchWeather(LOCATIONS.kagurazaka.lat, LOCATIONS.kagurazaka.lon),
      fetchWeather(LOCATIONS.chiba.lat, LOCATIONS.chiba.lon),
    ]);

    cachedData['k'] = kData;
    cachedData['c'] = cData;
    applyPressureData(kData, currentHour);
    applyWeatherData(kData, 'k', currentHour);
    applyWeatherData(cData, 'c', currentHour);

    await loadRegisteredCity();

  } catch (e) {
    console.error('データ取得失敗:', e);
    document.getElementById('pressure-val').textContent = '--';
    document.getElementById('ai-text').textContent = 'データの取得に失敗しました。';
  }
}

init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW registration failed:', e));
}
