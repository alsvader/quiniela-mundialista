# Design: Quiniela Mundialista V1

## Context

Proyecto nuevo desde cero. App web para administrar una quiniela del Mundial 2026 entre ~decenas de participantes, con pagos validados manualmente vía WhatsApp y resultados capturados a mano por un único administrador. V1 cubre solo la fase de grupos (72 partidos), pero el modelo de datos debe soportar todas las fases del torneo. El torneo inicia el 11 de junio de 2026, así que el diseño prioriza simplicidad y velocidad de entrega sobre generalidad.

Restricciones dadas: Next.js App Router + TypeScript + Tailwind, Supabase (Auth + PostgreSQL), Vercel, monolito, Server Components para lectura y Server Actions para mutaciones, lógica de negocio en servidor, sin integraciones externas (deportivas, pago, correo, push).

## Goals / Non-Goals

**Goals:**

- Flujo completo de participante: registro → activación manual → pronósticos L/E/V por jornada → consulta de puntos y ranking.
- Flujo completo de admin: gestión de usuarios, captura/corrección de marcadores, CRUD de partidos, configuración de WhatsApp.
- Integridad: imposible guardar pronósticos fuera de plazo o sin cuenta activa, incluso ante manipulación del cliente.
- Ranking público compartible que solo expone alias y puntos.
- Estructura de datos lista para fases eliminatorias (V2) sin migraciones disruptivas.

**Non-Goals:**

- Automatización de pagos, resultados, correos o notificaciones.
- Tiempo real (el ranking se actualiza al recargar).
- Criterio de desempate (pendiente a propósito; el orden entre empatados es indefinido en V1).
- Pronóstico por marcador exacto, bonos, premios, estadísticas avanzadas.
- Optimización prematura: con ~50 usuarios y 72 partidos, todo cálculo cabe en una query.

## Decisions

### D1 — Esquema de base de datos: 3 tablas propias + Supabase Auth

```
auth.users (Supabase)          profiles                    matches
┌──────────────┐      1:1     ┌─────────────────┐         ┌──────────────────────┐
│ id, email,   │◀────────────│ id (= auth uid)  │         │ id                   │
│ password...  │              │ full_name        │         │ phase (enum)         │
└──────────────┘              │ alias (unique)   │         │ match_date (date MX) │
                              │ phone            │         │ kickoff_at (tstz)    │
                              │ status (enum)    │         │ home_team, away_team │
                              │ role (enum)      │         │ group_label          │
                              └────────┬─────────┘         │ home_goals (null)    │
                                       │ 1:N               │ away_goals (null)    │
                                       ▼                   └──────────┬───────────┘
                              predictions                             │ 1:N
                              ┌──────────────────────┐                │
                              │ user_id + match_id PK│◀───────────────┘
                              │ pick: 'H'|'D'|'A'    │
                              │ updated_at           │
                              └──────────────────────┘
                              app_settings (key/value: whatsapp_number)
```

- `profiles.id` = `auth.users.id` (FK), creada en el registro. `status`: `pending | active | disabled`; `role`: `user | admin`. Separa identidad de negocio (decisión de producto 8).
- `matches.phase` es enum con las 7 fases del torneo desde el día uno; V1 solo inserta `group_stage`. Habilitar eliminatorias en V2 = insertar partidos nuevos, sin migración.
- `matches.match_date` es la **fecha de jornada** en America/Mexico_City, almacenada como `date` explícita (no derivada de `kickoff_at` en queries). Evita errores de huso horario: la conversión se hace una sola vez, en el seed. `kickoff_at` (timestamptz) se conserva para mostrar la hora del partido.
- `predictions` con PK compuesta `(user_id, match_id)`: el guardado es un upsert idempotente; `updated_at` cumple el requisito de "fecha/hora de última modificación".
- Los goles son `NULL` hasta que el admin captura; el resultado oficial L/E/V **no se almacena**: se deriva en la query (`CASE WHEN home_goals > away_goals ...`). Corregir goles corrige todo (decisión de producto 3).

*Alternativa considerada:* tabla `jornadas` propia. Rechazada: la jornada es una agrupación por `match_date` con regla de cierre calculable; una tabla agrega estado sincronizable sin aportar nada.

### D2 — Cierre de jornada: calculado, nunca almacenado

