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
  - prototypes
  - prototype-chain
  - oop
aliases:
  - Prototype JS
  - Prototipi JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Ereditarietà]]"
  - "[[Programmazione/JavaScript/Pagine/Property Descriptors]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
title: Prototypes
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
Il prototipo interno di un oggetto, indicato con `[[Prototype]]`, e un altro oggetto oppure `null`, che termina la catena. Non e una normale proprieta chiamata `prototype`.

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

Questa catena permette la condivisione di metodi. Se una proprieta non viene trovata, la lettura restituisce `undefined`; non viene copiata dal prototipo sull'istanza.

```js
const dictionary = Object.create(null);
dictionary.language = "JavaScript";
console.log(Object.getPrototypeOf(dictionary)); // null
console.log(dictionary.toString); // undefined
console.log(Object.hasOwn(dictionary, "language")); // true
```

Un oggetto con prototipo `null` non eredita nemmeno `hasOwnProperty`: per questo `Object.hasOwn` e piu robusto di `obj.hasOwnProperty(...)`.

---
### `prototype` delle funzioni
Una normale function declaration usata come costruttore ha una proprieta `prototype`, inizialmente un oggetto. `new` la usa per collegare le istanze:

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
### `prototype` vs `[[Prototype]]`
Sono concetti diversi:

- `User.prototype` e una proprieta della funzione costruttrice;
- `Object.getPrototypeOf(user)` restituisce il prototipo effettivo dell'oggetto;
- `user.__proto__` e un accesso storico al prototipo interno, da evitare.

```js
function User() {}

const user = new User();

console.log(User.prototype === Object.getPrototypeOf(user)); // true
console.log(Object.getPrototypeOf(User) === Function.prototype); // true
```

La funzione `User` e essa stessa un oggetto: il suo prototipo interno non e `User.prototype`. Quest'ultimo serve alle istanze.

La presenza della proprieta `prototype` non e un test universale per sapere se una funzione accetta `new`: le generator function la possiedono ma non sono costruibili; una funzione bound puo essere costruibile senza avere una propria `prototype`. Le arrow non sono costruttori. Vedi [MDN: Function prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype).

---
### `new`
Per un costruttore ordinario come `Product` qui sotto, `new`:

- crea un nuovo oggetto;
- collega il suo prototipo a `Constructor.prototype`, se questa e un oggetto (altrimenti usa il fallback previsto dal linguaggio);
- esegue la funzione con `this` puntato al nuovo oggetto;
- restituisce il nuovo oggetto, salvo ritorno esplicito di un oggetto diverso.

```js
function Product(name) {
  this.name = name;
}

const product = new Product("Mouse");

console.log(product.name); // "Mouse"
```

Un ritorno esplicito di un primitivo dal costruttore ordinario viene ignorato, mentre un oggetto puo sostituire l'istanza. Questo schema non descrive tutti i dettagli di costruttori nativi o classi derivate. Vedi [MDN: new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new).

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

I metodi pubblici di istanza dichiarati con `method() {}` finiscono sul prototipo e sono non enumerabili. I metodi `static` stanno sul costruttore; i campi di istanza, comprese le arrow assegnate ai campi, stanno sulle singole istanze. Non estendere la regola ai metodi privati `#method`.

```js
class Task {
  state = "pending";
  readState = () => this.state;
  complete() { this.state = "done"; }
  static category() { return "task"; }
}

const firstTask = new Task();
const secondTask = new Task();
console.log(firstTask.complete === secondTask.complete); // true
console.log(firstTask.readState === secondTask.readState); // false
console.log(Object.hasOwn(firstTask, "state")); // true
console.log(Task.category()); // "task"
```

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
console.log(Object.hasOwn(user, "role")); // true
delete user.role;
console.log(user.role); // "reader": di nuovo dal prototipo
```

La proprieta `role` dell'oggetto nasconde quella del prototipo. L'assegnazione crea la proprieta propria in questo esempio perche quella ereditata e un dato scrivibile. Un setter ereditato puo invece intercettarla; un dato ereditato non scrivibile impedisce l'assegnazione (in strict mode genera `TypeError`).

Mutare un oggetto ereditato e diverso dall'assegnare una nuova proprieta:

```js
const sharedDefaults = { tags: [] };
const firstItem = Object.create(sharedDefaults);
const secondItem = Object.create(sharedDefaults);
firstItem.tags.push("urgent");
console.log(secondItem.tags); // ["urgent"]: stesso array ereditato
console.log(Object.hasOwn(firstItem, "tags")); // false

