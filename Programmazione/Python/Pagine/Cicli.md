---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Cicli]
prerequisites: []
related: []
---

# Cicli in Python

## Sintesi

I cicli ripetono un blocco di codice. In Python i cicli principali sono `for`, per iterare su iterabili, e `while`, per ripetere finche una condizione resta vera.

## Quando usarlo

Usali per processare collezioni, leggere file, ripetere tentativi, generare risultati o eseguire logica finche una condizione cambia.

## Come funziona

`for` lavora su iterabili: liste, tuple, dizionari, set, stringhe, generatori e file. `while` valuta una condizione a ogni iterazione.

`break` interrompe il ciclo. `continue` salta all'iterazione successiva. `else` su un ciclo viene eseguito solo se il ciclo termina senza `break`.

## API / Sintassi

```python
for item in items:
    print(item)

for index, item in enumerate(items):
    print(index, item)

while attempts < 3:
    attempts += 1
```

Controllo flusso:

```python
for value in values:
    if value is None:
        continue
    if value == "stop":
        break
```

## Esempio pratico

```python
users = [{"email": "a@example.com"}, {"email": ""}, {"email": "b@example.com"}]

valid_emails = []
for user in users:
    email = user.get("email")
    if not email:
        continue
    valid_emails.append(email.lower())
```

## Varianti

- `for`.
- `while`.
- `break`.
- `continue`.
- `else` sui cicli.
- `enumerate`.
- `zip`.
- Comprehensions.

## Errori comuni

- Usare `range(len(items))` quando basta iterare sugli elementi.
- Creare loop infiniti con `while`.
- Modificare una lista mentre la si itera.
- Usare `break` e aspettarsi che `else` venga eseguito.
- Annidare troppi cicli senza estrarre funzioni.

## Checklist

- Il ciclo giusto e `for` o `while`?
- Serve l'indice? Usa `enumerate`.
- Stai modificando la collezione durante iterazione?
- Il `while` ha una condizione di uscita?
- Una comprehension sarebbe piu chiara?

## Collegamenti

- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Liste|Liste]]
