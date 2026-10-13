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
  - closures
  - scope
  - functions
aliases:
  - Closure JS
  - Chiusure JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Scope]]"
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks]]"
  - "[[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks]]"
title: Closures
---

# Closures

## Sintesi

Una closure e la combinazione di una funzione e del suo ambiente lessicale. La funzione puo accedere ai binding esterni anche dopo che la chiamata della funzione che li ha creati e terminata.

In pratica: una funzione puo ricordare variabili esterne. Non serve necessariamente restituirla con `return`: anche un callback registrato come listener puo usare una closure.

---

## Quando usarlo

Usa closures quando una funzione deve ricordare dati definiti nel suo scope di creazione.

Casi comuni:

- callback;
- factory function;
- stato privato semplice;
- configurazione parziale;
- memoizzazione;
- handler che devono accedere a dati del contesto.

Usale con attenzione quando catturano oggetti grandi o vivono a lungo.

## Come funziona

Quando una funzione viene creata, JavaScript conserva un riferimento al suo ambiente lessicale.

La closure non copia semplicemente i valori: mantiene accesso alle variabili dello scope esterno.

```js
function createCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const counter = createCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`count` resta privata rispetto al codice esterno, ma resta modificabile dalla funzione `increment`.

Due chiamate a `createCounter()` creano due contatori indipendenti. Piu funzioni create nella **stessa** chiamata, invece, possono condividere lo stesso binding:

```js
function createSelection(initialId) {
  let selectedId = initialId;
  const initialLabel = `Iniziale: ${selectedId}`;

  return {
    select(id) { selectedId = id; },
    read() { return selectedId; },
    readInitialLabel() { return initialLabel; },
  };
}

const selection = createSelection(1);
selection.select(2);
console.log(selection.read()); // 2
console.log(selection.readInitialLabel()); // "Iniziale: 1"
```

La closure legge il valore attuale di `selectedId`; non ricalcola pero una stringa gia costruita. Questa distinzione aiuta a riconoscere dati derivati diventati obsoleti nei callback.

---
### Stato privato
Le closures sono spesso usate per incapsulare stato. Questa factory rappresenta soltanto una sessione in memoria: `login` memorizza un token gia ottenuto da un sistema di autenticazione, non autentica l'utente.

```js
function createUserSession(userId) {
  let token = null;

  return {
    login(newToken) {
      if (
        typeof newToken !== "string" ||
        /\s/.test(newToken) ||
        !/^[A-Za-z0-9._~+\/-]+=*$/.test(newToken)
      ) {
        throw new TypeError("Token Bearer con formato non valido");
      }
      token = newToken;
    },
    logout() {
      token = null;
    },
    getAuthHeader() {
      return token === null ? null : `Bearer ${token}`;
    },
    getUserId() {
      return userId;
    },
  };
}

const session = createUserSession(42);

console.log(session.getAuthHeader()); // null: omettere Authorization
session.login("example-token"); // segnaposto, non una credenziale reale
session.logout();
console.log(session.getAuthHeader()); // null
```

Il controllo segue solo il formato testuale Bearer della [RFC 6750, sezione 2.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1): non verifica firma, scadenza o permessi. Se `getAuthHeader()` restituisce `null`, non inviare un header `Authorization` con valore `null` o `Bearer null`.

Il codice esterno non accede direttamente al binding `token`, ma il metodo lo espone deliberatamente come header. Una closure e incapsulamento, non un deposito sicuro di segreti: non protegge da codice malevolo gia in esecuzione nella pagina. Non scrivere token reali nei log.

---
### Function factory
Una function factory crea funzioni specializzate partendo da una configurazione.

```js
function createFormatter(locale, currency) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  return function formatPrice(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError("Importo numerico finito richiesto");
    }
    return formatter.format(value);
  };
}

const formatEuro = createFormatter("it-IT", "EUR");

console.log(formatEuro(19.99)); // importo con simbolo euro e spazi del locale
```

La funzione restituita riusa la configurazione senza doverla ricevere a ogni chiamata. Il default `currencyDisplay: "symbol"` mostra il simbolo, non necessariamente il codice `EUR`. Per il codice imposta `currencyDisplay: "code"`; gli spazi possono essere non separabili, quindi non confrontare il risultato con una stringa costruita a mano. Il formatter presenta il valore: non risolve la precisione dei calcoli monetari.

---
### Closures nei callback
I callback mantengono accesso alle variabili esterne.

```js
function delayLog(message) {
  return setTimeout(() => {
    console.log(message);
  }, 1000);
}

