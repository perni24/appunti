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
  - Classi e Istanze
prerequisites: []
related: []
title: Classi e Istanze in Python
---

# Classi e Istanze in Python

## Sintesi

Una classe e un oggetto che definisce un tipo; un'istanza e un oggetto di quel tipo con il proprio stato. I metodi coordinano operazioni sui dati e possono mantenere invarianti, cioe condizioni che devono restare vere dopo ogni operazione pubblica.

Riferimento: Python 3.12; esempi verificati sulla baseline CPython 3.12.10. Le annotazioni aiutano la lettura ma non validano automaticamente gli input.

## Quando usarlo

- Dati e operazioni formano un concetto stabile: un ordine, una sessione o una configurazione con comportamento.
- Serve piu di un dizionario, perche esistono regole e transizioni da rispettare.
- Occorrono piu istanze indipendenti dello stesso comportamento.

Una funzione basta per una trasformazione senza stato. Una dataclass e spesso adatta a un record di dati: non serve una classe manuale per ogni struttura.

## Come funziona

### Creazione e inizializzazione

Nella costruzione ordinaria, `__new__` crea l'istanza e `__init__` la inizializza. `__init__` deve restituire `None`, non un oggetto alternativo. Di norma basta implementare `__init__`; la personalizzazione di `__new__` e un tema avanzato.

`self` e il nome convenzionale del primo parametro del metodo, non una parola chiave. Con `obj.method()` il binding passa automaticamente `obj`; per una normale funzione definita nella classe, `Class.method(obj)` e l'invocazione esplicita corrispondente.

### Attributi di istanza e di classe

Lo stato per-oggetto si inizializza normalmente con `self.name = value`. Un attributo sul corpo della classe puo invece fare da default condiviso. Nell'accesso ordinario un attributo d'istanza puo mascherare quello di classe; property e altri descriptor hanno regole ulteriori.

## API / Sintassi

Il primo esempio conserva un indirizzo come semplice stringa: non verifica che sia una email valida.

```python
class User:
    role = "user"

    def __init__(self, email: str) -> None:
        self.email = email
        self.active = True

    def deactivate(self) -> None:
        self.active = False


first = User("ada@example.com")
second = User("lin@example.com")
first.deactivate()
first.role = "editor"
print(first.active, second.active)
print(first.role, second.role, User.role)
print(first.deactivate.__self__ is first)
```

Output: `False True`, `editor user user` e `True`. Assegnare `first.role` non modifica `User.role` ne `second.role`.

### Mutazione condivisa e alias

```python
class SharedTags:
    tags = []


left = SharedTags()
right = SharedTags()
left.tags.append("python")
print(right.tags)


class PersonalTags:
    def __init__(self) -> None:
        self.tags = []


one = PersonalTags()
two = PersonalTags()
one.tags.append("python")
alias = one
alias.tags.append("notes")
print(one.tags, two.tags)
```

La prima lista e condivisa; le liste di `PersonalTags` sono distinte. `alias = one` non crea una copia. Anche `self.tags = supplied_list` conserverebbe un alias all'input; copia o condivisione devono essere scelte esplicite.

## Esempio pratico

Conto didattico con importi espressi in **centesimi interi**. Sono accettati soltanto `int` esatti: booleani, float e stringhe vengono rifiutati, senza conversioni implicite.

```python
class BankAccount:
    def __init__(self, owner: str, balance_cents: int = 0) -> None:
        if not isinstance(owner, str):
            raise TypeError("owner must be a string")
        if not owner.strip():
            raise ValueError("owner cannot be empty")
        self._check_amount(balance_cents, allow_zero=True)
        self.owner = owner.strip()
        self._balance_cents = balance_cents

    @staticmethod
    def _check_amount(value: int, *, allow_zero: bool = False) -> None:
        if type(value) is not int:
            raise TypeError("amount must be an int, excluding bool")
        minimum = 0 if allow_zero else 1
        if value < minimum:
            raise ValueError("amount out of range")

    @property
    def balance_cents(self) -> int:
        return self._balance_cents

    def deposit(self, amount_cents: int) -> None:
        self._check_amount(amount_cents)
        self._balance_cents += amount_cents

    def withdraw(self, amount_cents: int) -> None:
        self._check_amount(amount_cents)
        if amount_cents > self._balance_cents:
            raise ValueError("insufficient funds")
        self._balance_cents -= amount_cents


account = BankAccount("Ada", 1000)
account.deposit(250)
account.withdraw(400)
print(account.balance_cents)
```

Output: `850`. I controlli avvengono **prima** della mutazione: importi negativi o fondi insufficienti non cambiano il saldo. La property impedisce la normale assegnazione a `balance_cents`; il backing field resta accessibile per convenzione Python.

Limiti: una sola valuta implicita, nessun interesse, persistenza, autenticazione o transazione. Non e un sistema bancario ne una classe thread-safe. Le operazioni pubbliche mantengono l'invariante soltanto se il codice chiamante rispetta l'API e non modifica direttamente gli interni.

## Varianti

- Classi con property: regole di lettura e assegnazione mantenendo la sintassi degli attributi.
- Dataclass: generazione dei metodi ripetitivi per record.
- Composizione: una classe contiene collaboratori invece di ereditare ogni comportamento.
- Ereditarieta: specializzazione che deve rispettare il contratto della base.
- `__slots__`: limita gli attributi in alcune gerarchie e puo ridurre memoria; non rende privato o immutabile lo stato.
- Confronti: senza una definizione di uguaglianza per valore, normali istanze distinte non diventano uguali solo perche hanno attributi uguali. Vedi Metodi Speciali.

## Errori comuni

- Confondere `__init__` con una funzione che deve restituire l'oggetto.
- Mutare una lista di classe pensando che appartenga a una sola istanza.
- Pensare che assegnazione e passaggio di parametri copino gli oggetti.
- Accettare un prelievo negativo o confrontare soltanto il saldo senza validare il tipo.
- Fare I/O o aprire risorse nel costruttore senza una politica di errore e cleanup.
- Considerare underscore e property barriere contro codice ostile.

## Checklist

- Stato condiviso e stato per-istanza sono distinti?
- Sono chiari alias e copie degli input?
- Il costruttore crea un oggetto valido?
- Un errore previsto lascia lo stato precedente intatto?
- Funzioni o dataclass renderebbero il caso piu semplice?
- Concorrenza e persistenza sono requisiti espliciti, non presunti?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarietà]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Python/Pagine/Proprietà|Proprietà]]

## Fonti

- [Python 3.12: classi, attributi e binding](https://docs.python.org/3.12/tutorial/classes.html).
- [Python 3.12: creazione degli oggetti](https://docs.python.org/3.12/reference/datamodel.html#basic-customization).
- [Python 3.12: assegnazione e copie](https://docs.python.org/3.12/library/copy.html).
