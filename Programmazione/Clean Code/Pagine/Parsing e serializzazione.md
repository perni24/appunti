---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, parsing, serializzazione]
aliases: [Parsing e serializzazione, Parsing and serialization]
prerequisites: [Validazione ai confini, Modellazione del dominio]
related: [DTO e modelli di dominio, Tipi significativi, Messaggi di errore utili]
---

# Parsing e serializzazione

## Sintesi

Il **parsing** trasforma input esterno in strutture interne. La **serializzazione** trasforma strutture interne in un formato scambiabile, come JSON, CSV, XML o binario.

Nel Clean Code questi passaggi sono confini importanti: qui dati grezzi diventano dati affidabili, o dati interni diventano contratto pubblico.

## Quando usarlo

- Quando ricevi payload da API, file, CLI o code.
- Quando produci risposte JSON o messaggi per altri sistemi.
- Quando devi salvare o caricare dati.
- Quando devi separare formato esterno e modello interno.
- Quando servono messaggi di errore chiari sugli input.

## Come funziona

Il parsing dovrebbe:

- leggere dati grezzi;
- controllare formato e campi;
- validare vincoli minimi;
- tradurre in tipi interni.

La serializzazione dovrebbe fare il contrario senza esporre dettagli interni non desiderati.

## API / Sintassi

```text
raw input -> parser -> validated DTO -> domain object
domain object -> serializer -> external format
```

Separare questi passaggi evita che il formato esterno invada tutto il codice.

## Esempio pratico

```js
function parseCreateUserPayload(payload) {
  if (typeof payload.email !== "string") {
    return { ok: false, error: "email_required" };
  }

  return {
    ok: true,
    value: {
      email: payload.email.trim().toLowerCase(),
      displayName: payload.displayName ?? "",
    },
  };
}
```

Il parsing normalizza e rende esplicito il fallimento.

## Varianti

- Parser manuale: utile per casi piccoli.
- Schema validator: utile per payload complessi.
- Serializer dedicato: utile per API pubbliche.
- Mapper DTO-domain: utile quando formato esterno e dominio divergono.

## Errori comuni

- Usare direttamente payload esterni nel dominio.
- Serializzare oggetti interni senza controllare campi esposti.
- Confondere parsing, validazione e regole di business.
- Restituire errori generici.
- Non gestire compatibilita tra versioni del formato.

## Checklist

- Il formato esterno e separato dal modello interno?
- Gli input vengono validati ai confini?
- Gli errori indicano il campo problematico?
- La serializzazione espone solo cio che serve?
- Esistono test per input validi, mancanti e malformati?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Validazione ai confini]]
- [[Modellazione del dominio]]
- [[Tipi significativi]]
- [[Messaggi di errore utili]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Eric Evans, *Domain-Driven Design*
- Microsoft, *REST API Guidelines*
