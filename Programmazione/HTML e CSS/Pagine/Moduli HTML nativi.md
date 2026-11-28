---
date: 2026-11-27
title: "Moduli HTML nativi"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, form, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
  - "[[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]"
---

# Moduli HTML nativi

## Sintesi

Un modulo HTML può raccogliere, validare e inviare dati **senza JavaScript**. `action` seleziona la destinazione, `method` il modo di invio, `name` la chiave che riceverà il server. L'`id` serve qui a collegare il controllo alla sua etichetta, non è il nome del parametro.

## Esempio: ricerca nel catalogo

```html
<form action="./cerca" method="get">
  <label for="termine">Argomento</label>
  <input id="termine" name="q" type="search" required>
  <button type="submit">Cerca</button>
</form>
```

Provare un invio vuoto: il browser segnala il vincolo `required`. Inserendo «box model», il modulo prepara una query come `?q=box+model`. Serve una destinazione che interpreti la ricerca: questo esempio **non crea** un motore di ricerca né una route in Quartz.

## Esempio: iscrizione con scelte esclusive

Questo secondo modulo è indipendente dal primo. Presuppone un server che accetti `POST` su `./iscrizioni`; per verificare quali dati prepara il browser non serve inviarli.

```html
<form action="./iscrizioni" method="post">
  <label for="email">Email di conferma</label>
  <input id="email" name="email" type="email" autocomplete="email" required>

  <fieldset>
    <legend>Modalità di frequenza</legend>
    <label><input type="radio" name="modalita" value="aula" required> In aula</label>
    <label><input type="radio" name="modalita" value="online"> Online</label>
  </fieldset>

  <label for="turno">Turno</label>
  <select id="turno" name="turno" required>
    <option value="">Scegli un turno</option>
    <option value="am">Mattina</option>
    <option value="pm">Pomeriggio</option>
  </select>
  <button type="submit">Conferma iscrizione</button>
</form>
```

- **Nome del gruppo e delle opzioni:** `fieldset` e `legend` presentano una sola domanda; le due label distinguono le risposte. È il medesimo `name="modalita"` nello stesso modulo, non il fieldset, a rendere esclusivi i radio. Basta `required` su uno del gruppo per richiedere una scelta.
- **Testo visibile e valore inviato:** scegliendo «Pomeriggio» si invia `turno=pm`, non `turno=Pomeriggio`. Il primo `option` con valore vuoto non soddisfa il `required` di questo select singolo.
- **Compilazione assistita:** `autocomplete="email"` dice al browser che dato può proporre. Non garantisce un suggerimento, non valida l'indirizzo e non sostituisce la label. `type="email"` controlla il formato di base, non l'esistenza della casella.

**Prova:** scegli prima «In aula», poi «Online». Solo «Online» deve restare selezionato. Per controllare il risultato senza trasmettere dati, compila l'email con `persona@example.org`, scegli «Pomeriggio» ed esegui nella console:

```js
const iscrizione = document.querySelector('form[action="./iscrizioni"]');
console.table([...new FormData(iscrizione)]);
```

Le coppie attese sono `email=persona@example.org`, `modalita=online` e `turno=pm`. Un radio non selezionato non compare. Costruire `FormData` legge i dati presenti: non scatena né la validazione né l'invio del modulo.

## Tre dettagli che cambiano il risultato

| Caso | Effetto |
| --- | --- |
| Manca `name` | Il controllo resta visibile ma la sua coppia chiave/valore non viene inviata. |
| Controllo `disabled` | Non partecipa all'invio. Un campo testuale `readonly` con un nome viene invece inviato. |
| Pulsante senza tipo dentro un normale form | Può inviare il modulo anche se pensato per un'altra azione. Dichiarare `submit` o `button` esplicitamente. |

Usare `GET` per una ricerca condivisibile nell'URL; non inserirvi credenziali. `POST` invia di norma i dati nel corpo ma non li cifra: serve HTTPS. Il placeholder non sostituisce una label persistente. I vincoli del browser migliorano il feedback, **non sostituiscono la validazione sul server**.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]

## Fonti

- [WHATWG: moduli HTML](https://html.spec.whatwg.org/multipage/forms.html)
- [W3C WAI: associare etichette ai controlli](https://www.w3.org/WAI/tutorials/forms/labels/)
- [W3C WAI: raggruppare i controlli con fieldset e legend](https://www.w3.org/WAI/tutorials/forms/grouping/)
- [WHATWG: significato di autocomplete](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
