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
  - contratti
  - api-design
aliases:
  - Contratti impliciti ed espliciti
  - Contratti nel codice
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Contratti impliciti ed espliciti
---

# Contratti impliciti ed espliciti

## Sintesi

Un contratto stabilisce **che cosa deve fornire il chiamante e che cosa può osservare dopo la chiamata**: risultato, assenza di un risultato, errori, mutazioni ed effetti. Un parametro chiamato `data` dice poco; anche una firma con nomi precisi può lasciare implicito se l'assenza di un record sia normale o eccezionale.

## Esempio: cercare una fattura

In questa applicazione l'identificatore è una stringa non vuota. Si ignorano gli spazi esterni, non gli zeri iniziali. Il repository espone `findById`, che risolve con un record oppure con `null`, e rifiuta la promessa se la lettura fallisce.

```js
async function findInvoice(rawId, repository) {
  if (typeof rawId !== "string" || !rawId.trim()) {
    throw new TypeError("Identificatore fattura richiesto");
  }
  return repository.findById(rawId.trim());
}
```

| Chiamata | Promessa pubblica |
| --- | --- |
| ID vuoto o non testuale | Promise rifiutata; il repository non viene chiamato. |
| `" 007 "` | Si effettua una lettura con `"007"`. Un record assente è `null`. |
| Lettura fallita | Il chiamante riceve il rifiuto, non `null`: non si sa se il record esista. |

## Come verificarlo

Una prova controlla che l'ID invalido non generi I/O; un'altra distingue assenza e indisponibilità. La tabella descrive ciò che il client usa, non quale query scrivere. Il wrapper **si fida del contratto interno** del repository: se un adattatore restituisce `undefined` anziché `null`, è l'adattatore da correggere o tradurre, non ogni chiamante.

## Limiti

Un tipo esprime parte del contratto, ma non dice da solo se un errore va ritentato, se un valore è in centesimi o se una scrittura è idempotente. Rendi esplicite le distinzioni che cambiano il comportamento del cliente; non duplicare la documentazione per ogni dettaglio interno.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]

## Fonti

- Eiffel, [Design by Contract and Assertions](https://www.eiffel.org/doc/solutions/Design_by_Contract_and_Assertions)
- Bertrand Meyer, *Object-Oriented Software Construction*; Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*
