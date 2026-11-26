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
  - errori
  - ux-tecnica
aliases:
  - Messaggi di errore utili
  - Useful error messages
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Logging leggibile]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
title: Messaggi di errore utili
---

# Messaggi di errore utili

## Sintesi

Un errore utile risponde a tre domande: **che cosa non è riuscito, che cosa può fare il destinatario e quale identificatore stabile può usare il programma**. Il dettaglio tecnico utile all'operatore non va necessariamente mostrato all'utente.

## Esempio: tradurre un rifiuto di dominio

Il modello restituisce `empty_invoice` quando si tenta di emettere una bozza vuota. Per una richiesta HTTP ben formata ma non eseguibile secondo la regola del prodotto, l'API di esempio sceglie lo stato 422 e il media type `application/problem+json`. Il corpo illustrativo è:

```json
{
  "type": "https://example.org/problems/empty-invoice",
  "title": "Fattura senza righe",
  "status": 422,
  "detail": "Aggiungi almeno una riga alla bozza prima di emetterla.",
  "code": "empty_invoice"
}
```

Lo **stato HTTP effettivo** deve corrispondere a quello dichiarato. `type` identifica il tipo di problema secondo RFC 9457; il dominio `example.org` è illustrativo. `code` è un'estensione di questa API, non un campo standard obbligatorio. Il client può reagire all'identificatore documentato; non deve analizzare le parole di `detail`, che possono essere tradotte o migliorate.

## Cambia il destinatario, non i fatti

- **Utente:** «Aggiungi almeno una riga» indica la correzione e non suggerisce di ripetere inutilmente la stessa richiesta.
- **Client:** confronta il tipo o il codice stabile. Una modifica al testo italiano non deve rompere l'integrazione.
- **Operatore:** se invece il database è indisponibile, registra la causa interna con l'ID di correlazione e produci un errore di servizio coerente. Non riciclare il 422: l'utente non può correggere un guasto del server aggiungendo righe.

Evita stack trace, SQL e segreti nella risposta. Nei test distingui il contratto del documento (campi e identità del problema) dalla scelta di parole della UI, salvo che un testo preciso sia esso stesso un requisito.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili|Errori recuperabili e non recuperabili]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Logging leggibile|Logging leggibile]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]

## Fonti

- IETF, [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- Robert C. Martin, *Clean Code*; Martin Fowler, *Patterns of Enterprise Application Architecture*; Microsoft, *REST API Guidelines*
