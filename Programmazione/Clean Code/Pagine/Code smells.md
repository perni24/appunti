---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - code-smell
  - refactoring
aliases:
  - Code smells
  - Code smell
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
  - "[[Programmazione/Clean Code/Pagine/Refactoring sicuro]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
title: Code smells
---

# Code smells

## Sintesi

Un **code smell** è un indizio che suggerisce una domanda sul design. Non è una diagnosi, un bug o un ordine di riscrittura. Una review utile passa da «questa classe è grande» a «per cambiare questa politica devo modificare tre copie e una è già divergente».

## Esempio: sei file per cambiare un prezzo

Una soglia di sconto cambia da 10 a 12 pezzi. Il diff tocca sei file: prima di chiamarlo *shotgun surgery*, guarda **quante decisioni indipendenti** hai dovuto riallineare.

| Cosa trovi nei sei file | Diagnosi | Intervento |
| --- | --- | --- |
| Checkout, preventivo e importatore contengono ciascuno il proprio confronto con 10 | Una sola regola vive in più punti: *shotgun surgery*. | Identifica i chiamanti della stessa politica, caratterizza il comportamento e concentra lì il confronto. |
| Una sola politica, più test, esempi e note di rilascio | Il numero dei file da solo non dimostra duplicazione. | Aggiorna il contratto e i casi interessati, senza introdurre un altro livello. |
| Il preventivo è promozionale; gli ordini storici conservano lo sconto pattuito | I numeri oggi uguali non implicano la stessa regola. | Non ricalcolare gli ordini storici con la soglia corrente solo per eliminare una somiglianza. |

Se decidi di estrarre la politica, **separa il refactoring dal cambio di prezzo**: con la vecchia soglia verifica 9, 10 e 11 pezzi, poi sposta il calcolo lasciando invariati i risultati. Solo dopo cambia il requisito e prova 11, 12 e 13. Se le implementazioni iniziali divergono, chiarisci prima quale comportamento è voluto: un test di caratterizzazione registra l'esistente, non lo approva.

## Altri segnali da leggere con cautela

- **Divergent change:** il contrario della dispersione appena descritta: un solo modulo cambia per richieste scollegate, come prezzo, notifiche e formato PDF.
- **Feature envy:** un metodo legge molti dettagli di un altro oggetto per prendere una decisione che potrebbe appartenere a quest'ultimo. Verifica prima che non sia semplicemente un adattatore di dati.
- **Primitive obsession, flag ambigui, codice apparentemente morto:** cerca parametri scambiati, combinazioni non valide o punti di ingresso non evidenti. Un flag davvero binario o una funzione usata tramite registrazione dinamica non sono difetti per definizione.

## Quando non intervenire

Priorità e rischio contano: una duplicazione locale stabile può costare meno di un'astrazione condivisa prematura. Dai priorità a segnali con un effetto osservato (correzioni ripetute, incompatibilità, regressioni) e un modo per verificare la modifica. Un linter o una soglia di righe sono inviti a guardare, non misure sufficienti della qualità.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Primitive obsession|Primitive obsession]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]

## Fonti

- Martin Fowler, [Code Smell](https://martinfowler.com/bliki/CodeSmell.html) e *Refactoring*
- Kent Beck, *Implementation Patterns*
