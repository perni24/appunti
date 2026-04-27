---
date: 2026-04-27
tags: [linux, package-management, flatpak, snap, appimage]
type: #permanent-note
status: budding
---

# Gestione pacchetti universali

I pacchetti universali nascono per risolvere il problema della **Dependency Hell** e della frammentazione tra le diverse distribuzioni [[Indice Linux|Linux]]. A differenza dei gestori di pacchetti tradizionali (come `pacman` su [[Indice ArchLinux|ArchLinux]] o `apt` su Debian), questi formati includono tutte le dipendenze necessarie all'interno del pacchetto stesso o utilizzano dei "runtime" condivisi.

> [!INFO] Definizione
> Un **Universal Package** è un formato di distribuzione software agnostico rispetto alla distribuzione, progettato per funzionare su quasi ogni sistema Linux moderno senza conflitti di librerie.

## 1. Flatpak
Flatpak è fortemente orientato all'ambiente desktop e alla sicurezza tramite isolamento.

- **Architettura:** Utilizza **Bubblewrap** per il sandboxing e **OSTree** per la gestione dei dati.
- **Runtime & Bundles:** Le applicazioni poggiano su "Runtime" (es. GNOME o KDE platform) per evitare di duplicare librerie comuni, pur rimanendo isolate dal sistema host.
- **Comandi principali:**
	- `flatpak install flathub <package>`: Installa un pacchetto dal repository principale.
	- `flatpak run <package>`: Esegue l'applicazione.
	- `flatpak override`: Permette di modificare i permessi della sandbox (es. accesso al filesystem).

## 2. Snap (Snappy)
Sviluppato da Canonical, Snap è pensato sia per il desktop che per il mondo Cloud/IoT.

- **Architettura:** I pacchetti sono immagini compresse **SquashFS** montate come loop devices.
- **Confinement:** Utilizza AppArmor e Cgroups nel kernel per garantire la sicurezza.
- **Caratteristiche:** Supporta i "delta updates" (scarica solo le parti modificate) e il rollback automatico alle versioni precedenti.

## 3. AppImage
Segue la filosofia "una applicazione = un file".

- **Nessuna Installazione:** Non richiede privilegi di root né un demone di gestione. Basta rendere il file eseguibile (`chmod +x`).
- **Portabilità:** Ideale per chiavette USB o per testare software senza sporcare il sistema.
- **Logica:** Quando eseguito, monta un filesystem temporaneo (FUSE) e avvia l'applicazione contenuta.

## Confronto Rapido

| Caratteristica | Flatpak | Snap | AppImage |
| --- | --- | --- | --- |
| **Sandboxing** | Forte (Bubblewrap) | Forte (AppArmor) | Opzionale/Debole |
| **Aggiornamenti** | Centralizzati | Automatici (forzati) | Manuali (solitamente) |
| **Backend** | Open Source | Proprietario (Server side) | Open Source |
| **Portabilità** | Richiede il demone | Richiede il demone | Standalone |

## Perché usarli?
L'adozione di questi formati facilita lo sviluppo di software "build once, run anywhere", riducendo il carico di manutenzione per gli sviluppatori che non devono più impacchettare il software per ogni singola distribuzione. Inoltre, migliorano la **Sicurezza** del sistema limitando l'accesso delle applicazioni alle risorse hardware e ai dati dell'utente tramite meccanismi di isolamento.
