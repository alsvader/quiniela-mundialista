import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth/guards";
import {
  getActiveParticipantCount,
  getJornadas,
  getMyPredictions,
  getWhatsappNumber,
} from "@/lib/queries";
import { isMatchLive, isMatchOpen } from "@/lib/domain/jornada";
import { prizePool } from "@/lib/domain/prize";
import { PrizePoolCard } from "@/components/prize-pool-card";
import { LiveMatchCard } from "./live-match-card";
import { LiveRefresher } from "./live-refresher";
import { buildWhatsappLink } from "@/lib/whatsapp";
import {
  formatDeadline,
  formatDeadlineTime,
  formatJornadaDate,
  formatKickoffTime,
  formatDateTime,
} from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { MatchPickCard, type MatchForCard } from "./match-pick-card";
import { ClosedMatchCard } from "./closed-match-card";
import { PendingModal } from "../pending-modal";

export const metadata: Metadata = { title: "Partidos" };

export default async function PartidosPage() {
  const { user, profile } = await requireSession();
  const [jornadas, predictions, activeCount] = await Promise.all([
    getJornadas(),
    getMyPredictions(),
    getActiveParticipantCount(),
  ]);

  const canEdit = profile.status === "active";

  // En vivo = ya arrancó y el admin no lo ha finalizado (spec live-match).
  // getJornadas ordena por fecha, kickoff e id: orden estable en simultáneos.
  const liveMatches = [...jornadas.values()].flat().filter((m) => isMatchLive(m));

  let modal: React.ReactNode = null;
  if (profile.status === "pending") {
    const number = await getWhatsappNumber();
    // próximo partido aún abierto (getJornadas ordena por fecha y kickoff)
    const next = [...jornadas.values()]
      .flat()
      .find((m) => isMatchOpen(m.kickoff_at));
    modal = (
      <Suspense>
        <PendingModal
          deadline={next ? formatDeadline(next.kickoff_at) : null}
          whatsappLink={buildWhatsappLink(number, {
            name: profile.full_name,
            email: user.email ?? "",
            phone: profile.phone,
          })}
        />
      </Suspense>
    );
  }

  return (
    <>
      {modal}
      {liveMatches.length > 0 && <LiveRefresher />}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="heading-display text-3xl sm:text-4xl">Partidos</h1>
          <p className="mt-2 max-w-prose text-sm text-on-surface-variant">
            Pronostica el resultado de cada partido: local (L), empate (E) o
            visitante (V). Cada partido se guarda por separado y cierra una
            hora antes de su inicio.
          </p>
        </div>
        {/* un solo partido en vivo: la card vive entre el título y la bolsa */}
        {liveMatches.length === 1 && <LiveMatchCard match={liveMatches[0]} />}
        <PrizePoolCard pool={prizePool(activeCount)} />
      </header>

      {/* simultáneos (tercera jornada de grupo): fila propia antes del listado */}
      {liveMatches.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {liveMatches.map((m) => (
            <LiveMatchCard key={m.id} match={m} />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-12">
        {[...jornadas.entries()].map(([date, matches]) => {
          const openCount = matches.filter((m) =>
            isMatchOpen(m.kickoff_at)
          ).length;

          return (
            <section key={date} aria-label={`Jornada del ${formatJornadaDate(date)}`}>
              <header className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="heading-display text-lg sm:text-xl">
                  {formatJornadaDate(date)}
                </h2>
                {openCount === 0 ? (
                  <Chip tone="neutral">Cerrada</Chip>
                ) : openCount === matches.length ? (
                  <Chip tone="primary">Abierta</Chip>
                ) : (
                  <Chip tone="primary">
                    {openCount} de {matches.length} abiertos
                  </Chip>
                )}
              </header>

              {openCount > 0 && !canEdit && (
                <p className="mb-3 text-sm font-semibold text-secondary-fixed">
                  {profile.status === "pending"
                    ? "Activa tu cuenta para pronosticar los partidos abiertos."
                    : "Tu cuenta está desactivada: no puedes pronosticar."}
                </p>
              )}
              <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 p-0">
                {matches.map((m) => {
                  const prediction = predictions.get(m.id);
                  if (canEdit && isMatchOpen(m.kickoff_at)) {
                    const match: MatchForCard = {
                      id: m.id,
                      home: m.home_team,
                      away: m.away_team,
                      homeCode: m.home_code,
                      awayCode: m.away_code,
                      group: m.group_label,
                      time: formatKickoffTime(m.kickoff_at),
                      closesAt: formatDeadlineTime(m.kickoff_at),
                      pick: prediction?.pick ?? null,
                      lastModified: prediction
                        ? formatDateTime(prediction.updated_at)
                        : null,
                    };
                    return <MatchPickCard key={m.id} match={match} />;
                  }
                  return (
                    <ClosedMatchCard
                      key={m.id}
                      match={m}
                      pick={prediction?.pick ?? null}
                      time={formatKickoffTime(m.kickoff_at)}
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
