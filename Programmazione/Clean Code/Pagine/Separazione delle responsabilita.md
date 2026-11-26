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
  - design
  - responsabilita
aliases:
  - Separazione delle responsabilita
  - Separation of concerns
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
  - "[[Programmazione/Clean Code/Pagine/SOLID]]"
title: Separazione delle responsabilita
---

# Separazione delle responsabilita

## Sintesi

Separare le responsabilità significa decidere **chi risponde a ciascuna domanda**. In un annullamento di prenotazione «la richiesta è leggibile?», «l'annullamento è ancora consentito?» e «la modifica è stata salvata?» sono domande diverse. Spostare le tre risposte da un controller a un unico `Service` non le separa.

## Esempio: annullare fino a 24 ore prima

Nel prodotto di esempio l'annullamento è consentito **anche esattamente 24 ore prima** dell'inizio. Si tratta di 24 ore trascorse, non del giorno di calendario precedente. La regola opera su istanti già validati, in millisecondi, forniti dal caso d'uso:

```js
function cancellationAllowed(startsAtMs, nowMs) {
  const noticeMs = 24 * 60 * 60 * 1000;
  return startsAtMs - nowMs >= noticeMs;
}
```

| Responsabile | Decisione che gli appartiene |
| --- | --- |
| Adattatore HTTP | Interpreta identificatore e richiesta; traduce gli esiti del caso d'uso in risposte HTTP. Non decide la soglia. |
| Caso d'uso | Carica la prenotazione, prende l'ora di riferimento, consulta la regola e chiede il salvataggio solo se l'annullamento è ammesso. |
| Regola di dominio | Decide l'ammissibilità temporale. Non legge né il database né l'orologio di sistema. |
| Adattatore di persistenza | Salva lo stato e riferisce conflitti o errori. Non trasforma un errore di scrittura in un successo. |

## Verifica pratica

A 24 ore esatte la funzione restituisce `true`; un millisecondo dopo restituisce `false`. Per verificare questa soglia non occorre un server. Servono invece altre prove per dimostrare che il controller traduca bene gli esiti, che il repository scriva e che due richieste concorrenti non annullino due volte la stessa prenotazione. Se la scadenza passa a 48 ore, cerca la costante nel dominio, non in ciascun ingresso HTTP o CLI.

## Quando fermarsi

Questa suddivisione può vivere in poche funzioni nello stesso modulo. La separazione delle responsabilità non richiede una classe per riga della tabella. Non spargere la decisione temporale per «difesa»: due copie della regola possono divergere proprio sul caso limite.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/SOLID|SOLID]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]

## Fonti

- Edsger W. Dijkstra, [On the role of scientific thought](https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD447.html)
- Robert C. Martin, *Clean Architecture*
