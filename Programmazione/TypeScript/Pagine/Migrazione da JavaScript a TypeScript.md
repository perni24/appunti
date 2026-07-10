---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, javascript, migrazione, gradual-typing]
aliases: [Migrare da JavaScript a TypeScript]
prerequisites: [Introduzione a TypeScript, tsconfig]
related: [JSDoc e type checking in JavaScript, any, unknown e never, Strict mode]
---

# Migrazione da JavaScript a TypeScript

## Sintesi

La migrazione da JavaScript a TypeScript dovrebbe essere graduale. L'obiettivo non e convertire tutto subito, ma introdurre type checking dove porta valore, ridurre `any` progressivamente e stabilizzare i confini piu importanti della codebase.

TypeScript supporta migrazioni incrementali tramite `allowJs`, `checkJs`, JSDoc, file `.d.ts` e configurazioni `strict` abilitate per passi.

## Quando usarlo

- Codebase JavaScript gia esistente.
- Progetti Node.js o frontend cresciuti senza tipi.
- Librerie interne con API poco documentate.
- Refactor rischiosi dove servono contratti piu chiari.
- Team che vuole adottare TypeScript senza bloccare lo sviluppo.

## Come funziona

La strategia tipica e:

1. Aggiungere TypeScript e `tsconfig`.
2. Abilitare `allowJs`.
3. Iniziare con type checking moderato.
4. Convertire i file piu stabili o centrali in `.ts`.
5. Tipizzare confini esterni e API pubbliche.
6. Alzare gradualmente `strict`.

## API / Sintassi

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": false
  },
  "include": ["src"]
}
```

## Esempio pratico

```ts
// Prima: user.js
export function formatUser(user) {
  return `${user.email} (${user.id})`;
}

// Dopo: user.ts
type User = {
  id: string;
  email: string;
};

export function formatUser(user: User): string {
  return `${user.email} (${user.id})`;
}
```

La conversione chiarisce il contratto della funzione e protegge i chiamanti.

## Varianti

- **Migrazione file-by-file**: converti progressivamente `.js` in `.ts`.
- **JSDoc first**: mantieni `.js` ma aggiungi tipi con commenti.
- **Strict progressivo**: abiliti opzioni rigorose una alla volta.
- **Boundary first**: tipizzi API, modelli e integrazioni prima dei dettagli interni.

## Errori comuni

- **Convertire tutto in una volta**: aumenta rischio e blocca il team.
- **Riempire il codice di `any`**: sembra migrazione, ma non aumenta sicurezza.
- **Ignorare dati esterni**: API, JSON e form restano punti critici.
- **Abilitare strict senza piano**: su codebase grandi puo produrre troppi errori insieme.

## Checklist

- Aggiungere TypeScript senza cambiare subito runtime e build.
- Tipizzare prima API pubbliche e modelli centrali.
- Usare `unknown` per input non validati.
- Ridurre `any` con priorita sui moduli piu usati.
- Alzare `strict` progressivamente e misurare gli errori rimasti.

## Collegamenti

- [[JSDoc e type checking in JavaScript]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[any, unknown e never]]
- [[Validazione runtime e tipi statici]]
