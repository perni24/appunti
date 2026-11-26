---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - api
  - validazione
aliases:
  - Validazione input API
  - API input validation
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
  - "[[Programmazione/Clean Code/Pagine/DTO e modelli di dominio]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Controller sottili]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
title: Validazione input API
---

# Validazione input API

## Sintesi

Un body JSON leggibile non è ancora un comando valido. `null`, un numero e un array sono JSON validi, ma nessuno dei tre identifica la fattura da emettere. Il parser di questo endpoint restituisce **o** il comando con i soli campi ammessi **o** un errore stabile con campo e motivo.

## Esempio: validare la forma, senza interrogare il database

Contratto di `POST /invoice-issues`: un oggetto con la sola proprietà `invoiceId`, una stringa opaca da 1 a 40 caratteri ASCII tra lettere maiuscole, cifre e trattino. Questa è una convenzione dell'esempio, non una regola generale per gli ID. Non si modificano maiuscole, spazi o zeri iniziali; le chiavi sconosciute vengono rifiutate.

```js
function parseIssue(body) {
  const invalid = (field, code) => ({ ok: false, error: { field, code } });
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return invalid("body", "expected_object");
  }
  if (Object.keys(body).some(key => key !== "invoiceId")) {
    return invalid("body", "unknown_field");
  }
  if (!Object.hasOwn(body, "invoiceId")) return invalid("invoiceId", "required");
  const id = body.invoiceId;
  if (typeof id !== "string" || id.length < 1 || id.length > 40 || /[^A-Z0-9-]/.test(id)) {
    return invalid("invoiceId", "invalid_format");
  }
  return { ok: true, value: { invoiceId: id } };
}
```

## A chi spetta quale controllo?

| Input o situazione | Responsabilità | Esito dell'esempio |
| --- | --- | --- |
| Body non decodificabile come JSON | Controller HTTP | 400, nessuna chiamata al service |
| Oggetto con ID mancante, numerico o proprietà inattesa | Parser | Errore per campo; il controller lo traduce in 422 |
| `"007"` ben formato ma inesistente | Repository e caso d'uso | Comando valido, poi fattura non trovata |
| Fattura già emessa | Dominio e caso d'uso | Conflitto di stato, non errore di formato |
| Il chiamante non ha il permesso di emettere | Politica di accesso | Un ID valido non autorizza l'azione |

## Limiti e verifica

Il parser assume un valore ottenuto da un decoder JSON. Il limite di 40 caratteri riguarda il campo, non il numero di byte accettabili per il body: quello va limitato prima della decodifica. Il controllo si ferma al primo problema; per un modulo che deve mostrare più errori può essere utile accumularli. Per un indirizzo email, analogamente, la sola presenza di `@` non dimostra neppure una sintassi completa, tanto meno il possesso della casella.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Controller sottili|Controller sottili]]
- [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]

## Fonti

- Microsoft, *REST API Guidelines*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Robert C. Martin, *Clean Architecture*
- [RFC 8259: valori rappresentabili in JSON](https://www.rfc-editor.org/rfc/rfc8259.html)
- [RFC 9110: 422 Unprocessable Content](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21)
