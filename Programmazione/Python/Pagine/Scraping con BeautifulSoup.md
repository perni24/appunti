---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - scraping
  - beautifulsoup
aliases:
  - BeautifulSoup
  - Web scraping Python
prerequisites: []
related: []
title: Scraping con BeautifulSoup
---

# Scraping con BeautifulSoup

## Obiettivo

Estrarre dati da HTML gia disponibile o scaricato, mantenendo separati **download**, **parsing** e **validazione del risultato**. BeautifulSoup non e un client HTTP e non esegue JavaScript: analizza il documento ricevuto, non il DOM aggiornato di una scheda del browser.

Qui il risultato e un titolo facoltativo e una lista di link. Gli esempi non visitano i link estratti e non costituiscono un crawler.

## Quando usarlo

- Recuperare testo, attributi, liste e tabelle da HTML statico.
- Ripulire markup per un'esportazione, senza confondere estrazione di testo e sanitizzazione HTML.
- Esaminare una copia locale della pagina quando non esiste una API adatta.
- Prototipare un estrattore da trasformare poi in una procedura monitorata.

Prima preferisci una API documentata o un export. Se i dati arrivano via JavaScript, controlla se esiste un endpoint autorizzato: un browser automatizzato serve solo quando e necessaria l'esecuzione della pagina.

## Prerequisiti

Esempi verificati con **CPython 3.12.10, beautifulsoup4 4.15.0, SoupSieve 3.0.4 e Requests 2.34.2 su Windows**. I pin riproducono la baseline, non sono un lock completo.

In un ambiente virtuale attivo:

```sh
python -m pip install "beautifulsoup4==4.15.0" "soupsieve==3.0.4" "requests==2.34.2"
```

Il pacchetto si chiama `beautifulsoup4`, l'import `bs4`. `html.parser` e incluso in Python. `lxml` e `html5lib` richiedono dipendenze aggiuntive; XML richiede un parser XML, non semplicemente un selettore diverso. Parser diversi possono ricostruire HTML malformato in modo diverso. [Parser BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/#specifying-the-parser-to-use).

## Procedura

1. Definisci quali campi servono e cosa significa un campo mancante.
2. Verifica permessi, termini del sito, dati personali e politica di accesso; non aggirare autenticazione o blocchi.
3. Conserva una piccola fixture HTML non sensibile per provare l'estrazione senza rete.
4. Scegli selettori legati al significato dei dati, evitando lunghe catene di classi di presentazione.
5. Controlla status, tipo e dimensione del documento prima del parsing.
6. Valida il risultato: zero elementi puo significare pagina vuota, login, blocco o markup cambiato.
7. Solo per accessi ripetuti aggiungi limiti di frequenza/concorrenza, cache, log e gestione dei tentativi.

`robots.txt` esprime regole per i crawler, **non concede un'autorizzazione generale** e non sostituisce i controlli di accesso. Lo snippet non lo consulta automaticamente: la verifica e un prerequisito. [RFC 9309](https://datatracker.ietf.org/doc/html/rfc9309#section-1).

## Snippet

### Selettori e valori mancanti

| Operazione                          | Risultato da gestire                          |
| ----------------------------------- | --------------------------------------------- |
| `soup.select_one("h1")`             | Un elemento oppure `None`                     |
| `soup.select("a[href]")`            | Lista, anche vuota                            |
| `soup.find("h1")`                   | Ricerca per tag/filtri, anch'essa facoltativa |
| `element.get("href")`               | Attributo oppure `None`                       |
| `element.get_text(" ", strip=True)` | Testo dei discendenti separato da spazi       |

