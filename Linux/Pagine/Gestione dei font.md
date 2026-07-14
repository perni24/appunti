---
date: 2026-07-11
area: Linux
topic: Font Linux
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, desktop, fontconfig, font, freetype]
aliases: [Font Linux, fontconfig]
prerequisites: [Filesystem Hierarchy Standard, Desktop environment e window manager]
related: [Xorg e Wayland]
---

# Gestione dei font

## Sintesi

Fontconfig scopre font, applica regole e seleziona fallback; FreeType rasterizza i glifi per toolkit e applicazioni. Installare un file non garantisce che venga scelto: famiglia, stile, copertura Unicode, cache e configurazione influenzano il risultato.

I font utente appartengono normalmente a `~/.local/share/fonts`; quelli di sistema a directory come `/usr/share/fonts` e `/usr/local/share/fonts`.

## Quando usarlo

- Installare un font per utente o sistema.
- Verificare quale font soddisfa una famiglia richiesta.
- Diagnosticare glifi mancanti e fallback.
- Ricostruire cache dopo modifiche.
- Ispezionare metadata di un file font.

## Come funziona

Le applicazioni richiedono un pattern, per esempio famiglia, peso, stile e lingua. Fontconfig confronta il pattern con i font indicizzati e restituisce una corrispondenza o una lista di fallback.

Una famiglia può contenere più face. I variable font incorporano assi come peso e larghezza in un singolo file, ma il supporto dipende da librerie e applicazioni.

Configurazioni XML in fontconfig possono definire alias, sostituzioni e preferenze. Modifiche globali influenzano molte applicazioni e richiedono test su toolkit differenti.

## API / Sintassi

Elencare font conosciuti:

```bash
fc-list
```

Mostrare la corrispondenza per una famiglia:

```bash
fc-match 'sans-serif'
```

Mostrare la catena di fallback:

```bash
fc-match --sort 'sans-serif'
```

Ispezionare un file font:

```bash
fc-scan MioFont.ttf
```

Installare un font per il solo utente:

```bash
install -Dm644 MioFont.ttf "$HOME/.local/share/fonts/MioFont.ttf"
```

Aggiornare la cache utente:

```bash
fc-cache -f "$HOME/.local/share/fonts"
```

Mostrare directory font configurate:

```bash
fc-cache -v
```

## Esempio pratico

Ispezionare nome interno e stile prima di installare:

```bash
fc-scan MioFont.ttf
```

Installare nella directory utente:

```bash
install -Dm644 MioFont.ttf "$HOME/.local/share/fonts/MioFont.ttf"
```

Aggiornare la cache:

```bash
fc-cache -f "$HOME/.local/share/fonts"
```

Verificare usando il nome famiglia interno mostrato da `fc-scan`:

```bash
fc-match 'Nome Famiglia'
```

## Varianti

- Pacchetti della distribuzione sono preferibili per font condivisi e aggiornabili.
- Font per applicazioni sandboxed possono essere esposti tramite runtime o portali secondo il formato.
- `~/.fonts` è una directory storica; `~/.local/share/fonts` segue il layout XDG moderno.
- Hinting, antialiasing e subpixel rendering dipendono da stack grafico e display.
- Emoji e CJK richiedono font con copertura e fallback appropriati.
- Web font caricati dal browser seguono un percorso diverso dai font di sistema.

## Errori comuni

- Rinominare il file aspettandosi di cambiare il nome famiglia interno.
- Installare duplicati con versioni differenti e ottenere match inattesi.
- Eseguire `fc-cache` come root per un font solo utente.
- Confondere font mancante con glifo assente nella face scelta.
- Copiare font senza verificare licenza.
- Applicare regole fontconfig globali per correggere una sola applicazione.
- Dimenticare che applicazioni aperte possono mantenere cache proprie.

## Checklist

- Licenza e provenienza permettono l'installazione?
- Il font è utente o sistema?
- Nome famiglia, stile e copertura sono stati letti con `fc-scan`?
- Esistono duplicati o versioni precedenti?
- `fc-match` restituisce la face attesa?
- Fallback copre i caratteri mancanti?
- Applicazioni interessate sono state riavviate?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Desktop environment e window manager|Desktop environment e window manager]]
- [[Linux/Pagine/Xorg e Wayland|Xorg e Wayland]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]

## Fonti

- [Fontconfig User's Guide](https://fontconfig.pages.freedesktop.org/fontconfig/fontconfig-user.html)
- [Fontconfig utilities](https://fontconfig.pages.freedesktop.org/fontconfig/fontconfig-user.html#tools)
- [FreeType documentation](https://freetype.org/freetype2/docs/)
