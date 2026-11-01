/* 스크린 공략(v8 단계 B): 내 수첩 목록 · 코스 화면(한 격자·1st/2nd·비교 끔 기본·끊어가기·주의 고치기) · 플레이(고정 조정 칸·홀 안내) · 쉬는/끝 화면 · 코스 등록(주의·끊어) · 코스 정보 고치기 */
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
      if (LZ.admTab(p, root, '내 수첩')) return;
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
        /* v8.1 설계안 R.list: 위 막대 ＋(새 코스) · 🔍(누르면 찾기 칸) · 본문은 보기 4칸 + "정렬 ▾" 하나(거꾸로 순서도 그 창에서) */
        var srch = CQ_OPEN || !!q, sortName = SORTS.filter(function (x) { return x[0] === sort; })[0][1];
        root.innerHTML = LZ.hdr('내 수첩', { btns: (r.canReg ? '<button type="button" class="tb" data-go="reg" aria-label="새 코스 등록" title="새 코스 등록">' + LZ.ic('plus') + '</button>' : '') + '<button type="button" class="tb' + (srch ? ' on' : '') + '" data-act="cSrch" aria-label="코스 찾기" aria-expanded="' + srch + '" title="코스 찾기">' + LZ.ic('search') + '</button>' }) + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap clist">' + (LZ.admNote ? LZ.admNote('홀 기록(내 수첩)·클럽 가입·라운드 기록') : '') +
          '<div class="flt" role="tablist">' + FLT.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (flt === x[0]) + '" class="' + (flt === x[0] ? 'on' : '') + '" data-act="cFlt" data-v="' + x[0] + '">' + x[1] + ' <b>' + cnt[x[0]] + '</b></button>'; }).join('') + '</div>' +
          '<div class="csort2"><button type="button" class="chip sortc" data-act="cSort" aria-label="정렬 · 지금 ' + sortName + '"><span class="lb">정렬</span><b>' + sortName + '</b>' + LZ.ic('down') + '</button></div>' +
          (srch ? '<div class="csrch"><input type="search" id="cq" value="' + esc(store.get('lz.cq') || '') + '" placeholder="코스 이름" aria-label="코스 이름 찾기"></div>' : '') +
          (list.length ? list.map(cCard).join('') : '<div class="empty">' + (all.length ? '고른 조건에 맞는 코스가 없어요.' : '아직 코스가 없어요. 첫 코스를 등록해 보세요.') + '</div>') + '</div>';
        LZ.paintSync();
        var cq = $('#cq'), filt = function () { var v = cq.value.toLowerCase(); store.set('lz.cq', cq.value); $$('.ccard', root).forEach(function (b) { b.hidden = !!v && b.querySelector('.ct b').textContent.toLowerCase().indexOf(v) < 0; }); };
        if (cq) { cq.addEventListener('input', filt); if (q) filt(); }
      }
    }
  };
  LZ.act.openC = function (el, id) { LZ.go('holes', { id: id }); };
  LZ.act.cFlt = function (el, v) { store.set('lz.cflt', v); LZ.redraw(); };
  LZ.act.cSort = function () { var cur = store.get('lz.csort') || 'new'; if (!SORT_REV[cur]) cur = 'new'; LZ.sheet('<h2>정렬</h2><p class="muted" style="margin-top:0">위아래 두 개씩 짝이에요(거꾸로 순서).</p>' + SORTS.map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="cSortSet" data-v="' + x[0] + '"><b>' + x[1] + '</b>' + (cur === x[0] ? '<span>' + LZ.ic('check') + ' 지금</span>' : '') + '</button>'; }).join('') + '<button type="button" class="opt" data-act="cSortSet" data-rev="1" data-v="' + SORT_REV[cur] + '"><b>' + LZ.ic('sort') + ' 지금 순서를 거꾸로</b><span>' + SORTS.filter(function (x) { return x[0] === SORT_REV[cur]; })[0][1] + '</span></button>'); };
  var CQ_OPEN = false;
  /* 🔍: 다시 그리지 않고 찾기 칸만 열고 닫아요(누른 그 순간에 글자판이 뜨게) */
  LZ.act.cSrch = function (el) {
    var box = $('.csrch'), on = !box; CQ_OPEN = on; el.setAttribute('aria-expanded', on ? 'true' : 'false'); el.classList.toggle('on', on);
    if (!on) { box.parentNode.removeChild(box); store.set('lz.cq', ''); $$('.ccard').forEach(function (b) { b.hidden = false; }); return; }
    var w = document.createElement('div'); w.className = 'csrch'; w.innerHTML = '<input type="search" id="cq" placeholder="코스 이름" aria-label="코스 이름 찾기">';
    var at = $('.csort2'); at.parentNode.insertBefore(w, at.nextSibling);
    var cq = $('#cq'); cq.addEventListener('input', function () { var v = cq.value.toLowerCase(); store.set('lz.cq', cq.value); $$('.ccard').forEach(function (b) { b.hidden = !!v && b.querySelector('.ct b').textContent.toLowerCase().indexOf(v) < 0; }); }); cq.focus();
  };
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

  /* ═════════ v8 공통: 끊어가기·주의(코스에 하나) · 한 격자 줄 ═════════ */
  function layAt(c, i) { var L = +((c.lay || [])[i]) || 0, hm = +(c.holes[i] && c.holes[i][1]) || 0; return L > 0 && L < hm ? L : 0; }
  function slAt(c, i) { var s = (c.slope || [])[i]; return s === 'up' || s === 'down' ? s : ''; }
  function shotDist(c, i, k) { var hm = +c.holes[i][1], L = layAt(c, i); return !L ? hm : k ? LZ.r1(hm - L) : L; }
  function baseOf(c, i, k, v) { return LZ.sugOf(shotDist(c, i, k), v.g, v.h); }
  LZ.layAt = layAt; LZ.slAt = slAt;
  function bar9(v, cls) { var b = LZ.bsParts(v); return '<span class="bar9 ' + (cls || '') + '" aria-hidden="true"><span class="bl">' + b.lo + '</span><span class="bt"><i style="left:' + b.pos + '%"></i></span><span class="bh">' + b.hi + '</span></span>'; }
  /** 기준과 차이: 1 이내 ● · 주의가 있으면 "크게 +1.5"(설명된 차이) · 없으면 ▲▼ */
  function dTxt(p, s, sl) { var d = LZ.dvOf(p, s); if (!d) return '<span class="okd" aria-label="기준과 1 이내">●</span>'; return '<span class="dvt">' + (sl ? (sl === 'up' ? '크게 ' : '작게 ') + (d > 0 ? '+' : '−') : (d > 0 ? '▲' : '▼')) + LZ.fmtP(Math.abs(d)) + '</span>'; }
  function slTag(sl) { return sl === 'up' ? '오르막 · 크게' : sl === 'down' ? '내리막 · 작게' : '보통'; }
  function distH(c, i) { var sl = slAt(c, i); return '<span class="dm' + (sl ? ' ' + (sl === 'up' ? 'up' : 'dn') : '') + '">' + LZ.fmtM(c.holes[i][1]) + 'm' + (sl ? (sl === 'up' ? '↑' : '↓') : '') + '</span>'; }
  /** 참고 글: **낱말** 은 굵게, 자주 쓰는 낱말은 저절로 굵게 */
  var KWS = /(오르막|내리막|맞바람|뒷바람|바람|OB|벙커|해저드|그린|나무|벽|세게|약하게|크게|작게|반 칸|한 칸|두 칸)/g;
  function hiNote(t) { return String(t || '').split('**').map(function (x, k) { return k % 2 ? '<b>' + esc(x) + '</b>' : esc(x).replace(KWS, '<b>$1</b>'); }).join(''); }
  LZ.hiNote = hiNote;
  function cmpTxt(lr, p) { return LZ.lrPlain({ d: lr < 0 ? 'L' : 'R', n: Math.abs(lr) }) + ' · ' + LZ.bsTxt(p); }
  function lrOf(x) { return (x.d === 'L' ? -1 : 1) * (x.n | 0); }
  function shotVals(rec, shot, base, sl, v) {
    if (!shot) return { dir: '아직 없음', bs: LZ.bsTxt(base), v: base, dim: 1, ref: '기준 ' + LZ.bsTxt(base), bar: bar9(base, 'c-bar') };
    var mv = LZ.conv(shot.p, rec.g, rec.h, v.g, v.h);
    return { dir: esc(LZ.refTxt(shot)) + ' ' + LZ.lrTxt(shot), bs: LZ.bsTxt(mv), v: mv, ref: '기준 ' + LZ.bsTxt(base) + ' ' + dTxt(mv, base, sl), bar: bar9(mv, 'c-bar') };
  }
  function cells(x, cmp) {
    return '<span class="g3 l1 c-dir' + (x.dim ? ' dimx' : '') + '"><span class="fit3">' + x.dir + '</span></span><span class="g4 l1 c-bs' + (x.dim ? ' dimx' : '') + '" data-bs="' + x.v + '">' + x.bs + '</span>' +
      '<span class="g3 l2 c-ref"><span class="fit3">' + x.ref + '</span></span><span class="g4 l2">' + x.bar + '</span>' + (cmp ? '<span class="g34 l3 c-cmp">' + cmp + '</span>' : '');
  }
  /** 비교 줄(클럽 평균·회원): { one: 한 번에 홀 글, s: [1st 글, 2nd 글], all: 끊어 홀인데 다른 쪽이 한 번에 친 경우 글 } */
  function cmpOf(d, i, v, mode) {
    if (mode === 'off') return null;
    var c = d.course, L = layAt(c, i), tk = function (t) { return '<span class="tk" data-act="cmpTake" data-v="' + i + '" role="button" tabindex="0" aria-label="' + (i + 1) + '홀에 가져오기">' + t + '</span>'; };
    if (mode === 'avg') {
      var a = d.avg && d.avg[i], nm = '클럽 평균', one = a && !a.none ? nm + ' ' + cmpTxt(a.lr, LZ.sugOf(a.m, v.g, v.h)) : '';
      if (!L) return { one: one ? tk(one) : nm + ' 없음' };
      if (a && a.s) return { s: [tk(nm + ' ' + cmpTxt(a.s[0].lr, LZ.sugOf(a.s[0].m, v.g, v.h))), tk(nm + ' ' + cmpTxt(a.s[1].lr, LZ.sugOf(a.s[1].m, v.g, v.h)))] };
      return { all: one ? tk(nm + ' · 한 번에 ' + cmpTxt(a.lr, LZ.sugOf(a.m, v.g, v.h))) : nm + ' 없음' };
    }
    var pk = d.pick, o = pk && pk.recs[i], nk = pk ? pk.nick : '클럽 회원';
    if (!o || !o.r) return L ? { all: pk ? esc(nk) + ' 기록 없음' : '공개한 회원 없음' } : { one: pk ? esc(nk) + ' 기록 없음' : '공개한 회원 없음' };
    var p1 = LZ.conv(o.p, o.g, o.h, v.g, v.h);
    if (!L) return { one: tk(esc(nk) + ' ' + cmpTxt(lrOf(o), p1)) };
    if (o.s2) return { s: [tk(esc(nk) + ' ' + cmpTxt(lrOf(o), p1)), tk(esc(nk) + ' ' + cmpTxt(lrOf(o.s2), LZ.conv(o.s2.p, o.g, o.h, v.g, v.h)))] };
    return { all: tk(esc(nk) + ' · 한 번에 ' + cmpTxt(lrOf(o), p1)) };
  }
  /** 홀 한 칸(코스·쉬는/끝 화면 같은 모양): 홀 | 거리·파 | 방향·좌우 / 기준 | 볼스피드 / 막대, 끊어 홀은 1st(모래)·2nd(민트) 줄 */
  function holeRow(d, i, v, mode, o) {
    o = o || {};
    var c = d.course, h = c.holes[i], r = d.mine[i], L = layAt(c, i), sl = slAt(c, i), ed = !o.ro && EDIT === c.id, cm = cmpOf(d, i, v, mode) || {};
    var act = ' data-act="' + (o.act || 'hHole') + '" data-v="' + i + '" role="button" tabindex="0"';
    var nt = r.r && r.o ? '<span class="ntb" role="button" tabindex="0" data-act="cNote" data-v="' + i + '" aria-expanded="' + (NOTE === i) + '" aria-label="' + (i + 1) + '홀 참고 ' + (NOTE === i ? '닫기' : '보기') + '">' + LZ.ic('notef', 'nt') + '</span>' : '';
    var head = '<div class="crow2"' + act + ' aria-label="' + (i + 1) + '홀 플레이"><span class="g1 l1">' + LZ.hn(i + 1) + '</span><span class="g2 l1 c-dist">' + distH(c, i) + '</span>' +
      '<span class="g1 l2">' + (ed ? '<button type="button" class="lchip" data-act="cLay" data-v="' + i + '" aria-label="' + (i + 1) + '홀 끊어가기 ' + (L ? '끄기' : '켜기') + '">' + (L ? '끊어 ×' : '끊어 +') + '</button>' : '') + '</span><span class="g2 l2 c-par">파 ' + h[0] + (L ? '' : nt) + '</span>' +
      (ed ? '<span class="g12 l3"><button type="button" class="lchip" data-act="cSlope" data-v="' + i + '" aria-label="' + (i + 1) + '홀 주의 바꾸기">주의 · ' + slTag(sl) + ' ▾</button></span>' : '');
    var extra = (o.note ? '<div class="cnote">' + o.note + '</div>' : '') + (r.chg && !o.ro ? '<div class="cnote chg">기준 바뀜 · 예전 값은 플레이 › 참고 ▾</div>' : '') + (NOTE === i && r.o ? '<div class="cnote open">참고 · ' + hiNote(r.o) + '</div>' : '');
    if (!L) return '<div class="hb' + (r.r ? '' : ' e') + '">' + head + cells(shotVals(r, r.r ? r : null, baseOf(c, i, 0, v), sl, v), cm.one || '') + '</div>' + extra + '</div>';
    var two = r.r && r.s2, s = cm.s || ['', ''];
    var s1 = '<div class="crow2 sub s1"' + act + ' aria-label="' + (i + 1) + '홀 1st"><span class="g12 l1 c-lab"><span class="shb">1st</span>' + LZ.fmtM(L) + 'm' + nt + '</span>' +
      (ed ? '<span class="g12 l2 lstep"><button type="button" class="stp" data-act="cLayStep" data-v="' + i + '|-1" aria-label="끊는 거리 1m 줄이기">' + LZ.ic('td') + '</button><button type="button" class="stp" data-act="cLayStep" data-v="' + i + '|1" aria-label="끊는 거리 1m 늘리기">' + LZ.ic('tu') + '</button></span>' : '') +
      cells(shotVals(r, two ? r : null, baseOf(c, i, 0, v), sl, v), s[0]) + '</div>';
    var s2 = '<div class="crow2 sub s2"' + act + ' aria-label="' + (i + 1) + '홀 2nd"><span class="g12 l1 c-lab"><span class="shb">2nd</span>' + LZ.fmtM(shotDist(c, i, 1)) + 'm</span>' +
      cells(shotVals(r, two ? r.s2 : null, baseOf(c, i, 1, v), sl, v), s[1]) + '</div>';
    return '<div class="hb lay' + (r.r ? '' : ' e') + '">' + head + '</div><div class="subs">' + s1 + s2 + (cm.all ? '<div class="c3x">' + cm.all + '</div>' : '') + '</div>' + extra + '</div>';
  }

  /* ═════════ 코스 화면(v8) ═════════ */
  var EDIT = '', NOTE = -1;
  function fixRecs(d) { if (!d.mine || !d.mine.length) d.mine = []; for (var i = 0; i < 18; i++) d.mine[i] = d.mine[i] || emptyRec(); if (!d.authors) d.authors = []; if (!d.clubs) d.clubs = []; if (!d.cmp) d.cmp = { id: '', name: '', n: 0 }; if (d.pub === undefined) d.pub = 1; if (d.course && !d.course.lay) d.course.lay = []; if (d.course && !d.course.slope) d.course.slope = []; return d; }
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
  /** v8 비교는 기본 끔 */
  function cmpMode(d) { if (!d.clubs.length || !d.cmp.id) return 'off'; var m = store.get('lz.cmpMode') || 'off'; return /^(avg|mem|off)$/.test(m) ? m : 'off'; }
  function playAt(d) {
    var n = nOf(d.course), v = parseInt(store.get('lz.playAt.' + d.course.id), 10);
    if (v > 0 && v < n) return v;
    var f = d.mine.slice(0, n).filter(function (r) { return r.r; }).length; if (f > 0 && f < n) for (var i = 0; i < n; i++) if (!d.mine[i].r) return i;
    return 0;
  }
  function coursePage(d) {
    var c = d.course, v = viewOf(d), bm = basisOf(d), n = nOf(c), hs = c.holes.slice(0, n);
    var parSum = hs.reduce(function (a, h) { return a + (+h[0] || 0); }, 0), mSum = LZ.r1(hs.reduce(function (a, h) { return a + (+h[1] || 0); }, 0));
    var mode = cmpMode(d), half = n === 18 ? (store.get('lz.half2.' + c.id) || 'f') : 'a', a = half === 'b' ? 9 : 0, b = half === 'f' ? 9 : n, start = playAt(d);
    var diff = v.g !== bm.g || v.h !== bm.h, filled = d.mine.slice(0, n).filter(function (r) { return r.r; }).length, ed = EDIT === c.id;
    var cmpName = mode === 'avg' ? '클럽 평균' : mode === 'mem' ? (d.pick ? d.pick.nick : '클럽 회원') : '끔';
    var empt = 0; if (mode === 'mem' && d.pick) d.pick.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) empt++; });
    var list = ''; for (var i = a; i < b; i++) list += holeRow(d, i, v, mode);
    var more = '<button type="button" class="tb" data-act="cMore" aria-label="더보기" title="더보기">' + LZ.ic('more') + '</button>';
    return LZ.hdr('코스', { back: true, bar: '코스', btns: more }) + '<div class="wrap cpage v8c">' +
      '<h1 class="ctitle">' + esc(c.name) + '</h1>' +
      '<div class="cinfo"><span>' + LZ.stars(c.stars) + ' ' + n + '홀 · 파 ' + parSum + ' · ' + mSum.toLocaleString() + 'm · ' + filled + '/' + n + '</span>' +
      '<button type="button" class="pubc" data-act="hPubSheet" aria-label="공개 바꾸기 · 지금 ' + (d.pub ? '공개' : '비공개') + '">' + LZ.ic(d.pub ? 'unlock' : 'lock') + (d.pub ? '공개' : '비공개') + LZ.ic('down') + '</button>' +
      LZ.kw('', '공개면 클럽 회원이 내 기록을 평균·비교에 써요. 비공개면 나만 봐요. 등록 ' + esc(c.reg || '') + ' ' + LZ.fmtDate(c.created) + '.') + '</div>' +
      '<button type="button" class="btn cgo" data-act="hPlay" data-v="' + start + '">' + LZ.ic('play') + (start > 0 ? '이어서 플레이 · ' + (start + 1) + '홀' : '플레이 시작 · 1홀') + '</button>' +
      '<div class="chips"><button type="button" class="chip" data-act="hHl" aria-label="게임 모드와 센서 탄도 고르기">' + (diff ? '<span class="dot" aria-label="기록 기준과 다름"></span>' : '') + LZ.MODE[v.g] + ' · ' + LZ.HL[v.h] + LZ.ic('down') + '</button>' +
      '<button type="button" class="chip" data-act="hCmpSheet"' + (!d.clubs.length ? ' aria-disabled="true"' : '') + '><span class="lb">비교</span>' + esc(cmpName) + LZ.ic('down') + '</button></div>' +
      (diff ? '<div class="kwrow">' + LZ.kw('기록 기준과 달라요', '이 코스 기록은 <b>' + LZ.modeTxt(bm) + '</b>로 적었어요. 지금은 <b>' + LZ.modeTxt(v) + '</b>로 바꿔 보여 드려요. 이 기준으로 고쳐 저장하면 코스 기록 기준이 바뀌고, 다른 홀도 같은 거리로 함께 바뀌어요.') + '</div>' : '') +
      (!d.clubs.length ? '<p class="hint">클럽에 들면 회원님들 기록과 비교할 수 있어요</p>' : '') +
      (n === 18 ? '<div class="seg sgw" role="group" aria-label="홀 범위">' + [['f', '전반'], ['b', '후반'], ['a', '전체']].map(function (x) { return '<button type="button" class="' + (half === x[0] ? 'on' : '') + '" data-act="hHalf" data-v="' + x[0] + '" aria-pressed="' + (half === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' : '') +
      '<div class="kwrow">' + LZ.kw('표시 읽기 · ↑ ↓ · 1st/2nd', '<b>↑</b> 오르막 · 크게, <b>↓</b> 내리막 · 작게(거리 숫자 색). 끊어 가는 홀은 홀 줄 아래에 <b>1st · 2nd</b> 두 줄이 바탕색으로 붙어요. 금색 문서 표시 = <b>참고 있음</b> · 누르면 줄 아래에 열려요. 홀을 누르면 그 홀부터 플레이해요.') + '</div>' +
      '<div class="hlist" id="chl">' + (ed ? '<div class="edbar"><div><b>끊어가기·주의 고치는 중</b><span>[끊어 + / ×] · 1st 줄 ▼▲ 거리 · [주의 ▾] · 코스에 하나 · 포인트 없음</span></div><button type="button" class="btn" data-act="cEdit" data-v="0">완료</button></div>' : '') +
      '<div class="crow2 hhd"><span class="g1">홀</span><span class="g2">거리</span><span class="g3">방향·좌우</span><span class="g4">볼스피드</span></div>' + list + '</div>' +
      (mode !== 'off' ? '<p class="hint">' + esc(cmpName) + ' 기록도 ' + LZ.modeTxt(v) + LZ.ro(LZ.HL[v.h]) + ' 바꿔 보여요. 줄 아래 글을 누르면 그 홀에 가져와요.' + (mode === 'avg' ? ' 평균은 공개한 회원 3명부터 보여요.' : '') + '</p>' : '') +
      (empt ? '<button type="button" class="btn o" data-act="importAll">' + LZ.nimE(d.pick.nick) + ' 기록 가져오기 · 빈 홀 ' + empt + '개</button>' : '') +
      '<button type="button" class="lnk" data-act="cEdit" data-v="' + (ed ? 0 : 1) + '">끊어가기·주의 고치기' + (ed ? ' 완료' : '') + '</button></div>';
  }
  LZ.screens.holes = {
    tab: 'courses',
    show: async function (p, root, alive) {
      if (EDIT && EDIT !== p.id) EDIT = '';
      var ck = 'course2:' + p.id + '|' + (store.get('lz.cmpBr') || '') + '|' + (store.get('lz.who.' + p.id) || '');
      var cachedD = !p.fresh && !(CUR.d && CUR.id === p.id) && LZ.cacheGet(ck);
      if (cachedD) paint(fixRecs(cachedD)); else if (!(CUR.d && CUR.id === p.id)) root.innerHTML = LZ.hdr('코스', { back: true, bar: '코스' }) + LZ.skeleton(6);
      else paint(CUR.d);
      var d = await loadCourse(p.id, p.fresh); if (!alive()) return;
      LZ.cacheSet(ck, d); paint(d);
      function paint(d) { root.innerHTML = coursePage(d); LZ.fillImgs && LZ.fillImgs(root); }
    }
  };
  function reCourse(force) { var p = LZ.cur().p; LZ.go('holes', Object.assign({}, p, { fresh: force ? 1 : 0 }), { replace: true }); }
  LZ.act.hHole = function (el, i) { if (EDIT) return; LZ.go('play', { id: CUR.d.course.id, hole: +i, auto: 1 }); };
  LZ.act.hPlay = function (el, i) { LZ.go('play', { id: CUR.d.course.id, hole: +i || 0, auto: 1 }); };
  LZ.act.hHalf = function (el, v) { store.set('lz.half2.' + CUR.d.course.id, v); LZ.redraw(); };
  LZ.act.cNote = function (el, i) { NOTE = NOTE === +i ? -1 : +i; LZ.redraw(); };
  LZ.act.hPub = async function () { var d = CUR.d; await setPub(d.course.id, !d.pub); LZ.redraw(); };
  LZ.act.hPubSheet = function () { var d = CUR.d; LZ.sheet('<h2>이 코스 기록</h2><p class="muted">공개면 클럽 회원이 평균·비교에 써요. 비공개면 나만 봐요.</p>' + [[1, '공개', '클럽 회원이 볼 수 있어요'], [0, '비공개', '나만 봐요 · 클럽 평균에도 안 들어가요']].map(function (x) { var on = !!d.pub === !!x[0]; return '<button type="button" class="opt ' + (on ? 'on' : '') + '" data-act="hPubSet" data-v="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + (on ? ' · ✓ 지금' : '') + '</span></button>'; }).join('')); };
  LZ.act.hPubSet = async function (el, v) { var d = CUR.d; LZ.closeSheet(); if (!!d.pub !== (v === '1')) await setPub(d.course.id, v === '1'); LZ.redraw(); };
  LZ.act.cMore = function () {
    var c = CUR.d.course;
    LZ.sheet('<h2>' + esc(c.name) + '</h2>' + '<button type="button" class="opt" data-act="cEdit" data-v="1"><b>끊어가기·주의 고치기</b><span>홀마다 끊는 거리 · 오르막/내리막 · 포인트 없음</span></button>' +
      (c.canEdit ? '<button type="button" class="opt" data-act="cInfoEdit"><b>코스 정보 고치기</b><span>이름 · 난이도 · 홀별 파·거리 · 기록 기준</span></button>' : '') +
      '<button type="button" class="opt" data-act="hPubSheet"><b>공개 · 비공개</b><span>지금 ' + (CUR.d.pub ? '공개' : '비공개') + '</span></button>');
  };
  LZ.act.cInfoEdit = function () { LZ.closeSheet(); LZ.go('courseEdit', { id: CUR.d.course.id }); };
  LZ.act.cEdit = function (el, v) { LZ.closeSheet(); EDIT = v === '1' ? CUR.d.course.id : ''; if (EDIT && CUR.d.course.stage === 'done' && (store.get('lz.half2.' + EDIT) || 'f') === 'f') { /* 그대로 */ } LZ.redraw(); };
  /** 끊는 거리·주의 바꾸기(코스에 하나): 다른 분 기록이 있으면 "n명의 기준이 바뀌어요" 확인 */
  async function layApply(i, ch) {
    var d = CUR.d, c = d.course, body = Object.assign({ id: c.id, i: i }, ch);
    try {
      var r = await LZ.api('courseLay', body);
      if (r.need) {
        if (!(await LZ.confirm(r.need + '명의 기준이 바뀌어요', '이 홀을 기록한 회원님 ' + r.need + '명의 기록에 "기준 바뀜"이 표시돼요. 예전 값은 "예전 값으로"에 남아요. 포인트는 생기지 않아요.', '바꾸기'))) return false;
        r = await LZ.api('courseLay', Object.assign({ confirm: 1 }, body));
      }
      c.lay = c.lay.slice(); c.slope = c.slope.slice(); c.lay[i] = r.lay; c.slope[i] = r.slope;
      CUR.at = 0; await loadCourse(c.id, true); LZ.cacheSet && LZ.cacheSet('course2:' + c.id + '|' + (store.get('lz.cmpBr') || '') + '|' + (store.get('lz.who.' + c.id) || ''), CUR.d);
      return true;
    } catch (e) { LZ.toast(LZ.errText(e), 5000); return false; }
  }
  LZ.layApply = layApply;
  LZ.act.cLay = async function (el, i) { i = +i; var c = CUR.d.course, L = layAt(c, i), hm = +c.holes[i][1]; if (await layApply(i, { lay: L ? 0 : Math.max(1, Math.round(hm * 0.6)) })) { LZ.toast(L ? (i + 1) + '홀 끊어가기를 껐어요' : (i + 1) + '홀을 끊어 가요 · 1st ' + layAt(CUR.d.course, i) + 'm'); LZ.redraw(); } };
  LZ.act.cLayStep = async function (el, v) { var a = v.split('|'), i = +a[0], c = CUR.d.course, L = layAt(c, i), hm = +c.holes[i][1], nx = Math.max(1, Math.min(Math.ceil(hm) - 1, Math.round(L) + (+a[1]))); if (nx === L) return; if (await layApply(i, { lay: nx })) LZ.redraw(); };
  function slopeSheet(i, act) { var cur = slAt(CUR.d.course, i); LZ.sheet('<h2>' + (i + 1) + '홀 주의</h2><p class="muted">코스에 하나예요. 기준 볼스피드는 그대로 두고 차이를 "크게 +1.5"처럼 설명해요. 포인트는 없어요.</p>' + [['', '보통', '평평해요'], ['up', '오르막 · 크게', '거리 숫자 주황 ↑'], ['down', '내리막 · 작게', '거리 숫자 파랑 ↓']].map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + i + '|' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + (cur === x[0] ? ' · ✓ 지금' : '') + '</span></button>'; }).join('')); }
  LZ.act.cSlope = function (el, i) { slopeSheet(+i, 'cSlopeSet'); };
  LZ.act.cSlopeSet = async function (el, v) { var a = v.split('|'); LZ.closeSheet(); if (await layApply(+a[0], { slope: a[1] })) LZ.redraw(); };
  /** 게임 모드 · 센서 탄도(5단계) 한 창 */
  function viewSheet() {
    var d = CUR.d, v = viewOf(d), bm = basisOf(d);
    LZ.sheet('<h2>게임 모드 · 센서 탄도</h2><p class="muted">고르면 볼스피드를 같은 거리가 나오게 바꿔 보여 드려요. 지금 기록 기준은 ' + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + (LZ.ro(LZ.HL[bm.h]) === '으로' ? '이에요' : '예요') + '. 다른 기준으로 보면서 플레이 화면에서 고쳐 저장하면, 이 코스 기록 기준이 그 기준으로 바뀌고 다른 홀도 같은 거리로 함께 바뀌어요.</p>' +
      '<div class="seg s" role="group" aria-label="게임 모드">' + [['b', '아마추어'], ['p', '프로'], ['m', '마스터']].map(function (x) { return '<button type="button" class="' + (v.g === x[0] ? 'on' : '') + '" data-act="hViewSet" data-v="g' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div style="height:10px"></div>' +
      LZ.HLSEG.map(function (x) { return '<button type="button" class="opt ' + (v.h === x[0] ? 'on' : '') + '" data-act="hViewSet" data-v="h' + x[0] + '"><b>' + x[1] + '</b>' + (bm.h === x[0] ? '<span>기록 기준</span>' : '') + '</button>'; }).join(''));
  }
  LZ.act.hMode = function () { viewSheet(); };
  LZ.act.hHl = function () { viewSheet(); };
  LZ.act.hViewSet = function (el, v) { var d = CUR.d, cur = viewOf(d), k = v.charAt(0), x = v.slice(1); cur[k] = x; store.set('lz.view.' + d.course.id, cur.g + '|' + cur.h); if (k === 'h') LZ.closeSheet(); else viewSheet(); LZ.redraw(); };
  LZ.act.hCmpSheet = function () {
    var d = CUR.d, cur = cmpMode(d);
    if (!d.clubs.length) { LZ.toast('클럽에 들면 회원님들 기록과 비교할 수 있어요', 3500); return; }
    LZ.sheet('<h2>비교</h2><p class="muted">켜면 줄 아래에 "클럽 평균 우 3 · 22~"처럼 보여요. 누르면 그 홀에 가져와요.</p>' + [['off', '끔', '내 기록만'], ['avg', '클럽 평균', esc(d.cmp.name || '클럽') + ' · 공개 ' + d.cmp.n + '명'], ['mem', '클럽 회원', d.pick ? esc(d.pick.nick) : '공개한 회원 없음']].map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="hCmp" data-v="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + (cur === x[0] ? ' · ✓ 지금' : '') + '</span></button>'; }).join('') +
      (cur !== 'off' ? '<div class="row2"><button type="button" class="btn g" data-act="hClub">비교할 클럽</button>' + (cur === 'mem' ? '<button type="button" class="btn g" data-act="hWho">비교할 회원</button>' : '') + '</div>' : ''));
  };
  LZ.act.hCmp = async function (el, v) {
    var d = CUR.d, cur = cmpMode(d);
    if (v === cur && v === 'avg') return LZ.act.hClub();
    if (v === cur && v === 'mem') return LZ.act.hWho();
    store.set('lz.cmpMode', v); LZ.closeSheet(); LZ.redraw();
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
  /* 가져오기: 비교 줄(클럽 평균·회원 기록)을 내 기록 기준으로 환산해서 그 홀에(끊어 홀은 1st·2nd 함께) */
  function takeRec(d, i, bm) {
    var mode = cmpMode(d), c = d.course, L = layAt(c, i), cur = d.mine[i], rec = null;
    if (mode === 'avg') {
      var a = d.avg && d.avg[i]; if (!a) return null;
      if (L && a.s) rec = { r: 'f', t: '', d: a.s[0].lr < 0 ? 'L' : 'R', n: Math.abs(a.s[0].lr), p: LZ.sugOf(a.s[0].m, bm.g, bm.h), s2: { r: 'c', t: '', d: a.s[1].lr < 0 ? 'L' : 'R', n: Math.abs(a.s[1].lr), p: LZ.sugOf(a.s[1].m, bm.g, bm.h) } };
      else if (!a.none) rec = { r: 'f', t: '', d: a.lr < 0 ? 'L' : 'R', n: Math.abs(a.lr), p: LZ.sugOf(a.m, bm.g, bm.h) };
      if (rec) rec.o = cur.o || '';
      return rec ? { rec: rec, who: '클럽 평균' } : null;
    }
    var o = d.pick && d.pick.recs[i]; if (!o || !o.r) return null;
    rec = { r: o.r, t: o.t, d: o.d, n: o.n, p: LZ.conv(o.p, o.g, o.h, bm.g, bm.h), o: o.o || cur.o || '' };
    if (L && o.s2) rec.s2 = { r: o.s2.r, t: o.s2.t || '', d: o.s2.d, n: o.s2.n, p: LZ.conv(o.s2.p, o.g, o.h, bm.g, bm.h) };
    return { rec: rec, who: LZ.nim(d.pick.nick) + ' 기록' };
  }
  LZ.act.cmpTake = async function (el, i) {
    i = +i; var d = CUR.d, bm = basisOf(d), mode = cmpMode(d), cur = d.mine[i], t = takeRec(d, i, bm); if (!t) return;
    var rec = t.rec, sh = function (x) { return LZ.refTxt(x) + ' ' + LZ.lrPlain(x) + ' · 볼스피드 ' + LZ.bsTxt(x.p); };
    if (!(await LZ.confirm((i + 1) + '홀에 ' + t.who + '을 가져올까요?', (cur.r ? '지금 내 기록(' + sh(cur) + ')이 바뀌어요. ' : '') + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + ' 기준으로 바꿔서 넣어요: ' + sh(rec) + (rec.s2 ? ' / 2nd ' + sh(rec.s2) : '') + '. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    rec = Object.assign({}, cur, rec, { g: bm.g, h: bm.h, i: cur.i || '', hs: cur.hs || [] }); if (!layAt(d.course, i)) delete rec.s2; delete rec.chg;
    try {
      var out = await LZ.api('save', { cid: d.course.id, items: [{ i: i, rec: rec }], g: bm.g, h: bm.h });
      d.mine[i] = Object.assign({}, rec, { upd: out.upd }); if (!d.mode) d.mode = out.mode || { g: bm.g, h: bm.h };
      if (mode === 'mem') LZ.api('use', { cid: d.course.id, from: d.pick.uid, cmp: d.cmp.id }).catch(function () {});
      LZ.toast((i + 1) + '홀에 가져왔어요'); LZ.redraw();
    } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.importAll = async function () {
    var d = CUR.d, src = d.pick, bm = basisOf(d), n = nOf(d.course), items = [];
    src.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) { var x = Object.assign({}, r, { p: LZ.conv(r.p, r.g, r.h, bm.g, bm.h), g: bm.g, h: bm.h, i: '', hs: [] }); delete x.ohs; delete x.chg; if (r.s2 && layAt(d.course, i)) x.s2 = Object.assign({}, r.s2, { p: LZ.conv(r.s2.p, r.g, r.h, bm.g, bm.h) }); else delete x.s2; items.push({ i: i, rec: x }); } });
    if (!items.length) { LZ.toast('가져올 빈 홀이 없어요'); return; }
    if (!(await LZ.confirm(LZ.nim(src.nick) + ' 기록을 가져올까요?', '빈 홀 ' + items.length + '개에 ' + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + ' 기준으로 바꿔서 넣어요. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    try { await LZ.api('save', { cid: d.course.id, items: items, g: bm.g, h: bm.h, src: src.uid }); await LZ.api('use', { cid: d.course.id, from: src.uid, cmp: d.cmp.id }).catch(function () {}); LZ.toast('가져왔어요 · ' + items.length + '홀'); reCourse(true); } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  /* 예전 "홀 기록" 화면 주소는 플레이 화면으로 */
  LZ.screens.edit = { tab: 'courses', show: function (p) { LZ.go('play', { id: p.id, hole: p.i || 0 }, { replace: true }); } };

  /* ═════════ 플레이(v8): 한 홀씩, 조정 칸·아래 막대는 모든 홀에서 같은 자리 ═════════ */
  var ED = null, PL = null;
  function plState(cid) {
    if (!PL || PL.cid !== cid) { PL = store.json('lz.pl.' + cid); if (!PL || PL.cid !== cid || Date.now() - (PL.at || 0) > 12 * 3600000) PL = { cid: cid, orig: {}, pts: 0, at: Date.now() }; }
    return PL;
  }
  function plKeep() { if (PL) { PL.at = Date.now(); store.setJSON('lz.pl.' + PL.cid, PL); } }
  function plReset(cid) { PL = { cid: cid, orig: {}, pts: 0, at: Date.now() }; plKeep(); }
  function sayOn() { return store.get('lz.say') === '1'; }
  function sayBtns() { var on = sayOn(); return '<span class="sndw"><button type="button" class="tb snd' + (on ? ' on' : '') + '" data-act="say" aria-pressed="' + on + '" aria-label="홀 안내 ' + (on ? '켜짐 · 누르면 끔' : '꺼짐 · 누르면 켬') + '" title="홀 안내">' + LZ.ic(on ? 'sound' : 'mute') + '</button><button type="button" class="tb sagain" data-act="sayNow" aria-label="홀 안내 다시 듣기" title="다시 듣기"' + (on ? '' : ' disabled') + '>' + LZ.ic('again') + '</button></span>'; }
  function playHdr() { return LZ.hdr('플레이', { back: true, nosub: 1, sound: sayBtns() }); }
  function newShot(c, i, k, v, a) { return { r: k ? 'c' : 'f', t: '', d: a && a.lr < 0 ? 'L' : 'R', n: a ? Math.abs(a.lr) : 0, p: LZ.half(a ? LZ.sugOf(a.m, v.g, v.h) : baseOf(c, i, k, v)) }; }
  LZ.screens.play = {
    wake: true, nobar: true,
    show: async function (p, root, alive) {
      root.innerHTML = playHdr() + LZ.skeleton(3);
      var d = await loadCourse(p.id); if (!alive()) return;
      var c = d.course, n = nOf(c);
      plState(c.id);
      if (p.done) { ED = null; paintDone(root, d, p.done); return; }
      var i = Math.max(0, Math.min(n - 1, p.hole || 0)), bm = basisOf(d), L = layAt(c, i), v = viewOf(d);
      if (PL.orig[i] === undefined) { PL.orig[i] = clone(d.mine[i]); plKeep(); }
      store.set('lz.playAt.' + c.id, String(i));
      var r = clone(d.mine[i]), isNew = !r.r, av = d.avg && d.avg[i], a1 = av && !av.none && !L ? av : av && av.s ? av.s[0] : null, a2 = av && av.s ? av.s[1] : null;
      if (isNew) { var s0 = newShot(c, i, 0, v, a1); r.g = bm.g; r.h = bm.h; r.r = 'f'; r.d = s0.d; r.n = s0.n; r.p = LZ.conv(s0.p, v.g, v.h, bm.g, bm.h); }
      var fresh2 = false;
      if (L && !r.s2) { var x2 = newShot(c, i, 1, v, a2); x2.p = LZ.conv(x2.p, v.g, v.h, r.g, r.h); r.s2 = x2; fresh2 = !isNew; }
      if (!L) delete r.s2;
      ED = { d: d, i: i, r: r, isNew: isNew, dirty: fresh2, v: v, shot: p.shot === 1 && L ? 1 : 0, note: false };
      ED.disp = isNew ? newShot(c, i, 0, v, a1).p : LZ.conv(r.p, r.g, r.h, v.g, v.h);
      ED.disp2 = L ? (isNew || fresh2 ? newShot(c, i, 1, v, a2).p : LZ.conv(r.s2.p, r.g, r.h, v.g, v.h)) : 0;
      LZ.guard = { dirty: function () { return ED && ED.dirty; }, ask: async function () { var x = await LZ.dialog({ title: '고친 내용을 저장할까요?', cancel: 'stay', buttons: [{ label: '저장하고 나가기', kind: 'y', value: 'save' }, { label: '저장하지 않고 나가기', kind: 'r', value: 'drop' }, { label: '계속 고치기', kind: 'g', value: 'stay' }] }); if (x === 'save') return await plSaveHole(); return x === 'drop'; } };
      paintPlay(root);
      if (p.auto && sayOn()) setTimeout(function () { if (ED && ED.i === i) LZ.act.sayNow(); }, 250);
    }
  };
  function curShot() { return ED.shot ? ED.r.s2 : ED.r; }
  function playBody() {
    var d = ED.d, c = d.course, i = ED.i, h = c.holes[i], r = ED.r, v = ED.v, n = nOf(c), L = layAt(c, i), sl = slAt(c, i), lay = !!(L && r.s2), sh = lay ? ED.shot : 0, sx = curShot();
    var bm = basisOf(d), vdiff = v.g !== bm.g || v.h !== bm.h, dim = ED.isNew && !ED.dirty;
    var dirI = LZ.kw('방향 · 좌우', '<b>방향</b>은 어디서 잰 칸인지예요. 아래에서 골라요: <b>첫화면</b> · <b>홀컵</b> · <b>직접</b>(내가 정한 곳). ◀▶는 한 칸씩.' + (lay ? ' 끊어 가는 홀은 <b>1st · 2nd</b> 두 줄이 함께 보여요. 줄을 누르면 아래 단추가 그 줄을 고쳐요. 2nd는 처음에 <b>홀컵</b>이에요.' : ''));
    var bsI = LZ.kw('볼스피드', '<b>17~</b> = 17 넘게, 18 전까지 · <b>~18</b> = 18까지 · <b>Full</b> = 끝까지. ▼▲는 0.5씩. 기준과 1 넘게 다르면 기준 줄에 차이가 보여요(주의를 정했으면 "크게 +1.5"처럼).' + (lay ? ' 1st 기준은 끊는 거리, 2nd 기준은 나머지 거리로 계산해요.' : ''));
    var aim;
    if (lay) {
      var row = function (k) {
        var x = k ? r.s2 : r, dp = k ? ED.disp2 : ED.disp, base = baseOf(c, i, k, v), bp = LZ.bsParts(dp);
        return '<button type="button" class="shotr s' + (k + 1) + '" data-act="plShot" data-v="' + k + '" aria-pressed="' + (sh === k) + '" aria-label="' + (k ? '2nd' : '1st') + ' 고르기">' +
          '<span class="sl"><small><span class="shb">' + (k ? '2nd' : '1st') + '</span> ' + LZ.fmtM(shotDist(c, i, k)) + 'm · <b>' + esc(LZ.refTxt(x)) + '</b></small><span class="bv lrb">' + LZ.lrTxt(x) + '</span></span><span class="vl" aria-hidden="true"></span>' +
          '<span class="sl r"><small>기준 <b>' + LZ.bsTxt(base) + '</b> ' + dTxt(dp, base, sl) + '</small><span class="bv' + (sh === k ? ' pbig' : '') + (dim && !k ? ' dim' : '') + '" data-bs="' + bp.v + '">' + bp.t + '</span>' + bar9(dp, 'lgb') + '</span></button>';
      };
      aim = '<section class="aim lay" aria-label="방향, 좌우, 볼스피드"><div class="lbl" style="grid-area:1/1">' + dirI + '</div><div class="lbl r" style="grid-area:1/3">' + bsI + '</div><div class="shots">' + row(0) + row(1) + '</div></section>';
    } else {
      var base = baseOf(c, i, 0, v), b = LZ.bsParts(ED.disp);
      aim = '<section class="aim" aria-label="방향, 좌우, 볼스피드"><div class="lbl" style="grid-area:1/1">' + dirI + '</div><div class="lbl r" style="grid-area:1/3">' + bsI + '</div><span class="dvd" aria-hidden="true"></span>' +
        (r.r === 'u' ? '<button type="button" class="val dirv dirb" style="grid-area:2/1" data-act="plDirect" aria-label="직접 위치 고치기"><span>' + esc(LZ.refTxt(r)) + '</span></button>' : '<div class="val dirv" style="grid-area:2/1"><span>' + esc(LZ.refTxt(r)) + '</span></div>') +
        '<div class="vref" style="grid-area:2/3">기준 <b>' + LZ.bsTxt(base) + '</b>' + dTxt(ED.disp, base, sl) + '</div>' +
        '<div class="val lrb' + (dim ? ' dim' : '') + '" style="grid-area:3/1" aria-live="polite">' + LZ.lrTxt(r) + '</div>' +
        '<div class="val bsv pbig' + (dim ? ' dim' : '') + '" style="grid-area:3/3" data-bs="' + b.v + '" aria-live="polite">' + b.t + '</div>' +
        '<div class="vbar" style="grid-area:4/3">' + bar9(ED.disp, 'lgb') + '</div></section>';
    }
    var hs = r.hs && r.hs.length ? r.hs.slice(-2).map(function (x) { return LZ.fmtDate(x[0]) + ' ' + LZ.bsTxt(LZ.conv(x[1], r.g, r.h, v.g, v.h)) + '(' + LZ.lrPlain({ d: x[2] < 0 ? 'L' : 'R', n: Math.abs(x[2] || 0) }) + ')'; }).join(' → ') : '';
    var oh = r.ohs && r.ohs.length ? r.ohs[r.ohs.length - 1] : null;
    if (oh) hs += (hs ? ' · ' : '') + '예전 ' + (oh.one ? (oh.s2 ? '1st ' : '') + esc(LZ.refTxt(oh.one)) + ' ' + LZ.lrPlain(oh.one) + ' ' + LZ.bsTxt(LZ.conv(oh.one.p, r.g, r.h, v.g, v.h)) : '') + (oh.s2 ? ' 2nd ' + esc(LZ.refTxt(oh.s2)) + ' ' + LZ.lrPlain(oh.s2) + ' ' + LZ.bsTxt(LZ.conv(oh.s2.p, r.g, r.h, v.g, v.h)) : '');
    var d1 = LZ.dvOf(ED.disp, baseOf(c, i, 0, v)), noteTx = r.o ? hiNote(r.o) : (d1 && !sl ? '기준과 ' + (d1 > 0 ? '▲' : '▼') + LZ.fmtP(Math.abs(d1)) + ' · 참고 적기' : '없음');
    return '<div class="cname">' + esc(c.name) + '</div>' +
      '<div class="hh phd">' + LZ.hn(i + 1, 'xl') + '<span class="hpar">파 ' + h[0] + '</span><span class="hmode' + (vdiff ? '' : ' off') + '">' + (vdiff ? LZ.modeTxt(v) : '') + '</span>' +
      '<span class="hdist' + (sl ? (sl === 'up' ? ' up' : ' dn') : '') + '">' + LZ.fmtM(h[1]) + '<small>m</small>' + (sl ? (sl === 'up' ? '↑' : '↓') : '') + '</span></div>' +
      '<div class="opts"><button type="button" class="chip oc" data-act="plLaySheet"><span class="ot">' + (L ? '끊어 <b>' + LZ.fmtM(L) + 'm</b>' : '끊어가기') + '</span>' + LZ.ic('down') + '</button>' +
      '<button type="button" class="chip oc" data-act="plSlope"><span class="ot">' + (sl ? '<b>' + slTag(sl) + '</b>' : '주의 · 보통') + '</span>' + LZ.ic('down') + '</button></div>' + aim +
      '<button type="button" class="nrow" data-act="plNoteTgl" aria-expanded="' + !!ED.note + '" aria-controls="notep"><span class="lb">참고</span><span class="tx' + (r.o ? '' : ' e') + '">' + (r.chg ? '<b class="chgt">기준 바뀜</b> · ' : '') + noteTx + '</span>' + LZ.ic('down') + '</button>' +
      '<div class="notep" id="notep"' + (ED.note ? '' : ' hidden') + '>' + (r.o ? '<div class="full">' + hiNote(r.o) + '</div>' : '') + '<input type="text" id="plO" maxlength="20" value="' + esc(r.o) + '" placeholder="예: 맞바람, **반 칸** 세게" aria-label="참고(20자)">' +
      (r.chg ? '<p class="chgn">다른 회원님이 끊는 거리·주의를 바꿔서 기준이 바뀌었어요. 확인하고 저장하면 표시가 없어져요.</p>' : '') +
      '<div class="hs"><span>' + (hs ? '지난 값 ' + hs : '지난 값 없음') + '</span>' + ((r.ohs && r.ohs.length) || (r.hs && r.hs.length) ? '<button type="button" data-act="plUndo">예전 값으로</button>' : '') + '</div></div>';
  }
  function playFix() {
    var d = ED.d, c = d.course, i = ED.i, n = nOf(c), lay = !!(layAt(c, i) && ED.r.r && ED.r.s2), sh = lay ? ED.shot : 0, sx = curShot();
    var st = ED.dirty ? '● 고침 · 넘어가면 저장' : ED.isNew ? '기준값 · 저장하면 수첩에 적혀요' : '내 수첩 기록이에요';   // v8.1 한 줄 고정(조정 칸 자리가 늘 같게)
    var nxt = lay && sh === 0 ? '2nd ›' : (i >= n - 1 ? '저장하고 끝내기 ›' : '저장하고 다음 홀 ›');
    return '<div class="pfix" id="pfix"><div class="ctlp"><div class="ctr2"><button type="button" class="stp tri" data-act="plLr" data-v="-1" aria-label="좌로 한 칸">' + LZ.ic('tl') + '</button><button type="button" class="stp tri" data-act="plLr" data-v="1" aria-label="우로 한 칸">' + LZ.ic('tr') + '</button></div>' +
      '<span class="vd" aria-hidden="true"></span><div class="ctr2"><button type="button" class="stp tri" data-act="plP" data-v="-0.5" aria-label="볼스피드 0.5 낮추기">' + LZ.ic('td') + '</button><button type="button" class="stp tri" data-act="plP" data-v="0.5" aria-label="볼스피드 0.5 높이기">' + LZ.ic('tu') + '</button></div>' +
      '<div class="seg ref3" role="group" aria-label="방향">' + [['f', '첫화면'], ['c', '홀컵'], ['u', '직접']].map(function (x) { return '<button type="button" class="' + (sx.r === x[0] ? 'on' : '') + '" data-act="plRef" data-v="' + x[0] + '" aria-pressed="' + (sx.r === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="pbar2"><div class="pst saved' + (ED.dirty ? ' no' : '') + '">' + (lay ? (sh ? '2nd · ' : '1st · ') : '') + st + '</div><div class="pbtns pnav"><button type="button" class="btn g" data-act="plNav" data-v="-1"' + (i <= 0 && !sh ? ' disabled' : '') + '>‹ ' + (sh ? '1st' : '이전') + '</button><button type="button" class="btn" data-act="plNext">' + nxt + '</button></div></div></div>';
  }
  /* v8.1 조정 칸(#pfix)은 보통·큰 글씨·모든 홀에서 같은 자리(높이 px 고정). 그 위 내용은 자기 칸(.play3) 안에서만 스크롤 → 아무것도 조정 칸 뒤에 숨지 않고, 참고를 열어도 위 막대·홀 줄이 움직이지 않아요 */
  function fitPad() {
    var f = $('#pfix'), w = $('.play3'); if (!f || !w) return;
    window.scrollTo(0, 0);
    var top = w.getBoundingClientRect().top, h = Math.max(160, Math.floor(f.getBoundingClientRect().top - top));
    w.style.height = h + 'px'; w.style.paddingBottom = '';
  }
  function paintPlay(root) {
    root = root || $('#app');
    root.innerHTML = playHdr() + '<div class="wrap play3 play2">' + playBody() + '</div>' + playFix();
    fitPad();
    var o = $('#plO'); if (o) o.addEventListener('input', function () { ED.r.o = o.value; ED.dirty = true; var t = $('.nrow .tx'); if (t) { t.innerHTML = o.value ? hiNote(o.value) : '없음'; t.classList.toggle('e', !o.value); } var ps = $('.pfix .pst'); if (ps) { ps.textContent = '● 고침 · 넘어가면 저장'; ps.classList.add('no'); } });
  }
  window.addEventListener('resize', function () { if (LZ.cur && LZ.cur().name === 'play') fitPad(); });
  function rep() { var w = $('.play3'), y = w ? w.scrollTop : 0; paintPlay(); w = $('.play3'); if (w) w.scrollTop = y; }
  LZ.act.plP = function (el, v) {
    var k = ED.shot && ED.r.s2 ? 1 : 0, x = k ? ED.disp2 : ED.disp, st = +v, nx = LZ.clampP(LZ.r1(st > 0 ? Math.floor(x * 2 + 1e-6) / 2 + 0.5 : Math.ceil(x * 2 - 1e-6) / 2 - 0.5));   // 0.5 칸에 맞춰 움직임(환산값 22.7 → + 23 · − 22.5)
    var p = LZ.conv(nx, ED.v.g, ED.v.h, ED.r.g, ED.r.h); if (k) { ED.disp2 = nx; ED.r.s2.p = p; } else { ED.disp = nx; ED.r.p = p; } ED.dirty = true; rep();
  };
  LZ.act.plLr = function (el, v) { var r = curShot(), cur = Math.max(-10, Math.min(10, lrNum(r) + (+v))); r.d = cur < 0 ? 'L' : 'R'; r.n = Math.abs(cur); ED.dirty = true; rep(); };
  /* v8.1 직접: 아래에 칸이 새로 생기지 않고, 작은 창에서 위치 글(20자)을 적으면 방향 자리에 보여요(줄바꿈 · 글씨는 그대로) */
  LZ.act.plRef = function (el, v) { var was = curShot().r; curShot().r = v; ED.dirty = ED.dirty || was !== v; rep(); if (v === 'u') LZ.act.plDirect(); };
  LZ.act.plDirect = function () {
    var x = curShot(), lay = !!(ED.r.s2 && layAt(ED.d.course, ED.i)), who = lay ? (ED.shot ? '2nd ' : '1st ') : '';
    var d = LZ.sheet('<h2>' + who + '직접 · 어디서 잰 칸인지</h2><p class="muted" style="margin-top:0">20자까지 · 방향 자리에 그대로 보여요.</p><input type="text" id="plTx" class="in" maxlength="20" value="' + esc(x.t || '') + '" placeholder="예: 큰 나무 밑" aria-label="직접 위치(20자)" autocomplete="off"><p class="muted plcnt" style="text-align:right;margin:4px 2px 0"><span id="plTn">' + String(x.t || '').length + '</span>/20</p><button type="button" class="btn" data-act="plDirectSave">저장</button>');
    var t = $('#plTx', d); if (t) { t.addEventListener('input', function () { var n = $('#plTn', d); if (n) n.textContent = t.value.length; }); t.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); LZ.act.plDirectSave(); } }); setTimeout(function () { t.focus(); }, 60); }
  };
  LZ.act.plDirectSave = function () { var t = $('#plTx'), x = curShot(); if (!t) return; var v = t.value.replace(/\s+/g, ' ').trim().slice(0, 20); if (v !== (x.t || '') || x.r !== 'u') { x.t = v; x.r = 'u'; ED.dirty = true; } LZ.closeSheet(); rep(); };
  LZ.act.plShot = function (el, v) { ED.shot = +v ? 1 : 0; rep(); };
  LZ.act.plNote = LZ.act.plNoteTgl = function () { ED.note = !ED.note; rep(); if (ED.note) { var w = $('.play3'), np = $('#notep'); if (w && np) { var b = np.getBoundingClientRect(), wb = w.getBoundingClientRect(); if (b.bottom > wb.bottom) w.scrollTop += b.bottom - wb.bottom + 8; } var o = $('#plO'); if (o && !o.value) o.focus({ preventScroll: true }); } };
  LZ.act.plUndo = function () {
    var r = ED.r, v = ED.v;
    if (r.ohs && r.ohs.length) {
      var x = r.ohs[r.ohs.length - 1]; r.ohs = r.ohs.slice(0, -1);
      if (x.one) { r.r = x.one.r; r.t = x.one.t || ''; r.d = x.one.d; r.n = x.one.n; r.p = x.one.p; }
      if (x.s2 && layAt(ED.d.course, ED.i)) r.s2 = clone(x.s2);
    } else { var hs = r.hs, y = hs[hs.length - 1]; r.p = y[1]; r.d = y[2] < 0 ? 'L' : 'R'; r.n = Math.abs(y[2]); }
    ED.disp = LZ.conv(r.p, r.g, r.h, v.g, v.h); if (r.s2) ED.disp2 = LZ.conv(r.s2.p, r.g, r.h, v.g, v.h);
    ED.dirty = true; rep(); LZ.toast('예전 값으로 되돌렸어요 · 넘어가면 저장돼요');
  };
  async function plSaveHole() {
    if (!ED) return true; var d = ED.d, r = ED.r, i = ED.i, bm = basisOf(d);
    if (!ED.dirty && !ED.isNew) return true;
    if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 기록은 볼 수만 있어요', 4000); ED.dirty = false; return true; }
    var v = ED.v, rec = Object.assign({}, r, { vp: ED.disp }); delete rec.chg;
    if (r.s2 && layAt(d.course, i)) rec.s2 = Object.assign({}, r.s2, { vp: ED.disp2 }); else delete rec.s2;
    var body = { cid: d.course.id, items: [{ i: i, rec: rec }], g: bm.g, h: bm.h, vg: v.g, vh: v.h };   // v7.0.4 보던 기준(vg·vh)과 보던 값(vp)도 보냄
    try {
      var out = await LZ.api('save', body);
      if (Array.isArray(out.recs) && out.recs.length) { d.mine = out.recs; fixRecs(d); } else { d.mine[i] = Object.assign({}, r, { upd: out.upd }); delete d.mine[i].chg; }
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
  function goHole(id, i, extra) { LZ.go('play', Object.assign({ id: id, hole: i, auto: 1 }, extra || {}), { replace: true, skipGuard: true }); }
  LZ.act.plNext = async function () {
    var d = ED.d, i = ED.i, n = nOf(d.course), id = d.course.id;
    if (layAt(d.course, i) && ED.r.s2 && ED.shot === 0) { ED.shot = 1; rep(); return; }   // 1st → 2nd → 다음 홀
    if (!(await plSaveHole())) return;
    if (i >= n - 1) LZ.go('play', { id: id, done: 'end' }, { replace: true, skipGuard: true });
    else if (n === 18 && i === 8) LZ.go('play', { id: id, done: 'rest' }, { replace: true, skipGuard: true });
    else goHole(id, i + 1);
  };
  LZ.act.plNav = async function (el, v) {
    if (+v < 0 && ED.shot === 1) { ED.shot = 0; rep(); return; }
    var i = ED.i + (+v), id = ED.d.course.id; if (i < 0) return; if (ED.dirty && !(await plSaveHole())) return; goHole(id, i);
  };
  /* 플레이 칩: 끊어가기(거리 ▼▲) · 주의 — 코스에 하나(포인트 없음) */
  var LS = null;
  function laySheetPaint() {
    var c = ED.d.course, i = ED.i, hm = +c.holes[i][1];
    LZ.sheet('<div id="lsheet"><h2>' + (i + 1) + '홀 끊어가기</h2><p class="muted">코스에 하나예요. 1st는 끊는 거리, 2nd는 나머지 거리로 기준을 계산해요. 포인트는 없어요.</p>' +
      (LS.L ? '<div class="lsrow"><button type="button" class="stp tri" data-act="plLayStep" data-v="-1" aria-label="1m 줄이기">' + LZ.ic('td') + '</button><b>1st ' + LS.L + 'm · 2nd ' + LZ.fmtM(LZ.r1(hm - LS.L)) + 'm</b><button type="button" class="stp tri" data-act="plLayStep" data-v="1" aria-label="1m 늘리기">' + LZ.ic('tu') + '</button></div>' +
        '<div class="row2"><button type="button" class="btn g" data-act="plLayOff">끊어가기 끄기</button><button type="button" class="btn" data-act="plLaySave">저장</button></div>' :
        '<button type="button" class="btn" data-act="plLayOn">끊어 가기 켜기 · 1st ' + Math.max(1, Math.round(hm * 0.6)) + 'm</button>') + '</div>', { stack: !!$('#lsheet') });
  }
  async function plLayDo(ch) {
    if (ED.dirty && !(await plSaveHole())) return;
    var i = ED.i, id = ED.d.course.id; LZ.closeSheet();
    if (await layApply(i, ch)) goHole(id, i, { auto: 0 });
  }
  LZ.act.plLaySheet = function () { LS = { L: layAt(ED.d.course, ED.i) }; laySheetPaint(); };
  LZ.act.plLayOn = function () { LS.L = Math.max(1, Math.round(+ED.d.course.holes[ED.i][1] * 0.6)); var b = $('#lsheet'); if (b) b.parentNode.removeChild(b); laySheetPaint(); };
  LZ.act.plLayStep = function (el, v) { var hm = +ED.d.course.holes[ED.i][1]; LS.L = Math.max(1, Math.min(Math.ceil(hm) - 1, Math.round(LS.L) + (+v))); var b = $('#lsheet b'); if (b) b.textContent = '1st ' + LS.L + 'm · 2nd ' + LZ.fmtM(LZ.r1(hm - LS.L)) + 'm'; };
  LZ.act.plLaySave = function () { plLayDo({ lay: LS.L }); };
  LZ.act.plLayOff = function () { plLayDo({ lay: 0 }); };
  LZ.act.plSlope = function () { slopeSheet(ED.i, 'plSlopeSet'); };
  LZ.act.plSlopeSet = function (el, v) { var a = v.split('|'); plLayDo({ slope: a[1] }); };
  /* 옆으로 밀어 홀 넘기기(플레이 화면에서만) */
  var swX = 0, swY = 0;
  document.addEventListener('touchstart', function (e) { swX = e.touches[0].clientX; swY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (LZ.cur().name !== 'play' || !ED) return; if (e.target.closest('input, textarea, .bar9, .pfix')) return; var dx = e.changedTouches[0].clientX - swX, dy = e.changedTouches[0].clientY - swY; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) { if (dx < 0) LZ.act.plNext(); else LZ.act.plNav(null, -1); } }, { passive: true });

  /* ───── 9홀 쉬는 화면 · 끝 화면(같은 1st/2nd 줄) ───── */
  function shotCh(o, r) { if (!o || !r) return false; return Math.abs(LZ.r1(r.p - o.p)) >= 0.1 || lrNum(r) !== lrNum(o) || o.r !== r.r || (o.r === 'u' && o.t !== r.t); }
  function changesOf(d, a, b) {
    var out = [], fresh = 0, v = viewOf(d);
    for (var i = a; i < b; i++) {
      var o = PL.orig[i], r = d.mine[i]; if (o === undefined || !r.r) continue;
      if (!o.r) { fresh++; continue; }
      var op = LZ.conv(o.p, o.g, o.h, r.g, r.h), dp = LZ.r1(r.p - op), dl = lrNum(r) - lrNum(o), refCh = o.r !== r.r || (o.r === 'u' && o.t !== r.t), ch2 = !!(r.s2 && o.s2 && shotCh(Object.assign({}, o.s2, { p: LZ.conv(o.s2.p, o.g, o.h, r.g, r.h) }), r.s2)) || (!!r.s2 !== !!o.s2);
      if (Math.abs(dp) >= 0.1 || dl || refCh || ch2) out.push({ i: i, dp: Math.abs(dp) >= 0.1 ? dp : 0, dl: dl, ref: refCh, s2: ch2, from: LZ.conv(o.p, o.g, o.h, v.g, v.h), to: LZ.conv(r.p, r.g, r.h, v.g, v.h), o: o, r: r });
    }
    out.sort(function (x, y) { return (Math.abs(y.dp) * 2 + Math.abs(y.dl)) - (Math.abs(x.dp) * 2 + Math.abs(x.dl)) || x.i - y.i; });
    return { list: out, fresh: fresh, nP: out.filter(function (x) { return x.dp; }).length, nL: out.filter(function (x) { return x.dl || x.ref; }).length };
  }
  function chgNote(x, lay) {
    var parts = [], p1 = lay ? '1st ' : '';
    if (x.dp) parts.push(p1 + LZ.bsTxt(x.from) + ' → <b>' + LZ.bsTxt(x.to) + '</b> ' + (x.dp > 0 ? '▲' : '▼'));
    if (x.ref) parts.push(esc(LZ.refTxt(x.o)) + ' → <b>' + esc(LZ.refTxt(x.r)) + '</b>');
    if (x.dl) parts.push(LZ.lrPlain(x.o) + ' → <b>' + LZ.lrPlain(x.r) + '</b>');
    if (x.s2) parts.push('2nd 고침');
    return '고침 · ' + parts.join(' · ');
  }
  function chgList(d, C) {
    var v = viewOf(d);
    if (!C.list.length) return '<div class="hlist" id="chl"><div class="empty">기록대로 잘 맞았어요' + (C.fresh ? ' · 새로 적은 홀 ' + C.fresh + '개' : '') + '</div></div>';
    return '<div class="hlist chgs" id="chl">' + C.list.map(function (x) { return holeRow(d, x.i, v, 'off', { ro: 1, act: 'plJump', note: chgNote(x, !!layAt(d.course, x.i)) }); }).join('') + '</div>';
  }
  /** 기준과 다른 홀: 두 샷 모두 세고, 주의로 설명되는 홀(오르막·내리막)은 빼요 */
  function oddOf(d, n) {
    var c = d.course, L = [];
    for (var i = 0; i < n; i++) {
      var r = d.mine[i]; if (!r.r || slAt(c, i)) continue;
      var m = { g: r.g, h: r.h }, s0 = baseOf(c, i, 0, m); if (LZ.dvOf(r.p, s0)) L.push({ i: i, k: 0, p: r.p, s: s0, lay: !!layAt(c, i) });
      if (layAt(c, i) && r.s2) { var s1 = baseOf(c, i, 1, m); if (LZ.dvOf(r.s2.p, s1)) L.push({ i: i, k: 1, p: r.s2.p, s: s1, lay: true }); }
    }
    return L;
  }
  function paintDone(root, d, kind) {
    var c = d.course, n = nOf(c), v = viewOf(d), pts = PL.pts || 0, html;
    if (kind === 'rest') {
      var R = changesOf(d, 0, 9);
      html = '<div class="pdone v8d"><div class="pdi">' + LZ.ic('flag') + '</div><h1>전반 끝</h1><p class="pds">' + esc(c.name) + '</p><p class="pds sm">자동으로 저장됐어요 · 적립 포인트 +' + pts + 'P</p></div>' +
        '<div class="kwrow">' + LZ.kw('전반에 고친 홀 ' + R.list.length, '누르면 그 홀을 다시 쳐요. 기록은 그대로 있어요. 끊어 가는 홀은 1st · 2nd 모두 보여요.') + '</div>' + chgList(d, R) +
        '<button type="button" class="btn pgo" data-act="plGo" data-v="9">후반 시작 · 10홀 ›</button><button type="button" class="lnk pdl" data-act="plEnd">여기서 끝내기</button>';
    } else {
      var E = changesOf(d, 0, n), filled = d.mine.slice(0, n).filter(function (r) { return r.r; }).length, oddL = oddOf(d, n), odd = oddL.length; ODD = oddL;
      html = '<div class="pdone v8d"><div class="pdi">' + LZ.ic('trophy') + '</div><h1>경기 끝</h1><p class="pds">' + esc(c.name) + '</p><p class="pds sm">' + n + '홀 · ' + LZ.modeTxt(v) + '</p></div>' +
        '<div class="ptiles"><div><span>내 수첩</span><b>' + filled + '/' + n + '홀' + (filled >= n ? LZ.ic('check', 'tk') : '') + '</b></div><div><span>적립 포인트</span><b class="au">+' + pts + 'P</b></div>' + (odd ? '<button type="button" class="ptodd" data-act="plOdd"><span>기준과 다른 홀</span><b>' + odd + '개 ›</b></button>' : '<div><span>기준과 다른 홀</span><b>0개</b></div>') + '</div>' +
        '<div class="kwrow">' + LZ.kw('오늘 고친 홀 ' + E.list.length, '볼스피드 · 좌우 · 방향이 바뀐 홀이에요(끊어 가는 홀은 1st · 2nd 모두). 누르면 그 홀을 다시 쳐요. 기준과 다른 홀은 두 샷을 모두 세고, 주의(오르막·내리막)로 설명되는 홀은 빼요.') + '</div>' + chgList(d, E) +
        '<button type="button" class="btn pgo" data-act="plFinish">저장하고 코스 화면으로 ›</button><button type="button" class="lnk pdl" data-act="plRestart">1홀부터 다시 플레이</button>';
    }
    root.innerHTML = LZ.hdr('플레이', { back: true, nosub: 1 }) + '<div class="wrap v8c">' + html + '</div>';
  }
  var ODD = [];
  LZ.act.plOdd = function () {
    var L = ODD || []; if (!L.length) return;
    if (L.length === 1) { LZ.act.plJump(null, String(L[0].i)); return; }
    LZ.sheet('<h2>기준과 다른 홀 ' + L.length + '개</h2><p class="muted" style="margin:0 0 6px">홀을 누르면 그 홀부터 다시 쳐요. 기록은 그대로 있어요.</p><div class="list oddl">' + L.map(function (x) {
      var up = x.p > x.s; return '<button type="button" class="li" data-act="plJump" data-v="' + x.i + '">' + LZ.hn(x.i + 1) + '<span class="chgv">' + (x.lay ? '<span class="shb">' + (x.k ? '2nd' : '1st') + '</span> ' : '') + '내 기록 <b>' + LZ.bsTxt(x.p) + '</b> <span class="dv ' + (up ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + '</span><br><span class="muted">기준 ' + LZ.bsTxt(x.s) + '</span></span>' + LZ.ic('chev') + '</button>'; }).join('') + '</div>');
  };
  LZ.act.plJump = function (el, v) { LZ.closeSheet && LZ.closeSheet(); LZ.act.plGo(el, v); };
  LZ.act.plMore = function (el) { var m = el.parentNode.querySelector('.more'); if (m) m.hidden = false; el.remove(); };
  LZ.act.plGo = function (el, v) { LZ.go('play', { id: CUR.d.course.id, hole: +v, auto: 1 }, { replace: true }); };
  LZ.act.plEnd = function () { LZ.go('play', { id: CUR.d.course.id, done: 'end' }, { replace: true }); };
  LZ.act.plFinish = function () {
    var id = CUR.d.course.id; plReset(id); store.del('lz.playAt.' + id); CUR.at = Date.now();
    var below = LZ.stack[LZ.stack.length - 2]; if (below && below.name === 'holes' && below.p && below.p.id === id) LZ.back(); else LZ.go('holes', { id: id }, { replace: true });
  };
  LZ.act.plRestart = function () { var id = CUR.d.course.id; plReset(id); LZ.go('play', { id: id, hole: 0, auto: 1 }, { replace: true }); };

  /* ───── 홀 안내(#32): 휴대폰 한국어 목소리 ───── */
  var NUMK = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십', '십일', '십이', '십삼', '십사', '십오', '십육', '십칠', '십팔'];
  var NATK = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  var PARE = { 3: '쓰리', 4: '포', 5: '파이브', 6: '식스' };
  /** 받침 있으면 a, 없으면 b(숫자·영문도: 3 → 삼 받침) */
  function josa(w, a, b) { w = String(w).trim(); var ch = w.charAt(w.length - 1), c = ch.charCodeAt(0) - 0xAC00; if (c >= 0 && c <= 11171) return c % 28 ? a : b; var dg = { 0: 1, 1: 1, 3: 1, 6: 1, 7: 1, 8: 1, 2: 0, 4: 0, 5: 0, 9: 0 }; if (/\d/.test(ch)) return dg[ch] ? a : b; return /[lmnr]$/i.test(ch) ? a : b; }
  LZ.josa = josa;
  function refSay(o) { var t = String(o.t || '').trim(); return o.ref === 'c' ? '홀컵에서' : o.ref === 'u' ? (t || '직접 놓은 곳') + '에서' : '첫화면에서'; }
  function lrSay(o) { return o.n ? (o.d === 'L' ? '좌 ' : '우 ') + (NATK[o.n] || o.n) + ' 칸' : '그대로'; }
  function spk(p, sep) { var b = LZ.bsParts(p); return b.v >= 40 ? '풀로' : b.int ? b.v + '까지' : b.lo + ' 넘게' + sep + b.hi + ' 전까지'; }
  /** 읽어 줄 문장. o = { hole, par, ref(f|c|u), t, d(L|R), n, p, o(참고), none, slope(up|down), lay(끊는 거리), rest(남은 거리), s2:{ref,t,d,n,p} }
   *  예: "삼 홀, 파 포. 홀컵에서 좌 세 칸. 볼스피드 24 넘게, 25 전까지 치세요. 참고로, 오르막입니다."
   *  끊어 가는 홀: "구 홀, 파 포. 끊어 가는 홀이에요. 첫 번째 샷 54미터, 첫화면에서 우 네 칸, 볼스피드 17 넘게 18 전까지. 두 번째 샷 34.5미터, 홀컵에서 그대로, 14까지. 오르막이에요, 크게 치세요." */
  LZ.sayText = function (o) {
    var s = (NUMK[o.hole] || o.hole) + ' 홀, 파 ' + (PARE[o.par] || o.par) + '. ';
    if (o.lay && o.s2) {
      s += '끊어 가는 홀이에요. 첫 번째 샷 ' + LZ.fmtM(o.lay) + '미터, ' + refSay(o) + ' ' + lrSay(o) + ', 볼스피드 ' + spk(o.p, ' ') + '. 두 번째 샷 ' + LZ.fmtM(o.rest) + '미터, ' + refSay(o.s2) + ' ' + lrSay(o.s2) + ', ' + spk(o.s2.p, ' ') + '.';
    } else {
      if (o.none) s += '아직 기록이 없어요. 기준 ';
      else s += refSay(o) + ' ' + lrSay(o) + '. ';
      s += '볼스피드 ' + (LZ.bsParts(o.p).v >= 40 ? '풀로 치세요.' : spk(o.p, ', ') + ' 치세요.');
    }
    if (o.slope) s += ' ' + (o.slope === 'up' ? '오르막이에요, 크게 치세요.' : '내리막이에요, 작게 치세요.');
    var note = String(o.o || '').replace(/\*\*/g, '').trim().replace(/[.!?。]+$/, '');
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
  LZ.myVoice = function () { return myVoice(); };
  function myVoice() { var id = store.get('lz.voice'), l = LZ.voiceList(); return l.filter(function (x) { return x.id === id; })[0] || l[0] || null; }
  LZ.speak = function (t, vid) {
    try {
      var u = new SpeechSynthesisUtterance(t), l = LZ.voiceList(), vo = vid ? l.filter(function (x) { return x.id === vid; })[0] : myVoice();
      u.lang = 'ko-KR'; u.rate = 0.92; if (vo) u.voice = vo.v; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { LZ.toast('이 휴대폰은 소리 읽기를 지원하지 않아요'); }
  };
  try { if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', function () { if ($('#vsheet')) LZ.act.voicePick(); }); } catch (e) { /* 무시 */ }
  function sayNowText() {
    var d = ED.d, c = d.course, i = ED.i, h = c.holes[i], r = ED.r, L = layAt(c, i);
    var o = { hole: i + 1, par: h[0], ref: r.r, t: r.t, d: r.d, n: r.n, p: ED.disp, o: r.o, none: ED.isNew && !ED.dirty && !L, slope: slAt(c, i) };
    if (L && r.s2) { o.lay = L; o.rest = shotDist(c, i, 1); o.s2 = { ref: r.s2.r, t: r.s2.t, d: r.s2.d, n: r.s2.n, p: ED.disp2 }; }
    return LZ.sayText(o);
  }
  LZ.act.sayNow = function () { if (!ED) return; LZ.speak(sayNowText()); };
  /** 🔊 진짜 켬/끔(마지막 상태 기억) · 켜면 바로 한 번 읽고 홀을 넘길 때마다 읽어요 · ↻ 다시 듣기 */
  LZ.act.say = function () {
    var on = store.get('lz.say') !== '1'; store.set('lz.say', on ? '1' : '0');
    $$('.top .snd').forEach(function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', '홀 안내 ' + (on ? '켜짐 · 누르면 끔' : '꺼짐 · 누르면 켬')); b.innerHTML = LZ.ic(on ? 'sound' : 'mute'); });
    $$('.top .sagain').forEach(function (b) { b.disabled = !on; });
    if (on) { LZ.toast('홀을 넘길 때마다 읽어 드려요 · ↻ 다시 듣기', 3000); LZ.act.sayNow(); } else { try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ } LZ.toast('홀 안내를 껐어요'); }
  };
  LZ.act.sayTgl = function (el) { var on = store.get('lz.say') !== '1'; store.set('lz.say', on ? '1' : '0'); LZ.flip(el); $$('.top .snd').forEach(function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); LZ.toast(on ? '홀을 넘길 때마다 읽어 드려요' : '홀 안내를 껐어요'); };
  LZ.sayPopRows = function () { var v = myVoice(); return '<div class="tgl"><span>' + LZ.ic('sound') + ' 홀 안내</span>' + LZ.sw(store.get('lz.say') === '1', 'sayTgl') + '</div><button type="button" class="vsel" data-act="voicePick"><span>목소리</span><b>' + esc(v ? v.name : '휴대폰 기본') + '</b>' + LZ.ic('chev') + '</button>'; };
  LZ.act.voicePick = function () {
    var l = LZ.voiceList(), cur = myVoice();
    var html = '<div id="vsheet"><h2>홀 안내 목소리</h2><p class="muted">이 휴대폰에 들어 있는 한국어 목소리예요. 휴대폰마다 종류와 수가 달라요.</p>' +
      (l.length ? l.map(function (x) { var on = cur && cur.id === x.id; return '<div class="vrow"><button type="button" class="opt ' + (on ? 'on' : '') + '" data-act="voiceSet" data-v="' + esc(x.id) + '"><b>' + esc(x.name) + '</b><span>' + (x.g === 'm' ? '남자 목소리' : x.g === 'f' ? '여자 목소리' : '휴대폰 목소리') + (on ? ' · ✓ 지금' : '') + '</span></button><button type="button" class="sm2 g" data-act="voiceTry" data-v="' + esc(x.id) + '">미리 듣기</button></div>'; }).join('') :
        '<div class="box">한국어 목소리를 아직 찾지 못했어요. 잠시 뒤에 다시 열어 보시거나, 휴대폰 설정 → 손쉬운 사용(접근성) → 말하기(음성 출력)에서 한국어 목소리를 받아 주세요.</div>') + '</div>';
    if ($('#vsheet')) { $('#vsheet').outerHTML = html; } else LZ.sheet(html, { stack: true });
  };
  var SAMPLE = function () { return LZ.sayText({ hole: 3, par: 4, ref: 'c', d: 'L', n: 3, p: 24.6, o: '오르막' }); };
  LZ.act.voiceSet = function (el, id) { store.set('lz.voice', id); LZ.act.voicePick(); LZ.speak(SAMPLE(), id); var vp = $('#vpop .vsel b'); if (vp) vp.textContent = myVoice() ? myVoice().name : ''; };
  LZ.act.voiceTry = function (el, id) { LZ.speak(SAMPLE(), id); };

  /* ═════════ 코스 등록(v8): 전반 → 후반, 홀마다 파 · 거리 · [주의] · [끊어], 내 기록도 같이 적기 ═════════ */
  var RG = null;
  function rgDist(j, k) { var r = RG.rows[j], m = parseFloat(r.m); if (!(m > 0)) return 0; return !r.lay ? m : k ? LZ.r1(m - r.lay) : r.lay; }
  function rgSug(j, k) { var m = rgDist(j, k || 0); return m > 0 ? LZ.sugOf(m, RG.g, RG.h) : null; }
  function rgShot(j, k) { var r = RG.rows[j]; return k ? r.s2 : r; }
  function rgP(j, k) { var x = rgShot(j, k || 0), s = rgSug(j, k || 0); return s === null ? null : (x.p === null ? LZ.half(s) : x.p); }
  function parSeg(j, par) { return '<span class="pseg">' + LZ.parOpts(par).map(function (x) { return '<button type="button" class="' + (String(par) === x[0] ? 'on' : '') + '" data-act="regPar:' + j + '" data-v="' + x[0] + '" aria-label="파 ' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</span>'; }
  function rgSugH(j) { var s = rgSug(j, 0); return s === null ? '<span class="dim">—</span>' : (RG.rec ? '<em>기준</em>' : '') + LZ.bs(s, 'sm'); }
  function rgRow(j) {
    var r = RG.rows[j], i = (RG.half ? 9 : 0) + j;
    return '<div class="rgrow">' + LZ.hn(i + 1) + parSeg(j, r.par) + '<input type="text" inputmode="decimal" data-row="' + j + '" value="' + esc(r.m) + '" placeholder="거리" aria-label="' + (i + 1) + '홀 거리(m)"><span class="sug" id="sg' + j + '">' + rgSugH(j) + '</span></div>' +
      '<div class="rgopt"><button type="button" class="lchip' + (r.sl ? ' on ' + (r.sl === 'up' ? 'up' : 'dn') : '') + '" data-act="regSl:' + j + '" aria-label="' + (i + 1) + '홀 주의 바꾸기">주의 · ' + slTag(r.sl) + '</button><button type="button" class="lchip' + (r.lay ? ' on' : '') + '" data-act="regLay:' + j + '" aria-pressed="' + !!r.lay + '" aria-label="' + (i + 1) + '홀 끊어가기">' + (r.lay ? '끊어 ×' : '끊어 +') + '</button></div>';
  }
  /** 내 기록 칸(한 번에 친 홀 또는 1st/2nd 줄 안): 방향 · 좌우 ◀▶ · 볼스피드 −+ (44px 단추) */
  function recCells(j, k) {
    var x = rgShot(j, k), s = rgSug(j, k), p = rgP(j, k), key = j + (k ? '.2' : '');
    if (s === null) return '';
    return '<div class="rgr2"><div class="rgc"><div class="rgl"><em>방향</em><span class="seg3 sm">' + [['f', '첫화면'], ['c', '홀컵'], ['u', '직접']].map(function (y) { return '<button type="button" class="' + (x.ref === y[0] ? 'on' : '') + '" data-act="regRef:' + key + '" data-v="' + y[0] + '">' + y[1] + '</button>'; }).join('') + '</span></div>' +
      '<div class="mini"><button type="button" class="stp sm l" data-act="regLr:' + key + '" data-v="-1" aria-label="좌">' + LZ.ic('tl') + '</button><b class="lrm">' + LZ.lrTxt({ d: x.lr < 0 ? 'L' : 'R', n: Math.abs(x.lr) }) + '</b><button type="button" class="stp sm r" data-act="regLr:' + key + '" data-v="1" aria-label="우">' + LZ.ic('tr') + '</button></div>' +
      (x.ref === 'u' ? '<input type="text" class="rgt" data-t="' + key + '" maxlength="20" placeholder="직접 (20자)" value="' + esc(x.t) + '">' : '') + '</div>' +
      '<div class="rgc"><div class="rgl"><em>볼스피드</em>' + LZ.dv(p, s) + '</div><div class="mini"><button type="button" class="stp sm" data-act="regP:' + key + '" data-v="-0.5" aria-label="0.5 줄이기">' + LZ.ic('td') + '</button>' + LZ.bs(p, 'sm') + '<button type="button" class="stp sm" data-act="regP:' + key + '" data-v="0.5" aria-label="0.5 늘리기">' + LZ.ic('tu') + '</button></div></div></div>';
  }
  function regRec(j) {
    var r = RG.rows[j], s = rgSug(j, 0), p = rgP(j, 0);
    var subs = '';
    if (r.lay) {
      var m = parseFloat(r.m) > 0 ? parseFloat(r.m) : 0;
      subs = '<div class="rsub s1"><div class="rh"><span class="shb">1st</span><b class="rd0">' + r.lay + 'm</b><span class="lstep"><button type="button" class="stp sm" data-act="regLayStep:' + j + '" data-v="-1" aria-label="끊는 거리 1m 줄이기">' + LZ.ic('td') + '</button><button type="button" class="stp sm" data-act="regLayStep:' + j + '" data-v="1" aria-label="끊는 거리 1m 늘리기">' + LZ.ic('tu') + '</button></span><span class="rsg">' + (rgSug(j, 0) !== null ? '기준 ' + LZ.bsTxt(rgSug(j, 0)) : '') + '</span></div>' + (RG.rec ? recCells(j, 0) : '') + '</div>' +
        '<div class="rsub s2"><div class="rh"><span class="shb">2nd</span><b class="rd0">' + (m ? LZ.fmtM(LZ.r1(m - r.lay)) + 'm' : '—') + '</b><span class="muted sm">나머지 거리 · 저절로</span><span class="rsg">' + (rgSug(j, 1) !== null ? '기준 ' + LZ.bsTxt(rgSug(j, 1)) : '') + '</span></div>' + (RG.rec ? recCells(j, 1) : '') + '</div>';
    } else if (RG.rec) subs = recCells(j, 0);
    if (!RG.rec || s === null) return subs;
    var off = !r.lay && LZ.dvOf(p, s) && !r.sl;
    return subs + (off ? '<div class="why"><label class="warn">기준보다 1 넘게 달라요 · 참고(선택, 20자)</label><input type="text" data-o="' + j + '" maxlength="20" placeholder="예: 오르막, 그린 뒤 OB" value="' + esc(r.o) + '"></div>' :
      r.noteOpen || r.o ? '<div class="why soft"><label>참고(선택, 20자)</label><input type="text" data-o="' + j + '" maxlength="20" placeholder="예: 바람 우" value="' + esc(r.o) + '"></div>' :
      '<button type="button" class="lnk notel" data-act="regNote:' + j + '">' + LZ.ic('note') + '참고 적기 <span class="muted">(선택)</span></button>');
  }
  function regSumText() {
    var sum = RG.rows.reduce(function (a, r) { return a + r.par; }, 0), dist = LZ.r1(RG.rows.reduce(function (a, r) { return a + (parseFloat(r.m) > 0 ? parseFloat(r.m) : 0); }, 0)), got = RG.rows.filter(function (r) { return parseFloat(r.m) > 0; }).length;
    return '파 ' + sum + (sum === 33 ? ' ✓' : ' (보통 33)') + ' · ' + LZ.fmtM(dist) + 'm' + (RG.rec ? ' · ' + got + '/9홀 적음' : '');
  }
  function regPaint(root) {
    var half = RG.half, title = half ? '후반 9홀 등록' : '새 코스 등록', mini = !half && RG.rec && !RG.infoOpen && RG.name;
    var chips = '<div class="chips"><button type="button" class="chip" data-act="regStarSheet" aria-label="난이도 별 ' + RG.stars + '">' + LZ.stars(RG.stars) + LZ.ic('down') + '</button><button type="button" class="chip" data-act="regModeSheet" aria-label="게임 모드와 센서 탄도">' + LZ.MODE[RG.g] + ' · ' + LZ.HL[RG.h] + LZ.ic('down') + '</button></div>';
    root.innerHTML = LZ.hdr(title, { back: true }) + '<div class="wrap reg2 v8c">' +
      (half ? '<div class="card tight"><b>' + esc(RG.name) + '</b><div class="muted">전반은 저장됐어요. 후반 9홀(10~18홀)을 넣어 주세요.</div></div>' :
        mini ? '<div class="card rgmini"><div class="t"><b>' + esc(RG.name) + '</b><div class="su">★' + RG.stars + ' · ' + LZ.MODE[RG.g] + ' · ' + LZ.HL[RG.h] + '</div></div><button type="button" class="lnk" data-act="rgInfo">' + LZ.ic('edit') + '고치기</button></div>' :
        '<div class="rginfo"><input type="text" id="rgName" class="reginp" maxlength="30" value="' + esc(RG.name) + '" placeholder="코스 이름 (예: 화천AB)" aria-label="코스 이름 · 스크린에 나오는 이름 그대로">' + chips +
        '<div class="kwrow">' + LZ.kw('★ · 모드 · 탄도', '난이도는 스크린에 나오는 별 그대로, 게임 모드는 기계에서 고른 모드, 센서 탄도는 이 매장 센서 설정이에요. 수첩에는 이 기준으로 적혀요. 다른 모드·매장에서는 같은 거리가 나오는 볼스피드로 바꿔 보여 드려요.') + '</div></div>') +
      '<div class="list1 tgl rgtgl"><span><b>내 기록도 같이 적기</b><span class="muted">평균(없으면 기준)이 미리 들어 있어요</span></span>' + LZ.sw(RG.rec, 'regRecTgl') + '</div>' +
      '<div class="kwrow">' + LZ.kw('홀 · 파 · 거리 · 주의 · 끊어', '<b>파</b>는 9홀 합계 33으로 미리 채워져요. <b>주의</b>는 보통 · 오르막 · 내리막을 차례로 바꿔요. <b>끊어</b>를 켜면 그 홀 아래에 <b>1st</b>(끊는 거리 ▼▲, 처음 60%) · <b>2nd</b>(나머지 거리) 두 줄이 생겨요. 내 기록을 켜면 각 줄 안에 방향·좌우·볼스피드를 적어요. 끊어·주의는 포인트가 없어요.') + '</div>' +
      '<div class="rgholes"><div class="rgh"><b>' + (half ? '후반 9홀' : '전반 9홀') + '</b><span class="su" id="regSum">' + regSumText() + '</span></div>' +
      RG.rows.map(function (r, j) { return '<div class="hb rgb' + (j % 2 ? ' z' : '') + '">' + rgRow(j) + '<div id="rr' + j + '">' + regRec(j) + '</div></div>'; }).join('') + '</div>' +
      '<p class="hint">한 홀 파를 바꾸면 다른 홀이 따라 바뀌어 33을 지켜요. 등록하는 동안 화면이 꺼지지 않아요.</p><button type="button" class="btn" data-act="regSave">' + (half ? '후반 저장하고 등록 마치기 ›' : '전반 저장 → 후반 9홀 ›') + '</button></div>';
    root.oninput = function (e) {
      var t = e.target;
      if (t.dataset.row !== undefined) { var j = +t.dataset.row, r = RG.rows[j]; r.m = t.value; r.p = null; r.s2.p = null; var m = parseFloat(t.value); if (r.lay && m > 0 && r.lay >= m) r.lay = Math.max(1, Math.round(m * 0.6)); $('#sg' + j).innerHTML = rgSugH(j); var rr = $('#rr' + j); if (rr) rr.innerHTML = regRec(j); var sm = $('#regSum'); if (sm) sm.textContent = regSumText(); }
      else if (t.dataset.t !== undefined) { var a = t.dataset.t.split('.'); rgShot(+a[0], a[1] ? 1 : 0).t = t.value; }
      else if (t.dataset.o !== undefined) RG.rows[+t.dataset.o].o = t.value;
      else if (t.id === 'rgName') RG.name = t.value;
    };
    LZ.guard = { dirty: function () { return RG.rows.some(function (r) { return r.m; }) && !RG.saved; }, ask: async function () { return LZ.confirm('나갈까요?', '적던 내용이 사라져요.', '나가기', 'r'); } };
  }
  function newRows(pars) { return pars.map(function (par) { return { par: par, m: '', lr: 0, p: null, ref: 'f', t: '', o: '', noteOpen: false, lay: 0, sl: '', s2: { ref: 'c', lr: 0, p: null, t: '' } }; }); }
  LZ.screens.reg = {
    tab: 'courses', wake: true,
    show: function (p, root) {
      if (!RG || p.id !== RG.id || RG.saved) { var bm0 = p.id && CUR.d && CUR.id === p.id && CUR.d.mode; RG = { id: p.id || '', name: p.name || '', stars: 3, g: bm0 ? bm0.g : 'p', h: bm0 ? bm0.h : 'm', rec: false, half: p.half || 0, rows: newRows([3, 3, 3, 3, 4, 4, 4, 4, 5]), saved: false, infoOpen: false }; }
      regPaint(root);
    }
  };
  function regRe() { var y = window.scrollY; regPaint($('#app')); window.scrollTo(0, y); }
  LZ.act.regStars = function (el, v) { RG.stars = +v; LZ.closeSheet(); regRe(); };
  LZ.act.regStarSheet = function () { LZ.sheet('<h2>난이도</h2><p class="muted">스크린에 나오는 별 그대로 골라요.</p>' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" class="opt ' + (RG.stars === k ? 'on' : '') + '" data-act="regStars" data-v="' + k + '"><b>' + LZ.stars(k) + '</b><span>★' + k + '</span></button>'; }).join('')); };
  LZ.act.regModeSheet = function () {
    LZ.sheet('<div id="rmsheet"><h2>게임 모드 · 센서 탄도</h2><p class="muted">게임 모드는 기계에서 고른 모드, 센서 탄도는 이 매장 센서 설정이에요.</p>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], RG.g, 'regG', 's') + '<div style="height:10px"></div>' + LZ.seg(LZ.HLSEG, RG.h, 'regH', 'hl s hl5') + '<button type="button" class="btn" data-act="sheetClose" style="margin-top:14px">확인</button></div>');
  };
  function regModeRe() { RG.rows.forEach(function (r) { r.p = null; r.s2.p = null; }); if ($('#rmsheet')) LZ.act.regModeSheet(); regRe(); }
  LZ.act.regG = function (el, v) { RG.g = v; regModeRe(); };
  LZ.act.regH = function (el, v) { RG.h = v; regModeRe(); };
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
    var a = e.target.closest('[data-act]'); if (!a || !RG) return; var m = /^reg(Par|Ref|Lr|P|Note|Sl|Lay|LayStep):(\d+)(\.2)?$/.exec(a.dataset.act); if (!m) return;
    e.preventDefault(); var j = +m[2], k = m[3] ? 1 : 0, r = RG.rows[j], x = rgShot(j, k), v = a.dataset.v, full = false;
    if (m[1] === 'Par') { var a0 = r.par, b0 = +v; if (a0 !== b0) { r.par = b0; regCascade(j, a0, b0); } }
    else if (m[1] === 'Ref') x.ref = v; else if (m[1] === 'Lr') x.lr = Math.max(-10, Math.min(10, x.lr + (+v))); else if (m[1] === 'Note') r.noteOpen = true;
    else if (m[1] === 'Sl') { r.sl = r.sl === '' ? 'up' : r.sl === 'up' ? 'down' : ''; full = true; }
    else if (m[1] === 'Lay') { var mm = parseFloat(r.m); if (!r.lay && !(mm > 0)) { LZ.toast((RG.half ? 10 + j : j + 1) + '홀 거리를 먼저 넣어 주세요'); return; } r.lay = r.lay ? 0 : Math.max(1, Math.round(mm * 0.6)); r.p = null; r.s2.p = null; full = true; }
    else if (m[1] === 'LayStep') { var hm = parseFloat(r.m); r.lay = Math.max(1, Math.min(Math.ceil(hm) - 1, r.lay + (+v))); r.p = null; r.s2.p = null; }
    else { var px = rgP(j, k), st = +v; if (px === null) return; x.p = LZ.clampP(st > 0 ? Math.floor(px * 2 + 1e-6) / 2 + 0.5 : Math.ceil(px * 2 - 1e-6) / 2 - 0.5); }
    LZ.buzz();
    if (m[1] === 'Par') { RG.rows.forEach(function (row, q) { $$('[data-act="regPar:' + q + '"]').forEach(function (b) { b.classList.toggle('on', +b.dataset.v === row.par); }); }); var sm = $('#regSum'); if (sm) sm.textContent = regSumText(); }
    else if (full) regRe();
    else { var rr = $('#rr' + j); if (rr) { rr.innerHTML = regRec(j); if (m[1] === 'Note' || (m[1] === 'Ref' && v === 'u')) { var f = rr.querySelector(m[1] === 'Note' ? '[data-o]' : '[data-t="' + j + (k ? '.2' : '') + '"]'); if (f) f.focus(); } } }
  });
  LZ.act.regSave = async function () {
    var holes = [], recs = [], lay = [], slope = [];
    if (!RG.half && !String(RG.name || '').trim()) { RG.infoOpen = true; regRe(); LZ.toast('코스 이름을 넣어 주세요'); var nm = $('#rgName'); if (nm) nm.focus(); return; }
    for (var j = 0; j < 9; j++) {
      var r = RG.rows[j], m = parseFloat(r.m); if (!(m > 0)) { LZ.toast((RG.half ? 10 + j : j + 1) + '홀 거리를 넣어 주세요'); return; }
      holes.push([r.par, m]); lay.push(r.lay && r.lay < m ? r.lay : 0); slope.push(r.sl);
      var rc = RG.rec ? { r: r.ref, t: r.t, d: r.lr < 0 ? 'L' : 'R', n: Math.abs(r.lr), p: rgP(j, 0), o: r.o || '' } : null;
      if (rc && lay[j]) rc.s2 = { r: r.s2.ref, t: r.s2.t, d: r.s2.lr < 0 ? 'L' : 'R', n: Math.abs(r.s2.lr), p: rgP(j, 1) };
      recs.push(rc);
    }
    var psum = RG.rows.reduce(function (a, r) { return a + r.par; }, 0);
    if (psum !== 33 && !(await LZ.confirm('파 합이 33이 아니에요 (' + psum + ')', '파3이나 파5가 하나 더 있는 코스면 맞아요. 이대로 저장할까요?', '이대로 저장'))) return;
    LZ.busy(true, '저장 중…');
    try {
      if (!RG.half) {
        var f = await LZ.api('regFront', { name: RG.name, holes: holes, stars: RG.stars, g: RG.g, h: RG.h, recs: RG.rec ? recs : undefined, lay: lay, slope: slope, confirm: RG.confirm ? 1 : 0 }, { retry: 0 });
        LZ.busy(false); RG = { id: f.id, name: f.name, stars: RG.stars, g: RG.g, h: RG.h, rec: RG.rec, half: 1, rows: newRows([3, 3, 3, 3, 4, 4, 4, 4, 5]), saved: false };
        LZ.toast('전반을 저장했어요. 후반을 이어서 넣어 주세요' + (f.pts ? ' · 적립 포인트 +' + f.pts + 'P' : ''), f.pts ? 4000 : 2500); LZ.go('reg', { id: f.id, half: 1 }, { replace: true, skipGuard: true });
      } else {
        var bk = await LZ.api('regBack', { id: RG.id, holes: holes, recs: RG.rec ? recs : undefined, lay: lay, slope: slope, vg: RG.g, vh: RG.h }, { retry: 0 });
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
        (d.mode ? '<label class="lb">이 코스의 내 기록 기준(게임 모드·센서 탄도)</label><p class="muted" style="margin:0 0 6px">바꾸면 이 코스의 내 기록을 같은 거리가 되도록 환산해요. 오늘만 다르게 볼 때는 코스 화면 위에서 고르세요(그 기준으로 플레이 화면에서 고쳐 저장하면 기록 기준도 그 기준으로 바뀌어요).</p>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], d.mode.g, 'ceG', 's') + '<div style="height:6px"></div>' + LZ.seg(LZ.HLSEG, d.mode.h, 'ceH', 'hl s hl5') + '<input type="hidden" id="ceG" value="' + d.mode.g + '"><input type="hidden" id="ceH" value="' + d.mode.h + '">' : '') + '</div>' +
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
