## ADDED Requirements

### Requirement: Temporada como agrupación de fases
El sistema SHALL definir dos temporadas: `grupos` (la fase `group_stage`) y
`eliminatoria` (las fases `round_of_32`, `round_of_16`, `quarter_final`,
`semi_final`, `third_place` y `final`). La temporada de un partido MUST derivarse
de su fase y MUST NOT almacenarse de forma independiente a la fase.

#### Scenario: Partido de fase de grupos
- **WHEN** se evalúa la temporada de un partido con fase `group_stage`
- **THEN** su temporada es `grupos`

#### Scenario: Partido de cualquier ronda eliminatoria
- **WHEN** se evalúa la temporada de un partido con fase `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `third_place` o `final`
- **THEN** su temporada es `eliminatoria`

### Requirement: Participación por temporada
El sistema SHALL registrar la participación de cada usuario por temporada como una
entrada `(usuario, temporada, estado)` independiente. La ausencia de entrada para
una temporada MUST significar que el usuario no participa en ella. El estado de
participación SHALL ser `activo` (pago confirmado por el administrador) o
`desactivado` (suspendida por el administrador, reversible). La participación en una
temporada MUST ser independiente de la participación en la otra y del estado de
cuenta (`profiles.status`).

#### Scenario: Sin participación no participa
- **WHEN** un usuario no tiene entrada de participación para una temporada
- **THEN** el sistema lo trata como no participante de esa temporada

#### Scenario: Participación independiente entre temporadas
- **WHEN** un usuario tiene participación `activo` en `grupos` pero ninguna entrada en `eliminatoria`
- **THEN** participa en `grupos` y no participa en `eliminatoria`

#### Scenario: Una temporada no implica la otra
- **WHEN** un usuario paga y el administrador confirma su participación en `eliminatoria` sin que haya participado en `grupos`
- **THEN** participa en `eliminatoria` y sigue sin participar en `grupos`

### Requirement: Temporada activa
El sistema SHALL mantener una configuración global `fase_activa` con valor `grupos`
o `eliminatoria`, modificable solo por el administrador. La `fase_activa` MUST
determinar la temporada a la que se invita a pagar (CTA y leyenda) y la pestaña por
defecto en las vistas con segmento de temporada. La `fase_activa` MUST NOT por sí
sola autorizar el guardado de pronósticos: el permiso se deriva de la participación.

#### Scenario: Valor por defecto seguro
- **WHEN** la configuración `fase_activa` no está presente o es inválida
- **THEN** el sistema asume `grupos` como temporada activa

#### Scenario: El administrador abre la eliminatoria
- **WHEN** el administrador cambia `fase_activa` a `eliminatoria`
- **THEN** las vistas con segmento muestran `eliminatoria` por defecto y el CTA de pago invita a la temporada de eliminatoria

### Requirement: Entrada tardía a una temporada
El sistema SHALL permitir confirmar la participación de un usuario en una temporada
en cualquier momento, incluso con partidos de esa temporada ya cerrados. La entrada
tardía MUST regirse por la regla existente: los partidos cerrados antes de la
confirmación se pierden sin recurso (no son pronosticables ni puntúan), y la bolsa
de la temporada MUST reflejar al nuevo participante en la siguiente consulta.

#### Scenario: Confirmación con partidos ya cerrados
- **WHEN** el administrador confirma la participación de un usuario en una temporada que ya tiene partidos cerrados
- **THEN** el usuario puede pronosticar solo los partidos aún abiertos de esa temporada y no obtiene puntos por los cerrados

#### Scenario: La bolsa crece con el nuevo participante
- **WHEN** el administrador confirma una participación adicional en una temporada
- **THEN** la bolsa de esa temporada refleja el nuevo total en la siguiente consulta, sin intervención manual

### Requirement: Migración de participantes existentes a la temporada de grupos
El sistema SHALL otorgar, al introducir el modelo de temporadas, una participación
`activo` en `grupos` a todo usuario con rol de participante cuya cuenta estuviera en
estado `activo`. Ningún usuario MUST perder el acceso a pronósticos o ranking de
grupos que ya tenía.

#### Scenario: Activo previo conserva grupos
- **WHEN** se aplica el modelo de temporadas y un participante tenía su cuenta en estado `activo`
- **THEN** queda con participación `activo` en `grupos` y conserva sus pronósticos y puntos previos
