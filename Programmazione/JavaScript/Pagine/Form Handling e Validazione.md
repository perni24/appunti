---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - forms
  - validation
  - constraint-validation-api
  - formdata
  - browser
aliases:
  - Form Handling JS
  - Constraint Validation API
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Gestione Eventi]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Sicurezza]]"
  - "[[Programmazione/JavaScript/Pagine/Regular Expressions]]"
title: Form Handling e Validazione
---

# Form Handling e Validazione

## Sintesi


La gestione dei form in JavaScript riguarda raccolta dati, validazione, invio, feedback all'utente e integrazione con API HTTP.

La **Constraint Validation API** e l'insieme di funzionalita native del browser per controllare la validita degli input senza dover riscrivere tutto manualmente.

Gli esempi delle singole sezioni sono alternativi, non listener da sommare sullo stesso form. Presuppongono `form` e i controlli gia selezionati; i frammenti con `await` richiedono una funzione `async` o un modulo ES. L'esempio pratico finale usa l'HTML iniziale e include selezione, validazione, invio e gestione degli esiti.

---

## Quando usarlo

Usa gestione form in JavaScript quando devi controllare validazione, invio asincrono, feedback utente o integrazione con API.

Casi comuni:

- login e registrazione;
- upload file;
- ricerca e filtri;
- form multi-step;
- validazione personalizzata;
- invio con `fetch`;
- messaggi di errore accessibili.

La validazione client migliora UX, ma il server deve sempre validare di nuovo.

## Come funziona

### Struttura base di un form
Un form HTML raccoglie valori tramite controlli come `input`, `select`, `textarea` e `button`.

```html
<form id="signup-form" action="/api/signup" method="post">
  <label>
    Email
    <input type="email" name="email" autocomplete="email" required>
  </label>

  <label>
    Password
    <input type="password" name="password" autocomplete="new-password" minlength="8" required>
  </label>

  <button type="submit">Registrati</button>
  <p id="signup-feedback" role="status" aria-live="polite"></p>
</form>
```

L'attributo `name` e fondamentale: viene usato da `FormData` e dall'invio tradizionale del form.

`method="post"` evita il default GET, che metterebbe anche la password nella query string se JavaScript non intercettasse l'invio. POST non cifra i dati: in produzione usa HTTPS. Il backend deve gestire anche l'invio nativo, se vuoi un fallback senza JavaScript. Il limite di otto caratteri e un esempio del vincolo HTML, non una politica completa per le password.

---
### Evento submit
Per intercettare l'invio del form si ascolta l'evento `submit`.

```js
const form = document.querySelector("#signup-form");

form.addEventListener("submit", event => {
  event.preventDefault();

  console.log("Form inviato");
});
```

`event.preventDefault()` blocca il comportamento standard del browser, cioe l'invio con refresh o navigazione.

Questo serve quando vuoi gestire l'invio via JavaScript, per esempio con `fetch()`.

Il submit riguarda il form, non solo il click del pulsante: copre anche Invio da tastiera. Normalmente la validazione interattiva precede l'evento, quindi un form invalido non emette `submit`. `form.requestSubmit()` segue questo percorso; `form.submit()` lo bypassa, saltando validazione ed evento.

---
### Leggere i valori
Si possono leggere i campi direttamente.

```js
const email = form.elements.email.value;
const password = form.elements.password.value;
```

Oppure usare `FormData`, che e piu adatto a form completi.

```js
const formData = new FormData(form);

const email = formData.get("email");
const password = formData.get("password");
```

`FormData` include i controlli inviabili con `name`: esclude i controlli disabilitati e checkbox/radio non selezionati. I valori sono stringhe o `File`, non numeri o booleani automaticamente convertiti; `get()` restituisce `null` per un nome assente. Il semplice attributo `readonly` non esclude il valore dall'invio.

Per includere anche nome e valore del pulsante usato, nei browser che supportano il secondo parametro usa `new FormData(form, event.submitter)` nel listener `submit`. Raccogli i dati prima di disabilitare i controlli da inviare.

---
### Convertire FormData in oggetto
Per form semplici, `Object.fromEntries()` permette di trasformare `FormData` in un oggetto.

