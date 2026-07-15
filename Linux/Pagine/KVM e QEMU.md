---
date: 2026-07-13
area: Linux
topic: Virtualizzazione con KVM e QEMU
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, kvm, qemu, virtualizzazione, macchina-virtuale]
aliases: [QEMU KVM, Virtualizzazione hardware Linux]
prerequisites: [Architettura Linux kernel shell e user space, Moduli del kernel, Rilevamento hardware]
related: [Macchine virtuali con libvirt, Container, Gestione energetica]
---

# KVM e QEMU

## Sintesi

KVM e QEMU svolgono ruoli complementari. KVM e l'interfaccia di virtualizzazione del kernel Linux che espone `/dev/kvm` e permette a un processo user space di eseguire CPU virtuali con accelerazione hardware. QEMU modella la macchina, la memoria, i device, il firmware e lo storage; puo usare KVM come acceleratore oppure emulare la CPU con TCG.

Senza accelerazione, QEMU puo emulare anche architetture differenti da quella dell'host, ma con prestazioni inferiori. Con KVM, guest e host devono avere architetture compatibili e la CPU deve offrire le estensioni di virtualizzazione abilitate dal firmware.

## Quando usarlo

- Eseguire sistemi operativi guest isolati con un kernel proprio.
- Creare laboratori per reti, kernel e amministrazione di sistema.
- Testare distribuzioni o software che richiedono un sistema completo.
- Emulare una diversa architettura per sviluppo e debug.
- Usare libvirt o altri strumenti che si appoggiano a QEMU/KVM.

## Come funziona

QEMU crea un processo sull'host. Con `-accel kvm`, apre `/dev/kvm`, crea VM e vCPU tramite ioctl e demanda alla CPU fisica l'esecuzione delle istruzioni guest compatibili. Gli accessi che richiedono emulazione tornano allo user space, dove QEMU implementa il modello dei device e coordina I/O e memoria.

Virtio fornisce device paravirtualizzati per disco, rete, console e altre funzioni, riducendo il costo dell'emulazione hardware tradizionale. Il guest deve avere driver virtio appropriati.

Il firmware guest puo essere BIOS legacy o UEFI, spesso fornito da OVMF su x86. I file del firmware e delle variabili UEFI devono essere gestiti separatamente dal firmware dell'host.

Per lo storage, i formati piu comuni sono:

- `raw`: layout semplice, bassa complessita e facile integrazione con block device; un file sparse puo apparire piu grande dello spazio realmente allocato.
- `qcow2`: supporta funzionalita come allocazione dinamica, snapshot interni, backing file e compressione, con maggiore complessita.

Uno snapshot mantiene uno stato collegato alla VM e non sostituisce un backup indipendente. Backing chain e snapshot richiedono procedure esplicite di consolidamento e verifica.

## API / Sintassi

Verificare se il device KVM esiste:

```bash
test -e /dev/kvm
```

Mostrare permessi e proprietario del device KVM:

```bash
ls -l /dev/kvm
```

Mostrare moduli kernel caricati:

```bash
lsmod
```

Mostrare le capacita di virtualizzazione riportate dalla CPU:

```bash
lscpu
```

Mostrare la versione QEMU per x86_64:

```bash
qemu-system-x86_64 --version
```

Mostrare gli acceleratori supportati dal binario:

```bash
qemu-system-x86_64 -accel help
```

Mostrare i tipi di macchina disponibili:

```bash
qemu-system-x86_64 -machine help
```

Creare un disco qcow2 da 40 GiB:

```bash
qemu-img create -f qcow2 laboratorio.qcow2 40G
```

Ispezionare formato e dimensioni del disco:

```bash
qemu-img info laboratorio.qcow2
```

Controllare la coerenza di un'immagine qcow2 non in uso:

```bash
qemu-img check laboratorio.qcow2
```

## Esempio pratico

Creare il disco virtuale:

