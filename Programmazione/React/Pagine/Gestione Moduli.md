---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Gestione Moduli]
prerequisites: []
related: []
---
# Gestione Moduli

## Sintesi

Nota su Gestione Moduli in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

In React, la **gestione dei moduli** riguarda il modo in cui raccogliamo, validiamo e inviamo input dell'utente attraverso i form.

Rispetto all'HTML classico, React introduce un livello in piu: il form puo essere controllato direttamente dallo stato del componente oppure lasciato piu vicino al comportamento nativo del DOM.

> [!INFO] Punto chiave
> Nei form React la decisione principale e questa: il valore degli input deve vivere nello stato React oppure nel DOM? Da questa scelta dipende gran parte dell'architettura del form.

---

## 1. Controlled Components

Un **controlled component** e un input il cui valore e controllato da React tramite stato.

```javascript
function LoginForm() {
  const [email, setEmail] = useState("");

  return (
    <input
      type="email"
      value={email}
      onChange={event => setEmail(event.target.value)}
    />
  );
}
```

Qui il valore dell'input:
- viene letto da React;
- viene aggiornato con `onChange`;
- vive nello stato del componente.

Questo pattern rende il flusso dei dati molto esplicito ed e coerente con [[Programmazione/React/Pagine/useState]] e con il modello dichiarativo di React.

---

## 2. Vantaggi dei controlled components

I controlled components sono utili quando vuoi:
- validare mentre l'utente scrive;
- mostrare errori dinamici;
- trasformare il valore in tempo reale;
- sincronizzare piu input tra loro;
- avere logica condizionale basata sul contenuto del form.

Esempio:

```javascript
function SearchForm() {
  const [query, setQuery] = useState("");

  return (
    <form>
      <input
        value={query}
        onChange={event => setQuery(event.target.value.trimStart())}
      />
    </form>
  );
}
```

Il vantaggio principale e il controllo completo.

---

## 3. Limiti dei controlled components

Il controllo totale ha anche un costo:
- piu boilerplate;
- un render ad ogni input change;
- gestione manuale di molti campi;
- piu complessita in form grandi.

Con pochi campi non e un problema. Con form lunghi, dinamici o ad alte prestazioni, puo diventare rumoroso e meno ergonomico.

Per questo nell'ecosistema React esistono strategie piu leggere.

---

## 4. Uncontrolled Components

Un **uncontrolled component** lascia che sia il DOM a mantenere il valore corrente dell'input.

In questo caso React non aggiorna lo stato ad ogni battitura.

```javascript
function LoginForm() {
  const emailRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    console.log(emailRef.current.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" ref={emailRef} />
      <button type="submit">Invia</button>
    </form>
  );
}
```

Qui il valore viene letto solo quando serve, tipicamente al submit.

Questo approccio si collega a [[Programmazione/React/Pagine/useRef]] piu che a `useState`.

---

## 5. Controlled vs Uncontrolled

| Caratteristica | Controlled | Uncontrolled |
| :--- | :--- | :--- |
| **Dove vive il valore** | Stato React | DOM |
| **Controllo del flusso** | Alto | Piu basso |
| **Boilerplate** | Maggiore | Minore |
| **Validazione live** | Piu semplice | Meno naturale |
| **Prestazioni su form grandi** | Potenzialmente piu costoso | Spesso piu leggero |

La scelta non e ideologica. Dipende dal caso d'uso.

---

## 6. Gestione del submit

In React, un form viene quasi sempre gestito intercettando il submit:

```javascript
function ContactForm() {
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    console.log({ name });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={event => setName(event.target.value)}
      />
      <button type="submit">Invia</button>
    </form>
  );
}
```

`event.preventDefault()` evita il comportamento nativo di reload della pagina e lascia a React il controllo del flusso.

Qui si collega bene anche [[Programmazione/React/Pagine/React Router]] se il submit porta a navigazione, redirect o pagina successiva.

---

## 7. Validazione di base

Un form reale deve quasi sempre gestire:
- campi obbligatori;
- formato email;
- lunghezza minima;
- conferma password;
- messaggi di errore.

Esempio semplice:

```javascript
function SignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.includes("@")) {
      setError("Email non valida");
      return;
    }

    setError("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={event => setEmail(event.target.value)}
      />
      {error && <p>{error}</p>}
    </form>
  );
}
```

Questo funziona, ma in form articolati tende a generare molto codice ripetitivo.

---

## 8. React Hook Form

**React Hook Form** e una libreria molto usata per semplificare la gestione dei form in React.

Il suo obiettivo e ridurre boilerplate, evitare render non necessari e gestire meglio registrazione dei campi, errori e submit.

Esempio concettuale:

```javascript
import { useForm } from "react-hook-form";

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  function onSubmit(data) {
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("email", { required: "Email obbligatoria" })}
      />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">Invia</button>
    </form>
  );
}
```

Vantaggi principali:
- meno boilerplate;
- buona performance;
- API pensata per i form;
- gestione integrata di errori e submit;
- facile integrazione con validazione schema-based.

---

## 9. Perche React Hook Form e spesso preferito

React Hook Form adotta un approccio pragmatico:
- usa bene i meccanismi del DOM;
- evita di rendere controlled ogni input per forza;
- mantiene un'API ergonomica lato React.

Questo lo rende adatto a:
- form medi e grandi;
- wizard multi-step;
- dashboard amministrative;
- form con campi dinamici;
- scenari con validazione articolata.

In molti progetti moderni e la scelta standard, soprattutto quando il form non e banale.

---

## 10. Form state e architettura

Un errore comune e trattare ogni form come stato globale.

Nella maggior parte dei casi:
- i valori del form restano locali al componente;
- non vanno messi subito in uno store globale;
- non servono in [[Programmazione/React/Pagine/State Management Esterno]] finche non devono essere condivisi davvero.

Il form state e spesso **UI state locale**, non stato globale applicativo.

Solo in casi specifici ha senso centralizzarlo:
- salvataggio multi-step condiviso tra piu schermate;
- bozza persistente;
- workflow complessi distribuiti.

---

## 11. Relazione con validazione e data fetching

La gestione moduli si collega spesso a:
- validazione dei dati, anche tramite schema;
- [[Programmazione/React/Pagine/Data Fetching e Cache]] se il submit chiama API;
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController]] se vuoi gestire richieste annullabili;
- UX di loading, success ed error state.

Un buon form non raccoglie solo input: coordina anche feedback, invio e stato della richiesta.

---

## 12. Best Practices

1. **Usa controlled components quando serve controllo fine sul valore:** validazione live, trasformazioni e dipendenze tra campi.
2. **Non rendere controlled ogni input per principio:** nei form grandi puo introdurre molto boilerplate inutile.
3. **Usa React Hook Form quando il form cresce di complessita:** riduce codice ripetitivo e migliora ergonomia.
4. **Tieni il form state locale finche non esiste un motivo reale per globalizzarlo:** e la scelta piu semplice e robusta.
5. **Separa raccolta input, validazione e submit:** mischiare tutto nello stesso blocco rende il codice fragile.
6. **Progetta bene gli stati UX del form:** loading, errori, successo e disable del submit fanno parte del componente quanto gli input stessi.

---
