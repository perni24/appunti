---
date: 2026-11-27
title: "Animazioni CSS con keyframes e movimento ridotto"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, animazioni, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Transizioni CSS tra stati|Transizioni CSS tra stati]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
related:
  - "[[Programmazione/React/Pagine/Animazioni e Micro-interazioni|Animazioni e micro-interazioni in React]]"
---

# Animazioni CSS con keyframes e movimento ridotto

## Sintesi

Una **transizione** collega il valore precedente a quello nuovo; un'**animazione** con `@keyframes` descrive invece una sequenza con tappe esplicite. Definire la sequenza non basta a eseguirla: una regola deve assegnarla a un elemento con `animation`. Prima costruisci la versione statica che permette di completare l'attività; aggiungi il movimento solo dove aiuta.

## Esempio: aprire le istruzioni di consegna

```html
<details class="consegna">
  <summary>Istruzioni di consegna</summary>
  <p class="istruzioni">Indica il numero d'ordine sul modulo.</p>
</details>
```

```css
@keyframes entra {
  from { transform: translateY(8px); }
  60%  { transform: translateY(2px); }
  to   { transform: translateY(0); }
}

@media (prefers-reduced-motion: no-preference) {
  .consegna[open] .istruzioni {
    animation: entra 300ms linear 1;
  }
}
```

`details` e `summary` gestiscono apertura e tastiera anche senza CSS. Quando compare `open`, il paragrafo è visibile. Se non è richiesta una riduzione del movimento, il browser applica `entra`: il testo parte 8 px più in basso, dopo 180 ms (il 60% di 300 ms) è a 2 px, poi ritorna in posizione. `transform` ne sposta la resa visiva senza riservare spazio aggiuntivo nel flusso.

## Cosa succede dopo l'ultimo fotogramma?

L'ultimo `1` nella proprietà abbreviata indica **una sola esecuzione**. Terminata l'animazione, riprende lo stile normale: qui non serve `animation-fill-mode: forwards`, perché la posizione di base coincide visivamente con quella finale. `forwards` manterrebbe l'effetto dell'ultimo fotogramma applicabile, non renderebbe permanente lo stato HTML. Nell'esempio la fonte dello stato resta l'attributo `open`.

Chiudendo il pannello si rimuove la regola con `animation`: non parte un'animazione di uscita né la sequenza si riproduce al contrario. Riaprendo il pannello dopo la chiusura parte una nuova esecuzione, se la preferenza lo permette.

## Verifica del movimento ridotto

- In DevTools emula `no-preference` e apri il pannello: il paragrafo si sposta una sola volta. Per vedere le tappe, usa il pannello Animazioni.
- Chiudi il pannello, emula `reduce`, porta il focus sul riepilogo con `Tab` e premi `Invio`. Devi leggere **lo stesso testo immediatamente**, senza spostamento. Con il foglio disabilitato il controllo deve continuare a funzionare.
- Non sostituire il contenuto utile con una versione vuota quando il movimento è ridotto. Non usare un timer o `animationend` come condizione per rendere disponibili le istruzioni: questa animazione è facoltativa.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Transizioni CSS tra stati|Transizioni CSS tra stati]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]
- [[Programmazione/React/Pagine/Animazioni e Micro-interazioni|Animazioni e micro-interazioni in React]]

## Fonti

- [CSSWG: keyframe, ripetizione e fine delle animazioni](https://www.w3.org/TR/css-animations-1/)
- [W3C WAI: abilitare il movimento facoltativo rispettando la preferenza dell'utente](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)
