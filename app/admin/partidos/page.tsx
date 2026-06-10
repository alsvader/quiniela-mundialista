import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guards";
import { getJornadas } from "@/lib/queries";
import { formatJornadaDate, formatKickoffTime } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { ScoreForm } from "./score-form";

export const metadata: Metadata = { title: "Partidos · Admin" };

export default async function AdminPartidosPage() {
  await requireAdminPage();
  const jornadas = await getJornadas();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-display text-3xl">Partidos</h1>
        <Link
          href="/admin/partidos/nuevo"
          className="inline-flex h-11 items-center rounded bg-primary-container px-5 text-sm font-semibold text-on-primary-fixed transition-shadow duration-200 hover:shadow-(--shadow-glow-primary)"
        >
          Nuevo partido
        </Link>
      </header>
      <p className="mt-2 max-w-prose text-sm text-on-surface-variant">
        Captura el marcador final de cada partido; el resultado oficial, los
        puntos y el ranking se recalculan solos. Corregir un marcador también
        recalcula todo.
      </p>

      <div className="mt-8 flex flex-col gap-10">
        {[...jornadas.entries()].map(([date, matches]) => (
          <section key={date}>
            <h2 className="heading-display mb-3 text-lg">
              {formatJornadaDate(date)}
            </h2>
            <ul className="flex list-none flex-col gap-2 p-0">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="glass flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3"
                >
                  <span className="label-data w-14 shrink-0 text-on-surface-variant">
                    #{m.id} · {m.group_label ? `G-${m.group_label}` : "—"}
                  </span>
                  <span className="label-data w-12 shrink-0 text-on-surface-variant">
                    {formatKickoffTime(m.kickoff_at)} h
                  </span>
                  <span className="min-w-48 flex-1 text-sm font-semibold text-on-surface">
                    {m.home_team} – {m.away_team}
                  </span>
                  {m.home_goals !== null && <Chip tone="secondary">Final</Chip>}
                  <ScoreForm
                    matchId={m.id}
                    homeGoals={m.home_goals}
                    awayGoals={m.away_goals}
                  />
                  <Link
                    href={`/admin/partidos/${m.id}`}
                    className="text-sm font-semibold text-primary-fixed-dim hover:text-primary-fixed"
                  >
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
