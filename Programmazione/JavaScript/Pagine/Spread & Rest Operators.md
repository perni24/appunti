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
  - es6
  - spread
  - rest
  - arrays
  - objects
aliases:
  - Spread operator
  - Rest operator
  - Tre puntini JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Destructuring]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
title: Spread & Rest Operators
---

# Spread & Rest Operators

## Sintesi

La sintassi `...` ha due significati diversi in base al contesto:

- **spread**: espande valori;
- **rest**: raccoglie valori.

La stessa sintassi produce quindi effetti opposti.

---

## Quando usarlo

Usa spread quando vuoi espandere array, oggetti o argomenti.

Usa rest quando vuoi raccogliere valori rimanenti in array o oggetti.

Casi comuni:

- copiare array o oggetti in modo superficiale;
- combinare array;
- aggiornare oggetti senza mutare l'originale;
- passare array come argomenti;
- raccogliere parametri variabili;
- separare proprieta sensibili dal resto di un oggetto.

## Come funziona

### Spread negli array
Lo spread espande un array nei suoi elementi.

```js
const numbers = [1, 2, 3];
const copy = [...numbers];

console.log(copy); // [1, 2, 3]
```

Puo essere usato per combinare array.

```js
const a = [1, 2];
const b = [3, 4];

const result = [...a, ...b];

console.log(result); // [1, 2, 3, 4]
```

---
### Spread nelle chiamate di funzione
```js
const numbers = [4, 8, 2];

console.log(Math.max(...numbers)); // 8
```

Senza spread, `Math.max()` riceverebbe un array come singolo argomento.

Array spread e argument spread richiedono un iterabile. Evita `Math.max(...hugeArray)` per collezioni enormi: il motore impone un limite al numero di argomenti; usa un ciclo o una riduzione.

---
### Spread negli oggetti
Lo spread copia le proprieta proprie enumerabili, anche con chiavi `Symbol`. Non copia il prototipo o i descriptor originali: eventuali getter vengono letti e il risultato diventa una normale proprieta dati.

```js
const user = {
  name: "Luca",
  role: "reader",
};

const admin = {
  ...user,
  role: "admin",
};
```

Se due proprieta hanno lo stesso nome, vince quella piu a destra.

```js
const result = {
  a: 1,
  a: 2,
};

console.log(result.a); // 2
```

Questo vale anche quando una proprieta successiva e `undefined`: un merge non applica automaticamente i default.

```js
const defaults = { limit: 10 };
const options = { limit: undefined };
console.log({ ...defaults, ...options }); // { limit: undefined }
```

Lo spread oggetto, diversamente da quello array, non richiede un iterabile:

```js
const plain = { count: 2 };
const copy = { ...plain };
const empty = { ...null, ...undefined }; // {}, nessuna proprieta da copiare
// [...plain]; // TypeError: plain non e iterabile
```

---
### Copia superficiale
Spread crea una copia superficiale.

```js
const original = {
  user: {
    name: "Luca",
  },
};

const copy = {
  ...original,
};

copy.user.name = "Marco";

console.log(original.user.name); // "Marco"
```

Gli oggetti annidati restano condivisi.

Per copie profonde di dati supportati, valuta `structuredClone()`. Gestisce anche riferimenti circolari, ma non e un clone universale: funzioni e nodi DOM non sono clonabili e i prototipi di classi personalizzate non vengono preservati. Vedi [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e copia degli oggetti]].

---
### Rest nei parametri
Rest raccoglie piu argomenti in un array.

```js
function sum(...numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

console.log(sum(1, 2, 3)); // 6
```

Il rest parameter deve essere l'ultimo.

```js
function log(prefix, ...messages) {
  console.log(prefix, messages);
}
```

---
### Rest nel destructuring
Negli array:

```js
const [first, ...others] = [1, 2, 3, 4];

console.log(first);  // 1
console.log(others); // [2, 3, 4]
```

Negli oggetti:

```js
const { password, ...withoutPassword } = {
  name: "Luca",
  password: "secret",
  role: "admin",
};

console.log(withoutPassword); // { name: "Luca", role: "admin" }
```

Object rest raccoglie le altre proprieta proprie enumerabili e mantiene condivisi gli oggetti annidati. Escludere `password` non rende automaticamente pubblici o sicuri tutti gli altri campi.

---
### Differenza tra spread e rest
| Uso | Significato | Esempio |
| --- | --- | --- |
| Spread | Espande valori | `[...items]` |
| Rest | Raccoglie valori | `function fn(...args)` |

Regola pratica:

- a destra di una assegnazione o in una chiamata tende a essere spread;
- in parametri o destructuring tende a essere rest.

---

## API / Sintassi

Spread:

```js
const copy = [...items];
const merged = [...a, ...b];
const nextUser = { ...user, active: true };
fn(...args);
```

Rest:

```js
function fn(first, ...others) {}

const [head, ...tail] = items;
const { password, ...withoutPassword } = user;
```

Regola: `...` in una posizione che produce valori e spread; `...` in una posizione che dichiara o destruttura valori e rest.

## Esempio pratico

Aggiornare stato senza mutazione:

```js
function updateUserRole(user, role) {
  return {
    ...user,
    role,
    updatedAt: new Date().toISOString(),
  };
}
```

Rimuovere un campo specifico, senza promettere che il resto sia pubblicabile:

```js
function omitPasswordHash(user) {
  const { passwordHash, ...remaining } = user;
  return remaining;
}
```

Per una risposta pubblica, preferisci un elenco esplicito di campi ammessi. Qui `user` e gia validato e `id` e `name` sono valori scalari pubblicabili:

```js
function toPublicUser(user) {
  return { id: user.id, name: user.name };
}
```

Cosi un futuro `apiKey` o `resetToken` non viene incluso per errore. La scelta dei campi e la verifica dei permessi restano responsabilita dell'applicazione. Analogamente, `updateUserRole()` costruisce soltanto un oggetto: non autorizza il cambio di ruolo e non effettua una copia profonda.

## Varianti

- **Spread array**: copia o concatena elementi.
- **Spread oggetto**: copia proprieta enumerabili.
- **Spread argomenti**: passa elementi come argomenti.
- **Rest parameter**: raccoglie argomenti variabili.
- **Rest destructuring array**: raccoglie elementi rimanenti.
- **Rest destructuring oggetto**: raccoglie proprieta rimanenti.

## Errori comuni

- Pensare che spread faccia una copia profonda.
- Usare rest non come ultimo parametro.
- Confondere spread e rest perche usano entrambi `...`.
- Sovrascrivere proprieta oggetto senza accorgersene.
- Copiare oggetti con metodi, prototipi o descriptor pensando di preservare tutto.

---

## Checklist

- Sto espandendo o raccogliendo?
- La copia superficiale e sufficiente?
- L'ordine delle proprieta nello spread oggetto e corretto?
- Il rest parameter e ultimo?
- Per oggetti complessi serve `structuredClone()` o una logica dedicata?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Destructuring|Destructuring]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]


## Fonti

- [MDN - Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN - structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [MDN - Structured clone algorithm e limiti](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
