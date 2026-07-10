---
date: 2026-06-02
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

Se almeno uno degli operandi e una stringa, il risultato tende a diventare concatenazione.

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

```js
count += 1; // count = count + 1
count *= 2; // count = count * 2
```

---
### Operatori di confronto
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
### == vs ===
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

---
### Optional chaining
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

Per dettagli sui tipi, vedi [[Tipi di Dati]].

---

## API / Sintassi

Categorie principali:

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

Fallback corretto con `??`:

```js
function createPagination({ page, pageSize }) {
  return {
    page: page ?? 1,
    pageSize: pageSize ?? 20,
  };
}
```

Se `page` vale `0`, `??` lo mantiene. Con `||`, invece, `0` verrebbe trattato come mancante.

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

- [[Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Variabili]]
- [[JSON]]
