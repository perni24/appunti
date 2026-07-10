---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
difficulty: beginner
tags: [python, programming, style]
aliases: [Stile Python, PEP 8]
prerequisites: []
related: []
---

# Stile in Python

## Sintesi

Lo stile in Python riguarda leggibilita, coerenza e manutenzione. Non e solo estetica: un codice uniforme e piu facile da leggere, testare, modificare e revisionare.

PEP 8 e la base culturale piu importante, ma nel lavoro reale lo stile viene applicato soprattutto con formatter, linter e convenzioni locali del progetto.

## Quando usarlo

Lo stile conta sempre, ma diventa particolarmente importante quando:

- piu persone lavorano sullo stesso progetto;
- il codice deve vivere a lungo;
- fai code review;
- scrivi librerie riutilizzabili;
- vuoi ridurre rumore nei diff;
- vuoi rendere test e refactoring meno costosi.

## Come funziona

Convenzioni comuni:

```python
user_name = "Luca"      # variabili e funzioni: snake_case
MAX_RETRIES = 3         # costanti: UPPER_CASE


class UserService:      # classi: PascalCase
    pass
```

La leggibilita nasce da scelte ripetute:

- nomi chiari;
- funzioni piccole;
- import ordinati;
- responsabilita separate;
- commenti che spiegano il perche;
- formattazione automatica coerente.

## API / Sintassi

Naming:

```python
def calculate_total_price(items):
    return sum(item.price for item in items)
```

Import espliciti:

```python
import json
from pathlib import Path
```

Docstring quando il comportamento merita documentazione stabile:

```python
def normalize_email(value: str) -> str:
    """Restituisce un indirizzo email normalizzato per confronto."""
    return value.strip().lower()
```

Commenti utili:

```python
# Il provider accetta al massimo 100 elementi per richiesta.
chunks = split_into_chunks(items, size=100)
```

## Esempio pratico

Versione poco chiara:

```python
def calc(x):
    s = 0
    for i in x:
        s += i["p"] * i["q"]
    return s
```

Versione piu leggibile:

```python
def calculate_order_total(items):
    total = 0

    for item in items:
        total += item["price"] * item["quantity"]

    return total
```

Il secondo esempio e piu lungo, ma comunica meglio il dominio.

## Varianti

- **PEP 8**: baseline generale per stile Python.
- **PEP 257**: convenzioni per docstring.
- **Formatter**: Black o Ruff Formatter applicano formattazione automatica.
- **Linter**: Ruff, Flake8 o strumenti simili segnalano problemi.
- **Type checker**: mypy o pyright migliorano coerenza semantica.
- **Convenzioni locali**: lo stile gia presente in una codebase conta molto.

## Errori comuni

- Usare abbreviazioni oscure per risparmiare pochi caratteri.
- Scrivere funzioni troppo lunghe e con troppe responsabilita.
- Commentare cosa fa il codice invece di spiegare perche.
- Mischiare stili diversi nello stesso progetto.
- Usare wildcard import.
- Discutere manualmente formattazione che dovrebbe decidere un tool.
- Rendere il codice "furbo" ma difficile da leggere.

## Checklist

- I nomi spiegano il ruolo?
- Le funzioni hanno responsabilita chiare?
- Gli import sono espliciti e ordinati?
- I commenti spiegano decisioni non ovvie?
- Il formatter del progetto viene eseguito?
- Lo stile e coerente con i file vicini?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[isort]]
- [[pre-commit]]
- [[Type Hinting]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
