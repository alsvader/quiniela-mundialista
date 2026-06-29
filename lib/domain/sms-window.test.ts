import { describe, expect, it } from "vitest";
import { isInSmsWindow, smsWindowThresholds } from "./sms-window";

// Kickoff fijo para razonar las ventanas (UTC).
const KICKOFF = "2026-07-01T20:00:00Z";
const at = (iso: string) => new Date(iso);

describe("isInSmsWindow", () => {
  it("fuera de ventana: a más de 2h del kickoff", () => {
    expect(isInSmsWindow(KICKOFF, at("2026-07-01T17:59:00Z"))).toBe(false);
  });

  it("entra justo a 2h del kickoff (límite inferior inclusivo)", () => {
    expect(isInSmsWindow(KICKOFF, at("2026-07-01T18:00:00Z"))).toBe(true);
  });

  it("dentro de la ventana (1.5h antes)", () => {
    expect(isInSmsWindow(KICKOFF, at("2026-07-01T18:30:00Z"))).toBe(true);
  });

  it("se cierra justo a 1h del kickoff (límite superior exclusivo)", () => {
    expect(isInSmsWindow(KICKOFF, at("2026-07-01T19:00:00Z"))).toBe(false);
  });

  it("ya cerrado: a menos de 1h del kickoff", () => {
    expect(isInSmsWindow(KICKOFF, at("2026-07-01T19:30:00Z"))).toBe(false);
  });
});

describe("smsWindowThresholds", () => {
  it("acota kickoff en (now+1h, now+2h]", () => {
    const now = at("2026-07-01T18:30:00Z");
    const { closeThresholdIso, noticeThresholdIso } = smsWindowThresholds(now);
    // un kickoff justo en estos umbrales: > close y ≤ notice
    expect(new Date(closeThresholdIso).toISOString()).toBe("2026-07-01T19:30:00.000Z");
    expect(new Date(noticeThresholdIso).toISOString()).toBe("2026-07-01T20:30:00.000Z");
    // KICKOFF (20:00) cae dentro: close(19:30) < 20:00 ≤ notice(20:30)
    expect(new Date(KICKOFF) > new Date(closeThresholdIso)).toBe(true);
    expect(new Date(KICKOFF) <= new Date(noticeThresholdIso)).toBe(true);
  });
});
