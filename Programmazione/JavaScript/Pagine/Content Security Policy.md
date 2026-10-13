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
  - browser
aliases: []
prerequisites: []
related: []
title: Content Security Policy
---

# Content Security Policy

## Sintesi

La **Content Security Policy** (CSP) e una policy applicata dal browser alla risposta che la contiene. Limita caricamenti ed esecuzione di codice; non ripulisce HTML, non autentica gli utenti e non sostituisce autorizzazione o protezioni CSRF.

La scelta pratica e: script esterni controllati oppure script autorizzati con **nonce casuali per risposta** o **hash del contenuto**. Aggiungere indiscriminatamente origini, `'unsafe-inline'` e `'unsafe-eval'` riduce la protezione.

## Quando usarlo

- Ridurre l'impatto di XSS in applicazioni e siti.
- Limitare le dipendenze caricabili e le destinazioni delle connessioni.
- Impedire l'incorporamento della pagina in frame non autorizzati.
- Introdurre restrizioni gradualmente, osservandole prima in report-only.

Non basta copiare una policy: serve conoscere asset, API, worker, font, stili e loader effettivamente usati dalla build di produzione.

## Come funziona

### Origini, direttive e fallback

`'self'` indica l'origine della pagina, non "qualsiasi URL dello stesso dominio": schema, host e porta contano. Un'origine consentita puo comunque ospitare file caricati da utenti o codice compromesso.

| Direttiva | Cosa controlla |
| --- | --- |
| `default-src` | Fallback per le direttive di caricamento che non hanno una regola piu specifica |
| `script-src` | Script e compilazione dinamica di JavaScript |
| `style-src` | Fogli CSS e stili inline secondo la policy |
| `img-src`, `font-src` | Immagini e font |
| `connect-src` | Fetch, XHR, WebSocket e altre connessioni |
| `worker-src` | Caricamento di worker; non tutta l'attivita interna del worker |
| `frame-src` | Frame che questa pagina puo caricare |
| `frame-ancestors` | Pagine che possono incorporare questa pagina |
| `object-src` | Risorse incorporate tramite object/embed |
| `base-uri` | URL ammessi per l'elemento base |
| `form-action` | Destinazioni dei form |

`default-src` **non** fornisce un fallback a `base-uri`, `form-action` e `frame-ancestors`: dichiarali separatamente. Le regole specifiche non si sommano al fallback: con `default-src 'self'; img-src https://images.example.com`, le immagini same-origin non sono consentite da `default-src`.

