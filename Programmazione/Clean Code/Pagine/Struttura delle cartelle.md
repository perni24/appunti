---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, cartelle, architettura]
aliases: [Struttura delle cartelle, Folder structure]
prerequisites: [Organizzazione dei file]
related: [Moduli piccoli, Confini tra moduli, Convenzioni di progetto]
---

# Struttura delle cartelle

## Sintesi

La **struttura delle cartelle** e il modo in cui un progetto organizza fisicamente codice, test, documentazione e configurazioni.

Una buona struttura rende visibili responsabilita e confini senza richiedere spiegazioni continue.

## Problema che risolve

Una struttura confusa rende difficile capire dove aggiungere codice nuovo. Quando non c'e un posto chiaro, il codice finisce in cartelle generiche come `utils`, `misc`, `shared` o `common`.

Nel tempo queste cartelle diventano punti di accoppiamento.

## Concetto chiave

La struttura dovrebbe riflettere una scelta:

- organizzazione per feature;
- organizzazione per layer;
- organizzazione per dominio;
- organizzazione imposta dal framework;
- organizzazione ibrida.

La scelta deve essere coerente e adatta al progetto.

## Dettagli importanti

- Per feature: utile quando il dominio ha aree chiare.
- Per layer: utile in sistemi semplici o framework convenzionali.
- Per dominio: utile quando le regole di business sono centrali.
- Nei framework, conviene rispettare convenzioni note se aiutano il team.
- Le cartelle condivise devono avere regole strette.

## Esempio

Struttura per layer:

```text
src/
  controllers/
  services/
  repositories/
  models/
```

Struttura per feature:

```text
src/
  orders/
    order-controller.ts
    order-service.ts
    order-repository.ts
  users/
    user-controller.ts
    user-service.ts
    user-repository.ts
```

La seconda rende piu visibili i confini di dominio.

## Limiti

- La struttura perfetta non esiste.
- Una struttura per feature puo duplicare pattern tra cartelle.
- Una struttura per layer puo disperdere il dominio.
- Migrare struttura in un progetto grande va fatto gradualmente.

## Errori comuni

- Copiare una struttura senza capirne il motivo.
- Cambiare struttura prima che emerga il bisogno.
- Mescolare feature e layer senza regole.
- Lasciare cartelle condivise crescere senza controllo.
- Usare la struttura come sostituto di confini architetturali reali.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Organizzazione dei file]]
- [[Moduli piccoli]]
- [[Confini tra moduli]]
- [[Convenzioni di progetto]]

## Fonti

- Robert C. Martin, *Clean Architecture*
- Eric Evans, *Domain-Driven Design*
