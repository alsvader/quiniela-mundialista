/**
 * Capturas limpias para el flyer de activación (historias 9:16).
 * - Resetea el marcador del partido 1 para que la jornada se vea abierta.
 * - Oculta el badge del dev overlay de Next.js.
 * - Usa datos realistas en el registro.
 *
 * Uso: node --env-file=.env.local /tmp/qm-flyer-shots.mjs
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/qm-flyer";
mkdirSync(OUT, { recursive: true });

const stamp = String(Date.now()).slice(-6);
const email = `diego.mundial${stamp}@gmail.com`;
const alias = `DiegoFut${stamp.slice(-3)}`;

// 0. Resetear marcador del partido 1 (quedó FINAL 2-1 de corridas E2E)
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const { error: resetErr } = await supa
  .from("matches")
  .update({ home_goals: null, away_goals: null })
  .eq("id", 1);
if (resetErr) throw resetErr;
console.log("✓ marcador del partido 1 reseteado");

const browser = await chromium.launch();

async function newPage(mobile = true) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: "es-MX",
  });
  return ctx.newPage();
}

async function shot(page, name, opts = {}) {
  // quitar el badge del dev overlay antes de capturar
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log(`✓ ${name}.png`);
}

// 1. Registro con datos llenos
const user = await newPage(true);
await user.goto(`${BASE}/registro`);
await user.fill('input[name="email"]', "diego.mundial@gmail.com");
await user.fill('input[name="password"]', "••••••••••");
await user.fill('input[name="full_name"]', "Diego Ramírez");
await user.fill('input[name="alias"]', "DiegoFut");
await user.fill('input[name="phone"]', "5538214790");
await shot(user, "flyer-01-registro", { fullPage: true });

// corregir a los valores únicos reales antes de enviar
await user.fill('input[name="email"]', email);
await user.fill('input[name="password"]', "secreta123");
await user.fill('input[name="alias"]', alias);
await user.click('button[type="submit"]');
await user.waitForURL("**/partidos**", { timeout: 20000 });

// 2. Modal "Falta validar tu pago" con botón de WhatsApp
const modal = user.locator("dialog");
await modal.waitFor({ state: "visible", timeout: 10000 });
await shot(user, "flyer-02-modal-whatsapp");

// 3. Partidos en solo lectura con banner "Activar por WhatsApp"
await user.getByRole("button", { name: "Entendido" }).click();
await user.waitForURL("**/partidos", { timeout: 10000 });
await user.locator('div[role="status"]', { hasText: "pendiente de pago" }).waitFor();
await shot(user, "flyer-03-pendiente");

// 4. Admin activa la cuenta (vista desktop del panel)
const admin = await newPage(false);
await admin.goto(`${BASE}/login`);
await admin.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await admin.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await admin.click('button[type="submit"]');
await admin.waitForURL("**/admin/usuarios", { timeout: 20000 });
const row = admin.locator("tr", { hasText: alias });
await row.waitFor({ timeout: 10000 });
await shot(admin, "flyer-04-admin-antes");
await row.getByRole("button", { name: "Activar" }).click();
await row.locator("text=Activo").waitFor({ timeout: 10000 });
await shot(admin, "flyer-04-admin-activa");

// 5. Usuario recarga: L/E/V habilitados, selecciona "L" en el inaugural
await user.reload();
await user.locator('input[type="radio"]').first().waitFor({ timeout: 15000 });
const firstGroup = user.locator('[role="radiogroup"]').first();
await firstGroup.locator("label").first().click();
await shot(user, "flyer-05-pronosticos");

await browser.close();
console.log("\nListo: capturas en " + OUT);
