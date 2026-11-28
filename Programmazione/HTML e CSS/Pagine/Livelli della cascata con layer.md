---
date: 2026-11-27
title: "Livelli della cascata con layer"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, cascata, layer]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/React/Pagine/CSS Modules|CSS Modules]]"
  - "[[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]"
---

# Livelli della cascata con layer

## Sintesi

Quando un foglio condiviso e gli stili dell'applicazione modificano lo stesso elemento, `@layer` permette di dichiarare **quale gruppo di regole ha la precedenza**, senza rendere ogni selettore più specifico del precedente. I layer ordinano dichiarazioni CSS, non gli elementi sullo schermo: non hanno il ruolo di `z-index`.

## Esempio: il tema prevale su un selettore più specifico

```html
<div class="catalogo">
  <span class="stato">Pronto per la lettura</span>
</div>
```

```css
@layer base, tema;

@layer tema {
  .stato { color: #14532d; }
}

@layer base {
  .catalogo .stato { color: #334155; }
}
```

Il testo è **verde**, anche se il selettore in `base` è più specifico ed è scritto dopo. La prima riga fissa l'ordine: per le dichiarazioni normali di questi fogli autore, `tema` prevale su `base`. Riaprire un layer già nominato aggiunge regole ma non sposta quel layer. Se invece metti le due regole nello stesso layer, torna decisiva la specificità: vince `.catalogo .stato`.

## Tre prove per leggere la cascata

Parti dal frammento originale per ciascuna prova. Osserva il colore calcolato sullo `span`.

| Cambiamento | Regola che vince e motivo |
| --- | --- |
| Inverti **solo** l'elenco iniziale in `@layer tema, base;` | Vince il grigio di `base`: è ora l'ultimo layer dichiarato. |
| Aggiungi fuori da ogni layer `.stato { color: #9a3412; }` | Vince il ruggine. Una regola normale non stratificata prevale sulle normali dei layer espliciti dello stesso foglio autore. |
| Aggiungi `!important` a **entrambi** i colori originari, senza modificare l'ordine | Vince il grigio di `base`. Tra dichiarazioni importanti l'ordine dei layer si inverte: il primo prevale, e le importanti fuori layer hanno precedenza inferiore a quelle nei layer espliciti. |

Il confronto qui riguarda solo regole autore in fogli di stile, non stili inline, stili utente, animazioni o transizioni. L'importanza si confronta prima del layer: rendere importante **solo** il colore del tema non è una prova dell'inversione.

## Quando usarlo davvero

Se la tua correzione non prevale sul CSS di una libreria, verifica innanzitutto **dove è caricato il CSS della libreria**: metterti in un layer successivo non basta se la libreria resta fuori dai layer. Definisci l'ordine comune prima di caricare le regole e colloca la libreria nel livello previsto. Dentro ciascun layer valgono ancora le normali regole della cascata.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]
- [[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]

## Fonti

- [CSSWG: dichiarazione e ordine dei cascade layers](https://www.w3.org/TR/css-cascade-5/#layer-order)
- [CSSWG: ordinamento delle dichiarazioni nella cascata](https://www.w3.org/TR/css-cascade-5/#cascade-sort)
