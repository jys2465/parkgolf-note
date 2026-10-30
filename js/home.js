/* 홈 · 클럽(가입 신청·캡틴 관리·챌린지·QR) · 클럽 찾기/만들기 · 알림함 · 사용 안내 · 공지 · 문의 · 의견 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  /* 날 수: 2026-10-27 → 오늘까지 함께한 날(첫날 = 1일) */
  LZ.daysSince = function (ts) { if (!ts) return 0; var a = new Date(Number(ts) || ts), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.max(1, Math.round((b - a) / 86400000) + 1); };
  /* 등급·기간 두 줄(#19·#20): "블루 · 가입 2026-10-26" / 레드·골드는 "2026-10-27 ~ 2027-10-26 (남은 362일)" */
  var TCOL = { blue: '#1D4ED8', red: '#B23A1E', gold: '#9A7420', black: '#111827', admin: '#0F4F3E' };
  LZ.tierLines = function (u) {
    var t = u.tier || 'blue', name = t === 'admin' ? '관리자' : (u.tierName || { blue: '블루', red: '레드', gold: '골드', black: '블랙' }[t] || t);
    var l1 = '<div class="su"><b style="color:' + (TCOL[t] || 'inherit') + '">' + esc(name) + '</b>' + (u.created ? ' · 가입 ' + LZ.fmtDate(u.created) : '') + '</div>', l2 = '';
    if ((t === 'red' || t === 'gold') && u.end) l2 = '<div class="su"><span class="nw">' + LZ.fmtYmd(u.start || LZ.fmtDate(u.created)) + ' ~</span> <span class="nw">' + LZ.fmtYmd(u.end) + '</span>' + (u.left !== null && u.left !== undefined ? ' <span class="nw">(남은 ' + u.left + '일)</span>' : '') + '</div>';
    return l1 + l2;
  };
  function clubRow(m) {
    var sub = [], extra = '';
    sub.push(LZ.seatTxt(m)); if (m.created) sub.push('함께한 지 ' + LZ.daysSince(m.created) + '일');
    if (m.reqs) sub.push('가입 신청 ' + m.reqs + '건');
    if (m.live) extra = '지금 기록 중 ' + m.live + '명'; else if (m.meet) extra = '모임 ' + m.meet; else if (m.news) extra = '소식 · ' + m.news; else if (m.chal) extra = '챌린지 ' + m.chal.name + ' ' + m.chal.mine + '/' + m.chal.goal;
    return '<button type="button" class="li" data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.role === 'cap' ? ' <span class="chip cap">캡틴</span>' : m.role === 'mgr' ? ' <span class="chip mgr">매니저</span>' : '') + (m.locked ? ' <span class="chip gray">' + LZ.ic('lock') + ' 잠김</span>' : m.meLock ? ' <span class="chip gray">' + LZ.ic('lock') + ' 보기만</span>' : '') + '</b><span class="su">' + esc(sub.join(' · ')) + '</span>' + (extra ? '<span class="su">' + esc(extra) + '</span>' : '') + '</div>' + LZ.ic('chev') + '</button>';
  }
  LZ.screens.home = {
    tab: 'home',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('파크골프 공략수첩', { logout: 1 }) + LZ.skeleton(5); await LZ.refreshMe(); if (!alive()) return; }
      var me = S.user, m = S.me, moims = m.moims || [], left = me.left;
      var lockedClubs = moims.filter(function (x) { return x.locked && (x.role === 'cap' || x.role === 'mgr'); }), graceClubs = moims.filter(function (x) { return x.grace && (x.role === 'cap' || x.role === 'mgr'); });
      var cont = function (icon, b, sub, attrs, cls) { return '<button type="button" class="cont' + (cls ? ' ' + cls : '') + '" ' + attrs + '>' + LZ.ic(icon, 'ci') + '<div style="flex:1;min-width:0"><b>' + b + '</b><span class="muted">' + sub + '</span></div>' + LZ.ic('chev') + '</button>'; };
      var exp = me.tier === 'black' ? '<div class="cont red">' + LZ.ic('lock', 'ci') + '<div style="flex:1"><b>이용 정지 상태예요</b><span class="muted">관리자에게 문의해 주세요</span></div></div>'
        : (me.tier === 'red' && left !== null && left <= 30 ? cont('bell', (left === 0 ? '오늘' : left + '일 뒤에') + ' 유료 자리가 끝나요', '연장하면 끝나는 날부터 이어져요', 'data-go="meTier"')
        : me.tier === 'gold' && left !== null && left <= 30 ? cont('bell', '골드 기간이 ' + (left === 0 ? '오늘' : left + '일 뒤') + ' 끝나요', '이어서 쓰려면 관리자에게 말씀해 주세요', 'data-go="meTier"')
        : me.wasRed && me.tier === 'blue' ? cont('bell', '유료 자리 기간이 끝났어요', '무료 블루로 쓰고 있어요 · 자리를 다시 사면 레드', 'data-go="meTier"') : '') +
        (lockedClubs.length ? cont('lock', '잠긴 클럽 ' + lockedClubs.length + '개', esc(lockedClubs[0].lockWhy || ''), 'data-go="club" data-p=\'' + esc(JSON.stringify({ id: lockedClubs[0].id })) + '\'') : '') +
        (graceClubs.length ? cont('seat', esc(graceClubs[0].name) + ' 자리 기간이 끝났어요', '유예 중이라 새 가입만 막혀요 · 연장해 주세요', 'data-go="club" data-p=\'' + esc(JSON.stringify({ id: graceClubs[0].id })) + '\'') : '');
      var ck = LZ.cacheGet('courses:' + S.br), book = '내 기록만 모아 보기';
      if (ck && ck.courses) { var mine = ck.courses.filter(function (c) { return c.mine > 0; }), done = mine.filter(function (c) { return c.mine >= (c.stage === 'done' ? 18 : 9); }); book = '코스 ' + mine.length + '개 · 기록 완료 ' + done.length + '개'; }
      var capN = moims.filter(function (x) { return x.role === 'cap'; }).length;
      root.innerHTML = LZ.hdr('파크골프 공략수첩', { logout: 1 }) + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap">' +
        '<div class="hello">' + LZ.avatar(me) + '<div style="flex:1;min-width:0"><div class="hname"><b>' + esc(me.nick) + '</b> <span>회원님</span></div>' + LZ.tierLines(me) + '</div></div>' + exp +
        (m.last ? cont('play', '이어서 기록하기', esc(m.last.name) + ' · ' + (m.last.hole + 1) + '홀부터 · ' + esc(m.last.store), 'data-act="resume"') : '') +
        (m.round ? cont('flag', '진행 중인 라운드 ' + esc(m.round.code), esc(m.round.fname), 'data-go="round" data-p=\'' + esc(JSON.stringify({ id: m.round.id })) + '\'') : '') +
        (m.reqs ? cont('user', '가입 신청 ' + m.reqs + '건이 기다려요', '클럽 관리에서 승인 / 보류', 'data-act="homeReqs"') : '') +
        '<button type="button" class="bookcard" data-act="openMyBook">' + LZ.ic('book', 'bk-ic') + '<div style="flex:1;min-width:0"><b>내 수첩</b><span>' + esc(book) + '</span></div>' + LZ.ic('chev') + '</button>' +
        '<div class="row mkrow"><button type="button" class="btn o" data-go="find">' + LZ.ic('search') + '클럽 찾기</button><button type="button" class="btn o" data-go="make">' + LZ.ic('plus') + '클럽 만들기</button></div>' +
        '<p class="hint" style="margin:6px 2px 12px">함께하는 클럽 ' + moims.length + '개 · 운영 ' + capN + (me.kind === 'admin' ? '개' : '/' + (me.makeMax || 2) + '개' + (me.canMake ? '' : ' · 더 열려면 클럽 추가')) + '</p>' +
        '<div class="card tight clubs"><h3 class="ih">' + LZ.ic('club') + '내 클럽</h3>' + (moims.length ? moims.map(clubRow).join('') : '<p class="muted" style="margin:6px 0 2px">아직 함께하는 클럽이 없어요. 위에서 클럽을 찾거나 만들어 보세요.</p>') + '</div>' +
        (LZ.inviteCard ? LZ.inviteCard(false) : '') + '</div>';
      LZ.paintSync();
      setTimeout(function () { if (!LZ.cacheGet('courses:' + S.br)) LZ.api('courses', {}).then(function (r) { LZ.cacheSet('courses:' + S.br, r); }).catch(function () {}); }, 600);   // 코스 목록 미리 받아 두기
      if (LZ.firstGuide) { LZ.firstGuide = false; LZ.coach('home', [{ sel: '.bookcard', text: '<b>내 수첩</b> — 내 기록만 모아 봐요. 어느 클럽에서 적어도 기록은 하나예요.' }, { sel: moims.length ? '.clubs .li' : '[data-go="find"]', text: moims.length ? '<b>클럽</b> — 회원님들의 기록 평균과 모임·소식을 봐요.' : '<b>클럽 찾기</b> — 공개 클럽에 가입 신청하거나, 캡틴이 준 코드 6자리로 들어가요.' }, { sel: '[data-tab="courses"]', text: '<b>스크린 공략</b> — 코스를 열고 홀마다 좌우·볼스피드를 적어요.', pos: 'above' }, { sel: '[data-tab="field"]', text: '<b>필드 라운드</b> — 점수판과 시상식. 2~5명이 쳐도 시상식이 열려요.', pos: 'above' }]); }
    }
  };
  LZ.act.openMyBook = function () { LZ.go('courses', {}, { reset: true }); };
  LZ.act.openClubCourses = async function (el, id) { if (id && id !== '_me') store.set('lz.cmpBr', id); if (id !== S.br) { try { await LZ.api('useBranch', { br: id }); } catch (e) { LZ.toast(LZ.errText(e)); return; } } LZ.go('courses', {}, { reset: true }); };
  LZ.act.resume = async function () { var l = S.me.last; if (l.br !== S.br) { try { await LZ.api('useBranch', { br: l.br }); } catch (e) { /* 무시 */ } } LZ.go('holes', { id: l.cid, half: l.hole < 9 ? 0 : 1 }); };
  LZ.act.homeReqs = function () { var m = (S.me.moims || []).filter(function (x) { return (x.role === 'cap' || x.role === 'mgr') && x.reqs; })[0] || (S.me.moims || []).filter(function (x) { return x.role === 'cap' || x.role === 'mgr'; })[0]; if (m) LZ.go('club', { id: m.id, reqs: 1 }); else LZ.go('home'); };

  /* ───── 클럽 ───── */
  var CL = { d: null };
  LZ.screens.club = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('moimGet', { id: p.id }); if (!alive()) return; CL.d = d;
      var m = d.moim, cap = d.cap, staff = d.staff || cap, isMgr = d.me === 'mgr', me = S.user, st = d.stats || {};
      var mgrN = (d.members || []).filter(function (x) { return x.mgr; }).length;
      var capPanel = staff ? '<div class="card" id="capPanel" ' + (p.manage ? '' : 'hidden') + '><h3>' + LZ.ic('star') + ' ' + (cap ? '캡틴 관리' : '클럽 관리') + '</h3>' + (isMgr ? '<p class="muted" style="margin:0 0 8px">매니저로 캡틴 일을 함께 해요 · 내보내기·캡틴 바꾸기·클럽 닫기는 캡틴만</p>' : '') +
          '<button type="button" class="opt" data-act="clubReqs"><b>가입 신청 ' + (d.reqs || []).length + '건</b><span>' + (m.staffClub ? '승인 / 보류' : m.members >= m.seats ? (m.grace ? '자리 기간이 끝나 유예 중 · 새 가입이 막혀요' : '자리가 다 찼어요 · ' + ((d.seat || {}).size || 10) + '자리를 더해 주세요') : '승인 / 보류 · 빈자리 ' + (m.seats - m.members) + '자리') + '</span></button>' +
          '<button type="button" class="opt" data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><b>' + LZ.ic('book') + ' 캡틴 대시보드</b><span>이달 활동 · 안 오신 분 · 이달의 시상식</span></button>' +
          (m.staffClub ? '' : '<button type="button" class="opt" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'seat', mid: m.id })) + '\'><b>' + LZ.ic('seat') + ' ' + ((d.seat || {}).size || 10) + '자리 추가</b><span>' + LZ.seatTxt(m) + (m.nextEnd ? ' · 다음 끝 ' + LZ.dd(m.nextEnd) : '') + '</span></button>') +
          (cap && d.seat && (d.seat.need || d.seat.grace) ? '<button type="button" class="opt" data-go="clubKeep" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><b>' + LZ.ic('user') + ' 남길 회원 고르기</b><span>자리가 모자라면 고른 분이 먼저 남아요(캡틴·매니저는 늘 남음)</span></button>' : '') +
          '<button type="button" class="opt" data-act="clubMeet"><b>이번 주 모임</b><span>' + (m.meet ? esc(m.meet) : '아직 안 정했어요') + '</span></button>' +
          '<button type="button" class="opt" data-act="clubChal"><b>이달의 챌린지</b><span>' + (m.chal ? esc(m.chal.name) + ' ' + m.chal.goal + '홀' : '예: 양주1구장CD 18홀 채우기') + '</span></button>' +
          '<button type="button" class="opt" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ br: m.id })) + '\'><b>소식 쓰기</b><span>클럽 회원님께 알림</span></button>' +
          '<button type="button" class="opt" data-act="clubSet"><b>이름·지역·색</b><span>클럽 정보 바꾸기</span></button>' +
          '<button type="button" class="opt" data-act="clubQrPoster"><b>매장 QR 포스터</b><span>코스별 QR</span></button>' +
          '<button type="button" class="opt" data-go="notiCfg"><b>가입 신청 알림</b><span>앱 푸시 · 카카오톡</span></button>' +
          '<div class="tgl"><span>클럽 찾기에 보이기<span class="muted">끄면 비공개 · 클럽 코드·초대 링크로만 가입</span></span>' + LZ.sw(m.pub, 'clubPub') + '</div><div class="tgl"><span>초대 링크로는 바로 가입<span class="muted">캡틴 승인 없이 들어와요</span></span>' + LZ.sw(m.auto, 'clubAuto') + '</div>' +
          (cap ? '<button type="button" class="opt" data-act="clubMgr"><b>매니저 정하기</b><span>캡틴을 돕는 분 · 가입 승인·소식 쓰기 등' + (mgrN ? ' · 지금 ' + mgrN + '명' : '') + '</span></button>' +
          '<button type="button" class="opt" data-act="clubHand"><b>캡틴 바꾸기</b><span>자리는 클럽에 남아요 · 전 캡틴은 매니저로</span></button>' +
          '<button type="button" class="opt" data-act="clubClose"><b>클럽 닫기</b><span>혼자일 때만 · 내 기록은 내 수첩으로</span></button>' : '') +
          (isMgr ? '<button type="button" class="opt" data-act="mgrQuit"><b>매니저 그만두기</b><span>회원으로 남아요</span></button>' : '') + '</div>' : '';
      var info = [];
      if (m.meet) info.push(LZ.ic('pin') + ' ' + esc(m.meet)); if (m.chal) info.push(LZ.ic('star') + ' ' + esc(m.chal.name) + ' ' + m.chal.goal + '홀 · ' + m.chal.done + '/' + m.chal.members + '명 달성 · 나 ' + m.chal.mine); if ((d.news || []).length) info.push(LZ.ic('note') + ' ' + esc(d.news[0].title));
      root.innerHTML = LZ.hdr(m.name, { back: true, right: staff ? '<button type="button" class="ib' + (p.manage ? ' on' : '') + '" data-act="capToggle">' + LZ.ic('gear') + ' 관리</button>' : '' }) + '<div class="wrap">' +
        '<div class="card tight"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + (m.area ? '<span class="chip">' + esc(m.area) + '</span>' : '') + (m.live ? '<span class="chip cap">지금 기록 중 ' + m.live + '명</span>' : '') + (m.locked ? '<span class="chip gray">' + LZ.ic('lock') + ' 잠김</span>' : '') + '<span class="muted" style="margin-left:auto">캡틴 ' + LZ.nimE(m.captainNick) + '</span></div>' +
        (m.created ? '<div class="su cday">개설 ' + LZ.fmtDate(m.created) + ' · 함께한 지 <b>' + LZ.daysSince(m.created) + '일</b></div>' + LZ.celebrate(m) : '') +
        (m.locked ? '<div class="box err" style="margin-top:8px">' + LZ.ic('lock') + ' ' + esc(m.lockWhy || '이 클럽은 잠겨 있어요') + (cap && m.over ? '<div class="row" style="margin-top:8px"><button type="button" class="sm2" data-go="make">클럽 추가</button><button type="button" class="sm2 g" data-act="clubClose">클럽 닫기</button></div>' : '') + '</div>' : '') +
        (m.meLock ? '<div class="box warn" style="margin-top:8px">' + LZ.ic('lock') + ' 자리가 모자라 지금은 <b>보기만</b> 할 수 있어요. 캡틴이 자리를 늘리면 바로 풀려요. 내 수첩에는 그대로 적을 수 있어요.</div>' : '') +
        (d.me && info.length ? '<div style="margin-top:8px">' + info.map(function (t) { return '<div class="news2">' + t + '</div>'; }).join('') + '</div>' : '') +
        (d.me ? '<div class="row" style="margin-top:10px"><button type="button" class="btn o sm" data-act="openClubCourses" data-v="' + esc(m.id) + '" style="margin:0">스크린 공략 열기</button><button type="button" class="btn g sm" data-go="notices" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\' style="margin:0">소식 ' + ((d.news || []).length || '') + '</button></div>' : '') + '</div>' +
        (!d.me ? '<div class="card"><p style="margin:0 0 6px">이 클럽의 회원님이 아니에요.</p><button type="button" class="btn" data-act="applyClub" data-v="' + esc(m.id) + '">가입 신청</button></div>' : '') +
        (d.me && d.seat ? LZ.seatCard(m, d, staff) : '') +
        capPanel +
        (d.me ? '<div class="card"><h3>회원님 ' + (d.members || []).length + '명</h3><div class="list">' + (d.members || []).map(function (x) {
          return '<div class="it">' + LZ.avatar(x) + '<div class="t"><b>' + LZ.nimE(x.nick) + ' ' + (x.cap ? '<span class="chip cap">캡틴</span>' : x.mgr ? '<span class="chip mgr">매니저</span>' : '') + (x.live ? '<span class="chip">기록 중</span>' : '') + (x.lock ? '<span class="chip gray">보기만</span>' : x.keep && staff ? '<span class="chip">남길 회원</span>' : '') + (x.test && S.user.kind === 'admin' ? '<span class="chip gray">' + LZ.ic('flask') + '테스트</span>' : '') + '</b><span class="muted">' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span></div>' +
            (cap && p.manage && x.uid !== me.uid && !x.cap ? '<button type="button" class="sm2 r" data-act="clubKick" data-v="' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '">내보내기</button>' : '') + '</div>';
        }).join('') + '</div></div>' : '') +
        (d.me ? '<div class="card"><h3>회원님 초대</h3><div class="center"><div class="muted">클럽 코드</div><div style="font-size:var(--t6);font-weight:700;letter-spacing:4px;color:var(--gt)">' + esc(m.code.slice(0, 3) + ' ' + m.code.slice(3)) + '</div></div><button type="button" class="btn kakao" data-act="clubInvite">클럽 가입 초대하기</button><p class="hint">카카오톡·문자·QR 중 골라 보내요. 앱이 없는 분도 링크로 가입하면서 바로 가입 신청이 돼요.</p></div>' : '') +
        (d.me && d.me !== 'cap' ? '<button type="button" class="btn g" data-act="clubLeave">클럽 나가기</button>' : '') + '</div>';
      if (p.reqs && staff) LZ.act.clubReqs();
    }
  };
  /* 클럽 자리 카드(v7.2 #20): "24명 / 30자리" 막대 · 10자리 묶음마다 기간·산 사람 · 캡틴·매니저는 추가·옮기기 */
  LZ.seatCard = function (m, d, staff) {
    var s = d.seat, mineMv = (s.packs || []).filter(function (p) { return p.owner === S.user.uid && p.kind !== 'free' && p.kind !== 'admin'; });
    if (s.staffClub) return '<div class="card seatc"><div class="seath"><h3>' + LZ.ic('seat') + ' 자리</h3><span><b>' + m.members + '</b>명 · 자리 제한 없음</span></div><p class="muted" style="margin:4px 0 0">관리자가 운영하는 클럽이에요.</p></div>';
    var pct = Math.min(100, Math.round(s.n / Math.max(1, s.live) * 100));
    return '<div class="card seatc"><div class="seath"><h3>' + LZ.ic('seat') + ' 자리</h3><span><b>' + s.n + '</b>명 / ' + s.live + '자리</span></div><div class="bar sbar' + (s.n > s.live ? ' over' : '') + '"><i style="width:' + pct + '%"></i></div>' +
      (s.grace ? '<p class="box warn" style="margin:8px 0 0">' + s.grace + '자리 기간이 끝나 유예 중이에요. 새 가입만 막히고, 유예가 지나면 자리가 모자란 만큼 늦게 들어온 분부터 보기만 하게 돼요.</p>' : '') +
      (s.locked ? '<p class="box err" style="margin:8px 0 0">' + LZ.ic('lock') + ' 자리가 모자라 ' + s.locked + '명이 보기만 하고 있어요.</p>' : '') +
      (s.packs || []).map(function (p) { return LZ.packLine(p, { who: staff }); }).join('') +
      (staff ? '<div class="row" style="margin-top:10px"><button type="button" class="btn sm" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'seat', mid: m.id })) + '\' style="margin:0">' + LZ.ic('plus') + s.size + '자리 추가</button>' + (mineMv.length ? '<button type="button" class="btn o sm" data-act="clubPackMove" style="margin:0">자리 옮기기</button>' : '') + '</div>' : '') + '</div>';
  };
  LZ.act.clubPackMove = function () {
    var d = CL.d, mine = (d.seat.packs || []).filter(function (p) { return p.owner === S.user.uid && p.kind !== 'free' && p.kind !== 'admin'; });
    if (mine.length === 1) { LZ.act.packMove(null, JSON.stringify({ id: mine[0].id, from: d.moim.id })); return; }
    LZ.sheet('<h2>어느 자리를 옮길까요?</h2>' + mine.map(function (p) { return '<button type="button" class="opt" data-act="packMove" data-v=\'' + esc(JSON.stringify({ id: p.id, from: d.moim.id })) + '\'><b>' + p.seats + '자리</b><span>' + LZ.fmtYmd(p.start) + ' ~ ' + LZ.fmtYmd(p.end) + '</span></button>'; }).join(''));
  };
  /* 함께한 날 축하(100·200·365·1000일, 그날부터 7일 동안) */
  var CELEB = [100, 200, 365, 1000];
  LZ.celebrate = function (m) {
    var n = LZ.daysSince(m.created), hit = CELEB.filter(function (x) { return n >= x && n < x + 7; })[0];
    return hit ? '<div class="celeb">' + LZ.ic('trophy') + '<div><b>함께한 지 ' + (hit === 365 ? '1년' : hit + '일') + '</b><span>그동안 함께해 주셔서 고마워요. 회원님들께 축하 소식을 남겨 보세요.</span></div></div>' : '';
  };
  /* 남길 회원 고르기(캡틴): 자리가 모자라면 고른 분 → 먼저 들어온 분 순서로 남아요 */
  LZ.screens.clubKeep = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('남길 회원', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('moimGet', { id: p.id }); if (!alive()) return; CL.d = d;
      var s = d.seat, list = (d.members || []).filter(function (x) { return !x.cap && !x.mgr; }).sort(function (a, b) { return (b.keep - a.keep) || (a.joined - b.joined); }), any = list.some(function (x) { return x.keep; });
      var on = {}; list.forEach(function (x, i) { if (any ? x.keep : i < s.room) on[x.uid] = 1; });
      root.innerHTML = LZ.hdr('남길 회원', { back: true }) + '<div class="wrap"><div class="card"><p style="margin:0 0 6px">자리 <b>' + s.live + '자리</b> · 회원 <b>' + s.n + '명</b>' + (s.grace ? ' (유예 중 ' + s.grace + '자리)' : '') + '</p><p class="muted" style="margin:0">캡틴·매니저는 늘 남아요. 그 밖에 <b>' + s.room + '명</b>까지 고를 수 있고, 고르지 않은 분은 먼저 들어온 순서로 남아요. 남지 못한 분은 이 클럽을 <b>보기만</b> 해요.</p></div>' +
        '<div class="card tight"><div class="seath"><h3>' + LZ.ic('user') + ' 회원님</h3><span id="keepN">' + Object.keys(on).length + ' / ' + s.room + '명</span></div>' + list.map(function (x) { return '<label class="li keepl"><input type="checkbox" class="kk" value="' + esc(x.uid) + '"' + (on[x.uid] ? ' checked' : '') + '><div class="t"><b>' + LZ.nimE(x.nick) + (x.lock ? ' <span class="chip gray">보기만</span>' : '') + '</b><span class="su">들어온 날 ' + LZ.fmtDate(x.joined) + ' · 기록 ' + x.holes + '홀</span></div></label>'; }).join('') + '</div>' +
        '<button type="button" class="btn" data-act="keepSave">' + LZ.ic('check') + '이대로 정하기</button></div>';
      $$('.kk').forEach(function (c) { c.addEventListener('change', function () { var n = $$('.kk:checked').length; $('#keepN').textContent = n + ' / ' + s.room + '명'; $('#keepN').classList.toggle('over', n > s.room); }); });
    }
  };
  LZ.act.keepSave = async function () { var uids = $$('.kk:checked').map(function (c) { return c.value; }); try { CL.d = await LZ.api('moimKeep', { id: CL.d.moim.id, uids: uids }); LZ.toast('남길 회원을 정했어요', 3000); LZ.back(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.capToggle = function () { var c = LZ.cur(); LZ.go('club', { id: c.p.id, manage: c.p.manage ? 0 : 1 }, { replace: true }); };
  function inviteUrl(m) { return LZ.APP_URL + '?inv=' + m.code; }
  LZ.act.joinGuide = function () {
    var url = LZ.APP_URL + '?join=1', text = '⛳ 파크골프 공략수첩\n스크린 파크골프 칠 때 홀마다 어디로 얼마나 칠지 적어 두는 수첩이에요. 가입은 무료, 닉네임과 비밀번호 4자리면 끝!\n아래 링크를 누르면 가입 화면이 바로 열려요.';
    LZ.inviteSheet('공략수첩 가입 초대', text, url);
  };
  LZ.act.clubInvite = function () { var m = CL.d.moim; LZ.inviteSheet('"' + m.name + '" 클럽 초대', '⛳ 파크골프 공략수첩 "' + m.name + '" 클럽에 초대해요 🏌\n가입은 무료예요. 아래 링크를 누르면 바로 가입하고 클럽 가입 신청이 돼요.\n클럽 코드 ' + m.code, inviteUrl(m)); };
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
    o = o || {}; var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d'), F = 'Pretendard, "Noto Sans KR", sans-serif';
    try { await document.fonts.load('800 60px Pretendard'); } catch (e) { /* 기본 글꼴 */ }
    try { await LZ.need('qr'); } catch (e) { /* QR 없이 */ }
    var grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#0B5D4B'); grad.addColorStop(1, '#063D31'); g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(W - 120, 140, 260, 0, 7); g.fill();
    g.fillStyle = '#FBBF24'; g.font = '800 44px ' + F; g.fillText('⛳ 파크골프 공략수첩', 70, 120);
    g.fillStyle = '#fff'; g.font = '800 76px ' + F; var y = wrapText(g, o.title, 70, 230, W - 140, 92);
    g.font = '500 40px ' + F; g.fillStyle = 'rgba(255,255,255,.9)'; y += 10; y = wrapText(g, o.sub || '', 70, y, W - 140, 56);
    var bullets = o.bullets || []; g.font = '700 42px ' + F; y += 20;
    bullets.forEach(function (b) { g.fillStyle = '#FBBF24'; g.fillText('✓', 70, y); g.fillStyle = '#fff'; y = wrapText(g, b, 130, y, W - 200, 56) + 14; });
    var card = { x: 70, y: H - 460, w: W - 140, h: 380 }; g.fillStyle = '#fff'; g.beginPath(); g.roundRect ? g.roundRect(card.x, card.y, card.w, card.h, 32) : g.rect(card.x, card.y, card.w, card.h); g.fill();
    var q = qrCanvas(o.url, 260); if (q) g.drawImage(q, card.x + 40, card.y + 60, 260, 260);
    g.fillStyle = '#0B5D4B'; g.font = '800 46px ' + F; wrapText(g, o.cta || '카메라로 QR을 찍으면 바로 열려요', card.x + 340, card.y + 110, card.w - 380, 58);
    g.fillStyle = '#374151'; g.font = '500 32px ' + F; wrapText(g, o.note || '', card.x + 340, card.y + 230, card.w - 380, 44);
    if (o.code) { g.fillStyle = '#DC2626'; g.font = '800 64px ' + F; g.fillText(o.code, card.x + 340, card.y + 330); }
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
    LZ.toast('안내장 그림을 내려받았어요. 사진첩에서 카톡으로 보내세요', 4500);
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
    LZ.sheet('<h2>가입 신청 ' + rq.length + '건</h2>' + (rq.length ? rq.map(function (r) { return '<div class="card tight"><div style="display:flex;align-items:center;gap:10px"><div class="av">' + esc(r.nick.charAt(0)) + '</div><div><b style="font-size:var(--t3)">' + LZ.nimE(r.nick) + '</b><div class="muted">' + esc(r.kindName) + ' · ' + LZ.lvPts(r.pts) + (r.kid ? ' · 카카오 확인 ✓' : '') + ' · 클럽 ' + r.moims + '개 함께하는 중</div></div></div>' + (r.msg ? '<p class="muted" style="margin:8px 0 0">"' + esc(r.msg) + '"</p>' : '') + (r.know ? '<p class="muted" style="margin:4px 0 0">' + LZ.ic('user') + ' 아는 분: ' + esc(r.know) + '</p>' : '') + '<div class="row"><button type="button" class="btn" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 1 })) + '\'>승인</button><button type="button" class="btn g" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 0 })) + '\'>보류</button></div></div>'; }).join('') : '<div class="empty">새 가입 신청이 없어요.</div>') + '<p class="hint">신청은 7일이 지나면 자동으로 정리돼요.</p>');
  };
  LZ.act.reqDo = async function (el, v) { var o = JSON.parse(v); try { var r = await LZ.api('moimDecide', { rid: o.rid, ok: o.ok }); CL.d = r; LZ.toast(o.ok ? '승인했어요' : '"보류"를 보냈어요'); LZ.refreshMe().catch(function () {}); LZ.redraw(); if (r.reqs && r.reqs.length) LZ.act.clubReqs(); else LZ.closeSheet(); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubPub = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, pub: el.classList.contains('on') ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubAuto = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, auto: el.classList.contains('on') ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
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
  LZ.act.clubKick = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(LZ.nim(o.nick) + '을 내보낼까요?', '그분의 이 클럽 기록은 그분의 내 수첩으로 옮겨져요. 다시 가입 신청할 수 있어요.', '탈퇴 처리', 'r'))) return; try { CL.d = await LZ.api('moimKick', { id: CL.d.moim.id, uid: o.uid }); LZ.redraw(); LZ.toast('탈퇴 처리했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubHand = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap && !x.off; });
    LZ.sheet('<h2>캡틴 바꾸기</h2><p class="muted">받는 분이 운영할 수 있는 클럽 수(무료 ' + ((S.me && S.me.seat && S.me.seat.free_clubs) || 2) + '개 + 클럽 추가) 안이면 누구에게나 넘길 수 있어요. 산 자리는 클럽에 그대로 남고, 넘긴 뒤에는 매니저로 남아요.</p>' + (list.length ? list.map(function (x) { return '<button type="button" class="opt" data-act="handTo" data-v=\'' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '\'><b>' + LZ.nimE(x.nick) + '</b><span>' + ({ red: '레드', gold: '골드', blue: '블루' }[x.tier] || '') + ' · ' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span></button>'; }).join('') : '<div class="empty">넘길 수 있는 회원님이 없어요.</div>'));
  };
  LZ.act.handTo = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(LZ.nim(o.nick) + '께 캡틴을 넘길까요?', '넘기면 되돌릴 수 없어요(새 캡틴이 다시 넘겨 줘야 해요). 전 캡틴은 매니저로 남아요.', '넘기기'))) return; try { CL.d = await LZ.api('moimHand', { id: CL.d.moim.id, uid: o.uid }); LZ.closeSheet(); LZ.refreshMe().catch(function () {}); LZ.redraw(); LZ.toast('캡틴을 넘겼어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  /* 매니저 정하기(캡틴): 회원 목록에 스위치 */
  LZ.act.clubMgr = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap; }), n = list.filter(function (x) { return x.mgr; }).length;
    LZ.sheet('<h2>매니저 정하기</h2><p class="muted">매니저는 가입 승인·소식·모임·챌린지·자리 추가 등 캡틴 일을 함께 해요. 회원 내보내기·매니저 정하기·캡틴 바꾸기·클럽 닫기는 캡틴만 해요.</p><p class="lb" style="margin-top:0">매니저 ' + n + '명</p>' + (n > 5 ? '<p class="hint" style="margin:0 0 8px">매니저가 많으면 가입 신청 알림이 그만큼 많이 가요.</p>' : '') +
      (list.length ? list.map(function (x) { return '<div class="tgl"><span>' + LZ.nimE(x.nick) + (x.off ? '<span class="muted">지금은 쓸 수 없는 계정</span>' : '<span class="muted">' + LZ.lvPts(x.pts) + ' · 기록 ' + x.holes + '홀</span>') + '</span>' + LZ.sw(x.mgr, 'mgrTgl', x.uid, !!x.off) + '</div>'; }).join('') : '<div class="empty">아직 다른 회원님이 없어요.</div>'));
  };
  LZ.act.mgrTgl = async function (el, uid) { var on = el.classList.contains('on') ? 0 : 1; try { CL.d = await LZ.api('moimMgr', { id: CL.d.moim.id, uid: uid, on: on }); LZ.redraw(); LZ.act.clubMgr(); LZ.toast(on ? '매니저로 정했어요' : '매니저를 해제했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.mgrQuit = async function () { if (!(await LZ.confirm('매니저를 그만둘까요?', '회원으로 남고, 캡틴이 다시 정하면 매니저가 돼요.', '그만두기', 'r'))) return; try { await LZ.api('moimMgrQuit', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('club', { id: CL.d.moim.id }, { replace: true }); LZ.toast('매니저를 그만뒀어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubClose = async function () { if (!(await LZ.confirm('클럽을 닫을까요?', '다른 회원님이 없을 때만 닫을 수 있어요. 내 기록은 내 수첩으로 옮겨져요.', '클럽 닫기', 'r'))) return; try { await LZ.api('moimClose', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('home', {}, { reset: true }); LZ.toast('클럽을 닫았어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubLeave = async function () { if (!(await LZ.confirm('클럽에서 나갈까요?', '내 기록은 내 수첩으로 옮겨져요. 언제든 다시 가입 신청할 수 있어요.', '나가기', 'r'))) return; try { var r = await LZ.api('moimLeave', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('home', {}, { reset: true }); LZ.toast('나갔어요' + (r.moved ? ' · 기록 ' + r.moved + '개를 내 수첩으로 옮겼어요' : ''), 4000); } catch (e) { LZ.toast(e.message, 4500); } };

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
  LZ.screens.make = {
    show: function (p, root) {
      var sc = (S.me && S.me.seat) || { free_clubs: 2, free_seats: 10, seat_size: 10, club_price: 2000, seat_days: 365 };
      var colors = ['', '#0B5D4B', '#1E3A8A', '#7C2D12', '#6B21A8', '#0E7490', '#374151'];
      root.innerHTML = LZ.hdr('클럽 만들기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">클럽 이름</label><input type="text" id="mname" maxlength="15" placeholder="예: 우리 수요클럽"><label class="lb">지역</label><input type="text" id="marea" maxlength="15" placeholder="예: 경기 양주"><label class="lb">이번 주 모임(선택)</label><input type="text" id="mmeet" maxlength="30" placeholder="예: 목 19:00 제이드 양주점"><label class="lb">클럽 색</label><div class="seg">' + colors.map(function (c, i) { return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-act="pickColor" data-v="' + c + '" style="' + (c ? 'background:' + c + ';border-color:' + c : '') + ';height:40px;flex:' + (c ? '1' : '0 0 56px') + '">' + (c ? '' : '기본') + '</button>'; }).join('') + '</div><input type="hidden" id="ccolor" value=""><div class="tgl"><span>클럽 찾기에 보이기</span>' + LZ.sw(true, 'tglPub') + '</div><input type="hidden" id="mpub" value="1"><p class="muted" style="margin:0"></p></div>' +
        (S.user.canMake ? '<div class="box">클럽을 만들면 <b>캡틴님</b>이 돼요. 무료 ' + sc.free_clubs + '개 중 ' + (S.user.ownClubs || 0) + '개를 운영하고 있어요. 새 클럽은 캡틴 포함 <b>' + sc.free_seats + '자리</b>가 무료예요.</div><button type="button" class="btn" data-act="makeOk">' + LZ.ic('plus') + '클럽 만들기</button>'
          : '<div class="card buyc"><h3>' + LZ.ic('club') + ' 클럽 추가 · ' + LZ.won(sc.club_price) + '</h3><p style="margin:0 0 6px">무료 클럽 ' + sc.free_clubs + '개를 모두 쓰고 있어요. 하나 더 열면 아래를 함께 받아요.</p><ul class="k2"><li>새 클럽 <b>무료 ' + sc.free_seats + '자리</b>(캡틴 포함)</li><li><b>유료 ' + sc.seat_size + '자리 1장</b> · ' + (sc.seat_days % 365 === 0 ? sc.seat_days / 365 + '년' : sc.seat_days + '일') + ' — 내가 캡틴·매니저인 다른 클럽으로 옮길 수도 있어요</li><li>처음 사면 <b>레드</b> 회원이 돼요</li></ul><p class="muted" style="margin:6px 0 0">위 이름으로 결제를 요청하고, 관리자가 확인하면 클럽이 열려요.</p></div><button type="button" class="btn" data-act="makeBuy">' + LZ.ic('check') + '클럽 추가 결제로</button>') + '</div>';
    }
  };
  LZ.act.tglPub = function (el) { el.classList.toggle('on'); $('#mpub').value = el.classList.contains('on') ? '1' : '0'; };
  LZ.act.makeOk = async function () {
    LZ.busy(true, '만드는 중…');
    try { var r = await LZ.api('moimCreate', { name: $('#mname').value, area: $('#marea').value, meet: $('#mmeet').value, color: $('#ccolor').value, pub: $('#mpub').value === '1' ? 1 : 0 }); LZ.busy(false); await LZ.refreshMe(); LZ.go('club', { id: r.id }, { replace: true }); LZ.toast('클럽을 만들었어요. 회원님을 초대해 보세요'); }
    catch (e) { LZ.busy(false); if (e.code === 'needbuy') { await LZ.refreshMe(); LZ.redraw(); LZ.toast(e.message, 5000); } else LZ.toast(e.message, 5000); }
  };
  /* 3번째 클럽부터: 적은 클럽 정보로 "클럽 추가" 결제 화면 */
  LZ.act.makeBuy = function () {
    var nm = $('#mname').value.trim(); if (nm.length < 2) { LZ.toast('클럽 이름을 2자 이상 적어 주세요'); $('#mname').focus(); return; }
    LZ.go('pay', { plan: 'clubadd', name: nm, area: $('#marea').value, meet: $('#mmeet').value, color: $('#ccolor').value, pub: $('#mpub').value === '1' ? 1 : 0 });
  };

  /* ───── 알림함 ───── */
  var NICON = { pay: 'check', refund: 'back', qna: 'chat', pw: 'lock', mreq: 'user', club: 'club', course: 'pin', round: 'flag', join: 'star', fb: 'note', payok: 'check', digest: 'book' };
  LZ.screens.noti = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + LZ.skeleton(5);
      var r = await LZ.api('notiList', { read: 1 }); if (!alive()) return; if (S.me) S.me.noti = 0;
      var a = r.admin;
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + '<div class="wrap">' +
        (a ? '<div class="card tight"><div class="kv" style="grid-template-columns:repeat(4,1fr)">' + [['pay', '결제 승인', a.pay, 'payList'], ['refund', '환불', a.refund, 'refunds'], ['qna', '문의', a.qna, 'qnaList'], ['pw', '비밀번호', a.pw, 'pwreqs']].map(function (x) { return '<button type="button" style="all:unset;cursor:pointer;background:var(--soft);border-radius:14px;padding:10px 4px;text-align:center" data-go="' + x[3] + '"><b style="display:block;font-size:var(--t5);color:' + (x[2] ? 'var(--org)' : 'var(--g)') + '">' + x[2] + '</b><span style="font-size:var(--t0);color:var(--sub)">' + x[1] + '</span></button>'; }).join('') + '</div></div>' : '') +
        '<div class="card">' + (r.list.length ? r.list.map(function (n) { return '<button type="button" class="noti ' + (n.read ? '' : 'unread') + '" data-act="notiOpen" data-v="' + esc(n.to) + '"><div class="nic">' + LZ.ic(NICON[n.kind] || 'bell') + '</div><div style="flex:1;min-width:0"><b>' + esc(n.title) + '</b><span class="muted">' + esc(n.body) + '</span></div><span class="muted small" style="white-space:nowrap">' + LZ.fmtDate(n.at, true) + '</span></button>'; }).join('') + (r.list.length > (p.n || 30) ? '<button type="button" class="btn g sm" data-go="noti" data-p=\'' + JSON.stringify({ n: (p.n || 30) + 30 }) + '\'>더 보기</button>' : '') : '<div class="empty">알림이 없어요.</div>') + '</div>' +
        '<button type="button" class="btn g" data-go="notiCfg">' + LZ.ic('bell') + ' 알림 받기 설정</button></div>';
      LZ.paintBell();
    }
  };
  LZ.act.notiOpen = function (el, to) { if (to) LZ.goTo(to); };

  /* ───── 사용 안내 ───── */
  /* ───── 캡틴 대시보드 ───── */
  LZ.screens.capDash = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('캡틴 대시보드', { back: true }) + LZ.skeleton(5);
      var d; try { d = await LZ.api('capDash', { id: p.id, ym: p.ym }); } catch (e) { LZ.toast(LZ.errText(e), 4000); LZ.back(); return; } if (!alive()) return; CD = d; CD.mid = p.id;
      var ym = d.ym, y = +ym.slice(0, 4), mo = +ym.slice(5, 7), prev = mo === 1 ? (y - 1) + '-12' : y + '-' + (mo - 1 < 10 ? '0' : '') + (mo - 1), next = mo === 12 ? (y + 1) + '-01' : y + '-' + (mo + 1 < 10 ? '0' : '') + (mo + 1), isNow = ym === new Date().toISOString().slice(0, 7);
      root.innerHTML = LZ.hdr('캡틴 대시보드', { back: true }) + '<div class="wrap"><p class="lb" style="margin:0 0 8px">' + esc(d.name) + '</p>' +
        '<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><button type="button" class="sm2 g" data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: p.id, ym: prev })) + '\'>‹</button><b style="flex:1;text-align:center;font-size:var(--t3)">' + d.ym + '</b><button type="button" class="sm2 g" data-go="capDash" data-p=\'' + esc(JSON.stringify({ id: p.id, ym: next })) + '\'' + (isNow ? ' disabled' : '') + '>›</button></div></div>' +
        '<div class="card"><div class="kv"><div><b>' + d.members.length + (d.cap < 1000 ? '/' + d.cap : '') + '</b><span>회원/자리</span></div><div><b>' + d.totalRounds + '</b><span>라운드</span></div><div><b>' + d.totalHoles + '</b><span>공략 기록(홀)</span></div></div>' + (d.reqs ? '<button type="button" class="btn o sm" data-go="club" data-p=\'' + esc(JSON.stringify({ id: p.id, reqs: 1 })) + '\'>가입 신청 ' + d.reqs + '건 보기</button>' : '') + (d.locked ? '<div class="box err" style="margin-top:8px">' + LZ.ic('lock') + ' ' + esc(d.lockWhy) + '</div>' : (d.members.length >= d.cap && d.cap < 1000 ? '<div class="box" style="margin-top:8px">자리가 다 찼어요 · <button type="button" class="sm2" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'seat', mid: p.id })) + '\'>자리 추가</button></div>' : '')) + '</div>' +
        '<div class="card"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">' + LZ.ic('trophy') + ' ' + d.ym + ' 시상식</h3>' + (d.awards.length ? '<button type="button" class="sm2" data-act="cdShare">결과 그림</button>' : '') + '</div>' + (d.awards.length ? '<div class="list" style="margin-top:8px">' + d.awards.map(function (a) { return '<div class="it"><span class="awic">' + LZ.ic(a.ic || 'trophy') + '</span><div class="t"><b>' + esc(a.n) + '</b><span class="muted">' + LZ.nimE(a.who) + ' · ' + esc(a.v) + '</span></div></div>'; }).join('') + '</div><p class="hint">끝낸 라운드(9홀 이상)와 공략 기록으로 자동 집계. 행운상은 이달 활동한 분 중 추첨이에요.</p>' : '<p class="muted" style="margin:8px 0 0">이달에 끝낸 라운드나 기록이 아직 없어요.</p>') + '</div>' +
        '<div class="card"><h3>회원 활동 <span class="muted" style="font-weight:400">· 30일 넘게 안 오신 분 ' + d.idle + '명</span></h3><div class="list">' + d.members.map(function (x) { var idle = Date.now() - x.seen > 30 * 86400000; return '<div class="it">' + LZ.avatar(x) + '<div class="t"><b>' + esc(x.nick) + '</b><span class="muted">라운드 ' + x.rounds + ' · 기록 ' + x.holes + '홀 · ' + (x.best ? '최고 ' + (x.best.d > 0 ? '+' : '') + x.best.d + ' · ' : '') + (x.seen ? '마지막 ' + LZ.fmtDate(x.seen) : '아직 안 옴') + '</span></div>' + (idle ? '<span class="chip gray">잠잠</span>' : '') + '</div>'; }).join('') + '</div></div></div>';
    }
  };
  var CD = null, AW_EMO = { trophy: '🏆', medal: '🥈', target: '🔥', note: '📝', clover: '🍀' };   // 카톡으로 보내는 글·그림에만 이모지
  LZ.act.cdShare = async function () {
    var d = CD, cv = document.createElement('canvas'), W = 1080, rh = 110, H = 300 + d.awards.length * rh + 60; cv.width = W; cv.height = H; var g = cv.getContext('2d'), F = 'Pretendard, "Noto Sans KR", sans-serif';
    g.fillStyle = '#F3F6F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0B5D4B'; g.fillRect(0, 0, W, 200); g.fillStyle = '#FBBF24'; g.font = '800 40px ' + F; g.fillText('⛳ ' + d.name, 50, 80); g.fillStyle = '#fff'; g.font = '800 60px ' + F; g.fillText('🏆 ' + d.ym + ' 시상식', 50, 160);
    d.awards.forEach(function (a, i) { var y = 260 + i * rh; g.fillStyle = i % 2 ? '#fff' : '#E7F3EF'; g.fillRect(40, y - 50, W - 80, rh); g.font = '800 46px ' + F; g.fillStyle = '#172026'; g.fillText((AW_EMO[a.ic] || '') + ' ' + a.n, 60, y + 10); g.font = '700 38px ' + F; g.fillStyle = '#0B5D4B'; g.fillText(LZ.nim(a.who), 60, y + 50); g.font = '400 30px ' + F; g.fillStyle = '#6B7280'; g.fillText(a.v, 60 + g.measureText(LZ.nim(a.who)).width + 30, y + 50); });
    g.fillStyle = '#9CA3AF'; g.font = '400 26px ' + F; g.fillText('파크골프 공략수첩 · ' + LZ.APP_URL, 50, H - 20);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); }), file = new File([blob], 'club-awards-' + d.ym + '.png', { type: 'image/png' });
    var text = '🏆 ' + d.name + ' ' + d.ym + ' 시상식\n' + d.awards.map(function (a) { return (AW_EMO[a.ic] || '') + ' ' + a.n + ': ' + LZ.nim(a.who) + ' (' + a.v + ')'; }).join('\n');
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: d.name, text: text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
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
        D('등급 · 자리 · 요금', '<div class="seatguide">' + LZ.cleanHtml((cfg.seat && cfg.seat.guide) || '') + '</div><p class="muted" style="margin:8px 0 0"><b>블루</b> 무료 · <b>레드</b> 기간이 남은 유료 자리를 가진 회원 · <b>골드</b> 관리자가 드린 무료 자리(가입 기념일까지) · <b>블랙</b> 이용 정지. 자리 기간이 끝나면 ' + LZ.remindTxt(cfg.seat && cfg.seat.remind) + '에 알려 드리고, ' + ((cfg.seat && cfg.seat.grace_days) || 14) + '일 유예 뒤 자리가 모자라면 늦게 들어온 분부터 보기만 해요(캡틴·매니저 제외). 적립 포인트는 ' + ((cfg.seat && cfg.seat.point_unit) || 10) + 'P 단위로 결제에 섞어 쓸 수 있어요.</p>') +
        D('비밀번호 · 카카오 확인', '<p style="margin:0">가입할 때 <b>카카오로 본인 확인</b>을 한 번 해요(카카오 계정 하나에 회원 한 분, 카카오에서는 회원번호만 받아요). 로그인은 닉네임과 비밀번호 4자리로 해요. 잊으면 ① 로그인 화면 "비밀번호를 잊었어요" → <b>카카오로 확인</b>하고 새 4자리 정하기 ② 관리자가 만들어 준 계정은 관리자에게 찾기 신청(임시 번호 ' + R.tmpHours + '시간). 캡틴은 비밀번호를 볼 수도 바꿀 수도 없어요.</p>') +
        D('적립 포인트 · 레벨', (function () { var r = cfg.pt; if (!r) return '<p style="margin:0">내 정보 → 적립 포인트에서 봐요.</p>'; return '<p style="margin:0 0 6px">홀 기록 새로 적기 +' + r.hole_new + 'P(홀마다) · 다듬기 +' + r.hole_fix + 'P · 새 코스 등록 +' + r.course_reg + 'P · 코스 정보 고치기 +' + r.course_fix + 'P · 내 기록을 가져감 +' + r.import + 'P × 레벨 배수 · 자리·클럽 추가 ' + r.earn_pct + '%. 하루 최대 ' + r.day_cap + 'P(결제 적립 빼고), 1P = 1원, ' + r.unit + 'P 단위로 쓰고 ' + r.years + '년 뒤 사라져요.</p><p style="margin:0">레벨(모은 포인트): ' + r.names.map(function (n, k) { return LZ.LVN[k][0] + ' ' + n + ' ' + Number(r.th[k]).toLocaleString('ko-KR') + ' (×' + r.mul[k] + ')'; }).join(' · ') + '</p>'; })()) +
        D('볼스피드 기준', '<p style="margin:0 0 6px"><b>볼스피드</b>는 공이 출발하는 속도예요. <b>8~40</b>(40은 Full), 0.5씩 적어요. <b>센서 탄도</b>는 그 매장 센서 설정(더높게·높게·보통·낮게·더낮게)이고, 스크린은 굴러가는 마찰이 거의 없어 탄도가 높을수록 멀리 가요(캐리 = 날아간 거리, 런 = 떨어진 뒤 굴러간 거리).</p><p style="margin:0 0 6px">총 비거리 = (기준 거리 <b>' + LZ.fmtM(pw.d0) + 'm</b> + (볼스피드 − 모드 기준) × 1당 비거리) × (1 + 탄도 %) · 탄도 간격 <b>' + pw.gap + '%</b>(높게 +' + pw.gap + '% · 더높게 +' + LZ.r1(pw.gap * 2) + '%).</p><div class="tblwrap"><table class="tbl" style="font-size:var(--t0)"><tr><th>모드</th><th>모드<br>기준</th><th>1당<br>비거리</th><th>80m<br>높게</th><th>80m<br>보통</th><th>80m<br>낮게</th></tr>' + ['b', 'p', 'm'].map(hlRow).join('') + '</table></div><p class="muted" style="margin:6px 0 0">표시: <b>~17</b> = 17까지, <b>16~</b> = 16 넘게 17 전까지(아래 막대의 점이 정확한 자리). 기준과 1 이내면 초록 ●, 1 넘게 크면 ▲ · 작으면 ▼. 다른 모드·매장에서 칠 때는 <b>같은 거리</b>가 나오는 볼스피드로 바꿔 보여요. 그렇게 보면서 치기 화면에서 고쳐 저장하면 그 코스의 <b>기록 기준</b>이 그 기준으로 바뀌고 다른 홀도 함께 바뀌어요. 관리자가 설정에서 바꾸면 여기도 같이 바뀌어요.</p>') +
        D('기록 규칙', '<ul style="margin:0;padding-left:18px"><li>위치 기준: <b>첫화면</b>(기본) · 홀컵 · 직접</li><li>좌우: <b>그대로</b> 또는 <span style="color:var(--red);font-weight:700">좌 1~10</span>·<span style="color:var(--blue);font-weight:700">우 1~10</span>칸, 볼스피드는 0.5씩. 단추를 꾹 누르면 빨리 움직여요</li><li>참고사항은 ' + R.noteMax + '자(사진은 없어요)</li><li>기록은 회원·코스마다 <b>하나</b>. 어느 클럽에서 적어도 같은 기록이고, 클럽을 나가도 그대로예요</li><li>회원님 기록은 같은 클럽 분 것만 보여요. 공개·비공개는 <b>코스마다</b> 자물쇠로 정해요(새 코스는 공개). <b>클럽 평균</b>은 이 코스를 공개한 회원님이 3명 이상일 때 보여요</li><li>코스 정보는 누구나 고치고 이력이 남아요</li></ul>') +
        D('클럽', '<ul style="margin:0;padding-left:18px"><li>가입: 초대 링크 · 클럽 코드 6자리 · 클럽 찾기 → 캡틴이 <b>승인</b>(또는 보류). ' + R.reqDays + '일 지나면 신청 정리</li><li>클럽 자리(캡틴 포함)가 다 차면 승인이 안 돼요 → 캡틴·매니저가 <b>자리 추가</b></li><li>캡틴 바꾸기는 받는 분이 운영할 수 있는 클럽 수 안에서. 산 자리는 클럽에 남고, 전 캡틴은 매니저로 남아요</li><li>회원 <b>내보내기</b>는 캡틴만. 내보내도 그분 기록은 그분 것</li><li>캡틴은 <b>매니저</b>를 정할 수 있어요. 매니저는 가입 승인·소식·모임·챌린지·자리 추가 등 캡틴 일을 함께 하고, 회원 내보내기·매니저 정하기·캡틴 바꾸기·클럽 닫기는 캡틴만 해요</li><li>앱이 없는 분께는 <b>가입 안내 보내기</b>(카톡·문자)로 알려요</li></ul>') +
        D('필드 라운드 · 시상식 · 단체', '<div class="awlinks"><button type="button" class="sm2" data-go="awGuide">' + LZ.ic('book') + ' 시상식 안내</button><button type="button" class="sm2 o" data-act="awDemo">' + LZ.ic('trophy') + ' 미리보기</button></div><ul style="margin:0;padding-left:18px"><li>개별 라운드: 한 조 2~5명, 손님은 이름만. 끝내면 결과 화면에서 <b>시상식</b>을 열어 우승·준우승·장려·행운상(추첨) 등을 뽑고 결과 그림을 카톡으로 보내요</li><li>안 적은 홀은 파. ＋는 보기, −는 버디. 파를 고치면 ±는 그대로 두고 타수만 바뀌어요</li><li>끝낸 뒤 ' + (R.editHours || 2) + '시간까지 고칠 수 있고 고친 이력이 남아요. 주최자가 최종 확정하면 잠겨요</li><li>' + R.roundHours + '시간 지나면 저절로 끝나요</li><li><b>단체 라운드</b>: 누구나 주최. 조 1~' + (R.teamsMax || 50) + ' 사전 편성(자동 편성·대기 명단), 18/36/54/72홀(바퀴 1~4), 구장 선택·새 등록, 조별 도는 순서 자동 배치</li><li>카톡 초대장(편성표 글+그림)을 받으면 앱에서 내 조로 바로 들어가요. 앱이 없던 분은 가입하면 손님 자리와 점수를 그대로 이어받아요</li><li>상황판 3탭(조별·개인·편성표), 집계 범위(바퀴·조), 시상식 1부 조별(행운상→다음에 잘 치자상→단합상→장려상→준우승→우승) · 2부 개인, 중복 수상 가능/불가, 결과 그림 공유, 도우미 2명</li></ul>') +
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
  LZ.screens.firstSteps = { show: guideShow('first') };
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

})();
