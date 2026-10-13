---
date: 2026-06-02
area: Programmazione
topic: JavaScript
tags:
  - javascript
  - objects
  - immutability
  - clone
  - structuredclone
  - freeze
  - seal
aliases:
  - Object.freeze, Object.seal e structuredClone
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Property Descriptors]]"
  - "[[Programmazione/JavaScript/Pagine/Spread & Rest Operators]]"
title: Immutabilita e Copia degli Oggetti
---

# Immutabilita e Copia degli Oggetti

## Sintesi


In JavaScript, oggetti e array sono normalmente **mutabili**. Assegnazione e passaggio di argomenti copiano il valore: per un oggetto quel valore e un riferimento, non una copia dell'oggetto. Due variabili possono quindi osservare le stesse modifiche. Non e passaggio per riferimento della variabile del chiamante.

```javascript
const a = { name: "Luca" };
const b = a;

b.name = "Sara";

console.log(a.name); // "Sara"
```

Per scrivere codice prevedibile e ridurre side effect, e importante capire differenza tra copia superficiale, copia profonda e strumenti come `Object.freeze`, `Object.seal` e `structuredClone`.

> [!INFO]
> Un aggiornamento immutabile non altera la versione precedente del dato: produce una nuova versione. E possibile mutare oggetti locali non ancora condivisi durante la costruzione; controllare le mutazioni non rende automaticamente immutabili gli oggetti.

## Quando usarlo

Usa immutabilita quando vuoi rendere i cambiamenti prevedibili, evitare side effect e confrontare versioni diverse di uno stato.

Casi comuni:

- stato UI;
- reducer;
- funzioni pure;
- dati condivisi tra moduli;
- undo/redo;
- caching;
- test di logica di dominio.

Non vieta di mutare dati locali non ancora condivisi durante la costruzione; richiede di non alterare la versione precedente dello stato che vuoi trattare come immutabile.

Gli snippet sono indipendenti salvo dove indicato; non incollarli tutti nello stesso scope. Gli esempi con errori intenzionali sono segnalati. Le operazioni sulle copie assumono dati ordinari, non Proxy ostili; `structuredClone` richiede un runtime che esponga questa API.

## Come funziona

### Mutabilita e Riferimenti
I valori primitivi sono copiati per valore.

```javascript
let x = 1;
let y = x;

y = 2;

console.log(x); // 1
```

Per gli oggetti viene copiato il riferimento allo stesso valore oggetto.

```javascript
const user = { name: "Luca" };
const sameUser = user;

sameUser.name = "Sara";

console.log(user.name); // "Sara"
```

Questo comportamento e fondamentale per capire bug legati a stato condiviso, UI, cache e funzioni con side effect.

Riassegnare un parametro non cambia invece il binding del chiamante:

```javascript
function replaceUser(user) {
  user = { name: "Sara" };
  return user;
}

const before = { name: "Luca" };
const after = replaceUser(before);
console.log(before.name, after.name); // "Luca", "Sara"
```
### Copia Superficiale
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
### Spread Operator
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

Lo spread di oggetto copia proprieta **proprie ed enumerabili**, incluse quelle con chiave Symbol, leggendo i valori: eventuali getter vengono eseguiti. Lo spread di array usa invece l'iteratore; non copia proprieta custom dell'array e trasforma i buchi di un normale array sparso in elementi undefined. Non sono la stessa operazione.

Collegamento: [[Programmazione/JavaScript/Pagine/Spread & Rest Operators|Spread & Rest Operators]]
### Object.assign
`Object.assign` copia proprieta proprie ed enumerabili, con chiavi stringa o Symbol, dalle sorgenti nel target e restituisce quel target. Le sorgenti successive prevalgono sulle precedenti.

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

Entrambi leggono i getter della sorgente. assign non e transazionale: se una scrittura fallisce, le precedenti restano applicate. Per una copia con i descrittori di un oggetto ordinario si possono usare Object.getOwnPropertyDescriptors e Object.create; non e una copia profonda ne una tecnica valida per ricreare slot interni di Map, Date o istanze con campi privati.
### Copia Profonda
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
### structuredClone
`structuredClone` crea una copia profonda usando l'algoritmo structured clone.

```javascript
const original = {
  date: new Date(),
  map: new Map([ ["a", 1] ]),
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
- valori primitivi tranne Symbol;
- strutture cicliche.

Esempio con ciclo:

```javascript
const obj = {};
obj.self = obj;

const copy = structuredClone(obj);

