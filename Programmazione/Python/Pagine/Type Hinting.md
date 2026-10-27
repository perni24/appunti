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
  - Type Hinting
prerequisites: []
related: []
title: Type Hinting in Python
---

# Type Hinting in Python

## Sintesi

Le annotazioni descrivono i contratti di funzioni, variabili e classi. Un type checker cerca incompatibilita senza eseguire il programma; Python non impone automaticamente quei contratti durante le chiamate.

Riferimento: Python 3.12, esempi verificati con CPython 3.12.10. Sintassi moderna con `list[str]`, union `|` e parametri di tipo introdotti nella 3.12. La patch indica il runtime provato, non l'ultima versione disponibile.

## Quando usarlo

Nelle API condivise, nei modelli dati e nei punti in cui valori opzionali, callback o dizionari rendono ambiguo il flusso. Serve anche nelle librerie, insieme ai test e alla documentazione.

Un type checker non sostituisce validazione degli input, test, autorizzazione o controlli sui dati provenienti dalla rete.

## Come funziona

Il checker combina annotazioni e inferenza. Segue il flusso per restringere i tipi, per esempio dopo un controllo su `None`. Le funzioni non annotate e `Any` possono lasciare zone non controllate; la modalita strict aumenta i controlli ma non dimostra la correttezza del programma.

Nella baseline 3.12 molte annotazioni vengono valutate alla definizione. `from __future__ import annotations` le conserva come stringhe; non cambia questo codice in un sistema con validazione runtime. Per riferimenti in avanti si possono usare anche stringhe. `typing.get_type_hints` risolve le annotazioni, ma puo valutare espressioni: non usarlo su sorgenti non fidate.

## API / Sintassi

### Tipi ordinari e valori opzionali

```python
def greet(name: str) -> str:
    return f"Ciao {name}"


def find_user(user_id: int) -> str | None:
    users: dict[int, str] = {1: "Ada", 2: "Lin"}
    return users.get(user_id)


count: int = 0
names: list[str] = ["Ada", "Luca"]
name = find_user(3)
message = "Unknown user" if name is None else greet(name)
print(message)  # Unknown user
```

`str | None` significa che il valore puo essere `None`, non che l'argomento possa essere omesso: per quello serve un default. `tuple[int, str]` ha due posizioni; `tuple[int, ...]` ha lunghezza variabile. `-> None` indica che non c'e un risultato utile, non che la funzione non ritorna: per un percorso che termina sempre con errore si usa `Never`.

Le annotazioni numeriche non stabiliscono intervalli o precisione. Un controllo statico puo ammettere `bool` dove e richiesto `int`: per escluderlo a runtime occorre una scelta esplicita.

### Generici e alias

```python
from collections.abc import Sequence

type Point = tuple[int, int]


def first[T](items: Sequence[T]) -> T:
    if not items:
        raise ValueError("items cannot be empty")
    return items[0]


point: Point = (3, 4)
number = first([1, 2, 3])
word = first(("one", "two"))
print(point, number, word)  # (3, 4) 1 one
```

`T` collega il tipo degli elementi a quello restituito. Il generico non garantisce che una sequenza sia non vuota: il controllo resta necessario. `Sequence` espone lettura e indicizzazione, senza promettere che l'oggetto sottostante sia immutabile.

La sintassi `def first[T]` e `type Point = ...` richiede Python 3.12. La forma precedente usa `TypeVar`, un'assegnazione per l'alias ed eventualmente `Generic[T]` per le classi; resta utile quando devi supportare versioni precedenti.

`list` e mutabile e invariante: una lista di un sottotipo non e in generale una lista modificabile del tipo base. Per API che leggono soltanto, `Sequence[T]` evita parte di questi vincoli. Un alias da solo non crea un nuovo tipo nominale.

### TypedDict e validazione

`TypedDict` descrive chiavi e valori di un normale dizionario. Non e una classe di validazione e non rende corretto un JSON solo perche lo annoti.

