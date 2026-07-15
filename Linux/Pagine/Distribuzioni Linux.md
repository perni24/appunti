---
date: 2026-07-13
area: Linux
topic: Distribuzioni
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux, distribuzioni, package-manager, release-model]
aliases: [Distribuzioni GNU Linux, Distro Linux]
prerequisites: [Architettura Linux]
related: [Package manager delle distribuzioni, Rolling release e distribuzioni stabili, Configurazioni specifiche delle distribuzioni, Scelta della distribuzione]
---

# Distribuzioni Linux

## Sintesi

Una distribuzione Linux combina il kernel Linux con strumenti user-space, librerie, package manager, repository, configurazioni predefinite, installer e una politica di manutenzione. Le distribuzioni condividono molti concetti, ma possono differire sensibilmente per versioni, percorsi, strumenti amministrativi e ciclo di rilascio.

Non esiste una distribuzione migliore in assoluto: la scelta dipende da stabilità richiesta, hardware, disponibilità dei pacchetti, documentazione, competenze del team e durata del supporto.

## Problema che risolve

Il solo kernel non costituisce un sistema operativo completo per l'utente. Una distribuzione seleziona componenti compatibili, li compila, li firma, li pubblica in repository e fornisce un processo coerente per installarli e aggiornarli.

Una distribuzione gestisce inoltre:

- dipendenze e aggiornamenti di sicurezza;
- configurazione iniziale e integrazione tra componenti;
- supporto a determinate architetture hardware;
- policy sui pacchetti e sui filesystem;
- documentazione e strumenti di ripristino.

## Concetto chiave

```text
Distribuzione Linux
|-- kernel e firmware
|-- librerie di sistema
|-- init system e servizi
|-- shell e strumenti di base
|-- package manager e repository
|-- installer e configurazioni
|-- ciclo di rilascio e supporto
`-- desktop o componenti server opzionali
```

### Famiglie e compatibilità

Distribuzioni della stessa famiglia possono condividere formato dei pacchetti e strumenti, senza essere completamente intercambiabili.

- Debian e derivate usano normalmente pacchetti `.deb` e APT.
- Fedora e molte distribuzioni correlate usano RPM e DNF.
- Arch Linux usa pacman e adotta un modello rolling release.

Un pacchetto creato per una distribuzione non deve essere installato automaticamente su un'altra solo perché usa lo stesso formato: dipendenze, versioni e policy possono differire.

### Modello di rilascio

- **Fixed release**: versioni principali pubblicate in momenti distinti, con aggiornamenti selezionati durante il supporto.
- **LTS**: release mantenuta per un periodo esteso, spesso adatta a server e ambienti conservativi.
- **Rolling release**: aggiornamento continuo dei pacchetti senza reinstallare periodicamente una nuova versione principale.
- **Immutable o image-based**: sistema base aggiornato come immagine o transazione, riducendo modifiche dirette allo stato del sistema.

## Dettagli importanti

- **Repository ufficiali**: sono la fonte principale di pacchetti mantenuti e firmati dalla distribuzione.
- **Package manager**: non installa soltanto file, ma registra ownership, dipendenze, script e aggiornamenti.
- **Upstream e downstream**: upstream sviluppa il progetto originale; la distribuzione può applicare patch e configurazioni downstream.
- **Supporto hardware**: dipende soprattutto da kernel e firmware disponibili, non soltanto dal nome della distribuzione.
- **Documentazione**: una guida valida per una famiglia può contenere comandi errati per un'altra.
- **Compatibilità applicativa**: container, Flatpak e altri formati possono ridurre, ma non annullare, le differenze tra distribuzioni.

## Esempio

Per identificare la distribuzione in modo standard, leggi il file `os-release`:

```bash
cat /etc/os-release
```

Campi comuni:

```text
ID=arch
NAME="Arch Linux"
PRETTY_NAME="Arch Linux"
```

Gli script dovrebbero preferire `ID` e `ID_LIKE` a controlli fragili sul nome visualizzato.

## Limiti

- Il nome della distribuzione non descrive automaticamente desktop, filesystem o configurazione scelta dall'utente.
- Le derivate possono allontanarsi molto dalla distribuzione di origine.
- `ID_LIKE` è un suggerimento di compatibilità, non una garanzia che tutti i comandi o pacchetti siano equivalenti.
- Rolling release non significa assenza di versioni dei singoli pacchetti né aggiornamenti privi di rischio.
- LTS non garantisce che ogni applicazione inclusa sia recente.

## Errori comuni

- Copiare comandi `apt`, `dnf` o `pacman` senza verificare la distribuzione.
- Aggiungere repository destinati a una release differente.
- Installare pacchetti esterni ignorando firma, provenienza e compatibilità.
- Considerare una rolling release automaticamente instabile o una LTS automaticamente sicura.
- Confondere distribuzione, desktop environment e kernel.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Architettura Linux kernel shell e user space|Architettura Linux]]
- [[Linux/Pagine/Installazione Arch Linux|Installazione Arch Linux]]
- [[Linux/Pagine/Gestione pacchetti universali|Gestione pacchetti universali]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]
- [[Linux/Pagine/Package manager delle distribuzioni|Package manager delle distribuzioni]]
- [[Linux/Pagine/Rolling release e distribuzioni stabili|Rolling release e distribuzioni stabili]]
- [[Linux/Pagine/Configurazioni specifiche delle distribuzioni|Configurazioni specifiche delle distribuzioni]]
- [[Linux/Pagine/Scelta della distribuzione|Scelta della distribuzione]]

## Fonti

- [systemd - os-release](https://www.freedesktop.org/software/systemd/man/latest/os-release.html)
- [Debian Policy Manual](https://www.debian.org/doc/debian-policy/)
- [Arch Linux - Frequently asked questions](https://wiki.archlinux.org/title/Frequently_asked_questions)
