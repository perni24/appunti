---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - filesystem
  - io
aliases:
  - File system e I/O
  - File system e IO
  - I/O
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: File system e IO
---

# File system e IO

## Sintesi

Un file assente, un file illeggibile e un file contenente testo non valido richiedono decisioni diverse. **Tenta l'operazione e gestisci l'esito di quella chiamata**: controllare prima che il file esista non garantisce che esista ancora quando lo apri.

## Quando usarlo

Qui un programma Node legge una piccola preferenza facoltativa e genera un report che non deve sovrascriverne un altro. I percorsi provengono dall'applicazione, non da un nome arbitrario inviato dall'utente. Per file grandi serve uno stream o un limite di dimensione: `readFile` carica tutto il contenuto in memoria.

## Esempio pratico

Il primo contratto distingue «nessun documento» da un documento JSON contenente `null`. Il secondo crea un nuovo report in una directory già esistente.

```js
import { open, readFile } from "node:fs/promises";

export async function readOptionalJson(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { found: false };
    throw error;
  }
  return { found: true, value: JSON.parse(text) };
}

export async function createReport(path, text) {
  const file = await open(path, "wx");
  try {
    await file.writeFile(text, "utf8");
  } finally {
    await file.close();
  }
}
```

`ENOENT` può indicare anche che manca una directory del percorso: qui entrambe le assenze significano «nessuna preferenza». Per un file obbligatorio andrebbero invece segnalate. `EACCES` non viene mascherato; un file vuoto genera un errore di sintassi, non un default. La verifica della struttura del documento, se richiesta, resta un passaggio successivo.

## Scrittura e limiti

- `"wx"` chiede al filesystem la creazione esclusiva: su un normale disco locale, se il nome è già occupato la chiamata fallisce con `EEXIST` e il contenuto esistente resta intatto. Su filesystem di rete verifica le garanzie effettive.
- `finally` chiude l'handle anche quando la scrittura fallisce. **Non è un rollback**: un errore dopo l'apertura può lasciare un file vuoto o parziale. Se anche la chiusura fallisce, il suo errore può sostituire quello della scrittura.
- Se i lettori non devono mai vedere contenuto parziale, valuta scrittura su un temporaneo nella stessa directory e pubblicazione secondo le garanzie della piattaforma. Non confondere visibilità atomica, divieto di sovrascrittura e persistenza dopo un arresto.

## Checklist

Prova nel filesystem temporaneo l'assenza, il JSON scorretto e due creazioni sullo stesso percorso. Fissa l'encoding e verifica i byte o il testo riletti. Per la logica che usa il documento basta spesso un lettore sostitutivo; il comportamento di apertura, codifica e collisione merita una prova su disco.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Feathers, *Working Effectively with Legacy Code*
- POSIX Base Specifications
- [Node.js: filesystem, FileHandle e flag di apertura](https://nodejs.org/api/fs.html)
- [Node.js: codici degli errori di sistema](https://nodejs.org/api/errors.html#common-system-errors)
