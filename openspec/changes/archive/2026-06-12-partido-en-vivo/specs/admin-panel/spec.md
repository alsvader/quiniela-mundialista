# admin-panel — delta (partido-en-vivo)

## MODIFIED Requirements

### Requirement: Captura y corrección de marcadores
El administrador SHALL poder capturar los goles del equipo local y visitante
de un partido en cualquier momento (incluido durante el partido, como marcador
parcial) y actualizarlos posteriormente para corregir errores. El mismo
formulario SHALL permitir marcar el partido como finalizado mediante una
casilla explícita, desmarcada por defecto en partidos no finalizados e
inicializada con el estado actual en partidos ya finalizados. Guardar con la
casilla desmarcada un partido previamente finalizado SHALL quitar la
finalización (reversa para correcciones). El sistema MUST rechazar finalizar
un partido sin goles capturados.

#### Scenario: Captura de marcador parcial
- **WHEN** el administrador captura goles durante un partido sin marcar la casilla de finalizado
- **THEN** el marcador se guarda como parcial: visible como "en vivo" para los participantes, sin derivar puntos

#### Scenario: Captura de marcador final
- **WHEN** el administrador captura goles y marca la casilla de finalizado
- **THEN** el partido queda finalizado, el sistema deriva el resultado oficial y los puntos quedan reflejados en ranking y detalles

#### Scenario: Corrección de marcador
- **WHEN** el administrador actualiza el marcador de un partido finalizado manteniendo la casilla marcada
- **THEN** el partido sigue finalizado y el resultado oficial, los puntos y el ranking reflejan el nuevo marcador sin pasos adicionales

#### Scenario: Des-finalizar para corregir
- **WHEN** el administrador guarda un partido finalizado con la casilla desmarcada
- **THEN** el partido vuelve a estado no finalizado y sus puntos dejan de contar hasta una nueva finalización

#### Scenario: Finalizar sin marcador rechazado
- **WHEN** el administrador intenta finalizar un partido sin goles capturados
- **THEN** el sistema rechaza la operación indicando que falta el marcador

## ADDED Requirements

### Requirement: Recordatorio de finalización pendiente
La lista de partidos del panel SHALL señalar los partidos cuya hora de inicio
pasó hace más de un umbral razonable (~2.5 horas) y que siguen sin finalizar,
para que el administrador no olvide darlos por terminados. El umbral MUST
usarse únicamente como recordatorio visual: MUST NOT finalizar partidos
automáticamente ni afectar puntos, ranking o el estado en vivo.

#### Scenario: Partido probablemente terminado sin finalizar
- **WHEN** la hora actual supera el kickoff de un partido por más del umbral y el partido no está finalizado
- **THEN** la lista de partidos del admin lo señala con un aviso de finalización pendiente

#### Scenario: El aviso no decide
- **WHEN** un partido supera el umbral sin que el administrador lo finalice
- **THEN** el partido permanece en vivo para todo el sistema hasta la finalización explícita
