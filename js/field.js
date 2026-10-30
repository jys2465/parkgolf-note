/* 필드 라운드: 구장 · 라운드 열기/함께하기 · 점수판(실시간·오프라인) · 전체 점수 · 결과 · 내 라운드 기록 · 단체 라운드 상황판 · 시상식 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var R = { round: null, h: 0, timer: null, off: 0 };
  function parTo(pars, n) { return pars.slice(0, n).reduce(function (s, x) { return s + x; }, 0); }
  /* 합계: 조에서 누군가 적은 가장 먼 홀까지를 "친 홀"로 보고, 안 적은 홀은 파로 셈 */
  function prog(rd) { var m = -1; rd.players.forEach(function (p) { p.s.forEach(function (v, i) { if (v > 0 && i > m) m = i; }); }); return m; }
  function tot(p, pars, a, b, rd) { var t = 0, n = 0, par = 0, upto = rd ? Math.min(b - 1, prog(rd)) : b - 1; for (var i = a; i <= upto; i++) { var s = p.s[i] > 0 ? p.s[i] : pars[i]; t += s; n++; par += pars[i]; } return { t: t, n: n, par: par }; }
  LZ.screens.field = {
    tab: 'field',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('필드 라운드') + LZ.skeleton(4);
      var m = await LZ.api('roundMine', {}); if (!alive()) return;
      var tile = function (ic, t, su, attr) { return '<button type="button" class="ftile" ' + attr + '>' + LZ.ic(ic) + '<b>' + t + '</b><span>' + su + '</span></button>'; };
      var avgD = m.avgN ? (m.avgPar > 0 ? '+' : '') + m.avgPar : '—';
      root.innerHTML = LZ.hdr('필드 라운드') + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap fmain">' +
        /* 만들기는 위(#18): 라운드 열기 · 번호로 들어가기 */
        '<div class="row fmk"><button type="button" class="btn gold" data-act="roundOpenS">' + LZ.ic('play') + '라운드 열기</button><button type="button" class="btn o" data-act="roundJoinS">' + LZ.ic('field') + '번호로 들어가기</button></div>' +
        (m.round ? '<button type="button" class="cont" data-go="round" data-p=\'' + esc(JSON.stringify({ id: m.round.id })) + '\'>' + LZ.ic('flag', 'ci') + '<div style="flex:1;min-width:0"><b>진행 중인 라운드 ' + esc(m.round.code) + '</b><span class="muted">' + esc(m.round.fname) + '</span></div>' + LZ.ic('chev') + '</button>' : '') +
        '<div class="ftiles">' + tile('club', '단체 라운드', '조 편성·상황판', 'data-go="events"') + tile('trophy', '시상식', '끝난 라운드', 'data-act="awPickRound"') + tile('flag', '구장 관리', '등록·고치기', 'data-go="fieldMng"') + '</div>' +
        '<div class="fstat"><div><span>최근 ' + (m.avgN || 0) + '회 평균</span><b class="' + (!m.avgN ? '' : m.avgPar < 0 ? 'u' : m.avgPar > 0 ? 'o' : '') + '">' + avgD + '</b><span>파 대비' + (m.avg ? ' · ' + m.avg + '타' : '') + '</span></div><div><span>라운드</span><b>' + (m.total || 0) + '</b><span>9홀 넘게 끝낸 것</span></div></div>' +
        '<div class="card tight groups"><button type="button" class="li" data-go="firstSteps">' + LZ.ic('ball', 'gi') + '<span class="t"><b>파크골프 첫걸음</b><span class="su">처음이세요? 규칙 · 점수 세는 법 · 매너</span></span>' + LZ.ic('chev') + '</button></div>' +
        '<div class="card"><h3 class="ih">' + LZ.ic('book') + '내 라운드 기록</h3>' +
        (m.list.length ? '<div class="list">' + m.list.slice(0, 20).map(function (x) { var d = x.tot - x.par, rk = x.rank ? x.rank.split('/') : null; return '<div class="it frl"><button type="button" class="frb" data-go="round" data-p=\'' + esc(JSON.stringify({ id: x.rid })) + '\'><div class="t"><b>' + esc(x.fname) + (x.status === 'open' ? ' <span class="chip cap">진행 중</span>' : '') + '</b><span class="muted">' + LZ.fmtDate(x.at) + (x.status === 'open' ? '' : ' · ' + x.n + '홀 · ' + x.tot + '타 (' + (d > 0 ? '+' + d : d) + ')') + '</span></div>' + (rk && x.status !== 'open' && +rk[1] > 1 ? '<b class="frk' + (rk[0] === '1' ? ' w' : '') + '">' + (rk[0] === '1' ? LZ.ic('trophy') : '') + rk[0] + '등</b>' : '') + '</button>' + (x.status !== 'open' ? '<button type="button" class="sm2 g frx" data-act="roundMineDel" data-v="' + esc(x.rid) + '" aria-label="지우기">' + LZ.ic('x') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted" style="margin:8px 0 0">아직 라운드 기록이 없어요. 위의 <b>라운드 열기</b>로 시작해요.</p>') + '</div></div>';
      LZ.paintSync();
    }
  };
  LZ.act.awPickRound = async function () {
    var m = await LZ.api('roundMine', {}), list = (m.list || []).filter(function (x) { return x.rid && !/\/1$/.test(x.rank || ''); }).slice(0, 20);
    LZ.sheet('<h2>어느 라운드로 할까요?</h2><p class="muted">2~5명이 친 라운드는 끝나면 시상식이 열려요(혼자 친 라운드는 시상 없음). 우승·준우승·장려·행운상(추첨)을 뽑고 결과 그림을 카톡으로 보내요.</p>' + (list.length ? list.map(function (x) { return '<button type="button" class="opt" data-go="awards" data-p=\'' + esc(JSON.stringify({ rid: x.rid })) + '\'><b>' + LZ.fmtDate(x.at) + ' · ' + esc(x.fname) + '</b><span>' + x.tot + '타 (' + (x.tot - x.par > 0 ? '+' : '') + (x.tot - x.par) + ')</span></button>'; }).join('') : '<p class="muted">끝낸 라운드가 아직 없어요.</p>'));
  };
  LZ.act.roundMineDel = async function (el, rid) { if (!(await LZ.confirm('이 라운드 기록을 지울까요?', '내 목록과 평균에서만 빠져요. 같은 조의 점수판은 남아요.', '지우기', 'r'))) return; try { await LZ.api('roundMineDel', { rid: rid }); LZ.toast('지웠어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  /* 라운드 열기 */
  var OP = { fid: '', players: [], self: 0, n: 18 };
  LZ.act.roundOpenS = async function () {
    if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 라운드를 열 수 없어요. 남이 연 라운드에는 함께할 수 있어요', 4500); return; }
    var r = await LZ.api('fieldList', { all: 1 }); OP = { fids: [], players: [], self: 0, n: 18, fields: r.list, mates: r.mates, q: '' };
    paintOpen();
  };
  function paintOpen() {
    var sel = OP.fids.map(function (id) { return OP.fields.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean), holes = sel.reduce(function (a, x) { return a + x.n; }, 0);
    LZ.sheet('<h2>' + LZ.ic('play') + '라운드 열기</h2>' +
      '<div class="ophd"><b>구장 · 진행 순서</b><span class="muted">9홀씩 최대 4개</span></div>' +
      (sel.length ? '<div class="opsel">' + sel.map(function (x, k) { return '<div class="oprow"><b class="hn opn">' + (k + 1) + '</b><div class="t"><b>' + esc(x.name) + '</b><span class="muted">' + x.n + '홀 · 기준 ' + x.par + (x.area ? ' · ' + esc(x.area) : '') + '</span></div>' + (sel.length > 1 ? '<button type="button" class="opb" data-act="opMove" data-v="' + k + ':-1" aria-label="앞으로"' + (k === 0 ? ' disabled' : '') + '>' + LZ.ic('up') + '</button><button type="button" class="opb" data-act="opMove" data-v="' + k + ':1" aria-label="뒤로"' + (k === sel.length - 1 ? ' disabled' : '') + '>' + LZ.ic('down') + '</button>' : '') + '<button type="button" class="opb x" data-act="opField" data-v="' + esc(x.id) + '" aria-label="빼기">' + LZ.ic('x') + '</button></div>'; }).join('') + '</div><p class="muted small" style="margin:4px 0 8px">합계 ' + holes + '홀 · 기준 ' + sel.reduce(function (a, x) { return a + x.par; }, 0) + '타 · ▲▼로 순서를 바꿔요</p>' : '<p class="hint" style="margin:0 0 8px">아래에서 코스를 누르면 여기에 1·2·3·4 순서로 들어가요.</p>') +
      '<label class="lb">코스 고르기</label><input type="search" id="opq" placeholder="골프장·지역 찾기" value="' + esc(OP.q || '') + '" style="margin-bottom:6px">' +
      '<div class="list" style="max-height:38vh;overflow:auto">' + (function () { var q = (OP.q || '').toLowerCase(), list = OP.fields.filter(function (x) { return OP.fids.indexOf(x.id) < 0 && (!q || (x.name + ' ' + (x.area || '')).toLowerCase().indexOf(q) >= 0); }); return list.length ? list.map(function (x) { return '<button type="button" class="it pickrow" data-act="opField" data-v="' + esc(x.id) + '"><div class="t"><b>' + esc(x.name) + '</b><span class="muted">' + x.n + '홀 · 기준 ' + x.par + (x.ball === 'golf' ? ' · 일반골프' : '') + (x.used ? ' · 최근 ' + LZ.fmtDate(x.used) : '') + '</span></div>' + (x.area ? '<span class="chip">' + esc(x.area) + '</span>' : '') + '</button>'; }).join('') : '<div class="empty">' + (q ? '찾는 코스가 없어요' : '등록된 코스가 없어요') + '</div>'; })() + '</div>' +
      '<button type="button" class="btn o sm" data-go="fieldReg">' + LZ.ic('plus') + '구장 등록</button>' +
      '<label class="lb">함께 치는 분 (' + (OP.players.length + 1) + '명) <span class="muted" style="font-weight:500">· 혼자도 돼요, 시상식은 2명부터</span></label><div class="list"><div class="it"><div class="av">' + esc(S.user.nick.charAt(0)) + '</div><div class="t"><b>' + LZ.nimE(S.user.nick) + ' <span class="chip">나</span></b></div></div>' + OP.players.map(function (p, i) { return '<div class="it"><div class="av">' + esc((p.nick || p.guest).charAt(0)) + '</div><div class="t"><b>' + LZ.nimE(p.nick || p.guest) + ' ' + (p.guest ? '<span class="chip off">손님</span>' : '') + '</b></div><button type="button" class="sm2 g" data-act="opRm" data-v="' + i + '">' + LZ.ic('x') + '빼기</button></div>'; }).join('') + '</div>' +
      (OP.mates && OP.mates.length ? '<p class="muted" style="margin:8px 0 4px">최근에 함께 친 분</p><div class="chips">' + OP.mates.filter(function (m) { return !OP.players.some(function (p) { return p.uid === m.uid; }); }).map(function (m) { return '<button type="button" class="sm2 g" data-act="opMate" data-v=\'' + esc(JSON.stringify(m)) + '\'>' + LZ.ic('plus') + esc(m.nick) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="row"><button type="button" class="btn o sm" data-act="opMember">' + LZ.ic('user') + '회원님 넣기</button><button type="button" class="btn o sm" data-act="opGuest">' + LZ.ic('plus') + '손님 넣기</button></div>' +
      '<div class="tgl"><span>본인 점수는 본인만 적기<span class="muted">끄면 조원 누구나 대신 적어요</span></span>' + LZ.sw(OP.self, 'opSelf') + '</div>' +
      '<p class="muted small" style="margin:8px 0 0">라운드를 열면 번호 4자리가 나와요. 같은 조는 그 번호로 들어와 한 점수판을 같이 적어요.</p><button type="button" class="btn gold" data-act="opGo">' + LZ.ic('play') + '라운드 열기</button>');

  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'opq' && OP) { OP.q = e.target.value; var sc = e.target.nextElementSibling; var pos = e.target.selectionStart; paintOpen(); var q2 = $('#opq'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (x) { /* 무시 */ } } } });
  LZ.act.opField = function (el, v) { var k = OP.fids.indexOf(v), f = OP.fields.filter(function (x) { return x.id === v; })[0]; if (k >= 0) OP.fids.splice(k, 1); else { if (f && f.n === 18) OP.fids = [v]; else if (OP.fids.length >= 4 || OP.fids.some(function (id) { var g = OP.fields.filter(function (x) { return x.id === id; })[0]; return g && g.n === 18; })) { LZ.toast('코스는 4개(36홀)까지예요'); return; } else OP.fids.push(v); } paintOpen(); };
  LZ.act.opMove = function (el, v) { var q = v.split(':'), k = +q[0], j = k + (+q[1]); if (j < 0 || j >= OP.fids.length) return; var t = OP.fids[k]; OP.fids[k] = OP.fids[j]; OP.fids[j] = t; paintOpen(); };
  LZ.act.opRm = function (el, v) { OP.players.splice(+v, 1); paintOpen(); };
  LZ.act.opMate = function (el, v) { var m = JSON.parse(v); if (OP.players.length >= 4) { LZ.toast('한 조는 5명까지예요'); return; } OP.players.push({ uid: m.uid, nick: m.nick }); paintOpen(); };
  LZ.act.opMember = async function () {
    var list = [];  try { var g = await LZ.api('moimGet', { id: S.br !== '_me' ? S.br : (S.me.moims[0] || {}).id }); list = g.members || []; } catch (e) { /* 무시 */ }
    var v = await LZ.dialog({ title: '회원님 추가', html: '<input type="text" id="mn" class="in" placeholder="닉네임" list="mlist"><datalist id="mlist">' + list.map(function (x) { return '<option value="' + esc(x.nick) + '">'; }).join('') + '</datalist><p class="hint">같은 클럽 회원님 이름이 자동으로 떠요. 다른 분은 닉네임을 정확히 적어 주세요.</p>', cancel: null, buttons: [{ label: '추가', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#mn').value : null; });
    if (!v) { paintOpen(); return; }
    var hit = list.filter(function (x) { return x.nick === LZ.stripNick(v); })[0];
    if (hit) OP.players.push({ uid: hit.uid, nick: hit.nick }); else OP.players.push({ nickOnly: LZ.stripNick(v), nick: LZ.stripNick(v) });
    paintOpen();
  };
  LZ.act.opGuest = async function () { var v = await LZ.dialog({ title: '손님 추가', html: '<input type="text" id="gn" class="in" maxlength="8" placeholder="이름 (앱이 없어도 돼요)">', cancel: null, buttons: [{ label: '추가', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#gn').value : null; }); if (v) OP.players.push({ guest: LZ.stripNick(v) }); paintOpen(); };
  LZ.act.opSelf = function () { OP.self = OP.self ? 0 : 1; paintOpen(); };
  LZ.act.opGo = async function (el, v, ev, force) {
    if (!OP.fids.length) { LZ.toast('코스를 골라 주세요. 없으면 구장 등록으로 먼저 등록해요'); return; }
    LZ.busy(true, '라운드를 여는 중…');
    try {
      var players = OP.players.map(function (p) { return p.uid ? { uid: p.uid } : p.guest ? { guest: p.guest } : { nick: p.nick }; });
      for (var i = 0; i < players.length; i++) if (players[i].nick) { players[i] = { guest: players[i].nick }; }
      var r = await LZ.api('roundOpen', { fids: OP.fids.length ? OP.fids : undefined, n: OP.n, players: players, self: OP.self, grp: OP.grp || undefined, force: force ? 1 : 0 }, { retry: 0 });
      LZ.busy(false); LZ.closeSheet(); LZ.go('round', { id: r.round.id, fresh: 1 }); shareSheet(r.round);
    } catch (e) {
      LZ.busy(false);
      if (e.code === 'open' && e.data && e.data.round) { var k = await LZ.dialog({ title: '진행 중인 라운드가 있어요', body: e.message, cancel: false, buttons: [{ label: '그 라운드로 가기', kind: 'y', value: 'go' }, { label: '그래도 새로 열기', kind: 'o', value: 'force' }, { label: '취소', kind: 'g', value: false }] }); if (k === 'go') { LZ.closeSheet(); LZ.go('round', { id: e.data.round.id }); } else if (k === 'force') LZ.act.opGo(null, null, null, true); return; }
      LZ.toast(e.message, 5000);
    }
  };
  function shareSheet(rd) {
    var url = LZ.APP_URL + '?r=' + rd.code;
    LZ.sheet('<h2>라운드 번호</h2><div class="code">' + esc(rd.code) + '</div><p class="muted center">같은 조 분께 이 번호를 알려 주거나 카톡·QR로 보내세요.</p><div class="qr" id="rqr"></div><button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '라운드 함께하기', text: '파크골프 공략수첩 라운드 ' + rd.code + ' · ' + rd.fname + '\n아래 링크를 누르면 바로 들어와요.', url: url })) + '\'>카톡으로 보내기</button>');
    LZ.qr($('#rqr'), url);
  }
  LZ.act.roundShare = function () { shareSheet(R.round); };
  LZ.act.roundJoinS = function () { LZ.sheet('<h2>라운드 들어가기</h2><p class="muted">같은 조 분께 라운드 번호 4자리를 받아 넣어요. 카톡 링크나 QR로도 들어올 수 있어요.</p><input type="tel" id="jcode" inputmode="numeric" maxlength="4" placeholder="예: 7351"><button type="button" class="btn" data-act="roundJoin">들어가기</button>'); setTimeout(function () { var c = $('#jcode'); if (c) c.focus(); }, 100); };
  LZ.act.roundJoin = async function (el, code) {
    code = code || $('#jcode').value.replace(/\D/g, ''); if (code.length !== 4) { LZ.toast('번호 4자리를 넣어 주세요'); return; }
    try { var r = await LZ.api('roundJoin', { code: code }); LZ.closeSheet(); LZ.go('round', { id: r.round.id, fresh: 1 }); } catch (e) { LZ.toast(e.message, 5000); }
  };

  /* ───── 점수판 ───── */
  LZ.screens.round = {
    tab: 'field', wake: true, rt: true,
    show: async function (p, root, alive) {
      if (p.code && !p.id) { try { var j = await LZ.api('roundJoin', { code: p.code }); LZ.go('round', { id: j.round.id, fresh: 1 }, { replace: true }); } catch (e) { LZ.toast(e.message, 5000); LZ.go('field', {}, { replace: true }); } return; }
      if (!R.round || R.round.id !== p.id || p.fresh) { root.innerHTML = LZ.hdr('라운드', { back: true }) + LZ.skeleton(5); var r = await LZ.api('roundGet', { id: p.id }); if (!alive()) return; R.round = r.round; R.h = p.h !== undefined ? p.h : firstOpenHole(r.round); }
      if (p.h !== undefined) R.h = p.h;
      paintRound(root);
      LZ.rt.start(R.round.id, R.round.rev, function () { refreshRound(); });
    }
  };
  function firstOpenHole(rd) { for (var i = 0; i < rd.pars.length; i++) if (rd.players.some(function (p) { return !p.s[i]; })) return i; return rd.pars.length - 1; }
  async function refreshRound() {
    if (!R.round || LZ.cur().name !== 'round') return;
    try { var r = await LZ.api('roundGet', { id: R.round.id, rev: R.round.rev }, { retry: 0 }); if (r.same) return; var old = R.round; R.round = r.round; LZ.rt.rev = r.round.rev; if (LZ.cur().name === 'round') { paintRound($('#app')); flashChanged(old, r.round); } } catch (e) { /* 다음에 */ }
  }
  function flashChanged(old, nw) { nw.players.forEach(function (p, k) { var o = old.players[k]; if (o && o.s[R.h] !== p.s[R.h] && p.b[R.h] !== S.user.nick) { var el = $('#pl' + k); if (el) { el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 900); } if (p.s[R.h]) LZ.toast(LZ.nim(p.b[R.h]) + '이 ' + (R.lbl || R.h + 1) + '홀 ' + LZ.nim(p.n) + ' 점수를 적었어요'); } }); }
  /** 파 대비 스코어 글자: −1 · 0 · +2 (안 적은 홀은 0) */
  function rel(d) { return d > 0 ? '+' + d : d < 0 ? '−' + (-d) : '0'; }
  function relCls(d) { return d < 0 ? 'u' : d > 0 ? 'o' : 'e'; }
  LZ.relTxt = rel;
  function paintRound(root) {
    var rd = R.round, i = R.h, par = rd.pars[i], ended = rd.status !== 'open' && !rd.editable, nh = rd.pars.length, off = !navigator.onLine || LZ.queue.size(), fixing = rd.status !== 'open' && rd.editable;
    var lap = null, lapTabs = ''; if (rd.laps && rd.laps.length > 1) { rd.laps.forEach(function (l, k) { if (i >= l.from && i < l.from + l.n) lap = l; }); lapTabs = '<div class="seg s" style="margin-bottom:8px">' + rd.laps.map(function (l, k) { return '<button type="button" class="' + (lap === l ? 'on' : '') + '" data-act="rlap" data-v="' + l.from + '">' + esc(l.fname) + '</button>'; }).join('') + '</div>'; }
    var holeNo = lap ? (i - lap.from + 1) : (i + 1), hn = function (h) { var L = null; (rd.laps || []).forEach(function (l) { if (h >= l.from && h < l.from + l.n) L = l; }); return L && rd.laps.length > 1 ? (h - L.from + 1) : (h + 1); };
    R.lbl = holeNo;
    root.innerHTML = LZ.hdr('점수판 ' + rd.code, { back: true, noBell: 1, inBar: 1, right: '<button type="button" class="ib" data-go="rall">전체</button>' + (ended ? '' : '<button type="button" class="ib" data-act="roundShare">초대</button>') }) + '<div class="wrap sboard">' +
      '<div class="sync ' + (off ? 'wait' : 'ok') + '" id="rsync">' + (ended ? '끝난 라운드예요' : fixing ? '끝남 · ' + Math.max(1, Math.round((rd.editUntil - Date.now()) / 60000)) + '분 동안 고칠 수 있어요' : off ? '신호 약함 · 휴대폰에 저장됨, 연결되면 보내요' : LZ.ic('check') + ' 모두 저장됨 · 실시간으로 함께 보는 중 · ' + LZ.fmtDate(rd.endsAt, true) + ' 자동 종료') + '</div>' +
      lapTabs + '<div class="sbh"><div class="sbt"><div class="sbn">' + LZ.hn(holeNo, 'xl') + '<span class="muted">/ ' + (lap ? lap.n : nh) + '</span></div><div class="muted sbf">' + esc(rd.fname) + ' · 기준 ' + rd.par + '타' + (rd.grp ? ' · 단체 ' + esc(rd.grp) : '') + '</div>' + (rd.weather ? '<div class="muted sbf">날씨 ' + esc(rd.weather) + '</div>' : '') + '</div>' +
        (ended ? '<span class="parb off">파 ' + par + '</span>' : '<button type="button" class="parb" data-act="roundPar" aria-label="' + holeNo + '홀 파 고치기">파 ' + par + LZ.ic('edit') + '</button>') + '</div>' +
      '<div class="sbl">' + rd.players.map(function (p, k) { var s = p.s[i], T = tot(p, rd.pars, 0, nh, rd), canEdit = !ended && (!rd.self || p.guest || p.k === S.user.uid), d = s ? s - par : 0, td = T.t - T.par;
        return '<div class="pl2' + (k % 2 ? ' z' : '') + '" id="pl' + k + '"><div class="pn"><b>' + LZ.nimE(p.n) + (p.guest ? ' <span class="chip off">손님</span>' : '') + '</b><span class="su">합계 ' + T.t + '타 · 파 대비 ' + rel(td) + ' <i>(' + T.n + '홀)</i></span><span class="su who">' + (p.b[i] ? LZ.nimE(p.b[i]) + '이 적음' : '아직 안 적었어요') + '</span></div>' +
          '<div class="pc"><button type="button" class="stp" data-act="sc" data-v="' + k + ':-1"' + (canEdit ? '' : ' disabled') + ' aria-label="한 타 빼기">−</button><div class="sc2 ' + (s ? relCls(d) : 'none') + '"><b>' + rel(d) + '</b><small>' + (s ? s + '타' : '파 ' + par) + '</small></div><button type="button" class="stp" data-act="sc" data-v="' + k + ':1"' + (canEdit ? '' : ' disabled') + ' aria-label="한 타 더하기">+</button></div></div>'; }).join('') + '</div>' +
      (!ended ? '<div class="row"><button type="button" class="btn g sm" data-act="rpAdd">' + LZ.ic('plus') + '사람 넣기</button>' + (rd.isOwner ? '<button type="button" class="btn g sm" data-act="rpRm">' + LZ.ic('x') + '사람 빼기</button>' : '') + '</div>' : '') +
      '<div class="nav2"><button type="button" data-act="rh" data-v="-1"' + (i <= 0 ? ' disabled' : '') + '>‹ ' + (i > 0 ? hn(i - 1) + '홀' : '이전 홀') + '</button><button type="button" class="nx" data-act="rh" data-v="1"' + (i >= nh - 1 ? ' disabled' : '') + '>' + (i < nh - 1 ? '다음 ' + hn(i + 1) + '홀' : '마지막 홀') + ' ›</button></div>' +
      (rd.edits && rd.edits.length ? '<p class="muted small" style="margin:8px 0 0">' + LZ.ic('edit') + ' ' + rd.edits.map(function (x) { return LZ.fmtDate(x.at, true) + ' ' + LZ.nimE(x.nick) + ' 수정'; }).join(' · ') + '</p>' : '') +
      (rd.status !== 'open' ? '<button type="button" class="btn" data-go="rres">결과 보기</button>' : (rd.isOwner || S.user.kind === 'admin' || rd.grp ? '<button type="button" class="btn o" data-act="roundEnd">라운드 끝내기</button>' : '<p class="hint center">라운드를 연 분이 끝내요. 12시간이 지나면 저절로 끝나요.</p>')) + '</div>';
  }
  LZ.act.sc = function (el, v) {
    var parts = v.split(':'), k = +parts[0], d = +parts[1], rd = R.round, p = rd.players[k], par = rd.pars[R.h], s = p.s[R.h];
    s = Math.max(1, Math.min(15, (s || par) + d));                           // 안 적은 홀은 파에서 시작: + 는 보기, − 는 버디
    p.s[R.h] = s; p.b[R.h] = S.user.nick; p.t[R.h] = Date.now();
    paintRound($('#app'));
    sendScore({ k: p.k, h: R.h, s: s, at: Date.now() });
  };
  var pend = [], sendT = null;
  function sendScore(it) {
    pend.push(it); clearTimeout(sendT);
    sendT = setTimeout(async function () {
      var items = pend; pend = [];
      try { var r = await LZ.api('roundScore', { id: R.round.id, items: items }, { retry: 0, timeout: 12000 }); if (r.denied) LZ.toast('"본인 점수는 본인만" 설정이라 적을 수 없는 분이 있어요', 4000); var h = R.h; R.round = r.round; R.h = h; LZ.rt.rev = r.round.rev; LZ.rt.broadcast(r.round.rev); if (LZ.cur().name === 'round') { var b = $('#rsync'); if (b) { b.className = 'sync ok'; b.innerHTML = LZ.ic('check') + ' 모두 저장됨 · 실시간으로 함께 보는 중'; } } }
      catch (e) { if (e.code === 'ended') { LZ.toast('끝난 라운드예요'); refreshRound(); return; } if (e.code === 'net' || e.code === 'server' || e.code === 'busy') { LZ.queue.push('roundScore', { id: R.round.id, items: items.map(function (x) { return Object.assign({ q: 1 }, x); }) }); var b2 = $('#rsync'); if (b2) { b2.className = 'sync wait'; b2.textContent = '신호 약함 · 휴대폰에 저장됨, 연결되면 보내요'; } } else LZ.toast(e.message, 4000); }
    }, 350);
  }
  LZ.onFlushed = function () { if (LZ.cur().name === 'round') refreshRound(); };
  LZ.act.rlap = function (el, v) { R.h = +v; paintRound($('#app')); };
  LZ.act.rh = function (el, v) { R.h = Math.max(0, Math.min(R.round.pars.length - 1, R.h + (+v))); paintRound($('#app')); };
  LZ.act.roundPar = function () { var cur = R.round.pars[R.h]; LZ.sheet('<h2>' + LZ.hn(R.lbl || R.h + 1) + ' 파 고치기</h2><p class="muted">조원 누구나 고칠 수 있어요. 이미 적은 ± 스코어는 그대로 두고 타수만 바뀌어요.</p>' + LZ.seg([['3', '파 3'], ['4', '파 4'], ['5', '파 5']], String(cur), 'roundParSet', 'parpick') + (cur > 5 ? '<p class="hint">지금은 파 ' + cur + '예요. 고르면 3·4·5 중 하나로 바뀌어요.</p>' : '')); };
  LZ.act.roundParSet = async function (el, v) { try { var r = await LZ.api('roundPar', { id: R.round.id, h: R.h, par: +v }); R.round = r.round; LZ.rt.rev = r.round.rev; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpAdd = function () { LZ.sheet('<h2>사람 넣기</h2><label class="lb" style="margin-top:0">회원님 닉네임</label><input type="text" id="rpn" class="in" maxlength="8"><button type="button" class="btn" data-act="rpAddMember">회원님 넣기</button><label class="lb">또는 손님 이름</label><input type="text" id="rpg" class="in" maxlength="8"><button type="button" class="btn o" data-act="rpAddGuest">손님 넣기</button><p class="hint">회원님은 라운드 번호 ' + esc(R.round.code) + '로 직접 들어올 수도 있어요.</p>'); };
  LZ.act.rpAddGuest = async function () { try { var r = await LZ.api('roundPlayer', { id: R.round.id, guest: $('#rpg').value }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpAddMember = async function () { try { var g = S.br !== '_me' ? await LZ.api('moimGet', { id: S.br }) : { members: [] }; var hit = (g.members || []).filter(function (x) { return x.nick === LZ.stripNick($('#rpn').value); })[0]; if (!hit) { LZ.toast('같은 클럽 회원님 중에 그 닉네임이 없어요. 손님으로 넣거나 번호로 들어오게 해 주세요', 5000); return; } var r = await LZ.api('roundPlayer', { id: R.round.id, uid: hit.uid }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpRm = function () { var rd = R.round; LZ.sheet('<h2>사람 빼기</h2><p class="muted">점수가 적힌 분은 뺄 수 없어요.</p>' + rd.players.filter(function (p) { return p.k !== rd.owner; }).map(function (p) { return '<button type="button" class="opt" data-act="rpRmDo" data-v="' + esc(p.k) + '"><b>' + LZ.nimE(p.n) + '</b></button>'; }).join('')); };
  LZ.act.rpRmDo = async function (el, k) { try { var r = await LZ.api('roundPlayer', { id: R.round.id, remove: k }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.roundEnd = async function () { if (!(await LZ.confirm('라운드를 끝낼까요?', '끝낸 뒤 2시간 안에는 고칠 수 있어요. 모든 분의 내 라운드 기록에 저장돼요.', '끝내기'))) return; try { var r = await LZ.api('roundEnd', { id: R.round.id }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.go('rres', {}, { replace: true }); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.screens.rall = {
    tab: 'field',
    show: function (p, root) {
      var rd = R.round; if (!rd) { LZ.go('field', {}, { replace: true }); return; }
      var pm = store.get('lz.rallPm') === '1';
      var nh = rd.pars.length, half = function (a, b, lbl) { return '<div class="tblwrap"><table class="tbl" style="margin-bottom:12px"><tr><th>' + lbl + '</th>' + rd.pars.slice(a, b).map(function (_, j) { return '<th>' + (a + j + 1) + '</th>'; }).join('') + '<th>합</th><th>±</th></tr><tr><td>파</td>' + rd.pars.slice(a, b).map(function (x) { return '<td>' + x + '</td>'; }).join('') + '<td class="tot">' + parTo(rd.pars.slice(a, b), b - a) + '</td><td class="tot"></td></tr>' + rd.players.map(function (p) { var T = tot(p, rd.pars, a, b, rd); return '<tr><td><b>' + esc(p.n) + '</b></td>' + p.s.slice(a, b).map(function (x, j) { var d = x - rd.pars[a + j]; return '<td class="' + (!x ? '' : x < rd.pars[a + j] ? 'u' : x > rd.pars[a + j] ? 'o' : '') + '">' + (!x ? '' : pm ? (d > 0 ? '+' + d : d === 0 ? 'E' : d) : x) + '</td>'; }).join('') + '<td class="tot">' + (T.n ? T.t : '') + '</td><td class="tot">' + (T.n ? LZ.pp(T.t - T.par) : '') + '</td></tr>'; }).join('') + '</table></div>'; };
      root.innerHTML = LZ.hdr('전체 점수', { back: true }) + '<div class="wrap">' + LZ.seg([['s', '타수로 보기'], ['pm', '± 스코어로 보기']], pm ? 'pm' : 's', 'rallPm') + '<div style="height:8px"></div>' + half(0, Math.min(9, nh), '전반') + (nh > 9 ? half(9, 18, '후반') : '') + '<div class="card"><h3>총점</h3>' + rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return '<div class="tgl"><b>' + LZ.nimE(p.n) + '</b><span>기준 ' + rd.par + ' · <b>' + T.t + '</b> ' + LZ.pp(T.t - T.par) + ' <span class="muted">(' + T.n + '홀)</span></span></div>'; }).join('') + '</div><p class="hint">빨강 = 파보다 적게(버디↓), 파랑 = 파보다 많이(보기↑)</p></div>';
    }
  };
  LZ.act.rallPm = function (el, v) { store.set('lz.rallPm', v === 'pm' ? '1' : '0'); LZ.redraw(); };
  LZ.screens.rres = {
    tab: 'field',
    show: function (p, root) {
      var rd = R.round; if (!rd) { LZ.go('field', {}, { replace: true }); return; }
      var nh = rd.pars.length, rs = rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return { n: p.n, t: T.t, d: T.t - T.par, h: T.n }; }).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); });
      root.innerHTML = LZ.hdr('라운드 결과', { back: true }) + '<div class="wrap rres2"><div class="rrh"><div class="ctitle">' + esc(rd.fname) + '</div><div class="muted">' + LZ.fmtDate(rd.created) + ' · ' + nh + '홀 · 기준 ' + rd.par + '타' + (rd.weather ? ' · ' + esc(rd.weather) : '') + '</div></div>' +
        '<div class="card tight" id="resCard"><div class="rrl">' + rs.map(function (r, i) { return '<div class="rrw' + (i % 2 ? ' z' : '') + '"><span class="rrk">' + (i === 0 && rs.length > 1 ? LZ.ic('trophy') : (i + 1)) + '</span><div class="t"><b>' + LZ.nimE(r.n) + '</b>' + (r.h < nh ? '<span class="su">' + r.h + '홀까지 · 진행 중</span>' : '') + '</div><span class="rrc ' + relCls(r.d) + '" aria-label="파 대비 ' + rel(r.d) + '">' + rel(r.d) + '</span><span class="rrt">' + r.t + '타</span></div>'; }).join('') + '</div></div>' +
        (rd.players.length > 1 ? '<button type="button" class="btn gold" data-go="awards" data-p=\'' + esc(JSON.stringify({ rid: rd.id })) + '\'>' + LZ.ic('trophy') + '시상식 열기</button>' : '') +
        '<div class="row"><button type="button" class="btn o sm" data-go="rall">' + LZ.ic('note') + '전체 점수 보기</button><button type="button" class="btn kakao sm" data-act="resShare">' + LZ.ic('kakao') + '카톡으로 보내기</button></div>' +
        (rd.grp ? '<button type="button" class="btn o" data-go="event" data-p=\'' + esc(JSON.stringify({ code: rd.grp })) + '\'>' + LZ.ic('club') + '단체 상황판 보기</button>' : '') + '<button type="button" class="btn g" data-go="field">끝</button><p class="hint center">' + (rd.editable && rd.editUntil ? LZ.fmtDate(rd.editUntil, true) + '까지 점수를 고칠 수 있어요. ' : '') + '손님이 가입해서 라운드 링크로 들어오면 그 점수가 본인 기록이 돼요.</p></div>';
    }
  };
  LZ.act.resShare = async function () {
    var rd = R.round, nh = rd.pars.length, lines = rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return p.n + ' ' + T.t + '타 (' + (T.t - T.par > 0 ? '+' : '') + (T.t - T.par) + ')'; });
    var text = '⛳ ' + rd.fname + ' · ' + LZ.fmtDate(rd.created) + '\n' + lines.join('\n') + '\n— 파크골프 공략수첩', url = LZ.APP_URL + '?r=' + rd.code;
    try { var file = await resultImage(rd); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: '라운드 결과', text: text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    LZ.kakaoShare(text, url);
  };
  async function resultImage(rd) {
    var nh = rd.pars.length, cv = document.createElement('canvas'), W = 1080, rowH = 56, H = 260 + rd.players.length * rowH + 120; cv.width = W; cv.height = H;
    var g = cv.getContext('2d'); g.fillStyle = '#F3F6F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0B5D4B'; g.fillRect(0, 0, W, 150);
    g.fillStyle = '#fff'; g.font = '800 46px Pretendard, sans-serif'; g.fillText(rd.fname, 40, 70); g.font = '400 30px Pretendard, sans-serif'; g.fillText(LZ.fmtDate(rd.created) + ' · 기준 ' + rd.par + '타 · 파크골프 공략수첩', 40, 118);
    var rs = rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return { n: p.n, t: T.t, d: T.t - T.par, h: T.n }; }).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); });
    rs.forEach(function (r, i) { var y = 200 + i * rowH; g.fillStyle = i === 0 ? '#FEF3C7' : '#fff'; g.fillRect(40, y - 36, W - 80, 48); g.fillStyle = '#172026'; g.font = '800 32px Pretendard, sans-serif'; g.fillText((i + 1) + '위  ' + LZ.nim(r.n), 60, y); g.textAlign = 'right'; g.fillText(r.t + '타', W - 200, y); g.fillStyle = r.d < 0 ? '#DC2626' : r.d > 0 ? '#2563EB' : '#6B7280'; g.fillText(rel(r.d), W - 70, y); g.textAlign = 'left'; });
    g.fillStyle = '#5F6B72'; g.font = '400 26px Pretendard, sans-serif'; g.fillText('가입하면 내 기록을 볼 수 있어요 · ' + LZ.APP_URL, 40, H - 40);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
    return new File([blob], 'round-' + rd.code + '.png', { type: 'image/png' });
  }
  /* ───── 구장 등록 ───── */
  /* ───── 구장(골프장+코스) 등록 폼: 화면과 시트에서 같이 씀 ─────
     FR = { gc, area, holes(9/18/27/36), ball('park'|'golf'), names[], pars[][], auto }
     파크볼 9홀 기준 33 = 파3×4·파4×4·파5×1 (1~4홀 3, 5~8홀 4, 9홀 5) · 일반골프 36 = 파3×2·파4×5·파5×2 */
  var BALL = { park: { name: '파크볼', std: 33, cnt: { 3: 4, 4: 4, 5: 1 } }, golf: { name: '일반골프', std: 36, cnt: { 3: 2, 4: 5, 5: 2 } } };
  function parDefault(ball) { var c = BALL[ball].cnt, a = []; [3, 4, 5].forEach(function (p) { for (var i = 0; i < c[p]; i++) a.push(p); }); return a; }
  var FR = null;
  LZ.fieldFormInit = function (o) { o = o || {}; var holes = o.holes || 18, n = holes / 9; FR = { gc: o.gc || '', area: o.area || '', holes: holes, ball: o.ball || 'park', auto: true, names: Array.from({ length: n }, function (_, i) { return (o.names && o.names[i]) || String.fromCharCode(65 + i); }), pars: Array.from({ length: n }, function (_, i) { return (o.pars && o.pars[i]) ? o.pars[i].slice() : parDefault(o.ball || 'park'); }), id: o.id || '' }; return FR; };
  LZ.fieldFormHtml = function () {
    var b = BALL[FR.ball];
    return '<label class="lb" style="margin-top:0">골프장 이름</label><input type="text" id="frGc" maxlength="24" value="' + esc(FR.gc) + '" placeholder="예: 화천파크골프장"><label class="lb">지역 <span class="muted" style="font-weight:400">(날씨 표시용)</span></label><input type="text" id="frArea" maxlength="20" value="' + esc(FR.area) + '" placeholder="예: 양주">' +
      (FR.id ? '' : '<label class="lb">홀 수</label>' + LZ.seg([['9', '9홀'], ['18', '18홀'], ['27', '27홀'], ['36', '36홀']], String(FR.holes), 'frHoles', 's')) +
      '<label class="lb">공</label>' + LZ.seg([['park', '파크볼 · 9홀 기준 33'], ['golf', '일반골프 · 9홀 기준 36']], FR.ball, 'frBall', 's') +
      '<p class="muted" style="margin:6px 0 0">코스마다 9홀. 코스 이름은 A·B·C·D 대신 "레이크·마운틴"처럼 바꿔도 돼요 → <b>' + esc(FR.gc || '골프장') + '(' + esc(FR.names[0]) + ')</b> 식으로 저장돼요.</p>' +
      '<div class="tgl" style="margin-top:8px"><span>기준수 자동 맞춤<span class="muted">한 홀을 바꾸면 뒤 홀이 따라 바뀌어 ' + b.std + '을 지켜요. 기준과 다르게 넣으려면 끄고 넣어요</span></span>' + LZ.sw(FR.auto ? 1 : 0, 'frAuto') + '</div>' +
      FR.names.map(function (nm, c) { var sum = FR.pars[c].reduce(function (a, x) { return a + x; }, 0); return '<div class="box" style="margin-top:10px"><div class="row" style="align-items:center"><span class="n" style="width:auto">코스 ' + (c + 1) + '</span><input type="text" id="frName' + c + '" maxlength="12" value="' + esc(nm) + '" placeholder="예: A, 레이크" style="flex:1;margin:0"></div>' + FR.pars[c].map(function (p, h) { return '<div class="frow"><span class="n">' + (h + 1) + '홀</span>' + LZ.seg(LZ.parOpts(p), String(p), 'frPar:' + c + ':' + h, 's par') + '</div>'; }).join('') + '<p class="muted" id="frSum' + c + '" style="margin:6px 0 0">기준 ' + sum + (sum === b.std ? ' ' + LZ.ic('check') : ' (' + b.name + ' 기준 ' + b.std + '보다 ' + (sum > b.std ? sum - b.std + ' 많음' : b.std - sum + ' 적음') + ')') + '</p></div>'; }).join('');
  };
  function frRead() { if ($('#frGc')) FR.gc = $('#frGc').value; if ($('#frArea')) FR.area = $('#frArea').value; FR.names = FR.names.map(function (n, c) { var e = $('#frName' + c); return e ? e.value.trim() || String.fromCharCode(65 + c) : n; }); }
  function frPaint() { var host = $('#frForm'); if (!host) return; frRead(); host.innerHTML = LZ.fieldFormHtml(); }
  LZ.act.frHoles = function (el, v) { frRead(); var n = +v / 9; FR.holes = +v; while (FR.names.length < n) { FR.names.push(String.fromCharCode(65 + FR.names.length)); FR.pars.push(parDefault(FR.ball)); } FR.names = FR.names.slice(0, n); FR.pars = FR.pars.slice(0, n); frPaint(); };
  LZ.act.frBall = function (el, v) { frRead(); FR.ball = v; FR.pars = FR.pars.map(function () { return parDefault(v); }); frPaint(); };
  LZ.act.frAuto = function (el) { FR.auto = !FR.auto; el.classList.toggle('on', FR.auto); };
  /* 연쇄 맞춤: h홀을 a→b로 바꾸면, b>a 일 때 b, b-1, … a+1 파인 첫 홀(h 뒤부터, 없으면 앞)을 한 단계 낮춰 기준수를 지킴. b<a 는 반대로 */
  function frCascade(pars, h, a, b) {
    var dir = b > a ? -1 : 1, v = b;
    while (v !== a) {
      var k = -1; for (var i = h + 1; i < pars.length; i++) if (pars[i] === v) { k = i; break; } if (k < 0) for (var j = 0; j < h; j++) if (pars[j] === v) { k = j; break; }
      if (k < 0) break; pars[k] = v + dir; v = v + dir;
    }
  }
  document.addEventListener('click', function (e) { var el = e.target.closest('[data-act^="frPar:"]'); if (!el || !FR) return; e.preventDefault(); var q = el.dataset.act.split(':'), c = +q[1], h = +q[2], a = FR.pars[c][h], b = +el.dataset.v; if (a === b) return; FR.pars[c][h] = b; if (FR.auto) frCascade(FR.pars[c], h, a, b); frPaint(); });
  LZ.fieldFormRead = function () { frRead(); return { name: FR.gc.trim(), area: FR.area, ball: FR.ball, courses: FR.names.map(function (n, c) { return { cname: n, pars: FR.pars[c].slice() }; }) }; };
  /** 저장 전 확인: 기준수와 다르면 묻기. ok → 서버 저장 결과({fields}) */
  LZ.fieldFormSave = async function () {
    var q = LZ.fieldFormRead(), b = BALL[FR.ball];
    if (q.name.length < 2) { LZ.toast('골프장 이름을 적어 주세요'); return null; }
    var off = q.courses.map(function (c) { var sum = c.pars.reduce(function (x, y) { return x + y; }, 0); return sum === b.std ? '' : '코스 ' + c.cname + ' 기준 ' + sum + '(' + (sum > b.std ? b.std + '보다 ' + (sum - b.std) + ' 많음' : b.std + '보다 ' + (b.std - sum) + ' 적음') + ')'; }).filter(Boolean);
    if (off.length && !(await LZ.confirm('기준수가 달라요', off.join('\n') + '\n\n파6이나 파3이 하나 더 있는 골프장이면 맞아요. 이대로 저장할까요?', '이대로 저장'))) return null;
    LZ.busy(true, '저장 중…');
    if (FR.id) q = { id: FR.id, name: q.name + '(' + q.courses[0].cname + ')', gc: q.name, cname: q.courses[0].cname, area: q.area, ball: q.ball, pars: q.courses[0].pars };
    try { var r = await LZ.api('fieldSave', q); LZ.busy(false); return r; } catch (e) { LZ.busy(false); LZ.toast(e.message, 5000); return null; }
  };
  /* ───── 구장 관리: 내가 등록한(관리자는 모든) 구장 고치기·지우기. 이미 친 라운드는 파를 따로 저장해 두어 바뀌지 않음 ───── */
  LZ.screens.fieldMng = {
    tab: 'field',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('구장 관리', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('fieldList', { all: 1 }); if (!alive()) return;
      var mine = r.list.filter(function (f) { return f.mine || S.user.kind === 'admin'; }), others = r.list.filter(function (f) { return !(f.mine || S.user.kind === 'admin'); });
      root.innerHTML = LZ.hdr('구장 관리', { back: true, right: '<button type="button" class="ib on" data-go="fieldReg">' + LZ.ic('plus') + '구장 등록</button>' }) + '<div class="wrap">' +
        '<p class="hint" style="margin:0 0 8px">이름·파를 고치거나 지울 수 있어요. 이미 끝난 라운드·단체의 점수와 파는 그대로 남아요.</p>' +
        (mine.length ? '<div class="card"><h3>' + (S.user.kind === 'admin' ? '모든 구장' : '내가 등록한 구장') + ' ' + mine.length + '</h3><div class="list">' + mine.map(function (f) { return '<div class="it"><div class="t"><b>' + esc(f.name) + '</b><span class="muted">' + f.n + '홀 · 기준 ' + f.par + (f.ball === 'golf' ? ' · 일반골프' : '') + (f.area ? ' · ' + esc(f.area) : '') + '</span></div><button type="button" class="sm2 g" data-go="fieldEdit" data-p=\'' + esc(JSON.stringify({ id: f.id })) + '\'>' + LZ.ic('edit') + '고치기</button><button type="button" class="sm2 r" data-act="fieldDel" data-v=\'' + esc(JSON.stringify({ id: f.id, name: f.name })) + '\'>지우기</button></div>'; }).join('') + '</div></div>' : '<div class="card"><p class="muted" style="margin:0">내가 등록한 구장이 없어요.</p></div>') +
        (others.length ? '<div class="card"><h3>다른 분이 등록한 구장 ' + others.length + '</h3><div class="list">' + others.map(function (f) { return '<div class="it"><div class="t"><b>' + esc(f.name) + '</b><span class="muted">' + f.n + '홀 · 기준 ' + f.par + ' · 등록 ' + LZ.nimE(f.reg || '') + '</span></div></div>'; }).join('') + '</div><p class="hint">등록한 분이나 관리자가 고칠 수 있어요.</p></div>' : '') + '</div>';
    }
  };
  LZ.act.fieldDel = async function (el, v) { var o = JSON.parse(v); if (!(await LZ.confirm('"' + o.name + '" 구장을 지울까요?', '라운드 열기 목록에서 사라져요. 이미 친 라운드의 점수와 파는 그대로 남아요.', '지우기', 'r'))) return; try { await LZ.api('fieldDel', { id: o.id }); LZ.toast('지웠어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 5000); } };
  LZ.screens.fieldEdit = {
    tab: 'field',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('구장 고치기', { back: true }) + LZ.skeleton(4);
      var r = await LZ.api('fieldList', { all: 1 }); if (!alive()) return; var f = r.list.filter(function (x) { return x.id === p.id; })[0]; if (!f) { LZ.toast('찾는 구장이 없어요'); LZ.back(); return; }
      var gc = f.gc || f.name, cn = f.cname || 'A';
      LZ.fieldFormInit({ holes: f.n === 18 ? 18 : 9, gc: gc, area: f.area, ball: f.ball, names: f.n === 18 ? [cn + '-전', cn + '-후'] : [cn], pars: f.n === 18 ? [f.pars.slice(0, 9), f.pars.slice(9)] : [f.pars.slice()], id: f.id });
      if (f.n === 18) FR.id = '';   // 예전 18홀 구장은 두 코스로 나눠 새로 등록되고, 예전 것은 지우기로
      root.innerHTML = LZ.hdr('구장 고치기', { back: true }) + '<div class="wrap">' + (f.n === 18 ? '<div class="box warn">예전 방식(18홀 한 덩어리) 구장이에요. 저장하면 9홀 코스 두 개로 새로 등록되고, 예전 구장은 구장 관리에서 지워 주세요.</div>' : '') + '<div class="card" id="frForm">' + LZ.fieldFormHtml() + '</div><button type="button" class="btn" data-act="fieldEditSave">저장</button></div>';
    }
  };
  LZ.act.fieldEditSave = async function () { var r = await LZ.fieldFormSave(); if (!r) return; LZ.toast('저장했어요'); LZ.go('fieldMng', {}, { replace: true }); };
  LZ.screens.fieldReg = {
    tab: 'field',
    show: function (p, root) {
      LZ.fieldFormInit({ holes: p.n || 18 });
      root.innerHTML = LZ.hdr('구장 등록', { back: true }) + '<div class="wrap"><div class="card" id="frForm">' + LZ.fieldFormHtml() + '</div><button type="button" class="btn" data-act="fregSave">구장 저장</button><p class="hint">같은 골프장의 코스는 한 번에 등록돼요. 라운드를 열 때 코스를 골라 9·18·27·36홀로 쳐요.</p></div>';
    }
  };
  LZ.act.fregSave = async function () { var r = await LZ.fieldFormSave(); if (!r) return; LZ.toast((r.fields || [r.field]).map(function (f) { return f.name; }).join(', ') + ' 저장했어요', 4000); LZ.back(); };

  /* ───── 실시간(수파베이스 Realtime 방송): 점수를 적으면 같은 라운드 사람들에게 "바뀌었어요"만 알림 ───── */
  var RT = LZ.rt = { ws: null, topic: '', rev: 0, ref: 0, hb: null, poll: null, ok: false, onRev: null };
  RT.start = function (rid, rev, onRev) {
    RT.rev = rev; RT.onRev = onRev; var topic = 'realtime:round-' + rid;
    if (RT.topic === topic && RT.ws && RT.ws.readyState === 1) { RT.setPoll(); return; }
    RT.stop(); RT.topic = topic; RT.rev = rev; RT.onRev = onRev;   // v7.4: stop()이 onRev를 지워서 처음 들어온 점수판이 남의 점수를 못 받던 것 고침
    var url = (window.LZ_CONFIG && LZ_CONFIG.RT) || '';
    if (url && window.WebSocket) {
      try {
        var ws = RT.ws = new WebSocket(url);
        ws.onopen = function () { RT.send('phx_join', { config: { broadcast: { self: false }, presence: { key: '' } } }); RT.hb = setInterval(function () { RT.send('heartbeat', {}, 'phoenix'); }, 25000); };
        ws.onmessage = function (e) { try { var m = JSON.parse(e.data); if (m.event === 'phx_reply' && m.payload && m.payload.status === 'ok' && m.topic === RT.topic) { RT.ok = true; RT.setPoll(); } if (m.event === 'broadcast' && m.payload && m.payload.event === 'rev') { var r = m.payload.payload && m.payload.payload.rev; if (r && r !== RT.rev && RT.onRev) RT.onRev(); } } catch (x) { /* 무시 */ } };
        ws.onclose = function () { if (ws !== RT.ws) return; RT.ok = false; RT.setPoll(); }; ws.onerror = function () { if (ws === RT.ws) RT.ok = false; };
      } catch (e) { RT.ws = null; }
    }
    RT.setPoll();
  };
  RT.send = function (ev, payload, topic) { try { if (RT.ws && RT.ws.readyState === 1) RT.ws.send(JSON.stringify({ topic: topic || RT.topic, event: ev, payload: payload, ref: String(++RT.ref) })); } catch (e) { /* 무시 */ } };
  RT.broadcast = function (rev) { RT.rev = rev; RT.send('broadcast', { type: 'broadcast', event: 'rev', payload: { rev: rev } }); };
  RT.setPoll = function () { clearInterval(RT.poll); RT.poll = setInterval(function () { if (LZ.cur().name !== 'round') { RT.stop(); return; } if (!document.hidden && RT.onRev) RT.onRev(); }, RT.ok ? 20000 : 4000); };
  RT.stop = function () { clearInterval(RT.hb); clearInterval(RT.poll); RT.poll = null; RT.onRev = null; var w = RT.ws; RT.ws = null; try { if (w) w.close(); } catch (e) { /* 무시 */ } RT.topic = ''; RT.ok = false; };
})();
