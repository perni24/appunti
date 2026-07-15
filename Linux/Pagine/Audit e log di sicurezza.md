---
date: 2026-07-11
area: Linux
topic: Linux Audit System
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, sicurezza, auditd, log, incident-response]
aliases: [auditd, Audit Linux]
prerequisites: [Logging con journalctl, Principio del minimo privilegio]
related: [Hardening del sistema, AppArmor e SELinux, PAM]
---

# Audit e log di sicurezza

## Sintesi

Linux Audit registra eventi di sicurezza provenienti dal kernel e da applicazioni privilegiate. Le regole possono osservare system call, file e attributi; auditd raccoglie record correlati in eventi ricercabili tramite chiavi e seriali.

Audit e logging operativo sono complementari. Il journal spiega servizi e messaggi; audit attribuisce azioni a identità, oggetti e risultati secondo regole esplicite. Nessuno dei due impedisce un attacco da solo.

## Quando usarlo

- Tracciare modifiche a configurazioni critiche.
- Registrare operazioni privilegiate rilevanti.
- Supportare incident response e requisiti di conformità.
- Correlare denial SELinux con processi e oggetti.
- Costruire report su login, account ed esecuzioni.

## Come funziona

Il kernel audit genera record che auditd scrive normalmente sotto `/var/log/audit/`. Un singolo evento può comprendere record `SYSCALL`, `PATH`, `CWD`, `EXECVE` e altri con stesso identificatore temporale e seriale.

Le identità includono UID effettivo e login UID, `auid`, utile per collegare un'azione privilegiata all'utente che ha iniziato la sessione. Namespace, container e forwarding richiedono ulteriore contesto.

Regole runtime si gestiscono con `auditctl`; configurazioni persistenti sono normalmente sotto `/etc/audit/rules.d/` e vengono compilate da `augenrules`. Regole troppo ampie possono degradare prestazioni, saturare spazio e rendere inutilizzabile il segnale.

## API / Sintassi

Mostrare stato del sottosistema audit:

```bash
sudo auditctl -s
```

Elencare regole caricate:

```bash
sudo auditctl -l
```

Cercare eventi della giornata:

```bash
sudo ausearch --start today
```

Cercare tramite chiave di regola:

```bash
sudo ausearch -k configurazione-sudo
```

Produrre un riepilogo degli eventi:

```bash
sudo aureport --summary
```

Produrre un report delle autenticazioni:

```bash
sudo aureport --auth
```

Verificare le regole persistenti compilate:

```bash
sudo augenrules --check
```

Caricare regole persistenti dopo la validazione:

```bash
sudo augenrules --load
```

## Esempio pratico

Una regola persistente in `/etc/audit/rules.d/50-sudoers.rules` può osservare scritture e cambi attributo:

```audit
-w /etc/sudoers -p wa -k configurazione-sudo
-w /etc/sudoers.d/ -p wa -k configurazione-sudo
```

Verificare la compilazione:

```bash
sudo augenrules --check
```

Caricare e controllare:

```bash
sudo augenrules --load
```

Cercare gli eventi generati:

```bash
sudo ausearch -k configurazione-sudo -i
```

Le watch rule sono semplici ma le regole syscall possono essere più espressive ed efficienti in policy ampie. La scelta va misurata sul sistema reale.

## Varianti

- `ausearch -i` interpreta numeri e codici, utile per lettura umana ma meno stabile per parsing automatico.
- Audit plugin possono inoltrare eventi a sistemi remoti.
- journald può raccogliere messaggi applicativi e kernel non rappresentati da regole audit.
- SIEM correla eventi da host, identità e rete, ma dipende da timestamp e normalizzazione affidabili.
- File Integrity Monitoring confronta stato dei file con un modello diverso dall'audit delle azioni.
- SELinux AVC usa il sottosistema audit quando disponibile.

## Errori comuni

- Registrare ogni `execve` o accesso file senza stimare volume e prestazioni.
- Non monitorare spazio, rotazione e perdita di eventi.
- Cercare un evento come singola riga ignorando i record correlati.
- Usare log locali come unica prova dopo una compromissione con privilegi elevati.
- Confondere `uid`, `euid` e `auid`.
- Caricare regole senza chiavi descrittive.
- Raccogliere dati sensibili o argomenti di comando senza policy di minimizzazione e accesso.

## Checklist

- Quale evento o requisito deve essere osservato?
- Identità, oggetto, azione e risultato necessari sono presenti?
- Regole hanno chiavi significative e scope minimo?
- Volume, backlog, spazio e rotazione sono monitorati?
- Timestamp e sincronizzazione temporale sono affidabili?
- I log sono protetti e, se necessario, inoltrati fuori host?
- Le ricerche e la procedura di risposta sono state provate?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]
- [[Linux/Pagine/Hardening del sistema|Hardening del sistema]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/PAM|PAM]]

## Fonti

- [Linux Audit userspace](https://github.com/linux-audit/audit-userspace)
- [auditctl(8)](https://man7.org/linux/man-pages/man8/auditctl.8.html)
- [ausearch(8)](https://man7.org/linux/man-pages/man8/ausearch.8.html)
- [audit.rules(7)](https://man7.org/linux/man-pages/man7/audit.rules.7.html)
