---
date: 2026-07-11
area: Linux
topic: Memoria swap
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, swap, memoria, paging, zram]
aliases: [Swap Linux, Area di swap]
prerequisites: [Monitoraggio delle risorse, Configurazione di fstab]
related: [Partizionamento dei dischi, Filesystem ext4 Btrfs e XFS]
---

# Swap

## Sintesi

La swap è spazio su dispositivo a blocchi o file che il kernel può usare per spostare pagine di memoria anonima fuori dalla RAM. Può assorbire picchi, lasciare più RAM alla cache e supportare l'ibernazione, ma è molto più lenta della memoria fisica e non risolve un consumo incontrollato.

Presenza di swap e attività di swapping sono concetti diversi. Una swap configurata ma quasi inutilizzata non rappresenta un problema; swap-in e swap-out continui insieme a pressione elevata indicano invece possibile thrashing.

## Quando usarlo

- Gestire picchi di memoria senza terminazione immediata dei processi.
- Supportare workload con pagine inattive.
- Configurare l'ibernazione con spazio e resume corretti.
- Aggiungere temporaneamente capacità tramite swapfile.
- Usare zram per swap compressa in RAM.

## Come funziona

`swapon` registra una o più aree con priorità. Il kernel decide quali pagine spostare secondo pressione, attività e policy come `vm.swappiness`; il parametro non è una semplice percentuale di RAM da riempire prima di usare swap.

Una partizione swap è dedicata. Uno swapfile vive dentro un filesystem e deve rispettarne i vincoli: file con buchi o extent non stabili possono non essere accettati. Btrfs richiede gestione specifica del file swap e limita alcune operazioni sul subvolume che lo contiene.

Per l'ibernazione, lo spazio deve poter contenere l'immagine necessaria e l'ambiente di boot deve sapere da dove riprenderla. Non basta attivare una swap qualsiasi.

## API / Sintassi

Mostrare swap attive e priorità:

```bash
swapon --show
```

Mostrare utilizzo complessivo:

```bash
free -h
```

Osservare swap-in e swap-out nel tempo:

```bash
vmstat 1
```

Leggere la swappiness corrente:

```bash
sysctl vm.swappiness
```

Inizializzare una partizione verificata come swap:

```bash
sudo mkswap /dev/sdX1
```

Attivare una area:

```bash
sudo swapon /dev/sdX1
```

Disattivarla quando esiste memoria sufficiente:

```bash
sudo swapoff /dev/sdX1
```

## Esempio pratico

Creare un file allocato con dati reali, metodo ampiamente compatibile:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
```

Limitare l'accesso:

```bash
sudo chmod 600 /swapfile
```

Scrivere la signature swap:

```bash
sudo mkswap /swapfile
```

Attivare il file:

```bash
sudo swapon /swapfile
```

Verificare:

```bash
swapon --show
```

Voce persistente in `/etc/fstab`:

```fstab
/swapfile none swap defaults 0 0
```

Prima di creare uno swapfile su Btrfs o un filesystem non comune, seguire la documentazione specifica invece di riutilizzare automaticamente questa sequenza.

## Varianti

- Più aree con stessa priorità possono essere usate in modo interleaved.
- zram crea device compressi in RAM e riduce I/O a costo di CPU e memoria compressa.
- zswap è una cache compressa davanti alla swap su storage.
- `mkswap --file` nelle util-linux recenti semplifica la creazione rispettando alcuni vincoli del filesystem.
- Una partizione swap evita dipendenze dal filesystem ma è meno flessibile da ridimensionare.
- Cgroup v2 permette limiti e controllo della swap per gruppi di processi.

## Errori comuni

- Considerare la swap equivalente a RAM aggiuntiva con le stesse prestazioni.
- Disattivare tutta la swap durante forte pressione e provocare OOM.
- Usare un file sparse o non compatibile e ignorare gli errori di `swapon`.
- Rendere lo swapfile leggibile da utenti non autorizzati.
- Cambiare `swappiness` copiando valori casuali senza misurare il workload.
- Configurare l'ibernazione senza dimensionamento e parametri di resume.
- Interpretare qualche MiB occupato in swap come prova automatica di un problema.

## Checklist

- Il caso d'uso è picco, stabilità, ibernazione o zram?
- Dimensione e priorità sono motivate dal workload?
- Il filesystem supporta correttamente lo swapfile?
- I permessi del file sono `600`?
- `vmstat` mostra attività continua o soltanto pagine inattive?
- Esiste memoria sufficiente prima di `swapoff`?
- Persistenza e resume sono configurati separatamente quando necessari?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/Configurazione di fstab|Configurazione di fstab]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]

## Fonti

- [util-linux - swapon(8)](https://man7.org/linux/man-pages/man8/swapon.8.html)
- [util-linux - mkswap(8)](https://man7.org/linux/man-pages/man8/mkswap.8.html)
- [Linux kernel - swap](https://docs.kernel.org/admin-guide/mm/index.html)
- [Btrfs - swapfile](https://btrfs.readthedocs.io/en/latest/Swapfile.html)
