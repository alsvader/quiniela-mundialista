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

describe("prizeDistribution", () => {
  it("sin empates: tres partes iguales y el resto en cero", () => {
    const prizes = prizeDistribution([10, 8, 6, 5, 2], 700);
    expect(prizes[0]).toBeCloseTo(700 / 3, 2);
    expect(prizes[1]).toBeCloseTo(700 / 3, 2);
    expect(prizes[2]).toBeCloseTo(700 / 3, 2);
    expect(prizes[3]).toBe(0);
    expect(prizes[4]).toBe(0);
  });

  it("empate en el corte (10,8,7,7): los empatados comparten la parte del 3er lugar", () => {
    const prizes = prizeDistribution([10, 8, 7, 7], 700);
    expect(prizes[0]).toBeCloseTo(233.33, 2);
    expect(prizes[1]).toBeCloseTo(233.33, 2);
    expect(prizes[2]).toBeCloseTo(116.67, 2);
    expect(prizes[3]).toBeCloseTo(116.67, 2);
    expect(prizes.reduce((a, b) => a + b, 0)).toBeCloseTo(700, 6);
  });

  it("empate doble que abarca dos porciones (10,7,7,2): comparten 2do y 3er lugar", () => {
    const prizes = prizeDistribution([10, 7, 7, 2], 700);
    expect(prizes[0]).toBeCloseTo(700 / 3, 6);
    // dos empatados ocupan posiciones 2 y 3 → dos porciones entre dos
    expect(prizes[1]).toBeCloseTo(700 / 3, 6);
    expect(prizes[2]).toBeCloseTo(700 / 3, 6);
    expect(prizes[3]).toBe(0);
  });

  it("todos empatados: bolsa completa entre todos por igual", () => {
    const prizes = prizeDistribution([5, 5, 5, 5, 5], 700);
    for (const p of prizes) expect(p).toBeCloseTo(140, 6);
  });

  it("menos participantes que lugares: se reparte entre los que hay", () => {
    const prizes = prizeDistribution([4, 2], 140);
    expect(prizes[0]).toBe(70);
    expect(prizes[1]).toBe(70);
  });

  it("la suma repartida nunca excede la bolsa", () => {
    for (const points of [[9, 9, 9, 8, 8], [3], [5, 4, 4, 4, 4, 1]]) {
      const total = prizeDistribution(points, 700).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThanOrEqual(700 + 1e-9);
    }
  });
});

describe("formatMxn", () => {
  it("enteros sin centavos, fracciones con dos", () => {
    expect(formatMxn(700)).toBe("$700");
    expect(formatMxn(233.333333)).toBe("$233.33");
  });
});
