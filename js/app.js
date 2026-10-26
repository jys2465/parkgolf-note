/* 시작: core.js 의 boot 가 화면을 그려요. 여기서는 홈 화면 추가 안내와 서비스 워커만 */
(function () { 'use strict'; var LZ = window.LZ; document.addEventListener('DOMContentLoaded', function () { if (LZ.pwa) { LZ.pwa.registerSW(); LZ.pwa.inAppNote(); } }); })();
