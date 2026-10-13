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
  - frontend
  - routing
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/BOM|BOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Vite|Vite]]"
  - "[[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]]"
title: SPA e routing lato client
---

# SPA e routing lato client

## Sintesi

Una **Single Page Application** mantiene un documento attivo e aggiorna le viste con JavaScript durante le navigazioni interne. Il **routing lato client** associa URL a viste senza richiedere ogni volta un nuovo documento HTML.

SPA non significa un solo file JavaScript, assenza di backend o obbligo di rendering esclusivamente client. Una pagina inizialmente renderizzata sul server puo continuare con navigazione client-side. Qui il demo e intenzionalmente solo client.

## Quando usarlo

- Dashboard, editor e strumenti interni con interazioni frequenti e stato locale.
- Applicazioni in cui conservare la shell e caricare viste separatamente e utile.
- Interfacce che devono rendere condivisibili filtri, selezioni e pagine.

Per documentazione o contenuti prevalentemente statici, valuta pagine HTML generate o rendering server: la SPA non rende automaticamente piu veloce il primo caricamento. Misura costo JavaScript, caricamento dati e accessibilita.

## Come funziona

### URL, vista e cronologia

L'URL e lo stato navigabile; il router lo interpreta e aggiorna il contenuto. Percorso, query e frammento hanno ruoli distinti: per esempio `/demo/settings?tab=privacy#details`.

| Operazione | Effetto |
| --- | --- |
| `pushState(state, "", url)` | Aggiunge una voce senza caricare il documento |
| `replaceState(state, "", url)` | Modifica la voce corrente senza aggiungerne una |
| `popstate` | Notifica attraversamenti della cronologia nello stesso documento |
| `location.assign(url)` | Avvia una navigazione normale |
| Frammento `#...` | Puo indicare un'ancora nativa o uno stato interpretato da un hash router |

**pushState e replaceState non emettono popstate**: dopo una navigazione programmata devi aggiornare la vista. Indietro/Avanti richiedono invece un listener. Non chiamare pushState da quel listener, altrimenti aggiungi nuove voci mentre tenti di tornare indietro.

Il parametro URL deve rispettare i vincoli di origine della History API. Lo stato deve essere serializzabile e piccolo; puo essere `null`. Non usarlo come database, segreto o unica fonte dei dati necessari ad aprire un link in una scheda nuova.

### Due livelli di routing

1. Il server decide cosa inviare quando il browser chiede direttamente un URL.
2. Dopo l'avvio, il router client decide quale vista rendere.

Il click interno puo funzionare anche se il refresh di `/demo/settings` restituisce 404. Il server non ha eseguito il router JavaScript: deve servire una pagina esistente oppure un fallback configurato per le route dell'app.

Il fallback e una **riscrittura verso la shell**, non necessariamente un redirect verso la home. Conserva l'URL richiesto. Non trasformare errori di `/api/` o asset mancanti in HTML con status 200: nasconderesti errori reali e causeresti problemi di parsing/MIME.

## API / Sintassi

Una navigazione minimale, valida soltanto dentro un'app che possiede quella URL:

```js
history.pushState(null, "", "/demo/settings?tab=privacy");
// Questa chiamata non rende una vista e non scatena popstate.
```

Il demo sotto aggiunge rendering, filtro dei click e cleanup. Non e un router riutilizzabile da inserire accanto a React Router o a un altro gestore della History API.

## Esempio pratico

### Progetto autonomo

Demo **Vite 8.3.4**, provato con Node.js 24.14.0 e Chrome. Crea una directory separata `routing-demo/`, con questi file:

```text
routing-demo/
  src/
    router.js
    main.js
  .gitignore
  index.html
  package.json
  vite.config.js
```

`package.json`:

```json
{
  "name": "routing-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5175 --strictPort",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1 --port 4175 --strictPort"
  },
  "devDependencies": {
    "vite": "8.3.4"
  }
}
```

`vite.config.js`:

```js
import { defineConfig } from "vite";

export default defineConfig({
  base: "/demo/",
  appType: "spa",
});
```

La base degli asset, i link HTML e il router concordano su `/demo/`. Cambiarne soltanto uno rompe il contratto. Il fallback di sviluppo/preview non configura automaticamente l'hosting remoto.

`.gitignore`:

```text
node_modules/
dist/
```

