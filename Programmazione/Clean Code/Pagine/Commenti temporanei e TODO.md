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
  - todo
  - debito-tecnico
aliases:
  - Commenti temporanei e TODO
  - TODO nel codice
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Commenti che spiegano il perche non il cosa]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
  - "[[Programmazione/Clean Code/Pagine/README e documentazione tecnica]]"
title: Commenti temporanei e TODO
---

# Commenti temporanei e TODO

## Sintesi

Un `TODO` utile segnala una **condizione temporanea**: spiega perché il codice attuale è necessario e quale fatto permetterà di eliminarlo. Il ticket serve a gestire il lavoro; il commento nel codice serve a impedire che qualcuno rimuova troppo presto il comportamento provvisorio.

## Esempio: migrare un campo senza scartare lo zero

Nel caso di esempio due versioni del catalogo inviano prezzi in centesimi. La nuova usa `unitPriceCents`, la precedente `price_cents`. Finché esiste almeno un produttore vecchio, il lettore deve accettare entrambi. `CAT-42` è un ticket illustrativo, non una issue del vault. L'input della funzione è un record JSON già riconosciuto come oggetto.

```js
function readUnitPriceCents(row) {
  // TODO(CAT-42, team catalogo): rimuovere il fallback dopo la migrazione
  // dell'ultimo produttore e l'esaurimento dei messaggi nel vecchio formato.
  const value = Object.hasOwn(row, "unitPriceCents") ? row.unitPriceCents : row.price_cents;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Prezzo atteso in centesimi interi non negativi");
  }
  return value;
}
```

Un nuovo prezzo pari a 0 prevale sul vecchio. Se il campo nuovo **è presente ma invalido**, il lettore segnala l'errore anziché ripiegare silenziosamente sul vecchio valore. Un semplice `newPrice || oldPrice` confonderebbe assenza e zero. Il commento non spiega l'operatore: conserva la ragione per cui non si legge ancora soltanto il nuovo campo.

## Come chiudere il TODO

1. Nel ticket identifica i produttori interessati, il responsabile e il criterio per considerare consumati anche i messaggi arretrati. Una data sul calendario non dimostra da sola che il vecchio formato sia scomparso.
2. Fino a quel momento conserva prove per «solo vecchio», «solo nuovo», «entrambi», «nuovo invalido». Il test descrive il comportamento attuale, non certifica lo stato della migrazione in produzione.
3. Quando c'è evidenza che il vecchio formato non serve più, elimina insieme fallback e commento. Aggiorna il test per verificare che un record con il solo campo vecchio sia ora rifiutato.

## Limiti ed errori comuni

Per una regola permanente spiega il *perché* senza chiamarla temporanea. Se un difetto viola già oggi un requisito indispensabile, non rendere accettabile il rilascio scrivendo `TODO: sistemare`. Se non c'è una riga specifica su cui mettere in guardia il lettore, può bastare il ticket.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Commenti che spiegano il perche non il cosa|Commenti che spiegano il perche non il cosa]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/README e documentazione tecnica|README e documentazione tecnica]]
- [[Programmazione/Clean Code/Pagine/Convenzioni di progetto|Convenzioni di progetto]]

## Fonti

- Google, [Python Style Guide: TODO comments](https://google.github.io/styleguide/pyguide.html#312-todo-comments). Qui il formato è adattato al team di esempio.
- Robert C. Martin, *Clean Code*; Martin Fowler, *Technical Debt*
