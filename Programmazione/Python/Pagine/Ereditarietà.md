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
  - Ereditarietà
prerequisites: []
related: []
title: Ereditarietà in Python
---

# Ereditarietà in Python

## Sintesi

L'ereditarieta definisce una specializzazione di un tipo: una sottoclasse puo riusare o sostituire il comportamento della classe base. Non basta condividere qualche metodo per avere una buona relazione "is-a": il codice che accetta la base deve poter usare anche la sottoclasse senza sorprese.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

- Per implementare una stessa interfaccia in piu modi.
- Per estendere una classe progettata per essere specializzata.
- Per piccoli mixin cooperativi, quando l'ordine di composizione e documentato.

Preferisci la composizione quando un oggetto **usa** un altro oggetto: un servizio usa un notificatore, non e un notificatore. Una gerarchia non e necessaria per ogni riuso di codice.

## Come funziona

### Override e inizializzazione

Se una sottoclasse definisce un metodo gia presente nella base, lo sostituisce nella ricerca del metodo per le sue istanze. Anche una chiamata `self.method()` effettuata dalla base puo raggiungere l'override: chiamare metodi sovrascrivibili durante `__init__` e rischioso se lo stato della sottoclasse non e ancora pronto.

Una sottoclasse senza `__init__` proprio puo ereditare quello della base. Se lo definisce, Python **non aggiunge automaticamente** una chiamata all'inizializzazione della base: deve provvedervi il codice, quando necessaria.

### super e MRO

`super()` non significa "chiama sempre il padre diretto". Dentro un normale metodo, cerca l'implementazione successiva alla classe corrente nella **MRO dell'istanza effettiva**. La MRO e l'ordine di risoluzione dei metodi, consultabile con `Classe.__mro__`; Python usa una linearizzazione C3 che conserva i vincoli d'ordine della gerarchia.

In una gerarchia cooperativa, ogni metodo coinvolto chiama `super()` una volta con argomenti compatibili. Saltare una chiamata interrompe la catena; chiamare esplicitamente piu basi puo eseguire due volte un antenato comune. Gerarchie con vincoli d'ordine contraddittori vengono rifiutate con `TypeError` alla creazione della classe.

## API / Sintassi

Questo esempio usa una classe astratta per richiedere `send`. Il notificatore scrive soltanto su standard output: non invia email e non accede alla rete.

```python
from abc import ABC, abstractmethod


class Notification(ABC):
    def __init__(self, prefix: str) -> None:
        self.prefix = prefix

    @abstractmethod
    def send(self, message: str) -> None:
        raise NotImplementedError


class ConsoleNotification(Notification):
    def __init__(self, prefix: str = "info") -> None:
        super().__init__(prefix)

    def send(self, message: str) -> None:
        print(f"[{self.prefix}] {message}")


notifier = ConsoleNotification("build")
notifier.send("completed")                  # [build] completed
print(isinstance(notifier, Notification))  # True
print(issubclass(ConsoleNotification, Notification))  # True
```

`ABC` insieme ad `abstractmethod` impedisce di istanziare una classe con metodi astratti non implementati. Scrivere soltanto `raise NotImplementedError` non rende astratta una classe: l'errore arriverebbe quando viene chiamato quel metodo.

Una ABC puo contenere stato e metodi concreti; persino un metodo astratto puo avere un corpo richiamabile con `super()`. Il meccanismo non verifica automaticamente firme, risultati o correttezza semantica dell'override.

## Esempio pratico

### Un diamante cooperativo

Ogni metodo aggiunge il proprio nome alla sequenza restituita dal successivo. `Root` termina intenzionalmente la catena.

```python
class Root:
    def steps(self) -> list[str]:
        return ["root"]


class Left(Root):
    def steps(self) -> list[str]:
        return ["left"] + super().steps()


class Right(Root):
    def steps(self) -> list[str]:
        return ["right"] + super().steps()


class Combined(Left, Right):
    pass


print(Combined().steps())  # ['left', 'right', 'root']
print([cls.__name__ for cls in Combined.__mro__])
# ['Combined', 'Left', 'Right', 'Root', 'object']
```

