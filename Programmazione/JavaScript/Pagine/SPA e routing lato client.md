---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - frontend
  - routing
aliases: []
prerequisites: []
related: []
---

# SPA e routing lato client

## Sintesi

Una **SPA** (Single Page Application) carica una pagina HTML principale e aggiorna l'interfaccia via JavaScript. Il **routing lato client** cambia vista senza richiedere al server una nuova pagina completa.

## Quando usarlo

Usa una SPA quando l'applicazione richiede molta interazione client-side e transizioni rapide tra viste senza ricaricare l'intera pagina.

E adatta per:

- dashboard;
- strumenti interni;
- editor;
- applicazioni con stato UI complesso;
- prodotti dove l'utente resta a lungo nella stessa sessione.

Per contenuti editoriali, pagine marketing o documentazione, una SPA pura puo essere eccessiva: SSR o SSG spesso sono piu semplici e piu adatti.

## Come funziona

### Concetto chiave
Il browser mantiene l'URL, ma JavaScript decide quale componente o vista mostrare.

```javascript
window.history.pushState({}, "", "/settings");
```
### Routing lato client
Le API principali sono:

- `history.pushState`;
- `history.replaceState`;
- evento `popstate`;
- hash routing con `location.hash`.
### Vantaggi
- Navigazione fluida.
- Stato client ricco.
- Transizioni rapide tra viste gia caricate.

## API / Sintassi

Le API browser usate nel routing client-side sono principalmente History API e Location API.

```javascript
history.pushState({ page: "settings" }, "", "/settings");

window.addEventListener("popstate", (event) => {
  renderRoute(location.pathname, event.state);
});
```

Per intercettare click su link interni:

```javascript
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (!link || link.origin !== location.origin) {
    return;
  }

  event.preventDefault();
  history.pushState({}, "", link.href);
  renderRoute(location.pathname);
});
```

## Esempio pratico

Router minimale:

```javascript
const routes = {
  "/": () => "<h1>Home</h1>",
  "/settings": () => "<h1>Impostazioni</h1>",
};

function renderRoute(pathname) {
  const render = routes[pathname] ?? (() => "<h1>404</h1>");
  document.querySelector("#app").innerHTML = render();
}

window.addEventListener("popstate", () => {
  renderRoute(location.pathname);
});

renderRoute(location.pathname);
```

Un router reale aggiunge parametri, nested routes, loader dati, redirect e gestione degli errori.

## Varianti

### Limiti
- Serve configurare fallback server verso `index.html`.
- SEO e performance iniziale possono richiedere SSR o prerendering.
- Gestire loading, errori e permessi diventa responsabilita dell'app.

## Errori comuni

- Non configurare il server per restituire `index.html` sulle route client-side.
- Rompere il comportamento normale dei link, come apertura in nuova scheda.
- Non gestire stato, scroll e focus dopo la navigazione.
- Caricare tutto il codice dell'app nel bundle iniziale.
- Trascurare SEO, metadata e performance del primo caricamento.

## Checklist

- Configura fallback server verso `index.html`.
- Usa code splitting per route pesanti.
- Mantieni URL leggibili e condivisibili.
- Gestisci `popstate`, 404 e redirect.
- Aggiorna titolo, metadata essenziali e focus dopo la navigazione.
- Misura bundle iniziale e tempi di caricamento.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/BOM|BOM]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]]
