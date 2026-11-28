---
date: 2026-11-27
title: "Diagnosticare overflow in Flexbox e Grid"
area: Programmazione
topic: HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [css, overflow, flexbox, grid]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Dimensionamento intrinseco in CSS|Dimensionamento intrinseco in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
---

# Diagnosticare overflow in Flexbox e Grid

## Obiettivo

Capire perché una riga di dati allarga la pagina e correggerla **senza perdere il contenuto**. Prima misura il box che dovrebbe restringersi; poi decidi se il suo contenuto può andare a capo o deve scorrere. Sono due decisioni diverse.

## Riprodurre il problema

Le due righe mostrano lo stesso riferimento di esportazione. Nella prima il valore è un flex item; nella seconda occupa una traccia Grid. Incolla l'HTML e il CSS di partenza, inizialmente **senza** le correzioni.

```html
<div class="riga">
  <span class="chiave">Ordine</span>
  <code class="dati">ESPORTAZIONEORDINI20261127REPARTONORDVERSIONE03</code>
</div>
<div class="griglia">
  <span class="chiave">Ordine</span>
  <code class="dati">ESPORTAZIONEORDINI20261127REPARTONORDVERSIONE03</code>
</div>
```

```css
.riga, .griglia {
  inline-size: min(100%, 20rem);
  gap: 1rem;
  outline: 1px solid;
}
.dati { font: 1rem/1.4 monospace; }
.riga { display: flex; }
.riga > .chiave { flex: 0 0 5rem; }
.riga > .dati { flex: 1 1 0; }
.griglia { display: grid; grid-template-columns: 5rem 1fr; }
```

Con una radice di 16 px e almeno 320 px a disposizione, ogni riga è larga **320 px**. Tolti **80 px** dell'etichetta e **16 px** di spazio, al codice spettano **224 px**. Eppure all'inizio il box del codice è più largo: la stringa non ha spazi.

## 1. Individuare il vincolo

In DevTools confronta la larghezza del genitore e del figlio. In Grid attiva anche la visualizzazione delle tracce. I due difetti si assomigliano ma il vincolo non è nello stesso posto:

| Layout | Perché non si restringe nell'esempio | Correzione da provare |
| --- | --- | --- |
| Flex in riga | Il minimo automatico del figlio con overflow visibile tiene conto del contenuto. Una base flessibile di zero non azzera quel minimo. | Consenti al **figlio** di restringersi. |
| Grid | La traccia `1fr` da sola ha un minimo automatico, come `minmax(auto, 1fr)`. In questo caso il contributo del codice allarga la traccia. | Imposta a zero il minimo della **traccia**. |

Aggiungi queste due regole al CSS di partenza:

```css
.riga > .dati { min-inline-size: 0; }
.griglia { grid-template-columns: 5rem minmax(0, 1fr); }
```

Ora il box del codice misura **224 px** in entrambi i casi, ma il testo può continuare a sporgere. Nella console, `document.querySelector(".dati").scrollWidth` può superare `document.querySelector(".dati").clientWidth`: il contenuto è più largo dello spazio interno anche se il bordo è nel posto giusto.

## 2. Scegliere cosa fare del contenuto

**Il codice può andare a capo?** Mantieni le due correzioni e aggiungi:

```css
.dati { overflow-wrap: anywhere; }
```

Tutti i caratteri restano leggibili; il testo occupa più righe. In questo esempio `anywhere` riduce anche il minimo intrinseco e può già risolvere il difetto da solo. Separare i passaggi serve a diagnosticare casi in cui la traccia e il contenuto richiedono interventi diversi.

**La riga deve restare integra?** In alternativa al ritorno a capo, usa uno scorrimento locale, non sull'intera pagina:

```css
.dati { white-space: nowrap; overflow-x: auto; }
```

Così `scrollWidth > clientWidth` sul codice è **voluto**; non dovrebbe esserlo sulla pagina. Prova a raggiungere anche l'ultimo carattere senza mouse: per una regione scorrevole senza controlli focalizzabili può servire un contenitore con `tabindex="0"` e un nome accessibile.

## Verifica finale

- Restringi la finestra a 320 px e poi allargala: controlla sia il genitore sia il contenuto. Non dedurre che l'errore sia sparito soltanto perché non vedi una barra.
- Se trovi un elemento annidato, agisci sul **figlio diretto** del contenitore Flex o sulla definizione delle tracce Grid. Mettere `min-inline-size: 0` su un discendente arbitrario non rimuove il minimo del genitore.
- Non usare `overflow-x: hidden` sul `body` come rimedio generale: nasconde il sintomo e può rendere irraggiungibile testo o focus. Per immagini, tabelle o codice preformattato scegli consapevolmente fra ridimensionamento, ritorno a capo e scorrimento locale.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Dimensionamento intrinseco in CSS|Dimensionamento intrinseco in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]

## Fonti

- [CSSWG: minimo automatico dei flex item](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)
- [CSSWG: dimensionamento delle tracce Grid](https://www.w3.org/TR/css-grid-2/#track-sizing)
- [CSSWG: differenze tra scorrimento e ritaglio](https://www.w3.org/TR/css-overflow-3/#overflow-properties)
