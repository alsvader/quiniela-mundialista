import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guards";
import { getJornadas } from "@/lib/queries";
import { isMatchFinished, isMatchLive } from "@/lib/domain/jornada";
import { temporadaDeFase } from "@/lib/domain/temporada";
import {
  filterJornadasByDays,
  resolveSelectedDays,
  todayInMexicoCity,
} from "@/lib/domain/day-filter";
import { formatDayChip, formatJornadaDate, formatKickoffTime } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { DayFilter } from "@/components/day-filter";
import { TeamFlag } from "@/components/team-flag";
import { ScoreForm } from "./score-form";

export const metadata: Metadata = { title: "Partidos · Admin" };

/**
 * Umbral del recordatorio "falta finalizar": kickoff + 2.5 h (90' + descanso
 * + agregado). Solo avisa al admin; jamás finaliza ni afecta puntos
 * (spec admin-panel, "el aviso no decide").
 */
const FINISH_REMINDER_MS = 2.5 * 60 * 60 * 1000;

export default async function AdminPartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  await requireAdminPage();
  const { dia } = await searchParams;
  const jornadas = await getJornadas();

  // Filtro por día (spec match-schedule): misma tira que el participante; "hoy"
  // y el default se resuelven en servidor (CDMX). Admin no tiene filtro de equipo.
  const matchDates = [...jornadas.keys()];
  const today = todayInMexicoCity();
  const selectedDays = resolveSelectedDays(dia, matchDates, today);
  const dayOptions = matchDates.map((date) => ({ date, ...formatDayChip(date) }));
  const filteredJornadas = filterJornadasByDays(jornadas, selectedDays);

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
        Puedes capturar el marcador durante el partido (se muestra como “En
        vivo” a los participantes) y marcar “Finalizado” al terminar: solo los
        partidos finalizados suman puntos. Corregir un marcador recalcula todo.
      </p>

      <div className="mt-8">
        <Suspense>
          <DayFilter
            days={dayOptions}
            today={today}
            selected={selectedDays}
            basePath="/admin/partidos"
          />
        </Suspense>
      </div>

      <div className="mt-8 flex flex-col gap-10">
        {[...filteredJornadas.entries()].map(([date, matches]) => (
          <section key={date}>
            <h2 className="heading-display mb-3 text-lg">
              {formatJornadaDate(date)}
            </h2>
            <ul className="flex list-none flex-col gap-2 p-0">
              {matches.map((m) => {
                const live = isMatchLive(m);
                const needsFinish =
                  !isMatchFinished(m) &&
                  Date.now() - new Date(m.kickoff_at).getTime() >
                    FINISH_REMINDER_MS;
                return (
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
                  <span className="flex min-w-48 flex-1 items-center gap-1.5 text-sm font-semibold text-on-surface">
                    <TeamFlag code={m.home_code} />
                    {m.home_team}
                    <span className="text-on-surface-variant">–</span>
                    <TeamFlag code={m.away_code} />
                    {m.away_team}
                  </span>
                  {isMatchFinished(m) && <Chip tone="secondary">Final</Chip>}
                  {live && !needsFinish && <Chip tone="primary">En vivo</Chip>}
                  {needsFinish && (
                    <Chip tone="error">¿Terminó? Falta finalizar</Chip>
                  )}
                  <ScoreForm
                    matchId={m.id}
                    homeGoals={m.home_goals}
                    awayGoals={m.away_goals}
                    finished={isMatchFinished(m)}
                    eliminatoria={temporadaDeFase(m.phase) === "eliminatoria"}
                    homeTeam={m.home_team}
                    awayTeam={m.away_team}
                    avanza={m.avanza === "D" ? null : m.avanza}
                  />
                  <Link
                    href={`/admin/partidos/${m.id}`}
                    className="text-sm font-semibold text-primary-fixed-dim hover:text-primary-fixed"
                  >
                    Editar
                  </Link>
                </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
