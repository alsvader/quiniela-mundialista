"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireAdmin } from "@/lib/auth/guards";
import { toMxDate } from "@/lib/domain/jornada";
import type { MatchPhase } from "@/lib/types";

export type AdminState = { ok?: boolean; error?: string };

const PHASES: MatchPhase[] = [
  "group_stage",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

async function admin() {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }
}

/** Activar / desactivar usuarios (spec admin-panel, account-activation). */
export async function setUserStatus(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const userId = String(formData.get("user_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!userId || !["active", "disabled", "pending"].includes(status))
    return { error: "Solicitud inválida." };

  const { error } = await session.supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId)
    .eq("role", "user"); // el admin no se desactiva a sí mismo
  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Captura o corrección de marcador (spec admin-panel, scoring-ranking). */
export async function saveScore(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const matchId = Number(formData.get("match_id"));
  const home = Number(formData.get("home_goals"));
  const away = Number(formData.get("away_goals"));
  if (
    !Number.isInteger(matchId) ||
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0 ||
    home > 99 ||
    away > 99
  )
    return { error: "Marcador inválido: goles enteros de 0 a 99." };

  const { error } = await session.supabase
    .from("matches")
    .update({ home_goals: home, away_goals: away })
    .eq("id", matchId);
  if (error) return { error: "No se pudo guardar el marcador." };

  // Los puntos son derivados: basta revalidar las vistas que los muestran.
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
  revalidatePath("/partidos");
  revalidatePath("/mis-puntos");
  return { ok: true };
}

/** Crear o editar partido (spec admin-panel). El kickoff se captura en hora CDMX. */
export async function upsertMatch(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const idRaw = String(formData.get("match_id") ?? "");
  const phase = String(formData.get("phase") ?? "");
  const home = String(formData.get("home_team") ?? "").trim();
  const away = String(formData.get("away_team") ?? "").trim();
  const homeCode = String(formData.get("home_code") ?? "").trim().toLowerCase();
  const awayCode = String(formData.get("away_code") ?? "").trim().toLowerCase();
  const group = String(formData.get("group_label") ?? "").trim();
  const kickoffLocal = String(formData.get("kickoff_local") ?? "");

  if (!PHASES.includes(phase as MatchPhase)) return { error: "Fase inválida." };
  if (home.length < 2 || away.length < 2)
    return { error: "Escribe ambos equipos." };
  const CODE_RE = /^[a-z]{2}(-[a-z]{2,3})?$/; // iso alfa-2 o regional (gb-eng)
  if ((homeCode && !CODE_RE.test(homeCode)) || (awayCode && !CODE_RE.test(awayCode)))
    return { error: "Código de bandera inválido (ej. mx, za, gb-eng) o déjalo vacío." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(kickoffLocal))
    return { error: "Fecha y hora inválidas." };

  // El admin captura hora CDMX; derivamos kickoff UTC y la jornada (CDMX)
  const kickoffAt = new Date(`${kickoffLocal}:00-06:00`);
  const row = {
    phase,
    home_team: home,
    away_team: away,
    home_code: homeCode || null,
    away_code: awayCode || null,
    group_label: group || null,
    kickoff_at: kickoffAt.toISOString(),
    match_date: toMxDate(kickoffAt),
  };

  const supabase = session.supabase;
  const { error } = idRaw
    ? await supabase.from("matches").update(row).eq("id", Number(idRaw))
    : await supabase.from("matches").insert(row);
  if (error) return { error: "No se pudo guardar el partido." };

  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  redirect("/admin/partidos");
}

/** Configuración del número de WhatsApp (spec admin-panel). */
export async function saveWhatsapp(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const digits = String(formData.get("whatsapp_number") ?? "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15)
    return { error: "Escribe un número de 10 dígitos (o con código de país)." };

  const { error } = await session.supabase
    .from("app_settings")
    .update({ value: digits, updated_at: new Date().toISOString() })
    .eq("key", "whatsapp_number");
  if (error) return { error: "No se pudo guardar el número." };

  revalidatePath("/admin/configuracion");
  return { ok: true };
}
