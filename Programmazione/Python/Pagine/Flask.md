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
  - web
  - flask
aliases: []
prerequisites: []
related: []
---

# Flask

## Sintesi

**Flask** e un micro-framework web Python. Offre routing, request/response, template e integrazione con estensioni, lasciando molte scelte architetturali allo sviluppatore.

## Quando usarlo

- API piccole.
- Prototipi.
- Applicazioni web semplici.
- Progetti che richiedono molta flessibilita.

## Come funziona

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Esempio
```python
from flask import Flask

app = Flask(__name__)

@app.get("/")
def home():
    return {"status": "ok"}
```

## Varianti

### Limiti
Per applicazioni grandi serve definire convenzioni su configurazione, validazione, database, autenticazione e struttura progetto.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]
