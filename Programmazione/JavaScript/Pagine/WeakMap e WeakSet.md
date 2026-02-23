---
date: 2026-02-23
tags: [javascript, programming, memory, data-structures]
type: #permanent-note
status: budding
---

# WeakMap e WeakSet in JavaScript

`WeakMap` e `WeakSet` sono varianti delle strutture dati [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]] introdotte in ES6. La loro particolarità principale è che mantengono **referenze deboli** agli oggetti che contengono, aiutando a prevenire i [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]].

## 1. Il concetto di "Referenze Deboli"

In una `Map` o in un `Set` tradizionale, finché l'oggetto è presente nella struttura, il [[Programmazione/JavaScript/Pagine/Garbage Collection|Garbage Collector]] non lo rimuoverà mai dalla memoria, anche se non ci sono altre referenze ad esso nel programma.

In una `WeakMap` o `WeakSet`, la referenza è "debole": se l'oggetto non ha altre referenze "forti" al di fuori della struttura, il Garbage Collector è libero di eliminarlo e rimuoverlo automaticamente anche dalla `WeakMap` o dal `WeakSet`.

## 2. WeakMap

Una `WeakMap` è una collezione di coppie chiave/valore in cui le chiavi **devono essere oggetti** (o simboli non registrati).

### Caratteristiche principali:
- **Chiavi solo oggetti**: Non puoi usare stringhe o numeri come chiavi.
- **Non iterabile**: Non puoi usare `forEach`, `for...of`, né accedere a `.size`. Questo perché il GC potrebbe rimuovere elementi in qualsiasi momento, rendendo l'iterazione inconsistente.
- **Metodi supportati**: `get()`, `set()`, `has()`, `delete()`.

### Caso d'uso: Dati Privati o Metadata
Utilissimo per associare dati a un oggetto senza "sporcare" l'oggetto stesso o impedirne la rimozione.

```javascript
let utente = { nome: "Luca" };
const metadata = new WeakMap();

metadata.set(utente, { ultimoAccesso: Date.now() });

// Se impostiamo utente a null, l'oggetto e i suoi metadata 
// verranno rimossi dalla memoria al prossimo ciclo di GC
utente = null; 
```

## 3. WeakSet

Simile al `Set`, ma contiene solo oggetti e le referenze sono deboli.

### Caratteristiche principali:
- **Solo oggetti**: Non può contenere primitivi.
- **Non iterabile**: Non ha `.size` o metodi di iterazione.
- **Metodi supportati**: `add()`, `has()`, `delete()`.

### Caso d'uso: Tracciamento dello stato
Ideale per marcare oggetti come "processati" senza impedirne il rilascio.

```javascript
const processati = new WeakSet();

function processa(obj) {
    if (processati.has(obj)) return;
    // ... logica di processing ...
    processati.add(obj);
}
```

## 4. Confronto Rapido

| Caratteristica | Map / Set | WeakMap / WeakSet |
| :--- | :--- | :--- |
| **Tipo Chiavi/Valori** | Qualsiasi (primitivi e oggetti) | Solo **Oggetti** |
| **Referenza** | **Forte** (blocca il GC) | **Debole** (permette il GC) |
| **Iterabilità** | Sì (`forEach`, `size`, ecc.) | No |
| **Determinismo** | Sì | No (dipende dal momento del GC) |

---
