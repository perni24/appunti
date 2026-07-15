---
date: 2026-07-13
area: Linux
topic: Modelli di rilascio
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, distribuzioni, rolling-release, fixed-release, lts]
aliases: [Rolling release e fixed release, Modelli di rilascio Linux]
prerequisites: [Distribuzioni Linux, Repository e package manager]
related: [Aggiornamenti di sicurezza, Backup e ripristino, Package manager delle distribuzioni]
---

# Rolling release e distribuzioni stabili

## Sintesi

Il modello di rilascio stabilisce come una distribuzione porta nuove versioni del software agli utenti. Una fixed release mantiene una base versionata per un periodo definito; una rolling release aggiorna progressivamente il sistema senza passare periodicamente a una nuova versione principale completa.

`Rolling`, `fixed`, `stable` e `LTS` non misurano da soli la qualita del sistema. Descrivono cadenza, supporto e politica degli aggiornamenti. La stabilita reale dipende anche da test, repository usati, manutenzione, hardware e capacita di recupero.

## Problema che risolve

Kernel, librerie, desktop e applicazioni evolvono con velocita differenti. Una distribuzione deve decidere:

- quando integrare nuove versioni upstream;
- quanto a lungo mantenere una base gia pubblicata;
- se correggere un problema con un backport o aggiornando il componente;
- come gestire migrazioni incompatibili;
- quanto tempo concedere a utenti e amministratori per pianificare gli upgrade.

Il modello di rilascio rende prevedibile questo compromesso tra novita, compatibilita e costo operativo.

## Concetto chiave

### Fixed release

Una fixed release viene pubblicata come versione identificabile. Durante il supporto riceve correzioni e aggiornamenti secondo la policy della distribuzione; il passaggio alla release successiva e un evento esplicito.

```text
release N ------- manutenzione ------- fine supporto
                         |
                         `-- upgrade pianificato a N+1
