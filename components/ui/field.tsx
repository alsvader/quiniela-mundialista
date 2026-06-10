import type { InputHTMLAttributes } from "react";

/**
 * Campo de formulario (DESIGN.md · Inputs): fondo blanco al 6%, borde inferior
 * cian que brilla al enfocar. Label siempre visible, error inline.
 */
export function Field({
  label,
  name,
  error,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-sm font-semibold text-on-surface">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? hintId}
        className={`h-11 rounded bg-white/6 px-3 text-base text-on-surface placeholder:text-on-surface-variant/70
          border-b transition-[border-color,box-shadow] duration-200 ease-(--ease-out-quart)
          focus:outline-none focus:shadow-[0_6px_12px_-8px_rgb(0_243_255/0.55)]
          ${error ? "border-error" : "border-primary-container/50 focus:border-primary-container"}`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
