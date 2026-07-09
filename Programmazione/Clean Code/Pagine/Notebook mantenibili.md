---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, notebook, dati]
aliases: [Notebook mantenibili, Maintainable notebooks]
prerequisites: [Pipeline dati leggibili]
related: [Script di automazione, Pipeline dati leggibili, Test come documentazione]
---

# Notebook mantenibili

## Sintesi

I **notebook mantenibili** sono notebook usati per esplorazione, analisi o prototipazione senza diventare accumuli fragili di celle eseguite in ordine casuale.

Un notebook pulito deve raccontare il ragionamento e permettere di riprodurre il risultato.

## Problema che risolve

I notebook diventano difficili quando:

- dipendono dall'ordine invisibile di esecuzione;
- contengono variabili globali mutate in molte celle;
- mescolano esperimenti, produzione e output finali;
- non dichiarano sorgenti dati;
- non separano funzioni riusabili e analisi;
- producono risultati non riproducibili.

## Concetto chiave

Un notebook e utile quando mantiene una narrazione lineare:

```text
contesto -> dati -> pulizia -> analisi -> risultato -> limiti
```

Se il codice diventa stabile o operativo, dovrebbe essere estratto in script, modulo o pipeline.

## Dettagli importanti

- Tieni le celle in ordine eseguibile dall'alto verso il basso.
- Sposta funzioni riusabili fuori dal notebook.
- Fissa seed, input e parametri importanti.
- Riduci output rumorosi.
- Documenta assunzioni e limiti dell'analisi.

## Esempio

Struttura leggibile:

```text
1. import e configurazione
2. caricamento dati
3. pulizia e validazione
4. analisi
5. grafici o risultati
6. conclusioni e prossimi passi
```

Questa struttura aiuta sia una persona sia un LLM a capire il contesto.

## Limiti

- I notebook non sono sempre adatti a job di produzione.
- Visualizzazioni interattive possono ridurre riproducibilita.
- Dataset grandi richiedono pipeline o storage dedicati.
- Un notebook pulito non sostituisce test per codice critico.

## Errori comuni

- Usare celle eseguite fuori ordine.
- Lasciare codice morto o output temporanei.
- Salvare credenziali nel notebook.
- Mescolare esperimenti alternativi senza spiegazione.
- Non indicare versione o origine dei dati.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Pipeline dati leggibili]]
- [[Script di automazione]]
- [[Test come documentazione]]
- [[Parsing di input esterni]]

## Fonti

- Joel Grus, *I Don't Like Notebooks*
- Jupyter Documentation
- Wes McKinney, *Python for Data Analysis*
