/* 내 정보: 이용권·결제·환불 · 비밀번호·복구 번호 · 보기 설정 · 친구에게 알리기 · 명예회원(체험회원 만들기·7일 선물) · 알림 설정(푸시·카카오) · 의견 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  LZ.refLink = function () { return LZ.APP_URL + '?ref=' + S.user.uid; };
  LZ.refText = function () { return '⛳ 파크골프 공략수첩\n스크린 홀별 공략(좌우·타격감)을 적어 두고 클럽 회원과 함께 보는 앱이에요. 필드 라운드 점수판도 같이 써요.\n\n' + S.user.nick + '님의 초대로 가입하면 7일 무료 체험 바로 시작!\n👇 아래 링크를 눌러 가입하세요'; };
  /* 친구에게 알리기 카드(홈 아래·내 정보 위) */
  LZ.inviteCard = function (big) { if (S.user.kind === 'admin') return ''; return '<div class="card invite"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:34px">💛</span><div style="flex:1"><h3 style="margin:0">친구에게 알리기</h3><div class="muted">내 초대 링크로 가입하면 친구는 7일 무료 체험, 친구가 정회원이 되면 나에게 7일 추가</div></div></div><button type="button" class="btn kakao" data-act="inviteKakao">카카오톡으로 친구 초대하기</button>' + (big ? '<div class="row"><button type="button" class="btn g sm" data-act="copy" data-v="' + esc(LZ.refLink()) + '">링크 복사</button><button type="button" class="btn g sm" data-act="inviteQr">QR 보기</button></div>' : '') + '</div>'; };
  LZ.act.inviteKakao = async function () {
    try { if (navigator.canShare) { var b = await (await fetch('assets/promo-invite.jpg')).blob(), f = new File([b], 'parkgolf.jpg', { type: 'image/jpeg' }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: '파크골프 공략수첩', text: LZ.refText() + '\n' + LZ.refLink() }); return; } } } catch (e) { if (e && e.name === 'AbortError') return; }
    return LZ.kakaoShare(LZ.refText(), LZ.refLink());
  };
  LZ.act.inviteQr = function () { LZ.sheet('<h2>내 초대 QR</h2><p class="muted center">친구가 휴대폰 카메라로 찍으면 가입 화면이 열려요.</p><div class="qr" id="iqr"></div><p class="center muted small">' + esc(LZ.refLink()) + '</p>'); LZ.qr($('#iqr'), LZ.refLink()); };

  LZ.screens.me = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!S.me) { root.innerHTML = LZ.hdr('내 정보') + LZ.skeleton(5); await LZ.refreshMe(); if (!alive()) return; }
      if (S.pub === undefined) { try { S.pub = (await LZ.api('prefs', {})).pub; } catch (e) { S.pub = 1; } if (!alive()) return; }
      var u = S.user, m = S.me, dark = LZ.theme.get(), big = LZ.big.get(), buzz = store.get('lz.buzz') !== '0';
      var period = u.kind === 'hon' ? '평생 무료' : u.kind === 'admin' ? '관리자' : (u.end ? LZ.fmtYmd(u.end) + '까지' + (u.left !== null ? ' · ' + (u.st === 'expired' ? '끝남' : u.left + '일 남음') : '') : '');
      root.innerHTML = LZ.hdr('내 정보') + '<div class="wrap">' +
        '<div class="hello"><div class="av">' + esc(u.nick.charAt(0)) + '</div><div style="flex:1"><b style="font-size:calc(var(--fs) + 2px)">' + esc(u.nick) + '님</b> <span class="chip ' + (u.kind === 'hon' ? 'hon' : u.kind === 'admin' ? 'cap' : '') + '">' + esc(u.kindName) + '</span><div class="muted">' + esc(period) + (u.bonus ? ' · 첫 기록 +3일 받음' : '') + '</div></div><button type="button" class="sm2 g" data-act="nickChange">닉네임</button></div>' +
        (u.kind === 'admin' ? '<button type="button" class="cont" data-go="dash"><span style="font-size:26px">🛠</span><div style="flex:1"><b>관리자</b><span class="muted">결제 ' + ((m.admin || {}).pay || 0) + ' · 환불 ' + ((m.admin || {}).refund || 0) + ' · 비밀번호 ' + ((m.admin || {}).pw || 0) + ' · 문의 ' + ((m.admin || {}).qna || 0) + '</span></div><span>›</span></button>' : '') +
        (u.kind !== 'admin' && u.kind !== 'hon' ? '<div class="card price"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">정회원 이용권</h3>' + (m.pending ? '<span class="chip">승인 기다림</span>' : '') + '</div><div class="plans"><div class="plan"><b>월간</b><div class="won">1,000<small>원</small></div><div class="muted">30일</div></div><div class="plan best"><span class="tag">추천 · 50% 할인</span><b>연간</b><div class="won">6,000<small>원</small></div><div class="muted">365일 · 월 500원 꼴</div></div></div><button type="button" class="btn" data-go="pay">' + (m.pending ? '결제 확인 상태 보기' : u.st === 'expired' ? '결제하고 이어서 쓰기' : '결제하기') + '</button>' + (m.refund && (m.refund.can || m.refund.req) ? '<button type="button" class="btn g sm" data-go="refund">' + (m.refund.req ? '환불 신청 중 · 보기' : '환불 신청') + '</button>' : '') + '</div>' : '') +
        LZ.inviteCard(true) +
        (u.kind === 'hon' ? honPanel(m.gift) : '') +
        '<div class="card"><h3>보기</h3>' +
        '<div class="tgl"><span>글씨 크게</span>' + LZ.sw(big, 'big') + '</div><div class="tgl"><span>어두운 화면</span>' + LZ.sw(dark, 'theme') + '</div><div class="tgl"><span>단추 누를 때 진동</span>' + LZ.sw(buzz, 'buzz') + '</div>' +
        '<div class="tgl"><span>홀 표에서 거리(m)로 크게 보기<span class="muted">끄면 타격감이 크게, 거리는 작게</span></span>' + LZ.sw(S.unit === 'm', 'unitTgl') + '</div>' +
        '<div class="tgl"><span>내 기록 공개<span class="muted">끄면 클럽 회원이 내 기록을 못 봐요(평균엔 들어가요)</span></span>' + LZ.sw(S.pub !== 0, 'pubTgl') + '</div></div>' +
        '<div class="card"><h3>안전</h3><button type="button" class="opt" data-go="pinChange"><b>비밀번호 바꾸기</b><span>숫자 ' + u.pinLen + '자리 · 바꾸면 다른 휴대폰은 로그아웃</span></button><button type="button" class="opt" data-act="rcShow"><b>복구 번호</b><span>비밀번호를 잊었을 때 쓰는 8자리 · 새로 받으면 예전 번호는 못 써요</span></button><button type="button" class="opt" data-go="notiCfg"><b>알림 설정</b><span>앱 푸시 · ' + (u.kind === 'admin' || (m.moims || []).some(function (x) { return x.role === 'cap'; }) ? '카카오톡으로 받기 · ' : '') + '조용한 시간</span></button></div>' +
        '<div class="card"><h3>도움</h3><button type="button" class="opt" data-go="guide"><b>사용 안내</b><span>권한과 기준을 한눈에</span></button>' + (m.qnaOn ? '<button type="button" class="opt" data-go="qnaList"><b>문의하기</b><span>관리자에게 1:1' + (m.qna ? ' · 답변 ' + m.qna + '건' : '') + '</span></button>' : '') + '<button type="button" class="opt" data-go="feedback"><b>의견 보내기</b><span>익명으로 짧게 · 관리자만 봐요</span></button><button type="button" class="opt" data-go="notices" data-p=\'{"manage":0}\'><b>공지·소식</b></button><button type="button" class="opt" data-act="homeAdd"><b>홈 화면에 추가</b><span>앱처럼 열고 알림도 받아요</span></button></div>' +
        '<button type="button" class="btn g" data-act="logout">로그아웃</button><p class="hint center">파크골프 공략수첩 v' + (window.LZ_VER || '4.0') + '</p></div>';
    }
  };
  function honPanel(g) { g = g || {}; return '<div class="card" style="border-color:#D4A017"><h3>🎖 명예회원</h3><p class="muted" style="margin:0 0 8px">체험회원을 바로 만들고, 매월 ' + (g.max || 5) + '명께 7일을 선물할 수 있어요. (이번 달 ' + (g.used || 0) + '/' + (g.max || 5) + ')</p><div class="row"><button type="button" class="btn o" data-act="honCreate">체험회원 만들기</button><button type="button" class="btn o" data-go="gifts">🎁 7일 선물하기</button></div></div>'; }
  LZ.act.unitTgl = async function () { var nu = S.unit === 'm' ? 'p' : 'm'; S.unit = nu; S.user.unit = nu; try { await LZ.api('useBranch', { br: S.br, unit: nu }); } catch (e) { /* 다음에 */ } LZ.redraw(); };
  LZ.act.pubTgl = async function () { var to = S.pub === 0 ? 1 : 0; try { var r = await LZ.api('pub', { pub: to }); S.pub = r.pub; LZ.toast(r.pub ? '내 기록을 클럽 회원이 볼 수 있어요' : '내 기록을 숨겼어요'); } catch (e) { LZ.toast(LZ.errText(e)); } LZ.redraw(); };
  LZ.act.nickChange = async function () {
    var v = await LZ.dialog({ title: '닉네임 바꾸기', html: '<p class="muted">한글·영문·숫자 2~8자 · 7일에 한 번 · 예전 이름은 7일 동안 남이 못 써요.</p><input type="text" id="nn" class="in" maxlength="8" value="' + esc(S.user.nick) + '">', cancel: null, focus: '#nn', buttons: [{ label: '바꾸기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#nn').value : null; });
    if (v === null) return;
    try { var r = await LZ.api('setNick', { nick: v }); S.user = r.user || S.user; await LZ.refreshMe(); LZ.toast('닉네임을 바꿨어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.rcShow = async function () { if (!(await LZ.confirm('복구 번호를 새로 받을까요?', '복구 번호는 한 번만 보여 드려요. 새로 받으면 예전 번호는 못 쓰니 메모해 두세요.', '새로 받기'))) return; try { var r = await LZ.api('rcNew', {}); S.user = r.user; LZ.showRc(r.rc); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
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

  /* 결제 */
  LZ.screens.pay = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('결제', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('payInfo', {}); if (!alive()) return;
      var u = d.user, pend = d.pending, sel = p.plan || 'year', won = function (n) { return Number(n).toLocaleString() + '원'; };
      root.innerHTML = LZ.hdr('결제', { back: true }) + '<div class="wrap">' +
        (pend ? '<div class="card" style="background:var(--yl)"><h3>⏳ 입금 확인을 기다려요</h3><p style="margin:0">' + esc(pend.planName) + ' ' + won(pend.amount) + ' · ' + (pend.method === 'bank' ? '계좌이체' : '카카오페이') + ' · 보낸 분 이름 <b>' + esc(pend.depositor) + '</b></p><p class="muted">관리자가 확인하면 바로 기간이 늘어나고 알림이 와요. 보통 하루 안에 처리돼요.</p><button type="button" class="btn g sm" data-act="payCancel">신청 취소</button></div>' : '') +
        (!d.pay.ok ? '<div class="card"><p style="margin:0">' + esc(d.pay.why) + '</p></div>' : (pend ? '' :
          '<div class="card"><h3>이용권 고르기</h3><div class="plans"><button type="button" class="plan ' + (sel === 'month' ? 'on' : '') + '" data-act="payPlan" data-v="month"><b>월간</b><div class="won">' + won(d.prices.month) + '</div><div class="muted">' + d.days.month + '일 · ' + LZ.fmtYmd(d.preview.month.start) + '~' + LZ.fmtYmd(d.preview.month.end) + '</div></button><button type="button" class="plan best ' + (sel === 'year' ? 'on' : '') + '" data-act="payPlan" data-v="year"><span class="tag">추천</span><b>연간</b><div class="won">' + won(d.prices.year) + '</div><div class="muted">' + d.days.year + '일 · ' + LZ.fmtYmd(d.preview.year.start) + '~' + LZ.fmtYmd(d.preview.year.end) + '</div></button></div></div>' +
          '<div class="card"><h3>보내기 · ' + won(d.prices[sel]) + '</h3>' + (d.qr[sel] ? '<p class="muted" style="margin:0 0 6px">① 카카오페이 송금 QR을 눌러 ' + won(d.prices[sel]) + '을 보내요</p><a class="btn kakao" href="' + esc(d.qr[sel]) + '" target="_blank" rel="noopener">카카오페이로 ' + won(d.prices[sel]) + ' 보내기</a>' : '') +
          (d.bank.no ? '<p class="muted" style="margin:10px 0 6px">' + (d.qr[sel] ? '또는 ' : '① ') + '계좌로 보내요</p><div class="box"><b>' + esc(d.bank.name) + ' ' + esc(d.bank.no) + '</b> ' + esc(d.bank.holder) + ' <button type="button" class="sm2 g" data-act="copy" data-v="' + esc(d.bank.no) + '">복사</button></div>' : '') +
          '<p class="muted" style="margin:10px 0 6px">② 보낸 분 이름을 적고 "보냈어요"를 눌러요</p><label class="lb">보낸 분 이름(통장·카카오페이에 찍히는 이름)</label><input type="text" id="dep" maxlength="10" value="' + esc(u.nick) + '">' +
          LZ.seg([['kakao', '카카오페이로 보냈어요'], ['bank', '계좌로 보냈어요']], d.qr[sel] ? 'kakao' : 'bank', 'payMethod') + '<input type="hidden" id="pm" value="' + (d.qr[sel] ? 'kakao' : 'bank') + '">' +
          '<button type="button" class="btn" data-act="payReq" data-v="' + sel + '">보냈어요 · 확인 요청</button><p class="hint">관리자가 입금을 확인하면 기간이 늘어나요. 결제 후 7일 안이고 기록을 쓰지 않았으면 전액 환불, 그 뒤엔 남은 일수만큼 환불해요.</p></div>')) + '</div>';
    }
  };
  LZ.act.payPlan = function (el, v) { LZ.go('pay', { plan: v }, { replace: true }); };
  LZ.act.payMethod = function (el, v) { $('#pm').value = v; $$('[data-act="payMethod"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.payReq = async function (el, plan) { try { await LZ.api('payReq', { plan: plan, method: $('#pm').value, depositor: $('#dep').value }); LZ.toast('확인 요청을 보냈어요. 승인되면 알림이 와요', 4000); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.payCancel = async function () { if (!(await LZ.confirm('결제 신청을 취소할까요?', '이미 보낸 돈이 있다면 취소하지 말고 기다려 주세요.', '취소하기', 'r'))) return; try { await LZ.api('payCancel', {}); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  /* 환불 */
  LZ.screens.refund = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('환불', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('refundInfo', {}); if (!alive()) return; var st = d.state || {}, won = function (n) { return Number(n).toLocaleString() + '원'; };
      root.innerHTML = LZ.hdr('환불', { back: true }) + '<div class="wrap">' +
        (st.req ? '<div class="card" style="background:var(--yl)"><h3>환불 신청 중</h3><p style="margin:0">' + esc(st.req.planName) + ' · 예상 ' + won(st.req.amount) + ' · ' + esc(st.req.bank) + ' ' + esc(st.req.acct) + '</p><p class="muted">' + esc(st.req.why) + '</p><button type="button" class="btn g sm" data-act="refundCancel">신청 취소</button></div>' :
          st.recent ? '<div class="card"><h3>' + (st.recent.status === 'done' ? '환불 완료' : '환불 안 됨') + '</h3><p style="margin:0">' + esc(st.recent.planName) + ' · ' + won(st.recent.amount) + (st.recent.note ? '<br>' + esc(st.recent.note) : '') + '</p></div>' : '') +
        (d.calc && !st.req ? '<div class="card"><h3>환불 신청</h3><p style="margin:0">' + esc(d.pay.planName) + ' ' + won(d.pay.amount) + ' (' + esc(d.pay.start) + '~' + esc(d.pay.end) + ')</p><div class="box"><b>예상 환불 ' + won(d.calc.amount) + '</b><div class="muted">' + esc(d.calc.why) + '</div></div><label class="lb">은행</label><input type="text" id="rb" maxlength="20" placeholder="예: 카카오뱅크"><label class="lb">계좌번호</label><input type="tel" id="ra" maxlength="30"><label class="lb">예금주</label><input type="text" id="rh" maxlength="20"><label class="lb">사유(선택)</label><input type="text" id="rr" maxlength="100"><label class="tgl"><span>환불되면 이용권이 바로 끝나는 것을 확인했어요</span><input type="checkbox" id="rag"></label><button type="button" class="btn" data-act="refundReq">환불 신청</button></div>' : (!st.req && !st.recent ? '<div class="card"><p style="margin:0">환불할 수 있는 결제가 없어요.</p></div>' : '')) + '</div>';
    }
  };
  LZ.act.refundReq = async function () { try { await LZ.api('refundReq', { bank: $('#rb').value, acct: $('#ra').value, holder: $('#rh').value, reason: $('#rr').value, agree: $('#rag').checked ? 1 : 0 }); LZ.toast('환불 신청을 보냈어요', 4000); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.refundCancel = async function () { if (!(await LZ.confirm('환불 신청을 취소할까요?', '', '취소하기', 'r'))) return; try { await LZ.api('refundCancel', {}); await LZ.refreshMe(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };

  /* 명예회원: 체험회원 만들기 · 선물 */
  LZ.act.honCreate = async function () {
    var mids = S.me.moims || [];
    var v = await LZ.dialog({ title: '체험회원 만들기', html: '<p class="muted">앱이 낯선 분을 대신 가입시켜 드려요. 체험 7일 · 임시 비밀번호가 나오면 그분께 알려 주세요(24시간 안에 들어와서 바꿔야 해요).</p><label class="lb">닉네임</label><input type="text" id="hn" class="in" maxlength="8">' + (mids.length ? '<label class="lb">바로 넣을 클럽</label><select id="hm" class="in"><option value="">(없음)</option>' + mids.map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</select>' : ''), cancel: null, focus: '#hn', buttons: [{ label: '만들기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? { nick: $('#hn').value, mid: ($('#hm') || {}).value || '' } : null; });
    if (!v) return;
    try { var r = await LZ.api('mCreate', { nick: v.nick, kind: 'trial', mid: v.mid }); LZ.dialog({ title: '만들었어요', html: '<p><b>' + esc(r.member.nick) + '</b>님 · 임시 비밀번호 <b class="code" style="font-size:28px">' + esc(r.pin) + '</b></p><p class="muted">24시간 안에 로그인해서 새 비밀번호로 바꿔야 해요.</p><button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '파크골프 공략수첩', text: '파크골프 공략수첩에 ' + r.member.nick + '님 계정을 만들었어요.\n닉네임: ' + r.member.nick + '\n임시 비밀번호: ' + r.pin + ' (24시간 안에 로그인해서 바꿔 주세요)', url: LZ.APP_URL })) + '\'>카톡으로 알려 주기</button>' }); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.screens.gifts = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('7일 선물', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('giftList', {}); if (!alive()) return; var g = d.gift;
      root.innerHTML = LZ.hdr('7일 선물', { back: true }) + '<div class="wrap"><div class="card"><h3>🎁 이번 달 ' + g.used + '/' + g.max + '명</h3><p class="muted" style="margin:0">내 클럽 회원 중 체험회원과 남은 기간 10일 이하인 정회원께 ' + g.days + '일을 드려요. 받는 분은 누구에게서든 한 달에 한 번이에요.</p>' + (g.list.length ? '<p class="muted small" style="margin:6px 0 0">이번 달: ' + g.list.map(function (x) { return esc(x.nick); }).join(', ') + '</p>' : '') + '</div>' +
        '<div class="card"><h3>선물할 수 있는 분</h3><div class="list">' + (d.list.length ? d.list.map(function (w) { return '<div class="it"><div class="av">' + esc(w.nick.charAt(0)) + '</div><div class="t"><b>' + esc(w.nick) + '님 <span class="chip">' + esc(w.kindName) + '</span></b><span class="muted">' + (w.end ? LZ.fmtYmd(w.end) + '까지' + (w.left !== null ? ' · ' + (w.left < 0 ? '끝남' : w.left + '일 남음') : '') : '') + '</span></div>' + (w.got ? '<span class="chip off">이달 받음</span>' : '<button type="button" class="sm2" data-act="giftGo" data-v="' + esc(w.uid) + '">선물</button>') + '</div>'; }).join('') : '<div class="empty">지금 선물할 수 있는 분이 없어요.</div>') + '</div></div></div>';
    }
  };
  LZ.act.giftGo = async function (el, uid) { try { var r = await LZ.api('gift', { uid: uid }); LZ.toast(r.member.nick + '님께 7일을 드렸어요 · ' + LZ.fmtYmd(r.member.end) + '까지', 4000); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };

  /* 의견 보내기 */
  LZ.screens.feedback = {
    tab: 'me',
    show: function (p, root) { root.innerHTML = LZ.hdr('의견 보내기', { back: true }) + '<div class="wrap"><div class="card"><p class="muted" style="margin-top:0">불편한 점, 바라는 점을 짧게 적어 주세요. 누가 보냈는지는 남지 않고 관리자만 읽어요. 하루 5번까지.</p><textarea id="fbt" maxlength="200" rows="4" placeholder="예: 홀 표 글씨가 조금 더 컸으면 좋겠어요"></textarea><button type="button" class="btn" data-act="fbSend">보내기</button></div></div>'; }
  };
  LZ.act.fbSend = async function () { try { await LZ.api('feedback', { text: $('#fbt').value }); LZ.toast('고마워요. 잘 읽을게요 🙏', 3000); LZ.back(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };

  /* 알림 설정 */
  var NK = { pay: '결제 신청', refund: '환불 신청', qna: '문의', pw: '비밀번호 찾기 신청', mreq: '클럽 가입 신청', club: '클럽 소식', course: '코스 정보 변경', gift: '선물', round: '라운드', join: '새 회원', fb: '회원 의견', payok: '결제 승인', digest: '주간 점검·월간 요약' };
  LZ.screens.notiCfg = {
    tab: 'me',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('알림 설정', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('notiCfg', {}); if (!alive()) return; NC = d; var c = d.cfg, isCap = S.user.kind === 'admin' || (S.me.moims || []).some(function (x) { return x.role === 'cap'; });
      var perm = ('Notification' in window) ? Notification.permission : 'none', canPush = 'serviceWorker' in navigator && 'PushManager' in window && !!d.vapid;
      root.innerHTML = LZ.hdr('알림 설정', { back: true }) + '<div class="wrap">' +
        '<div class="card"><h3>📱 앱 푸시</h3><p class="muted" style="margin:0 0 6px">' + (canPush ? (perm === 'denied' ? '휴대폰 설정에서 이 앱의 알림이 꺼져 있어요. 설정 → 알림에서 켜 주세요.' : LZ.pwa && LZ.pwa.isIOS && !LZ.pwa.standalone() ? '아이폰은 "홈 화면에 추가"한 뒤에 알림을 받을 수 있어요.' : '앱을 닫아도 알림이 와요. 휴대폰 ' + d.pushN + '대에 켜져 있어요.') : '이 브라우저는 푸시를 지원하지 않거나 서버 준비가 안 됐어요.') + '</p><div class="tgl"><span>이 휴대폰에서 푸시 받기</span>' + LZ.sw(c.push && d.pushN, 'pushTgl', '', !canPush || perm === 'denied') + '</div></div>' +
        (isCap ? '<div class="card"><h3>💬 카카오톡으로 받기</h3><p class="muted" style="margin:0 0 6px">' + (d.kakaoKey ? '카카오 "나에게 보내기"로 같은 알림을 카톡으로도 받아요. 앱을 안 열어도 돼요.' : '관리자가 카카오 앱 키를 넣으면 쓸 수 있어요.') + '</p>' + (d.kakaoLinked ? '<div class="tgl"><span>카카오톡으로도 받기<span class="muted">' + LZ.fmtDate(d.kakaoAt) + ' 연결됨</span></span>' + LZ.sw(c.kakao, 'kakaoTgl') + '</div><button type="button" class="btn g sm" data-act="kakaoUnlink">연결 끊기</button>' : (d.kakaoKey ? '<button type="button" class="btn kakao" data-act="kakaoLinkGo">카카오 연결하기</button>' : '')) + '</div>' : '') +
        '<div class="card"><h3>받을 알림</h3>' + d.kinds.map(function (k) { return '<div class="tgl"><span>' + esc(NK[k] || k) + '</span>' + LZ.sw(c.kinds[k] !== 0, 'kindTgl', k) + '</div>'; }).join('') + '</div>' +
        '<div class="card"><div class="tgl"><span>조용한 시간<span class="muted">밤 10시~아침 7시 알림은 아침 7시에 모아서 보내요</span></span>' + LZ.sw(c.quiet, 'quietTgl') + '</div></div>' +
        '<p class="hint">앱 안 알림함(🔔)에는 설정과 상관없이 모두 남아요.</p></div>';
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
      await LZ.api('pushSub', { sub: sub2.toJSON(), dev: LZ.devId().slice(0, 16) }); await setCfg({ push: 1 }); LZ.toast('이 휴대폰에서 푸시를 받아요 🔔', 3000);
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
