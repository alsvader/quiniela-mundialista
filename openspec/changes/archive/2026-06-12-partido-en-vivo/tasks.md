# Tasks — partido-en-vivo

## 1. Base de datos

- [x] 1.1 Crear `supabase/migrations/0007_partido_en_vivo.sql`: columna
      `finished_at timestamptz null` en `matches`, CHECK
      `finished_at is null or home_goals is not null`, backfill
      (`finished_at = now()` donde haya goles capturados) y
      `create or replace function public.ranking()` con
      `and m.finished_at is not null` en el join
- [x] 1.2 Probar la migración en local (`supabase db reset`) y verificar con
      SQL: backfill aplicado, CHECK rechaza finalizar sin goles, `ranking()`
      ignora un marcador parcial y lo cuenta tras finalizar

## 2. Dominio y tipos

- [x] 2.1 Agregar `finished_at: string | null` a `Match` en `lib/types.ts`
- [x] 2.2 Agregar a `lib/domain/jornada.ts`: `isMatchLive(match, now?)`
      (`kickoff_at ≤ now` y `finished_at === null`) e
      `isMatchFinished(match)` (`finished_at !== null`), con tests en
      `jornada.test.ts` (bordes en el kickoff exacto y combinaciones
      goles/finalizado)

## 3. Admin

- [x] 3.1 `lib/schemas.ts`: `scoreSchema` gana `finished` (checkbox; coerción
      desde FormData) — finalizar exige goles (el CHECK es la última línea)
- [x] 3.2 `app/admin/actions.ts` `saveScore`: persistir
      `finished_at = now()` al marcar y `null` al desmarcar (reversa);
      mantener revalidaciones
- [x] 3.3 Form de marcador en `app/admin/partidos/[id]`: checkbox "Marcar
      como finalizado" inicializado con el estado actual del partido
      (desmarcado en no finalizados)
- [x] 3.4 `app/admin/partidos/page.tsx`: badge "Falta finalizar" en partidos
      con `kickoff_at + 2.5 h < now` y sin finalizar

## 4. UI participante (/partidos) — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 4.1 Crear `LiveMatchCard` (server): leyenda "En vivo" (chip magenta
      secundario con indicador de forma + pulso respetando
      `prefers-reduced-motion`), banderas, equipos y marcador o guion `—`
      si no hay goles capturados
- [x] 4.2 Crear `LiveRefresher` (client): `router.refresh()` cada ~60 s,
      pausado con `document.visibilityState`, montado solo cuando hay
      partidos en vivo
- [x] 4.3 `page.tsx`: calcular `liveMatches` (orden kickoff, empate por id);
      1 en vivo → card al centro del header; 2+ → fila propia entre header y
      listado; montar `LiveRefresher` solo si hay vivos
- [x] 4.4 `closed-match-card.tsx`: partido en vivo muestra chip "En vivo" y
      marcador parcial si existe (en lugar de "Final"/"POR JUGARSE"); puntos
      ("✓ +1 PT") solo en finalizados
- [x] 4.5 `app/(participante)/mis-puntos/page.tsx`: total, conteo y detalle
      solo con partidos finalizados

## 5. Verificación local y despliegue

- [x] 5.1 `npm run build` + tests verdes; prueba manual local: capturar
      marcador parcial (card en vivo con marcador, ranking inmóvil),
      finalizar (puntos aparecen, chip "Final"), des-finalizar (puntos se
      retiran), partido en vivo sin captura (guion), polling visible
- [x] 5.2 Actualizar `openspec/config.yaml`: decisión 3 gana la condición
      "solo partidos finalizados puntúan"
- [x] 5.3 Producción: aplicar migración 0007 en un momento sin partido en
      curso (o verificar ese partido tras el deploy), luego merge y deploy
      en el mismo release; verificar en producción con el siguiente partido
