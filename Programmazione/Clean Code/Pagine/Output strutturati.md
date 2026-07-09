---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, output-strutturati, llm]
aliases: [Output strutturati, Structured outputs]
prerequisites: [Contratti impliciti ed espliciti, Parsing e serializzazione]
related: [Prompt e codice applicativo, Validazione dei dati generati, Messaggi di errore utili]
---

# Output strutturati

## Sintesi

Gli **output strutturati** sono risultati prodotti in un formato prevedibile, come JSON, tabelle, record, eventi o oggetti validabili.

Sono essenziali quando un output deve essere letto da codice, salvato, confrontato o passato a un altro sistema.

## Quando usarlo

- Quando un LLM deve produrre dati usati dall'applicazione.
- Quando una pipeline deve generare file o messaggi.
- Quando una API restituisce risultati a client automatici.
- Quando vuoi validare campi e tipi.
- Quando serve evitare parsing fragile di testo libero.

## Come funziona

Un output strutturato richiede:

- schema o contratto;
- campi obbligatori e opzionali;
- tipi attesi;
- valori ammessi;
- gestione degli errori;
- validazione prima dell'uso.

## API / Sintassi

```json
{
  "title": "string",
  "items": ["string"],
  "confidence": 0.0
}
```

Il formato deve essere semplice da validare e abbastanza espressivo per il caso d'uso.

## Esempio pratico

```js
function parseModelOutput(output) {
  if (typeof output.summary !== "string") {
    return { ok: false, error: "summary_required" };
  }

  return { ok: true, value: output };
}
```

Il codice non usa l'output finche non e stato controllato.

## Varianti

- JSON schema.
- DTO di risposta.
- Tabelle normalizzate.
- Eventi con payload versionato.
- Formati line-delimited per stream.

## Errori comuni

- Chiedere JSON ma accettare qualsiasi testo.
- Non validare campi opzionali.
- Usare strutture troppo flessibili come `data: any`.
- Cambiare schema senza versionare.
- Salvare output non validato.

## Checklist

- Esiste uno schema chiaro?
- Gli output vengono validati?
- I campi obbligatori sono espliciti?
- Le versioni del formato sono gestite?
- Gli errori di parsing sono osservabili?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Contratti impliciti ed espliciti]]
- [[Parsing e serializzazione]]
- [[Prompt e codice applicativo]]
- [[Validazione dei dati generati]]
- [[Messaggi di errore utili]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- JSON Schema Documentation
- Martin Fowler, *Data Transfer Object*
