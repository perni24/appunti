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
  - concurrency
aliases:
  - Multiprocessing
  - Processi Python
prerequisites: []
related: []
title: Multiprocessing in Python
---

# Multiprocessing in Python

## Sintesi

`multiprocessing` avvia processi con interpreti e spazi di memoria separati. Nelle build CPython con GIL ogni processo ha il proprio GIL: lavori Python CPU-bound indipendenti possono quindi usare piu core.

Il parallelismo non implica un miglioramento automatico: avvio, serializzazione, trasferimento e memoria possono costare piu del calcolo. Un processo separato **non e una sandbox di sicurezza**: normalmente conserva i permessi dell'utente e l'accesso a file e rete.

Baseline degli esempi: **CPython 3.12.10 su Windows**, metodo `spawn` esplicito. Ogni blocco e uno script autonomo da eseguire come file `.py`; i worker definiti in REPL/notebook non sono una sostituzione portabile di un modulo importabile.

## Quando usarlo

- Calcoli indipendenti sufficientemente costosi.
- Elaborazioni suddivisibili in input e risultati serializzabili.
- Separazione del ciclo di vita dei worker, senza scambiarla per isolamento di sicurezza.
- Per invocare un programma esterno gia esistente, usare invece `subprocess`.

Prima misura una versione sequenziale. Limita processi e dimensione dei messaggi; non usare automaticamente un worker per ogni elemento.

## Come funziona

### Contesto di avvio e import

`spawn` avvia un interprete nuovo che importa il modulo. Le definizioni devono essere importabili; l'avvio del lavoro resta sotto `if __name__ == "__main__":`. Anche l'import di moduli ausiliari deve evitare effetti indesiderati.

`get_context("spawn")` seleziona il metodo per gli oggetti creati da quel contesto, senza imporre globalmente un metodo all'intera applicazione. Process, Queue, Lock e Value dello stesso insieme di worker devono essere compatibili.

Non memorizzare la regola "Linux usa sempre fork": i default dipendono da versione e piattaforma. In Python 3.14 fork non e piu il default su alcuna piattaforma; consulta la documentazione di quella release. Le varianti diverse da spawn non sono provate qui.

### La lista del figlio non e la lista del padre

```python
import multiprocessing as mp


def modify(values):
    values.append(99)


def main():
    context = mp.get_context("spawn")
    values = [1]
    process = context.Process(target=modify, args=(values,))
    process.start()
    process.join()
    exitcode = process.exitcode
    process.close()
    if exitcode != 0:
        raise RuntimeError(f"worker terminato con codice {exitcode}")
    return values


if __name__ == "__main__":
    print(main())  # [1]
```

`join` attende, non restituisce il risultato del target e non rilancia la sua eccezione. `exitcode` permette di rilevare la terminazione anomala; per trasmettere dati serve un canale esplicito.

Con `join(timeout=...)` verifica `is_alive()`: il timeout non arresta il processo. `close()` libera le risorse dell'oggetto Process e richiede che il processo non sia piu in esecuzione. Non e un sinonimo di terminate.

## API / Sintassi

### Pool per una funzione indipendente

```python
import multiprocessing as mp
from math import isqrt


def count_primes(limit):
    if type(limit) is not int or limit < 0:
        raise ValueError("atteso un limite intero non negativo")
    return sum(
        all(number % divisor for divisor in range(2, isqrt(number) + 1))
        for number in range(2, limit)
    )


def main():
    context = mp.get_context("spawn")
    with context.Pool(processes=2) as pool:
        results = pool.map(count_primes, [10, 20, 30, 40], chunksize=1)
    return results


if __name__ == "__main__":
    print(main())  # [4, 8, 10, 12]
```

Si contano i primi **minori** del limite. `isqrt` evita la conversione in floating point. Gli input piccoli rendono veloce il demo, non dimostrano che il pool convenga.

`map` restituisce nell'ordine degli input e propaga gli errori quando raccoglie i risultati. `imap` / `imap_unordered` consentono consumo incrementale, con ordinamento diverso; non assumere che questo basti a limitare ogni buffer interno.

Attenzione al ciclo di vita: l'uscita dal context manager di `multiprocessing.Pool` chiama terminate. Qui map ha gia completato. Con lavori asincroni non ancora raccolti, uscire dal with puo interromperli; per un drain ordinato servono `close()` e poi `join()`, con una strategia distinta per gli errori. Non confonderlo con il with di ProcessPoolExecutor, che attende i lavori.

### Messaggi con Queue e controllo del figlio

Il protocollo invia una coppia stato/valore. Anche un errore di validazione e un messaggio normale: il padre deve leggerne lo stato, non solo controllare exitcode.

