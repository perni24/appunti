---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [SSR e SSG]
prerequisites: []
related: []
---
# SSR e SSG

## Sintesi

Nota su SSR e SSG in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

SSR e SSG sono strategie di rendering usate nelle applicazioni React moderne per decidere **quando** viene generato l'HTML iniziale di una pagina.

Con il rendering solo lato client, il browser riceve spesso una pagina HTML quasi vuota, scarica JavaScript, esegue React e solo dopo costruisce l'interfaccia. SSR e SSG spostano parte di questo lavoro sul server o nella fase di build, migliorando caricamento iniziale, SEO e percezione di velocita.

> [!INFO]
> SSR, SSG e [[Programmazione/React/Pagine/Server Components]] non sono la stessa cosa. SSR e SSG descrivono quando viene generato l'HTML; i Server Components descrivono dove viene eseguita una parte dell'albero React e quanto JavaScript viene inviato al client.

## 1. Problema del Client-Side Rendering

Nel Client-Side Rendering (CSR), il browser riceve una struttura HTML minima e un bundle JavaScript.

Flusso tipico:

1. Il server invia un HTML quasi vuoto.
2. Il browser scarica il bundle JavaScript.
3. React viene eseguito nel browser.
4. I componenti fanno eventuali richieste dati.
5. La UI viene renderizzata e diventa interattiva.

Questo approccio funziona bene per molte SPA, ma puo creare problemi:

- contenuto iniziale povero per SEO e anteprime social;
- tempo di caricamento percepito piu alto;
- dipendenza forte dal JavaScript lato client;
- doppio ritardo quando prima si scarica JS e poi si caricano i dati;
- peggior esperienza su dispositivi lenti o reti instabili.

## 2. Server-Side Rendering

Il Server-Side Rendering (SSR) genera l'HTML sul server **a ogni richiesta**.

Quando un utente richiede una pagina:

1. Il server riceve la richiesta.
2. Recupera i dati necessari.
3. Renderizza i componenti React in HTML.
4. Invia al browser HTML gia popolato.
5. Il browser scarica JavaScript e avvia l'hydration.

Esempio concettuale:

```txt
Richiesta utente
  -> server
  -> fetch dati
  -> render HTML
  -> invio HTML al browser
  -> hydration lato client
```

SSR e utile quando il contenuto deve essere aggiornato al momento della richiesta.

Esempi:

- dashboard con dati recenti;
- pagine personalizzate per utente autenticato;
- risultati di ricerca;
- e-commerce con prezzi o disponibilita variabili;
- contenuti pubblici che cambiano spesso.

## 3. Hydration

L'hydration e il processo con cui React prende l'HTML generato dal server e lo collega alla logica JavaScript lato client.

Prima dell'hydration:

- l'utente puo vedere il contenuto;
- la pagina puo sembrare pronta;
- alcune interazioni potrebbero non essere ancora attive.

Dopo l'hydration:

- eventi come click, input e submit funzionano;
- lo stato React e disponibile nel browser;
- i componenti interattivi diventano pienamente operativi.

Un rischio importante e l'**hydration mismatch**: succede quando l'HTML generato sul server non coincide con quello generato dal client.

Cause comuni:

- uso diretto di `window`, `document` o `localStorage` durante il render;
- date o valori casuali generati in modo diverso tra server e client;
- dati non sincronizzati;
- markup condizionale diverso tra ambiente server e browser.

Esempio problematico:

```jsx
function Timestamp() {
  return <p>{new Date().toISOString()}</p>;
}
```

Il valore puo essere diverso tra render server e render client, causando un mismatch.

Una soluzione e calcolare il valore dopo il mount:

```jsx
import { useEffect, useState } from "react";

function Timestamp() {
  const [value, setValue] = useState(null);

  useEffect(() => {
    setValue(new Date().toISOString());
  }, []);

  if (!value) {
    return <p>Caricamento...</p>;
  }

  return <p>{value}</p>;
}
```

