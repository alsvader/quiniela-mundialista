## 1. Datos y migraciones (Supabase)

- [x] 1.1 Crear migración con la tabla `sms_recordatorios` (`match_id` PK/FK a
  `matches`, `request_id text`, `recipients int`, `sent_at timestamptz default now()`).
- [x] 1.2 Añadir RLS a `sms_recordatorios`: sin acceso de cliente; solo la service role
  inserta/lee (el endpoint usa service role).
- [x] 1.3 Habilitar extensiones `pg_cron` y `pg_net` (o `http`) en la migración.
- [x] 1.4 Crear migración que registre el job `pg_cron` cada 30 min con `POST` al
  endpoint `/api/cron/sms-eliminatoria`, inyectando el header con `CRON_SECRET` desde
  la configuración del proyecto/Vault (no hardcodear el secreto).

## 2. Cliente SMS Masivos (`lib/sms.ts`)

- [x] 2.1 Implementar normalización de teléfono a 10 dígitos nacionales (reutilizando
  el enfoque de `lib/whatsapp.ts`); devolver `null` para los que no normalizan.
- [x] 2.2 Implementar `sendBulkSms({ numbers, message })`: `POST {SMS_BASE_URL}/sms/send`
  con header `apikey`, body `{ message, numbers (coma), country_code:"52",
  sandbox: SMS_SANDBOX, shorten_url:"1" }`, usando `fetch` nativo.
- [x] 2.3 Añadir en `lib/schemas.ts` el schema zod de la respuesta del proveedor
  (`{ success, message, status, request_id }`) y validar con `safeParse` antes de
  confiar en ella.
- [x] 2.4 Definir el copy del SMS: corto, sin emojis, objetivo 1 segmento (equipos,
  recordatorio de cierre 1h antes, enlace a pronósticos). Construir el texto por
  partido.

## 3. Queries de dominio (`lib/queries.ts`)

- [x] 3.1 Query: partidos de eliminatoria (`phase != group_stage`) en ventana de aviso
  (`kickoff − 120min ≤ now < kickoff − 60min`) que NO tengan fila en
  `sms_recordatorios`.
- [x] 3.2 Query: padrón de teléfonos elegibles (participación `active` en
  `eliminatoria`, cuenta no `disabled`, con teléfono), reutilizando la lógica de
  temporada/padrón existente.

## 4. Endpoint de disparo (`app/api/cron/sms-eliminatoria/route.ts`)

- [x] 4.1 Route handler (runtime Node) que valide el `CRON_SECRET` y responda 401 si
  falta o no coincide, antes de leer datos o enviar.
- [x] 4.2 Recorrer los partidos en ventana (3.1); por cada uno armar el lote de números
  (3.2 + normalización), enviar bulk (2.2) y, si `success`, insertar el ledger (1.1).
- [x] 4.3 Caso sin destinatarios válidos: registrar el partido como atendido sin llamar
  al proveedor (evitar reintentos indefinidos).
- [x] 4.4 Caso de fallo del proveedor: no escribir el ledger; dejar el partido para el
  siguiente tick.
- [x] 4.5 Responder un resumen (partidos procesados, enviados, omitidos) y emitir log
  estructurado de conteos para auditar costo.

## 5. Configuración y secretos

- [x] 5.1 Añadir `CRON_SECRET` a `.env.local` (ejemplo en `.env.example` si existe) y a
  Vercel; llevar también `SMS_API_KEY`, `SMS_SANDBOX`, `SMS_BASE_URL` a Vercel.
- [x] 5.2 Documentar en `README`/notas el enable de `pg_cron`/`pg_net` y la
  configuración del secreto para el job.

## 6. Pruebas y verificación

- [x] 6.1 Tests unitarios de normalización de teléfono (10 dígitos, con lada, basura,
  vacío) y del armado de `numbers`.
- [x] 6.2 Test de la lógica de ventana/disparo (en/ fuera de ventana, ya cerrado,
  group_stage, ya en ledger) con `now` inyectable.
- [x] 6.3 Test del endpoint: 401 sin secreto; con secreto procesa y no reenvía un
  partido ya registrado; fallo del proveedor no escribe ledger.
- [x] 6.4 Verificación end-to-end (local): 401 sin secreto, envío en sandbox con
  registro en ledger e idempotencia, y entrega real confirmada en teléfono tras
  ajustar el copy (ASCII ≤160, URL completa sin acortar). Ver D6.
