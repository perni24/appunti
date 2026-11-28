---
date: 2026-11-28
title: "Web font e stabilità del layout"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, web-font, tipografia, prestazioni]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Tipografia e spaziatura in CSS]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Fallback CSS e miglioramento progressivo con supports|Fallback CSS e miglioramento progressivo]]"
  - "[[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]"
---

# Web font e stabilità del layout

## Sintesi

Il testo compare, inizi a leggere e il pulsante sotto il paragrafo si sposta: non è necessariamente arrivato altro contenuto. Il browser può aver **sostituito il carattere di riserva con il web font**. A parità di `font-size` e `line-height`, lettere più larghe possono far andare il testo a capo una volta in più. La scelta ha quindi due aspetti: **quando mostrare il testo** e **quanto cambia lo spazio che occupa**.

## Esempio: il controllo sotto al testo

In un progetto di prova servi via HTTP una pagina HTML e un foglio `stile.css` nella stessa cartella. Collega il foglio nel `head`. Dalla distribuzione di [IBM Plex Mono su Fontsource](https://fontsource.org/fonts/ibm-plex-mono) prendi il WOFF2 **latin, 400, normal** e mettilo in `font/ibm-plex-mono-latin-400-normal.woff2`; conserva la licenza con il file se lo ridistribuisci. Il percorso in `url()` è relativo al **foglio CSS**, non alla pagina.

Nel `body`:

```html
<p class="ritiro">I libri richiesti sono disponibili in biblioteca.
  Per il ritiro controlla gli orari e indica il titolo al banco.</p>
<details>
  <summary>Orari di ritiro</summary>
  <p>Dal lunedì al venerdì, dalle 9 alle 13.</p>
</details>
```

In `stile.css`:

```css
@font-face {
  font-family: "Plex prova";
  src: url("./font/ibm-plex-mono-latin-400-normal.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

.ritiro {
  font-family: "Plex prova", Arial, sans-serif;
  font-size: 1.25rem;
  line-height: 1.5;
  max-width: 18rem;
  margin: 0;
}
```

`@font-face` dà un nome a una variante; è `font-family` sul paragrafo a richiederla quando serve. Con `swap`, dopo un periodo di blocco molto breve il browser può mostrare il testo con il fallback e sostituirlo quando il file è pronto. Qui **Arial è volutamente proporzionale**, mentre IBM Plex Mono è monospaziato: il confronto rende più facile vedere la differenza. Il controllo «Orari di ritiro» non usa il web font, ma può spostarsi perché lo precede un paragrafo diventato più alto.

## Scegliere la politica di caricamento

| Scelta | Cosa privilegi | Compromesso |
| --- | --- | --- |
| Font di sistema, senza `@font-face` | Testo subito disponibile, senza una richiesta di font | La famiglia concreta può cambiare fra piattaforme. |
| `font-display: swap` | Leggere con il fallback e usare il web font anche se arriva tardi | Se le metriche differiscono, può cambiare il numero di righe. |
| `font-display: fallback` | Consentire la sostituzione solo per un intervallo limitato | Se il font arriva troppo tardi, in quella visita può restare il fallback. |
| `font-display: optional` | Evitare una sostituzione tardiva dopo che il testo è già apparso | Il font scelto può non essere usato nella visita; il browser può anche rinunciare al download. |

`block` può invece mantenere il testo invisibile durante il periodo iniziale: non elimina le differenze di misura. Non impostare un timer JavaScript per imitare queste politiche; i tempi precisi dipendono dal browser.

## Verificare e ridurre lo spostamento

1. **Prova il mancato caricamento.** Con cache disabilitata, blocca la richiesta WOFF2 negli strumenti di sviluppo e ricarica. Il paragrafo deve restare leggibile e «Orari di ritiro» deve aprirsi anche da tastiera.
2. **Osserva la sostituzione.** Sblocca la richiesta, simula una rete lenta e registra la ricarica nel pannello Prestazioni. Confronta prima e dopo: quante righe occupa il paragrafo? Si muove il controllo sotto? Mantieni uguali larghezza, zoom e posizione di scorrimento. Nel pannello dei font renderizzati verifica il carattere realmente usato: il valore calcolato di `font-family` mostra la lista richiesta, non prova da solo che sia arrivato il file.
3. **Confronta un fallback più vicino.** Nell'esempio cambia solo la lista in `"Plex prova", monospace` e ripeti. Confronta l'altezza prima e dopo, non solo la somiglianza visiva. Se serve una corrispondenza più precisa, definisci una faccia di riserva basata su un font locale noto e misura `size-adjust` per la scala, `ascent-override`, `descent-override` e `line-gap-override` per le metriche verticali. Non esistono percentuali valide per tutte le coppie di font. Un'altezza fissa che taglia il testo non è una correzione.

Per uno screenshot **finale** puoi attendere `await document.fonts.ready` quando il testo di prova è già nel DOM. L'attesa termina anche se la richiesta è fallita: controlla in Rete lo stato della risposta e nei font renderizzati l'esito. Uno screenshot catturato solo alla fine non mostra il salto. La distanza percorsa dal controllo in pixel è utile per diagnosticare il problema, ma **non è il CLS della pagina**: quella metrica tiene conto anche dell'area visibile interessata e aggrega gli spostamenti nel tempo.

## Quando usare il preload

Se la traccia di rete mostra che un font essenziale per il primo schermo viene scoperto tardi, puoi anticiparne la richiesta con questo elemento nel `head` dell'esempio:

```html
<link rel="preload" href="./font/ibm-plex-mono-latin-400-normal.woff2"
      as="font" type="font/woff2" crossorigin>
```

Il preload **non applica il font** e non risolve una differenza di metriche. Verifica che `href` e `src` risolvano allo stesso URL e usa `crossorigin` anche sullo stesso dominio per allineare la modalità della richiesta. Controlla in Rete che la risorsa venga riutilizzata prima di estendere il preload ad altri pesi: anticipare font inutilizzati sottrae banda ad altre risorse.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Dimensione, interlinea e lunghezza delle righe]]
- [[Programmazione/React/Pagine/Visual regression testing|Attendere uno stato stabile negli screenshot di test]]

## Fonti

- [W3C: comportamento del descrittore font-display](https://www.w3.org/TR/css-fonts-4/#font-display-desc)
- [W3C: quando si risolve FontFaceSet.ready](https://www.w3.org/TR/css-font-loading-3/#font-face-set-ready)
- [web.dev: ridurre gli spostamenti dovuti ai font](https://web.dev/articles/optimize-cls#web_fonts)
- [web.dev: caricamento dei web font e preload](https://web.dev/articles/optimize-webfont-loading)
