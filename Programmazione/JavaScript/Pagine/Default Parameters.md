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
  - functions
  - default-parameters
aliases:
  - Parametri default
  - Parametri predefiniti
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Destructuring]]"
title: Default Parameters
---

# Default Parameters

## Sintesi

I default parameters permettono di assegnare un valore predefinito a un parametro di funzione.

Il valore di default viene usato quando l'argomento e assente o vale `undefined`.

---

## Quando usarlo

- Parametri opzionali.
- Valori di configurazione.
- Oggetti di opzioni.
- Funzioni con fallback ragionevoli.
- API piu auto-documentanti.

---

## Come funziona

### undefined vs null
Il default si applica solo con `undefined`.

```js
function show(value = "default") {
  console.log(value);
}

show();          // "default"
show(undefined); // "default"
show(null);      // null
show("");        // ""
```

`null` e considerato un valore passato intenzionalmente.

---
### Espressioni come default
Il default puo essere il risultato di una espressione.

```js
function createUser(id = crypto.randomUUID()) {
  return { id };
}
```

L'espressione viene valutata alla chiamata, solo se quel parametro e assente o `undefined`. `crypto.randomUUID()` e un'API del runtime, non la sintassi dei default; nel browser richiede un contesto sicuro e supporto dell'API.

Anche un oggetto di default viene creato di nuovo a ogni chiamata:

```js
function addItem(item, items = []) {
  items.push(item);
  return items;
}

console.log(addItem("A")); // ["A"]
console.log(addItem("B")); // ["B"], non ["A", "B"]
```

Se passi un array esistente, invece, la funzione riceve proprio quel riferimento e `push()` lo modifica.

---
### Parametri precedenti
Un parametro puo usare parametri dichiarati prima.

```js
function createRectangle(width, height = width) {
  return {
    width,
    height,
    area: width * height,
  };
}

console.log(createRectangle(10).area); // 100
```

Un initializer puo contenere il nome di un parametro dichiarato dopo, ma quel binding e ancora nella temporal dead zone quando il default viene valutato. Se la valutazione prova a leggerlo, la chiamata genera `ReferenceError`:

```js
function example(first = second, second = 1) {
  return first + second;
}

example(); // ReferenceError
```

I default non possono usare dichiarazioni locali del corpo della funzione:

```js
function invalidDefault(value = buildValue()) {
  function buildValue() {
    return 1;
  }
  return value;
}

// invalidDefault(); // ReferenceError: buildValue non e visibile qui
```

---
### Default con destructuring
Molto utile con oggetti di opzioni.

```js
function createServiceUrl({
  host = "localhost",
  port = 8080,
  secure = false,
} = {}) {
  return `${secure ? "https" : "http"}://${host}:${port}`;
}
```

Il `= {}` finale gestisce l'argomento assente o `undefined`, non `null`. I default dei singoli campi intervengono solo per campi assenti o `undefined`. Questa funzione costruisce una stringa URL: non apre connessioni e presume host e porta gia validati.

```js
console.log(createServiceUrl()); // "http://localhost:8080"
```

---

## API / Sintassi

### Sintassi
```js
function greet(name = "Guest") {
  return `Ciao ${name}`;
}

console.log(greet());       // "Ciao Guest"
console.log(greet("Luca")); // "Ciao Luca"
```

Prima di ES6 si usavano spesso controlli manuali.

```js
function greet(name) {
  name = name || "Guest";
  return "Ciao " + name;
}
```

Questo pero tratta anche `""`, `0` o `false` come mancanti.

---

## Esempio pratico

Funzione con opzioni:

```js
function createRequest(url, {
  method = "GET",
  headers = {},
  timeoutMs = 5000,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new RangeError("timeoutMs deve essere un numero finito non negativo");
  }

  return {
    url,
    method,
    headers,
    timeoutMs,
  };
}

createRequest("/api/users");
createRequest("/api/users", { method: "POST" });
```

Il default rende esplicito il comportamento normale e permette di specificare solo le opzioni che cambiano.

L'esempio restituisce soltanto una configurazione: non esegue richieste e non applica un timeout. `fetch()` non interpreta un'opzione `timeoutMs`; una funzione chiamante deve tradurla in una politica di annullamento, per esempio con [[Programmazione/JavaScript/Pagine/AbortController|AbortController]], definendo anche il significato di `0`. I default non sostituiscono la validazione: URL, metodo e header hanno ancora bisogno dei controlli richiesti dall'applicazione.

## Varianti

- **Default semplice**: `function fn(value = 1)`.
- **Default da espressione**: `function fn(id = crypto.randomUUID())`.
- **Default basato su parametro precedente**: `function fn(width, height = width)`.
- **Default con destructuring**: `function fn({ limit = 10 } = {})`.
- **Fallback nullish dentro la funzione**: utile quando anche `null` deve attivare il default.

## Errori comuni

- Aspettarsi che `null` attivi il default.
- Usare `param = param || default` quando `0`, `false` o `""` sono valori validi.
- Dimenticare `= {}` con destructuring nei parametri.
- Mettere logica troppo costosa come default senza necessita.

---

## Checklist

- Il parametro e davvero opzionale?
- Il default e chiaro nella firma?
- `null` deve essere trattato come valore valido?
- Con destructuring ho aggiunto `= {}`?
- Il default ha effetti collaterali?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Destructuring|Destructuring]]
- [[Programmazione/JavaScript/Pagine/Operatori|Operatori]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]

## Fonti

- [MDN - Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)
- [MDN - Crypto.randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)


## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
