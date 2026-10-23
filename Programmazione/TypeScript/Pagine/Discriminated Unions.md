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
  - discriminated-unions
  - union-types
  - domain-modeling
aliases:
  - Tagged unions
  - Union discriminate
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Exhaustiveness Checking]]"
  - "[[Programmazione/TypeScript/Pagine/Enums e Literal Types]]"
title: Discriminated Unions
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

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

Per selezionare una singola variante, usa una proprieta richiesta comune e valori literal distinti. Se piu membri condividono lo stesso valore, il controllo puo lasciare una union di piu varianti: non e sempre una selezione uno a uno.

Il tipo lega il discriminante al relativo payload. Un oggetto con `status: "success" | "error"`, `data?: string[]` e `message?: string` non esprime la stessa relazione: ammette successo senza dati ed errore senza messaggio.

## API / Sintassi

```ts
type LoadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

const ready: LoadingState = { status: "success", data: [] };
// const broken: LoadingState = { status: "success" }; // Errore: manca data.
```

`data: []` e un successo senza elementi, diverso da "non caricato". Se il dominio richiede uno stato "empty" separato, aggiungilo esplicitamente e gestiscilo negli utilizzatori.

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

console.log(describe({ kind: "card", last4: "1234" })); // Carta **** 1234
```

Ogni ramo legge il suo payload. Questo e un formatter locale, non un pagamento: non verifica numero di carta, IBAN o email e non deve essere usato per registrare indiscriminatamente dati personali nei log.

Con ritorno esplicito `string` e `strictNullChecks`, una nuova variante non gestita qui rende possibile arrivare alla fine senza ritorno e produce un errore. Per una verifica esplicita sul valore residuo usa [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking|Exhaustiveness Checking]].

### Creazione dei valori e widening

```ts
type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function describeResult(result: Result): string {
  return result.kind === "ok" ? String(result.value) : result.message;
}

const widened = { kind: "ok", value: 0 };
// describeResult(widened); // Errore: kind inferito come string.
const result = { kind: "ok", value: 0 } satisfies Result;
console.log(describeResult(result)); // 0
```

Una variabile `const` non rende costanti i campi dell'oggetto. Un'annotazione `: Result`, `satisfies Result` o, quando opportuno, `as const` puo preservare la forma desiderata. `satisfies` controlla staticamente il valore, non lo valida a runtime; `as const` non congela l'oggetto.

### Conservare la relazione tra discriminante e payload

```ts
type Action =
  | { kind: "set"; payload: number }
  | { kind: "label"; payload: string };

function summarize(action: Action): string {
  const { kind, payload } = action;
  if (kind === "set") {
    return payload.toFixed(0);
  }
  return payload.toUpperCase();
}

console.log(summarize({ kind: "set", payload: 3 })); // 3
```

La destructuring `const` mantiene questa correlazione nella baseline. Non e equivalente separare `kind` da un oggetto `...rest`, oppure rendere indipendentemente riassegnabili le variabili: il checker puo perdere il collegamento. Se succede, controlla `action.kind` e usa `action.payload` nello stesso ramo.

### Stato valido non significa transizione valida

Una union elenca le forme ammesse, non stabilisce quali passaggi siano consentiti, chi possa avviarli o quale risposta asincrona sia ancora attuale. Queste regole richiedono logica nel reducer o nella macchina a stati. Preferisci sostituire l'intero oggetto stato invece di mutare separatamente discriminante e payload; `readonly` e solo un vincolo statico.

Input di rete o JSON richiedono un parser prima di essere trattati come union. La presenza di `kind` o `status` non prova che il payload sia completo e corretto.

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

- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]
- [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking|Exhaustiveness Checking]]
- [[Programmazione/TypeScript/Pagine/Enums e Literal Types|Enums e Literal Types]]


## Fonti

- [TypeScript: discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).
- [TypeScript 4.6: destructuring e controllo del flusso](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-6.html).
- [TypeScript 4.9: satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
