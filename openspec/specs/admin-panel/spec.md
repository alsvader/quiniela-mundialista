# admin-panel Specification

## Purpose

Panel administrativo con acceso restringido por rol, gestión de usuarios y partidos, captura y corrección de marcadores, configuración del número de WhatsApp y consulta del ranking.

## Requirements

### Requirement: Acceso restringido al panel
El panel administrativo MUST ser accesible únicamente para usuarios con rol `admin`, validado en el servidor. La verificación de rol SHALL hacerse contra el perfil en base de datos, nunca contra datos controlados por el cliente.

#### Scenario: Participante intenta entrar al panel
- **WHEN** un usuario con rol participante navega a una ruta del panel administrativo
- **THEN** el sistema le niega el acceso

#### Scenario: Mutación admin desde cuenta no admin
- **WHEN** una cuenta sin rol `admin` invoca una acción administrativa (activar usuario, capturar marcador, editar configuración)
- **THEN** el servidor rechaza la operación

### Requirement: Gestión de usuarios
El administrador SHALL poder consultar la lista de usuarios registrados (nombre,
alias, correo, teléfono, estado de cuenta, participación por temporada, fecha de
registro), confirmar o retirar la participación de cada usuario **por temporada**
(`grupos` y `eliminatoria`), desactivar la cuenta completa y enviar un recordatorio
de pago por WhatsApp a quien no participa en la temporada activa.

#### Scenario: Consulta de registrados
- **WHEN** el administrador abre la sección de usuarios
- **THEN** ve todos los usuarios registrados con sus datos de contacto, estado de cuenta y su participación en cada temporada

#### Scenario: Confirmar pago de una temporada
- **WHEN** el administrador confirma el pago de un usuario en una temporada
- **THEN** el usuario queda con participación `activo` en esa temporada, sin afectar su participación en la otra

#### Scenario: Retirar participación de una temporada
- **WHEN** el administrador retira la participación `activo` de un usuario en una temporada
- **THEN** la participación de esa temporada pasa a `desactivado`, conservando sus datos y pronósticos

#### Scenario: Recordar pago a quien no participa en la temporada activa
- **WHEN** el administrador pulsa el recordatorio de pago en la fila de un usuario que no participa en la temporada activa
- **THEN** se abre WhatsApp dirigido al teléfono del usuario con el mensaje de bienvenida, monto y datos de transferencia prellenados

### Requirement: Gestión de partidos
El administrador SHALL poder crear y editar partidos, asignando fase, fecha, hora, equipos y, opcionalmente, el código de bandera de cada equipo y la sede (estadio y ciudad).

#### Scenario: Crear partido
- **WHEN** el administrador crea un partido con fase, fecha, hora, equipo local y visitante
- **THEN** el partido aparece en el calendario en la jornada correspondiente a su fecha

#### Scenario: Partido sin códigos de bandera
- **WHEN** el administrador crea un partido sin capturar códigos de bandera
- **THEN** el partido se guarda y se muestra sin banderas

#### Scenario: Capturar o corregir la sede
- **WHEN** el administrador captura o corrige el estadio y la ciudad de un partido
- **THEN** la sede actualizada se muestra en las cards del calendario del participante

#### Scenario: Partido sin sede
- **WHEN** el administrador crea o edita un partido dejando estadio y ciudad vacíos
- **THEN** el partido se guarda con sede nula y las cards lo muestran sin línea de sede

#### Scenario: Editar partido
- **WHEN** el administrador modifica la fecha de un partido
- **THEN** el partido se reagrupa en la jornada de su nueva fecha

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

### Requirement: Configuración del número de WhatsApp
El administrador SHALL poder consultar y actualizar el número de WhatsApp de contacto usado en el flujo de pago.

#### Scenario: Actualizar número
- **WHEN** el administrador guarda un nuevo número de WhatsApp
- **THEN** los enlaces de contacto generados a partir de ese momento apuntan al nuevo número

### Requirement: Configuración de datos de pago
El administrador SHALL poder consultar y actualizar los datos de transferencia usados en el recordatorio de pago: nombre del banco, CLABE, titular de la cuenta y monto del boleto. Estos datos se conservan junto al número de WhatsApp en la configuración y solo son editables por el administrador.

#### Scenario: Actualizar datos de transferencia
- **WHEN** el administrador guarda banco, CLABE, titular y monto en configuración
- **THEN** los recordatorios de pago generados a partir de ese momento incluyen esos datos

#### Scenario: Datos de pago incompletos
- **WHEN** el administrador guarda la configuración dejando vacío alguno de los datos de transferencia
- **THEN** el sistema acepta el guardado, pero el recordatorio de pago permanece deshabilitado hasta que todos los datos estén completos

### Requirement: Consulta del ranking por el administrador
El administrador SHALL poder consultar la clasificación general desde el panel.

#### Scenario: Ranking desde el panel
- **WHEN** el administrador consulta el ranking
- **THEN** ve la misma clasificación que la página pública

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
