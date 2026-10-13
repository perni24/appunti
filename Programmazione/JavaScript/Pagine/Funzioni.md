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
  - functions
  - parameters
  - return
aliases:
  - Funzioni JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Arrow Functions]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
title: Funzioni
---

# Funzioni

## Sintesi

Le funzioni sono blocchi di codice riutilizzabili.

In JavaScript le funzioni sono valori: possono essere assegnate a variabili, passate come argomenti e restituite da altre funzioni.

---

## Quando usarlo

Usa funzioni per dare un nome a un comportamento, riusare logica e separare responsabilita.

Casi comuni:

- evitare duplicazione;
- isolare calcoli;
- validare input;
- creare API interne;
- passare comportamento come callback;
- rendere testabile una parte del codice.

Una buona funzione dovrebbe avere un compito principale e parametri comprensibili.

## Come funziona

### Function declaration
Una function declaration definisce una funzione con nome.

```js
function greet(name) {
  return `Ciao ${name}`;
}

console.log(greet("Luca"));
```

Le function declaration sono soggette a hoisting: possono essere chiamate prima della dichiarazione.

```js
console.log(sum(2, 3)); // 5

function sum(a, b) {
  return a + b;
}
```

---
### Function expression
Una function expression produce una funzione come valore; qui la assegniamo a una variabile.

```js
const greet = function (name) {
  return `Ciao ${name}`;
};
```

In questo caso, la variabile segue le regole di `const` o `let`.

Con `var`, invece, prima dell'assegnazione il valore sarebbe `undefined`: tentare la chiamata produrrebbe un `TypeError`, non il `ReferenceError` della temporal dead zone.

```js
// greet("Luca"); // ReferenceError

const greet = function (name) {
  return `Ciao ${name}`;
};
```

---
### Arrow function
Le arrow function sono una sintassi compatta.

```js
const sum = (a, b) => {
  return a + b;
};
```

Con un solo return, si puo usare il return implicito.

```js
const sum = (a, b) => a + b;
```

Le arrow function non hanno un proprio `this`.

Per restituire un oggetto con return implicito, racchiudilo tra parentesi: senza di esse le graffe iniziano il corpo della funzione.

```js
const createUser = name => ({ name });
console.log(createUser("Ada")); // { name: "Ada" }
```

Per dettagli, vedi [[Programmazione/JavaScript/Pagine/Arrow Functions|Arrow Functions]] e [[Programmazione/JavaScript/Pagine/Context|Context]].

---
### Parametri e argomenti
I parametri sono i nomi nella definizione.

Gli argomenti sono i valori passati alla chiamata.

```js
function multiply(a, b) {
  return a * b;
}

multiply(2, 3);
```

In questo esempio:

- `a` e `b` sono parametri;
- `2` e `3` sono argomenti.

Un argomento mancante vale `undefined`, salvo un default. Argomenti aggiuntivi non causano automaticamente un errore; raccoglili con un parametro rest se fanno parte del contratto.

Il passaggio e sempre per valore. Per gli oggetti viene copiato il valore del riferimento: la funzione puo modificare l'oggetto condiviso, ma riassegnare il parametro non riassegna la variabile del chiamante.

```js
function updateProfile(profile) {
  profile.name = "Grace";
  profile = { name: "Linus" };
  return profile;
}

const original = { name: "Ada" };
const replacement = updateProfile(original);

console.log(original.name);    // Grace
console.log(replacement.name); // Linus
```

---
### Parametri di default
```js
function greet(name = "Guest") {
  return `Ciao ${name}`;
}

console.log(greet());       // "Ciao Guest"
console.log(greet("Luca")); // "Ciao Luca"
console.log(greet(undefined)); // "Ciao Guest"
console.log(greet(null));      // "Ciao null"
```

Il default interviene solo per argomento omesso o `undefined`, non per `null`, `0`, `false` o stringa vuota. Non valida il tipo ricevuto.

---
### Rest parameters
`...` raccoglie piu argomenti in un array.

Il parametro rest deve essere l'ultimo; nell'esempio gli argomenti sono numeri gia validati.

```js
function sumAll(...numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

console.log(sumAll(1, 2, 3)); // 6
```

