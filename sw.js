/* 서비스 워커 — 앱 껍데기를 기기에 저장해서 더 빨리 열리고, 푸시 알림을 받아요.
 * ★ 파일을 고쳐 GitHub 에 올릴 때마다 아래 VERSION 숫자를 올리세요. (모든 기기가 새 버전으로 바뀝니다) */
const VERSION = '4.0.0';
const CACHE = 'lezuro-' + VERSION;
const SHELL = [
  './', 'index.html', 'manifest.json', 'css/app.css',
  'js/config.js', 'js/core.js', 'js/auth.js', 'js/home.js', 'js/screen.js', 'js/field.js', 'js/me.js', 'js/admin.js', 'js/pwa.js', 'js/app.js', 'vendor/qrcode.js',
  'assets/hero.webp', 'assets/logo-dark.png', 'assets/logo-light.png', 'assets/og-card.jpg', 'assets/promo-invite.jpg', 'assets/nosleep.mp4', 'assets/nosleep.webm',
  'assets/fonts/Pretendard-Regular.woff2', 'assets/fonts/Pretendard-Bold.woff2', 'assets/fonts/Pretendard-ExtraBold.woff2',
  'icons/icon-192.png', 'icons/icon-maskable-512.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const cache = await caches.open(CACHE);
    const res = await Promise.allSettled(SHELL.map(function (u) { return cache.add(new Request(u, { cache: 'reload' })); }));
    if (res[1].status !== 'fulfilled') throw new Error('index.html 을 저장하지 못했어요');
  })());
});
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k.indexOf('lezuro-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});
self.addEventListener('message', function (e) { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
async function swr(req) {
  const cache = await caches.open(CACHE), hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req, { cache: 'no-cache' }).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(function () { return null; });
  if (hit) { net.catch(function () {}); return hit; }
  const res = await net;
  if (res) return res;
  if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
  return new Response('인터넷에 연결되어 있지 않아요', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                  // 저장·로그인(POST)은 절대 가로채지 않음
  if (new URL(req.url).origin === self.location.origin) e.respondWith(swr(req));
});
/* 푸시 알림: 서버가 {title, body, to} 를 보내요. 누르면 앱을 열고 그 화면으로 */
self.addEventListener('push', function (e) {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: '파크골프 공략수첩', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '파크골프 공략수첩', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || d.to || 'lz', renotify: !!d.tag, data: { to: d.to || '' }, vibrate: [80, 40, 80] }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const to = (e.notification.data && e.notification.data.to) || '';
  e.waitUntil((async function () {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { await c.focus(); c.postMessage({ type: 'OPEN', to: to }); return; } }
    const base = self.registration.scope;
    await self.clients.openWindow(to ? base + '#' + to : base);
  })());
});
