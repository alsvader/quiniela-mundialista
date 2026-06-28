import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth/guards";
import {
  getFaseActiva,
  getJornadas,
  getMyPredictions,
} from "@/lib/queries";
import { officialResult, scorePrediction, type Pick } from "@/lib/domain/scoring";
import { isMatchFinished } from "@/lib/domain/jornada";
import {
  filterJornadasByTemporada,
  isTemporada,
  temporadaLabel,
} from "@/lib/domain/temporada";
import { formatJornadaDate } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { SeasonTabs } from "@/components/season-tabs";
import { TeamFlag } from "@/components/team-flag";

export const metadata: Metadata = { title: "Mis puntos" };

const PICK_SHORT: Record<Pick, string> = { H: "L", D: "E", A: "V" };

export default async function MisPuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ temporada?: string }>;
}) {
  await requireSession();
  const { temporada: temporadaParam } = await searchParams;
  const [allJornadas, predictions, faseActiva] = await Promise.all([
    getJornadas(),
    getMyPredictions(),
    getFaseActiva(),
  ]);
  const temporada = isTemporada(temporadaParam) ? temporadaParam : faseActiva;
  const jornadas = filterJornadasByTemporada(allJornadas, temporada);

  const allMatches = [...jornadas.values()].flat();
  // solo los finalizados puntúan: un marcador parcial en vivo no cuenta aquí
  const scoredMatches = allMatches.filter((m) => isMatchFinished(m));
  const total = scoredMatches.reduce(
    (sum, m) =>
      sum +
      scorePrediction(
        predictions.get(m.id)?.pick ?? null,
        officialResult(temporada, m.home_goals, m.away_goals, m.avanza)
      ),
    0
  );

  return (
    <>
      <h1 className="heading-display text-3xl sm:text-4xl">Mis puntos</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Fase de {temporadaLabel(temporada).toLowerCase()}
      </p>

      <div className="mt-5">
        <Suspense>
          <SeasonTabs selected={temporada} basePath="/mis-puntos" />
        </Suspense>
      </div>

      <div className="glass mt-6 inline-flex items-baseline gap-4 px-8 py-6">
        <span className="font-mono text-6xl font-medium text-primary-container [text-shadow:0_0_24px_rgb(0_243_255/0.35)]">
          {total}
        </span>
        <div className="text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface">
            {total === 1 ? "punto" : "puntos"} acumulados
          </p>
          <p>
            {scoredMatches.length} de {allMatches.length} partidos finalizados
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {[...jornadas.entries()].map(([date, matches]) => {
          const withScore = matches.filter((m) => isMatchFinished(m));
          if (!withScore.length) return null;
          const jornadaPoints = withScore.reduce(
            (s, m) =>
              s +
              scorePrediction(
                predictions.get(m.id)?.pick ?? null,
                officialResult(temporada, m.home_goals, m.away_goals, m.avanza)
              ),
            0
          );

          return (
            <section key={date}>
              <header className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="heading-display text-lg">
                  {formatJornadaDate(date)}
                </h2>
                <Chip tone="primary">
                  {jornadaPoints}/{withScore.length} PTS
                </Chip>
              </header>
              <div className="glass overflow-x-auto p-1">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="label-data text-left text-on-surface-variant">
                      <th className="px-4 py-3 font-medium">Partido</th>
                      <th className="px-4 py-3 text-center font-medium">Marcador</th>
                      <th className="px-4 py-3 text-center font-medium">Resultado</th>
                      <th className="px-4 py-3 text-center font-medium">Tu pick</th>
                      <th className="px-4 py-3 text-right font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withScore.map((m) => {
                      const pick = predictions.get(m.id)?.pick ?? null;
                      const result = officialResult(
                        temporada,
                        m.home_goals,
                        m.away_goals,
                        m.avanza
                      );
                      const point = scorePrediction(pick, result);
                      const hit = point === 1;
                      return (
                        <tr
                          key={m.id}
                          className="border-t border-outline-variant/30 text-on-surface"
                        >
                          <td className="px-4 py-3 font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                              <TeamFlag code={m.home_code} />
                              {m.home_team}
                              <span className="text-on-surface-variant">–</span>
                              <TeamFlag code={m.away_code} />
                              {m.away_team}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-primary-fixed">
                            {m.home_goals}–{m.away_goals}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {result ? PICK_SHORT[result] : "—"}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {pick ? PICK_SHORT[pick] : "—"}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-medium ${
                              hit ? "text-tertiary-fixed" : "text-on-surface-variant"
                            }`}
                          >
                            {hit ? "✓ 1" : "0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        {scoredMatches.length === 0 && (
          <div className="glass max-w-prose p-6 text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface">
              Aún no hay partidos finalizados.
            </p>
            <p className="mt-1">
              Cuando el administrador dé por finalizados los partidos con su
              marcador, aquí verás tus aciertos y puntos por jornada.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
