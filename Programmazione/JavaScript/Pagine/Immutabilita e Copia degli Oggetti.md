---
date: 2026-05-04
area: Programmazione
topic: JavaScript
tags: [javascript, objects, immutability, clone, structuredclone, freeze, seal]
aliases: ["Object.freeze, Object.seal e structuredClone"]
type: technical-note
status: "non revisionato"
difficulty: intermediate
prerequisites: [Oggetti Avanzati]
related: [Property Descriptors, Spread & Rest Operators]
---

# Immutabilita e Copia degli Oggetti

In JavaScript, oggetti e array sono valori **mutabili** e vengono gestiti tramite riferimento. Questo significa che piu variabili possono puntare allo stesso oggetto e vedere le stesse modifiche.

```javascript
const a = { name: "Luca" };
const b = a;

b.name = "Sara";

console.log(a.name); // "Sara"
```

Per scrivere codice prevedibile e ridurre side effect, e importante capire differenza tra copia superficiale, copia profonda e strumenti come `Object.freeze`, `Object.seal` e `structuredClone`.

> [!INFO]
> Immutabilita non significa "non usare mai oggetti mutabili". Significa controllare dove e quando lo stato puo cambiare.

## 1. Mutabilita e Riferimenti

I valori primitivi sono copiati per valore.

```javascript
let x = 1;
let y = x;

y = 2;

console.log(x); // 1
```

Gli oggetti invece sono assegnati per riferimento.

```javascript
const user = { name: "Luca" };
const sameUser = user;

sameUser.name = "Sara";

console.log(user.name); // "Sara"
```

Questo comportamento e fondamentale per capire bug legati a stato condiviso, UI, cache e funzioni con side effect.

## 2. Copia Superficiale

Una **shallow copy** copia solo il primo livello dell'oggetto.

```javascript
const user = {
  name: "Luca",
  address: {
    city: "Roma",
  },
};

const copy = { ...user };

copy.name = "Sara";
copy.address.city = "Milano";

console.log(user.name); // "Luca"
console.log(user.address.city); // "Milano"
```

`name` e stato copiato, ma `address` e ancora lo stesso oggetto annidato.

## 3. Spread Operator

Lo spread operator e il modo piu comune per copiare oggetti e array in modo superficiale.

```javascript
const original = { a: 1, b: 2 };
const copy = { ...original };
```

Per array:

```javascript
const numbers = [1, 2, 3];
const copy = [...numbers];
```

Vantaggi:

- sintassi semplice;
- ottimo per aggiornamenti immutabili superficiali;
- comune in React e state management;
- leggibile.

Limite:

- non clona oggetti annidati;
- non preserva property descriptors;
- non preserva prototype custom.

Collegamento: [[Spread & Rest Operators]]

## 4. Object.assign

`Object.assign` copia proprieta enumerable da uno o piu oggetti sorgente verso un oggetto target.

```javascript
const target = {};
const source = { a: 1 };

Object.assign(target, source);

console.log(target); // { a: 1 }
```

Per creare una copia:

```javascript
const copy = Object.assign({}, source);
```

Anche `Object.assign` fa una copia superficiale.

Differenza importante:

- spread crea un nuovo object literal;
- `Object.assign` scrive nel target e puo attivare setter.

## 5. Copia Profonda

Una **deep copy** duplica anche gli oggetti annidati.

```javascript
const user = {
  name: "Luca",
  address: {
    city: "Roma",
  },
};

const copy = structuredClone(user);

copy.address.city = "Milano";

console.log(user.address.city); // "Roma"
```

Ora `copy.address` e un oggetto diverso da `user.address`.

## 6. structuredClone

`structuredClone` crea una copia profonda usando l'algoritmo structured clone.

```javascript
const original = {
  date: new Date(),
  map: new Map([["a", 1]]),
  set: new Set([1, 2, 3]),
};

const copy = structuredClone(original);
```

Supporta molti tipi meglio del vecchio trucco `JSON.parse(JSON.stringify(...))`.

Tipi generalmente supportati:

- oggetti plain;
- array;
- `Date`;
- `Map`;
- `Set`;
- `ArrayBuffer`;
- typed arrays;
- valori primitivi;
- strutture cicliche.

Esempio con ciclo:

```javascript
const obj = {};
obj.self = obj;

const copy = structuredClone(obj);

console.log(copy.self === copy); // true
```

