---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, naming, intenzione]
aliases: [Nomi che rivelano intenzione, Intention-revealing names]
prerequisites: [Naming di variabili e funzioni]
related: [Leggibilita del codice, Principio del minimo stupore]
---

# Nomi che rivelano intenzione

## Sintesi

I **nomi che rivelano intenzione** spiegano il motivo o il concetto dietro una variabile, funzione o classe, non solo la sua forma tecnica.

Un nome buono riduce la distanza tra codice e dominio.

## Problema che risolve

Un nome puo essere tecnicamente corretto ma poco utile:

```js
const list = [];
```

Il lettore sa che e una lista, ma non sa di cosa, perche esiste o come verra usata.

## Concetto chiave

Un nome rivela intenzione quando chiarisce:

- cosa rappresenta;
- perche esiste;
- quale ruolo ha nel flusso;
- quale regola di dominio incarna;
- quale risultato produce.

Il nome deve evitare domande inutili.

## Dettagli importanti

- Preferisci nomi di dominio a nomi tecnici generici.
- Evita nomi basati solo sul tipo: `array`, `object`, `map`.
- Usa nomi coerenti per lo stesso concetto.
- Una funzione dovrebbe dire cosa ottieni, non solo cosa fa internamente.
- Se serve un commento per spiegare un nome, spesso il nome e debole.

## Esempio

Nome tecnico:

```js
const days = 30;
```

Nome intenzionale:

```js
const trialPeriodDays = 30;
```

La seconda versione comunica una regola di dominio.

## Limiti

- Un nome non puo contenere tutta la documentazione.
- Nomi troppo specifici possono diventare falsi se il comportamento cambia.
- In codice molto locale, un nome breve puo bastare.
- Il dominio deve essere compreso prima di nominare bene.

## Errori comuni

- Usare `result`, `data`, `value` fuori da scope immediati.
- Nominare in base a come il dato e calcolato invece che al suo significato.
- Usare sinonimi diversi per lo stesso concetto.
- Nascondere regole di business dietro nomi generici.
- Usare nomi che promettono piu di quanto il codice faccia.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Naming di variabili e funzioni]]
- [[Leggibilita del codice]]
- [[Principio del minimo stupore]]
- [[Codice esplicito vs codice implicito]]

## Fonti

- Robert C. Martin, *Clean Code*
