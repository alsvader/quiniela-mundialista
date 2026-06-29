#!/usr/bin/env node
/**
 * Genera (o rota) el CRON_SECRET y lo escribe en el archivo de entorno indicado.
 * El secreto protege /api/cron/sms-eliminatoria: el endpoint lo exige en el
 * header x-cron-secret (ver supabase/migrations/0014_sms_cron_job.sql).
 *
 * Uso:
 *   node scripts/rotate-cron-secret.mjs local   # escribe en .env.local
 *   node scripts/rotate-cron-secret.mjs prod    # escribe en .env.prod.local
 *   npm run rotate:cron-secret -- local
 *
 * Reemplaza la línea CRON_SECRET= existente conservando el resto del archivo; si
 * no existe la añade. Nunca commitea: estos archivos están en .gitignore.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TARGETS = {
  local: ".env.local",
  prod: ".env.prod.local",
};

const env = process.argv[2];
if (!env || !(env in TARGETS)) {
  console.error("Indica el entorno: 'local' o 'prod'.");
  console.error("Ej: node scripts/rotate-cron-secret.mjs local");
  process.exit(1);
}

const file = resolve(process.cwd(), TARGETS[env]);
const secret = randomBytes(32).toString("hex");
const line = `CRON_SECRET=${secret}`;

let contents = existsSync(file) ? readFileSync(file, "utf8") : "";
const hadSecret = /^CRON_SECRET=.*$/m.test(contents);

if (hadSecret) {
  contents = contents.replace(/^CRON_SECRET=.*$/m, line);
} else {
  // Añade con salto de línea previo si el archivo no termina en uno.
  const sep = contents === "" || contents.endsWith("\n") ? "" : "\n";
  contents += `${sep}${line}\n`;
}

writeFileSync(file, contents, "utf8");

console.log(`${hadSecret ? "Rotado" : "Generado"} CRON_SECRET en ${TARGETS[env]}`);
console.log(secret);

if (env === "prod") {
  console.log("\nReplica este MISMO valor en producción:");
  console.log("  1. Vercel → Settings → Environment Variables → CRON_SECRET");
  console.log("  2. Supabase Vault (SQL editor):");
  console.log(`       select vault.update_secret(id, '${secret}')`);
  console.log("       from vault.secrets where name = 'cron_secret';");
  console.log("     (o vault.create_secret('<valor>', 'cron_secret') la primera vez)");
}
