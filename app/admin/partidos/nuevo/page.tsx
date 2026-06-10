import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { MatchForm } from "../match-form";

export const metadata: Metadata = { title: "Nuevo partido · Admin" };

export default async function NuevoPartidoPage() {
  await requireAdminPage();
  return (
    <>
      <h1 className="heading-display text-3xl">Nuevo partido</h1>
      <MatchForm match={null} kickoffLocal={null} />
    </>
  );
}
