import { describe, expect, it } from "vitest";
import {
  defaultSelectedDay,
  filterJornadasByDays,
  parseDiaParam,
  resolveSelectedDays,
} from "./day-filter";

// Fechas en orden ascendente, como las claves de getJornadas.
const DATES = ["2026-06-14", "2026-06-15", "2026-06-17", "2026-06-18"];

describe("defaultSelectedDay", () => {
  it("usa hoy cuando hoy tiene partidos", () => {
    expect(defaultSelectedDay(DATES, "2026-06-15")).toBe("2026-06-15");
  });

  it("cae al próximo día con partidos cuando hoy no tiene", () => {
    // 16 no está en DATES → siguiente es 17
    expect(defaultSelectedDay(DATES, "2026-06-16")).toBe("2026-06-17");
    // antes del torneo → primer día
    expect(defaultSelectedDay(DATES, "2026-06-01")).toBe("2026-06-14");
  });

  it("devuelve null cuando todos los días ya pasaron", () => {
    expect(defaultSelectedDay(DATES, "2026-06-30")).toBeNull();
  });
});

describe("parseDiaParam", () => {
  it("conserva solo fechas válidas, deduplica y respeta el orden", () => {
    expect(parseDiaParam("2026-06-17,2026-06-14,2026-06-14", DATES)).toEqual([
      "2026-06-14",
      "2026-06-17",
    ]);
  });

  it("descarta tokens vacíos o inexistentes", () => {
    expect(parseDiaParam("2026-06-99, ,xyz,2026-06-15", DATES)).toEqual([
      "2026-06-15",
    ]);
    expect(parseDiaParam("", DATES)).toEqual([]);
  });
});

describe("resolveSelectedDays", () => {
  it("parámetro ausente → día por defecto", () => {
    expect(resolveSelectedDays(undefined, DATES, "2026-06-15")).toEqual([
      "2026-06-15",
    ]);
  });

  it("parámetro ausente sin default → vacío (Todos)", () => {
    expect(resolveSelectedDays(undefined, DATES, "2026-06-30")).toEqual([]);
  });

  it("parámetro presente vacío → Todos (selección vacía)", () => {
    expect(resolveSelectedDays("", DATES, "2026-06-15")).toEqual([]);
  });

  it("parámetro con fechas válidas → esas fechas", () => {
    expect(
      resolveSelectedDays("2026-06-14,2026-06-18", DATES, "2026-06-15")
    ).toEqual(["2026-06-14", "2026-06-18"]);
  });
});

describe("filterJornadasByDays", () => {
  const jornadas = new Map(DATES.map((d) => [d, [d]]));

  it("selección vacía devuelve el Map completo", () => {
    expect(filterJornadasByDays(jornadas, [])).toBe(jornadas);
  });

  it("filtra a los días seleccionados preservando el orden", () => {
    const out = filterJornadasByDays(jornadas, ["2026-06-18", "2026-06-15"]);
    expect([...out.keys()]).toEqual(["2026-06-15", "2026-06-18"]);
  });
});
