---
date: 2026-06-09
area: Programmi open source
topic: Client API Git-friendly
type: technical-note
status: "non revisionato"
difficulty: base
tags: [open-source, api, http-client, testing]
aliases: [Bruno]
prerequisites: []
related: []
---

# Bruno

## Sintesi

**Bruno** e un client open source per testare API HTTP, simile a strumenti come Postman o Insomnia, ma pensato per salvare le collection come file locali facilmente versionabili con Git.

E utile quando vuoi documentare, provare e condividere richieste API senza dipendere da un workspace cloud obbligatorio.

## Quando usarlo

- Testare endpoint REST, GraphQL o API HTTP.
- Salvare collection API dentro un repository Git.
- Condividere richieste, ambienti e variabili con un team.
- Tenere la documentazione operativa delle API vicino al codice.
- Evitare che le collection restino bloccate in un servizio cloud.

## Come funziona

Bruno organizza le richieste in collection e le salva su filesystem. Le modifiche diventano quindi normali modifiche a file, controllabili con Git, revisionabili in pull request e sincronizzabili con il repository del progetto.

## Esempio d'uso

```text
1. Crea una collection per il progetto.
2. Aggiungi una richiesta GET, POST, PUT o DELETE.
3. Configura URL, header, body e variabili ambiente.
4. Esegui la richiesta e controlla status code e risposta.
5. Versiona i file della collection insieme al progetto.
```

## Punti forti

- **Git-friendly**: le collection sono file locali.
- **Open source**: il formato non dipende da una piattaforma chiusa.
- **Adatto al team**: le richieste possono essere revisionate insieme al codice.
- **Pratico per debugging**: permette di riprodurre velocemente chiamate API.

## Limiti

- Richiede disciplina nel mantenere aggiornate le collection.
- Non sostituisce test automatici veri e propri.
- Le variabili sensibili non dovrebbero essere salvate nel repository.

## Checklist

- Separare ambienti locali, staging e produzione.
- Non committare token, password o chiavi API.
- Usare nomi chiari per collection e richieste.
- Versionare le collection insieme al codice dell'API.
- Affiancare Bruno a test automatici quando serve validazione continua.

## Collegamenti

- [[Programmi open source/Indice programmi open source]]
