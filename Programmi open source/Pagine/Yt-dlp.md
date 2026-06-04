---
date: 2026-06-04
area: Programmi open source
topic: Download media da riga di comando
type: technical-note
status: "non revisionato"
difficulty: base
tags: [open-source, cli, download, video, audio]
aliases: [yt-dlp]
prerequisites: []
related: []
---

# Yt-dlp

## Sintesi

**Yt-dlp** e un programma open source da riga di comando usato per scaricare video, audio, playlist, sottotitoli e metadati da YouTube e da molti altri siti supportati.

E nato come fork di `youtube-dl` e viene usato soprattutto quando serve un downloader flessibile, automatizzabile e adatto a script.

## Quando usarlo

- Salvare una copia locale di video o audio disponibili online.
- Scaricare playlist o canali in modo ordinato.
- Estrarre solo l'audio da un video.
- Integrare download multimediali in script o procedure automatiche.
- Archiviare contenuti con titolo, descrizione, miniature, sottotitoli e metadati.

## Come funziona

`yt-dlp` analizza l'URL fornito, individua i formati disponibili e scarica il flusso scelto. Puo selezionare automaticamente la qualita migliore oppure usare opzioni esplicite per formato, risoluzione, audio, sottotitoli e nome del file.

Per alcune operazioni, come unire video e audio separati o convertire in altri formati, si appoggia normalmente a `ffmpeg`.

## Comandi utili

```bash
# Scarica un video con le impostazioni predefinite
yt-dlp "https://example.com/video"

# Mostra i formati disponibili
yt-dlp -F "https://example.com/video"

# Scarica il formato migliore disponibile
yt-dlp -f best "https://example.com/video"

# Estrae solo l'audio in mp3
yt-dlp -x --audio-format mp3 "https://example.com/video"

# Scarica una playlist usando un nome file ordinato
yt-dlp -o "%(playlist_index)s - %(title)s.%(ext)s" "https://example.com/playlist"
```

## Errori comuni

- **Usarlo senza aggiornare il programma**: molti siti cambiano spesso struttura; se un download fallisce, la prima cosa da provare e aggiornare `yt-dlp`.
- **Non installare `ffmpeg`**: senza `ffmpeg` alcune conversioni o merge tra audio e video possono non funzionare.
- **Scaricare senza controllare licenze e diritti**: lo strumento e neutro, ma l'uso deve rispettare copyright, termini del sito e norme locali.
- **Non quotare gli URL**: in shell conviene mettere l'URL tra virgolette, soprattutto se contiene caratteri speciali.

## Checklist

- Verificare che `yt-dlp` sia aggiornato.
- Installare `ffmpeg` se servono conversioni o merge.
- Usare `-F` quando bisogna scegliere un formato specifico.
- Definire `-o` se si vuole controllare il nome dei file scaricati.
- Controllare sempre permessi, licenze e finalita del download.

