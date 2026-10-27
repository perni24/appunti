---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - enum
  - standard-library
aliases:
  - Enum Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Classi e Istanze]]"
related:
  - "[[Programmazione/Python/Pagine/Dataclasses]]"
  - "[[Programmazione/Python/Pagine/Type Hinting]]"
title: Enum
---

# Enum

## Sintesi

`Enum` definisce valori nominati per un dominio stabile: stati di una procedura, categorie o tipi di evento. Un membro ha `name` e `value`, ma non e automaticamente intercambiabile con il valore grezzo.

Riferimento Python 3.12; esempi sulla baseline CPython 3.12.10. `StrEnum` e disponibile da Python 3.11.

## Quando usarlo

- Eliminare stringhe magiche ripetute.
- Definire un insieme controllato di stati e i relativi comportamenti.
- Convertire valori esterni in una rappresentazione interna esplicita.

Non usarlo per un catalogo dinamico modificato dagli utenti o caricato continuamente dal database. Un enum non autorizza operazioni e non gestisce da solo transizioni di stato.

## Come funziona

`Status("draft")` cerca per valore; `Status["DRAFT"]` per nome. La prima ricerca fallisce con `ValueError`, la seconda con `KeyError`. La costruzione per valore restituisce il membro esistente, non un nuovo stato indipendente.

Un normale `Enum` distingue i suoi membri da stringhe e interi. `StrEnum` e `IntEnum` scelgono invece l'interoperabilita con il tipo di base, riducendo questa separazione.

## API / Sintassi

### Conversione al confine e serializzazione

```python
import json
from enum import Enum, unique


@unique
class Status(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

    def can_publish(self) -> bool:
        return self is Status.DRAFT


def parse_status(raw: object) -> Status:
    if not isinstance(raw, str):
        raise TypeError("status must be a string")
    try:
        return Status(raw)
    except ValueError as error:
        raise ValueError("unknown status") from error


status = parse_status("draft")
print(status is Status["DRAFT"])
print(status.name, status.value, status.can_publish())
print(status == "draft")
print(json.dumps({"status": status.value}))
```

Output: `True`, `DRAFT draft True`, `False` e `{"status": "draft"}`. Il parser accetta i valori esatti, senza normalizzare maiuscole o spazi. `can_publish` riguarda solo lo stato: non controlla identita o permessi dell'utente.

Il JSON conserva `.value` come contratto esterno. Rinominare un membro puo essere innocuo per quel contratto; cambiare il suo valore persistito richiede invece valutare migrazioni e compatibilita. `json.dumps(status)` non serializza automaticamente un normale enum con valore stringa.

### Alias e iterazione

```python
from enum import Enum


class Result(Enum):
    SUCCESS = 0
    OK = 0
    FAILURE = 1


print(Result.OK is Result.SUCCESS)
print([member.name for member in Result])
print(list(Result.__members__))
print(Result.OK.name)
```

Output: `True`, `['SUCCESS', 'FAILURE']`, `['SUCCESS', 'OK', 'FAILURE']` e `SUCCESS`. Due nomi con lo stesso valore diventano alias: l'iterazione omette gli alias, `__members__` li include. `@unique` vieta questa situazione alla definizione della classe.

Un enum con membri non puo essere esteso con sottoclassi che aggiungono nuovi membri. Puoi condividere comportamenti tramite una base enum priva di membri o comporre tipi distinti.

## Esempio pratico

`StrEnum` semplifica l'integrazione con API che usano stringhe; `IntEnum` con codici interi. Questa scelta ha conseguenze su confronti e operazioni.

```python
from enum import IntEnum, StrEnum, auto


class Role(StrEnum):
    ADMIN = "admin"
    USER = "user"


class InternalLabel(StrEnum):
    READY = auto()


class ExitStatus(IntEnum):
    OK = 0
    FAILED = 1


print(Role.ADMIN == "admin", str(Role.USER))
print(InternalLabel.READY.value)
print(ExitStatus.FAILED == 1, ExitStatus.FAILED + 1)
```

Output: `True user`, `ready` e `True 2`. Il risultato dell'addizione e un `int`, non un nuovo `ExitStatus`.

`StrEnum` resta una sottoclasse di `str`: codice che richiede `type(value) is str` puo rifiutarlo; `str(member)` restituisce una stringa ordinaria. Membri di enum diversi basati su stringhe/interi possono confrontarsi uguali attraverso il valore di base.

`auto()` e comodo per valori interni: in un normale enum assegna tipicamente interi progressivi, in `StrEnum` il nome in minuscolo. Per protocolli persistiti scegli valori espliciti e stabili; riordinare nomi o modificarli non dovrebbe cambiare silenziosamente il formato esterno.

## Varianti

### Flag per combinazioni

```python
from enum import Flag, auto


class Permission(Flag):
    READ = auto()
    WRITE = auto()


granted = Permission.READ | Permission.WRITE
print(Permission.READ in granted)
print(bool(Permission(0)))
```

Output: `True` e `False`. `Flag` rappresenta combinazioni di bit, non uno stato mutuamente esclusivo come draft/published. `IntFlag` aggiunge interoperabilita con interi e regole proprie per bit non dichiarati: non trattare qualsiasi maschera ricevuta come autorizzata.

In Python 3.12 `value in EnumType` puo accettare anche il valore grezzo; nelle versioni precedenti il caso poteva sollevare `TypeError`. Per convertire un input usa esplicitamente il costruttore e gestisci l'errore, senza affidarti a un test di appartenenza dipendente dalla versione.

## Errori comuni

- Confondere ricerca per nome e ricerca per valore.
- Aspettarsi che un enum normale sia uguale alla stringa che contiene.
- Ignorare alias involontari.
- Persistire `auto()` come codice stabile senza una politica di compatibilita.
- Considerare `StrEnum` isolato dalle stringhe nei confronti.
- Confondere stato, permesso dichiarato e autorizzazione effettiva.
- Pensare che un'annotazione enum impedisca al chiamante di passare una stringa.

## Checklist

- Il dominio e stabile o dipende da dati dinamici?
- Sono necessari enum distinti o combinazioni Flag?
- Il confine esterno converte e rifiuta input sconosciuti?
- Il formato persistito usa nome o valore consapevolmente?
- Alias e confronti con tipi primitivi sono desiderati?
- Le transizioni e i permessi sono gestiti separatamente?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

## Fonti

- [Python 3.12: Enum HOWTO](https://docs.python.org/3.12/howto/enum.html).
- [Python 3.12: enum, StrEnum, Flag e differenze di versione](https://docs.python.org/3.12/library/enum.html).
