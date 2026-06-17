# Design — filtro-dia-single

## Context

El filtro por día (change `filtro-dia`, ya en producción) es una tira horizontal
de fechas reales con celda "Todos" + una celda por día con partidos, en
`/partidos` y `/admin/partidos`. Hoy permite **selección múltiple por toggle**:
`DayFilter` (cliente) alterna fechas en una lista y la serializa a `?dia=` como
lista separada por comas; el servidor (`resolveSelectedDays`,
`filterJornadasByDays`) filtra las jornadas. Real-user feedback: el toggle
múltiple confunde porque la tira se lee como pestañas (tocar = cambiar) pero
acumula. Decisión de exploración: pasar a **un día a la vez**, conservando
"Todos" y el default de hoy.

## Goals / Non-Goals

**Goals:**
- Que tocar un día **cambie** la selección sin pasos extra (modelo de pestañas).
- Eliminar estados ambiguos: siempre exactamente una opción activa.
- Cambio mínimo: tocar sobre todo la interacción del cliente; dominio y páginas
  casi intactos.

**Non-Goals:**
- Selección múltiple de días (se retira deliberadamente; "Todos" cubre "ver todo").
- Date-picker / calendario emergente.
- Cambiar el default, la pausa por búsqueda de equipo, o el listado de tarjetas.

## Decisions

### D1 — Selección única con reemplazo; "Todos" es la primera pestaña
`DayFilter` deja de alternar y pasa a **reemplazar**: tocar un día navega a
`?dia=<ese día>`; tocar "Todos" navega a `?dia=` (presente-vacío). Siempre hay
exactamente una opción activa. Se elimina la regla "deseleccionar el último =
Todos" (ya no existe el estado cero). Internamente la selección sigue siendo una
lista para no tocar el dominio, pero de longitud 0 (Todos) o 1 (un día).

Alternativa considerada: mantener multi pero con casillas explícitas (checkbox).
Rechazada: el feedback pide simplicidad, no más chrome; y multi-día casi no se usa.

### D2 — Dominio sin cambios funcionales
`resolveSelectedDays`, `parseDiaParam` y `filterJornadasByDays` ya operan sobre
listas y siguen válidas: una lista de 1 elemento filtra a ese día; lista vacía
("Todos") muestra todo; ausencia del parámetro aplica el default (hoy / próximo).
`parseDiaParam` tolera de forma natural una URL antigua con varias fechas
(`?dia=14,15`): filtraría ambos días; no rompe, y la tira destacaría el primero
que reconozca. No se añade lógica especial para esos enlaces efímeros.

### D3 — Accesibilidad: semántica de selección única
La tira pasa de N botones `aria-pressed` independientes a un grupo de selección
única. Se modela como `role="radiogroup"` con cada celda `role="radio"` y
`aria-checked` (una sola marcada), o equivalente de pestañas; el foco y el
estado "activo" comunican que solo una opción manda. El marcador de "hoy" sigue
siendo independiente del estado activo. Se conserva el target táctil ≥44px, el
relleno cian + glow del activo y el scroll horizontal en móvil (este change no
rediseña el aspecto, solo la mecánica de selección).

### D4 — URL: un valor en lugar de lista
`?dia=2026-06-16`. Ausente = default hoy; presente-vacío (`?dia=`) = "Todos".
Compartible e idempotente. El `TeamFilter` sigue preservando `dia` y la pausa
por búsqueda de equipo no cambia.

## Risks / Trade-offs

- [Se pierde ver dos días específicos juntos] → aceptado: para una quiniela
  casual con pocos partidos por día, "Todos" + cambiar de día cubre el caso; la
  claridad pesa más.
- [Enlaces viejos con `?dia=14,15`] → no rompen (se filtran ambos días); la tira
  resalta uno. Enlaces efímeros, sin mitigación adicional.
- [Regresión visual al cambiar semántica a11y] → se valida en navegador
  (teclado + lector) que la selección única se anuncia y opera bien.

## Migration Plan

Sin migraciones ni cambios de datos: solo interacción y presentación. Branch
`filtro-dia-single`, pruebas locales, deploy de código. Rollback = revertir el
deploy.

## Open Questions

- Ninguna bloqueante.
