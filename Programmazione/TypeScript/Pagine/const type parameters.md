---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - const-type-parameters
  - generics
  - literal-types
aliases:
  - const generics TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
  - "[[Programmazione/TypeScript/Pagine/as const]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Variadic tuple types]]"
title: const type parameters
---

# const type parameters

## Sintesi

Un parametro generico `<const T>` richiede un'inferenza che conservi i literal degli argomenti scritti direttamente nella chiamata. E utile per helper di configurazione e tuple senza imporre `as const` a ogni chiamante.

Non crea valori costanti, copie o freeze runtime. Un parametro di tipo rimane un'informazione del compilatore, non un parametro numerico o stringa disponibile durante l'esecuzione.

Disponibile da TypeScript **5.0**; esempi verificati con **5.9.3**, `strict: true`. I blocchi sono indipendenti.

## Quando usarlo

- Builder che devono restituire la forma precisa della configurazione ricevuta.
- Helper per elenchi finiti, tuple e mappe di route.
- API in cui l'informazione literal serve per derivare nomi e risultati.

Un generic normale puo gia preservare un literal semplice, come in una funzione identita `<T>(value: T): T`. Non aggiungere `const` a tutti i generics senza verificare un beneficio.

## Come funziona

Il modificatore favorisce la precisione dei literal rispettando il vincolo generico. In TypeScript 5.9.3, un vincolo array mutabile puo produrre una tupla mutabile precisa; un vincolo readonly permette una tupla readonly. Il vincolo non e un dettaglio intercambiabile.

Il comportamento dipende anche dall'argomento: un valore gia inferito come `string[]` non contiene piu l'informazione di una tupla specifica.

## API / Sintassi

```ts
function defineRoutes<const TRoutes extends Record<string, string>>(
  routes: TRoutes
): TRoutes {
  return routes;
}

const routes = defineRoutes({
  home: "/",
  users: "/users",
});

type RouteName = keyof typeof routes;
type UserPath = typeof routes.users;

console.log(routes.users); // /users
console.log(Object.isFrozen(routes)); // false
// routes.users = "/accounts"; // Errore statico: proprieta readonly
```

`RouteName` e `"home" | "users"`; `UserPath` e `"/users"`. La funzione restituisce l'argomento originale. Il controllo statico non verifica che i percorsi siano URL validi o che corrispondano a route realmente registrate.

## Esempio pratico

Il vincolo readonly accetta sia array mutabili sia tuple readonly:

```ts
function tuple<const T extends readonly unknown[]>(value: T): T {
  return value;
}

const result = tuple(["id", "email"]);

type Field = (typeof result)[number];

console.log(result.join(", ")); // id, email
// result.push("name"); // Errore: tupla readonly
```

`result` viene inferito come `readonly ["id", "email"]`; `Field` e `"id" | "email"`. L'implementazione non modifica l'input, coerentemente con il vincolo.

## Varianti

### Vincolo mutabile e readonly

Confrontare le due firme, non soltanto la presenza di `const`:

```ts
function mutable<const T extends string[]>(value: T): T {
  return value;
}

function precise<const T extends readonly string[]>(value: T): T {
  return value;
}

const editable = mutable(["id", "email"]); // ["id", "email"]
const preserved = precise(["id", "email"]); // readonly ["id", "email"]

editable.push("id"); // Consentito: tupla mutabile
console.log(editable.length); // 3
console.log(preserved.length); // 2
// editable.push("name"); // Errore: valore fuori dai literal ammessi
```

Le vecchie release note di TypeScript 5.0 descrivono un fallback a `string[]` per il primo caso. Il comportamento e stato modificato nel compilatore: non usare quella descrizione storica come regola per 5.9.3. La modifica ufficiale e documentata nella PR collegata nelle fonti.

Una tupla mutabile puo ancora accettare `push` di un elemento compatibile, quindi la lunghezza runtime puo cambiare senza che il suo tipo diventi una nuova tupla a tre elementi. Per un elenco realmente variabile scegliere `string[]`; per proteggere la forma statica usare readonly.

### Argomenti gia allargati

```ts
function tuple<const T extends readonly unknown[]>(value: T): T {
  return value;
}

const fields = ["id", "email"]; // string[]
const fromVariable = tuple(fields); // string[]

fromVariable.push("name");
console.log(fromVariable === fields); // true
console.log(fields.length); // 3
```

Il risultato conserva il tipo dell'argomento e lo stesso riferimento. Se serve una tupla, preservarla alla definizione con `as const` oppure scrivere il letterale nella chiamata.

Anche un argomento di tipo esplicito, per esempio `tuple<string[]>(["id", "email"])`, sceglie intenzionalmente un array piu ampio.

### Contratto di una libreria

Se una libreria esporta dichiarazioni con `<const T>`, i consumatori devono usare un compilatore che comprenda la sintassi, introdotta in TypeScript 5.0. La compatibilita JavaScript del runtime e una questione separata.

Per configurazioni destinate a cambiare, tipi literal molto stretti possono essere controproducenti: preferire un contratto annotato piu ampio. Non alterare l'input attraverso alias mutabili facendo affidamento su un tipo di ritorno che descrive i literal iniziali.

## Errori comuni

- Promettere immutabilita runtime perche il parametro di tipo contiene `const`.
- Usare un vincolo mutabile e aspettarsi sempre una tupla readonly.
- Tentare di recuperare literal gia allargati in una variabile.
- Confondere inferenza precisa e validazione di dati esterni.
- Esportare la nuova sintassi senza dichiarare la versione minima supportata.

## Checklist

- Verificare il tipo inferito su letterali e variabili preesistenti.
- Scegliere vincoli readonly per input di sola lettura.
- Controllare sia la forma restituita sia l'identita runtime.
- Evitare mutazioni incompatibili con il contratto literal.
- Testare la versione TypeScript supportata dalla libreria.

## Fonti

- [TypeScript 5.0: const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters).
- [TypeScript: inferenza delle tuple adeguata al vincolo, PR 55229](https://github.com/microsoft/TypeScript/pull/55229).
- [TypeScript Handbook: generics e vincoli](https://www.typescriptlang.org/docs/handbook/2/generics.html).
- [TypeScript Handbook: readonly array](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]
- [[Programmazione/TypeScript/Pagine/Variadic tuple types|Variadic tuple types]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
