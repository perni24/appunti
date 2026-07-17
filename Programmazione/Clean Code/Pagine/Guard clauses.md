---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, leggibilita, controllo-flusso]
aliases: [Guard clauses, Clausole di guardia]
prerequisites: [Leggibilita del codice, Funzioni piccole]
related: [Codice esplicito vs codice implicito, Funzioni con responsabilita singola, Complessita cognitiva]
---

# Guard clauses

## Sintesi

Le **guard clauses** sono controlli iniziali che interrompono subito una funzione quando le condizioni minime non sono rispettate.

Servono a ridurre annidamenti e a rendere visibili i casi speciali prima del flusso principale.

## Problema che risolve

Senza guard clauses, una funzione puo diventare una piramide di `if` annidati.

Questo aumenta:

- complessita cognitiva;
- distanza tra condizione e comportamento;
- difficolta di lettura;
- probabilita di saltare un caso limite;
- fatica nel capire il percorso principale.

## Concetto chiave

Una guard clause dice:

```text
se questa precondizione non vale, esci subito
```

Dopo le guard clauses, il corpo principale della funzione puo assumere che le condizioni essenziali siano vere.

## Dettagli importanti

- Le guard clauses sono utili per input nulli, permessi, stati non validi e casi vuoti.
- Devono essere poche e leggibili.
- Non devono nascondere logica di dominio importante.
- Possono restituire errori, valori vuoti o lanciare eccezioni, a seconda del contratto della funzione.
- Rendono piu chiaro il percorso felice della funzione.

## Esempio

Con annidamento:

```js
function sendInvoice(invoice) {
  if (invoice) {
    if (invoice.customerEmail) {
      if (invoice.total > 0) {
        return sendEmail(invoice.customerEmail, invoice);
      }
    }
  }

  return false;
}
```

Con guard clauses:

```js
function sendInvoice(invoice) {
  if (!invoice) return false;
  if (!invoice.customerEmail) return false;
  if (invoice.total <= 0) return false;

  return sendEmail(invoice.customerEmail, invoice);
}
```

Il flusso principale e piu visibile.

## Limiti

- Troppe uscite anticipate possono rendere difficile tracciare il risultato.
- In funzioni con cleanup manuale bisogna gestire bene il rilascio risorse.
- Non sostituiscono validazione strutturata ai confini del sistema.
- Non devono diventare una lista confusa di regole non nominate.

## Errori comuni

- Usare guard clauses con condizioni troppo complesse.
- Restituire valori diversi senza un contratto chiaro.
- Mescolare guard clauses e side effects.
- Nascondere regole di business dentro condizioni inline lunghe.
- Usare guard clauses per evitare di modellare stati validi.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Funzioni piccole]]
- [[Funzioni con responsabilita singola]]
- [[Codice esplicito vs codice implicito]]
- [[Principio del minimo stupore]]

## Fonti

- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
