import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'supabase:client' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientSupabase = SupabaseClient<any>;

let clientInstance: ClientSupabase | null = null;

/**
 * Retourne le client Supabase singleton (clé anon, lecture seule en RLS).
 * Lance une erreur si SUPABASE_URL ou SUPABASE_ANON_KEY ne sont pas définis.
 */
export function obtenirClientSupabase(): ClientSupabase {
  if (clientInstance) return clientInstance;

  const url = process.env['SUPABASE_URL'];
  const cleAnon = process.env['SUPABASE_ANON_KEY'];

  if (!url || !cleAnon) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_ANON_KEY doivent être configurées"
    );
  }

  clientInstance = createClient(url, cleAnon, {
    auth: { persistSession: false },
  });

  log.info({ url }, 'Client Supabase initialisé');
  return clientInstance;
}

/**
 * Client admin avec SERVICE_ROLE_KEY (contourne RLS).
 * Ne jamais exposer côté browser.
 */
export function obtenirClientSupabaseAdmin(): ClientSupabase {
  const url = process.env['SUPABASE_URL'];
  const cleService = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !cleService) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le client admin');
  }

  return createClient(url, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
