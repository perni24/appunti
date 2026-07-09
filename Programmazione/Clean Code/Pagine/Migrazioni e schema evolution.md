---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, database, migrazioni]
aliases: [Migrazioni e schema evolution, Schema evolution]
prerequisites: [Query leggibili, Codice pronto al deploy]
related: [Repository pattern, Configurazione applicativa, Test di integrazione]
---

# Migrazioni e schema evolution

## Sintesi

Le **migrazioni** modificano lo schema o i dati del database in modo tracciabile. La **schema evolution** riguarda come far evolvere il modello dati senza rompere applicazione, deploy e integrazioni.

Nel Clean Code il database fa parte del sistema, quindi anche le modifiche allo schema devono essere leggibili e sicure.

## Quando usarlo

- Quando aggiungi, rinomini o rimuovi colonne.
- Quando cambi vincoli o indici.
- Quando separi tabelle o relazioni.
- Quando devi migrare dati esistenti.
- Quando il deploy applicativo e il deploy database non sono istantanei.

## Come funziona

Una migrazione affidabile dovrebbe essere:

- versionata;
- ripetibile in ambienti diversi;
- leggibile;
- testata;
- compatibile con il deploy;
- reversibile o accompagnata da un piano di rollback.

Per cambiamenti rischiosi conviene usare passaggi progressivi.

## API / Sintassi

```text
expand -> migrate data -> switch application -> contract
```

Questo approccio riduce il rischio nei deploy: prima si aggiunge compatibilita, poi si sposta il traffico, poi si rimuove il vecchio.

## Esempio pratico

Rinominare una colonna in modo sicuro:

```text
1. aggiungi nuova colonna
2. scrivi su entrambe
3. migra dati storici
4. leggi dalla nuova colonna
5. rimuovi la vecchia colonna in un deploy successivo
```

La modifica evita rotture durante deploy parziali.

## Varianti

- Migrazioni schema-only.
- Migrazioni dati.
- Backfill asincroni.
- Migrazioni backward-compatible.
- Feature flag per cambio lettura/scrittura.

## Errori comuni

- Fare migrazioni distruttive nello stesso deploy del codice.
- Non considerare dati esistenti.
- Non testare migrazioni su dataset realistici.
- Rinominare o rimuovere colonne senza fase di compatibilita.
- Ignorare lock, tempi di esecuzione e rollback.

## Checklist

- La migrazione e versionata?
- E compatibile con il codice precedente e nuovo?
- I dati esistenti vengono gestiti?
- Esiste un piano di rollback o mitigazione?
- La migrazione e stata provata su dati simili alla produzione?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Query leggibili]]
- [[Repository pattern]]
- [[Codice pronto al deploy]]
- [[Test di integrazione]]
- [[Configurazione applicativa]]

## Fonti

- Martin Fowler, *Evolutionary Database Design*
- Pramod Sadalage, Scott Ambler, *Refactoring Databases*
- PostgreSQL Documentation, *Data Definition*
