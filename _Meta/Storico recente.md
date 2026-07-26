# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-07-26 - Avanzamento guida Marlin

### Fatto

- Completata la nota del blocco `Sonda` su probe Z, offset XYZ, BLTouch, margini, clearances, affidabilita e test di ripetibilita.
- Aggiunta una procedura di collaudo progressiva con `M119`, `M401`, `M402`, `G28 Z`, `G30`, `M851` e `M48`.
- Collegata la nuova pagina nell'indice Marlin.
- Completato il blocco `Livellamento` con due note su metodi ABL/MBL/UBL, mesh, stato `M420`, Z Safe Homing, multi-Z, `G34`, `M422` e `G35`.
- Collegate entrambe le pagine di livellamento nell'indice Marlin.
- Completato il blocco `Interfaccia` con due note su display, controller, TFT, DWIN, host G-code, encoder, touch, lingua, menu e feedback acustico.
- Collegate entrambe le pagine dell'interfaccia nell'indice Marlin.
- Completato il blocco `Memoria e supporti` con due note su EEPROM, scheda SD, persistenza, migrazione, G-code di configurazione e diagnostica.
- Collegate entrambe le pagine di memoria e supporti nell'indice Marlin.
- Completato il blocco `Accessori` con due note su runout, motion sensor, Advanced Pause, power-loss recovery, PSU, rele, luci, LED, buzzer e servo.
- Collegate entrambe le pagine degli accessori nell'indice Marlin.
- Completato il blocco `Taratura` con una procedura progressiva di collaudo, calibrazione, salvataggio e stampa di accettazione.
- Collegata la procedura completa di taratura nell'indice Marlin.
- Completato il blocco `Diagnostica` con due note su build, upload, boot, EEPROM, movimento, termica, estrusione, probe e leveling.
- Collegate entrambe le pagine di diagnostica nell'indice Marlin.
- Completato il blocco `Consultazione` con il riferimento rapido delle direttive e la procedura di migrazione tra release.
- Collegate entrambe le pagine di consultazione nell'indice Marlin.

### Decisioni

- Cablaggio e livelli logici sono descritti in modo indipendente dai colori dei fili e da una specifica motherboard.
- Le opzioni avanzate del BLTouch restano disabilitate per impostazione prudente finche l'hardware non e stato verificato.
- Offset e ripetibilita sono trattati separatamente: una misura precisa puo comunque avere un offset assoluto errato.
- Tramming, allineamento Z, mesh e offset sono documentati come operazioni distinte.
- Per lo start G-code sono separati il flusso che misura con `G29` e quello che riusa una mesh con `M420 S1`.
- Display pilotati da Marlin, smart display e touchscreen host G-code sono documentati come architetture differenti.
- La selezione hardware usa una sola direttiva controller e, per i TFT, una sola combinazione di driver, interfaccia, risoluzione e UI.
- Default compilati, valori runtime e dati persistenti sono documentati come livelli distinti.
- Le modifiche G-code vengono provate in RAM prima di `M500`; slot SD, scrittura e comandi post-abort richiedono una verifica esplicita.
- Runout e power-loss recovery sono trattati come gestioni di eventi differenti, entrambe dipendenti dallo stato reale del job e della macchina.
- GPIO, segnali PWM e uscite di potenza sono distinti; carichi, rele, LED e servo richiedono uno stadio elettrico adeguato.
- La taratura segue dipendenze esplicite: sicurezza e sensori, meccanica, homing, steps, termica, livellamento, dinamica, estrusione e compensazioni.
- I valori vengono provati in RAM, confrontati con una base registrata e salvati soltanto dopo un criterio di accettazione.
- Gli errori vengono classificati per fase e corretti partendo dalla prima causa osservabile, senza aggirare `SanityCheck` o le protezioni.
- La diagnostica operativa distingue hardware, meccanica, firmware, EEPROM, G-code, slicer e materiale prima di modificare i parametri.
- Il riferimento rapido distingue direttive compile-time, default compilati, RAM, EEPROM e G-code del job.
- La migrazione usa file puliti della release destinazione e trasferisce decisioni per blocchi verificabili, mantenendo un rollback.

### Prossimi passi

- Eseguire un controllo finale di completezza, frontmatter, collegamenti e coerenza dell'intera sezione Marlin.

## 2026-07-25 - Riprogettazione sezione Marlin

### Fatto

- Rimossa dall'indice `Stampante 3D` l'intera sezione dedicata a Marlin.
- Eliminate le 14 note Marlin presenti in `Stampante 3D/Pagine`.
- Conservata la nota generale `Introduzione Stamapante 3D.md` con le modifiche locali gia presenti.
- Verificata l'assenza di collegamenti alle pagine rimosse nelle altre aree del vault.
- Creato `Stampante 3D/Marlin/Indice Marlin.md` con un nuovo percorso dedicato alla configurazione completa del firmware.
- Collegato il nuovo indice Marlin dall'indice principale `Stampante 3D`.
- Impostata la release stabile `Marlin 2.1.2.8` come riferimento tecnico della guida.
- Completate le tre note del blocco `Orientamento e configurazione`: introduzione e compatibilita, struttura dei file, metodo di configurazione e build.
- Completate le note del blocco `Elettronica`: scheda madre, porte seriali e pin; alimentazione e protezioni hardware.
- Completate le note del blocco `Meccanica`: tipo di stampante e cinematica; dimensioni del piatto, area di lavoro e limiti.
- Completate le note del blocco `Motori, driver e homing`: passi e direzioni, driver e corrente, endstop e Sensorless Homing.
- Completate le note di `Pianificazione del movimento`: limiti dinamici, Jerk e Junction Deviation; planner, segmentazione e curve.
- Completate le note di `Compensazioni`: Linear Advance, Input Shaping, Skew, Backlash, Babystepping e regolazioni runtime.
- Completate le note di `Estrusione`: architetture hotend e multi-materiale, gestione del filamento, limiti di sicurezza, retrazione e cambio utensile.
- Completate le note di `Temperature`: sensori e limiti, controlli PID/MPC, protezioni termiche, ventole e circuiti di raffreddamento.

### Decisioni

- La documentazione e organizzata per parte della stampante interessata, non secondo l'ordine delle direttive nei file sorgente.
- Ogni futura nota raccogliera le opzioni correlate di `Configuration.h` e `Configuration_adv.h`.
- La guida resta generale e non viene personalizzata per uno specifico modello di stampante.
- Le voci restano testo semplice fino alla creazione delle pagine, evitando wikilink non ancora risolvibili.
- Ogni nota Marlin indica esplicitamente la release di riferimento nel frontmatter e usa collegamenti a sorgenti fissate al tag.

### Prossimi passi

- Proseguire con `Sonda`, partendo da probe Z, offset e BLTouch.

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