console.log(copy.self === copy); // true
```

Il clone conserva anche gli alias interni: se due proprieta puntano allo stesso oggetto, nel clone puntano alla stessa nuova copia. Non preserva pero l'identita rispetto all'originale. Per normali record vengono copiati i valori delle proprieta proprie enumerabili con chiave stringa; Symbol e proprieta non enumerabili non sono un archivio affidabile da clonare.

### Trasferimento e memoria condivisa

Con transfer puoi trasferire un ArrayBuffer invece di copiarlo. L'originale viene distaccato e non e piu utilizzabile come prima, incluse le viste che dipendono da quel buffer:

```javascript
const bytes = new Uint8Array([10, 20, 30]);
const transferred = structuredClone(bytes, { transfer: [bytes.buffer] });
console.log(bytes.byteLength); // 0: il buffer originale e distaccato
console.log([...transferred]); // [10, 20, 30]
```

E un effetto distruttivo intenzionale sul buffer sorgente, non una copia innocua. Non tutti gli oggetti clonabili sono trasferibili. SharedArrayBuffer, dove disponibile e consentito, mantiene memoria condivisa anche tramite clone: non garantisce isolamento dei dati e non e trasferibile come ArrayBuffer.
### JSON.parse(JSON.stringify())
Prima di `structuredClone`, era comune usare:

```javascript
const copy = JSON.parse(JSON.stringify(original));
```

Questo approccio e limitato.

Problemi:

- converte normalmente Date valide in stringhe, senza ricostruirle;
- serializza normalmente Map e Set come oggetti vuoti;
- omette undefined, funzioni e Symbol nei campi di oggetto; negli array diventano null;
- non supporta cicli;
- converte NaN e Infinity in null e non supporta BigInt senza una conversione esplicita;
- dipende da getter e toJSON, che possono eseguire codice;
- non conserva alias condivisi, prototipi e descrittori.

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

Collegamento: [[Programmazione/JavaScript/Pagine/JSON|JSON]]
### Object.freeze
`Object.freeze` opera sull'oggetto ricevuto e restituisce lo stesso riferimento, non una copia. Impedisce l'estensione, rende tutte le proprieta proprie non configurabili e quelle **di dati** non scrivibili. Gli accessor non hanno writable: getter e setter continuano a funzionare.

```javascript
"use strict";

const config = Object.freeze({
  apiUrl: "https://api.example.com",
});

try {
  config.apiUrl = "https://other.example.com";
} catch (error) {
  console.log(error.name); // "TypeError"
}
try {
  config.timeout = 1000;
} catch (error) {
  console.log(error.name); // "TypeError"
}
```

Effetti:

- non puoi aggiungere proprieta;
- non puoi rimuovere proprieta;
- non puoi sostituire il valore delle proprieta di dati proprie;
- non puoi effettuare modifiche incompatibili ai descrittori o cambiare prototipo.

Una normale assegnazione vietata genera TypeError in strict mode e puo fallire silenziosamente fuori da esso; non tutte le API diventano silenziose, per esempio Object.defineProperty puo comunque lanciare. Un setter puo cambiare stato esterno; freeze non blocca campi privati o slot interni di built-in.

```javascript
const settings = Object.freeze(new Map([["mode", "light"]]));
settings.set("mode", "dark");
console.log(settings.get("mode")); // "dark"
```

Analogamente Date puo ancora cambiare tramite i suoi setter. Congelare una typed array non vuota genera TypeError; congelare un DataView non rende immutabili i byte del buffer sottostante.

Collegamento: [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
### freeze e Oggetti Annidati
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

Per un grafo di semplici dati serve un congelamento ricorsivo o un modello di dati diverso. Non esiste un freeze universale dello stato di qualunque oggetto JavaScript.
### Deep Freeze
Helper per un dominio ristretto: array normali e oggetti con prototipo Object.prototype o null, nello stesso realm, con sole proprieta di dati. Accetta cicli e riferimenti ripetuti. Rifiuta accessor, funzioni e istanze come Map/Date invece di promettere un'immutabilita inesistente.

```javascript
function deepFreeze(root) {
  const seen = new WeakSet();
  const pending = [root];
  const objects = [];

  // Valida il grafo prima di congelare, senza leggere i getter.
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value === "function") throw new TypeError("Funzioni non supportate");
    if (value === null || typeof value !== "object" || seen.has(value)) continue;
    const prototype = Object.getPrototypeOf(value);
    const supported = Array.isArray(value)
      ? prototype === Array.prototype
      : prototype === Object.prototype || prototype === null;
    if (!supported) throw new TypeError("Servono array normali o record semplici");
    seen.add(value);
    objects.push(value);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!Object.hasOwn(descriptor, "value")) {
        throw new TypeError("Accessor non supportati");
      }
      pending.push(descriptor.value);
    }
  }
  for (const object of objects) Object.freeze(object);
  return root;
}

