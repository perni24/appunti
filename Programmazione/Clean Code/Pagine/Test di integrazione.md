---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, testing, integrazione]
aliases: [Test di integrazione, Integration tests]
prerequisites: [Codice testabile]
related: [Test unitari leggibili, Test come documentazione, Side effects controllati]
---

# Test di integrazione

## Sintesi

I **test di integrazione** verificano che piu componenti lavorino correttamente insieme.

Servono a coprire confini reali: database, API, file system, code, framework, serializzazione e configurazione.

## Problema che risolve

I test unitari possono passare anche quando il sistema reale non funziona.

Gli errori spesso nascono nei punti di contatto:

- mapping errati;
- query sbagliate;
- configurazioni mancanti;
- transazioni non gestite;
- serializzazione incompatibile;
- permessi o credenziali;
- contratti API divergenti.

## Concetto chiave

Un test di integrazione non deve coprire ogni combinazione logica. Deve verificare che i collegamenti critici tra parti del sistema funzionino davvero.

La logica fine resta nei test unitari; il cablaggio reale viene controllato in integrazione.

## Esempio

```text
API request -> controller -> service -> repository -> database -> response
```

Un test di integrazione puo verificare che una richiesta valida crei davvero una riga e restituisca il formato atteso.

## Dettagli importanti

- Usa dati di test isolati e ripetibili.
- Preferisci setup esplicito a fixture opache.
- Pulisci lo stato tra test.
- Verifica i confini piu rischiosi.
- Mantieni pochi test end-to-end completi e piu test di integrazione mirati.

## Limiti

- Sono piu lenti dei test unitari.
- Richiedono ambiente, dati e servizi stabili.
- Possono fallire per problemi esterni non legati al codice.
- Troppi test di integrazione rendono la suite lenta e fragile.

## Errori comuni

- Sostituire ogni test unitario con integrazione.
- Usare database condivisi senza isolamento.
- Dipendere da servizi esterni non controllati.
- Nascondere troppo setup in fixture globali.
- Non verificare migrazioni, serializzazione e configurazione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice testabile]]
- [[Test unitari leggibili]]
- [[Test come documentazione]]
- [[Side effects controllati]]
- [[Validazione ai confini]]

## Fonti

- Martin Fowler, *IntegrationTest*
- Gerard Meszaros, *xUnit Test Patterns*
- Michael Feathers, *Working Effectively with Legacy Code*
