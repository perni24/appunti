---
date: 2026-06-02
area: Programmazione
topic: JavaScript
tags:
  - javascript
  - objects
  - property-descriptors
  - defineproperty
  - getters
  - setters
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
aliases:
  - Descriptor proprieta
  - Object.defineProperty
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
title: Property Descriptors
---

# Property Descriptors

## Sintesi


I **Property Descriptors** descrivono il comportamento interno di una proprieta di un oggetto JavaScript.

Quando scrivi:

```javascript
const user = {
  name: "Luca",
};
```

JavaScript non memorizza solo il valore `"Luca"`, ma anche metadati che stabiliscono se la proprieta puo essere modificata, enumerata o riconfigurata.

> [!INFO]
> Un descriptor e l'oggetto che descrive una proprieta: valore, scrivibilita, enumerabilita, configurabilita oppure funzioni getter/setter.

## Quando usarlo

Usa property descriptors quando devi controllare in modo fine il comportamento di una proprieta, non solo assegnarle un valore.

Casi adatti:

- proprieta non enumerabili;
- getter e setter;
- valori non scrivibili;
- API pubbliche controllate;
- metaprogrammazione;
- clonazione che preserva descriptor;
- librerie che espongono oggetti con semantica precisa.

Per oggetti applicativi semplici, object literal e classi sono normalmente piu leggibili.

## Come funziona

Gli esempi sono indipendenti, salvo le continuazioni indicate. I blocchi etichettati come output descrivono risultati, non istruzioni da concatenare; i frammenti con errori intenzionali vanno eseguiti separatamente.

### Data Properties
La forma piu comune di proprieta e una **data property**.

```javascript
const user = {
  name: "Luca",
};
```

Il descriptor di `name` contiene:

- `value`: valore della proprieta;
- `writable`: se il valore puo essere cambiato;
- `enumerable`: se appare in enumerazioni come `Object.keys`;
- `configurable`: se il descriptor puo essere modificato o la proprieta eliminata.

Per leggerlo:

```javascript
const descriptor = Object.getOwnPropertyDescriptor(user, "name");

console.log(descriptor);
```

Output concettuale:

```javascript
{
  value: "Luca",
  writable: true,
  enumerable: true,
  configurable: true
}
```

