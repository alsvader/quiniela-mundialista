# predictions Specification

## Purpose

Captura de pronósticos L/E/V por partido, guardado por jornada completa mientras esté abierta, consulta de pronósticos propios y privacidad de los pronósticos.

## Requirements

### Requirement: Pronóstico por partido
El sistema SHALL permitir a un usuario `activo` seleccionar exactamente una opción por partido entre: gana local, empate o gana visitante. El pronóstico MUST NOT incluir marcador (goles).

#### Scenario: Selección única
- **WHEN** un usuario selecciona "empate" en un partido donde ya había seleccionado "gana local"
- **THEN** la selección queda en "empate" como única opción del partido

### Requirement: Guardado por jornada completa
El sistema SHALL guardar pronósticos por jornada completa: todos los partidos de la jornada MUST tener una selección para que el guardado proceda. El guardado se rechaza si la jornada está cerrada o si la cuenta no está `activa`.

#### Scenario: Guardado exitoso
- **WHEN** un usuario `activo` envía selecciones para todos los partidos de una jornada abierta
- **THEN** el sistema guarda los pronósticos y registra la fecha y hora de la modificación

#### Scenario: Jornada incompleta
- **WHEN** un usuario `activo` intenta guardar una jornada con al menos un partido sin selección
- **THEN** el sistema rechaza el guardado indicando qué falta por seleccionar

#### Scenario: Guardado tras el cierre rechazado en servidor
- **WHEN** un usuario envía un guardado después del cierre de la jornada, aunque la interfaz lo hubiera permitido
- **THEN** el servidor rechaza la operación y no se modifica ningún pronóstico

### Requirement: Modificación mientras la jornada esté abierta
El sistema SHALL permitir modificar los pronósticos de una jornada cuantas veces se desee mientras esté abierta, almacenando la fecha y hora de la última modificación.

#### Scenario: Modificación múltiple
- **WHEN** un usuario `activo` guarda una jornada abierta que ya tenía pronósticos
- **THEN** las selecciones anteriores se sobrescriben y se actualiza la fecha/hora de última modificación

#### Scenario: Modificación bloqueada tras el cierre
- **WHEN** un usuario intenta modificar pronósticos de una jornada cerrada
- **THEN** el sistema no permite la edición y muestra los pronósticos en modo solo lectura

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
