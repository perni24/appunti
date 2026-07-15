---
date: 2026-07-13
area: Linux
topic: Schedulazione tradizionale
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, cron, crontab, anacron, schedulazione]
aliases: [Crontab, Schedulazione cron]
prerequisites: [Bash, Variabili ambiente e PATH]
related: [Timer systemd, Logging con journalctl, Script robusti]
---

# Cron e Anacron

## Sintesi

cron esegue comandi secondo una tabella temporale chiamata crontab. Le crontab utente hanno cinque campi temporali seguiti dal comando; le crontab di sistema aggiungono il nome dell'utente di esecuzione.

Anacron è pensato per attività giornaliere o meno frequenti su macchine che non restano sempre accese. Registra l'ultima esecuzione e avvia i job scaduti dopo un ritardo, senza richiedere che il sistema fosse acceso all'orario previsto.

## Quando usarlo

- Pianificare comandi semplici in ambienti che usano cron.
- Eseguire attività per un utente senza creare una system unit.
- Recuperare job periodici su workstation non sempre accese.
- Mantenere configurazioni tradizionali fornite da una distribuzione.
- Scegliere consapevolmente tra cron e timer systemd.

## Come funziona

Formato di una crontab utente:

```text
minuto ora giorno-del-mese mese giorno-della-settimana comando
```

Intervalli comuni: minuto `0-59`, ora `0-23`, giorno del mese `1-31`, mese `1-12`, giorno della settimana `0-7` dove 0 e 7 indicano normalmente domenica. `*` significa qualsiasi valore, `,` elenca valori, `-` definisce intervalli e `/` passi.

Nelle implementazioni della famiglia Vixie/Cronie, quando giorno del mese e giorno della settimana sono entrambi limitati, il job parte se almeno uno dei due corrisponde. Questo comportamento sorprende spesso.

L'ambiente cron è ridotto e non equivale a una shell interattiva. Directory corrente, `PATH`, locale e variabili devono essere definiti esplicitamente. Il comando è normalmente interpretato da `/bin/sh`, salvo configurare `SHELL`.

## API / Sintassi

Modificare la crontab dell'utente corrente:

```bash
crontab -e
```

Visualizzarla:

```bash
crontab -l
```

Modificare la crontab di un altro utente come amministratore:

```bash
sudo crontab -u backup -e
```

Eseguire un comando ogni giorno alle 02:30:

```cron
30 2 * * * /usr/local/bin/backup-app
```

Eseguirlo ogni quindici minuti:

```cron
*/15 * * * * /usr/local/bin/controllo
```

Definire shell e `PATH` nella crontab:

```cron
SHELL=/bin/bash
```

```cron
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
```

## Esempio pratico

Creare uno script eseguibile che gestisca internamente errori e logging, quindi aggiungere alla crontab:

```cron
15 3 * * * /usr/local/sbin/manutenzione >> /var/log/manutenzione.log 2>&1
```

Verificare la tabella installata:

```bash
crontab -l
```

Eseguire manualmente lo script con un ambiente minimale prima di affidarlo a cron:

```bash
env -i HOME="$HOME" PATH=/usr/bin:/bin /usr/local/sbin/manutenzione
```

Percorsi assoluti e logging esplicito rendono più semplice distinguere un errore dello script da una differenza dell'ambiente cron.

## Varianti

- `@reboot`, `@daily`, `@weekly` e altre scorciatoie dipendono dall'implementazione cron ma sono comuni in Cronie.
- `/etc/crontab` e `/etc/cron.d/*` includono il campo utente; non vanno copiati invariati in `crontab -e`.
- Anacron usa tipicamente `/etc/anacrontab` con periodo in giorni, ritardo, identificatore e comando.
- Le directory `/etc/cron.daily` e simili sono integrate dalla distribuzione tramite cron, anacron o systemd.
- I timer systemd offrono stato, dipendenze, journal e sandboxing più integrati.
- Per calendari complessi o workflow distribuiti serve uno scheduler applicativo.

## Errori comuni

- Presumere che cron carichi `~/.bashrc` o lo stesso `PATH` del terminale.
- Usare percorsi relativi o dipendere dalla directory corrente.
- Inserire il campo utente in una crontab personale.
- Dimenticare che `%` può avere significato speciale nel comando cron e deve essere gestito secondo l'implementazione.
- Pianificare contemporaneamente giorno del mese e della settimana senza conoscere la semantica OR.
- Non redirigere output ed errori e perdere informazioni diagnostiche.
- Usare cron per un processo da supervisionare continuamente.

## Checklist

- La sintassi appartiene a una crontab utente o di sistema?
- Orario, timezone e semantica dei campi sono corretti?
- Comandi e file usano percorsi assoluti?
- `PATH`, `HOME`, locale e shell necessari sono definiti?
- Lo script funziona con un ambiente minimale?
- Output, errori e concorrenza tra esecuzioni sono gestiti?
- Un timer systemd o un altro scheduler offrirebbe controlli migliori?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Timer systemd|Timer systemd]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]
- [[Linux/Pagine/Script robusti|Script robusti]]
- [[Linux/Pagine/Gestione degli errori negli script|Gestione degli errori negli script]]

## Fonti

- [Cronie - progetto ufficiale](https://github.com/cronie-crond/cronie)
- [Cronie - crontab(5)](https://github.com/cronie-crond/cronie/blob/master/man/crontab.5)
- [Cronie - anacrontab(5)](https://github.com/cronie-crond/cronie/blob/master/anacron/anacrontab.5)
