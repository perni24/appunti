---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - llm
  - llama
aliases:
  - llama-cpp-python
  - llama.cpp Python
prerequisites: []
related: []
title: llama-cpp-python
---

# llama-cpp-python

## Sintesi

`llama-cpp-python` collega Python al motore nativo `llama.cpp`. Carica modelli compatibili da file GGUF ed esegue inferenza sul computer, usando CPU o un backend accelerato disponibile nella build.

Libreria, modello e applicazione sono tre componenti diversi: installare il pacchetto non installa automaticamente un modello; scegliere un file GGUF non garantisce che la sua architettura sia supportata dalla versione del runtime.

## Quando usarlo

- Prototipi offline o integrazioni che devono mantenere l'inferenza locale.
- Esperimenti con modelli quantizzati e hardware controllato.
- RAG locale, se anche retrieval, embedding e archiviazione sono locali.
- Confronto fra costo operativo, latenza e qualita di modelli locali e servizi remoti.

Locale non significa automaticamente sicuro o gratuito: considera provenienza e licenza dei pesi, memoria, consumi, log, strumenti collegati e accessi al computer.

## Prerequisiti e verifica

Riferimento controllato: **CPython 3.12.10 su Windows x64, llama-cpp-python 0.3.36**, wheel CPU del progetto. Import e API verificati; gli esempi applicativi sono provati con un modello simulato. **Non e stata eseguita generazione reale con GGUF, ne una prova GPU**: occorre un modello compatibile scelto dall'operatore.

In un nuovo ambiente virtuale, installazione CPU senza fallback alla compilazione del pacchetto:

```sh
python -m pip install "llama-cpp-python==0.3.36" --only-binary=llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

Se non esiste una wheel per la piattaforma, il comando fallisce. Non basta togliere l'opzione per risolvere: la compilazione da sorgente richiede toolchain C/C++, CMake e dipendenze del backend. Gli indici aggiuntivi partecipano alla risoluzione delle dipendenze: usa solo fonti fidate e registra versioni/hash per una distribuzione riproducibile. [Installazione ufficiale](https://llama-cpp-python.readthedocs.io/en/latest/#installation).

Per CUDA, Metal o altri backend segui le istruzioni specifiche del progetto. `n_gpu_layers` non installa driver e non converte una wheel CPU in una build GPU.

Prima di caricare un modello, annota:

- origine, licenza, revisione e hash del file;
- architettura, quantizzazione e contesto dichiarato nella model card;
- eventuali file aggiuntivi, shard e template richiesti;
- versione di binding/backend e configurazione hardware usata.

## Come funziona

### Modello, memoria e contesto

Il runtime carica pesi e metadati, tokenizza l'input, esegue il modello e decodifica i token generati. GGUF e un formato, non una famiglia di modelli.

La memoria comprende pesi, cache del contesto e buffer di lavoro; non coincide semplicemente con la dimensione del file. Una quantizzazione piu aggressiva riduce tipicamente lo spazio dei pesi, ma puo cambiare qualita e prestazioni.

`n_ctx` dimensiona il contesto del runtime. Il budget include prompt, cronologia, marcatori del template e output. Aumentarlo non estende automaticamente le capacita del modello; va valutato insieme a memoria e contesto supportato.

### Completion e chat

- **Completion:** `create_completion()` o `llm(prompt)` ricevono testo gia formattato e continuano quel testo.
- **Chat:** `create_chat_completion()` riceve messaggi e applica un template.
- Nella configurazione documentata, la precedenza e `chat_handler`, `chat_format`, template GGUF, poi fallback `llama-2`. Il fallback non prova che il modello sia compatibile: verifica il formato scelto con logging diagnostico.
- Non aggiungere `stop=["</s>"]` per tutti i modelli: terminatori e token speciali dipendono dal tokenizer e dal formato.

La cronologia della conversazione e responsabilita dell'applicazione; non confondere lo stato/cache interno del runtime con la memoria persistente di una chat. [Chat completion](https://llama-cpp-python.readthedocs.io/en/latest/#chat-completion).

## API / Sintassi

| Parametro o metodo | Significato                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `model_path`       | File locale compatibile; nessun download implicito in questo demo |
| `n_ctx`            | Contesto configurato, non token massimi della sola risposta       |
| `n_threads`        | Parallelismo CPU; misurare, non scegliere sempre il massimo       |
| `n_gpu_layers`     | Offload richiesto; `0` CPU, `-1` tutti i layer dove supportato    |
| `chat_format`      | Formato esplicito solo se corrisponde al modello                  |
| `max_tokens`       | Limite della generazione, anche vincolato dal contesto residuo    |
| `temperature`      | Parametro di campionamento, non garanzia di accuratezza           |
| `stream=True`      | Iteratore di frammenti, non risposta finale completa              |
| `close()`          | Rilascio esplicito delle risorse del modello                      |

`Llama` nella baseline non implementa `with Llama(...)`: il demo usa `contextlib.closing`, che chiama `close()` anche in caso di errore. [API del binding](https://llama-cpp-python.readthedocs.io/en/latest/api-reference/).

## Esempio pratico

### local_chat.py

Modulo importabile senza caricare pesi. Il caricamento avviene una volta nel punto d'ingresso; per piu richieste riusa l'istanza fino alla chiusura.

```python
import argparse
from contextlib import closing
from pathlib import Path

