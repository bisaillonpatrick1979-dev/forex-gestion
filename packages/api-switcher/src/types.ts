/**
 * Types partagés pour le routeur multi-fournisseurs IA
 */

/** Fournisseurs IA supportés */
export type Fournisseur = 'openai' | 'anthropic' | 'gemini' | 'ollama';

/** Rôle d'un message dans la conversation */
export type RoleMessage = 'system' | 'user' | 'assistant';

/** Un message dans le contexte de conversation */
export interface Message {
  role: RoleMessage;
  content: string;
}

/** Options pour une requête de completion */
export interface OptionsCompletion {
  /** Messages de la conversation */
  messages: Message[];
  /** Température (0.0 = déterministe, 2.0 = créatif) */
  temperature?: number;
  /** Nombre maximum de tokens à générer */
  maxTokens?: number;
  /** Activer le streaming de la réponse */
  stream?: boolean;
}

/** Résultat d'une requête de completion */
export interface ResultatCompletion {
  /** Contenu de la réponse */
  contenu: string;
  /** Fournisseur ayant traité la requête */
  fournisseur: Fournisseur;
  /** Modèle utilisé */
  modele: string;
  /** Statistiques d'utilisation */
  utilisation?: {
    tokensEntree: number;
    tokensSortie: number;
    tokensTotal: number;
  };
}

/** Interface que chaque fournisseur doit implémenter */
export interface IFournisseurIA {
  /** Nom du fournisseur */
  readonly nom: Fournisseur;
  /** Modèle actif */
  readonly modele: string;
  /** Vérifie si le fournisseur est disponible (clé API configurée, etc.) */
  estDisponible(): boolean;
  /** Exécute une requête de completion */
  completer(options: OptionsCompletion): Promise<ResultatCompletion>;
}

/** Configuration du routeur */
export interface ConfigRouteur {
  /** Fournisseur principal à utiliser */
  fournisseurPrincipal: Fournisseur;
  /** Fournisseurs de secours si le principal échoue */
  fournisseursSecours?: Fournisseur[];
}
