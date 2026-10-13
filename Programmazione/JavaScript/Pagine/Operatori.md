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
  - operators
  - comparison
  - logical-operators
aliases:
  - Operatori JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Strutture Condizionali]]"
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
title: Operatori
---

# Operatori

## Sintesi

Gli operatori permettono di combinare, confrontare, trasformare o assegnare valori.

In JavaScript e importante conoscere non solo la sintassi, ma anche le conversioni implicite, soprattutto con `+`, `==`, `&&`, `||` e `??`.

---

## Quando usarlo

Gli operatori si usano in quasi ogni espressione JavaScript: calcoli, confronti, condizioni, fallback, accesso sicuro e assegnazioni.

Sono particolarmente importanti quando:

- confronti valori;
- scegli fallback;
- costruisci condizioni;
- lavori con valori opzionali;
- converti input;
- componi espressioni compatte.

Nel dubbio, preferisci espressioni esplicite e leggibili a combinazioni troppo dense.

## Come funziona

### Operatori aritmetici
| Operatore | Significato | Esempio |
| --- | --- | --- |
| `+` | Addizione o concatenazione | `1 + 2` |
| `-` | Sottrazione | `5 - 2` |
| `*` | Moltiplicazione | `3 * 4` |
| `/` | Divisione | `10 / 2` |
| `%` | Resto | `10 % 3` |
| `**` | Potenza | `2 ** 3` |
| `++` | Incremento | `count++` |
| `--` | Decremento | `count--` |

```js
const total = 10 + 5;
const rest = 10 % 3;
const power = 2 ** 4;
```

---
### Operatore +
`+` somma numeri ma concatena stringhe.

```js
console.log(1 + 2);       // 3
console.log("1" + 2);     // "12"
console.log(1 + "2");     // "12"
console.log("a" + "b");   // "ab"
```

Prima gli operandi vengono convertiti in primitivi. Se uno dei risultati e una stringa, `+` tenta la concatenazione; altrimenti esegue un'addizione numerica. Non e una validazione del dato: alcune conversioni, per esempio quella implicita di un `Symbol` in stringa, generano `TypeError`.

Per conversioni numeriche esplicite:

```js
const value = Number("42");

console.log(value + 1); // 43
```

---
### Operatori di assegnazione
```js
let count = 0;

count += 1;
count -= 1;
count *= 2;
count /= 2;
```

Equivalenze:

Per la semplice variabile `count` definita sopra valgono le forme seguenti. In generale una assegnazione composta valuta il lato sinistro una sola volta: con chiamate, getter o indici con effetti collaterali non espanderla meccanicamente ripetendo quell'espressione.

```js
count += 1; // count = count + 1
count *= 2; // count = count * 2
```

---
### Operatori di confronto
| Operatore | Significato |
| --- | --- |
| `===` | Uguaglianza senza conversione; identita per gli oggetti |
| `!==` | Negazione dell'uguaglianza stretta |
| `>` | Maggiore |
| `>=` | Maggiore o uguale |
| `<` | Minore |
| `<=` | Minore o uguale |

```js
console.log(5 === 5);   // true
console.log(5 === "5"); // false
console.log(10 > 3);    // true
```

---
### Confronto tra `==` e `===`
`==` fa conversioni implicite prima del confronto.

```js
console.log(5 == "5"); // true
```

`===` confronta senza conversione implicita.

```js
console.log(5 === "5"); // false
```

> [!IMPORTANT]
> Nel codice moderno usa quasi sempre `===` e `!==`.

`===` non esegue un confronto strutturale degli oggetti. Inoltre `NaN === NaN` e `false` e `0 === -0` e `true`. Per questi casi vedi [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]].

---
### Operatori logici
```js
const isAdult = true;
const hasLicense = false;

console.log(isAdult && hasLicense); // false
console.log(isAdult || hasLicense); // true
console.log(!isAdult);              // false
```

`&&` restituisce il primo valore falsy oppure l'ultimo valore.

```js
console.log("user" && "profile"); // "profile"
console.log(null && "profile");   // null
```

`||` restituisce il primo valore truthy oppure l'ultimo valore.

```js
console.log("" || "default");     // "default"
console.log("Luca" || "default"); // "Luca"
```

---
### Nullish coalescing
`??` restituisce il valore a destra solo se quello a sinistra e `null` o `undefined`.

```js
const name = null ?? "Guest";
const count = 0 ?? 10;

console.log(name);  // "Guest"
console.log(count); // 0
```

Differenza con `||`:

```js
console.log(0 || 10); // 10
console.log(0 ?? 10); // 0
```

`??` e utile quando `0`, `false` o `""` sono valori validi.

