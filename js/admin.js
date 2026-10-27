/* 관리자: 현황판 · 회원 · 결제 승인 · 환불 · 비밀번호 찾기 신청 · 설정(요금·계좌·타격감 기준·카카오 키) · 로고 · 기록 · 의견 · 클럽 전체 · 자주 묻는 질문 · 홍보 안내문 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var won = function (n) { return Number(n || 0).toLocaleString() + '원'; };
  function needAdmin() { if (!S.user || S.user.kind !== 'admin') { LZ.toast('관리자만 볼 수 있어요'); LZ.go('home', {}, { reset: true }); return false; } return true; }
  async function sure() { return LZ.sureDialog(); }

  LZ.screens.dash = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('관리자', { back: true }) + LZ.skeleton(5);
      var d = await LZ.api('dash', {}); if (!alive()) return;
      var t = d.total, badge = function (n) { return n ? '<i class="bdg">' + n + '</i>' : ''; };
      root.innerHTML = LZ.hdr('관리자', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>오늘</h3><div class="kv"><div><b>' + d.today + '</b><span>오늘 사용</span></div><div><b>' + d.joinsToday + '</b><span>오늘 가입</span></div><div><b>' + t.all + '</b><span>회원 전체</span></div></div><div class="kv" style="margin-top:6px"><div><b>' + (t.trial || 0) + '</b><span>체험</span></div><div><b>' + ((t.month || 0) + (t.year || 0)) + '</b><span>정회원</span></div><div><b>' + (t.expired || 0) + '</b><span>만료</span></div></div><p class="muted" style="margin:8px 0 0">최근 30일 가입 ' + d.conv.joined + '명 중 결제 ' + d.conv.paid + '명 · 직접 가입 ' + d.conv.self + '명</p></div>' +
        '<div class="card"><h3>처리할 일</h3><button type="button" class="opt" data-go="pays"><b>결제 승인 ' + badge(d.pending) + '</b><span>입금 확인 후 승인 · 비밀번호 재확인</span></button><button type="button" class="opt" data-go="refunds"><b>환불 신청 ' + badge(d.refundReq) + '</b></button><button type="button" class="opt" data-go="pwreqs"><b>비밀번호 찾기 신청 ' + badge(d.pwReq) + '</b><span>임시 번호 24시간</span></button><button type="button" class="opt" data-go="qnaList"><b>문의 ' + badge(d.qnaOpen) + '</b></button></div>' +
        '<div class="card"><h3>이달 결제 (' + esc(d.month.label) + ')</h3><div class="kv"><div><b>' + d.month.count + '</b><span>건</span></div><div><b>' + won(d.month.amount) + '</b><span>결제</span></div><div><b>' + won(d.month.net) + '</b><span>환불 뺀 금액</span></div></div></div>' +
        '<div class="card"><h3>클럽 ' + d.moims.length + '개</h3><div class="list">' + d.moims.slice(0, 8).map(function (m) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.official ? ' <span class="chip cap">공식</span>' : '') + '</b><span class="muted">캡틴 ' + esc(m.captainNick || '—') + ' · 회원 ' + m.members + '명</span></div><span>›</span></button>'; }).join('') + '</div><button type="button" class="btn g sm" data-go="moimAll">클럽 모두 보기</button></div>' +
        (d.soon.length ? '<div class="card"><h3>곧 끝나는 회원</h3><div class="list">' + d.soon.map(function (u) { return '<div class="it"><div class="t"><b>' + esc(u.nick) + '</b><span class="muted">' + esc(u.kindName) + ' · ' + (u.left === 0 ? '오늘까지' : u.left + '일 남음') + '</span></div></div>'; }).join('') + '</div></div>' : '') +
        '<div class="card"><h3>관리</h3><button type="button" class="opt" data-go="members"><b>회원</b><span>만들기 · 종류 바꾸기 · 기간 · 임시 번호 · 중지</span></button><button type="button" class="opt" data-go="adminCfg"><b>설정</b><span>요금 · 계좌 · 타격감 기준 · 카카오 · 가입</span></button><button type="button" class="opt" data-go="promo"><b>홍보 안내문</b><span>카톡·문자로 보낼 가입 안내 글</span></button><button type="button" class="opt" data-go="notices" data-p=\'{"manage":1}\'><b>공지 관리</b></button><button type="button" class="opt" data-go="faqAdmin"><b>자주 묻는 질문</b></button><button type="button" class="opt" data-go="log"><b>활동 기록</b></button></div></div>';
    }
  };

  /* ───── 홍보 안내문(관리자 전용): 친구 추천 없이 가입 유도 ───── */
  LZ.screens.promo = {
    tab: 'me',
    show: function (p, root) {
      if (!needAdmin()) return;
      var url = LZ.APP_URL + '?join=1', saved = store.get('lz.promo') || '';
      var def = '⛳ 파크골프 공략수첩\n\n스크린 파크골프, 홀마다 어디로 얼마나 쳐야 할지 매번 헷갈리셨죠?\n공략수첩은 홀별 좌우·타격감을 적어 두고, 클럽 회원들의 기록과 평균까지 한눈에 봐요.\n\n✔ 홀 표 한 장에 내 공략 · 회원 공략 · 클럽 평균\n✔ 아마추어·프로·마스터 모드 자동 환산\n✔ 필드 라운드 점수판을 한 조가 같이 적기\n✔ 단체 라운드 상황판과 시상식까지\n\n🎁 지금 가입하면 7일 무료 체험\n정회원은 월 1,000원 · 연 6,000원\n\n👇 아래 링크를 누르면 바로 가입 화면이 열려요\n' + url;
      var text = saved || def;
      root.innerHTML = LZ.hdr('홍보 안내문', { back: true }) + '<div class="wrap"><div class="card"><p class="muted" style="margin-top:0">카카오톡·문자로 보낼 가입 안내 글이에요. 링크를 누르면 가입 화면이 바로 열려요. 글은 자유롭게 고쳐 쓰고, 이 휴대폰에 저장돼요.</p><textarea id="promoT" rows="14" maxlength="1000">' + esc(text) + '</textarea><div class="row"><button type="button" class="btn kakao" data-act="promoShare">카톡으로 보내기</button><button type="button" class="btn g" data-act="promoCopy">복사</button></div><div class="row"><button type="button" class="btn g sm" data-act="promoSms">문자로 보내기</button><button type="button" class="btn g sm" data-act="promoReset">처음 글로</button></div></div>' +
        '<div class="card"><h3>안내장 그림</h3><p class="muted" style="margin:0 0 8px">카톡·밴드·인쇄용 1080×1350 그림. QR이 들어 있어요.</p><button type="button" class="btn o" data-act="posterJoin">가입 안내장 그림 받기</button></div>' +
        '<div class="card"><h3>가입 링크 QR</h3><p class="muted" style="margin:0 0 8px">인쇄해서 매장에 붙여 두면 휴대폰 카메라로 찍고 바로 가입해요.</p><div class="qr" id="pqr"></div><p class="center muted small">' + esc(url) + '</p><button type="button" class="btn g sm" data-act="copy" data-v="' + esc(url) + '">링크만 복사</button></div>' +
        '<div class="card"><h3>회원용 친구 초대 글</h3><p class="muted" style="margin:0">회원들이 친구를 초대하는 안내는 홈과 내 정보의 <b>친구 초대하기</b>에 있고, 공지 "친구 초대하기" 팝업으로도 보여 줄 수 있어요.</p><button type="button" class="btn g sm" data-go="notices" data-p=\'{"manage":1}\'>공지 관리로</button></div></div>';
      LZ.qr($('#pqr'), url);
      $('#promoT').addEventListener('input', function () { store.set('lz.promo', this.value); });
    }
  };
  function promoText() { return $('#promoT').value; }
  LZ.act.promoShare = async function () {
    var t = promoText(), url = LZ.APP_URL + '?join=1';
    try { if (navigator.canShare) { var b = await (await fetch('assets/promo-invite.jpg')).blob(), f = new File([b], 'parkgolf.jpg', { type: 'image/jpeg' }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: '파크골프 공략수첩', text: t.indexOf(url) >= 0 ? t : t + '\n' + url }); return; } } } catch (e) { if (e && e.name === 'AbortError') return; }
    return LZ.act.share(null, JSON.stringify({ title: '파크골프 공략수첩', text: t.indexOf(url) >= 0 ? t.replace(url, '').replace(/\s+$/, '') : t, url: url }));
  };
  LZ.act.promoCopy = function () { return LZ.act.copy(null, promoText()); };
  LZ.act.promoSms = function () { location.href = 'sms:?body=' + encodeURIComponent(promoText()); };
  LZ.act.promoReset = function () { store.del('lz.promo'); LZ.redraw(); };

  /* ───── 회원 ───── */
  var MB = { br: '', q: '' };
  LZ.screens.members = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('회원', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('members', MB.br ? { br: MB.br } : {}); if (!alive()) return; MB.d = d;
      var q = MB.q, list = d.members.filter(function (u) { return !q || u.nick.indexOf(q) >= 0; });
      root.innerHTML = LZ.hdr('회원 ' + d.members.length + '명', { back: true, right: '<button type="button" class="ib on" data-act="mNew">＋ 만들기</button>' }) + '<div class="wrap">' +
        '<div class="row"><select id="mbr" class="in" data-act="mBr"><option value="">전체</option><option value="_staff"' + (MB.br === '_staff' ? ' selected' : '') + '>운영진</option><option value="_me"' + (MB.br === '_me' ? ' selected' : '') + '>클럽 없음</option>' + d.moims.map(function (m) { return '<option value="' + esc(m.id) + '"' + (MB.br === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select><input type="search" id="mq" class="in" placeholder="닉네임 찾기" value="' + esc(q) + '"></div>' +
        '<div class="list">' + list.slice(0, MB.show || 40).map(function (u) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-act="mOpen" data-v="' + esc(u.uid) + '"><div class="av ' + (u.online ? 'g' : '') + '">' + esc(u.nick.charAt(0)) + '</div><div class="t"><b>' + esc(u.nick) + LZ.dot(u) + ' <span class="chip">' + esc(u.tierName || u.kindName) + '</span>' + (!u.active ? '<span class="chip off">중지</span>' : u.st === 'expired' ? '<span class="chip off">만료</span>' : '') + (u.pendingPay ? '<span class="chip">결제 대기</span>' : '') + (u.tmp ? '<span class="chip">임시 번호</span>' : '') + (u.isNew ? '<span class="chip">새 회원</span>' : '') + '</b><span class="muted">' + (u.end ? LZ.fmtYmd(u.end) + '까지 · ' : '') + '코스 ' + u.courses + ' · ' + (u.moims.length ? u.moims.join(', ') : '클럽 없음') + (u.sameDev ? ' · 같은 폰 ' + u.sameDev : '') + '</span></div><span>›</span></button>'; }).join('') + '</div>' + (!list.length ? '<div class="empty">없어요.</div>' : '') + (list.length > (MB.show || 40) ? '<button type="button" class="btn g sm" data-act="mMore">더 보기 (' + (list.length - (MB.show || 40)) + '명)</button>' : '') + '</div>';
      $('#mbr').addEventListener('change', function () { MB.br = this.value; MB.show = 0; LZ.redraw(); });
      $('#mq').addEventListener('input', function () { MB.q = LZ.stripNick(this.value); $$('.list .it').forEach(function (b) { b.hidden = MB.q && b.querySelector('b').textContent.indexOf(MB.q) < 0; }); });
    }
  };
  LZ.act.mMore = function () { MB.show = (MB.show || 40) + 40; LZ.redraw(); };
  LZ.act.mNew = async function () {
    var ms = MB.d ? MB.d.moims : [];
    LZ.sheet('<h2>회원 만들기</h2><label class="lb" style="margin-top:0">닉네임</label><input type="text" id="cn" maxlength="8"><label class="lb">종류</label>' + LZ.seg([['blue', '🔵 블루'], ['red', '🔴 레드'], ['gold', '🟡 골드']], 'blue', 'mNewKind') + '<input type="hidden" id="ck" value="blue"><label class="lb">클럽</label><select id="cm" class="in"><option value="">(없음)</option>' + ms.map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</select><button type="button" class="btn" data-act="mNewGo">만들기</button><p class="hint">임시 비밀번호 4자리가 나와요. 24시간 안에 로그인해서 바꿔야 해요.</p>');
  };
  LZ.act.mNewKind = function (el, v) { $('#ck').value = v; $$('[data-act="mNewKind"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.mNewGo = async function () { try { var r = await LZ.api('mCreate', { nick: $('#cn').value, kind: $('#ck').value, mid: $('#cm').value }); LZ.closeSheet(); showPin(r.member.nick, r.pin); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  function showPin(nick, pin) { LZ.dialog({ title: nick + '님 임시 비밀번호', html: '<div class="code" style="font-size:var(--t6)">' + esc(pin) + '</div><p class="muted center">24시간 안에 로그인해서 새 비밀번호로 바꿔야 해요.</p><button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '파크골프 공략수첩', text: '파크골프 공략수첩 · ' + nick + '님\n임시 비밀번호: ' + pin + '\n24시간 안에 로그인해서 새 비밀번호로 바꿔 주세요.', url: LZ.APP_URL })) + '\'>카톡으로 알려 주기</button>' }); }
  LZ.act.mOpen = function (el, uid) {
    var u = MB.d.members.filter(function (x) { return x.uid === uid; })[0]; if (!u) return;
    var isMe = u.uid === S.user.uid, adm = u.kind === 'admin';
    LZ.sheet('<h2>' + esc(u.nick) + LZ.dot(u) + ' <span class="chip">' + esc(u.tierName || u.kindName) + '</span></h2><p class="muted" style="margin:0 0 8px">' + (u.start ? LZ.fmtYmd(u.start) + ' ~ ' : '') + (u.end ? LZ.fmtYmd(u.end) : '기간 없음') + (u.left !== null && u.left !== undefined ? ' (' + (u.left < 0 ? '끝남' : u.left + '일 남음') + ')' : '') + ' · 가입 ' + LZ.fmtDate(u.created) + ' · 마지막 ' + (u.seenAt ? LZ.fmtDate(u.seenAt) : '—') + '<br>코스 ' + u.courses + ' · 신뢰 ' + u.trust + ' · ' + (u.moims.length ? u.moims.join(', ') : '클럽 없음') + (u.refNick ? ' · 추천인 ' + esc(u.refNick) : '') + (u.src === 'self' ? ' · 직접 가입' : '') + '</p>' +
      (u.img ? '<button type="button" class="sm2 g" data-act="mOp" data-v="' + uid + ':avatar">사진 지우기</button>' : '') + (isMe || adm ? '<p class="muted">관리자 계정은 여기서 바꾸지 않아요.</p>' : '<div class="row"><button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':kind">등급 바꾸기</button>' + (u.tier === 'red' ? '<button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':extend">기간 늘리기</button>' : '') + '</div>' +
        '<div class="row"><button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':pin">임시 번호</button><button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':rename">닉네임 정리</button>' + (u.canRef ? '<button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':ref">추천인</button>' : '') + '</div>' +
        '<div class="row"><button type="button" class="btn g sm" data-act="mOp" data-v="' + uid + ':active">' + (u.active ? '이용 중지' : '이용 다시 허용') + '</button><button type="button" class="btn red sm" data-act="mOp" data-v="' + uid + ':delete">계정 삭제</button></div>'));
  };
  LZ.act.mOp = async function (el, v) {
    var p = v.split(':'), uid = p[0], op = p[1], u = MB.d.members.filter(function (x) { return x.uid === uid; })[0], body = { uid: uid, op: op };
    if (op === 'kind') { var k = await LZ.dialog({ title: '등급 바꾸기', body: '레드·골드는 오늘부터 1년. 블루는 기간 없음. 블랙은 이용 정지(로그인 불가).', cancel: false, buttons: [{ label: '🔵 블루', kind: 'o', value: 'blue' }, { label: '🔴 레드', kind: 'o', value: 'red' }, { label: '🟡 골드', kind: 'y', value: 'gold' }, { label: '⚫ 블랙', kind: 'r', value: 'black' }, { label: '취소', kind: 'g', value: null }] }); if (!k) return; body.kind = k; }
    if (op === 'extend') { var d = await LZ.dialog({ title: '기간 늘리기', html: '<input type="tel" id="ed" class="in" value="30" inputmode="numeric"><p class="hint">끝나는 날에 더해요(1~730일).</p>', cancel: null, buttons: [{ label: '늘리기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#ed').value : null; }); if (!d) return; body.days = +d; }
    if (op === 'rename') { var to = await LZ.dialog({ title: '닉네임 정리', html: '<input type="text" id="rn" class="in" maxlength="8" value="' + esc(u.nick) + '">', cancel: null, buttons: [{ label: '바꾸기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#rn').value : null; }); if (!to) return; body.to = to; }
    if (op === 'ref') { var rf = await LZ.dialog({ title: '추천인 정하기', html: '<input type="text" id="rf" class="in" maxlength="8" placeholder="추천인 닉네임 (비우면 지움)" value="' + esc(u.refNick || '') + '">', cancel: null, buttons: [{ label: '정하기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#rf').value : null; }); if (rf === null) return; body.to = rf; }
    if (op === 'active') { body.on = u.active ? 0 : 1; if (!(await LZ.confirm(u.active ? '이용을 중지할까요?' : '이용을 다시 허용할까요?', u.active ? '로그인할 수 없게 돼요. 기록은 남아요.' : '', '확인', u.active ? 'r' : 'y'))) return; }
    if (op === 'avatar') { if (!(await LZ.confirm('프로필 사진을 지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('avatarDel', { uid: uid }); LZ.toast('지웠어요'); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } return; }
    if (op === 'delete') { if (!(await LZ.confirm('정말 삭제할까요?', u.nick + '님의 기록·사진·클럽 소속이 모두 지워지고 되돌릴 수 없어요.', '삭제', 'r'))) return; }
    if (op === 'pin') { if (!(await LZ.confirm('임시 번호를 만들까요?', '지금 비밀번호는 못 쓰게 되고 모든 휴대폰에서 로그아웃돼요. 본인 확인 후에만 해 주세요.', '만들기'))) return; }
    try { var r = await LZ.api('mUpdate', body); LZ.closeSheet(); if (op === 'pin') showPin(u.nick, r.pin); else LZ.toast('처리했어요'); LZ.redraw(); }
    catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };

  /* ───── 결제 승인 ───── */
  LZ.screens.pays = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('결제 승인', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('payList', {}); if (!alive()) return;
      var row = function (x, pend) { return '<div class="card tight"><div style="display:flex;align-items:center;gap:6px"><b style="flex:1">' + esc(x.nick) + '</b><span class="chip">' + esc(x.planName) + '</span><b>' + won(x.amount) + '</b></div><div class="muted">' + (x.method === 'bank' ? '계좌' : '카카오페이') + ' · 보낸 분 <b>' + esc(x.depositor) + '</b> · ' + LZ.fmtDate(x.created, true) + (pend ? '' : ' → ' + (x.status === 'ok' ? '승인 ' + esc(x.start) + '~' + esc(x.end) : x.status === 'refunded' ? '환불 ' + won(x.refund) : x.status === 'no' ? '반려' : x.status)) + (x.refNick ? ' · 추천인 ' + esc(x.refNick) + (x.refWill ? ' (승인하면 +' + x.refWill + '일)' : x.refThis ? ' (+' + x.refThis + '일 줌)' : '') : '') + '</div>' + (pend ? '<div class="row"><button type="button" class="btn sm" data-act="payOk" data-v="' + esc(x.id) + '">입금 확인 · 승인</button><button type="button" class="btn g sm" data-act="payNo" data-v="' + esc(x.id) + '">반려</button></div>' : '') + '</div>'; };
      root.innerHTML = LZ.hdr('결제 승인', { back: true }) + '<div class="wrap"><h3>기다리는 결제 ' + d.pending.length + '건</h3>' + (d.pending.length ? d.pending.map(function (x) { return row(x, true); }).join('') : '<div class="empty">없어요.</div>') + '<h3>최근 처리</h3>' + d.recent.map(function (x) { return row(x, false); }).join('') + '</div>';
    }
  };
  LZ.act.payOk = async function (el, id) { if (!(await LZ.confirm('입금을 확인했나요?', '승인하면 바로 기간이 늘어나고 회원에게 알림이 가요.', '승인'))) return; try { await LZ.api('payDecide', { id: id, ok: 1 }); LZ.toast('승인했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); LZ.redraw(); } };
  LZ.act.payNo = async function (el, id) { var note = await LZ.dialog({ title: '반려', html: '<input type="text" id="pn" class="in" maxlength="100" placeholder="사유(회원에게 보여요)">', cancel: null, buttons: [{ label: '반려', kind: 'r', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#pn').value : null; }); if (note === null) return; try { await LZ.api('payDecide', { id: id, ok: 0, note: note }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* ───── 환불 ───── */
  LZ.screens.refunds = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('환불', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('refundList', {}); if (!alive()) return;
      var row = function (x, pend) { return '<div class="card tight"><div style="display:flex;gap:6px;align-items:center"><b style="flex:1">' + esc(x.nick) + '</b><span class="chip">' + esc(x.planName) + '</span><b>' + won(x.amount) + '</b></div><div class="muted">결제 ' + won(x.paid) + ' (' + esc(x.period) + ') · ' + esc(x.why) + '<br>' + esc(x.bank) + ' ' + esc(x.acct) + ' ' + esc(x.holder) + (x.reason ? ' · ' + esc(x.reason) : '') + ' · ' + LZ.fmtDate(x.created) + (pend ? '' : ' → ' + (x.status === 'done' ? '환불함' : '반려') + (x.note ? ' · ' + esc(x.note) : '')) + '</div>' + (pend ? '<div class="row"><button type="button" class="btn sm" data-act="refOk" data-v="' + esc(x.id) + '">보냈어요 · 환불 처리</button><button type="button" class="btn g sm" data-act="refNo" data-v="' + esc(x.id) + '">반려</button></div>' : '') + '</div>'; };
      root.innerHTML = LZ.hdr('환불', { back: true }) + '<div class="wrap"><h3>신청 ' + d.pending.length + '건</h3>' + (d.pending.length ? d.pending.map(function (x) { return row(x, true); }).join('') : '<div class="empty">없어요.</div>') + '<h3>최근 처리</h3>' + d.recent.map(function (x) { return row(x, false); }).join('') + '</div>';
    }
  };
  LZ.act.refOk = async function (el, id) { if (!(await LZ.confirm('환불금을 보냈나요?', '처리하면 이용권이 바로 끝나요.', '환불 처리'))) return; try { await LZ.api('refundDecide', { id: id, ok: 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); LZ.redraw(); } };
  LZ.act.refNo = async function (el, id) { var note = await LZ.dialog({ title: '반려', html: '<input type="text" id="rn2" class="in" maxlength="100" placeholder="사유(회원에게 보여요)">', cancel: null, buttons: [{ label: '반려', kind: 'r', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#rn2').value : null; }); if (note === null) return; try { await LZ.api('refundDecide', { id: id, ok: 0, note: note }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* ───── 비밀번호 찾기 신청 ───── */
  LZ.screens.pwreqs = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('비밀번호 찾기 신청', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('pwReqList', {}); if (!alive()) return;
      var row = function (x, pend) { return '<div class="card tight"><div style="display:flex;gap:6px;align-items:center"><b style="flex:1">' + esc(x.nick) + '</b>' + (x.found ? '<span class="chip">' + esc(x.kindName) + '</span>' : '<span class="chip off">없는 닉네임</span>') + '<span class="chip">신청 ' + esc(x.code) + '</span></div><div class="muted">가입한 때: ' + esc(x.when) + (pend ? ' · 연락처: <b>' + esc(x.contact) + '</b>' : '') + ' · ' + LZ.fmtDate(x.created, true) + (x.found ? ' · 실제 가입 ' + LZ.fmtDate(x.joined) + ' · 마지막 ' + LZ.fmtDate(x.last) : '') + (pend ? '' : ' → ' + (x.status === 'ok' ? '임시 번호 발급' : '안 됨') + ' (' + esc(x.by) + ')') + '</div>' + (pend ? '<p class="hint">연락처로 본인인지 확인한 뒤 임시 번호를 주세요. 임시 번호는 신청한 휴대폰의 "신청 상태 보기"에도 나와요(24시간).</p><div class="row"><button type="button" class="btn sm" data-act="pwOk" data-v="' + esc(x.id) + '"' + (x.found ? '' : ' disabled') + '>임시 번호 주기</button><button type="button" class="btn g sm" data-act="pwNo" data-v="' + esc(x.id) + '">안 됨</button></div>' : '') + '</div>'; };
      root.innerHTML = LZ.hdr('비밀번호 찾기 신청', { back: true }) + '<div class="wrap"><h3>기다리는 신청 ' + d.pending.length + '건</h3>' + (d.pending.length ? d.pending.map(function (x) { return row(x, true); }).join('') : '<div class="empty">없어요.</div>') + '<h3>최근 처리</h3>' + d.recent.map(function (x) { return row(x, false); }).join('') + '</div>';
    }
  };
  LZ.act.pwOk = async function (el, id) { if (!(await LZ.confirm('본인 확인을 했나요?', '임시 번호를 주면 지금 비밀번호는 못 쓰고 모든 휴대폰에서 로그아웃돼요.', '임시 번호 주기'))) return; try { var r = await LZ.api('pwReqDecide', { id: id, ok: 1 }); LZ.dialog({ title: '임시 번호', html: '<div class="code" style="font-size:var(--t6)">' + esc(r.pin) + '</div><p class="muted center">' + r.hours + '시간 안에 로그인해서 바꿔야 해요. 신청한 휴대폰의 "신청 상태 보기"에도 나와요.<br>연락처: ' + esc(r.contact) + '</p>' }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); LZ.redraw(); } };
  LZ.act.pwNo = async function (el, id) { if (!(await LZ.confirm('"안 됨"으로 정리할까요?', '', '정리', 'r'))) return; try { await LZ.api('pwReqDecide', { id: id, ok: 0 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };

  /* ───── 설정 ───── */
  var CF = null;
  LZ.screens.adminCfg = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('설정', { back: true }) + LZ.skeleton(6);
      var d = await LZ.api('adminCfg', {}); if (!alive()) return; CF = d; var c = d.cfg, pw = d.pw;
      var pwRow = function (k, name) { return '<div class="frow"><span class="n" style="width:56px">' + name + '</span><label class="muted small">50m 타격감</label><input type="number" step="0.5" min="8" max="40" id="pw_' + k + '_base" value="' + pw[k].base + '" style="width:76px"><label class="muted small">1당</label><input type="number" step="0.25" min="1" max="10" id="pw_' + k + '_step" value="' + pw[k].step + '" style="width:64px"><span class="muted small">m</span></div>'; };
      root.innerHTML = LZ.hdr('설정', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>요금</h3><label class="lb" style="margin-top:0">🔴 레드 연회비(원 / 1년)</label><input type="tel" id="c_price_red" value="' + (c.price_red || 10000) + '"><p class="muted" style="margin:8px 0 4px">클럽 방세(원 / 1년) · 20명은 연회비 포함</p><div class="row"><div style="flex:1"><label class="lb" style="margin-top:0">50명</label><input type="tel" id="c_fee_50" value="' + (c.fee_50 || 20000) + '"></div><div style="flex:1"><label class="lb" style="margin-top:0">100명</label><input type="tel" id="c_fee_100" value="' + (c.fee_100 || 30000) + '"></div></div><div class="row"><div style="flex:1"><label class="lb" style="margin-top:0">200명</label><input type="tel" id="c_fee_200" value="' + (c.fee_200 || 50000) + '"></div><div style="flex:1"><label class="lb" style="margin-top:0">이후 100명마다 +</label><input type="tel" id="c_fee_step" value="' + (c.fee_step || 20000) + '"></div></div><label class="lb">카카오페이 QR 주소</label><input type="url" id="c_qr_red" value="' + esc(c.qr_red || c.qr_year || '') + '" placeholder="https://qr.kakaopay.com/…"><label class="lb">은행</label><input type="text" id="c_bank_name" value="' + esc(c.bank_name) + '"><label class="lb">계좌번호</label><input type="tel" id="c_bank_no" value="' + esc(c.bank_no) + '"><label class="lb">예금주</label><input type="text" id="c_bank_holder" value="' + esc(c.bank_holder) + '"><button type="button" class="btn" data-act="cfgSave" data-v="price_red,fee_50,fee_100,fee_200,fee_step,qr_red,bank_name,bank_no,bank_holder">저장</button></div>' +
        '<div class="card"><h3>타격감 기준</h3><p class="muted" style="margin:0 0 6px">모드별 50m 타격감과 1당 거리, 높낮이 가감(m). 바꾸면 모든 환산·제안에 바로 적용돼요.</p>' + pwRow('b', '아마추어') + pwRow('p', '프로') + pwRow('m', '마스터') + '<div class="frow"><span class="n" style="width:56px">높낮이</span><label class="muted small">±</label><input type="number" step="0.05" min="0" max="2" id="pw_hl" value="' + pw.hl + '" style="width:76px"><span class="muted small">m (높게 −, 낮게 +)</span></div><div class="box" id="pwPrev"></div><button type="button" class="btn" data-act="cfgPw">저장</button></div>' +
        '<div class="card"><h3>가입 · 추천</h3><div class="tgl"><span>직접 가입 받기</span>' + LZ.sw(c.join_mode === 'on', 'cfgJoin') + '</div><label class="lb">하루 가입 한도</label><input type="tel" id="c_join_per_day" value="' + c.join_per_day + '"><div class="tgl"><span>추천 보상(추천인에게 일수 더하기)</span>' + LZ.sw(c.ref_on, 'cfgRef') + '</div><label class="lb">보상 일수</label><input type="tel" id="c_ref_days" value="' + c.ref_days + '"><label class="lb">동시 사용 인원(0 = 제한 없음)</label><input type="tel" id="c_seats" value="' + c.seats + '"><button type="button" class="btn" data-act="cfgSave" data-v="join_per_day,ref_days,seats">저장</button></div>' +
        '<div class="card"><h3>문의 기능</h3>' + LZ.seg([['off', '끔'], ['test', '시험'], ['on', '켬']], c.qna_mode, 'cfgQna') + '<label class="lb">시험 회원(닉네임, 쉼표)</label><input type="text" id="c_qna_testers" value="' + esc(c.qna_testers) + '"><button type="button" class="btn g sm" data-act="cfgSave" data-v="qna_testers">저장</button></div>' +
        '<div class="card"><h3>카카오톡 알림(나에게 보내기)</h3><p class="muted" style="margin:0 0 6px">카카오 developers에서 만든 앱의 <b>REST API 키</b>를 넣고, 그 앱에 Redirect URI <code>' + esc(LZ.APP_URL) + '</code> 와 "카카오 로그인 · 카카오톡 메시지 전송(talk_message)" 동의 항목을 켜 주세요. 관리자와 캡틴이 알림 설정에서 연결해요.</p><input type="text" id="c_kakao_key" value="' + esc(c.kakao_key) + '" placeholder="영문 소문자·숫자 32자"><button type="button" class="btn g sm" data-act="cfgSave" data-v="kakao_key">저장</button><p class="hint">앱 푸시 열쇠(VAPID)는 서버가 자동으로 만들어요' + (c.vapid_pub ? ' · 준비됨 ✓' : ' · 첫 알림 때 만들어져요') + '</p></div>' +
        '<div class="card"><h3>로고</h3><p class="muted" style="margin:0 0 6px">로그인 화면 로고(밝은 화면·어두운 화면). png·jpg·webp.</p><div class="row"><label class="btn o sm" style="text-align:center">밝은 화면 로고<input type="file" accept="image/*" id="lg_light" hidden></label><label class="btn o sm" style="text-align:center">어두운 화면 로고<input type="file" accept="image/*" id="lg_dark" hidden></label></div><div class="row"><button type="button" class="btn g sm" data-act="logoReset" data-v="light">밝은 로고 되돌리기</button><button type="button" class="btn g sm" data-act="logoReset" data-v="dark">어두운 로고 되돌리기</button></div></div></div>';
      pwPreview();
      ['b', 'p', 'm'].forEach(function (k) { ['base', 'step'].forEach(function (f) { $('#pw_' + k + '_' + f).addEventListener('input', pwPreview); }); }); $('#pw_hl').addEventListener('input', pwPreview);
      ['light', 'dark'].forEach(function (slot) { $('#lg_' + slot).addEventListener('change', async function () { var f = this.files[0]; if (!f) return; try { var data = await LZ.shrink(f, 600, 0.9); await LZ.api('logoPut', { slot: slot, data: data }); LZ.toast('로고를 올렸어요. 다음에 열 때 보여요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } }); });
    }
  };
  function pwPreview() { var el = $('#pwPrev'); if (!el) return; var out = ['b', 'p', 'm'].map(function (k) { var base = +$('#pw_' + k + '_base').value, step = +$('#pw_' + k + '_step').value, name = { b: '아마추어', p: '프로', m: '마스터' }[k]; return name + ': 타격감 ' + LZ.fmtP(base) + '=50m · ' + LZ.fmtP(base + 10 / step) + '≈60m · 최대 ' + Math.round(50 + (40 - base) * step) + 'm'; }); el.innerHTML = '<b>미리 보기</b><div class="muted small">' + out.join('<br>') + '<br>높낮이: 높게 −' + $('#pw_hl').value + 'm · 낮게 +' + $('#pw_hl').value + 'm · 더낮게 +' + (2 * $('#pw_hl').value) + 'm</div>'; }
  LZ.act.cfgSave = async function (el, keys) { var body = {}; keys.split(',').forEach(function (k) { body[k] = $('#c_' + k).value; }); try { var r = await LZ.api('setCfg', body); CF = r; LZ.toast('저장했어요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.cfgPw = async function () { var pw = {}; ['b', 'p', 'm'].forEach(function (k) { pw[k] = { base: $('#pw_' + k + '_base').value, step: $('#pw_' + k + '_step').value }; }); pw.hl = $('#pw_hl').value; try { var r = await LZ.api('setCfg', { pw: pw }); CF = r; S.pw = r.pw; LZ.toast('타격감 기준을 저장했어요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.cfgJoin = async function () { try { CF = await LZ.api('setCfg', { join_mode: CF.cfg.join_mode === 'on' ? 'off' : 'on' }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.cfgRef = async function () { try { CF = await LZ.api('setCfg', { ref_on: CF.cfg.ref_on ? 0 : 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.cfgQna = async function (el, v) { try { CF = await LZ.api('setCfg', { qna_mode: v }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.logoReset = async function (el, slot) { try { await LZ.api('logoReset', { slot: slot }); LZ.toast('되돌렸어요'); } catch (e) { LZ.toast(LZ.errText(e)); } };

  /* ───── 기록 · 의견 · 클럽 전체 · FAQ ───── */
  LZ.screens.log = { tab: 'me', show: async function (p, root, alive) { if (!needAdmin()) return; root.innerHTML = LZ.hdr('활동 기록', { back: true }) + LZ.skeleton(8); var d = await LZ.api('log', {}); if (!alive()) return; root.innerHTML = LZ.hdr('활동 기록', { back: true }) + '<div class="wrap"><div class="list">' + d.list.map(function (x) { return '<div class="it" style="padding:8px 4px"><div class="t"><b>' + esc(x.nick) + ' · ' + esc(x.act) + '</b><span class="muted">' + LZ.fmtDate(x.ts, true) + (x.info ? ' · ' + esc(x.info) : '') + '</span></div></div>'; }).join('') + '</div></div>'; } };
  LZ.screens.feedbacks = { tab: 'me', show: async function (p, root, alive) { if (!needAdmin()) return; root.innerHTML = LZ.hdr('회원 의견', { back: true }) + LZ.skeleton(4); var d = await LZ.api('feedbackList', {}); if (!alive()) return; root.innerHTML = LZ.hdr('회원 의견', { back: true }) + '<div class="wrap">' + (d.list.length ? d.list.map(function (x) { return '<div class="card tight"><div>' + esc(x.text) + '</div><div class="muted small">' + LZ.fmtDate(x.at, true) + ' · 익명</div></div>'; }).join('') : '<div class="empty">아직 의견이 없어요.</div>') + '</div>'; } };
  LZ.screens.moimAll = { tab: 'me', show: async function (p, root, alive) { if (!needAdmin()) return; root.innerHTML = LZ.hdr('클럽 전체', { back: true }) + LZ.skeleton(4); var d = await LZ.api('moimAll', {}); if (!alive()) return; root.innerHTML = LZ.hdr('클럽 전체 ' + d.list.length + '개', { back: true }) + '<div class="wrap"><div class="list">' + d.list.map(function (m) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.official ? ' <span class="chip cap">공식</span>' : '') + (!m.active ? ' <span class="chip off">닫힘</span>' : '') + '</b><span class="muted">캡틴 ' + esc(m.captainNick || '—') + ' · 회원 ' + m.members + '명 · 코드 ' + esc(m.code) + ' · ' + (m.pub ? '공개' : '비공개') + '</span></div><span>›</span></button><button type="button" class="sm2 r" data-act="moimDrop" data-v=\'' + esc(JSON.stringify({ id: m.id, name: m.name })) + '\'>삭제</button>'; }).join('') + '</div></div>'; } };
  LZ.act.moimDrop = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm('"' + o.name + '" 클럽을 삭제할까요?', '회원님들은 클럽 없음이 되고, 각자의 기록은 내 기록장으로 옮겨요. 되돌릴 수 없어요.', '삭제', 'r'))) return; try { await LZ.api('moimDrop', { id: o.id }); LZ.toast('삭제했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.screens.faqAdmin = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('자주 묻는 질문', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('faqList', {}); if (!alive()) return;
      root.innerHTML = LZ.hdr('자주 묻는 질문', { back: true, right: '<button type="button" class="ib on" data-act="faqEdit" data-v="">＋</button>' }) + '<div class="wrap"><div class="list">' + d.faq.map(function (f, i) { return '<div class="it" style="padding:8px 4px"><div class="t"><b>' + esc(f.q) + '</b><span class="muted">' + esc(f.a).slice(0, 80) + '</span></div><div style="display:flex;flex-direction:column;gap:4px"><button type="button" class="sm2 g" style="height:30px;font-size:var(--t0)" data-act="faqMove" data-v="' + esc(f.id) + ':-1">▲</button><button type="button" class="sm2 g" style="height:30px;font-size:var(--t0)" data-act="faqMove" data-v="' + esc(f.id) + ':1">▼</button></div><button type="button" class="sm2 g" data-act="faqEdit" data-v="' + esc(f.id) + '">고치기</button></div>'; }).join('') + '</div></div>';
      FQ = d.faq;
    }
  };
  var FQ = [];
  LZ.act.faqEdit = function (el, id) { var f = FQ.filter(function (x) { return x.id === id; })[0] || { q: '', a: '' }; LZ.sheet('<h2>' + (id ? '질문 고치기' : '질문 더하기') + '</h2><label class="lb" style="margin-top:0">질문</label><input type="text" id="fq" maxlength="60" value="' + esc(f.q) + '"><label class="lb">답</label><textarea id="fa" rows="5" maxlength="500">' + esc(f.a) + '</textarea><button type="button" class="btn" data-act="faqSave" data-v="' + esc(id) + '">저장</button>' + (id ? '<button type="button" class="btn red sm" data-act="faqDel" data-v="' + esc(id) + '">지우기</button>' : '')); };
  LZ.act.faqSave = async function (el, id) { try { await LZ.api('faqSave', { id: id || undefined, q: $('#fq').value, ans: $('#fa').value }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.faqDel = async function (el, id) { if (!(await LZ.confirm('지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('faqDel', { id: id }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.faqMove = async function (el, v) { var p = v.split(':'); try { await LZ.api('faqMove', { id: p[0], dir: +p[1] }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
})();
