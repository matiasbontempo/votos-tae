"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente publico (anon key). Solo puede leer options/shows/tallies y
 * suscribirse a Realtime; las policies de RLS no le dan escritura en ningun
 * lado. Los votos se emiten contra /api/vote, no contra Supabase directo.
 */
let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });

  return cached;
}
