/* 파크골프 공략수첩 v4 — 앱 뼈대: 설정·저장소·서버 연결·화면 이동·공통 화면 요소·타격감 계산 */
(function () {
  'use strict';
  var LZ = window.LZ = window.LZ || {};
  var C = window.LZ_CONFIG || {};
  LZ.API = C.API || '';
  LZ.APP_URL = C.APP_URL || (location.origin + location.pathname.replace(/[^\/]*$/, ''));
  LZ.VER = '4.0.0';
  var S = LZ.S = { user: null, token: '', me: null, br: '', store: '', pw: null, unit: 'p', g: 'p', h: 'm' };
  var $ = LZ.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = LZ.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = LZ.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  LZ.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ───── 기기 저장소 ───── */
  var store = LZ.store = {
    get: function (k) { try { var v = localStorage.getItem(k); if (v === null && k === 'lz.t') v = sessionStorage.getItem(k); return v; } catch (e) { return null; } },
    set: function (k, v) { try { if (k === 'lz.t' && store.get('lz.keep') === '0') { sessionStorage.setItem(k, v); localStorage.removeItem(k); return true; } localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* 무시 */ } },
    json: function (k) { try { return JSON.parse(store.get(k)); } catch (e) { return null; } },
    setJSON: function (k, v) { return store.set(k, JSON.stringify(v)); }
  };
  /* 휴대폰 고유 번호(가입·비밀번호 찾기 신청에 씀) */
  LZ.devId = function () {
    var d = store.get('lz.dev');
    if (!d || !/^[a-f0-9]{16,64}$/.test(d)) {
      var a = new Uint8Array(16); try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
      d = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); store.set('lz.dev', d);
    }
    return d;
  };
  LZ.devLabel = function () { var ua = navigator.userAgent; return (/iPhone|iPad/.test(ua) ? '아이폰' : /Android/.test(ua) ? '안드로이드' : 'PC') + (window.matchMedia && matchMedia('(display-mode: standalone)').matches ? '(앱)' : ''); };

  /* ───── 화면 설정: 어두운 화면·글씨 크게·진동 ───── */
  LZ.theme = {
    get: function () { return document.documentElement.dataset.theme === 'dark'; },
    set: function (dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; store.set('lz.theme', dark ? 'dark' : 'light'); var t = $('meta[name="theme-color"]'); if (t) t.content = dark ? '#121917' : '#0B5D4B'; }
  };
  LZ.big = { get: function () { return document.body.classList.contains('big'); }, set: function (on) { document.body.classList.toggle('big', !!on); store.set('lz.big', on ? '1' : '0'); } };
  LZ.buzz = function () { if (store.get('lz.buzz') === '0') return; try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* 무시 */ } };
  LZ.fmtDate = function (ts, withTime) { if (!ts) return ''; var d = new Date(Number(ts) || ts); if (isNaN(d)) return String(ts); var s = (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; if (withTime) s += ' ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); return s; };
  LZ.fmtYmd = function (ymd) { if (!ymd) return ''; var p = String(ymd).split('-'); return p.length === 3 ? (+p[1]) + '월 ' + (+p[2]) + '일' : ymd; };
  LZ.won = function (n) { return (Number(n) || 0).toLocaleString('ko-KR') + '원'; };
  LZ.LBL = function (i) { return (i + 1) + '홀'; };

  /* ───── 타격감 계산(서버와 같은 공식) ───── */
  LZ.MODE = { b: '비기너', p: '프로', m: '마스터' }; LZ.HL = { h: '높게', m: '보통', l: '낮게', x: '더낮게' }; LZ.HLSEG = [['h', '높게'], ['m', '보통'], ['l', '낮게'], ['x', '더낮게']];
  LZ.DEF_PW = { b: { base: 15, step: 6 }, p: { base: 17, step: 5 }, m: { base: 19, step: 4 }, hl: 0.5 };
  LZ.pw = function () { return S.pw || LZ.DEF_PW; };
  LZ.half = function (x) { return Math.round(Number(x) * 2) / 2; };
  LZ.clampP = function (x) { return Math.max(8, Math.min(40, x)); };
  LZ.stepOf = function (g, h) { var pw = LZ.pw(); return pw[g].step + (h === 'h' ? pw.hl : h === 'l' ? -pw.hl : h === 'x' ? -2 * pw.hl : 0); };
  LZ.distOf = function (p, g, h) { return Math.round(50 + (p - LZ.pw()[g].base) * LZ.stepOf(g, h)); };
  LZ.distRaw = function (p, g, h) { return 50 + (p - LZ.pw()[g].base) * LZ.stepOf(g, h); };
  LZ.sugOf = function (m, g, h) { return LZ.clampP(LZ.half(LZ.pw()[g].base + (m - 50) / LZ.stepOf(g, h))); };
  LZ.convRaw = function (p, g, h, g2, h2) { return LZ.half(LZ.pw()[g2].base + (LZ.distRaw(p, g, h) - 50) / LZ.stepOf(g2, h2)); };
  LZ.conv = function (p, g, h, g2, h2) { return LZ.clampP(LZ.convRaw(p, g, h, g2, h2)); };
  LZ.convTxt = function (p, g, h, g2, h2) { var v = LZ.convRaw(p, g, h, g2, h2); return v > 40 ? 'Full 초과' : v < 8 ? '8 미만' : LZ.fmtP(v); };
  LZ.fmtP = function (n) { return n >= 40 ? 'Full' : String(Math.round(n * 2) / 2).replace(/\.0$/, ''); };
  /* 좌우: 0 = "그대로"(희미하게) · 오른쪽은 빨강 · 왼쪽은 파랑 */
  LZ.lrPlain = function (r) { var n = r.n | 0; return !n ? '그대로' : (r.d === 'L' ? '좌 ' : '우 ') + n; };
  LZ.lrTxt = function (r) { var n = r.n | 0; return '<span class="lrv ' + (!n ? 'c' : r.d === 'L' ? 'l' : 'r') + '">' + LZ.lrPlain(r) + '</span>'; };
  LZ.refTxt = function (r) { return (r.r === 'c' ? '홀컵' : r.r === 'u' ? (r.t || '직접') : '첫화면') + '에서'; };
  /** ● 제안과 같음 · ▲ 더 크게 · ▼ 더 작게 (적을 때의 모드 기준) */
  LZ.mark = function (p, s) { var d = p - s; if (Math.abs(d) < 0.5) return '<span class="mk ok">●</span>'; return '<span class="mk ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + '</span>'; };
  LZ.markOf = function (r, hm) { return LZ.mark(r.p, LZ.sugOf(hm, r.g || 'p', r.h || 'm')); };
  LZ.pp = function (d) { return '<span class="pp ' + (d < 0 ? 'u' : d > 0 ? 'o' : 'e') + '">' + (d > 0 ? '+' + d : d === 0 ? 'E' : d) + '</span>'; };
  LZ.stars = function (n) { n = Math.max(1, Math.min(5, n | 0)) || 3; return '<span class="star">' + '★'.repeat(n) + '<s>' + '★'.repeat(5 - n) + '</s></span>'; };

  /* ───── 공통 화면 요소 ───── */
  var toastT = null;
  LZ.toast = function (msg, ms, actLabel, actFn) {
    var t = $('#toast'); if (!t) return; t.innerHTML = esc(msg) + (actLabel ? '<button type="button" id="toastAct">' + esc(actLabel) + '</button>' : ''); t.classList.add('on'); t.classList.toggle('act', !!actLabel);
    if (actLabel) { var b = $('#toastAct'); if (b) b.onclick = function () { t.classList.remove('on'); actFn && actFn(); }; }
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2600);
  };
  LZ.sheet = function (html, o) {
    o = o || {}; LZ.closeSheet();
    var d = document.createElement('div'); d.className = 'sheet'; d.innerHTML = '<div class="pane">' + html + (o.noClose ? '' : '<button type="button" class="btn g" data-act="sheetClose">닫기</button>') + '</div>';
    d.addEventListener('click', function (e) { if (e.target === d && !o.noClose) LZ.closeSheet(); });
    $('#layer').appendChild(d); return d;
  };
  LZ.closeSheet = function () { $$('#layer .sheet').forEach(function (x) { x.parentNode.removeChild(x); }); };
  /** 대화창: buttons [{label, kind, value}] → Promise(value). cancel = 바깥 누르면 돌려줄 값(없으면 못 닫음) */
  LZ.dialog = function (o) {
    return new Promise(function (resolve) {
      var d = document.createElement('div'); d.className = 'dlg';
      d.innerHTML = '<div class="pane">' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.html || (o.body ? '<p>' + esc(o.body) + '</p>' : '')) +
        (o.buttons || [{ label: '확인', kind: 'y', value: true }]).map(function (b, i) { return '<button type="button" class="btn ' + (b.kind === 'y' ? '' : b.kind === 'r' ? 'red' : b.kind === 'o' ? 'o' : 'g') + '" data-dlg="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div>';
      var done = function (v) { var vals = {}; $$('input,select,textarea', d).forEach(function (x) { if (x.id) vals[x.id] = x.type === 'checkbox' ? x.checked : x.value; }); LZ.dlgVals = vals; d.hidden = true; resolve(v); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 0); };
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-dlg]'); if (b) { done((o.buttons || [{ value: true }])[+b.dataset.dlg].value); return; }
        if (e.target === d && o.cancel !== undefined) done(o.cancel);
      });
      $('#layer').appendChild(d);
      if (o.focus) { var f = $(o.focus, d); if (f) setTimeout(function () { f.focus(); }, 50); }
    });
  };
  LZ.confirm = function (title, body, yes, kind) { return LZ.dialog({ title: title, body: body, cancel: false, buttons: [{ label: yes || '확인', kind: kind || 'y', value: true }, { label: '취소', kind: 'g', value: false }] }); };
  LZ.busy = function (on, msg) { var b = $('#busy'); if (b) b.parentNode.removeChild(b); if (!on) return; b = document.createElement('div'); b.id = 'busy'; b.className = 'busy'; b.innerHTML = '<div class="spin" style="border-color:rgba(255,255,255,.4);border-top-color:#fff"></div><div>' + esc(msg || '잠시만요…') + '</div>'; $('#layer').appendChild(b); };
  LZ.errText = function (e) { return (e && e.message) || '문제가 생겼어요. 잠시 뒤에 다시 해 주세요.'; };
  LZ.hdr = function (title, o) {
    o = o || {};
    return '<div class="top">' + (o.back ? '<button type="button" class="ib" data-act="back">‹ 뒤로</button>' : '') + '<h2>' + esc(title) + '</h2>' + (o.right || '') +
      (LZ.HELP && LZ.HELP[LZ.cur().name] ? '<button type="button" class="ib help" data-act="help" aria-label="사용 안내">?</button>' : '') +
      (S.user && S.user.kind === 'admin' && !o.noBell ? '<button type="button" class="ib bell" data-go="noti">🔔' + (S.me && S.me.noti ? '<i>' + S.me.noti + '</i>' : '') + '</button>' : (S.user && !o.noBell && S.me && S.me.noti ? '<button type="button" class="ib bell" data-go="noti">🔔<i>' + S.me.noti + '</i></button>' : '')) +
      '</div>';
  };
  LZ.skeleton = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="sk" style="width:' + (60 + (i * 13) % 40) + '%"></div>'; return '<div class="wrap">' + s + '</div>'; };
  LZ.seg = function (opts, on, act, cls) { return '<div class="seg ' + (cls || '') + '">' + opts.map(function (x) { return '<button type="button" class="' + (on === x[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>'; };
  LZ.sw = function (on, act, arg, dis) { return '<button type="button" class="sw ' + (on ? 'on' : '') + '" data-act="' + act + '" data-v="' + esc(arg || '') + '"' + (dis ? ' disabled' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '"></button>'; };
  LZ.inputMode = function (el, kind) { if (el) el.setAttribute('inputmode', kind); };

  /* ───── 서버 ───── */
  function ApiError(code, msg, data) { this.code = code; this.message = msg; this.data = data || {}; this.isApi = true; }
  ApiError.prototype = Object.create(Error.prototype); LZ.ApiError = ApiError;
  var waiting = null;
  function post(a, body, o) {
    o = o || {};
    if (!LZ.API) return Promise.reject(new ApiError('config', '앱 설정이 아직 끝나지 않았어요. 관리자에게 알려 주세요.'));
    var payload = {}; for (var k in (body || {})) payload[k] = body[k];
    payload.a = a; if (S.br && payload.br === undefined) payload.br = S.br;
    if (S.token && !o.noAuth) payload.t = S.token;
    var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? setTimeout(function () { ctl.abort(); }, o.timeout || 40000) : null;
    return fetch(LZ.API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (timer) clearTimeout(timer); return r.text(); }, function () { if (timer) clearTimeout(timer); throw new ApiError('net', '인터넷에 연결되어 있는지 확인해 주세요.'); })
      .then(function (txt) {
        var d; try { d = JSON.parse(txt); } catch (e) { throw new ApiError('server', '서버와 연결이 잠시 원활하지 않아요. 잠시 뒤에 다시 해 주세요.'); }
        if (d && d.ok) { if (d.pw) S.pw = d.pw; if (d.br && d.store && /^(me|courses|course|useBranch)$/.test(a)) { S.br = d.br; S.store = d.store; store.set('lz.br', d.br); } return d; }
        throw new ApiError((d && d.err) || 'server', (d && d.msg) || '서버에 문제가 생겼어요. 잠시 뒤에 다시 해 주세요.', d);
      });
  }
  LZ.api = async function (a, body, o) {
    o = o || {}; var tries = o.retry === undefined ? 1 : o.retry;
    for (var i = 0; ; i++) {
      try { return await post(a, body, o); }
      catch (e) {
        if (e.code === 'queue') { await LZ.queueWait(e.data); continue; }
        if (e.code === 'auth' && !o.noAuth) { await LZ.sessionLost(e); throw e; }
        if (e.code === 'sure' && S.user && S.user.kind === 'admin' && !o.noSure) { if (await LZ.sureDialog()) continue; throw e; }
        if ((e.code === 'net' || e.code === 'server' || e.code === 'busy') && i < tries) { await LZ.sleep(800 + i * 700); continue; }
        throw e;
      }
    }
  };
  LZ.queueWait = function (d) {
    if (waiting) return waiting;
    var ov = document.createElement('div'); ov.className = 'qwait';
    function paint(x) { x = x || {}; ov.innerHTML = '<h2 style="margin:0 0 6px">지금 이용하는 분이 많아요</h2><p>내 앞에 기다리는 분</p><div class="n">' + (x.ahead || 0) + '명</div><p class="muted">자리가 나면 자동으로 들어가요. 이 화면을 켜 둔 채로 잠시만 기다려 주세요.</p><div class="spin"></div>'; }
    paint(d); $('#layer').appendChild(ov);
    waiting = new Promise(function (resolve) {
      (function again() {
        setTimeout(function () {
          post('ping', {}, { timeout: 20000 }).then(function () { ov.remove(); waiting = null; resolve(); }, function (e) { if (e.code === 'queue') paint(e.data); else if (e.code === 'auth') { ov.remove(); waiting = null; resolve(); return; } again(); });
        }, window.LZ_QPOLL || 15000);
      })();
    });
    return waiting;
  };
  /* 관리자 재확인: 비밀번호 6자리 */
  LZ.sureDialog = async function () {
    var pin = await LZ.dialog({ title: '비밀번호를 한 번 더', html: '<p class="muted">안전을 위해 결제 승인·회원 변경·임시 번호 발급 때는 관리자 비밀번호를 다시 넣어요(10분 동안 유효).</p><input type="password" inputmode="numeric" maxlength="6" class="in" id="surePin" placeholder="6자리" autocomplete="off">', cancel: null, focus: '#surePin',
      buttons: [{ label: '확인', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (v) { var el = $('#surePin'); return v === 'ok' ? (el ? el.value : '') : null; });
    if (pin === null) return false;
    try { await post('sure', { pin: pin }); return true; } catch (e) { LZ.toast(LZ.errText(e), 4000); return false; }
  };
  LZ.sessionLost = async function (e) {
    var was = !!S.user;
    LZ.clearSession();
    if (was) { if (e && e.data && e.data.pinChanged) await LZ.dialog({ title: '비밀번호가 바뀌었어요', body: '다른 휴대폰에서 비밀번호를 새로 정해서 이 휴대폰은 로그아웃됐어요. 새 비밀번호로 다시 로그인해 주세요.' }); else LZ.toast(e && e.message ? e.message : '다시 로그인해 주세요.', 4000); }
    LZ.go('login', {}, { reset: true });
  };
  LZ.clearSession = function () { S.user = null; S.token = ''; S.me = null; store.del('lz.t'); LZ.rt && LZ.rt.stop(); };
  LZ.setSession = function (r) { S.token = r.token; S.user = r.user; store.set('lz.t', r.token); if (r.pw) S.pw = r.pw; };
  LZ.refreshMe = async function () { var r = await LZ.api('me', {}); S.me = r; S.user = r.user; S.br = r.br; S.store = r.store; S.pw = r.pw; S.unit = r.user.unit || 'p'; return r; };

  /* ───── 오프라인 큐: 신호가 약할 때 저장을 모아 두었다가 보냄 ───── */
  var Q = LZ.queue = {
    list: function () { return store.json('lz.q') || []; },
    push: function (a, body) { var l = Q.list(); l.push({ a: a, body: body, at: Date.now() }); store.setJSON('lz.q', l.slice(-300)); LZ.paintSync(); },
    size: function () { return Q.list().length; },
    flushing: false,
    flush: async function () {
      if (Q.flushing) return; var l = Q.list(); if (!l.length || !navigator.onLine) return;
      Q.flushing = true;
      try {
        while (l.length) {
          var it = l[0];
          try { await post(it.a, it.body, { timeout: 15000 }); }
          catch (e) { if (e.code === 'net' || e.code === 'server' || e.code === 'busy') break; }   // 안 되면 다음에, 규칙 오류면 버림
          l.shift(); store.setJSON('lz.q', l);
        }
      } finally { Q.flushing = false; LZ.paintSync(); if (!Q.size() && LZ.onFlushed) LZ.onFlushed(); }
    }
  };
  LZ.paintSync = function () { var b = $('#syncbar'); if (!b) return; var n = Q.size(); b.hidden = !n && navigator.onLine; b.textContent = n ? '📶 신호 약함 · ' + n + '건을 휴대폰에 저장했어요. 연결되면 보내요' : '📶 인터넷이 끊겼어요 · 저장은 돼요'; };
  window.addEventListener('online', function () { LZ.paintSync(); Q.flush(); });
  window.addEventListener('offline', LZ.paintSync);
  setInterval(function () { Q.flush(); }, 15000);

  /* ───── 화면 이동 ───── */
  LZ.screens = {}; LZ.stack = []; LZ.guard = null;
  var seq = 0, navBusy = false;
  LZ.cur = function () { return LZ.stack[LZ.stack.length - 1] || { name: '' }; };
  async function render(keep) {
    var cur = LZ.cur(), s = LZ.screens[cur.name], root = $('#app'), my = ++seq, alive = function () { return my === seq; };
    if (!s) { cur.name = S.user ? 'home' : 'login'; s = LZ.screens[cur.name]; }
    var boot = $('#boot'); if (boot) boot.remove();
    root.hidden = false; if (!keep) window.scrollTo(0, 0);
    root.classList.toggle('nobar', !!s.nobar); LZ.tabs(s.tab);
    if (s.wake) LZ.wake.on(); else LZ.wake.off();
    if (!s.rt && LZ.rt) LZ.rt.stop();
    try { await s.show(cur.p || {}, root, alive); }
    catch (e) {
      if (!alive()) return;
      if (e && e.code === 'auth') return;
      root.innerHTML = LZ.hdr('문제가 생겼어요', { back: true }) + '<div class="wrap"><div class="card"><p class="err">' + esc(LZ.errText(e)) + '</p><button type="button" class="btn" data-act="retry">다시 시도</button></div></div>';
    }
    LZ.booted = true;
  }
  LZ.render = render;
  LZ.redraw = function () { var y = window.scrollY; render(true).then(function () { window.scrollTo(0, y); }); };
  LZ.go = async function (name, p, o) {
    o = o || {};
    if (navBusy) return false; navBusy = true;
    try {
      if (!o.skipGuard && LZ.guard && LZ.guard.dirty && LZ.guard.dirty()) { var ok = await LZ.guard.ask(); if (!ok) return false; }
      LZ.guard = null; LZ.closeSheet();
      if (o.reset) { LZ.stack = [{ name: name, p: p || {} }]; history.replaceState({ i: 0 }, '', location.pathname + location.search); }
      else if (o.replace) { LZ.stack[LZ.stack.length - 1] = { name: name, p: p || {} }; history.replaceState({ i: LZ.stack.length - 1 }, '', location.pathname + location.search); }
      else { LZ.stack.push({ name: name, p: p || {} }); history.pushState({ i: LZ.stack.length - 1 }, '', location.pathname + location.search); }
    } finally { navBusy = false; }
    await render(); return true;
  };
  LZ.back = function () { if (LZ.stack.length > 1) history.back(); else LZ.go('home', {}, { reset: true }); };
  window.addEventListener('popstate', async function () {
    if (LZ.stack.length <= 1) return;
    if (LZ.guard && LZ.guard.dirty && LZ.guard.dirty()) { var ok = await LZ.guard.ask(); if (!ok) { history.pushState({ i: LZ.stack.length - 1 }, '', location.pathname + location.search); return; } }
    LZ.guard = null; LZ.closeSheet(); LZ.stack.pop(); await render();
  });
  /* 아래 탭 */
  var TABS = [['home', '홈', '<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v10H3z"/><path d="M9 21v-7h6v7"/></svg>'], ['courses', '스크린 공략', '<svg viewBox="0 0 24 24"><path d="M4 21V4"/><path d="M4 5h12l-3 4 3 4H4"/><circle cx="17" cy="19" r="2"/></svg>'], ['field', '필드 라운드', '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M12 11v4l-4 6"/><path d="M12 15l4 6"/><path d="M5 21h14"/></svg>'], ['me', '내 정보', '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>']];
  LZ.tabs = function (on) {
    var t = $('#tabs'); if (!t) return;
    if (!S.user || !on) { t.hidden = true; return; }
    t.hidden = false; t.innerHTML = TABS.map(function (x) { return '<button type="button" class="' + (on === x[0] ? 'on' : '') + '" data-tab="' + x[0] + '">' + x[2] + x[1] + '</button>'; }).join('');
  };
  /* 깊은 링크: #club:id · #course:id · #round:id · #event:code · #inv=코드 · #pwreq 등 */
  LZ.goTo = function (to) {
    to = String(to || ''); var m = /^([a-z]+)(?::(.*))?$/.exec(to); if (!m) return;
    var map = { home: ['home'], me: ['me'], pay: ['pay'], club: ['club', { id: m[2] }], reqs: ['club', { id: m[2], reqs: 1 }], course: ['holes', { id: m[2] }], round: ['round', { id: m[2] }], event: ['event', { code: m[2] }], find: ['find'], qna: ['qnaList'], notices: ['notices'], dash: ['dash'], members: ['members'], pwreq: ['pwreqs'], refund: ['refunds'], fb: ['feedbacks'] };
    var x = map[m[1]]; if (x) LZ.go(x[0], x[1] || {});
  };
  /* 단추 공통 처리: data-go / data-tab / data-act */
  LZ.act = {};
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); LZ.go(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : {}); return; }
    var t = e.target.closest('[data-tab]'); if (t) { e.preventDefault(); if (LZ.cur().name !== t.dataset.tab) LZ.go(t.dataset.tab, {}, { reset: true }); return; }
    var a = e.target.closest('[data-act]'); if (!a) return;
    var fn = LZ.act[a.dataset.act]; if (!fn) return;
    e.preventDefault(); if (a.tagName === 'BUTTON' && !/sheetClose|back|retry/.test(a.dataset.act)) LZ.buzz();
    Promise.resolve(fn(a, a.dataset.v, e)).catch(function (err) { LZ.toast(LZ.errText(err), 4500); });
  });
  LZ.act.back = function () { LZ.back(); };
  /* 꾹 누르면 연속으로(좌우·타격감·점수 단추) */
  var HOLD = /^(edLr|edP|sc|regLr:|regP:|shotFb)/, holdT = null, holdI = null, held = false;
  function holdStop() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('[data-act]'); if (!a || !HOLD.test(a.dataset.act) || a.disabled) return;
    held = false; holdStop();
    holdT = setTimeout(function () { holdI = setInterval(function () { held = true; var fn = LZ.act[a.dataset.act] || (a.dataset.act.indexOf(':') > 0 ? null : null); if (fn) { LZ.buzz(); Promise.resolve(fn(a, a.dataset.v, e)).catch(function () {}); } else a.click(); }, 130); }, 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { document.addEventListener(ev, function () { holdStop(); }, true); });
  document.addEventListener('click', function (e) { if (held) { held = false; var a = e.target.closest('[data-act]'); if (a && HOLD.test(a.dataset.act)) { e.stopImmediatePropagation(); e.preventDefault(); } } }, true);
  LZ.act.help = function () { var h = LZ.HELP[LZ.cur().name]; if (!h) return; LZ.sheet('<h2>' + esc(h.t) + '</h2>' + (h.img ? '<img src="assets/guide/' + h.img + '.webp" alt="" style="width:100%;border-radius:14px;border:1px solid var(--line);margin:4px 0 10px">' : '') + h.html); };
  LZ.act.sheetClose = function () { LZ.closeSheet(); };
  LZ.act.retry = function () { render(); };
  LZ.act.theme = function () { LZ.theme.set(!LZ.theme.get()); LZ.redraw(); };
  LZ.act.big = function () { LZ.big.set(!LZ.big.get()); LZ.toast(LZ.big.get() ? '글씨를 크게 했어요' : '보통 글씨로 했어요'); LZ.redraw(); };
  LZ.act.buzz = function () { store.set('lz.buzz', store.get('lz.buzz') === '0' ? '1' : '0'); LZ.redraw(); };
  LZ.act.logout = async function () { if (!(await LZ.confirm('로그아웃할까요?', '다시 들어올 때 닉네임과 비밀번호를 넣어요.', '로그아웃'))) return; try { await post('logout', {}); } catch (e) { /* 무시 */ } LZ.clearSession(); LZ.go('login', {}, { reset: true }); };
  LZ.act.copy = async function (el, v) { try { await navigator.clipboard.writeText(v); LZ.toast('복사했어요'); } catch (e) { LZ.toast('복사하지 못했어요. 길게 눌러 복사해 주세요.'); } };
  LZ.act.share = async function (el, v) { var o = JSON.parse(v); try { if (navigator.share) { await navigator.share(o); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText((o.text ? o.text + '\n' : '') + (o.url || '')); LZ.toast('내용을 복사했어요. 카톡에 붙여 넣어 주세요.'); } catch (e2) { LZ.toast('공유하지 못했어요.'); } };
  LZ.kakaoShare = function (text, url) { return LZ.act.share(null, JSON.stringify({ title: '파크골프 공략수첩', text: text, url: url })); };

  /* ───── 화면 켜짐 유지(기록·라운드 화면) ───── */
  var wl = null, vid = null;
  LZ.wake = {
    on: async function () {
      try { if (navigator.wakeLock && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', function () { wl = null; }); return; } } catch (e) { /* 아래 영상 방식으로 */ }
      if (!vid) { vid = document.createElement('video'); vid.setAttribute('playsinline', ''); vid.muted = true; vid.loop = true; vid.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none'; vid.innerHTML = '<source src="assets/nosleep.webm" type="video/webm"><source src="assets/nosleep.mp4" type="video/mp4">'; document.body.appendChild(vid); }
      try { await vid.play(); } catch (e) { /* 사용자가 누른 뒤에 됨 */ }
    },
    off: function () { try { if (wl) { wl.release(); wl = null; } } catch (e) { /* 무시 */ } if (vid) { try { vid.pause(); } catch (e) { /* 무시 */ } } }
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { var s = LZ.screens[LZ.cur().name]; if (s && s.wake) LZ.wake.on(); Q.flush(); if (S.user) LZ.refreshMe().then(function () { LZ.paintBell(); }).catch(function () {}); } });
  LZ.paintBell = function () { $$('.top .bell').forEach(function (b) { b.innerHTML = '🔔' + (S.me && S.me.noti ? '<i>' + S.me.noti + '</i>' : ''); }); };

  /* ───── 시작 ───── */
  LZ.boot = async function () {
    if (store.get('lz.big') === '1' || (store.get('lz.big') === null)) document.body.classList.add('big');   // 처음엔 글씨 크게
    var t = store.get('lz.t'), hash = location.hash.replace(/^#/, ''), q = new URLSearchParams(location.search);
    if (q.get('inv')) store.set('lz.inv', q.get('inv'));
    if (q.get('ref')) store.set('lz.ref', q.get('ref'));
    if (q.get('r')) store.set('lz.joinRound', q.get('r'));
    if (q.get('e')) store.set('lz.joinEvent', q.get('e'));
    if (q.get('join')) store.set('lz.joinNow', '1');                                   // 홍보 안내문 링크: 가입 화면 바로
    var kakaoCode = store.get('lz.kakaoBack') === '1' && q.get('code') ? q.get('code') : '';   // 카카오 연결에서 돌아옴
    if (kakaoCode) store.del('lz.kakaoBack');
    LZ.stack = [{ name: 'login', p: {} }];
    if (t) {
      S.token = t;
      try { await LZ.refreshMe(); LZ.stack = [{ name: 'home', p: {} }]; }
      catch (e) { if (e.code === 'auth') { LZ.clearSession(); if (e.data && e.data.pinChanged) LZ.pinChangedNote = true; } else { S.token = t; LZ.stack = [{ name: 'offline', p: { err: e } }]; } }
    }
    if (!S.user && store.get('lz.joinNow') === '1') { store.del('lz.joinNow'); LZ.stack = [{ name: 'join', p: {} }]; }
    if (q.get('s') || q.get('u') || q.get('inv') || q.get('r') || q.get('e') || q.get('ref') || q.get('join') || q.get('code') || q.get('state') || q.get('error')) { try { history.replaceState(null, '', location.pathname + (hash ? '#' + hash : '')); } catch (e) { /* 무시 */ } }
    await render();
    if (S.user) { if (kakaoCode && LZ.kakaoReturn) { LZ.kakaoReturn(kakaoCode); return; } LZ.afterLogin(hash); }
  };
  LZ.afterLogin = function (hash) {
    Q.flush();
    var jr = store.get('lz.joinRound'); if (jr) { store.del('lz.joinRound'); LZ.go('round', { code: jr }); return; }
    var je = store.get('lz.joinEvent'); if (je) { store.del('lz.joinEvent'); LZ.go('event', { code: je }); return; }
    var inv = store.get('lz.inv'); if (inv && S.user) { store.del('lz.inv'); LZ.go('find', { inv: inv }); return; }
    if (hash) LZ.goTo(decodeURIComponent(hash));
    LZ.noticePopup && LZ.noticePopup();
    LZ.pushCheck && LZ.pushCheck();
  };
  document.addEventListener('DOMContentLoaded', function () { LZ.boot(); });
})();
