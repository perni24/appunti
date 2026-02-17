---
date: 2026-02-17
tags: [javascript, strict-mode, es5, sicurezza, debugging, best-practices]
type: #permanent-note
status: budding
---

# Strict Mode

Lo **Strict Mode** ("modalità rigorosa") è una funzionalità introdotta in **ECMAScript 5 (ES5)** che permette di eseguire il codice JavaScript in un contesto più "severo".

> [!INFO] Definizione
> La modalità *Strict Mode* è un opt-in che modifica la semantica di JavaScript, convertendo "errori silenziosi" in eccezioni reali, prevenendo sintassi non sicure e preparando il codice per future versioni del linguaggio.

L'obiettivo principale è rendere il codice più robusto, leggibile e sicuro, aiutando lo sviluppatore a intercettare errori comuni durante la fase di scrittura.

## Come Attivarlo

Lo Strict Mode può essere attivato in due ambiti: per un intero script o per una singola funzione.

### 1. Intero Script
Aggiungendo la stringa `"use strict";` come **prima istruzione** del file.

```javascript
"use strict";
x = 3.14; // Error: x is not defined (ReferenceError)
```

> [!WARNING] Concatenazione di Script
> Se si concatenano più file JavaScript, assicurarsi che `"use strict";` non influenzi involontariamente script legacy che non sono compatibili.

### 2. Singola Funzione
Inserendo la direttiva all'inizio del corpo della funzione. Questo permette di migrare gradualmente una codebase legacy.

```javascript
x = 3.14; // No error (non-strict)

function strictFunc() {
  "use strict";
  y = 3.14; // Error: y is not defined (ReferenceError)
}
```

> [!NOTE] Moduli ES6
> I **moduli JavaScript** (introdotti in ES6) e le classi sono sempre in Strict Mode per default, quindi non è necessario aggiungere `"use strict";` manualmente.

## Principali Restrizioni e Cambiamenti

L'attivazione della modalità strict introduce diversi cambiamenti nel comportamento del motore JavaScript. Ecco i più rilevanti:

### 1. Gestione delle Variabili
Impedisce la creazione accidentale di variabili globali. In modalità non-strict, assegnare un valore a una variabile non dichiarata crea automaticamente una proprietà globale; in strict mode, questo solleva un **ReferenceError**.

```javascript
"use strict";
pippo = 10; // ReferenceError: pippo is not defined
```

### 2. Eliminazione Silenziosa
Tentare di eliminare proprietà non cancellabili (es. `Object.prototype`) genera un errore invece di fallire silenziosamente.

```javascript
"use strict";
delete Object.prototype; // TypeError
```

### 3. Nomi dei Parametri nelle Funzioni
I parametri di una funzione devono avere nomi unici.

```javascript
// SyntaxError in Strict Mode
function sum(a, a, c) {
  "use strict";
  return a + a + c; 
}
```

### 4. Valore di `this`
In una funzione invocata come routine (non come metodo), `this` è `undefined` invece dell'oggetto globale (`window` o `global`). Questo evita errori comuni e rende il codice più sicuro.

```javascript
"use strict";
function mostraThis() {
  console.log(this);
}
mostraThis(); // undefined
```

### 5. Parole Riservate
Parole chiave riservate per future versioni di ECMAScript (come `implements`, `interface`, `let`, `package`, `private`, `protected`, `public`, `static`, `yield`) non possono essere usate come nomi di variabili.

## Perché Utilizzarlo

L'adozione dello Strict Mode è una best practice fondamentale nello sviluppo moderno per diversi motivi:

1.  **Debugging Più Semplice**: Errori che altrimenti verrebbero ignorati vengono segnalati immediatamente.
2.  **Sicurezza**: Riduce vettori di attacco impedendo l'accesso all'oggetto globale tramite `this` in funzioni non controllate.
3.  **Ottimizzazione**: Alcuni motori JavaScript possono ottimizzare meglio il codice strict poiché le semantiche sono più rigide.

> [!TIP] Consiglio Architetturale
> Utilizzare sempre lo Strict Mode per nuovi progetti. Se si lavora con Strutture Condizionali o logiche complesse, la rigidezza extra ripaga in termini di manutenibilità a lungo termine.