Nell'esecuzione di `Left.steps` su una `Combined`, `super().steps()` arriva a `Right`, non direttamente a `Root`. Invertire l'ordine delle basi cambia il percorso.

Per `__init__` cooperativi con parametri diversi, ogni classe deve consumare i propri argomenti e inoltrare soltanto quelli previsti dalle altre. Non basta aggiungere `**kwargs` ovunque: gli argomenti non consumati non possono arrivare senza controllo a `object.__init__`.

### Composizione e duck typing

Il servizio delega l'output a un collaboratore. Il registratore rende l'esempio verificabile senza servizi esterni.

```python
class RecordingNotifier:
    def __init__(self) -> None:
        self.messages: list[str] = []

    def send(self, message: str) -> None:
        self.messages.append(message)


class ReportService:
    def __init__(self, notifier) -> None:
        self._notifier = notifier

    def finish(self, report_name: str) -> None:
        self._notifier.send(f"ready: {report_name}")


recorder = RecordingNotifier()
service = ReportService(recorder)
service.finish("monthly")
print(recorder.messages)  # ['ready: monthly']
```

Qui conta che il collaboratore offra `send`: non occorre una base comune. Questa e una forma di **duck typing**; se il metodo manca, l'errore emerge alla chiamata. Per descrivere questo contratto a un type checker si puo usare un `Protocol`, trattato in [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]. Un controllo statico non equivale a validazione automatica dei dati in ingresso.

## Varianti

| Scelta                | Contratto principale                               | Limite                                       |
| --------------------- | -------------------------------------------------- | -------------------------------------------- |
| Ereditarieta concreta | Riuso e specializzazione della base                | Forte dipendenza da API e stato della base   |
| ABC                   | Interfaccia nominale con operazioni astratte       | Non prova il comportamento corretto          |
| Duck typing           | Operazioni effettivamente usate a runtime          | Errori possibili solo all'uso                |
| Protocol              | Compatibilita strutturale per il controllo statico | Non sostituisce controlli runtime sui valori |
| Composizione          | Delega a un collaboratore sostituibile             | Richiede definire chiaramente la delega      |
| Mixin                 | Comportamento limitato da combinare                | Dipendenze e MRO devono essere comprensibili |

Un override dovrebbe accettare gli usi validi per la base, rispettarne i risultati promessi e non introdurre precondizioni inattese. `isinstance` e `issubclass` riconoscono relazioni tra tipi, non dimostrano queste proprieta.

## Errori comuni

- Usare ereditarieta soltanto per evitare due righe duplicate.
- Confondere `super()` con un riferimento fisso a una base.
- Ridefinire `__init__` dimenticando lo stato richiesto dai metodi ereditati.
- Pensare che `NotImplementedError` e `NotImplemented` siano intercambiabili.
- Modificare la firma di un override rompendo chi usa la classe base.
- Aggiungere mixin che chiamano metodi assenti o dipendono da un ordine non documentato.

## Checklist

- La sottoclasse e sostituibile alla base per gli usi previsti?
- La MRO e chiara, soprattutto con piu basi?
- Le inizializzazioni necessarie vengono eseguite una volta sola?
- Ogni metodo cooperativo inoltra argomenti compatibili?
- L'interfaccia astratta e accompagnata da test di comportamento?
- La composizione renderebbe la dipendenza piu semplice?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e istanze]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi speciali]]
- [[Programmazione/Python/Pagine/Metodi di classe e statici|Factory e sottoclassi]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting e Protocol]]
- [[Programmazione/Python/Indice Python|Indice Python]]

## Fonti

- [Tutorial Python: ereditarieta](https://docs.python.org/3.12/tutorial/classes.html#inheritance).
- [Funzione super](https://docs.python.org/3.12/library/functions.html#super).
- [Abstract Base Classes](https://docs.python.org/3.12/library/abc.html).
- [Descrizione della MRO di Python](https://docs.python.org/3.12/howto/mro.html).
