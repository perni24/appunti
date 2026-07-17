---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, domain-modeling, architecture, types]
aliases: [Modellazione dominio TypeScript]
prerequisites: [DTO e modelli di dominio, Brand Types]
related: [Clean architecture, Error Handling]
---

# Domain modeling

## Sintesi

Il domain modeling in TypeScript usa tipi, union, brand, value object e funzioni per rappresentare concetti business in modo esplicito.

L'obiettivo e rendere impossibili o difficili gli stati invalidi, invece di gestirli solo con commenti o convenzioni.

## Quando usarlo

- Regole business importanti.
- Stati applicativi complessi.
- ID e valori con significato forte.
- Workflow con transizioni definite.
- Applicazioni dove il dominio conta piu del CRUD.

## Come funziona

Si modellano concetti con tipi espressivi: discriminated union per stati, brand types per ID, parser per valori validati, funzioni pure per transizioni e result types per errori attesi.

## API / Sintassi

```ts
type OrderStatus =
  | { kind: "draft" }
  | { kind: "paid"; paidAt: Date }
  | { kind: "cancelled"; reason: string };
```

## Esempio pratico

```ts
type Email = string & { readonly __brand: "Email" };

function parseEmail(value: string): Email {
  if (!value.includes("@")) {
    throw new Error("Email non valida");
  }

  return value as Email;
}

type User = {
  id: string;
  email: Email;
};
```

Il dominio non accetta una stringa qualunque come email.

## Varianti

- **Discriminated union** per stati.
- **Brand types** per valori nominali.
- **Value object** con classi o factory.
- **Result type** per errori attesi.
- **State machine** per workflow complessi.

## Errori comuni

- **Modellare tutto come stringhe e booleani**.
- **Creare tipi troppo astratti senza valore pratico**.
- **Confondere DTO e dominio**.
- **Validare solo ai bordi e poi perdere invarianti internamente**.

## Checklist

- Dare nomi di dominio ai tipi.
- Evitare booleani multipli per stati esclusivi.
- Usare parser/factory per valori validati.
- Modellare errori attesi con tipi.
- Tenere il dominio indipendente da framework e database.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Brand Types]]
- [[Discriminated Unions]]
- [[Clean architecture]]
