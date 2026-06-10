import type { Metadata } from "next";
import { getActiveParticipantCount, getRanking } from "@/lib/queries";
import { prizePool } from "@/lib/domain/prize";
import { RankingList } from "@/components/ranking-list";
import { PrizePoolCard } from "@/components/prize-pool-card";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Clasificación general de la Quiniela Mundialista 2026: puntos por aciertos en cada jornada.",
};

// Página pública y compartible: siempre datos frescos.
export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [rows, activeCount] = await Promise.all([
    getRanking(),
    getActiveParticipantCount(),
  ]);

  return (
    <div className="w-full max-w-2xl">
      <h1 className="heading-display mt-6 text-center text-4xl sm:text-5xl">
        Ranking
      </h1>
      <p className="mt-3 text-center text-sm text-on-surface-variant">
        Clasificación general · 1 punto por resultado acertado
      </p>
      <div className="mt-6 flex justify-center">
        <PrizePoolCard pool={prizePool(activeCount)} align="center" />
      </div>
      <RankingList rows={rows} />
    </div>
  );
}
