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
  - Strutture Condizionali
prerequisites: []
related: []
title: Strutture Condizionali in Python
---

# Strutture Condizionali in Python

## Sintesi

If/elif/else scelgono un ramo secondo condizioni booleane. L'espressione condizionale produce un valore; match/case riconosce **pattern strutturali**, non soltanto uguaglianze come uno switch.

Baseline: **CPython 3.12.10**. Match e disponibile da Python 3.10.

## Quando usarlo

Per scegliere tra stati, trasformare un risultato o trattare input con forme diverse. Le condizioni applicano una politica: non sostituiscono automaticamente validazione o autorizzazione.

## Come funziona

Una catena if/elif esegue solo il primo ramo vero. Piu if indipendenti possono invece eseguire piu blocchi. Se manca else e nessuna condizione e vera, non accade nulla.

None, zero e contenitori vuoti sono falsy. Anche oggetti personalizzati possono definire il proprio valore di verita. Chiediti se intendi assenza, vuoto oppure il booleano True preciso.

## API / Sintassi

### Scelta di un ramo

Qui age e un intero attendibile della fixture, non un input gia validato dalla presenza dell'if.

```python
age = 21

if age < 18:
    status = "minor"
elif age < 65:
    status = "adult"
else:
    status = "senior"

print(status)  # adult
```

### Espressione condizionale

```python
is_active = True
label = "attivo" if is_active else "disattivato"

limit = 0
effective_limit = 100 if limit is None else limit
print(label, effective_limit)  # attivo 0
```

Viene valutato soltanto il ramo scelto. Se servono molte operazioni, preferisci un normale if.

### Match di valori

```python
def describe_status(status_code):
    match status_code:
        case 200:
            return "ok"
        case 400 | 404:
            return "client error"
        case _:
            return "unknown"


print(describe_status(404))  # client error
```

Il primo case compatibile vince, senza fall-through. Il default non e obbligatorio, ma va deciso il comportamento dei casi non riconosciuti.

**Un nome semplice in un pattern cattura un valore.** Case ACTIVE non confronta la variabile ACTIVE: la assegna. Per una costante usa un literal o un nome qualificato, per esempio Status.ACTIVE. L'underscore e un wildcard nel pattern.

## Esempio pratico

### Guard clauses con input dichiarato

Il seguente e un filtro dimostrativo su dizionari ordinari, non un sistema di autorizzazione. I permessi reali devono derivare da identita e dati attendibili sul server, non da un payload inviato dall'utente.

```python
def can_access(user):
    if not isinstance(user, dict):
        return False
    if user.get("active") is not True:
        return False

    role = user.get("role")
    return isinstance(role, str) and role in {"admin", "editor"}


print(can_access({"active": True, "role": "editor"}))  # True
print(can_access({"active": "false", "role": "admin"}))  # False
```

Is True richiede precisamente il booleano: il numero 1 e una stringa non vuota non lo sostituiscono. Il controllo del tipo di role evita anche membership di valori non hashable, per esempio liste.

### Pattern con guardia

```python
def parse_move(payload):
    match payload:
        case {"action": "move", "steps": int() as steps} if (
            type(steps) is int and 1 <= steps <= 100
        ):
            return ("move", steps)
        case {"action": "stop"}:
            return ("stop", 0)
        case _:
            return None


print(parse_move({"action": "move", "steps": 3}))  # ('move', 3)
print(parse_move({"action": "move", "steps": True}))  # None
```

La guardia viene valutata dopo il pattern. Il controllo type(... ) is int esclude bool, altrimenti compatibile con int(). I pattern di mapping **accettano chiavi aggiuntive**: questo parser non impone uno schema chiuso. La politica e intenzionale; per rifiutare extra serve un controllo aggiuntivo o uno schema.

## Varianti

- Guard clauses per scartare presto casi non validi.
- Match per forma dei dati; if per condizioni arbitrarie.
- Pattern di sequenza per liste/tuple: non interpretano automaticamente una stringa come sequenza da scomporre.
- Un dizionario di funzioni puo sostituire molti rami per comandi semplici, ma richiede gestione delle chiavi sconosciute.

## Errori comuni

- Trattare una stringa non vuota come booleano validato.
- Confondere un capture pattern con il confronto di una costante.
- Supporre che match validi automaticamente tipi, intervalli ed extra.
- Usare == True senza decidere se servono truthiness o identita del bool.
- Assegnare un risultato solo in alcuni rami e leggerlo comunque.

## Checklist

- Primo ramo corretto anche quando piu condizioni sono vere?
- Default e casi sconosciuti trattati esplicitamente?
- None distinto da zero e valori vuoti?
- Dati esterni validati prima di decisioni sensibili?
- Nome nel case intenzionalmente catturato oppure costante qualificata?

## Collegamenti

- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]

## Fonti

- [Python 3.12: if e pattern matching](https://docs.python.org/3.12/reference/compound_stmts.html).
- [Python 3.12: tutorial match](https://docs.python.org/3.12/tutorial/controlflow.html#match-statements).
- [Python 3.12: truth value testing](https://docs.python.org/3.12/library/stdtypes.html#truth-value-testing).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
