---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
aliases:
  - Set
prerequisites: []
related: []
title: Set in Python
---

# Set in Python

## Sintesi

Un set rappresenta un insieme di elementi unici secondo uguaglianza e hash. E mutabile, non e indicizzato e **non garantisce un ordine di iterazione**. Non e una lista senza duplicati che conservi automaticamente il primo ordine.

Baseline delle prove: **CPython 3.12.10**, non una dichiarazione di ultima patch.

## Quando usarlo

Per appartenenza, deduplicazione senza ordine, intersezioni e differenze. Se vuoi conservare duplicati usa una lista o un Counter; se vuoi associare informazioni a ciascuna chiave usa un dict.

## Come funziona

In CPython set e dict usano strutture basate su hash: la ricerca evita normalmente una scansione completa, ma hash/confronti costosi e collisioni incidono. Non e una garanzia di tempo costante in ogni situazione.

Gli elementi devono essere **hashable**: liste, dict e set mutabili non possono essere aggiunti come elementi. Una tupla e valida solo se lo sono tutti i suoi componenti. Il frozenset e la variante immutabile e hashable del set.

Un hash uguale non significa oggetti uguali; l'uguaglianza resta rilevante. Invece `1`, `1.0` e `True` confrontano uguali e collassano nello stesso elemento. Se i tipi hanno significati diversi nel dominio, validali prima.

## API / Sintassi

### Creazione e modifica

```python
empty = set()
colors = {"red", "green"}
colors.add("blue")
colors.update(["green", "yellow"])
colors.discard("missing")
colors.remove("red")
print(sorted(colors))  # ['blue', 'green', 'yellow']

letters = set("aba")
print(sorted(letters))  # ['a', 'b']
print(len({1, 1.0, True}))  # 1
```

`{}` crea un dict. `add(x)` inserisce un elemento; `update(iterable)` ne inserisce i valori. Quindi update con una stringa inserisce caratteri, non l'intera stringa.

`remove(x)` genera KeyError se x manca; `discard(x)` ignora l'assenza, ma non ogni possibile errore di tipo. `pop()` rimuove un elemento **arbitrario**, non il primo o un campione casuale, e fallisce con KeyError se il set e vuoto. Questi metodi mutano il set; add/update/remove/discard restituiscono None.

### Operazioni insiemistiche

```python
a = {1, 2, 3}
b = {3, 4, 5}

print(sorted(a | b))  # [1, 2, 3, 4, 5]
print(sorted(a & b))  # [3]
print(sorted(a - b))  # [1, 2]
print(sorted(a ^ b))  # [1, 2, 4, 5]
print({1, 2} <= a, a.isdisjoint({8}))  # True True
print(a.intersection([2, 9]))  # {2}
```

- `|`, `&`, `-`, `^` producono un nuovo insieme; con set built-in richiedono altri set/frozenset. I corrispondenti metodi accettano iterabili.
- `<=` significa sottoinsieme, `<` sottoinsieme proprio: non sono confronti per lunghezza o ordine lessicografico.
- `isdisjoint` verifica che non ci siano elementi in comune.
- `update`, `intersection_update`, `difference_update` e `symmetric_difference_update` modificano il ricevente; con un set mutabile anche `|=`, `&=`, `-=`, `^=` aggiornano in place.

Usa sorted soltanto quando gli elementi sono ordinabili o hai una key coerente. Stampare direttamente un set non definisce un formato stabile per test o file.

### Frozenset

```python
required = frozenset({"read", "write"})
profiles = {required: "editor"}
print(profiles[frozenset({"write", "read"})])  # editor
print(required == {"read", "write"})  # True
```

Frozenset non espone add/remove. Le operazioni non mutanti restano disponibili; mescolando set e frozenset, il tipo del risultato degli operatori binari dipende dal primo operando.

## Esempio pratico

### Confrontare due insiemi di etichette

Dati locali gia rappresentati da stringhe. Il confronto e esatto e case-sensitive; non normalizza identificatori e non modifica file o servizi.

```python
current = {"python", "draft"}
desired = {"python", "reviewed"}

to_add = desired - current
to_remove = current - desired
unchanged = current & desired

print(sorted(to_add))  # ['reviewed']
print(sorted(to_remove))  # ['draft']
print(sorted(unchanged))  # ['python']
```

Anche l'intersezione tra ruoli puo rispondere alla domanda "esiste un ruolo comune?". Non basta come sistema di autorizzazione: identita e ruoli devono essere stabiliti da fonti attendibili sul server, non dal client.

### Deduplicare conservando il primo ordine

Contratto: iterabile finito di elementi hashable. Una lista mantiene l'ordine, un set ricorda gli elementi gia incontrati.

```python
def unique_in_order(values):
    seen = set()
    result = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


print(unique_in_order(["blue", "red", "blue"]))  # ['blue', 'red']
print(unique_in_order([]))  # []
```

Non ordina e non copia gli elementi contenuti. Una lista interna come elemento causa TypeError; bool e numeri uguali seguono le regole del set. La memoria cresce con gli elementi distinti. Un'alternativa compatta e `list(dict.fromkeys(values))`, con lo stesso requisito di chiavi hashable.

## Varianti

- Set comprehension per produrre valori unici.
- `frozenset` per un insieme che debba diventare chiave o elemento di un altro set.
- `collections.Counter` quando serve conoscere anche quante volte compare un valore.
- Membership su una lista resta sensata per sequenze piccole o valori non hashable: convertire sempre in set ha un costo e cambia il contratto.

## Errori comuni

- Aspettarsi un ordine stabile perche una singola esecuzione sembra ripeterlo.
- Usare `pop()` come selezione casuale.
- Confondere `a - b` con `b - a`.
- Aggiungere/rimuovere elementi mentre si itera lo stesso set.
- Dire "immutabile" al posto di verificare hashability e uguaglianza.
- Perdere intenzionalmente o accidentalmente l'ordine con `list(set(values))`.

## Checklist

- Unicita e uguaglianza hanno il significato voluto?
- Tutti gli elementi sono hashable?
- Ordine e numero di occorrenze possono essere persi?
- L'operazione restituisce un nuovo insieme oppure muta quello esistente?
- L'output da confrontare o serializzare ha un ordine esplicito?

## Collegamenti

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]

## Fonti

- [Python 3.12: set e frozenset](https://docs.python.org/3.12/library/stdtypes.html#set-types-set-frozenset).
- [Python 3.12: definizione di hashable](https://docs.python.org/3.12/glossary.html#term-hashable).
- [Python 3.12: set nel tutorial](https://docs.python.org/3.12/tutorial/datastructures.html#sets).
- [Python 3.12: Counter](https://docs.python.org/3.12/library/collections.html#collections.Counter).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
