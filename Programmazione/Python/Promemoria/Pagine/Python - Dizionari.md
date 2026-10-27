---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - dizionari
aliases:
  - Cheatsheet dizionari Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Dizionari]]"
title: Python - Dizionari
---

# Python - Dizionari

## Obiettivo

Promemoria per mapping chiave-valore: accesso, aggiornamento, iterazione, raggruppamenti e copie. La teoria completa e nei collegamenti.

## Quando usarlo

Per associare chiavi hashable a valori. Il `dict` mantiene l'ordine di inserimento, non ordina le chiavi e non valida i dati.

## Procedura

1. Decidi come trattare chiavi assenti e valori `None`.
2. Scegli fra mutazione, copia e fusione.
3. Verifica ordine, duplicati e condivisione degli oggetti contenuti.

Ogni blocco e autonomo. Baseline delle prove: **CPython 3.12.10**. Gli operatori `|` e `|=` richiedono Python 3.9+.

## Snippet

### Accesso e presenza

```python
user = {"id": 1, "name": "Ada", "active": True, "phone": None}

print(user["name"])                   # Ada
print(user.get("role", "user"))       # user
print(user.get("phone", "unknown"))   # None
print("name" in user, "role" not in user, len(user))  # True True 4
```

`d[key]` genera `KeyError` se manca la chiave. `get` non inserisce valori: il default vale solo per chiavi assenti, non per `None` o altri valori falsy. `in` cerca fra le chiavi.

### Distinguere assenza da None

```python
user = {"phone": None}
missing = object()
phone = user.get("phone", missing)

if phone is missing:
    result = "absent"
elif phone is None:
    result = "not provided"
else:
    result = phone
print(result)  # not provided
```

Una sentinella distinta permette di conservare il significato di `None`. Se serve solo la presenza, basta `"phone" in user`.

### Inserire e aggiornare

```python
user = {"name": "Ada", "active": True}
user["role"] = "admin"
result = user.update({"active": False, "city": "Roma"})

print(user["active"], user["role"], result)  # False admin None
print(list(user))  # ['name', 'active', 'role', 'city']
```

`update` modifica il ricevente. Sovrascrivere una chiave non la sposta; eliminarla e reinserirla la porta in fondo.

### Unire dizionari

```python
defaults = {"timeout": 10, "headers": {"Accept": "application/json"}}
overrides = {"timeout": 5, "headers": {"X-Client": "demo"}}
settings = defaults | overrides

print(defaults["timeout"], settings["timeout"])  # 10 5
print(settings["headers"])                      # {'X-Client': 'demo'}
defaults |= overrides
print(defaults == settings)                     # True
```

Sui duplicati vince destra. `|` crea un nuovo dict; `|=` aggiorna quello esistente. Fusione superficiale: non combina ricorsivamente `headers` e ne condivide il valore con `overrides`.

### Rimuovere elementi

```python
user = {"name": "Ada", "active": True, "role": "admin"}
role = user.pop("role", None)
key, value = user.popitem()
del user["name"]

print(role, key, value, user)  # admin active True {}
```

`pop(key, default)` tollera l'assenza; `pop` senza default e `del` generano `KeyError` se manca la chiave. `popitem` estrae l'ultima coppia **inserita**, non l'ultima aggiornata; dict vuoto: `KeyError`.

### Iterare su chiavi e coppie

```python
user = {"id": 1, "name": "Ada"}
for key in user:
    print(key)  # id, poi name, su righe separate

for key, value in user.items():
    print(key, value)  # 1a riga: id 1; 2a riga: name Ada
```

Non aggiungere o eliminare chiavi mentre iteri sul dict o sulle sue viste: puoi ottenere `RuntimeError` o saltare elementi.

### Viste dinamiche e snapshot

```python
user = {"name": "Ada"}
keys = user.keys()
values = user.values()
pairs = user.items()
snapshot = list(user.items())
user["role"] = "admin"

print(list(keys))      # ['name', 'role']
print(list(values))    # ['Ada', 'admin']
print(list(pairs))     # [('name', 'Ada'), ('role', 'admin')]
print(snapshot)        # [('name', 'Ada')]
```

Le viste riflettono gli aggiornamenti. `list(...)` materializza uno snapshot superficiale, non una copia profonda dei valori.

### Raggruppare con setdefault

```python
users = [
    {"name": "Ada", "role": "admin"},
    {"name": "Grace", "role": "admin"},
]
groups = {}
for user in users:
    groups.setdefault(user["role"], []).append(user)

print([user["name"] for user in groups["admin"]])  # ['Ada', 'Grace']
```

`setdefault` inserisce solo se manca la chiave; un valore presente, anche `None`, rimane invariato. Qui ogni gruppo deve essere una lista. L'argomento `[]` viene valutato a ogni chiamata.

### Contare occorrenze

```python
words = ["api", "db", "api"]
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1

print(counts)  # {'api': 2, 'db': 1}
```

Per conteggi estesi valuta `collections.Counter`; per raggruppamenti `collections.defaultdict(list)`.

### Comprehension e filtri

```python
values = [1, 2, 3]
squares = {value: value**2 for value in values}
users = {1: {"active": True}, 2: {"active": False}}
active_users = {
    user_id: user
    for user_id, user in users.items()
    if user["active"]
}

print(squares)       # {1: 1, 2: 4, 3: 9}
print(active_users)  # {1: {'active': True}}
```

Una chiave prodotta piu volte conserva l'ultimo valore. Il filtro assume il campo `active` presente; i record selezionati restano condivisi.

### Copia superficiale

```python
user = {"name": "Ada", "roles": ["reader"]}
copied = user.copy()
expanded = {**user}
copied["name"] = "Grace"
copied["roles"].append("editor")

print(user["name"], copied["name"])     # Ada Grace
print(user["roles"])                    # ['reader', 'editor']
print(expanded["roles"] is user["roles"])  # True
```

Entrambe le copie creano solo il contenitore esterno. `copied = user` creerebbe un alias, senza alcuna copia.

## Adattamenti comuni

### Valori mutabili indipendenti

```python
keys = ["admin", "reader"]
groups = {key: [] for key in keys}
groups["admin"].append("Ada")
print(groups)  # {'admin': ['Ada'], 'reader': []}
```

`dict.fromkeys(keys, [])` condivide invece una sola lista fra tutte le chiavi. Per copie annidate valuta `copy.deepcopy` in base al tipo dei dati.

## Debug rapido

- `KeyError`: chiave richiesta assente; scegli se e un errore o un caso con default.
- `TypeError: unhashable type`: non usare liste o dict come chiavi.
- `AttributeError` su `append`: il valore esistente non e una lista; `setdefault` non lo corregge.
- Chiavi apparentemente distinte collassano: `1`, `1.0` e `True` identificano la stessa voce.

## Checklist finale

- Assenza, `None` e valori falsy sono distinti dove necessario?
- Mutazione, ordine e politica sui duplicati sono intenzionali?
- Vista dinamica o snapshot? Copia superficiale o valori indipendenti?

## Collegamenti

- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Promemoria/Pagine/Python - Liste tuple e set|Promemoria liste, tuple e set]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: dict e viste](https://docs.python.org/3.12/library/stdtypes.html#mapping-types-dict).
- [Python 3.12: strutture dati](https://docs.python.org/3.12/tutorial/datastructures.html).
- [Python 3.12: copie](https://docs.python.org/3.12/library/copy.html).
