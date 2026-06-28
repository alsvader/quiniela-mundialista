## Context

El change `fase-eliminatoria-temporada` (ya desplegado) introdujo la temporada
(`grupos`/`eliminatoria`) derivada de `match_phase`, la función SQL
`temporada_de_fase(phase)` y `ranking(temp)`. Sobre eso, el modelo de puntuación
sigue siendo único: el resultado oficial se deriva **solo de los goles**
(`deriveResult`: home>away→H, home<away→A, iguales→D) tanto en la app
(`lib/domain/scoring.ts`) como en la BD (`ranking(temp)`), y el pronóstico es
L/E/V (`pick` enum `H`/`D`/`A`).

En eliminatoria de Copa del Mundo (partido único directo) no hay empate como
desenlace: si hay empate a 90'/prórroga, se define por penales y **avanza** un
equipo. Por tanto (a) el pronóstico debe ser L/V — "¿Quién avanza?" — y (b) el
resultado oficial de esas fases no se puede derivar de los goles cuando hay
empate: necesita un dato explícito de quién pasó. Restricciones heredadas que se
mantienen: lógica/autorización en servidor con RLS/CHECK como última línea, montos
y puntos derivados, solo partidos finalizados puntúan, captura manual por el admin.

## Goals / Non-Goals

**Goals:**
- Pronóstico de eliminatoria = solo L/V, encabezado "¿Quién avanza?".
- Resultado oficial ramificado por temporada: grupos por goles; eliminatoria por
  "quién avanza".
- Puntuación correcta en eliminatoria: 1 punto si el pick L/V == quién avanzó.
- Un partido de eliminatoria finalizado sin ganador definido no puntúa.
- Reusar el modelo de temporada existente (el gate es la fase del partido).

**Non-Goals:**
- Mostrar/registrar el marcador de penales (`home_pens`/`away_pens`) — mejora
  futura (opción B); aquí solo se captura quién avanza.
- Empates "técnicos" en eliminatoria, formatos a doble partido o agregados (la
  eliminatoria 2026 es a partido único).
- Cambiar la fase de grupos (sigue L/E/V por goles, intacta).

## Decisions

### D1 — Columna `avanza` en `matches`, reusando el enum `pick`
Nueva columna `matches.avanza public.pick` **nullable**, con CHECK `avanza in
('H','A')` (nunca `D`). Reusar el enum `pick` hace la comparación con el pronóstico
trivial (`pred.pick = m.avanza`). Solo es significativa en fases de eliminatoria;
en grupos queda siempre `null`. Los goles se siguen capturando para mostrar el
marcador real (1-1) aunque no determinen el resultado.
*Alternativa:* columnas de penales y derivar el ganador. Rechazada para V1 (opción
B, fuera de alcance): más campos y form para un dato que hoy no se muestra.

### D2 — Resultado oficial ramificado por temporada (tres capas espejo)
El "resultado oficial" deja de ser una función pura de los goles:
- **Grupos:** `deriveResult(goles)` → H/D/A (sin cambios).
- **Eliminatoria:** el resultado oficial **es** `avanza` (H/A).

Se refleja en:
1. `lib/domain/scoring.ts`: una función `officialResult(match)` que ramifica por
   `temporadaDeFase(phase)`; `scorePrediction` compara el pick contra ese resultado.
2. `ranking(temp)` (SQL): el `CASE` usa `m.avanza` cuando `temp='eliminatoria'` y la
   derivación por goles cuando `temp='grupos'`; el join exige `avanza is not null`
   en eliminatoria y `home_goals is not null` en grupos (además de `finished_at`).
3. `/mis-puntos`: muestra como resultado oficial el equipo que avanza en
   eliminatoria, en vez de L/E/V por goles.

