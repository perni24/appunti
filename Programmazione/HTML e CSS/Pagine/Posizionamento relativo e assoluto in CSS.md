---
date: 2026-11-27
title: "Posizionamento relativo e assoluto in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, layout, position]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento sticky e fixed in CSS|Posizionamento sticky e fixed in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
---

# Posizionamento relativo e assoluto in CSS

## Sintesi

Un elemento nel **flusso normale** occupa spazio: chi viene dopo si dispone tenendone conto. `position: relative` permette di spostarlo visivamente senza spostare quello spazio. `position: absolute`, invece, lo toglie dal flusso: gli altri elementi non gli riservano posto. La scelta dipende da una domanda: **se questo testo va a capo, deve spingere in basso quello successivo?** Se sì, lascialo nel flusso.

## Esempio: un'etichetta nell'angolo della scheda

```html
<article class="scheda">
  <span class="stato">Bozza</span>
  <h2>Manuale CSS</h2>
  <p>Guida per chi impagina gli appunti.</p>
</article>
<p>Questa riga viene dopo la scheda.</p>
```

```css
.scheda {
  position: relative;
  max-inline-size: 24rem;
  border: 2px solid;
  padding: 2.5rem 1rem 1rem;
}

.stato {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 12px;
}
```

La scheda è il **blocco di riferimento** (*containing block*) dell'etichetta: in questo caso è l'antenato posizionato più vicino. Con la normale scrittura orizzontale da sinistra a destra, l'etichetta sta 8 px sotto e 12 px a sinistra del bordo interno della scheda. Le proprietà logiche seguono la direzione del testo: con `dir="rtl"`, `inset-inline-end` si riferisce a sinistra. Il padding superiore è una scelta dell'autore per lasciare posto alla scritta; non è l'etichetta a far crescere la scheda.

## Tre esperimenti in DevTools

1. Cambia `position: relative` della scheda in `static` (il valore iniziale). Nell'esempio non rimangono antenati che stabiliscano un riferimento per `absolute`: l'etichetta si posiziona rispetto al blocco iniziale, non rispetto alla scheda. In una pagina reale anche proprietà come `transform` possono stabilire il riferimento.
2. Ripristina `relative` sulla scheda e aggiungi `top: 16px` **alla scheda**. La scheda e l'etichetta scendono; la riga successiva resta dov'era perché lo spazio riservato nel flusso non è cambiato. Con `static` l'offset non avrebbe effetto.
3. Ripristina il CSS di partenza e imposta `position: static` **sull'etichetta**. Ora torna prima del titolo nel flusso; gli inset non la tengono più nell'angolo.

## Limite pratico

L'etichetta breve è adatta a questo esempio. Se può diventare una frase, prova con font ingrandito e finestra stretta: il padding fisso potrebbe non bastare. Per titolo e stato di lunghezza variabile, una riga Flexbox che può andare a capo evita di riservare spazio a occhio.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]
- [[Programmazione/HTML e CSS/Pagine/Posizionamento sticky e fixed in CSS|Posizionamento sticky e fixed in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]

## Fonti

- [CSSWG: tipi di posizionamento e blocchi di riferimento](https://www.w3.org/TR/css-position-3/#position-property)
- [CSSWG: effetto di una trasformazione sul riferimento dei discendenti](https://www.w3.org/TR/css-transforms-1/#transform-rendering)
