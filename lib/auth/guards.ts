import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Guards de autorización (design.md D3). Siempre validan contra la tabla
 * `profiles` en servidor; jamás contra metadata controlada por el cliente.
 */

export class AuthorizationError extends Error {}

/** Sesión + perfil, o null si no hay sesión válida. */
export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  return { supabase, user, profile };
}

/** Para páginas/layouts: redirige a /login si no hay sesión. */
export async function requireSession() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  return session;
}

/**
 * Para Server Actions de pronósticos (change fase-eliminatoria-temporada): el
 * permiso de pronosticar ya NO se deriva del estado global de la cuenta sino de
 * la participación por temporada (la valida `savePick` contra `participaciones`,
 * con la RLS como última línea). Aquí solo exigimos sesión y que la cuenta no
 * esté `disabled` (baneo de toda la cuenta). Una cuenta `pending` puede haber
 * pagado una temporada (p. ej. quien entra directo a la eliminatoria).
 */
export async function requireEnabledAccount() {
  const session = await getSessionProfile();
  if (!session) {
    throw new AuthorizationError("Inicia sesión para continuar.");
  }
  if (session.profile.status === "disabled") {
    throw new AuthorizationError(
      "Tu cuenta está desactivada. Contacta al administrador."
    );
  }
  return session;
}

/** Para el panel y actions administrativas: exige rol admin. */
export async function requireAdmin() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== "admin") {
    throw new AuthorizationError("Operación reservada al administrador.");
  }
  return session;
}

/** Variante de requireAdmin para layouts: redirige en lugar de lanzar. */
export async function requireAdminPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect("/partidos");
  return session;
}
