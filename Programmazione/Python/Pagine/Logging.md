---
date: 2026-04-16
tags:
  - programmazione
  - python
  - logging
  - qualita
type: #permanent-note
status: budding
---

# Logging in Python

## 💡 Concetto Chiave
Il **logging** e il sistema standard per registrare eventi significativi durante l'esecuzione di un programma. Serve a osservare il comportamento del software, diagnosticare problemi, tracciare errori e capire cosa e successo in produzione o durante il debugging.

In Python, il modulo standard e `logging`, incluso nella Standard Library.

La differenza chiave rispetto a `print()` e che il logging:
- ha livelli di severita;
- e configurabile;
- puo scrivere su console, file o altri canali;
- e pensato per il software reale, non solo per debug temporaneo.

> [!INFO] Regola pratica
> `print()` e utile per esperimenti rapidi. `logging` e lo strumento corretto quando il messaggio fa parte dell'osservabilita del programma.

---

## 📝 Sintassi di base

### Configurazione minima

```python
import logging

logging.basicConfig(level=logging.INFO)

logging.debug("Messaggio di debug")
logging.info("Informazione")
logging.warning("Attenzione")
logging.error("Errore")
logging.critical("Errore critico")
```

### Livelli principali

- `DEBUG`: dettagli utili per sviluppo e diagnosi.
- `INFO`: eventi normali e significativi.
- `WARNING`: situazione anomala ma non fatale.
- `ERROR`: errore che impedisce una specifica operazione.
- `CRITICAL`: errore grave che puo compromettere l'applicazione.

---

## 💻 Esempi Pratici

### Logger dedicato per modulo

```python
import logging

logger = logging.getLogger(__name__)

def process_order(order_id: int) -> None:
    logger.info("Elaborazione ordine %s", order_id)
```

Usare `getLogger(__name__)` e la convenzione standard: ogni modulo ottiene il proprio logger e il nome del modulo entra automaticamente nella gerarchia dei logger.

### Logging su file

```python
import logging

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

logging.info("Applicazione avviata")
```

### Logging di eccezioni

```python
import logging

logger = logging.getLogger(__name__)

try:
    1 / 0
except ZeroDivisionError:
    logger.exception("Errore durante il calcolo")
```

`logger.exception()` registra il messaggio e include automaticamente traceback e contesto dell'eccezione. Questo si collega direttamente a [[Error Handling]].

---

## ⚙️ Funzionamento Interno (Teoria)

### Componenti principali
Il sistema di logging ruota attorno a quattro elementi principali:

- **Logger**: l'oggetto che emette i messaggi.
- **Handler**: decide dove inviare i messaggi, ad esempio console o file.
- **Formatter**: definisce il formato del messaggio.
- **Level**: decide quali messaggi passano e quali vengono ignorati.

### Flusso semplificato
Quando chiami:

```python
logger.info("Operazione completata")
```

succede, in sintesi:

1. il logger riceve l'evento;
2. controlla se il livello e sufficiente;
3. passa il record agli handler configurati;
4. ogni handler formatta e scrive il messaggio.

### Gerarchia dei logger
I logger in Python sono organizzati gerarchicamente, spesso seguendo il namespace dei moduli.

Esempio:
- `app`
- `app.api`
- `app.api.users`

Questa gerarchia permette configurazioni centralizzate e propagazione dei messaggi verso logger padre.

---

## 🧠 Perche usare il logging invece di `print()`

`print()`:
- scrive testo grezzo;
- non ha livelli;
- non ha routing configurabile;
- tende a restare nel codice piu del dovuto.

`logging`:
- distingue gravita e contesto;
- puo scrivere su piu destinazioni;
- puo essere filtrato;
- si integra meglio con applicazioni reali e tooling.

> [!TIP] Regola pratica
> Se il messaggio ti serve per capire lo stato del programma in modo ripetibile, usa il logging. Se stai solo facendo una prova rapida di pochi secondi, `print()` puo bastare.

---

## 📦 Configurazione pratica

Una configurazione semplice ma utile:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)
```

Campi comuni nel formatter:
- `%(asctime)s`: timestamp;
- `%(levelname)s`: livello del messaggio;
- `%(name)s`: nome del logger;
- `%(message)s`: testo del messaggio.

### Logging parametrizzato

```python
logger.info("Utente %s autenticato", username)
```

Questo approccio e preferibile a:

```python
logger.info(f"Utente {username} autenticato")
```

perche lascia al logging la gestione della formattazione e riduce lavoro inutile quando il livello e filtrato.

---

## 🔒 Cosa loggare e cosa non loggare

Ha senso loggare:
- eventi applicativi importanti;
- errori e warning;
- punti chiave di workflow;
- informazioni utili per diagnosi.

Non ha senso loggare indiscriminatamente:
- ogni singola riga di flusso;
- dati sensibili;
- password, token, segreti;
- log rumorosi che nessuno usera davvero.

Il logging utile ha abbastanza contesto per diagnosticare il problema, ma non abbastanza rumore da nasconderlo.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Usa `getLogger(__name__)` nei moduli:** mantiene ordine e gerarchia.
- ✅ **Scegli il livello giusto:** `INFO` non e `ERROR`, e `DEBUG` non va lasciato ovunque in produzione.
- ✅ **Logga contesto utile:** ID, stato, operazione, modulo.
- ✅ **Usa `logger.exception()` dentro `except`:** ottieni traceback senza lavoro manuale.
- ✅ **Configura un formato consistente:** timestamp, livello e nome modulo aiutano molto.
- ❌ **Non usare `print()` come sostituto del logging applicativo:** non scala e non si governa.
- ❌ **Non loggare dati sensibili:** password, chiavi API, token, dati personali non necessari.
- ❌ **Non abusare di `ERROR` o `CRITICAL`:** livelli troppo alti per eventi normali rendono i log inutili.
- 💣 **Attenzione al logging duplicato:** configurazioni multiple o handler ridondanti possono produrre messaggi ripetuti.
- 💣 **Attenzione al rumore:** troppi log rendono difficile trovare i segnali davvero importanti.

---
