---
date: 2026-11-27
title: "HTML e CSS - Focus decorazioni e movimento"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [promemoria, css, accessibilita]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
  - "[[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]"
  - "[[Programmazione/HTML e CSS/Pagine/Pseudo-elementi before e after in CSS|Pseudo-elementi before e after in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Transizioni CSS tra stati|Transizioni CSS tra stati]]"
  - "[[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]]"
---

# HTML e CSS - Focus decorazioni e movimento

## Uso rapido

Gli stati e i messaggi devono restare comprensibili anche senza movimento o decorazioni.

## Rendere visibile il focus

Applica `.azione` a un link con `href` o a un pulsante. Prova il contorno con `Tab` sullo sfondo reale.

```css
.azione:focus-visible {
  outline: 3px solid #005a9c;
  outline-offset: 3px;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]] · [[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]].

## Aggiungere una linea decorativa

Il titolo resta nell’HTML. La linea non contiene parole indispensabili.

```css
.titolo::after {
  content: "";
  display: block;
  inline-size: 3rem;
  border-block-start: 2px solid currentColor;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Pseudo-elementi before e after in CSS|Pseudo-elementi before e after in CSS]].

## Accompagnare un cambio di stato

Per un link `.voce` su sfondo bianco. Lo stato si applica anche con movimento ridotto.

```css
.voce { color: #222; }
.voce:is(:hover, :focus-visible) { color: #005a75; }
@media (prefers-reduced-motion: no-preference) {
  .voce { transition: color 180ms ease-out; }
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Transizioni CSS tra stati|Transizioni CSS tra stati]] · [[Programmazione/HTML e CSS/Pagine/Selettori relazionali e specificità in CSS|Selettori relazionali e specificità in CSS]].

## Animare soltanto all'apertura

Assegna `.istruzioni` a un `details` con un paragrafo figlio diretto. Il testo non dipende dall’animazione.

```css
@keyframes entra {
  from { transform: translateY(0.5rem); }
  to { transform: translateY(0); }
}
@media (prefers-reduced-motion: no-preference) {
  .istruzioni[open] > p { animation: entra 200ms ease-out 1; }
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [W3C WAI: focus visibile](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [W3C WAI: preferenza di movimento](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)
