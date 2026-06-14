import { NextResponse } from 'next/server';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:health' });

/**
 * GET /api/health
 * Vérifie le statut du système et des fournisseurs configurés.
 */
export async function GET(): Promise<NextResponse> {
  log.debug('Vérification de santé demandée');

  const statut = {
    statut: 'ok',
    version: process.env['npm_package_version'] ?? '0.1.0',
    horodatage: new Date().toISOString(),
    environnement: process.env['NODE_ENV'] ?? 'development',
    fournisseurs: {
      ia: {
        actif: process.env['AI_PROVIDER'] ?? 'openai',
        openai: Boolean(process.env['OPENAI_API_KEY']),
        anthropic: Boolean(process.env['ANTHROPIC_API_KEY']),
        gemini: Boolean(process.env['GEMINI_API_KEY']),
        ollama: Boolean(process.env['OLLAMA_BASE_URL']),
      },
      oanda: {
        configure: Boolean(process.env['OANDA_API_KEY'] && process.env['OANDA_ACCOUNT_ID']),
        environnement: process.env['OANDA_ENV'] ?? 'practice',
      },
      embeddings: {
        fournisseur: process.env['EMBEDDING_PROVIDER'] ?? 'openai',
      },
    },
  };

  return NextResponse.json(statut);
}
