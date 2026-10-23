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
  - type-predicates
  - type-guards
  - narrowing
aliases:
  - Type predicate
  - value is Type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Assertion functions]]"
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
title: Type predicates
---

# Type predicates

## Sintesi

Un **type predicate** e una firma di ritorno del tipo `value is Type`. Comunica una classificazione al checker: nel ramo `true` il valore appartiene a `Type`; nel ramo `false` il checker lo esclude dal tipo di partenza quando puo rappresentare tale esclusione.

E il meccanismo principale per creare type guard personalizzati.

## Quando usarlo

- Quando un controllo runtime va riutilizzato.
- Quando devi filtrare array di union.
- Quando vuoi restringere `unknown` a un tipo applicativo.
- Quando una libreria restituisce valori non abbastanza tipizzati.
- Quando vuoi evitare ripetizione di controlli `typeof` e `in`.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

La funzione restituisce un booleano; `value is Type` non e un valore JavaScript. `value` deve riferirsi a un parametro e il tipo promesso deve essere assegnabile al tipo del parametro. Il checker verifica questi vincoli e il corpo come codice ordinario, ma non dimostra che il booleano sia una classificazione corretta.

Non basta che ogni `true` sia giusto: anche un `false` deve avere il significato promesso. Una guardia che cerca solo alcuni numeri non puo dichiarare genericamente "e un number", perche il ramo falso potrebbe contenere altri numeri.

## API / Sintassi

```ts
function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
```

Questo e un controllo della categoria `number`, quindi accetta anche `NaN` e infinito. Un controllo "finito e positivo" esprime un criterio piu ristretto, non lo stesso predicate su una union numeri/stringhe.

## Esempio pratico

```ts
type Admin = {
  role: "admin";
  permissions: string[];
};

type Guest = {
  role: "guest";
};

type User = Admin | Guest;

function isAdmin(user: User): user is Admin {
  return user.role === "admin";
}

function listPermissions(user: User): string[] {
  if (isAdmin(user)) {
    return user.permissions;
  }

  return [];
}

const users: User[] = [
  { role: "guest" },
  { role: "admin", permissions: ["read"] },
];
const admins = users.filter(isAdmin); // Admin[]
console.log(admins.map((admin) => admin.permissions)); // [["read"]]
```

Il parametro e gia `User`: il discriminante e sufficiente a scegliere `Admin` o `Guest` all'interno di questo modello. Su JSON `unknown` non basterebbe leggere `role`, perche mancherebbe la verifica di `permissions`.

Questo e un modello locale, non un'autorizzazione: un ruolo inviato dal client non conferisce permessi sul server. `filter` crea un array nuovo ma conserva i riferimenti agli oggetti; `listPermissions` restituisce l'array originale per l'admin.

### Predicate inferiti e filtri nullable

```ts
const values: (number | null)[] = [0, 1, null];
const present = values.filter((value) => value !== null); // number[]
const truthy = values.filter((value) => !!value); // (number | null)[]
const viaBoolean = values.filter(Boolean); // (number | null)[]

console.log(present); // [0, 1]
console.log(truthy, viaBoolean); // [1] [1]
```

Dalla versione 5.5 TypeScript puo inferire predicate in casi idonei: ritorno singolo, nessun ritorno implicito, parametro non mutato e un controllo booleano che ne restringe il tipo. Un'annotazione esplicita `: boolean` impedisce questa inferenza.

`!!value` non e una classificazione completa dei numeri, perche `false` puo significare zero oppure null. Anche `filter(Boolean)` non diventa automaticamente un filtro di `NonNullable`. Il risultato runtime e distinto dal tipo statico.

Per escludere soltanto null e undefined, conservando zero, false e stringa vuota:

```ts
function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const values: (string | number | boolean | null | undefined)[] =
  ["", 0, false, null, undefined];
const present = values.filter(isPresent);
console.log(present); // ["", 0, false]
```

### Controesempio: predicate valido solo nel ramo vero

Il codice seguente compila ma il contratto e sbagliato; non usarlo come guardia:

```ts
function isSmallNumberUnsafe(value: string | number): value is number {
  return typeof value === "number" && Math.abs(value) < 10;
}

function describeUnsafe(value: string | number): string {
  if (isSmallNumberUnsafe(value)) {
    return value.toFixed(1);
  }
  return value.toUpperCase(); // Il checker crede che sia string.
}

console.log(describeUnsafe("ciao")); // CIAO
// describeUnsafe(20); // Compila, ma lancia TypeError.
```

Un numero grande finisce nel ramo falso, violando la promessa. Per un criterio di selezione usa un ritorno `boolean` e un successivo `typeof` quando serve distinguere i tipi, oppure modella un sottotipo realmente rappresentabile e validato. Non inventare un predicate solo per far compilare `filter`.

## Varianti

- **Predicate su parametro**: `value is Type`.
- **Predicate generico**: per esempio `value is NonNullable<T>` con controlli coerenti, non un cast arbitrario verso `T`.
- **Predicate per array filter**: filtra valori nullable o union.
- **Assertion function**: restringe dopo il ritorno normale, non divide il flusso con un booleano.

## Errori comuni

- **Restituire `value is Type` senza controllo reale**: equivale a mentire al compilatore.
- **Controllare solo un campo debole**: meglio usare discriminanti stabili.
- **Usare predicate quando serve validazione dettagliata**: per input complessi meglio parser/schema.
- **Non testare type guard critici**: un bug nel guard propaga tipi sbagliati ovunque.

## Checklist

- Usare predicate per controlli piccoli e riutilizzabili.
- Verificare i campi necessari, non solo quelli comodi.
- Tenere input del guard come `unknown` quando viene da fuori.
- Testare guard usati su confini runtime.
- Preferire discriminated union quando controlli oggetti interni.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Assertion functions|Assertion functions]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]


## Fonti

- [TypeScript: type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates).
- [TypeScript 5.5: inferred type predicates](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html), inferenza e significato dei due rami.
- [TypeScript: NonNullable](https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