Controlla `None` prima di usare il nodo. Il separatore evita di ottenere `GuidaPython` da due nodi distinti; puo pero introdurre spazi non desiderati in altri documenti. La politica sul testo va verificata su esempi reali. [Ricerca ed estrazione](https://www.crummy.com/software/BeautifulSoup/bs4/doc/#searching-the-tree).

### extract_page.py

Modulo autonomo: eseguito direttamente usa solo HTML sintetico, senza richieste HTTP.

```python
import json
from urllib.parse import urldefrag, urljoin, urlsplit

from bs4 import BeautifulSoup


def web_url(value):
    parts = urlsplit(value)
    if (
        parts.scheme not in {"http", "https"}
        or not parts.hostname
        or parts.username is not None
        or parts.password is not None
        or any(char.isspace() for char in value)
    ):
        raise ValueError("Expected an absolute HTTP(S) URL without credentials")
    if parts.port == 0:
        raise ValueError("Invalid port")
    return urldefrag(value).url


def extract_page(html, page_url, *, encoding=None):
    base_url = web_url(page_url)
    soup = BeautifulSoup(html, "html.parser", from_encoding=encoding)

    base = soup.select_one("base[href]")
    if base is not None:
        base_url = web_url(urljoin(base_url, base["href"]))

    heading = soup.select_one("h1")
    title = heading.get_text(" ", strip=True) if heading is not None else None
    links = []
    seen = set()

    for anchor in soup.select("a[href]"):
        href = anchor.get("href", "").strip()
        if not href or href.startswith("#"):
            continue
        try:
            url = web_url(urljoin(base_url, href))
        except ValueError:
            continue
        if url in seen:
            continue
        seen.add(url)
        links.append({
            "text": anchor.get_text(" ", strip=True),
            "url": url,
        })

    return {"title": title, "links": links}


if __name__ == "__main__":
    html = b"""
    <meta charset="utf-8">
    <h1>Guida <em>Python</em></h1>
    <a href="../intro#start">Introduzione</a>
    <a href="../intro#other">Duplicato</a>
    <a href="https://docs.python.org/3/">Documentazione</a>
    <a href="mailto:help@example.org">Email</a>
    <a>Senza attributo</a>
    """
    result = extract_page(html, "https://example.org/guide/page")
    print(json.dumps(result, ensure_ascii=False, indent=2))
```

Esecuzione offline:

```sh
python extract_page.py
```

Risultato: titolo `Guida Python`, due link distinti verso `https://example.org/intro` e la documentazione Python.

**Politiche del demo:**

- Titolo assente: `None`; titolo presente ma vuoto: stringa vuota.
- Link senza testo: conservato con `text: ""`; eventuale `aria-label` richiede una regola aggiuntiva.
- Frammenti rimossi e duplicati eliminati conservando il primo testo; query string conservata.
- `mailto:`, `javascript:`, link vuoti e riferimenti alla sola sezione scartati.
- Primo `<base href>` applicato; base non valida: errore, senza indovinare una destinazione.
- Link esterni HTTP(S) conservati come dati: **non scaricati**.

`urljoin()` puo sostituire l'host con quello di un URL assoluto o di `//altro-host/`. `urlsplit()` non e un validatore completo. `web_url()` e un filtro didattico, **non una protezione SSRF**: non blocca reti private, DNS rebinding o tutte le forme ambigue. Non esporre questo downloader come servizio che accetta URL arbitrari. [Parsing e combinazione degli URL](https://docs.python.org/3.12/library/urllib.parse.html#urllib.parse.urljoin).

### fetch_page.py

Nella stessa directory di `extract_page.py`. Effettua **una GET** a un URL scelto e verificato dall'operatore; redirect e retry automatici non sono abilitati. Il limite e di 1 MiB di body decodificato dal trasporto.

```python
import argparse
import json
from email.message import Message

import requests

from extract_page import extract_page, web_url


def fetch_page(session, url, *, max_bytes=1_048_576):
    if type(max_bytes) is not int or max_bytes <= 0:
        raise ValueError("max_bytes must be a positive integer")
    url = web_url(url)

    with session.get(
        url,
        timeout=(3.05, 10),
        allow_redirects=False,
        stream=True,
    ) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError(f"Expected HTTP 200, got {response.status_code}")

        content_type = Message()
        content_type["content-type"] = response.headers.get("Content-Type", "")
        if content_type.get_content_type() != "text/html":
            raise ValueError("Expected Content-Type: text/html")

        body = bytearray()
        for chunk in response.iter_content(chunk_size=16_384):
            if len(body) + len(chunk) > max_bytes:
                raise ValueError("HTML body too large")
            body.extend(chunk)

        return extract_page(
            bytes(body),
            response.url,
            encoding=content_type.get_content_charset(),
        )


def main():
    parser = argparse.ArgumentParser(description="Extract one HTML page")
    parser.add_argument("url")
    args = parser.parse_args()

    try:
        with requests.Session() as session:
            session.headers["User-Agent"] = "NotesExtractionDemo/1.0"
            result = fetch_page(session, args.url)
    except (requests.RequestException, ValueError) as exc:
        parser.exit(1, f"Extraction failed: {type(exc).__name__}\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

Comando di sola consultazione, senza rete:

```sh
python fetch_page.py --help
```

Per eseguire la GET, passa un URL autorizzato come argomento. Non e necessario chiamare siti reali per provare `extract_page()`.

### Cosa controlla il download

- `raise_for_status()` intercetta 4xx/5xx, non i redirect. Il controllo separato su `200` esclude 3xx e risposte senza documento come `204`.
- Il timeout distingue connessione e lettura: **non e una durata massima dell'intera operazione**.
- `iter_content()` permette di controllare la dimensione durante lo streaming. Il limite non garantisce un tetto assoluto alla memoria del parser o del decompressore.
- `with` chiude risposta e sessione anche in caso di errore. I byte permettono al parser di usare charset dichiarato e informazioni del documento; un encoding sbagliato puo comunque produrre testo errato.
- Lo snippet non inserisce pause, retry, cache o verifica automatica di `robots.txt`; per una singola richiesta non simula un crawler completo.

Riferimenti: [errori e timeout Requests](https://requests.readthedocs.io/en/latest/user/quickstart/#errors-and-exceptions), [streaming e sessioni](https://requests.readthedocs.io/en/latest/user/advanced/#body-content-workflow).

## Adattamenti comuni

- **Piu pagine:** riusa una sessione, limita richieste e concorrenza, registra esiti e rispetta le indicazioni del server. Un `429` non va risolto con tentativi immediati senza limite.
- **Paginazione:** definisci un massimo di pagine e un insieme di URL gia visitati; verifica ogni nuova destinazione, inclusi i redirect.
- **Campi obbligatori:** solleva un errore se mancano, invece di produrre righe apparentemente valide.
- **Tabelle:** valuta `pandas.read_html()` con le dipendenze richieste, controllando intestazioni e tipi; non equivale alla validazione dei dati.
- **HTML dinamico:** usa l'endpoint consentito o browser automation; prima prova se il documento scaricato contiene gia i dati.
- **Export:** JSON conserva `null` per un titolo assente; CSV richiede schema, encoding e una politica per le celle interpretabili come formule.
- **XML:** usa un parser dedicato e valuta separatamente i rischi di documenti non fidati; il demo e soltanto HTML.

## Debug rapido

- `AttributeError` su `get_text`: il selettore non ha trovato il nodo.
- Lista vuota: controlla HTML ricevuto, status e pagina di login/blocco; non solo il selettore nel browser.
- Testo unito o accenti errati: controlla separatore, byte originali e charset.
- Link inattesi: verifica URL della pagina, `<base>`, URL assoluti e protocol-relative.
- Risultati diversi tra macchine: allinea parser e versioni, poi confronta la stessa fixture.
- Cambiamento del sito: fai fallire esplicitamente i requisiti obbligatori, conserva una fixture aggiornata senza credenziali o dati privati.

## Checklist finale

- API/export valutati e accesso verificato?
- Download separato dal parser e provato anche senza rete?
- Campi assenti, duplicati e URL relativi coperti?
- Status, tipo, timeout e dimensione controllati?
- Destinazioni e frequenza controllate prima di estendere il demo?
- Nessun dato sensibile negli HTML di prova, nei log o nel repository?
- Output validato invece di assumere che una lista vuota sia un successo?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Automazione file e script|Automazione file e script]]
- [[Programmazione/Python/Pagine/pandas|pandas]]
