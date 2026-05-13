---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, weakmap, weakset, memory, data-structures]
aliases: [WeakMap JS, WeakSet JS]
prerequisites: [Map e Set, Garbage Collection]
related: [Memory Leaks, Memory Lifecycle, Oggetti Avanzati]
---

# WeakMap e WeakSet

## Sintesi

`WeakMap` e `WeakSet` sono collezioni che mantengono riferimenti deboli agli oggetti.

Se un oggetto e raggiungibile solo tramite una `WeakMap` o un `WeakSet`, il garbage collector puo comunque liberarlo.

---

## Riferimenti forti e deboli

Una `Map` mantiene riferimenti forti.

```js
let user = { id: 1 };
const map = new Map();

map.set(user, "metadata");
user = null;
```

L'oggetto resta raggiungibile tramite `map`.

Una `WeakMap` non impedisce la garbage collection della chiave.

```js
let user = { id: 1 };
const metadata = new WeakMap();

metadata.set(user, { lastAccess: Date.now() });
user = null;
```

Quando non esistono altri riferimenti, l'oggetto puo essere raccolto.

---

## WeakMap

`WeakMap` associa chiavi oggetto a valori.

```js
const privateData = new WeakMap();

class User {
  constructor(name) {
    privateData.set(this, { name });
  }

  getName() {
    return privateData.get(this).name;
  }
}
```

Metodi disponibili:

- `set(key, value)`;
- `get(key)`;
- `has(key)`;
- `delete(key)`.

Le chiavi devono essere oggetti o simboli non registrati.

---

## WeakSet

`WeakSet` memorizza oggetti senza impedire che vengano raccolti.

```js
const processed = new WeakSet();

function process(item) {
  if (processed.has(item)) {
    return;
  }

  processed.add(item);
  // lavoro sull'oggetto
}
```

Metodi disponibili:

- `add(value)`;
- `has(value)`;
- `delete(value)`.

---

## Perche non sono iterabili

`WeakMap` e `WeakSet` non espongono:

- `size`;
- `forEach`;
- `keys`;
- `values`;
- `entries`;
- iterazione con `for...of`.

Il motivo e che il garbage collector puo rimuovere elementi in modo non deterministico.

Se fossero iterabili, il risultato dipenderebbe dal momento interno della garbage collection.

---

## Casi d'uso

Usa `WeakMap` per:

- metadata associati a oggetti esterni;
- dati privati;
- cache legate alla vita di un oggetto;
- informazioni su nodi DOM senza impedire cleanup.

Usa `WeakSet` per:

- marcare oggetti gia processati;
- evitare doppia inizializzazione;
- tracciare oggetti visitati in algoritmi su grafi.

---

## Confronto

| Struttura | Chiavi/valori | Iterabile | Riferimento |
| --- | --- | --- | --- |
| `Map` | qualsiasi chiave | si | forte |
| `Set` | qualsiasi valore | si | forte |
| `WeakMap` | chiavi oggetto | no | debole sulle chiavi |
| `WeakSet` | valori oggetto | no | debole sui valori |

---

## Errori comuni

- Usare primitive come chiavi di `WeakMap`.
- Cercare di iterare una `WeakMap`.
- Usare `WeakMap` quando serve conoscere la dimensione della cache.
- Pensare che la rimozione sia immediata o osservabile.
- Usare `WeakSet` per dati che devono essere elencati.

---

## Checklist operativa

- Usa `WeakMap` quando i dati devono seguire la vita di un oggetto.
- Usa `Map` quando devi iterare o conoscere `size`.
- Non basare la logica sul momento della garbage collection.
- Usa `WeakSet` per marcature temporanee su oggetti.
- Documenta perche serve un riferimento debole.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
