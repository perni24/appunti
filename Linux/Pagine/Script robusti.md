---
date: 2026-07-13
area: Linux
topic: Robustezza degli script shell
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, bash, scripting, robustezza, shellcheck]
aliases: [Shell scripting robusto, Script Bash affidabili]
prerequisites: [Bash scripting, Variabili e quoting]
related: [Gestione degli errori negli script, Variabili e configurazione, File directory e link]
---

# Script robusti

## Sintesi

Uno script robusto produce risultati prevedibili anche con input insoliti, errori parziali, esecuzioni concorrenti e interruzioni. La robustezza non deriva da una singola opzione come `set -e`: richiede validazione, quoting, stati espliciti, cleanup, operazioni atomiche, logging e test.

Gli script amministrativi lavorano spesso con privilegi o dati importanti. Percorsi, wildcard, file temporanei e configurazioni non attendibili devono quindi essere trattati come superfici di sicurezza.

## Quando usarlo

- Automatizzare modifiche a file o servizi di sistema.
- Eseguire job non supervisionati da cron o systemd.
- Elaborare nomi file arbitrari senza perdere dati.
- Rendere ripetibili procedure che possono essere rilanciate.
- Ridurre danni causati da esecuzioni parziali o concorrenti.

## Come funziona

Principi principali:

- **Input validato**: controllare numero, formato, tipo e ownership prima di agire.
- **Quoting sistematico**: usare `"$var"` salvo quando word splitting o globbing sono intenzionali e documentati.
- **Array per liste**: conservare ogni argomento come elemento separato.
- **Opzioni terminate**: usare `--` prima di percorsi che potrebbero iniziare con `-`.
- **File temporanei sicuri**: usare `mktemp`, permessi restrittivi e cleanup.
- **Atomicita**: scrivere un file temporaneo nello stesso filesystem, validarlo e rinominarlo sulla destinazione.
- **Idempotenza**: una seconda esecuzione non deve duplicare righe, utenti o regole.
- **Concorrenza controllata**: usare lock quando due istanze non possono operare insieme.
- **Osservabilita**: registrare inizio, fine, contesto e causa degli errori senza esporre segreti.

I nomi file Unix possono contenere spazi, newline e caratteri glob. L'output testuale delimitato da newline non e sempre sicuro; quando gli strumenti lo supportano, usare terminatori NUL come `find -print0` e lettura `read -d ''`.

`mktemp` evita nomi prevedibili e race nella creazione. Il file temporaneo deve trovarsi nello stesso filesystem della destinazione se il rename deve essere atomico. L'atomicita del rename non rende atomica un'intera procedura composta da piu risorse.

## API / Sintassi

Controllare la sintassi:

```bash
bash -n script.sh
```

Eseguire ShellCheck:

```bash
shellcheck script.sh
```

Creare una directory temporanea privata:

```bash
mktemp -d
```

Eseguire un comando con lock esclusivo non bloccante:

```bash
flock --nonblock /run/lock/manutenzione.lock /usr/local/sbin/manutenzione
```

Provare lo script con un ambiente minimale:

```bash
env -i HOME="$HOME" PATH=/usr/bin:/bin ./script.sh
```

Mostrare le modifiche di uno script su una copia di test:

```bash
diff -u configurazione.originale configurazione.generata
```

## Esempio pratico

Questo schema genera un file e lo sostituisce con un rename nello stesso filesystem:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

target=${1:?Specificare il file di destinazione}
target_dir=$(dirname -- "$target")

tmp_file=$(mktemp "$target_dir/.generazione.XXXXXX")

cleanup() {
    [[ -z ${tmp_file:-} ]] || rm -f -- "$tmp_file"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

generate_content() {
    printf 'generated_at=%(%FT%T%z)T\n' -1
}

generate_content > "$tmp_file"
[[ -s $tmp_file ]] || { printf 'Output vuoto\n' >&2; exit 1; }
chmod 0644 "$tmp_file"
mv -f -- "$tmp_file" "$target"
tmp_file=
```

Lo script valida soltanto che l'output non sia vuoto; una configurazione reale deve essere controllata con il parser o il comando di test del servizio prima del rename o del reload.

Eseguire il controllo statico:

```bash
shellcheck genera-config.sh
```

Provare il comportamento in una directory non critica, inclusi segnale, destinazione non scrivibile e due esecuzioni concorrenti.

## Varianti

- `flock` coordina processi che rispettano lo stesso lock; non impedisce modifiche da programmi estranei.
- `install` copia un file impostando contestualmente mode e ownership.
- Un here-document quotato conserva il contenuto senza espandere variabili della shell.
- `printf` e piu prevedibile di `echo` per stringhe che iniziano con `-` o contengono escape.
- ShellCheck rileva molti errori comuni, ma non conosce tutte le invarianti applicative.
- Un formatter come `shfmt` uniforma lo stile senza validare il comportamento.
- Oltre una certa complessita, Python o un sistema di configuration management offre tipi, librerie e test piu adatti.

## Errori comuni

- Usare `set -e` come sostituto della gestione esplicita degli errori.
- Espandere variabili non quotate o costruire comandi in stringhe.
- Usare `/tmp/nome-fisso` e permettere collisioni o attacchi con symlink.
- Analizzare `ls` per iterare sui file.
- Applicare `rm -rf` a un percorso costruito senza validarlo.
- Scrivere direttamente sul file finale e lasciarlo troncato in caso di errore.
- Creare il temporaneo su un altro filesystem e presumere che `mv` sia un rename atomico.
- Lanciare piu istanze senza lock o progettazione concorrente.
- Registrare password, token o contenuto sensibile con tracing e log.
- Rendere lo script idempotente soltanto nel caso ideale e non dopo una esecuzione interrotta.

## Checklist

- Input, percorsi e dipendenze vengono validati prima delle modifiche?
- Variabili e array preservano esattamente gli argomenti?
- Comandi potenzialmente pericolosi usano `--` e destinazioni controllate?
- Temporanei hanno nomi sicuri, permessi restrittivi e cleanup?
- File di configurazione vengono generati, validati e sostituiti atomicamente?
- Esecuzioni ripetute e concorrenti sono sicure?
- Errori e segnali lasciano uno stato recuperabile?
- Log e tracing evitano segreti?
- ShellCheck, test automatici e casi limite sono inclusi?
- La complessita e ancora adatta a uno script shell?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash scripting|Bash scripting]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Gestione degli errori negli script|Gestione degli errori negli script]]
- [[Linux/Pagine/Variabili e configurazione|Variabili e configurazione]]
- [[Linux/Pagine/File directory e link|File, directory e link]]

## Fonti

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Bash - Signals](https://www.gnu.org/software/bash/manual/html_node/Signals.html)
- [GNU Coreutils - mktemp](https://www.gnu.org/software/coreutils/manual/html_node/mktemp-invocation.html)
- [util-linux - flock(1)](https://man7.org/linux/man-pages/man1/flock.1.html)
- [ShellCheck](https://www.shellcheck.net/)
