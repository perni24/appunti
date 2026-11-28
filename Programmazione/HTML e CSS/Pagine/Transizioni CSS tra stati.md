---
date: 2026-11-27
title: "Transizioni CSS tra stati"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, transizioni, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]]"
  - "[[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]"
---

# Transizioni CSS tra stati

## Sintesi

Una **transizione** accompagna il passaggio fra due valori di una proprietà CSS. Non crea lo stato: nell'esempio è una casella HTML a ricordare se l'anteprima è evidenziata. Il CSS definisce l'aspetto dei due stati e, quando appropriato, il tempo per passare dall'uno all'altro.

## Esempio: evidenziare un'anteprima

```html
<input type="checkbox" id="evidenzia">
<label for="evidenzia">Evidenzia l'anteprima</label>
<p class="anteprima">Scheda del corso di CSS</p>
```

```css
.anteprima {
  background-color: #fff;
  color: #222;
  padding: 0.75rem;
  border-inline-start: 4px solid transparent;
}

#evidenzia:checked ~ .anteprima {
  background-color: #ddf3eb;
  border-inline-start-color: #075a49;
}

@media (prefers-reduced-motion: no-preference) {
  .anteprima { transition: background-color 220ms linear; }
}
```

Il combinatore `~` raggiunge l'anteprima perché è un fratello successivo della casella, anche se in mezzo c'è la label. Con il movimento abilitato il bordo appare **subito**; soltanto lo sfondo attraversa colori intermedi per 220 millisecondi, a ritmo costante. La dichiarazione `transition` è sulla regola di base: vale anche quando togli la spunta. La casella resta utilizzabile con `Tab` e `Spazio`.

## Come scegliere le proprietà

| Parte della dichiarazione | Effetto |
| --- | --- |
| `background-color` | Limita la transizione allo sfondo. Con `all` potresti animare anche proprietà modificate in futuro senza volerlo. |
| `220ms` | È la durata. Una durata di zero, senza ritardo, applica subito il nuovo valore. |
| `linear` | Regola l'avanzamento nel tempo. Con `ease-out` il cambiamento parte più rapido e rallenta verso la fine. |

## Verifica e limiti

1. Attiva e disattiva la casella. Se il cambio è difficile da vedere, rallenta la riproduzione nel pannello Animazioni del browser, senza cambiare i valori dei due stati.
2. Emula `prefers-reduced-motion: reduce` e ripeti. Il colore e il bordo finali devono restare identici, ma senza attesa. La preferenza è una condizione che il foglio deve gestire: non disattiva da sola ogni transizione CSS.
3. Se non parte nulla, controlla che i due valori **calcolati** siano diversi, che la proprietà sia interpolabile e che la durata non sia zero. Non aspettare `transitionend` per salvare la scelta o abilitare un comando: con la transizione assente quell'evento non arriva.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]
- [[Programmazione/HTML e CSS/Pagine/Animazioni CSS con keyframes e movimento ridotto|Animazioni CSS con keyframes e movimento ridotto]]
- [[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]

## Fonti

- [CSSWG: proprietà, durata e avvio delle transizioni](https://www.w3.org/TR/css-transitions-1/)
- [CSSWG: preferenza per il movimento ridotto](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion)
