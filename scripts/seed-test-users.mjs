#!/usr/bin/env node
/**
 * Siembra usuarios de PRUEBA para ejercitar la activación por temporada
 * (change fase-eliminatoria-temporada). Idempotente: re-ejecutar converge al
 * mismo estado. SOLO para entornos locales/QA.
 *
 * Uso: npm run seed:test-users   (lee .env.local vía --env-file)
 *
 * Estados sembrados:
 *  - Pendientes sin participación  -> confirma su pago (grupos o eliminatoria)
 *  - Activos con participación en grupos -> agrégales la eliminatoria
 */
import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Faltan variables de entorno: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PASSWORD = "prueba-2026";

// status = estado de cuenta (profiles); participaciones = temporadas activas.
const users = [
  // Recién registrados, sin pagar nada: para confirmar pago desde cero.
  { alias: "ana",   full_name: "Ana Torres",     phone: "5512000001", status: "pending", participaciones: [] },
  { alias: "beto",  full_name: "Beto Ramírez",   phone: "5512000002", status: "pending", participaciones: [] },
  { alias: "cami",  full_name: "Cami Soto",      phone: "5512000003", status: "pending", participaciones: [] },
  // Ya jugaron grupos (como los migrados): para agregarles la eliminatoria.
  { alias: "diego", full_name: "Diego Luna",     phone: "5512000004", status: "active",  participaciones: ["grupos"] },
  { alias: "evi",   full_name: "Evi Mendoza",    phone: "5512000005", status: "active",  participaciones: ["grupos"] },
  // Ya pagó ambas temporadas: control "todo activo".
  { alias: "fer",   full_name: "Fer Castillo",   phone: "5512000006", status: "active",  participaciones: ["grupos", "eliminatoria"] },
];

async function ensureAuthUser(email) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!error) return created.user.id;
  if (error.code !== "email_exists") throw new Error(error.message);
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!existing) throw new Error(`${email} existe pero no se encontró.`);
  return existing.id;
}

for (const u of users) {
  const email = `${u.alias}@test.local`;
  const id = await ensureAuthUser(email);

  const { error: pErr } = await supabase.from("profiles").upsert({
    id,
    full_name: u.full_name,
    alias: u.alias,
    phone: u.phone,
    role: "user",
    status: u.status,
  });
  if (pErr) throw new Error(`perfil ${u.alias}: ${pErr.message}`);

  if (u.participaciones.length) {
    const rows = u.participaciones.map((temporada) => ({
      user_id: id,
      temporada,
      status: "active",
    }));
    const { error: partErr } = await supabase
      .from("participaciones")
      .upsert(rows, { onConflict: "user_id,temporada" });
    if (partErr) throw new Error(`participaciones ${u.alias}: ${partErr.message}`);
  }

  const parts = u.participaciones.length ? u.participaciones.join("+") : "sin pago";
  console.log(`✓ ${u.alias.padEnd(6)} ${email.padEnd(20)} cuenta:${u.status.padEnd(8)} ${parts}`);
}

console.log(`\nListo. Contraseña de todos: ${PASSWORD}`);
