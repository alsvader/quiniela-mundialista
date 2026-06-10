import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { getWhatsappNumber } from "@/lib/queries";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(public)/auth-actions";
import { PendingBanner } from "./pending-banner";
import { TIMEZONE } from "@/lib/domain/jornada";

async function nextOpenJornada(): Promise<string | null> {
  const supabase = await createClient();
  const todayMx = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
  }).format(new Date());
  const { data } = await supabase
    .from("matches")
    .select("match_date")
    .gt("match_date", todayMx)
    .order("match_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.match_date ?? null;
}

export default async function ParticipanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireSession();

  let whatsappLink: string | null = null;
  let nextJornada: string | null = null;
  if (profile.status === "pending") {
    const [number, jornada] = await Promise.all([
      getWhatsappNumber(),
      nextOpenJornada(),
    ]);
    nextJornada = jornada;
    whatsappLink = buildWhatsappLink(number, {
      name: profile.full_name,
      email: user.email ?? "",
      phone: profile.phone,
    });
  }

  const navLink =
    "rounded px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors duration-150";

  return (
    <div className="flex min-h-dvh flex-col">
      {profile.status === "pending" && (
        <PendingBanner whatsappLink={whatsappLink} nextJornada={nextJornada} />
      )}
      {profile.status === "disabled" && (
        <div
          role="status"
          className="bg-error-container/60 px-5 py-2.5 text-center text-sm font-semibold text-on-error-container"
        >
          Tu cuenta está desactivada: no puedes guardar pronósticos ni apareces
          en el ranking. Contacta al administrador.
        </div>
      )}
      <header className="sticky top-0 z-(--z-sticky) border-b border-outline-variant/40 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-5 py-3">
          <Link
            href="/partidos"
            className="heading-display shrink-0 text-base text-on-surface no-underline"
          >
            Quiniela{" "}
            <span className="text-primary-fixed-dim max-sm:hidden">
              Mundialista
            </span>
          </Link>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap">
            <Link href="/partidos" className={navLink}>
              Partidos
            </Link>
            <Link href="/mis-puntos" className={navLink}>
              Mis puntos
            </Link>
            <Link href="/ranking" className={navLink}>
              Ranking
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm text-on-surface-variant/80 hover:text-on-surface transition-colors duration-150"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-8">
        {children}
      </main>
    </div>
  );
}
