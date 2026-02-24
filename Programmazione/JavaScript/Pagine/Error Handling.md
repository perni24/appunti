---
date: 2026-02-24
tags: [javascript, programming, errors, debugging]
type: #permanent-note
status: budding
---

# Error Handling in JavaScript

La gestione degli errori è fondamentale per creare applicazioni robuste che non si interrompono bruscamente quando accade qualcosa di imprevisto (es. rete assente, dati malformati).

## 1. Il blocco `try...catch...finally`

È la struttura principale per gestire le eccezioni.

- **`try`**: Contiene il codice che potrebbe generare un errore.
- **`catch`**: Viene eseguito solo se si verifica un errore nel blocco `try`. Riceve l'oggetto errore come parametro.
- **`finally`**: Viene eseguito **sempre**, indipendentemente dal fatto che ci sia stato un errore o meno. Utile per chiudere connessioni o pulire variabili.

```javascript
try {
    const dati = JSON.parse("{ 'nome': 'Mancano i doppi apici' }");
} catch (error) {
    console.error("Errore nel parsing JSON:", error.message);
} finally {
    console.log("Operazione terminata.");
}
```

## 2. L'istruzione `throw`

Puoi lanciare deliberatamente un'eccezione usando `throw`. È buona pratica lanciare oggetti che derivano dalla classe `Error`.

```javascript
function dividi(a, b) {
    if (b === 0) {
        throw new Error("Divisione per zero non permessa!");
    }
    return a / b;
}
```

## 3. L'oggetto `Error`

Gli errori in JS hanno tre proprietà principali:
- **`name`**: Il tipo di errore.
- **`message`**: Descrizione testuale.
- **`stack`**: Lo stack trace (utile per il debugging).

### Tipi di Errore Comuni:
- **`ReferenceError`**: Variabile non definita.
- **`TypeError`**: Valore non del tipo atteso (es. chiamare un metodo su `null`).
- **`SyntaxError`**: Codice scritto male.
- **`RangeError`**: Valore numerico fuori intervallo.

## 4. Errori Asincroni

I blocchi `try/catch` standard non intercettano gli errori nelle Promises a meno che non si usi `await`.

### Con Promises
```javascript
fetch("api/dati")
    .then(res => res.json())
    .catch(error => console.log("Errore:", error));
```

### Con Async/Await
```javascript
async function caricaDati() {
    try {
        const res = await fetch("api/dati");
        const dati = await res.json();
    } catch (error) {
        console.log("Gestione errore asincrono:", error);
    }
}
```

## 5. Errori Personalizzati

Puoi creare classi di errore specifiche per la tua applicazione estendendo `Error`.

```javascript
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
```

> [!IMPORTANT] Catch-all
> Inserire tutto il codice dell'applicazione in un unico grande `try...catch` è una cattiva pratica. Gestisci gli errori il più vicino possibile a dove potrebbero verificarsi (granularità).

---
