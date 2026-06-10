import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction } from "@/lib/types";

/** Partidos de fase de grupos agrupados por jornada (match_date asc, kickoff asc). */
export async function getJornadas(): Promise<Map<string, Match[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true })
    .order("kickoff_at", { ascending: true });
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

export interface RankingRow {
  alias: string;
  points: number;
}

export async function getRanking(): Promise<RankingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ranking").select("*");
  if (error) throw new Error(`Error cargando ranking: ${error.message}`);
  return (data ?? []) as RankingRow[];
}
