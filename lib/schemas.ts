import { z } from "zod";

/**
 * Validación schema-first (design.md D12): única fuente de verdad por payload
 * en la frontera de cada Server Action. La normalización (trim, lowercase,
 * strip de no-dígitos) vive aquí como transforms; RLS y CHECK constraints
 * son la última línea en Postgres.
 */

/** Primer mensaje de error por campo, listo para AuthState.fieldErrors. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ---------- auth y perfil ----------

export const profileFieldsSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre completo."),
  alias: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_.-]{3,20}$/,
      "De 3 a 20 caracteres: letras, números, punto, guion o guion bajo."
    ),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => /^\d{10}$/.test(s), "Escribe un teléfono de 10 dígitos."),
});

export const signUpSchema = profileFieldsSchema.extend({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Escribe un correo válido.")),
  password: z.string().min(8, "Mínimo 8 caracteres."),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

// ---------- pronósticos ----------

export const pickSchema = z.enum(["H", "D", "A"]);

export const jornadaDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Jornada inválida.");

// ---------- admin ----------

export const userStatusSchema = z.object({
  user_id: z.uuid("Solicitud inválida."),
  status: z.enum(["active", "disabled", "pending"], "Solicitud inválida."),
});

const goals = z.coerce
  .number("Marcador inválido: goles enteros de 0 a 99.")
  .int("Marcador inválido: goles enteros de 0 a 99.")
  .min(0, "Marcador inválido: goles enteros de 0 a 99.")
  .max(99, "Marcador inválido: goles enteros de 0 a 99.");

export const scoreSchema = z.object({
  match_id: z.coerce.number().int().positive("Solicitud inválida."),
  home_goals: goals,
  away_goals: goals,
});

const FLAG_CODE_RE = /^[a-z]{2}(-[a-z]{2,3})?$/; // iso alfa-2 o regional (gb-eng)

const optionalFlagCode = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (s) => s === "" || FLAG_CODE_RE.test(s),
    "Código de bandera inválido (ej. mx, za, gb-eng) o déjalo vacío."
  )
  .transform((s) => s || null);

export const matchSchema = z.object({
  match_id: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n > 0), "Partido inválido."),
  phase: z.enum(
    [
      "group_stage",
      "round_of_32",
      "round_of_16",
      "quarter_final",
      "semi_final",
      "third_place",
      "final",
    ],
    "Fase inválida."
  ),
  home_team: z.string().trim().min(2, "Escribe ambos equipos."),
  away_team: z.string().trim().min(2, "Escribe ambos equipos."),
  home_code: optionalFlagCode,
  away_code: optionalFlagCode,
  group_label: z
    .string()
    .trim()
    .max(2, "Grupo inválido.")
    .transform((s) => s || null),
  kickoff_local: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha y hora inválidas."),
});

export const whatsappSchema = z.object({
  whatsapp_number: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine(
      (s) => s.length >= 10 && s.length <= 15,
      "Escribe un número de 10 dígitos (o con código de país)."
    ),
});
