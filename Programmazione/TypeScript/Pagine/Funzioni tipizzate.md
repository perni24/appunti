---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - funzioni
  - type-annotations
aliases:
  - Funzioni tipizzate TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo]]"
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Firme di funzione e overload]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
title: Funzioni tipizzate
---

# Funzioni tipizzate

## Sintesi

Le funzioni tipizzate dichiarano il tipo dei parametri e, quando utile, il tipo del valore restituito. Sono uno dei punti piu importanti di TypeScript, perche una funzione e spesso il confine tra parti diverse del programma.

Tipizzare bene una funzione significa rendere chiaro cosa accetta, cosa produce e quali errori il compilatore puo intercettare prima del runtime.

## Quando usarlo

- Funzioni esportate da un modulo.
- Callback passate a librerie o framework.
- Funzioni che ricevono oggetti complessi.
- Funzioni pubbliche usate da piu parti della codebase.
- Funzioni dove il ritorno deve rimanere stabile nel tempo.

## Come funziona

I parametri vengono annotati con `: Tipo`. Il ritorno puo essere inferito, ma per API pubbliche o funzioni complesse conviene dichiararlo esplicitamente.

TypeScript controlla che chi chiama la funzione passi valori compatibili e che il corpo della funzione restituisca il tipo dichiarato.

Gli esempi sono indipendenti e usano **TypeScript 5.9.3, strict e target ES2022**. Le annotazioni non validano input esterni e non descrivono automaticamente eccezioni, permessi o effetti collaterali.

- Un parametro `value?: string` puo essere omesso o ricevere `undefined`; nel corpo va gestito anche quel caso.
- Un parametro con default usa il default quando manca o vale `undefined`, non quando vale `null`.
- Un rest parameter come `...values: number[]` raccoglie zero o piu argomenti.
- Una callback puo ricevere il tipo dal contesto: non serve annotare sempre ogni parametro.

## API / Sintassi

```ts
function sum(a: number, b: number): number {
  return a + b;
}

const formatUser = (name: string, age: number): string => {
  return `${name} (${age})`;
};
```

Default, opzionali e rest, in un blocco autonomo:

```ts
function greet(name: string, prefix = "Ciao", suffix?: string): string {
  return `${prefix} ${name}${suffix ?? ""}`;
}

function sumAll(...values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

console.log(greet("Luca", undefined, "!")); // Ciao Luca!
console.log(sumAll()); // 0
// greet("Luca", null); // Errore con strictNullChecks.
```

`number` non esclude NaN, infinita o arrotondamenti: `sumAll` illustra la firma, non un calcolo contabile.

## Esempio pratico

Filtro locale di utenti gia tipizzati. La callback decide chi selezionare; non sono inviati messaggi e non vengono validati indirizzi email.

```ts
type User = {
  id: string;
  email: string;
  active: boolean;
};

type UserPredicate = (user: User) => boolean;

function selectUserIds(
  users: readonly User[],
  predicate: UserPredicate,
): string[] {
  return users.filter(predicate).map(user => user.id);
}

const users: User[] = [
  { id: "u_1", email: "luca@example.com", active: true },
  { id: "u_2", email: "marta@example.com", active: false },
];
const activeIds = selectUserIds(users, user => user.active);
console.log(activeIds); // ["u_1"]
```

Il parametro della callback viene inferito come `User`. Il corpo di `selectUserIds` non modifica l'array, ma il tipo non garantisce la purezza della callback: questa potrebbe modificare gli oggetti ricevuti.

### void e asincronia

Una firma di callback che restituisce `void` permette di ignorare il risultato di una funzione che produce un valore:

```ts
const names: string[] = [];
const collect: (name: string) => void = name => names.push(name);
collect("Luca"); // Il valore numerico di push viene ignorato dal chiamante.

function logName(name: string): void {
  console.log(name);
  // return 1; // Errore: qui il corpo dichiara esplicitamente void.
}
```

Non significa che ogni funzione esplicitamente annotata `: void` possa restituire qualunque valore. Inoltre una callback `async` puo essere accettata dove e attesa una callback `void`: il chiamante potrebbe non attendere la Promise ne gestirne il rifiuto. Per il lavoro asincrono definisci un contratto `Promise<T>` e attendilo:

```ts
async function resolveLabel(): Promise<string> {
  return "Etichetta locale";
}

async function printLabel(): Promise<void> {
  const label = await resolveLabel();
  console.log(label);
}
```

Non e una richiesta remota; le funzioni sono solo definite, non avviate. Le eccezioni di una funzione `async` rifiutano la Promise: il chiamante deve gestirle. TypeScript non ha una lista obbligatoria di eccezioni nella firma.

## Varianti

- **Function declaration**: `function fn(...) {}`.
- **Arrow function**: `const fn = (...) => ...`.
- **Function type alias**: `type Handler = (value: string) => void`.
- **Callback tipizzata**: parametro funzione passato ad altra funzione.
- **Generic function**: funzione che conserva il tipo tra input e output.

## Errori comuni

- **Lasciare parametri impliciti `any`**: con `noImplicitAny` attivo diventa errore.
- **Annotare ritorni troppo larghi**: `object`, `Function` o `any` nascondono informazioni.
- **Interpretare ogni `void` nello stesso modo**: distinguere firma contestuale della callback e ritorno esplicito dell'implementazione.
- **Tipizzare callback in modo incompatibile**: una callback troppo specifica puo non essere accettabile dove serve una piu generale.
- **Scrivere `(index?: number)` perche il consumer puo ignorarlo**: rende facoltativo l'argomento anche per chi invoca la callback. Se viene sempre passato, usa `index: number`; il consumer puo comunque dichiarare meno parametri.

## Checklist

- Annotare i parametri senza contesto; sfruttare l'inferenza delle callback.
- Annotare il ritorno delle funzioni esportate o critiche.
- Usare type alias per firme riutilizzate.
- Preferire `unknown` ad `any` per input non validati.
- Lasciare inferire ritorni locali semplici quando migliora la leggibilita.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo|Variabili e annotazioni di tipo]]
- [[Programmazione/TypeScript/Pagine/Firme di funzione e overload|Firme di funzione e overload]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
- [[Programmazione/TypeScript/Pagine/Variance|Variance]]
- [[Programmazione/TypeScript/Pagine/Linting e formattazione|Linting e formattazione]]

## Fonti

- [TypeScript: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html), parametri, rest, callback e void.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), compatibilita tra firme.
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), Promise e rifiuti.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
