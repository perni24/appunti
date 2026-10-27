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
  - Incapsulamento
prerequisites: []
related: []
title: Incapsulamento in Python
---

# Incapsulamento in Python

## Sintesi

Incapsulare significa esporre operazioni comprensibili e mantenere i dettagli interni sostituibili. In Python i prefissi dei nomi comunicano intenzioni, ma non costituiscono un sistema di autorizzazione.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

- Quando lo stato deve rispettare regole anche dopo la costruzione.
- Quando vuoi evitare che chiamanti dipendano da una lista o da un dizionario interno.
- Quando l'implementazione puo cambiare senza cambiare il modo di usare l'oggetto.

Un attributo pubblico semplice non e un errore. Aggiungi proprieta o metodi quando hanno una responsabilita concreta: validazione, calcolo o aggiornamento coerente di piu valori.

## Come funziona

| Nome       | Significato                                           | Cosa non garantisce                              |
| ---------- | ----------------------------------------------------- | ------------------------------------------------ |
| `name`     | Parte dell'interfaccia pubblica                       | Nessuna validazione implicita                    |
| `_name`    | Dettaglio non pubblico per convenzione                | L'accesso esterno resta possibile                |
| `__name`   | Name mangling all'interno della definizione di classe | Nessuna segretezza o protezione da codice ostile |
| `__name__` | Nome speciale previsto dal linguaggio, se documentato | Non e il modo di dichiarare un attributo privato |

Il name mangling riguarda nomi con almeno due underscore iniziali e al massimo uno finale. Il nome viene trasformato usando la classe in cui compare, per evitare collisioni accidentali con sottoclassi. Non usare nuovi nomi dunder arbitrari: quella convenzione e riservata ai protocolli del linguaggio.

L'incapsulamento comprende anche **alias e mutabilita**: impedire l'assegnazione di un attributo non impedisce di modificare l'oggetto che quell'attributo restituisce.

## API / Sintassi

Una proprieta senza setter blocca la riassegnazione pubblica, non il contenuto mutabile restituito. Questo e un controesempio deliberato:

```python
class ExposedTags:
    def __init__(self) -> None:
        self._tags: list[str] = []

    @property
    def tags(self) -> list[str]:
        return self._tags


example = ExposedTags()
example.tags.append("changed")
print(example.tags)  # ['changed']
# example.tags = [] solleverebbe AttributeError.
```

Anche `example._tags` resta accessibile. Per proteggere l'interfaccia da modifiche involontarie conviene non restituire direttamente il contenitore interno.

## Esempio pratico

La raccolta seguente accetta una lista di stringhe non vuote, normalizza gli spazi esterni e ne conserva una nuova lista. I duplicati sono ammessi. `add` e l'operazione pubblica di modifica; `tags` restituisce uno snapshot immutabile di stringhe.

```python
class TagCollection:
    def __init__(self, tags: list[str]) -> None:
        if not isinstance(tags, list):
            raise TypeError("tags must be a list")
        self._tags = [self._checked_tag(tag) for tag in tags]

    @staticmethod
    def _checked_tag(value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("tag must be a string")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("tag cannot be empty")
        return cleaned

    @property
    def tags(self) -> tuple[str, ...]:
        return tuple(self._tags)

    def add(self, tag: str) -> None:
        cleaned = self._checked_tag(tag)
        self._tags.append(cleaned)


source = [" python "]
collection = TagCollection(source)
snapshot = collection.tags
source.append("external")
collection.add(" notes ")

print(source)           # [' python ', 'external']
print(snapshot)         # ('python',)
print(collection.tags)  # ('python', 'notes')
```

La validazione avviene **prima** della mutazione: un `add` fallito non modifica la raccolta. Lo snapshot precedente non cambia quando si aggiunge un tag. Il costo della lettura e lineare nel numero di tag, perche viene costruita una tupla.

La tupla protegge qui anche i contenuti perche gli elementi sono stringhe immutabili. Una tupla di liste o una copia superficiale di un dizionario non renderebbe immutabili gli oggetti annidati. Per strutture grandi, valuta il costo di copie, viste e snapshot in base al contratto richiesto.

Per un esempio di saldo modificabile solo tramite operazioni validate, vedi [[Programmazione/Python/Pagine/Classi e Istanze|Classi e istanze]].

## Varianti

### Name mangling ed ereditarieta

Le due variabili `__value` non collidono perche sono state definite in classi diverse.

```python
class Base:
    def __init__(self) -> None:
        self.__value = "base"

    def base_value(self) -> str:
        return self.__value


class Child(Base):
    def __init__(self) -> None:
        super().__init__()
        self.__value = "child"

    def child_value(self) -> str:
        return self.__value


item = Child()
print(item.base_value(), item.child_value())  # base child
print(item._Base__value)                      # base
```

L'ultima riga dimostra che non si tratta di accesso vietato. Nei chiamanti ordinari non dipendere dai nomi trasformati: cambiare il nome della classe cambia anche quel dettaglio interno. Un singolo underscore e normalmente sufficiente per indicare implementazione non pubblica.

### Scegliere l'interfaccia

- Attributo pubblico: valore semplice senza invarianti particolari.
- Proprieta: accesso con sintassi da attributo, eventualmente validato o calcolato.
- Metodo: azione esplicita, soprattutto se modifica piu valori o ha effetti collaterali.
- Copia o snapshot: restituzione di dati senza concedere accesso diretto al contenitore interno.

Un getter manuale non e sempre sbagliato, ma non serve aggiungere `get_name` e `set_name` a ogni campo. Per operazioni costose o con I/O e piu trasparente un metodo che una proprieta apparentemente banale.

## Errori comuni

- Trattare `_name` come un modificatore `protected` imposto dal runtime.
- Nascondere credenziali in `__secret` pensando che siano protette.
- Restituire una lista interna da una proprieta dichiarata "read-only".
- Copiare il contenitore ma dimenticare gli oggetti mutabili annidati.
- Validare soltanto nel costruttore e consentire poi assegnazioni pubbliche incoerenti.
- Usare il doppio underscore senza un concreto problema di collisioni.

## Checklist

- Il contratto pubblico indica quali operazioni possono cambiare lo stato?
- I valori vengono validati prima di modificare l'oggetto?
- Il chiamante riceve un riferimento, una vista o una copia?
- Le copie sono superficiali o profonde?
- Una proprieta read-only restituisce oggetti mutabili?
- Le invarianti dipendono dal rispetto delle convenzioni, non da una falsa barriera di sicurezza?

## Collegamenti

- [[Programmazione/Python/Pagine/Proprietà|Proprieta]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e istanze]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/Python/Pagine/Liste|Liste, alias e copie]]
- [[Programmazione/Python/Indice Python|Indice Python]]

## Fonti

- [Tutorial Python: variabili private](https://docs.python.org/3.12/tutorial/classes.html#private-variables).
- [Riferimento: identificatori privati](https://docs.python.org/3.12/reference/expressions.html#private-name-mangling).
- [Modulo copy: copie superficiali e profonde](https://docs.python.org/3.12/library/copy.html).
