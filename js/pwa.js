/* 홈 화면 추가 안내 · 카카오톡 안 브라우저에서 밖으로 열기 · 새 버전 알림 · 푸시 알림 눌렀을 때 화면 열기 */
(function () {
  'use strict';
  var LZ = window.LZ, store = LZ.store, P = LZ.pwa = {}, ua = navigator.userAgent || '';
  P.isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  P.isAndroid = /Android/i.test(ua);
  P.standalone = function () { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; };
  P.inApp = function () { return /KAKAOTALK/i.test(ua) ? 'kakao' : /NAVER\(inapp/i.test(ua) ? 'naver' : /DaumApps/i.test(ua) ? 'daum' : /Line\//i.test(ua) ? 'line' : /FBAN|FBAV|Instagram/i.test(ua) ? 'sns' : null; };
  P.externalUrl = function () { var url = location.href; if (/KAKAOTALK/i.test(ua)) return 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url); if (P.isAndroid) return 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end'; return ''; };
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', function () { deferred = null; store.set('lz.installed', '1'); });
  P.guide = async function () {
    if (deferred) { var d = deferred; deferred = null; d.prompt(); var r = await d.userChoice; if (r && r.outcome === 'accepted') { LZ.toast('홈 화면에 추가했어요. 앱 아이콘으로 열어 주세요', 5000); return; } }
    if (P.standalone()) { LZ.toast('이미 앱으로 열려 있어요'); return; }
    if (P.inApp()) { LZ.sheet('<h2>기본 브라우저로 열어요</h2><p class="muted">카카오톡 안에서는 홈 화면에 추가할 수 없어요. 아래를 눌러 크롬·사파리로 연 뒤 다시 해 주세요.</p>' + (P.externalUrl() ? '<a class="btn" href="' + LZ.esc(P.externalUrl()) + '">기본 브라우저로 열기</a>' : '<p>오른쪽 위 ⋮ 메뉴 → "다른 브라우저로 열기"</p>')); return; }
    LZ.sheet('<h2>홈 화면에 추가</h2>' + (P.isIOS ? '<div class="box">① 사파리 아래 <b>공유</b> 단추(네모에 화살표)<br>② <b>홈 화면에 추가</b><br>③ 오른쪽 위 <b>추가</b></div><p class="muted">아이폰은 홈 화면에 추가한 뒤에 푸시 알림을 받을 수 있어요.</p>' : '<div class="box">① 브라우저 오른쪽 위 <b>⋮</b> 메뉴<br>② <b>홈 화면에 추가</b> 또는 <b>앱 설치</b><br>③ <b>설치</b></div>') + '<p class="muted">앱 아이콘으로 열면 더 빠르고 알림도 받아요.</p>');
  };
  /* 카카오톡 안 브라우저로 들어왔으면 한 번만 안내(가입·로그인은 되지만 홈 화면 추가·알림이 안 됨) */
  P.inAppNote = function () { if (!P.inApp() || store.get('lz.inappNote') === '1') return; store.set('lz.inappNote', '1'); var x = P.externalUrl(); LZ.toast('카카오톡 안에서 열렸어요. ' + (x ? '"홈 화면에 추가"하려면 내 정보에서 기본 브라우저로 열어 주세요' : '기본 브라우저로 열면 더 편해요'), 6000); };
  /* 버전 확인: 서버가 알려 준 앱 버전이 내 것보다 높으면 저장된 껍데기를 모두 지우고 새로 받음(10분에 한 번만 시도, 두 번 안 되면 손으로 하는 방법 안내) */
  function verNum(v) { return String(v || '0').split('.').map(function (x) { return +x || 0; }).reduce(function (a, x) { return a * 1000 + x; }, 0); }
  P.hardRefresh = async function (quiet) {
    try { if ('serviceWorker' in navigator) { var rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(function (r) { return r.unregister(); })); } } catch (e) { /* 무시 */ }
    try { if (window.caches) { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); } } catch (e) { /* 무시 */ }
    if (!quiet) LZ.toast('최신 버전으로 새로 여는 중…', 3000);
    setTimeout(function () { location.replace(location.pathname + '?v=' + Date.now() + location.hash); }, quiet ? 0 : 400);
  };
  P.verCheck = function (serverVer) {
    if (!serverVer || verNum(serverVer) <= verNum(LZ.VER)) { if (store.get('lz.verTry')) store.del('lz.verTry'); return false; }
    var tried = +store.get('lz.verTry') || 0, n = +store.get('lz.verTryN') || 0;
    if (Date.now() - tried < 600000) {                                          // 방금 시도했는데도 옛 버전이면 손으로
      if (n >= 2 && store.get('lz.verNote') !== serverVer) { store.set('lz.verNote', serverVer); LZ.dialog({ title: '새 버전(v' + serverVer + ')이 안 받아져요', html: '<p>지금 v' + LZ.VER + '을 쓰고 계셔요. 아래처럼 해 주세요.</p><div class="box">' + (P.isIOS ? '① 홈 화면의 앱 아이콘을 지운 뒤<br>② 사파리로 다시 열고<br>③ 홈 화면에 다시 추가' : '① 휴대폰 설정 → 앱 → 크롬 → 저장공간 → <b>캐시 삭제</b><br>② 앱을 완전히 닫았다가 다시 열기') + '</div>', cancel: 'ok' }); }
      return false;
    }
    store.set('lz.verTry', String(Date.now())); store.set('lz.verTryN', String(n + 1));
    if (LZ.guard && LZ.guard.dirty && LZ.guard.dirty()) return false;
    P.hardRefresh(true); return true;
  };
  /* 홈 화면에 추가 안내: 브라우저로 열 때마다(앱으로 열면 안 나와요) */
  P.installNudge = function () {
    if (P.standalone() || P.nudged || (navigator.webdriver && store.get('lz.nudgeForce') !== '1')) return; P.nudged = true;
    setTimeout(function () {
      if (document.querySelector('#layer .sheet, #layer .dlg')) return;
      var inapp = P.inApp();
      LZ.sheet('<h2>' + LZ.ic('home') + ' 홈 화면에 추가하세요</h2><p class="muted">홈 화면의 앱 아이콘으로 열면 더 빨리 열리고, 로그인이 유지되고, 알림도 받을 수 있어요.</p>' +
        (inapp ? '<div class="box">지금은 카카오톡 안에서 열려 있어요. 먼저 <b>기본 브라우저로 열기</b>를 누른 뒤 홈 화면에 추가해 주세요.</div>' : P.isIOS ? '<div class="box">① 사파리 아래 <b>공유</b> 단추(네모에 화살표)<br>② <b>홈 화면에 추가</b><br>③ 오른쪽 위 <b>추가</b></div>' : '<div class="box">① 브라우저 오른쪽 위 <b>⋮</b> 메뉴<br>② <b>홈 화면에 추가</b>(또는 앱 설치)<br>③ <b>설치</b></div>') +
        '<button type="button" class="btn" data-act="homeAdd">' + (inapp ? '기본 브라우저로 열기' : P.isIOS ? '알겠어요' : '홈 화면에 추가') + '</button>');
    }, 1500);
  };
  /* 새 버전: 서비스 워커가 새것을 받으면 막 열었을 땐 바로, 쓰는 중이면 물어보고 바꿈 */
  P.registerSW = function () {
    if (!('serviceWorker' in navigator)) return;
    var had = !!navigator.serviceWorker.controller, reloaded = false, t0 = Date.now();
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (reloaded || !had) return; reloaded = true; location.reload(); });
    function early() { return Date.now() - t0 < 20000 && !(LZ.guard && LZ.guard.dirty && LZ.guard.dirty()); }
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      function offer(w) { var go = function () { w.postMessage({ type: 'SKIP_WAITING' }); }; if (early()) go(); else LZ.dialog({ title: '새 버전이 있어요', body: '지금 바꿀까요? 적던 내용은 먼저 저장해 주세요.', cancel: false, buttons: [{ label: '지금 바꾸기', kind: 'y', value: true }, { label: '나중에', kind: 'g', value: false }] }).then(function (ok) { if (ok) go(); }); }
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', function () { var w = reg.installing; if (!w) return; w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); }); });
      reg.update().catch(function () {});
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
      setInterval(function () { reg.update().catch(function () {}); }, 3600000);
    }).catch(function () {});
    /* 푸시 알림을 눌러 앱이 열렸을 때: 서비스 워커가 보낸 "to" 화면으로 */
    navigator.serviceWorker.addEventListener('message', function (e) { var d = e.data || {}; if (d.type === 'OPEN' && d.to && LZ.S.user) { LZ.goTo(d.to); LZ.refreshMe().then(LZ.paintBell).catch(function () {}); } });
  };
})();
