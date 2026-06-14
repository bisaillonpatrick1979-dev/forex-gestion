import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'supabase:client' });

/** Typage de la base de données Supabase */
export interface SchemaDB {
  public: {
    Tables: {
      documents_rag: {
        Row: {
          id: string;
          contenu: string;
          vecteur: number[] | null;
          metadata: Record<string, unknown>;
          cree_le: string;
          mis_a_jour: string;
        };
        Insert: {
          id: string;
          contenu: string;
          vecteur?: number[] | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          contenu?: string;
          vecteur?: number[] | null;
          metadata?: Record<string, unknown>;
          mis_a_jour?: string;
        };
      };
      historique_trades: {
        Row: {
          id: string;
          paire: string;
          direction: 'ACHAT' | 'VENTE';
          taille_position: number;
          prix_entree: number;
          prix_sortie: number | null;
          stop_loss: number;
          take_profit: number;
          profit_perte: number | null;
          statut: 'ouvert' | 'ferme' | 'annule';
          decision_agent: Record<string, unknown> | null;
          cree_le: string;
          ferme_le: string | null;
        };
        Insert: {
          paire: string;
          direction: 'ACHAT' | 'VENTE';
          taille_position: number;
          prix_entree: number;
          stop_loss: number;
          take_profit: number;
          decision_agent?: Record<string, unknown>;
        };
        Update: {
          prix_sortie?: number;
          profit_perte?: number;
          statut?: 'ouvert' | 'ferme' | 'annule';
          ferme_le?: string;
        };
      };
      signaux_agents: {
        Row: {
          id: string;
          paire: string;
          granularite: string;
          direction: string;
          confiance: number;
          analyse: Record<string, unknown>;
          risque: Record<string, unknown> | null;
          decision: Record<string, unknown> | null;
          fournisseur: string;
          duree_ms: number | null;
          cree_le: string;
        };
        Insert: {
          paire: string;
          granularite: string;
          direction: string;
          confiance: number;
          analyse: Record<string, unknown>;
          risque?: Record<string, unknown> | null;
          decision?: Record<string, unknown> | null;
          fournisseur: string;
          duree_ms?: number | null;
        };
        Update: Record<string, never>;
      };
    };
    Functions: {
      rechercher_documents: {
        Args: {
          vecteur_requete: number[];
          seuil_similarite?: number;
          top_k?: number;
          filtre_categorie?: string | null;
          filtre_paire?: string | null;
        };
        Returns: Array<{
          id: string;
          contenu: string;
          metadata: Record<string, unknown>;
          score: number;
        }>;
      };
    };
  };
}

let clientInstance: SupabaseClient<SchemaDB> | null = null;

/**
 * Retourne le client Supabase singleton.
 * Lance une erreur si SUPABASE_URL ou SUPABASE_ANON_KEY ne sont pas définis.
 */
export function obtenirClientSupabase(): SupabaseClient<SchemaDB> {
  if (clientInstance) return clientInstance;

  const url = process.env['SUPABASE_URL'];
  const cleAnon = process.env['SUPABASE_ANON_KEY'];

  if (!url || !cleAnon) {
    throw new Error(
      'SUPABASE_URL et SUPABASE_ANON_KEY doivent être configurées dans les variables d\'environnement'
    );
  }

  clientInstance = createClient<SchemaDB>(url, cleAnon, {
    auth: { persistSession: false },
  });

  log.info({ url }, 'Client Supabase initialisé');
  return clientInstance;
}

/**
 * Client avec clé service (admin) — uniquement en server-side.
 * Ne jamais exposer au client browser.
 */
export function obtenirClientSupabaseAdmin(): SupabaseClient<SchemaDB> {
  const url = process.env['SUPABASE_URL'];
  const cleService = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !cleService) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le client admin');
  }

  return createClient<SchemaDB>(url, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