const config = deepFreeze({
  api: {
    url: "https://api.example.com",
  },
});
```

L'algoritmo iterativo evita la ricorsione dello stack; memoria e lavoro crescono con il grafo visitato. Include chiavi Symbol e non enumerabili e non si ferma solo perche un contenitore e gia congelato. Modifica gli oggetti originali: anche gli altri riferimenti vedranno il freeze.

Non usarlo su Proxy, oggetti ostili o strutture di dimensione non controllata: le operazioni riflessive possono attivare trap e non esiste un rollback generale. Nel dominio dichiarato un errore di validazione avviene prima dei freeze. Non congela Object.prototype o altri prototipi globali.
### Object.seal
`Object.seal` impedisce di aggiungere o rimuovere proprieta, ma permette di modificare il valore delle proprieta scrivibili.

```javascript
"use strict";

const user = {
  name: "Luca",
};

Object.seal(user);

user.name = "Sara"; // ok
try {
  user.age = 30;
} catch (error) {
  console.log(error.name); // "TypeError"
}
try {
  delete user.name;
} catch (error) {
  console.log(error.name); // "TypeError"
}
```

Effetti:

- non puoi aggiungere proprieta;
- non puoi eliminare proprieta;
- non puoi cambiare enumerable/configurable o convertire proprieta di dati in accessor;
- puoi modificare valori se `writable: true`.

Puoi ancora passare writable da true a false, ma non ripristinarlo dopo. Anche seal opera sullo stesso oggetto ed e superficiale.
### freeze vs seal
| Metodo | Aggiungere | Eliminare | Valori di dati | Da writable a non writable |
|---|---|---|---|---|
| `Object.seal` | no | no | si, se writable | si |
| `Object.freeze` | no | no | no | gia non writable |

`freeze` e piu restrittivo.

`seal` blocca la forma dell'oggetto ma lascia modificabili i valori esistenti.
### Object.preventExtensions
`Object.preventExtensions` impedisce di aggiungere nuove proprieta proprie e di cambiare il prototipo. Non rende automaticamente non scrivibili o non configurabili quelle esistenti.

```javascript
"use strict";

const user = {
  name: "Luca",
};

Object.preventExtensions(user);

user.name = "Sara"; // ok
try {
  user.age = 30;
} catch (error) {
  console.log(error.name); // "TypeError"
}
```

Confronto:

| Metodo | Nuove proprieta proprie | Delete di proprieta proprie | Write di proprieta di dati |
|---|---|---|---|
| `preventExtensions` | vietate | dipende da configurable | dipende da writable |
| `seal` | vietate | vietato | dipende da writable |
| `freeze` | vietate | vietato | vietato |

Le tabelle riguardano proprieta proprie di oggetti ordinari; accessor, valori annidati e stato interno richiedono le distinzioni precedenti.
### Controllare lo Stato di un Oggetto
JavaScript fornisce metodi per verificare lo stato:

```text
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
### Immutabilita e Functional Programming
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

Collegamento: [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
### Aggiornare Oggetti Annidati
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
### structuredClone vs Spread
| Aspetto | Spread | structuredClone |
|---|---|---|
| Tipo copia | superficiale | profonda |
| Funzioni | copia riferimento se proprieta enumerable | non supportate |
| Oggetti annidati | condivisi | clonati |
| Map/Set | non clona struttura interna | supportati |
| Costo | dipende dalle proprieta/elementi copiati | dipende dal grafo e dai tipi: misurare |
| Uso tipico | update superficiali | dati serializzabili complessi |

Usa spread per costruire le parti modificate; con dati annidati ricrea ogni livello del percorso aggiornato.

Usa `structuredClone` quando hai dati annidati e clonabili.
### Performance
La copia ha un costo.

Possibili problemi:

- copiare oggetti grandi troppo spesso;
- usare `structuredClone` su strutture pesanti;
- deep freeze in runtime critico;
- creare troppi oggetti temporanei;
- peggiorare garbage collection.

Collegamenti:

- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]

Immutabilita va bilanciata con performance e semplicita.
### Sicurezza
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

