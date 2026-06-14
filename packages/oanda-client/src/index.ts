/**
 * @forex/oanda-client
 *
 * Client officiel OANDA v20 — REST + Streaming.
 * Supporte les environnements practice et live.
 */

import { creerLogger } from '@forex/logger';
import { ClientRestOanda } from './rest.js';
import { ClientStreamOanda } from './streaming.js';
import type { ConfigOanda, EnvironnementOanda } from './types.js';

export { ClientRestOanda } from './rest.js';
export { ClientStreamOanda } from './streaming.js';
export type {
  ConfigOanda,
  EnvironnementOanda,
  PaireDevises,
  Granularite,
  Bougie,
  OptionsBougies,
  Compte,
  ParamsOrdreMarche,
  ReponseOrdre,
  Cotation,
  HeartbeatStream,
  EvenementStream,
  SensTrade,
} from './types.js';

const log = creerLogger({ module: 'oanda-client' });

/**
 * Crée les clients REST et Streaming OANDA depuis les variables d'environnement.
 * Lance une erreur si OANDA_API_KEY ou OANDA_ACCOUNT_ID ne sont pas définis.
 */
export function creerClientsOanda(): { rest: ClientRestOanda; stream: ClientStreamOanda } {
  const cleApi = process.env['OANDA_API_KEY'];
  const idCompte = process.env['OANDA_ACCOUNT_ID'];
  const environnement = (process.env['OANDA_ENV'] ?? 'practice') as EnvironnementOanda;

  if (!cleApi || !idCompte) {
    throw new Error('OANDA_API_KEY et OANDA_ACCOUNT_ID doivent être configurés dans les variables d\'environnement');
  }

  const config: ConfigOanda = { cleApi, idCompte, environnement };

  log.info({ environnement, compte: idCompte }, 'Clients OANDA créés');

  return {
    rest: new ClientRestOanda(config),
    stream: new ClientStreamOanda(config),
  };
}
