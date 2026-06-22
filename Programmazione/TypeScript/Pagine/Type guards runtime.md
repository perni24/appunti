---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, type-guards, runtime-validation]
aliases: [Runtime type guards]
prerequisites: [Type Guards, Validazione runtime e tipi statici]
related: [Type predicates, Assertion functions]
---

# Type guards runtime

## Sintesi

I type guards runtime sono funzioni che controllano un valore durante l'esecuzione e informano TypeScript del tipo risultante tramite type predicate.

Sono utili per validazioni leggere, soprattutto quando non vuoi introdurre una libreria di schema validation.

## Quando usarlo

- Controlli semplici su `unknown`.
- Filtri su array di union.
- Validazione minima di dati interni.
- Narrowing riutilizzabile.
- Integrazione con librerie che restituiscono tipi larghi.

## Come funziona

Una funzione runtime restituisce un booleano. La firma `value is Type` dice al compilatore che, se il risultato e `true`, il valore puo essere trattato come `Type`.

## API / Sintassi

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}
```

## Esempio pratico

```ts
type Product = {
  id: string;
  price: number;
};

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "price" in value &&
    typeof value.id === "string" &&
    typeof value.price === "number"
  );
}
```

## Varianti

- **Guard primitive**: `isString`, `isNumber`.
- **Guard oggetto**: controlla forma minima.
- **Guard union**: distingue varianti.
- **Guard array**: combina `Array.isArray` e guard degli elementi.
- **Assertion function**: lancia invece di restituire booleano.

## Errori comuni

- **Controllare solo la presenza dei campi**: serve anche il tipo.
- **Dichiarare predicate piu forte della validazione reale**.
- **Usare guard manuali per schemi molto complessi**: meglio una libreria.
- **Non testare guard critici**.

## Checklist

- Usare input `unknown`.
- Controllare `value !== null` prima di usare `in`.
- Validare campi obbligatori e tipo.
- Testare casi invalidi.
- Passare a schema validation se la forma cresce.

## Collegamenti

- [[Type Guards]]
- [[Type predicates]]
- [[Assertion functions]]
- [[Schema validation con Zod]]
