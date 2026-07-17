# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-07-15 - Normalizzazione percorsi e integrazione Quartz

### Fatto

- Normalizzate in `Pagine/` le cartelle tracciate come `pagine/` nelle aree AI, RISC-V, Home assistant, Linux e Stampante 3D.
- Corretti cinque wikilink verso `Programmi open source/Indice Programmi Open Source` con capitalizzazione non coerente.
- Eseguito un controllo case-sensitive sui percorsi, in preparazione alla futura build Quartz su GitHub Actions.
- Importato Quartz 5 nella cartella `site/` tramite `git subtree --squash`, mantenendo il vault e il generatore statico nello stesso repository.
- Installate le dipendenze npm e i 46 plugin del template Quartz per Obsidian.
- Creata la configurazione locale in `site/quartz.config.yaml` e verificata una prima homepage di prova.
- Verificata la build statica e l'anteprima locale su desktop e mobile, senza errori nella console del browser.
- Aggiunti `site/publish.config.json` e gli script portabili per preparare e compilare solo le aree autorizzate.
- Marcate come pubblicabili tutte le 99 note dell'area Linux e abilitato il filtro `explicit-publish`.
- Verificata la build Linux completa con 100 input, includendo la homepage generata, senza wikilink rotti nell'output.
- Impostato il `baseUrl` definitivo `perni24.github.io/appunti` per la pubblicazione nel sottopercorso GitHub Pages.
- Creato `.github/workflows/deploy-pages.yml` per compilare Quartz e pubblicare `site/public` a ogni push su `main`.
- Corretto lo script di installazione dei plugin affinche usi il CLI Quartz con `quartz.lock.json`; aggiornate le action del workflow alle versioni basate su Node 24.
- Sostituita la homepage Linux generata con il contenuto di `Home.md`, copiato come `index.md` durante la build senza ampliare le aree pubblicabili oltre Linux.
- Abilitata la pubblicazione dell'area `Programmazione`: le note usano `publish: true`, mentre gli indici senza YAML ricevono il flag soltanto nella copia temporanea usata da Quartz.

### Decisioni

- `Pagine/` con `P` maiuscola e il casing canonico per le cartelle di contenuto del vault.
- I controlli dei wikilink devono confrontare anche maiuscole e minuscole, perche Windows puo nascondere errori che emergono su Linux.
- Quartz viene mantenuto come subtree aggiornabile dal branch upstream `v5`, non come dipendenza npm o repository Git annidato.
- La configurazione usa il template Obsidian, l'interfaccia italiana e il percorso GitHub Pages del repository come `baseUrl`.
- I contenuti pubblicabili vengono copiati in una directory temporanea esterna al repository, per evitare duplicati tracciati e conflitti con `.gitignore`.
- L'output statico `site/public` resta escluso da Git: GitHub Actions lo genera e lo carica come artifact di Pages durante ogni deploy.

### Prossimi passi

- Abilitare una sola volta `Settings > Pages > Source: GitHub Actions`, quindi eseguire commit e push per verificare il primo deploy online.

## 2026-07-13 - Ristrutturazione area Linux

### Fatto

- Rimossa la sottocartella `Linux/Pagine/ArchLinux` e spostata la guida in `Linux/Pagine/Installazione Arch Linux.md`.
- Riscritto `Linux/Indice Linux.md` con percorsi Base, Intermedio, Avanzato, Applicazioni, Distribuzioni e Conoscenza Operativa.
- Normalizzate e completate le quattro note esistenti su installazione Arch Linux, utenti e permessi, pacchetti universali e toolchain user-space.
- Separati i comandi Linux in blocchi individuali, ciascuno accompagnato dalla relativa spiegazione, per facilitarne copia e consultazione.
- Create e compilate le 6 note del blocco `Fondamenti del sistema` su architettura, distribuzioni, FHS, terminale, ambiente e documentazione locale.
- Completato il blocco `File, utenti e permessi` con quattro nuove note su file e link, permessi POSIX, `sudo` e ACL, integrate con la nota esistente sulla gestione utenti.
- Completato il blocco `Shell` con sette note su Bash, flussi I/O, espansioni, quoting, job control, strumenti testuali ed espressioni regolari.
- Completato il blocco `Processi e servizi` con sette nuove note su processi, monitoraggio, systemd, unit, timer, cron e journal, riutilizzando la nota condivisa sul job control.
- Completato il blocco `Gestione software` con quattro nuove note su repository, gestori nativi, librerie condivise e compilazione, integrate con le note esistenti sui pacchetti universali e sulle toolchain utente.
- Completato il blocco `Storage e filesystem` con nove note su partizioni, mount, `fstab`, filesystem, LVM, RAID, swap, quote e procedure di controllo e riparazione.
- Completato il blocco `Networking` con nove note su interfacce, routing, DNS, socket, SSH, trasferimento file, NetworkManager, nftables e troubleshooting di rete.
- Completato il blocco `Boot e kernel` con sette note su sequenza di avvio, firmware, bootloader, initramfs, moduli, sysctl e compilazione del kernel.
- Completato il blocco `Sicurezza` con otto note su minimo privilegio, hardening, MAC, LUKS, GPG, PAM, audit e aggiornamenti di sicurezza.
- Completato il blocco `Hardware e desktop` con dieci note su rilevamento, driver, udev, D-Bus, energia, PipeWire, sistemi grafici, ambienti desktop, font e portali XDG.
- Completato il blocco `Virtualizzazione e isolamento` con sei note su namespace, cgroup, container, Docker e Podman, KVM e QEMU e gestione delle VM con libvirt.
- Completato il blocco `Server` con sei nuove note su web server, reverse proxy, condivisioni NFS e Samba, database, backup e monitoraggio continuativo, ampliando la nota SSH esistente con l'amministrazione di `sshd`.
- Completato il blocco `Automazione` con cinque nuove note su scripting Bash, robustezza, gestione degli errori, configurazione e Ansible, riutilizzando e collegando le note esistenti su Bash, cron e timer systemd.
- Completato il blocco `Installazione` con due nuove guide operative per Debian e Fedora, collegate alla procedura Arch Linux esistente e basate sui flussi UEFI ufficiali.
- Completato il blocco `Differenze tra distribuzioni` con quattro note su ecosistemi dei package manager, modelli di rilascio, portabilita delle configurazioni e scelta basata sui requisiti.
- Convertite in wikilink le relative voci di `Linux/Indice Linux.md` dopo la creazione effettiva delle pagine.
- Rimosso da `Home.md` il collegamento alla vecchia macro area Arch Linux, mantenendo il collegamento all'indice Linux.

