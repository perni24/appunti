---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, filesystem, io]
aliases: [File system e I/O, File system e IO, I/O]
prerequisites: [Side effects controllati, Gestione esplicita degli errori]
related: [Configurazione applicativa, Parsing e serializzazione, Codice testabile]
---

# File system e IO

## Sintesi

Il **file system** e l'**I/O** sono punti in cui il codice interagisce con risorse esterne: file, stream, percorsi, permessi, encoding e dispositivi.

Nel Clean Code queste operazioni vanno isolate, gestite con errori espliciti e protette da assunzioni fragili.

## Quando usarlo

- Quando leggi o scrivi file.
- Quando importi dati da directory.
- Quando generi report, cache o artefatti.
- Quando lavori con stream.
- Quando una procedura dipende da percorsi configurabili.

## Come funziona

L'I/O e un side effect. Per questo conviene separare:

- calcolo del percorso;
- lettura/scrittura;
- parsing del contenuto;
- validazione;
- trasformazione;
- gestione degli errori.

Questa separazione rende il codice piu testabile e meno dipendente dall'ambiente.

## API / Sintassi

```text
path config -> safe path -> read/write -> parse/serialize -> domain result
```

Il percorso dovrebbe essere validato e l'errore dovrebbe conservare il contesto.

## Esempio pratico

```js
function loadJsonFile(fileSystem, path) {
  const content = fileSystem.readText(path);
  return JSON.parse(content);
}
```

Passare `fileSystem` come dipendenza permette di testare il comportamento senza toccare il disco reale.

## Varianti

- Lettura sincrona: semplice per CLI piccole o startup.
- Lettura asincrona: adatta a server e operazioni concorrenti.
- Stream: utile per file grandi.
- File temporanei: richiedono cleanup esplicito.
- Path configurati: utili ma da validare.

## Errori comuni

- Hardcodare percorsi assoluti.
- Ignorare encoding.
- Non chiudere risorse o stream.
- Leggere file grandi interamente senza bisogno.
- Mescolare I/O, parsing e logica di dominio.

## Checklist

- Il percorso arriva da configurazione controllata?
- Gli errori contengono nome file o contesto utile?
- Le risorse vengono chiuse o rilasciate?
- Parsing e I/O sono separati?
- I test evitano dipendenza non necessaria dal file system reale?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Side effects controllati]]
- [[Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Parsing e serializzazione]]
- [[Codice testabile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Feathers, *Working Effectively with Legacy Code*
- POSIX Base Specifications
