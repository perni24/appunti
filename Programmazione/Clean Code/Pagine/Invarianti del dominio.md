---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, dominio, invarianti]
aliases: [Invarianti del dominio, Domain invariants]
prerequisites: [Clean Code]
related: [Value objects, Modellare stati impossibili, Oggetti con responsabilita chiara]
---

# Invarianti del dominio

## Sintesi

Le **invarianti del dominio** sono regole che devono restare sempre vere perche un oggetto o un processo sia valido.

Nel Clean Code, rendere esplicite le invarianti riduce bug e chiarisce quali stati il sistema deve impedire.

## Problema che risolve

Se una regola importante e controllata solo in alcuni punti, prima o poi verra dimenticata.

Esempi:

- un ordine pagato non puo tornare a `draft`;
- un prezzo non puo essere negativo;
- un intervallo deve avere `start` prima di `end`;
- un utente bannato non puo fare login;
- una percentuale deve stare tra 0 e 100.

## Concetto chiave

Una invariante va protetta nel punto piu vicino al dato o all'oggetto che la possiede.

Questo significa:

- validare alla creazione;
- impedire modifiche non valide;
- nascondere stato interno quando serve;
- usare metodi che rappresentano transizioni valide;
- evitare setter generici se rompono regole.

## Dettagli importanti

- Le invarianti non sono solo validazioni di input.
- Una invariante puo riguardare piu campi insieme.
- Le regole vanno testate come comportamento di dominio.
- Se una invariante e sparsa, e facile creare stati incoerenti.
- I value objects sono utili per invarianti locali.

## Esempio

Intervallo non protetto:

```ts
type DateRange = {
  start: Date;
  end: Date;
};
```

Intervallo con invariante:

```ts
class DateRange {
  constructor(readonly start: Date, readonly end: Date) {
    if (start > end) {
      throw new Error("start deve precedere end");
    }
  }
}
```

La regola viene applicata appena il valore nasce.

## Limiti

- Alcune invarianti dipendono dal database o da sistemi esterni.
- Non tutte le regole possono stare in un singolo oggetto.
- Validare troppo presto puo impedire flussi legittimi di bozza.
- Serve distinguere stati incompleti da stati invalidi.

## Errori comuni

- Mettere invarianti solo nel controller.
- Usare setter pubblici che permettono stati non validi.
- Duplicare la stessa regola in molti service.
- Non testare le transizioni vietate.
- Confondere validazione di formato e regola di dominio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Value objects]]
- [[Modellare stati impossibili]]
- [[Oggetti con responsabilita chiara]]
- [[Manutenibilita del codice]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Refactoring*
