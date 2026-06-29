-- Recordatorio automático de eliminatoria por SMS (change
-- sms-recordatorio-eliminatoria, spec sms-notifications).
--
-- Ledger POR-PARTIDO del envío del aviso: una fila significa "el aviso de este
-- partido ya se envió" (idempotencia, design D4). La unidad de fallo del
-- proveedor es el LOTE (SMS Masivos envía bulk y devuelve un solo request_id),
-- por eso el registro es por partido, no por usuario. El endpoint del cron usa
-- la service role (bypassa RLS): no se exponen políticas de cliente.

-- ============ 1 · Tabla ledger ============

create table public.sms_recordatorios (
  match_id bigint primary key references public.matches (id) on delete cascade,
  -- id que devuelve SMS Masivos al aceptar el lote; null si no hubo destinatarios
  request_id text,
  -- cuántos números entraron en el lote (0 = partido sin destinatarios válidos)
  recipients integer not null default 0,
  sent_at timestamptz not null default now()
);

-- RLS habilitada SIN políticas: ningún rol de cliente (anon/authenticated) puede
-- leer ni escribir. Solo la service role del endpoint del cron accede (bypassa
-- RLS); el grant explícito evita depender de los defaults del proyecto.
alter table public.sms_recordatorios enable row level security;
grant select, insert on table public.sms_recordatorios to service_role;

-- ============ 2 · Padrón de destinatarios de eliminatoria ============

-- Teléfonos de los participantes elegibles para el aviso de eliminatoria:
-- participación 'active' en 'eliminatoria' y cuenta no 'disabled' (mismo criterio
-- que public.participa_en). security definer para leer profiles/participaciones
-- sin depender de la RLS del llamante. La normalización a 10 dígitos y el
-- descarte de teléfonos inválidos se hacen en el cliente (lib/sms.ts).
create or replace function public.eliminatoria_recipients()
returns table (phone text)
language sql
security definer
set search_path = ''
stable
as $$
  select pr.phone
  from public.participaciones pa
  join public.profiles pr on pr.id = pa.user_id
  where pa.temporada = 'eliminatoria'
    and pa.status = 'active'
    and pr.status <> 'disabled'
    and pr.role = 'user'
    and coalesce(pr.phone, '') <> '';
$$;

-- Solo la service role la invoca (endpoint del cron); se revoca de public/anon/
-- authenticated para no exponer teléfonos y se concede explícitamente a service_role
-- (al quitar el grant de public, un rol no-superusuario se queda sin execute).
revoke all on function public.eliminatoria_recipients() from public, anon, authenticated;
grant execute on function public.eliminatoria_recipients() to service_role;