```js
const formData = new FormData(form);
const data = Object.fromEntries(formData.entries());

console.log(Object.keys(data)); // Non registrare password o token nei log
```

Esempio risultato:

```json
{
  "email": "luca@example.com",
  "password": "valore-di-esempio"
}
```

Attenzione: se ci sono campi multipli con lo stesso nome, come checkbox multiple, `Object.fromEntries()` mantiene solo l'ultimo valore.

Non e una conversione di schema: preserva stringhe e oggetti `File`. Per payload JSON definisci esplicitamente i campi e le conversioni; per file usa multipart.

---
### Checkbox, radio e campi multipli
Per leggere tutti i valori associati allo stesso `name`, si usa `getAll()`.

```html
<label>
  <input type="checkbox" name="topics" value="javascript" checked>
  JavaScript
</label>

<label>
  <input type="checkbox" name="topics" value="css" checked>
  CSS
</label>
```

```js
const formData = new FormData(form);
const topics = formData.getAll("topics");

console.log(topics); // ["javascript", "css"]
```

Inserisci questi controlli dentro il form usato dal codice. Qui entrambe le checkbox sono selezionate; se nessuna lo e, `getAll("topics")` restituisce `[]`. Un gruppo radio invia il solo valore selezionato, oppure nessun valore se non c'e selezione.

---
### Inviare dati con fetch
Per inviare JSON:

```js
form.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch {
    console.error("Invio non riuscito");
  }
});
```

Per inviare file o multipart, si passa direttamente `FormData`.

```js
const formData = new FormData(form);

await fetch("/api/upload", {
  method: "POST",
  body: formData,
});
```

Quando usi `FormData` come body, non impostare manualmente `Content-Type`: il browser aggiunge automaticamente il boundary corretto.

---
### Validazione HTML nativa
HTML offre diversi attributi di validazione.

```html
<input type="email" required>
<input type="text" minlength="3" maxlength="20">
<input type="number" min="1" max="10">
<input type="text" pattern="[A-Za-z]+">
```

Attributi comuni:

- `required`: campo obbligatorio;
- `minlength`: lunghezza minima;
- `maxlength`: lunghezza massima;
- `min`: valore minimo;
- `max`: valore massimo;
- `step`: incremento valido per numeri/date;
- `pattern`: espressione regolare;
- `type`: tipo semantico come `email`, `url`, `number`, `date`.

Questa validazione viene eseguita dal browser prima dell'invio interattivo del form. I campi opzionali vuoti restano validi per molti vincoli: aggiungi `required` quando serve. `minlength` e `maxlength` non si applicano allo stesso modo a valori assegnati programmaticamente; non affidarti ai controlli client per certificare dati esterni.

---
### ValidityState
La proprieta `validity` contiene il motivo per cui un campo non e valido.

```js
const input = form.elements.email;

console.log(input.validity);
```

Proprieta utili:

- `valueMissing`: campo obbligatorio vuoto;
- `typeMismatch`: valore non coerente con il tipo, per esempio email non valida;
- `tooShort`: valore troppo corto;
- `tooLong`: valore troppo lungo;
- `rangeUnderflow`: valore sotto il minimo;
- `rangeOverflow`: valore sopra il massimo;
- `stepMismatch`: valore non allineato al passo;
- `badInput`: input che il browser non riesce a convertire nel tipo richiesto;
- `patternMismatch`: valore non coerente con `pattern`;
- `customError`: errore impostato con `setCustomValidity()`;
- `valid`: nessun errore.

---
### Messaggi personalizzati
`setCustomValidity()` permette di definire un messaggio di errore.

```js
const password = form.elements.password;

password.addEventListener("input", () => {
  if (password.value.length < 8) {
    password.setCustomValidity("La password deve avere almeno 8 caratteri");
  } else {
    password.setCustomValidity("");
  }
});
```

Per rimuovere l'errore personalizzato bisogna passare una stringa vuota.

```js
password.setCustomValidity("");
```

Se dimentichi di pulire il messaggio, il campo resta non valido.

---
### Validazione al submit
Pattern tipico:

