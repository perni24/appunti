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
  - pipeline
  - trasformazioni
aliases:
  - Pipeline di trasformazione
  - Transformation pipeline
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Composizione di funzioni]]"
  - "[[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Pipeline di trasformazione
---

# Pipeline di trasformazione

## Sintesi

Una pipeline rende visibile il percorso di un dato da una forma alla successiva. Il vantaggio non è avere molte funzioni, ma sapere **che cosa è già stato controllato, dove ci si può fermare e quale passaggio modifica il mondo esterno**.

## Esempio: importare una riga cliente

L'ingresso è una riga proveniente da JSON. Il codice cliente è una sequenza non vuota di cifre ASCII: `"007"` è distinto da `"7"`. Il nome non può essere vuoto dopo la rimozione degli spazi esterni. Prima si controlla la forma necessaria a usare `trim`; poi si normalizza e si verifica la regola di dominio. I campi non previsti non vengono copiati.

```js
function parseCustomerRow(row) {
  if (row === null || typeof row !== "object" || Array.isArray(row)) {
    return { ok: false, field: "row" };
  }
  if (typeof row.code !== "string") return { ok: false, field: "code" };
  if (typeof row.name !== "string") return { ok: false, field: "name" };

  const code = row.code.trim();
  const displayName = row.name.trim();
  if (!/^[0-9]+$/.test(code)) return { ok: false, field: "code" };
  if (!displayName) return { ok: false, field: "name" };
  return { ok: true, customer: { code, displayName } };
}

async function importCustomer(row, save) {
  const parsed = parseCustomerRow(row);
  if (!parsed.ok) return parsed;
  const id = await save(parsed.customer);
  return { ok: true, id };
}
```

`parseCustomerRow` trasforma senza scrivere. `importCustomer` decide se chiamare l'archivio, che per contratto restituisce l'ID salvato. Con `{ code: " 007 ", name: " Ada " }` l'archivio riceve `{ code: "007", displayName: "Ada" }`. Convertire prima il codice in un numero perderebbe gli zeri iniziali: l'ordine delle fasi fa parte del contratto.

## Come leggere gli esiti

| Caso | Salvataggi richiesti | Esito del chiamante |
| --- | --- | --- |
| Riga malformata o campo non ammesso dalla sua regola | Nessuno | Promise risolta con `ok: false` e il campo del primo controllo fallito. |
| Riga valida e archivio disponibile | Uno | Promise risolta con `ok: true` e l'ID dell'archivio. |
| Riga valida, ma `save` fallisce | Uno tentato | Promise rifiutata con l'errore dell'archivio. Non è un errore di formato. |

## Limiti ed errori comuni

Questa pipeline gestisce **una riga**, non garantisce unicità del codice né atomicità di un import di più righe. Per un lotto occorre decidere se fermarsi al primo errore o accumulare gli scarti. Non nascondere la scrittura in un passaggio chiamato `normalize` e non trattare il risultato di un validatore booleano come se fosse il record validato.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Composizione di funzioni|Composizione di funzioni]]
- [[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative|Trasformazioni dichiarative]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]

## Fonti

- Martin Fowler, [Split Phase](https://refactoring.com/catalog/splitPhase.html)
- Martin Fowler, *Refactoring*; Robert C. Martin, *Clean Code*; Eric Elliott, *Composing Software*
