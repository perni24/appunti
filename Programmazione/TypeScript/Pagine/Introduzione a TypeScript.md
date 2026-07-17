---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, javascript, type-system, frontend, backend]
aliases: [Introduzione a TypeScript]
prerequisites: []
related: [Tipi primitivi, Variabili e annotazioni di tipo, Inferenza dei tipi]
---

# Introduzione a TypeScript

## Sintesi

TypeScript e un superset di JavaScript che aggiunge un sistema di tipi statico. Il codice TypeScript viene controllato dal compilatore e poi trasformato in JavaScript eseguibile da browser, Node.js o altri runtime JavaScript.

Il punto importante e che TypeScript non cambia il runtime di JavaScript: aiuta a trovare errori prima dell'esecuzione, documenta meglio le forme dei dati e rende piu sicuri refactor e codebase grandi.

## Quando usarlo

- Progetti JavaScript medio-grandi.
- Frontend con React, Vue, Angular o framework simili.
- Backend Node.js con API e modelli dati complessi.
- Librerie pubbliche che devono esporre API chiare.
- Codebase dove refactor, onboarding e manutenzione sono importanti.

## Come funziona

TypeScript analizza il codice e prova a capire quali valori possono circolare in ogni punto del programma. Se una funzione si aspetta una stringa e riceve un numero, il compilatore segnala un errore prima del runtime.

Il risultato finale e comunque JavaScript. Tipi, interfacce e annotazioni servono al compilatore e agli strumenti di sviluppo, ma normalmente non esistono piu nel codice emesso.

## API / Sintassi

```ts
function greet(name: string): string {
  return `Ciao ${name}`;
}

const message = greet("Luca");
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

function canAccessAdminPanel(user: User): boolean {
  return user.isAdmin;
}

const user = {
  id: "u_1",
  email: "luca@example.com",
  isAdmin: false,
};

canAccessAdminPanel(user);
```

Qui il tipo `User` descrive la forma minima richiesta dalla funzione. Se manca `isAdmin` o il valore non e booleano, TypeScript segnala il problema.

## Varianti

- **JavaScript puro**: nessun controllo statico, piu flessibile ma meno protetto.
- **TypeScript strict**: configurazione piu rigorosa, consigliata per nuovi progetti.
- **JSDoc con type checking**: usa commenti nei file JavaScript senza convertire tutto in `.ts`.

## Errori comuni

- **Pensare che TypeScript validi i dati a runtime**: i tipi spariscono dopo la compilazione. Per input esterni serve validazione runtime.
- **Usare `any` per evitare errori**: disattiva il valore principale del linguaggio.
- **Tipizzare tutto esplicitamente**: spesso l'inferenza e migliore e riduce rumore.
- **Ignorare `strict`**: senza configurazione rigorosa molti errori restano possibili.

## Checklist

- Abilitare `strict` nei nuovi progetti.
- Usare tipi per API, dati di dominio e confini tra moduli.
- Lasciare al compilatore l'inferenza locale quando e chiara.
- Validare a runtime input provenienti da rete, file, form o database.
- Ricordare che TypeScript controlla il codice, non sostituisce i test.

## Collegamenti

- [[Tipi primitivi]]
- [[Variabili e annotazioni di tipo]]
- [[Inferenza dei tipi]]
- [[any, unknown e never]]
