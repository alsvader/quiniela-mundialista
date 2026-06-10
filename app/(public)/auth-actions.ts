"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsOf,
  profileFieldsSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/schemas";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const { email, password, full_name, alias, phone } = parsed.data;

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
    full_name,
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
  const parsed = profileFieldsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    ...parsed.data,
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
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Correo o contraseña incorrectos." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
