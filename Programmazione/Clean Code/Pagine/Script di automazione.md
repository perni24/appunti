---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, automazione, script]
aliases: [Script di automazione, Automation scripts]
prerequisites: [Configurazione applicativa, Gestione esplicita degli errori]
related: [File system e IO, Logging e tracing, Pipeline dati leggibili]
---

# Script di automazione

## Sintesi

Gli **script di automazione** eseguono procedure ripetitive: import, export, backup, pulizia dati, generazione file, chiamate API o manutenzione.

Anche se piccoli, devono essere leggibili, configurabili e sicuri da rilanciare.

## Quando usarlo

- Quando una procedura manuale viene ripetuta spesso.
- Quando serve ridurre errori operativi.
- Quando devi trasformare o spostare dati.
- Quando vuoi rendere riproducibile una manutenzione.
- Quando un job deve essere eseguito da CLI, scheduler o CI.

## Come funziona

Uno script mantenibile dovrebbe avere:

- input espliciti;
- configurazione validata;
- dry-run quando utile;
- logging leggibile;
- gestione errori;
- exit code coerenti;
- idempotenza quando possibile.

## API / Sintassi

```text
parse args -> load config -> validate input -> execute steps -> report result
```

Lo script dovrebbe mostrare chiaramente cosa fa e dove puo fallire.

## Esempio pratico

```js
async function main(args, env) {
  const config = loadConfig(env);
  const options = parseArgs(args);

  await exportReport(config, options);
}
```

Separare `main`, configurazione e logica rende lo script testabile.

## Varianti

- Script one-shot: usato una volta, ma comunque tracciabile.
- Script ricorrente: richiede logging e idempotenza.
- Script CI: deve fallire con exit code chiari.
- Script di migrazione: richiede backup o rollback.

## Errori comuni

- Hardcodare percorsi e credenziali.
- Non gestire rilanci parziali.
- Stampare output non strutturato quando serve automazione.
- Non distinguere warning ed errori.
- Lasciare script importanti senza documentazione minima.

## Checklist

- Input e configurazione sono espliciti?
- Lo script puo essere rilanciato in sicurezza?
- Gli errori producono exit code corretti?
- Esiste un dry-run per operazioni rischiose?
- Log e output sono utili a chi lo esegue?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Gestione esplicita degli errori]]
- [[File system e IO]]
- [[Logging e tracing]]
- [[Pipeline dati leggibili]]

## Fonti

- The Twelve-Factor App
- Michael Nygard, *Release It!*
- Martin Fowler, *Refactoring*
