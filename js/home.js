/* 홈 · 클럽(가입 신청·캡틴 관리·챌린지·QR) · 클럽 찾기/만들기 · 알림함 · 사용 안내 · 공지 · 문의 · 의견 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  function colorStyle(m, i) { return m.color ? 'style="background:linear-gradient(135deg,' + m.color + ',#14532D)"' : (i % 2 ? 'class="club b"' : ''); }
  function clubCard(m, i) {
    var me = S.user, cls = 'club' + (m.color ? '' : (i % 2 ? ' b' : ''));
    return '<button type="button" class="' + cls + '" ' + (m.color ? 'style="background:linear-gradient(135deg,' + esc(m.color) + ',#14532D)"' : '') + ' data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'>' +
      '<div style="display:flex;align-items:center;gap:6px"><h3 style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m.name) + '</h3>' + (m.official ? '<span class="chip off">공식</span>' : '') + (m.role === 'cap' ? '<span class="chip cap">내가 캡틴</span>' : '') + '</div>' +
      '<div class="m">캡틴 ' + esc(m.captainNick) + '님 · 회원 ' + m.members + '명' + (m.area ? ' · ' + esc(m.area) : '') + (m.live ? ' · <b>지금 기록 중 ' + m.live + '명</b>' : '') + '</div>' +
      (m.meet ? '<div class="news">📅 이번 주 모임 · ' + esc(m.meet) + '</div>' : '') + (m.news ? '<div class="news">📢 ' + esc(m.news) + '</div>' : '') +
      (m.chal ? '<div class="news">🏁 ' + esc(m.chal.name) + ' ' + m.chal.goal + '홀 · ' + m.chal.done + '/' + m.chal.members + '명 달성 · 나 ' + m.chal.mine + '/' + m.chal.goal + '</div>' : '') +
      '<span class="go' + (i ? '' : ' y') + '" data-act="openClubCourses" data-v="' + esc(m.id) + '">스크린 공략 열기</span></button>';
  }
  LZ.screens.home = {
    tab: 'home',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('파크골프 공략수첩') + LZ.skeleton(5); await LZ.refreshMe(); if (!alive()) return; }
      var me = S.user, m = S.me, moims = m.moims || [], left = me.left;
      var exp = me.st === 'expired' ? '<button type="button" class="cont red" data-go="pay"><span style="font-size:24px">⏳</span><div style="flex:1"><b>이용 기간이 끝났어요</b><span class="muted">내 기록 보기는 돼요 · 결제하면 바로 이어서 써요</span></div><span>›</span></button>'
        : (left !== null && left <= 7 && me.kind !== 'hon' ? '<button type="button" class="cont" data-go="pay"><span style="font-size:24px">⏳</span><div style="flex:1"><b>' + (left === 0 ? '오늘까지' : left + '일 뒤에') + ' 이용이 끝나요</b><span class="muted">정회원 월 1,000원 · 연 6,000원</span></div><span>›</span></button>' : '');
      root.innerHTML = LZ.hdr('파크골프 공략수첩') + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap">' +
        '<div class="hello"><div class="av">' + esc(me.nick.charAt(0)) + '</div><div><b style="font-size:calc(var(--fs) + 2px)">' + esc(me.nick) + '님</b> ' + (me.kind === 'hon' ? '<span class="chip hon">명예회원</span>' : me.kind === 'admin' ? '<span class="chip cap">관리자</span>' : me.kind === 'trial' ? '<span class="chip">체험 ' + (left === null ? '' : left + '일 남음') + '</span>' : '') + '<div class="muted">오늘도 좋은 샷 하세요</div></div></div>' + exp +
        (m.last ? '<button type="button" class="cont" data-act="resume"><span style="font-size:28px">▶</span><div style="flex:1"><b>이어서 기록하기</b><span class="muted">' + esc(m.last.name) + ' · ' + (m.last.hole + 1) + '홀부터 · ' + esc(m.last.store) + '</span></div><span style="font-size:22px;color:#92400E">›</span></button>' : '') +
        (m.round ? '<button type="button" class="cont" data-go="round" data-p=\'' + esc(JSON.stringify({ id: m.round.id })) + '\'><span style="font-size:28px">⛳</span><div style="flex:1"><b>진행 중인 라운드 ' + esc(m.round.code) + '</b><span class="muted">' + esc(m.round.fname) + '</span></div><span>›</span></button>' : '') +
        (m.reqs ? '<button type="button" class="cont" data-act="homeReqs"><span style="font-size:24px">✋</span><div style="flex:1"><b>가입 신청 ' + m.reqs + '건이 기다려요</b><span class="muted">캡틴 관리에서 함께하기 / 다음에</span></div><span>›</span></button>' : '') +
        moims.map(clubCard).join('') +
        '<button type="button" class="club me" data-act="openClubCourses" data-v="_me"><h3>내 기록장</h3><div class="m">클럽 없이 혼자 남기는 기록 · 클럽을 나가도 기록은 여기 남아요</div></button>' +
        '<div class="card"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">클럽 ' + moims.length + '/' + me.moimMax + '</h3><span class="muted">캡틴 ' + moims.filter(function (x) { return x.role === 'cap'; }).length + '/3</span></div><div class="row"><button type="button" class="btn o" data-go="find">🔍 클럽 찾기</button><button type="button" class="btn o" data-go="make">＋ 클럽 만들기</button></div></div>' + (LZ.inviteCard ? LZ.inviteCard(false) : '') + '</div>';
      LZ.paintSync();
      if (LZ.firstGuide) { LZ.firstGuide = false; LZ.sheet('<h2>처음 오셨네요 👋</h2><p class="muted">세 가지만 알면 돼요.</p><div class="box">① <b>클럽 들어가기</b> — 홈에서 클럽 찾기나 초대 링크</div><div class="box">② <b>코스 열기</b> — 스크린 공략에서 코스를 누르면 홀 표</div><div class="box">③ <b>홀 적기</b> — 내 기록 줄을 누르고 좌우·타격감만</div><div class="box warn">🎁 첫 기록을 남기면 체험이 <b>3일</b> 늘어나요</div>'); }
    }
  };
  LZ.act.openClubCourses = async function (el, id) { if (id !== S.br) { try { await LZ.api('useBranch', { br: id }); } catch (e) { LZ.toast(LZ.errText(e)); return; } } LZ.go('courses', {}, { reset: true }); };
  LZ.act.resume = async function () { var l = S.me.last; if (l.br !== S.br) { try { await LZ.api('useBranch', { br: l.br }); } catch (e) { /* 무시 */ } } LZ.go('holes', { id: l.cid, half: l.hole < 9 ? 0 : 1 }); };
  LZ.act.homeReqs = function () { var m = (S.me.moims || []).filter(function (x) { return x.role === 'cap'; })[0]; if (m) LZ.go('club', { id: m.id, reqs: 1 }); else LZ.go('home'); };

  /* ───── 클럽 ───── */
  var CL = { d: null };
  LZ.screens.club = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('moimGet', { id: p.id }); if (!alive()) return; CL.d = d;
      var m = d.moim, cap = d.cap, me = S.user, st = d.stats || {};
      root.innerHTML = LZ.hdr(m.name, { back: true, right: cap ? '<button type="button" class="ib" data-act="clubSet">설정</button>' : '' }) + '<div class="wrap">' +
        '<div class="card"><div>' + (m.official ? '<span class="chip off">공식 클럽</span>' : '') + (m.area ? '<span class="chip">' + esc(m.area) + '</span>' : '') + '<span class="chip">회원 ' + m.members + '명</span>' + (m.live ? '<span class="chip cap">지금 기록 중 ' + m.live + '명</span>' : '') + '</div><p style="margin:10px 0 0">캡틴 <b>' + esc(m.captainNick) + '님</b></p>' +
        (d.me ? '<div class="kv" style="margin-top:10px"><div><b>' + st.members + '</b><span>회원</span></div><div><b>' + (st.monthHoles || 0) + '</b><span>이번 달 기록(홀)</span></div><div><b>' + (st.monthRounds || 0) + '</b><span>이번 달 라운드</span></div></div>' + (st.top && st.top.length ? '<p class="muted" style="margin:8px 0 0">많이 친 코스: ' + st.top.map(esc).join(' · ') + '</p>' : '') : '') + '</div>' +
        (!d.me ? '<div class="card"><p style="margin:0 0 6px">이 클럽의 회원님이 아니에요.</p><button type="button" class="btn" data-act="applyClub" data-v="' + esc(m.id) + '">가입 신청</button></div>' : '') +
        (d.me && m.chal ? '<div class="card"><h3>🏁 이달의 챌린지</h3><p style="margin:0"><b>' + esc(m.chal.name) + ' ' + m.chal.goal + '홀 채우기</b></p><div class="bar" style="height:12px;margin-top:8px"><i style="width:' + Math.round(m.chal.done / Math.max(1, m.chal.members) * 100) + '%"></i></div><p class="muted" style="margin:6px 0 0">회원 ' + m.chal.members + '명 중 <b>' + m.chal.done + '명 달성</b> · 나 ' + m.chal.mine + '/' + m.chal.goal + ' · ' + LZ.fmtYmd(m.chal.until) + '까지</p></div>' : '') +
        (d.me ? '<div class="card"><h3>📅 이번 주 모임</h3><p style="margin:0"><b>' + (m.meet ? esc(m.meet) : '<span class="muted">아직 안 정했어요</span>') + '</b></p>' + (cap ? '<button type="button" class="btn o sm" data-act="clubMeet">모임 날짜 바꾸기</button>' : '') + '</div>' : '') +
        (d.me ? '<div class="card"><h3>📢 클럽 소식</h3>' + ((d.news || []).length ? d.news.map(function (n) { return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>' + esc(n.title) + '</b><div class="muted">' + LZ.fmtDate(n.upd) + '</div></div>'; }).join('') : '<p class="muted" style="margin:0">아직 소식이 없어요.</p>') + (cap ? '<button type="button" class="btn o sm" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ br: m.id })) + '\'>소식 쓰기</button>' : '') + '<button type="button" class="btn g sm" data-go="notices" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\'>소식 모두 보기</button></div>' : '') +
        (d.me ? '<div class="card"><h3>회원님 초대</h3><div class="center"><div class="muted">클럽 코드</div><div style="font-size:30px;font-weight:800;letter-spacing:4px;color:var(--g)">' + esc(m.code.slice(0, 3) + ' ' + m.code.slice(3)) + '</div></div><div class="row"><button type="button" class="btn kakao" data-act="inviteKakao">카톡으로 초대</button><button type="button" class="btn o" data-act="inviteQr">QR</button></div></div>' : '') +
        (cap ? '<div class="card" style="border:2px solid #FED7AA"><h3>⭐ 캡틴 관리</h3>' +
          '<button type="button" class="opt" data-act="clubReqs"><b>가입 신청 ' + (d.reqs || []).length + '건</b><span>"함께하기"를 누르면 들어와요</span></button>' +
          '<button type="button" class="opt" data-act="clubChal"><b>이달의 챌린지 정하기</b><span>' + (m.chal ? esc(m.chal.name) + ' ' + m.chal.goal + '홀' : '예: 양주1구장CD 18홀 채우기') + '</span></button>' +
          '<button type="button" class="opt" data-act="clubQrPoster"><b>매장 QR 포스터</b><span>코스별 QR · 찍으면 바로 그 코스의 홀 표</span></button>' +
          '<button type="button" class="opt" data-go="notiCfg"><b>가입 신청 알림 받기</b><span>앱 푸시 · 원하면 카카오톡으로도</span></button>' +
          '<div class="tgl"><span>클럽 찾기에 보이기</span>' + LZ.sw(m.pub, 'clubPub') + '</div><div class="tgl"><span>초대 링크로는 바로 가입<span class="muted">캡틴 승인 없이 들어와요</span></span>' + LZ.sw(m.auto, 'clubAuto') + '</div>' +
          '<button type="button" class="opt" data-act="clubHand"><b>캡틴 넘기기</b><span>정회원·명예회원께 · 넘긴 뒤에는 회원으로 남아요</span></button>' +
          (!m.official ? '<button type="button" class="opt" data-act="clubClose"><b>클럽 닫기</b><span>혼자일 때만 · 내 기록은 내 기록장으로</span></button>' : '') + '</div>' : '') +
        (d.me ? '<div class="card"><h3>함께하는 회원님</h3><div class="list">' + (d.members || []).map(function (x) {
          return '<div class="it"><div class="av">' + esc(x.nick.charAt(0)) + '</div><div class="t"><b>' + esc(x.nick) + '님 ' + (x.cap ? '<span class="chip cap">캡틴</span>' : '') + (x.live ? '<span class="chip">기록 중</span>' : '') + (x.off ? '<span class="chip gray">이용 끝남</span>' : '') + '</b><span class="muted">신뢰도 ' + x.trust + ' · 기록 ' + x.holes + '홀</span></div>' +
            (cap && x.uid !== me.uid && !x.cap ? '<button type="button" class="sm2 r" data-act="clubKick" data-v="' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '">탈퇴</button>' : '') + (S.user.kind === 'hon' && !x.cap && x.uid !== me.uid ? '<button type="button" class="sm2 g" data-act="giftTo" data-v="' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '">🎁</button>' : '') + '</div>';
        }).join('') + '</div></div>' : '') +
        (d.me && d.me !== 'cap' ? '<button type="button" class="btn g" data-act="clubLeave">클럽 나가기</button>' : '') + '</div>';
      if (p.reqs && cap) LZ.act.clubReqs();
    }
  };
  function inviteUrl(m) { return LZ.APP_URL + '?inv=' + m.code; }
  LZ.act.inviteKakao = function () { var m = CL.d.moim; LZ.kakaoShare('파크골프 공략수첩 "' + m.name + '" 클럽에 초대해요 🏌\n클럽 코드 ' + m.code + '\n아래 링크를 누르면 바로 가입 신청이 돼요.', inviteUrl(m)); };
  LZ.act.inviteQr = function () { var m = CL.d.moim; LZ.sheet('<h2>' + esc(m.name) + ' 초대 QR</h2><div class="qr" id="qrbox"></div><p class="muted center">카메라로 찍으면 가입 화면이 열려요 · 클럽 코드 ' + esc(m.code) + '</p>'); LZ.qr($('#qrbox'), inviteUrl(m)); };
  LZ.qr = function (box, text) { try { if (window.QRCode) { new QRCode(box, { text: text, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M }); return; } } catch (e) { /* 무시 */ } box.innerHTML = '<p class="muted">' + esc(text) + '</p>'; };
  LZ.act.clubQrPoster = function () {
    var m = CL.d.moim, cs = CL.d.courses || [];
    LZ.sheet('<h2>매장 QR 포스터</h2><p class="muted">코스를 고르면 그 코스의 홀 표가 바로 열리는 QR이 나와요. 화면을 캡처하거나 인쇄해서 기계 옆에 붙여 두세요.</p>' + cs.slice(0, 40).map(function (c) { return '<button type="button" class="opt" data-act="courseQr" data-v=\'' + esc(JSON.stringify({ id: c.id, name: c.name })) + '\'><b>' + esc(c.name) + '</b></button>'; }).join(''));
  };
  LZ.act.courseQr = function (el, v) { var c = JSON.parse(v), url = LZ.APP_URL + '#course:' + c.id; LZ.sheet('<h2>' + esc(c.name) + '</h2><div class="qr" id="qrbox"></div><p class="center"><b>' + esc(c.name) + '</b><br><span class="muted">파크골프 공략수첩 · 찍으면 이 코스의 홀 표가 열려요</span></p>'); LZ.qr($('#qrbox'), url); };
  LZ.act.applyClub = async function (el, id) {
    var msg = await LZ.dialog({ title: '가입 신청', html: '<p class="muted">캡틴께 남길 한마디(안 써도 돼요)</p><input type="text" id="amsg" class="in" maxlength="60" placeholder="예: 수요일마다 치는 다람쥐예요"><label class="lb">아는 분(있으면)</label><input type="text" id="aknow" class="in" maxlength="40" placeholder="예: 청설모님, 솔바람님">', cancel: null, buttons: [{ label: '가입 신청하기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (v) { return v === 'ok' ? { msg: ($('#amsg') || {}).value, know: ($('#aknow') || {}).value } : null; });
    if (!msg) return;
    try { var r = await LZ.api('moimApply', { id: id, msg: msg.msg, know: msg.know }); await LZ.refreshMe(); LZ.toast(r.res.joined ? '클럽에 들어왔어요' : '가입 신청했어요. 캡틴이 함께하기를 누르면 홈에 생겨요', 4000); LZ.go('home', {}, { reset: true }); } catch (e) { LZ.toast(e.message, 5000); }
  };
  LZ.act.clubReqs = function () {
    var d = CL.d, rq = d.reqs || [];
    LZ.sheet('<h2>가입 신청 ' + rq.length + '건</h2>' + (rq.length ? rq.map(function (r) { return '<div class="card tight"><div style="display:flex;align-items:center;gap:10px"><div class="av">' + esc(r.nick.charAt(0)) + '</div><div><b style="font-size:calc(var(--fs) + 2px)">' + esc(r.nick) + '님</b><div class="muted">' + esc(r.kindName) + ' · 신뢰도 ' + r.trust + ' · 클럽 ' + r.moims + '개 함께하는 중</div></div></div>' + (r.msg ? '<p class="muted" style="margin:8px 0 0">"' + esc(r.msg) + '"</p>' : '') + (r.know ? '<p class="muted" style="margin:4px 0 0">🤝 아는 분: ' + esc(r.know) + '</p>' : '') + '<div class="row"><button type="button" class="btn" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 1 })) + '\'>함께하기</button><button type="button" class="btn g" data-act="reqDo" data-v=\'' + esc(JSON.stringify({ rid: r.id, ok: 0 })) + '\'>다음에</button></div></div>'; }).join('') : '<div class="empty">새 가입 신청이 없어요.</div>') + '<p class="hint">신청은 7일이 지나면 자동으로 정리돼요.</p>');
  };
  LZ.act.reqDo = async function (el, v) { var o = JSON.parse(v); try { var r = await LZ.api('moimDecide', { rid: o.rid, ok: o.ok }); CL.d = r; LZ.toast(o.ok ? '함께하게 됐어요' : '"다음에"를 보냈어요'); LZ.refreshMe().catch(function () {}); LZ.redraw(); if (r.reqs && r.reqs.length) LZ.act.clubReqs(); else LZ.closeSheet(); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubPub = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, pub: el.classList.contains('on') ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubAuto = async function (el) { try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, auto: el.classList.contains('on') ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };
  LZ.act.clubMeet = async function () {
    var v = await LZ.dialog({ title: '이번 주 모임', html: '<input type="text" id="meet" class="in" maxlength="30" value="' + esc(CL.d.moim.meet || '') + '" placeholder="예: 목 19:00 제이드 양주점">', cancel: null, buttons: [{ label: '저장', kind: 'y', value: 'ok' }, { label: '비우기', kind: 'g', value: 'clear' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? ($('#meet') || {}).value : x === 'clear' ? '' : null; });
    if (v === null) return;
    try { CL.d = await LZ.api('moimSet', { id: CL.d.moim.id, meet: v }); LZ.redraw(); } catch (e) { LZ.toast(e.message); }
  };
  LZ.act.clubSet = async function () {
    var m = CL.d.moim, colors = ['', '#0B5D4B', '#1E3A8A', '#7C2D12', '#6B21A8', '#0E7490', '#374151'];
    LZ.sheet('<h2>클럽 설정</h2><label class="lb" style="margin-top:0">클럽 이름</label><input type="text" id="cname" class="in" maxlength="15" value="' + esc(m.name) + '"' + (m.official && S.user.kind !== 'admin' ? ' disabled' : '') + '><label class="lb">지역</label><input type="text" id="carea" class="in" maxlength="15" value="' + esc(m.area || '') + '"><label class="lb">클럽 색</label><div class="seg">' + colors.map(function (c) { return '<button type="button" class="' + ((m.color || '') === c ? 'on' : '') + '" data-act="pickColor" data-v="' + c + '" style="' + (c ? 'background:' + c + ';border-color:' + c : '') + ';height:40px">' + (c ? '' : '기본') + '</button>'; }).join('') + '</div><input type="hidden" id="ccolor" value="' + esc(m.color || '') + '">' +
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
  LZ.act.clubKick = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(o.nick + '님을 탈퇴 처리할까요?', '그분의 이 클럽 기록은 그분의 내 기록장으로 옮겨져요. 다시 가입 신청할 수 있어요.', '탈퇴 처리', 'r'))) return; try { CL.d = await LZ.api('moimKick', { id: CL.d.moim.id, uid: o.uid }); LZ.redraw(); LZ.toast('탈퇴 처리했어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubHand = function () {
    var d = CL.d, list = (d.members || []).filter(function (x) { return !x.cap && x.paid; });
    LZ.sheet('<h2>캡틴 넘기기</h2><p class="muted">정회원·명예회원께 넘길 수 있어요. 넘긴 뒤에는 회원으로 남아요.</p>' + (list.length ? list.map(function (x) { return '<button type="button" class="opt" data-act="handTo" data-v=\'' + esc(JSON.stringify({ uid: x.uid, nick: x.nick })) + '\'><b>' + esc(x.nick) + '님</b><span>신뢰도 ' + x.trust + ' · 기록 ' + x.holes + '홀</span></button>'; }).join('') : '<div class="empty">넘길 수 있는 정회원이 없어요.</div>'));
  };
  LZ.act.handTo = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(o.nick + '님께 캡틴을 넘길까요?', '넘기면 되돌릴 수 없어요(새 캡틴이 다시 넘겨 줘야 해요).', '넘기기'))) return; try { CL.d = await LZ.api('moimHand', { id: CL.d.moim.id, uid: o.uid }); LZ.closeSheet(); LZ.refreshMe().catch(function () {}); LZ.redraw(); LZ.toast('캡틴을 넘겼어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubClose = async function () { if (!(await LZ.confirm('클럽을 닫을까요?', '다른 회원님이 없을 때만 닫을 수 있어요. 내 기록은 내 기록장으로 옮겨져요.', '클럽 닫기', 'r'))) return; try { await LZ.api('moimClose', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('home', {}, { reset: true }); LZ.toast('클럽을 닫았어요'); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.clubLeave = async function () { if (!(await LZ.confirm('클럽에서 나갈까요?', '내 기록은 내 기록장으로 옮겨져요. 언제든 다시 가입 신청할 수 있어요.', '나가기', 'r'))) return; try { var r = await LZ.api('moimLeave', { id: CL.d.moim.id }); await LZ.refreshMe(); LZ.go('home', {}, { reset: true }); LZ.toast('나갔어요' + (r.moved ? ' · 기록 ' + r.moved + '개를 내 기록장으로 옮겼어요' : ''), 4000); } catch (e) { LZ.toast(e.message, 4500); } };
  LZ.act.giftTo = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(o.nick + '님께 7일을 선물할까요?', '이번 달 선물 횟수가 1회 줄어요. 받는 분은 누구에게서든 월 1회예요.', '선물하기'))) return; try { var r = await LZ.api('gift', { uid: o.uid }); LZ.toast(o.nick + '님께 7일을 선물했어요 · ' + LZ.fmtYmd(r.member.end) + '까지', 4000); } catch (e) { LZ.toast(e.message, 5000); } };

  /* ───── 클럽 찾기 · 만들기 ───── */
  LZ.screens.find = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('클럽 찾기', { back: true }) + LZ.skeleton(4);
      var q = p.q || '', r = await LZ.api('moimFind', { q: q }); if (!alive()) return;
      root.innerHTML = LZ.hdr('클럽 찾기', { back: true }) + '<div class="wrap"><input type="search" id="fq" value="' + esc(q) + '" placeholder="클럽 이름이나 지역 (예: 양주)"><p class="muted">함께하는 클럽 ' + r.count + '/' + r.max + '</p>' +
        (r.list.length ? r.list.map(function (m) { return '<div class="card"><b style="font-size:calc(var(--fs) + 2px)">' + esc(m.name) + '</b>' + (m.official ? ' <span class="chip off">공식</span>' : '') + '<p class="muted" style="margin:4px 0 0">' + esc(m.area || '') + ' · 회원 ' + m.members + '명 · 캡틴 ' + esc(m.captainNick) + '님' + (m.meet ? ' · 📅 ' + esc(m.meet) : '') + '</p>' + (m.role ? '<p class="muted" style="margin:6px 0 0;color:var(--green)">함께하는 중</p>' : m.asked ? '<button type="button" class="btn g sm" data-act="cancelApply" data-v="' + esc(m.id) + '">신청 취소</button>' : '<button type="button" class="btn o sm" data-act="applyClub" data-v="' + esc(m.id) + '">가입 신청</button>') + '</div>'; }).join('') : '<div class="empty">찾는 클럽이 없어요.</div>') +
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
      LZ.sheet('<h2>' + esc(m.name) + '</h2><p class="muted">' + esc(m.area || '') + ' · 회원 ' + m.members + '명 · 캡틴 ' + esc(m.captainNick) + '님</p>' + (m.role ? '<div class="box">이미 함께하는 클럽이에요.</div>' : m.asked ? '<div class="box">가입 신청을 했어요. 캡틴의 답을 기다려 주세요.</div>' : '<p class="muted">캡틴께 남길 한마디(안 써도 돼요)</p><input type="text" id="amsg" class="in" maxlength="60" placeholder="예: 수요일마다 치는 다람쥐예요"><button type="button" class="btn" data-act="applyCode" data-v=\'' + esc(JSON.stringify({ code: code, inv: inv ? 1 : 0 })) + '\'>' + (m.auto && inv ? '바로 가입하기' : '가입 신청하기') + '</button>'));
    } catch (e) { LZ.toast(e.message, 4500); }
  };
  LZ.act.applyCode = async function (el, v) { var o = JSON.parse(v); try { var r = await LZ.api('moimApply', { code: o.code, inv: o.inv, msg: ($('#amsg') || {}).value || '' }); await LZ.refreshMe(); LZ.closeSheet(); LZ.toast(r.res.joined ? '클럽에 들어왔어요' : '가입 신청했어요. 캡틴이 함께하기를 누르면 홈에 생겨요', 4000); LZ.go('home', {}, { reset: true }); } catch (e) { LZ.toast(e.message, 5000); } };
  LZ.screens.make = {
    show: function (p, root) {
      var colors = ['', '#0B5D4B', '#1E3A8A', '#7C2D12', '#6B21A8', '#0E7490', '#374151'];
      root.innerHTML = LZ.hdr('클럽 만들기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">클럽 이름</label><input type="text" id="mname" maxlength="15" placeholder="예: 우리 수요클럽"><label class="lb">지역</label><input type="text" id="marea" maxlength="15" placeholder="예: 경기 양주"><label class="lb">이번 주 모임(선택)</label><input type="text" id="mmeet" maxlength="30" placeholder="예: 목 19:00 제이드 양주점"><label class="lb">클럽 색</label><div class="seg">' + colors.map(function (c, i) { return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-act="pickColor" data-v="' + c + '" style="' + (c ? 'background:' + c + ';border-color:' + c : '') + ';height:40px">' + (c ? '' : '기본') + '</button>'; }).join('') + '</div><input type="hidden" id="ccolor" value=""><div class="tgl"><span>클럽 찾기에 보이기</span>' + LZ.sw(true, 'tglPub') + '</div><input type="hidden" id="mpub" value="1"><p class="muted" style="margin:0">타격감 기준은 앱 공통이에요. 모드·높이는 회원님이 각자 코스마다 본인 스타일로 정해요.</p></div>' +
        '<div class="box">클럽을 만들면 <b>캡틴</b>이 돼요. 정회원·명예회원이 만들 수 있고, 캡틴으로 3개까지 운영해요.</div><button type="button" class="btn" data-act="makeOk">클럽 만들기</button></div>';
    }
  };
  LZ.act.tglPub = function (el) { el.classList.toggle('on'); $('#mpub').value = el.classList.contains('on') ? '1' : '0'; };
  LZ.act.makeOk = async function () {
    LZ.busy(true, '만드는 중…');
    try { var r = await LZ.api('moimCreate', { name: $('#mname').value, area: $('#marea').value, meet: $('#mmeet').value, color: $('#ccolor').value, pub: $('#mpub').value === '1' ? 1 : 0 }); LZ.busy(false); await LZ.refreshMe(); LZ.go('club', { id: r.id }, { replace: true }); LZ.toast('클럽을 만들었어요. 회원님을 초대해 보세요'); }
    catch (e) { LZ.busy(false); if (e.code === 'paid') { if (await LZ.confirm('정회원이 되면 만들 수 있어요', e.message, '결제하러 가기')) LZ.go('pay'); } else LZ.toast(e.message, 5000); }
  };

  /* ───── 알림함 ───── */
  var NICON = { pay: '💳', refund: '↩', qna: '💬', pw: '🔑', mreq: '✋', club: '👥', course: '📍', gift: '🎁', round: '⛳', join: '🌱', fb: '📝', payok: '✅', digest: '📊' };
  LZ.screens.noti = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + LZ.skeleton(5);
      var r = await LZ.api('notiList', { read: 1 }); if (!alive()) return; if (S.me) S.me.noti = 0;
      var a = r.admin;
      root.innerHTML = LZ.hdr('알림', { back: true, noBell: 1 }) + '<div class="wrap">' +
        (a ? '<div class="card tight"><div class="kv" style="grid-template-columns:repeat(4,1fr)">' + [['pay', '결제 승인', a.pay, 'payList'], ['refund', '환불', a.refund, 'refunds'], ['qna', '문의', a.qna, 'qnaList'], ['pw', '비밀번호', a.pw, 'pwreqs']].map(function (x) { return '<button type="button" style="all:unset;cursor:pointer;background:var(--soft);border-radius:14px;padding:10px 4px;text-align:center" data-go="' + x[3] + '"><b style="display:block;font-size:calc(var(--fs) + 6px);color:' + (x[2] ? 'var(--org)' : 'var(--g)') + '">' + x[2] + '</b><span style="font-size:12px;color:var(--sub)">' + x[1] + '</span></button>'; }).join('') + '</div></div>' : '') +
        '<div class="card">' + (r.list.length ? r.list.map(function (n) { return '<button type="button" class="noti ' + (n.read ? '' : 'unread') + '" data-act="notiOpen" data-v="' + esc(n.to) + '"><div class="ic">' + (NICON[n.kind] || '🔔') + '</div><div style="flex:1;min-width:0"><b>' + esc(n.title) + '</b><span class="muted">' + esc(n.body) + '</span></div><span class="muted small" style="white-space:nowrap">' + LZ.fmtDate(n.at, true) + '</span></button>'; }).join('') : '<div class="empty">알림이 없어요.</div>') + '</div>' +
        '<button type="button" class="btn g" data-go="notiCfg">🔔 알림 받기 설정</button></div>';
      LZ.paintBell();
    }
  };
  LZ.act.notiOpen = function (el, to) { if (to) LZ.goTo(to); };

  /* ───── 사용 안내 ───── */
  LZ.screens.guide = {
    show: function (p, root) {
      var T = function (rows) { return '<div class="tblwrap"><table class="tbl" style="font-size:calc(var(--fs) - 4px)"><tr><th style="text-align:left">할 수 있는 것</th><th>체험</th><th>정회원</th><th>명예</th><th>캡틴</th></tr>' + rows.map(function (r) { return '<tr><td style="text-align:left">' + r[0] + '</td>' + r.slice(1).map(function (v) { return '<td>' + (v === 1 ? '<span style="color:var(--green);font-weight:800">●</span>' : v === 0 ? '<span style="color:#D1D5DB">—</span>' : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; };
      root.innerHTML = LZ.hdr('사용 안내', { back: true, noBell: 1 }) + '<div class="wrap">' +
        '<div class="card"><h3>내가 할 수 있는 것</h3>' + T([['스크린 공략 보기·적기', 1, 1, 1, 1], ['회원님 기록 보기·가져오기', 1, 1, 1, 1], ['코스·구장 등록·수정', 0, 1, 1, 1], ['클럽 가입', '1개', '5개', '5개', '5개'], ['클럽 만들기(캡틴)', 0, '3개', '3개', '3개'], ['필드 라운드 열기', 1, 1, 1, 1], ['단체 라운드·시상식', 0, 0, 0, 1], ['체험회원 만들기', 0, 0, 1, 0], ['7일 선물(월 5명)', 0, 0, 1, 0], ['클럽 소식·가입 승인·챌린지', 0, 0, 0, 1]]) + '<p class="muted" style="margin:8px 0 0">캡틴은 정회원·명예회원이 클럽을 만들면 돼요. 관리자는 모든 것을 할 수 있어요.</p></div>' +
        '<div class="card"><h3>이용 기간이 끝나면</h3><div class="box" style="margin:6px 0"><b>돼요</b> — 로그인, 내 기록·내 라운드 보기, 클럽 유지, 남이 연 라운드에 함께하기·점수 적기, 결제</div><div class="box err" style="margin:6px 0"><b>안 돼요</b> — 기록 적기, 회원님 기록 보기·가져오기, 코스·구장 등록, 라운드 열기, 클럽 만들기·가입 신청</div><p class="muted" style="margin:0">끝난 동안 내 기록은 다른 회원님께 보이지 않아요. 캡틴은 끝나도 클럽 관리는 돼요.</p></div>' +
        '<div class="card"><h3>요금</h3><p style="margin:0">체험 <b>7일 무료</b>(첫 기록을 남기면 +3일) → 정회원 <b>월 1,000원</b> · <b>연 6,000원</b>(50% 할인). 카카오페이 송금 후 관리자 확인. 명예회원은 평생 무료예요.</p></div>' +
        '<div class="card"><h3>타격감 기준</h3><p style="margin:0 0 6px">타격감 = 볼스피드. <b>8~40</b>(40은 Full), 0.5씩. 모드와 발사 높낮이는 코스에 처음 기록할 때 정하고, 보는 사람이 바꾸면 <b>같은 거리</b>로 환산해 보여요.</p><div class="tblwrap"><table class="tbl" style="font-size:calc(var(--fs) - 4px)"><tr><th>모드</th><th>50m 타격감</th><th>1당 거리</th><th>높게</th><th>낮게</th></tr>' + ['b', 'p', 'm'].map(function (g) { var pw = LZ.pw(); return '<tr><td><b>' + LZ.MODE[g] + (g === 'p' ? '(기본)' : '') + '</b></td><td>' + LZ.fmtP(pw[g].base) + '</td><td>' + pw[g].step + 'm</td><td>+' + pw.hl + 'm</td><td>−' + pw.hl + 'm</td></tr>'; }).join('') + '</table></div><p class="muted" style="margin:6px 0 0">예: 프로·보통 타격감 20 = ' + LZ.distOf(20, 'p', 'm') + 'm. ● 제안과 같음 · ▲ 더 크게 · ▼ 더 작게. "내 제안"은 내 기록이 제안과 늘 어긋나는 만큼 보정한 값이에요.</p></div>' +
        '<div class="card"><h3>기록 규칙</h3><ul style="margin:0;padding-left:18px"><li>위치 기준: <b>첫화면에서</b>(기본) · 홀컵 · 직접</li><li>좌우: <b>그대로</b>(희미하게) 또는 <span style="color:var(--red);font-weight:800">좌 1~10</span>·<span style="color:var(--blue);font-weight:800">우 1~10</span>칸, 타격감은 0.5씩</li><li>참고사항은 16자, 사진 한 장(작게 줄여 저장)</li><li>기록은 클럽별로 따로. 클럽을 나가면 <b>내 기록장</b>으로 옮겨져요</li><li>회원님 기록은 같은 클럽의 이용 중인 분 것만 보여요</li><li>코스 난이도 별은 레저로 화면의 별 그대로. 코스 정보는 정회원 이상 누구나 고치고 이력이 남아요</li></ul></div>' +
        '<div class="card"><h3>클럽 규칙</h3><ul style="margin:0;padding-left:18px"><li>가입: 초대 링크 · 클럽 코드 6자리 · 클럽 찾기 → 캡틴이 <b>함께하기</b>. 7일 지나면 신청 정리</li><li>캡틴은 캡틴을 넘긴 뒤 나갈 수 있어요(정회원·명예회원에게만)</li><li>탈퇴 처리된 분의 기록도 그분의 내 기록장에 남아요</li></ul></div>' +
        '<div class="card"><h3>필드 라운드</h3><ul style="margin:0;padding-left:18px"><li>한 조 최대 8명, 손님은 이름만</li><li>조원 누구나 적고, 파도 바로 고칠 수 있어요. "본인 점수는 본인만"으로 바꿀 수 있어요</li><li>12시간 지나면 저절로 끝나요</li><li>언더 ' + LZ.pp(-1) + ' · 이븐 ' + LZ.pp(0) + ' · 오버 ' + LZ.pp(1) + '</li><li>단체 라운드: 캡틴이 열고 단체 코드 2자리로 조를 모아요. 끝나면 시상식</li></ul></div>' +
        '<div class="card"><h3>비밀번호</h3><p style="margin:0">잊으면 ① 복구 번호 8자리로 다시 정하기 ② 관리자에게 찾기 신청(임시 번호 24시간). 캡틴은 비밀번호를 볼 수도 바꿀 수도 없어요. 복구 번호는 내 정보에서 언제든 다시 받을 수 있어요.</p></div>' +
        '<div class="card"><h3>알림·화면</h3><p style="margin:0">휴대폰 알림은 앱을 <b>홈 화면에 추가</b>한 뒤에 돼요(아이폰은 꼭 추가해야 해요). 기록·라운드 화면에서는 화면이 꺼지지 않아요(아이폰은 홈 화면에 추가한 앱에서만).</p></div></div>';
    }
  };

  /* ───── 공지(관리자: 모든 회원님 / 캡틴: 클럽 소식) ───── */
  LZ.noticeBody = function (n) { return (n.img ? '<img data-img="' + esc(n.img) + '" alt="">' : '') + '<div class="ntbody">' + LZ.cleanHtml(n.html) + '</div>'; };
  LZ.cleanHtml = function (h) { return String(h || '').replace(/<(?!\/?(b|br|span class="(big|c-r|c-b|c-g)")\s*\/?>)[^>]*>/gi, ''); };
  LZ.fillImgs = async function (root) {
    for (var i = 0, els = $$('img[data-img]', root); i < els.length; i++) {
      var el = els[i], id = el.dataset.img; el.removeAttribute('data-img');
      if (/^assets\//.test(id)) { el.src = id; continue; }
      try { var r = await LZ.api('imgGet', { id: id }); el.src = r.data; } catch (e) { el.remove(); }
    }
  };
  LZ.screens.notices = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('공지·소식', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('noticeList', p.manage ? { manage: 1 } : (p.mid ? { mid: p.mid } : {})); if (!alive()) return;
      LZ.noticeMarkSeen(r.list);
      root.innerHTML = LZ.hdr(p.manage ? '공지 관리' : '공지·소식', { back: true, right: r.canWrite ? '<button type="button" class="ib" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ br: p.mid || (S.user.kind === 'admin' ? '' : (r.moims[0] || {}).id) })) + '\'>쓰기</button>' : '' }) + '<div class="wrap">' +
        (r.list.length ? r.list.map(function (n) { return '<div class="card"><div style="display:flex;align-items:center;gap:6px"><b style="flex:1;font-size:calc(var(--fs) + 1px)">' + (n.pin ? '📌 ' : '') + esc(n.title) + '</b>' + (n.canEdit ? '<button type="button" class="sm2 g" data-go="noticeEdit" data-p=\'' + esc(JSON.stringify({ id: n.id })) + '\'>고치기</button>' : '') + '</div><p class="muted" style="margin:2px 0 8px">' + esc(n.store) + ' · ' + esc(n.by || '') + ' · ' + LZ.fmtDate(n.upd) + (n.end ? ' · ' + LZ.fmtYmd(n.end) + '까지' : '') + '</p>' + LZ.noticeBody(n) + (n.btns || []).map(function (b) { return '<button type="button" class="btn o sm" data-act="noticeBtn" data-v="' + esc(b.to) + '">' + esc(b.label) + '</button>'; }).join('') + '</div>'; }).join('') : '<div class="empty">공지가 없어요.</div>') + '</div>';
      LZ.fillImgs(root);
    }
  };
  LZ.act.noticeBtn = function (el, to) { if (/^https:/.test(to)) window.open(to, '_blank', 'noopener'); else LZ.goTo({ join: 'join', invite: 'me', pay: 'pay', qna: 'qnaList', notices: 'notices', courses: 'courses' }[to] || to); };
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
        var v = LZ.dialog({ title: '📢 ' + n.title, html: '<div class="ntpop">' + LZ.noticeBody(n) + '</div><p class="hint">' + esc(n.store) + ' · ' + LZ.fmtDate(n.upd) + '</p>', cancel: 'ok', buttons: (n.btns || []).map(function (b, k) { return { label: b.label, kind: k ? 'g' : 'y', value: 'to:' + b.to }; }).concat([{ label: '확인', kind: (n.btns || []).length ? 'g' : 'y', value: 'ok' }]) });
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
        '<label class="lb">제목</label><input type="text" id="ntitle" maxlength="40" value="' + esc(n ? n.title : '') + '"><label class="lb">내용</label><textarea id="nhtml" maxlength="2000">' + esc(n ? n.html.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '') : '') + '</textarea>' +
        '<div class="tgl"><span>맨 위 고정</span>' + LZ.sw(n && n.pin, 'tglPin') + '</div><div class="tgl"><span>앱을 열 때 한 번 팝업</span>' + LZ.sw(n && n.popup, 'tglPop') + '</div><input type="hidden" id="npin" value="' + (n && n.pin ? 1 : 0) + '"><input type="hidden" id="npop" value="' + (n && n.popup ? 1 : 0) + '">' +
        '<label class="lb">보이는 기간(선택)</label><div class="row"><input type="date" id="nstart" class="in" value="' + esc(n ? n.start : '') + '"><input type="date" id="nend" class="in" value="' + esc(n ? n.end : '') + '"></div>' +
        '<button type="button" class="btn" data-act="noticeSave" data-v="' + esc(n ? n.id : '') + '">' + (n ? '고친 내용 저장' : '올리기') + '</button>' + (n ? '<button type="button" class="btn g" data-act="noticeDel" data-v="' + esc(n.id) + '">지우기</button>' : '') + '</div></div>';
    }
  };
  LZ.act.tglPin = function (el) { el.classList.toggle('on'); $('#npin').value = el.classList.contains('on') ? 1 : 0; };
  LZ.act.tglPop = function (el) { el.classList.toggle('on'); $('#npop').value = el.classList.contains('on') ? 1 : 0; };
  LZ.act.noticeSave = async function (el, id) {
    var html = esc($('#nhtml').value).replace(/\n/g, '<br>');
    try { await LZ.api('noticeSave', { id: id || undefined, br: $('#nbr').value, title: $('#ntitle').value, html: html, pin: +$('#npin').value, popup: +$('#npop').value, start: $('#nstart').value, end: $('#nend').value }); LZ.refreshMe().catch(function () {}); LZ.toast('올렸어요'); LZ.back(); } catch (e) { LZ.toast(e.message, 5000); }
  };
  LZ.act.noticeDel = async function (el, id) { if (!(await LZ.confirm('이 공지를 지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('noticeDel', { id: id }); LZ.back(); } catch (e) { LZ.toast(e.message); } };

  /* ───── 문의(FAQ + 1:1) ───── */
  LZ.screens.qnaList = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('문의하기', { back: true }) + LZ.skeleton(4);
      var f = await LZ.api('faqList', {}), r = null; try { r = await LZ.api('qnaList', {}); } catch (e) { r = { err: e }; } if (!alive()) return;
      root.innerHTML = LZ.hdr('문의하기', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>자주 묻는 질문</h3>' + f.faq.map(function (x, i) { return '<details style="padding:8px 0;border-bottom:1px solid var(--line)"><summary style="font-weight:700;cursor:pointer">' + esc(x.q) + '</summary><div class="ntbody muted" style="padding:8px 0 0">' + LZ.cleanHtml(x.a) + '</div></details>'; }).join('') + '</div>' +
        (r && !r.err ? '<div class="card"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">1:1 문의</h3><button type="button" class="sm2" data-go="qnaNew">새 문의</button></div>' + (r.list.length ? '<div class="list">' + r.list.map(function (q) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="qnaGet" data-p=\'' + esc(JSON.stringify({ id: q.id })) + '\'><div class="t"><b>' + (q.unread ? '🔴 ' : '') + esc(q.title) + '</b><span class="muted">' + esc(q.catName) + ' · ' + (r.staff ? esc(q.nick) + ' · ' : '') + { open: '답변 기다림', answered: '답변 옴', closed: '끝남' }[q.status] + ' · ' + LZ.fmtDate(q.updated) + '</span></div><span>›</span></button>'; }).join('') + '</div>' : '<p class="muted" style="margin:8px 0 0">남긴 문의가 없어요.</p>') + '</div>' : '<div class="card"><p class="muted" style="margin:0">' + esc(r && r.err ? r.err.message : '') + '</p></div>') + '</div>';
    }
  };
  LZ.screens.qnaNew = {
    show: async function (p, root) {
      var cats = { pay: '결제·이용권', course: '코스 정보', app: '앱 사용·오류', acct: '계정·비밀번호', branch: '클럽 관련', nick: '닉네임 확인 요청', etc: '기타' };
      root.innerHTML = LZ.hdr('새 문의', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">분류</label><select id="qcat" class="in">' + Object.keys(cats).map(function (k) { return '<option value="' + k + '"' + (p.cat === k ? ' selected' : '') + '>' + cats[k] + '</option>'; }).join('') + '</select><label class="lb">제목</label><input type="text" id="qtitle" maxlength="30" value="' + esc(p.title || '') + '"><label class="lb">내용</label><textarea id="qhtml" maxlength="500" placeholder="자세히 적어 주시면 빨리 도와드릴 수 있어요"></textarea><button type="button" class="btn" data-act="qnaAsk" data-v="' + esc(p.cid || '') + '">보내기</button></div><p class="hint">답변은 관리자가 해요. 답이 오면 알림으로 알려 드려요.</p></div>';
    }
  };
  LZ.act.qnaAsk = async function (el, cid) { try { var r = await LZ.api('qnaAsk', { cat: $('#qcat').value, title: $('#qtitle').value, html: esc($('#qhtml').value).replace(/\n/g, '<br>'), cid: cid || undefined }); LZ.go('qnaGet', { id: r.qna.id }, { replace: true }); LZ.toast('문의를 남겼어요'); } catch (e) { LZ.toast(e.message, 5000); } };
  LZ.screens.qnaGet = {
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('문의', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('qnaGet', { id: p.id }); if (!alive()) return; var q = r.qna;
      root.innerHTML = LZ.hdr(q.title, { back: true }) + '<div class="wrap"><p class="muted">' + esc(q.catName) + ' · ' + esc(q.nick) + '님 · ' + LZ.fmtDate(q.created, true) + (q.course ? ' · ' + esc(q.course.name) : '') + '</p>' +
        q.msgs.map(function (m) { return '<div class="card tight" style="' + (m.role === 'staff' ? 'background:var(--gl)' : '') + '"><div class="muted small">' + (m.role === 'staff' ? '관리자' : esc(m.by)) + ' · ' + LZ.fmtDate(m.at, true) + '</div><div class="ntbody">' + LZ.cleanHtml(m.html) + '</div></div>'; }).join('') +
        (q.status !== 'closed' ? '<div class="card"><textarea id="qreply" maxlength="1000" placeholder="' + (q.canAnswer ? '답변을 적어 주세요' : '덧붙일 내용') + '"></textarea><button type="button" class="btn" data-act="qnaReply" data-v="' + esc(q.id) + '">보내기</button><button type="button" class="btn g" data-act="qnaClose" data-v="' + esc(q.id) + '">문의 끝내기</button></div>' : '<div class="box">끝난 문의예요.</div>') + '</div>';
    }
  };
  LZ.act.qnaReply = async function (el, id) { try { await LZ.api('qnaReply', { id: id, html: esc($('#qreply').value).replace(/\n/g, '<br>') }); LZ.redraw(); } catch (e) { LZ.toast(e.message, 5000); } };
  LZ.act.qnaClose = async function (el, id) { if (!(await LZ.confirm('문의를 끝낼까요?', '', '끝내기'))) return; try { await LZ.api('qnaClose', { id: id }); LZ.redraw(); } catch (e) { LZ.toast(e.message); } };

  /* ───── 의견 보내기 ───── */
  LZ.act.feedback = function () {
    LZ.sheet('<h2>의견 보내기</h2><p class="muted">익명으로 관리자에게 전해져요. 불편한 점, 바라는 점을 한 줄로 적어 주세요.</p><textarea id="fbtext" maxlength="200" placeholder="예: 글씨가 조금 작아요"></textarea><button type="button" class="btn" data-act="feedbackOk">보내기</button>');
  };
  LZ.act.feedbackOk = async function () { try { await LZ.api('feedback', { text: $('#fbtext').value }); LZ.closeSheet(); LZ.toast('고마워요. 의견을 잘 받았어요'); } catch (e) { LZ.toast(e.message, 4500); } };
})();
