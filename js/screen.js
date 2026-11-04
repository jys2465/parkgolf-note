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
      '<div class="su">' + c.mine + ' / ' + c.n + '홀' + (c.filledH !== undefined && c.filledH < 18 ? ' · 파·거리 ' + c.filledH + '/18' : '') + (c.mode ? ' · ' + LZ.MODE[c.mode.g] + ' · ' + LZ.HL[c.mode.h] : '') + ' · ' + (c.pub ? '공개' : '비공개') + (c.others ? ' · 회원 ' + c.others + '명' : '') + '</div>' +
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
        var flt = store.get('lz.cflt') || 'all', sort = store.get('lz.csort') || 'new', q = store.get('lz.cq') || '';
        if (!SORTS.some(function (x) { return x[0] === sort; })) sort = 'new';
        if (!FLT.some(function (x) { return x[0] === flt; })) flt = 'all';
        var all = r.courses.filter(function (c) { return c.my === undefined || c.my; }).map(function (c) { c.n = c.n || nOf(c); if (c.pub === undefined) c.pub = 1; return c; });   // v9 내 수첩 = 내가 등록 · 가져옴 · 기록한 코스
        var list = all.filter(function (c) { return flt === 'all' || cStat(c) === flt; });
        list.sort(sortFn(sort));
        var sortName = SORTS.filter(function (x) { return x[0] === sort; })[0][1], fName = FLT.filter(function (x) { return x[0] === flt; })[0][1];
        /* v9 설계안: 큰 제목 · 코스 찾기 칸 · [＋ 새 코스 등록] [정렬] · 한 묶음 목록(진행 고리 · 이름 · 상태 · 자물쇠) */
        root.innerHTML = LZ.hdr('내 수첩', { btns: '<button type="button" class="tb" data-go="cImport" aria-label="코스 가져오기" title="코스 가져오기">' + LZ.ic('book') + '</button>' }) + '<div id="syncbar" class="sync wait" hidden></div><div class="wrap clist v9list">' + (LZ.admNote ? LZ.admNote('홀 기록(내 수첩)·클럽 가입·라운드 기록') : '') +
          '<label class="srch9">' + LZ.ic('search') + '<input type="search" id="cq" value="' + esc(q) + '" placeholder="코스 찾기" aria-label="코스 찾기"></label>' +
          '<div class="lbar">' + (r.canReg ? '<button type="button" class="btn g" data-go="reg">' + LZ.ic('plus') + '새 코스 등록</button>' : '') + '<button type="button" class="pill9" data-act="cSort" aria-label="정렬 · 지금 ' + sortName + (flt !== 'all' ? ' · ' + fName : '') + '"><span>' + (flt !== 'all' ? fName + '만' : '정렬') + '</span>' + LZ.ic('down') + '</button></div>' +
          (list.length ? '<div class="grp9">' + list.map(cRow).join('') + '</div>' : '<div class="empty">' + (all.length ? '고른 조건에 맞는 코스가 없어요.' : '아직 내 수첩에 코스가 없어요. 새로 등록하거나 다른 회원님이 등록한 코스를 가져와 보세요.') + '</div>') +
          '<p class="fn9">' + sortName + (flt !== 'all' ? ' · ' + fName + '만' : '') + ' · 자물쇠를 누르면 공개/비공개가 바뀌어요</p>' +
          '<button type="button" class="lnk cimpl" data-go="cImport">다른 회원이 등록한 코스 가져오기</button></div>';
        LZ.paintSync();
        var cq = $('#cq'), filt = function () { var v = cq.value.toLowerCase().replace(/\s+/g, ''); store.set('lz.cq', cq.value); $$('.crow9', root).forEach(function (b) { b.hidden = !!v && b.dataset.nm.indexOf(v) < 0; }); };
        if (cq) { cq.addEventListener('input', filt); if (q) filt(); }
      }
    }
  };
  /** 진행 고리: 다 적으면 청록 ✓ · 적는 중이면 금색 고리 + 홀 수 · 안 적었으면 빈 고리 */
  function ring(c) {
    var st = cStat(c), p = Math.min(1, c.mine / c.n), C = 2 * Math.PI * 12;
    if (st === 'done') return '<span class="ring done" aria-label="기록 완료">' + LZ.ic('check') + '</span>';
    return '<span class="ring" aria-label="' + c.mine + '/' + c.n + '홀"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" class="rb"/>' + (p > 0 ? '<circle cx="15" cy="15" r="12" class="rf" stroke-dasharray="' + (C * p).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 15 15)"/>' : '') + '</svg>' + (c.mine ? '<b>' + c.mine + '</b>' : '') + '</span>';
  }
  function cRow(c) {
    var st = cStat(c), sub = c.n + '홀 · ' + (st === 'done' ? '기록 완료' : st === 'ing' ? c.mine + '홀 기록' : '미기록') + (c.filledH !== undefined && c.filledH < 18 && c.n === 18 ? ' · 파·거리 ' + c.filledH + '/18' : '');
    return '<div class="crow9" data-nm="' + esc(String(c.name).toLowerCase().replace(/\s+/g, '')) + '">' + ring(c) +
      '<button type="button" class="l" data-act="openC" data-v="' + esc(c.id) + '"><b class="v9one">' + esc(c.name) + '</b><small>' + sub + '</small><small class="meta9"><span class="st9" aria-label="난이도 ' + c.stars + '">' + LZ.stars(c.stars) + '</span> · 등록 ' + esc(c.reg || '–') + ' · ' + LZ.fmtDate(c.created) + '</small></button>' +
      '<button type="button" class="lk' + (c.pub ? '' : ' off') + '" data-act="cPub" data-v="' + esc(c.id) + '" aria-label="' + (c.pub ? '공개 중 · 누르면 비공개' : '비공개 · 누르면 공개') + '">' + LZ.ic(c.pub ? 'unlock' : 'lock') + '</button></div>';
  }
  /* 정렬 창: 보기(전체 · 완료 · 기록 중 · 안 함) + 정렬 하나로 */
  LZ.act.cSort = function () {
    var cur = store.get('lz.csort') || 'new', flt = store.get('lz.cflt') || 'all';
    LZ.sheet('<h2>정렬 · 보기</h2><div class="seg s" role="group" aria-label="보기">' + FLT.map(function (x) { return '<button type="button" class="' + (flt === x[0] ? 'on' : '') + '" data-act="cFltSet" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div style="height:10px"></div>' +
      SORTS.map(function (x) { return '<button type="button" class="opt ' + (cur === x[0] ? 'on' : '') + '" data-act="cSortSet" data-v="' + x[0] + '"><b>' + x[1] + '</b>' + (cur === x[0] ? '<span>' + LZ.ic('check') + ' 지금</span>' : '') + '</button>'; }).join(''));
  };
  LZ.act.cFltSet = function (el, v) { store.set('lz.cflt', v); LZ.closeSheet(); LZ.redraw(); };
  LZ.act.openC = function (el, id) { LZ.go('holes', { id: id }); };
  LZ.act.cFlt = function (el, v) { store.set('lz.cflt', v); LZ.redraw(); };
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
  /** v9 두 번째 끊는 거리(세 번에 나눠 칠 때만) */
  function lay2At(c, i) { var L = layAt(c, i), M = +((c.lay2 || [])[i]) || 0, hm = +(c.holes[i] && c.holes[i][1]) || 0; return L && M > 0 && L + M < hm ? M : 0; }
  /** 이 홀을 몇 번에 나눠 쳐요: 1 · 2 · 3 */
  function nSh(c, i) { return layAt(c, i) ? (lay2At(c, i) ? 3 : 2) : 1; }
  var SHN = ['1st', '2nd', '3rd'];
  function shotOf(r, k) { return k === 2 ? r.s3 : k === 1 ? r.s2 : r; }
  function hasDist(c, i) { return +(c.holes[i] && c.holes[i][1]) > 0; }
  function slAt(c, i) { var s = (c.slope || [])[i]; return s === 'up' || s === 'down' ? s : ''; }
  /** v9 주의하기 · 조심하기(코스에 하나, 홀마다) */
  function caAt(c, i) { var x = (c.ca || [])[i]; if (!x || typeof x !== 'object') { var sl = slAt(c, i); x = { u: sl === 'up' ? ['오르막'] : [], d: sl === 'down' ? ['내리막'] : [], z: [], ut: '', dt: '', zt: '' }; } x.u = x.u || []; x.d = x.d || []; x.z = x.z || []; return x; }
  function caParts(c, i) { var x = caAt(c, i); return { u: x.u.concat(x.ut ? [x.ut] : []), d: x.d.concat(x.dt ? [x.dt] : []), z: x.z.concat(x.zt ? [x.zt] : []) }; }
  function caN(c, i) { var p = caParts(c, i); return p.u.length + p.d.length + p.z.length; }
  /** 주의 · 조심 낱말을 모두 한 번에(“외 2” 없이) — 바로 아래에 기록이 붙어요 */
  function caTags(c, i) { var p = caParts(c, i), t = function (a, cls, ar) { return a.map(function (w) { return '<span class="cat ' + cls + '">' + ar + ' ' + esc(w) + '</span>'; }).join(''); }; var h = t(p.u, 'u', '↑') + t(p.d, 'd', '↓') + t(p.z, 'z', '⚠'); return h ? '<div class="catags">' + h + '</div>' : ''; }
  LZ.lay2At = lay2At; LZ.nSh = nSh; LZ.caAt = caAt;
  function shotDist(c, i, k) { var hm = +c.holes[i][1], L = layAt(c, i), M = lay2At(c, i); if (!L) return hm; if (!k) return L; if (M) return k === 1 ? M : LZ.r1(hm - L - M); return LZ.r1(hm - L); }
  function baseOf(c, i, k, v) { return LZ.sugOf(shotDist(c, i, k), v.g, v.h); }
  LZ.layAt = layAt; LZ.slAt = slAt;
  function bar9(v, cls) { var b = LZ.bsParts(v); return '<span class="bar9 ' + (cls || '') + '" aria-hidden="true"><span class="bl">' + b.lo + '</span><span class="bt"><i style="left:' + b.pos + '%"></i></span><span class="bh">' + b.hi + '</span></span>'; }
  /** 기준과 차이: 1 이내 ● · 주의가 있으면 "크게 +1.5"(설명된 차이) · 없으면 ▲▼ */
  function dTxt(p, s, sl) { var d = LZ.dvOf(p, s); if (!d) return '<span class="okd" aria-label="기준과 1 이내">●</span>'; return '<span class="dvt">' + (sl ? (sl === 'up' ? '크게 ' : '작게 ') + (d > 0 ? '+' : '−') : (d > 0 ? '▲' : '▼')) + LZ.fmtP(Math.abs(d)) + '</span>'; }
  function slTag(sl) { return sl === 'up' ? '↑ 강하게' : sl === 'down' ? '↓ 약하게' : '없음'; }
  function distH(c, i) { if (!hasDist(c, i)) return '<span class="dm none">거리 –</span>'; var sl = slAt(c, i); return '<span class="dm' + (sl ? ' ' + (sl === 'up' ? 'up' : 'dn') : '') + '">' + LZ.fmtM(c.holes[i][1]) + 'm' + (sl ? (sl === 'up' ? '↑' : '↓') : '') + '</span>'; }
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
      if (nSh(c, i) === 3) return { all: nm + ' · 세 번 끊는 홀은 평균이 없어요' };
      if (a && a.s) return { s: [tk(nm + ' ' + cmpTxt(a.s[0].lr, LZ.sugOf(a.s[0].m, v.g, v.h))), tk(nm + ' ' + cmpTxt(a.s[1].lr, LZ.sugOf(a.s[1].m, v.g, v.h)))] };
      return { all: one ? tk(nm + ' · 한 번에 ' + cmpTxt(a.lr, LZ.sugOf(a.m, v.g, v.h))) : nm + ' 없음' };
    }
    var pk = d.pick, o = pk && pk.recs[i], nk = pk ? pk.nick : '클럽 회원';
    if (!o || !o.r) return L ? { all: pk ? esc(nk) + ' 기록 없음' : '공개한 회원 없음' } : { one: pk ? esc(nk) + ' 기록 없음' : '공개한 회원 없음' };
    var p1 = LZ.conv(o.p, o.g, o.h, v.g, v.h);
    if (!L) return { one: tk(esc(nk) + ' ' + cmpTxt(lrOf(o), p1)) };
    if (o.s2 && (nSh(c, i) === 3) === !!o.s3) return { s: [tk(esc(nk) + ' ' + cmpTxt(lrOf(o), p1)), tk(esc(nk) + ' ' + cmpTxt(lrOf(o.s2), LZ.conv(o.s2.p, o.g, o.h, v.g, v.h)))].concat(o.s3 ? [tk(esc(nk) + ' ' + cmpTxt(lrOf(o.s3), LZ.conv(o.s3.p, o.g, o.h, v.g, v.h)))] : []) };
    return { all: tk(esc(nk) + ' · 한 번에 ' + cmpTxt(lrOf(o), p1)) };
  }
  /** 홀 한 칸(코스·쉬는/끝 화면 같은 모양): 홀 | 거리·파 | 방향·좌우 / 기준 | 볼스피드 / 막대, 끊어 홀은 1st(모래)·2nd(민트) 줄 */
  function recBox(c, i, k, r, x, v, sl, cm, lay) {
    var base = baseOf(c, i, k, v), lab = lay ? '<span class="shb">' + SHN[k] + '</span> ' + LZ.fmtM(shotDist(c, i, k)) + 'm · ' : '';
    if (!x) return '<div class="rec9' + (lay ? ' s' + (k + 1) : '') + ' e"><div class="l"><small>' + lab + '아직 없음</small><span class="lr0">–</span><small>기준 ' + LZ.bsTxt(base) + '</small></div><b class="bs">' + LZ.bsTxt(base) + '</b>' + (cm ? '<div class="cm">' + cm + '</div>' : '') + '</div>';
    var mv = LZ.conv(x.p, r.g, r.h, v.g, v.h);
    return '<div class="rec9' + (lay ? ' s' + (k + 1) : '') + '"><div class="l"><small>' + lab + esc(LZ.refTxt(x)) + '</small><span class="lr">' + LZ.lrTxt(x) + '</span><small>기준 ' + LZ.bsTxt(base) + ' ' + dTxt(mv, base, sl) + '</small></div><b class="bs" data-bs="' + mv + '">' + LZ.bsTxt(mv) + '</b>' + (cm ? '<div class="cm">' + cm + '</div>' : '') + '</div>';
  }
  function holeRow(d, i, v, mode, o) {
    o = o || {};
    var c = d.course, h = c.holes[i], r = d.mine[i], L = layAt(c, i), ns = nSh(c, i), sl = slAt(c, i), ed = !o.ro && EDIT === c.id, cm = cmpOf(d, i, v, mode) || {};
    var act = ' data-act="' + (o.act || 'hHole') + '" data-v="' + i + '" role="button" tabindex="0"';
    var nt = r.r && r.o ? '<span class="ntb" role="button" tabindex="0" data-act="cNote" data-v="' + i + '" aria-expanded="' + (NOTE === i) + '" aria-label="' + (i + 1) + '홀 메모 ' + (NOTE === i ? '닫기' : '보기') + '">' + LZ.ic('notef', 'nt') + '</span>' : '';
    var head = '<div class="hh9"' + act + ' aria-label="' + (i + 1) + '홀 플레이">' + LZ.hn9(i + 1) + '<span class="hm">' + LZ.parMk(h[0]) + ' · ' + distH(c, i) + (L ? ' · <span class="cutn">끊어치기 ' + ns + '번</span>' : '') + '</span>' + nt + '</div>';
    var edr = ed ? '<div class="edch"><button type="button" class="lchip' + (L ? ' on' : '') + '" data-act="cLay" data-v="' + i + '">끊어치기 · ' + (L ? ns + '번' : '없음') + ' ▾</button><button type="button" class="lchip' + (caN(c, i) ? ' on' : '') + '" data-act="cSlope" data-v="' + i + '">주의 · ' + (caN(c, i) ? caN(c, i) + '개' : '없음') + ' ▾</button></div>' : '';
    var extra = (o.note ? '<div class="cnote">' + o.note + '</div>' : '') + (r.chg && !o.ro ? '<div class="cnote chg">기준 바뀜 · 예전 값은 플레이 › 메모 ▾</div>' : '') + (NOTE === i && r.o ? '<div class="cnote open">메모 · ' + hiNote(r.o) + '</div>' : '');
    var body;
    if (!hasDist(c, i)) body = '<div class="rec9 none"' + act + '>파 · 거리는 플레이하며 넣어요</div>';
    else if (!L) body = '<div' + act + '>' + recBox(c, i, 0, r, r.r ? r : null, v, sl, cm.one || '', false) + '</div>';
    else { body = '<div class="subs9"' + act + '>'; var s3 = cm.s || []; for (var k = 0; k < ns; k++) body += recBox(c, i, k, r, r.r ? shotOf(r, k) : null, v, sl, s3[k] || '', true); body += (cm.all ? '<div class="cm">' + cm.all + '</div>' : '') + '</div>'; }
    return '<div class="hb9' + (r.r ? '' : ' e') + '">' + head + caTags(c, i) + edr + body + extra + '</div>';
  }

  /* ═════════ 코스 화면(v8) ═════════ */
  var EDIT = '', NOTE = -1;
  function fixRecs(d) { if (!d.mine || !d.mine.length) d.mine = []; for (var i = 0; i < 18; i++) d.mine[i] = d.mine[i] || emptyRec(); if (!d.authors) d.authors = []; if (!d.clubs) d.clubs = []; if (!d.cmp) d.cmp = { id: '', name: '', n: 0 }; if (d.pub === undefined) d.pub = 1; if (d.course) { ['lay', 'slope', 'lay2', 'ca', 'hEd'].forEach(function (k) { if (!d.course[k]) d.course[k] = []; }); } return d; }
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
    var c = d.course, v = viewOf(d), bm = basisOf(d), n = nOf(c), start = playAt(d), mode = cmpMode(d);
    var diff = v.g !== bm.g || v.h !== bm.h, filled = d.mine.slice(0, n).filter(function (r) { return r.r; }).length, ed = EDIT === c.id;
    var cmpName = mode === 'avg' ? '클럽 평균' : mode === 'mem' ? (d.pick ? d.pick.nick : '클럽 회원') : '끔';
    var empt = 0; if (mode === 'mem' && d.pick) d.pick.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) empt++; });
    var A = '', B = ''; for (var i = 0; i < Math.min(9, n); i++) A += holeRow(d, i, v, mode); for (var j = 9; j < n; j++) B += holeRow(d, j, v, mode);
    var more = '<button type="button" class="tb" data-act="cMore" aria-label="더보기" title="더보기">' + LZ.ic('more') + '</button>';
    var colh = '<div class="colh9"><span>홀</span><span>방향 · 좌우</span><span>볼스피드</span></div>';
    return LZ.hdr('코스', { back: true, btns: more }) + '<div class="wrap cpage cpage9">' +
      '<h1 class="ct9">' + esc(c.name) + '</h1>' +
      '<div class="cap9">' + n + '홀 · ' + LZ.stars(c.stars) + ' · ' + (filled >= n ? '기록 완료' : filled + '홀 기록') + ' · <button type="button" class="pubc9" data-act="hPubSheet">' + LZ.ic(d.pub ? 'unlock' : 'lock') + (d.pub ? '공개' : '비공개') + '</button></div>' +
      '<div class="cbtn9"><button type="button" class="btn" data-act="hPlay" data-v="' + start + '">' + (start > 0 ? '이어서 · ' + (start > 8 ? (start - 8) + '홀 (' + (start + 1) + ')' : (start + 1) + '홀') : '플레이 시작') + '</button>' + (n === 18 ? '<button type="button" class="btn g" data-act="hPlay" data-v="9">후반부터</button>' : '') + '</div>' +
      (c.stage === 'front' && (c.mineReg || S.user.kind === 'admin') ? '<button type="button" class="btn g" data-go="reg" data-p=\'' + esc(JSON.stringify({ id: c.id, half: 1, name: c.name })) + '\'>후반 9홀 등록 마치기 ›</button>' : '') +
      '<div class="pills9"><button type="button" class="pill9" data-act="hHl">' + (diff ? '<span class="dot" aria-label="기록 기준과 다름"></span>' : '') + '<span>' + LZ.MODE[v.g] + ' · ' + LZ.HL[v.h] + '</span>' + LZ.ic('down') + '</button>' +
      '<button type="button" class="pill9' + (mode !== 'off' ? ' on' : '') + '" data-act="hCmpSheet"' + (!d.clubs.length ? ' aria-disabled="true"' : '') + '><span>' + (mode === 'off' ? '비교 끔' : esc(cmpName)) + '</span>' + LZ.ic('down') + '</button></div>' +
      (diff ? '<p class="fn9">기록은 ' + LZ.modeTxt(bm) + '로 적었어요 · 지금은 ' + LZ.modeTxt(v) + '로 바꿔 보여요</p>' : '') +
      (empt ? '<div class="imp9"><div><small>클럽 회원 기록 가져오기</small><b>' + LZ.nimE(d.pick.nick) + ' · 빈 홀 ' + empt + '개</b></div><button type="button" class="btn" data-act="importAll">가져오기</button></div>' : '') +
      (ed ? '<div class="edbar"><div><b>끊어치기 · 주의 고치는 중</b><span>홀마다 [끊어치기 ▾] · [주의 ▾] · 코스에 하나 · 포인트 없음</span></div><button type="button" class="btn" data-act="cEdit" data-v="0">완료</button></div>' : '') +
      colh + '<div class="hdr9">전반 · 1–9홀</div><div class="grp9 holes9">' + A + '</div>' +
      (B ? '<div class="hdr9">후반 · 1–9홀 (10–18홀)</div><div class="grp9 holes9">' + B + '</div>' : '') +
      (mode !== 'off' ? '<p class="fn9">' + esc(cmpName) + ' 기록도 ' + LZ.modeTxt(v) + LZ.ro(LZ.HL[v.h]) + ' 바꿔 보여요. 기록 칸 아래 글을 누르면 그 홀에 가져와요.' + (mode === 'avg' ? ' 평균은 공개한 회원 3명부터 보여요.' : '') + '</p>' : '') +
      '<p class="fn9">↑ 강하게 · ↓ 약하게 · ⚠ 조심하기 · 끊어치는 홀은 1st · 2nd · 3rd 색 줄 · 홀을 누르면 그 홀부터 플레이</p>' +
      '<button type="button" class="lnk" data-act="cEdit" data-v="' + (ed ? 0 : 1) + '">끊어치기 · 주의 고치기' + (ed ? ' 완료' : '') + '</button></div>';
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
    LZ.sheet('<h2>' + esc(c.name) + '</h2>' + '<button type="button" class="opt" data-act="cEdit" data-v="1"><b>끊어치기 · 주의 고치기</b><span>홀마다 끊는 거리 · 강하게/약하게 · 조심하기 · 포인트 없음</span></button>' +
      (c.canEdit ? '<button type="button" class="opt" data-act="cInfoEdit"><b>코스 정보 고치기</b><span>이름 · 난이도 · 홀별 파·거리 · 기록 기준</span></button>' : '') +
      '<button type="button" class="opt" data-act="hPubSheet"><b>공개 · 비공개</b><span>지금 ' + (CUR.d.pub ? '공개' : '비공개') + '</span></button>' +
      '<button type="button" class="opt" data-act="cHide"><b>내 수첩에서 빼기</b><span>기록은 남아요 · 다시 가져오면 돌아와요</span></button>');
  };
  LZ.act.cInfoEdit = function () { LZ.closeSheet(); LZ.go('courseEdit', { id: CUR.d.course.id }); };
  LZ.act.cEdit = function (el, v) { LZ.closeSheet(); EDIT = v === '1' ? CUR.d.course.id : ''; if (EDIT && CUR.d.course.stage === 'done' && (store.get('lz.half2.' + EDIT) || 'f') === 'f') { /* 그대로 */ } LZ.redraw(); };
  /** 끊는 거리·주의 바꾸기(코스에 하나): 다른 분 기록이 있으면 "n명의 기준이 바뀌어요" 확인 */
  async function layApply(i, ch) {
    var d = CUR.d, c = d.course, body = Object.assign({ id: c.id, i: i }, ch);
    try {
      var r = await LZ.api('courseLay', body);
      if (r.need) {
        if (!(await LZ.confirm(r.need + '명의 기준이 바뀌어요', '이 홀을 기록한 회원님 ' + r.need + '명의 기록에 "기준 바뀜"이 붙어요. 예전 값은 되돌릴 수 있어요. 포인트는 생기지 않아요.', '바꾸기'))) return false;
        r = await LZ.api('courseLay', Object.assign({ confirm: 1 }, body));
      }
      c.lay = c.lay.slice(); c.slope = c.slope.slice(); c.lay[i] = r.lay; c.slope[i] = r.slope; c.lay2 = (c.lay2 || []).slice(); c.lay2[i] = r.lay2 || 0; c.ca = (c.ca || []).slice(); if (r.ca) c.ca[i] = r.ca;
      CUR.at = 0; await loadCourse(c.id, true); LZ.cacheSet && LZ.cacheSet('course2:' + c.id + '|' + (store.get('lz.cmpBr') || '') + '|' + (store.get('lz.who.' + c.id) || ''), CUR.d);
      return true;
    } catch (e) { LZ.toast(LZ.errText(e), 5000); return false; }
  }
  LZ.layApply = layApply;
  LZ.act.cLay = function (el, i) { cutSheet(+i, false); };
  LZ.act.cSlope = function (el, i) { caSheet(+i, false); };
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
      if (L && a.s && nSh(c, i) === 2) rec = { r: 'f', t: '', d: a.s[0].lr < 0 ? 'L' : 'R', n: Math.abs(a.s[0].lr), p: LZ.sugOf(a.s[0].m, bm.g, bm.h), s2: { r: 'c', t: '', d: a.s[1].lr < 0 ? 'L' : 'R', n: Math.abs(a.s[1].lr), p: LZ.sugOf(a.s[1].m, bm.g, bm.h) } };
      else if (!a.none) rec = { r: 'f', t: '', d: a.lr < 0 ? 'L' : 'R', n: Math.abs(a.lr), p: LZ.sugOf(a.m, bm.g, bm.h) };
      if (rec) rec.o = cur.o || '';
      return rec ? { rec: rec, who: '클럽 평균' } : null;
    }
    var o = d.pick && d.pick.recs[i]; if (!o || !o.r) return null;
    rec = { r: o.r, t: o.t, d: o.d, n: o.n, p: LZ.conv(o.p, o.g, o.h, bm.g, bm.h), o: o.o || cur.o || '' };
    if (L && o.s2) rec.s2 = { r: o.s2.r, t: o.s2.t || '', d: o.s2.d, n: o.s2.n, p: LZ.conv(o.s2.p, o.g, o.h, bm.g, bm.h) };
    if (rec.s2 && lay2At(c, i) && o.s3) rec.s3 = { r: o.s3.r, t: o.s3.t || '', d: o.s3.d, n: o.s3.n, p: LZ.conv(o.s3.p, o.g, o.h, bm.g, bm.h) };
    return { rec: rec, who: LZ.nim(d.pick.nick) + ' 기록' };
  }
  LZ.act.cmpTake = async function (el, i) {
    i = +i; var d = CUR.d, bm = basisOf(d), mode = cmpMode(d), cur = d.mine[i], t = takeRec(d, i, bm); if (!t) return;
    var rec = t.rec, sh = function (x) { return LZ.refTxt(x) + ' ' + LZ.lrPlain(x) + ' · 볼스피드 ' + LZ.bsTxt(x.p); };
    if (!(await LZ.confirm((i + 1) + '홀에 ' + t.who + '을 가져올까요?', (cur.r ? '지금 내 기록(' + sh(cur) + ')이 바뀌어요. ' : '') + LZ.MODE[bm.g] + ' · ' + LZ.HL[bm.h] + ' 기준으로 바꿔서 넣어요: ' + sh(rec) + (rec.s2 ? ' / 2nd ' + sh(rec.s2) : '') + '. 가져온 뒤 내 손에 맞게 고치세요.', '가져오기'))) return;
    rec = Object.assign({}, cur, rec, { g: bm.g, h: bm.h, i: cur.i || '', hs: cur.hs || [] }); if (!layAt(d.course, i)) delete rec.s2; if (!rec.s2 || !lay2At(d.course, i)) delete rec.s3; delete rec.chg;
    try {
      var out = await LZ.api('save', { cid: d.course.id, items: [{ i: i, rec: rec }], g: bm.g, h: bm.h });
      d.mine[i] = Object.assign({}, rec, { upd: out.upd }); if (!d.mode) d.mode = out.mode || { g: bm.g, h: bm.h };
      if (mode === 'mem') LZ.api('use', { cid: d.course.id, from: d.pick.uid, cmp: d.cmp.id }).catch(function () {});
      LZ.toast((i + 1) + '홀에 가져왔어요'); LZ.redraw();
    } catch (e) { LZ.toast(LZ.errText(e), 5000); }
  };
  LZ.act.importAll = async function () {
    var d = CUR.d, src = d.pick, bm = basisOf(d), n = nOf(d.course), items = [];
    src.recs.forEach(function (r, i) { if (i < n && r.r && !d.mine[i].r) { var x = Object.assign({}, r, { p: LZ.conv(r.p, r.g, r.h, bm.g, bm.h), g: bm.g, h: bm.h, i: '', hs: [] }); delete x.ohs; delete x.chg; if (r.s2 && layAt(d.course, i)) x.s2 = Object.assign({}, r.s2, { p: LZ.conv(r.s2.p, r.g, r.h, bm.g, bm.h) }); else delete x.s2; if (x.s2 && r.s3 && lay2At(d.course, i)) x.s3 = Object.assign({}, r.s3, { p: LZ.conv(r.s3.p, r.g, r.h, bm.g, bm.h) }); else delete x.s3; items.push({ i: i, rec: x }); } });
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
  /** 새 샷 기본값: 마지막 샷은 홀컵, 그 앞 샷은 첫화면에서 */
  function newShot(c, i, k, v, a) { var last = k > 0 && k === nSh(c, i) - 1; return { r: last ? 'c' : 'f', t: '', d: a && a.lr < 0 ? 'L' : 'R', n: a ? Math.abs(a.lr) : 0, p: LZ.half(a ? LZ.sugOf(a.m, v.g, v.h) : baseOf(c, i, k, v)) }; }
  /* ═════════ 플레이(v9): 위 = 홀 · 가운데 = 샷 구역(1st · 2nd · 3rd) · 아래 = 조정 칸. “다음” = 저장하고 넘어가기 ═════════ */
  LZ.screens.play = {
    wake: true, nobar: true,
    show: async function (p, root, alive) {
      root.innerHTML = playHdr() + LZ.skeleton(3);
      var d = await loadCourse(p.id); if (!alive()) return;
      var c = d.course, n = nOf(c);
      plState(c.id);
      if (p.done) { ED = null; paintDone(root, d, p.done); return; }
      var i = Math.max(0, Math.min(n - 1, p.hole || 0)), v = viewOf(d);
      store.set('lz.playAt.' + c.id, String(i));
      if (!hasDist(c, i)) { ED = { d: d, i: i, empty: true, r: clone(d.mine[i]), v: v, shot: 0, dirty: false, isNew: true }; LZ.guard = null; paintPlay(root); if (p.auto !== 0 && hdEditable(c, i)) setTimeout(function () { if (ED && ED.i === i && ED.empty) LZ.act.plHd(); }, 200); return; }
      var bm = basisOf(d), L = layAt(c, i), M = lay2At(c, i), ns = nSh(c, i);
      if (PL.orig[i] === undefined) { PL.orig[i] = clone(d.mine[i]); plKeep(); }
      var r = clone(d.mine[i]), isNew = !r.r, av = d.avg && d.avg[i], a1 = av && !av.none && !L ? av : av && av.s && ns === 2 ? av.s[0] : null, a2 = av && av.s && ns === 2 ? av.s[1] : null;
      var sim = isNew && !L && !a1 ? simRec(d, i) : null;
      if (sim) a1 = { m: LZ.distOf(LZ.conv(sim.r.p, sim.r.g, sim.r.h, v.g, v.h), v.g, v.h) + (+c.holes[i][1] - sim.m), lr: lrNum(sim.r) };   // 거리 차이만큼 볼스피드를 옮겨요
      if (isNew) { var s0 = newShot(c, i, 0, v, a1); r.g = bm.g; r.h = bm.h; r.r = sim ? sim.r.r : 'f'; r.t = sim ? sim.r.t || '' : ''; r.d = s0.d; r.n = s0.n; r.p = LZ.conv(s0.p, v.g, v.h, bm.g, bm.h); }
      var fresh2 = false, fresh3 = false;
      if (L && !r.s2) { var x2 = newShot(c, i, 1, v, a2); x2.p = LZ.conv(x2.p, v.g, v.h, r.g, r.h); r.s2 = x2; fresh2 = !isNew; }
      if (M && !r.s3) { var x3 = newShot(c, i, 2, v, null); x3.p = LZ.conv(x3.p, v.g, v.h, r.g, r.h); r.s3 = x3; fresh3 = !isNew; }
      if (!L) delete r.s2; if (!M) delete r.s3;
      ED = { d: d, i: i, r: r, isNew: isNew, dirty: fresh2 || fresh3, v: v, shot: Math.max(0, Math.min(ns - 1, +p.shot || 0)), note: false, disp: [] };
      ED.disp[0] = isNew ? newShot(c, i, 0, v, a1).p : LZ.conv(r.p, r.g, r.h, v.g, v.h);
      if (L) ED.disp[1] = isNew || fresh2 ? newShot(c, i, 1, v, a2).p : LZ.conv(r.s2.p, r.g, r.h, v.g, v.h);
      if (M) ED.disp[2] = isNew || fresh3 ? newShot(c, i, 2, v, null).p : LZ.conv(r.s3.p, r.g, r.h, v.g, v.h);
      LZ.guard = { dirty: function () { return ED && ED.dirty; }, ask: async function () { var x = await LZ.dialog({ title: '고친 내용을 저장할까요?', cancel: 'stay', buttons: [{ label: '저장하고 나가기', kind: 'y', value: 'save' }, { label: '저장하지 않고 나가기', kind: 'r', value: 'drop' }, { label: '계속 고치기', kind: 'g', value: 'stay' }] }); if (x === 'save') return await plSaveHole(); return x === 'drop'; } };
      paintPlay(root);
      if (p.auto && sayOn()) setTimeout(function () { if (ED && ED.i === i) LZ.act.sayNow(); }, 250);
    }
  };
  /** 비슷한 거리 홀(같은 코스 · 같은 파 · ±3m · 한 번에 치는 홀)의 내 기록 — 처음 적는 홀의 시작 값으로 */
  function simRec(d, i) { var c = d.course, h = c.holes[i], best = null; for (var j = 0; j < 18; j++) { var r = d.mine[j]; if (j === i || !r.r || layAt(c, j) || !hasDist(c, j) || +c.holes[j][0] !== +h[0]) continue; var df = Math.abs(c.holes[j][1] - h[1]); if (df <= 3 && (!best || df < best.df)) best = { df: df, r: r, m: +c.holes[j][1] }; } return best; }
  function curShot() { return shotOf(ED.r, ED.shot) || ED.r; }
  function hdEditable(c, i) { return !!(c.hEd && c.hEd[i]) || !!c.canEdit || S.user.kind === 'admin'; }
  function parLine(c, i) { var h = c.holes[i]; return LZ.parMk(h[0]); }
  function playHead() {
    var d = ED.d, c = d.course, i = ED.i, h = c.holes[i], v = ED.v, bm = basisOf(d), vdiff = v.g !== bm.g || v.h !== bm.h, sl = slAt(c, i), nx = i + 1 < nOf(c) ? i + 1 : -1;
    return '<div class="cname">' + esc(c.name) + '</div>' +
      '<div class="hh phd">' + LZ.hn9(i + 1, 'xl') + '<span class="hpar">' + parLine(c, i) + '</span><span class="hmode' + (vdiff ? '' : ' off') + '">' + (vdiff ? LZ.modeTxt(v) : '') + '</span>' +
      (hasDist(c, i) ? '<button type="button" class="hdist' + (sl ? (sl === 'up' ? ' up' : ' dn') : '') + '" data-act="plHd" aria-label="' + (i + 1) + '홀 파 · 거리 고치기">' + LZ.fmtM(h[1]) + '<small>m</small>' + (sl ? (sl === 'up' ? '↑' : '↓') : '') + '</button>' : '') + '</div>' +
      (nx >= 0 && hasDist(c, nx) ? '<div class="nxp" aria-label="다음 홀 미리 보기">다음 ' + (nx > 8 ? (nx - 8) + '홀 (' + (nx + 1) + '홀)' : (nx + 1) + '홀') + ' · ' + LZ.parMk(c.holes[nx][0]) + ' · ' + LZ.fmtM(c.holes[nx][1]) + 'm' + (nSh(c, nx) > 1 ? ' · 끊어치기 ' + nSh(c, nx) + '번' : '') + '</div>' : '');
  }
  function playBody() {
    var d = ED.d, c = d.course, i = ED.i, r = ED.r, v = ED.v, L = layAt(c, i), ns = nSh(c, i), sl = slAt(c, i), lay = !!(L && r.s2), sh = lay ? ED.shot : 0;
    if (ED.empty) return playHead() + caTags(c, i) + '<div class="hdempty"><p>' + (i + 1 > 9 ? (i - 8) + '홀 (' + (i + 1) + '홀)' : (i + 1) + '홀') + ' 파 · 거리가 아직 없어요.<br>스크린에 나온 대로 넣어 주세요.</p>' +
      (hdEditable(c, i) ? '<button type="button" class="btn" data-act="plHd">파 · 거리 넣기</button>' : '<p class="muted">이용 중인 회원님이 넣을 수 있어요.</p>') + '</div>';
    var dim = ED.isNew && !ED.dirty;
    var dirI = LZ.kw('방향 · 좌우', '<b>방향</b>은 어디서 잰 칸인지예요: <b>첫화면</b> · <b>홀컵</b> · <b>직접</b>(내가 정한 곳). ◀▶는 한 칸씩.' + (lay ? ' 끊어치는 홀은 샷마다 한 줄이에요. 줄을 누르면 아래 단추가 그 줄을 고쳐요. 마지막 샷은 처음에 <b>홀컵</b>이에요.' : ''));
    var bsI = LZ.kw('볼스피드', '<b>17~</b> = 17 넘게 18 전까지 · <b>~18</b> = 18까지 · 8 미만은 <b>Min</b>, 40 넘으면 <b>Max</b>. ▼▲는 0.5씩, 길게 누르면 빨리. 기준과 1 넘게 다르면 기준 줄에 차이가 보여요.' + (lay ? ' 샷마다 그 샷 거리로 기준을 계산해요.' : ''));
    var aim;
    if (lay) {
      var row = function (k) {
        var x = shotOf(r, k), dp = ED.disp[k], base = baseOf(c, i, k, v), bp = LZ.bsParts(dp);
        return '<button type="button" class="shotr zn s' + (k + 1) + (sh === k ? ' on' : '') + '" data-act="plShot" data-v="' + k + '" aria-pressed="' + (sh === k) + '" aria-label="' + SHN[k] + ' 고르기">' +
          '<span class="sl"><small><span class="shb">' + SHN[k] + '</span> ' + LZ.fmtM(shotDist(c, i, k)) + 'm · <b>' + esc(LZ.refTxt(x)) + '</b></small><span class="bv lrb">' + LZ.lrTxt(x) + '</span></span><span class="vl" aria-hidden="true"></span>' +
          '<span class="sl r"><small>기준 <b>' + LZ.bsTxt(base) + '</b> ' + dTxt(dp, base, sl) + '</small><span class="bv' + (sh === k ? ' pbig' : '') + (dim && !k ? ' dim' : '') + '" data-bs="' + bp.v + '">' + bp.t + '</span>' + bar9(dp, 'lgb') + '</span></button>';
      };
      var rows = ''; for (var k = 0; k < ns; k++) rows += row(k);
      aim = '<section class="aim lay" aria-label="방향, 좌우, 볼스피드"><div class="lbl" style="grid-area:1/1">' + dirI + '</div><div class="lbl r" style="grid-area:1/3">' + bsI + '</div><div class="shots n' + ns + '">' + rows + '</div></section>';
    } else {
      var base = baseOf(c, i, 0, v), b = LZ.bsParts(ED.disp[0]);
      aim = '<section class="aim" aria-label="방향, 좌우, 볼스피드"><div class="lbl" style="grid-area:1/1">' + dirI + '</div><div class="lbl r" style="grid-area:1/3">' + bsI + '</div><span class="dvd" aria-hidden="true"></span>' +
        (r.r === 'u' ? '<button type="button" class="val dirv dirb" style="grid-area:2/1" data-act="plDirect" aria-label="직접 위치 고치기"><span>' + esc(LZ.refTxt(r)) + '</span></button>' : '<div class="val dirv" style="grid-area:2/1"><span>' + esc(LZ.refTxt(r)) + '</span></div>') +
        '<div class="vref" style="grid-area:2/3">기준 <b>' + LZ.bsTxt(base) + '</b>' + dTxt(ED.disp[0], base, sl) + '</div>' +
        '<div class="val lrb' + (dim ? ' dim' : '') + '" style="grid-area:3/1" aria-live="polite">' + LZ.lrTxt(r) + '</div>' +
        '<div class="val bsv pbig' + (dim ? ' dim' : '') + '" style="grid-area:3/3" data-bs="' + b.v + '" aria-live="polite">' + b.t + '</div>' +
        '<div class="vbar" style="grid-area:4/3">' + bar9(ED.disp[0], 'lgb') + '</div></section>';
    }
    /* 최근 3번 값 */
    var hs = r.hs && r.hs.length ? r.hs.slice(-3).map(function (x) { return LZ.fmtDate(x[0]) + ' ' + LZ.bsTxt(LZ.conv(x[1], r.g, r.h, v.g, v.h)) + '(' + LZ.lrPlain({ d: x[2] < 0 ? 'L' : 'R', n: Math.abs(x[2] || 0) }) + ')'; }).join(' → ') : '';
    var oh = r.ohs && r.ohs.length ? r.ohs[r.ohs.length - 1] : null;
    if (oh && oh.one) { var ps = [oh.one].concat(oh.s2 ? [oh.s2] : []).concat(oh.s3 ? [oh.s3] : []); hs += (hs ? ' · ' : '') + '예전 ' + ps.map(function (x, k) { return (ps.length > 1 ? SHN[k] + ' ' : '') + esc(LZ.refTxt(x)) + ' ' + LZ.lrPlain(x) + ' ' + LZ.bsTxt(LZ.conv(x.p, r.g, r.h, v.g, v.h)); }).join(' · '); }
    var noteTx = r.o ? hiNote(r.o) : '없음';
    var cutTx = L ? '끊어치기 <b>' + ns + '번</b>' : '끊어치기';
    return playHead() +
      '<div class="opts"><button type="button" class="chip oc" data-act="plLaySheet"><span class="ot">' + cutTx + '</span>' + LZ.ic('down') + '</button>' +
      '<button type="button" class="chip oc" data-act="plSlope"><span class="ot">' + (caN(c, i) ? '주의 <b>' + caN(c, i) + '</b>' : '주의하기') + '</span>' + LZ.ic('down') + '</button></div>' +
      caTags(c, i) + aim +
      '<button type="button" class="nrow" data-act="plNoteTgl" aria-expanded="' + !!ED.note + '" aria-controls="notep"><span class="lb">메모</span><span class="tx' + (r.o ? '' : ' e') + '">' + (r.chg ? '<b class="chgt">기준 바뀜</b> · ' : '') + noteTx + '</span>' + LZ.ic('down') + '</button>' +
      '<div class="notep" id="notep"' + (ED.note ? '' : ' hidden') + '>' + (r.o ? '<div class="full">' + hiNote(r.o) + '</div>' : '') + '<input type="text" id="plO" maxlength="20" value="' + esc(r.o) + '" placeholder="예: 맞바람, **반 칸** 세게" aria-label="메모(20자)">' +
      (r.chg ? '<p class="chgn">다른 회원님이 끊는 거리 · 주의를 바꿔서 기준이 바뀌었어요. 확인하고 저장하면 표시가 없어져요.</p>' : '') +
      '<div class="hs"><span>' + (hs ? '지난 값 ' + hs : '지난 값 없음') + '</span>' + ((r.ohs && r.ohs.length) || (r.hs && r.hs.length) ? '<button type="button" data-act="plUndo">예전 값으로</button>' : '') + '</div></div>';
  }
  function playFix() {
    var d = ED.d, c = d.course, i = ED.i, n = nOf(c), ns = nSh(c, i), lay = !ED.empty && !!(layAt(c, i) && ED.r.r && ED.r.s2), sh = lay ? ED.shot : 0, sx = ED.empty ? null : curShot();
    var st = ED.empty ? '파 · 거리를 넣으면 기록할 수 있어요' : ED.dirty ? '● 고침 · “다음”을 누르면 저장' : ED.isNew ? '기준값 · “다음”을 누르면 수첩에 적혀요' : '내 수첩 기록이에요';
    var nxt = lay && sh < ns - 1 ? SHN[sh + 1] + ' ›' : (i >= n - 1 ? '끝내기 ›' : '다음 ›');
    var nav = '<div class="pbar2"><div class="pst saved' + (ED.dirty ? ' no' : '') + '">' + (lay ? SHN[sh] + ' · ' : '') + st + '</div><div class="pbtns pnav"><button type="button" class="btn g" data-act="plNav" data-v="-1"' + (i <= 0 && !sh ? ' disabled' : '') + '>‹ ' + (sh ? SHN[sh - 1] : '이전') + '</button><button type="button" class="btn" data-act="plNext">' + nxt + '</button></div></div>';
    if (ED.empty) return '<div class="pfix" id="pfix">' + nav + '</div>';
    return '<div class="pfix" id="pfix"><div class="ctlp"><div class="ctr2"><button type="button" class="stp tri" data-act="plLr" data-v="-1" aria-label="좌로 한 칸">' + LZ.ic('tl') + '</button><button type="button" class="stp tri" data-act="plLr" data-v="1" aria-label="우로 한 칸">' + LZ.ic('tr') + '</button></div>' +
      '<span class="vd" aria-hidden="true"></span><div class="ctr2"><button type="button" class="stp tri" data-act="plP" data-v="-0.5" data-hold="1" aria-label="볼스피드 0.5 낮추기">' + LZ.ic('td') + '</button><button type="button" class="stp tri" data-act="plP" data-v="0.5" data-hold="1" aria-label="볼스피드 0.5 높이기">' + LZ.ic('tu') + '</button></div>' +
      '<div class="seg ref3" role="group" aria-label="방향">' + [['f', '첫화면'], ['c', '홀컵'], ['u', '직접']].map(function (x) { return '<button type="button" class="' + (sx.r === x[0] ? 'on' : '') + '" data-act="plRef" data-v="' + x[0] + '" aria-pressed="' + (sx.r === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' + nav + '</div>';
  }
  /* 조정 칸(#pfix)은 모든 홀에서 같은 자리. 그 위 내용은 자기 칸(.play3) 안에서만 스크롤 */
  function fitPad() {
    var f = $('#pfix'), w = $('.play3'); if (!f || !w) return;
    window.scrollTo(0, 0);
    var top = w.getBoundingClientRect().top, h = Math.max(160, Math.floor(f.getBoundingClientRect().top - top));
    w.style.height = h + 'px'; w.style.paddingBottom = '';
  }
  function paintPlay(root) {
    root = root || $('#app');
    root.innerHTML = playHdr() + '<div class="wrap play3 play2 v9play">' + playBody() + '</div>' + playFix();
    fitPad();
    var o = $('#plO'); if (o) o.addEventListener('input', function () { ED.r.o = o.value; ED.dirty = true; var t = $('.nrow .tx'); if (t) { t.innerHTML = o.value ? hiNote(o.value) : '없음'; t.classList.toggle('e', !o.value); } var ps = $('.pfix .pst'); if (ps) { ps.textContent = '● 고침 · “다음”을 누르면 저장'; ps.classList.add('no'); } });
  }
  window.addEventListener('resize', function () { if (LZ.cur && LZ.cur().name === 'play') fitPad(); });
  function rep() { var w = $('.play3'), y = w ? w.scrollTop : 0; paintPlay(); w = $('.play3'); if (w) w.scrollTop = y; }
  LZ.act.plP = function (el, v) {
    if (!ED || ED.empty) return;
    var k = ED.shot && shotOf(ED.r, ED.shot) ? ED.shot : 0, x = ED.disp[k], st = +v, nx = LZ.clampP(LZ.r1(st > 0 ? Math.floor(x * 2 + 1e-6) / 2 + 0.5 : Math.ceil(x * 2 - 1e-6) / 2 - 0.5));   // 0.5 칸에 맞춰 움직임 · 7.5 = Min · 40.5 = Max
    if (nx === x) return;
    ED.disp[k] = nx; shotOf(ED.r, k).p = LZ.conv(nx, ED.v.g, ED.v.h, ED.r.g, ED.r.h); ED.dirty = true; rep();
  };
  /* 길게 누르면 빨리(▼▲): 0.4초 뒤부터 0.1초마다 */
  var holdT = 0, holdI = 0;
  function holdStop() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = 0; }
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest('[data-hold]'); if (!b) return; holdStop(); holdT = setTimeout(function () { holdI = setInterval(function () { var cur = $('[data-act="plP"][data-v="' + b.dataset.v + '"]'); if (!cur) return holdStop(); LZ.act.plP(cur, b.dataset.v); }, 100); }, 400); }, { passive: true });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { document.addEventListener(t, holdStop, { passive: true }); });
  LZ.act.plLr = function (el, v) { var r = curShot(), cur = Math.max(-10, Math.min(10, lrNum(r) + (+v))); r.d = cur < 0 ? 'L' : 'R'; r.n = Math.abs(cur); ED.dirty = true; rep(); };
  LZ.act.plRef = function (el, v) { var was = curShot().r; curShot().r = v; ED.dirty = ED.dirty || was !== v; rep(); if (v === 'u') LZ.act.plDirect(); };
  LZ.act.plDirect = function () {
    var x = curShot(), lay = !!(ED.r.s2 && layAt(ED.d.course, ED.i)), who = lay ? SHN[ED.shot] + ' ' : '';
    var d = LZ.sheet('<h2>' + who + '직접 · 어디서 잰 칸인지</h2><p class="muted" style="margin-top:0">20자까지 · 방향 자리에 그대로 보여요.</p><input type="text" id="plTx" class="in" maxlength="20" value="' + esc(x.t || '') + '" placeholder="예: 큰 나무 밑" aria-label="직접 위치(20자)" autocomplete="off"><p class="muted plcnt" style="text-align:right;margin:4px 2px 0"><span id="plTn">' + String(x.t || '').length + '</span>/20</p><button type="button" class="btn" data-act="plDirectSave">저장</button>');
    var t = $('#plTx', d); if (t) { t.addEventListener('input', function () { var n = $('#plTn', d); if (n) n.textContent = t.value.length; }); t.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); LZ.act.plDirectSave(); } }); setTimeout(function () { t.focus(); }, 60); }
  };
  LZ.act.plDirectSave = function () { var t = $('#plTx'), x = curShot(); if (!t) return; var v = t.value.replace(/\s+/g, ' ').trim().slice(0, 20); if (v !== (x.t || '') || x.r !== 'u') { x.t = v; x.r = 'u'; ED.dirty = true; } LZ.closeSheet(); rep(); };
  LZ.act.plShot = function (el, v) { ED.shot = Math.max(0, Math.min(nSh(ED.d.course, ED.i) - 1, +v || 0)); rep(); };
  LZ.act.plNote = LZ.act.plNoteTgl = function () { ED.note = !ED.note; rep(); if (ED.note) { var w = $('.play3'), np = $('#notep'); if (w && np) { var b = np.getBoundingClientRect(), wb = w.getBoundingClientRect(); if (b.bottom > wb.bottom) w.scrollTop += b.bottom - wb.bottom + 8; } var o = $('#plO'); if (o && !o.value) o.focus({ preventScroll: true }); } };
  LZ.act.plUndo = function () {
    var r = ED.r, v = ED.v, c = ED.d.course, bk = clone(r), bkD = ED.disp.slice(), bkDirty = ED.dirty;
    if (r.ohs && r.ohs.length) {
      var x = r.ohs[r.ohs.length - 1]; r.ohs = r.ohs.slice(0, -1);
      if (x.one) { r.r = x.one.r; r.t = x.one.t || ''; r.d = x.one.d; r.n = x.one.n; r.p = x.one.p; }
      if (x.s2 && layAt(c, ED.i)) r.s2 = clone(x.s2);
      if (x.s3 && lay2At(c, ED.i)) r.s3 = clone(x.s3);
    } else { var hs = r.hs, y = hs[hs.length - 1]; r.p = y[1]; r.d = y[2] < 0 ? 'L' : 'R'; r.n = Math.abs(y[2]); }
    ED.disp[0] = LZ.conv(r.p, r.g, r.h, v.g, v.h); if (r.s2) ED.disp[1] = LZ.conv(r.s2.p, r.g, r.h, v.g, v.h); if (r.s3) ED.disp[2] = LZ.conv(r.s3.p, r.g, r.h, v.g, v.h);
    ED.dirty = true; rep();
    LZ.undo ? LZ.undo('예전 값으로 바꿨어요 · “다음”을 누르면 저장', function () { ED.r = bk; ED.disp = bkD; ED.dirty = bkDirty; rep(); }) : LZ.toast('예전 값으로 바꿨어요');
  };
  async function plSaveHole() {
    if (!ED || ED.empty) return true; var d = ED.d, r = ED.r, i = ED.i, bm = basisOf(d), c = d.course;
    if (!ED.dirty && !ED.isNew) return true;
    if (S.user.st === 'expired') { LZ.toast('이용 기간이 끝나서 기록은 볼 수만 있어요', 4000); ED.dirty = false; return true; }
    var v = ED.v, rec = Object.assign({}, r, { vp: ED.disp[0] }); delete rec.chg;
    if (r.s2 && layAt(c, i)) rec.s2 = Object.assign({}, r.s2, { vp: ED.disp[1] }); else delete rec.s2;
    if (rec.s2 && r.s3 && lay2At(c, i)) rec.s3 = Object.assign({}, r.s3, { vp: ED.disp[2] }); else delete rec.s3;
    var body = { cid: c.id, items: [{ i: i, rec: rec }], g: bm.g, h: bm.h, vg: v.g, vh: v.h };
    try {
      var out = await LZ.api('save', body);
      if (Array.isArray(out.recs) && out.recs.length) { d.mine = out.recs; fixRecs(d); } else { d.mine[i] = Object.assign({}, r, { upd: out.upd }); delete d.mine[i].chg; }
      if (out.mode && out.mode.g) d.mode = out.mode; else if (!d.mode) d.mode = { g: bm.g, h: bm.h };
      if (out.switched) basisSwitched(d, out.switched.to);
      plState(c.id).pts += out.pts || (out.bonus && out.bonus.pts) || 0; plKeep();
      ED.dirty = false; ED.isNew = false; CUR.at = Date.now(); return true;
    } catch (e) {
      if (e.code === 'net' || e.code === 'server') { LZ.queue.push('save', Object.assign({ br: S.br }, body)); d.mine[i] = Object.assign({}, r); ED.dirty = false; ED.isNew = false; LZ.toast('신호가 약해서 휴대폰에 먼저 저장했어요. 연결되면 보내요', 4000); return true; }
      LZ.toast(LZ.errText(e), 5000); return false;
    }
  }
  function basisSwitched(d, to) {
    d.mode = { g: to.g, h: to.h };
    if (CL) { CL.courses.forEach(function (c) { if (c.id === d.course.id) c.mode = d.mode; }); LZ.cacheSet('courses2', CL); }
    LZ.toast('이 코스 기록 기준을 ' + LZ.modeTxt(to) + LZ.ro(LZ.HL[to.h]) + ' 바꿔 저장했어요', 4000);
  }
  function goHole(id, i, extra) { LZ.go('play', Object.assign({ id: id, hole: i, auto: 1 }, extra || {}), { replace: true, skipGuard: true }); }
  /** “✓ 3홀 저장” 잠깐 보여 주기 */
  function flash(t) { var f = document.createElement('div'); f.className = 'v9flash'; f.setAttribute('role', 'status'); f.textContent = t; document.body.appendChild(f); setTimeout(function () { f.classList.add('off'); }, 900); setTimeout(function () { f.remove(); }, 1300); }
  LZ.act.plNext = async function () {
    var d = ED.d, i = ED.i, n = nOf(d.course), id = d.course.id, ns = nSh(d.course, i);
    if (!ED.empty && layAt(d.course, i) && ED.r.s2 && ED.shot < ns - 1) { ED.shot++; rep(); return; }   // 1st → 2nd → 3rd → 다음 홀
    var wrote = !ED.empty && (ED.dirty || ED.isNew);
    if (!(await plSaveHole())) return;
    if (wrote) { flash('✓ ' + (i > 8 ? (i - 8) + '홀 (' + (i + 1) + '홀)' : (i + 1) + '홀') + ' 저장'); LZ.v9 && LZ.v9.buzz && LZ.v9.buzz(); }
    if (i >= n - 1) LZ.go('play', { id: id, done: 'end' }, { replace: true, skipGuard: true });
    else if (n === 18 && i === 8) LZ.go('play', { id: id, done: 'rest' }, { replace: true, skipGuard: true });
    else goHole(id, i + 1);
  };
  LZ.act.plNav = async function (el, v) {
    if (+v < 0 && ED.shot > 0) { ED.shot--; rep(); return; }
    var i = ED.i + (+v), id = ED.d.course.id; if (i < 0) return; if (ED.dirty && !(await plSaveHole())) return; goHole(id, i);
  };

  /* ═════════ 파 · 거리 넣기(플레이하며): 파 3·4·5·6 + 숫자판(소수 한 자리) ═════════ */
  var HD = null;
  function hdPaint() {
    var c = CUR.d.course, i = HD.i, nm = i > 8 ? (i - 8) + '홀 (' + (i + 1) + '홀)' : (i + 1) + '홀', keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
    var html = '<div id="hdsheet"><h2>' + nm + ' 파 · 거리</h2><p class="muted" style="margin-top:0">스크린에 나온 대로 넣어요. 처음 넣으면 포인트, 틀린 값을 바로잡아도 포인트가 있어요(같은 코스 하루 한 번 · 되돌려지면 회수).</p>' +
      '<div class="seg s hdpar" role="group" aria-label="파">' + [3, 4, 5, 6].map(function (p) { return '<button type="button" class="' + (HD.par === p ? 'on' : '') + '" data-act="hdPar" data-v="' + p + '">' + LZ.parMk(p) + '</button>'; }).join('') + '</div>' +
      '<div class="hdval" aria-live="polite"><b>' + (HD.m || '0') + '</b><small>m</small></div>' +
      '<div class="kpad">' + keys.map(function (k) { return '<button type="button" data-act="hdKey" data-v="' + k + '" aria-label="' + (k === 'del' ? '지우기' : k === '.' ? '소수점' : k) + '">' + (k === 'del' ? '⌫' : k) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-act="hdSave"' + (parseFloat(HD.m) > 0 ? '' : ' disabled') + '>저장</button></div>';
    if ($('#hdsheet')) $('#hdsheet').outerHTML = html; else LZ.sheet(html);
  }
  LZ.act.plHd = function () {
    var c = (ED && ED.d.course) || CUR.d.course, i = ED ? ED.i : 0;
    if (!hdEditable(c, i)) { LZ.toast('코스 정보는 이용 중인 회원님이 고칠 수 있어요', 3500); return; }
    var h = c.holes[i] || [0, 0]; HD = { i: i, par: +h[0] || 4, m: +h[1] > 0 ? LZ.fmtM(h[1]) : '' }; hdPaint();
  };
  LZ.act.hdPar = function (el, v) { HD.par = +v; hdPaint(); };
  LZ.act.hdKey = function (el, k) {
    var m = HD.m || '';
    if (k === 'del') m = m.slice(0, -1);
    else if (k === '.') { if (m.indexOf('.') < 0) m = (m || '0') + '.'; }
    else { if (/\.\d$/.test(m)) return; if (m.replace('.', '').length >= 4) return; m = m === '0' ? k : m + k; }
    HD.m = m; hdPaint();
  };
  LZ.act.hdSave = async function () {
    var m = LZ.r1(parseFloat(HD.m)), c = CUR.d.course, i = HD.i;
    if (!(m > 0 && m <= 999.9)) { LZ.toast('거리는 0.1~999.9m로 넣어 주세요'); return; }
    LZ.busy(true, '저장 중…');
    try {
      var r = await LZ.api('holeSet', { id: c.id, i: i, par: HD.par, m: m });
      LZ.busy(false); LZ.closeSheet();
      CUR.d.course = Object.assign(CUR.d.course, r.course); fixRecs(CUR.d); CUR.at = Date.now();
      LZ.toast('✓ 파 ' + HD.par + ' · ' + LZ.fmtM(m) + 'm 저장했어요' + (r.pts ? ' · 포인트 +' + r.pts + 'P' : ''), r.pts ? 3500 : 2000);
      if (LZ.cur().name === 'play') goHole(c.id, i, { auto: 0 }); else LZ.redraw();
    } catch (e) { LZ.busy(false); LZ.toast(LZ.errText(e), 5000); }
  };

  /* ═════════ 끊어치기(최대 3번) — 코스에 하나 · 포인트 없음 ═════════ */
  var LS = null;
  function cutPaint() {
    var c = CUR.d.course, i = LS.i, hm = +c.holes[i][1], nm = i > 8 ? (i - 8) + '홀 (' + (i + 1) + '홀)' : (i + 1) + '홀';
    var ds = LS.n === 1 ? [] : LS.n === 2 ? [LS.L] : [LS.L, LS.M], last = LZ.r1(hm - ds.reduce(function (a, x) { return a + x; }, 0));
    var rows = ds.map(function (x, k) { return '<div class="cutr s' + (k + 1) + '"><span class="l"><b>' + SHN[k] + '</b></span><span class="stepper"><button type="button" class="stp" data-act="cutD" data-v="' + k + '|-1" aria-label="' + SHN[k] + ' 1m 줄이기">' + LZ.ic('td') + '</button><button type="button" class="cv" data-act="cutIn" data-v="' + k + '" aria-label="' + SHN[k] + ' 거리 직접 넣기">' + LZ.fmtM(x) + 'm</button><button type="button" class="stp" data-act="cutD" data-v="' + k + '|1" aria-label="' + SHN[k] + ' 1m 늘리기">' + LZ.ic('tu') + '</button></span></div>'; }).join('') +
      (ds.length ? '<div class="cutr s' + (ds.length + 1) + '"><span class="l"><b>' + SHN[ds.length] + '</b></span><span class="r">' + LZ.fmtM(last) + 'm · 남은 거리</span></div>' : '');
    var html = '<div id="cutsheet"><h2>' + nm + ' 끊어치기</h2><p class="muted" style="margin-top:0">홀 거리 ' + LZ.fmtM(hm) + 'm · 코스에 하나예요 · 마지막 샷은 남은 거리로 저절로 · 포인트는 없어요.</p>' +
      '<div class="seg s" role="group" aria-label="몇 번에 나눠 쳐요">' + [[1, '안 끊어요'], [2, '2번'], [3, '3번']].map(function (x) { return '<button type="button" class="' + (LS.n === x[0] ? 'on' : '') + '" data-act="cutN" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="cutrows">' + rows + '</div><button type="button" class="btn" data-act="cutSave">저장</button></div>';
    if ($('#cutsheet')) $('#cutsheet').outerHTML = html; else LZ.sheet(html);
  }
  function cutSheet(i, inPlay) {
    var c = CUR.d.course; if (!hasDist(c, i)) { LZ.toast('파 · 거리를 먼저 넣어 주세요'); return; }
    var L = layAt(c, i), M = lay2At(c, i); LS = { i: i, play: inPlay, n: nSh(c, i), L: L, M: M }; cutPaint();
  }
  function cutFix() {
    var hm = +CUR.d.course.holes[LS.i][1];
    if (LS.n >= 2 && !(LS.L > 0)) LS.L = Math.max(5, Math.round(hm * (LS.n === 3 ? 0.45 : 0.6)));
    if (LS.n === 3 && !(LS.M > 0)) LS.M = Math.max(5, Math.round(hm * 0.3));
    if (LS.n < 3) LS.M = 0; if (LS.n < 2) LS.L = 0;
  }
  LZ.act.cutN = function (el, v) { LS.n = +v; cutFix(); cutPaint(); };
  LZ.act.cutD = function (el, v) {
    var a = v.split('|'), k = +a[0], hm = +CUR.d.course.holes[LS.i][1], key = k ? 'M' : 'L', other = k ? LS.L : LS.M, nx = Math.round(LS[key]) + (+a[1]);
    if (nx < 5 || hm - other - nx < 5) { LZ.toast('남은 거리가 5m 넘게 남아야 해요'); return; }
    LS[key] = nx; cutPaint();
  };
  /* 끊어치기 거리 직접 넣기: 휴대폰 글자판 대신 앱 숫자판(소수 한 자리) */
  var CP = null;
  function cutPadPaint() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
    var html = '<div id="cpsheet"><h2>' + SHN[CP.k] + ' 거리</h2><p class="muted" style="margin-top:0">남은 거리가 5m 넘게 남아야 해요 · 소수 한 자리까지</p>' +
      '<div class="hdval" aria-live="polite"><b>' + (CP.v || '0') + '</b><small>m</small></div>' +
      '<div class="kpad">' + keys.map(function (k) { return '<button type="button" data-act="cpKey" data-v="' + k + '" aria-label="' + (k === 'del' ? '지우기' : k === '.' ? '소수점' : k) + '">' + (k === 'del' ? '⌫' : k) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-act="cpOk"' + (parseFloat(CP.v) > 0 ? '' : ' disabled') + '>넣기</button></div>';
    if ($('#cpsheet')) $('#cpsheet').outerHTML = html; else LZ.sheet(html);
  }
  LZ.act.cutIn = function (el, k) { CP = { k: +k, v: LZ.fmtM(LS[+k ? 'M' : 'L']) }; cutPadPaint(); };
  LZ.act.cpKey = function (el, k) {
    var m = CP.v || '';
    if (k === 'del') m = m.slice(0, -1);
    else if (k === '.') { if (m.indexOf('.') < 0) m = (m || '0') + '.'; }
    else { if (/\.\d$/.test(m)) return; if (m.replace('.', '').length >= 4) return; m = m === '0' ? k : m + k; }
    CP.v = m; cutPadPaint();
  };
  LZ.act.cpOk = function () {
    var k = CP.k, key = k ? 'M' : 'L', hm = +CUR.d.course.holes[LS.i][1], other = k ? LS.L : LS.M, nv = LZ.r1(parseFloat(CP.v));
    if (!(nv >= 5) || hm - other - nv < 5) { LZ.toast('남은 거리가 5m 넘게 남아야 해요'); return; }
    LS[key] = nv; cutPaint(); LZ.toast(SHN[k] + ' ' + LZ.fmtM(nv) + 'm로 넣었어요');
  };
  LZ.act.cutSave = async function () {
    var i = LS.i, inPlay = LS.play, ch = { lay: LS.n >= 2 ? LS.L : 0, lay2: LS.n === 3 ? LS.M : 0 };
    if (inPlay && ED && ED.dirty && !(await plSaveHole())) return;
    LZ.closeSheet();
    if (await layApply(i, ch)) { LZ.toast(ch.lay ? '끊어치기 ' + LS.n + '번으로 저장했어요' : '끊어치기를 껐어요'); if (inPlay) goHole(CUR.d.course.id, i, { auto: 0 }); else LZ.redraw(); }
  };
  LZ.act.plLaySheet = function () { if (ED.empty) return; cutSheet(ED.i, true); };

  /* ═════════ 주의하기(↑ 강하게 · ↓ 약하게 — 한쪽만) · ⚠ 조심하기(어느 쪽과도 함께) ═════════ */
  var UPK = ['오르막', '오르막 언덕', '언덕 넘기', '러프', '헤비러프', '벙커', '맞바람', '젖은 잔디', '둔덕'];
  var DNK = ['내리막', '내리막 언덕', '튀어서 점프', '뒷바람', '빠른 그린', '마른 잔디', '굴러 내려감'];
  var CZK = ['우측 OB', '좌측 OB', '우측 흘러내림', '좌측 흘러내림', '홀컵 뒤 OB', '벙커 앞', '물(해저드)', '나무', '벽 튕김'];
  LZ.CA_WORDS = { u: UPK, d: DNK, z: CZK };
  var CS = null;
  function caPaint() {
    var x = CS.x, nm = CS.i > 8 ? (CS.i - 8) + '홀 (' + (CS.i + 1) + '홀)' : (CS.i + 1) + '홀', hasU = x.u.length || x.ut, hasD = x.d.length || x.dt;
    var grp = function (g, title, words, arr, tk, dim) {
      return '<div class="kw9 ' + g + (dim ? ' dim' : '') + '"><div class="gh">' + title + '</div><div class="kws">' + words.map(function (w) { var on = arr.indexOf(w) >= 0; return '<button type="button" class="kwb' + (on ? ' on' : '') + '" data-act="caW" data-v="' + g + '|' + esc(w) + '" aria-pressed="' + on + '">' + esc(w) + '</button>'; }).join('') +
        '</div><input type="text" class="in kwt" data-ct="' + tk + '" maxlength="10" value="' + esc(x[tk] || '') + '" placeholder="직접 (10자)" aria-label="' + title + ' 직접 적기"></div>';
    };
    var html = '<div id="casheet"><h2>' + nm + ' 주의하기</h2><p class="muted" style="margin-top:0">강하게 · 약하게는 한쪽만 · 같은 쪽은 여러 개 · 조심하기는 함께 골라도 돼요. 코스에 하나예요.</p>' +
      grp('u', '↑ 강하게 쳐요', UPK, x.u, 'ut', hasD) + grp('d', '↓ 약하게 쳐요', DNK, x.d, 'dt', hasU) + grp('z', '⚠ 조심하기 · 피할 곳', CZK, x.z, 'zt', 0) +
      '<div class="row2"><button type="button" class="btn g" data-act="caClear">모두 빼기</button><button type="button" class="btn" data-act="caSave">저장</button></div></div>';
    if ($('#casheet')) $('#casheet').outerHTML = html; else LZ.sheet(html);
    $$('#casheet [data-ct]').forEach(function (t) { t.addEventListener('input', function () { var k = t.dataset.ct; CS.x[k] = t.value.trim(); if (k === 'ut' && t.value.trim()) { CS.x.d = []; CS.x.dt = ''; } if (k === 'dt' && t.value.trim()) { CS.x.u = []; CS.x.ut = ''; } }); t.addEventListener('change', caPaint); });
  }
  function caSheet(i, inPlay) { var c = CUR.d.course; CS = { i: i, play: inPlay, x: clone(caAt(c, i)) }; ['ut', 'dt', 'zt'].forEach(function (k) { CS.x[k] = CS.x[k] || ''; }); caPaint(); }
  LZ.act.caW = function (el, v) {
    var p = v.split('|'), g = p[0], w = p.slice(1).join('|'), arr = CS.x[g], ix = arr.indexOf(w);
    if (ix >= 0) arr.splice(ix, 1);
    else { arr.push(w); if (g === 'u' && (CS.x.d.length || CS.x.dt)) { CS.x.d = []; CS.x.dt = ''; LZ.toast('강하게를 골라서 약하게는 뺐어요'); } if (g === 'd' && (CS.x.u.length || CS.x.ut)) { CS.x.u = []; CS.x.ut = ''; LZ.toast('약하게를 골라서 강하게는 뺐어요'); } }
    caPaint();
  };
  LZ.act.caClear = function () { CS.x = { u: [], d: [], z: [], ut: '', dt: '', zt: '' }; caPaint(); };
  LZ.act.caSave = async function () {
    var i = CS.i, inPlay = CS.play, x = CS.x;
    if (inPlay && ED && ED.dirty && !(await plSaveHole())) return;
    LZ.closeSheet();
    if (await layApply(i, { ca: x })) { LZ.toast('주의하기를 저장했어요'); if (inPlay) goHole(CUR.d.course.id, i, { auto: 0 }); else LZ.redraw(); }
  };
  LZ.act.plSlope = function () { caSheet(ED.i, true); };
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
      var op = LZ.conv(o.p, o.g, o.h, r.g, r.h), dp = LZ.r1(r.p - op), dl = lrNum(r) - lrNum(o), refCh = o.r !== r.r || (o.r === 'u' && o.t !== r.t), ch2 = !!(r.s2 && o.s2 && shotCh(Object.assign({}, o.s2, { p: LZ.conv(o.s2.p, o.g, o.h, r.g, r.h) }), r.s2)) || (!!r.s2 !== !!o.s2) || !!(r.s3 && o.s3 && shotCh(Object.assign({}, o.s3, { p: LZ.conv(o.s3.p, o.g, o.h, r.g, r.h) }), r.s3)) || (!!r.s3 !== !!o.s3);
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
    if (x.s2) parts.push(x.r.s3 ? '2nd · 3rd 고침' : '2nd 고침');
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
      if (lay2At(c, i) && r.s3) { var s2b = baseOf(c, i, 2, m); if (LZ.dvOf(r.s3.p, s2b)) L.push({ i: i, k: 2, p: r.s3.p, s: s2b, lay: true }); }
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
      var up = x.p > x.s; return '<button type="button" class="li" data-act="plJump" data-v="' + x.i + '">' + LZ.hn9(x.i + 1) + '<span class="chgv">' + (x.lay ? '<span class="shb">' + SHN[x.k] + '</span> ' : '') + '내 기록 <b>' + LZ.bsTxt(x.p) + '</b> <span class="dv ' + (up ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + '</span><br><span class="muted">기준 ' + LZ.bsTxt(x.s) + '</span></span>' + LZ.ic('chev') + '</button>'; }).join('') + '</div>');
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
  function spk(p, sep) { var b = LZ.bsParts(p); return b.max ? '맥스로' : b.min ? '민으로' : b.int ? b.v + '까지' : b.lo + ' 넘게' + sep + b.hi + ' 전까지'; }
  /** 읽어 줄 문장. o = { hole, par, ref(f|c|u), t, d(L|R), n, p, o(참고), none, slope(up|down), lay(끊는 거리), rest(남은 거리), s2:{ref,t,d,n,p} }
   *  예: "삼 홀, 파 포. 홀컵에서 좌 세 칸. 볼스피드 24 넘게, 25 전까지 치세요. 참고로, 오르막입니다."
   *  끊어 가는 홀: "구 홀, 파 포. 끊어 가는 홀이에요. 첫 번째 샷 54미터, 첫화면에서 우 네 칸, 볼스피드 17 넘게 18 전까지. 두 번째 샷 34.5미터, 홀컵에서 그대로, 14까지. 오르막이에요, 크게 치세요." */
  LZ.sayText = function (o) {
    var s = (NUMK[o.hole] || o.hole) + ' 홀, 파 ' + (PARE[o.par] || o.par) + '. ';
    if (o.shots && o.shots.length > 1) {
      var ORD = ['첫 번째', '두 번째', '세 번째'];
      s += o.shots.length + '번에 끊어 치는 홀이에요. ' + o.shots.map(function (x, k) { return ORD[k] + ' 샷 ' + LZ.fmtM(x.m) + '미터, ' + refSay(x) + ' ' + lrSay(x) + ', ' + (k ? '' : '볼스피드 ') + spk(x.p, ' ') + '.'; }).join(' ');
    } else if (o.lay && o.s2) {
      s += '끊어 가는 홀이에요. 첫 번째 샷 ' + LZ.fmtM(o.lay) + '미터, ' + refSay(o) + ' ' + lrSay(o) + ', 볼스피드 ' + spk(o.p, ' ') + '. 두 번째 샷 ' + LZ.fmtM(o.rest) + '미터, ' + refSay(o.s2) + ' ' + lrSay(o.s2) + ', ' + spk(o.s2.p, ' ') + '.';
    } else {
      if (o.none) s += '아직 기록이 없어요. 기준 ';
      else s += refSay(o) + ' ' + lrSay(o) + '. ';
      s += '볼스피드 ' + spk(o.p, ', ') + ' 치세요.';
    }
    if (o.ca && (o.ca.u.length || o.ca.d.length)) s += ' ' + (o.ca.u.length ? o.ca.u.join(', ') + ', 강하게 치세요.' : o.ca.d.join(', ') + ', 약하게 치세요.');
    else if (o.slope) s += ' ' + (o.slope === 'up' ? '오르막이에요, 크게 치세요.' : '내리막이에요, 작게 치세요.');
    if (o.ca && o.ca.z.length) s += ' 조심하세요, ' + o.ca.z.join(', ') + '.';
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
    if (ED.empty) return (i + 1) + ' 홀. 파와 거리를 넣어 주세요.';
    var cp = caParts(c, i), o = { hole: i + 1, par: h[0], ref: r.r, t: r.t, d: r.d, n: r.n, p: ED.disp[0], o: r.o, none: ED.isNew && !ED.dirty && !L, slope: slAt(c, i), ca: cp };
    if (L && r.s2) { o.shots = []; for (var k = 0; k < nSh(c, i); k++) { var x = shotOf(r, k); if (x) o.shots.push({ m: shotDist(c, i, k), ref: x.r, t: x.t, d: x.d, n: x.n, p: ED.disp[k] }); } }
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
    return '<div class="rgrow">' + LZ.hn9(i + 1) + parSeg(j, r.par) + '<input type="text" inputmode="decimal" data-row="' + j + '" value="' + esc(r.m) + '" placeholder="거리" aria-label="' + (i + 1) + '홀 거리(m)"><span class="sug" id="sg' + j + '">' + rgSugH(j) + '</span></div>' +
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
  var regOld = {
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

  /* ═════════ 새 코스 등록(v9): 두 단계 — 이름 → 기준. 18홀 고정 · 파 · 거리는 플레이하며 ═════════ */
  var RN = null, rnT = 0;
  var COMBO = ['AB', 'CD', 'EF', 'GH'];
  function rnName() { var b = String(RN.base || '').replace(/\s+/g, ''); if (!b) return ''; return b + (RN.pk && !/파크골프장$/.test(b) ? '파크골프장' : '') + (RN.cb === 'own' ? String(RN.own || '').replace(/\s+/g, '') : RN.cb); }
  function rnBase() { var b = String(RN.base || '').replace(/\s+/g, ''); return b + (RN.pk && b && !/파크골프장$/.test(b) ? '파크골프장' : ''); }
  function rnPaint(root) {
    root = root || $('#app');
    var nm = rnName(), step = RN.step, same = RN.same || [];
    var body;
    if (step === 1) {
      body = '<div class="rn"><label class="lb" for="rnBase">구장 이름</label><input type="text" id="rnBase" class="reginp" maxlength="20" value="' + esc(RN.base) + '" placeholder="예: 목행충주호" autocomplete="off">' +
        '<div class="list1 tgl"><span><b>“파크골프장” 붙이기</b></span>' + LZ.sw(RN.pk, 'rnPk') + '</div>' +
        '<label class="lb">조합</label><div class="seg s cmb" role="group" aria-label="코스 조합">' + COMBO.concat(['own']).map(function (k) { var tk = RN.taken.indexOf(k) >= 0; return '<button type="button" class="' + (RN.cb === k ? 'on' : '') + (tk ? ' tk' : '') + '" data-act="rnCb" data-v="' + k + '"' + (tk ? ' aria-label="' + k + ' · 이미 있어요"' : '') + '>' + (k === 'own' ? '직접' : k) + (tk ? '<small>있음</small>' : '') + '</button>'; }).join('') + '</div>' +
        (RN.cb === 'own' ? '<input type="text" id="rnOwn" class="reginp" maxlength="6" value="' + esc(RN.own) + '" placeholder="예: 가나" aria-label="조합 직접 적기">' : '') +
        '<div class="rnprev" aria-live="polite"><span>등록할 이름</span><b>' + (nm ? esc(nm) : '—') + '</b>' + (RN.dupId ? '<em>이미 있어요 · 아래에서 가져오기</em>' : nm ? '<i class="ok">✓ 새 코스예요' + (RN.taken.length && RN.cb !== 'own' ? ' · ' + RN.taken.join(' · ') + '는 이미 있어서 ' + RN.cb + '로 골랐어요' : '') + '</i>' : '') + '</div>' +
        (same.length ? '<div class="kwrow"><b class="sm">이미 있는 코스 · 가져오기</b></div><div class="list rnsame">' + same.map(function (c) { return '<button type="button" class="li" data-act="rnTake" data-v="' + esc(c.id) + '"><span class="t"><b>' + esc(c.name) + '</b><span>' + LZ.stars(c.stars) + '</span></span><span class="go">가져오기</span></button>'; }).join('') + '</div>' : '') +
        '<button type="button" class="btn" data-act="rnNext"' + (nm && !RN.dupId ? '' : ' disabled') + '>다음 ›</button>' +
        '<button type="button" class="lnk" data-go="cImport">다른 회원이 등록한 코스에서 고르기</button></div>';
    } else {
      body = '<div class="rn"><div class="rnprev"><span>코스 이름</span><b>' + esc(nm) + '</b></div>' +
        '<label class="lb">난이도 <span class="muted">스크린에 나오는 별 그대로</span></label><div class="seg s star" role="group" aria-label="난이도">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" class="' + (RN.stars === k ? 'on' : '') + '" data-act="rnStar" data-v="' + k + '">★' + k + '</button>'; }).join('') + '</div>' +
        '<label class="lb">게임 모드</label>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], RN.g, 'rnG', 's') +
        '<label class="lb">센서 탄도</label>' + LZ.seg(LZ.HLSEG, RN.h, 'rnH', 'hl s hl5') +
        '<div class="list1 tgl"><span><b>내 기록도 함께 적을까요?</b><span class="muted">켜면 등록하고 바로 1홀 플레이로 가요</span></span>' + LZ.sw(RN.rec, 'rnRec') + '</div>' +
        '<p class="hint">18홀이에요. 파 · 거리는 플레이하며 홀마다 넣어요. 이름 · 난이도 · 파 · 거리는 다른 회원님도 고칠 수 있고, 오류를 바로잡으면 포인트가 있어요. 공개 여부는 내 수첩에서 코스마다 정해요.</p>' +
        '<div class="row2"><button type="button" class="btn g" data-act="rnBack">‹ 이름</button><button type="button" class="btn" data-act="rnSave">등록</button></div></div>';
    }
    root.innerHTML = LZ.hdr('새 코스 등록', { back: true }) + '<div class="wrap reg9"><div class="steps" aria-label="2단계 중 ' + step + '단계"><i class="' + (step === 1 ? 'on' : 'ok') + '">1 이름</i><i class="' + (step === 2 ? 'on' : '') + '">2 기준</i></div>' + body + '</div>';
    var b = $('#rnBase'); if (b) b.addEventListener('input', function () { RN.base = b.value; rnLook(); });
    var ow = $('#rnOwn'); if (ow) ow.addEventListener('input', function () { RN.own = ow.value; rnDup(); var p = $('.rnprev b'); if (p) p.textContent = rnName() || '—'; });
    LZ.guard = { dirty: function () { return !!RN.base && !RN.saved; }, ask: async function () { return LZ.confirm('나갈까요?', '적던 내용이 사라져요.', '나가기', 'r'); } };
  }
  /** 바탕 이름이 바뀌면 잠깐 뒤에 서버에 물어서 AB · CD … 중 빈 첫 조합을 골라 둬요 */
  function rnLook() {
    clearTimeout(rnT); var p = $('.rnprev b'); if (p) p.textContent = rnName() || '—';
    rnT = setTimeout(async function () {
      var base = rnBase(); if (base.length < 2) { RN.taken = []; RN.same = []; RN.dupId = ''; rnRe(); return; }
      try { var r = await LZ.api('nameNext', { base: base }); if (base !== rnBase()) return; RN.taken = r.taken || []; RN.same = r.same || []; if (RN.cb !== 'own' && (RN.auto || RN.taken.indexOf(RN.cb) >= 0)) { RN.cb = r.next || 'own'; RN.auto = true; } rnDup(); rnRe(); } catch (e) { /* 신호 없음: 그대로 */ }
    }, 350);
  }
  function rnDup() { var key = rnName().toLowerCase(), hit = (RN.same || []).filter(function (c) { return c.name.toLowerCase() === key; })[0]; RN.dupId = hit ? hit.id : ''; }
  function rnRe() { var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; rnPaint(); if (id) { var e = $('#' + id); if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch (x) { /* 무시 */ } } } }
  LZ.screens.reg = {
    tab: 'courses', wake: true,
    show: function (p, root, alive) {
      if (p.half) return regOld.show(p, root, alive);                      // v8 에서 전반만 등록한 코스 마치기
      if (!RN || RN.saved) { var bm0 = CUR.d && CUR.d.mode; RN = { step: 1, base: p.name || '', pk: true, cb: 'AB', own: '', auto: true, taken: [], same: [], dupId: '', stars: 3, g: bm0 ? bm0.g : 'p', h: bm0 ? bm0.h : 'm', rec: true, saved: false }; }
      rnPaint(root); if (RN.base) rnLook();
      if (RN.step === 1) setTimeout(function () { var b = $('#rnBase'); if (b && !RN.base) b.focus(); }, 80);
    }
  };
  LZ.act.rnPk = function () { RN.pk = !RN.pk; rnLook(); rnRe(); };
  LZ.act.rnCb = function (el, v) { if (RN.taken.indexOf(v) >= 0) { LZ.toast(rnBase() + v + ' 코스가 이미 있어요 · 아래에서 가져올 수 있어요', 3500); } RN.cb = v; RN.auto = false; rnDup(); rnRe(); if (v === 'own') setTimeout(function () { var o = $('#rnOwn'); if (o) o.focus(); }, 50); };
  LZ.act.rnNext = function () { var nm = rnName(); if (!nm || nm.length < 2) { LZ.toast('구장 이름을 넣어 주세요'); return; } if (RN.dupId) return LZ.act.rnTake(null, RN.dupId); RN.step = 2; rnPaint(); window.scrollTo(0, 0); };
  LZ.act.rnBack = function () { RN.step = 1; rnPaint(); };
  LZ.act.rnStar = function (el, v) { RN.stars = +v; rnRe(); };
  LZ.act.rnG = function (el, v) { RN.g = v; rnRe(); };
  LZ.act.rnH = function (el, v) { RN.h = v; rnRe(); };
  LZ.act.rnRec = function () { RN.rec = !RN.rec; rnRe(); };
  LZ.act.rnTake = async function (el, id) {
    try { await LZ.api('courseAdd', { id: id }); RN.saved = true; LZ.cacheSet('courses2', null); LZ.toast('내 수첩에 담았어요'); LZ.go('holes', { id: id, fresh: 1 }, { replace: true, skipGuard: true }); } catch (e) { LZ.toast(LZ.errText(e), 4500); }
  };
  LZ.act.rnSave = async function () {
    var nm = rnName(); LZ.busy(true, '등록 중…');
    try {
      var r = await LZ.api('regCourse', { name: nm, stars: RN.stars, g: RN.g, h: RN.h }, { retry: 0 });
      LZ.busy(false); RN.saved = true; LZ.cacheSet('courses2', null); CUR.id = ''; CUR.key = '';
      store.set('lz.view.' + r.id, RN.g + '|' + RN.h);
      LZ.toast('“' + r.name + '” 코스를 등록했어요', 3000);
      if (RN.rec) LZ.go('play', { id: r.id, hole: 0, auto: 1 }, { replace: true, skipGuard: true }); else LZ.go('holes', { id: r.id, fresh: 1 }, { replace: true, skipGuard: true });
    } catch (e) {
      LZ.busy(false);
      if (e.code === 'dup' && e.data && e.data.id) { if (await LZ.confirm(e.message, '새로 만들지 않고 그 코스를 내 수첩에 담아요.', '가져오기')) LZ.act.rnTake(null, e.data.id); return; }
      LZ.toast(LZ.errText(e), 5000);
    }
  };

  /* ═════════ 코스 가져오기: 모든 회원이 등록한 코스 → 내 수첩 ═════════ */
  var IMP = {};
  LZ.screens.cImport = {
    tab: 'courses',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('코스 가져오기', { back: true }) + LZ.skeleton(5);
      var r = await LZ.api('courses', {}); if (!alive()) return; CL = r; IMP = {};
      var list = r.courses.filter(function (c) { return !c.my; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });
      root.innerHTML = LZ.hdr('코스 가져오기', { back: true }) + '<div class="wrap cimp"><p class="muted">모든 회원님이 등록한 코스예요. 골라서 내 수첩에 담아요. 기록은 각자 따로예요.</p>' +
        '<div class="csrch"><input type="search" id="iq" placeholder="코스 이름" aria-label="코스 이름 찾기"></div>' +
        (list.length ? '<div class="list">' + list.map(function (c) { return '<button type="button" class="li imp" data-act="impTgl" data-v="' + esc(c.id) + '" aria-pressed="false"><span class="ck" aria-hidden="true"></span><span class="t"><b>' + esc(c.name) + '</b><span>' + LZ.stars(c.stars) + ' · 등록 ' + esc(c.reg || '') + (c.filledH < 18 ? ' · 파·거리 ' + c.filledH + '/18' : '') + '</span></span></button>'; }).join('') + '</div>' : '<div class="empty">가져올 코스가 없어요. 모두 내 수첩에 있어요.</div>') +
        '</div><div class="v9foot"><button type="button" class="btn" data-act="impSave" disabled>내 수첩에 담기</button></div>';
      var iq = $('#iq'); if (iq) iq.addEventListener('input', function () { var v = iq.value.toLowerCase().replace(/\s+/g, ''); $$('.li.imp').forEach(function (b) { b.hidden = !!v && b.querySelector('b').textContent.toLowerCase().indexOf(v) < 0; }); });
    }
  };
  LZ.act.impTgl = function (el, id) { IMP[id] = !IMP[id]; if (!IMP[id]) delete IMP[id]; el.setAttribute('aria-pressed', String(!!IMP[id])); el.classList.toggle('on', !!IMP[id]); var n = Object.keys(IMP).length, b = $('[data-act="impSave"]'); if (b) { b.disabled = !n; b.textContent = n ? n + '개 내 수첩에 담기' : '내 수첩에 담기'; } };
  LZ.act.impSave = async function () {
    var ids = Object.keys(IMP); if (!ids.length) return;
    try { await LZ.api('courseAdd', { ids: ids }); LZ.cacheSet('courses2', null); LZ.toast(ids.length + '개 코스를 내 수첩에 담았어요'); LZ.go('courses', {}, { replace: true }); } catch (e) { LZ.toast(LZ.errText(e), 4500); }
  };
  LZ.act.cHide = async function () {
    var c = CUR.d.course; LZ.closeSheet();
    try { await LZ.api('courseHide', { id: c.id }); LZ.cacheSet('courses2', null); LZ.go('courses', {}, { reset: true }); LZ.undo('“' + c.name + '”을 내 수첩에서 뺐어요', async function () { await LZ.api('courseAdd', { id: c.id }); LZ.cacheSet('courses2', null); LZ.redraw(); }); } catch (e) { LZ.toast(LZ.errText(e), 4500); }
  };

  /* ═════════ 코스 정보 고치기 ═════════ */
  LZ.screens.courseEdit = {
    tab: 'courses',
    show: async function (p, root, alive) {
      root.innerHTML = LZ.hdr('코스 정보', { back: true }) + LZ.skeleton(5);
      var d = await loadCourse(p.id, true); if (!alive()) return; var c = d.course;
      root.innerHTML = LZ.hdr('코스 정보 고치기', { back: true }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">코스 이름</label><input type="text" id="ceName" maxlength="30" value="' + esc(c.name) + '"' + (c.canEdit ? '' : ' disabled') + '><label class="lb">난이도 <span class="muted" style="font-weight:400">— 스크린 해당 코스의 난이도를 그대로 선택</span></label>' + LZ.seg([['1', '★1'], ['2', '★2'], ['3', '★3'], ['4', '★4'], ['5', '★5']], String(c.stars), 'ceStars', 'star s') + '<input type="hidden" id="ceStars" value="' + c.stars + '">' +
        (d.mode ? '<label class="lb">이 코스의 내 기록 기준(게임 모드·센서 탄도)</label><p class="muted" style="margin:0 0 6px">바꾸면 이 코스의 내 기록을 같은 거리가 되도록 환산해요. 오늘만 다르게 볼 때는 코스 화면 위에서 고르세요(그 기준으로 플레이 화면에서 고쳐 저장하면 기록 기준도 그 기준으로 바뀌어요).</p>' + LZ.seg([['b', '아마추어'], ['p', '프로'], ['m', '마스터']], d.mode.g, 'ceG', 's') + '<div style="height:6px"></div>' + LZ.seg(LZ.HLSEG, d.mode.h, 'ceH', 'hl s hl5') + '<input type="hidden" id="ceG" value="' + d.mode.g + '"><input type="hidden" id="ceH" value="' + d.mode.h + '">' : '') + '</div>' +
        '<div class="card"><h3>홀별 파·거리</h3>' + c.holes.slice(0, nOf(c)).map(function (h, i) { return '<div class="frow">' + LZ.hn9(i + 1) + LZ.seg(LZ.parOpts(h[0]), String(h[0]), 'cePar:' + i, 's par') + '<input type="text" inputmode="decimal" data-ch="' + i + '" value="' + h[1] + '" class="cem"' + (c.canEdit ? '' : ' disabled') + ' aria-label="' + (i + 1) + '홀 거리"></div>'; }).join('') + '</div>' +
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
