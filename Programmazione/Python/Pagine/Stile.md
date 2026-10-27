---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - programming
  - style
aliases:
  - Stile Python
  - PEP 8
prerequisites: []
related: []
title: Stile in Python
---

# Stile in Python

## Sintesi

Lo stile rende il codice leggibile e coerente; non certifica il suo comportamento. Convenzioni umane, formatter, linter, type checker e test coprono problemi diversi.

Riferimento degli esempi: Python 3.12, CPython 3.12.10. Tool provati: Ruff 0.17.2 e Black 26.10.1; i comandi si riferiscono a queste baseline, non a una configurazione universale.

## Problema che risolve

Riduce il tempo necessario per capire nomi, flussi e responsabilita. Limita anche i diff dovuti soltanto alla formattazione, soprattutto in progetti condivisi e durante refactoring.

Uniformita non significa applicare ogni regola possibile. Prima vengono il contratto del codice e le convenzioni del progetto; una modifica estetica estesa non va mescolata casualmente con un bugfix.

## Concetto chiave

### Convenzioni leggibili

```python
user_name = "Luca"
MAX_RETRIES = 3


class UserService:
    def format_name(self, name: str) -> str:
        return name.strip()


service = UserService()
print(service.format_name(" Ada "))  # Ada
```

Variabili, funzioni e metodi usano normalmente snake_case; classi CapWords; costanti UPPER_CASE. Il nome maiuscolo non impedisce la riassegnazione.

Quattro spazi per livello di indentazione, import espliciti e raggruppati, righe vuote tra unita logiche. Evita nomi che oscurano built-in come `list` o `str`. Un nome deve essere preciso nel contesto, non necessariamente lunghissimo.

### Documentare un contratto reale

```python
def normalize_label(value: str) -> str:
    """Strip surrounding whitespace and reject an empty label.

    Internal spaces and letter case are preserved.
    """
    if not isinstance(value, str):
        raise TypeError("value must be a string")
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("label cannot be empty")
    return cleaned


print(normalize_label("  First Draft  "))  # First Draft
```

La docstring descrive il comportamento, compresi limiti utili. Non chiamare una semplice operazione `strip().lower()` "normalizzazione email" generale: cambiare maiuscole e minuscole non risolve sintassi, domini e politica dell'applicazione.

Un commento e utile se spiega un vincolo o una decisione verificabile. Non inventare limiti di un provider per giustificare un numero: collega la specifica reale. Le docstring non vengono automaticamente controllate; un test puo scoprire divergenze.

## Dettagli importanti

| Strumento                      | Controlla principalmente                                        | Non garantisce                              |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| Formatter: Ruff format o Black | Layout, spazi, parentesi e interruzioni di riga                 | Correttezza della logica                    |
| Linter: Ruff, Flake8           | Regole abilitate, import inutilizzati e alcuni errori probabili | Tutti i bug o tutti i problemi di sicurezza |
| Type checker: mypy, Pyright    | Compatibilita dei contratti statici                             | Validita dei dati esterni                   |
| Test runner: pytest, unittest  | Risultati osservati nei casi eseguiti                           | Tutti gli input e ambienti possibili        |

PEP 8 propone normalmente 79 caratteri per il codice e 72 per commenti/docstring, con accordi di progetto possibili. Il default 88 dei formatter citati e una scelta diversa: non chiamarlo "il limite obbligatorio di Python".

Il formatter non ordina necessariamente gli import: con Ruff la regola `I` appartiene al linter. Scegli un solo formatter principale; Black e Ruff format sono alternative, non passaggi da alternare sullo stesso file. isort puo essere utile nei workflow gia impostati per quello scopo.

## Esempio

### Nomi e struttura senza cambiare il risultato

Versione deliberatamente poco espressiva, con un input completo:

```python
def calc(x):
    s = 0
    for i in x:
        s += i["p"] * i["q"]
    return s


print(calc([{"p": 250, "q": 2}, {"p": 100, "q": 1}]))  # 600
```

Versione con nomi e struttura dei dati espliciti:

