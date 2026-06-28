import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFaseActiva, getMyParticipations } from "@/lib/queries";

/** Redirección raíz según sesión y rol (design.md D9). */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/registro");
  if (profile.role === "admin") redirect("/admin/usuarios");

  // Aviso de pago si la cuenta no participa en la fase activa (change
  // fase-eliminatoria-temporada): el gate ya no es profiles.status sino la
  // participación por temporada.
  if (profile.status !== "disabled") {
    const [faseActiva, participaciones] = await Promise.all([
      getFaseActiva(),
      getMyParticipations(),
    ]);
    if (!participaciones.has(faseActiva)) redirect("/partidos?aviso=pago");
  }
  redirect("/partidos");
}
