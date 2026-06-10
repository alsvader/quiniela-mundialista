import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth/guards";
import { getJornadas, getMyPredictions, getWhatsappNumber } from "@/lib/queries";
import { isJornadaOpen } from "@/lib/domain/jornada";
import { buildWhatsappLink } from "@/lib/whatsapp";
import {
  formatDeadline,
  formatJornadaDate,
  formatKickoffTime,
  formatDateTime,
} from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { JornadaForm, type MatchForForm } from "./jornada-form";
import { ClosedMatchCard } from "./closed-match-card";
import { PendingModal } from "../pending-modal";

export const metadata: Metadata = { title: "Partidos" };

export default async function PartidosPage() {
  const { user, profile } = await requireSession();
  const [jornadas, predictions] = await Promise.all([
    getJornadas(),
    getMyPredictions(),
  ]);

  const canEdit = profile.status === "active";

  let modal: React.ReactNode = null;
  if (profile.status === "pending") {
    const number = await getWhatsappNumber();
    const next = [...jornadas.keys()].find((d) => isJornadaOpen(d)) ?? null;
    modal = (
      <Suspense>
        <PendingModal
          deadline={next ? formatDeadline(next) : null}
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
      <h1 className="heading-display text-3xl sm:text-4xl">Partidos</h1>
      <p className="mt-2 max-w-prose text-sm text-on-surface-variant">
        Pronostica el resultado de cada partido: local (L), empate (E) o
        visitante (V). Cada jornada cierra a las 23:59 del día anterior y se
        guarda completa.
      </p>

      <div className="mt-8 flex flex-col gap-12">
        {[...jornadas.entries()].map(([date, matches]) => {
          const open = isJornadaOpen(date);
          const lastModified = matches
            .map((m) => predictions.get(m.id)?.updated_at)
            .filter(Boolean)
            .sort()
            .at(-1);

          return (
            <section key={date} aria-label={`Jornada del ${formatJornadaDate(date)}`}>
              <header className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="heading-display text-lg sm:text-xl">
                  {formatJornadaDate(date)}
                </h2>
                {open ? (
                  <Chip tone="primary">Abierta · cierra {formatDeadline(date)}</Chip>
                ) : (
                  <Chip tone="neutral">Cerrada</Chip>
                )}
              </header>

              {open && canEdit ? (
                <JornadaForm
                  matchDate={date}
                  matches={matches.map(
                    (m): MatchForForm => ({
                      id: m.id,
                      home: m.home_team,
                      away: m.away_team,
                      homeCode: m.home_code,
                      awayCode: m.away_code,
                      group: m.group_label,
                      time: formatKickoffTime(m.kickoff_at),
                      pick: predictions.get(m.id)?.pick ?? null,
                    })
                  )}
                  lastModified={
                    lastModified ? formatDateTime(lastModified) : null
                  }
                />
              ) : (
                <>
                  {open && !canEdit && (
                    <p className="mb-3 text-sm font-semibold text-secondary-fixed">
                      {profile.status === "pending"
                        ? "Activa tu cuenta para pronosticar esta jornada."
                        : "Tu cuenta está desactivada: no puedes pronosticar."}
                    </p>
                  )}
                  <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 p-0">
                    {matches.map((m) => (
                      <ClosedMatchCard
                        key={m.id}
                        match={m}
                        pick={predictions.get(m.id)?.pick ?? null}
                        time={formatKickoffTime(m.kickoff_at)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
