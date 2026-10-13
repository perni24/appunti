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
  - map
  - set
  - data-structures
  - collections
aliases:
  - Map JS
  - Set JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/WeakMap e WeakSet]]"
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
title: Map e Set
---

# Map e Set

## Sintesi

`Map` e `Set` sono strutture dati introdotte in ES6.

`Map` memorizza coppie chiave-valore. `Set` memorizza valori unici.

---

## Quando usarlo

Usa `Map` quando ti serve un dizionario dinamico con chiavi non necessariamente stringhe.

Usa `Set` quando ti serve rappresentare appartenenza o unicita.

Casi comuni:

- cache temporanee;
- lookup per ID o oggetto;
- rimozione duplicati;
- controllo appartenenza;
- conteggio o raggruppamento;
- relazioni tra oggetti.

Per record serializzabili con chiavi note, un oggetto normale e spesso piu adatto.

## Come funziona

### Map
Una `Map` associa chiavi a valori.

```js
const usersById = new Map();

usersById.set(1, { name: "Luca" });
usersById.set(2, { name: "Sara" });

console.log(usersById.get(1)); // { name: "Luca" }
```

Metodi e proprieta principali:

- `set(key, value)`;
- `get(key)`;
- `has(key)`;
- `delete(key)`;
- `clear()`;
- `size`.

`size` e una proprieta, non una funzione. `set` restituisce la Map e consente concatenazioni; `delete` restituisce un booleano. `get` restituisce `undefined` anche per una chiave presente associata a quel valore: usa `has` per distinguere i casi.

---
### Chiavi di qualsiasi tipo
A differenza degli oggetti, una `Map` puo usare chiavi di qualsiasi tipo.

```js
const cache = new Map();
const user = { id: 1 };

cache.set(user, "dati utente");

console.log(cache.get(user)); // "dati utente"
console.log(cache.get({ id: 1 })); // undefined: oggetto diverso
```

Map e Set usano SameValueZero: `NaN` equivale a `NaN`, `0` e `-0` coincidono; oggetti uguali nel contenuto rimangono distinti per identita. Il numero `1` e la stringa `"1"` sono chiavi diverse.

---
### Iterare una Map
```js
const roles = new Map([
  ["admin", "Amministratore"],
  ["reader", "Lettore"],
]);

for (const [key, value] of roles) {
  console.log(key, value);
}
```

Una `Map` mantiene l'ordine di inserimento.

Aggiornare una chiave esistente non la sposta; cancellarla e reinserirla la porta alla fine. Nella callback `map.forEach((value, key) => ...)` il valore viene prima della chiave, diversamente dalla coppia `[key, value]` del `for...of`.

---
### Map vs Object
Usa `Object` quando:

- rappresenti un record con proprieta note;
- stai modellando un'entita;
- vuoi serializzare facilmente in JSON.

Usa `Map` quando:

- le chiavi sono dinamiche;
- le chiavi non sono stringhe;
- fai molte aggiunte e rimozioni;
- vuoi semantica esplicita da dizionario.

---
### Set
Un `Set` contiene valori unici.

```js
const ids = new Set();

ids.add(1);
ids.add(2);
ids.add(1);

console.log(ids.size); // 2
```

Metodi e proprieta principali:

- `add(value)`;
- `has(value)`;
- `delete(value)`;
- `clear()`;
- `size`.

---
### Rimuovere duplicati
```js
const names = ["Luca", "Sara", "Luca"];
const uniqueNames = [...new Set(names)];

console.log(uniqueNames); // ["Luca", "Sara"]
```

Funziona bene con primitivi.

Con oggetti, l'unicita e basata sul riferimento.

```js
const set = new Set([{ id: 1 }, { id: 1 }]);

console.log(set.size); // 2
```

Anche Set conserva l'ordine di inserimento. Per deduplicare oggetti per `id`, devi definire una politica: tenere il primo, l'ultimo o unire i dati. Una Map costruita per id conserva l'ultimo valore di ogni chiave:

```js
const users = [{ id: 1, name: "Ada" }, { id: 1, name: "Grace" }];
const uniqueUsers = [...new Map(users.map(user => [user.id, user])).values()];
console.log(uniqueUsers); // [{ id: 1, name: "Grace" }]
```

### Operazioni tra insiemi

