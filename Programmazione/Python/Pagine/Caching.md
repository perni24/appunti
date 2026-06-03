---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, performance]
aliases: [Memoization, Cache]
prerequisites: []
related: []
---

# Caching in Python

## Sintesi

Il caching salva risultati gia calcolati per evitare lavoro ripetuto. In Python si usa spesso per funzioni costose, dati letti da fonti lente o proprieta calcolate una sola volta.

Una cache migliora prestazioni e latenza, ma introduce rischi: dati obsoleti, consumo di memoria, chiavi sbagliate e invalidazione difficile.

## Quando usarlo

Usa caching quando:

- una funzione pura viene chiamata spesso con gli stessi argomenti;
- il calcolo e costoso rispetto al costo di recuperare il valore dalla cache;
- la fonte dati e lenta, come rete, disco o database;
- il risultato puo restare valido per un certo periodo;
- vuoi evitare chiamate ripetute dentro un algoritmo ricorsivo.

Evitalo quando il risultato cambia spesso, ha side effect o dipende da stato esterno non rappresentato nella chiave.

## Come funziona

Una cache associa una chiave a un valore. Quando arriva una richiesta:

1. si costruisce la cache key;
2. si controlla se il valore esiste gia;
3. se esiste, lo si restituisce;
4. se manca, lo si calcola e lo si salva.

Con `functools.lru_cache`:

```python
from functools import lru_cache


@lru_cache(maxsize=128)
def fib(number):
    if number < 2:
        return number
    return fib(number - 1) + fib(number - 2)
```

`maxsize` limita il numero di risultati mantenuti. Quando la cache e piena, vengono rimossi i valori usati meno di recente.

## API / Sintassi

`lru_cache`:

```python
from functools import lru_cache


@lru_cache(maxsize=512)
def normalize_country(code):
    return code.strip().upper()


normalize_country(" it ")
print(normalize_country.cache_info())
normalize_country.cache_clear()
```

`cache` e una scorciatoia per cache non limitata:

```python
from functools import cache


@cache
def parse_schema(name):
    return f"schema:{name}"
```

`cached_property` calcola una proprieta una volta per istanza.

```python
from functools import cached_property


class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property
    def total(self):
        return sum(self.rows)
```

## Esempio pratico

Caching di una funzione pura usata molte volte.

```python
from functools import lru_cache


@lru_cache(maxsize=1024)
def load_permission(user_role):
    print("calcolo permessi")
    permissions = {
        "admin": {"read", "write", "delete"},
        "editor": {"read", "write"},
        "viewer": {"read"},
    }
    return permissions.get(user_role, set())


print(load_permission("admin"))
print(load_permission("admin"))  # usa la cache
```

La seconda chiamata non ricalcola il risultato.

## Varianti

- **Memoization**: caching di risultati di funzione.
- **LRU cache**: mantiene solo i valori usati piu di recente.
- **Cache non limitata**: utile solo quando il numero di chiavi e prevedibile.
- **`cached_property`**: cache per proprieta di istanza.
- **Cache distribuita**: Redis o sistemi simili, quando piu processi devono condividere dati.
- **Cache HTTP**: usa header e regole specifiche del protocollo.

## Errori comuni

- Usare argomenti mutabili o non hashable con `lru_cache`.
- Mettere in cache funzioni con side effect.
- Usare cache non limitate in processi lunghi.
- Non prevedere invalidazione per dati che cambiano.
- Dimenticare che la cache in memoria e locale al processo.
- Usare una chiave che non include tutti i fattori che cambiano il risultato.

## Checklist

- La funzione e pura o quasi pura?
- Gli argomenti sono hashable e rappresentano davvero la cache key?
- `maxsize` e impostato in modo ragionevole?
- Esiste un modo per svuotare o invalidare la cache?
- Il dato puo diventare stale?
- La cache e locale al processo o deve essere condivisa?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Profiling]]
- [[Funzioni]]
- [[Proprietà]]
- [[Standard Library]]
- [[Memory Management]]
