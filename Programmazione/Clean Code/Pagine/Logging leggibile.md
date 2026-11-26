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
  - logging
  - osservabilita
aliases:
  - Logging leggibile
  - Readable logging
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Codice pronto al deploy]]"
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
title: Logging leggibile
---

# Logging leggibile

## Sintesi

Un log leggibile descrive un **evento osservato** con campi stabili. «Autorizzazione negata» è diverso da «non sappiamo se il provider ha risposto»: nel primo caso conosci l'esito, nel secondo no. Un'unica riga `"Payment failed"` può suggerire all'operatore l'azione sbagliata.

## Esempio: evento e contesto minimo

Per questo esempio `outcome` è uno degli esiti già classificati dall'adattatore: `"declined"` o `"unknown"`. `requestId` è un identificatore opaco generato dal servizio, non un valore arbitrario ricevuto in un header. Il sink riceve un record strutturato, non l'intero oggetto del provider:

```js
function logAuthorization(outcome, requestId, write) {
  if (outcome !== "declined" && outcome !== "unknown") {
    throw new RangeError("Esito di autorizzazione non riconosciuto");
  }
  write({
    event: "payment.authorization",
    level: outcome === "declined" ? "info" : "warn",
    outcome,
    requestId,
  });
}
```

In questo sistema un rifiuto previsto è informativo; un esito ignoto merita attenzione. Il livello è una **scelta operativa**, non una verità universale. A parità di evento si può cercare per `outcome` o correlare con `requestId` senza interpretare una frase libera. Non passare al sink token, payload completi, indirizzi email o testo grezzo delle eccezioni.

## Come verificare il log

Cattura i record in un sink di prova. Controlla evento, esito, livello e insieme delle chiavi; il timestamp e la destinazione finale possono essere responsabilità del logger. Una riga per ogni livello dello stack duplicherà lo stesso incidente: registra l'esito dove il suo significato è noto. I log non sostituiscono contatori o tracing e il loro successo non prova che il pagamento sia stato eseguito.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili|Errori recuperabili e non recuperabili]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]

## Fonti

- OpenTelemetry, [Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)
- Michael Nygard, *Release It!*; Charity Majors, Liz Fong-Jones e George Miranda, *Observability Engineering*; Robert C. Martin, *Clean Code*
