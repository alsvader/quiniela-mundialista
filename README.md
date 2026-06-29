# Quiniela Mundialista

Quiniela del Mundial 2026: los participantes pronostican L/E/V por jornada,
el admin valida pagos por WhatsApp y captura marcadores, y el ranking público
se calcula solo. V1 cubre la fase de grupos (72 partidos).

**Stack:** Next.js (App Router) + TypeScript + Tailwind v4 · Supabase (Auth + Postgres) · Vercel.

La planeación completa (proposal, design, specs, tasks) vive en
`openspec/changes/quiniela-mundialista-v1/`. El sistema de diseño está en
`DESIGN.md` (formato Google Stitch) y `PRODUCT.md`.

## Desarrollo local

Requiere Node 20+, Docker y npm.

```bash
npm install
npx supabase start          # stack local de Supabase (primera vez descarga imágenes)
cp .env.example .env.local  # llena con los valores que imprime `supabase status`
npm run seed:admin          # crea la cuenta admin (ADMIN_EMAIL / ADMIN_PASSWORD del .env.local)
npm run dev
```

Las migraciones de `supabase/migrations/` (esquema + fixture de 72 partidos)
se aplican solas con `supabase start` / `supabase db reset`.

```bash
npm test       # tests de dominio (jornadas, puntuación)
npm run lint
npm run build
```

## Despliegue (Supabase cloud + Vercel)

1. Crear proyecto en [supabase.com](https://supabase.com). En **Authentication →
   Sign In / Providers → Email**, desactivar *Confirm email* (no hay correos
   automáticos en V1).
2. Aplicar migraciones: `npx supabase link --project-ref <ref>` y
   `npx supabase db push`.
3. Crear el proyecto en Vercel con las variables de `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Ejecutar `npm run seed:admin` localmente con el `.env.local` apuntando a
   producción (URL + service role key + credenciales del admin).
5. Entrar como admin a `/admin/configuracion` y capturar el número de WhatsApp.

## Recordatorio automático de eliminatoria por SMS

Avisa por SMS (SMS Masivos) a los participantes de la temporada `eliminatoria`
2 h antes del kickoff de cada partido. El endpoint `/api/cron/sms-eliminatoria`
es idempotente (ledger `sms_recordatorios`) y lo dispara `pg_cron` cada 30 min.

Configuración (una vez, en producción):

1. Variables en Vercel: `SMS_BASE_URL`, `SMS_API_KEY`, `SMS_SANDBOX` (`1` para
   probar sin gastar crédito) y `CRON_SECRET`. Genera/rota el secreto con
   `npm run rotate:cron-secret -- local` (o `prod`): lo escribe en `.env.local` /
   `.env.prod.local` y, para `prod`, imprime los pasos de Vercel y Vault.
2. Las migraciones `0013`/`0014` crean el ledger y habilitan `pg_cron`/`pg_net`.
   Tras aplicarlas, crear en el **SQL editor** de Supabase los dos secretos del
   Vault que usa el job (ver cabecera de `0014_sms_cron_job.sql`):

   ```sql
   select vault.create_secret(
     'https://<tu-dominio>/api/cron/sms-eliminatoria', 'sms_cron_url');
   select vault.create_secret('<mismo-CRON_SECRET-de-Vercel>', 'cron_secret');
   ```

3. Verificar end-to-end con `SMS_SANDBOX=1` antes del primer partido: invocar el
   endpoint con el header `x-cron-secret` y confirmar que registra en el ledger y
   que una segunda corrida no reenvía. Apagar el envío: `select
   cron.unschedule('sms-eliminatoria-30min');`.

## Reglas de negocio clave

- **Jornada** = partidos del mismo día en `America/Mexico_City`; cierra a las
  23:59 del día anterior. Nunca se almacena el estado: se calcula.
- **Puntos** = 1 por acierto L/E/V contra el resultado derivado de los goles
  capturados; corregir un marcador recalcula todo (nada de totales guardados).
- **Cuentas**: nacen `pendientes` (banner + modal + WhatsApp); solo `activas`
  guardan pronósticos y aparecen en el ranking; desactivar es reversible.
