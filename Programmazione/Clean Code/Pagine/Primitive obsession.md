---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, code-smell, modellazione]
aliases: [Primitive obsession, Ossessione per le primitive]
prerequisites: [Clean Code]
related: [Value objects, Tipi significativi, Invarianti del dominio]
---

# Primitive obsession

## Sintesi

La **primitive obsession** e un code smell in cui concetti importanti del dominio vengono rappresentati con primitive generiche: `string`, `number`, `boolean`, array o mappe anonime.

Il problema non e usare primitive, ma usarle dove servirebbe un concetto nominato.

## Problema che risolve

Quando tutto e una stringa o un numero, il compilatore e il lettore non possono distinguere valori con significati diversi.

Esempi:

- `string` per email, username, token, codice ordine;
- `number` per euro, percentuali, secondi, quantita;
- `boolean` per stati complessi;
- `Record<string, unknown>` per oggetti con struttura stabile.

Questo porta a validazioni duplicate e parametri scambiati per errore.

## Concetto chiave

Una primitiva dovrebbe diventare un tipo dedicato quando:

- ha regole di validazione;
- ha un significato di dominio;
- viene passata in molte funzioni;
- puo essere confusa con valori simili;
- contiene comportamento naturale;
- causa controlli ripetuti.

Il refactoring tipico e introdurre un value object o un tipo semantico.

## Dettagli importanti

- Non ogni primitiva e un problema.
- Le primitive vanno bene in codice locale e ovvio.
- Il problema cresce quando il valore attraversa molti confini.
- I booleani sono spesso segnali di stati modellati male.
- I tipi dedicati migliorano leggibilita e testabilita.

## Esempio

Prima:

```ts
function transfer(amount: number, currency: string) {
  // ...
}
```

Dopo:

```ts
type Money = {
  amount: number;
  currency: "EUR" | "USD";
};

function transfer(money: Money) {
  // ...
}
```

Il secondo codice riduce ambiguita tra importo e valuta.

## Limiti

- Introdurre tipi per tutto puo rendere il codice pesante.
- In prototipi o script brevi, le primitive possono essere sufficienti.
- Alcuni linguaggi rendono piu costosa la modellazione fine.
- Serve bilanciare chiarezza e semplicita.

## Errori comuni

- Lasciare stringhe libere per valori con formato obbligatorio.
- Usare booleani multipli per rappresentare uno stato.
- Duplicare validazioni invece di centralizzarle.
- Usare mappe generiche al posto di strutture esplicite.
- Creare wrapper senza regole o comportamento.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Value objects]]
- [[Invarianti del dominio]]
- [[Modellare stati impossibili]]
- [[Codice esplicito vs codice implicito]]

## Fonti

- Martin Fowler, *Refactoring*
- Eric Evans, *Domain-Driven Design*
