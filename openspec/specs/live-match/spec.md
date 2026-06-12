# live-match Specification

## Purpose

Estado en vivo de un partido con finalización explícita del administrador, su visualización en la página de partidos y la frescura del marcador mediante polling.

## Requirements

### Requirement: Estado en vivo y finalización explícita
Un partido SHALL considerarse "en vivo" cuando su hora de inicio
(`kickoff_at`) ya pasó y no ha sido dado por finalizado. La finalización MUST
ser un dato explícito capturado por el administrador (`finished_at`; null = no
finalizado), nunca derivada de la existencia de goles ni de una ventana de
tiempo. Un partido finalizado MUST tener marcador capturado (coherencia
garantizada también en la base de datos).

#### Scenario: Partido en vivo
- **WHEN** la hora actual es igual o posterior al kickoff de un partido y el partido no está finalizado
- **THEN** el partido está en vivo

#### Scenario: Goles capturados no finalizan
- **WHEN** el administrador captura un marcador parcial de un partido en vivo sin marcarlo como finalizado
- **THEN** el partido sigue en vivo y su marcador se muestra como parcial

#### Scenario: Finalización explícita
- **WHEN** el administrador marca un partido como finalizado
- **THEN** el partido deja de estar en vivo y su marcador se considera final

#### Scenario: Finalizado exige marcador
- **WHEN** se intenta finalizar un partido sin goles capturados
- **THEN** el sistema lo rechaza

### Requirement: Partido en vivo visible en la página de partidos
La página de partidos SHALL mostrar cada partido en vivo en una card
individual con la leyenda "En vivo", ambos equipos con su bandera y el
marcador. Si el marcador aún no ha sido capturado, la card MUST mostrar un
guion (—) en lugar de un marcador asumido. Con un solo partido en vivo, la
card SHALL ubicarse en el encabezado de la página, entre el título y la bolsa
acumulada; con dos o más, las cards SHALL ubicarse en una fila propia entre el
encabezado y el listado de jornadas, ordenadas por hora de inicio (orden
estable ante empates). El indicador "En vivo" MUST NOT comunicarse solo con
color y MUST respetar `prefers-reduced-motion`.

#### Scenario: Un partido en vivo
- **WHEN** hay exactamente un partido en vivo
- **THEN** su card aparece en el encabezado entre el título "Partidos" y la bolsa acumulada, con leyenda "En vivo" y su marcador

#### Scenario: Partidos simultáneos
- **WHEN** hay dos o más partidos en vivo (p. ej. la tercera jornada de un grupo)
- **THEN** todas las cards aparecen en una fila propia entre el encabezado y el listado, ordenadas por hora de inicio

#### Scenario: Sin marcador capturado
- **WHEN** un partido está en vivo y el administrador no ha capturado goles
- **THEN** la card muestra un guion (—) entre los equipos, nunca 0–0

#### Scenario: Sin partidos en vivo
- **WHEN** no hay ningún partido en vivo
- **THEN** la página no muestra cards de en vivo ni espacio reservado para ellas

#### Scenario: Partido en vivo en el listado de jornadas
- **WHEN** un partido en vivo aparece en su jornada dentro del listado
- **THEN** su card de solo lectura indica "En vivo" (con el marcador parcial si existe) en lugar de "Final" o "Por jugarse"

### Requirement: Frescura del marcador en vivo
Mientras haya al menos un partido en vivo, la página de partidos SHALL
refrescar sus datos automáticamente con un intervalo aproximado de un minuto,
pausando el refresco cuando la pestaña no está visible. Sin partidos en vivo,
el sistema MUST NOT generar peticiones de refresco. El mecanismo MUST NOT
requerir conexiones en tiempo real (websockets o similar).

#### Scenario: Marcador se actualiza solo
- **WHEN** el administrador captura un gol mientras un usuario tiene /partidos abierta en una pestaña visible
- **THEN** el marcador de la card en vivo se actualiza en la siguiente ventana de refresco (~1 minuto), sin que el usuario recargue

#### Scenario: Pestaña oculta no consume
- **WHEN** el usuario deja /partidos en una pestaña en segundo plano
- **THEN** el refresco automático se pausa hasta que la pestaña vuelva a ser visible

#### Scenario: Sin vivos no hay polling
- **WHEN** no hay partidos en vivo al renderizar la página
- **THEN** no se programa ningún refresco automático
