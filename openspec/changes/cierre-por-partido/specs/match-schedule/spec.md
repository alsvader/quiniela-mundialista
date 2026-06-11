# match-schedule — delta (cierre-por-partido)

## ADDED Requirements

### Requirement: Cierre por partido
Cada partido SHALL aceptar pronósticos hasta una hora antes de su hora de
inicio (`kickoff_at`): el partido está abierto mientras la hora actual sea
estrictamente anterior a `kickoff_at − 1 hora`, y cerrado desde ese instante.
El estado abierto/cerrado MUST calcularse a partir de `kickoff_at` y la hora
actual, sin almacenarse, y MUST aplicarse de forma coherente en la lógica de
dominio, en las políticas RLS y en los textos de fecha límite visibles
(incluido el banner de cuenta pendiente). La regla MUST NOT tener excepciones
fechadas. Una jornada puede estar parcialmente cerrada: cada partido se evalúa
de forma independiente.

#### Scenario: Partido abierto
- **WHEN** la hora actual es anterior a `kickoff_at − 1 hora` de un partido
- **THEN** el partido está abierto y acepta guardado de pronóstico

#### Scenario: Partido cerrado
- **WHEN** la hora actual es igual o posterior a `kickoff_at − 1 hora` de un partido
- **THEN** el partido está cerrado y el sistema (dominio y RLS) rechaza cualquier guardado de pronóstico para ese partido

#### Scenario: Borde exacto del cierre
- **WHEN** la hora actual es exactamente un segundo antes de `kickoff_at − 1 hora`
- **THEN** el partido sigue abierto; en el instante `kickoff_at − 1 hora` está cerrado

#### Scenario: Jornada parcialmente cerrada
- **WHEN** una jornada tiene un partido cuyo cierre ya pasó y otro cuyo cierre no ha llegado
- **THEN** el partido cerrado rechaza guardados y se muestra en solo lectura, mientras el partido abierto sigue aceptando pronósticos

#### Scenario: Fecha límite visible por partido
- **WHEN** un usuario consulta un partido abierto
- **THEN** ve la fecha límite de ese partido (una hora antes de su inicio, en America/Mexico_City), no una fecha límite de jornada

## REMOVED Requirements

### Requirement: Cierre de jornada
**Reason**: Reemplazado por el cierre por partido (`kickoff_at − 1 hora`). La
excepción fechada de la jornada inaugural queda cubierta por la regla general
(era exactamente esta regla aplicada a un solo día), por lo que también
desaparecen `JORNADA_DEADLINE_EXCEPTIONS` y la rama de excepción en
`is_match_open()`.
**Migration**: El dominio expone `isMatchOpen`/`matchDeadline` basados en
`kickoff_at` en lugar de `isJornadaOpen`/`jornadaDeadline` basados en la fecha
de la jornada; `is_match_open()` en SQL compara contra
`kickoff_at − interval '1 hour'`. La agrupación visual por jornadas
(America/Mexico_City) no cambia.
