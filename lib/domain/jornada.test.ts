import { describe, expect, it } from "vitest";
import { isJornadaOpen, jornadaDeadline, toMxDate } from "./jornada";

// CDMX es UTC-6 todo el año (sin horario de verano desde 2022).
// 23:59:59 del 10 de junio CDMX = 05:59:59 UTC del 11 de junio.
const JORNADA = "2026-06-11";

describe("isJornadaOpen", () => {
  it("está abierta el día anterior a las 23:59:59 CDMX", () => {
    const now = new Date("2026-06-11T05:59:59Z"); // 10 jun 23:59:59 CDMX
    expect(isJornadaOpen(JORNADA, now)).toBe(true);
  });

  it("está cerrada exactamente a las 00:00:00 CDMX del día de la jornada", () => {
    const now = new Date("2026-06-11T06:00:00Z"); // 11 jun 00:00:00 CDMX
    expect(isJornadaOpen(JORNADA, now)).toBe(false);
  });

  it("está abierta varios días antes", () => {
    expect(isJornadaOpen(JORNADA, new Date("2026-06-01T12:00:00Z"))).toBe(true);
  });

  it("está cerrada durante y después del día de la jornada", () => {
    expect(isJornadaOpen(JORNADA, new Date("2026-06-11T20:00:00Z"))).toBe(false);
    expect(isJornadaOpen(JORNADA, new Date("2026-06-12T00:00:00Z"))).toBe(false);
  });

  it("no se deja engañar por la fecha UTC: a las 18:05 CDMX del día 10 aún es 11 en UTC", () => {
    // 11 jun 00:05 UTC = 10 jun 18:05 CDMX → la jornada del 11 sigue abierta
    const now = new Date("2026-06-11T00:05:00Z");
    expect(toMxDate(now)).toBe("2026-06-10");
    expect(isJornadaOpen(JORNADA, now)).toBe(true);
  });
});

describe("jornadaDeadline", () => {
  it("el cierre es la medianoche CDMX del día de la jornada", () => {
    expect(jornadaDeadline(JORNADA).toISOString()).toBe(
      "2026-06-11T06:00:00.000Z"
    );
  });
});
