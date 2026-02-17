---
date: 2026-02-17
tags: [javascript, oggetti, es6, this, object-methods]
type: #permanent-note
status: budding
---

# Oggetti Avanzati

In JavaScript moderno (**ES6+**), gli oggetti hanno ricevuto numerosi potenziamenti sia in termini di sintassi che di metodi statici per la manipolazione dei dati.

## 1. Scorciatoie Sintattiche (Shorthands)

### Property Shorthand
Se il nome della variabile coincide con il nome della proprietà, si può omettere il valore.

```javascript
const name = "Luca";
const age = 30;

// Prima di ES6
const userOld = { name: name, age: age };

// Con ES6
const user = { name, age }; // Shorthand property
```

### Method Shorthand
È possibile definire metodi senza la parola chiave `function` e i due punti.

```javascript
const calculator = {
  sum(a, b) {
    return a + b;
  }
};
```

## 2. Metodi Statici di `Object`

Questi metodi permettono di interagire con la struttura degli oggetti.

- **`Object.keys(obj)`**: Ritorna un array con i nomi delle proprietà (chiavi).
- **`Object.values(obj)`**: Ritorna un array con i valori delle proprietà.
- **`Object.entries(obj)`**: Ritorna un array di array, dove ogni sotto-array è una coppia `[chiave, valore]`.

```javascript
const laptop = { brand: "Apple", model: "Air" };

console.log(Object.keys(laptop));   // ["brand", "model"]
console.log(Object.values(laptop)); // ["Apple", "Air"]
console.log(Object.entries(laptop)); // [["brand", "Apple"], ["model", "Air"]]
```

## 3. Il contesto `this` negli Oggetti

Il valore di `this` dipende da **come** la funzione viene chiamata.

### Metodi Regolari
Nei metodi definiti con `function` o con la versione abbreviata, `this` punta all'**oggetto stesso**.

```javascript
const person = {
  name: "Luca",
  greet() {
    console.log(`Ciao, sono ${this.name}`); // 'this' refers to 'person'
  }
};
```

### Arrow Functions
Le arrow functions **non hanno un proprio `this`**. Usano il `this` dello scope esterno.

```javascript
const personArrow = {
  name: "Sara",
  greet: () => {
    console.log(this.name); // undefined (this refers to global/window)
  }
};
```

> [!WARNING] Best Practice
> Non utilizzare mai le *arrow functions* come metodi di un oggetto se hai bisogno di accedere alle proprietà dell'oggetto tramite `this`.

---