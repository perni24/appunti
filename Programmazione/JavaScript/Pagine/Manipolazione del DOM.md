---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, browser, dom, html, web-api]
aliases: [DOM JS, Manipolare il DOM]
prerequisites: [Variabili, Funzioni]
related: [Gestione Eventi, Sicurezza, Web Components]
---

# Manipolazione del DOM

## Sintesi

Il DOM (**Document Object Model**) e la rappresentazione ad albero di una pagina HTML.

JavaScript puo leggere, modificare, creare e rimuovere nodi del DOM per aggiornare l'interfaccia utente.

---

## Quando usarla

- Leggere elementi dalla pagina.
- Modificare testo, attributi o classi.
- Creare elementi dinamicamente.
- Reagire a dati ricevuti da API.
- Costruire interfacce senza framework.

---

## Selezionare elementi

```js
const title = document.getElementById("main-title");
const firstButton = document.querySelector("button");
const allButtons = document.querySelectorAll("button");
```

Metodi comuni:

- `getElementById()`: seleziona un elemento per `id`;
- `querySelector()`: seleziona il primo elemento che corrisponde a un selettore CSS;
- `querySelectorAll()`: seleziona tutti gli elementi corrispondenti.

```js
const card = document.querySelector(".card");
const items = document.querySelectorAll(".menu-item");
```

`querySelectorAll()` restituisce una `NodeList`, iterabile con `for...of`.

```js
for (const item of items) {
  console.log(item.textContent);
}
```

---

## Controllare se un elemento esiste

`querySelector()` puo restituire `null`.

```js
const modal = document.querySelector("#modal");

if (modal) {
  modal.classList.add("open");
}
```

Errore tipico:

```js
const modal = document.querySelector("#modal");

// modal.classList.add("open"); // TypeError se modal e null
```

---

## Leggere e modificare testo

Per testo puro, usa `textContent`.

```js
const title = document.querySelector("h1");

title.textContent = "Nuovo titolo";
```

`textContent` non interpreta HTML, quindi e piu sicuro con dati non fidati.

```js
message.textContent = userInput;
```

---

## innerHTML

`innerHTML` interpreta stringhe come HTML.

```js
container.innerHTML = "<strong>Ciao</strong>";
```

E potente, ma rischioso se usato con input utente.

```js
// Pericoloso se userInput non e fidato
container.innerHTML = userInput;
```

> [!WARNING]
> Per contenuto proveniente da utenti o sorgenti non fidate, preferisci `textContent` o sanitizza l'HTML.

---

## Classi CSS

`classList` permette di gestire classi senza manipolare stringhe manualmente.

```js
const panel = document.querySelector(".panel");

panel.classList.add("open");
panel.classList.remove("hidden");
panel.classList.toggle("active");
```

Verificare una classe:

```js
if (panel.classList.contains("open")) {
  console.log("Pannello aperto");
}
```

---

## Attributi e dataset

```js
const link = document.querySelector("a");

link.setAttribute("href", "https://example.com");
link.setAttribute("target", "_blank");

console.log(link.getAttribute("href"));
```

Per attributi `data-*`, usa `dataset`.

```html
<button data-user-id="42">Apri profilo</button>
```

```js
const button = document.querySelector("button");

console.log(button.dataset.userId); // "42"
```

---

## Creare elementi

```js
const item = document.createElement("li");

item.textContent = "Nuovo elemento";
item.classList.add("item");

document.querySelector("ul").append(item);
```

Metodi utili:

- `append()`: aggiunge nodi o stringhe alla fine;
- `prepend()`: aggiunge all'inizio;
- `before()`: inserisce prima dell'elemento;
- `after()`: inserisce dopo l'elemento;
- `replaceWith()`: sostituisce l'elemento.

---

## DocumentFragment

`DocumentFragment` e utile per costruire piu nodi prima di inserirli nel DOM.

```js
const fragment = document.createDocumentFragment();

for (const name of ["Luca", "Marco", "Giulia"]) {
  const item = document.createElement("li");
  item.textContent = name;
  fragment.append(item);
}

document.querySelector("ul").append(fragment);
```

Riduce modifiche ripetute al DOM.

---

## Rimuovere elementi

```js
const banner = document.querySelector(".banner");

banner?.remove();
```

`?.` evita errori se l'elemento non esiste.

---

## DOM ready

Se lo script viene eseguito prima che il DOM sia pronto, gli elementi potrebbero non esistere ancora.

Soluzioni comuni:

```html
<script src="app.js" defer></script>
```

Oppure:

```js
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
```

---

## Performance

Operazioni DOM ripetute possono essere costose.

Buone pratiche:

- seleziona elementi una volta quando possibile;
- usa classi CSS invece di molti stili inline;
- raggruppa inserimenti con `DocumentFragment`;
- separa letture e scritture del layout;
- evita `innerHTML += ...` in loop.

---

## Errori comuni

- Usare un elemento `null` senza controllo.
- Usare `innerHTML` con input non fidato.
- Modificare stile inline invece di classi CSS.
- Fare molte modifiche DOM dentro un loop senza raggrupparle.
- Eseguire lo script prima che il DOM sia pronto.

---

## Checklist

- L'elemento selezionato puo essere `null`?
- Posso usare `textContent` invece di `innerHTML`?
- Sto usando `classList` per gli stati visivi?
- Devo creare molti elementi? Posso usare `DocumentFragment`?
- Il codice viene eseguito dopo il caricamento del DOM?

---

## Collegamenti

- [[Gestione Eventi]]
- [[Sicurezza]]
- [[Web Components]]
- [[Browser Storage]]
- [[Scheduling Browser]]
