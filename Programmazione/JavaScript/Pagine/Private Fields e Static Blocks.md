---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - oop
  - classes
  - private-fields
  - static-blocks
  - encapsulation
aliases:
  - Private Fields JS
  - Static Blocks JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Incapsulamento]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Incapsulamento]]"
  - "[[Programmazione/JavaScript/Pagine/Ereditarietà]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
title: Private Fields e Static Blocks
---

# Private Fields e Static Blocks

## Sintesi


I private fields e gli static blocks fanno parte della sintassi moderna delle classi JavaScript.

Servono a rendere piu esplicita l'organizzazione dello stato interno di una classe, distinguendo tra dati pubblici, dati privati, membri di istanza e membri statici condivisi dalla classe.

---

## Quando usarlo

Usa private fields quando una classe deve proteggere stato interno e mantenere invarianti.

Usa static fields o static blocks quando la classe ha configurazione, cache o inizializzazione legata al tipo, non alle singole istanze.

Casi comuni:

- stato interno non modificabile dall'esterno;
- contatori o cache di classe;
- factory e metodi utility;
- validazione di invarianti;
- inizializzazione statica complessa.

## Come funziona

Gli esempi sono indipendenti. Quelli con `SyntaxError` sono esempi negativi da tenere separati: un errore di sintassi impedisce l'esecuzione dell'intero script, non solo della riga indicata.

### Campi pubblici
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

Nel semplice oggetto dell'esempio producono gli stessi valori delle assegnazioni seguenti, ma **non sono semanticamente equivalenti** in generale.

```js
class User {
  constructor() {
    this.name = "Guest";
    this.role = "reader";
  }
}
```

La dichiarazione nel corpo della classe rende pero piu visibile la forma dell'oggetto.

Un campo pubblico definisce una proprieta propria, senza chiamare un setter ereditato; un'assegnazione normale puo chiamarlo:

```js
const writes = [];
class BaseSettings {
  set mode(value) { writes.push(value); }
}
class FieldSettings extends BaseSettings {
  mode = "field";
}
class AssignedSettings extends BaseSettings {
  constructor() {
    super();
    this.mode = "assignment";
  }
}

const fieldSettings = new FieldSettings();
const assignedSettings = new AssignedSettings();
console.log(writes); // ["assignment"]
console.log(Object.hasOwn(fieldSettings, "mode")); // true
console.log(Object.hasOwn(assignedSettings, "mode")); // false
```

Il setter della base qui registra il valore ma non crea una proprieta sull'istanza. Gli inizializzatori dei campi di istanza vengono valutati per ogni istanza, non una sola volta per classe.

---
### Private fields
I campi privati si dichiarano con `#`.

```js
class BankAccount {
  #balance = 0;

  deposit(amountCents) {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new RangeError("Deposito: intero sicuro positivo in centesimi");
    }

    const next = this.#balance + amountCents;
    if (!Number.isSafeInteger(next)) throw new RangeError("Saldo fuori intervallo");
    this.#balance = next;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();

account.deposit(100);
console.log(account.getBalance()); // 100 centesimi
```

Il saldo dimostrativo usa centesimi interi, come in [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]. Il campo non e una normale proprieta stringa: non compare in `Object.keys`, `Reflect.ownKeys` o nei descriptor. `account["#balance"]` non accede a questo campo.

```js
console.log(account.#balance); // SyntaxError
```

Questo non e solo una convenzione: e una regola del linguaggio. Un metodo della classe puo accedere al campo di un'altra istanza della stessa classe, non soltanto di `this`. Un accesso sintatticamente valido su un receiver che non possiede il campo privato produce invece `TypeError` a runtime.

---
### Differenza tra `#privato` e `_convenzione`
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
### Private methods
Anche i metodi possono essere privati.

```js
class PasswordValidator {
  validate(password) {
    if (typeof password !== "string") return false;
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

I private methods nascondono dettagli dell'API e non sono proprieta pubbliche del prototipo. Questa e solo una regola dimostrativa per due helper: lunghezza minima e presenza di cifre **non certificano la sicurezza di una password** e non costituiscono una policy consigliata per un sistema di autenticazione.

---
### Private getters e setters
Getter e setter possono essere privati.

```js
class Cart {
  #items = [];

  get #total() {
    return this.#items.reduce((sum, priceCents) => sum + priceCents, 0);
  }

  add(item) {
    const priceCents = item?.priceCents;
    if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
      throw new RangeError("Prezzo in centesimi non valido");
    }
    if (!Number.isSafeInteger(this.#total + priceCents)) {
      throw new RangeError("Totale fuori intervallo");
    }
    this.#items.push(priceCents);
  }

  printTotal() {
    console.log(this.#total);
  }
}
```

Qui si conserva solo il prezzo primitivo, non l'oggetto del chiamante. Per un carrello con record e copie in uscita vedi [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]].

Esempio distinto di setter privato: il controllo si applica agli accessi a `#current`, non a ogni possibile scrittura diretta di `#value` dentro la classe.

