---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - tooling
  - static-analysis
aliases:
  - Static analysis
  - Analisi statica
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Linter]]"
  - "[[Programmazione/Clean Code/Pagine/Type checking]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
  - "[[Programmazione/Clean Code/Pagine/Complessita ciclomatica]]"
  - "[[Programmazione/Clean Code/Pagine/Complessita cognitiva]]"
title: Static analysis
---

# Static analysis

## Sintesi

L'analisi statica ricava informazioni dal programma **senza eseguire il codice analizzato**. Anche linting e controllo dei tipi ne sono forme. Per valutare un risultato, chiediti quali file sono stati letti, quali costrutti riconosce l'analizzatore e quale regola sta verificando.

## Esempio: controllare un confine architetturale

Supponiamo che nel dominio gli import diretti del modulo standard `sqlite3` debbano stare solo nell'adattatore di persistenza. Una ricerca testuale troverebbe anche commenti e stringhe; l'albero sintattico di Python distingue un'importazione da una spiegazione.

```python
import ast


def direct_sqlite_imports(source):
    findings = []
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            names = [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom) and node.level == 0:
            names = [node.module or ""]
        else:
            continue
        if any(name.split(".")[0] == "sqlite3" for name in names):
            findings.append(node.lineno)
    return sorted(findings)
```

Per `import sqlite3 as db` e `from sqlite3 import connect` il controllo restituisce il numero di riga. Una stringa che descrive `"import sqlite3"` non è una violazione. La funzione analizza solo il sorgente ricevuto: spetta al chiamante selezionare i moduli del dominio, non l'intero repository. Un errore di sintassi impedisce l'analisi e va riportato, non tradotto in «zero problemi».

## Come leggere un report

Il controllo vede anche un import dentro un ramo non eseguito: per un divieto **sintattico** è corretto, non dimostra che sia stata aperta una connessione. Non segue import transitivi o dinamici e non risolve quale modulo sia effettivamente installato. Un esito vuoto significa «nessun import diretto riconosciuto», non «il dominio non accede mai al database».

Strumenti più ampi possono seguire flussi di dati, misurare complessità o costruire grafi di dipendenze. Il controllo di vulnerabilità **note nelle versioni dei pacchetti** richiede invece anche inventario e dati sugli avvisi: non si ottiene dal solo AST. Per un progetto legacy distingui nuove violazioni da quelle note e motiva le eccezioni con un responsabile e una condizione di rimozione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Linter|Linter]]
- [[Programmazione/Clean Code/Pagine/Type checking|Type checking]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]
- [[Programmazione/Clean Code/Pagine/Complessita ciclomatica|Complessita ciclomatica]]
- [[Programmazione/Clean Code/Pagine/Complessita cognitiva|Complessita cognitiva]]

## Fonti

- SonarSource Documentation
- CodeQL Documentation
- OWASP, *Static Application Security Testing*
- [Python 3.12: ast.parse, ast.walk e nodi Import/ImportFrom](https://docs.python.org/3.12/library/ast.html)
