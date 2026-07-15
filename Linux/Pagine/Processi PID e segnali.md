---
date: 2026-07-11
area: Linux
topic: Processi Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, processi, pid, segnali, procfs]
aliases: [Processi Linux, PID e segnali]
prerequisites: [Architettura Linux kernel shell e user space, Bash]
related: [Job control, Monitoraggio delle risorse, systemd]
---

# Processi, PID e segnali

## Sintesi

Un processo è un'istanza di programma in esecuzione con memoria, credenziali, file descriptor e stato propri. Il kernel lo identifica con un PID e registra la relazione con il processo padre tramite il PPID. I segnali notificano eventi o richiedono azioni come terminazione, sospensione e ripresa.

Un segnale non equivale sempre a “uccidere” un processo: ogni segnale ha un'azione predefinita e molti possono essere gestiti o ignorati. `SIGKILL` e `SIGSTOP` sono eccezioni e non possono essere intercettati, bloccati o ignorati.

## Quando usarlo

- Individuare chi ha avviato un processo e con quali argomenti.
- Terminare ordinatamente un programma bloccato.
- Diagnosticare processi zombie o in attesa I/O.
- Consultare informazioni dettagliate in `/proc`.
- Comprendere processi, thread, gruppi e sessioni.

## Come funziona

Un processo nasce normalmente quando un processo esistente crea un figlio e questo esegue un nuovo programma. Alla terminazione conserva temporaneamente PID e stato di uscita finché il padre non lo raccoglie con `wait`: in questo intervallo è uno zombie.

Stati comuni mostrati da `ps`:

| Stato | Significato |
| --- | --- |
| `R` | in esecuzione o pronto a essere eseguito |
| `S` | attesa interrompibile |
| `D` | attesa non interrompibile, spesso I/O kernel |
| `T` | fermato o tracciato |
| `Z` | terminato ma non ancora raccolto dal padre |

I thread dello stesso processo condividono molte risorse. Linux assegna identificatori ai singoli task; gli strumenti mostrano normalmente il thread group ID come PID del processo.

Segnali importanti:

- `SIGTERM`: richiesta di terminazione gestibile, scelta iniziale normale;
- `SIGKILL`: terminazione immediata da parte del kernel, senza pulizia applicativa;
- `SIGINT`: interruzione, spesso generata da `Ctrl+C`;
- `SIGHUP`: perdita del terminale o richiesta convenzionale di reload;
- `SIGSTOP` e `SIGCONT`: sospensione e ripresa;
- `SIGCHLD`: notifica al padre del cambiamento di stato di un figlio.

## API / Sintassi

Mostrare i processi con PID, PPID, stato e comando:

```bash
ps -eo pid,ppid,user,stat,etime,cmd
```

Visualizzare l'albero dei processi:

```bash
pstree -p
```

Cercare PID e riga di comando per nome:

```bash
pgrep -a nginx
```

Leggere lo stato di un processo da procfs:

```bash
cat /proc/1234/status
```

Mostrare l'eseguibile associato al processo:

```bash
readlink -f /proc/1234/exe
```

Elencare i file descriptor aperti:

```bash
ls -l /proc/1234/fd
```

Inviare una richiesta di terminazione ordinata:

```bash
kill -TERM 1234
```

Verificare esistenza e permesso di segnalazione senza inviare un segnale reale:

```bash
kill -0 1234
```

Elencare i nomi dei segnali:

```bash
kill -l
```

## Esempio pratico

Individuare il processo con una corrispondenza esatta sul nome:

```bash
pgrep -ax applicazione
```

Controllarne stato e durata:

```bash
ps -p 1234 -o pid,ppid,user,stat,etime,%cpu,%mem,cmd
```

Richiedere la terminazione:

```bash
kill -TERM 1234
```

Verificare se esiste ancora:

```bash
ps -p 1234
```

Usare `SIGKILL` soltanto dopo aver atteso e verificato che il processo non possa terminare ordinatamente:

```bash
kill -KILL 1234
```

Un processo in stato `D` può non reagire neppure a `SIGKILL` finché non ritorna dall'attesa non interrompibile.

## Varianti

- `pkill` seleziona processi e invia segnali in base a nome e altri attributi; una selezione troppo ampia è rischiosa.
- `pidof` trova PID di programmi, ma ha criteri diversi da `pgrep`.
- `lsof -p PID` mostra risorse aperte quando `lsof` è installato.
- `strace -p PID` osserva system call e segnali, ma altera tempi e richiede permessi adeguati.
- I pidfd consentono al software moderno di riferirsi a un processo senza la race dovuta al riutilizzo dei PID.
- Per un servizio systemd è preferibile `systemctl stop` a un `kill` manuale, perché il manager conosce unit e process group.

## Errori comuni

- Usare subito `kill -9`, impedendo flush, rimozione di file temporanei e shutdown ordinato.
- Credere che `kill` termini sempre: invia un segnale e il risultato dipende dal segnale e dallo stato.
- Confondere zombie con processi attivi che consumano CPU: uno zombie occupa soprattutto una voce nella tabella processi.
- Terminare un PID riciclato dopo aver atteso troppo tra identificazione e segnale.
- Cercare di eliminare direttamente uno zombie invece di correggere o terminare il padre che non lo raccoglie.
- Leggere soltanto il nome breve del processo senza controllare argomenti, utente e gerarchia.
- Ignorare permessi e namespace che limitano visibilità e invio dei segnali.

## Checklist

- PID, utente, PPID e comando completo identificano il processo corretto?
- È un processo autonomo, un job della shell o un servizio gestito?
- Quale segnale esprime l'azione desiderata?
- È stato provato `SIGTERM` prima di `SIGKILL`?
- Lo stato `D`, `T` o `Z` spiega il comportamento osservato?
- Il processo possiede file o socket che richiedono chiusura ordinata?
- Il PID potrebbe essere stato riutilizzato?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Job control|Job control]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [Linux man-pages - signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [Linux man-pages - procfs(5)](https://man7.org/linux/man-pages/man5/procfs.5.html)
- [Linux man-pages - ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html)
- [Linux man-pages - kill(1)](https://man7.org/linux/man-pages/man1/kill.1.html)
