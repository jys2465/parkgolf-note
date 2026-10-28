/* 파크골프 공략수첩 v4 — 앱 뼈대: 설정·저장소·서버 연결·화면 이동·공통 화면 요소·타격감 계산 */
(function () {
  'use strict';
  var LZ = window.LZ = window.LZ || {};
  var C = window.LZ_CONFIG || {};
  LZ.API = C.API || '';
  LZ.APP_URL = C.APP_URL || (location.origin + location.pathname.replace(/[^\/]*$/, ''));
  LZ.VER = window.LZ_VER || '4.0.0';
  var S = LZ.S = { user: null, token: '', me: null, br: '', store: '', pw: null, unit: 'p', g: 'p', h: 'm' };
  var $ = LZ.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = LZ.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = LZ.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  LZ.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ───── 기기 저장소 ───── */
  var store = LZ.store = {
    get: function (k) { try { var v = localStorage.getItem(k); if (v === null && k === 'lz.t') v = sessionStorage.getItem(k); return v; } catch (e) { return null; } },
    set: function (k, v) { try { if (false) { sessionStorage.setItem(k, v); localStorage.removeItem(k); return true; } localStorage.setItem(k, v); return true; } catch (e) { return false; } },
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
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  /* 날짜는 항상 연도까지: 2026-10-27 (시간이 붙으면 2026-10-27 14:05) */
  LZ.fmtDate = function (ts, withTime) { if (!ts) return ''; var d = new Date(Number(ts) || ts); if (isNaN(d)) return String(ts); var s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); if (withTime) s += ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); return s; };
  LZ.fmtYmd = function (ymd) { if (!ymd) return ''; var p = String(ymd).split('-'); return p.length === 3 ? p[0] + '-' + p2(+p[1]) + '-' + p2(+p[2]) : ymd; };
  LZ.won = function (n) { return (Number(n) || 0).toLocaleString('ko-KR') + '원'; };
  LZ.LBL = function (i) { return (i + 1) + '홀'; };

  /* ───── 타격감 계산(서버와 같은 공식) ───── */
  LZ.MODE = { b: '아마추어', p: '프로', m: '마스터' }; LZ.HL = { h: '높게', m: '보통', l: '낮게', x: '더낮게' }; LZ.HLSEG = [['h', '높게'], ['m', '보통'], ['l', '낮게'], ['x', '더낮게']];
  LZ.DEF_PW = { b: { base: 15, step: 5.5 }, p: { base: 17, step: 5 }, m: { base: 19, step: 4.5 }, hl: 0.3 };
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
  LZ.refTxt = function (r) { return r.r === 'c' ? '홀컵' : r.r === 'u' ? (r.t || '직접') : '첫화면'; };
  /** ● 평균과 같음 · ▲ 더 크게 · ▼ 더 작게 (적을 때의 모드 기준) */
  LZ.mark = function (p, s) { var d = p - s; if (Math.abs(d) < 0.5) return '<span class="mk ok">●</span>'; return '<span class="mk ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + '</span>'; };
  LZ.markOf = function (r, hm) { return LZ.mark(r.p, LZ.sugOf(hm, r.g || 'p', r.h || 'm')); };
  LZ.pp = function (d) { return '<span class="pp ' + (d < 0 ? 'u' : d > 0 ? 'o' : 'e') + '">' + (d > 0 ? '+' + d : d === 0 ? 'E' : d) + '</span>'; };
  /* 등급 동그라미: 🔵 블루 · 🔴 레드 · 🟡 골드 · ⚫ 블랙 */
  LZ.dot = function (u) { var t = u && (u.tier || ({ gold: 'gold', blue: 'blue', red: 'red', black: 'black', admin: 'admin' })[u.kind]) || 'blue'; return '<i class="dot ' + t + '" title="' + ({ blue: '블루', red: '레드', gold: '골드', black: '블랙', admin: '관리자' })[t] + '"></i>'; };
  /* ───── 코치마크: 처음 몇 번만, 화면 요소를 동그랗게 비추고 한 줄 설명 ─────
     steps = [{ sel: CSS 선택자, text, pos: 'below'|'above' }] · 요소가 없으면 건너뜀 */
  LZ.coach = function (key, steps) {
    if (store.get('lz.coach.' + key) === '1') return; var i = 0, ov;
    function end() { store.set('lz.coach.' + key, '1'); if (ov) ov.remove(); ov = null; }
    function show() {
      while (i < steps.length && !document.querySelector(steps[i].sel)) i++;
      if (i >= steps.length) { end(); return; }
      var st = steps[i], el = document.querySelector(st.sel), r = el.getBoundingClientRect(), pad = 8;
      if (!ov) { ov = document.createElement('div'); ov.className = 'coach'; document.body.appendChild(ov); }
      var below = st.pos !== 'above' && r.bottom + 140 < window.innerHeight;
      ov.innerHTML = '<div class="coach-hole" style="left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px"></div>' +
        '<div class="coach-tip" style="' + (below ? 'top:' + (r.bottom + pad + 12) + 'px' : 'bottom:' + (window.innerHeight - r.top + pad + 12) + 'px') + '"><div class="coach-n">' + (i + 1) + '/' + steps.length + '</div><p>' + st.text + '</p><div class="row"><button type="button" class="sm2 g" data-coach="skip">그만 보기</button><button type="button" class="sm2" data-coach="next">' + (i === steps.length - 1 ? '알겠어요' : '다음') + '</button></div></div>';
    }
    document.addEventListener('click', function h(e) { var b = e.target.closest('[data-coach]'); if (!b || !ov) return; e.preventDefault(); e.stopPropagation(); if (b.dataset.coach === 'skip') { end(); document.removeEventListener('click', h, true); return; } i++; if (i >= steps.length) { end(); document.removeEventListener('click', h, true); } else show(); }, true);
    setTimeout(show, 350);
  };
  /* 프로필: 사진이 있으면 사진, 없으면 닉네임 첫 글자(닉네임마다 색이 정해짐) */
  var AVC = ['#0B5D4B', '#1D4ED8', '#B45309', '#7C3AED', '#BE185D', '#0F766E', '#4338CA', '#9A3412'];
  LZ.avatar = function (x, cls) { x = x || {}; var nick = x.nick || x.n || '?', h = 0; for (var i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) % 9973; return x.img ? '<img class="av ' + (cls || '') + '" data-img="' + esc(x.img) + '" alt="">' : '<div class="av ' + (cls || '') + '" style="background:' + AVC[h % AVC.length] + '">' + esc(nick.charAt(0)) + '</div>'; };
  /* ───── 간단 글 편집기(공지·소식·문의): 굵게 · 크게 · 빨강/파랑/초록 · 지우기. 서버가 허용하는 태그(b, span.big/c-r/c-b/c-g, br)로만 저장 ───── */
  LZ.richEditor = function (id, html, placeholder) {
    return '<div class="rtb"><button type="button" data-rt="bold"><b>굵게</b></button><button type="button" data-rt="big"><span style="font-size:1.15em">크게</span></button><button type="button" data-rt="c-r" style="color:var(--red)">●</button><button type="button" data-rt="c-b" style="color:var(--blue)">●</button><button type="button" data-rt="c-g" style="color:var(--green)">●</button><button type="button" data-rt="clear">지우기</button></div>' +
      '<div class="rte" id="' + id + '" contenteditable="true" data-ph="' + esc(placeholder || '') + '">' + (html || '') + '</div>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rt]'); if (!b) return; e.preventDefault();
    var ed = b.parentNode.nextElementSibling; if (!ed || !ed.isContentEditable) return; ed.focus();
    var k = b.dataset.rt; try {
      if (k === 'bold') document.execCommand('bold');
      else if (k === 'clear') document.execCommand('removeFormat');
      else if (k === 'big') document.execCommand('fontSize', false, '5');
      else document.execCommand('foreColor', false, { 'c-r': '#DC2626', 'c-b': '#2563EB', 'c-g': '#15803D' }[k]);
    } catch (x) { /* 지원 안 되는 브라우저 */ }
  });
  LZ.richRead = function (id) {
    var ed = $('#' + id); if (!ed) return '';
    function walk(n) {
      if (n.nodeType === 3) return esc(n.nodeValue);
      if (n.nodeType !== 1) return '';
      var tag = n.tagName.toLowerCase(), inner = Array.prototype.map.call(n.childNodes, walk).join('');
      if (tag === 'br') return '<br>';
      if (tag === 'b' || tag === 'strong') return '<b>' + inner + '</b>';
      if (tag === 'div' || tag === 'p') return (inner === '<br>' ? '' : inner) + '<br>';
      var cls = '', st = n.getAttribute('style') || '', col = (n.getAttribute('color') || '').toLowerCase(), size = n.getAttribute('size'), cl = n.getAttribute('class') || '';
      if (/\bbig\b/.test(cl) || size === '5' || size === '6' || size === '7' || /font-size:\s*(x-large|xx-large|large|1\.[2-9]|[2-9]\d)/.test(st)) cls = 'big';
      if (/c-r/.test(cl) || col === '#dc2626' || /color:\s*(rgb\(220, 38, 38\)|#dc2626)/i.test(st)) cls = 'c-r';
      else if (/c-b/.test(cl) || col === '#2563eb' || /color:\s*(rgb\(37, 99, 235\)|#2563eb)/i.test(st)) cls = 'c-b';
      else if (/c-g/.test(cl) || col === '#15803d' || /color:\s*(rgb\(21, 128, 61\)|#15803d)/i.test(st)) cls = 'c-g';
      if (/font-weight:\s*(bold|[6-9]00)/.test(st)) inner = '<b>' + inner + '</b>';
      return cls ? '<span class="' + cls + '">' + inner + '</span>' : inner;
    }
    return Array.prototype.map.call(ed.childNodes, walk).join('').replace(/(<br>)+$/, '');
  };
  LZ.stars = function (n) { n = Math.max(1, Math.min(5, n | 0)) || 3; return '<span class="star">' + '★'.repeat(n) + '<s>' + '★'.repeat(5 - n) + '</s></span>'; };

  /* ───── 공통 화면 요소 ───── */
  var toastT = null;
  LZ.toast = function (msg, ms, actLabel, actFn) {
    var t = $('#toast'); if (!t) return; t.innerHTML = esc(msg) + (actLabel ? '<button type="button" id="toastAct">' + esc(actLabel) + '</button>' : ''); t.classList.add('on'); t.classList.toggle('act', !!actLabel);
    if (actLabel) { var b = $('#toastAct'); if (b) b.onclick = function () { t.classList.remove('on'); actFn && actFn(); }; }
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2600);
  };
  LZ.sheet = function (html, o) {
    o = o || {}; if (!o.stack) LZ.closeSheet();
    var d = document.createElement('div'); d.className = 'sheet'; d.innerHTML = '<div class="pane">' + html + (o.noClose ? '' : '<button type="button" class="btn g" data-act="sheetClose">닫기</button>') + '</div>';
    d.addEventListener('click', function (e) { if (e.target === d && !o.noClose) LZ.closeSheet(); });
    $('#layer').appendChild(d); LZ.enhance(d); return d;
  };
  LZ.closeSheet = function () { $$('#layer .sheet').forEach(function (x) { x.parentNode.removeChild(x); }); };
  /* 콤보박스(select) → 큰 목록 창: 화면·시트가 그려질 때마다 자동으로 바꿔요 */
  LZ.enhance = function (root) {
    $$('select', root || document).forEach(function (sel) {
      if (sel.dataset.pick) return; sel.dataset.pick = '1'; sel.hidden = true;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pickbtn' + (sel.classList.contains('in') ? '' : ' sm');
      var paint = function () { var o = sel.options[sel.selectedIndex]; b.innerHTML = '<span>' + esc(o ? o.textContent : '') + '</span><i>▾</i>'; };
      paint(); sel.parentNode.insertBefore(b, sel.nextSibling);
      b.addEventListener('click', function () {
        var opts = Array.prototype.map.call(sel.options, function (o) { return o; });
        var d = document.createElement('div'); d.className = 'sheet pick';
        d.innerHTML = '<div class="pane"><h2>' + esc(sel.dataset.title || (sel.previousElementSibling && sel.previousElementSibling.classList.contains('lb') ? sel.previousElementSibling.textContent : '고르기')) + '</h2>' + opts.map(function (o, i) { return '<button type="button" class="opt ' + (i === sel.selectedIndex ? 'on' : '') + '" data-i="' + i + '"><b>' + esc(o.textContent) + '</b>' + (i === sel.selectedIndex ? '<span>✓ 지금</span>' : '') + '</button>'; }).join('') + '<button type="button" class="btn g" data-pickclose="1">닫기</button></div>';
        d.addEventListener('click', function (e) { var x = e.target.closest('[data-i]'); if (x) { sel.selectedIndex = +x.dataset.i; paint(); sel.dispatchEvent(new Event('change', { bubbles: true })); d.remove(); LZ.buzz(); return; } if (e.target === d || e.target.closest('[data-pickclose]')) d.remove(); });
        $('#layer').appendChild(d);
      });
      sel.addEventListener('change', paint);
    });
  };
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
      $('#layer').appendChild(d); LZ.enhance(d);
      if (o.focus) { var f = $(o.focus, d); if (f) setTimeout(function () { f.focus(); }, 50); }
    });
  };
  LZ.confirm = function (title, body, yes, kind) { return LZ.dialog({ title: title, body: body, cancel: false, buttons: [{ label: yes || '확인', kind: kind || 'y', value: true }, { label: '취소', kind: 'g', value: false }] }); };
  LZ.busy = function (on, msg) { var b = $('#busy'); if (b) b.parentNode.removeChild(b); if (!on) return; b = document.createElement('div'); b.id = 'busy'; b.className = 'busy'; b.innerHTML = '<div class="spin" style="border-color:rgba(255,255,255,.4);border-top-color:#fff"></div><div>' + esc(msg || '잠시만요…') + '</div>'; $('#layer').appendChild(b); };
  LZ.errText = function (e) { return (e && e.message) || '문제가 생겼어요. 잠시 뒤에 다시 해 주세요.'; };
  /* 상단 막대는 단순하게: 뒤로 · 화면 이름 · ? · 🔔 만. 긴 제목(코스·클럽 이름)과 동작 단추는 막대 아래 줄(.subh)로 내려요 */
  var BAR = { holes: '코스', play: 'PLAY', edit: '홀 기록', courseEdit: '코스 정보', courses: '스크린 공략', club: '클럽', round: '점수판', rall: '전체 점수', rres: '라운드 결과', event: '상황판', evInvite: '초대', awards: '시상식', members: '회원', notices: '공지·소식', faqAdmin: '자주 묻는 질문', reg: '새 코스 등록', capDash: '캡틴 대시보드', tv: 'TV' };
  LZ.hdr = function (title, o) {
    o = o || {};
    var name = LZ.cur().name, sub = !o.inBar && (!!o.right || String(title).length > 9), bar = sub ? (o.bar || BAR[name] || title) : title;
    return '<div class="top">' + (o.back ? '<button type="button" class="ib" data-act="back">‹ 뒤로</button>' : '') + '<h2>' + esc(bar) + '</h2>' + (o.inBar ? o.right || '' : '') +
      (LZ.HELP && LZ.HELP[name] ? '<button type="button" class="ib help" data-act="help" aria-label="사용 안내">?</button>' : '') +
      (S.user && S.user.kind === 'admin' && !o.noBell ? '<button type="button" class="ib bell" data-go="noti">🔔' + (S.me && S.me.noti ? '<i>' + S.me.noti + '</i>' : '') + '</button>' : (S.user && !o.noBell && S.me && S.me.noti ? '<button type="button" class="ib bell" data-go="noti">🔔<i>' + S.me.noti + '</i></button>' : '')) +
      '</div>' + (sub ? '<div class="subh">' + (bar !== title ? '<h2>' + esc(title) + '</h2>' : '') + (o.right ? '<div class="acts">' + o.right + '</div>' : '') + '</div>' : '');
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
  var inflight = 0; function bar(on) { inflight += on ? 1 : -1; var b = $('#pbar'); if (!b) { b = document.createElement('div'); b.id = 'pbar'; document.body.appendChild(b); } b.classList.toggle('on', inflight > 0); }
  LZ.api = async function (a, body, o) {
    o = o || {}; var tries = o.retry === undefined ? 1 : o.retry;
    bar(true);
    try { for (var i = 0; ; i++) {
      try { return await post(a, body, o); }
      catch (e) {
        if (e.code === 'queue') { await LZ.queueWait(e.data); continue; }
        if (e.code === 'auth' && !o.noAuth) { await LZ.sessionLost(e); throw e; }
        if (e.code === 'sure' && S.user && S.user.kind === 'admin' && !o.noSure) { if (await LZ.sureDialog()) continue; throw e; }
        if ((e.code === 'net' || e.code === 'server' || e.code === 'busy') && i < tries) { await LZ.sleep(800 + i * 700); continue; }
        throw e;
      }
    } } finally { bar(false); }
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
  LZ.clearSession = function () { LZ.cacheDrop(); store.del('lz.k.me'); S.user = null; S.token = ''; S.me = null; store.del('lz.t'); LZ.rt && LZ.rt.stop(); };
  LZ.setSession = function (r) { S.token = r.token; S.user = r.user; store.set('lz.t', r.token); if (r.pw) S.pw = r.pw; };
  function applyMe(r) { S.me = r; S.user = r.user; S.br = r.br; S.store = r.store; S.pw = r.pw; S.unit = r.user.unit || 'p'; if (r.appVer && LZ.pwa && LZ.pwa.verCheck) LZ.pwa.verCheck(r.appVer); }
  LZ.refreshMe = async function () { var r = await LZ.api('me', {}); applyMe(r); try { store.setJSON('lz.k.me', { t: Date.now(), d: r }); } catch (e) { /* 무시 */ } return r; };

  /* ───── 마지막 응답 저장: 화면을 열 때 먼저 보여 주고 뒤에서 새로 받음 ───── */
  LZ.cacheGet = function (k) { try { var x = store.json('lz.k.' + (S.user ? S.user.uid : '') + '.' + k); return x && Date.now() - x.t < 7 * 86400000 ? x.d : null; } catch (e) { return null; } };
  LZ.cacheSet = function (k, d) { try { store.setJSON('lz.k.' + (S.user ? S.user.uid : '') + '.' + k, { t: Date.now(), d: d }); } catch (e) { /* 용량 */ } };
  LZ.cacheDrop = function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('lz.k.') === 0) localStorage.removeItem(k); }); } catch (e) { /* 무시 */ } };
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
    try { await s.show(cur.p || {}, root, alive); if (alive()) { LZ.enhance(root); if (LZ.fillImgs) LZ.fillImgs(root); } }
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
      else { LZ.cur().y = window.scrollY; LZ.stack.push({ name: name, p: p || {} }); history.pushState({ i: LZ.stack.length - 1 }, '', location.pathname + location.search); }
    } finally { navBusy = false; }
    await render(); return true;
  };
  LZ.back = function () { if (LZ.stack.length > 1) history.back(); else LZ.go('home', {}, { reset: true }); };
  window.addEventListener('popstate', async function () {
    if (LZ.stack.length <= 1) return;
    if (LZ.guard && LZ.guard.dirty && LZ.guard.dirty()) { var ok = await LZ.guard.ask(); if (!ok) { history.pushState({ i: LZ.stack.length - 1 }, '', location.pathname + location.search); return; } }
    LZ.guard = null; LZ.closeSheet(); LZ.stack.pop(); var y = LZ.cur().y || 0; await render(); if (y) requestAnimationFrame(function () { window.scrollTo(0, y); });
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
    var map = { home: ['home'], me: ['me'], pay: ['pay'], join: ['join'], courses: ['courses'], club: ['club', { id: m[2] }], reqs: ['club', { id: m[2], reqs: 1 }], course: ['holes', { id: m[2] }], round: ['round', { id: m[2] }], event: ['event', { code: m[2] }], find: ['find'], qna: ['qnaList'], notices: ['notices'], dash: ['dash'], members: ['members'], pwreq: ['pwreqs'], refund: ['refunds'], fb: ['feedbacks'] };
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
  var HOLD = /^(edLr|edP|sc|regLr:|regP:)/, holdT = null, holdI = null, held = false;
  function holdStop() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('[data-act]'); if (!a || !HOLD.test(a.dataset.act) || a.disabled) return;
    held = false; holdStop();
    holdT = setTimeout(function () { holdI = setInterval(function () { held = true; var fn = LZ.act[a.dataset.act]; if (fn) { LZ.buzz(); Promise.resolve(fn(a, a.dataset.v, e)).catch(function () {}); } else { held = false; a.click(); held = true; } }, 160); }, 600);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { document.addEventListener(ev, function () { holdStop(); if (held) setTimeout(function () { held = false; }, 400); }, true); });   // 길게 누른 뒤 click 이 안 오는 휴대폰에서 다음 탭이 먹히는 것 방지
  document.addEventListener('click', function (e) { if (held) { held = false; var a = e.target.closest('[data-act]'); if (a && HOLD.test(a.dataset.act)) { e.stopImmediatePropagation(); e.preventDefault(); } } }, true);
  LZ.act.help = function () { var h = LZ.HELP[LZ.cur().name]; if (!h) return; LZ.sheet('<h2>' + esc(h.t) + '</h2>' + (h.img ? '<img src="assets/guide/' + h.img + '.webp" alt="" style="width:100%;border-radius:14px;border:1px solid var(--line);margin:4px 0 10px">' : '') + h.html); };
  LZ.act.sheetClose = function () { LZ.closeSheet(); };
  LZ.act.retry = function () { render(); };
  LZ.flip = function (el) { if (el && el.classList.contains('sw')) { el.classList.toggle('on'); el.setAttribute('aria-pressed', el.classList.contains('on')); return true; } return false; };
  LZ.act.theme = function (el) { LZ.theme.set(!LZ.theme.get()); if (!LZ.flip(el)) LZ.redraw(); };
  LZ.act.big = function (el) { LZ.big.set(!LZ.big.get()); LZ.toast(LZ.big.get() ? '글씨를 크게 했어요' : '보통 글씨로 했어요'); if (!LZ.flip(el)) LZ.redraw(); };
  LZ.act.buzz = function (el) { store.set('lz.buzz', store.get('lz.buzz') === '0' ? '1' : '0'); if (!LZ.flip(el)) LZ.redraw(); };
  LZ.act.logout = async function () { if (!(await LZ.confirm('로그아웃할까요?', '다시 들어올 때 닉네임과 비밀번호를 넣어요.', '로그아웃'))) return; try { await post('logout', {}); } catch (e) { /* 무시 */ } LZ.clearSession(); LZ.go('login', {}, { reset: true }); };
  LZ.act.copy = async function (el, v) { try { await navigator.clipboard.writeText(v); LZ.toast('복사했어요'); } catch (e) { LZ.toast('복사하지 못했어요. 길게 눌러 복사해 주세요.'); } };
  LZ.act.share = async function (el, v) { var o = JSON.parse(v); try { if (navigator.share) { await navigator.share(o); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText((o.text ? o.text + '\n' : '') + (o.url || '')); LZ.toast('내용을 복사했어요. 카톡에 붙여 넣어 주세요.'); } catch (e2) { LZ.toast('공유하지 못했어요.'); } };
  /** 초대 시트 하나: 글+링크를 카카오톡 / 문자 / QR 로. (그림은 안 붙임 — 링크 미리보기 카드가 그림을 보여 줌) */
  LZ.inviteSheet = function (title, text, url, extra) {
    var full = text + '\n' + url;
    LZ.sheet('<h2>' + esc(title) + '</h2><div class="box" style="white-space:pre-wrap;font-size:var(--t1);margin-top:0">' + esc(full) + '</div>' +
      '<button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: title, text: text, url: url })) + '\'>카카오톡으로 보내기</button>' +
      '<div class="row" style="margin-top:8px"><a class="btn o" style="margin:0" href="sms:?&body=' + encodeURIComponent(full) + '">문자로</a><button type="button" class="btn o" style="margin:0" data-act="inviteQrShow" data-v="' + esc(url) + '">QR 보기</button></div>' +
      '<button type="button" class="btn g sm" data-act="copy" data-v="' + esc(full) + '">글 복사</button>' + (extra || ''));
  };
  LZ.act.inviteQrShow = function (el, url) { LZ.sheet('<h2>QR</h2><p class="muted center">휴대폰 카메라로 찍으면 바로 열려요.</p><div class="qr" id="qrbox"></div><p class="center muted small">' + esc(url) + '</p>'); LZ.qr($('#qrbox'), url); };
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
    if (q.get('inv') === '0') { store.del('lz.inv'); store.set('lz.noclub', '1'); } else if (q.get('inv')) { store.set('lz.inv', q.get('inv')); store.del('lz.noclub'); }
    if (q.get('ref')) store.set('lz.ref', q.get('ref'));
    if (q.get('r')) store.set('lz.joinRound', q.get('r'));
    if (q.get('e') && q.get('tv')) { LZ.tvCode = q.get('e'); }
    else if (q.get('e')) store.set('lz.joinEvent', q.get('e') + (q.get('t') ? ':' + q.get('t') : ''));
    if (q.get('join')) store.set('lz.joinNow', '1');                                   // 홍보 안내문 링크: 가입 화면 바로
    var kakaoCode = store.get('lz.kakaoBack') === '1' && q.get('code') ? q.get('code') : '';   // 카카오 연결에서 돌아옴
    if (kakaoCode) store.del('lz.kakaoBack');
    LZ.stack = [{ name: 'login', p: {} }];
    if (t) {
      S.token = t;
      var cm = store.json('lz.k.me');
      if (cm && cm.d && cm.d.user && Date.now() - cm.t < 7 * 86400000) {                      // 저장해 둔 내 정보로 바로 열고, 뒤에서 새로 받음
        applyMe(cm.d); LZ.stack = [{ name: 'home', p: {} }];
        LZ.refreshMe().then(function () { if (LZ.cur().name === 'home') LZ.redraw(); else LZ.paintBell(); }).catch(function (e) { if (e.code === 'auth') LZ.sessionLost(e); });
      } else {
        try { await LZ.refreshMe(); LZ.stack = [{ name: 'home', p: {} }]; }
        catch (e) { if (e.code === 'auth') { LZ.clearSession(); if (e.data && e.data.pinChanged) LZ.pinChangedNote = true; } else { S.token = t; LZ.stack = [{ name: 'offline', p: { err: e } }]; } }
      }
    }
    if (!S.user && store.get('lz.joinNow') === '1') { store.del('lz.joinNow'); LZ.stack = [{ name: 'join', p: {} }]; }
    if (q.get('s') || q.get('u') || q.get('inv') || q.get('r') || q.get('e') || q.get('t') || q.get('ref') || q.get('join') || q.get('code') || q.get('state') || q.get('error')) { try { history.replaceState(null, '', location.pathname + (hash ? '#' + hash : '')); } catch (e) { /* 무시 */ } }
    if (LZ.tvCode) LZ.stack = [{ name: 'tv', p: { code: LZ.tvCode } }];
    await render();
    if (S.user) { if (kakaoCode && LZ.kakaoReturn) { LZ.kakaoReturn(kakaoCode); return; } LZ.afterLogin(hash); }
  };
  LZ.afterLogin = function (hash) {
    Q.flush();
    var jr = store.get('lz.joinRound'); if (jr) { store.del('lz.joinRound'); LZ.go('round', { code: jr }); return; }
    var je = store.get('lz.joinEvent'); if (je) { store.del('lz.joinEvent'); var jp = je.split(':'); LZ.go('evEnter', { code: jp[0], t: jp[1] ? +jp[1] : 0 }); return; }
    var inv = store.get('lz.inv'); if (inv && S.user) { store.del('lz.inv'); LZ.go('find', { inv: inv }); return; }
    if (hash) LZ.goTo(decodeURIComponent(hash));
    LZ.noticePopup && LZ.noticePopup();
    if (LZ.pwa && LZ.pwa.installNudge) LZ.pwa.installNudge();
    LZ.pushCheck && LZ.pushCheck();
  };
  document.addEventListener('DOMContentLoaded', function () { LZ.boot(); });
})();
