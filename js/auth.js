/* 로그인 · 가입(블루 무료 + 카카오 본인 확인) · 비밀번호 찾기(카카오로 확인 · 관리자 신청) · 처음 비밀번호 바꾸기 · 기존 회원 카카오 확인 · 블랙 안내 */
(function () {
  'use strict';
  var LZ = window.LZ, S = LZ.S, $ = LZ.$, $$ = LZ.$$, esc = LZ.esc, store = LZ.store;
  var pin = '';
  function padHtml(len) { return '<div class="dots" id="dots">' + '<i></i>'.repeat(len) + '</div><div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지우기', '0', ''].map(function (k) { return '<button type="button" class="' + (k.length > 1 ? 'fn' : '') + '" data-act="pk" data-v="' + k + '"' + (k ? '' : ' style="visibility:hidden"') + '>' + k + '</button>'; }).join('') + '</div>'; }
  function paintDots() { var ds = $$('#dots i'); ds.forEach(function (d, i) { d.classList.toggle('on', i < pin.length); }); }
  var pinForce = 0;
  function pinLen() { var nk = $('#nick'); if (nk) return pinForce || (LZ.stripNick(nk.value) === '관리자' ? 6 : 4); var ds = $('#dots'); return ds && ds.children.length ? ds.children.length : (S.user && S.user.pinLen) || 4; }
  LZ.stripNick = function (s) { return String(s || '').replace(/[\s　​﻿]+/g, ''); };
  function setPadLen(len) { var ds = $('#dots'); if (ds && ds.children.length !== len) { ds.innerHTML = '<i></i>'.repeat(len); pin = pin.slice(0, len); paintDots(); } var h = $('#lhint'); if (h) h.textContent = len + '자리를 누르면 바로 들어가요'; }

  /* 로그인(v7 #12 #14 #15): 위 1/3은 잔디 사진만, 제목 옆 작은 앱 로고, 좁은 닉네임 칸, 비밀번호 점 + 숫자판(다 누르면 바로 들어감),
     "비밀번호를 잊었어요" → "처음이세요?" 가입 카드. 이 휴대폰으로 들어왔던 분은 프로필 사진·닉네임을 미리 보여 줘요 */
  LZ.screens.login = {
    nobar: true,
    show: async function (p, root) {
      pin = ''; pinForce = 0;
      var who = store.json('lz.who'), back = !!(who && who.nick), last = back ? who.nick : (store.get('lz.nick') || ''), inv = store.get('lz.inv'), big = LZ.big.get();
      var av = back ? (who.av ? '<img class="lav" src="' + esc(who.av) + '" alt="">' : '<span class="lav">' + esc(who.nick.charAt(0)) + '</span>') : '';
      root.innerHTML = '<div class="login"><div class="lhero" aria-hidden="true"></div>' +
        '<div class="lbody"><div class="ltitle"><img src="icons/icon-192.png" alt="" class="llogo"><h1>파크골프 공략수첩</h1></div>' +
        (back ? '<p class="lsub">다시 오셨네요</p><div class="lwho">' + av + '<b>' + esc(who.nick) + (who.nick === '관리자' ? '' : ' <span>회원님</span>') + '</b><input type="text" id="nick" class="nick-ghost" value="' + esc(last) + '" autocomplete="username" maxlength="8" tabindex="-1" aria-label="닉네임"></div>'
          : '<p class="lsub">홀마다 나만의 공략을 적어 두세요</p><label class="sr" for="nick">닉네임</label><input type="text" id="nick" class="lnick" value="' + esc(last) + '" placeholder="닉네임" autocomplete="username" maxlength="8" autocapitalize="off" spellcheck="false">') +
        '<div id="bioBox"></div>' + padHtml(4) + '<p class="lhint" id="lhint">4자리를 누르면 바로 들어가요</p>' +
        '<a href="#" class="lforgot" data-act="forgot">비밀번호 찾기</a>' +
        '<hr class="ldiv" aria-hidden="true">' +   /* v7.1.0 §15: "비밀번호를 잊었어요"와 다음 줄 사이 긴 구분선(처음 로그인 화면도 같은 자리) */
        (back ? '<a href="#" class="lother" data-act="otherUser">다른 사람으로 로그인</a>' : '') +
        (inv ? '<div class="ljoin" style="margin-top:4px"><div style="flex:1"><b>클럽 초대를 받으셨어요</b><div class="muted">로그인하거나 가입하면 그 클럽에 가입 신청이 돼요.</div></div></div>' : '') +
        (back ? '' : '<div class="ljoin"><div style="flex:1;min-width:0"><b>처음이세요?</b><div class="muted">가입은 무료 · 바로 시작</div></div><button type="button" class="ljbtn" data-go="join">가입하기</button></div>') +
        '<p class="lver">앱 버전 ' + LZ.VER + '</p></div></div>';
      var n = $('#nick'); n.addEventListener('input', function () { pinForce = 0; setPadLen(pinLen()); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter') n.blur(); });
      setPadLen(pinLen()); bioPaint();
      if (LZ.kickedNote) { LZ.kickedNote = false; LZ.kickNote(); }
      if (LZ.pinChangedNote) { LZ.pinChangedNote = false; LZ.dialog({ title: '비밀번호가 바뀌었어요', body: '다른 휴대폰에서 비밀번호를 새로 정해서 이 휴대폰은 로그아웃됐어요. 새 비밀번호로 로그인해 주세요.' }); }
    }
  };

  /* ───── v9.1.2 Face ID · 지문 로그인(패스키): 휴대폰 안의 열쇠로 서명해서 들어와요. 얼굴 · 지문 정보는 휴대폰 밖으로 나가지 않아요 ───── */
  function utf8(s) { return new TextEncoder().encode(String(s)); }
  function b64u(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  /** 아주 작은 CBOR 읽기(패스키 등록 정보에서 공개키만 꺼내요) */
  function cbor(buf) {
    var d = new Uint8Array(buf), p = 0;
    function n(ai) { if (ai < 24) return ai; if (ai === 24) return d[p++]; if (ai === 25) { var v = d[p] * 256 + d[p + 1]; p += 2; return v; } if (ai === 26) { var w = ((d[p] * 256 + d[p + 1]) * 256 + d[p + 2]) * 256 + d[p + 3]; p += 4; return w; } throw new Error('cbor'); }
    function it() {
      var b = d[p++], mt = b >> 5, ai = b & 31, l, i;
      if (mt === 0) return n(ai); if (mt === 1) return -1 - n(ai);
      if (mt === 2) { l = n(ai); var v = d.slice(p, p + l); p += l; return v; }
      if (mt === 3) { l = n(ai); var t = new TextDecoder().decode(d.slice(p, p + l)); p += l; return t; }
      if (mt === 4) { l = n(ai); var a = []; for (i = 0; i < l; i++) a.push(it()); return a; }
      if (mt === 5) { l = n(ai); var o = {}; for (i = 0; i < l; i++) { var k = it(); o[k] = it(); } return o; }
      if (mt === 7) { if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; }
      throw new Error('cbor');
    }
    return it();
  }
  var BIO = LZ.bio = {
    ok: null, ch: null,
    label: function () { return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? 'Face ID' : '지문 · 얼굴 인식'; },
    avail: async function () {
      if (BIO.ok !== null) return BIO.ok;
      try { BIO.ok = !!(window.PublicKeyCredential && window.isSecureContext && window.TextEncoder && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { BIO.ok = false; }
      if (/KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent)) BIO.ok = false;   // 앱 안 브라우저는 안 돼요
      return BIO.ok;
    },
    saved: function () { var x = store.json('lz.bio'); return x && x.cid ? x : null; },
    /* 아이폰은 단추를 누른 "바로 그때" 열쇠를 써야 해서, 서버에서 받을 확인 번호를 미리 받아 둬요 */
    prep: async function (kind) { try { var r = await LZ.api(kind === 'login' ? 'bioStart' : 'bioOpts', {}, kind === 'login' ? { noAuth: true, retry: 0 } : { retry: 0 }); BIO.ch = { ch: r.ch, at: Date.now(), kind: kind }; } catch (e) { BIO.ch = null; } },
    fresh: function (kind) { return BIO.ch && BIO.ch.kind === kind && Date.now() - BIO.ch.at < 240000 ? BIO.ch.ch : null; },
    register: async function () {
      var ch = BIO.fresh('reg'); if (!ch) { await BIO.prep('reg'); ch = BIO.fresh('reg'); } if (!ch) throw new Error('인터넷 연결을 확인해 주세요.');
      BIO.ch = null;
      var cred = await navigator.credentials.create({ publicKey: { challenge: utf8(ch), rp: { name: '파크골프 공략수첩', id: location.hostname }, user: { id: utf8(S.user.uid), name: S.user.nick, displayName: S.user.nick }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged', requireResidentKey: false }, timeout: 60000, attestation: 'none' } });
      var ad = cbor(cred.response.attestationObject).authData, l = ad[53] * 256 + ad[54], key = cbor(ad.slice(55 + l));
      if (key[3] !== -7 || !key[-2] || !key[-3]) throw new Error('이 휴대폰의 열쇠 방식은 아직 쓸 수 없어요.');
      var body = { cid: b64u(cred.rawId), x: b64u(key[-2]), y: b64u(key[-3]), ad: b64u(ad), cd: b64u(cred.response.clientDataJSON), name: LZ.devLabel() };
      await LZ.api('bioAdd', body, { retry: 0 });
      store.setJSON('lz.bio', { cid: body.cid, uid: S.user.uid, nick: S.user.nick });
      return true;
    },
    off: async function () { var sv = BIO.saved(); if (sv) { try { await LZ.api('bioDel', { cid: sv.cid }); } catch (e) { /* 서버에 없으면 그대로 */ } } store.del('lz.bio'); }
  };
  /** 켜기(단추에서 바로 부름) */
  LZ.act.bioOn = async function (el) {
    BIO.tap = true; var dl = el && el.closest && el.closest('.dlg'), cb = dl && dl.querySelector('[data-dlg]');
    LZ.closeSheet();
    var job = BIO.register(); if (cb) cb.click();
    try { await job; LZ.toast('다음부터 ' + BIO.label() + '로 들어와요', 3500); if (LZ.cur().name === 'meAcct') LZ.redraw(); }
    catch (e) { BIO.prep('reg'); LZ.toast(e && e.name === 'NotAllowedError' ? '취소했어요' : e && e.name === 'InvalidStateError' ? '이미 이 휴대폰에 켜져 있어요' : LZ.errText(e) || ('이 화면에서는 ' + BIO.label() + '를 켤 수 없어요'), 4000); }
  };
  LZ.act.bioOff = async function () {
    if (!(await LZ.confirm(BIO.label() + ' 로그인을 끌까요?', '이 휴대폰에서는 다시 비밀번호로 들어와요. 언제든 다시 켤 수 있어요.', '끄기'))) return;
    await BIO.off(); LZ.toast('껐어요'); LZ.redraw();
  };
  LZ.act.bioLater = function () { LZ.closeSheet(); if (S.user) store.set('lz.bioAsk.' + S.user.uid, '1'); };
  /** 비밀번호로 들어온 뒤 한 번만: "다음부터 Face ID로 들어갈까요?" */
  LZ.bioOffer = async function () {
    if (!S.user || S.user.kind === 'admin' || store.get('lz.bioAsk.' + S.user.uid) === '1') return;
    var sv = BIO.saved(); if (sv && sv.uid === S.user.uid) return;
    if (!(await BIO.avail())) return;
    for (var w = 0; w < 40 && (LZ.cur().name !== 'home' || document.querySelector('#layer .sheet:not([hidden]), #layer .dlg:not([hidden])')); w++) await new Promise(function (r) { setTimeout(r, 1500); });   // 공지 팝업 등이 닫힐 때까지 기다려요
    if (!S.user || LZ.cur().name !== 'home' || document.querySelector('#layer .sheet:not([hidden]), #layer .dlg:not([hidden])')) return;
    await BIO.prep('reg');
    var lb = BIO.label(); BIO.tap = false;
    var v = await LZ.dialog({ title: '다음부터 ' + lb + '로 들어갈까요?', html: '<p class="muted">비밀번호를 누르지 않고 ' + (lb === 'Face ID' ? '얼굴을 보면' : '지문이나 얼굴로') + ' 바로 들어와요. 얼굴 · 지문 정보는 휴대폰 밖으로 나가지 않고, 이 앱은 휴대폰이 확인했다는 표시만 받아요.</p>' +
      '<button type="button" class="btn" data-act="bioOn">' + LZ.ic('shield') + lb + ' 켜기</button><p class="hint" style="margin:6px 0 0">내 정보 › 계정 · 안전에서 언제든 켜고 끌 수 있어요.</p>', cancel: false, buttons: [{ label: '다음에', kind: 'g', value: 'later' }] });
    if (v === 'later' && !BIO.tap) store.set('lz.bioAsk.' + S.user.uid, '1');
  };
  /** 로그인 화면의 [Face ID로 들어가기] */
  LZ.act.bioLogin = async function () {
    var sv = BIO.saved(); if (!sv) return;
    var ch = BIO.fresh('login'); if (!ch) { LZ.busy(true, '준비 중…'); await BIO.prep('login'); LZ.busy(false); ch = BIO.fresh('login'); if (!ch) { LZ.toast('인터넷 연결을 확인해 주세요'); return; } }
    var a; try { a = await navigator.credentials.get({ publicKey: { challenge: utf8(ch), rpId: location.hostname, allowCredentials: [{ type: 'public-key', id: unb64u(sv.cid) }], userVerification: 'required', timeout: 60000 } }); }
    catch (e) { BIO.ch = null; BIO.prep('login'); LZ.toast(e && e.name === 'NotAllowedError' ? '취소했어요 · 비밀번호로도 들어올 수 있어요' : '이 화면에서는 ' + BIO.label() + '를 쓸 수 없어요. 비밀번호로 들어와 주세요', 4000); return; }
    BIO.ch = null; LZ.busy(true, '들어가는 중…');
    try {
      var r = await LZ.api('bioLogin', { cid: sv.cid, ad: b64u(a.response.authenticatorData), cd: b64u(a.response.clientDataJSON), sig: b64u(a.response.signature), dev: LZ.devLabel() }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; store.set('lz.nick', r.user.nick); LZ.setSession(r);
      await LZ.refreshMe().catch(function () {});
      if (LZ.acctGate()) return;
      LZ.go('home', {}, { reset: true }); LZ.afterLogin('');
      LZ.toast(r.back ? '다시 오셨네요! 블루로 돌아왔어요' : LZ.nim(r.user.nick) + ', 반가워요', 2500);
    } catch (e) {
      LZ.busy(false); BIO.prep('login');
      if (e.code === 'nobio') { store.del('lz.bio'); LZ.render(); }
      LZ.toast(e.message, 5000);
    }
  };
  async function bioPaint() {
    var box = $('#bioBox'), sv = BIO.saved(); if (!box || !sv || !(await BIO.avail())) return;
    if (!$('#bioBox')) return;
    box.innerHTML = '<button type="button" class="bio9" data-act="bioLogin">' + LZ.ic('shield') + '<span><b>' + BIO.label() + '로 들어가기</b><small>' + esc(sv.nick) + ' 회원님</small></span></button><p class="bio9or">또는 비밀번호</p>';
    BIO.prep('login');
  }
  LZ.act.otherUser = function () { store.del('lz.who'); store.del('lz.nick'); LZ.render(); };
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
      await LZ.refreshMe().catch(function () {});
      if (LZ.acctGate()) return;
      LZ.go('home', {}, { reset: true }); LZ.afterLogin('');
      LZ.toast(r.back ? '다시 오셨네요! 블루로 돌아왔어요' : LZ.nim(nick) + ', 반가워요', r.back ? 4500 : 2500);
      setTimeout(function () { LZ.bioOffer(); }, 1800);
    } catch (e) {
      LZ.busy(false); pin = ''; paintDots();
      if (e.code === 'tmpold') { await LZ.dialog({ title: '임시 번호가 만료됐어요', body: e.message }); return; }
      if (e.code === 'pin6') { pinForce = 6; setPadLen(6); LZ.toast(e.message, 6000); return; }
      LZ.toast(e.message, 4500);
    }
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
    try { var r = await LZ.api('pin', { pin: pin }); LZ.busy(false); S.user = r.user; pin = ''; await LZ.refreshMe().catch(function () {}); LZ.toast('비밀번호를 정했어요'); if (LZ.acctGate()) return; LZ.go('home', {}, { reset: true }); }
    catch (e) { LZ.busy(false); pin = ''; paintDots(); LZ.toast(e.message, 4500); }
  };
  /* ───── 카카오 본인 확인(v7.3 #22): 카카오에서 회원번호만 받아요(이름·전화번호 안 받음) ─────
     카카오 화면으로 갔다가 돌아오면(?code=) 무엇을 하던 중이었는지(lz.kakaoBack: join·verify·pw)에 따라 이어서 해요 */
  LZ.kakaoKey = async function () { if (LZ._kk !== undefined) return LZ._kk; try { var c = await LZ.api('cfg', {}, { noAuth: true }); LZ._kk = c.kakao ? c.kakao.key : ''; LZ.ptRules = c.pt || LZ.ptRules; } catch (e) { return ''; } return LZ._kk; };
  LZ.kakaoGo = async function (why, other) {
    var key = await LZ.kakaoKey(); if (!key) return false;
    store.set('lz.kakaoBack', why);
    location.href = 'https://kauth.kakao.com/oauth/authorize?client_id=' + encodeURIComponent(key) + '&redirect_uri=' + encodeURIComponent(LZ.APP_URL) + '&response_type=code&state=' + encodeURIComponent(why) + (other ? '&prompt=login' : '');   // other: "아니에요" 뒤 다른 카카오 계정으로
    return true;
  };
  /* v7.1.0 §14 연결 직전 확인: 카카오에서 받은 이름(·사진)을 보여 주고 "본인 카카오가 맞나요?" — 맞으면 1회용 확인표(kc), 아니면 null.
     이름·사진은 이 화면에만 보여 주고 저장하지 않아요(서버도 카카오 번호를 섞은 값만 둬요) */
  LZ.kakaoConfirm = async function (kcode, why) {
    var r = await LZ.api('kakaoPeek', { kcode: kcode, redirect: LZ.APP_URL }, { noAuth: true, retry: 0 });
    var av = r.img ? '<img class="kcav" src="' + esc(r.img) + '" alt="" referrerpolicy="no-referrer">' : '<span class="kcav none">' + LZ.ic('kakao') + '</span>';
    var ok = await LZ.dialog({ title: '카카오 계정 확인', html: '<div class="kconf">' + av + (r.has ? '<p class="kcname">카카오 이름 <b>' + esc(r.name) + '</b> 계정이에요.</p><p>본인 카카오가 맞나요?</p>'
        : '<p class="kcname">카카오 이름을 받지 못했어요.</p><p class="muted">카카오에서 닉네임 제공에 동의하지 않으셨어요. 이 휴대폰의 카카오가 본인 것이 맞으면 연결해 주세요.</p><p>본인 카카오가 맞나요?</p>') +
        '<p class="hint">' + LZ.ic('lock') + ' 이름·사진은 확인에만 쓰고 저장하지 않아요.</p></div>', cancel: undefined,
      buttons: [{ label: '맞아요, 연결하기', kind: 'y', value: true }, { label: '아니에요', kind: 'g', value: false }] });
    if (ok) return r.kc;
    var again = await LZ.dialog({ title: '본인 카카오로 다시 해 주세요', html: '<p>이 휴대폰에 로그인된 카카오가 본인 것이 아니면 연결하지 않아요.</p><p class="muted">"다른 카카오로 다시"를 누르면 카카오 화면에서 본인 계정으로 로그인할 수 있어요.</p>', cancel: false,
      buttons: [{ label: '다른 카카오로 다시', kind: 'y', value: true }, { label: '그만두기', kind: 'g', value: false }] });
    if (again) { LZ.busy(true, '카카오로 가는 중…'); if (!(await LZ.kakaoGo(why, 1))) LZ.busy(false); }
    return null;
  };
  var KBTN = function (act, label) { return '<button type="button" class="btn kakao kbtn" data-act="' + act + '">' + LZ.ic('kakao') + '<span>' + (label || '카카오로 본인 확인') + '</span></button>'; };
  var KNOTE = '<p class="hint knote">' + LZ.ic('lock') + '<span>카카오에서는 <b>회원번호</b>만 저장해요. 카카오 이름은 본인 확인 화면에 한 번 보여 드리기만 하고 저장하지 않아요(전화번호는 받지 않아요). 카카오 계정 하나에 회원 한 분이에요.</span></p>';
  /** 로그인한 뒤 먼저 보여 줄 화면: 블랙 안내 → 기존 회원 카카오 확인. 보여 줬으면 true */
  LZ.acctGate = function () {
    var u = S.user; if (!u) return false;
    if (u.kind === 'black') { LZ.go('blackNote', {}, { reset: true }); return true; }
    if (u.needKid) { LZ.go('kakaoAsk', {}, { reset: true }); return true; }
    return false;
  };
  /* 가입: ① 카카오로 본인 확인 → ② 닉네임·비밀번호 4자리 */
  var JK = { kt: '', adm: 0, nick: '' };
  LZ.screens.join = {
    nobar: true,
    show: async function (p, root) {
      var cfg = null; try { cfg = await LZ.api('cfg', { inv: store.get('lz.inv') || '' }, { noAuth: true }); if (cfg && cfg.appVer && LZ.pwa && LZ.pwa.verCheck) LZ.pwa.verCheck(cfg.appVer); LZ._kk = cfg.kakao ? cfg.kakao.key : ''; } catch (e) { /* 무시 */ }
      var ref = store.get('lz.ref') || '', refNick = '', kon = !!(cfg && cfg.kakao), kerr = '';
      if (ref) { try { refNick = (await LZ.api('refName', { ref: ref }, { noAuth: true })).nick; } catch (e) { /* 무시 */ } }
      var dr = store.json('lz.jdraft'); if (dr && Date.now() - dr.at < 3600000) JK.nick = dr.nick || JK.nick; store.del('lz.jdraft');
      if (p.kcode) { var kc0 = p.kcode; p.kcode = ''; root.innerHTML = LZ.hdr('가입하기', { back: true, noBell: 1 }) + LZ.skeleton(3); try { var kc = await LZ.kakaoConfirm(kc0, 'join'); if (kc) { var k = await LZ.api('kakaoCheck', { kc: kc }, { noAuth: true, retry: 0 }); JK.kt = k.kt; JK.adm = k.adm; JK.at = Date.now(); } else kerr = '본인 카카오가 아니라고 하셨어요. 본인 카카오로 다시 확인해 주세요.'; } catch (e) { kerr = e.message; } }
      if (p.kfail) kerr = '카카오 확인을 마치지 못했어요. 다시 해 주세요.';
      if (JK.kt && Date.now() - (JK.at || 0) > 29 * 60000) JK.kt = '';
      var done = !kon || !!JK.kt;
      root.innerHTML = LZ.hdr('가입하기', { back: true, noBell: 1 }) + '<div class="wrap">' +
        (cfg && cfg.inv ? '<div class="box"><b>' + esc(cfg.inv.name) + '</b> 클럽 초대 · 캡틴 ' + LZ.nimE(cfg.inv.captainNick) + ' · 회원 ' + cfg.inv.members + '명<br><span class="muted">가입하면 이 클럽에 ' + (cfg.inv.auto ? '바로 들어가요' : '가입 신청이 돼요') + '</span></div>' : '') +
        (refNick ? '<div class="box"><b>' + esc(refNick) + '</b>님의 초대로 오셨어요' + (!(cfg && cfg.inv) && store.get('lz.noclub') !== '1' ? '<br><span class="muted">가입하면 ' + LZ.nimE(refNick) + ' 클럽에 가입 신청이 들어가요</span>' : '') + '</div>' : '') +
        '<div class="jsteps9" id="jbar"></div>' +
        (kon ? '<div class="jst9" data-s="1"><div class="t19">카카오로 본인 확인</div><p class="cap19">카카오 계정 하나로 한 분만 가입해요</p><div class="card kstep' + (JK.kt ? ' done' : '') + '">' +
          (JK.kt ? '<p class="kok">' + LZ.ic('check') + ' 카카오 확인을 마쳤어요' + (JK.adm ? ' <span class="chip">관리자 카카오</span>' : '') + '</p>' : (kerr ? '<p class="err" id="kerr">' + esc(kerr) + '</p>' : '<p class="muted" style="margin:0 0 8px">카카오 화면에 다녀오면 이 화면으로 돌아와요. 이름 · 전화번호는 저장하지 않아요.</p>') + KBTN('joinKakao') + KNOTE) + '</div></div>' : '') +
        '<div class="jst9" data-s="2" hidden><div class="t19">닉네임</div><p class="cap19">다른 회원님께 보이는 이름이에요 · 스크린 기계에 적는 닉네임과 같으면 좋아요</p><input type="text" id="jnick" class="reginp" placeholder="한글 · 영문 · 숫자 2~8자" maxlength="8" value="' + esc(JK.nick) + '" enterkeyhint="next"><p class="hint" id="jhint">7일에 한 번 바꿀 수 있어요</p>' +
          '<button type="button" class="btn" data-act="joinNext">다음 ›</button></div>' +
        '<div class="jst9" data-s="3" hidden><div class="t19">비밀번호 4자리</div><p class="cap19">로그인할 때마다 써요' + (kon ? ' · 잊으면 카카오로 확인하고 새로 정해요' : '') + '</p>' + padHtml(4) +
          '<label class="lb agl"><input type="checkbox" id="agree"><span class="muted">가입은 무료이고 한 분당 하나예요. 닉네임 · 기록은 클럽 회원님께 보일 수 있어요. 비밀번호는 암호화해서 저장돼요.</span></label>' +
          '<button type="button" class="btn org" data-act="joinOk">가입 완료</button><button type="button" class="lnk" data-act="joinPrev">‹ 닉네임 고치기</button></div>' +
        '<p class="hint">가입은 무료예요. 기록·라운드·시상식·클럽 가입이 바로 돼요. 필드에서는 파크골프·일반골프 스코어도 기록해요.</p></div>';
      pin = '';
      JK.kon = kon; joinStep(kon && !JK.kt ? 1 : (JK.st === 3 ? 3 : 2));
      var n = $('#jnick'), chk = null;
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); LZ.act.joinNext(); } });
      n.addEventListener('input', function () { JK.nick = LZ.stripNick(n.value); clearTimeout(chk); chk = setTimeout(async function () { var v = LZ.stripNick(n.value); if (v.length < 2) return; try { var r = await LZ.api('joinCheck', { nick: v }, { noAuth: true, retry: 0 }); $('#jhint').innerHTML = r.res ? '<span class="err">' + esc(r.res.msg) + '</span>' : '<span class="okt">쓸 수 있는 닉네임이에요 ✓</span>'; } catch (e) { /* 무시 */ } }, 500); });
    }
  };
  /** 가입 단계 보여 주기(다시 그리지 않고 숨김만 바꿔요 · 비밀번호 점 그대로) */
  function joinStep(st) {
    JK.st = st; var N = JK.kon ? 3 : 2, k = JK.kon ? st : st - 1;
    $$('.jst9').forEach(function (x) { x.hidden = +x.dataset.s !== st; });
    var b = $('#jbar'); if (b) b.innerHTML = '<div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="' + N + '" aria-valuenow="' + k + '" aria-label="가입 ' + N + '단계 중 ' + k + '단계"><i style="width:' + Math.round(k / N * 100) + '%"></i></div><span>' + k + ' / ' + N + '</span>';
    if (st === 2) setTimeout(function () { var n = $('#jnick'); if (n && !n.value) n.focus(); }, 60);
    window.scrollTo(0, 0);
  }
  LZ.act.joinNext = async function () {
    var nick = LZ.stripNick($('#jnick').value);
    if (nick.length < 2) { LZ.toast('닉네임을 2~8자로 적어 주세요'); return; }
    try { var r = await LZ.api('joinCheck', { nick: nick }, { noAuth: true, retry: 0 }); if (r.res) { $('#jhint').innerHTML = '<span class="err">' + esc(r.res.msg) + '</span>'; LZ.toast(r.res.msg, 4000); return; } } catch (e) { /* 신호 없음: 가입할 때 다시 확인 */ }
    JK.nick = nick; var a = document.activeElement; if (a && a.blur) a.blur(); joinStep(3);
  };
  LZ.act.joinPrev = function () { joinStep(2); };
  LZ.act.joinKakao = async function () {
    var n = $('#jnick'); if (n) store.setJSON('lz.jdraft', { nick: LZ.stripNick(n.value), at: Date.now() });
    LZ.busy(true, '카카오로 가는 중…');
    if (!(await LZ.kakaoGo('join'))) { LZ.busy(false); LZ.toast('카카오 연결을 불러오지 못했어요. 잠시 뒤에 다시 해 주세요', 4500); }
  };
  LZ.act.joinOk = async function () {
    var nick = LZ.stripNick($('#jnick').value);
    if ($('.kstep') && !JK.kt) { LZ.toast('먼저 카카오로 본인 확인을 해 주세요', 4000); return; }
    if (!nick) { LZ.toast('닉네임을 적어 주세요'); joinStep(2); return; }
    if (pin.length < 4) { LZ.toast('비밀번호 4자리를 눌러 주세요'); return; }
    if (!$('#agree').checked) { LZ.toast('안내를 읽고 체크해 주세요'); return; }
    LZ.busy(true, '가입하는 중…');
    try {
      var r = await LZ.api('join', { nick: nick, pin: pin, agree: 1, dev: LZ.devId(), ref: store.get('lz.ref') || '', inv: store.get('lz.inv') || (store.get('lz.noclub') === '1' ? '0' : ''), ua: LZ.devLabel(), kt: JK.kt }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; JK.kt = ''; JK.nick = ''; store.set('lz.nick', nick); store.del('lz.inv'); store.del('lz.ref'); store.del('lz.noclub'); LZ.setSession(r);
      await LZ.refreshMe().catch(function () {});
      LZ.firstGuide = true;
      LZ.go('home', {}, { reset: true });
      LZ.sheet('<h2>가입했어요</h2><p class="muted">로그인은 닉네임 <b>' + esc(nick) + '</b>과 비밀번호 4자리로 해요. 비밀번호를 잊으면 로그인 화면의 "비밀번호를 잊었어요"에서 카카오로 찾아요.</p>' + (r.inv ? '<div class="box">' + esc(r.inv.name) + ' 클럽에 ' + (r.inv.joined ? '들어왔어요' : '가입 신청했어요. 캡틴이 함께하기를 누르면 홈에 생겨요') + '</div>' : '') +
        (LZ.store.get('lz.fsAsked') ? '' : '<div class="card tight fsask" style="margin-top:12px"><b>파크골프가 처음이세요?</b><p class="muted" style="margin:4px 0 10px">규칙 · 점수 세는 법 · 매너를 쉽게 정리했어요.</p><button type="button" class="btn" data-act="fsAskGo">' + LZ.ic('ball') + '파크골프 첫걸음 보기</button><button type="button" class="btn g" data-act="sheetClose">괜찮아요</button></div>'));
      try { LZ.store.set('lz.fsAsked', '1'); } catch (e2) { /* 기억 못 해도 한 번만(가입 직후) 보여요 */ }
    } catch (e) { LZ.busy(false); pin = ''; paintDots(); if (e.code === 'needkid') { JK.kt = ''; LZ.redraw(); } LZ.toast(e.message, 5500); }
  };
  LZ.act.fsAskGo = function () { LZ.closeSheet(); LZ.go('firstSteps'); };   // v7.0 #11 가입 직후 한 번: 첫걸음 안내
  /* 기존 회원: 다음 로그인 때 한 번 카카오 확인(카카오 화면을 못 열면 "다음에 하기") */
  LZ.screens.kakaoAsk = {
    nobar: true,
    show: async function (p, root) {
      var err = '';
      if (p.kcode) { var kv0 = p.kcode; p.kcode = ''; root.innerHTML = LZ.hdr('카카오 본인 확인', { noBell: 1, noHelp: 1 }) + LZ.skeleton(3); try { var kcv = await LZ.kakaoConfirm(kv0, 'verify'); if (!kcv) throw new Error('본인 카카오가 아니라고 하셨어요. 본인 카카오로 다시 확인해 주세요.'); var r = await LZ.api('kakaoVerify', { kc: kcv }, { retry: 0 }); S.user = r.user; await LZ.refreshMe().catch(function () {}); p.kcode = ''; LZ.toast('카카오 확인을 마쳤어요. 고맙습니다', 3500); if (S.user.kind === 'admin') { LZ.go('adminCfg', {}, { reset: true }); return; } LZ.go('home', {}, { reset: true }); LZ.afterLogin(''); return; } catch (e) { err = e.message; p.fail = 1; } p.kcode = ''; }
      if (p.kfail) err = err || '카카오 확인을 마치지 못했어요.';
      var key = await LZ.kakaoKey(), fail = p.fail || p.kfail || !key;
      root.innerHTML = LZ.hdr('카카오 본인 확인', LZ.stack.length > 1 ? { back: true, noBell: 1 } : { noBell: 1, noHelp: 1, logout: 1 }) + '<div class="wrap"><div class="card kask"><div class="kic">' + LZ.ic('shield') + '</div>' +
        (S.user.kunl ? '<h3>' + LZ.nimE(S.user.nick) + ', 카카오를 다시 연결해 주세요</h3><p>카카오 연결이 풀려 있어요. <b>본인 휴대폰의 본인 카카오</b>로 다시 연결하면 기록·결제를 예전처럼 쓸 수 있어요.</p>'
          : '<h3>' + LZ.nimE(S.user.nick) + ', 카카오로 한 번만 확인해 주세요</h3><p>이제 <b>카카오 계정 하나에 회원 한 분</b>이 되도록 바뀌었어요. 확인을 마치면 비밀번호를 잊었을 때도 <b>카카오로 바로 새로 정할 수</b> 있어요.</p>') +
        (err ? '<p class="err">' + esc(err) + '</p>' : '') + (!key ? '<p class="err">카카오 연결을 불러오지 못했어요.</p>' : '') +
        (key ? KBTN('kidGo', fail ? '다시 해 보기' : '카카오로 본인 확인') : '<button type="button" class="btn" data-act="kidRetry">다시 해 보기</button>') + KNOTE +
        (fail ? '<button type="button" class="btn g" data-go="qnaNew">관리자에게 문의하기</button><p class="hint">카카오 확인을 마쳐야 기록·클럽 같은 기능을 쓸 수 있어요. 잘 안 되면 문의해 주세요.</p>' : '') + '</div></div>';
    }
  };
  LZ.act.kidGo = async function () { LZ.busy(true, '카카오로 가는 중…'); if (!(await LZ.kakaoGo('verify'))) { LZ.busy(false); LZ.go('kakaoAsk', { fail: 1 }, { replace: true }); } };
  LZ.act.kidRetry = function () { LZ._kk = undefined; LZ.redraw(); };
  /* 블랙 안내(v7.3 #21): 로그인·이 안내·문의하기만 */
  LZ.screens.blackNote = {
    nobar: true,
    show: function (p, root) {
      var u = S.user || {}, b = u.black || {}, dorm = b.why === 'dorm';
      root.innerHTML = LZ.hdr('이용 안내', { noBell: 1, noHelp: 1, logout: 1 }) + '<div class="wrap"><div class="card blk"><div class="kic">' + LZ.ic('lock') + '</div>' +
        '<h3>' + LZ.nimE(u.nick) + '은 지금 <b>블랙</b>이에요</h3>' +
        '<p>' + (dorm ? '오래 들어오지 않으셔서 쉬는 상태가 됐어요.' : '관리자가 이용을 잠시 멈췄어요. 이유가 궁금하거나 이의가 있으면 아래 <b>문의하기</b>로 말씀해 주세요.') + '</p>' +
        '<div class="blkd"><div><span>블랙이 된 날</span><b>' + esc(LZ.fmtYmd(b.since)) + '</b></div><div><span>계정 삭제 예정</span><b>' + esc(LZ.fmtYmd(b.del)) + '</b></div><div><span>남은 날</span><b>' + (b.left || 0) + '일</b></div></div>' +
        '<p class="muted">그 날이 지나면 닉네임·내 수첩 기록·적립 포인트가 지워져요. 등록한 코스와 함께 친 라운드 점수는 "탈퇴 회원"으로 남아요.</p>' +
        '<button type="button" class="btn" data-go="qnaList">' + LZ.ic('chat') + ' 문의하기</button><button type="button" class="btn g" data-go="noti">' + LZ.ic('bell') + ' 알림 보기</button></div></div>';
    }
  };
  /* 비밀번호 찾기(v7.3): 닉네임 → 카카오로 확인 → 새 비밀번호 4자리(두 번). 카카오 없이 관리자가 만든 계정만 관리자 도움 */
  LZ.act.forgot = function () {
    var nick = LZ.stripNick(($('#nick') || {}).value || '');
    LZ.sheet('<h2>비밀번호 찾기</h2><p class="muted">캡틴은 비밀번호에 손댈 수 없어요. 아래 방법으로 직접 새로 정해요.</p>' +
      '<button type="button" class="opt on" data-go="pwFind" data-p=\'' + esc(JSON.stringify({ nick: nick })) + '\'><b>' + LZ.ic('kakao') + ' 카카오로 확인하고 새로 정하기</b><span>가입할 때 확인한 카카오 계정으로</span></button>' +
      '<button type="button" class="opt" data-go="pwReq" data-p=\'' + esc(JSON.stringify({ nick: nick })) + '\'><b>관리자에게 도움 요청</b><span>관리자가 만들어 준 계정(카카오 확인 없음) · 임시 번호를 받아요</span></button>' +
      (store.get('lz.pwreq') ? '<button type="button" class="opt" data-go="pwReqStatus"><b>내 신청 확인</b><span>신청 번호 ' + esc(store.json('lz.pwreq').code) + ' · 임시 번호가 나왔는지 봐요</span></button>' : ''));
  };
  var PF = { kt: '', nick: '', first: '' };
  LZ.screens.pwFind = {
    nobar: true,
    show: async function (p, root) {
      pin = ''; var err = '';
      if (p.kcode) {
        var nk = store.get('lz.pwNick') || '';
        var kp0 = p.kcode; p.kcode = ''; root.innerHTML = LZ.hdr('비밀번호 새로 정하기', { back: true, noBell: 1 }) + LZ.skeleton(3);
        try { var kcp = await LZ.kakaoConfirm(kp0, 'pw'); if (!kcp) throw new Error('본인 카카오가 아니라고 하셨어요. 가입할 때 확인한 본인 카카오로 다시 해 주세요.'); var r = await LZ.api('pwKakao', { nick: nk, kc: kcp }, { noAuth: true, retry: 0 }); PF = { kt: r.kt, nick: r.nick, first: '', at: Date.now() }; } catch (e) { err = e.message; PF.kt = ''; PF.nick = nk; PF.code = e.code; }
        store.del('lz.pwNick');
      }
      if (p.kfail) err = '카카오 확인을 마치지 못했어요. 다시 해 주세요.';
      var hd = LZ.hdr('비밀번호 새로 정하기', { back: true, noBell: 1 });
      if (PF.kt && Date.now() - (PF.at || 0) < 14 * 60000) {
        root.innerHTML = hd + '<div class="wrap"><div class="card"><p class="kok">' + LZ.ic('check') + ' <b>' + esc(PF.nick) + '</b>님 카카오 확인을 마쳤어요</p><label class="lb" id="pfl">' + (PF.first ? '한 번 더 눌러 주세요' : '새 비밀번호 숫자 4자리') + '</label>' + padHtml(4) +
          '<button type="button" class="btn" data-act="pfOk">' + (PF.first ? '이 번호로 정하기' : '다음') + '</button><p class="hint">같은 숫자 반복, 1234 같은 연속 번호는 안 돼요. 바꾸면 다른 휴대폰은 로그아웃돼요.</p></div></div>';
        return;
      }
      root.innerHTML = hd + '<div class="wrap"><div class="card"><label class="lb" style="margin-top:0" for="fnick">닉네임</label><input type="text" id="fnick" class="lnick" value="' + esc(p.nick || PF.nick || store.get('lz.nick') || '') + '" maxlength="8" placeholder="닉네임">' +
        (err ? '<p class="err" id="pferr">' + esc(err) + '</p>' : '<p class="muted">가입할 때 확인한 카카오 계정으로 본인인지 확인해요.</p>') + KBTN('pfKakao', '카카오로 확인') + KNOTE +
        (PF.code === 'nokid' ? '<button type="button" class="btn o" data-go="pwReq" data-p=\'' + esc(JSON.stringify({ nick: PF.nick })) + '\'>관리자에게 도움 요청</button>' : '') + '</div></div>';
    }
  };
  LZ.act.pfKakao = async function () {
    var nick = LZ.stripNick($('#fnick').value); if (!nick) { LZ.toast('닉네임을 적어 주세요'); $('#fnick').focus(); return; }
    store.set('lz.pwNick', nick); LZ.busy(true, '카카오로 가는 중…');
    if (!(await LZ.kakaoGo('pw'))) { LZ.busy(false); LZ.toast('카카오 연결을 불러오지 못했어요. "관리자에게 도움 요청"을 해 주세요', 5000); }
  };
  LZ.act.pfOk = async function () {
    if (pin.length < 4) { LZ.toast('숫자 4자리를 눌러 주세요'); return; }
    if (!PF.first) { PF.first = pin; pin = ''; LZ.redraw(); return; }
    if (PF.first !== pin) { PF.first = ''; pin = ''; LZ.toast('두 번 누른 번호가 달라요. 처음부터 다시 눌러 주세요', 4000); LZ.redraw(); return; }
    LZ.busy(true, '저장 중…');
    try {
      var r = await LZ.api('pwKakaoSet', { kt: PF.kt, pin: pin, dev: LZ.devLabel() }, { noAuth: true, retry: 0 });
      LZ.busy(false); pin = ''; store.set('lz.nick', PF.nick); PF = { kt: '', nick: '', first: '' }; LZ.setSession(r); await LZ.refreshMe().catch(function () {});
      LZ.toast('새 비밀번호로 정했어요', 3500); if (LZ.acctGate()) return; LZ.go('home', {}, { reset: true });
    } catch (e) { LZ.busy(false); pin = ''; PF.first = ''; if (e.code === 'kold') PF.kt = ''; LZ.toast(e.message, 5000); LZ.redraw(); }
  };
  LZ.screens.pwReq = {
    nobar: true,
    show: function (p, root) {
      root.innerHTML = LZ.hdr('관리자에게 찾기 신청', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0 0 6px">본인 확인용으로 세 가지만 적어 주세요. 처리가 끝나면 연락처는 바로 지워요.</p>' +
        '<label class="lb">닉네임</label><input type="text" id="qnick" value="' + esc(p.nick || '') + '" maxlength="8"><label class="lb">가입한 때</label><input type="text" id="qwhen" placeholder="예: 올해 9월쯤, 작년 봄" maxlength="30"><label class="lb">연락받을 곳</label><input type="text" id="qcontact" placeholder="카카오톡 아이디나 전화번호" maxlength="40">' +
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
      root.innerHTML = LZ.hdr('내 신청 확인', { back: true, noBell: 1 }) + '<div class="wrap"><div class="card"><p class="muted" style="margin:0">신청 번호 <b>' + esc(q.code) + '</b> · ' + LZ.nimE(q.nick) + ' · ' + LZ.fmtDate(q.at, true) + '</p></div>' + body + '</div>';
    }
  };
  LZ.screens.offline = {
    nobar: true,
    show: function (p, root) {
      root.innerHTML = '<div class="wrap" style="padding-top:60px"><div class="card center"><div class="bigic">' + LZ.ic('help') + '</div><h3>서버에 연결하지 못했어요</h3><p class="muted">' + esc(LZ.errText(p.err)) + '</p><button type="button" class="btn" data-act="retryBoot">다시 시도</button><button type="button" class="btn g" data-act="logoutLocal">다른 닉네임으로 로그인</button></div></div>';
    }
  };
  LZ.act.retryBoot = function () { location.reload(); };
  LZ.act.logoutLocal = function () { LZ.clearSession(); LZ.go('login', {}, { reset: true }); };
})();
