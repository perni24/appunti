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
  - weakmap
  - weakset
  - memory
  - data-structures
aliases:
  - WeakMap JS
  - WeakSet JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Map e Set]]"
  - "[[Programmazione/JavaScript/Pagine/Garbage Collection]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Lifecycle]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
title: WeakMap e WeakSet
---

# WeakMap e WeakSet

## Sintesi

**WeakMap** associa dati a chiavi senza impedirne da sola la raccolta; **WeakSet** registra l'appartenenza di valori senza trattenerli fortemente. Le chiavi di WeakMap e gli elementi di WeakSet possono essere **oggetti, incluse le funzioni, o simboli non registrati** nei runtime che supportano questi ultimi.

Non sono cache con scadenza o limite di memoria. Servono quando i dati o le marcature devono seguire la vita di un'identita gia posseduta altrove.

## Quando usarlo

- WeakMap: metadati di oggetti esterni, nodi DOM o istanze, senza aggiungervi proprieta.
- WeakMap: stato privato di un modulo o cache legata all'identita di oggetti.
- WeakSet: marcature per oggetti gia inizializzati o visitati, senza mantenere un registro forte permanente.

Scegli invece Map o Set quando devi elencare contenuti, contarli, cercarli per ID stringa o gestire un'eviction esplicita. Per un registro dei visitati che vive soltanto durante una visita sincrona, spesso anche Set va bene.

Gli esempi sono indipendenti, salvo i blocchi di definizione e uso indicati. Non cercano di osservare il momento della garbage collection.

## Come funziona

### Identita e tipi ammessi

Oggetti con la stessa forma non sono la stessa chiave. Le funzioni sono oggetti; i simboli ammessi sono quelli non presenti nel registro globale di `Symbol.for`.

```js
const first = { id: 1 };
const second = { id: 1 };
const labels = new WeakMap([[first, "prima istanza"]]);

console.log(labels.get(first)); // prima istanza
console.log(labels.has(second)); // false
```

Esempio con un simbolo non registrato:

```js
const localKey = Symbol("metadata");
const metadata = new WeakMap([[localKey, "valore"]]);
console.log(metadata.get(localKey)); // valore
```

`Symbol.for("metadata")` non e ammesso, anche se ha la stessa descrizione. Stringhe, numeri, booleani, bigint, null e undefined non sono chiavi deboli valide. Quindi “nessun primitivo e ammesso” e una regola errata: i simboli non registrati sono l'eccezione.

Il supporto ai simboli e piu recente di quello agli oggetti: per runtime vecchi controlla la compatibilita. Convertire un simbolo in un wrapper con `Object(symbol)` crea un'altra identita e non e una sostituzione trasparente.

### Debole sulla chiave non significa debole su tutto

Una Map raggiungibile conserva fortemente chiavi e valori. In una WeakMap la presenza della chiave non ne prolunga da sola la vita; finche la chiave e viva e la collezione e raggiungibile, il valore associato resta disponibile.

```js
let key = { id: "record-1" };
const metadata = new WeakMap();
metadata.set(key, { owner: key, accesses: 0 });
key = null;
```

Il rimando `owner` dal valore alla chiave **non basta, da solo**, a rendere eterno il gruppo. La gestione di queste associazioni e spesso descritta con il modello degli **ephemeron**: non trattare il valore come un riferimento forte indipendente dalla vita della chiave.

Se invece un array globale conserva quel valore, il percorso `array -> valore -> owner` raggiunge nuovamente la chiave. WeakMap non indebolisce i riferimenti esterni. Allo stesso modo, una chiave conservata dal DOM o da una Map continua a tenere utili i suoi metadati.

### Nessuna enumerazione del contenuto

WeakMap e WeakSet non offrono `size`, `clear()`, `forEach`, `keys`, `values`, `entries` o un iteratore del contenuto. Non puoi convertirle in una lista di voci con spread o for...of.

Per consultare una voce devi gia possedere la chiave. Questo evita di esporre un elenco variabile in base alle decisioni interne del collector. Un contatore aggiornato a ogni `set` non potrebbe sapere quante chiavi siano state raccolte.

Sostituire una variabile con una nuova WeakMap puo azzerare il registro usato da quel proprietario, ma non svuota l'istanza precedente se altri la conservano. Non e un metodo `clear` nascosto.

## API / Sintassi

### Operazioni fondamentali

