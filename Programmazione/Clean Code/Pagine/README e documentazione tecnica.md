---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, documentazione, readme]
aliases: [README e documentazione tecnica, Documentazione tecnica]
prerequisites: [Clean Code]
related: [Organizzazione dei file, Convenzioni di progetto, Commenti temporanei e TODO]
---

# README e documentazione tecnica

## Sintesi

Il **README** e la documentazione tecnica spiegano come orientarsi nel progetto: cosa fa, come si avvia, come si testa, come si configura e quali decisioni importanti sono state prese.

Nel Clean Code la documentazione non sostituisce codice leggibile, ma riduce contesto implicito.

## Problema che risolve

Un progetto puo avere buon codice ma essere difficile da usare se nessuno sa:

- come installarlo;
- quali comandi eseguire;
- dove mettere configurazioni;
- come lanciare test;
- come fare deploy;
- quali convenzioni seguire.

Questa conoscenza non dovrebbe vivere solo nella testa del team.

## Concetto chiave

La documentazione tecnica dovrebbe rispondere alle domande operative piu frequenti.

Un buon README contiene:

- scopo del progetto;
- prerequisiti;
- installazione;
- comandi principali;
- configurazione;
- test;
- struttura generale;
- link a documenti piu profondi.

## Dettagli importanti

- Il README deve restare aggiornato con il codice.
- I documenti lunghi vanno divisi per tema.
- Le decisioni architetturali importanti possono stare in ADR o note dedicate.
- La documentazione deve distinguere setup locale, test e deploy.
- Esempi e comandi devono essere copiabili.

## Esempio

README minimo:

````md
# Nome progetto

## Requisiti

- Node.js 22

## Setup

```bash
npm install
```

## Comandi

```bash
npm test
npm run lint
npm run build
```
````

Un README cosi riduce domande ripetute e onboarding lento.

## Limiti

- Documentazione non aggiornata diventa dannosa.
- Troppa documentazione puo non essere letta.
- Il codice deve restare la fonte principale del comportamento.
- Alcuni dettagli vanno automatizzati invece che documentati.

## Errori comuni

- Scrivere README iniziale e poi dimenticarlo.
- Documentare comandi che non funzionano piu.
- Mescolare guida utente, guida sviluppo e decisioni architetturali.
- Nascondere configurazioni importanti.
- Usare documentazione per compensare codice confuso.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Organizzazione dei file]]
- [[Convenzioni di progetto]]
- [[Commenti temporanei e TODO]]
- [[Leggibilita del codice]]

## Fonti

- GitHub Docs, *About READMEs*
- Diataxis, *Documentation system*
