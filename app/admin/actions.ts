"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireAdmin } from "@/lib/auth/guards";
import { toMxDate } from "@/lib/domain/jornada";
import {
  matchSchema,
  scoreSchema,
  userStatusSchema,
  whatsappSchema,
} from "@/lib/schemas";

export type AdminState = { ok?: boolean; error?: string };

async function admin() {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }
}

/** Primer mensaje de error del schema, como error general del formulario. */
function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Solicitud inválida.";
}

/** Activar / desactivar usuarios (spec admin-panel, account-activation). */
export async function setUserStatus(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const parsed = userStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await session.supabase
    .from("profiles")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.user_id)
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

  const parsed = scoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { match_id, home_goals, away_goals, finished } = parsed.data;

  // Sin checkbox el partido queda (o vuelve a) no finalizado: la reversa para
  // correcciones es el mismo gesto (spec live-match). Solo finalizados puntúan.
  const { error } = await session.supabase
    .from("matches")
    .update({
      home_goals,
      away_goals,
      finished_at: finished ? new Date().toISOString() : null,
    })
    .eq("id", match_id);
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

  const parsed = matchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { match_id, kickoff_local, ...fields } = parsed.data;

  // El admin captura hora CDMX; derivamos kickoff UTC y la jornada (CDMX)
  const kickoffAt = new Date(`${kickoff_local}:00-06:00`);
  const row = {
    ...fields,
    kickoff_at: kickoffAt.toISOString(),
    match_date: toMxDate(kickoffAt),
  };

  const supabase = session.supabase;
  const { error } = match_id
    ? await supabase.from("matches").update(row).eq("id", match_id)
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

  const parsed = whatsappSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await session.supabase
    .from("app_settings")
    .update({
      value: parsed.data.whatsapp_number,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "whatsapp_number");
  if (error) return { error: "No se pudo guardar el número." };

  revalidatePath("/admin/configuracion");
  return { ok: true };
}
