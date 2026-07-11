---
date: 2026-07-11
area: Linux
topic: Gestione energia Linux
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, energia, sospensione, ibernazione, batteria]
aliases: [Power management Linux, Sospensione Linux]
prerequisites: [Rilevamento hardware, systemd]
related: [Swap, Driver e firmware]
---

# Gestione energetica

## Sintesi

La gestione energetica coinvolge firmware ACPI, kernel, driver, systemd-logind e servizi desktop. Comprende stati idle CPU, frequenze, runtime power management, luminosità, sospensione e ibernazione.

La sospensione mantiene lo stato principalmente in RAM; l'ibernazione salva un'immagine su storage e spegne il sistema. Quest'ultima richiede swap e configurazione di resume coerenti.

## Quando usarlo

- Diagnosticare consumo o autonomia anomali.
- Verificare profili prestazioni/bilanciato/risparmio.
- Configurare comportamento alla chiusura del coperchio.
- Analizzare mancata sospensione o resume.
- Controllare stato e salute della batteria.

## Come funziona

Il kernel espone stati e policy in sysfs; driver e governor applicano decisioni. power-profiles-daemon, TLP e strumenti vendor possono gestire alcune stesse proprietà e non devono essere sovrapposti senza una ownership chiara.

systemd-logind coordina richieste di suspend, hibernate, lid switch e inhibitor. Applicazioni possono dichiarare inhibitor temporanei per evitare sospensione durante attività critiche.

## API / Sintassi

Mostrare profili energetici disponibili:

```bash
powerprofilesctl list
```

Mostrare il profilo corrente:

```bash
powerprofilesctl get
```

Mostrare device energetici tramite UPower:

```bash
upower -e
```

Mostrare dettagli della batteria:

```bash
upower -i /org/freedesktop/UPower/devices/battery_BAT0
```

Mostrare inhibitor attivi:

```bash
systemd-inhibit --list
```

Mostrare stati sleep supportati dal kernel:

```bash
cat /sys/power/state
```

Richiedere sospensione tramite systemd:

```bash
systemctl suspend
```

Mostrare informazioni cpufreq quando cpupower è disponibile:

```bash
cpupower frequency-info
```

## Esempio pratico

Prima di testare suspend, chiudere attività critiche e mantenere accesso locale. Controllare inhibitor:

```bash
systemd-inhibit --list
```

Eseguire il test:

```bash
systemctl suspend
```

Dopo il resume, consultare log del boot corrente:

```bash
journalctl -b | grep -iE 'suspend|resume|sleep'
```

Se il sistema si riavvia o si blocca, confrontare firmware, driver grafici, device USB e modalità sleep prima di modificare più parametri insieme.

## Varianti

- `suspend-then-hibernate` sospende e successivamente iberna secondo configurazione.
- `s2idle` e suspend-to-RAM profondo hanno consumi e compatibilità differenti.
- TLP offre policy estese, soprattutto laptop, ma può confliggere con altri manager.
- Powertop osserva wakeup e stime; l'autotune non è una policy universale sicura.
- Runtime PM sospende singoli device inattivi.
- Charge threshold dipende da driver e supporto firmware/vendor.

## Errori comuni

- Installare più daemon che modificano le stesse policy.
- Testare suspend su host remoto senza accesso fisico.
- Configurare ibernazione senza swap e resume corretti.
- Considerare una stima batteria un valore assoluto stabile.
- Applicare ogni suggerimento Powertop senza testare device e resume.
- Attribuire consumo soltanto alla CPU ignorando display, radio e wakeup.
- Cambiare firmware, kernel e policy contemporaneamente.

## Checklist

- Quale componente possiede la policy energetica?
- Firmware e driver sono aggiornati e supportati?
- Stati sleep disponibili corrispondono alle aspettative?
- Esistono inhibitor legittimi?
- Swap e resume supportano l'ibernazione?
- Consumo è misurato su intervalli comparabili?
- Test e rollback sono eseguibili con accesso locale?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Rilevamento hardware|Rilevamento hardware]]
- [[Linux/Pagine/Driver e firmware|Driver e firmware]]
- [[Linux/Pagine/Swap|Swap]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [Linux kernel power management](https://docs.kernel.org/admin-guide/pm/)
- [systemd sleep](https://www.freedesktop.org/software/systemd/man/latest/systemd-suspend.service.html)
- [UPower](https://upower.freedesktop.org/)
- [power-profiles-daemon](https://gitlab.freedesktop.org/upower/power-profiles-daemon)
