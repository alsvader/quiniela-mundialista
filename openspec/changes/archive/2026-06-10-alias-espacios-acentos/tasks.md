# Tasks: alias-espacios-acentos

## 1. Base de datos

- [x] 1.1 Crear `supabase/migrations/0005_alias_espacios_acentos.sql`: `DROP CONSTRAINT profiles_alias_format` + `ADD CONSTRAINT` con la regex nueva (design D5) y aplicarla en local (`supabase db reset` o `db push` local) verificando que el seed pasa.

## 2. Validación en servidor

- [x] 2.1 Actualizar `profileFieldsSchema.alias` en `lib/schemas.ts`: agregar `.transform(s => s.normalize("NFC"))` tras el trim, reemplazar la regex por `^[charset]+( [charset]+)*$` con el charset de design D1, mover la longitud a `.min(3)/.max(20)` y actualizar el mensaje de error mencionando espacios y acentos.

## 3. Formulario de registro

- [x] 3.1 Actualizar el atributo `pattern` (y `minLength`/`maxLength` si aplica) del campo alias en `app/(public)/registro/register-form.tsx` con la misma regla, siguiendo el flujo de UI obligatorio (skill `impeccable`) para el texto de hint/error si cambia copy visible.

## 4. Verificación

- [x] 4.1 Probar en local el registro con "Don Linux" y "Ramón" (aceptados) y con " DonLinux", "Don  Linux", "AB" (rechazados con el mensaje nuevo), incluyendo que el CHECK de Postgres acepta el insert.
- [x] 4.2 Aplicar la migración 0005 en Supabase cloud (`supabase db push`), desplegar en Vercel y verificar en producción un registro con espacio y acento.