## 4. Static Site Generation

La Static Site Generation (SSG) genera l'HTML **durante la build**, non a ogni richiesta.

Flusso tipico:

1. Il progetto viene compilato.
2. Le pagine statiche vengono generate in HTML.
3. I file vengono pubblicati su CDN o server statico.
4. L'utente riceve HTML gia pronto.

SSG e molto efficiente per pagine che cambiano raramente.

Esempi:

- documentazione;
- blog;
- landing page;
- pagine marketing;
- portfolio;
- pagine prodotto con contenuto poco variabile.

Vantaggi principali:

- risposta molto veloce;
- costo runtime basso;
- distribuzione semplice tramite CDN;
- buona indicizzazione;
- minore dipendenza da server applicativi.

Limite principale: i dati possono diventare obsoleti finche non viene eseguita una nuova build o una revalidazione.

## 5. SSR vs SSG

| Aspetto | SSR | SSG |
|---|---|---|
| Quando genera HTML | A ogni richiesta | Durante la build |
| Freschezza dati | Alta | Dipende da rebuild o revalidazione |
| Costo server | Piu alto | Basso a runtime |
| Performance iniziale | Buona, dipende dal server | Ottima, spesso servita da CDN |
| Personalizzazione utente | Buona | Limitata senza client-side logic |
| Complessita caching | Alta | Piu semplice |
| Casi d'uso | Dati dinamici, pagine personalizzate | Contenuti stabili, docs, blog, marketing |

La scelta non e globale per tutta l'applicazione. In molti framework moderni ogni route puo usare una strategia diversa.

## 6. Revalidation e ISR

Tra SSR e SSG esistono strategie ibride.

Una pagina puo essere generata staticamente, ma rigenerata dopo un certo intervallo o quando un evento invalida la cache.

Questo approccio viene spesso chiamato:

- Incremental Static Regeneration (ISR);
- revalidation;
- stale-while-revalidate;
- cache invalidation per route o dati.

Esempio concettuale:

```txt
Prima richiesta
  -> serve pagina statica

Dopo scadenza cache
  -> serve ancora la vecchia pagina
  -> rigenera in background
  -> le richieste successive ricevono la versione aggiornata
```

Questo consente di mantenere performance simili a SSG senza rinunciare del tutto a dati aggiornati.

## 7. Data Fetching e Cache

SSR e SSG dipendono molto dalla strategia di data fetching.

Domande da chiarire:

- i dati devono essere sempre aggiornati?
- possono essere memorizzati in cache?
- sono pubblici o specifici per utente?
- cambiano spesso o raramente?
- possono essere caricati dopo il render iniziale?

Collegamento con [[Programmazione/React/Pagine/Data Fetching e Cache]]:

- SSR recupera spesso dati lato server prima di generare HTML;
- SSG recupera dati durante la build;
- la cache riduce lavoro server e latenza;
- la revalidation controlla quando i dati statici diventano obsoleti;
- il client puo comunque usare cache applicativa per dati interattivi.

Una pagina puo anche combinare strategie:

- HTML statico per contenuto pubblico;
- fetch client-side per dati utente;
- componenti server per query sicure;
- suspense boundary per sezioni lente.

## 8. SEO e Performance

SSR e SSG migliorano la presenza di contenuto nell'HTML iniziale.

Questo aiuta:

- motori di ricerca;
- crawler social;
- anteprime link;
- utenti con reti lente;
- metriche come First Contentful Paint e Largest Contentful Paint.

Non risolvono pero automaticamente tutti i problemi di performance.

Rimangono importanti:

- dimensione del bundle JavaScript;
- costo di hydration;
- immagini ottimizzate;
- caching HTTP;
- streaming;
- code splitting con [[Programmazione/React/Pagine/Suspense e Lazy Loading]];
- riduzione del lavoro lato client.

Una pagina SSR puo essere lenta se il server impiega troppo tempo a recuperare dati o renderizzare HTML.

