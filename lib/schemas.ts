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
    // NFC: lo pegado desde macOS puede venir en NFD (acento combinante), que
    // no matchearía el charset y crearía duplicados visuales con bytes distintos
    .normalize("NFC")
    .min(3, "Mínimo 3 caracteres.")
    .max(20, "Máximo 20 caracteres.")
    .regex(
      // misma regla que el CHECK profiles_alias_format (migración 0005):
      // palabras unidas por espacios sencillos, sin extremos ni dobles espacios
      /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+)*$/,
      "Letras (con acentos), números, punto, guion o guion bajo; espacios sencillos entre palabras."
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

export const matchIdSchema = z.coerce
  .number("Partido inválido.")
  .int("Partido inválido.")
  .positive("Partido inválido.");

// ---------- admin ----------

export const userStatusSchema = z.object({
  user_id: z.uuid("Solicitud inválida."),
  status: z.enum(["active", "disabled", "pending"], "Solicitud inválida."),
});

// Temporada (change fase-eliminatoria-temporada): unidad de pago/bolsa/ranking.
export const temporadaSchema = z.enum(["grupos", "eliminatoria"], "Temporada inválida.");

// Confirmar/retirar la participación de un usuario en una temporada.
export const seasonParticipationSchema = z.object({
  user_id: z.uuid("Solicitud inválida."),
  temporada: temporadaSchema,
  status: z.enum(["active", "disabled"], "Solicitud inválida."),
});

// Mover la temporada activa (puntero de onboarding: pestaña por defecto y CTA).
export const faseActivaSchema = z.object({
  fase_activa: temporadaSchema,
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
  // checkbox "Marcar como finalizado": ausente en FormData = false. Solo los
  // partidos finalizados puntúan (spec live-match / scoring-ranking).
  finished: z.coerce.boolean().default(false),
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
  stadium: z
    .string()
    .trim()
    .max(80, "Estadio demasiado largo.")
    .transform((s) => s || null),
  city: z
    .string()
    .trim()
    .max(80, "Ciudad demasiado larga.")
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

// Datos de transferencia para el recordatorio de pago (design.md D1/D5).
// Los campos pueden quedar vacíos al guardar: la completitud se valida en el
// punto de uso (buildPaymentReminderLink), no aquí.
export const paymentInfoSchema = z.object({
  bank_name: z.string().trim().max(60, "Nombre de banco demasiado largo."),
  bank_clabe: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine(
      (s) => s === "" || /^\d{18}$/.test(s),
      "La CLABE debe tener 18 dígitos (o déjala vacía)."
    ),
  bank_holder: z.string().trim().max(80, "Nombre del titular demasiado largo."),
  payment_amount: z
    .string()
    .trim()
    .refine(
      (s) => s === "" || (/^\d+(\.\d{1,2})?$/.test(s) && Number(s) >= 0),
      "Monto inválido (número positivo, ej. 200 o 200.50)."
    ),
});
