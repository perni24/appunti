---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, security, xss, csrf, sanitization, browser]
aliases: [Sicurezza JS, JavaScript Security]
prerequisites: [Manipolazione del DOM, Fetch API, Browser Storage]
related: [CORS, Browser Storage, Form Handling e Validazione]
---

# Sicurezza

## Sintesi

La sicurezza JavaScript riguarda soprattutto codice eseguito nel browser, input non fidato, dati sensibili, comunicazione HTTP e manipolazione del DOM.

Il principio base e non fidarsi mai di input utente, URL, storage client-side o dati provenienti da API senza validazione.

---

## XSS

XSS, Cross-Site Scripting, avviene quando un attaccante riesce a eseguire JavaScript nella pagina di un altro utente.

Esempio pericoloso:

```js
element.innerHTML = userInput;
```

Preferisci API testuali:

```js
element.textContent = userInput;
```

Se devi renderizzare HTML, usa sanitizzazione robusta e policy chiare.

---

## CSRF

CSRF sfrutta il fatto che il browser invia cookie automaticamente.

Mitigazioni comuni:

- cookie `SameSite`;
- CSRF token;
- controlli su Origin e Referer;
- metodi HTTP corretti;
- autenticazione e autorizzazione lato server.

CORS non e una protezione completa contro CSRF.

---

## Storage client-side

Evita di salvare segreti in `localStorage`.

```js
localStorage.setItem("token", token); // rischio se avviene XSS
```

Se possibile, usa cookie `HttpOnly`, `Secure` e `SameSite` per sessioni.

---

## Validazione

La validazione lato client migliora UX, ma non sostituisce mai quella lato server.

```js
if (!emailInput.validity.valid) {
  showError("Email non valida");
}
```

Il server deve validare tutto di nuovo.

---

## Dipendenze

Le dipendenze possono introdurre vulnerabilita.

Pratiche utili:

- aggiornare pacchetti;
- usare lockfile;
- controllare advisory;
- limitare pacchetti non necessari;
- evitare codice copiato da fonti non affidabili.

---

## Errori comuni

- Usare `innerHTML` con input non fidato.
- Salvare token sensibili in storage leggibile da JavaScript.
- Considerare CORS una misura di autenticazione.
- Validare solo lato client.
- Mostrare stack trace o dettagli interni all'utente.

---

## Checklist operativa

- Usa `textContent` quando devi inserire testo.
- Sanitizza HTML non fidato.
- Proteggi cookie con `HttpOnly`, `Secure`, `SameSite`.
- Valida sempre lato server.
- Non loggare segreti.
- Aggiorna dipendenze e controlla vulnerabilita.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
