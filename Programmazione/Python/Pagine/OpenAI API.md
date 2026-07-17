---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, openai, llm]
aliases: [OpenAI API, API OpenAI]
prerequisites: []
related: []
---

# OpenAI API

## Sintesi

La OpenAI API permette a un'applicazione Python di usare modelli per testo, ragionamento, strumenti, embeddings, immagini, audio e workflow agentici.

Per applicazioni nuove, il riferimento principale e la documentazione ufficiale della Responses API. Nomi dei modelli, parametri e capability cambiano nel tempo: vanno verificati nelle docs ufficiali prima di fissarli in un progetto.

## Quando usarlo

Usa la OpenAI API quando:

- vuoi integrare generazione o trasformazione di testo;
- devi fare estrazione strutturata da input naturali;
- vuoi usare embeddings per ricerca semantica o RAG;
- vuoi costruire agenti con strumenti;
- vuoi analizzare immagini, audio o input multimodali;
- vuoi usare modelli cloud invece di inferenza locale.

Per dati sensibili, valuta requisiti privacy, policy interne e alternative locali come [[llama-cpp-python]].

## Come funziona

Il client Python invia input strutturato a un modello e riceve output testuale, strutturato o azioni da gestire nell'applicazione.

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="MODEL_NAME",
    input="Riassumi il concetto di virtualenv in una frase.",
)

print(response.output_text)
```

La chiave API va gestita come segreto, normalmente tramite variabile d'ambiente.

```powershell
$env:OPENAI_API_KEY = "..."
```

## API / Sintassi

Pattern comuni:

- **Responses API**: generazione, input multimodale e tool use;
- **Embeddings**: vettori per ricerca semantica;
- **Structured outputs**: output vincolato a schema;
- **Streaming**: ricezione progressiva dei token/eventi;
- **Tools/function calling**: il modello richiede azioni che l'applicazione esegue;
- **Batch o workflow asincroni**: per carichi grandi o differibili.

Wrapper minimo:

```python
from openai import OpenAI


client = OpenAI()


def ask_model(prompt):
    response = client.responses.create(
        model="MODEL_NAME",
        input=prompt,
    )
    return response.output_text
```

## Esempio pratico

Classificazione semplice con output controllato a livello applicativo:

```python
from openai import OpenAI


client = OpenAI()


def classify_ticket(text):
    prompt = f"""
Classifica il ticket in una categoria tra: bug, billing, feature, other.
Rispondi solo con la categoria.

Ticket:
{text}
"""
    response = client.responses.create(
        model="MODEL_NAME",
        input=prompt,
    )
    category = response.output_text.strip().lower()

    allowed = {"bug", "billing", "feature", "other"}
    if category not in allowed:
        return "other"

    return category
```

Anche quando chiedi output vincolato, valida sempre il risultato se influenza logica applicativa.

## Varianti

- **API cloud**: qualita e scalabilita gestite dal provider.
- **LLM locale**: piu controllo su dati e runtime, ma piu vincoli hardware.
- **Embeddings + retrieval**: per conoscenza privata o documenti interni.
- **Structured output**: per integrare LLM in sistemi deterministici.
- **Tool use**: il modello decide quando richiedere una funzione, il codice la esegue.
- **Streaming**: utile per UX interattive.

## Errori comuni

- Salvare chiavi API nel codice o nel repository.
- Fissare modelli senza piano di aggiornamento.
- Non impostare timeout, retry e gestione errori.
- Fidarsi dell'output senza validazione.
- Usare il modello come database invece di usare retrieval per conoscenza privata.
- Inviare dati sensibili senza valutazione privacy.
- Non misurare costo, latenza e qualita con input realistici.

## Checklist

- La chiave API e gestita come segreto?
- Modello e capability sono verificati sulle docs ufficiali?
- Input e output sono validati?
- Esistono timeout e gestione errori?
- I dati inviati rispettano requisiti privacy?
- Serve retrieval invece di prompt lunghi?
- Costo e latenza sono misurati?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[llama-cpp-python]]
- [[HTTPX e requests]]
- [[Pydantic]]
- [[AI/Indice AI|Indice AI]]
- [OpenAI API docs](https://platform.openai.com/docs)
- [OpenAI API reference](https://platform.openai.com/docs/api-reference)
