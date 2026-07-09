---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, manutenibilita, debito-tecnico]
aliases: [Manutenibilita del codice, Codice manutenibile]
prerequisites: [Clean Code]
related: [Debito tecnico, Semplicita e complessita accidentale]
---

# Manutenibilita del codice

## Sintesi

La **manutenibilita del codice** misura quanto e facile correggere, estendere, testare e adattare un sistema nel tempo.

Un codice manutenibile non e solo leggibile: e anche organizzato in modo che le modifiche abbiano un impatto prevedibile.

## Problema che risolve

Molti progetti diventano lenti non per mancanza di funzionalita, ma perche ogni modifica rompe qualcosa o richiede di toccare troppe parti.

La manutenibilita riduce questo costo di cambiamento.

## Concetto chiave

Un codice manutenibile ha:

- responsabilita separate;
- dipendenze limitate;
- interfacce stabili;
- test significativi;
- comportamento osservabile;
- convenzioni coerenti;
- poca complessita accidentale.

Il segnale piu chiaro di bassa manutenibilita e la paura di modificare il codice.

## Dettagli importanti

- La manutenibilita riguarda il futuro, non solo lo stato attuale.
- Un modulo molto usato deve essere piu stabile e chiaro di codice temporaneo.
- La documentazione aiuta, ma non compensa una struttura confusa.
- Test fragili riducono manutenibilita anche se aumentano coverage.
- Le dipendenze implicite sono una delle cause principali di regressioni.

## Esempio

Codice poco manutenibile:

```text
Modifica al calcolo prezzo -> tocca controller, database, email, report e UI.
```

Codice piu manutenibile:

```text
Modifica al calcolo prezzo -> tocca modulo Pricing e relativi test.
```

La seconda situazione non elimina la complessita del dominio, ma la localizza.

## Limiti

- Non tutto il codice richiede lo stesso livello di cura.
- Codice sperimentale puo essere meno strutturato, se il costo viene riconosciuto.
- Troppa astrazione puo peggiorare la manutenibilita.
- La manutenibilita deve essere valutata rispetto al ciclo di vita del progetto.

## Errori comuni

- Confondere codice funzionante con codice mantenibile.
- Rimandare refactoring fino a quando diventa troppo costoso.
- Aggiungere casi speciali senza rivedere il modello.
- Non scrivere test per il comportamento critico.
- Ignorare i segnali di debito tecnico ricorrente.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Debito tecnico]]
- [[Semplicita e complessita accidentale]]
- [[Funzioni con responsabilita singola]]

## Fonti

- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