const timeoutId = delayLog("Operazione completata");
// clearTimeout(timeoutId); // annulla il callback se non serve piu
```

Il callback passato a `setTimeout` puo leggere `message` anche quando `delayLog` ha gia terminato.

---
### Loop e closure
Con `var`, tutte le funzioni condividono la stessa variabile del ciclo.

```js
for (var i = 0; i < 3; i += 1) {
  setTimeout(() => {
    console.log(i);
  }, 0);
}

// 3
// 3
// 3
```

Con `let` nell'intestazione del ciclo, ogni iterazione crea un binding separato. Il ritardo `0` non esegue il callback subito: questi callback partono dopo il codice sincrono del ciclo.

```js
for (let i = 0; i < 3; i += 1) {
  setTimeout(() => {
    console.log(i);
  }, 0);
}

// 0
// 1
// 2
```

---
### Memoria
Finche una closure e raggiungibile, gli oggetti necessari al suo funzionamento possono restare raggiungibili attraverso l'ambiente catturato. Questo non implica che il motore conservi ogni variabile locale, ne che un ciclo di riferimenti sia da solo un leak.

```js
function createHandler(largeData) {
  return function handleClick() {
    console.log(largeData.id);
  };
}
```

Se `handleClick` resta registrata come event listener, anche `largeData` puo restare in memoria.

Per evitare leak:

- rimuovi listener non piu necessari;
- evita di chiudere su oggetti grandi se non servono;
- annulla timer, subscription e richieste quando non servono piu.

---

## API / Sintassi

Non esiste una API specifica: la relazione con l'ambiente lessicale viene stabilita quando la funzione viene creata.

```js
function outer(value) {
  return function inner() {
    return value;
  };
}
```

Schema di factory e listener, non un frammento autonomo: `createFunction`, `config`, `element`, `use` e `value` rappresentano dipendenze dell'applicazione.

```js
const fn = createFunction(config);
element.addEventListener("click", () => use(value));
```

La variabile catturata resta raggiungibile finche la funzione che la usa resta raggiungibile.

## Esempio pratico

### Esempio base
```js
function createMessage(name) {
  const prefix = "Ciao";

  return function printMessage() {
    console.log(`${prefix}, ${name}`);
  };
}

const message = createMessage("Luca");

message(); // "Ciao, Luca"
```

`printMessage` continua ad accedere a `prefix` e `name` anche dopo la fine di `createMessage`.

### Listener con smontaggio

In una pagina browser, inserisci prima questo HTML:

```html
<button id="increment-count" type="button">Incrementa</button>
<output id="count-value">0</output>
```

Poi esegui il codice dopo che gli elementi sono nel DOM. La funzione restituita rimuove lo stesso callback registrato, senza modificare altri listener:

```js
function mountCounter(button, output) {
  if (
    !(button instanceof HTMLButtonElement) ||
    !(output instanceof HTMLOutputElement)
  ) {
    throw new TypeError("Servono un button e un output della pagina");
  }
  let count = 0;
  output.textContent = String(count);

  function onClick() {
    count += 1;
    output.textContent = String(count);
  }

  button.addEventListener("click", onClick);
  return function unmount() {
    button.removeEventListener("click", onClick);
  };
}

const unmountCounter = mountCounter(
  document.querySelector("#increment-count"),
  document.querySelector("#count-value"),
);
// unmountCounter(); // prima di smontare la vista
```

Una sola registrazione per coppia di elementi: chiama lo smontaggio prima di montare di nuovo. La verifica `instanceof` presume elementi del documento corrente, non di un altro iframe. La rimozione interrompe gli aggiornamenti, ma non azzera l'output; elimina anche eventuali riferimenti applicativi non piu necessari.

---

## Varianti

- **Closure in callback**: usa dati esterni dentro eventi o timer.
- **Function factory**: restituisce funzioni configurate.
- **Stato privato**: nasconde variabili nello scope.
- **Memoization**: conserva risultati tra chiamate.
- **Currying/partial application**: specializza funzioni.
- **Closure longeva**: utile ma possibile fonte di memory leak.

## Errori comuni

- Pensare che una closure copi i valori invece di mantenere riferimenti.
- Creare closures dentro loop con `var`.
- Tenere in memoria oggetti grandi tramite callback non rimossi.
- Usare closures dove una classe o un modulo sarebbero piu leggibili.
- Nascondere troppo stato rendendo difficile il debug.

---

## Checklist

### Checklist operativa
- Usa closures per factory, callback e stato privato semplice.
- Preferisci `let` e `const` nei loop.
- Rimuovi listener e timer quando non servono.
- Mantieni esplicite le dipendenze chiuse dalla funzione.
- Se lo stato cresce molto, valuta classi, moduli o strutture dati dedicate.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Scope|Scope]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]


## Fonti

- [MDN: closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures).
- [MDN: opzioni Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat).
- [MDN: rimozione dei listener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