`index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Demo routing</title>
  </head>
  <body>
    <nav id="navigation" aria-label="Principale">
      <a data-route href="/demo/">Home</a>
      <a data-route href="/demo/settings?tab=privacy">Impostazioni</a>
      <a data-route href="/demo/missing">Pagina mancante</a>
      <a href="#details">Dettagli della vista</a>
    </nav>
    <main id="app"></main>
    <noscript>Per questo demo serve JavaScript.</noscript>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### Router

`src/router.js`:

```js
const BASE = "/demo/";
const routes = new Map([
  [BASE, { title: "Home", text: "Pagina iniziale" }],
  [BASE + "settings", { title: "Impostazioni", text: "Preferenze" }],
]);

export function mountRouter(root, nav) {
  if (!(root instanceof HTMLElement) || !(nav instanceof HTMLElement)) {
    throw new TypeError("Servono root e nav dello stesso documento");
  }

  let renderedKey = null;

  function render(reason) {
    const url = new URL(location.href);
    const key = url.pathname + url.search;
    // I soli cambi di ancora restano affidati al browser.
    if (reason === "pop" && key === renderedKey) return;
    renderedKey = key;

    const route = routes.get(url.pathname);
    const title = route?.title ?? "Pagina non trovata";
    const heading = document.createElement("h1");
    heading.id = "view-title";
    heading.tabIndex = -1;
    heading.textContent = title;

    const text = document.createElement("p");
    if (url.pathname === BASE + "settings") {
      const tab = url.searchParams.get("tab") === "privacy" ? "privacy" : "general";
      text.textContent = "Preferenze: " + tab;
    } else {
      text.textContent = route?.text ?? "Nessuna vista per " + url.pathname;
    }

    const details = document.createElement("h2");
    details.id = "details";
    details.textContent = "Dettagli";
    root.replaceChildren(heading, text, details);
    document.title = title + " | Demo routing";

    for (const link of nav.querySelectorAll("a[data-route]")) {
      const target = new URL(link.href);
      if (route && target.pathname === url.pathname) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    if (reason !== "load") heading.focus({ preventScroll: true });
    if (reason === "push") window.scrollTo({ top: 0, behavior: "instant" });
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[data-route]");
    if (!(link instanceof HTMLAnchorElement) || !nav.contains(link) ||
        !link.hasAttribute("href") || link.hasAttribute("download") ||
        (link.target && link.target.toLowerCase() !== "_self") ||
        link.relList.contains("external")) return;

    const url = new URL(link.href);
    if (url.origin !== location.origin || url.username || url.password ||
        !url.pathname.startsWith(BASE) || url.href.includes("#")) return;

    if (url.href === location.href) {
      event.preventDefault();
      return;
    }
    try {
      history.pushState(null, "", url);
    } catch {
      return; // Lascia possibile la navigazione normale del link.
    }
    event.preventDefault();
    render("push");
  }

  const onPopState = () => render("pop");
  render("load");
  nav.addEventListener("click", onClick);
  window.addEventListener("popstate", onPopState);

  return function unmount() {
    nav.removeEventListener("click", onClick);
    window.removeEventListener("popstate", onPopState);
  };
}
```

Contratto: una sola istanza, elementi fidati dello stesso documento, nessun altro router e nessun elemento `base` che imposti un target predefinito. Le route sono esatte: `/demo/settings/` e diversa da `/demo/settings`. Il demo non implementa parametri dinamici o normalizzazioni arbitrarie.

Solo link esplicitamente marcati e senza frammento sono intercettati. Link esterni, download, nuove schede, click modificati e ancore restano nativi. Un link a un'altra route **con frammento** provoca quindi una navigazione completa e richiede il fallback server.

Si usa una Map per evitare corrispondenze accidentali con proprieta ereditate come `constructor`; il testo non fidato non viene inserito con innerHTML. La pagina non trovata e una vista: JavaScript non cambia retroattivamente lo status HTTP del documento gia ricevuto.

L'URL basta a ricostruire queste due viste anche quando history.state e null. Un'app che dipende da stato aggiuntivo deve definirne serializzazione e ripristino. Allo smontaggio vengono rimossi i listener, non ripristinati DOM e titolo precedenti.

`src/main.js`:

```js
import { mountRouter } from "./router.js";

const unmount = mountRouter(
  document.querySelector("#app"),
  document.querySelector("#navigation"),
);

if (import.meta.hot) import.meta.hot.dispose(unmount);
```

### Avvio e prove manuali

Dalla root del demo, installazione iniziale:

```powershell
npm install
```

Conserva il lockfile; usa `npm ci` per installazioni successive riproducibili.

```powershell
npm run dev
```

Apri `http://127.0.0.1:5175/demo/`. Verifica Home, Impostazioni, Indietro, Avanti e link alla pagina mancante. Controlla URL, titolo, focus sull'H1 e aria-current. Ctrl/Cmd-click non deve trasformarsi in navigazione della scheda corrente.

Ferma il dev server con Ctrl+C, quindi costruisci:

```powershell
npm run build
```

La build rigenera e puo svuotare `dist/`: non conservarvi file personali.

```powershell
npm run preview
```

Apri direttamente `http://127.0.0.1:4175/demo/settings?tab=privacy` e ricarica. Il testo atteso e **Preferenze: privacy**. Se una porta e occupata, cambiala esplicitamente. Preview non e un server di produzione.

## Varianti

### History, hash e pagine reali

- **History routing**: URL con percorsi; richiede accordo con il server per accessi diretti.
- **Hash routing**: per esempio `/demo/#/settings`; il frammento non e inviato al server. Il router lo interpreta con hashchange, rinunciando al suo normale uso come ancora in quella sintassi.
- **MPA/SSG**: ogni URL ha un documento; puo comunque esserci JavaScript per interazioni o navigazione migliorata.
- **SSR e hydration**: primo contenuto dal server e successiva interattivita; non sono sinonimi di routing client.

GitHub Pages serve un sito statico: non presume le riscritture del dev server Vite e non esegue il backend dell'app. Per una SPA scegli una strategia compatibile con l'hosting, ad esempio hash routing o documenti generati per le route. Una pagina 404 personalizzata non equivale da sola a una riscrittura con status 200. Il sito Quartz del vault genera gia documenti per le note: questo demo non ne modifica il router.

### Oltre il demo

In un'app reale usa il router mantenuto dal framework/ecosistema e verifica il suo contratto per parametri, route annidate, loader, redirect ed error boundary. Non estendere indefinitamente questo esempio.

- **Dati asincroni**: cancella il caricamento superato e impedisci che una risposta vecchia sostituisca la vista corrente; abort non annulla effetti gia avvenuti sul server.
- **Scroll**: il demo torna in alto sui nuovi click e non forza lo scroll su popstate; lascia scrollRestoration al browser. Con viste asincrone serve ripristinare lo scroll dopo che il contenuto esiste.
- **Focus**: aggiornare titolo e focus aiuta l'orientamento; non costituisce un audit completo di accessibilita.
- **Permessi**: una route guard migliora l'esperienza, non protegge l'API. L'autorizzazione e responsabilita del server.
- **Bundle**: usa import dinamici per viste pesanti, prevedendo loading e fallimenti dei chunk.
- **URL**: filtri e paginazione utili possono stare nella query, ma non credenziali o dati sensibili.

## Errori comuni

- Aggiungere una voce di cronologia senza renderizzare, oppure renderizzare senza ascoltare popstate.
- Intercettare indiscriminatamente ogni elemento a, compresi download e link esterni.
- Credere che il fallback Vite venga trasferito nell'hosting con la build.
- Restituire HTML al posto di un errore API o di un asset 404.
- Trattare history.state come autorizzazione o contenitore persistente.
- Ignorare focus, scroll, refresh, ingresso diretto e navigazione da tastiera.

## Checklist

- Base coerente fra asset, link, router e hosting.
- Ingresso diretto, refresh, Indietro/Avanti e query verificati.
- Semantica nativa dei link preservata.
- Loading, errori, pagina mancante e dati obsoleti gestiti.
- Titolo, focus e scroll controllati con tastiera e tecnologie assistive.
- Fallback limitato alle route, senza nascondere errori API/asset.
- Nessuna protezione affidata soltanto al client.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/BOM|BOM]]
- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]
- [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]]

## Fonti

Documentazione ufficiale consultata il 2026-10-13; demo riferito a Vite 8.3.4.

- [MDN: navigazione con History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API).
- [MDN: pushState, stato e vincoli](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
- [MDN: popstate](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event).
- [MDN: scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration).
- [MDN: aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current).
- [Vite: base e appType](https://vite.dev/config/shared-options).
- [GitHub: natura statica di Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
