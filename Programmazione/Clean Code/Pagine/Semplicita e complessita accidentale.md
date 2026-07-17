---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, semplicita, complessita]
aliases: [Semplicita e complessita accidentale, Complessita accidentale]
prerequisites: [Clean Code]
related: [Manutenibilita del codice, Codice esplicito vs codice implicito]
---

# Semplicita e complessita accidentale

## Sintesi

La **semplicita** nel codice significa rappresentare un problema con il minor numero di concetti necessari. La **complessita accidentale** e la complessita introdotta dalla soluzione, non dal problema reale.

Il Clean Code cerca di ridurre la complessita accidentale senza banalizzare il dominio.

## Problema che risolve

Un sistema puo diventare difficile da modificare non perche il dominio e complesso, ma perche il codice aggiunge strutture, condizioni, astrazioni e dipendenze non necessarie.

Questa complessita extra rende ogni cambiamento piu rischioso.

## Concetto chiave

Esistono due tipi di complessita:

- **complessita essenziale**: deriva dal problema reale;
- **complessita accidentale**: deriva da scelte implementative evitabili.

Il compito di chi scrive codice e non confondere le due.

## Dettagli importanti

- Una soluzione semplice non e necessariamente corta.
- Una soluzione generica non e automaticamente migliore.
- Ogni layer, pattern o astrazione deve giustificare il proprio costo.
- La duplicazione leggera puo essere preferibile a un'astrazione prematura.
- La semplicita si misura in facilita di ragionamento.

## Esempio

Soluzione troppo generica:

```text
StrategyFactoryBuilderResolver
```

Soluzione piu semplice:

```text
calculateDiscount(order)
```

Se esiste una sola strategia reale, l'infrastruttura generica e complessita accidentale.

## Limiti

- Alcuni domini sono davvero complessi e non possono essere resi banali.
- Rimuovere astrazioni utili puo rendere il codice duplicato e incoerente.
- La semplicita iniziale puo non bastare quando il sistema cresce.
- Serve rivalutare la soluzione quando emergono nuovi casi reali.

## Errori comuni

- Aggiungere pattern per anticipare esigenze non confermate.
- Confondere codice corto con codice semplice.
- Nascondere complessita dietro nomi generici.
- Rendere tutto configurabile senza motivo.
- Evitare una modellazione esplicita per paura di scrivere piu codice.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Manutenibilita del codice]]
- [[Codice esplicito vs codice implicito]]
- [[Debito tecnico]]

## Fonti

- Fred Brooks, *No Silver Bullet*
- Martin Fowler, *Refactoring*
