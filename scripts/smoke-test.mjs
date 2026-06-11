#!/usr/bin/env node
/**
 * Prueba de humo de punta a punta contra Supabase (local o producción de prueba).
 * Recorre: registro → pendiente bloqueado → activación → pronóstico en jornada
 * abierta → rechazo en jornada cerrada → captura/corrección de marcador →
 * ranking público → desactivación. Todo con clientes anon (RLS real).
 *
 * Uso: node --env-file=.env.local scripts/smoke-test.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!URL || !ANON || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan variables de entorno (.env.local).");
  process.exit(1);
}

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✓" : "✗ FALLO"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const anon = () =>
  createClient(URL, ANON, { auth: { persistSession: false } });

const stamp = Date.now();
const email = `smoke${stamp}@test.local`;
const alias = `smoke${String(stamp).slice(-8)}`;

// ---------- 1. Registro: cuenta nueva nace pendiente ----------
const user = anon();
const { data: signUpData, error: signUpError } = await user.auth.signUp({
  email,
  password: "secreta123",
});
check("registro crea cuenta Auth", !signUpError && !!signUpData.user, signUpError?.message);
const userId = signUpData.user.id;

const { error: profileInsertError } = await user.from("profiles").insert({
  id: userId,
  full_name: "Usuario Humo",
  alias,
  phone: "5511122233",
});
check("perfil se crea (pendiente por default)", !profileInsertError, profileInsertError?.message);

const { data: ownProfile } = await user
  .from("profiles")
  .select("status, role")
  .eq("id", userId)
  .single();
check(
  "perfil nace pendiente con rol user",
  ownProfile?.status === "pending" && ownProfile?.role === "user"
);

// partido abierto de referencia (jornada futura más lejana = seguro abierta)
const { data: openMatch } = await user
  .from("matches")
  .select("id, match_date, home_team, away_team")
  .order("match_date", { ascending: false })
  .limit(1)
  .single();
check("calendario visible para usuario pendiente", !!openMatch);

// ---------- 2. Pendiente no puede guardar ----------
const { error: pendingPredictError } = await user
  .from("predictions")
  .insert({ user_id: userId, match_id: openMatch.id, pick: "H" });
check("RLS bloquea pronóstico de cuenta pendiente", !!pendingPredictError);

// ---------- 3. Admin activa la cuenta ----------
const admin = anon();
const { error: adminLoginError } = await admin.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});
check("login del admin", !adminLoginError, adminLoginError?.message);

const { error: activateError } = await admin
  .from("profiles")
  .update({ status: "active" })
  .eq("id", userId);
check("admin activa al usuario", !activateError, activateError?.message);

// ---------- 4. Activo guarda en jornada abierta; cerrada se rechaza ----------
const { error: activePredictError } = await user
  .from("predictions")
  .upsert({ user_id: userId, match_id: openMatch.id, pick: "H" });
check("cuenta activa guarda en jornada abierta", !activePredictError, activePredictError?.message);

// partido en jornada ya cerrada (hoy CDMX), creado por el admin
const todayMx = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
}).format(new Date());
const { data: closedMatch, error: closedMatchError } = await admin
  .from("matches")
  .insert({
    phase: "group_stage",
    match_date: todayMx,
    kickoff_at: new Date().toISOString(),
    home_team: "Humo FC",
    away_team: "Cerrado FC",
  })
  .select("id")
  .single();
check("admin crea partido (jornada de hoy = cerrada)", !closedMatchError, closedMatchError?.message);

const { error: closedPredictError } = await user
  .from("predictions")
  .insert({ user_id: userId, match_id: closedMatch.id, pick: "H" });
check("RLS bloquea pronóstico en jornada cerrada", !!closedPredictError);

// usuario no puede suplantar a otro
const { error: impersonateError } = await user
  .from("predictions")
  .insert({ user_id: crypto.randomUUID(), match_id: openMatch.id, pick: "H" });
check("RLS bloquea suplantación", !!impersonateError);

// usuario no puede escribir marcadores ni perfiles ajenos
const { data: scoreHack } = await user
  .from("matches")
  .update({ home_goals: 9, away_goals: 0 })
  .eq("id", openMatch.id)
  .select();
check("RLS bloquea a participante capturando marcadores", !scoreHack?.length);
const { data: statusHack } = await user
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", userId)
  .select("role");
check("RLS bloquea auto-promoción a admin", !statusHack?.length);

// ---------- 5. Captura y corrección de marcador ----------
const { error: scoreError } = await admin
  .from("matches")
  .update({ home_goals: 2, away_goals: 1 })
  .eq("id", openMatch.id);
check("admin captura marcador 2-1", !scoreError, scoreError?.message);

const publicClient = anon();
let { data: ranking } = await publicClient.rpc("ranking");
let row = ranking?.find((r) => r.alias === alias);
check("ranking público (sin sesión) muestra al usuario con 1 punto", row?.points === 1, `puntos=${row?.points}`);

const { error: fixError } = await admin
  .from("matches")
  .update({ home_goals: 1, away_goals: 1 })
  .eq("id", openMatch.id);
check("admin corrige a 1-1", !fixError);

({ data: ranking } = await publicClient.rpc("ranking"));
row = ranking?.find((r) => r.alias === alias);
check("corrección recalcula: ahora 0 puntos", row?.points === 0, `puntos=${row?.points}`);

// ---------- 6. Privacidad ----------
const { data: leakedProfiles } = await publicClient.from("profiles").select("*");
check("anon no puede leer perfiles", !leakedProfiles?.length);
const { data: leakedPredictions } = await publicClient.from("predictions").select("*");
check("anon no puede leer pronósticos", !leakedPredictions?.length);
const { data: leakedSettings } = await publicClient.from("app_settings").select("*");
check("anon no puede leer app_settings (WhatsApp del admin)", !leakedSettings?.length);
const { data: authedSettings } = await user.from("app_settings").select("value");
check("autenticado sí lee app_settings", (authedSettings?.length ?? 0) > 0);

// ---------- 7. Desactivación reversible ----------
await admin.from("profiles").update({ status: "disabled" }).eq("id", userId);
({ data: ranking } = await publicClient.rpc("ranking"));
check("desactivado desaparece del ranking", !ranking?.find((r) => r.alias === alias));

const { error: disabledPredictError } = await user
  .from("predictions")
  .upsert({ user_id: userId, match_id: openMatch.id, pick: "D" });
check("RLS bloquea pronóstico de cuenta desactivada", !!disabledPredictError);

await admin.from("profiles").update({ status: "active" }).eq("id", userId);
({ data: ranking } = await publicClient.rpc("ranking"));
check(
  "reactivación restaura puntos intactos",
  ranking?.find((r) => r.alias === alias)?.points === 0
);

// ---------- limpieza ----------
await admin.from("matches").delete().eq("id", closedMatch.id);
await admin.from("matches").update({ home_goals: null, away_goals: null }).eq("id", openMatch.id);

console.log(failures ? `\n${failures} verificaciones fallaron` : "\nTodo en orden ✓");
process.exit(failures ? 1 : 0);
