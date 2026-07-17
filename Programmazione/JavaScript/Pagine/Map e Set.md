---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, map, set, data-structures, collections]
aliases: [Map JS, Set JS]
prerequisites: [Array Methods, Oggetti Avanzati]
related: [WeakMap e WeakSet, Array Methods, Oggetti Avanzati]
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

Metodi principali:

- `set(key, value)`;
- `get(key)`;
- `has(key)`;
- `delete(key)`;
- `clear()`;
- `size`.

---
### Chiavi di qualsiasi tipo
A differenza degli oggetti, una `Map` puo usare chiavi di qualsiasi tipo.

```js
const cache = new Map();
const user = { id: 1 };

cache.set(user, "dati utente");

console.log(cache.get(user)); // "dati utente"
```

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

Metodi principali:

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
  const groups = new Map();

  for (const user of users) {
    const group = groups.get(user.role) ?? [];
    group.push(user);
    groups.set(user.role, group);
  }

  return groups;
}
```

Rimuovere duplicati primitivi:

```js
const ids = [1, 2, 1, 3];
const uniqueIds = [...new Set(ids)];
```

## Varianti

- **Map**: dizionario con chiavi arbitrarie.
- **Set**: insieme di valori unici.
- **WeakMap**: chiavi oggetto deboli, utile per metadata privati.
- **WeakSet**: insieme debole di oggetti.
- **Object**: record con chiavi stringa/symbol.
- **Array**: collezione ordinata indicizzata.

## Errori comuni

- Usare oggetti come dizionari quando una `Map` sarebbe piu chiara.
- Aspettarsi che `Set` rimuova oggetti duplicati per contenuto.
- Dimenticare che `Map.get()` restituisce `undefined` se la chiave non esiste.
- Usare `map[key]` invece di `map.get(key)`.
- Confondere `Map` struttura dati con `Array.prototype.map()`.

---

## Checklist

- Mi servono chiavi non stringa?
- Mi serve una collezione di valori unici?
- Devo serializzare facilmente in JSON?
- L'unicita deve essere per valore o per riferimento?
- `Object`, `Map`, array o `Set` rappresentano meglio il dato?

---

## Collegamenti

- [[WeakMap e WeakSet]]
- [[Array Methods]]
- [[Oggetti Avanzati]]
- [[JSON]]
- [[Immutabilita e Copia degli Oggetti]]
