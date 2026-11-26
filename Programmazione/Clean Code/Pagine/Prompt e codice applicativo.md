---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - llm
  - prompt
aliases:
  - Prompt e codice applicativo
  - Prompt as application code
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
  - "[[Programmazione/Clean Code/Pagine/Output strutturati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Validazione dei dati generati]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing di input esterni]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
title: Prompt e codice applicativo
---

# Prompt e codice applicativo

## Sintesi

Per un'applicazione un prompt è una **richiesta di lavoro**, non una funzione che garantisce la risposta giusta. Il caso di esempio è estrarre una frase che confermi esplicitamente una data di consegna. Il modello può proporre la frase o astenersi; non può confermare la consegna, scrivere nell'archivio o autorizzare un'azione.

## Esempio: comporre la richiesta e gestire gli esiti

`passages` contiene passaggi autorizzati per questa richiesta, con ID univoci e testo. `generate` è un adattatore dell'applicazione, **non** la firma di un SDK: deve consegnare separatamente istruzioni e dati e restituire `complete` con testo, `refused` oppure `incomplete`. Un guasto di trasporto rifiuta la promessa. Il [[Programmazione/Clean Code/Pagine/Output strutturati|parser]] e la [[Programmazione/Clean Code/Pagine/Validazione dei dati generati|verifica sulla fonte]] sono dipendenze distinte.

```js
async function proposeDelivery(passages, { generate, parseProposal, checkEvidence }) {
  const reply = await generate({
    promptVersion: "delivery-1",
    schemaVersion: 1,
    instruction: [
      "Cerca una data di consegna esplicitamente confermata nei passaggi.",
      "Restituisci solo JSON con version: 1, passageId e quote.",
      "Copia una citazione contigua (massimo 240 unità UTF-16) e il suo ID.",
      "Se manca una conferma o le fonti sono in conflitto, usa null per entrambi.",
    ].join(" "),
    data: passages.map(({ id, text }) => ({ id, text })),
  });
  if (reply.kind === "refused" || reply.kind === "incomplete") return { kind: reply.kind };
  if (reply.kind !== "complete") throw new Error("Esito dell'adattatore sconosciuto");
  const parsed = parseProposal(reply.text);
  if (!parsed.ok) return { kind: "invalid_output", code: parsed.code };
  return checkEvidence(parsed.value, passages);
}
```

Il passaggio `{id: "S2", text: "Consegna confermata per il 18 maggio."}` può sostenere una proposta. «Data da concordare» non la sostiene. Un rifiuto del modello e la sua conclusione «non ho trovato conferme» non sono equivalenti; nemmeno un timeout fornisce informazioni sulle fonti.

## Come verificare una modifica al prompt

- Tieni insieme versione del prompt, versione del formato e un piccolo insieme di casi annotati: conferma, assenza, negazione e due date discordanti. Conserva solo il materiale che sei autorizzato a trattare.
- Con un adattatore sostitutivo testa in modo deterministico esiti, campi inviati e blocco degli output invalidi. Per confrontare due prompt sul modello reale misura anche proposte supportate, citazioni sbagliate e astensioni: uno stub non misura la qualità del modello.
- Registra modello, versioni ed esito, non il testo integrale per default. Separare istruzioni e passaggi rende il contratto leggibile, ma **non** è una barriera di sicurezza: mantieni nel codice controllo delle fonti, permessi e decisione finale.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Output strutturati|Output strutturati]]
- [[Programmazione/Clean Code/Pagine/Validazione dei dati generati|Validazione dei dati generati]]
- [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- Simon Willison, *Prompt injection*
- Martin Fowler, *Refactoring*
- [Anthropic: distinguere valutazioni del comportamento e risultati del sistema](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
