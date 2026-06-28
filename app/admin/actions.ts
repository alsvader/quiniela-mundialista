"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireAdmin } from "@/lib/auth/guards";
import { toMxDate } from "@/lib/domain/jornada";
import { temporadaDeFase } from "@/lib/domain/temporada";
import type { MatchPhase } from "@/lib/types";
import {
  faseActivaSchema,
  matchSchema,
  paymentInfoSchema,
  scoreSchema,
  seasonParticipationSchema,
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

/**
 * Confirmar o retirar la participación de un usuario en una temporada
 * (change fase-eliminatoria-temporada, specs account-activation/admin-panel).
 * `active` = pago confirmado; `disabled` = participación retirada (reversible,
 * conserva pronósticos). Upsert idempotente de la fila (user_id, temporada).
 */
export async function setSeasonParticipation(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const parsed = seasonParticipationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { user_id, temporada, status } = parsed.data;

  const { error } = await session.supabase
    .from("participaciones")
    .upsert(
      { user_id, temporada, status },
      { onConflict: "user_id,temporada" }
    );
  if (error) return { error: "No se pudo actualizar la participación." };

  // La participación mueve bolsa y ranking (derivados) de esa temporada.
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
  revalidatePath("/partidos");
  return { ok: true };
}

/** Mover la temporada activa (puntero de onboarding: pestaña por defecto y CTA). */
export async function setFaseActiva(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const parsed = faseActivaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await session.supabase
    .from("app_settings")
    .update({ value: parsed.data.fase_activa, updated_at: new Date().toISOString() })
    .eq("key", "fase_activa");
  if (error) return { error: "No se pudo cambiar la temporada activa." };

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/configuracion");
  revalidatePath("/partidos");
  revalidatePath("/ranking");
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
  const { match_id, home_goals, away_goals, finished, avanza } = parsed.data;

  // La temporada se resuelve desde la fase real del partido (no del cliente).
  const { data: match, error: matchError } = await session.supabase
    .from("matches")
    .select("phase")
    .eq("id", match_id)
    .maybeSingle<{ phase: MatchPhase }>();
  if (matchError || !match) return { error: "No se pudo cargar el partido." };

  // En eliminatoria el resultado oficial es "quién avanza": con goles distintos
  // se deduce del marcador (y no puede contradecir al admin); con empate lo
  // elige el admin (penales). En grupos siempre queda null (change
  // eliminatoria-quien-avanza). El CHECK de BD es la última línea.
  let avanzaToSave: "H" | "A" | null = null;
  if (temporadaDeFase(match.phase) === "eliminatoria") {
    if (home_goals !== away_goals) {
      const deduced = home_goals > away_goals ? "H" : "A";
      if (avanza && avanza !== deduced) {
        return { error: "Quién avanza no coincide con el marcador capturado." };
      }
      avanzaToSave = deduced;
    } else {
      avanzaToSave = avanza ?? null; // empate: ganador por penales lo pone el admin
    }
    if (finished && !avanzaToSave) {
      return {
        error: "Define quién avanza (penales) para finalizar este partido.",
      };
    }
  }

  // Sin checkbox el partido queda (o vuelve a) no finalizado: la reversa para
  // correcciones es el mismo gesto (spec live-match). Solo finalizados puntúan.
  const { error } = await session.supabase
    .from("matches")
    .update({
      home_goals,
      away_goals,
      avanza: avanzaToSave,
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

/** Datos de transferencia para el recordatorio de pago (spec admin-panel). */
export async function savePaymentInfo(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const session = await admin();
  if (!session) return { error: "Operación reservada al administrador." };

  const parsed = paymentInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  // RLS de app_settings solo permite UPDATE al admin (no INSERT): las llaves ya
  // existen por seed/migración, así que actualizamos cada una como saveWhatsapp.
  const now = new Date().toISOString();
  const entries: [string, string][] = [
    ["bank_name", parsed.data.bank_name],
    ["bank_clabe", parsed.data.bank_clabe],
    ["bank_holder", parsed.data.bank_holder],
    ["payment_amount", parsed.data.payment_amount],
  ];
  const results = await Promise.all(
    entries.map(([key, value]) =>
      session.supabase
        .from("app_settings")
        .update({ value, updated_at: now })
        .eq("key", key)
    )
  );
  if (results.some((r) => r.error)) {
    return { error: "No se pudieron guardar los datos de pago." };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
