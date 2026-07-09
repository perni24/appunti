---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, errori, ux-tecnica]
aliases: [Messaggi di errore utili, Useful error messages]
prerequisites: [Errori recuperabili e non recuperabili, Validazione ai confini]
related: [Logging leggibile, Contratti impliciti ed espliciti, Test come documentazione]
---

# Messaggi di errore utili

## Sintesi

Un **messaggio di errore utile** spiega cosa e andato storto, dove e successo e cosa si puo fare dopo.

Non deve essere lungo: deve essere specifico, sicuro e adatto al destinatario.

## Problema che risolve

Messaggi generici rallentano debug e uso del sistema.

Esempi deboli:

- `Error`;
- `Invalid input`;
- `Something went wrong`;
- `Operation failed`;
- `Bad request`.

Questi messaggi non dicono quale regola e stata violata o quale azione e possibile.

## Concetto chiave

Un errore ha destinatari diversi:

- utente finale;
- sviluppatore;
- operatore;
- sistema chiamante.

Il messaggio deve contenere il livello di dettaglio giusto per il destinatario, senza esporre informazioni sensibili.

## Esempio

Poco utile:

```js
throw new Error("Invalid input");
```

Piu utile:

```js
throw new Error("Invoice date is required before issuing an invoice");
```

Il secondo messaggio indica campo, regola e contesto.

## Dettagli importanti

- Distingui messaggi interni e messaggi mostrati all'utente.
- Includi identificativi tecnici nei log, non sempre nella UI.
- Usa codici errore stabili per API e integrazioni.
- Evita dettagli di sicurezza come query, token o stack trace pubblici.
- I messaggi devono restare allineati con contratti e test.

## Limiti

- Messaggi troppo dettagliati possono esporre informazioni.
- Un messaggio non sostituisce una gestione errore corretta.
- Traduzione e localizzazione possono richiedere codici separati dal testo.
- In sistemi distribuiti la causa originale puo essere lontana.

## Errori comuni

- Restituire errori generici per ogni caso.
- Mostrare stack trace all'utente.
- Nascondere la causa reale dietro messaggi rassicuranti.
- Cambiare testi usati da client automatici invece di usare codici errore.
- Non testare i casi di errore importanti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Errori recuperabili e non recuperabili]]
- [[Validazione ai confini]]
- [[Logging leggibile]]
- [[Contratti impliciti ed espliciti]]
- [[Test come documentazione]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Microsoft, *REST API Guidelines*
