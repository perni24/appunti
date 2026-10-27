---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - performance
aliases:
  - Memoization
  - Cache
prerequisites: []
related: []
title: Caching in Python
---

# Caching in Python

## Sintesi

Una cache conserva risultati per evitare lavoro ripetuto. Ogni hit restituisce un risultato gia prodotto: la correttezza dipende quindi dalla **chiave**, dalla durata di validita e dalla possibilita di riutilizzare quel valore.

Caching significa scambiare memoria e complessita di coerenza con meno calcolo o I/O. Non e automaticamente vantaggioso: misura frequenza degli hit, dimensioni e costo del calcolo.

Baseline: **CPython 3.12.10**; l'esempio TTL opzionale usa **cachetools 7.2.4**. Gli altri esempi usano solo la standard library.

## Quando usarlo

- Funzioni deterministiche chiamate ripetutamente con gli stessi input.
- Risultati immutabili e costosi da calcolare.
- Letture con una politica esplicita di scadenza o versione.
- Proprietà su stato stabile, oppure con invalidazione controllata.

Evita il caching diretto di funzioni con effetti collaterali, generatori o coroutine: memorizzeresti l'oggetto ritornato, non una nuova esecuzione ogni volta. Una coroutine gia attesa non e normalmente riutilizzabile; un generatore conserva lo stato di consumo.

## Come funziona

### LRU, hit e miss osservabili

```python
from functools import lru_cache

calls = []


@lru_cache(maxsize=2)
def square(value):
    calls.append(value)
    return value * value


for value in (1, 2, 1, 3, 2):
    square(value)
info = square.cache_info()
print(calls)  # [1, 2, 3, 2]
print(info)   # hits=1, misses=4, maxsize=2, currsize=2
square.cache_clear()
```

La sequenza tocca di nuovo 1 prima di inserire 3: 2 diventa il meno usato di recente e viene espulso. Il log delle chiamate serve solo a rendere visibili i miss; non e un effetto applicativo su cui fare affidamento.

maxsize conta gli elementi, non i byte. Argomenti e risultati restano referenziati finche vengono espulsi o svuotati; una cache piccola puo comunque trattenere oggetti grandi. `cache_clear` svuota e azzera le statistiche. `__wrapped__` richiama la funzione originale senza usare quella cache.

## API / Sintassi

### Validare prima della memoization

Il wrapper controlla anche le chiamate che potrebbero diventare hit. Il helper privato riceve soltanto interi non negativi.

```python
from functools import lru_cache


@lru_cache(maxsize=128)
def _fib(number):
    if number < 2:
        return number
    return _fib(number - 1) + _fib(number - 2)


def fib(number):
    if type(number) is not int or number < 0:
        raise ValueError("atteso un intero non negativo")
    return _fib(number)


print(fib(30))  # 832040
print(_fib.cache_info())
```

La cache riduce il ricalcolo, non la profondita ricorsiva: per input molto grandi valuta un algoritmo iterativo. Il helper non e un'API pubblica validata; chiamarlo direttamente con input arbitrari viola il contratto.

Gli argomenti devono essere hashable. `typed=True` distingue i tipi degli argomenti immediati, non analizza ricorsivamente il contenuto degli oggetti. Non usare il comportamento di equivalenza delle chiavi come validatore.

### Canonicalizzare la chiave

```python
from functools import lru_cache


@lru_cache(maxsize=32)
def _country_label(code):
    return {"IT": "Italia", "FR": "Francia"}.get(code, "Sconosciuto")


def country_label(code):
    if not isinstance(code, str):
        raise TypeError("code deve essere una stringa")
    return _country_label(code.strip().upper())


print(country_label(" it "), country_label("IT"))  # Italia Italia
print(_country_label.cache_info())  # un miss e un hit
```

Il calcolo del demo e troppo economico per giustificare una cache reale: mostra soltanto il punto in cui normalizzare. Le due forme entrano con la stessa chiave canonica. Non normalizzare indiscriminatamente URL, identificatori case-sensitive o parametri che hanno significati diversi.

Chiamate con keyword in ordine diverso possono creare voci separate; anche forma posizionale e keyword non vanno considerate automaticamente una chiave canonica. Se serve questa proprieta, costruiscila nel wrapper.

`functools.cache` equivale a una LRU senza limite: adatta solo se sai governare crescita e durata delle chiavi. Non fornisce TTL.

## Esempio pratico

### Non restituire un set condiviso modificabile

