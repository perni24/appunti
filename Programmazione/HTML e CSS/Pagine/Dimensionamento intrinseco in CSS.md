---
date: 2026-11-27
title: "Dimensionamento intrinseco in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [css, layout, dimensionamento]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
  - "[[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Diagnosticare overflow in Flexbox e Grid|Diagnosticare overflow in Flexbox e Grid]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
---

# Dimensionamento intrinseco in CSS

## Sintesi

Il box model spiega *che cosa* misuri. Il dimensionamento intrinseco risponde a un'altra domanda: **quanto spazio chiederebbe questo contenuto?** Per il testo, la risposta dipende dalle parole, dal font e da dove è permesso andare a capo. Il contenitore può avere una larghezza assegnata diversa da quella richiesta.

## Esperimento: la stessa frase in tre box

```html
<div class="campione">
  <p class="minimo">uno quattro tre</p>
  <p class="massimo">uno quattro tre</p>
  <p class="adattato">uno quattro tre</p>
</div>
```

```css
.campione { font: 20px/1.4 monospace; inline-size: 10ch; }
.campione p { margin: 0; outline: 1px solid; }
.minimo   { inline-size: min-content; }
.massimo  { inline-size: max-content; }
.adattato { inline-size: fit-content; }
```

Il font monospaziato rende il confronto leggibile in unità `ch`. La frase occupa 15 caratteri spazi inclusi; la parola più lunga, «quattro», ne occupa 7. I contorni non partecipano al dimensionamento.

| Valore | Larghezza attesa nel contenitore da 10ch | Perché |
| --- | --- | --- |
| `min-content` | 7ch | Usa le occasioni di andare a capo; senza spezzare le parole il segmento più lungo detta il minimo. |
| `max-content` | 15ch | Misura la frase senza sfruttare gli a capo facoltativi. Il box supera il contenitore. |
| `fit-content` | 10ch | Usa lo spazio disponibile, ma non scende sotto il minimo intrinseco né supera il massimo intrinseco. |

## Verificare i due limiti

Cambia la misura di `.campione` da `10ch` a `20ch`: il box `.adattato` si ferma a **15ch**. Riducila poi a `5ch`: il box resta largo **7ch** e sporge. Nel caso semplice dell'esempio la regola è `min(max-content, max(min-content, spazio disponibile))`. Qui `fit-content` è la **parola chiave** usata come dimensione del box, non la funzione `fit-content(...)` per limitare una traccia Grid.

## Quando il minimo cambia

- Con `white-space: nowrap` su `.minimo` gli spazi non offrono più occasioni di ritorno a capo: in questa frase il minimo sale da 7ch a 15ch.
- Con il normale ritorno a capo, `overflow-wrap: anywhere` introduce opportunità di spezzare anche una stringa indivisibile, considerate nel calcolo di `min-content`. `overflow-wrap: break-word` può spezzare il testo in un box già stretto, ma le opportunità aggiunte **non** riducono quel minimo intrinseco.
- Non confondere `min-content` con `min-inline-size: 0`: il primo misura una richiesta del contenuto; il secondo rimuove un vincolo minimo sul box. Non decide da solo come mandare a capo il testo.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]
- [[Programmazione/HTML e CSS/Pagine/Diagnosticare overflow in Flexbox e Grid|Diagnosticare overflow in Flexbox e Grid]]

## Fonti

- [CSSWG: dimensioni intrinseche e fit-content](https://www.w3.org/TR/css-sizing-3/#intrinsic-sizes)
- [CSSWG: effetto di overflow-wrap sul dimensionamento minimo](https://www.w3.org/TR/css-text-3/#overflow-wrap-property)
