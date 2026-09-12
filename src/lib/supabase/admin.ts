import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only contexts (API routes, cron jobs) that
// must read/write across all users and bypass RLS. Never import this from
// client components — SUPABASE_SERVICE_ROLE_KEY must never reach the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
