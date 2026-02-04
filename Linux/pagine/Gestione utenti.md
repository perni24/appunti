---
date: 2026-02-04
tags: [linux, gestione-utenti, sicurezza]
type: #permanent-note
status: budding
---

# Gestione Utenti e Permessi in Linux

Questa nota fornisce una guida rapida alla gestione degli utenti e dei relativi permessi sui sistemi [[Linux]], con un focus particolare sulle distribuzioni come [[Arch Linux]]. La corretta configurazione degli utenti e dei permessi è fondamentale per la [[sicurezza]] e la stabilità del sistema. Per una panoramica generale sui comandi [[Linux]], consulta [[Linux/Indice]].

## 0. Gestione dei Permessi di Amministrazione (sudo)

Per eseguire comandi con privilegi di superutente senza accedere direttamente come `root`, si utilizza il comando `sudo`. È buona pratica configurare l'accesso a `sudo` tramite il gruppo `wheel`.

> [!INFO] sudo (SuperUser DO)
> Permette agli utenti autorizzati di eseguire programmi con i privilegi di sicurezza di un altro utente (di solito il superutente `root`).

Per concedere i permessi di amministratore al gruppo `wheel`, è necessario modificare il file di configurazione `sudoers` utilizzando `visudo`. Questo strumento garantisce la validità sintattica del file prima del salvataggio.

```bash
EDITOR=nano visudo
```
**Spiegazione:**
*   `EDITOR=nano`: Specifica che l'editor da utilizzare per modificare il file `sudoers` sarà `nano`. È possibile sostituirlo con il proprio editor preferito (es. `vim`).
*   `visudo`: Avvia l'editor designato con il file `sudoers`. Questo comando è cruciale perché esegue controlli di sintassi sul file `sudoers` prima di salvarlo, prevenendo errori che potrebbero bloccare l'accesso `sudo` al sistema.

Una volta aperto il file, cerca la riga che abilita il gruppo `wheel` (solitamente commentata) e decommentala.
```
# %wheel ALL=(ALL:ALL) ALL
```
Diventa:
```
%wheel ALL=(ALL=(ALL)) ALL
```
**Logica:**
Decommentando questa riga, si abilita il gruppo `[[wheel group]]` ad eseguire qualsiasi comando (`ALL`) come qualsiasi utente (`ALL=(ALL)`) su tutte le macchine (`ALL`). Questo è il metodo raccomandato per la gestione dei permessi amministrativi, in quanto permette di aggiungere o rimuovere utenti dal gruppo `wheel` per controllare l'accesso a `sudo`, senza modificare direttamente il file `sudoers` per ogni singolo utente.

## 1. Creazione Utenti

La creazione di nuovi utenti è un processo essenziale per la gestione di un sistema multi-utente. Il comando `useradd` è lo strumento principale per questa operazione.

Per creare un utente standard:
```bash
useradd -m -s /bin/bash nomeutente
```
**Spiegazione delle opzioni:**
*   `-m`: Questa opzione è fondamentale perché istruisce `useradd` a creare automaticamente la [[home directory]] per il nuovo utente (es. `/home/nomeutente`). Senza questa opzione, la home directory non verrebbe creata, e l'utente potrebbe riscontrare problemi nell'accesso e nella memorizzazione dei propri file.
*   `-s /bin/bash`: Imposta la [[shell]] di login predefinita per l'utente. In questo caso, viene impostata la [[Bash]] shell, che è la shell più comune e ampiamente utilizzata nei sistemi [[Linux]]. È possibile specificare altre shell a seconda delle necessità.

Per creare un utente amministratore (che possa usare `sudo`):
```bash
useradd -m -G wheel -s /bin/bash nomeutente
```
**Spiegazione delle opzioni aggiuntive:**
*   `-G wheel`: Questa opzione aggiunge il nuovo utente al gruppo `[[wheel group]]` fin dalla creazione. Nelle distribuzioni come [[Arch Linux]], gli utenti che appartengono al gruppo `wheel` sono quelli autorizzati ad utilizzare il comando `sudo` (previa configurazione di `visudo` come descritto sopra). Questo garantisce che il nuovo utente amministratore abbia immediatamente la capacità di eseguire comandi con privilegi elevati.

## 2. Impostazione Password Utente

Un utente appena creato con `useradd` è inizialmente "bloccato" e non può accedere al sistema. È necessario assegnare una password per attivarlo.

Per impostare la password per un utente:
```bash
passwd nomeutente
```
**Spiegazione:**
*   `passwd nomeutente`: Esegue il programma `passwd`, che ti chiederà di inserire e confermare la nuova password per l'utente specificato (`nomeutente`).

**Logica:**
Assegnare una password è un passaggio di [[sicurezza]] critico. Finché un utente non ha una password, non può autenticarsi e accedere al sistema, rendendo l'account inutilizzabile. La password deve essere robusta e unica per prevenire accessi non autorizzati.