Collegamento: [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## API / Sintassi

Schemi di riferimento: object, array, user e value sono dati da fornire, non dichiarati in questi blocchi.

Copia superficiale:

```text
const nextObject = { ...object };
const nextArray = [...array];
```

Aggiornamento immutabile:

```text
const nextUser = {
  ...user,
  profile: {
    ...user.profile,
    name: "Luca",
  },
};
```

Copia profonda moderna:

```text
const clone = structuredClone(value);
```

Blocco superficiale:

```text
Object.freeze(object);
```

## Esempio pratico

Aggiornare un utente in un array denso di record ordinari: id interi positivi univoci, name stringa e active booleano. La patch puo modificare solo name e active, non id o campi arbitrari. Getter e Proxy non fanno parte di questo contratto.

```js
function updateUser(users, userId, patch) {
  if (!Array.isArray(users) || !Number.isSafeInteger(userId) || userId <= 0 ||
      patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    throw new TypeError("Input non valido");
  }
  const changes = {};
  const keys = Reflect.ownKeys(patch);
  for (const key of keys) {
    if (key !== "name" && key !== "active") throw new TypeError("Campo non modificabile");
    changes[key] = patch[key];
  }
  if ((Object.hasOwn(changes, "name") && typeof changes.name !== "string") ||
      (Object.hasOwn(changes, "active") && typeof changes.active !== "boolean")) {
    throw new TypeError("Patch non valida");
  }
  const ids = new Set();
  for (let index = 0; index < users.length; index += 1) {
    if (!Object.hasOwn(users, index)) throw new TypeError("Array sparso non ammesso");
    const user = users[index];
    if (user === null || typeof user !== "object" || Array.isArray(user) ||
        !Number.isSafeInteger(user.id) || user.id <= 0 ||
        typeof user.name !== "string" || typeof user.active !== "boolean") {
      throw new TypeError("Utente non valido");
    }
    if (ids.has(user.id)) throw new RangeError("ID duplicato");
    ids.add(user.id);
  }
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1 || keys.every((key) => users[index][key] === changes[key])) return users;
  return users.map((user, position) => position === index ? { ...user, ...changes } : user);
}
```

Gli elementi non modificati mantengono lo stesso riferimento; quello aggiornato viene ricreato. Campi aggiuntivi, per esempio address, restano condivisi: la funzione non li clona o congela. ID assente, patch vuota o valori invariati restituiscono l'array originale. Uno schema invalido genera errore anche se l'ID cercato manca.

```js
const users = [
  { id: 1, name: "Luca", active: true },
  { id: 2, name: "Sara", active: false },
];
const updated = updateUser(users, 2, { active: true });
console.log(users[1].active); // false
console.log(updated[0] === users[0]); // true
console.log(updated[1] === users[1]); // false
```

Questa selezione di campi non e un controllo di autorizzazione: se aggiorni dati remoti, il server deve verificare chi puo modificarli.

## Varianti

### Limiti di structuredClone
`structuredClone` non clona tutto.

Non supporta:

- funzioni;
- DOM nodes;
- `WeakMap`;
- `WeakSet`;
- valori Symbol e Proxy;
- alcune entita legate all'ambiente runtime;

Per le normali istanze personalizzate non viene conservata la catena del prototipo; getter vengono letti come valori e non si mantengono descrittori, stato frozen o campi privati. Un metodo funzione tra i dati da clonare causa errore. Supporto dei tipi host e disponibilita globale vanno verificati nel runtime di destinazione.

Esempio:

```javascript
const obj = {
  run() {
    return "ok";
  },
};

try {
  structuredClone(obj);
} catch (error) {
  console.log(error.name); // "DataCloneError"
}
```

Quindi `structuredClone` e ottimo per dati, non per clonare comportamenti.
### Mappa Mentale
```txt
Immutabilita e Copia
  -> assegnazione e argomenti copiano il valore riferimento
  -> shallow copy: spread, Object.assign
  -> deep copy: structuredClone
  -> freeze: blocca proprieta di dati proprie, non tutto lo stato interno
  -> seal: blocca forma, non valori scrivibili
  -> preventExtensions: blocca nuove proprieta
  -> immutabilita riduce side effect
```

## Errori comuni


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

Una copia superficiale conserva riferimenti annidati; un clone di SharedArrayBuffer conserva memoria condivisa. Clonare non valida i dati, non congela il risultato e non ricrea automaticamente il comportamento di una classe.

## Checklist

### Best Practices
1. Usa spread per aggiornamenti superficiali.
2. Usa `structuredClone` per dati annidati clonabili.
3. Evita `JSON.parse(JSON.stringify(...))` come clone generale.
4. Usa `Object.freeze` per costanti e configurazioni condivise.
5. Ricorda che `freeze` e superficiale.
6. Evita deep freeze su hot path senza misurare.
7. Copia solo i livelli che cambiano.
8. Mantieni lo stato meno annidato quando possibile.
9. Usa strict mode per intercettare violazioni.
10. Distingui copia e transfer: quest'ultimo puo invalidare il buffer originale.
11. Verifica getter, cicli, tipi supportati e schema delle patch prima di usare un helper generico.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
- [[Programmazione/JavaScript/Pagine/Spread & Rest Operators|Spread e Rest Operators]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]

## Fonti

- [MDN - Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN - Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [MDN - structuredClone e transfer](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [MDN - Structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [WHATWG - Structured data, clonazione e trasferimento](https://html.spec.whatwg.org/multipage/structured-data.html#safe-passing-of-structured-data)
- [MDN - JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN - Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [MDN - Object.seal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal)
- [MDN - Object.preventExtensions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
