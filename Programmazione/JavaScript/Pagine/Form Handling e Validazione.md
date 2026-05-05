---
date: 2026-05-05
tags: [javascript, forms, validation, constraint-validation-api, formdata, browser]
type: #permanent-note
status: budding
---

# Form Handling e Validazione

La gestione dei form in JavaScript riguarda raccolta dati, validazione, invio, feedback all'utente e integrazione con API HTTP.

La **Constraint Validation API** e l'insieme di funzionalita native del browser per controllare la validita degli input senza dover riscrivere tutto manualmente.

---

## 1. Struttura base di un form

Un form HTML raccoglie valori tramite controlli come `input`, `select`, `textarea` e `button`.

```html
<form id="signup-form">
  <label>
    Email
    <input type="email" name="email" required>
  </label>

  <label>
    Password
    <input type="password" name="password" minlength="8" required>
  </label>

  <button type="submit">Registrati</button>
</form>
```

L'attributo `name` e fondamentale: viene usato da `FormData` e dall'invio tradizionale del form.

---

## 2. Evento submit

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

---

## 3. Leggere i valori

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

`FormData` raccoglie i controlli del form che hanno un attributo `name`.

---

## 4. Convertire FormData in oggetto

Per form semplici, `Object.fromEntries()` permette di trasformare `FormData` in un oggetto.

```js
const formData = new FormData(form);
const data = Object.fromEntries(formData.entries());

console.log(data);
```

Esempio risultato:

```js
{
  email: "luca@example.com",
  password: "password123"
}
```

Attenzione: se ci sono campi multipli con lo stesso nome, come checkbox multiple, `Object.fromEntries()` mantiene solo l'ultimo valore.

---

## 5. Checkbox, radio e campi multipli

Per leggere tutti i valori associati allo stesso `name`, si usa `getAll()`.

```html
<label>
  <input type="checkbox" name="topics" value="javascript">
  JavaScript
</label>

<label>
  <input type="checkbox" name="topics" value="css">
  CSS
</label>
```

```js
const formData = new FormData(form);
const topics = formData.getAll("topics");

console.log(topics); // ["javascript", "css"]
```

Per radio button, di solito viene inviato solo il valore selezionato.

---

## 6. Inviare dati con fetch

Per inviare JSON:

```js
form.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const response = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Invio fallito");
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

## 7. Validazione HTML nativa

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

Questa validazione viene eseguita dal browser prima dell'invio standard del form.

---

## 8. Constraint Validation API

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
if (!form.checkValidity()) {
  form.reportValidity();
  return;
}
```

---

## 9. ValidityState

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
- `patternMismatch`: valore non coerente con `pattern`;
- `customError`: errore impostato con `setCustomValidity()`;
- `valid`: nessun errore.

---

## 10. Messaggi personalizzati

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

## 11. Validazione al submit

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

  await submitData(data);
});
```

Questo mantiene la validazione nativa ma permette di controllare l'invio con JavaScript.

---

## 12. novalidate

L'attributo `novalidate` disattiva la validazione automatica del browser al submit.

```html
<form id="signup-form" novalidate>
  ...
</form>
```

E utile quando vuoi gestire completamente tu i messaggi e il rendering degli errori.

Puoi comunque usare `checkValidity()`, `validity` e `setCustomValidity()` da JavaScript.

---

## 13. Feedback accessibile

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
const email = form.elements.email;
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

## 14. Stato di invio

Durante una richiesta asincrona conviene disabilitare il pulsante per evitare invii multipli.

```js
form.addEventListener("submit", async event => {
  event.preventDefault();

  const submitButton = form.querySelector("[type='submit']");

  submitButton.disabled = true;

  try {
    const formData = new FormData(form);
    await sendForm(formData);
  } finally {
    submitButton.disabled = false;
  }
});
```

Il blocco `finally` garantisce il ripristino anche in caso di errore.

---

## 15. Reset del form

`form.reset()` riporta i campi ai valori iniziali definiti nell'HTML.

```js
form.reset();
```

Non sempre significa "svuotare tutto": se un input aveva un valore iniziale, quel valore viene ripristinato.

---

## 16. File input

I file si leggono dal campo `files`.

```html
<input type="file" name="avatar" accept="image/*">
```

```js
const fileInput = form.elements.avatar;
const file = fileInput.files[0];

console.log(file.name);
console.log(file.type);
console.log(file.size);
```

Per upload file, usa `FormData`.

```js
const formData = new FormData(form);

await fetch("/api/avatar", {
  method: "POST",
  body: formData,
});
```

---

## 17. Sicurezza

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

## 18. Best practice

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

## 19. Errori comuni

- Dimenticare `event.preventDefault()` nel submit gestito via JS.
- Dimenticare l'attributo `name`.
- Usare `Object.fromEntries()` con checkbox multiple perdendo valori.
- Impostare `Content-Type` manualmente con `FormData`.
- Pensare che la validazione client sia sufficiente per la sicurezza.
- Non rimuovere errori creati con `setCustomValidity()`.
- Mostrare errori non accessibili.
- Non gestire doppi submit durante richieste lente.

---

## 20. Mappa mentale

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

## 21. Collegamenti

- [[Gestione Eventi]]
- [[Manipolazione del DOM]]
- [[Fetch API]]
- [[FormData]]
- [[CORS]]
- [[Sicurezza]]
- [[Web Components]]
