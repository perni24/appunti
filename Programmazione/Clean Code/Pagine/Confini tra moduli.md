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
  - moduli
  - architettura
aliases:
  - Confini tra moduli
  - Boundary tra moduli
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/Struttura delle cartelle]]"
title: Confini tra moduli
---

# Confini tra moduli

## Sintesi

Un confine definisce **ciò su cui gli altri moduli possono fare affidamento**: percorso di import, nomi, unità, risultati ed errori. Un file `index` comunica l'ingresso consigliato; da solo non impedisce a un altro file di importare direttamente un dettaglio interno.

## Esempio: esporre il prezzo, non il file del listino

Riprendiamo `rates.mjs` dalla nota [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]. Supponiamo che il modulo sia un pacchetto Node installato con il nome `@app/shipping`. Nella sua radice il `package.json` espone solo l'ingresso principale:

```json
{
  "name": "@app/shipping",
  "private": true,
  "exports": "./index.mjs"
}
```

Il file `index.mjs` riesporta un solo nome. È il pacchetto, non il chiamante, a conoscere la posizione di `rates.mjs`:

```js
export { shippingFeeCents } from "./rates.mjs";
```

Il consumatore usa l'ingresso pubblico:

```js
import { shippingFeeCents } from "@app/shipping";

const fee = shippingFeeCents(501); // 590 centesimi
```

Un import per nome di pacchetto da `@app/shipping/rates.mjs` fallisce con `ERR_PACKAGE_PATH_NOT_EXPORTED`, anche se il file esiste. Se sposti il listino, puoi aggiornare il solo percorso nella facciata e rieseguire lo **stesso consumatore**. Se cambi centesimi in euro, invece, rompi il contratto anche conservando nome e percorso.

## Quanto protegge il confine?

- `exports` governa la risoluzione per **nome di pacchetto**. Non è una barriera di sicurezza sul filesystem e non vieta import relativi tra semplici cartelle dello stesso progetto. Per questi ultimi occorrono regole di dipendenza, lint o review.
- `private: true` evita la pubblicazione accidentale con npm; non rende privati i file. Dichiarare `exports` in un pacchetto già usato può rompere gli import profondi che prima funzionavano.
- Non riesportare indistintamente ogni helper con `export *`. Se un tipo interno, una tabella o un errore del driver diventa parte del contratto, sostituirlo può richiedere modifiche in tutti i consumatori.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Struttura delle cartelle|Struttura delle cartelle]]

## Fonti

- Node.js, [Packages: package entry points](https://nodejs.org/api/packages.html#package-entry-points)
- David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*; Robert C. Martin, *Clean Architecture*