```js
class LimitedCounter {
  #value = 0;
  get #current() { return this.#value; }
  set #current(value) {
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new RangeError("Contatore ammesso: 0-10");
    }
    this.#value = value;
  }
  increment() {
    this.#current += 1;
    return this.#current;
  }
}
```

---
### Static fields
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

- valori predefiniti della classe (non automaticamente costanti);
- factory methods;
- configurazioni condivise;
- cache condivise;
- contatori globali della classe.

Un campo statico pubblico resta normalmente modificabile. Una sottoclasse puo ereditarlo tramite la catena dei costruttori; se contiene un oggetto, l'oggetto e condiviso finche la sottoclasse non definisce un proprio campo. Non e uno stato globale tra processi, worker o copie distinte del modulo.

---
### Private static fields
Anche i campi statici possono essere privati.

```js
class IdGenerator {
  static #lastId = 0;

  static createId() {
    if (IdGenerator.#lastId >= Number.MAX_SAFE_INTEGER) {
      throw new RangeError("Sequenza esaurita");
    }
    return ++IdGenerator.#lastId;
  }
}

console.log(IdGenerator.createId()); // 1
console.log(IdGenerator.createId()); // 2
```

`#lastId` appartiene al costruttore `IdGenerator`, non alle sottoclassi. Il riferimento esplicito al nome della classe rende la sequenza condivisa anche dalle chiamate al metodo ereditato. Non e un generatore di identificativi distribuiti o persistenti.

```js
console.log(IdGenerator.#lastId); // SyntaxError
```

Usare `this.#lastId` avrebbe un comportamento diverso: chiamando il metodo su una sottoclasse, `this` sarebbe la sottoclasse e mancherebbe il campo privato. Anche `super.createId()` conserva quel receiver. Esempio negativo autonomo:

```js
class BaseSequence {
  static #value = 0;
  static next() { return ++this.#value; }
}
class ChildSequence extends BaseSequence {}
ChildSequence.next(); // TypeError: campo privato assente su ChildSequence
```

---
### Static blocks
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

Il blocco viene eseguito una volta **per valutazione della definizione della classe**, non per istanza. Se una factory valuta di nuovo una class expression, crea una classe distinta ed esegue nuovamente i suoi blocchi.

Gli static blocks sono sincroni e hanno scope proprio, anche per `var`. Non possono usare direttamente `await`, `yield`, `return` o `super()`. Possono avviare operazioni asincrone, ma la valutazione della classe non le attende: per un setup asincrono preferisci una factory esplicita. Se il blocco lancia un errore non gestito, la definizione della classe non si completa.

---
### Uso con campi privati statici
Gli static blocks sono particolarmente utili quando bisogna inizializzare stato statico privato.

```js
class Registry {
  static #items;

  static {
    this.#items = new Map();
    this.#items.set("default", Object.freeze({ enabled: true }));
  }

  static get(name) {
    return Registry.#items.get(name);
  }

  static set(name, value) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("Nome non vuoto richiesto");
    }
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("Configurazione richiesta");
    }
    const { enabled } = value;
    if (typeof enabled !== "boolean") throw new TypeError("enabled deve essere booleano");
    Registry.#items.set(name, Object.freeze({ enabled }));
  }
}

console.log(Registry.get("default"));
```

Questo consente inizializzazioni piu complesse rispetto a una semplice assegnazione. Il registry accetta record con il solo dato pubblico `enabled`, copia il valore booleano e restituisce record congelati. Per un nome assente restituisce `undefined`. Il contratto usa record ordinari, non oggetti con getter ostili.

---
### Ordine di inizializzazione
Per i membri mostrati qui, l'ordine da ricordare e:

1. Durante la valutazione della classe, i campi statici e gli static blocks vengono eseguiti nell'ordine testuale; la base e gia stata valutata.
2. Quando si istanzia una classe base, i suoi campi di istanza vengono inizializzati prima del corpo del suo costruttore.
3. In una classe derivata, i campi della derivata vengono inizializzati dopo il completamento del costruttore base, prima che `super()` restituisca al corpo del costruttore derivato.

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

Questo primo esempio riguarda una classe base. Il campo di istanza non stampa nulla perche non contiene log.

Con una derivata, le fasi si distinguono cosi:

```js
const events = [];
class BaseModel {
  base = (events.push("base field"), 1);
  constructor() { events.push("base constructor"); }
}
class DetailModel extends BaseModel {
  detail = (events.push("derived field"), 2);
  constructor() {
    events.push("before super");
    super();
    events.push("after super");
  }
}
new DetailModel();
console.log(events);
// ["before super", "base field", "base constructor", "derived field", "after super"]
```

