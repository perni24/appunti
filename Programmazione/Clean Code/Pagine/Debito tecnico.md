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
  - debito-tecnico
  - manutenzione
aliases:
  - Debito tecnico
  - Technical debt
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Manutenibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Semplicita e complessita accidentale]]"
title: Debito tecnico
---

# Debito tecnico

## Sintesi

Il debito tecnico è una metafora per parlare del **costo aggiuntivo dei cambiamenti futuri** dovuto a una scelta tecnica. Può nascere da un compromesso deliberato oppure emergere quando il team impara qualcosa che non sapeva all'inizio. Un difetto visibile oggi, una funzionalità mancante e un debito possono coesistere, ma non sono la stessa cosa.

## Concetto chiave

Il **capitale** è il lavoro che servirebbe per eliminare l'ostacolo. Gli **interessi** sono il lavoro extra e il rischio che sostieni ogni volta che l'ostacolo conta. Non maturano a un tasso fisso: una parte stabile e prossima alla dismissione può costare meno lasciata com'è.

## Esempio: rendere una decisione verificabile

Per un pilota si è copiata la regola di sconto dal checkout al preventivo. Alla seconda campagna il team ha dovuto modificare due punti e correggere un preventivo discordante. Il prezzo errato è un **bug** da risolvere; dover riallineare a ogni campagna due copie della stessa politica è il **debito**.

| Da registrare | Esempio per questo caso |
| --- | --- |
| Beneficio iniziale | Avviare il pilota senza modificare il checkout |
| Evidenza degli interessi | Due interventi per campagna e un disallineamento osservato |
| Intervento e proprietario | Il team prezzi estrae la regola condivisa e verifica entrambi i chiamanti |
| Quando rivalutare | Prima della prossima campagna; se il pilota termina, rimuovere la copia |
| Criterio di chiusura | Un'unica decisione sullo sconto; preventivo e checkout concordano alla soglia |

## Limiti ed errori comuni

Non basta aprire un TODO o proporre una riscrittura. Chiedi quale cambiamento costa più del necessario, con quale frequenza si presenta e quanto costerebbe correggere la causa. Se non hai ancora evidenza, annota un'ipotesi da verificare; un nome che semplicemente non piace non giustifica una priorità di progetto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Semplicita e complessita accidentale|Semplicita e complessita accidentale]]
- [[Programmazione/Clean Code/Pagine/Commenti che spiegano il perche non il cosa|Commenti che spiegano il perche non il cosa]]

## Fonti

- Ward Cunningham, metafora del technical debt
- Martin Fowler, [Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
