import { creerLogger } from '@forex/logger';
import type { IFournisseurIA, OptionsCompletion, ResultatCompletion } from '../types.js';

const log = creerLogger({ module: 'api-switcher:ollama' });

/**
 * Stub Ollama — sera activé après réception du PC local.
 * Utilise l'API REST native d'Ollama (pas de dépendance externe requise).
 */
export class FournisseurOllama implements IFournisseurIA {
  readonly nom = 'ollama' as const;
  readonly modele: string;
  private readonly urlBase: string;

  constructor(modele?: string) {
    this.modele = modele ?? process.env['OLLAMA_MODEL'] ?? 'llama3.2';
    this.urlBase = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
  }

  estDisponible(): boolean {
    // Ollama n'est disponible qu'en local — jamais sur Vercel
    return process.env['OLLAMA_BASE_URL'] !== undefined && process.env['NODE_ENV'] !== 'production';
  }

  async completer(options: OptionsCompletion): Promise<ResultatCompletion> {
    if (!this.estDisponible()) {
      throw new Error('Ollama non disponible (mode cloud ou URL non configurée)');
    }

    log.debug({ modele: this.modele, urlBase: this.urlBase }, 'Requête Ollama');

    const reponse = await fetch(`${this.urlBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modele,
        messages: options.messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2048,
        },
      }),
    });

    if (!reponse.ok) {
      throw new Error(`Erreur Ollama HTTP ${reponse.status}: ${await reponse.text()}`);
    }

    const donnees = (await reponse.json()) as {
      message: { content: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    log.debug({ evalCount: donnees.eval_count }, 'Réponse Ollama reçue');

    return {
      contenu: donnees.message.content,
      fournisseur: this.nom,
      modele: this.modele,
      utilisation: donnees.prompt_eval_count !== undefined
        ? {
            tokensEntree: donnees.prompt_eval_count,
            tokensSortie: donnees.eval_count ?? 0,
            tokensTotal: (donnees.prompt_eval_count) + (donnees.eval_count ?? 0),
          }
        : undefined,
    };
  }
}
