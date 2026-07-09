---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, oop, incapsulamento]
aliases: [Incapsulamento, Encapsulation]
prerequisites: [Oggetti con responsabilita chiara]
related: [Coesione e accoppiamento, Separazione delle responsabilita, Invarianti del dominio]
---

# Incapsulamento

## Sintesi

L'**incapsulamento** consiste nel nascondere i dettagli interni di un oggetto o modulo ed esporre solo operazioni coerenti con la sua responsabilita.

Non significa solo usare `private`: significa proteggere invarianti e impedire che il resto del sistema dipenda da dettagli interni.

## Problema che risolve

Quando lo stato interno e liberamente modificabile, ogni parte del codice puo rompere regole che dovrebbero essere locali.

Il risultato e un sistema fragile: per capire una modifica devi cercare tutti i punti in cui un campo viene letto o scritto.

## Concetto chiave

Un buon incapsulamento:

- espone comportamento, non solo dati;
- protegge lo stato interno;
- rende valide le transizioni;
- riduce dipendenze da dettagli implementativi;
- rende piu semplice cambiare l'interno senza cambiare l'esterno.

La domanda utile e: "chi puo modificare questo stato e con quali regole?"

## Dettagli importanti

- Getter e setter automatici non garantiscono incapsulamento.
- Un metodo pubblico dovrebbe rappresentare una operazione significativa.
- Gli invarianti dovrebbero essere protetti dentro il confine dell'oggetto.
- I dettagli interni possono cambiare se l'interfaccia resta stabile.
- L'incapsulamento vale anche per moduli e servizi, non solo classi.

## Esempio

Stato esposto:

```ts
class Order {
  status = "draft";
}

order.status = "paid";
```

Stato protetto:

```ts
class Order {
  private status = "draft";

  markAsPaid() {
    if (this.status !== "draft") {
      throw new Error("Ordine non pagabile");
    }

    this.status = "paid";
  }
}
```

Nel secondo caso la modifica passa da una regola esplicita.

## Limiti

- Nascondere troppo puo rendere l'oggetto difficile da usare.
- Alcuni data objects devono essere semplici contenitori.
- L'incapsulamento non deve impedire test sensati.
- Nei linguaggi dinamici serve piu disciplina convenzionale.

## Errori comuni

- Esporre campi mutabili senza controllo.
- Creare setter per ogni proprieta.
- Mettere logica fuori dall'oggetto e lasciare dati anemici.
- Confondere incapsulamento con complessita artificiale.
- Nascondere dipendenze invece di nascondere dettagli interni.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Oggetti con responsabilita chiara]]
- [[Invarianti del dominio]]
- [[Coesione e accoppiamento]]
- [[Separazione delle responsabilita]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
