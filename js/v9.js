/* 파크골프 공략수첩 v9.0.0 — 공통: 누르면 대답(눌림 · 물결 · 떨림) · 한 줄 맞춤 · 되돌리기 · 목소리
 * core.js 다음에 불러요. 화면 코드는 그대로 두고, 그려진 화면 위에서 움직여요. */
(function () {
  'use strict';
  var LZ = window.LZ = window.LZ || {};
  var store = LZ.store || { get: function () { return null; }, set: function () {} };
  var V9 = LZ.v9 = { ver: '9.0.0' };

  /* ───── 1. 누르면 대답: 눌림(96%) · 물결 · 짧은 떨림 ─────
     물결은 몸통 위 따로 된 층에 그려서, 누르자마자 화면이 다시 그려져도 끝까지 보여요 */
  var TAP = 'button,a[href],[data-act],[data-go],.li,.chip,.seg>*,[role="button"]';
  var pressed = null, fxLayer = null;
  function layer() { if (!fxLayer || !fxLayer.isConnected) { fxLayer = document.createElement('div'); fxLayer.id = 'v9fx'; fxLayer.setAttribute('aria-hidden', 'true'); document.body.appendChild(fxLayer); } return fxLayer; }
  /** 물결 색: 단추 자신이나(투명하면) 감싼 바탕이 어두우면 흰 물결, 밝으면 청록 물결 */
  function light(el) {
    for (var x = el; x && x.nodeType === 1; x = x.parentElement) {
      var m = getComputedStyle(x).backgroundColor.match(/\d+(\.\d+)?/g); if (!m) continue;
      if (m[3] !== undefined && +m[3] < 0.3) { if (getComputedStyle(x).backgroundImage !== 'none') return true; continue; }
      return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) < 140;
    }
    return document.documentElement.dataset.theme === 'dark';
  }
  function ripple(el, e) {
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    var fx = document.createElement('div'); fx.className = 'v9tap';
    fx.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + getComputedStyle(el).borderRadius + ';color:' + (light(el) ? '#fff' : 'var(--v9-acc,#0F766E)');
    var d = Math.max(r.width, r.height) * 2.2, c = document.createElement('i');
    c.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + ((e.clientX || r.left + r.width / 2) - r.left - d / 2) + 'px;top:' + ((e.clientY || r.top + r.height / 2) - r.top - d / 2) + 'px';
    fx.appendChild(c); layer().appendChild(fx); setTimeout(function () { fx.remove(); }, 560);
  }
  V9.buzz = function () {
    if (store.get('lz.buzz') === '0') return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) { /* 아이폰 사파리는 떨림을 막아 둠 → 눌림 움직임으로 대신 */ }
  };
  var start = null, holdT = 0;
  /** 물결을 그릴 단추: 단추 모양(작은 것 · .btn · 숫자판 · 칩 · 위 막대 단추)만. 넓은 줄 · 카드는 물결 없이 눌림만 */
  function rippleOk(el) {
    if (el.matches('.btn,.pad button,.kpad button,.chip,.tb,.bk,.stp,.seg button,.pill9,.kwb,.ljbtn,.go,.how,.cv')) return true;
    var r = el.getBoundingClientRect(); return r.width <= 200 && r.height <= 64;
  }
  function press(st) {
    if (st.done) return; st.done = true; pressed = st.el; st.el.classList.add('v9p');
    V9.buzz();   // v9.1 물결 그림은 없앴어요(휴대폰이 바쁘면 단추 모양 자국이 2초쯤 남았어요) · 단추 자체 눌림만
    if (st.el.closest('.pad')) setTimeout(function () { var on = document.querySelectorAll('#dots i.on'), d = on[on.length - 1]; if (d) { d.classList.remove('pop9'); void d.offsetWidth; d.classList.add('pop9'); } }, 30);   // 숫자판: 채운 점이 톡
  }
  function cancel() { clearTimeout(holdT); start = null; release(); }
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest(TAP); if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.closest('input,textarea,select')) return;
    clearTimeout(holdT); start = { el: el, x: e.clientX, y: e.clientY, clientX: e.clientX, clientY: e.clientY, done: false };
    if (e.pointerType === 'mouse') { press(start); return; }
    var st = start; holdT = setTimeout(function () { if (start === st) press(st); }, 110);   // 손가락은 잠깐 기다려요(밀어서 스크롤하면 물결 없음)
  }, { passive: true });
  document.addEventListener('pointermove', function (e) { if (start && !start.done && (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8)) cancel(); }, { passive: true });
  document.addEventListener('pointerup', function () { if (!start) return release(); var st = start; start = null; clearTimeout(holdT); if (!st.done) press(st); release(); }, { passive: true });
  ['pointercancel', 'dragstart'].forEach(function (t) { document.addEventListener(t, cancel, { passive: true }); });
  window.addEventListener('scroll', function () { if (start && !start.done) cancel(); }, { passive: true, capture: true });
  function release() { if (!pressed) return; var p = pressed; pressed = null; p.classList.remove('v9p'); }

  /* ───── 2. 한 줄 맞춤: 한 줄로 써야 하는 글자가 넘치면 그 글자만 조금(최소 72%) 줄여요 ───── */
  var ONE = [
    '.top h2', '.tb', '.tabs button span', '.tabs button', '.btn', '.btn2', '.chip', '.seg button', '.pill', '.v9one', '.ccard .ct b', '.ct9', '.cimp .li b', '.rnsame .li b', '.nxp'
  ].join(',');
  V9.fit = function (root) {
    root = root || document;
    var els = root.querySelectorAll(ONE);
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.closest('.v9wrap')) continue;
      el.style.fontSize = ''; el.classList.add('v9n');
      if (!el.clientWidth) continue;
      if (el.scrollWidth > el.clientWidth) {
        var fs = parseFloat(getComputedStyle(el).fontSize), ratio = Math.max(el.matches('.top h2') ? 0.6 : 0.72, (el.clientWidth - 1) / el.scrollWidth);
        el.style.fontSize = (fs * ratio * 0.97).toFixed(1) + 'px';
      }
    }
  };
  /* 뒤로 단추 옆 이름이 안 들어가면(휴대폰 글자를 크게 한 분 · 좁은 화면) 이름만 숨기고 ‹ 만 */
  V9.fitBack = function (root) {
    var bs = (root || document).querySelectorAll('.top .bkt');
    for (var i = 0; i < bs.length; i++) {
      var t = bs[i], top = t.closest('.top'), h = top && top.querySelector('h2');
      if (t.scrollWidth > t.clientWidth + 1 || (h && h.textContent && h.scrollWidth > h.clientWidth + 1)) { t.style.display = 'none'; if (h) { h.style.fontSize = ''; V9.fit(top); } }   // 제목이 먼저: 제목이 안 들어가면 뒤로 단추 이름을 숨겨요
    }
  };
  var fitQ = 0;
  function fitSoon() { if (fitQ) return; fitQ = requestAnimationFrame(function () { fitQ = 0; V9.fit(document); V9.fitBack(document); }); }
  document.addEventListener('DOMContentLoaded', function () {
    try { new MutationObserver(fitSoon).observe(document.body, { childList: true, subtree: true }); } catch (x) { /* 오래된 브라우저 */ }
    window.addEventListener('resize', fitSoon);
    try { document.fonts && document.fonts.ready.then(fitSoon); } catch (x) { /* 무시 */ }
    fitSoon();
  });

  /* ───── 3. 묻지 말고 되돌리기: 바로 하고 5초 동안 “되돌리기” ───── */
  var undoT = 0;
  LZ.undo = function (msg, fn, ms) {
    var u = document.getElementById('v9undo');
    if (!u) { u = document.createElement('div'); u.id = 'v9undo'; u.className = 'v9undo'; u.setAttribute('role', 'status'); document.body.appendChild(u); }
    u.innerHTML = '<span></span><button type="button">되돌리기</button>';
    u.firstChild.textContent = msg;
    u.lastChild.onclick = function () { u.classList.remove('on'); clearTimeout(undoT); try { fn && fn(); } catch (x) { /* 무시 */ } };
    u.classList.add('on'); clearTimeout(undoT); undoT = setTimeout(function () { u.classList.remove('on'); }, ms || 5000);
  };

  /* ───── 4. 목소리로 값만 짧게 (아이폰 무음 모드면 안 들려요) ───── */
  LZ.say = function (text) {
    if (store.get('lz.say') !== '1' || !text) return false;
    try { if (!window.speechSynthesis) return false; var u = new SpeechSynthesisUtterance(String(text)); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } catch (x) { return false; }
  };

  /* ───── 5. 볼스피드 보이는 값: 8 미만 Min · 40 초과 Max (저장은 숫자 그대로) ───── */
  V9.SP_MIN = 8; V9.SP_MAX = 40;
  LZ.spShow = function (v) { if (v === null || v === undefined || v === '') return '–'; v = Number(v); if (v < V9.SP_MIN) return 'Min'; if (v > V9.SP_MAX) return 'Max'; return String(v); };

  /* ───── 7. 화면 밝기: 기기 따라(기본) · 밝게 · 어둡게 — 앱을 열 때마다 다시 맞춰요 ───── */
  V9.themeMode = function () { var m = store.get('lz.themeMode'); if (m === 'light' || m === 'dark' || m === 'auto') return m; var old = store.get('lz.theme'); return old === 'dark' || old === 'light' ? old : 'auto'; };
  V9.themeApply = function () {
    var m = V9.themeMode(), dark = m === 'dark' || (m === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var t = document.querySelector('meta[name="theme-color"]'); if (t) t.content = dark ? '#121917' : '#F2F3F1';
  };
  LZ.act.themeSet = function (el, v) { store.set('lz.themeMode', v); V9.themeApply(); if (LZ.redraw) LZ.redraw(); };
  V9.themeApply();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (V9.themeMode() === 'auto') V9.themeApply(); }); } catch (x) { /* 오래된 브라우저 */ }

  /* ───── 8. 글자판이 올라와 화면이 밀려도 위 막대는 보이는 맨 위에(아이폰) ───── */
  try {
    var vv = window.visualViewport;
    if (vv) { var vvLast = -1, vvFix = function () { var off = Math.round(Math.max(0, vv.offsetTop || 0)); if (off === vvLast) return; vvLast = off; document.documentElement.style.setProperty('--vvTop', off + 'px'); }; vv.addEventListener('resize', vvFix); vv.addEventListener('scroll', vvFix); }
  } catch (x) { /* 오래된 브라우저 */ }
  /* ───── 9. 글자 칸: 휴대폰 자동 완성(연락처 · 주소) 줄이 뜨지 않게 ───── */
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!t || t.tagName !== 'INPUT' || /^(password|number|tel|email|checkbox|radio|range|date|time)$/.test(t.type)) return;
    if (!t.dataset.v9ac) { t.dataset.v9ac = '1'; t.setAttribute('autocomplete', t.id === 'nick' ? 'username' : 'off'); t.setAttribute('autocorrect', 'off'); t.setAttribute('autocapitalize', 'off'); t.setAttribute('spellcheck', 'false'); if (!t.name || /name|이름/i.test(t.name)) t.setAttribute('name', 'f' + Math.random().toString(36).slice(2, 7)); }
  }, true);

  /* ───── 6. 후반 홀 이름: “1홀 (10홀)” ───── */
  LZ.holeName = function (n) { n = Number(n); return n > 9 ? (n - 9) + '홀 (' + n + '홀)' : n + '홀'; };
})();
