## Context

La fase de eliminatoria cierra pronósticos **por partido** (kickoff − 1h,
`CLOSE_BEFORE_KICKOFF_MS`) y los partidos ocurren en horarios dispersos. El único
recordatorio actual es manual (deep link de WhatsApp, change
`recordatorio-eliminatoria-whatsapp`) y no escala a ~32 partidos. Se quiere un aviso
automático por SMS, 2h antes de cada partido, sin depender de que el admin esté
presente.

Restricciones del stack: Next.js App Router + Supabase + Vercel; lógica y autorización
en servidor; validación zod en la frontera; zona horaria canónica
America/Mexico_City. El proveedor es **SMS Masivos** (variables `SMS_API_KEY`,
`SMS_SANDBOX`, `SMS_BASE_URL` ya en `.env.local`). El SMS **cuesta dinero por
segmento**, lo que vuelve críticas la idempotencia, la protección del endpoint y el
copy corto.

Estas decisiones se exploraron y cerraron con el responsable del producto antes de
proponer.

## Goals / Non-Goals

**Goals:**
- Enviar exactamente un SMS por partido de eliminatoria a cada participante elegible,
  ~2h antes del kickoff, de forma automática e idempotente.
- Que el sistema se auto-repare ante un tick fallido (degradación elegante).
- Proteger el disparo contra invocaciones no autorizadas (vector de costo).
- No introducir dependencias npm nuevas ni un vendor de colas.

**Non-Goals:**
- Timing exacto al minuto (basta la ventana de ~30 min del poll).
- Estado de envío por-usuario / reintento granular por destinatario.
- Reemplazar el recordatorio manual de WhatsApp (se conserva).
- Notificaciones para fase de grupos, push, o email.
- UI de administración/observabilidad del envío en V1.

## Decisions

### D1. Poll idempotente cada 30 min, no scheduler exacto por partido
Un job periódico relee la verdad y envía a los partidos en ventana aún no avisados.
**Por qué:** es inmune a ediciones de horario y **auto-reparable** — si un tick falla,
el siguiente cubre lo vencido mientras el partido siga abierto. **Alternativa
descartada:** agendar un disparo exacto por partido (QStash o `pg_cron` dinámico):
da timing exacto pero concentra la responsabilidad del día en una sola ejecución
(punto único de falla silenciosa) y obliga a administrar el ciclo de vida de jobs e
invalidarlos ante ediciones. El costo del poll (query indexada de microsegundos, 48
veces/día) es despreciable; cambiar robustez por elegancia era mal trato.

### D2. Reloj = `pg_cron` de Supabase, no Vercel Cron
`pg_cron` corre dentro de la base cada 30 min y pega al route handler vía `pg_net`/
`http`. **Por qué:** Vercel Cron en Hobby es 1×/día — insuficiente. `pg_cron` es
gratis y ya disponible en Supabase, sin vendor nuevo. **Alternativa descartada:** cron
externo gratis (cron-job.org / GitHub Actions) — funciona pero añade un servicio
externo y, en el caso de Actions, timing poco fiable.

### D3. Ventana e intervalo
Aviso a `kickoff − 120min`; cierre en `kickoff − 60min`. La ventana de envío es por
tanto `[kickoff−120m, kickoff−60m)` = **60 min**. Un intervalo de poll de 30 min
garantiza ≥1 tick dentro (de hecho 2). Regla de disparo de un partido: enviar si
`ahora ≥ kickoff−120m` **y** `ahora < kickoff−60m` **y** sin registro en el ledger.
El `ahora < cierre` evita avisar cuando ya no se puede pronosticar.

### D4. Ledger **por-partido**, no por-usuario
Tabla `sms_recordatorios (match_id PK, request_id, recipients, sent_at)`; una fila al
aceptar el lote. **Por qué:** SMS Masivos envía en **bulk** (hasta 500 números en una
llamada) y devuelve un único `success`/`request_id` — la unidad de fallo es el **lote**,
no el usuario, así que un ledger por-usuario no aporta reintento útil y sí complejidad.
Por-partido da dedup trivial ("¿ya envié este partido?") y, si el POST falla, no se
escribe la fila → el siguiente tick reintenta el lote completo (idempotente).
**Trade-off aceptado:** un usuario que se vuelve elegible *después* de enviado el lote
no recibe el aviso de ese partido; irrelevante siendo un solo admin.

### D5. Cliente SMS en `lib/sms.ts`, contrato validado con zod
`POST {SMS_BASE_URL}/sms/send`, header `apikey: {SMS_API_KEY}`, body
`{ message, numbers, country_code: "52", sandbox: SMS_SANDBOX, shorten_url: "1" }`.
`numbers` = teléfonos normalizados a **10 dígitos** separados por coma. Normalización
reutiliza el enfoque de `lib/whatsapp.ts` (quitar no-dígitos; tomar los 10 dígitos
nacionales), descartando lo que no quede en 10. La respuesta `{ success, message,
status, request_id }` se valida con zod en `lib/schemas.ts` antes de confiar en ella.
`fetch` nativo (sin dependencia nueva), runtime **Node** en el route handler.

