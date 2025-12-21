---
tags:
  - programmazione
  - javascript
  - teoria
argomento: Variabili e Tipi di Dati
data: 2025-12-20
stato: 🟢 completato
---

# Variabili e Tipi di Dati in JavaScript

## 💡 Concetto Chiave
JavaScript è a **tipizzazione dinamica e debole**.
*   **Dinamica:** Le variabili non hanno tipo, i valori sì.
*   **Debole:** Il motore JS tenta di convertire i tipi implicitamente (Type Coercion) per eseguire le operazioni, spesso con risultati inattesi (`"1" + 1 = "11"`).

---

## 📝 Sintassi

```javascript
// 1. const (Costante - Standard moderno)
// Non può essere riassegnata. Scope di blocco.
const PI = 3.14;

// 2. let (Variabile mutabile - Standard moderno)
// Può essere riassegnata. Scope di blocco.
let contatore = 0;
contatore = 1;

// 3. var (Legacy - Evitare se possibile)
// Scope di funzione (o globale). Soggetta a Hoisting.
var vecchio = "deprecato";
```

---

## 💻 Esempi Pratici

### Const vs Let
Usa `const` di default. Usa `let` solo se sai che il valore cambierà (es. contatori, accumulatori).

```javascript
const user = { name: "Mario" };
user.name = "Luigi"; // ✅ Lecito! L'oggetto è mutabile, il binding 'user' no.
// user = {}; // ❌ Errore: Assignment to constant variable.

let score = 10;
score = 20; // ✅ Lecito.
```

### Type Coercion (Il lato oscuro)
```javascript
console.log(1 + "2");   // "12" (Stringa vince su +)
console.log("10" - 2);  // 8    (Matematica vince su -, *, /)
console.log([] + []);   // ""   (Array vuoti diventano stringhe vuote)
```

---

## ⚙️ Funzionamento Interno

### Tipi Primitivi vs Oggetti
In JS esistono 7 primitivi (immutabili, passati per valore) e gli Oggetti (mutabili, passati per riferimento).
*   **Primitivi:** `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`.
*   **Oggetti:** `{Object}`, `[Array]`, `Function`, `Date`, etc.

### Hoisting
È il comportamento per cui le dichiarazioni di variabili e funzioni vengono "spostate" in cima al loro scope prima dell'esecuzione del codice.
*   `var`: Inizializzata a `undefined`.
*   `let` / `const`: Entrano nella "Temporal Dead Zone" (TDZ). Accederle prima della dichiarazione lancia un `ReferenceError`.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa sempre `const` e `let`:** Dimentica `var`.
- ✅ **Usa `===`:** L'uguaglianza stretta controlla valore E tipo. `==` fa coercizione (`0 == false` è true, `0 === false` è false).
- 💣 **`null` vs `undefined`:**
    *   `undefined`: "Non ho ancora un valore" (default del motore JS).
    *   `null`: "Ho esplicitamente valore nullo" (impostato dal programmatore).
    *   Bug storico: `typeof null` ritorna `"object"`.

## 📚 Riferimenti
- [MDN - Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)
