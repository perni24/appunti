---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - basics
  - types
  - primitives
  - objects
  - typeof
aliases:
  - Tipi primitivi JS
  - Data types JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
title: Tipi di Dati
---

# Tipi di Dati

## Sintesi

In JavaScript ogni valore ha un tipo.

I tipi principali si dividono in due gruppi:

- primitivi;
- oggetti.

I primitivi sono valori immutabili. Gli oggetti hanno identita e sono normalmente mutabili, ma possono avere proprieta non modificabili o essere congelati. Assegnare un oggetto a un'altra variabile non ne crea una copia indipendente.

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

Usa il formato binario floating point IEEE 754 a 64 bit. L'intervallo degli interi sicuri va da `-(2 ** 53 - 1)` a `2 ** 53 - 1`. Fuori da esso alcuni interi sono ancora rappresentabili esattamente, ma non tutti gli interi consecutivi sono distinguibili: per esempio `2 ** 53` e `2 ** 53 + 1` producono lo stesso `Number`.

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

Per identificatori o contatori interi, `Number.isSafeInteger(value)` controlla anche il limite di precisione. `Number.isInteger()` da solo non basta. Per importi e arrotondamenti occorre una regola esplicita: non presumere che i decimali siano esatti.

---
### BigInt
`bigint` rappresenta interi di precisione arbitraria, nei limiti delle risorse disponibili; non rappresenta frazioni.

```js
const value = 9007199254740993n;
```

Gli operatori aritmetici non permettono di mescolare `bigint` e `number`. I confronti relazionali, invece, possono confrontarli.

```js
// 1n + 1; // TypeError
```

```js
console.log(2n > 1);      // true
console.log(2n === 2);    // false: tipi diversi
console.log(2n == 2);     // true: confronto non stretto
console.log(5n / 2n);     // 2n: divisione intera, troncata verso zero
```

Per un intero grande proveniente da testo usa `BigInt("9007199254740993")`, non un literal `number` gia arrotondato. Convertire in `Number` puo perdere precisione; `JSON.stringify()` non serializza i BigInt senza una strategia esplicita. Vedi [[Programmazione/JavaScript/Pagine/JSON|JSON]].

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

Puo anche essere assegnato esplicitamente, restituito da una funzione senza risultato o ottenuto leggendo una proprieta assente. La distinzione con `null` e una convenzione del contratto applicativo, non una garanzia di validazione.

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

L'unicita vale per ogni chiamata a `Symbol()`. `Symbol.for("id")` cerca invece nel registro globale dei simboli e restituisce lo stesso simbolo per la stessa chiave. I simboli non rendono segrete le proprieta: possono essere individuati con `Object.getOwnPropertySymbols()`.

---
### Oggetti
Ogni valore non primitivo e un oggetto; anche le funzioni sono oggetti, con la capacita aggiuntiva di essere chiamate.

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

Le proprieta di un normale oggetto possono essere modificate, salvo vincoli come descrittori non scrivibili o `Object.freeze()`.

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

Il confronto verifica l'identita, non il contenuto. Anche i primitivi hanno casi particolari: `NaN === NaN` e `false`, mentre `0 === -0` e `true`. Per riconoscere `NaN` usa `Number.isNaN()`; `Object.is()` distingue i due zeri e considera uguali due `NaN`.

Gli argomenti delle funzioni vengono passati per valore: per un oggetto viene copiato il riferimento. Mutare l'oggetto e riassegnare il parametro hanno quindi effetti diversi; vedi [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]].

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

Per distinguere gli array usa `Array.isArray(value)`. `typeof` su un nome inesistente restituisce `"undefined"`, ma su una variabile lessicale nella TDZ genera `ReferenceError`: non e un controllo universale privo di errori.

---
### Wrapper objects
I primitivi non sono oggetti, ma JavaScript puo convertirli temporaneamente in wrapper per accedere a proprieta e metodi. `null` e `undefined` sono esclusi: un accesso diretto alle loro proprieta genera `TypeError`.

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

Schemi dei controlli comuni: `value` rappresenta un valore da fornire, non una variabile gia definita da questa sezione.

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

Confronti tra valori definiti dall'applicazione:

```js
primitiveA === primitiveB;
objectA === objectB; // riferimento
```

Evita conversioni implicite quando il tipo e importante.

## Esempio pratico

Conversione e validazione sono due operazioni diverse: `Number("")`, `Number("   ")`, `Number(null)` e `Number(false)` producono `0`, non un errore.

Questa funzione accetta un `number` intero non negativo e sicuro oppure una stringa di sole cifre decimali, con spazi esterni facoltativi. Booleani, `null`, stringhe vuote, notazione esponenziale e prefissi esadecimali sono rifiutati. Un limite massimo di eta, se richiesto, appartiene alle regole dell'applicazione.

```js
function parseAge(input) {
  if (typeof input !== "number" && typeof input !== "string") {
    throw new TypeError("Eta: atteso un numero o una stringa decimale");
  }

  if (typeof input === "string" && !/^\d+$/.test(input.trim())) {
    throw new TypeError("Eta: formato decimale non valido");
  }

  const age = Number(input);

  if (!Number.isSafeInteger(age) || age < 0) {
    throw new RangeError("Eta: atteso un intero non negativo e sicuro");
  }

  return age;
}
```

Esempi da eseguire dopo la definizione di `parseAge`:

```js
console.log(parseAge(" 30 ")); // 30
console.log(parseAge(0));      // 0
// parseAge("");              // TypeError
// parseAge(false);           // TypeError
// parseAge(-1);              // RangeError
```

Il controllo del formato precede la conversione; quello del valore la segue. Sono necessari entrambi per rispettare il contratto dichiarato.

## Varianti

- **Primitivi**: valori immutabili.
- **Oggetti**: valori con identita, normalmente mutabili.
- **Array**: oggetti indicizzati.
- **Function**: oggetti chiamabili.
- **Date, RegExp, Map, Set**: oggetti specializzati.
- **Wrapper object**: oggetti creati da `new String`, `new Number`, `new Boolean`, da evitare quasi sempre.

## Errori comuni

- Usare `typeof null` senza ricordare il bug storico.
- Confrontare oggetti diversi aspettandosi confronto per contenuto.
- Confondere `null` e `undefined`.
- Usare `new String()`, `new Number()` o `new Boolean()` senza motivo.
- Mescolare `number` e `bigint` negli operatori aritmetici.
- Usare `Number()` come se validasse da solo il formato dell'input.

---

## Checklist

- Sto distinguendo primitivi e oggetti?
- Sto confrontando oggetti per riferimento?
- Uso `Number.isNaN()` invece di controlli fragili su `NaN`?
- Uso `null` solo quando voglio rappresentare assenza intenzionale?
- Evito wrapper object manuali?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Variabili|Variabili]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]

## Fonti

- [MDN - Tipi e strutture dati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)
- [MDN - Number, precisione e conversioni](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [MDN - BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [MDN - Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
