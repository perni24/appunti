---
date: 2026-07-11
area: Linux
topic: Integrazione desktop freedesktop
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, desktop, xdg, portal, mime, applicazioni]
aliases: [xdg-desktop-portal, Applicazioni predefinite Linux]
prerequisites: [D-Bus, Desktop environment e window manager]
related: [Xorg e Wayland, Gestione dei font]
---

# Portali desktop e applicazioni predefinite

## Sintesi

xdg-desktop-portal espone API D-Bus mediate per file chooser, apertura URI, screenshot, screen cast, notifiche e altre operazioni. È particolarmente importante per applicazioni Flatpak e sandboxed, ma può essere usato anche da applicazioni host.

Le applicazioni predefinite sono associate a tipi MIME o scheme tramite desktop entry e configurazioni XDG. Il backend del portale e il gestore MIME sono livelli collegati ma distinti.

## Quando usarlo

- Diagnosticare file chooser o screen sharing in applicazioni sandboxed.
- Verificare backend portal attivo nella sessione.
- Impostare browser, lettore PDF o handler di uno scheme.
- Controllare tipo MIME riconosciuto per un file.
- Analizzare perché `xdg-open` avvia una applicazione inattesa.

## Come funziona

Il servizio frontend `xdg-desktop-portal` seleziona uno o più backend, per esempio GNOME, KDE o wlroots, in base alla sessione e alla configurazione. Le richieste possono mostrare dialoghi e restituire accessi limitati invece di esporre direttamente risorse host.

Una desktop entry `.desktop` contiene identificatore, comando, nome e tipi supportati. Le associazioni vengono memorizzate in `mimeapps.list` secondo precedenze XDG. `xdg-mime` e `xdg-open` offrono interfacce portabili per interrogare o richiedere operazioni.

## API / Sintassi

Mostrare stato del portale nella sessione utente:

```bash
systemctl --user status xdg-desktop-portal.service
```

Mostrare backend portal attivi:

```bash
systemctl --user --type=service | grep xdg-desktop-portal
```

Consultare i log del portale:

```bash
journalctl --user -b -u xdg-desktop-portal.service
```

Verificare il tipo MIME di un file:

```bash
xdg-mime query filetype documento.pdf
```

Mostrare l'applicazione predefinita per PDF:

```bash
xdg-mime query default application/pdf
```

Impostare una desktop entry come predefinita per PDF:

```bash
xdg-mime default org.pwmt.zathura.desktop application/pdf
```

Aprire un file tramite handler predefinito:

```bash
xdg-open documento.pdf
```

Introspezionare il portale sul bus utente:

```bash
gdbus introspect --session --dest org.freedesktop.portal.Desktop --object-path /org/freedesktop/portal/desktop
```

## Esempio pratico

Identificare il MIME reale:

```bash
xdg-mime query filetype documento.pdf
```

Controllare la desktop entry selezionata:

```bash
xdg-mime query default application/pdf
```

Verificare che la entry esista nelle directory applicazioni:

```bash
find /usr/share/applications "$HOME/.local/share/applications" -name 'org.pwmt.zathura.desktop'
```

Se una applicazione Flatpak non apre il chooser, controllare frontend e backend portal nel journal utente prima di modificare associazioni MIME.

## Varianti

- Portali FileChooser possono concedere accesso a file selezionati tramite document portal.
- ScreenCast e RemoteDesktop dipendono dal compositor e dal backend.
- `gio mime` interroga e modifica associazioni tramite GLib.
- Scheme handler come `x-scheme-handler/https` scelgono il browser.
- `mimeapps.list` può esistere a livello utente, desktop e sistema con precedenze specifiche.
- Flatpak permission store conserva decisioni per alcune API portal.

## Errori comuni

- Installare più backend incompatibili senza capire quale viene selezionato.
- Confondere il frontend portal con il backend desktop.
- Modificare associazioni MIME per risolvere un portale non avviato.
- Usare il nome visibile dell'app invece dell'ID della desktop entry.
- Modificare `.desktop` di sistema che verrà sovrascritto dal package manager.
- Riavviare servizi di sistema invece della user session.
- Credere che `xdg-open` sia sicuro per URI non fidati senza validazione applicativa.

## Checklist

- Frontend e backend portal sono attivi nella user session?
- Il backend corrisponde al desktop/compositor?
- Il tipo MIME rilevato è corretto?
- La desktop entry esiste e dichiara il tipo o scheme?
- Quale `mimeapps.list` ha precedenza?
- Il problema riguarda host app o sandbox?
- Journal utente e introspection mostrano l'API necessaria?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/D-Bus|D-Bus]]
- [[Linux/Pagine/Xorg e Wayland|Xorg e Wayland]]
- [[Linux/Pagine/Desktop environment e window manager|Desktop environment e window manager]]
- [[Linux/Pagine/Gestione dei font|Gestione dei font]]
- [[Linux/Pagine/Audio con PipeWire|Audio con PipeWire]]

## Fonti

- [XDG Desktop Portal documentation](https://flatpak.github.io/xdg-desktop-portal/)
- [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/)
- [MIME Applications Specification](https://specifications.freedesktop.org/mime-apps-spec/latest/)
- [xdg-utils](https://www.freedesktop.org/wiki/Software/xdg-utils/)
