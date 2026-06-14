import OpenAI from 'openai';
import { creerLogger } from '@forex/logger';
import type { IFournisseurIA, OptionsCompletion, ResultatCompletion } from '../types.js';

const log = creerLogger({ module: 'api-switcher:openai' });

export class FournisseurOpenAI implements IFournisseurIA {
  readonly nom = 'openai' as const;
  readonly modele: string;
  private client: OpenAI | null = null;

  constructor(modele?: string) {
    this.modele = modele ?? process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini';
  }

  estDisponible(): boolean {
    return Boolean(process.env['OPENAI_API_KEY']);
  }

  private obtenirClient(): OpenAI {
    if (!this.client) {
      const cleApi = process.env['OPENAI_API_KEY'];
      if (!cleApi) throw new Error('OPENAI_API_KEY non configurée');
      this.client = new OpenAI({ apiKey: cleApi });
    }
    return this.client;
  }

  async completer(options: OptionsCompletion): Promise<ResultatCompletion> {
    const client = this.obtenirClient();

    log.debug({ modele: this.modele, nbMessages: options.messages.length }, 'Requête OpenAI');

    const reponse = await client.chat.completions.create({
      model: this.modele,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    });

    const contenu = reponse.choices[0]?.message?.content ?? '';
    const utilisation = reponse.usage;

    log.debug({ tokensTotal: utilisation?.total_tokens }, 'Réponse OpenAI reçue');

    return {
      contenu,
      fournisseur: this.nom,
      modele: this.modele,
      utilisation: utilisation
        ? {
            tokensEntree: utilisation.prompt_tokens,
            tokensSortie: utilisation.completion_tokens,
            tokensTotal: utilisation.total_tokens,
          }
        : undefined,
    };
  }
}
