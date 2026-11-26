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
  - web
  - controller
aliases:
  - Controller sottili
  - Thin controllers
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Service layer]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione input API]]"
  - "[[Programmazione/Clean Code/Pagine/DTO e modelli di dominio]]"
title: Controller sottili
---

# Controller sottili

## Sintesi

Un controller è **sottile** quando prende decisioni sul protocollo e lascia al caso d'uso quelle sull'operazione. Sa che una risposta deve essere JSON e avere uno status HTTP; non dovrebbe sapere come si salva una fattura o quando si può emettere. Il numero di righe non è il criterio.

## Esempio: emettere una fattura esistente

Il router passa solo `POST /invoice-issues`. L'esempio usa `Request` e `Response` della Fetch API; si assume che autenticazione, autorizzazione all'operazione sulla risorsa e limite alla dimensione del body siano applicati dal sistema circostante. Le tre dipendenze sono il [[Programmazione/Clean Code/Pagine/Validazione input API|validatore]], il [[Programmazione/Clean Code/Pagine/Service layer|caso d'uso]] e la [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|proiezione pubblica]] delle note collegate.

```js
async function postInvoiceIssue(request, { parseIssue, issue, publicInvoice }) {
  const media = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (media !== "application/json") return Response.json({ error: "expected_json" }, { status: 415 });

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const input = parseIssue(body);
  if (!input.ok) return Response.json(input.error, { status: 422 });

  const result = await issue(input.value);
  switch (result.kind) {
    case "missing": return Response.json({ error: "invoice_not_found" }, { status: 404 });
    case "conflict": return Response.json({ error: "not_draft" }, { status: 409 });
    case "issued": return Response.json(publicInvoice(result.invoice), { status: 200 });
    default: throw new Error("Esito di emissione sconosciuto");
  }
}
```

## Come leggere il contratto

Con `{"invoiceId":"INV-7"}` valido, la fattura potrebbe comunque non esistere (404) oppure essere già emessa (409). Sul successo il controller restituisce **200**, non 201: ha cambiato una fattura esistente e ne restituisce la rappresentazione. Per JSON ben formato ma con campi non validi, questa API sceglie 422. Sono scelte da mantenere coerenti fra endpoint, non una regola che imponga 422 a qualunque API.

## Errori comuni e verifica

Il `catch` copre solo la decodifica JSON: un guasto del database non diventa «richiesta non valida». Un gestore esterno traduce gli errori inattesi in una risposta 5xx senza dettagli interni. Prova separatamente che un input errato non chiami il service, che un archivio indisponibile non dia 404 e che il JSON di successo non contenga colonne interne. Per un endpoint banale non servono per forza tre moduli: qui la separazione è utile perché l'emissione ha una transazione e una regola propria.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Service layer|Service layer]]
- [[Programmazione/Clean Code/Pagine/Validazione input API|Validazione input API]]
- [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Robert C. Martin, *Clean Architecture*
- Eric Evans, *Domain-Driven Design*
- [RFC 9110: semantica degli status HTTP](https://www.rfc-editor.org/rfc/rfc9110.html#section-15)
- [WHATWG Fetch: Request, Body e Response](https://fetch.spec.whatwg.org/)
