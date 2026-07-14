---
date: 2026-07-11
area: Linux
topic: Architettura del sistema
type: theory-note
status: "non revisionato"
difficulty: base
tags: [linux, kernel, user-space, shell, system-call]
aliases: [Architettura Linux, Kernel shell e user space]
prerequisites: []
related: [Distribuzioni Linux, Filesystem Hierarchy Standard, Terminale e comandi fondamentali]
---

# Architettura Linux: kernel, shell e user space

## Sintesi

Un sistema Linux è composto dal kernel Linux e da molti programmi eseguiti nello user space. Il kernel gestisce hardware, memoria, processi, filesystem, rete e isolamento; le applicazioni richiedono questi servizi tramite system call.

La shell è un programma dello user space che interpreta comandi. Non coincide con il kernel e non è obbligatoria per eseguire applicazioni: un ambiente grafico o un servizio può avviare processi senza passare da una shell interattiva.

## Problema che risolve

Separare kernel e user space impedisce alle normali applicazioni di accedere direttamente a memoria e dispositivi in modo arbitrario. Il kernel centralizza le operazioni privilegiate e applica controlli su identità, permessi, risorse e isolamento.

Questo modello permette di:

- eseguire più processi senza farli interferire direttamente;
- usare lo stesso insieme di interfacce su hardware differente;
- limitare l'impatto di errori nelle applicazioni;
- sostituire shell, desktop e strumenti senza cambiare kernel.

## Concetto chiave

```text
Utente
  |
  v
Shell, desktop, servizi e applicazioni
  |
  v
Librerie e runtime dello user space
  |
  v
System call e interfacce del kernel
  |
  v
Scheduler, memoria, VFS, rete e driver
  |
  v
Hardware
```

### Kernel space

Il codice del kernel opera con privilegi elevati. Le sue responsabilità principali comprendono:

- **scheduler**: decide quali thread possono usare la CPU;
- **memoria virtuale**: assegna spazi di indirizzamento e gestisce pagine e protezioni;
- **VFS**: offre un'interfaccia comune a filesystem differenti;
- **network stack**: implementa protocolli, routing e socket;
- **driver**: comunica con dispositivi fisici e virtuali;
- **sicurezza**: applica UID, GID, capability, namespace e moduli LSM.

### User space

Nello user space vengono eseguiti init system, demoni, shell, server, desktop e applicazioni. Ogni processo dispone di un proprio spazio di indirizzamento virtuale e opera con le credenziali assegnate.

### System call

Una system call attraversa il confine tra user space e kernel. Operazioni comuni come aprire un file, creare un processo, allocare memoria o usare un socket richiedono servizi del kernel.

Le applicazioni spesso non invocano direttamente le system call: usano librerie come glibc o musl, che espongono funzioni più comode e portabili.

### Shell

La shell legge input, applica espansioni e ridirezioni, avvia programmi e gestisce pipeline e job. Bash, Zsh e Fish sono shell differenti; un terminal emulator è invece l'applicazione grafica che mostra una sessione terminale.

## Dettagli importanti

- **Kernel non significa distribuzione**: una distribuzione aggiunge userland, package manager, configurazioni e policy.
- **Processo e programma non sono sinonimi**: il programma è il file eseguibile; il processo è una sua istanza in esecuzione.
- **Root non elimina ogni controllo**: capability, sandbox, LSM e namespace possono limitare anche processi privilegiati.
- **`/proc` e `/sys` non sono normali directory persistenti**: espongono informazioni e controlli del kernel tramite filesystem virtuali.
- **Daemons e servizi**: sono processi user-space di lunga durata, spesso avviati e supervisionati da systemd.
- **Moduli del kernel**: estendono il kernel in esecuzione, ma operano comunque nello spazio privilegiato del kernel.

## Esempio

Quando una shell esegue `cat /etc/hostname`, il flusso concettuale è:

1. la shell analizza la riga e individua il programma `cat` tramite `PATH`;
2. crea un nuovo processo e carica l'eseguibile;
3. `cat` richiede al kernel di aprire il file;
4. il VFS controlla percorso, mount e permessi;
5. il driver del filesystem recupera i dati;
6. `cat` scrive i byte sul terminale tramite un file descriptor;
7. il processo termina e restituisce uno status alla shell.

## Limiti

- Il modello a livelli è una semplificazione: driver, librerie, runtime e servizi possono interagire in modi complessi.
- Non tutte le funzionalità passano da una funzione libc; alcune applicazioni usano direttamente system call, `ioctl`, Netlink o file virtuali.
- Container e macchine virtuali non sono lo stesso livello di isolamento: i container condividono il kernel host, le VM normalmente eseguono un kernel proprio.
- Il kernel non definisce l'esperienza desktop, il package manager o la politica di aggiornamento.

## Errori comuni

- Chiamare "Linux" soltanto la shell o l'intero desktop senza distinguere i livelli.
- Confondere terminal emulator e shell.
- Pensare che ogni comando sia incorporato nella shell: molti sono eseguibili separati.
- Credere che lo user space non possa influenzare il kernel: può richiederne i servizi attraverso interfacce controllate.
- Eseguire tutto come root invece di comprendere permessi e privilegi richiesti.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Distribuzioni Linux|Distribuzioni Linux]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]

## Fonti

- [Linux kernel - User-space API guide](https://www.kernel.org/doc/html/latest/userspace-api/index.html)
- [Linux man-pages - intro(2)](https://man7.org/linux/man-pages/man2/intro.2.html)
- [Linux man-pages - syscalls(2)](https://man7.org/linux/man-pages/man2/syscalls.2.html)
