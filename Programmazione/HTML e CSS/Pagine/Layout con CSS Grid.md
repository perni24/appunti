---
date: 2026-11-27
title: "Layout con CSS Grid"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, grid, layout]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
---

# Layout con CSS Grid

## Sintesi

Grid definisce **tracce condivise**: le celle in righe diverse rispettano le stesse colonne. Sceglierla per un catalogo allineato, una matrice o una pagina con pannelli. Se basta allineare le azioni dentro una singola cella, quella cella può usare Flexbox.

## Esempio: colonne che si adattano allo spazio disponibile

```html
<ul class="catalogo">
  <li>HTML semantico</li>
  <li>Box model</li>
  <li>Flexbox</li>
  <li>CSS Grid</li>
</ul>
```

```css
.catalogo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.catalogo > li {
  border: 1px solid;
  padding: 0.75rem;
  overflow-wrap: anywhere;
}
```

`auto-fit` fa entrare quante colonne ci stanno e collassa le tracce ripetute vuote; `1fr` distribuisce lo spazio residuo. Il minimo è `14rem` oppure, se il catalogo è più stretto, `100%` della sua larghezza. Senza `min(100%, 14rem)` una sola colonna potrebbe essere comunque più larga del contenitore.

## Prevedere il risultato

Con `1rem = 16px`, il minimo usuale è 224px e il gap 16px. Due colonne richiedono almeno `224 × 2 + 16 = 464px` **nel contenitore**. A 460px ci sarà una colonna; a 480px ce ne saranno due, ciascuna larga 232px. La finestra può essere ampia ma il catalogo stare in una sidebar stretta: conta lo spazio assegnato alla griglia.

## Errore comune

`1fr` non significa sempre «una colonna che può restringersi fino a zero»: il contenuto può imporre un minimo. In una griglia a due colonne uguali, `repeat(2, minmax(0, 1fr))` permette alle tracce di restringersi; decidere comunque come testo e immagini si adattano. In DevTools attivare l'overlay Grid per distinguere i bordi delle celle dalle tracce e dai gap.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Diagnosticare overflow in Flexbox e Grid|Diagnosticare overflow in Flexbox e Grid]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]

## Fonti

- [W3C: Grid Layout, track sizing e auto-repeat](https://www.w3.org/TR/css-grid-2/)
