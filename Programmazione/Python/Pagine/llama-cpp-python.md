---
date: 2026-05-20
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - llm
  - llama
aliases: []
prerequisites: []
related: []
---

# llama-cpp-python

## Sintesi

`llama-cpp-python` e un binding Python per llama.cpp. Permette di eseguire modelli LLM locali, spesso in formato GGUF.

## Concetto chiave

La libreria espone API Python sopra un backend nativo ottimizzato per inferenza locale.

```python
from llama_cpp import Llama

llm = Llama(model_path="model.gguf")
output = llm("Spiega Python in una frase.", max_tokens=64)
```

## Quando usarlo

- Prototipi LLM offline.
- Privacy locale.
- RAG locale.
- Esperimenti con modelli quantizzati.

## Aspetti pratici

- Performance dipende da CPU/GPU e quantizzazione.
- I modelli possono essere molto grandi.
- Serve gestire contesto, prompt e memoria.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/OpenAI API|OpenAI API]]
- [[AI/Indice AI|Indice AI]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]


