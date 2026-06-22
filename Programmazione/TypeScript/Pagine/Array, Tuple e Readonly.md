---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, array, tuple, readonly, collezioni]
aliases: [Array Tuple Readonly]
prerequisites: [Tipi primitivi, Inferenza dei tipi]
related: [Variadic tuple types, Utility Types]
---

# Array, Tuple e Readonly

## Sintesi

TypeScript permette di tipizzare collezioni omogenee con array, sequenze a lunghezza e posizione note con tuple, e strutture non modificabili tramite `readonly`.

La differenza principale e che un array descrive una lista di elementi dello stesso tipo, mentre una tuple descrive una posizione specifica per ogni elemento.

## Quando usarlo

- Liste di elementi dello stesso tipo.
- Ritorni multipli con significato posizionale.
- Coordinate, range, coppie chiave-valore.
- API dove vuoi impedire modifiche accidentali.
- Dati costanti o configurazioni immutabili.

## Come funziona

Un array si scrive `T[]` oppure `Array<T>`. Una tuple si scrive con parentesi quadre e tipi in ordine. `readonly` impedisce operazioni mutanti come `push`, `pop` o assegnazione diretta degli elementi.

## API / Sintassi

```ts
const names: string[] = ["Luca", "Marta"];
const scores: Array<number> = [10, 20, 30];

const point: [number, number] = [10, 20];
const readonlyNames: readonly string[] = ["Luca", "Marta"];
```

## Esempio pratico

```ts
type ApiError = [code: string, message: string];

function parseError(input: unknown): ApiError {
  if (typeof input === "string") {
    return ["UNKNOWN", input];
  }

  return ["INVALID_INPUT", "Input non valido"];
}

const [code, message] = parseError("Timeout");
```

La tuple rende esplicito il significato delle posizioni.

## Varianti

- **Array mutable**: `string[]`.
- **Array readonly**: `readonly string[]`.
- **Tuple**: `[string, number]`.
- **Named tuple elements**: `[id: string, count: number]`.
- **Readonly tuple**: `readonly [number, number]`.

## Errori comuni

- **Usare tuple per dati che crescono liberamente**: meglio array.
- **Usare array quando le posizioni hanno significato diverso**: meglio tuple o oggetto.
- **Pensare che `readonly` sia immutabilita runtime**: e un vincolo statico, non congela l'oggetto.
- **Perdere precisione con array vuoti**: un array vuoto puo richiedere annotazione.

## Checklist

- Usare array per liste omogenee.
- Usare tuple per strutture brevi e posizionali.
- Preferire oggetti se i campi hanno nomi importanti.
- Usare `readonly` per input che non devono essere modificati.
- Annotare array vuoti se il tipo non e inferibile.

## Collegamenti

- [[Inferenza dei tipi]]
- [[Utility Types]]
- [[Variadic tuple types]]
