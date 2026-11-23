import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedBrowserClient) return cachedBrowserClient;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    return null;
  }

  cachedBrowserClient = createBrowserClient(url, key);
  return cachedBrowserClient;
}

export function isBrowserSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();
  return Boolean(url && key);
}
