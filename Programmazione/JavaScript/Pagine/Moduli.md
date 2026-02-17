---
date: 2026-02-17
tags: [javascript, es6, moduli, esm, import, export]
type: #permanent-note
status: budding
---

# Moduli (ES Modules)

I **Moduli** sono una funzionalità fondamentale introdotta in **ES6** (ECMAScript 2015) che permette di dividere il codice JavaScript in file separati, facilitando la manutenzione, il riutilizzo e l'organizzazione della codebase.

Un modulo è semplicemente un file JavaScript che "esporta" parte del suo contenuto per renderlo utilizzabile da altri file tramite "importazione".

## 1. Esportazione (Export)

Esistono due modi principali per esportare membri da un modulo: **Named Export** e **Default Export**.

### Named Export (Esportazioni Nominate)
Permette di esportare più elementi dallo stesso file. Ogni elemento deve essere importato usando il suo nome esatto.

```javascript
// lib.js
export const pi = 3.14;
export function sum(a, b) { return a + b; }

// Altro modo (esportazione multipla alla fine)
// export { pi, sum };
```

### Default Export (Esportazione Predefinita)
Ogni modulo può avere **al massimo un'esportazione predefinita**. È l'entità principale che il modulo mette a disposizione.

**Caratteristiche:**
- Non è necessario conoscere il nome originale dell'elemento per importarlo.
- Si può esportare direttamente un valore, una funzione anonima o una classe senza assegnargli un nome nel file di origine.

```javascript
// User.js
export default class User {
  constructor(name) { this.name = name; }
}

// logger.js (Esportazione di funzione anonima)
// export default function(msg) { console.log(msg); }
```

> [!WARNING] Restrizioni Sintattiche
> Non è possibile usare `export default` insieme a dichiarazioni di variabili come `const`, `let` o `var` sulla stessa riga. Bisogna prima dichiarare la variabile e poi esportarla, oppure esportare direttamente il valore.
> ```javascript
> // ERRORE: export default const pi = 3.14; 
> const pi = 3.14;
> export default pi; // CORRETTO
> ```

---

## Esportare Classi vs Funzioni

Dal punto di vista tecnico dei moduli non c'è differenza, ma la scelta cambia l'architettura:

### Esportare una Funzione
Si usa per logiche **stateless** (senza stato) o utilità pure.
- **Vantaggio**: Più leggera e semplice da testare.
- **Esempio**: `export function formatDate(date) { ... }`

### Esportare una Classe
Si usa quando è necessario gestire uno **stato interno** o creare più istanze indipendenti.
- **Vantaggio**: Permette di incapsulare dati (proprietà) e comportamenti (metodi).
- **Esempio**: `export class DatabaseConnector { ... }`

> [!INFO] Hoisting
> Ricorda che le **funzioni** dichiarate sono soggette a hoisting, mentre le **classi** no (devono essere definite prima di essere usate, specialmente se esportate/importate in logiche complesse).

---

## 2. Importazione (Import)

### Importare Named Exports
È necessario utilizzare le parentesi graffe `{}` e i nomi corretti.

```javascript
import { pi, sum } from './lib.js';
console.log(sum(pi, 2)); // 5.14
```

### Importare Default Exports
A differenza delle named exports, **non si usano le parentesi graffe**. Poiché esiste un solo "default", JavaScript capisce automaticamente cosa importare. È possibile scegliere un nome qualsiasi per la variabile locale (piena libertà di ridenominazione).

```javascript
import UserProfile from './User.js'; 
// 'UserProfile' può chiamarsi come vuoi e conterrà la classe 'User'

import logMessage from './logger.js';
logMessage("Test inviato");
```

> [!TIP] Importazione Ibrida
> È possibile importare sia il default che i membri nominati nella stessa riga. Il default deve sempre essere indicato per primo, fuori dalle graffe.
> ```javascript
> import User, { pi, sum } from './myModule.js';
> ```

### Ridenominazione e Namespace
```javascript
// Ridenominazione (as)
import { sum as add } from './lib.js';

// Importazione di tutto (namespace)
import * as MathLib from './lib.js';
console.log(MathLib.pi);
```

---

## Caratteristiche dei Moduli

1.  **Strict Mode Automatico**: I moduli sono sempre eseguiti in Strict Mode per default.
2.  **Scope del Modulo**: Variabili e funzioni definite in un modulo non sono globali, ma rimangono confinate al file (a meno che non vengano esportate).
3.  **Esecuzione Singola**: Un modulo viene scaricato ed eseguito una sola volta, indipendentemente da quante volte venga importato.
4.  **Differimento (Deferred)**: Di default, gli script con `type="module"` nel browser vengono eseguiti in modo differito (come se avessero l'attributo `defer`).

## Utilizzo nel Browser
Per caricare un modulo in una pagina HTML, è necessario specificare il tipo:
```html
<script type="module" src="app.js"></script>
```