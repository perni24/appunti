---
date: 2026-02-23
tags: [javascript, programming, memory, performance]
type: #permanent-note
status: budding
---

# Memory Lifecycle in JavaScript

Indipendentemente dal linguaggio di programmazione, il ciclo di vita della memoria è quasi sempre lo stesso. In JavaScript, questo processo è **automatico** e per lo più invisibile allo sviluppatore, ma capirlo è fondamentale per scrivere codice efficiente.

## 1. Le Tre Fasi del Ciclo di Vita

Il ciclo si compone di tre passaggi fondamentali:

1.  **Allocazione della memoria**: JavaScript riserva lo spazio necessario in memoria quando dichiariamo variabili, oggetti o funzioni.
2.  **Utilizzo della memoria**: Avviene quando leggiamo o scriviamo nelle variabili allocate (es. leggere una proprietà di un oggetto o passare un argomento a una funzione).
3.  **Rilascio della memoria**: Quando la memoria non è più necessaria, viene rilasciata per essere riutilizzata. In JS, questo compito è affidato al **Garbage Collector**.

## 2. Dove viene salvata la memoria? (Stack vs Heap)

Il motore JavaScript (come V8) utilizza due strutture diverse per gestire la memoria:

### Stack (Memoria Statica)
Viene utilizzata per i **valori primitivi** (stringhe, numeri, booleani, null, undefined) e per i **riferimenti** agli oggetti.
- **Caratteristiche**: Dimensione fissa, accesso molto veloce (LIFO).
- **Gestione**: Gestita direttamente dal motore con lo stack di esecuzione delle funzioni.

### Heap (Memoria Dinamica)
Viene utilizzata per gli **oggetti**, gli **array** e le **funzioni**.
- **Caratteristiche**: Dimensione variabile, potenzialmente molto grande, accesso leggermente più lento rispetto allo stack.
- **Gestione**: Qui è dove interviene il Garbage Collector per pulire gli oggetti non più raggiungibili.

```javascript
const n = 123;           // Alloca un numero sullo Stack
const s = "Testo";       // Alloca una stringa sullo Stack

const obj = {            // Alloca l'oggetto nell'Heap
    nome: "Luca"         // Il riferimento 'obj' sta nello Stack
};
```

> [!INFO] Automazione
> A differenza di linguaggi come C o C++, dove lo sviluppatore deve allocare e liberare memoria manualmente (es. `malloc()` e `free()`), JavaScript gestisce tutto questo "sotto il cofano", riducendo il rischio di errori macroscopici ma rendendo meno evidenti i problemi di performance.

---