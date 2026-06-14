/**
 * @forex/api-switcher
 *
 * Routeur multi-fournisseurs IA pluggable.
 * Permet de basculer entre OpenAI, Anthropic, Gemini et Ollama
 * via une variable d'environnement AI_PROVIDER.
 *
 * Architecture extensible: ajouter un fournisseur = implémenter IFournisseurIA.
 */

import { creerLogger } from '@forex/logger';
import { FournisseurOpenAI } from './providers/openai.js';
import { FournisseurAnthropic } from './providers/anthropic.js';
import { FournisseurGemini } from './providers/gemini.js';
import { FournisseurOllama } from './providers/ollama.js';
import type {
  Fournisseur,
  IFournisseurIA,
  OptionsCompletion,
  ResultatCompletion,
  ConfigRouteur,
} from './types.js';

export type { Fournisseur, IFournisseurIA, OptionsCompletion, ResultatCompletion, ConfigRouteur, Message, RoleMessage } from './types.js';

const log = creerLogger({ module: 'api-switcher' });

/** Registre de tous les fournisseurs disponibles */
const registreFournisseurs: Record<Fournisseur, () => IFournisseurIA> = {
  openai: () => new FournisseurOpenAI(),
  anthropic: () => new FournisseurAnthropic(),
  gemini: () => new FournisseurGemini(),
  ollama: () => new FournisseurOllama(),
};

/**
 * Routeur multi-fournisseurs IA.
 *
 * Utilisation:
 * ```typescript
 * const routeur = new RouteurIA();
 * const resultat = await routeur.completer({
 *   messages: [{ role: 'user', content: 'Analyse EUR/USD' }]
 * });
 * ```
 */
export class RouteurIA {
  private fournisseurPrincipal: IFournisseurIA;
  private fournisseursSecours: IFournisseurIA[];

  constructor(config?: Partial<ConfigRouteur>) {
    const nomPrincipal =
      config?.fournisseurPrincipal ??
      (process.env['AI_PROVIDER'] as Fournisseur | undefined) ??
      'openai';

    this.fournisseurPrincipal = this.creerFournisseur(nomPrincipal);
    this.fournisseursSecours = (config?.fournisseursSecours ?? []).map((f) =>
      this.creerFournisseur(f)
    );

    log.info(
      {
        principal: this.fournisseurPrincipal.nom,
        modele: this.fournisseurPrincipal.modele,
        secours: this.fournisseursSecours.map((f) => f.nom),
      },
      'Routeur IA initialisé'
    );
  }

  private creerFournisseur(nom: Fournisseur): IFournisseurIA {
    const factory = registreFournisseurs[nom];
    if (!factory) {
      throw new Error(`Fournisseur inconnu: "${nom}". Valeurs acceptées: ${Object.keys(registreFournisseurs).join(', ')}`);
    }
    return factory();
  }

  /**
   * Exécute une requête en essayant le fournisseur principal,
   * puis les fournisseurs de secours en cas d'échec.
   */
  async completer(options: OptionsCompletion): Promise<ResultatCompletion> {
    const sequence = [this.fournisseurPrincipal, ...this.fournisseursSecours];

    let derniereErreur: Error | null = null;

    for (const fournisseur of sequence) {
      if (!fournisseur.estDisponible()) {
        log.warn({ fournisseur: fournisseur.nom }, 'Fournisseur non disponible, passage au suivant');
        continue;
      }

      try {
        const resultat = await fournisseur.completer(options);
        return resultat;
      } catch (err) {
        derniereErreur = err instanceof Error ? err : new Error(String(err));
        log.warn(
          { fournisseur: fournisseur.nom, erreur: derniereErreur.message },
          'Erreur fournisseur, passage au suivant'
        );
      }
    }

    throw new Error(
      `Tous les fournisseurs ont échoué. Dernière erreur: ${derniereErreur?.message ?? 'inconnue'}`
    );
  }

  /** Retourne le nom du fournisseur actif */
  get fournisseurActif(): string {
    return this.fournisseurPrincipal.nom;
  }

  /** Retourne le modèle actif */
  get modeleActif(): string {
    return this.fournisseurPrincipal.modele;
  }
}

/**
 * Instance singleton du routeur (config depuis les variables d'environnement).
 * Utiliser cette instance dans les agents pour éviter de multiples initialisations.
 */
export const routeurIA = new RouteurIA();