Nei runtime che le supportano, `union`, `intersection`, `difference` e `symmetricDifference` creano nuovi Set. `isSubsetOf`, `isSupersetOf` e `isDisjointFrom` restituiscono booleani. Controlla la compatibilita se supporti ambienti meno recenti.

```js
const selected = new Set([1, 2]);
const allowed = new Set([2, 3]);
const common = selected.intersection(allowed);
console.log([...common]); // [2], senza modificare selected o allowed
```

---
### Conversioni
Array a Set:

```js
const set = new Set(["a", "b"]);
```

Set ad array:

```js
const values = [...set];
```

Object a Map:

```js
const map = new Map(Object.entries({ a: 1, b: 2 }));
```

Map a Object:

```js
const object = Object.fromEntries(map);
```

Questa conversione e adatta a chiavi stringa/simbolo: `1` e `"1"` collidono nello stesso oggetto. `Object.entries()` esclude i simboli. Inoltre `JSON.stringify(new Map(...))` e `JSON.stringify(new Set(...))` producono normalmente `{}`: serve una rappresentazione esplicita, per esempio coppie per Map e valori per Set.

```js
const roles = new Map([[1, "reader"], [2, "editor"]]);
const text = JSON.stringify([...roles]);
const restored = new Map(JSON.parse(text));
console.log(restored.get(2)); // "editor"
```

Il round trip vale per queste coppie JSON-safe, non ricrea l'identita di chiavi oggetto, simboli o tipi speciali. La forma dei dati ricevuti va validata prima di passarli al costruttore.

---

## API / Sintassi

`Map`:

```js
const map = new Map();
map.set(key, value);
map.get(key);
map.has(key);
map.delete(key);
map.clear();
map.size;
```

`Set`:

```js
const set = new Set();
set.add(value);
set.has(value);
set.delete(value);
set.clear();
set.size;
```

Iterazione:

```js
for (const [key, value] of map) {}
for (const value of set) {}
```

## Esempio pratico

Raggruppare utenti per ruolo:

```js
function groupByRole(users) {
  if (!Array.isArray(users)) throw new TypeError("Serve un array di utenti");
  const groups = new Map();

  for (const user of users) {
    if (!user || typeof user !== "object" || Array.isArray(user) || typeof user.role !== "string") {
      throw new TypeError("Ogni utente deve avere un ruolo stringa");
    }
    const group = groups.get(user.role) ?? [];
    group.push(user);
    groups.set(user.role, group);
  }

  return groups;
}

const groups = groupByRole([
  { name: "Ada", role: "reader" },
  { name: "Sara", role: "reader" },
  { name: "Marco", role: "constructor" },
]);
console.log(groups.get("reader").length); // 2
```

I gruppi sono array nuovi, ma gli oggetti utente restano condivisi. I ruoli vengono raggruppati, non autorizzati: la funzione non decide quali privilegi un utente possa ottenere.

Rimuovere duplicati primitivi:

```js
const ids = [1, 2, 1, 3];
const uniqueIds = [...new Set(ids)];
```

## Varianti

- **Map**: dizionario con chiavi arbitrarie.
- **Set**: insieme di valori unici.
- **WeakMap / WeakSet**: riferimenti deboli a oggetti e, nei runtime compatibili, simboli non registrati; non sono enumerabili e non hanno `size`.
- **Object**: record con chiavi stringa/symbol.
- **Array**: collezione ordinata indicizzata.

## Errori comuni

- Usare oggetti come dizionari quando una `Map` sarebbe piu chiara.
- Aspettarsi che `Set` rimuova oggetti duplicati per contenuto.
- Dimenticare che `Map.get()` restituisce `undefined` se la chiave non esiste.
- Usare `map[key]` invece di `map.get(key)`.
- Confondere `Map` struttura dati con `Array.prototype.map()`.
- Trattare una Map come cache con scadenza automatica: mantiene riferimenti forti e richiede limiti o una politica di rimozione.

---

## Checklist

- Mi servono chiavi non stringa?
- Mi serve una collezione di valori unici?
- Devo serializzare facilmente in JSON?
- L'unicita deve essere per valore o per riferimento?
- `Object`, `Map`, array o `Set` rappresentano meglio il dato?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet|WeakMap e WeakSet]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]


## Fonti

- [MDN - Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN - Set e operazioni tra insiemi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [MDN - WeakMap e chiavi ammesse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
