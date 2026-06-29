import {
  buildEliminatoriaSmsText,
  normalizeMxPhone,
  sendBulkSms,
  SMS_BULK_MAX,
  type BulkSmsResult,
} from "@/lib/sms";
import {
  getEliminatoriaMatchesPendingSms,
  getEliminatoriaSmsPhones,
  recordSmsReminderSent,
  type EliminatoriaMatchForSms,
} from "@/lib/queries";

/**
 * Orquestación del recordatorio automático de eliminatoria por SMS (change
 * sms-recordatorio-eliminatoria). Las dependencias se inyectan para poder
 * probar la lógica (registrar al éxito, NO registrar al fallo, omitir sin
 * destinatarios) sin Supabase ni red. El endpoint del cron arma las deps reales.
 */
export interface SmsReminderDeps {
  getPendingMatches: () => Promise<EliminatoriaMatchForSms[]>;
  getRecipientPhones: () => Promise<string[]>;
  sendSms: (p: { numbers: string[]; message: string }) => Promise<BulkSmsResult>;
  recordSent: (matchId: number, requestId: string | null, recipients: number) => Promise<void>;
  buildText: (m: { home: string; away: string }) => string;
  normalizePhone: (raw: string) => string | null;
}

export interface SmsReminderSummary {
  processed: number;
  sent: number;
  skippedNoRecipients: number;
  failed: number;
  recipients: number;
}

export function defaultSmsReminderDeps(): SmsReminderDeps {
  return {
    getPendingMatches: getEliminatoriaMatchesPendingSms,
    getRecipientPhones: getEliminatoriaSmsPhones,
    sendSms: sendBulkSms,
    recordSent: recordSmsReminderSent,
    buildText: buildEliminatoriaSmsText,
    normalizePhone: normalizeMxPhone,
  };
}

export async function runSmsReminders(
  deps: SmsReminderDeps
): Promise<SmsReminderSummary> {
  const matches = await deps.getPendingMatches();
  const summary: SmsReminderSummary = {
    processed: matches.length,
    sent: 0,
    skippedNoRecipients: 0,
    failed: 0,
    recipients: 0,
  };
  if (matches.length === 0) return summary;

  // Mismo padrón para todos los partidos de esta corrida: normaliza y deduplica.
  const phones = await deps.getRecipientPhones();
  const numbers = Array.from(
    new Set(
      phones
        .map((p) => deps.normalizePhone(p))
        .filter((n): n is string => n !== null)
    )
  );
  summary.recipients = numbers.length;

  // SMS Masivos acepta hasta SMS_BULK_MAX por llamada; a la escala esperada no
  // se alcanza. Si se alcanzara, se envía el tope y se deja constancia en el log.
  const batch = numbers.slice(0, SMS_BULK_MAX);
  if (numbers.length > SMS_BULK_MAX) {
    console.warn(
      `[sms-eliminatoria] ${numbers.length} destinatarios > tope ${SMS_BULK_MAX}; se omiten ${
        numbers.length - SMS_BULK_MAX
      }.`
    );
  }

  for (const match of matches) {
    if (batch.length === 0) {
      // Sin destinatarios válidos: marcar atendido para no reintentar siempre.
      await deps.recordSent(match.id, null, 0);
      summary.skippedNoRecipients++;
      continue;
    }
    const result = await deps.sendSms({
      numbers: batch,
      message: deps.buildText({ home: match.home, away: match.away }),
    });
    if (result.success) {
      await deps.recordSent(match.id, result.requestId, batch.length);
      summary.sent++;
    } else {
      // No se registra: el siguiente tick reintenta el lote completo (idempotente).
      summary.failed++;
      console.error(
        `[sms-eliminatoria] fallo enviando partido ${match.id}: ${result.detail}`
      );
    }
  }
  return summary;
}
