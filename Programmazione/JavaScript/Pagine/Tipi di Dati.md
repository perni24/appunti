---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, basics, types, primitives, objects, typeof]
aliases: [Tipi primitivi JS, Data types JavaScript]
prerequisites: [Variabili]
related: [Variabili, Oggetti Avanzati, JSON]
---

# Tipi di Dati

## Sintesi

In JavaScript ogni valore ha un tipo.

I tipi principali si dividono in due gruppi:

- primitivi;
- oggetti.

I primitivi sono valori semplici e immutabili. Gli oggetti sono strutture mutabili e vengono manipolati tramite riferimento.

---

## Quando usarlo

Consulta questa nota quando devi capire come JavaScript rappresenta valori, confronta dati o converte tipi.

Serve soprattutto per:

- distinguere primitivi e oggetti;
- capire `typeof`;
- evitare errori con `null` e `undefined`;
- gestire `NaN`;
- capire confronto per valore o riferimento;
- serializzare dati in JSON;
- evitare wrapper object manuali.

## Come funziona

### Tipi primitivi
I primitivi sono:

- `string`;
- `number`;
- `bigint`;
- `boolean`;
- `undefined`;
- `symbol`;
- `null`.

```js
const name = "Luca";
const age = 30;
const active = true;
const missing = undefined;
const empty = null;
const id = Symbol("id");
const big = 9007199254740993n;
```

---
### String
Una stringa rappresenta testo.

```js
const firstName = "Luca";
const message = `Ciao, ${firstName}`;
```

Le stringhe sono immutabili.

```js
const text = "ciao";
const upper = text.toUpperCase();

console.log(text);  // "ciao"
console.log(upper); // "CIAO"
```

---
### Number
`number` rappresenta sia interi sia decimali.

```js
const integer = 42;
const decimal = 3.14;
```

Valori speciali:

- `NaN`: risultato numerico non valido;
- `Infinity`: infinito positivo;
- `-Infinity`: infinito negativo.

```js
console.log(Number.isNaN(Number("abc"))); // true
console.log(1 / 0);                       // Infinity
```

> [!WARNING]
> JavaScript usa numeri floating point. Alcune operazioni decimali possono produrre risultati non intuitivi.

```js
console.log(0.1 + 0.2); // 0.30000000000000004
```

---
### BigInt
`bigint` rappresenta interi molto grandi.

```js
const value = 9007199254740993n;
```

Non si puo mescolare direttamente `bigint` e `number`.

```js
// 1n + 1; // TypeError
```

---
### Boolean
`boolean` rappresenta `true` o `false`.

```js
const isLoggedIn = true;
const hasPermission = false;
```

E il tipo piu usato nelle condizioni.

---
### Undefined e null
`undefined` indica assenza di valore assegnato.

```js
let value;

console.log(value); // undefined
```

`null` indica assenza intenzionale di valore.

```js
const selectedUser = null;
```

Regola pratica:

- `undefined`: valore mancante o non ancora assegnato;
- `null`: valore volutamente vuoto.

---
### Symbol
`symbol` crea valori unici.

```js
const id = Symbol("id");
const anotherId = Symbol("id");

console.log(id === anotherId); // false
```

E utile per chiavi di oggetto non facilmente collisibili.

---
### Oggetti
Tutto cio che non e primitivo e un oggetto o si comporta come riferimento a una struttura oggetto.

Esempi:

- object literal;
- array;
- function;
- date;
- regexp;
- map;
- set.

```js
const user = {
  name: "Luca",
};

const numbers = [1, 2, 3];
```

Gli oggetti sono mutabili.

```js
const user = {
  name: "Luca",
};

user.name = "Marco";

console.log(user.name); // "Marco"
```

---
### Valore vs riferimento
I primitivi vengono confrontati per valore.

```js
console.log("a" === "a"); // true
console.log(10 === 10);   // true
```

Gli oggetti vengono confrontati per riferimento.

```js
console.log({} === {}); // false

const a = {};
const b = a;

console.log(a === b); // true
```

---
### typeof
`typeof` restituisce una stringa con il tipo del valore.

```js
typeof "test";    // "string"
typeof 42;        // "number"
typeof true;      // "boolean"
typeof undefined; // "undefined"
typeof 10n;       // "bigint"
typeof Symbol();  // "symbol"
typeof {};        // "object"
typeof [];        // "object"
typeof function () {}; // "function"
```

Caso storico:

```js
typeof null; // "object"
```

`typeof null` restituisce `"object"` per compatibilita storica. Non significa che `null` sia davvero un oggetto utilizzabile.

---
### Wrapper objects
I primitivi non sono oggetti, ma JavaScript puo avvolgerli temporaneamente in oggetti wrapper per usare metodi.

```js
const text = "ciao";

console.log(text.toUpperCase()); // "CIAO"
```

Non conviene creare wrapper manualmente.

```js
const a = "ciao";
const b = new String("ciao");

console.log(typeof a); // "string"
console.log(typeof b); // "object"
```

---

## API / Sintassi

Controlli comuni:

```js
typeof value;
Array.isArray(value);
Number.isNaN(value);
value === null;
value === undefined;
```

Conversioni esplicite:

```js
String(value);
Number(value);
Boolean(value);
BigInt(value);
```

Confronti:

```js
primitiveA === primitiveB;
objectA === objectB; // riferimento
```

Evita conversioni implicite quando il tipo e importante.

## Esempio pratico

Validazione semplice di input numerico:

```js
function parseAge(input) {
  const age = Number(input);

  if (!Number.isInteger(age) || age < 0) {
    throw new Error("Eta non valida");
  }

  return age;
}
```

Convertire esplicitamente rende chiaro quando una stringa diventa numero e permette di gestire `NaN`.

## Varianti

- **Primitivi**: valori immutabili.
- **Oggetti**: valori mutabili per riferimento.
- **Array**: oggetti indicizzati.
- **Function**: oggetti chiamabili.
- **Date, RegExp, Map, Set**: oggetti specializzati.
- **Wrapper object**: oggetti creati da `new String`, `new Number`, `new Boolean`, da evitare quasi sempre.

## Errori comuni

- Usare `typeof null` senza ricordare il bug storico.
- Confrontare oggetti diversi aspettandosi confronto per contenuto.
- Confondere `null` e `undefined`.
- Usare `new String()`, `new Number()` o `new Boolean()` senza motivo.
- Mescolare `number` e `bigint`.

---

## Checklist

- Sto distinguendo primitivi e oggetti?
- Sto confrontando oggetti per riferimento?
- Uso `Number.isNaN()` invece di controlli fragili su `NaN`?
- Uso `null` solo quando voglio rappresentare assenza intenzionale?
- Evito wrapper object manuali?

---

## Collegamenti

- [[Variabili]]
- [[Oggetti Avanzati]]
- [[JSON]]
- [[Immutabilita e Copia degli Oggetti]]
- [[Map e Set]]
