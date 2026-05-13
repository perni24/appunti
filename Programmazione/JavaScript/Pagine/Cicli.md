---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, basics, loops, iteration, for, while]
aliases: [Loop JS, Iterazione JavaScript]
prerequisites: [Variabili, Strutture Condizionali]
related: [Array Methods, Generators e Iterators]
---

# Cicli

## Sintesi

I cicli permettono di eseguire un blocco di codice piu volte.

In JavaScript si usano sia cicli classici (`for`, `while`) sia forme moderne di iterazione (`for...of`, metodi degli array).

---

## for

`for` e utile quando conosci il numero di iterazioni o hai bisogno di un indice.

```js
for (let index = 0; index < 5; index += 1) {
  console.log(index);
}
```

Struttura:

```js
for (inizializzazione; condizione; aggiornamento) {
  // corpo del ciclo
}
```

---

## while

`while` esegue il blocco finche la condizione resta vera.

```js
let count = 0;

while (count < 3) {
  console.log(count);
  count += 1;
}
```

E utile quando non sai in anticipo quante iterazioni serviranno.

> [!WARNING]
> Assicurati che la condizione possa diventare falsa, altrimenti crei un loop infinito.

---

## do...while

`do...while` esegue il blocco almeno una volta.

```js
let value = 10;

do {
  console.log(value);
  value += 1;
} while (value < 5);
```

La condizione viene controllata alla fine.

---

## for...of

`for...of` itera sui valori di un oggetto iterabile.

```js
const names = ["Luca", "Marco", "Giulia"];

for (const name of names) {
  console.log(name);
}
```

Funziona con:

- array;
- stringhe;
- map;
- set;
- altri iterabili.

---

## for...in

`for...in` itera sulle chiavi enumerabili di un oggetto.

```js
const user = {
  name: "Luca",
  role: "admin",
};

for (const key in user) {
  console.log(key, user[key]);
}
```

Per gli array, preferisci `for...of` o i metodi degli array.

---

## break e continue

`break` interrompe il ciclo.

```js
for (const value of [1, 2, 3, 4]) {
  if (value === 3) {
    break;
  }

  console.log(value);
}
```

`continue` salta l'iterazione corrente.

```js
for (const value of [1, 2, 3, 4]) {
  if (value % 2 === 0) {
    continue;
  }

  console.log(value);
}
```

---

## Metodi degli array

Spesso un metodo degli array rende il codice piu dichiarativo.

```js
const numbers = [1, 2, 3, 4];

const doubled = numbers.map(number => number * 2);
const even = numbers.filter(number => number % 2 === 0);
```

Usa:

- `map()` per trasformare;
- `filter()` per filtrare;
- `find()` per trovare un elemento;
- `some()` per verificare se almeno uno soddisfa una condizione;
- `every()` per verificare se tutti soddisfano una condizione;
- `reduce()` per accumulare un risultato.

---

## Iterazione asincrona

Non usare `forEach()` con `await` aspettandoti esecuzione sequenziale.

```js
// Evita se vuoi attendere ogni operazione
items.forEach(async item => {
  await saveItem(item);
});
```

Per sequenziale:

```js
for (const item of items) {
  await saveItem(item);
}
```

Per concorrente:

```js
await Promise.all(items.map(item => saveItem(item)));
```

---

## Errori comuni

- Creare loop infiniti per mancato aggiornamento della condizione.
- Usare `for...in` sugli array.
- Usare `forEach()` con `await` senza capirne il comportamento.
- Modificare un array mentre lo si itera senza criterio.
- Usare un ciclo imperativo quando un metodo array sarebbe piu chiaro.

---

## Checklist

- Mi serve l'indice o solo il valore?
- Sto iterando un array, un oggetto o un iterabile?
- Il ciclo puo terminare?
- Serve iterazione sequenziale o concorrente?
- Un metodo array renderebbe il codice piu leggibile?

---

## Collegamenti

- [[Array Methods]]
- [[Generators e Iterators]]
- [[Promise avanzate]]
- [[Async Await]]
- [[Strutture Condizionali]]
