-- Reloj del recordatorio SMS: pg_cron cada 30 min pega al endpoint protegido
-- (change sms-recordatorio-eliminatoria, design D1/D2/D7).
--
-- Se eligió pg_cron (no Vercel Cron, que en Hobby es 1×/día). La ventana de
-- envío es de 60 min [kickoff−2h, kickoff−1h), así que 30 min garantiza ≥1 tick
-- dentro. El endpoint es idempotente (ledger sms_recordatorios): un tick repetido
-- no reenvía y un tick perdido se recupera en el siguiente.

-- ============ 1 · Extensiones ============

-- pg_cron: planificador dentro de Postgres. pg_net: HTTP saliente asíncrono.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============ 2 · Configuración (URL del endpoint + secreto) ============
--
-- El secreto NUNCA se hardcodea en esta migración (quedaría en el repo y en
-- cron.job). Se leen de Vault. Antes de que el job sirva, el operador DEBE
-- crear los dos secretos en el proyecto Supabase (SQL editor, una sola vez):
--
--   select vault.create_secret(
--     'https://www.quinielamundialistas.com/api/cron/sms-eliminatoria',
--     'sms_cron_url');
--   select vault.create_secret('<CRON_SECRET-igual-al-de-Vercel>', 'cron_secret');
--
-- Para rotar: vault.update_secret(...). Para apagar el envío (rollback):
--   select cron.unschedule('sms-eliminatoria-30min');

-- ============ 3 · Job cada 30 minutos ============

select cron.schedule(
  'sms-eliminatoria-30min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'sms_cron_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
