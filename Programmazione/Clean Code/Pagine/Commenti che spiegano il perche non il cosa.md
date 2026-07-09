---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, commenti, documentazione]
aliases: [Commenti che spiegano il perche, Commenti che spiegano il perche non il cosa]
prerequisites: [Clean Code]
related: [Leggibilita del codice, Codice esplicito vs codice implicito]
---

# Commenti che spiegano il perche non il cosa

## Sintesi

I commenti utili spiegano **perche** il codice prende una decisione, non ripetono **cosa** il codice sta gia mostrando.

Un buon commento conserva contesto che non e evidente dal codice.

## Problema che risolve

Commenti ridondanti aumentano rumore e diventano facilmente obsoleti. Commenti assenti in punti decisionali lasciano invece il lettore senza contesto.

La differenza e capire se il commento aggiunge informazione reale.

## Concetto chiave

Il codice dovrebbe spiegare il **cosa** attraverso nomi, struttura e test. Il commento dovrebbe spiegare il **perche** quando la ragione non e deducibile.

Commenta:

- vincoli esterni;
- decisioni non ovvie;
- workaround;
- tradeoff;
- riferimenti a bug o issue;
- ragioni di compatibilita.

## Dettagli importanti

- Se un commento spiega cosa fa una riga, prova prima a rinominare o estrarre una funzione.
- I commenti temporanei devono avere ownership o tracking.
- Un commento falso e peggio di nessun commento.
- Le decisioni architetturali importanti possono stare in documenti dedicati.
- I commenti devono essere aggiornati insieme al codice.

## Esempio

Commento inutile:

```js
// Incrementa il contatore
count++;
```

Commento utile:

```js
// Il provider rifiuta richieste con timestamp futuro anche di pochi secondi.
const safeTimestamp = now.minusSeconds(5);
```

Il secondo commento spiega una ragione esterna non visibile dal codice.

## Limiti

- Non tutto il contesto deve stare nei commenti.
- Troppi commenti possono mascherare codice poco chiaro.
- Alcuni commenti diventano obsoleti rapidamente.
- La documentazione esterna serve quando il contesto e ampio.

## Errori comuni

- Commentare codice ovvio.
- Lasciare TODO senza ticket o responsabilita.
- Non aggiornare commenti dopo refactoring.
- Usare commenti per giustificare nomi poco chiari.
- Scrivere commenti lunghi invece di semplificare il codice.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Leggibilita del codice]]
- [[Codice esplicito vs codice implicito]]
- [[Debito tecnico]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
