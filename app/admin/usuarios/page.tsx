import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { getPaymentInfo } from "@/lib/queries";
import { buildPaymentReminderLink } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import type { Profile } from "@/lib/types";
import { UserStatusButton } from "./user-status-button";
import { PaymentReminderButton } from "./payment-reminder-button";

export const metadata: Metadata = { title: "Usuarios · Admin" };

const STATUS_LABEL = {
  pending: { text: "Pendiente", tone: "secondary" as const },
  active: { text: "Activo", tone: "success" as const },
  disabled: { text: "Desactivado", tone: "error" as const },
};

export default async function UsuariosPage() {
  const { supabase } = await requireAdminPage();

  const [{ data: profiles }, { data: emails }, payment] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_user_emails"),
    getPaymentInfo(),
  ]);

  const emailById = new Map(
    ((emails ?? []) as { id: string; email: string }[]).map((e) => [e.id, e.email])
  );
  const users = (profiles ?? []) as Profile[];
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="heading-display text-3xl">Usuarios</h1>
        <Chip tone={pendingCount ? "secondary" : "neutral"}>
          {pendingCount} pendientes de pago
        </Chip>
      </header>

      {users.length === 0 ? (
        <div className="glass mt-8 max-w-prose p-6 text-sm text-on-surface-variant">
          Todavía no hay participantes registrados.
        </div>
      ) : (
        <div className="glass mt-8 overflow-x-auto p-1">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="label-data text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Alias</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = STATUS_LABEL[u.status];
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
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {u.status === "pending" && (
                          <PaymentReminderButton
                            link={
                              buildPaymentReminderLink(
                                u.phone,
                                { name: u.full_name },
                                payment
                              )
                            }
                            disabledHint={
                              !u.phone
                                ? "El usuario no tiene teléfono registrado."
                                : "Completa los datos de transferencia en Configuración."
                            }
                          />
                        )}
                        {u.status !== "active" && (
                          <UserStatusButton
                            userId={u.id}
                            status="active"
                            label={u.status === "pending" ? "Activar" : "Reactivar"}
                            variant="success"
                          />
                        )}
                        {u.status === "active" && (
                          <UserStatusButton
                            userId={u.id}
                            status="disabled"
                            label="Desactivar"
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