Le direttive `script-src-elem` e `script-src-attr`, se presenti, distinguono elementi script e attributi evento; altrimenti ricadono su `script-src`. Evita regole specifiche che aggirino involontariamente la policy generale. [Riferimento CSP](https://www.w3.org/TR/CSP3/#directive-default-src).

### Header, meta e policy multiple

Preferisci l'header HTTP sulla **risposta HTML**, non soltanto sull'API JSON. Un tag `meta http-equiv="Content-Security-Policy"` nell'head e un'alternativa limitata: opera sui contenuti successivi e non supporta report-only, `frame-ancestors`, `sandbox` e le direttive di reporting.

Piu policy in enforcement si applicano tutte: un secondo header o meta non puo allentare il primo. Report-only, invece, osserva senza introdurre blocchi. [Header CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).

## API / Sintassi

### Policy con risorse esterne locali

Esempio per una pagina che usa soltanto file JS/CSS esterni e asset locali:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self' https://api.example.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

Blocca script inline, attributi come `onclick` e stili inline. Sposta gli eventi in `addEventListener`, non aggiungere `'unsafe-inline'` per far scomparire un errore. L'API deve comunque soddisfare CORS: `connect-src` non le concede il permesso di rendere leggibile una risposta cross-origin.

### Nonce, hash e strict CSP

- **Nonce:** valore casuale crittografico, imprevedibile e nuovo per ogni risposta HTML, con almeno 128 bit prima della codifica. Lo stesso valore compare nella policy e negli elementi autorizzati di quella risposta. Non usare timestamp, contatori o un nonce fisso nel repository.
- **Hash:** digest SHA-256/384/512 del testo esatto dello script inline, senza i tag. Spazi, newline e maiuscole contano; una build che cambia il codice deve aggiornare l'hash. Adatto a contenuti statici.
- **Strict CSP:** autorizza gli script iniziali tramite nonce/hash; con `'strict-dynamic'` estende la fiducia agli script caricati dinamicamente da quelli autorizzati.

Con `'strict-dynamic'`, nei browser CSP3 le allowlist di host/schemi, `'self'` e `'unsafe-inline'` della direttiva non sono il filtro degli script. Il loader autorizzato deve quindi impedire che input utente scelga arbitrariamente la URL di uno script. Un nonce non rende sicuro il codice che autorizza.

Un nonce su un tag script non autorizza gli attributi evento. Evita anche `eval`, `new Function` e timer con stringhe: richiedono concessioni separate. Per Wasm valuta `'wasm-unsafe-eval'`, non automaticamente `'unsafe-eval'`. [Script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).

## Esempio pratico

### Risposta completa con nonce o hash

Node.js con moduli ESM, nessun pacchetto esterno. File `csp-page.mjs`:

```js
import { createHash, randomBytes } from "node:crypto";

export const inlineCode =
  'document.getElementById("result").textContent = "Script autorizzato";';

export function createCspResponse(mode = "nonce") {
  if (mode !== "nonce" && mode !== "hash") {
    throw new TypeError("Modalita CSP non valida");
  }

  const nonce = mode === "nonce" ? randomBytes(16).toString("base64") : null;
  const source = nonce
    ? `'nonce-${nonce}'`
    : `'sha256-${createHash("sha256").update(inlineCode, "utf8").digest("base64")}'`;
  const policy = [
    "default-src 'none'",
    `script-src ${source}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": policy,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    body: `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Demo CSP</title></head>
<body>
<p id="result">Script non eseguito</p>
<script${nonce ? ` nonce="${nonce}"` : ""}>${inlineCode}</script>
<!-- Controesempio intenzionale: deve essere bloccato dalla CSP. -->
<script>globalThis.blockedInline = true;</script>
</body>
</html>`,
  };
}
```

L'unica interpolazione variabile nel markup e il nonce generato internamente; il codice e una costante. **Non inserire dati utente nel corpo dello script autorizzato**.

File separato `server.mjs`:

```js
import { createServer } from "node:http";
import { createCspResponse } from "./csp-page.mjs";

const server = createServer((req, res) => {
  req.resume();
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end();
    return;
  }
  const mode = req.url === "/nonce" ? "nonce" : req.url === "/hash" ? "hash" : null;
  if (!mode) {
    res.writeHead(404);
    res.end();
    return;
  }
  const { headers, body } = createCspResponse(mode);
  res.writeHead(200, headers);
  res.end(body);
});

server.listen(8090, "127.0.0.1", () => {
  console.log("http://127.0.0.1:8090/nonce");
});
```

Avvio dalla directory dei due file, con porta 8090 libera:

```sh
node server.mjs
```

Apri `/nonce` oppure `/hash`: deve comparire "Script autorizzato". In Console, `globalThis.blockedInline` deve essere `undefined`; una violazione CSP per il secondo script e **attesa**. Ricaricando `/nonce` l'header cambia, mentre l'hash di `/hash` resta stabile.

La demo e locale, non un server di produzione. Non configura TLS, autenticazione o raccolta report. `no-store` evita di riutilizzare la risposta con nonce: con cache/CDN serve una strategia che mantenga coerenti header e HTML e rigeneri il nonce. Per un sito statico considera hash calcolati nella build, non nonce scritti una volta.

### Report-only con endpoint dichiarato

Configurazione HTTP illustrativa; le route di raccolta devono essere implementate sul proprio server:

```http
Reporting-Endpoints: csp="https://reports.example.com/csp"
Content-Security-Policy-Report-Only: default-src 'self'; object-src 'none'; base-uri 'none'; report-to csp; report-uri /csp-legacy
```

`report-to` contiene un **nome**, risolto da `Reporting-Endpoints`; non basta inventare il nome dell'endpoint. `report-uri` e un fallback deprecato per client meno recenti; quelli che supportano `report-to` lo ignorano. I due formati di report sono diversi.

La consegna puo essere ritardata o mancare. Tratta i report come input non fidati: limita dimensione/frequenza, valida il formato, evita segreti nelle URL e renderizza i campi come testo. Non usare i report come prova di autorizzazione. Verifica sia Console/Network sia il percorso di raccolta. [Reporting CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to).

## Varianti

### Trusted Types

`require-trusted-types-for 'script'` richiede valori tipizzati per determinati sink DOM nei browser compatibili; `trusted-types` limita i nomi delle policy creabili. Non sono un sanitizer: una policy che restituisce l'input invariato puo reintrodurre il problema.

L'integrazione con librerie HTML richiede una policy compatibile e test dedicati. La demo precedente non abilita Trusted Types. Verifica il supporto dei browser destinatari, non affidarti alla sola assenza di errori in un browser. [Guida CSP e Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP#requiring_trusted_types).

### CSS, worker e build

Un nonce CSS va autorizzato in `style-src`; quello di `script-src` non basta. Le URL WebSocket necessarie vanno previste in `connect-src`. La CSP del documento controlla il caricamento dei worker; per le restrizioni all'interno di un worker HTTP va considerata anche la risposta del suo script.

Prova la build di produzione: strumenti di sviluppo, loader e script generati possono avere requisiti diversi. Gli esempi di questa nota non modificano la CSP del sito Quartz.

## Errori comuni

- Autorizzare ogni CDN, `https:` o `data:` senza distinguere il tipo di risorsa.
- Credere che `'self'` impedisca ogni XSS o che CSP corregga HTML pericoloso.
- Riutilizzare nonce, attribuirli automaticamente anche a tag iniettati o cambiare solo header/solo HTML.
- Confondere hash CSP di script inline con `integrity`: SRI verifica risorse esterne; la loro autorizzazione tramite hash CSP richiede anche i metadati appropriati.
- Lasciare soltanto report-only pensando di avere gia il blocco.
- Aggiungere un meta permissivo per annullare un header restrittivo.
- Testare CSP con `file://` invece che con le reali risposte HTTP.

## Checklist

- Inventaria le risorse e separa regole per script, stili, connessioni e frame.
- Definisci esplicitamente base-uri, form-action e frame-ancestors.
- Usa nonce per risposte dinamiche o hash rigenerati per script statici.
- Verifica il caso consentito e quello bloccato, non solo il caricamento della pagina.
- Osserva in report-only, correggi le dipendenze e passa all'enforcement.
- Controlla cache, proxy, CSP multiple e browser destinatari.
- Mantieni validazione, rendering sicuro e controlli server indipendenti.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/WebAssembly interop|WebAssembly interop]]

## Fonti

Verifica tecnica: 2026-10-08. Esempi Node e browser collaudati separatamente dai controlli Quartz.

- [W3C CSP3: nonce e considerazioni di sicurezza](https://www.w3.org/TR/CSP3/#security-considerations).
- [MDN: guida CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
- [MDN: script-src, nonce, hash e strict-dynamic](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).
- [MDN: report-to](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
