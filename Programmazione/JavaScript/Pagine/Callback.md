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
  - callback
  - async
  - functions
aliases:
  - Callback JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Callback
---

# Callback

## Sintesi

Una callback e una funzione passata come argomento a un'altra funzione, che la esegue in un momento successivo o durante la propria esecuzione.

Le callback sono possibili perche in JavaScript le funzioni sono valori: possono essere assegnate, passate e restituite.

"Callback" descrive un ruolo, non un tempo di esecuzione. La funzione che la riceve decide quando chiamarla, con quali argomenti, quante volte e come usarne il risultato. Una funzione dichiarata `async` non cambia automaticamente il contratto dell'API che la chiama.

---

## Quando usarlo

Usa callback quando vuoi passare comportamento a una funzione o reagire a un evento.

Casi comuni:

- iterazione su array;
- event listener;
- timer;
- API Node.js storiche;
- funzioni configurabili;
- hook semplici.

Per flussi asincroni con piu passaggi, Promise e `async/await` sono spesso piu leggibili.

## Come funziona

### Callback sincrone
Una callback sincrona viene eseguita durante la chiamata alla funzione che la usa, prima che questa restituisca il controllo. Non significa necessariamente che venga chiamata come prima istruzione.

```js
const numbers = [1, 2, 3];

numbers.forEach((number) => {
  console.log(number * 2);
});

console.log("fine");

// 2
// 4
// 6
// fine
```

`forEach` chiama la callback durante l'iterazione e ne ignora il valore restituito. `map`, invece, usa quel valore per costruire l'array risultante. Entrambe invocano callback sincrone: una callback `async` restituisce una Promise, ma `forEach` non la attende e `map` produce un array di Promise.

---
### Callback asincrone
Una callback invocata asincronicamente viene eseguita dopo che la chiamata che l'ha registrata ha restituito il controllo, per esempio quando un timer diventa eseguibile.

```js
console.log("inizio");

setTimeout(() => {
  console.log("timer");
}, 1000);

console.log("fine");

// inizio
// fine
// timer
```

Il timer viene gestito dal runtime; la callback entra nello stack quando arriva il suo turno. Il ritardo di 1000 ms non e una scadenza esatta.

Il `return` della callback non restituisce un risultato a chi ha gia chiamato `setTimeout`:

```js
function getValueLater(callback) {
  setTimeout(() => callback(42), 0);
}

const immediate = getValueLater((value) => {
  console.log(value); // 42, in seguito
  return value;
});

console.log(immediate); // undefined, prima di 42
```

Il risultato deve essere usato dentro la callback o esposto tramite una Promise; non e disponibile sincronicamente in `immediate`.

---
### Callback negli eventi
Gli eventi browser usano callback. Questo esempio va eseguito dopo il relativo HTML:

```html
<button id="save" type="button">Salva</button>
```

```js
const button = document.querySelector("#save");
if (!button) throw new Error("Pulsante #save mancante");

function handleClick(event) {
  console.log("click su", event.currentTarget);
}

button.addEventListener("click", handleClick);

function cleanup() {
  button.removeEventListener("click", handleClick);
}
```

`cleanup()` va chiamata quando il componente viene smontato. Serve lo stesso riferimento a funzione e lo stesso valore di `capture`, non una nuova arrow equivalente.

Il click dell'utente arriva dal browser, ma `dispatchEvent()` chiama i listener sincronicamente:

```js
const target = new EventTarget();
target.addEventListener("ready", () => console.log("listener"));

console.log("prima");
target.dispatchEvent(new Event("ready"));
console.log("dopo");

// prima, listener, dopo
```

Non assumere quindi che "event listener" significhi sempre "callback in un task futuro". Le eccezioni dei listener DOM vengono segnalate dal browser, non propagate al chiamante di `dispatchEvent`; questa e una regola dell'API, diversa da una normale chiamata diretta a funzione.

---
### Callback hell
Quando callback asincrone dipendono una dall'altra, il codice puo diventare annidato e difficile da mantenere.

Schema del problema, non un programma autonomo: `loadUser`, `loadPosts`, `loadComments`, `render` e `showError` sono API applicative da definire. Si assume per esse il contratto error-first, con risultati della forma attesa.

```js
loadUser(id, (error, user) => {
  if (error) return showError(error);
  loadPosts(user.id, (error, posts) => {
    if (error) return showError(error);
    if (posts.length === 0) return render([]);
    loadComments(posts[0].id, (error, comments) => {
      if (error) return showError(error);
      render(comments);
    });
  });
});
```

Questo problema e uno dei motivi per cui Promise e `async/await` sono preferiti nel codice moderno.

---
### Inversion of control
Passare una callback significa cedere a un'altra funzione il controllo su quando e quante volte verra chiamata.

```js
function runTwice(callback) {
  callback();
  callback();
}
```

Per API pubbliche e codice critico conviene documentare chiaramente il comportamento atteso.

In particolare: invocazione sincrona o differita, eventuale ripetizione, significato degli argomenti, comportamento in caso di errore, valore di `this` e modalita di cancellazione. Per API di completamento evita il comportamento a volte sincrono e a volte asincrono in base a una cache: rende imprevedibile il codice chiamante. Una callback di evento, invece, puo legittimamente essere chiamata molte volte.

---

## API / Sintassi

Callback sincrona con risultato usato da `map`:

```js
const items = [2, 4, 6];
const doubled = items.map((item) => item * 2);
console.log(doubled); // [4, 8, 12]
```

Callback Node error-first: schema di consumo, con `operation`, `handleError` e `handleResult` forniti dall'applicazione.

