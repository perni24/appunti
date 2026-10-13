---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - functional-programming
  - pure-functions
  - immutability
aliases:
  - FP JavaScript
  - Programmazione Funzionale JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Array Methods]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
  - "[[Programmazione/JavaScript/Pagine/Design Patterns]]"
  - "[[Programmazione/JavaScript/Pagine/Testing]]"
title: Functional Programming
---

# Functional Programming

## Sintesi

La programmazione funzionale organizza il codice attorno a funzioni, trasformazioni di dati, immutabilita e riduzione degli effetti collaterali.

JavaScript e multi-paradigma e supporta bene lo stile funzionale.

Lo stile non dipende dalla presenza di arrow function o catene di metodi: conta che input, dipendenze ed effetti siano espliciti. Una funzione puo usare un ciclo e variabili locali ed essere comunque pura.

---

## Quando usarlo

Usa lo stile funzionale quando vuoi rendere trasformazioni dati, regole di dominio e logica pura piu prevedibili e testabili.

E utile per:

- trasformare array e collezioni;
- validare dati;
- calcolare valori derivati;
- isolare side effect;
- comporre funzioni piccole;
- ridurre mutazioni implicite.

Non serve essere dogmatici: in JavaScript spesso il risultato migliore combina funzioni pure, moduli, oggetti e side effect ben confinati.

## Come funziona

### Funzioni pure
Una funzione pura:

- produce un risultato determinato dai valori in input, senza leggere stato esterno variabile;
- non modifica input o stato condiviso;
- non produce effetti osservabili come I/O, scritture sul DOM o log.

Esempio per due numeri primitivi: non e un validatore numerico generale. Con stringhe l'operatore + concatena; con oggetti la conversione puo eseguire codice definito dall'oggetto.

```js
function add(a, b) {
  return a + b;
}
```

Funzione impura:

```js
let total = 0;

function addToTotal(value) {
  total += value;
  return total;
}
```

Le funzioni pure sono piu facili da testare.

"Stesso risultato" non significa necessariamente stessa identita di oggetto: una trasformazione puo restituire ogni volta un nuovo array con gli stessi valori. La purezza presuppone il dominio dichiarato: oggetti con getter, Proxy o metodi personalizzati possono introdurre effetti durante la lettura.

---
### Immutabilita
Invece di modificare dati esistenti, si creano nuove versioni.

```js
const user = { name: "Luca", age: 30 };

const updatedUser = {
  ...user,
  age: 31,
};
```

Questo riduce effetti collaterali e rende i cambiamenti piu prevedibili.

`const` impedisce la riassegnazione del binding, non la mutazione dell'oggetto. Lo spread fa una copia superficiale: per aggiornare un oggetto annidato devi ricreare ogni livello modificato. Anche `Object.freeze()` e superficiale; non e richiesto per ogni funzione pura.

Esempio con dati ordinari, senza getter o Proxy:

```js
function moveUser(user, city) {
  return { ...user, address: { ...user.address, city } };
}

const resident = { name: "Luca", address: { city: "Roma" } };
const moved = moveUser(resident, "Milano");
console.log(resident.address.city); // "Roma"
console.log(moved.address === resident.address); // false
```

Le proprieta annidate non ricreate restano condivise. Immutabilita significa non modificarle tramite nessuno dei riferimenti, non clonare tutto indiscriminatamente.

---
### Higher-order functions
Una higher-order function riceve o restituisce funzioni.

La funzione seguente cattura un taxRate numerico, per esempio 0.22; price e un numero. E una dimostrazione di composizione, non di arrotondamento fiscale o monetario.

```js
function withTax(taxRate) {
  return (price) => price * (1 + taxRate);
}

const addVat = withTax(0.22);

console.log(addVat(100)); // 122
```

Metodi come `map`, `filter` e `reduce` sono esempi pratici.

Una higher-order function non e automaticamente pura: dipende anche dalle callback e dalle dipendenze catturate.

---
### Map, filter, reduce
```js
const numbers = [1, 2, 3, 4];

const doubled = numbers.map((n) => n * 2);
const even = numbers.filter((n) => n % 2 === 0);
const total = numbers.reduce((sum, n) => sum + n, 0);
```

Questi metodi descrivono cosa vuoi ottenere, non ogni passo imperativo.

