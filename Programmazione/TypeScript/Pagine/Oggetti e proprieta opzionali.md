---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, oggetti, optional-properties, object-types]
aliases: [Oggetti e proprieta opzionali]
prerequisites: [Type Aliases e Interfaces, Tipi primitivi]
related: [Index Signatures, Type Aliases e Interfaces]
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

Una proprieta normale deve essere presente. Una proprieta opzionale puo mancare. Quando la leggi, TypeScript la considera potenzialmente `undefined`, quindi va controllata prima di usarla in modo non sicuro.

Con `exactOptionalPropertyTypes` attivo, TypeScript distingue meglio tra proprieta assente e proprieta presente con valore `undefined`.

## API / Sintassi

```ts
type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
};
```

## Esempio pratico

```ts
type MailOptions = {
  to: string;
  subject: string;
  cc?: string[];
};

function sendMail(options: MailOptions): void {
  if (options.cc?.length) {
    console.log(`CC: ${options.cc.join(", ")}`);
  }

  console.log(`To: ${options.to}`);
}
```

`cc` puo mancare, quindi viene letto con optional chaining.

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

## Checklist

- Rendere opzionale solo cio che puo davvero mancare.
- Controllare proprieta opzionali prima dell'uso.
- Preferire `null` quando l'assenza e un valore esplicito di dominio.
- Abilitare `exactOptionalPropertyTypes` nei progetti rigorosi.
- Separare tipo di input parziale e tipo di dominio completo.

## Collegamenti

- [[Type Aliases e Interfaces]]
- [[Index Signatures]]
- [[Utility Types]]