```bash
qemu-img create -f qcow2 laboratorio.qcow2 40G
```

Avviare una VM x86_64 da ISO con KVM, 4 GiB di RAM, due vCPU, disco virtio e rete user-mode:

```bash
qemu-system-x86_64 -name laboratorio -accel kvm -cpu host -m 4G -smp 2 -drive file=laboratorio.qcow2,format=qcow2,if=virtio -cdrom installazione.iso -boot order=d -nic user,model=virtio-net-pci
```

Il percorso e la sintassi dipendono dall'architettura, dal pacchetto QEMU e dal firmware scelto. Per VM persistenti e ripetibili e preferibile descrivere la configurazione con libvirt, che effettua anche rilevamento delle capacita dell'host.

## Varianti

- KVM accelera guest compatibili con l'architettura dell'host Linux.
- TCG emula la CPU e permette anche combinazioni host/guest differenti.
- `qcow2` privilegia funzionalita di gestione; `raw` privilegia semplicita e prevedibilita.
- Virtio riduce l'overhead rispetto a molti device completamente emulati.
- VFIO permette il passthrough di device, ma richiede IOMMU, gruppi corretti e un modello di sicurezza rigoroso.
- UEFI con OVMF e spesso preferibile per sistemi moderni; BIOS legacy resta utile per compatibilita.
- QMP e l'interfaccia JSON versionata usata da strumenti gestionali; HMP e il monitor interattivo orientato all'uso umano.
- libvirt aggiunge inventario, configurazione persistente, reti e storage gestiti sopra QEMU/KVM.

## Errori comuni

- Dire che KVM emula da solo un PC completo: device e macchina sono normalmente forniti da QEMU.
- Avviare QEMU senza indicare l'acceleratore e ottenere TCG quando si attendevano prestazioni KVM.
- Presumere che la presenza dei flag CPU basti quando virtualizzazione e disabilitata nel firmware.
- Usare `-cpu host` per VM che devono migrare tra host con CPU differenti.
- Omettere `format=qcow2` o `format=raw` e affidarsi al probing del formato su immagini non attendibili.
- Modificare un'immagine disco mentre la VM la sta usando.
- Trattare snapshot o backing file come backup autonomi.
- Esporre monitor QMP/HMP o console su rete senza autenticazione e controllo degli accessi.
- Eseguire QEMU come root quando non e necessario.
- Fare passthrough di device senza comprendere IOMMU, reset del device e impatto sull'host.

## Checklist

- CPU, firmware e kernel supportano la virtualizzazione richiesta?
- `/dev/kvm` esiste ed e accessibile all'utente corretto?
- L'acceleratore effettivo e KVM o TCG?
- Architettura, machine type e modello CPU soddisfano compatibilita e migrazione?
- Firmware guest e variabili UEFI sono persistenti e aggiornati?
- Disco, formato e cache policy sono espliciti?
- I guest usano driver virtio appropriati?
- Rete e porte inoltrate espongono solo cio che serve?
- Snapshot, backup e spegnimento consistente sono procedure distinte?
- QEMU gira con privilegi, device e filesystem minimi?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Architettura Linux kernel shell e user space|Architettura Linux: kernel, shell e user space]]
- [[Linux/Pagine/Moduli del kernel|Moduli del kernel]]
- [[Linux/Pagine/Rilevamento hardware|Rilevamento hardware]]
- [[Linux/Pagine/Container|Container]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/Macchine virtuali con libvirt|Macchine virtuali con libvirt]]

## Fonti

- [Linux kernel - KVM](https://docs.kernel.org/virt/kvm/index.html)
- [Linux kernel - KVM API](https://docs.kernel.org/virt/kvm/api.html)
- [QEMU system emulation - Introduction](https://qemu.readthedocs.io/en/master/system/introduction.html)
- [QEMU disk images](https://qemu.readthedocs.io/en/master/system/images.html)
- [QEMU security](https://qemu.readthedocs.io/en/master/system/security.html)
