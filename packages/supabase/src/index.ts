/**
 * @forex/supabase
 *
 * Client Supabase pour forex-gestion:
 * - Base vectorielle pgvector pour le RAG
 * - Persistance des trades (paper trading + live)
 * - Historique des signaux agents
 *
 * Prérequis: Lancer la migration SQL dans Supabase Dashboard
 * Fichier: packages/supabase/migrations/001_init_pgvector.sql
 */

export { obtenirClientSupabase, obtenirClientSupabaseAdmin } from './client.js';
export type { SchemaDB } from './client.js';
export { BaseVectorielleSupabase } from './vecteurs.js';
export { DepotTrades } from './trades.js';
export type { NouveauTrade, FermetureTrade } from './trades.js';
