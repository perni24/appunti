---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, runtime-validation, type-safety, validation]
aliases: [Validazione runtime TypeScript]
prerequisites: [any, unknown e never, Type Guards]
related: [Schema validation con Zod, Parsing sicuro di input esterni, API contract]
---

# Validazione runtime e tipi statici

## Sintesi

TypeScript controlla i tipi a compile-time, ma non valida automaticamente i dati a runtime. Quando un valore arriva da rete, file, form, database o `JSON.parse`, il compilatore non puo sapere se rispetta davvero il tipo dichiarato.

Per questo serve distinguere tra **tipo statico** e **validazione runtime**.

## Quando usarlo

- Input HTTP e API esterne.
- Dati da form.
- File JSON o CSV.
- Risposte database non completamente controllate.
- Messaggi da queue, webhook o storage.

## Come funziona

Il pattern sicuro e:

1. Ricevere input come `unknown`.
2. Validarlo a runtime.
3. Trasformarlo in un tipo TypeScript affidabile.
4. Usare il valore validato nel dominio applicativo.

## API / Sintassi

```ts
function parseJson(input: string): unknown {
  return JSON.parse(input);
}
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value &&
    typeof value.id === "string" &&
    typeof value.email === "string"
  );
}

const raw: unknown = JSON.parse('{"id":"u_1","email":"luca@example.com"}');

if (!isUser(raw)) {
  throw new Error("Utente non valido");
}

console.log(raw.email);
```

## Varianti

- **Type guard manuale**: semplice e senza dipendenze.
- **Assertion function**: valida e lancia errore.
- **Schema validation**: librerie come Zod.
- **Parser esplicito**: valida e normalizza.
- **Generated validators**: generati da schema o API contract.

## Errori comuni

- **Usare `as Type` su JSON esterno**: non valida niente.
- **Fidarsi dei tipi generati dal client API**: la rete puo restituire dati errati.
- **Validare solo parzialmente**: un campo mancante puo esplodere piu avanti.
- **Confondere DTO validato e modello di dominio**: non sempre coincidono.

## Checklist

- Trattare input esterni come `unknown`.
- Validare prima di usare.
- Preferire parser/schema per strutture complesse.
- Separare DTO esterno e dominio interno.
- Scrivere test per validazioni critiche.

## Collegamenti

- [[Schema validation con Zod]]
- [[Parsing sicuro di input esterni]]
- [[API contract]]
- [[Type Guards]]