`map` e `filter` creano nuovi array, ma non clonano gli oggetti contenuti e non impediscono alle callback di mutarli. Il valore iniziale di reduce rende definito anche il caso vuoto; senza di esso un array senza elementi visitabili causa TypeError.

Controesempio: nuovo contenitore, stesso oggetto modificato.

```js
const records = [{ score: 1 }];
const changed = records.map((record) => {
  record.score += 1;
  return record;
});
console.log(records[0].score); // 2
console.log(changed[0] === records[0]); // true
```

Le callback sono sincrone: map con una funzione async restituisce un array di Promise; filter con una funzione async valuta quelle Promise come truthy, non aspetta il booleano. Usa una fase asincrona esplicita quando serve.

---
### Composizione
La composizione combina funzioni piccole.

```js
const trim = (value) => value.trim();
const lower = (value) => value.toLowerCase();

const normalize = (value) => lower(trim(value));
```

Funzioni piccole e pure sono piu semplici da riusare.

Per una pipeline piu lunga puoi definire un helper locale. Non e una API nativa chiamata pipe:

```js
function pipe(...steps) {
  if (steps.some((step) => typeof step !== "function")) {
    throw new TypeError("Ogni passaggio deve essere una funzione");
  }
  return (input) => {
    let value = input;
    for (const step of steps) value = step(value);
    return value;
  };
}

const normalizeLabel = pipe(
  (value) => value.trim(),
  (value) => value.toLowerCase(),
);
console.log(normalizeLabel("  Ciao  ")); // "ciao"
```

Contratto: funzioni sincrone con un argomento, senza dipendenza da this; l'output di ogni passo deve essere un input valido per il successivo. L'esempio accetta stringhe. Con zero passi restituisce l'input; al primo errore si interrompe e propaga l'errore. Non attende Promise: per quelle usa await o then. `compose` indica solitamente l'ordine opposto, da destra a sinistra, ma il contratto della libreria va letto.

---
### Currying
Il currying trasforma una funzione con piu argomenti in una sequenza di funzioni.

```js
const multiply = (a) => (b) => a * b;

const double = multiply(2);

console.log(double(5)); // 10
```

Utile quando vuoi specializzare funzioni.

Non e la stessa operazione della **partial application**: il currying cambia la forma da f(a, b) a f(a)(b); l'applicazione parziale fissa alcuni argomenti e produce una funzione degli argomenti rimanenti.

```js
const multiplyPair = (a, b) => a * b;
const triple = (value) => multiplyPair(3, value);
console.log(triple(5)); // 15
```

Qui triple e un'applicazione parziale di multiplyPair senza convertirla prima in forma curried. Entrambi gli esempi assumono numeri.

---
### Side effect
Side effect comuni:

- modificare variabili esterne;
- mutare oggetti ricevuti;
- scrivere su DOM;
- chiamare API;
- loggare.

Non tutti i side effect sono sbagliati. Devono pero essere isolati e controllati.

Leggere Date.now(), Math.random() o una configurazione mutabile rende il risultato dipendente dall'ambiente, anche senza una scrittura visibile: non confondere determinismo e assenza di scritture. Passa il tempo o la configurazione come valore per rendere esplicita la dipendenza.

```js
function isExpired(expiresAtMs, nowMs) {
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) {
    throw new TypeError("Servono timestamp numerici finiti");
  }
  return nowMs >= expiresAtMs;
}

console.log(isExpired(2000, 1500)); // false
```

La funzione e pura; il codice esterno che legge Date.now() e chiama isExpired non lo e. Iniettare una funzione clock facilita i test, ma non rende automaticamente pura una funzione che la chiama: il clock puo cambiare risultato.

---

## API / Sintassi

Schemi di riferimento: array, fn e initialValue sono parametri da fornire, non variabili gia definite.

```text
array.map(fn);
array.filter(fn);
array.reduce(fn, initialValue);
```

Higher-order function:

```js
function withPrefix(prefix) {
  return (value) => `${prefix}${value}`;
}
```

Composizione semplice:

```js
const normalize = (value) => value.trim().toLowerCase();
```

Copia immutabile:

```text
const nextUser = { ...user, active: true };
const nextItems = items.filter((item) => item.id !== removedId);
```

## Esempio pratico

Trasformare un array denso di record ordinari con name stringa e active booleano. I dati esterni devono essere decodificati prima; non sono supportati getter, Proxy o prototipi alterati. La funzione rifiuta uno schema invalido, anche per gli utenti inattivi:

