# @forex/logger

Logging structuré pour le système forex-gestion, basé sur [Pino](https://getpino.io).

## Usage

```typescript
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'mon-module' });

log.info('Service démarré');
log.error({ err }, 'Erreur critique');
log.debug({ payload }, 'Données reçues');
```

## Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Niveau minimum |
| `NODE_ENV` | `development` | Active pino-pretty en dev |