Una pagina SSG puo essere veloce ma mostrare dati vecchi se la revalidation non e progettata bene.

## 9. Rapporto con Server Components

I [[Programmazione/React/Pagine/Server Components]] possono essere usati insieme a SSR o SSG, ma non li sostituiscono concettualmente.

Differenza principale:

- SSR e SSG decidono **quando** viene prodotto l'HTML;
- Server Components decidono **dove** viene eseguito un componente e se il suo codice deve arrivare al browser.

Con Server Components:

- una parte dell'albero React puo eseguire query lato server;
- meno JavaScript viene inviato al client;
- i componenti interattivi restano Client Components;
- SSR, streaming e caching possono lavorare insieme.

Questa distinzione e importante per non confondere tre livelli diversi:

- generazione HTML;
- trasporto dati;
- interattivita lato client.

## 10. Framework

React da solo non impone una strategia SSR o SSG completa. Di solito queste funzionalita sono gestite da framework.

Esempi comuni:

- Next.js;
- Remix;
- framework basati su routing server-side;
- generatori statici che integrano React.

Un framework gestisce aspetti che React, da solo, non copre completamente:

- routing;
- data loading lato server;
- build statica;
- cache;
- streaming;
- gestione headers;
- deploy su server o edge;
- integrazione con API e database.

## 11. Errori Comuni

### Usare SSR per tutto

SSR non e sempre la scelta migliore. Se una pagina cambia raramente, SSG o caching aggressiva possono essere piu efficienti.

### Ignorare il costo di hydration

Inviare HTML gia pronto non elimina il costo del JavaScript. Se il bundle e grande, la pagina puo essere visibile ma poco reattiva.

### Confondere dati pubblici e dati utente

I dati personalizzati non dovrebbero essere generati staticamente per tutti gli utenti. Serve separare contenuto pubblico, contenuto privato e dati caricati dopo autenticazione.

### Non progettare la cache

SSR senza cache puo sovraccaricare il server. SSG senza revalidation puo mostrare contenuti obsoleti.

### Usare API del browser durante il render server

Oggetti come `window` e `document` non esistono sul server. Il codice che li usa deve essere spostato in effetti, componenti client o controlli condizionali sicuri.

## 12. Best Practices

1. Scegli la strategia per pagina o route, non per moda.
2. Usa SSG quando il contenuto e stabile e pubblico.
3. Usa SSR quando i dati devono essere freschi o personalizzati.
4. Progetta caching e revalidation insieme al data fetching.
5. Riduci il JavaScript client anche quando usi SSR.
6. Controlla possibili hydration mismatch.
7. Separa UI statica, dati server e interazioni client.
8. Usa [[Programmazione/React/Pagine/Suspense e Lazy Loading]] per dividere caricamenti e sezioni lente.
9. Valuta i [[Programmazione/React/Pagine/Server Components]] quando vuoi ridurre bundle e lavoro lato client.
10. Misura performance reali invece di basarti solo sulla strategia di rendering.

## 13. Quando Usare Cosa

Usa CSR quando:

- la pagina e privata o molto interattiva;
- SEO non e importante;
- i dati dipendono quasi sempre dall'utente;
- vuoi una SPA semplice.

Usa SSR quando:

- il contenuto deve essere indicizzato;
- i dati cambiano spesso;
- la risposta dipende dalla richiesta;
- serve personalizzazione lato server.

Usa SSG quando:

- il contenuto e pubblico;
- cambia raramente;
- vuoi servire pagine molto veloci da CDN;
- il progetto e vicino a documentazione, blog o marketing.

Usa strategie ibride quando:

- il contenuto e quasi statico ma deve aggiornarsi periodicamente;
- alcune sezioni sono pubbliche e altre personalizzate;
- vuoi performance statiche con dati aggiornabili.

## Collegamenti

- [[Programmazione/React/Pagine/Server Components]]
- [[Programmazione/React/Pagine/Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading]]
- [[Programmazione/React/Pagine/React Router]]
