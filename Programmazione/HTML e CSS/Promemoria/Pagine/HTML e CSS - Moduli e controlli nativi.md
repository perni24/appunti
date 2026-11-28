---
date: 2026-11-27
title: "HTML e CSS - Moduli e controlli nativi"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [promemoria, html, form]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]"
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]]"
---

# HTML e CSS - Moduli e controlli nativi

## Uso rapido

Frammenti HTML indipendenti. `for` punta all’`id`; `name` diventa la chiave inviata.

## Inviare una ricerca

Sostituisci `./cerca` con un endpoint esistente. Il modulo usa l’URL, quindi non inserirvi segreti.

```html
<form action="./cerca" method="get">
  <label for="query">Cerca negli appunti</label>
  <input id="query" type="search" name="q" required>
  <button type="submit">Cerca</button>
</form>
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]].

## Raccogliere una scelta esclusiva

Inserisci il gruppo nel tuo form. Selezionare «Online» produce `modalita=online`.

```html
<fieldset>
  <legend>Modalità</legend>
  <label><input type="radio" name="modalita" value="aula" required> In aula</label>
  <label><input type="radio" name="modalita" value="online"> Online</label>
</fieldset>
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]].

## Mostrare dettagli senza JavaScript

Con il focus sul riepilogo, premi `Invio` per aprire o chiudere.

```html
<details>
  <summary>Requisiti del corso</summary>
  <p>Serve un browser con strumenti di sviluppo.</p>
</details>
```

Teoria: [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]] · [[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [WHATWG: moduli](https://html.spec.whatwg.org/multipage/forms.html)
- [WHATWG: details e summary](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element)
