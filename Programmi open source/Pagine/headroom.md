---
date: 2026-06-18
area: Programmi open source
topic: Compressione del contesto LLM
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [open-source, ai, llm, context, token, rag]
aliases: [headroom, Headroom]
prerequisites: []
related: [Token Tamer]
---

# headroom

## Sintesi

**headroom** e un progetto open source per comprimere output di tool, log, file e chunk RAG prima di inviarli a un modello LLM.

L'obiettivo e ridurre consumo di token e rumore contestuale, mantenendo le informazioni utili per il ragionamento del modello.

## Quando usarlo

- Usare agenti AI che producono o leggono output molto lunghi.
- Ridurre il contesto inviato al modello.
- Comprimere log, file o risultati di ricerca prima di passarli a un LLM.
- Migliorare workflow RAG dove i chunk recuperati sono troppo verbosi.
- Evitare che dettagli ripetitivi consumino spazio nella context window.

## Come funziona

headroom si colloca prima della chiamata al modello: prende testo lungo, output di strumenti o contenuto recuperato e lo compatta in una forma piu densa.

Il caso d'uso e simile a [[Token Tamer]], ma piu generale: invece di concentrarsi solo su coding agent e codice sorgente, punta anche a log, tool output, file e chunk RAG.

## Esempio d'uso

```text
Output grezzo del tool
  -> compressione con headroom
  -> contesto piu breve
  -> invio al modello LLM
```

## Punti forti

- **Riduce token**: utile quando il contesto e molto grande.
- **Adatto a tool output**: lavora su log e risultati verbosi.
- **Utile per RAG**: puo comprimere chunk prima dell'inferenza.
- **Complementare agli agenti**: puo stare davanti a workflow gia esistenti.

## Limiti

- La compressione puo eliminare dettagli importanti se configurata male.
- Va testato sul proprio tipo di contenuto: log, codice, documenti e RAG hanno esigenze diverse.
- Non sostituisce retrieval o selezione del contesto ben progettati.
- Prima di usarlo in produzione bisogna verificare sicurezza, accuratezza e comportamento sui casi limite.

## Checklist

- Misurare token risparmiati e qualita della risposta.
- Testare con output lunghi e casi limite.
- Conservare il testo originale quando serve audit o debug.
- Evitare compressione aggressiva su errori, stack trace e dati critici.
- Confrontare con [[Token Tamer]] se il caso d'uso e specificamente coding agent.

## Collegamenti

- [[Token Tamer]]
- [[Programmi open source/Indice programmi open source]]
- https://github.com/chopratejas/headroom
