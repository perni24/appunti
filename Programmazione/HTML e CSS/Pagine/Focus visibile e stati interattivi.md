---
date: 2026-11-27
title: "Focus visibile e stati interattivi"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, css, focus, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]"
  - "[[Programmazione/React/Pagine/Focus Management|Gestione del focus in React]]"
---

# Focus visibile e stati interattivi

## Sintesi

Il **focus** dice quale controllo riceverà il prossimo input da tastiera; non è la stessa cosa del puntatore che passa sopra un elemento né di una scelta già effettuata. Per vederlo in azione basta una casella HTML nativa, senza gestori JavaScript.

## Esempio: una preferenza da tastiera

```html
<form class="preferenze">
  <label>
    <input type="checkbox" name="riepilogo">
    Ricevi il riepilogo settimanale
  </label>
  <button type="reset">Ripristina preferenze</button>
</form>
```

```css
.preferenze {
  background-color: white;
  color: #222;
  padding: 1rem;
}

.preferenze button:hover {
  text-decoration: underline;
}

.preferenze :focus-visible {
  outline: 3px solid #005a9c;
  outline-offset: 3px;
}
```

La label permette anche di cliccare sul testo. `reset` riporta la casella al valore iniziale (qui non selezionata): non salva la preferenza su un server. L'anello è esterno al controllo; passando da uno all'altro non ne altera le dimensioni.

| Stato | Come riconoscerlo |
| --- | --- |
| `:hover` | Il puntatore si trova sull'elemento; non implica che sia attivato o focalizzato. Non affidargli un'azione indispensabile. |
| `:focus` | L'elemento riceve il focus, anche quando è stato spostato da codice. |
| `:focus-visible` | L'elemento ha il focus **e** il browser ritiene opportuno mostrarne l'indicatore. Non è sinonimo stretto di «ultimo input da tastiera». |
| `:active` e `:checked` | Il primo è transitorio durante l'attivazione; il secondo resta vero finché la casella è selezionata, anche spostando il focus. |

## Prova senza mouse

1. Premi `Tab` dalla pagina appena aperta: l'anello compare sulla casella. Premi `Spazio`: la spunta cambia, ma il focus resta lì.
2. Premi di nuovo `Tab`: l'anello si sposta sul pulsante e la spunta rimane. Premi `Invio`: il pulsante ripristina il valore iniziale.
3. Torna indietro con `Maiusc+Tab`. Se l'anello c'è negli stili calcolati ma non si vede, controlla se un contenitore con `overflow: hidden` lo taglia o un elemento fisso copre il controllo.

Il browser fornisce già un indicatore predefinito: mantienilo se non hai uno stile sostitutivo visibile. Non aggiungere `tabindex` positivi per correggere l'ordine e non sostituire un pulsante con un `div` cliccabile: lo stile non aggiunge il comportamento da tastiera.

## Collegamenti

- [[Programmazione/HTML e CSS/Pagine/Verificare una pagina con browser e tecnologie assistive|Ripetere il percorso con altri browser e un lettore di schermo]]
- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Dialoghi e popover nativi in HTML|Dialoghi e popover nativi in HTML]]
- [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]
- [[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]
- [[Programmazione/React/Pagine/Focus Management|Gestione del focus in React]]

## Fonti

- [CSSWG: regole di corrispondenza di focus-visible](https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo)
- [W3C WAI: indicatore di focus visibile](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
