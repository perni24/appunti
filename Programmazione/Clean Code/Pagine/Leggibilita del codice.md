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
  - leggibilita
  - qualita-codice
aliases:
  - Leggibilita del codice
  - Codice leggibile
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Nomi che rivelano intenzione]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Leggibilita del codice
---

# Leggibilita del codice

## Sintesi

Il codice è leggibile quando un altro sviluppatore riesce a prevederne il comportamento senza doverlo eseguire mentalmente riga per riga. La prova non è che «suona bene», ma che due lettori ricavano la stessa regola, inclusi i casi di confine.

## Concetto chiave

La leggibilità ha tre livelli: **locale** (che cosa verifica questa condizione?), **strutturale** (dove viene presa la decisione?) e **di dominio** (che cosa significa «ammesso»?). Un nome come `isValid` può essere grammaticalmente chiaro e non rispondere a nessuna di queste domande.

## Esempio

Il requisito è: «L'ingresso è consentito dai 18 anni compiuti, per un account attivo senza sospensione». I tre campi sono già validati.

```js
function canEnterVenue(member) {
  return member.age >= 18 && member.status === "active" && !member.banned;
}
```

Il nome collega la condizione all'ingresso in un luogo: non dice che l'account sia valido per *qualsiasi* operazione. Il corpo resta visibile in un solo punto. Il chiamante può ora leggere `if (canEnterVenue(member))` senza ricostruire la politica di ingresso.

## Verifica di lettura

| Caso | Esito | Dettaglio che conta |
| --- | --- | --- |
| 17 anni, attivo, non sospeso | Negato | Non ha ancora raggiunto la soglia |
| 18 anni, attivo, non sospeso | Consentito | La soglia è inclusiva |
| 30 anni, attivo, sospeso | Negato | L'età non annulla la sospensione |
| 30 anni, inattivo, non sospeso | Negato | Non basta l'assenza di sospensioni |

## Limiti ed errori comuni

- Nominare l'intera espressione `condition` ne accorcia l'uso ma non ne chiarisce il significato.
- Se per capire una semplice congiunzione devi aprire quattro helper, l'estrazione ha spostato il lavoro sul lettore.
- Leggibilità e correttezza restano distinte: la tabella si può confrontare con il requisito anche se l'implementazione appare chiarissima.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Nomi che rivelano intenzione|Nomi che rivelano intenzione]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
- Google Engineering Practices, [What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
