---
date: 2026-07-11
area: Linux
topic: Flussi della shell
type: technical-note
status: "non revisionato"
difficulty: base
tags: [linux, bash, pipe, redirezioni, file-descriptor]
aliases: [Pipe Linux, Ridirezioni Bash]
prerequisites: [Bash, Terminale e comandi fondamentali]
related: [Elaborazione testi con grep sed e awk, Variabili e quoting]
---

# Pipe e ridirezioni

## Sintesi

Ogni processo parte normalmente con tre file descriptor: standard input (`stdin`, 0), standard output (`stdout`, 1) e standard error (`stderr`, 2). Le ridirezioni collegano questi flussi a file o ad altri descriptor; una pipe collega lo `stdout` di un comando allo `stdin` del successivo.

La shell prepara pipe e ridirezioni prima di eseguire il comando. L'ordine delle ridirezioni è significativo perché Bash le applica da sinistra a destra.

## Quando usarlo

- Salvare output o errori in file distinti.
- Usare l'output di un programma come input di un altro.
- Filtrare log e grandi flussi senza file temporanei.
- Mostrare e salvare contemporaneamente un risultato.
- Fornire input controllato a un comando.

## Come funziona

| Descriptor | Nome | Destinazione tipica |
| --- | --- | --- |
| `0` | stdin | tastiera o input precedente |
| `1` | stdout | terminale o pipe successiva |
| `2` | stderr | terminale, separato da stdout |

`>` apre un file per la scrittura e lo tronca; `>>` aggiunge in coda; `<` usa un file come input. `2>` agisce su `stderr`, mentre `2>&1` duplica sul descriptor 2 la destinazione che il descriptor 1 possiede in quel momento.

In una pipeline ogni elemento viene normalmente eseguito in un processo distinto. Senza `pipefail`, lo stato della pipeline è quello dell'ultimo comando. Con `set -o pipefail`, è diverso da zero se fallisce un elemento e corrisponde allo stato dell'ultimo comando fallito.

## API / Sintassi

Sovrascrivere un file con lo standard output:

```bash
printf '%s\n' risultato > output.txt
```

Aggiungere lo standard output in coda:

```bash
printf '%s\n' altra-riga >> output.txt
```

Usare un file come standard input:

```bash
wc -l < output.txt
```

Salvare soltanto gli errori:

```bash
find /root -name '*.log' 2> errori.log
```

Salvare output ed errori nello stesso file:

```bash
find / -name '*.log' > risultato.log 2>&1
```

Usare la forma abbreviata specifica di Bash:

```bash
find / -name '*.log' &> risultato.log
```

Collegare due programmi con una pipe:

```bash
printf '%s\n' alfa beta gamma | grep 'beta'
```

Mostrare e salvare un flusso con `tee`:

```bash
printf '%s\n' stato | tee stato.log
```

## Esempio pratico

Filtrare le righe di errore da un log e salvarle mantenendo l'output visibile:

```bash
grep -i 'error' applicazione.log | tee errori-filtrati.log
```

Contare le righe filtrate senza creare un file intermedio:

```bash
grep -i 'error' applicazione.log | wc -l
```

Abilitare `pipefail` nella shell corrente:

```bash
set -o pipefail
```

Controllare lo stato della pipeline appena conclusa:

```bash
printf '%s\n' "$?"
```

In uno script robusto, `pipefail` evita che il successo dell'ultimo filtro nasconda il fallimento di un produttore precedente.

## Varianti

- `2> errori.log` separa gli errori dall'output normale.
- `|&` è una scorciatoia Bash per inviare sia stdout sia stderr nella pipe.
- Un here document (`<<`) fornisce più righe come input; quotarne il delimitatore disabilita espansioni nel contenuto.
- Una here string (`<<<`) fornisce una stringa come input e aggiunge una newline finale.
- La process substitution `<(comando)` espone l'output come nome di file o file descriptor, utile quando un programma non legge da stdin.
- `tee -a` aggiunge a un file invece di sovrascriverlo.

## Errori comuni

- Invertire `> file 2>&1` e `2>&1 > file`: nel secondo caso `stderr` resta collegato alla vecchia destinazione di stdout.
- Credere che `sudo echo valore > /file` renda privilegiata la ridirezione, che viene invece aperta dalla shell corrente.
- Usare `>` quando serviva `>>`, cancellando il contenuto precedente.
- Dimenticare che senza `pipefail` può essere ignorato il fallimento di un comando intermedio.
- Usare `cat file | comando` quando il comando può leggere direttamente il file, aggiungendo un processo senza necessità.
- Inserire dati non fidati in comandi costruiti con `eval`.
- Presumere che una pipeline mantenga modifiche alle variabili della shell chiamante.

## Checklist

- Quale descriptor deve essere ridiretto: 0, 1 o 2?
- Il file va sovrascritto o aggiornato in append?
- L'ordine delle ridirezioni produce la destinazione desiderata?
- Il fallimento di qualsiasi elemento della pipeline deve essere rilevato?
- Il comando successivo accetta davvero input da stdin?
- Output ed errori devono rimanere separati?
- I nomi dei file di destinazione sono quotati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Elaborazione testi con grep sed e awk|Elaborazione testi con grep, sed e awk]]
- [[Linux/Pagine/Espansioni della shell|Espansioni della shell]]

## Fonti

- [GNU Bash - Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [GNU Bash - Pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
- [GNU Coreutils - tee](https://www.gnu.org/software/coreutils/manual/html_node/tee-invocation.html)
