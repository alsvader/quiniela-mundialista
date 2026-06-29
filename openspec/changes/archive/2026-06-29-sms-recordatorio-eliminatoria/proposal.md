## Why

En la fase de eliminatoria el cierre es **por partido** (una hora antes de cada
kickoff) y los partidos caen en horarios dispersos, así que es fácil que un
participante olvide capturar su pronóstico y pierda el partido sin recurso. Hoy el
único recordatorio es **manual** (deep link de WhatsApp que el admin envía a mano,
change `recordatorio-eliminatoria-whatsapp`), lo que no escala a ~32 partidos de
eliminatoria. Hace falta un aviso **automático** que no dependa de que el admin esté
presente a la hora justa.

## What Changes

- Nuevo aviso **automático por SMS** a cada participante de la temporada
  `eliminatoria`, enviado **2 horas antes del kickoff** de cada partido de
  eliminatoria, recordando que el cierre es una hora antes y enlazando a pronósticos.
- Nuevo **route handler protegido** (`/api/cron/sms-eliminatoria`) que en cada
  invocación recorre **todos** los partidos de eliminatoria cuya ventana de aviso ya
  venció y aún no han sido notificados, y envía el lote. Es **idempotente**: una
  corrida repetida no reenvía.
- El reloj es **`pg_cron` de Supabase cada 30 min** (no Vercel Cron, que en Hobby es
  1×/día). Migración nueva que registra el job y le pega al endpoint con el secreto.
- Nueva tabla **ledger por-partido** `sms_recordatorios` (un registro al aceptar el
  lote de SMS de un partido) que garantiza el "enviar exactamente una vez".
- Nueva integración con **SMS Masivos** (`POST /sms/send`, envío bulk hasta 500
  números por llamada) mediante las variables ya presentes `SMS_API_KEY`,
  `SMS_SANDBOX`, `SMS_BASE_URL`. Texto de SMS **corto y sin emojis** (el cobro es por
  segmento; los emojis fuerzan codificación Unicode y encarecen).
- Nuevo secreto **`CRON_SECRET`**: el endpoint rechaza cualquier petición sin él (el
  envío de SMS cuesta; un endpoint abierto sería un vector de costo/abuso).

Sin cambios en el cierre por partido, la puntuación ni el ranking. No reemplaza el
recordatorio manual de WhatsApp: lo complementa para el caso automático y recurrente.

## Capabilities

### New Capabilities
- `sms-notifications`: envío automático y idempotente de SMS transaccionales a los
  participantes, disparado por tiempo respecto al kickoff. Cubre la audiencia
  elegible, la ventana y regla de disparo, el ledger anti-duplicado, la protección del
  endpoint por secreto y el contrato con el proveedor (SMS Masivos, bulk + sandbox).

### Modified Capabilities
<!-- Ninguna: el aviso automático es una capability nueva. El recordatorio manual de
     WhatsApp (admin-panel) se conserva sin cambios de requisito. -->

## Impact

- **Rutas/API**: nuevo `app/api/cron/sms-eliminatoria/route.ts` (route handler, runtime
  Node, protegido por `CRON_SECRET`).
- **Lógica**: nuevo `lib/sms.ts` (cliente SMS Masivos: normalización de teléfono a 10
  dígitos, armado de `numbers`, `country_code`, `sandbox`, manejo de respuesta);
  reutiliza el enfoque de normalización de `lib/whatsapp.ts`. Nuevas queries en
  `lib/queries.ts`: partidos de eliminatoria en ventana de aviso sin notificar, y
  padrón de teléfonos elegibles. Validación zod del contrato del proveedor en
  `lib/schemas.ts`.
- **Datos**: nueva tabla `sms_recordatorios` (ledger por-partido) con su migración y
  RLS (solo service role escribe/lee; ningún acceso de cliente). Migración nueva para
  el job de `pg_cron` + `pg_net`/`http` que pega al endpoint cada 30 min.
- **Config/Secrets**: `CRON_SECRET` nuevo (Vercel + Supabase); `SMS_API_KEY`,
  `SMS_SANDBOX`, `SMS_BASE_URL` ya existen en `.env.local` y deben llevarse a Vercel.
- **Dependencias**: ninguna nueva de npm (fetch nativo). En Supabase se habilitan las
  extensiones `pg_cron` y `pg_net` (o `http`).
- **UI**: ninguna pantalla nueva imprescindible en V1.
- **Costo**: ~32 partidos de eliminatoria × N participantes en SMS reales; el copy
  corto (1 segmento) y `sandbox` para pruebas acotan el gasto.
