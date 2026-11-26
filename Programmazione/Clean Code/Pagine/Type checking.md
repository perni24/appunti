---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - tooling
  - type-checking
aliases:
  - Type checking
  - Controllo dei tipi
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Static analysis]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
title: Type checking
---

# Type checking

## Sintesi

Un type checker verifica relazioni tra i tipi **che il programma dichiara o che può inferire**. Non osserva automaticamente il JSON che arriverà domani. In TypeScript `type UserId = string` è un alias: migliora il nome, ma non impedisce di passare una comune stringa o un altro identificativo anch'esso alias di `string`.

## Esempio: un ID controllato al confine

In `user-id.ts`, il costruttore accetta `unknown`, verifica a runtime il formato deciso dall'applicazione e restituisce un identificativo riconoscibile dal compilatore. Il contratto di esempio è una sequenza di 1–16 cifre ASCII; gli zeri iniziali sono significativi.

```ts
declare const userIdTag: unique symbol;
export type UserId = string & { readonly [userIdTag]: true };

export function parseUserId(value: unknown): UserId {
  if (typeof value !== "string" || value.length === 0 ||
      value.length > 16 || /[^0-9]/.test(value)) {
    throw new TypeError("UserId deve contenere da 1 a 16 cifre");
  }
  return value as UserId;
}

export function userPath(id: UserId): string {
  return "/users/" + id;
}
```

Con TypeScript 5.9 installato nel progetto di prova, controlla il modulo senza generare JavaScript:

```sh
npx --no-install tsc --strict --noEmit user-id.ts
```

`userPath(parseUserId("007"))` produce `/users/007`; `userPath("007")` è invece rifiutato dal compilatore. `parseUserId(7)` **deve compilare** perché il parametro è `unknown`: è la guardia a rifiutare il numero durante l'esecuzione. Il marchio non aggiunge una proprietà alla stringa e non dimostra che l'utente esista nell'archivio.

## Errori comuni

Un'asserzione `as UserId` applicata direttamente alla risposta esterna aggira l'intento del controllo. Nell'esempio l'asserzione è confinata al punto in cui è stato appena verificato il formato. Mantieni distinti i test delle diagnosi statiche, quelli sugli input al runtime e quelli dell'accesso ai dati. Il type checking è utile anche con tipi graduali in Python o con nuovi tipi in Rust, ma le garanzie dipendono dal linguaggio e dalla configurazione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Static analysis|Static analysis]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]

## Fonti

- TypeScript Handbook
- Python Documentation, *typing*
- Rust Book, *The Type System*
- [TypeScript: type aliases e type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript: narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript: noEmit](https://www.typescriptlang.org/tsconfig/noEmit.html)
