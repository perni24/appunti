---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Dizionari]
prerequisites: []
related: []
---

# Dizionari in Python

## Sintesi

I dizionari sono collezioni mutabili di coppie chiave-valore. Sono ottimizzati per recuperare valori tramite chiavi hashable.

## Quando usarlo

Usa un dizionario per rappresentare record, configurazioni, lookup table, conteggi, mapping e dati JSON-like.

## Come funziona

Le chiavi devono essere hashable, quindi normalmente stringhe, numeri o tuple immutabili. I valori possono essere di qualsiasi tipo.

Da Python 3.7 l'ordine di inserimento e garantito.

## API / Sintassi

```python
user = {
    "id": 1,
    "email": "ada@example.com",
    "active": True,
}

email = user["email"]
phone = user.get("phone", "N/A")
user["active"] = False
```

Iterazione:

```python
for key, value in user.items():
    print(key, value)
```

## Esempio pratico

```python
users = [
    {"id": 1, "email": "a@example.com"},
    {"id": 2, "email": "b@example.com"},
]

users_by_id = {user["id"]: user for user in users}
selected = users_by_id.get(2)
```

## Varianti

- Dizionario letterale: `{}`.
- `dict()`.
- `defaultdict`.
- `Counter`.
- Dizionari annidati.
- Dictionary comprehension.

## Errori comuni

- Accedere con `dict[key]` quando la chiave puo mancare.
- Usare chiavi mutabili come liste.
- Modificare un dizionario durante iterazione sulle chiavi.
- Confondere copia superficiale e profonda.
- Usare dizionari troppo annidati senza struttura.

## Checklist

- Le chiavi sono stabili e hashable?
- Usi `.get()` quando la chiave e opzionale?
- Il dizionario rappresenta davvero un mapping?
- Serve una dataclass o modello tipizzato?
- La copia deve essere superficiale o profonda?

## Collegamenti

- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
