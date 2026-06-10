import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { getWhatsappNumber } from "@/lib/queries";
import { WhatsappForm } from "./whatsapp-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function ConfiguracionPage() {
  await requireAdminPage();
  const number = await getWhatsappNumber();

  return (
    <>
      <h1 className="heading-display text-3xl">Configuración</h1>
      <div className="glass mt-8 max-w-md p-6">
        <h2 className="text-base font-bold text-on-surface">
          WhatsApp de contacto
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Los usuarios pendientes de pago te contactarán a este número con un
          mensaje prellenado (nombre, correo y teléfono).
        </p>
        <WhatsappForm current={number} />
      </div>
    </>
  );
}
