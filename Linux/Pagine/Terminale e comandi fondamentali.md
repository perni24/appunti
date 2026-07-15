---
date: 2026-07-11
area: Linux
topic: Terminale
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux, terminale, shell, comandi, coreutils]
aliases: [Comandi Linux fondamentali, Terminale Linux]
prerequisites: [Architettura Linux]
related: [Filesystem Hierarchy Standard, Variabili ambiente e PATH, Manuali man info e help]
---

# Terminale e comandi fondamentali

## Sintesi

Il terminal emulator mostra una sessione testuale; la shell legge i comandi e avvia builtin, funzioni o programmi esterni. Comprendere argomenti, percorsi, quoting, status di uscita e flussi standard permette di usare il terminale senza dipendere dalla memorizzazione cieca dei comandi.

Un comando segue normalmente la forma `comando opzioni argomenti`, ma sintassi e opzioni sono definite dal singolo programma.

## Quando usarlo

- Navigare e ispezionare filesystem e file.
- Creare, copiare, spostare o rimuovere risorse.
- Verificare quale programma verrà eseguito.
- Leggere output ed errori di strumenti amministrativi.
- Preparare procedure ripetibili prima di trasformarle in script.

## Come funziona

### Prompt e shell

Il prompt indica che la shell è pronta. I simboli `$` e `#` mostrati nella documentazione rappresentano spesso rispettivamente utente normale e root: non vanno copiati come parte del comando.

### Percorsi

- `/etc/hostname` è un percorso assoluto.
- `documenti/file.txt` è relativo alla directory corrente.
- `.` indica la directory corrente.
- `..` indica la directory superiore.
- `~` viene espanso dalla shell nella home dell'utente.

### Quoting

- Apici singoli: il contenuto resta letterale.
- Apici doppi: permettono espansione di variabili e sostituzioni supportate.
- Backslash: protegge il carattere successivo in molti contesti.
- Senza quoting, spazi e caratteri speciali possono dividere o trasformare gli argomenti.

### Flussi standard

Ogni processo parte normalmente con tre file descriptor:

- `0`, standard input;
- `1`, standard output;
- `2`, standard error.

Pipe e ridirezioni collegano questi flussi, ma vanno studiati separatamente prima di usarli in comandi distruttivi.

### Status di uscita

Per convenzione `0` indica successo; un valore diverso indica un errore o una condizione particolare documentata dal comando. Lo status deve essere letto subito dopo il comando interessato.

## API / Sintassi

Mostrare la directory corrente:

```bash
pwd
```

Elencare anche file nascosti con dettagli e dimensioni leggibili:

```bash
ls -lah
```

Entrare in una directory:

```bash
cd /percorso/directory
```

Creare una gerarchia di directory:

```bash
mkdir -p progetto/docs
```

Creare un file vuoto o aggiornarne il timestamp:

```bash
touch progetto/README.md
```

Copiare chiedendo conferma prima di sovrascrivere:

```bash
cp -i origine.txt destinazione.txt
```

Spostare o rinominare chiedendo conferma prima di sovrascrivere:

```bash
mv -i vecchio.txt nuovo.txt
```

Rimuovere un file con richiesta di conferma:

```bash
rm -i file.txt
```

Leggere un file lungo in modo paginato:

```bash
less /var/log/nome-file.log
```

Identificare il tipo di contenuto di un file:

```bash
file percorso/file
```

Mostrare metadati dettagliati:

```bash
stat percorso/file
```

Verificare come la shell risolve un nome:

```bash
type -a ls
```

Leggere lo status del comando appena terminato:

```bash
echo "$?"
```

## Esempio pratico

Creare un piccolo spazio di lavoro senza raggruppare operazioni:

```bash
mkdir -p laboratorio/input
```

Creare il file iniziale:

```bash
touch laboratorio/input/dati.txt
```

Controllare la struttura creata:

```bash
ls -la laboratorio/input
```

Copiare il file mantenendo l'originale:

```bash
cp -i laboratorio/input/dati.txt laboratorio/input/dati.backup.txt
```

Verificare tipo e metadati del backup:

```bash
stat laboratorio/input/dati.backup.txt
```

## Varianti

- **Builtin della shell**: `cd`, `type`, `export` e `help` operano dentro la shell corrente.
- **Programmi esterni**: `ls`, `cp`, `mv`, `rm`, `file` e `stat` sono normalmente eseguibili separati.
- **Percorsi con spazi**: usa quoting, per esempio `"Documenti personali/file.txt"`.
- **Interfaccia non interattiva**: negli script evita opzioni che richiedono input e controlla esplicitamente gli errori.
- **Comandi ricorsivi**: opzioni come `-r` ampliano molto l'effetto e richiedono una verifica preventiva del percorso.

## Errori comuni

- Copiare anche `$` o `#` dagli esempi della documentazione.
- Usare `rm -rf` senza controllare il percorso risolto.
- Omettere gli apici intorno a nomi con spazi o caratteri speciali.
- Confondere directory corrente e home directory.
- Usare `sudo` per aggirare un problema di ownership senza comprenderlo.
- Presumere che ogni comando supporti le stesse opzioni.
- Controllare `$?` dopo aver già eseguito un altro comando.

## Checklist

- So quale shell sta interpretando il comando?
- Il percorso è assoluto o relativo?
- Gli argomenti con spazi sono quotati?
- Il comando può sovrascrivere o eliminare dati?
- Ho verificato il significato delle opzioni nella documentazione?
- Serve davvero `sudo`?
- Devo controllare output, standard error o status di uscita?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Architettura Linux kernel shell e user space|Architettura Linux]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Manuali man info e help|Manuali: man, info e help]]

## Fonti

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [Linux man-pages - intro(1)](https://man7.org/linux/man-pages/man1/intro.1.html)
