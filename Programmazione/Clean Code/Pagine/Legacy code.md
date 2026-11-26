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
  - legacy-code
  - refactoring
aliases:
  - Legacy code
  - Codice legacy
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Refactoring sicuro]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
  - "[[Programmazione/Clean Code/Pagine/Code smells]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
title: Legacy code
---

# Legacy code

## Sintesi

Per lavorare su codice legacy la prima domanda utile è **«che cosa cambierebbe per chi lo usa?»**. L'età del modulo conta meno della possibilità di verificarlo. Un test di caratterizzazione registra ciò che il programma fa oggi, anche quando non è ancora chiaro se quel comportamento sia desiderato.

## Esempio: un esportatore usato da un vecchio importatore

La funzione esistente riceve codici testuali e un destinatario sincrono `write`. Il parametro del writer permette di osservare le scritture senza raggiungere il sistema esterno; se fosse nascosto nel modulo, il primo piccolo intervento sarebbe rendere sostituibile proprio quella dipendenza, mantenendo lo stesso writer in produzione.

```js
function exportCodesLegacy(codes, write) {
  let n = 0;
  for (const code of codes) {
    if (code !== "") {
      write("C;" + code + "\r\n");
      n += 1;
    }
  }
  return n;
}
```

## Caratterizzare prima di correggere

| Sonda | Comportamento osservabile |
| --- | --- |
| Nessun codice o solo stringhe vuote | Nessuna chiamata a `write`; ritorna `0` |
| `["007", "", "0"]` | Due chiamate nell'ordine, zeri preservati, terminatore CRLF dopo **ogni** codice; ritorna `2` |
| Il writer rifiuta la seconda riga lanciando un errore | La prima è già stata consegnata al writer; nessun terzo tentativo e l'errore arriva al chiamante |

Per verificare l'ultima riga della tabella, usa un writer che registra solo le scritture accettate e fallisce al secondo tentativo. Una prova sul solo valore di ritorno non vedrebbe il lavoro parziale. Non confondere «consegnato al writer» con «salvato su disco»: per quest'ultima garanzia serve una prova con il destinatario reale.

## Decidere il passo successivo

Chiedi a chi usa l'importatore quali comportamenti siano compatibilità richiesta e quali difetti: per esempio, nessuna delle prove dimostra che gli identificativi contenenti `;` siano ammessi. Per una pulizia strutturale mantieni l'output rilevato e confrontalo con la versione in [[Programmazione/Clean Code/Pagine/Refactoring sicuro|Refactoring sicuro]]. Per correggere un difetto concordato, scrivi una prova del nuovo comportamento e aggiorna deliberatamente quella storica interessata.

## Limiti

Proteggi prima i percorsi che devi davvero toccare. Un test che fotografa ogni dettaglio interno rende difficile anche una rinomina; una riscrittura completa basata sui soli casi felici perde invece i contratti impliciti. Con dati storici, usa esempi sintetici rappresentativi, non copie contenenti dati personali.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/Code smells|Code smells]]
- [[Programmazione/Clean Code/Pagine/Refactoring sicuro|Refactoring sicuro]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]

## Fonti

- Michael Feathers, *Working Effectively with Legacy Code*
- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
- [Martin Fowler: isolare una dipendenza nel codice legacy](https://martinfowler.com/bliki/LegacySeam.html)