## 7. Limiti di structuredClone

`structuredClone` non clona tutto.

Non supporta:

- funzioni;
- DOM nodes;
- `WeakMap`;
- `WeakSet`;
- alcune entita legate all'ambiente runtime;
- prototype e metodi custom come ci si potrebbe aspettare.

Esempio:

```javascript
const obj = {
  run() {
    return "ok";
  },
};

structuredClone(obj); // DataCloneError
```

Quindi `structuredClone` e ottimo per dati, non per clonare comportamenti.

## 8. JSON.parse(JSON.stringify())

Prima di `structuredClone`, era comune usare:

```javascript
const copy = JSON.parse(JSON.stringify(original));
```

Questo approccio e limitato.

Problemi:

- perde `Date`;
- perde `Map` e `Set`;
- ignora `undefined`;
- non supporta cicli;
- perde funzioni;
- puo cambiare tipi;
- dipende dalla serializzazione JSON.

Esempio:

```javascript
const original = {
  date: new Date(),
  value: undefined,
};

const copy = JSON.parse(JSON.stringify(original));

console.log(copy.date); // stringa, non Date
console.log("value" in copy); // false
```

Collegamento: [[JSON]]

## 9. Object.freeze

`Object.freeze` rende un oggetto non estensibile e rende le sue proprieta non configurabili e non scrivibili.

```javascript
"use strict";

const config = Object.freeze({
  apiUrl: "https://api.example.com",
});

config.apiUrl = "https://evil.example.com"; // TypeError in strict mode
config.timeout = 1000; // TypeError in strict mode
```

Effetti:

- non puoi aggiungere proprieta;
- non puoi rimuovere proprieta;
- non puoi modificare proprieta esistenti;
- non puoi riconfigurare descriptor.

Collegamento: [[Property Descriptors]]

## 10. freeze e Oggetti Annidati

`Object.freeze` e superficiale.

```javascript
"use strict";

const config = Object.freeze({
  api: {
    url: "https://api.example.com",
  },
});

config.api.url = "https://other.example.com";

console.log(config.api.url); // "https://other.example.com"
```

L'oggetto `config` e congelato, ma `config.api` no.

Per congelare tutto serve un deep freeze manuale o una strategia diversa.

## 11. Deep Freeze

Esempio semplificato:

```javascript
function deepFreeze(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key]);
  }

  return Object.freeze(value);
}

const config = deepFreeze({
  api: {
    url: "https://api.example.com",
  },
});
```

Questa funzione e utile come concetto, ma in produzione bisogna gestire casi particolari:

- cicli;
- oggetti built-in;
- performance;
- prototype;
- oggetti con getter;
- strutture grandi.

## 12. Object.seal

`Object.seal` impedisce di aggiungere o rimuovere proprieta, ma permette di modificare il valore delle proprieta scrivibili.

```javascript
"use strict";

const user = {
  name: "Luca",
};

Object.seal(user);

user.name = "Sara"; // ok
user.age = 30; // TypeError in strict mode
delete user.name; // TypeError in strict mode
```

Effetti:

- non puoi aggiungere proprieta;
- non puoi eliminare proprieta;
- non puoi riconfigurare proprieta;
- puoi modificare valori se `writable: true`.

## 13. freeze vs seal

| Metodo | Aggiungere | Eliminare | Modificare valori | Riconfigurare |
|---|---|---|---|---|
| `Object.seal` | no | no | si, se writable | no |
| `Object.freeze` | no | no | no | no |

`freeze` e piu restrittivo.

`seal` blocca la forma dell'oggetto ma lascia modificabili i valori esistenti.

## 14. Object.preventExtensions

`Object.preventExtensions` impedisce solo di aggiungere nuove proprieta.

```javascript
"use strict";

const user = {
  name: "Luca",
};

Object.preventExtensions(user);

user.name = "Sara"; // ok
user.age = 30; // TypeError in strict mode
```

Confronto:

| Metodo | Blocca nuove proprieta | Blocca delete | Blocca write |
|---|---|---|---|
| `preventExtensions` | si | no | no |
| `seal` | si | si | no |
| `freeze` | si | si | si |

## 15. Controllare lo Stato di un Oggetto

JavaScript fornisce metodi per verificare lo stato:

