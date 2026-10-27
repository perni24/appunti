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
  - Dizionari
prerequisites: []
related: []
title: Dizionari in Python
---

# Dizionari in Python

## Sintesi

Un dict e un mapping mutabile da chiavi hashable a valori. Conserva **l'ordine di inserimento**, non ordina le chiavi. Ogni chiave identifica un solo valore: un nuovo assegnamento alla stessa chiave lo sostituisce.

Baseline delle prove: **CPython 3.12.10**. Ordine garantito dal linguaggio da Python 3.7; operatori di unione dei dict da Python 3.9.

## Quando usarlo

Per lookup, configurazioni, conteggi, raggruppamenti e record dinamici. Per un modello con campi e invarianti espliciti valuta dataclass o un parser/schema. Un dict non valida i propri dati e non e automaticamente JSON: ammette chiavi e valori che JSON non rappresenta direttamente.

## Come funziona

Le chiavi devono avere hash e uguaglianza coerenti; i valori non devono essere hashable. Una tupla con elementi hashable puo essere chiave, una tupla con una lista no. Oggetti custom possono essere hashable anche se hanno attributi mutabili: non usare attributi variabili per definire l'hash della chiave.

`1`, `1.0` e `True` si riferiscono alla stessa voce. L'ordine delle inserzioni non influisce sull'uguaglianza fra due dict. Sovrascrivere una chiave non la sposta; eliminarla e reinserirla la porta in fondo.

## API / Sintassi

### Presenza, assenza e valore None

```python
user = {"id": 1, "email": "ada@example.com", "phone": None}
email = user["email"]
phone = user.get("phone", "N/A")
missing = object()
nickname = user.get("nickname", missing)

print(email, phone)  # ada@example.com None
print(nickname is missing)  # True
print("email" in user)  # True
```

`d[key]` genera KeyError se la chiave manca; `get(key, default)` restituisce il default solo in caso di assenza. Un None gia memorizzato non viene sostituito. Il sentinel permette di distinguere i due casi.

`key in d` cerca nelle chiavi, non nei valori. `get` non aggiunge la chiave. La sua espressione default viene comunque valutata prima della chiamata: non e lazy.

### Viste e iterazione

```python
settings = {"theme": "light", "size": 12}
keys = settings.keys()
snapshot = list(settings.items())

settings["theme"] = "dark"
settings["language"] = "it"
print(list(keys))  # ['theme', 'size', 'language']
print(snapshot)  # [('theme', 'light'), ('size', 12)]

for key, value in settings.items():
    print(key, value)
```

keys, values e items sono **viste dinamiche**, non copie. `list(d.items())` fissa le coppie presenti in quel momento, ma non clona oggetti annidati. Non aggiungere o eliminare chiavi durante l'iterazione dello stesso dict: puoi ricevere RuntimeError o non visitare tutte le voci. Per rimozioni programmate, raccogli prima le chiavi o itera una copia di esse.

### Aggiornamenti, fusione e rimozione

```python
defaults = {"theme": "light", "size": 12}
overrides = {"size": 16, "language": "it"}
merged = defaults | overrides
print(merged)  # {'theme': 'light', 'size': 16, 'language': 'it'}
print(defaults)  # {'theme': 'light', 'size': 12}

local = defaults.copy()
result = local.update(overrides)
removed = local.pop("language")
fallback = local.pop("missing", None)
print(result, removed, fallback)  # None it None
```

`left | right` fra dict restituisce un nuovo dict: sulle chiavi duplicate vince destra. `update` e `|=` mutano il ricevente; update restituisce None. La fusione e **superficiale**, non combina ricorsivamente dizionari annidati. Le chiavi nuove si aggiungono in fondo, quelle sostituite mantengono posizione.

`update` accetta anche coppie chiave-valore, mentre `|` dei dict built-in richiede dict. `del d[key]` elimina o genera KeyError; `pop` restituisce il valore rimosso, `popitem()` l'ultima coppia inserita, `clear()` svuota.

### Default mutabili

