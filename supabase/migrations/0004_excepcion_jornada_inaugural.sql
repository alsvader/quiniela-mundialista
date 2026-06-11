-- Excepción fechada al cierre de jornada (spec match-schedule, change
-- extender-cierre-jornada-inaugural): la jornada del 2026-06-11 acepta
-- pronósticos hasta las 12:00 America/Mexico_City del mismo 11 de junio
-- (una hora antes del kickoff inaugural). Las demás jornadas conservan la
-- regla general. DEBE coincidir con JORNADA_DEADLINE_EXCEPTIONS en
-- lib/domain/jornada.ts. Inerte después de su fecha.

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
      and now() < case match_date
        -- jornada inaugural: cierra 2026-06-11 12:00 CDMX (18:00 UTC)
        when date '2026-06-11' then timestamptz '2026-06-11 18:00:00+00'
        -- regla general: medianoche CDMX del día de la jornada (UTC-6 fijo)
        else (match_date::timestamp at time zone 'America/Mexico_City')
      end
  );
$$;