```python
from collections.abc import Mapping
from typing import NotRequired, TypedDict


class UserData(TypedDict):
    id: int
    name: str
    nickname: NotRequired[str]


def parse_user(payload: Mapping[str, object]) -> UserData:
    allowed = {"id", "name", "nickname"}
    if set(payload) - allowed:
        raise ValueError("unexpected fields")
    user_id = payload.get("id")
    name = payload.get("name")
    if type(user_id) is not int:
        raise TypeError("id must be an integer")
    if user_id < 1:
        raise ValueError("id must be positive")
    if not isinstance(name, str):
        raise TypeError("name must be a string")
    cleaned = name.strip()
    if not cleaned:
        raise ValueError("name cannot be empty")
    result: UserData = {"id": user_id, "name": cleaned}
    if "nickname" in payload:
        nickname = payload["nickname"]
        if not isinstance(nickname, str):
            raise TypeError("nickname must be a string")
        result["nickname"] = nickname
    return result


user = parse_user({"id": 1, "name": " Ada "})
print(user)  # {'id': 1, 'name': 'Ada'}
```

La funzione richiede una mapping, controlla i campi e costruisce un nuovo dizionario. Non legge un file o una risposta HTTP; prima di chiamarla, il livello di parsing deve verificare anche la forma esterna. Non e un validatore generale contro oggetti ostili o mapping che cambiano durante l'accesso.

`NotRequired[str]` permette di omettere la chiave; non permette di inserirla con valore `None`. `str | None` permette invece quel valore, senza rendere automaticamente facoltativa la chiave. `total=False` rende facoltative tutte le chiavi dichiarate in quel corpo; `Required` consente eccezioni esplicite.

## Esempio pratico

### Protocol e structural typing

```python
from typing import Protocol, runtime_checkable


@runtime_checkable
class Sink(Protocol):
    def write(self, message: str, /) -> None:
        ...


class MemorySink:
    def __init__(self) -> None:
        self.messages: list[str] = []

    def write(self, message: str, /) -> None:
        self.messages.append(message)


def notify(sink: Sink, message: str) -> None:
    sink.write(message)


def supports_sink(value: object) -> bool:
    return isinstance(value, Sink)


sink = MemorySink()
notify(sink, "ready")
print(sink.messages)         # ['ready']
print(supports_sink(sink))    # True
```

`MemorySink` non eredita da `Sink`: la compatibilita statica dipende dai membri e dalle loro firme. La barra rende il parametro posizionale, evitando di imporre ai consumatori il nome di un keyword.

I puntini nella dichiarazione del Protocol descrivono intenzionalmente un contratto, non un'implementazione mancante. `runtime_checkable` abilita controlli runtime limitati alla presenza dei membri: non verifica firme, tipi degli argomenti o valori restituiti. Un oggetto puo passare `isinstance` e restare incompatibile per il checker. ABC, duck typing e Protocol non sono sinonimi.

## Varianti

### Literal e NewType

```python
from typing import Literal, NewType

UserId = NewType("UserId", int)
type State = Literal["draft", "published"]


def make_user_id(value: int) -> UserId:
    if type(value) is not int:
        raise TypeError("value must be an integer")
    if value < 1:
        raise ValueError("value must be positive")
    return UserId(value)


def can_edit(state: State) -> bool:
    return state == "draft"


user_id = make_user_id(7)
print(user_id, type(user_id) is int)  # 7 True
print(can_edit("draft"))             # True
```

`Literal` restringe i valori per il checker, non valida una stringa esterna. `NewType` distingue staticamente domini che condividono una rappresentazione; la chiamata `UserId(value)` restituisce il valore senza validarlo o creare un oggetto wrapper. Qui la validazione e nella factory, che non impedisce a un altro chiamante di usare direttamente `UserId`. Non e uno strumento di autorizzazione.

### Any, object e cast

```python
from typing import cast

value: object = 42
claimed_text = cast(str, value)
print(type(claimed_text).__name__)  # int, non str
try:
    print(claimed_text.upper())
except AttributeError:
    print("cast did not convert the value")
```

Questo e un controesempio deliberato: `cast` dichiara al checker una conoscenza del programmatore, ma non controlla o converte nulla. L'errore viene intercettato per rendere osservabile il problema.

`object` puo rappresentare qualsiasi oggetto, ma prima di operazioni specifiche devi restringerne il tipo. `Any` consente invece operazioni non verificate e puo propagare questa perdita di controllo. Preferisci un confine esplicito all'uso indiscriminato di `Any` o `# type: ignore`.

