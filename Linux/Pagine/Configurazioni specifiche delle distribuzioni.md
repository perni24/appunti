---
date: 2026-07-13
area: Linux
topic: Portabilita delle configurazioni Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, distribuzioni, configurazione, portabilita, automazione]
aliases: [Differenze di configurazione tra distribuzioni, Configurazioni distro-specifiche]
prerequisites: [Distribuzioni Linux, Filesystem Hierarchy Standard, systemd]
related: [Package manager delle distribuzioni, Ansible, AppArmor e SELinux]
---

# Configurazioni specifiche delle distribuzioni

## Sintesi

Le distribuzioni condividono kernel, standard Unix e molti progetti upstream, ma applicano integrazioni diverse. Possono cambiare nomi dei pacchetti e dei servizi, percorsi dei file, patch, moduli abilitati, strumenti di rete, firewall, policy di sicurezza e procedure per rigenerare initramfs o bootloader.

Una procedura portabile deve rilevare il sistema reale, interrogare i package manager e usare le interfacce standard disponibili. Copiare un percorso o un comando da un'altra distribuzione senza verificarlo puo produrre una configurazione ignorata oppure interrompere il servizio.

## Quando usarlo

- Quando si adatta una guida da Debian a Fedora, Arch, openSUSE o una derivata.
- Quando uno script deve funzionare su piu famiglie Linux.
- Durante la migrazione di un server verso un'altra distribuzione.
- Quando il pacchetto e installato ma il file, il servizio o il modulo atteso ha un nome differente.
- Per progettare ruoli Ansible e immagini che separino configurazione comune e variabili specifiche.

## Come funziona

### 1. Identita e famiglia

`/etc/os-release` espone identificatori leggibili dalle applicazioni. `ID` identifica la distribuzione, `VERSION_ID` la release e `ID_LIKE` suggerisce distribuzioni simili. `ID_LIKE` aiuta a scegliere un ramo di compatibilita, ma non garantisce che pacchetti e configurazioni siano identici.

### 2. Policy downstream

La distribuzione costruisce il software upstream con opzioni proprie e puo applicare patch. Decide inoltre come dividere i componenti in pacchetti, quali moduli abilitare e quali configurazioni installare come default.

### 3. Integrazione del sistema

Le differenze piu frequenti riguardano:

| Area | Possibili differenze |
| --- | --- |
| pacchetti | nome, versione, dipendenze, suddivisione `-dev` o `-devel` |
| servizi | nome della unit, preset, utente di servizio, socket activation |
| configurazioni | file principale, directory `conf.d`, valori compilati e include |
| rete | NetworkManager, systemd-networkd, strumenti legacy o integrazioni della distribuzione |
| firewall | nftables diretto, firewalld o frontend specifici |
| MAC | SELinux, AppArmor oppure nessuna policy preconfigurata |
| initramfs | `update-initramfs`, dracut o mkinitcpio |
| bootloader | layout di GRUB, systemd-boot e strumenti di generazione differenti |
| certificati | pacchetto, percorso e comando di aggiornamento dello store |
| kernel | configurazione, patch, moduli separati e cadenza di aggiornamento |

### 4. Separazione tra dati comuni e variabili

In automazione conviene mantenere una logica comune e definire in dati separati i nomi che cambiano:

```yaml
package_name:
  Debian: apache2
  RedHat: httpd

service_name:
  Debian: apache2
  RedHat: httpd
```

Gli strumenti di configuration management offrono moduli astratti per molte operazioni. Le condizioni specifiche restano necessarie quando cambia il comportamento, non soltanto il comando.

## API / Sintassi

Identificare distribuzione e versione:

```bash
grep -E '^(ID|ID_LIKE|VERSION_ID|VERSION_CODENAME)=' /etc/os-release
```

Verificare il kernel e l'architettura in uso:

```bash
uname -a
```

Individuare un comando disponibile senza dedurlo dal nome della distribuzione:

```bash
command -v dnf
```

Elencare le unita systemd che contengono un nome noto:

```bash
systemctl list-unit-files | grep -i ssh
```

Mostrare il contenuto effettivo di una unita e dei suoi override:

```bash
systemctl cat sshd.service
```

Mostrare la configurazione compilata di OpenSSH, utile quando piu file contribuiscono al risultato:

```bash
sshd -T
```

Trovare il pacchetto proprietario di un file su Debian:

```bash
dpkg-query --search /percorso/del/file
```

