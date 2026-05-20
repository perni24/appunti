---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - tooling
  - linting
aliases: []
prerequisites: []
related: []
---

# ESLint

## Sintesi

**ESLint** e uno strumento di linting per JavaScript. Analizza il codice staticamente e segnala errori, pattern rischiosi, violazioni di stile e problemi di qualita.

## Concetto chiave

ESLint non esegue il codice: lo legge come AST e applica regole configurabili.

```powershell
npx eslint .
```

## Cosa controlla

- Variabili non usate.
- Import errati.
- Uso sospetto di `==`.
- Errori con Promise o async.
- Regole di progetto.

## Configurazione

Nei progetti moderni ESLint usa spesso una configurazione `eslint.config.js`.

```javascript
export default [
  {
    rules: {
      "no-unused-vars": "warn",
      "eqeqeq": "error"
    }
  }
];
```

## Rapporto con Prettier

ESLint dovrebbe occuparsi soprattutto di qualita e correttezza. [[Programmazione/JavaScript/Pagine/Prettier|Prettier]] dovrebbe occuparsi della formattazione.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Prettier|Prettier]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]


