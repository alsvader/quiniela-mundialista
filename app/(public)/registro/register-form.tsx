"use client";

import { useActionState } from "react";
import { signUp, completeProfile, type AuthState } from "../auth-actions";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm({ completing }: { completing: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(
    completing ? completeProfile : signUp,
    {}
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {!completing && (
        <>
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={fe.email}
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            hint="Mínimo 8 caracteres."
            error={fe.password}
          />
        </>
      )}
      <Field
        label="Nombre completo"
        name="full_name"
        autoComplete="name"
        required
        hint="Solo lo verá el administrador."
        error={fe.full_name}
      />
      <Field
        label="Alias"
        name="alias"
        autoComplete="off"
        required
        minLength={3}
        maxLength={20}
        pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.\-]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.\-]+)*"
        title="Letras (con acentos), números, punto, guion o guion bajo; espacios sencillos entre palabras."
        hint="Tu nombre público en el ranking."
        error={fe.alias}
      />
      <Field
        label="Teléfono"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        hint="10 dígitos. Para validar tu pago por WhatsApp."
        error={fe.phone}
      />
      {state.error && (
        <p role="alert" className="rounded-sm bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="Creando cuenta…">
        {completing ? "Guardar perfil" : "Crear cuenta"}
      </SubmitButton>
    </form>
  );
}
