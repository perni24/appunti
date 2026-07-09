---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, modellazione, value-object]
aliases: [Value objects, Value object]
prerequisites: [Clean Code]
related: [Primitive obsession, Invarianti del dominio, Modellare stati impossibili]
---

# Value objects

## Sintesi

Un **value object** e un oggetto identificato dal suo valore, non da una identita propria. Due value objects con gli stessi valori rappresentano lo stesso concetto.

Nel Clean Code i value objects aiutano a rendere espliciti concetti di dominio che altrimenti sarebbero rappresentati con primitive generiche come stringhe, numeri o booleani.

## Problema che risolve

Molti bug nascono quando un valore tecnicamente corretto non e semanticamente valido. Una stringa puo rappresentare un'email, un codice fiscale, una valuta o un token. Un numero puo essere prezzo, percentuale, quantita o durata.

Senza un tipo dedicato, il significato resta implicito e le regole vengono duplicate.

## Concetto chiave

Un value object:

- rappresenta un concetto del dominio;
- valida le proprie invarianti;
- e spesso immutabile;
- non ha identita autonoma;
- puo contenere comportamento collegato al valore;
- rende illegali alcuni stati non validi.

La sua utilita principale e trasformare una regola sparsa in un concetto nominato.

## Dettagli importanti

- Un value object dovrebbe essere piccolo e coerente.
- La validazione va concentrata nel punto di creazione.
- Se il valore cambia, spesso si crea un nuovo value object.
- Il confronto avviene sui valori interni.
- Un buon value object riduce controlli ripetuti nel resto del codice.

## Esempio

Primitive generica:

```ts
function sendEmail(email: string) {
  // Il codice deve fidarsi che la stringa sia valida.
}
```

Value object:

```ts
class EmailAddress {
  private constructor(readonly value: string) {}

  static create(value: string): EmailAddress {
    if (!value.includes("@")) {
      throw new Error("Email non valida");
    }

    return new EmailAddress(value);
  }
}
```

Il resto del codice non riceve una stringa qualsiasi, ma un valore gia validato.

## Limiti

- Non ogni valore merita un tipo dedicato.
- Troppi value objects possono appesantire codice semplice.
- In alcuni linguaggi il costo sintattico puo essere alto.
- Serve evitare value objects senza comportamento o regole reali.

## Errori comuni

- Creare value objects per ogni campo senza motivo.
- Lasciare validazione duplicata fuori dal value object.
- Rendere mutabile un valore che dovrebbe essere stabile.
- Inserire logica di persistenza nel value object.
- Confondere value object e entity con identita.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Primitive obsession]]
- [[Invarianti del dominio]]
- [[Modellare stati impossibili]]
- [[Stato mutabile e immutabile]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Value Object*
