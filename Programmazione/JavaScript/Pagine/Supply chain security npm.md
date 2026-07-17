---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: operational-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - npm
  - sicurezza
aliases: []
prerequisites: []
related: []
---

# Supply chain security npm

## Sintesi

La **supply chain security npm** riguarda i rischi introdotti da dipendenze, transitive dependencies, script di installazione e pacchetti malevoli nell'ecosistema JavaScript.

## Quando usarlo

Questa nota serve ogni volta che installi, aggiorni o pubblichi pacchetti npm, soprattutto in progetti usati in produzione.

Il rischio cresce quando:

- il progetto ha molte dipendenze transitive;
- usi script di installazione;
- il pacchetto gira in CI o su server;
- pubblichi librerie riusabili;
- aggiorni dipendenze senza revisione.

## Come funziona

### Concetto chiave
Un progetto JavaScript puo importare migliaia di pacchetti indiretti. Ogni pacchetto puo eseguire codice in fase di build, installazione o runtime.
### Rischi principali
- Pacchetti compromessi.
- Typosquatting.
- Dependency confusion.
- Script `postinstall` malevoli.
- Versioni transitive aggiornate senza controllo.
### Pratiche utili
```powershell
npm audit
npm ci
```

- Usare lockfile versionati.
- Preferire `npm ci` in CI.
- Ridurre dipendenze inutili.
- Controllare manutenzione e reputazione dei pacchetti.
- Limitare token npm e segreti in CI.

## API / Sintassi

Comandi utili:

```powershell
npm ci
npm audit
npm outdated
npm ls
```

In CI preferisci `npm ci` a `npm install`, perche usa il lockfile in modo riproducibile.

Per installare evitando script quando vuoi ridurre il rischio:

```powershell
npm install --ignore-scripts
```

Questa opzione puo rompere pacchetti che dipendono legittimamente da script di build, quindi va verificata caso per caso.

## Esempio pratico

### Procedura
1. Controlla il nome del pacchetto e il registry prima di installare.
2. Leggi manutenzione, repository, frequenza di release e dipendenze.
3. Installa e verifica la modifica nel lockfile.
4. Esegui test e build.
5. Usa audit o scanning in CI.
6. Per pacchetti critici, aggiorna in branch separato e rivedi il changelog.

## Varianti

- **Dipendenza diretta compromessa**: pacchetto installato esplicitamente diventa malevolo.
- **Dipendenza transitiva compromessa**: problema nascosto in un pacchetto indiretto.
- **Typosquatting**: nome simile a un pacchetto noto.
- **Dependency confusion**: risoluzione errata tra registry pubblico e privato.
- **Script di installazione malevoli**: codice eseguito durante `install`.
- **Token npm rubati**: pubblicazione non autorizzata di versioni compromesse.

## Errori comuni

- Aggiornare tutto senza leggere changelog.
- Ignorare lockfile.
- Installare pacchetti con nomi simili a librerie famose.

## Checklist

- Usa lockfile e commit del lockfile.
- Controlla pacchetti nuovi prima di installarli.
- Riduci dipendenze non necessarie.
- Aggiorna con changelog e test, non alla cieca.
- Esegui audit e strumenti di scanning in CI.
- Proteggi token npm con permessi minimi e autenticazione forte.
- Evita script di installazione quando non necessari.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
