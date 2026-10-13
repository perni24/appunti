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
  - variables
aliases:
  - Variabili JS
  - let const var
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Hoisting]]"
title: Variabili
---

# Variabili

## Sintesi

Le variabili permettono di associare un nome a un valore.

In JavaScript si dichiarano principalmente con `const` e `let`. `var` esiste ancora per compatibilita con codice vecchio, ma nella maggior parte del codice moderno va evitato.

La scelta tra `const`, `let` e `var` influenza scope, riassegnazione e comportamento con l'hoisting.

---

## Quando usarlo

- Usa `const` quando il binding non deve essere riassegnato.
- Usa `let` quando devi riassegnare il binding; modificare una proprieta di un oggetto non richiede `let`.
- Evita `var` nel codice nuovo.
- Usa nomi descrittivi per rendere chiaro cosa contiene una variabile.

---

## Come funziona

### Tipizzazione dinamica
JavaScript e un linguaggio a tipizzazione dinamica: il tipo appartiene al valore, non alla variabile.

```js
let output = 42;
output = "Ciao";
output = true;
```

La stessa variabile puo contenere valori di tipo diverso, anche se abusare di questa possibilita rende il codice meno leggibile.

---
### const
`const` crea un binding non riassegnabile.

Una normale dichiarazione `const` richiede subito un inizializzatore: `const total;` e un errore di sintassi. In `for (const item of items)`, invece, e il ciclo a inizializzare un nuovo binding a ogni iterazione.

```js
const name = "Luca";

// name = "Marco"; // TypeError
```

`const` non rende immutabile il valore interno di un oggetto.

```js
const user = {
  name: "Luca",
};

user.name = "Marco"; // Valido

// user = {}; // TypeError
```

> [!INFO]
> `const` blocca la riassegnazione della variabile, non la mutazione dell'oggetto referenziato.

---
### let
`let` crea una variabile riassegnabile con scope di blocco.

```js
let counter = 0;

counter += 1;
counter += 1;

console.log(counter); // 2
```

E utile per contatori, accumulatori, variabili aggiornate in un algoritmo o stato temporaneo.

---
### var
Dentro una funzione, `var` ha scope di funzione, non del normale blocco `if` o `for` che lo contiene.

```js
function example() {
  if (true) {
    var value = 10;
  }

  console.log(value); // 10
}
```

Con `let` o `const`, lo stesso codice non funzionerebbe perche la variabile resterebbe confinata nel blocco `if`.

```js
function example() {
  if (true) {
    let value = 10;
  }

  // console.log(value); // ReferenceError
}
```

---
### Scope
Lo scope definisce dove una variabile e visibile.

Al livello superiore di uno script classico del browser, `var` crea normalmente una proprieta dell'oggetto globale; `let` e `const` non creano proprieta di `globalThis`. In un modulo ES le dichiarazioni al livello superiore restano nel modulo. Anche Node.js CommonJS avvolge ogni file in una funzione: non dedurre lo scope globale dal solo fatto che una dichiarazione sia fuori da una funzione scritta da te.

```js
const globalValue = "globale";

function run() {
  const localValue = "locale";

  console.log(globalValue);
  console.log(localValue);
}

run();

// console.log(localValue); // ReferenceError
```

`let` e `const` sono block-scoped.

```js
if (true) {
  const message = "Dentro il blocco";
}

// console.log(message); // ReferenceError
```

---
### Hoisting e Temporal Dead Zone
Le dichiarazioni vengono gestite durante la fase di creazione dello scope.

Con `var`, la variabile viene inizializzata a `undefined`.

```js
console.log(count); // undefined
var count = 1;
```

Con `let` e `const`, il binding esiste nello scope ma non puo essere letto finche la sua inizializzazione non e terminata. Questo intervallo si chiama **Temporal Dead Zone** (TDZ): dipende dall'ordine di esecuzione, non solo dalla posizione delle righe.

```js
// console.log(count); // ReferenceError
let count = 1;
```

La TDZ vale anche durante l'inizializzatore: `let count = count + 1` legge il nuovo `count` prima che sia inizializzato, quindi genera `ReferenceError`. Anche `typeof count` genera errore se quel binding e nella TDZ. Gli esempi con nomi ripetuti in questa nota sono indipendenti: non vanno concatenati nello stesso scope.

---
### Tabella comparativa
| Keyword | Scope | Riassegnabile | Riedichiarabile | Uso consigliato |
| --- | --- | --- | --- | --- |
| `const` | Blocco | No | No | Default nel codice moderno |
| `let` | Blocco | Si | No | Valori che cambiano |
| `var` | Funzione; contesto globale/modulo al top level | Si | Si, salvo conflitti con dichiarazioni lessicali | Soprattutto codice legacy |

---

## API / Sintassi

Sintassi principali:

```js
const name = "Luca";
let count = 0;
var legacy = true;
```

Riassegnazione:

```js
let count = 0;
count += 1;
```

Mutazione di oggetto con `const`:

```js
const user = { name: "Luca" };
user.name = "Marco";
```

`const` impedisce la riassegnazione del binding, non la mutazione del valore referenziato.

## Esempio pratico

Uso pratico di `const` e `let`:

```js
const users = [
  { name: "Ada", active: true },
  { name: "Linus", active: false },
  { name: "Grace", active: true },
];
let activeCount = 0;

for (const user of users) {
  if (user.active) {
    activeCount += 1;
  }
}

console.log(activeCount); // 2
```

`users` non viene riassegnato, quindi e `const`. `activeCount` cambia durante il ciclo, quindi e `let`.

Anche `user` puo essere `const`: ogni iterazione ha un nuovo binding. Lo snippet usa dati locali ed e eseguibile come script, senza API esterne o `await` al livello superiore.

## Varianti

- **`const`**: binding non riassegnabile.
- **`let`**: binding riassegnabile con scope di blocco.
- **`var`**: scope di funzione e comportamento legacy.
- **Globale**: da evitare salvo casi espliciti.
- **Locale**: preferibile, nello scope piu piccolo possibile.
- **Binding vs valore**: la variabile punta a un valore, ma l'oggetto puo restare mutabile.

## Errori comuni

- Usare `var` in codice nuovo senza motivo.
- Pensare che `const` renda immutabili gli oggetti.
- Dichiarare variabili troppo lontano dal punto in cui vengono usate.
- Usare nomi generici come `data`, `value`, `temp` senza contesto.
- Riassegnare la stessa variabile a tipi diversi senza necessita.

---

## Checklist

- La variabile puo essere `const`?
- Il nome descrive chiaramente il valore?
- La variabile e dichiarata nello scope piu piccolo possibile?
- Sto evitando `var`?
- Sto distinguendo riassegnazione e mutazione?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Hoisting|Hoisting]]
- [[Programmazione/JavaScript/Pagine/Strict Mode|Strict Mode]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]

## Fonti

- [MDN - let e Temporal Dead Zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [MDN - const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [MDN - var e scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
