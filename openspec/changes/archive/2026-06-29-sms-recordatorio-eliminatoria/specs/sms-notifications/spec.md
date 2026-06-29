## ADDED Requirements

### Requirement: Aviso automático de eliminatoria por SMS

El sistema SHALL enviar un SMS de recordatorio a cada participante elegible de la
temporada `eliminatoria` cuando falten **2 horas o menos** para el kickoff de un
partido de eliminatoria y **el partido siga abierto** (faltando más de una hora para
el kickoff, coherente con `CLOSE_BEFORE_KICKOFF_MS`). El SMS SHALL enviarse a lo más
una vez por partido.

#### Scenario: Partido entra en la ventana de aviso
- **WHEN** se evalúa un partido de eliminatoria cuyo kickoff es dentro de 2 horas o
  menos pero a más de una hora (`kickoff − 120min ≤ ahora < kickoff − 60min`) y no
  existe registro previo de aviso para ese partido
- **THEN** el sistema envía el SMS a todos los participantes elegibles y registra que
  el aviso de ese partido ya se envió

#### Scenario: Partido aún fuera de ventana
- **WHEN** se evalúa un partido de eliminatoria cuyo kickoff es a más de 2 horas
- **THEN** el sistema no envía ningún SMS para ese partido

#### Scenario: Partido ya cerrado
- **WHEN** se evalúa un partido de eliminatoria cuyo kickoff es dentro de una hora o
  menos (ya cerrado o a punto de cerrar)
- **THEN** el sistema no envía el aviso de ese partido aunque no se haya enviado antes

#### Scenario: Partido de fase de grupos
- **WHEN** se evalúa un partido cuya fase es `group_stage`
- **THEN** el sistema no lo considera para el aviso de eliminatoria

### Requirement: Idempotencia por partido (ledger)

El sistema SHALL registrar el envío del aviso de cada partido y SHALL usar ese
registro para no reenviar. El registro SHALL escribirse solo cuando el proveedor de
SMS aceptó el lote; si el envío falla, el partido SHALL quedar sin registro para que
una corrida posterior lo reintente.

#### Scenario: Corrida repetida sobre un partido ya avisado
- **WHEN** una corrida evalúa un partido que ya tiene registro de aviso
- **THEN** el sistema lo omite y no envía SMS

#### Scenario: Fallo del proveedor no marca como enviado
- **WHEN** el proveedor de SMS responde error (o la petición falla) al enviar el lote
  de un partido
- **THEN** el sistema no escribe el registro de ese partido y la siguiente corrida
  reintenta el lote completo

### Requirement: Audiencia elegible

El sistema SHALL enviar el SMS únicamente a usuarios con participación `active` en la
temporada `eliminatoria`, cuya cuenta no esté `disabled` y que tengan un teléfono que
normalice a 10 dígitos nacionales. Los usuarios sin teléfono válido SHALL excluirse
del lote sin abortar el envío al resto.

#### Scenario: Usuario sin participación activa en eliminatoria
- **WHEN** se arma el lote de un partido
- **THEN** los usuarios sin participación `active` en `eliminatoria` no se incluyen

#### Scenario: Teléfono inválido se descarta
- **WHEN** un participante elegible tiene un teléfono que no normaliza a 10 dígitos
- **THEN** ese número se excluye del lote y el resto del lote se envía igual

#### Scenario: Ningún destinatario elegible
- **WHEN** un partido entra en ventana pero no hay destinatarios con teléfono válido
- **THEN** el sistema no llama al proveedor y registra el partido como atendido para
  no reintentar indefinidamente

### Requirement: Endpoint protegido por secreto

El disparo del envío SHALL estar detrás de un route handler que exige un secreto
compartido (`CRON_SECRET`). El sistema SHALL rechazar con 401 cualquier petición sin
el secreto correcto, antes de leer datos o enviar SMS.

#### Scenario: Petición sin secreto
- **WHEN** se invoca el endpoint sin el secreto o con uno incorrecto
- **THEN** el sistema responde 401 y no consulta destinatarios ni envía SMS

#### Scenario: Petición autorizada
- **WHEN** se invoca el endpoint con el secreto correcto
- **THEN** el sistema procesa los partidos en ventana y responde un resumen de lo
  enviado

### Requirement: Disparo periódico cada 30 minutos

El sistema SHALL invocar el endpoint de forma periódica cada 30 minutos mediante un
job de base de datos (`pg_cron`), de modo que la ventana de envío de 60 minutos quede
cubierta sin depender de la presencia del admin ni de un cron de hosting de baja
frecuencia.

#### Scenario: Tick fallido se recupera en el siguiente
- **WHEN** una invocación periódica no se ejecuta o falla
- **THEN** la siguiente invocación (a más de 30 minutos) atiende todos los partidos en
  ventana aún no avisados, sin perder envíos mientras el partido siga abierto

### Requirement: Integración con SMS Masivos (bulk, sandbox)

El sistema SHALL enviar los SMS mediante `POST {SMS_BASE_URL}/sms/send` autenticando
con el header `apikey` (`SMS_API_KEY`), agrupando los destinatarios de un partido en
una sola llamada (`numbers` separados por coma, hasta 500), con `country_code` `52` y
respetando el modo de pruebas `sandbox` (`SMS_SANDBOX`). El texto SHALL ser corto y
sin emojis para no encarecer por segmentación.

#### Scenario: Envío bulk de un partido
- **WHEN** un partido tiene N destinatarios elegibles (N ≤ 500)
- **THEN** el sistema realiza una sola llamada con los N números y, si la respuesta es
  exitosa, registra el partido como enviado

#### Scenario: Modo sandbox activo
- **WHEN** `SMS_SANDBOX` indica pruebas
- **THEN** el sistema envía con la marca de sandbox y no consume crédito real

#### Scenario: Mensaje sin emojis
- **WHEN** se construye el texto del SMS
- **THEN** el texto no contiene emojis y prioriza caber en un solo segmento
