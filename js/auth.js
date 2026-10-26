/* 로그인 · 가입(7일 체험 + 복구 번호) · 비밀번호 찾기(복구 번호 · 관리자 신청) · 처음 비밀번호 바꾸기 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var pin = '';
  function padHtml(len) { return '<div class="dots" id="dots">' + '<i></i>'.repeat(len) + '</div><div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지우기', '0', ''].map(function (k) { return '<button type="button" class="' + (k.length > 1 ? 'fn' : '') + '" data-act="pk" data-v="' + k + '"' + (k ? '' : ' style="visibility:hidden"') + '>' + k + '</button>'; }).join('') + '</div>'; }
  function paintDots() { var ds = $$('#dots i'); ds.forEach(function (d, i) { d.classList.toggle('on', i < pin.length); }); }
  function pinLen() { var nk = $('#nick'); if (nk) return LZ.stripNick(nk.value) === '관리자' ? 6 : 4; var ds = $('#dots'); return ds && ds.children.length ? ds.children.length : (S.user && S.user.pinLen) || 4; }
  LZ.stripNick = function (s) { return String(s || '').replace(/[\s　​﻿]+/g, ''); };
  function setPadLen(len) { var ds = $('#dots'); if (ds && ds.children.length !== len) { ds.innerHTML = '<i></i>'.repeat(len); pin = pin.slice(0, len); paintDots(); } }

  LZ.screens.login = {
    nobar: true,
    show: async function (p, root) {
      pin = '';
      var keep = store.get('lz.keep') !== '0', last = store.get('lz.nick') || '', inv = store.get('lz.inv');
      root.innerHTML = '<button type="button" class="fsz" data-act="big">글씨 크게</button>' +
        '<div class="hero"><div class="img"></div><div class="shade"></div><div class="fade"></div><div class="ttl"><h1>파크골프 <b>공략수첩</b></h1><p>홀마다 내 공략을 적고, 클럽과 함께 나눠요</p></div></div>' +
        '<div class="card lcard"><label class="lb" style="margin-top:0" for="nick">닉네임</label><input type="text" id="nick" value="' + esc(last) + '" placeholder="스크린에서 쓰는 닉네임" autocomplete="username" maxlength="8">' +
        '<label class="lb">비밀번호 숫자</label>' + padHtml(4) +
        '<label class="lb" style="display:flex;gap:10px;align-items:center;margin-top:14px;font-weight:400"><input type="checkbox" id="keep" ' + (keep ? 'checked' : '') + ' style="width:24px;height:24px;accent-color:var(--g)"> 이 휴대폰에서 로그인 유지</label>' +
        '<button type="button" class="btn" data-act="login">로그인</button>' +
        '<div style="display:flex;justify-content:space-between;margin-top:14px"><a href="#" data-act="forgot" style="font-weight:700;text-decoration:none">비밀번호를 잊었어요</a><a href="#" data-go="guide" style="font-weight:700;text-decoration:none">사용 안내</a></div></div>' +
        (inv ? '<div class="card" style="margin:0 16px 14px;background:var(--gl)"><b>클럽 초대를 받으셨어요</b><div class="muted">로그인하거나 가입하면 그 클럽에 가입 신청이 돼요.</div></div>' : '') +
        '<div class="card" style="margin:0 16px 20px;background:#FFF7ED;border:2px solid #FED7AA;display:flex;align-items:center;gap:12px"><div style="flex:1"><b>처음이세요?</b><div class="muted" style="color:#9A3412">7일 무료 체험으로 바로 시작</div></div><button type="button" class="sm2" style="background:var(--org);height:50px" data-go="join">가입하기</button></div>' +
        '<p class="hint center" style="padding-bottom:20px">앱 버전 ' + LZ.VER + '</p>';
      var n = $('#nick'); n.addEventListener('input', function () { setPadLen(pinLen()); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter') n.blur(); });
      $('#keep').addEventListener('change', function (e) { store.set('lz.keep', e.target.checked ? '1' : '0'); });
      if (LZ.pinChangedNote) { LZ.pinChangedNote = false; LZ.dialog({ title: '비밀번호가 바뀌었어요', body: '다른 휴대폰에서 비밀번호를 새로 정해서 이 휴대폰은 로그아웃됐어요. 새 비밀번호로 로그인해 주세요.' }); }
    }
  };
  LZ.act.pk = function (el, k) {
    var len = pinLen();
    if (k === '지우기') pin = pin.slice(0, -1); else if (pin.length < len) pin += k;
    paintDots();
    if (pin.length === len && LZ.cur().name === 'login') LZ.act.login();
  };
  LZ.act.login = async function () {
    var nick = LZ.stripNick($('#nick').value), len = pinLen();
    if (!nick) { LZ.toast('닉네임을 적어 주세요'); $('#nick').focus(); return; }
    if (pin.length < len) { LZ.toast('비밀번호 ' + len + '자리를 눌러 주세요'); return; }
    LZ.busy(true, '들어가는 중…');
    try {
      var r = await LZ.api('login', { nick: nick, pin: pin, dev: LZ.devLabel() }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; store.set('lz.nick', nick); LZ.setSession(r);
      if (r.user.must) { LZ.go('pinFirst', {}, { reset: true }); return; }
      if (r.needRc) LZ.needRc = true;
      await LZ.refreshMe().catch(function () {});
      LZ.go('home', {}, { reset: true }); LZ.afterLogin('');
      if (r.needRc) LZ.rcIntro();
      else LZ.toast(nick + '님, 반가워요');
    } catch (e) {
      LZ.busy(false); pin = ''; paintDots();
      if (e.code === 'tmpold') { await LZ.dialog({ title: '임시 번호가 만료됐어요', body: e.message }); return; }
      LZ.toast(e.message, 4500);
    }
  };
  /* 예전 회원이 v4에서 처음 로그인: 복구 번호 받기 */
  LZ.rcIntro = async function () {
    var ok = await LZ.dialog({ title: '복구 번호를 받아 두세요', body: '비밀번호를 잊었을 때 쓰는 8자리 번호예요. 캡틴이 대신 바꿔 줄 수 없으니 지금 받아서 카톡 "나에게 보내기"로 보관해 두세요.', cancel: false, buttons: [{ label: '복구 번호 받기', kind: 'y', value: true }, { label: '나중에', kind: 'g', value: false }] });
    if (!ok) return;
    try { var r = await LZ.api('rcNew', {}); S.user = r.user; LZ.showRc(r.rc); } catch (e) { LZ.toast(LZ.errText(e), 4000); }
  };
  LZ.showRc = function (rc) {
    var pretty = rc.slice(0, 4) + ' ' + rc.slice(4);
    LZ.sheet('<h2>복구 번호</h2><div class="box center"><big>' + pretty + '</big><br><span class="muted">비밀번호를 잊었을 때 이 번호로 새 비밀번호를 정해요. 한 번 쓰면 새 번호로 바뀌어요.</span></div>' +
      '<button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '공략수첩 복구 번호', text: '파크골프 공략수첩 복구 번호: ' + pretty + ' (비밀번호를 잊었을 때 써요. 다른 분께 보내지 마세요)' })) + '\'>카톡 나에게 보내기</button>' +
      '<button type="button" class="btn g" data-act="copy" data-v="' + rc + '">번호 복사</button>');
  };
  /* 처음 비밀번호(임시 번호·관리자 6자리) 바꾸기 */
  LZ.screens.pinFirst = {
    nobar: true,
    show: function (p, root) {
      pin = ''; var len = S.user.pinLen || 4;
      root.innerHTML = LZ.hdr('나만의 비밀번호 정하기', { noBell: 1 }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0 0 6px">' + (S.user.kind === 'admin' ? '관리자는 숫자 6자리예요.' : '임시 번호는 한 번만 써요. 앞으로 쓸 숫자 ' + len + '자리를 정해 주세요.') + ' 같은 숫자 반복, 1234 같은 연속 번호는 안 돼요.</p>' + padHtml(len) + '<button type="button" class="btn" data-act="pinFirstOk">이 번호로 정하기</button></div></div>';
    }
  };
  LZ.act.pinFirstOk = async function () {
    var len = S.user.pinLen || 4; if (pin.length < len) { LZ.toast('숫자 ' + len + '자리를 눌러 주세요'); return; }
    LZ.busy(true, '저장 중…');
    try { var r = await LZ.api('pin', { pin: pin }); LZ.busy(false); S.user = r.user; pin = ''; await LZ.refreshMe().catch(function () {}); LZ.go('home', {}, { reset: true }); LZ.toast('비밀번호를 정했어요'); if (!S.user.rc) LZ.rcIntro(); }
    catch (e) { LZ.busy(false); pin = ''; paintDots(); LZ.toast(e.message, 4500); }
  };
  /* 가입 */
  LZ.screens.join = {
    nobar: true,
    show: async function (p, root) {
      var cfg = null; try { cfg = await LZ.api('cfg', { inv: store.get('lz.inv') || '' }, { noAuth: true }); } catch (e) { /* 무시 */ }
      var ref = store.get('lz.ref') || '', refNick = '';
      if (ref) { try { refNick = (await LZ.api('refName', { ref: ref }, { noAuth: true })).nick; } catch (e) { /* 무시 */ } }
      root.innerHTML = LZ.hdr('7일 무료 체험 가입', { back: true, noBell: 1 }) + '<div class="wrap">' +
        (cfg && cfg.inv ? '<div class="box"><b>' + esc(cfg.inv.name) + '</b> 클럽 초대 · 캡틴 ' + esc(cfg.inv.captainNick) + '님 · 회원 ' + cfg.inv.members + '명<br><span class="muted">가입하면 이 클럽에 ' + (cfg.inv.auto ? '바로 들어가요' : '가입 신청이 돼요') + '</span></div>' : '') +
        (refNick ? '<div class="box"><b>' + esc(refNick) + '</b>님의 초대로 오셨어요 🎁</div>' : '') +
        '<div class="card"><label class="lb" style="margin-top:0" for="jnick">닉네임</label><input type="text" id="jnick" placeholder="한글·영문·숫자 2~8자 (스크린에서 쓰는 이름)" maxlength="8"><p class="hint" id="jhint">스크린 파크골프 기계에 적는 닉네임과 같게 하면 좋아요.</p>' +
        '<label class="lb">비밀번호 숫자 4자리</label>' + padHtml(4) +
        '<label class="lb" style="display:flex;gap:10px;align-items:flex-start;font-weight:400;margin-top:14px"><input type="checkbox" id="agree" style="width:24px;height:24px;accent-color:var(--g);flex:none"><span class="muted">체험은 한 분당 한 번(7일)이에요. 닉네임·기록은 클럽 회원님께 보일 수 있어요. 비밀번호는 암호화해서 저장돼요.</span></label>' +
        '<button type="button" class="btn org" data-act="joinOk">체험 시작하기</button></div>' +
        '<p class="hint">체험이 끝나면 정회원 월 1,000원 · 연 6,000원이에요. 가입하면 <b>복구 번호 8자리</b>를 드려요(비밀번호를 잊었을 때 써요).</p></div>';
      pin = '';
      var n = $('#jnick'), chk = null;
      n.addEventListener('input', function () { clearTimeout(chk); chk = setTimeout(async function () { var v = LZ.stripNick(n.value); if (v.length < 2) return; try { var r = await LZ.api('joinCheck', { nick: v }, { noAuth: true, retry: 0 }); $('#jhint').innerHTML = r.res ? '<span class="err">' + esc(r.res.msg) + '</span>' : '<span style="color:var(--green);font-weight:700">쓸 수 있는 닉네임이에요 ✓</span>'; } catch (e) { /* 무시 */ } }, 500); });
    }
  };
  LZ.act.joinOk = async function () {
    var nick = LZ.stripNick($('#jnick').value);
    if (!nick) { LZ.toast('닉네임을 적어 주세요'); return; }
    if (pin.length < 4) { LZ.toast('비밀번호 4자리를 눌러 주세요'); return; }
    if (!$('#agree').checked) { LZ.toast('안내를 읽고 체크해 주세요'); return; }
    LZ.busy(true, '가입하는 중…');
    try {
      var r = await LZ.api('join', { nick: nick, pin: pin, agree: 1, dev: LZ.devId(), ref: store.get('lz.ref') || '', inv: store.get('lz.inv') || '', ua: LZ.devLabel() }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; store.set('lz.nick', nick); store.del('lz.inv'); store.del('lz.ref'); LZ.setSession(r);
      await LZ.refreshMe().catch(function () {});
      LZ.firstGuide = true;
      LZ.go('home', {}, { reset: true });
      LZ.sheet('<h2>가입했어요 🎉</h2><p class="muted">아래 복구 번호를 꼭 보관해 두세요. 비밀번호를 잊었을 때 써요.</p><div class="box center"><big>' + r.rc.slice(0, 4) + ' ' + r.rc.slice(4) + '</big></div>' +
        '<button type="button" class="btn kakao" data-act="share" data-v=\'' + esc(JSON.stringify({ title: '공략수첩 복구 번호', text: '파크골프 공략수첩 복구 번호: ' + r.rc.slice(0, 4) + ' ' + r.rc.slice(4) + ' (비밀번호를 잊었을 때 써요)' })) + '\'>카톡 나에게 보내기</button>' +
        (r.inv ? '<div class="box">' + esc(r.inv.name) + ' 클럽에 ' + (r.inv.joined ? '들어왔어요' : '가입 신청했어요. 캡틴이 함께하기를 누르면 홈에 생겨요') + '</div>' : ''));
    } catch (e) { LZ.busy(false); pin = ''; paintDots(); LZ.toast(e.message, 5000); }
  };
  /* 비밀번호 찾기 */
  LZ.act.forgot = function () {
    var nick = LZ.stripNick(($('#nick') || {}).value || '');
    LZ.sheet('<h2>비밀번호 찾기</h2><p class="muted">캡틴은 비밀번호에 손댈 수 없어요. 아래 방법으로 직접 새로 정해요.</p>' +
      '<button type="button" class="opt on" data-go="pwCode" data-p=\'' + esc(JSON.stringify({ nick: nick })) + '\'><b>복구 번호 8자리로 다시 정하기</b><span>가입할 때 받아 둔 번호 (카톡 나에게 보내기로 보관)</span></button>' +
      '<button type="button" class="opt" data-go="pwReq" data-p=\'' + esc(JSON.stringify({ nick: nick })) + '\'><b>관리자에게 찾기 신청</b><span>복구 번호가 없을 때 · 로그인 없이 신청하고 임시 번호를 받아요</span></button>' +
      (store.get('lz.pwreq') ? '<button type="button" class="opt" data-go="pwReqStatus"><b>내 신청 확인</b><span>신청 번호 ' + esc(store.json('lz.pwreq').code) + ' · 임시 번호가 나왔는지 봐요</span></button>' : ''));
  };
  LZ.screens.pwCode = {
    nobar: true,
    show: function (p, root) {
      pin = '';
      root.innerHTML = LZ.hdr('복구 번호로 다시 정하기', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0">닉네임</label><input type="text" id="rnick" value="' + esc(p.nick || '') + '" maxlength="8"><label class="lb">복구 번호 8자리</label><input type="tel" id="rc" inputmode="numeric" placeholder="예: 4829 1735" maxlength="9"><label class="lb">새 비밀번호 숫자 4자리</label>' + padHtml(4) + '<button type="button" class="btn" data-act="pwCodeOk">새 비밀번호로 정하기</button></div><p class="hint">바꾸면 다른 휴대폰은 모두 로그아웃돼요. 복구 번호는 한 번 쓰면 새 번호로 바뀌니 다시 보관해 주세요.</p></div>';
    }
  };
  LZ.act.pwCodeOk = async function () {
    var nick = LZ.stripNick($('#rnick').value), rc = $('#rc').value.replace(/\D/g, '');
    if (!nick || rc.length !== 8) { LZ.toast('닉네임과 복구 번호 8자리를 적어 주세요'); return; }
    if (pin.length < 4) { LZ.toast('새 비밀번호 4자리를 눌러 주세요'); return; }
    LZ.busy(true, '확인 중…');
    try {
      var r = await LZ.api('pwCode', { nick: nick, rc: rc, pin: pin, dev: LZ.devLabel() }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; store.set('lz.nick', nick); LZ.setSession(r); await LZ.refreshMe().catch(function () {});
      LZ.go('home', {}, { reset: true }); LZ.toast('새 비밀번호로 정했어요'); LZ.showRc(r.rc);
    } catch (e) { LZ.busy(false); pin = ''; paintDots(); LZ.toast(e.message, 5000); }
  };
  LZ.screens.pwReq = {
    nobar: true,
    show: function (p, root) {
      root.innerHTML = LZ.hdr('관리자에게 찾기 신청', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0 0 6px">본인 확인용으로 세 가지만 적어 주세요. 처리가 끝나면 연락처는 바로 지워요.</p>' +
        '<label class="lb">닉네임</label><input type="text" id="qnick" value="' + esc(p.nick || '') + '" maxlength="8"><label class="lb">가입한 때</label><input type="text" id="qwhen" placeholder="예: 올해 9월쯤, 작년 봄" maxlength="30"><label class="lb">연락받을 곳</label><input type="text" id="qcontact" placeholder="카톡 아이디나 전화번호" maxlength="40">' +
        '<button type="button" class="btn" data-act="pwReqOk">신청하기</button></div><p class="hint">관리자가 확인한 뒤 <b>임시 번호(24시간)</b>를 연락드려요. 이 휴대폰에서 "비밀번호를 잊었어요 → 내 신청 확인"으로도 볼 수 있어요. 임시 번호로 들어오면 바로 나만의 번호로 바꾸게 돼요.</p></div>';
    }
  };
  LZ.act.pwReqOk = async function () {
    LZ.busy(true, '신청 중…');
    try {
      var r = await LZ.api('pwReq', { nick: LZ.stripNick($('#qnick').value), when: $('#qwhen').value, contact: $('#qcontact').value, did: LZ.devId() }, { noAuth: true, retry: 0 });
      LZ.busy(false); store.setJSON('lz.pwreq', { code: r.code, nick: LZ.stripNick($('#qnick').value), at: Date.now() });
      LZ.go('pwReqStatus', {}, { replace: true });
    } catch (e) { LZ.busy(false); LZ.toast(e.message, 5000); }
  };
  LZ.screens.pwReqStatus = {
    nobar: true,
    show: async function (p, root) {
      var q = store.json('lz.pwreq');
      if (!q) { root.innerHTML = LZ.hdr('내 신청 확인', { back: true, noBell: 1 }) + '<div class="wrap"><div class="empty">이 휴대폰에서 한 신청이 없어요.</div></div>'; return; }
      root.innerHTML = LZ.hdr('내 신청 확인', { back: true, noBell: 1 }) + LZ.skeleton(3);
      var st = null; try { st = (await LZ.api('pwReqStatus', { did: LZ.devId(), code: q.code }, { noAuth: true })).req; } catch (e) { st = { err: e.message }; }
      var body;
      if (!st || st.err) body = '<div class="box err">' + esc(st ? st.err : '확인하지 못했어요') + '</div>';
      else if (st.status === 'req') body = '<div class="box">관리자가 아직 확인하는 중이에요. 처리되면 연락처로 알려 드리고 여기에도 임시 번호가 나와요.</div>';
      else if (st.status === 'ok' && st.tmp) body = '<div class="box center"><span class="muted">임시 번호</span><br><big>' + esc(st.tmp) + '</big><br><span class="muted">' + LZ.fmtDate(st.tmpUntil, true) + '까지 · 로그인하면 바로 나만의 번호로 바꿔요</span></div><button type="button" class="btn" data-act="back">로그인하러 가기</button>';
      else if (st.status === 'ok') body = '<div class="box warn">임시 번호를 쓸 수 있는 시간이 지났어요. 다시 신청해 주세요.</div>';
      else body = '<div class="box warn">이 신청은 처리되지 않았어요(' + (st.status === 'no' ? '확인되지 않음' : '기간 지남') + '). 가입한 닉네임·때를 다시 확인해서 신청해 주세요.</div>';
      root.innerHTML = LZ.hdr('내 신청 확인', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0">신청 번호 <b>' + esc(q.code) + '</b> · ' + esc(q.nick) + '님 · ' + LZ.fmtDate(q.at, true) + '</p></div>' + body + '</div>';
    }
  };
  LZ.screens.offline = {
    nobar: true,
    show: function (p, root) {
      root.innerHTML = '<div class="wrap" style="padding-top:60px"><div class="card center"><div style="font-size:48px">📶</div><h3>서버에 연결하지 못했어요</h3><p class="muted">' + esc(LZ.errText(p.err)) + '</p><button type="button" class="btn" data-act="retryBoot">다시 시도</button><button type="button" class="btn g" data-act="logoutLocal">다른 닉네임으로 로그인</button></div></div>';
    }
  };
  LZ.act.retryBoot = function () { location.reload(); };
  LZ.act.logoutLocal = function () { LZ.clearSession(); LZ.go('login', {}, { reset: true }); };
})();
