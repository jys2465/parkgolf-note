/* 홈 · 클럽(가입 신청·캡틴 관리·챌린지·QR) · 클럽 찾기/만들기 · 알림함 · 사용 안내 · 공지 · 문의 · 의견 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  /* 날 수: 2026-10-27 → 오늘까지 함께한 날(첫날 = 1일) */
  LZ.daysSince = function (ts) { if (!ts) return 0; var a = new Date(Number(ts) || ts), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.max(1, Math.round((b - a) / 86400000) + 1); };
  /* 등급·기간 두 줄(v7.1.0 회원권으로 정해지는 등급): "블루회원 · 가입 2026-10-26" / 레드·골드는 "2026-10-27 ~ 2027-10-26 (남은 362일)" */
  var TCOL = { blue: 1, red: 1, gold: 1, black: 1, admin: 1 };   // v7.1.1 등급 글자색은 css .tcol.t-* (어두운 화면은 밝은 색)
  LZ.tierLines = function (u) {
    var t = u.tier || 'blue', name = t === 'admin' ? '관리자' : ({ blue: '블루회원', red: '레드회원', gold: '골드회원', black: '블랙' }[t] || u.tierName || t);
    var l1 = '<div class="su"><b class="' + (TCOL[t] ? 'tcol t-' + t : '') + '">' + esc(name) + '</b>' + (u.created ? ' · 가입 ' + LZ.fmtDate(u.created) : '') + '</div>', l2 = '';
    if ((t === 'red' || t === 'gold') && u.end) l2 = '<div class="su"><span class="nw">' + LZ.fmtYmd(u.start || LZ.fmtDate(u.created)) + ' ~</span> <span class="nw">' + LZ.fmtYmd(u.end) + '</span>' + (u.left !== null && u.left !== undefined ? ' <span class="nw">(남은 ' + u.left + '일)</span>' : '') + '</div>';
    return l1 + l2;
  };
  /* v7.1.0: 클럽 색 — 캡틴이 고른 색(없으면 기본 에메랄드)을 홈 클럽 줄 왼쪽 띠·클럽 화면 위 띠로 보여 줌 */
  LZ.clubCol = function (m) { var c = m && /^#[0-9A-Fa-f]{6}$/.test(String(m.color || '')) ? m.color : ''; return c ? ' style="--clc:' + c + '"' : ''; };
  function clubRow(m) {
    var sub = [], extra = '';
    sub.push((m.captainNick ? '캡틴 ' + LZ.nim(m.captainNick) + ' · ' : '') + '회원 ' + Number(m.n !== undefined ? m.n : Math.max(0, (m.members || 0) - 1)).toLocaleString('ko-KR') + '명'); if (m.created) sub.push('함께한 지 ' + LZ.daysSince(m.created) + '일');
    if (m.reqs) sub.push('가입 신청 ' + m.reqs + '건');
    var cn = S.me && S.me.chat && S.me.chat[m.id]; if (cn) sub.push('새 채팅 ' + cn);
    if (m.live) extra = '지금 기록 중 ' + m.live + '명'; else if (m.meet) extra = '모임 ' + m.meet; else if (m.news) extra = '소식 · ' + m.news; else if (m.chal) extra = '챌린지 ' + m.chal.name + ' ' + m.chal.mine + '/' + m.chal.goal;
    return '<button type="button" class="li clr"' + LZ.clubCol(m) + ' data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.role === 'cap' ? ' <span class="chip cap">캡틴</span>' : m.role === 'mgr' ? ' <span class="chip mgr">매니저</span>' : '') + (m.locked ? ' <span class="chip gray">' + LZ.ic('lock') + ' 잠김</span>' : m.meLock ? ' <span class="chip gray">' + LZ.ic('lock') + ' 보기만</span>' : '') + '</b><span class="su">' + esc(sub.join(' · ')) + '</span>' + (extra ? '<span class="su">' + esc(extra) + '</span>' : '') + '</div>' + LZ.ic('chev') + '</button>';
  }
  /** v8 홈 알림 한 줄: 가장 급한 것 하나(회원권 끝남 → 잠긴 클럽 → 캡틴 넘겨받기 → 이용 정지), 나머지는 ⓘ 안 */
  function homeAlerts(me, m) {
    var moims = m.moims || [], left = me.left, L = [];
    var lockedClubs = moims.filter(function (x) { return x.locked && (x.role === 'cap' || x.role === 'mgr'); }), handClubs = moims.filter(function (x) { return x.hand && x.hand.mine; });
    if (me.tier === 'red' && left !== null && left <= 30) L.push({ t: '레드회원권이 ' + (left === 0 ? '오늘' : left + '일 뒤에') + ' 끝나요', d: '연장하면 끝나는 날부터 이어져요', a: 'data-go="meTier"' });
    else if (me.tier === 'gold' && left !== null && left <= 30) L.push({ t: '골드회원권이 ' + (left === 0 ? '오늘' : left + '일 뒤') + ' 끝나요', d: '산 골드는 연장하고, 관리자가 드린 골드는 관리자가 정해요', a: 'data-go="meTier"' });
    else if (me.wasRed && me.tier === 'blue') L.push({ t: '레드·골드회원권 기간이 끝났어요', d: '블루회원으로 쓰고 있어요 · 회원권을 다시 사면 바로 바뀌어요', a: 'data-go="meTier"' });
    if (lockedClubs.length) L.push({ t: '잠긴 클럽 ' + lockedClubs.length + '개', d: lockedClubs[0].lockWhy || '', a: 'data-go="club" data-p=\'' + esc(JSON.stringify({ id: lockedClubs[0].id })) + '\'' });
    if (handClubs.length) L.push({ t: handClubs[0].name + ' 캡틴 넘겨받기', d: '블루회원권을 확보하거나 레드회원권을 사서 인수해요', a: 'data-go="club" data-p=\'' + esc(JSON.stringify({ id: handClubs[0].id })) + '\'' });
    if (me.tier === 'black') L.push({ t: '이용 정지 상태예요', d: '관리자에게 문의해 주세요', a: '' });
    if (m.reqs) L.push({ t: '가입 신청 ' + m.reqs + '건이 기다려요', d: '클럽 관리에서 승인 / 보류', a: 'data-act="homeReqs"' });
    if (!L.length) return '';
    var f = L[0], rest = L.slice(1);
    return '<div class="alrt"><button type="button" class="alrt-b cont" ' + (f.a || 'disabled') + '><b>' + esc(f.t) + '</b>' + (f.a ? LZ.ic('chev') : '') + '</button>' +
      LZ.kw('', '<b>' + esc(f.t) + '</b>' + (f.d ? ' · ' + esc(f.d) : '') + (rest.length ? '<br>' + rest.map(function (x) { return '<button type="button" class="lnk2" ' + (x.a || 'disabled') + '>' + esc(x.t) + '</button>'; }).join('<br>') : '')) + '</div>';
  }
  LZ.homeAlerts = homeAlerts;
  LZ.screens.home = {
    tab: 'home',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('홈') + LZ.skeleton(5); await LZ.refreshMe(); if (!alive()) return; }
      var me = S.user, m = S.me, moims = m.moims || [], adm = me.kind === 'admin';
      var ck = LZ.cacheGet('courses:' + S.br), book = '내 기록만 모아 보기';
      if (ck && ck.courses) { var mine = ck.courses.filter(function (c) { return c.mine > 0; }), done = mine.filter(function (c) { return c.mine >= (c.stage === 'done' ? 18 : 9); }); book = '코스 ' + mine.length + ' · 완료 ' + done.length; }
      var capN = moims.filter(function (x) { return x.role === 'cap'; }).length;
      var li = function (icon, t, s, attrs) { return '<button type="button" class="li cont" ' + attrs + '>' + LZ.ic(icon, 'gi') + '<div class="t"><b>' + t + '</b>' + (s ? '<span class="su">' + s + '</span>' : '') + '</div>' + LZ.ic('chev') + '</button>'; };
      root.innerHTML = LZ.hdr('홈') + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap v8">' +
        '<div class="hme"><button type="button" class="hav" data-go="me" aria-label="내 정보 · 프로필 사진">' + LZ.avatar(me, 'lg') + '</button><div class="t"><h1 class="vt hi hname">' + (adm ? '관리자님, 안녕하세요' : esc(LZ.nim(me.nick)) + ', 안녕하세요') + '</h1><span class="su">' + (adm ? '관리자' : esc(({ blue: '블루회원', red: '레드회원', gold: '골드회원', black: '블랙' })[me.tier] || '')) + (me.created ? ' · 함께한 지 ' + LZ.daysSince(me.created) + '일' : '') + '</span></div></div>' +
        (!adm && m.own ? (function (o) { var n = (o.pay || 0) + (o.refund || 0) + (o.qna || 0) + (o.pw || 0) + (o.gold || 0); return n ? '<button type="button" class="admtodo9" data-act="admEnter">' + LZ.ic('shield') + '<span><b>관리 · 처리할 일 ' + n + '건</b><small>' + [['결제', o.pay], ['환불', o.refund], ['문의', o.qna], ['비밀번호', o.pw], ['골드 만기', o.gold]].filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ' ' + x[1]; }).join(' · ') + '</small></span>' + LZ.ic('chev') + '</button>' : ''; })(m.own) : '') +
        homeAlerts(me, m) + (adm ? '' : resumeCard(m) + banner(me, m, book) + a2hsRow()) +
        (adm ? LZ.admNote() + '<button type="button" class="btn o" data-go="dash">' + LZ.ic('gear') + '관리 현황판</button>'
          : '') +
        (m.round ? '<div class="sec">진행 중</div><div class="list">' + li('flag', '라운드 ' + esc(m.round.code), esc(m.round.fname), 'data-go="round" data-p=\'' + esc(JSON.stringify({ id: m.round.id })) + '\'') + '</div>' : '') +
        (adm ? '' :   // v7.1.1 §13 관리자 계정 홈에는 '내 클럽'·클럽 수를 보이지 않음
        '<div class="mk9 mk9t"><button type="button" data-go="find">' + LZ.ic('search') + '클럽 찾기</button><button type="button" data-go="make">' + LZ.ic('plus') + '클럽 만들기</button></div>' +
        '<div class="hdrr9"><span>내 클럽' + (moims.length ? ' ' + moims.length : '') + '</span>' + (moims.length ? '<button type="button" data-go="myclubs">모두 보기' + LZ.ic('chev') + '</button>' : '') + '</div>' +
        (moims.length ? '<div class="list clubs clubs9">' + moims.slice(0, 2).map(clubRow).join('') + '</div>' + (moims.length > 2 ? '<button type="button" class="lnk more9" data-go="myclubs">' + (moims.length - 2) + '개 더 보기</button>' : '')
          : '<div class="list clubs clubs9"><p class="muted" style="margin:0;padding:16px">아직 함께하는 클럽이 없어요. 위에서 클럽을 찾거나 만들어 보세요.</p></div>')) + (adm ? '' : (LZ.inviteCard ? LZ.inviteCard() : '')) + '</div>';
      LZ.paintSync(); LZ.fillImgs && LZ.fillImgs(root); bannerRun();
      setTimeout(function () { if (!LZ.cacheGet('courses:' + S.br)) LZ.api('courses', {}).then(function (r) { LZ.cacheSet('courses:' + S.br, r); }).catch(function () {}); }, 600);   // 코스 목록 미리 받아 두기
      if (LZ.firstGuide) { LZ.firstGuide = false; LZ.coach('home', [{ sel: '.hbn', text: '<b>내 수첩</b> — 내 기록만 모아 봐요. 어느 클럽에서 적어도 기록은 하나예요.' }, { sel: moims.length ? '.clubs .li' : '[data-go="find"]', text: moims.length ? '<b>클럽</b> — 회원님들의 기록 평균과 모임·소식을 봐요.' : '<b>클럽 찾기</b> — 공개 클럽에 가입 신청하거나, 캡틴이 준 코드 6자리로 들어가요.' }, { sel: '[data-tab="courses"]', text: '<b>스크린</b> — 코스를 열고 홀마다 좌우·볼스피드를 적어요.', pos: 'above' }, { sel: '[data-tab="field"]', text: '<b>필드</b> — 점수판과 시상식. 2~5명이 쳐도 시상식이 열려요.', pos: 'above' }]); }
    }
  };
  /* ───── v9 색이 흐르는 배너: 첫 장 사용법 · 5초마다 넘어가고 밀어서 넘겨요 ───── */
  function banner(me, m, book) {
    var P = LZ.pwa, sl = [];
    sl.push({ c: 'b1', k: '사용법', t: '처음이세요? 3분이면 돼요', s: '코스 등록 · 플레이 · 기록 보기', a: 'data-go="guide"' });
    sl.push({ c: 'b2', k: '내 수첩', t: book, s: '코스를 열고 홀마다 적어요', a: 'data-act="openMyBook"' });
    sl.push({ c: 'b3', k: '코스', t: '새 코스 등록 · 가져오기', s: '이름만 넣으면 18홀이 만들어져요', a: 'data-go="reg"' });
    if (me.tier === 'blue') sl.push({ c: 'b4', k: '회원권', t: '골드회원권 알아보기', s: '클럽 만들기 · 더 많은 기능', a: 'data-go="meTier"' });
    return '<div class="hbn" role="region" aria-roledescription="배너" aria-label="안내 배너"><div class="hbn-t">' + sl.map(function (x, i) { return '<button type="button" class="hbn-s ' + x.c + '" ' + x.a + ' aria-label="' + esc(x.k + ' · ' + x.t) + '"><span class="k">' + esc(x.k) + '</span><b class="v9one">' + esc(x.t) + '</b><span class="s v9one">' + esc(x.s) + '</span></button>'; }).join('') + '</div>' +
      '<div class="hbn-d" aria-hidden="true">' + sl.map(function (x, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div></div>';
  }
  /** 이어서 플레이: 코스 이름 · 진행 막대 · “7홀 ›” */
  function resumeCard(m) {
    var l = m.last; if (!l) return '';
    var n = l.n || 18, f = l.filled || 0, hn = l.hole > 8 ? (l.hole - 8) + '홀 (' + (l.hole + 1) + ')' : (l.hole + 1) + '홀';
    return '<div class="rsm9"><span class="k">이어서 플레이</span><b class="v9one">' + esc(l.name) + '</b><div class="rw"><span class="bar"><i style="width:' + Math.round(f / n * 100) + '%"></i></span><span class="n">' + f + ' / ' + n + '홀</span><button type="button" class="go" data-act="resume" aria-label="' + esc(l.name) + ' ' + hn + '부터 이어서 플레이">' + hn + ' ›</button></div></div>';
  }
  /** 홈 화면에 추가 줄(× 로 닫으면 다시 안 보여요) */
  function a2hsRow() {
    var P = LZ.pwa; if (!P || P.standalone() || store.get('lz.installed') === '1' || store.get('lz.a2hsOff') === '1') return '';
    return '<div class="a2h9"><span class="pl">' + LZ.ic('plus') + '</span><div class="t"><b>홈 화면에 추가</b><small>설치 없이 앱처럼 열려요</small></div><button type="button" class="how" data-act="a2hs">방법</button><button type="button" class="x" data-act="a2hsOff" aria-label="닫기">' + LZ.ic('x') + '</button></div>';
  }
  LZ.act.a2hsOff = function (el) { store.set('lz.a2hsOff', '1'); var r = el.closest('.a2h9'); if (r) r.remove(); };
  var bnT = 0;
  function bannerRun() {
    clearInterval(bnT); var t = $('.hbn-t'); if (!t) return;
    var n = t.children.length, dots = $$('.hbn-d i'), cur = 0;
    var go = function (k) { cur = (k + n) % n; t.scrollTo({ left: cur * t.clientWidth, behavior: 'smooth' }); };
    t.addEventListener('scroll', function () { var k = Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); cur = k; dots.forEach(function (d, i) { d.classList.toggle('on', i === k); }); }, { passive: true });
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && n > 1) bnT = setInterval(function () { if (!document.body.contains(t)) { clearInterval(bnT); return; } if (!document.hidden) go(cur + 1); }, 5000);
    t.addEventListener('pointerdown', function () { clearInterval(bnT); }, { passive: true });
  }
  LZ.act.a2hs = function () { if (LZ.pwa) LZ.pwa.guide(); };
  LZ.act.openMyBook = function () { LZ.go('courses', {}, { reset: true }); };
  LZ.act.openClubCourses = async function (el, id) { if (id && id !== '_me') store.set('lz.cmpBr', id); if (id !== S.br) { try { await LZ.api('useBranch', { br: id }); } catch (e) { LZ.toast(LZ.errText(e)); return; } } LZ.go('courses', {}, { reset: true }); };
  LZ.act.resume = async function () { var l = S.me.last; if (l.br !== S.br) { try { await LZ.api('useBranch', { br: l.br }); } catch (e) { /* 무시 */ } } LZ.go('play', { id: l.cid, hole: l.hole || 0, auto: 1 }); };   // v8 이어서 플레이: 그 홀로 바로
  LZ.act.homeReqs = function () { var m = (S.me.moims || []).filter(function (x) { return (x.role === 'cap' || x.role === 'mgr') && x.reqs; })[0] || (S.me.moims || []).filter(function (x) { return x.role === 'cap' || x.role === 'mgr'; })[0]; if (m) LZ.go('club', { id: m.id, reqs: 1 }); else LZ.go('home'); };

  /* ───── v9 내 클럽(따로 목록): 내 클럽 전부 · 8px 색 띠 · 클럽 찾기 · 만들기 ───── */
  LZ.screens.myclubs = {
    tab: 'home',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('내 클럽', { back: true }) + LZ.skeleton(4); await LZ.refreshMe(); if (!alive()) return; }
      var me = S.user, moims = S.me.moims || [], capN = moims.filter(function (x) { return x.role === 'cap'; }).length, sc = S.me.seat || {};
      root.innerHTML = LZ.hdr('내 클럽', { back: true }) + '<div class="wrap">' +
        '<h1 class="ct9">내 클럽 ' + moims.length + '개</h1><p class="cap9">운영 ' + capN + '개 · 만들기는 ' + (sc.free_clubs || 2) + '개까지 무료' + (me.pass ? (me.pass.blue.unl ? ' · 클럽 개설 제한 없음' : ' · 블루회원권 남음 ' + me.pass.blue.left + '장') : '') + '</p>' +
        (moims.length ? '<div class="list clubs clubs9">' + moims.map(clubRow).join('') + '</div>' : '<div class="list"><p class="muted" style="margin:0;padding:16px">아직 함께하는 클럽이 없어요. 아래에서 찾거나 만들어 보세요.</p></div>') +
        '<div class="mk9"><button type="button" data-go="find">' + LZ.ic('search') + '클럽 찾기</button><button type="button" data-go="make">' + LZ.ic('plus') + '클럽 만들기</button></div></div>';
    }
  };

  /* ───── 클럽 ───── */
  var CL = { d: null };
  /* v8 클럽: 위 막대 "클럽" · ⋯(캡틴·매니저 메뉴) / 본문 제목 = 클럽 이름 · "회원 16명 / 20자리 (회원권 2장) · 지역" · 캡틴 대시보드 · 가입 신청 · 회원(레벨 점수 순) · 자리 */
  LZ.screens.club = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('moimGet', { id: p.id }); if (!alive()) return; CL.d = d;
      var m = d.moim, cap = d.cap, staff = d.staff || cap, me = S.user, s = d.seat || {}, nReq = (d.reqs || []).length;
      var li = function (icon, t, su, attr, end) { return '<button type="button" class="li" ' + attr + '>' + (icon ? LZ.ic(icon, 'gi') : '') + '<div class="t"><b>' + t + '</b>' + (su ? '<span class="su">' + su + '</span>' : '') + '</div>' + (end || '') + LZ.ic('chev') + '</button>'; };
      var info = [];
      if (m.meet) info.push(LZ.ic('pin') + ' ' + esc(m.meet)); if (m.chal) info.push(LZ.ic('star') + ' ' + esc(m.chal.name) + ' ' + m.chal.goal + '홀 · ' + m.chal.done + '/' + m.chal.members + '명 달성 · 나 ' + m.chal.mine); if ((d.news || []).length) info.push(LZ.ic('note') + ' ' + esc(d.news[0].title));
      var hand = m.hand ? (m.hand.mine ? '<div class="card handc">' + LZ.ic('star') + '<div><b>캡틴을 넘겨받으시려면</b><p class="muted">이 클럽은 블루회원권으로 열린 클럽이라 받는 분의 블루회원권이 필요해요. 둘 중 하나를 해 주시면 바로 넘어와요.</p>' +
          '<div class="col">' + (me.pass && me.pass.blue.left > 0 ? '<button type="button" class="btn sm" data-act="handTake">' + LZ.ic('check') + '블루회원권으로 받기</button>' : '<button type="button" class="btn o sm" data-act="handBlue">블루 확보하기(내 클럽 닫기 안내)</button>') +
          '<button type="button" class="btn sm" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'red', take: m.id })) + '\'>레드회원권 사서 인수하기</button></div></div></div>'
        : cap ? '<div class="card handc">' + LZ.ic('clock') + '<div><b>' + LZ.nimE(m.hand.toNick) + '께 캡틴 넘기기를 기다려요</b><p class="muted">이 클럽은 블루회원권으로 열린 클럽이에요. 받는 분이 내 클럽 하나를 닫아 블루회원권을 확보하거나 레드회원권 1장을 사서 인수하면 넘어가요. 넘어가면 내 블루회원권 1장이 돌아와요.</p><div class="row"><button type="button" class="btn o sm" data-act="handRemind" style="margin:0">안내 다시 보내기</button><button type="button" class="btn g sm" data-act="handCancel" style="margin:0">넘기기 멈추기</button></div></div></div>' : '') : '';
      var mem = (d.members || []).slice().sort(function (a, b) { return (b.cap - a.cap) || (b.mgr - a.mgr) || ((b.pts || 0) - (a.pts || 0)) || (a.joined - b.joined); });   // 캡틴·매니저 다음은 레벨 점수 순
      var seatLine = m.staffClub || s.staffClub ? '회원 ' + (m.members || mem.length) + '명 · 자리 제한 없음' : '회원 ' + (s.n !== undefined ? s.n : m.members) + '명 / ' + (s.live !== undefined ? s.live : m.seats) + '자리 <span class="nw">(회원권 ' + (s.passes || 0) + '장)</span>';
      root.innerHTML = LZ.hdr('클럽', { back: true, btns: staff ? '<button type="button" class="tb" data-act="capToggle" aria-label="클럽 관리 메뉴">' + LZ.ic('more') + '</button>' : '' }) + '<div class="wrap v8 clubv8"' + LZ.clubCol(m) + '>' +
        '<h1 class="vt cname">' + esc(m.name) + '</h1><div class="sub csub">' + seatLine + (m.area ? ' · ' + esc(m.area) : '') + '</div>' +
        '<div class="cchips">' + (m.live ? '<span class="pill">지금 기록 중 ' + m.live + '명</span>' : '') + (m.locked ? '<span class="pill">' + LZ.ic('lock') + ' 잠김</span>' : '') + '<span class="muted small">캡틴 ' + LZ.nimE(m.captainNick) + (m.created ? ' · 함께한 지 ' + LZ.daysSince(m.created) + '일' : '') + '</span></div>' +
        (m.created ? LZ.celebrate(m) : '') +
        (m.locked ? '<div class="box err" style="margin-top:8px">' + LZ.ic('lock') + ' ' + esc(m.lockWhy || '이 클럽은 잠겨 있어요') + (staff && m.none ? '<div class="row" style="margin-top:8px"><button type="button" class="sm2" data-act="clubGrow">자리 늘리기</button>' + (cap ? '<button type="button" class="sm2 g" data-act="clubClose">클럽 닫기</button>' : '') + '</div>' : '') + '</div>' : '') +
        (m.meLock ? '<div class="box warn" style="margin-top:8px">' + LZ.ic('lock') + ' 자리가 모자라 지금은 <b>보기만</b> 할 수 있어요. 캡틴이 회원권을 넣으면 바로 풀려요. 내 수첩에는 그대로 적을 수 있어요.</div>' : '') +
        hand +
        (!d.me ? '<div class="card"><p style="margin:0 0 6px">이 클럽의 회원님이 아니에요.</p><button type="button" class="btn" data-act="applyClub" data-v="' + esc(m.id) + '">가입 신청</button></div>' : '') +
        (d.me ? LZ.meetCard(d.meetNow, m.id, staff) + '<div class="cact9 c3"><button type="button" class="cab9" data-go="chat" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\'>' + LZ.ic('chat') + '<b>클럽 채팅</b>' + (d.chatNew ? '<span class="cnt">' + (d.chatNew > 99 ? '99+' : d.chatNew) + '</span>' : '') + '</button>' +
          '<button type="button" class="cab9" data-act="openClubCourses" data-v="' + esc(m.id) + '">' + LZ.ic('screen') + '<b>스크린 공략</b></button>' +
          '<button type="button" class="cab9" data-go="notices" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\'>' + LZ.ic('note') + '<b>클럽 소식</b>' + ((d.news || []).length ? '<span class="cnt">' + d.news.length + '</span>' : '') + '</button></div>' +
          (d.chatLast ? '<button type="button" class="clast9" data-go="chat" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\'><span class="h"><span>채팅 최근</span><span>' + LZ.ago(d.chatLast.at) + '</span></span><span class="b">' + (d.chatLast.nick ? '<b>' + esc(d.chatLast.nick) + '</b> ' : '') + esc(d.chatLast.text || '(가린 글)') + '</span></button>' : '') + clubMore93(m) : '') +
        (staff ? '<div class="list cstaff">' + li('trophy', '캡틴 대시보드', '이달 활동 · 안 오신 분 · 이달의 시상식', 'data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'') +
          li('user', '가입 신청', nReq ? (m.staffClub ? '승인 / 보류' : (s.n || 0) >= (s.eff || 0) ? '자리가 다 찼어요 · 회원권을 넣어 ' + (s.size || 10) + '자리를 늘려 주세요' : '승인 / 보류 · 빈자리 ' + ((s.eff || 0) - (s.n || 0)) + '자리') : '새 신청이 없어요', 'data-act="clubReqs"', nReq ? '<span class="cnt" aria-label="가입 신청 ' + nReq + '건">' + nReq + '</span>' : '') +
          (cap && (s.need || s.locked) ? li('lock', '남길 회원 고르기', '자리가 모자라면 고른 분이 먼저 남아요(매니저는 늘 남음)', 'data-go="clubKeep" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'') : '') + '</div>' : '') +
        (d.me ? '<div class="sec">' + LZ.kw('회원 ' + mem.length, '레벨 점수 높은 순이에요(캡틴·매니저 먼저). “잠길 회원”은 회원권이 끝나면 자리가 모자라 잠기는 분, “보기만”은 지금 잠긴 분이에요.') + '</div><div class="list cmem">' + mem.map(function (x) {
          var nx = LZ.lvNext(x.pts);
          return '<div class="li mrow">' + LZ.avatar(x) + '<div class="t"><b>' + LZ.nm(x.nick) + (x.cap ? ' <span class="pill cap">캡틴</span>' : x.mgr ? ' <span class="pill mgr">매니저</span>' : '') + (x.live ? ' <span class="pill">기록 중</span>' : '') + (x.lock ? ' <span class="pill">보기만</span>' : x.keep && staff ? ' <span class="pill">남길 회원</span>' : '') + (x.test && S.user.kind === 'admin' ? ' <span class="pill">' + LZ.ic('flask') + '테스트</span>' : '') + '</b><span class="su">' + LZ.lvPts(x.pts) + (nx ? ' · ' + nx : '') + ' · 기록 ' + x.holes + '홀</span></div></div>';
        }).join('') + '</div>' : '') +
        (d.me && d.seat ? LZ.seatCard(m, d, staff) : '') +
        (d.me ? '<div class="cinv9"><span class="lb9">클럽 코드</span><button type="button" class="code9" data-act="copy" data-v="' + esc(m.code) + '" aria-label="클럽 코드 ' + esc(m.code) + ' 복사">' + esc(m.code.slice(0, 3) + ' ' + m.code.slice(3)) + '</button><small class="cp9">눌러서 복사</small>' +
          '<button type="button" class="btn kakao" data-act="clubKakao">' + LZ.ic('kakao') + '카카오톡으로 초대하기</button>' +
          '<div class="row2"><button type="button" class="btn g" data-act="clubQr">QR 보기</button><button type="button" class="btn g" data-act="clubInvite">문자 · 글 복사</button></div>' +
          '<p class="hint">초대 링크를 누르면 가입하고 바로 클럽 가입 신청이 돼요</p></div>' : '') +
        (d.me ? '<button type="button" class="btn g cexit9" data-act="clubExit">클럽 나가기</button>' : '') +
        (d.me && d.me !== 'cap' ? '<button type="button" class="lnk cquit9" data-act="clubLeave">클럽 탈퇴하기</button>' : '') + '</div>';
      if (p.reqs && staff) LZ.act.clubReqs();
      else if (p.manage && staff) { p.manage = 0; LZ.act.capToggle(); }   // 한 번만(다시 그릴 때 메뉴가 다른 창을 덮지 않게)
    }
  };
  /** v8 클럽 ⋯ 메뉴(캡틴·매니저): (v8.1 가입 신청은 본문 줄에만) 매니저 · 캡틴 넘기기 · 내보내기 · 자리 늘리기 · 회원권 옮기기 · 남길 회원 · 공지 · 모임 · 챌린지 · 정보 · QR · 알림 · 공개 · 바로 가입 · 클럽 닫기 */
  LZ.act.capToggle = function () {
    var d = CL.d; if (!d) return; var m = d.moim, cap = d.cap, isMgr = d.me === 'mgr', s = d.seat || {}, mgrN = (d.members || []).filter(function (x) { return x.mgr; }).length;
    var mineMv = (s.packs || []).filter(function (p) { return p.owner === S.user.uid && (p.kind === 'red' || p.kind === 'gold'); });
    var o = function (t, su, attr) { return '<button type="button" class="opt" ' + attr + '><b>' + t + '</b>' + (su ? '<span>' + su + '</span>' : '') + '</button>'; };
    LZ.sheet('<h2 id="clubMenu">' + esc(m.name) + '</h2>' + (isMgr ? '<p class="muted" style="margin:0 0 8px">매니저로 캡틴 일을 함께 해요 · 내보내기·캡틴 넘기기·클럽 닫기는 캡틴만</p>' : '') +
      (cap ? o('매니저 정하기', '캡틴을 돕는 분 · ' + mgrN + '/' + (s.mgrMax || 10) + '명', 'data-act="clubMgr"') + o('캡틴 넘기기', '받는 분 회원권으로 · 전 캡틴은 매니저로', 'data-act="clubHand"') + o('내보내기', '회원님 고르기', 'data-act="clubKickList"') : '') +
      (m.staffClub ? '' : o('자리 늘리기', LZ.seatTxt(m) + (m.nextEnd ? ' · 다음 끝 ' + LZ.fmtYmd(m.nextEnd) : ''), 'data-act="clubGrow"')) +
      (mineMv.length ? o('회원권 옮기기', '내가 넣은 회원권 ' + mineMv.length + '장', 'data-act="clubPackMove"') : '') +
      (cap && (s.need || s.locked) ? o('남길 회원 고르기', '자리가 모자라면 고른 분이 먼저 남아요', 'data-go="clubKeep" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'') : '') +
      o('공지 쓰기', '클럽 회원님께 알림', 'data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ br: m.id })) + '\'') +
      o('이번 주 모임', m.meet ? esc(m.meet) : '아직 안 정했어요', 'data-act="clubMeet"') +
      o('이달의 챌린지', m.chal ? esc(m.chal.name) + ' ' + m.chal.goal + '홀' : '예: 양주1구장CD 18홀 채우기', 'data-act="clubChal"') +
      o('캡틴 대시보드', '이달 활동 · 안 오신 분 · 이달의 시상식', 'data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'') +
      o('이름·지역·색', '클럽 정보 바꾸기', 'data-act="clubSet"') + o('매장 QR 포스터', '코스별 QR', 'data-act="clubQrPoster"') + o('가입 신청 알림', '앱 푸시 · 카카오톡', 'data-go="notiCfg"') +
      '<div class="tgl"><span>클럽 찾기에 보이기<span class="muted">끄면 비공개 · 클럽 코드·초대 링크로만 가입</span></span>' + LZ.sw(m.pub, 'clubPub') + '</div><div class="tgl"><span>초대 링크로는 바로 가입<span class="muted">캡틴 승인 없이 들어와요</span></span>' + LZ.sw(m.auto, 'clubAuto') + '</div>' +
      (cap ? o('클럽 닫기', '혼자일 때만 · 회원권은 돌려받아요 · 내 기록은 내 수첩으로', 'data-act="clubClose"') : '') +
      (isMgr ? o('매니저 그만두기', '회원으로 남아요', 'data-act="mgrQuit"') : ''));
  };
  LZ.act.clubKickList = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap && x.uid !== S.user.uid; });
    LZ.sheet('<h2>내보내기</h2><p class="muted">내보낸 분의 이 클럽 기록은 그분의 내 수첩으로 옮겨져요. 다시 가입 신청할 수 있어요.</p>' + (list.length ? list.map(function (x) { return '<div class="tgl"><span>' + LZ.nm(x.nick) + '<span class="muted">' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span></span><button type="button" class="sm2 r" data-act="clubKick" data-v="' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '">내보내기</button></div>'; }).join('') : '<div class="empty">내보낼 회원님이 없어요.</div>'));
  };
  /* 클럽 자리 카드(v7.1.0): "회원 24명 / 30자리 (회원권 3장)" 막대(캡틴은 자리 밖) · 회원권마다 기간·주인 · 캡틴·매니저는 자리 늘리기·옮기기 */
  LZ.seatCard = function (m, d, staff) {
    var s = d.seat;
    if (s.staffClub) return '<div class="card seatc"><div class="seath"><h3>' + LZ.ic('seat') + ' 자리</h3><span><b>' + m.members + '</b>명 · 자리 제한 없음</span></div><p class="muted" style="margin:4px 0 0">관리자가 운영하는 클럽이에요.</p></div>';
    var pct = Math.min(100, Math.round(s.n / Math.max(1, s.live) * 100));
    return '<div class="card seatc"><div class="seath"><h3>' + LZ.ic('seat') + ' 자리</h3><span><b>' + s.n + '</b>명 / ' + s.live + '자리 <span class="nw">(회원권 ' + (s.passes || 0) + '장)</span></span></div><div class="bar seatbar' + (s.n > s.live ? ' over' : '') + '"><i style="width:' + pct + '%"></i></div>' +
      '<p class="hint" style="margin:4px 0 0">캡틴은 자리에 들어가지 않아요 · 회원권 1장 = ' + s.size + '자리</p>' +
      (s.locked ? '<p class="box err" style="margin:8px 0 0">' + LZ.ic('lock') + ' 자리가 모자라 ' + s.locked + '명이 보기만 하고 있어요. 회원권을 넣으면 바로 풀려요.</p>' : '') +
      (s.packs || []).map(function (p) { return LZ.packLine(p, { who: staff }); }).join('') +
      '</div>';   /* v8.1 자리 늘리기·회원권 옮기기는 ⋯ 한 곳에만(자리 카드는 자리 줄만) */
  };
  /* 자리 늘리기(v7.1.0): 레드·골드회원권 사서 넣기 또는 내 보관 회원권 넣기 */
  LZ.act.clubGrow = function () {
    var d = CL.d, m = d.moim, s = d.seat || {}, sc = (S.me && S.me.seat) || {}, mine = s.mine || [];
    LZ.sheet('<h2>' + LZ.ic('seat') + ' 자리 늘리기</h2><p class="muted">' + esc(LZ.seatTxt(m)) + ' · 회원권 1장 = ' + (s.size || 10) + '자리</p>' +
      (mine.length ? '<p class="lb" style="margin-top:0">보관 중인 내 회원권 넣기</p>' + mine.map(function (p) { return '<button type="button" class="opt" data-act="packMoveTo" data-v=\'' + esc(JSON.stringify({ id: p.id, mid: m.id, name: m.name })) + '\'><b>' + (LZ.PKN[p.kind] || '회원권') + ' 넣기</b><span>' + LZ.fmtYmd(p.end) + '까지 · ' + (p.seats || 10) + '자리</span></button>'; }).join('') : '') +
      '<p class="lb"' + (mine.length ? '' : ' style="margin-top:0"') + '>사서 넣기</p>' +
      '<button type="button" class="opt" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'red', mid: m.id })) + '\'><b>레드회원권 사기</b><span>1장 ' + LZ.won(sc.seat_price || 2000) + ' · ' + (sc.seat_days && sc.seat_days % 365 !== 0 ? sc.seat_days + '일' : ((sc.seat_days || 365) / 365) + '년') + ' · 여러 장 한 번에</span></button>' +
      '<button type="button" class="opt" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'gold', mid: m.id })) + '\'><b>골드회원권 사기</b><span>1장 ' + LZ.won(sc.gold_price || 5000) + ' · ' + (sc.gold_years || 3) + '년</span></button>');
  };
  LZ.act.clubPackMove = function () {
    var d = CL.d, mine = (d.seat.packs || []).filter(function (p) { return p.owner === S.user.uid && (p.kind === 'red' || p.kind === 'gold'); });
    if (mine.length === 1) { LZ.act.packMove(null, JSON.stringify({ id: mine[0].id, from: d.moim.id })); return; }
    LZ.sheet('<h2>어느 회원권을 옮길까요?</h2>' + mine.map(function (p) { return '<button type="button" class="opt" data-act="packMove" data-v=\'' + esc(JSON.stringify({ id: p.id, from: d.moim.id })) + '\'><b>' + (LZ.PKN[p.kind] || '회원권') + ' · ' + p.seats + '자리</b><span>' + LZ.fmtYmd(p.start) + ' ~ ' + LZ.fmtYmd(p.end) + '</span></button>'; }).join(''));
  };
  /* 캡틴 넘겨받기(v7.1.0 §6) */
  LZ.act.handTake = async function () { try { CL.d = await LZ.api('moimTake', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.redraw(); LZ.toast('캡틴이 되셨어요', 3500); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.handBlue = function () {
    var own = (S.me && S.me.moims || []).filter(function (x) { return x.role === 'cap' && !x.staffClub; });
    LZ.sheet('<h2>블루회원권 확보하기</h2><p class="muted">블루회원권은 ' + ((S.me && S.me.seat && S.me.seat.free_clubs) || 2) + '장이에요. 내가 만든 클럽 하나를 닫으면 그 클럽의 블루회원권이 돌아오고, 기다리던 캡틴 넘기기가 바로 마무리돼요. 클럽은 혼자일 때만 닫을 수 있어요(다른 회원님이 계시면 먼저 캡틴을 넘겨 주세요).</p>' +
      (own.length ? own.map(function (x) { return '<button type="button" class="opt" data-go="club" data-p=\'' + esc(JSON.stringify({ id: x.id, manage: 1 })) + '\'><b>' + esc(x.name) + '</b><span>' + esc(LZ.seatTxt(x)) + ' · 열어서 관리 → 클럽 닫기</span></button>'; }).join('') : '<div class="empty">내가 만든 클럽이 없어요.</div>') +
      '<button type="button" class="btn o" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'red', take: CL.d.moim.id })) + '\'>대신 레드회원권 사서 인수하기</button>');
  };
  LZ.act.handRemind = async function () { try { CL.d = await LZ.api('moimHand', { id: CL.d.moim.id, remind: 1 }); LZ.redraw(); LZ.toast('받는 분께 안내를 다시 보냈어요', 3500); } catch (e) { LZ.toast(LZ.errText(e), 4500); } };
  LZ.act.leaveAsk = async function () { try { await LZ.api('moimLeave', { id: CL.d.moim.id, ask: 1 }); LZ.closeSheet(); LZ.toast('캡틴께 부탁을 보냈어요. 자리가 채워지면 탈퇴하실 수 있어요', 4500); } catch (e) { LZ.toast(LZ.errText(e), 4500); } };
  LZ.act.handCancel = async function () { if (!(await LZ.confirm('캡틴 넘기기를 멈출까요?', '받는 분께 알림이 가요. 나중에 다시 넘길 수 있어요.', '멈추기', 'r'))) return; try { CL.d = await LZ.api('moimHand', { id: CL.d.moim.id, cancel: 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4500); } };
  /* 함께한 날 축하(100·200·365·1000일, 그날부터 7일 동안) */
  var CELEB = [100, 200, 365, 1000];
  LZ.celebrate = function (m) {
    var n = LZ.daysSince(m.created), hit = CELEB.filter(function (x) { return n >= x && n < x + 7; })[0];
    return hit ? '<div class="celeb">' + LZ.ic('trophy') + '<div><b>함께한 지 ' + (hit === 365 ? '1년' : hit + '일') + '</b><span>그동안 함께해 주셔서 고마워요. 회원님들께 축하 소식을 남겨 보세요.</span></div></div>' : '';
  };
  /* 남길 회원 고르기(캡틴): 자리가 모자라면 고른 분 → 먼저 들어온 분 순서로 남아요(캡틴은 자리 밖, 매니저는 늘 남음) */
  LZ.screens.clubKeep = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('남길 회원', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('moimGet', { id: p.id }); if (!alive()) return; CL.d = d;
      var s = d.seat, list = (d.members || []).filter(function (x) { return !x.cap && !x.mgr; }).sort(function (a, b) { return (b.keep - a.keep) || (a.joined - b.joined); }), any = list.some(function (x) { return x.keep; });
      var on = {}; list.forEach(function (x, i) { if (any ? x.keep : i < s.room) on[x.uid] = 1; });
      root.innerHTML = LZ.hdr('남길 회원', { back: true }) + '<div class="wrap"><div class="card"><p style="margin:0 0 6px">자리 <b>' + s.live + '자리</b>(회원권 ' + (s.passes || 0) + '장) · 회원 <b>' + s.n + '명</b>(캡틴 빼고)</p><p class="muted" style="margin:0">캡틴은 자리에 들어가지 않고, 매니저는 늘 남아요. 그 밖에 <b>' + s.room + '명</b>까지 고를 수 있고, 고르지 않은 분은 먼저 들어온 순서로 남아요. 남지 못한 분은 이 클럽을 <b>보기만</b> 해요. 회원권을 넣으면 바로 풀려요.</p></div>' +
        '<div class="card tight"><div class="seath"><h3>' + LZ.ic('user') + ' 회원님</h3><span id="keepN">' + Object.keys(on).length + ' / ' + s.room + '명</span></div>' + list.map(function (x) { return '<label class="li keepl"><input type="checkbox" class="kk" value="' + esc(x.uid) + '"' + (on[x.uid] ? ' checked' : '') + '><div class="t"><b>' + LZ.nm(x.nick) + (x.lock ? ' <span class="chip gray">보기만</span>' : '') + '</b><span class="su">들어온 날 ' + LZ.fmtDate(x.joined) + ' · 기록 ' + x.holes + '홀</span></div></label>'; }).join('') + '</div>' +
        '<button type="button" class="btn" data-act="keepSave">' + LZ.ic('check') + '이대로 정하기</button></div>';
      $$('.kk').forEach(function (c) { c.addEventListener('change', function () { var n = $$('.kk:checked').length; $('#keepN').textContent = n + ' / ' + s.room + '명'; $('#keepN').classList.toggle('over', n > s.room); }); });
    }
  };
  LZ.act.keepSave = async function () { var uids = $$('.kk:checked').map(function (c) { return c.value; }); try { CL.d = await LZ.api('moimKeep', { id: CL.d.moim.id, uids: uids }); LZ.toast('남길 회원을 정했어요', 3000); LZ.back(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  function inviteUrl(m) { return LZ.APP_URL + '?inv=' + m.code; }
  LZ.act.joinGuide = function () {
    var url = LZ.APP_URL + '?join=1', text = '⛳ 파크골프 공략수첩\n스크린 파크골프 칠 때 홀마다 어디로 얼마나 칠지 적어 두는 수첩이에요. 가입은 무료, 닉네임과 비밀번호 4자리면 끝!\n필드에서는 파크골프·일반골프 스코어도 기록해요.\n아래 링크를 누르면 가입 화면이 바로 열려요.';
    LZ.inviteSheet('공략수첩 가입 초대', text, url);
  };
  LZ.act.clubKakao = function () { var m = CL.d.moim; LZ.kakaoShare('⛳ 파크골프 공략수첩 "' + m.name + '" 클럽에 초대해요 🏌\n가입은 무료예요. 클럽 코드 ' + m.code + '\n👇 아래 링크를 누르면 바로 가입하고 클럽 가입 신청이 돼요.', inviteUrl(m)); };
  LZ.act.clubQr = function () { LZ.act.inviteQrShow(null, inviteUrl(CL.d.moim)); };
  /** 클럽 나가기 = 이 화면만 닫기(탈퇴 아님) */
  LZ.act.clubExit = function () { if (LZ.stack.length > 1) LZ.back(); else LZ.go('home', {}, { reset: true }); };
  LZ.act.clubInvite = function () { var m = CL.d.moim; LZ.inviteSheet('"' + m.name + '" 클럽 초대', '⛳ 파크골프 공략수첩 "' + m.name + '" 클럽에 초대해요 🏌\n가입은 무료예요. 클럽 코드 ' + m.code + '\n필드에서는 파크골프·일반골프 스코어도 기록해요.\n👇 아래 링크를 누르면 바로 가입하고 클럽 가입 신청이 돼요.', inviteUrl(m)); };
  /* ───── 안내장 이미지(1080×1350): 가입 안내 · 클럽 초대 · (단체 초대는 event.js 편성표 그림) ───── */
  /** QR을 캔버스에 그림(vendor/qrcode.js = kazuhikoarase qrcode-generator) */
  function qrCanvas(text, size) {
    size = size || 260; try { var q = qrcode(0, 'M'); q.addData(text); q.make(); } catch (e) { return null; }
    var n = q.getModuleCount(), cv = document.createElement('canvas'), cell = Math.floor(size / (n + 2)), W = cell * (n + 2); cv.width = W; cv.height = W; var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, W); g.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect((c + 1) * cell, (r + 1) * cell, cell, cell);
    return cv;
  }
  function wrapText(g, text, x, y, maxW, lh) { var words = text.split(' '), line = ''; words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; }); if (line) { g.fillText(line, x, y); y += lh; } return y; }
  LZ.poster = async function (kind, o) {
    o = o || {}; var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d'), F = '"Noto Sans KR", sans-serif';
    try { await document.fonts.load('700 60px "Noto Sans KR"'); } catch (e) { /* 기본 글꼴 */ }
    try { await LZ.need('qr'); } catch (e) { /* QR 없이 */ }
    var grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#0B5D4B'); grad.addColorStop(1, '#063D31'); g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(W - 120, 140, 260, 0, 7); g.fill();
    g.fillStyle = '#FBBF24'; g.font = '700 44px ' + F; g.fillText('⛳ 파크골프 공략수첩', 70, 120);
    g.fillStyle = '#fff'; g.font = '700 76px ' + F; var y = wrapText(g, o.title, 70, 230, W - 140, 92);
    g.font = '500 40px ' + F; g.fillStyle = 'rgba(255,255,255,.9)'; y += 10; y = wrapText(g, o.sub || '', 70, y, W - 140, 56);
    var bullets = o.bullets || []; g.font = '700 42px ' + F; y += 20;
    bullets.forEach(function (b) { g.fillStyle = '#FBBF24'; g.fillText('✓', 70, y); g.fillStyle = '#fff'; y = wrapText(g, b, 130, y, W - 200, 56) + 14; });
    var card = { x: 70, y: H - 460, w: W - 140, h: 380 }; g.fillStyle = '#fff'; g.beginPath(); g.roundRect ? g.roundRect(card.x, card.y, card.w, card.h, 32) : g.rect(card.x, card.y, card.w, card.h); g.fill();
    var q = qrCanvas(o.url, 260); if (q) g.drawImage(q, card.x + 40, card.y + 60, 260, 260);
    g.fillStyle = '#0B5D4B'; g.font = '700 46px ' + F; wrapText(g, o.cta || '카메라로 QR을 찍으면 바로 열려요', card.x + 340, card.y + 110, card.w - 380, 58);
    g.fillStyle = '#374151'; g.font = '500 32px ' + F; wrapText(g, o.note || '', card.x + 340, card.y + 230, card.w - 380, 44);
    if (o.code) { g.fillStyle = '#DC2626'; g.font = '700 64px ' + F; g.fillText(o.code, card.x + 340, card.y + 330); }
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '500 28px ' + F; g.fillText(o.url, 70, H - 36);
    return new Promise(function (r) { cv.toBlob(r, 'image/png'); });
  };
  LZ.posterShare = async function (kind, o, text) {
    LZ.busy(true, '안내장 만드는 중…');
    try { var blob = await LZ.poster(kind, o); } finally { LZ.busy(false); }
    if (!blob) { LZ.toast('그림을 만들지 못했어요'); return; }
    var file = new File([blob], 'parkgolf-' + kind + '.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: o.title, text: text || '' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
    LZ.toast('안내장 그림을 내려받았어요. 사진첩에서 카카오톡으로 보내세요', 4500);
  };
  LZ.act.posterJoin = function () { LZ.posterShare('join', { title: '홀마다 내 공략을 적는 파크골프 수첩', sub: '스크린 파크골프, 어디로 얼마나 칠지 더는 헷갈리지 마세요.', bullets: ['홀별 좌우·볼스피드 기록, 클럽 회원 평균과 비교', '필드 점수판 · 2~5명도 시상식 · 단체 라운드', '가입 무료 · 닉네임과 비밀번호 4자리면 끝'], url: LZ.APP_URL + '?join=1', cta: 'QR을 찍으면 가입 화면이 바로 열려요', note: '휴대폰 카메라로 찍어 주세요. 앱 설치 없이 바로 써요.' }, '⛳ 파크골프 공략수첩 가입 안내\n' + LZ.APP_URL + '?join=1'); };
  LZ.qr = function (box, text) { if (!LZ.loaded('qr')) { box.innerHTML = '<p class="muted center">QR 만드는 중…</p>'; LZ.need('qr').then(function () { LZ.qr(box, text); }).catch(function () { box.innerHTML = '<p class="muted">' + esc(text) + '</p>'; }); return; } var cv = qrCanvas(text, 220); if (cv) { box.innerHTML = ''; cv.style.width = '220px'; cv.style.height = '220px'; box.appendChild(cv); return; } box.innerHTML = '<p class="muted">' + esc(text) + '</p>'; };
  LZ.act.clubQrPoster = function () {
    var m = CL.d.moim, cs = CL.d.courses || [];
    LZ.sheet('<h2>매장 QR 포스터</h2><p class="muted">코스를 고르면 그 코스의 홀 표가 바로 열리는 QR이 나와요. 화면을 캡처하거나 인쇄해서 기계 옆에 붙여 두세요.</p>' + cs.slice(0, 40).map(function (c) { return '<button type="button" class="opt" data-act="courseQr" data-v=\'' + esc(JSON.stringify({ id: c.id, name: c.name })) + '\'><b>' + esc(c.name) + '</b></button>'; }).join(''));
  };
  LZ.act.courseQr = function (el, v) { var c = JSON.parse(v), url = LZ.APP_URL + '#course:' + c.id; LZ.sheet('<h2>' + esc(c.name) + '</h2><div class="qr" id="qrbox"></div><p class="center"><b>' + esc(c.name) + '</b><br><span class="muted">파크골프 공략수첩 · 찍으면 이 코스의 홀 표가 열려요</span></p>'); LZ.qr($('#qrbox'), url); };
  LZ.act.applyClub = async function (el, id) {
    var msg = await LZ.dialog({ title: '가입 신청', html: '<p class="muted">캡틴께 남길 한마디(안 써도 돼요)</p><input type="text" id="amsg" class="in" maxlength="60" placeholder="예: 수요일마다 치는 다람쥐예요"><label class="lb">아는 분(있으면)</label><input type="text" id="aknow" class="in" maxlength="40" placeholder="예: 청설모님, 솔바람님">', cancel: null, buttons: [{ label: '가입 신청하기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (v) { return v === 'ok' ? { msg: ($('#amsg') || {}).value, know: ($('#aknow') || {}).value } : null; });
    if (!msg) return;
    try { var r = await LZ.api('moimApply', { id: id, msg: msg.msg, know: msg.know }); await LZ.refreshMe(); LZ.toast(r.res.joined ? '클럽에 들어왔어요' : r.res.full ? '가입 신청했어요. 지금은 자리가 다 차서(' + r.res.full + '자리) 캡틴이 자리를 늘리면 승인돼요' : '가입 신청했어요. 캡틴이 승인하면 홈에 생겨요', 5000); LZ.go('home', {}, { reset: true }); } catch (e) { LZ.toast(e.message, 5000); }
  };
  LZ.act.clubReqs = function () {
    var d = CL.d, rq = d.reqs || [];
    LZ.sheet('<h2>가입 신청 ' + rq.length + '건</h2>' + (rq.length ? rq.map(function (r) { return '<div class="card tight"><div style="display:flex;align-items:center;gap:10px"><div class="av">' + esc(r.nick.charAt(0)) + '</div><div><b style="font-size:var(--t3)">' + LZ.nm(r.nick) + '</b><div class="muted">' + esc(r.kindName) + ' · ' + LZ.lvPts(r.pts) + (r.kid ? ' · 카카오 확인 ✓' : '') + ' · 클럽 ' + r.moims + '개 함께하는 중</div></div></div>' + (r.msg ? '<p class="muted" style="margin:8px 0 0">"' + esc(r.msg) + '"</p>' : '') + (r.know ? '<p class="muted" style="margin:4px 0 0">' + LZ.ic('user') + ' 아는 분: ' + esc(r.know) + '</p>' : '') + '<label class="lb" for="bd_' + esc(r.id) + '">짝꿍 <span class="muted">· 첫 모임 때 기록하는 법을 알려 줄 분(선택)</span></label><select id="bd_' + esc(r.id) + '" class="in"><option value="">짝꿍 없이</option>' + (d.members || []).filter(function (x) { return !x.test; }).map(function (x) { return '<option value="' + esc(x.uid) + '"' + (r.know && x.nick === String(r.know).replace(/님$/, '') ? ' selected' : '') + '>' + esc(x.nick) + '</option>'; }).join('') + '</select>' +
      '<div class="row"><button type="button" class="btn" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 1 })) + '\'>승인 + 환영 글</button><button type="button" class="btn g" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 0 })) + '\'>보류</button></div></div>'; }).join('') : '<div class="empty">새 가입 신청이 없어요.</div>') + '<p class="hint">신청은 7일이 지나면 자동으로 정리돼요.</p>');
  };
  LZ.act.reqDo = async function (el, v) { var o = JSON.parse(v), bs = $('#bd_' + o.rid); try { var r = await LZ.api('moimDecide', { rid: o.rid, ok: o.ok, buddy: o.ok && bs ? bs.value : '' }); CL.d = r; LZ.toast(o.ok ? '승인했어요' : '"보류"를 보냈어요'); LZ.refreshMe().catch(function () {}); LZ.redraw(); if (r.reqs && r.reqs.length) LZ.act.clubReqs(); else LZ.closeSheet(); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubPub = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, pub: el.classList.contains('on') ? 0 : 1 }); if ($('#clubMenu')) LZ.act.capToggle(); else LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubAuto = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, auto: el.classList.contains('on') ? 0 : 1 }); if ($('#clubMenu')) LZ.act.capToggle(); else LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubMeet = async function () {
    var v = await LZ.dialog({ title: '이번 주 모임', html: '<input type="text" id="meet" class="in" maxlength="30" value="' + esc(CL.d.moim.meet || '') + '" placeholder="예: 목 19:00 제이드 양주점">', cancel: null, buttons: [{ label: '저장', kind: 'y', value: 'ok' }, { label: '비우기', kind: 'g', value: 'clear' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? ($('#meet') || {}).value : x === 'clear' ? '' : null; });
    if (v === null) return;
    try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, meet: v }); LZ.redraw(); } catch (e) { LZ.toast(e.message); }
  };
  LZ.act.clubSet = async function () {
    var m = CL.d.moim, colors = ['', '#0B5D4B', '#1E3A8A', '#7C2D12', '#6B21A8', '#0E7490', '#374151'];
    LZ.sheet('<h2>클럽 설정</h2><label class="lb" style="margin-top:0">클럽 이름</label><input type="text" id="cname" class="in" maxlength="15" value="' + esc(m.name) + '"' + (m.official && S.user.kind !== 'admin' ? ' disabled' : '') + '><label class="lb">지역</label><input type="text" id="carea" class="in" maxlength="15" value="' + esc(m.area || '') + '"><label class="lb">클럽 색</label><div class="seg">' + colors.map(function (c) { return '<button type="button" class="' + ((m.color || '') === c ? 'on' : '') + '" data-act="pickColor" data-v="' + c + '" style="' + (c ? 'background:' + c + ';border-color:' + c : '') + ';height:40px;flex:' + (c ? '1' : '0 0 56px') + '">' + (c ? '' : '기본') + '</button>'; }).join('') + '</div><input type="hidden" id="ccolor" value="' + esc(m.color || '') + '">' +
      '<button type="button" class="btn" data-act="clubSetOk">저장</button><button type="button" class="btn g sm" data-act="clubNewCode">클럽 코드 새로 만들기</button>');
  };
  LZ.act.pickColor = function (el, v) { $('#ccolor').value = v; $$('.sheet .seg button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.clubSetOk = async function () { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, name: $('#cname').value, area: $('#carea').value, color: $('#ccolor').value }); LZ.closeSheet(); LZ.refreshMe().catch(function () {}); LZ.redraw(); LZ.toast('저장했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubNewCode = async function () { if (!(await LZ.confirm('클럽 코드를 새로 만들까요?', '예전 코드와 초대 링크는 더 쓸 수 없어요.', '새로 만들기'))) return; try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, newCode: 1 }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubChal = function () {
    var d = CL.d, cs = d.courses || [], m = d.moim;
    LZ.sheet('<h2>이달의 챌린지</h2><p class="muted">코스 하나와 목표 홀 수를 정하면 홈 카드에 진행률이 보여요. 이번 달 말까지예요.</p><label class="lb">코스</label><select id="chcid" class="in"><option value="">(챌린지 끄기)</option>' + cs.map(function (c) { return '<option value="' + esc(c.id) + '"' + (m.chal && m.chal.cid === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select><label class="lb">목표 홀 수</label>' + LZ.seg([['9', '9홀'], ['18', '18홀']], String(m.chal ? m.chal.goal : 18), 'chGoal') + '<input type="hidden" id="chgoal" value="' + (m.chal ? m.chal.goal : 18) + '"><button type="button" class="btn" data-act="chalOk">저장</button>');
  };
  LZ.act.chGoal = function (el, v) { $('#chgoal').value = v; $$('.sheet .seg button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.chalOk = async function () { try { CL.d = await LZ.api('chalSet', { id: CL.d.moim.id, cid: $('#chcid').value, goal: $('#chgoal').value }); LZ.closeSheet(); LZ.refreshMe().catch(function () {}); LZ.redraw(); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubKick = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(LZ.nim(o.nick) + '을 내보낼까요?', '그분의 이 클럽 기록은 그분의 내 수첩으로 옮겨져요. 다시 가입 신청할 수 있어요.', '탈퇴 처리', 'r'))) return; try { CL.d = await LZ.api('moimKick', { id: CL.d.moim.id, uid: o.uid }); LZ.closeSheet(); LZ.redraw(); LZ.toast('탈퇴 처리했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubHand = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap && !x.off; });
    LZ.sheet('<h2>캡틴 바꾸기</h2><p class="muted">' + (((d.seat || {}).packs || []).some(function (p) { return p.kind === 'blue'; }) ? '이 클럽은 블루회원권으로 열린 클럽이라 받는 분의 블루회원권으로 바꿔 넣고, 넘기는 분은 블루회원권을 돌려받아요. 받는 분께 남은 블루가 없으면 받는 분이 블루를 확보하거나 레드회원권을 사서 인수할 때 넘어가요.' : '받는 분 누구에게나 넘길 수 있어요.') + ' 넣어 둔 레드·골드회원권은 그대로 남고, 넘긴 뒤에는 매니저로 남아요.</p>' + (list.length ? list.map(function (x) { return '<button type="button" class="opt" data-act="handTo" data-v=\'' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '\'><b>' + LZ.nm(x.nick) + '</b><span>' + ({ red: '레드회원', gold: '골드회원', blue: '블루회원' }[x.tier] || '') + ' · ' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span></button>'; }).join('') : '<div class="empty">넘길 수 있는 회원님이 없어요.</div>'));
  };
  LZ.act.handTo = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(LZ.nim(o.nick) + '께 캡틴을 넘길까요?', '넘기면 되돌릴 수 없어요(새 캡틴이 다시 넘겨 줘야 해요). 전 캡틴은 매니저로 남아요.', '넘기기'))) return; try { var r = await LZ.api('moimHand', { id: CL.d.moim.id, uid: o.uid }); CL.d = r; LZ.closeSheet(); LZ.refreshMe().catch(function () {}); LZ.redraw(); if (r.wait) LZ.dialog({ title: '넘기기를 기다려요', body: LZ.nim(o.nick) + '께 남은 블루회원권이 없어요. ' + LZ.nim(o.nick) + '이 내 클럽 하나를 닫아 블루회원권을 확보하거나 레드회원권 1장을 사서 인수하면 그때 캡틴이 넘어가요. 알림을 보냈어요.', cancel: false, buttons: [{ label: '확인', kind: 'y', value: 1 }] }); else LZ.toast('캡틴을 넘겼어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  /* 매니저 정하기(캡틴): 회원 목록에 스위치 */
  LZ.act.clubMgr = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap; }), n = list.filter(function (x) { return x.mgr; }).length;
    var mx = (d.seat && d.seat.mgrMax) || 10;
    LZ.sheet('<h2>매니저 정하기</h2><p class="muted">매니저는 가입 승인·소식·모임·챌린지·회원권 넣기 등 캡틴 일을 함께 해요. 회원 내보내기·매니저 정하기·캡틴 바꾸기·클럽 닫기는 캡틴만 해요. 매니저는 <b>' + mx + '명까지</b>(회원권 1장의 자리 수)이고, 자리가 모자라도 잠기지 않아요.</p><p class="lb" style="margin-top:0">매니저 ' + n + '/' + mx + '명</p>' + (n >= mx ? '<p class="hint" style="margin:0 0 8px">' + mx + '명이 다 찼어요. 한 분을 해제하면 새로 정할 수 있어요.</p>' : n > 5 ? '<p class="hint" style="margin:0 0 8px">매니저가 많으면 가입 신청 알림이 그만큼 많이 가요.</p>' : '') +
      (list.length ? list.map(function (x) { return '<div class="tgl"><span>' + LZ.nm(x.nick) + (x.off ? '<span class="muted">지금은 쓸 수 없는 계정</span>' : '<span class="muted">' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span>') + '</span>' + LZ.sw(x.mgr, 'mgrTgl', x.uid, !!x.off) + '</div>'; }).join('') : '<div class="empty">아직 다른 회원님이 없어요.</div>'));
  };
  LZ.act.mgrTgl = async function (el, uid) { var on = el.classList.contains('on') ? 0 : 1; try { CL.d = await LZ.api('moimMgr', { id: CL.d.moim.id, uid: uid, on: on }); LZ.redraw(); LZ.act.clubMgr(); LZ.toast(on ? '매니저로 정했어요' : '매니저를 해제했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.mgrQuit = async function () { if (!(await LZ.confirm('매니저를 그만둘까요?', '회원으로 남고, 캡틴이 다시 정하면 매니저가 돼요.', '그만두기', 'r'))) return; try { await LZ.api('moimMgrQuit', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('club', { id: CL.d.moim.id }, { replace: true }); LZ.toast('매니저를 그만뒀어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubClose = async function () { if (!(await LZ.confirm('클럽을 닫을까요?', '다른 회원님이 없을 때만 닫을 수 있어요. 블루회원권은 돌아오고, 넣었던 레드·골드회원권은 각 주인의 보관함으로 가요. 내 기록은 내 수첩으로 옮겨져요.', '클럽 닫기', 'r'))) return; try { var r = await LZ.api('moimClose', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('home', {}, { reset: true }); LZ.toast('클럽을 닫았어요' + (r.back ? ' · 회원권 ' + r.back + '장을 돌려받았어요' : ''), 4000); } catch (e) { LZ.toast(e.message, 4500); } };
  /* 탈퇴하기(v7.1.0 §7 · v9.1 이름을 '탈퇴'로): 이 클럽에 넣은 내 회원권이 있으면 먼저 보여 주고 고르게 */
  /** 탈퇴 확인: 무엇이 바뀌는지 · 회원권 */
  function quitAsk(pass) {
    var m = CL.d.moim;
    return LZ.dialog({ title: m.name + (/클럽$/.test(m.name) ? '' : ' 클럽') + '을 탈퇴할까요?', html: '<ul class="quit9"><li>클럽 회원 목록 · 클럽 평균 · 소식 · 모임에서 빠져요</li><li>내 기록은 그대로 <b>내 수첩</b>으로 옮겨져요</li>' + (pass ? '<li>' + esc(pass) + '</li>' : '') + '<li>다시 들어오려면 가입 신청을 새로 해야 해요</li></ul><p class="muted small">화면만 닫으려면 [취소] 후 <b>클럽 나가기</b>를 누르세요.</p>', cancel: false, buttons: [{ label: '탈퇴하기', kind: 'r', value: true }, { label: '취소', kind: 'g', value: false }] });
  }
  LZ.act.clubLeave = async function () {
    var mid = CL.d.moim.id, li;
    try { li = (await LZ.api('moimLeave', { id: mid, dry: 1 })).leave; } catch (e) { LZ.toast(LZ.errText(e), 4500); return; }
    if (!li.mine.length) { if (!(await quitAsk(''))) return; return leaveGo(mid, null); }
    var opt = function (v, b, sub, cls) { return '<button type="button" class="opt' + (cls ? ' ' + cls : '') + '" data-act="leaveGo" data-v=\'' + esc(JSON.stringify(v)) + '\'><b>' + b + '</b><span>' + sub + '</span></button>'; };
    var h = '<h2>' + LZ.ic('seat') + ' 탈퇴 전에 · 내 회원권을 어떻게 할까요?</h2><p class="muted">이 클럽에 넣은 내 회원권 ' + li.mine.length + '장 · 회원 ' + li.n + '명(캡틴 빼고) / ' + li.seats + '자리</p>' + li.mine.map(function (p) { return LZ.packLine(p, {}); }).join('');
    if (li.shortAll === 0) {
      h += opt({ give: '' }, '회원권 가지고 탈퇴하기', '내 보관함으로 옮겨져요(기간 그대로)');
      if (li.reds) h += opt({ give: 'reds' }, '레드회원권은 캡틴에게 양도하고 탈퇴하기', LZ.nim(li.captainNick) + '의 회원권이 되어 클럽에 남아요' + (li.golds ? ' · 골드회원권은 가지고 탈퇴해요' : ''), 'g');
    } else {
      h += '<div class="box warn">가지고 탈퇴하면 자리가 <b>' + li.shortAll + '자리</b> 모자라요. 그냥은 가지고 탈퇴할 수 없어요.</div>';
      if (li.reds && li.shortGive === 0) h += opt({ give: 'reds' }, '캡틴에게 양도하고 탈퇴하기', '레드회원권 ' + li.reds + '장이 ' + LZ.nim(li.captainNick) + '의 회원권이 돼요' + (li.golds ? ' · 골드회원권은 가지고 탈퇴해요' : ''));
      if (li.golds) h += '<button type="button" class="opt" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'red', give: mid, leave: 1, n: li.needAll })) + '\'><b>레드 사서 양도하고 골드 가지고 탈퇴하기</b><span>레드회원권 ' + li.needAll + '장을 사서 캡틴에게 양도하면, 확인될 때 골드회원권을 가지고 탈퇴할 수 있어요</span></button><button type="button" class="opt" data-act="leaveAsk"><b>캡틴이 레드를 사서 채우기</b><span>' + LZ.nim(li.captainNick) + '께 부탁을 보내요. 자리가 채워지면 골드회원권을 가지고 탈퇴할 수 있어요</span></button><p class="hint">골드회원권은 양도할 수 없어요.</p>';
      else if (!li.reds || li.shortGive > 0) h += '<p class="hint">캡틴이 회원권을 넣어 자리를 늘리면 탈퇴할 수 있어요.</p>';
    }
    LZ.sheet(h);
  };
  LZ.act.leaveGo = async function (el, v) { var o = JSON.parse(v); if (!(await quitAsk(o.give ? '레드회원권은 캡틴에게 양도돼요.' : '회원권은 내 보관함으로 옮겨져요(기간 그대로).'))) return; LZ.closeSheet(); leaveGo(CL.d.moim.id, o.give || null); };
  async function leaveGo(mid, give) { try { var r = await LZ.api('moimLeave', give ? { id: mid, give: give } : { id: mid }); await LZ.refreshMe(); var nm = (CL.d && CL.d.moim && CL.d.moim.name) || '클럽'; LZ.go('home', {}, { reset: true }); LZ.toast(nm + (/클럽$/.test(nm) ? '' : ' 클럽') + '을 탈퇴했어요' + (r.took ? ' · 회원권 ' + r.took + '장을 가지고' : '') + (r.gave ? ' · 레드 ' + r.gave + '장을 캡틴에게' : '') + (r.moved ? ' · 기록 ' + r.moved + '개를 내 수첩으로 옮겼어요' : ''), 4500); } catch (e) { LZ.toast(LZ.errText(e), 5000); } }

  /* ───── 클럽 찾기 · 만들기 ───── */
  LZ.screens.find = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽 찾기', { back: true }) + LZ.skeleton(4);
      var q = p.q || '', r = await LZ.api('moimFind', { q: q }); if (!alive()) return;
      root.innerHTML = LZ.hdr('클럽 찾기', { back: true }) + '<div class="wrap"><input type="search" id="fq" value="' + esc(q) + '" placeholder="클럽 이름이나 지역 (예: 양주)"><p class="muted">함께하는 클럽 ' + r.count + '개 · 가입은 몇 개든 돼요</p>' +
        (r.list.length ? r.list.map(function (m) { return '<div class="card"><b style="font-size:var(--t3)">' + esc(m.name) + '</b>' + (m.official ? ' <span class="chip off">공식</span>' : '') + '<p class="muted" style="margin:4px 0 0">' + esc(m.area || '') + ' · 회원 ' + m.members + '명 · 캡틴 ' + LZ.nimE(m.captainNick) + (m.meet ? ' · 모임 ' + esc(m.meet) : '') + '</p>' + (m.role ? '<p class="muted" style="margin:6px 0 0;color:var(--green)">함께하는 중</p>' : m.asked ? '<button type="button" class="btn g sm" data-act="cancelApply" data-v="' + esc(m.id) + '">신청 취소</button>' : '<button type="button" class="btn o sm" data-act="applyClub" data-v="' + esc(m.id) + '">가입 신청</button>') + '</div>'; }).join('') : '<div class="empty">찾는 클럽이 없어요.</div>') +
        '<div class="card"><b>클럽 코드가 있으세요?</b><input type="tel" id="fcode" inputmode="numeric" maxlength="7" placeholder="6자리 숫자" style="margin-top:10px" value="' + esc(p.inv || '') + '"><button type="button" class="btn" data-act="findCode">코드로 찾기</button></div></div>';
      var fq = $('#fq'), tm = null; fq.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { LZ.go('find', { q: fq.value }, { replace: true }); }, 500); });
      if (p.inv) LZ.act.findCode(null, null, true);
    }
  };
  LZ.act.cancelApply = async function (el, id) { try { await LZ.api('moimCancel', { id: id }); LZ.redraw(); LZ.toast('신청을 취소했어요'); } catch (e) { LZ.toast(e.message); } };
  LZ.act.findCode = async function (el, v, inv) {
    var code = $('#fcode').value.replace(/\D/g, ''); if (code.length !== 6) { LZ.toast('클럽 코드 6자리를 넣어 주세요'); return; }
    try {
      var r = await LZ.api('moimCode', { code: code }), m = r.moim;
      LZ.sheet('<h2>' + esc(m.name) + '</h2><p class="muted">' + esc(m.area || '') + ' · 회원 ' + m.members + '명 · 캡틴 ' + LZ.nimE(m.captainNick) + '</p>' + (m.role ? '<div class="box">이미 함께하는 클럽이에요.</div>' : m.asked ? '<div class="box">가입 신청을 했어요. 캡틴의 답을 기다려 주세요.</div>' : '<p class="muted">캡틴께 남길 한마디(안 써도 돼요)</p><input type="text" id="amsg" class="in" maxlength="60" placeholder="예: 수요일마다 치는 다람쥐예요"><button type="button" class="btn" data-act="applyCode" data-v=\'' + esc(JSON.stringify({ code: code, inv: inv ? 1 : 0 })) + '\'>' + (m.auto && inv ? '바로 가입하기' : '가입 신청하기') + '</button>'));
    } catch (e) { LZ.toast(e.message, 4500); }
  };
  LZ.act.applyCode = async function (el, v) { var o = JSON.parse(v); try { var r = await LZ.api('moimApply', { code: o.code, inv: o.inv, msg: ($('#amsg') || {}).value || '' }); await LZ.refreshMe(); LZ.closeSheet(); LZ.toast(r.res.joined ? '클럽에 들어왔어요' : r.res.full ? '가입 신청했어요. 지금은 자리가 다 차서(' + r.res.full + '자리) 캡틴이 자리를 늘리면 승인돼요' : '가입 신청했어요. 캡틴이 승인하면 홈에 생겨요', 5000); LZ.go('home', {}, { reset: true }); } catch (e) { LZ.toast(e.message, 5000); } };
  /* 클럽 만들기(v7.1.0 §3): 넣을 회원권 고르기 — 남은 블루(1장까지) · 보관 중인 레드·골드 · 레드회원권 사기(첫 장 클럽 금액) · 골드회원권 사기 */
  var MK = { mine: [] };
  LZ.screens.make = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽 만들기', { back: true }) + LZ.skeleton(4);
      var d = null; try { d = await LZ.api('payInfo', {}); } catch (e) { d = null; } if (!alive()) return;
      var u = (d && d.user) || S.user, sc = (d && d.seat) || (S.me && S.me.seat) || { free_clubs: 2, seat_size: 10, club_price: 2000, seat_price: 2000, gold_price: 5000, gold_years: 3, seat_days: 365 };
      var ps = u.pass || { blue: { left: 0, total: 2 } }, adm = u.kind === 'admin', mine = MK.mine = ((d && d.mine) || []).filter(function (x) { return (x.kind === 'red' || x.kind === 'gold') && x.live && !x.mid; });
      var colors = ['', '#0B5D4B', '#1E3A8A', '#7C2D12', '#6B21A8', '#0E7490', '#374151'], blueOk = adm || ps.blue.left > 0;
      root.innerHTML = LZ.hdr('클럽 만들기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">클럽 이름</label><input type="text" id="mname" maxlength="15" placeholder="예: 우리 수요클럽"><label class="lb">지역</label><input type="text" id="marea" maxlength="15" placeholder="예: 경기 양주"><label class="lb">이번 주 모임(선택)</label><input type="text" id="mmeet" maxlength="30" placeholder="예: 목 19:00 제이드 양주점"><label class="lb">클럽 색</label><div class="seg">' + colors.map(function (c, i) { return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-act="pickColor" data-v="' + c + '" style="' + (c ? 'background:' + c + ';border-color:' + c : '') + ';height:40px;flex:' + (c ? '1' : '0 0 56px') + '">' + (c ? '' : '기본') + '</button>'; }).join('') + '</div><input type="hidden" id="ccolor" value=""><div class="tgl"><span>클럽 찾기에 보이기</span>' + LZ.sw(true, 'tglPub') + '</div><input type="hidden" id="mpub" value="1"></div>' +
        '<div class="card"><h3>' + LZ.ic('seat') + ' 넣을 회원권 <span class="muted small">1장 = ' + sc.seat_size + '자리 · 캡틴은 자리 밖</span></h3>' +
          '<label class="ckl mkp"><input type="checkbox" class="mkpk" id="mkBlue" value="blue"' + (blueOk ? ' checked' : ' disabled') + '><span><b>블루회원권 1장</b><span class="su">' + (adm ? '관리자' : '무료 · 남은 ' + ps.blue.left + '장 / ' + ps.blue.total + '장') + (blueOk ? '' : ' · 다른 클럽을 닫으면 돌아와요') + '</span></span></label>' +
          mine.map(function (x) { return '<label class="ckl mkp"><input type="checkbox" class="mkpk" value="' + esc(x.id) + '"' + (!blueOk && x === mine[0] ? ' checked' : '') + '><span><b>보관 중인 ' + (LZ.PKN[x.kind] || '회원권') + '</b><span class="su">' + LZ.fmtYmd(x.end) + '까지 · 남은 ' + x.left + '일</span></span></label>'; }).join('') +
          '<p class="hint" id="mkSum" aria-live="polite"></p><button type="button" class="btn" data-act="makeOk" id="mkGo">' + LZ.ic('plus') + '클럽 만들기</button></div>' +
        '<div class="card buyc"><h3>' + LZ.ic('coin') + ' 회원권을 사서 열기</h3><p class="muted" style="margin:0 0 8px">관리자가 입금을 확인하면 클럽이 열려요(포인트로 다 내면 바로).</p>' +
          '<button type="button" class="opt" data-act="makeBuy" data-v="red"><b>레드회원권 사기</b><span>첫 장 ' + LZ.won(sc.club_price) + ' · 둘째 장부터 ' + LZ.won(sc.seat_price) + ' · ' + (sc.seat_days % 365 === 0 ? sc.seat_days / 365 + '년' : sc.seat_days + '일') + '</span></button>' +
          '<button type="button" class="opt" data-act="makeBuy" data-v="gold"><b>골드회원권 사기</b><span>1장 ' + LZ.won(sc.gold_price) + ' · ' + sc.gold_years + '년</span></button></div></div>';
      var upd = function () { var n = $$('.mkpk:checked').length, go = $('#mkGo'); $('#mkSum').textContent = n ? '고른 회원권 ' + n + '장 = ' + (n * sc.seat_size) + '자리로 열어요' : '넣을 회원권을 1장 이상 골라 주세요. 없으면 아래에서 사서 열 수 있어요.'; if (go) go.disabled = !n; };
      $$('.mkpk').forEach(function (c) { c.addEventListener('change', upd); }); upd();
    }
  };
  LZ.act.tglPub = function (el) { el.classList.toggle('on'); $('#mpub').value = el.classList.contains('on') ? '1' : '0'; };
  LZ.act.makeOk = async function () {
    var ids = $$('.mkpk:checked').map(function (c) { return c.value; }), blue = ids.indexOf('blue') >= 0 ? 1 : 0, packs = ids.filter(function (x) { return x !== 'blue'; });
    if (!ids.length) { LZ.toast('넣을 회원권을 골라 주세요', 3500); return; }
    LZ.busy(true, '만드는 중…');
    try { var r = await LZ.api('moimCreate', { name: $('#mname').value, area: $('#marea').value, meet: $('#mmeet').value, color: $('#ccolor').value, pub: $('#mpub').value === '1' ? 1 : 0, blue: blue, packs: packs }); LZ.busy(false); await LZ.refreshMe(); LZ.go('club', { id: r.id }, { replace: true }); LZ.toast('클럽을 만들었어요. 회원님을 초대해 보세요'); }
    catch (e) { LZ.busy(false); if (e.code === 'needpass' || e.code === 'noblue') { await LZ.refreshMe(); LZ.redraw(); } LZ.toast(e.message, 5000); }
  };
  /* 회원권을 사서 새 클럽 열기: 적은 클럽 정보로 결제 화면(레드·골드) */
  LZ.act.makeBuy = function (el, v) {
    var nm = $('#mname').value.trim(); if (nm.length < 2) { LZ.toast('클럽 이름을 2자 이상 적어 주세요'); $('#mname').focus(); return; }
    LZ.go('pay', { plan: v === 'gold' ? 'gold' : 'red', newClub: 1, n: 1, name: nm, area: $('#marea').value, meet: $('#mmeet').value, color: $('#ccolor').value, pub: $('#mpub').value === '1' ? 1 : 0 });
  };
  /* ───── 알림함 ───── */
  var NICON = { pay: 'check', refund: 'back', qna: 'chat', pw: 'lock', mreq: 'user', club: 'club', course: 'pin', round: 'flag', join: 'star', fb: 'note', payok: 'check', digest: 'book', seat: 'seat', gold: 'star' };
  LZ.screens.noti = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + LZ.skeleton(5);
      var r = await LZ.api('notiList', { read: 1 }); if (!alive()) return; if (S.me) S.me.noti = 0;
      var a = r.admin;
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + '<div class="wrap">' +
        (a ? '<div class="card tight"><div class="kv" style="grid-template-columns:repeat(4,1fr)">' + [['pay', '결제 승인', a.pay, 'payList'], ['refund', '환불', a.refund, 'refunds'], ['qna', '문의', a.qna, 'qnaList'], ['pw', '비밀번호', a.pw, 'pwreqs']].map(function (x) { return '<button type="button" style="all:unset;cursor:pointer;background:var(--soft);border-radius:14px;padding:10px 4px;text-align:center" data-go="' + x[3] + '"><b style="display:block;font-size:var(--t5);color:' + (x[2] ? 'var(--org)' : 'var(--g)') + '">' + x[2] + '</b><span style="font-size:var(--t0);color:var(--sub)">' + x[1] + '</span></button>'; }).join('') + '</div></div>' : '') +
        '<div class="card">' + (r.list.length ? r.list.map(function (n) { return '<button type="button" class="noti ' + (n.read ? '' : 'unread') + (n.act ? ' hasact' : '') + '" data-act="notiOpen" data-v="' + esc(n.to) + '"><div class="nic">' + LZ.ic(NICON[n.kind] || 'bell') + '</div><div class="ntx"><b>' + esc(n.title) + '</b><small class="nd">' + LZ.fmtDate(n.at, true) + '</small>' + (n.body ? '<span class="nb">' + esc(n.body) + '</span>' : '') + '</div></button>' + notiActs(n);   /* v8.1 날짜는 제목 아래 작은 줄 · 내용은 2줄까지 */ }).join('') + (r.list.length > (p.n || 30) ? '<button type="button" class="btn g sm" data-go="noti" data-p=\'' + JSON.stringify({ n: (p.n || 30) + 30 }) + '\'>더 보기</button>' : '') : '<div class="empty">알림이 없어요.</div>') + '</div>' +
        '<button type="button" class="btn g" data-go="notiCfg">' + LZ.ic('bell') + ' 알림 받기 설정</button></div>';
      LZ.paintBell();
    }
  };
  LZ.act.notiOpen = function (el, to) { if (to) LZ.goTo(to); };
  /* v7.1.0 알림 안 단추: 관리자 지급 골드 만기 → [거절 · 그날로 끝] [승인] / 캡틴 만기 알림 → [남길 회원 고르기] [자리 늘리기] */
  function notiActs(n) {
    var a = n.act; if (!a) return '';
    if (a.gold) { var who = (/· (.+)님$/.exec(n.title) || [])[1] || ''; return '<div class="nact"><button type="button" class="btn g sm" data-act="goldOk" data-v=\'' + esc(JSON.stringify({ id: a.gold, nick: who, ok: 0, end: a.end })) + '\'>거절 · 그날로 끝</button><button type="button" class="btn sm" data-act="goldOk" data-v=\'' + esc(JSON.stringify({ id: a.gold, nick: who, ok: 1, end: a.end })) + '\'>승인 · ~' + esc(LZ.fmtYmd(a.next)) + '</button></div>'; }
    /* v8.1 만기 알림은 줄을 누르면 바로 "남길 회원"으로 가요(단추 줄 없앰 · 자리 늘리기는 클럽 ⋯) */
    return '';
  }

  /* ───── 사용 안내 ───── */
  /* ───── 캡틴 대시보드 ───── */
  LZ.screens.capDash = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('캡틴 대시보드', { back: true }) + LZ.skeleton(5);
      var d; try { d = await LZ.api('capDash', { id: p.id, ym: p.ym }); } catch (e) { LZ.toast(LZ.errText(e), 4000); LZ.back(); return; } if (!alive()) return; CD = d; CD.mid = p.id;
      var ym = d.ym, y = +ym.slice(0, 4), mo = +ym.slice(5, 7), prev = mo === 1 ? (y - 1) + '-12' : y + '-' + (mo - 1 < 10 ? '0' : '') + (mo - 1), next = mo === 12 ? (y + 1) + '-01' : y + '-' + (mo + 1 < 10 ? '0' : '') + (mo + 1), isNow = ym === new Date().toISOString().slice(0, 7);
      root.innerHTML = LZ.hdr('캡틴 대시보드', { back: true }) + '<div class="wrap"><p class="lb" style="margin:0 0 8px">' + esc(d.name) + '</p>' +
        '<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><button type="button" class="sm2 g" data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: p.id, ym: prev })) + '\'>‹</button><b style="flex:1;text-align:center;font-size:var(--t3)">' + d.ym + '</b><button type="button" class="sm2 g" data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: p.id, ym: next })) + '\'' + (isNow ? ' disabled' : '') + '>›</button></div></div>' +
        '<div class="card"><div class="kv"><div><b>' + (d.n !== undefined ? d.n : d.members.length) + (d.cap < 1000 ? '/' + d.cap : '') + '</b><span>회원/자리<br>(캡틴 빼고)</span></div><div><b>' + d.totalRounds + '</b><span>라운드</span></div><div><b>' + d.totalHoles + '</b><span>공략 기록(홀)</span></div></div>' + (d.reqs ? '<button type="button" class="btn o sm" data-go="club" data-p=\'' + esc(JSON.stringify({ id: p.id, reqs: 1 })) + '\'>가입 신청 ' + d.reqs + '건 보기</button>' : '') + (d.locked ? '<div class="box err" style="margin-top:8px">' + LZ.ic('lock') + ' ' + esc(d.lockWhy) + '</div>' : ((d.n !== undefined ? d.n : d.members.length) >= d.cap && d.cap < 1000 ? '<div class="box" style="margin-top:8px">' + ((d.n !== undefined ? d.n : d.members.length) > d.cap ? '자리가 모자라요(' + ((d.n !== undefined ? d.n : d.members.length) - d.cap) + '명 넘음)' : '자리가 다 찼어요') + ' · <button type="button" class="sm2" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'red', mid: p.id })) + '\'>레드회원권 사기</button></div>' : '')) + '</div>' +
        zeroCard(d) + quietCard(d) + '<div class="card"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">' + LZ.ic('trophy') + ' ' + d.ym + ' 시상식</h3>' + (d.awards.length ? '<button type="button" class="sm2" data-act="cdShare">결과 그림</button>' : '') + '</div>' + (d.awards.length ? '<div class="list" style="margin-top:8px">' + d.awards.map(function (a) { return '<div class="it"><span class="awic">' + LZ.ic(a.ic || 'trophy') + '</span><div class="t"><b>' + esc(a.n) + '</b><span class="muted">' + LZ.nm(a.who) + ' · ' + esc(a.v) + '</span></div></div>'; }).join('') + '</div><p class="hint">끝낸 라운드(9홀 이상)와 공략 기록으로 자동 집계. 행운상은 이달 활동한 분 중 추첨이에요.</p>' : '<p class="muted" style="margin:8px 0 0">이달에 끝낸 라운드나 기록이 아직 없어요.</p>') + '</div>' +
        '<div class="card"><h3>회원 활동 <span class="muted" style="font-weight:400">· 30일 넘게 안 오신 분 ' + d.idle + '명</span></h3><div class="list">' + d.members.map(function (x) { var idle = Date.now() - x.seen > 30 * 86400000; return '<div class="it">' + LZ.avatar(x) + '<div class="t"><b>' + esc(x.nick) + '</b><span class="muted">라운드 ' + x.rounds + ' · 기록 ' + x.holes + '홀 · ' + (x.best ? '최고 ' + (x.best.d > 0 ? '+' : '') + x.best.d + ' · ' : '') + (x.seen ? '마지막 <span class="nw">' + LZ.fmtDate(x.seen) + '</span>' : '아직 안 옴') + '</span></div>' + (idle ? '<span class="chip gray">잠잠</span>' : '') + '</div>'; }).join('') + '</div></div></div>';
    }
  };
  /* v9.1.3 기록이 어려운 분 돕기 · 안 오신 분께 안부 */
  function zeroCard(d) {
    var z = d.zero || []; if (!z.length) return '';
    var left = z.filter(function (x) { return !x.sent || Date.now() - x.sent > 7 * 86400000; });
    return '<div class="card zero9"><h3>' + LZ.ic('help') + ' 아직 기록 0홀인 회원 ' + z.length + '명</h3><div class="list">' + z.map(function (x) {
      return '<div class="it">' + LZ.avatar(x) + '<div class="t"><b>' + esc(x.nick) + '</b><span class="muted">' + (x.joined ? '가입 ' + LZ.daysSince(x.joined) + '일' : '') + (x.hard.length ? ' · 어려워요: ' + esc(x.hard.join(', ')) : '') + (x.sent ? ' · 사용법 보냄 ' + LZ.fmtDate(x.sent) : '') + '</span></div></div>';
    }).join('') + '</div>' + (left.length ? '<button type="button" class="btn" data-act="cdGuide">' + left.length + '명에게 사용법 보내기</button>' : '<p class="hint">모두 사용법을 받았어요(같은 분께는 7일에 한 번).</p>') +
      '<button type="button" class="btn g" data-go="howto" data-p=\'{"print":1}\'>A4 사용법 인쇄용 (QR 포함)</button></div>';
  }
  function quietCard(d) {
    var q = d.quiet || []; if (!q.length) return '';
    var ok = function (x) { return !x.sent || Date.now() - x.sent > 14 * 86400000; }, left = q.filter(ok);
    return '<div class="card quiet9"><h3>' + LZ.ic('heart') + ' 요즘 안 오신 분 ' + q.length + '명 <span class="muted" style="font-weight:400">· 3주 넘게</span></h3><div class="list">' + q.map(function (x) {
      return '<div class="it">' + LZ.avatar(x) + '<div class="t"><b>' + esc(x.nick) + '</b><span class="muted">' + (x.seen ? '마지막 ' + LZ.fmtDate(x.seen) + ' · ' + LZ.daysSince(x.seen) + '일 전' : '아직 안 옴') + '</span></div>' +
        (ok(x) ? '<button type="button" class="sm2" data-act="cdHello" data-v="' + esc(x.uid) + '">안부</button>' : '<span class="chip gray">보냄 ✓</span>') + '</div>';
    }).join('') + '</div>' + (left.length > 1 ? '<button type="button" class="btn g" data-act="cdHello" data-v="*">남은 ' + left.length + '명에게 한 번에 보내기</button>' : '') + '<p class="hint">앱 알림으로 캡틴 이름으로 가요. 같은 분께는 2주에 한 번만.</p></div>';
  }
  LZ.act.cdGuide = async function () {
    var z = (CD.zero || []).filter(function (x) { return !x.sent || Date.now() - x.sent > 7 * 86400000; }).map(function (x) { return x.uid; });
    if (!z.length || !(await LZ.confirm(z.length + '명에게 사용법을 보낼까요?', '“기록은 좌우 · 볼스피드만 누르면 끝! 1분 사용법을 보내 드려요.” 알림이 가고, 누르면 사용법 화면이 열려요.', '보내기'))) return;
    try { var r = await LZ.api('moimNudge', { id: CD.mid, kind: 'guide', uids: z }); LZ.toast(r.sent + '명에게 보냈어요', 3000); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  var HELLO = ['요즘 안 보이셔서 궁금했어요. 이번 주에 같이 쳐요!', '날이 추워졌어요. 건강 챙기시고 시간 되면 들러 주세요.'];
  LZ.act.cdHello = function (el, v) {
    var who = v === '*' ? (CD.quiet || []).filter(function (x) { return !x.sent || Date.now() - x.sent > 14 * 86400000; }) : (CD.quiet || []).filter(function (x) { return x.uid === v; });
    if (!who.length) return; CD.helloTo = who.map(function (x) { return x.uid; });
    LZ.sheet('<h2>' + (who.length > 1 ? who.length + '명에게' : LZ.nimE(who[0].nick) + '께') + ' 안부</h2><p class="muted">보낼 말을 골라요</p>' + HELLO.map(function (t, i) { return '<button type="button" class="opt" data-act="cdHelloGo" data-v="' + i + '"><b>“' + esc(t) + '”</b></button>'; }).join('') +
      '<label class="lb" for="hlTx">직접 적기</label><textarea id="hlTx" rows="2" maxlength="80" placeholder="80자까지"></textarea><button type="button" class="btn" data-act="cdHelloGo" data-v="own">이 말로 보내기</button>');
  };
  LZ.act.cdHelloGo = async function (el, v) {
    var t = v === 'own' ? ($('#hlTx').value || '').trim() : HELLO[+v]; if (!t) { LZ.toast('보낼 말을 적어 주세요'); return; }
    LZ.closeSheet();
    try { var r = await LZ.api('moimNudge', { id: CD.mid, kind: 'hello', uids: CD.helloTo, text: t }); LZ.toast(r.sent ? r.sent + '명에게 안부를 보냈어요' : '이미 보냈어요(2주에 한 번)', 3000); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  var CD = null, AW_EMO = { trophy: '🏆', medal: '🥈', target: '🔥', note: '📝', clover: '🍀' };   // 카카오톡으로 보내는 글·그림에만 이모지
  LZ.act.cdShare = async function () {
    var d = CD, cv = document.createElement('canvas'), W = 1080, rh = 110, H = 300 + d.awards.length * rh + 60; cv.width = W; cv.height = H; var g = cv.getContext('2d'), F = '"Noto Sans KR", sans-serif';
    g.fillStyle = '#F3F6F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0B5D4B'; g.fillRect(0, 0, W, 200); g.fillStyle = '#FBBF24'; g.font = '700 40px ' + F; g.fillText('⛳ ' + d.name, 50, 80); g.fillStyle = '#fff'; g.font = '700 60px ' + F; g.fillText('🏆 ' + d.ym + ' 시상식', 50, 160);
    d.awards.forEach(function (a, i) { var y = 260 + i * rh; g.fillStyle = i % 2 ? '#fff' : '#E7F3EF'; g.fillRect(40, y - 50, W - 80, rh); g.font = '700 46px ' + F; g.fillStyle = '#172026'; g.fillText((AW_EMO[a.ic] || '') + ' ' + a.n, 60, y + 10); g.font = '700 38px ' + F; g.fillStyle = '#0B5D4B'; g.fillText(LZ.nim(a.who), 60, y + 50); g.font = '400 30px ' + F; g.fillStyle = '#6B7280'; g.fillText(a.v, 60 + g.measureText(LZ.nim(a.who)).width + 30, y + 50); });
    g.fillStyle = '#9CA3AF'; g.font = '400 26px ' + F; g.fillText('파크골프 공략수첩 · ' + LZ.APP_URL, 50, H - 20);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); }), file = new File([blob], 'club-awards-' + d.ym + '.png', { type: 'image/png' });
    var text = '🏆 ' + d.name + ' ' + d.ym + ' 시상식\n' + d.awards.map(function (a) { return (AW_EMO[a.ic] || '') + ' ' + a.n + ': ' + LZ.nim(a.who) + ' (' + a.v + ')'; }).join('\n');
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: d.name, text: LZ.shareJoin(text, LZ.APP_URL) }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    LZ.kakaoShare(text, LZ.APP_URL);
  };
  LZ.screens.guide = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('사용 안내', { back: true, noBell: 1 }) + LZ.skeleton(5);
      var cfg = null; try { cfg = await LZ.api('cfg', {}, { noAuth: true }); } catch (e) { cfg = {}; } if (!alive()) return;
      var R = cfg.rules || { editHours: 2, teamsMax: 50, moimMax: 5, capMax: 3, reqDays: 7, roundMax: 5, roundHours: 12, tmpHours: 24, noteMax: 20, renewDays: 14, refundFullDays: 7, quietFrom: 22, quietTo: 7 };
      var won = function (n) { return Number(n).toLocaleString() + '원'; }, pw = cfg.pw || LZ.pw();
      if (cfg.pw) S.pw = cfg.pw;
      var hlRow = function (g) { return '<tr><td><b>' + LZ.MODE[g] + (g === 'p' ? '(기본)' : '') + '</b></td><td>' + LZ.fmtP(pw[g].base) + '</td><td>' + pw[g].step + 'm</td><td>' + LZ.r1(LZ.sugOf(80, g, 'h')).toFixed(1) + '</td><td>' + LZ.r1(LZ.sugOf(80, g, 'm')).toFixed(1) + '</td><td>' + LZ.r1(LZ.sugOf(80, g, 'l')).toFixed(1) + '</td></tr>'; };
      var D = function (t, html, open) { return '<details class="card acc"' + (open ? ' open' : '') + '><summary><h3>' + t + '</h3></summary><div class="accb">' + html + '</div></details>'; };
      root.innerHTML = LZ.hdr('사용 안내', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card tight groups"><button type="button" class="li" data-go="firstSteps">' + LZ.ic('ball', 'gi') + '<span class="t"><b>파크골프 첫걸음</b><span class="su">처음이시면 여기부터 · 규칙 · 점수 세는 법 · 매너</span></span>' + LZ.ic('chev') + '</button></div><p class="muted" style="margin:0 0 8px">제목을 누르면 펼쳐져요.</p>' +
        D('회원권 · 등급 · 요금', '<div class="seatguide">' + LZ.cleanHtml((cfg.seat && cfg.seat.guide) || '') + '</div><p class="muted" style="margin:8px 0 0">등급은 가진 회원권으로 저절로 정해져요: 기간 남은 <b>골드회원권</b>이 있으면 골드회원, 아니고 <b>레드회원권</b>이 있으면 레드회원, 둘 다 없으면 블루회원 · <b>블랙</b>은 이용 정지. 회원권이 끝나기 ' + LZ.remindTxt(cfg.seat && cfg.seat.remind) + '에 주인과 캡틴에게 알려 드리고, 끝나면 바로 그 자리가 빠져요. 자리가 모자라면 늦게 들어온 분부터 보기만 해요(캡틴은 자리 밖, 매니저는 그대로). 적립 포인트는 ' + ((cfg.seat && cfg.seat.point_unit) || 10) + 'P 단위로 결제에 섞어 쓸 수 있어요.</p>') +
        D('비밀번호 · 카카오 확인', '<p style="margin:0">가입할 때 <b>카카오로 본인 확인</b>을 한 번 해요(카카오 계정 하나에 회원 한 분, 카카오에서는 회원번호만 받아요). 로그인은 닉네임과 비밀번호 4자리로 해요. 잊으면 ① 로그인 화면 "비밀번호를 잊었어요" → <b>카카오로 확인</b>하고 새 4자리 정하기 ② 관리자가 만들어 준 계정은 관리자에게 찾기 신청(임시 번호 ' + R.tmpHours + '시간). 캡틴은 비밀번호를 볼 수도 바꿀 수도 없어요.</p>') +
        D('적립 포인트 · 레벨', (function () { var r = cfg.pt; if (!r) return '<p style="margin:0">내 정보 → 적립 포인트에서 봐요.</p>'; return '<p style="margin:0 0 6px">홀 기록 새로 적기 +' + r.hole_new + 'P(홀마다) · 다듬기 +' + r.hole_fix + 'P · 새 코스 등록 +' + r.course_reg + 'P · 코스 정보 고치기 +' + r.course_fix + 'P · 내 기록을 가져감 +' + r.import + 'P × 레벨 배수 · 회원권 구매 ' + r.earn_pct + '%. 하루 최대 ' + r.day_cap + 'P(결제 적립 빼고), 1P = 1원, ' + r.unit + 'P 단위로 쓰고 ' + r.years + '년 뒤 사라져요.</p><p style="margin:0">레벨(레벨 점수 — 구매 적립은 빼고, 써도 그대로): ' + r.names.map(function (n, k) { return LZ.LVN[k][0] + ' ' + n + ' ' + Number(r.th[k]).toLocaleString('ko-KR') + ' (×' + r.mul[k] + ')'; }).join(' · ') + '</p>'; })()) +
        D('볼스피드 기준', '<p style="margin:0 0 6px"><b>볼스피드</b>는 공이 출발하는 속도예요. <b>8~40</b>, 0.5씩 적어요. 8보다 약하면 <b>Min</b>, 40보다 세면 <b>Max</b>로 적어요. <b>센서 탄도</b>는 그 매장 센서 설정(더높게·높게·보통·낮게·더낮게)이고, 스크린은 굴러가는 마찰이 거의 없어 탄도가 높을수록 멀리 가요(캐리 = 날아간 거리, 런 = 떨어진 뒤 굴러간 거리).</p><p style="margin:0 0 6px">총 비거리 = (기준 거리 <b>' + LZ.fmtM(pw.d0) + 'm</b> + (볼스피드 − 모드 기준) × 1당 비거리) × (1 + 탄도 %) · 탄도 간격 <b>' + pw.gap + '%</b>(높게 +' + pw.gap + '% · 더높게 +' + LZ.r1(pw.gap * 2) + '%).</p><div class="tblwrap"><table class="tbl" style="font-size:var(--t0)"><tr><th>모드</th><th>모드<br>기준</th><th>1당<br>비거리</th><th>80m<br>높게</th><th>80m<br>보통</th><th>80m<br>낮게</th></tr>' + ['b', 'p', 'm'].map(hlRow).join('') + '</table></div><p class="muted" style="margin:6px 0 0">표시: <b>~17</b> = 17까지, <b>16~</b> = 16 넘게 17 전까지(아래 막대의 점이 정확한 자리). 기준과 1 이내면 초록 ●, 1 넘게 크면 ▲ · 작으면 ▼. 다른 모드·매장에서 칠 때는 <b>같은 거리</b>가 나오는 볼스피드로 바꿔 보여요. 그렇게 보면서 플레이 화면에서 고쳐 저장하면 그 코스의 <b>기록 기준</b>이 그 기준으로 바뀌고 다른 홀도 함께 바뀌어요. 관리자가 설정에서 바꾸면 여기도 같이 바뀌어요.</p>') +
        D('기록 규칙', '<ul style="margin:0;padding-left:18px"><li>위치 기준: <b>첫화면</b>(기본) · 홀컵 · 직접</li><li>좌우: <b>그대로</b> 또는 <span style="color:var(--red);font-weight:700">좌 1~10</span>·<span style="color:var(--blue);font-weight:700">우 1~10</span>칸, 볼스피드는 0.5씩. 단추를 꾹 누르면 빨리 움직여요</li><li>참고사항은 ' + R.noteMax + '자(사진은 없어요)</li><li>기록은 회원·코스마다 <b>하나</b>. 어느 클럽에서 적어도 같은 기록이고, 클럽을 나가도 그대로예요</li><li>회원님 기록은 같은 클럽 분 것만 보여요. 공개·비공개는 <b>코스마다</b> 자물쇠로 정해요(새 코스는 공개). <b>클럽 평균</b>은 이 코스를 공개한 회원님이 3명 이상일 때 보여요</li><li>코스 정보는 누구나 고치고 이력이 남아요</li></ul>') +
        D('클럽', '<ul style="margin:0;padding-left:18px"><li>가입: 초대 링크 · 클럽 코드 6자리 · 클럽 찾기 → 캡틴이 <b>승인</b>(또는 보류). ' + R.reqDays + '일 지나면 신청 정리</li><li>클럽을 만들 때 <b>회원권</b>을 넣어요(블루 1장까지 · 보관 중인 레드·골드 · 사서 넣기). 자리 = 회원권 장수 × 10, <b>캡틴은 자리에 안 들어가요</b></li><li>자리가 다 차면 승인이 안 돼요 → 캡틴·매니저가 <b>자리 늘리기</b>(레드·골드회원권 사기 또는 보관 회원권 넣기)</li><li>캡틴 바꾸기: 블루로 연 클럽은 받는 분의 블루회원권으로 바꿔 넣어요. 받는 분께 블루가 없으면 블루를 확보하거나 레드회원권을 사서 인수할 때 넘어가요. 전 캡틴은 매니저로 남아요</li><li>회원권을 넣은 분이 나갈 때 자리가 모자라면 레드는 캡틴에게 양도하고, 골드는 캡틴이 채우거나 레드를 사서 양도한 뒤 가지고 나가요</li><li>클럽을 닫으면 블루회원권은 캡틴에게, 레드·골드회원권은 각 주인의 보관함으로 돌아가요</li><li>회원 <b>내보내기</b>는 캡틴만. 내보내도 그분 기록은 그분 것</li><li>캡틴은 <b>매니저</b>를 회원권 1장의 자리 수만큼(' + (((cfg.seat && cfg.seat.seat_size) || 10)) + '명) 정할 수 있어요. 매니저는 가입 승인·소식·모임·챌린지·회원권 넣기 등 캡틴 일을 함께 하고 자리가 모자라도 잠기지 않아요. 회원 내보내기·매니저 정하기·캡틴 바꾸기·클럽 닫기는 캡틴만 해요</li><li>앱이 없는 분께는 <b>가입 안내 보내기</b>(카카오톡·문자)로 알려요</li></ul>') +
        D('필드 라운드 · 시상식 · 단체', '<div class="awlinks"><button type="button" class="sm2" data-go="awGuide">' + LZ.ic('book') + ' 시상식 안내</button><button type="button" class="sm2 o" data-act="awDemo">' + LZ.ic('trophy') + ' 미리보기</button></div><ul style="margin:0;padding-left:18px"><li><b>파크골프도, 일반골프도</b> 스코어를 기록해요: 파크골프(9홀 33 · 18홀 66)는 물론 일반골프(9홀 36 · 18홀 72)도. 개인·단체 모두 9·18·27·36홀</li><li>개별 라운드: 한 조 2~5명, 손님은 이름만. 끝내면 결과 화면에서 <b>시상식</b>을 열어 우승·준우승·장려·행운상(추첨) 등을 뽑고 결과 그림을 카카오톡으로 보내요</li><li>안 적은 홀은 파. ＋는 보기, −는 버디. 파를 고치면 ±는 그대로 두고 타수만 바뀌어요</li><li>끝낸 뒤 ' + (R.editHours || 2) + '시간까지 고칠 수 있고 고친 이력이 남아요. 주최자가 최종 확정하면 잠겨요</li><li>' + R.roundHours + '시간 지나면 저절로 끝나요</li><li><b>단체 라운드</b>: 누구나 주최. 조 1~' + (R.teamsMax || 50) + ' 사전 편성(자동 편성·대기 명단), 9/18/27/36홀(9홀 코스 1~4개), 구장 선택·새 등록, 조별 도는 순서 자동 배치</li><li>카카오톡 초대장(편성표 글+그림)을 받으면 앱에서 내 조로 바로 들어가요. 앱이 없던 분은 가입하면 손님 자리와 점수를 그대로 이어받아요</li><li>상황판 3탭(조별·개인·편성표), 집계 범위(코스·조), 시상식 1부 조별(행운상→다음에 잘 치자상→단합상→장려상→준우승→우승) · 2부 개인, 중복 수상 가능/불가, 결과 그림 공유, 도우미 2명</li></ul>') +
        D('알림·화면', '<p style="margin:0">휴대폰 알림은 앱을 <b>홈 화면에 추가</b>한 뒤에 돼요(아이폰은 꼭 추가해야 해요). 밤 ' + R.quietFrom + '시~아침 ' + R.quietTo + '시 알림은 아침에 모아서 보내요. 기록·라운드 화면에서는 화면이 꺼지지 않아요.</p>') + '</div>';
    }
  };

  /* ───── 안내 카드 화면(v7.4 #11 파크골프 첫걸음 · v7.0.3 시상식 안내): 카드 6장 + 위쪽 칸을 누르면 그 카드로. 로그인 없이 열려요.
     글은 관리자 설정(관리자 → 공지·홍보 → 파크골프 첫걸음 / 시상식 안내)에서 고쳐요 ───── */
  var GUIDE = {
    first: { title: '파크골프 첫걸음', api: ['firstSteps', {}], lead: '파크골프를 처음 시작하시나요?', sub: '여섯 가지만 알면 바로 함께 칠 수 있어요. 아래 칸을 누르면 그 설명으로 가요.' },
    awards: { title: '시상식 안내', api: ['guideCards', { g: 'awards' }], lead: '라운드 끝, 시상식은 이렇게 해요', sub: '여섯 가지만 보면 돼요. 아래 칸을 누르면 그 설명으로 가요. 맨 아래에서 샘플 조로 미리 해 볼 수 있어요.',
      foot: '<div class="card awdemo"><b>직접 눌러 보세요</b><span>샘플 조 4명(18홀)으로 꾸민 시상식이에요. 상을 켜고 끄거나 차례를 바꿔도 내 기록에는 남지 않아요.</span><button type="button" class="btn gold" data-act="awDemo">' + LZ.ic('trophy') + '시상식 미리보기 시작</button></div>' }
  };
  function guideShow(g) {
    var G = GUIDE[g];
    return async function (p, root, alive) {
      var H = LZ.hdr(G.title, { back: true, noBell: 1 });
      root.innerHTML = H + LZ.skeleton(5);
      var r = null; try { r = await LZ.api(G.api[0], G.api[1], { noAuth: true }); } catch (e) { r = null; } if (!alive()) return;
      if (!r || !r.cards) { root.innerHTML = H + '<div class="wrap"><div class="empty">안내를 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.</div>' + (G.foot || '') + '</div>'; return; }
      root.innerHTML = H + '<div class="wrap fsw"><div class="fsin"><b>' + G.lead + '</b><span>' + G.sub + '</span></div>' +
        '<div class="fsx">' + r.cards.map(function (c, i) { return '<button type="button" class="fst" data-act="fsJump" data-v="' + (i + 1) + '">' + LZ.ic(c.ic) + '<b>' + esc(c.t) + '</b></button>'; }).join('') + '</div>' +
        r.cards.map(function (c, i) { return '<section class="card fsc" id="fs' + (i + 1) + '"><div class="fsh"><span class="fsi">' + LZ.ic(c.ic) + '</span><span class="fsn">' + (i + 1) + '</span><h3>' + esc(c.t) + '</h3></div><ul class="fsb ntbody">' + LZ.cleanHtml(c.b).split(/<br\s*\/?>/i).filter(function (x) { return x.trim(); }).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></section>'; }).join('') +
        (G.foot || '') + '<p class="hint">' + esc(r.note || '') + '</p>' + (S.user && S.user.kind === 'admin' ? '<button type="button" class="btn g sm" data-go="firstAdmin"' + (g === 'first' ? '' : ' data-p=\'{"g":"' + g + '"}\'') + '>' + LZ.ic('edit') + '안내 글 고치기(관리자)</button>' : '') + '</div>';
    };
  }

  /* ═════════ v9.2 클럽 채팅 · 모임 참석 투표 ═════════ */
  /* v9.3 클럽 화면 둘째 줄: 이달 순위 · 사진첩 · 출석 도장 */
  function clubMore93(m) { var p = esc(JSON.stringify({ mid: m.id })); return '<div class="cact9 c3 c3s"><button type="button" class="cab9" data-go="rank" data-p=\'' + p + '\'>' + LZ.ic('trophy') + '<b>이달 순위</b></button><button type="button" class="cab9" data-go="album" data-p=\'' + p + '\'>' + LZ.ic('heart') + '<b>사진첩</b></button><button type="button" class="cab9" data-go="stamps">' + LZ.ic('medal') + '<b>출석 도장</b></button></div>'; }
  LZ.ago = function (t) { var s = (Date.now() - t) / 1000; return s < 60 ? '방금' : s < 3600 ? Math.floor(s / 60) + '분 전' : s < 86400 ? Math.floor(s / 3600) + '시간 전' : LZ.fmtDate(t); };
  function hm(t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h < 12 ? '오전 ' : '오후 ') + ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m; }
  function dayLbl(t) { var d = new Date(t); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + '일월화수목금토'.charAt(d.getDay()) + '요일'; }
  function whenTxt(w) { if (!w) return ''; var d = new Date(+w.slice(0, 4), +w.slice(5, 7) - 1, +w.slice(8, 10)); return w.slice(0, 4) + '년 ' + (+w.slice(5, 7)) + '월 ' + (+w.slice(8, 10)) + '일(' + '일월화수목금토'.charAt(d.getDay()) + ') ' + (+w.slice(11, 13) < 12 ? '오전 ' : '오후 ') + ((+w.slice(11, 13) + 11) % 12 + 1) + '시' + (w.slice(14, 16) !== '00' ? ' ' + (+w.slice(14, 16)) + '분' : ''); }
  LZ.whenTxt = whenTxt;
  /** 클럽 화면 맨 위 "이번 모임" 카드 */
  LZ.meetCard = function (x, mid, staff) {
    if (!x) return staff ? '<button type="button" class="meet9 add" data-act="meetEdit" data-v="' + esc(mid) + '">' + LZ.ic('plus') + '<span><b>모임 만들기</b><small>날짜 · 장소를 정하면 참석 투표가 시작돼요</small></span></button>' : '';
    var vb = function (v, t) { return '<button type="button" class="' + (x.mine === v ? 'on' : '') + '" data-act="meetVote" data-v=\'' + esc(JSON.stringify({ mid: mid, id: x.id, v: x.mine === v ? '' : v })) + '\'' + (x.closed ? ' disabled' : '') + ' aria-pressed="' + (x.mine === v) + '">' + t + (x.mine === v ? ' ✓' : '') + '</button>'; };
    return '<div class="meet9"><button type="button" class="mh" data-go="meet" data-p=\'' + esc(JSON.stringify({ mid: mid })) + '\'><span class="k">이번 모임' + (x.closed ? ' · 마감' : x.close ? ' · 마감 ' + whenTxt(x.close).replace(/^\d+년 /, '') : '') + '</span><b>' + esc(whenTxt(x.when).replace(/^\d+년 /, '')) + (x.place ? ' · ' + esc(x.place) : '') + '</b><span class="c">참석 ' + x.y + ' · 불참 ' + x.n + ' · 미정 ' + x.m + ' · 아직 ' + x.none + '</span></button>' +
      '<div class="vb">' + vb('y', '참석') + vb('n', '불참') + vb('m', '미정') + '</div></div>';
  };
  LZ.act.meetVote = async function (el, v) {
    var o = JSON.parse(v);
    try { var r = await LZ.api('meetVote', o); LZ.toast(o.v === 'y' ? '참석으로 표시했어요 · 전날 저녁에 알려 드려요' : o.v === 'n' ? '불참으로 표시했어요' : o.v === 'm' ? '미정으로 표시했어요' : '투표를 지웠어요', 2500); if (CL && CL.d) CL.d.meetNow = r.meet; if (MT.d) MT.d.meet = r.meet; LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  var MT = { d: null };
  LZ.screens.meet = {
    tab: 'home',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('이번 모임', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('meetGet', { mid: p.mid }); if (!alive()) return; MT.d = d; MT.mid = p.mid;
      var x = d.meet;
      root.innerHTML = LZ.hdr('이번 모임', { back: true }) + '<div class="wrap meetp9">' + (x ? LZ.meetCard(x, p.mid, d.staff) +
        (x.note ? '<p class="mnote9">' + esc(x.note) + '</p>' : '') +
        '<div class="card mbar9"><div class="bar"><i class="y" style="width:' + (x.total ? x.y / x.total * 100 : 0) + '%"></i><i class="n" style="width:' + (x.total ? x.n / x.total * 100 : 0) + '%"></i><i class="m" style="width:' + (x.total ? x.m / x.total * 100 : 0) + '%"></i></div>' +
          '<div class="g4"><div><b class="y">' + x.y + '</b><span>참석</span></div><div><b class="n">' + x.n + '</b><span>불참</span></div><div><b class="m">' + x.m + '</b><span>미정</span></div><div><b>' + x.none + '</b><span>아직</span></div></div></div>' +
        (x.yes.length ? '<div class="hdr9">참석 ' + x.y + '명' + (x.y >= 4 ? ' · ' + Math.ceil(x.y / 4) + '개 조로 나누면 ' + Math.ceil(x.y / Math.ceil(x.y / 4)) + '명씩' : '') + '</div><div class="card names9">' + x.yes.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' : '') +
        (d.staff && x.noneNick && x.noneNick.length ? '<div class="hdr9">아직 투표 안 한 분 ' + x.noneNick.length + '명</div><div class="card names9 gray">' + x.noneNick.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' : '') +
        (d.staff ? '<div class="row2"><button type="button" class="btn g" data-act="meetRemind">아직 ' + x.none + '명에게 알림</button><button type="button" class="btn g" data-act="meetEdit" data-v="' + esc(p.mid) + '">모임 고치기</button></div><button type="button" class="btn o" data-go="evMake">참석자와 단체 라운드 만들기</button>' : '') +
        '<p class="hint">참석을 누르면 전날 저녁 7시에 휴대폰으로 알려 드려요(알림을 켠 분).</p>'
        : '<div class="empty">아직 정한 모임이 없어요.' + (d.staff ? '' : ' 캡틴 · 매니저가 모임을 만들면 여기서 투표해요.') + '</div>' + (d.staff ? '<button type="button" class="btn" data-act="meetEdit" data-v="' + esc(p.mid) + '">' + LZ.ic('plus') + '모임 만들기</button>' : '')) +
        (d.past && d.past.length ? '<div class="hdr9">지난 모임</div><div class="card tight">' + d.past.map(function (y) { return '<div class="it"><div class="t"><b>' + esc(whenTxt(y.when)) + '</b><span class="muted">' + (y.place ? esc(y.place) + ' · ' : '') + '참석 ' + y.y + '명</span></div></div>'; }).join('') + '</div>' : '') + '</div>';
    }
  };
  LZ.act.meetRemind = async function () { try { var r = await LZ.api('meetRemind', { mid: MT.mid }); LZ.toast(r.n + '명에게 알렸어요', 2500); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.meetEdit = function (el, mid) {
    var x = (MT.d && MT.mid === mid && MT.d.meet) || (CL && CL.d && CL.d.moim && CL.d.moim.id === mid && CL.d.meetNow) || null;
    var nx = new Date(); nx.setDate(nx.getDate() + ((6 - nx.getDay() + 7) % 7 || 7)); var dflt = nx.getFullYear() + '-' + ('0' + (nx.getMonth() + 1)).slice(-2) + '-' + ('0' + nx.getDate()).slice(-2);
    LZ.sheet('<h2>' + (x ? '모임 고치기' : '모임 만들기') + '</h2><label class="lb" for="mtD">날짜</label><input type="date" id="mtD" class="in" value="' + esc(x ? x.when.slice(0, 10) : dflt) + '">' +
      '<label class="lb" for="mtT">시간</label><input type="time" id="mtT" class="in" value="' + esc(x ? x.when.slice(11) : '09:00') + '">' +
      '<label class="lb" for="mtP">장소</label><input type="text" id="mtP" class="in" maxlength="30" placeholder="예: 레저로 양주점" value="' + esc(x ? x.place : '') + '">' +
      '<label class="lb" for="mtN">한 줄 메모(선택)</label><input type="text" id="mtN" class="in" maxlength="60" placeholder="예: 끝나고 점심 · 회비 없음" value="' + esc(x ? x.note : '') + '">' +
      '<label class="lb" for="mtC">투표 마감(선택)</label><input type="datetime-local" id="mtC" class="in" value="' + esc(x && x.close ? x.close : '') + '">' +
      '<button type="button" class="btn" data-act="meetSave" data-v=\'' + esc(JSON.stringify({ mid: mid, id: x ? x.id : '' })) + '\'>' + (x ? '고친 내용 저장' : '만들고 투표 알림 보내기') + '</button>');
  };
  LZ.act.meetSave = async function (el, v) {
    var o = JSON.parse(v), dd = $('#mtD').value, tt = $('#mtT').value; if (!dd || !tt) { LZ.toast('날짜와 시간을 골라 주세요'); return; }
    o.when = dd + 'T' + tt.slice(0, 5); o.place = $('#mtP').value; o.note = $('#mtN').value; o.close = ($('#mtC').value || '').slice(0, 16);
    try { var r = await LZ.api('meetSet', o); LZ.closeSheet(); LZ.toast('모임을 ' + (o.id ? '고쳤어요' : '만들고 회원님께 알렸어요'), 3000); if (CL && CL.d) CL.d.meetNow = r.meet; LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4500); }
  };

  /* 채팅방 */
  var CH = { mid: '', d: null, reply: null, poll: 0, busy: false };
  function chatBody(d) {
    var out = '', lastDay = '', lastUid = '', lastAt = 0;
    d.list.forEach(function (c) {
      var day = dayLbl(c.at); if (day !== lastDay) { out += '<div class="cday9">' + day + '</div>'; lastDay = day; lastUid = ''; }
      if (c.kind && c.kind.indexOf('sys:') === 0) { out += '<div class="csys9 ' + esc(c.kind.slice(4)) + '"><small>' + ({ meet: '모임 투표', welcome: '새 회원 환영', round: '라운드 결과', award: '이달의 상', badge: '배지', photo: '사진첩', vs: '클럽 대항전' }[c.kind.slice(4)] || '알림') + '</small><span>' + esc(c.text) + '</span>' + (c.kind === 'sys:meet' ? '<button type="button" data-go="meet" data-p=\'' + esc(JSON.stringify({ mid: CH.mid })) + '\'>투표하러 가기</button>' : c.kind === 'sys:photo' ? '<button type="button" data-go="album" data-p=\'' + esc(JSON.stringify({ mid: CH.mid })) + '\'>사진 보기</button>' : c.kind === 'sys:award' ? '<button type="button" data-go="rank" data-p=\'' + esc(JSON.stringify({ mid: CH.mid })) + '\'>순위 보기</button>' : '') + '</div>'; lastUid = ''; return; }
      var rp = c.reply ? d.list.filter(function (y) { return y.id === c.reply; })[0] : null, cont = lastUid === c.uid && c.at - lastAt < 180000;
      var bub = '<button type="button" class="cb9' + (c.hide ? ' hid' : '') + '" data-act="chatMsg" data-v="' + esc(c.id) + '">' + (rp ? '<span class="rp">↳ ' + esc(rp.nick || '') + ': ' + esc((rp.text || '(가린 글)').slice(0, 24)) + '</span>' : '') + (c.hide ? '가린 글이에요' : esc(c.text)) + '</button>';
      out += c.mine ? '<div class="cm9 me">' + '<span class="tm">' + hm(c.at) + '</span>' + bub + '</div>'
        : '<div class="cm9' + (cont ? ' cont' : '') + '">' + (cont ? '<span class="avs"></span>' : LZ.avatar(c)) + '<div class="cw">' + (cont ? '' : '<span class="nk">' + esc(c.nick) + '</span>') + '<div class="cr">' + bub + '<span class="tm">' + hm(c.at) + '</span></div></div></div>';
      lastUid = c.uid; lastAt = c.at;
    });
    return out || '<div class="empty">첫 인사를 남겨 보세요.</div>';
  }
  function chatPaint(root, keepInput) {
    var d = CH.d, inp = $('#chIn'), val = keepInput && inp ? inp.value : '';
    root.innerHTML = LZ.hdr(d.name, { back: true, nosub: 1, noRf: 1, btns: '<button type="button" class="tb" data-act="chatMenu" aria-label="채팅 메뉴">' + LZ.ic('more') + '</button>' }) +
      '<div class="chat9"' + (d.color ? ' style="--clc:' + esc(d.color) + '"' : '') + '>' + (d.pin ? '<button type="button" class="cpin9" data-go="notices" data-p=\'' + esc(JSON.stringify({ mid: CH.mid })) + '\'><span>공지</span>' + esc(d.pin.title) + '</button>' : '') +
      '<div class="clist9" id="chList">' + (d.more ? '<button type="button" class="lnk" data-act="chatOlder">이전 글 더 보기</button>' : '') + chatBody(d) + '</div>' +
      '<div class="cin9">' + (CH.reply ? '<div class="crp9"><span>↳ ' + esc(CH.reply.nick || '') + ': ' + esc((CH.reply.text || '').slice(0, 30)) + '</span><button type="button" data-act="chatReplyOff" aria-label="답장 취소">✕</button></div>' : '') +
      '<div class="crow9"><label class="sr" for="chIn">메시지</label><textarea id="chIn" rows="1" maxlength="500" placeholder="메시지 보내기" enterkeyhint="send"></textarea><button type="button" class="csend9" data-act="chatSend" aria-label="보내기">' + LZ.ic('play') + '</button></div></div></div>';
    var t = $('#chIn'); if (t) { t.value = val; t.addEventListener('input', function () { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }); t.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); LZ.act.chatSend(); } }); }
    var l = $('#chList'); if (l) l.scrollTop = l.scrollHeight;
  }
  async function chatLoad(fresh) {
    if (CH.busy) return; CH.busy = true;
    try { var d = await LZ.api('chatList', { mid: CH.mid }); if (LZ.cur().name !== 'chat') return; var n0 = CH.d ? CH.d.list.length : -1; CH.d = d; if (fresh || d.list.length !== n0) chatPaint($('#app'), true); if (S.me && S.me.chat) delete S.me.chat[CH.mid]; }
    catch (e) { if (fresh) LZ.toast(LZ.errText(e), 4000); } finally { CH.busy = false; }
  }
  LZ.chatPing = function (mid) { if (LZ.cur().name === 'chat' && CH.mid === mid) chatLoad(false); };
  LZ.screens.chat = {
    tab: 'home', nobar: true,
    show: async function (p, root, alive) {
      if (CH.mid !== p.mid) { CH.d = null; CH.reply = null; } CH.mid = p.mid;
      if (CH.d) chatPaint(root); else root.innerHTML = LZ.hdr('클럽 채팅', { back: true }) + LZ.skeleton(5);
      await chatLoad(true); if (!alive()) return;
      clearInterval(CH.poll); CH.poll = setInterval(function () { if (LZ.cur().name !== 'chat') { clearInterval(CH.poll); return; } if (document.visibilityState === 'visible') chatLoad(false); }, 20000);   // 실시간이 끊겨도 20초마다
    }
  };
  LZ.act.chatSend = async function () {
    var t = $('#chIn'), v = t ? t.value.replace(/^\s+|\s+$/g, '') : ''; if (!v) return;
    var body = { mid: CH.mid, text: v }; if (CH.reply) body.reply = CH.reply.id;
    t.value = ''; t.style.height = 'auto'; var rp = CH.reply; CH.reply = null;
    var tmp = { id: 'tmp', uid: S.user.uid, nick: S.user.nick, text: v, at: Date.now(), reply: rp ? rp.id : '', kind: '', hide: 0, mine: 1 }; CH.d.list.push(tmp); chatPaint($('#app')); var ti = $('#chIn'); if (ti) ti.focus();
    try { await LZ.api('chatSend', body, { retry: 0 }); await chatLoad(true); var t2 = $('#chIn'); if (t2) t2.focus(); }
    catch (e) { CH.d.list = CH.d.list.filter(function (x) { return x !== tmp; }); chatPaint($('#app')); var t3 = $('#chIn'); if (t3) t3.value = v; LZ.toast(LZ.errText(e), 4000); }
  };
  LZ.act.chatMsg = function (el, id) {
    var c = CH.d.list.filter(function (x) { return x.id === id; })[0]; if (!c || id === 'tmp') return;
    LZ.sheet('<h2>' + esc(c.nick || '') + '</h2><p class="muted" style="white-space:pre-wrap">' + esc(c.hide ? '가린 글이에요' : c.text) + '</p>' +
      (c.hide ? '' : '<button type="button" class="opt" data-act="chatReply" data-v="' + esc(id) + '"><b>답장</b></button><button type="button" class="opt" data-act="copy" data-v="' + esc(c.text) + '"><b>복사</b></button>') +
      (c.mine || CH.d.staff ? '<button type="button" class="opt" data-act="chatHideGo" data-v="' + esc(id) + '"><b>' + (c.hide ? '다시 보이기' : '가리기') + '</b><span>' + (c.mine ? '내 글' : '캡틴 · 매니저') + '</span></button>' : '') +
      (!c.mine && !c.hide ? '<button type="button" class="opt dng" data-act="chatReportGo" data-v="' + esc(id) + '"><b>신고</b><span>캡틴 · 매니저에게 알려요</span></button>' : ''));
  };
  LZ.act.chatReply = function (el, id) { LZ.closeSheet(); CH.reply = CH.d.list.filter(function (x) { return x.id === id; })[0] || null; chatPaint($('#app'), true); var t = $('#chIn'); if (t) t.focus(); };
  LZ.act.chatReplyOff = function () { CH.reply = null; chatPaint($('#app'), true); };
  LZ.act.chatHideGo = async function (el, id) { var c = CH.d.list.filter(function (x) { return x.id === id; })[0]; LZ.closeSheet(); try { await LZ.api('chatHide', { mid: CH.mid, id: id, show: c && c.hide ? 1 : 0 }); chatLoad(true); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.chatReportGo = async function (el, id) { LZ.closeSheet(); if (!(await LZ.confirm('이 글을 신고할까요?', '캡틴 · 매니저에게 알림이 가요. 누가 신고했는지는 알리지 않아요.', '신고'))) return; try { await LZ.api('chatReport', { mid: CH.mid, id: id }); LZ.toast('알렸어요', 2500); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.chatOlder = async function () { try { var d = await LZ.api('chatList', { mid: CH.mid, before: CH.d.list[0] ? CH.d.list[0].at : Date.now() }); CH.d.list = d.list.concat(CH.d.list); CH.d.more = d.more; chatPaint($('#app'), true); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.chatMenu = function () { LZ.sheet('<h2>' + esc(CH.d.name) + ' 채팅</h2><button type="button" class="opt" data-go="club" data-p=\'' + esc(JSON.stringify({ id: CH.mid })) + '\'><b>클럽 화면</b></button><button type="button" class="opt" data-go="meet" data-p=\'' + esc(JSON.stringify({ mid: CH.mid })) + '\'><b>이번 모임 · 참석 투표</b></button><button type="button" class="opt" data-go="notiCfg"><b>알림 설정</b><span>클럽 채팅 알림 켜고 끄기 · 같은 클럽은 10분에 한 번만 울려요</span></button><p class="hint">대화는 90일 동안 보관해요. 길게 쓴 글을 누르면 답장 · 복사 · 신고를 할 수 있어요.</p>'); };
  LZ.screens.firstSteps = { show: guideShow('first') };
  /* v9.1.3 1분 사용법: 기록은 세 가지만 · 인쇄(A4 · QR) */
  LZ.screens.howto = {
    tab: 'me',
    show: function (p, root) {
      var st = [['1', '스크린에서 친 방향', '공이 왼쪽으로 갔으면 <b>◀</b>, 오른쪽이면 <b>▶</b>. 똑바로 갔으면 그대로 두세요.'], ['2', '볼스피드 숫자', '스크린에 나온 볼스피드를 <b>▼▲</b>로 맞춰요. 0.5씩 움직여요.'], ['3', '[다음]', '다 맞췄으면 <b>[다음]</b>. 수첩에 저장되고 다음 홀로 가요. 다음에 같은 홀에서는 이 값이 먼저 보여요.']];
      root.innerHTML = LZ.hdr('1분 사용법', { back: true }) + '<div class="wrap howto9">' +
        '<div class="hw9h"><img src="icons/icon-192.png" alt="" width="44" height="44"><div><b>파크골프 공략수첩</b><span>홀마다 내 공략을 적어 두는 수첩</span></div></div>' +
        '<p class="hw9l">기록은 이 세 가지만 하면 돼요</p>' + st.map(function (x) { return '<div class="hw9s"><span class="n">' + x[0] + '</span><div><b>' + x[1] + '</b><p>' + x[2] + '</p></div></div>'; }).join('') +
        '<div class="hw9q"><div id="hwQr" class="qr"></div><div><b>휴대폰 카메라로 찍으면 바로 열려요</b><span>' + esc(LZ.APP_URL) + '</span><span>처음이면 [가입하기] → 닉네임 · 비밀번호 4자리</span></div></div>' +
        '<div class="hw9b noprint"><button type="button" class="btn" data-act="howCoach">플레이 화면에서 따라 하기</button><button type="button" class="btn g" data-act="howPrint">' + LZ.ic('note') + 'A4로 인쇄하기</button></div></div>';
      LZ.qr($('#hwQr'), LZ.APP_URL);
    }
  };
  LZ.act.howPrint = function () { setTimeout(function () { window.print(); }, 300); };
  LZ.act.howCoach = function () { store.del('lz.coach.play9'); LZ.toast('코스를 열고 플레이를 누르면 따라 하기가 나와요', 3500); LZ.go('courses', {}, { reset: true }); };
  LZ.screens.awGuide = { show: guideShow('awards') };
  /* 시상식 미리보기: 단체·시상식 모듈(event.js)을 먼저 받고 샘플 조 시상식으로 */
  LZ.act.awDemo = async function () { try { await LZ.need('event'); } catch (e) { LZ.toast(LZ.errText(e), 4000); return; } LZ.go('awards', { demo: 1 }); };
  LZ.act.fsJump = function (el, v) { var t = $('#fs' + v); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  /* ───── 공지(관리자: 모든 회원님 / 캡틴: 클럽 소식) ───── */
  LZ.noticeBody = function (n) { return (n.img ? '<img data-img="' + esc(n.img) + '" alt="">' : '') + '<div class="ntbody">' + LZ.cleanHtml(n.html) + '</div>'; };
  LZ.cleanHtml = function (h) { return String(h || '').replace(/<(?!(\/?(b|br)\s*\/?|span class="(big|c-r|c-b|c-g)"|\/span)>)[^>]*>/gi, ''); };   // </span> 도 남겨야 색이 글 끝까지 번지지 않아요
  /* 사진은 화면에 보일 때만 받아요(한 번 받은 것은 기억) */
  var imgMem = {};
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); loadImg(e.target); } }); }, { rootMargin: '200px' }) : null;
  async function loadImg(el) {
    var id = el.dataset.img; el.removeAttribute('data-img'); if (!id) return;
    if (/^assets\//.test(id)) { el.src = id; return; }
    if (imgMem[id]) { el.src = imgMem[id]; return; }
    try { var r = await LZ.api('imgGet', { id: id }); imgMem[id] = r.data; el.src = r.data; } catch (e) { el.remove(); }
  }
  LZ.fillImgs = function (root) { $$('img[data-img]', root).forEach(function (el) { el.loading = 'lazy'; if (io) io.observe(el); else loadImg(el); }); };
  LZ.screens.notices = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('공지·소식', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('noticeList', p.manage ? { manage: 1 } : (p.mid ? { mid: p.mid } : {})); if (!alive()) return;
      LZ.noticeMarkSeen(r.list);
      root.innerHTML = LZ.hdr(p.manage ? '공지 관리' : '공지·소식', { back: true }) + '<div class="wrap">' +
        (r.canWrite ? '<button type="button" class="btn o mk1" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ br: p.mid || (S.user.kind === 'admin' ? '' : (r.moims[0] || {}).id) })) + '\'>' + LZ.ic('edit') + (S.user.kind === 'admin' && !p.mid ? '공지 쓰기' : '소식 쓰기') + '</button>' : '') +
        (r.list.length ? r.list.map(function (n) { return '<div class="card"><div style="display:flex;align-items:center;gap:6px"><b style="flex:1;font-size:var(--t3)">' + (n.pin ? LZ.ic('pin') + ' ' : '') + esc(n.title) + '</b>' + (n.canEdit ? '<button type="button" class="sm2 g" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ id: n.id })) + '\'>고치기</button>' : '') + '</div><p class="muted" style="margin:2px 0 8px">' + [n.store, n.by ? ({ cap: '캡틴 ', mgr: '매니저 ', admin: '관리자 ' }[n.byRole] || '') + LZ.nim(n.by) : '', LZ.fmtDate(n.upd)].filter(Boolean).map(esc).join(' · ') + (n.end ? ' · ' + LZ.fmtYmd(n.end) + '까지' : '') + '</p>' + LZ.noticeBody(n) + (n.btns || []).map(function (b) { return '<button type="button" class="btn o sm" data-act="noticeBtn" data-v="' + esc(b.to) + '">' + esc(b.label) + '</button>'; }).join('') + '</div>'; }).join('') : '<div class="empty">공지가 없어요.</div>') + '</div>';
      LZ.fillImgs(root);
    }
  };
  LZ.act.noticeBtn = function (el, to) { if (/^https:/.test(to)) { window.open(to, '_blank', 'noopener'); return; } if (to === 'joinGuide') { LZ.closeSheet(); LZ.act.joinGuide(); return; } LZ.goTo({ join: 'join', invite: 'me', pay: 'pay', qna: 'qnaList', notices: 'notices', courses: 'courses' }[to] || to); };
  LZ.noticeMarkSeen = function (list) { var seen = store.json('lz.ntSeen') || {}; (list || []).forEach(function (n) { seen[n.id] = n.upd; }); store.setJSON('lz.ntSeen', seen); };
  var popBusy = false;
  LZ.noticePopup = async function () {
    if (popBusy || !S.me || !S.me.notices) return;
    var shown = store.json('lz.ntPop') || {}, want = S.me.notices.filter(function (n) { return n.popup && shown[n.id] !== n.upd; });
    if (!want.length) return; popBusy = true;
    try {
      var r = await LZ.api('noticeList', {}), map = {}; r.list.forEach(function (n) { map[n.id] = n; });
      for (var i = 0; i < want.length && i < 2; i++) {
        var n = map[want[i].id]; shown[want[i].id] = want[i].upd; store.setJSON('lz.ntPop', shown); if (!n) continue;
        var v = LZ.dialog({ title: n.title, html: '<div class="ntpop">' + LZ.noticeBody(n) + '</div><p class="hint">' + esc(n.store) + ' · ' + LZ.fmtDate(n.upd) + '</p>', cancel: 'ok', buttons: (n.btns || []).map(function (b, k) { return { label: b.label, kind: k ? 'g' : 'y', value: 'to:' + b.to }; }).concat([{ label: '확인', kind: (n.btns || []).length ? 'g' : 'y', value: 'ok' }]) });
        LZ.fillImgs($('#layer')); var x = await v;
        if (x && String(x).indexOf('to:') === 0) { LZ.act.noticeBtn(null, String(x).slice(3)); break; }
      }
    } catch (e) { /* 다음에 */ } finally { popBusy = false; }
  };
  LZ.screens.noticeEdit = {
    show: async function (p, root, alive) {
      var n = null, moims = [];
      root.innerHTML = LZ.hdr('공지 쓰기', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('noticeList', { manage: 1 }); if (!alive()) return; moims = r.moims || [];
      if (p.id) n = r.list.filter(function (x) { return x.id === p.id; })[0];
      var br = n ? n.br : (p.br || '');
      root.innerHTML = LZ.hdr(n ? '공지 고치기' : '공지 쓰기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">누구에게</label><select id="nbr" class="in">' + (r.all ? '<option value="">모든 회원님</option>' : '') + moims.map(function (m) { return '<option value="' + esc(m.id) + '"' + (m.id === br ? ' selected' : '') + '>' + esc(m.name) + ' 소식</option>'; }).join('') + '</select>' +
        '<label class="lb">제목</label><input type="text" id="ntitle" maxlength="40" value="' + esc(n ? n.title : '') + '"><label class="lb">내용</label>' + LZ.richEditor('nhtml', n ? LZ.cleanHtml(n.html) : '', '내용을 적어 주세요. 글을 긁어서 굵게·크게·색을 줄 수 있어요') +
        '<div class="tgl"><span>맨 위 고정</span>' + LZ.sw(n && n.pin, 'tglPin') + '</div><div class="tgl"><span>앱을 열 때 한 번 팝업</span>' + LZ.sw(n && n.popup, 'tglPop') + '</div><input type="hidden" id="npin" value="' + (n && n.pin ? 1 : 0) + '"><input type="hidden" id="npop" value="' + (n && n.popup ? 1 : 0) + '">' +
        '<label class="lb">보이는 기간(선택)</label><div class="row"><input type="date" id="nstart" class="in" value="' + esc(n ? n.start : '') + '"><input type="date" id="nend" class="in" value="' + esc(n ? n.end : '') + '"></div>' +
        '<button type="button" class="btn" data-act="noticeSave" data-v="' + esc(n ? n.id : '') + '">' + (n ? '고친 내용 저장' : '올리기') + '</button>' + (n ? '<button type="button" class="btn g" data-act="noticeDel" data-v="' + esc(n.id) + '">지우기</button>' : '') + '</div></div>';
    }
  };
  LZ.act.tglPin = function (el) { el.classList.toggle('on'); $('#npin').value = el.classList.contains('on') ? 1 : 0; };
  LZ.act.tglPop = function (el) { el.classList.toggle('on'); $('#npop').value = el.classList.contains('on') ? 1 : 0; };
  LZ.act.noticeSave = async function (el, id) {
    var html = LZ.richRead('nhtml');
    try { await LZ.api('noticeSave', { id: id || undefined, br: $('#nbr').value, title: $('#ntitle').value, html: html, pin: +$('#npin').value, popup: +$('#npop').value, start: $('#nstart').value, end: $('#nend').value }); LZ.refreshMe().catch(function () {}); LZ.toast('올렸어요'); LZ.back(); } catch (e) { LZ.toast(e.message, 5000); }
  };
  LZ.act.noticeDel = async function (el, id) { if (!(await LZ.confirm('이 공지를 지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('noticeDel', { id: id }); LZ.back(); } catch (e) { LZ.toast(e.message); } };

  /* ───── 문의(FAQ + 1:1) ───── */
  LZ.screens.qnaList = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('문의하기', { back: true }) + LZ.skeleton(4);
      var f = await LZ.api('faqList', {}), r = null; try { r = await LZ.api('qnaList', {}); } catch (e) { r = { err: e }; } if (!alive()) return;
      root.innerHTML = LZ.hdr('문의하기', { back: true }) + '<div class="wrap">' +
        (r && !r.err && !r.staff ? '<button type="button" class="btn o mk1" data-go="qnaNew">' + LZ.ic('edit') + '새 문의 쓰기</button>' : '') +
        '<div class="card"><h3>자주 묻는 질문</h3>' + f.faq.map(function (x, i) { return '<details style="padding:8px 0;border-bottom:1px solid var(--line)"><summary style="font-weight:700;cursor:pointer">' + esc(x.q) + '</summary><div class="ntbody muted" style="padding:8px 0 0">' + LZ.cleanHtml(x.a) + '</div></details>'; }).join('') + '</div>' +
        (r && !r.err ? '<div class="card"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">1:1 문의</h3></div>' + (r.list.length ? '<div class="list">' + r.list.map(function (q) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="qnaGet" data-p=\'' + esc(JSON.stringify({ id: q.id })) + '\'><div class="t"><b>' + (q.unread ? '<i class="udot" aria-label="새 답변"></i>' : '') + esc(q.title) + '</b><span class="muted">' + esc(q.catName) + ' · ' + (r.staff ? esc(q.nick) + ' · ' : '') + { open: '답변 기다림', answered: '답변 옴', closed: '끝남' }[q.status] + ' · ' + LZ.fmtDate(q.updated) + '</span></div><span>›</span></button>'; }).join('') + '</div>' : '<p class="muted" style="margin:8px 0 0">남긴 문의가 없어요.</p>') + '</div>' : '<div class="card"><p class="muted" style="margin:0">' + esc(r && r.err ? r.err.message : '') + '</p></div>') + '</div>';
    }
  };
  LZ.screens.qnaNew = {
    show: async function (p, root) {
      var cats = { pay: '결제·자리', course: '코스 정보', app: '앱 사용·오류', acct: '계정·비밀번호', branch: '클럽 관련', nick: '닉네임 확인 요청', etc: '기타' };
      root.innerHTML = LZ.hdr('새 문의', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">분류</label><select id="qcat" class="in">' + Object.keys(cats).map(function (k) { return '<option value="' + k + '"' + (p.cat === k ? ' selected' : '') + '>' + cats[k] + '</option>'; }).join('') + '</select><label class="lb">제목</label><input type="text" id="qtitle" maxlength="30" value="' + esc(p.title || '') + '"><label class="lb">내용</label>' + LZ.richEditor('qhtml', '', '자세히 적어 주시면 빨리 도와드릴 수 있어요') + '<button type="button" class="btn" data-act="qnaAsk" data-v="' + esc(p.cid || '') + '">보내기</button></div><p class="hint">답변은 관리자가 해요. 답이 오면 알림으로 알려 드려요.</p></div>';
    }
  };
  LZ.act.qnaAsk = async function (el, cid) { try { var r = await LZ.api('qnaAsk', { cat: $('#qcat').value, title: $('#qtitle').value, html: LZ.richRead('qhtml'), cid: cid || undefined }); LZ.go('qnaGet', { id: r.qna.id }, { replace: true }); LZ.toast('문의를 남겼어요'); } catch (e) { LZ.toast(e.message, 5000); } };
  LZ.screens.qnaGet = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('문의', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('qnaGet', { id: p.id }); if (!alive()) return; var q = r.qna;
      root.innerHTML = LZ.hdr(q.title, { back: true }) + '<div class="wrap"><p class="muted">' + esc(q.catName) + ' · ' + LZ.nimE(q.nick) + ' · ' + LZ.fmtDate(q.created, true) + (q.course ? ' · ' + esc(q.course.name) : '') + '</p>' +
        q.msgs.map(function (m) { return '<div class="card tight" style="' + (m.role === 'staff' ? 'background:var(--gl)' : '') + '"><div class="muted small">' + (m.role === 'staff' ? '관리자' : esc(m.by)) + ' · ' + LZ.fmtDate(m.at, true) + '</div><div class="ntbody">' + LZ.cleanHtml(m.html) + '</div></div>'; }).join('') +
        (q.status !== 'closed' ? '<div class="card">' + LZ.richEditor('qreply', '', q.canAnswer ? '답변을 적어 주세요' : '덧붙일 내용') + '<button type="button" class="btn" data-act="qnaReply" data-v="' + esc(q.id) + '">보내기</button><button type="button" class="btn g" data-act="qnaClose" data-v="' + esc(q.id) + '">문의 끝내기</button></div>' : '<div class="box">끝난 문의예요.</div>') + '</div>';
    }
  };
  LZ.act.qnaReply = async function (el, id) { try { await LZ.api('qnaReply', { id: id, html: LZ.richRead('qreply') }); LZ.redraw(); } catch (e) { LZ.toast(e.message, 5000); } };
  LZ.act.qnaClose = async function (el, id) { if (!(await LZ.confirm('문의를 끝낼까요?', '', '끝내기'))) return; try { await LZ.api('qnaClose', { id: id }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };

  /* ───────────── v9.3 이달의 클럽 순위 ───────────── */
  var RK = {};
  function ymTxt(ym) { return ym.slice(0, 4) + '년 ' + (+ym.slice(5)) + '월'; }
  function ymAdd(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5) + n; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + ('0' + m).slice(-2); }
  function rkVal(by, v) { return by === 'score' ? (v === 0 ? '이븐' : (v > 0 ? '+' : '') + v) : by === 'att' ? v + '번' : Number(v).toLocaleString('ko-KR') + '홀'; }
  LZ.screens.rank = {
    tab: 'home',
    show: async function (p, root, alive) {
      if (p.mid !== RK.mid) { RK.by = 'score'; RK.ym = ''; } RK.mid = p.mid;
      root.innerHTML = LZ.hdr('이달의 클럽 순위', { back: true }) + LZ.skeleton(5);
      var d = await LZ.api('clubRank', { mid: p.mid, by: RK.by, ym: RK.ym }); if (!alive()) return; RK.d = d; RK.ym = d.ym;
      var now = new Date(), cur = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2), L = d.list, top = L.slice(0, 3);
      var pod = top.length ? '<div class="pod9">' + [1, 0, 2].map(function (k) { var x = top[k]; if (!x) return '<div class="pc"></div>'; return '<div class="pc r' + x.rank + (x.uid === d.me ? ' me' : '') + '">' + LZ.avatar({ nick: x.nick, img: x.img }) + '<em>' + x.rank + '위</em><b>' + esc(x.nick) + '</b><span>' + (d.by === 'score' ? '평균 ' : '') + esc(rkVal(d.by, x.v)) + '</span><i></i></div>'; }).join('') + '</div>' : '';
      var rest = L.slice(3).map(function (x) { return '<div class="rk9' + (x.uid === d.me ? ' me' : '') + '"><em>' + x.rank + '</em>' + LZ.avatar({ nick: x.nick, img: x.img }) + '<b>' + (x.uid === d.me ? '나 · ' : '') + esc(x.nick) + '</b><span>' + esc(rkVal(d.by, x.v)) + '</span></div>'; }).join('');
      var hint = { score: '필드 라운드(9홀 이상 끝까지 친 것) 2번 이상 친 분만 들어가요 · 18홀로 맞춘 파 대비 평균, 적을수록 위', att: '모임 투표에서 “참석”을 누르고 그날이 지난 횟수', holes: '이달 스크린에서 기록을 남긴 홀 수' }[d.by];
      root.innerHTML = LZ.hdr(d.name, { back: true }) + '<div class="wrap rank9">' +
        '<div class="rkm9"><button type="button" data-act="rkMonth" data-v="-1" aria-label="지난달">' + LZ.ic('back') + '</button><b>' + ymTxt(d.ym) + ' 순위</b><button type="button" data-act="rkMonth" data-v="1" aria-label="다음 달"' + (d.ym >= cur ? ' disabled' : '') + '>' + LZ.ic('chev') + '</button></div>' +
        LZ.seg([['score', '타수'], ['att', '출석'], ['holes', '기록한 홀']], d.by, 'rkBy', 's') +
        (L.length ? pod + (rest ? '<div class="card tight rkl9">' + rest + '</div>' : '') : '<div class="empty">아직 순위가 없어요.<br><span class="muted">' + esc(hint) + '</span></div>') +
        (d.awards.length ? '<div class="aw9">' + LZ.ic('trophy') + '<div><small>' + (d.ym >= cur ? '이달의 상(지금까지)' : '이달의 상') + '</small><b>' + d.awards.map(function (a) { return esc(a.n) + ' <u>' + esc(a.who) + '</u> <span>' + esc(a.v) + '</span>'; }).join('<br>') + '</b></div></div>' : '') +
        (L.length ? '<p class="hint">' + esc(hint) + '</p>' : '') +
        '<p class="hint">매달 초 지난달 상이 클럽 채팅에 자동으로 올라가요.</p>' +
        '<div class="list"><div class="tgl"><span>순위에 내 이름 숨기기<span class="muted">숨겨도 나에게는 보여요</span></span>' + LZ.sw(d.off, 'rkOff') + '</div></div></div>';
    }
  };
  LZ.act.rkBy = function (el, v) { RK.by = v; LZ.redraw(); };
  LZ.act.rkMonth = function (el, v) { RK.ym = ymAdd(RK.ym || RK.d.ym, +v); LZ.redraw(); };
  LZ.act.rkOff = async function () { try { await LZ.api('uopt', { k: 'rankOff', v: RK.d && RK.d.off ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };

  /* ───────────── v9.3 홀별 클럽 팁(플레이 화면 위에 시트) ───────────── */
  var TP = {};
  function tipHtml(d) {
    var many = d.clubs.length > 1;
    return '<h2>' + (TP.h + 1) + '홀 클럽 팁</h2><p class="muted" style="margin-top:0">' + esc(TP.name || '') + (TP.par ? ' · 파 ' + TP.par : '') + ' · 우리 클럽 회원만 봐요</p>' +
      (d.list.length ? '<div class="tips9">' + d.list.map(function (t, i) {
        return '<div class="tp9' + (i === 0 && t.likes ? ' best' : '') + '">' + (i === 0 && t.likes >= 2 ? '<small class="bk">가장 도움 됨</small>' : '') + '<div class="w"><b>' + esc(t.nick) + '</b> · ' + esc(LZ.fmtDate(t.at)) + (many ? ' · ' + esc(t.club) : '') + '</div><p>' + esc(t.text) + '</p>' +
          '<div class="r">' + (t.mine ? '<span class="muted">도움 됐어요 ' + t.likes + '</span><button type="button" class="sm2 g" data-act="tipDel" data-v="' + esc(t.id) + '">지우기</button>' : '<button type="button" class="lk' + (t.liked ? ' on' : '') + '" data-act="tipLike" data-v="' + esc(t.id) + '" aria-pressed="' + (t.liked ? 'true' : 'false') + '">' + LZ.ic('heart') + ' 도움 됐어요 ' + t.likes + '</button>') + '</div></div>';
      }).join('') + '</div>' : '<div class="empty" style="padding:18px 0">아직 이 홀 팁이 없어요. 첫 팁을 남겨 주세요.</div>') +
      '<label class="lb" for="tpIn">이 홀 팁 남기기 <span class="muted">(<span id="tpN">0</span>/60자)</span></label>' +
      (many ? '<select id="tpC" class="in">' + d.clubs.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('') + '</select>' : '') +
      '<textarea id="tpIn" class="in" maxlength="60" rows="2" placeholder="예: 오르막이라 볼스피드 +2 세게, 오른쪽 OB 조심"></textarea>' +
      '<button type="button" class="btn" data-act="tipAdd">남기기</button><p class="hint">도움 됐다는 분이 생기면 쓴 분에게 포인트 +1(한 분당 한 번)</p>';
  }
  function tipPaint(d) {
    TP.d = d; var sh = $('.sheet .tipsh9'); if (sh) { sh.innerHTML = tipHtml(d); } else LZ.sheet('<div class="tipsh9">' + tipHtml(d) + '</div>');
    var t = $('#tpIn'); if (t) t.addEventListener('input', function () { var n = $('#tpN'); if (n) n.textContent = t.value.length; });
    if (LZ.tipCount) LZ.tipCount(TP.cid, TP.h, d.list.length);
  }
  LZ.tipSheet = async function (cid, h, name, par) {
    TP = { cid: cid, h: h, name: name, par: par };
    try { tipPaint(await LZ.api('tipList', { cid: cid, h: h })); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  LZ.act.tipAdd = async function () {
    var t = $('#tpIn'), c = $('#tpC'); if (!t || !t.value.trim()) { LZ.toast('팁을 적어 주세요'); return; }
    try { tipPaint(await LZ.api('tipAdd', { cid: TP.cid, h: TP.h, mid: c ? c.value : '', text: t.value })); LZ.toast('팁을 남겼어요'); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  LZ.act.tipLike = async function (el, id) { try { tipPaint(await LZ.api('tipLike', { id: id })); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.tipDel = async function (el, id) { if (!(await LZ.confirm('이 팁을 지울까요?', '', '지우기'))) return; try { tipPaint(await LZ.api('tipDel', { id: id })); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };

  /* ───────────── v9.3 출석 도장 · 배지 ───────────── */
  var SP = {};
  var BIC = { w3: '3', w8: '8', h18: '18', m3: '3', m10: '10', r10: '10', t5: '팁', s30: '30' };
  LZ.screens.stamps = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('출석 도장', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('stamps', { ym: SP.ym || '' }); if (!alive()) return; SP.d = d; SP.ym = d.ym;
      var y = +d.ym.slice(0, 4), m = +d.ym.slice(5), first = new Date(y, m - 1, 1).getDay(), last = new Date(y, m, 0).getDate(), cells = '';
      for (var i = 0; i < first; i++) cells += '<span></span>';
      for (var dd = 1; dd <= last; dd++) { var k = d.ym + '-' + ('0' + dd).slice(-2), v = d.month[k] || '', cls = v.indexOf('m') >= 0 ? 'm' : v ? 'r' : ''; cells += '<span class="' + cls + (k === d.today ? ' td' : '') + '">' + (cls ? '<i>' + (cls === 'm' ? LZ.ic('club') : LZ.ic(v.indexOf('f') >= 0 ? 'flag' : 'screen')) + '</i>' : '') + '<em>' + dd + '</em></span>'; }
      var got = d.badges.filter(function (b) { return b.on; }).length, now = new Date(), cur = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
      root.innerHTML = LZ.hdr('출석 도장', { back: true }) + '<div class="wrap stp9">' +
        '<div class="rkm9"><button type="button" data-act="spMonth" data-v="-1" aria-label="지난달">' + LZ.ic('back') + '</button><b>' + ymTxt(d.ym) + '</b><button type="button" data-act="spMonth" data-v="1" aria-label="다음 달"' + (d.ym >= cur ? ' disabled' : '') + '>' + LZ.ic('chev') + '</button></div>' +
        '<div class="sum9"><div><b>' + d.n + '</b><span>이달 도장</span></div><div><b>' + d.run + '주</b><span>이어서</span></div><div><b>' + d.total + '</b><span>모은 도장</span></div></div>' +
        '<div class="card cal9"><div class="wk">' + ['일', '월', '화', '수', '목', '금', '토'].map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div><div class="dd">' + cells + '</div>' +
          '<div class="lg"><span><i class="m"></i>클럽 모임</span><span><i class="r"></i>스크린 기록 · 필드 라운드</span></div></div>' +
        '<div class="hdr9">내 배지 ' + got + ' / ' + d.badges.length + '</div><div class="bdg9">' + d.badges.map(function (b) { return '<div class="' + (b.on ? 'on' : '') + '"><i>' + (b.on ? esc(BIC[b.k] || '★') : '?') + '</i><b>' + esc(b.n) + '</b><small>' + esc(b.d) + '</small></div>'; }).join('') + '</div>' +
        '<p class="hint">모임에 참석하거나 스크린 기록 · 필드 라운드를 한 날에 도장이 찍혀요. 새 배지를 받으면 클럽 채팅에 자동으로 알려요.</p></div>';
    }
  };
  LZ.act.spMonth = function (el, v) { SP.ym = ymAdd(SP.ym, +v); LZ.redraw(); };

  /* ───────────── v9.3 클럽 사진첩 ───────────── */
  var AL = {};
  LZ.shrink = function (file, max, q) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h)), cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var cx = cv.getContext('2d'), png = /png/.test(file.type) && q >= 0.9; if (!png) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); } cx.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        resolve(cv.toDataURL(png ? 'image/png' : 'image/jpeg', q));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했어요')); }; img.src = url;
    });
  };
  async function shrinkFit(file) { var sz = [1280, 1080, 900, 720], qs = [0.72, 0.66, 0.6, 0.55]; for (var i = 0; i < sz.length; i++) { var d = await LZ.shrink(file, sz[i], qs[i]); if (d.length < 135000) return d; } return LZ.shrink(file, 600, 0.5); }
  LZ.screens.album = {
    tab: 'home',
    show: async function (p, root, alive) {
      AL.mid = p.mid; root.innerHTML = LZ.hdr('사진첩', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('albumList', { mid: p.mid }); if (!alive()) return; AL.d = d;
      root.innerHTML = LZ.hdr('사진첩', { back: true, btns: '<button type="button" class="tb" data-act="alAdd" aria-label="사진 올리기">' + LZ.ic('plus') + '</button>' }) + '<div class="wrap alb9"><p class="muted" style="margin:2px 2px 10px">' + esc(d.name) + ' · 우리 클럽 회원만 봐요</p>' +
        '<button type="button" class="btn" data-act="alAdd">' + LZ.ic('plus') + '사진 올리기</button>' +
        (d.list.length ? d.list.map(function (a) {
          var im = a.imgs, n = im.length;
          return '<div class="card alg9"><div class="h"><b>' + esc(a.title) + '</b><span class="muted">사진 ' + n + ' · ' + esc(a.nick) + ' · ' + esc(LZ.fmtDate(a.at)) + '</span>' + (a.mine || d.staff ? '<button type="button" class="sm2 g" data-act="alMore" data-v="' + esc(a.id) + '">' + LZ.ic('more') + '</button>' : '') + '</div>' +
            '<div class="gr n' + Math.min(n, 4) + '">' + im.slice(0, 4).map(function (id, i) { return '<button type="button" data-act="alView" data-v=\'' + esc(JSON.stringify({ a: a.id, i: i })) + '\'><img data-img="' + esc(id) + '" alt="">' + (i === 3 && n > 4 ? '<span>+' + (n - 4) + '</span>' : '') + '</button>'; }).join('') + '</div></div>';
        }).join('') : '<div class="empty">아직 사진이 없어요.<br><span class="muted">모임 · 라운드 사진을 올려 함께 봐요.</span></div>') +
        '<p class="hint">클럽 회원만 봐요 · 한 번에 10장 · 휴대폰에서 줄여서 올라가요 · 올린 분과 캡틴 · 매니저가 지울 수 있어요</p></div>';
      if (LZ.fillImgs) LZ.fillImgs(root);
    }
  };
  function alFind(id) { return ((AL.d && AL.d.list) || []).filter(function (a) { return a.id === id; })[0]; }
  LZ.act.alAdd = function (el, aid) {
    var a = aid ? alFind(aid) : null, ym = new Date(), dflt = (ym.getMonth() + 1) + '월 ' + ym.getDate() + '일 모임';
    var sh = LZ.sheet('<h2>' + (a ? esc(a.title) + '에 더하기' : '사진 올리기') + '</h2>' + (a ? '' : '<label class="lb" for="alT">묶음 이름</label><input type="text" id="alT" class="in" maxlength="30" value="' + esc(dflt) + '">') +
      '<label class="btn o alpick9" for="alF">' + LZ.ic('plus') + '사진 고르기(최대 10장)</label><input type="file" id="alF" accept="image/*" multiple hidden>' +
      '<div id="alP" class="alprev9"></div><button type="button" class="btn" data-act="alGo" data-v="' + esc(aid || '') + '" disabled id="alGoB">올리기</button>');
    AL.files = [];
    var f = $('#alF', sh); f.addEventListener('change', function () { AL.files = Array.prototype.slice.call(f.files || [], 0, 10); var pv = $('#alP'); pv.innerHTML = AL.files.map(function (x) { return '<img src="' + URL.createObjectURL(x) + '" alt="">'; }).join(''); $('#alGoB').disabled = !AL.files.length; if ((f.files || []).length > 10) LZ.toast('10장까지만 올려요'); });
  };
  LZ.act.alGo = async function (el, aid) {
    var t = $('#alT'), ids = [], fs = AL.files || []; if (!fs.length) return;
    try {
      for (var i = 0; i < fs.length; i++) { LZ.busy(true, '사진 올리는 중 ' + (i + 1) + ' / ' + fs.length); var data = await shrinkFit(fs[i]); var r = await LZ.api('photoPut', { data: data }); ids.push(r.id); }
      LZ.busy(true, '사진첩에 넣는 중…'); await LZ.api('albumAdd', { mid: AL.mid, id: aid || '', title: t ? t.value : '', imgs: ids }); LZ.busy(false); LZ.closeSheet(); LZ.toast('사진 ' + ids.length + '장을 올렸어요'); LZ.redraw();
    } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e) || '사진을 올리지 못했어요', 5000); if (ids.length && !aid) { try { await LZ.api('albumAdd', { mid: AL.mid, title: t ? t.value : '', imgs: ids }); LZ.redraw(); } catch (e2) { /* 그대로 */ } } }
  };
  LZ.act.alView = function (el, v) {
    var o = typeof v === 'string' ? JSON.parse(v) : v, a = alFind(o.a); if (!a) return; AL.view = { a: a.id, i: o.i };
    var id = a.imgs[o.i], can = a.mine || (AL.d && AL.d.staff);
    var sh = LZ.sheet('<div class="alv9"><img data-img="' + esc(id) + '" alt=""><div class="r"><button type="button" class="sm2 g" data-act="alStep" data-v="-1"' + (o.i ? '' : ' disabled') + '>‹ 앞</button><span>' + (o.i + 1) + ' / ' + a.imgs.length + '</span><button type="button" class="sm2 g" data-act="alStep" data-v="1"' + (o.i < a.imgs.length - 1 ? '' : ' disabled') + '>뒤 ›</button></div>' +
      (can ? '<button type="button" class="btn g" data-act="alDelOne">이 사진 지우기</button>' : '') + '</div>');
    if (LZ.fillImgs) LZ.fillImgs(sh);
  };
  LZ.act.alStep = function (el, v) { var w = AL.view; if (!w) return; LZ.closeSheet(); LZ.act.alView(null, { a: w.a, i: w.i + (+v) }); };
  LZ.act.alDelOne = async function () { var w = AL.view, a = w && alFind(w.a); if (!a || !(await LZ.confirm('이 사진을 지울까요?', '', '지우기'))) return; try { await LZ.api('albumDel', { id: a.id, img: a.imgs[w.i] }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.alMore = function (el, id) { LZ.sheet('<h2>사진 묶음</h2><button type="button" class="opt" data-act="alAdd" data-v="' + esc(id) + '"><b>사진 더하기</b></button><button type="button" class="opt" data-act="alDelAll" data-v="' + esc(id) + '"><b>묶음 통째로 지우기</b></button>'); };
  LZ.act.alDelAll = async function (el, id) { if (!(await LZ.confirm('이 묶음의 사진을 모두 지울까요?', '되돌릴 수 없어요', '모두 지우기'))) return; try { await LZ.api('albumDel', { id: id }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };

  /* ───────────── v9.3 클럽 대항전 ───────────── */
  var VS = {};
  LZ.screens.versus = {
    tab: 'field', rt: true,
    show: async function (p, root, alive) {
      VS.code = p.code; root.innerHTML = LZ.hdr('클럽 대항전', { back: true }) + LZ.skeleton(5);
      var d = await LZ.api('vsGet', { code: p.code }); if (!alive()) return; VS.d = d;
      var v = d.vs, e = d.event, body = '';
      if (!v || v.st === 'no') {
        body = (v && v.st === 'no' ? '<div class="box warn">' + esc(v.b.name) + '이 지난 도전을 사양했어요. 다른 클럽에 도전해 보세요.</div>' : '') +
          (e.owner && d.mine.length ? '<div class="card"><h3>다른 클럽에 도전장</h3><p class="muted">지금 단체 라운드에 “클럽 대 클럽” 합계만 더해요. 상대 캡틴이 수락하면 열려요.</p>' +
            '<label class="lb" for="vsA">우리 클럽</label><select id="vsA" class="in">' + d.mine.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('') + '</select>' +
            '<label class="lb" for="vsQ">상대 클럽 찾기</label><input type="search" id="vsQ" class="in" placeholder="클럽 이름 · 지역"><select id="vsB" class="in" size="5">' + vsOpts(d.clubs, '', d.mine) + '</select>' +
            '<label class="lb" for="vsN">클럽마다 잘 친 몇 명 합계</label><select id="vsN" class="in">' + [3, 4, 5, 6, 8, 10].map(function (n) { return '<option' + (n === 6 ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>' +
            '<button type="button" class="btn" data-act="vsAsk">도전장 보내기</button></div>'
          : '<div class="empty">' + (e.owner ? '캡틴 · 매니저인 클럽이 있어야 도전할 수 있어요.' : '단체 라운드를 만든 분이 대항전으로 바꿀 수 있어요.') + '</div>');
      } else {
        var a = v.a, b = v.b, cmp = a.n && b.n ? (a.n === b.n ? a.tot - b.tot : a.d / a.n - b.d / b.n) : 0, lead = cmp < 0 ? 'a' : cmp > 0 ? 'b' : '';
        body = '<p class="vsd9">' + esc([v.date, v.fname, v.holes ? v.holes + '홀' : ''].filter(Boolean).join(' · ')) + '</p>' +
          '<div class="vs9"><div class="sd' + (lead === 'a' ? ' win' : '') + '"><b>' + esc(a.name) + '</b><em>' + (a.n ? a.tot : '−') + '</em><small>' + a.n + '명 · ' + LZ.pp(a.d || 0) + '</small></div><i>VS</i><div class="sd' + (lead === 'b' ? ' win' : '') + '"><b>' + esc(b.name) + '</b><em>' + (b.n ? b.tot : '−') + '</em><small>' + b.n + '명 · ' + LZ.pp(b.d || 0) + '</small></div></div>' +
          '<p class="hint" style="text-align:center">클럽마다 잘 친 ' + v.n + '명 합계 · 적을수록 이겨요' + (a.n && b.n && a.n !== b.n ? ' · 지금은 인원이 달라 한 사람 평균(파 대비)으로 견줘요' : '') + (v.status === 'open' ? ' · 진행 중' : ' · 끝났어요') + '</p>' +
          (v.st === 'ask' ? '<div class="box warn">' + esc(b.name) + '의 수락을 기다려요.</div>' + (v.canOk ? '<div class="row2"><button type="button" class="btn" data-act="vsOk">도전 받기</button><button type="button" class="btn g" data-act="vsNo">사양하기</button></div>' : '') : '') +
          '<div class="vsl9">' + [a, b].map(function (s) { return '<div class="card tight"><h3>' + esc(s.name) + '</h3>' + (s.list.length ? s.list.map(function (x, i) { return '<div class="it"><em>' + (i + 1) + '</em><b>' + esc(x.nick) + '</b><span>' + x.t + '타 <small>' + x.n + '홀 · ' + LZ.pp(x.d) + '</small></span></div>'; }).join('') : '<p class="muted">아직 점수가 없어요</p>') + '</div>'; }).join('') + '</div>' +
          '<button type="button" class="btn o" data-go="event" data-p=\'' + esc(JSON.stringify({ code: v.code })) + '\'>상황판 보기</button>' +
          (d.year.w + d.year.l ? '<p class="hint" style="text-align:center">올해 전적 · ' + esc(a.name) + ' ' + d.year.w + '승 ' + d.year.l + '패</p>' : '');
      }
      root.innerHTML = LZ.hdr('클럽 대항전', { back: true }) + '<div class="wrap vsw9"><p class="muted" style="margin:4px 2px 10px">' + esc(e.name) + ' · 번호 ' + esc(e.code) + '</p>' + body + '</div>';
      var q = $('#vsQ'); if (q) q.addEventListener('input', function () { $('#vsB').innerHTML = vsOpts(d.clubs, q.value, d.mine); });
      clearInterval(VS.t); if (v && v.st === 'ok' && v.status === 'open') VS.t = setInterval(function () { if (LZ.cur().name !== 'versus') { clearInterval(VS.t); return; } LZ.reload({ soft: true }); }, 30000);
    }
  };
  function vsOpts(list, q, mine) { var my = {}; mine.forEach(function (c) { my[c.id] = 1; }); q = String(q || '').trim(); return list.filter(function (c) { return !my[c.id] && (!q || (c.name + ' ' + c.area).indexOf(q) >= 0); }).slice(0, 80).map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + (c.area ? ' · ' + esc(c.area) : '') + '</option>'; }).join(''); }
  LZ.act.vsAsk = async function () {
    var b = $('#vsB'); if (!b || !b.value) { LZ.toast('상대 클럽을 골라 주세요'); return; }
    try { await LZ.api('vsAsk', { code: VS.code, mid: $('#vsA').value, vs: b.value, n: +$('#vsN').value }); LZ.toast('도전장을 보냈어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  LZ.act.vsOk = async function () { try { await LZ.api('vsOk', { code: VS.code }); LZ.toast('대항전이 열렸어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.vsNo = async function () { if (!(await LZ.confirm('이번 도전을 사양할까요?', '', '사양하기'))) return; try { await LZ.api('vsOk', { code: VS.code, no: 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };

})();
