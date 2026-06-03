---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, programming, packaging]
aliases: [Pip, PyPI, Package manager Python]
prerequisites: []
related: []
---

# Pip e PyPI

## Sintesi

`pip` e il package manager piu usato per installare librerie Python. PyPI, Python Package Index, e il registry pubblico principale da cui `pip` scarica i pacchetti.

La distinzione e importante:

- **PyPI** e il catalogo remoto;
- **pip** e il client che installa pacchetti nell'ambiente Python attivo.

## Quando usarlo

Usa `pip` quando devi:

- installare una libreria esterna;
- aggiornare o rimuovere pacchetti;
- installare dipendenze da `requirements.txt`;
- installare un package locale in editable mode;
- verificare versione, metadati e posizione di un pacchetto.

Usalo preferibilmente dentro un ambiente virtuale.

## Come funziona

Quando esegui:

```bash
python -m pip install httpx
```

`pip` risolve le dipendenze, scarica i pacchetti dal registry configurato e li installa nell'ambiente corrente.

Il nome installato e il nome importato non coincidono sempre.

```bash
python -m pip install beautifulsoup4
```

```python
from bs4 import BeautifulSoup
```

`beautifulsoup4` e il nome della distribuzione su PyPI; `bs4` e il package importabile.

## API / Sintassi

Comandi comuni:

```bash
python -m pip install requests
python -m pip uninstall requests
python -m pip list
python -m pip show requests
```

Installare una versione precisa:

```bash
python -m pip install requests==2.32.0
```

Installare con vincoli:

```bash
python -m pip install "django>=5.0,<6.0"
```

Installare da file:

```bash
python -m pip install -r requirements.txt
```

Aggiornare `pip`:

```bash
python -m pip install --upgrade pip
```

## Esempio pratico

Setup minimo di dipendenze per uno script HTTP:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install httpx
python -m pip freeze > requirements.txt
```

Uso nel codice:

```python
import httpx


response = httpx.get("https://example.com")
print(response.status_code)
```

Ripristino su un'altra macchina:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Varianti

- **`requirements.txt`**: snapshot o lista di dipendenze installabili.
- **Editable install**: `python -m pip install -e .` per sviluppare un package locale.
- **Constraints file**: vincoli di versione separati dalle dipendenze dirette.
- **Index privato**: registry aziendale o mirror interno.
- **Tool moderni**: `uv`, `poetry`, `pip-tools` o `pipx` per workflow piu strutturati.

## Errori comuni

- Usare `pip` collegato all'interprete sbagliato.
- Installare pacchetti fuori dall'ambiente virtuale.
- Non fissare versioni quando serve riproducibilita.
- Confondere nome PyPI e nome importabile.
- Usare `pip freeze` come unica strategia senza distinguere dipendenze dirette e transitive.
- Installare pacchetti sconosciuti senza controllare manutenzione e affidabilita.
- Creare file locali con nomi come `requests.py`, `json.py` o `logging.py`, rompendo gli import.

## Checklist

- Sto usando `python -m pip`?
- L'ambiente virtuale e attivo?
- Il pacchetto e affidabile e mantenuto?
- Ho capito il nome da installare e quello da importare?
- Le versioni sono vincolate quanto basta?
- Le dipendenze sono documentate in un file o lockfile?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Ambienti Virtuali]]
- [[Creazione di Package]]
- [[uv pipx e poetry]]
- [[Standard Library]]