```js
function getActiveUserNames(users) {
  if (!Array.isArray(users)) throw new TypeError("Serve un array di utenti");
  for (let index = 0; index < users.length; index += 1) {
    if (!Object.hasOwn(users, index)) throw new TypeError("Array sparso non ammesso");
    const user = users[index];
    if (user === null || typeof user !== "object" || Array.isArray(user) ||
        typeof user.name !== "string" || typeof user.active !== "boolean") {
      throw new TypeError("Utente non valido");
    }
  }
  return users
    .filter((user) => user.active === true)
    .map((user) => user.name.trim())
    .filter((name) => name !== "")
    .sort();
}
```

Qui sort muta solo il nuovo array di stringhe creato dalla pipeline, non users. La mutazione locale di dati non ancora condivisi e compatibile con una funzione pura. Non spostare sort direttamente su users.

```js
const users = [
  { name: " Sara ", active: true },
  { name: "Luca", active: false },
  { name: "Anna", active: true },
  { name: "   ", active: true },
];
console.log(getActiveUserNames(users)); // ["Anna", "Sara"]
console.log(users[0].name); // " Sara "
```

Il caso vuoto restituisce []; i duplicati restano. sort senza comparatore ordina per unita UTF-16, non secondo l'alfabeto italiano: per un elenco destinato alla UI scegli locale e opzioni di Intl.Collator esplicitamente, senza aspettarti un ordine linguistico identico in ogni versione dei dati Unicode.

### Functional core, imperative shell

getActiveUserNames e il **core**: calcola i nomi. La **shell** ottiene dati e mostra il risultato. Esempio browser con un elemento ul id="active-users" gia presente e users dell'esempio precedente:

```js
function renderActiveUserNames(list, names) {
  const document = list.ownerDocument;
  const fragment = document.createDocumentFragment();
  for (const name of names) {
    const item = document.createElement("li");
    item.textContent = name;
    fragment.append(item);
  }
  list.replaceChildren(fragment);
}

const list = document.querySelector("#active-users");
if (!list) throw new Error("Lista utenti non trovata");
renderActiveUserNames(list, getActiveUserNames(users));
```

La shell modifica il DOM ed e intenzionalmente impura. textContent evita di interpretare i nomi come HTML. Se aggiungi Fetch, gestisci HTTP, schema, annullamento e stato della UI nella shell, senza nasconderli nella trasformazione.

## Varianti

- **Funzioni pure**: nessun side effect osservabile.
- **Immutabilita**: crea nuove versioni dei dati.
- **Higher-order functions**: funzioni che ricevono o restituiscono funzioni.
- **Composizione**: combina funzioni piccole.
- **Currying/partial application**: specializza funzioni.
- **Functional core, imperative shell**: logica pura al centro, side effect ai bordi.

## Errori comuni

- Usare FP in modo dogmatico.
- Creare catene `map/filter/reduce` poco leggibili.
- Copiare strutture grandi senza considerare performance.
- Nascondere side effect in funzioni apparentemente pure.
- Usare `reduce` dove un ciclo sarebbe piu chiaro.
- Confondere nuovo array e copia profonda, oppure currying e applicazione parziale.
- Usare callback async con filter o aspettarsi che pipe gestisca automaticamente le Promise.
- Definire pura una funzione solo perche non contiene assegnazioni: puo leggere stato globale o invocare callback impure.

---

## Checklist

### Checklist operativa
- Preferisci funzioni pure per logica di dominio.
- Isola side effect ai bordi del sistema.
- Evita mutazioni implicite.
- Usa `map`, `filter`, `reduce` quando migliorano chiarezza.
- Testa funzioni pure con input/output espliciti.
- Verifica input vuoti, schema invalido e conservazione degli oggetti originali.
- Dichiara ordine, locale e limiti della pipeline; misura prima di ottimizzare catene e copie.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Design Patterns|Design Patterns]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]

## Fonti

- [Mozilla Hacks - From Map/Reduce to JavaScript Functional Programming](https://hacks.mozilla.org/2015/01/from-mapreduce-to-javascript-functional-programming/)
- [MDN - Functions e closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN - Array.prototype.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [MDN - Array.prototype.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
- [MDN - Array.prototype.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- [MDN - Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [MDN - Function.prototype.bind e applicazione parziale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
