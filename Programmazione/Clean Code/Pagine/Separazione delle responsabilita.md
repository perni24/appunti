---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, design, responsabilita]
aliases: [Separazione delle responsabilita, Separation of concerns]
prerequisites: [Clean Code]
related: [Funzioni con responsabilita singola, Coesione e accoppiamento, SOLID]
---

# Separazione delle responsabilita

## Sintesi

La **separazione delle responsabilita** consiste nel dividere il codice in parti con scopi distinti, evitando che un singolo componente gestisca troppi aspetti del sistema.

E uno dei principi piu pratici per ridurre complessita e rendere le modifiche piu localizzate.

## Problema che risolve

Quando validazione, business logic, persistenza, UI, logging e integrazioni esterne sono mescolate, ogni modifica diventa rischiosa.

Il codice funziona, ma e difficile capire quale parte sia responsabile di cosa.

## Concetto chiave

Una responsabilita e un motivo per cambiare.

Separare responsabilita significa chiedersi:

- cosa cambia insieme?
- cosa cambia per ragioni diverse?
- quale parte conosce il dominio?
- quale parte conosce il framework?
- quale parte conosce l'infrastruttura?

Le risposte guidano confini, moduli e classi.

## Dettagli importanti

- La separazione puo avvenire tra funzioni, classi, moduli o layer.
- Separare responsabilita non significa creare piu astrazioni del necessario.
- Le responsabilita devono essere riconoscibili dai nomi.
- I confini migliori seguono il dominio o il comportamento.
- Una responsabilita tecnica non deve inglobare logica di dominio senza motivo.

## Esempio

Mescolato:

```text
Controller:
- legge request
- valida regole di dominio
- scrive database
- invia email
- costruisce HTML
```

Separato:

```text
Controller -> Use case -> Repository
                    -> Email sender
```

Il controller coordina l'input, ma non contiene tutta la logica.

## Limiti

- Separare troppo presto puo creare indirezione inutile.
- In script piccoli puo bastare una struttura piu semplice.
- Alcune responsabilita sono naturalmente vicine.
- La separazione va rivista quando emergono nuovi casi d'uso.

## Errori comuni

- Separare per tipo tecnico invece che per motivo di cambiamento.
- Creare layer vuoti senza comportamento.
- Mettere tutta la logica nei service.
- Lasciare controller o componenti UI troppo intelligenti.
- Usare "responsabilita singola" come regola meccanica.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Funzioni con responsabilita singola]]
- [[Coesione e accoppiamento]]
- [[SOLID]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Oggetti con responsabilita chiara]]

## Fonti

- Edsger Dijkstra, *On the role of scientific thought*
- Robert C. Martin, *Clean Architecture*
