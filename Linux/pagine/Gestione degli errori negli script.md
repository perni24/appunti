---
date: 2026-07-13
area: Linux
topic: Error handling negli script Bash
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, bash, scripting, error-handling, exit-status]
aliases: [Error handling Bash, Gestione errori Bash]
prerequisites: [Bash scripting, Pipe e ridirezioni]
related: [Script robusti, Logging con journalctl, Processi PID e segnali]
---

# Gestione degli errori negli script

## Sintesi

Bash segnala il risultato dei comandi con uno stato numerico: `0` indica successo e un valore diverso da zero indica una condizione di fallimento o un risultato negativo definito dal programma. Uno script affidabile controlla gli stati nei punti in cui puo recuperare, aggiunge contesto e termina con un codice utile al chiamante.

`set -e` non implementa eccezioni. Ha esclusioni dipendenti dal contesto sintattico e puo terminare lo script in punti inattesi oppure ignorare errori che sembrano critici. Va usato soltanto conoscendone la semantica e insieme a controlli espliciti.

## Quando usarlo

- Propagare correttamente fallimenti di comandi e funzioni.
- Distinguere errori recuperabili da condizioni fatali.
- Effettuare cleanup dopo successo, errore o segnale.
- Gestire pipeline e command substitution senza perdere lo stato.
- Fornire log e codici di uscita comprensibili a systemd, cron o CI.

## Come funziona

Lo stato dell'ultimo comando e disponibile in `$?`, ma viene sovrascritto dal comando successivo. E preferibile controllare direttamente il comando con `if`, `while`, `&&` o `||` invece di leggerlo molto dopo.

Convenzioni frequenti sono `126` per comando trovato ma non eseguibile, `127` per comando non trovato e `128 + segnale` per terminazione tramite segnale. Non tutti i programmi seguono la stessa tassonomia: i codici applicativi devono essere documentati.

Per impostazione predefinita, lo stato di una pipeline e quello dell'ultimo comando. Con `set -o pipefail`, la pipeline fallisce se fallisce un componente e restituisce lo stato dell'ultimo componente fallito. L'array Bash `PIPESTATUS` conserva gli stati dei singoli elementi, ma deve essere letto immediatamente.

`set -e`, o `errexit`, non termina in diversi contesti usati per testare uno stato, tra cui condizioni di `if` e `while`, parti di liste `&&` e `||`, comandi negati e componenti non finali di pipeline senza `pipefail`. Funzioni, subshell e command substitution aggiungono altre differenze. Un `trap ERR` segue molte delle stesse esclusioni e non e un gestore universale.

`trap ... EXIT` e adatto al cleanup centralizzato. I signal handler dovrebbero fare il minimo necessario, impostare uno stato o terminare, lasciando al trap `EXIT` la rimozione delle risorse.

## API / Sintassi

Mostrare lo stato del comando appena eseguito:

```bash
printf '%s\n' "$?"
```

Abilitare il controllo delle pipeline nello script corrente:

```bash
set -o pipefail
```

Mostrare le opzioni shell correnti in forma riutilizzabile:

```bash
set +o
```

Controllare la sintassi di uno script:

```bash
bash -n script.sh
```

Eseguire lo script con tracing:

```bash
bash -x script.sh
```

Mostrare il significato convenzionale di un segnale:

```bash
kill -l TERM
```

## Esempio pratico

Questo script crea un archivio e rimuove il file parziale se l'operazione fallisce o viene interrotta:

```bash
#!/usr/bin/env bash
set -u
set -o pipefail

archive=
partial=

cleanup() {
    [[ -z ${partial:-} ]] || rm -f -- "$partial"
}

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

main() {
    if (( $# != 2 )); then
        printf 'Uso: %s SORGENTE ARCHIVIO\n' "${0##*/}" >&2
        return 2
    fi

    local source=$1
    archive=$2

    if [[ ! -d $source ]]; then
        printf 'Sorgente non valida: %s\n' "$source" >&2
        return 1
    fi

    if ! partial=$(mktemp "${archive}.partial.XXXXXX"); then
        printf 'Impossibile creare il file temporaneo per %s\n' "$archive" >&2
        return 1
    fi

    if tar -C "$source" -czf "$partial" . && mv -f -- "$partial" "$archive"; then
        partial=
        printf 'Archivio creato: %s\n' "$archive"
    else
        local status=$?
        printf 'Creazione archivio fallita con stato %d\n' "$status" >&2
        return "$status"
    fi
}

main "$@"
```

Il file parziale viene cancellato soltanto quando lo stato finale e diverso da zero. In un backup reale servono anche destinazione separata, verifica dell'archivio, retention e test di ripristino.

Controllare la sintassi:

```bash
bash -n crea-archivio.sh
```

Analizzare i percorsi di errore:

```bash
shellcheck crea-archivio.sh
```

## Varianti

- `if comando; then ... else ... fi` rende esplicito dove successo e fallimento sono attesi.
- `comando || exit` e conciso per un fallimento immediatamente fatale, ma offre poco contesto.
- `set -u` segnala espansioni di variabili non impostate; parametri opzionali richiedono forme come `${var:-}`.
- `set -E` propaga il trap `ERR` in piu contesti, senza eliminare le esclusioni di `errexit`.
- `timeout` impone un limite temporale a un processo e puo inviare segnali configurabili.
- Retry con backoff e jitter e appropriato soltanto per errori transitori e operazioni idempotenti.
- systemd puo riavviare servizi e registrare stati senza duplicare nello script tutta la supervisione.

## Errori comuni

- Aggiungere `set -e` e presumere che ogni errore venga gestito correttamente.
- Perdere lo stato eseguendo un altro comando prima di leggere `$?` o `PIPESTATUS`.
- Ignorare i fallimenti nei componenti iniziali di una pipeline.
- Usare `cmd || true` e nascondere anche errori non previsti.
- Fare retry su scritture non idempotenti e duplicare effetti.
- Catturare `TERM` o `INT` senza terminare e rendere impossibile fermare il job.
- Eseguire cleanup distruttivo su variabili vuote o percorsi non validati.
- Sovrascrivere il codice originale dell'errore dentro il trap `EXIT`.
- Stampare una diagnostica e poi restituire involontariamente successo.
- Tracciare con `set -x` mentre argomenti o ambiente contengono segreti.

## Checklist

- Ogni comando critico ha un controllo o una propagazione intenzionale?
- Gli stati applicativi sono documentati e preservati?
- Le pipeline usano `pipefail` quando tutti i componenti contano?
- Le eccezioni a `errexit` sono comprese e testate?
- Cleanup e signal handler operano soltanto su risorse validate?
- Errori recuperabili e fatali sono distinti?
- Retry e timeout rispettano idempotenza e durata attesa?
- stdout, stderr e log contengono contesto senza segreti?
- systemd o lo scheduler ricevono lo stato finale corretto?
- Test automatici coprono fallimenti intermedi, segnali e spazio insufficiente?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash scripting|Bash scripting]]
- [[Linux/Pagine/Script robusti|Script robusti]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]
- [[Linux/Pagine/Processi PID e segnali|Processi, PID e segnali]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]

## Fonti

- [GNU Bash Reference Manual - The Set Builtin](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html)
- [GNU Bash Reference Manual - Pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
- [GNU Bash Reference Manual - Bourne Shell Builtins](https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html)
- [GNU Bash Reference Manual - Signals](https://www.gnu.org/software/bash/manual/html_node/Signals.html)
