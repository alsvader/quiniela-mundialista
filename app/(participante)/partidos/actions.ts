"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireActiveUser } from "@/lib/auth/guards";
import { isJornadaOpen } from "@/lib/domain/jornada";
import type { Match } from "@/lib/types";

export type SaveJornadaState = {
  ok?: boolean;
  savedAt?: string;
  error?: string;
  missing?: string[];
};

const VALID_PICKS = new Set(["H", "D", "A"]);

/**
 * Guarda la jornada completa (spec predictions): exige cuenta activa, jornada
 * abierta y un pick por CADA partido del día. Upsert idempotente; RLS es la
 * segunda línea de defensa.
 */
export async function saveJornada(
  _prev: SaveJornadaState,
  formData: FormData
): Promise<SaveJornadaState> {
  let session;
  try {
    session = await requireActiveUser();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const matchDate = String(formData.get("match_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate))
    return { error: "Jornada inválida." };

  if (!isJornadaOpen(matchDate))
    return {
      error:
        "Esta jornada ya cerró (23:59 del día anterior). Tus pronósticos quedaron como estaban.",
    };

  const { supabase, user } = session;
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, home_team, away_team")
    .eq("match_date", matchDate);
  if (matchesError || !matches?.length)
    return { error: "No se pudieron cargar los partidos de la jornada." };

  const missing: string[] = [];
  const rows: { user_id: string; match_id: number; pick: string; updated_at: string }[] = [];
  const now = new Date().toISOString();

  for (const match of matches as Pick<Match, "id" | "home_team" | "away_team">[]) {
    const pick = String(formData.get(`pick-${match.id}`) ?? "");
    if (!VALID_PICKS.has(pick)) {
      missing.push(`${match.home_team} vs ${match.away_team}`);
      continue;
    }
    rows.push({ user_id: user.id, match_id: match.id, pick, updated_at: now });
  }

  if (missing.length)
    return {
      error: "Para guardar la jornada, pronostica todos sus partidos. Falta:",
      missing,
    };

  const { error: upsertError } = await supabase.from("predictions").upsert(rows);
  if (upsertError)
    return {
      error:
        "No se pudo guardar. Verifica que tu cuenta esté activa y la jornada abierta.",
    };

  revalidatePath("/partidos");
  revalidatePath("/mis-puntos");
  return { ok: true, savedAt: now };
}
