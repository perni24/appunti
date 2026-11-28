---
date: 2026-11-27
title: "Box model e dimensionamento"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, box-model, dimensioni]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
---

# Box model e dimensionamento

## Sintesi

Ogni elemento genera uno o più box. Per un normale blocco, dall'interno verso l'esterno si incontrano **contenuto → padding → bordo → margine**. Il padding separa il testo dal bordo; il margine separa il box da ciò che lo circonda. `box-sizing` stabilisce a quale parte del box si riferisce la larghezza dichiarata.

## Esempio: perché 240 pixel diventano 276?

```html
<p class="misura">Larghezza da verificare in DevTools.</p>
```

```css
.misura {
  box-sizing: content-box;
  width: 240px;
  padding: 16px;
  border: 2px solid;
  margin: 8px;
}
```

- Con `content-box`, da bordo a bordo: `240 + 16 × 2 + 2 × 2 = 276px`. I margini restano fuori.
- Cambiando solo `box-sizing` in `border-box`, il box da bordo a bordo è `240px` e il contenuto dispone di `204px`. Il testo può andare a capo prima anche se il numero dichiarato non è cambiato.

## Scegliere dimensioni che si adattino

Una `width: 100%` con `content-box` può far uscire padding e bordo dal contenitore. `border-box` li comprende, **non comprende i margini**. Per non incollare il contenuto ai lati spesso è più semplice mettere il padding sul genitore. Usare `max-width` per un limite massimo e lasciare l'altezza automatica quando il testo può crescere.

Le unità descrivono vincoli diversi: `px` è un pixel CSS, `rem` dipende dalla dimensione del carattere radice, una percentuale di larghezza dipende normalmente dalla larghezza del contenitore. Non fissare l'altezza in pixel solo per far sembrare uguali due blocchi di testo.

## Verifica

Selezionare il paragrafo negli strumenti di sviluppo e leggere il diagramma del box. Cambiare `box-sizing` e verificare separatamente contenuto e bordo: guardare solo la dichiarazione `width` non dice quanto spazio occupi il box visibile.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Dimensionamento intrinseco in CSS|Dimensionamento intrinseco in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]

## Fonti

- [W3C: CSS Box Model](https://www.w3.org/TR/css-box-3/)
- [W3C: box-sizing e dimensionamento](https://www.w3.org/TR/css-sizing-3/)
