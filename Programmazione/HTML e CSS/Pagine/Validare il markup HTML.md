---
date: 2026-11-27
title: "Validare il markup HTML"
area: Programmazione
topic: HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, validazione, debug]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]"
  - "[[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilità]]"
---

# Validare il markup HTML

## Obiettivo

Capire **perché un documento HTML non è conforme anche se il browser lo mostra**. Il Nu HTML Checker legge il markup che gli dai; il pannello *Elementi* del browser mostra invece l'albero già costruito, con gli eventuali recuperi del parser e le modifiche di JavaScript. Qui si controlla il documento, non il valore digitato in un campo.

## Procedura

1. **Scegli cosa controllare.** Per un sito statico usa il file HTML generato; per una pagina servita, la risposta HTML della richiesta del documento. Un template, un frammento JSX o il solo contenuto del `body` non sono il documento completo. Nel vault, per esempio, si controlla l'HTML prodotto da Quartz e si corregge la nota o il template che l'ha generato.
2. **Esegui il checker.** Per gli esempi pubblici puoi incollare il documento nel [Nu HTML Checker del W3C](https://validator.w3.org/nu/) selezionando l'inserimento del testo. Per pagine private o dietro autenticazione, usa il checker locale: non inviare file, URL riservati o credenziali al servizio pubblico.
3. **Parti dal primo errore strutturale.** Leggi severità, posizione e frammento indicato. La posizione è il punto in cui il checker riconosce il problema: la causa può trovarsi alcune righe prima. Correggi quella causa e ripeti il controllo prima di intervenire sulle segnalazioni successive. Un avviso richiede una valutazione, non necessariamente la stessa correzione di un errore.

## Prova con un documento errato

Questo è l'intero contenuto di `errato.html`. A schermo sembrano esserci un elenco e una casella normali. Prima di aprire il checker, prova a prevedere se cliccare la parola «Dettagli» attiverà la casella.

```html
<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Lista di controllo</title></head>
<body>
  <h1>Prima della consegna</h1>
  <p>Controlli da fare:
    <ul><li>Verificare il titolo</li></ul>
  </p>
  <label for="dettaglio">Dettagli</label>
  <input type="checkbox" id="dettagli">
</body>
</html>
```

| Dove punta la segnalazione | Come risalire alla causa |
| --- | --- |
| Al `</p>` dopo l'elenco: non c'è un paragrafo aperto da chiudere. | L'apertura di `ul` ha già chiuso implicitamente il paragrafo. In *Elementi* l'elenco è suo fratello, non suo figlio; il `</p>` fuori posto produce anche un paragrafo vuoto. Chiudi il testo **prima** di aprire l'elenco. |
| Al `for` della label: manca un controllo associabile con quell'ID. | Confronta `dettaglio` con `dettagli`, non con il testo della label. Il checkbox funziona se lo clicchi direttamente, ma il clic sull'etichetta non lo raggiunge. Correggi il riferimento, non lo stile. |

I messaggi sono descritti per significato: la formulazione e l'ordine possono cambiare. Dopo la sola correzione del paragrafo, la segnalazione sulla label deve rimanere: è un errore indipendente.

## Ripeti con il documento corretto

Usa questo secondo documento come `corretto.html`. L'elenco viene dopo il paragrafo per intenzione dell'autore, non per un recupero del browser.

```html
<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Lista di controllo</title></head>
<body>
  <h1>Prima della consegna</h1>
  <p>Controlli da fare:</p>
  <ul><li>Verificare il titolo</li></ul>
  <label for="dettagli">Dettagli</label>
  <input type="checkbox" id="dettagli">
</body>
</html>
```

Per ripetere il confronto **in locale**, i comandi presuppongono che i due file siano nella directory corrente e che `vnu` sia nel `PATH` (su Windows il pacchetto ufficiale include `bin/vnu.bat`). Non occorre un server web. Il primo comando **deve fallire**: è il controllo che il checker individui il difetto.

```sh
vnu --format gnu errato.html
```

```sh
vnu --format gnu corretto.html
```

Con queste opzioni il primo controllo restituisce codice di uscita `1` per gli errori; per il documento corretto ci si aspetta `0` senza errori. Senza `--Werror` anche un documento con soli avvisi può restituire `0`: leggi i messaggi, non soltanto il codice di uscita.

## Checklist finale

- Hai ricontrollato **lo stesso documento** dopo la modifica? Un esito positivo sul frammento non garantisce che il template non produca, per esempio, ID duplicati quando ripete un componente.
- Hai provato l'effetto nel browser? Nel secondo esempio il clic su «Dettagli» attiva la casella e in *Elementi* non compare più il paragrafo vuoto.
- Hai distinto conformità e usabilità? Un markup senza errori non prova che i link raggiungano le destinazioni, che il contrasto sia sufficiente o che si possa concludere un'operazione da tastiera.

## Collegamenti

- [[Programmazione/HTML e CSS/Pagine/Analizzare i fogli CSS con Stylelint|Controllare anche i fogli di stile con Stylelint]]
- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Struttura di un documento HTML|Struttura di un documento HTML]]
- [[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilità: cosa verificare oltre al markup]]

## Fonti

- [Nu HTML Checker: manuale della CLI, opzioni e codici di uscita](https://validator.github.io/validator/docs/vnu.1.html)
- [HTML Living Standard: contenuto consentito e chiusura del paragrafo](https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element)
- [HTML Living Standard: associazione esplicita di una label](https://html.spec.whatwg.org/multipage/forms.html#attr-label-for)
