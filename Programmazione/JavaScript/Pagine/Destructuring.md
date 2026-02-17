---
date: 2026-02-17
tags: [javascript, es6, destructuring, array, oggetti]
type: #permanent-note
status: budding
---

# Destructuring

La **Destructuring assignment** (assegnazione per destrutturazione) è una sintassi introdotta in **ES6** che permette di "estrarre" dati da array o oggetti e assegnarli a variabili distinte in modo rapido e leggibile.

## 1. Destrutturazione di Array

L'estrazione avviene in base alla **posizione** (ordine) degli elementi.

```javascript
const colors = ["red", "green", "blue"];

// Estrazione classica
// const r = colors[0];

// Destructuring
const [r, g, b] = colors; // r="red", g="green", b="blue"
```

### Saltare Elementi
È possibile saltare elementi lasciando uno spazio vuoto tra le virgole.
```javascript
const [first, , third] = ["A", "B", "C"]; // first="A", third="C"
```

### Rest Operator (`...`)
Si può raccogliere il resto degli elementi in un nuovo array.
```javascript
const [head, ...tail] = [1, 2, 3, 4]; // head=1, tail=[2, 3, 4]
```

## 2. Destrutturazione di Oggetti

L'estrazione avviene in base al **nome della proprietà** (chiave). L'ordine non conta.

```javascript
const user = {
  name: "Luca",
  role: "Admin",
  age: 25
};

const { name, role } = user; // Extract by key name: name="Luca", role="Admin"
```

### Ridenominazione e Valori di Default
È possibile assegnare un nome diverso alla variabile o definire un valore di default se la proprietà è `undefined`.

```javascript
const { name: userName, status = "active" } = user;
// userName="Luca", status="active" (default)
```

## 3. Destrutturazione Nidificata (Nested)

Funziona sia per oggetti che per array complessi.

```javascript
const data = {
  id: 1,
  info: {
    city: "Milano",
    zip: 20100
  }
};

const { info: { city } } = data; // Extracts 'city' from nested 'info' object: city="Milano"
```

## 4. Utilizzo nei Parametri delle Funzioni

Questa è una delle applicazioni più potenti, specialmente nello sviluppo web moderno (es. React).

```javascript
function printUser({ name, role }) {
  console.log(`${name} is a ${role}`);
}

printUser(user); // Passes the whole object, but the function destructures it
```

## Perché Utilizzarlo

- **Sinteticità**: Riduce drasticamente il numero di righe necessarie per estrarre dati.
- **Chiarezza**: Rende esplicito quali dati un componente o una funzione sta utilizzando.
- **Manutenibilità**: Facilita la gestione di oggetti complessi provenienti da API.
