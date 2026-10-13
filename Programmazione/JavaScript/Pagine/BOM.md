---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - bom
  - browser
  - window
  - navigator
  - location
aliases:
  - Browser Object Model
  - BOM JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
title: BOM
---

# BOM

## Sintesi

Il BOM, Browser Object Model, e l'insieme di oggetti esposti dal browser per interagire con finestra, cronologia, URL, schermo e ambiente.

E un nome didattico per raggruppare queste API, non un unico standard separato chiamato BOM. Le funzionalita sono definite da specifiche web diverse e lavorano accanto al DOM.

---

## Quando usarlo

Usa il BOM quando devi interagire con funzionalita del browser che non riguardano direttamente i nodi HTML.

Casi comuni:

- leggere o modificare l'URL corrente;
- gestire navigazione e cronologia;
- rilevare dimensioni della finestra;
- usare timer;
- accedere a informazioni di lingua, connessione o capability del browser.

Per modificare contenuto della pagina usa invece il DOM.

## Come funziona

### `window`
Nel contesto di una pagina, `window` espone l'ambiente globale della finestra. Non e disponibile in tutti i runtime JavaScript: i Web Worker non hanno `window` o accesso diretto al DOM, e Node.js espone un ambiente diverso. `globalThis` e il riferimento globale portabile, ma non rende disponibili le API mancanti.

```js
console.log(window.innerWidth);
console.log(window.location.href);
```

Variabili globali dichiarate con `var` in script classici possono diventare proprieta di `window`.

---
### `location`
`location` descrive e modifica l'URL corrente.

```js
console.log(location.href);
console.log(location.pathname);
console.log(location.search);
```

Cambiare `location.href` naviga verso un'altra pagina.

`location.assign(url)` naviga lasciando normalmente la pagina corrente nella cronologia; `location.replace(url)` sostituisce la voce corrente. Modificare solo il frammento `#...` puo essere una navigazione nello stesso documento. Non costruire destinazioni non fidate senza validare origine e protocollo.

---
### `history`
`history` permette di navigare e modificare la cronologia della sessione.

```js
history.pushState({ page: "profile" }, "", "/profile");
```

Questo secondo comando torna alla voce precedente della cronologia:

```js
history.back();
```

`pushState()` aggiunge una voce e `replaceState()` modifica quella corrente, senza scaricare un'altra pagina. L'URL deve restare nella stessa origine; lo stato deve essere serializzabile tramite structured clone, quindi non puo contenere funzioni o nodi DOM.

Queste chiamate non generano `popstate`. Quando l'utente percorre la cronologia, invece, l'app puo ascoltare `popstate` per riallineare la UI. Anche l'inizializzazione e la navigazione avviata dal codice devono aggiornare la UI esplicitamente.

Le SPA usano queste API per il routing, ma il server deve servire l'app anche aprendo direttamente i percorsi. Cambiare l'URL in `/profile` non crea una pagina sul server: su un hosting statico puo produrre un `404` al refresh. Non copiare percorsi assoluti alla radice se l'app vive in un sottopercorso.

---
### `navigator`
`navigator` espone informazioni e capability del browser.

```js
console.log(navigator.userAgent);
console.log(navigator.language);
console.log(navigator.onLine);
```

Non usare `userAgent` come unica fonte affidabile per feature detection.

`navigator.onLine` e un indizio della connessione di rete, non una prova che Internet o la tua API rispondano. Gestisci comunque gli errori delle richieste e non bloccare tutte le azioni basandoti soltanto su questo valore. Molte capability richiedono inoltre HTTPS, permessi o un gesto dell'utente.

---
### Timer
Timer come `setTimeout` e `setInterval` sono API del runtime browser.

```js
const id = setTimeout(() => {
  console.log("done");
}, 1000);

clearTimeout(id);
```

In questo esempio il timer viene annullato subito, quindi `done` non viene stampato. Il ritardo indica un'attesa minima richiesta, non una scadenza precisa: carico del main thread e limitazioni delle tab in background possono rinviare l'esecuzione.

`setInterval()` non attende una callback `async`: richieste lente possono sovrapporsi. Per polling sequenziale pianifica la prossima esecuzione dopo la conclusione della precedente e prevedi annullamento e gestione degli errori. Per il dettaglio vedi [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]].

---

## API / Sintassi

Proprieta di sola lettura nell'esempio:

```js
window.innerWidth;
window.innerHeight;

location.href;
location.pathname;
location.search;

navigator.language;
navigator.onLine;
```

Modifica della voce corrente senza aggiungerne una nuova (cambia realmente l'URL):

```js
history.replaceState({ view: "profile" }, "", "?view=profile");
```

Schema di timer ripetuto, con `callback` da definire nell'applicazione:

```js
const intervalId = setInterval(callback, 1000);
```

Quando il timer non serve piu:

```js
clearInterval(intervalId);
```

Molte API BOM sono disponibili come globali, ma scrivere `window.location` o `window.setTimeout` puo rendere piu esplicito che dipendono dal browser.

## Esempio pratico

Sincronizzare una scelta di tab con la query string. Esempio per una pagina autonoma senza un altro router che gestisca la History API; usa solo la query e conserva percorso, altri parametri e frammento.

```html
<p id="tab-status" role="status"></p>
```

```js
const tabStatus = document.querySelector("#tab-status");
if (!tabStatus) throw new Error("Elemento tab-status mancante");
const availableTabs = new Set(["home", "settings"]);

function renderTabFromUrl() {
  const tab = new URL(location.href).searchParams.get("tab");
  tabStatus.textContent = availableTabs.has(tab) ? tab : "home";
}

function selectTab(tab) {
  if (!availableTabs.has(tab)) throw new RangeError("Tab non supportata");
  const url = new URL(location.href);
  url.searchParams.set("tab", tab);
  history.pushState({ tab }, "", url);
  renderTabFromUrl();
}

window.addEventListener("popstate", renderTabFromUrl);
renderTabFromUrl();
// Da un controllo della UI: selectTab("settings");
```

Il caricamento iniziale legge l'URL, `selectTab()` aggiorna URL e testo, e Indietro/Avanti aggiorna il testo tramite `popstate`. Il rendering reale dei pannelli puo essere aggiunto a `renderTabFromUrl`. Quando smonti la UI, rimuovi il listener con `window.removeEventListener("popstate", renderTabFromUrl)`.

## Varianti

- **Window API**: dimensioni, scroll, eventi globali.
- **Location API**: lettura e modifica dell'URL.
- **History API**: navigazione e routing client-side.
- **Navigator API**: informazioni e capability dell'ambiente.
- **Screen API**: informazioni sullo schermo.
- **Timer API**: scheduling con timeout e interval.

## Errori comuni

- Confondere DOM e BOM.
- Dipendere troppo da `userAgent`.
- Usare globali implicite su `window`.
- Modificare `location` senza considerare navigazione reale.
- Non pulire timer e interval.

---

## Checklist

### Checklist operativa
- Usa feature detection invece di sniffing del browser.
- Pulisci timer quando non servono.
- Usa History API per routing SPA.
- Evita globali su `window`.
- Controlla supporto browser delle API usate.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]


## Fonti

- [MDN: Window](https://developer.mozilla.org/en-US/docs/Web/API/Window).
- [MDN: Location](https://developer.mozilla.org/en-US/docs/Web/API/Location).
- [MDN: pushState e vincoli dello stato](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
- [MDN: popstate](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event).
- [MDN: navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine).
- [MDN: setInterval e operazioni lente](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
