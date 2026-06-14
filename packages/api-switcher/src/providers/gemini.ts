import { GoogleGenerativeAI } from '@google/generative-ai';
import { creerLogger } from '@forex/logger';
import type { IFournisseurIA, OptionsCompletion, ResultatCompletion } from '../types.js';

const log = creerLogger({ module: 'api-switcher:gemini' });

export class FournisseurGemini implements IFournisseurIA {
  readonly nom = 'gemini' as const;
  readonly modele: string;
  private clientGenAI: GoogleGenerativeAI | null = null;

  constructor(modele?: string) {
    // gemini-1.5-flash = tier gratuit généreux de Google
    this.modele = modele ?? process.env['GEMINI_MODEL'] ?? 'gemini-1.5-flash';
  }

  estDisponible(): boolean {
    return Boolean(process.env['GEMINI_API_KEY']);
  }

  private obtenirClient(): GoogleGenerativeAI {
    if (!this.clientGenAI) {
      const cleApi = process.env['GEMINI_API_KEY'];
      if (!cleApi) throw new Error('GEMINI_API_KEY non configurée');
      this.clientGenAI = new GoogleGenerativeAI(cleApi);
    }
    return this.clientGenAI;
  }

  async completer(options: OptionsCompletion): Promise<ResultatCompletion> {
    const genAI = this.obtenirClient();
    const modele = genAI.getGenerativeModel({ model: this.modele });

    // Construire l'historique Gemini à partir des messages
    const messageSysteme = options.messages.find((m) => m.role === 'system')?.content ?? '';
    const messagesConversation = options.messages.filter((m) => m.role !== 'system');

    // Le dernier message est l'entrée courante
    const dernierMessage = messagesConversation[messagesConversation.length - 1];
    const historique = messagesConversation.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const prompt = dernierMessage?.content ?? '';
    const promptComplet = messageSysteme ? `${messageSysteme}\n\n${prompt}` : prompt;

    log.debug({ modele: this.modele }, 'Requête Gemini');

    const chat = modele.startChat({
      history: historique,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    });

    const resultat = await chat.sendMessage(promptComplet);
    const contenu = resultat.response.text();

    log.debug('Réponse Gemini reçue');

    return {
      contenu,
      fournisseur: this.nom,
      modele: this.modele,
    };
  }
}
