---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - sicurezza
  - xss
aliases: []
prerequisites: []
related: []
---

# Sanitizzazione input

## Sintesi

La **sanitizzazione dell'input** consiste nel pulire o normalizzare dati non fidati prima di inserirli in HTML, query, attributi o API sensibili.

## Concetto chiave

Nel frontend il rischio principale e trattare stringhe utente come HTML eseguibile. Quando possibile, e meglio usare API testuali come `textContent` invece di `innerHTML`.

```javascript
const label = document.querySelector("#label");
label.textContent = userInput;
```

## Quando serve

- Rendering di contenuto generato da utenti.
- Markdown convertito in HTML.
- Commenti, chat, form, profili.
- Dati provenienti da API esterne.

## Strategie

- Preferire escaping contestuale.
- Evitare `innerHTML` quando non serve.
- Usare sanitizer affidabili per HTML consentito.
- Validare dati lato client e lato server.

## Errore comune

```javascript
container.innerHTML = userInput;
```

Questo permette di interpretare input non fidato come markup. Se l'HTML e necessario, va filtrato con una allowlist.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]


