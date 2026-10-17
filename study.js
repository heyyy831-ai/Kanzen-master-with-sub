/* 学習記録：アプリを開いて操作している時間を1日ごとに記録する
   ・過去14日分だけ保存（それより前は自動で消える）
   ・1日の上限は120分
   ・記録はこの端末のブラウザ（localStorage）にのみ保存される */
(function () {
  'use strict';

  var KEY = 'kms-study-v1';
  var DAYS = 14;              // 表示・保存する日数
  var CAP = 120 * 60;         // 1日の上限（秒）
  var TICK = 5;               // 加算の刻み（秒）
  var IDLE = 5 * 60 * 1000;   // 無操作でカウントを止めるまで（ミリ秒）
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  var ok = true;
  try {
    localStorage.setItem(KEY + '-t', '1');
    localStorage.removeItem(KEY + '-t');
  } catch (e) { ok = false; }

  /* ---------- データ ---------- */

  function key(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function recentDays() {
    var out = [], now = new Date(), i;
    for (i = DAYS - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - i);
      out.push(d);
    }
    return out;
  }

  function load() {
    if (!ok) return {};
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || '{}');
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }

  function save() {
    if (!ok) return;
    try {
      /* 14日より前は捨て、別タブが書いた記録は日ごとに大きい方を残す */
      var cur = load(), list = recentDays(), out = {}, i, k, a, b, v;
      for (i = 0; i < list.length; i++) {
        k = key(list[i]);
        a = typeof data[k] === 'number' ? data[k] : 0;
        b = typeof cur[k] === 'number' ? cur[k] : 0;
        v = Math.min(CAP, Math.max(a, b));
        if (v > 0) out[k] = v;
      }
      data = out;
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch (e) {}
  }

  function mins(sec) { return Math.floor((sec || 0) / 60); }

  var data = load();
  save();

  /* ---------- 計測 ---------- */

  var last = Date.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, function () { last = Date.now(); }, { passive: true });
  });

  function active() {
    return document.visibilityState === 'visible' && (Date.now() - last) < IDLE;
  }

  setInterval(function () {
    if (!active()) return;
    var k = key(new Date()), v = data[k] || 0;
    if (v >= CAP) return;
    data[k] = Math.min(CAP, v + TICK);
    save();
    paint();
  }, TICK * 1000);

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { last = Date.now(); paint(); }
    else { save(); }
  });
  window.addEventListener('pagehide', save);

  /* ---------- 画面 ---------- */

  var CSS = '' +
    '.st-wrap{position:relative;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}' +
    '.st-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--rule,#E2DCCF);background:var(--paper,#fff);' +
      'color:var(--ink-2,#4A5568);border-radius:99px;padding:4px 12px;font-size:12.5px;font-family:inherit;line-height:1.6;cursor:pointer}' +
    '.st-btn:hover{color:var(--ink,#1E2A3A);border-color:var(--ink-3,#8A93A3)}' +
    '.st-btn[aria-expanded="true"]{border-color:var(--wine,#A3244A);color:var(--wine,#A3244A)}' +
    '.st-btn svg{width:13px;height:13px;flex:none}' +
    '.st-mini{font-size:12px;color:var(--ink-3,#8A93A3);font-variant-numeric:tabular-nums;letter-spacing:.03em}' +
    '.st-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:40;width:min(380px,calc(100vw - 36px));' +
      'background:var(--paper,#fff);border:1px solid var(--rule,#E2DCCF);border-radius:14px;padding:16px 18px 14px;' +
      'box-shadow:0 10px 30px -18px rgba(0,0,0,.45);text-align:left}' +
    '.st-panel h2{margin:0 0 10px;font-size:11.5px;letter-spacing:.16em;font-weight:700;color:var(--ink-3,#8A93A3);font-family:inherit}' +
    '.st-sum{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:14px}' +
    '.st-sum .big{font-family:var(--en,serif);font-size:30px;font-weight:700;line-height:1;color:var(--ink,#1E2A3A);font-variant-numeric:tabular-nums}' +
    '.st-sum .unit{font-size:12px;color:var(--ink-3,#8A93A3);margin-left:4px}' +
    '.st-sum .side{font-size:12.5px;color:var(--ink-2,#4A5568);font-variant-numeric:tabular-nums}' +
    '.st-sum .side b{color:var(--wine,#A3244A);font-family:var(--en,serif);font-size:15px}' +
    '.st-bars{display:flex;align-items:flex-end;gap:4px}' +
    '.st-bars .d{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px}' +
    '.st-bars .tr{width:100%;max-width:18px;height:62px;border-radius:99px;background:var(--soft,#F1EDE4);' +
      'display:flex;align-items:flex-end;overflow:hidden;border:1.5px solid transparent}' +
    '.st-bars .d.now .tr{background:transparent;border-color:var(--wine,#A3244A)}' +
    '.st-bars .fl{width:100%;background:var(--wine,#A3244A);border-radius:99px}' +
    '.st-bars .lb{font-size:9.5px;line-height:1.2;color:var(--ink-3,#8A93A3);white-space:nowrap}' +
    '.st-bars .d.now .lb{color:var(--wine,#A3244A);font-weight:700}' +
    '.st-foot{margin:13px 0 0;padding-top:10px;border-top:1px solid var(--rule,#E2DCCF);font-size:11.5px;line-height:1.7;color:var(--ink-3,#8A93A3)}' +
    '.st-reset{background:none;border:0;padding:0;margin-top:8px;color:var(--ink-3,#8A93A3);font-size:11.5px;font-family:inherit;text-decoration:underline;cursor:pointer}' +
    '.st-reset:hover{color:var(--wine,#A3244A)}' +
    '@media (max-width:520px){.st-panel{width:min(340px,calc(100vw - 28px))}}';

  var HTML = '' +
    '<button class="st-btn" id="stBtn" type="button" aria-expanded="false" aria-controls="stPanel">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"></circle><path d="M12 6.8V12l3.4 2"></path></svg>' +
      '学習記録' +
    '</button>' +
    '<span class="st-mini" id="stMini"></span>' +
    '<div class="st-panel" id="stPanel" hidden>' +
      '<h2>この2週間の学習時間</h2>' +
      '<div class="st-sum">' +
        '<span><span class="big" id="stTotal">0</span><span class="unit">分 / 14日間</span></span>' +
        '<span class="side">今日 <b id="stToday">0</b> 分</span>' +
        '<span class="side">学習した日 <b id="stDays">0</b> 日</span>' +
      '</div>' +
      '<div class="st-bars" id="stBars"></div>' +
      '<p class="st-foot" id="stFoot">アプリを開いて操作している時間を自動で記録します（1日120分まで）。記録はこの端末のブラウザにだけ保存されます。</p>' +
      '<button class="st-reset" id="stReset" type="button">記録を消す</button>' +
    '</div>';

  var btn, panel, mini, barsEl, totalEl, todayEl, daysEl, footEl;

  function paint() {
    if (!barsEl) return;
    var list = recentDays(), total = 0, nz = 0, html = '', i;
    for (i = 0; i < list.length; i++) {
      var d = list[i], sec = data[key(d)] || 0, m = mins(sec);
      total += sec;
      if (sec > 0) nz++;
      var h = Math.round(Math.min(m, 120) / 120 * 100);
      if (m > 0 && h < 5) h = 5;
      var isNow = (i === list.length - 1);
      html += '<div class="d' + (isNow ? ' now' : '') + '" title="' +
          (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WD[d.getDay()] + '） ' + m + '分">' +
          '<span class="tr">' + (h > 0 ? '<span class="fl" style="height:' + h + '%"></span>' : '') + '</span>' +
          '<span class="lb">' + WD[d.getDay()] + '</span>' +
        '</div>';
    }
    barsEl.innerHTML = html;
    var tm = mins(data[key(new Date())] || 0);
    totalEl.textContent = mins(total);
    todayEl.textContent = tm;
    daysEl.textContent = nz;
    mini.textContent = ok ? ('今日 ' + tm + '分 ／ 14日 ' + mins(total) + '分') : '';
    if (!ok) footEl.textContent = 'このブラウザでは記録を保存できない設定のため、学習時間は残りません。';
  }

  function mount() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.className = 'st-wrap';
    box.innerHTML = HTML;

    /* 左上・赤い線の上（マストヘッド内）に置く */
    var host = document.querySelector('.mast .mast-t') ||
               document.querySelector('.mast .mast-in') ||
               document.querySelector('header.masthead') ||
               document.body;
    host.insertBefore(box, host.firstChild);

    btn = box.querySelector('#stBtn');
    panel = box.querySelector('#stPanel');
    mini = box.querySelector('#stMini');
    barsEl = box.querySelector('#stBars');
    totalEl = box.querySelector('#stTotal');
    todayEl = box.querySelector('#stToday');
    daysEl = box.querySelector('#stDays');
    footEl = box.querySelector('#stFoot');

    function open(v) {
      panel.hidden = !v;
      btn.setAttribute('aria-expanded', String(v));
      if (v) paint();
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(panel.hidden); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { if (!panel.hidden) open(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); }
    });
    box.querySelector('#stReset').addEventListener('click', function () {
      if (!window.confirm('この端末に保存した学習記録をすべて消します。よろしいですか？')) return;
      data = {};
      try { localStorage.removeItem(KEY); } catch (e) {}
      paint();
    });

    paint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
