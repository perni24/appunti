---
date: 2026-07-11
area: Linux
topic: Gestione dinamica device
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, udev, hardware, device, regole]
aliases: [systemd-udevd, Regole udev]
prerequisites: [Rilevamento hardware, Driver e firmware]
related: [D-Bus, systemd]
---

# udev

## Sintesi

udev riceve uevent dal kernel, raccoglie attributi, applica regole e gestisce proprietà, permessi e symlink dei device. Non crea il device kernel: traduce eventi e informazioni in una rappresentazione user-space utilizzabile.

Le regole devono essere rapide e deterministiche. Lavori lunghi vanno delegati a unit systemd o servizi, perché il worker udev ha timeout e ambiente limitato.

## Quando usarlo

- Creare symlink persistenti per device specifici.
- Impostare proprietà e permessi controllati.
- Diagnosticare eventi add, remove e change.
- Collegare un device a una unit systemd.
- Verificare attributi usabili nelle regole.

## Come funziona

Le regole in `/usr/lib/udev/rules.d`, `/run/udev/rules.d` e `/etc/udev/rules.d` vengono ordinate lessicograficamente con precedenze definite. Le regole amministrative appartengono a `/etc` e non devono modificare file del pacchetto.

Operatori tipici:

| Forma | Ruolo |
| --- | --- |
| `SUBSYSTEM==` | confronta sottosistema |
| `ATTR{}` / `ATTRS{}` | confronta attributo del device o parent |
| `ENV{}` | confronta o assegna proprietà |
| `SYMLINK+=` | aggiunge un symlink sotto `/dev` |
| `TAG+=` | aggiunge tag per altri componenti |

L'ordine conta: una regola successiva può ampliare o sostituire assegnazioni secondo operatore.

## API / Sintassi

Mostrare proprietà di un device:

```bash
udevadm info --query=all --name=/dev/sdX
```

Mostrare catena di attributi per creare match:

```bash
udevadm info --attribute-walk --name=/dev/sdX
```

Monitorare eventi e proprietà:

```bash
udevadm monitor --kernel --udev --property
```

Verificare una regola sul syspath senza applicare operazioni reali:

```bash
sudo udevadm test /sys/class/block/sdX
```

Ricaricare le regole:

```bash
sudo udevadm control --reload
```

Attendere il completamento degli eventi in coda:

```bash
udevadm settle
```

## Esempio pratico

Una regola `/etc/udev/rules.d/70-sensore.rules` può creare un symlink per un device USB seriale verificato:

```udev
SUBSYSTEM=="tty", ATTRS{idVendor}=="1234", ATTRS{idProduct}=="5678", SYMLINK+="sensore"
```

Ricaricare le regole:

```bash
sudo udevadm control --reload
```

Scollegare e ricollegare il device oppure generare eventi soltanto dopo aver limitato correttamente il target. Verificare:

```bash
udevadm info --query=all --name=/dev/sensore
```

Vendor e product possono non distinguere due unità identiche; quando disponibile aggiungere un seriale stabile.

## Varianti

- `SYSTEMD_WANTS` può richiedere una unit per un device opportunamente taggato.
- `TAG+="uaccess"` delega accesso alla sessione attiva secondo policy, ma non è adatto a ogni servizio.
- Regole `.link` di systemd gestiscono naming e proprietà di interfacce di rete.
- Symlink `/dev/disk/by-*` forniscono identificatori storage persistenti generati dalle regole standard.
- `RUN+=` è limitato e non adatto a daemon, mount o processi lunghi.
- I container spesso non eseguono udev e ricevono device già filtrati dall'host.

## Errori comuni

- Usare `KERNEL=="sdX"` come identificatore persistente.
- Avviare script lunghi o daemon con `RUN+=`.
- Usare attributi del parent sbagliato senza `attribute-walk`.
- Rendere un device world-writable invece di usare gruppi o policy di sessione.
- Ricaricare regole e aspettarsi che cambino retroattivamente tutti i device senza nuovo evento.
- Eseguire trigger non limitati su un sistema remoto o in produzione.
- Modificare file in `/usr/lib/udev/rules.d`.

## Checklist

- Il match usa proprietà stabili e sufficientemente univoche?
- `udevadm test` mostra la regola attesa?
- Permessi e ownership seguono il minimo privilegio?
- Il lavoro lungo è delegato a systemd?
- Nome e priorità del file rispettano le regole esistenti?
- Il comportamento add, change e remove è stato considerato?
- Il device viene verificato dopo un evento reale?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Rilevamento hardware|Rilevamento hardware]]
- [[Linux/Pagine/Driver e firmware|Driver e firmware]]
- [[Linux/Pagine/D-Bus|D-Bus]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [udev(7)](https://www.freedesktop.org/software/systemd/man/latest/udev.html)
- [udevadm(8)](https://www.freedesktop.org/software/systemd/man/latest/udevadm.html)
- [systemd-udevd.service(8)](https://www.freedesktop.org/software/systemd/man/latest/systemd-udevd.service.html)
