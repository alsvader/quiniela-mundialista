import { describe, expect, it } from "vitest";
import { matchesTeam, normalizeTeamText } from "./team-filter";

const partido = { home_team: "México", away_team: "Corea del Sur" };

describe("normalizeTeamText", () => {
  it("quita acentos, mayúsculas y espacios extremos", () => {
    expect(normalizeTeamText("  MÉXICO ")).toBe("mexico");
    expect(normalizeTeamText("Túnez")).toBe("tunez");
    expect(normalizeTeamText("Japón")).toBe("japon");
  });
});

describe("matchesTeam", () => {
  it("encuentra al local sin acentos ni mayúsculas", () => {
    expect(matchesTeam("mexico", partido)).toBe(true);
    expect(matchesTeam("MEXICO", partido)).toBe(true);
    expect(matchesTeam("México", partido)).toBe(true);
  });

  it("coincide por subcadena", () => {
    expect(matchesTeam("mex", partido)).toBe(true);
    expect(matchesTeam("corea", partido)).toBe(true);
    expect(
      matchesTeam("unidos", { home_team: "Estados Unidos", away_team: "Paraguay" })
    ).toBe(true);
  });

  it("coincide contra el visitante", () => {
    expect(matchesTeam("sur", partido)).toBe(true);
  });

  it("query vacío o solo espacios = sin filtro", () => {
    expect(matchesTeam("", partido)).toBe(true);
    expect(matchesTeam("   ", partido)).toBe(true);
  });

  it("sin coincidencia devuelve false", () => {
    expect(matchesTeam("brasil", partido)).toBe(false);
    expect(matchesTeam("xyz", partido)).toBe(false);
  });
});
