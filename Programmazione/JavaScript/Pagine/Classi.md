---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, oop, classes, prototypes]
aliases: [Classi JS, JavaScript Classes]
prerequisites: [Funzioni, Prototypes, Context]
related: [Ereditarietà, Incapsulamento, Private Fields e Static Blocks, Prototypes]
---

# Classi

## Sintesi

Le classi JavaScript sono una sintassi moderna per creare oggetti, istanze, metodi e gerarchie.

Sotto il cofano, restano basate sul modello prototipale di JavaScript.

---

## Sintassi base

```js
class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Ciao, sono ${this.name}`;
  }
}

const user = new User("Luca");

console.log(user.greet()); // "Ciao, sono Luca"
```

`constructor` viene eseguito quando crei una nuova istanza con `new`.

---

## Metodi di istanza

I metodi dichiarati nel corpo della classe finiscono sul prototipo.

```js
class Counter {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count += 1;
  }
}
```

Ogni istanza condivide gli stessi metodi, invece di duplicarli.

---

## Campi pubblici

I campi pubblici definiscono proprieta di istanza.

```js
class User {
  role = "reader";

  constructor(name) {
    this.name = name;
  }
}
```

Sono utili per rendere visibile la forma dell'oggetto.

---

## Metodi statici

I metodi statici appartengono alla classe, non alle istanze.

```js
class MathUtils {
  static sum(a, b) {
    return a + b;
  }
}

console.log(MathUtils.sum(2, 3)); // 5
```

Sono adatti a factory, utility e metodi che non dipendono dallo stato di una istanza.

---

## Getter e setter

Getter e setter espongono accesso controllato a proprieta calcolate o validate.

```js
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  get area() {
    return this.width * this.height;
  }

  set size(value) {
    if (value <= 0) {
      throw new Error("Dimensione non valida");
    }

    this.width = value;
    this.height = value;
  }
}
```

---

## `this` nelle classi

I metodi di classe seguono le normali regole di `this`.

```js
const counter = new Counter();
const increment = counter.increment;

increment(); // this perso
```

Se passi un metodo come callback, puo essere necessario usare `bind`, una wrapper function o campi con arrow function.

---

## Classi e prototipi

```js
class User {
  greet() {
    return "ciao";
  }
}

const user = new User();

console.log(Object.getPrototypeOf(user) === User.prototype); // true
```

`class` non sostituisce i prototipi: li rende piu leggibili.

---

## Errori comuni

- Pensare che le classi JavaScript funzionino come classi Java o C#.
- Dimenticare `new`.
- Perdere `this` passando un metodo come callback.
- Mettere troppa logica nel `constructor`.
- Usare classi per semplici oggetti dati dove basta un object literal.

---

## Checklist operativa

- Usa classi quando hai stato e comportamento legati.
- Usa metodi statici per utility legate al tipo.
- Usa private fields per invarianti interne reali.
- Controlla sempre il comportamento di `this`.
- Preferisci composizione quando l'ereditarieta rende la gerarchia fragile.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
