---
date: 2026-05-04
area: Programmazione
topic: JavaScript
tags: [javascript, objects, property-descriptors, defineproperty, getters, setters]
type: technical-note
status: "non revisionato"
difficulty: advanced
aliases: [Descriptor proprieta, Object.defineProperty]
prerequisites: [Oggetti Avanzati]
related: [Oggetti Avanzati, Immutabilita e Copia degli Oggetti]
---

# Property Descriptors

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

## 1. Data Properties

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

Collegamento: [[Oggetti Avanzati]]

## 2. Object.getOwnPropertyDescriptor

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

Collegamento: [[Prototypes]]

## 3. Object.defineProperty

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

## 4. Default Diversi

Attenzione: le proprieta create con object literal e quelle create con `Object.defineProperty` hanno default diversi.

### Object literal

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

### Object.defineProperty

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

## 5. writable

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

Senza strict mode, l'assegnazione puo fallire silenziosamente.

Collegamento: [[Strict Mode]]

## 6. enumerable

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

Influenza:

- `Object.keys`;
- `Object.values`;
- `Object.entries`;
- `for...in`;
- spread su oggetti;
- `JSON.stringify` per proprieta own enumerable.

Esempio:

```javascript
console.log({ ...user }); // { name: "Luca" }
```

## 7. configurable

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

Questa opzione va usata con attenzione perche rende l'oggetto meno flessibile.

## 8. Accessor Properties

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

## 9. Getter e Setter

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
    if (value < 0) {
      throw new Error("Il saldo non puo essere negativo");
    }

    this._balance = value;
  },
  enumerable: true,
});

account.balance = 100;
console.log(account.balance); // 100
```

Getter e setter sono utili per:

- validazione;
- valori calcolati;
- compatibilita con API esistenti;
- incapsulamento controllato.

Collegamento: [[Incapsulamento]]

## 10. Sintassi Object Literal

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

## 11. Data vs Accessor Descriptor

Un descriptor non puo essere contemporaneamente data descriptor e accessor descriptor.

Errato:

```javascript
Object.defineProperty(obj, "x", {
  value: 1,
  get() {
    return 2;
  },
});
```

Questo genera un errore perche `value` e `get` appartengono a due tipi diversi di descriptor.

Confronto:

| Tipo | Campi |
|---|---|
| Data descriptor | `value`, `writable`, `enumerable`, `configurable` |
| Accessor descriptor | `get`, `set`, `enumerable`, `configurable` |

## 12. Object.defineProperties

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

## 13. Descriptor e Classi

I metodi definiti nelle classi sono non-enumerable.

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

Collegamento: [[Classi]]

## 14. Descriptor e Prototype

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

Collegamento: [[Prototypes]]

## 15. Object.getOwnPropertyDescriptors

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

Un semplice spread non preserva i descriptor.

```javascript
const copy = { ...user };
```

Lo spread copia solo valori enumerable, non la semantica completa delle proprieta.

## 16. Descriptor e JSON

`JSON.stringify` considera solo proprieta own enumerable.

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

Collegamento: [[JSON]]

## 17. Descriptor e Immutability

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

`Object.freeze` rende le proprieta non-writable e non-configurable.

Collegamento: [[Immutabilita e Copia degli Oggetti]]

## 18. Quando Usarli

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

## 19. Errori Comuni

### Dimenticare i default di defineProperty

Se non specifichi `writable`, `enumerable` e `configurable`, valgono `false`.

### Confondere non-enumerable con privato

Una proprieta non-enumerable non e privata. E solo esclusa dalle enumerazioni comuni.

### Usare descriptor per tutto

Troppo controllo manuale rende il codice difficile da leggere.

### Mescolare data e accessor descriptor

Non puoi usare `value` insieme a `get` o `set`.

### Dimenticare strict mode

Molte violazioni falliscono silenziosamente senza strict mode.

## 20. Best Practices

1. Usa object literal per oggetti semplici.
2. Usa `Object.defineProperty` solo quando serve controllo sui flag.
3. Specifica sempre `writable`, `enumerable` e `configurable` in modo esplicito.
4. Non usare non-enumerable come meccanismo di sicurezza.
5. Preferisci getter/setter leggibili quando il comportamento e parte dell'API.
6. Usa `Object.getOwnPropertyDescriptor` per debug e introspezione.
7. Evita di bloccare configurabilita se non hai un motivo chiaro.

## 21. Mappa Mentale

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

## Collegamenti

- [[Oggetti Avanzati]]
- [[Prototypes]]
- [[Classi]]
- [[Incapsulamento]]
- [[Strict Mode]]
- [[JSON]]
- [[Proxy e Reflect]]
