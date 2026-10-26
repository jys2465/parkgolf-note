-- ════════════════════════════════════════════════════════════════
--  파크골프 공략수첩 v4 — 알림 보내기 예약 추가 (한 번만 실행)
--  새 index.ts 를 올린 다음 SQL Editor 에서 Run. (예전 cron.sql 의 새벽 정리 예약은 그대로 둡니다)
-- ════════════════════════════════════════════════════════════════
select cron.unschedule(jobid) from cron.job where jobname in ('lz-outbox');

-- 5분마다: 쌓인 알림(앱 푸시 · 카카오톡 나에게 보내기)을 보냄. 밤 10시~아침 7시 알림은 아침 7시에 모아서.
select cron.schedule('lz-outbox', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://achlxwcfcqaffazlxuxe.supabase.co/functions/v1/api',
    body := jsonb_build_object('a', '_cron', 'mode', 'outbox', 'key', (select v from public.lz_prop where k = 'CRON_KEY')),
    headers := '{"Content-Type": "text/plain"}'::jsonb,
    timeout_milliseconds := 60000
  )
$$);

select jobname, schedule from cron.job where jobname like 'lz-%';
