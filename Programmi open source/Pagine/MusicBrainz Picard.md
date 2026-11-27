---
date: 2026-06-05
area: Programmi open source
topic: Tagging e organizzazione libreria musicale
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - musica
  - metadata
  - tagging
  - audio
aliases:
  - Picard
  - MusicBrainz Picard
prerequisites: []
related:
  - "[[Programmi open source/Pagine/Yt-dlp]]"
title: MusicBrainz Picard
publish: true
---

# MusicBrainz Picard

## Sintesi

MusicBrainz Picard è un programma open source per Windows, macOS e Linux che identifica i file audio e ne corregge i tag, come artista, album, titolo, numero di traccia e anno. Può anche recuperare copertine e organizzare i file per nome o cartella. Serve a catalogare una libreria, non a riprodurre la musica né a eliminare automaticamente i duplicati.

## Scegliere tra Lookup e Scan

| Situazione | Comando | Su cosa si basa |
| --- | --- | --- |
| I file hanno già artista, album o titolo plausibili | `Cluster`, poi `Lookup` sul gruppo | Raggruppa per album e cerca in MusicBrainz usando i metadati esistenti. |
| I tag mancano o indicano il brano sbagliato | `Scan` sui file | Calcola un’impronta dall’audio e cerca la registrazione tramite AcoustID. |

La stessa registrazione può apparire nell’album originale e in una compilation: riconoscere **il brano** non basta per scegliere **l’edizione** da cui provengono i tuoi file.

## Esempio pratico

1. Lavora sulla copia di un album. Trascina i file nel pannello sinistro e scegli il metodo adatto dalla tabella.
2. Nel pannello destro verifica l’edizione proposta: confronta artista, ordine, numero e durata delle tracce, poi controlla tag e copertina.
3. Prima di salvare, verifica se le opzioni per rinominare o spostare i file sono abilitate. Lasciale disattivate se vuoi cambiare soltanto i tag.
4. Seleziona i file abbinati e usa `Save`. Verifica sul disco i tag e il percorso del piccolo lotto prima di passare al resto della libreria.

## Limiti

Una corrispondenza è una proposta, non una garanzia. Se nessuna edizione coincide con quella in tuo possesso, non sovrascrivere i tag originali sulla base del solo titolo. Conserva una copia prima di applicare salvataggi o rinominazioni in massa.

## Collegamenti

- [[Programmi open source/Pagine/Yt-dlp|yt-dlp]]
- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [Picard: raggruppare e cercare file con metadati](https://picard-docs.musicbrainz.org/en/latest/workflows/workflow_metadata.html)
- [Picard: identificare i file tramite impronta acustica](https://picard-docs.musicbrainz.org/en/latest/usage/retrieve_scan.html)
- [Picard: salvare le modifiche nei file](https://picard-docs.musicbrainz.org/en/latest/usage/save.html)
- [Picard: download per piattaforma](https://picard.musicbrainz.org/downloads/)