Durante il costruttore base i campi della derivata non sono pronti. Una chiamata a un metodo sovrascritto puo leggere `undefined` da un campo pubblico o generare `TypeError` su un campo privato non ancora installato. Evita questa dipendenza e separa eventuale inizializzazione successiva alla costruzione.

---
### Private fields e ereditarieta
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

Se una sottoclasse deve usare un valore interno, la classe base puo esporre un metodo pubblico o un getter controllato. "Pubblico" significa accessibile anche agli altri chiamanti, non protetto esclusivamente per le sottoclassi.

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
### Controllare se un oggetto ha un campo privato
Dentro la classe si puo usare la sintassi `#field in object`.

```js
class User {
  #id;

  constructor(id) {
    this.#id = id;
  }

  static isUser(value) {
    return value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      #id in value;
  }
}

const user = new User(1);

console.log(User.isUser(user)); // true
console.log(User.isUser({}));   // false
console.log(User.isUser(null)); // false, non TypeError
console.log(User.isUser(1));    // false
```

Il controllo verifica la presenza del preciso nome privato dichiarato da questa classe, non la validita del suo contenuto. Il controllo del tipo evita `TypeError` per primitivi e `null`. `Object.create(User.prototype)` puo passare `instanceof User`, ma non questo controllo: non installa il campo privato.

---
### Quando usarli
Private fields e static blocks sono utili quando:

- vuoi proteggere invarianti interne;
- vuoi evitare accessi accidentali allo stato;
- vuoi rendere chiara l'API pubblica della classe;
- vuoi inizializzare cache o registry statici;
- vuoi raggruppare logica OOP in modo esplicito.

Non sono sempre necessari.

Per semplici oggetti dati, una struttura pubblica puo essere piu leggibile.

---

## API / Sintassi

Private field:

```js
class Counter {
  #count = 0;
}
```

Private method:

```js
class Service {
  #validate() {}
}
```

Static field:

```js
class Config {
  static defaultTimeout = 5000;
}
```

Static block:

```js
class Registry {
  static items = new Map();

  static {
    this.items.set("default", {});
  }
}
```

## Esempio pratico

Contatore con stato privato:

```js
class Counter {
  #value = 0;

  constructor(initialValue = 0) {
    if (!Number.isSafeInteger(initialValue) || initialValue < 0) {
      throw new RangeError("Valore iniziale non valido");
    }
    this.#value = initialValue;
  }

  increment() {
    if (this.#value >= Number.MAX_SAFE_INTEGER) throw new RangeError("Limite raggiunto");
    this.#value += 1;
    return this.#value;
  }

  get value() {
    return this.#value;
  }
}
```

Il chiamante puo leggere `value`, ma non puo assegnare direttamente `#value`.

La lettura avviene tramite un getter pubblico sul prototipo. L'assenza del setter fa fallire un'assegnazione normale a `counter.value` in strict mode; il campo privato resta modificabile dai metodi autorizzati anche se congeli l'istanza:

```js
const counter = new Counter();
Object.freeze(counter);
console.log(counter.increment()); // 1: freeze non blocca il campo privato
console.log(Reflect.ownKeys(counter)); // []
console.log(JSON.stringify(counter)); // "{}"
```

I descriptor, lo spread e `structuredClone` non copiano gli elementi privati. Una copia costruita con il solo prototipo non e un'istanza completa; un Proxy senza adattamenti usato come receiver dei metodi non possiede il campo privato del target. Se serve serializzazione, esponi una rappresentazione dati esplicita e ricostruisci lo stato tramite una API validata.

## Varianti

### Mappa mentale
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

## Errori comuni


- Confondere `_field` con un vero campo privato.
- Tentare di accedere a `#field` fuori dalla classe.
- Aspettarsi che una sottoclasse possa leggere i private fields della classe base.
- Riusare lo stesso nome privato pensando che sia condiviso tra classi diverse.
- Usare static fields quando serve stato per ogni istanza.
- Mettere logica asincrona complessa dentro uno static block.

---

## Checklist

### Best practice
- Usa `#` per stato che non deve essere modificato dall'esterno.
- Esponi metodi pubblici chiari per leggere o modificare lo stato.
- Non rendere privato tutto per principio.
- Usa static fields per dati condivisi dalla classe.
- Usa static blocks per inizializzazioni statiche non banali.
- Evita logica pesante negli static blocks.
- Ricorda che i private fields non sono accessibili dalle sottoclassi.
- Preferisci nomi espliciti per separare API pubblica e dettagli interni.

---

## Collegamenti


- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/JavaScript/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]


## Fonti

- [MDN: campi pubblici e differenza rispetto ai setter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields).
- [MDN: elementi privati, brand e campi statici](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).
- [MDN: static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks).
- [MDN: freeze e campi privati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
