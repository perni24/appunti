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
  - browser
  - dom
  - html
  - web-api
aliases:
  - DOM JS
  - Manipolare il DOM
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi]]"
  - "[[Programmazione/JavaScript/Pagine/Sicurezza]]"
  - "[[Programmazione/JavaScript/Pagine/Web Components]]"
title: Manipolazione del DOM
---

# Manipolazione del DOM

## Sintesi

Il DOM (**Document Object Model**) e la rappresentazione ad albero di una pagina HTML.

JavaScript puo leggere, modificare, creare e rimuovere nodi del DOM per aggiornare l'interfaccia utente.

Gli esempi richiedono un browser e l'HTML con gli elementi selezionati, gia presente al momento dell'esecuzione. I frammenti sono indipendenti, salvo rimandi espliciti; Node.js da solo non espone `document`.

---

## Quando usarlo

- Leggere elementi dalla pagina.
- Modificare testo, attributi o classi.
- Creare elementi dinamicamente.
- Reagire a dati ricevuti da API.
- Costruire interfacce senza framework.

---

## Come funziona

### Selezionare elementi
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

`querySelectorAll()` restituisce una `NodeList` **statica**, iterabile con `for...of`: la selezione non si aggiorna quando aggiungi altri nodi. Non e un array, quindi per metodi come `map()` usa `Array.from(items)`. Altre collezioni, come quelle di `getElementsByClassName()`, sono invece live.

Il ciclo seguente usa `items` selezionato sopra:

```js
for (const item of items) {
  console.log(item.textContent);
}
```

---
### Controllare se un elemento esiste
`querySelector()` e `getElementById()` possono restituire `null`. `querySelectorAll()` senza risultati restituisce una lista vuota.

Un selettore CSS non valido genera invece `SyntaxError`. Per un id dinamico preferisci `getElementById(id)`; se lo inserisci in un selettore, usa `CSS.escape(id)`.

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
### Leggere e modificare testo
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
### innerHTML
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

La sanitizzazione deve usare uno strumento mantenuto, non espressioni regolari artigianali; vedi [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]. Non basta rimuovere i tag `script`: anche attributi evento e URL possono essere pericolosi.

Assegnare `innerHTML` ricrea i discendenti; i listener registrati sui vecchi nodi non vengono trasferiti a quelli nuovi. Anche `textContent = ...` sostituisce i figli: e adatto al testo, non a conservare controlli e stato di un componente.

---
### Classi CSS
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
### Attributi e dataset
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

I valori di `dataset` sono stringhe. Distingui inoltre attributi HTML e proprieta correnti: `input.value` contiene il valore editato, mentre l'attributo `value` descrive il valore iniziale. Gli attributi booleani valgono per presenza: `disabled="false"` disabilita comunque il controllo; per riabilitarlo usa `button.disabled = false` o rimuovi l'attributo.

---
### Creare elementi
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
### DocumentFragment
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

All'inserimento vengono spostati i figli, non il frammento stesso, che resta vuoto. E utile per organizzare il codice; non garantisce da solo un miglioramento di prestazioni. Misura prima di attribuirgli un vantaggio.

---
### Rimuovere elementi
```js
const banner = document.querySelector(".banner");

banner?.remove();
```

`?.` evita errori se l'elemento non esiste.

---
### DOM ready
Se lo script viene eseguito prima che il DOM sia pronto, gli elementi potrebbero non esistere ancora.

Soluzioni comuni:

```html
<script src="app.js" defer></script>
```

`defer` vale per script classici esterni, non per script inline; i moduli ES sono differiti di default, salvo opzioni come `async`. `DOMContentLoaded` non attende immagini o tutti gli script asincroni.

Per codice caricato anche dopo `DOMContentLoaded`, controlla `readyState` prima di registrare il listener:

```js
function onDomReady(initialize) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
}

onDomReady(() => {
  document.body.dataset.ready = "true";
});
```

Sostituisci il corpo della callback con l'inizializzazione dell'app. Registrare soltanto un listener dopo che l'evento e gia passato non lo fa rieseguire.

---
### Performance
Operazioni DOM ripetute possono essere costose.

Buone pratiche:

- seleziona elementi una volta quando possibile;
- usa classi CSS invece di molti stili inline;
- raggruppa inserimenti con `DocumentFragment`;
- separa letture e scritture del layout;
- evita `innerHTML += ...` in loop.

---

## API / Sintassi

Schemi di sintassi: `selector`, `id`, `element`, `parent` e `handler` vanno forniti dall'applicazione.

Selezione:

```js
document.querySelector(selector);
document.querySelectorAll(selector);
document.getElementById(id);
```

Modifica:

```js
element.textContent = "testo";
element.classList.add("active");
element.setAttribute("aria-expanded", "true");
element.dataset.userId;
```

Creazione e inserimento:

```js
const element = document.createElement("div");
parent.append(element);
element.remove();
```

Eventi:

```js
element.addEventListener("click", handler);
```

## Esempio pratico

Render di nomi come testo. `users` e un array gia validato di oggetti con `name` stringa. Inserisci questo HTML e poi esegui JavaScript:

```html
<ul id="users"></ul>
```

```js
function renderUsers(list, users) {
  if (!(list instanceof Element)) {
    throw new TypeError("Serve un contenitore DOM esistente");
  }

  const fragment = document.createDocumentFragment();

  for (const user of users) {
    const item = document.createElement("li");
    item.textContent = user.name;
    fragment.append(item);
  }

  list.replaceChildren(fragment);
}

renderUsers(document.querySelector("#users"), [
  { name: "Ada" },
  { name: "<strong>Grace</strong>" },
]);
```

Il secondo nome appare con le parentesi angolari: non diventa markup. `replaceChildren()` sostituisce la lista precedente invece di duplicarla; rimuove anche eventuali controlli e listener nei vecchi elementi. Per conservarne lo stato serve un aggiornamento mirato.

## Varianti

- **DOM manuale**: uso diretto di API native.
- **Template HTML**: markup predefinito da clonare.
- **DocumentFragment**: inserimenti raggruppati.
- **Event delegation**: listener su contenitore.
- **Framework UI**: React, Vue, Svelte e simili gestiscono il DOM in modo dichiarativo.
- **Web Components**: componenti nativi con custom elements e Shadow DOM.

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

- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Web Components|Web Components]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]


## Fonti

- [MDN: querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).
- [MDN: innerHTML e rischi di iniezione](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
- [MDN: DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).
- [MDN: DOMContentLoaded e readyState](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event).
- [MDN: attributo disabled](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled).
- [MDN: proprieta value degli input](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value).
- [MDN: dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
