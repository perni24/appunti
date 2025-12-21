---
tags:
  - programmazione
  - javascript
  - teoria
argomento: Gestione Errori
data: 2025-12-20
stato: 🟢 completato
---

# Gestione degli Errori in JavaScript

## 💡 Concetto Chiave
JS usa eccezioni (`throw` / `try...catch`).
La sfida principale è gestire gli errori **asincroni** (Promises), che non vengono catturati da un blocco `try...catch` standard a meno che non si usi `async/await`.

---

## 📝 Sintassi

```javascript
try {
  // Codice pericoloso
  throw new Error("Ops!");
} catch (error) {
  // Gestione errore
  console.error(error.message);
} finally {
  // Pulizia (sempre eseguito)
}
```

---

## 💻 Esempi Pratici

### 1. Codice Sincrono
```javascript
function div(a, b) {
  if (b === 0) throw new Error("Divisione per zero");
  return a / b;
}

try {
  div(10, 0);
} catch (e) {
  console.log("Errore catturato:", e.message);
}
```

### 2. Codice Asincrono (Promises)
Con le Promise pure si usa `.catch()`.
```javascript
fetch('/api/data')
  .then(res => res.json())
  .catch(err => console.error("Errore di rete:", err));
```

### 3. Codice Asincrono (Async/Await)
Si può usare `try...catch` standard! Molto più leggibile.
```javascript
async function getData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
  } catch (err) {
    console.error("Errore async:", err);
  }
}
```

---

## ⚙️ Funzionamento Interno

### Stack Trace
L'oggetto `Error` contiene la proprietà `.stack` che mostra la catena delle chiamate. Questo stack trace viene generato nel momento in cui l'oggetto `Error` viene creato (`new Error()`).

### Unhandled Promise Rejection
Se una Promise fallisce e non c'è un `.catch()`, il browser o Node.js emettono un warning o (in Node moderni) terminano il processo. È vitale gestire sempre le rejection.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Lancia sempre oggetti Error:** Non fare `throw "Errore"`. Fai `throw new Error("Errore")`. Le stringhe non hanno stack trace!
- ✅ **Controlla `res.ok`:** `fetch()` non lancia eccezioni per errori HTTP 404 o 500 (solo per errori di rete). Devi controllare `response.ok` manualmente.
- 💣 **Try/Catch e Callback:** Un `try...catch` esterno NON cattura errori dentro una callback asincrona (es. `setTimeout`).
    ```javascript
    try {
      setTimeout(() => { throw new Error("Boom"); }, 1000); // Crash non catturato!
    } catch (e) { ... }
    ```

## 📚 Riferimenti
- [MDN - Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
