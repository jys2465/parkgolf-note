/* ★ 개발자가 고치는 파일입니다. 비밀번호나 열쇠는 들어 있지 않아서, 저장소가 공개(Public)여도 안전합니다.
 *  API: 수파베이스 Edge Function 주소.   RT: 실시간(라운드 점수판) 웹소켓 주소 — 공개 키(publishable)만 들어가요.
 *  APP_URL: 이 앱이 올라가 있는 주소(초대 링크·카카오 연결에 쓰여요). 저장소 주소가 바뀌면 함께 바꿔 주세요. */
window.LZ_CONFIG = {
  API: 'https://achlxwcfcqaffazlxuxe.supabase.co/functions/v1/api',
  RT: 'wss://achlxwcfcqaffazlxuxe.supabase.co/realtime/v1/websocket?apikey=sb_publishable_Hf1XtEPGi3Q30VhWz39cpg_qA2SgZYG&vsn=1.0.0',
  APP_URL: 'https://jys2465.github.io/parkgolf-note/'
};
window.LZ_VER = '7.0.5';
