---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, configurazione, deploy]
aliases: [Configurazione applicativa, Application configuration]
prerequisites: [Dipendenze esplicite, Contratti impliciti ed espliciti]
related: [Logging e tracing, Gestione esplicita degli errori, Codice testabile]
---

# Configurazione applicativa

## Sintesi

La **configurazione applicativa** raccoglie valori che cambiano tra ambienti o deploy senza richiedere modifiche al codice.

Esempi: URL, credenziali, feature flag, livelli di log, timeout, limiti, nomi di code e parametri di integrazione.

## Quando usarlo

- Quando un valore cambia tra sviluppo, test, staging e produzione.
- Quando un parametro deve essere controllato dal deploy.
- Quando serve evitare costanti hardcoded.
- Quando bisogna separare comportamento applicativo e ambiente.
- Quando test e produzione richiedono dipendenze diverse.

## Come funziona

La configurazione dovrebbe essere caricata all'avvio, validata e poi passata in modo esplicito ai componenti che la usano.

Il codice interno non dovrebbe leggere variabili d'ambiente in punti casuali: questo rende comportamento e test meno prevedibili.

## API / Sintassi

```text
environment variables -> config loader -> validated config -> application services
```

Il loader traduce dati grezzi in una struttura coerente.

## Esempio pratico

```js
function loadConfig(env) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    databaseUrl: env.DATABASE_URL,
    logLevel: env.LOG_LEVEL ?? "info",
  };
}
```

La configurazione viene validata subito e resa esplicita.

## Varianti

- Variabili d'ambiente: comuni in deploy moderni.
- File di configurazione: utili per applicazioni locali o strumenti CLI.
- Secret manager: adatti a credenziali e token.
- Feature flag: utili per abilitare comportamento in modo controllato.

## Errori comuni

- Leggere `process.env` o equivalenti in ogni modulo.
- Non validare la configurazione all'avvio.
- Usare default per valori che dovrebbero essere obbligatori.
- Loggare segreti.
- Mescolare configurazione, stato runtime e dati utente.

## Checklist

- La configurazione viene validata all'avvio?
- I segreti sono gestiti separatamente?
- I default sono sicuri e intenzionali?
- I valori sono passati come dipendenze esplicite?
- Test e produzione possono usare configurazioni diverse senza cambiare codice?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Dipendenze esplicite]]
- [[Contratti impliciti ed espliciti]]
- [[Codice testabile]]
- [[Logging e tracing]]

## Fonti

- The Twelve-Factor App, *Config*
- Michael Nygard, *Release It!*
- Robert C. Martin, *Clean Architecture*
