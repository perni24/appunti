---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, refactoring, testing]
aliases: [Refactoring sicuro, Safe refactoring]
prerequisites: [Codice testabile, Test unitari leggibili]
related: [Legacy code, Code smells, Test di integrazione]
---

# Refactoring sicuro

## Sintesi

Il **refactoring sicuro** modifica la struttura interna del codice senza cambiare il comportamento osservabile.

E sicuro quando esistono feedback rapidi: test, piccoli passi, controllo versione e verifiche manuali mirate.

## Problema che risolve

Il codice peggiora quando ogni modifica e troppo rischiosa.

Senza refactoring, si accumulano:

- duplicazione;
- funzioni lunghe;
- dipendenze implicite;
- nomi deboli;
- code smells;
- debito tecnico;
- paura di modificare.

## Concetto chiave

Refactorare non significa riscrivere.

Significa migliorare il design in piccoli passaggi verificabili, mantenendo il sistema funzionante dopo ogni passo.

## Dettagli importanti

- Prima caratterizza il comportamento esistente.
- Cambia una cosa per volta.
- Usa test automatici quando disponibili.
- Mantieni commit piccoli se il lavoro e lungo.
- Se il comportamento cambia, non e solo refactoring: e anche modifica funzionale.

## Esempio

Sequenza prudente:

```text
1. aggiungi test sul comportamento attuale
2. rinomina variabili poco chiare
3. estrai una funzione piccola
4. sposta duplicazione in un punto unico
5. rilancia i test
```

Ogni passaggio ha rischio limitato.

## Limiti

- Senza test, il refactoring richiede piu cautela.
- Codice legacy con side effects nascosti e piu difficile da cambiare.
- Alcune modifiche strutturali richiedono migrazioni progressive.
- Refactoring senza obiettivo puo diventare lavoro estetico.

## Errori comuni

- Mescolare refactoring e feature nello stesso passaggio.
- Fare grandi riscritture senza rete di sicurezza.
- Cambiare API pubbliche senza compatibilita.
- Ignorare test di integrazione.
- Refactorare codice non compreso.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Code smells]]
- [[Debito tecnico]]
- [[Codice testabile]]
- [[Test unitari leggibili]]
- [[Legacy code]]

## Fonti

- Martin Fowler, *Refactoring*
- Michael Feathers, *Working Effectively with Legacy Code*
- Kent Beck, *Test Driven Development*
