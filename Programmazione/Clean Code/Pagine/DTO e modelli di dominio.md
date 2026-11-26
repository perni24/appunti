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
  - dto
  - dominio
aliases:
  - DTO e modelli di dominio
  - DTO vs domain models
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Validazione input API]]"
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
title: DTO e modelli di dominio
---

# DTO e modelli di dominio

## Sintesi

Un **DTO** descrive i dati che attraversano un confine. Un **modello di dominio** rappresenta uno stato valido e le transizioni consentite. I due possono anche essere semplici oggetti: la distinzione non dipende dall'uso di classi, ma da **chi ha il diritto di decidere ogni valore**.

## Tre forme per la stessa fattura

| Forma | Campi nell'esempio | Chi li decide |
| --- | --- | --- |
| Comando in ingresso | `invoiceId` | Il client sceglie quale fattura; il parser verifica il formato |
| Modello interno | `id`, `state`, `issuedAtMs`, `internalNote` | Archivio, regola di emissione e orologio applicativo |
| Risposta pubblica | `id`, `status`, `issuedAtMs` | Il contratto HTTP; non espone la nota interna |

## Esempio: la transizione non è il mapper

```js
function issueDraft(invoice, nowMs) {
  if (invoice.state !== "draft") return null;
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
    throw new RangeError("Atteso un istante in millisecondi dall'epoch");
  }
  return { ...invoice, state: "issued", issuedAtMs: nowMs };
}

function publicInvoice(invoice) {
  return { id: invoice.id, status: invoice.state, issuedAtMs: invoice.issuedAtMs };
}
```

`issueDraft` riceve un modello già valido: nell'esempio gli stati ammessi sono `draft` e `issued`. Restituisce una nuova fattura oppure `null` se non può emetterla; non tocca la bozza caricata. Un orologio invalido è un errore tecnico, non un errore dell'utente. Il tempo zero è invece un istante valido. Persistenza e invio della notifica non fanno parte della transizione.

`publicInvoice` **seleziona** i campi anziché restituire l'intero oggetto: aggiungere domani una colonna interna non cambia il JSON. L'input del client non viene copiato nel modello con uno spread: non può impostare `status` o l'orario di emissione. Lo decide il caso d'uso, non un campo del DTO.

## Verifica e limiti

Controlla separatamente la transizione e l'elenco esatto delle chiavi pubbliche. Qui i campi sono primitivi; la copia superficiale non isolerebbe strutture annidate mutabili. Per un CRUD senza regole può bastare una proiezione esplicita: introdurre tre classi con gli stessi campi non crea un dominio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Validazione input API|Validazione input API]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]

## Fonti

- Martin Fowler, *Data Transfer Object*
- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Architecture*
- [Martin Fowler: Data Transfer Object](https://martinfowler.com/eaaCatalog/dataTransferObject.html)
