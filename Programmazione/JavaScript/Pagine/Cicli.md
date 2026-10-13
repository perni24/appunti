---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - basics
  - loops
  - iteration
  - for
  - while
aliases:
  - Loop JS
  - Iterazione JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Strutture Condizionali]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Generators e Iterators]]"
title: Cicli
---

# Cicli

## Sintesi

I cicli permettono di eseguire un blocco di codice piu volte.

In JavaScript si usano sia cicli classici (`for`, `while`) sia forme moderne di iterazione (`for...of`, metodi degli array).

---

## Quando usarlo

Usa un ciclo quando devi ripetere un'operazione su piu valori o finche una condizione resta valida.

Casi comuni:

- iterare array;
- cercare un elemento;
- processare input a blocchi;
- ripetere finche uno stato cambia;
- eseguire operazioni asincrone sequenziali;
- generare dati.

Se stai trasformando o filtrando array, valuta prima `map`, `filter`, `find`, `some`, `every` o `reduce`.

## Come funziona

### for
`for` e utile quando conosci il numero di iterazioni o hai bisogno di un indice.

```js
for (let index = 0; index < 5; index += 1) {
  console.log(index);
}
```

Schema della struttura, non un esempio da eseguire:

```text
for (initialization; condition; update) {
  // corpo del ciclo
}
```

---
### while
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
### do...while
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
### for...of
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

Un oggetto ordinario come `{ name: "Ada" }` non e automaticamente iterabile: usa `Object.entries()` se vuoi percorrerne le proprieta proprie. Con `const` nel `for...of` nasce un nuovo binding a ogni iterazione, quindi il valore puo essere diverso a ogni giro.

---
### for...in
`for...in` itera sulle chiavi stringa enumerabili, comprese quelle ereditate dal prototipo. Non include le chiavi `Symbol`.

```js
const user = {
  name: "Luca",
  role: "admin",
};

for (const key in user) {
  if (Object.hasOwn(user, key)) {
    console.log(key, user[key]);
  }
}
```

Il filtro `Object.hasOwn()` esclude le proprieta ereditate. In alternativa, `Object.entries()` restituisce direttamente le coppie chiave-valore delle sole proprieta proprie, enumerabili e con chiave stringa:

```js
const user = Object.create({ role: "reader" });
user.name = "Ada";

for (const [key, value] of Object.entries(user)) {
  console.log(key, value); // Solo: name Ada
}
```

Per gli array, preferisci `for...of` o i metodi degli array: `for...in` puo includere proprieta aggiuntive e restituisce gli indici come stringhe.

---
### break e continue
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
### Metodi degli array
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
### Iterazione asincrona
Questa sezione richiede [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]. Nei tre frammenti seguenti `items` e `saveItem` sono forniti dall'applicazione; i frammenti con `await` vanno dentro una funzione `async` o al livello principale di un modulo ES.

`forEach()` scarta il risultato della callback e restituisce `undefined`: non attende le Promise e non ne gestisce gli errori. Anche `await items.forEach(...)` non attende i salvataggi.

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

Per avviare insieme un piccolo insieme di operazioni indipendenti:

```js
await Promise.all(items.map(item => saveItem(item)));
```

Qui `map()` avvia i salvataggi; `Promise.all()` ne osserva gli esiti. Un rifiuto fa fallire la Promise complessiva, ma non annulla le operazioni gia avviate. Su grandi insiemi di richieste serve un limite di concorrenza, non un `Promise.all()` illimitato.

### for await...of

Per consumare un iterabile asincrono, usa `for await...of` dentro una funzione `async` o in un modulo ES. Il ciclo attende ogni risultato dell'iteratore:

```js
async function* createItems() {
  yield "first";
  yield "second";
}

async function consumeItems() {
  for await (const item of createItems()) {
    console.log(item);
  }
}

consumeItems().catch(console.error);
```

Non rende automaticamente sequenziali lavori gia avviati: un array di Promise puo contenere operazioni partite prima del ciclo. Per il protocollo completo vedi [[Programmazione/JavaScript/Pagine/Generators e Iterators|Generators e Iterators]].

---

## API / Sintassi

Schemi delle forme principali: `items`, `condition`, `iterable` e `object` sono segnaposto. Nei cicli reali definisci corpo e condizione di uscita prima di eseguirli.

```js
for (let i = 0; i < items.length; i += 1) {}
```

```js
while (condition) {}
```

```js
do {} while (condition);
```

```js
for (const value of iterable) {}
```

```js
for (const key in object) {}
```

Controllo del flusso, da usare dentro il corpo del ciclo, non come script autonomo:

```text
break;
continue;
```

## Esempio pratico

Salvare elementi in sequenza, ricevendo esplicitamente la funzione che effettua il salvataggio:

```js
async function saveAll(items, saveItem) {
  for (const item of items) {
    await saveItem(item);
  }
}
```

Esempio d'uso da eseguire dopo la definizione di `saveAll`; simula il salvataggio in memoria, senza richieste di rete:

```js
async function example() {
  const saved = [];

  await saveAll(["a", "b"], async item => {
    saved.push(item);
  });

  console.log(saved); // ["a", "b"]
}

example().catch(console.error);
```

Ogni operazione deve terminare prima della successiva. Se `saveItem` fallisce, `saveAll` rigetta e gli elementi successivi non vengono elaborati; quelli gia salvati non vengono annullati. Per continuare dopo un errore serve una politica esplicita, con un `try/catch` interno al ciclo e registrazione degli esiti.

## Varianti

- **`for` classico**: controllo completo su indice e condizione.
- **`while`**: ripete finche una condizione resta vera.
- **`do...while`**: esegue almeno una volta.
- **`for...of`**: itera valori di un iterable.
- **`for...in`**: itera chiavi stringa enumerabili, anche ereditate.
- **Metodi array**: forma dichiarativa per trasformazioni e ricerche.
- **`for await...of`**: consuma async iterable.

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

- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Generators e Iterators|Generators e Iterators]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Strutture Condizionali|Strutture Condizionali]]

## Fonti

- [MDN: for...in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in).
- [MDN: for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of).
- [MDN: forEach e callback asincrone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).
- [MDN: Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
- [MDN: for await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
