---
date: 2026-11-27
title: "HTML semantico e navigazione"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, semantica, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]"
  - "[[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]"
---

# HTML semantico e navigazione

## Sintesi

Scegliere un elemento per **ciò che significa**, non per il suo aspetto predefinito. Un titolo introduce una sezione, un link cambia destinazione, un pulsante esegue un'azione. Il CSS può cambiarne l'aspetto senza perdere queste distinzioni.

## Esempio: un indice utilizzabile da tastiera

Frammento per il `body` del catalogo. La lista conserva il raggruppamento delle voci; `href="#css"` raggiunge l'elemento con `id="css"` nella stessa pagina, senza uno script.

```html
<header>
  <h1>Appunti di frontend</h1>
  <nav aria-label="Argomenti">
    <ul>
      <li><a href="#html">HTML</a></li>
      <li><a href="#css">CSS</a></li>
    </ul>
  </nav>
</header>
<main>
  <section>
    <h2 id="html">HTML</h2>
    <p>La struttura del documento.</p>
  </section>
  <section>
    <h2 id="css">CSS</h2>
    <p>La presentazione del contenuto.</p>
  </section>
</main>
```

## Quale elemento scegliere?

| Necessità | Scelta | Criterio |
| --- | --- | --- |
| Spostarsi a un'altra nota | `a` con `href` | Il browser offre navigazione da tastiera, copia del link e apertura in una nuova scheda. |
| Inviare una ricerca | `button type="submit"` dentro un form | Attiva l'invio del modulo; per un'azione diversa scegliere `type="button"` e implementarne il comportamento. |
| Raggruppare contenuti | `section` per una sezione tematica; `div` per un contenitore generico | Non serve creare una sezione semantica per ogni involucro di layout. |
| Rappresentare dati in righe e colonne | `table`, con intestazioni `th` appropriate | Una tabella esprime relazioni fra dati; non usarla per disporre la pagina. |

## Verifica rapida

Con `Tab` raggiungere i link e attivarli con `Invio`. Controllare che gli ID siano univoci e che i titoli descrivano le sezioni anche letti in sequenza. Un `div` con un gestore del click non acquisisce automaticamente focus, ruolo e comportamento da tastiera di un controllo nativo.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Tabelle dati accessibili in HTML|Tabelle dati accessibili in HTML]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]
- [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]

## Fonti

- [W3C WAI: struttura di pagina, titoli e regioni](https://www.w3.org/WAI/tutorials/page-structure/)
- [WHATWG: sezioni e navigazione](https://html.spec.whatwg.org/multipage/sections.html)
