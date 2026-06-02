---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, bom, browser, window, navigator, location]
aliases: [Browser Object Model, BOM JS]
prerequisites: [Manipolazione del DOM]
related: [Browser Storage, Fetch API, Event Loop]
---

# BOM

## Sintesi

Il BOM, Browser Object Model, e l'insieme di oggetti esposti dal browser per interagire con finestra, cronologia, URL, schermo e ambiente.

Non e parte del DOM, ma lavora accanto al DOM nelle applicazioni browser.

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
`window` e l'oggetto globale del browser.

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

---
### `history`
`history` permette di navigare e modificare la cronologia della sessione.

```js
history.pushState({ page: "profile" }, "", "/profile");
history.back();
```

Le SPA usano spesso History API per routing client-side.

---
### `navigator`
`navigator` espone informazioni e capability del browser.

```js
console.log(navigator.userAgent);
console.log(navigator.language);
console.log(navigator.onLine);
```

Non usare `userAgent` come unica fonte affidabile per feature detection.

---
### Timer
Timer come `setTimeout` e `setInterval` sono API del runtime browser.

```js
const id = setTimeout(() => {
  console.log("done");
}, 1000);

clearTimeout(id);
```

---

## API / Sintassi

Oggetti e API comuni:

```js
window.innerWidth;
window.innerHeight;

location.href;
location.pathname;
location.search;

history.pushState({}, "", "/settings");
history.replaceState({}, "", "/profile");

navigator.language;
navigator.onLine;

setTimeout(callback, 1000);
setInterval(callback, 1000);
```

Molte API BOM sono disponibili come globali, ma scrivere `window.location` o `window.setTimeout` puo rendere piu esplicito che dipendono dal browser.

## Esempio pratico

Aggiornare una query string senza ricaricare la pagina:

```js
const url = new URL(window.location.href);
url.searchParams.set("tab", "settings");

history.pushState({ tab: "settings" }, "", url);
```

Questo pattern e utile in filtri, tab e routing client-side.

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
