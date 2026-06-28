import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getActiveParticipantCount,
  getFaseActiva,
  getRanking,
} from "@/lib/queries";
import { prizePool } from "@/lib/domain/prize";
import { RankingList } from "@/components/ranking-list";
import { PrizePoolCard } from "@/components/prize-pool-card";
import { SeasonTabs } from "@/components/season-tabs";
import { isTemporada, temporadaLabel } from "@/lib/domain/temporada";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Clasificación de la Quiniela Mundialista 2026: puntos por aciertos en cada fase.",
};

// Página pública y compartible: siempre datos frescos.
export const dynamic = "force-dynamic";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ temporada?: string }>;
}) {
  const { temporada: temporadaParam } = await searchParams;
  // Sin sesión, app_settings no es legible: cae a `grupos` salvo que la URL
  // pida explícitamente otra temporada (las tabs permiten cambiar).
  const faseActiva = await getFaseActiva();
  const temporada = isTemporada(temporadaParam) ? temporadaParam : faseActiva;

  const [rows, activeCount] = await Promise.all([
    getRanking(temporada),
    getActiveParticipantCount(temporada),
  ]);

  return (
    <div className="w-full max-w-2xl">
      <h1 className="heading-display mt-6 text-center text-4xl sm:text-5xl">
        Ranking
      </h1>
      <p className="mt-3 text-center text-sm text-on-surface-variant">
        Clasificación de la fase de {temporadaLabel(temporada).toLowerCase()} · 1
        punto por resultado acertado
      </p>
      <div className="mt-6 flex justify-center">
        <Suspense>
          <SeasonTabs selected={temporada} basePath="/ranking" />
        </Suspense>
      </div>
      <div className="mt-6 flex justify-center">
        <PrizePoolCard pool={prizePool(activeCount)} align="center" />
      </div>
      <RankingList rows={rows} />
    </div>
  );
}
