---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - configurazione
  - deploy
aliases:
  - Configurazione applicativa
  - Application configuration
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Logging e tracing]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Configurazione applicativa
---

# Configurazione applicativa

## Sintesi

La configurazione traduce valori del deploy in dati che l'applicazione può usare. In Node le variabili d'ambiente presenti sono **stringhe**: `"false"` non è il booleano `false`. Carica e valida i valori prima di aprire la porta del server, poi passa ai componenti solo quello che serve.

## Come funziona

Stabilisci per ogni chiave se è obbligatoria, quali valori ammette e quando applicare un default. In questo servizio di esempio:

| Chiave | Assente | Presente ma vuota o non valida |
| --- | --- | --- |
| `DATABASE_URL` | Avvio rifiutato | Avvio rifiutato; ammessi URL PostgreSQL con host |
| `PORT` | Porta 3000 | Avvio rifiutato; ammessi interi decimali da 1 a 65535 |
| `LOG_LEVEL` | Livello `info` | Avvio rifiutato; valori ammessi nell'esempio sotto |

## Esempio pratico

```js
function loadConfig(env) {
  let database;
  try {
    database = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL: atteso un URL PostgreSQL con host");
  }
  if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.hostname) {
    throw new Error("DATABASE_URL: atteso un URL PostgreSQL con host");
  }

  const rawPort = env.PORT ?? "3000";
  const port = Number(rawPort);
  if (!/^[0-9]+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT: atteso un intero da 1 a 65535");
  }
  const logLevel = env.LOG_LEVEL ?? "info";
  if (!["debug", "info", "warn", "error"].includes(logLevel)) {
    throw new Error("LOG_LEVEL: usare debug, info, warn o error");
  }
  return Object.freeze({ databaseUrl: database.href, port, logLevel });
}
```

Il punto di avvio chiama `loadConfig(process.env)`; un test passa un oggetto con le stesse stringhe. `PORT="3000x"` non è la porta 3000, e `LOG_LEVEL=""` non chiede il default. Il controllo dell'URL verifica solo il formato scelto dal servizio: non verifica credenziali, raggiungibilità o presenza del database.

## Errori comuni

Non stampare l'intera configurazione: l'URL può contenere una password. L'errore indica **la chiave e il formato atteso**, non il valore ricevuto. Non usare un default di sviluppo per una dipendenza obbligatoria. Se aggiungi un flag booleano, confrontalo esplicitamente con `"true"` e `"false"` e rifiuta gli altri valori.

## Checklist

Documenta la provenienza e la precedenza se combini file, ambiente e secret manager. Prova almeno avvio valido, default per chiave assente e rifiuto della stessa chiave presente ma vuota. Una modifica a runtime richiede una politica di ricaricamento separata.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Logging e tracing|Logging e tracing]]

## Fonti

- The Twelve-Factor App, *Config*
- Michael Nygard, *Release It!*
- Robert C. Martin, *Clean Architecture*
- [Node.js: variabili d'ambiente e valori testuali](https://nodejs.org/api/environment_variables.html)
- [The Twelve-Factor App: configurazione](https://12factor.net/config)
