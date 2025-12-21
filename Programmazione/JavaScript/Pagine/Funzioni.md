---
tags:
  - programmazione
  - javascript
  - teoria
argomento: Funzioni
data: 2025-12-20
stato: 🟢 completato
---

# Funzioni in JavaScript

## 💡 Concetto Chiave
Le funzioni in JS sono oggetti di prima classe. La grande distinzione moderna è tra **Function Declaration** (classiche) e **Arrow Functions** (ES6), che differiscono principalmente per come gestiscono il contesto `this`.

---

## 📝 Sintassi

```javascript
// 1. Function Declaration (Hoisted)
function somma(a, b) {
  return a + b;
}

// 2. Function Expression (Non Hoisted)
const somma = function(a, b) {
  return a + b;
};

// 3. Arrow Function (ES6 - Concisa, 'this' lessicale)
const somma = (a, b) => a + b;
```

---

## 💻 Esempi Pratici

### Arrow Function: Sintassi Breve
Se c'è un solo parametro, le parentesi tonde sono opzionali. Se c'è una sola espressione, il `return` e le graffe sono impliciti.
```javascript
const raddoppia = n => n * 2;

// Ritorno di oggetto implicito (servono le tonde attorno alle graffe)
const creaUser = (nome) => ({ nome: nome, ruolo: "user" });
```

### Callback (Funzioni passate come argomenti)
```javascript
const numeri = [1, 2, 3];
// Passiamo una funzione anonima a .map
const quadrati = numeri.map(n => n * n);
```

---

## ⚙️ Funzionamento Interno

### Il contesto `this`
È la fonte di confusione #1 in JS.
*   **Funzioni Classiche:** `this` dipende da *come* la funzione viene chiamata (es. come metodo di oggetto, come funzione libera, etc.).
*   **Arrow Functions:** Non hanno un proprio `this`. Lo ereditano dal contesto in cui sono definite (**Scope Lessicale**). Questo le rende perfette per callback e metodi di classe in React.

### Closures (Chiusure)
Una funzione "ricorda" le variabili dello scope in cui è stata creata, anche se viene eseguita altrove.
```javascript
function creaContatore() {
  let count = 0;
  return function() { // Questa inner function è una closure
    count++;
    return count;
  };
}

const conta = creaContatore();
console.log(conta()); // 1
console.log(conta()); // 2
```

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Usa Arrow Functions:** Per callback semplici e metodi che non richiedono un `this` dinamico.
- ✅ **Default Parameters:** `function(a = 10) { ... }` (ES6) invece di controllare `undefined` manualmente.
- 💣 **`this` nei metodi:** Non usare arrow functions per metodi di oggetti se ti serve accedere all'oggetto stesso con `this`.
    ```javascript
    const obj = {
      val: 10,
      metodoErrato: () => console.log(this.val), // undefined (this è window/global)
      metodoGiusto() { console.log(this.val); }  // 10
    };
    ```

## 📚 Riferimenti
- [MDN - Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
