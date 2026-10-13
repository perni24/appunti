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
  - oop
  - classes
  - prototypes
aliases:
  - Classi JS
  - JavaScript Classes
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
  - "[[Programmazione/JavaScript/Pagine/Context]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Ereditarietà]]"
  - "[[Programmazione/JavaScript/Pagine/Incapsulamento]]"
  - "[[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
title: Classi
---

# Classi

## Sintesi

Le classi JavaScript sono una sintassi moderna per creare oggetti, istanze, metodi e gerarchie.

Sotto il cofano, restano basate sul modello prototipale di JavaScript.

---

## Quando usarlo

Usa classi quando dati e comportamento appartengono naturalmente allo stesso concetto e devono mantenere stato nel tempo.

Casi comuni:

- modelli con invarianti;
- servizi con configurazione;
- componenti non banali;
- errori custom;
- oggetti con metodi condivisi;
- API dove `new` e istanze rendono il codice piu chiaro.

Per semplici record di dati, un object literal e spesso sufficiente.

## Come funziona

Gli esempi sono indipendenti, salvo le continuazioni indicate: non concatenare classi omonime nello stesso scope.

### Creazione e regole di base

Una classe viene valutata prima di poter essere istanziata. Una class declaration resta in TDZ fino alla sua inizializzazione; chiamarla senza `new` genera `TypeError`. Il corpo della classe e sempre strict, anche dentro uno script non-strict.

```js
class Task {
  constructor(title) {
    this.title = title;
  }
}

const task = new Task("Leggere gli appunti");
console.log(task.title); // "Leggere gli appunti"
// Task("altro"); // TypeError: manca new
```

La sintassi non e solo una riscrittura testuale delle vecchie constructor function: cambiano anche inizializzazione, strict mode e descrittori dei metodi.

### Metodi di istanza
I metodi pubblici di istanza dichiarati con `method() {}` finiscono sul prototipo e sono non enumerabili. Metodi statici, privati e arrow nei campi seguono regole diverse.

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
### Campi pubblici
I campi pubblici definiscono proprieta di istanza.

```js
class User {
  role = "reader";

  constructor(name) {
    this.name = name;
  }
}
```

Sono utili per rendere visibile la forma dell'oggetto. Ogni istanza riceve i propri campi: un inizializzatore `items = []` crea un array nuovo a ogni istanziazione. I campi pubblici sono normalmente scrivibili, enumerabili e configurabili; non proteggono da modifiche esterne.

Un campo `name = value` definisce una proprieta propria e non invoca un setter ereditato come puo fare `this.name = value`. Vedi [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Campi e ordine di inizializzazione]] per il confronto completo.

---
### Metodi statici
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

Qui `sum` illustra la collocazione del metodo, non valida input numerici: `+` concatena se riceve stringhe. `new MathUtils().sum` e `undefined`.

---
### Getter e setter
Getter e setter espongono accesso controllato a proprieta calcolate o validate. Questo rettangolo accetta dimensioni numeriche finite e positive; usa campi privati per evitare che il chiamante salti la validazione.

```js
class Rectangle {
  #width;
  #height;

  constructor(width, height) {
    Rectangle.#validateDimension(width);
    Rectangle.#validateDimension(height);
    this.#width = width;
    this.#height = height;
  }

  static #validateDimension(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new RangeError("Dimensione numerica finita e positiva richiesta");
    }
  }

  get width() {
    return this.#width;
  }

  get height() {
    return this.#height;
  }

  get area() {
    const result = this.#width * this.#height;
    if (!Number.isFinite(result)) throw new RangeError("Area fuori intervallo");
    return result;
  }

  set size(value) {
    Rectangle.#validateDimension(value);
    this.#width = value;
    this.#height = value;
  }
}

const rectangle = new Rectangle(3, 4);
console.log(rectangle.area); // 12, non rectangle.area()
rectangle.size = 5;
console.log(rectangle.area); // 25
```

Il setter `size` trasforma intenzionalmente il rettangolo in un quadrato. La verifica precede entrambe le assegnazioni: un input invalido lascia lo stato precedente intatto. Un getter non e una cache automatica: il calcolo avviene a ogni lettura. Restano i limiti di precisione floating point di `Number`.

---
### `this` nelle classi
I metodi pubblici ordinari non sono automaticamente bound. Riprendendo `Counter` della sezione sui metodi:

```js
const counter = new Counter();
const increment = counter.increment;

// increment(); // TypeError: this e undefined nel metodo strict
const boundIncrement = counter.increment.bind(counter);
boundIncrement();
console.log(counter.count); // 1
```

Se passi un metodo come callback, usa un receiver appropriato, `bind`, una wrapper o un campo arrow. Un campo `increment = () => ...` mantiene il `this` dell'istanza ma crea una funzione distinta per ogni istanza, non un metodo condiviso sul prototipo. Conserva l'identita della callback per poter rimuovere un listener.

---
### Classi e prototipi
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

## API / Sintassi

### Sintassi base
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

Il costruttore non puo essere `async`. Per caricare dati prima di creare un'istanza usa una funzione o factory statica `async` esplicita; avviare una Promise nel costruttore non fa attendere automaticamente `new`.

---

## Esempio pratico

Classe per lo stato locale di una sessione. `login` riceve un token gia ottenuto dal sistema di autenticazione; non verifica credenziali, firma o scadenza.

```js
class UserSession {
  #token = null;

  login(token) {
    if (
      typeof token !== "string" ||
      /\s/.test(token) ||
      !/^[A-Za-z0-9._~+\/-]+=*$/.test(token)
    ) {
      throw new TypeError("Token Bearer con formato non valido");
    }
    this.#token = token;
  }

  logout() {
    this.#token = null;
  }

  get hasToken() {
    return this.#token !== null;
  }

  getAuthHeader() {
    if (this.#token === null) {
      throw new Error("Token assente");
    }

    return `Bearer ${this.#token}`;
  }
}

const session = new UserSession();
console.log(session.hasToken); // false
session.login("example-token"); // segnaposto, non una credenziale reale
console.log(session.hasToken); // true
session.logout();
```

`hasToken` segnala la presenza locale del token: chiamarlo `isAuthenticated` suggerirebbe una garanzia che qui non esiste. `getAuthHeader()` genera un errore se il token manca; in quel caso non inviare Authorization. Il controllo del formato Bearer segue la [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1), non e validazione di autenticita.

La classe controlla le modifiche al campo privato, ma il metodo espone deliberatamente il token sotto forma di header. Non protegge segreti da codice ostile gia nella pagina e non giustifica scrivere credenziali nei log.

## Varianti

- **Classe semplice**: stato e metodi di istanza.
- **Classe con private fields**: stato interno protetto.
- **Classe con metodi statici**: utility o factory legate al tipo.
- **Classe derivata**: usa `extends`.
- **Error class**: specializza `Error`.
- **Object literal**: alternativa piu semplice quando non serve istanziazione.

## Errori comuni

- Pensare che le classi JavaScript funzionino come classi Java o C#.
- Dimenticare `new`.
- Perdere `this` passando un metodo come callback.
- Mettere troppa logica nel `constructor`.
- Usare classi per semplici oggetti dati dove basta un object literal.

---

## Checklist

### Checklist operativa
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


## Fonti

- [MDN: classi e regole del corpo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
- [MDN: campi pubblici](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields).
- [MDN: elementi privati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
