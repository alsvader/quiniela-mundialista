"use client";

import { useActionState } from "react";
import { setUserStatus, type AdminState } from "../actions";
import type { UserStatus } from "@/lib/types";

const styles = {
  success:
    "bg-tertiary-container text-on-tertiary-fixed hover:shadow-(--shadow-glow-tertiary)",
  danger:
    "bg-error-container text-on-error-container hover:shadow-[0_0_12px_rgb(147_0_10/0.5)]",
};

export function UserStatusButton({
  userId,
  status,
  label,
  variant,
}: {
  userId: string;
  status: UserStatus;
  label: string;
  variant: keyof typeof styles;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setUserStatus,
    {}
  );

  return (
    <form action={action} className="inline">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        title={state.error}
        className={`h-9 rounded px-3 text-xs font-bold transition-shadow duration-150 disabled:opacity-50 ${styles[variant]}`}
      >
        {pending ? "…" : state.error ? "Error, reintentar" : label}
      </button>
    </form>
  );
}
