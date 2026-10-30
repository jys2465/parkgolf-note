/* 파크골프 공략수첩 v4 — 앱 뼈대: 설정·저장소·서버 연결·화면 이동·공통 화면 요소·볼스피드 계산 */
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
  LZ.big = { get: function () { return document.body.classList.contains('big'); }, set: function (on) { document.body.classList.toggle('big', !!on); store.set('lz.big', on ? '1' : '0'); $$('[data-act="big"]').forEach(function (b) { b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); } };
  /** 선 아이콘(index.html 의 SVG 묶음 #i-이름). 레벨 배지만 그림 글자를 써요 */
  LZ.ic = function (name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; };
  LZ.buzz = function () { if (store.get('lz.buzz') === '0') return; try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* 무시 */ } };
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  /* 날짜는 항상 연도까지: 2026-10-27 (시간이 붙으면 2026-10-27 14:05) */
  LZ.fmtDate = function (ts, withTime) { if (!ts) return ''; var d = new Date(Number(ts) || ts); if (isNaN(d)) return String(ts); var s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); if (withTime) s += ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); return s; };
  LZ.fmtYmd = function (ymd) { if (!ymd) return ''; var p = String(ymd).split('-'); return p.length === 3 ? p[0] + '-' + p2(+p[1]) + '-' + p2(+p[2]) : ymd; };
  LZ.won = function (n) { return (Number(n) || 0).toLocaleString('ko-KR') + '원'; };
  LZ.LBL = function (i) { return (i + 1) + '홀'; };

  /* ───── 볼스피드 계산(서버와 같은 공식, v7 #9 탄도 5단계 % 방식) ─────
     총 비거리 = (기준 거리 + (볼스피드 − 모드 기준) × 1당 비거리) × (1 + 탄도 단계 × 간격%)
     탄도 코드: u 더높게 +2 · h 높게 +1 · m 보통 0 · l 낮게 −1 · x 더낮게 −2 (예전 4단계 h/m/l/x 는 뜻 그대로)
     손으로 적는 값은 0.5 단위, 환산한 값은 소수점 1자리(반올림 없이 막대 위 점으로 보여 줌, #31) */
  LZ.MODE = { b: '아마추어', p: '프로', m: '마스터' }; LZ.HL = { u: '더높게', h: '높게', m: '보통', l: '낮게', x: '더낮게' }; LZ.HLSEG = [['u', '더높게'], ['h', '높게'], ['m', '보통'], ['l', '낮게'], ['x', '더낮게']];
  LZ.HLV = { u: 2, h: 1, m: 0, l: -1, x: -2 };
  LZ.DEF_PW = { d0: 50, gap: 3, b: { base: 15, step: 5.5 }, p: { base: 17, step: 5 }, m: { base: 19, step: 4.5 } };
  LZ.pw = function () { var p = S.pw; return p && p.p && p.gap !== undefined ? p : LZ.DEF_PW; };
  LZ.half = function (x) { return Math.round(Number(x) * 2) / 2; };
  LZ.r1 = function (x) { return Math.round(Number(x) * 10) / 10; };
  LZ.clampP = function (x) { return Math.max(8, Math.min(40, x)); };
  LZ.hlMul = function (h, pw) { pw = pw || LZ.pw(); return 1 + (LZ.HLV[h] || 0) * pw.gap / 100; };
  LZ.stepOf = function (g, h) { var pw = LZ.pw(); return pw[g].step * LZ.hlMul(h, pw); };
  LZ.distRaw = function (p, g, h, pw) { pw = pw || LZ.pw(); return (pw.d0 + (p - pw[g].base) * pw[g].step) * LZ.hlMul(h, pw); };
  LZ.distOf = function (p, g, h) { return LZ.r1(LZ.distRaw(p, g, h)); };
  LZ.sugRaw = function (m, g, h, pw) { pw = pw || LZ.pw(); return pw[g].base + (m / LZ.hlMul(h, pw) - pw.d0) / pw[g].step; };
  /** 홀 거리 → 기준 볼스피드(소수점 1자리) */
  LZ.sugOf = function (m, g, h) { return LZ.clampP(LZ.r1(LZ.sugRaw(m, g, h))); };
  LZ.convRaw = function (p, g, h, g2, h2) { return LZ.sugRaw(LZ.distRaw(p, g, h), g2, h2); };
  /** 기록 환산: 같은 거리가 나오는 다른 모드·탄도의 볼스피드(소수점 1자리) */
  LZ.conv = function (p, g, h, g2, h2) { return g === g2 && h === h2 ? p : LZ.clampP(LZ.r1(LZ.convRaw(p, g, h, g2, h2))); };
  LZ.convTxt = function (p, g, h, g2, h2) { return LZ.bsTxt(LZ.conv(p, g, h, g2, h2)); };
  LZ.fmtP = function (n) { return n >= 40 ? 'Full' : String(LZ.r1(n)).replace(/\.0$/, ''); };
  LZ.fmtM = function (m) { return String(LZ.r1(m)).replace(/\.0$/, ''); };
  /** 볼스피드 표시(#31): 정수면 "~17"(16━━●17, 17까지), 아니면 "16~"(16━●━17, 16 넘고 17 전, 점은 계산된 자리) */
  LZ.bsParts = function (v) {
    v = LZ.r1(v); if (v >= 40) return { t: 'Full', lo: 39, hi: 40, pos: 100, int: true, v: 40 };
    var lo = Math.floor(v + 1e-9), int = Math.abs(v - lo) < 1e-9;
    return int ? { t: '~' + v, lo: v - 1, hi: v, pos: 100, int: true, v: v } : { t: lo + '~', lo: lo, hi: lo + 1, pos: Math.round((v - lo) * 100), int: false, v: v };
  };
  LZ.bsTxt = function (v) { return LZ.bsParts(v).t; };
  /** cls: '' 보통 · 'sm' 작게 · 'lg' 치기 화면 크게 · 'xl' 내 기록만 */
  LZ.bs = function (v, cls) { var b = LZ.bsParts(v); return '<span class="vs ' + (cls || '') + '" data-bs="' + b.v + '"><b>' + b.t + '</b><span class="vr"><span>' + b.lo + '</span><span class="vb"><i style="left:' + b.pos + '%"></i></span><span>' + b.hi + '</span></span></span>'; };
  /** 기준과 차이(#27): 1 이내 초록 ● · 1 넘게 많으면 ▲(빨강) · 적으면 ▼(파랑) + 차이 */
  LZ.dvOf = function (p, s) { var d = LZ.r1(p - s); return Math.abs(d) <= 1 + 1e-9 ? 0 : d; };
  LZ.dv = function (p, s) { var d = LZ.dvOf(p, s); return !d ? '<span class="dv ok" title="기준과 1 이내"></span>' : '<span class="dv ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + ' ' + LZ.fmtP(Math.abs(d)) + '</span>'; };
  /** 홀 번호(앱 전체 같은 모양): 크게·진하게·기울인 에메랄드 숫자 + 작은 "홀" */
  LZ.hn = function (n, cls) { return '<b class="hn' + (cls ? ' ' + cls : '') + '">' + n + '<small>홀</small></b>'; };
  /* 좌우: 0 = "그대로"(희미하게) · 왼쪽은 빨강 · 오른쪽은 파랑 */
  LZ.lrPlain = function (r) { var n = r.n | 0; return !n ? '그대로' : (r.d === 'L' ? '좌 ' : '우 ') + n; };
  LZ.lrTxt = function (r) { var n = r.n | 0; return '<span class="lrv ' + (!n ? 'c' : r.d === 'L' ? 'l' : 'r') + '">' + LZ.lrPlain(r) + '</span>'; };
  LZ.refTxt = function (r) { return r.r === 'c' ? '홀컵' : r.r === 'u' ? (r.t || '직접') : '첫화면'; };
  /** 예전 표시(● ▲ ▼만) — 다른 화면 호환 */
  LZ.mark = function (p, s) { var d = LZ.dvOf(p, s); if (!d) return '<span class="mk ok">●</span>'; return '<span class="mk ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + '</span>'; };
  LZ.markOf = function (r, hm) { return LZ.mark(r.p, LZ.sugOf(hm, r.g || 'p', r.h || 'm')); };
  /** 레벨(적립 포인트, #25): 새싹·버디·이글·봉황·지존 — 기준 점수는 서버 설정(lv) */
  LZ.LVN = [['🌱', '새싹'], ['🐦', '버디'], ['🦅', '이글'], ['🪶', '봉황'], ['👑', '지존']];
  LZ.lvOf = function (pts, th) { th = th || [0, 100, 500, 1500, 5000]; var k = 0; for (var i = 0; i < th.length; i++) if ((pts || 0) >= th[i]) k = i; return k; };
  LZ.lvBadge = function (pts, th) { var x = LZ.LVN[LZ.lvOf(pts, th || (S.me && S.me.lv))]; return '<span class="lvb">' + x[0] + ' ' + x[1] + '</span>'; };
  /** 이름 옆 레벨 배지 + 적립 포인트(모은 포인트) — 목록용 */
  LZ.lvPts = function (pts, th) { return LZ.lvBadge(pts, th) + ' <span class="lvp">' + Number(pts || 0).toLocaleString('ko-KR') + 'P</span>'; };
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
  /** 이름 + 님(손님 이름이 이미 "…님"으로 끝나면 그대로: 박손님 → 박손님) */
  LZ.nim = function (n) { n = n === undefined || n === null ? '' : String(n); return /님$/.test(n) ? n : n + '님'; };
  LZ.nimE = function (n) { return LZ.esc(LZ.nim(n)); };
  /** 끝나기 전 알림 날(관리자 설정) → "30일·7일 전과 당일" */
  LZ.remindTxt = function (a) { a = (a || [30, 7, 0]).slice().sort(function (x, y) { return y - x; }); var d = a.filter(function (x) { return x > 0; }).map(function (x) { return x + '일'; }), z = a.indexOf(0) >= 0; return d.length ? d.join('·') + ' 전' + (z ? '과 당일' : '') : z ? '당일' : '정한 날'; };
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
  /* 상단 막대(v7): 뒤로 · 화면 이름(길면 줄임표) · 가+ 큰 글씨 · ◐ 보기 · ? 도움 · 🔔 알림 · (홈·내 정보만) 로그아웃.
     단추는 34~36px 고정이라 알림 숫자가 잘리지 않고, 제목만 줄어요. 긴 제목(코스·클럽 이름)과 동작 단추는 막대 아래 줄(.subh)로 내려요 */
  var BAR = { holes: '내 수첩', play: '치기', edit: '홀 기록', courseEdit: '코스 정보', courses: '스크린 공략', club: '클럽', round: '점수판', rall: '전체 점수', rres: '라운드 결과', event: '상황판', evInvite: '초대', awards: '시상식', members: '회원', notices: '공지·소식', faqAdmin: '자주 묻는 질문', reg: '새 코스 등록', capDash: '캡틴 대시보드', tv: 'TV' };
  LZ.topBtns = function (o) {
    o = o || {}; var big = LZ.big.get(), name = LZ.cur().name, n = S.me && S.me.noti ? S.me.noti : 0;
    return (o.sound || '') + '<button type="button" class="tb ga' + (big ? ' on' : '') + '" data-act="big" aria-pressed="' + (big ? 'true' : 'false') + '" aria-label="큰 글씨" title="큰 글씨">가<sup>+</sup></button>' +
      '<button type="button" class="tb" data-act="viewPop" aria-label="보기 설정" title="보기 설정">' + LZ.ic('moon') + '</button>' +
      (o.noHelp ? '' : '<button type="button" class="tb" data-act="help" aria-label="도움" title="도움">' + LZ.ic('help') + '</button>') +
      (S.user && !o.noBell ? '<button type="button" class="tb bell" data-go="noti" aria-label="알림' + (n ? ' ' + n + '개' : '') + '" title="알림">' + LZ.ic('bell') + (n ? '<i>' + (n > 99 ? '99+' : n) + '</i>' : '') + '</button>' : '') +
      (S.user && o.logout ? '<button type="button" class="tb" data-act="logout" aria-label="로그아웃" title="로그아웃">' + LZ.ic('logout') + '</button>' : '');
  };
  LZ.hdr = function (title, o) {
    o = o || {};
    var name = LZ.cur().name, sub = !o.nosub && (!!o.right || String(title).length > 9), bar = sub ? (o.bar || BAR[name] || title) : title;
    return '<div class="top">' + (o.back ? '<button type="button" class="bk" data-act="back" aria-label="' + esc(o.backLabel || '뒤로') + '">' + LZ.ic('back') + '<span>' + esc(o.backLabel || '뒤로') + '</span></button>' : '') + '<h2>' + esc(bar) + '</h2>' + LZ.topBtns(o) +
      '</div>' + (sub ? '<div class="subh">' + (bar !== title ? '<h2>' + esc(title) + '</h2>' : '') + (o.right ? '<div class="acts">' + o.right + '</div>' : '') + '</div>' : '');
  };
  LZ.skeleton = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="sk" style="width:' + (60 + (i * 13) % 40) + '%"></div>'; return '<div class="wrap">' + s + '</div>'; };
  LZ.seg = function (opts, on, act, cls) { return '<div class="seg ' + (cls || '') + '">' + opts.map(function (x) { return '<button type="button" class="' + (on === x[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>'; };
  LZ.sw = function (on, act, arg, dis) { return '<button type="button" class="sw ' + (on ? 'on' : '') + '" data-act="' + act + '" data-v="' + esc(arg || '') + '"' + (dis ? ' disabled' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '"></button>'; };
  /* 파 단추: 3·4·5만(#8). 예전에 6으로 저장된 홀은 그대로 보이게 6도 함께 */
  LZ.parOpts = function (cur) { var o = [['3', '3'], ['4', '4'], ['5', '5']]; if (String(cur) === '6') o.push(['6', '6']); return o; };
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
        if (e.code === 'kidreq' && S.user) { S.user.needKid = 1; LZ.go('kakaoAsk', {}, { reset: true }); throw e; }   // v7.0 서버가 카카오 확인 먼저를 요구
        if (e.code === 'black' && S.user && S.user.kind !== 'black') { S.user.kind = 'black'; LZ.refreshMe().then(function () { LZ.go('blackNote', {}, { reset: true }); }).catch(function () {}); throw e; }
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
  LZ.clearSession = function () { LZ.cacheDrop(); store.del('lz.k.me'); S.user = null; S.token = ''; S.me = null; store.del('lz.t'); LZ.rt && LZ.rt.stop(); LZ.nrt && LZ.nrt.stop(); document.body.classList.remove('kb'); };
  LZ.setSession = function (r) { S.token = r.token; S.user = r.user; store.set('lz.t', r.token); if (r.pw) S.pw = r.pw; };
  function applyMe(r) { S.me = r; S.user = r.user; S.br = r.br; S.store = r.store; S.pw = r.pw; S.unit = r.user.unit || 'p'; if (r.appVer && LZ.pwa && LZ.pwa.verCheck) LZ.pwa.verCheck(r.appVer); if (r.rt) NR.start(r.rt); LZ.rememberMe(r.user); }
  /* 이 휴대폰으로 들어왔던 분: 다음 로그인 화면에 프로필 사진·닉네임을 미리 보여 줘요(사진은 작게 줄여 이 휴대폰에만) */
  LZ.rememberMe = function (u) {
    if (!u || !u.nick) return; var old = store.json('lz.who') || {};
    var o = { nick: u.nick, img: u.img || '', av: old.nick === u.nick && old.img === (u.img || '') ? old.av || '' : '' };
    store.setJSON('lz.who', o); store.set('lz.nick', u.nick);
    if (o.img && !o.av && /^[\w-]{4,80}$/.test(o.img)) LZ.api('imgGet', { id: o.img }).then(function (r) { if (r && r.data && r.data.length < 60000) { o.av = r.data; store.setJSON('lz.who', o); } }).catch(function () {});
    else if (o.img && /^(data:image|assets\/)/.test(o.img)) { o.av = o.img; store.setJSON('lz.who', o); }
  };
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
  LZ.paintSync = function () { var b = $('#syncbar'); if (!b) return; var n = Q.size(); b.hidden = !n && navigator.onLine; b.textContent = n ? '신호 약함 · ' + n + '건을 휴대폰에 저장했어요. 연결되면 보내요' : '인터넷이 끊겼어요 · 저장은 돼요'; };
  window.addEventListener('online', function () { LZ.paintSync(); Q.flush(); });
  window.addEventListener('offline', LZ.paintSync);
  setInterval(function () { Q.flush(); }, 15000);

  /* ───── v7.0.1 필요할 때 불러오기: 관리자(admin.js)·단체 대회(event.js)·도움말(help.js)·QR(qrcode.js)은
     그 화면·단추를 처음 쓸 때 받아요(첫 화면이 가벼워짐). 서비스 워커가 미리 저장해 두어서 인터넷이 없어도 열려요.
     ★ admin.js·event.js 에 화면(LZ.screens.X)이나 단추(LZ.act.X)를 새로 만들면 아래 목록에도 이름을 넣으세요(v701.mjs 가 검사해요) */
  var MODS = { admin: 'js/admin.js', event: 'js/event.js', help: 'js/help.js', qr: 'vendor/qrcode.js' }, modP = {}, modDone = {};
  function lazyMap(o) { var m = {}; Object.keys(o).forEach(function (k) { o[k].split(' ').forEach(function (n) { m[n] = k; }); }); return m; }
  var LAZY_SCR = LZ.lazyScr = lazyMap({ admin: 'adminCfg adminGroup adminPacks adminSeats dash faqAdmin firstAdmin goldList log members moimAll pays promo ptGive ptOwe pwreqs refunds', event: 'awards ceremony evEnter evInvite evMake event events tv' });
  var LAZY_ACT = LZ.lazyAct = lazyMap({ admin: 'cfgJoin cfgPt cfgPw cfgQna cfgSave cfgSeat cfgSeatTxt faqDel faqEdit faqMove faqReset faqSave fsReset fsSave goldOk logoReset mMore mNew mNewGo mNewKind mOp mOpen mPurge mPurgeOk mbGo moimDrop paClear paGo paOwe paPick paQuick paReset paSign payNo payOk pkD pkDel pkExt pkGrant pkMoveA pkMoveGo pkN promoCopy promoJoin promoReset promoShare promoSms pwNo pwOk refNo refOk testPurge', event: 'awMove awNodup awPart awPick awScopeLap awScopeTeams awShare awTeamSave awTeamSel awTnodup awToggle ceremonyEnd evDel evEnd evEnterCode evEnterGo evHelperSave evHelperSel evHelpers evInviteKakao evInviteSms evLock evMore evPickTeam evTab evTeamEdit evTm fullscreen luckAdd mkAdd mkAuto mkAutoOrder mkClubAdd mkClubPick mkClubSel mkCreate mkFromClub mkHoles mkLap mkLapNew mkLapPick mkLapSave mkMove mkNext mkOrd mkOut mkSel mkTeams teAdd teMove teOut teSave teSel twLuckAdd twMove' });
  /** 모듈 하나를 불러옴 → Promise. 두 번 불러도 한 번만 받아요. 실패하면 다음에 다시 시도 */
  LZ.need = function (name) {
    if (modP[name]) return modP[name];
    var src = MODS[name]; if (!src) return Promise.reject(new Error('모듈 이름이 틀렸어요: ' + name));
    if (name === 'qr' && window.qrcode) return (modP[name] = Promise.resolve(true));
    modP[name] = new Promise(function (ok, no) {
      var sc = document.createElement('script'); sc.src = src; sc.async = true;
      sc.onload = function () { modDone[name] = 1; ok(true); };
      sc.onerror = function () { delete modP[name]; sc.remove(); var e = new Error('화면을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'); e.code = 'net'; no(e); };
      document.head.appendChild(sc);
    });
    return modP[name];
  };
  LZ.loaded = function (name) { return !!modDone[name] || (name === 'qr' && !!window.qrcode); };

  /* ───── 화면 이동 ───── */
  LZ.screens = {}; LZ.stack = []; LZ.guard = null;
  var BLK_OK = { blackNote: 1, qnaList: 1, qnaNew: 1, qnaGet: 1, noti: 1, login: 1, pinFirst: 1, offline: 1 };
  var seq = 0, navBusy = false;
  LZ.cur = function () { return LZ.stack[LZ.stack.length - 1] || { name: '' }; };
  async function render(keep) {
    var cur = LZ.cur(), s = LZ.screens[cur.name], root = $('#app'), my = ++seq, alive = function () { return my === seq; };
    if (!s && LAZY_SCR[cur.name]) {                                                     // v7.0.1 처음 여는 관리자·단체 화면: 모듈 먼저
      try { await LZ.need(LAZY_SCR[cur.name]); }
      catch (e) { if (!alive()) return; var bt = $('#boot'); if (bt) bt.remove(); root.hidden = false; root.innerHTML = LZ.hdr('문제가 생겼어요', { back: true }) + '<div class="wrap"><div class="card"><p class="err">' + esc(LZ.errText(e)) + '</p><button type="button" class="btn" data-act="retry">다시 시도</button></div></div>'; LZ.booted = true; return; }
      if (!alive()) return; s = LZ.screens[cur.name];
    }
    if (!s) { cur.name = S.user ? 'home' : 'login'; s = LZ.screens[cur.name]; }
    if (S.user && S.user.kind === 'black' && !BLK_OK[cur.name]) { cur.name = 'blackNote'; cur.p = {}; s = LZ.screens.blackNote; }   // v7.3 블랙은 안내·문의·알림만
    else if (S.user && S.user.needKid && S.user.kind !== 'admin' && !BLK_OK[cur.name] && cur.name !== 'kakaoAsk') { cur.name = 'kakaoAsk'; cur.p = {}; s = LZ.screens.kakaoAsk; }   // v7.0 카카오 확인 전: 확인·문의·알림만
    var boot = $('#boot'); if (boot) boot.remove();
    root.hidden = false; if (!keep) window.scrollTo(0, 0);
    root.classList.toggle('nobar', !!s.nobar); LZ.tabs(s.tab); document.body.dataset.scr = cur.name; var vp = $('#vpop'); if (vp) vp.remove();
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
  var TABS = [['home', '홈', 'home'], ['courses', '스크린 공략', 'flag'], ['field', '필드 라운드', 'field'], ['me', '내 정보', 'user']];
  LZ.tabs = function (on) {
    var t = $('#tabs'); if (!t) return;
    if (!S.user || !on || S.user.kind === 'black') { t.hidden = true; return; }
    t.hidden = false; t.innerHTML = TABS.map(function (x) { return '<button type="button" class="' + (on === x[0] ? 'on' : '') + '" data-tab="' + x[0] + '">' + LZ.ic(x[2]) + x[1] + '</button>'; }).join('');
  };
  /* 깊은 링크: #club:id · #course:id · #round:id · #event:code · #inv=코드 · #pwreq 등 */
  LZ.goTo = function (to) {
    to = String(to || ''); var m = /^([a-z]+)(?::(.*))?$/.exec(to); if (!m) return;
    var map = { home: ['home'], me: ['me'], pay: [LZ.S.user && LZ.S.user.kind === 'admin' ? 'pays' : 'meTier'], join: ['join'], courses: ['courses'], club: ['club', { id: m[2] }], reqs: ['club', { id: m[2], reqs: 1 }], course: ['holes', { id: m[2] }], round: ['round', { id: m[2] }], event: ['event', { code: m[2] }], find: ['find'], qna: ['qnaList'], notices: ['notices'], dash: ['dash'], members: ['members'], pwreq: ['pwreqs'], refund: ['refunds'], fb: ['feedbacks'], meTier: ['meTier'], goldList: ['goldList'], points: ['mePoints'] };
    var x = map[m[1]]; if (x) LZ.go(x[0], x[1] || {});
  };
  /* 단추 공통 처리: data-go / data-tab / data-act */
  LZ.act = {};
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); LZ.go(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : {}); return; }
    var t = e.target.closest('[data-tab]'); if (t) { e.preventDefault(); if (LZ.cur().name !== t.dataset.tab) LZ.go(t.dataset.tab, {}, { reset: true }); return; }
    var a = e.target.closest('[data-act]'); if (!a) return;
    var name = a.dataset.act, fn = LZ.act[name], mod = !fn && LAZY_ACT[name]; if (!fn && !mod) return;
    e.preventDefault(); if (a.tagName === 'BUTTON' && !/sheetClose|back|retry/.test(name)) LZ.buzz();
    var run = fn ? Promise.resolve(fn(a, a.dataset.v, e)) : LZ.need(mod).then(function () { var f = LZ.act[name]; return f ? f(a, a.dataset.v, e) : null; });   // v7.0.1 관리자·단체 단추: 모듈 먼저
    run.catch(function (err) { LZ.toast(LZ.errText(err), 4500); });
  });
  LZ.act.back = function () { LZ.back(); };
  /* 꾹 누르면 연속으로(좌우·볼스피드·점수 단추) */
  var HOLD = /^(edLr|edP|plLr|plP|sc|regLr:|regP:)/, holdT = null, holdI = null, held = false;
  function holdStop() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('[data-act]'); if (!a || !HOLD.test(a.dataset.act) || a.disabled) return;
    held = false; holdStop();
    holdT = setTimeout(function () { holdI = setInterval(function () { held = true; var fn = LZ.act[a.dataset.act]; if (fn) { LZ.buzz(); Promise.resolve(fn(a, a.dataset.v, e)).catch(function () {}); } else { held = false; a.click(); held = true; } }, 160); }, 600);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { document.addEventListener(ev, function () { holdStop(); if (held) setTimeout(function () { held = false; }, 400); }, true); });   // 길게 누른 뒤 click 이 안 오는 휴대폰에서 다음 탭이 먹히는 것 방지
  document.addEventListener('click', function (e) { if (held) { held = false; var a = e.target.closest('[data-act]'); if (a && HOLD.test(a.dataset.act)) { e.stopImmediatePropagation(); e.preventDefault(); } } }, true);
  LZ.act.help = async function () { try { await LZ.need('help'); } catch (e) { /* 도움말 없이 */ } var h = LZ.HELP && LZ.HELP[LZ.cur().name]; if (!h) { if (S.user) LZ.go('helpHub'); else LZ.go('guide'); return; } LZ.sheet('<h2>' + esc(h.t) + '</h2>' + (h.img ? '<img src="assets/guide/' + h.img + '.webp" alt="" style="width:100%;border-radius:14px;border:1px solid var(--line);margin:4px 0 10px">' : '') + (typeof h.html === 'function' ? h.html() : h.html)); };
  LZ.act.sheetClose = function () { LZ.closeSheet(); };
  LZ.act.retry = function () { render(); };
  LZ.flip = function (el) { if (el && el.classList.contains('sw')) { el.classList.toggle('on'); el.setAttribute('aria-pressed', el.classList.contains('on')); return true; } return false; };
  LZ.act.theme = function (el) { LZ.theme.set(!LZ.theme.get()); if (!LZ.flip(el)) LZ.redraw(); };
  LZ.act.big = function () { LZ.big.set(!LZ.big.get()); LZ.toast(LZ.big.get() ? '글씨를 크게 했어요' : '보통 글씨로 했어요'); };
  LZ.act.buzz = function (el) { store.set('lz.buzz', store.get('lz.buzz') === '0' ? '1' : '0'); if (!LZ.flip(el)) LZ.redraw(); };
  /* ◐ 보기: 어두운 화면 · 단추 진동을 켜고 끄는 작은 창(상단 막대 바로 아래) */
  LZ.act.viewPop = function (el) {
    var old = $('#vpop'); if (old) { old.remove(); return; }
    var d = document.createElement('div'); d.id = 'vpop'; d.className = 'vpop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '보기 설정');
    var paint = function () { d.innerHTML = '<div class="vpane"><div class="tgl"><span>' + LZ.ic('moon') + ' 어두운 화면</span>' + LZ.sw(LZ.theme.get(), 'theme') + '</div><div class="tgl"><span>' + LZ.ic('play') + ' 단추 진동</span>' + LZ.sw(store.get('lz.buzz') !== '0', 'buzz') + '</div>' + (LZ.sayPopRows ? LZ.sayPopRows() : '') + '</div>'; };
    paint(); var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { bottom: 60 };
    d.firstChild.style.top = Math.round(r.bottom + 8) + 'px';
    d.addEventListener('click', function (e) { if (e.target === d) d.remove(); });
    $('#layer').appendChild(d);
  };
  document.addEventListener('click', function (e) { var p = $('#vpop'); if (p && !e.target.closest('#vpop') && !e.target.closest('[data-act="viewPop"]')) p.remove(); }, true);
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
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { var s = LZ.screens[LZ.cur().name]; if (s && s.wake) LZ.wake.on(); Q.flush(); LZ.meSync(); } });
  /* ───── 알림 바로 받기(v7 #30): 내 정보를 새로 받아 🔔 숫자·홈 클럽 목록을 고침 ─────
     ① 서버가 알림을 만들면 내 채널(noti-<열쇠>)로 방송 → 바로  ② 화면이 다시 보일 때  ③ 화면이 보이는 동안 1분마다 */
  function meSig(m) { return m ? JSON.stringify([m.noti || 0, m.reqs || 0, (m.moims || []).map(function (x) { return [x.id, x.members, x.cap, x.role, x.reqs || 0, x.locked ? 1 : 0, x.meLock ? 1 : 0, x.grace || 0]; }), m.user && m.user.tier, m.user && m.user.end, m.points && m.points.bal]) : ''; }
  var syncBusy = false;
  LZ.meSync = async function (toast) {
    if (!S.user || !S.token || syncBusy || !LZ.booted) return; syncBusy = true;
    var before = meSig(S.me);
    try {
      await LZ.refreshMe(); LZ.paintBell();
      if (toast) LZ.toast(toast, 4000);
      if (meSig(S.me) !== before && /^(home|me)$/.test(LZ.cur().name) && !document.querySelector('#layer .sheet, #layer .dlg')) LZ.redraw();
    } catch (e) { /* 다음에 */ } finally { syncBusy = false; }
  };
  setInterval(function () { if (document.visibilityState === 'visible') LZ.meSync(); }, window.LZ_MEPOLL || 60000);
  var NR = LZ.nrt = { ws: null, key: '', hb: null, again: null, tries: 0 };
  NR.start = function (key) {
    if (!key || !window.WebSocket) return; var url = (window.LZ_CONFIG && LZ_CONFIG.RT) || ''; if (!url) return;
    if (NR.key === key && NR.ws && NR.ws.readyState <= 1) return;
    NR.stop(); NR.key = key; var topic = 'realtime:noti-' + key, ref = 0;
    var send = function (ev, payload, t) { try { if (NR.ws && NR.ws.readyState === 1) NR.ws.send(JSON.stringify({ topic: t || topic, event: ev, payload: payload, ref: String(++ref) })); } catch (e) { /* 무시 */ } };
    try {
      var ws = NR.ws = new WebSocket(url);
      ws.onopen = function () { NR.tries = 0; send('phx_join', { config: { broadcast: { self: false }, presence: { key: '' } } }); NR.hb = setInterval(function () { send('heartbeat', {}, 'phoenix'); }, 25000); };
      ws.onmessage = function (e) { try { var m = JSON.parse(e.data); if (m.topic === topic && m.event === 'broadcast' && m.payload && m.payload.event === 'noti') { var x = m.payload.payload || {}; LZ.meSync(x.t || '새 알림이 왔어요'); } } catch (x2) { /* 무시 */ } };
      ws.onclose = function () { if (ws !== NR.ws) return; clearInterval(NR.hb); NR.ws = null; if (S.user && NR.key === key) { NR.tries++; NR.again = setTimeout(function () { if (S.user && NR.key === key) { NR.key = ''; NR.start(key); } }, Math.min(60000, 3000 * NR.tries)); } };
      ws.onerror = function () { /* onclose 에서 다시 */ };
    } catch (e) { NR.ws = null; }
  };
  NR.stop = function () { clearInterval(NR.hb); clearTimeout(NR.again); var w = NR.ws; NR.ws = null; NR.key = ''; try { if (w) w.close(); } catch (e) { /* 무시 */ } };
  /* ───── 아이폰 키보드: 입력칸을 누르면 아래 탭을 숨기고, 키보드가 내려가면 다시 보여요(#7) ───── */
  function isField(el) { if (!el || !el.tagName) return false; var t = el.tagName; if (t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable) return true; return t === 'INPUT' && !/^(checkbox|radio|button|submit|file|range|color|hidden)$/i.test(el.type || ''); }
  function kb(on) { document.body.classList.toggle('kb', !!on); }
  document.addEventListener('focusin', function (e) { if (isField(e.target)) kb(true); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (!isField(document.activeElement)) kb(false); }, 120); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { var vv = window.visualViewport; if (vv.height < window.innerHeight * 0.75 && isField(document.activeElement)) kb(true); });   // 켜기만(끄기는 focusout) — 안드로이드는 화면 높이가 같이 줄어 이 조건에 안 걸림
  LZ.paintBell = function () { var n = S.me && S.me.noti ? S.me.noti : 0; $$('.top .bell').forEach(function (b) { b.innerHTML = LZ.ic('bell') + (n ? '<i>' + (n > 99 ? '99+' : n) + '</i>' : ''); b.setAttribute('aria-label', '알림' + (n ? ' ' + n + '개' : '')); }); };

  /* ───── 시작 ───── */
  LZ.boot = async function () {
    if (store.get('lz.big') === '1') document.body.classList.add('big');   // v7: 처음엔 보통 글씨, 가+ 로 켜고 끔
    var t = store.get('lz.t'), hash = location.hash.replace(/^#/, ''), q = new URLSearchParams(location.search);
    if (q.get('inv') === '0') { store.del('lz.inv'); store.set('lz.noclub', '1'); } else if (q.get('inv')) { store.set('lz.inv', q.get('inv')); store.del('lz.noclub'); }
    if (q.get('ref')) store.set('lz.ref', q.get('ref'));
    if (q.get('r')) store.set('lz.joinRound', q.get('r'));
    if (q.get('e') && q.get('tv')) { LZ.tvCode = q.get('e'); }
    else if (q.get('e')) store.set('lz.joinEvent', q.get('e') + (q.get('t') ? ':' + q.get('t') : ''));
    if (q.get('join')) store.set('lz.joinNow', '1');                                   // 홍보 안내문 링크: 가입 화면 바로
    var kBack = store.get('lz.kakaoBack') || '', kakaoCode = kBack && q.get('code') ? q.get('code') : '', kFail = kBack && !kakaoCode && (q.get('error') || q.get('state')) ? 1 : 0;   // 카카오에서 돌아옴: 1 = 알림 연결, join·verify·pw = v7.3 본인 확인
    if (kBack && (kakaoCode || kFail)) store.del('lz.kakaoBack');
    var kWhy = kakaoCode || kFail ? kBack : '';
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
    if (kWhy === 'join' && !S.user) LZ.stack = [{ name: 'login', p: {} }, { name: 'join', p: { kcode: kakaoCode, kfail: kFail } }];
    if (kWhy === 'pw' && !S.user) LZ.stack = [{ name: 'login', p: {} }, { name: 'pwFind', p: { kcode: kakaoCode, kfail: kFail } }];
    if (kWhy === 'verify' && S.user) LZ.stack = [{ name: 'kakaoAsk', p: { kcode: kakaoCode, kfail: kFail } }];
    if (q.get('s') || q.get('u') || q.get('inv') || q.get('r') || q.get('e') || q.get('t') || q.get('ref') || q.get('join') || q.get('code') || q.get('state') || q.get('error')) { try { history.replaceState(null, '', location.pathname + (hash ? '#' + hash : '')); } catch (e) { /* 무시 */ } }
    if (LZ.tvCode) LZ.stack = [{ name: 'tv', p: { code: LZ.tvCode } }];
    await render();
    if (S.user) { if (kWhy === '1' && kakaoCode && LZ.kakaoReturn) { LZ.kakaoReturn(kakaoCode); return; } if (kWhy === 'verify') return; if (LZ.cur().name === 'home' && LZ.acctGate && LZ.acctGate()) return; LZ.afterLogin(hash); }
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
    if (S.user && S.user.kind === 'admin') setTimeout(function () { LZ.need('admin').catch(function () { /* 열 때 다시 */ }); }, 2500);   // v7.0.1 관리자는 홈이 뜬 뒤 미리 받아 둠
  };
  document.addEventListener('DOMContentLoaded', function () { LZ.boot(); });
})();
