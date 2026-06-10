#!/usr/bin/env node
/**
 * Verificación visual de punta a punta contra el dev server + Supabase local.
 * Recorre el flujo del spec por la UI real y guarda capturas en /tmp/qm-shots.
 *
 * Uso: node --env-file=.env.local scripts/ui-e2e.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const SHOTS = "/tmp/qm-shots";
mkdirSync(SHOTS, { recursive: true });

const stamp = String(Date.now()).slice(-8);
const email = `ui${stamp}@test.local`;
const alias = `ui${stamp}`;

let failures = 0;
function check(name, ok) {
  console.log(`${ok ? "✓" : "✗ FALLO"}  ${name}`);
  if (!ok) failures++;
}

const browser = await chromium.launch();

async function newPage(mobile = false) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    locale: "es-MX",
  });
  return ctx.newPage();
}

// ---------- 0. Admin configura su WhatsApp por la UI ----------
const admin = await newPage();
await admin.goto(`${BASE}/login`);
await admin.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await admin.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await admin.click('button[type="submit"]');
await admin.waitForURL("**/admin/usuarios", { timeout: 20000 });
check("login admin → /admin/usuarios", admin.url().includes("/admin/usuarios"));

await admin.goto(`${BASE}/admin/configuracion`);
await admin.fill('input[name="whatsapp_number"]', "5512345678");
await admin.getByRole("button", { name: "Guardar" }).click();
await admin.locator("text=✓ Guardado").waitFor({ timeout: 10000 });
check("admin configura número de WhatsApp", true);
await admin.screenshot({ path: `${SHOTS}/00-admin-config.png`, fullPage: false });

// ---------- 1. Registro por la UI ----------
const user = await newPage(true); // móvil primero
await user.goto(`${BASE}/registro`);
await user.screenshot({ path: `${SHOTS}/01-registro.png`, fullPage: true });
await user.fill('input[name="email"]', email);
await user.fill('input[name="password"]', "secreta123");
await user.fill('input[name="full_name"]', "Usuaria de Prueba");
await user.fill('input[name="alias"]', alias);
await user.fill('input[name="phone"]', "5511223344");
await user.click('button[type="submit"]');
await user.waitForURL("**/partidos**", { timeout: 20000 });
check("registro → redirige a partidos", user.url().includes("/partidos"));
check("llega con aviso de pago", user.url().includes("aviso=pago"));

// ---------- 2. Modal y banner de pendiente ----------
const modal = user.locator("dialog");
await modal.waitFor({ state: "visible", timeout: 10000 });
check("modal de pago pendiente visible", await modal.isVisible());
await user.screenshot({ path: `${SHOTS}/02-modal-pendiente.png`, fullPage: false });
await user.getByRole("button", { name: "Entendido" }).click();
await user.waitForURL("**/partidos", { timeout: 10000 });

const banner = user.locator('div[role="status"]', {
  hasText: "pendiente de pago",
});
check("banner persistente visible", await banner.isVisible());
const bannerText = await banner.textContent();
check(
  "banner advierte pérdida de jornadas",
  /se pierden sin recurso/i.test(bannerText ?? "")
);
const waHref = await user
  .locator('a[href^="https://wa.me/"]')
  .first()
  .getAttribute("href")
  .catch(() => null);
check(
  "deep link de WhatsApp con datos prellenados",
  !!waHref && waHref.includes(encodeURIComponent("Usuaria de Prueba"))
);
check(
  "pendiente ve partidos en solo lectura (sin selector L/E/V)",
  (await user.locator('input[type="radio"]').count()) === 0
);

async function readPool(page) {
  const text = await page
    .locator("text=Bolsa acumulada")
    .locator("..")
    .textContent();
  return Number((text?.match(/\$\s?([\d,]+)/)?.[1] ?? "").replace(/,/g, ""));
}
const poolBefore = await readPool(user);
check("bolsa acumulada visible junto al encabezado", Number.isFinite(poolBefore));
await user.screenshot({ path: `${SHOTS}/03-partidos-pendiente.png`, fullPage: false });

// ---------- 3. Admin activa por la UI ----------
await admin.goto(`${BASE}/admin/usuarios`);
await admin.screenshot({ path: `${SHOTS}/04-admin-usuarios.png`, fullPage: false });

