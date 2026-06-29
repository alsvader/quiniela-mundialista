import { smsSendResponseSchema } from "@/lib/schemas";

/**
 * Cliente de SMS Masivos para el recordatorio automático de eliminatoria (change
 * sms-recordatorio-eliminatoria, design D5/D6). Sin dependencias npm nuevas:
 * `fetch` nativo. La normalización de teléfono reutiliza el criterio de
 * lib/whatsapp.ts (quitar no-dígitos, asumir 10 = MX).
 */

const DEFAULT_BASE_URL = "https://api.smsmasivos.com.mx";
/** SMS Masivos acepta hasta 500 números por llamada bulk. */
export const SMS_BULK_MAX = 500;
/** Tope duro de la cuenta: 160 caracteres por mensaje (sin multi-segmento). */
export const SMS_MAX_LEN = 160;

const PRONOSTICOS_URL = "https://www.quinielamundialistas.com/partidos";

/** Quita acentos/diacríticos: un solo acento fuerza Unicode (UCS-2) y baja el
 * límite a 70 chars. El SMS va en ASCII (GSM-7) para mantener el tope de 160. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Normaliza un teléfono a 10 dígitos nacionales (MX). Acepta basura intermedia
 * (espacios, guiones, paréntesis) y el prefijo de país 52. Devuelve null si no
 * queda exactamente en 10 dígitos: el llamante descarta ese número del lote.
 */
export function normalizeMxPhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  // 12 dígitos con lada país 52 → tomar los 10 nacionales
  const national = digits.length === 12 && digits.startsWith("52") ? digits.slice(2) : digits;
  return /^\d{10}$/.test(national) ? national : null;
}

/**
 * Texto del SMS por partido. Restricciones aprendidas en pruebas reales contra
 * SMS Masivos + operadores MX:
 * - SIN emojis ni acentos (Unicode baja el límite a 70 chars) → ASCII puro.
 * - URL COMPLETA, nunca acortada: los operadores filtran silenciosamente los
 *   SMS con links de acortadores ("Entregado" en el panel pero no llega).
 * - Tope duro de 160 chars: si los nombres de equipo lo exceden, se cae a un
 *   respaldo sin nombres (garantiza ≤ SMS_MAX_LEN).
 */
export function buildEliminatoriaSmsText(match: { home: string; away: string }): string {
  const home = stripAccents(match.home);
  const away = stripAccents(match.away);
  const full =
    `Quiniela Mundialista: ${home} vs ${away}. ` +
    `Pon tu pronostico antes del cierre: ${PRONOSTICOS_URL}`;
  if (full.length <= SMS_MAX_LEN) return full;
  return (
    `Quiniela Mundialista: ya casi cierra un partido de eliminatoria. ` +
    `Pon tu pronostico: ${PRONOSTICOS_URL}`
  );
}

export interface BulkSmsResult {
  success: boolean;
  requestId: string | null;
  /** Mensaje del proveedor o del error, para el log de auditoría. */
  detail: string;
  /** Avisos del proveedor (p.ej. test_message_detected): el operador puede
   * descartar el SMS aunque el panel diga "Entregado". Se loguean para auditar. */
  warnings: string[];
}

/**
 * Envía un SMS a un lote de números (hasta SMS_BULK_MAX) en una sola llamada.
 * Auth por header `apikey`; `country_code` fijo 52; `sandbox` desde el entorno
 * (1 = pruebas, no consume crédito). No lanza: devuelve success=false ante
 * cualquier fallo para que el endpoint deje el partido sin registrar y reintente.
 */
export async function sendBulkSms(params: {
  numbers: string[];
  message: string;
}): Promise<BulkSmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    return { success: false, requestId: null, detail: "Falta SMS_API_KEY.", warnings: [] };
  }

  const baseUrl = (process.env.SMS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const sandbox = process.env.SMS_SANDBOX ?? "1";

  // Sin shorten_url a propósito: los operadores MX filtran los SMS con links de
  // acortadores. La URL completa (≤160 chars, ver buildEliminatoriaSmsText) sí llega.
  const body = {
    message: params.message,
    numbers: params.numbers.join(","),
    country_code: "52",
    sandbox,
  };

  try {
    const res = await fetch(`${baseUrl}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify(body),
    });
    const json: unknown = await res.json().catch(() => null);
    const parsed = smsSendResponseSchema.safeParse(json);
    const warnings = parsed.success
      ? (parsed.data.warnings ?? []).map((w) => w.message ?? w.code ?? "aviso")
      : [];
    if (warnings.length) {
      console.warn(`[sms] avisos del proveedor: ${warnings.join(" | ")}`);
    }
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const detail = parsed.success ? parsed.data.message : `HTTP ${res.status}`;
      return {
        success: false,
        requestId: null,
        detail: detail || `HTTP ${res.status}`,
        warnings,
      };
    }
    return {
      success: true,
      requestId: parsed.data.request_id ?? null,
      detail: parsed.data.message ?? "",
      warnings,
    };
  } catch (e) {
    return {
      success: false,
      requestId: null,
      detail: e instanceof Error ? e.message : "Error de red al enviar SMS.",
      warnings: [],
    };
  }
}
