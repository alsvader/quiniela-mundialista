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

En partidos de **eliminatoria** el formulario SHALL incluir además un selector
"quién avanza" (local o visitante): cuando los goles son distintos, "quién avanza"
se deduce del marcador y MUST validarse que no lo contradiga; cuando los goles están
empatados, el administrador MUST elegir al ganador (penales). El sistema MUST
rechazar finalizar un partido de eliminatoria sin "quién avanza" definido. En
partidos de **grupos** el formulario no muestra ese selector y "quién avanza"
permanece sin definir.

#### Scenario: Captura de marcador parcial
- **WHEN** el administrador captura goles durante un partido sin marcar la casilla de finalizado
- **THEN** el marcador se guarda como parcial: visible como "en vivo" para los participantes, sin derivar puntos

#### Scenario: Captura de marcador final en grupos
- **WHEN** el administrador captura goles y marca la casilla de finalizado en un partido de grupos
- **THEN** el partido queda finalizado, el sistema deriva el resultado oficial de los goles y los puntos quedan reflejados en ranking y detalles

#### Scenario: Finalizar eliminatoria definiendo quién avanza
- **WHEN** el administrador finaliza un partido de eliminatoria que terminó 1-1 y elige que avanza el visitante
- **THEN** el partido queda finalizado, el resultado oficial es "avanza el visitante" y los puntos se reflejan en ranking y detalles

#### Scenario: Auto-deducción de quién avanza con marcador definido
- **WHEN** el administrador captura 2-0 a favor del local en un partido de eliminatoria
- **THEN** "quién avanza" queda como el local, coherente con el marcador, sin pasos adicionales

#### Scenario: Finalizar eliminatoria sin ganador rechazado
- **WHEN** el administrador intenta finalizar un partido de eliminatoria con marcador empatado sin elegir quién avanza
- **THEN** el sistema rechaza la operación indicando que falta definir quién avanza

#### Scenario: Corrección de marcador
- **WHEN** el administrador actualiza el marcador o quién avanza de un partido finalizado manteniendo la casilla marcada
- **THEN** el partido sigue finalizado y el resultado oficial, los puntos y el ranking reflejan el cambio sin pasos adicionales

#### Scenario: Des-finalizar para corregir
- **WHEN** el administrador guarda un partido finalizado con la casilla desmarcada
- **THEN** el partido vuelve a estado no finalizado y sus puntos dejan de contar hasta una nueva finalización

#### Scenario: Finalizar sin marcador rechazado
- **WHEN** el administrador intenta finalizar un partido sin goles capturados
- **THEN** el sistema rechaza la operación indicando que falta el marcador
