---
date: 2026-02-23
tags: [javascript, programming, optimization, performance, v8]
type: #permanent-note
status: budding
---

# Optimization in JavaScript

L'ottimizzazione in JavaScript avviene a due livelli: quello del **motore** (come V8 di Chrome/Node.js) e quello del **codice** scritto dallo sviluppatore. Capire come il motore "pensa" permette di scrivere codice che può essere compilato ed eseguito molto più velocemente.

## 1. Ottimizzazioni del Motore (V8)

I motori moderni non si limitano a interpretare il codice, ma lo ottimizzano dinamicamente durante l'esecuzione.

### JIT (Just-In-Time) Compilation
JavaScript è un linguaggio interpretato, ma V8 utilizza la compilazione JIT per trasformare il codice spesso eseguito ("hot code") direttamente in **codice macchina** altamente ottimizzato.

### Hidden Classes (Classi Nascoste)
Poiché JavaScript è un linguaggio a tipizzazione dinamica, l'accesso alle proprietà degli oggetti è intrinsecamente più lento rispetto a linguaggi statici come Java. V8 risolve questo creando "Hidden Classes" internamente.
- **Good**: Inizializzare tutte le proprietà nel costruttore e nello stesso ordine.
- **Bad**: Aggiungere o eliminare proprietà dinamicamente (causa il cambio della Hidden Class).

```javascript
// Ottimizzato: stessa struttura
function Punto(x, y) {
    this.x = x;
    this.y = y;
}
const p1 = new Punto(1, 2);
const p2 = new Punto(3, 4); 

// Non ottimizzato: strutture diverse
const o1 = { a: 1 };
o1.b = 2; // La Hidden Class cambia
const o2 = { b: 2 };
o2.a = 1; // Struttura diversa da o1
```

### Inline Caching (IC)
Il motore memorizza la posizione delle proprietà degli oggetti per evitare ricerche costose nell'albero dei prototipi ogni volta che si accede a una proprietà.

## 2. Buone Pratiche di Scrittura

- **Evitare `delete`**: L'operatore `delete` modifica la struttura dell'oggetto e impedisce molte ottimizzazioni di V8. Meglio impostare il valore a `null` o `undefined`.
- **Pre-allocazione degli Array**: Se conosci la dimensione di un array, inizializzalo correttamente per evitare continui ridimensionamenti della memoria.
- **Evitare tipi misti**: Mantieni gli elementi di un array dello stesso tipo (es. tutti numeri) per permettere al motore di trattarli come vettori contigui in memoria.

## 3. Tecniche Runtime (User Interface)

Quando si gestiscono eventi frequenti (scroll, resize, digitazione), è fondamentale limitare il numero di esecuzioni delle funzioni per non bloccare il thread principale.

### Debouncing
Esegue la funzione solo **dopo** che è passato un certo tempo dall'ultimo evento ricevuto. Ideale per le barre di ricerca.

### Throttling
Garantisce che la funzione venga eseguita **al massimo una volta** ogni intervallo di tempo prestabilito. Ideale per lo scroll o il resize della finestra.

> [!TIP] Profiling
> Usa il tab **Performance** dei Chrome DevTools per identificare i colli di bottiglia e vedere quali funzioni occupano più tempo CPU o causano frequenti cicli di Garbage Collection.

---
