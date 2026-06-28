import { describe, expect, it } from "vitest";
import type { MatchPhase } from "@/lib/types";
import {
  isTemporada,
  temporadaDeFase,
  TEMPORADA_POR_DEFECTO,
  toTemporada,
} from "./temporada";

describe("temporadaDeFase", () => {
  it("group_stage es grupos", () => {
    expect(temporadaDeFase("group_stage")).toBe("grupos");
  });

  it("todas las rondas eliminatorias son eliminatoria", () => {
    const eliminatorias: MatchPhase[] = [
      "round_of_32",
      "round_of_16",
      "quarter_final",
      "semi_final",
      "third_place",
      "final",
    ];
    for (const phase of eliminatorias) {
      expect(temporadaDeFase(phase)).toBe("eliminatoria");
    }
  });
});

describe("isTemporada", () => {
  it("acepta los dos valores válidos", () => {
    expect(isTemporada("grupos")).toBe(true);
    expect(isTemporada("eliminatoria")).toBe(true);
  });

  it("rechaza basura, vacío y null", () => {
    expect(isTemporada("octavos")).toBe(false);
    expect(isTemporada("")).toBe(false);
    expect(isTemporada(null)).toBe(false);
    expect(isTemporada(undefined)).toBe(false);
  });
});

describe("toTemporada", () => {
  it("cae al default seguro cuando el valor es inválido", () => {
    expect(toTemporada("xxx")).toBe(TEMPORADA_POR_DEFECTO);
    expect(toTemporada(null)).toBe("grupos");
  });

  it("conserva un valor válido", () => {
    expect(toTemporada("eliminatoria")).toBe("eliminatoria");
  });
});