Una jornada con fecha `D` está abierta si `now() < D 00:00 America/Mexico_City` (equivalente a "hasta las 23:59 del día anterior"). Es una función pura `isJornadaOpen(matchDate, now)` usada en dos capas:

1. **UI** (Server Component): deshabilita la edición y muestra "jornada cerrada".
2. **Server Action de guardado**: revalida en servidor antes del upsert. La UI nunca es la única defensa.

*Alternativa considerada:* cron/job que "cierre" jornadas marcando un flag. Rechazada: estado redundante, un job que puede fallar, y Vercel cron innecesario.

### D3 — Autorización: Server Actions como única puerta de escritura + RLS como red de seguridad

- Toda mutación pasa por Server Actions que validan: sesión válida → perfil `active` (para pronósticos) o `admin` (para panel) → jornada abierta → jornada completa (todos los partidos del día con pick).
- RLS activado en todas las tablas como segunda línea: `predictions` solo legible/escribible por su dueño (y admin), `profiles` solo el propio (y admin), `matches` y ranking de lectura pública, `app_settings` escritura solo admin. Las escrituras de pronósticos usan el cliente de servidor con la sesión del usuario, así RLS aplica de verdad.
- La verificación de rol admin se hace contra `profiles.role` en servidor (layout del segmento `/admin` + cada action), nunca contra metadata del cliente.

### D4 — Guardado por jornada completa como transacción de upserts

El Server Action de guardar jornada recibe `{matchId, pick}[]`, valida que cubra **todos** los partidos de esa `match_date` y hace upsert en bloque. Guardados parciales se rechazan con error claro. Modificar = mismo action (upsert sobrescribe y actualiza `updated_at`).

### D5 — Puntos y ranking: una query agregada, sin caché

```sql
-- esencia del ranking
SELECT p.alias, COUNT(*) FILTER (WHERE pred.pick = resultado_derivado(m)) AS puntos
FROM profiles p
LEFT JOIN predictions pred ... JOIN matches m ON goles capturados
WHERE p.status = 'active' AND p.role = 'user'
GROUP BY p.alias ORDER BY puntos DESC
```

Página de ranking pública (sin sesión), Server Component con `dynamic` rendering. Con esta escala no se necesita vista materializada ni caché; si algún día duele, se materializa sin cambiar el contrato.

### D6 — Estados y privilegios: un solo punto de verdad

`canSavePredictions(profile) = status === 'active'` y `isInRanking(profile) = status === 'active' && role === 'user'`. `pending` y `disabled` se comportan igual funcionalmente; solo cambia el mensaje (banner de pago pendiente vs cuenta desactivada). El admin no participa en el ranking.

### D7 — WhatsApp deep link

`https://wa.me/<numero>?text=<mensaje urlencoded con nombre, correo y teléfono>`. El número vive en `app_settings` (editable por el admin). Sin API de WhatsApp Business: es un link, el usuario manda el mensaje desde su propio WhatsApp.

### D8 — Seeds

- **Fixture**: archivo TypeScript/SQL estático con los 72 partidos (equipos, grupo, kickoff UTC y `match_date` ya convertida a MX), aplicado como migración/seed de Supabase. El CRUD del admin existe para correcciones puntuales.
- **Admin**: script Node con `SUPABASE_SERVICE_ROLE_KEY` que crea el usuario en Auth (`ADMIN_EMAIL`/`ADMIN_PASSWORD` de env) y upserta su perfil con `role = 'admin'`, `status = 'active'`. Idempotente para poder re-ejecutarse.

### D10 — Banderas: código ISO + SVG local

Cada equipo lleva su código de bandera en `matches` (`home_code`/`away_code`, text **nullable**: las eliminatorias V2 tendrán partidos "por definir" y el CRUD del admin puede omitirlos). Códigos ISO 3166-1 alfa-2 en minúsculas, con códigos regionales para naciones constituyentes (`gb-eng` Inglaterra, `gb-sct` Escocia). Los SVGs provienen del paquete `flag-icons` (MIT) y viven en el repo — sin APIs externas, consistente en todas las plataformas (los emoji de bandera no renderizan en Windows). Un componente `TeamFlag` centraliza el render con la desaturación-hasta-hover que pide DESIGN.md y el fallback "sin código → solo nombre". El mapa equipo→código vive junto al mapa de traducción en el generador del seed.

