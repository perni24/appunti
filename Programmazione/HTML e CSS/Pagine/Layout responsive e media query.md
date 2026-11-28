---
date: 2026-11-27
title: "Layout responsive e media query"
area: Programmazione
topic: HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, responsive, media-query]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Immagini e alternative testuali|Immagini e alternative testuali]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
---

# Layout responsive e media query

## Obiettivo

Far funzionare lo stesso documento in una finestra stretta o larga, con testo ingrandito e contenuti di lunghezza variabile. Iniziare con una colonna leggibile; aggiungere un breakpoint quando **il contenuto** dispone davvero dello spazio per una disposizione diversa.

## Esempio: indice sopra o accanto al testo

Usare il meta viewport della nota sul documento HTML. Il seguente frammento va nel `body`; il CSS nel foglio collegato.

```html
<div class="lezione">
  <nav aria-label="In questa lezione"><a href="#esempio">Esempio</a></nav>
  <main id="esempio">
    <h1>Prova il layout</h1>
    <p>Ridimensiona la finestra: il link resta prima del contenuto.</p>
  </main>
</div>
```

```css
.lezione {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
  overflow-wrap: anywhere;
}
@media (min-width: 48em) {
  .lezione {
    grid-template-columns: minmax(10rem, 1fr) minmax(0, 3fr);
  }
}
```

La regola base funziona senza media query. Quando la **viewport** raggiunge la soglia, la seconda dichiarazione sostituisce soltanto le colonne. Con una dimensione iniziale del carattere di 16px, `48em` nella media query equivale a 768px. Non è una categoria di dispositivo. L'ordine di lettura nel DOM non cambia.

## Procedura di verifica

1. Aprire la pagina a 320 pixel CSS di larghezza. Indice e testo devono stare su una colonna; leggere una riga di prosa non deve richiedere scorrimento orizzontale.
2. Allargare progressivamente, poi provare appena prima e dopo la soglia. Verificare le colonne effettive in DevTools: non testare soltanto due modelli di telefono.
3. Ingrandire il testo e provare un titolo molto lungo, un URL senza spazi e un'immagine più larga della colonna. Il testo deve andare a capo e i controlli rimanere raggiungibili da tastiera.
4. Se compare overflow, individuare l'elemento troppo largo. Controllare dimensioni fisse, padding, immagini e minimi di traccia prima di applicare `overflow-x: hidden`: nascondere il contenuto non equivale a renderlo consultabile.

Se basta cambiare il **numero delle schede** in base allo spazio del loro contenitore, l'esempio con `auto-fit` nella nota Grid non richiede alcun breakpoint.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Container query per componenti responsive|Container query per componenti responsive]]
- [[Programmazione/HTML e CSS/Pagine/Immagini e alternative testuali|Immagini e alternative testuali]]
- [[Programmazione/HTML e CSS/Pagine/Layout con Flexbox|Layout con Flexbox]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]

## Fonti

- [W3C: media query basate sulla viewport](https://www.w3.org/TR/mediaqueries-4/)
- [W3C WAI: reflow e contenuti che richiedono due dimensioni](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
