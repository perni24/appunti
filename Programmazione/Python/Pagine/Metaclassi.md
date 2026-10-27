---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
tags:
  - programmazione
  - python
  - internals
  - oop
aliases: []
prerequisites: []
related: []
title: Metaclassi
---

# Metaclassi

## Sintesi

Una classe Python e un oggetto; la sua metaclasse ne controlla la creazione. Normalmente la metaclasse e `type`. Una metaclasse personalizzata serve a cambiare quel processo, non a sostituire indiscriminatamente costruttori e decorator.

Riferimento Python 3.12; esempi indipendenti verificati con **CPython 3.12.10 su Windows**.

## Problema che risolve

Le metaclassi sono utili quando un framework deve intervenire prima o durante la costruzione della classe, per esempio preparando il namespace o imponendo convenzioni comuni a una gerarchia.

Prima considera alternative piu semplici:

- una funzione factory, se devi produrre oggetti o una classe su richiesta;
- un decorator di classe, se vuoi trasformare una classe gia creata;
- `__init_subclass__`, se vuoi configurare o registrare sottoclassi;
- un descriptor, se vuoi gestire singoli attributi.

## Concetto chiave

### Istanza, classe e metaclasse

```python
class Plugin:
    pass

plugin = Plugin()
print(type(plugin) is Plugin)  # True
print(type(Plugin) is type)  # True
print(isinstance(Plugin, type))  # True

Dynamic = type("Dynamic", (), {"category": "demo"})
print(Dynamic().category)  # demo
```

`type(obj)` interroga il tipo; `type(name, bases, namespace)` costruisce una classe. Non usare la seconda forma solo per evitare una normale dichiarazione `class`.

### Ordine di creazione

Nel caso ordinario con basi gia risolte:

1. si sceglie una metaclasse compatibile con quelle delle basi;
2. `__prepare__` prepara il mapping in cui viene eseguito il corpo della classe;
3. la metaclasse riceve nome, basi e namespace;
4. `type.__new__` costruisce la classe e attiva hook come `__set_name__` e `__init_subclass__`;
5. segue l'inizializzazione della classe da parte della metaclasse;
6. i decorator di classe ricevono il risultato.

`__init_subclass__` viene chiamato sulla catena delle basi per configurare la nuova sottoclasse, non per creare un'istanza.

```python
events = []

class TracingMeta(type):
    @classmethod
    def __prepare__(mcls, name, bases, **kwargs):
        events.append("prepare")
        return super().__prepare__(name, bases, **kwargs)

    def __new__(mcls, name, bases, namespace, **kwargs):
        events.append("meta-new")
        return super().__new__(mcls, name, bases, namespace, **kwargs)

    def __init__(cls, name, bases, namespace, **kwargs):
        events.append("meta-init")
        super().__init__(name, bases, namespace, **kwargs)

class Field:
    def __set_name__(self, owner, name):
        events.append("set-name")

class Base:
    def __init_subclass__(cls, **kwargs):
        events.append("init-subclass")
        super().__init_subclass__(**kwargs)

def decorate(cls):
    events.append("decorator")
    return cls

@decorate
class Example(Base, metaclass=TracingMeta):
    events.append("body")
    field = Field()

print(events)
# ['prepare', 'body', 'meta-new', 'set-name',
#  'init-subclass', 'meta-init', 'decorator']
```

Il corpo della classe e codice eseguito subito: registrazioni e altri effetti avvengono normalmente durante l'importazione del modulo. Non confondere `TracingMeta.__new__`, che crea una classe, con `Example.__new__`, che partecipa alla creazione delle sue istanze.

## Dettagli importanti

### Cooperazione e namespace

Se sovrascrivi gli hook, delega con `super()` e gestisci soltanto le keyword di cui sei responsabile. Nell'ereditarieta multipla una base puo consumare una keyword e inoltrare le altre.

Non filtrare arbitrariamente il namespace. In CPython il compilatore puo inserirvi `__classcell__`, necessaria per `__class__` e `super()` senza argomenti: deve arrivare a `type.__new__`.

