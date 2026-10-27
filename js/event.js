/* 단체 라운드: 홈(만들기·코드 입장·내 단체) · 만들기 3단계(기본 → 코스 순서·조별 진행 순서 → 조 편성) · 초대 글/그림 · 입장 · 상황판 3탭 · 시상식(조별 1부 · 개인 2부) · 시상 진행 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var EV = { d: null, tm: 'top3', timer: null };
  function itBtn(go, p, inner) { return '<button type="button" class="it" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:var(--ink)" data-go="' + go + '" data-p=\'' + esc(JSON.stringify(p)) + '\'>' + inner + '<span>›</span></button>'; }

  /* ───── 단체 홈 ───── */
  LZ.screens.events = {
    tab: 'field',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('단체 라운드', { back: true }) + LZ.skeleton(3);
      var r = await LZ.api('eventMine', {}); if (!alive()) return;
      root.innerHTML = LZ.hdr('단체 라운드', { back: true }) + '<div class="wrap">' +
        '<div class="card" style="background:#FFF7ED"><h3>🏆 단체 라운드 만들기</h3><p style="margin:0 0 4px">이름·날짜 → 구장·바퀴·순서 → 조 편성 → 카톡 초대. 회원님 누구나 주최할 수 있어요.</p><button type="button" class="btn org" data-go="evMake" data-p=\'{"step":1}\'>만들기</button></div>' +
        '<div class="card"><h3>코드로 입장</h3><p class="muted" style="margin:0 0 6px">주최자가 알려 준 단체 코드 2자리</p><div class="row"><input type="tel" id="ecode" inputmode="numeric" maxlength="2" placeholder="예: 52"><button type="button" class="btn" style="margin:0;flex:none;width:120px" data-act="evEnterCode">입장</button></div></div>' +
        (r.list.length ? '<div class="card"><h3>내 단체 라운드</h3><div class="list">' + r.list.map(function (e) { return itBtn('event', { code: e.code }, '<div class="t"><b>' + esc(e.name) + ' <span class="chip">' + esc(e.code) + '</span>' + (e.status === 'open' ? '<span class="chip cap">진행 중</span>' : '') + (e.isOwner ? '<span class="chip">주최</span>' : '') + '</b><span class="muted">' + esc(e.fname) + ' · ' + LZ.fmtDate(e.created) + '</span></div>'); }).join('') + '</div></div>' : '') + '</div>';
    }
  };
  LZ.act.evEnterCode = function () { var c = $('#ecode').value.replace(/\D/g, ''); if (c.length !== 2) { LZ.toast('단체 코드 2자리를 넣어 주세요'); return; } LZ.go('evEnter', { code: c }); };

  /* ───── 만들기 3단계 ───── */
  var MK = null;
  function mkInit(p) { if (!MK || p.reset) MK = { name: '', date: '', holes: 18, laps: [null], nTeams: 4, teams: [], pool: [], order: {}, fields: null }; }
  function segLabel(i) { return (Math.floor(i / 2) + 1) + '-' + (i % 2 ? '후' : '전'); }
  /** 코스 칸 이름: 코스 이름(A·레이크…), 없으면 1-전 식 */
  function segName(laps, li) { var l = laps && laps[li]; if (!l) return segLabel(li); var cn = l.cname || (l.fname || l.name || '').replace(/^.*\(([^()]+)\)$/, '$1') || segLabel(li); var dup = laps.some(function (x, k) { return x && k !== li && x.fid !== l.fid && (x.cname || (x.fname || x.name || '').replace(/^.*\(([^()]+)\)$/, '$1')) === cn; }); return dup ? (l.fname || l.name) : cn; }
  function lapLabel(l) { return l ? (l.fid ? esc(l.fname) : esc(l.name) + ' (새 구장)') : '구장 고르기'; }
  LZ.screens.evMake = {
    tab: 'field',
    show: async function (p, root, alive) {
      mkInit(p); var step = p.step || 1;
      if (!MK.fields) { root.innerHTML = LZ.hdr('단체 만들기', { back: true }) + LZ.skeleton(3); var r = await LZ.api('fieldList', {}); if (!alive()) return; MK.fields = r.list; }
      var H = LZ.hdr('단체 만들기 ' + step + '/3', { back: true }) + '<div class="wrap">' + '<div class="steps"><span class="' + (step >= 1 ? 'on' : '') + '">① 기본</span><span class="' + (step >= 2 ? 'on' : '') + '">② 구장·순서</span><span class="' + (step >= 3 ? 'on' : '') + '">③ 조 편성</span></div>';
      if (step === 1) {
        root.innerHTML = H + '<div class="card"><label class="lb" style="margin-top:0">이름</label><input type="text" id="mkName" maxlength="30" value="' + esc(MK.name) + '" placeholder="예: 10월 정기 라운드"><label class="lb">날짜</label><input type="text" id="mkDate" maxlength="20" value="' + esc(MK.date) + '" placeholder="예: 10/30(목) 9시"><label class="lb">조 수 <span class="muted" style="font-weight:400">(1~50)</span></label><div class="step"><button type="button" data-act="mkTeams" data-v="-1">−</button><div class="v" id="mkN">' + MK.nTeams + '조<small>한 조 2~5명</small></div><button type="button" data-act="mkTeams" data-v="1">＋</button></div></div><button type="button" class="btn" data-act="mkNext" data-v="2">다음 · 구장·순서</button></div>';
        $('#mkName').addEventListener('input', function () { MK.name = this.value; }); $('#mkDate').addEventListener('input', function () { MK.date = this.value; });
      } else if (step === 2) {
        var nL = MK.holes / 9;
        root.innerHTML = H + '<div class="card"><label class="lb" style="margin-top:0">홀 수</label>' + LZ.seg([['18', '18홀'], ['36', '36홀'], ['54', '54홀'], ['72', '72홀']], String(MK.holes), 'mkHoles') + '<p class="muted" style="margin:8px 0 0">9홀 코스를 순서대로 골라요. 1-전·1-후가 1바퀴(18홀)예요. 같은 코스를 여러 번 돌아도 돼요.</p></div>' +
          '<div class="card"><h3>코스 순서</h3>' + Array.from({ length: nL }, function (_, i) { return '<button type="button" class="opt" data-act="mkLap" data-v="' + i + '"><b>' + segLabel(i) + ' · ' + lapLabel(MK.laps[i]) + '</b><span>' + (MK.laps[i] ? '기준 ' + (MK.laps[i].pars || []).reduce(function (a, b) { return a + b; }, 0) + '타 · 누르면 바꾸기' : '누르면 고르기') + '</span></button>'; }).join('') + '</div>' +
          (nL > 1 ? '<div class="card"><h3>조별 진행 순서</h3><p class="muted" style="margin:0 0 8px">조마다 어느 코스부터 돌지 정해요. <b>자동 배치</b>는 조를 둘씩 묶어 시작 코스를 한 칸씩 밀어요. 칸을 누르면 다음 코스로 바뀌어요.</p><button type="button" class="btn o" data-act="mkAutoOrder" style="margin-bottom:10px">⚡ 자동 배치</button><div class="tblwrap"><table class="tbl ord"><tr><th>조</th>' + Array.from({ length: nL }, function (_, i) { return '<th>' + (i + 1) + '번째</th>'; }).join('') + '</tr>' + Array.from({ length: MK.nTeams }, function (_, t) { var o = MK.order[t + 1] || Array.from({ length: nL }, function (_, i) { return i; }); return '<tr><td><b>' + (t + 1) + '조</b></td>' + o.map(function (li, k) { return '<td><button type="button" class="sm2 pick" data-act="mkOrd" data-v="' + (t + 1) + ':' + k + '">' + esc(segName(MK.laps, li)) + '</button></td>'; }).join('') + '</tr>'; }).join('') + '</table></div></div>' : '') +
          '<div class="row"><button type="button" class="btn g" data-act="mkNext" data-v="1">‹ 이전</button><button type="button" class="btn" data-act="mkNext" data-v="3">다음 · 조 편성</button></div></div>';
      } else {
        while (MK.teams.length < MK.nTeams) MK.teams.push([]); MK.teams = MK.teams.slice(0, MK.nTeams);
        var sel = MK.sel || {};
        root.innerHTML = H + '<div class="card"><h3>이름 넣기</h3><div class="row"><input type="text" id="mkWho" maxlength="8" placeholder="닉네임 또는 손님 이름"><button type="button" class="btn" style="margin:0;flex:none;width:90px" data-act="mkAdd">넣기</button></div><div class="row" style="margin-top:8px"><button type="button" class="btn g sm" data-act="mkFromClub">클럽 회원 고르기</button><button type="button" class="btn g sm" data-act="mkAuto">자동 편성</button></div><p class="hint">넣은 이름은 대기 명단에 쌓여요. 자동 편성은 조 수에 맞춰 고르게 나눠요.</p></div>' +
          '<div class="card"><h3>대기 명단 <span class="muted" style="font-weight:400">' + MK.pool.length + '명</span></h3>' + (MK.pool.length ? '<div class="chips wrap2">' + MK.pool.map(function (m, i) { return '<button type="button" class="sm2 ' + (sel['p' + i] ? '' : 'g') + '" data-act="mkSel" data-v="p' + i + '">' + esc(m.nick) + (m.guest ? ' 👤' : '') + '</button>'; }).join('') + '</div><div class="row"><select id="mkTo" class="in" style="height:44px">' + MK.teams.map(function (_, t) { return '<option value="' + t + '">' + (t + 1) + '조로</option>'; }).join('') + '</select><button type="button" class="btn sm" style="margin:0" data-act="mkMove">체크한 분 넣기</button></div>' : '<p class="muted" style="margin:0">비어 있어요.</p>') + '</div>' +
          MK.teams.map(function (t, ti) { return '<div class="card tight"><div style="display:flex;align-items:center"><h3 style="flex:1;margin:0">' + (ti + 1) + '조 <span class="muted" style="font-weight:400">' + t.length + '/8</span></h3></div>' + (t.length ? '<div class="chips wrap2">' + t.map(function (m, i) { return '<button type="button" class="sm2 g" data-act="mkOut" data-v="' + ti + ':' + i + '">' + esc(m.nick) + (m.guest ? ' 👤' : '') + ' ✕</button>'; }).join('') + '</div>' : '<p class="muted small" style="margin:4px 0 0">아직 없어요 · 대기 명단에서 넣어요</p>') + '</div>'; }).join('') +
          '<div class="row"><button type="button" class="btn g" data-act="mkNext" data-v="2">‹ 이전</button><button type="button" class="btn org" data-act="mkCreate">만들고 초대하기</button></div><p class="hint">편성은 나중에 상황판의 편성표에서 바꿀 수 있어요.</p></div>';
        var w = $('#mkWho'); w.addEventListener('keydown', function (e) { if (e.key === 'Enter') LZ.act.mkAdd(); });
      }
    }
  };
  LZ.act.mkTeams = function (el, v) { MK.nTeams = Math.max(1, Math.min(50, MK.nTeams + (+v))); $('#mkN').innerHTML = MK.nTeams + '조<small>한 조 2~5명</small>'; };
  LZ.act.mkNext = function (el, v) { if (+v >= 2 && MK.name.trim().length < 2) { LZ.toast('이름을 적어 주세요'); return; } if (+v === 3 && MK.laps.slice(0, MK.holes / 9).some(function (l) { return !l; })) { LZ.toast('코스 순서를 모두 골라 주세요'); return; } LZ.go('evMake', { step: +v }, { replace: true }); };
  LZ.act.mkHoles = function (el, v) { MK.holes = +v; var n = MK.holes / 9; while (MK.laps.length < n) MK.laps.push(MK.laps[0] || null); MK.laps = MK.laps.slice(0, n); MK.order = {}; LZ.redraw(); };
  LZ.act.mkLap = function (el, v) {
    var i = +v, fs = MK.fields.filter(function (f) { return f.n === 9; });
    LZ.sheet('<h2>' + segLabel(i) + ' 코스</h2>' + (fs.length ? fs.map(function (f) { return '<button type="button" class="opt" data-act="mkLapPick" data-v="' + i + ':' + esc(f.id) + '"><b>' + esc(f.name) + '</b><span>9홀 · 기준 ' + f.par + (f.ball === 'golf' ? ' · 일반골프' : '') + '</span></button>'; }).join('') : '<p class="muted">아직 등록된 9홀 코스가 없어요. 아래에서 골프장과 코스를 등록하세요.</p>') + '<button type="button" class="btn o" data-act="mkLapNew" data-v="' + i + '">＋ 새 골프장·코스 등록</button>');
  };
  LZ.act.mkLapPick = function (el, v) { var p = v.split(':'), f = MK.fields.filter(function (x) { return x.id === p[1]; })[0]; if (f) MK.laps[+p[0]] = { fid: f.id, fname: f.name, cname: f.cname, pars: f.pars }; LZ.closeSheet(); LZ.redraw(); };
  LZ.act.mkLapNew = function (el, v) {
    var i = +v; LZ.fieldFormInit({ holes: 18 });
    LZ.sheet('<h2>새 골프장·코스 등록</h2><div id="frForm">' + LZ.fieldFormHtml() + '</div><button type="button" class="btn" data-act="mkLapSave" data-v="' + i + '">등록하고 코스 넣기</button><p class="hint">등록한 코스가 ' + segLabel(i) + '부터 순서대로 들어가요.</p>');
  };
  LZ.act.mkLapSave = async function (el, v) {
    var r = await LZ.fieldFormSave(); if (!r) return; var i = +v, fs = r.fields || [r.field];
    fs.forEach(function (f) { if (!MK.fields.some(function (x) { return x.id === f.id; })) MK.fields.unshift(f); });
    fs.forEach(function (f, k) { if (i + k < MK.holes / 9) MK.laps[i + k] = { fid: f.id, fname: f.name, cname: f.cname, pars: f.pars }; });
    LZ.closeSheet(); LZ.redraw();
  };
  LZ.act.mkAutoOrder = function () { var n = MK.holes / 9, o = {}; for (var t = 1; t <= MK.nTeams; t++) { var sh = Math.floor((t - 1) / 2) % n; o[t] = Array.from({ length: n }, function (_, i) { return (i + sh) % n; }); } MK.order = o; LZ.redraw(); };
  LZ.act.mkOrd = function (el, v) { var p = v.split(':'), t = +p[0], k = +p[1], n = MK.holes / 9, o = (MK.order[t] || Array.from({ length: n }, function (_, i) { return i; })).slice(); o[k] = (o[k] + 1) % n; MK.order[t] = o; el.textContent = segName(MK.laps, o[k]); };
  function mkHas(nick) { var k = LZ.stripNick(nick).toLowerCase(); return MK.pool.concat.apply(MK.pool, MK.teams).some(function (m) { return m.nick.toLowerCase() === k; }); }
  LZ.act.mkAdd = function () { var w = $('#mkWho'), nm = LZ.stripNick(w.value); if (nm.length < 2) { LZ.toast('이름을 적어 주세요'); return; } if (mkHas(nm)) { LZ.toast('이미 있는 이름이에요'); return; } MK.pool.push({ nick: nm }); w.value = ''; LZ.redraw(); setTimeout(function () { var x = $('#mkWho'); if (x) x.focus(); }, 50); };
  LZ.act.mkFromClub = async function () {
    var ms = S.me.moims || []; if (!ms.length) { LZ.toast('함께하는 클럽이 없어요'); return; }
    var g = await LZ.api('moimGet', { id: ms[0].id }), list = (g.members || []).filter(function (m) { return !mkHas(m.nick); });
    LZ.sheet('<h2>' + esc(ms[0].name) + ' 회원</h2>' + (ms.length > 1 ? '<div class="chips">' + ms.map(function (m) { return '<button type="button" class="sm2 ' + (m.id === ms[0].id ? '' : 'g') + '" data-act="mkClubPick" data-v="' + esc(m.id) + '">' + esc(m.name) + '</button>'; }).join('') + '</div>' : '') + '<div class="chips wrap2">' + list.map(function (m) { return '<button type="button" class="sm2 g" data-act="mkClubSel" data-v="' + esc(m.nick) + '">' + esc(m.nick) + '</button>'; }).join('') + '</div><button type="button" class="btn" data-act="mkClubAdd">체크한 분 대기 명단에 넣기</button><p class="hint">누르면 체크돼요. 전부 넣으려면 아래 단추만 누르세요.</p>');
    MK.csel = {};
  };
  LZ.act.mkClubPick = async function (el, id) { var g = await LZ.api('moimGet', { id: id }); var box = $('.sheet .chips.wrap2'); if (box) box.innerHTML = (g.members || []).filter(function (m) { return !mkHas(m.nick); }).map(function (m) { return '<button type="button" class="sm2 g" data-act="mkClubSel" data-v="' + esc(m.nick) + '">' + esc(m.nick) + '</button>'; }).join(''); $$('[data-act="mkClubPick"]').forEach(function (b) { b.classList.toggle('g', b.dataset.v !== id); }); MK.csel = {}; };
  LZ.act.mkClubSel = function (el, v) { MK.csel[v] = !MK.csel[v]; el.classList.toggle('g', !MK.csel[v]); };
  LZ.act.mkClubAdd = function () { var picked = Object.keys(MK.csel).filter(function (k) { return MK.csel[k]; }); if (!picked.length) picked = $$('.sheet [data-act="mkClubSel"]').map(function (b) { return b.dataset.v; }); picked.forEach(function (n) { if (!mkHas(n)) MK.pool.push({ nick: n }); }); LZ.closeSheet(); LZ.redraw(); LZ.toast(picked.length + '명을 대기 명단에 넣었어요'); };
  LZ.act.mkAuto = function () { var all = MK.pool.concat.apply(MK.pool, MK.teams); if (!all.length) { LZ.toast('먼저 이름을 넣어 주세요'); return; } var n = MK.nTeams, teams = Array.from({ length: n }, function () { return []; }); all.forEach(function (m, i) { var t = i % n; if (teams[t].length < 5) teams[t].push(m); else { var f = teams.filter(function (x) { return x.length < 5; })[0]; if (f) f.push(m); } }); MK.teams = teams; MK.pool = all.slice(teams.reduce(function (s, t) { return s + t.length; }, 0)); MK.sel = {}; LZ.redraw(); };
  LZ.act.mkSel = function (el, v) { MK.sel = MK.sel || {}; MK.sel[v] = !MK.sel[v]; el.classList.toggle('g', !MK.sel[v]); };
  LZ.act.mkMove = function () { var t = +$('#mkTo').value, picked = Object.keys(MK.sel || {}).filter(function (k) { return MK.sel[k]; }).map(function (k) { return +k.slice(1); }).sort(function (a, b) { return b - a; }); if (!picked.length) { LZ.toast('넣을 분을 눌러 체크해 주세요'); return; } picked.forEach(function (i) { if (MK.teams[t].length < 5) MK.teams[t].push(MK.pool.splice(i, 1)[0]); }); MK.sel = {}; LZ.redraw(); };
  LZ.act.mkOut = function (el, v) { var p = v.split(':'); MK.pool.push(MK.teams[+p[0]].splice(+p[1], 1)[0]); LZ.redraw(); };
  LZ.act.mkCreate = async function () {
    LZ.busy(true, '단체 라운드를 만드는 중…');
    try {
      var r = await LZ.api('eventCreate', { name: MK.name, date: MK.date, nTeams: MK.nTeams, laps: MK.laps.slice(0, MK.holes / 9), order: MK.order, teams: MK.teams.map(function (t) { return { m: t.map(function (m) { return { nick: m.nick }; }) }; }) }, { retry: 0 });
      LZ.busy(false); MK = null; EV.d = r.event; LZ.go('evInvite', { code: r.event.code }, { replace: true });
    } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); }
  };

  /* ───── 초대 글·편성표 그림 ───── */
  function lapName(ev, li) { return segName(ev.laps, li); }
  /** 코스 목록 한 줄: 같은 골프장이면 "화천파크골프장(A→B)" */
  function evCourses(ev) { var gs = ev.laps.map(function (l) { return (l.fname || '').replace(/\s*\([^()]*\)\s*$/, ''); }); if (ev.laps.length > 1 && gs.every(function (g) { return g === gs[0]; })) return gs[0] + '(' + ev.laps.map(function (l, i) { return segName(ev.laps, i); }).join('→') + ')'; return ev.laps.map(function (l) { return l.fname; }).join(' · '); }
  function inviteText(ev) {
    var lines = ['🏆 ' + ev.name + (ev.date ? ' · ' + ev.date : ''), evCourses(ev) + ' · ' + ev.holes + '홀', '단체 코드 ' + ev.code, ''];
    ev.teams.forEach(function (t) { lines.push(t.n + '조  ' + (t.members.map(function (m) { return m.nick; }).join(' · ') || '(비어 있음)') + (ev.nLaps > 1 ? '  [' + t.order.map(function (li) { return segName(ev.laps, li); }).join('→') + ']' : '')); });
    lines.push('', '👇 링크를 누르고 내 조로 들어오세요. 앱이 없으면 링크에서 가입하면 바로 내 조로 들어가요.');
    return lines.join('\n');
  }
  function inviteUrl(ev, t) { return LZ.APP_URL + '?e=' + ev.code + (t ? '&t=' + t : ''); }
  async function inviteImage(ev) {
    var cv = document.createElement('canvas'), W = 1080, rowH = 64, H = 300 + ev.teams.length * rowH + 140; cv.width = W; cv.height = H;
    var g = cv.getContext('2d'); g.fillStyle = '#F3F6F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0B5D4B'; g.fillRect(0, 0, W, 190);
    g.fillStyle = '#fff'; g.font = '800 48px Pretendard, sans-serif'; g.fillText('🏆 ' + ev.name, 40, 76); g.font = '400 30px Pretendard, sans-serif'; g.fillText((ev.date ? ev.date + ' · ' : '') + evCourses(ev) + ' · ' + ev.holes + '홀', 40, 126);
    g.fillStyle = '#FFD166'; g.font = '800 40px Pretendard, sans-serif'; g.fillText('단체 코드 ' + ev.code, 40, 176);
    ev.teams.forEach(function (t, i) { var y = 250 + i * rowH; g.fillStyle = i % 2 ? '#fff' : '#E7F3EF'; g.fillRect(40, y - 40, W - 80, rowH); g.fillStyle = '#0B5D4B'; g.font = '800 32px Pretendard, sans-serif'; g.fillText(t.n + '조', 60, y + 4); g.fillStyle = '#172026'; g.font = '700 30px Pretendard, sans-serif'; g.fillText(t.members.map(function (m) { return m.nick; }).join(' · ').slice(0, 40), 170, y + 4); if (ev.nLaps > 1) { g.fillStyle = '#5F6B72'; g.font = '400 26px Pretendard, sans-serif'; g.textAlign = 'right'; g.fillText(t.order.map(function (li) { return segName(ev.laps, li); }).join('→'), W - 60, y + 4); g.textAlign = 'left'; } });
    g.fillStyle = '#5F6B72'; g.font = '400 26px Pretendard, sans-serif'; g.fillText('링크를 누르고 내 조로 입장 · ' + inviteUrl(ev), 40, H - 50);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); }); return new File([blob], 'event-' + ev.code + '.png', { type: 'image/png' });
  }
  LZ.screens.evInvite = {
    tab: 'field',
    show: async function (p, root, alive) {
      if (!EV.d || EV.d.code !== p.code) { root.innerHTML = LZ.hdr('초대', { back: true }) + LZ.skeleton(3); var r = await LZ.api('eventGet', { code: p.code }); if (!alive()) return; EV.d = r.event; }
      var ev = EV.d;
      root.innerHTML = LZ.hdr('초대하기', { back: true, right: '<button type="button" class="ib on" data-go="event" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>상황판</button>' }) + '<div class="wrap"><div class="card"><div class="code">' + esc(ev.code) + '</div><p class="muted center" style="margin:0">단체 코드 · 참가자는 링크나 이 코드로 들어와요</p></div>' +
        '<div class="card"><h3>편성표</h3><div class="tblwrap"><table class="tbl"><tr><th>조</th><th style="text-align:left">조원</th>' + (ev.nLaps > 1 ? '<th>순서</th>' : '') + '</tr>' + ev.teams.map(function (t) { return '<tr><td><b>' + t.n + '조</b></td><td style="text-align:left">' + (t.members.map(function (m) { return esc(m.nick); }).join(' · ') || '<span class="muted">비어 있음</span>') + '</td>' + (ev.nLaps > 1 ? '<td>' + t.order.map(function (li) { return segName(ev.laps, li); }).join('→') + '</td>' : '') + '</tr>'; }).join('') + '</table></div>' + (ev.nLaps > 1 ? '<p class="muted small" style="margin:6px 0 0">' + ev.laps.map(function (l, i) { return segLabel(i) + ' ' + esc(l.fname); }).join(' · ') + '</p>' : '') + '</div>' +
        '<button type="button" class="btn kakao" data-act="evInviteKakao">카카오톡으로 초대하기</button><div class="row"><button type="button" class="btn g sm" data-act="copy" data-v="' + esc(inviteText(ev) + '\n' + inviteUrl(ev)) + '">글 복사</button><button type="button" class="btn g sm" data-act="evInviteSms">문자로</button></div>' +
        '<div class="card" style="margin-top:14px"><h3>QR</h3><div class="qr" id="eqr"></div><p class="center muted small">' + esc(inviteUrl(ev)) + '</p></div>' +
        '<button type="button" class="btn" data-go="event" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>상황판으로</button></div>';
      LZ.qr($('#eqr'), inviteUrl(ev));
    }
  };
  LZ.act.evInviteKakao = async function () {
    var ev = EV.d, text = inviteText(ev), url = inviteUrl(ev);
    try { var f = await inviteImage(ev); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: ev.name, text: text + '\n' + url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    LZ.kakaoShare(text, url);
  };
  LZ.act.evInviteSms = function () { location.href = 'sms:?body=' + encodeURIComponent(inviteText(EV.d) + '\n' + inviteUrl(EV.d)); };

  /* ───── 입장 (?e=코드&t=조) ───── */
  LZ.screens.evEnter = {
    tab: 'field',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('단체 입장', { back: true }) + LZ.skeleton(3);
      var r; try { r = await LZ.api('eventGet', { code: p.code }); } catch (e) { if (!alive()) return; root.innerHTML = LZ.hdr('단체 입장', { back: true }) + '<div class="empty">' + esc(LZ.errText(e)) + '</div>'; return; }
      if (!alive()) return; var ev = EV.d = r.event, me = S.user, myT = ev.teams.filter(function (t) { return t.mine || t.members.some(function (m) { return m.guest && LZ.stripNick(m.nick) === me.nick; }); })[0], pick = p.t ? +p.t : (myT ? myT.n : 0);
      if (ev.status !== 'open') { LZ.go('event', { code: ev.code }, { replace: true }); return; }
      root.innerHTML = LZ.hdr('단체 입장', { back: true }) + '<div class="wrap"><div class="card center"><h3 style="margin:0">' + esc(ev.name) + '</h3><div class="muted">' + esc(ev.date || '') + (ev.date ? ' · ' : '') + ev.laps.map(function (l) { return esc(l.fname); }).join(' · ') + ' · ' + ev.holes + '홀 · 주최 ' + esc(ev.ownerNick) + '님</div>' + (myT ? '<div class="box" style="margin:12px 0 0"><b>' + esc(me.nick) + '님은 ' + myT.n + '조</b>예요 · ' + myT.members.map(function (m) { return esc(m.nick); }).join(' · ') + '</div>' : '<p class="muted" style="margin:12px 0 0">편성표에 이름이 없어요. 들어갈 조를 골라 주세요.</p>') + '</div>' +
        '<div class="card"><h3>조 고르기</h3><div class="chips wrap2">' + ev.teams.map(function (t) { return '<button type="button" class="sm2 ' + (pick === t.n ? '' : 'g') + '" data-act="evPickTeam" data-v="' + t.n + '">' + t.n + '조 ' + t.members.length + '명' + (t.id ? ' ●' : '') + '</button>'; }).join('') + '</div><p class="hint">● 표시는 이미 점수판이 열린 조예요.</p></div>' +
        '<button type="button" class="btn" data-act="evEnterGo" id="evEnterGo" data-v="' + pick + '"' + (pick ? '' : ' disabled') + '>' + (pick ? pick + '조 점수판 열기' : '조를 골라 주세요') + '</button><button type="button" class="btn g" data-go="event" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>상황판만 보기</button></div>';
    }
  };
  LZ.act.evPickTeam = function (el, v) { $$('[data-act="evPickTeam"]').forEach(function (b) { b.classList.toggle('g', b.dataset.v !== v); }); var b = $('#evEnterGo'); b.disabled = false; b.dataset.v = v; b.textContent = v + '조 점수판 열기'; };
  LZ.act.evEnterGo = async function (el, v) { LZ.busy(true, '점수판을 여는 중…'); try { var r = await LZ.api('eventEnter', { code: EV.d.code, team: +v }, { retry: 0 }); LZ.busy(false); EV.d = r.event; LZ.go('round', { id: r.round.id, fresh: 1 }, { replace: true }); LZ.toast(r.team + '조 점수판이에요. 같은 조가 적으면 바로 보여요', 4000); } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); } };

  /* ───── 집계 (각각, 들어온 점수만으로) ───── */
  function teamsOf(ev) { return ev.teams.filter(function (t) { return t.round; }); }
  function inScope(ev, t) { var sc = ev.scope || {}; return !(sc.teams && sc.teams.length) || sc.teams.indexOf(t.n) >= 0; }
  function lapIdx(ev, t, i) { var r = t.round; if (!r.laps || r.laps.length < 2) return 0; for (var k = 0; k < r.laps.length; k++) if (i >= r.laps[k].from && i < r.laps[k].from + r.laps[k].n) return t.order[k] !== undefined ? t.order[k] : k; return 0; }
  function holeOn(ev, t, i) { var sc = ev.scope || {}; return !(sc.laps && sc.laps.length) || sc.laps.indexOf(lapIdx(ev, t, i)) >= 0; }
  function players(ev) {
    var out = [];
    teamsOf(ev).forEach(function (t) { if (!inScope(ev, t)) return; var r = t.round; r.players.forEach(function (p) {
      var idx = []; for (var i = 0; i < r.pars.length; i++) if (holeOn(ev, t, i)) idx.push(i);
      var played = idx.filter(function (i) { return p.s[i] > 0; }), full = played.length === idx.length;
      var o = { n: p.n, team: t.team, tn: t.n, sc: p.s, pars: r.pars, idx: idx, full: full, h: played.length, tot: played.reduce(function (s, i) { return s + p.s[i]; }, 0), par: played.reduce(function (s, i) { return s + r.pars[i]; }, 0),
        cnt: function (fn) { return played.filter(function (i) { return fn(p.s[i], r.pars[i]); }).length; },
        rel: function (par) { return played.reduce(function (s, i) { return r.pars[i] === par ? s + (p.s[i] - par) : s; }, 0); },
        half: function (k) { var a = idx.filter(function (i, j) { return Math.floor(j / 9) % 2 === k; }); return a.reduce(function (s, i) { return s + (p.s[i] || 0); }, 0); } };
      o.d = o.tot - o.par; if (o.h > 0) out.push(o);
    }); });
    return out;
  }
  function teamStats(ev) {
    return teamsOf(ev).filter(function (t) { return inScope(ev, t); }).map(function (t) {
      var ps = players(ev).filter(function (p) { return p.tn === t.n; }), rel = ps.map(function (p) { return p.d; }).sort(function (a, b) { return a - b; }), h = Math.max.apply(null, ps.map(function (p) { return p.h; }).concat([0]));
      var v = !rel.length ? null : (EV.tm === 'avg' ? Math.round(rel.reduce(function (s, x) { return s + x; }, 0) / rel.length * 10) / 10 : rel.slice(0, 3).reduce(function (s, x) { return s + x; }, 0));
      var mean = rel.length ? rel.reduce(function (s, x) { return s + x; }, 0) / rel.length : 0, spread = rel.length > 1 ? Math.round(Math.sqrt(rel.reduce(function (s, x) { return s + (x - mean) * (x - mean); }, 0) / rel.length) * 10) / 10 : 0;
      return { t: t, n: t.n, team: t.team, h: h, cnt: ps.length, v: v, spread: spread, done: ps.length && ps.every(function (p) { return p.full; }) };
    }).sort(function (a, b) { return (a.v === null) - (b.v === null) || a.v - b.v; });
  }

  /* ───── 상황판 (3탭) ───── */
  LZ.screens.event = {
    tab: 'field', rt: true,
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('상황판', { back: true }) + LZ.skeleton(5);
      var r = await LZ.api('eventGet', { code: p.code }); if (!alive()) return; EV.d = r.event; EV.tm = r.event.rank; EV.tab = p.tab || EV.tab || 'teams';
      paintEvent(root);
      clearInterval(EV.timer); if (r.event.status === 'open') EV.timer = setInterval(async function () { if (LZ.cur().name !== 'event') { clearInterval(EV.timer); return; } try { var x = await LZ.api('eventGet', { code: p.code }, { retry: 0 }); EV.d = x.event; EV.at = Date.now(); paintEvent($('#app'), true); } catch (e) { /* 다음에 */ } }, 20000);
    }
  };
  function paintEvent(root, keep) {
    var ev = EV.d, y = window.scrollY, tab = EV.tab, ps = players(ev).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); }), ts = teamStats(ev);
    var body = '';
    if (tab === 'teams') {
      body = '<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1;margin:0">조 순위</h3><span class="muted">' + (EV.tm === 'avg' ? '전원 평균' : '잘 친 3명 합') + '</span></div>' + (ev.isStaff ? '<div style="margin-top:8px">' + LZ.seg([['top3', '잘 친 3명 합'], ['avg', '전원 평균']], EV.tm, 'evTm', 's') + '</div>' : '') + '</div>' +
        (ev.teams.length ? ev.teams.map(function (t) { var st = ts.filter(function (x) { return x.n === t.n; })[0], rank = st && st.v !== null ? ts.indexOf(st) + 1 : 0; return '<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:var(--t3)">' + t.team + '</b>' + (t.round ? '<span class="chip ' + (t.round.status === 'open' ? 'cap' : '') + '">' + (t.round.status === 'open' ? st.h + '홀 진행 중' : (t.round.editable ? '끝남 · 수정 가능' : '끝남')) + '</span>' : '<span class="chip gray">대기</span>') + (!inScope(ev, t) ? '<span class="chip off">집계 제외</span>' : '') + '<span class="muted" style="margin-left:auto">' + (rank ? rank + '위 ' + LZ.pp(st.v) : '') + '</span>' + (t.round ? '<button type="button" class="sm2 g" style="height:34px" data-go="round" data-p=\'' + esc(JSON.stringify({ id: t.id, fresh: 1 })) + '\'>점수판</button>' : (ev.status === 'open' ? '<button type="button" class="sm2 g" style="height:34px" data-act="evEnterGo" data-v="' + t.n + '">입장</button>' : '')) + '</div>' +
          (ev.nLaps > 1 ? '<div class="muted small" style="margin-top:4px">순서 ' + t.order.map(function (li) { return segName(ev.laps, li); }).join('→') + '</div>' : '') +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + (t.round ? t.round.players.map(function (p) { var q = ps.filter(function (x) { return x.tn === t.n && x.n === p.n; })[0]; return '<span class="pill">' + esc(p.n) + (q ? ' <b>' + q.tot + '</b> ' + LZ.pp(q.d) : '') + '</span>'; }).join('') : t.members.map(function (m) { return '<span class="pill">' + esc(m.nick) + '</span>'; }).join('')) + '</div></div>'; }).join('') : '<div class="empty">아직 조가 없어요.</div>');
    } else if (tab === 'people') {
      body = '<div class="card"><h3>🏅 개인 순위 <span class="muted" style="font-weight:400">· 친 홀 기준 파 대비</span></h3><div class="list">' + (ps.length ? ps.slice(0, EV.more ? 200 : 12).map(function (p, i) { return '<div class="it" style="padding:10px 4px"><div class="av ' + (i === 0 ? 'y' : '') + '">' + (i + 1) + '</div><div class="t"><b>' + esc(p.n) + ' <span class="chip">' + esc(p.team) + '</span></b><span class="muted">' + p.h + '홀 ' + p.tot + '타' + (p.full ? '' : ' · 진행 중') + '</span></div>' + LZ.pp(p.d) + '</div>'; }).join('') + (ps.length > 12 && !EV.more ? '<button type="button" class="btn g sm" data-act="evMore">더 보기 (' + (ps.length - 12) + '명)</button>' : '') : '<div class="empty">아직 점수가 없어요.</div>') + '</div></div>';
    } else {
      body = '<div class="card"><h3>편성표 <span class="muted" style="font-weight:400">· ✓ 입장함</span></h3><div class="tblwrap"><table class="tbl"><tr><th>조</th><th style="text-align:left">조원</th>' + (ev.nLaps > 1 ? '<th>순서</th>' : '') + '</tr>' + ev.teams.map(function (t) { return '<tr><td><b>' + t.n + '조</b></td><td style="text-align:left">' + (t.members.map(function (m) { return esc(m.nick) + (m.entered ? '<span style="color:var(--green)">✓</span>' : '') + (m.guest ? '<span class="muted">👤</span>' : ''); }).join(' · ') || '<span class="muted">비어 있음</span>') + '</td>' + (ev.nLaps > 1 ? '<td>' + t.order.map(function (li) { return segName(ev.laps, li); }).join('→') + '</td>' : '') + '</tr>'; }).join('') + '</table></div>' + (ev.nLaps > 1 ? '<p class="muted small" style="margin:6px 0 0">' + ev.laps.map(function (l, i) { return segLabel(i) + ' ' + esc(l.fname); }).join(' · ') + '</p>' : '') + (ev.isStaff && ev.status === 'open' ? '<div class="row"><button type="button" class="btn o sm" data-act="evTeamEdit">편성 고치기</button><button type="button" class="btn g sm" data-go="evInvite" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>초대 다시 보내기</button></div>' : '') + '</div>' +
        (ev.isStaff ? '<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1"><b>📺 TV 보드</b><div class="muted">큰 화면(TV·노트북)에서 이 주소를 열면 조별·개인 순위가 20초마다 새로 와요</div></div><button type="button" class="sm2 g" data-act="copy" data-v="' + esc(LZ.APP_URL + '?e=' + ev.code + '&tv=1') + '">주소 복사</button></div></div>' : '') +
        (ev.isOwner ? '<div class="card"><h3>주최 도구</h3><div class="tgl"><span>도우미<span class="muted">' + (ev.helpers.length ? ev.helpers.map(function (h) { return esc(h.nick); }).join(', ') : '없음') + ' · 편성·파·집계를 같이 해요</span></span><button type="button" class="sm2 g" data-act="evHelpers">정하기</button></div>' + (ev.status === 'open' ? '<div class="row"><button type="button" class="btn g sm" data-act="evEnd">단체 끝내기</button>' + (ev.locked ? '<button type="button" class="btn g sm" data-act="evLock" data-v="0">잠금 풀기</button>' : '<button type="button" class="btn o sm" data-act="evLock" data-v="1">최종 확정(잠금)</button>') + '</div>' : (ev.locked ? '<p class="muted">최종 확정됨 · 점수를 고칠 수 없어요</p>' : '<button type="button" class="btn o sm" data-act="evLock" data-v="1">최종 확정(잠금)</button>')) + '</div>' : '');
    }
    root.innerHTML = LZ.hdr('상황판', { back: true, right: '<button type="button" class="ib on" data-go="awards">🏆 시상식</button>' }) + '<div class="wrap">' +
      '<div class="sync ' + (ev.status === 'open' ? 'ok' : 'wait') + '">' + (ev.status === 'open' ? '✓ 20초마다 새로 받아요' + (EV.at ? ' · ' + LZ.fmtDate(EV.at, true).split(' ').pop() : '') + ' · 코드 <b>' + esc(ev.code) + '</b>' : '끝난 단체 라운드예요' + (ev.locked ? ' · 최종 확정' : '')) + '</div>' +
      '<div class="card tight"><h3 style="margin:0">' + esc(ev.name) + '</h3><div class="muted">' + (ev.date ? esc(ev.date) + ' · ' : '') + ev.laps.map(function (l) { return esc(l.fname); }).join(' · ') + ' · ' + ev.holes + '홀 · ' + ps.length + '명 · 주최 ' + esc(ev.ownerNick) + '님</div>' + (ev.status === 'open' ? '<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-go="evEnter" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>⛳ 내 조 점수판</button><button type="button" class="btn g sm" data-go="evInvite" data-p=\'' + esc(JSON.stringify({ code: ev.code })) + '\'>초대</button></div>' : '') + '</div>' +
      LZ.seg([['teams', '조별'], ['people', '개인'], ['table', '편성표']], tab, 'evTab') + '<div style="height:10px"></div>' + body + '</div>';
    if (keep) window.scrollTo(0, y);
  }
  LZ.act.evTab = function (el, v) { EV.tab = v; paintEvent($('#app')); };
  LZ.act.evMore = function () { EV.more = 1; paintEvent($('#app'), true); };
  LZ.act.evTm = async function (el, v) { EV.tm = v; paintEvent($('#app'), true); try { var r = await LZ.api('eventSet', { id: EV.d.id, rank: v }); EV.d = r.event; } catch (e) { /* 무시 */ } };
  LZ.act.evEnd = async function () { if (!(await LZ.confirm('단체 라운드를 끝낼까요?', '모든 조의 점수판이 끝나요(2시간 안에는 고칠 수 있어요).', '끝내기'))) return; try { var r = await LZ.api('eventSet', { id: EV.d.id, end: 1 }); EV.d = r.event; paintEvent($('#app')); LZ.go('awards'); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.evLock = async function (el, v) { if (+v && !(await LZ.confirm('최종 확정할까요?', '확정하면 모든 조의 점수를 더 고칠 수 없어요.', '확정'))) return; try { var r = await LZ.api('eventSet', { id: EV.d.id, lock: +v }); EV.d = r.event; paintEvent($('#app'), true); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  LZ.act.evHelpers = async function () {
    var ev = EV.d, all = []; ev.teams.forEach(function (t) { t.members.forEach(function (m) { if (m.uid && m.uid !== S.user.uid && !all.some(function (x) { return x.uid === m.uid; })) all.push(m); }); });
    var cur = {}; ev.helpers.forEach(function (h) { cur[h.uid] = 1; });
    LZ.sheet('<h2>진행 도우미(2명까지)</h2><p class="muted">편성·파 수정·집계 범위를 같이 할 수 있어요.</p><div class="chips wrap2">' + all.map(function (m) { return '<button type="button" class="sm2 ' + (cur[m.uid] ? '' : 'g') + '" data-act="evHelperSel" data-v="' + esc(m.uid) + '">' + esc(m.nick) + '</button>'; }).join('') + '</div><button type="button" class="btn" data-act="evHelperSave">저장</button>');
    EV.hsel = cur;
  };
  LZ.act.evHelperSel = function (el, v) { if (!EV.hsel[v] && Object.keys(EV.hsel).filter(function (k) { return EV.hsel[k]; }).length >= 2) { LZ.toast('도우미는 2명까지예요'); return; } EV.hsel[v] = !EV.hsel[v]; el.classList.toggle('g', !EV.hsel[v]); };
  LZ.act.evHelperSave = async function () { try { var r = await LZ.api('eventSet', { id: EV.d.id, helpers: Object.keys(EV.hsel).filter(function (k) { return EV.hsel[k]; }) }); EV.d = r.event; LZ.closeSheet(); paintEvent($('#app'), true); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };
  /* 편성 고치기(시작 후): 대기 ↔ 조 */
  LZ.act.evTeamEdit = function () {
    var ev = EV.d; EV.edit = { teams: ev.teams.map(function (t) { return t.members.map(function (m) { return { uid: m.uid, nick: m.nick, guest: m.guest }; }); }), pool: [], sel: {} };
    paintTeamEdit();
  };
  function paintTeamEdit() {
    var E = EV.edit;
    LZ.sheet('<h2>편성 고치기</h2><div class="row"><input type="text" id="teWho" maxlength="8" placeholder="추가할 닉네임·손님"><button type="button" class="btn sm" style="margin:0;flex:none;width:80px" data-act="teAdd">넣기</button></div><label class="lb">대기 명단 ' + E.pool.length + '명</label><div class="chips wrap2">' + E.pool.map(function (m, i) { return '<button type="button" class="sm2 ' + (E.sel[i] ? '' : 'g') + '" data-act="teSel" data-v="' + i + '">' + esc(m.nick) + '</button>'; }).join('') + '</div>' + (E.pool.length ? '<div class="row"><select id="teTo" class="in" style="height:44px">' + E.teams.map(function (_, t) { return '<option value="' + t + '">' + (t + 1) + '조로</option>'; }).join('') + '</select><button type="button" class="btn sm" style="margin:0" data-act="teMove">체크한 분 넣기</button></div>' : '') +
      E.teams.map(function (t, ti) { return '<label class="lb">' + (ti + 1) + '조 ' + t.length + '/8</label><div class="chips wrap2">' + t.map(function (m, i) { return '<button type="button" class="sm2 g" data-act="teOut" data-v="' + ti + ':' + i + '">' + esc(m.nick) + ' ✕</button>'; }).join('') + '</div>'; }).join('') + '<button type="button" class="btn" data-act="teSave">저장</button>');
  }
  LZ.act.teAdd = function () { var w = $('#teWho'), nm = LZ.stripNick(w.value); if (nm.length < 2) return; EV.edit.pool.push({ nick: nm }); paintTeamEdit(); };
  LZ.act.teSel = function (el, v) { EV.edit.sel[v] = !EV.edit.sel[v]; el.classList.toggle('g', !EV.edit.sel[v]); };
  LZ.act.teMove = function () { var E = EV.edit, t = +$('#teTo').value, picked = Object.keys(E.sel).filter(function (k) { return E.sel[k]; }).map(Number).sort(function (a, b) { return b - a; }); if (!picked.length) { LZ.toast('넣을 분을 체크해 주세요'); return; } picked.forEach(function (i) { if (E.teams[t].length < 5) E.teams[t].push(E.pool.splice(i, 1)[0]); }); E.sel = {}; paintTeamEdit(); };
  LZ.act.teOut = function (el, v) { var p = v.split(':'), E = EV.edit; E.pool.push(E.teams[+p[0]].splice(+p[1], 1)[0]); paintTeamEdit(); };
  LZ.act.teSave = async function () { try { var r = await LZ.api('eventSet', { id: EV.d.id, teams: EV.edit.teams.map(function (t) { return { m: t.map(function (m) { return m.uid ? { uid: m.uid } : { nick: m.nick }; }) }; }) }); EV.d = r.event; LZ.closeSheet(); paintEvent($('#app'), true); LZ.toast('편성을 저장했어요'); } catch (e) { LZ.toast(LZ.errText(e), 4000); } };

  /* ───── 시상식 ───── */
  var AW = [
    { k: 'try', i: '🌱', n: '새싹상', d: '합계 타수가 가장 많은 분 · 다음엔 더 잘 치실 거예요', f: function (p) { return p.tot; }, asc: false, u: '타' },
    { k: 'onion', i: '🧅', n: '눈물의 양파상', d: '파의 두 배(양파)를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x >= par * 2; }); }, asc: false, u: '개', need: 1 },
    { k: 'gull', i: '🕊', n: '갈매기 세 마리상', d: '트리플 보기(+3)를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x - par === 3; }); }, asc: false, u: '개', need: 1 },
    { k: 'duck', i: '🦆', n: '꽥꽥 오리상', d: '더블 보기(+2)를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x - par === 2; }); }, asc: false, u: '개', need: 1 },
    { k: 'pepero', i: '🥖', n: '빼빼로상', d: '보기(+1)를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x - par === 1; }); }, asc: false, u: '개', need: 1 },
    { k: 'luck', i: '🍀', n: '행운상', d: '추첨 · 누구나 받을 수 있어요', f: function (p, seed) { return hash(p.n + seed) % 997; }, asc: true, u: '', luck: 1 },
    { k: 'steady', i: '📏', n: '한결같은상', d: '전반·후반 차이가 가장 적은 분', f: function (p) { return Math.abs(p.half(0) - p.half(1)); }, asc: true, u: '타 차이', full: 1 },
    { k: 'front', i: '🌅', n: '아침형 인간상', d: '전반 9홀을 가장 잘 친 분', f: function (p) { return p.half(0); }, asc: true, u: '타' },
    { k: 'back', i: '🌇', n: '뒷심상', d: '후반 9홀을 가장 잘 친 분', f: function (p) { return p.half(1); }, asc: true, u: '타', full: 1 },
    { k: 'p3', i: '🎯', n: '파3 명사수상', d: '파3 홀을 가장 잘 친 분(파 대비 합계)', f: function (p) { return p.rel(3); }, asc: true, u: '' },
    { k: 'p4', i: '🛤', n: '파4 뚝심상', d: '파4 홀을 가장 잘 친 분', f: function (p) { return p.rel(4); }, asc: true, u: '' },
    { k: 'p5', i: '🐘', n: '파5 코끼리상', d: '파5 홀을 가장 잘 친 분', f: function (p) { return p.rel(5); }, asc: true, u: '' },
    { k: 'par', i: '🧘', n: '파 지킴이상', d: '파를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x === par; }); }, asc: false, u: '개' },
    { k: 'birdie', i: '🐦', n: '버디 사냥꾼상', d: '버디(−1)를 가장 많이 한 분', f: function (p) { return p.cnt(function (x, par) { return x - par === -1; }); }, asc: false, u: '개', need: 1 },
    { k: 'eagle', i: '🦅', n: '이글상', d: '이글(−2)을 한 분 · 여러 번이면 많이 한 순', f: function (p) { return p.cnt(function (x, par) { return x - par === -2; }); }, asc: false, u: '개', need: 1 },
    { k: 'alba', i: '🐧', n: '알바트로스상', d: '알바트로스(−3)를 한 분', f: function (p) { return p.cnt(function (x, par) { return x - par === -3; }); }, asc: false, u: '개', need: 1 },
    { k: 'ace', i: '⛳', n: '홀인원상', d: '한 타에 넣은 분 · 당일 최고의 영광', f: function (p) { return p.cnt(function (x) { return x === 1; }); }, asc: false, u: '개', need: 1 },
    { k: 'win', i: '🏆', n: '왕중왕', d: '합계 타수가 가장 적은 분 · 오늘의 챔피언', f: function (p) { return p.tot; }, asc: true, u: '타' }];
  /* 조별 상: 행운상(추첨) → 다음에 잘 치자상 → 단합상 → 장려상(3위) → 준우승 → 우승 */
  var TW = [
    { k: 'tluck', i: '🍀', n: '행운상', d: '조 추첨 · 어느 조든 받을 수 있어요', luck: 1 },
    { k: 'tlast', i: '🌱', n: '다음에 잘 치자상', d: '조 순위가 가장 아래인 조', f: function (ts) { return ts.filter(function (t) { return t.v !== null; }).slice(-1); } },
    { k: 'tunity', i: '🤝', n: '단합상', d: '조원 점수 차이가 가장 적은 조', f: function (ts) { return ts.filter(function (t) { return t.cnt > 1; }).slice().sort(function (a, b) { return a.spread - b.spread; }).slice(0, 1); } },
    { k: 't3', i: '🥉', n: '장려상', d: '조 순위 3위', f: function (ts) { return ts.filter(function (t) { return t.v !== null; }).slice(2, 3); } },
    { k: 't2', i: '🥈', n: '준우승', d: '조 순위 2위', f: function (ts) { return ts.filter(function (t) { return t.v !== null; }).slice(1, 2); } },
    { k: 't1', i: '🥇', n: '우승', d: '조 순위 1위 · 오늘의 최강 조', f: function (ts) { return ts.filter(function (t) { return t.v !== null; }).slice(0, 1); } }];
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function awOf(k) { var m = /^luck(\d+)$/.exec(k); if (m) return Object.assign({}, AW[5], { k: k, n: '행운상' + m[1], seed: m[1] }); var a = AW.filter(function (x) { return x.k === k; })[0]; if (a && a.k === 'luck' && awOrder().some(function (x) { return /^luck\d+$/.test(x); })) return Object.assign({}, a, { n: '행운상1', seed: '1' }); return a; }
  function awOrder() { var ev = EV.d; return ev.awards && ev.awards.length ? ev.awards.filter(function (k) { return k.charAt(0) !== '-' && k.charAt(0) !== 't'; }) : AW.map(function (x) { return x.k; }); }
  function awOff() { var off = {}; (EV.d.awards || []).forEach(function (k) { if (k.charAt(0) === '-') off[k.slice(1)] = 1; }); return off; }
  function twOrder() { var ev = EV.d, l = (ev.awards || []).filter(function (k) { return k.charAt(0) === 't' && k !== 'try'; }); return l.length ? l : TW.map(function (x) { return x.k; }); }
  function twOf(k) { var m = /^tluck(\d+)$/.exec(k); if (m) return Object.assign({}, TW[0], { k: k, n: '행운상' + m[1], seed: m[1] }); var a = TW.filter(function (x) { return x.k === k; })[0]; if (a && a.k === 'tluck' && twOrder().some(function (x) { return /^tluck\d+$/.test(x); })) return Object.assign({}, a, { n: '행운상1', seed: '1' }); return a; }
  function awList(a, exclude) {
    var ev = EV.d, all = players(ev), ps = all.filter(function (p) { return !(exclude && exclude[p.n]) && (!a.full || p.full) && !(a.k === 'try' && !p.full && all.some(function (q) { return q.full; })); });
    ps.forEach(function (p) { p.v = a.f(p, a.seed || ''); });
    ps.sort(function (x, y) { return (a.asc ? x.v - y.v : y.v - x.v) || (x.half(1) - y.half(1)) || (x.rel(3) - y.rel(3)); });
    if (a.need) ps = ps.filter(function (p) { return p.v >= 1; });
    return ps;
  }
  function awActive() { var off = awOff(); return awOrder().map(awOf).filter(function (a) { return a && !off[a.k] && awList(a).length; }); }
  /* 중복 불가: 좋은 상(뒤쪽)부터 확정. 이미 받은 분은 그 상에서 차순위·차차순위로 */
  function winners() { if (!EV.d.nodup) return null; var got = {}, out = {}, list = awActive(); for (var i = list.length - 1; i >= 0; i--) { var a = list[i], l = awList(a, got); if (l.length) { out[a.k] = l[0]; got[l[0].n] = 1; } } return out; }
  function twList(a, got) {
    var ts = teamStats(EV.d), got2 = got || {};
    if (a.luck) { var pool = ts.filter(function (t) { return !got2[t.n] && t.cnt > 0; }); pool.sort(function (x, y) { return hash(x.team + (a.seed || '')) - hash(y.team + (a.seed || '')); }); return pool.slice(0, 1); }
    return a.f(ts.filter(function (t) { return !got2[t.n]; }));
  }
  function twActive() { if (EV.d.local || EV.d.teams.length < 2) return []; var off = awOff(); return twOrder().map(twOf).filter(function (a) { return a && !off[a.k] && twList(a).length; }); }
  function twWinners() { if (!EV.d.tnodup) return null; var got = {}, out = {}, list = twActive(); for (var i = list.length - 1; i >= 0; i--) { var a = list[i], l = twList(a, got); if (l.length) { out[a.k] = l[0]; got[l[0].n] = 1; } } return out; }
  /* 개별 라운드·미리보기 시상식: 서버 대신 휴대폰에 저장(ev.local) */
  function localSet(patch) { var ev = EV.d; for (var k in patch) ev[k] = patch[k]; if (ev.rid) { try { store.set('lz.aw.' + ev.rid, JSON.stringify({ awards: ev.awards || [], nodup: ev.nodup })); } catch (e) { /* 저장 못 해도 진행 */ } } LZ.redraw(); return Promise.resolve({ event: ev }); }
  function evSet(body) { if (EV.d.local) { var o = {}; for (var k in body) if (k !== 'id') o[k] = body[k]; return localSet(o); } return LZ.api('eventSet', body); }
  /** 한 조 라운드(개별) → 시상식 엔진이 읽는 가짜 단체 */
  LZ.roundToEvent = function (rd) {
    var saved = {}; try { saved = JSON.parse(store.get('lz.aw.' + rd.id) || '{}'); } catch (e) { saved = {}; }
    var laps = rd.laps && rd.laps.length ? rd.laps.map(function (l) { return { fid: l.fid, fname: l.fname, cname: l.fname, pars: rd.pars.slice(l.from, l.from + l.n) }; }) : [{ fid: rd.fid, fname: rd.fname, pars: rd.pars }];
    return { local: 1, rid: rd.id, id: '', code: rd.code, name: rd.fname, date: LZ.fmtDate(rd.created), laps: laps, nLaps: laps.length, holes: rd.pars.length, status: rd.status, isStaff: 1, isOwner: rd.isOwner, nodup: saved.nodup === 0 ? 0 : 1, tnodup: 0, awards: saved.awards || [], scope: { laps: [], teams: [] }, rank: 'top3',
      teams: [{ n: 1, team: '우리 조', round: rd, members: rd.players.map(function (p) { return { nick: p.n }; }), entered: 1, order: laps.map(function (_, i) { return i; }) }] };
  };
  /** 미리보기: 샘플 조 4명 */
  LZ.demoEvent = function () {
    var pars = [3, 3, 3, 3, 4, 4, 4, 4, 5, 3, 3, 3, 3, 4, 4, 4, 4, 5], names = ['김영희', '박철수', '이순자', '최민수'], seeds = [[0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0]];
    var rd = { id: 'demo', code: '0000', fid: '', fname: '화천파크골프장(A·B)', pars: pars, par: 66, created: Date.now(), status: 'end', isOwner: 1, laps: [{ fid: '', fname: 'A', from: 0, n: 9 }, { fid: '', fname: 'B', from: 9, n: 9 }], players: names.map(function (n, i) { return { n: n, s: pars.map(function (p, h) { return p + seeds[i][h]; }) }; }) };
    var ev = LZ.roundToEvent(rd); ev.demo = 1; ev.rid = ''; ev.name = '시상식 미리보기'; ev.awards = []; return ev;
  };
  function saveAwards(ord, toff) { var off = toff || awOff(); var list = twOrder().concat(ord).concat(Object.keys(off).map(function (k) { return '-' + k; })); return evSet({ id: EV.d.id, awards: list }).then(function (r) { EV.d = r.event; LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); }
  function saveTw(ord) { var off = awOff(); var list = ord.concat(awOrder()).concat(Object.keys(off).map(function (k) { return '-' + k; })); return evSet({ id: EV.d.id, awards: list }).then(function (r) { EV.d = r.event; LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); }
  LZ.screens.awards = {
    tab: 'field',
    show: async function (p, root, alive) {
      if (p.demo) { if (!EV.d || !EV.d.demo) EV.d = LZ.demoEvent(); }
      else if (p.rid) { if (!EV.d || EV.d.rid !== p.rid) { root.innerHTML = LZ.hdr('시상식', { back: true }) + LZ.skeleton(4); try { var rr = await LZ.api('roundGet', { id: p.rid }); } catch (e) { LZ.toast(LZ.errText(e), 4000); LZ.back(); return; } if (!alive()) return; EV.d = LZ.roundToEvent(rr.round); } }
      var ev = EV.d; if (!ev) { LZ.go('events', {}, { replace: true }); return; }
      if (ev.local) EV.part = 'person';
      var part = ev.local ? 'person' : (p.part || EV.part || 'team'); EV.part = part; var off = awOff(), sl = p.sl || 0;
      var scope = '<div class="card tight"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b>집계 범위</b>' + (ev.nLaps > 1 ? ev.laps.map(function (l, i) { var on = !ev.scope.laps.length || ev.scope.laps.indexOf(i) >= 0; return '<button type="button" class="sm2 ' + (on ? '' : 'g') + '" style="height:34px" data-act="awScopeLap" data-v="' + i + '"' + (ev.isStaff ? '' : ' disabled') + '>' + esc(segName(ev.laps, i)) + ' ' + (on ? '☑' : '☐') + '</button>'; }).join('') : '<span class="muted">전체 18홀</span>') + (ev.isStaff ? '<button type="button" class="sm2 g" style="height:34px" data-act="awScopeTeams">조 ' + (ev.scope.teams.length ? ev.scope.teams.length + '개만' : '전부') + '</button>' : '') + '</div></div>';
      var body;
      if (part === 'team') {
        var tord = twOrder(), cur = p.k || tord[0], a = twOf(cur) || TW[0], ts = teamStats(ev), lst = twList(a), w = twWinners(), n = 0;
        body = '<div class="chips" id="awchips">' + tord.map(function (k) { var x = twOf(k); return '<button type="button" class="sm2 ' + (cur === k ? '' : 'g') + '" style="' + (off[k] ? 'opacity:.4' : '') + '" data-act="awPick" data-v="' + k + '">' + x.i + ' ' + esc(x.n) + '</button>'; }).join('') + '</div>' +
          '<div class="card"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:var(--t7)">' + a.i + '</span><div><h3 style="margin:0">' + esc(a.n) + '</h3><div class="muted">' + esc(a.d) + '</div></div></div></div>' +
          '<div class="card"><div class="list">' + (lst.length ? lst.map(function (t, i) { var isW = w && w[a.k] && w[a.k].n === t.n; return '<div class="it"><div class="av y">' + t.team.replace('조', '') + '</div><div class="t"><b>' + t.team + (isW ? ' <span class="chip cap">수상</span>' : '') + '</b><span class="muted">' + t.cnt + '명 · ' + (t.v === null ? '아직' : (EV.tm === 'avg' ? '평균 ' : '3명 합 ') + (t.v > 0 ? '+' : '') + t.v) + (a.k === 'tunity' ? ' · 편차 ' + t.spread : '') + '</span></div></div>'; }).join('') : '<div class="empty">해당 조가 없어요.</div>') + '</div><p class="muted small" style="margin:8px 0 0">조 순위 방식: ' + (EV.tm === 'avg' ? '전원 평균' : '잘 친 3명 합') + ' (상황판 조별에서 바꿔요)</p></div>' +
          (ev.isStaff ? '<div class="card"><h3>조별 시상 순서</h3><div class="list">' + tord.map(function (k, i) { var x = twOf(k), none = !twList(x).length, o = !!off[k] || none; return '<div class="it" style="padding:8px 4px;' + (o ? 'opacity:.45' : '') + '"><span class="muted" style="width:24px;font-weight:700">' + (o ? '—' : ++n) + '</span><div class="t"><b>' + x.i + ' ' + esc(x.n) + (none ? ' <span class="chip gray">해당 없음</span>' : '') + '</b></div><div style="display:flex;flex-direction:column;gap:4px"><button type="button" class="sm2 g" style="height:30px;padding:0 10px;font-size:var(--t0)" data-act="twMove" data-v="' + i + ':-1">▲</button><button type="button" class="sm2 g" style="height:30px;padding:0 10px;font-size:var(--t0)" data-act="twMove" data-v="' + i + ':1">▼</button></div>' + LZ.sw(!off[k] && !none, 'awToggle', k, none) + '</div>'; }).join('') + '</div><button type="button" class="btn o" data-act="twLuckAdd">🍀 조 행운상 추가하기</button><div class="tgl" style="margin-top:6px"><span><b>중복 수상 불가</b><span class="muted">한 조는 한 상 · 좋은 상부터 확정하고 아래 상은 다음 조에게</span></span>' + LZ.sw(ev.tnodup, 'awTnodup') + '</div></div>' : '');
      } else {
        var ord = awOrder(), cur2 = p.k || 'try', a2 = awOf(cur2) || AW[0], ps = awList(a2), w2 = winners(), n2 = 0;
        var show = function (v) { return a2.k.indexOf('luck') === 0 ? '' : a2.u ? v + a2.u : (v > 0 ? '+' + v : v === 0 ? 'E' : v); };
        body = '<div class="chips" id="awchips">' + ord.map(function (k) { var x = awOf(k); return '<button type="button" class="sm2 ' + (cur2 === k ? '' : 'g') + '" style="' + (off[k] ? 'opacity:.4' : '') + '" data-act="awPick" data-v="' + k + '">' + x.i + ' ' + esc(x.n) + '</button>'; }).join('') + '</div>' +
          '<div class="card"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:var(--t7)">' + a2.i + '</span><div><h3 style="margin:0">' + esc(a2.n) + '</h3><div class="muted">' + esc(a2.d) + '</div></div></div></div>' +
          '<div class="card"><div class="list">' + (ps.length ? ps.slice(0, 8).map(function (p, i) { var isW = w2 && w2[a2.k] && w2[a2.k].n === p.n; return '<div class="it"><div class="av ' + (i === 0 ? 'y' : '') + '">' + (i + 1) + '</div><div class="t"><b>' + esc(p.n) + ' <span class="chip">' + esc(p.team) + '</span>' + (isW ? '<span class="chip cap">수상</span>' : '') + '</b><span class="muted">' + p.tot + '타 ' + LZ.pp(p.d) + (p.full ? '' : ' · 진행 중') + '</span></div><b style="font-size:var(--t3)">' + show(p.v) + '</b></div>'; }).join('') : '<div class="empty">해당자가 없어요.</div>') + '</div></div>' +
          (ev.isStaff ? '<div class="card"><h3>개인 시상 순서</h3><p class="muted" style="margin:0 0 8px">위에서부터 차례로. ▲▼로 순서, 스위치로 빼기. 해당자 없는 상은 건너뛰어요.</p><div class="list">' + ord.map(function (k, i) { var x = awOf(k), none = !awList(x).length, o = !!off[k] || none; return '<div class="it" style="padding:8px 4px;' + (o ? 'opacity:.45' : '') + '"><span class="muted" style="width:24px;font-weight:700">' + (o ? '—' : ++n2) + '</span><div class="t"><b>' + x.i + ' ' + esc(x.n) + (none ? ' <span class="chip gray">해당자 없음</span>' : '') + '</b><span class="muted small">' + esc(x.d) + '</span></div><div style="display:flex;flex-direction:column;gap:4px"><button type="button" class="sm2 g" style="height:30px;padding:0 10px;font-size:var(--t0)" data-act="awMove" data-v="' + i + ':-1">▲</button><button type="button" class="sm2 g" style="height:30px;padding:0 10px;font-size:var(--t0)" data-act="awMove" data-v="' + i + ':1">▼</button></div>' + LZ.sw(!off[k] && !none, 'awToggle', k, none) + '</div>'; }).join('') + '</div><button type="button" class="btn o" data-act="luckAdd">🍀 행운상 추가하기</button><div class="tgl" style="margin-top:6px"><span><b>중복 수상 불가</b><span class="muted">한 사람 한 상 · 좋은 상부터 확정하고 아래 상은 차순위에게</span></span>' + LZ.sw(ev.nodup, 'awNodup') + '</div></div>' : '');
      }
      root.innerHTML = LZ.hdr('시상식', { back: true, right: (twActive().length || awActive().length) ? '<button type="button" class="ib on" data-go="ceremony" data-p=\'{"i":0}\'>▶ 시상 시작</button>' : '' }) + '<div class="wrap">' + (ev.local ? (ev.demo ? '<div class="card" style="background:#FFF7ED"><b>미리보기예요</b> · 샘플 조 4명(화천파크골프장 A·B 18홀)으로 꾸민 시상식이에요. 가입해서 라운드를 끝내면 내 조로 똑같이 열려요.</div>' : '<div class="card tight"><b>' + esc(ev.name) + '</b> · ' + esc(ev.date) + ' · ' + ev.teams[0].members.length + '명<div class="muted">상 순서·빼기·중복 수상은 이 휴대폰에만 저장돼요.</div></div>') : scope + LZ.seg([['team', '1부 · 조별'], ['person', '2부 · 개인']], part, 'awPart') + '<div style="height:10px"></div>') + body + '<button type="button" class="btn kakao" data-act="awShare" style="margin-top:14px">결과 그림 보내기</button></div>';
      var ch = $('#awchips'); if (ch) ch.scrollLeft = sl;
    }
  };
  LZ.act.awPart = function (el, v) { LZ.go('awards', { part: v }, { replace: true }); };
  LZ.act.awPick = function (el, k) { var ch = $('#awchips'); LZ.go('awards', { part: EV.part, k: k, sl: ch ? ch.scrollLeft : 0 }, { replace: true }); };
  LZ.act.awMove = function (el, v) { var p = v.split(':'), i = +p[0], d = +p[1], o = awOrder().slice(), j = i + d; if (j < 0 || j >= o.length) return; var t = o[i]; o[i] = o[j]; o[j] = t; saveAwards(o); };
  LZ.act.twMove = function (el, v) { var p = v.split(':'), i = +p[0], d = +p[1], o = twOrder().slice(), j = i + d; if (j < 0 || j >= o.length) return; var t = o[i]; o[i] = o[j]; o[j] = t; saveTw(o); };
  LZ.act.awToggle = function (el, k) { var off = awOff(); if (off[k]) delete off[k]; else off[k] = 1; saveAwards(awOrder(), off); };
  LZ.act.luckAdd = function () { var o = awOrder().slice(), n = 1; o.forEach(function (k) { var m = /^luck(\d+)$/.exec(k); if (m) n = Math.max(n, +m[1]); }); var at = -1; o.forEach(function (k, i) { if (/^luck/.test(k)) at = i; }); o.splice(at + 1, 0, 'luck' + (n + 1)); saveAwards(o); LZ.toast('행운상' + (n + 1) + '을 더했어요'); };
  LZ.act.twLuckAdd = function () { var o = twOrder().slice(), n = 1; o.forEach(function (k) { var m = /^tluck(\d+)$/.exec(k); if (m) n = Math.max(n, +m[1]); }); var at = -1; o.forEach(function (k, i) { if (/^tluck/.test(k)) at = i; }); o.splice(at + 1, 0, 'tluck' + (n + 1)); saveTw(o); LZ.toast('조 행운상' + (n + 1) + '을 더했어요'); };
  LZ.act.awNodup = function (el) { evSet({ id: EV.d.id, nodup: el.classList.contains('on') ? 0 : 1 }).then(function (r) { EV.d = r.event; LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); };
  LZ.act.awTnodup = function (el) { evSet({ id: EV.d.id, tnodup: el.classList.contains('on') ? 0 : 1 }).then(function (r) { EV.d = r.event; LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); };
  LZ.act.awScopeLap = function (el, v) { var ev = EV.d, cur = ev.scope.laps.length ? ev.scope.laps.slice() : ev.laps.map(function (_, i) { return i; }), i = cur.indexOf(+v); if (i >= 0) { if (cur.length === 1) { LZ.toast('한 바퀴는 남겨야 해요'); return; } cur.splice(i, 1); } else cur.push(+v); LZ.api('eventSet', { id: ev.id, scope: { laps: cur, teams: ev.scope.teams } }).then(function (r) { EV.d = r.event; LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); };
  LZ.act.awScopeTeams = function () { var ev = EV.d, cur = {}; (ev.scope.teams.length ? ev.scope.teams : ev.teams.map(function (t) { return t.n; })).forEach(function (n) { cur[n] = 1; }); EV.tsel = cur; LZ.sheet('<h2>집계할 조</h2><p class="muted">참가하지 못한 조는 빼요. 전부 켜면 제한 없음.</p><div class="chips wrap2">' + ev.teams.map(function (t) { return '<button type="button" class="sm2 ' + (cur[t.n] ? '' : 'g') + '" data-act="awTeamSel" data-v="' + t.n + '">' + t.team + '</button>'; }).join('') + '</div><button type="button" class="btn" data-act="awTeamSave">저장</button>'); };
  LZ.act.awTeamSel = function (el, v) { EV.tsel[v] = !EV.tsel[v]; el.classList.toggle('g', !EV.tsel[v]); };
  LZ.act.awTeamSave = function () { var ev = EV.d, on = ev.teams.map(function (t) { return t.n; }).filter(function (n) { return EV.tsel[n]; }); LZ.api('eventSet', { id: ev.id, scope: { laps: ev.scope.laps, teams: on.length === ev.teams.length ? [] : on } }).then(function (r) { EV.d = r.event; LZ.closeSheet(); LZ.redraw(); }).catch(function (e) { LZ.toast(LZ.errText(e)); }); };
  /* 결과 그림: 조별 + 개인 수상 */
  LZ.act.awShare = async function () {
    var ev = EV.d, tw = twWinners(), pw = winners(), tl = twActive(), al = awActive(), rows = [];
    tl.forEach(function (a) { var t = tw ? tw[a.k] : twList(a)[0]; if (t) rows.push([a.i + ' ' + a.n, t.team + (t.v !== null ? ' (' + (t.v > 0 ? '+' : '') + t.v + ')' : '')]); });
    al.forEach(function (a) { var p = pw ? pw[a.k] : awList(a)[0]; if (p) rows.push([a.i + ' ' + a.n, p.n + ' · ' + p.team + ' ' + p.tot + '타 (' + (p.d > 0 ? '+' : '') + p.d + ')']); });
    var cv = document.createElement('canvas'), W = 1080, rh = 58, H = 220 + rows.length * rh + 80; cv.width = W; cv.height = H; var g = cv.getContext('2d');
    g.fillStyle = '#F3F6F4'; g.fillRect(0, 0, W, H); g.fillStyle = '#0B5D4B'; g.fillRect(0, 0, W, 150); g.fillStyle = '#fff'; g.font = '800 46px Pretendard, sans-serif'; g.fillText('🏆 ' + ev.name + ' 시상 결과', 40, 72); g.font = '400 28px Pretendard, sans-serif'; g.fillText((ev.date ? ev.date + ' · ' : '') + ev.laps.map(function (l) { return l.fname; }).join(' · ') + ' · 파크골프 공략수첩', 40, 118);
    rows.forEach(function (r, i) { var y = 210 + i * rh; g.fillStyle = i % 2 ? '#fff' : '#E7F3EF'; g.fillRect(40, y - 36, W - 80, rh); g.fillStyle = '#0B5D4B'; g.font = '800 28px Pretendard, sans-serif'; g.fillText(r[0], 60, y + 2); g.fillStyle = '#172026'; g.font = '700 28px Pretendard, sans-serif'; g.textAlign = 'right'; g.fillText(r[1], W - 60, y + 2); g.textAlign = 'left'; });
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); }), file = new File([blob], 'awards-' + ev.code + '.png', { type: 'image/png' });
    var text = '🏆 ' + ev.name + ' 시상 결과\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: ev.name, text: text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    LZ.kakaoShare(text, ev.local ? LZ.APP_URL : inviteUrl(ev));
  };
  /* ───── TV 보드: ?e=코드&tv=1 — 로그인 없이, 큰 글씨, 20초마다 새로 ───── */
  LZ.screens.tv = {
    nobar: true,
    show: async function (p, root, alive) {
      var paint = async function () {
        var r; try { r = await LZ.api('eventBoard', { code: p.code }, { noAuth: true }); } catch (e) { root.innerHTML = '<div class="tv"><h1>단체 코드 ' + esc(p.code) + '</h1><p>' + esc(LZ.errText(e)) + '</p></div>'; return; }
        if (!alive()) { clearInterval(TVT); return; }
        var ev = EV.d = r.event; EV.tm = ev.rank; var ps = players(ev).sort(function (a, b) { return (b.h - a.h) || (a.d - b.d); }), ts = teamStats(ev);
        var pp = function (d) { return d > 0 ? '+' + d : d === 0 ? 'E' : String(d); };
        root.innerHTML = '<div class="tv"><div class="tvh"><div><h1>🏆 ' + esc(ev.name) + '</h1><div class="tvs">' + esc(ev.date || '') + ' · ' + esc(evCourses(ev)) + ' · ' + ev.holes + '홀 · 단체 코드 <b>' + esc(ev.code) + '</b></div></div><div class="tvt">' + new Date().toTimeString().slice(0, 5) + (ev.status === 'open' ? ' · 진행 중' : ' · 끝남') + '</div></div>' +
          '<div class="tvg"><section><h2>조별 순위 <small>' + (EV.tm === 'avg' ? '전원 평균' : '잘 친 3명 합') + '</small></h2><table><tr><th>순위</th><th>조</th><th>진행</th><th>' + (EV.tm === 'avg' ? '평균' : '3명 합') + '</th></tr>' + ts.slice(0, 12).map(function (t, i) { return '<tr><td>' + (t.v === null ? '-' : i + 1) + '</td><td class="l">' + esc(t.team) + '</td><td>' + t.h + '홀</td><td class="b">' + (t.v === null ? '—' : pp(t.v)) + '</td></tr>'; }).join('') + '</table></section>' +
          '<section><h2>개인 순위 <small>파 대비</small></h2><table><tr><th>순위</th><th>이름</th><th>조</th><th>홀</th><th>타수</th><th>±</th></tr>' + ps.slice(0, 16).map(function (x, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(x.n) + '</td><td>' + esc(x.team) + '</td><td>' + x.h + '</td><td>' + x.tot + '</td><td class="b">' + pp(x.d) + '</td></tr>'; }).join('') + '</table></section></div>' +
          '<div class="tvf">파크골프 공략수첩 · 20초마다 새로 와요 · 전체 화면: F11</div></div>';
      };
      clearInterval(TVT); await paint(); TVT = setInterval(function () { if (LZ.cur().name !== 'tv') { clearInterval(TVT); return; } paint(); }, 20000);
    }
  };
  var TVT = null;
  /* 시상 진행: 1부(조별) → 2부(개인) */
  LZ.screens.ceremony = {
    nobar: true,
    show: function (p, root) {
      var ev = EV.d; if (!ev) { LZ.go('events', {}, { replace: true }); return; }
      var tl = twActive(), al = awActive(), N = tl.length + al.length, i = Math.max(0, Math.min(N - 1, p.i || 0));
      if (!N) { root.innerHTML = LZ.hdr('시상식', { back: true }) + '<div class="empty">시상할 상이 없어요.</div>'; return; }
      var isTeam = i < tl.length, a = isTeam ? tl[i] : al[i - tl.length], win, sub;
      if (isTeam) { var tw = twWinners(); var t = tw ? tw[a.k] : twList(a)[0]; win = t ? t.team : ''; sub = t ? (t.cnt + '명' + (t.v !== null ? ' · ' + (EV.tm === 'avg' ? '평균 ' : '3명 합 ') + (t.v > 0 ? '+' : '') + t.v : '')) : ''; }
      else { var pw = winners(); var w = pw ? pw[a.k] : awList(a)[0]; win = w ? w.n + '님' : ''; sub = w ? w.team + ' · ' + w.tot + '타 ' + (w.d > 0 ? '+' + w.d : w.d === 0 ? 'E' : w.d) : ''; }
      root.innerHTML = '<div class="top" style="justify-content:space-between"><button type="button" class="ib" data-go="awards">‹ 목록</button><h2 class="center">' + (isTeam ? '1부 조별' : '2부 개인') + ' ' + (i + 1) + '/' + N + '</h2><button type="button" class="ib" data-act="fullscreen">전체 화면</button></div>' +
        '<div class="wrap ceremony"><div class="ic">' + a.i + '</div><div style="font-size:var(--t6);font-weight:700;margin-top:10px">' + esc(a.n) + '</div><div class="muted" style="margin:6px 0 30px">' + esc(a.d) + '</div>' +
        (win ? '<div class="card" style="padding:28px"><div class="av y" style="width:80px;height:80px;font-size:var(--t6);margin:0 auto 10px">' + esc(win.charAt(0)) + '</div><div style="font-size:var(--t7);font-weight:700">' + esc(win) + '</div><div class="muted">' + esc(sub) + '</div></div>' : '<div class="card"><div class="muted">해당 없음</div></div>') +
        '<div class="nav2"><button type="button" data-go="ceremony" data-p=\'' + JSON.stringify({ i: Math.max(0, i - 1) }) + '\'' + (i === 0 ? ' disabled' : '') + '>‹ 이전 상</button>' + (i < N - 1 ? '<button type="button" data-go="ceremony" data-p=\'' + JSON.stringify({ i: i + 1 }) + '\'>다음 상 ›</button>' : '<button type="button" data-act="ceremonyEnd">마치기 🎉</button>') + '</div></div>';
      try { var au = new AudioContext(); var o = au.createOscillator(), gn = au.createGain(); o.frequency.value = 660; gn.gain.value = 0.06; o.connect(gn); gn.connect(au.destination); o.start(); o.stop(au.currentTime + 0.15); } catch (e) { /* 소리 없이 */ }
    }
  };
  LZ.act.fullscreen = function () { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { LZ.toast('이 기기는 전체 화면을 지원하지 않아요'); } };
  LZ.act.ceremonyEnd = function () { LZ.go('event', { code: EV.d.code }, { reset: true }); LZ.toast('시상식 끝! 수고하셨어요 🎉', 4000); };
})();
