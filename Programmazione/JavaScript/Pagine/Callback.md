---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, callback, async, functions]
aliases: [Callback JS]
prerequisites: [Funzioni]
related: [Event Loop, Promises, Async Await, Error Handling]
---

# Callback

## Sintesi

Una callback e una funzione passata come argomento a un'altra funzione, che la esegue in un momento successivo o durante la propria esecuzione.

Le callback sono possibili perche in JavaScript le funzioni sono valori: possono essere assegnate, passate e restituite.

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
Una callback sincrona viene eseguita subito, prima che la funzione principale termini.

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

`forEach` chiama la callback durante l'iterazione.

---
### Callback asincrone
Una callback asincrona viene eseguita dopo un evento o dopo il completamento di un'operazione.

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

Il timer viene gestito dal runtime. Il callback rientra nel call stack quando arriva il suo turno.

---
### Callback negli eventi
Gli eventi browser usano callback.

```js
button.addEventListener("click", (event) => {
  console.log("click su", event.currentTarget);
});
```

La funzione viene chiamata quando l'utente interagisce con l'elemento.

---
### Callback hell
Quando callback asincrone dipendono una dall'altra, il codice puo diventare annidato e difficile da mantenere.

```js
loadUser(id, (user) => {
  loadPosts(user.id, (posts) => {
    loadComments(posts[0].id, (comments) => {
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

---

## API / Sintassi

Callback sincrona:

```js
items.map((item) => transform(item));
```

Callback evento:

```js
element.addEventListener("click", (event) => {
  console.log(event.type);
});
```

Callback Node error-first:

```js
operation((error, result) => {
  if (error) {
    handleError(error);
    return;
  }

  handleResult(result);
});
```

Passare una funzione:

```js
runLater(handleDone);
```

Non chiamarla subito con `runLater(handleDone())`, a meno che tu voglia passare il risultato.

## Esempio pratico

Funzione che accetta una callback di filtro:

```js
function findFirst(items, predicate) {
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }
  }

  return undefined;
}

const user = findFirst(users, (item) => item.active);
```

La funzione `findFirst` non conosce la regola: la riceve dal chiamante.

## Varianti

- **Callback sincrona**: eseguita durante la chiamata.
- **Callback asincrona**: eseguita dopo un evento o un completamento.
- **Error-first callback**: pattern Node.js storico.
- **Event listener**: callback legata a eventi.
- **Higher-order function**: funzione che riceve o restituisce funzioni.

## Errori comuni

### Error-first callback
In Node.js e in molte API storiche si usa il pattern error-first callback.

```js
readFile("config.json", (error, content) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(content);
});
```

Il primo argomento rappresenta l'errore. Gli argomenti successivi rappresentano il risultato.

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

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]
