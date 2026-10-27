/* 스크린 공략: 코스 목록 · 홀 표(환산·m 보기·비교) · 홀 입력(저장·음성·사진·이력) · 치기 모드(읽어 주기) · 코스 등록·수정 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var CUR = { id: '', d: null, at: 0, who: '', who2: '' };
  function emptyRec() { return { r: '', t: '', d: 'R', n: 0, p: 17, o: '', g: 'p', h: 'm', i: '', hs: [] }; }
  function clubPick() {
    var list = (S.me && S.me.moims) || [];
    LZ.sheet('<h2>어느 클럽 기록을 볼까요?</h2>' + list.map(function (m) { return '<button type="button" class="opt ' + (S.br === m.id ? 'on' : '') + '" data-act="openClubCourses" data-v="' + esc(m.id) + '"><b>' + esc(m.name) + '</b><span>' + esc(m.area || '') + ' · 회원 ' + m.members + '명</span></button>'; }).join('') + '<button type="button" class="opt ' + (S.br === '_me' ? 'on' : '') + '" data-act="openClubCourses" data-v="_me"><b>내 기록장</b><span>클럽 없이 혼자</span></button>');
  }
  LZ.act.clubPick = clubPick;
  /* ───── 코스 목록 ───── */
  LZ.screens.courses = {
    tab: 'courses',
    show: async function (p, root, alive) {
      var sort = store.get('lz.sort') || 'diff', desc = store.get('lz.sortd') !== '0', q = p.q || '';
      root.innerHTML = LZ.hdr('📍 ' + (S.store || '…'), { right: '<button type="button" class="ib" data-act="clubPick">바꾸기</button>' }) + LZ.skeleton(5);
      var r = await LZ.api('courses', {}); if (!alive()) return; S.unit = r.unit || S.unit;
      var list = r.courses.filter(function (c) { return !q || c.name.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
      list.sort(function (a, b) { var v = sort === 'diff' ? b.stars - a.stars : sort === 'new' ? b.created - a.created : a.name.localeCompare(b.name, 'ko'); return desc ? v : -v; });
      root.innerHTML = LZ.hdr('📍 ' + r.store, { right: '<button type="button" class="ib" data-act="clubPick">바꾸기</button>' }) + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap">' +
        (r.canReg ? '<button type="button" class="btn o" style="margin:0 0 10px" data-go="reg">＋ 새 코스 등록</button>' : '') +
        '<input type="search" id="cq" value="' + esc(q) + '" placeholder="코스 이름 찾기"><div class="sort">' + [['diff', '난이도순'], ['new', '등록순'], ['name', '가나다순']].map(function (x) { return '<button type="button" class="' + (sort === x[0] ? 'on' : '') + '" data-act="sort" data-v="' + x[0] + '">' + x[1] + (sort === x[0] ? (desc ? ' ▼' : ' ▲') : '') + '</button>'; }).join('') + '</div>' +
        (list.length ? list.map(function (c) { return '<button type="button" class="course" data-go="holes" data-p=\'' + esc(JSON.stringify({ id: c.id })) + '\'><div class="t"><b>' + esc(c.name) + (c.stage !== 'done' ? ' <span class="chip gray">전반만</span>' : '') + '</b>' + LZ.stars(c.stars) + ' <span class="muted small">· 등록 ' + LZ.fmtDate(c.created) + '</span><div class="muted">내 기록 ' + c.mine + '/18' + (c.homeMine && !c.mine ? ' · 다른 곳에 ' + c.homeMine + '홀' : '') + (c.others ? ' · 회원님 기록 ' + c.others + '명' : '') + '</div><div class="bar"><i style="width:' + Math.round(c.mine / 18 * 100) + '%"></i></div></div><span style="font-size:24px;color:var(--g)">›</span></button>'; }).join('') : '<div class="empty">' + (q ? '찾는 코스가 없어요.' : '아직 코스가 없어요. 첫 코스를 등록해 보세요.') + '</div>') +
        (r.canReg ? '' : '<p class="hint center">코스 등록은 정회원·명예회원부터 할 수 있어요.</p>') + '</div>';
      LZ.paintSync();
      var cq = $('#cq'), tm = null; cq.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { LZ.go('courses', { q: cq.value }, { replace: true }); }, 400); });
    }
  };
  LZ.act.sort = function (el, v) { var cur = store.get('lz.sort') || 'diff', desc = store.get('lz.sortd') !== '0'; if (cur === v) desc = !desc; else { desc = true; } store.set('lz.sort', v); store.set('lz.sortd', desc ? '1' : '0'); LZ.toast({ diff: desc ? '어려운 코스부터' : '쉬운 코스부터', new: desc ? '최근 등록부터' : '오래된 등록부터', name: desc ? '가나다 순' : '가나다 역순' }[v]); LZ.redraw(); };

  /* ───── 홀 표 ───── */
  async function loadCourse(id, force) {
    if (!force && CUR.id === id && CUR.d && Date.now() - CUR.at < 120000 && CUR.br === S.br) return CUR.d;
    var d = await LZ.api('course', { id: id, who: CUR.who || store.get('lz.who.' + id) || '', who2: CUR.who2 || '' });
    CUR.id = id; CUR.d = d; CUR.at = Date.now(); CUR.br = S.br; S.unit = d.unit || S.unit;
    if (!d.mine.length) d.mine = []; for (var i = 0; i < 18; i++) d.mine[i] = d.mine[i] || emptyRec();
    return d;
  }
  LZ.loadCourse = loadCourse;
  function viewGH() { return { g: S.g || 'p', h: S.h || 'm' }; }
  function recLine(r, who, hole, mine, hm) {
    var v = viewGH();
    if (!r || !r.r) return '<div class="hr ' + (mine ? 'mine' : '') + '"><div class="who">' + who + '</div><div class="emp">' + (mine ? '아직 안 적었어요 · 누르면 적어요' : '기록 없음') + '</div></div>';
    var same = r.g === v.g && r.h === v.h, dm = LZ.distOf(r.p, r.g, r.h), ptxt = same ? LZ.fmtP(r.p) : LZ.convTxt(r.p, r.g, r.h, v.g, v.h);
    var big = S.unit === 'm' ? dm + '<small style="font-size:60%">m</small><small>(타격감 ' + ptxt + ')</small>' : ptxt + '<small>(' + dm + 'm)</small>';
    return '<div class="hr ' + (mine ? 'mine' : '') + '"><div class="who">' + who + '</div><div class="bd"><div class="ref">' + esc(LZ.refTxt(r)) + '</div><div class="ln"><span class="lr">' + LZ.lrTxt(r) + '</span><span class="pw">' + big + '</span>' + (r.i ? '<img class="ph" data-img="' + esc(r.i) + '" alt="">' : '') + '</div>' +
      (same ? '' : '<div class="orig">' + LZ.MODE[r.g] + '-' + LZ.HL[r.h] + ' ' + LZ.fmtP(r.p) + ' (' + dm + 'm)로 적음</div>') + '<div class="mk2">' + LZ.markOf(r, hm) + (r.o ? '<span class="muted">' + esc(r.o) + '</span>' : '') + '</div></div></div>';
  }
  function sugLine(hm) { var v = viewGH(), s = LZ.sugOf(hm, v.g, v.h); return S.unit === 'm' ? '제안 ' + LZ.distOf(s, v.g, v.h) + 'm(' + LZ.fmtP(s) + ')' : '제안 ' + LZ.fmtP(s); }
  /* 내 손맛 보정: 이 코스의 내 기록이 제안과 평균 얼마나 어긋나는지(0.5 단위) */
  LZ.myOffset = function (d) {
    var sum = 0, n = 0;
    d.mine.forEach(function (r, i) { var h = d.course.holes[i]; if (!r.r || !h || !h[1]) return; sum += r.p - LZ.sugOf(h[1], r.g, r.h); n++; });
    return n >= 3 ? LZ.half(sum / n) : 0;
  };
  LZ.mySug = function (s) { return LZ.clampP(s + (CUR.off || 0)); };
  LZ.screens.holes = {
    tab: 'courses', wake: true,
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('코스', { back: true }) + LZ.skeleton(6);
      var d = await loadCourse(p.id, p.fresh); if (!alive()) return;
      var c = d.course, half = p.half === undefined ? (store.get('lz.half.' + c.id) === '1' ? 1 : 0) : p.half, v = viewGH();
      if (d.mode && !p.vset) { S.g = d.mode.g; S.h = d.mode.h; v = viewGH(); }
      CUR.off = LZ.myOffset(d);
      var a = half * 9, b = a + 9, mineOnly = store.get('lz.mineOnly') === '1', badHoles = [];
      d.mine.forEach(function (r, i) { var h = c.holes[i]; if (r.r && h && Math.abs(r.p - LZ.sugOf(h[1], r.g, r.h)) >= 1) badHoles.push(i + 1); });
      root.innerHTML = LZ.hdr(c.name, { back: true, right: '<button type="button" class="ib on" data-go="play" data-p=\'' + esc(JSON.stringify({ id: c.id, hole: a })) + '\'>▶ 치기</button>' }) +
        '<div class="ctx"><span class="cl">모드</span>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], v.g, 'viewG') + '<span class="cl">높이</span>' + LZ.seg(LZ.HLSEG, v.h, 'viewH', 'hl') + '<span class="cl">크게</span>' + LZ.seg([['p', '타격감'], ['m', '거리(m)']], S.unit === 'm' ? 'm' : 'p', 'unitSet') + '</div>' +
        '<div class="wrap"><p class="muted center" style="margin:0 0 2px">' + esc(d.store) + ' · ' + LZ.MODE[v.g] + '-' + LZ.HL[v.h] + ' 기준으로 보는 중' + (d.mode ? ' · 내 기록은 ' + LZ.MODE[d.mode.g] + '-' + LZ.HL[d.mode.h] + '로 적음' : '') + '</p>' +
        '<p class="muted center small" style="margin:0 0 6px">' + LZ.stars(c.stars) + ' · 등록 ' + esc(c.reg) + '님 ' + LZ.fmtDate(c.created) + (c.last ? ' · 최종 수정 <b>' + esc(c.last.nick) + '님 ' + LZ.fmtDate(c.last.at, true) + '</b> (' + esc(c.last.what) + ')' : '') + (c.canEdit ? ' · <a href="#" data-go="courseEdit" data-p=\'' + esc(JSON.stringify({ id: c.id })) + '\'>고치기</a>' : '') + '</p>' +
        (badHoles.length || CUR.off ? '<div class="box" style="margin:0 0 10px;padding:10px 14px">📊 ' + (CUR.off ? '이 코스는 제안보다 <b>평균 ' + LZ.fmtP(Math.abs(CUR.off)) + ' ' + (CUR.off > 0 ? '크게' : '작게') + '</b> 치고 계셔요' : '제안과 비슷하게 치고 계셔요') + (badHoles.length ? ' · 어긋난 홀 ' + badHoles.length + '개(' + badHoles.slice(0, 5).join('·') + '홀)' : '') + (CUR.off ? '<br><span class="muted">🎯 그래서 입력 화면의 <b>내 손맛</b> = 제안 ' + (CUR.off > 0 ? '+' : '') + LZ.fmtP(CUR.off) + ' · 새 홀을 열면 이 값이 미리 들어가요</span>' : '') + '</div>' : '') +
        '<div class="halves"><button type="button" class="' + (half === 0 ? 'on' : '') + '" data-act="half" data-v="0">전반 9홀</button><button type="button" class="' + (half === 1 ? 'on' : '') + '" data-act="half" data-v="1"' + (c.stage !== 'done' ? ' disabled' : '') + '>후반 9홀</button></div>' +
        '<div class="tgl" style="padding:0 0 8px"><label style="display:flex;gap:8px;align-items:center;margin:0;font-weight:400"><input type="checkbox" id="mineOnly" ' + (mineOnly ? 'checked' : '') + ' style="width:22px;height:22px;accent-color:var(--g)"> 내 기록만 보기</label>' + (d.authors.length ? '<button type="button" class="sm2 g" data-act="pickWho">' + esc(d.pick ? d.pick.nick : '') + '님' + (d.pick2 ? ' + ' + esc(d.pick2.nick) + '님' : '') + ' ▾</button>' : (d.ref ? '<span class="muted small">' + esc(d.ref.store) + ' 내 기록 참고</span>' : '')) + '</div>' +
        c.holes.slice(a, b).map(function (h, j) {
          var i = a + j, hm = h[1];
          return '<div class="hc"><div class="hh"><b>' + (i + 1) + '홀</b><span class="par">파 ' + h[0] + '</span><span class="dist">' + hm + 'm</span><span class="gl">' + sugLine(hm) + ' · ' + LZ.MODE[v.g] + '-' + LZ.HL[v.h] + '</span></div>' +
            (!mineOnly && d.pick ? recLine(d.pick.recs[i], '<b>' + esc(d.pick.nick) + '</b><small>신뢰도 ' + d.pick.trust + '</small>', h, false, hm) : '') +
            (!mineOnly && d.pick2 ? recLine(d.pick2.recs[i], '<b>' + esc(d.pick2.nick) + '</b><small>신뢰도 ' + d.pick2.trust + '</small>', h, false, hm) : '') +
            (!mineOnly && !d.pick && d.ref && d.ref.recs[i] && d.ref.recs[i].r ? recLine(d.ref.recs[i], '<b>' + esc(d.ref.store) + '</b><small>내 기록</small>', h, false, hm) : '') +
            (!mineOnly && d.avg && d.avg[i] ? '<div class="hr"><div class="who"><b>클럽 평균</b><small>' + d.avg[i].n + '명</small></div><div class="bd"><div class="ln"><span class="lr">' + LZ.lrTxt({ d: d.avg[i].lr < 0 ? 'L' : 'R', n: Math.abs(d.avg[i].lr) }) + '</span><span class="pw">' + (S.unit === 'm' ? d.avg[i].m + '<small style="font-size:60%">m</small>' : LZ.fmtP(LZ.sugOf(d.avg[i].m, v.g, v.h)) + '<small>(' + d.avg[i].m + 'm)</small>') + '</span></div></div></div>' : '') +
            '<button type="button" class="hr mine" data-go="edit" data-p=\'' + esc(JSON.stringify({ id: c.id, i: i })) + '\'>' + recLine(d.mine[i], '<b>내 기록</b>', h, true, hm).replace(/^<div class="hr mine">|<\/div>$/g, '') + '</button></div>';
        }).join('') +
        (d.pick && !mineOnly && S.user.st !== 'expired' ? '<button type="button" class="btn o" data-act="importAll">' + esc(d.pick.nick) + '님 기록 가져오기(빈 홀만)</button>' : '') +
        '<p class="hint center">옆으로 밀면 전반 ↔ 후반 · 내 기록 줄을 누르면 그 홀을 적어요</p></div>';
      $('#mineOnly').addEventListener('change', function (e) { store.set('lz.mineOnly', e.target.checked ? '1' : '0'); LZ.redraw(); });
      store.set('lz.half.' + c.id, String(half));
      LZ.fillImgs(root);
      var x0 = 0; root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      root.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 90 && c.stage === 'done') LZ.go('holes', { id: c.id, half: dx < 0 ? 1 : 0, vset: 1 }, { replace: true }); }, { passive: true });
    }
  };
  LZ.act.viewG = function (el, v) { S.g = v; LZ.go(LZ.cur().name, Object.assign({}, LZ.cur().p, { vset: 1 }), { replace: true }); };
  LZ.act.viewH = function (el, v) { S.h = v; LZ.go(LZ.cur().name, Object.assign({}, LZ.cur().p, { vset: 1 }), { replace: true }); };
  LZ.act.half = function (el, v) { LZ.go('holes', Object.assign({}, LZ.cur().p, { half: +v, vset: 1 }), { replace: true }); };
  LZ.act.unitSet = function (el, v) { if (v !== S.unit) LZ.act.unit(); };
  LZ.act.unit = async function () { S.unit = S.unit === 'p' ? 'm' : 'p'; LZ.toast(S.unit === 'm' ? '거리(m)를 크게 보여요' : '타격감을 크게 보여요'); LZ.go(LZ.cur().name, Object.assign({}, LZ.cur().p, { vset: 1 }), { replace: true }); try { await LZ.api('useBranch', { unit: S.unit }); } catch (e) { /* 무시 */ } };
  LZ.act.pickWho = function () {
    var d = CUR.d;
    LZ.sheet('<h2>누구 기록과 비교할까요?</h2><p class="muted">2명까지 고를 수 있어요(회원 A · 회원 B · 내 기록).</p>' + d.authors.map(function (a) { var on = (d.pick && d.pick.uid === a.uid) || (d.pick2 && d.pick2.uid === a.uid); return '<button type="button" class="opt ' + (on ? 'on' : '') + '" data-act="who" data-v="' + esc(a.uid) + '"><b>' + esc(a.nick) + '님</b><span>신뢰도 ' + a.trust + ' · ' + a.filled + '홀 기록</span></button>'; }).join(''));
  };
  LZ.act.who = async function (el, uid) {
    var d = CUR.d, a = d.pick && d.pick.uid, b = d.pick2 && d.pick2.uid;
    if (uid === a) { a = b; b = ''; } else if (uid === b) { b = ''; } else if (!a) a = uid; else if (!b) b = uid; else { b = a; a = uid; }
    CUR.who = a || ''; CUR.who2 = b || ''; store.set('lz.who.' + d.course.id, CUR.who);
    LZ.closeSheet(); LZ.go('holes', Object.assign({}, LZ.cur().p, { fresh: 1, vset: 1 }), { replace: true });
  };
  /* 가져오기: 상대 기록을 내 모드로 환산해서 빈 홀에 */
  LZ.act.importAll = async function () {
    var d = CUR.d, src = d.pick, md = d.mode || { g: 'p', h: 'm' }, items = [];
    src.recs.forEach(function (r, i) { if (r.r && !d.mine[i].r) items.push({ i: i, rec: Object.assign({}, r, { p: LZ.conv(r.p, r.g, r.h, md.g, md.h), i: '', hs: [] }) }); });
    if (!items.length) { LZ.toast('가져올 빈 홀이 없어요'); return; }
    if (!(await LZ.confirm(src.nick + '님 기록을 가져올까요?', '빈 홀 ' + items.length + '개에 ' + LZ.MODE[md.g] + '-' + LZ.HL[md.h] + ' 기준으로 환산해서 넣어요. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    try { await LZ.api('save', { cid: d.course.id, items: items, g: md.g, h: md.h }); await LZ.api('use', { cid: d.course.id, from: src.uid }).catch(function () {}); LZ.toast('가져왔어요 · ' + items.length + '홀'); LZ.go('holes', { id: d.course.id, fresh: 1, vset: 1 }, { replace: true }); } catch (e) { LZ.toast(e.message, 5000); }
  };

  /* ───── 홀 입력 ───── */
  var ED = { r: null, i: 0, dirty: false, photo: '' };
  function ask(c) { return LZ.dialog({ title: '이 코스의 내 모드·높이', html: '<p class="muted">이 코스에 처음 기록해요. 기계의 모드와 발사 높낮이를 정해 주세요. 이 코스의 내 기록은 모두 이 기준으로 적혀요(나중에 코스 정보에서 바꾸면 같은 거리로 환산돼요).</p><label class="lb">모드</label>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], 'p', 'dlgG') + '<label class="lb">발사 높낮이</label>' + LZ.seg(LZ.HLSEG, 'm', 'dlgH', 'hl') + '<input type="hidden" id="dg" value="p"><input type="hidden" id="dh" value="m">', cancel: null, buttons: [{ label: '이대로 시작', kind: 'y', value: 'ok' }, { label: '취소', kind: 'g', value: null }] }).then(function (v) { return v === 'ok' ? { g: $('#dg') ? $('#dg').value : 'p', h: $('#dh') ? $('#dh').value : 'm' } : null; }); }
  LZ.act.dlgG = function (el, v) { $('#dg').value = v; $$('.dlg .seg:not(.hl) button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.dlgH = function (el, v) { $('#dh').value = v; $$('.dlg .seg.hl button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.screens.edit = {
    tab: 'courses', wake: true,
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('홀 기록', { back: true }) + LZ.skeleton(5);
      var d = await loadCourse(p.id); if (!alive()) return;
      if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 기록은 볼 수만 있어요', 4000); LZ.back(); return; }
      if (!d.mode) { var md = await ask(d.course); if (!md) { LZ.back(); return; } try { var mr = await LZ.api('courseMode', { id: d.course.id, g: md.g, h: md.h }); d.mode = mr.mode; } catch (e) { LZ.toast(e.message); LZ.back(); return; } }
      var i = p.i, c = d.course, h = c.holes[i], old = d.mine[i], r = JSON.parse(JSON.stringify(old.r ? old : emptyRec()));
      if (!old.r) { r.g = d.mode.g; r.h = d.mode.h; r.p = LZ.mySug(LZ.sugOf(h[1], r.g, r.h)); r.r = 'f'; }
      ED = { r: r, i: i, dirty: false, isNew: !old.r, d: d };
      CUR.off = LZ.myOffset(d);
      LZ.guard = { dirty: function () { return ED.dirty; }, ask: async function () { var v = await LZ.dialog({ title: '저장하지 않은 내용이 있어요', cancel: 'stay', buttons: [{ label: '저장하고 나가기', kind: 'y', value: 'save' }, { label: '저장하지 않고 나가기', kind: 'r', value: 'drop' }, { label: '계속 고치기', kind: 'g', value: 'stay' }] }); if (v === 'save') return await saveHole(true); return v === 'drop'; } };
      paintEdit(root);
    }
  };
  function paintEdit(root) {
    var d = ED.d, c = d.course, i = ED.i, h = c.holes[i], r = ED.r, s = LZ.sugOf(h[1], r.g, r.h), my = LZ.mySug(s), last = c.stage === 'done' ? 17 : 8;
    var other = d.pick && d.pick.recs[i] && d.pick.recs[i].r ? d.pick.recs[i] : null;
    root.innerHTML = LZ.hdr(c.name, { back: true }) + '<div class="wrap"><div class="card"><div class="hole"><div class="n">' + (i + 1) + '홀</div><div class="p">파 ' + h[0] + ' · <b>' + h[1] + 'm</b> · ' + esc(d.store) + '</div></div>' +
      '<div class="box" style="margin:8px 0 0;display:flex;align-items:center;gap:10px"><span style="flex:1"><b>' + LZ.MODE[r.g] + ' 모드 · ' + LZ.HL[r.h] + '</b><div class="muted">이 코스에 처음 기록할 때 정한 값이에요. 코스 정보에서 바꿀 수 있어요.</div></span></div>' +
      '<label class="lb">위치 기준</label>' + LZ.seg([['f', '첫화면'], ['c', '홀컵'], ['u', '직접']], r.r, 'edRef') + (r.r === 'u' ? '<input type="text" id="edT" maxlength="10" placeholder="어디에 놓았나요? (예: 왼쪽 나무)" value="' + esc(r.t) + '" style="margin-top:8px">' : '') +
      '<label class="lb">좌우</label><div class="step"><button type="button" data-act="edLr" data-v="-1">◀</button><div class="v">' + LZ.lrTxt(r) + '<small>왼쪽·오른쪽 10칸까지</small></div><button type="button" data-act="edLr" data-v="1">▶</button></div>' +
      '<label class="lb">타격감 (0.5씩)</label><div class="dial"><div class="big">' + (S.unit === 'm' ? LZ.distOf(r.p, r.g, r.h) + '<small style="font-size:50%">m</small><small>타격감 ' + LZ.fmtP(r.p) + '</small>' : LZ.fmtP(r.p) + '<small>' + LZ.distOf(r.p, r.g, r.h) + 'm</small>') + '</div><div class="cmp">' + LZ.mark(r.p, s) + ' 제안 ' + LZ.fmtP(s) + ' (' + LZ.distOf(s, r.g, r.h) + 'm)' + (my !== s ? ' · <span style="color:var(--org)">내 손맛 ' + LZ.fmtP(my) + '</span>' : '') + '</div></div>' +
      '<div class="step"><button type="button" data-act="edP" data-v="-0.5">−</button><div class="v" style="font-size:var(--fs)"><small>−/+ 0.5</small></div><button type="button" data-act="edP" data-v="0.5">＋</button></div>' +
      '<label class="lb">참고사항 <span class="muted" style="font-weight:400">(20자까지)</span></label><div class="row"><input type="text" id="edO" maxlength="20" placeholder="예: 언덕 높아 조금 크게" value="' + esc(r.o) + '"><button type="button" class="sm2 g" style="flex:none;height:56px;border-radius:14px" data-act="edPhoto">📷</button></div><input type="file" id="edFile" accept="image/*" capture="environment" hidden>' +
      (r.i ? '<img class="photo" data-img="' + esc(r.i) + '" alt=""><button type="button" class="sm2 g" style="margin-top:6px" data-act="edPhotoDel">사진 지우기</button>' : '') +
      (r.hs && r.hs.length ? '<div class="muted" style="margin-top:8px">🕘 이력: ' + r.hs.slice(-3).map(function (x) { return LZ.fmtDate(x[0]) + ' <b>' + LZ.fmtP(x[1]) + '</b>(' + LZ.lrTxt({ d: x[2] < 0 ? 'L' : 'R', n: Math.abs(x[2] || 0) }) + ')'; }).join(' → ') + ' → 지금 <b>' + LZ.fmtP(r.p) + '</b> · <a href="#" data-act="edUndo">예전 값으로</a></div>' : '') +
      '<div class="row"><button type="button" class="btn" data-act="edSave">저장</button>' + (i < last ? '<button type="button" class="btn o" data-act="edSaveNext">저장하고 다음 홀 ›</button>' : '') + '</div><div class="saved ' + (ED.dirty || ED.isNew ? 'no' : '') + '">' + (ED.dirty ? '아직 저장 전이에요 · 뒤로 가면 물어봐요' : ED.isNew ? '저장을 누르면 표에 보여요' : '저장됨 ✓') + '</div></div>' +
      (other ? '<div class="other"><b>' + esc(d.pick.nick) + '님 기록</b> <span class="chip">신뢰도 ' + d.pick.trust + '</span><p style="margin:6px 0 0">' + esc(LZ.refTxt(other)) + ' · ' + LZ.lrTxt(other) + ' · 타격감 ' + LZ.fmtP(LZ.conv(other.p, other.g, other.h, r.g, r.h)) + (other.g !== r.g || other.h !== r.h ? ' (' + LZ.MODE[other.g] + '-' + LZ.HL[other.h] + ' ' + LZ.fmtP(other.p) + '에서 환산)' : '') + (other.o ? ' · ' + esc(other.o) : '') + '</p><button type="button" class="btn o" data-act="edImport">이 기록 가져오기</button></div>' : '') +
      '<div class="nav2"><button type="button" data-act="edNav" data-v="-1"' + (i <= 0 ? ' disabled' : '') + '>‹ 이전 홀</button><button type="button" data-act="edNav" data-v="1"' + (i >= last ? ' disabled' : '') + '>다음 홀 ›</button></div></div>';
    var o = $('#edO'); if (o) o.addEventListener('input', function () { ED.r.o = o.value; ED.dirty = true; });
    var t = $('#edT'); if (t) t.addEventListener('input', function () { ED.r.t = t.value; ED.dirty = true; });
    var f = $('#edFile'); if (f) f.addEventListener('change', function () { if (f.files[0]) uploadPhoto(f.files[0]); });
    LZ.fillImgs(root);
  }
  function rep() { paintEdit($('#app')); }
  LZ.act.edRef = function (el, v) { ED.r.r = v; ED.dirty = true; rep(); };
  LZ.act.edLr = function (el, v) { var r = ED.r, cur = (r.d === 'L' ? -1 : 1) * r.n + (+v); cur = Math.max(-10, Math.min(10, cur)); r.d = cur < 0 ? 'L' : 'R'; r.n = Math.abs(cur); ED.dirty = true; rep(); };
  LZ.act.edP = function (el, v) { ED.r.p = LZ.clampP(LZ.half(ED.r.p + (+v))); ED.dirty = true; rep(); };
  LZ.act.edUndo = function () { var hs = ED.r.hs, x = hs[hs.length - 1]; ED.r.p = x[1]; ED.r.d = x[2] < 0 ? 'L' : 'R'; ED.r.n = Math.abs(x[2]); ED.dirty = true; rep(); LZ.toast('예전 값으로 되돌렸어요. 저장을 눌러 주세요'); };
  LZ.act.edImport = function () { var o = ED.d.pick.recs[ED.i], r = ED.r; r.r = o.r; r.t = o.t; r.d = o.d; r.n = o.n; r.p = LZ.conv(o.p, o.g, o.h, r.g, r.h); r.o = o.o; ED.dirty = true; rep(); LZ.toast('가져왔어요. 내 손에 맞게 고치고 저장하세요'); LZ.api('use', { cid: ED.d.course.id, from: ED.d.pick.uid }).catch(function () {}); };
  LZ.act.edVoice = function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { LZ.toast('이 휴대폰은 말로 적기를 지원하지 않아요'); return; }
    var rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = false; LZ.toast('말씀하세요… (16자까지 적혀요)', 4000);
    rec.onresult = function (e) { var t = (e.results[0][0].transcript || '').replace(/[.。]/g, '').slice(0, 16); ED.r.o = t; ED.dirty = true; rep(); if (t.length >= 16) LZ.toast('16자까지만 적혔어요'); };
    rec.onerror = function () { LZ.toast('잘 못 들었어요. 다시 눌러 주세요'); };
    try { rec.start(); } catch (e) { LZ.toast('말로 적기를 시작하지 못했어요'); }
  };
  LZ.act.edPhoto = function () { $('#edFile').click(); };
  LZ.act.edPhotoDel = function () { ED.r.i = ''; ED.dirty = true; rep(); };
  async function uploadPhoto(file) {
    LZ.busy(true, '사진을 줄이는 중…');
    try {
      var data = await LZ.shrink(file, 720, 0.72);
      var r = await LZ.api('photoPut', { data: data }); ED.r.i = r.id; ED.dirty = true; LZ.busy(false); rep();
    } catch (e) { LZ.busy(false); LZ.toast(e.message || '사진을 올리지 못했어요', 4500); }
  }
  LZ.shrink = function (file, max, q) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { var w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h)), cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); var out = cv.toDataURL('image/jpeg', q); if (out.length > 140000) out = cv.toDataURL('image/jpeg', 0.5); resolve(out); };
      img.onerror = function () { reject(new Error('사진을 읽지 못했어요')); }; img.src = url;
    });
  };
  async function saveHole(quiet) {
    var d = ED.d, r = ED.r;
    try {
      var out = await LZ.api('save', { cid: d.course.id, items: [{ i: ED.i, rec: r }] });
      ED.dirty = false; ED.isNew = false; d.mine[ED.i] = Object.assign({}, r, { upd: out.upd }); CUR.at = Date.now();
      if (out.bonus) { S.user = out.user; LZ.toast('🎁 첫 기록! 체험이 ' + out.bonus.days + '일 늘었어요 (' + LZ.fmtYmd(out.bonus.end) + '까지)', 5000); } else if (!quiet) LZ.toast('저장했어요');
      return true;
    } catch (e) {
      if (e.code === 'net' || e.code === 'server') { LZ.queue.push('save', { cid: d.course.id, items: [{ i: ED.i, rec: r }], br: S.br }); ED.dirty = false; d.mine[ED.i] = Object.assign({}, r); LZ.toast('신호가 약해서 휴대폰에 저장했어요. 연결되면 보내요', 4000); return true; }
      LZ.toast(e.message, 5000); return false;
    }
  }
  LZ.act.edSave = async function () { if (await saveHole()) rep(); };
  LZ.act.edSaveNext = async function () { if (!(await saveHole(true))) return; LZ.go('edit', { id: ED.d.course.id, i: ED.i + 1 }, { replace: true, skipGuard: true }); };
  LZ.act.edNav = async function (el, v) { if (ED.dirty && !(await saveHole(true))) return; LZ.go('edit', { id: ED.d.course.id, i: ED.i + (+v) }, { replace: true, skipGuard: true }); };

  /* ───── 치기 모드 ───── */
  LZ.screens.play = {
    tab: 'courses', wake: true,
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('치기 모드', { back: true }) + LZ.skeleton(3);
      var d = await loadCourse(p.id); if (!alive()) return;
      CUR.off = LZ.myOffset(d);
      var c = d.course, i = p.hole || 0, h = c.holes[i], r = d.mine[i], v = viewGH(), s = LZ.sugOf(h[1], v.g, v.h), my = LZ.mySug(s), last = c.stage === 'done' ? 17 : 8;
      var pTxt = r.r ? (r.g === v.g && r.h === v.h ? LZ.fmtP(r.p) : LZ.convTxt(r.p, r.g, r.h, v.g, v.h)) : '', dm = r.r ? LZ.distOf(r.p, r.g, r.h) : 0;
      root.innerHTML = LZ.hdr(c.name, { back: true, right: '<button type="button" class="ib" data-act="unit">' + (S.unit === 'p' ? 'm로' : '타격감') + '</button><button type="button" class="ib ' + (store.get('lz.say') === '1' ? 'on' : '') + '" data-act="say">' + (store.get('lz.say') === '1' ? '🔊 켜짐' : '🔈 소리') + '</button>' }) +
        '<div class="wrap center"><div class="card" style="padding:22px 16px"><div style="font-size:calc(var(--fs) + 22px);font-weight:800;line-height:1.1">' + (i + 1) + '홀</div><div class="muted" style="font-size:calc(var(--fs) + 2px)">파 ' + h[0] + ' · <b>' + h[1] + 'm</b></div>' +
        (r.r ? '<div class="muted" style="margin-top:18px">' + esc(LZ.refTxt(r)) + '</div><div style="font-size:calc(var(--fs) + 30px);font-weight:800;line-height:1.1">' + LZ.lrTxt(r) + '</div><div style="font-size:calc(var(--fs) + 46px);font-weight:800;color:var(--g);line-height:1.1;margin-top:6px">' + (S.unit === 'm' ? dm + '<span style="font-size:50%">m</span>' : pTxt) + '<span style="font-size:calc(var(--fs) + 4px);color:var(--sub);font-weight:700"> ' + (S.unit === 'm' ? '(타격감 ' + pTxt + ')' : '(' + dm + 'm)') + '</span></div><div style="font-size:calc(var(--fs) + 10px);margin-top:8px">' + LZ.markOf(r, h[1]) + ' <span class="muted" style="font-size:var(--fs)">제안 ' + LZ.fmtP(s) + (my !== s ? ' · 내 손맛 ' + LZ.fmtP(my) : '') + '</span></div>' + (r.o ? '<div style="margin-top:10px;font-size:calc(var(--fs) + 2px)">📝 ' + esc(r.o) + '</div>' : '') + (r.i ? '<img class="photo" data-img="' + esc(r.i) + '" alt="" style="max-height:200px;margin:10px auto 0;object-fit:contain">' : '')
          : '<div style="margin:24px 0 8px" class="muted">아직 기록이 없어요</div><div style="font-size:calc(var(--fs) + 30px);font-weight:800;color:var(--g)">제안 ' + LZ.fmtP(s) + '</div><div class="muted">' + LZ.distOf(s, v.g, v.h) + 'm' + (my !== s ? ' · 내 손맛 ' + LZ.fmtP(my) : '') + '</div>') +
        '<button type="button" class="btn o" data-act="sayNow">🔊 읽어 주기</button></div>' +
        '<div class="nav2"><button type="button" data-act="playNav" data-v="-1"' + (i <= 0 ? ' disabled' : '') + '>‹ 이전 홀</button><button type="button" data-act="playNav" data-v="1"' + (i >= last ? ' disabled' : '') + '>다음 홀 ›</button></div>' +
        '<div class="row" style="margin-top:12px"><button type="button" class="btn g" data-go="edit" data-p=\'' + esc(JSON.stringify({ id: c.id, i: i })) + '\'>이 홀 고치기</button><button type="button" class="btn g" data-act="shotFb">짧았다 / 길었다</button></div><p class="hint">옆으로 밀어도 넘어가요 · 화면이 꺼지지 않아요</p></div>';
      LZ.fillImgs(root);
      var x0 = 0; root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      root.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 90) LZ.act.playNav(null, dx < 0 ? 1 : -1); }, { passive: true });
      if (p.say) LZ.act.sayNow();
    }
  };
  LZ.speak = function (t) { try { var u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { LZ.toast('이 휴대폰은 소리 읽기를 지원하지 않아요'); } };
  LZ.act.say = function () { var on = store.get('lz.say') !== '1'; store.set('lz.say', on ? '1' : '0'); LZ.toast(on ? '홀을 넘기면 소리로 읽어 드려요' : '소리를 껐어요'); LZ.redraw(); };
  LZ.act.sayNow = function () {
    var d = CUR.d, i = LZ.cur().p.hole || 0, h = d.course.holes[i], r = d.mine[i], v = viewGH();
    var t = (i + 1) + '홀, 파 ' + h[0] + ', ' + h[1] + '미터. ' + (r.r ? LZ.refTxt(r) + ', ' + LZ.lrPlain(r).replace('좌 ', '왼쪽 ').replace('우 ', '오른쪽 ') + ', 타격감 ' + LZ.fmtP(LZ.conv(r.p, r.g, r.h, v.g, v.h)) + (r.o ? ', ' + r.o : '') : '기록이 없어요. 제안 타격감 ' + LZ.fmtP(LZ.sugOf(h[1], v.g, v.h)));
    LZ.speak(t);
  };
  LZ.act.playNav = function (el, v) { var p = LZ.cur().p, last = CUR.d.course.stage === 'done' ? 17 : 8, n = Math.max(0, Math.min(last, (p.hole || 0) + (+v))); if (n === (p.hole || 0)) return; LZ.go('play', { id: p.id, hole: n, say: store.get('lz.say') === '1' ? 1 : 0 }, { replace: true }); };
  /* 샷 결과 3단추 → 내 손맛 보정(이 홀 기록의 타격감을 0.5 조정해 저장) */
  LZ.act.shotFb = function () {
    var p = LZ.cur().p, r = CUR.d.mine[p.hole || 0]; if (!r.r) { LZ.toast('먼저 이 홀을 적어 주세요'); return; }
    LZ.sheet('<h2>방금 샷은요?</h2><p class="muted">짧았으면 타격감을 0.5 올리고, 길었으면 0.5 내려서 저장해요. 다음에 올 때 바로 맞게.</p><div class="row"><button type="button" class="btn o" data-act="shotAdj" data-v="0.5">짧았다 ▲</button><button type="button" class="btn" data-act="shotAdj" data-v="0">맞았다 ●</button><button type="button" class="btn o" data-act="shotAdj" data-v="-0.5">길었다 ▼</button></div>');
  };
  LZ.act.shotAdj = async function (el, v) {
    var p = LZ.cur().p, i = p.hole || 0, d = CUR.d, r = Object.assign({}, d.mine[i]); LZ.closeSheet();
    if (+v === 0) { LZ.toast('좋아요! 그대로 둘게요'); return; }
    r.p = LZ.clampP(LZ.half(r.p + (+v)));
    try { var out = await LZ.api('save', { cid: d.course.id, items: [{ i: i, rec: r }] }); d.mine[i] = Object.assign({}, r, { upd: out.upd }); LZ.toast('타격감을 ' + LZ.fmtP(r.p) + '로 바꿔 저장했어요'); LZ.redraw(); } catch (e) { LZ.toast(e.message, 4500); }
  };

  /* ───── 코스 등록(전반 → 후반) · 수정 ───── */
  var RG = null;
  function regRows(start, rows) {
    return rows.map(function (r, j) {
      var i = start + j, m = parseFloat(r.m), s = m > 0 ? LZ.sugOf(m, RG.g, RG.h) : null, p = r.p === null ? s : r.p;
      return '<div class="regh"><div class="reg"><span class="hn">' + (i + 1) + '홀</span>' + LZ.seg([['3', '3'], ['4', '4'], ['5', '5']], String(r.par), 'regPar:' + j) + '<input type="text" inputmode="decimal" data-row="' + j + '" value="' + esc(r.m) + '" placeholder="63.4" aria-label="거리"><div class="sug" id="sg' + j + '">' + (s === null ? '<span style="color:#D1D5DB">—</span>' : LZ.fmtP(s) + '<small>' + LZ.distOf(s, RG.g, RG.h) + 'm</small>') + '</div></div><div id="rr' + j + '">' + regRec(j) + '</div></div>';
    }).join('');
  }
  function regRec(j) {
    var r = RG.rows[j], m = parseFloat(r.m), s = m > 0 ? LZ.sugOf(m, RG.g, RG.h) : null, p = r.p === null ? s : r.p;
    if (!RG.rec || s === null) return '';
    return '<div class="regr"><span class="muted">위치</span>' + LZ.seg([['f', '첫화면에서'], ['c', '홀컵에서'], ['u', '직접']], r.ref, 'regRef:' + j, 's wide') + '</div>' + (r.ref === 'u' ? '<div class="regr"><span class="muted"></span><input type="text" data-t="' + j + '" maxlength="10" placeholder="어디에 놓았나요? (예: 왼쪽 나무)" value="' + esc(r.t) + '" style="height:40px;font-size:14px"></div>' : '') +
      '<div class="regr"><span class="muted">내 기록</span><div class="mini"><button type="button" data-act="regLr:' + j + '" data-v="-1">◀</button><span>' + LZ.lrTxt({ d: r.lr < 0 ? 'L' : 'R', n: Math.abs(r.lr) }) + '</span><button type="button" data-act="regLr:' + j + '" data-v="1">▶</button></div><div class="mini"><button type="button" data-act="regP:' + j + '" data-v="-0.5">−</button><span class="pv">' + LZ.fmtP(p) + '<small>' + LZ.distOf(p, RG.g, RG.h) + 'm</small></span><button type="button" data-act="regP:' + j + '" data-v="0.5">＋</button></div><span>' + LZ.mark(p, s) + '</span></div>';
  }
  function regPaint(root) {
    var half = RG.half, title = half ? '후반 9홀 등록' : '새 코스 등록';
    root.innerHTML = LZ.hdr(title, { back: true, right: '<span class="ib" style="background:rgba(255,209,102,.3)">☀ 켜짐 유지</span>' }) + '<div class="wrap">' +
      (half ? '<div class="card tight"><b>' + esc(RG.name) + '</b><div class="muted">전반은 저장됐어요. 후반 9홀(10~18홀)을 넣어 주세요.</div></div>' :
        '<div class="card"><label class="lb" style="margin-top:0">코스 이름</label><input type="text" id="rgName" maxlength="30" value="' + esc(RG.name) + '" placeholder="예: 목행충주호파크골프AB"><p class="hint" id="rgHint">레저로 화면의 코스 이름과 같게 적어 주세요(띄어쓰기 없이).</p><label class="lb">난이도 <span class="muted" style="font-weight:400">— 레저로 화면의 별 그대로</span></label>' + LZ.seg([['1', '★1'], ['2', '★2'], ['3', '★3'], ['4', '★4'], ['5', '★5']], String(RG.stars), 'regStars', 'star') +
        '<label class="lb">모드</label>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], RG.g, 'regG') + '<label class="lb">발사 높낮이 <span class="muted" style="font-weight:400">(기계의 하이·미들·로우)</span></label>' + LZ.seg(LZ.HLSEG, RG.h, 'regH', 'hl') +
        '<div class="tgl" style="padding-bottom:0"><span><b>내 기록도 같이 적기</b><span class="muted">치면서 바로 적어요. 제안값이 미리 들어 있어요</span></span>' + LZ.sw(RG.rec, 'regRecTgl') + '</div></div>') +
      '<div class="card"><h3>' + (half ? '후반 9홀' : '전반 9홀') + '</h3><p class="muted" style="margin:0 0 6px">파를 고르고 거리를 넣으면 제안 타격감이 나와요.</p><div class="reg" style="font-size:12px;color:var(--sub);padding:0"><span>홀</span><span class="center">파</span><span class="center">거리 m</span><span class="center">제안</span></div>' + regRows(half ? 9 : 0, RG.rows) + '</div>' +
      '<p class="hint">참고사항·사진은 저장 뒤 홀 화면에서 더 적을 수 있어요. 등록하는 동안 화면이 꺼지지 않아요.</p><button type="button" class="btn" data-act="regSave">' + (half ? '후반 저장하고 등록 마치기' : '전반 저장하고 후반으로') + '</button></div>';
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.row !== undefined) { var j = +t.dataset.row; RG.rows[j].m = t.value; RG.rows[j].p = null; var m = parseFloat(t.value), s = m > 0 ? LZ.sugOf(m, RG.g, RG.h) : null; $('#sg' + j).innerHTML = s === null ? '<span style="color:#D1D5DB">—</span>' : LZ.fmtP(s) + '<small>' + LZ.distOf(s, RG.g, RG.h) + 'm</small>'; $('#rr' + j).innerHTML = regRec(j); }
      else if (t.dataset.t !== undefined) RG.rows[+t.dataset.t].t = t.value;
      else if (t.id === 'rgName') RG.name = t.value;
    });
    LZ.guard = { dirty: function () { return RG.rows.some(function (r) { return r.m; }) && !RG.saved; }, ask: async function () { return LZ.confirm('나갈까요?', '적던 내용이 사라져요.', '나가기', 'r'); } };
  }
  LZ.screens.reg = {
    tab: 'courses', wake: true,
    show: function (p, root) {
      if (!RG || p.id !== RG.id || RG.saved) RG = { id: p.id || '', name: p.name || '', stars: 3, g: 'p', h: 'm', rec: false, half: p.half || 0, rows: Array.from({ length: 9 }, function () { return { par: 4, m: '', lr: 0, p: null, ref: 'f', t: '' }; }), saved: false };
      regPaint(root);
    }
  };
  function regRe() { var y = window.scrollY; regPaint($('#app')); window.scrollTo(0, y); }
  LZ.act.regStars = function (el, v) { RG.stars = +v; regRe(); };
  LZ.act.regG = function (el, v) { RG.g = v; RG.rows.forEach(function (r) { r.p = null; }); regRe(); };
  LZ.act.regH = function (el, v) { RG.h = v; RG.rows.forEach(function (r) { r.p = null; }); regRe(); };
  LZ.act.regRecTgl = function () { RG.rec = !RG.rec; regRe(); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (!a || !RG) return; var m = /^reg(Par|Ref|Lr|P):(\d+)$/.exec(a.dataset.act); if (!m) return;
    e.preventDefault(); var j = +m[2], r = RG.rows[j], v = a.dataset.v;
    if (m[1] === 'Par') r.par = +v; else if (m[1] === 'Ref') r.ref = v; else if (m[1] === 'Lr') r.lr = Math.max(-10, Math.min(10, r.lr + (+v))); else { var mm = parseFloat(r.m), s = LZ.sugOf(mm, RG.g, RG.h); r.p = LZ.clampP(LZ.half((r.p === null ? s : r.p) + (+v))); }
    LZ.buzz();
    if (m[1] === 'Par') { $$('[data-act="regPar:' + j + '"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); }
    else $('#rr' + j).innerHTML = regRec(j);
  });
  LZ.act.regSave = async function () {
    var holes = [], recs = [];
    for (var j = 0; j < 9; j++) { var r = RG.rows[j], m = parseFloat(r.m); if (!(m > 0)) { LZ.toast((RG.half ? 10 + j : j + 1) + '홀 거리를 넣어 주세요'); return; } holes.push([r.par, m]); if (RG.rec) { var s = LZ.sugOf(m, RG.g, RG.h); recs.push({ r: r.ref, t: r.t, d: r.lr < 0 ? 'L' : 'R', n: Math.abs(r.lr), p: r.p === null ? s : r.p, o: '' }); } else recs.push(null); }
    LZ.busy(true, '저장 중…');
    try {
      if (!RG.half) {
        var f = await LZ.api('regFront', { name: RG.name, holes: holes, stars: RG.stars, g: RG.g, h: RG.h, recs: RG.rec ? recs : undefined, confirm: RG.confirm ? 1 : 0 }, { retry: 0 });
        LZ.busy(false); RG = { id: f.id, name: f.name, stars: RG.stars, g: RG.g, h: RG.h, rec: RG.rec, half: 1, rows: Array.from({ length: 9 }, function () { return { par: 4, m: '', lr: 0, p: null, ref: 'f', t: '' }; }), saved: false };
        LZ.toast('전반을 저장했어요. 후반을 이어서 넣어 주세요'); LZ.go('reg', { id: f.id, half: 1 }, { replace: true, skipGuard: true });
      } else {
        await LZ.api('regBack', { id: RG.id, holes: holes, recs: RG.rec ? recs : undefined }, { retry: 0 });
        LZ.busy(false); RG.saved = true; LZ.toast('코스 등록을 마쳤어요'); CUR.id = ''; LZ.go('holes', { id: RG.id, half: 0 }, { replace: true, skipGuard: true });
      }
    } catch (e) {
      LZ.busy(false);
      if ((e.code === 'similar' || e.code === 'suggest') && e.data) { var v = await LZ.dialog({ title: e.message, cancel: false, buttons: [{ label: e.code === 'suggest' ? '"' + e.data.suggest + '"로 등록' : '다른 조합이 맞아요, 등록', kind: 'y', value: 'go' }, { label: e.data.name + ' 열기', kind: 'o', value: 'open' }, { label: '취소', kind: 'g', value: false }] }); if (v === 'go') { if (e.code === 'suggest') RG.name = e.data.suggest; RG.confirm = 1; LZ.act.regSave(); } else if (v === 'open') { RG.saved = true; LZ.go('holes', { id: e.data.id }, { skipGuard: true }); } return; }
      if (e.code === 'dup' && e.data) { if (await LZ.confirm(e.message, '', '그 코스 열기')) { RG.saved = true; LZ.go('holes', { id: e.data.id }, { skipGuard: true }); } return; }
      LZ.toast(e.message, 5000);
    }
  };
  LZ.screens.courseEdit = {
    tab: 'courses',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('코스 정보', { back: true }) + LZ.skeleton(5);
      var d = await loadCourse(p.id, true); if (!alive()) return; var c = d.course;
      root.innerHTML = LZ.hdr('코스 정보 고치기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">코스 이름</label><input type="text" id="ceName" maxlength="30" value="' + esc(c.name) + '"' + (c.canEdit ? '' : ' disabled') + '><label class="lb">난이도 <span class="muted" style="font-weight:400">— 레저로 화면의 별 그대로</span></label>' + LZ.seg([['1', '★1'], ['2', '★2'], ['3', '★3'], ['4', '★4'], ['5', '★5']], String(c.stars), 'ceStars', 'star') + '<input type="hidden" id="ceStars" value="' + c.stars + '">' +
        (d.mode ? '<label class="lb">이 코스의 내 모드·높이</label><p class="muted" style="margin:0 0 6px">바꾸면 이 코스의 내 기록을 같은 거리가 되도록 환산해요.</p>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], d.mode.g, 'ceG') + '<div style="height:6px"></div>' + LZ.seg(LZ.HLSEG, d.mode.h, 'ceH', 'hl') + '<input type="hidden" id="ceG" value="' + d.mode.g + '"><input type="hidden" id="ceH" value="' + d.mode.h + '">' : '') + '</div>' +
        '<div class="card"><h3>홀별 파·거리</h3>' + c.holes.map(function (h, i) { return '<div class="frow"><span class="n">' + (i + 1) + '홀</span>' + LZ.seg([['3', '3'], ['4', '4'], ['5', '5']], String(h[0]), 'cePar:' + i, 's') + '<input type="text" inputmode="decimal" data-ch="' + i + '" value="' + h[1] + '" style="width:90px;height:44px;padding:0 8px;text-align:center"' + (c.canEdit ? '' : ' disabled') + '></div>'; }).join('') + '</div>' +
        (c.canEdit ? '<button type="button" class="btn" data-act="ceSave">저장</button>' : '<p class="hint center">코스 정보는 정회원·명예회원·관리자가 고칠 수 있어요.</p>') +
        '<div class="card"><h3>수정 이력</h3>' + (c.edits.length ? c.edits.map(function (e) { return '<div class="muted" style="padding:4px 0;border-bottom:1px solid var(--line)">' + LZ.fmtDate(e.at, true) + ' · <b>' + esc(e.nick) + '님</b> · ' + esc(e.what) + '</div>'; }).join('') : '<p class="muted" style="margin:0">아직 고친 적이 없어요.</p>') + '</div>' +
        (S.user.kind === 'admin' ? '<button type="button" class="btn g" data-act="ceDel">코스 지우기(관리자)</button>' : '') + '</div>';
      CUR.pars = c.holes.map(function (h) { return h[0]; });
    }
  };
  LZ.act.ceStars = function (el, v) { $('#ceStars').value = v; $$('[data-act="ceStars"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.ceG = function (el, v) { $('#ceG').value = v; $$('[data-act="ceG"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.ceH = function (el, v) { $('#ceH').value = v; $$('[data-act="ceH"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-act^="cePar:"]'); if (!a || !CUR.pars) return; e.preventDefault(); var i = +a.dataset.act.split(':')[1]; CUR.pars[i] = +a.dataset.v; $$('[data-act="cePar:' + i + '"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === a.dataset.v); }); });
  LZ.act.ceSave = async function () {
    var d = CUR.d, c = d.course, holes = c.holes.map(function (h, i) { var el = $('[data-ch="' + i + '"]'); return [CUR.pars[i], parseFloat(el.value) || h[1]]; });
    LZ.busy(true, '저장 중…');
    try {
      var body = { id: c.id, name: $('#ceName').value, stars: +$('#ceStars').value, front: holes.slice(0, 9) }; if (c.stage === 'done') body.back = holes.slice(9);
      await LZ.api('editCourse', body, { retry: 0 });
      if (d.mode && ($('#ceG').value !== d.mode.g || $('#ceH').value !== d.mode.h)) { var r = await LZ.api('courseMode', { id: c.id, g: $('#ceG').value, h: $('#ceH').value }); LZ.toast('기록 ' + r.converted + '개를 새 기준으로 환산했어요'); }
      LZ.busy(false); CUR.id = ''; LZ.toast('저장했어요'); LZ.go('holes', { id: c.id }, { replace: true });
    } catch (e) { LZ.busy(false); LZ.toast(e.message, 5000); }
  };
  LZ.act.ceDel = async function () { var c = CUR.d.course; if (!(await LZ.confirm('이 코스를 지울까요?', '모든 회원님의 이 코스 기록도 함께 지워져요. 되돌릴 수 없어요.', '지우기', 'r'))) return; try { await LZ.api('delCourse', { id: c.id }); CUR.id = ''; LZ.go('courses', {}, { reset: true }); LZ.toast('지웠어요'); } catch (e) { LZ.toast(e.message, 4500); } };
})();