`&&`, `||` e `??` eseguono **short-circuit**: il lato destro viene valutato soltanto se necessario. Non restituiscono necessariamente booleani. Non puoi mescolare direttamente `??` con `||` o `&&` senza parentesi.

```js
let calls = 0;
const keepZero = 0 ?? ++calls;
const useFallback = 0 || ++calls;
console.log(keepZero, useFallback, calls); // 0 1 1
console.log((null ?? false) || "fallback"); // "fallback"
// null ?? false || "fallback"; // SyntaxError: servono parentesi
```

---
### Optional chaining
`?.` interrompe la catena quando il valore immediatamente a sinistra di quel punto opzionale e `null` o `undefined`. Ogni livello potenzialmente assente va considerato: `user?.profile.name` non protegge da un `profile` assente quando `user` esiste.

```js
const user = null;

console.log(user?.profile?.name); // undefined
```

Senza optional chaining:

```js
// user.profile.name; // TypeError
```

La variabile di partenza deve essere dichiarata. Le parentesi possono interrompere la catena e `?.()` non rende chiamabile un valore che non e una funzione.

```js
const customer = { profile: null, notify: 42 };
console.log(customer?.profile?.name); // undefined
// (customer?.profile).name;          // TypeError
// customer.notify?.();               // TypeError
// missingCustomer?.name;             // ReferenceError se il nome non esiste
```

### Precedenza e incremento

La precedenza stabilisce come raggruppare l'espressione; le parentesi rendono esplicita la scelta. Il post-incremento restituisce il valore precedente, il pre-incremento quello aggiornato.

```js
console.log(2 + 3 * 4);   // 14
console.log((2 + 3) * 4); // 20
let count = 1;
const before = count++;
const after = ++count;
console.log(before, after, count); // 1 3 3
```

---
### Operatore ternario
Il ternario e una forma compatta di `if...else` per espressioni semplici.

```js
const age = 20;
const label = age >= 18 ? "adulto" : "minorenne";
```

Evita ternari troppo annidati: diventano difficili da leggere.

---
### typeof
`typeof` restituisce una stringa con il tipo del valore.

```js
typeof "Luca"; // "string"
typeof 42;     // "number"
typeof null;   // "object"
```

Per dettagli sui tipi, vedi [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]].

---

## API / Sintassi

Schemi delle categorie principali: gli operandi (`a`, `b`, `value`, `object` e gli altri nomi) devono essere forniti dall'applicazione.

```js
a + b;
a - b;
a * b;
a / b;
```

```js
a === b;
a !== b;
a > b;
```

```js
condition && value;
condition || fallback;
value ?? fallback;
!value;
```

```js
object?.property;
condition ? a : b;
```

```js
count += 1;
```

Usa `===`, `!==` e `??` quando vuoi evitare conversioni o fallback indesiderati.

## Esempio pratico

Paginazione con indice di pagina **a partire da zero**. I fallback e la validazione hanno ruoli distinti:

```js
function createPagination({ page, pageSize } = {}) {
  const pagination = {
    page: page ?? 0,
    pageSize: pageSize ?? 20,
  };

  if (!Number.isSafeInteger(pagination.page) || pagination.page < 0) {
    throw new RangeError("page deve essere un intero non negativo");
  }
  if (!Number.isSafeInteger(pagination.pageSize) || pagination.pageSize <= 0) {
    throw new RangeError("pageSize deve essere un intero positivo");
  }
  return pagination;
}
```

`createPagination()` usa i default; `createPagination({ page: 0 })` conserva lo zero. Le stringhe numeriche non vengono convertite implicitamente e `pageSize: 0` e rifiutato. L'argomento deve essere un oggetto o essere omesso: il default del parametro non si applica a `null`.

## Varianti

- **Aritmetici**: calcoli numerici e concatenazione con `+`.
- **Assegnazione**: modifica variabili.
- **Confronto**: uguaglianza e ordinamento.
- **Logici**: `&&`, `||`, `!`.
- **Nullish**: `??`.
- **Optional chaining**: `?.`.
- **Ternario**: scelta compatta tra due valori.
- **Tipo**: `typeof`, `instanceof`.

## Errori comuni

- Usare `==` invece di `===`.
- Usare `||` quando serve `??`.
- Dimenticare che `+` concatena stringhe.
- Scrivere ternari troppo complessi.
- Confondere `&&` e `||` con operatori che restituiscono sempre booleani.

---

## Checklist

- Sto usando `===` o `!==`?
- Ho bisogno di `||` o di `??`?
- Il valore `0` deve essere considerato valido?
- Il ternario resta leggibile?
- Sto gestendo il caso `null` o `undefined`?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/JavaScript/Pagine/Variabili|Variabili]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]

## Fonti

- [MDN - Operatori](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators)
- [MDN - Addizione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition)
- [MDN - Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [MDN - Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
