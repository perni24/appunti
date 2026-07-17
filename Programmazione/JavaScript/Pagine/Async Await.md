---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, async-await, promises, async]
aliases: [Async Await JS, async await]
prerequisites: [Promises, Event Loop]
related: [Promises, Promise avanzate, Fetch API, Error Handling]
---

# Async Await

## Sintesi

`async` e `await` sono sintassi costruita sopra le Promise.

Servono a scrivere codice asincrono con una forma piu lineare e leggibile rispetto a catene lunghe di `.then()`.

---

## Quando usarlo

Usa `async/await` quando devi scrivere flussi asincroni leggibili e ordinati.

Casi tipici:

- chiamate `fetch`;
- lettura file in Node.js;
- sequenze di operazioni dipendenti;
- gestione errori con `try/catch`;
- API che restituiscono Promise.

Se devi avviare piu operazioni indipendenti, non mettere `await` una dopo l'altra: usa `Promise.all` o strumenti simili.

## Come funziona

### `async`
Una funzione marcata con `async` restituisce sempre una Promise.

```js
async function getMessage() {
  return "ciao";
}

const result = getMessage();

console.log(result instanceof Promise); // true
```

Se la funzione restituisce un valore normale, JavaScript lo avvolge in una Promise risolta.

---
### `await`
`await` sospende l'esecuzione della funzione `async` finche la Promise non viene settled.

```js
async function loadUser() {
  const response = await fetch("/api/users/1");
  const user = await response.json();

  return user;
}
```

`await` restituisce il valore della Promise risolta. Se la Promise viene rifiutata, lancia un errore.

---
### `finally`
`finally` e utile per cleanup e stato UI.

```js
async function submitForm(data) {
  setLoading(true);

  try {
    await saveForm(data);
  } finally {
    setLoading(false);
  }
}
```

Viene eseguito sia in caso di successo sia in caso di errore.

---
### Sequenziale vs concorrente
Due `await` consecutivi eseguono operazioni in sequenza.

```js
const user = await loadUser();
const posts = await loadPosts(user.id);
```

Se le operazioni sono indipendenti, avviale insieme.

```js
const [user, settings] = await Promise.all([
  loadUser(),
  loadSettings(),
]);
```

Questo evita attese inutili.

---
### Top-level await
Nei moduli ES moderni si puo usare `await` al top-level.

```js
const config = await loadConfig();

export { config };
```

Va usato con attenzione: un modulo che aspetta blocca anche i moduli che dipendono da esso.

---

## API / Sintassi

Sintassi base:

```js
async function loadData() {
  const result = await operation();
  return result;
}
```

Arrow function:

```js
const loadData = async () => {
  return await operation();
};
```

Gestione errori:

```js
try {
  const data = await loadData();
} catch (error) {
  handleError(error);
}
```

Concorrenza:

```js
const [user, settings] = await Promise.all([
  loadUser(),
  loadSettings(),
]);
```

## Esempio pratico

Caricare dati con timeout e gestione errore:

```js
async function loadUser(id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`/api/users/${id}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

`finally` garantisce cleanup anche se la richiesta fallisce o viene abortita.

## Varianti

- **Funzione `async` dichiarata**: `async function fn()`.
- **Arrow async**: `const fn = async () =>`.
- **Metodo async**: metodo di oggetto o classe.
- **Top-level await**: disponibile nei moduli ES.
- **Sequenziale**: un `await` dipende dal precedente.
- **Concorrente**: piu Promise avviate insieme con `Promise.all`.

## Errori comuni

### Gestione errori
Con `async/await` si usa normalmente `try/catch`.

```js
async function loadProfile(id) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Impossibile caricare il profilo", error);
    throw error;
  }
}
```

Il `catch` intercetta sia errori lanciati manualmente sia Promise rifiutate.

---
- Usare `await` fuori da una funzione `async` o da un modulo.
- Dimenticare `try/catch` nei punti critici.
- Rendere sequenziali operazioni indipendenti.
- Usare `Array.prototype.forEach` con callback `async` aspettandosi che venga atteso.
- Dimenticare che una funzione `async` restituisce una Promise.

---

## Checklist

### Checklist operativa
- Usa `async/await` per flussi leggibili e lineari.
- Usa `Promise.all` quando le operazioni sono indipendenti.
- Gestisci errori con `try/catch`.
- Evita `forEach(async ...)`; usa `for...of` o `Promise.all`.
- Controlla `response.ok` quando usi `fetch`.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Promise avanzate|Promise avanzate]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
