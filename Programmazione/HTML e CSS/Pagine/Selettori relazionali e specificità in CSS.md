---
date: 2026-11-27
title: "Selettori relazionali e specificità in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [css, selettori, cascata]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Livelli della cascata con layer|Livelli della cascata con layer]]"
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
---

# Selettori relazionali e specificità in CSS

## Sintesi

Prima chiediti **quale elemento vuoi stilizzare**. Con `:has()` lo scegli in base a una relazione con un altro elemento. Con `:is()` e `:where()` raggruppi alternative per lo stesso selettore. Queste ultime possono selezionare esattamente gli stessi elementi, ma non danno alla regola lo stesso peso.

## Evidenziare la voce che contiene una casella selezionata

```html
<fieldset>
  <legend>Notifiche</legend>
  <label class="opzione"><input type="checkbox" checked> Email</label>
  <label class="opzione"><input type="checkbox"> Riepilogo</label>
</fieldset>
```

```css
.opzione {
  display: block;
  border-inline-start: 4px solid transparent;
  padding-inline-start: 0.5rem;
}
.opzione:has(> input:checked) {
  border-inline-start-color: #14613b;
}
```

Il bordo appare sulla **label**, non sulla casella. Il browser verifica per ogni `.opzione` se ha un figlio diretto `input` selezionato. Attiva «Riepilogo» e disattiva «Email»: il bordo segue la spunta, senza copiare lo stato in una classe JavaScript. La casella nativa resta visibile e utilizzabile da tastiera.

Se racchiudi l'input in uno `span` dentro la label, il bordo scompare anche se la casella resta selezionata. Togli `>` soltanto se vuoi accettare **qualsiasi discendente**. Non è un selettore riservato ai genitori: `h2:has(+ p)` seleziona il titolo se il suo elemento fratello immediatamente successivo è un paragrafo.

## Stessi titoli, due colori possibili

```html
<section class="catalogo">
  <article class="scheda"><h2 class="titolo">Corso CSS</h2></article>
</section>
```

```css
:is(.scheda, #archivio) > .titolo { color: #163d70; }
.catalogo .titolo { color: #923b15; }
```

Il titolo è **blu**. Ora sostituisci soltanto `:is` con `:where`: il titolo diventa **ruggine**. Nessun elemento ha cambiato classe e nessun elemento ha l'ID `archivio`.

| Selettore | Specificità (ID, classi, tipi) | Come leggerlo |
| --- | --- | --- |
| `:is(.scheda, #archivio) > .titolo` | (1, 1, 0) | Conta l'argomento più specifico, qui l'ID, anche se a corrispondere è stata `.scheda`. Si aggiunge la classe del titolo. |
| `:where(.scheda, #archivio) > .titolo` | (0, 1, 0) | Tutta la parte dentro `:where()` contribuisce zero; la classe **fuori** dalla funzione conta. |
| `.catalogo .titolo` | (0, 2, 0) | Due classi: perde contro il primo selettore ma vince contro il secondo. |
| `.opzione:has(> input:checked)` | (0, 2, 1) | Alla classe esterna si sommano la pseudo-classe `:checked` e il tipo `input`. Il combinatore `>` non pesa. |

Le terne si confrontano da sinistra, non si sommano in un punteggio decimale. Il confronto qui è tra regole autore normali, nello stesso contesto di cascata e senza layer. Un selettore più specifico non scavalca automaticamente la precedenza dei layer o una dichiarazione importante.

## Scegliere e correggere il selettore

- **Alternative con lo stesso stile:** usa `.voce:is(:hover, :focus-visible)` per non ripetere `.voce`. Non introdurre un ID fra le alternative solo per far vincere la regola: aumenterebbe il peso di tutti i casi.
- **Stili di base facili da personalizzare:** usa `:where()` per indicare il contesto senza aumentarne il peso. Non è ereditarietà e non impedisce alle dichiarazioni di applicarsi.
- **Più condizioni relazionali:** `.scheda:has(h2, img)` richiede un titolo **oppure** un'immagine; `.scheda:has(h2):has(img)` richiede **entrambi**. Non annidare `:has()` dentro un altro `:has()`: il selettore non è valido.
- **Diagnosi in DevTools:** se la regola non corrisponde, controlla la struttura HTML e il combinatore. Se corrisponde ma la dichiarazione è barrata a favore di un'altra, confronta prima il contesto di cascata e poi la specificità. Cambiare il peso non corregge una relazione inesistente.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]
- [[Programmazione/HTML e CSS/Pagine/Livelli della cascata con layer|Livelli della cascata con layer]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]

## Fonti

- [CSSWG: il selettore relazionale :has()](https://www.w3.org/TR/selectors-4/#relational)
- [CSSWG: calcolo della specificità, incluse :is() e :where()](https://www.w3.org/TR/selectors-4/#specificity-rules)
