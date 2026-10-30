/* 관리자: 현황판 · 회원 · 결제 승인 · 환불 · 비밀번호 찾기 신청 · 설정(요금·계좌·볼스피드 기준·카카오 키) · 로고 · 기록 · 의견 · 클럽 전체 · 자주 묻는 질문 · 홍보 안내문 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var won = function (n) { return Number(n || 0).toLocaleString() + '원'; };
  function needAdmin() { if (!S.user || S.user.kind !== 'admin') { LZ.toast('관리자만 볼 수 있어요'); LZ.go('home', {}, { reset: true }); return false; } return true; }
  async function sure() { return LZ.sureDialog(); }

  /* 관리자 첫 화면(v7 #29): 맨 위 "지금 처리할 일" → 숫자 3개 → 여섯 그룹(들어가서 보기) */
  function gli(icon, title, sub, attrs) { return '<button type="button" class="li grow" ' + attrs + '>' + LZ.ic(icon, 'gi') + '<div class="t"><b>' + title + '</b><span class="su">' + sub + '</span></div>' + LZ.ic('chev') + '</button>'; }
  LZ.screens.dash = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('관리자', { back: true }) + LZ.skeleton(5);
      var d = await LZ.api('dash', {}); if (!alive()) return; DASH = d;
      var t = d.total, chip = function (label, n, to) { return '<button type="button" class="tchip' + (n ? ' on' : '') + '" data-go="' + to + '">' + label + ' ' + n + '</button>'; };
      root.innerHTML = LZ.hdr('관리자', { back: true }) + '<div class="wrap">' +
        '<div class="card todo"><h3>지금 처리할 일</h3><div class="tchips">' + chip('결제 확인', d.pending, 'pays') + chip('환불', d.refundReq, 'refunds') + chip('비밀번호', d.pwReq, 'pwreqs') + chip('문의', d.qnaOpen, 'qnaList') + (d.goldSoon ? chip('골드 만기', d.goldSoon + '명', 'goldList') : '') + (d.blackSoon ? '<button type="button" class="tchip on" data-act="mbGo" data-v="_black">블랙 삭제 예정 ' + d.blackSoon + '</button>' : '') + (d.ptOwe ? '<button type="button" class="tchip on warn" data-go="ptOwe">포인트 회수 부족 ' + d.ptOwe + '명</button>' : '') + (d.soon.length ? '<button type="button" class="tchip on" data-go="adminGroup" data-p=\'{"g":"log"}\'>곧 끝나는 회원 ' + d.soon.length + '</button>' : '') + '</div></div>' +
        '<div class="kv dkv"><div><b>' + t.all + '</b><span>회원</span></div><div><b>' + d.moims.length + '</b><span>클럽</span></div><div><b>' + d.today + '</b><span>오늘</span></div></div>' +
        '<div class="card tight groups">' +
        gli('user', '회원', '만들기 · 회원권 지급 · 블랙 · 테스트 계정' + (d.tests ? ' ' + d.tests : ''), 'data-go="members"') +
        gli('check', '결제·환불·포인트', '입금 확인 ' + d.pending + ' · 환불 ' + d.refundReq + ' · 포인트 주기 · 이달 ' + won(d.month.amount), 'data-go="adminGroup" data-p=\'{"g":"pay"}\'') +
        gli('seat', '클럽·회원권', '클럽별 자리 · 무료 연장 · 골드 회수 · 골드 만기' + (d.goldSoon ? ' ' + d.goldSoon : ''), 'data-go="adminSeats"') +
        gli('gear', '설정', '금액 · 볼스피드 기준 · 포인트·레벨·블랙 · 카카오', 'data-go="adminCfg"') +
        gli('chat', '공지·홍보', '공지 · 홍보 안내문 · 자주 묻는 질문', 'data-go="adminGroup" data-p=\'{"g":"promo"}\'') +
        gli('book', '기록·현황', '오늘 · 이달 결제 · 곧 끝나는 회원 · 활동 기록', 'data-go="adminGroup" data-p=\'{"g":"log"}\'') +
        '</div></div>';
    }
  };
  var DASH = null;
  LZ.screens.adminGroup = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      var G = { pay: '결제·환불·포인트', promo: '공지·홍보', log: '기록·현황' }, g = p.g || 'log';
      root.innerHTML = LZ.hdr(G[g] || '관리자', { back: true }) + LZ.skeleton(4);
      var d = DASH; if (!d || g !== 'promo') { d = await LZ.api('dash', {}); if (!alive()) return; DASH = d; }
      var t = d.total, badge = function (n) { return n ? ' <i class="bdg">' + n + '</i>' : ''; }, body = '';
      if (g === 'pay') body = '<div class="card tight groups">' + gli('check', '결제 승인' + badge(d.pending), '입금 확인 후 승인 · 비밀번호 재확인', 'data-go="pays"') + gli('back', '환불 신청' + badge(d.refundReq), '확인 후 환불 처리', 'data-go="refunds"') + gli('coin', '포인트 주기·회수', '회원 찾기 · 사유 적기 · 회원님께 알림', 'data-go="ptGive"') + (d.ptOwe ? gli('coin', '포인트 회수 부족' + badge(d.ptOwe), '환불 때 다 거두지 못한 적립 포인트', 'data-go="ptOwe"') : '') + '</div>' +
        '<div class="card"><h3>이달 결제 (' + esc(d.month.label) + ')</h3><div class="kv"><div><b>' + d.month.count + '</b><span>건</span></div><div><b>' + won(d.month.amount) + '</b><span>결제</span></div><div><b>' + won(d.month.net) + '</b><span>환불 뺀 금액</span></div></div></div>';
      else if (g === 'promo') body = '<div class="card tight groups">' + gli('note', '공지 관리', '모든 회원님께 보이는 공지', 'data-go="notices" data-p=\'{"manage":1}\'') + gli('chat', '홍보 안내문', '카톡·문자로 보낼 가입 안내 글 · QR', 'data-go="promo"') + gli('help', '자주 묻는 질문', '문의 화면 위에 보이는 질문과 답', 'data-go="faqAdmin"') + gli('ball', '파크골프 첫걸음', '처음 오신 분께 보이는 안내 카드 6장', 'data-go="firstAdmin"') + gli('trophy', '시상식 안내', '상 종류·차례를 알려 주는 안내 카드 6장', 'data-go="firstAdmin" data-p=\'{"g":"awards"}\'') + gli('lock', '비밀번호 찾기 신청' + badge(d.pwReq), '임시 번호 24시간', 'data-go="pwreqs"') + '</div>';
      else body = '<div class="card"><h3>오늘</h3><div class="kv"><div><b>' + d.today + '</b><span>오늘 사용</span></div><div><b>' + d.joinsToday + '</b><span>오늘 가입</span></div><div><b>' + t.all + '</b><span>회원 전체</span></div></div><div class="kv" style="margin-top:6px"><div><b>' + (t.blue || 0) + '</b><span>블루</span></div><div><b>' + (t.red || 0) + '</b><span>레드</span></div><div><b>' + (t.gold || 0) + '</b><span>골드</span></div></div><p class="muted" style="margin:8px 0 0">최근 30일 가입 ' + d.conv.joined + '명 중 결제 ' + d.conv.paid + '명 · 직접 가입 ' + d.conv.self + '명</p></div>' +
        (d.soon.length ? '<div class="card"><h3>곧 끝나는 회원</h3><div class="list">' + d.soon.map(function (u) { return '<div class="it"><div class="t"><b>' + esc(u.nick) + '</b><span class="muted">' + esc(u.kindName) + ' · ' + (u.left === 0 ? '오늘까지' : u.left + '일 남음') + '</span></div></div>'; }).join('') + '</div></div>' : '') +
        '<div class="card"><h3>클럽 ' + d.moims.length + '개</h3><div class="list">' + d.moims.slice(0, 8).map(function (m) { return '<button type="button" class="li" data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.official ? ' <span class="chip cap">공식</span>' : '') + '</b><span class="su">캡틴 ' + esc(m.captainNick || '—') + ' · 회원 ' + m.members + '명</span></div>' + LZ.ic('chev') + '</button>'; }).join('') + '</div><button type="button" class="btn g sm" data-go="moimAll">클럽 모두 보기</button></div>' +
        '<div class="card tight groups">' + gli('note', '활동 기록', '누가 언제 무엇을 했는지', 'data-go="log"') + '</div>';
      root.innerHTML = LZ.hdr(G[g] || '관리자', { back: true }) + '<div class="wrap">' + body + '</div>';
    }
  };

  /* ───── v7.0.1 포인트 주기·회수(관리자): 회원 찾기 → +/− 포인트 → 사유(20자) → 관리자 비밀번호로 확인 → 회원님 내역 "관리자 지급/회수 · 사유" + 알림 ───── */
  var PA = { uid: '', q: '', list: null, d: null, sign: 1, amt: '', why: '', clear: 0 };
  function paForm(d) {
    var m = d.member, ow = d.owe || { tot: 0, list: [] }, neg = PA.sign < 0, unit = m.unit || 10;
    return '<div class="card ptwho"><div class="pthd"><div class="av">' + esc(m.nick.charAt(0)) + '</div><div class="t"><b>' + esc(m.nick) + '</b><span class="su">' + esc(m.kindName) + ' · 레벨 ' + esc(m.lvName) + '</span></div><button type="button" class="sm2 g" data-act="paReset">다른 회원</button></div>' +
        '<div class="kv"><div><b>' + Number(m.bal).toLocaleString('ko-KR') + 'P</b><span>쓸 수 있는</span></div><div><b>' + Number(m.tot).toLocaleString('ko-KR') + 'P</b><span>모은 포인트</span></div></div></div>' +
      (ow.tot ? '<div class="card owec"><h3 class="ih">' + LZ.ic('coin') + '환불 회수 부족 ' + ow.tot.toLocaleString('ko-KR') + 'P</h3><p class="muted" style="margin:0 0 6px">환불할 때 이미 쓰신 적립 포인트라 다 거두지 못했어요. 남은 포인트에서 거두거나, 거두지 않고 정리할 수 있어요.</p>' +
        ow.list.map(function (x) { return '<div class="owe1"><span>' + esc(x.day) + (x.plan ? ' · ' + esc(x.plan) : '') + '</span><b>' + x.owe.toLocaleString('ko-KR') + 'P</b></div>'; }).join('') +
        '<div class="row"><button type="button" class="btn o sm" data-act="paOwe" data-v="take"' + (m.bal >= 1 ? '' : ' disabled') + '>남은 포인트에서 회수</button><button type="button" class="btn g sm" data-act="paOwe" data-v="free">거두지 않고 정리</button></div></div>' : '') +
      '<div class="card"><h3>' + (neg ? '포인트 회수' : '포인트 주기') + '</h3><div class="flt" role="tablist"><button type="button" role="tab" class="' + (neg ? '' : 'on') + '" aria-selected="' + !neg + '" data-act="paSign" data-v="1">' + LZ.ic('plus') + ' 주기</button><button type="button" role="tab" class="' + (neg ? 'on' : '') + '" aria-selected="' + neg + '" data-act="paSign" data-v="-1">− 회수</button></div>' +
        '<label class="lb" for="paAmt">포인트</label><div class="paamt"><b class="pasg ' + (neg ? 'neg' : '') + '">' + (neg ? '−' : '+') + '</b><input id="paAmt" class="in num" type="tel" inputmode="numeric" maxlength="6" placeholder="예) 100" value="' + esc(PA.amt) + '"><span>P</span></div>' +
        '<div class="chips paq">' + [10, 50, 100, 500].map(function (n) { return '<button type="button" class="chip" data-act="paQuick" data-v="' + n + '">' + n + 'P</button>'; }).join('') + '</div>' +
        '<label class="lb" for="paWhy">사유 <span class="muted small" id="paCnt">' + PA.why.length + '/20</span></label><input id="paWhy" class="in" maxlength="20" placeholder="예) 행사 참여 감사" value="' + esc(PA.why) + '">' +
        '<p class="hint" style="margin:6px 0 0">회원님 내역에 <b>관리자 ' + (neg ? '회수' : '지급') + ' · 사유</b>로 보이고 알림이 가요.' + (neg ? ' 회수하면 모은 포인트(레벨)도 줄어요. 쓸 수 있는 포인트(' + Number(m.bal).toLocaleString('ko-KR') + 'P)까지만 돼요.' : ' 받은 날부터 기간이 시작돼요.') + ' 쓸 때는 ' + unit + 'P 단위예요.</p>' +
        (neg && ow.tot ? '<div class="tgl"><span>회수 부족 갚기로 기록<span class="muted">부족 ' + ow.tot.toLocaleString('ko-KR') + 'P에서 뺄게요</span></span>' + LZ.sw(!!PA.clear, 'paClear') + '</div>' : '') +
        '<button type="button" class="btn' + (neg ? ' red' : '') + '" data-act="paGo">' + LZ.ic('check') + (neg ? '포인트 회수' : '포인트 주기') + '</button></div>' +
      (d.recent && d.recent.length ? '<div class="card tight"><h3>최근 관리자 지급·회수</h3>' + d.recent.map(function (x) { return '<div class="owe1"><span>' + esc(x.day) + ' · ' + esc(x.why || '') + '</span><b class="' + (x.amt < 0 ? 'neg' : 'pos') + '">' + (x.amt < 0 ? '−' : '+') + Math.abs(x.amt).toLocaleString('ko-KR') + 'P</b></div>'; }).join('') + '</div>' : '');
  }
  function paList() {
    var l = PA.list;
    return '<div class="card"><label class="lb" for="paQ">회원 찾기</label><input type="search" id="paQ" class="in" placeholder="닉네임 일부를 넣어 주세요" value="' + esc(PA.q) + '" autocomplete="off"><div class="list" id="paL">' + paRows(l) + '</div></div>';
  }
  function paRows(l) {
    if (!l) return '<p class="muted" style="margin:8px 0 0">닉네임을 한 글자 이상 넣으면 아래에 나와요.</p>';
    if (!l.length) return '<p class="muted" style="margin:8px 0 0">찾는 회원이 없어요.</p>';
    return l.map(function (u) { return '<button type="button" class="li" data-act="paPick" data-v="' + esc(u.uid) + '"><div class="t"><b>' + esc(u.nick) + '</b><span class="su">' + esc(u.kindName) + ' · 쓸 수 있는 ' + Number(u.bal).toLocaleString('ko-KR') + 'P</span></div>' + LZ.ic('chev') + '</button>'; }).join('');
  }
  var paT = null;
  LZ.screens.ptGive = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      if (p.uid && p.uid !== PA.uid) { PA.uid = p.uid; PA.d = null; PA.amt = ''; PA.why = ''; PA.sign = 1; PA.clear = 0; }
      if (p.owe) { PA.sign = p.owe === 'take' ? -1 : 1; PA.clear = 1; }
      root.innerHTML = LZ.hdr('포인트 주기', { back: true }) + LZ.skeleton(3);
      if (PA.uid) { var d = await LZ.api('ptLook', { uid: PA.uid }); if (!alive()) return; PA.d = d; }
      root.innerHTML = LZ.hdr('포인트 주기', { back: true }) + '<div class="wrap">' + (PA.uid && PA.d ? paForm(PA.d) : paList()) + '</div>';
      var q = $('#paQ'); if (q) q.addEventListener('input', function () {
        PA.q = this.value; clearTimeout(paT);
        paT = setTimeout(async function () { var v = LZ.stripNick(PA.q); if (!v) { PA.list = null; } else { try { PA.list = (await LZ.api('ptLook', { q: v })).list; } catch (e) { LZ.toast(LZ.errText(e)); return; } } var L = $('#paL'); if (L && LZ.cur().name === 'ptGive') L.innerHTML = paRows(PA.list); }, 250);
      });
      var a = $('#paAmt'); if (a) a.addEventListener('input', function () { this.value = this.value.replace(/[^\d]/g, '').slice(0, 6); PA.amt = this.value; });
      var w = $('#paWhy'); if (w) w.addEventListener('input', function () { PA.why = this.value; var c = $('#paCnt'); if (c) c.textContent = this.value.length + '/20'; });
    }
  };
  LZ.act.paPick = function (el, uid) { LZ.go('ptGive', { uid: uid }, { replace: true }); };
  LZ.act.paReset = function () { PA.uid = ''; PA.d = null; PA.amt = ''; PA.why = ''; PA.clear = 0; PA.sign = 1; LZ.go('ptGive', {}, { replace: true }); };
  LZ.act.paSign = function (el, v) { PA.sign = +v < 0 ? -1 : 1; if (PA.sign > 0) PA.clear = 0; LZ.redraw(); };
  LZ.act.paQuick = function (el, v) { PA.amt = String((Number(PA.amt) || 0) + Number(v)); var a = $('#paAmt'); if (a) a.value = PA.amt; };
  LZ.act.paClear = function (el) { PA.clear = PA.clear ? 0 : 1; LZ.flip(el); };
  LZ.act.paOwe = async function (el, v) {
    var d = PA.d; if (!d) return; var ow = d.owe.tot;
    if (v === 'take') { PA.sign = -1; PA.clear = 1; PA.amt = String(Math.min(ow, d.member.bal)); PA.why = PA.why || '환불 부족분 회수'; LZ.redraw(); return; }
    if (!(await LZ.confirm('거두지 않고 정리할까요?', d.member.nick + '님의 회수 부족 ' + ow.toLocaleString('ko-KR') + 'P를 거두지 않고 0으로 정리해요. 회원님의 포인트는 그대로예요.', '정리하기'))) return;
    await paSend(0, '거두지 않고 정리', 1);
  };
  /* 관리자 비밀번호로 확인 → 보내기(같은 요청을 두 번 보내지 않게 key) */
  async function paSend(amt, why, clear) {
    var m = PA.d.member, title = !amt ? '회수 부족 정리' : amt > 0 ? '포인트 주기' : '포인트 회수';
    var ok = await LZ.dialog({ title: title, html: '<div class="box" style="margin-top:0"><b>' + esc(m.nick) + '</b>님 · ' + (amt ? '<b class="' + (amt < 0 ? 'neg' : 'pos') + '">' + (amt < 0 ? '−' : '+') + Math.abs(amt).toLocaleString('ko-KR') + 'P</b>' : '부족 ' + PA.d.owe.tot.toLocaleString('ko-KR') + 'P를 0으로') + '<br>사유: ' + esc(why) + '</div><p class="muted">관리자 비밀번호를 넣으면 바로 처리해요.</p><input type="password" inputmode="numeric" maxlength="6" class="in" id="paPin" placeholder="관리자 비밀번호 6자리" autocomplete="off">', cancel: null, focus: '#paPin',
      buttons: [{ label: '확인', kind: amt < 0 ? 'r' : 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] });
    var pin = ok === 'ok' ? (LZ.dlgVals && LZ.dlgVals.paPin) || '' : null; if (pin === null) return;
    if (!/^\d{6}$/.test(pin)) { LZ.toast('관리자 비밀번호 6자리를 넣어 주세요.'); return; }
    try { await LZ.api('sure', { pin: pin }, { noSure: true }); } catch (e) { LZ.toast(LZ.errText(e), 4000); return; }
    var r = await LZ.api('ptAdjust', { uid: m.uid, amt: amt, why: why, clear: clear ? 1 : 0, key: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
    PA.d.member.bal = r.info.bal; PA.d.member.tot = r.info.tot; PA.d.owe = r.owe; PA.amt = ''; PA.why = ''; PA.clear = 0; DASH = null;
    LZ.toast(!amt ? '회수 부족을 정리했어요' : m.nick + '님께 ' + (amt > 0 ? Math.abs(amt).toLocaleString('ko-KR') + 'P를 드렸어요' : Math.abs(amt).toLocaleString('ko-KR') + 'P를 회수했어요') + ' · 알림을 보냈어요', 3500);
    LZ.redraw();
  }
  LZ.act.paGo = async function () {
    var d = PA.d; if (!d) return; var n = Math.round(Number(($('#paAmt') || {}).value || PA.amt)), why = String(($('#paWhy') || {}).value || PA.why).replace(/\s+/g, ' ').trim();
    if (!(n > 0)) { LZ.toast('포인트를 숫자로 넣어 주세요.'); var a = $('#paAmt'); if (a) a.focus(); return; }
    if (!why) { LZ.toast('사유를 적어 주세요. 회원님 내역에 그대로 보여요.'); var w = $('#paWhy'); if (w) w.focus(); return; }
    if (PA.sign < 0 && n > d.member.bal) { LZ.toast(d.member.nick + '님의 쓸 수 있는 포인트는 ' + Number(d.member.bal).toLocaleString('ko-KR') + 'P예요.', 4000); return; }
    PA.amt = String(n); PA.why = why;
    await paSend(PA.sign * n, why, PA.sign < 0 && PA.clear && d.owe.tot ? 1 : 0);
  };
  /* ───── v7.0.1 포인트 회수 부족(현황판 알림 칩): 환불할 때 이미 쓴 적립을 다 거두지 못한 회원 ───── */
  LZ.screens.ptOwe = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('회수 부족', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('ptOwe', {}); if (!alive()) return;
      root.innerHTML = LZ.hdr('회수 부족', { back: true }) + '<div class="wrap"><p class="muted" style="margin:0 0 8px">결제를 환불했는데 그 결제로 받은 적립 포인트를 이미 쓰셔서 다 거두지 못한 회원이에요. 회원을 눌러 남은 포인트에서 거두거나, 거두지 않고 정리해 주세요. 회원님이 나중에 되돌려 받는 포인트에서도 먼저 거둬요.</p>' +
        (d.list.length ? '<div class="card tight">' + d.list.map(function (x) { return '<button type="button" class="li" data-go="ptGive" data-p=\'' + esc(JSON.stringify({ uid: x.uid })) + '\'><div class="t"><b>' + esc(x.nick) + '</b><span class="su">부족 ' + x.owe.toLocaleString('ko-KR') + 'P · 쓸 수 있는 ' + Number(x.bal).toLocaleString('ko-KR') + 'P · ' + esc(x.day) + (x.n > 1 ? ' 외 ' + (x.n - 1) + '건' : '') + '</span></div>' + LZ.ic('chev') + '</button>'; }).join('') + '</div>'
          : '<div class="card"><p class="muted" style="margin:0">회수 부족이 남은 회원이 없어요.</p></div>') + '</div>';
    }
  };

  /* ───── 홍보 안내문(관리자 전용): 친구 추천 없이 가입 유도 ───── */
  LZ.screens.promo = {
    tab: 'me',
    show: function (p, root) {
      if (!needAdmin()) return;
      var url = LZ.APP_URL + '?join=1', saved = store.get('lz.promo') || '';
      var def = '파크골프 공략수첩\n\n스크린 파크골프, 홀마다 어디로 얼마나 쳐야 할지 매번 헷갈리셨죠?\n공략수첩은 홀별 좌우·볼스피드를 적어 두고, 클럽 회원들의 기록과 평균까지 한눈에 봐요.\n\n✔ 홀 표 한 장에 내 공략 · 회원 공략 · 클럽 평균\n✔ 아마추어·프로·마스터 모드 자동 환산\n✔ 필드 라운드: 파크골프·일반골프 스코어도 기록, 한 조가 같이 적기\n✔ 단체 라운드 상황판과 시상식까지\n\n🎁 ' + ((S.me && S.me.seat && S.me.seat.promo) || '가입은 무료') + '\n\n👇 아래 링크를 누르면 바로 가입 화면이 열려요\n' + url;
      var text = saved || def;
      root.innerHTML = LZ.hdr('홍보 안내문', { back: true }) + '<div class="wrap"><div class="card"><p class="muted" style="margin-top:0">카카오톡·문자로 보낼 가입 안내 글이에요. 링크를 누르면 가입 화면이 바로 열려요. 글은 자유롭게 고쳐 쓰고, 이 휴대폰에 저장돼요.</p><textarea id="promoT" rows="14" maxlength="1000">' + esc(text) + '</textarea><div class="row"><button type="button" class="btn kakao" data-act="promoShare">카톡으로 보내기</button><button type="button" class="btn g" data-act="promoCopy">복사</button></div><div class="row"><button type="button" class="btn g sm" data-act="promoSms">문자로 보내기</button><button type="button" class="btn g sm" data-act="promoReset">처음 글로</button></div></div>' +
        '<div class="card"><h3>가입 홍보 공지</h3><p class="muted" style="margin:0 0 8px">친구 초대와 상관없이 모든 회원님께 보이는 공지예요(맨 위 고정, 처음 한 번 팝업). 공지 안의 "가입 안내 보내기"로 회원님들이 주변에 퍼뜨릴 수 있어요.</p><button type="button" class="btn" data-act="promoJoin">가입 홍보 공지 올리기</button><button type="button" class="btn g sm" data-go="notices" data-p=\'{"manage":1}\'>공지 관리</button></div>' +
        '<div class="card"><h3>안내장 그림</h3><p class="muted" style="margin:0 0 8px">카톡·밴드·인쇄용 1080×1350 그림. QR이 들어 있어요.</p><button type="button" class="btn o" data-act="posterJoin">가입 안내장 그림 받기</button></div>' +
        '<div class="card"><h3>가입 링크 QR</h3><p class="muted" style="margin:0 0 8px">인쇄해서 매장에 붙여 두면 휴대폰 카메라로 찍고 바로 가입해요.</p><div class="qr" id="pqr"></div><p class="center muted small">' + esc(url) + '</p><button type="button" class="btn g sm" data-act="copy" data-v="' + esc(url) + '">링크만 복사</button></div>' +
        '<div class="card"><h3>회원용 친구 초대 글</h3><p class="muted" style="margin:0">회원들이 친구를 초대하는 안내는 홈과 내 정보의 <b>친구 초대하기</b>에 있고, 공지 "친구 초대하기" 팝업으로도 보여 줄 수 있어요.</p><button type="button" class="btn g sm" data-go="notices" data-p=\'{"manage":1}\'>공지 관리로</button></div></div>';
      LZ.qr($('#pqr'), url);
      $('#promoT').addEventListener('input', function () { store.set('lz.promo', this.value); });
    }
  };
  function promoText() { return $('#promoT').value; }
  LZ.act.promoShare = function () { LZ.inviteSheet('공략수첩 가입 안내', promoText().replace(LZ.APP_URL + '?join=1', '').replace(/\s+$/, ''), LZ.APP_URL + '?join=1'); };
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
      var d = await LZ.api('members', { br: MB.br && !/^_(dormant|black|test)$/.test(MB.br) ? MB.br : '' }); if (!alive()) return; MB.d = d;
      var q = MB.q, list = d.members.filter(function (u) { return (!q || u.nick.indexOf(q) >= 0) && (MB.br !== '_dormant' || u.dormant) && (MB.br !== '_black' || u.kind === 'black') && (MB.br !== '_test' || u.test); });
      var tests = d.members.filter(function (u) { return u.test; }), blacks = d.members.filter(function (u) { return u.kind === 'black'; });
      var dorm = d.members.filter(function (u) { return u.dormant; });
      root.innerHTML = LZ.hdr('회원 ' + d.members.length + '명', { back: true, right: '<button type="button" class="ib on" data-act="mNew">＋ 만들기</button>' }) + '<div class="wrap">' +
        '<div class="row"><select id="mbr" class="in"><option value="">전체</option><option value="_staff"' + (MB.br === '_staff' ? ' selected' : '') + '>운영진</option><option value="_me"' + (MB.br === '_me' ? ' selected' : '') + '>클럽 없음</option><option value="_dormant"' + (MB.br === '_dormant' ? ' selected' : '') + '>휴면 (' + d.dormantDays + '일 넘게 안 옴)</option><option value="_black"' + (MB.br === '_black' ? ' selected' : '') + '>블랙 ' + blacks.length + '명</option><option value="_test"' + (MB.br === '_test' ? ' selected' : '') + '>테스트 ' + tests.length + '개</option>' + d.moims.map(function (m) { return '<option value="' + esc(m.id) + '"' + (MB.br === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select><input type="search" id="mq" class="in" placeholder="닉네임 찾기" value="' + esc(q) + '"></div>' +
        (MB.br === '_dormant' ? '<div class="card tight" style="margin:8px 0"><p class="muted" style="margin:0 0 8px">휴면 = ' + d.dormantDays + '일 넘게 안 들어온 분 (관리자·캡틴·레드·골드 기간이 남은 분은 제외). 블루 휴면은 매일 저절로 블랙이 되고, 다시 로그인하면 블루로 돌아와요. 여기서 바로 지울 수도 있어요.</p>' + (dorm.length ? '<button type="button" class="btn red sm" data-act="mPurge">휴면 회원 ' + dorm.length + '명 정리</button>' : '<p class="muted" style="margin:0">휴면 회원이 없어요.</p>') + '</div>' : '') +
        (MB.br === '_black' ? '<div class="card tight" style="margin:8px 0"><p class="muted" style="margin:0">블랙은 로그인·안내·문의만 할 수 있어요. 블랙이 된 지 <b>' + d.black.del + '일</b>이 지나면 저절로 지워지고(' + d.black.warn + '일 전에 알림), 등록한 코스·라운드 점수는 "탈퇴 회원"으로 남아요. 휴면 블랙은 다시 로그인하면 풀리고, 이용 정지는 관리자만 풀어요.</p></div>' : '') +
        (MB.br === '_test' ? '<div class="card tight testc" style="margin:8px 0"><h3 class="ih">' + LZ.ic('flask') + '테스트 계정 ' + tests.length + '개</h3><p class="muted" style="margin:0 0 8px">통계·순위·클럽 평균에서 빠져요. 한 번에 정리하면 계정과 내 수첩 기록·포인트가 지워지고, 캡틴인 클럽은 진짜 회원님께 넘기거나(없으면) 닫아요. 등록한 코스는 "탈퇴 회원"으로 남아요.</p>' + (tests.length ? '<button type="button" class="btn red sm" data-act="testPurge">테스트 계정 ' + tests.length + '개 한 번에 정리</button>' : '<p class="muted" style="margin:0">테스트 계정이 없어요. 회원을 눌러 "테스트 계정으로 표시"를 해 주세요.</p>') + '</div>' : '') +
        '<div class="list">' + list.slice(0, MB.show || 40).map(function (u) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-act="mOpen" data-v="' + esc(u.uid) + '"><div class="av ' + (u.online ? 'g' : '') + '">' + esc(u.nick.charAt(0)) + '</div><div class="t"><b>' + esc(u.nick) + LZ.dot(u) + ' <span class="chip">' + esc(u.tierName || u.kindName) + '</span>' + (!u.active ? '<span class="chip off">중지</span>' : '') + (u.kind === 'black' ? '<span class="chip off">' + (u.black && u.black.why === 'dorm' ? '휴면 블랙' : '정지') + '</span>' : '') + (u.test ? '<span class="chip gray">' + LZ.ic('flask') + '테스트</span>' : '') + (u.kid ? '<span class="chip kk">' + LZ.ic('kakao') + (u.kadm ? '관리자' : '') + '</span>' : '') + (u.dormant && u.kind !== 'black' ? '<span class="chip gray">휴면</span>' : '') + (u.pendingPay ? '<span class="chip cap">결제 대기</span>' : '') + '</b><span class="muted">' + [u.end ? LZ.fmtYmd(u.end) + '까지' : '', u.tmp ? '임시 번호' : '', u.isNew ? '새 회원' : '', '코스 ' + u.courses, u.black ? '삭제 ' + LZ.fmtYmd(u.black.del) : '', u.moims.length ? u.moims.join(', ') : '클럽 없음', u.sameDev ? '같은 폰 ' + u.sameDev : ''].filter(Boolean).join(' · ') + '</span></div><span>›</span></button>'; }).join('') + '</div>' + (!list.length ? '<div class="empty">없어요.</div>' : '') + (list.length > (MB.show || 40) ? '<button type="button" class="btn g sm" data-act="mMore">더 보기 (' + (list.length - (MB.show || 40)) + '명)</button>' : '') + '</div>';
      $('#mbr').addEventListener('change', function () { MB.br = this.value; MB.show = 0; LZ.redraw(); });
      $('#mq').addEventListener('input', function () { MB.q = LZ.stripNick(this.value); $$('.list .it').forEach(function (b) { b.hidden = MB.q && b.querySelector('b').textContent.indexOf(MB.q) < 0; }); });
    }
  };
  LZ.act.mPurge = async function () {
    var dorm = (MB.d ? MB.d.members : []).filter(function (u) { return u.dormant; }); if (!dorm.length) return;
    var html = '<h2>휴면 회원 정리</h2><p class="muted">지울 분만 체크해 주세요. 되돌릴 수 없어요.</p><div class="list" style="max-height:50vh;overflow:auto">' + dorm.map(function (u) {
      return '<label class="it" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><input type="checkbox" class="pk" value="' + esc(u.uid) + '" checked><span style="flex:1"><b>' + esc(u.nick) + '</b><br><span class="muted small">' + esc(u.tierName || u.kindName) + ' · 마지막 ' + (u.seenAt ? LZ.fmtDate(u.seenAt) : '없음 (가입 ' + LZ.fmtDate(u.created) + ')') + ' · 코스 ' + u.courses + '</span></span></label>'; }).join('') + '</div>' +
      '<button type="button" class="btn red" style="margin-top:12px" data-act="mPurgeOk">선택한 회원 삭제</button>';
    LZ.sheet(html);
  };
  LZ.act.mPurgeOk = async function () {
    var uids = $$('#layer .pk:checked').map(function (c) { return c.value; }); if (!uids.length) { LZ.toast('고른 분이 없어요'); return; }
    if (!(await LZ.confirm(uids.length + '명을 삭제할까요?', '기록·사진·클럽 소속이 모두 지워지고 되돌릴 수 없어요.', '삭제', 'r'))) return;
    try { var r = await LZ.api('mPurge', { uids: uids }); LZ.closeSheet(); LZ.toast(r.done.length + '명 삭제' + (r.skip.length ? ' · ' + r.skip.length + '명은 휴면이 아니라 건너뜀' : '')); LZ.redraw(); }
    catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.mbGo = function (el, v) { MB.br = v; MB.show = 0; LZ.go('members'); };
  LZ.act.testPurge = async function () {
    var n = (MB.d ? MB.d.members : []).filter(function (u) { return u.test; }).length; if (!n) return;
    if (!(await LZ.confirm('테스트 계정 ' + n + '개를 정리할까요?', '계정·내 수첩 기록·포인트가 지워지고 되돌릴 수 없어요. 등록한 코스는 남아요.', '정리', 'r'))) return;
    try { var r = await LZ.api('testPurge', {}); LZ.toast('테스트 계정 ' + r.done.length + '개를 정리했어요', 4000); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.mMore = function () { MB.show = (MB.show || 40) + 40; LZ.redraw(); };
  LZ.act.mNew = async function () {
    var ms = MB.d ? MB.d.moims : [];
    LZ.sheet('<h2>회원 만들기</h2><label class="lb" style="margin-top:0">닉네임</label><input type="text" id="cn" maxlength="8"><label class="lb">종류</label>' + LZ.seg([['blue', '블루'], ['red', '레드(회원권 1장)'], ['gold', '골드(회원권 1장)']], 'blue', 'mNewKind') + '<input type="hidden" id="ck" value="blue"><label class="lb">클럽</label><select id="cm" class="in"><option value="">(없음)</option>' + ms.map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</select><button type="button" class="btn" data-act="mNewGo">만들기</button><p class="hint">임시 비밀번호 4자리가 나와요. 24시간 안에 로그인해서 바꿔야 해요.</p>');
  };
  LZ.act.mNewKind = function (el, v) { $('#ck').value = v; $$('[data-act="mNewKind"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.mNewGo = async function () { try { var r = await LZ.api('mCreate', { nick: $('#cn').value, kind: $('#ck').value, mid: $('#cm').value }); LZ.closeSheet(); showPin(r.member.nick, r.pin); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  function showPin(nick, pin) { LZ.dialog({ title: LZ.nim(nick) + ' 임시 비밀번호', html: '<div class="code" style="font-size:var(--t6)">' + esc(pin) + '</div><p class="muted center">24시간 안에 로그인해서 새 비밀번호로 바꿔야 해요. 새 계정은 3일 동안 로그인이 없으면 저절로 지워져요.</p><button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '파크골프 공략수첩', text: '파크골프 공략수첩 · ' + LZ.nim(nick) + '\n임시 비밀번호: ' + pin + '\n24시간 안에 로그인해서 새 비밀번호로 바꿔 주세요.', url: LZ.APP_URL })) + '\'>카톡으로 알려 주기</button>' }); }
  LZ.act.mOpen = function (el, uid) {
    var u = MB.d.members.filter(function (x) { return x.uid === uid; })[0]; if (!u) return;
    var isMe = u.uid === S.user.uid, adm = u.kind === 'admin';
    LZ.sheet('<h2>' + esc(u.nick) + LZ.dot(u) + ' <span class="chip">' + esc(u.tierName || u.kindName) + '</span></h2><p class="muted" style="margin:0 0 8px">' + (u.start ? LZ.fmtYmd(u.start) + ' ~ ' : '') + (u.end ? LZ.fmtYmd(u.end) : '기간 없음') + (u.left !== null && u.left !== undefined ? ' (' + (u.left < 0 ? '끝남' : u.left + '일 남음') + ')' : '') + ' · 가입 ' + LZ.fmtDate(u.created) + ' · 마지막 ' + (u.seenAt ? LZ.fmtDate(u.seenAt) : '—') + '<br>코스 ' + u.courses + ' · ' + LZ.lvBadge(u.pts) + ' 레벨 점수 ' + Number(u.pts || 0).toLocaleString('ko-KR') + '점 · 적립 포인트 ' + Number(u.bal || 0).toLocaleString('ko-KR') + 'P(모은 ' + Number(u.tot || 0).toLocaleString('ko-KR') + 'P) · 카카오 ' + (u.kid ? '확인' + (u.kadm ? '(관리자 카카오)' : '') : '안 함') + (u.black ? '<br><b>블랙</b>(' + (u.black.why === 'dorm' ? '휴면' : '이용 정지') + ') ' + LZ.fmtYmd(u.black.since) + ' · 삭제 예정 ' + LZ.fmtYmd(u.black.del) : '') + ' · ' + (u.moims.length ? u.moims.join(', ') : '클럽 없음') + (u.refNick ? ' · 추천인 ' + esc(u.refNick) : '') + (u.src === 'self' ? ' · 직접 가입' : '') + '</p>' +
      (u.img ? '<button type="button" class="sm2 g" data-act="mOp" data-v="' + uid + ':avatar">사진 지우기</button>' : '') + (isMe || adm ? '<p class="muted">관리자 계정은 여기서 바꾸지 않아요.</p>' : '<p class="su" style="margin:0 0 6px">' + (u.pass ? '블루 ' + u.pass.blue.total + '장(남음 ' + u.pass.blue.left + ') · 레드 ' + u.pass.red.n + '장 · 골드 ' + u.pass.gold.n + '장' : '') + ' · 운영 클럽 ' + (u.ownClubs || 0) + '개' + '</p><div class="row"><button type="button" class="btn o sm" data-act="mGrant" data-v="' + uid + '">' + LZ.ic('plus') + '회원권 지급</button><button type="button" class="btn o sm" data-go="adminPacks" data-p=\'' + esc(JSON.stringify({ uid: uid })) + '\'>회원권 보기</button></div>' +
        '<div class="row"><button type="button" class="btn o sm" data-go="ptGive" data-p=\'' + esc(JSON.stringify({ uid: uid })) + '\'>포인트 주기·회수</button></div>' +
        '<div class="row"><button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':pin">임시 번호</button><button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':rename">닉네임 정리</button>' + (u.kind !== 'admin' ? '<button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':ref">추천인</button>' : '') + '</div>' +
        /* v7.1.0 §14 카카오 연결 풀기(언제든) · 카카오 확인 면제(카카오 없는 어르신) */
        '<div class="kmrow"><p class="su" style="margin:0 0 4px">' + LZ.ic('kakao') + ' 카카오: ' + (u.kid ? '연결됨' + (u.kadm ? ' · 관리자 카카오로 확인' : '') : u.kex ? '확인 면제' : u.needKid ? '연결 안 됨 · 다음 로그인 때 확인' : '연결 안 됨') + '</p><div class="row">' + (u.kid ? '<button type="button" class="btn o sm" data-act="mOp" data-v="' + uid + ':kunlink">카카오 연결 풀기</button>' : '') +
          '<button type="button" class="btn g sm" data-act="mOp" data-v="' + uid + ':kex">' + (u.kex ? '카카오 확인 면제 끄기' : '카카오 확인 면제') + '</button></div></div>' +
        '<div class="row"><button type="button" class="btn g sm" data-act="mOp" data-v="' + uid + ':test">' + LZ.ic('flask') + (u.test ? '테스트 표시 빼기' : '테스트 계정으로 표시') + '</button></div>' +
        '<div class="row"><button type="button" class="btn g sm" data-act="mOp" data-v="' + uid + ':active">' + (u.kind === 'black' ? '블랙 풀기' : '이용 정지(블랙)') + '</button><button type="button" class="btn red sm" data-act="mOp" data-v="' + uid + ':delete">계정 삭제</button></div>'));
  };
  /* v7.1.0 회원권 지급(관리자): 레드(기간 고름)·골드(지급일부터 365일), 장수, 넣을 곳(회원의 클럽 또는 보관) */
  LZ.act.mGrant = function (el, uid) {
    var u = MB.d.members.filter(function (x) { return x.uid === uid; })[0]; if (!u) return;
    LZ.sheet('<h2>회원권 지급 · ' + esc(u.nick) + '</h2><p class="muted">관리자가 무료로 드려요. 레드는 기간을 고르고, 골드는 늘 지급일부터 365일이에요(만기 30·14·7일 전에 관리자에게 연장 승인 알림).</p>' +
      '<label class="lb" style="margin-top:0">종류</label>' + LZ.seg([['red', '레드회원권'], ['gold', '골드회원권']], 'red', 'mgKind') + '<input type="hidden" id="mgk" value="red">' +
      '<label class="lb">장수</label>' + LZ.seg([['1', '1장'], ['2', '2장'], ['5', '5장'], ['10', '10장']], '1', 'mgN') + '<input type="hidden" id="mgn" value="1">' +
      '<div id="mgDays"><label class="lb">기간(레드)</label>' + LZ.seg(EXTS.map(function (x) { return [String(x), x + '일']; }), '365', 'mgD', 's') + '<input type="hidden" id="mgd" value="365"></div>' +
      '<label class="lb" for="mgm">넣을 곳</label><select id="mgm" class="in"><option value="">보관(회원이 나중에 클럽에 넣기)</option>' + (u.mids || []).map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="btn" data-act="mGrantGo" data-v="' + esc(uid) + '">' + LZ.ic('check') + '지급하기</button>');
  };
  LZ.act.mgKind = function (el, v) { $('#mgk').value = v; $$('[data-act="mgKind"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); var dz = $('#mgDays'); if (dz) dz.hidden = v === 'gold'; };
  LZ.act.mgN = function (el, v) { $('#mgn').value = v; $$('[data-act="mgN"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.mgD = function (el, v) { $('#mgd').value = v; $$('[data-act="mgD"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.mGrantGo = async function (el, uid) { var k = $('#mgk').value, n = +$('#mgn').value; try { await LZ.api('packAdmin', { op: 'grant', uid: uid, kind: k, n: n, mid: $('#mgm').value, days: +$('#mgd').value }); LZ.closeSheet(); LZ.toast((k === 'gold' ? '골드' : '레드') + '회원권 ' + n + '장을 드렸어요', 3500); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.mOp = async function (el, v) {
    var p = v.split(':'), uid = p[0], op = p[1], u = MB.d.members.filter(function (x) { return x.uid === uid; })[0], body = { uid: uid, op: op };
    if (op === 'extend') { var d = await LZ.dialog({ title: '관리자 지급 골드 늘리기', body: '끝나는 날에 더해요.', cancel: false, buttons: [30, 60, 90, 180, 365].map(function (x) { return { label: x + '일', kind: 'o', value: x }; }).concat([{ label: '취소', kind: 'g', value: null }]) }); if (!d) return; body.days = d; }
    if (op === 'rename') { var to = await LZ.dialog({ title: '닉네임 정리', html: '<input type="text" id="rn" class="in" maxlength="8" value="' + esc(u.nick) + '">', cancel: null, buttons: [{ label: '바꾸기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#rn').value : null; }); if (!to) return; body.to = to; }
    if (op === 'ref') { var rf = await LZ.dialog({ title: '추천인 정하기', html: '<input type="text" id="rf" class="in" maxlength="8" placeholder="추천인 닉네임 (비우면 지움)" value="' + esc(u.refNick || '') + '">', cancel: null, buttons: [{ label: '정하기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#rf').value : null; }); if (rf === null) return; body.to = rf; }
    if (op === 'active') { var blk = u.kind === 'black'; body.on = blk ? 1 : 0; if (!(await LZ.confirm(blk ? '블랙을 풀까요?' : '이용을 정지할까요?(블랙)', blk ? '블루로 돌아가 예전처럼 쓸 수 있어요.' : '로그인·안내·문의만 할 수 있어요. 캡틴이면 먼저 된 매니저(없으면 가장 오래 함께한 회원님)께 넘어가요. ' + ((MB.d.black || {}).del || 60) + '일 뒤 계정이 지워져요.', blk ? '풀기' : '정지', blk ? 'y' : 'r'))) return; }
    if (op === 'test') { body.on = u.test ? 0 : 1; }
    if (op === 'kunlink') { if (!(await LZ.confirm(LZ.nim(u.nick) + '의 카카오 연결을 풀까요?', '다른 카카오로 잘못 연결됐을 때 써요. 풀면 회원님이 다음에 본인 휴대폰에서 카카오로 다시 연결해야 기록·결제를 할 수 있어요(카카오 확인 면제면 그대로 써요).', '연결 풀기', 'r'))) return; }
    if (op === 'kex') { body.on = u.kex ? 0 : 1; if (body.on && !(await LZ.confirm('카카오 확인을 면제할까요?', '카카오를 쓰지 않는 어르신용이에요. 면제하면 카카오 연결 없이 모든 기능을 써요. 비밀번호를 잊으면 관리자 도움으로만 찾아요.', '면제하기'))) return; }
    if (op === 'avatar') { if (!(await LZ.confirm('프로필 사진을 지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('avatarDel', { uid: uid }); LZ.toast('지웠어요'); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } return; }
    if (op === 'delete') { if (!(await LZ.confirm('정말 삭제할까요?', LZ.nim(u.nick) + '의 기록·사진·클럽 소속이 모두 지워지고 되돌릴 수 없어요.', '삭제', 'r'))) return; }
    if (op === 'pin') { if (!(await LZ.confirm('임시 번호를 만들까요?', '지금 비밀번호는 못 쓰게 되고 모든 휴대폰에서 로그아웃돼요. 본인 확인 후에만 해 주세요.', '만들기'))) return; }
    try { var r = await LZ.api('mUpdate', body); LZ.closeSheet(); if (op === 'pin') showPin(u.nick, r.pin); else LZ.toast(op === 'kunlink' ? '카카오 연결을 풀었어요' : op === 'kex' ? (body.on ? '카카오 확인을 면제했어요' : '카카오 확인 면제를 껐어요') : '처리했어요'); LZ.redraw(); }
    catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };

  /* ───── 결제 승인 ───── */
  LZ.screens.pays = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('결제 승인', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('payList', {}); if (!alive()) return;
      PAYS = {}; d.pending.forEach(function (x) { PAYS[x.id] = x; });
      var row = function (x, pend) {   /* v7.1.0: "레드회원권 2장(20자리) · 오일클럽" / "보낸 돈 2,770원 · 포인트 1,230P · 김영희 (영희짱)" */
        var cashP = x.method !== 'point', who = cashP ? (x.depLabel || x.depositor || x.nick) : x.nick;
        return '<div class="card tight payrow"><b class="pn">' + esc(x.planName) + '</b>' +
          '<div class="pl">' + (cashP ? '보낸 돈 <b>' + won(x.cash) + '</b>' : '포인트로 냄') + (x.pts ? ' · 포인트 <b>' + Number(x.pts).toLocaleString() + 'P</b>' : '') + ' · <b class="depl">' + esc(who) + '</b></div>' +
          (pend && x.unsent ? '<div class="su warnt">예전 앱에서 신청 · 보냈는지 표시 안 함. 입금 내역을 꼭 확인해 주세요</div>' : '') +
          '<div class="muted">' + (cashP ? (x.method === 'bank' ? '계좌' : '카카오페이') + ' · ' : '') + LZ.fmtDate(x.created, true) + (pend ? '' : ' → ' + (x.status === 'ok' ? '확인됨 ' + esc(x.start) + '~' + esc(x.end) + (x.earn ? ' · 적립 ' + x.earn + 'P' : '') : x.status === 'refunded' ? '환불됨 ' + won(x.refund) : esc(x.stName || x.status))) + (x.refNick ? ' · 추천인 ' + esc(x.refNick) : '') + '</div>' +
          (pend ? '<p class="su" style="margin:6px 0 0">' + (x.method === 'bank' ? '통장' : '카카오페이') + ' 내역에서 <b>' + esc(x.depositor) + '</b> 이름으로 <b>' + won(x.cash) + '</b>이 들어왔는지 보고 눌러 주세요. 확인하면 적립 ' + Number(x.earnPre || 0).toLocaleString() + 'P도 함께 들어가요.</p><div class="row"><button type="button" class="btn sm" data-act="payOk" data-v="' + esc(x.id) + '">입금 확인</button><button type="button" class="btn g sm" data-act="payNo" data-v="' + esc(x.id) + '">반려</button></div>' : '') + '</div>';
      };
      root.innerHTML = LZ.hdr('결제 승인', { back: true }) + '<div class="wrap"><h3>기다리는 결제 ' + d.pending.length + '건</h3>' + (d.pending.length ? d.pending.map(function (x) { return row(x, true); }).join('') : '<div class="empty">없어요.</div>') + '<h3>최근 처리</h3>' + d.recent.map(function (x) { return row(x, false); }).join('') + '</div>';
    }
  };
  var PAYS = {};
  LZ.act.payOk = async function (el, id) { var x = PAYS[id]; if (!(await LZ.dialog({ title: '입금을 확인했나요?', html: (x ? '<div class="box"><b class="depl">보낸 분 ' + esc(x.depLabel || x.depositor) + '</b><br>' + won(x.cash) + ' · ' + (x.method === 'bank' ? '계좌' : '카카오페이') + ' · ' + esc(x.planName) + (x.unsent ? '<br><span class="warnt">예전 앱에서 신청 · 보냈는지 표시 안 함</span>' : '') + '</div>' : '') + '<p>확인하면 바로 회원권이 생기고(새 클럽은 클럽이 열리고)' + (x && x.earnPre ? ' 적립 ' + Number(x.earnPre).toLocaleString() + 'P가 들어가고,' : '') + ' 회원에게 알림이 가요.</p>', cancel: false, buttons: [{ label: '확인', kind: 'y', value: true }, { label: '취소', kind: 'g', value: false }] }))) return; try { await LZ.api('payDecide', { id: id, ok: 1 }); LZ.toast('승인했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); LZ.redraw(); } };
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
  LZ.act.refOk = async function (el, id) { if (!(await LZ.confirm('환불금을 보냈나요?', '처리하면 그 자리가 바로 없어지고, 쓴 포인트는 되돌리고 적립은 회수해요.', '환불 처리'))) return; try { await LZ.api('refundDecide', { id: id, ok: 1 }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); LZ.redraw(); } };
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
      var pwIn = function (id, val, min, max, lbl) { return '<label class="pwi"><span class="muted small">' + lbl + '</span><input type="number" inputmode="decimal" step="0.1" min="' + min + '" max="' + max + '" id="' + id + '" value="' + Number(val).toFixed(1) + '" class="num"></label>'; };
      var pwRow = function (k, name) { return '<div class="pwr3"><b>' + name + '</b>' + pwIn('pw_' + k + '_base', pw[k].base, 8, 40, '기준 볼스피드') + pwIn('pw_' + k + '_step', pw[k].step, 1, 10, '1당 비거리(m)') + '</div>'; };
      root.innerHTML = LZ.hdr('설정', { back: true }) + '<div class="wrap">' +
        acctCard(d) + seatCfgCard(d) + ptCfgCard(d) +
        '<div class="card"><h3>' + LZ.ic('check') + ' 받는 곳(송금)</h3><label class="lb" style="margin-top:0">카카오페이 QR 주소</label><textarea id="c_qr_red" rows="2" class="urlta" placeholder="https://qr.kakaopay.com/…">' + esc(c.qr_red || '') + '</textarea><label class="lb">은행</label><input type="text" id="c_bank_name" value="' + esc(c.bank_name) + '"><label class="lb">계좌번호</label><input type="tel" id="c_bank_no" value="' + esc(c.bank_no) + '"><label class="lb">예금주</label><input type="text" id="c_bank_holder" value="' + esc(c.bank_holder) + '"><button type="button" class="btn" data-act="cfgSave" data-v="qr_red,bank_name,bank_no,bank_holder">저장</button></div>' +
        '<div class="card"><h3>볼스피드 · 센서 탄도 기준</h3><p class="muted" style="margin:0 0 6px">총 비거리 = (기준 거리 + (볼스피드 − 모드 기준) × 1당 비거리) × (1 + 탄도 %). 모두 소수점 1자리. 바꾸면 모든 환산에 바로 적용돼요.</p>' +
          '<div class="pwr3 one">' + pwIn('pw_d0', pw.d0 === undefined ? 50 : pw.d0, 10, 200, '기준 거리(m) · 세 모드 공통') + pwIn('pw_gap', pw.gap === undefined ? 3 : pw.gap, 0, 10, '탄도 간격(%)') + '</div>' + pwRow('b', '아마추어') + pwRow('p', '프로') + pwRow('m', '마스터') +
          '<p class="hint" id="pwGapTxt" style="margin:4px 0 8px"></p><div class="box tblwrap" id="pwPrev"></div><button type="button" class="btn" data-act="cfgPw">저장</button></div>' +
        '<div class="card"><h3>가입 · 추천</h3><div class="tgl"><span>직접 가입 받기</span>' + LZ.sw(c.join_mode === 'on', 'cfgJoin') + '</div><label class="lb">하루 가입 한도</label><input type="tel" id="c_join_per_day" value="' + c.join_per_day + '"><label class="lb">동시 사용 인원(0 = 제한 없음)</label><input type="tel" id="c_seats" value="' + c.seats + '"><label class="lb">카카오 연결 풀기 간격(일) · 회원 스스로 풀 때</label><input type="tel" id="c_unlink_days" value="' + (c.unlink_days || 30) + '"><button type="button" class="btn" data-act="cfgSave" data-v="join_per_day,seats,unlink_days">저장</button></div>' +
        '<div class="card"><h3>문의 기능</h3>' + LZ.seg([['off', '끔'], ['test', '시험'], ['on', '켬']], c.qna_mode, 'cfgQna') + '<label class="lb">시험 회원(닉네임, 쉼표)</label><input type="text" id="c_qna_testers" value="' + esc(c.qna_testers) + '"><button type="button" class="btn g sm" data-act="cfgSave" data-v="qna_testers">저장</button></div>' +
        '<div class="card"><h3>카카오톡 알림(나에게 보내기)</h3><p class="muted" style="margin:0 0 6px">카카오 developers에서 만든 앱의 <b>REST API 키</b>를 넣고, 그 앱에 Redirect URI <code>' + esc(LZ.APP_URL) + '</code> 와 "카카오 로그인 · 카카오톡 메시지 전송(talk_message)" 동의 항목을 켜 주세요. 관리자와 캡틴이 알림 설정에서 연결해요.</p><p class="hint kcons">' + LZ.ic('user') + ' <span>동의 항목에서 <b>닉네임(profile_nickname) 필수</b>, <b>프로필 사진(profile_image) 선택</b>도 켜 주세요. 연결 직전에 "카카오 이름 ○○ 계정이에요. 본인 카카오가 맞나요?"를 보여 주는 데만 쓰고 저장하지 않아요.</span></p><textarea id="c_kakao_key" rows="2" class="urlta" placeholder="영문 소문자·숫자 32자" spellcheck="false" autocapitalize="off">' + esc(c.kakao_key) + '</textarea><button type="button" class="btn g sm" data-act="cfgSave" data-v="kakao_key">저장</button><p class="hint">이 키로 <b>카카오 본인 확인</b>(가입·비밀번호 찾기)도 해요 · 지금 ' + (d.kakaoOn ? '<b>켜짐</b>' : '꺼짐(키를 넣으면 가입 때 확인을 받아요)') + '</p>' +
          (d.kakaoOn && !(d.adm && d.adm.dep) ? '<div class="box">' + LZ.ic('shield') + ' <b>관리자 카카오</b>: ' + (d.adminKid ? '확인했어요 ✓ · 시험용 계정을 이 카카오로 몇 개든 가입할 수 있어요' : '관리자 본인 카카오로 확인하면 그 카카오로 시험용 계정을 여러 개 가입할 수 있어요') + '<button type="button" class="btn kakao sm" data-act="kidGo" style="margin-top:8px">' + LZ.ic('kakao') + (d.adminKid ? '다시 확인' : '관리자 카카오 확인') + '</button></div>' : '') + '<p class="hint">앱 푸시 열쇠(VAPID)는 서버가 자동으로 만들어요' + (c.vapid_pub ? ' · 준비됨 ✓' : ' · 첫 알림 때 만들어져요') + '</p></div>' +
        '<div class="card"><h3>로고</h3><p class="muted" style="margin:0 0 6px">로그인 화면 로고(밝은 화면·어두운 화면). png·jpg·webp.</p><div class="row"><label class="btn o sm" style="text-align:center">밝은 화면 로고<input type="file" accept="image/*" id="lg_light" hidden></label><label class="btn o sm" style="text-align:center">어두운 화면 로고<input type="file" accept="image/*" id="lg_dark" hidden></label></div><div class="row"><button type="button" class="btn g sm" data-act="logoReset" data-v="light">밝은 로고 되돌리기</button><button type="button" class="btn g sm" data-act="logoReset" data-v="dark">어두운 로고 되돌리기</button></div></div></div>';
      pwPreview(); depPaint();
      ['pw_d0', 'pw_gap', 'pw_b_base', 'pw_b_step', 'pw_p_base', 'pw_p_step', 'pw_m_base', 'pw_m_step'].forEach(function (id) { $('#' + id).addEventListener('input', pwPreview); });
      ['light', 'dark'].forEach(function (slot) { $('#lg_' + slot).addEventListener('change', async function () { var f = this.files[0]; if (!f) return; try { var data = await LZ.shrink(f, 600, 0.9); await LZ.api('logoPut', { slot: slot, data: data }); LZ.toast('로고를 올렸어요. 다음에 열 때 보여요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } }); });
    }
  };
  /* 미리 보기: 50·80·100m를 보내려면 모드·탄도별 볼스피드(0.5 단위로 반올림) — 설계안 3장 표와 같은 모양 */
  function pwRead() { var v = function (id) { return Number($('#' + id).value); }, o = { d0: v('pw_d0'), gap: v('pw_gap') }; ['b', 'p', 'm'].forEach(function (k) { o[k] = { base: v('pw_' + k + '_base'), step: v('pw_' + k + '_step') }; }); return o; }
  function pwPreview() {
    var el = $('#pwPrev'); if (!el) return; var pw = pwRead(), g = pw.gap, ok = pw.d0 > 0 && ['b', 'p', 'm'].every(function (k) { return pw[k].step > 0; });
    var gt = $('#pwGapTxt'); if (gt) gt.textContent = '더높게 +' + LZ.r1(2 * g) + '% · 높게 +' + LZ.r1(g) + '% · 보통 0 · 낮게 −' + LZ.r1(g) + '% · 더낮게 −' + LZ.r1(2 * g) + '%';
    if (!ok) { el.innerHTML = '<span class="muted">숫자를 넣으면 미리 보기가 나와요</span>'; return; }
    el.innerHTML = '<b>미리 보기 · 그 거리를 보내려면 볼스피드 얼마?</b><table class="tbl pwt"><tr><th>거리</th><th>모드</th>' + LZ.HLSEG.map(function (x) { return '<th>' + x[1] + '</th>'; }).join('') + '</tr>' +
      [50, 80, 100].map(function (m) { return ['b', 'p', 'm'].map(function (k, n) { return '<tr' + (n === 0 ? ' class="top1"' : '') + '>' + (n === 0 ? '<td rowspan="3"><b>' + m + 'm</b></td>' : '') + '<td>' + LZ.MODE[k] + '</td>' + LZ.HLSEG.map(function (x) { var s = LZ.clampP(LZ.half(LZ.sugRaw(m, k, x[0], pw))); return '<td class="' + (x[0] === 'm' ? 'mid' : '') + '">' + s.toFixed(1) + '</td>'; }).join('') + '</tr>'; }).join(''); }).join('') + '</table>';
  }
  LZ.act.cfgSave = async function (el, keys) { var body = {}; keys.split(',').forEach(function (k) { body[k] = $('#c_' + k).value; }); try { var r = await LZ.api('setCfg', body); CF = r; LZ.toast('저장했어요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.cfgPw = async function () { var pw = pwRead(); try { var r = await LZ.api('setCfg', { pw: pw }); CF = r; S.pw = r.pw; LZ.toast('볼스피드 · 센서 탄도 기준을 저장했어요'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.cfgJoin = async function () { try { CF = await LZ.api('setCfg', { join_mode: CF.cfg.join_mode === 'on' ? 'off' : 'on' }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.cfgQna = async function (el, v) { try { CF = await LZ.api('setCfg', { qna_mode: v }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.logoReset = async function (el, slot) { try { await LZ.api('logoReset', { slot: slot }); LZ.toast('되돌렸어요'); } catch (e) { LZ.toast(LZ.errText(e)); } };

  /* 적립 포인트·레벨·블랙 기준(v7.3 #21 #25): 화면의 모든 포인트 안내가 이 값으로 바뀌어요 */
  var PT_KEYS = ['pt_hole_new', 'pt_hole_fix', 'pt_course_reg', 'pt_course_fix', 'pt_claw_days', 'pt_import', 'pt_day_cap', 'pt_remind', 'pt_keep_months', 'lv_th', 'lv_mul', 'dorm_days', 'black_del_days', 'black_warn_days'];
  function ptCfgCard(d) {
    var v = d.pt || {}, nm = d.ptName || {};
    return '<div class="card"><h3>' + LZ.ic('star') + ' 적립 포인트 · 레벨 · 블랙</h3><p class="muted" style="margin:0 0 8px">적립률·사용 단위·유효 기간은 위 "회원권 기준"에서 정해요. 레벨은 레벨 점수(구매 적립 빼고) 기준이에요. 레벨은 5개(새싹·버디·이글·봉황·지존)를 쉼표로 넣어요.</p><div class="scfg">' +
      PT_KEYS.map(function (k) { var txt = /^(pt_remind|lv_th|lv_mul)$/.test(k); return '<label class="pwi' + (txt ? ' wide' : '') + '"><span class="muted small">' + esc(nm[k] || k) + '</span><input type="' + (txt ? 'text' : 'tel') + '" id="pt_' + k + '" value="' + esc(String(v[k] === undefined ? '' : v[k])) + '" class="num" inputmode="' + (txt ? 'text' : 'numeric') + '"></label>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-act="cfgPt">' + LZ.ic('check') + '포인트·레벨·블랙 저장</button></div>';
  }
  LZ.act.cfgPt = async function () { var o = {}; PT_KEYS.forEach(function (k) { o[k] = $('#pt_' + k).value; }); try { CF = await LZ.api('setCfg', { pt: o }); await LZ.refreshMe(); LZ.toast('포인트·레벨·블랙 기준을 저장했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* 회원권 기준(v7.1.0): 모든 금액·자리 수·기간·환불·알림·적립·안내 글은 여기서 → 앱 전체 표시가 함께 바뀜. 관리자 지급 골드(365일·30·14·7일 전 알림)는 고정 */
  var SEAT_KEYS = [['seat_price', '원'], ['club_price', '원'], ['gold_price', '원'], ['gold_years', ''], ['seat_size', '자리'], ['free_clubs', '장'], ['seat_days', ''], ['seat_max', '자리'], ['refund_days', ''], ['remind_days', ''], ['earn_pct', ''], ['point_unit', 'P'], ['point_years', '']];   // 이름에 단위가 있으면 빈칸
  /* v7.1.0 §13 관리자 계정 · 관리자 대리 — 회원에게 보이는 이름은 늘 이 이름. 대리 지명·거두기는 주 관리자만(그때마다 주 관리자 비밀번호) */
  function acctCard(d) {
    var a = d.adm || { main: 1 }, c = d.cfg;
    return '<div class="card acct" id="acctCard"><h3>' + LZ.ic('shield') + ' 관리자 계정 · 관리자 대리</h3>' +
      '<p class="muted" style="margin:0 0 8px">지금 들어온 분: <b>' + (a.dep ? '관리자 대리 (' + esc(a.depNick) + ')' : '주 관리자') + '</b> · 한 분당 기기 ' + 2 + '대까지(3번째로 들어오면 그분의 가장 오래된 로그인이 끊겨요)</p>' +
      '<label class="lb" for="c_adm_name" style="margin-top:0">회원에게 보이는 관리자 이름</label><input type="text" id="c_adm_name" maxlength="8" value="' + esc(c.adm_name || '관리자') + '">' +
      '<p class="hint">알림·문의 답변·공지·회원권 지급·코스 등록자 등 관리자 계정이 한 일은 회원에게 모두 이 이름으로 보여요' + (d.acctNick && d.acctNick !== (c.adm_name || '관리자') ? ' (계정 닉네임 ' + esc(d.acctNick) + '은 회원에게 보이지 않아요)' : '') + '. 누가 했는지는 관리자 기록에만 남아요.</p>' +
      '<button type="button" class="btn g sm" data-act="cfgSave" data-v="adm_name">이름 저장</button>' +
      '<div class="depbox" id="depBox"><p class="muted">관리자 대리를 불러오는 중…</p></div></div>';
  }
  async function depPaint() {
    var el = $('#depBox'); if (!el) return; var d;
    try { d = await LZ.api('depGet', {}); } catch (e) { el.innerHTML = '<p class="err">' + esc(LZ.errText(e)) + '</p>'; return; }
    if (!$('#depBox')) return; DP = d;
    var x = d.dep;
    el.innerHTML = '<h4>' + LZ.ic('user') + ' 관리자 대리</h4>' +
      (x ? '<div class="depnow"><b>' + esc(x.nick) + '</b><span class="muted">' + (x.at ? LZ.fmtDate(x.at) + '부터' : '') + ' · 지금 로그인 ' + (x.sess || 0) + '대' + (x.ok ? '' : ' · <span class="err">지금 쓸 수 없는 계정(블랙·탈퇴)</span>') + '</span></div>'
        : '<p class="muted" style="margin:0 0 6px">사장님 대신 관리자 일을 할 분 1명을 정해요. 그분은 로그인 화면에서 닉네임 <b>관리자</b> + 대리 비밀번호 6자리로 같은 관리자 계정에 들어와요. 회원에게는 똑같이 "' + esc(d.name) + '"로 보여요.</p>') +
      (d.main ? '<div class="row">' + (x ? '<button type="button" class="btn o sm" data-act="depNew" data-v="pin">비밀번호 새로</button><button type="button" class="btn o sm" data-act="depNew">다른 분으로</button><button type="button" class="btn red sm" data-act="depOff">거두기</button>' : '<button type="button" class="btn sm" data-act="depNew">' + LZ.ic('plus') + '관리자 대리 정하기</button>') + '</div>'
        : '<p class="hint">관리자 대리로 들어오셨어요. 대리 지명·거두기와 주 관리자 비밀번호는 주 관리자만 바꿀 수 있어요. 내 정보 → 비밀번호 바꾸기는 대리 비밀번호를 바꿔요.</p>');
  }
  var DP = null;
  /** 대리 정하기: 회원 닉네임 → 대리 비밀번호 6자리 두 번 → 주 관리자 비밀번호 확인 */
  LZ.act.depNew = async function (el, v) {
    var same = v === 'pin' && DP && DP.dep, cur = same ? DP.dep.nick : '';
    var r = await LZ.dialog({ title: same ? '대리 비밀번호 새로 정하기' : '관리자 대리 정하기', html: (same ? '<p class="muted">' + esc(cur) + '님의 대리 비밀번호를 새로 정해요. 그분의 관리자 로그인은 모두 끊겨요.</p>' : '<label class="lb" for="dpNick" style="margin-top:0">대리로 정할 회원 닉네임</label><input type="text" id="dpNick" class="in" maxlength="8" placeholder="회원 닉네임">' + (DP && DP.dep ? '<p class="hint">지금 대리(' + esc(DP.dep.nick) + ')는 바로 해제돼요.</p>' : '')) +
      '<label class="lb" for="dpPin">대리 비밀번호 숫자 6자리</label><input type="password" inputmode="numeric" maxlength="6" id="dpPin" class="in" autocomplete="off" placeholder="6자리"><label class="lb" for="dpPin2">한 번 더</label><input type="password" inputmode="numeric" maxlength="6" id="dpPin2" class="in" autocomplete="off" placeholder="6자리">' +
      '<p class="hint">주 관리자 비밀번호와 다른 번호로요. 이 번호는 대리 본인에게만 직접 알려 주세요.</p>', cancel: null, focus: same ? '#dpPin' : '#dpNick',
      buttons: [{ label: '다음', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? { nick: same ? cur : LZ.stripNick(($('#dpNick') || {}).value), pin: $('#dpPin').value, pin2: $('#dpPin2').value } : null; });
    if (!r) return;
    if (!r.nick) { LZ.toast('대리로 정할 회원 닉네임을 적어 주세요', 4000); return; }
    if (!/^\d{6}$/.test(r.pin)) { LZ.toast('대리 비밀번호는 숫자 6자리예요', 4000); return; }
    if (r.pin !== r.pin2) { LZ.toast('두 번 넣은 번호가 달라요', 4000); return; }
    var sure = await mainPin(same ? '대리 비밀번호를 새로 정할까요?' : LZ.nim(r.nick) + '을 관리자 대리로 정할까요?'); if (sure === null) return;
    try { await LZ.api('depSet', { uid: same ? DP.dep.uid : '', nick: r.nick, pin: r.pin, sure: sure }); LZ.toast(same ? '대리 비밀번호를 새로 정했어요' : LZ.nim(r.nick) + '을 관리자 대리로 정했어요', 4000); depPaint(); }
    catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.depOff = async function () {
    if (!DP || !DP.dep) return;
    var sure = await mainPin(LZ.nim(DP.dep.nick) + '의 관리자 대리를 거둘까요?', '대리 비밀번호는 바로 못 쓰게 되고, 그분의 관리자 로그인은 모두 끊겨요. 그분의 회원 계정은 그대로예요.'); if (sure === null) return;
    try { await LZ.api('depOff', { sure: sure }); LZ.toast('관리자 대리를 거뒀어요', 3500); depPaint(); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  function mainPin(title, body) {
    return LZ.dialog({ title: title, html: (body ? '<p class="muted">' + body + '</p>' : '') + '<label class="lb" for="mPin" style="margin-top:0">확인을 위해 주 관리자 비밀번호 6자리</label><input type="password" inputmode="numeric" maxlength="6" id="mPin" class="in" autocomplete="off" placeholder="6자리">', cancel: null, focus: '#mPin',
      buttons: [{ label: '확인', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { var e = $('#mPin'); return x === 'ok' ? (e ? e.value : '') : null; });
  }
  function seatCfgCard(d) {
    var sc = d.seat, nm = d.seatName || {};
    return '<div class="card"><h3>' + LZ.ic('seat') + ' 회원권 기준</h3><p class="muted" style="margin:0 0 8px">바꾸면 결제 화면·안내·자주 묻는 질문의 금액과 숫자가 모두 함께 바뀌어요. 관리자가 드린 골드회원권은 늘 지급일부터 ' + (sc.gold_admin_days || 365) + '일, 만기 ' + (sc.gold_alert || [30, 14, 7]).join('·') + '일 전에 관리자에게 연장 승인 알림이 가요. 매니저는 회원권 1장 자리 수만큼이에요.</p><div class="scfg">' +
      SEAT_KEYS.map(function (k) { var v = k[0] === 'remind_days' ? (sc.remind || []).join(',') : sc[k[0]]; if (v === undefined || v === null) v = ''; return '<label class="pwi"><span class="muted small">' + esc(nm[k[0]] || k[0]) + (k[1] ? ' (' + k[1] + ')' : '') + '</span><input type="' + (k[0] === 'remind_days' ? 'text' : 'tel') + '" id="s_' + k[0] + '" value="' + esc(String(v)) + '" class="num" inputmode="' + (k[0] === 'remind_days' ? 'text' : 'numeric') + '"></label>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-act="cfgSeat">' + LZ.ic('check') + '기준 저장</button>' +
      '<label class="lb">회원권 안내 글 <span class="muted small">(내 회원권, 사용 안내에 보여요)</span></label><textarea id="s_seat_guide" rows="7" maxlength="2000">' + esc(d.seatRaw.seat_guide) + '</textarea>' +
      '<label class="lb">홍보 한 줄 <span class="muted small">(홍보 안내문에 들어가요)</span></label><textarea id="s_seat_promo" rows="3" maxlength="300">' + esc(d.seatRaw.seat_promo) + '</textarea>' +
      '<p class="hint">글 안의 {자리금액} {클럽금액} {골드금액} {골드기간} {자리수} {블루장수} {최대자리} {기간} {환불일} {적립률} {포인트단위}는 지금 기준값으로 바뀌어 보여요. 자주 묻는 질문에도 똑같이 쓸 수 있어요. 비우면 처음 글로 돌아가요.</p><button type="button" class="btn g" data-act="cfgSeatTxt">안내 글 저장</button></div>';
  }
  LZ.act.cfgSeat = async function () { var o = {}; SEAT_KEYS.forEach(function (k) { o[k[0]] = $('#s_' + k[0]).value; }); try { CF = await LZ.api('setCfg', { seat: o }); await LZ.refreshMe(); LZ.toast('회원권 기준을 저장했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.cfgSeatTxt = async function () { try { CF = await LZ.api('setCfg', { seat_guide: $('#s_seat_guide').value, seat_promo: $('#s_seat_promo').value }); await LZ.refreshMe(); LZ.toast('안내 글을 저장했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* ───── 클럽·회원권(v7.1.0): 클럽별 자리 · 회원권 한 장씩(레드 무료 연장 30~365일 · 골드 회수 · 옮기기 · 지우기) · 회원권 지급(200 넘게도) · 회원별 회원권 ───── */
  var EXTS = [30, 60, 90, 180, 365];
  LZ.screens.adminSeats = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('클럽·회원권', { back: true }) + LZ.skeleton(5);
      var d = await LZ.api('packList', {}); if (!alive()) return; var sc = d.seat;
      root.innerHTML = LZ.hdr('클럽·회원권', { back: true }) + '<div class="wrap">' +
        '<div class="card tight groups">' + gli('star', '골드회원권', '관리자 지급 골드 연장 승인·거절 · 회수', 'data-go="goldList"') + gli('gear', '회원권 기준', '레드 ' + won(sc.seat_price) + ' · 새 클럽 첫 장 ' + won(sc.club_price) + ' · 골드 ' + won(sc.gold_price) + ' · 최대 ' + sc.seat_max + '자리', 'data-go="adminCfg"') + '</div>' +
        '<div class="card tight"><h3 class="ih">' + LZ.ic('club') + '클럽 ' + d.clubs.length + '개</h3>' + d.clubs.map(function (m) { return '<button type="button" class="li" data-go="adminPacks" data-p=\'' + esc(JSON.stringify({ mid: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.locked ? ' <span class="chip gray">잠김</span>' : '') + '</b><span class="su">' + (m.staffClub ? m.n + '명 · 자리 제한 없음' : m.n + '명 / ' + m.seats + '자리 (회원권 ' + m.passes + '장)') + ' · 캡틴 ' + esc(m.captainNick) + (m.nextEnd ? ' · 다음 끝 ' + LZ.dd(m.nextEnd) : '') + '</span></div>' + LZ.ic('chev') + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn g sm" data-go="moimAll">클럽 전체 목록(코드·삭제)</button></div>';
    }
  };
  LZ.screens.adminPacks = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('회원권', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('packList', p.uid ? { uid: p.uid, all: 1 } : { mid: p.mid }); if (!alive()) return; PK.d = d; PK.p = p; var c = d.club, sc = d.seat, mb = d.member;
      var ST = { refund: '환불됨', del: '지움', revoke: '회수됨', ret: '돌려받음', mig: '옮기기에서 뺌' };
      var rows = d.packs.map(function (x) {
        var off = x.status && x.status !== 'on', btn = off ? '<span class="chip gray">' + (ST[x.status] || x.status) + '</span>' : '<div class="pkb">';
        if (!off) {
          if (x.kind === 'red' || (x.kind === 'gold' && x.admin)) btn += '<button type="button" class="sm2" data-act="pkExt" data-v="' + esc(x.id) + '">무료 연장</button>';
          if (x.kind === 'gold') btn += '<button type="button" class="sm2 r" data-act="pkRevoke" data-v="' + esc(x.id) + '">회수</button>';
          if (x.kind !== 'blue') btn += '<button type="button" class="sm2 g" data-act="pkMoveA" data-v="' + esc(x.id) + '">옮기기</button><button type="button" class="sm2 r" data-act="pkDel" data-v="' + esc(x.id) + '">지우기</button>';
          btn += '</div>';
        }
        return LZ.packLine(x, { club: !!p.uid, who: 1, btns: (x.inUse ? '<span class="su">쓰는 중</span>' : '') + (x.note ? '<span class="su">' + esc(x.note) + '</span>' : '') + btn });
      }).join('');
      var grant = function (to, mids) { return '<div class="card"><h3>' + LZ.ic('plus') + ' 회원권 지급(무료)' + (to ? ' · ' + esc(to) : '') + '</h3><p class="muted" style="margin:0 0 8px">' + sc.seat_size + '자리 회원권을 무료로 드려요. 최대 ' + sc.seat_max + '자리를 넘어도 돼요. 받는 분께 알림이 가요.</p>' +
        '<label class="lb" style="margin-top:0">종류</label>' + LZ.seg([['red', '레드'], ['gold', '골드(365일)']], 'red', 'pkK') + '<input type="hidden" id="pkk" value="red">' +
        '<label class="lb">장수</label>' + LZ.seg([['1', '1장'], ['2', '2장'], ['5', '5장'], ['10', '10장']], '1', 'pkN') + '<input type="hidden" id="pkn" value="1">' +
        '<div id="pkDays"><label class="lb">기간(레드)</label>' + LZ.seg(EXTS.map(function (x) { return [String(x), x + '일']; }), '365', 'pkD', 's') + '<input type="hidden" id="pkd" value="365"></div>' +
        (mids ? '<label class="lb" for="pkm">넣을 곳</label><select id="pkm" class="in"><option value="">보관</option>' + mids.map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</select>' : '') +
        '<button type="button" class="btn" data-act="pkGrant">' + LZ.ic('check') + '회원권 지급</button></div>'; };
      root.innerHTML = LZ.hdr(c ? c.name : mb ? mb.nick + ' 회원권' : '회원 회원권', { back: true }) + '<div class="wrap">' +
        (c ? '<div class="card seatc"><div class="seath"><h3>' + LZ.ic('seat') + ' 자리</h3><span><b>' + c.n + '</b>명 / ' + (c.staffClub ? '제한 없음' : c.seats + '자리 (' + c.passes + '장)') + '</span></div><p class="su" style="margin:4px 0 0">캡틴 ' + esc(c.captainNick) + ' · 개설 ' + LZ.fmtDate(c.created) + ' · 함께한 지 ' + LZ.daysSince(c.created) + '일 · 캡틴은 자리 밖</p></div>' : '') +
        (mb ? '<div class="card"><p style="margin:0"><b>' + esc(mb.nick) + '</b> · ' + esc(mb.tierName) + '</p><p class="su" style="margin:4px 0 0">블루 ' + mb.pass.blue.total + '장(남음 ' + mb.pass.blue.left + ') · 레드 ' + mb.pass.red.n + '장(보관 ' + mb.pass.red.stored + ') · 골드 ' + mb.pass.gold.n + '장(보관 ' + mb.pass.gold.stored + ')</p></div>' : '') +
        '<div class="card tight"><h3 class="ih">' + LZ.ic('seat') + '회원권 ' + d.packs.length + '장</h3>' + (rows || '<p class="muted" style="margin:6px 0">회원권이 없어요.</p>') + '</div>' +
        (c ? grant('캡틴 ' + c.captainNick + '님께', null) : mb ? grant('', mb.clubs) : '') + '</div>';
    }
  };
  var PK = {};
  function pkRedraw(r) { LZ.redraw(); }
  LZ.act.pkK = function (el, v) { $('#pkk').value = v; $$('[data-act="pkK"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); var dz = $('#pkDays'); if (dz) dz.hidden = v === 'gold'; };
  LZ.act.pkN = function (el, v) { $('#pkn').value = v; $$('[data-act="pkN"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.pkD = function (el, v) { $('#pkd').value = v; $$('[data-act="pkD"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.pkGrant = async function () { var body = { op: 'grant', kind: $('#pkk').value, n: +$('#pkn').value, days: +$('#pkd').value }; if (PK.p.mid) body.mid = PK.p.mid; if (PK.p.uid) { body.uid = PK.p.uid; body.mid = ($('#pkm') || {}).value || ''; } try { await LZ.api('packAdmin', body); LZ.toast('회원권을 드렸어요'); pkRedraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.pkExt = async function (el, id) {
    var d = await LZ.dialog({ title: '무료 연장', body: '끝나는 날에 더해요. 회원에게 알림이 가요.', cancel: false, buttons: EXTS.map(function (x) { return { label: x + '일', kind: 'o', value: x }; }).concat([{ label: '취소', kind: 'g', value: null }]) });
    if (!d) return; try { await LZ.api('packAdmin', { op: 'extend', id: id, days: d }); LZ.toast(d + '일 늘렸어요'); pkRedraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.pkRevoke = async function (el, id) { if (!(await LZ.confirm('골드회원권을 회수할까요?', '그 자리가 바로 빠지고, 자리가 모자라면 늦게 들어온 회원부터 보기만 하게 돼요. 회원에게 알림이 가요.', '회수', 'r'))) return; try { await LZ.api('packAdmin', { op: 'revoke', id: id }); LZ.toast('회수했어요'); pkRedraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.pkDel = async function (el, id) { if (!(await LZ.confirm('이 회원권을 지울까요?', '클럽 자리가 줄어요. 환불은 결제·환불에서 따로 해 주세요.', '지우기', 'r'))) return; try { await LZ.api('packAdmin', { op: 'del', id: id }); pkRedraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.pkMoveA = async function (el, id) {
    var all = await LZ.api('packList', {}); LZ.sheet('<h2>어느 클럽으로 옮길까요?</h2><p class="muted">관리자는 쓰는 중이 아니면 어느 클럽으로든 옮길 수 있어요(끝나는 날 그대로).</p>' + all.clubs.filter(function (m) { return m.id !== PK.p.mid; }).map(function (m) { return '<button type="button" class="opt" data-act="pkMoveGo" data-v=\'' + esc(JSON.stringify({ id: id, mid: m.id })) + '\'><b>' + esc(m.name) + '</b><span>' + m.n + '명 / ' + m.seats + '자리</span></button>'; }).join('') + '<button type="button" class="opt" data-act="pkMoveGo" data-v=\'' + esc(JSON.stringify({ id: id, mid: '' })) + '\'><b>보관함으로</b><span>주인의 보관 중인 회원권으로</span></button>');
  };
  LZ.act.pkMoveGo = async function (el, v) { var o = JSON.parse(v); try { await LZ.api('packMove', o); LZ.closeSheet(); LZ.toast('옮겼어요'); pkRedraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  /* 골드회원권(v7.1.0): 관리자 지급분은 만기 30일 안이면 연장 승인(끝나는 날부터 365일) / 거절(오늘로 끝) · 회수 */
  LZ.screens.goldList = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('골드회원권', { back: true }) + LZ.skeleton(3);
      var d = await LZ.api('goldList', {}); if (!alive()) return;
      root.innerHTML = LZ.hdr('골드회원권 ' + d.list.length + '장', { back: true }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0">관리자가 드린 골드회원권은 지급일부터 <b>' + d.days + '일</b>이에요. 만기 <b>' + d.alert.join('·') + '일 전</b>에 알려 드려요. <b>승인</b>하면 끝나는 날부터 ' + d.days + '일 이어지고, <b>거절</b>하면 오늘로 끝나요. 미리 승인하면 남은 알림은 오지 않아요. 산 골드회원권은 회원이 연장해요.</p></div>' +
        '<div class="card tight">' + (d.list.length ? d.list.map(function (x) {
          var b = '<div class="pkb">' + (x.admin ? '<button type="button" class="sm2' + (x.due ? '' : ' g') + '" data-act="goldOk" data-v=\'' + esc(JSON.stringify({ id: x.id, nick: x.ownerNick, ok: 1 })) + '\'>승인(' + d.days + '일)</button><button type="button" class="sm2 g" data-act="goldOk" data-v=\'' + esc(JSON.stringify({ id: x.id, nick: x.ownerNick, ok: 0 })) + '\'>거절</button>' : '<span class="muted small">구매</span>') + (x.live ? '<button type="button" class="sm2 r" data-act="pkRevoke" data-v="' + esc(x.id) + '">회수</button>' : '') + '</div>';
          return LZ.packLine(x, { club: 1, who: 1, btns: (x.due ? '<span class="chip red">만기 ' + x.left + '일 전</span>' : '') + b });
        }).join('') : '<p class="muted" style="margin:6px 0">골드회원권이 없어요. 회원 화면의 "회원권 지급"에서 드려요.</p>') + '</div></div>';
    }
  };
  LZ.act.goldOk = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm(LZ.nim(o.nick) + '의 골드회원권을 ' + (o.ok ? '연장할까요?' : '오늘로 끝낼까요?'), o.ok ? '끝나는 날부터 365일 이어져요.' : '오늘까지만 골드회원권이고, 내일부터 그 자리가 빠져요.', o.ok ? '승인' : '거절', o.ok ? 'y' : 'r'))) return; try { var r = await LZ.api('goldRenew', o.end ? { id: o.id, ok: o.ok, end: o.end } : { id: o.id, ok: o.ok }); LZ.toast(LZ.fmtYmd(r.end) + '까지예요', 4000); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };

  /* ───── 기록 · 의견 · 클럽 전체 · FAQ ───── */
  LZ.screens.log = { tab: 'me', show: async function (p, root, alive) { if (!needAdmin()) return; root.innerHTML = LZ.hdr('활동 기록', { back: true }) + LZ.skeleton(8); var d = await LZ.api('log', {}); if (!alive()) return; root.innerHTML = LZ.hdr('활동 기록', { back: true }) + '<div class="wrap"><div class="list">' + d.list.map(function (x) { return '<div class="it" style="padding:8px 4px"><div class="t"><b>' + esc(x.nick) + ' · ' + esc(x.act) + '</b><span class="muted">' + LZ.fmtDate(x.ts, true) + (x.info ? ' · ' + esc(x.info) : '') + '</span></div></div>'; }).join('') + '</div></div>'; } };
  LZ.screens.moimAll = { tab: 'me', show: async function (p, root, alive) { if (!needAdmin()) return; root.innerHTML = LZ.hdr('클럽 전체', { back: true }) + LZ.skeleton(4); var d = await LZ.api('moimAll', {}); if (!alive()) return; root.innerHTML = LZ.hdr('클럽 전체 ' + d.list.length + '개', { back: true }) + '<div class="wrap"><div class="list">' + d.list.map(function (m) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="club" data-p=\'' + esc(JSON.stringify({ id: m.id })) + '\'><div class="t"><b>' + esc(m.name) + (m.official ? ' <span class="chip cap">공식</span>' : '') + (!m.active ? ' <span class="chip off">닫힘</span>' : '') + '</b><span class="muted">캡틴 ' + esc(m.captainNick || '—') + ' · 회원 ' + m.members + '명 · 코드 ' + esc(m.code) + ' · ' + (m.pub ? '공개' : '비공개') + '</span></div><span>›</span></button><button type="button" class="sm2 r" data-act="moimDrop" data-v=\'' + esc(JSON.stringify({ id: m.id, name: m.name })) + '\'>삭제</button>'; }).join('') + '</div></div>'; } };
  LZ.act.promoJoin = async function () { try { await LZ.api('promoJoin', {}); LZ.toast('가입 홍보 공지를 올렸어요(맨 위 고정)'); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.moimDrop = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm('"' + o.name + '" 클럽을 삭제할까요?', '회원님들은 클럽 없음이 되고, 각자의 기록은 내 수첩으로 옮겨요. 되돌릴 수 없어요.', '삭제', 'r'))) return; try { await LZ.api('moimDrop', { id: o.id }); LZ.toast('삭제했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.screens.faqAdmin = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      root.innerHTML = LZ.hdr('자주 묻는 질문', { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('faqList', {}); if (!alive()) return;
      root.innerHTML = LZ.hdr('자주 묻는 질문', { back: true, right: '<button type="button" class="ib on" data-act="faqEdit" data-v="">＋ 질문 더하기</button><button type="button" class="ib" data-act="faqReset">기본으로 되돌리기</button>' }) + '<div class="wrap"><div class="list">' + d.faq.map(function (f, i) { return '<div class="it" style="padding:8px 4px"><div class="t"><b>' + esc(f.q) + '</b><span class="muted">' + esc(f.a.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').slice(0, 80)).slice(0, 80) + '</span></div><div style="display:flex;flex-direction:column;gap:4px"><button type="button" class="sm2 g" style="height:30px;font-size:var(--t0)" data-act="faqMove" data-v="' + esc(f.id) + ':-1">▲</button><button type="button" class="sm2 g" style="height:30px;font-size:var(--t0)" data-act="faqMove" data-v="' + esc(f.id) + ':1">▼</button></div><button type="button" class="sm2 g" data-act="faqEdit" data-v="' + esc(f.id) + '">고치기</button></div>'; }).join('') + '</div></div>';
      FQ = d.faq;
    }
  };
  /* 안내 글 고치기(v7.4 #11 파크골프 첫걸음 · v7.0.3 시상식 안내 p.g='awards'): 카드 6장 제목·내용. 비우면 처음 글로 */
  var FS = [], FSG = 'first';
  var FSN = { first: { t: '첫걸음 글 고치기', d: '처음 오신 분께 보이는 안내 카드 6장이에요.', view: 'firstSteps' }, awards: { t: '시상식 안내 글 고치기', d: '시상식 안내 카드 6장이에요. 상 이름과 차례는 앱의 시상식과 맞춰 주세요.', view: 'awGuide' } };
  LZ.screens.firstAdmin = {
    tab: 'me',
    show: async function (p, root, alive) {
      if (!needAdmin()) return;
      var g = FSN[p.g] ? p.g : 'first', N = FSN[g];
      root.innerHTML = LZ.hdr(N.t, { back: true }) + LZ.skeleton(4);
      var d = await LZ.api('guideAdmin', { g: g }); if (!alive()) return; FS = d.cards; FSG = g;
      root.innerHTML = LZ.hdr(N.t, { back: true }) + '<div class="wrap"><p class="muted" style="margin:0 0 8px">' + N.d + ' 굵게는 &lt;b&gt;…&lt;/b&gt;, 줄 바꿈은 &lt;br&gt;로 적어요. 금액은 적지 말아 주세요(바뀌면 틀려요).</p>' +
        FS.map(function (c, i) { return '<div class="card"><h3 class="ih">' + LZ.ic(c.ic) + (i + 1) + '. ' + esc(c.t) + (c.custom ? ' <span class="chip cap">고친 글</span>' : ' <span class="chip gray">처음 글</span>') + '</h3><label class="lb" style="margin-top:0">제목</label><input type="text" id="fst' + i + '" maxlength="20" value="' + esc(c.t) + '"><label class="lb">내용</label><textarea id="fsb' + i + '" rows="8" maxlength="1500">' + esc(c.b) + '</textarea>' + (c.custom ? '<button type="button" class="btn g sm" data-act="fsReset" data-v="' + i + '">처음 글로 되돌리기</button>' : '') + '</div>'; }).join('') +
        '<button type="button" class="btn" data-act="fsSave">' + LZ.ic('check') + '모두 저장</button><button type="button" class="btn g" data-go="' + N.view + '">보기</button></div>';
    }
  };
  LZ.act.fsSave = async function () { var f = FS.map(function (c, i) { return { t: $('#fst' + i).value, b: $('#fsb' + i).value }; }); try { await LZ.api('setCfg', { guide: { g: FSG, cards: f } }); LZ.toast('저장했어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.fsReset = async function (el, v) { if (!(await LZ.confirm('처음 글로 되돌릴까요?', '고친 제목과 내용이 지워져요.', '되돌리기', 'r'))) return; var f = FS.map(function () { return null; }); f[+v] = { t: '', b: '' }; try { await LZ.api('setCfg', { guide: { g: FSG, cards: f } }); LZ.toast('처음 글로 되돌렸어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  var FQ = [];
  LZ.act.faqReset = async function () { if (!(await LZ.confirm('기본 질문으로 되돌릴까요?', '고치거나 더한 질문은 모두 지워지고, 최신 기본 질문으로 바뀌어요.', '되돌리기', 'r'))) return; try { await LZ.api('faqReset', {}); LZ.toast('기본 질문으로 바꿨어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.faqEdit = function (el, id) { var f = FQ.filter(function (x) { return x.id === id; })[0] || { q: '', a: '' }; LZ.sheet('<h2>' + (id ? '질문 고치기' : '질문 더하기') + '</h2><label class="lb" style="margin-top:0">질문</label><input type="text" id="fq" maxlength="60" value="' + esc(f.rawQ || f.q) + '"><label class="lb">답</label><textarea id="fa" rows="5" maxlength="500">' + esc(f.raw || f.a) + '</textarea><p class="hint">{자리금액} {클럽금액} {골드금액} {골드기간} {자리수} {블루장수} {최대자리} {기간} {환불일} {알림일} {적립률} {포인트단위}는 지금 설정값으로 바뀌어 보여요.</p><button type="button" class="btn" data-act="faqSave" data-v="' + esc(id) + '">저장</button>' + (id ? '<button type="button" class="btn red sm" data-act="faqDel" data-v="' + esc(id) + '">지우기</button>' : '')); };
  LZ.act.faqSave = async function (el, id) { try { await LZ.api('faqSave', { id: id || undefined, q: $('#fq').value, ans: $('#fa').value }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.act.faqDel = async function (el, id) { if (!(await LZ.confirm('지울까요?', '', '지우기', 'r'))) return; try { await LZ.api('faqDel', { id: id }); LZ.closeSheet(); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
  LZ.act.faqMove = async function (el, v) { var p = v.split(':'); try { await LZ.api('faqMove', { id: p[0], dir: +p[1] }); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e)); } };
})();
