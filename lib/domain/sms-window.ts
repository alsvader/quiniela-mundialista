/**
 * Ventana de envío del recordatorio SMS de eliminatoria (change
 * sms-recordatorio-eliminatoria, design D3).
 *
 * El aviso se envía cuando faltan 2h o menos para el kickoff Y el partido sigue
 * abierto (cierre = kickoff − 1h, CLOSE_BEFORE_KICKOFF_MS). La ventana de envío
 * es por tanto [kickoff − 2h, kickoff − 1h) = 60 min; con un poll cada 30 min
 * siempre cae ≥1 tick dentro. El estado nunca se almacena: se deriva de `now`.
 */

import { CLOSE_BEFORE_KICKOFF_MS } from "@/lib/domain/jornada";

/** Antelación del aviso respecto al kickoff: 2 horas. */
export const SMS_NOTICE_BEFORE_KICKOFF_MS = 2 * 60 * 60 * 1000;

/**
 * ¿El partido con inicio en `kickoffAt` está dentro de la ventana de aviso en
 * `now`? Verdadero mientras `kickoff − 2h ≤ now < kickoff − 1h`. Antes de la
 * ventana aún no toca; desde el cierre (kickoff − 1h) ya no se avisa porque no
 * se puede pronosticar.
 */
export function isInSmsWindow(
  kickoffAt: string | Date,
  now: Date = new Date()
): boolean {
  const kickoff =
    typeof kickoffAt === "string" ? new Date(kickoffAt).getTime() : kickoffAt.getTime();
  const t = now.getTime();
  return t >= kickoff - SMS_NOTICE_BEFORE_KICKOFF_MS && t < kickoff - CLOSE_BEFORE_KICKOFF_MS;
}

/**
 * Umbrales ISO para acotar la consulta SQL de partidos en ventana: un partido
 * está en ventana si `closeThresholdIso < kickoff_at ≤ noticeThresholdIso`.
 * (kickoff > now + 1h ⇒ sigue abierto; kickoff ≤ now + 2h ⇒ ya entró la ventana.)
 */
export function smsWindowThresholds(now: Date = new Date()): {
  closeThresholdIso: string;
  noticeThresholdIso: string;
} {
  const t = now.getTime();
  return {
    closeThresholdIso: new Date(t + CLOSE_BEFORE_KICKOFF_MS).toISOString(),
    noticeThresholdIso: new Date(t + SMS_NOTICE_BEFORE_KICKOFF_MS).toISOString(),
  };
}
