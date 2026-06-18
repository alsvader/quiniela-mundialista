import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { getPaymentInfo, getWhatsappNumber } from "@/lib/queries";
import { WhatsappForm } from "./whatsapp-form";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function ConfiguracionPage() {
  await requireAdminPage();
  const [number, payment] = await Promise.all([
    getWhatsappNumber(),
    getPaymentInfo(),
  ]);

  return (
    <>
      <h1 className="heading-display text-3xl">Configuración</h1>
      <div className="mt-8 grid max-w-md gap-6">
        <section className="glass p-6">
          <h2 className="text-base font-bold text-on-surface">
            WhatsApp de contacto
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Los usuarios pendientes de pago te contactarán a este número con un
            mensaje prellenado (nombre, correo y teléfono).
          </p>
          <WhatsappForm current={number} />
        </section>

        <section className="glass p-6">
          <h2 className="text-base font-bold text-on-surface">
            Datos para transferencia
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Se incluyen en el recordatorio de pago que envías por WhatsApp a los
            usuarios pendientes. El botón se activa cuando completas los cuatro
            campos.
          </p>
          <PaymentForm current={payment} />
        </section>
      </div>
    </>
  );
}