### D6. Copy del SMS: ASCII, ≤160, URL completa (reglas validadas en pruebas reales)
El texto **no** reutiliza el de WhatsApp. Reglas confirmadas enviando a un número
real contra SMS Masivos + operadores MX:
- **Tope duro de 160 chars** (la cuenta no permite multi-segmento; >160 = rechazo
  `sms_02`). `buildEliminatoriaSmsText` cae a un respaldo sin nombres de equipo si
  un emparejamiento largo excediera 160.
- **ASCII puro, sin acentos ni emojis**: un solo acento fuerza Unicode (UCS-2) y baja
  el límite a 70. Se quitan diacríticos también de los nombres de equipo.
- **URL completa, NUNCA acortada**: con `shorten_url` el operador filtra el SMS de
  forma silenciosa (el panel dice "Entregado" pero no llega). Con la URL completa
  `https://www.quinielamundialistas.com/partidos` sí llega. Se eliminó `shorten_url`.
- **`warnings` del proveedor** (p.ej. `test_message_detected`) se capturan y loguean:
  avisan cuando un envío será filtrado pese al "Entregado".

### D7. Seguridad: `CRON_SECRET` obligatorio
El route handler exige el secreto (header) y responde 401 sin él, **antes** de leer
datos o enviar. **Por qué:** un endpoint abierto que dispara SMS es un vector directo
de costo/abuso. El secreto se configura en Vercel (env) y en el job de `pg_cron`
(cabecera de la petición saliente).

## Risks / Trade-offs

- **Doble envío por carrera entre POST exitoso y escritura del ledger** → la ventana
  es mínima; si el POST tiene éxito pero falla la inserción del ledger, el siguiente
  tick podría reenviar ese partido. Mitigación: escribir el ledger inmediatamente tras
  el `success`; aceptar el riesgo residual (bajo, y a lo sumo un SMS duplicado).
- **Costo de SMS** → ~32 partidos × N participantes en envíos reales. Mitigación:
  `sandbox` para todas las pruebas (no consume crédito), copy de 1 segmento,
  `shorten_url`, y el ledger que impide reenvíos.
- **Secreto filtrado** → blasts de SMS a costa del proyecto. Mitigación: `CRON_SECRET`
  largo y aleatorio, solo en envs server-side; rotación si se sospecha fuga.
- **Endpoint lento si N grande** → un bulk de ≤500 es una sola llamada; varios
  partidos en una corrida son pocas llamadas secuenciales. Sin problema a la escala
  esperada; si creciera, paralelizar por partido.
- **Extensiones de Supabase** → requiere habilitar `pg_cron` y `pg_net`/`http`.
  Mitigación: incluirlas en la migración y documentar el enable en el dashboard si
  hiciera falta.
- **Lote > 500 destinatarios** → fuera de la escala esperada; si ocurriera habría que
  trocear `numbers`. Se documenta como límite conocido, no se implementa partición en
  V1.

## Migration Plan

1. Migración SQL: tabla `sms_recordatorios` + RLS (solo service role), y habilitación
   de `pg_cron` + `pg_net`/`http`.
2. Migración SQL: registrar el job `pg_cron` cada 30 min que hace POST al endpoint con
   el header `CRON_SECRET` (leído de configuración del proyecto, no hardcodeado).
3. Configurar envs en Vercel: `CRON_SECRET`, `SMS_API_KEY`, `SMS_SANDBOX`,
   `SMS_BASE_URL`.
4. Desplegar el route handler y `lib/sms.ts`.
5. Validar end-to-end con `SMS_SANDBOX` activo (no consume crédito) antes del primer
   partido de eliminatoria; revisar que el ledger registre y no reenvíe.
6. **Rollback:** desactivar el job de `pg_cron` (`cron.unschedule`) o rotar/retirar
   `CRON_SECRET`; el resto del sistema no se ve afectado. La tabla `sms_recordatorios`
   puede conservarse (idempotente) o eliminarse.

## Open Questions

- ~~Texto final exacto del SMS~~ RESUELTO en pruebas reales (ver D6): ASCII ≤160 con
  URL completa, sin acortador; respaldo sin nombres si excede 160.
- ¿La cabecera con `CRON_SECRET` desde `pg_cron`/`pg_net` se inyecta vía
  `current_setting` (Vault/config del proyecto) para no dejar el secreto en el cuerpo
  de la migración? (Preferido; confirmar mecanismo en Supabase.)
- ¿Se quiere un mínimo de observabilidad (conteo de enviados/fallidos por corrida en
  logs) para auditar costo? Propuesto: log estructurado en el route handler, sin UI.
