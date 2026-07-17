---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, browser, events, dom, event-listener]
aliases: [Eventi JS, Event handling JavaScript]
prerequisites: [Funzioni, Manipolazione del DOM]
related: [Manipolazione del DOM, Callback, AbortController]
---

# Gestione Eventi

## Sintesi

Gli eventi sono segnali generati dal browser quando accade qualcosa: click, submit, input, caricamento pagina, pressione di tasti, movimento del mouse e altro.

JavaScript puo ascoltare questi eventi ed eseguire funzioni di callback.

---

## Quando usarlo

Usa la gestione eventi quando il codice deve reagire a interazioni utente o segnali del browser.

Casi comuni:

- click su pulsanti;
- submit di form;
- input di testo;
- navigazione e caricamento pagina;
- scorciatoie da tastiera;
- menu, modali e dropdown;
- liste con elementi dinamici.

Quando molti elementi simili devono reagire allo stesso evento, valuta event delegation.

## Come funziona

### addEventListener
`addEventListener()` e il metodo standard per registrare un listener.

```js
const button = document.querySelector("button");

button.addEventListener("click", () => {
  console.log("Click");
});
```

Vantaggi rispetto ad attributi HTML come `onclick`:

- separa HTML e JavaScript;
- permette piu listener sullo stesso evento;
- supporta opzioni come `once`, `passive`, `capture` e `signal`.

---
### Event object
Il browser passa al listener un oggetto evento.

```js
button.addEventListener("click", event => {
  console.log(event.type);
  console.log(event.target);
  console.log(event.currentTarget);
});
```

Differenza importante:

- `event.target`: elemento da cui parte l'evento;
- `event.currentTarget`: elemento su cui e registrato il listener.

---
### preventDefault
`preventDefault()` blocca il comportamento predefinito del browser.

Esempio con form:

```js
const form = document.querySelector("form");

form.addEventListener("submit", event => {
  event.preventDefault();

  console.log("Invio gestito via JavaScript");
});
```

Esempio con link:

```js
link.addEventListener("click", event => {
  event.preventDefault();
});
```

---
### Propagazione
Un evento attraversa il DOM in tre fasi:

1. capturing;
2. target;
3. bubbling.

```html
<div id="parent">
  <button id="child">Click</button>
</div>
```

```js
document.querySelector("#parent").addEventListener("click", () => {
  console.log("Parent");
});

document.querySelector("#child").addEventListener("click", () => {
  console.log("Child");
});
```

Di default, `addEventListener()` ascolta in fase di bubbling.

---
### stopPropagation
`stopPropagation()` impedisce all'evento di continuare la propagazione.

```js
child.addEventListener("click", event => {
  event.stopPropagation();

  console.log("Solo child");
});
```

Usalo con criterio: bloccare la propagazione puo rompere event delegation o listener globali.

---
### Event delegation
La delegazione consiste nel mettere un listener su un contenitore e gestire eventi dei figli.

```js
const list = document.querySelector("#list");

list.addEventListener("click", event => {
  const item = event.target.closest("li");

  if (!item || !list.contains(item)) {
    return;
  }

  console.log(item.textContent);
});
```

Vantaggi:

- meno listener;
- funziona anche con elementi aggiunti dinamicamente;
- utile per liste, tabelle e menu.

---
### Opzioni del listener
`addEventListener()` accetta un oggetto di opzioni.

```js
button.addEventListener("click", handleClick, {
  once: true,
  capture: false,
  passive: true,
});
```

Opzioni comuni:

- `once`: rimuove il listener dopo la prima esecuzione;
- `capture`: ascolta in fase di capturing;
- `passive`: dichiara che il listener non chiamera `preventDefault()`;
- `signal`: collega il listener a un `AbortSignal`.

---
### Rimuovere listener
Per rimuovere un listener devi passare la stessa funzione usata in registrazione.

```js
function handleClick() {
  console.log("Click");
}

button.addEventListener("click", handleClick);
button.removeEventListener("click", handleClick);
```

Questo non funziona:

```js
button.addEventListener("click", () => {
  console.log("Click");
});

button.removeEventListener("click", () => {
  console.log("Click");
});
```

Le due arrow function sono riferimenti diversi.

---
### Cleanup con AbortController
`AbortController` puo rimuovere listener in modo pulito.

```js
const controller = new AbortController();

window.addEventListener("resize", handleResize, {
  signal: controller.signal,
});

controller.abort();
```

Utile quando una parte dell'interfaccia viene smontata o non serve piu.

---
### Eventi di caricamento
`DOMContentLoaded` scatta quando l'HTML e stato letto e il DOM e pronto.

```js
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
```

`load` scatta quando sono caricati anche asset come immagini e iframe.

```js
window.addEventListener("load", () => {
  console.log("Pagina completamente caricata");
});
```

Nel codice moderno, spesso si usa `<script defer>`.

---
### Eventi comuni
| Evento | Uso |
| --- | --- |
| `click` | Click mouse o tap |
| `input` | Cambio valore mentre si digita |
| `change` | Cambio valore confermato |
| `submit` | Invio form |
| `keydown` | Pressione tasto |
| `mouseover` | Mouse sopra elemento |
| `focus` | Elemento riceve focus |
| `blur` | Elemento perde focus |

---

## API / Sintassi

Registrare listener:

```js
element.addEventListener("click", handleClick);
```

Rimuovere listener:

```js
element.removeEventListener("click", handleClick);
```

Opzioni:

```js
element.addEventListener("click", handleClick, {
  once: true,
  passive: true,
  signal: controller.signal,
});
```

Oggetto evento:

```js
event.target;
event.currentTarget;
event.preventDefault();
event.stopPropagation();
```

## Esempio pratico

Delegazione per una lista:

```js
const list = document.querySelector("[data-user-list]");

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='delete']");

  if (!button || !list.contains(button)) {
    return;
  }

  const item = button.closest("[data-user-id]");
  deleteUser(item.dataset.userId);
});
```

Un solo listener gestisce anche elementi aggiunti dinamicamente.

## Varianti

- **Listener diretto**: registrato sul singolo elemento.
- **Event delegation**: registrato su un contenitore.
- **Listener monouso**: opzione `once`.
- **Listener passivo**: opzione `passive`, utile per scroll/touch.
- **Cleanup con AbortSignal**: rimozione centralizzata.
- **CustomEvent**: eventi personalizzati tra componenti.

## Errori comuni

- Usare `onclick` inline invece di `addEventListener()`.
- Confondere `target` e `currentTarget`.
- Dimenticare `preventDefault()` nel submit gestito via JavaScript.
- Non rimuovere listener non piu necessari.
- Usare `stopPropagation()` senza motivo.
- Registrare listener duplicati.

---

## Checklist

- Il listener viene registrato una sola volta?
- Serve `preventDefault()`?
- Sto usando `target` o `currentTarget` correttamente?
- Posso usare event delegation?
- Devo rimuovere il listener o usare `AbortController`?

---

## Collegamenti

- [[Manipolazione del DOM]]
- [[Callback]]
- [[AbortController]]
- [[Form Handling e Validazione]]
- [[Web Components]]
