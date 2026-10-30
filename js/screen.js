/* 스크린 공략(v7.1): 내 수첩 코스 목록 · 코스 화면(홀 칸·클럽 평균/회원 비교·가져오기) · 치기(한 홀·9홀 쉼·끝 화면·말해 주기) · 코스 등록(+내 기록) · 코스 정보 고치기 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var CUR = { id: '', d: null, at: 0, key: '' };
  function emptyRec() { return { r: '', t: '', d: 'R', n: 0, p: 17, o: '', g: 'p', h: 'm', i: '', hs: [] }; }
  function lrNum(r) { return (r.d === 'L' ? -1 : 1) * (r.n | 0); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function nOf(c) { return c.stage === 'done' ? 18 : 9; }
  /* 예전 "어느 클럽 기록을 볼까요?"(홈에서 부름) — 이제 비교할 클럽만 기억 */
  LZ.act.clubPick = function () {
    var list = (S.me && S.me.moims) || [];
    LZ.sheet('<h2>어느 클럽과 비교할까요?</h2>' + list.map(function (m) { return '<button type="button" class="opt ' + (store.get('lz.cmpBr') === m.id ? 'on' : '') + '" data-act="openClubCourses" data-v="' + esc(m.id) + '"><b>' + esc(m.name) + '</b><span>' + esc(m.area || '') + ' · 회원 ' + m.members + '명</span></button>'; }).join(''));
  };

  /* ═════════ 내 수첩 코스 목록(#23) ═════════ */
  var FLT = [['all', '전체'], ['done', '완료'], ['ing', '기록 중'], ['no', '안 함']];
  var SORTS = [['new', '최근 등록순'], ['old', '오래된 순'], ['name', '이름 가나다순'], ['namez', '이름 역순'], ['diff', '어려운 순'], ['easy', '쉬운 순']];   // v7.0.5 역순(같은 줄 짝: 위↔아래)
  var SORT_REV = { new: 'old', old: 'new', name: 'namez', namez: 'name', diff: 'easy', easy: 'diff' };
  function sortFn(sort) {
    return function (a, b) {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko'); if (sort === 'namez') return b.name.localeCompare(a.name, 'ko');
      if (sort === 'diff') return (b.stars - a.stars) || (b.created - a.created); if (sort === 'easy') return (a.stars - b.stars) || (b.created - a.created);
      return sort === 'old' ? a.created - b.created : b.created - a.created;
    };
  }
  function cStat(c) { return c.mine >= c.n ? 'done' : c.mine > 0 ? 'ing' : 'no'; }
  function cCard(c) {
    var st = cStat(c), pct = Math.round(Math.min(1, c.mine / c.n) * 100);
    var chip = st === 'done' ? '<span class="st done">' + LZ.ic('check') + '완료</span>' : st === 'ing' ? '<span class="st ing">기록 중</span>' : '<span class="st no">안 함</span>';
    return '<div class="ccard ' + st + '" data-act="openC" data-v="' + esc(c.id) + '" role="button" tabindex="0">' +
      '<div class="ct"><b>' + esc(c.name) + '</b>' + chip + '<button type="button" class="lockb' + (c.pub ? '' : ' off') + '" data-act="cPub" data-v="' + esc(c.id) + '" aria-label="' + (c.pub ? '공개 중 · 누르면 비공개' : '비공개 · 누르면 공개') + '" title="' + (c.pub ? '공개' : '비공개') + '">' + LZ.ic(c.pub ? 'unlock' : 'lock') + '</button></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="su">' + c.mine + ' / ' + c.n + '홀' + (c.mode ? ' · ' + LZ.MODE[c.mode.g] + ' · ' + LZ.HL[c.mode.h] : '') + ' · ' + (c.pub ? '공개' : '비공개') + (c.others ? ' · 회원 ' + c.others + '명' : '') + '</div>' +
      '<div class="su">' + LZ.stars(c.stars) + ' · 등록 ' + esc(c.reg || '') + ' ' + LZ.fmtDate(c.created, true) + '</div></div>';
  }
  var CL = null;
  LZ.screens.courses = {
    tab: 'courses',
    show: async function (p, root, alive) {
      var cached = LZ.cacheGet('courses2');
      if (cached) paint(cached); else root.innerHTML = LZ.hdr('내 수첩') + LZ.skeleton(5);
      var r = await LZ.api('courses', {}); if (!alive()) return; LZ.cacheSet('courses2', r); paint(r);
      function paint(r) {
        CL = r; S.unit = r.unit || S.unit;
        var flt = store.get('lz.cflt') || 'all', sort = store.get('lz.csort') || 'new', q = (store.get('lz.cq') || '').toLowerCase();
        if (!SORTS.some(function (x) { return x[0] === sort; })) sort = 'new';
        var all = r.courses.map(function (c) { c.n = c.n || nOf(c); if (c.pub === undefined) c.pub = 1; return c; });
        var cnt = { all: all.length, done: 0, ing: 0, no: 0 }; all.forEach(function (c) { cnt[cStat(c)]++; });
        var list = all.filter(function (c) { return flt === 'all' || cStat(c) === flt; });
        list.sort(sortFn(sort));
        root.innerHTML = LZ.hdr('내 수첩') + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap clist">' + (LZ.admNote ? LZ.admNote('홀 기록(내 수첩)·클럽 가입·라운드 기록') : '') +
          (r.canReg ? '<button type="button" class="btn mk1" data-go="reg">' + LZ.ic('plus') + '새 코스 등록</button>' : '') +
          '<div class="flt" role="tablist">' + FLT.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (flt === x[0]) + '" class="' + (flt === x[0] ? 'on' : '') + '" data-act="cFlt" data-v="' + x[0] + '">' + x[1] + ' <b>' + cnt[x[0]] + '</b></button>'; }).join('') + '</div>' +
          '<div class="csort"><span class="muted">정렬</span><button type="button" class="sortb" data-act="cSort">' + SORTS.filter(function (x) { return x[0] === sort; })[0][1] + ' ▾</button><button type="button" class="sortr" data-act="cSortRev" aria-label="순서 거꾸로 · 지금 ' + SORTS.filter(function (x) { return x[0] === sort; })[0][1] + '" title="순서 거꾸로">' + LZ.ic('sort') + '</button><input type="search" id="cq" value="' + esc(store.get('lz.cq') || '') + '" placeholder="코스 찾기" aria-label="코스 이름 찾기"></div>' +
          (list.length ? list.map(cCard).join('') : '<div class="empty">' + (all.length ? '이 묶음에는 코스가 없어요.' : '아직 코스가 없어요. 첫 코스를 등록해 보세요.') + '</div>') + '</div>';
        LZ.paintSync();
        var cq = $('#cq'), filt = function () { var v = cq.value.toLowerCase(); store.set('lz.cq', cq.value); $$('.ccard', root).forEach(function (b) { b.hidden = !!v && b.querySelector('.ct b').textContent.toLowerCase().indexOf(v) < 0; }); };
        cq.addEventListener('input', filt); if (q) filt();
      }
    }
  };
  LZ.act.openC = function (el, id) { LZ.go('holes', { id: id }); };
  LZ.act.cFlt = function (el, v) { store.set('lz.cflt', v); LZ.redraw(); };
  LZ.act.cSort = function () { var cur = store.get('lz.csort') || 'new'; if (!SORT_REV[cur]) cur = 'new'; LZ.sheet('<h2>정렬</h2><p class="muted" style="margin-top:0">위아래 두 개씩 짝이에요. 목록 옆 ' + LZ.ic('sort') + ' 단추로도 거꾸로 바꿔요.</p>' + SORTS.map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="cSortSet" data-v="' + x[0] + '"><b>' + x[1] + '</b>' + (cur === x[0] ? '<span>' + LZ.ic('check') + ' 지금</span>' : '') + '</button>'; }).join('')); };
  LZ.act.cSortRev = function () { var cur = store.get('lz.csort') || 'new'; store.set('lz.csort', SORT_REV[cur] || 'old'); LZ.redraw(); };
  LZ.act.cSortSet = function (el, v) { store.set('lz.csort', v); LZ.closeSheet(); LZ.redraw(); };
  /* 코스마다 자물쇠: 공개 ↔ 비공개 */
  async function setPub(cid, pub) {
    var r = await LZ.api('coursePub', { id: cid, pub: pub ? 1 : 0 });
    if (CL) CL.courses.forEach(function (c) { if (c.id === cid) c.pub = r.pub; });
    if (CUR.d && CUR.id === cid) CUR.d.pub = r.pub;
    LZ.toast(r.pub ? '이 코스 기록을 클럽 회원님이 볼 수 있어요' : '이 코스 기록을 숨겼어요 · 클럽 평균에도 안 들어가요', 3500);
    return r.pub;
  }
  LZ.act.cPub = async function (el, cid) { var c = CL && CL.courses.filter(function (x) { return x.id === cid; })[0]; await setPub(cid, !(c ? c.pub : 1)); if (CL) LZ.cacheSet('courses2', CL); LZ.redraw(); };

  /* ═════════ 코스 화면(#26) ═════════ */
  function fixRecs(d) { if (!d.mine || !d.mine.length) d.mine = []; for (var i = 0; i < 18; i++) d.mine[i] = d.mine[i] || emptyRec(); if (!d.authors) d.authors = []; if (!d.clubs) d.clubs = []; if (!d.cmp) d.cmp = { id: '', name: '', n: 0 }; if (d.pub === undefined) d.pub = 1; return d; }
  async function loadCourse(id, force) {
    var who = store.get('lz.who.' + id) || '', cmp = store.get('lz.cmpBr') || '', key = id + '|' + cmp + '|' + who;
    if (!force && CUR.key === key && CUR.d && Date.now() - CUR.at < 120000) return CUR.d;
    var d = fixRecs(await LZ.api('course', { id: id, who: who, cmp: cmp }));
    CUR = { id: id, d: d, at: Date.now(), key: key }; S.unit = d.unit || S.unit;
    return d;
  }
  LZ.loadCourse = loadCourse;
  /** 오늘 칠 기준(게임 모드·센서 탄도) — 코스마다 기억. 처음엔 기록 기준 */
  function viewOf(d) {
    var v = store.get('lz.view.' + d.course.id), m = d.mode || { g: 'p', h: 'm' };
    if (v) { var a = v.split('|'); if (LZ.MODE[a[0]] && LZ.HL[a[1]]) return { g: a[0], h: a[1] }; }
    return { g: m.g, h: m.h };
  }
  /** 기록 기준: 이 코스에 처음 기록할 때 정해짐(아직 없으면 오늘 칠 기준으로 적힘) */
  function basisOf(d) { return d.mode || viewOf(d); }
  function cmpMode(d) { if (!d.clubs.length || !d.cmp.id) return 'off'; var m = store.get('lz.cmpMode') || 'avg'; return /^(avg|mem|off)$/.test(m) ? m : 'avg'; }
  function playAt(d) {
    var n = nOf(d.course), v = parseInt(store.get('lz.playAt.' + d.course.id), 10);
    if (v > 0 && v < n) return v;
    var f = d.mine.slice(0, n).filter(function (r) { return r.r; }).length; if (f > 0 && f < n) for (var i = 0; i < n; i++) if (!d.mine[i].r) return i;
    return 0;
  }
  function tile(lbl, val, act, gold) { return '<button type="button" class="tile' + (gold ? ' au' : '') + '" data-act="' + act + '"><span>' + lbl + '</span><b>' + esc(val) + ' ▾</b></button>'; }
  function holeBlock(d, i, v, mode, z) {
    var c = d.course, h = c.holes[i], hm = h[1], r = d.mine[i], s = LZ.sugOf(hm, v.g, v.h);
    var mv = r.r ? LZ.conv(r.p, r.g, r.h, v.g, v.h) : null, dvh = r.r ? LZ.dv(r.p, LZ.sugOf(hm, r.g, r.h)) : '';
    if (mode === 'off') {
      return '<div class="hb off' + (z ? ' z' : '') + '" data-act="hHole" data-v="' + i + '" role="button" tabindex="0"><div class="o1">' + LZ.hn(i + 1) + '<span class="su">파 <b>' + h[0] + '</b> · ' + LZ.fmtM(hm) + 'm</span><span class="su o1r">기준 <b>' + LZ.bsTxt(s) + '</b> ' + dvh + '</span></div>' +
        (r.r ? '<div class="o2"><div><em>내 좌우 · ' + esc(LZ.refTxt(r)) + '에서</em><div class="lrbig">' + LZ.lrTxt(r) + '</div></div><div><em>내 볼스피드</em>' + LZ.bs(mv, 'xl') + '</div></div>' : '<div class="o2 emp">아직 안 적었어요 · 누르면 치기 화면에서 적어요</div>') +
        (r.o ? '<div class="nt2">' + LZ.ic('note') + esc(r.o) + '</div>' : '<div class="nt0">참고사항 없음</div>') + '</div>';
    }
    var cmpCell = '', cmpNote = '—', cn = '';
    if (mode === 'avg') {
      var a = d.avg && d.avg[i];
      cmpCell = '<div class="cmp' + (a ? ' tk' : '') + '"' + (a ? ' data-act="cmpTake" data-v="' + i + '"' : '') + '><em>클럽 평균 · ' + (a ? a.n : d.cmp.n) + '명</em>' + (a ? '<div class="vv">' + LZ.bs(LZ.sugOf(a.m, v.g, v.h), 'sm') + '<span class="lr">' + LZ.lrTxt({ d: a.lr < 0 ? 'L' : 'R', n: Math.abs(a.lr) }) + '</span></div>' : '<div class="emp">공개 기록 2명 이하</div>') + '</div>';
    } else {
      var pk = d.pick, o = pk && pk.recs[i];
      cmpCell = '<div class="cmp' + (o && o.r ? ' tk' : '') + '"' + (o && o.r ? ' data-act="cmpTake" data-v="' + i + '"' : '') + '><em>' + (pk ? esc(pk.nick) + ' ' + LZ.LVN[LZ.lvOf(pk.pts, d.lv)][0] : '클럽 회원') + '</em>' + (o && o.r ? '<div class="vv">' + LZ.bs(LZ.conv(o.p, o.g, o.h, v.g, v.h), 'sm') + '<span class="lr">' + LZ.lrTxt(o) + '</span></div>' : '<div class="emp">' + (pk ? '기록 없음' : '공개한 회원 없음') + '</div>') + '</div>';
      cmpNote = o && o.o ? esc(o.o) : ''; cn = cmpNote ? '' : ' e'; if (!cmpNote) cmpNote = '없음';
    }
    return '<div class="hb' + (z ? ' z' : '') + '" data-act="hHole" data-v="' + i + '" role="button" tabindex="0">' +
      '<div class="h1">' + LZ.hn(i + 1) + '<span>파 ' + h[0] + '</span><span>' + LZ.fmtM(hm) + 'm</span><span>기준 <b>' + LZ.bsTxt(s) + '</b></span>' + dvh + '</div>' +
      '<div class="h2"><div class="me"><em>내 기록</em>' + (r.r ? '<div class="vv">' + LZ.bs(mv) + '<span class="lr">' + LZ.lrTxt(r) + '</span></div>' : '<div class="emp">아직 안 적었어요</div>') + '</div>' + cmpCell + '</div>' +
      '<div class="h3"><div class="' + (r.o ? '' : 'e') + '">' + (r.o ? LZ.ic('note') + esc(r.o) : '참고사항 없음') + '</div><div class="' + (mode === 'avg' ? 'e' : cn.trim()) + '">' + (mode === 'avg' ? '—' : cmpNote) + '</div></div></div>';
  }
  function coursePage(d) {
    var c = d.course, v = viewOf(d), bm = basisOf(d), n = nOf(c), hs = c.holes.slice(0, n);
    var parSum = hs.reduce(function (a, h) { return a + (+h[0] || 0); }, 0), mSum = LZ.r1(hs.reduce(function (a, h) { return a + (+h[1] || 0); }, 0));
    var mode = cmpMode(d), half = n === 18 ? (store.get('lz.half2.' + c.id) || 'f') : 'a', a = half === 'b' ? 9 : 0, b = half === 'f' ? 9 : n, start = playAt(d);
    var diff = v.g !== bm.g || v.h !== bm.h, noClub = !d.clubs.length;
    var det = noClub ? '<span class="muted">클럽에 들면 회원님들 기록과 비교할 수 있어요</span>' :
      mode === 'avg' ? '<button type="button" class="c3d" data-act="hClub">' + LZ.ic('pin') + '<b>' + esc(d.cmp.name || '클럽') + '</b><span>· 공개 ' + d.cmp.n + '명</span></button>' :
      mode === 'mem' ? (d.pick ? '<button type="button" class="c3d" data-act="hWho">' + LZ.avatar({ nick: d.pick.nick, img: d.pick.img }, 'xs') + '<b>' + esc(d.pick.nick) + '</b>' + LZ.lvBadge(d.pick.pts, d.lv) + '<span>' + Number(d.pick.pts || 0).toLocaleString() + '점</span></button>' : '<span class="muted">' + esc(d.cmp.name) + '에 이 코스를 공개한 회원이 아직 없어요</span>') :
      '<span class="muted">내 기록만 크게 보여요</span>';
    var empt = 0; if (mode === 'mem' && d.pick) d.pick.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) empt++; });
    var list = ''; for (var i = a; i < b; i++) list += holeBlock(d, i, v, mode, (i - a) % 2 === 1);
    return LZ.hdr('내 수첩', { back: true }) + '<div class="wrap cpage">' +
      '<h1 class="ctitle">' + esc(c.name) + '</h1>' +
      '<div class="cinfo">' + LZ.stars(c.stars) + ' · ' + n + '홀 · 파 ' + parSum + ' · ' + mSum.toLocaleString() + 'm · <button type="button" class="lnk" data-act="hPub">' + LZ.ic(d.pub ? 'unlock' : 'lock') + (d.pub ? '공개' : '비공개') + '</button><br>등록 ' + esc(c.reg || '') + ' ' + LZ.fmtDate(c.created) + (c.canEdit ? ' · <a href="#" data-go="courseEdit" data-p=\'' + esc(JSON.stringify({ id: c.id })) + '\'>코스 고치기</a>' : '') + '</div>' +
      '<div class="tiles">' + tile('게임 모드', LZ.MODE[v.g], 'hMode', v.g !== bm.g) + tile('센서 탄도', LZ.HL[v.h], 'hHl', v.h !== bm.h) +
      '<button type="button" class="tile go" data-act="hPlay" data-v="' + start + '"><span>' + (start > 0 ? '이어서 ' + (start + 1) + '홀' : '1홀부터') + '</span><b>' + LZ.ic('play') + '치기 시작</b></button></div>' +
      (diff ? '<div class="band"><span>기록 기준</span> <b>' + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + '</b> <i>→</i> <b class="au">' + LZ.MODE[v.g] + ' · ' + LZ.HL[v.h] + '</b><span>' + LZ.ro(LZ.HL[v.h]) + ' 보여주는 중</span></div>' : '') +
      '<div class="c3"><span class="c3l">비교</span>' + [['avg', '클럽 평균 ▾'], ['mem', '클럽 회원 ▾'], ['off', '끄기']].map(function (x) { return '<button type="button" class="' + (mode === x[0] ? 'on' : '') + '" data-act="hCmp" data-v="' + x[0] + '"' + (noClub && x[0] !== 'off' ? ' disabled' : '') + ' aria-pressed="' + (mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="c3dl">' + det + '</div>' +
      (n === 18 ? '<div class="c3"><span class="c3l">홀</span>' + [['f', '전반 1~9'], ['b', '후반 10~18'], ['a', '전체']].map(function (x) { return '<button type="button" class="' + (half === x[0] ? 'on' : '') + '" data-act="hHalf" data-v="' + x[0] + '" aria-pressed="' + (half === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' : '') +
      (mode === 'mem' && d.pick ? '<p class="hint cmpnote">' + LZ.nimE(d.pick.nick) + ' 기록도 ' + LZ.MODE[v.g] + '·' + LZ.HL[v.h] + '으로 바꿔 보여요. 오른쪽을 누르면 가져오기</p>' : mode === 'avg' && d.avg ? '<p class="hint cmpnote">클럽 평균도 ' + LZ.MODE[v.g] + '·' + LZ.HL[v.h] + '으로 바꿔 보여요. 오른쪽을 누르면 가져오기</p>' : '') +
      (mode === 'avg' && !d.avg && d.authors.length ? '<p class="hint cmpnote">공개 기록이 3명부터 평균이 보여요. <a href="#" data-act="hCmp" data-v="mem">클럽 회원과 비교하기</a></p>' : '') +
      '<div class="hbs">' + list + '</div>' +
      (empt ? '<button type="button" class="btn o" data-act="importAll">' + LZ.nimE(d.pick.nick) + ' 기록 가져오기 · 빈 홀 ' + empt + '개</button>' : '') +
      '<p class="hint center">홀을 누르면 그 홀부터 치기 화면이 열려요</p></div>';
  }
  LZ.screens.holes = {
    tab: 'courses',
    show: async function (p, root, alive) {
      var ck = 'course2:' + p.id + '|' + (store.get('lz.cmpBr') || '') + '|' + (store.get('lz.who.' + p.id) || '');
      var cachedD = !p.fresh && !(CUR.d && CUR.id === p.id) && LZ.cacheGet(ck);
      if (cachedD) paint(fixRecs(cachedD)); else if (!(CUR.d && CUR.id === p.id)) root.innerHTML = LZ.hdr('내 수첩', { back: true }) + LZ.skeleton(6);
      else paint(CUR.d);
      var d = await loadCourse(p.id, p.fresh); if (!alive()) return;
      LZ.cacheSet(ck, d); paint(d);
      function paint(d) { root.innerHTML = coursePage(d); LZ.fillImgs && LZ.fillImgs(root); }
    }
  };
  function reCourse(force) { var p = LZ.cur().p; LZ.go('holes', Object.assign({}, p, { fresh: force ? 1 : 0 }), { replace: true }); }
  LZ.act.hHole = function (el, i) { LZ.go('play', { id: CUR.d.course.id, hole: +i, auto: 1 }); };
  LZ.act.hPlay = function (el, i) { LZ.go('play', { id: CUR.d.course.id, hole: +i || 0, auto: 1 }); };
  LZ.act.hHalf = function (el, v) { store.set('lz.half2.' + CUR.d.course.id, v); LZ.redraw(); };
  LZ.act.hPub = async function () { var d = CUR.d; await setPub(d.course.id, !d.pub); LZ.redraw(); };
  function viewSheet(kind) {
    var d = CUR.d, v = viewOf(d), bm = basisOf(d), opts = kind === 'g' ? [['b', '아마추어'], ['p', '프로'], ['m', '마스터']] : LZ.HLSEG, cur = v[kind];
    LZ.sheet('<h2>' + (kind === 'g' ? '오늘 칠 게임 모드' : '이 매장 센서 탄도') + '</h2><p class="muted">고르면 표의 볼스피드를 같은 거리가 나오게 바로 바꿔 보여 드려요. 지금 기록 기준은 ' + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + (LZ.ro(LZ.HL[bm.h]) === '으로' ? '이에요' : '예요') + '. 다른 기준으로 보면서 치기 화면에서 고쳐 저장하면, 이 코스 기록 기준이 그 기준으로 바뀌고 다른 홀도 같은 거리로 함께 바뀌어요.</p>' +
      opts.map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="hViewSet" data-v="' + kind + x[0] + '"><b>' + x[1] + '</b>' + (bm[kind] === x[0] ? '<span>기록 기준</span>' : '') + '</button>'; }).join(''));
  }
  LZ.act.hMode = function () { viewSheet('g'); };
  LZ.act.hHl = function () { viewSheet('h'); };
  LZ.act.hViewSet = function (el, v) { var d = CUR.d, cur = viewOf(d), k = v.charAt(0), x = v.slice(1); cur[k] = x; store.set('lz.view.' + d.course.id, cur.g + '|' + cur.h); LZ.closeSheet(); LZ.redraw(); };
  LZ.act.hCmp = async function (el, v) {
    var d = CUR.d, cur = cmpMode(d);
    if (v === cur && v === 'avg') return LZ.act.hClub();
    if (v === cur && v === 'mem') return LZ.act.hWho();
    store.set('lz.cmpMode', v); LZ.redraw();
    if (v === 'mem' && !d.authors.length) LZ.toast('이 코스를 공개한 클럽 회원이 아직 없어요', 3500);
  };
  LZ.act.hClub = function () {
    var d = CUR.d, cur = d.cmp.id, list = d.clubs.slice(); if (list.length > 1) list.push({ id: '_all', name: '내 모든 클럽 합쳐서' });
    LZ.sheet('<h2>어느 클럽과 비교할까요?</h2><p class="muted">클럽 평균은 이 코스를 공개한 회원님이 3명부터 보여요.</p>' + list.map(function (m) { return '<button type="button" class="opt ' + (cur === m.id ? 'on' : '') + '" data-act="hClubSet" data-v="' + esc(m.id) + '"><b>' + esc(m.name) + '</b>' + (cur === m.id ? '<span>✓ 지금 · 공개 ' + d.cmp.n + '명</span>' : '') + '</button>'; }).join(''));
  };
  LZ.act.hClubSet = async function (el, id) { store.set('lz.cmpBr', id); if (cmpMode(CUR.d) === 'off') store.set('lz.cmpMode', 'avg'); LZ.closeSheet(); reCourse(true); };
  LZ.act.hWho = function () {
    var d = CUR.d; if (!d.authors.length) { LZ.toast('이 코스를 공개한 클럽 회원이 아직 없어요', 3500); return; }
    LZ.sheet('<h2>비교할 회원</h2><p class="muted">' + esc(d.cmp.name) + ' · 이 코스 공개 기록 · 레벨 점수 높은 순</p>' + d.authors.map(function (a) { var on = d.pick && d.pick.uid === a.uid; return '<button type="button" class="opt whoopt ' + (on ? 'on' : '') + '" data-act="hWhoSet" data-v="' + esc(a.uid) + '">' + LZ.avatar({ nick: a.nick, img: a.img }, 'xs') + '<span class="t"><b>' + esc(a.nick) + '</b><span>' + LZ.lvPts(a.pts, d.lv) + ' · ' + a.filled + '홀 기록</span></span>' + (on ? '<b class="ck">✓</b>' : '') + '</button>'; }).join(''));
    LZ.fillImgs && LZ.fillImgs($('#layer'));
  };
  LZ.act.hWhoSet = function (el, uid) { store.set('lz.who.' + CUR.d.course.id, uid); store.set('lz.cmpMode', 'mem'); LZ.closeSheet(); reCourse(true); };
  /* 가져오기: 오른쪽 비교 칸(클럽 평균·회원 기록)을 내 기록 기준으로 환산해서 그 홀에 */
  LZ.act.cmpTake = async function (el, i) {
    i = +i; var d = CUR.d, bm = basisOf(d), mode = cmpMode(d), h = d.course.holes[i], cur = d.mine[i], rec, who;
    if (mode === 'avg') { var a = d.avg && d.avg[i]; if (!a) return; rec = { r: 'f', t: '', d: a.lr < 0 ? 'L' : 'R', n: Math.abs(a.lr), p: LZ.sugOf(a.m, bm.g, bm.h), o: cur.o || '' }; who = '클럽 평균'; }
    else { var o = d.pick && d.pick.recs[i]; if (!o || !o.r) return; rec = { r: o.r, t: o.t, d: o.d, n: o.n, p: LZ.conv(o.p, o.g, o.h, bm.g, bm.h), o: o.o || cur.o || '' }; who = LZ.nim(d.pick.nick) + ' 기록'; }
    if (!(await LZ.confirm((i + 1) + '홀에 ' + who + '을 가져올까요?', (cur.r ? '지금 내 기록(' + LZ.refTxt(cur) + ' ' + LZ.lrPlain(cur) + ' · 볼스피드 ' + LZ.bsTxt(cur.p) + ')이 바뀌어요. ' : '') + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + ' 기준으로 바꿔서 넣어요: ' + LZ.refTxt(rec) + ' ' + LZ.lrPlain(rec) + ' · 볼스피드 ' + LZ.bsTxt(rec.p) + '. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    rec = Object.assign({}, cur, rec, { g: bm.g, h: bm.h, i: cur.i || '', hs: cur.hs || [] });
    try {
      var out = await LZ.api('save', { cid: d.course.id, items: [{ i: i, rec: rec }], g: bm.g, h: bm.h });
      d.mine[i] = Object.assign({}, rec, { upd: out.upd }); if (!d.mode) d.mode = out.mode || { g: bm.g, h: bm.h };
      if (mode === 'mem') LZ.api('use', { cid: d.course.id, from: d.pick.uid, cmp: d.cmp.id }).catch(function () {});
      LZ.toast((i + 1) + '홀에 가져왔어요'); LZ.redraw();
    } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.importAll = async function () {
    var d = CUR.d, src = d.pick, bm = basisOf(d), n = nOf(d.course), items = [];
    src.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) items.push({ i: i, rec: Object.assign({}, r, { p: LZ.conv(r.p, r.g, r.h, bm.g, bm.h), g: bm.g, h: bm.h, i: '', hs: [] }) }); });
    if (!items.length) { LZ.toast('가져올 빈 홀이 없어요'); return; }
    if (!(await LZ.confirm(LZ.nim(src.nick) + ' 기록을 가져올까요?', '빈 홀 ' + items.length + '개에 ' + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + ' 기준으로 바꿔서 넣어요. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    try { await LZ.api('save', { cid: d.course.id, items: items, g: bm.g, h: bm.h, src: src.uid }); await LZ.api('use', { cid: d.course.id, from: src.uid, cmp: d.cmp.id }).catch(function () {}); LZ.toast('가져왔어요 · ' + items.length + '홀'); reCourse(true); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  /* 예전 "홀 기록" 화면 주소는 치기 화면으로 */
  LZ.screens.edit = { tab: 'courses', show: function (p) { LZ.go('play', { id: p.id, hole: p.i || 0 }, { replace: true }); } };

  /* ═════════ 치기(#27): 한 홀씩 보고 그 자리에서 고치기 ═════════ */
  var ED = null, PL = null;
  function plState(cid) {
    if (!PL || PL.cid !== cid) { PL = store.json('lz.pl.' + cid); if (!PL || PL.cid !== cid || Date.now() - (PL.at || 0) > 12 * 3600000) PL = { cid: cid, orig: {}, pts: 0, at: Date.now() }; }
    return PL;
  }
  function plKeep() { if (PL) { PL.at = Date.now(); store.setJSON('lz.pl.' + PL.cid, PL); } }
  function plReset(cid) { PL = { cid: cid, orig: {}, pts: 0, at: Date.now() }; plKeep(); }
  function sayBtn() { var on = store.get('lz.say') === '1'; return '<button type="button" class="tb snd' + (on ? ' on' : '') + '" data-act="say" aria-pressed="' + on + '" aria-label="말해 주기' + (on ? ' 켜짐 · 누르면 다시 듣기' : '') + '" title="말해 주기">' + LZ.ic('sound') + '</button>'; }
  function playHdr(c) { return LZ.hdr(c ? c.name : '치기', { back: true, backLabel: '표', noHelp: 1, noBell: 1, nosub: 1, sound: sayBtn() }); }
  LZ.screens.play = {
    wake: true, nobar: true,
    show: async function (p, root, alive) {
      root.innerHTML = playHdr(CUR.d && CUR.id === p.id ? CUR.d.course : null) + LZ.skeleton(3);
      var d = await loadCourse(p.id); if (!alive()) return;
      var c = d.course, n = nOf(c);
      plState(c.id);
      if (p.done) { ED = null; paintDone(root, d, p.done); return; }
      var i = Math.max(0, Math.min(n - 1, p.hole || 0)), bm = basisOf(d), h = c.holes[i];
      if (PL.orig[i] === undefined) { PL.orig[i] = clone(d.mine[i]); plKeep(); }
      store.set('lz.playAt.' + c.id, String(i));
      var r = clone(d.mine[i]), isNew = !r.r;
      if (isNew) { var a = d.avg && d.avg[i]; r.g = bm.g; r.h = bm.h; r.r = 'f'; r.p = LZ.half(a ? LZ.sugOf(a.m, bm.g, bm.h) : LZ.sugOf(h[1], bm.g, bm.h)); r.d = a && a.lr < 0 ? 'L' : 'R'; r.n = a ? Math.abs(a.lr) : 0; }
      var v = viewOf(d);
      ED = { d: d, i: i, r: r, isNew: isNew, dirty: false, v: v, disp: LZ.conv(r.p, r.g, r.h, v.g, v.h), note: !!r.o };
      if (isNew && (v.g !== bm.g || v.h !== bm.h)) { var a2 = d.avg && d.avg[i]; ED.disp = LZ.half(a2 ? LZ.sugOf(a2.m, v.g, v.h) : LZ.sugOf(h[1], v.g, v.h)); r.p = LZ.conv(ED.disp, v.g, v.h, r.g, r.h); }   // v7.0.4 새 홀은 보는 기준의 0.5 단위 기준값으로
      LZ.guard = { dirty: function () { return ED && ED.dirty; }, ask: async function () { var x = await LZ.dialog({ title: '고친 내용을 저장할까요?', cancel: 'stay', buttons: [{ label: '저장하고 나가기', kind: 'y', value: 'save' }, { label: '저장하지 않고 나가기', kind: 'r', value: 'drop' }, { label: '계속 고치기', kind: 'g', value: 'stay' }] }); if (x === 'save') return await plSaveHole(); return x === 'drop'; } };
      paintPlay(root);
      if (p.auto && store.get('lz.say') === '1') setTimeout(function () { if (ED && ED.i === i) LZ.act.sayNow(); }, 250);
    }
  };
  function paintPlay(root) {
    root = root || $('#app');
    var d = ED.d, c = d.course, i = ED.i, h = c.holes[i], r = ED.r, v = ED.v, n = nOf(c), s = LZ.sugOf(h[1], v.g, v.h), b = LZ.bsParts(ED.disp), off = LZ.dvOf(ED.disp, s);
    var why = off ? '<div class="why"><label for="plO" class="warn">기준보다 1 넘게 달라요 · 사유(선택)</label><input type="text" id="plO" maxlength="20" placeholder="예: 오르막, 그린 뒤 OB" value="' + esc(r.o) + '"></div>' :
      (ED.note || r.o ? '<div class="why soft"><label for="plO">참고사항(선택)</label><input type="text" id="plO" maxlength="20" placeholder="예: 바람 오른쪽" value="' + esc(r.o) + '"></div>' : '<button type="button" class="lnk notel" data-act="plNote">' + LZ.ic('note') + '참고사항 적기 <span class="muted">(선택)</span></button>');
    var hist = r.hs && r.hs.length ? '<div class="phist">' + LZ.ic('note') + ' 지난 값 ' + r.hs.slice(-2).map(function (x) { return LZ.fmtDate(x[0]) + ' <b>' + LZ.bsTxt(LZ.conv(x[1], r.g, r.h, v.g, v.h)) + '</b>(' + LZ.lrPlain({ d: x[2] < 0 ? 'L' : 'R', n: Math.abs(x[2] || 0) }) + ')'; }).join(' → ') + ' · <a href="#" data-act="plUndo">예전 값으로</a></div>' : '';
    root.innerHTML = playHdr(c) + '<div class="wrap play2">' +
      '<div class="phd"><span>' + LZ.hn(i + 1, 'xl') + '<span class="su"> / ' + n + ' · </span><b class="ppar">파 ' + h[0] + '</b></span><span class="pdist">' + LZ.fmtM(h[1]) + '<small>m</small></span></div>' +
      (v.g !== basisOf(d).g || v.h !== basisOf(d).h ? '<div class="band sm"><b class="au">' + LZ.MODE[v.g] + ' · ' + LZ.HL[v.h] + '</b><span>' + LZ.ro(LZ.HL[v.h]) + ' 바꿔 보여주는 중</span></div>' : '') +
      '<div class="card pcd"><div class="plbl">볼스피드' + (ED.isNew && !ED.dirty ? ' <span class="muted">· 아직 기록 없음(기준값)</span>' : '') + '</div>' +
      '<div class="pst"><button type="button" class="stp" data-act="plP" data-v="-0.5" aria-label="볼스피드 0.5 줄이기">−</button><span class="pbig" data-bs="' + b.v + '">' + b.t + '</span><button type="button" class="stp" data-act="plP" data-v="0.5" aria-label="볼스피드 0.5 늘리기">+</button></div>' +
      '<div class="pbar"><span>' + b.lo + '</span><span class="vb"><i style="left:' + b.pos + '%"></i></span><span>' + b.hi + '</span></div>' +
      '<div class="pref">기준 <b>' + LZ.bsTxt(s) + '</b> ' + LZ.dv(ED.disp, s) + '</div>' + why + hist + '</div>' +
      '<div class="card pcd"><div class="plbl">좌우</div><div class="pst"><button type="button" class="stp l" data-act="plLr" data-v="-1" aria-label="왼쪽으로 한 칸">◀</button><span class="pbig lrb">' + LZ.lrTxt(r) + '</span><button type="button" class="stp r" data-act="plLr" data-v="1" aria-label="오른쪽으로 한 칸">▶</button></div>' +
      '<div class="seg3">' + [['f', '첫화면'], ['c', '홀컵'], ['u', '직접']].map(function (x) { return '<button type="button" class="' + (r.r === x[0] ? 'on' : '') + '" data-act="plRef" data-v="' + x[0] + '" aria-pressed="' + (r.r === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (r.r === 'u' ? '<input type="text" id="plT" class="plt" maxlength="10" placeholder="어디에 놓았나요? (예: 왼쪽 나무)" value="' + esc(r.t) + '">' : '') + '</div>' +
      '<div class="pnav"><button type="button" class="btn g" data-act="plNav" data-v="-1"' + (i <= 0 ? ' disabled' : '') + '>‹ 이전</button><button type="button" class="btn" data-act="plNext">' + (i >= n - 1 ? '저장하고 끝내기 ›' : '저장하고 다음 홀 ›') + '</button></div>' +
      '<div class="saved ' + (ED.dirty ? 'no' : '') + '">' + (ED.dirty ? '고쳤어요 · 넘어가면 저장돼요' : ED.isNew ? '기준값이에요 · 저장하면 내 수첩에 적혀요' : '내 수첩 기록이에요') + '</div></div>';
    var o = $('#plO'); if (o) o.addEventListener('input', function () { ED.r.o = o.value; ED.dirty = true; });
    var t = $('#plT'); if (t) t.addEventListener('input', function () { ED.r.t = t.value; ED.dirty = true; });
  }
  function rep() { var y = window.scrollY; paintPlay(); window.scrollTo(0, y); }
  LZ.act.plP = function (el, v) {
    var x = ED.disp, st = +v, nx = st > 0 ? Math.floor(x * 2 + 1e-6) / 2 + 0.5 : Math.ceil(x * 2 - 1e-6) / 2 - 0.5;   // 0.5 칸에 맞춰 움직임(환산값 22.7 → + 23 · − 22.5)
    ED.disp = LZ.clampP(LZ.r1(nx)); ED.r.p = LZ.conv(ED.disp, ED.v.g, ED.v.h, ED.r.g, ED.r.h); ED.dirty = true; rep();
  };
  LZ.act.plLr = function (el, v) { var r = ED.r, cur = Math.max(-10, Math.min(10, lrNum(r) + (+v))); r.d = cur < 0 ? 'L' : 'R'; r.n = Math.abs(cur); ED.dirty = true; rep(); };
  LZ.act.plRef = function (el, v) { ED.r.r = v; ED.dirty = true; rep(); if (v === 'u') { var t = $('#plT'); if (t && !t.value) t.focus(); } };
  LZ.act.plNote = function () { ED.note = true; rep(); var o = $('#plO'); if (o) o.focus(); };
  LZ.act.plUndo = function () { var hs = ED.r.hs, x = hs[hs.length - 1]; ED.r.p = x[1]; ED.r.d = x[2] < 0 ? 'L' : 'R'; ED.r.n = Math.abs(x[2]); ED.disp = LZ.conv(ED.r.p, ED.r.g, ED.r.h, ED.v.g, ED.v.h); ED.dirty = true; rep(); LZ.toast('예전 값으로 되돌렸어요 · 넘어가면 저장돼요'); };
  async function plSaveHole() {
    if (!ED) return true; var d = ED.d, r = ED.r, i = ED.i, bm = basisOf(d);
    if (!ED.dirty && !ED.isNew) return true;
    if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 기록은 볼 수만 있어요', 4000); ED.dirty = false; return true; }
    var v = ED.v, body = { cid: d.course.id, items: [{ i: i, rec: Object.assign({}, r, { vp: ED.disp }) }], g: bm.g, h: bm.h, vg: v.g, vh: v.h };   // v7.0.4 보던 기준(vg·vh)과 보던 값(vp)도 보냄: 다른 기준으로 고치면 서버가 코스 기록 기준을 바꿈
    try {
      var out = await LZ.api('save', body);
      if (Array.isArray(out.recs) && out.recs.length) { d.mine = out.recs; fixRecs(d); } else d.mine[i] = Object.assign({}, r, { upd: out.upd });
      if (out.mode && out.mode.g) d.mode = out.mode; else if (!d.mode) d.mode = { g: bm.g, h: bm.h };
      if (out.switched) basisSwitched(d, out.switched.to);
      plState(d.course.id).pts += out.pts || (out.bonus && out.bonus.pts) || 0; plKeep();
      ED.dirty = false; ED.isNew = false; CUR.at = Date.now(); return true;
    } catch (e) {
      if (e.code === 'net' || e.code === 'server') { LZ.queue.push('save', Object.assign({ br: S.br }, body)); d.mine[i] = Object.assign({}, r); ED.dirty = false; ED.isNew = false; LZ.toast('신호가 약해서 휴대폰에 저장했어요. 연결되면 보내요', 4000); return true; }
      LZ.toast(LZ.errText(e), 5000); return false;
    }
  }
  /** v7.0.4 기록 기준이 바뀜: 코스 목록 칸도 같이 고치고 한 번 알려 드림 */
  function basisSwitched(d, to) {
    d.mode = { g: to.g, h: to.h };
    if (CL) { CL.courses.forEach(function (c) { if (c.id === d.course.id) c.mode = d.mode; }); LZ.cacheSet('courses2', CL); }
    LZ.toast('이 코스 기록 기준을 ' + LZ.modeTxt(to) + LZ.ro(LZ.HL[to.h]) + ' 바꿔 저장했어요', 4000);
  }
  LZ.act.plNext = async function () {
    var d = ED.d, i = ED.i, n = nOf(d.course), id = d.course.id;
    if (!(await plSaveHole())) return;
    if (i >= n - 1) LZ.go('play', { id: id, done: 'end' }, { replace: true, skipGuard: true });
    else if (n === 18 && i === 8) LZ.go('play', { id: id, done: 'rest' }, { replace: true, skipGuard: true });
    else LZ.go('play', { id: id, hole: i + 1, auto: 1 }, { replace: true, skipGuard: true });
  };
  LZ.act.plNav = async function (el, v) { var i = ED.i + (+v), id = ED.d.course.id; if (i < 0) return; if (ED.dirty && !(await plSaveHole())) return; LZ.go('play', { id: id, hole: i, auto: 1 }, { replace: true, skipGuard: true }); };
  /* 옆으로 밀어 홀 넘기기(치기 화면에서만) */
  var swX = 0, swY = 0;
  document.addEventListener('touchstart', function (e) { swX = e.touches[0].clientX; swY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (LZ.cur().name !== 'play' || !ED) return; if (e.target.closest('input, textarea, .pbar')) return; var dx = e.changedTouches[0].clientX - swX, dy = e.changedTouches[0].clientY - swY; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) { if (dx < 0) LZ.act.plNext(); else LZ.act.plNav(null, -1); } }, { passive: true });

  /* ───── 9홀 쉬는 화면 · 끝 화면 ───── */
  function changesOf(d, a, b) {
    var out = [], fresh = 0, v = viewOf(d);
    for (var i = a; i < b; i++) {
      var o = PL.orig[i], r = d.mine[i]; if (o === undefined || !r.r) continue;
      if (!o.r) { fresh++; continue; }
      var op = LZ.conv(o.p, o.g, o.h, r.g, r.h), dp = LZ.r1(r.p - op), dl = lrNum(r) - lrNum(o), refCh = o.r !== r.r || (o.r === 'u' && o.t !== r.t);
      if (Math.abs(dp) >= 0.1 || dl || refCh) out.push({ i: i, dp: Math.abs(dp) >= 0.1 ? dp : 0, dl: dl, ref: refCh, from: LZ.conv(o.p, o.g, o.h, v.g, v.h), to: LZ.conv(r.p, r.g, r.h, v.g, v.h), o: o, r: r });
    }
    out.sort(function (x, y) { return (Math.abs(y.dp) * 2 + Math.abs(y.dl)) - (Math.abs(x.dp) * 2 + Math.abs(x.dl)) || x.i - y.i; });
    return { list: out, fresh: fresh, nP: out.filter(function (x) { return x.dp; }).length, nL: out.filter(function (x) { return x.dl || x.ref; }).length };
  }
  function chgItem(x) {
    var parts = [];
    if (x.dp) parts.push(LZ.bsTxt(x.from) + ' → <b>' + LZ.bsTxt(x.to) + '</b> <span class="dv ' + (x.dp > 0 ? 'up' : 'dn') + '">' + (x.dp > 0 ? '▲' : '▼') + '</span>');
    if (x.ref) parts.push(esc(LZ.refTxt(x.o)) + ' → <b>' + esc(LZ.refTxt(x.r)) + '</b>에서');
    if (x.dl) parts.push(LZ.lrPlain(x.o) + ' → <b>' + LZ.lrPlain(x.r) + '</b>');
    return '<button type="button" class="li chgl" data-act="plJump" data-v="' + x.i + '" aria-label="' + (x.i + 1) + '홀 다시 치기">' + LZ.hn(x.i + 1) + '<span class="chgv">' + parts.join('<br>') + '</span>' + LZ.ic('chev') + '</button>';   // v7.0.1 누르면 그 홀 치기
  }
  function chgCard(C, title, sub) {
    if (!C.list.length) return '<div class="pcard"><div class="ph"><b>고친 홀 없어요</b></div><div class="su">기록대로 잘 맞았어요' + (C.fresh ? ' · 새로 적은 홀 ' + C.fresh + '개' : '') + '</div></div>';
    var top = C.list.slice(0, 3), more = C.list.slice(3);
    return '<div class="pcard"><div class="ph"><b>' + title + ' ' + C.list.length + '개</b>' + (sub ? '<span class="su">' + sub + '</span>' : '') + '</div><div class="su">볼스피드 ' + C.nP + ' · 좌우 ' + C.nL + (C.fresh ? ' · 새로 적은 홀 ' + C.fresh : '') + '</div>' +
      top.map(chgItem).join('') + (more.length ? '<div class="more" hidden>' + more.map(chgItem).join('') + '</div><button type="button" class="lnk morel" data-act="plMore">나머지 ' + more.length + '홀 보기 ›</button>' : '') + '</div>';
  }
  function paintDone(root, d, kind) {
    var c = d.course, n = nOf(c), v = viewOf(d), id = c.id, pts = PL.pts || 0, html;
    if (kind === 'rest') {
      var R = changesOf(d, 0, 9);
      html = '<div class="pdone"><div class="pdi">' + LZ.ic('flag') + '</div><h1>전반 9홀이 끝났어요</h1><p class="pds">잠시 숨 고르고 후반으로 갈게요</p>' +
        chgCard(R, '전반에 고친 홀') + '<p class="pds sm">자동으로 저장됐어요 · 적립 포인트 +' + pts + 'P</p>' +
        '<button type="button" class="btn gold" data-act="plGo" data-v="9">후반 시작 · 10홀 ›</button><button type="button" class="lnk pdl" data-act="plEnd">여기서 끝내기</button></div>';
    } else {
      var E = changesOf(d, 0, n), f = E.list.filter(function (x) { return x.i < 9; }).length, filled = d.mine.slice(0, n).filter(function (r) { return r.r; }).length;
      var oddL = []; for (var i = 0; i < n; i++) { var r = d.mine[i], sg = r.r ? LZ.sugOf(c.holes[i][1], r.g, r.h) : 0; if (r.r && LZ.dvOf(r.p, sg)) oddL.push({ i: i, p: r.p, s: sg }); }
      var odd = oddL.length; ODD = oddL;
      html = '<div class="pdone"><div class="pdi">' + LZ.ic('trophy') + '</div><h1>경기가 끝났어요</h1><p class="pds">' + esc(c.name) + ' · ' + n + '홀 · ' + LZ.MODE[v.g] + '·' + LZ.HL[v.h] + '로 쳤어요</p>' +
        chgCard(E, '오늘 고친 홀', n === 18 ? '전반 ' + f + ' · 후반 ' + (E.list.length - f) : '') +
        '<div class="ptiles"><div><span>내 수첩</span><b>' + filled + '/' + n + '홀' + (filled >= n ? LZ.ic('check', 'tk') : '') + '</b></div><div><span>적립 포인트</span><b class="au">+' + pts + 'P</b></div>' + (odd ? '<button type="button" class="ptodd" data-act="plOdd"><span>기준과 다른 홀</span><b>' + odd + '개 ›</b></button>' : '<div><span>기준과 다른 홀</span><b>0개</b></div>') + '</div>' +
        (odd ? '<p class="pds sm">기준과 1 넘게 다른 홀이에요. 눌러서 그 홀을 다시 치거나, 코스 화면에서 홀을 눌러 사유를 적어 두면 좋아요</p>' : '') +
        '<button type="button" class="btn gold" data-act="plFinish">저장하고 코스 화면으로 ›</button><button type="button" class="lnk pdl" data-act="plRestart">1홀부터 다시 치기</button></div>';
    }
    root.innerHTML = html;
  }
  var ODD = [];
  /* v7.0.1 "기준과 다른 홀" 타일: 한 홀이면 바로 그 홀 치기, 여러 홀이면 고르는 창 */
  LZ.act.plOdd = function () {
    var L = ODD || []; if (!L.length) return;
    if (L.length === 1) { LZ.act.plJump(null, String(L[0].i)); return; }
    LZ.sheet('<h2>기준과 다른 홀 ' + L.length + '개</h2><p class="muted" style="margin:0 0 6px">홀을 누르면 그 홀부터 다시 쳐요. 기록은 그대로 있어요.</p><div class="list oddl">' + L.map(function (x) {
      var up = x.p > x.s; return '<button type="button" class="li" data-act="plJump" data-v="' + x.i + '">' + LZ.hn(x.i + 1) + '<span class="chgv">내 기록 <b>' + LZ.bsTxt(x.p) + '</b> <span class="dv ' + (up ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + '</span><br><span class="muted">기준 ' + LZ.bsTxt(x.s) + '</span></span>' + LZ.ic('chev') + '</button>'; }).join('') + '</div>');
  };
  LZ.act.plJump = function (el, v) { LZ.act.plGo(el, v); };   // v7.0.1 고친 홀·기준과 다른 홀 → 그 홀 치기
  LZ.act.plMore = function (el) { var m = el.parentNode.querySelector('.more'); if (m) m.hidden = false; el.remove(); };
  LZ.act.plGo = function (el, v) { LZ.go('play', { id: CUR.d.course.id, hole: +v, auto: 1 }, { replace: true }); };
  LZ.act.plEnd = function () { LZ.go('play', { id: CUR.d.course.id, done: 'end' }, { replace: true }); };
  LZ.act.plFinish = function () {
    var id = CUR.d.course.id; plReset(id); store.del('lz.playAt.' + id); CUR.at = Date.now();
    var below = LZ.stack[LZ.stack.length - 2]; if (below && below.name === 'holes' && below.p && below.p.id === id) LZ.back(); else LZ.go('holes', { id: id }, { replace: true });
  };
  LZ.act.plRestart = function () { var id = CUR.d.course.id; plReset(id); LZ.go('play', { id: id, hole: 0, auto: 1 }, { replace: true }); };

  /* ───── 말해 주기(#32): 휴대폰 한국어 목소리 ───── */
  var NUMK = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십', '십일', '십이', '십삼', '십사', '십오', '십육', '십칠', '십팔'];
  var NATK = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  var PARE = { 3: '쓰리', 4: '포', 5: '파이브', 6: '식스' };
  /** 읽어 줄 문장. o = { hole, par, ref(f|c|u), t, d(L|R), n, p(오늘 기준 볼스피드), o(참고사항), none(기록 없음) }
   *  예: "삼 홀, 파 포. 홀컵에서 왼쪽 세 칸. 볼스피드 24 넘게, 25 전까지 치세요. 참고로, 오르막입니다." */
  LZ.sayText = function (o) {
    var s = (NUMK[o.hole] || o.hole) + ' 홀, 파 ' + (PARE[o.par] || o.par) + '. ';
    if (o.none) s += '아직 기록이 없어요. 기준 ';
    else s += (o.ref === 'c' ? '홀컵에서' : o.ref === 'u' ? (String(o.t || '').trim() || '직접 놓은 곳') + '에서' : '첫화면에서') + ' ' + (o.n ? (o.d === 'L' ? '왼쪽 ' : '오른쪽 ') + (NATK[o.n] || o.n) + ' 칸' : '그대로') + '. ';
    var b = LZ.bsParts(o.p);
    s += '볼스피드 ' + (b.v >= 40 ? '풀로 치세요.' : b.int ? b.v + '까지 치세요.' : b.lo + ' 넘게, ' + b.hi + ' 전까지 치세요.');
    var note = String(o.o || '').trim().replace(/[.!?。]+$/, '');
    if (note) s += ' 참고로, ' + note + (/(다|요)$/.test(note) ? '.' : '입니다.');
    return s;
  };
  var VF = /female|여성|여자|yuna|유나|sora|소라|heami|혜미|sunhi|선희|seoyeon|서연|jimin|지민|narae|나래|eunbi|은비|google 한국의|sun-hi|kyuri|규리/i;
  var VM = /\bmale|남성|남자|minsu|민수|injoon|인준|hyunsu|현수|bongjin|봉진|gookmin|국민|jihun|지훈|sangwoo|상우|seojun|서준|kangkang/i;
  /** 휴대폰의 한국어 목소리에 이름 붙이기: 남 톰→마이클→제임스, 여 에밀리→소피아→그레이스, 모르는 목소리는 "목소리 n" */
  LZ.voiceList = function (all) {
    try { all = all || (window.speechSynthesis ? speechSynthesis.getVoices() : []) || []; } catch (e) { all = []; }
    var ko = all.filter(function (v) { return /^ko/i.test(v.lang || ''); }), m = 0, f = 0, u = 0;
    var out = ko.map(function (v) { var g = VF.test(v.name) ? 'f' : VM.test(v.name) ? 'm' : '', nm = g === 'm' ? ['톰', '마이클', '제임스'][m++] : g === 'f' ? ['에밀리', '소피아', '그레이스'][f++] : ''; return { id: v.voiceURI || v.name, name: nm || '', g: nm ? g : '', v: v }; });
    out.forEach(function (x) { if (!x.name) x.name = '목소리 ' + (++u); });
    return out.sort(function (a, b) { var o = { m: 0, f: 1, '': 2 }; return o[a.g] - o[b.g]; });
  };
  function myVoice() { var id = store.get('lz.voice'), l = LZ.voiceList(); return l.filter(function (x) { return x.id === id; })[0] || l[0] || null; }
  LZ.speak = function (t, vid) {
    try {
      var u = new SpeechSynthesisUtterance(t), l = LZ.voiceList(), vo = vid ? l.filter(function (x) { return x.id === vid; })[0] : myVoice();
      u.lang = 'ko-KR'; u.rate = 0.92; if (vo) u.voice = vo.v; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { LZ.toast('이 휴대폰은 소리 읽기를 지원하지 않아요'); }
  };
  try { if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', function () { if ($('#vsheet')) LZ.act.voicePick(); }); } catch (e) { /* 무시 */ }
  function sayNowText() {
    var d = ED.d, i = ED.i, h = d.course.holes[i], r = ED.r;
    return LZ.sayText({ hole: i + 1, par: h[0], ref: r.r, t: r.t, d: r.d, n: r.n, p: ED.disp, o: r.o, none: ED.isNew && !ED.dirty });
  }
  LZ.act.sayNow = function () { if (!ED) return; LZ.speak(sayNowText()); };
  LZ.act.say = function () {
    if (store.get('lz.say') !== '1') { store.set('lz.say', '1'); $$('.top .snd').forEach(function (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }); LZ.toast('홀을 넘길 때마다 읽어 드려요 · 다시 누르면 한 번 더 · 끄기는 ◐에서', 4000); }
    LZ.act.sayNow();
  };
  LZ.act.sayTgl = function (el) { var on = store.get('lz.say') !== '1'; store.set('lz.say', on ? '1' : '0'); LZ.flip(el); $$('.top .snd').forEach(function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); LZ.toast(on ? '홀을 넘길 때마다 읽어 드려요' : '말해 주기를 껐어요'); };
  LZ.sayPopRows = function () { var v = myVoice(); return '<div class="tgl"><span>' + LZ.ic('sound') + ' 말해 주기</span>' + LZ.sw(store.get('lz.say') === '1', 'sayTgl') + '</div><button type="button" class="vsel" data-act="voicePick"><span>목소리</span><b>' + esc(v ? v.name : '휴대폰 기본') + '</b>' + LZ.ic('chev') + '</button>'; };
  LZ.act.voicePick = function () {
    var l = LZ.voiceList(), cur = myVoice();
    var html = '<div id="vsheet"><h2>말해 주기 목소리</h2><p class="muted">이 휴대폰에 들어 있는 한국어 목소리예요. 휴대폰마다 종류와 수가 달라요.</p>' +
      (l.length ? l.map(function (x) { var on = cur && cur.id === x.id; return '<div class="vrow"><button type="button" class="opt ' + (on ? 'on' : '') + '" data-act="voiceSet" data-v="' + esc(x.id) + '"><b>' + esc(x.name) + '</b><span>' + (x.g === 'm' ? '남자 목소리' : x.g === 'f' ? '여자 목소리' : '휴대폰 목소리') + (on ? ' · ✓ 지금' : '') + '</span></button><button type="button" class="sm2 g" data-act="voiceTry" data-v="' + esc(x.id) + '">미리 듣기</button></div>'; }).join('') :
        '<div class="box">한국어 목소리를 아직 찾지 못했어요. 잠시 뒤에 다시 열어 보시거나, 휴대폰 설정 → 손쉬운 사용(접근성) → 말하기(음성 출력)에서 한국어 목소리를 받아 주세요.</div>') + '</div>';
    if ($('#vsheet')) { $('#vsheet').outerHTML = html; } else LZ.sheet(html, { stack: true });
  };
  var SAMPLE = function () { return LZ.sayText({ hole: 3, par: 4, ref: 'c', d: 'L', n: 3, p: 24.6, o: '오르막' }); };
  LZ.act.voiceSet = function (el, id) { store.set('lz.voice', id); LZ.act.voicePick(); LZ.speak(SAMPLE(), id); var vp = $('#vpop .vsel b'); if (vp) vp.textContent = myVoice() ? myVoice().name : ''; };
  LZ.act.voiceTry = function (el, id) { LZ.speak(SAMPLE(), id); };

  /* ═════════ 코스 등록(#8 #10): 전반 → 후반, 내 기록도 같이 적기 ═════════ */
  var RG = null;
  function rgSug(j) { var r = RG.rows[j], m = parseFloat(r.m); return m > 0 ? LZ.sugOf(m, RG.g, RG.h) : null; }
  function rgP(j) { var r = RG.rows[j], s = rgSug(j); return s === null ? null : (r.p === null ? LZ.half(s) : r.p); }
  function parSeg(j, par) { return '<span class="pseg">' + LZ.parOpts(par).map(function (x) { return '<button type="button" class="' + (String(par) === x[0] ? 'on' : '') + '" data-act="regPar:' + j + '" data-v="' + x[0] + '" aria-label="파 ' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</span>'; }
  function rgRow(j) {
    var r = RG.rows[j], i = (RG.half ? 9 : 0) + j, s = rgSug(j);
    return '<div class="rgrow">' + LZ.hn(i + 1) + parSeg(j, r.par) + '<input type="text" inputmode="decimal" data-row="' + j + '" value="' + esc(r.m) + '" placeholder="거리" aria-label="' + (i + 1) + '홀 거리(m)"><span class="sug" id="sg' + j + '">' + (s === null ? '<span class="dim">—</span>' : (RG.rec ? '<em>기준</em>' : '') + LZ.bs(s, 'sm')) + '</span></div>';
  }
  function regRec(j) {
    var r = RG.rows[j], s = rgSug(j), p = rgP(j);
    if (!RG.rec || s === null) return '';
    var off = LZ.dvOf(p, s);
    return '<div class="rgr2"><div class="rgc"><div class="rgl"><em>내 좌우</em><span class="seg3 sm">' + [['f', '첫화면'], ['c', '홀컵'], ['u', '직접']].map(function (x) { return '<button type="button" class="' + (r.ref === x[0] ? 'on' : '') + '" data-act="regRef:' + j + '" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</span></div>' +
      '<div class="mini"><button type="button" class="stp sm l" data-act="regLr:' + j + '" data-v="-1" aria-label="왼쪽">◀</button><b class="lrm">' + LZ.lrTxt({ d: r.lr < 0 ? 'L' : 'R', n: Math.abs(r.lr) }) + '</b><button type="button" class="stp sm r" data-act="regLr:' + j + '" data-v="1" aria-label="오른쪽">▶</button></div>' +
      (r.ref === 'u' ? '<input type="text" class="rgt" data-t="' + j + '" maxlength="10" placeholder="어디에 놓았나요? (10자)" value="' + esc(r.t) + '">' : '') + '</div>' +
      '<div class="rgc"><div class="rgl"><em>내 볼스피드</em>' + LZ.dv(p, s) + '</div><div class="mini"><button type="button" class="stp sm" data-act="regP:' + j + '" data-v="-0.5" aria-label="0.5 줄이기">−</button>' + LZ.bs(p, 'sm') + '<button type="button" class="stp sm" data-act="regP:' + j + '" data-v="0.5" aria-label="0.5 늘리기">+</button></div></div></div>' +
      (off ? '<div class="why"><label class="warn">기준보다 1 넘게 달라요 · 사유(선택, 20자)</label><input type="text" data-o="' + j + '" maxlength="20" placeholder="예: 오르막, 그린 뒤 OB" value="' + esc(r.o) + '"></div>' :
        r.noteOpen || r.o ? '<div class="why soft"><label>참고사항(선택, 20자)</label><input type="text" data-o="' + j + '" maxlength="20" placeholder="예: 바람 오른쪽" value="' + esc(r.o) + '"></div>' :
        '<button type="button" class="lnk notel" data-act="regNote:' + j + '">' + LZ.ic('note') + '참고사항 적기 <span class="muted">(선택)</span></button>');
  }
  function regSumText() {
    var sum = RG.rows.reduce(function (a, r) { return a + r.par; }, 0), dist = LZ.r1(RG.rows.reduce(function (a, r) { return a + (parseFloat(r.m) > 0 ? parseFloat(r.m) : 0); }, 0)), got = RG.rows.filter(function (r) { return parseFloat(r.m) > 0; }).length;
    return '파 ' + sum + (sum === 33 ? ' ✓' : ' (보통 33)') + ' · ' + LZ.fmtM(dist) + 'm' + (RG.rec ? ' · ' + got + '/9홀 적음' : '');
  }
  function regPaint(root) {
    var half = RG.half, title = half ? '후반 9홀 등록' : '새 코스 등록', mini = !half && RG.rec && !RG.infoOpen && RG.name;
    root.innerHTML = LZ.hdr(title, { back: true }) + '<div class="wrap reg2">' +
      (half ? '<div class="card tight"><b>' + esc(RG.name) + '</b><div class="muted">전반은 저장됐어요. 후반 9홀(10~18홀)을 넣어 주세요.</div></div>' :
        mini ? '<div class="card rgmini"><div class="t"><b>' + esc(RG.name) + '</b><div class="su">★' + RG.stars + ' · ' + LZ.MODE[RG.g] + ' · ' + LZ.HL[RG.h] + '</div></div><button type="button" class="lnk" data-act="rgInfo">' + LZ.ic('edit') + '고치기</button></div>' :
        '<div class="card rginfo"><label class="lb" for="rgName" style="margin-top:0">코스 이름 <span class="muted">· 스크린에 나오는 이름 그대로</span></label><input type="text" id="rgName" maxlength="30" value="' + esc(RG.name) + '" placeholder="예: 화천AB">' +
        '<label class="lb">난이도</label>' + LZ.seg([['1', '★1'], ['2', '★2'], ['3', '★3'], ['4', '★4'], ['5', '★5']], String(RG.stars), 'regStars', 'star s') +
        '<label class="lb">게임 모드 <span class="muted">· 기계에서 고른 모드</span></label>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], RG.g, 'regG', 's') +
        '<label class="lb">센서 탄도 <span class="muted">· 이 매장 센서 설정</span></label>' + LZ.seg(LZ.HLSEG, RG.h, 'regH', 'hl s hl5') +
        '<p class="hint rgnote">' + LZ.ic('bulb') + '수첩에는 이 기준으로 적혀요. 다른 모드·매장에서는 같은 거리가 나오는 볼스피드로 바꿔 보여 드려요.</p></div>') +
      '<div class="card tgl rgtgl"><span><b>내 기록도 같이 적기</b><span class="muted">평균(없으면 기준)이 미리 들어 있어요</span></span>' + LZ.sw(RG.rec, 'regRecTgl') + '</div>' +
      '<div class="card rgholes"><div class="rgh"><b>' + (half ? '후반 9홀' : '전반 9홀') + '</b><span class="su" id="regSum">' + regSumText() + '</span></div>' +
      (RG.rec ? '' : '<div class="rgrow head"><span>홀</span><span>파</span><span>거리 m</span><span>기준 볼스피드</span></div>') +
      RG.rows.map(function (r, j) { return RG.rec ? '<div class="hb rgb' + (j % 2 ? ' z' : '') + '">' + rgRow(j) + '<div id="rr' + j + '">' + regRec(j) + '</div></div>' : '<div class="rgz' + (j % 2 ? ' z' : '') + '">' + rgRow(j) + '</div>'; }).join('') + '</div>' +
      '<p class="hint">파는 1~4홀 3, 5~8홀 4, 9홀 5로 미리 채워져 있어요. 한 홀을 바꾸면 다른 홀이 따라 바뀌어 33을 지켜요. 등록하는 동안 화면이 꺼지지 않아요.</p><button type="button" class="btn" data-act="regSave">' + (half ? '후반 저장하고 등록 마치기 ›' : '전반 저장하고 후반으로 ›') + '</button></div>';
    root.oninput = function (e) {
      var t = e.target;
      if (t.dataset.row !== undefined) { var j = +t.dataset.row; RG.rows[j].m = t.value; RG.rows[j].p = null; var s = rgSug(j); $('#sg' + j).innerHTML = s === null ? '<span class="dim">—</span>' : (RG.rec ? '<em>기준</em>' : '') + LZ.bs(s, 'sm'); var rr = $('#rr' + j); if (rr) rr.innerHTML = regRec(j); var sm = $('#regSum'); if (sm) sm.textContent = regSumText(); }
      else if (t.dataset.t !== undefined) RG.rows[+t.dataset.t].t = t.value;
      else if (t.dataset.o !== undefined) RG.rows[+t.dataset.o].o = t.value;
      else if (t.id === 'rgName') RG.name = t.value;
    };
    LZ.guard = { dirty: function () { return RG.rows.some(function (r) { return r.m; }) && !RG.saved; }, ask: async function () { return LZ.confirm('나갈까요?', '적던 내용이 사라져요.', '나가기', 'r'); } };
  }
  function newRows(pars) { return pars.map(function (par) { return { par: par, m: '', lr: 0, p: null, ref: 'f', t: '', o: '', noteOpen: false }; }); }
  LZ.screens.reg = {
    tab: 'courses', wake: true,
    show: function (p, root) {
      if (!RG || p.id !== RG.id || RG.saved) { var bm0 = p.id && CUR.d && CUR.id === p.id && CUR.d.mode; RG = { id: p.id || '', name: p.name || '', stars: 3, g: bm0 ? bm0.g : 'p', h: bm0 ? bm0.h : 'm', rec: false, half: p.half || 0, rows: newRows([3, 3, 3, 3, 4, 4, 4, 4, 5]), saved: false, infoOpen: false }; }
      regPaint(root);
    }
  };
  function regRe() { var y = window.scrollY; regPaint($('#app')); window.scrollTo(0, y); }
  LZ.act.regStars = function (el, v) { RG.stars = +v; regRe(); };
  LZ.act.regG = function (el, v) { RG.g = v; RG.rows.forEach(function (r) { r.p = null; }); regRe(); };
  LZ.act.regH = function (el, v) { RG.h = v; RG.rows.forEach(function (r) { r.p = null; }); regRe(); };
  LZ.act.rgInfo = function () { RG.infoOpen = true; regRe(); };
  LZ.act.regRecTgl = function () { RG.rec = !RG.rec; if (RG.rec) RG.infoOpen = !RG.name; regRe(); };
  /* 파 연쇄 맞춤(필드 구장과 같음): j홀을 a→b로 바꾸면 뒤 홀부터 b, b-1… 파인 첫 홀을 한 단계 내려 9홀 기준 33을 지킴 */
  function regCascade(j, a, b) {
    var pars = RG.rows.map(function (r) { return r.par; }), dir = b > a ? -1 : 1, v = b;
    while (v !== a) {
      var k = -1; for (var i = j + 1; i < 9; i++) if (pars[i] === v) { k = i; break; } if (k < 0) for (var q = 0; q < j; q++) if (pars[q] === v) { k = q; break; }
      if (k < 0) break; pars[k] = v + dir; v = v + dir;
    }
    RG.rows.forEach(function (r, i) { r.par = pars[i]; });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (!a || !RG) return; var m = /^reg(Par|Ref|Lr|P|Note):(\d+)$/.exec(a.dataset.act); if (!m) return;
    e.preventDefault(); var j = +m[2], r = RG.rows[j], v = a.dataset.v;
    if (m[1] === 'Par') { var a0 = r.par, b0 = +v; if (a0 !== b0) { r.par = b0; regCascade(j, a0, b0); } }
    else if (m[1] === 'Ref') r.ref = v; else if (m[1] === 'Lr') r.lr = Math.max(-10, Math.min(10, r.lr + (+v))); else if (m[1] === 'Note') r.noteOpen = true;
    else { var x = rgP(j), st = +v; if (x === null) return; r.p = LZ.clampP(st > 0 ? Math.floor(x * 2 + 1e-6) / 2 + 0.5 : Math.ceil(x * 2 - 1e-6) / 2 - 0.5); }
    LZ.buzz();
    if (m[1] === 'Par') { RG.rows.forEach(function (row, k) { $$('[data-act="regPar:' + k + '"]').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === row.par); }); }); var sm = $('#regSum'); if (sm) sm.textContent = regSumText(); }
    else { var rr = $('#rr' + j); if (rr) { rr.innerHTML = regRec(j); if (m[1] === 'Note' || (m[1] === 'Ref' && v === 'u')) { var f = rr.querySelector(m[1] === 'Note' ? '[data-o]' : '[data-t]'); if (f) f.focus(); } } }
  });
  LZ.act.regSave = async function () {
    var holes = [], recs = [];
    if (!RG.half && !String(RG.name || '').trim()) { RG.infoOpen = true; regRe(); LZ.toast('코스 이름을 넣어 주세요'); var nm = $('#rgName'); if (nm) nm.focus(); return; }
    for (var j = 0; j < 9; j++) { var r = RG.rows[j], m = parseFloat(r.m); if (!(m > 0)) { LZ.toast((RG.half ? 10 + j : j + 1) + '홀 거리를 넣어 주세요'); return; } holes.push([r.par, m]); recs.push(RG.rec ? { r: r.ref, t: r.t, d: r.lr < 0 ? 'L' : 'R', n: Math.abs(r.lr), p: rgP(j), o: r.o || '' } : null); }
    var psum = RG.rows.reduce(function (a, r) { return a + r.par; }, 0);
    if (psum !== 33 && !(await LZ.confirm('파 합이 33이 아니에요 (' + psum + ')', '파3이나 파5가 하나 더 있는 코스면 맞아요. 이대로 저장할까요?', '이대로 저장'))) return;
    LZ.busy(true, '저장 중…');
    try {
      if (!RG.half) {
        var f = await LZ.api('regFront', { name: RG.name, holes: holes, stars: RG.stars, g: RG.g, h: RG.h, recs: RG.rec ? recs : undefined, confirm: RG.confirm ? 1 : 0 }, { retry: 0 });
        LZ.busy(false); RG = { id: f.id, name: f.name, stars: RG.stars, g: RG.g, h: RG.h, rec: RG.rec, half: 1, rows: newRows([3, 3, 3, 3, 4, 4, 4, 4, 5]), saved: false };
        LZ.toast('전반을 저장했어요. 후반을 이어서 넣어 주세요' + (f.pts ? ' · 적립 포인트 +' + f.pts + 'P' : ''), f.pts ? 4000 : 2500); LZ.go('reg', { id: f.id, half: 1 }, { replace: true, skipGuard: true });
      } else {
        var bk = await LZ.api('regBack', { id: RG.id, holes: holes, recs: RG.rec ? recs : undefined, vg: RG.g, vh: RG.h }, { retry: 0 });
        LZ.busy(false); RG.saved = true; LZ.toast('코스 등록을 마쳤어요' + (bk.switched ? ' · 기록 기준을 ' + LZ.modeTxt(bk.switched.to) + LZ.ro(LZ.HL[bk.switched.to.h]) + ' 바꿔 저장했어요' : '') + (bk.pts ? ' · 적립 포인트 +' + bk.pts + 'P' : ''), bk.pts || bk.switched ? 4500 : 2500); CUR.id = ''; CUR.key = ''; LZ.go('holes', { id: RG.id, fresh: 1 }, { replace: true, skipGuard: true });
      }
    } catch (e) {
      LZ.busy(false);
      if ((e.code === 'similar' || e.code === 'suggest') && e.data) { var v = await LZ.dialog({ title: e.message, cancel: false, buttons: [{ label: e.code === 'suggest' ? '"' + e.data.suggest + '"로 등록' : '다른 조합이 맞아요, 등록', kind: 'y', value: 'go' }, { label: e.data.name + ' 열기', kind: 'o', value: 'open' }, { label: '취소', kind: 'g', value: false }] }); if (v === 'go') { if (e.code === 'suggest') RG.name = e.data.suggest; RG.confirm = 1; LZ.act.regSave(); } else if (v === 'open') { RG.saved = true; LZ.go('holes', { id: e.data.id }, { skipGuard: true }); } return; }
      if (e.code === 'dup' && e.data) { if (await LZ.confirm(e.message, '', '그 코스 열기')) { RG.saved = true; LZ.go('holes', { id: e.data.id }, { skipGuard: true }); } return; }
      LZ.toast(LZ.errText(e), 5000);
    }
  };

  /* ═════════ 코스 정보 고치기 ═════════ */
  LZ.screens.courseEdit = {
    tab: 'courses',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('코스 정보', { back: true }) + LZ.skeleton(5);
      var d = await loadCourse(p.id, true); if (!alive()) return; var c = d.course;
      root.innerHTML = LZ.hdr('코스 정보 고치기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">코스 이름</label><input type="text" id="ceName" maxlength="30" value="' + esc(c.name) + '"' + (c.canEdit ? '' : ' disabled') + '><label class="lb">난이도 <span class="muted" style="font-weight:400">— 스크린 해당 코스의 난이도를 그대로 선택</span></label>' + LZ.seg([['1', '★1'], ['2', '★2'], ['3', '★3'], ['4', '★4'], ['5', '★5']], String(c.stars), 'ceStars', 'star s') + '<input type="hidden" id="ceStars" value="' + c.stars + '">' +
        (d.mode ? '<label class="lb">이 코스의 내 기록 기준(게임 모드·센서 탄도)</label><p class="muted" style="margin:0 0 6px">바꾸면 이 코스의 내 기록을 같은 거리가 되도록 환산해요. 오늘만 다르게 볼 때는 코스 화면 위에서 고르세요(그 기준으로 치기 화면에서 고쳐 저장하면 기록 기준도 그 기준으로 바뀌어요).</p>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], d.mode.g, 'ceG', 's') + '<div style="height:6px"></div>' + LZ.seg(LZ.HLSEG, d.mode.h, 'ceH', 'hl s hl5') + '<input type="hidden" id="ceG" value="' + d.mode.g + '"><input type="hidden" id="ceH" value="' + d.mode.h + '">' : '') + '</div>' +
        '<div class="card"><h3>홀별 파·거리</h3>' + c.holes.slice(0, nOf(c)).map(function (h, i) { return '<div class="frow">' + LZ.hn(i + 1) + LZ.seg(LZ.parOpts(h[0]), String(h[0]), 'cePar:' + i, 's par') + '<input type="text" inputmode="decimal" data-ch="' + i + '" value="' + h[1] + '" class="cem"' + (c.canEdit ? '' : ' disabled') + ' aria-label="' + (i + 1) + '홀 거리"></div>'; }).join('') + '</div>' +
        (c.canEdit ? '<button type="button" class="btn" data-act="ceSave">저장</button>' : '<p class="hint center">코스 정보는 이용 중인 회원님만 고칠 수 있어요.</p>') +
        '<div class="card"><h3>수정 이력</h3>' + (c.edits && c.edits.length ? c.edits.map(function (e) { return '<div class="muted" style="padding:4px 0;border-bottom:1px solid var(--line)">' + LZ.fmtDate(e.at, true) + ' · <b>' + LZ.nimE(e.nick) + '</b> · ' + esc(e.what) + '</div>'; }).join('') : '<p class="muted" style="margin:0">아직 고친 적이 없어요.</p>') + '</div>' +
        (S.user.kind === 'admin' ? '<button type="button" class="btn g" data-act="ceDel">코스 지우기(관리자)</button>' : '') + '</div>';
      CUR.pars = c.holes.map(function (h) { return h[0]; });
    }
  };
  LZ.act.ceStars = function (el, v) { $('#ceStars').value = v; $$('[data-act="ceStars"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.ceG = function (el, v) { $('#ceG').value = v; $$('[data-act="ceG"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  LZ.act.ceH = function (el, v) { $('#ceH').value = v; $$('[data-act="ceH"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-act^="cePar:"]'); if (!a || !CUR.pars) return; e.preventDefault(); var i = +a.dataset.act.split(':')[1]; CUR.pars[i] = +a.dataset.v; $$('[data-act="cePar:' + i + '"]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === a.dataset.v); }); });
  LZ.act.ceSave = async function () {
    var d = CUR.d, c = d.course, holes = c.holes.map(function (h, i) { var el = $('[data-ch="' + i + '"]'); return [CUR.pars[i], el ? (parseFloat(el.value) || h[1]) : h[1]]; });
    LZ.busy(true, '저장 중…');
    try {
      var body = { id: c.id, name: $('#ceName').value, stars: +$('#ceStars').value, front: holes.slice(0, 9) }; if (c.stage === 'done') body.back = holes.slice(9);
      var ec = await LZ.api('editCourse', body, { retry: 0 });
      if (d.mode && ($('#ceG').value !== d.mode.g || $('#ceH').value !== d.mode.h)) { var r = await LZ.api('courseMode', { id: c.id, g: $('#ceG').value, h: $('#ceH').value }); store.del('lz.view.' + c.id); LZ.toast('기록 ' + r.converted + '개를 새 기준으로 환산했어요'); }
      LZ.busy(false); CUR.id = ''; CUR.key = ''; LZ.toast('저장했어요' + (ec && ec.pts ? ' · 적립 포인트 +' + ec.pts + 'P' : ''), ec && ec.pts ? 4000 : 2500); LZ.go('holes', { id: c.id, fresh: 1 }, { replace: true });
    } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.ceDel = async function () { var c = CUR.d.course; if (!(await LZ.confirm('이 코스를 지울까요?', '모든 회원님의 이 코스 기록도 함께 지워져요. 되돌릴 수 없어요.', '지우기', 'r'))) return; try { await LZ.api('delCourse', { id: c.id }); CUR.id = ''; CUR.key = ''; LZ.go('courses', {}, { reset: true }); LZ.toast('지웠어요'); } catch (e) { LZ.toast(LZ.errText(e), 4500); } };
})();
