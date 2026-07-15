---
date: 2026-07-11
area: Linux
topic: Audio PipeWire
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, audio, pipewire, wireplumber, alsa]
aliases: [PipeWire, Audio Linux moderno]
prerequisites: [D-Bus, Driver e firmware]
related: [Desktop environment e window manager]
---

# Audio con PipeWire

## Sintesi

PipeWire è un media server che gestisce un grafo di node, port e link per audio e video. WirePlumber agisce normalmente come session manager e applica policy su profili, routing e device. ALSA resta il sottosistema kernel con cui vengono esposti molti dispositivi audio.

I layer di compatibilità permettono alle applicazioni PulseAudio e JACK di usare PipeWire senza parlare direttamente la sua API nativa.

## Quando usarlo

- Verificare sink, source, stream e route audio.
- Cambiare dispositivo predefinito o volume.
- Diagnosticare servizi utente PipeWire/WirePlumber.
- Analizzare profili Bluetooth o schede audio.
- Ispezionare il grafo multimediale.

## Come funziona

PipeWire crea oggetti per device, node, port e link. WirePlumber osserva il grafo, seleziona profili e collega stream a source e sink secondo policy, metadata e preferenze.

I daemon vengono normalmente eseguiti come servizi utente. Riavviare servizi di sistema non corregge una sessione utente se il problema vive nel relativo user manager.

## API / Sintassi

Mostrare device e stream secondo WirePlumber:

```bash
wpctl status
```

Mostrare volume del sink predefinito:

```bash
wpctl get-volume @DEFAULT_AUDIO_SINK@
```

Impostare volume con limite esplicito:

```bash
wpctl set-volume @DEFAULT_AUDIO_SINK@ 50%
```

Attivare o disattivare mute:

```bash
wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
```

Mostrare performance dei node:

```bash
pw-top
```

Elencare oggetti PipeWire:

```bash
pw-cli list-objects
```

Mostrare servizi utente coinvolti:

```bash
systemctl --user status pipewire wireplumber
```

Mostrare log utente del boot:

```bash
journalctl --user -b -u pipewire -u wireplumber
```

## Esempio pratico

Verificare che sink e source esistano:

```bash
wpctl status
```

Controllare mute e volume predefiniti:

```bash
wpctl get-volume @DEFAULT_AUDIO_SINK@
```

Riavviare il session manager utente quando la policy è bloccata:

```bash
systemctl --user restart wireplumber
```

Se il device non appare, controllare prima ALSA, driver e log kernel; PipeWire non può creare un device hardware non esposto dal kernel.

## Varianti

- `pavucontrol` usa la compatibilità PulseAudio e offre controllo grafico.
- `pw-dump` serializza lo stato del grafo per diagnosi.
- JACK tramite PipeWire supporta workflow professionali con configurazioni specifiche.
- Bluetooth dipende anche da BlueZ, codec e profilo selezionato.
- Portali desktop mediano acquisizione schermo e audio in applicazioni sandboxed.
- Configurazioni WirePlumber locali devono seguire formato e versione installata.

## Errori comuni

- Confondere PipeWire e WirePlumber come se fossero lo stesso daemon.
- Riavviare il servizio di sistema invece di quello utente.
- Modificare configurazioni PulseAudio obsolete in un setup PipeWire.
- Alzare il volume oltre il 100% senza considerare clipping.
- Attribuire a PipeWire un device assente da ALSA.
- Sovrapporre più session manager.
- Copiare configurazioni WirePlumber appartenenti a versioni differenti.

## Checklist

- ALSA e il kernel rilevano il device?
- PipeWire e WirePlumber sono attivi nella sessione utente?
- Sink, source e stream compaiono in `wpctl status`?
- Profilo, route, default, volume e mute sono corretti?
- Il problema riguarda solo una applicazione o l'intera sessione?
- Log utente e kernel mostrano errori?
- Bluetooth o portali aggiungono un ulteriore livello?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Driver e firmware|Driver e firmware]]
- [[Linux/Pagine/D-Bus|D-Bus]]
- [[Linux/Pagine/Desktop environment e window manager|Desktop environment e window manager]]
- [[Linux/Pagine/Portali desktop e applicazioni predefinite|Portali desktop e applicazioni predefinite]]

## Fonti

- [PipeWire documentation](https://docs.pipewire.org/)
- [WirePlumber documentation](https://pipewire.pages.freedesktop.org/wireplumber/)
- [PipeWire pw-cli](https://docs.pipewire.org/page_man_pw-cli_1.html)
