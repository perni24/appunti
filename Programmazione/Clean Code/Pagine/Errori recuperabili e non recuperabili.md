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
  - resilienza
aliases:
  - Errori recuperabili e non recuperabili
  - Recoverable and unrecoverable errors
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
  - "[[Programmazione/Clean Code/Pagine/Logging leggibile]]"
title: Errori recuperabili e non recuperabili
---

# Errori recuperabili e non recuperabili

## Sintesi

Un errore è recuperabile **per un certo chiamante** se quel chiamante dispone di un'azione sicura e prevista per proseguire. «Recuperabile» non è sinonimo di «ritentabile»; restituire un valore anziché lanciare un'eccezione non rende automaticamente possibile il recupero.

## Esempio: quattro esiti di una richiesta

| Cosa sappiamo | Chi può agire | Comportamento sensato |
| --- | --- | --- |
| La quantità non è valida; nessuna scrittura avviata | Utente o client | Mostrare il campo da correggere. Ripetere lo stesso input non aiuta. |
| La bozza è già stata emessa | Caso d'uso | Ricaricare lo stato o mostrare l'esito già noto, secondo contratto. Non ricreare la fattura. |
| Una lettura temporaneamente indisponibile non ha prodotto effetti applicativi | Chiamante della lettura | Un nuovo tentativo può servire, con limite di tempo, numero di tentativi e attesa fra di essi. |
| Una scrittura va in timeout dopo l'invio | Sistema che gestisce l'operazione | L'esito è **ignoto**, non necessariamente negativo. Cercare l'operazione tramite ID, oppure riprovare solo con garanzie di idempotenza adeguate. |

## Come scegliere la rappresentazione

Per gli esiti attesi della nota [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]], il chiamante può distinguere `empty_invoice` e `not_draft` senza interpretare testo libero. Se il repository non è disponibile, restituire `empty_invoice` sarebbe falso: propaga invece il guasto con contesto e conserva la causa. Al confine esterno lo si può tradurre senza esporre dettagli interni.

## Quando fermarsi

Una configurazione obbligatoria mancante può rendere impossibile **avviare il servizio**, pur essendo correggibile dall'operatore. Un input sbagliato può far fallire una singola riga di un lotto senza obbligare a terminare l'intero processo. Stabilisci esplicitamente l'unità di fallimento: riga, richiesta, transazione o processo. Evita sia il `catch` che finge successo sia i retry illimitati che moltiplicano il carico o gli effetti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Logging leggibile|Logging leggibile]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]

## Fonti

- Amazon Builders' Library, [Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- Robert C. Martin, *Clean Code*; Michael Nygard, *Release It!*; Martin Fowler, *Patterns of Enterprise Application Architecture*
