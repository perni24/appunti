---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - dominio
  - invarianti
aliases:
  - Invarianti del dominio
  - Domain invariants
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Modellare stati impossibili]]"
  - "[[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara]]"
title: Invarianti del dominio
---

# Invarianti del dominio

## Sintesi

Un'**invariante** è una proprietà che deve essere vera per ogni stato valido del modello, quando lo si osserva dalla sua interfaccia. Non coincide con una precondizione di un'operazione: «restano almeno zero crediti» è un'invariante; «per spenderne uno ne serve almeno uno» è una precondizione. Controllare l'input nel controller non basta se un altro percorso può poi rompere la regola.

## Esempio: una prenotazione con durata positiva

Il requisito è un intervallo **[inizio, fine)** tra due istanti validi: l'inizio è incluso, la fine esclusa e deve essere strettamente successiva. In JavaScript una `Date` può essere invalida o modificata dopo la creazione. Due proprietà `readonly` di tipo `Date` impedirebbero di riassegnarle in TypeScript, ma non di chiamare `setTime` sulle date che contengono.

```ts
class DateRange {
  #startMs: number;
  #endMs: number;

  constructor(start: Date, end: Date) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
      throw new RangeError("Occorrono due istanti validi con inizio prima della fine");
    }
    this.#startMs = startMs;
    this.#endMs = endMs;
  }

  contains(instant: Date): boolean {
    const ms = instant.getTime();
    return this.#startMs <= ms && ms < this.#endMs;
  }
}
```

`getTime()` restituisce `NaN` per una data invalida: il solo confronto degli estremi non la respinge. Il costruttore legge gli istanti una volta e conserva numeri privati, non riferimenti alle date del chiamante. Per [10, 20) millisecondi, 10 appartiene all'intervallo e 20 no; modificare le date originali non altera la risposta. Una data invalida passata a `contains` non appartiene all'intervallo.

## Come scegliere dove proteggere la regola

- **Creazione:** rifiuta estremi uguali, invertiti o invalidi. Se il prodotto ammette intervalli vuoti, cambia il requisito e i casi di prova, non solo l'operatore di confronto.
- **Modifica:** un futuro metodo di riprogrammazione deve verificare la nuova coppia prima di renderla osservabile. Due setter indipendenti permetterebbero aggiornamenti a metà.
- **Più oggetti:** due intervalli singolarmente validi possono sovrapporsi. Impedire una doppia prenotazione della stessa sala richiede un controllo coordinato anche fra scritture concorrenti; nessun `DateRange` isolato può garantirlo.

## Limiti

Un form con una sola data inserita è una **bozza**, non per forza una prenotazione errata: modellalo separatamente prima di costruire l'intervallo. L'esempio usa istanti assoluti; non decide come interpretare un orario locale ambiguo.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]

## Fonti

- Eric Evans, *Domain-Driven Design*; Martin Fowler, *Refactoring*
- ECMA-262, [Date.prototype.getTime](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date.prototype.gettime)
- TypeScript Handbook, [Object Types: readonly properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