from llama_cpp import Llama


def checked_prompt(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Prompt must be non-empty text")
    return value.strip()


def load_model(path, *, n_ctx=2048, n_gpu_layers=0, chat_format=None):
    path = Path(path).expanduser().resolve(strict=True)
    if not path.is_file() or path.suffix.lower() != ".gguf":
        raise ValueError("Expected a local GGUF file")
    if type(n_ctx) is not int or n_ctx < 256:
        raise ValueError("n_ctx must be an integer >= 256")
    return Llama(
        model_path=str(path),
        n_ctx=n_ctx,
        n_gpu_layers=n_gpu_layers,
        chat_format=chat_format,
        verbose=False,
    )


def read_chat_text(response):
    choices = response.get("choices", [])
    if len(choices) != 1:
        raise ValueError("Expected one chat choice")
    choice = choices[0]
    if choice.get("finish_reason") != "stop":
        raise RuntimeError("Chat did not finish normally")
    message = choice.get("message", {})
    if message.get("tool_calls") or message.get("function_call"):
        raise ValueError("Tool calls are not handled by this demo")
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("No text in chat result")
    return content.strip()


def chat_text(llm, prompt, *, max_tokens=128):
    prompt = checked_prompt(prompt)
    if type(max_tokens) is not int or not 0 < max_tokens < llm.n_ctx():
        raise ValueError("max_tokens must be positive and below n_ctx")
    response = llm.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.2,
        stream=False,
    )
    return read_chat_text(response)


def main():
    parser = argparse.ArgumentParser(description="Local GGUF chat")
    parser.add_argument("model", type=Path)
    parser.add_argument("--prompt", default="Elenca tre vantaggi di SQLite.")
    parser.add_argument("--context", type=int, default=2048)
    parser.add_argument("--max-tokens", type=int, default=128)
    parser.add_argument("--gpu-layers", type=int, default=0)
    parser.add_argument("--chat-format")
    args = parser.parse_args()
    with closing(load_model(
        args.model,
        n_ctx=args.context,
        n_gpu_layers=args.gpu_layers,
        chat_format=args.chat_format,
    )) as llm:
        print(chat_text(llm, args.prompt, max_tokens=args.max_tokens))


if __name__ == "__main__":
    main()
```

Help senza modello:

```sh
python local_chat.py --help
```

**Esecuzione reale:** richiede un file GGUF gia acquisito e verificato; il percorso seguente e un esempio, non un modello incluso.

```sh
python local_chat.py "./models/instruct.gguf" --prompt "Elenca tre vantaggi di SQLite."
```

Non specificare `--chat-format` a caso. Se i metadati non bastano, scegli un formato registrato corrispondente alla model card. Anche con `max_tokens < n_ctx`, il prompt completo potrebbe non entrare nel contesto: il controllo del demo non conta i marcatori del template. Il runtime puo sollevare errore o limitare l'output al budget residuo.

Il risultato con `finish_reason="length"` viene rifiutato invece di presentare un testo troncato come completo. Gli errori del demo si propagano con traceback; in un servizio traducili in esiti gestiti senza pubblicare percorsi o contenuti privati.

### local_completion.py

Alternativa per un modello base o un prompt gia formattato. Nella stessa directory di `local_chat.py`; non applica automaticamente il template chat.

```python
import argparse
from contextlib import closing

from local_chat import checked_prompt, load_model


