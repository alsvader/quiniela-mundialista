# Tasks — estadio-ciudad

## 1. Generador y datos

- [x] 1.1 Extender `scripts/generate-fixture-seed.py`: dict `VENUES` con las
      16 entradas aprobadas (Location del feed → estadio/ciudad es-MX),
      error explícito ante Location desconocida, 
      y emisión de `supabase/migrations/0008_estadio_ciudad.sql` (add column
      nullable + UPDATE de las 72 filas keyed por id oficial FIFA; la 0002 no
      se toca: la 0008 corre después del seed en todos los entornos)
- [x] 1.2 Ejecutar el generador: crear la `0008_estadio_ciudad.sql` y
      verificar que `0002_seed_fixture.sql` queda byte-idéntico
- [x] 1.3 Probar en local (`supabase db reset`) y verificar con SQL que los
      72 partidos tienen estadio y ciudad correctos (muestreo: ids 1, 28 y
      uno por país sede)

## 2. Tipos y schemas

- [x] 2.1 `lib/types.ts`: `Match` gana `stadium: string | null` y
      `city: string | null`
- [x] 2.2 `lib/schemas.ts`: `matchSchema` gana `stadium` y `city` opcionales
      (trim, vacío → null, como `group_label`)

## 3. Admin

- [x] 3.1 `app/admin/partidos/match-form.tsx`: dos `Field` opcionales
      (Estadio, Ciudad) con defaultValue del partido
- [x] 3.2 `app/admin/actions.ts` `upsertMatch`: persistir `stadium`/`city`

## 4. UI participante — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 4.1 `match-pick-card.tsx`: línea `label-data` "Estadio · Ciudad" bajo
      la fila de equipos (null-safe: sin sede no se renderiza), una sola
      línea con truncado en anchos extremos
- [x] 4.2 `closed-match-card.tsx`: misma línea, misma posición, mismo
      tratamiento
- [x] 4.3 Revisar en móvil (390px) que nombres largos ("Lincoln Financial
      Field · Filadelfia") no rompen el layout de las cards

## 5. Verificación local y despliegue

- [x] 5.1 `npm run build` + tests verdes; prueba manual local: cards con
      sede, partido sin sede (creado a mano) sin línea, admin captura y
      corrige sede
- [ ] 5.2 Producción: aplicar migración 0008 (seguro con código viejo:
      columnas nullable invisibles), merge y deploy; verificar sedes en
      producción
