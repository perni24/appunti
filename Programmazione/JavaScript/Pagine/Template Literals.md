---
date: 2026-02-17
tags: [javascript, es6, template-literals, stringhe, interpolazione]
type: #permanent-note
status: budding
---

# Template Literals

I **Template Literals** (o Template Strings), introdotti in **ES6**, sono un modo più flessibile e potente di lavorare con le stringhe in JavaScript rispetto alle classiche virgolette singole (`'`) o doppie (`"`).

Si definiscono utilizzando il carattere **backtick** (`` ` ``).

## Caratteristiche Principali

### 1. Interpolazione di Espressioni
La funzionalità più utile è la possibilità di inserire variabili o espressioni direttamente all'interno della stringa utilizzando la sintassi `${espressione}`.

```javascript
const name = "Luca";
const age = 30;

// Old way
console.log("Ciao, mi chiamo " + name + " e ho " + age + " anni.");

// Template Literals
console.log(`Ciao, mi chiamo ${name} e ho ${age} anni.`); // Expression interpolation
```

È possibile inserire qualsiasi espressione JavaScript valida:
```javascript
const a = 5;
const b = 10;
console.log(`La somma è: ${a + b}`); // Simple addition
```

### 2. Stringhe Multilinea
Con i template literals non è più necessario utilizzare caratteri di escape come `\n` per andare a capo. La stringa mantiene la formattazione esatta inserita nel codice.

```javascript
const multiline = `Questa è una stringa
che si estende su più righe
senza bisogno di caratteri speciali.`; // Multi-line string
```

> [!TIP] Utilità nel DOM
> Questa caratteristica è estremamente utile quando si deve generare del frammento di tramite JavaScript.

### 3. Tagged Templates
È una forma avanzata di template literals che permette di processare la stringa tramite una funzione (detta "tag").

```javascript
function highlight(strings, ...values) {
  // Logic to process the parts of the string
  return strings.reduce((acc, str, i) => `${acc}${str}<b>${values[i] || ""}</b>`, "");
}

const user = "Bellini";
const message = highlight`Benvenuto, ${user}!`; // Tagged template usage
```

## Perché utilizzarli

- **Leggibilità**: Il codice risulta molto più pulito eliminando la concatenazione con il simbolo `+`.
- **Manutenibilità**: È più facile individuare la struttura finale della stringa.
- **Potenza**: L'interpolazione permette di integrare logica complessa direttamente nel testo.