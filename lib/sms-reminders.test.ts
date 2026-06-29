import { describe, expect, it, vi } from "vitest";
import { runSmsReminders, type SmsReminderDeps } from "./sms-reminders";
import type { BulkSmsResult } from "./sms";
import { normalizeMxPhone } from "./sms";
import type { EliminatoriaMatchForSms } from "./queries";

const match = (id: number): EliminatoriaMatchForSms => ({
  id,
  home: `Local${id}`,
  away: `Visita${id}`,
  kickoffAt: "2026-07-01T20:00:00Z",
});

function makeDeps(overrides: Partial<SmsReminderDeps>): SmsReminderDeps {
  return {
    getPendingMatches: vi.fn(async () => []),
    getRecipientPhones: vi.fn(async () => ["4771234567"]),
    sendSms: vi.fn(
      async (): Promise<BulkSmsResult> => ({
        success: true,
        requestId: "req-1",
        detail: "ok",
        warnings: [],
      })
    ),
    recordSent: vi.fn(async () => {}),
    buildText: () => "texto",
    normalizePhone: normalizeMxPhone,
    ...overrides,
  };
}

describe("runSmsReminders", () => {
  it("sin partidos pendientes no envía ni registra", async () => {
    const deps = makeDeps({ getPendingMatches: vi.fn(async () => []) });
    const summary = await runSmsReminders(deps);
    expect(summary).toMatchObject({ processed: 0, sent: 0, failed: 0 });
    expect(deps.sendSms).not.toHaveBeenCalled();
    expect(deps.recordSent).not.toHaveBeenCalled();
  });

  it("al enviar con éxito registra el partido (idempotencia)", async () => {
    const deps = makeDeps({ getPendingMatches: vi.fn(async () => [match(42)]) });
    const summary = await runSmsReminders(deps);
    expect(summary.sent).toBe(1);
    expect(deps.recordSent).toHaveBeenCalledWith(42, "req-1", 1);
  });

  it("si el proveedor falla NO registra (se reintenta en el siguiente tick)", async () => {
    const deps = makeDeps({
      getPendingMatches: vi.fn(async () => [match(7)]),
      sendSms: vi.fn(
        async (): Promise<BulkSmsResult> => ({
          success: false,
          requestId: null,
          detail: "HTTP 500",
          warnings: [],
        })
      ),
    });
    const summary = await runSmsReminders(deps);
    expect(summary.failed).toBe(1);
    expect(summary.sent).toBe(0);
    expect(deps.recordSent).not.toHaveBeenCalled();
  });

  it("sin destinatarios válidos marca atendido sin llamar al proveedor", async () => {
    const deps = makeDeps({
      getPendingMatches: vi.fn(async () => [match(9)]),
      getRecipientPhones: vi.fn(async () => ["123", "sin numero"]), // ninguno válido
    });
    const summary = await runSmsReminders(deps);
    expect(summary.skippedNoRecipients).toBe(1);
    expect(deps.sendSms).not.toHaveBeenCalled();
    expect(deps.recordSent).toHaveBeenCalledWith(9, null, 0);
  });

  it("normaliza y deduplica los teléfonos del lote", async () => {
    const sendSms = vi.fn(
      async (): Promise<BulkSmsResult> => ({
        success: true,
        requestId: "r",
        detail: "ok",
        warnings: [],
      })
    );
    const deps = makeDeps({
      getPendingMatches: vi.fn(async () => [match(1)]),
      // mismo número en dos formatos + uno inválido
      getRecipientPhones: vi.fn(async () => ["4771234567", "+52 477 123 4567", "abc"]),
      sendSms,
    });
    const summary = await runSmsReminders(deps);
    expect(summary.recipients).toBe(1);
    expect(sendSms).toHaveBeenCalledWith({ numbers: ["4771234567"], message: "texto" });
  });
});
