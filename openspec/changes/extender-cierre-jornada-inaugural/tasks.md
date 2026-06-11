# Tasks: Extender cierre de la jornada inaugural

## 1. Dominio y textos

- [x] 1.1 Mapa `JORNADA_DEADLINE_EXCEPTIONS` en `lib/domain/jornada.ts`; `isJornadaOpen` y `jornadaDeadline` lo consultan; tests de bordes (11:59:59 abierta, 12:00:00 cerrada, otras jornadas intactas)
- [x] 1.2 `formatDeadline` deriva del deadline real (`jornadaDeadline`) y muestra "11 de junio a las 12:00" para la inaugural; las demás siguen igual
- [x] 1.3 `nextOpenJornada` del layout usa `isJornadaOpen` sobre las fechas (no `match_date > hoy`) para que el banner apunte bien durante la mañana del 11

## 2. Base de datos

- [x] 2.1 Migración 0004: `create or replace function is_match_open` con la excepción del 2026-06-11 (case fechado, comentario cruzado con jornada.ts); aplicar en local

## 3. Verificación y despliegue

- [x] 3.1 Suite local completa (tests de dominio nuevos, smoke, e2e, build)
- [x] 3.2 `db push` de 0004 a producción + push a main (Vercel) + verificación contra prod: RLS acepta pick en jornada del 11 y el chip muestra la nueva hora límite