*Alternativa considerada:* emoji de bandera (cero assets). Rechazada: en Windows/Chrome se renderiza como letras planas ("MX") y el estilo varía por plataforma — contradice el objetivo visual.

### D11 — Bolsa acumulada: derivada, con corte compartido

`bolsa = activos_rol_user × ENTRY_FEE × (1 − PLATFORM_FEE)`. Las constantes ($100 MXN, 30%, 3 premiados) viven en un solo módulo de dominio (`lib/domain/prize.ts`) — cambiarlas para otro torneo es un deploy, consistente con "priorizar simplicidad". El monto nunca se almacena: se deriva del `count` de perfiles activos en cada render, igual que los puntos (D5).

Reparto: 3 partes iguales entre los primeros lugares del ranking. **Desempate resuelto sin criterio externo**: como las partes son iguales, los empates solo importan en el corte de premiados; los empatados en el corte se reparten en partes iguales las porciones de las posiciones que ocupan (ej. 10, 8, 7, 7 pts con $700 → 233.33 / 233.33 / 116.67 / 116.67). Matemática pura sobre el ranking existente: cero datos nuevos, cero disputas de "quién llegó antes".

*Alternativas consideradas:* fecha de registro (determinista pero ajena al futbol); primera fecha de guardado del pronóstico (requiere `created_at` nuevo en `predictions` — el `updated_at` actual cambia con cada edición legítima, castigaría una función que el sistema promueve). Rechazadas.

El pago de premios es manual fuera de la app (sin pasarelas, restricción V1); la app solo muestra la bolsa — en `/partidos`, junto al encabezado.

Edge aceptado: desactivar a un usuario que ya pagó reduce la bolsa mostrada (el conteo es de activos *actuales*). En un grupo de conocidos la desactivación es excepcional; si ocurre, el admin reactiva o ajusta expectativas por WhatsApp.

### D9 — Estructura de rutas

```
/                    → redirige según sesión/rol
/login, /registro    → públicas
/ranking             → pública (sin sesión)
/partidos            → participante: calendario + pronósticos (requiere sesión)
/mis-puntos          → participante: detalle de aciertos
/admin/usuarios      → admin: activar/desactivar
/admin/partidos      → admin: CRUD + captura de marcadores
/admin/configuracion → admin: número de WhatsApp
```

Protección por layouts de segmento (`(participante)`, `admin/`) que validan sesión y rol en servidor.

## Risks / Trade-offs

- **[Pérdida de jornadas por activación tardía]** Decisión de producto asumida: el pendiente no guarda y lo cerrado se pierde. → Mitigación: modal y banner con texto explícito de la fecha límite de la próxima jornada; el admin ve la fecha de registro para priorizar activaciones.
- **[Errores de huso horario]** El bug más probable del sistema. → Mitigación: `match_date` precalculada en seed como fecha MX; una sola función `isJornadaOpen` con tests unitarios sobre los bordes (23:59:59 vs 00:00:00, horario de verano no aplica en CDMX desde 2022 pero el test lo cubre).
- **[Alias ofensivos o suplantación en ranking público]** → Mitigación: el admin puede desactivar al usuario (lo saca del ranking); validación básica de longitud/caracteres en registro. Suficiente para un grupo de conocidos.
- **[Captura errónea de marcadores]** → Mitigación inherente al diseño: todo es derivado; editar los goles recalcula puntos y ranking sin pasos extra.
- **[Empates en el ranking]** → Resuelto (D11): los empatados comparten posición visible y, en la premiación, se reparten en partes iguales las porciones del corte. Sin criterio externo que disputar.
- **[Un solo admin humano como cuello de botella]** (activaciones y captura de resultados durante el torneo) → Aceptado en V1; el modelo de roles permite más admins en el futuro sin cambios de esquema.

## Migration Plan

Proyecto nuevo: sin migración de datos. Orden de despliegue: crear proyecto Supabase → aplicar migraciones de esquema + RLS → seed de fixture → deploy en Vercel con variables de entorno → ejecutar seed de admin → prueba de humo (registro, activación, pronóstico, captura, ranking). Rollback = re-deploy anterior; la base no tiene consumidores externos.

## Open Questions

- ~~Criterio de desempate del ranking~~ — resuelto en D11: reparto con corte compartido.
- Texto/idioma final de la UI (se asume español).
