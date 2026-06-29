import { defaultSmsReminderDeps, runSmsReminders } from "@/lib/sms-reminders";

/**
 * Disparo del recordatorio automático de eliminatoria por SMS (change
 * sms-recordatorio-eliminatoria, spec sms-notifications). Lo invoca pg_cron cada
 * 30 min (migración 0014). En cada corrida recorre TODOS los partidos de
 * eliminatoria en ventana de aviso aún no notificados y envía el lote.
 * Idempotente vía el ledger sms_recordatorios.
 *
 * Protegido por CRON_SECRET: sin el secreto correcto responde 401 ANTES de leer
 * datos o enviar (el envío de SMS cuesta; un endpoint abierto sería un vector de
 * costo/abuso, design D7). Runtime Node: usa la service role de Supabase.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // sin secreto configurado, nadie pasa
  const provided = request.headers.get("x-cron-secret");
  return provided === expected;
}

async function handle(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const summary = await runSmsReminders(defaultSmsReminderDeps());
    console.log(
      `[sms-eliminatoria] procesados=${summary.processed} enviados=${summary.sent} ` +
        `sin_destinatarios=${summary.skippedNoRecipients} fallidos=${summary.failed} ` +
        `destinatarios=${summary.recipients}`
    );
    return Response.json({ ok: true, ...summary });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Error desconocido.";
    console.error(`[sms-eliminatoria] error: ${detail}`);
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}

// pg_cron/pg_net hace POST; se permite GET para pruebas manuales con el secreto.
export const POST = handle;
export const GET = handle;
