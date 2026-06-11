# Delta: match-schedule

## MODIFIED Requirements

### Requirement: Cierre de jornada
Los pronósticos de una jornada SHALL cerrar a las 23:59 (America/Mexico_City) del día anterior a la fecha de la jornada. El estado abierto/cerrado MUST calcularse a partir de la fecha de la jornada y la hora actual, sin almacenarse.

**Excepción fechada (jornada inaugural):** la jornada del 2026-06-11 SHALL aceptar pronósticos hasta las 12:00:00 (America/Mexico_City) del 11 de junio de 2026 — una hora antes del primer kickoff. La excepción MUST aplicarse de forma coherente en la lógica de dominio, en las políticas RLS y en los textos de fecha límite visibles (incluido el banner de cuenta pendiente). Las demás jornadas conservan la regla general sin cambio.

#### Scenario: Jornada abierta
- **WHEN** la hora actual es anterior a las 00:00 del día de la jornada en America/Mexico_City
- **THEN** la jornada está abierta y acepta guardado de pronósticos

#### Scenario: Jornada cerrada
- **WHEN** la hora actual es igual o posterior a las 00:00 del día de la jornada en America/Mexico_City
- **THEN** la jornada está cerrada y el sistema rechaza cualquier guardado de pronósticos

#### Scenario: Borde exacto del cierre
- **WHEN** la hora actual es exactamente 23:59:59 del día anterior a la jornada
- **THEN** la jornada sigue abierta; a partir de las 00:00:00 está cerrada

#### Scenario: Excepción de la jornada inaugural abierta
- **WHEN** la hora actual es el 11 de junio de 2026 a las 11:59:59 (America/Mexico_City)
- **THEN** la jornada del 2026-06-11 sigue abierta y acepta guardado de pronósticos, y su fecha límite visible dice 11 de junio a las 12:00

#### Scenario: Excepción de la jornada inaugural cerrada
- **WHEN** la hora actual es el 11 de junio de 2026 a las 12:00:00 (America/Mexico_City) o posterior
- **THEN** la jornada del 2026-06-11 está cerrada y el sistema (dominio y RLS) rechaza cualquier guardado

#### Scenario: Las demás jornadas no cambian
- **WHEN** se evalúa cualquier jornada distinta al 2026-06-11
- **THEN** aplica la regla general de cierre a las 23:59 del día anterior
