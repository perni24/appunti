---
date: 2026-07-11
area: Linux
topic: systemd journal
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, systemd, journalctl, logging, troubleshooting]
aliases: [journalctl, systemd journal]
prerequisites: [systemd, Unit e dipendenze systemd]
related: [Monitoraggio delle risorse, Timer systemd]
---

# Logging con journalctl

## Sintesi

`systemd-journald` raccoglie eventi strutturati provenienti da kernel, servizi, syslog e altre sorgenti. `journalctl` interroga il journal usando tempo, boot, unit, priorità e campi strutturati invece di affidarsi soltanto a ricerche sul testo.

La persistenza dipende dalla configurazione di journald e dalla disponibilità dello storage previsto. I permessi determinano quali journal di sistema e di altri utenti sono leggibili.

## Quando usarlo

- Diagnosticare l'avvio o il fallimento di una unit.
- Consultare messaggi del boot corrente o precedente.
- Seguire log in tempo reale.
- Filtrare per priorità, intervallo e campi strutturati.
- Valutare spazio occupato e policy di conservazione.

## Come funziona

Ogni record può contenere `MESSAGE` e metadati come `_PID`, `_UID`, `_SYSTEMD_UNIT`, `_BOOT_ID`, priorità e timestamp. I campi affidabili aggiunti da journald iniziano spesso con underscore; altri possono essere forniti dall'applicazione.

Filtri su campi differenti vengono normalmente combinati con AND; più valori dello stesso campo rappresentano alternative. L'opzione `-u` costruisce un filtro adatto a una unit includendo anche messaggi correlati.

Il journal può essere volatile sotto `/run/log/journal` o persistente sotto `/var/log/journal`, secondo `Storage=` in `journald.conf`, disponibilità delle directory e configurazione della distribuzione.

## API / Sintassi

Mostrare gli eventi del boot corrente:

```bash
journalctl -b
```

Mostrare il boot precedente:

```bash
journalctl -b -1
```

Elencare i boot disponibili:

```bash
journalctl --list-boots
```

Filtrare per una unit:

```bash
journalctl -u nginx.service
```

Seguire nuovi eventi della unit:

```bash
journalctl -u nginx.service -f
```

Mostrare eventi da un momento specifico:

```bash
journalctl --since 'today 08:00'
```

Mostrare priorità da emergenza a errore:

```bash
journalctl -p err..emerg
```

Mostrare soltanto i messaggi del kernel nel boot corrente:

```bash
journalctl -k -b
```

Produrre record JSON:

```bash
journalctl -u nginx.service -o json
```

## Esempio pratico

Controllare perché un servizio è fallito nel boot corrente:

```bash
systemctl status applicazione.service
```

Leggere tutti i suoi eventi senza pager:

```bash
journalctl -u applicazione.service -b --no-pager
```

Limitare la ricerca all'ultima ora:

```bash
journalctl -u applicazione.service --since '-1 hour'
```

Mostrare i campi strutturati completi di un record:

```bash
journalctl -u applicazione.service -n 1 -o verbose
```

La vista `verbose` aiuta a scegliere filtri su campi reali invece di costruire ricerche testuali fragili.

## Varianti

- `journalctl -n 100` mostra gli ultimi cento eventi accessibili.
- `-o cat` mostra soltanto il messaggio; `short-iso` produce timestamp leggibili; `json` è adatto all'elaborazione strutturata.
- `journalctl FIELD=valore` filtra direttamente un campo, per esempio `_PID=1234`.
- `systemd-cat` invia output o messaggi al journal.
- `coredumpctl` consulta core dump e metadati gestiti dall'infrastruttura systemd.
- `journalctl --disk-usage` misura lo spazio; rotazione e vacuum sono operazioni distinte dalla policy permanente.

## Errori comuni

- Usare soltanto `systemctl status`, che mostra un estratto limitato.
- Cercare tutto con `grep` ignorando campi, boot e intervalli temporali.
- Supporre che il boot precedente sia disponibile senza journal persistente.
- Eseguire vacuum aggressivi senza prima configurare limiti permanenti in `journald.conf`.
- Confondere l'assenza di eventi con mancanza di permessi di lettura.
- Registrare password, token o dati personali confidando nei permessi del journal.
- Usare timestamp ambigui senza controllare timezone e clock del sistema.

## Checklist

- La ricerca riguarda quale boot, unit e intervallo temporale?
- L'utente ha accesso ai record necessari?
- Priorità e campi strutturati possono ridurre il rumore?
- Il journal è persistente e contiene ancora il periodo richiesto?
- Formato umano, verbose o JSON è più adatto?
- I limiti di spazio sono configurati in modo permanente?
- I log evitano segreti e dati sensibili non necessari?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Unit e dipendenze systemd|Unit e dipendenze systemd]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/Timer systemd|Timer systemd]]

## Fonti

- [systemd - journalctl(1)](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)
- [systemd - systemd-journald.service(8)](https://www.freedesktop.org/software/systemd/man/latest/systemd-journald.service.html)
- [systemd - systemd.journal-fields(7)](https://www.freedesktop.org/software/systemd/man/latest/systemd.journal-fields.html)
- [systemd - journald.conf(5)](https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html)
