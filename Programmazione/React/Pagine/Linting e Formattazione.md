---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
difficulty: beginner
tags: [react, linting, formatting, tooling]
aliases: [Linting React, Formattazione React, ESLint, Prettier]
prerequisites: []
related: []
---

# Linting e Formattazione

## Sintesi

Linting e formattazione mantengono il codice React coerente, leggibile e meno soggetto a errori. ESLint segnala problemi; Prettier o formatter equivalenti normalizzano lo stile.

## Quando usarlo

Sempre in progetti React non banali. Diventa essenziale con team, TypeScript, hook, test, design system e CI.

## Come funziona

ESLint controlla regole:

```bash
npm run lint
```

Prettier formatta:

```bash
npm run format
```

Le regole React Hooks aiutano a rispettare dipendenze e uso corretto degli hook.

## API / Sintassi

Script:

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Config:

```js
export default [
  // config ESLint
];
```

## Esempio pratico

Workflow:

1. formatter automatico in editor;
2. lint prima del commit;
3. lint e format check in CI;
4. regole hook sempre attive;
5. eccezioni documentate.

## Varianti

- **ESLint**: regole statiche.
- **Prettier**: formattazione.
- **TypeScript ESLint**: regole typed.
- **eslint-plugin-react-hooks**: Rules of Hooks.
- **React Compiler lint**: regole collegate a pattern ottimizzabili.
- **pre-commit/CI**: enforcement.

## Errori comuni

- Disabilitare regole senza motivo.
- Avere formatter in conflitto con linter.
- Non eseguire controlli in CI.
- Ignorare regole hooks.
- Applicare regole troppo severe senza valore.

## Checklist

- Lint e format sono negli script?
- L'editor usa la stessa config?
- CI esegue i controlli?
- Le regole hooks sono attive?
- Le eccezioni sono rare e commentate?
- Il formatter evita discussioni manuali?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Introduzione e Toolchain]]
- [[useEffect]]
- [[React Compiler]]
- [[Feature-based architecture]]
