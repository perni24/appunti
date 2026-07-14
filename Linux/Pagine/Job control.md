---
date: 2026-07-11
area: Linux
topic: Job control Bash
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, bash, job-control, processi, segnali]
aliases: [Controllo dei job, Processi in foreground e background]
prerequisites: [Bash, Terminale e comandi fondamentali]
related: [Processi PID e segnali, Pipe e ridirezioni]
---

# Job control

## Sintesi

Il job control permette a una shell interattiva di avviare pipeline in foreground o background, sospenderle e riprenderle. Bash rappresenta i job con identificatori come `%1`, distinti dai PID del kernel e validi soltanto nel contesto della shell che li gestisce.

Il terminale assegna il foreground a un process group alla volta. I processi di quel gruppo possono leggere dal terminale e ricevono i segnali generati da combinazioni come `Ctrl+C` e `Ctrl+Z`.

## Quando usarlo

- Continuare a usare il terminale mentre un comando è in esecuzione.
- Sospendere temporaneamente un programma interattivo.
- Riprendere un job in foreground o background.
- Attendere o terminare una pipeline avviata dalla shell corrente.
- Gestire una sessione breve senza introdurre un servizio di sistema.

## Come funziona

Una pipeline forma normalmente un process group. La shell conserva una tabella dei job e associa a ogni pipeline un job ID. Il job in foreground possiede il controllo del terminale; quelli in background non possono normalmente leggerne l'input e possono essere sospesi dal driver del terminale.

Combinazioni comuni:

- `Ctrl+C` invia normalmente `SIGINT` al process group in foreground;
- `Ctrl+Z` invia normalmente `SIGTSTP`, sospendendolo;
- `&` termina un comando o una pipeline avviandola in background;
- `fg` e `bg` inviano `SIGCONT` e cambiano la relazione con il terminale.

I job ID usano `%`: `%1` indica il job 1, `%%` o `%+` il job corrente e `%-` quello precedente. Un PID identifica invece un singolo processo a livello di sistema.

## API / Sintassi

Avviare un comando in background:

```bash
sleep 300 &
```

Elencare i job della shell con i PID:

```bash
jobs -l
```

Portare il job 1 in foreground:

```bash
fg %1
```

Riprendere il job 1 in background:

```bash
bg %1
```

Inviare il segnale predefinito al job 1:

```bash
kill %1
```

Attendere la conclusione del job 1:

```bash
wait %1
```

Rimuovere un job dalla tabella della shell:

```bash
disown %1
```

Mostrare se il job control è attivo:

```bash
set -o | grep monitor
```

## Esempio pratico

Avviare un'elaborazione lunga salvando output ed errori:

```bash
comando-lungo > elaborazione.log 2>&1 &
```

Verificarne lo stato nella shell corrente:

```bash
jobs -l
```

Riportarla temporaneamente in foreground:

```bash
fg %1
```

Dopo averla sospesa con `Ctrl+Z`, riprenderla in background:

```bash
bg %1
```

`disown` evita che Bash continui a gestire il job, ma non trasforma il processo in un servizio affidabile. Per attività persistenti servono strumenti come `systemd`, un terminal multiplexer o un sistema di code, a seconda del caso.

## Varianti

- `nohup comando` rende il comando resistente a `SIGHUP` e ridirige l'output se necessario, ma non offre supervisione.
- `disown -h %1` mantiene il job nella tabella ma evita che la shell gli invii `SIGHUP` alla chiusura.
- `wait` senza argomenti attende tutti i job figli conosciuti dalla shell.
- `wait -n` attende il prossimo job che termina nelle versioni Bash che lo supportano.
- Tmux e GNU Screen mantengono sessioni terminali ricollegabili.
- `systemd` è preferibile per processi persistenti che richiedono riavvio, logging e dipendenze.

## Errori comuni

- Confondere `%1` con il PID 1.
- Usare `jobs` in un altro terminale e aspettarsi di vedere i job della prima shell.
- Credere che `&` renda automaticamente un processo indipendente dalla sessione.
- Chiudere il terminale senza aver deciso come gestire `SIGHUP`, input e output del processo.
- Lasciare un job in background che tenta di leggere dal terminale e viene sospeso.
- Usare `kill -9` come prima scelta, impedendo al processo di pulire risorse e file temporanei.
- Usare il job control come sostituto di un service manager.

## Checklist

- L'attività è temporanea o deve sopravvivere alla sessione?
- Si sta usando un job ID o un PID?
- Output, errori e input sono gestiti anche in background?
- Il processo deve ricevere o ignorare `SIGHUP`?
- Serve soltanto sospendere/riprendere oppure occorre supervisione?
- Il job appartiene alla shell corrente?
- Prima di terminare forzatamente è stato provato un segnale gestibile?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]

## Fonti

- [GNU Bash - Job Control Basics](https://www.gnu.org/software/bash/manual/html_node/Job-Control-Basics.html)
- [GNU Bash - Job Control Builtins](https://www.gnu.org/software/bash/manual/html_node/Job-Control-Builtins.html)
- [GNU Bash - Signals](https://www.gnu.org/software/bash/manual/html_node/Signals.html)
