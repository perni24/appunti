---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - lifecycle
  - oggetti
aliases:
  - Lifecycle degli oggetti
  - Object lifecycle
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione delle risorse]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Ownership concettuale]]"
  - "[[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti interne]]"
title: Lifecycle degli oggetti
---

# Lifecycle degli oggetti

## Sintesi

Il ciclo di vita di un oggetto è l'insieme delle **operazioni ammesse in ogni fase**. Un writer deve poter scrivere subito dopo la creazione, rifiutare scritture dopo l'inizio della chiusura e distinguere «chiusura riuscita» da «chiusura tentata ma fallita». Un solo booleano `closed` perde quest'ultima informazione.

## Esempio: writer sincrono

Il costruttore riceve un adattatore già aperto con metodi **sincroni** `write` e `close`. Da quel momento il writer è responsabile di chiuderlo; il chiamante non lo usa direttamente.

```js
class ReportWriter {
  #file;
  #state = "open";

  constructor(file) { this.#file = file; }
  get state() { return this.#state; }

  write(line) {
    if (this.#state !== "open") throw new Error("Report non scrivibile");
    this.#file.write(line);
  }

  close() {
    if (this.#state === "closed") return;
    if (this.#state !== "open") throw new Error("Chiusura non ripetibile");
    this.#state = "closing";
    try {
      this.#file.close();
      this.#state = "closed";
    } catch (error) {
      this.#state = "close_failed";
      throw error;
    }
  }
}
```

## Leggere le transizioni

| Stato | `write` | `close` |
| --- | --- | --- |
| `open` | Delega all'adattatore | Avvia una chiusura |
| `closing` | Rifiuta | Rifiuta una chiamata rientrante |
| `closed` | Rifiuta | Non fa nulla: la chiusura riuscita è ripetibile |
| `close_failed` | Rifiuta | Non ritenta alla cieca: lo stato della risorsa sottostante è incerto |

## Limiti e verifica

Un errore di `write` si propaga e il proprietario può ancora tentare il cleanup: non significa che si possa riscrivere la stessa riga senza duplicarla. Se `close` o `write` restituiscono promesse, questo modello **non basta**: bisogna attendere le scritture in corso e la chiusura effettiva. Nei test conta le chiamate all'adattatore e controlla lo stato dopo un errore, non solo il messaggio ricevuto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Gestione delle risorse|Gestione delle risorse]]
- [[Programmazione/Clean Code/Pagine/Ownership concettuale|Ownership concettuale]]
- [[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse|Cleanup e rilascio risorse]]
- [[Programmazione/Clean Code/Pagine/Invarianti interne|Invarianti interne]]

## Fonti

- Martin Fowler, *Refactoring*
- Eric Evans, *Domain-Driven Design*
- Michael Feathers, *Working Effectively with Legacy Code*
- [ECMAScript: semantica della classe e degli elementi privati](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-class-definitions)
