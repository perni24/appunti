---
date: 2026-07-11
area: Linux
topic: Inventario hardware
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, hardware, pci, usb, sysfs]
aliases: [Hardware detection Linux, Inventario hardware Linux]
prerequisites: [Architettura Linux kernel shell e user space]
related: [Driver e firmware, udev, Monitoraggio delle risorse]
---

# Rilevamento hardware

## Sintesi

Linux espone hardware e device attraverso sysfs, procfs, udev e sottosistemi del kernel. Strumenti come `lspci`, `lsusb`, `lsblk` e `lscpu` interrogano fonti differenti; nessun singolo comando rappresenta l'intero inventario.

Rilevare un dispositivo non significa che il driver sia associato o che il firmware sia disponibile. La diagnosi deve collegare identificatore hardware, driver, log kernel e device esposto alle applicazioni.

## Quando usarlo

- Identificare modello e ID PCI o USB.
- Verificare topologia CPU, memoria e storage.
- Associare un device al driver kernel.
- Diagnosticare hardware collegato ma non utilizzabile.
- Raccogliere un inventario riproducibile.

## Come funziona

`/sys` rappresenta device, bus, driver e attributi del kernel. `/proc` espone informazioni su processi e alcuni sottosistemi. udev arricchisce gli eventi con proprietà e crea nodi o symlink sotto `/dev`.

Gli ID numerici vendor/device sono più precisi dei nomi descrittivi. I nomi `/dev/sdX` e simili dipendono dall'ordine di discovery; per storage servono seriali, WWN, UUID e symlink persistenti.

## API / Sintassi

Mostrare device PCI con ID e driver:

```bash
lspci -nnk
```

Mostrare device USB:

```bash
lsusb
```

Mostrare la topologia USB:

```bash
lsusb -t
```

Mostrare CPU e topologia:

```bash
lscpu
```

Mostrare memoria esposta dal kernel:

```bash
free -h
```

Mostrare storage, modello e seriale:

```bash
lsblk -o NAME,PATH,TYPE,SIZE,MODEL,SERIAL,WWN,FSTYPE,MOUNTPOINTS
```

Mostrare informazioni DMI quando disponibili:

```bash
sudo dmidecode
```

Mostrare eventi hardware del boot:

```bash
journalctl -k -b
```

## Esempio pratico

Per una scheda PCI non funzionante, identificare ID e driver:

```bash
lspci -nnk
```

Individuare la riga corrispondente e verificare `Kernel driver in use` e `Kernel modules`. Cercare poi messaggi del boot relativi a driver o firmware:

```bash
journalctl -k -b -p warning
```

Confrontare gli ID con la documentazione del kernel e della distribuzione prima di installare driver esterni.

## Varianti

- `hwinfo` e `inxi` aggregano dati, ma potrebbero non essere installati.
- `udevadm info` mostra proprietà udev del device.
- `ethtool -i` mostra driver e firmware di una interfaccia di rete.
- `smartctl` e `nvme` interrogano salute e log dello storage supportato.
- Device in container possono essere filtrati da namespace e cgroup.
- ACPI e device tree descrivono hardware non enumerato come PCI/USB.

## Errori comuni

- Confondere device rilevato con driver funzionante.
- Identificare un disco soltanto da `/dev/sdX`.
- Eseguire strumenti privilegiati e condividere seriali o UUID senza minimizzare dati sensibili.
- Ignorare log kernel precedenti all'avvio dell'interfaccia grafica.
- Installare un driver per un nome commerciale senza verificare vendor/device ID.
- Considerare output aggregato una fonte invariabile per script.
- Attribuire al kernel un device nascosto dal firmware o disabilitato fisicamente.

## Checklist

- Bus, vendor ID, device ID e revisione sono noti?
- Il driver è disponibile, associato e caricato?
- Firmware e log kernel mostrano errori?
- Il nodo o l'interfaccia attesi esistono?
- Permessi e policy consentono l'accesso?
- Seriali e percorsi persistenti identificano il device corretto?
- Il problema è hardware, driver, firmware o applicazione?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Driver e firmware|Driver e firmware]]
- [[Linux/Pagine/udev|udev]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]

## Fonti

- [Linux kernel device model](https://docs.kernel.org/driver-api/driver-model/)
- [pciutils](https://mj.ucw.cz/sw/pciutils/)
- [usbutils](https://github.com/gregkh/usbutils)
- [util-linux - lsblk(8)](https://man7.org/linux/man-pages/man8/lsblk.8.html)
