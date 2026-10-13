---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - sicurezza
  - xss
aliases: []
prerequisites: []
related: []
title: Sanitizzazione input
---

# Sanitizzazione input

## Sintesi

Non esiste una funzione che renda un dato sicuro in ogni contesto. **Validazione**, **normalizzazione**, **encoding** e **sanitizzazione HTML** risolvono problemi diversi.

Per mostrare testo, crea nodi e usa `textContent`. Solo quando e necessario conservare markup non fidato usa un sanitizer mantenuto, con una allowlist adatta alla destinazione. Questa nota usa DOMPurify per un piccolo sottoinsieme HTML.

## Quando usarlo

- Commenti, chat, profili e dati API mostrati nella pagina.
- Anteprime di Markdown convertito in HTML.
- Contenuti rich text che devono conservare una formattazione limitata.
- Query string e link costruiti da dati esterni, con regole specifiche per le URL.

I dati del database non sono automaticamente fidati: potrebbero essere stati inseriti da altri utenti o da vecchie versioni del software.

## Come funziona

### Operazioni da non confondere

| Operazione | Scopo | Non garantisce |
| --- | --- | --- |
| Validazione | Accettare soltanto tipi, dimensioni e valori previsti | Sicurezza in qualsiasi sink |
| Normalizzazione | Portare dati in una forma canonica prevista dal dominio | Eliminazione di XSS |
| Encoding contestuale | Rappresentare un valore nel contesto di destinazione | Validita o autorizzazione del valore |
| Sanitizzazione HTML | Conservare un sottoinsieme di markup e rimuovere il resto | Sicurezza SQL, shell o qualunque template |
| CSP | Limitare esecuzione e caricamenti nel browser | Correzione dell'HTML e autorizzazione server |

La validazione lato client aiuta la UI; il server deve ripeterla sui dati ricevuti. Non applicare trim, decodifiche o normalizzazioni indiscriminate a password, firme o identificatori opachi.

### Il punto di interpretazione conta

Una template literal produce una **stringa**, non esegue HTML. Il problema nasce quando quella stringa finisce in `innerHTML`, `insertAdjacentHTML`, `document.write` o un altro sink che la interpreta.

