import Anthropic from '@anthropic-ai/sdk';
import { creerLogger } from '@forex/logger';
import type { IFournisseurIA, OptionsCompletion, ResultatCompletion } from '../types.js';

const log = creerLogger({ module: 'api-switcher:anthropic' });

export class FournisseurAnthropic implements IFournisseurIA {
  readonly nom = 'anthropic' as const;
  readonly modele: string;
  private client: Anthropic | null = null;

  constructor(modele?: string) {
    // claude-haiku-4-5 = modèle rapide et économique d'Anthropic
    this.modele = modele ?? process.env['ANTHROPIC_MODEL'] ?? 'claude-haiku-4-5-20251001';
  }

  estDisponible(): boolean {
    return Boolean(process.env['ANTHROPIC_API_KEY']);
  }

  private obtenirClient(): Anthropic {
    if (!this.client) {
      const cleApi = process.env['ANTHROPIC_API_KEY'];
      if (!cleApi) throw new Error('ANTHROPIC_API_KEY non configurée');
      this.client = new Anthropic({ apiKey: cleApi });
    }
    return this.client;
  }

  async completer(options: OptionsCompletion): Promise<ResultatCompletion> {
    const client = this.obtenirClient();

    // Anthropic sépare le message système des messages utilisateur
    const messageSysteme = options.messages.find((m) => m.role === 'system')?.content;
    const messagesConversation = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    log.debug({ modele: this.modele, nbMessages: messagesConversation.length }, 'Requête Anthropic');

    const reponse = await client.messages.create({
      model: this.modele,
      max_tokens: options.maxTokens ?? 2048,
      system: messageSysteme,
      messages: messagesConversation,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    });

    const contenu = reponse.content
      .filter((bloc) => bloc.type === 'text')
      .map((bloc) => (bloc.type === 'text' ? bloc.text : ''))
      .join('');

    log.debug({ tokensTotal: reponse.usage.input_tokens + reponse.usage.output_tokens }, 'Réponse Anthropic reçue');

    return {
      contenu,
      fournisseur: this.nom,
      modele: this.modele,
      utilisation: {
        tokensEntree: reponse.usage.input_tokens,
        tokensSortie: reponse.usage.output_tokens,
        tokensTotal: reponse.usage.input_tokens + reponse.usage.output_tokens,
      },
    };
  }
}
