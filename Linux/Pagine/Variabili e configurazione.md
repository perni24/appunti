---
date: 2026-07-13
area: Linux
topic: Configurazione degli script e dei servizi
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, bash, configurazione, environment, secrets]
aliases: [Configurazione script, Variabili di configurazione]
prerequisites: [Bash scripting, Variabili ambiente e PATH, Variabili e quoting]
related: [Script robusti, Unit e dipendenze systemd, Principio del minimo privilegio]
---

# Variabili e configurazione

## Sintesi

Uno script puo ricevere configurazione da default interni, file, variabili d'ambiente e opzioni CLI. La precedenza deve essere esplicita e stabile, per esempio `default < file < ambiente < CLI`, e ogni valore deve essere validato dopo avere applicato tutti gli override.

Le variabili shell non vengono ereditate automaticamente dai processi figli; soltanto quelle esportate entrano nell'ambiente. L'ambiente e utile per configurazione non sensibile, ma non e un deposito segreto: puo essere esposto a processi autorizzati, dump, log o tracing.

## Quando usarlo

- Separare il comportamento dello script dal codice.
- Configurare lo stesso job in sviluppo, test e produzione.
- Passare parametri a servizi systemd e job schedulati.
- Definire default e requisiti con errori chiari.
- Gestire configurazione e segreti con canali differenti.

## Come funziona

Una variabile Bash e locale alla shell finche non viene marcata con `export`. Un processo figlio riceve una copia dell'ambiente; le sue modifiche non tornano al processo padre.

Le espansioni principali per i default sono:

| Espressione | Comportamento |
| --- | --- |
| `${VAR-default}` | usa `default` solo se `VAR` non e impostata |
| `${VAR:-default}` | usa `default` se `VAR` non e impostata o e vuota |
| `${VAR:=default}` | assegna il default se assente o vuota |
| `${VAR:?messaggio}` | termina l'espansione con errore se assente o vuota |

Stringhe come `false`, `0` e `no` sono comunque non vuote: Bash non le converte automaticamente in booleani. Numeri, hostname, percorsi, enum e durate devono essere validati secondo il dominio.

Un file `.env` non ha una specifica universale. La sintassi accettata da Bash, systemd, Docker Compose e librerie dotenv puo differire per quoting, escape, espansioni e commenti. Il produttore e il consumatore devono essere espliciti.

Usare `source file` esegue il contenuto come codice shell. E accettabile soltanto per configurazione Bash fidata, con ownership e permessi controllati; non e un parser sicuro per input esterno.

I segreti dovrebbero arrivare da file protetti, credential system, secret manager o file descriptor, secondo il servizio. Anche quando un file e cifrato a riposo, il processo deve poter accedere al valore in chiaro durante l'uso.

## API / Sintassi

Mostrare una singola variabile d'ambiente senza elencare possibili segreti:

```bash
printenv PATH
```

Eseguire uno script con un override valido solo per quel processo:

```bash
APP_MODE=test ./app-wrapper
```

Eseguire con un ambiente minimale e valori espliciti:

```bash
env -i HOME="$HOME" PATH=/usr/bin:/bin APP_MODE=test ./app-wrapper
```

Mostrare come Bash rappresenta una variabile nota:

```bash
declare -p APP_MODE
```

Creare un file ambiente vuoto con permessi restrittivi:

```bash
sudo install -o root -g app -m 0640 /dev/null /etc/app/app.env
```

Validare una unit systemd che usa il file ambiente:

```bash
systemd-analyze verify /etc/systemd/system/app.service
```

## Esempio pratico

Uno script puo richiedere un endpoint e applicare un default alla durata:

```bash
#!/usr/bin/env bash
set -u

: "${APP_ENDPOINT:?APP_ENDPOINT non impostata}"
APP_TIMEOUT=${APP_TIMEOUT:-10}

if [[ ! $APP_TIMEOUT =~ ^[1-9][0-9]*$ ]]; then
    printf 'APP_TIMEOUT deve essere un intero positivo\n' >&2
    exit 2
fi

readonly APP_ENDPOINT APP_TIMEOUT
printf 'Endpoint: %s, timeout: %ss\n' "$APP_ENDPOINT" "$APP_TIMEOUT"
```

Una unit systemd puo importare valori non sensibili da un file dedicato:

```ini
[Service]
EnvironmentFile=/etc/app/app.env
ExecStart=/usr/local/bin/app-wrapper
```

Il file `/etc/app/app.env` puo contenere:

```text
APP_ENDPOINT=https://service.example
APP_TIMEOUT=20
```

Proteggere il file secondo l'utente del servizio, validare la unit e verificare la configurazione effettiva senza stampare segreti nei log.

## Varianti

- Le opzioni CLI sono esplicite per invocazione e hanno spesso precedenza piu alta.
- I file di configurazione strutturati YAML, TOML o JSON richiedono parser reali, non sostituzioni testuali ad hoc.
- `Environment=` e `EnvironmentFile=` di systemd impostano l'ambiente della unit con sintassi documentata da `systemd.exec`.
- Le credential di systemd possono fornire file di credenziali al servizio senza inserirle direttamente nell'ambiente.
- I file drop-in di systemd modificano una unit senza copiare l'intero file fornito dal pacchetto.
- `readonly` impedisce riassegnazioni accidentali nella shell corrente, non protegge il dato da lettura.
- Un secret manager centralizza accesso, audit e rotazione, ma introduce una dipendenza operativa da progettare.

## Errori comuni

- Non documentare la precedenza tra default, file, ambiente e CLI.
- Confondere variabile shell ed environment variable.
- Usare `${VAR-default}` quando anche il valore vuoto dovrebbe attivare il default, o viceversa.
- Interpretare qualsiasi stringa non vuota come booleano corretto.
- Eseguire con `source` un file modificabile da utenti o processi non fidati.
- Presumere che tutti i file `.env` abbiano la stessa grammatica.
- Passare password nella riga di comando, dove possono apparire in history e lista processi.
- Stampare l'intero ambiente durante il debug.
- Inserire segreti in repository, immagini, unit o log senza protezione.
- Cambiare configurazione senza validazione, reload controllato e rollback.

## Checklist

- Fonti e ordine di precedenza della configurazione sono documentati?
- Valori richiesti, default e significato del vuoto sono espliciti?
- Ogni valore e validato dopo gli override?
- La grammatica del file e quella del consumatore reale?
- Ownership e permessi impediscono modifiche non autorizzate?
- Configurazione non sensibile e segreti usano canali appropriati?
- Log, tracing e diagnostica evitano di esporre valori sensibili?
- Il servizio riceve soltanto le variabili necessarie?
- Modifiche possono essere testate e annullate prima del reload?
- Chiavi e credenziali possono essere ruotate senza cambiare il codice?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash scripting|Bash scripting]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Script robusti|Script robusti]]
- [[Linux/Pagine/Unit e dipendenze systemd|Unit e dipendenze systemd]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]

## Fonti

- [GNU Bash Reference Manual - Shell Parameters](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameters.html)
- [GNU Bash Reference Manual - Shell Parameter Expansion](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html)
- [systemd.exec - Environment](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Environment)
- [systemd.exec - Credentials](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Credentials)
