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
  - oop
  - incapsulamento
aliases:
  - Incapsulamento
  - Encapsulation
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
title: Incapsulamento
---

# Incapsulamento

## Sintesi

Un ordine è incapsulato quando **non puoi dichiararlo pagato senza rispettare la regola di pagamento**. Rendere privato il campo `status` e poi esporre `setStatus("paid")` cambierebbe la sintassi, ma lascerebbe la stessa decisione a tutti i chiamanti.

## Esempio: registrare una conferma, non addebitare denaro

Per questo negozio un ordine nasce in bozza, con un totale non negativo in centesimi. Per registrare un pagamento servono un totale positivo e un riferimento non vuoto. Si può registrare una sola conferma. L'operazione **non** verifica il provider: chi la chiama ha già verificato la conferma.

```ts
class Order {
  #totalCents: number;
  #paymentRef: string | null = null;

  constructor(totalCents: number) {
    if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
      throw new RangeError("Totale non valido");
    }
    this.#totalCents = totalCents;
  }

  markAsPaid(reference: string): void {
    if (this.#paymentRef !== null) throw new Error("Ordine già pagato");
    if (this.#totalCents === 0) throw new Error("Ordine gratuito");
    const ref = reference.trim();
    if (!ref) throw new Error("Conferma priva di riferimento");
    this.#paymentRef = ref;
  }

  get status(): "draft" | "paid" {
    return this.#paymentRef === null ? "draft" : "paid";
  }
}
```

Lo stato viene **derivato** dal riferimento: non ci sono due campi da tenere sincronizzati. Con un ordine da 500 centesimi, un riferimento vuoto viene rifiutato e lascia lo stato in bozza; dopo una conferma valida lo stato è `paid` e una seconda conferma viene rifiutata. Per testarlo bastano le operazioni pubbliche, senza ispezionare i campi privati.

## Dove passa il confine

- Un getter di sola lettura per uno stato osservabile è utile. Se invece restituisse la stessa lista mutabile usata dall'oggetto, il chiamante potrebbe cambiarla senza passare per le regole. Restituisci una proiezione o una copia adeguata ai dati che contiene.
- L'incapsulamento può stare in una classe, in una closure o in un modulo. Un DTO destinato soltanto al trasporto non deve per forza avere metodi.
- L'esempio protegge **un'istanza in memoria**. Non garantisce autenticità del pagamento, deduplicazione di eventi esterni o coordinamento fra due processi che caricano lo stesso ordine.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, [Encapsulate Collection](https://refactoring.com/catalog/encapsulateCollection.html), sul caso in cui un accessore espone una collezione modificabile.
