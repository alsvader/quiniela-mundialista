# Proposal: alias-espacios-acentos

## Why

El alias de registro se valida hoy con `^[A-Za-z0-9_.-]{3,20}$` en tres capas (pattern HTML, zod y CHECK en Postgres), lo que rechaza aliases legítimos como "Don Linux" (espacio) o "Ramón" (acento). Un usuario real ya chocó con este error durante el registro y la jornada inaugural cierra el 11-jun-2026, así que cada registro bloqueado cuenta.

## What Changes

- El alias acepta espacios internos sencillos (sin espacios al inicio/fin ni dobles espacios) y letras latinas con acentos y ñ/Ñ (á é í ó ú ü, etc.), además de los caracteres ya permitidos (letras ASCII, números, punto, guion y guion bajo).
- Se mantiene el límite de 3 a 20 caracteres y la unicidad case-insensitive.
- Las tres capas de validación se aflojan de forma consistente: `pattern` del input en `register-form.tsx`, regex de zod en `lib/schemas.ts` y constraint `profiles_alias_format` vía nueva migración `0005` (la base ya está en producción; el cambio es retrocompatible porque solo amplía el conjunto válido).
- El mensaje de error de formato se actualiza para mencionar espacios y acentos.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `auth-registration`: el requirement de registro de participante cambia para aceptar aliases con espacios internos sencillos y letras latinas acentuadas, y para rechazar explícitamente espacios dobles o en los extremos.

## Impact

- `app/(public)/registro/register-form.tsx` — atributo `pattern` del campo alias.
- `lib/schemas.ts` — regex y mensaje de `profileFieldsSchema.alias`.
- `supabase/migrations/0005_*.sql` — `DROP CONSTRAINT profiles_alias_format` + `ADD CONSTRAINT` con la regla nueva; aplicar también en Supabase cloud (producción).
- Sin impacto en unicidad (`profiles_alias_unique` y `alias_is_available` siguen funcionando; la regla de espacio sencillo evita aliases visualmente idénticos por dobles espacios).
- Sin impacto en ranking ni vistas: solo se amplía el conjunto de caracteres mostrados.
