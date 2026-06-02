---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, prototypes, prototype-chain, oop]
aliases: [Prototype JS, Prototipi JavaScript]
prerequisites: [Oggetti Avanzati, Funzioni]
related: [Classi, Ereditarietà, Property Descriptors, Oggetti Avanzati]
---

# Prototypes

## Sintesi

JavaScript usa l'ereditarieta prototipale: gli oggetti possono delegare la ricerca di proprieta e metodi a un altro oggetto chiamato prototipo.

La catena dei prototipi e il meccanismo alla base di oggetti, costruttori e classi.

---

## Quando usarlo

Studia i prototipi quando vuoi capire come JavaScript condivide metodi, come funzionano classi e `instanceof`, o perche una proprieta viene trovata anche se non e sull'oggetto.

Serve soprattutto per:

- leggere codice basato su costruttori;
- capire classi ES6;
- distinguere proprieta proprie ed ereditarie;
- evitare bug in iterazione oggetti;
- comprendere performance e shape degli oggetti;
- usare `Object.create` in modo consapevole.

Nel codice moderno, usa `class` o composizione quando rendono il modello piu leggibile.

## Come funziona

### Prototipo interno
Ogni oggetto ha un riferimento interno chiamato `\[\[Prototype\]\]`.

Nel codice moderno si legge con `Object.getPrototypeOf`.

```js
const user = {
  name: "Luca",
};

console.log(Object.getPrototypeOf(user) === Object.prototype); // true
```

`__proto__` esiste in molti ambienti, ma e meglio evitarlo nel codice nuovo.

---
### Prototype chain
Quando accedi a una proprieta, JavaScript cerca:

- prima nell'oggetto stesso;
- poi nel suo prototipo;
- poi nel prototipo del prototipo;
- fino a `null`.

```js
const user = {
  name: "Luca",
};

console.log(user.toString); // trovato su Object.prototype
```

Questa catena permette la condivisione di metodi.

---
### `prototype` delle funzioni
Le funzioni usabili come costruttori hanno una proprieta `prototype`.

```js
function User(name) {
  this.name = name;
}

User.prototype.sayHello = function () {
  return `Ciao, sono ${this.name}`;
};

const user = new User("Luca");

console.log(user.sayHello()); // "Ciao, sono Luca"
```

Gli oggetti creati con `new User()` ricevono come prototipo `User.prototype`.

```js
console.log(Object.getPrototypeOf(user) === User.prototype); // true
```

---
### `prototype` vs `\[\[Prototype\]\]`
Sono concetti diversi:

- `User.prototype` e una proprieta della funzione costruttrice;
- `Object.getPrototypeOf(user)` restituisce il prototipo effettivo dell'oggetto;
- `user.__proto__` e un accesso storico al prototipo interno, da evitare.

```js
function User() {}

const user = new User();

console.log(User.prototype === Object.getPrototypeOf(user)); // true
```

---
### `new`
Quando chiami una funzione con `new`, JavaScript:

- crea un nuovo oggetto;
- collega il suo prototipo a `Constructor.prototype`;
- esegue la funzione con `this` puntato al nuovo oggetto;
- restituisce il nuovo oggetto, salvo ritorno esplicito di un oggetto diverso.

```js
function Product(name) {
  this.name = name;
}

const product = new Product("Mouse");

console.log(product.name); // "Mouse"
```

---
### Classi e prototipi
Le classi ES6 sono sintassi piu moderna sopra il modello prototipale.

```js
class User {
  constructor(name) {
    this.name = name;
  }

  sayHello() {
    return `Ciao, sono ${this.name}`;
  }
}

const user = new User("Luca");

console.log(Object.getPrototypeOf(user) === User.prototype); // true
```

I metodi dichiarati nella classe finiscono sul prototipo, non vengono duplicati su ogni istanza.

---
### Shadowing di proprieta
Una proprieta dell'oggetto ha precedenza su una proprieta del prototipo.

```js
const defaults = {
  role: "reader",
};

const user = Object.create(defaults);

console.log(user.role); // "reader"

user.role = "admin";

console.log(user.role); // "admin"
console.log(defaults.role); // "reader"
```

La proprieta `role` dell'oggetto nasconde quella del prototipo.

---
### `Object.create`
`Object.create` crea un oggetto scegliendo direttamente il suo prototipo.

```js
const sharedMethods = {
  activate() {
    this.active = true;
  },
};

const user = Object.create(sharedMethods);

user.name = "Luca";
user.activate();

console.log(user.active); // true
```

Questo e utile quando vuoi costruire una catena prototipale senza classi o costruttori.

---
### `hasOwn` e proprieta ereditate
Per distinguere proprieta proprie da proprieta ereditate, usa `Object.hasOwn`.

```js
const base = {
  inherited: true,
};

const obj = Object.create(base);
obj.own = true;

console.log(Object.hasOwn(obj, "own")); // true
console.log(Object.hasOwn(obj, "inherited")); // false
```

Questo evita bug quando si iterano oggetti.

---
### `instanceof`
`instanceof` controlla se il `prototype` di una funzione compare nella prototype chain di un oggetto.

```js
class User {}

const user = new User();

console.log(user instanceof User); // true
```

Non controlla il tipo nominale in senso stretto: controlla la catena dei prototipi.

---
### Mutare prototipi
Cambiare prototipi a runtime puo rendere il codice lento e difficile da prevedere.

```js
const user = {};

Object.setPrototypeOf(user, {
  role: "admin",
});
```

Evita anche di modificare prototipi nativi come `Array.prototype` o `Object.prototype`, perche puoi rompere codice di terze parti.

---

## API / Sintassi

API principali:

```js
Object.getPrototypeOf(object);
Object.setPrototypeOf(object, prototype);
Object.create(prototype);
Object.hasOwn(object, property);
object instanceof Constructor;
```

Costruttore e prototype:

```js
function User(name) {
  this.name = name;
}

User.prototype.sayHello = function () {
  return `Ciao ${this.name}`;
};
```

Classe equivalente:

```js
class User {
  sayHello() {}
}
```

## Esempio pratico

Condivisione di metodi tramite prototipo:

```js
function Counter(initialValue = 0) {
  this.value = initialValue;
}

Counter.prototype.increment = function () {
  this.value += 1;
  return this.value;
};

const first = new Counter();
const second = new Counter(10);

first.increment();
second.increment();
```

`increment` non viene duplicato su ogni istanza: viene letto da `Counter.prototype`.

## Varianti

- **Object literal**: prototipo predefinito `Object.prototype`.
- **Constructor function**: usa `Function.prototype`.
- **Class syntax**: sintassi moderna sopra i prototipi.
- **Object.create**: prototipo scelto manualmente.
- **Prototype null**: oggetti senza `Object.prototype`.
- **Prototype chain**: ricerca lungo piu livelli.

## Errori comuni

- Confondere `prototype` della funzione con il prototipo interno dell'oggetto.
- Usare `__proto__` nel codice moderno.
- Modificare prototipi nativi.
- Aspettarsi che `instanceof` funzioni bene tra iframe, realm diversi o copie multiple di una libreria.
- Dimenticare che le proprieta proprie nascondono quelle ereditate.

---

## Checklist

### Checklist operativa
- Usa `class` quando vuoi un modello OOP leggibile.
- Usa `Object.getPrototypeOf` per ispezionare il prototipo.
- Usa `Object.hasOwn` per distinguere proprieta proprie da ereditarie.
- Evita `Object.setPrototypeOf` su oggetti gia creati.
- Non modificare prototipi nativi.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
