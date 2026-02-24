---
date: 2026-02-24
tags: [javascript, programming, generators, iterators, symbols]
type: #permanent-note
status: budding
---

# Generators e Iterators in JavaScript

I protocolli di iterazione (introdotti in ES6) permettono agli oggetti di definire o personalizzare il proprio comportamento di iterazione, come avviene nei cicli `for...of`.

## 1. Iterators (Il Protocollo)

Un oggetto è un **Iterator** se implementa un metodo `next()` che restituisce un oggetto con due proprietà:
1.  `value`: Il valore successivo nella sequenza.
2.  `done`: Un booleano che è `true` se l'iterazione è terminata.

```javascript
/* Esempio di iteratore manuale */
const mioIteratore = {
    contatore: 0,
    next() {
        if (this.contatore < 3) {
            return { value: this.contatore++, done: false };
        }
        return { value: undefined, done: true };
    }
};

console.log(mioIteratore.next()); // { value: 0, done: false }
```

## 2. Iterables

Un oggetto è **Iterable** se implementa il metodo `[Symbol.iterator]`, che deve restituire un iteratore. Molti oggetti integrati lo sono già (Array, Map, Set, String).

```javascript
// Rendere un oggetto iterabile
const collezioneVoti = {
    voti: [10, 8, 9],
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                return index < this.voti.length 
                    ? { value: this.voti[index++], done: false }
                    : { done: true };
            }
        };
    }
};

for (const voto of collezioneVoti) {
    console.log(voto); // 10, 8, 9
}
```

## 3. Generators

I **Generators** sono funzioni speciali che possono essere messe in pausa e riprese, mantenendo il proprio stato (scope). Sono un modo molto più semplice per creare iteratori.

### Sintassi
- Si definiscono con `function*`.
- Usano la keyword `yield` per "emettere" un valore e sospendere l'esecuzione.

```javascript
function* generaNumeri() {
    yield 1;
    yield 2;
    yield 3;
}

const gen = generaNumeri(); // Restituisce un oggetto generatore (che è un iteratore)
console.log(gen.next().value); // 1
```

### Vantaggi dei Generators
- **Lazy Evaluation**: I valori vengono calcolati solo quando richiesti.
- **Memoria efficiente**: Ideali per sequenze infinite o set di dati massivi.

```javascript
// Generatore infinito di ID
function* idCreator() {
    let id = 1;
    while(true) {
        yield id++;
    }
}

const ids = idCreator();
console.log(ids.next().value); // 1
console.log(ids.next().value); // 2
```

> [!NOTE] Comunicazione bidirezionale
> `yield` non solo emette valori, ma può anche riceverne. Se passi un valore a `next(valore)`, quel valore diventa il risultato dell'espressione `yield` all'interno del generatore.

---
