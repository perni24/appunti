---
date: 2026-11-27
title: "HTML e CSS - Flexbox Grid e layout responsive"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [promemoria, css, layout]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
  - "[[Programmazione/HTML e CSS/Pagine/Container query per componenti responsive|Container query per componenti responsive]]"
---

# HTML e CSS - Flexbox Grid e layout responsive

## Uso rapido

Applica la classe al genitore: Flexbox e Grid dispongono i suoi figli diretti.

## Mandare a capo una barra di azioni

Usa `.azioni` sul contenitore dei pulsanti.

```css
.azioni {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]].

## Creare colonne senza breakpoint

Con `.elenco` sul genitore, aggiungi un figlio per scheda. Sotto 14rem anche una sola traccia può restringersi.

```css
.elenco {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]].

## Cambiare il layout rispetto alla finestra

Applica `.pagina` al genitore di indice e contenuto. Nell’HTML mantieni l’ordine di lettura.

```css
.pagina { display: grid; gap: 1rem; }
@media (min-width: 48em) {
  .pagina { grid-template-columns: 12rem minmax(0, 1fr); }
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]].

## Cambiare il layout rispetto alla colonna

Usa `.spazio` sul contenitore e `.scheda` su un suo discendente con due figli.

```css
.spazio { container: corso / inline-size; }
.scheda { display: grid; gap: 1rem; }
@container corso (inline-size >= 28rem) {
  .scheda { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Container query per componenti responsive|Container query per componenti responsive]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [CSSWG: Grid](https://www.w3.org/TR/css-grid-1/)
- [CSSWG: container query](https://www.w3.org/TR/css-conditional-5/#container-rule)
