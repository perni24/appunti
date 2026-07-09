---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, modellazione, oggetti]
aliases: [Data objects e behavior objects, Data objects, Behavior objects]
prerequisites: [Clean Code]
related: [Oggetti con responsabilita chiara, Incapsulamento, Value objects]
---

# Data objects e behavior objects

## Sintesi

I **data objects** sono oggetti che contengono soprattutto dati. I **behavior objects** contengono comportamento, regole e operazioni.

La distinzione e utile per capire se il codice sta solo trasportando informazioni o se sta modellando responsabilita reali.

## Problema che risolve

Un errore comune e avere oggetti pieni di dati e logica sparsa altrove. In questo caso il codice diventa procedurale travestito da object-oriented: i dati viaggiano, ma le regole sono duplicate in servizi, controller o helper.

All'opposto, inserire comportamento dentro ogni struttura dati puo creare oggetti gonfi e poco chiari.

## Concetto chiave

La domanda da fare e:

```text
Questo oggetto rappresenta solo dati o protegge una regola?
```

Se l'oggetto deve proteggere invarianti, applicare regole o impedire stati non validi, probabilmente deve avere comportamento.

Se deve attraversare un confine, serializzarsi o rappresentare input/output, puo essere un data object.

## Dettagli importanti

- I DTO sono spesso data objects.
- Le entity e i value objects spesso contengono comportamento.
- Un data object non e automaticamente sbagliato.
- Il problema nasce quando regole importanti sono sparse fuori dai dati.
- Il comportamento deve stare vicino ai dati che protegge.

## Esempio

Data object:

```ts
type UserDto = {
  id: string;
  email: string;
  active: boolean;
};
```

Behavior object:

```ts
class User {
  constructor(private active: boolean) {}

  canLogin(): boolean {
    return this.active;
  }
}
```

Il DTO trasporta dati. L'oggetto `User` espone una regola.

## Limiti

- In applicazioni CRUD semplici, data objects possono essere sufficienti.
- In domini complessi, behavior objects aiutano a evitare duplicazione.
- Non tutto il comportamento deve stare dentro l'oggetto dati.
- Alcune architetture preferiscono servizi di dominio separati.

## Errori comuni

- Mettere tutta la logica nei service e lasciare oggetti anemici.
- Inserire logica infrastrutturale dentro oggetti di dominio.
- Confondere DTO e modello di dominio.
- Rendere behavior objects dipendenti da database o framework.
- Usare classi solo come contenitori senza motivo.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Oggetti con responsabilita chiara]]
- [[Value objects]]
- [[Invarianti del dominio]]

## Fonti

- Martin Fowler, *Anemic Domain Model*
- Eric Evans, *Domain-Driven Design*
