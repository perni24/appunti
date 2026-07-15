---
date: 2026-07-11
area: Linux
topic: Configurazione mount persistenti
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, fstab, mount, uuid, boot]
aliases: [fstab, Mount persistenti Linux]
prerequisites: [Mount e umount, Partizionamento dei dischi]
related: [Swap, systemd]
---

# Configurazione di fstab

## Sintesi

`/etc/fstab` descrive filesystem e swap che gli strumenti di sistema possono attivare. Ogni riga ha sei campi: sorgente, target, tipo, opzioni, dump e ordine di controllo. Un errore può rallentare o interrompere il boot, quindi ogni modifica va validata prima del riavvio.

Per i filesystem su disco è preferibile usare `UUID=` o un altro identificatore persistente invece di nomi come `/dev/sdb1`, che possono cambiare.

## Quando usarlo

- Rendere persistente un mount locale o remoto.
- Definire opzioni e comportamento in caso di device assente.
- Attivare swap al boot.
- Configurare automount gestiti da systemd.
- Stabilire l'ordine dei controlli filesystem compatibili.

## Come funziona

Formato:

```text
source target fstype options dump pass
```

| Campo | Contenuto |
| --- | --- |
| source | device, `UUID=`, `LABEL=`, `PARTUUID=` o sorgente remota |
| target | mount point; `none` per swap |
| fstype | tipo come `ext4`, `xfs`, `btrfs`, `swap` |
| options | elenco separato da virgole |
| dump | normalmente `0` |
| pass | ordine per `fsck`: root spesso `1`, altri compatibili `2`, nessun controllo `0` |

Spazi e tab nei campi devono essere codificati come `\040` e `\011`, anche se il testo sembra quotato. Su sistemi systemd, il generatore traduce le righe in unit di mount e swap; dopo una modifica è raccomandato `systemctl daemon-reload`.

## API / Sintassi

Mostrare UUID e tipi disponibili:

```bash
lsblk -f
```

Interrogare direttamente una sorgente verificata:

```bash
sudo blkid /dev/sdX1
```

Modificare il file con privilegi amministrativi:

```bash
sudoedit /etc/fstab
```

Verificare sintassi e risoluzione delle sorgenti:

```bash
findmnt --verify --verbose
```

Ricaricare la configurazione nel manager systemd:

```bash
sudo systemctl daemon-reload
```

Montare le voci applicabili non ancora montate:

```bash
sudo mount -a
```

Controllare il risultato per target:

```bash
findmnt --target /mnt/dati
```

## Esempio pratico

Voce ext4 persistente:

```fstab
UUID=11111111-2222-3333-4444-555555555555 /srv/dati ext4 defaults 0 2
```

Device rimovibile che non deve bloccare il boot:

```fstab
UUID=AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE /mnt/archivio ext4 nofail,x-systemd.device-timeout=5s 0 2
```

Mount attivato al primo accesso:

```fstab
UUID=11111111-2222-3333-4444-555555555555 /srv/dati ext4 nofail,x-systemd.automount 0 2
```

Dopo aver sostituito gli UUID di esempio con valori reali, verificare:

```bash
findmnt --verify --verbose
```

`mount -a` non è il validatore principale di `fstab`; può tentare mount reali. Va eseguito soltanto dopo `findmnt --verify` e dopo aver considerato l'effetto delle sorgenti remote.

## Varianti

- `nofail` consente di proseguire se il device non è disponibile, ma può nascondere un requisito realmente essenziale.
- `noauto` evita l'attivazione tramite `mount -a` e al boot.
- `x-systemd.automount` crea una automount unit e attiva il mount al primo accesso.
- `x-systemd.device-timeout=` limita l'attesa di un device su sistemi systemd.
- NFS e CIFS richiedono opzioni, credenziali e dipendenze di rete specifiche.
- Una native mount unit può esprimere relazioni systemd più complesse di una riga `fstab`.

## Errori comuni

- Usare `/dev/sdb1` per un disco che può cambiare ordine.
- Copiare un UUID di esempio o quello del device sbagliato.
- Impostare `pass=2` per filesystem che non usano il flusso tradizionale di `fsck`.
- Aggiungere `nofail` a storage essenziale e scoprire il problema soltanto a runtime.
- Inserire password direttamente in una riga CIFS leggibile da utenti non autorizzati.
- Riavviare senza `findmnt --verify` e senza provare il mount.
- Dimenticare `daemon-reload` su un sistema systemd.

## Checklist

- Sorgente e UUID sono stati letti dal device corretto?
- Il mount point esiste e ha ownership appropriata?
- Tipo e opzioni sono supportati dal filesystem?
- Il comportamento in caso di device assente è intenzionale?
- I campi dump e pass sono coerenti?
- `findmnt --verify --verbose` non segnala problemi?
- Il mount è stato provato prima del riavvio?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Swap|Swap]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [util-linux - fstab(5)](https://man7.org/linux/man-pages/man5/fstab.5.html)
- [util-linux - findmnt(8)](https://man7.org/linux/man-pages/man8/findmnt.8.html)
- [util-linux - blkid(8)](https://man7.org/linux/man-pages/man8/blkid.8.html)
- [systemd - systemd.mount(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.mount.html)
