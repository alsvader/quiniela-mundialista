import { describe, expect, it } from "vitest";
import { deriveResult, officialResult, scorePrediction } from "./scoring";

describe("deriveResult", () => {
  it("más goles del local → gana local", () => {
    expect(deriveResult(2, 1)).toBe("H");
    expect(deriveResult(5, 0)).toBe("H");
  });

  it("mismos goles → empate, incluido el 0-0", () => {
    expect(deriveResult(0, 0)).toBe("D");
    expect(deriveResult(3, 3)).toBe("D");
  });

  it("más goles del visitante → gana visitante", () => {
    expect(deriveResult(0, 1)).toBe("A");
  });
});

describe("officialResult — grupos (derivado de goles)", () => {
  it("deriva L/E/V del marcador", () => {
    expect(officialResult("grupos", 2, 1, null)).toBe("H");
    expect(officialResult("grupos", 1, 1, null)).toBe("D");
    expect(officialResult("grupos", 0, 1, null)).toBe("A");
  });

  it("sin goles capturados → null (no determinado)", () => {
    expect(officialResult("grupos", null, null, null)).toBeNull();
  });
});

describe("officialResult — eliminatoria (quién avanza)", () => {
  it("el resultado oficial es 'avanza', no los goles", () => {
    // empate a 90' pero avanza el visitante (penales)
    expect(officialResult("eliminatoria", 1, 1, "A")).toBe("A");
    // marcador definido coherente con avanza
    expect(officialResult("eliminatoria", 2, 0, "H")).toBe("H");
  });

  it("sin 'avanza' definido → null aunque haya goles", () => {
    expect(officialResult("eliminatoria", 1, 1, null)).toBeNull();
    expect(officialResult("eliminatoria", null, null, null)).toBeNull();
  });
});

describe("scorePrediction", () => {
  it("acierto vale 1, error vale 0", () => {
    expect(scorePrediction("H", "H")).toBe(1);
    expect(scorePrediction("D", "H")).toBe(0);
    expect(scorePrediction("A", "H")).toBe(0);
  });

  it("sin pronóstico o sin resultado oficial vale 0", () => {
    expect(scorePrediction(null, "H")).toBe(0);
    expect(scorePrediction(undefined, "D")).toBe(0);
    expect(scorePrediction("H", null)).toBe(0);
  });

  it("eliminatoria: acierta quien predice al que avanza pese a empate 1-1", () => {
    const oficial = officialResult("eliminatoria", 1, 1, "A");
    expect(scorePrediction("A", oficial)).toBe(1);
    expect(scorePrediction("H", oficial)).toBe(0);
  });

  it("eliminatoria finalizada sin ganador definido no puntúa", () => {
    const oficial = officialResult("eliminatoria", 1, 1, null);
    expect(scorePrediction("A", oficial)).toBe(0);
    expect(scorePrediction("H", oficial)).toBe(0);
  });

  it("grupos: corregir el marcador cambia el resultado (2-1 → 1-1)", () => {
    expect(scorePrediction("H", officialResult("grupos", 2, 1, null))).toBe(1);
    expect(scorePrediction("H", officialResult("grupos", 1, 1, null))).toBe(0);
    expect(scorePrediction("D", officialResult("grupos", 1, 1, null))).toBe(1);
  });
});
