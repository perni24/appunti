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
  - side-effects
  - architettura
aliases:
  - Side effects controllati
  - Effetti collaterali controllati
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
  - "[[Programmazione/Clean Code/Pagine/Immutabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
title: Side effects controllati
---

# Side effects controllati

## Sintesi

Un **effetto collaterale** è un cambiamento osservabile oltre al risultato della funzione: scrivere un ordine, registrare un evento, inviare un messaggio o modificare un argomento condiviso. Controllare gli effetti significa rendere espliciti **chi li avvia, in quale ordine e cosa sa il chiamante se uno fallisce**. Non significa che siano reversibili.

## Esempio: calcolare un totale e registrare la vendita

Nell'esempio le righe sono già validate: quantità intere positive, prezzi non negativi in centesimi e somme nel campo degli interi sicuri. L'archivio restituisce un ID dopo il salvataggio; l'audit è obbligatorio per dichiarare completata l'intera operazione.

```js
function totalCents(lines) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
}

async function recordSale(lines, { save, audit }) {
  const total = totalCents(lines);
  const id = await save({ totalCents: total });
  await audit({ event: "sale-saved", id, totalCents: total });
  return id;
}
```

Il calcolo da solo non deve salvare la vendita né scrivere log: puoi usarlo nell'anteprima di un ordine senza registrare una transazione. Il significato dell'evento è «vendita salvata», non «tentativo di vendita»; per questo serve l'ID e l'audit segue il salvataggio.

## Esiti osservabili

| Esito | Effetti ed esito per il chiamante |
| --- | --- |
| Salvataggio e audit confermati | Un salvataggio, poi un audit con lo stesso ID; `recordSale` restituisce l'ID. |
| `save` rifiuta la promessa | Nessuna chiamata ad `audit`; il chiamante riceve l'errore di `save`. Un timeout reale non prova da solo che il server non abbia scritto. |
| `save` riesce, `audit` rifiuta | La vendita è già salvata; l'operazione complessiva rifiuta la promessa. Non c'è rollback automatico. |

## Criteri pratici

- Nei test controlla traccia delle chiamate, dati passati ed errori oltre al valore restituito. I sostituti locali provano l'orchestrazione, non la durabilità di un archivio reale.
- Se la registrazione è telemetria facoltativa, decidi come segnalare o recuperare il suo guasto senza cambiare l'esito della vendita. Non ingoiare indistintamente qualunque errore.
- Se vendita ed evento devono essere conservati insieme, valuta una transazione che salvi anche un evento da consegnare successivamente. Due `await` consecutivi non creano una transazione; ripetere alla cieca `recordSale` dopo un esito parziale può duplicare la vendita.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Immutabilita|Immutabilita]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]

## Fonti

- Martin Fowler, [Separate Query from Modifier](https://refactoring.com/catalog/separateQueryFromModifier.html)
- Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*; Michael Feathers, *Working Effectively with Legacy Code*
