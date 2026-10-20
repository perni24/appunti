---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - ssr
  - ssg
  - rendering
aliases:
  - SSR
  - SSG
  - Streaming SSR
  - Hydration
prerequisites:
  - "[[Programmazione/React/Pagine/Server Components|Server Components e progetto di esempio]]"
related:
  - "[[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]"
  - "[[Programmazione/JavaScript/Pagine/Server-side rendering|Rendering server senza framework]]"
title: SSR e SSG
---

# SSR e SSG

## Sintesi

SSR produce HTML sul server per una richiesta; SSG lo prepara in anticipo, normalmente durante la build. Cache e rigenerazione possono evitare di ripetere il render a ogni visita. Sono strategie di distribuzione dell'HTML, non garanzie automatiche di prestazioni o posizionamento nei motori di ricerca.

L'hydration e necessaria quando si vuole far gestire a React nel browser un albero gia renderizzato. **Non e obbligatoria per ogni sito SSR o statico**: una pagina informativa puo usare solo HTML/CSS o progressive enhancement senza React client.

## Quando usarlo

Valuta SSR quando serve un primo HTML legato alla richiesta: dati aggiornati o contenuto personalizzato. Autenticazione e autorizzazione restano requisiti separati. Valuta SSG per documentazione, guide e cataloghi pubblici aggiornabili tramite build.

CSR puo restare adeguato per un'app autenticata con dati caricati tramite API. La scelta dipende anche da TTFB, dimensione del JavaScript, caching, tempi di build e funzionamento senza script. Misura LCP e interattivita: attendere dati lenti sul server puo peggiorare la prima risposta.

## Come funziona

```text
SSR: richiesta -> lettura dati/render -> HTML
SSG: build -> HTML salvato -> server statico/CDN -> browser

Dopo l'HTML, se previsto:
JavaScript + stessi dati iniziali -> hydration -> interazioni React
```

Hydration riutilizza il DOM e collega la logica React; non e la stessa cosa che sostituirlo con un primo `createRoot().render()`. Il primo output client deve concordare con quello server. React non garantisce di riparare qualsiasi differenza, e il recupero puo rifare il render client perdendo i benefici attesi.

RSC e un altro asse: un Server Component puo essere eseguito in build o per richiesta. Nel demo Next si usano RSC insieme a SSR/SSG; React puo fare SSR anche senza RSC, come distinto in [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]].

## API / Sintassi

| API React | Contratto essenziale |
| --- | --- |
| `hydrateRoot` | Riutilizza HTML compatibile; richiede lo stesso stato iniziale |
| `renderToString` | Risultato sincrono, senza streaming; non attende una sospensione |
| `renderToPipeableStream` | Streaming con stream Node e callback per shell/errori |
| `renderToReadableStream` | Streaming con Web Streams, per runtime compatibili |
| `prerender`, `prerenderToNodeStream` | Prerender statico che attende i dati supportati prima di restituire il risultato |
| `renderToStaticMarkup` | HTML non interattivo, non destinato a hydration |

Queste API non forniscono da sole routing, bundling, serializzazione dei dati iniziali, autenticazione o cache. Un framework coordina tali parti; non aggiungere manualmente `hydrateRoot` dentro una pagina Next che lo gestisce gia.

## Esempio pratico

### Rendering per richiesta

Parti dal progetto completo di [[Programmazione/React/Pagine/Server Components|Server Components]], con Next 16.4.1 e React/React DOM 19.3.0. Questa variante richiede un server Next, non un hosting solo statico. Non abilita Cache Components o configurazioni aggiuntive di caching.

Aggiungi `app/live/page.jsx`:

```jsx
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import ProductPanel from "../ProductPanel.jsx";

export default async function LivePage() {
  await connection();
  const requestId = randomUUID();
  const renderedAt = new Date().toISOString();
  return (
    <main>
      <h1>Rendering per richiesta</h1>
      <p>ID render: <code data-render-id>{requestId}</code></p>
      <p>Preparato alle: <time dateTime={renderedAt}>{renderedAt}</time></p>
      <ProductPanel name="Risultato della richiesta">
        <p>Contenuto pubblico preparato sul server.</p>
      </ProductPanel>
    </main>
  );
}
```

`connection()` e un'API Next: esclude dal prerender il lavoro successivo, aspettando una richiesta. `async`, `Date` o un nome "Live" non sono da soli una politica affidabile di rendering. L'ID e un marcatore dimostrativo, non un identificatore di sessione o un token di sicurezza.

Ricostruisci e avvia la produzione con i comandi della nota RSC. Visita `/live`: due nuove richieste di documento producono ID diversi. Il click su Nascondi/Mostra cambia soltanto lo stato client, senza un nuovo render server. L'orario viene prodotto una volta sul server e trasferito come testo, non ricalcolato indipendentemente dal browser.

### Streaming osservabile

Nello stesso progetto server aggiungi `app/stream/page.jsx`:

```jsx
import { Suspense } from "react";
import { setTimeout as delay } from "node:timers/promises";
import { connection } from "next/server";

async function DelayedDetails() {
  await delay(1500);
  return <p>Dettagli completati sul server.</p>;
}

export default async function StreamPage() {
  await connection();
  return (
    <main>
      <h1>Risposta progressiva</h1>
      <p>Questa parte appartiene alla shell.</p>
      <Suspense fallback={<p role="status">Preparazione dettagli...</p>}>
        <DelayedDetails />
      </Suspense>
    </main>
  );
}
```

Il ritardo e solo didattico, per osservare `/stream`; in un'app reale il componente attenderebbe una lettura effettiva. Non e un esempio di cache o di annullamento della query. La shell puo arrivare prima del dettaglio, che sostituisce il fallback quando disponibile.

