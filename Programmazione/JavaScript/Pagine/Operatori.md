---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, basics, operators, comparison, logical-operators]
aliases: [Operatori JS]
prerequisites: [Variabili, Tipi di Dati]
related: [Strutture Condizionali, Tipi di Dati]
---

# Operatori

## Sintesi

Gli operatori permettono di combinare, confrontare, trasformare o assegnare valori.

In JavaScript e importante conoscere non solo la sintassi, ma anche le conversioni implicite, soprattutto con `+`, `==`, `&&`, `||` e `??`.

---

## Operatori aritmetici

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

## Operatore +

`+` somma numeri ma concatena stringhe.

```js
console.log(1 + 2);       // 3
console.log("1" + 2);     // "12"
console.log(1 + "2");     // "12"
console.log("a" + "b");   // "ab"
```

Se almeno uno degli operandi e una stringa, il risultato tende a diventare concatenazione.

Per conversioni numeriche esplicite:

```js
const value = Number("42");

console.log(value + 1); // 43
```

---

## Operatori di assegnazione

```js
let count = 0;

count += 1;
count -= 1;
count *= 2;
count /= 2;
```

Equivalenze:

```js
count += 1; // count = count + 1
count *= 2; // count = count * 2
```

---

## Operatori di confronto

| Operatore | Significato |
| --- | --- |
| `===` | Uguale per valore e tipo |
| `!==` | Diverso per valore o tipo |
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

## == vs ===

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

---

## Operatori logici

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

## Nullish coalescing

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

---

## Optional chaining

`?.` permette di leggere proprieta annidate senza generare errore se una parte e `null` o `undefined`.

```js
const user = null;

console.log(user?.profile?.name); // undefined
```

Senza optional chaining:

```js
// user.profile.name; // TypeError
```

---

## Operatore ternario

Il ternario e una forma compatta di `if...else` per espressioni semplici.

```js
const age = 20;
const label = age >= 18 ? "adulto" : "minorenne";
```

Evita ternari troppo annidati: diventano difficili da leggere.

---

## typeof

`typeof` restituisce una stringa con il tipo del valore.

```js
typeof "Luca"; // "string"
typeof 42;     // "number"
typeof null;   // "object"
```

Per dettagli sui tipi, vedi [[Tipi di Dati]].

---

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

- [[Tipi di Dati]]
- [[Strutture Condizionali]]
- [[Variabili]]
- [[JSON]]
