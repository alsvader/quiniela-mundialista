-- Cierre por partido (change cierre-por-partido, specs match-schedule y
-- predictions): cada partido acepta pronósticos hasta una hora antes de su
-- kickoff. Reemplaza la regla por jornada (medianoche CDMX del día de la
-- jornada) y la excepción fechada de la jornada inaugural (migración 0004),
-- que queda cubierta por la regla general. DEBE coincidir con
-- CLOSE_BEFORE_KICKOFF_MS / isMatchOpen() en lib/domain/jornada.ts.
-- Firma intacta: las políticas RLS de predictions no cambian.

create or replace function public.is_match_open(mid bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.matches
    where id = mid
      and now() < kickoff_at - interval '1 hour'
  );
$$;
