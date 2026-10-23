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
  - array
  - tuple
  - readonly
  - collezioni
aliases:
  - Array Tuple Readonly
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Variadic tuple types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
title: Array, Tuple e Readonly
---

# Array, Tuple e Readonly

## Sintesi

Un array descrive il tipo degli elementi; una tupla descrive anche le posizioni. Gli elementi di un array possono avere un tipo union, quindi non devono essere tutti della stessa categoria JavaScript.

`readonly` limita le scritture attraverso un riferimento durante il type check. Non congela l'oggetto a runtime e non rende automaticamente immutabili gli elementi annidati.

## Quando usarlo

- Liste di elementi dello stesso tipo.
- Ritorni multipli con significato posizionale.
- Coordinate, range, coppie chiave-valore.
- API dove vuoi impedire modifiche accidentali.
- Dati costanti o configurazioni immutabili.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

- `T[]` e `Array<T>` sono equivalenti. La lunghezza puo cambiare.
- `[string, number]` assegna un tipo a ogni posizione; le etichette come `[id: string, count: number]` aiutano la lettura ma non creano proprieta `id` e `count`.
- `readonly T[]` e `ReadonlyArray<T>` escludono scritture e metodi come `push` e `sort` attraverso quel riferimento.
- Un array modificabile puo essere passato a chi accetta `readonly`; il contrario non e ammesso senza una copia o un'asserzione.

L'accesso fuori limite restituisce `undefined` a runtime. Con `noUncheckedIndexedAccess: true`, anche la lettura dinamica di un normale `T[]` include `undefined`. `strict` da solo non abilita questa opzione.

## API / Sintassi

```ts
const names: string[] = ["Luca", "Marta"];
const scores: Array<number> = [10, 20, 30];

const point: [number, number] = [10, 20];
const readonlyNames: readonly string[] = ["Luca", "Marta"];
const values: (string | number)[] = ["Luca", 3];

// readonlyNames.push("Anna"); // Errore statico.
// point[2]; // Errore: indice letterale fuori dalla tupla.
```

## Esempio pratico

Una tupla breve rappresenta un codice e un messaggio. La funzione normalizza una descrizione locale; non decodifica un protocollo di errori HTTP.

```ts
type ApiError = readonly [code: string, message: string];

function parseError(input: unknown): ApiError {
  if (typeof input === "string") {
    return ["UNKNOWN", input];
  }

  return ["INVALID_INPUT", "Input non valido"];
}

const [code, message] = parseError("Timeout");
console.log(code, message); // UNKNOWN Timeout
```

Le etichette spiegano le posizioni. Per strutture piu grandi o con campi opzionali numerosi, un oggetto e piu leggibile.

### Copie e mutabilita

```ts
function sortedScores(scores: readonly number[]): number[] {
  return [...scores].sort((left, right) => left - right);
}

const scores = [30, 2, 10];
const ordered = sortedScores(scores);
console.log(scores); // [30, 2, 10]
console.log(ordered); // [2, 10, 30]
```

La copia impedisce a `sort` di modificare l'array originale; il comparatore evita l'ordinamento lessicografico. Per questo esempio si assumono numeri finiti. Una copia con spread resta superficiale.

`readonly` non garantisce che nessun altro riferimento modifichi gli stessi dati:

```ts
const mutable = [{ name: "Luca" }];
const view: readonly { name: string }[] = mutable;
view[0]!.name = "Marta"; // readonly non riguarda name.
mutable.push({ name: "Anna" }); // La vista vede anche il nuovo elemento.
console.log(view.length); // 2
```

Il `!` qui e limitato alla prima posizione appena inizializzata; per array esterni o modificati altrove controlla prima l'esistenza. `Readonly<T>` e `as const` non sono alternative a `Object.freeze` quando serve una restrizione runtime; anche freeze ordinario e superficiale.

### Limiti delle tuple modificabili

```ts
const pair: [string, number] = ["u_1", 2];
pair.push(3); // Consentito: il metodo accetta tipi degli elementi.
console.log(pair.length); // 3 a runtime, nonostante il tipo della tupla.
// pair[2]; // Il checker continua a considerare due posizioni dichiarate.
```

Una tupla modificabile non e un contenitore runtime a lunghezza bloccata. Se vuoi impedire modifiche accidentali attraverso l'API, esponi `readonly [string, number]`.

## Varianti

- **Array mutable**: `string[]`.
- **Array readonly**: `readonly string[]`.
- **Tuple**: `[string, number]`.
- **Named tuple elements**: `[id: string, count: number]`.
- **Readonly tuple**: `readonly [number, number]`.
- **Tupla con elementi opzionali/rest**: `[name: string, age?: number]` o `[head: string, ...tail: number[]]`; non tutte le tuple hanno lunghezza esattamente fissa.

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

- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Variadic tuple types|Variadic tuple types]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]

## Fonti

- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html), array readonly e tuple.
- [TSConfig: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).
- [TypeScript 3.4: readonly tuples e const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html).
- [MDN: Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) e [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
