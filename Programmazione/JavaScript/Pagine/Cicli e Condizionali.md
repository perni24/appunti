---
tags:
  - programmazione
  - javascript
  - teoria
argomento: Cicli e Condizionali
data: 2025-12-20
stato: 🟢 completato
---

# Cicli e Condizionali in JavaScript

## 💡 Concetto Chiave
JS offre i classici cicli C-style (`for`, `while`), ma nello sviluppo moderno si privilegiano i metodi funzionali degli Array (`.map`, `.filter`, `.forEach`) o il costrutto `for...of` per l'iterazione pulita.

---

## 📝 Sintassi

### Condizionali
```javascript
if (condizione) {
  // blocco
} else if (altra) {
  // blocco
} else {
  // blocco
}

// Ternario
const stato = isOnline ? "Online" : "Offline";

// Switch
switch (valore) {
  case "A": break;
  default: break;
}
```

### Cicli
```javascript
// For...of (Iterabili: Array, Stringhe, Map) - ES6
for (const item of array) { ... }

// Metodi Funzionali (Preferiti in React/Modern JS)
array.map(item => ...);
array.forEach(item => ...);
```

---

## 💻 Esempi Pratici

### Esempio 1: Iterazione su Array
```javascript
const frutti = ["mela", "pera", "banana"];

// Moderno e pulito
for (const frutto of frutti) {
  console.log(frutto);
}

// Funzionale (con indice opzionale)
frutti.forEach((frutto, index) => {
  console.log(`${index}: ${frutto}`);
});
```

### Esempio 2: Iterazione su Oggetti
Gli oggetti non sono iterabili direttamente con `for...of`.
```javascript
const user = { nome: "Mario", eta: 30 };

// Vecchia scuola: for...in (sconsigliato, itera anche sulla catena dei prototipi)
for (const key in user) {
  console.log(key, user[key]);
}

// Moderna: Object.keys() / Object.entries()
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}
```

---

## ⚙️ Funzionamento Interno

### Truthy & Falsy
Nei condizionali, JS converte il valore in booleano.
*   **Falsy:** `false`, `0`, `""` (stringa vuota), `null`, `undefined`, `NaN`.
*   **Truthy:** Tutto il resto (inclusi `[]` e `{}` vuoti!).

### Short-circuit evaluation
```javascript
// OR (||): Ritorna il primo truthy
const nome = inputUser || "Utente Anonimo";

// AND (&&): Ritorna il primo falsy o l'ultimo valore (utile in React)
isLoggedIn && showDashboard();

// Nullish Coalescing (??) - ES2020
// Simile a || ma considera solo null/undefined (non 0 o "")
const timeout = config.timeout ?? 1000;
```

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Preferisci `.map` / `.reduce`:** Quando devi trasformare dati, i metodi funzionali sono più dichiarativi e concatenabili rispetto ai cicli imperativi.
- 💣 **`for...in`:** Non usarlo sugli array! Non garantisce l'ordine e itera proprietà enumerable non numeriche.
- 💣 **Array vuoti:** `if ([])` è `true`! Controlla invece `if (array.length > 0)`.

## 📚 Riferimenti
- [MDN - Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
