---
date: 2026-11-27
title: "HTML e CSS - Box testo e cascata"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [promemoria, css, cascata]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
  - "[[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Tipografia e spaziatura in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
  - "[[Programmazione/HTML e CSS/Pagine/Proprietà personalizzate e var in CSS|Proprietà personalizzate e var in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Livelli della cascata con layer|Livelli della cascata con layer]]"
---

# HTML e CSS - Box testo e cascata

## Uso rapido

Regole da copiare nel foglio CSS. Sostituisci i nomi delle classi con quelli del progetto.

## Limitare un blocco di testo

Assegna `.testo` al contenitore: il padding resta compreso nella larghezza massima.

```css
.testo {
  box-sizing: border-box;
  max-inline-size: 65ch;
  padding-inline: 1rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]] · [[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Tipografia e spaziatura in CSS]].

## Dare una larghezza a un'etichetta inline

Assegna `.sigla` a uno `span`: resta sulla riga se c’è spazio.

```css
.sigla {
  display: inline-block;
  inline-size: 5rem;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]].

## Sovrascrivere un colore senza aumentare la specificità

Dichiara l’ordine prima delle altre regole dei layer. Un antenato può impostare `--inchiostro` per personalizzare il tema.

```css
@layer base, tema;
@layer base {
  .catalogo .avviso { color: #222; }
}
@layer tema {
  .avviso { color: var(--inchiostro, #872800); }
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]] · [[Programmazione/HTML e CSS/Pagine/Proprietà personalizzate e var in CSS|Proprietà personalizzate e var in CSS]] · [[Programmazione/HTML e CSS/Pagine/Livelli della cascata con layer|Livelli della cascata con layer]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [CSSWG: cascata e layer](https://www.w3.org/TR/css-cascade-5/)
- [CSSWG: box-sizing](https://www.w3.org/TR/css-sizing-3/#box-sizing)