```python
import multiprocessing as mp


def calculate(value, output):
    try:
        if type(value) is not int or value < 0:
            raise ValueError("atteso un intero non negativo")
        message = ("ok", value * value)
    except Exception as error:
        message = ("error", str(error))
    output.put(message)


def exchange(value):
    context = mp.get_context("spawn")
    output = context.Queue()
    process = context.Process(target=calculate, args=(value, output))
    try:
        process.start()
        message = output.get(timeout=10)
        process.join(timeout=10)
        if process.is_alive():
            raise TimeoutError("worker ancora attivo")
        if process.exitcode != 0:
            raise RuntimeError(f"worker fallito: {process.exitcode}")
        return message
    finally:
        if process.pid is not None:
            if process.is_alive():
                process.terminate()
            process.join()
        process.close()
        output.close()
        output.join_thread()


if __name__ == "__main__":
    print(exchange(5))  # ('ok', 25)
```

Il padre legge **prima** di join: attendere il produttore prima di drenare una Queue puo bloccare entrambi, perche il figlio aspetta di svuotare il buffer nel pipe. `get` puo sollevare `queue.Empty` se non arriva un messaggio; exitcode e protocollo sono controlli separati.

I dieci secondi sono due attese locali, non una deadline totale. La terminazione forzata nel finally e solo un ripiego per questo worker isolato: puo saltare finally e corrompere risorse condivise. La Queue viene scartata, non riusata. Il demo non gestisce una gerarchia di figli, crash del padre o scritture esterne da recuperare.

Gli oggetti passano tramite pickle: non condividono l'identita con il mittente. `put` puo usare un feeder thread; non mutare il messaggio subito dopo l'invio. I messaggi del demo sono piccoli e composti da valori semplici. Mai ricevere pickle da una controparte non fidata.

## Esempio pratico

### Memoria condivisa: anche += richiede un lock

```python
import multiprocessing as mp


def increment(counter, repeats):
    for _ in range(repeats):
        with counter.get_lock():
            counter.value += 1


def main():
    context = mp.get_context("spawn")
    counter = context.Value("i", 0)
    processes = [
        context.Process(target=increment, args=(counter, 500))
        for _ in range(4)
    ]
    for process in processes:
        process.start()
    for process in processes:
        process.join()
    exitcodes = [process.exitcode for process in processes]
    for process in processes:
        process.close()
    if any(code != 0 for code in exitcodes):
        raise RuntimeError(f"worker falliti: {exitcodes}")
    return counter.value


if __name__ == "__main__":
    print(main())  # 2000
```

La sincronizzazione del wrapper Value non rende atomica la sequenza lettura-modifica-scrittura di `+=`: il lock deve coprirla interamente. Anche il tipo numerico ha capacita finita; questi valori restano piccoli.

I due demo di Process manuali mostrano il percorso normale e il controllo degli exit code, non un supervisore resistente a interruzioni o avvii parzialmente falliti. Per task indipendenti, l'executor riduce il codice di coordinamento.

## Varianti

- `Pipe`: comunicazione con estremita esplicite da chiudere; attenzione a EOF e a lettori/scrittori concorrenti.
- `Queue`: messaggi serializzati. Non ha task_done/join dei job; per quel contratto esiste `JoinableQueue`.
- `Value` / `Array`: valori condivisi con sincronizzazione da progettare.
- `SharedMemory`: buffer condivisi; servono layout, sincronizzazione, close e responsabilita di unlink esplicite, non soltanto un nome condiviso.
- `Manager`: proxy verso oggetti gestiti da un processo server; le chiamate hanno un costo e una sequenza di operazioni non diventa automaticamente atomica.
- `ProcessPoolExecutor`: Future e raccolta uniforme di risultati/errori.
- Code di task esterne: utili per persistenza e distribuzione, non un comportamento fornito da multiprocessing.

## Errori comuni

- Creare processi durante l'import o passare lambda/local function non importabili.
- Credere che fork eviti la serializzazione dei task inviati a un pool.
- Usare una sentinella `object()` confrontata con is dopo serializzazione: l'identita non attraversa i processi.
- Fare join del produttore mentre i suoi messaggi non vengono consumati.
- Usare terminate per una chiusura normale, con lock o transazioni aperti.
- Inviare grandi oggetti ripetutamente e ignorare RAM/trasferimenti.
- Usare un processo come barriera contro codice ostile.

## Checklist

- Worker e modulo principale sono importabili senza avviare altro lavoro?
- Il metodo di avvio e esplicito o documentato?
- I dati sono fidati, picklable e di dimensione ragionevole?
- Esiste un protocollo per risultato, errore, timeout e arresto?
- Il padre raccoglie risultati ed exit code e chiude risorse?
- Il guadagno e misurato includendo avvio e trasferimenti?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]

## Fonti

- [Python 3.12: multiprocessing e raccomandazioni](https://docs.python.org/3.12/library/multiprocessing.html).
- [Python 3.14: contesti e metodi di avvio](https://docs.python.org/3.14/library/multiprocessing.html#contexts-and-start-methods), verifica documentale, non baseline eseguita.
- [Python 3.12: pickle e oggetti serializzabili](https://docs.python.org/3.12/library/pickle.html).
- [Python 3.12: shared_memory e ciclo di vita](https://docs.python.org/3.12/library/multiprocessing.shared_memory.html).
- [Python 3.12: ProcessPoolExecutor](https://docs.python.org/3.12/library/concurrent.futures.html#processpoolexecutor).