### Overload

```python
from typing import overload


@overload
def decode(value: str) -> str:
    ...


@overload
def decode(value: bytes) -> str:
    ...


def decode(value: str | bytes) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


print(decode("ready"), decode(b"ready"))  # ready ready
```

Le firme overload sono viste dal checker; a runtime si usa l'unica implementazione finale. Non sono dispatch automatico. In questo caso una union basterebbe: l'esempio mostra la sintassi, utile soprattutto quando input diversi hanno ritorni diversi. Gli errori di decoding restano possibili.

### Callback e ParamSpec

```python
from collections.abc import Callable
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")


def traced(function: Callable[P, R]) -> Callable[P, R]:
    @wraps(function)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"call: {function.__name__}")
        return function(*args, **kwargs)
    return wrapper


@traced
def add(left: int, right: int, *, offset: int = 0) -> int:
    return left + right + offset


print(add(2, 3, offset=1))  # call: add, poi 6
```

`ParamSpec` conserva la relazione tra i parametri, `R` quella del risultato. `wraps` conserva metadati runtime, non sostituisce questa annotazione. Il wrapper e sincrono: per misurare l'esecuzione di una coroutine o di un generatore servono contratti dedicati.

Altri strumenti: `Self` per ritorni legati al tipo concreto dell'istanza o classe; `Final` per assegnazioni vietate dal checker, senza rendere immutabile l'oggetto; `TypeGuard` per predicate che guidano il narrowing. La firma di una guardia non dimostra che la sua implementazione sia corretta.

### mypy e Pyright

Installa i tool nell'ambiente di sviluppo e fissa le versioni nel workflow del progetto. Baseline provata: **mypy 2.4.0 e Pyright 1.1.414**. Non e necessario usare entrambi in ogni progetto.

Con `example.py` contenente un blocco completo della nota:

```powershell
python -m mypy --strict --python-version 3.12 example.py
```

Pyright CLI richiede Node. Installazione locale nel progetto dimostrativo, non globale:

```powershell
npm install --save-dev pyright
```

Configurazione `pyrightconfig.json`:

```json
{
  "include": ["example.py"],
  "pythonVersion": "3.12",
  "typeCheckingMode": "strict"
}
```

```powershell
npx --no-install pyright --project pyrightconfig.json
```

Per progetti con dipendenze installate, configura anche l'interprete/ambiente corretto e gli eventuali stub. Un import non risolto non si ripara nascondendo tutti gli errori con `Any`. I checker possono differire per inferenza, diagnostici e opzioni: usa la configurazione concordata, non la promessa generica di "tutto strict".

## Errori comuni

- Pensare che annotare un JSON o usare cast lo validi.
- Confondere chiave facoltativa, valore nullable e parametro con default.
- Usare runtime_checkable come controllo completo di una firma.
- Dimenticare casi vuoti, eccezioni e intervalli dei valori.
- Presentare overload come selezione runtime.
- Silenziare gli errori senza delimitare le zone dinamiche.

## Checklist

- I confini esterni vengono validati realmente?
- Ogni None viene gestito prima dell'uso?
- Sono dichiarati versione Python, checker e configurazione?
- Mutabilita e varianza dei contenitori sono compatibili con l'API?
- Generici e Protocol esprimono relazioni utili?
- I test verificano anche cio che il checker non puo dimostrare?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Enum|Enum]]
- [[Programmazione/Python/Pagine/Ereditarietà|ABC e duck typing]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Pydantic|Validazione con Pydantic]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [Python 3.12: typing](https://docs.python.org/3.12/library/typing.html).
- [Specifica del type system](https://typing.python.org/en/latest/spec/index.html).
- [mypy: riga di comando e strict](https://mypy.readthedocs.io/en/stable/command_line.html).
- [mypy: generics](https://mypy.readthedocs.io/en/stable/generics.html).
- [Pyright: configurazione](https://github.com/microsoft/pyright/blob/main/docs/configuration.md).
- [Python 3.12: annotazioni future](https://docs.python.org/3.12/library/__future__.html).
