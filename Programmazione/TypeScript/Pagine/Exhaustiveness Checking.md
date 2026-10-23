---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - exhaustiveness-checking
  - never
  - discriminated-unions
aliases:
  - Controllo esaustivita
  - Exhaustive switch
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
title: Exhaustiveness Checking
---

# Exhaustiveness Checking

## Sintesi

L'**exhaustiveness checking** serve a verificare che tutti i casi di una union siano gestiti. In TypeScript si ottiene spesso usando il tipo `never` nel ramo di default di uno `switch`.

E utile per rendere sicuri refactor e aggiunte di nuove varianti.

## Quando usarlo

- Switch su discriminated union.
- Stati applicativi con molte varianti.
- Event handler con eventi tipizzati.
- Reducer e state machine.
- Codice di dominio dove ogni caso deve essere esplicito.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

Se ogni caso della union termina o viene escluso, il valore residuo ha tipo `never`. Passarlo a un parametro `never` fa controllare al compilatore che non rimangano varianti. Una nuova variante non gestita produce un errore proprio in quel punto.

La verifica copre il modello statico conosciuto, non tutti i dati possibili a runtime. Un payload esterno, un cast errato o un consumer JavaScript possono comunque raggiungere il ramo teoricamente impossibile.

## API / Sintassi

```ts
function assertNever(_value: never): never {
  throw new Error("Caso non gestito");
}
```

Il parametro richiede una prova statica di impossibilita; il ritorno `never` indica che la funzione non prosegue normalmente. Il `throw` e reale: il tipo da solo non genera un'eccezione. A dispetto del nome, questa non e una assertion function con firma `asserts`, ma una funzione che non ritorna.

Il messaggio non serializza il payload: `JSON.stringify` puo esporre dati sensibili, fallire su cicli o BigInt e invocare `toJSON`. L'eventuale diagnostica applicativa deve essere esplicita e limitata ai dati che e opportuno registrare.

## Esempio pratico

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function render(state: State): string {
  switch (state.status) {
    case "idle":
      return "In attesa";
    case "loading":
      return "Caricamento";
    case "success":
      return state.data.join(", ");
    case "error":
      return state.message;
    default:
      return assertNever(state);
  }
}

function assertNever(_value: never): never {
  throw new Error("Stato non gestito");
}

console.log(render({ status: "idle" })); // In attesa
console.log(render({ status: "success", data: [] })); // ""
```

Se aggiungi `| { status: "empty" }` alla union senza aggiornare `render`, `state` nel default non e piu `never`. Non correggere il diagnostico scrivendo `state as never`: nasconderesti precisamente il caso che volevi individuare.

Una union aperta come `{ status: string }` non elenca un insieme finito di stati; un generico default puo essere intenzionale in quel modello, ma non e la stessa garanzia.

### Ritorni e copertura dei casi sono controlli diversi

- Un ritorno dichiarato `string`, con `strictNullChecks`, segnala un percorso che termina implicitamente con `undefined`.
- Senza annotazione, il ritorno puo essere inferito come `string | undefined`, senza errore.
- `noImplicitReturns` segnala percorsi mancanti nelle funzioni che restituiscono un valore; non e incluso in `strict`.
- Uno switch con un `default` che restituisce sempre un fallback puo soddisfare i controlli sui ritorni pur nascondendo una variante dimenticata.

`assertNever` verifica il tipo residuo. Funziona anche dopo una catena di `if` con uscite anticipate, non solo dentro uno switch. Un'assegnazione `const missing: never = state` offre il controllo statico ma non lancia da sola: aggiungi una politica runtime esplicita.

### Tabelle complete per mapping semplici

```ts
type Mode = "read" | "write";

const labels = {
  read: "Lettura",
  write: "Scrittura",
} satisfies Record<Mode, string>;

function label(mode: Mode): string {
  return labels[mode];
}

console.log(label("read")); // Lettura
```

Se aggiungi una modalita a `Mode`, la tabella diventa incompleta e il checker la segnala. Questo e comodo per mapping di soli valori; uno switch resta piu chiaro quando ogni variante ha un payload e un comportamento diversi. `satisfies` non controlla a runtime che una chiave esterna appartenga a `Mode`.

## Varianti

- **Helper `assertNever`**: funzione riutilizzabile.
- **Assegnazione a `never`**: `const _exhaustive: never = value`.
- **Switch senza default**: utile con `noImplicitReturns`, ma meno esplicito.
- **Librerie pattern matching**: possono offrire esaustivita piu ergonomica.

## Errori comuni

- **Aggiungere `default` generico**: nasconde casi mancanti.
- **Non usare discriminated union**: l'esaustivita diventa piu difficile.
- **Ritornare fallback silenziosi**: puo mascherare bug di dominio.
- **Usare `any` o cast per far sparire gli errori**: `any` rimuove informazioni utili, ma non e direttamente assegnabile a `never`; un cast esplicito aggira anche quest'ultimo controllo.

## Checklist

- Usare discriminanti stabili nelle union.
- Aggiungere `assertNever` negli switch importanti.
- Evitare default silenziosi su modelli di dominio.
- Controllare che `strict` sia attivo.
- Aggiornare tutti gli switch quando aggiungi una nuova variante.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]


## Fonti

- [TypeScript: exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking), controllo con `never`.
- [TSConfig: noImplicitReturns](https://www.typescriptlang.org/tsconfig/noImplicitReturns.html).
- [TypeScript 4.9: satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html), verifica dei mapping.
- [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), serializzazione e limiti.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