firstItem.tags = []; // ora l'array appartiene solo a firstItem
firstItem.tags.push("personal");
console.log(secondItem.tags); // ancora ["urgent"]
```

In una classe inizializza gli array di stato nel costruttore o in un campo di istanza, non sul prototipo condiviso.

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

Questo e utile quando vuoi costruire una catena prototipale senza classi o costruttori. `Object.create` non esegue un costruttore e non installa i campi privati di una classe.

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
Nel comportamento ordinario, `instanceof` controlla se il `prototype` del costruttore compare nella catena dell'oggetto. Il comportamento puo essere personalizzato tramite `Symbol.hasInstance`.

```js
class User {}

const user = new User();

console.log(user instanceof User); // true
```

Non dimostra che il costruttore sia stato eseguito, ne valida i dati dell'oggetto:

```js
class Account {
  constructor() { this.active = true; }
}

const incomplete = Object.create(Account.prototype);
console.log(incomplete instanceof Account); // true
console.log(incomplete.active); // undefined: nessun costruttore eseguito
```

Tra realm diversi, per esempio iframe, esistono costruttori e prototipi distinti: per gli array usa `Array.isArray`, non `instanceof Array`. La proprieta `constructor` e modificabile e non costituisce una prova affidabile del tipo.

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

Sostituire la proprieta `prototype` di una normale funzione costruttrice non cambia retroattivamente gli oggetti gia creati:

```js
function Item() {}
const earlier = new Item();
const oldPrototype = Item.prototype;

Item.prototype = { category: "new" };
const later = new Item();

console.log(Object.getPrototypeOf(earlier) === oldPrototype); // true
console.log(later.category); // "new"
console.log(earlier instanceof Item); // false: confronto col nuovo prototype
```

Modificare una proprieta dell'oggetto prototipo esistente, invece, puo influenzare tutte le istanze che delegano a quel prototipo e non la nascondono.

Con input esterno, non costruire catene o merge ricorsivi da chiavi arbitrarie: una scrittura non controllata puo arrivare a prototipi condivisi (**prototype pollution**). Valida le chiavi ammesse e considera `Map` o oggetti con prototipo `null` per dizionari; questi accorgimenti non rendono automaticamente sicuro un successivo merge in un oggetto normale. Vedi [MDN: prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution).

---

## API / Sintassi

API principali, in forma schematica (i nomi rappresentano valori dell'applicazione):

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

Versione con classe, equivalente per il saluto ma non per tutti i descrittori e le regole di chiamata:

```js
class User {
  constructor(name) {
    this.name = name;
  }
  sayHello() {
    return `Ciao ${this.name}`;
  }
}
```

Il metodo assegnato direttamente a `User.prototype.sayHello` e enumerabile per default; il metodo dichiarato nella classe no. Le classi richiedono `new` e il loro corpo e strict.

## Esempio pratico

Condivisione di metodi tramite prototipo, con stato numerico indipendente. Il contratto accetta solo interi non negativi rappresentabili esattamente:

```js
function Counter(initialValue = 0) {
  if (!new.target) throw new TypeError("Usare new Counter()");
  if (!Number.isSafeInteger(initialValue) || initialValue < 0) {
    throw new RangeError("Valore iniziale: intero sicuro non negativo");
  }
  this.value = initialValue;
}

Counter.prototype.increment = function () {
  if (
    !Number.isSafeInteger(this.value) ||
    this.value < 0 ||
    this.value >= Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError("Contatore non incrementabile esattamente");
  }
  this.value += 1;
  return this.value;
};

const first = new Counter();
const second = new Counter(10);

console.log(first.increment()); // 1
console.log(second.increment()); // 11
console.log(first.increment === second.increment); // true
```

`increment` non viene duplicato su ogni istanza: viene letto da `Counter.prototype`. `value` e pubblico, non privato; il controllo nell'incremento rileva anche valori non ammessi assegnati successivamente. Non prendere questo contatore come un confine di sicurezza contro modifiche intenzionali dell'oggetto.

## Varianti

- **Object literal**: prototipo predefinito `Object.prototype`.
- **Constructor function ordinaria**: la funzione eredita da `Function.prototype`; le istanze da `Constructor.prototype`.
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


## Fonti

- [MDN: ereditarieta e catena dei prototipi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain).
- [MDN: classi, metodi e campi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
- [MDN: Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create).
- [MDN: instanceof e casi limite](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
