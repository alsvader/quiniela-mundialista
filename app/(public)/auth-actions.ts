"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

const ALIAS_RE = /^[A-Za-z0-9_.-]{3,20}$/;

function validateProfileFields(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const alias = String(formData.get("alias") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const fieldErrors: Record<string, string> = {};

  if (fullName.length < 3) fieldErrors.full_name = "Escribe tu nombre completo.";
  if (!ALIAS_RE.test(alias))
    fieldErrors.alias =
      "De 3 a 20 caracteres: letras, números, punto, guion o guion bajo.";
  if (!/^\d{10}$/.test(phone.replace(/\D/g, "")))
    fieldErrors.phone = "Escribe un teléfono de 10 dígitos.";

  return { fullName, alias, phone: phone.replace(/\D/g, ""), fieldErrors };
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const { fullName, alias, phone, fieldErrors } = validateProfileFields(formData);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    fieldErrors.email = "Escribe un correo válido.";
  if (password.length < 8)
    fieldErrors.password = "Mínimo 8 caracteres.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();

  const { data: available } = await supabase.rpc("alias_is_available", {
    candidate: alias,
  });
  if (available === false)
    return { fieldErrors: { alias: "Ese alias ya está tomado." } };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.code === "user_already_exists")
      return { fieldErrors: { email: "Ese correo ya está registrado." } };
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }
  if (!data.user) return { error: "No se pudo crear la cuenta. Intenta de nuevo." };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    alias,
    phone,
  });
  if (profileError) {
    // Carrera de alias u otro fallo: la cuenta Auth existe, el perfil no.
    // El usuario podrá completarlo al volver a entrar (ver /registro).
    if (profileError.code === "23505")
      return { fieldErrors: { alias: "Ese alias ya está tomado." } };
    return { error: "Cuenta creada pero falta tu perfil. Inicia sesión para completarlo." };
  }

  redirect("/");
}

/** Completa el perfil cuando la cuenta Auth existe pero el perfil no (carrera de alias). */
export async function completeProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { fullName, alias, phone, fieldErrors } = validateProfileFields(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    alias,
    phone,
  });
  if (error) {
    if (error.code === "23505")
      return { fieldErrors: { alias: "Ese alias ya está tomado." } };
    return { error: "No se pudo guardar tu perfil. Intenta de nuevo." };
  }

  redirect("/");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