```python
shared = dict.fromkeys(["a", "b"], [])
shared["a"].append(1)
print(shared)  # {'a': [1], 'b': [1]}

separate = {key: [] for key in ["a", "b"]}
separate["a"].append(1)
print(separate)  # {'a': [1], 'b': []}
```

`fromkeys` riusa lo stesso valore per ogni chiave. `setdefault(key, default)` restituisce il valore esistente oppure inserisce il default; anche qui l'argomento viene valutato a ogni chiamata. `defaultdict(list)` chiama invece una factory per una chiave assente letta con parentesi quadre; get non attiva la factory.

## Esempio pratico

### Indice per ID con duplicati rifiutati

Contratto: iterabile finito di dict ordinari con id int built-in positivo ed email testuale non vuota dopo strip. Non e una validazione di indirizzi email. Gli altri campi vengono esclusi dalla proiezione; l'input non viene modificato.

```python
def index_users(users):
    result = {}
    for user in users:
        if not isinstance(user, dict):
            raise TypeError("Each user must be a dictionary")
        user_id = user.get("id")
        email = user.get("email")
        if type(user_id) is not int or not isinstance(email, str):
            raise TypeError("Expected integer id and text email")
        if user_id <= 0 or not email.strip():
            raise ValueError("Invalid id or empty email")
        if user_id in result:
            raise ValueError("Duplicate id")
        result[user_id] = {"id": user_id, "email": email.strip()}
    return result


users = [
    {"id": 1, "email": " a@example.com ", "internal": "not copied"},
    {"id": 2, "email": "b@example.com"},
]
users_by_id = index_users(users)
print(users_by_id[1])  # {'id': 1, 'email': 'a@example.com'}
print(users_by_id.get(99))  # None
```

La forma `{user["id"]: user for user in users}` e valida se la politica desiderata e **ultimo duplicato vince**, ma condivide anche i dict sorgente. Il demo usa invece un ciclo per rifiutare duplicati e creare record nuovi con campi scalari.

Non dimostra unicita in un database, sincronizzazione tra thread o autorizzazione. Un errore non modifica gli input ma puo avere gia consumato una parte dell'iterabile.

## Varianti

- `dict()`, literal e dict comprehension per costruire mapping.
- `defaultdict` per raggruppare; `Counter` per frequenze.
- `copy()` copia il contenitore esterno; i valori annidati restano condivisi.
- `MappingProxyType` crea una vista di sola lettura: riflette le modifiche al dict originale e non congela i valori interni.
- Dataclass per record espliciti, distinta dalla validazione di dati esterni.

## Errori comuni

- Usare get senza distinguere assenza da None.
- Affidarsi all'ordine di stampa per determinare l'uguaglianza.
- Sovrascrivere ID duplicati accidentalmente con una comprehension.
- Aspettarsi una fusione ricorsiva da update o `|`.
- Condividere liste con fromkeys.
- Restituire direttamente record interni pensando di averli copiati.

## Checklist

- Tipi delle chiavi e regole di uguaglianza sono corretti?
- Cosa accade con chiavi assenti, None e duplicati?
- Viste dinamiche o snapshot? Copia superficiale o proiezione dei campi?
- L'aggiornamento deve mutare l'oggetto oppure produrne uno nuovo?
- L'ordine necessario e quello di inserimento o un ordinamento esplicito?

## Collegamenti

- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]

## Fonti

- [Python 3.12: dict e viste dinamiche](https://docs.python.org/3.12/library/stdtypes.html#mapping-types-dict).
- [PEP 584: unione e aggiornamento dei dizionari](https://peps.python.org/pep-0584/).
- [Python 3.12: defaultdict](https://docs.python.org/3.12/library/collections.html#collections.defaultdict).
- [Python 3.12: copie superficiali](https://docs.python.org/3.12/library/copy.html).
- [Python 3.12: hashable](https://docs.python.org/3.12/glossary.html#term-hashable).
- [Python 3.12: MappingProxyType](https://docs.python.org/3.12/library/types.html#types.MappingProxyType).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
