import { creerLogger } from '@forex/logger';
import type {
  ConfigOanda,
  EnvironnementOanda,
  PaireDevises,
  EvenementStream,
} from './types.js';

const log = creerLogger({ module: 'oanda-client:streaming' });

/** URLs de streaming selon l'environnement */
const URLS_STREAM: Record<EnvironnementOanda, string> = {
  practice: 'https://stream-fxpractice.oanda.com/v3',
  live: 'https://stream-fxtrade.oanda.com/v3',
};

/**
 * Client de streaming OANDA.
 * Ouvre une connexion HTTP persistante pour recevoir les cotations en temps réel.
 *
 * @exemple
 * const stream = new ClientStreamOanda(config);
 * const arreter = stream.abonner(['EUR_USD', 'GBP_USD'], (cotation) => {
 *   console.log(cotation.bids[0].price);
 * });
 * // Plus tard:
 * arreter();
 */
export class ClientStreamOanda {
  private readonly urlBase: string;
  private readonly idCompte: string;
  private readonly entetes: Record<string, string>;
  private controleur: AbortController | null = null;

  constructor(config: ConfigOanda) {
    this.urlBase = URLS_STREAM[config.environnement];
    this.idCompte = config.idCompte;
    this.entetes = {
      Authorization: `Bearer ${config.cleApi}`,
      Accept: 'application/octet-stream',
    };
  }

  /**
   * S'abonne aux cotations en temps réel pour les paires spécifiées.
   * Retourne une fonction pour arrêter le stream.
   */
  abonner(
    paires: PaireDevises[],
    onEvenement: (evenement: EvenementStream) => void,
    onErreur?: (erreur: Error) => void
  ): () => void {
    this.controleur = new AbortController();
    const signal = this.controleur.signal;

    const params = new URLSearchParams({ instruments: paires.join(',') });
    const url = `${this.urlBase}/accounts/${this.idCompte}/pricing/stream?${params.toString()}`;

    log.info({ paires }, 'Démarrage du streaming OANDA');

    // Lancer la connexion de manière asynchrone
    this.connecter(url, signal, onEvenement, onErreur).catch((err: unknown) => {
      if (signal.aborted) return; // arrêt normal
      const erreur = err instanceof Error ? err : new Error(String(err));
      log.error({ erreur: erreur.message }, 'Erreur fatale du stream');
      onErreur?.(erreur);
    });

    // Retourner la fonction d'arrêt
    return () => {
      log.info({ paires }, 'Arrêt du streaming OANDA');
      this.controleur?.abort();
      this.controleur = null;
    };
  }

  private async connecter(
    url: string,
    signal: AbortSignal,
    onEvenement: (evenement: EvenementStream) => void,
    onErreur?: (erreur: Error) => void
  ): Promise<void> {
    const reponse = await fetch(url, { headers: this.entetes, signal });

    if (!reponse.ok || !reponse.body) {
      throw new Error(`Erreur stream OANDA ${reponse.status}`);
    }

    const lecteur = reponse.body.getReader();
    const decodeur = new TextDecoder();
    let tampon = '';

    try {
      while (true) {
        const { done, value } = await lecteur.read();
        if (done || signal.aborted) break;

        // Décoder le chunk et accumuler dans le tampon
        tampon += decodeur.decode(value, { stream: true });

        // Traiter les lignes complètes (séparées par \n)
        const lignes = tampon.split('\n');
        tampon = lignes.pop() ?? ''; // garder la ligne incomplète

        for (const ligne of lignes) {
          const lignePropre = ligne.trim();
          if (!lignePropre) continue;

          try {
            const evenement = JSON.parse(lignePropre) as EvenementStream;

            // Ignorer les heartbeats silencieusement (ou les loguer en debug)
            if (evenement.type === 'HEARTBEAT') {
              log.debug({ time: evenement.time }, 'Heartbeat OANDA');
              onEvenement(evenement);
              continue;
            }

            onEvenement(evenement);
          } catch {
            log.warn({ ligne: lignePropre }, 'Ligne de stream non parsable');
          }
        }
      }
    } finally {
      lecteur.releaseLock();
    }
  }
}
