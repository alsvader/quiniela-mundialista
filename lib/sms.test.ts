import { describe, expect, it } from "vitest";
import { buildEliminatoriaSmsText, normalizeMxPhone, SMS_MAX_LEN } from "./sms";

describe("normalizeMxPhone", () => {
  it("acepta 10 dígitos limpios", () => {
    expect(normalizeMxPhone("4771234567")).toBe("4771234567");
  });

  it("limpia espacios, guiones y paréntesis", () => {
    expect(normalizeMxPhone(" (477) 123-45 67 ")).toBe("4771234567");
  });

  it("recorta la lada de país 52 (12 dígitos)", () => {
    expect(normalizeMxPhone("524771234567")).toBe("4771234567");
    expect(normalizeMxPhone("+52 477 123 4567")).toBe("4771234567");
  });

  it("rechaza longitudes que no quedan en 10 dígitos", () => {
    expect(normalizeMxPhone("12345")).toBeNull();
    expect(normalizeMxPhone("47712345678")).toBeNull(); // 11 dígitos
  });

  it("rechaza vacío, nulo y sin dígitos", () => {
    expect(normalizeMxPhone("")).toBeNull();
    expect(normalizeMxPhone(null)).toBeNull();
    expect(normalizeMxPhone(undefined)).toBeNull();
    expect(normalizeMxPhone("sin numero")).toBeNull();
  });
});

describe("buildEliminatoriaSmsText", () => {
  const text = buildEliminatoriaSmsText({ home: "México", away: "Brasil" });

  it("incluye ambos equipos (sin acentos) y la URL completa, no acortada", () => {
    expect(text).toContain("Mexico vs Brasil");
    expect(text).toContain("https://www.quinielamundialistas.com/partidos");
  });

  it("quita acentos (Unicode bajaría el límite a 70 chars)", () => {
    expect(text).not.toMatch(/[áéíóúñ]/i);
  });

  it("no contiene emojis (encarecen por segmentación)", () => {
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });

  it("respeta el tope de 160 caracteres", () => {
    expect(text.length).toBeLessThanOrEqual(SMS_MAX_LEN);
  });

  it("cae a respaldo sin nombres cuando los equipos exceden 160", () => {
    const long = buildEliminatoriaSmsText({
      home: "Equipo con un nombre absurdamente largo de prueba",
      away: "Otro equipo igualmente larguisimo para forzar el respaldo",
    });
    expect(long.length).toBeLessThanOrEqual(SMS_MAX_LEN);
    expect(long).toContain("https://www.quinielamundialistas.com/partidos");
  });
});