Inoltre, "non esegue un tag script" non significa "sicuro": attributi evento, URL attive e altre costruzioni possono essere pericolose. Togliere soltanto `<script>` con una regex non e una sanitizzazione HTML. [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

## API / Sintassi

### Testo e query string

Esempi browser indipendenti. Contratto: stringhe di massimo 20.000 unita UTF-16 per il commento, 200 per la ricerca; non sono conteggi di caratteri percepiti o byte HTTP.

```js
export function renderCommentText(body) {
  if (typeof body !== "string") throw new TypeError("Testo richiesto");
  if (body.length > 20_000) throw new RangeError("Commento troppo lungo");

  const item = document.createElement("li");
  item.textContent = body;
  return item;
}

export function searchUrl(query, origin = window.location.origin) {
  if (typeof query !== "string") throw new TypeError("Query richiesta");
  if (query.length > 200) throw new RangeError("Query troppo lunga");

  // origin e configurazione fidata, non una destinazione scelta dall'utente.
  const url = new URL("/search", origin);
  url.searchParams.set("q", query);
  return url;
}
```

`textContent` mostra anche `<img>` come testo dentro il normale elemento lista: non usare questo ragionamento per costruire contenuto di tag script/style. Non fare prima escape HTML, altrimenti mostrerai le entita letteralmente. [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).

`URLSearchParams` codifica il valore del parametro, preservando caratteri come `&` e `+` come dati. Non passargli valori gia codificati con `encodeURIComponent`, per evitare doppia codifica. Non sceglie un protocollo sicuro e non autorizza destinazioni: `new URL("javascript:...")` puo riuscire. [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

Per link usa `createElement("a")`, una URL validata e `textContent` per la label. La sola assegnazione a `href` non e una validazione: vedi la funzione `helpUrl` nella nota [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]], che controlla protocollo HTTPS, origine e credenziali.

## Esempio pratico

### Commenti con formattazione limitata

DOMPurify **3.4.16**, verificato il 2026-10-08. La versione rende riproducibile l'esempio; va aggiornata dopo verifica degli aggiornamenti di sicurezza, non congelata per sempre.

In una directory dimostrativa separata dal vault:

```sh
npm install --save-exact --ignore-scripts dompurify@3.4.16
```

File `rich-comment.js`, modulo browser:

```js
import createDOMPurify from "./node_modules/dompurify/dist/purify.es.mjs";

const purifier = createDOMPurify(window);

export function renderRichComment(target, html) {
  if (!(target instanceof HTMLDivElement)) {
    throw new TypeError("Serve un div HTML dello stesso documento/realm");
  }
  if (target.ownerDocument !== document) {
    throw new TypeError("Documento di destinazione non valido");
  }
  if (typeof html !== "string") throw new TypeError("HTML richiesto");
  if (html.length > 20_000) throw new RangeError("Commento troppo lungo");
  if (!purifier.isSupported) throw new Error("Sanitizer non supportato");

  const fragment = purifier.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "code"],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  });
  target.replaceChildren(fragment);
}
```

La destinazione e un normale div HTML, non un template o un contesto SVG. L'istanza dedicata evita di condividere configurazioni e hook con altre parti dell'app. L'input invalido viene rifiutato prima di modificare il contenuto.

La policy scelta permette soltanto otto tag senza attributi: niente link, immagini, stili, form, SVG, MathML o custom element. Non e la policy predefinita di DOMPurify. Non aggiungere `USE_PROFILES` a questa configurazione: sovrascriverebbe `ALLOWED_TAGS`.

File `index.html`:

```html
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Commento HTML limitato</title>
</head>
<body>
  <div id="comment"></div>
  <script type="module">
    import { renderRichComment } from "./rich-comment.js";

    const dirty = '<p>Ciao <strong>mondo</strong>' +
      '<img src=x onerror="globalThis.unexpected = true"></p>';
    renderRichComment(document.getElementById("comment"), dirty);
  </script>
</body>
</html>
```

Servi la directory via HTTP, non `file://`. Con Python 3 disponibile e porta 8091 libera:

```sh
python -m http.server 8091 --bind 127.0.0.1
```

Apri `http://127.0.0.1:8091/`: rimane il testo con "mondo" in grassetto; non deve esserci alcun elemento img. Il payload dimostrativo e locale e non invia dati a servizi esterni.

Per un'app con bundler, usa l'import dal pacchetto `dompurify`; non pubblicare l'intera directory node_modules. Se abiliti CSP, autorizza il modulo e lo script iniziale oppure sposta quest'ultimo in un file consentito. La demo non configura CSP: deve essere il sanitizer a rimuovere il markup escluso, senza nascondere un errore dietro un blocco CSP.

### Dopo la sanitizzazione

Inserisci direttamente il frammento. Non concatenare di nuovo HTML non fidato, non aggiungere attributi evento e non passare il risultato a un motore di template che lo reinterpreta. Un contenuto valido per questo div non diventa sicuro dentro JavaScript, CSS, URL o SQL.

Per Markdown: conversione in HTML, poi sanitizzazione del risultato, poi rendering. Un parser Markdown non equivale automaticamente a un sanitizer. Se conservi HTML sanitizzato, considera anche la versione della policy e la necessita di rielaborare i contenuti dopo correzioni.

## Varianti

### Server, SQL e shell

Lato server servono ancora schema, limiti di dimensione, autorizzazioni e regole di dominio. Per HTML server-side usa un sanitizer supportato nell'ambiente; DOMPurify su Node richiede un DOM compatibile e mantenuto, non il solo pacchetto.

Per SQL usa query parametrizzate; per processi esterni preferisci argomenti separati senza shell, con allowlist delle operazioni. L'escape HTML non sostituisce queste difese. Anche JSON correttamente parsato resta un dato non fidato se poi finisce in un sink HTML.

### Trusted Types

Trusted Types puo obbligare il passaggio attraverso policy nei sink supportati, ma non decide se la trasformazione e sicura. DOMPurify supporta questa integrazione: occorre coordinare i nomi permessi dalla CSP e la sua policy interna `dompurify`.

Restituire un DocumentFragment evita un'assegnazione applicativa a `innerHTML`, ma non elimina i requisiti Trusted Types dei parser interni della libreria. La demo non abilita enforcement; non copiare policy identita o disabilitare controlli per aggirare un errore.

## Errori comuni

- Usare una regex per "togliere tutti i tag pericolosi".
- Accettare qualsiasi URL perche il costruttore URL non lancia errori.
- Pensare che `setAttribute` renda sicuri nomi/valori arbitrari, compresi `onclick` e `href`.
- Fare escape prima di `textContent` o codificare due volte una query.
- Sanitizzare prima di una trasformazione che aggiunge nuovo HTML non fidato.
- Usare `DOMPurify.removed` come decisione di autorizzazione.
- Affidarsi solo alla validazione frontend o a una versione vecchia del sanitizer.

## Checklist

- Identifica sorgente del dato, contratto e sink finale.
- Per testo evita del tutto il parsing HTML.
- Per rich text limita tag/attributi a quelli realmente necessari.
- Mantieni sanitizer e, se presente, implementazione DOM server aggiornati.
- Prova input validi, esclusi, malformati, vuoti e troppo lunghi.
- Verifica il DOM risultante, non soltanto l'assenza di alert.
- Applica separatamente CSP, validazione server e autorizzazione.
- Non estendere il risultato dei test a tutti i possibili bypass XSS.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]

## Fonti

- [DOMPurify 3.4.16: README e configurazione](https://github.com/cure53/DOMPurify/blob/3.4.16/README.md).
- [DOMPurify: release 3.4.16](https://github.com/cure53/DOMPurify/releases/tag/3.4.16).
- [OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
- [MDN: textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).
- [MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
