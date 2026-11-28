---
date: 2026-11-27
title: "HTML e CSS - Documento immagini e tabelle"
area: Programmazione
topic: Promemoria HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [promemoria, html, semantica]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Immagini e alternative testuali|Immagini e alternative testuali]]"
  - "[[Programmazione/HTML e CSS/Pagine/Tabelle dati accessibili in HTML|Tabelle dati accessibili in HTML]]"
---

# HTML e CSS - Documento immagini e tabelle

## Uso rapido

Il primo blocco è un documento completo. I successivi sono frammenti da inserire nel `body`.

## Avviare una pagina

Metti `stile.css` accanto al file HTML.

```html
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Catalogo corsi</title>
  <link rel="stylesheet" href="./stile.css">
</head>
<body>
  <main><h1>Catalogo corsi</h1></main>
</body>
</html>
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]] · [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]].

## Inserire un'immagine informativa

Sostituisci file, dimensioni reali e testo alternativo. Per una decorazione usa `alt=""`.

```html
<img src="./immagini/confronto.png" width="960" height="540"
     alt="Il catalogo passa da tre colonne a una su schermo stretto."
     style="max-inline-size: 100%; block-size: auto;">
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Immagini e alternative testuali|Immagini e alternative testuali]].

## Dare un nome a righe e colonne

La cella `6` si legge come posti disponibili per il corso CSS.

```html
<table>
  <caption>Posti disponibili</caption>
  <thead><tr><th scope="col">Corso</th><th scope="col">Posti</th></tr></thead>
  <tbody><tr><th scope="row">CSS</th><td>6</td></tr></tbody>
</table>
```

Teoria: [[Programmazione/HTML e CSS/Pagine/Tabelle dati accessibili in HTML|Tabelle dati accessibili in HTML]].

## Collegamenti

- [[Programmazione/HTML e CSS/Promemoria/Indice Promemoria HTML e CSS|Indice Promemoria HTML e CSS]]

## Fonti

- [WHATWG: metadati del documento](https://html.spec.whatwg.org/multipage/semantics.html)
- [W3C WAI: tabelle dati](https://www.w3.org/WAI/tutorials/tables/)
