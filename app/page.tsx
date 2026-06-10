import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  if (profile.status === "pending") redirect("/partidos?aviso=pago");
  redirect("/partidos");
}
