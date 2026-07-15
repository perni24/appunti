---
date: 2026-07-13
area: Linux
topic: Scripting con Bash
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, bash, scripting, automazione, cli]
aliases: [Script Bash, Programmazione Bash]
prerequisites: [Bash, Variabili e quoting, Espansioni della shell]
related: [Script robusti, Gestione degli errori negli script, Variabili e configurazione]
---

# Bash scripting

## Sintesi

Uno script Bash combina comandi, funzioni, condizioni, cicli e gestione degli argomenti in un programma eseguito dalla shell. E adatto ad automatizzare operazioni di sistema e a coordinare strumenti esistenti; quando logica, strutture dati o test diventano complessi, un linguaggio general purpose puo essere piu sicuro e manutenibile.

Uno script deve dichiarare l'interprete richiesto, separare output normale da diagnostica e restituire stati di uscita significativi. Non deve dipendere implicitamente dalla configurazione interattiva dell'utente.

## Quando usarlo

- Comporre utility Unix e procedure amministrative.
- Automatizzare setup, manutenzione e controlli locali.
- Scrivere wrapper attorno a programmi esistenti.
- Elaborare flussi testuali di complessita contenuta.
- Creare entrypoint e job eseguiti da cron o systemd.

## Come funziona

La shebang viene letta dal kernel quando il file e eseguito direttamente. `#!/usr/bin/env bash` cerca Bash nel `PATH`; `#!/bin/bash` usa un percorso fisso. La prima e flessibile in ambienti utente, la seconda e piu prevedibile sui sistemi in cui il percorso e garantito.

Gli argomenti sono disponibili come parametri posizionali:

| Espressione | Significato |
| --- | --- |
| `$0` | nome o percorso usato per invocare lo script |
| `$1`, `$2` | singoli argomenti |
| `$#` | numero di argomenti |
| `"$@"` | tutti gli argomenti, preservati separatamente |
| `$?` | stato dell'ultimo comando, da leggere immediatamente |

Le funzioni raggruppano comportamento e restituiscono uno stato con `return`, non dati arbitrari. I dati possono essere stampati su stdout o assegnati tramite altre tecniche, ma la command substitution rimuove newline finali e crea una subshell.

Le variabili di funzione dichiarate con `local` riducono collisioni. Gli array indicizzati preservano liste di argomenti senza concatenarle in una stringa; gli array associativi mappano chiavi a valori e richiedono Bash.

`getopts` analizza opzioni brevi portabili nella shell. Dopo il parsing, `shift "$((OPTIND - 1))"` rimuove le opzioni gia elaborate e lascia gli argomenti operativi.

## API / Sintassi

Controllare la sintassi senza eseguire lo script:

```bash
bash -n script.sh
```

Eseguire lo script esplicitamente con Bash:

```bash
bash script.sh argomento
```

Tracciare i comandi dopo le espansioni:

```bash
bash -x script.sh argomento
```

Analizzare lo script con ShellCheck:

```bash
shellcheck script.sh
```

Rendere il file eseguibile per il proprietario:

```bash
chmod u+x script.sh
```

Eseguire il file tramite la shebang:

```bash
./script.sh argomento
```

## Esempio pratico

Questo script elenca i file regolari di una directory e gestisce l'opzione `-v`:

```bash
#!/usr/bin/env bash

usage() {
    printf 'Uso: %s [-v] DIRECTORY\n' "${0##*/}"
}

main() {
    local verbose=false
    local option

    while getopts ':v' option; do
        case $option in
            v) verbose=true ;;
            *) usage >&2; return 2 ;;
        esac
    done
    shift "$((OPTIND - 1))"

    if (( $# != 1 )); then
        usage >&2
        return 2
    fi

    local directory=$1
    if [[ ! -d $directory ]]; then
        printf 'Directory non valida: %s\n' "$directory" >&2
        return 1
    fi

    if [[ $verbose == true ]]; then
        printf 'Analisi di %s\n' "$directory" >&2
    fi

    find "$directory" -maxdepth 1 -type f -print
}

main "$@"
```

Controllare prima la sintassi:

```bash
bash -n elenco-file.sh
```

Eseguire l'analisi statica:

```bash
shellcheck elenco-file.sh
```

Provare casi validi, argomenti mancanti, opzioni sconosciute e directory con spazi nel nome.

## Varianti

- Uno script POSIX `sh` rinuncia ad array, `[[ ... ]]` e altre estensioni Bash in cambio di maggiore portabilita.
- `case` e adatto a dispatch e parsing di opzioni; `if` esprime condizioni generali.
- `for item in "$@"` itera sugli argomenti senza perdere i confini.
- `while IFS= read -r line` legge righe senza interpretare backslash o rimuovere spazi significativi.
- Le command substitution `$(...)` catturano stdout, ma non lo stato e l'output come valori separati.
- Funzioni piccole e un `main "$@"` esplicito facilitano test e riuso controllato.

## Errori comuni

- Avviare uno script Bash con `sh script.sh` e ignorare la shebang.
- Usare `$*` o `$@` non quotato e perdere i confini degli argomenti.
- Concatenare una lista di comandi in una stringa ed eseguirla con `eval`.
- Restituire testo con `return`, che accetta soltanto uno stato numerico.
- Usare variabili globali involontarie dentro le funzioni.
- Analizzare l'output pensato per esseri umani quando esiste un formato strutturato o delimitato in modo sicuro.
- Scrivere diagnostica su stdout e contaminare l'output consumato da altri programmi.
- Dipendere da alias, `~/.bashrc`, directory corrente o `PATH` interattivo.

## Checklist

- La shebang corrisponde alle funzionalita utilizzate?
- Argomenti e opzioni vengono validati prima dell'uso?
- `"$@"`, array e quoting preservano correttamente i valori?
- Le funzioni usano variabili locali e stati di ritorno chiari?
- stdout contiene dati e stderr contiene diagnostica?
- Comandi esterni e dipendenze vengono verificati?
- `bash -n` e ShellCheck non segnalano problemi irrisolti?
- Sono provati input vuoti, spazi, wildcard, errori e segnali?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Espansioni della shell|Espansioni della shell]]
- [[Linux/Pagine/Script robusti|Script robusti]]
- [[Linux/Pagine/Gestione degli errori negli script|Gestione degli errori negli script]]
- [[Linux/Pagine/Variabili e configurazione|Variabili e configurazione]]

## Fonti

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Bash - Shell Functions](https://www.gnu.org/software/bash/manual/html_node/Shell-Functions.html)
- [GNU Bash - Bourne Shell Builtins](https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html)
- [ShellCheck](https://www.shellcheck.net/)
