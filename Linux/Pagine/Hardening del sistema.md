---
date: 2026-07-11
area: Linux
topic: Hardening Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, sicurezza, hardening, servizi, configurazione]
aliases: [Linux hardening, Messa in sicurezza Linux]
prerequisites: [Principio del minimo privilegio, Aggiornamenti di sicurezza]
related: [AppArmor e SELinux, Firewall con nftables, Audit e log di sicurezza]
---

# Hardening del sistema

## Sintesi

L'hardening riduce superficie d'attacco e impatto di una compromissione in base a ruolo, minacce e requisiti del sistema. Comprende aggiornamenti, servizi minimi, accessi controllati, configurazioni sicure, isolamento, logging, backup e verifica continua.

Una checklist generica non sostituisce il threat model. Impostazioni copiate possono interrompere funzionalità, creare falsa sicurezza o diventare obsolete.

## Quando usarlo

- Preparare workstation, server, appliance o immagini base.
- Ridurre servizi e porte esposte.
- Applicare baseline verificabili.
- Riesaminare configurazioni dopo cambi di ruolo.
- Preparare monitoraggio, recovery e risposta agli incidenti.

## Come funziona

Un processo pragmatico:

1. inventariare asset, dati, utenti, servizi e confini di fiducia;
2. definire minacce e requisiti operativi;
3. applicare aggiornamenti e rimuovere componenti inutili;
4. limitare identità, filesystem, rete e capability;
5. attivare MAC e sandbox dove sostenibili;
6. centralizzare log e proteggere backup;
7. verificare configurazione e comportamento;
8. documentare eccezioni, rollback e revisione.

Il risultato deve essere misurabile: porte previste, unit abilitate, account autorizzati, policy caricate, aggiornamenti correnti e backup ripristinabili.

## API / Sintassi

Elencare socket in ascolto:

```bash
sudo ss -lntup
```

Elencare servizi abilitati:

```bash
systemctl list-unit-files --type=service --state=enabled
```

Mostrare tutti gli account e la shell configurata:

```bash
getent passwd
```

Mostrare file con capability assegnate nei filesystem locali selezionati:

```bash
sudo getcap -r /usr /opt 2>/dev/null
```

Analizzare la superficie di una service unit:

```bash
systemd-analyze security nome.service
```

Mostrare il ruleset firewall:

```bash
sudo nft list ruleset
```

Mostrare i moduli LSM attivi:

```bash
cat /sys/kernel/security/lsm
```

## Esempio pratico

Partire dall'inventario dei listener:

```bash
sudo ss -lntup
```

Per ogni porta, associare processo, unit, necessità e reti autorizzate. Disabilitare un servizio non necessario tramite il gestore, quindi verificare nuovamente i listener.

Analizzare una unit esposta:

```bash
systemd-analyze security sshd.service
```

Il punteggio è un supporto euristico, non una certificazione. Ogni direttiva proposta va provata in staging e confrontata con il comportamento reale.

## Varianti

- Baseline CIS, ANSSI o DISA STIG possono offrire controlli, ma vanno mappate al contesto e alla release.
- Secure Boot e firma del kernel proteggono parti della catena di avvio.
- Filesystem read-only, mount option e sandbox systemd riducono scritture e visibilità.
- MFA e bastion host rafforzano l'accesso amministrativo.
- Immutable infrastructure riduce modifiche manuali ma richiede pipeline sicure.
- Scansioni di configurazione rilevano drift, non ogni vulnerabilità.

## Errori comuni

- Applicare tutti i sysctl trovati online senza modello di minaccia.
- Disabilitare servizi di sicurezza per eliminare un errore applicativo.
- Bloccare accesso remoto senza rollback o console.
- Rafforzare il sistema una sola volta senza gestire aggiornamenti e drift.
- Registrare segreti nei log durante l'aumento della verbosità.
- Confondere compliance e sicurezza effettiva.
- Non provare restore e procedure di emergenza.

## Checklist

- Ruolo, dati e minacce del sistema sono documentati?
- Pacchetti, servizi, account e porte non necessari sono rimossi o disabilitati?
- Accessi amministrativi applicano minimo privilegio e autenticazione forte?
- Firewall, MAC e sandbox sono attivi e testati?
- Log, alert e sincronizzazione temporale sono affidabili?
- Backup sono separati, protetti e ripristinabili?
- Ogni controllo ha test, proprietario, eccezione e rollback?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Audit e log di sicurezza|Audit e log di sicurezza]]
- [[Linux/Pagine/Aggiornamenti di sicurezza|Aggiornamenti di sicurezza]]

## Fonti

- [Linux kernel security](https://docs.kernel.org/security/)
- [systemd-analyze security](https://www.freedesktop.org/software/systemd/man/latest/systemd-analyze.html)
- [ANSSI GNU/Linux recommendations](https://cyber.gouv.fr/publications/configuration-recommendations-gnulinux-system)
