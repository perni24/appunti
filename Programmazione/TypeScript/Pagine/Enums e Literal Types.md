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
  - enum
  - literal-types
  - union-types
aliases:
  - Enums
  - Literal Types
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - "[[Programmazione/TypeScript/Pagine/as const]]"
title: Enums e Literal Types
---

# Enums e Literal Types

## Sintesi

Enums e literal types rappresentano valori con nomi o alternative definite. Una union di literal e solo un tipo; un enum ordinario e anche un oggetto JavaScript.

Scegli in base al contratto e alla toolchain, non per una regola assoluta: avere un oggetto di costanti, avere una lista da iterare e validare dati esterni sono tre esigenze diverse.

## Quando usarlo

- Stati applicativi con valori noti.
- Ruoli utente, permessi, modalita, categorie.
- Campi discriminanti nelle union.
- API che accettano solo un insieme ristretto di stringhe.
- Valori condivisi tra runtime e type system.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true`, target ES2022 ed emissione tramite `tsc`.

| Forma | A runtime | Attenzione |
| --- | --- | --- |
| Union di literal | Il tipo sparisce | Non fornisce da sola una lista o un validatore |
| Enum ordinario | Oggetto generato dal compilatore | Gli enum numerici includono anche reverse mapping |
| Oggetto `as const` | Normale oggetto JavaScript | L'asserzione non congela l'oggetto |
| `const enum` | Spesso riferimenti inline con tsc | Emissione e compatibilita dipendono dalle opzioni e dai tool |

Un literal `"admin"` accetta solo quel valore nel codice controllato. Una stringa da un form o da JSON non diventa valida solo perche il campo e annotato con un tipo.

## API / Sintassi

```ts
type Role = "admin" | "editor" | "viewer";

enum Direction {
  Up = "UP",
  Down = "DOWN",
}

const direction: Direction = Direction.Up;
// const invalid: Direction = "UP"; // Usare il membro dello string enum.

enum Phase {
  Waiting = 0,
  Running = 1,
}
console.log(Phase.Waiting, Phase[0]); // 0, "Waiting"
```

`Object.values(Phase)` contiene numeri e nomi a causa del reverse mapping; non e direttamente una lista dei soli valori numerici. Gli string enum non generano questo mapping inverso.

## Esempio pratico

Una lista costante fornisce sia i valori per la UI sia il tipo e il controllo di appartenenza:

```ts
const STATUSES = ["idle", "loading", "success", "error"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUSES.some(status => status === value);
}

function label(status: Status): string {
  switch (status) {
    case "idle":
      return "In attesa";
    case "loading":
      return "Caricamento";
    case "success":
      return "Completato";
    case "error":
      return "Errore";
  }
}

const raw: unknown = "success";
console.log(isStatus(raw) ? label(raw) : "Stato sconosciuto"); // Completato
```

La union rifiuta chiamate tipizzate con `"done"`; e `isStatus` a verificare il valore a runtime. Un controllo di tipo non impedisce a JavaScript esterno, `any` o un'asserzione errata di passare dati diversi.

Se servono nomi simbolici distinti dai valori:

```ts
const Direction = { Up: "UP", Down: "DOWN" } as const;
type Direction = (typeof Direction)[keyof typeof Direction];
const direction: Direction = "UP"; // Qui e una union di stringhe.
```

Il nome puo esistere nello spazio dei valori e in quello dei tipi. Le proprieta sono readonly per il checker, non congelate a runtime.

### Enum numerici e const enum

In questa baseline un literal numerico estraneo puo essere rifiutato, ma una variabile di tipo `number` puo ancora essere assegnata a un enum numerico:

```ts
enum Phase {
  Waiting = 0,
  Running = 1,
}

// const literal: Phase = 99; // Errore statico.
const externalCode: number = 99;
const unchecked: Phase = externalCode; // Compila, ma 99 non e un membro.
console.log(unchecked); // 99
```

Non usare il successo del type check come controllo di appartenenza numerica.

`const enum` puo eliminare l'oggetto e incorporare i valori con `tsc`; `preserveConstEnums`, compilazione isolata, file dichiarativi e altri transpiler cambiano il quadro. In particolare, gli ambienti che eseguono solo type stripping non possono trattare enum come semplici annotazioni cancellabili. Verifica la toolchain; `erasableSyntaxOnly` segnala questi costrutti non cancellabili.

## Varianti

- **String literal union**: `"small" | "medium" | "large"`.
- **Numeric literal union**: `1 | 2 | 3`.
- **String enum**: `enum Role { Admin = "admin" }`.
- **Const object con `as const`**: alternativa runtime-friendly agli enum.

## Errori comuni

- **Usare enum per ogni lista di stringhe**: spesso una union e piu semplice.
- **Dimenticare che enum genera runtime code**: puo influire su bundle e interoperabilita.
- **Usare un enum numerico come validatore**: un valore `number` non garantisce appartenenza.
- **Non centralizzare valori condivisi con API esterne**: aumenta il rischio di mismatch.
- **Cambiare l'ordine dei membri numerici impliciti**: puo cambiare i valori salvati o trasmessi. Per un protocollo definisci valori stabili e una strategia di evoluzione.

## Checklist

- Preferire literal union per valori solo type-level.
- Usare enum solo quando serve una struttura runtime nominata.
- Valutare oggetto `as const` per valori condivisi.
- Usare literal types come discriminanti nelle union.
- Tenere allineati i valori con API, database e validazione runtime.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]
- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]

## Fonti

- [TypeScript: Enums](https://www.typescriptlang.org/docs/handbook/enums.html), oggetti runtime, reverse mapping e limiti dei const enum.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), compatibilita degli enum.
- [TSConfig: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html) e [preserveConstEnums](https://www.typescriptlang.org/tsconfig/preserveConstEnums.html).
- [Node.js: TypeScript](https://nodejs.org/api/typescript.html), limiti del type stripping; verificare la versione usata.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
