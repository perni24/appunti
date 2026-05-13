---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, objects, object-methods, es6]
aliases: [Oggetti JS, Object methods]
prerequisites: [Tipi di Dati, Variabili]
related: [Property Descriptors, Immutabilita e Copia degli Oggetti, Prototypes]
---

# Oggetti Avanzati

## Sintesi

Gli oggetti sono una delle strutture fondamentali di JavaScript.

Oltre alla sintassi base, JavaScript offre shorthand, computed properties, metodi statici di `Object`, descriptor, copia, freezing e integrazione con prototipi.

---

## Object literal

```js
const user = {
  name: "Luca",
  role: "admin",
};
```

Un oggetto e una collezione di coppie chiave-valore.

Le chiavi sono normalmente stringhe o simboli.

---

## Property shorthand

Se variabile e proprieta hanno lo stesso nome, puoi abbreviare.

```js
const name = "Luca";
const role = "admin";

const user = {
  name,
  role,
};
```

---

## Method shorthand

```js
const calculator = {
  sum(a, b) {
    return a + b;
  },
};
```

Evita di scrivere:

```js
const calculator = {
  sum: function (a, b) {
    return a + b;
  },
};
```

---

## Computed property names

Puoi calcolare il nome di una proprieta.

```js
const field = "email";

const user = {
  [field]: "luca@example.com",
};

console.log(user.email);
```

---

## Object.keys, values, entries

```js
const user = {
  name: "Luca",
  role: "admin",
};

console.log(Object.keys(user));    // ["name", "role"]
console.log(Object.values(user));  // ["Luca", "admin"]
console.log(Object.entries(user)); // [["name", "Luca"], ["role", "admin"]]
```

`Object.entries()` e utile per trasformare oggetti in array.

```js
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}
```

---

## Object.fromEntries

`Object.fromEntries()` trasforma coppie `[key, value]` in oggetto.

```js
const entries = [
  ["name", "Luca"],
  ["role", "admin"],
];

const user = Object.fromEntries(entries);
```

---

## Object.assign e spread

`Object.assign()` copia proprieta da uno o piu oggetti sorgente.

```js
const user = Object.assign({}, { role: "reader" }, { name: "Luca" });
```

Nel codice moderno spesso si usa lo spread.

```js
const user = {
  ...baseUser,
  name: "Luca",
};
```

Entrambi fanno una copia superficiale.

---

## Object.hasOwn

`Object.hasOwn()` verifica se una proprieta appartiene direttamente all'oggetto.

```js
const user = {
  name: "Luca",
};

console.log(Object.hasOwn(user, "name")); // true
```

E piu sicuro di chiamare direttamente `hasOwnProperty()` sull'oggetto.

---

## this nei metodi

Nei metodi normali, `this` dipende da come viene chiamata la funzione.

```js
const user = {
  name: "Luca",
  greet() {
    return `Ciao ${this.name}`;
  },
};
```

Evita arrow function per metodi che devono usare `this`.

---

## Copia superficiale

Spread e `Object.assign()` fanno copie superficiali.

```js
const original = {
  profile: {
    name: "Luca",
  },
};

const copy = {
  ...original,
};

copy.profile.name = "Marco";

console.log(original.profile.name); // "Marco"
```

Per copie profonde, vedi [[Immutabilita e Copia degli Oggetti]].

---

## Errori comuni

- Pensare che spread faccia deep copy.
- Usare arrow function come metodo con `this`.
- Iterare oggetti come se fossero array.
- Confondere oggetto semplice e `Map` per chiavi dinamiche complesse.
- Aspettarsi che `Object.assign()` preservi descriptor e prototipo.

---

## Checklist

- Serve un oggetto semplice o una `Map`?
- Sto copiando in modo superficiale o profondo?
- Sto usando `this` correttamente?
- Devo preservare descriptor o prototipo?
- I nomi delle proprieta sono chiari?

---

## Collegamenti

- [[Property Descriptors]]
- [[Immutabilita e Copia degli Oggetti]]
- [[Map e Set]]
- [[Prototypes]]
- [[Context]]
