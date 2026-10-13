---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - promemoria
  - dom
  - eventi
aliases:
  - Cheatsheet DOM JavaScript
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]"
title: JavaScript - DOM ed eventi
---

# JavaScript - DOM ed eventi

## Uso rapido

Browser, dopo la disponibilita degli elementi. Dove compaiono `element`, `list`, `container`, `button` o `form`, sono riferimenti DOM gia controllati: adatta i selettori al tuo HTML. I blocchi sono indipendenti salvo indicazione.

## Selezionare elementi

```javascript
const element = document.querySelector("#user")
const elements = document.querySelectorAll(".user")
const input = document.getElementById("email")
```

`querySelector`/`getElementById` possono restituire `null`. `querySelectorAll` restituisce una NodeList statica, anche vuota.

## Creare e inserire

`user.name` e una stringa:

```javascript
const item = document.createElement("li")
item.textContent = user.name
list.append(item)
```

Alternative a `append`, non istruzioni da eseguire tutte:

```javascript
container.prepend(item)
```

```javascript
reference.before(item)
```

```javascript
reference.after(item)
```

Un nodo gia nel DOM viene **spostato**, non copiato. `textContent` inserisce testo, non HTML; assegnarlo a un contenitore ne sostituisce i figli.

## Modificare

```javascript
element.textContent = "Nuovo testo"
element.classList.add("active")
element.classList.remove("hidden")
element.classList.toggle("selected")
element.classList.contains("active")
```

```javascript
element.setAttribute("aria-label", "Chiudi")
element.getAttribute("aria-label") // stringa o null
element.removeAttribute("hidden")
element.dataset.userId = "42"     // dataset contiene stringhe
```

Per campi form usa `input.value` e `checkbox.checked` per lo stato corrente. Per nascondere usa `element.hidden = true`; `hidden="false"` nasconde comunque, essendo un attributo booleano.

## Rimuovere

Rimuove il nodo:

```javascript
element.remove()
```

Rimuove **tutti** i figli del contenitore:

```javascript
container.replaceChildren()
```

## Listener e cleanup

```javascript
function handleClick(event) {
  console.log(event.currentTarget)
}
button.addEventListener("click", handleClick)
button.removeEventListener("click", handleClick)
```

Servono stesso evento, riferimento della funzione e valore `capture`. Rimozione qui immediata solo a scopo dimostrativo; in un'app avviene al cleanup. `currentTarget` torna `null` dopo il callback: salvalo prima di un `await`.

Una volta sola, con `handler` gia definita:

```javascript
button.addEventListener("click", handler, { once: true })
```

Alternativa con controller, annullato al cleanup:

```javascript
const controller = new AbortController()
button.addEventListener("click", handleClick, { signal: controller.signal })
controller.abort()
```

## Impedire il comportamento predefinito

Form con controlli `name="tag"`; e un demo locale, non effettua invii:

```javascript
form.addEventListener("submit", (event) => {
  event.preventDefault()
  const data = new FormData(event.currentTarget)
  const tags = data.getAll("tag")
  console.log(tags)
})
```

`preventDefault` richiede evento cancellabile e listener non passivo; non ferma la propagazione. `Object.fromEntries(data)` perde i valori ripetuti dello stesso nome: per checkbox/gruppi usa `getAll`. Non loggare credenziali o dati personali.

## Delegazione con confine locale

HTML minimo:

```html
<ul data-user-list>
  <li data-user-id="42">
    Ada <button type="button" data-action="delete"><span>Rimuovi</span></button>
  </li>
</ul>
```

Rimuove solo la riga nel DOM, **non** dati sul server; `list` e la lista selezionata:

```javascript
list.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest("[data-action='delete']")
  if (!button || button.closest("[data-user-list]") !== list) return

  const item = button.closest("[data-user-id]")
  if (!item || item === list || !list.contains(item)) return
  item.remove()
})
```

Il controllo della lista piu vicina evita di gestire pulsanti di liste annidate.

## Attendere il DOM, anche dopo il caricamento

Definisci `initialize` prima del frammento:

```javascript
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true })
} else {
  initialize()
}
```

Uno script modulo non `async` presente nell'HTML viene differito. Per import dinamico o caricamento tardivo, `DOMContentLoaded` potrebbe essere gia passato.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/BOM|BOM]]

## Fonti

- [MDN: DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event).

## Navigazione

- [[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|Indice Promemoria JavaScript]]
