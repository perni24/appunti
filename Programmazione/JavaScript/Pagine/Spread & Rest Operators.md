---
date: 2026-02-17
tags: [javascript, es6, spread, rest, array, oggetti]
type: #permanent-note
status: budding
---

# Spread & Rest Operators

In JavaScript (**ES6+**), l'operatore **tre puntini** (`...`) viene utilizzato per due scopi opposti a seconda del contesto in cui si trova: **Spread** (espansione) e **Rest** (raccolta).

---

## 1. Spread Operator (Espansione)

Lo *Spread* "espande" un iterabile (come un array o un oggetto) nei suoi singoli elementi.

### Negli Array
Utile per copiare array o concatenarli in modo leggibile.

```javascript
const numbers = [1, 2, 3];
const moreNumbers = [...numbers, 4, 5]; // [1, 2, 3, 4, 5]

// Copia superficiale (Shallow Copy)
const copy = [...numbers]; // Different reference than 'numbers'
```

### Negli Oggetti (ES2018)
Permette di clonare oggetti o unire più proprietà in uno solo.

```javascript
const user = { name: "Luca", role: "Dev" };
const details = { ...user, city: "Milano" }; 
// { name: "Luca", role: "Dev", city: "Milano" }

// Merging di oggetti
const base = { a: 1, b: 2 };
const override = { b: 10 };
const merged = { ...base, ...override }; // { a: 1, b: 10 }
```

---

## 2. Rest Operator (Raccolta)

Il *Rest* "raccoglie" più elementi rimasti e li raggruppa in un unico Array o Oggetto.

### Parametri delle Funzioni
Sostituisce il vecchio oggetto `arguments`, trasformando i parametri in un vero array.

```javascript
function sum(...numbers) {
  // 'numbers' is a real Array
  return numbers.reduce((acc, n) => acc + n, 0);
}

console.log(sum(10, 20, 30)); // 60
```

> [!IMPORTANT] Vincolo di Posizione
> Il parametro *Rest* deve sempre essere l'**ultimo** parametro nella definizione della funzione.

### Nella Destructuring|Destrutturazione
Permette di estrarre alcuni elementi e raggruppare i rimanenti.

```javascript
const [first, ...others] = [1, 2, 3, 4, 5];
// first = 1, others = [2, 3, 4, 5]

const { name, ...restOfProperties } = { name: "Luca", age: 30, city: "Roma" };
// name = "Luca", restOfProperties = { age: 30, city: "Roma" }
```

---

## Differenza Fondamentale

| Operatore | Scopo | Dove si usa |
| :--- | :--- | :--- |
| **Spread** | Trasforma un array/oggetto in elementi singoli. | Chiamate di funzione, letterali di array/oggetti. |
| **Rest** | Trasforma elementi singoli in un array/oggetto. | Parametri di funzione, destrutturazione. |
