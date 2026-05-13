---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, ajax, xhr, networking, browser]
aliases: [AJAX JS, XMLHttpRequest]
prerequisites: [Event Loop, Callback]
related: [Fetch API, Promises, Async Await, CORS]
---

# AJAX

## Sintesi

AJAX significa Asynchronous JavaScript and XML.

Oggi il termine indica in generale richieste asincrone dal browser al server senza ricaricare l'intera pagina, anche quando il formato usato e JSON e non XML.

---

## Idea di base

Prima delle applicazioni web moderne, molte interazioni richiedevano il caricamento completo di una nuova pagina.

Con AJAX, JavaScript puo:

- inviare una richiesta HTTP;
- ricevere dati;
- aggiornare solo una parte del DOM;
- mantenere l'utente sulla stessa pagina.

---

## XMLHttpRequest

`XMLHttpRequest` e l'API storica usata per AJAX.

```js
const xhr = new XMLHttpRequest();

xhr.open("GET", "/api/users", true);

xhr.onreadystatechange = () => {
  if (xhr.readyState !== XMLHttpRequest.DONE) {
    return;
  }

  if (xhr.status >= 200 && xhr.status < 300) {
    const users = JSON.parse(xhr.responseText);
    console.log(users);
  } else {
    console.error(`HTTP ${xhr.status}`);
  }
};

xhr.send();
```

Nel codice moderno si preferisce quasi sempre `fetch()`.

---

## readyState

`readyState` descrive lo stato della richiesta XHR.

| Valore | Nome | Significato |
| --- | --- | --- |
| 0 | UNSENT | `open()` non chiamato |
| 1 | OPENED | `open()` chiamato |
| 2 | HEADERS_RECEIVED | header ricevuti |
| 3 | LOADING | body in ricezione |
| 4 | DONE | richiesta completata |

---

## AJAX moderno con fetch

```js
async function loadUsers() {
  const response = await fetch("/api/users");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const users = await response.json();
  renderUsers(users);
}
```

Questo e piu leggibile perche usa Promise e `async/await`.

---

## AJAX e JSON

Anche se il nome contiene XML, oggi il formato piu comune e JSON.

```js
await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Luca" }),
});
```

---

## AJAX e CORS

Quando una richiesta va verso un dominio diverso, il browser applica le regole CORS.

```js
await fetch("https://api.example.com/users");
```

Se il server non espone gli header corretti, il browser blocca la lettura della risposta.

---

## Quando sapere XHR serve ancora

XHR puo comparire in:

- codice legacy;
- vecchie librerie;
- esempi storici;
- casi particolari di upload progress, anche se molte alternative moderne esistono.

Conoscere XHR aiuta a leggere codice vecchio, ma per nuovo codice usa `fetch()` salvo vincoli specifici.

---

## Errori comuni

- Pensare che AJAX significhi solo XML.
- Usare XHR in nuovo codice senza motivo.
- Dimenticare gestione errori HTTP.
- Confondere errore CORS con errore del codice JavaScript.
- Aggiornare troppo DOM dopo ogni risposta senza batching.

---

## Checklist operativa

- Usa `fetch()` per nuovo codice.
- Usa XHR solo quando serve compatibilita o una feature specifica.
- Controlla sempre lo status HTTP.
- Serializza e deserializza JSON in modo esplicito.
- Considera CORS quando chiami API esterne.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
