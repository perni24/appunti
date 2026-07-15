---
date: 2026-07-13
area: Linux
topic: Gestione macchine virtuali con libvirt
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, libvirt, virsh, kvm, qemu, virtualizzazione]
aliases: [libvirt, VM con libvirt]
prerequisites: [KVM e QEMU, systemd, Networking]
related: [Storage e filesystem, Firewall con nftables, Backup e ripristino]
---

# Macchine virtuali con libvirt

## Sintesi

libvirt offre API e strumenti stabili per gestire hypervisor e risorse di virtualizzazione. Con QEMU/KVM rappresenta macchine virtuali come **domain**, e gestisce inoltre reti virtuali, storage pool, volumi, snapshot, secret e device dell'host.

`virsh` e la CLI principale; `virt-install` crea nuove VM e `virt-manager` offre un'interfaccia grafica. libvirt non sostituisce QEMU o KVM: coordina configurazione, ciclo di vita e rilevamento delle capacita sopra questi componenti.

## Quando usarlo

- Gestire VM persistenti senza mantenere manualmente lunghe righe di comando QEMU.
- Amministrare reti virtuali, pool e volumi con una API comune.
- Automatizzare avvio, arresto, inventario e configurazione delle VM.
- Usare `virt-manager`, `virt-install` o strumenti che parlano con libvirt.
- Preparare configurazioni coerenti per backup e migrazione.

## Come funziona

Una connessione libvirt punta a un driver tramite URI. Per QEMU, le due modalita locali piu comuni sono:

- `qemu:///system`: istanza di sistema, adatta a VM condivise e reti gestite; richiede autorizzazioni definite dal sistema e da polkit.
- `qemu:///session`: istanza per utente, con minori privilegi e risorse separate; alcune funzioni di rete, autostart e accesso ai device sono differenti.

Un domain puo essere **defined** ma spento, oppure **active** quando il processo QEMU e in esecuzione. La definizione persistente e espressa in XML e include CPU, memoria, firmware, dischi, interfacce e device. L'XML deve essere modificato tramite API, `virsh edit` o strumenti libvirt, evitando di cambiare file interni gestiti dal servizio.

Le reti virtuali possono offrire bridge, NAT e DHCP. Gli storage pool organizzano directory, block device o backend remoti; i volumi rappresentano dischi utilizzabili dalle VM. Pool e rete non sono backup: descrivono risorse attive che devono avere procedure di protezione proprie.

Le versioni recenti possono usare daemon modulari, per esempio `virtqemud`, `virtnetworkd` e `virtstoraged`, invece del solo `libvirtd` monolitico. I nomi dei servizi dipendono dalla distribuzione e dalla configurazione installata.

## API / Sintassi

Mostrare l'URI effettivamente usato:

```bash
virsh uri
```

Interrogare esplicitamente l'istanza di sistema:

```bash
virsh --connect qemu:///system list --all
```

Interrogare esplicitamente l'istanza utente:

```bash
virsh --connect qemu:///session list --all
```

Mostrare informazioni su un domain:

```bash
virsh dominfo nome-vm
```

Esportare la definizione XML:

```bash
virsh dumpxml nome-vm
```

Elencare le reti virtuali:

```bash
virsh net-list --all
```

Elencare gli storage pool:

```bash
virsh pool-list --all
```

Elencare i volumi di un pool:

```bash
virsh vol-list nome-pool
```

Avviare una VM definita:

```bash
virsh start nome-vm
```

Richiedere uno spegnimento ACPI ordinato:

```bash
virsh shutdown nome-vm
```

Aprire la console seriale configurata:

```bash
virsh console nome-vm
```

Mostrare le capacita dell'host viste da libvirt:

```bash
virsh capabilities
```

## Esempio pratico

Verificare prima la connessione scelta:

```bash
virsh --connect qemu:///system uri
```

Creare una VM persistente con `virt-install`, disco qcow2 gestito nel pool predefinito e rete libvirt predefinita:

```bash
virt-install --connect qemu:///system --name laboratorio --memory 4096 --vcpus 2 --disk pool=default,size=40,format=qcow2,bus=virtio --network network=default,model=virtio --cdrom /percorso/installazione.iso --osinfo detect=on,require=off
```

Controllarne la definizione:

```bash
virsh --connect qemu:///system dumpxml laboratorio
```

Il nome del pool, la rete, il percorso ISO e il profilo OS devono esistere sul sistema reale. Prima dell'uso in produzione vanno definiti firmware, Secure Boot quando necessario, modello CPU, backup e policy di accesso.

## Varianti

- `virsh` e adatto a scripting e amministrazione remota.
- `virt-install` costruisce una definizione e avvia il processo di installazione.
- `virt-manager` usa libvirt e facilita configurazione e console grafica.
- `qemu:///system` centralizza VM dell'host; `qemu:///session` separa le VM per utente.
- Una rete NAT libvirt e semplice per laboratori; un bridge collega la VM alla rete esterna secondo la configurazione dell'host.
- Gli snapshot possono essere interni o esterni e hanno vincoli diversi su formato disco, memoria e consolidamento.
- Il QEMU guest agent consente operazioni coordinate con il sistema guest, ma deve essere installato, configurato e autorizzato.
- Le migrazioni richiedono compatibilita CPU, storage, rete e versioni dei componenti.

## Errori comuni

- Eseguire un comando sulla URI sbagliata e non trovare la VM attesa.
- Usare `destroy` come normale spegnimento: equivale a togliere alimentazione al guest.
- Modificare direttamente file XML interni invece della definizione gestita da libvirt.
- Confondere snapshot, checkpoint e backup indipendente.
- Copiare un disco mentre il guest lo modifica senza quiescing o procedura consistente.
- Usare CPU `host-passthrough` e poi attendersi migrazione verso host differenti.
- Avviare la stessa immagine disco da piu VM senza un formato o filesystem progettato per accesso concorrente.
- Esporre VNC, SPICE, console o socket libvirt senza protezione adeguata.
- Concedere accesso ai gruppi di virtualizzazione senza valutarne i privilegi effettivi.
- Presumere che nomi di daemon e pacchetti siano uguali su tutte le distribuzioni.

## Checklist

- La URI `system` o `session` e esplicita e corretta?
- Domain, rete e pool sono definiti e attivi quando necessario?
- CPU, firmware e machine type sono compatibili con host e obiettivi di migrazione?
- Dischi e formati sono dichiarati esplicitamente?
- Le interfacce usano rete NAT, bridge o passthrough secondo il requisito reale?
- Lo shutdown ordinato e il guest agent funzionano?
- Snapshot, backup e ripristino sono stati provati separatamente?
- Permessi, polkit, console e socket rispettano il minimo privilegio?
- Log di libvirt e QEMU sono inclusi nel troubleshooting?
- La definizione XML e inventariata insieme alle dipendenze esterne?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/KVM e QEMU|KVM e QEMU]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]

## Fonti

- [libvirt API concepts](https://libvirt.org/api.html)
- [libvirt connection URIs](https://libvirt.org/uri.html)
- [libvirt QEMU driver](https://libvirt.org/drvqemu.html)
- [virsh manual](https://libvirt.org/manpages/virsh.html)
- [libvirt daemon manual pages](https://libvirt.org/manpages/index.html)
- [Virtual Machine Manager](https://virt-manager.org/)
