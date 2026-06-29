import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Match, Prediction } from "@/lib/types";
import { toTemporada, type Temporada } from "@/lib/domain/temporada";
import { CLOSE_BEFORE_KICKOFF_MS } from "@/lib/domain/jornada";
import { smsWindowThresholds } from "@/lib/domain/sms-window";

/** Partidos de fase de grupos agrupados por jornada (match_date asc, kickoff asc). */
export async function getJornadas(): Promise<Map<string, Match[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true })
    .order("kickoff_at", { ascending: true })
    // desempate estable para simultáneos (cards en vivo no se reordenan)
    .order("id", { ascending: true });
  if (error) throw new Error(`Error cargando partidos: ${error.message}`);

  const jornadas = new Map<string, Match[]>();
  for (const match of (data ?? []) as Match[]) {
    const group = jornadas.get(match.match_date) ?? [];
    group.push(match);
    jornadas.set(match.match_date, group);
  }
  return jornadas;
}

/** Pronósticos del usuario autenticado, indexados por match_id. */
export async function getMyPredictions(): Promise<Map<number, Prediction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();
  // El filtro explícito importa: RLS deja al admin ver TODOS los pronósticos.
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);
  if (error) throw new Error(`Error cargando pronósticos: ${error.message}`);
  return new Map(((data ?? []) as Prediction[]).map((p) => [p.match_id, p]));
}

export async function getWhatsappNumber(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "whatsapp_number")
    .maybeSingle();
  return data?.value ?? "";
}

export interface PaymentInfo {
  bankName: string;
  clabe: string;
  holder: string;
  amount: string;
}

/**
 * Datos de transferencia para el recordatorio de pago (design.md D1).
 * Solo se consultan desde páginas admin (requireAdminPage); RLS limita la
 * escritura al admin y la lectura a sesiones autenticadas.
 */
