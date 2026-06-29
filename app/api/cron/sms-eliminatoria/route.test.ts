import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const URL = "https://app.test/api/cron/sms-eliminatoria";
const prev = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CRON_SECRET = "secreto-de-prueba";
});
afterEach(() => {
  process.env.CRON_SECRET = prev;
});

describe("POST /api/cron/sms-eliminatoria (autorización)", () => {
  it("rechaza con 401 sin el header del secreto", async () => {
    const res = await POST(new Request(URL, { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("rechaza con 401 con un secreto incorrecto", async () => {
    const res = await POST(
      new Request(URL, { method: "POST", headers: { "x-cron-secret": "malo" } })
    );
    expect(res.status).toBe(401);
  });

  it("rechaza con 401 si CRON_SECRET no está configurado", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(
      new Request(URL, { method: "POST", headers: { "x-cron-secret": "lo-que-sea" } })
    );
    expect(res.status).toBe(401);
  });
});
