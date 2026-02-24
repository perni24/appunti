---
date: 2026-02-24
tags: [javascript, programming, proxy, reflect, metaprogramming]
type: #permanent-note
status: budding
---

# Proxy e Reflect in JavaScript

Questi due oggetti, introdotti in ES6, permettono di intercettare e personalizzare le operazioni fondamentali sugli oggetti (come la lettura di proprietà, l'assegnazione, l'enumerazione, ecc.). Sono alla base della **meta-programmazione** in JavaScript.

## 1. Proxy

Un `Proxy` avvolge un oggetto (il **target**) e permette di ridefinire il comportamento delle sue operazioni fondamentali tramite funzioni chiamate **traps**.

### Sintassi
```javascript
const proxy = new Proxy(target, handler);
```
- **target**: L'oggetto originale che vogliamo proteggere o estendere.
- **handler**: Un oggetto che contiene le "traps" (intercettatori).

### Esempio: Validazione con `set`
```javascript
const utente = { nome: "Luca", eta: 25 };

const handler = {
    set(target, prop, value) {
        if (prop === "eta" && typeof value !== "number") {
            throw new TypeError("L'età deve essere un numero!");
        }
        target[prop] = value;
        return true; // Indica che l'operazione è riuscita
    }
};

const proxyUtente = new Proxy(utente, handler);
proxyUtente.eta = 30; // Funziona
// proxyUtente.eta = "trenta"; // Lancia un errore
```

## 2. Reflect

`Reflect` è un oggetto built-in che fornisce metodi per le stesse operazioni intercettabili dai Proxy. Mentre i Proxy servono per **intercettare**, Reflect serve per **eseguire** le operazioni originali in modo pulito.

### Perché usare Reflect con Proxy?
1.  **Valori di ritorno**: I metodi di Reflect restituiscono un booleano che indica se l'operazione è riuscita, semplificando la scrittura delle traps.
2.  **Propagazione corretta**: Risolve problemi legati a `this` quando si usano i prototipi.

```javascript
const handler = {
    get(target, prop, receiver) {
        console.log(`Lettura di: ${prop}`);
        // Usa Reflect per eseguire l'operazione originale sul target
        return Reflect.get(target, prop, receiver);
    }
};
```

## 3. Traps Comuni

| Trap | Intercetta |
| :--- | :--- |
| `get(target, prop, receiver)` | Lettura di una proprietà. |
| `set(target, prop, value, receiver)` | Scrittura di una proprietà. |
| `has(target, prop)` | L'operatore `in`. |
| `deleteProperty(target, prop)` | L'operatore `delete`. |
| `apply(target, thisArg, argumentsList)` | La chiamata di una funzione. |

## 4. Casi d'Uso Pratici

-   **Validazione**: Forzare tipi di dati o vincoli sui valori.
-   **Logging/Profilazione**: Tracciare chi accede a quali dati e quando.
-   **Reattività**: Registrare dipendenze quando una proprietà viene letta e notificare i cambiamenti quando viene scritta (tecnica usata da Vue.js 3).
-   **API Segrete**: Nascondere proprietà interne (es. quelle che iniziano con `_`).

---
