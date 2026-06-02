---
date: 2026-06-02
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

## Quando usarlo

### Quando serve
- Rendering di contenuto generato da utenti.
- Markdown convertito in HTML.
- Commenti, chat, form, profili.
- Dati provenienti da API esterne.
- Parametri usati per costruire URL, attributi o markup.

La sanitizzazione serve quando devi mantenere una parte del contenuto, ma rimuovere cio che e pericoloso. Se invece ti serve solo mostrare testo, preferisci API sicure come `textContent`.

## Come funziona

### Concetto chiave
Nel frontend il rischio principale e trattare stringhe utente come HTML eseguibile. Quando possibile, e meglio usare API testuali come `textContent` invece di `innerHTML`.

```javascript
const label = document.querySelector("#label");
label.textContent = userInput;
```
### Strategie
- Preferire escaping contestuale.
- Evitare `innerHTML` quando non serve.
- Usare sanitizer affidabili per HTML consentito.
- Validare dati lato client e lato server.

## API / Sintassi

Per testo semplice:

```javascript
element.textContent = userInput;
```

Per URL e query string:

```javascript
const url = new URL("/search", window.location.origin);
url.searchParams.set("q", userInput);
```

Per attributi, usa API DOM invece di concatenare stringhe HTML:

```javascript
const link = document.createElement("a");
link.href = safeUrl;
link.textContent = label;
```

Per HTML ricco non basta fare replace manuali: serve una allowlist gestita da una libreria affidabile o da una pipeline controllata lato server.

## Esempio pratico

Caso sicuro per mostrare un commento come testo:

```javascript
function renderComment(comment) {
  const item = document.createElement("li");
  item.textContent = comment.body;
  return item;
}
```

Caso rischioso:

```javascript
function renderComment(comment) {
  return `<li>${comment.body}</li>`;
}
```

Il secondo esempio trasforma una stringa in HTML. Se `comment.body` contiene markup malevolo, il browser potrebbe interpretarlo.

## Varianti

- **Escaping HTML**: converte caratteri speciali in entita.
- **Sanitizzazione HTML**: rimuove tag e attributi pericolosi.
- **Validazione schema**: controlla forma e tipi del dato.
- **Encoding URL**: usa `encodeURIComponent`, `URL` o `URLSearchParams`.
- **Content Security Policy**: limita l'esecuzione anche se qualcosa sfugge.

## Errori comuni

### Errore comune
```javascript
container.innerHTML = userInput;
```

Questo permette di interpretare input non fidato come markup. Se l'HTML e necessario, va filtrato con una allowlist.

## Checklist

- Identifica il contesto: HTML, attributo, URL, JSON, SQL o shell.
- Valida input lato server.
- Usa `textContent` quando devi solo mostrare testo.
- Evita `innerHTML` con dati non fidati.
- Sanitizza HTML ricco con allowlist.
- Aggiungi CSP come difesa aggiuntiva.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
