---
date: 2026-07-11
area: Linux
topic: Timer systemd
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, systemd, timer, schedulazione]
aliases: [systemd timer, Schedulazione con systemd]
prerequisites: [systemd, Unit e dipendenze systemd]
related: [Cron e Anacron, Logging con journalctl]
---

# Timer systemd

## Sintesi

Una unit `.timer` pianifica l'attivazione di un'altra unit, normalmente la `.service` con lo stesso nome. Può usare eventi monotoni relativi al boot o all'ultima attivazione e calendari basati sull'orologio di sistema.

Rispetto a cron, i timer integrano dipendenze, cgroup, stato, logging e policy dei servizi systemd. Non sono però una garanzia di esecuzione simultanea: se la unit da attivare è già attiva, una nuova attivazione normalmente non la riavvia.

## Quando usarlo

- Eseguire manutenzioni periodiche gestite da systemd.
- Pianificare un'attività dopo il boot o dopo l'ultima esecuzione.
- Recuperare eventi di calendario persi durante lo spegnimento.
- Applicare dipendenze, sandboxing e logging a un job.
- Ispezionare prossima e ultima esecuzione con `systemctl`.

## Come funziona

Direttive principali:

| Direttiva | Significato |
| --- | --- |
| `OnCalendar=` | espressione di calendario |
| `OnBootSec=` | intervallo dal boot |
| `OnUnitActiveSec=` | intervallo dall'ultima attivazione della unit |
| `OnUnitInactiveSec=` | intervallo da quando la unit è diventata inattiva |
| `Persistent=true` | recupera un evento di calendario perso mentre il timer era inattivo |
| `AccuracySec=` | finestra entro cui systemd può raggruppare le attivazioni |
| `RandomizedDelaySec=` | ritardo casuale per distribuire il carico |
| `Unit=` | unit da attivare se non coincide col nome del timer |

Il timer passa allo stato attivo e attende la scadenza; il servizio associato può essere `Type=oneshot` e tornare inattivo al completamento. Abilitare il timer, non necessariamente il servizio, crea l'attivazione pianificata.

## API / Sintassi

Elencare timer caricati e prossime esecuzioni:

```bash
systemctl list-timers --all
```

Verificare un'espressione di calendario:

```bash
systemd-analyze calendar 'Mon..Fri 02:30'
```

Mostrare lo stato del timer:

```bash
systemctl status backup.timer
```

Abilitare e avviare il timer:

```bash
sudo systemctl enable --now backup.timer
```

Avviare manualmente il servizio associato per provarlo:

```bash
sudo systemctl start backup.service
```

Consultare i log del servizio eseguito:

```bash
journalctl -u backup.service
```

## Esempio pratico

Definizione `/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Backup applicativo

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/backup-app
```

Definizione `/etc/systemd/system/backup.timer`:

```ini
[Unit]
Description=Backup applicativo giornaliero

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
```

Verificare entrambi i file:

```bash
systemd-analyze verify /etc/systemd/system/backup.service /etc/systemd/system/backup.timer
```

Ricaricare il manager:

```bash
sudo systemctl daemon-reload
```

Attivare la pianificazione:

```bash
sudo systemctl enable --now backup.timer
```

## Varianti

- `OnStartupSec=` è relativo all'avvio del manager, utile anche nelle user unit.
- Più direttive `OnCalendar=` nella stessa unit creano più occasioni di attivazione.
- `WakeSystem=true` può risvegliare il sistema da una sospensione compatibile.
- `Persistent=true` riguarda i timer di calendario e richiede la memorizzazione dell'ultima attivazione.
- Un timer può attivare una unit diversa specificando `Unit=`.
- Le user timer si gestiscono con `systemctl --user` e dipendono dalla disponibilità del manager utente.

## Errori comuni

- Abilitare la `.service` invece della `.timer` aspettandosi la schedulazione.
- Dimenticare che `AccuracySec` può rendere l'orario non esatto al secondo.
- Usare `Persistent=true` aspettandosi il recupero di ogni singola esecuzione persa.
- Non testare manualmente il servizio prima di attivare il timer.
- Lasciare il servizio sempre attivo, impedendo successive attivazioni del timer.
- Ignorare timezone e sincronizzazione dell'orologio nei timer `OnCalendar`.
- Modificare i file senza `daemon-reload`.

## Checklist

- Serve un timer monotono o di calendario?
- La service unit termina correttamente dopo il lavoro?
- Gli eventi persi devono essere recuperati?
- Precisione e ritardo casuale sono appropriati?
- L'espressione è stata verificata con `systemd-analyze calendar`?
- Il servizio è stato provato manualmente?
- Stato del timer e journal del servizio mostrano il risultato atteso?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Unit e dipendenze systemd|Unit e dipendenze systemd]]
- [[Linux/Pagine/Cron e Anacron|Cron e Anacron]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]

## Fonti

- [systemd - systemd.timer(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html)
- [systemd - systemd.time(7)](https://www.freedesktop.org/software/systemd/man/latest/systemd.time.html)
- [systemd - systemd-analyze(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-analyze.html)
