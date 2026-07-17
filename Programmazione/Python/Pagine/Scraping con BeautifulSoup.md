---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, scraping, beautifulsoup]
aliases: [BeautifulSoup, Web scraping Python]
prerequisites: []
related: []
---

# Scraping con BeautifulSoup

## Sintesi

BeautifulSoup analizza HTML e XML, permettendo di estrarre dati da pagine web. E adatto a HTML statico o gia scaricato, non a siti dove il contenuto viene generato interamente da JavaScript.

Lo scraping va fatto rispettando termini d'uso, robots.txt, limiti di traffico e privacy.

## Quando usarlo

Usa BeautifulSoup quando:

- devi estrarre dati da HTML statico;
- devi pulire markup;
- devi leggere tabelle o liste semplici;
- una API ufficiale non esiste;
- vuoi prototipare estrazione dati.

Se la pagina e dinamica o richiede interazione, puo servire browser automation.

## Come funziona

Scarichi HTML con un client HTTP e poi lo analizzi con BeautifulSoup.

```python
import requests
from bs4 import BeautifulSoup

response = requests.get("https://example.com", timeout=5)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")
title = soup.select_one("h1").get_text(strip=True)
```

I selettori CSS sono spesso il modo piu pratico per trovare elementi.

## API / Sintassi

Creare parser:

```python
soup = BeautifulSoup(html, "html.parser")
```

Selezionare un elemento:

```python
title = soup.select_one("h1")
```

Selezionare piu elementi:

```python
links = soup.select("a")
```

Estrarre testo e attributi:

```python
text = title.get_text(strip=True)
href = links[0].get("href")
```

## Esempio pratico

Estrarre link da una pagina:

```python
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


def extract_links(url):
    response = requests.get(url, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    links = []

    for anchor in soup.select("a[href]"):
        href = anchor.get("href")
        links.append(urljoin(url, href))

    return links
```

Procedura consigliata:

1. verifica se esiste una API ufficiale;
2. controlla termini d'uso e limiti;
3. scarica poche pagine di test;
4. scrivi parser robusto;
5. aggiungi timeout, rate limit e logging;
6. salva dati in formato pulito.

## Varianti

- **HTML statico**: BeautifulSoup e sufficiente.
- **Parsing XML**: possibile con parser adeguato.
- **Scraping + requests/HTTPX**: scaricamento HTTP.
- **Scraping dinamico**: richiede browser automation.
- **Parsing tabelle**: talvolta pandas puo leggere direttamente tabelle HTML.
- **Crawler**: richiede gestione link, code, rate limit e deduplicazione.

## Errori comuni

- Non rispettare robots.txt, termini d'uso o limiti di traffico.
- Non impostare timeout.
- Non gestire errori HTTP.
- Scrivere parser troppo dipendenti da markup fragile.
- Non gestire pagine mancanti o elementi assenti.
- Fare troppe richieste troppo rapidamente.
- Non normalizzare URL relativi.

## Checklist

- Esiste una API ufficiale?
- Lo scraping e permesso?
- Timeout e rate limit sono impostati?
- Gli errori HTTP sono gestiti?
- I selettori sono abbastanza robusti?
- Il parser gestisce elementi mancanti?
- I dati estratti vengono validati?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[HTTPX e requests]]
- [[Gestione File]]
- [[Automazione file e script]]
- [[pandas]]
