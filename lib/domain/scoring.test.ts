import { describe, expect, it } from "vitest";
import { deriveResult, scorePrediction } from "./scoring";

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

describe("scorePrediction", () => {
  it("acierto vale 1 sin importar el marcador: 1-0 y 5-0 valen lo mismo", () => {
    expect(scorePrediction("H", 1, 0)).toBe(1);
    expect(scorePrediction("H", 5, 0)).toBe(1);
  });

  it("error vale 0", () => {
    expect(scorePrediction("D", 2, 1)).toBe(0);
    expect(scorePrediction("A", 2, 1)).toBe(0);
  });

  it("sin pronóstico vale 0", () => {
    expect(scorePrediction(null, 2, 1)).toBe(0);
    expect(scorePrediction(undefined, 0, 0)).toBe(0);
  });

  it("corregir el marcador cambia el resultado derivado: de 2-1 a 1-1", () => {
    expect(scorePrediction("H", 2, 1)).toBe(1);
    expect(scorePrediction("H", 1, 1)).toBe(0);
    expect(scorePrediction("D", 1, 1)).toBe(1);
  });
});
