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
  - output-strutturati
  - llm
aliases:
  - Output strutturati
  - Structured outputs
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Prompt e codice applicativo]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione dei dati generati]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Output strutturati
---

# Output strutturati

## Sintesi

**JSON valido**, **oggetto conforme al contratto** e **affermazione vera** sono tre proprietà diverse. Un consumatore deve almeno verificare le prime due prima di leggere i campi. La terza richiede confronto con la fonte. Un esempio JSON mostra un'istanza: scrivere `"string"` in un valore non definisce uno schema.

## Contratto v1: una proposta oppure un'astensione

Il risultato ha esattamente tre campi. `version` è il numero 1; `passageId` e `quote` sono due stringhe non bianche **oppure entrambi null**. L'ID è lungo al massimo 64 unità UTF-16 e la citazione 240, come misurato da `String.length` in JavaScript. Non si normalizza la citazione: va confrontata testualmente.

```json
{"version":1,"passageId":"S2","quote":"Consegna confermata per il 18 maggio."}
```

## Esempio: parsing locale prima dell'uso

```js
function parseProposal(raw) {
  const fail = code => ({ ok: false, code });
  if (typeof raw !== "string") return fail("expected_text");
  let obj;
  try { obj = JSON.parse(raw); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return fail("invalid_json");
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return fail("expected_object");
  const keys = ["version", "passageId", "quote"];
  if (Object.keys(obj).length !== keys.length || !keys.every(k => Object.hasOwn(obj, k))) {
    return fail("invalid_fields");
  }
  if (obj.version !== 1) return fail("unsupported_version");
  const { passageId, quote } = obj;
  const text = (s, max) => typeof s === "string" && s.trim() !== "" && s.length <= max;
  if (!(passageId === null && quote === null) && !(text(passageId, 64) && text(quote, 240))) {
    return fail("invalid_evidence_pair");
  }
  return { ok: true, value: { version: 1, passageId, quote } };
}
```

Il contratto rifiuta campi aggiuntivi e versioni sconosciute. Questo evita di trattare un nuovo formato come se fosse v1, ma richiede di aggiornare i lettori prima di introdurre nuovi campi obbligatori. Un titolo ben formato o una `confidence` numerica non proverebbero che il contenuto sia attendibile.

## Limiti e verifica

Prova un valore JSON scalare, un campo assente, una coppia mista `null`/stringa, l'astensione completa e una citazione al limite di lunghezza. Limita la dimensione complessiva della risposta prima della decodifica: il limite su `quote` non è un limite sui byte ricevuti. Il parser lavora sull'oggetto restituito da `JSON.parse`: non rileva nomi duplicati nel testo originario. Se devi rifiutarli prima della materializzazione occorre un decoder appropriato.

Per contratti condivisi tra linguaggi puoi adottare JSON Schema e un validatore della versione scelta. L'esempio è un validatore manuale del contratto sopra, non un motore JSON Schema né una promessa sulle funzionalità di un particolare provider.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Prompt e codice applicativo|Prompt e codice applicativo]]
- [[Programmazione/Clean Code/Pagine/Validazione dei dati generati|Validazione dei dati generati]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- JSON Schema Documentation
- Martin Fowler, *Data Transfer Object*
- [RFC 8259: valori JSON e nomi delle proprietà](https://www.rfc-editor.org/rfc/rfc8259.html#section-4)
- [JSON Schema: proprietà obbligatorie e proprietà aggiuntive](https://json-schema.org/understanding-json-schema/reference/object)
