/* 내 정보: 등급·자리·결제(포인트+송금)·환불 · 적립 포인트·레벨(v7.3) · 비밀번호·카카오 본인 확인 · 보기 설정 · 친구 초대하기 · 프로필 사진 · 알림 설정(푸시·카카오) · 의견 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  /* 친구 초대: 내 클럽이 여럿이면 어느 클럽으로 부를지 고르고(안 부를 수도), 링크에 그 클럽 코드를 붙여요 */
  LZ.refLink = function (m) { return LZ.APP_URL + '?ref=' + S.user.uid + (m ? '&inv=' + m.code : '&inv=0'); };
  LZ.refText = function (m) { return '⛳ 파크골프 공략수첩\n스크린 파크골프 칠 때 홀마다 어디로 얼마나 칠지 적어 두는 수첩이에요. 가입은 무료' + (m ? '고, 아래 링크로 들어오면 ' + LZ.nim(S.user.nick) + '의 "' + m.name + '" 클럽과 바로 연결돼요.\n같이 기록하고 같이 시상식 해요 🏆' : '예요.\n홀마다 적어 두면 다음에 칠 때 훨씬 편해요 🏆') + '\n👇 아래 링크를 눌러 가입하세요'; };
  /* 친구 초대하기 카드(홈 아래·내 정보 아래) */
  LZ.inviteCard = function (big) { if (S.user.kind === 'admin') return ''; var n = (S.me && S.me.moims || []).length; return '<div class="card invite"><div style="display:flex;align-items:center;gap:10px"><span class="invic">' + LZ.ic('club') + '</span><div style="flex:1"><h3 style="margin:0">친구 초대하기</h3><div class="muted">' + (n > 1 ? '어느 클럽으로 부를지 고른 뒤 링크를 보내요. 클럽 없이 앱만 소개할 수도 있어요' : n === 1 ? '내 링크로 가입하면 내 클럽에 바로 연결돼요. 함께 치는 분이 많을수록 시상식이 즐거워요' : '내 링크로 가입하면 앱만 소개돼요(클럽에 들어오게 하려면 먼저 클럽을 만들거나 가입하세요)') + '</div></div></div><button type="button" class="btn kakao" data-act="inviteKakao">친구 초대하기</button>' + '</div>'; };
  LZ.act.inviteKakao = function () {
    var ms = (S.me && S.me.moims || []).filter(function (m) { return m.code; });
    if (ms.length <= 1) { var m = ms[0] || null; LZ.inviteSheet('공략수첩 가입 초대', LZ.refText(m), LZ.refLink(m)); return; }
    LZ.sheet('<h2>어느 클럽으로 부를까요?</h2><p class="muted">고른 클럽에 바로 연결돼요(캡틴 승인 설정에 따라 신청으로 들어갈 수도 있어요).</p>' +
      ms.map(function (m, i) { return '<button type="button" class="opt" data-act="inviteFor" data-v="' + i + '"><b>' + esc(m.name) + '</b><span>' + (m.role === 'cap' ? '캡틴' : m.role === 'mgr' ? '매니저' : '회원') + ' · ' + m.members + '명</span></button>'; }).join('') +
      '<button type="button" class="opt" data-act="inviteFor" data-v="-1"><b>클럽 없이 앱만 소개</b><span>어느 클럽에도 연결하지 않아요</span></button>');
  };
  LZ.act.inviteFor = function (el, v) { var ms = (S.me && S.me.moims || []).filter(function (m) { return m.code; }), m = +v >= 0 ? ms[+v] : null; LZ.closeSheet(); LZ.inviteSheet('공략수첩 가입 초대', LZ.refText(m), LZ.refLink(m)); };

  /* 내 정보(v7 #29): 다섯 그룹만 두고 들어가서 보기. 보기 설정(큰 글씨·어두운 화면·진동)은 상단 가+ · ◐ 로 옮김 */
  function grow(icon, title, sub, attrs) { return '<button type="button" class="li grow" ' + attrs + '>' + LZ.ic(icon, 'gi') + '<div class="t"><b>' + title + '</b><span class="su">' + sub + '</span></div>' + LZ.ic('chev') + '</button>'; }
  function tierShort(u) { var t = u.tier; return t === 'admin' ? '관리자' : t === 'gold' ? '골드 ~' + LZ.fmtYmd(u.end) : t === 'red' ? '레드 ~' + LZ.fmtYmd(u.end) : t === 'black' ? '블랙(이용 정지)' : '블루 · 무료'; }
  LZ.screens.me = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('내 정보', { logout: 1 }) + LZ.skeleton(5); await LZ.refreshMe(); if (!alive()) return; }
      var u = S.user, m = S.me, ad = m.admin || {}, isCap = u.kind === 'admin' || (m.moims || []).some(function (x) { return x.role === 'cap' || x.role === 'mgr'; });
      root.innerHTML = LZ.hdr('내 정보', { logout: 1 }) + '<div class="wrap">' +
        '<div class="hello"><button type="button" class="avbtn" data-act="avatarMenu" aria-label="프로필 사진 바꾸기">' + LZ.avatar(u, 'big') + '<span class="avedit">' + LZ.ic('edit') + '</span></button><div style="flex:1;min-width:0"><div class="hname"><b>' + esc(u.nick) + '</b> <span>회원님</span></div><div class="tier">' + LZ.tierLines(u) + '</div><div class="su">' + LZ.lvBadge((m.points && m.points.tot) || 0) + ' 적립 포인트 ' + ((m.points && m.points.bal) || 0).toLocaleString() + 'P</div></div></div>' +
        (u.kind === 'admin' ? '<button type="button" class="cont" data-go="dash">' + LZ.ic('gear', 'ci') + '<div style="flex:1;min-width:0"><b>관리자</b><span class="muted">결제 ' + (ad.pay || 0) + ' · 환불 ' + (ad.refund || 0) + ' · 비밀번호 ' + (ad.pw || 0) + ' · 문의 ' + (ad.qna || 0) + '</span></div>' + LZ.ic('chev') + '</button>' : '') +
        '<div class="card tight groups">' +
        grow('seat', '내 등급·자리', esc(tierShort(u)) + (u.packs ? ' · 자리 ' + u.packs + '장' : '') + (m.pending ? ' · 결제 ' + esc(m.pending.stName) : ''), 'data-go="meTier"') +
        grow('star', '적립 포인트', ((m.points && m.points.bal) || 0).toLocaleString() + 'P · ' + esc((m.points && m.points.lvName) || '새싹') + (m.points && m.points.soon && m.points.soon.left <= 30 ? ' · 곧 사라질 ' + m.points.soon.amt.toLocaleString() + 'P' : ''), 'data-go="mePoints"') +
        grow('bell', '알림 설정', '푸시' + (isCap ? ' · 카카오톡' : '') + ' · 조용한 시간', 'data-go="notiCfg"') +
        grow('shield', '계정·안전', '닉네임 · 비밀번호 · 프로필 사진', 'data-go="meAcct"') +
        grow('chat', '도움', '파크골프 첫걸음 · 사용 안내 · 문의 · 공지' + (m.qna ? ' · 답변 ' + m.qna + '건' : ''), 'data-go="helpHub"') +
        '</div>' + LZ.inviteCard(true) +
        '<button type="button" class="verline" data-act="verRefresh">파크골프 공략수첩 v' + esc(window.LZ_VER || '4.0') + ' · ' + (S.me && S.me.appVer && S.me.appVer !== window.LZ_VER ? '최신 v' + esc(S.me.appVer) + '로 새로 고침' : '최신 버전으로 새로 고침') + '</button></div>';
    }
  };
  /* 내 등급·자리(v7.2 #20): 등급·기간 · 결제 요청 상태 · 내 클럽 자리 · 내가 산 자리(연장·옮기기) · 안내(관리자 설정 글) */
  var won = function (n) { return Number(n || 0).toLocaleString() + '원'; }, pt = function (n) { return Number(n || 0).toLocaleString() + 'P'; };
  function dd(x) { return '<span class="nw">' + LZ.fmtYmd(x) + '</span>'; }
  LZ.dd = dd;
  LZ.won = won;
  var TDESC = { blue: '무료 회원 · 클럽 {c}개, 클럽마다 {s}자리', red: '유료 자리를 가진 회원 · 가진 자리 중 가장 늦게 끝나는 날까지', gold: '관리자가 드린 무료 {z}자리 · 가입 기념일 전날까지', black: '이용 정지 · 관리자에게 문의해 주세요', admin: '관리자' };
  LZ.tierDesc = function (u, sc) { sc = sc || (S.me && S.me.seat) || {}; return (TDESC[u.tier] || '').replace('{c}', sc.free_clubs || 2).replace('{s}', sc.free_seats || 10).replace('{z}', sc.seat_size || 10); };
  var PKN = { free: '무료', paid: '유료', club: '유료', gold: '골드', admin: '관리자' };
  /** 자리 묶음 한 줄: "유료 10자리 · 2026-10-20 ~ 2027-10-19 · 홍길동" */
  LZ.packLine = function (p, o) {
    o = o || {}; var per = p.kind === 'free' ? '기간 없음' : (p.start ? dd(p.start) + ' ~ ' : '') + dd(p.end) + (p.left !== null && p.left !== undefined ? '<span class="nw">' + (p.left >= 0 ? ' (남은 ' + p.left + '일)' : ' (끝남)') + '</span>' : '');
    var chip = p.grace ? ' <span class="chip red">유예 중</span>' : !p.live && p.kind !== 'free' ? ' <span class="chip gray">끝남</span>' : p.left !== null && p.left <= 30 && p.kind !== 'free' ? ' <span class="chip">곧 끝나요</span>' : '';
    return '<div class="li pkrow"><div class="t"><b>' + (PKN[p.kind] || '') + ' ' + p.seats + '자리' + chip + '</b><span class="su">' + per + (o.club && p.club ? ' · ' + esc(p.club) : !p.mid && p.kind !== 'free' ? ' · 아직 클럽에 안 놓음' : '') + (o.who && p.ownerNick ? ' · ' + esc(p.ownerNick) : '') + '</span>' + (o.btns || '') + '</div></div>';
  };
  LZ.screens.meTier = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('내 등급·자리', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('payInfo', {}); if (!alive()) return; var m = S.me || {};
      var u = d.user, sc = d.seat, ms = m.moims || [], pend = d.pending, rf = d.refund || {}, staffed = d.clubs || [];
      var mine = (d.mine || []).filter(function (x) { return x.kind !== 'admin'; });
      root.innerHTML = LZ.hdr('내 등급·자리', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>' + LZ.ic('seat') + ' 내 등급</h3>' + LZ.tierLines(u) + '<p class="muted" style="margin:6px 0 0">' + esc(LZ.tierDesc(u, sc)) + '</p>' +
          (u.wasRed && u.tier === 'blue' ? '<p class="muted" style="margin:6px 0 0">유료 자리 기간이 끝나 블루예요. 자리를 다시 사면 바로 레드가 돼요.</p>' : '') +
          '<button type="button" class="li ptline" data-go="mePoints">' + LZ.ic('star', 'gi') + '<div class="t"><b>적립 포인트 ' + pt(d.points.bal) + '</b><span class="su">결제에 ' + d.points.unit + 'P 단위로 써요' + (d.points.soon ? ' · ' + dd(d.points.soon.date) + '에 ' + pt(d.points.soon.amt) + ' 사라져요' : '') + '</span></div>' + LZ.ic('chev') + '</button></div>' +
        (pend ? '<div class="card pendc"><h3>' + LZ.ic('bell') + ' 결제 ' + esc(pend.stName) + '</h3><p style="margin:0"><b>' + esc(pend.planName) + '</b></p><p class="muted" style="margin:4px 0 0">보낼 금액 ' + won(pend.cash) + (pend.pts ? ' · 포인트 ' + pt(pend.pts) : '') + ' · ' + (pend.method === 'bank' ? '계좌' : '카카오페이') + ' · 보낸 분 ' + esc(pend.depLabel || pend.depositor) + '</p><p class="muted" style="margin:4px 0 8px">관리자가 확인하면 그때 자리가 생기고 알림이 와요.</p><button type="button" class="btn g sm" data-act="payCancel" style="margin:0">요청 취소</button></div>' : '') +
        (rf.req ? '<div class="card pendc"><h3>' + LZ.ic('back') + ' 환불 ' + esc(rf.req.stName) + '</h3><p style="margin:0">' + esc(rf.req.planName) + ' · ' + won(rf.req.amount) + '</p><button type="button" class="btn g sm" data-go="refund">환불 보기</button></div>' : '') +
        '<div class="card tight"><h3 class="ih">' + LZ.ic('club') + '내 클럽 자리</h3>' + (ms.length ? ms.map(function (x) {
          return '<button type="button" class="li" data-go="club" data-p=\'' + esc(JSON.stringify({ id: x.id })) + '\'><div class="t"><b>' + esc(x.name) + (x.role === 'cap' ? ' <span class="chip cap">캡틴</span>' : x.role === 'mgr' ? ' <span class="chip mgr">매니저</span>' : '') + (x.locked ? ' <span class="chip gray">' + LZ.ic('lock') + ' 잠김</span>' : x.meLock ? ' <span class="chip gray">보기만</span>' : '') + '</b><span class="su">' + LZ.seatTxt(x) + (x.nextEnd ? ' · 다음 끝 ' + LZ.dd(x.nextEnd) : '') + '</span></div>' + LZ.ic('chev') + '</button>';
        }).join('') : '<p class="muted" style="margin:6px 0">함께하는 클럽이 없어요.</p>') +
          '<p class="hint" style="margin:8px 2px 4px">운영하는 클럽 ' + u.ownClubs + '개 · 무료 ' + sc.free_clubs + '개' + (u.makeMax > sc.free_clubs ? ' + 더 열 수 있는 ' + (u.makeMax - sc.free_clubs) + '개' : '') + '</p>' +
          '<div class="row">' + (staffed.length ? '<button type="button" class="btn sm" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'seat', mid: staffed[0].id })) + '\'>' + LZ.ic('plus') + sc.seat_size + '자리 추가</button>' : '') + '<button type="button" class="btn o sm" data-go="make">' + LZ.ic('club') + (u.canMake ? '클럽 만들기' : '클럽 추가') + '</button></div></div>' +
        (mine.length ? '<div class="card tight"><h3 class="ih">' + LZ.ic('seat') + '내가 가진 자리</h3>' + mine.map(function (x) {
          var b = x.kind === 'gold' ? '' : '<div class="pkb"><button type="button" class="sm2" data-go="pay" data-p=\'' + esc(JSON.stringify({ plan: 'renew', pack: x.id })) + '\'>연장</button>';
          if (x.kind === 'gold') b = '<div class="pkb">';
          b += (x.live || x.grace) && !x.inUse && staffed.length > (x.mid ? 1 : 0) ? '<button type="button" class="sm2 g" data-act="packMove" data-v=\'' + esc(JSON.stringify({ id: x.id, from: x.mid })) + '\'>옮기기</button>' : x.inUse ? '<span class="muted small">쓰는 중이라 못 옮겨요</span>' : '';
          return LZ.packLine(x, { club: 1, btns: b + '</div>' });
        }).join('') + '<p class="hint" style="margin:6px 2px 4px">연장하면 끝나는 날부터 이어져요. 안 쓰는 자리는 내가 캡틴·매니저인 다른 클럽으로 옮길 수 있어요(끝나는 날 그대로).</p></div>' : '') +
        (rf.can || rf.recent ? '<button type="button" class="btn g sm" data-go="refund">' + LZ.ic('back') + '환불' + (rf.recent ? ' · ' + esc(rf.recent.stName) : '') + '</button>' : '') +
        '<details class="card acc"><summary><h3>' + LZ.ic('help') + ' 등급·자리 안내</h3></summary><div class="accb seatguide">' + LZ.cleanHtml(sc.guide) + '</div></details></div>';
    }
  };
  /** "24명 / 30자리" (관리자 클럽은 제한 없음) */
  LZ.seatTxt = function (m) { var n = Number(m.members || m.n || 0).toLocaleString('ko-KR'); return m.staffClub ? n + '명 · 자리 제한 없음' : n + '명 / ' + Number(m.seats || m.cap || 0).toLocaleString('ko-KR') + '자리' + (m.grace ? ' (+유예 ' + m.grace + ')' : ''); };
  /* 자리 옮기기: 내가 캡틴·매니저인 다른 클럽 고르기 */
  LZ.act.packMove = async function (el, v) {
    var o = JSON.parse(v), list = (S.me && S.me.moims || []).filter(function (m) { return (m.role === 'cap' || m.role === 'mgr') && m.id !== o.from && !m.staffClub; });
    if (!list.length) { LZ.toast('옮길 수 있는 다른 클럽이 없어요(내가 캡틴·매니저인 클럽)', 4000); return; }
    LZ.sheet('<h2>' + LZ.ic('seat') + ' 자리 옮기기</h2><p class="muted">끝나는 날은 그대로예요. 지금 그 자리를 쓰지 않을 때만 옮겨져요.</p>' + list.map(function (m) { return '<button type="button" class="opt" data-act="packMoveTo" data-v=\'' + esc(JSON.stringify({ id: o.id, mid: m.id, name: m.name })) + '\'><b>' + esc(m.name) + '</b><span>' + LZ.seatTxt(m) + ' → ' + (Number(m.seats || 0) + 10) + '자리</span></button>'; }).join(''));
  };
  LZ.act.packMoveTo = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm('"' + o.name + '"(으)로 옮길까요?', '끝나는 날은 그대로예요.', '옮기기'))) return; try { await LZ.api('packMove', { id: o.id, mid: o.mid }); LZ.closeSheet(); await LZ.refreshMe(); LZ.toast('자리를 옮겼어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* 적립 포인트(v7.3 #25): 쓸 수 있는 포인트·레벨 막대·곧 사라질 포인트 · 전체/받은 것/쓴 것/사라진 것 · 날짜별 사유 · 모으는 법(관리자 설정값) */
  var PTF = { f: 'all' };
  var PTCAT = [['all', '전체'], ['in', '받은 것'], ['out', '쓴 것'], ['gone', '사라진 것']];
  function ptRules(r, i) {
    if (!r) return '';
    var row = function (what, v, cond) { return '<div class="prw"><div class="t"><b>' + what + '</b><span class="su">' + cond + '</span></div><b class="pv">' + v + '</b></div>'; };
    var lv = r.names.map(function (n, k) { return '<div class="lvs' + (i && i.lv === k ? ' on' : '') + '"><span class="lvi">' + LZ.LVN[k][0] + '</span><b>' + esc(n) + '</b><span>' + Number(r.th[k]).toLocaleString('ko-KR') + 'P~</span><em>×' + r.mul[k] + '</em></div>'; }).join('');
    return '<div class="card"><h3>' + LZ.ic('star') + ' 이렇게 모아요</h3>' +
      row('홀 기록 새로 적기', '+' + r.hole_new + 'P', '홀마다 · 코스·홀마다 처음 한 번') +
      row('홀 기록 다듬기', '+' + r.hole_fix + 'P', '값이 실제로 바뀔 때만 · 같은 홀은 하루 1번') +
      row('새 코스 등록', '+' + r.course_reg + 'P', '18홀 거리를 모두 넣어 등록을 마쳤을 때') +
      row('코스 정보 고치기', '+' + r.course_fix + 'P', '같은 코스는 하루 1번 · ' + r.claw_days + '일 안에 되돌려지면 회수') +
      row('다른 분이 내 기록을 가져감', '+' + r.import + 'P × 레벨', '같은 분·같은 코스 1번 · 카카오 확인 받은 다른 회원님만') +
      row('자리·클럽 추가 구매', r.earn_pct + '%', '보낸 돈만큼 · 환불하면 회수') +
      '<p class="hint ptfoot">하루 최대 <b>' + r.day_cap + 'P</b>(결제 적립 빼고) · 1P = 1원 · 쓸 때는 <b>' + r.unit + 'P 단위</b> · 받은 날부터 ' + r.years + '년 · 사라지기 ' + r.remind.join('·') + '일 전에 알려 드려요</p>' +
      '<h3 class="lvh">레벨 <span class="muted small">모은 포인트 기준 · 써도 그대로</span></h3><div class="lvgrid">' + lv + '</div></div>';
  }
  LZ.screens.mePoints = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('적립 포인트', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('points', {}); if (!alive()) return; var i = d.info, f = PTF.f;
      var span = i.next ? Math.max(1, i.next.at - i.from) : 1, pc = i.next ? Math.max(0, Math.min(100, Math.round((i.tot - i.from) / span * 100))) : 100;
      var list = d.list.filter(function (x) { return f === 'all' || x.cat === f; }), day = '', rows = '';
      list.forEach(function (x) {
        if (x.day !== day) { day = x.day; rows += '<div class="ptday">' + esc(x.sum ? day + ' 모음' : LZ.fmtYmd(day)) + '</div>'; }   // v7.0.1 오래된 달은 한 줄로 모아요
        var sg = x.sign > 0 ? '+' : x.sign < 0 ? '−' : '', cls = x.sign > 0 ? 'pin' : x.cat === 'gone' ? 'pgone' : x.sign < 0 ? 'pout' : 'pzero';
        rows += '<div class="li ptl"><div class="t"><b>' + esc(x.title) + '</b>' + (x.sub ? '<span class="su">' + esc(x.sub) + '</span>' : '') + '</div><b class="ptv ' + cls + '">' + sg + Number(x.amt).toLocaleString('ko-KR') + 'P</b></div>';
      });
      root.innerHTML = LZ.hdr('적립 포인트', { back: true }) + '<div class="wrap">' +
        '<div class="ptcard"><div class="pth"><span>쓸 수 있는 포인트</span><em class="ptlv">' + LZ.LVN[i.lv][0] + ' ' + esc(i.lvName) + '</em></div><b>' + Number(i.bal).toLocaleString('ko-KR') + '<small>P</small></b>' +
          '<div class="ptbar" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pc + '%"></i></div>' +
          '<div class="ptf"><span>지금까지 모은 ' + Number(i.tot).toLocaleString('ko-KR') + 'P</span><span>' + (i.next ? esc(i.next.name) + '까지 ' + Number(i.next.need).toLocaleString('ko-KR') + 'P' : '가장 높은 레벨이에요') + '</span></div></div>' +
        (i.soon ? '<div class="card ptsoon">' + LZ.ic('clock') + '<span><b>' + Number(i.soon.amt).toLocaleString('ko-KR') + 'P</b>가 ' + esc(LZ.fmtYmd(i.soon.date)) + '에 사라져요' + (i.soon.left <= 30 ? ' (남은 ' + i.soon.left + '일)' : '') + '</span></div>' : '') +
        (!d.kid && S.user.kind !== 'admin' ? '<div class="box">' + LZ.ic('shield') + ' 카카오 본인 확인을 받으면 다른 분의 기록을 가져갈 때 그분께 포인트가 쌓여요. <a href="#" data-go="meAcct">확인하러 가기</a></div>' : '') +
        '<div class="flt" role="tablist">' + PTCAT.map(function (c) { return '<button type="button" role="tab" class="' + (f === c[0] ? 'on' : '') + '" aria-selected="' + (f === c[0]) + '" data-act="ptFlt" data-v="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div class="card tight ptlist">' + (rows || '<p class="muted" style="margin:8px 0">' + (f === 'all' ? '아직 내역이 없어요. 홀 기록을 적으면 바로 쌓여요.' : '이 내역이 없어요.') + '</p>') + '</div>' +
        ptRules(d.rules, i) + '</div>';
    }
  };
  LZ.act.ptFlt = function (el, v) { PTF.f = v; LZ.redraw(); };
  /* 계정·안전 */
  LZ.screens.meAcct = {
    tab: 'me',
    show: async function (p, root, alive) {
      var u = S.user;
      root.innerHTML = LZ.hdr('계정·안전', { back: true }) + '<div class="wrap">' +
        '<div class="card tight groups">' +
        grow('user', '프로필 사진', u.img ? '사진 바꾸기·지우기' : '사진 넣기', 'data-act="avatarMenu"') +
        grow('edit', '닉네임 바꾸기', '지금 ' + esc(u.nick) + (u.nickNext ? ' · ' + LZ.fmtDate(u.nickNext, true) + '부터 바꿀 수 있어요' : ' · 7일에 한 번'), 'data-go="nickChange"') +
        grow('lock', '비밀번호 바꾸기', '숫자 ' + u.pinLen + '자리 · 바꾸면 다른 휴대폰은 로그아웃', 'data-go="pinChange"') +
        (u.kind === 'admin' ? '' : grow('kakao', '카카오 본인 확인', u.kid ? '확인했어요 · 비밀번호를 잊으면 카카오로 찾아요' : '아직 안 했어요 · 눌러서 확인하기', u.kid ? 'data-act="kidInfo"' : 'data-go="kakaoAsk"')) +
        '</div>' +
        '<div class="card"><h3>치기 화면</h3><div class="tgl"><span>말해 주기<span class="muted">홀을 넘길 때마다 소리로 읽어 드려요</span></span>' + LZ.sw(LZ.store.get('lz.say') === '1', 'sayTgl') + '</div>' +
        '<button type="button" class="li" data-act="voicePick">' + LZ.ic('sound') + '<span class="t"><b>말해 주기 목소리</b><span class="muted">휴대폰에 있는 한국어 목소리 고르기 · 미리 듣기</span></span>' + LZ.ic('chev') + '</button>' +
        '<p class="hint" style="margin:8px 0 0">' + LZ.ic('lock') + ' 내 기록 공개는 이제 <b>코스마다</b> 정해요 · 스크린 공략 → 내 수첩의 자물쇠</p></div></div>';
    }
  };
  /* 도움 */
  LZ.screens.helpHub = {
    tab: 'me',
    show: function (p, root) {
      var m = S.me || {};
      root.innerHTML = LZ.hdr('도움', { back: true, noHelp: 1 }) + '<div class="wrap"><div class="card tight groups">' +
        grow('ball', '파크골프 첫걸음', '처음 오신 분께 · 규칙 · 점수 세는 법 · 매너', 'data-go="firstSteps"') +
        grow('trophy', '시상식 안내', '상 종류 · 발표 차례 · 결과 그림 보내기', 'data-go="awGuide"') +
        grow('book', '사용 안내', '권한과 기준을 한눈에', 'data-go="guide"') +
        (m.qnaOn ? grow('chat', '문의하기', '관리자에게 1:1' + (m.qna ? ' · 답변 ' + m.qna + '건' : ''), 'data-go="qnaList"') : '') +
        grow('note', '공지·소식', '관리자 공지와 클럽 소식', 'data-go="notices" data-p=\'{"manage":0}\'') +
        grow('home', '홈 화면에 추가', '앱처럼 열고 알림도 받아요', 'data-act="homeAdd"') +
        '</div></div>';
    }
  };
  /* 닉네임 바꾸기 3단계(#17): ① 새 이름 → 중복 검사 ② "홍길동 → 김영희" 확인 ③ "정말 바꿀까요?" */
  var NN = { nick: '' };
  LZ.act.nickChange = function () { LZ.go('nickChange', {}); };
  LZ.screens.nickChange = {
    tab: 'me',
    show: function (p, root) {
      var u = S.user, step = p.step || 1, steps = '<div class="steps"><span class="' + (step === 1 ? 'on' : '') + '">1 새 이름</span><span class="' + (step === 2 ? 'on' : '') + '">2 확인</span><span class="' + (step === 3 ? 'on' : '') + '">3 바꾸기</span></div>';
      if (step === 1) {
        root.innerHTML = LZ.hdr('닉네임 바꾸기', { back: true }) + '<div class="wrap">' + steps + '<div class="card"><p class="muted" style="margin:0 0 4px">지금 이름</p><b style="font-size:var(--t3)">' + esc(u.nick) + '</b>' +
          '<label class="lb" for="nn">새 이름</label><input type="text" id="nn" maxlength="8" value="' + esc(NN.nick && NN.nick !== u.nick ? NN.nick : '') + '" placeholder="한글·영문·숫자 2~8자" autocomplete="off">' +
          '<p class="hint" id="nnMsg">' + (u.nickNext ? '<span class="err">' + LZ.fmtDate(u.nickNext, true) + '부터 바꿀 수 있어요</span>' : '띄어쓰기 없이 2~8자. 확인을 누르면 쓸 수 있는 이름인지 봐요.') + '</p>' +
          '<button type="button" class="btn" data-act="nnCheck">확인</button></div></div>';
        var el = $('#nn'); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') LZ.act.nnCheck(); });
        return;
      }
      if (!NN.nick) { LZ.go('nickChange', {}, { replace: true }); return; }
      if (step === 2) {
        root.innerHTML = LZ.hdr('닉네임 바꾸기', { back: true }) + '<div class="wrap">' + steps + '<div class="card center"><div class="nnfrom">' + esc(u.nick) + ' <span>→</span> <b>' + esc(NN.nick) + '</b></div></div>' +
          '<div class="card"><h3>바꾸기 전에 확인해 주세요</h3><ul class="nnlist"><li>바꾸면 <b>' + (NN.days || 7) + '일 동안</b> 다시 못 바꿔요</li><li>예전 이름 <b>' + esc(u.nick) + '</b>은 ' + (NN.protect || 7) + '일 동안 다른 분이 못 써요</li><li>다음 로그인부터는 새 이름 <b>' + esc(NN.nick) + '</b>으로 들어와요</li><li>클럽 회원님께도 새 이름으로 보여요</li></ul></div>' +
          '<div class="row"><button type="button" class="btn g" data-act="nnBack">다시 쓰기</button><button type="button" class="btn" data-act="nnNext">다음</button></div></div>';
        return;
      }
      root.innerHTML = LZ.hdr('닉네임 바꾸기', { back: true }) + '<div class="wrap">' + steps + '<div class="card center"><h3 style="text-align:center">정말 바꿀까요?</h3><div class="nnfrom">' + esc(u.nick) + ' <span>→</span> <b>' + esc(NN.nick) + '</b></div><p class="muted">바꾼 뒤 ' + (NN.days || 7) + '일 동안은 되돌릴 수 없어요.</p>' +
        '<button type="button" class="btn red" data-act="nnDo">' + esc(NN.nick) + '(으)로 바꾸기</button><button type="button" class="btn g" data-act="nnCancel">그만두기</button></div></div>';
    }
  };
  LZ.act.nnCheck = async function () {
    var v = LZ.stripNick(($('#nn') || {}).value || ''), msg = $('#nnMsg');
    if (!v) { msg.innerHTML = '<span class="err">새 이름을 적어 주세요</span>'; return; }
    try {
      var r = await LZ.api('nickCheck', { nick: v }, { retry: 0 });
      if (r.res) { msg.innerHTML = '<span class="err">' + esc(r.res.code === 'dupnick' ? '이미 쓰는 이름이에요. 다른 이름으로 적어 주세요.' : r.res.msg) + '</span>'; if (r.res.code === 'dupnick') msg.innerHTML += '<br><span class="muted">' + esc(r.res.msg) + '</span>'; return; }
      NN = { nick: r.nick || v, days: r.days, protect: r.protect }; LZ.go('nickChange', { step: 2 }, { replace: true });
    } catch (e) { msg.innerHTML = '<span class="err">' + esc(LZ.errText(e)) + '</span>'; }
  };
  LZ.act.nnBack = function () { LZ.go('nickChange', { step: 1 }, { replace: true }); };
  LZ.act.nnNext = function () { LZ.go('nickChange', { step: 3 }, { replace: true }); };
  LZ.act.nnCancel = function () { NN = { nick: '' }; LZ.back(); };
  LZ.act.nnDo = async function () {
    LZ.busy(true, '바꾸는 중…');
    try { var r = await LZ.api('setNick', { nick: NN.nick }); S.user = r.user || S.user; await LZ.refreshMe().catch(function () {}); LZ.busy(false); LZ.toast('닉네임을 ' + NN.nick + '(으)로 바꿨어요'); NN = { nick: '' }; LZ.back(); }
    catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); LZ.go('nickChange', { step: 1 }, { replace: true }); }
  };
  LZ.act.unitTgl = async function (el) { var nu = S.unit === 'm' ? 'p' : 'm'; S.unit = nu; S.user.unit = nu; LZ.flip(el); try { await LZ.api('useBranch', { br: S.br, unit: nu }); } catch (e) { /* 다음에 */ } };
  LZ.act.avatarMenu = function () {
    LZ.sheet('<h2>프로필 사진</h2><p class="muted">정사각형으로 잘라 작게 저장돼요(256px). 클럽 회원님과 점수판에 보여요.</p><label class="btn" style="display:flex;align-items:center;justify-content:center;cursor:pointer"><input type="file" id="avFile" accept="image/*" hidden>사진 고르기</label><label class="btn o" style="display:flex;align-items:center;justify-content:center;cursor:pointer"><input type="file" id="avCam" accept="image/*" capture="user" hidden>지금 찍기</label>' + (S.user.img ? '<button type="button" class="btn g" data-act="avatarDel">사진 지우기</button>' : ''));
    ['#avFile', '#avCam'].forEach(function (id) { var f = $(id); if (f) f.addEventListener('change', function () { if (f.files[0]) avatarUpload(f.files[0]); }); });
  };
  async function avatarUpload(file) {
    LZ.busy(true, '사진을 줄이는 중…');
    try { var data = await LZ.shrinkSquare(file, 256, 0.8); var r = await LZ.api('avatarPut', { data: data }); S.user = r.user; LZ.busy(false); LZ.closeSheet(); LZ.toast('프로필 사진을 바꿨어요'); LZ.redraw(); }
    catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e) || '사진을 올리지 못했어요', 4500); }
  }
  LZ.act.avatarDel = async function () { try { var r = await LZ.api('avatarDel', {}); S.user = r.user; LZ.closeSheet(); LZ.toast('지웠어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.shrinkSquare = function (file, size, q) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { var w = img.width, h = img.height, m = Math.min(w, h), sx = (w - m) / 2, sy = (h - m) / 2, cv = document.createElement('canvas'); cv.width = size; cv.height = size; cv.getContext('2d').drawImage(img, sx, sy, m, m, 0, 0, size, size); URL.revokeObjectURL(url); var out = cv.toDataURL('image/webp', q); if (out.indexOf('data:image/webp') !== 0) out = cv.toDataURL('image/jpeg', q); resolve(out); };
      img.onerror = function () { reject(new Error('사진을 읽지 못했어요')); }; img.src = url;
    });
  };
  LZ.act.kidInfo = function () { LZ.dialog({ title: '카카오 본인 확인을 마쳤어요', body: '카카오 계정 하나에 회원 한 분이에요. 비밀번호를 잊으면 로그인 화면의 "비밀번호를 잊었어요"에서 카카오로 확인하고 새로 정해요.' }); };
  LZ.act.verRefresh = async function () { if (!(await LZ.confirm('최신 버전으로 새로 고칠까요?', '저장해 둔 앱 껍데기를 지우고 다시 받아요. 로그인은 그대로예요.', '새로 고침'))) return; LZ.pwa.hardRefresh(); };
  LZ.act.homeAdd = function () { if (LZ.pwa && LZ.pwa.guide) LZ.pwa.guide(); else LZ.toast('브라우저 메뉴에서 "홈 화면에 추가"를 눌러 주세요', 5000); };

  /* 비밀번호 바꾸기 */
  LZ.screens.pinChange = {
    tab: 'me',
    show: function (p, root) {
      var len = S.user.pinLen || 4;
      root.innerHTML = LZ.hdr('비밀번호 바꾸기', { back: true }) + '<div class="wrap"><div class="card"><p class="muted" style="margin-top:0">숫자 ' + len + '자리. 같은 숫자 반복이나 1234 같은 연속 번호는 쓸 수 없어요. 바꾸면 다른 휴대폰은 로그아웃돼요.</p><label class="lb">새 비밀번호</label><input type="password" id="np1" inputmode="numeric" maxlength="' + len + '" autocomplete="new-password"><label class="lb">한 번 더</label><input type="password" id="np2" inputmode="numeric" maxlength="' + len + '" autocomplete="new-password"><button type="button" class="btn" data-act="pinChangeOk">바꾸기</button></div></div>';
      setTimeout(function () { var e = $('#np1'); if (e) e.focus(); }, 100);
    }
  };
  LZ.act.pinChangeOk = async function () { var a = $('#np1').value, b = $('#np2').value; if (a !== b) { LZ.toast('두 번 넣은 번호가 달라요'); return; } try { var r = await LZ.api('pin', { pin: a }); S.user = r.user; LZ.toast('비밀번호를 바꿨어요', 3000); LZ.back(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };

  /* 결제(v7.2): 자리 추가 · 자리 연장 · 클럽 추가 — 적립 포인트(10P 단위)와 송금을 섞어 내기, 송금은 관리자 확인 뒤 자리가 생김 */
  var PAY = { d: null, p: null };
  LZ.screens.pay = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('결제', { back: true }) + LZ.skeleton(4);
      p = p || {}; if (!p.plan) p.plan = 'seat';
      var body = { plan: p.plan }; ['mid', 'pack', 'name', 'area', 'meet', 'color', 'pub', 'n', 'all'].forEach(function (k) { if (p[k] !== undefined) body[k] = p[k]; });
      if (p.plan === 'seat' && !body.mid) { var st = (S.me && S.me.moims || []).filter(function (m) { return m.role === 'cap' || m.role === 'mgr'; })[0]; if (st) body.mid = st.id; }
      if (p.plan === 'seat') body.n = 1;                                                     // 수량은 화면에서 바꾸고, 신청할 때 n 으로 보내요
      var d = await LZ.api('payInfo', body); if (!alive()) return; PAY.d = d; PAY.p = body;
      var sc = d.seat, q = d.quote, pend = d.pending, title = p.plan === 'renew' ? '자리 연장' : p.plan === 'clubadd' ? '클럽 추가' : '자리 추가', html = '';
      var per = sc.seat_days % 365 === 0 ? sc.seat_days / 365 + '년' : sc.seat_days + '일';
      if (pend) html = '<div class="card pendc"><h3>' + LZ.ic('bell') + ' 결제 ' + esc(pend.stName) + '</h3><p style="margin:0"><b>' + esc(pend.planName) + '</b> · 보낼 금액 ' + won(pend.cash) + (pend.pts ? ' · 포인트 ' + pt(pend.pts) : '') + '</p><p class="muted">' + (pend.method === 'bank' ? '계좌이체' : '카카오페이') + ' · 보낸 분 <b>' + esc(pend.depLabel || pend.depositor) + '</b><br>관리자가 확인하면 바로 자리가 생기고 알림이 와요. 보통 하루 안에 확인해요.</p><button type="button" class="btn g sm" data-act="payCancel">요청 취소</button><p class="hint">새로 결제하려면 이 요청을 먼저 취소해 주세요.</p></div>';
      else {
        var cl = p.plan === 'seat' ? d.clubs.filter(function (c) { return c.id === body.mid; })[0] : null;
        if (p.plan === 'seat') {
          html += '<div class="card"><span class="su">자리를 더할 클럽</span>' + (d.clubs.length > 1 ? '<select id="payClub" class="in" style="margin-top:4px">' + d.clubs.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === body.mid ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' : '<div><b class="big1">' + esc(cl ? cl.name : '') + '</b></div>') +
            (cl ? '<div class="su" style="margin-top:6px">회원 ' + cl.n + '명 · 지금 ' + cl.seats + '자리 · 한 클럽 ' + sc.seat_max + '자리까지</div>' : '') + '</div>';
        } else if (p.plan === 'renew' && q) {
          html += '<div class="card"><span class="su">연장할 자리</span><div><b class="big1">' + esc(q.label) + '</b></div><div class="su" style="margin-top:6px">지금 ' + LZ.fmtYmd(q.before) + '까지 → <b class="acc1">' + LZ.fmtYmd(q.end) + '까지</b> (끝나는 날부터)</div>' +
            (q.mates > 0 || body.all ? '<label class="ckl allr"><input type="checkbox" id="renewAll"' + (body.all ? ' checked' : '') + '><span>같은 날(' + LZ.fmtYmd(q.before) + ') 끝나는 자리 ' + (body.all ? q.packs : q.mates + 1) + '묶음을 <b>한꺼번에</b> 연장해요</span></label>' : '') + '</div>';
        } else if (p.plan === 'clubadd') html += '<div class="card"><span class="su">새 클럽</span><div><b class="big1">' + esc(p.name || '') + '</b>' + (p.area ? ' <span class="su">' + esc(p.area) + '</span>' : '') + '</div><div class="su" style="margin-top:6px">무료 ' + sc.free_seats + '자리 + 유료 ' + sc.seat_size + '자리 1장을 함께 받아요. 유료 자리는 내가 캡틴·매니저인 다른 클럽으로 옮길 수도 있어요.</div></div>';
        if (d.quoteErr || !q) html += '<div class="box warn">' + esc(d.quoteErr || '살 것을 골라 주세요.') + '</div>' + (p.plan === 'clubadd' ? '<button type="button" class="btn o" data-go="make">클럽 정보 다시 쓰기</button>' : '');
        else {
          /* v7.0.5: ① 추가할 자리(묶음 수) → ② 적립 포인트 쓰기(체크) → 낼 돈 계산 → 1단계 먼저 보내기 → 2단계 보냈으면 신청 */
          PAY.n = 1; PAY.maxN = p.plan === 'seat' ? Math.max(1, q.maxN || 1) : 1; PAY.unitPrice = p.plan === 'seat' ? (q.unitPrice || sc.seat_price) : q.amount; PAY.ptOn = false;
          if (p.plan === 'seat') html += '<div class="card qtyc"><h3>' + LZ.ic('seat') + ' 추가할 자리</h3>' +
            '<div class="qty"><button type="button" class="qb" data-act="qtyStep" data-v="-1" id="qMinus" aria-label="' + sc.seat_size + '자리 줄이기">−' + sc.seat_size + '</button><div class="qv" aria-live="polite"><b id="qSeats">' + sc.seat_size + '자리</b></div><button type="button" class="qb" data-act="qtyStep" data-v="1" id="qPlus" aria-label="' + sc.seat_size + '자리 늘리기">+' + sc.seat_size + '</button><button type="button" class="qb qmax" data-act="qtyStep" data-v="max" id="qMax" aria-label="최대로">최대</button></div>' +
            '<div class="qprice"><span id="qLine">' + sc.seat_size + '자리 · ' + per + '</span> = <b id="qAmt">' + won(PAY.unitPrice) + '</b></div>' +
            '<div class="su qafter">지금 ' + q.before + '자리 → <b class="acc1" id="qAfter">' + q.after + '자리</b></div>' +
            '<div class="su">' + sc.seat_size + '자리에 ' + won(PAY.unitPrice) + ' · 기간 ' + dd(q.start) + ' ~ ' + dd(q.end) + '</div>' +
            '<p class="hint qwhy" id="qWhy" aria-live="polite"></p></div>';
          else html += '<div class="card payg"><div class="pr"><span>' + esc(title) + ' · ' + per + '</span><b>' + won(q.amount) + '</b></div><div class="su">기간 ' + dd(q.start) + ' ~ ' + dd(q.end) + '</div></div>';
          var unit = d.points.unit, usable = d.points.usable || 0;
          if (usable >= unit) html += '<div class="card ptc" id="ptCard"><label class="ckl ptck"><input type="checkbox" id="usePt"><span><b>적립 포인트 쓰기</b><span class="su">가진 포인트 <b>' + pt(d.points.bal) + '</b>' + (usable < d.points.bal ? ' (지금 쓸 수 있는 ' + pt(usable) + ')' : '') + ' · ' + unit + 'P 단위로 빼 드려요</span></span></label>' + (d.points.soon ? '<p class="su" style="margin:6px 0 0">' + dd(d.points.soon.date) + '에 ' + pt(d.points.soon.amt) + ' 사라져요</p>' : '') + '</div>';
          else if (d.points.bal > 0) html += '<div class="box ptnone" id="ptNoneBox">' + LZ.ic('star') + '<span>가진 포인트 ' + pt(d.points.bal) + ' · 적립 포인트는 ' + unit + 'P부터 쓸 수 있어요</span></div>';
          html += '<div class="card payg calc"><h3>' + LZ.ic('coin') + ' 낼 돈 계산</h3>' +
            '<div class="pr"><span>' + (p.plan === 'seat' ? '자리 값' : esc(title)) + '</span><b id="cAmt">' + won(q.amount) + '</b></div>' +
            '<div class="pr" id="cPtRow" hidden><span>− 적립 포인트</span><b class="ptuse" id="cPt">0P</b></div>' +
            '<div class="pr tot"><span>= 보낼 돈</span><b class="big2" id="cashV">' + won(q.amount) + '</b></div>' +
            '<p class="earnl" id="earnV"></p></div>' +
            '<div class="su paynote">· ' + (u0().tier === 'red' || u0().tier === 'gold' ? '자리는 묶음마다 기간이 따로 흘러요' : '처음 사면 <b>레드</b> 회원이 돼요') + '<br>· ' + sc.refund_days + '일 안, 아직 안 쓴 자리는 전액 환불돼요' + (p.plan === 'seat' ? '(한 번에 산 자리는 한꺼번에)' : '') + '</div>';
          var hasK = !!d.qr.red, hasB = !!d.bank.no;
          html += '<div id="cashBox">' +
              '<div class="card pstep"><h3><span class="stn">1단계</span>먼저 돈을 보내 주세요</h3>' +
                '<div class="sendamt"><div><span class="su">보낼 돈</span><b class="big2" id="cashV2">' + won(q.amount) + '</b></div><button type="button" class="sm2 g" data-act="copy" id="amtCopy" data-v="' + q.amount + '">금액 복사</button></div>' +
                (hasK ? '<a class="btn kakao kbtn" id="qrBtn" href="' + esc(d.qr.red) + '" target="_blank" rel="noopener">' + LZ.ic('kakao') + '카카오페이로 보내기</a>' : '') +
                (hasB ? '<p class="muted" style="margin:10px 0 6px">' + (hasK ? '또는 ' : '') + '계좌로 보내요</p><div class="box acct"><div class="t"><b>' + esc(d.bank.name) + '</b><b class="nw acno">' + esc(d.bank.no) + '</b><span class="su">받는 분 ' + esc(d.bank.holder) + '</span></div><button type="button" class="sm2 g" data-act="copy" data-v="' + esc(d.bank.no) + '">계좌 복사</button></div>' : '') +
                (!hasK && !hasB ? '<div class="box warn">보낼 곳이 아직 없어요. 관리자에게 문의해 주세요.</div>' : '') +
                '<p class="sendwarn">' + LZ.ic('bell') + '<span>돈을 <b>먼저 보내야</b> 해요. 보내지 않고 신청하면 자리가 생기지 않고 반려돼요.</span></p></div>' +
              '<div class="card pstep"><h3><span class="stn">2단계</span>보냈으면 신청해 주세요</h3>' +
                (hasK && hasB ? '<label class="lb">어떻게 보내셨어요?</label>' + LZ.seg([['kakao', '카카오페이'], ['bank', '계좌']], 'kakao', 'payMethod') : '') + '<input type="hidden" id="pm" value="' + (hasK ? 'kakao' : 'bank') + '">' +
                '<label class="lb" for="dep">보낸 분 이름<span class="su lbsub">통장·카카오페이에 찍히는 이름</span></label><input type="text" id="dep" maxlength="10" placeholder="예: 김영희" autocomplete="off">' +
                '<label class="ckl sentl"><input type="checkbox" id="sentCk"><span>위 금액 <b id="cashV3">' + won(q.amount) + '</b>을 보냈어요</span></label></div>' +
            '</div>' +
            '<button type="button" class="btn paygo" data-act="payReq" id="payGo">' + payBtnTxt(q.amount) + '</button><p class="hint paywhy" id="payWhy" aria-live="polite"></p>';
        }
      }
      root.innerHTML = LZ.hdr(title, { back: true }) + '<div class="wrap">' + html + '</div>';
      var sel = $('#payClub'); if (sel) sel.addEventListener('change', function () { LZ.go('pay', { plan: 'seat', mid: sel.value }, { replace: true }); });
      var ra = $('#renewAll'); if (ra) ra.addEventListener('change', function () { var np = {}; for (var k in p) np[k] = p[k]; if (ra.checked) np.all = 1; else delete np.all; LZ.go('pay', np, { replace: true }); });
      var dep = $('#dep'), sck = $('#sentCk'), upk = $('#usePt'); if (dep) dep.addEventListener('input', payCalc); if (sck) sck.addEventListener('change', payCalc); if (upk) upk.addEventListener('change', function () { PAY.ptOn = upk.checked; payCalc(); });
      if (PAY.d && PAY.d.quote && $('#payGo')) payCalc();
    }
  };
  function u0() { return S.user || {}; }
  function payBtnTxt(cash) { return cash > 0 ? '보냈어요 · 신청하기' : '포인트로 바로 내기'; }
  /** 지금 고른 수량의 금액(자리 추가는 묶음 수 × 묶음 금액, 나머지는 견적 그대로) */
  function payAmt() { var d = PAY.d, q = d && d.quote; if (!q) return 0; return PAY.p.plan === 'seat' ? PAY.n * PAY.unitPrice : q.amount; }
  /** 쓸 포인트: 체크하면 낼 돈 안에서 단위(10P)로 쓸 수 있는 만큼 모두 */
  function payPts() { var d = PAY.d; if (!d || !d.quote || !PAY.ptOn) return 0; var unit = d.points.unit, amt = payAmt(); return Math.max(0, Math.min(Math.floor((d.points.usable || 0) / unit) * unit, Math.floor(amt / unit) * unit)); }
  function payEarn(cash) { return Math.floor(cash * PAY.d.seat.earn_pct / 100); }
  function payCalc() {
    var d = PAY.d, sc = d.seat, q = d.quote, amt = payAmt(), use = payPts(), cash = amt - use, set = function (id, t) { var e = $('#' + id); if (e) e.textContent = t; };
    if (PAY.p.plan === 'seat') {
      var seats = PAY.n * sc.seat_size, per = sc.seat_days % 365 === 0 ? sc.seat_days / 365 + '년' : sc.seat_days + '일';
      set('qSeats', seats + '자리'); set('qLine', seats + '자리 · ' + per); set('qAmt', won(amt)); set('qAfter', (q.before + seats) + '자리');
      var mi = $('#qMinus'), pl = $('#qPlus'), mx = $('#qMax'); if (mi) mi.disabled = PAY.n <= 1; if (pl) pl.disabled = PAY.n >= PAY.maxN; if (mx) mx.disabled = PAY.n >= PAY.maxN;
      set('qWhy', PAY.n >= PAY.maxN ? '최대예요. 한 클럽은 ' + sc.seat_max + '자리까지라 지금 ' + q.before + '자리에서 ' + (PAY.maxN * sc.seat_size) + '자리까지 더할 수 있어요.' + (PAY.maxN <= 1 ? ' 더 필요하면 관리자에게 문의해 주세요.' : '') : '');
    }
    set('cAmt', won(amt)); set('cPt', pt(use)); set('cashV', won(cash)); set('cashV2', won(cash)); set('cashV3', won(cash));
    var cr = $('#cPtRow'); if (cr) cr.hidden = use <= 0;
    set('earnV', cash > 0 ? '보낸 돈의 ' + sc.earn_pct + '%인 ' + pt(payEarn(cash)) + '가 적립돼요 (관리자 확인 후)' : '포인트로 다 내요. 보내는 돈이 없어서 적립은 없어요.');
    var ac = $('#amtCopy'); if (ac) ac.dataset.v = String(cash);
    var cb = $('#cashBox'); if (cb) cb.hidden = cash <= 0;
    var go = $('#payGo'), pw = $('#payWhy'), dep = $('#dep'), sck = $('#sentCk'), miss = [];
    if (cash > 0) { if (!dep || !dep.value.trim()) miss.push('보낸 분 이름 적기'); if (!sck || !sck.checked) miss.push('"위 금액을 보냈어요"에 표시'); }
    if (go) { go.textContent = payBtnTxt(cash); go.disabled = miss.length > 0; }
    if (pw) { pw.textContent = miss.length ? '신청하려면: ' + miss.join(' · ') : ''; pw.hidden = !miss.length; }
  }
  LZ.act.qtyStep = function (el, v) { if (!PAY.d || !PAY.d.quote) return; PAY.n = v === 'max' ? PAY.maxN : Math.max(1, Math.min(PAY.maxN, PAY.n + (+v || 0))); payCalc(); };
  LZ.act.payMethod = function (el, v) { $('#pm').value = v; $$('[data-act="payMethod"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.payReq = async function () {
    var body = {}, b0 = PAY.p; for (var k in b0) body[k] = b0[k]; body.pts = payPts(); if (b0.plan === 'seat') body.n = PAY.n;
    var q = PAY.d.quote, amt = payAmt(), cash = amt - body.pts, what = b0.plan === 'seat' ? (PAY.n * PAY.d.seat.seat_size) + '자리 추가' : q.label;
    if (cash > 0) {
      body.method = $('#pm').value; body.depositor = ($('#dep').value || '').trim(); body.sent = $('#sentCk').checked ? 1 : 0;
      if (!body.sent) { LZ.toast('먼저 ' + won(cash) + '을 보내고 "위 금액을 보냈어요"에 표시해 주세요', 4500); return; }
      if (!body.depositor) { LZ.toast('보낸 분 이름을 적어 주세요', 3500); $('#dep').focus(); return; }
    } else if (!(await LZ.confirm('포인트 ' + pt(body.pts) + '로 낼까요?', what + ' · 돈을 보내지 않아도 바로 생겨요', '포인트로 내기'))) return;
    var go = $('#payGo'); if (go) go.disabled = true;
    try { var r = await LZ.api('payReq', body); await LZ.refreshMe(); if (r.done) { LZ.toast(r.pay.planName + ' · 바로 생겼어요', 4000); LZ.go(r.pay.mid ? 'club' : 'meTier', r.pay.mid ? { id: r.pay.mid } : {}, { replace: true }); } else { LZ.toast('신청했어요. 관리자가 입금을 확인하면 알림이 와요', 4500); LZ.go('meTier', {}, { replace: true }); } }
    catch (e) { if (go) go.disabled = false; LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.payCancel = async function () { if (!(await LZ.confirm('결제 요청을 취소할까요?', '이미 돈을 보냈다면 취소하지 말고 기다려 주세요. 쓴 포인트는 되돌려 드려요.', '요청 취소', 'r'))) return; try { await LZ.api('payCancel', {}); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  /* 환불(v7.2): 확인된 지 14일 안 + 그 자리를 한 자리도 안 쓰면 전액. 포인트만 썼으면 바로 */
  LZ.screens.refund = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('환불', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('refundInfo', {}); if (!alive()) return; var st = d.state || {}, list = d.list || [], sel = list.filter(function (x) { return x.id === p.pid && x.can; })[0];
      root.innerHTML = LZ.hdr('환불', { back: true }) + '<div class="wrap">' +
        (st.req ? '<div class="card pendc"><h3>' + LZ.ic('back') + ' 환불 ' + esc(st.req.stName) + '</h3><p style="margin:0">' + esc(st.req.planName) + ' · ' + won(st.req.amount) + '<br>' + esc(st.req.bank) + ' ' + esc(st.req.acct) + '</p><p class="muted">' + esc(st.req.why) + '<br>관리자가 보내면 "환불됨"으로 바뀌고 알림이 와요.</p><button type="button" class="btn g sm" data-act="refundCancel">신청 취소</button></div>' :
          st.recent ? '<div class="card"><h3>환불 ' + esc(st.recent.stName) + '</h3><p style="margin:0">' + esc(st.recent.planName) + ' · ' + won(st.recent.amount) + (st.recent.note ? '<br>' + esc(st.recent.note) : '') + '</p></div>' : '') +
        '<div class="card"><p class="muted" style="margin:0">확인된 지 <b>' + d.days + '일 안</b>이고 그 자리를 <b>한 자리도 안 쓰고 있으면</b> 전액 환불돼요(일할 환불은 없어요). 쓴 포인트는 되돌리고, 그 결제로 받은 적립은 회수해요. 환불하면 그 자리는 바로 없어져요.</p></div>' +
        (st.req ? '' : list.length ? '<div class="card tight"><h3 class="ih">최근 결제</h3>' + list.map(function (x) { return '<div class="li"><div class="t"><b>' + esc(x.planName) + '</b><span class="su">' + won(x.cash) + (x.pts ? ' + 포인트 ' + pt(x.pts) : '') + ' · 확인 ' + LZ.fmtDate(x.decided) + (x.can ? ' · ' + LZ.fmtYmd(x.until) + '까지 환불 가능' : '') + '</span>' + (x.can ? '<div class="pkb"><button type="button" class="sm2 ' + (sel && sel.id === x.id ? '' : 'g') + '" data-act="refundPick" data-v="' + esc(x.id) + '">' + (sel && sel.id === x.id ? '고름' : '환불 신청') + '</button></div>' : '<span class="su warnt">' + esc(x.why) + '</span>') + '</div></div>'; }).join('') + '</div>' : '<div class="card"><p style="margin:0">환불할 수 있는 결제가 없어요.</p></div>') +
        (sel && !st.req ? '<div class="card"><h3>' + esc(sel.planName) + '</h3><div class="box"><b>환불 ' + won(sel.cash) + '</b>' + (sel.pts ? '<div class="muted">포인트 ' + pt(sel.pts) + '는 되돌려요</div>' : '') + '</div>' +
          (sel.cash > 0 ? '<label class="lb">은행</label><input type="text" id="rb" maxlength="20" placeholder="예: 카카오뱅크"><label class="lb">계좌번호</label><input type="tel" id="ra" maxlength="30"><label class="lb">예금주</label><input type="text" id="rh" maxlength="20"><label class="lb">사유(선택)</label><input type="text" id="rr" maxlength="100">' : '<p class="muted">포인트로만 냈으니 바로 환불돼요.</p>') +
          '<label class="tgl"><span>환불하면 그 자리가 바로 없어지는 것을 확인했어요</span><input type="checkbox" id="rag"></label><button type="button" class="btn" data-act="refundReq" data-v="' + esc(sel.id) + '">' + (sel.cash > 0 ? '환불 신청' : '바로 환불') + '</button></div>' : '') + '</div>';
    }
  };
  LZ.act.refundPick = function (el, id) { LZ.go('refund', { pid: id }, { replace: true }); };
  LZ.act.refundReq = async function (el, pid) { var v = function (id) { var e = $('#' + id); return e ? e.value : ''; }; try { var r = await LZ.api('refundReq', { pid: pid, bank: v('rb'), acct: v('ra'), holder: v('rh'), reason: v('rr'), agree: $('#rag').checked ? 1 : 0 }); LZ.toast(r.done ? '환불됐어요' + (r.back ? ' · 포인트 ' + pt(r.back) + ' 되돌림' : '') : '환불을 신청했어요. 관리자가 보내면 알림이 와요', 4500); await LZ.refreshMe(); LZ.go('refund', {}, { replace: true }); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.refundCancel = async function () { if (!(await LZ.confirm('환불 신청을 취소할까요?', '', '취소하기', 'r'))) return; try { await LZ.api('refundCancel', {}); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };


  /* 알림 설정 */
  var NK = { pay: '결제 신청', refund: '환불 신청', qna: '문의', pw: '비밀번호 찾기 신청', mreq: '클럽 가입 신청', club: '클럽 소식', course: '코스 정보 변경', round: '라운드', join: '새 회원', fb: '회원 의견', payok: '결제 승인', digest: '주간 점검·월간 요약' };
  LZ.screens.notiCfg = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('알림 설정', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('notiCfg', {}); if (!alive()) return; NC = d; var c = d.cfg, isCap = S.user.kind === 'admin' || (S.me.moims || []).some(function (x) { return x.role === 'cap' || x.role === 'mgr'; });
      var perm = ('Notification' in window) ? Notification.permission : 'none', canPush = 'serviceWorker' in navigator && 'PushManager' in window && !!d.vapid;
      root.innerHTML = LZ.hdr('알림 설정', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>' + LZ.ic('bell') + ' 앱 푸시</h3><p class="muted" style="margin:0 0 6px">' + (canPush ? (perm === 'denied' ? '휴대폰 설정에서 이 앱의 알림이 꺼져 있어요. 설정 → 알림에서 켜 주세요.' : LZ.pwa && LZ.pwa.isIOS && !LZ.pwa.standalone() ? '아이폰은 "홈 화면에 추가"한 뒤에 알림을 받을 수 있어요.' : '앱을 닫아도 알림이 와요. 휴대폰 ' + d.pushN + '대에 켜져 있어요.') : '이 브라우저는 푸시를 지원하지 않거나 서버 준비가 안 됐어요.') + '</p><div class="tgl"><span>이 휴대폰에서 푸시 받기</span>' + LZ.sw(c.push && d.pushN, 'pushTgl', '', !canPush || perm === 'denied') + '</div></div>' +
        (isCap ? '<div class="card"><h3>' + LZ.ic('kakao') + ' 카카오톡으로 받기</h3><p class="muted" style="margin:0 0 6px">' + (d.kakaoKey ? '카카오 "나에게 보내기"로 같은 알림을 카톡으로도 받아요. 앱을 안 열어도 돼요.' : '관리자가 카카오 앱 키를 넣으면 쓸 수 있어요.') + '</p>' + (d.kakaoLinked ? '<div class="tgl"><span>카카오톡으로도 받기<span class="muted">' + LZ.fmtDate(d.kakaoAt) + ' 연결됨</span></span>' + LZ.sw(c.kakao, 'kakaoTgl') + '</div><button type="button" class="btn g sm" data-act="kakaoUnlink">연결 끊기</button>' : (d.kakaoKey ? '<button type="button" class="btn kakao" data-act="kakaoLinkGo">카카오 연결하기</button>' : '')) + '</div>' : '') +
        '<div class="card"><h3>받을 알림</h3>' + d.kinds.map(function (k) { return '<div class="tgl"><span>' + esc(NK[k] || k) + '</span>' + LZ.sw(c.kinds[k] !== 0, 'kindTgl', k) + '</div>'; }).join('') + '</div>' +
        '<div class="card"><div class="tgl"><span>조용한 시간<span class="muted">밤 10시~아침 7시 알림은 아침 7시에 모아서 보내요</span></span>' + LZ.sw(c.quiet, 'quietTgl') + '</div></div>' +
        '<p class="hint">앱 안 알림함(상단 종)에는 설정과 상관없이 모두 남아요.</p></div>';
    }
  };
  var NC = null;
  async function setCfg(set) { try { var r = await LZ.api('notiCfg', { set: set }); NC = r; LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } }
  LZ.act.kindTgl = function (el, k) { var o = {}; o[k] = NC.cfg.kinds[k] === 0 ? 1 : 0; setCfg({ kinds: o }); };
  LZ.act.quietTgl = function () { setCfg({ quiet: NC.cfg.quiet ? 0 : 1 }); };
  LZ.act.kakaoTgl = function () { setCfg({ kakao: NC.cfg.kakao ? 0 : 1 }); };
  LZ.act.pushTgl = async function () {
    if (NC.cfg.push && NC.pushN) { try { var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); await LZ.api('pushSub', { off: 1, sub: sub ? sub.toJSON() : null }); } catch (e) { /* 무시 */ } setCfg({ push: 0 }); return; }
    try {
      var perm = await Notification.requestPermission(); if (perm !== 'granted') { LZ.toast('알림을 허용하지 않았어요'); return; }
      var reg2 = await navigator.serviceWorker.ready, sub2 = await reg2.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(NC.vapid) });
      await LZ.api('pushSub', { sub: sub2.toJSON(), dev: LZ.devId().slice(0, 16) }); await setCfg({ push: 1 }); LZ.toast('이 휴대폰에서 푸시를 받아요', 3000);
    } catch (e) { LZ.toast('푸시를 켜지 못했어요. ' + (LZ.pwa && LZ.pwa.isIOS ? '홈 화면에 추가한 뒤 다시 해 주세요.' : LZ.errText(e)), 5000); }
  };
  function b64ToU8(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = (s + p).replace(/-/g, '+').replace(/_/g, '/'), raw = atob(b), out = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out; }
  /* 푸시 구독이 바뀌었는지(브라우저가 갱신) 확인: 로그인 뒤 한 번 */
  LZ.pushCheck = async function () { try { if (!('serviceWorker' in navigator) || !('PushManager' in window)) return; var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub && store.get('lz.pushEp') !== sub.endpoint) { await LZ.api('pushSub', { sub: sub.toJSON(), dev: LZ.devId().slice(0, 16) }); store.set('lz.pushEp', sub.endpoint); } } catch (e) { /* 무시 */ } };
  /* 카카오 연결(OAuth): 카카오 로그인 페이지로 갔다가 ?code= 로 돌아오면 서버가 토큰으로 바꿔 저장 */
  LZ.act.kakaoLinkGo = function () { store.set('lz.kakaoBack', '1'); location.href = 'https://kauth.kakao.com/oauth/authorize?client_id=' + encodeURIComponent(NC.kakaoKey) + '&redirect_uri=' + encodeURIComponent(LZ.APP_URL) + '&response_type=code&scope=talk_message'; };
  LZ.kakaoReturn = async function (code) { try { LZ.busy(true, '카카오를 연결하는 중…'); await LZ.api('kakaoLink', { code: code, redirect: LZ.APP_URL }); await new Promise(function (r) { setTimeout(r, 2500); }); LZ.busy(false); LZ.toast('카카오톡 연결을 요청했어요. 잠시 뒤 알림 설정에서 확인해 주세요', 5000); LZ.go('notiCfg'); } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.kakaoUnlink = async function () { if (!(await LZ.confirm('카카오 연결을 끊을까요?', '', '끊기', 'r'))) return; try { await LZ.api('kakaoUnlink', {}); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
})();
