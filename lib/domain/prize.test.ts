import { describe, expect, it } from "vitest";
import { formatMxn, prizeDistribution, prizePool } from "./prize";

describe("prizePool", () => {
  it("10 activos → $700 (1000 menos 30%)", () => {
    expect(prizePool(10)).toBe(700);
  });

  it("0 activos → $0", () => {
    expect(prizePool(0)).toBe(0);
  });

  it("cada activación suma $70", () => {
    expect(prizePool(11) - prizePool(10)).toBe(70);
  });
});

describe("prizeDistribution (ponderado 50/30/20, posiciones ocupadas)", () => {
  it("sin empates: 350/210/140 y el resto en cero", () => {
    expect(prizeDistribution([10, 9, 8, 5], 700)).toEqual([350, 210, 140, 0]);
  });

  it("empate doble en primero: comparten 1°+2° y el siguiente cobra 3°", () => {
    const p = prizeDistribution([10, 10, 8], 700);
    expect(p[0]).toBeCloseTo(280, 6);
    expect(p[1]).toBeCloseTo(280, 6);
    expect(p[2]).toBeCloseTo(140, 6);
  });

  it("empate triple en primero: toda la bolsa entre tres; el de abajo no cobra más (caso del usuario)", () => {
    const p = prizeDistribution([10, 10, 10, 8], 700);
    expect(p[0]).toBeCloseTo(700 / 3, 6);
    expect(p[1]).toBeCloseTo(700 / 3, 6);
    expect(p[2]).toBeCloseTo(700 / 3, 6);
    expect(p[3]).toBe(0);
  });

  it("empate cuádruple en primero: bolsa completa entre cuatro", () => {
    const p = prizeDistribution([10, 10, 10, 10, 9], 700);
    for (const x of p.slice(0, 4)) expect(x).toBeCloseTo(175, 6);
    expect(p[4]).toBe(0);
  });

  it("empate en segundo: comparten 2°+3°", () => {
    const p = prizeDistribution([10, 8, 8, 7], 700);
    expect(p[0]).toBeCloseTo(350, 6);
    expect(p[1]).toBeCloseTo(175, 6);
    expect(p[2]).toBeCloseTo(175, 6);
    expect(p[3]).toBe(0);
  });

  it("empate triple en segundo: 2°+3° entre tres", () => {
    const p = prizeDistribution([10, 8, 8, 8], 700);
    expect(p[0]).toBeCloseTo(350, 6);
    for (const x of p.slice(1)) expect(x).toBeCloseTo(350 / 3, 4);
  });

  it("empate doble en el corte: comparten el 3er premio", () => {
    const p = prizeDistribution([10, 8, 7, 7], 700);
    expect(p).toEqual([350, 210, 70, 70]);
  });

  it("empate triple en el corte: minus pool aceptado (menos que el boleto)", () => {
    const p = prizeDistribution([10, 8, 7, 7, 7], 700);
    expect(p[0]).toBeCloseTo(350, 6);
    expect(p[1]).toBeCloseTo(210, 6);
    for (const x of p.slice(2)) expect(x).toBeCloseTo(140 / 3, 4);
  });

  it("todos empatados: bolsa completa entre todos (recuperan su neto)", () => {
    const p = prizeDistribution(Array(10).fill(5), 700);
    for (const x of p) expect(x).toBeCloseTo(70, 6);
  });

  it("dos participantes: pesos renormalizados 50/80 y 30/80", () => {
    const p = prizeDistribution([4, 2], 140);
    expect(p[0]).toBeCloseTo(87.5, 6);
    expect(p[1]).toBeCloseTo(52.5, 6);
  });

  it("un participante: se lleva toda la bolsa", () => {
    expect(prizeDistribution([3], 70)).toEqual([70]);
  });

  it("monotonía: más puntos nunca cobra menos", () => {
    const cases = [
      [10, 10, 10, 8],
      [10, 10, 8, 8, 7],
      [9, 9, 9, 9, 9, 1],
      [5, 4, 4, 4, 4, 1],
      [10, 8, 7, 7, 7, 6],
    ];
    for (const points of cases) {
      const p = prizeDistribution(points, 700);
      for (let i = 1; i < p.length; i++) {
        expect(p[i]).toBeLessThanOrEqual(p[i - 1] + 1e-9);
      }
    }
  });

  it("la suma repartida nunca excede la bolsa", () => {
    for (const points of [[9, 9, 9, 8, 8], [3], [5, 4, 4, 4, 4, 1], [7, 7]]) {
      const total = prizeDistribution(points, 700).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThanOrEqual(700 + 1e-9);
    }
  });
});

describe("bolsas independientes por temporada", () => {
  it("cada temporada deriva su propio pool de su propio conteo", () => {
    // grupos con 20 activos, eliminatoria con 8: pools separados, misma regla
    expect(prizePool(20)).toBe(1400);
    expect(prizePool(8)).toBe(560);
  });
});

describe("formatMxn", () => {
  it("enteros sin centavos, fracciones con dos", () => {
    expect(formatMxn(700)).toBe("$700");
    expect(formatMxn(233.333333)).toBe("$233.33");
  });
});
