---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, variabili, type-annotations]
aliases: [Annotazioni di tipo]
prerequisites: [Introduzione a TypeScript, Tipi primitivi]
related: [Inferenza dei tipi, Type Aliases e Interfaces]
---

# Variabili e annotazioni di tipo

## Sintesi

Le annotazioni di tipo permettono di dichiarare esplicitamente il tipo atteso per variabili, parametri, ritorni di funzione e proprieta.

In TypeScript non serve annotare tutto: si annotano soprattutto confini pubblici, parametri, ritorni importanti e valori che l'inferenza non riesce a descrivere bene.

## Quando usarlo

- Parametri di funzione.
- Ritorni di funzioni pubbliche o complesse.
- Oggetti esportati da un modulo.
- Variabili inizializzate piu tardi.
- API tra moduli, layer o componenti.

## Come funziona

L'annotazione si scrive dopo il nome del valore, separata da `:`. Il compilatore usa quell'informazione per verificare assegnamenti e usi successivi.

Se il valore assegnato non rispetta il tipo dichiarato, TypeScript segnala errore.

## API / Sintassi

```ts
const name: string = "Luca";
let count: number = 0;

function sum(a: number, b: number): number {
  return a + b;
}
```

## Esempio pratico

```ts
type CreateUserInput = {
  email: string;
  password: string;
};

function createUser(input: CreateUserInput): string {
  return `created:${input.email}`;
}

const userId = createUser({
  email: "luca@example.com",
  password: "secret",
});
```

L'annotazione su `input` rende chiaro il contratto della funzione. `userId` non ha bisogno di annotazione perche viene inferito come `string`.

## Varianti

- **Annotazione variabile**: `let value: number`.
- **Annotazione parametro**: `function f(value: number)`.
- **Annotazione ritorno**: `function f(): string`.
- **Annotazione oggetto**: `const user: User = ...`.

## Errori comuni

- **Annotare valori ovvi**: `const x: number = 1` spesso e rumore.
- **Non annotare parametri**: senza annotazioni, i parametri possono diventare implicitamente `any` se la configurazione lo permette.
- **Annotare ritorni troppo larghi**: un ritorno `object` o `any` nasconde informazioni utili.
- **Usare annotazioni per forzare il compilatore**: se il tipo non combacia, va capito il problema invece di mascherarlo.

## Checklist

- Annotare parametri di funzione.
- Annotare API esportate o pubbliche.
- Lasciare inferire variabili locali semplici.
- Preferire type alias o interface per oggetti non banali.
- Evitare `any` come annotazione di comodo.

## Collegamenti

- [[Tipi primitivi]]
- [[Inferenza dei tipi]]
- [[Type Aliases e Interfaces]]
