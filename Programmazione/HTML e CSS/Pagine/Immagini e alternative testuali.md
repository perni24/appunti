---
date: 2026-11-27
title: "Immagini e alternative testuali"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, immagini, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
---

# Immagini e alternative testuali

## Sintesi

Con `img` si incorporano i pixel tramite `src` e si indica con `alt` l'informazione che deve restare disponibile quando l'immagine non si vede. Il testo alternativo dipende dal **ruolo nel contesto**, non dal nome del file.

## Esempio: documentare un risultato

Il frammento presuppone un'immagine `confronto.png` in `immagini/`, realmente larga 960 pixel e alta 540. Sostituire file e misure con quelli disponibili.

```html
<figure>
  <img class="confronto" src="./immagini/confronto.png"
       width="960" height="540"
       alt="Prima le schede occupavano tre colonne; ora su mobile sono in una sola colonna.">
  <figcaption>Verifica del catalogo dopo la modifica al layout.</figcaption>
</figure>
```

```css
.confronto {
  display: block;
  max-inline-size: 100%;
  block-size: auto;
}
```

Gli attributi numerici aiutano il browser a riservare spazio nel rapporto corretto prima del caricamento; il CSS permette all'immagine di ridursi senza deformarsi. Questa regola **non riduce i byte scaricati**: per offrire file a risoluzioni diverse si usano `srcset` e, con descrittori di larghezza, `sizes`.

## Esempio: selezionare il file, non solo ridimensionarlo

Una mappa del campus compare larga il 90% della finestra, fino a 576 px. Su schermi stretti conviene mostrare **un ritaglio** dell'ingresso, non tutta la mappa rimpicciolita. Prepara tre file di prova in `immagini/`: due versioni della stessa mappa da 480×270 e 960×540 pixel e un dettaglio da 480×360. Tutte e tre devono mostrare il punto descritto da `alt`.

```html
<picture>
  <source media="(max-width: 400px)"
          srcset="./immagini/ingresso-480.png" width="480" height="360">
  <img class="mappa" src="./immagini/campus-960.png"
       srcset="./immagini/campus-480.png 480w, ./immagini/campus-960.png 960w"
       sizes="(max-width: 640px) 90vw, 576px"
       width="960" height="540" alt="Ingresso del laboratorio sul lato nord del cortile.">
</picture>
```

```css
.mappa {
  display: block;
  inline-size: min(90vw, 576px);
  block-size: auto;
}
```

| Domanda | Chi decide nell'esempio? |
| --- | --- |
| Quale **inquadratura** mostrare? | `picture` valuta i `source` in ordine. Fino a 400 px la condizione corrisponde e viene usato il dettaglio; altrimenti si usano le sorgenti dell'`img`. Il testo alternativo resta sull'`img`. |
| Quale **risoluzione** della mappa scegliere? | `480w` e `960w` sono larghezze reali dei file, non misure di layout. Con i descrittori `w`, `sizes` stima lo spazio visivo; il browser usa questa stima, la densità dello schermo e le proprie politiche per scegliere un candidato. |
| Quanto è larga **sulla pagina**? | Lo decide il CSS. `sizes` non imposta la larghezza; deve descrivere fedelmente il layout. Se sposti la mappa in una sidebar più stretta, aggiorna sia la regola CSS sia quella stima. |

**Verifica in DevTools:** ricarica a 360 px: deve vedersi il dettaglio, con rapporto 4:3. A 480 px, la mappa intera occupa 432 px CSS: a densità 1 il candidato da 480 px è sufficiente; a densità 2 occorrono circa 864 pixel e quello da 960 è più adatto. Leggi `document.querySelector(".mappa").currentSrc` per vedere l'URL effettivamente scelto e confrontalo con la richiesta nel pannello Network. Usa un caricamento pulito per ogni confronto: restringere la finestra dopo aver scaricato il file grande non forza il browser a scaricare quello piccolo.

## Cosa scrivere in alt

- **Immagine informativa:** descrivere l'informazione utile. Per un grafico complesso, dare anche dati o spiegazione nel testo.
- **Decorazione o contenuto già espresso dal testo adiacente:** usare `alt=""` se l'immagine non aggiunge informazione. Omettere l'attributo non è equivalente.
- **Immagine come unico contenuto di un link:** fornire un nome accessibile che indichi la destinazione o funzione, ad esempio «Torna al catalogo», non «freccia blu».

La didascalia contestualizza l'immagine per tutti; non è necessario ripeterla parola per parola nel testo alternativo.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]

## Fonti

- [W3C WAI: scegliere il testo alternativo](https://www.w3.org/WAI/tutorials/images/)
- [WHATWG: immagini responsive e selezione della risorsa](https://html.spec.whatwg.org/multipage/images.html)
