---
date: 2026-07-30
area: Programmazione
topic: Promemoria JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [javascript, promemoria, dom, eventi]
aliases: [Cheatsheet DOM JavaScript]
prerequisites: []
related:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi]]"
---

# JavaScript - DOM ed eventi

## Selezionare elementi

```javascript
const element = document.querySelector("#user")
const elements = document.querySelectorAll(".user")
```

```javascript
const input = document.getElementById("email")
```

`querySelector()` puo restituire `null`.

## Creare e inserire

```javascript
const item = document.createElement("li")
item.textContent = user.name

list.append(item)
container.prepend(item)
reference.before(item)
reference.after(item)
```

Preferire `textContent` per testo non affidabile.

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
element.getAttribute("aria-label")
element.removeAttribute("hidden")
```

```javascript
element.dataset.userId
element.dataset.userId = "42"
```

## Rimuovere

```javascript
element.remove()
container.replaceChildren()
```

## Evento

```javascript
function handleClick(event) {
  console.log(event.currentTarget)
}

button.addEventListener("click", handleClick)
button.removeEventListener("click", handleClick)
```

Per rimuovere un listener serve lo stesso riferimento alla funzione.

## Impedire il comportamento predefinito

```javascript
form.addEventListener("submit", (event) => {
  event.preventDefault()

  const data = new FormData(event.currentTarget)
  console.log(Object.fromEntries(data))
})
```

## Delegazione

```javascript
list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='delete']")

  if (!button || !list.contains(button)) {
    return
  }

  deleteItem(button.dataset.id)
})
```

## Evento eseguito una volta

```javascript
button.addEventListener("click", handler, { once: true })
```

## Attendere il DOM

```javascript
document.addEventListener("DOMContentLoaded", initialize)
```

Con uno script `type="module"` posto normalmente nella pagina spesso non e necessario.

## Approfondimento

- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/BOM]]