```js
operation((error, result) => {
  if (error) {
    handleError(error);
    return;
  }

  handleResult(result);
});
```

Passare una funzione, non invocarla subito:

```js
function runLater(callback) {
  return setTimeout(callback, 0);
}

function handleDone() {
  console.log("finito");
}

runLater(handleDone);
```

Non chiamarla subito con `runLater(handleDone())`, a meno che tu voglia passare il risultato.

## Esempio pratico

Funzione sincrona che trova il primo elemento accettato da un predicato. Il contratto qui e un array denso non modificato durante la ricerca e un predicato **sincrono** che restituisce esattamente un booleano:

```js
function findFirst(items, predicate) {
  if (!Array.isArray(items) || typeof predicate !== "function") {
    throw new TypeError("Servono un array e una funzione");
  }

  for (const item of items) {
    const matches = predicate(item);
    if (typeof matches !== "boolean") {
      throw new TypeError("Il predicato deve restituire un booleano sincrono");
    }
    if (matches) {
      return item;
    }
  }

  return undefined;
}

const users = [
  { id: 1, active: false },
  { id: 2, active: true },
];

const user = findFirst(users, (item) => item.active);
console.log(user.id); // 2
```

La funzione `findFirst` non conosce la regola: la riceve dal chiamante. Interrompe la ricerca al primo `true`, restituisce `undefined` se non trova nulla e propaga gli errori del predicato. L'elemento restituito e un riferimento dell'array, non una copia.

E un esempio didattico: normalmente usa `Array.prototype.find`, che accetta risultati truthy e ha proprie regole per gli array sparsi. Non passare un predicato `async` a nessuna delle due versioni: una Promise non e il booleano atteso. Il controllo qui rifiuta il risultato non booleano, ma non annulla ne gestisce un'operazione async avviata per errore dal predicato.

### Lettura Node con error-first

Modulo Node (`.mjs` o package ESM), non codice browser. `readConfig` legge un file UTF-8 e ne interpreta il JSON; il file deve essere presente nel percorso fornito. Non valida lo schema della configurazione.

```js
import { readFile } from "node:fs";

function readConfig(filePath, callback) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new TypeError("Percorso non vuoto richiesto");
  }
  if (typeof callback !== "function") {
    throw new TypeError("Callback richiesta");
  }

  readFile(filePath, "utf8", (error, text) => {
    if (error) {
      callback(error);
      return;
    }

    let config;
    try {
      config = JSON.parse(text);
    } catch (parseError) {
      callback(parseError);
      return;
    }

    callback(null, config);
  });
}
```

Uso nello stesso modulo, con `config.json` relativo alla directory corrente del processo:

```js
readConfig("config.json", (error, config) => {
  if (error) {
    console.error("Configurazione non caricata:", error.message);
    return;
  }
  console.log(config);
});
```

Gli errori di I/O/parsing arrivano nel primo argomento della callback; gli argomenti di chiamata non validi possono causare un throw sincrono. Nel percorso normale la callback di completamento viene chiamata una sola volta.

`callback(null, config)` e fuori dal `try` del parsing: se il codice chiamante lancia un errore, non deve essere scambiato per errore JSON e causare una seconda invocazione della callback.

## Varianti

- **Callback sincrona**: eseguita durante la chiamata.
- **Callback asincrona**: eseguita dopo un evento o un completamento.
- **Error-first callback**: pattern Node.js storico.
- **Event listener**: callback legata a eventi.
- **Higher-order function**: funzione che riceve o restituisce funzioni.

## Errori comuni

### Errori fuori dal try del chiamante

Un `try` che racchiude solo la registrazione di un timer non intercetta un throw nella callback futura: quel `try` e gia terminato. Gestisci l'errore nel punto di esecuzione, usa il canale error-first previsto dall'API o converti l'operazione in Promise.

Per una normale callback sincrona invocata direttamente, invece, un throw risale la chiamata e puo essere intercettato dal chiamante. Non generalizzare questa regola ai listener DOM, che hanno il comportamento specifico descritto sopra.

### Async non atteso

`forEach(async () => ...)`, listener e timer non aspettano la Promise restituita dalla callback. Il flusso esterno puo terminare prima e un rifiuto puo restare non gestito. Per una sequenza usa un ciclo con `await`; per risultati indipendenti usa `map` e `Promise.all` con gestione del rifiuto. Nei listener gestisci esplicitamente gli errori della funzione async.

---
- Chiamare subito la funzione invece di passarla come callback.
- Dimenticare di gestire gli errori.
- Creare annidamenti profondi.
- Assumere che una callback asincrona venga eseguita immediatamente.
- Perdere il valore di `this` quando si passa un metodo come callback.

---

## Checklist

### Checklist operativa
- Usa callback per eventi e API semplici.
- Usa Promise o `async/await` per flussi asincroni complessi.
- Gestisci sempre gli errori nei callback asincroni.
- Evita annidamenti profondi.
- Se passi metodi come callback, controlla il valore di `this`.
- Conserva il riferimento dei listener da rimuovere e documenta quante volte vengono chiamati.
- Non assumere che il valore di ritorno, soprattutto una Promise, venga usato dall'API chiamante.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Array Methods|Array Methods]]

## Fonti

- [MDN: callback sincrone e asincrone](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function).
- [MDN: forEach e callback async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).
- [MDN: dispatchEvent ed eccezioni dei listener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent).
- [Node.js: error-first callbacks](https://nodejs.org/api/errors.html#error-first-callbacks).
- [Node.js: fs.readFile](https://nodejs.org/api/fs.html#fsreadfilepath-options-callback).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
