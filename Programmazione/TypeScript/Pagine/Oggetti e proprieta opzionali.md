---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - oggetti
  - optional-properties
  - object-types
aliases:
  - Oggetti e proprieta opzionali
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Index Signatures]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
title: Oggetti e proprieta opzionali
---

# Oggetti e proprieta opzionali

## Sintesi

In TypeScript gli oggetti vengono descritti tramite la loro forma: nomi delle proprieta, tipi dei valori e proprieta richieste o opzionali.

Una proprieta opzionale si indica con `?` e rappresenta un campo che puo non essere presente nell'oggetto.

## Quando usarlo

- DTO e payload API.
- Configurazioni con valori opzionali.
- Oggetti parziali creati durante un workflow.
- Component props o opzioni di funzione.
- Dati dove alcuni campi sono disponibili solo in certi casi.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022. Una proprieta richiesta deve essere presente nel contratto; una opzionale puo mancare. La lettura di un campo opzionale e potenzialmente `undefined`.

| Dichiarazione | Assenza della chiave | Valori previsti |
| --- | --- | --- |
| `name: string` | Non ammessa | Stringa |
| `name?: string` | Ammessa | Stringa, con lettura potenzialmente undefined |
| `name: string \| undefined` | Non ammessa | Stringa oppure undefined esplicito |
| `name: string \| null` | Non ammessa | Stringa oppure null esplicito |

Con `exactOptionalPropertyTypes: true`, scrivere `{ name: undefined }` non soddisfa `name?: string`: occorre includere `undefined` nel tipo se e intenzionale. L'opzione non e inclusa automaticamente in `strict` e non elimina `undefined` dalla lettura di un campo assente.

Queste sono garanzie statiche sugli usi del codice controllato, non una validazione di JSON e non una garanzia che i campi siano proprieta proprie. Un controllo con `in` considera anche il prototipo; per la presenza propria usa `Object.hasOwn`.

## API / Sintassi

```ts
type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
};

const profile: UserProfile = { id: "u_1", email: "luca@example.com" };
const label = profile.displayName ?? profile.email;
console.log(label); // luca@example.com
```

## Esempio pratico

Questa funzione prepara una **anteprima testuale**, non invia email. Richiede dati gia tipizzati; non controlla formato degli indirizzi, consenso, header o consegna.

```ts
type MailOptions = {
  to: string;
  subject: string;
  cc?: readonly string[];
};

function formatMailPreview(options: MailOptions): string {
  const cc = options.cc ?? [];
  const ccLine = cc.length > 0 ? `\nCC: ${cc.join(", ")}` : "";
  return `To: ${options.to}\nSubject: ${options.subject}${ccLine}`;
}

const preview = formatMailPreview({
  to: "luca@example.com",
  subject: "Promemoria",
});
console.log(preview);
// To: luca@example.com
// Subject: Promemoria
```

`cc` mancante e array vuoto non producono una riga CC. L'array ricevuto non viene modificato. `options.cc?.length` e una variante per leggere la lunghezza in sicurezza, ma non valida il tipo del valore proveniente da una fonte esterna.

### Assenza, undefined e default

```ts
const absent = {};
const present = { name: undefined };
console.log(Object.hasOwn(absent, "name")); // false
console.log(Object.hasOwn(present, "name")); // true

type LabelOptions = { label?: string | null };
function resolveLabel({ label = "Predefinita" }: LabelOptions = {}): string {
  return label === null ? "Nessuna etichetta" : label;
}
console.log(resolveLabel()); // Predefinita
console.log(resolveLabel({ label: null })); // Nessuna etichetta
console.log(resolveLabel({ label: "" })); // Stringa vuota, conservata.
```

Il default della destrutturazione scatta per assenza o `undefined`, non per `null`, `false`, zero o stringa vuota. Nel tipo di questo esempio `null` ha un significato esplicito.

### Aggiornamenti parziali

`Partial<T>` rende opzionali le proprieta al primo livello; non definisce cosa significhino "non modificare", "svuotare" ed "eliminare". Un merge `{ ...current, ...patch }` con un campo `undefined` puo sovrascrivere un valore esistente, non conservarlo.

Per una PATCH definisci una convenzione: per esempio campo omesso = invariato, stringa = nuovo testo, `null` = azzeramento. Il parser e il codice di applicazione devono implementarla; non basta scegliere `Partial<T>`.

## Varianti

- **Proprieta richiesta**: `email: string`.
- **Proprieta opzionale**: `displayName?: string`.
- **Valore nullable**: `displayName: string | null`.
- **Oggetto parziale**: `Partial<User>`.
- **Oggetto readonly**: `Readonly<User>`.

## Errori comuni

- **Confondere opzionale e nullable**: `field?: string` non e uguale a `field: string | null`.
- **Usare proprieta opzionali senza controllo**: puo produrre errori runtime.
- **Rendere tutto opzionale**: il modello diventa poco affidabile.
- **Usare oggetti troppo larghi**: tipi come `{ [key: string]: any }` eliminano molta sicurezza.
- **Pensare che optional chaining validi**: protegge da null/undefined nella posizione controllata, non verifica l'intero schema.

## Checklist

- Rendere opzionale solo cio che puo davvero mancare.
- Controllare proprieta opzionali prima dell'uso.
- Preferire `null` quando l'assenza e un valore esplicito di dominio.
- Abilitare `exactOptionalPropertyTypes` nei progetti rigorosi.
- Separare tipo di input parziale e tipo di dominio completo.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Index Signatures|Index Signatures]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html), proprieta opzionali.
- [TSConfig: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).
- [TypeScript: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html), Partial.
- [MDN: Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring), valori predefiniti.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