---
### return
`return` termina la funzione e restituisce un valore.

```js
function getArea(size) {
  if (size <= 0) {
    return 0;
  }

  return size * size;
}
```

Se una funzione ordinaria termina normalmente senza `return`, restituisce `undefined`. Una funzione `async` restituisce invece una Promise; un generatore restituisce un iteratore.

```js
function logMessage(message) {
  console.log(message);
}

console.log(logMessage("test")); // undefined
```

Non andare a capo subito dopo `return`: l'inserimento automatico del punto e virgola termina l'istruzione prima del valore. Questo e un esempio volutamente errato:

```js
function brokenResult() {
  return
    { ok: true };
}

console.log(brokenResult()); // undefined
```

Scrivi `return { ok: true };`, oppure apri una parentesi sulla stessa riga di `return` per espressioni su piu righe.

---
### Funzioni come valori
Le funzioni possono essere passate ad altre funzioni.

```js
function run(callback) {
  callback();
}

run(() => {
  console.log("Eseguito");
});
```

Questo e alla base di callback, event listener e molte API JavaScript.

---
### Pure function
Una funzione pura restituisce lo stesso risultato con gli stessi input e non modifica stato esterno.

```js
function add(a, b) {
  return a + b;
}
```

Esempio non puro:

```js
let total = 0;

function addToTotal(value) {
  total += value;
}
```

Le funzioni pure sono piu facili da testare e ragionare.

---

## API / Sintassi

Forme principali:

```js
function name(param) {
  return param;
}
```

```js
const name = function (param) {
  return param;
};
```

```js
const name = (param) => param;
```

Parametri:

```js
function fn(required, optional = "default", ...rest) {}
```

Chiamata della funzione `fn` definita nel blocco precedente. Il nome `required` da solo non rende obbligatorio l'argomento: se serve, valida esplicitamente la sua presenza.

```js
const result = fn("value");
```

## Esempio pratico

Separare una regola di dominio. `discountRate` e una frazione tra `0` e `1`, non un numero tra `0` e `100`:

```js
function calculateFinalPrice(price, discountRate = 0) {
  if (!Number.isFinite(price) || !Number.isFinite(discountRate)) {
    throw new TypeError("Prezzo e sconto devono essere numeri finiti");
  }

  if (price < 0 || discountRate < 0 || discountRate > 1) {
    throw new RangeError("Prezzo non negativo e sconto tra 0 e 1 richiesti");
  }

  return price - price * discountRate;
}

console.log(calculateFinalPrice(100, 0.2)); // 80
console.log(calculateFinalPrice(100));      // 100
```

La funzione ha input espliciti, ritorna un valore e puo essere testata senza dipendere da stato esterno.

`Number.isFinite()` non converte stringhe: rifiuta `"100"`, `NaN` e `Infinity`. Questo esempio non definisce una politica di arrotondamento monetario; per importi reali devi scegliere rappresentazione e regole di arrotondamento, senza supporre che i decimali `Number` siano sempre esatti.

## Varianti

- **Function declaration**: dichiarazione con hoisting.
- **Function expression**: funzione assegnata a variabile.
- **Arrow function**: sintassi compatta, `this` lessicale.
- **Metodo di oggetto**: funzione come proprieta.
- **Funzione async**: restituisce sempre Promise.
- **Generator function**: produce valori con `yield`.
- **Higher-order function**: riceve o restituisce funzioni.

## Errori comuni

- Dimenticare `return`.
- Confondere parametri e argomenti.
- Usare arrow function quando serve un `this` dinamico.
- Creare funzioni troppo lunghe con troppe responsabilita.
- Dipendere da stato globale senza necessita.

---

## Checklist

- La funzione ha un nome chiaro?
- Fa una sola cosa principale?
- I parametri sono pochi e comprensibili?
- Restituisce esplicitamente cio che serve?
- Potrebbe essere una funzione pura?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Arrow Functions|Arrow Functions]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]

## Fonti

- [MDN: funzioni e passaggio degli argomenti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions).
- [MDN: parametri di default](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters).
- [MDN: return e inserimento automatico del punto e virgola](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return).
- [MDN: Number e precisione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
