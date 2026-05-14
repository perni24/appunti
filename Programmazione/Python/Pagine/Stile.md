---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Stile]
prerequisites: []
related: []
---
# Stile in Python

## Sintesi

Nota su Stile in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Lo **stile** in Python non riguarda solo l'estetica del codice. Riguarda leggibilita, coerenza e costo di manutenzione. Codice scritto con uno stile chiaro e uniforme e piu facile da capire, testare, correggere e modificare nel tempo.

Python ha una forte cultura della leggibilita, riassunta anche nello **Zen of Python**: il codice dovrebbe essere esplicito, semplice e facile da seguire.

> [!INFO] Obiettivo reale
> Lo stile non serve a "fare bella figura". Serve a ridurre attrito tra persone, file e revisioni. Se ogni modulo sembra scritto da una lingua diversa, il costo di manutenzione sale subito.

---

##  Riferimenti principali

Il riferimento piu importante e **PEP 8**, la style guide ufficiale di Python.

Punti chiave:
- indentazione a 4 spazi;
- nomi coerenti;
- righe non inutilmente lunghe;
- spaziatura leggibile;
- import ordinati;
- funzioni e classi con responsabilita chiare.

Altri riferimenti utili:
- **PEP 257** per le docstring;
- convenzioni pratiche adottate dal team o dal progetto;
- tool automatici come formatter e linter.

---

##  Convenzioni fondamentali

### Naming

```python
user_name = "Luca"        # variabili e funzioni: snake_case
MAX_RETRIES = 3           # costanti: UPPER_CASE

class UserService:        # classi: PascalCase
    pass
```

Convenzioni comuni:
- funzioni e variabili: `snake_case`
- classi: `PascalCase`
- costanti: `UPPER_CASE`
- metodi e attributi "interni": `_leading_underscore`

### Spaziatura

```python
total = a + b

if total > 10:
    print(total)
```

Spazi ben messi migliorano la scansione visiva. Spaziatura incoerente produce rumore inutile.

### Import chiari

```python
import json
from pathlib import Path
```

Meglio import espliciti e leggibili che wildcard import o alias inutili.

---

##  Funzionamento Interno (Teoria)

### Stile e leggibilita
In Python, la leggibilita e una priorita progettuale. Per questo molte convenzioni di stile non sono arbitrarie:
- riducono l'ambiguita;
- rendono il codice piu uniforme;
- semplificano code review e debugging.

### Coerenza locale > preferenza personale
Anche una buona convenzione perde valore se viene applicata in modo incoerente. In pratica:
- seguire lo stile esistente del progetto e spesso meglio che imporre gusti personali;
- la coerenza tra file vicini conta piu di micro-preferenze individuali.

### Stile e tooling
Lo stile in Python e fortemente supportato da strumenti automatici:
- formatter: applicano regole di formattazione;
- linter: segnalano problemi stilistici o pratici;
- type checker: aggiungono coerenza semantica, non solo formale.

Questa area si collega direttamente a [[Programmazione/Python/Pagine/Type Hinting]].

---

##  Principi pratici di buon stile

### Preferire codice semplice

```python
def is_adult(age: int) -> bool:
    return age >= 18
```

Meglio questo di costruzioni contorte solo per sembrare "piu avanzati".

### Una funzione, una responsabilita
Funzioni troppo lunghe o che fanno troppe cose peggiorano:
- testabilita;
- riuso;
- debugging;
- chiarezza del flusso.

### Nomi che spiegano il ruolo
Meglio:

```python
def calculate_total_price(items: list[float]) -> float:
    ...
```

che:

```python
def calc(x):
    ...
```

Il nome deve spiegare l'intento, non costringere a leggere l'implementazione.

### Commenti con criterio
I commenti utili spiegano **perche**, non solo **cosa**.

Meglio:

```python
# Stile in Python

## Sintesi

Nota su Stile in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
```

che:

```python
# Stile in Python

## Sintesi

Nota su Stile in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
```

---

##  Docstring e documentazione del codice

Le docstring sono appropriate quando una funzione, classe o modulo espone un comportamento che merita documentazione stabile.

```python
def add(a: int, b: int) -> int:
    """Restituisce la somma di due interi."""
    return a + b
```

Una docstring utile chiarisce:
- cosa fa l'elemento;
- eventuali ipotesi importanti;
- casi limite o comportamento atteso.

Se il codice e gia ovvio e il nome e buono, una docstring ridondante puo aggiungere poco valore.

---

##  Formatter, linter e stile applicato

Nel lavoro reale, lo stile non dovrebbe essere gestito "a mano" piu del necessario.

Strumenti comuni:
- **Black**: formatter automatico;
- **Ruff** o **Flake8**: linting;
- **isort**: ordinamento import;
- **mypy/pyright**: coerenza dei tipi.

Approccio pragmatico:
- il formatter decide la forma;
- il linter segnala problemi stilistici o sospetti;
- il team discute sui casi concettuali, non sugli spazi.

---

##  Best Practices & "Gotchas"

-  **Segui PEP 8 come baseline:** ti evita di reinventare convenzioni inutilmente.
-  **Sii coerente con il progetto esistente:** la coerenza locale conta molto.
-  **Usa nomi chiari e specifici:** riducono il bisogno di commenti superflui.
-  **Tieni funzioni e moduli focalizzati:** migliora leggibilita e testabilita.
-  **Automatizza lo stile con tool dedicati:** riduce discussioni a basso valore.
-  **Non usare abbreviazioni oscure:** fanno risparmiare pochi caratteri e costano molto in comprensione.
-  **Non complicare il codice per "eleganza":** in Python la chiarezza viene prima.
-  **Non mischiare stili diversi nello stesso progetto:** aumenta rumore e confusione.
-  **Attenzione ai commenti obsoleti:** un commento sbagliato e peggio di nessun commento.
-  **Attenzione all'over-formatting manuale:** se il formatter del progetto decide diversamente, segui il formatter.

---
