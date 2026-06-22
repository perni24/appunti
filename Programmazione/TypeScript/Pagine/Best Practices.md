---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, best-practices, quality, type-safety]
aliases: [Best practice TypeScript]
prerequisites: [Strict mode, any, unknown e never]
related: [Linting e formattazione, Error Handling, Validazione runtime e tipi statici]
---

# Best Practices

## Sintesi

Le best practice TypeScript ruotano attorno a un principio: usare il type system per rendere espliciti i contratti, senza trasformare ogni dettaglio in un esercizio type-level.

Il codice migliore e leggibile, rigoroso sui confini e pragmatico nelle parti locali.

## Quando usarlo

- Nuovi progetti TypeScript.
- Migrazioni da JavaScript.
- Code review.
- Librerie condivise.
- API e modelli di dominio.

## Come funziona

TypeScript funziona bene quando `strict` e attivo, gli input esterni sono trattati come `unknown`, i tipi pubblici sono chiari e l'inferenza viene lasciata lavorare nelle parti locali.

## API / Sintassi

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
```

## Esempio pratico

```ts
function parseNumber(value: unknown): Result<number> {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { ok: false, error: "Numero non valido" };
  }

  return { ok: true, value: parsed };
}
```

Il tipo rappresenta esplicitamente successo ed errore.

## Varianti

- **Boundary-first typing**: tipizza prima confini esterni.
- **Domain modeling**: tipi espressivi per il dominio.
- **Pragmatic inference**: annota API, lascia inferire dettagli locali.
- **Runtime validation**: schema o parser sui dati non fidati.
- **Utility types mirate**: astrazioni solo quando riducono duplicazione reale.

## Errori comuni

- **Usare `any` come scorciatoia stabile**.
- **Fidarsi dei tipi sui dati esterni**.
- **Creare tipi troppo complessi per problemi semplici**.
- **Annotare tutto inutilmente**.
- **Ignorare errori del compilatore con assertion aggressive**.

## Checklist

- Abilitare `strict`.
- Preferire `unknown` ad `any`.
- Validare input esterni.
- Usare discriminated union per stati alternativi.
- Mantenere tipi pubblici chiari e stabili.

## Collegamenti

- [[Strict mode]]
- [[Validazione runtime e tipi statici]]
- [[Error Handling]]
- [[Domain modeling]]
