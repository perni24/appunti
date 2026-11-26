---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - tooling
  - linter
aliases:
  - Linter
  - Code linter
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Convenzioni di progetto]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Formatter]]"
  - "[[Programmazione/Clean Code/Pagine/Static analysis]]"
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
title: Linter
---

# Linter

## Sintesi

Un linter cerca nel sorgente violazioni di **regole attive per quel file**. Può trovare un nome non dichiarato senza eseguire una funzione. Non decide invece se la spedizione debba costare 350 o 500 centesimi: entrambi sono programmi validi per il linguaggio.

## Esempio: da quale regola arriva la diagnosi?

Progetto di prova con ESLint 10 installato localmente. Il file `eslint.config.mjs` abilita esplicitamente due regole sui moduli JavaScript:

```js
export default [{
  files: ["**/*.mjs"],
  rules: { "no-undef": "error", "prefer-const": "warn" },
}];
```

Questo `shipping.mjs` contiene sia un refuso sia una dichiarazione migliorabile:

```js
export function shippingCents(total) {
  let fee = 350;
  return total >= 2000 ? 0 : fees;
}
```

```sh
npx --no-install eslint --max-warnings 0 shipping.mjs
```

`no-undef` segnala `fees`: non esiste in questo scope. Sta a chi conosce il codice decidere se la risposta corretta sia `fee`. `prefer-const` segnala che il binding `fee` non viene riassegnato; si può dichiarare `const`. La correzione automatica disponibile per una regola non implica che ogni altra diagnosi abbia una correzione automatica sicura.

## Interpretare il risultato

- Con il refuso c'è almeno un errore e il controllo fallisce. Correggendo solo `fees` rimane un warning: il comando mostrato fallisce ancora **per la soglia zero**, non perché un warning sia sempre bloccante.
- Dopo entrambe le correzioni il comando passa. Cambiando `>=` in `>` continuerà a passare con queste regole: il linter non conosce il contratto della tariffa.
- Prima di sopprimere una diagnosi verifica regola, file inclusi e ambiente. Un file ignorato o una regola spenta non sono prove di correttezza. Ricontrolla il diff dopo `--fix`; non mescolare riscritture estese con una correzione di logica.

Per altri linguaggi lo stesso principio si applica a Ruff e Clippy; regole e correzioni non sono intercambiabili. Per ESLint vedi [[Programmazione/JavaScript/Pagine/ESLint|la scheda di configurazione]].

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Formatter|Formatter]]
- [[Programmazione/Clean Code/Pagine/Static analysis|Static analysis]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]
- [[Programmazione/Clean Code/Pagine/Pre-commit hooks|Pre-commit hooks]]

## Fonti

- ESLint Documentation
- Ruff Documentation
- Clippy Documentation
- [ESLint: no-undef](https://eslint.org/docs/latest/rules/no-undef)
- [ESLint: CLI, autofix e soglia dei warning](https://eslint.org/docs/latest/use/command-line-interface)
