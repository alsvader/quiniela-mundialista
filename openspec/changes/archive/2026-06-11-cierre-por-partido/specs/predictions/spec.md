# predictions — delta (cierre-por-partido)

## ADDED Requirements

### Requirement: Guardado por partido
El sistema SHALL guardar pronósticos por partido individual: cada partido
abierto presenta su propia acción de guardado y el guardado de un partido MUST
NOT depender de que otros partidos de la jornada tengan selección. El guardado
se rechaza si el partido está cerrado o si la cuenta no está `activa`. El
sistema MUST registrar la fecha y hora de la última modificación de cada
pronóstico. Un partido que llega a su cierre sin pronóstico simplemente no
puntúa; no hay recurso retroactivo.

#### Scenario: Guardado exitoso de un partido
- **WHEN** un usuario `activo` selecciona una opción en un partido abierto y acciona su guardado
- **THEN** el sistema guarda ese pronóstico y registra la fecha y hora de la modificación, sin exigir selecciones en los demás partidos de la jornada

#### Scenario: Guardado de partido posterior con el primero ya iniciado
- **WHEN** el primer partido de una jornada ya inició o terminó y un partido posterior de la misma jornada sigue abierto
- **THEN** el usuario puede guardar o modificar su pronóstico del partido posterior

#### Scenario: Guardado tras el cierre rechazado en servidor
- **WHEN** un usuario envía el guardado de un partido después de su cierre, aunque la interfaz lo hubiera permitido
- **THEN** el servidor rechaza la operación indicando que ese partido ya cerró y no se modifica ningún pronóstico

#### Scenario: Partido sin selección al cierre
- **WHEN** un partido llega a su cierre sin que el usuario haya guardado pronóstico
- **THEN** ese partido queda sin pronóstico (no puntúa) y los demás pronósticos del usuario no se ven afectados

## MODIFIED Requirements

### Requirement: Modificación mientras la jornada esté abierta
El sistema SHALL permitir modificar el pronóstico de cada partido cuantas veces
se desee mientras ese partido esté abierto, almacenando la fecha y hora de la
última modificación por pronóstico.

#### Scenario: Modificación múltiple
- **WHEN** un usuario `activo` guarda un partido abierto que ya tenía pronóstico
- **THEN** la selección anterior se sobrescribe y se actualiza la fecha/hora de última modificación de ese pronóstico

#### Scenario: Modificación bloqueada tras el cierre
- **WHEN** un usuario intenta modificar el pronóstico de un partido cerrado
- **THEN** el sistema no permite la edición y muestra ese pronóstico en modo solo lectura

## REMOVED Requirements

### Requirement: Guardado por jornada completa
**Reason**: Reemplazado por el guardado por partido individual. Con el cierre
por partido una jornada puede estar parcialmente cerrada, por lo que "todos los
partidos del día deben tener selección" deja de ser exigible ni deseable.
**Migration**: La Server Action de jornada completa (`saveJornada`) se
reemplaza por una action por partido; el formulario único de jornada se
descompone en un formulario por partido con botón propio.
