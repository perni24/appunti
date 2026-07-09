---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, llm, validazione]
aliases: [Validazione dei dati generati, Validation of generated data]
prerequisites: [Output strutturati, Validazione ai confini]
related: [Prompt e codice applicativo, Parsing di input esterni, Codice pronto al deploy]
---

# Validazione dei dati generati

## Sintesi

La **validazione dei dati generati** controlla output prodotti da modelli, automazioni o trasformazioni prima che vengano usati come fonte affidabile.

Un dato generato non deve essere considerato corretto solo perche ha il formato giusto.

## Quando usarlo

- Quando un LLM produce JSON, codice, query o decisioni.
- Quando uno script genera file o configurazioni.
- Quando una pipeline trasforma dati provenienti da fonti esterne.
- Quando output automatici vengono salvati in database.
- Quando un errore generato puo produrre effetti reali.

## Come funziona

La validazione dovrebbe controllare:

- forma;
- tipi;
- vincoli;
- completezza;
- coerenza con input;
- permessi;
- sicurezza;
- eventuale revisione umana.

La profondita della validazione dipende dal rischio.

## API / Sintassi

```text
generated output -> schema validation -> business validation -> safe use
```

Lo schema controlla la struttura. Le regole applicative controllano se il contenuto ha senso.

## Esempio pratico

```js
function validateGeneratedTask(task) {
  if (typeof task.title !== "string" || task.title.length === 0) {
    return { ok: false, error: "title_required" };
  }

  if (!["low", "medium", "high"].includes(task.priority)) {
    return { ok: false, error: "invalid_priority" };
  }

  return { ok: true, value: task };
}
```

Il dato generato viene accettato solo se rispetta schema e valori ammessi.

## Varianti

- Validazione sintattica.
- Validazione semantica.
- Confronto con sorgenti autorevoli.
- Human-in-the-loop.
- Quarantena per output incerti.
- Test di regressione su esempi storici.

## Errori comuni

- Usare direttamente output LLM in query, file o comandi.
- Validare solo che il JSON sia parseabile.
- Non controllare valori ammessi.
- Non conservare input e output per audit.
- Non distinguere errore di generazione e errore di validazione.

## Checklist

- L'output generato ha uno schema?
- Il contenuto viene validato rispetto alle regole applicative?
- Esiste un fallback o una revisione umana?
- Input, prompt e output sono tracciabili quando serve?
- Gli output invalidi non producono side effects?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Output strutturati]]
- [[Prompt e codice applicativo]]
- [[Validazione ai confini]]
- [[Parsing di input esterni]]
- [[Codice pronto al deploy]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- OWASP, *LLM Top 10*
- JSON Schema Documentation
