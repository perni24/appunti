---
date: 2026-07-11
area: Linux
topic: Minimo privilegio
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, sicurezza, privilegi, autorizzazione]
aliases: [Least privilege, Minimo privilegio Linux]
prerequisites: [Gestione utenti, sudo e privilegi amministrativi]
related: [Hardening del sistema, AppArmor e SELinux, PAM]
---

# Principio del minimo privilegio

## Sintesi

Il principio del minimo privilegio assegna a utenti, processi e servizi soltanto accessi necessari, per il tempo necessario e nel contesto necessario. Riduce l'impatto di errori, credenziali compromesse e vulnerabilità.

Non significa negare tutto indiscriminatamente: i privilegi devono permettere il lavoro previsto ed essere verificabili, revocabili e separati per responsabilità.

## Problema che risolve

Account amministrativi permanenti, servizi eseguiti come root e permessi troppo ampi trasformano un singolo difetto in compromissione dell'intero sistema. Limitare autorità e raggio d'azione contiene il danno e rende più chiari gli accessi anomali.

## Concetto chiave

Il privilegio comprende più livelli:

- identità utente e gruppi;
- permessi, ACL e ownership dei file;
- deleghe `sudo` per comandi specifici;
- capability Linux invece dell'intero UID 0;
- policy AppArmor o SELinux;
- namespace, cgroup e sandbox del servizio;
- credenziali applicative e autorizzazioni sui dati.

La separazione dei compiti evita che una singola identità possa preparare, approvare e nascondere un'operazione critica. I privilegi temporanei e just-in-time riducono l'esposizione rispetto ad appartenenze amministrative permanenti.

## Dettagli importanti

Un servizio dovrebbe avere account dedicato, directory scrivibili limitate e nessuna shell interattiva se non necessaria. Le risorse condivise vanno autorizzate con gruppi o ACL mirati, non con `chmod 777`.

Le capability scompongono parte dei privilegi root, ma alcune sono molto potenti e combinazioni come `CAP_SYS_ADMIN` offrono una superficie ampia. Anche una delega limitata può diventare escalation se il programma autorizzato avvia shell, carica plugin o modifica file eseguiti da root.

La revisione periodica è parte del principio: privilegi corretti al momento dell'assegnazione possono diventare eccessivi dopo cambi di ruolo o architettura.

## Esempio

Un operatore deve riavviare un solo servizio. Invece di concedere una shell root, una regola `sudoers` può autorizzare il percorso e gli argomenti esatti:

```sudoers
%operatori-web ALL=(root) /usr/bin/systemctl restart nginx.service
```

La regola va comunque analizzata considerando controllo della unit, drop-in, binari eseguiti e file modificabili dall'operatore.

## Limiti

- Una policy troppo stretta può interrompere operazioni necessarie.
- Permessi minimi non correggono vulnerabilità nel perimetro autorizzato.
- Capability e container non equivalgono automaticamente a isolamento forte.
- La complessità eccessiva rende difficile verificare l'accesso effettivo.
- Il principio richiede inventario e revisione, non una configurazione una tantum.

## Errori comuni

- Eseguire ogni servizio come root per semplicità.
- Concedere `sudo ALL` quando serve una sola operazione.
- Usare permessi world-writable per risolvere problemi di ownership.
- Considerare l'appartenenza a un container o gruppo amministrativo innocua.
- Limitare il comando ma lasciare modificabili script o configurazioni eseguiti con privilegi.
- Dimenticare account, token e chiavi non più utilizzati.

## Checklist

- Qual è l'operazione minima necessaria?
- Identità e credenziali sono dedicate al ruolo?
- Privilegi possono essere limitati per comando, percorso, rete e durata?
- File e configurazioni indirettamente eseguiti sono protetti?
- Accessi sono registrati e revisionati?
- Esiste revoca automatica o periodica?
- Il flusso di recupero evita privilegi permanenti eccessivi?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/sudo e privilegi amministrativi|sudo e privilegi amministrativi]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/Hardening del sistema|Hardening del sistema]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/PAM|PAM]]

## Fonti

- [Linux capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [systemd security](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [Linux Security Module](https://docs.kernel.org/admin-guide/LSM/)
