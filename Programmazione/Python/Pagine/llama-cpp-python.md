---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, llm, llama]
aliases: [llama-cpp-python, llama.cpp Python]
prerequisites: []
related: []
---

# llama-cpp-python

## Sintesi

`llama-cpp-python` e un binding Python per llama.cpp. Permette di eseguire modelli LLM locali, spesso in formato GGUF, senza chiamare API remote.

E utile per prototipi offline, privacy locale, RAG locale, esperimenti con modelli quantizzati e integrazioni dove il costo o la connettivita sono vincoli importanti.

## Quando usarlo

Usalo quando:

- vuoi eseguire LLM in locale;
- devi evitare invio dati a servizi esterni;
- vuoi testare modelli GGUF quantizzati;
- stai costruendo un prototipo RAG locale;
- vuoi confrontare inferenza locale e API remote;
- il modello scelto e compatibile con llama.cpp.

Non e automaticamente la scelta migliore: performance, qualita e memoria dipendono molto da hardware, modello e quantizzazione.

## Come funziona

La libreria espone una API Python sopra un backend nativo.

```python
from llama_cpp import Llama

llm = Llama(model_path="model.gguf")

output = llm(
    "Spiega Python in una frase.",
    max_tokens=64,
)

print(output["choices"][0]["text"])
```

Il file `.gguf` contiene pesi e metadati del modello. Modelli piu grandi richiedono piu RAM o VRAM.

## API / Sintassi

Parametri comuni:

- `model_path`: percorso del modello GGUF;
- `n_ctx`: dimensione del contesto;
- `n_threads`: thread CPU;
- `n_gpu_layers`: quanti layer scaricare su GPU, se supportato;
- `max_tokens`: token massimi generati;
- `temperature`: casualita della generazione;
- `stop`: sequenze di stop.

Esempio:

```python
llm = Llama(
    model_path="model.gguf",
    n_ctx=4096,
    n_threads=8,
)
```

## Esempio pratico

Funzione wrapper:

```python
from llama_cpp import Llama


llm = Llama(model_path="model.gguf", n_ctx=4096)


def complete(prompt):
    response = llm(
        prompt,
        max_tokens=128,
        temperature=0.2,
        stop=["</s>"],
    )
    return response["choices"][0]["text"].strip()


print(complete("Elenca tre vantaggi di SQLite."))
```

## Varianti

- **Completion semplice**: prompt testuale e completamento.
- **Chat template**: dipende dal modello e dal formato atteso.
- **RAG locale**: retrieval locale piu modello GGUF.
- **CPU inference**: piu portabile, spesso piu lenta.
- **GPU offload**: migliora performance quando disponibile.
- **API server locale**: utile per integrare client compatibili.

## Errori comuni

- Usare un modello troppo grande per la RAM disponibile.
- Ignorare il formato prompt/chat richiesto dal modello.
- Confondere quantizzazione piu piccola con qualita equivalente.
- Non impostare limiti di contesto e token.
- Aspettarsi prestazioni da API cloud su hardware locale modesto.
- Non misurare latenza e throughput con input realistici.
- Trattare output LLM come affidabile senza validazione.

## Checklist

- Il modello GGUF e compatibile?
- RAM/VRAM sono sufficienti?
- Prompt e chat template sono corretti?
- Contesto e token massimi sono configurati?
- La latenza e accettabile?
- Gli output sono validati prima di usarli?
- Serve davvero inferenza locale invece di API remota?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[OpenAI API]]
- [[AI/Indice AI|Indice AI]]
- [[Ambienti Virtuali]]
- [[Memory Management]]
