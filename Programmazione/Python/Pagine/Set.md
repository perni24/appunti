---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Set]
prerequisites: []
related: []
---

# Set in Python

## Sintesi

I set sono collezioni non ordinate di elementi unici. Sono utili per eliminare duplicati e fare operazioni insiemistiche.

## Quando usarlo

Usa un set quando ti interessa appartenenza rapida, unicita, intersezione, unione o differenza tra collezioni.

## Come funziona

I set sono basati su hash table. La ricerca con `in` e mediamente molto veloce. Gli elementi devono essere hashable.

Un set non conserva un ordine affidabile per accesso indicizzato e non supporta `set[0]`.

## API / Sintassi

```python
colors = {"red", "green", "blue"}
unique_numbers = set([1, 2, 2, 3])
colors.add("yellow")
colors.discard("red")
```

Operazioni:

```python
a = {1, 2, 3}
b = {3, 4, 5}

a | b  # unione
a & b  # intersezione
a - b  # differenza
a ^ b  # differenza simmetrica
```

## Esempio pratico

```python
allowed_roles = {"admin", "editor"}
user_roles = {"viewer", "editor"}

if user_roles & allowed_roles:
    print("Accesso consentito")
```

## Varianti

- Set mutabile: `set`.
- Set immutabile: `frozenset`.
- Set comprehension.
- Operazioni con metodi: `.union()`, `.intersection()`, `.difference()`.
- Deduplica di liste.

## Errori comuni

- Creare set vuoto con `{}`: quello e un dizionario.
- Aspettarsi ordine stabile.
- Inserire liste o dizionari dentro un set.
- Usare lista per membership frequente.
- Usare `.remove()` quando l'elemento puo mancare.

## Checklist

- Ti serve unicita?
- Ti serve membership veloce?
- Gli elementi sono hashable?
- L'ordine non e importante?
- Per rimozione sicura puoi usare `.discard()`?

## Collegamenti

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Operatori|Operatori]]
