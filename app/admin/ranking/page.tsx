import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/auth/guards";
import { getFaseActiva, getRanking } from "@/lib/queries";
import { RankingList } from "@/components/ranking-list";
import { SeasonTabs } from "@/components/season-tabs";
import { isTemporada, temporadaLabel } from "@/lib/domain/temporada";

export const metadata: Metadata = { title: "Ranking · Admin" };

export default async function AdminRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ temporada?: string }>;
}) {
  await requireAdminPage();
  const { temporada: temporadaParam } = await searchParams;
  const faseActiva = await getFaseActiva();
  const temporada = isTemporada(temporadaParam) ? temporadaParam : faseActiva;
  const rows = await getRanking(temporada);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="heading-display text-3xl">Ranking</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Clasificación de la fase de {temporadaLabel(temporada).toLowerCase()},
        la misma que ven los participantes.
      </p>
      <div className="mt-4">
        <Suspense>
          <SeasonTabs selected={temporada} basePath="/admin/ranking" />
        </Suspense>
      </div>
      <RankingList rows={rows} />
    </div>
  );
}
