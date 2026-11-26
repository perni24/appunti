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
  - parsing
  - input-esterni
aliases:
  - Parsing di input esterni
  - External input parsing
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Pipeline dati leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione input API]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Parsing di input esterni
---

# Parsing di input esterni

## Sintesi

Un parser non dovrebbe «indovinare» cosa intendeva la sorgente. Se il contratto dice che il prezzo arriva come testo decimale con il punto, `""` non significa zero e `"1,20"` non può diventare `1.20` in silenzio. In JavaScript persino `Number("")` dà zero: controllare soltanto il risultato della conversione perde la distinzione tra campo assente e prezzo gratuito.

## Esempio: una riga di listino

Il file ha intestazione `sku,price`. La libreria CSV separa i campi; questo modulo Python 3.12, `catalog_parse.py`, interpreta **un record già separato**. Lo SKU è una stringa opaca di 1–24 caratteri ASCII tra maiuscole, cifre e trattino. La valuta è EUR per tutto il file; il prezzo ha da una a sei cifre intere, senza zeri iniziali salvo lo zero stesso, e zero oppure due cifre decimali dopo il punto.

```python
import re


class RowError(ValueError):
    def __init__(self, field, code):
        super().__init__(code)
        self.field = field
        self.code = code


def parse_product(fields):
    if len(fields) != 2:
        raise RowError("record", "field_count")
    sku, price = fields
    if not re.fullmatch(r"[A-Z0-9-]{1,24}", sku):
        raise RowError("sku", "invalid_sku")
    match = re.fullmatch(r"(0|[1-9][0-9]{0,5})(?:\.([0-9]{2}))?", price)
    if not match:
        raise RowError("price", "invalid_price")
    whole, fraction = match.groups()
    return {"sku": sku, "price_cents": int(whole) * 100 + int(fraction or "0")}
```

`["007", "0.09"]` diventa `{"sku": "007", "price_cents": 9}`. Lo zero iniziale dello SKU resta significativo; `"0"` è un prezzo valido; `""`, `"1.2"`, `"-1"` e `"1e2"` non seguono il formato. La conversione avviene **dopo** il controllo sull'intera stringa e non passa da un numero in virgola mobile.

## Dove segnalare l'errore

Il parser conosce campo e motivo, ma non percorso o posizione nel file: li aggiunge la [[Programmazione/Clean Code/Pagine/Pipeline dati leggibili|pipeline che legge il CSV]]. Non dividere il testo con `split(",")`: una virgola tra virgolette appartiene allo stesso campo, che può poi risultare non valido **come prezzo**. Cambiare separatore decimale, valuta o regola di arrotondamento richiede una scelta esplicita sul contratto, non una correzione automatica dei dati.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Pipeline dati leggibili|Pipeline dati leggibili]]
- [[Programmazione/Clean Code/Pagine/Validazione input API|Validazione input API]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Microsoft, *REST API Guidelines*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- [Python 3.12: lettura CSV e dialetti](https://docs.python.org/3.12/library/csv.html)
- [Python 3.12: re.fullmatch](https://docs.python.org/3.12/library/re.html#re.fullmatch)
