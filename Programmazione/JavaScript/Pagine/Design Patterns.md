---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, design-patterns, architecture, oop]
aliases: [Pattern JavaScript, Design Pattern JS]
prerequisites: [Funzioni, Classi, Moduli]
related: [Functional Programming, Classi, Moduli, Testing]
---

# Design Patterns

## Sintesi

I design pattern sono soluzioni ricorrenti a problemi di progettazione.

Non sono codice da copiare meccanicamente: sono modelli mentali per organizzare responsabilita, dipendenze e creazione degli oggetti.

---

## Factory

Una factory centralizza la creazione di oggetti.

```js
function createTransport(type) {
  if (type === "car") {
    return { type: "car", wheels: 4 };
  }

  if (type === "bike") {
    return { type: "bike", wheels: 2 };
  }

  throw new Error("Tipo non supportato");
}
```

Utile quando la creazione dipende da configurazione o input.

---

## Singleton

Un singleton espone una sola istanza condivisa.

```js
export const config = {
  apiUrl: "https://api.example.com",
};
```

Nei moduli ES, spesso un semplice export e sufficiente.

Usalo con cautela: stato globale condiviso puo rendere test e dipendenze piu difficili.

---

## Module pattern

Prima degli ES modules si usavano closure per esporre API pubblica e nascondere dettagli.

```js
const counter = (() => {
  let value = 0;

  return {
    increment() {
      value += 1;
    },
    getValue() {
      return value;
    },
  };
})();
```

Oggi gli ES modules coprono molti casi in modo nativo.

---

## Observer

Observer notifica piu subscriber quando avviene un evento.

```js
class Subject {
  #listeners = new Set();

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  notify(value) {
    for (const listener of this.#listeners) {
      listener(value);
    }
  }
}
```

E alla base di eventi, reactive state e pub/sub.

---

## Strategy

Strategy permette di cambiare algoritmo senza cambiare il chiamante.

```js
const strategies = {
  percent: (price, value) => price - price * value,
  fixed: (price, value) => price - value,
};

function applyDiscount(price, type, value) {
  return strategies[type](price, value);
}
```

Utile per regole intercambiabili.

---

## Decorator

Decorator aggiunge comportamento a una funzione o oggetto.

```js
function withLogging(fn) {
  return (...args) => {
    console.log("args", args);
    return fn(...args);
  };
}
```

In JavaScript molte decorazioni si fanno con higher-order functions.

---

## Errori comuni

- Applicare pattern solo per rendere il codice "piu architetturale".
- Usare singleton per stato che dovrebbe essere esplicito.
- Creare astrazioni prima di avere duplicazione reale.
- Confondere pattern con framework.
- Rendere difficile il debug con troppi layer.

---

## Checklist operativa

- Parti dal problema, non dal pattern.
- Preferisci soluzioni semplici finche bastano.
- Usa factory per creazione condizionale.
- Usa observer per notifiche multiple.
- Usa strategy per algoritmi intercambiabili.
- Verifica che il pattern migliori testabilita e manutenzione.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
