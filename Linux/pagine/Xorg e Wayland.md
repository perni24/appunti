---
date: 2026-07-11
area: Linux
topic: Sistemi grafici Linux
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, desktop, xorg, wayland, xwayland]
aliases: [X11 e Wayland, Display server Linux]
prerequisites: [Driver e firmware, D-Bus]
related: [Desktop environment e window manager, Portali desktop e applicazioni predefinite]
---

# Xorg e Wayland

## Sintesi

Xorg implementa il protocollo X11 con un server che gestisce input, output e finestre per client separati. Wayland è un protocollo nel quale il compositor svolge direttamente il ruolo di display server, window manager e compositore.

XWayland è un server X eseguito come client Wayland e permette a molte applicazioni X11 di funzionare in una sessione Wayland.

## Problema che risolve

Le applicazioni grafiche devono condividere display e input, coordinare finestre e comunicare con driver e compositor. X11 e Wayland definiscono modelli diversi per distribuire queste responsabilità e isolare i client.

## Concetto chiave

In X11 il server è centrale e il window manager è un client privilegiato che controlla disposizione e decorazioni. Il protocollo storico consente ai client ampie interazioni globali, difficili da isolare completamente.

In Wayland il compositor riceve buffer delle applicazioni e instrada input alle surface appropriate. Operazioni globali, come screenshot e screen sharing, passano normalmente da protocolli del compositor e portali autorizzati.

## Dettagli importanti

Wayland non è un singolo server: GNOME usa Mutter, KDE usa KWin e altri ambienti usano compositor differenti. Funzionalità dipendono dai protocolli implementati e non soltanto dalla presenza di Wayland.

XWayland offre compatibilità, ma applicazioni eseguite tramite esso mantengono alcuni comportamenti X11. Scaling, input sintetico, color management, screen capture e driver possono differire tra sessioni.

## Esempio

Mostrare il tipo della sessione corrente:

```bash
printf '%s\n' "$XDG_SESSION_TYPE"
```

Mostrare proprietà della sessione tramite logind:

```bash
loginctl show-session "$XDG_SESSION_ID" -p Type -p Desktop -p Remote
```

Mostrare display X11 quando disponibile:

```bash
printf '%s\n' "$DISPLAY"
```

Mostrare socket Wayland quando disponibile:

```bash
printf '%s\n' "$WAYLAND_DISPLAY"
```

## Limiti

- Il supporto Wayland varia tra compositor, applicazioni, driver e protocolli opzionali.
- XWayland non rende automaticamente nativa una applicazione X11.
- X11 può essere usato in rete, ma sicurezza e prestazioni richiedono strumenti appropriati.
- Variabili d'ambiente indicano la sessione, ma una singola applicazione può usare un backend differente.
- Nessun protocollo corregge da solo bug di driver o toolkit.

## Errori comuni

- Chiamare Wayland un window manager completo indipendente dal compositor.
- Disabilitare Wayland globalmente per un problema limitato a una applicazione.
- Usare `xrandr` in una sessione Wayland e aspettarsi di configurare il compositor.
- Confondere display manager e display server.
- Credere che tutte le app in sessione Wayland siano native Wayland.
- Forzare variabili toolkit senza verificarne supporto e rollback.

## Checklist

- La sessione è X11 o Wayland?
- L'applicazione usa backend nativo o XWayland?
- Quale compositor e quali protocolli sono disponibili?
- Driver grafico e toolkit supportano il caso d'uso?
- Il problema riguarda scaling, input, capture o rendering?
- Portali e servizi utente sono attivi?
- Il comportamento cambia in una sessione alternativa pulita?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Driver e firmware|Driver e firmware]]
- [[Linux/Pagine/Desktop environment e window manager|Desktop environment e window manager]]
- [[Linux/Pagine/Portali desktop e applicazioni predefinite|Portali desktop e applicazioni predefinite]]

## Fonti

- [Wayland documentation](https://wayland.freedesktop.org/docs/html/)
- [X.Org documentation](https://www.x.org/wiki/Documentation/)
- [XWayland](https://wayland.freedesktop.org/xserver.html)
