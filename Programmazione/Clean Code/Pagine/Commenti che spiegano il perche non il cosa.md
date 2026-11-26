---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - commenti
  - documentazione
aliases:
  - Commenti che spiegano il perche
  - Commenti che spiegano il perche non il cosa
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Commenti che spiegano il perche non il cosa
---

# Commenti che spiegano il perche non il cosa

## Sintesi

Un commento è utile se conserva un'informazione che non si può ricavare dal codice: un vincolo esterno, una scelta tra alternative, il motivo di un workaround. Per documentare un'API è utile anche dire **che cosa promette**: il consiglio «spiega il perché» riguarda soprattutto i commenti interni che parafrasano istruzioni ovvie.

## Esempio: un limite che non si può indovinare

Supponiamo che il destinatario di un export accetti al massimo 100 record **compresa** una riga di controllo, aggiunta al momento della serializzazione. Il codice qui divide solo le righe dati:

```js
function exportBatches(rows) {
  // Il destinatario conta anche la riga di controllo: restano 99 posti per i dati.
  const maxDataRows = 99;
  const batches = [];
  for (let i = 0; i < rows.length; i += maxDataRows) {
    batches.push(rows.slice(i, i + maxDataRows));
  }
  return batches;
}
```

«Incrementa `i`» ripeterebbe un'istruzione visibile. Il commento sul limite impedisce invece una correzione apparentemente ovvia da 99 a 100. Con 100 righe dati il risultato deve avere lotti da 99 e 1; si può verificare senza sapere come funziona il ciclo.

## Dove conservare l'informazione

| Informazione | Posto adatto |
| --- | --- |
| Il significato di una variabile | Nel nome, quando basta |
| Il motivo di un limite non deducibile | Vicino al valore, con il riferimento alla specifica reale se disponibile |
| Un comportamento promesso a chi chiama | Nella documentazione dell'API e in un test del contratto |
| Quando rimuovere un workaround | In un ticket con responsabile e condizione di rimozione; nel codice il rimando utile |
| Una decisione che coinvolge più moduli | Nel documento di progetto, evitando di copiarlo in ogni file |

## Limiti ed errori comuni

Se il requisito cambia, aggiorna **insieme** limite, commento e test: il codice non controlla la verità della spiegazione. Nell'esempio verificare i lotti non verifica il serializzatore né la compatibilità con un servizio reale. Non mascherare con una spiegazione lunga un nome fuorviante o una condizione che si può rendere più chiara.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Google Engineering Practices, [What to look for in a code review: Comments](https://google.github.io/eng-practices/review/reviewer/looking-for.html#comments)
