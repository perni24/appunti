---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, legacy-code, refactoring]
aliases: [Legacy code, Codice legacy]
prerequisites: [Refactoring sicuro, Codice testabile]
related: [Debito tecnico, Code smells, Test di integrazione]
---

# Legacy code

## Sintesi

Il **legacy code** e codice difficile da cambiare con sicurezza. Spesso manca di test, ha dipendenze implicite, logica accoppiata e comportamento poco documentato.

Non e semplicemente codice vecchio: e codice che resiste al cambiamento.

## Problema che risolve

Trattare il legacy code come codice normale porta a modifiche rischiose.

Bisogna prima creare punti di controllo, capire il comportamento esistente e ridurre il rischio prima di cambiare struttura o funzionalita.

## Concetto chiave

La strategia pragmatica e:

```text
capire -> proteggere -> modificare -> ripulire
```

Prima si osserva il comportamento, poi si aggiungono test o controlli, poi si modifica in piccoli passi.

## Dettagli importanti

- I characterization tests descrivono il comportamento attuale, anche se non ideale.
- Le seam sono punti in cui si puo isolare una dipendenza.
- Non tutto il legacy va riscritto.
- Il codice piu rischioso e quello modificato spesso e poco coperto.
- Migliorare una zona mentre la tocchi e piu realistico che ripulire tutto.

## Esempio

Approccio rischioso:

```text
riscrivere il modulo prima di capire tutti i casi reali
```

Approccio piu sicuro:

```text
aggiungere test di caratterizzazione sui casi usati
estrarre una dipendenza esterna
modificare il comportamento richiesto
lasciare il modulo leggermente migliore di prima
```

## Limiti

- Alcune basi legacy hanno vincoli tecnologici reali.
- Aggiungere test puo richiedere refactoring preliminare.
- Riscrivere puo essere giusto quando il comportamento e piccolo e ben compreso.
- La qualita va bilanciata con rischio e valore di business.

## Errori comuni

- Riscrivere tutto per frustrazione.
- Refactorare senza test o osservabilita.
- Eliminare comportamento apparentemente inutile senza verificarlo.
- Ignorare dipendenze esterne e dati storici.
- Considerare legacy solo il codice scritto da altri.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Debito tecnico]]
- [[Code smells]]
- [[Refactoring sicuro]]
- [[Codice testabile]]
- [[Test di integrazione]]

## Fonti

- Michael Feathers, *Working Effectively with Legacy Code*
- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
