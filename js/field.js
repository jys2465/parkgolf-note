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
      root.innerHTML = LZ.hdr('필드 라운드') + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap">' +
        (m.round ? '<button type="button" class="cont" data-go="round" data-p=\'' + esc(JSON.stringify({ id: m.round.id })) + '\'><span style="font-size:28px">⛳</span><div style="flex:1"><b>진행 중인 라운드 ' + esc(m.round.code) + '</b><span class="muted">' + esc(m.round.fname) + '</span></div><span>›</span></button>' : '') +
        '<div class="card" style="background:var(--gl)"><h3>필드에서 함께 적는 점수판</h3><p style="margin:0">한 조가 같은 점수판을 봐요. 내가 적어도, 다른 분이 대신 적어도 모두의 화면에 바로 나와요.</p>' +
        '<button type="button" class="btn" data-act="roundOpenS">⛳ 개별 라운드 열기</button><button type="button" class="btn o" data-act="roundJoinS">번호로 함께하기</button></div>' +
        '<div class="card" style="background:#FFF7ED"><h3>🏆 단체 라운드</h3><p style="margin:0 0 4px">조 편성·구장 순서를 미리 정하고 카톡으로 초대해요. 상황판과 시상식은 그 안에 있어요.</p><button type="button" class="btn org" data-go="events">단체 라운드 열기</button></div>' +
        '<div class="card"><h3>내 라운드 기록</h3><div class="kv"><div><b>' + (m.avg || '—') + '</b><span>최근 ' + (m.avgN || 0) + '회 평균</span></div><div><b>' + (m.avgN ? (m.avgPar > 0 ? '+' : '') + m.avgPar : '—') + '</b><span>평균 파 대비</span></div><div><b>' + (m.total || 0) + '</b><span>라운드 수</span></div></div>' +
        (m.list.length ? '<div class="list" style="margin-top:8px">' + m.list.slice(0, 20).map(function (x) { var d = x.tot - x.par; return '<div class="it" style="padding:0"><button type="button" style="flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;padding:12px 4px;text-align:left;color:var(--ink)" data-go="round" data-p=\'' + esc(JSON.stringify({ id: x.rid })) + '\'><div class="t"><b>' + LZ.fmtDate(x.at) + ' · ' + esc(x.fname) + '</b><span class="muted">' + (x.status === 'open' ? '진행 중' : x.n + '홀 ' + x.tot + '타 · ' + LZ.pp(d) + (x.rank ? ' · ' + x.rank.split('/')[1] + '명 중 ' + x.rank.split('/')[0] + '위' : '')) + '</span></div></button>' + (x.status !== 'open' ? '<button type="button" class="sm2 g" style="height:36px;padding:0 10px;flex:none" data-act="roundMineDel" data-v="' + esc(x.rid) + '" aria-label="지우기">✕</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted" style="margin:8px 0 0">아직 라운드 기록이 없어요.</p>') + '</div></div>';
      LZ.paintSync();
    }
  };
  LZ.act.roundMineDel = async function (el, rid) { if (!(await LZ.confirm('이 라운드 기록을 지울까요?', '내 목록과 평균에서만 빠져요. 같은 조의 점수판은 남아요.', '지우기', 'r'))) return; try { await LZ.api('roundMineDel', { rid: rid }); LZ.toast('지웠어요'); LZ.redraw(); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  /* 라운드 열기 */
  var OP = { fid: '', players: [], self: 0, n: 18 };
  LZ.act.roundOpenS = async function () {
    if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 라운드를 열 수 없어요. 남이 연 라운드에는 함께할 수 있어요', 4500); return; }
    var r = await LZ.api('fieldList', {}); OP = { fid: '', players: [], self: 0, n: 18, fields: r.list, mates: r.mates };
    paintOpen();
  };
  function paintOpen() {
    var f = OP.fields.filter(function (x) { return x.id === OP.fid; })[0];
    LZ.sheet('<h2>라운드 열기</h2>' +
      '<label class="lb" style="margin-top:0">구장</label>' + (OP.fields.length ? OP.fields.slice(0, 6).map(function (x) { return '<button type="button" class="opt ' + (OP.fid === x.id ? 'on' : '') + '" data-act="opField" data-v="' + esc(x.id) + '"><b>' + esc(x.name) + '</b><span>' + x.n + '홀 · 기준 ' + x.par + (x.used ? ' · 최근 라운드 ' + LZ.fmtDate(x.used) : '') + '</span></button>'; }).join('') : '') +
      '<button type="button" class="opt ' + (OP.fid === '' && OP.noField ? 'on' : '') + '" data-act="opNoField"><b>구장 없이 시작</b><span>모든 홀 파 4로 시작하고 홀마다 파를 눌러 바꿔요</span></button>' +
      '<div class="row"><button type="button" class="btn o sm" data-act="opMore">구장 더 찾기</button><button type="button" class="btn o sm" data-go="fieldReg">＋ 구장 등록</button></div>' +
      '<label class="lb">함께 치는 분 (' + (OP.players.length + 1) + '명)</label><div class="list"><div class="it"><div class="av">' + esc(S.user.nick.charAt(0)) + '</div><div class="t"><b>' + esc(S.user.nick) + '님 <span class="chip">나</span></b></div></div>' + OP.players.map(function (p, i) { return '<div class="it"><div class="av">' + esc((p.nick || p.guest).charAt(0)) + '</div><div class="t"><b>' + esc(p.nick || p.guest) + '님 ' + (p.guest ? '<span class="chip off">손님</span>' : '') + '</b></div><button type="button" class="sm2 g" data-act="opRm" data-v="' + i + '">빼기</button></div>'; }).join('') + '</div>' +
      (OP.mates && OP.mates.length ? '<p class="muted" style="margin:8px 0 4px">최근에 함께 친 분</p><div class="chips">' + OP.mates.filter(function (m) { return !OP.players.some(function (p) { return p.uid === m.uid; }); }).map(function (m) { return '<button type="button" class="sm2 g" data-act="opMate" data-v=\'' + esc(JSON.stringify(m)) + '\'>＋ ' + esc(m.nick) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="row"><button type="button" class="btn o sm" data-act="opMember">회원님 추가</button><button type="button" class="btn o sm" data-act="opGuest">손님 추가</button></div>' +
      '<div class="tgl"><span>본인 점수는 본인만 적기<span class="muted">끄면 조원 누구나 대신 적어요</span></span>' + LZ.sw(OP.self, 'opSelf') + '</div>' +
      '<button type="button" class="btn" data-act="opGo">라운드 시작</button>');

  }
  LZ.act.opField = function (el, v) { OP.fid = v; OP.noField = false; paintOpen(); };
  LZ.act.opNoField = function () { OP.fid = ''; OP.noField = true; paintOpen(); };
  LZ.act.opMore = async function () { var q = await LZ.dialog({ title: '구장 찾기', html: '<input type="text" id="fq" class="in" placeholder="구장 이름이나 지역">', cancel: null, buttons: [{ label: '찾기', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (v) { return v === 'ok' ? $('#fq').value : null; }); if (q === null) return; var r = await LZ.api('fieldList', { q: q }); OP.fields = r.list; paintOpen(); };
  LZ.act.opRm = function (el, v) { OP.players.splice(+v, 1); paintOpen(); };
  LZ.act.opMate = function (el, v) { var m = JSON.parse(v); if (OP.players.length >= 7) { LZ.toast('한 조는 8명까지예요'); return; } OP.players.push({ uid: m.uid, nick: m.nick }); paintOpen(); };
  LZ.act.opMember = async function () {
    var list = []; (S.me.moims || []).forEach(function () {}); try { var g = await LZ.api('moimGet', { id: S.br !== '_me' ? S.br : (S.me.moims[0] || {}).id }); list = g.members || []; } catch (e) { /* 무시 */ }
    var v = await LZ.dialog({ title: '회원님 추가', html: '<input type="text" id="mn" class="in" placeholder="닉네임" list="mlist"><datalist id="mlist">' + list.map(function (x) { return '<option value="' + esc(x.nick) + '">'; }).join('') + '</datalist><p class="hint">같은 클럽 회원님 이름이 자동으로 떠요. 다른 분은 닉네임을 정확히 적어 주세요.</p>', cancel: null, buttons: [{ label: '추가', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#mn').value : null; });
    if (!v) { paintOpen(); return; }
    var hit = list.filter(function (x) { return x.nick === LZ.stripNick(v); })[0];
    if (hit) OP.players.push({ uid: hit.uid, nick: hit.nick }); else OP.players.push({ nickOnly: LZ.stripNick(v), nick: LZ.stripNick(v) });
    paintOpen();
  };
  LZ.act.opGuest = async function () { var v = await LZ.dialog({ title: '손님 추가', html: '<input type="text" id="gn" class="in" maxlength="8" placeholder="이름 (앱이 없어도 돼요)">', cancel: null, buttons: [{ label: '추가', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (x) { return x === 'ok' ? $('#gn').value : null; }); if (v) OP.players.push({ guest: LZ.stripNick(v) }); paintOpen(); };
  LZ.act.opSelf = function () { OP.self = OP.self ? 0 : 1; paintOpen(); };
  LZ.act.opGo = async function (el, v, ev, force) {
    if (!OP.fid && !OP.noField) { LZ.toast('구장을 고르거나 "구장 없이 시작"을 눌러 주세요'); return; }
    LZ.busy(true, '라운드를 여는 중…');
    try {
      var players = OP.players.map(function (p) { return p.uid ? { uid: p.uid } : p.guest ? { guest: p.guest } : { nick: p.nick }; });
      for (var i = 0; i < players.length; i++) if (players[i].nick) { players[i] = { guest: players[i].nick }; }
      var r = await LZ.api('roundOpen', { fid: OP.fid || undefined, n: OP.n, players: players, self: OP.self, grp: OP.grp || undefined, force: force ? 1 : 0 }, { retry: 0 });
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
  function flashChanged(old, nw) { nw.players.forEach(function (p, k) { var o = old.players[k]; if (o && o.s[R.h] !== p.s[R.h] && p.b[R.h] !== S.user.nick) { var el = $('#pl' + k); if (el) { el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 900); } if (p.s[R.h]) LZ.toast(p.b[R.h] + '님이 ' + (R.h + 1) + '홀 ' + p.n + '님 점수를 적었어요'); } }); }
  function paintRound(root) {
    var rd = R.round, i = R.h, par = rd.pars[i], ended = rd.status !== 'open' && !rd.editable, nh = rd.pars.length, off = !navigator.onLine || LZ.queue.size(), fixing = rd.status !== 'open' && rd.editable;
    var lap = null, lapTabs = ''; if (rd.laps && rd.laps.length > 1) { rd.laps.forEach(function (l, k) { if (i >= l.from && i < l.from + l.n) lap = l; }); lapTabs = '<div class="seg s" style="margin-bottom:8px">' + rd.laps.map(function (l, k) { return '<button type="button" class="' + (lap === l ? 'on' : '') + '" data-act="rlap" data-v="' + l.from + '">' + (k + 1) + '바퀴 ' + esc(l.fname) + '</button>'; }).join('') + '</div>'; }
    var holeNo = lap ? (i - lap.from + 1) : (i + 1);
    root.innerHTML = LZ.hdr(rd.code, { back: true, noBell: 1, right: '<button type="button" class="ib" data-go="rall">전체</button>' + (ended ? '' : '<button type="button" class="ib" data-act="roundShare">초대</button>') }) + '<div class="wrap">' +
      '<div class="sync ' + (off ? 'wait' : 'ok') + '" id="rsync">' + (ended ? '끝난 라운드예요' + (rd.edits && rd.edits.length ? '' : '') : fixing ? '끝남 · ' + Math.max(1, Math.round((rd.editUntil - Date.now()) / 60000)) + '분 동안 고칠 수 있어요' : off ? '📶 신호 약함 · 휴대폰에 저장됨, 연결되면 보내요' : '✓ 모두 저장됨 · 실시간으로 함께 보는 중 · ' + LZ.fmtDate(rd.endsAt, true) + ' 자동 종료') + '</div>' +
      lapTabs + '<div class="card center" style="padding:12px"><div style="font-size:calc(var(--fs) + 10px);font-weight:800">' + holeNo + '홀 ' + (ended ? '<span style="font-size:var(--t3);color:var(--sub)">파 ' + par + '</span>' : '<button type="button" class="sm2 g" style="height:36px" data-act="roundPar">파 ' + par + ' ✎</button>') + '</div><div class="muted">' + esc(rd.fname) + ' · 기준 ' + rd.par + '타' + (rd.grp ? ' · 단체 ' + esc(rd.grp) : '') + '</div>' + (rd.weather ? '<div class="muted" style="margin-top:4px">🌤 ' + esc(rd.weather) + '</div>' : '') + '</div>' +
      rd.players.map(function (p, k) { var s = p.s[i], T = tot(p, rd.pars, 0, nh, rd), canEdit = !ended && (!rd.self || p.guest || p.k === S.user.uid); return '<div class="pl" id="pl' + k + '"><div class="hd"><b>' + esc(p.n) + '님</b>' + (p.guest ? '<span class="chip off">손님</span>' : '') + '<span class="sum">' + T.n + '홀 <b style="color:var(--ink)">' + T.t + '타</b> ' + LZ.pp(T.t - T.par) + ' <span style="opacity:.7">· 기준 ' + rd.par + '</span></span></div>' +
        '<div class="ln"><span class="who">' + (p.b[i] ? esc(p.b[i]) + '님이 적음' : '아직 안 적었어요') + '</span><button type="button" data-act="sc" data-v="' + k + ':-1"' + (canEdit ? '' : ' disabled') + '>−</button><div class="sc ' + (!s ? 'none' : s < par ? 'u' : s > par ? 'o' : 'e') + '">' + (!s ? '0' : (s - par > 0 ? '+' + (s - par) : s - par)) + '<small>' + (!s ? '파 ' + par + ' (안 적으면 파)' : s + '타') + '</small></div><button type="button" data-act="sc" data-v="' + k + ':1"' + (canEdit ? '' : ' disabled') + '>＋</button></div></div>'; }).join('') +
      (!ended ? '<div class="row"><button type="button" class="btn g sm" data-act="rpAdd">＋ 사람 넣기</button>' + (rd.isOwner ? '<button type="button" class="btn g sm" data-act="rpRm">사람 빼기</button>' : '') + '</div>' : '') +
      '<div class="nav2"><button type="button" data-act="rh" data-v="-1"' + (i <= 0 ? ' disabled' : '') + '>‹ 이전 홀</button><button type="button" data-act="rh" data-v="1"' + (i >= nh - 1 ? ' disabled' : '') + '>다음 홀 ›</button></div>' +
      (rd.edits && rd.edits.length ? '<p class="muted small" style="margin:8px 0 0">✎ ' + rd.edits.map(function (x) { return LZ.fmtDate(x.at, true) + ' ' + esc(x.nick) + '님 수정'; }).join(' · ') + '</p>' : '') +
      (rd.status !== 'open' ? '<button type="button" class="btn" data-go="rres">결과 보기</button>' : (rd.isOwner || S.user.kind === 'admin' || rd.grp ? '<button type="button" class="btn o" data-act="roundEnd">라운드 끝내기</button>' : '<p class="hint center">라운드를 연 분이 끝내요. 12시간이 지나면 저절로 끝나요.</p>')) + '</div>';
  }
  LZ.act.sc = function (el, v) {
    var parts = v.split(':'), k = +parts[0], d = +parts[1], rd = R.round, p = rd.players[k], par = rd.pars[R.h], s = p.s[R.h];
    s = Math.max(1, Math.min(15, (s || par) + d));                           // 안 적은 홀은 파에서 시작: + 는 보기, − 는 버디 p.s[R.h] = s; p.b[R.h] = S.user.nick; p.t[R.h] = Date.now();
    paintRound($('#app'));
    sendScore({ k: p.k, h: R.h, s: s, at: Date.now() });
  };
  var pend = [], sendT = null;
  function sendScore(it) {
    pend.push(it); clearTimeout(sendT);
    sendT = setTimeout(async function () {
      var items = pend; pend = [];
      try { var r = await LZ.api('roundScore', { id: R.round.id, items: items }, { retry: 0, timeout: 12000 }); if (r.denied) LZ.toast('"본인 점수는 본인만" 설정이라 적을 수 없는 분이 있어요', 4000); var h = R.h; R.round = r.round; R.h = h; LZ.rt.rev = r.round.rev; LZ.rt.broadcast(r.round.rev); if (LZ.cur().name === 'round') { var b = $('#rsync'); if (b) { b.className = 'sync ok'; b.textContent = '✓ 모두 저장됨 · 실시간으로 함께 보는 중'; } } }
      catch (e) { if (e.code === 'ended') { LZ.toast('끝난 라운드예요'); refreshRound(); return; } if (e.code === 'net' || e.code === 'server' || e.code === 'busy') { LZ.queue.push('roundScore', { id: R.round.id, items: items.map(function (x) { return Object.assign({ q: 1 }, x); }) }); var b2 = $('#rsync'); if (b2) { b2.className = 'sync wait'; b2.textContent = '📶 신호 약함 · 휴대폰에 저장됨, 연결되면 보내요'; } } else LZ.toast(e.message, 4000); }
    }, 350);
  }
  LZ.onFlushed = function () { if (LZ.cur().name === 'round') refreshRound(); };
  LZ.act.rlap = function (el, v) { R.h = +v; paintRound($('#app')); };
  LZ.act.rh = function (el, v) { R.h = Math.max(0, Math.min(R.round.pars.length - 1, R.h + (+v))); paintRound($('#app')); };
  LZ.act.roundPar = function () { LZ.sheet('<h2>' + (R.h + 1) + '홀 파</h2><p class="muted">조원 누구나 고칠 수 있어요. 구장 정보에도 반영돼요.</p>' + LZ.seg([['3', '파 3'], ['4', '파 4'], ['5', '파 5']], String(R.round.pars[R.h]), 'roundParSet')); };
  LZ.act.roundParSet = async function (el, v) { try { var r = await LZ.api('roundPar', { id: R.round.id, h: R.h, par: +v }); R.round = r.round; LZ.rt.rev = r.round.rev; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpAdd = function () { LZ.sheet('<h2>사람 넣기</h2><label class="lb" style="margin-top:0">회원님 닉네임</label><input type="text" id="rpn" class="in" maxlength="8"><button type="button" class="btn" data-act="rpAddMember">회원님 넣기</button><label class="lb">또는 손님 이름</label><input type="text" id="rpg" class="in" maxlength="8"><button type="button" class="btn o" data-act="rpAddGuest">손님 넣기</button><p class="hint">회원님은 라운드 번호 ' + esc(R.round.code) + '로 직접 들어올 수도 있어요.</p>'); };
  LZ.act.rpAddGuest = async function () { try { var r = await LZ.api('roundPlayer', { id: R.round.id, guest: $('#rpg').value }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpAddMember = async function () { try { var g = S.br !== '_me' ? await LZ.api('moimGet', { id: S.br }) : { members: [] }; var hit = (g.members || []).filter(function (x) { return x.nick === LZ.stripNick($('#rpn').value); })[0]; if (!hit) { LZ.toast('같은 클럽 회원님 중에 그 닉네임이 없어요. 손님으로 넣거나 번호로 들어오게 해 주세요', 5000); return; } var r = await LZ.api('roundPlayer', { id: R.round.id, uid: hit.uid }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.rpRm = function () { var rd = R.round; LZ.sheet('<h2>사람 빼기</h2><p class="muted">점수가 적힌 분은 뺄 수 없어요.</p>' + rd.players.filter(function (p) { return p.k !== rd.owner; }).map(function (p) { return '<button type="button" class="opt" data-act="rpRmDo" data-v="' + esc(p.k) + '"><b>' + esc(p.n) + '님</b></button>'; }).join('')); };
  LZ.act.rpRmDo = async function (el, k) { try { var r = await LZ.api('roundPlayer', { id: R.round.id, remove: k }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.closeSheet(); paintRound($('#app')); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.act.roundEnd = async function () { if (!(await LZ.confirm('라운드를 끝낼까요?', '끝낸 뒤 2시간 안에는 고칠 수 있어요. 모든 분의 내 라운드 기록에 저장돼요.', '끝내기'))) return; try { var r = await LZ.api('roundEnd', { id: R.round.id }); R.round = r.round; LZ.rt.broadcast(r.round.rev); LZ.go('rres', {}, { replace: true }); } catch (e) { LZ.toast(e.message, 4000); } };
  LZ.screens.rall = {
    tab: 'field',
    show: function (p, root) {
      var rd = R.round; if (!rd) { LZ.go('field', {}, { replace: true }); return; }
      var pm = store.get('lz.rallPm') === '1';
      var nh = rd.pars.length, half = function (a, b, lbl) { return '<div class="tblwrap"><table class="tbl" style="margin-bottom:12px"><tr><th>' + lbl + '</th>' + rd.pars.slice(a, b).map(function (_, j) { return '<th>' + (a + j + 1) + '</th>'; }).join('') + '<th>합</th><th>±</th></tr><tr><td>파</td>' + rd.pars.slice(a, b).map(function (x) { return '<td>' + x + '</td>'; }).join('') + '<td class="tot">' + parTo(rd.pars.slice(a, b), b - a) + '</td><td class="tot"></td></tr>' + rd.players.map(function (p) { var T = tot(p, rd.pars, a, b, rd); return '<tr><td><b>' + esc(p.n) + '</b></td>' + p.s.slice(a, b).map(function (x, j) { var d = x - rd.pars[a + j]; return '<td class="' + (!x ? '' : x < rd.pars[a + j] ? 'u' : x > rd.pars[a + j] ? 'o' : '') + '">' + (!x ? '' : pm ? (d > 0 ? '+' + d : d === 0 ? 'E' : d) : x) + '</td>'; }).join('') + '<td class="tot">' + (T.n ? T.t : '') + '</td><td class="tot">' + (T.n ? LZ.pp(T.t - T.par) : '') + '</td></tr>'; }).join('') + '</table></div>'; };
      root.innerHTML = LZ.hdr('전체 점수', { back: true }) + '<div class="wrap">' + LZ.seg([['s', '타수로 보기'], ['pm', '± 스코어로 보기']], pm ? 'pm' : 's', 'rallPm') + '<div style="height:8px"></div>' + half(0, Math.min(9, nh), '전반') + (nh > 9 ? half(9, 18, '후반') : '') + '<div class="card"><h3>총점</h3>' + rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return '<div class="tgl"><b>' + esc(p.n) + '님</b><span>기준 ' + rd.par + ' · <b>' + T.t + '</b> ' + LZ.pp(T.t - T.par) + ' <span class="muted">(' + T.n + '홀)</span></span></div>'; }).join('') + '</div><p class="hint">빨강 = 파보다 적게(버디↓), 파랑 = 파보다 많이(보기↑)</p></div>';
    }
  };
  LZ.act.rallPm = function (el, v) { store.set('lz.rallPm', v === 'pm' ? '1' : '0'); LZ.redraw(); };
  LZ.screens.rres = {
    tab: 'field',
    show: function (p, root) {
      var rd = R.round; if (!rd) { LZ.go('field', {}, { replace: true }); return; }
      var nh = rd.pars.length, rs = rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return { n: p.n, t: T.t, d: T.t - T.par, h: T.n }; }).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); });
      root.innerHTML = LZ.hdr('라운드 결과', { back: true }) + '<div class="wrap"><div class="card" id="resCard"><h3>' + esc(rd.fname) + '</h3><p class="muted" style="margin:0 0 8px">' + LZ.fmtDate(rd.created) + ' · 기준 ' + rd.par + '타' + (rd.weather ? ' · ' + esc(rd.weather) : '') + '</p><div class="list">' + rs.map(function (r, i) { return '<div class="it"><div class="av ' + (i === 0 ? 'y' : '') + '">' + (i + 1) + '</div><div class="t"><b>' + esc(r.n) + '님</b><span class="muted">' + (r.h < nh ? r.h + '홀까지 · 진행 중' : nh + '홀') + '</span></div><b style="font-size:var(--t3)">' + r.t + '타</b> ' + LZ.pp(r.d) + '</div>'; }).join('') + '</div></div>' +
        '<button type="button" class="btn kakao" data-act="resShare">카톡으로 결과 보내기</button>' + (rd.grp ? '<button type="button" class="btn o" data-go="event" data-p=\'' + esc(JSON.stringify({ code: rd.grp })) + '\'>단체 상황판 보기</button>' : '') + '<button type="button" class="btn g" data-go="field">끝</button><p class="hint center">손님이 가입해서 라운드 링크로 들어오면 그 점수가 본인 기록이 돼요.</p></div>';
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
    g.fillStyle = '#fff'; g.font = '800 46px Pretendard, sans-serif'; g.fillText('⛳ ' + rd.fname, 40, 70); g.font = '400 30px Pretendard, sans-serif'; g.fillText(LZ.fmtDate(rd.created) + ' · 기준 ' + rd.par + '타 · 파크골프 공략수첩', 40, 118);
    var rs = rd.players.map(function (p) { var T = tot(p, rd.pars, 0, nh, rd); return { n: p.n, t: T.t, d: T.t - T.par, h: T.n }; }).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); });
    rs.forEach(function (r, i) { var y = 200 + i * rowH; g.fillStyle = i === 0 ? '#FEF3C7' : '#fff'; g.fillRect(40, y - 36, W - 80, 48); g.fillStyle = '#172026'; g.font = '800 32px Pretendard, sans-serif'; g.fillText((i + 1) + '위  ' + r.n + '님', 60, y); g.textAlign = 'right'; g.fillText(r.t + '타', W - 200, y); g.fillStyle = r.d < 0 ? '#DC2626' : r.d > 0 ? '#2563EB' : '#6B7280'; g.fillText(r.d > 0 ? '+' + r.d : r.d === 0 ? 'E' : String(r.d), W - 70, y); g.textAlign = 'left'; });
    g.fillStyle = '#5F6B72'; g.font = '400 26px Pretendard, sans-serif'; g.fillText('가입하면 내 기록을 볼 수 있어요 · ' + LZ.APP_URL, 40, H - 40);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
    return new File([blob], 'round-' + rd.code + '.png', { type: 'image/png' });
  }
  /* ───── 구장 등록 ───── */
  LZ.screens.fieldReg = {
    tab: 'field',
    show: function (p, root) {
      var n = p.n || 18;
      root.innerHTML = LZ.hdr('구장 등록', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">구장 이름</label><input type="text" id="fname" maxlength="30" placeholder="예: 양주 덕계 파크골프장 A·B코스"><label class="lb">지역 <span class="muted" style="font-weight:400">(날씨 표시용)</span></label><input type="text" id="farea" maxlength="20" placeholder="예: 양주"><label class="lb">홀 수</label>' + LZ.seg([['9', '9홀'], ['18', '18홀']], String(n), 'fregN') + '</div><div class="card"><h3>홀별 파</h3>' + Array.from({ length: n }, function (_, i) { return '<div class="frow"><span class="n">' + (i + 1) + '홀</span>' + LZ.seg([['3', '3'], ['4', '4'], ['5', '5']], i % 3 === 1 ? '4' : i % 3 === 2 && i % 2 ? '5' : '3', 'fpar:' + i, 's') + '</div>'; }).join('') + '<p class="muted" id="fsum" style="margin:8px 0 0"></p></div><button type="button" class="btn" data-act="fregSave">구장 저장</button><p class="hint">일반 골프장(기준 72)도 같은 방법으로 등록할 수 있어요.</p></div>';
      FR = { n: n, pars: Array.from({ length: n }, function (_, i) { return i % 3 === 1 ? 4 : i % 3 === 2 && i % 2 ? 5 : 3; }) }; sumPaint();
    }
  };
  var FR = null;
  function sumPaint() { var s = $('#fsum'); if (s) s.textContent = '기준 타수 ' + FR.pars.reduce(function (a, b) { return a + b; }, 0); }
  LZ.act.fregN = function (el, v) { LZ.go('fieldReg', { n: +v }, { replace: true }); };
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-act^="fpar:"]'); if (!a || !FR) return; e.preventDefault(); var i = +a.dataset.act.split(':')[1]; FR.pars[i] = +a.dataset.v; $$('[data-act="fpar:' + i + '"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === a.dataset.v); }); sumPaint(); });
  LZ.act.fregSave = async function () { try { var r = await LZ.api('fieldSave', { name: $('#fname').value, area: $('#farea').value, pars: FR.pars }); LZ.toast(r.dup ? '같은 이름의 구장이 이미 있어서 그 구장을 써요' : '구장을 저장했어요', 4000); LZ.back(); } catch (e) { LZ.toast(e.message, 5000); } };

  /* ───── 실시간(수파베이스 Realtime 방송): 점수를 적으면 같은 라운드 사람들에게 "바뀌었어요"만 알림 ───── */
  var RT = LZ.rt = { ws: null, topic: '', rev: 0, ref: 0, hb: null, poll: null, ok: false, onRev: null };
  RT.start = function (rid, rev, onRev) {
    RT.rev = rev; RT.onRev = onRev; var topic = 'realtime:round-' + rid;
    if (RT.topic === topic && RT.ws && RT.ws.readyState === 1) { RT.setPoll(); return; }
    RT.stop(); RT.topic = topic;
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
