---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - validation
  - forms
  - zod
aliases:
  - Validazione Dati
  - Zod
  - Validazione Form
prerequisites:
  - "[[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]"
related:
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
  - "[[Programmazione/React/Pagine/API layer|API layer]]"
title: Validazione Dati
---

# Validazione Dati

## Sintesi

La validazione runtime verifica forma e vincoli dei dati prima di usarli. Il parsing puo anche produrre un valore normalizzato con un tipo diverso dall'input: il codice successivo deve usare l'output validato, non riprendere l'oggetto originale.

Il client migliora l'esperienza dell'utente, ma puo essere aggirato. Il server deve validare richieste e autorizzazioni indipendentemente. Gli esempi usano **Zod 4.6.7** e React 19.3.0.

## Quando usarlo

Usala ai confini: campi del form, query string, risposte API, configurazioni e storage. Anche una risposta del proprio backend puo essere incompatibile per bug o versioni disallineate.

Per pochi vincoli locali puo bastare la validazione HTML o una funzione manuale con un contratto preciso. Uno schema aiuta quando vuoi riusare vincoli, normalizzazione e struttura degli errori. TypeScript controlla il codice staticamente: un cast non controlla il JSON ricevuto.

## Come funziona

Separa quattro passaggi: lettura dell'input, normalizzazione consentita dal dominio, verifica dei vincoli, uso dell'output. `trim` puo essere corretto per un nome, ma non va applicato automaticamente a password o token.

La presenza di `@` non valida un'email. Anche `z.email()` verifica un formato secondo la propria politica, non l'esistenza della casella, la proprieta dell'indirizzo o ogni formato teoricamente ammesso dagli standard. Un flusso di conferma email e un'altra responsabilita.

I campi HTML testuali restituiscono stringhe. `z.number()` non accetta automaticamente `"2"`; `z.coerce.number()` usa la conversione JavaScript e quindi puo trasformare `""` o spazi in zero. Definisci prima quali rappresentazioni testuali ammetti.

## API / Sintassi

| API | Uso |
| --- | --- |
| `schema.parse(input)` | Output validato o eccezione `ZodError` |
| `schema.safeParse(input)` | Risultato con `success`, poi `data` oppure `error` |
| `parseAsync` / `safeParseAsync` | Necessarie se lo schema contiene trasformazioni o verifiche asincrone |
| `transform` / `pipe` | Trasforma il valore / passa l'output a un altro schema |
| `refine` | Aggiunge un vincolo, anche fra campi, indicando il percorso dell'errore |
| `z.flattenError(error)` | `formErrors` e `fieldErrors`, utile per form piatti |
| `z.treeifyError(error)` | Struttura annidata per oggetti e array complessi |

`safeParse` gestisce gli errori di validazione, non qualunque eccezione scritta dentro una tua callback o una chiamata di rete. Per validazioni asincrone considera anche risposte obsolete e race condition.

`z.object` elimina normalmente le chiavi sconosciute dall'output; `z.strictObject` le rifiuta, `z.looseObject` le conserva. Scegli la politica per il confine interessato. Eliminare campi non e autorizzare l'uso dei campi rimasti.

## Esempio pratico

Form di profilo locale, senza registrazione o invio al server. Il contratto del demo richiede nome non vuoto fino a 80 caratteri, email e anni di esperienza interi da 0 a 60. Quest'ultimo limite e una scelta dimostrativa, non una regola universale.

Installa nella cartella dell'app del progetto introduttivo:

```sh
npm install --save-exact zod@4.6.7
```

Sostituisci `src/App.jsx`:

```jsx
import { useId, useState } from "react";
import { z } from "zod";

export const ProfileSchema = z.object({
  name: z.string().trim().min(1, { error: "Inserisci il nome" })
    .max(80, { error: "Massimo 80 caratteri" }),
  email: z.string().trim().pipe(z.email({ error: "Email non valida" })),
  years: z.string().trim()
    .regex(/^(0|[1-9]\d?)$/, { error: "Usa un intero da 0 a 60" })
    .transform(Number)
    .pipe(z.number().int().min(0).max(60, { error: "Massimo 60 anni" })),
});

export function emptyProfile() {
  return { name: "", email: "", years: "" };
}

const FIELDS = [
  { name: "name", label: "Nome", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "years", label: "Anni di esperienza", type: "text", inputMode: "numeric" },
];

export default function ValidationDemo() {
  const prefix = useId();
  const [values, setValues] = useState(emptyProfile);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [saved, setSaved] = useState(null);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSummary("");
    setSaved(null);
  }

  function submit(event) {
    event.preventDefault();
    const result = ProfileSchema.safeParse(values);
    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      setErrors(fieldErrors);
      setSummary(formErrors[0] ?? "Correggi i campi indicati.");
      setSaved(null);
      const first = FIELDS.find((field) => fieldErrors[field.name]?.length);
      if (first) event.currentTarget.elements.namedItem(first.name)?.focus();
      return;
    }
    setErrors({});
    setSummary("");
    setSaved(result.data);
  }

  function reset() {
    setValues(emptyProfile());
    setErrors({});
    setSummary("");
    setSaved(null);
  }

  return (
    <main>
      <h1>Profilo locale</h1>
      <form onSubmit={submit} noValidate>
        {FIELDS.map(({ name, label, ...attributes }) => {
          const message = errors[name]?.[0];
          const id = `${prefix}-${name}`;
          return (
            <div key={name}>
              <label htmlFor={id}>{label}</label>
              <input {...attributes} id={id} name={name} required
                value={values[name]} onChange={(event) => change(name, event.target.value)}
                aria-invalid={Boolean(message)}
                aria-describedby={message ? `${id}-error` : undefined} />
              {message && <p id={`${id}-error`}>{message}</p>}
            </div>
          );
        })}
        {summary && <p role="alert">{summary}</p>}
        <button type="submit">Verifica profilo</button>
        <button type="button" onClick={reset}>Ripristina</button>
      </form>
      {saved && <p role="status">
        Profilo valido: {saved.name}; {saved.email}; esperienza: {saved.years}.
      </p>}
    </main>
  );
}
```

