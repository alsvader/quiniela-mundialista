import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { getFaseActiva, getNextEliminatoriaMatch, getPaymentInfo } from "@/lib/queries";
import {
  buildEliminatoriaReminderLink,
  buildPaymentReminderLink,
} from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import type { Profile } from "@/lib/types";
import {
  TEMPORADAS,
  temporadaLabel,
  toTemporada,
  type Temporada,
} from "@/lib/domain/temporada";
import { UserStatusButton } from "./user-status-button";
import { PaymentReminderButton } from "./payment-reminder-button";
import { EliminatoriaReminderButton } from "./eliminatoria-reminder-button";
import { SeasonParticipationButton } from "./season-participation-button";
import { FaseActivaControl } from "./fase-activa-control";

export const metadata: Metadata = { title: "Usuarios · Admin" };

const STATUS_LABEL = {
  pending: { text: "Pendiente", tone: "secondary" as const },
  active: { text: "Activa", tone: "success" as const },
  disabled: { text: "Desactivada", tone: "error" as const },
};

export default async function UsuariosPage() {
  const { supabase } = await requireAdminPage();

  const [
    { data: profiles },
    { data: emails },
    { data: parts },
    payment,
    faseActiva,
    nextEliminatoria,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_user_emails"),
    supabase
      .from("participaciones")
      .select("user_id, temporada, status")
      .eq("status", "active"),
    getPaymentInfo(),
    getFaseActiva(),
    getNextEliminatoriaMatch(),
  ]);

  const emailById = new Map(
    ((emails ?? []) as { id: string; email: string }[]).map((e) => [e.id, e.email])
  );
  // user_id → temporadas con participación activa
  const seasonsByUser = new Map<string, Set<Temporada>>();
  for (const p of (parts ?? []) as { user_id: string; temporada: string }[]) {
    const set = seasonsByUser.get(p.user_id) ?? new Set<Temporada>();
    set.add(toTemporada(p.temporada));
    seasonsByUser.set(p.user_id, set);
  }

  const users = (profiles ?? []) as Profile[];
  // "Pendientes" de la fase activa = cuentas no desactivadas sin esa participación
  const pendingCount = users.filter(
    (u) => u.status !== "disabled" && !seasonsByUser.get(u.id)?.has(faseActiva)
  ).length;

  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="heading-display text-3xl">Usuarios</h1>
        <Chip tone={pendingCount ? "secondary" : "neutral"}>
          {pendingCount} sin pagar {temporadaLabel(faseActiva).toLowerCase()}
        </Chip>
      </header>

      <div className="mt-5">
        <FaseActivaControl current={faseActiva} />
      </div>

      {users.length === 0 ? (
        <div className="glass mt-8 max-w-prose p-6 text-sm text-on-surface-variant">
          Todavía no hay participantes registrados.
        </div>
      ) : (
        <div className="glass mt-8 overflow-x-auto p-1">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="label-data text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Alias</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Cuenta</th>
                <th className="px-4 py-3 font-medium">Participación (pago)</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = STATUS_LABEL[u.status];
                const seasons = seasonsByUser.get(u.id) ?? new Set<Temporada>();
                const debeFaseActiva =
                  u.status !== "disabled" && !seasons.has(faseActiva);
                return (
                  <tr
                    key={u.id}
                    className="border-t border-outline-variant/30 text-on-surface"
                  >
                    <td className="px-4 py-3 font-semibold">{u.alias}</td>
                    <td className="px-4 py-3">{u.full_name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {emailById.get(u.id) ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {u.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {formatDateTime(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={status.tone}>{status.text}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      {u.status === "disabled" ? (
                        <span className="text-xs text-on-surface-variant">
                          Cuenta desactivada
                        </span>
                      ) : (
                        <div className="inline-flex flex-wrap gap-2">
                          {TEMPORADAS.map((t) => (
                            <SeasonParticipationButton
                              key={t}
                              userId={u.id}
                              temporada={t}
                              active={seasons.has(t)}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {debeFaseActiva && (
                          <PaymentReminderButton
                            link={buildPaymentReminderLink(
                              u.phone,
                              { name: u.full_name },
                              payment
                            )}
                            disabledHint={
                              !u.phone
                                ? "El usuario no tiene teléfono registrado."
                                : "Completa los datos de transferencia en Configuración."
                            }
                          />
                        )}
                        {u.status !== "disabled" &&
                          seasons.has("eliminatoria") && (
                            <EliminatoriaReminderButton
                              link={buildEliminatoriaReminderLink(
                                u.phone,
                                { name: u.full_name },
                                nextEliminatoria
                              )}
                              disabledHint={
                                !u.phone
                                  ? "El usuario no tiene teléfono registrado."
                                  : "No hay un próximo partido de eliminatoria abierto."
                              }
                            />
                          )}
                        {u.status === "disabled" ? (
                          <UserStatusButton
                            userId={u.id}
                            status="active"
                            label="Reactivar cuenta"
                            variant="success"
                          />
                        ) : (
                          <UserStatusButton
                            userId={u.id}
                            status="disabled"
                            label="Desactivar cuenta"
                            variant="danger"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
