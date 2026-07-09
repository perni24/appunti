---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, tipi, modellazione]
aliases: [Tipi significativi, Meaningful types]
prerequisites: [Primitive obsession, Value objects]
related: [Modellazione del dominio, Invarianti del dominio, Contratti impliciti ed espliciti]
---

# Tipi significativi

## Sintesi

I **tipi significativi** rappresentano concetti del dominio invece di usare solo primitive generiche come stringhe, numeri e booleani.

Servono a comunicare intenzione, ridurre errori e rendere piu forti i contratti del codice.

## Problema che risolve

Primitive generiche possono rappresentare troppe cose diverse.

Una `string` puo essere email, slug, password, currency code, stato, ruolo o percorso file. Un `number` puo essere prezzo, quantita, percentuale, durata o id.

Senza tipi significativi, il codice perde informazioni importanti.

## Concetto chiave

Un tipo significativo incorpora nome, vincoli e intenzione.

Anche nei linguaggi dinamici, si puo ottenere un effetto simile con value objects, factory, validazione, naming e strutture dati esplicite.

## Esempio

Contratto debole:

```js
function applyDiscount(total, discount) {
  return total - discount;
}
```

Contratto piu chiaro:

```js
function applyDiscount(orderTotal, discountAmount) {
  if (discountAmount.value > orderTotal.value) {
    throw new Error("Discount cannot exceed order total");
  }

  return Money.of(orderTotal.value - discountAmount.value, orderTotal.currency);
}
```

Il codice distingue importo, valuta e regola.

## Dettagli importanti

- Un buon tipo impedisce o rende difficile rappresentare valori invalidi.
- I booleani spesso nascondono stati che meritano un tipo o enum.
- Un id specifico e piu chiaro di un generico `id`.
- I tipi significativi aiutano autocomplete, refactoring e test.
- Nei sistemi distribuiti i tipi devono essere tradotti nei DTO ai confini.

## Limiti

- Troppi tipi piccoli possono appesantire codice semplice.
- Non tutte le regole possono stare nel tipo.
- Nei linguaggi poco tipizzati serve disciplina di progetto.
- I tipi devono restare comprensibili, non diventare gerarchie inutili.

## Errori comuni

- Usare `string` per tutto.
- Passare parametri dello stesso tipo in ordine fragile.
- Usare booleani come flag oscuri.
- Creare tipi senza invarianti reali.
- Confondere tipi di trasporto e tipi di dominio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Primitive obsession]]
- [[Value objects]]
- [[Invarianti del dominio]]
- [[Modellazione del dominio]]
- [[Contratti impliciti ed espliciti]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Scott Wlaschin, *Domain Modeling Made Functional*
- Martin Fowler, *Refactoring*
