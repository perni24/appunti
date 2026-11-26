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
  - parsing
  - serializzazione
aliases:
  - Parsing e serializzazione
  - Parsing and serialization
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
related:
  - "[[Programmazione/Clean Code/Pagine/DTO e modelli di dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Parsing e serializzazione
---

# Parsing e serializzazione

## Sintesi

`JSON.parse` risponde a «questo testo è JSON?», non a «posso usarlo per creare un utente?». Anche `null`, `[]` e `42` sono documenti JSON validi. La **validazione** verifica la forma attesa; la **serializzazione** decide quali dati rendere pubblici. Sono tre decisioni diverse.

## Quando usarlo

Esegui questi controlli quando un dato attraversa un confine: corpo HTTP, messaggio in coda o file importato. Un formato complesso può meritare uno schema condiviso, ma le regole di dominio, come l'unicità di un indirizzo nell'archivio, non si verificano leggendo il JSON.

## Esempio pratico

Questo endpoint riceve testo già decodificato. Richiede `email` come stringa non vuota; `displayName` è facoltativo ma deve essere una stringa quando presente. Per contratto i campi non riconosciuti vengono ignorati, non copiati.

```js
function parseCreateUser(text) {
  let dto;
  try {
    dto = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { ok: false, error: "invalid_json" };
  }
  if (dto === null || typeof dto !== "object" || Array.isArray(dto)) {
    return { ok: false, error: "expected_object" };
  }
  if (typeof dto.email !== "string" || !dto.email.trim()) {
    return { ok: false, error: "invalid_field", field: "email" };
  }
  if (Object.hasOwn(dto, "displayName") && typeof dto.displayName !== "string") {
    return { ok: false, error: "invalid_field", field: "displayName" };
  }
  return { ok: true, value: { email: dto.email.trim(), displayName: dto.displayName?.trim() ?? "" } };
}

function serializePublicUser(user) {
  return JSON.stringify({ id: user.id, displayName: user.displayName });
}
```

`{"email":" A@example.org ","role":"admin"}` produce un input con l'indirizzo ripulito ma senza ruolo. Questa regola **non** verifica il formato completo o il possesso della casella. La risposta pubblica parte da un utente interno valido e seleziona due campi: aggiungere domani `passwordHash` al modello non lo espone per errore.

## Errori comuni e limiti

Non trattare `JSON.stringify` come inversa universale del parsing o come copia di un oggetto: ad esempio, la proprietà di un oggetto il cui valore è `undefined` viene omessa, mentre un `null` esplicito rimane. Decidi se «assente» e «nullo» sono equivalenti per **quel campo**. Se un produttore cambia il tipo di un campo già pubblico, aggiungere un default non rende i vecchi client compatibili.

## Checklist

Prova un documento malformato, un documento valido ma di forma errata e un campo facoltativo presente con tipo sbagliato. Sull'output verifica l'insieme esatto delle chiavi pubbliche, non solo la presenza di una chiave corretta.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Eric Evans, *Domain-Driven Design*
- Microsoft, *REST API Guidelines*
- [ECMAScript: JSON.parse e JSON.stringify](https://tc39.es/ecma262/multipage/structured-data.html#sec-json-object)
- [RFC 8259: valori e sintassi JSON](https://www.rfc-editor.org/rfc/rfc8259.html)
