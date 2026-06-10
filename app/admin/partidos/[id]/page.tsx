import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/guards";
import { TIMEZONE } from "@/lib/domain/jornada";
import type { Match } from "@/lib/types";
import { MatchForm } from "../match-form";

export const metadata: Metadata = { title: "Editar partido · Admin" };

/** kickoff UTC → "YYYY-MM-DDTHH:mm" en CDMX para <input type=datetime-local> */
function toDatetimeLocal(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

export default async function EditarPartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle<Match>();
  if (!match) notFound();

  return (
    <>
      <h1 className="heading-display text-3xl">
        Editar partido #{match.id}
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        {match.home_team} – {match.away_team}
      </p>
      <MatchForm match={match} kickoffLocal={toDatetimeLocal(match.kickoff_at)} />
    </>
  );
}
