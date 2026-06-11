# Design: Extender cierre de la jornada inaugural

## Context

La regla de cierre (design archivado, D2) vive en tres capas: `isJornadaOpen` en dominio TS (UI + Server Action), `is_match_open` en Postgres (RLS, muralla real) y los textos de deadline. Producción ya está viva con esquema desplegado: los cambios de BD nacen como migraciones nuevas.

## Goals / Non-Goals

**Goals:** la jornada 2026-06-11 acepta pronósticos hasta las 12:00 CDMX del 11; las tres capas coherentes; deploy hoy mismo.

**Non-Goals:** cambiar la regla general; construir un mecanismo genérico de ventanas por partido (si la ronda 2 lo quiere, se diseña con calma — ver alternativa D rechazada).

## Decisions

### Excepción como constante fechada (opción A)

Mapa `JORNADA_DEADLINE_EXCEPTIONS: Record<string, string>` en `lib/domain/jornada.ts` con una entrada: `'2026-06-11' → '2026-06-11T12:00:00-06:00'`. `isJornadaOpen` y `jornadaDeadline` lo consultan primero; sin entrada, regla general. En SQL, `create or replace function is_match_open` con un `case` equivalente (migración 0004). `formatDeadline` deriva el texto del deadline real (vía `jornadaDeadline`), no de la resta de un día.

*Alternativa considerada:* cierre como dato (`closes_at` por partido, backfill + override). Más elegante y generalizable, pero refactor de firmas, callsites y tests a horas del evento — riesgo desproporcionado. Rechazada para este change; candidata para ronda 2 si se necesitan ventanas por partido.

### Banner de pendientes

`nextOpenJornada()` del layout deja de usar `match_date > hoy` y pasa a filtrar las fechas de jornada con `isJornadaOpen` (mismo criterio que ya usa la página de partidos), para que durante la mañana del 11 siga señalando la jornada inaugural y su nueva hora límite.

## Risks / Trade-offs

- **[Deriva entre TS y SQL]** la excepción vive en dos lugares → Mitigación: misma constante documentada con referencia cruzada en ambos archivos + test de dominio del borde 11:59:59/12:00:00 + smoke posterior al deploy.
- **[Deploy después de medianoche CDMX]** la jornada aparecería "cerrada" hasta el deploy → aceptado: al desplegarse reabre sin corrupción (RLS y dominio comparten criterio).

## Migration Plan

`db push` de 0004 a producción (pooler us-east-2) + push a main (Vercel redespliega). Verificación: smoke de cierre contra prod y chip de deadline correcto en la UI.

## Open Questions

(Ninguna.)