```javascript
Object.isExtensible(obj);
Object.isSealed(obj);
Object.isFrozen(obj);
```

Esempio:

```javascript
const config = Object.freeze({ debug: true });

console.log(Object.isFrozen(config)); // true
```

Questi metodi sono utili in debug, test e librerie.

## 16. Immutabilita e Functional Programming

La programmazione funzionale preferisce evitare modifiche in-place.

Invece di:

```javascript
function updateUser(user) {
  user.name = "Sara";
  return user;
}
```

preferisci:

```javascript
function updateUser(user) {
  return {
    ...user,
    name: "Sara",
  };
}
```

Il secondo approccio:

- non modifica l'input;
- riduce side effect;
- semplifica test;
- rende piu prevedibile il flusso dati.

Collegamento: [[Functional Programming]]

## 17. Aggiornare Oggetti Annidati

Con oggetti annidati, devi copiare ogni livello modificato.

```javascript
const state = {
  user: {
    name: "Luca",
    address: {
      city: "Roma",
    },
  },
};

const nextState = {
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: "Milano",
    },
  },
};
```

Questo e verboso, ma esplicito.

Se diventa troppo complesso, probabilmente lo stato e troppo annidato o serve una strategia dedicata.

## 18. structuredClone vs Spread

| Aspetto | Spread | structuredClone |
|---|---|---|
| Tipo copia | superficiale | profonda |
| Funzioni | copia riferimento se proprieta enumerable | non supportate |
| Oggetti annidati | condivisi | clonati |
| Map/Set | non clona struttura interna | supportati |
| Performance | spesso piu leggero | piu costoso |
| Uso tipico | update superficiali | dati serializzabili complessi |

Usa spread quando sai che devi cambiare solo il primo livello.

Usa `structuredClone` quando hai dati annidati e clonabili.

## 19. Performance

La copia ha un costo.

Possibili problemi:

- copiare oggetti grandi troppo spesso;
- usare `structuredClone` su strutture pesanti;
- deep freeze in runtime critico;
- creare troppi oggetti temporanei;
- peggiorare garbage collection.

Collegamenti:

- [[Memory Lifecycle]]
- [[Garbage Collection]]
- [[Optimization]]

Immutabilita va bilanciata con performance e semplicita.

## 20. Sicurezza

`Object.freeze` puo aiutare a proteggere configurazioni o oggetti condivisi da modifiche accidentali.

```javascript
export const permissions = Object.freeze({
  read: "read",
  write: "write",
});
```

Ma non va considerato un confine di sicurezza completo:

- e superficiale;
- non protegge oggetti annidati non congelati;
- non sostituisce validazione;
- non protegge da codice che ha accesso ad altri riferimenti mutabili.

Collegamento: [[Sicurezza]]

## 21. Errori Comuni

### Pensare che const renda immutabile l'oggetto

```javascript
const user = { name: "Luca" };
user.name = "Sara"; // permesso
```

`const` impedisce di riassegnare la variabile, non di modificare l'oggetto.

### Pensare che freeze sia profondo

`Object.freeze` blocca solo il primo livello.

### Usare JSON come clone universale

`JSON.parse(JSON.stringify(...))` perde tipi e fallisce sui cicli.

### Clonare quando basta aggiornare un livello

`structuredClone` e potente ma puo essere piu costoso del necessario.

### Confondere copia e protezione

Clonare un oggetto evita mutazioni condivise, ma non valida i dati.

## 22. Best Practices

1. Usa spread per aggiornamenti superficiali.
2. Usa `structuredClone` per dati annidati clonabili.
3. Evita `JSON.parse(JSON.stringify(...))` come clone generale.
4. Usa `Object.freeze` per costanti e configurazioni condivise.
5. Ricorda che `freeze` e superficiale.
6. Evita deep freeze su hot path senza misurare.
7. Copia solo i livelli che cambiano.
8. Mantieni lo stato meno annidato quando possibile.
9. Usa strict mode per intercettare violazioni.

## 23. Mappa Mentale

```txt
Immutabilita e Copia
  -> oggetti assegnati per riferimento
  -> shallow copy: spread, Object.assign
  -> deep copy: structuredClone
  -> freeze: blocca valori e forma, ma solo primo livello
  -> seal: blocca forma, non valori scrivibili
  -> preventExtensions: blocca nuove proprieta
  -> immutabilita riduce side effect
```
