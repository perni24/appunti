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
  - inferenza
  - type-inference
aliases:
  - Type inference
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
  - "[[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo]]"
related:
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
title: Inferenza dei tipi
---

# Inferenza dei tipi

## Sintesi

L'inferenza dei tipi e la capacita di TypeScript di dedurre il tipo di un valore senza annotazione esplicita.

Usarla bene rende il codice piu leggibile: si annotano i contratti importanti e si lascia al compilatore il lavoro sui dettagli locali.

## Quando usarlo

- Variabili inizializzate immediatamente.
- Risultati di funzioni gia tipizzate.
- Array e oggetti locali semplici.
- Callback dove il contesto fornisce gia il tipo.
- Codice interno non esportato.

## Come funziona

TypeScript ricava tipi da inizializzatori, ritorni e contesto. Non scopre il formato dei dati interrogando un server e non inferisce normalmente i parametri di una dichiarazione di funzione dai suoi futuri chiamanti.

Gli esempi sono indipendenti e usano TypeScript 5.9.3 con `strict: true`. Il tipo puo dipendere dalla posizione del valore, non solo dal suo contenuto.

### Literal e widening

```ts
const port = 3000; // Literal 3000.
let retries = 3; // number: il binding puo cambiare.
const options = { mode: "dark" }; // { mode: string }
options.mode = "light"; // const non congela le proprieta.
const fixed = { mode: "dark" } as const; // readonly mode: "dark"
```

`as const` conserva literal e rende readonly le proprieta/tuple del literal a livello statico. Non chiama `Object.freeze` e non congela oggetti preesistenti raggiunti tramite un riferimento.

### Contesto e ritorni

In `["a", "b"].map(value => value.length)`, il metodo fornisce il tipo di `value`, quindi il ritorno e `number[]`. Una callback puo essere inferita senza che tutti i parametri di tutte le funzioni lo siano.

Per un array eterogeneo il compilatore puo ottenere una union degli elementi. Non deduce invece da `[10, 20]` una tupla di lunghezza fissa: normalmente inferisce `number[]`.

## API / Sintassi

```ts
const names = ["Luca", "Marta"]; // string[]
const mixed = [1, "due"]; // (number | string)[]
const lengths = names.map(name => name.length); // number[]

function findName(id: string) {
  if (id === "u_1") return "Luca";
  return undefined;
} // Ritorno: "Luca" | undefined.
```

I ritorni letterali possono restare piu precisi di `string`; controlla il tipo effettivo nell'editor. Se la funzione deve esporre un contratto stabile, annota quel contratto.

## Esempio pratico

Array vuoti e stato iniziale sono punti in cui l'annotazione evita un'intenzione ambigua:

```ts
type User = {
  id: string;
  email: string;
};

const users: User[] = [];
users.push({ id: "u_1", email: "luca@example.com" });

function getUserEmail(user: User) {
  return user.email; // Ritorno inferito: string.
}

const emails = users.map(getUserEmail); // string[]
console.log(emails); // ["luca@example.com"]

const state: { selected: User | null } = { selected: null };
state.selected = users.find(user => user.id === "u_1") ?? null;
```

`users` e lo stato iniziale hanno un contratto esplicito; il ritorno della funzione, la callback e `emails` sono inferiti. Non vengono caricati utenti reali e le stringhe email non sono validate.

Controesempio indipendente:

```ts
const state = { selected: null };
// state.selected = { id: "u_1", email: "luca@example.com" };
// Errore: selected e stato inferito come null, non User | null.

const bag = { items: [] };
// bag.items.push("a"); // Con strict: true, items e never[].
```

Non ogni `[]` e `never[]`: una variabile locale vuota puo avere un tipo che evolve con le scritture, mentre una proprieta senza contesto spesso diventa `never[]`. Esplicitare `User[]` e piu chiaro che dipendere da queste differenze.

## Varianti

- **Inferenza da inizializzazione**: `const value = 1`.
- **Inferenza contestuale**: una callback riceve tipi dal contesto.
- **Literal inference**: `const role = "admin"`.
- **Best common type**: un array viene inferito dal tipo comune dei suoi elementi.
- **Narrowing**: restringe un tipo in un punto del flusso; non e la stessa operazione dell'inferenza iniziale.

## Errori comuni

- **Combattere l'inferenza con annotazioni inutili**: rende il codice piu verboso.
- **Non controllare tipi inferiti troppo larghi**: un array vuoto puo diventare `any[]` o `never[]` in base al contesto.
- **Confondere `const` con immutabilita profonda**: `const` impedisce riassegnazione, non rende immutabile un oggetto.
- **Credere che un tipo inferito sia una validazione**: `JSON.parse` puo introdurre `any`; assegnarlo senza controlli non rende il dato attendibile.
- **Supporre sicuro qualsiasi accesso a un array**: `strict` da solo non aggiunge `undefined` a ogni accesso per indice; valuta `noUncheckedIndexedAccess`.

## Checklist

- Lasciare inferire variabili locali ovvie.
- Annotare parametri e API pubbliche.
- Controllare array vuoti e oggetti inizialmente incompleti.
- Usare `as const` per conservare literal, non come congelamento runtime.
- Leggere i tipi inferiti dall'editor quando qualcosa non torna.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo|Variabili e annotazioni di tipo]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]
- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]

## Fonti

- [TypeScript: Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html), contesto e tipi degli elementi.
- [TypeScript 2.1: improved any inference](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html), array locali che evolvono.
- [TypeScript 3.4: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html).
- [TSConfig: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