```js
form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    await submitData(data);
  } catch {
    console.error("Invio non riuscito");
  }
});
```

`submitData` e la funzione applicativa da fornire. Con validazione automatica attiva il form invalido viene normalmente bloccato prima di questo listener. Il controllo manuale e utile se usi `novalidate` e gestisci tu il flusso.

---
### novalidate
L'attributo `novalidate` disattiva la validazione automatica del browser al submit.

```html
<form id="signup-form" novalidate>
  ...
</form>
```

E utile quando vuoi gestire completamente tu i messaggi e il rendering degli errori.

Puoi comunque usare `checkValidity()`, `validity` e `setCustomValidity()` da JavaScript.

---
### Feedback accessibile
Gli errori devono essere leggibili anche da tecnologie assistive.

Esempio:

```html
<label for="email">Email</label>
<input
  id="email"
  name="email"
  type="email"
  required
  aria-describedby="email-error"
>
<p id="email-error" role="alert"></p>
```

```js
const email = document.querySelector("#email");
const error = document.querySelector("#email-error");

email.addEventListener("input", () => {
  if (email.validity.valid) {
    error.textContent = "";
    email.removeAttribute("aria-invalid");
  } else {
    error.textContent = email.validationMessage;
    email.setAttribute("aria-invalid", "true");
  }
});
```

Un buon form non deve comunicare l'errore solo con il colore.

---
### Stato di invio
Durante una richiesta asincrona conviene disabilitare il pulsante per evitare invii multipli.

Questo schema mostra il ripristino del pulsante; la protezione completa contro submit ripetuti e nell'esempio finale. `sendForm` e una funzione applicativa da fornire.

```js
form.addEventListener("submit", async event => {
  event.preventDefault();

  const submitButton = form.querySelector("[type='submit']");
  const formData = new FormData(form, event.submitter);
  submitButton.disabled = true;

  try {
    await sendForm(formData);
  } catch {
    console.error("Invio non riuscito");
  } finally {
    submitButton.disabled = false;
  }
});
```

Il blocco `finally` garantisce il ripristino anche in caso di errore.

---
### Reset del form
`form.reset()` riporta i campi ai valori iniziali definiti nell'HTML.

```js
form.reset();
```

Non sempre significa "svuotare tutto": se un input aveva un valore iniziale, quel valore viene ripristinato.

Non pulisce automaticamente i messaggi creati da `setCustomValidity()` o la UI di errore: reimpostali esplicitamente quando necessario.

---
### File input
I file si leggono dal campo `files`.

```html
<input type="file" name="avatar" accept="image/*">
```

```js
const fileInput = document.querySelector('input[name="avatar"]');
const file = fileInput.files[0];

if (file) {
  console.log(file.name);
  console.log(file.type);
  console.log(file.size);
}
```

Senza selezione `files[0]` e `undefined`. `accept` e un aiuto al selettore, non una validazione; nome, estensione e MIME dichiarato non certificano il contenuto. Dimensioni e formato vanno controllati anche dal server.

Per upload file, usa `FormData`.

```js
const formData = new FormData(form);

await fetch("/api/avatar", {
  method: "POST",
  body: formData,
});
```

---
### Sicurezza
La validazione lato client migliora l'esperienza utente, ma non e una garanzia di sicurezza.

Qualunque controllo lato client puo essere bypassato.

Il server deve sempre validare:

- tipi;
- lunghezze;
- autorizzazioni;
- formato;
- contenuto;
- limiti di dimensione;
- permessi dell'utente.

La regola pratica e: validazione client per UX, validazione server per sicurezza.

---

## API / Sintassi

### Constraint Validation API
Ogni controllo validabile espone proprieta e metodi per controllare la validita.

```js
const email = form.elements.email;

console.log(email.validity.valid);
console.log(email.validationMessage);
```

Metodi principali:

- `checkValidity()`: restituisce `true` o `false`;
- `reportValidity()`: mostra anche il messaggio nativo del browser;
- `setCustomValidity(message)`: imposta un errore personalizzato.

```js
// Dentro un handler o una funzione, non come script autonomo:
if (!form.checkValidity()) {
  form.reportValidity();
  return;
}
```

---

## Esempio pratico