const row = admin.locator("tr", { hasText: alias });
await row.getByRole("button", { name: "Activar" }).click();
await row.locator("text=Activo").waitFor({ timeout: 10000 });
check("admin activa al usuario desde la tabla", true);

// ---------- 4. Usuario activo pronostica la jornada ----------
await user.reload();
const poolAfter = await readPool(user);
check(
  `bolsa sube $70 al activar (de $${poolBefore} a $${poolAfter})`,
  poolAfter === poolBefore + 70
);
check(
  "banner desaparece al activarse",
  !(await user
    .locator('div[role="status"]', { hasText: "pendiente de pago" })
    .isVisible()
    .catch(() => false))
);
// jornada del 11 de junio: 2 partidos, radios visibles
const radios = user.locator('input[type="radio"]');
check("selector L/E/V disponible", (await radios.count()) > 0);

// banderas: cada partido muestra la de ambos países (SVG local)
const flags = user.locator('img[src^="/flags/"]');
check("banderas visibles en el calendario", (await flags.count()) >= 4);
check(
  "bandera de México presente en el partido inaugural",
  (await user.locator('img[src="/flags/mx.svg"]').count()) >= 1
);

// elige "L" (gana local) en cada partido de la primera jornada abierta
const firstForm = user.locator("form", { hasText: "Guardar jornada" }).first();
const groups = firstForm.locator('[role="radiogroup"]');
const nGroups = await groups.count();
for (let i = 0; i < nGroups; i++) {
  await groups.nth(i).locator("label").first().click();
}
await user.screenshot({ path: `${SHOTS}/05-jornada-seleccionada.png`, fullPage: false });
await firstForm.getByRole("button", { name: /Guardar jornada/ }).click();
await user
  .locator("text=Jornada guardada")
  .first()
  .waitFor({ timeout: 15000 });
check("jornada guardada por la UI", true);
await user.screenshot({ path: `${SHOTS}/06-jornada-guardada.png`, fullPage: false });

// ---------- 5. Admin captura marcador del partido 1 (México 2-1) ----------
await admin.goto(`${BASE}/admin/partidos`);
const scoreForm = admin.locator("form", { has: admin.locator('input[name="match_id"][value="1"]') });
await scoreForm.locator('input[name="home_goals"]').fill("2");
await scoreForm.locator('input[name="away_goals"]').fill("1");
await scoreForm.getByRole("button", { name: /Guardar|Corregir/ }).click();
await scoreForm.locator('[role="status"]').waitFor({ timeout: 10000 });
check("admin captura marcador 2-1", true);
check(
  "banderas visibles en la lista del admin",
  (await admin.locator('img[src^="/flags/"]').count()) >= 4
);
await admin.screenshot({ path: `${SHOTS}/07-admin-partidos.png`, fullPage: false });

// ---------- 6. Puntos y ranking ----------
await user.goto(`${BASE}/mis-puntos`);
const total = await user.locator("text=/^[0-9]+$/").first().textContent();
check(`mis puntos muestra 1 punto (vale ${total?.trim()})`, total?.trim() === "1");
await user.screenshot({ path: `${SHOTS}/08-mis-puntos.png`, fullPage: false });

const publicPage = await newPage(true);
await publicPage.goto(`${BASE}/ranking`);
const rankRow = publicPage.locator("li", { hasText: alias });
check("ranking público (sin sesión) muestra al alias", await rankRow.isVisible());
check(
  "con 1 punto",
  /1\s*PTS/i.test((await rankRow.textContent()) ?? "")
);
const publicPool = await readPool(publicPage);
check(
  `bolsa visible en ranking público sin sesión y coincide ($${publicPool})`,
  publicPool === poolAfter
);
await publicPage.screenshot({ path: `${SHOTS}/09-ranking-publico.png`, fullPage: false });

// ---------- 7. Acceso: participante no entra a /admin ----------
await user.goto(`${BASE}/admin/usuarios`);
await user.waitForURL("**/partidos", { timeout: 15000 });
check("participante redirigido fuera de /admin", user.url().includes("/partidos"));

// limpieza: revertir marcador para no ensuciar el entorno local
await admin.goto(`${BASE}/admin/partidos`);
await browser.close();

console.log(failures ? `\n${failures} verificaciones fallaron` : "\nUI verificada ✓");
process.exit(failures ? 1 : 0);
