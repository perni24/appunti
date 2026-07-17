---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, discriminated-unions, union-types, domain-modeling]
aliases: [Tagged unions, Union discriminate]
prerequisites: [Union e Intersection Types, Type Narrowing]
related: [Exhaustiveness Checking, Enums e Literal Types]
---

# Discriminated Unions

## Sintesi

Una **discriminated union** e una union di oggetti che condividono una proprieta comune con valore literal, per esempio `kind`, `type` o `status`.

Questo campo permette a TypeScript di capire quale variante e attiva e rende il codice piu sicuro e leggibile.

## Quando usarlo

- Stati applicativi.
- Risultati successo/errore.
- Eventi con payload diversi.
- Workflow con step distinti.
- Modelli di dominio con varianti note.

## Come funziona

Ogni membro della union ha un valore diverso per il campo discriminante. Quando controlli quel campo con `if` o `switch`, TypeScript restringe il tipo alla variante corrispondente.

## API / Sintassi

```ts
type LoadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };
```

## Esempio pratico

```ts
type Payment =
  | { kind: "card"; last4: string }
  | { kind: "bank_transfer"; iban: string }
  | { kind: "paypal"; email: string };

function describe(payment: Payment): string {
  switch (payment.kind) {
    case "card":
      return `Carta **** ${payment.last4}`;
    case "bank_transfer":
      return `Bonifico ${payment.iban}`;
    case "paypal":
      return `PayPal ${payment.email}`;
  }
}
```

Ogni ramo accede solo ai campi presenti nella variante corretta.

## Varianti

- **`status` union**: stati di caricamento.
- **`kind` union**: varianti di dominio.
- **`type` union**: eventi e azioni.
- **Nested discriminated union**: discriminanti su strutture annidate.

## Errori comuni

- **Non usare un discriminante stabile**: TypeScript deve usare controlli piu fragili.
- **Usare booleani multipli al posto di stati esclusivi**: permette combinazioni impossibili.
- **Dimenticare una variante nello switch**: senza exhaustiveness checking il bug puo passare.
- **Mescolare campi opzionali invece di varianti esplicite**: il modello diventa ambiguo.

## Checklist

- Scegliere un discriminante coerente: `kind`, `type` o `status`.
- Usare literal types per i valori del discriminante.
- Modellare stati esclusivi come union, non come booleani multipli.
- Aggiungere exhaustiveness checking negli switch importanti.
- Mantenere payload specifico dentro ogni variante.

## Collegamenti

- [[Union e Intersection Types]]
- [[Type Narrowing]]
- [[Exhaustiveness Checking]]
- [[Enums e Literal Types]]
