---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, naming, leggibilita]
aliases: [Naming di variabili e funzioni, Naming]
prerequisites: [Clean Code]
related: [Nomi che rivelano intenzione, Leggibilita del codice]
---

# Naming di variabili e funzioni

## Sintesi

Il **naming di variabili e funzioni** e una delle parti piu importanti del Clean Code. Un buon nome comunica intenzione, ruolo e livello di astrazione.

Un nome sbagliato obbliga il lettore a leggere l'implementazione per capire il concetto.

## Problema che risolve

Nomi vaghi come `data`, `item`, `tmp`, `handle`, `process` o `doStuff` rendono difficile capire cosa rappresenta il codice.

Un buon naming riduce commenti inutili e rende piu semplice individuare errori logici.

## Concetto chiave

Un nome efficace risponde a una domanda:

- variabile: cosa rappresenta?
- funzione: quale azione o trasformazione esegue?
- booleano: quale condizione esprime?
- collezione: che tipo di elementi contiene?

Il nome deve essere proporzionato allo scope: piu un simbolo vive a lungo, piu deve essere chiaro.

## Dettagli importanti

- Usa nomi di dominio quando esistono.
- Evita abbreviazioni non condivise.
- Una funzione dovrebbe avere un verbo o una frase verbale.
- Una variabile dovrebbe avere un sostantivo o frase nominale.
- I booleani funzionano bene con prefissi come `is`, `has`, `can`, `should`.
- Nomi generici sono accettabili solo in scope molto piccoli.

## Esempio

Naming debole:

```js
const d = getData(u);
process(d);
```

Naming piu chiaro:

```js
const activeSubscriptions = getActiveSubscriptions(user);
sendRenewalReminder(activeSubscriptions);
```

Il secondo esempio comunica il dominio senza leggere l'implementazione.

## Limiti

- Nomi troppo lunghi possono diventare rumorosi.
- In algoritmi locali, nomi brevi possono essere accettabili.
- Alcune abbreviazioni sono standard nel dominio.
- Il naming deve restare coerente con il linguaggio e il team.

## Errori comuni

- Usare nomi che descrivono il tipo tecnico invece del significato.
- Cambiare nome allo stesso concetto in moduli diversi.
- Usare verbi generici per funzioni importanti.
- Usare booleani negativi difficili da leggere.
- Inserire dettagli implementativi nel nome quando non servono.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Nomi che rivelano intenzione]]
- [[Leggibilita del codice]]
- [[Funzioni con responsabilita singola]]
- [[Codice esplicito vs codice implicito]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