def complete(llm, prompt, *, max_tokens=64):
    prompt = checked_prompt(prompt)
    if type(max_tokens) is not int or max_tokens <= 0:
        raise ValueError("max_tokens must be a positive integer")
    input_tokens = llm.tokenize(prompt.encode("utf-8"), add_bos=True)
    if len(input_tokens) + max_tokens > llm.n_ctx():
        raise ValueError("Prompt and output budget exceed the context")
    result = llm.create_completion(
        prompt=input_tokens,
        max_tokens=max_tokens,
        temperature=0.2,
        echo=False,
        stream=False,
    )
    choice = result["choices"][0]
    if choice["finish_reason"] != "stop":
        raise RuntimeError("Completion did not finish normally")
    text = choice["text"]
    if not isinstance(text, str) or not text.strip():
        raise ValueError("No text in completion")
    return text.strip()


def main():
    parser = argparse.ArgumentParser(description="Raw text completion")
    parser.add_argument("model")
    parser.add_argument("prompt")
    args = parser.parse_args()
    with closing(load_model(args.model)) as llm:
        print(complete(llm, args.prompt))


if __name__ == "__main__":
    main()
```

Il conteggio usa i token effettivamente passati a `create_completion`, ma la convenzione `add_bos=True` resta una scelta da verificare per il modello. Non copiare questa tokenizzazione nel percorso chat senza includere il template.

## Varianti

### Streaming, output strutturato e strumenti

Con `stream=True` la chat restituisce frammenti: il testo e in `choices[0]["delta"].get("content")`, non in `message.content`. Possono arrivare metadati senza testo. Consuma o chiudi l'iteratore prima di chiudere il modello e verifica l'esito finale; quanto gia mostrato puo essere parziale.

Il binding supporta modalita JSON/schema e tool calling in combinazioni di modelli e formati documentate. Un JSON valido non garantisce dati corretti. Valida lo schema e le regole di dominio; una richiesta di funzione non autorizza il modello a eseguire comandi.

### Server locale, embeddings e RAG

L'extra `server` fornisce un server con endpoint compatibili con parte dell'API OpenAI. Non presumere il supporto della Responses API o la parita di tutti i parametri: verifica gli endpoint del server. Ascolta su loopback se non serve accesso remoto; autenticazione, TLS e limiti sono requisiti separati.

Embeddings richiedono un modello adatto e la configurazione corrispondente. Per un RAG servono anche segmentazione dei documenti, indice, retrieval e inserimento delle fonti nel prompt: il binding da solo non implementa l'intero flusso. [Server del progetto](https://llama-cpp-python.readthedocs.io/en/latest/server/).

## Errori comuni

- **Installazione fallita:** distinguere wheel assente, compilatore mancante e backend non configurato.
- **Caricamento fallito:** controllare architettura supportata, integrita del GGUF, shard e versione del runtime.
- **RAM/VRAM esaurita:** considerare anche contesto e buffer, non solo il peso del file.
- **Risposta incoerente:** verificare template/tokenizer prima di cambiare temperature o prompt.
- **Troncamento:** distinguere limite della risposta da contesto esaurito.
- **Risultati non riproducibili:** registrare pesi, seed, parametri, backend e hardware; il solo seed non garantisce identita fra piattaforme.
- **Server bloccato:** la chiamata nativa e sincrona; `async def` non la rende asincrona. Valutare una coda o worker dedicati e non presumere che una stessa istanza sia riusabile contemporaneamente senza coordinamento.
- **Privacy apparente:** controllare logging, download, embedding remoti e strumenti esterni dell'applicazione.

## Checklist

- Versione, file, licenza e hash del modello registrati?
- Build CPU/GPU coerente con l'hardware?
- Modello caricato una volta e risorse chiuse?
- Contesto e output limitati, template verificato?
- Output vuoto/troncato e richieste di strumenti distinti dal successo?
- Latenza, memoria e qualita misurate con un modello reale?
- Prove simulate distinte da inferenza reale?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/OpenAI API|OpenAI API]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]

## Fonti

- [Installazione, chat e funzionalita](https://llama-cpp-python.readthedocs.io/en/latest/).
- [API Reference](https://llama-cpp-python.readthedocs.io/en/latest/api-reference/).
- [Server compatibile OpenAI](https://llama-cpp-python.readthedocs.io/en/latest/server/).