Una cache ritorna lo stesso oggetto trattenuto, non una copia. Il demo usa frozenset e rifiuta ruoli sconosciuti. E una tabella didattica statica, **non un sistema di autorizzazione**.

```python
from functools import lru_cache

POLICY = {
    "admin": frozenset({"read", "write", "delete"}),
    "editor": frozenset({"read", "write"}),
    "viewer": frozenset({"read"}),
}


@lru_cache(maxsize=3)
def permissions_for_role(role):
    if role not in POLICY:
        raise ValueError("ruolo sconosciuto")
    return POLICY[role]


first = permissions_for_role("viewer")
second = permissions_for_role("viewer")
print(first is second, sorted(first))  # True ['read']
local_copy = set(first)
local_copy.add("write")
print(sorted(permissions_for_role("viewer")))  # ['read']
```

Con un set mutabile, un chiamante potrebbe modificare il valore visto dai successivi. L'immutabilita qui risolve solo l'aliasing: non risolve aggiornamenti della policy o revoche.

In un sistema reale la chiave deve rappresentare contesto e versione rilevanti, per esempio tenant, identita, risorsa e revisione della policy. Una cache di permessi non deve diventare un modo per ignorare revoche o separazione fra utenti. Un valore scaduto non e accettabile solo perche velocizza una richiesta.

### TTL con cachetools

Dipendenza opzionale:

```powershell
python -m pip install "cachetools==7.2.4"
```

Il clock iniettato rende la scadenza dimostrabile senza aspettare o usare sleep.

```python
from cachetools import TTLCache


class Clock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now


clock = Clock()
cache = TTLCache(maxsize=2, ttl=10, timer=clock)
cache["report"] = ("revision-1", 42)
print(cache["report"])
clock.now = 10.0
print("report" in cache)  # False
expired = list(cache.expire())
print(expired)  # [('report', ('revision-1', 42))]
```

In uso normale TTLCache usa un timer monotono. La scadenza rende una voce inaccessibile, ma il rilascio fisico puo essere differito fino a una mutazione o expire. Il limite predefinito conta le voci; anche una stima personalizzata della dimensione ha limiti sui dati mutabili.

Le cache di cachetools non sono automaticamente thread-safe: proteggi gli accessi condivisi. TTL non significa che la fonte non cambi prima della scadenza, ne che sia stata aggiornata all'istante dell'hit.

## Varianti

- `cached_property` conserva il risultato nell'istanza; modifica e invalidazione sono spiegate in Proprieta. Da Python 3.12 non fornisce il precedente lock interno.
- Una cache in memoria e locale al processo: altri worker non la invalidano.
- Una cache distribuita richiede gestione di rete, serializzazione, timeout e coerenza.
- La cache HTTP segue regole proprie di validazione e freshness, non soltanto una mappa Python.

La struttura di lru_cache e thread-safe, ma due miss concorrenti della stessa chiave possono eseguire due volte il calcolo. Non e "exactly once" o single-flight. Anche cache_clear concorrente con un calcolo non e una barriera transazionale: possono arrivare nuovi risultati dopo l'invalidazione.

Le eccezioni non diventano risultati memorizzati di lru_cache. Se aggiungi negative caching, scegli quali errori e per quanto: una indisponibilita temporanea non equivale a un oggetto inesistente.

## Errori comuni

- Omettere dalla chiave lingua, tenant, versione o altro stato significativo.
- Restituire liste, dict o set che i chiamanti possono modificare.
- Usare una cache illimitata senza conoscere il numero di chiavi.
- Scambiare thread-safe per un solo calcolo per chiave.
- Confondere scadenza, espulsione per capacita e invalidazione.
- Aggiungere cache a un micro-calcolo senza misurarne il costo.
- Dimenticare che self nella chiave di un metodo puo trattenere l'istanza.

## Checklist

- Quale cambiamento rende il valore obsoleto?
- La chiave rappresenta tutti gli input rilevanti?
- Il risultato e immutabile o copiato al confine corretto?
- Sono limitati memoria, durata e numero di chiavi?
- I miss simultanei sono tollerabili?
- Testo separatamente cache calda, fredda e invalidata?
- Errori, revoche e dati privati rispettano il contratto applicativo?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Proprietà|Proprieta e cached_property]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Threading|Threading]]

## Fonti

- [Python 3.12: functools e contratti delle cache](https://docs.python.org/3.12/library/functools.html).
- [Python 3.12: hashability](https://docs.python.org/3.12/glossary.html#term-hashable).
- [cachetools: TTL, espulsione e sincronizzazione](https://cachetools.readthedocs.io/en/stable/).
