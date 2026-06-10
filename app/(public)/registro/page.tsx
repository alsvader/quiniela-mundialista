import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Regístrate" };

export default async function RegistroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cuenta Auth sin perfil (falló el alias en el registro): solo completar perfil.
  let completing = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) redirect("/");
    completing = true;
  }

  return (
    <div className="glass mt-[6vh] w-full max-w-sm p-8">
      <h1 className="heading-display text-2xl">
        {completing ? "Completa tu perfil" : "Regístrate"}
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        {completing
          ? "Tu cuenta existe pero falta tu perfil. Elige un alias para continuar."
          : "Crea tu cuenta para entrar a la quiniela. Tu alias será tu nombre público en el ranking."}
      </p>
      <RegisterForm completing={completing} />
      {!completing && (
        <p className="mt-6 text-sm text-on-surface-variant">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-fixed-dim hover:text-primary-fixed"
          >
            Inicia sesión
          </Link>
        </p>
      )}
    </div>
  );
}
