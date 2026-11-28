---
date: 2026-11-27
title: "Dialoghi e popover nativi in HTML"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [html, dialog, popover, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]"
  - "[[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]"
  - "[[Programmazione/React/Pagine/Portals|Portals in React]]"
---

# Dialoghi e popover nativi in HTML

## Sintesi

**La persona deve decidere prima di poter proseguire?** Usa un `dialog` modale. **Deve poter consultare un aiuto mentre usa il resto della pagina?** Usa un popover non modale. Se basta espandere una spiegazione nel normale flusso del documento, `details` e `summary` evitano del tutto la sovrapposizione.

| Apertura | Dove appare | Posso interagire con lo sfondo? | Come si chiude |
| --- | --- | --- | --- |
| `dialog.showModal()` | Nel *top layer* del browser | No: il resto del documento diventa inerte | Nell'esempio: pulsante del form o `Esc`; il clic esterno non è una conferma. |
| `dialog.show()` | Nel normale ordine di disegno | Sì: il dialogo è non modale | Offri un comando esplicito, per esempio un pulsante che chiama `close()`. |
| `popover="auto"` con `popovertarget` | Nel *top layer*, ma **non** modale | Sì | Pulsante associato, `Esc` o clic esterno (*light dismiss*). |

Il *top layer* risolve **l'ordine di disegno**, non stabilisce il significato del contenuto né la modalità. Per questo un popover può stare sopra un pannello con `z-index` elevato senza bloccare il pannello.

## Confermare una modifica con un dialogo

Frammento da inserire nel `body`. Il filtro è locale: non si inviano dati. Il pulsante che apre il dialogo non azzera nulla; solo la conferma modifica la casella.

```html
<button type="button" id="apri">Azzera filtri</button>
<label><input id="disponibili" type="checkbox" checked> Solo disponibili</label>

<dialog id="conferma" aria-labelledby="titolo-conferma">
  <h2 id="titolo-conferma">Azzerare i filtri?</h2>
  <p>Il catalogo mostrerà anche gli elementi non disponibili.</p>
  <form method="dialog">
    <button value="annulla" autofocus>Annulla</button>
    <button value="azzera">Azzera</button>
  </form>
</dialog>

<script type="module">
  const finestra = document.querySelector("#conferma");
  const filtro = document.querySelector("#disponibili");

  document.querySelector("#apri").addEventListener("click", () => {
    finestra.returnValue = "";
    finestra.showModal();
  });

  finestra.addEventListener("close", () => {
    if (finestra.returnValue === "azzera") filtro.checked = false;
  });
</script>
```

`aria-labelledby` dà al dialogo il nome del titolo. Qui il primo focus va deliberatamente su **Annulla**; per un dialogo diverso scegli il punto di partenza in base al compito. Durante l'apertura modale i controlli della pagina sottostante non sono utilizzabili. Lo sfondo può essere stilizzato con `dialog::backdrop`: la regola CSS non è ciò che lo rende inerte.

`method="dialog"` chiude il dialogo senza una richiesta HTTP e il pulsante scelto imposta `returnValue`. `Esc` invece richiede l'annullamento (evento `cancel`) e, se non lo si impedisce, chiude senza inviare il form. Il codice azzera il valore **a ogni apertura**: un vecchio «azzera» non deve valere come conferma dopo `Esc`. Non rimuovere a mano `open` per chiudere e non aggiungerlo per simulare `showModal()`.

**Prova:** da pagina appena aperta premi `Tab`, poi `Invio`. Il focus è su «Annulla». Con `Esc` si torna ad «Azzera filtri» e la casella resta spuntata. Riapri, spostati su «Azzera» e conferma: il dialogo si chiude e la spunta scompare. Il ritorno al controllo di apertura presuppone che esista ancora e sia focalizzabile.

## Mostrare un aiuto con un popover

Esempio indipendente, senza JavaScript. Il bottone punta all'`id` del pannello, **senza** `#`; l'azione predefinita è alternare apertura e chiusura.

```html
<button type="button" popovertarget="aiuto">Come si calcola il totale?</button>

<div id="aiuto" popover="auto">
  <p>Il totale include l'IVA, ma non le spese di spedizione.</p>
  <button type="button" popovertarget="aiuto" popovertargetaction="hide">
    Chiudi spiegazione
  </button>
</div>

<label><input type="checkbox"> Includi spedizione</label>
```

Apri da tastiera: senza un discendente con `autofocus`, nell'esempio il focus resta sul pulsante di apertura. Il `Tab` successivo raggiunge «Chiudi spiegazione». Da lì `Esc` nasconde il pannello e riporta il focus al pulsante di apertura. Riapri e **clicca direttamente sulla casella esterna**: il pannello si chiude e la casella cambia stato. In un dialogo modale questa interazione con lo sfondo non sarebbe disponibile.

## Errori da riconoscere

- **Il pannello è visibile ma la pagina non è bloccata:** verifica `dialog.matches(":modal")`; l'attributo `open` da solo non distingue un dialogo modale da uno non modale. Per il popover usa invece `element.matches(":popover-open")`: la presenza di `popover` lo configura, non indica che sia aperto.
- **Il popover non si chiude al clic esterno:** controlla la modalità. `popover="manual"` non offre la chiusura automatica di `auto`; devi fornire un comando di chiusura.
- **Il contenitore appare come un menu solo graficamente:** `popover` non assegna il ruolo di menu né implementa la navigazione con le frecce. Per una spiegazione non aggiungere `role="menu"`; mantieni invece nomi e controlli adatti al contenuto.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]
- [[Programmazione/HTML e CSS/Pagine/Z-index e contesti di sovrapposizione|Z-index e contesti di sovrapposizione]]
- [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]
- [[Programmazione/React/Pagine/Portals|Portals in React]]

## Fonti

- [WHATWG: dialog, apertura, chiusura e focus](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)
- [WHATWG: attributo popover e light dismiss](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute)
- [W3C WAI: scelta e ripristino del focus per un dialogo modale](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
