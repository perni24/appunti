---
date: 2026-11-27
title: "Struttura di un documento HTML"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, documento, frontend]
aliases: []
prerequisites: []
related:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]"
---

# Struttura di un documento HTML

## Sintesi

HTML descrive il contenuto; il browser lo interpreta per costruire il DOM. Il `head` descrive **il documento** (titolo della scheda, codifica, fogli di stile). Il `body` contiene ciò che si legge e con cui si interagisce. Si può già costruire una pagina navigabile senza JavaScript.

## Esempio: la prima pagina del catalogo

In una cartella con `index.html` e `stile.css` allo stesso livello, usare questo documento completo:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Catalogo degli appunti</title>
    <link rel="stylesheet" href="./stile.css">
  </head>
  <body>
    <main>
      <h1>Catalogo degli appunti</h1>
      <p>Scegli un argomento da studiare.</p>
    </main>
  </body>
</html>
```

Nel foglio `stile.css`:

```css
body {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
```

`<!doctype html>` attiva la modalità standard nei browser moderni; `lang="it"` indica la lingua principale anche alle tecnologie assistive. `title` appare nella scheda del browser, `h1` nel contenuto: modificare l'uno non aggiorna l'altro.

## Percorsi: perché in locale funziona e sul sito no?

Se il documento è servito da `/appunti/lezioni/index.html`, `./stile.css` punta a `/appunti/lezioni/stile.css`. Il percorso `/stile.css` parte invece dalla radice del dominio. Se manca lo stile, controllare nella scheda *Network* quale URL è stato richiesto, prima di cambiare il selettore. Il meta viewport serve a usare la larghezza del dispositivo; non rende fluido, da solo, un layout a larghezza fissa.

## Collegamenti

- [[Programmazione/HTML e CSS/Pagine/Validare il markup HTML|Validare il sorgente e confrontarlo con il DOM]]
- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]

## Fonti

- [WHATWG: metadati del documento](https://html.spec.whatwg.org/multipage/semantics.html)
- [WHATWG: struttura dei documenti HTML](https://html.spec.whatwg.org/multipage/dom.html)