Due basi con metaclassi incompatibili producono un conflitto: Python richiede una metaclasse derivata compatibile, non sceglie semplicemente “la prima”. Combinarle meccanicamente non garantisce che i loro comportamenti cooperino.

### Alternativa con **init_subclass**

```python
class NamedPlugin:
    def __init_subclass__(cls, *, key, **kwargs):
        if not isinstance(key, str) or not key.strip():
            raise ValueError("key deve essere una stringa non vuota")
        super().__init_subclass__(**kwargs)
        cls.key = key

class CsvPlugin(NamedPlugin, key="csv"):
    pass

print(CsvPlugin.key)  # csv
print(type(CsvPlugin) is type)  # True: nessuna metaclasse personalizzata
```

Questo contratto richiede `key` a ogni nuova sottoclasse. Gli hook hanno responsabilita diverse: `__set_name__` riguarda il singolo attributo; `__init_subclass__` la nuova sottoclasse; il decorator lavora sul risultato.

## Esempio

### Registro esplicito senza collisioni silenziose

Il registro seguente usa chiavi esplicite, non solo il nome della classe, e rifiuta duplicati. Registra soltanto classi che dichiarano `plugin_key` nel proprio corpo, non la base e non le sottoclassi che si limitano a ereditarlo.

```python
class RegistryMeta(type):
    registry = {}

    def __new__(mcls, name, bases, namespace, **kwargs):
        key = namespace.get("plugin_key")
        if key is not None:
            if not isinstance(key, str) or not key.strip():
                raise ValueError("plugin_key deve essere una stringa non vuota")
            if key in mcls.registry:
                raise ValueError(f"Chiave plugin duplicata: {key}")
        cls = super().__new__(mcls, name, bases, namespace, **kwargs)
        if key is not None:
            mcls.registry[key] = cls
        return cls

class Plugin(metaclass=RegistryMeta):
    pass

class CsvPlugin(Plugin):
    plugin_key = "csv"

class SpecializedCsv(CsvPlugin):
    pass

print(RegistryMeta.registry["csv"] is CsvPlugin)  # True
print(len(RegistryMeta.registry))  # 1
```

La chiave non viene normalizzata: `"csv"` e `"CSV"` restano distinte. Le classi devono essere importate per registrarsi; non c'e discovery automatico dei file o dei package.

Il registro e condiviso dalla metaclasse del demo e trattiene riferimenti alle classi. Non implementa unload, reload, sicurezza dei plugin o sincronizzazione. Modificare `plugin_key` dopo la creazione non aggiorna il dizionario. Un decorator che sostituisce la classe puo inoltre lasciare nel registro il riferimento alla classe precedente.

Anche questa registrazione spesso puo essere implementata con `__init_subclass__`. L'esempio serve a mostrare dove interviene la metaclasse, non a raccomandarla per ogni sistema plugin.

## Limiti

- Un errore durante la creazione non annulla automaticamente gli effetti gia eseguiti nel corpo o negli hook.
- Sovrascrivere `__call__` della metaclasse modifica la costruzione delle istanze: e un punto di estensione diverso, non necessario al registro.
- Una metaclasse non e una sandbox e puo rendere import e debugging piu complessi.
- Metaclassi di framework diversi possono avere contratti incompatibili anche se il conflitto di ereditarieta viene risolto.

## Errori comuni

- Registrare automaticamente anche la base senza volerlo.
- Sovrascrivere una voce usando nomi di classe non univoci.
- Aspettarsi che l'ereditarieta ripeta ogni hook dell'attributo.
- Perdere `__classcell__` copiando solo una parte del namespace.
- Usare metaclassi prima di valutare factory, decorator e `__init_subclass__`.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarieta]]

## Fonti

- [Python 3.12: personalizzazione della creazione delle classi](https://docs.python.org/3.12/reference/datamodel.html#customizing-class-creation).
- [PEP 3115: preparazione del namespace e metaclassi](https://peps.python.org/pep-3115/).
- [PEP 487: hook piu semplici e alternative alle metaclassi](https://peps.python.org/pep-0487/).
- [Python 3.12: type](https://docs.python.org/3.12/library/functions.html#type).