### D3 — Finalización en eliminatoria exige `avanza` (CHECK por fila)
CHECK en `matches`: `finished_at is null OR temporada_de_fase(phase) = 'grupos' OR
avanza is not null`. `temporada_de_fase` es `immutable`, así que es válida en un
CHECK sobre la misma fila. Garantiza que un partido eliminatorio finalizado siempre
tenga ganador definido — un 1-1 sin ganador no puede quedar "finalizado" y por
tanto no puntúa. El form del admin valida primero; el CHECK es la última línea.

### D4 — Rechazo de `pick='D'` en eliminatoria vía RLS (sin trigger)
Un CHECK simple en `predictions` no puede mirar `matches.phase` (no hay subconsultas
en CHECK). Pero las políticas RLS de `predictions` (insert/update) **ya** consultan
la fase del partido para `participa_en(...)`. Se les añade la condición:
`temporada_de_fase((select phase from matches where id = match_id)) = 'grupos' OR
pick <> 'D'`. Así la BD rechaza un empate en eliminatoria sin trigger nuevo. La
acción `savePick` lo valida antes con un mensaje claro; un `D` que se colara igual
nunca puntuaría (no puede igualar a `avanza`).

### D5 — Captura del admin: selector "quién avanza" condicionado a la fase
El `score-form` muestra el selector "quién avanza" (Local/Visitante) **solo** para
fases de eliminatoria. La acción `saveScore`: si los goles son distintos,
`avanza` se auto-deduce del mayor (y se valida que no contradiga al admin); si hay
empate, el admin debe elegir al ganador (penales). En grupos el form queda igual y
`avanza` se mantiene en `null`.

## Risks / Trade-offs

- **[La reescritura de `ranking(temp)` toca la ruta crítica de puntos]** → El cambio
  es aditivo sobre la función ya probada; se cubre con tests de `scoring` (grupos vs
  eliminatoria) y una verificación SQL de `ranking('eliminatoria')` con un empate +
  `avanza`.
- **[Goles y `avanza` incoherentes (admin marca ganador distinto al marcador)]** →
  `saveScore` valida: con goles distintos, `avanza` debe coincidir con el líder; el
  empate es el único caso donde el admin elige libremente.
- **[`pick='D'` heredado o por carrera en eliminatoria]** → triple defensa: UI no lo
  ofrece, `savePick` lo rechaza, RLS lo bloquea; y aunque existiera, no puntúa.
- **[Confusión de UX entre "gana" y "avanza"]** → encabezado explícito "¿Quién
  avanza?" y opciones "{equipo} avanza"; el marcador (p. ej. 1-1) se sigue mostrando
  para contexto. Refinar copy con `impeccable`.

## Migration Plan

1. Migración `0011_eliminatoria_avanza.sql`:
   - `alter table matches add column avanza public.pick` + CHECK `avanza in ('H','A')`.
   - CHECK de finalización: eliminatoria finalizada ⇒ `avanza` no nula (D3).
   - Reescritura de `ranking(temp)` con la rama por temporada (D2). Guardar la
     definición previa para rollback.
   - Reescritura de las políticas `predictions_insert/update` añadiendo el rechazo de
     `D` en eliminatoria (D4).
2. Dominio/acciones/UI (orden en tasks.md). Sin partidos de eliminatoria cargados, el
   cambio es inerte para grupos (todo `avanza` null, ranking de grupos idéntico), así
   que se puede desplegar antes de abrir la eliminatoria.
3. **Rollback**: restaurar `ranking(temp)` y las políticas previas; la columna
   `avanza` puede quedar (nullable, sin efecto en grupos) o eliminarse.

## Open Questions

- ¿El marcador a 90' (p. ej. "1-1") se muestra junto a "{equipo} avanza" en las
  cards/`mis-puntos`, o basta con el equipo que pasa? (Propuesta: mostrar el marcador
  como contexto y el ganador como resultado oficial.)
- ¿Auto-deducir `avanza` del marcador cuando los goles difieren es deseable, o el
  admin siempre lo elige explícitamente para evitar errores? (Propuesta: auto-deducir
  con validación; elegir solo en empate.)