| Collezione | Metodo | Risultato |
| --- | --- | --- |
| WeakMap | `set(key, value)` | La stessa WeakMap; il valore puo essere di qualsiasi tipo |
| WeakMap | `get(key)` | Valore associato o undefined se assente |
| WeakMap | `has(key)` | Booleano |
| WeakMap | `delete(key)` | true se esisteva una voce, false altrimenti |
| WeakSet | `add(value)` | Lo stesso WeakSet |
| WeakSet | `has(value)` | Booleano |
| WeakSet | `delete(value)` | true se era presente, false altrimenti |

Una chiave non ammessa causa TypeError in `set` e `add`; le interrogazioni `get`, `has` e `delete` la trattano invece come assente. Questo non vale per un receiver invalido: chiamare un metodo nativo con `this` che non e la collezione appropriata resta un errore.

```js
const key = {};
const values = new WeakMap();

values.set(key, undefined);
console.log(values.get(key), values.has(key)); // undefined, true
console.log(values.get({}), values.has({})); // undefined, false
console.log(values.delete(key), values.delete(key)); // true, false
console.log(values.get("id"), values.has("id")); // undefined, false
```

Non usare `get(key) === undefined` come prova universale di assenza: `undefined` puo essere un valore salvato.

```js
const item = {};
const processed = new WeakSet();

console.log(processed.add(item) === processed); // true
console.log(processed.has(item)); // true
console.log(processed.delete(item), processed.delete(item)); // true, false
```

### Inserimento se assente e compatibilita

Le API piu recenti comprendono `getOrInsert(key, defaultValue)` e `getOrInsertComputed(key, callback)`. La prima riceve un valore gia calcolato; la seconda chiama la callback con la chiave solo se manca la voce. Una voce presente con valore undefined conta comunque come presente.

Per supportare ambienti senza questi metodi, il normale controllo has/set e sufficiente nei casi sincroni semplici:

```js
const states = new WeakMap();

function stateFor(key) {
  if (typeof states.getOrInsertComputed === "function") {
    return states.getOrInsertComputed(key, () => ({ visits: 0 }));
  }
  if (!states.has(key)) states.set(key, { visits: 0 });
  return states.get(key);
}

const page = {};
stateFor(page).visits += 1;
console.log(stateFor(page).visits); // 1
```

Questo fallback e riferito alla factory sincrona mostrata, senza rientranza; non e un polyfill generale. Una callback async produrrebbe una Promise come valore, senza essere attesa dal metodo e senza invalidazione automatica su rifiuto. Controlla supporto e contratto prima di usarlo.

## Esempio pratico

### Metadati di un elemento DOM

Un dato associato in WeakMap non diventa una proprieta dell'elemento. Esegui nel browser dopo la creazione di `document.body`:

```js
const elementData = new WeakMap();
let button = document.createElement("button");
button.textContent = "Salva";
document.body.append(button);

elementData.set(button, { clicks: 0 });
elementData.get(button).clicks += 1;
console.log(elementData.get(button).clicks); // 1

button.remove();
elementData.delete(button);
button = null;
```

La cancellazione esplicita rende subito assente la voce mentre hai ancora la chiave; non devi aspettare il GC per invalidare logicamente i metadati. Non e sempre necessaria per la raccolta: senza altri riferimenti forti alla chiave, la sola WeakMap non la trattiene.

Questo esempio non registra listener. Se un listener esterno, un array o una subscription conserva il pulsante, la WeakMap non risolve quel percorso: serve comunque il cleanup del proprietario.

### Stato privato di una classe

La WeakMap deve restare interna al modulo; esporta soltanto la classe se vuoi nascondere l'accesso al registro:

```js
const privateData = new WeakMap();

class User {
  constructor(name) {
    if (typeof name !== "string") throw new TypeError("Atteso un nome stringa");
    privateData.set(this, { name });
  }

  getName() {
    const state = privateData.get(this);
    if (state === undefined) throw new TypeError("Receiver User non valido");
    return state.name;
  }
}

const user = new User("Ada");
console.log(user.getName()); // Ada
console.log(Object.keys(user)); // []
```

Chi ottiene un riferimento alla WeakMap puo leggerla con la chiave: non e una protezione magica o una barriera di sicurezza. Per stato appartenente direttamente a una classe, i [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|campi privati]] sono spesso piu diretti. Evita di restituire l'oggetto di stato se vuoi impedirne mutazioni esterne.

### Visitare un grafo senza ripetere gli stessi nodi

Contratto: grafo finito di record ordinari con `name` stringa e `children` array di altri nodi, senza getter, Proxy o mutazioni durante la visita. L'algoritmo visita ogni identita una volta, anche se il grafo ha un ciclo:

