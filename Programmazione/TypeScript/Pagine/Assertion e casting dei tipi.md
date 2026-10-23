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
  - type-assertion
  - casting
  - type-safety
aliases:
  - Type assertions
  - Casting TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Assertion functions]]"
title: Assertion e casting dei tipi
---

# Assertion e casting dei tipi

## Sintesi

Le type assertion dicono al compilatore di trattare un valore come un certo tipo. Sono spesso chiamate "casting", ma in TypeScript non trasformano il valore a runtime: cambiano solo il modo in cui il compilatore lo interpreta.

Vanno usate con cautela, perche possono aggirare controlli importanti.

## Quando usarlo

- Quando conosci piu informazioni del compilatore.
- Quando lavori con API DOM o librerie non tipizzate perfettamente.
- Dopo validazioni runtime non rappresentate dal type system.
- Durante migrazioni da JavaScript a TypeScript.
- In punti di integrazione con dati legacy.

## Come funziona

La sintassi principale e `value as Type`. TypeScript accetta l'assertion se i tipi sono sufficientemente compatibili. Per forzature estreme si vede talvolta `as unknown as Type`, ma e un segnale di rischio.

L'assertion non modifica il dato reale, non crea un oggetto e non installa controlli. Anche un type predicate puo mentire: il checker si affida alla dichiarazione `value is User`, non prova che il corpo ne verifichi correttamente tutte le condizioni.

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022. Il blocco DOM richiede un browser.

## API / Sintassi

```ts
const raw: unknown = "42";
const asserted = raw as number;
const converted = Number(raw);

console.log(typeof asserted); // string: nessuna conversione.
console.log(converted, typeof converted); // 42, number
```

`Number` esegue una conversione reale, non necessariamente quella desiderata: per esempio una stringa vuota diventa zero e input non numerici possono produrre NaN. Parsing e validazione restano decisioni separate.

## Esempio pratico

Type guard per dati JSON: controlla oggetto non nullo, assenza di forma array, campi propri e tipi effettivi delle proprieta.

```ts
type User = {
  id: string;
  email: string;
};

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "id") &&
    Object.hasOwn(value, "email") &&
    "id" in value &&
    "email" in value &&
    typeof value.id === "string" &&
    typeof value.email === "string"
  );
}

const raw: unknown = JSON.parse('{"id":"u_1","email":"luca@example.com"}');

if (isUser(raw)) {
  console.log(raw.email.toLowerCase()); // luca@example.com
} else {
  console.log("Forma utente non valida");
}
```

La sola presenza di `id` ed `email` accetterebbe anche `{ id: 1, email: null }`, rendendo falsa la promessa `value is User`. Qui i tipi vengono verificati; formato email, stringhe vuote, identita e permessi non sono verificati.

Il guard restituisce un booleano e non ripulisce o copia l'oggetto: eventuali altri campi restano presenti. Per ottenere una proiezione usa un parser, come nella nota [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]. Gli esempi assumono oggetti da JSON, non Proxy/getter ostili.

### DOM e non-null assertion

`querySelector("input")` ha gia un tipo specializzato nel DOM standard; per selettori per ID o classi il tipo puo essere piu generale. Una verifica runtime e preferibile a forzare il tipo:

```ts
function readEmailField(root: Document): string {
  const field = root.querySelector("#email");
  if (!(field instanceof HTMLInputElement)) {
    throw new TypeError("Expected an input with id email");
  }
  return field.value;
}
```

Il controllo accetta un input dello stesso realm e legge il valore; non garantisce che sia un indirizzo email valido. Un `textarea`, un elemento assente o un input di un altro realm richiedono gestione diversa.

Controesempio compilabile ma non sicuro, con l'operazione pericolosa commentata:

```ts
function upperLabel(label: string | null): string {
  return label!.toUpperCase();
}

console.log(upperLabel("ciao")); // CIAO
// upperLabel(null); // Compila, ma lancia TypeError a runtime.
```

`!` elimina null/undefined dal tipo dell'espressione, non dal dato. Preferisci un controllo esplicito, un valore di fallback o un errore deliberato con messaggio utile.

## Varianti

- **Type assertion**: `value as Type`.
- **Non-null assertion**: `value!`.
- **Const assertion**: `as const`.
- **Double assertion**: `value as unknown as Type`, da evitare salvo casi eccezionali.
- **Sintassi `<Type>value`**: alternativa storica non utilizzabile come type assertion nei file TSX.
- **`satisfies`**: verifica compatibilita senza essere una conversione o una validazione runtime.

## Errori comuni

- **Pensare che `as` converta il valore**: non fa parsing, validazione o trasformazione.
- **Usare `!` per ignorare `null` e `undefined`**: puo produrre errori runtime.
- **Assertare input esterni senza validazione**: rompe il confine tra runtime e type system.
- **Usare double assertion come scorciatoia**: spesso indica un modello tipi sbagliato.

## Checklist

- Preferire narrowing e type guard alle assertion.
- Usare assertion solo in punti locali e motivati.
- Non assertare dati di rete senza validazione runtime.
- Evitare `!` se puoi gestire esplicitamente il caso nullo.
- Controllare se il problema si risolve con tipi piu precisi.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Assertion functions|Assertion functions]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]

## Fonti

- [TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), asserzioni e non-null.
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), controlli e type predicates.
- [TypeScript: DOM Manipulation](https://www.typescriptlang.org/docs/handbook/dom-manipulation.html), tipi di querySelector.
- [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn) e [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