```python
from typing import TypedDict


class OrderLine(TypedDict):
    unit_price_cents: int
    quantity: int


def calculate_order_total(items: list[OrderLine]) -> int:
    return sum(item["unit_price_cents"] * item["quantity"] for item in items)


items: list[OrderLine] = [
    {"unit_price_cents": 250, "quantity": 2},
    {"unit_price_cents": 100, "quantity": 1},
]
print(calculate_order_total(items))  # 600
```

Qui gli importi sono centesimi interi e si assumono righe gia validate. TypedDict non convalida valori negativi, campi mancanti o dati esterni. Il confronto mostra leggibilita, non un sistema completo per ordini, imposte o arrotondamenti. Anche una funzione piu corta puo essere peggiore se nasconde il dominio.

### Workflow Ruff

Prerequisiti: Ruff installato nell'ambiente di sviluppo, una directory di progetto con file Python e la versione del tool fissata dal progetto. Esempio di `pyproject.toml`, da integrare senza duplicare sezioni esistenti:

```toml
[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = ["E4", "E7", "E9", "F", "I", "UP", "B"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

La selezione e esplicita: non include tutte le regole disponibili e non abilita automaticamente E501. `target-version` serve all'analisi/riscrittura; non cambia l'interprete che esegue il programma.

Controlli che non riscrivono i sorgenti:

```powershell
python -m ruff check .
```

```powershell
python -m ruff format --check .
```

Modifiche in-place: prima controlla il diff Git e poi riesegui i test.

```powershell
python -m ruff check --fix .
```

```powershell
python -m ruff format .
```

`--fix` applica le correzioni disponibili considerate sicure dal tool, non garantisce che ogni cambiamento sia innocuo nel tuo progetto. `--unsafe-fixes` allarga deliberatamente il perimetro: non abilitarlo senza valutazione. Regole non correggibili richiedono intervento manuale.

I comandi check devono fallire in CI quando trovano problemi. Non trattare un exit code non zero come un messaggio trascurabile; puoi avere anche errori di configurazione o di esecuzione.

### Alternativa Black

Con Black installato, senza usare anche Ruff format sullo stesso workflow:

```powershell
python -m black --check --diff .
```

Per applicare la formattazione, con modifica dei file:

```powershell
python -m black .
```

Black non sostituisce il lint. Si puo combinare con Ruff check, mantenendo coerenti lunghezza di riga e regole selezionate. La massima lunghezza non e un vincolo che il formatter possa sempre soddisfare, per esempio con stringhe non divisibili.

## Limiti

- Nomi corretti e layout uniforme non riparano un algoritmo errato.
- "Funzione piccola" non significa un numero massimo universale di righe.
- Lint, tipi e coverage non equivalgono a un audit di sicurezza.
- Un noqa o un ignore e una decisione da motivare e restringere alla regola necessaria.
- Cambiare formatter o versione puo introdurre molti diff: fallo separatamente quando possibile.

## Errori comuni

- Confondere formatter, linter e type checker.
- Usare abbreviazioni oscure o import wildcard.
- Aggiungere commenti che ripetono soltanto le istruzioni.
- Applicare fix automatici senza leggere il diff.
- Usare piu strumenti concorrenti per la stessa formattazione.
- Sacrificare la chiarezza per comprimere tutto in una comprehension.

## Checklist

- Nomi e unita di misura sono espliciti?
- La docstring descrive il contratto effettivo?
- Esiste un unico formatter concordato?
- Lint e formattazione hanno comandi di check in CI?
- Le eccezioni alle regole sono motivate?
- I cambiamenti automatici sono stati revisionati e testati?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/isort|isort]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [PEP 8: convenzioni di stile](https://peps.python.org/pep-0008/).
- [PEP 257: docstring](https://peps.python.org/pep-0257/).
- [Ruff: configurazione](https://docs.astral.sh/ruff/configuration/).
- [Ruff: linter e correzioni](https://docs.astral.sh/ruff/linter/).
- [Ruff: formatter](https://docs.astral.sh/ruff/formatter/).
- [Black: comandi e configurazione](https://black.readthedocs.io/en/stable/usage_and_configuration/the_basics.html).