Una Promise attesa prima di restituire tutto l'albero puo bloccare la shell. Mettere il lavoro che attende sotto un boundary permette al renderer di procedere con il resto. Proxy, compressione e buffering del browser possono comunque ritardare cio che si vede: non promettere un paint immediato o una latenza precisa.

### Esportazione statica alternativa

Usa **una copia del solo progetto base RSC**, senza le route `/live` e `/stream`: richiedono una richiesta e non sono compatibili con questo export. Aggiungi `next.config.mjs`:

```javascript
const nextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
```

```bash
npm run build
```

Next genera `out/`, con HTML e asset distribuibili da un server statico. Non usare `next start` per questa variante. Per una prova locale, se Python 3 e disponibile:

```bash
python -m http.server 4173 --bind 127.0.0.1 --directory out
```

Apri `http://localhost:4173`. La build ha gia eseguito i componenti server del catalogo; i pulsanti continuano a richiedere JavaScript client. Cambiare i dati sorgenti non aggiorna i file esportati: serve una nuova build e distribuzione.

Route dinamiche esportate richiedono percorsi noti in build, per esempio tramite `generateStaticParams`. Funzioni server per richiesta, Server Actions e ISR non sono fornite da un semplice export. Per GitHub Pages sotto `/nome-repo`, configura anche il `basePath` di build; il demo sopra e per la root. Non riutilizzare automaticamente questa configurazione per Quartz.

## Varianti

### Hydration e mismatch

Cause frequenti sono `Date.now()` o numeri casuali ricalcolati nei due ambienti, locale/fuso diversi, HTML non valido corretto dal parser, stato iniziale diverso e branch basati su `typeof window` durante render. Usa un valore iniziale condiviso e deterministico; leggi lo stato browser dopo il mount se necessario, accettando l'eventuale secondo aggiornamento.

`useId` aiuta con ID coerenti, ma richiede alberi iniziali compatibili; nelle API manuali anche gli eventuali prefissi devono coincidere. `suppressHydrationWarning` e un'eccezione limitata, non una cura generale. Registra e risolvi i mismatch invece di nasconderli.

Selective hydration prioritizza boundary in un albero React con Suspense; non significa che tutto il codice interattivo scompaia. Le architetture a isole o altre forme di hydration parziale sono scelte distinte dell'integrazione.

### Cache, errori e sicurezza

- **Cache pubblica/privata**: non servire l'HTML di un utente a un altro. Definisci chiavi, policy e invalidazione; non usare stato mutabile di modulo per memorizzare la sessione corrente.
- **ISR/revalidation**: il runtime o la piattaforma rigenera dati/pagine secondo regole esplicite. Non e un aggiornamento automatico dei file su GitHub Pages, ne coincide con la cache client di TanStack Query.
- **Streaming**: dopo l'invio degli header non puoi cambiare lo status HTTP. Distingui errore della shell da errore successivo e configura logging/fallback. Un Error Boundary client non intercetta genericamente tutte le eccezioni del server.
- **Dati iniziali**: props e payload ricevuti dal browser sono leggibili. Per JSON inserito manualmente in HTML, `JSON.stringify` da solo non gestisce il contesto di uno script; usa la serializzazione sicura del framework o un serializer dedicato.
- **CSP e disconnessioni**: gli script di hydration/streaming devono rispettare la policy; timeout e abort del render non annullano automaticamente operazioni gia avviate nel database.

Per le API Node, `onShellReady` permette di iniziare lo stream, mentre aspettare `onAllReady` rinuncia alla rivelazione progressiva. `renderToString` non aspetta una Promise sospesa: restituisce il fallback piu vicino. `renderToStaticMarkup` serve HTML non idratabile, per esempio un documento senza interazioni; non e un sostituto equivalente delle API di prerender con attesa.

## Errori comuni

- Pensare che SSR elimini JavaScript client.
- Ignorare mismatch di hydration.
- Usare API browser durante render server.
- Non gestire cache e invalidazione.
- Rendere tutto SSR anche se statico.
- Confondere SSR con Server Components.

## Checklist

- La pagina ha bisogno di SEO o primo HTML utile?
- I dati sono statici o per richiesta?
- Il framework gestisce cache e revalidation?
- Ci sono API browser usate lato server?
- Hydration e fallback sono testati?
- SSG sarebbe sufficiente?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]
- [[Programmazione/React/Pagine/Framework Next.js e Remix|Framework Next.js e Remix]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering senza React]]

## Fonti

- [React: hydrateRoot e mismatch](https://react.dev/reference/react-dom/client/hydrateRoot).
- [React: streaming Node e gestione degli errori](https://react.dev/reference/react-dom/server/renderToPipeableStream).
- [React: limiti di renderToString](https://react.dev/reference/react-dom/server/renderToString), [HTML non interattivo](https://react.dev/reference/react-dom/server/renderToStaticMarkup) e [prerender con attesa](https://react.dev/reference/react-dom/static/prerenderToNodeStream).
- [Next: connection](https://nextjs.org/docs/app/api-reference/functions/connection) e [loading/streaming](https://nextjs.org/docs/app/api-reference/file-conventions/loading).
- [Next: export statico e limitazioni](https://nextjs.org/docs/app/guides/static-exports), [percorsi dinamici in build](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) e [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath).
- [Next: dati server e sicurezza](https://nextjs.org/docs/app/guides/data-security). Demo riferiti a Next 16.4.1, React/React DOM 19.3.0; verificare la documentazione della versione del proprio progetto.
