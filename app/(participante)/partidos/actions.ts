"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireActiveUser } from "@/lib/auth/guards";
import { isMatchOpen } from "@/lib/domain/jornada";
import { matchIdSchema, pickSchema } from "@/lib/schemas";
import type { Pick } from "@/lib/domain/scoring";

export type SavePickState = {
  ok?: boolean;
  savedAt?: string;
  /** Eco del pick guardado: la UI lo usa para detectar cambios sin guardar. */
  savedPick?: Pick;
  error?: string;
};

/**
 * Guarda el pronóstico de UN partido (spec predictions, guardado por partido):
 * exige cuenta activa y partido abierto (kickoff − 1h, spec match-schedule).
 * Upsert idempotente de una fila; RLS es la segunda línea de defensa.
 */
export async function savePick(
  _prev: SavePickState,
  formData: FormData
): Promise<SavePickState> {
  let session;
  try {
    session = await requireActiveUser();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsedId = matchIdSchema.safeParse(formData.get("match_id"));
  if (!parsedId.success) return { error: "Partido inválido." };
  const parsedPick = pickSchema.safeParse(formData.get("pick"));
  if (!parsedPick.success)
    return { error: "Elige local, empate o visitante antes de guardar." };

  const { supabase, user } = session;
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_at")
    .eq("id", parsedId.data)
    .maybeSingle<{ id: number; kickoff_at: string }>();
  if (matchError || !match)
    return { error: "No se pudo cargar el partido. Intenta de nuevo." };

  if (!isMatchOpen(match.kickoff_at))
    return {
      error:
        "Este partido ya cerró (una hora antes del inicio). Tu pronóstico quedó como estaba.",
    };

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from("predictions").upsert({
    user_id: user.id,
    match_id: match.id,
    pick: parsedPick.data,
    updated_at: now,
  });
  if (upsertError)
    return {
      error:
        "No se pudo guardar. Verifica que tu cuenta esté activa y el partido abierto.",
    };

  revalidatePath("/partidos");
  revalidatePath("/mis-puntos");
  return { ok: true, savedAt: now, savedPick: parsedPick.data };
}
