---
date: 2026-11-27
title: "Pseudo-elementi before e after in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, selettori, pseudo-elementi]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
  - "[[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
---

# Pseudo-elementi before e after in CSS

## Sintesi

Usa `::before` e `::after` quando vuoi disegnare qualcosa prima o dopo il contenuto di un elemento senza aggiungere markup decorativo. **Prima e dopo indicano la posizione tra i figli**, non prima o dopo l'elemento nel documento. Se togliendo il CSS sparisce un'informazione necessaria, quella parte appartiene all'HTML.

## Esempio: due linee ai lati di un titolo

```html
<h2 class="divisore">Fonti</h2>
```

```css
.divisore {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.divisore::before,
.divisore::after {
  content: "";
  flex: 1;
  border-block-start: 1px solid currentColor;
}
```

Il titolo ha un solo testo, «Fonti». Il CSS genera un box prima del testo e uno dopo. Flexbox assegna loro lo spazio libero; il bordo rende visibile una linea che segue il colore del titolo. `content: ""` significa **genera un box senza testo**, non «non generare nulla». Con `content: none` su `.divisore::after` la seconda linea scompare e la prima può usare tutto lo spazio rimasto.

## Pseudo-classe o pseudo-elemento?

- `.divisore:hover` seleziona il **titolo** quando il puntatore lo sorvola.
- `.divisore::after` seleziona il **box generato alla fine** del titolo. Non è uno `span`: non compare in `element.children` e non è un controllo separato.
- `.divisore:hover::after` combina i due concetti: cambia il box finale quando il titolo si trova in quello stato.

## Errori comuni e verifica

- Non affidare a `content: "Obbligatorio"` l'unica indicazione di un campo richiesto. Il contenuto generato non è un sostituto affidabile dell'etichetta HTML e può essere esposto in modo diverso dalle tecnologie assistive. Per un controllo richiesto usa anche l'attributo nativo appropriato.
- Per decorare un elemento sostituito come `img`, applica il selettore a un contenitore, non all'immagine stessa. Se basta un singolo bordo sull'elemento, non servono pseudo-elementi.
- In DevTools disattiva prima `content` su una sola linea, poi l'intero foglio di stile. Nel secondo caso il titolo deve restare un `h2` comprensibile.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]
- [[Programmazione/HTML e CSS/Pagine/Flusso normale e display in CSS|Flusso normale e display in CSS]]
- [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]

## Fonti

- [CSSWG: pseudo-elementi generati prima e dopo il contenuto](https://www.w3.org/TR/css-pseudo-4/#generated-content)
- [CSSWG: valori della proprietà content](https://www.w3.org/TR/css-content-3/#content-property)
