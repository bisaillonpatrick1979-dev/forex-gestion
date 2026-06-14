import pino, { type Logger, type LoggerOptions } from 'pino';

// Niveau de log par défaut selon l'environnement
const niveauDefaut = process.env['LOG_LEVEL'] ?? (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug');

/**
 * Options de création d'un logger enfant
 */
export interface OptionsLogger {
  /** Nom du module/service pour identifier la source du log */
  module: string;
  /** Contexte additionnel toujours inclus dans les logs */
  contexte?: Record<string, unknown>;
}

/**
 * Crée la configuration Pino selon l'environnement.
 * En développement: sortie colorée via pino-pretty.
 * En production: JSON brut pour ingestion par les systèmes de logs.
 */
function creerConfigPino(): LoggerOptions {
  const estProduction = process.env['NODE_ENV'] === 'production';

  if (estProduction) {
    return {
      level: niveauDefaut,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ niveau: label }),
      },
    };
  }

  return {
    level: niveauDefaut,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageKey: 'msg',
      },
    },
  };
}

// Instance racine partagée
const loggerRacine: Logger = pino(creerConfigPino());

/**
 * Crée un logger enfant lié à un module spécifique.
 * Chaque log inclura automatiquement le nom du module.
 *
 * @exemple
 * const log = creerLogger({ module: 'oanda-client' });
 * log.info('Connexion établie');
 * log.error({ erreur }, 'Impossible de se connecter');
 */
export function creerLogger(options: OptionsLogger): Logger {
  return loggerRacine.child({
    module: options.module,
    ...options.contexte,
  });
}

/**
 * Logger par défaut pour usage rapide sans configuration.
 * Préférer creerLogger() pour les modules avec contexte.
 */
export const logger: Logger = loggerRacine;

// Ré-export du type Logger de Pino pour usage dans d'autres packages
export type { Logger };
