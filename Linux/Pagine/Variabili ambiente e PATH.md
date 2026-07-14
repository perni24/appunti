---
date: 2026-07-11
area: Linux
topic: Ambiente dei processi
type: technical-note
status: "non revisionato"
difficulty: base
tags: [linux, environment, path, shell, bash]
aliases: [Variabili d'ambiente e PATH, Environment variables Linux]
prerequisites: [Terminale e comandi fondamentali]
related: [Installazione Linguaggi User-space, Manuali man info e help]
---

# Variabili d'ambiente e PATH

## Sintesi

Una variabile della shell associa un nome a un valore nella shell corrente. Una variabile esportata entra nell'ambiente trasmesso ai processi figli. `PATH` è una variabile speciale contenente l'elenco ordinato delle directory nelle quali la shell cerca i comandi senza percorso esplicito.

Modificare `PATH` cambia quale eseguibile viene avviato. Per questo ordine, quoting e provenienza delle directory hanno conseguenze funzionali e di sicurezza.

## Quando usarlo

- Configurare tool installati nella home dell'utente.
- Passare configurazione a un processo senza scriverla nel comando o in un file.
- Diagnosticare perché viene eseguita una versione inattesa di un programma.
- Impostare locale, editor o directory applicative.
- Preparare una configurazione persistente della shell.

## Come funziona

### Variabile della shell ed environment

Questa assegnazione crea una variabile nella shell corrente:

```bash
PROGETTO=demo
```

Un programma figlio non la riceve finché non viene esportata:

```bash
export PROGETTO
```

È possibile assegnare ed esportare nello stesso comando:

```bash
export PROGETTO=demo
```

I processi figli ricevono una copia dell'ambiente. Un processo figlio non può modificare retroattivamente l'ambiente del processo genitore.

### Risoluzione tramite PATH

`PATH` contiene directory separate da `:`. Quando digiti un nome senza `/`, la shell controlla builtin, funzioni, alias e directory del `PATH` secondo le proprie regole di risoluzione.

```text
/home/luca/.local/bin:/usr/local/bin:/usr/bin
```

Con questo ordine, un eseguibile in `~/.local/bin` viene trovato prima di uno con lo stesso nome in `/usr/bin`.

Se il comando contiene `/`, per esempio `./script.sh`, la shell usa quel percorso e non cerca nel `PATH`.

### Persistenza

Le modifiche eseguite nel terminale valgono normalmente per la sessione corrente. Per renderle persistenti devi inserirle nel file di startup appropriato alla shell e al tipo di sessione.

Per Bash i file possono includere `~/.bashrc`, `~/.bash_profile` o `~/.profile`; la scelta dipende da shell interattiva, login shell e configurazione della distribuzione.

## API / Sintassi

Mostrare tutte le variabili esportate:

```bash
printenv
```

Leggere una singola variabile d'ambiente:

```bash
printenv HOME
```

Mostrare il valore attuale di `PATH`:

```bash
printf '%s\n' "$PATH"
```

Visualizzare una directory del `PATH` per riga:

```bash
printf '%s\n' "$PATH" | tr ':' '\n'
```

Aggiungere temporaneamente una directory personale all'inizio del `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Rimuovere una variabile dalla shell corrente:

```bash
unset PROGETTO
```

Individuare il comando che verrebbe eseguito:

```bash
command -v python
```

Mostrare tutte le risoluzioni note alla shell:

```bash
type -a python
```

Avviare un singolo processo con una variabile temporanea:

```bash
LANG=C ls
```

## Esempio pratico

Vuoi rendere disponibili programmi installati in `~/.local/bin`.

Apri il file di configurazione della shell Bash:

```bash
nano ~/.bashrc
```

Aggiungi una sola volta questa riga:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Ricarica il file nella shell corrente:

```bash
source ~/.bashrc
```

Controlla che la directory sia presente:

```bash
type -a nome-comando
```

Se il programma continua a non essere trovato, verifica che il file esista e sia eseguibile:

```bash
ls -l "$HOME/.local/bin/nome-comando"
```

## Varianti

- **Variabile temporanea per un comando**: `NOME=valore comando` non modifica stabilmente la shell.
- **Variabile non esportata**: utile per calcoli e configurazione interna della shell.
- **Directory aggiunta in fondo**: mantiene la precedenza degli strumenti di sistema.
- **Environment di systemd**: i servizi non ereditano automaticamente l'ambiente del terminale e richiedono configurazione nella unit o in file dedicati.
- **sudo**: può filtrare o sostituire molte variabili, incluso `PATH` tramite `secure_path`.
- **NVM, pyenv e rustup**: modificano il percorso o usano shim per scegliere toolchain differenti.

## Errori comuni

- Scrivere `PATH="$HOME/bin"` e perdere tutte le directory precedenti.
- Aggiungere ripetutamente la stessa directory a ogni caricamento della shell.
- Inserire `.` o directory scrivibili da utenti non fidati all'inizio del `PATH`.
- Omettere gli apici attorno a espansioni che possono contenere spazi.
- Modificare `.bashrc` mentre la shell in uso è Zsh o un'altra shell.
- Aspettarsi che un servizio systemd erediti le variabili del terminale.
- Conservare password o token in file di shell leggibili da altri utenti.
- Usare `which` come unica diagnosi quando `type` o `command -v` descrivono meglio la risoluzione della shell.

## Checklist

- La variabile deve restare nella shell o essere esportata?
- La modifica deve valere per un comando, una sessione o tutte le sessioni future?
- Sto modificando il file di startup corretto?
- La directory aggiunta al `PATH` esiste ed è affidabile?
- L'ordine mantiene la precedenza desiderata?
- Esistono duplicati nel `PATH`?
- Il comando è builtin, alias, funzione, shim o file eseguibile?
- Sto esponendo segreti tramite environment, history o process inspection?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]
- [[Linux/Pagine/Installazione Linguaggi User-space|Installazione linguaggi in user-space]]
- [[Linux/Pagine/Manuali man info e help|Manuali: man, info e help]]

## Fonti

- [GNU Bash - Shell variables](https://www.gnu.org/software/bash/manual/html_node/Shell-Variables.html)
- [GNU Bash - Bash variables](https://www.gnu.org/software/bash/manual/html_node/Bash-Variables.html)
- [GNU Bash - Bash startup files](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html)
- [Linux man-pages - environ(7)](https://man7.org/linux/man-pages/man7/environ.7.html)
