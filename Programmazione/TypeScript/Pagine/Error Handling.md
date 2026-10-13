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
  - error-handling
  - result
  - exceptions
aliases:
  - Gestione errori TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - any
  - unknown e never
related:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni]]"
  - "[[Programmazione/TypeScript/Pagine/Best Practices]]"
title: Error Handling
---

# Error Handling

## Sintesi

In TypeScript la gestione errori deve distinguere tra eccezioni JavaScript, errori di dominio, errori di validazione e risultati attesi.

Il type system aiuta a modellare gli errori espliciti, ma le eccezioni runtime possono comunque contenere qualsiasi valore.

## Quando usarlo

- API e client HTTP.
- Parser e validatori.
- Funzioni di dominio che possono fallire.
- Operazioni I/O.
- Workflow dove gli errori sono casi normali.

## Come funziona

Per errori eccezionali puoi usare `throw`. Per errori attesi spesso e meglio usare un tipo `Result`, cioe una discriminated union con successo o fallimento.

Nel `catch`, il valore catturato dovrebbe essere trattato come `unknown`.

## API / Sintassi

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

## Esempio pratico

```ts
type ParseError = {
  code: "INVALID_NUMBER";
  message: string;
};

function parseNumber(value: unknown): Result<number, ParseError> {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return {
      ok: false,
      error: { code: "INVALID_NUMBER", message: "Numero non valido" },
    };
  }

  return { ok: true, value: parsed };
}
```

Il chiamante deve gestire entrambi i casi.

## Varianti

- **Eccezioni**: per errori inattesi o impossibilita di proseguire.
- **Result type**: per errori attesi e modellabili.
- **Error class**: utile se serve `instanceof`.
- **Discriminated error object**: piu semplice da serializzare.
- **HTTP error DTO**: per API.

## Errori comuni

- **Assumere che `catch (error)` sia sempre `Error`**.
- **Lanciare stringhe**: difficile da gestire.
- **Nascondere errori con fallback generici**.
- **Non modellare errori nelle API**.
- **Usare eccezioni per controllo di flusso normale**.

## Checklist

- Trattare errori catturati come `unknown`.
- Usare discriminated union per errori attesi.
- Modellare errori API nel contratto.
- Non perdere causa e contesto dell'errore.
- Testare rami di fallimento.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
