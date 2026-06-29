import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service role (bypassa RLS), SOLO para server-side sin sesión de
 * usuario: el endpoint del cron de SMS (app/api/cron/sms-eliminatoria) lee el
 * padrón de teléfonos y escribe el ledger sin un usuario autenticado. Nunca debe
 * importarse desde código que corra en el cliente ni desde Server Actions de
 * usuario (esas usan lib/supabase/server con RLS).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin."
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