`noValidate` e intenzionale: consente di mostrare i messaggi Zod del demo invece di bloccare prima l'evento con i messaggi nativi. `type`, label e attributi restano utili; in un'app reale scegli consapevolmente come coordinare i due sistemi.

Prove: invia vuoto, inserisci `a@`, poi usa un'email come `ada@example.com`; verifica anni vuoti, `0`, `2.5`, `02` e `61`. Lo schema ammette `0` e `2`, ma rifiuta i decimali e gli zeri iniziali. Nome/email vengono rifilati; `years` diventa un numero nell'output. I campi conservano il testo digitato finche non premi Ripristina.

La UI mostra un riepilogo di errore, associa il messaggio al campo e porta il focus sul primo campo invalido. Le modifiche cancellano l'errore del campo, che viene ricontrollato al submit: non e una validazione a ogni battitura. Nessun dato e salvato in modo persistente.

### Vincoli fra campi e dati API

Schema indipendente, eseguibile in un modulo JavaScript con Zod installato:

```js
import { z } from "zod";

export const RangeSchema = z.object({ min: z.number(), max: z.number() })
  .refine((range) => range.min <= range.max, {
    error: "Il massimo deve essere almeno il minimo", path: ["max"],
  });

export const ApiUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export function parseApiUser(payload) {
  return ApiUserSchema.parse(payload);
}
```

Nel livello API controlla prima HTTP e JSON, poi passa il payload a `parseApiUser`. `response.json()` puo fallire prima che Zod riceva qualcosa; lo schema non controlla lo status HTTP. Gestisci le eccezioni nella query/loader o nel chiamante, senza usare un cast per ignorarle.

In TypeScript `z.input<typeof ProfileSchema>` descrive l'input e `z.output` l'output; `z.infer` corrisponde all'output. Qui `years` parte come stringa e termina come numero. Se usi React Hook Form con resolver, allinea questi tipi e le versioni dei pacchetti invece di convertire lo stesso campo due volte.

## Varianti

- **HTML nativo**: required, min/max, pattern e tipo del campo; non sostituisce i vincoli del server.
- **Funzione manuale**: adatta a contratti piccoli, con test sui casi limite; evitare regex improvvisate per formati complessi.
- **Schema**: Zod, Yup o Valibot hanno API e politiche diverse, non sono sostituzioni testuali.
- **Validazione asincrona**: unicita o altri controlli remoti, con attesa/errori e protezione da risposte obsolete. Il server deve verificare di nuovo al salvataggio.
- **Form library + resolver**: integra errori e stato del form; il demo qui usa solo React e Zod.
- **Schema condiviso**: utile tra client e server, ma il server mantiene autorizzazione, invarianti del database e controlli che non possono essere delegati al client.

## Errori comuni

- Usare solo includes("@") o assumere che un formato valido dimostri la proprieta dell'email.
- Trasformare input vuoto in zero involontariamente o normalizzare credenziali.
- Validare e poi usare l'input originale anziche `result.data`.
- Dimenticare errori globali o appiattire strutture annidate perdendo i percorsi.
- Aspettarsi che `safeParse` intercetti errori HTTP o ogni eccezione applicativa.
- Mostrare errori senza label, collegamento ARIA, focus o regole sul momento della verifica.
- Confondere validazione con sanitizzazione HTML, autenticazione o autorizzazione.

## Checklist

- Contratto, normalizzazione, vuoto e valori limite sono espliciti?
- Schema per input e schema per risposta API sono appropriati, non riusati alla cieca?
- Il codice usa l'output e gestisce gli errori del livello precedente?
- Chiavi sconosciute, errori globali e campi annidati hanno una politica?
- Validazione async e invio evitano risultati obsoleti?
- Server e database verificano vincoli e permessi indipendentemente dal client?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]

## Fonti

- [Zod: uso di base](https://zod.dev/basics), parse, safeParse e tipi input/output.
- [Zod: definire schemi](https://zod.dev/api), coercion, object, transform, pipe e refine.
- [Zod: formattare errori](https://zod.dev/error-formatting), flattenError e treeifyError.
- [Zod: personalizzare errori](https://zod.dev/error-customization), parametro error in v4.
- [MDN: validazione dei form](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation), HTML e controlli lato server.

Fonti consultate il 2026-10-15; esempio Zod 4.6.7.
