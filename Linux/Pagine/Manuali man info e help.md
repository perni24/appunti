---
date: 2026-07-11
area: Linux
topic: Documentazione locale
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux, man, info, help, documentazione]
aliases: [Manuali e documentazione Linux, man info e help]
prerequisites: [Terminale e comandi fondamentali]
related: [Variabili ambiente e PATH, Filesystem Hierarchy Standard]
---

# Manuali e documentazione: man, info e help

## Sintesi

Linux e gli strumenti GNU includono documentazione consultabile localmente. `man` mostra pagine divise per sezione, `info` permette di navigare manuali strutturati, `--help` offre un riepilogo rapido e `help` documenta i builtin di Bash.

La documentazione installata corrisponde normalmente alla versione presente sul sistema ed è quindi più affidabile di esempi casuali trovati online.

## Quando usarlo

- Verificare sintassi e opzioni prima di eseguire un comando.
- Distinguere comandi, system call, funzioni di libreria e file di configurazione con lo stesso nome.
- Cercare uno strumento quando conosci il problema ma non il comando.
- Comprendere status di uscita, file usati e limiti di un programma.
- Controllare differenze tra versioni o distribuzioni.

## Come funziona

### Sezioni principali di man

| Sezione | Contenuto |
| ---: | --- |
| 1 | comandi utente |
| 2 | system call |
| 3 | funzioni di libreria |
| 4 | dispositivi e file speciali |
| 5 | formati di file e configurazioni |
| 6 | giochi |
| 7 | convenzioni e panoramiche |
| 8 | comandi amministrativi |

Il nome può comparire in più sezioni. `passwd(1)` descrive il comando, mentre `passwd(5)` descrive il formato di `/etc/passwd`.

### Ricerca e pager

`man` usa normalmente un pager come `less`. Tasti utili:

- `/testo`: cerca in avanti;
- `n`: risultato successivo;
- `N`: risultato precedente;
- `q`: esce;
- `g`: inizio pagina;
- `G`: fine pagina.

### Builtin e programmi esterni

`help` è un builtin Bash e documenta elementi come `cd`, `read`, `export` e `source`. Per programmi esterni usa `man`, `info` o l'opzione prevista dal programma, spesso `--help`.

## API / Sintassi

Aprire la pagina manuale di un comando:

```bash
man ls
```

Aprire una sezione specifica:

```bash
man 5 passwd
```

Elencare tutte le pagine con lo stesso nome:

```bash
man -a passwd
```

Cercare pagine per parola chiave:

```bash
man -k network
```

Mostrare una descrizione sintetica:

```bash
whatis chmod
```

Aprire un manuale GNU in formato Info:

```bash
info coreutils
```

Mostrare il riepilogo rapido di un programma esterno:

```bash
ls --help
```

Documentare un builtin Bash:

```bash
help cd
```

Determinare che tipo di comando è un nome:

```bash
type -a cd
```

## Esempio pratico

Devi capire come modificare permessi in modo ricorsivo.

Individua la natura del comando:

```bash
type -a chmod
```

Apri il manuale completo:

```bash
man chmod
```

Cerca il termine `recursive` nella pagina premendo `/recursive` dentro il pager.

Se vuoi un riepilogo non interattivo:

```bash
chmod --help
```

Per comprendere il modello generale dei permessi, consulta la pagina concettuale:

```bash
man 7 inode
```

## Varianti

- **`apropos`**: equivalente comune di `man -k` per la ricerca per descrizione.
- **`info`**: particolarmente utile per manuali GNU più ampi delle rispettive man page.
- **`help`**: specifico dei builtin Bash; altre shell possono avere strumenti differenti.
- **Documentazione del package**: spesso disponibile sotto `/usr/share/doc`.
- **Documentazione online**: utile per versioni non installate, ma deve corrispondere al software effettivamente in uso.
- **Pagine localizzate**: lingua e disponibilità dipendono dai pacchetti installati e dalla locale.

## Errori comuni

- Leggere una sezione sbagliata di una pagina con nome duplicato.
- Usare `man cd` senza considerare che `cd` è un builtin della shell.
- Copiare opzioni dalla documentazione di una versione diversa.
- Cercare soltanto online ignorando il manuale installato.
- Presumere che ogni programma implementi `--help` nello stesso modo.
- Confondere una synopsis con un comando da copiare letteralmente: parentesi quadre e puntini spesso indicano elementi opzionali o ripetibili.
- Cercare un comando amministrativo senza avere installato le relative man page.

## Checklist

- Il nome è builtin, alias, funzione o programma esterno?
- Esistono più sezioni man con lo stesso nome?
- La documentazione corrisponde alla versione installata?
- Ho letto synopsis, descrizione, opzioni, file ed exit status?
- Le parentesi della synopsis sono notazione oppure caratteri letterali?
- Serve una ricerca con `man -k` invece di conoscere già il comando?
- Il pacchetto della documentazione è installato?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]

## Fonti

- [Linux man-pages project](https://man7.org/linux/man-pages/)
- [Linux man-pages - man(1)](https://man7.org/linux/man-pages/man1/man.1.html)
- [GNU Texinfo Manual](https://www.gnu.org/software/texinfo/manual/texinfo/)
- [GNU Bash - Shell builtin commands](https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html)
