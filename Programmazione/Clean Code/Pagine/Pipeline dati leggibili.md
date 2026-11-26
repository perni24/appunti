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
  - data-pipeline
  - dati
aliases:
  - Pipeline dati leggibili
  - Readable data pipelines
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Parsing di input esterni]]"
  - "[[Programmazione/Clean Code/Pagine/Output strutturati]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione dei dati generati]]"
title: Pipeline dati leggibili
---

# Pipeline dati leggibili

## Sintesi

Una pipeline leggibile rende visibili due percorsi: **dove vanno i record accettati e dove finiscono quelli scartati**. Un errore nel prezzo di un prodotto non è la stessa cosa di un file con intestazione sconosciuta: nel primo caso puoi diagnosticare una riga; nel secondo non sai interpretare il lotto.

## Esempio: importare un listino senza pubblicarlo

Il modulo Python `catalog_pipeline.py` riceve uno stream testuale e usa `catalog_parse.py` dalla nota [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]]. Chi apre un file usa `encoding="utf-8", newline=""`. La pipeline non scrive: restituisce record validi nell'ordine di arrivo ed errori localizzati. È il chiamante a decidere se ammettere un import parziale.

```python
import csv
from catalog_parse import RowError, parse_product


def read_catalog(stream):
    reader = csv.reader(stream, strict=True)
    products, issues, seen = [], [], set()
    try:
        if next(reader, None) != ["sku", "price"]:
            raise ValueError("Intestazione attesa: sku,price")
        for fields in reader:
            try:
                product = parse_product(fields)
                if product["sku"] in seen:
                    raise RowError("sku", "duplicate_sku")
            except RowError as error:
                issues.append({"line": reader.line_num, "field": error.field, "code": error.code})
                continue
            seen.add(product["sku"])
            products.append(product)
    except csv.Error as error:
        raise ValueError(f"CSV illeggibile presso la linea {reader.line_num}") from error
    return products, issues
```

## Seguire un lotto a mano

| Linea fisica dopo l'intestazione in linea 1 | Esito |
| --- | --- |
| 2: `007,` | Prezzo assente: scarto. Lo SKU non viene impegnato |
| 3: `007,1.20` | Accettato a 120 centesimi |
| 4: `007,2.00` | SKU duplicato: resta valido il **primo record valido** |
| 5: `X,0` | Accettato a zero centesimi |

Un errore di quoting rilevato dal lettore interrompe invece il lotto senza restituire risultati parziali. `line_num` indica la linea fisica raggiunta **alla fine** del record, non il numero progressivo del prodotto: un campo CSV può contenere un ritorno a capo.

## Dal lotto al job

Per questo esempio dati e diagnosi stanno in memoria. Su un file grande puoi elaborare a blocchi, ma devi conservare la politica dei duplicati tra blocchi e decidere dove tenere gli scarti. Se il job promette «tutto o niente», non esportare ogni blocco direttamente nel risultato definitivo: usa uno staging o una transazione adatta. Conta record validi, scarti e motivo; non registrare per default l'intero record. Vedi [[Programmazione/Clean Code/Pagine/Script di automazione|Script di automazione]] per la politica di pubblicazione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Parsing di input esterni|Parsing di input esterni]]
- [[Programmazione/Clean Code/Pagine/Output strutturati|Output strutturati]]
- [[Programmazione/Clean Code/Pagine/Validazione dei dati generati|Validazione dei dati generati]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Martin Fowler, *Refactoring*
- Wes McKinney, *Python for Data Analysis*
- [Python 3.12: csv.reader, gestione delle eccezioni e line_num](https://docs.python.org/3.12/library/csv.html#reader-objects)