Usa l'HTML `signup-form` iniziale ed esegui questo script dopo il parsing. Richiede un backend `/api/signup` che accetti JSON; un sito statico da solo non implementa l'endpoint. Non registrare anche i listener parziali delle sezioni precedenti.

```js
const form = document.querySelector("#signup-form");
const feedback = document.querySelector("#signup-feedback");
if (!form || !feedback) throw new Error("Markup del form incompleto");
const submitButton = form.querySelector("button[type='submit']");
if (!submitButton) throw new Error("Pulsante submit mancante");
let submitting = false;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;

  if (!form.reportValidity()) return;

  const formData = new FormData(form, event.submitter);
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  if (typeof data.email !== "string" || typeof data.password !== "string") {
    feedback.textContent = "Controlla i campi richiesti.";
    return;
  }

  submitting = true;
  submitButton.disabled = true;
  form.setAttribute("aria-busy", "true");
  feedback.textContent = "Invio in corso...";

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    feedback.textContent = "Registrazione completata.";
  } catch {
    feedback.textContent = "Invio non riuscito. I dati sono stati conservati.";
  } finally {
    submitting = false;
    submitButton.disabled = false;
    form.removeAttribute("aria-busy");
  }
});
```

Il contratto dell'esempio considera conclusa la registrazione con qualsiasi risposta `2xx` e non richiede JSON in risposta, quindi accetta anche `204`. Per un'API che restituisce errori di campo o `202 Accepted`, adatta la gestione all'esito applicativo invece di trattare tutti i successi HTTP allo stesso modo.

Il flag `submitting` protegge anche invii da tastiera o `requestSubmit()` durante la richiesta. Non sostituisce idempotenza e vincoli lato server. Il form non viene resettato automaticamente: conserva i dati in caso di errore e non cancella modifiche fatte durante l'attesa. Un timeout o annullamento puo essere aggiunto con [[Programmazione/JavaScript/Pagine/AbortController|AbortController]].

## Varianti

### Mappa mentale
```text
Form Handling e Validazione
|
|-- raccolta dati
|   |-- form.elements
|   |-- FormData
|   |-- Object.fromEntries()
|
|-- invio
|   |-- submit event
|   |-- preventDefault()
|   |-- fetch()
|
|-- validazione nativa
|   |-- required
|   |-- minlength / maxlength
|   |-- pattern
|   |-- type
|
|-- Constraint Validation API
|   |-- checkValidity()
|   |-- reportValidity()
|   |-- setCustomValidity()
|   |-- validity
|
|-- UX e sicurezza
|   |-- messaggi accessibili
|   |-- stato di invio
|   |-- validazione server
```

---

## Errori comuni


- Dimenticare `event.preventDefault()` nel submit gestito via JS.
- Dimenticare l'attributo `name`.
- Usare `Object.fromEntries()` con checkbox multiple perdendo valori.
- Impostare `Content-Type` manualmente con `FormData`.
- Pensare che la validazione client sia sufficiente per la sicurezza.
- Non rimuovere errori creati con `setCustomValidity()`.
- Mostrare errori non accessibili.
- Non gestire doppi submit durante richieste lente.

---

## Checklist

### Best practice
- Usa sempre `name` sui campi da inviare.
- Usa gli attributi HTML nativi quando bastano.
- Usa `FormData` per raccogliere dati dal form.
- Non impostare manualmente `Content-Type` quando invii `FormData`.
- Usa `checkValidity()` e `reportValidity()` per integrare la validazione nativa.
- Pulisci gli errori custom con `setCustomValidity("")`.
- Mostra messaggi accessibili, non solo colori.
- Disabilita il submit durante invii asincroni.
- Valida sempre anche lato server.

---

## Collegamenti


- [[Programmazione/JavaScript/Pagine/Gestione Eventi|Gestione Eventi]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- FormData
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Web Components|Web Components]]


## Fonti

- [MDN: form, action e method](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form).
- [MDN: evento submit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event).
- [MDN: requestSubmit](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit).
- [MDN: costruttore FormData e submitter](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData).
- [MDN: Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation).
- [MDN: input e vincoli HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input).
- [MDN: Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
