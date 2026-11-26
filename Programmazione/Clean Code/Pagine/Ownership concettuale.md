---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - ownership
  - responsabilita
aliases:
  - Ownership concettuale
  - Conceptual ownership
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione dello stato]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione delle risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
title: Ownership concettuale
---

# Ownership concettuale

## Sintesi

**Possedere una decisione non significa possedere ogni dato che la riguarda.** Il servizio pagamenti può attestare che un pagamento è riuscito; il modello dell'ordine decide se quella conferma è compatibile con il suo stato. Il repository persiste l'esito, ma non è un secondo posto in cui riscrivere la regola.

## Esempio: a chi spetta segnare l'ordine come pagato?

Il contratto di questo ordine prevede un solo pagamento. Alla prima conferma registra l'identificativo; se arriva di nuovo la stessa conferma, non cambia nulla. Una conferma per un pagamento diverso è un conflitto, non un aggiornamento silenzioso.

```js
class OrderPayment {
  #paymentId = null;

  confirm(paymentId) {
    if (typeof paymentId !== "string" || paymentId.trim() === "") {
      throw new TypeError("Identificativo pagamento mancante");
    }
    if (this.#paymentId === paymentId) return "already_recorded";
    if (this.#paymentId !== null) throw new Error("Pagamento in conflitto");
    this.#paymentId = paymentId;
    return "recorded";
  }

  snapshot() {
    return { status: this.#paymentId === null ? "pending" : "paid", paymentId: this.#paymentId };
  }
}
```

`snapshot()` offre alla fatturazione una copia composta solo di valori primitivi. Cambiare `snapshot().status` non modifica l'ordine. Gli identificativi non vuoti sono opachi: il confronto non rimuove spazi né cambia maiuscole. La conferma presuppone un evento già verificato; non effettua addebiti né autentica il mittente.

## Lettura, prestito e trasferimento

- **Lettura:** un altro servizio può mostrare la proiezione, non modificare l'ordine attraverso di essa.
- **Prestito:** un metodo può usare una connessione del chiamante senza acquisire il diritto di chiuderla.
- **Trasferimento:** se una funzione restituisce un file aperto delegandone la chiusura, il contratto deve dire quando passa questa responsabilità, anche in caso di errore.

## Limiti

Il campo privato protegge **una singola istanza**, non due processi che hanno caricato lo stesso ordine. Se le conferme arrivano in parallelo, la persistenza deve rilevare i conflitti, per esempio con un aggiornamento condizionale sulla versione. L'idempotenza della transizione locale non garantisce che una fattura o un addebito esterno vengano emessi una sola volta.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Gestione dello stato|Gestione dello stato]]
- [[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti|Lifecycle degli oggetti]]
- [[Programmazione/Clean Code/Pagine/Invarianti interne|Invarianti interne]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Architecture*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
- [Martin Fowler: aggregati e confine di consistenza](https://martinfowler.com/bliki/DDD_Aggregate.html)
