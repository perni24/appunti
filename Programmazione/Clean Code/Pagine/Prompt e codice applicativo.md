---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, llm, prompt]
aliases: [Prompt e codice applicativo, Prompt as application code]
prerequisites: [Contratti impliciti ed espliciti, Output strutturati]
related: [Validazione dei dati generati, Parsing di input esterni, Test come documentazione]
---

# Prompt e codice applicativo

## Sintesi

Quando un'applicazione usa un LLM, il **prompt** diventa parte del comportamento applicativo.

Va quindi trattato come codice: versionato, testato, leggibile, con input e output attesi chiari.

## Problema che risolve

Prompt gestiti come testo improvvisato causano:

- comportamento instabile;
- output difficili da validare;
- dipendenza da dettagli non documentati;
- modifiche non tracciate;
- prompt duplicati;
- test impossibili o fragili.

## Concetto chiave

Un prompt applicativo dovrebbe dichiarare:

- ruolo del modello;
- input disponibili;
- vincoli;
- formato di output;
- esempi quando utili;
- errori o casi limite da gestire.

Il codice intorno al prompt deve comunque validare l'output.

## Dettagli importanti

- I prompt importanti vanno tenuti in file o funzioni nominate.
- Versiona prompt e schema di output insieme.
- Non inserire dati sensibili non necessari.
- Se l'output alimenta codice o database, serve validazione forte.
- I test dovrebbero coprire casi reali e regressioni note.

## Esempio

Prompt fragile:

```text
Riassumi questo testo.
```

Prompt applicativo piu chiaro:

```text
Estrai una sintesi operativa in italiano.
Rispondi con JSON valido:
{
  "summary": "string",
  "open_questions": ["string"]
}
```

Il secondo prompt definisce un contratto verificabile.

## Limiti

- Un prompt non garantisce da solo correttezza.
- I modelli possono cambiare comportamento tra versioni.
- Test deterministici su LLM richiedono tolleranze e validazione strutturale.
- Prompt troppo lunghi possono diventare difficili da mantenere.

## Errori comuni

- Affidarsi a testo libero quando serve output strutturato.
- Non versionare prompt critici.
- Non validare output prima di usarlo.
- Mescolare prompt, business logic e parsing in una sola funzione.
- Non registrare modello, parametri e prompt usati in un'esecuzione importante.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Contratti impliciti ed espliciti]]
- [[Output strutturati]]
- [[Validazione dei dati generati]]
- [[Parsing di input esterni]]
- [[Test come documentazione]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- Simon Willison, *Prompt injection*
- Martin Fowler, *Refactoring*
