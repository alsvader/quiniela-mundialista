import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/guards";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Inicia sesión" };

export default async function LoginPage() {
  const session = await getSessionProfile();
  if (session) redirect("/");

  return (
    <div className="glass mt-[8vh] w-full max-w-sm p-8">
      <h1 className="heading-display text-2xl">Inicia sesión</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Pronostica cada jornada del Mundial 2026 y compite en el ranking.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-on-surface-variant">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-primary-fixed-dim hover:text-primary-fixed"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