Trovare il pacchetto proprietario di un file su Fedora o altri sistemi RPM:

```bash
rpm --query --file /percorso/del/file
```

Trovare il pacchetto proprietario di un file su Arch Linux:

```bash
pacman --query --owns /percorso/del/file
```

Controllare la modalita SELinux, quando disponibile:

```bash
getenforce
```

Controllare i profili AppArmor, quando gli strumenti sono installati:

```bash
aa-status
```

## Esempio pratico

Si deve configurare un server SSH su piu distribuzioni. Una guida rigida potrebbe presumere contemporaneamente il pacchetto `openssh-server`, la unit `sshd.service` e un unico file di configurazione. Una procedura robusta separa invece le verifiche:

1. identifica distribuzione e release;
2. consulta il nome del pacchetto nei repository ufficiali;
3. elenca le unita realmente installate;
4. legge `man sshd_config` e gli include attivi;
5. valida la configurazione prima del reload;
6. controlla firewall e policy MAC separatamente.

Validare la configurazione OpenSSH senza riavviare il servizio:

```bash
sudo sshd -t
```

Ricaricare la unit effettivamente presente solo dopo un esito valido:

```bash
sudo systemctl reload sshd.service
```

Verificare infine socket e processo in ascolto:

```bash
ss -lntp
```

Se la distribuzione usa `ssh.service`, il comando con `sshd.service` deve essere adattato: il nome non va indovinato.

## Varianti

### Distribuzioni derivate

Una derivata puo mantenere `ID_LIKE=debian` o `ID_LIKE=fedora`, ma sostituire repository, desktop, kernel o strumenti di configurazione. Trattare `ID_LIKE` come fallback e preferire `ID` quando serve un comportamento realmente specifico.

### Container

Un'immagine minimale puo non includere systemd, pagine man, `sudo`, strumenti di rete o una shell completa. In un container bisogna rilevare le funzionalita presenti, non applicare automaticamente procedure da host.

### Sistemi immutabili

Fedora Atomic, openSUSE MicroOS e sistemi image-based possono richiedere aggiornamenti transazionali o composizione dell'immagine invece della modifica diretta del filesystem base.

### Cloud image

Le immagini cloud aggiungono spesso cloud-init, utenti predefiniti e configurazioni del provider. Una procedura valida sull'immagine generica puo essere sovrascritta al boot dai metadati della piattaforma.

### Automazione con Ansible

Usare moduli come `ansible.builtin.package`, `ansible.builtin.service` e i facts `distribution`, `distribution_major_version` e `os_family`. Definire condizioni sulla release solo quando una differenza e stata verificata e testata.

## Errori comuni

- Usare `lsb_release` senza verificare che il pacchetto sia installato.
- Assumere che `ID_LIKE` renda due distribuzioni compatibili a livello binario.
- Copiare nomi di pacchetti o servizi da una famiglia diversa.
- Modificare un file non letto dal processo perche la distribuzione usa una directory di include.
- Disabilitare SELinux o AppArmor invece di diagnosticare la policy.
- Rigenerare initramfs o GRUB con uno strumento appartenente a un'altra distribuzione.
- Scrivere script con molti rami basati sul nome della distribuzione quando basta rilevare una funzionalita.
- Fare affidamento su default impliciti che possono cambiare tra release.

## Checklist

- Distribuzione, famiglia, release e architettura sono state identificate?
- Il pacchetto proviene dai repository corretti per quella release?
- Nome e contenuto della unit systemd sono stati verificati localmente?
- La documentazione installata corrisponde alla versione del pacchetto?
- File principali, include e override attivi sono noti?
- Firewall, SELinux o AppArmor sono stati controllati come livelli separati?
- Il comando di rigenerazione di initramfs o bootloader appartiene alla distribuzione?
- Le differenze sono espresse come dati o variabili invece di duplicare tutta la procedura?
- La procedura e stata provata almeno in una VM per ogni famiglia supportata?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Distribuzioni Linux|Distribuzioni Linux]]
- [[Linux/Pagine/Package manager delle distribuzioni|Package manager delle distribuzioni]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/NetworkManager|NetworkManager]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/Ansible|Ansible]]

## Fonti

- [systemd - os-release](https://www.freedesktop.org/software/systemd/man/latest/os-release.html)
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [Ansible - Conditionals e facts](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_conditionals.html)
- [Ansible - Discovering variables and facts](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_vars_facts.html)
