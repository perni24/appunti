---
date: 2026-11-27
title: "Posizionamento sticky e fixed in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, position, scroll]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
  - "[[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]"
---

# Posizionamento sticky e fixed in CSS

## Sintesi

Usa `sticky` per l'intestazione che deve restare leggibile **mentre scorre la sua sezione**, lasciando poi il posto alla successiva. Usa `fixed` quando un elemento deve restare nella stessa posizione dello schermo anche dopo che la sua sezione è uscita di vista. Il primo occupa posto nel flusso, il secondo no.

## Esempio: un calendario in un pannello scorrevole

```html
<h2 id="indice">Calendario dei corsi</h2>
<div class="calendario" role="region" aria-label="Giornate dei corsi" tabindex="0">
  <section>
    <h3>Lunedì</h3>
    <ul><li>09:00 HTML</li><li>11:00 CSS</li><li>14:00 Esercizi</li></ul>
  </section>
  <section>
    <h3>Martedì</h3>
    <ul><li>09:00 Layout</li><li>11:00 Moduli</li><li>14:00 Laboratorio</li></ul>
  </section>
</div>
<a class="torna" href="#indice">Torna al calendario</a>
```

```css
.calendario {
  block-size: 10rem;
  overflow: auto;
  border: 1px solid;
}

.calendario h3 {
  position: sticky;
  inset-block-start: 0;
  margin: 0;
  background: white;
  color: #222;
}

.calendario li { padding-block: 1rem; }

.torna {
  position: fixed;
  inset-block-end: 1rem;
  inset-inline-end: 1rem;
}
```

Durante lo scorrimento del **pannello**, «Lunedì» rimane in alto. Avvicinandosi alla fine della prima `section`, il titolo deve restare dentro la sua sezione: esce e subentra «Martedì». Il riferimento per lo scorrimento è il pannello; il limite di movimento del titolo è la sezione. Il collegamento, invece, resta nell'angolo della finestra. Il pannello ha un nome e può ricevere il focus: prova anche a entrarci con `Tab` e a scorrere con le frecce.

## Se non si comporta così

- **Il titolo scorre via subito:** togli `inset-block-start: 0` per riprodurre il problema. Se entrambi gli inset dell'asse sono `auto`, su quell'asse non c'è una soglia sticky.
- **Il titolo non arriva mai alla soglia:** controlla quale antenato crea il contenitore di scorrimento e se c'è spazio per muoversi. Un involucro con `overflow: hidden` può diventare il riferimento anche senza barre visibili.
- **Il link fixed segue un riquadro anziché la finestra:** cerca un antenato con `transform` diverso da `none`. Su un normale blocco trasformato anche un discendente fixed può usare quel blocco come riferimento. Il solo `position: relative` sull'antenato non produce questo effetto.
- **Un elemento fissato copre contenuti o focus:** controlla a larghezza ridotta e con testo ingrandito. Riserva spazio se il controllo deve restare visibile, oppure riportalo nel flusso; alzare `z-index` non libera spazio.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]
- [[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]

## Fonti

- [CSSWG: posizionamento sticky e limiti di scorrimento](https://www.w3.org/TR/css-position-3/#sticky-pos)
- [CSSWG: contenitori di scorrimento e proprietà overflow](https://www.w3.org/TR/css-overflow-3/#overflow-properties)
- [CSSWG: trasformazioni e discendenti fixed](https://www.w3.org/TR/css-transforms-1/#transform-rendering)
