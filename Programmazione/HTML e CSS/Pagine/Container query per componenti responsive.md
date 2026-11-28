---
date: 2026-11-27
title: "Container query per componenti responsive"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, container-query, responsive]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
---

# Container query per componenti responsive

## Sintesi

Una media query sulla larghezza risponde a «quanto è larga la finestra?». Una **size container query** risponde invece a «quanto spazio ha ricevuto questo componente?». La distinzione conta quando la stessa scheda appare nel corpo della pagina e in una colonna laterale: la finestra è identica, lo spazio disponibile no.

## Esempio: lo stesso componente in due colonne di larghezza diversa

```html
<div class="slot">
  <article class="scheda"><h2>Corso HTML</h2><p>Inizio: lunedì</p></article>
</div>
<div class="slot slot-stretto">
  <article class="scheda"><h2>Corso CSS</h2><p>Inizio: martedì</p></article>
</div>
```

```css
.slot {
  container: corso / inline-size;
  inline-size: min(100%, 36rem);
}
.slot-stretto { inline-size: min(100%, 17rem); }

.scheda {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  overflow-wrap: anywhere;
}

@container corso (inline-size >= 28rem) {
  .scheda { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}
```

`container: corso / inline-size` dà **un nome** al contenitore e consente di interrogarne la dimensione lungo l'asse del testo (la larghezza nella scrittura orizzontale dell'esempio). La regola interna cambia la griglia **dell'articolo discendente**. A parità di finestra, nel contenitore largo titolo e data si affiancano; in quello stretto la data va sotto. I due contenitori sono impilati nella demo: non serve costruire un'intera pagina con sidebar per osservare la differenza.

## Prova al confine

1. Con font radice di 16 px e una finestra più larga di 600 px, il primo contenitore arriva a 576 px e il secondo a 272 px. Solo il primo supera la soglia di 448 px.
2. Senza toccare la finestra, imposta temporaneamente `inline-size: 447px` sul primo `.slot`, poi `448px`. La scheda passa da una a due colonne esattamente alla seconda misura: l'operatore `>=` include la soglia.
3. Ripristina gli stili e restringi l'intera finestra a 320 px: entrambi i componenti tornano a una colonna. Anche senza la regola condizionale, il layout di base è leggibile.

## Se la query non scatta

- Ispeziona **l'antenato**, non la finestra: occorre un contenitore idoneo per l'asse richiesto. Se più antenati idonei si chiamano `corso`, si interroga il più vicino, non il primo abbastanza largo.
- Una size query non applica stili al contenitore in base alla **sua stessa** misura. Se sposti la dichiarazione `container` sull'articolo e non c'è un altro antenato idoneo, non puoi cambiare in questo modo le colonne dell'articolo stesso.
- Il contenimento sull'asse inline modifica il dimensionamento intrinseco: fai assegnare lo spazio al contenitore dal layout esterno. Qui la misura viene da `.slot`; non ci si aspetta che sia il testo dei figli a definirla.
- Se devi cambiare la navigazione dell'intera pagina al variare della finestra, resta appropriata una media query. Se vuoi solo far entrare più schede uguali su una riga, valuta prima Grid con `auto-fit`.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]
- [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]

## Fonti

- [CSSWG: selezione del contenitore e regola @container](https://www.w3.org/TR/css-conditional-5/#container-rule)
- [CSSWG: caratteristiche dimensionali interrogabili](https://www.w3.org/TR/css-conditional-5/#size-container)
