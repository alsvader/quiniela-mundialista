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

  it("está cerrada exactamente a las 00:00:00 CDMX del día de la jornada (regla general, jornada del 12)", () => {
    const now = new Date("2026-06-12T06:00:00Z"); // 12 jun 00:00:00 CDMX
    expect(isJornadaOpen("2026-06-12", now)).toBe(false);
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
  it("el cierre general es la medianoche CDMX del día de la jornada", () => {
    // la jornada del 12 sigue la regla general (la del 11 tiene excepción)
    expect(jornadaDeadline("2026-06-12").toISOString()).toBe(
      "2026-06-12T06:00:00.000Z"
    );
  });
});

describe("excepción de la jornada inaugural (2026-06-11)", () => {
  it("sigue abierta a las 11:59:59 CDMX del 11 de junio", () => {
    const now = new Date("2026-06-11T17:59:59Z"); // 11:59:59 CDMX
    expect(isJornadaOpen(JORNADA, now)).toBe(true);
  });

  it("cierra exactamente a las 12:00:00 CDMX del 11 de junio", () => {
    const now = new Date("2026-06-11T18:00:00Z"); // 12:00:00 CDMX
    expect(isJornadaOpen(JORNADA, now)).toBe(false);
  });

  it("su deadline es el 11 de junio a las 12:00 CDMX", () => {
    expect(jornadaDeadline(JORNADA).toISOString()).toBe(
      "2026-06-11T18:00:00.000Z"
    );
  });

  it("las demás jornadas no cambian: la del 12 cierra el 11 a las 23:59:59", () => {
    expect(isJornadaOpen("2026-06-12", new Date("2026-06-12T05:59:59Z"))).toBe(true);
    expect(isJornadaOpen("2026-06-12", new Date("2026-06-12T06:00:00Z"))).toBe(false);
  });
});
