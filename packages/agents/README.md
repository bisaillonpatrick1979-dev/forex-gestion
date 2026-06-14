# @forex/agents

Les 3 agents IA spécialisés du système forex-gestion.

## Architecture

```
analyserMarche() → calculerParametresRisque() → deciderExecution()
     Agent 1              Agent 2                    Agent 3
```

## Usage

### Pipeline complet

```typescript
import { executerPipelineComplet } from '@forex/agents';
import { creerClientsOanda } from '@forex/oanda-client';

const { rest } = creerClientsOanda();
const bougies = await rest.obtenirBougies('EUR_USD', { granularite: 'H4', count: 100 });

const resultat = await executerPipelineComplet(
  { paire: 'EUR_USD', bougies, granularite: 'H4' },
  10000, // capital disponible
  0      // positions ouvertes
);

console.log(resultat.decision?.statut); // EXECUTER | ATTENDRE | REJETER
```

### Agents individuels

```typescript
import { analyserMarche, calculerParametresRisque, deciderExecution } from '@forex/agents';

// 1. Analyse technique
const analyse = await analyserMarche({ paire: 'EUR_USD', bougies, granularite: 'H4' });

// 2. Gestion des risques
const risque = await calculerParametresRisque(analyse, capitalDisponible: 10000);

// 3. Décision finale
const decision = await deciderExecution(analyse, risque);
```

## Agents

| Agent | Rôle | Température IA |
|-------|------|----------------|
| Analyste Technique | Signaux directionnels, niveaux clés | 0.3 |
| Gestionnaire des Risques | Sizing, stop loss, take profit | 0.1 |
| Exécuteur | Décision finale EXECUTER/ATTENDRE/REJETER | 0.2 |
