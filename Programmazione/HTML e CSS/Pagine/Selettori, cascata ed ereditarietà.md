---
date: 2026-11-27
title: "Selettori, cascata ed ereditarietà"
area: Programmazione
topic: HTML e CSS
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, selettori, cascata]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
  - "[[Programmazione/React/Pagine/CSS Modules|CSS Modules]]"
---

# Selettori, cascata ed ereditarietà

## Sintesi

Se due regole assegnano colori diversi allo stesso elemento, il browser non sceglie semplicemente «l'ultima». Prima controlla quali selettori corrispondono; la **cascata** decide tra le dichiarazioni applicabili alla stessa proprietà. L'**ereditarietà** risponde a un'altra domanda: quale valore usa il figlio quando non ne riceve uno direttamente?

## Esempio: quale colore avrà il titolo?

```html
<article class="scheda">
  <h2 class="titolo">HTML semantico</h2>
  <p>Ordine dei titoli e navigazione da tastiera.</p>
</article>
```

```css
.scheda {
  color: #254631;
  border: 1px solid;
}
.scheda .titolo { color: #143e68; }
.titolo { color: #953900; }
```

Il titolo diventa blu (`#143e68`): due selettori di classe hanno più specificità di uno. Il paragrafo eredita il verde della scheda perché `color` è ereditata e sul paragrafo non è dichiarata. Il bordo resta sulla scheda: `border` non si eredita per impostazione predefinita.

## Leggere un selettore

| Selettore | Cosa seleziona |
| --- | --- |
| `h2` | Tutti gli elementi di quel tipo. |
| `.scheda .titolo` | Un elemento con classe `titolo` discendente di una `scheda`. Lo spazio conta. |
| `.scheda.titolo` | Lo stesso elemento deve avere entrambe le classi. |
| `.scheda > p` | Solo i paragrafi figli diretti della scheda. |

## Quando decide l'ordine

La specificità si confronta **dopo** origine, importanza ed eventuale precedenza dei layer. Nel caso ordinario di regole autore non stratificate, a pari specificità e nelle stesse condizioni vince l'ultima dichiarazione. Per provarlo, sostituire `.scheda .titolo` con `.titolo`: il titolo diventa arancione. In DevTools, *Styles* mostra le dichiarazioni concorrenti, *Computed* il valore risultante. Verificare prima il selettore e l'origine, anziché aggiungere `!important`.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori relazionali e specificità in CSS|Selettori relazionali e specificità in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Proprietà personalizzate e var in CSS|Proprietà personalizzate e var in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Livelli della cascata con layer|Livelli della cascata con layer]]
- [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]

## Fonti

- [W3C: cascata ed ereditarietà](https://www.w3.org/TR/css-cascade-5/)
- [W3C: selettori e specificità](https://www.w3.org/TR/selectors-4/)