```

Debian Stable, Ubuntu LTS e Fedora sono esempi di distribuzioni a release discrete, ma hanno durata del supporto e velocita di aggiornamento differenti. Fedora pubblica frequentemente nuove release e le supporta per un periodo relativamente breve; LTS indica invece un impegno di manutenzione piu lungo.

### Rolling release

Una rolling release pubblica continuamente nuove versioni attraverso i repository. L'immagine di installazione e normalmente una fotografia utile ad avviare il sistema, non una release da mantenere invariata per anni.

```text
installazione -> aggiornamento -> aggiornamento -> aggiornamento -> ...
```

Arch Linux segue questo modello. Anche openSUSE Tumbleweed e rolling, ma integra test e strumenti di snapshot propri: due distribuzioni rolling possono quindi avere pratiche operative molto diverse.

### Canali di sviluppo

Un repository chiamato `testing`, `unstable` o `rawhide` non coincide automaticamente con una rolling release destinata all'uso quotidiano. Puo essere un ramo di sviluppo dal quale nasceranno release fisse. Debian mantiene contemporaneamente stable, testing e unstable; Fedora sviluppa le release attraverso Rawhide e rami di stabilizzazione.

## Dettagli importanti

| Aspetto | Fixed o LTS | Rolling release |
| --- | --- | --- |
| versioni software | piu prevedibili durante la vita della release | cambiano progressivamente |
| grandi migrazioni | concentrate negli upgrade di release | distribuite negli aggiornamenti ordinari |
| hardware recente | puo richiedere kernel backportati o release nuove | tende a ricevere prima kernel e driver recenti |
| software di terze parti | spesso certificato per versioni specifiche | deve seguire cambiamenti frequenti di ABI e dipendenze |
| manutenzione | finestre di upgrade meno frequenti ma piu ampie | aggiornamenti regolari e attenzione continua |
| rollback | dipende dagli strumenti della distribuzione | particolarmente utile dopo transazioni estese |
| fine supporto | data o finestra dichiarata | non sempre esiste una EOL della release, ma i pacchetti vanno mantenuti aggiornati |

### Stable non significa immutabile

Una distribuzione stabile continua a ricevere aggiornamenti di sicurezza e bug fix. Puo inoltre aggiornare alcuni componenti quando il backport non e sostenibile. Bloccare tutti gli aggiornamenti riduce la sicurezza, non aumenta automaticamente la stabilita.

### Rolling non significa aggiornare senza controllo

Gli aggiornamenti devono essere completi e coerenti con la policy della distribuzione. Su Arch Linux gli aggiornamenti parziali non sono supportati: sincronizzare solo i metadati e installare un pacchetto senza aggiornare il sistema puo creare combinazioni non previste.

### LTS riguarda una copertura definita

La sigla LTS non garantisce che ogni repository, applicazione o componente di terze parti abbia lo stesso periodo di manutenzione. Bisogna verificare quali pacchetti sono coperti, con quale tipo di aggiornamenti e a quali condizioni.

### La manutenzione richiede una strategia di recupero

Indipendentemente dal modello servono backup, spazio libero, controllo delle note di rilascio, verifica dei servizi e un metodo per tornare a uno stato funzionante. Snapshot del filesystem e rollback del sistema non sostituiscono il backup dei dati.

## Esempio

Prima di decidere un aggiornamento, identificare release e canale del sistema:

```bash
cat /etc/os-release
```

Controllare i repository effettivamente configurati su Debian o derivate:

```bash
apt-cache policy
```

Controllare i repository su Fedora:

```bash
dnf repolist
```

Controllare i repository abilitati su Arch Linux:

```bash
pacman-conf --repo-list
```

Il nome commerciale della distribuzione non basta: repository aggiuntivi o rami di sviluppo possono cambiare il profilo di rischio del sistema.

## Limiti

- Le categorie non descrivono la qualita dei test o la rapidita delle correzioni di sicurezza.
- Una fixed release puo includere componenti aggiornati tramite backport, repository opzionali o formati universali.
- Una rolling release puo pubblicare snapshot testati anziche ogni singolo pacchetto immediatamente.
- Le distribuzioni image-based o immutabili separano il modello di aggiornamento del sistema base da quello delle applicazioni.
- Un ambiente containerizzato puo avere un ciclo di vita diverso dall'host.

## Errori comuni

- Considerare ogni rolling release instabile per definizione.
- Considerare una LTS sicura anche dopo la fine della copertura.
- Rimandare per mesi gli aggiornamenti di una rolling release e applicarli senza leggere gli avvisi.
- Usare repository `testing` o di sviluppo pensando che siano equivalenti al canale stabile rolling.
- Confondere aggiornamento dei pacchetti con upgrade a una nuova fixed release.
- Affidarsi agli snapshot come unica copia dei dati.
- Scegliere il modello solo in base alla freschezza delle applicazioni desktop, ignorando kernel, driver e software professionale.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Distribuzioni Linux|Distribuzioni Linux]]
- [[Linux/Pagine/Package manager delle distribuzioni|Package manager delle distribuzioni]]
- [[Linux/Pagine/Aggiornamenti di sicurezza|Aggiornamenti di sicurezza]]
- [[Linux/Pagine/Backup e ripristino|Backup e ripristino]]
- [[Linux/Pagine/Scelta della distribuzione|Scelta della distribuzione]]

## Fonti

- [Debian - Release e ciclo di vita](https://www.debian.org/releases/)
- [Ubuntu - Release cycle](https://ubuntu.com/about/release-cycle)
- [Fedora Linux - Release e supporto](https://docs.fedoraproject.org/en-US/releases/)
- [ArchWiki - Arch Linux e modello rolling release](https://wiki.archlinux.org/title/Arch_Linux)
- [openSUSE Tumbleweed](https://get.opensuse.org/tumbleweed/)
