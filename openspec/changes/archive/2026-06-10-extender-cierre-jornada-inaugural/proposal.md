# Proposal: Extender cierre de la jornada inaugural

## Why

La jornada inaugural (11 de junio de 2026: México–Sudáfrica y Corea del Sur–Chequia) cierra hoy 10 de junio a las 23:59 bajo la regla general, a pocas horas de haberse lanzado la quiniela. Extender su ventana hasta las 12:00 del 11 de junio (una hora antes del primer kickoff) permite que más participantes alcancen a registrarse, pagar, ser activados y pronosticar.

## What Changes

- Excepción puntual y fechada a la regla de cierre: la jornada del 2026-06-11 acepta pronósticos hasta las 12:00 (America/Mexico_City) de ese mismo día. Las demás jornadas conservan la regla general (23:59 del día anterior) sin cambio alguno.
- La excepción aplica en las tres capas donde vive el cierre: lógica de dominio (`isJornadaOpen`/`jornadaDeadline`), RLS en Postgres (`is_match_open`, migración nueva) y textos de deadline (chip de jornada y banner de pendientes).
- Corrección del cálculo de "próxima jornada abierta" del banner de pendientes, que asumía la regla general (`match_date > hoy`) y mostraría mal la fecha límite durante la mañana del 11.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `match-schedule`: el requirement "Cierre de jornada" gana la excepción de la jornada inaugural, con su escenario verificable.

## Impact

- Código: `lib/domain/jornada.ts` (+tests), `lib/format.ts`, layout del participante (`nextOpenJornada`), migración `0004` (reemplaza `is_match_open`).
- Producción: `db push` de la 0004 + deploy de Vercel (automático con el push a main). Si se despliega después de medianoche CDMX, la jornada simplemente "reabre" sin corrupción: los pronósticos vuelven a ser escribibles hasta las 12:00.
- La excepción expira sola: desde el 12 de junio es código inerte, documentado y fechado.
