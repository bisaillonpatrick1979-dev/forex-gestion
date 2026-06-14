-- Migration Supabase: activer pgvector et créer les tables
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Activer l'extension pgvector
create extension if not exists vector;

-- 2. Table des documents RAG
create table if not exists documents_rag (
  id          text primary key,
  contenu     text not null,
  vecteur     vector(1536),  -- OpenAI: 1536 | Ollama Nomic: 768
  metadata    jsonb not null default '{}',
  cree_le     timestamptz not null default now(),
  mis_a_jour  timestamptz not null default now()
);

-- Index HNSW pour la recherche vectorielle rapide
create index if not exists idx_documents_rag_vecteur
  on documents_rag
  using hnsw (vecteur vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Index sur les métadonnées pour filtrer par paire/catégorie
create index if not exists idx_documents_rag_metadata
  on documents_rag using gin (metadata);

-- 3. Table de l'historique des trades (paper trading)
create table if not exists historique_trades (
  id              uuid primary key default gen_random_uuid(),
  paire           text not null,
  direction       text not null check (direction in ('ACHAT', 'VENTE')),
  taille_position integer not null,
  prix_entree     numeric(12, 5) not null,
  prix_sortie     numeric(12, 5),
  stop_loss       numeric(12, 5) not null,
  take_profit     numeric(12, 5) not null,
  profit_perte    numeric(10, 2),
  statut          text not null default 'ouvert' check (statut in ('ouvert', 'ferme', 'annule')),
  decision_agent  jsonb,            -- Résultat complet du pipeline
  cree_le         timestamptz not null default now(),
  ferme_le        timestamptz
);

create index if not exists idx_historique_paire
  on historique_trades (paire, cree_le desc);

-- 4. Table des signaux générés par les agents
create table if not exists signaux_agents (
  id            uuid primary key default gen_random_uuid(),
  paire         text not null,
  granularite   text not null,
  direction     text not null,
  confiance     integer not null check (confiance between 0 and 100),
  analyse       jsonb not null,
  risque        jsonb,
  decision      jsonb,
  fournisseur   text not null,  -- openai | anthropic | gemini
  duree_ms      integer,
  cree_le       timestamptz not null default now()
);

create index if not exists idx_signaux_paire_date
  on signaux_agents (paire, cree_le desc);

-- 5. Fonction de recherche vectorielle
create or replace function rechercher_documents(
  vecteur_requete vector(1536),
  seuil_similarite float default 0.7,
  top_k integer default 5,
  filtre_categorie text default null,
  filtre_paire text default null
)
returns table (
  id text,
  contenu text,
  metadata jsonb,
  score float
)
language sql stable
as $$
  select
    d.id,
    d.contenu,
    d.metadata,
    1 - (d.vecteur <=> vecteur_requete) as score
  from documents_rag d
  where
    1 - (d.vecteur <=> vecteur_requete) >= seuil_similarite
    and (filtre_categorie is null or d.metadata->>'categorie' = filtre_categorie)
    and (filtre_paire is null or d.metadata->>'paire' = filtre_paire)
  order by d.vecteur <=> vecteur_requete
  limit top_k;
$$;
