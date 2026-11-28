---
date: 2026-11-27
title: "HTML e CSS - Posizione e sovrapposizione"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [promemoria, css, position]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento sticky e fixed in CSS|Posizionamento sticky e fixed in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]"
---

# HTML e CSS - Posizione e sovrapposizione

## Uso rapido

Scegli prima il riferimento: un genitore, il pannello che scorre o la finestra.

## Ancorare un'etichetta a un pannello

Usa `.stato` dentro `.pannello`. Per etichette lunghe preferisci un layout nel flusso.

```css
.pannello { position: relative; padding-block-start: 2.5rem; }
.stato {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.75rem;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]].

## Tenere il titolo in vista durante lo scroll

Metti un titolo `.intestazione` e contenuto abbastanza lungo dentro `.risultati`.

```css
.risultati { max-block-size: 16rem; overflow: auto; }
.intestazione {
  position: sticky;
  inset-block-start: 0;
  background: white;
  color: #222;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Posizionamento sticky e fixed in CSS|Posizionamento sticky e fixed in CSS]].

## Ordinare due livelli locali

Applica `.anteprima` al genitore e `.velo` a un figlio decorativo. Il livello resta locale e non intercetta il puntatore.

```css
.anteprima { position: relative; isolation: isolate; }
.velo {
  position: absolute;
  inset: 0;
  z-index: 1;
  box-shadow: inset 0 0 0 2px #526878;
  pointer-events: none;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [CSSWG: posizione e riferimenti](https://www.w3.org/TR/css-position-3/)
- [W3C: z-index](https://www.w3.org/TR/CSS22/visuren.html#z-index)
