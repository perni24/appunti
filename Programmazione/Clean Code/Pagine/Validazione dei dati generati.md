---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - llm
  - validazione
aliases:
  - Validazione dei dati generati
  - Validation of generated data
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Output strutturati]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Prompt e codice applicativo]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing di input esterni]]"
  - "[[Programmazione/Clean Code/Pagine/Codice pronto al deploy]]"
title: Validazione dei dati generati
---

# Validazione dei dati generati

## Sintesi

Un output conforme può citare la fonte sbagliata, inventare una frase o riportare correttamente poche parole che, nel contesto, significano il contrario. **Forma, tracciabilità e sostegno all'affermazione vanno verificati separatamente.** Nessuno di questi controlli conferisce il permesso di eseguire un'azione.

## Esempio: controllare una proposta contro la sorgente

`proposal` è **già passato** dal [[Programmazione/Clean Code/Pagine/Output strutturati|parser v1]]. `passages` è lo stesso snapshot autorizzato e immutato fornito al modello, non una versione più recente né un documento scelto dal modello. Il verificatore non invia nulla e non aggiorna lo stato della consegna.

```js
function checkEvidence(proposal, passages) {
  const { passageId, quote } = proposal;
  if (passageId === null) return { kind: "abstained" };
  const matches = passages.filter(p => p.id === passageId);
  if (matches.length !== 1) return { kind: "unsupported", code: "source_not_unique_or_missing" };
  const source = matches[0];
  if (!source.text.includes(quote)) return { kind: "unsupported", code: "quote_not_found" };
  return { kind: "needs_review", passageId, quote, context: source.text };
}
```

## Perché serve ancora il contesto?

| Fonte fornita | Proposta | Decisione |
| --- | --- | --- |
| S2: «Consegna confermata per il 18 maggio.» | S2, «18 maggio» | Citazione presente. Il revisore può controllare la conferma |
| S3: «Il 18 maggio non è una data confermata.» | S3, «18 maggio» | Stesso riscontro letterale; **non** sostiene una conferma |
| S2 contiene solo «18 maggio» | S2, «19 maggio» | Citazione assente: scarta la proposta |
| Nessun passaggio con ID S9 | S9, «18 maggio» | Fonte non disponibile: non cercare altrove per giustificare l'output |

Una citazione riscontrata produce `needs_review`, mai «consegna confermata». Mostra al revisore il passaggio intero e rendi consultabile il resto dello snapshot per verificare anche eventuali contraddizioni. L'astensione significa «nessuna proposta», **non** «la consegna non esiste». Se cambi la versione della sorgente, ripeti la verifica.

## Controlli prima di usare il dato

Per una corrispondenza puramente deterministica applica la regola nel codice, senza delegarla al modello. Per un'interpretazione conserva l'esito del revisore distinto dalla proposta, l'ID e la versione della fonte e i riferimenti a prompt e schema. Proteggi questo materiale secondo i permessi originali: un log di audit non è una ragione per copiare interi documenti. Testa un falso positivo **con citazione autentica**, non solo JSON rotto o riferimenti inventati.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Output strutturati|Output strutturati]]
- [[Programmazione/Clean Code/Pagine/Prompt e codice applicativo|Prompt e codice applicativo]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]]
- [[Programmazione/Clean Code/Pagine/Codice pronto al deploy|Codice pronto al deploy]]

## Fonti

- OpenAI Documentation, *Structured Outputs*
- OWASP, *LLM Top 10*
- JSON Schema Documentation
- [W3C PROV-O: rappresentare la provenienza di dati e derivazioni](https://www.w3.org/TR/prov-o/)
- [JSON Schema: cosa verifica la forma di un oggetto](https://json-schema.org/understanding-json-schema/reference/object)
