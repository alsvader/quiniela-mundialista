"use client";

import { useActionState } from "react";
import { saveWhatsapp, type AdminState } from "../actions";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function WhatsappForm({ current }: { current: string }) {
  const [state, action] = useActionState<AdminState, FormData>(saveWhatsapp, {});

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field
        label="Número de WhatsApp"
        name="whatsapp_number"
        type="tel"
        required
        defaultValue={current}
        hint="10 dígitos (se asume +52) o número completo con código de país."
      />
      {state.error && (
        <p role="alert" className="rounded-sm bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {state.ok && (
          <span role="status" className="text-sm font-semibold text-tertiary-fixed">
            ✓ Guardado
          </span>
        )}
      </div>
    </form>
  );
}
