---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, type-guards, narrowing, runtime-validation]
aliases: [Type guard]
prerequisites: [Type Narrowing, any, unknown e never]
related: [Type predicates, Assertion functions, Validazione runtime e tipi statici]
---

# Type Guards

## Sintesi

I **type guards** sono controlli che permettono a TypeScript di restringere un tipo. Possono essere controlli nativi, come `typeof`, oppure funzioni definite dall'utente con un type predicate.

Sono il ponte tra dati runtime e type system statico.

## Quando usarlo

- Per usare in sicurezza valori `unknown`.
- Per distinguere membri di una union.
- Per validare forme minime di oggetti ricevuti dall'esterno.
- Per evitare assertion fragili.
- Per centralizzare controlli riutilizzati in piu punti.

## Come funziona

Un type guard produce una condizione che TypeScript comprende. Dentro il ramo in cui la condizione e vera, il compilatore restringe il tipo del valore.

## API / Sintassi

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
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

function handle(value: unknown): string {
  if (!isUser(value)) {
    return "Utente non valido";
  }

  return value.email;
}
```

La funzione `isUser` permette di usare `value` come `User` solo dopo il controllo.

## Varianti

- **Guard nativi**: `typeof`, `instanceof`, `in`.
- **Custom type guard**: funzione con ritorno `value is Type`.
- **Guard compositi**: combinano piu controlli.
- **Schema validator**: librerie come Zod o simili producono validazione runtime piu robusta.

## Errori comuni

- **Scrivere guard incompleti**: TypeScript si fida della firma, anche se la logica e sbagliata.
- **Validare solo presenza della proprieta**: non basta se conta anche il tipo del valore.
- **Usare guard troppo generici**: `isObject` spesso non garantisce abbastanza.
- **Confondere guard e parser**: un guard verifica, un parser puo trasformare o normalizzare.

## Checklist

- Controllare sia presenza sia tipo delle proprieta importanti.
- Tenere i guard piccoli e testabili.
- Usare `unknown` come input dei guard.
- Non dichiarare `value is Type` se il controllo non e sufficiente.
- Valutare schema validation per dati esterni complessi.

## Collegamenti

- [[Type Narrowing]]
- [[Type predicates]]
- [[Assertion functions]]
- [[Validazione runtime e tipi statici]]
