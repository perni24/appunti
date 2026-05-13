---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, oop, classes, private-fields, static-blocks, encapsulation]
aliases: [Private Fields JS, Static Blocks JS]
prerequisites: [Classi, Incapsulamento]
related: [Classi, Incapsulamento, Ereditarietà, Prototypes]
---

# Private Fields e Static Blocks

I private fields e gli static blocks fanno parte della sintassi moderna delle classi JavaScript.

Servono a rendere piu esplicita l'organizzazione dello stato interno di una classe, distinguendo tra dati pubblici, dati privati, membri di istanza e membri statici condivisi dalla classe.

---

## 1. Campi pubblici

I campi pubblici possono essere dichiarati direttamente nel corpo della classe.

```js
class User {
  name = "Guest";
  role = "reader";
}

const user = new User();

console.log(user.name); // "Guest"
console.log(user.role); // "reader"
```

Questi campi appartengono all'istanza.

Sono equivalenti, dal punto di vista pratico, a proprieta assegnate nel `constructor()`.

```js
class User {
  constructor() {
    this.name = "Guest";
    this.role = "reader";
  }
}
```

La dichiarazione nel corpo della classe rende pero piu visibile la forma dell'oggetto.

---

## 2. Private fields

I campi privati si dichiarano con `#`.

```js
class BankAccount {
  #balance = 0;

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Importo non valido");
    }

    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();

account.deposit(100);
console.log(account.getBalance()); // 100
```

Un campo privato non e accessibile dall'esterno della classe.

```js
console.log(account.#balance); // SyntaxError
```

Questo non e solo una convenzione: e una regola del linguaggio.

---

## 3. Differenza tra #privato e _convenzione

Prima dei private fields, era comune usare `_` per indicare proprieta interne.

```js
class User {
  constructor() {
    this._token = "abc";
  }
}

const user = new User();

console.log(user._token); // Accessibile
```

`_token` e ancora una proprieta pubblica.

`#token`, invece, e realmente privato.

```js
class User {
  #token = "abc";
}

const user = new User();

console.log(user.#token); // SyntaxError
```

Usare `#` e corretto quando si vuole impedire l'accesso diretto allo stato interno.

---

## 4. Private methods

Anche i metodi possono essere privati.

```js
class PasswordValidator {
  validate(password) {
    return this.#hasMinLength(password) && this.#hasNumber(password);
  }

  #hasMinLength(password) {
    return password.length >= 8;
  }

  #hasNumber(password) {
    return /\d/.test(password);
  }
}

const validator = new PasswordValidator();

console.log(validator.validate("abc12345")); // true
```

I private methods sono utili per nascondere dettagli implementativi che non fanno parte dell'API pubblica della classe.

---

## 5. Private getters e setters

Getter e setter possono essere privati.

```js
class Cart {
  #items = [];

  get #total() {
    return this.#items.reduce((sum, item) => sum + item.price, 0);
  }

  add(item) {
    this.#items.push(item);
  }

  printTotal() {
    console.log(this.#total);
  }
}
```

Questo consente di calcolare o validare valori interni senza esporli direttamente.

---

## 6. Static fields

I membri statici appartengono alla classe, non alle singole istanze.

```js
class Config {
  static appName = "Dashboard";
  static version = "1.0.0";
}

console.log(Config.appName); // "Dashboard"
```

Non si accede a un campo statico tramite istanza.

```js
const config = new Config();

console.log(config.appName); // undefined
```

I campi statici sono utili per:

- costanti della classe;
- factory methods;
- configurazioni condivise;
- cache condivise;
- contatori globali della classe.

---

## 7. Private static fields

Anche i campi statici possono essere privati.

```js
class IdGenerator {
  static #nextId = 1;

  static createId() {
    return this.#nextId++;
  }
}

console.log(IdGenerator.createId()); // 1
console.log(IdGenerator.createId()); // 2
```

`#nextId` e condiviso dalla classe ma non accessibile dall'esterno.

```js
console.log(IdGenerator.#nextId); // SyntaxError
```

---

## 8. Static blocks

Uno static block permette di eseguire logica di inizializzazione quando la classe viene definita.

```js
class FeatureFlags {
  static flags = {};

  static {
    this.flags = {
      darkMode: true,
      betaSearch: false,
    };
  }
}

console.log(FeatureFlags.flags.darkMode); // true
```