export async function getPaymentInfo(): Promise<PaymentInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_clabe", "bank_holder", "payment_amount"]);
  const byKey = new Map(
    ((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
  return {
    bankName: byKey.get("bank_name") ?? "",
    clabe: byKey.get("bank_clabe") ?? "",
    holder: byKey.get("bank_holder") ?? "",
    amount: byKey.get("payment_amount") ?? "",
  };
}

export interface RankingRow {
  alias: string;
  points: number;
}

/** Ranking de una temporada (RPC `ranking(temp)`, security definer). */
export async function getRanking(temporada: Temporada): Promise<RankingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ranking", { temp: temporada });
  if (error) throw new Error(`Error cargando ranking: ${error.message}`);
  return (data ?? []) as RankingRow[];
}

/**
 * Número de participantes activos de una temporada (base de la bolsa de esa
 * temporada, design.md D11 + change fase-eliminatoria-temporada). Se cuenta
 * sobre la función `ranking(temp)` (security definer): expone exactamente a los
 * participantes activos de la temporada y es legible para cualquier sesión, a
 * diferencia de `participaciones`/`profiles` que RLS restringe.
 */
export async function getActiveParticipantCount(
  temporada: Temporada
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.rpc(
    "ranking",
    { temp: temporada },
    { count: "exact", head: true }
  );
  if (error) throw new Error(`Error contando activos: ${error.message}`);
  return count ?? 0;
}

export interface NextMatch {
  home: string;
  away: string;
  kickoffAt: string;
}

/**
 * Próximo partido de eliminatoria todavía ABIERTO para pronosticar, para el
 * recordatorio admin → usuario (botón en /admin/usuarios). Eliminatoria = toda
 * fase distinta de `group_stage` (mismo criterio que `temporadaDeFase`). "Abierto"
 * = falta más de una hora para el kickoff (kickoff > now + 1h), coherente con
 * `CLOSE_BEFORE_KICKOFF_MS` e `isMatchOpen`, para no anunciar un partido cuyo cierre
 * ya pasó. Devuelve null si no hay ninguno (eliminatoria sin programar o concluida).
 */
export async function getNextEliminatoriaMatch(): Promise<NextMatch | null> {
  const supabase = await createClient();
  const openThresholdIso = new Date(
    Date.now() + CLOSE_BEFORE_KICKOFF_MS
  ).toISOString();
  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team, kickoff_at")
    .neq("phase", "group_stage")
    .gt("kickoff_at", openThresholdIso)
    .order("kickoff_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Error cargando próximo partido: ${error.message}`);
  if (!data) return null;
  return {
    home: data.home_team,
    away: data.away_team,
    kickoffAt: data.kickoff_at,
  };
}

// ---------- Recordatorio automático de eliminatoria por SMS ----------
// Acceso de datos del endpoint del cron (app/api/cron/sms-eliminatoria). Usa la
// service role (createAdminClient): no hay sesión de usuario y debe leer
// teléfonos y escribir el ledger saltándose RLS. NO llamar desde código de
// usuario; estas funciones confían en que el endpoint ya validó CRON_SECRET.

export interface EliminatoriaMatchForSms {
  id: number;
  home: string;
  away: string;
  kickoffAt: string;
}

/**
 * Partidos de eliminatoria (phase != group_stage) dentro de la ventana de aviso
 * (kickoff − 2h ≤ now < kickoff − 1h, design D3) que AÚN no tienen registro en
 * el ledger `sms_recordatorios`. Es la lista de pendientes de notificar de esta
 * corrida; idempotente entre ticks.
 */
export async function getEliminatoriaMatchesPendingSms(
  now: Date = new Date()
): Promise<EliminatoriaMatchForSms[]> {
  const supabase = createAdminClient();
  const { closeThresholdIso, noticeThresholdIso } = smsWindowThresholds(now);

  const { data, error } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .neq("phase", "group_stage")
    // kickoff > now + 1h ⇒ sigue abierto ; kickoff ≤ now + 2h ⇒ ya entró la ventana
    .gt("kickoff_at", closeThresholdIso)
    .lte("kickoff_at", noticeThresholdIso)
    .order("kickoff_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`Error cargando partidos para SMS: ${error.message}`);

  const candidates = (data ?? []) as {
    id: number;
    home_team: string;
    away_team: string;
    kickoff_at: string;
  }[];
  if (candidates.length === 0) return [];

  const { data: sentRows, error: sentError } = await supabase
    .from("sms_recordatorios")
    .select("match_id")
    .in(
      "match_id",
      candidates.map((m) => m.id)
    );
  if (sentError) throw new Error(`Error leyendo ledger SMS: ${sentError.message}`);
  const sent = new Set((sentRows ?? []).map((r) => (r as { match_id: number }).match_id));

  return candidates
    .filter((m) => !sent.has(m.id))
    .map((m) => ({
      id: m.id,
      home: m.home_team,
      away: m.away_team,
      kickoffAt: m.kickoff_at,
    }));
}

/**
 * Teléfonos (sin normalizar) de los participantes elegibles del aviso de
 * eliminatoria: participación `active` en `eliminatoria` y cuenta no `disabled`.
 * Vía la función `eliminatoria_recipients()` (security definer).
 */
export async function getEliminatoriaSmsPhones(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("eliminatoria_recipients");
  if (error) throw new Error(`Error cargando destinatarios SMS: ${error.message}`);
  return ((data ?? []) as { phone: string }[]).map((r) => r.phone);
}

/**
 * Marca el partido como atendido en el ledger (idempotencia, design D4). Se
 * escribe SOLO tras aceptar el lote (o cuando no había destinatarios válidos,
 * con recipients = 0 y request_id null) para no reintentar indefinidamente.
 */
export async function recordSmsReminderSent(
  matchId: number,
  requestId: string | null,
  recipients: number
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sms_recordatorios")
    .insert({ match_id: matchId, request_id: requestId, recipients });
  if (error) throw new Error(`Error registrando envío SMS: ${error.message}`);
}

/** Temporada activa (puntero de onboarding); default seguro `grupos`. */
export async function getFaseActiva(): Promise<Temporada> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "fase_activa")
    .maybeSingle();
  return toTemporada(data?.value);
}

/**
 * Temporadas en las que participa (active) el usuario autenticado. RLS limita
 * la lectura de `participaciones` a las filas propias (o admin).
 */
export async function getMyParticipations(): Promise<Set<Temporada>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("participaciones")
    .select("temporada, status")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) throw new Error(`Error cargando participaciones: ${error.message}`);
  const set = new Set<Temporada>();
  for (const row of (data ?? []) as { temporada: string }[]) {
    set.add(toTemporada(row.temporada));
  }
  return set;
}
