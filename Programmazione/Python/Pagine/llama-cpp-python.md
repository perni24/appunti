---
date: 2026-06-02
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

## Quando usarlo

- Prototipi LLM offline.
- Privacy locale.
- RAG locale.
- Esperimenti con modelli quantizzati.

## Come funziona

### Concetto chiave
La libreria espone API Python sopra un backend nativo ottimizzato per inferenza locale.

```python
from llama_cpp import Llama

llm = Llama(model_path="model.gguf")
output = llm("Spiega Python in una frase.", max_tokens=64)
```
### Aspetti pratici
- Performance dipende da CPU/GPU e quantizzazione.
- I modelli possono essere molto grandi.
- Serve gestire contesto, prompt e memoria.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/OpenAI API|OpenAI API]]
- [[AI/Indice AI|Indice AI]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