Il blocco statico viene eseguito una sola volta, al momento della valutazione della classe.

---

## 9. Uso con campi privati statici

Gli static blocks sono particolarmente utili quando bisogna inizializzare stato statico privato.

```js
class Registry {
  static #items;

  static {
    this.#items = new Map();
    this.#items.set("default", { enabled: true });
  }

  static get(name) {
    return this.#items.get(name);
  }

  static set(name, value) {
    this.#items.set(name, value);
  }
}

console.log(Registry.get("default"));
```

Questo consente inizializzazioni piu complesse rispetto a una semplice assegnazione.

---

## 10. Ordine di inizializzazione

Per una classe, l'ordine generale e:

1. vengono valutati i campi statici e gli static blocks;
2. quando si crea una istanza, vengono inizializzati i campi di istanza;
3. viene eseguito il `constructor()`.

```js
class Example {
  static value = "static field";

  static {
    console.log("static block");
  }

  field = "instance field";

  constructor() {
    console.log("constructor");
  }
}

new Example();

// Output:
// static block
// constructor
```

Il campo di istanza viene creato prima del corpo del `constructor()`, ma non stampa nulla perche non contiene log.

---

## 11. Private fields e ereditarieta

I private fields non sono accessibili dalle sottoclassi.

```js
class Base {
  #secret = "base";

  getSecret() {
    return this.#secret;
  }
}

class Child extends Base {
  readSecret() {
    return this.#secret; // SyntaxError
  }
}
```

Se una sottoclasse deve accedere a un valore interno, la classe base deve esporre un metodo protetto a livello di API pubblica o un getter controllato.

```js
class Base {
  #secret = "base";

  getSecretForSubclass() {
    return this.#secret;
  }
}
```

JavaScript non ha un modificatore `protected` nativo come altri linguaggi OOP.

---

## 12. Controllare se un oggetto ha un campo privato

Dentro la classe si puo usare la sintassi `#field in object`.

```js
class User {
  #id;

  constructor(id) {
    this.#id = id;
  }

  static isUser(value) {
    return #id in value;
  }
}

const user = new User(1);

console.log(User.isUser(user)); // true
console.log(User.isUser({}));   // false
```

Questo controllo puo essere utile per validare istanze senza esporre direttamente i campi privati.

---

## 13. Quando usarli

Private fields e static blocks sono utili quando:

- vuoi proteggere invarianti interne;
- vuoi evitare accessi accidentali allo stato;
- vuoi rendere chiara l'API pubblica della classe;
- vuoi inizializzare cache o registry statici;
- vuoi raggruppare logica OOP in modo esplicito.

Non sono sempre necessari.

Per semplici oggetti dati, una struttura pubblica puo essere piu leggibile.

---

## 14. Best practice

- Usa `#` per stato che non deve essere modificato dall'esterno.
- Esponi metodi pubblici chiari per leggere o modificare lo stato.
- Non rendere privato tutto per principio.
- Usa static fields per dati condivisi dalla classe.
- Usa static blocks per inizializzazioni statiche non banali.
- Evita logica pesante negli static blocks.
- Ricorda che i private fields non sono accessibili dalle sottoclassi.
- Preferisci nomi espliciti per separare API pubblica e dettagli interni.

---

## 15. Errori comuni

- Confondere `_field` con un vero campo privato.
- Tentare di accedere a `#field` fuori dalla classe.
- Aspettarsi che una sottoclasse possa leggere i private fields della classe base.
- Riusare lo stesso nome privato pensando che sia condiviso tra classi diverse.
- Usare static fields quando serve stato per ogni istanza.
- Mettere logica asincrona complessa dentro uno static block.

---

## 16. Mappa mentale

```text
Private Fields e Static Blocks
|
|-- campi di istanza
|   |-- pubblici
|   |-- privati con #
|
|-- metodi privati
|   |-- helper interni
|   |-- non fanno parte dell'API pubblica
|
|-- membri statici
|   |-- appartengono alla classe
|   |-- condivisi tra istanze
|
|-- static blocks
|   |-- inizializzazione una tantum
|   |-- accesso a campi privati statici
|
|-- limiti
|   |-- niente protected nativo
|   |-- accesso privato solo dentro la classe
```

---

## 17. Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/JavaScript/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
