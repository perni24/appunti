---
date: 2026-02-24
tags: [javascript, programming, functional-programming, clean-code]
type: #permanent-note
status: budding
---

# Functional Programming in JavaScript

La **Programmazione Funzionale (FP)** è un paradigma di programmazione che tratta il computo come la valutazione di funzioni matematiche ed evita stati mutabili e dati che cambiano nel tempo. JavaScript è un linguaggio **multi-paradigma** che supporta eccellentemente la FP.

## 1. Funzioni Pure (Pure Functions)

Una funzione è "pura" se:
1.  **Deterministica**: Restituisce sempre lo stesso output per lo stesso input.
2.  **Senza Effetti Collaterali (Side Effects)**: Non modifica nulla al di fuori del suo scope (es. variabili globali, file system, console).

```javascript
// Impura (dipende dallo stato esterno e lo modifica)
let totale = 0;
function aggiungiImpura(valore) {
    totale += valore;
    return totale;
}

// Pura (dipende solo dagli argomenti)
function aggiungiPura(a, b) {
    return a + b;
}
```

## 2. Immutabilità

In FP, i dati non vengono modificati. Se devi cambiare un oggetto o un array, ne crei una nuova copia con le modifiche.

```javascript
const utente = { nome: "Luca", eta: 25 };

// Invece di utente.eta = 26;
const utenteAggiornato = { ...utente, eta: 26 };
```

## 3. Higher-Order Functions (HOF)

Sono funzioni che accettano altre funzioni come argomenti o restituiscono una funzione.
Esempi comuni in JS: `map()`, `filter()`, `reduce()`.

```javascript
const numeri = [1, 2, 3, 4];
const raddoppiati = numeri.map(n => n * 2);
const pari = numeri.filter(n => n % 2 === 0);
```

## 4. Composizione e Currying

### Composizione
L'atto di combinare più funzioni semplici per crearne una complessa. L'output di una funzione diventa l'input della successiva.

### Currying
Tecnica di trasformazione di una funzione che accetta più argomenti in una serie di funzioni che accettano un singolo argomento alla volta.

```javascript
// Funzione normale
const somma = (a, b) => a + b;

// Curried
const sommaCurried = a => b => a + b;
const aggiungiCinque = sommaCurried(5);
console.log(aggiungiCinque(3)); // 8
```

## 5. Dichiarativo vs Imperativo

- **Imperativo**: "Come" fare le cose (cicli `for`, istruzioni passo-passo).
- **Dichiarativo**: "Cosa" vuoi ottenere (uso di `map`, `filter`, astrazioni).

> [!TIP] Perché la FP?
> Il codice funzionale tende ad essere più facile da testare (grazie alle funzioni pure), più prevedibile e più facile da debuggare poiché non si verificano cambiamenti di stato inaspettati.

---
