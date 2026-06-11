# Design: alias-espacios-acentos

## Context

El formato del alias se valida hoy con la misma regla `^[A-Za-z0-9_.-]{3,20}$` en tres capas:

1. `app/(public)/registro/register-form.tsx:54` — atributo `pattern` del input (primera barrera, mensaje nativo del navegador).
2. `lib/schemas.ts:31` — regex de zod en `profileFieldsSchema` (frontera del Server Action, design.md D12 del change v1).
3. `supabase/migrations/0001_schema.sql:32` — `constraint profiles_alias_format check (alias ~ '^[A-Za-z0-9_.-]+$')` (última línea en Postgres; la longitud vive aparte en `profiles_alias_length`).

La base ya está desplegada en Supabase cloud (producción), así que la capa 3 requiere migración nueva. La unicidad (`profiles_alias_unique` + RPC `alias_is_available` con `lower()`) no cambia.

## Goals / Non-Goals

**Goals:**
- Aceptar aliases con espacios internos sencillos ("Don Linux") y letras españolas acentuadas ("Ramón", "El Niño").
- Mantener las tres capas con exactamente la misma regla efectiva.
- Cambio retrocompatible: ningún alias existente queda inválido.

**Non-Goals:**
- No se amplía a emojis, símbolos ni alfabetos no latinos.
- No cambia la unicidad ni la longitud (3–20).
- No se renombra ni migra ningún alias existente.

## Decisions

### D1 — Charset explícito en vez de clases Unicode

La regla nueva en las tres capas usa el conjunto explícito `A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-` (letras españolas enumeradas).

- Alternativa descartada: `\p{L}` (JS) / `[[:alpha:]]` (Postgres). `\p{L}` no existe en el motor de regex de Postgres y `[[:alpha:]]` depende del `lc_ctype` de la base, lo que rompería la garantía de que las tres capas aceptan exactamente lo mismo. El producto es para un grupo hispanohablante; enumerar las letras españolas es suficiente y 100% determinista.

### D2 — Espacios internos sencillos por estructura de la regex

Forma: `^[charset]+( [charset]+)*$` — palabras del charset unidas por espacios sencillos. Prohíbe por construcción espacios al inicio/fin y dobles espacios.

- Razón: el alias es la identidad pública del ranking; `"Don Linux"` y `"Don  Linux"` pasarían el `unique` de Postgres siendo strings distintos pero visualmente idénticos. El `trim()` de zod cubre extremos en la app, pero el CHECK debe protegerse solo.
- La longitud 3–20 sale de la regex (incompatible con la estructura de grupos) y pasa a `.min(3).max(20)` en zod; en Postgres ya existe `profiles_alias_length`, que no cambia.

### D3 — Normalización NFC antes de validar

zod agrega `.transform(s => s.normalize("NFC"))` (tras el trim, antes de la regex). Texto pegado en macOS puede venir en NFD (`o` + acento combinante), que no matchearía el charset y además crearía aliases visualmente duplicados con bytes distintos. NFC en la frontera garantiza que a Postgres siempre llega la forma compuesta.

### D4 — Rechazar dobles espacios, no colapsarlos

Se rechaza con mensaje claro en lugar de transformar en silencio: el CHECK de Postgres no puede transformar, y colapsar solo en la app abriría una divergencia entre capas. El `pattern` HTML evita que el caso llegue a enviarse en el flujo normal.

### D5 — Migración 0005 con DROP + ADD del mismo constraint

```sql
alter table public.profiles
  drop constraint profiles_alias_format,
  add constraint profiles_alias_format
    check (alias ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+)*$');
```

Se conserva el nombre del constraint. Como la regla nueva es un superconjunto de la vieja, todas las filas existentes validan y el `ADD` no puede fallar.

## Risks / Trade-offs

- [Aliases visualmente confundibles por mayúsculas/acentos, p. ej. "Ramon" vs "Ramón"] → La RPC `alias_is_available` ya compara con `lower()`; la variante con/sin acento se considera alias distinto, igual que hoy "Jose" vs "Pepe". Aceptable para un grupo de conocidos; el admin puede desactivar suplantadores (mitigación ya documentada en el v1).
- [Rollback de la migración] → Re-imponer la regla vieja fallaría si ya existen aliases con espacio/acento; el rollback sería solo dejar de aceptar nuevos (editar app) sin tocar el CHECK. Riesgo bajo: el cambio solo amplía.
- [El `pattern` HTML con caracteres no ASCII] → Los navegadores compilan `pattern` con flag `v` (Unicode); los literales acentuados funcionan sin escapes. Verificar manualmente en el navegador como parte de las tareas.

## Migration Plan

1. Crear `supabase/migrations/0005_alias_espacios_acentos.sql` (D5) y aplicarla en local.
2. Primero `supabase db push` al proyecto cloud y después el deploy en Vercel. El orden importa: el DB nuevo acepta todo lo que la app vieja envía (superconjunto), pero la app nueva con el CHECK viejo dejaría pasar por zod aliases que Postgres rechazaría (cuenta Auth creada sin perfil).
3. Verificar en producción registrando un alias con espacio y acento.

## Open Questions

Ninguna.
