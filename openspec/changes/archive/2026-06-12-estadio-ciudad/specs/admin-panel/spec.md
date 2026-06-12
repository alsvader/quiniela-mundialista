# admin-panel — delta (estadio-ciudad)

## MODIFIED Requirements

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
