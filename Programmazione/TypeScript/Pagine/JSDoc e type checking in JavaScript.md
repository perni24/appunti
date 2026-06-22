---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, jsdoc, javascript, checkjs]
aliases: [JSDoc TypeScript, checkJs]
prerequisites: [Migrazione da JavaScript a TypeScript]
related: [Typing di librerie JavaScript, Dichiarazioni e file d.ts]
---

# JSDoc e type checking in JavaScript

## Sintesi

TypeScript puo controllare file JavaScript usando JSDoc e l'opzione `checkJs`. Questo permette di ottenere parte dei benefici del type checking senza convertire subito i file in `.ts`.

E una strategia utile per migrazioni graduali o per progetti che vogliono restare JavaScript.

## Quando usarlo

- Migrazione incrementale da JavaScript.
- Progetti JS che non vogliono build TypeScript.
- Librerie piccole dove JSDoc documenta gia le API.
- File legacy che non conviene convertire subito.
- Controllo statico leggero su funzioni importanti.

## Come funziona

Con `allowJs`, TypeScript include file `.js`. Con `checkJs`, li controlla. I commenti JSDoc forniscono tipi per parametri, ritorni, oggetti e generics semplici.

## API / Sintassi

```js
// @ts-check

/**
 * @param {string} name
 * @returns {string}
 */
function greet(name) {
  return `Ciao ${name}`;
}
```

## Esempio pratico

```js
// @ts-check

/**
 * @typedef {{ id: string, email: string }} User
 */

/**
 * @param {User} user
 * @returns {string}
 */
export function formatUser(user) {
  return `${user.email} (${user.id})`;
}
```

TypeScript controlla che `user` abbia `id` ed `email` stringa.

## Varianti

- **`// @ts-check`**: abilita controllo su singolo file.
- **`checkJs`**: abilita controllo per file JS inclusi.
- **`@param` / `@returns`**: tipi per funzioni.
- **`@typedef`**: definisce una forma dati.
- **`@template`**: generics in JSDoc.

## Errori comuni

- **Pensare che JSDoc sia potente quanto `.ts`**: alcune espressioni sono meno ergonomiche.
- **Scrivere tipi troppo verbosi nei commenti**: peggiora leggibilita.
- **Non abilitare `checkJs` o `@ts-check`**: i commenti non vengono controllati.
- **Usare JSDoc per sempre durante una migrazione**: a volte conviene convertire i file centrali.

## Checklist

- Usare `@ts-check` nei file piu importanti.
- Tipizzare parametri e ritorni delle funzioni pubbliche.
- Usare `@typedef` per oggetti ripetuti.
- Convertire a `.ts` quando i tipi diventano complessi.
- Mantenere JSDoc e implementazione allineati.

## Collegamenti

- [[Migrazione da JavaScript a TypeScript]]
- [[Typing di librerie JavaScript]]
- [[Dichiarazioni e file d.ts]]
