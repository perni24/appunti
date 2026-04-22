---
date: 2026-04-22
tags: [react, validation, zod, yup, forms, react-hook-form, frontend, javascript]
type: #permanent-note
status: budding
---

# Validazione Dati

La **validazione dati** serve a verificare che gli input dell'utente rispettino regole previste prima di essere usati o inviati al backend.

In React, questo tema e strettamente legato alla gestione dei form, ma non si limita al submit: puo influenzare UX, error state, flusso di navigazione e robustezza complessiva dell'applicazione.

> [!INFO] Punto chiave
> Validare non significa solo bloccare input sbagliati. Significa rendere esplicite le regole del dominio, comunicare errori chiari all'utente e ridurre dati inconsistenti nel sistema.

---

## 1. Perche serve

Senza validazione, un form puo inviare:
- stringhe vuote dove serve un valore obbligatorio;
- email malformate;
- password troppo corte;
- numeri fuori range;
- dati con formato incompatibile con il backend.

La validazione serve quindi a:
- migliorare l'esperienza utente;
- ridurre errori prima della request;
- mantenere il dato piu pulito;
- esplicitare vincoli del sistema.

Si collega direttamente a [[Gestione Moduli]], perche la qualita della validazione dipende anche da come il form e costruito.

---

## 2. Validazione client-side e server-side

E importante distinguere due livelli.

### Client-side validation
Avviene nel browser, prima dell'invio o durante la compilazione.

Vantaggi:
- feedback immediato;
- migliore UX;
- meno richieste inutili.

### Server-side validation
Avviene sul backend, dove il dato viene realmente accettato o rifiutato.

Vantaggi:
- sicurezza reale;
- controllo definitivo;
- protezione da richieste manipolate o client non affidabili.

> [!WARNING] Regola fondamentale
> La validazione client-side migliora UX, ma non sostituisce mai la validazione lato server.

---

## 3. Validazione imperativa

Il modo piu semplice di validare in React e scrivere condizioni manuali nel submit o negli handler.

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

Questo approccio funziona bene per casi semplici, ma presenta limiti:
- molta logica sparsa;
- regole duplicate;
- scarsa riusabilita;
- manutenzione difficile in form complessi.

---

## 4. Validazione live vs validazione al submit

La validazione puo avvenire in momenti diversi.

### Live validation
L'errore viene mostrato mentre l'utente digita o appena lascia il campo.

Vantaggi:
- feedback rapido;
- errori corretti prima del submit.

Rischi:
- UX fastidiosa se troppo aggressiva;
- rumore visivo;
- messaggi mostrati troppo presto.

### Submit validation
La validazione avviene quando l'utente prova a inviare il form.

Vantaggi:
- flusso piu semplice;
- meno disturbo durante la digitazione.

Rischi:
- feedback piu tardivo;
- maggiore frizione al momento dell'invio.

La scelta dipende dal tipo di campo e dal contesto UX.

---

## 5. Schema validation

Quando i form crescono, conviene separare le regole in uno **schema di validazione**.

Uno schema descrive:
- quali campi esistono;
- quali sono obbligatori;
- quali tipi e formati sono ammessi;
- quali vincoli devono essere rispettati.

Questo approccio rende la validazione:
- piu leggibile;
- centralizzata;
- riusabile;
- piu vicina al dominio applicativo.

---

## 6. Zod

**Zod** e una libreria molto usata per definire schemi e validare dati in modo dichiarativo.

Esempio:

```javascript
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

Vantaggi principali di Zod:
- sintassi moderna;
- schema leggibile;
- inferenza di tipi molto utile in TypeScript;
- buon allineamento tra validazione e modello dei dati.

Zod e spesso scelto in stack moderni proprio per la buona integrazione tra validazione e tipizzazione.

---

## 7. Yup

**Yup** e un'altra libreria storica molto diffusa per la schema validation.

Esempio:

```javascript
import * as yup from "yup";

const signupSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required()
});
```

Yup e stato molto usato soprattutto in combinazione con librerie per i form come Formik e continua a essere valido in molti progetti.

Rispetto a Zod, la scelta oggi dipende spesso da:
- stack gia adottato;
- preferenze del team;
- bisogno o meno di integrazione forte con TypeScript.

---

## 8. Integrazione con React Hook Form

La validazione schema-based si integra molto bene con **React Hook Form**.

Esempio concettuale:

```javascript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri")
});

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema)
  });

  function onSubmit(data) {
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Invia</button>
    </form>
  );
}
```

Questo approccio riduce molto la logica manuale distribuita nel componente.

---

## 9. Errori di validazione e UX

Una buona validazione non si limita a dire "errore".

Serve curare:
- il momento in cui il messaggio appare;
- il testo dell'errore;
- il collegamento chiaro al campo sbagliato;
- il focus sul primo campo non valido;
- coerenza tra UI e backend.

Messaggi utili:
- "Email non valida"
- "La password deve contenere almeno 8 caratteri"

Messaggi poco utili:
- "Input errato"
- "Validation failed"

La qualita dell'errore fa parte della UX del form, non e un dettaglio secondario.

---

## 10. Validazione e submit verso API

Dopo la validazione client-side, spesso il form effettua una request.

Qui si collegano:
- [[Data Fetching e Cache]];
- gestione di loading e stato di submit;
- errori restituiti dal server;
- mapping di errori backend sui campi del form.

Anche con una validazione client perfetta, il backend puo ancora rispondere con errori:
- email gia esistente;
- token scaduto;
- permessi insufficienti;
- conflitti di concorrenza.

Per questo il componente deve saper gestire sia errori locali sia errori remoti.

---

## 11. Quando usare schema validation

### Validazione manuale va bene quando
- il form e molto semplice;
- i campi sono pochi;
- le regole sono minime.

### Schema validation conviene quando
- il form cresce;
- le regole sono molte;
- vuoi riusare vincoli in piu punti;
- vuoi codice piu leggibile e manutenibile;
- usi TypeScript e vuoi migliore coerenza del modello dati.

In pratica, oltre una certa complessita, la validazione dichiarativa diventa quasi sempre la scelta piu pulita.

---

## 12. Best Practices

1. **Distingui validazione client-side e server-side:** hanno scopi diversi e servono entrambe.
2. **Non spargere regole ovunque nel componente:** centralizzare la validazione rende il codice piu chiaro.
3. **Usa schema validation per form medi e grandi:** Zod o Yup riducono duplicazione e ambiguita.
4. **Scrivi messaggi di errore comprensibili:** la validazione e anche comunicazione con l'utente.
5. **Non validare troppo presto in modo aggressivo:** il feedback immediato deve aiutare, non punire.
6. **Allinea i vincoli del frontend con quelli del backend:** differenze tra i due livelli generano frustrazione e bug.

---
