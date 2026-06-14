# @forex/api-switcher

Routeur multi-fournisseurs IA pluggable. Bascule entre OpenAI, Anthropic, Gemini et Ollama
via `AI_PROVIDER` dans les variables d'environnement.

## Usage

```typescript
import { RouteurIA, routeurIA } from '@forex/api-switcher';

// Utiliser le singleton (config depuis .env)
const resultat = await routeurIA.completer({
  messages: [
    { role: 'system', content: 'Tu es un expert en analyse technique forex.' },
    { role: 'user', content: 'Analyse la paire EUR/USD sur 4H.' },
  ],
});

console.log(resultat.contenu);
console.log(`Traité par: ${resultat.fournisseur} (${resultat.modele})`);

// Créer un routeur personnalisé avec fallback
const routeur = new RouteurIA({
  fournisseurPrincipal: 'gemini',
  fournisseursSecours: ['openai', 'anthropic'],
});
```

## Ajouter un fournisseur

1. Implémenter `IFournisseurIA` dans `src/providers/mon-fournisseur.ts`
2. L'enregistrer dans `registreFournisseurs` dans `src/index.ts`
3. Ajouter son type à `Fournisseur` dans `src/types.ts`

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `AI_PROVIDER` | `openai` | Fournisseur actif |
| `OPENAI_API_KEY` | — | Clé OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modèle OpenAI |
| `ANTHROPIC_API_KEY` | — | Clé Anthropic |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` | Modèle Anthropic |
| `GEMINI_API_KEY` | — | Clé Gemini |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Modèle Gemini |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL Ollama local |
| `OLLAMA_MODEL` | `llama3.2` | Modèle Ollama |
