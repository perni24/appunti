---
date: 2026-11-27
title: "Proprietà personalizzate e var in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, variabili, ereditarieta]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/React/Pagine/Design system|Design token in un design system]]"
  - "[[Programmazione/JavaScript/Pagine/Web Components|Temi nei Web Components]]"
---

# Proprietà personalizzate e var in CSS

## Sintesi

Una proprietà personalizzata, come `--accento`, dà un nome a un valore CSS. La dichiari su un elemento e la leggi con `var(--accento)` nel **valore** di un'altra proprietà. È utile quando più elementi condividono una scelta, ma una parte della pagina deve poterla cambiare senza riscrivere tutti i selettori. Non serve JavaScript.

## Esempio: stessa etichetta, due contesti

```html
<div class="catalogo">
  <p class="etichetta">Nota pubblicata</p>
  <aside class="bozze">
    <p class="etichetta">Nota da rivedere</p>
  </aside>
</div>
```

```css
.catalogo {
  color: #222;
  --accento: #14532d;
}
.bozze { --accento: #9a3412; }
.etichetta { color: var(--accento, #1d4ed8); }
```

Le due etichette hanno la stessa classe. La prima eredita **la proprietà personalizzata** dal catalogo e usa il verde; la seconda eredita quella ridefinita in `.bozze` e usa il ruggine. Il blu è un valore di riserva (*fallback*), non il colore iniziale di tutte le etichette. Qui le proprietà non sono registrate con `@property` e si ereditano per impostazione predefinita.

## Quando entra in gioco il fallback?

| Modifica in DevTools, partendo ogni volta dall'esempio originale | Risultato sulla seconda etichetta |
| --- | --- |
| Elimina solo `--accento` da `.bozze` | Verde: il valore del catalogo è ancora disponibile per ereditarietà. |
| Elimina entrambe le definizioni di `--accento` | Blu: il nome non fornisce un valore e `var()` usa il secondo argomento. |
| Imposta `--accento: 12px` in `.bozze` | Non diventa blu: la variabile esiste, ma `color: 12px` è invalido **dopo** la sostituzione. Essendo `color` ereditabile, il testo eredita il colore del genitore, qui `#222`. |

Il browser non ricomincia la cascata per cercare una precedente dichiarazione di `color` quando scopre l'errore dopo la sostituzione. Per la diagnosi ispeziona **l'elemento che usa** la variabile: confronta il valore di `--accento` con il colore calcolato, non soltanto con la dichiarazione presente in `:root`.

## Errori comuni

- Dichiarare tutto in `:root`. Per un tema dell'intero sito ha senso; se il valore riguarda solo un pannello, dichiararlo sul pannello evita effetti sui fratelli.
- Confondere `--accento` con `--Accento`: i nomi delle proprietà personalizzate distinguono maiuscole e minuscole.
- Usare `var()` per costruire un selettore o la soglia di una media query. Qui la sostituzione avviene nel valore di una dichiarazione, non nella sintassi che decide a quali elementi applicarla.

## Collegamenti

- [[Programmazione/HTML e CSS/Pagine/Fallback CSS e miglioramento progressivo con supports|Fallback per una sintassi CSS non supportata]]
- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]
- [[Programmazione/React/Pagine/Design system|Design token in un design system]]
- [[Programmazione/JavaScript/Pagine/Web Components|Temi nei Web Components]]

## Fonti

- [CSSWG: dichiarazione ed ereditarietà delle proprietà personalizzate](https://www.w3.org/TR/css-variables-1/#defining-variables)
- [CSSWG: valori non validi dopo la sostituzione](https://www.w3.org/TR/css-variables-1/#invalid-variables)
