---
date: 2026-07-11
area: Linux
topic: systemd
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, systemd, systemctl, servizi, init]
aliases: [systemd system manager, Gestione servizi con systemctl]
prerequisites: [Processi PID e segnali, sudo e privilegi amministrativi]
related: [Unit e dipendenze systemd, Timer systemd, Logging con journalctl]
---

# systemd

## Sintesi

systemd è un system e service manager. Come istanza di sistema viene normalmente eseguito con PID 1, avvia lo spazio utente, gestisce unit, supervisiona processi e coordina arresto e riavvio. Ogni utente può inoltre avere una propria istanza per le user unit.

`systemctl` è l'interfaccia principale per interrogare e modificare lo stato delle unit. Stato runtime e abilitazione al boot sono distinti: una unit può essere attiva ma disabilitata, oppure abilitata ma attualmente inattiva.

## Quando usarlo

- Avviare, fermare o ricaricare un servizio.
- Verificare perché una unit è fallita.
- Configurare l'avvio automatico.
- Consultare unit caricate e file installati.
- Gestire servizi della sessione utente.

## Come funziona

systemd carica file di unit e costruisce una transazione rispettando dipendenze e ordinamento. Per i servizi associa i processi a cgroup, così può seguirli come insieme invece di affidarsi soltanto a PID file.

Stati da non confondere:

| Concetto | Esempi | Significato |
| --- | --- | --- |
| stato runtime | `active`, `inactive`, `failed` | cosa sta accadendo ora |
| stato del file | `enabled`, `disabled`, `static`, `masked` | come può essere attivata la unit |
| caricamento | `loaded`, `not-found`, `error` | disponibilità e validità della definizione |

`start` attiva ora; `enable` crea i collegamenti definiti da `[Install]` per l'attivazione futura. `mask` collega la unit a `/dev/null` e ne impedisce l'avvio, anche come dipendenza, finché non viene rimossa la maschera.

## API / Sintassi

Mostrare lo stato dettagliato di un servizio:

```bash
systemctl status nginx.service
```

Avviare un servizio:

```bash
sudo systemctl start nginx.service
```

Fermare un servizio:

```bash
sudo systemctl stop nginx.service
```

Riavviare un servizio:

```bash
sudo systemctl restart nginx.service
```

Richiedere il reload senza riavvio, se supportato dalla unit:

```bash
sudo systemctl reload nginx.service
```

Abilitare e avviare nello stesso comando:

```bash
sudo systemctl enable --now nginx.service
```

Disabilitare e fermare nello stesso comando:

```bash
sudo systemctl disable --now nginx.service
```

Verificare lo stato runtime in modo adatto agli script:

```bash
systemctl is-active nginx.service
```

Verificare l'abilitazione:

```bash
systemctl is-enabled nginx.service
```

## Esempio pratico

Controllare una unit che non parte:

```bash
systemctl status applicazione.service
```

Consultarne i messaggi del boot corrente:

```bash
journalctl -u applicazione.service -b
```

Mostrare la definizione effettiva, inclusi drop-in:

```bash
systemctl cat applicazione.service
```

Controllare proprietà risolte dal manager:

```bash
systemctl show applicazione.service
```

Azzerare lo stato `failed` soltanto dopo aver compreso il problema:

```bash
sudo systemctl reset-failed applicazione.service
```

`status` mostra un riepilogo e alcune righe recenti, non l'intero log; per la diagnosi completa va usato `journalctl`.

## Varianti

- `systemctl --user` comunica con il manager dell'utente e non con PID 1.
- Le system unit risiedono normalmente sotto `/etc/systemd/system`, `/run/systemd/system` e directory fornite dai pacchetti.
- Socket, path, timer, mount e device unit possono attivare servizi su richiesta.
- `systemctl edit nome.service` crea un drop-in amministrativo senza copiare l'intero file del pacchetto.
- `systemctl list-units` mostra unit caricate; `list-unit-files` mostra i file installati e il loro stato.
- `reload-or-restart` prova il reload e ripiega sul riavvio quando appropriato.

## Errori comuni

- Credere che `enable` avvii immediatamente la unit.
- Usare `restart` quando l'applicazione supporta un reload non distruttivo.
- Modificare direttamente file sotto `/usr/lib/systemd/system`, che possono essere sovrascritti dai pacchetti.
- Eseguire `daemon-reload` aspettandosi che riavvii automaticamente i servizi.
- Usare `status` come unica fonte di log.
- Confondere servizi di sistema e user service.
- Mascherare una unit senza considerare dipendenze che potrebbero richiederla.

## Checklist

- Si sta operando sul manager di sistema o su quello utente?
- Il nome e il tipo della unit sono corretti?
- Serve cambiare lo stato runtime, l'abilitazione o entrambi?
- Il servizio supporta `reload`?
- Dopo una modifica ai file è stato eseguito `daemon-reload`?
- Stato, definizione effettiva e journal sono stati controllati insieme?
- Un drop-in è preferibile alla modifica del file del pacchetto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processi PID e segnali|Processi, PID e segnali]]
- [[Linux/Pagine/Unit e dipendenze systemd|Unit e dipendenze systemd]]
- [[Linux/Pagine/Timer systemd|Timer systemd]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]

## Fonti

- [systemd - systemd(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd.html)
- [systemd - systemctl(1)](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html)
- [systemd - systemd-system.conf(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd-system.conf.html)