### Decisioni

- Le conoscenze generali restano indipendenti dalla distribuzione; Arch Linux è trattata come procedura specifica nella sezione Distribuzioni.
- Gli argomenti senza pagina restano testo semplice nell'indice e diventeranno wikilink solo dopo la creazione di contenuti reali.

### Prossimi passi

- Continuare con il blocco `Procedure` nella sezione Conoscenza Operativa.

## 2026-07-10 - Revisione accuratezza Programmazione

### Fatto

- Corrette inesattezze in note PostgreSQL su ACID, WAL, MVCC, isolamento, statistiche e scelta degli indici.
- Precisati i vincoli `Send` e `Sync` di `Arc<T>` in Rust, il supporto free-threaded di CPython e la semantica di Server Components, Server Functions e `useOptimistic` in React.
- Aggiornata la nota JavaScript sui decorators e riorganizzate le note CORS e Scheduling Browser.
- Risolto il link TypeScript con Express/Fastify e convertiti 102 wikilink omonimi in percorsi espliciti della rispettiva area.

### Decisioni

- Le note tecniche modificate citano documentazione ufficiale per i punti dipendenti da runtime, versione o implementazione.
- Le sezioni operative vuote degli indici restano un ampliamento futuro e non sono state riempite con pagine prive di contenuto.

### Prossimi passi

- Completare gradualmente `Conoscenza Operativa` e aggiungere fonti alle note non ancora tracciate.

## 2026-07-09 - Tooling qualita Clean Code

### Fatto

- Create 8 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Tooling e Qualita del Codice`.
- Compilati contenuti reali su formatter, linter, static analysis, type checking, coverage, mutation testing, code quality gates e pre-commit hooks.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano gli strumenti come guardrail automatici per coerenza, testabilita e sicurezza del processo, non come sostituti della progettazione.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con le sezioni operative di `Conoscenza Operativa`.

## 2026-07-09 - Data automazione e LLM Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Data, Automazione e LLM`.
- Compilati contenuti reali su pipeline dati, notebook mantenibili, script di automazione, parsing input esterni, prompt applicativi, output strutturati e validazione dati generati.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano automazioni e LLM come parti del codice applicativo, quindi con contratti, validazione, test e tracciabilita.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Tooling e Qualita del Codice`.

## 2026-07-09 - Web API e database Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Web, API e Database`.
- Compilati contenuti reali su controller sottili, service layer, repository pattern, DTO/modelli di dominio, validazione input API, query leggibili e migrazioni/schema evolution.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- La nota `DTO e modelli di dominio` e stata creata anche in Clean Code per trattare il concetto in modo trasversale, distinto dalla nota specifica TypeScript.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Data, Automazione e LLM`.

## 2026-07-09 - Performance e distribuzione Clean Code

### Fatto

- Create 6 pagine dell'area `Programmazione/Clean Code/Pagine` per completare il blocco `Performance e Distribuzione`.
- Compilati contenuti reali su performance/leggibilita, ottimizzazione prematura, profiling, hot path, allocazioni inutili e codice pronto al deploy.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md`; `Configurazione applicativa` resta collegata alla pagina condivisa gia creata.

### Decisioni

- Le note trattano la performance come disciplina guidata da misure e vincoli operativi, non come micro-ottimizzazione preventiva.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Web, API e Database`.

## 2026-07-09 - Concorrenza Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Concorrenza e Parallelismo`.
- Compilati contenuti reali su stato condiviso, race condition, lock, idempotenza, operazioni atomiche, code/worker e codice asincrono leggibile.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano concorrenza e asincronia come problemi di leggibilita, confini e gestione degli effetti, non solo come primitive tecniche.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Performance e Distribuzione`.

## 2026-07-09 - Internals e risorse Clean Code

### Fatto

- Create 9 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Internals e Gestione Risorse`.
- Compilati contenuti reali su stato, risorse, lifecycle, ownership concettuale, cache, cleanup, invarianti interne, refactoring sicuro e legacy code.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note distinguono responsabilita concettuali, lifecycle e gestione tecnica delle risorse per evitare duplicazioni con i blocchi precedenti.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Concorrenza e Parallelismo`.

## 2026-07-09 - Standard library pratica Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Standard Library Pratica`.
- Compilati contenuti reali su gestione errori, eccezioni, logging/tracing, configurazione, parsing/serializzazione, date/timezone e file system/I/O.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink le nuove voci e collegando la voce duplicata `Configurazione applicativa` alla stessa pagina.

### Decisioni

- Le note create usano `type: technical-note` perche descrivono pratiche tecniche e uso disciplinato di API/risorse comuni.
- `Configurazione applicativa` resta una pagina unica condivisa tra `Standard Library Pratica` e `Performance e Distribuzione`.

### Prossimi passi

- Continuare con il blocco `Internals e Gestione Risorse`.
