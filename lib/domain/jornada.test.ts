import { describe, expect, it } from "vitest";
import {
  isMatchFinished,
  isMatchLive,
  isMatchOpen,
  matchDeadline,
  toMxDate,
} from "./jornada";

// CDMX es UTC-6 todo el año (sin horario de verano desde 2022).
// Kickoff de referencia: 13:00 CDMX = 19:00 UTC → cierre 12:00 CDMX (18:00 UTC).
const KICKOFF = "2026-06-11T19:00:00Z";

describe("isMatchOpen", () => {
  it("está abierto varios días antes del kickoff", () => {
    expect(isMatchOpen(KICKOFF, new Date("2026-06-01T12:00:00Z"))).toBe(true);
  });

  it("está abierto un segundo antes del cierre (kickoff − 1h)", () => {
    expect(isMatchOpen(KICKOFF, new Date("2026-06-11T17:59:59Z"))).toBe(true);
  });

  it("está cerrado exactamente en el instante del cierre", () => {
    expect(isMatchOpen(KICKOFF, new Date("2026-06-11T18:00:00Z"))).toBe(false);
  });

  it("está cerrado un segundo después del cierre, en el kickoff y después", () => {
    expect(isMatchOpen(KICKOFF, new Date("2026-06-11T18:00:01Z"))).toBe(false);
    expect(isMatchOpen(KICKOFF, new Date("2026-06-11T19:00:00Z"))).toBe(false);
    expect(isMatchOpen(KICKOFF, new Date("2026-06-12T19:00:00Z"))).toBe(false);
  });

  it("acepta el kickoff como Date además de string ISO", () => {
    const kickoff = new Date(KICKOFF);
    expect(isMatchOpen(kickoff, new Date("2026-06-11T17:00:00Z"))).toBe(true);
    expect(isMatchOpen(kickoff, new Date("2026-06-11T18:00:00Z"))).toBe(false);
  });

  it("cada partido se evalúa independiente: jornada parcialmente cerrada", () => {
    // 11 jun, 14:30 CDMX (20:30 UTC): el de las 13:00 ya cerró, el de las
    // 18:00 CDMX (00:00 UTC del 12) sigue abierto hasta las 17:00 CDMX.
    const now = new Date("2026-06-11T20:30:00Z");
    const lateKickoff = "2026-06-12T00:00:00Z";
    expect(isMatchOpen(KICKOFF, now)).toBe(false);
    expect(isMatchOpen(lateKickoff, now)).toBe(true);
  });
});

describe("matchDeadline", () => {
  it("es exactamente una hora antes del kickoff", () => {
    expect(matchDeadline(KICKOFF).toISOString()).toBe(
      "2026-06-11T18:00:00.000Z"
    );
  });
});

describe("isMatchLive / isMatchFinished", () => {
  const match = (finished_at: string | null) => ({
    kickoff_at: KICKOFF,
    finished_at,
  });

  it("no está en vivo antes del kickoff", () => {
    expect(isMatchLive(match(null), new Date("2026-06-11T18:59:59Z"))).toBe(false);
  });

  it("está en vivo desde el instante exacto del kickoff", () => {
    expect(isMatchLive(match(null), new Date("2026-06-11T19:00:00Z"))).toBe(true);
  });

  it("sigue en vivo horas después si el admin no lo finaliza (goles no finalizan)", () => {
    expect(isMatchLive(match(null), new Date("2026-06-11T23:00:00Z"))).toBe(true);
  });

  it("deja de estar en vivo al finalizarse, sin importar la hora", () => {
    const finished = match("2026-06-11T21:00:00Z");
    expect(isMatchLive(finished, new Date("2026-06-11T21:00:01Z"))).toBe(false);
    expect(isMatchFinished(finished)).toBe(true);
  });

  it("no finalizado nunca puntúa aunque tenga horas de terminado", () => {
    expect(isMatchFinished(match(null))).toBe(false);
  });
});

describe("toMxDate", () => {
  it("agrupa por fecha CDMX, no UTC: 00:05 UTC del 11 aún es 10 en CDMX", () => {
    expect(toMxDate(new Date("2026-06-11T00:05:00Z"))).toBe("2026-06-10");
  });
});
