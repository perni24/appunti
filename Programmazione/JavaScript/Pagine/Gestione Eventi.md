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
  - events
  - dom
  - event-listener
aliases:
  - Eventi JS
  - Event handling JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Funzioni]]"
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
title: Gestione Eventi
---

# Gestione Eventi

## Sintesi

Gli eventi sono segnali generati dal browser quando accade qualcosa: click, submit, input, caricamento pagina, pressione di tasti, movimento del mouse e altro.

JavaScript puo ascoltare questi eventi ed eseguire funzioni di callback.

Gli esempi presuppongono gli elementi HTML gia disponibili. Nomi come `button`, `link`, `child` e le callback negli schemi vanno definiti dall'applicazione. I listener mostrati nelle diverse sezioni sono alternative didattiche: non registrarli tutti insieme sullo stesso elemento.

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

- `event.target`: destinazione dell'evento, spesso un elemento figlio di quello cliccabile; con Shadow DOM puo essere ritargettizzato;
- `event.currentTarget`: oggetto sul quale sta venendo eseguito il listener, non necessariamente un elemento HTML.

`currentTarget` e disponibile durante il callback sincrono, poi torna `null`. Se serve dopo un `await`, salvalo subito in una variabile. Per usare `.closest()` verifica prima che `target` sia un `Element`.

---
### preventDefault
`preventDefault()` annulla l'azione predefinita solo per un evento cancellabile e da un listener non passivo. Non interrompe la propagazione. Un `return false` in un listener registrato con `addEventListener()` non ha questo effetto.

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
Il percorso di un evento DOM puo comprendere tre fasi:

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

Con `capture: false` (default), il listener viene eseguito al target o quando un evento risale verso il suo contenitore. Non tutti gli eventi fanno bubbling: `focus` e `blur`, per esempio, no; per delegarli valuta `focusin` e `focusout` o il capturing.

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

`stopPropagation()` non blocca gli altri listener sullo stesso target. `stopImmediatePropagation()` interrompe anche quelli successivi sul target corrente. Nessuno dei due annulla automaticamente l'azione predefinita.

---
### Event delegation
La delegazione consiste nel mettere un listener su un contenitore e gestire eventi dei figli.

```js
const list = document.querySelector("#list");

list.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
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
Per rimuovere un listener devono coincidere target, tipo di evento, riferimento della callback e valore di `capture`. Non serve ricreare lo stesso oggetto di opzioni; le altre opzioni non partecipano al confronto per la rimozione.

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

Registrare nuovamente la stessa callback con stesso tipo e `capture` non la duplica. Creare ogni volta una nuova arrow function invece aggiunge un listener distinto.

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
`DOMContentLoaded` scatta dopo il parsing e l'esecuzione degli script differiti. Per codice caricato in ritardo usa il controllo `readyState` descritto in [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]. Lo schema qui sotto richiede una funzione `initApp` e registrazione prima dell'evento.

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
| `click` | Attivazione con mouse, touch o tastiera su controlli nativi |
| `input` | Modifica del valore da parte dell'utente |
| `change` | Cambio valore confermato |
| `submit` | Invio form |
| `keydown` | Pressione tasto |
| `mouseover` | Mouse sopra elemento |
| `focus` | Elemento riceve focus |
| `blur` | Elemento perde focus |

Assegnare `input.value` da JavaScript non emette automaticamente `input` o `change`: richiama la logica di aggiornamento o emetti esplicitamente un evento se il contratto lo prevede.

### Listener asincroni

`addEventListener()` ignora il valore restituito, incluse le Promise. Gestisci quindi i rifiuti nel listener o con `.catch()`. Per un submit, chiama `preventDefault()` **prima** del primo `await`, quando l'evento e ancora in dispatch. L'esempio completo e in [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]].

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

Delegazione con pulsanti accessibili da tastiera. L'esempio rimuove una riga soltanto dalla UI, non da un database:

```html
<ul data-user-list>
  <li data-user-id="42">
    Ada
    <button type="button" data-action="delete"><span>Rimuovi</span></button>
  </li>
</ul>
```

```js
function mountUserList(list) {
  if (!(list instanceof Element)) {
    throw new TypeError("Lista DOM mancante");
  }

  const controller = new AbortController();
  list.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-action='delete']");
    if (!button || button.closest("[data-user-list]") !== list) return;

    const item = button.closest("[data-user-id]");
    if (!item || item === list || !list.contains(item)) return;

    item.remove();
  }, { signal: controller.signal });

  return () => controller.abort();
}

const cleanupUserList = mountUserList(document.querySelector("[data-user-list]"));
// Allo smontaggio dell'interfaccia: cleanupUserList();
```

Un solo listener gestisce righe aggiunte dopo la registrazione e click su un figlio del pulsante. Le liste annidate sono escluse dalla gestione del contenitore esterno. Registra una sola volta, oppure esegui il cleanup prima di registrare di nuovo. Per cancellare sul server servono autorizzazione e gestione di attesa/errori, non solo `item.remove()`.

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

- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Web Components|Web Components]]


## Fonti

- [MDN: addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
- [MDN: removeEventListener e capture](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener).
- [MDN: durata di currentTarget](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget).
- [MDN: preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault).
- [MDN: stopPropagation](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation).
- [MDN: evento input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event).
- [MDN: evento submit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event).
- [MDN: DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
