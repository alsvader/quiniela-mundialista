"use client";

import { useActionState } from "react";
import { savePaymentInfo, type AdminState } from "../actions";
import type { PaymentInfo } from "@/lib/queries";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function PaymentForm({ current }: { current: PaymentInfo }) {
  const [state, action] = useActionState<AdminState, FormData>(
    savePaymentInfo,
    {}
  );

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field
        label="Banco"
        name="bank_name"
        defaultValue={current.bankName}
        hint="Ej. BBVA, Banorte, Santander."
      />
      <Field
        label="CLABE"
        name="bank_clabe"
        type="text"
        inputMode="numeric"
        defaultValue={current.clabe}
        hint="18 dígitos de la cuenta CLABE."
      />
      <Field
        label="Titular de la cuenta"
        name="bank_holder"
        defaultValue={current.holder}
        hint="A nombre de quién se hace la transferencia."
      />
      <Field
        label="Monto del boleto"
        name="payment_amount"
        type="text"
        inputMode="decimal"
        defaultValue={current.amount}
        hint="En pesos. Ej. 200."
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-sm bg-error-container/40 px-3 py-2 text-sm text-on-error-container"
        >
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {state.ok && (
          <span
            role="status"
            className="text-sm font-semibold text-tertiary-fixed"
          >
            ✓ Guardado
          </span>
        )}
      </div>
    </form>
  );
}
