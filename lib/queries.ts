import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction } from "@/lib/types";
import { toTemporada, type Temporada } from "@/lib/domain/temporada";

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
