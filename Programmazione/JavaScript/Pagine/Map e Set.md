---
date: 2026-02-17
tags: [javascript, es6, map, set, data-structures]
type: #permanent-note
status: budding
---

# Map e Set

In **ES6**, JavaScript ha introdotto due nuove strutture dati per la gestione delle collezioni: **Map** e **Set**. Queste offrono vantaggi significativi rispetto agli oggetti e agli array tradizionali in casi d'uso specifici.

---

## 1. Map

Una **Map** è una collezione di coppie chiave-valore. A differenza degli oggetti, le chiavi possono essere di **qualsiasi tipo** (oggetti, funzioni, numeri, ecc.) e viene mantenuto l'ordine di inserimento.

### Metodi Principali
```javascript
const myMap = new Map();

// Aggiungere o aggiornare
myMap.set("status", "online");
myMap.set(123, "ID Utente");

// Leggere
console.log(myMap.get("status")); // "online"

// Verificare esistenza
console.log(myMap.has(123)); // true

// Dimensione
console.log(myMap.size); // 2

// Eliminare
myMap.delete("status");
```

> [!TIP] Map vs Object
> Utilizza le `Map` quando i nomi delle chiavi non sono noti a priori o quando le chiavi devono essere di tipi diversi dalle stringhe. Per dati strutturati semplici, gli oggetti rimangono la scelta ottimale.

---

## 2. Set

Un **Set** è una collezione di **valori univoci**. Non permette duplicati: se si prova ad aggiungere un valore già presente, l'operazione viene ignorata.

### Metodi Principali
```javascript
const mySet = new Set([1, 2, 2, 3]); // Automatically removes duplicates

// Aggiungere
mySet.add(4);
mySet.add(1); // Ignored because 1 is already present

// Verificare esistenza (molto performante)
console.log(mySet.has(2)); // true

// Dimensione
console.log(mySet.size); // 4 (1, 2, 3, 4)

// Eliminare
mySet.delete(3);
```

### Casi d'uso: Rimuovere duplicati da un Array
Il `Set` è il modo più rapido per ripulire un array dai duplicati.
```javascript
const names = ["Luca", "Sara", "Luca"];
const uniqueNames = [...new Set(names)]; // ["Luca", "Sara"]
```

---

## Iterazione

Sia `Map` che `Set` sono iterabili e supportano il ciclo `for...of`.

```javascript
// Iterazione su Map
for (let [key, value] of myMap) {
  console.log(`${key}: ${value}`);
}

// Iterazione su Set
for (let value of mySet) {
  console.log(value);
}
```

---