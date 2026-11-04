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
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest(TAP); if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.closest('input,textarea,select')) return;
    pressed = el; el.classList.add('v9p'); ripple(el, e); V9.buzz();
    if (el.closest('.pad')) setTimeout(function () { var on = document.querySelectorAll('#dots i.on'), d = on[on.length - 1]; if (d) { d.classList.remove('pop9'); void d.offsetWidth; d.classList.add('pop9'); } }, 30);   // 숫자판: 채운 점이 톡
  }, { passive: true });
  function release() { if (!pressed) return; var p = pressed; pressed = null; setTimeout(function () { p.classList.remove('v9p'); }, 90); }
  ['pointerup', 'pointercancel', 'pointerleave', 'dragstart'].forEach(function (t) { document.addEventListener(t, release, { passive: true }); });

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
        var fs = parseFloat(getComputedStyle(el).fontSize), ratio = Math.max(0.72, (el.clientWidth - 1) / el.scrollWidth);
        el.style.fontSize = (fs * ratio * 0.97).toFixed(1) + 'px';
      }
    }
  };
  var fitQ = 0;
  function fitSoon() { if (fitQ) return; fitQ = requestAnimationFrame(function () { fitQ = 0; V9.fit(document); }); }
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

  /* ───── 6. 후반 홀 이름: “1홀 (10홀)” ───── */
  LZ.holeName = function (n) { n = Number(n); return n > 9 ? (n - 9) + '홀 (' + n + '홀)' : n + '홀'; };
})();
