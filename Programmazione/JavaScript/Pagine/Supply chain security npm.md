---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - npm
  - sicurezza
aliases: []
prerequisites: []
related: []
---

# Supply chain security npm

## Sintesi

La **supply chain security npm** riguarda i rischi introdotti da dipendenze, transitive dependencies, script di installazione e pacchetti malevoli nell'ecosistema JavaScript.

## Concetto chiave

Un progetto JavaScript puo importare migliaia di pacchetti indiretti. Ogni pacchetto puo eseguire codice in fase di build, installazione o runtime.

## Rischi principali

- Pacchetti compromessi.
- Typosquatting.
- Dependency confusion.
- Script `postinstall` malevoli.
- Versioni transitive aggiornate senza controllo.

## Pratiche utili

```powershell
npm audit
npm ci
```

- Usare lockfile versionati.
- Preferire `npm ci` in CI.
- Ridurre dipendenze inutili.
- Controllare manutenzione e reputazione dei pacchetti.
- Limitare token npm e segreti in CI.

## Errori comuni

- Aggiornare tutto senza leggere changelog.
- Ignorare lockfile.
- Installare pacchetti con nomi simili a librerie famose.

## Obiettivo

Da completare: descrivere cosa ottenere in pratica.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Procedura

1. Da completare.
2. Da completare.
3. Da completare.

## Snippet

```text
Da completare con codice o comando riutilizzabile.
```

## Adattamenti comuni

- Da completare: varianti per casi frequenti.

## Debug rapido

- Da completare: controlli rapidi in caso di errore.

## Checklist finale

- Da completare: verifiche finali.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]