Collegamento: [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
### Object.getOwnPropertyDescriptor
`Object.getOwnPropertyDescriptor` restituisce il descriptor di una proprieta propria dell'oggetto.

```javascript
const user = {
  name: "Luca",
};

const descriptor = Object.getOwnPropertyDescriptor(user, "name");

console.log(descriptor.value); // "Luca"
console.log(descriptor.writable); // true
```

Nota: controlla solo proprieta **own**, non quelle ereditate dal prototype chain.

```javascript
const descriptor = Object.getOwnPropertyDescriptor(user, "toString");

console.log(descriptor); // undefined
```

`toString` esiste sul prototype, ma non come proprieta diretta di `user`.

Il descriptor restituito e un nuovo oggetto, non una vista modificabile della proprieta:

```javascript
const task = { state: "pending" };
const stateDescriptor = Object.getOwnPropertyDescriptor(task, "state");
stateDescriptor.value = "done";
console.log(task.state); // "pending"
Object.defineProperty(task, "state", stateDescriptor);
console.log(task.state); // "done"
```

Se `value` contiene un oggetto, quel valore resta un riferimento condiviso: la copia del descriptor non e una copia profonda dei dati.

Collegamento: [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
### Object.defineProperty
`Object.defineProperty` permette di creare o modificare una proprieta controllandone il descriptor.

```javascript
const user = {};

Object.defineProperty(user, "id", {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false,
});

console.log(user.id); // 1
```

Qui `id`:

- ha valore `1`;
- non puo essere modificata;
- compare nelle enumerazioni;
- non puo essere riconfigurata o eliminata.
### Default Diversi
Attenzione: le proprieta **nuove** create con object literal e quelle create con `Object.defineProperty` hanno default diversi. Nel secondo caso la tabella sotto assume un descriptor ordinario senza attributi ereditati.

#### Object literal

```javascript
const user = {
  name: "Luca",
};
```

Default:

```javascript
{
  writable: true,
  enumerable: true,
  configurable: true
}
```

#### Nuova proprieta con defineProperty

```javascript
Object.defineProperty(user, "id", {
  value: 1,
});
```

Default:

```javascript
{
  writable: false,
  enumerable: false,
  configurable: false
}
```

Questo e uno degli errori piu comuni.

Per una proprieta **gia esistente**, gli attributi omessi vengono conservati, salvo la conversione tra data e accessor descriptor:

```javascript
const options = { retries: 1 };
Object.defineProperty(options, "retries", { value: 3 });
const flags = Object.getOwnPropertyDescriptor(options, "retries");
console.log(flags.writable, flags.enumerable, flags.configurable); // true true true
```

Omettere `set` non equivale a scrivere `set: undefined`: su un accessor configurabile il secondo caso rimuove il setter. Gli attributi del descriptor possono anche essere ereditati dal suo prototipo; per descriptor costruiti dinamicamente considera un oggetto con prototipo `null` e attributi espliciti.
### writable
`writable` controlla se il valore puo essere cambiato.

```javascript
"use strict";

const settings = {};

Object.defineProperty(settings, "apiUrl", {
  value: "https://api.example.com",
  writable: false,
  enumerable: true,
  configurable: true,
});

settings.apiUrl = "https://evil.example.com"; // TypeError in strict mode
```

Per questa data property senza setter, in non-strict mode l'assegnazione non cambia il valore e fallisce silenziosamente. `Object.defineProperty`, invece, genera `TypeError` se tenta una modifica vietata, indipendentemente dalla strict mode.

`writable: false` blocca l'assegnazione normale del valore, ma con `configurable: true` e ancora possibile riconfigurare la proprieta. Non e una garanzia di immutabilita definitiva.

Collegamento: [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
### enumerable
`enumerable` controlla se la proprieta appare nelle enumerazioni.

```javascript
const user = {};

Object.defineProperty(user, "id", {
  value: 1,
  enumerable: false,
});

user.name = "Luca";

console.log(Object.keys(user)); // ["name"]
```

`id` esiste, ma non compare in `Object.keys`.

Le API non visitano tutte le stesse proprieta:

| Operazione | Proprieta considerate |
| --- | --- |
| `Object.keys/values/entries` | Proprie, enumerabili, con chiave stringa. |
| `for...in` | Enumerabili con chiave stringa, anche ereditate. |
| Spread e `Object.assign` | Proprie enumerabili, anche simboli; leggono il valore e quindi possono invocare getter. |
| `Reflect.ownKeys` | Tutte le proprie, anche non enumerabili e simboli. |
| JSON di un normale oggetto, senza personalizzazioni | Proprie enumerabili con chiave stringa; restano le regole di serializzazione dei valori. |

Esempio:

```javascript
console.log({ ...user }); // { name: "Luca" }
```
### configurable
`configurable` controlla se la proprieta puo essere riconfigurata o eliminata.

```javascript
"use strict";

const user = {};

Object.defineProperty(user, "id", {
  value: 1,
  configurable: false,
});

delete user.id; // TypeError in strict mode
```

Se `configurable` e `false`:

- non puoi eliminare la proprieta;
- non puoi cambiare molti aspetti del descriptor;
- non puoi trasformare una data property in accessor property;
- puoi cambiare `writable` da `true` a `false`, ma non viceversa.

`configurable: false` da solo **non** significa valore immutabile: una data property ancora `writable: true` puo cambiare valore. Puoi successivamente bloccare anche la scrittura, ma non riabilitarla.

```javascript
const lockable = {};
Object.defineProperty(lockable, "value", {
  value: 1,
  writable: true,
  configurable: false,
});
lockable.value = 2;
Object.defineProperty(lockable, "value", { writable: false });
console.log(lockable.value); // 2
// Object.defineProperty(lockable, "value", { writable: true }); // TypeError
```

Un tentativo che ripropone lo stesso valore o gli stessi attributi puo essere ammesso; non ogni chiamata a `defineProperty` su una proprieta bloccata fallisce. Per accessor non configurabili non puoi sostituire getter/setter con funzioni diverse. Queste scelte vanno fatte con attenzione perche restringono le modifiche future.
### Accessor Properties
Una **accessor property** non ha `value` e `writable`. Usa invece:

- `get`;
- `set`;
- `enumerable`;
- `configurable`.

Esempio:

```javascript
const user = {
  firstName: "Luca",
  lastName: "Bellini",
};

Object.defineProperty(user, "fullName", {
  get() {
    return `${this.firstName} ${this.lastName}`;
  },
  enumerable: true,
  configurable: true,
});

console.log(user.fullName); // "Luca Bellini"
```

`fullName` sembra una proprieta, ma il valore viene calcolato dal getter.

I getter non sono cache automatiche. Se il setter manca, una normale assegnazione alla proprieta fallisce in strict mode. Non usare `this.fullName = ...` dentro il setter di `fullName`: richiamerebbe ricorsivamente lo stesso setter.
### Getter e Setter
Con un setter puoi controllare l'assegnazione.

```javascript
const account = {
  _balance: 0,
};

Object.defineProperty(account, "balance", {
  get() {
    return this._balance;
  },
  set(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("Saldo: intero sicuro non negativo in centesimi");
    }

    this._balance = value;
  },
  enumerable: true,
});

account.balance = 100;
console.log(account.balance); // 100
```

Qui il saldo e espresso in centesimi interi. `_balance` resta pubblico: il setter valida soltanto le assegnazioni a `balance`, non una scrittura diretta a `account._balance`. Per una vera invariante usa stato privato o una closure, come nella nota sull'incapsulamento.

Getter e setter sono utili per:

- validazione;
- valori calcolati;
- compatibilita con API esistenti;
- incapsulamento controllato.

Collegamento: [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
### Data vs Accessor Descriptor
Un descriptor non puo essere contemporaneamente data descriptor e accessor descriptor.

Errato:

```javascript
const obj = {};
Object.defineProperty(obj, "x", {
  value: 1,
  get() {
    return 2;
  },
});
```

Questo genera `TypeError` perche `value` e `get` appartengono a tipi diversi di descriptor. Anche `writable` e incompatibile con `get`/`set`, perfino se ha valore `false`. Getter e setter devono essere funzioni o `undefined`.

Confronto:

| Tipo | Campi |
|---|---|
| Data descriptor | `value`, `writable`, `enumerable`, `configurable` |
| Accessor descriptor | `get`, `set`, `enumerable`, `configurable` |
### Object.defineProperties
Per definire piu proprieta:

```javascript
const user = {};

Object.defineProperties(user, {
  id: {
    value: 1,
    enumerable: true,
  },
  name: {
    value: "Luca",
    writable: true,
    enumerable: true,
  },
});
```

E utile quando vuoi creare oggetti con descriptor controllati in modo esplicito.

Non e una transazione con rollback: dopo la conversione dei descriptor, le definizioni vengono applicate in sequenza e un fallimento puo lasciare le modifiche precedenti.

```javascript
const target = {};
Object.defineProperty(target, "locked", { value: 1 });
try {
  Object.defineProperties(target, {
    added: { value: true },
    locked: { value: 2 },
  });
} catch (error) {
  console.log(error.name); // "TypeError"
}
console.log(target.added, target.locked); // true 1
```

Se vuoi gestire un rifiuto di definizione ordinario come booleano, `Reflect.defineProperty(target, key, descriptor)` restituisce `false` dove `Object.defineProperty` lancerebbe per un vincolo della proprieta. Input malformati, target non oggetto o eccezioni di Proxy possono comunque produrre errori: non e una API che non lancia mai.
### Descriptor e Classi
I metodi pubblici definiti nelle classi sono non enumerabili. I campi pubblici sono invece normalmente enumerabili; gli elementi privati non hanno ordinary property descriptors.

```javascript
class User {
  greet() {
    return "Ciao";
  }
}

const descriptor = Object.getOwnPropertyDescriptor(
  User.prototype,
  "greet"
);

console.log(descriptor.enumerable); // false
```

Questo evita che i metodi appaiano in enumerazioni comuni.

Collegamento: [[Programmazione/JavaScript/Pagine/Classi|Classi]]
### Descriptor e Prototype
I descriptor lavorano anche sui prototype.

```javascript
function User(name) {
  this.name = name;
}

Object.defineProperty(User.prototype, "kind", {
  value: "user",
  enumerable: false,
});

const user = new User("Luca");

console.log(user.kind); // "user"
console.log(Object.keys(user)); // ["name"]
```

`kind` viene risolta tramite prototype chain, ma non appare tra le proprieta own enumerable.

Collegamento: [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
### Object.getOwnPropertyDescriptors
Per ottenere tutti i descriptor own:

```javascript
const descriptors = Object.getOwnPropertyDescriptors(user);

console.log(descriptors);
```

Questo e utile per clonare oggetti preservando getter, setter e flag.

```javascript
const clone = Object.defineProperties(
  {},
  Object.getOwnPropertyDescriptors(user)
);
```

Questa prima copia su `{}` non conserva il prototipo originale e non ricostruisce elementi privati o slot interni. Un semplice spread non preserva nemmeno i descriptor.

```javascript
const copy = { ...user };
```

Lo spread copia i valori delle proprieta proprie enumerabili, anche simboli; esegue i getter per leggerli e crea normali data properties nel risultato. Per un oggetto ordinario puoi invece conservare prototipo e descriptor:

```javascript
let reads = 0;
const source = Object.create({ kind: "profile" });
source.details = { name: "Ada" };
Object.defineProperty(source, "displayName", {
  get() { reads += 1; return this.details.name; },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(source, "id", { value: 1 });

const preserved = Object.create(
  Object.getPrototypeOf(source),
  Object.getOwnPropertyDescriptors(source),
);
console.log(reads); // 0: i getter delle proprieta non vengono eseguiti
const spreadCopy = { ...source };
console.log(reads); // 1: lo spread legge displayName
console.log(preserved.kind, preserved.id); // "profile" 1
console.log(preserved.details === source.details); // true: copia superficiale
```

Questo non e un clone universale: getter e setter restano le stesse funzioni, con eventuali closure condivise. Non usare il pattern per duplicare `Date`, `Map` o classi con `#field`: prototipo e descriptor non ricreano il loro stato interno.
### Descriptor e JSON
Per normali oggetti, senza `toJSON` o replacer personalizzati, `JSON.stringify` visita le proprieta proprie enumerabili con chiave stringa. I simboli sono esclusi; gli array seguono regole specifiche sugli indici. Un array replacer puo selezionare anche nomi di proprieta non enumerabili: non usare la frase "JSON ignora sempre i campi non enumerabili" come garanzia.

```javascript
const user = {};

Object.defineProperty(user, "password", {
  value: "secret",
  enumerable: false,
});

user.name = "Luca";

console.log(JSON.stringify(user)); // {"name":"Luca"}
```

Questo puo essere utile, ma non e una misura di sicurezza sufficiente: una proprieta non-enumerable puo comunque essere letta se conosci il nome.

Collegamento: [[Programmazione/JavaScript/Pagine/JSON|JSON]]
### Descriptor e Immutability
Property descriptors sono alla base di metodi come:

- `Object.freeze`;
- `Object.seal`;
- `Object.preventExtensions`.

Esempio:

```javascript
const config = Object.freeze({
  apiUrl: "https://api.example.com",
});
```

`Object.freeze` impedisce nuove proprieta, rende non configurabili quelle proprie e rende non scrivibili le **data properties**. Un accessor non possiede `writable`: un suo setter puo continuare a modificare altro stato. Oggetti annidati e campi privati non vengono congelati ricorsivamente.

| Operazione | Nuove proprieta | Rimozione/riconfigurazione delle proprie | Valori di data properties gia scrivibili |
| --- | --- | --- | --- |
| `Object.preventExtensions` | Impedite | Dipende dai descriptor esistenti | Restano scrivibili. |
| `Object.seal` | Impedite | Proprieta proprie non configurabili | Restano scrivibili. |
| `Object.freeze` | Impedite | Proprieta proprie non configurabili | Diventano non scrivibili. |

Esempio di accessor su oggetto congelato:

```javascript
let backingValue = 0;
const state = {
  get count() { return backingValue; },
  set count(value) { backingValue = value; },
};
Object.freeze(state);
state.count = 2;
console.log(state.count); // 2: cambia la closure, non il descriptor
```

Collegamento: [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
### Quando Usarli
Usa property descriptors quando hai bisogno di controllo fine su:

- API pubbliche;
- proprieta non enumerabili;
- getter/setter;
- compatibilita con librerie;
- metaprogrammazione;
- oggetti immutabili;
- prototype;
- framework o librerie che espongono oggetti controllati.

Per codice applicativo normale, object literal e classi sono spesso piu leggibili.

## API / Sintassi

### Sintassi Object Literal
Puoi definire getter e setter anche direttamente nell'object literal.

```javascript
const rectangle = {
  width: 10,
  height: 5,

  get area() {
    return this.width * this.height;
  },
};

console.log(rectangle.area); // 50
```

Questa sintassi e piu leggibile quando non serve controllare manualmente tutti i flag del descriptor.

## Esempio pratico

Proprieta calcolata non enumerabile:

```javascript
const user = {
  firstName: "Luca",
  lastName: "Bellini",
};

Object.defineProperty(user, "fullName", {
  get() {
    return `${this.firstName} ${this.lastName}`;
  },
  enumerable: false,
  configurable: true,
});

console.log(user.fullName);
console.log(Object.keys(user)); // ["firstName", "lastName"]
```

`fullName` e disponibile come proprieta, ma non compare nelle enumerazioni comuni.

## Varianti

### Mappa Mentale
```txt
Property Descriptors
  -> data property: value, writable
  -> accessor property: get, set
  -> enumerable: compare in Object.keys / JSON
  -> configurable: eliminabile o riconfigurabile
  -> defineProperty controlla i flag
  -> class methods sono non-enumerable
  -> base di freeze, seal e metaprogrammazione
```

## Errori comuni


### Dimenticare i default di defineProperty

Per una nuova data property, gli attributi omessi di un normale descriptor valgono `false`. Quando aggiorni una proprieta esistente, quelli omessi normalmente restano invariati.

### Confondere non-enumerable con privato

Una proprieta non-enumerable non e privata. E solo esclusa dalle enumerazioni comuni.

### Usare descriptor per tutto

Troppo controllo manuale rende il codice difficile da leggere.

### Mescolare data e accessor descriptor

Non puoi usare `value` insieme a `get` o `set`.

### Dimenticare strict mode

Molte violazioni falliscono silenziosamente senza strict mode.

## Checklist

### Best Practices
1. Usa object literal per oggetti semplici.
2. Usa `Object.defineProperty` solo quando serve controllo sui flag.
3. Specifica consapevolmente i flag; `writable` appartiene solo ai data descriptor, non agli accessor.
4. Non usare non-enumerable come meccanismo di sicurezza.
5. Preferisci getter/setter leggibili quando il comportamento e parte dell'API.
6. Usa `Object.getOwnPropertyDescriptor` per debug e introspezione.
7. Evita di bloccare configurabilita se non hai un motivo chiaro.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Proxy e Reflect|Proxy e Reflect]]


## Fonti

- [MDN: defineProperty, default e vincoli](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty).
- [ECMAScript: validazione e applicazione dei descriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-validateandapplypropertydescriptor).
- [MDN: getOwnPropertyDescriptors e copie](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors).
- [MDN: Reflect.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/defineProperty).
- [MDN: freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).
- [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
