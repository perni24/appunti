---
date: 2026-11-27
title: "Z-index e contesti di sovrapposizione"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, z-index, layout]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
  - "[[Programmazione/React/Pagine/Portals|Portals in React]]"
---

# Z-index e contesti di sovrapposizione

## Sintesi

`z-index` non è una graduatoria globale. Il browser disegna ogni **stacking context** (contesto di sovrapposizione) come un gruppo: ordina i suoi discendenti all'interno del gruppo e confronta il gruppo intero con gli altri al livello superiore. Un'etichetta con `z-index: 999` può quindi finire dietro a un pannello con `z-index: 2`.

## Esempio: perché 999 perde contro 2?

```html
<div class="anteprima">
  <span class="etichetta">Anteprima</span>
</div>
<div class="strumenti">Strumenti</div>
```

```css
.anteprima {
  position: relative;
  z-index: 1;
  block-size: 5rem;
  background: #e8f1ef;
}

.etichetta {
  position: absolute;
  z-index: 999;
  inset-block-end: 0;
  inset-inline-start: 1rem;
  padding: 0.25rem;
  background: white;
}

.strumenti {
  position: relative;
  z-index: 2;
  margin-block-start: -2rem;
  padding: 1rem;
  background: #ddd;
}
```

Il margine negativo crea un'area comune. A quel punto il browser confronta **anteprima (1)** e **strumenti (2)**. Nella zona condivisa vince strumenti, a prescindere dal 999 dentro anteprima. Cambia solo `z-index: 1` in `auto`: con il resto del CSS invariato, `.anteprima` smette di creare il proprio contesto. Rimane però il riferimento di posizione dell'etichetta, che ora si vede **nello stesso punto** sopra strumenti. Mettere `0` al posto di `auto` non funziona: il valore intero crea ancora un contesto per quel blocco posizionato.

## Diagnosi quando un elemento scompare

1. **C'è una vera sovrapposizione?** Controlla i rettangoli in DevTools. Se non si intersecano, modificare l'ordine di disegno non avvicinerà gli elementi.
2. **In quali contesti si trovano?** Risali dai due elementi fino al primo contesto comune. Oltre a `relative` o `absolute` con `z-index` intero, anche `fixed`, `sticky`, `opacity` minore di 1, `transform` diverso da `none` e `isolation: isolate` possono creare contesti. Un figlio diretto di Flexbox o Grid può usare `z-index` anche senza `position: relative`.
3. **È ordine di disegno o ritaglio?** Un discendente posizionato rispetto a un pannello con `overflow: hidden` può essere tagliato al bordo del pannello: alzare il suo `z-index` non annulla il ritaglio.
4. **Deve coprire davvero l'intera pagina?** Per una finestra modale nativa, un `dialog` aperto con `showModal()` entra nel *top layer* del browser. Non è l'equivalente di un `div` con un numero molto alto, né del semplice attributo `open` sul dialogo.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Dialoghi e popover nativi in HTML|Dialoghi e popover nativi in HTML]]
- [[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]
- [[Programmazione/React/Pagine/Portals|Portals in React]]

## Fonti

- [W3C: ordine locale e contesti di sovrapposizione](https://www.w3.org/TR/CSS22/visuren.html#z-index)
- [CSSWG: ordine di disegno e top layer](https://www.w3.org/TR/css-position-4/#top-layer)
- [CSSWG: ordine di disegno degli elementi Grid](https://www.w3.org/TR/css-grid-1/#z-order)
