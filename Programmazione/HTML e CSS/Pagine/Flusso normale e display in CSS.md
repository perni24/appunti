---
date: 2026-11-27
title: "Flusso normale e display in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, display, layout]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]"
---

# Flusso normale e display in CSS

## Sintesi

Prima di scegliere Flexbox o Grid, guarda come si disporrebbe il contenuto da solo. Nel **flusso normale**, due paragrafi uno dopo l'altro formano normalmente due blocchi; parole e collegamenti dentro lo stesso paragrafo condividono invece la riga e vanno a capo quando manca spazio. `display` cambia il comportamento del box, non il significato HTML dell'elemento.

## Esempio: perché width non allarga lo span?

```html
<div class="appunto">
  <p class="prima">Stato: <span class="stato">Bozza</span> <span class="seguito">da rivedere</span></p>
  <p class="seconda">Il testo resta consultabile.</p>
</div>
```

```css
.prima { margin: 0 0 24px; }
.seconda { margin: 16px 0 0; }

.stato {
  display: inline;
  width: 120px;
  background: #e0f2fe;
}
```

In una finestra abbastanza larga, cambia **solo** il valore di `display` su `.stato`:

| Valore | Dove va «da rivedere»? | Cosa succede a `width: 120px`? |
| --- | --- | --- |
| `inline` | Subito dopo «Bozza», sulla stessa riga. | Non si applica a questo normale span di testo. Lo sfondo copre la parola. |
| `inline-block` | Resta sulla stessa riga se c'è spazio, dopo il box dell'etichetta. | Il box è largo 120 px. L'intero box può andare a capo come una sola unità. |
| `block` | Va alla riga successiva; anche l'etichetta inizia su una nuova riga. | Il box è largo 120 px; togliendo la larghezza, il blocco in questo esempio occupa lo spazio disponibile. |

Non estendere la regola dello span a ogni elemento inline: un'immagine è un elemento **sostituito** (il suo contenuto visualizzato viene da una risorsa) e può rispettare `width` anche se resta inline. Né `display: block` trasforma uno span in un paragrafo, né `display: inline` trasforma un paragrafo in un link.

## Perché 24 px e 16 px non danno 40 px?

Ripristina `display: inline` e misura lo spazio **tra i bordi dei due paragrafi**, non tra i caratteri. Nel normale flusso a blocchi di questo esempio, i margini verticali adiacenti dei fratelli **collassano**: con due valori positivi si prende il maggiore. Lo spazio è **24 px**, non 40. I due margini calcolati rimangono 24 e 16 px: cambia il modo in cui occupano lo spazio.

Per confronto applica `display: grid` a `.appunto`, senza modificare i paragrafi. I paragrafi diventano elementi della griglia, i loro margini non collassano e la distanza diventa **40 px**. Non è un motivo per usare Grid ovunque: se vuoi gestire la distanza dal genitore in un layout Flexbox o Grid, azzera i margini interessati e imposta `gap`.

## Quando controllare il genitore

- Se la misura di uno span non cambia, verifica prima se è un normale elemento inline o se è un figlio diretto di un contenitore flex o grid: il contesto cambia le regole applicabili.
- Se il margine superiore del primo figlio sembra spostare anche il genitore, può esserci collasso anche tra genitore e figlio, in assenza di bordo, padding o altre condizioni che li separino. `display: flow-root` sul genitore impedisce quel collasso, ma **non** impedisce ai margini fra i suoi normali figli fratelli di collassare tra loro.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]
- [[Programmazione/HTML e CSS/Pagine/Posizionamento relativo e assoluto in CSS|Posizionamento relativo e assoluto in CSS]]

## Fonti

- [CSSWG: tipi di display esterni e interni](https://www.w3.org/TR/css-display-3/#the-display-properties)
- [W3C: condizioni per il collasso dei margini](https://www.w3.org/TR/CSS22/box.html#collapsing-margins)
