---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, api, validazione]
aliases: [Validazione input API, API input validation]
prerequisites: [Validazione ai confini, DTO e modelli di dominio]
related: [Controller sottili, Messaggi di errore utili, Contratti impliciti ed espliciti]
---

# Validazione input API

## Sintesi

La **validazione input API** controlla dati ricevuti da richieste esterne prima che entrino nella logica applicativa.

Serve a proteggere il sistema da formato errato, campi mancanti, valori non ammessi e ambiguita di contratto.

## Quando usarlo

- In endpoint HTTP pubblici o interni.
- In webhook e integrazioni esterne.
- In GraphQL, RPC, CLI o message handler.
- Prima di trasformare payload in comandi applicativi.
- Quando vuoi restituire errori coerenti al client.

## Come funziona

La validazione API dovrebbe distinguere:

- parsing del formato;
- presenza dei campi;
- tipo dei valori;
- vincoli sintattici;
- autorizzazione;
- regole di dominio.

Non tutte queste regole vivono nello stesso punto.

## API / Sintassi

```text
request payload -> schema/validator -> input DTO -> use case
```

Il controller o handler deve bloccare input non valido prima che entri nel caso d'uso.

## Esempio pratico

```js
function validateCreateUserInput(body) {
  if (typeof body.email !== "string") {
    return { ok: false, error: "email_required" };
  }

  if (!body.email.includes("@")) {
    return { ok: false, error: "email_invalid" };
  }

  return { ok: true, value: { email: body.email.trim() } };
}
```

La risposta di validazione e esplicita e testabile.

## Varianti

- Validazione manuale.
- Schema validation.
- Middleware di validazione.
- Parser typed.
- Validazione accumulata per mostrare piu errori insieme.

## Errori comuni

- Validare solo lato frontend.
- Restituire `400 Bad Request` senza dettagli utili.
- Mescolare autorizzazione e validazione sintattica senza chiarezza.
- Far arrivare payload grezzi al dominio.
- Duplicare schemi senza una fonte chiara.

## Checklist

- L'input viene validato al confine?
- Gli errori indicano campo e motivo?
- I payload validi diventano DTO espliciti?
- Le regole di dominio restano nel dominio?
- I test coprono input mancante, malformato e valido?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Validazione ai confini]]
- [[Controller sottili]]
- [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Messaggi di errore utili]]
- [[Contratti impliciti ed espliciti]]

## Fonti

- Microsoft, *REST API Guidelines*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Robert C. Martin, *Clean Architecture*
