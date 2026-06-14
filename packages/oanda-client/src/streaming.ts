import { creerLogger } from '@forex/logger';
import type {
  ConfigOanda,
  EnvironnementOanda,
  PaireDevises,
  EvenementStream,
} from './types.js';

const log = creerLogger({ module: 'oanda-client:streaming' });

const URLS_STREAM: Record<EnvironnementOanda, string> = {
  practice: 'https://stream-fxpractice.oanda.com/v3',
  live: 'https://stream-fxtrade.oanda.com/v3',
};

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

    // connecter() lance throws en cas d'erreur; on intercepte ici
    this.connecter(url, signal, onEvenement).catch((err: unknown) => {
      if (signal.aborted) return;
      const erreur = err instanceof Error ? err : new Error(String(err));
      log.error({ erreur: erreur.message }, 'Erreur fatale du stream');
      onErreur?.(erreur);
    });

    return () => {
      log.info({ paires }, 'Arrêt du streaming OANDA');
      this.controleur?.abort();
      this.controleur = null;
    };
  }

  private async connecter(
    url: string,
    signal: AbortSignal,
    onEvenement: (evenement: EvenementStream) => void
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

        tampon += decodeur.decode(value, { stream: true });
        const lignes = tampon.split('\n');
        tampon = lignes.pop() ?? '';

        for (const ligne of lignes) {
          const lignePropre = ligne.trim();
          if (!lignePropre) continue;
          try {
            const evenement = JSON.parse(lignePropre) as EvenementStream;
            if (evenement.type === 'HEARTBEAT') {
              log.debug({ time: evenement.time }, 'Heartbeat OANDA');
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
