---
date: 2026-07-11
area: Linux
topic: Ambiente desktop Linux
type: theory-note
status: "non revisionato"
difficulty: base
tags: [linux, desktop, window-manager, compositor, sessione]
aliases: [Desktop environment Linux, Window manager Linux]
prerequisites: [Xorg e Wayland]
related: [D-Bus, Audio con PipeWire, Portali desktop e applicazioni predefinite]
---

# Desktop environment e window manager

## Sintesi

Un desktop environment integra window manager o compositor, pannelli, launcher, impostazioni, notifiche, sessione e applicazioni coordinate. Un window manager gestisce disposizione e comportamento delle finestre, ma da solo non fornisce necessariamente tutti i servizi desktop.

Il display manager è ancora un componente distinto: presenta il login grafico e avvia la sessione selezionata.

## Problema che risolve

Una sessione grafica richiede coordinamento tra finestre, input, configurazione, autenticazione, notifiche, portali e servizi utente. Separare i ruoli permette di capire quale componente controlla un comportamento e di evitare configurazioni sovrapposte.

## Concetto chiave

| Componente | Responsabilità tipica |
| --- | --- |
| display manager | login e scelta sessione |
| window manager X11 | posizione, focus e decorazioni |
| compositor Wayland | display server, composizione e gestione finestre |
| desktop shell | pannelli, overview, launcher e notifiche |
| settings daemon | applica preferenze e integrazioni |
| session manager | avvia e monitora componenti della sessione |

GNOME, KDE Plasma, Xfce e altri ambienti scelgono componenti e API differenti. Window manager standalone come i3 o Openbox richiedono spesso strumenti separati; compositor Wayland standalone come Sway incorpora più responsabilità.

## Dettagli importanti

Le sessioni sono descritte da file desktop in directory standard e avviate dal display manager. Variabili come `XDG_CURRENT_DESKTOP`, `XDG_SESSION_DESKTOP` e `XDG_SESSION_TYPE` aiutano a identificare l'ambiente, ma non sono un contratto universale per ogni applicazione.

Molti servizi sono user unit systemd o processi attivati tramite D-Bus. Problemi del desktop possono quindi dipendere dal bus utente, dal portale, dal compositor o dal settings daemon, non soltanto dal window manager.

## Esempio

Mostrare variabili principali della sessione:

```bash
printf 'desktop=%s session=%s type=%s\n' "$XDG_CURRENT_DESKTOP" "$XDG_SESSION_DESKTOP" "$XDG_SESSION_TYPE"
```

Mostrare dettagli della sessione logind:

```bash
loginctl session-status
```

Mostrare il display manager configurato come unit:

```bash
systemctl status display-manager.service
```

Elencare sessioni installate:

```bash
find /usr/share/xsessions /usr/share/wayland-sessions -maxdepth 1 -type f
```

## Limiti

- I confini variano tra ambienti e versioni.
- Mescolare componenti di desktop diversi può funzionare ma aggiunge policy e daemon concorrenti.
- Un window manager minimale richiede configurazione esplicita di rete, audio, notifiche e portali.
- Il display manager non determina da solo X11 o Wayland.
- Variabili XDG possono essere mancanti o personalizzate.

## Errori comuni

- Confondere display manager, display server e window manager.
- Installare più settings daemon che modificano le stesse preferenze.
- Riavviare servizi di sistema per un problema nella user session.
- Considerare ogni processo GNOME o KDE parte obbligatoria del compositor.
- Rimuovere componenti del desktop senza leggere dipendenze del metapacchetto.
- Diagnosticare una sessione personalizzata come se fosse quella predefinita della distribuzione.

## Checklist

- Quale display manager ha avviato quale sessione?
- La sessione usa X11 o Wayland?
- Quale processo è window manager o compositor?
- Quali settings daemon e portali sono attivi?
- Il problema appare con un nuovo profilo utente?
- Esistono componenti concorrenti di ambienti diversi?
- Log utente e sessione identificano il primo errore?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Xorg e Wayland|Xorg e Wayland]]
- [[Linux/Pagine/D-Bus|D-Bus]]
- [[Linux/Pagine/Audio con PipeWire|Audio con PipeWire]]
- [[Linux/Pagine/Portali desktop e applicazioni predefinite|Portali desktop e applicazioni predefinite]]

## Fonti

- [freedesktop.org specifications](https://www.freedesktop.org/wiki/Specifications/)
- [systemd logind](https://www.freedesktop.org/software/systemd/man/latest/systemd-logind.service.html)
- [Wayland architecture](https://wayland.freedesktop.org/docs/html/ch03.html)
