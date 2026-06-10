#!/usr/bin/env node
/**
 * Crea (idempotente) la cuenta administradora: usuario en Supabase Auth +
 * perfil con rol admin y estado activo. Ver design.md D8.
 *
 * Uso: npm run seed:admin   (lee .env.local vía --env-file)
 */
import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];
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

const email = process.env.ADMIN_EMAIL;
const fullName = process.env.ADMIN_FULL_NAME ?? "Administrador";
const alias = process.env.ADMIN_ALIAS ?? "admin";

// 1. Usuario en Auth: crear, o recuperar si ya existe.
let userId;
const { data: created, error: createError } =
  await supabase.auth.admin.createUser({
    email,
    password: process.env.ADMIN_PASSWORD,
    email_confirm: true,
  });

if (createError) {
  if (createError.code !== "email_exists") {
    console.error("Error creando usuario en Auth:", createError.message);
    process.exit(1);
  }
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    console.error("Error buscando usuario existente:", listError.message);
    process.exit(1);
  }
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!existing) {
    console.error(`Auth reporta que ${email} existe pero no se encontró.`);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`Usuario Auth ya existía: ${userId}`);
} else {
  userId = created.user.id;
  console.log(`Usuario Auth creado: ${userId}`);
}

// 2. Perfil admin (upsert: re-ejecutar siempre converge al mismo estado).
const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  full_name: fullName,
  alias,
  phone: "",
  role: "admin",
  status: "active",
});

if (profileError) {
  console.error("Error en perfil admin:", profileError.message);
  process.exit(1);
}

console.log(`Listo: ${email} es admin activo (alias: ${alias}).`);