```js
function collectNodeNames(root) {
  const visited = new WeakSet();
  const pending = [root];
  const names = [];

  while (pending.length > 0) {
    const node = pending.pop();
    if (node === null || typeof node !== "object" ||
        typeof node.name !== "string" || !Array.isArray(node.children)) {
      throw new TypeError("Nodo non valido");
    }
    if (visited.has(node)) continue;
    visited.add(node);
    names.push(node.name);

    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      pending.push(node.children[index]);
    }
  }
  return names;
}
```

Uso:

```js
const root = { name: "root", children: [] };
const child = { name: "child", children: [root] };
root.children.push(child, child);
console.log(collectNodeNames(root)); // ["root", "child"]
```

La visita e iterativa, quindi non consuma un frame JS per ogni livello. La memoria di `pending` e del risultato puo comunque crescere con il grafo: WeakSet non rende l'algoritmo a memoria costante.

Questo algoritmo **non segnala se il grafo contiene cicli**: ignora sia un ciclo sia un nodo condiviso gia visitato. Per distinguere i due casi serve tracciare anche il percorso attivo della visita. Un Set locale sarebbe ugualmente valido qui, dato che l'intero registro termina con la chiamata.

Per una marcatura longeva di “gia inizializzato”, decidi inoltre quando marcarla e quando rimuoverla: aggiungere prima di un'operazione che fallisce puo impedire un retry, aggiungere solo dopo puo non proteggere dalla rientranza. WeakSet non definisce questa politica.

## Varianti

### Scelta della struttura

| Esigenza | Struttura | Limite da ricordare |
| --- | --- | --- |
| Lookup per ID stringa, enumerazione, dimensione | Map | Trattiene chiavi e valori finche resta raggiungibile |
| Unicita con elenco dei valori | Set | Trattiene gli elementi |
| Metadati legati all'identita di oggetti | WeakMap | Nessuna enumerazione, scadenza o quota |
| Marcature senza registro forte permanente | WeakSet | Nessun elenco degli elementi presenti |
| Stato interno di una classe | Campi privati | Appartengono alle istanze della classe |
| Dato opzionale che puo sparire | WeakRef | Richiede fallback e non ha tempi prevedibili |

### Memoizzazione e invalidazione

Una WeakMap puo memorizzare un risultato per un oggetto immutabile. Se l'oggetto cambia ma conserva l'identita, la voce rimane: **weak non significa aggiornata**. Serve invalidazione esplicita, versionamento o un contratto di immutabilita.

Se le chiavi restano vive a lungo, possono restare vivi anche molti risultati. Per limiti numerici, LRU o TTL vedi [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]. Una Map di WeakRef e una struttura diversa: le sue chiavi possono continuare a crescere anche dopo la scomparsa dei target.

## Errori comuni

- Vietare tutti i primitivi dimenticando i simboli non registrati.
- Usare Symbol.for, ID stringa o nuove copie degli oggetti come chiavi equivalenti.
- Confondere assenza della voce con valore undefined.
- Aspettarsi che il valore associato sia un riferimento debole indipendente.
- Conservare altrove un valore che rimanda alla chiave e aspettarsi che WeakMap rompa quel percorso.
- Aspettarsi size, iterazione, clear o scadenza immediata.
- Confondere deduplicazione della visita con rilevamento dei cicli.
- Usare una collezione debole come sostituto di unsubscribe, close o abort.

## Checklist

- Serve davvero un'associazione per identita e non per ID?
- Non servono elenco delle chiavi, dimensione, quote o eviction?
- I simboli e gli eventuali metodi recenti sono supportati dai runtime di destinazione?
- Il valore non viene conservato altrove con riferimenti indesiderati alla chiave?
- Mutazioni e invalidazione della cache sono documentate?
- La correttezza non dipende dal momento della raccolta?
- Le risorse esterne hanno ancora un cleanup esplicito?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]
- [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collection]]
- [[Programmazione/JavaScript/Pagine/Memory Lifecycle|Memory Lifecycle]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]

## Fonti

- [MDN: WeakMap, tipi di chiave e associazione chiave-valore](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap).
- [MDN: WeakSet e confronto con Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet).
- [ECMAScript: collezioni e algoritmi WeakMap/WeakSet](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-weakmap-objects).
- [MDN: getOrInsert e compatibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap/getOrInsert).
- [MDN: getOrInsertComputed, callback e compatibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap/getOrInsertComputed).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
