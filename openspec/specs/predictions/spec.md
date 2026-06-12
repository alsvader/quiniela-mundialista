# predictions Specification

## Purpose

Captura de pronósticos L/E/V por partido, guardado por partido mientras ese partido esté abierto, consulta de pronósticos propios y privacidad de los pronósticos.

## Requirements

### Requirement: Pronóstico por partido
El sistema SHALL permitir a un usuario `activo` seleccionar exactamente una opción por partido entre: gana local, empate o gana visitante. El pronóstico MUST NOT incluir marcador (goles).

#### Scenario: Selección única
- **WHEN** un usuario selecciona "empate" en un partido donde ya había seleccionado "gana local"
- **THEN** la selección queda en "empate" como única opción del partido

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

### Requirement: Consulta de pronósticos propios
El usuario SHALL poder consultar sus pronósticos realizados junto con el resultado oficial y el marcador final de cada partido ya capturado.

#### Scenario: Consulta tras resultados capturados
- **WHEN** un usuario consulta una jornada cuyos marcadores ya fueron capturados
- **THEN** ve su pronóstico, el marcador final, el resultado oficial y si acertó o no en cada partido

### Requirement: Privacidad de pronósticos
Los pronósticos de un usuario MUST ser visibles únicamente para él mismo y para el administrador.

#### Scenario: Acceso a pronósticos ajenos
- **WHEN** un usuario intenta consultar los pronósticos de otro participante
- **THEN** el sistema lo impide
