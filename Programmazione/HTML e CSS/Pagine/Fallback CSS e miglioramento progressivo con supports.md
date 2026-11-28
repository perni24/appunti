---
date: 2026-11-28
title: "Fallback CSS e miglioramento progressivo con @supports"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, compatibilita, progressive-enhancement]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
  - "[[Programmazione/HTML e CSS/Pagine/Proprietà personalizzate e var in CSS|Proprietà personalizzate e var in CSS]]"
---

# Fallback CSS e miglioramento progressivo con @supports

## Sintesi

Parti dal compito che deve riuscire in ogni caso. Per un indice, il requisito è **raggiungere le sezioni**; disporre i link su due colonne è un miglioramento. Metti il contenuto e i collegamenti nell'HTML, scrivi lo stile di base fuori da ogni condizione e aggiungi le funzionalità opzionali dopo.

## Un solo valore: bastano due dichiarazioni

Per dare un bordo colorato a un avviso, non serve una condizione che racchiuda l'intera regola:

```css
.avviso {
  border-left: 4px solid #19694e;
  border-left-color: oklch(45% 0.1 160);
}
```

La prima dichiarazione disegna un bordo completo. Se il browser non riconosce `oklch()`, scarta la seconda dichiarazione e il bordo resta verde. Se la riconosce, cambia **solo il colore**: larghezza e stile restano quelli della base. Invertire l'ordine farebbe vincere il colore della proprietà abbreviata `border-left` anche nel browser che supporta entrambe.

Questo meccanismo riguarda valori scartati **quando viene letto il CSS**. Non è il fallback di `var(--accento, green)`: se `--accento` esiste ma contiene `12px`, non diventa un colore valido e non viene scelto `green`. Vedi [[Programmazione/HTML e CSS/Pagine/Proprietà personalizzate e var in CSS|quando viene usato il fallback di var()]].

## Più regole insieme: un indice che resta navigabile

Inserisci il frammento nel `body`. I link hanno destinazioni reali anche senza CSS o JavaScript.

```html
<nav class="indice" aria-label="In questa pagina">
  <a href="#materiali">Materiali</a>
  <a href="#procedura">Procedura</a>
</nav>
<h2 id="materiali">Materiali</h2>
<p>Servono un foglio e una matita.</p>
<h2 id="procedura">Procedura</h2>
<p>Annota le misure prima di iniziare.</p>
```

```css
.indice a {
  display: block;
  padding: 0.5em;
}

@supports (display: grid) and (grid-template-columns: repeat(auto-fit, minmax(9em, 1fr))) {
  .indice {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9em, 1fr));
    gap: 0.5em;
  }
}
```

Con la sola base, i due link occupano righe distinte. Il blocco condizionale verifica le due dichiarazioni da cui dipende la griglia: se sono supportate, i link possono affiancarsi quando c'è spazio. Se la condizione è falsa, o il browser non conosce `@supports`, resta l'indice verticale. **L'ordine di lettura e di tabulazione non cambia.**

`@supports` verifica una capacità del browser, non lo spazio a disposizione. Anche quando la condizione è vera puoi vedere una sola colonna: qui è `auto-fit` che adatta il numero delle colonne. Una `@media` o una `@container` risponderebbe a una domanda diversa, relativa all'ambiente o al contenitore.

## Verificare entrambi i casi

1. In una finestra larga verifica che i link siano affiancati. Premi `Tab` due volte partendo dall'inizio della pagina, poi `Invio`: il secondo link deve portare a `#procedura`.
2. Nel foglio di prova sostituisci **solo nella condizione** `(display: grid)` con `(display: valore-inesistente)`. Ricarica alla stessa larghezza: la griglia scompare ma i link devono ancora funzionare. È una simulazione del ramo non applicato, non un collaudo di un vecchio browser.
3. Ripristina la condizione e restringi la finestra. Confronta i due casi negli strumenti di sviluppo: il valore calcolato di `display` del `nav` è `grid` quando manca spazio, `block` quando non viene applicato il miglioramento.

## Errori comuni

- **Scrivere la base solo in `@supports not (...)`.** Un browser che ignora l'intera regola ignora anche il ramo negativo. Lascia fuori la base necessaria per usare la pagina.
- **Confondere supporto e risultato.** Una risposta positiva non garantisce assenza di bug, spazio sufficiente, contrasto leggibile o prevalenza nella cascata. Controlla cosa succede sull'elemento reale; cambiare lo user agent non equivale a cambiare motore.
- **Controllare una proprietà diversa da quella usata.** Per esempio, `(display: grid)` da solo non verifica ogni sintassi di `grid-template-columns`. Prova le dichiarazioni indispensabili; lascia che un dettaglio facoltativo come `gap` degradi da solo.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Distribuire le colonne con Grid]]
- [[Programmazione/HTML e CSS/Pagine/Container query per componenti responsive|Adattarsi alla larghezza del contenitore]]

## Fonti

- [W3C: condizioni di supporto CSS](https://www.w3.org/TR/css-conditional-3/#at-supports)
- [W3C: gestione degli errori nella sintassi CSS](https://www.w3.org/TR/css-syntax-3/#error-handling)
- [W3C: sintassi dei colori OKLab e OKLCH](https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch)
- [W3C: valori non validi dopo la sostituzione delle variabili](https://www.w3.org/TR/css-variables-1/#invalid-variables)
