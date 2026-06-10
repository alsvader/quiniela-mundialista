import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { getRanking } from "@/lib/queries";
import { RankingList } from "@/components/ranking-list";

export const metadata: Metadata = { title: "Ranking · Admin" };

export default async function AdminRankingPage() {
  await requireAdminPage();
  const rows = await getRanking();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="heading-display text-3xl">Ranking</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        La misma clasificación que ven los participantes en la página pública.
      </p>
      <RankingList rows={rows} />
    </div>
  );
}
