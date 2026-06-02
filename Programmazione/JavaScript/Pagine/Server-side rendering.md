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
  - ssr
  - frontend
aliases: []
prerequisites: []
related: []
---

# Server-side rendering

## Sintesi

Il **server-side rendering** (SSR) genera HTML sul server prima di inviarlo al browser. JavaScript sul client puo poi rendere la pagina interattiva tramite hydration.

## Quando usarlo

Usa SSR quando il primo caricamento deve mostrare contenuto utile rapidamente, quando la pagina deve essere indicizzabile dai motori di ricerca o quando i metadata social devono essere generati in base al contenuto.

Esempi tipici:

- pagine prodotto;
- blog e documentazione;
- dashboard con shell iniziale server-rendered;
- applicazioni dove il contenuto iniziale dipende da dati utente o route dinamiche.

Evitalo se l'applicazione e quasi tutta interazione client-side, se SEO non conta o se la complessita operativa del server non porta benefici concreti.

## Come funziona

### Concetto chiave
In una SPA pura il browser riceve poco HTML e costruisce l'interfaccia lato client. Con SSR il server invia gia markup significativo.
### Vantaggi
- Primo contenuto visibile piu rapido in molti scenari.
- Migliore supporto SEO.
- Condivisione piu semplice di anteprime e metadata.
- Possibilita di combinare rendering server e client.
### Costi
- Architettura piu complessa.
- Doppio ambiente: server e browser.
- Problemi di hydration se HTML server e client divergono.
- Caching piu importante.
### Concetti collegati
- Hydration.
- Static Site Generation.
- Streaming SSR.
- Server Components.
- Edge rendering.

## API / Sintassi

In JavaScript puro non esiste una singola API SSR: il rendering server-side dipende dal framework. Il pattern comune e:

1. ricevere una richiesta HTTP;
2. caricare i dati necessari;
3. generare HTML sul server;
4. inviare HTML e asset JavaScript;
5. fare hydration nel browser.

Schema semplificato:

```javascript
app.get("/users/:id", async (req, res) => {
  const user = await loadUser(req.params.id);

  const html = renderPage({
    title: user.name,
    body: `<h1>${escapeHtml(user.name)}</h1>`,
  });

  res.send(html);
});
```

Nei framework moderni questa logica e nascosta dietro route, loader, server components o funzioni dedicate al rendering.

## Esempio pratico

Esempio minimale con HTML generato lato server:

```javascript
function renderHtml({ title, content }) {
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body>
    <main>${content}</main>
    <script type="module" src="/app.js"></script>
  </body>
</html>`;
}
```

Il server restituisce gia markup leggibile. Il file `/app.js` puo poi collegare listener, stato e interazioni client-side.

## Varianti

- **SSR classico**: ogni richiesta genera HTML sul server.
- **SSG**: HTML generato in fase di build.
- **ISR / revalidation**: pagine statiche aggiornate periodicamente o su richiesta.
- **Streaming SSR**: il server invia parti della pagina appena pronte.
- **Edge rendering**: rendering vicino all'utente, spesso con runtime limitati.
- **Hydration parziale**: solo alcune isole interattive vengono idratate.

## Errori comuni

- Usare API browser-only, come `window` o `document`, durante il rendering server.
- Generare HTML diverso tra server e client causando hydration mismatch.
- Non gestire cache e invalidazione dei dati.
- Spostare troppa logica sul server peggiorando latenza e complessita.
- Dimenticare sanitizzazione ed escaping quando si inseriscono dati dentro HTML.

## Checklist

- Verifica che SSR dia un beneficio reale su SEO, primo render o metadata.
- Separa codice eseguibile su server da codice solo browser.
- Gestisci loading, errori e cache dei dati.
- Controlla che HTML server e client producano lo stesso risultato.
- Misura TTFB, FCP e dimensione del JavaScript idratato.
- Fai escaping dei dati inseriti nel markup.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]
