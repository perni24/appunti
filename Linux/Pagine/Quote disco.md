---
date: 2026-07-11
area: Linux
topic: Quote filesystem
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, quota, filesystem, utenti, storage]
aliases: [Disk quota, Quote utenti e gruppi]
prerequisites: [Gestione utenti, Filesystem ext4 Btrfs e XFS]
related: [Monitoraggio delle risorse, Configurazione di fstab]
---

# Quote disco

## Sintesi

Le quote limitano spazio a blocchi e numero di inode attribuibili a utenti, gruppi o, su filesystem compatibili, progetti. Un limite soft può essere superato per un periodo di grazia; un limite hard impedisce ulteriori allocazioni oltre la soglia.

Le modalità di attivazione dipendono dal filesystem. ext4 e i quota-tools tradizionali, XFS e Btrfs non condividono esattamente configurazione, accounting e strumenti.

## Quando usarlo

- Evitare che un utente riempia un filesystem condiviso.
- Limitare numero di file oltre allo spazio occupato.
- Assegnare capacità a gruppi o alberi di progetto.
- Applicare periodi di grazia prima del blocco.
- Produrre report di consumo attribuito.

## Come funziona

| Concetto | Significato |
| --- | --- |
| usage | consumo contabilizzato corrente |
| soft limit | soglia superabile temporaneamente |
| hard limit | soglia massima non superabile |
| grace period | tempo concesso sopra il soft limit |
| block quota | limite sulla capacità |
| inode quota | limite sul numero di oggetti |

Le quote per utente seguono normalmente l'UID proprietario dei file; cambiare ownership cambia l'attribuzione. Hard link, file sparse, reflink, snapshot e delayed allocation possono avere semantiche specifiche del filesystem.

Su XFS le quote devono essere abilitate con opzioni di mount appropriate, e le project quota associano un ID a un albero. Btrfs usa qgroup per subvolumi e snapshot, un modello diverso dai quota-tools tradizionali.

## API / Sintassi

Mostrare le quote dell'utente corrente:

```bash
quota -s
```

Produrre un riepilogo per utenti su filesystem tradizionali configurati:

```bash
sudo repquota -a
```

Modificare interattivamente i limiti di un utente:

```bash
sudo edquota -u nomeutente
```

Impostare limiti numerici senza editor:

```bash
sudo setquota -u nomeutente 10G 12G 0 0 /home
```

Attivare le quote configurate in `fstab`:

```bash
sudo quotaon -av
```

Disattivarle per manutenzione:

```bash
sudo quotaoff -av
```

Mostrare lo stato quote di un XFS montato:

```bash
sudo xfs_quota -x -c 'state' /srv/dati
```

Mostrare qgroup Btrfs:

```bash
sudo btrfs qgroup show /srv/dati
```

## Esempio pratico

Per ext4 con quota-tools tradizionali, una voce `fstab` può includere:

```fstab
UUID=11111111-2222-3333-4444-555555555555 /home ext4 defaults,usrquota,grpquota 0 2
```

Validare la configurazione:

```bash
findmnt --verify --verbose
```

Dopo il mount con le opzioni corrette, inizializzare o verificare i dati quota secondo la modalità supportata:

```bash
sudo quotacheck -cugm /home
```

Attivare accounting ed enforcement:

```bash
sudo quotaon -v /home
```

Prima di applicare questa procedura, verificare feature ext4 e strumenti della distribuzione: filesystem moderni possono usare quote integrate e non richiedere lo stesso flusso basato su file quota.

## Varianti

- User quota limita per UID; group quota per GID.
- Project quota limita alberi di directory senza dipendere dall'ownership di un singolo utente.
- XFS usa `xfs_quota` e opzioni come `uquota`, `gquota` o `pquota`.
- Btrfs qgroup contabilizza subvolumi e snapshot, con costi e semantica dello spazio condiviso.
- Le quote applicative possono limitare dati logici a un livello diverso dal filesystem.
- Limiti cgroup riguardano risorse runtime e non sostituiscono le disk quota persistenti.

## Errori comuni

- Impostare soltanto limiti a blocchi e dimenticare gli inode.
- Confondere capacità del filesystem con quota attribuita all'utente.
- Usare procedure ext4 su XFS o qgroup Btrfs.
- Eseguire `quotacheck` in scrittura su un filesystem attivo senza comprendere i rischi.
- Impostare soft limit senza grace period o monitoraggio.
- Credere che una quota protegga spazio riservato a root, metadata o altri filesystem.
- Ignorare UID duplicati o ownership errata.

## Checklist

- Il limite riguarda utente, gruppo, progetto o subvolume?
- Servono blocchi, inode o entrambi?
- Il filesystem e la modalità quota sono stati identificati?
- Soft limit, hard limit e grace period sono coerenti?
- Accounting ed enforcement risultano attivi?
- Esistono alert prima del raggiungimento del limite?
- Report e comportamento al superamento sono stati provati con dati non critici?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/Configurazione di fstab|Configurazione di fstab]]

## Fonti

- [Linux quota-tools](https://sourceforge.net/projects/linuxquota/)
- [quotacheck(8)](https://man7.org/linux/man-pages/man8/quotacheck.8.html)
- [XFS quota administration](https://man7.org/linux/man-pages/man8/xfs_quota.8.html)
- [Btrfs qgroup](https://btrfs.readthedocs.io/en/latest/Qgroups.html)
